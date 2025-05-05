'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Define Product Type
interface Product {
  id: string;
  image: string; // Keep image URL for simplicity, could be file upload later
  title: string;
  price: number;
  discount: number | null;
  category: string;
  rating: number; // Rating might be managed elsewhere (reviews) but keep for structure
  description: string;
  stock: number; // Add stock quantity
}

// Mock product data (replace with actual API calls/state management)
const initialProducts: Product[] = [
  { id: '1', image: 'https://picsum.photos/300/200?random=1', title: 'Stylish T-Shirt', price: 25.99, discount: 10, category: 'Apparel', rating: 4.5, description: 'Comfy cotton tee.', stock: 100 },
  { id: '2', image: 'https://picsum.photos/300/200?random=2', title: 'Wireless Headphones', price: 79.99, discount: null, category: 'Electronics', rating: 4.8, description: 'Noise-cancelling.', stock: 50 },
  { id: '3', image: 'https://picsum.photos/300/200?random=3', title: 'Coffee Maker', price: 45.00, discount: 5, category: 'Home Goods', rating: 4.2, description: 'Brews 12 cups.', stock: 75 },
  // Add more mock products if needed
];

// Define the empty product structure for adding new products
const emptyProduct: Omit<Product, 'id' | 'rating'> = {
    image: '',
    title: '',
    price: 0,
    discount: null,
    category: '',
    description: '',
    stock: 0,
};


export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Omit<Product, 'id' | 'rating'> | Product>(emptyProduct);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For dialog save/delete operations
  const { toast } = useToast();

  // Derived state for filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.includes(searchTerm)
    );
  }, [products, searchTerm]);

  // --- Dialog Handlers ---

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setCurrentProduct(product);
      setIsEditing(true);
    } else {
      setCurrentProduct(emptyProduct); // Reset for adding
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    // Short delay allows the dialog to close before resetting state, preventing flicker
    setTimeout(() => {
        setCurrentProduct(emptyProduct);
        setIsEditing(false);
    }, 150);
  };

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericFields = ['price', 'discount', 'stock'];
    setCurrentProduct(prev => ({
        ...prev,
        [name]: numericFields.includes(name) ? (value === '' ? null : Number(value)) : value,
    }));
};


  const handleSaveProduct = async () => {
      setIsLoading(true);
      // Input validation (basic example)
      if (!currentProduct.title || currentProduct.price <= 0 || currentProduct.stock < 0 || !currentProduct.category) {
            toast({ variant: "destructive", title: "Validation Error", description: "Please fill in Title, Category, Price (>0), and Stock (>=0)." });
            setIsLoading(false);
            return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
          if (isEditing && 'id' in currentProduct) {
            // --- Update Product ---
            setProducts(prev => prev.map(p => p.id === (currentProduct as Product).id ? (currentProduct as Product) : p));
            toast({ title: "Product Updated", description: `"${currentProduct.title}" has been updated.` });
          } else {
            // --- Add New Product ---
            const newProduct: Product = {
              ...currentProduct,
              id: `prod-${Date.now()}`, // Generate a simple unique ID
              rating: 0, // Default rating for new products
            };
            setProducts(prev => [newProduct, ...prev]); // Add to the beginning of the list
            toast({ title: "Product Added", description: `"${newProduct.title}" has been added.` });
          }
          handleCloseDialog(); // Close dialog on success
      } catch (error) {
           console.error("Error saving product:", error);
           toast({ variant: "destructive", title: "Error", description: "Could not save product." });
      } finally {
          setIsLoading(false);
      }
  };

  // --- Delete Handler ---

  const handleDeleteProduct = async (productId: string) => {
      setIsLoading(true); // Use isLoading for the delete confirmation action
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
          setProducts(prev => prev.filter(p => p.id !== productId));
          toast({ title: "Product Deleted", description: `Product ID ${productId} has been removed.` });
          // No need to close an alert dialog manually here if using AlertDialogAction
      } catch (error) {
          console.error("Error deleting product:", error);
          toast({ variant: "destructive", title: "Error", description: "Could not delete product." });
      } finally {
         // setIsLoading(false); // AlertDialogAction handles closing, no need to manage loading state after action for it specifically unless you want visual feedback *during* deletion outside the dialog.
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Manage Products</h2>
        <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-grow">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input
                    placeholder="Search by name, category, ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                 />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Product
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                <DialogTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                <DialogDescription>
                    {isEditing ? `Update details for "${(currentProduct as Product).title}".` : 'Fill in the details for the new product.'}
                </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* Form Fields */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">Title</Label>
                        <Input id="title" name="title" value={currentProduct.title} onChange={handleInputChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">Category</Label>
                        <Input id="category" name="category" value={currentProduct.category} onChange={handleInputChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">Price ($)</Label>
                        <Input id="price" name="price" type="number" step="0.01" min="0" value={currentProduct.price} onChange={handleInputChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="discount" className="text-right">Discount (%)</Label>
                        <Input id="discount" name="discount" type="number" min="0" max="100" value={currentProduct.discount ?? ''} onChange={handleInputChange} className="col-span-3" placeholder="e.g., 10 (leave blank for none)" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="stock" className="text-right">Stock</Label>
                        <Input id="stock" name="stock" type="number" min="0" step="1" value={currentProduct.stock} onChange={handleInputChange} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="image" className="text-right">Image URL</Label>
                        <Input id="image" name="image" value={currentProduct.image} onChange={handleInputChange} className="col-span-3" placeholder="https://example.com/image.jpg" />
                    </div>
                     <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="description" className="text-right pt-2">Description</Label>
                        <Textarea id="description" name="description" value={currentProduct.description} onChange={handleInputChange} className="col-span-3 min-h-[100px]" />
                    </div>
                </div>
                <DialogFooter>
                   <DialogClose asChild>
                       <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                   </DialogClose>
                    <Button type="button" onClick={handleSaveProduct} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isEditing ? 'Save Changes' : 'Add Product'}
                    </Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>
        </div>
      </div>

      {/* Products Table */}
      <Card>
         <Table>
            <TableHeader>
            <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-center">Actions</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.id.substring(0, 8)}...</TableCell> {/* Shorten ID display */}
                    <TableCell>{product.title}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="text-right">
                        ${product.price.toFixed(2)}
                        {product.discount && <span className="ml-1 text-xs text-destructive">(-{product.discount}%)</span>}
                    </TableCell>
                     <TableCell className="text-right">{product.stock}</TableCell>
                    <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(product)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                         </Button>

                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                 <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                     <Trash2 className="h-4 w-4" />
                                     <span className="sr-only">Delete</span>
                                 </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the product
                                    "{product.title}".
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => handleDeleteProduct(product.id)}
                                    disabled={isLoading}
                                    className="bg-destructive hover:bg-destructive/90"
                                >
                                     {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Delete
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                         </AlertDialog>
                    </div>
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        No products found{searchTerm ? ' matching your search' : ''}.
                    </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
      </Card>

    </div>
  );
}

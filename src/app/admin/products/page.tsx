'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, Search, Loader2, Image as ImageIcon, Star } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { IProduct } from '@/models/Product';
import type { ICategory } from '@/models/Category'; // Import ICategory
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";


// Define Product Type for frontend state, category can be populated or just an ID
type ProductData = Omit<IProduct, 'category' | 'createdAt' | 'updatedAt'> & {
    _id: string;
    category: string | ICategory; // Store category ID as string for form, or populated object for display
    createdAt?: Date; // Optional because not on emptyProduct
    updatedAt?: Date; // Optional
};

const emptyProduct: Omit<ProductData, '_id' | 'createdAt' | 'updatedAt' | 'rating'> = {
    image: '',
    title: '',
    price: 0,
    discount: null,
    category: '', // Will store category ID
    subcategory: '',
    description: '',
    stock: 0,
    features: [],
};


export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [availableCategories, setAvailableCategories] = useState<ICategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Omit<ProductData, '_id' | 'createdAt' | 'updatedAt' | 'rating'> | ProductData>(emptyProduct);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(''); // For managing subcategory dropdown
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogLoading, setIsDialogLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProductsAndCategories = async () => {
    setIsLoading(true);
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch(`/api/products?searchQuery=${encodeURIComponent(searchTerm)}&limit=100&populate=category`),
        fetch('/api/categories')
      ]);

      if (!productsResponse.ok) throw new Error('Failed to fetch products');
      if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');

      const productsData = await productsResponse.json();
      const categoriesData = await categoriesResponse.json();

      setProducts(Array.isArray(productsData.products) ? productsData.products : []);
      setAvailableCategories(Array.isArray(categoriesData.categories) ? categoriesData.categories : []);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({ variant: "destructive", title: "Error", description: error.message || "Could not load data." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleOpenDialog = (product?: ProductData) => {
    if (product) {
      const categoryId = typeof product.category === 'string' ? product.category : product.category._id;
      setCurrentProduct({
        ...product,
        category: categoryId, // Ensure category is ID for the form
        features: product.features || []
      });
      setSelectedCategoryId(categoryId);
      setIsEditing(true);
    } else {
      setCurrentProduct({ ...emptyProduct, features: [] });
      setSelectedCategoryId('');
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setTimeout(() => {
      setCurrentProduct(emptyProduct);
      setSelectedCategoryId('');
      setIsEditing(false);
    }, 150);
  };

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericFields = ['price', 'discount', 'stock'];

    if (name === 'features') {
         const featuresArray = value.split(',').map(f => f.trim()).filter(f => f !== '');
         setCurrentProduct(prev => ({ ...prev, features: featuresArray }));
         return;
    }
    setCurrentProduct(prev => ({
        ...prev,
        [name]: numericFields.includes(name) ? (value === '' ? null : Number(value)) : value,
    }));
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setCurrentProduct(prev => ({
        ...prev,
        category: categoryId,
        subcategory: '', // Reset subcategory when category changes
    }));
  };

  const handleSubcategoryChange = (subcategoryName: string) => {
      setCurrentProduct(prev => ({
          ...prev,
          subcategory: subcategoryName,
      }));
  };

  const handleSaveProduct = async () => {
    setIsDialogLoading(true);
    const productToSave = {
        ...currentProduct,
        category: selectedCategoryId, // Ensure category is the ID
    };

    // Basic Client-Side Validation
    if (!productToSave.title || !productToSave.category || !productToSave.image || !productToSave.description || productToSave.price == null || productToSave.price < 0 || productToSave.stock == null || productToSave.stock < 0) {
        toast({ variant: "destructive", title: "Validation Error", description: "Please fill in Title, Category, Image URL, Description, Price (>=0), and Stock (>=0)." });
        setIsDialogLoading(false);
        return;
    }
    if (productToSave.discount != null && (productToSave.discount < 0 || productToSave.discount > 100)) {
        toast({ variant: "destructive", title: "Validation Error", description: "Discount must be between 0 and 100, or leave blank." });
        setIsDialogLoading(false);
        return;
    }
    // Validate subcategory if selected category has subcategories and one is required
    const chosenCategoryObj = availableCategories.find(c => c._id === selectedCategoryId);
    if (chosenCategoryObj && chosenCategoryObj.subcategories.length > 0 && !productToSave.subcategory) {
        // If you want to make subcategory mandatory when available, add validation here.
        // For now, let's assume it's optional.
    }


    try {
        let response;
        let successMessage = '';
        const productDataToSend = {
            ...productToSave,
            features: Array.isArray(productToSave.features) ? productToSave.features : []
        };

        if (isEditing && '_id' in productToSave) {
            response = await fetch(`/api/products/${(productToSave as ProductData)._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productDataToSend),
            });
            successMessage = `"${productToSave.title}" has been updated.`;
        } else {
            const { _id, ...newProductData } = productDataToSend as any;
            response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProductData),
            });
            successMessage = `"${productToSave.title}" has been added.`;
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save product');
        }
        // Re-fetch to get updated list with populated category
        await fetchProductsAndCategories();
        toast({ title: isEditing ? "Product Updated" : "Product Added", description: successMessage });
        handleCloseDialog();
    } catch (error: any) {
        console.error("Error saving product:", error);
        toast({ variant: "destructive", title: "Error", description: error.message || "Could not save product." });
    } finally {
        setIsDialogLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string, productTitle: string) => {
    setIsDeleting(productId);
    try {
        const response = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete product');
        }
        setProducts(prev => prev.filter(p => p._id !== productId));
        toast({ title: "Product Deleted", description: `Product "${productTitle}" has been removed.` });
    } catch (error: any) {
        console.error("Error deleting product:", error);
        toast({ variant: "destructive", title: "Error", description: error.message || "Could not delete product." });
    } finally {
        setIsDeleting(null);
    }
  };

   const featuresToString = (features: string[] | undefined | null): string => {
        if (!Array.isArray(features)) return '';
        return features.join(', ');
   };

   const currentSubcategories = useMemo(() => {
        if (!selectedCategoryId) return [];
        const cat = availableCategories.find(c => c._id === selectedCategoryId);
        return cat ? cat.subcategories : [];
   }, [selectedCategoryId, availableCategories]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Manage Products</h2>
        <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-grow">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full bg-background"
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
                    {isEditing ? `Update details for "${(currentProduct as ProductData).title}".` : 'Fill in the details for the new product.'}
                 </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="grid grid-cols-4 items-center gap-4">
                         <Label htmlFor="title" className="text-right">Title</Label>
                         <Input id="title" name="title" value={currentProduct.title} onChange={handleInputChange} className="col-span-3" />
                     </div>

                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">Category</Label>
                        <Select
                            value={selectedCategoryId}
                            onValueChange={handleCategoryChange}
                            disabled={isDialogLoading}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableCategories.map(cat => (
                                    <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                     </div>

                    {selectedCategoryId && currentSubcategories.length > 0 && (
                         <div className="grid grid-cols-4 items-center gap-4">
                             <Label htmlFor="subcategory" className="text-right">Subcategory</Label>
                             <Select
                                 value={currentProduct.subcategory || ''}
                                 onValueChange={handleSubcategoryChange}
                                 disabled={isDialogLoading || !selectedCategoryId}
                             >
                                 <SelectTrigger className="col-span-3">
                                     <SelectValue placeholder="Select a subcategory" />
                                 </SelectTrigger>
                                 <SelectContent>
                                     {currentSubcategories.map(subcat => (
                                         <SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>
                                     ))}
                                 </SelectContent>
                             </Select>
                         </div>
                     )}


                     <div className="grid grid-cols-4 items-center gap-4">
                         <Label htmlFor="price" className="text-right">Price ($)</Label>
                         <Input id="price" name="price" type="number" step="0.01" min="0" value={currentProduct.price ?? ''} onChange={handleInputChange} className="col-span-3" />
                     </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                         <Label htmlFor="discount" className="text-right">Discount (%)</Label>
                         <Input id="discount" name="discount" type="number" min="0" max="100" value={currentProduct.discount ?? ''} onChange={handleInputChange} className="col-span-3" placeholder="e.g., 10 (leave blank for none)" />
                     </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="stock" className="text-right">Stock</Label>
                        <Input id="stock" name="stock" type="number" min="0" step="1" value={currentProduct.stock ?? 0} onChange={handleInputChange} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                         <Label htmlFor="image" className="text-right">Image URL</Label>
                         <Input id="image" name="image" value={currentProduct.image} onChange={handleInputChange} className="col-span-3" placeholder="https://example.com/image.jpg" />
                     </div>
                     <div className="grid grid-cols-4 items-start gap-4">
                         <Label htmlFor="description" className="text-right pt-2">Description</Label>
                         <Textarea id="description" name="description" value={currentProduct.description} onChange={handleInputChange} className="col-span-3 min-h-[100px]" />
                     </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                         <Label htmlFor="features" className="text-right pt-2">Features</Label>
                         <Textarea id="features" name="features" value={featuresToString(currentProduct.features)} onChange={handleInputChange} className="col-span-3 min-h-[80px]" placeholder="Comma-separated, e.g., Feature 1, Feature 2" />
                     </div>
                </div>
                <DialogFooter>
                   <DialogClose asChild>
                       <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isDialogLoading}>Cancel</Button>
                   </DialogClose>
                    <Button type="button" onClick={handleSaveProduct} disabled={isDialogLoading}>
                        {isDialogLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isEditing ? 'Save Changes' : 'Add Product'}
                    </Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>
        </div>
      </div>

      <Card>
         <Table>
            <TableHeader>
            <TableRow>
                <TableHead className="w-[60px]">Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Subcategory</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
             {isLoading ? (
                 [...Array(5)].map((_, i) => (
                    <TableRow key={`skel-${i}`}>
                        <TableCell><Skeleton className="h-10 w-10 rounded bg-muted" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-3/4 bg-muted" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24 bg-muted" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20 bg-muted" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto bg-muted" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto bg-muted" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20 bg-muted" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-8 w-20 mx-auto bg-muted" /></TableCell>
                    </TableRow>
                 ))
             ) : products.length > 0 ? (
                products.map((product) => {
                    const categoryDisplay = typeof product.category === 'object' && product.category !== null ? (product.category as ICategory).name : 'N/A';
                    return (
                 <TableRow key={product._id}>
                      <TableCell>
                           <Image
                                src={product.image || '/placeholder.svg'}
                                alt={product.title}
                                width={40}
                                height={40}
                                className="w-10 h-10 object-cover rounded border"
                                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                           />
                      </TableCell>
                    <TableCell className="font-medium">{product.title}</TableCell>
                    <TableCell>{categoryDisplay}</TableCell>
                    <TableCell>{product.subcategory || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                        ${product.price.toFixed(2)}
                        {product.discount && product.discount > 0 && <span className="ml-1 text-xs text-destructive">(-{product.discount}%)</span>}
                    </TableCell>
                     <TableCell className="text-right">{product.stock}</TableCell>
                      <TableCell>
                          <Badge variant={product.stock > 0 ? 'default' : 'destructive'}
                                 className={product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                          </Badge>
                      </TableCell>
                    <TableCell className="text-center">
                    <div className="flex justify-center gap-1">
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(product)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                         </Button>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                 <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled={isDeleting === product._id}>
                                     {isDeleting === product._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
                                <AlertDialogCancel disabled={isDeleting === product._id}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                     onClick={() => handleDeleteProduct(product._id, product.title)}
                                     disabled={isDeleting === product._id}
                                     className="bg-destructive hover:bg-destructive/90"
                                >
                                      {isDeleting === product._id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                     Delete
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                         </AlertDialog>
                    </div>
                    </TableCell>
                 </TableRow>
                    );
                })
            ) : (
                <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
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

const PlaceholderSvg = () => (
    <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="bg-muted text-muted-foreground">
        <rect width="100" height="100" rx="8"/>
        <ImageIcon stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" transform="scale(0.5) translate(50 50)" />
    </svg>
);
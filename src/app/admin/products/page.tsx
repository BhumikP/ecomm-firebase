// src/app/admin/products/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, Search, Loader2, ImageIcon, Star, Palette } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { IProduct, IProductColor } from '@/models/Product'; // Import IProduct and IProductColor
import type { ICategory } from '@/models/Category';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";


// Define ProductColor for frontend state
type ProductColorData = Omit<IProductColor, '_id' | 'id'> & { // Omit mongoose specific subdocument _id
    name: string;
    hexCode?: string;
    imageIndex: number;
    stock?: number;
};

// Define Product Type for frontend state
type ProductData = Omit<IProduct, 'category' | 'createdAt' | 'updatedAt' | 'colors' | '_id'> & {
    _id: string;
    category: string | ICategory; // Store category ID as string for form, or populated object for display
    images: string[]; // Array of image URLs
    colors: ProductColorData[]; // Array of color variants
    createdAt?: Date;
    updatedAt?: Date;
};


const emptyProduct: Omit<ProductData, '_id' | 'createdAt' | 'updatedAt' | 'rating'> = {
    image: '', // Primary image
    images: [],
    title: '',
    price: 0,
    discount: null,
    category: '',
    subcategory: '',
    description: '',
    stock: 0, // Overall stock
    features: [],
    colors: [],
};


export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [availableCategories, setAvailableCategories] = useState<ICategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Omit<ProductData, '_id' | 'createdAt' | 'updatedAt' | 'rating'> | ProductData>(emptyProduct);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogLoading, setIsDialogLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  // State for raw text input for images and colors
  const [imagesInput, setImagesInput] = useState(''); // URLs, one per line
  const [colorsInput, setColorsInput] = useState(''); // CSV like: Name,Hex,ImageIndex,Stock (one per line)

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

      setProducts(Array.isArray(productsData.products) ? productsData.products.map(p => ({...p, colors: p.colors || []})) : []);
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
        category: categoryId,
        features: product.features || [],
        images: product.images || [],
        colors: product.colors || [],
      });
      setImagesInput((product.images || []).join('\n'));
      setColorsInput(
        (product.colors || []).map(c => `${c.name},${c.hexCode || ''},${c.imageIndex},${c.stock ?? ''}`).join('\n')
      );
      setSelectedCategoryId(categoryId);
      setIsEditing(true);
    } else {
      setCurrentProduct({ ...emptyProduct, features: [], images: [], colors: [] });
      setImagesInput('');
      setColorsInput('');
      setSelectedCategoryId('');
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setTimeout(() => {
      setCurrentProduct(emptyProduct);
      setImagesInput('');
      setColorsInput('');
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
        subcategory: '',
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

    const parsedImages = imagesInput.split('\n').map(url => url.trim()).filter(url => url.length > 0 && (url.startsWith('http://') || url.startsWith('https://')));
    if (parsedImages.length === 0 && (!currentProduct.image || currentProduct.image.trim() === '')) {
        toast({ variant: "destructive", title: "Validation Error", description: "At least one valid image URL is required." });
        setIsDialogLoading(false);
        return;
    }
    const primaryImageToSave = parsedImages.length > 0 ? parsedImages[0] : currentProduct.image;


    const parsedColors: ProductColorData[] = colorsInput
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map((line, lineIndex) => {
            const parts = line.split(',');
            const name = parts[0]?.trim();
            const hexCode = parts[1]?.trim() || undefined;
            const imageIndex = parseInt(parts[2], 10);
            const stockVal = parts[3]?.trim();
            const stock = stockVal !== '' && stockVal !== undefined ? parseInt(stockVal, 10) : undefined;

            if (!name) {
                toast({ variant: "destructive", title: "Color Validation Error", description: `Color name is missing on line ${lineIndex + 1}.` });
                throw new Error("Invalid color data");
            }
            if (isNaN(imageIndex) || imageIndex < 0 || imageIndex >= parsedImages.length) {
                 toast({ variant: "destructive", title: "Color Validation Error", description: `Invalid Image Index for color "${name}" on line ${lineIndex+1}. Must be between 0 and ${parsedImages.length -1}.` });
                 throw new Error("Invalid color data");
            }
             if (stock !== undefined && isNaN(stock)) {
                 toast({ variant: "destructive", title: "Color Validation Error", description: `Invalid Stock for color "${name}" on line ${lineIndex+1}. Must be a number or blank.`});
                 throw new Error("Invalid color data");
             }

            return { name, hexCode, imageIndex, stock };
        });


    const productToSave = {
        ...currentProduct,
        image: primaryImageToSave, // Main image
        images: parsedImages,     // All images
        colors: parsedColors,     // Parsed colors
        category: selectedCategoryId,
        features: Array.isArray(currentProduct.features) ? currentProduct.features : [],
    };


    // Basic Client-Side Validation
    if (!productToSave.title || !productToSave.category || !productToSave.image || !productToSave.description || productToSave.price == null || productToSave.price < 0 || productToSave.stock == null || productToSave.stock < 0) {
        toast({ variant: "destructive", title: "Validation Error", description: "Please fill in Title, Category, Primary Image URL, Description, Price (>=0), and Stock (>=0)." });
        setIsDialogLoading(false);
        return;
    }
    if (productToSave.discount != null && (productToSave.discount < 0 || productToSave.discount > 100)) {
        toast({ variant: "destructive", title: "Validation Error", description: "Discount must be between 0 and 100, or leave blank." });
        setIsDialogLoading(false);
        return;
    }
    const chosenCategoryObj = availableCategories.find(c => c._id === selectedCategoryId);
    if (chosenCategoryObj && chosenCategoryObj.subcategories.length > 0 && !productToSave.subcategory) {
        // Optional: Make subcategory mandatory if available
    }


    try {
        let response;
        let successMessage = '';

        if (isEditing && '_id' in productToSave) {
            response = await fetch(`/api/products/${(productToSave as ProductData)._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productToSave),
            });
            successMessage = `"${productToSave.title}" has been updated.`;
        } else {
            const { _id, ...newProductData } = productToSave as any; // _id is not part of new product
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
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                 <DialogTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                 <DialogDescription>
                    {isEditing ? `Update details for "${(currentProduct as ProductData).title}".` : 'Fill in the details for the new product.'}
                 </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     {/* Standard fields */}
                     <div className="grid grid-cols-4 items-center gap-4">
                         <Label htmlFor="title" className="text-right">Title</Label>
                         <Input id="title" name="title" value={currentProduct.title} onChange={handleInputChange} className="col-span-3" />
                     </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">Category</Label>
                        <Select value={selectedCategoryId} onValueChange={handleCategoryChange} disabled={isDialogLoading}>
                            <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a category" /></SelectTrigger>
                            <SelectContent>{availableCategories.map(cat => (<SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>))}</SelectContent>
                        </Select>
                     </div>
                    {selectedCategoryId && currentSubcategories.length > 0 && (
                         <div className="grid grid-cols-4 items-center gap-4">
                             <Label htmlFor="subcategory" className="text-right">Subcategory</Label>
                             <Select value={currentProduct.subcategory || ''} onValueChange={handleSubcategoryChange} disabled={isDialogLoading || !selectedCategoryId}>
                                 <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a subcategory" /></SelectTrigger>
                                 <SelectContent>{currentSubcategories.map(subcat => (<SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>))}</SelectContent>
                             </Select>
                         </div>
                     )}
                     <div className="grid grid-cols-4 items-center gap-4">
                         <Label htmlFor="price" className="text-right">Price ($)</Label>
                         <Input id="price" name="price" type="number" step="0.01" min="0" value={currentProduct.price ?? ''} onChange={handleInputChange} className="col-span-3" />
                     </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                         <Label htmlFor="discount" className="text-right">Discount (%)</Label>
                         <Input id="discount" name="discount" type="number" min="0" max="100" value={currentProduct.discount ?? ''} onChange={handleInputChange} className="col-span-3" placeholder="e.g., 10 (blank for none)" />
                     </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="stock" className="text-right">Overall Stock</Label>
                        <Input id="stock" name="stock" type="number" min="0" step="1" value={currentProduct.stock ?? 0} onChange={handleInputChange} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-start gap-4">
                         <Label htmlFor="description" className="text-right pt-2">Description</Label>
                         <Textarea id="description" name="description" value={currentProduct.description} onChange={handleInputChange} className="col-span-3 min-h-[100px]" />
                     </div>
                     <div className="grid grid-cols-4 items-start gap-4">
                         <Label htmlFor="features" className="text-right pt-2">Features</Label>
                         <Textarea id="features" name="features" value={featuresToString(currentProduct.features)} onChange={handleInputChange} className="col-span-3 min-h-[80px]" placeholder="Comma-separated" />
                     </div>

                    {/* Image URLs Input */}
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="images" className="text-right pt-2">Image URLs</Label>
                        <Textarea
                            id="images"
                            name="images"
                            value={imagesInput}
                            onChange={(e) => setImagesInput(e.target.value)}
                            className="col-span-3 min-h-[100px]"
                            placeholder="One image URL per line. The first will be the primary image."
                        />
                    </div>
                     <p className="col-span-4 text-xs text-muted-foreground pl-[calc(25%+1rem)]">
                        Ensure URLs are valid (start with http:// or https://).
                    </p>

                    {/* Color Variants Input */}
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="colors" className="text-right pt-2">Color Variants</Label>
                        <Textarea
                            id="colors"
                            name="colors"
                            value={colorsInput}
                            onChange={(e) => setColorsInput(e.target.value)}
                            className="col-span-3 min-h-[100px]"
                            placeholder="One per line: ColorName,HexCode(#RRGGBB),ImageIndex,Stock (e.g., Red,#FF0000,0,10). HexCode & Stock are optional."
                        />
                    </div>
                    <p className="col-span-4 text-xs text-muted-foreground pl-[calc(25%+1rem)]">
                        ImageIndex refers to the line number in 'Image URLs' (0-based). Leave stock blank to use overall stock.
                    </p>

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
                <TableHead>Colors</TableHead>
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
                        <TableCell><Skeleton className="h-5 w-20 bg-muted" /></TableCell> {/* Colors column skeleton */}
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
                                src={product.image || '/placeholder.svg'} // Use primary image
                                alt={product.title}
                                width={40}
                                height={40}
                                className="w-10 h-10 object-cover rounded border"
                                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                                data-ai-hint="product admin list image"
                           />
                      </TableCell>
                    <TableCell className="font-medium">{product.title}</TableCell>
                    <TableCell>{categoryDisplay}</TableCell>
                    <TableCell>{product.subcategory || 'N/A'}</TableCell>
                     <TableCell>
                        {product.colors && product.colors.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                                {product.colors.slice(0, 3).map((color, idx) => ( // Show max 3 colors, add "..." if more
                                    <Badge key={idx} variant="outline" style={color.hexCode ? { backgroundColor: color.hexCode, color: getContrastColor(color.hexCode) } : {}}>
                                        {color.name}
                                    </Badge>
                                ))}
                                {product.colors.length > 3 && <Badge variant="outline">...</Badge>}
                            </div>
                        ) : <span className="text-xs text-muted-foreground">None</span>}
                    </TableCell>
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
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground"> {/* Adjusted colSpan */}
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

// Helper function to get contrasting text color for a given background hex color
function getContrastColor(hexcolor: string | undefined): string {
    if (!hexcolor) return '#000000'; // Default to black if no hexcode
    hexcolor = hexcolor.replace("#", "");
    const r = parseInt(hexcolor.substring(0, 2), 16);
    const g = parseInt(hexcolor.substring(2, 4), 16);
    const b = parseInt(hexcolor.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
}

const PlaceholderSvg = () => (
    <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="bg-muted text-muted-foreground">
        <rect width="100" height="100" rx="8"/>
        <ImageIcon stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" transform="scale(0.5) translate(50 50)" />
    </svg>
);

// src/app/admin/products/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, Search, Loader2, ImageIcon, Star, Palette, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { IProduct } from '@/models/Product'; // Base IProduct
import type { ICategory } from '@/models/Category';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";


// Define ProductColor for frontend state
interface ProductColorFormData {
    _id?: string; // For existing colors, to help identify them if needed during update
    name: string;
    hexCode?: string;
    imageIndicesString: string; // e.g., "0;1;2" - will be parsed to number[]
    stock?: number;
}

// Define Product Type for frontend state, using ProductColorFormData
type ProductFormData = Omit<IProduct, 'category' | 'createdAt' | 'updatedAt' | 'colors' | '_id'> & {
    _id?: string; // Optional for new products
    category: string; // Category ID
    images: string[]; // URLs
    colors: ProductColorFormData[]; // Use ProductColorFormData
    createdAt?: Date;
    updatedAt?: Date;
};


const emptyProduct: Omit<ProductFormData, '_id' | 'createdAt' | 'updatedAt' | 'rating'> = {
    image: '', // This will be derived from images[0]
    images: [],
    title: '',
    price: 0,
    discount: null,
    category: '',
    subcategory: '',
    description: '',
    stock: 0,
    features: [],
    colors: [], // Start with no colors
};


export default function AdminProductsPage() {
  const [products, setProducts] = useState<IProduct[]>([]); // Use IProduct from model for fetched products
  const [availableCategories, setAvailableCategories] = useState<ICategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // currentProduct state now uses ProductFormData for the dialog
  const [currentProduct, setCurrentProduct] = useState<ProductFormData | Omit<ProductFormData, '_id' | 'createdAt' | 'updatedAt' | 'rating'>>(emptyProduct);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogLoading, setIsDialogLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const [imagesInput, setImagesInput] = useState('');
  // Removed colorsInput state, colors are now managed directly in currentProduct.colors


  const fetchProductsAndCategories = async () => {
    setIsLoading(true);
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch(`/api/products?searchQuery=${encodeURIComponent(searchTerm)}&limit=100&populate=category`),
        fetch('/api/categories')
      ]);

      if (!productsResponse.ok) {
        const errorText = await productsResponse.text();
        console.error("Failed to fetch products. Status:", productsResponse.status, "Response:", errorText);
        throw new Error(`Failed to fetch products. Status: ${productsResponse.status}`);
      }
      if (!categoriesResponse.ok) {
        const errorText = await categoriesResponse.text();
        console.error("Failed to fetch categories. Status:", categoriesResponse.status, "Response:", errorText);
        throw new Error(`Failed to fetch categories. Status: ${categoriesResponse.status}`);
      }

      const productsData = await productsResponse.json();
      const categoriesData = await categoriesResponse.json();

      setProducts(Array.isArray(productsData.products) ? productsData.products.map((p: IProduct) => ({...p, _id: p._id.toString(), colors: p.colors || []})) : []);
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

  const handleOpenDialog = (product?: IProduct) => { // Takes IProduct
    if (product) {
      const categoryId = typeof product.category === 'string' ? product.category : (product.category as ICategory)._id;
      setCurrentProduct({ // Convert IProduct to ProductFormData
        ...product,
        _id: product._id.toString(),
        category: categoryId,
        images: product.images || [],
        features: product.features || [],
        colors: (product.colors || []).map(c => ({
            _id: c._id?.toString(),
            name: c.name,
            hexCode: c.hexCode,
            imageIndicesString: (c.imageIndices || []).join(';'),
            stock: c.stock,
        })),
      });
      setImagesInput((product.images || []).join('\n'));
      setSelectedCategoryId(categoryId);
      setIsEditing(true);
    } else {
      setCurrentProduct({ ...emptyProduct, features: [], images: [], colors: [] });
      setImagesInput('');
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

  // Color management functions
  const handleAddColor = () => {
      setCurrentProduct(prev => ({
          ...prev,
          colors: [...prev.colors, { name: '', imageIndicesString: '', hexCode: '#000000', stock: undefined }]
      }));
  };

  const handleRemoveColor = (index: number) => {
      setCurrentProduct(prev => ({
          ...prev,
          colors: prev.colors.filter((_, i) => i !== index)
      }));
  };

  const handleColorFieldChange = (index: number, field: keyof ProductColorFormData, value: string | number | undefined) => {
      setCurrentProduct(prev => ({
          ...prev,
          colors: prev.colors.map((color, i) =>
              i === index ? { ...color, [field]: value } : color
          )
      }));
  };


  const handleSaveProduct = async () => {
    setIsDialogLoading(true);

    const parsedImages = imagesInput.split('\n').map(url => url.trim()).filter(url => url.length > 0 && (url.startsWith('http://') || url.startsWith('https://')));
    if (parsedImages.length === 0 && (!currentProduct.image || currentProduct.image.trim() === '')) {
        toast({ variant: "destructive", title: "Validation Error", description: "At least one valid image URL is required in the 'Image URLs' section." });
        setIsDialogLoading(false);
        return;
    }
    const primaryImageToSave = parsedImages.length > 0 ? parsedImages[0] : currentProduct.image;


    // Validate and parse colors from currentProduct.colors
    const finalColors = [];
    for (let i = 0; i < currentProduct.colors.length; i++) {
        const colorForm = currentProduct.colors[i];
        if (!colorForm.name || colorForm.name.trim() === '') {
            toast({ variant: "destructive", title: "Color Validation Error", description: `Color name is required for color variant #${i + 1}.` });
            setIsDialogLoading(false); return;
        }

        const imageIndices = colorForm.imageIndicesString.split(';')
            .map(s => s.trim())
            .filter(s => s !== '')
            .map(s => parseInt(s, 10));

        if (imageIndices.length === 0) {
            toast({ variant: "destructive", title: "Color Validation Error", description: `At least one Image Index is required for color "${colorForm.name}".` });
            setIsDialogLoading(false); return;
        }

        for (const imageIndex of imageIndices) {
            if (isNaN(imageIndex) || !Number.isInteger(imageIndex) || imageIndex < 0 || imageIndex >= parsedImages.length) {
                toast({ variant: "destructive", title: "Color Validation Error", description: `Invalid Image Index "${imageIndex}" for color "${colorForm.name}". Must be between 0 and ${parsedImages.length - 1}.` });
                setIsDialogLoading(false); return;
            }
        }
         if (colorForm.stock !== undefined && (isNaN(Number(colorForm.stock)) || Number(colorForm.stock) < 0)) {
             toast({ variant: "destructive", title: "Color Validation Error", description: `Invalid Stock for color "${colorForm.name}". Must be a non-negative number or blank.`});
             setIsDialogLoading(false); return;
         }
        finalColors.push({
            name: colorForm.name.trim(),
            hexCode: colorForm.hexCode?.trim() || undefined,
            imageIndices: imageIndices,
            stock: colorForm.stock !== undefined ? Number(colorForm.stock) : undefined,
            ...(colorForm._id && { _id: colorForm._id }) // Include _id if it exists (for updates)
        });
    }


    const productToSave = {
        ...currentProduct,
        image: primaryImageToSave,
        images: parsedImages,
        colors: finalColors, // Use the parsed and validated colors
        category: selectedCategoryId,
        features: Array.isArray(currentProduct.features) ? currentProduct.features : [],
    };


    if (!productToSave.title || !productToSave.category || !productToSave.description || productToSave.price == null || productToSave.price < 0 || productToSave.stock == null || productToSave.stock < 0) {
        toast({ variant: "destructive", title: "Validation Error", description: "Please fill in Title, Category, Description, Price (>=0), and Stock (>=0)." });
        setIsDialogLoading(false);
        return;
    }
     if (!productToSave.image) { // Check specifically for primary image after derivation
        toast({ variant: "destructive", title: "Validation Error", description: "A primary image is required. Ensure the first URL in 'Image URLs' is valid or add at least one image." });
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
        // toast({ variant: "destructive", title: "Validation Error", description: "Please select a subcategory." });
        // setIsDialogLoading(false); return;
    }


    try {
        let response;
        let successMessage = '';
        const payload = { ...productToSave };
        // If it's a new product, don't send an _id field that might be empty from `emptyProduct`
        if (!isEditing || !payload._id) {
            delete payload._id;
        }


        if (isEditing && payload._id) {
            response = await fetch(`/api/products/${payload._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            successMessage = `"${payload.title}" has been updated.`;
        } else {
            response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            successMessage = `"${payload.title}" has been added.`;
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
                    {isEditing ? `Update details for "${(currentProduct as ProductFormData).title}".` : 'Fill in the details for the new product.'}
                 </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-4 py-4"> {/* Changed to grid for one item per line */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" name="title" value={currentProduct.title} onChange={handleInputChange} className="w-full" disabled={isDialogLoading} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={selectedCategoryId} onValueChange={handleCategoryChange} disabled={isDialogLoading}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="Select a category" /></SelectTrigger>
                            <SelectContent>{availableCategories.map(cat => (<SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>))}</SelectContent>
                        </Select>
                    </div>
                    {selectedCategoryId && currentSubcategories.length > 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="subcategory">Subcategory</Label>
                            <Select value={currentProduct.subcategory || ''} onValueChange={handleSubcategoryChange} disabled={isDialogLoading || !selectedCategoryId}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Select a subcategory (optional)" /></SelectTrigger>
                                <SelectContent>{currentSubcategories.map(subcat => (<SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="price">Price ($)</Label>
                        <Input id="price" name="price" type="number" step="0.01" min="0" value={currentProduct.price ?? ''} onChange={handleInputChange} disabled={isDialogLoading}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="discount">Discount (%)</Label>
                        <Input id="discount" name="discount" type="number" min="0" max="100" value={currentProduct.discount ?? ''} onChange={handleInputChange} placeholder="e.g., 10 or leave blank" disabled={isDialogLoading}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="stock">Overall Stock</Label>
                        <Input id="stock" name="stock" type="number" min="0" step="1" value={currentProduct.stock ?? 0} onChange={handleInputChange} disabled={isDialogLoading}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" value={currentProduct.description} onChange={handleInputChange} className="w-full min-h-[100px]" disabled={isDialogLoading}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="features">Features (Comma-separated)</Label>
                        <Textarea id="features" name="features" value={featuresToString(currentProduct.features)} onChange={handleInputChange} className="w-full min-h-[80px]" placeholder="Feature 1, Feature 2" disabled={isDialogLoading}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="images">Image URLs (One per line)</Label>
                        <Textarea
                            id="images"
                            name="images"
                            value={imagesInput}
                            onChange={(e) => setImagesInput(e.target.value)}
                            className="w-full min-h-[100px]"
                            placeholder="https://example.com/image1.jpg
https://example.com/image2.jpg"
                            disabled={isDialogLoading}
                        />
                        <p className="text-xs text-muted-foreground">
                            The first URL will be the primary image. Ensure URLs are valid (start with http:// or https://).
                        </p>
                    </div>

                    {/* Color Variants Section */}
                    <div className="space-y-4 border p-4 rounded-md">
                        <Label className="text-base font-semibold">Color Variants</Label>
                        {currentProduct.colors.map((color, index) => (
                            <div key={index} className="space-y-3 border-b pb-3 last:border-b-0">
                                <div className="flex justify-between items-center">
                                     <Label htmlFor={`colorName-${index}`} className="text-sm font-medium">Color Variant #{index + 1}</Label>
                                     <Button variant="ghost" size="icon" onClick={() => handleRemoveColor(index)} disabled={isDialogLoading} className="h-7 w-7 text-destructive hover:text-destructive">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label htmlFor={`colorName-${index}`} className="text-xs">Name</Label>
                                        <Input id={`colorName-${index}`} value={color.name} onChange={(e) => handleColorFieldChange(index, 'name', e.target.value)} placeholder="e.g., Ocean Blue" disabled={isDialogLoading}/>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor={`colorHex-${index}`} className="text-xs">Hex Code</Label>
                                        <div className="flex items-center gap-2">
                                            <Input id={`colorHex-${index}`} type="text" value={color.hexCode || ''} onChange={(e) => handleColorFieldChange(index, 'hexCode', e.target.value)} placeholder="#1A2B3C (Optional)" className="flex-grow" disabled={isDialogLoading}/>
                                            <Input type="color" value={color.hexCode || '#000000'} onChange={(e) => handleColorFieldChange(index, 'hexCode', e.target.value)} className="p-0 h-8 w-8 border-none rounded-md" disabled={isDialogLoading}/>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor={`colorImageIndices-${index}`} className="text-xs">Image Indices (Semicolon-separated)</Label>
                                    <Input id={`colorImageIndices-${index}`} value={color.imageIndicesString} onChange={(e) => handleColorFieldChange(index, 'imageIndicesString', e.target.value)} placeholder="e.g., 0;1;2" disabled={isDialogLoading}/>
                                    <p className="text-xs text-muted-foreground">0-based index from 'Image URLs' list above.</p>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor={`colorStock-${index}`} className="text-xs">Stock for this color (Optional)</Label>
                                    <Input id={`colorStock-${index}`} type="number" min="0" value={color.stock ?? ''} onChange={(e) => handleColorFieldChange(index, 'stock', e.target.value === '' ? undefined : parseInt(e.target.value, 10))} placeholder="Leave blank for overall stock" disabled={isDialogLoading}/>
                                </div>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={handleAddColor} disabled={isDialogLoading}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Color Variant
                        </Button>
                         <p className="text-xs text-muted-foreground">
                            Each color can be linked to specific images using their line number (0-based) from the 'Image URLs' list.
                        </p>
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
                 <TableRow key={product._id.toString()}>
                      <TableCell>
                           <Image
                                src={product.image || '/placeholder.svg'}
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
                                {product.colors.slice(0, 3).map((color, idx) => (
                                    <Badge key={color._id?.toString() || idx} variant="outline" style={color.hexCode ? { backgroundColor: color.hexCode, color: getContrastColor(color.hexCode) } : {}}>
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
                                     onClick={() => handleDeleteProduct(product._id.toString(), product.title)}
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
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
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

function getContrastColor(hexcolor: string | undefined): string {
    if (!hexcolor) return '#000000'; // Default to black text for undefined/empty hex
    hexcolor = hexcolor.replace("#", "");
    if (hexcolor.length === 3) { // Handle shorthand hex (e.g., #RGB)
        hexcolor = hexcolor.split('').map(char => char + char).join('');
    }
    if (hexcolor.length !== 6) {
        return '#000000'; // Invalid hex, default to black
    }
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

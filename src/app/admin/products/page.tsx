
// src/app/admin/products/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
// ReactQuill and its CSS import removed

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from "@/components/ui/textarea"; // Textarea imported
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, Search, Loader2, Star, Palette, X, UploadCloud, Image as LucideImage, Zap } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { IProduct, IProductColor } from '@/models/Product';
import type { ICategory } from '@/models/Category';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

// ReactQuill dynamic import removed

interface ProductColorFormData {
    _id?: string;
    name: string;
    hexCode?: string;
    imageUrls: string[];
    stock: number;
}

type ProductFormData = Omit<IProduct, 'category' | 'createdAt' | 'updatedAt' | 'colors' | '_id'> & {
    _id?: string;
    category: string;
    colors: ProductColorFormData[];
    thumbnailUrl: string;
    minOrderQuantity: number;
    isTopBuy?: boolean;
    isNewlyLaunched?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
};

interface FetchedProduct extends Omit<IProduct, 'category' | 'colors' | '_id'> {
  _id: string;
  category: ICategory;
  colors: IProductColor[];
  minOrderQuantity: number;
  thumbnailUrl: string;
  isTopBuy?: boolean;
  isNewlyLaunched?: boolean;
}

const emptyProduct: Omit<ProductFormData, '_id' | 'createdAt' | 'updatedAt' | 'rating' > = {
    thumbnailUrl: '',
    title: '',
    price: 0,
    discount: null,
    category: '',
    subcategory: '',
    description: '',
    stock: 0,
    features: [],
    colors: [],
    minOrderQuantity: 1,
    isTopBuy: false,
    isNewlyLaunched: false,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<FetchedProduct[]>([]);
  const [availableCategories, setAvailableCategories] = useState<ICategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<ProductFormData | Omit<ProductFormData, '_id' | 'createdAt' | 'updatedAt' | 'rating'>>(emptyProduct);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogLoading, setIsDialogLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [uploadingColorImages, setUploadingColorImages] = useState<Record<string, boolean>>({});
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);


  const { toast } = useToast();

    const handleImageUpload = async (file: File): Promise<string | null> => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            if (response.ok && result.success) {
                return result.url;
            } else {
                toast({ variant: "destructive", title: "Upload Failed", description: result.message || "Could not upload image." });
                return null;
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Upload Error", description: (err as Error).message || "An error occurred while uploading." });
            return null;
        }
    };

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

      setProducts(Array.isArray(productsData.products) ? productsData.products.map((p: FetchedProduct) => ({...p, minOrderQuantity: p.minOrderQuantity || 1, isTopBuy: p.isTopBuy || false, isNewlyLaunched: p.isNewlyLaunched || false})) : []);
      setAvailableCategories(Array.isArray(categoriesData.categories) ? categoriesData.categories : []);

    } catch (error: any) {
      // console.error('Error fetching data:', error); // Removed
      toast({ variant: "destructive", title: "Error", description: error.message || "Could not load data." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
  }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenDialog = (product?: FetchedProduct) => {
    if (product) {
      const categoryId = typeof product.category === 'string' ? product.category : (product.category as ICategory)._id;
      setCurrentProduct({
        ...product,
        _id: product._id.toString(),
        category: categoryId,
        thumbnailUrl: product.thumbnailUrl,
        features: product.features || [],
        colors: (product.colors || []).map(c => ({
            _id: c._id?.toString(),
            name: c.name,
            hexCode: c.hexCode,
            imageUrls: c.imageUrls || [],
            stock: c.stock,
        })),
        stock: product.stock,
        minOrderQuantity: product.minOrderQuantity || 1,
        isTopBuy: product.isTopBuy || false,
        isNewlyLaunched: product.isNewlyLaunched || false,
      });
      setSelectedCategoryId(categoryId);
      setIsEditing(true);
    } else {
      setCurrentProduct({ ...emptyProduct, features: [], colors: [], minOrderQuantity: 1, thumbnailUrl: '', isTopBuy: false, isNewlyLaunched: false });
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
      setIsUploadingThumbnail(false);
      setUploadingColorImages({});
    }, 150);
  };

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
         setCurrentProduct(prev => ({
            ...(prev as ProductFormData),
            [name]: checked,
        }));
    } else {
        const numericFields = ['price', 'discount', 'stock', 'minOrderQuantity'];
        if (name === 'features') {
             setCurrentProduct(prev => ({ ...prev as ProductFormData, features: value.split(',').map(f => f.trim()).filter(f => f) }));
        } else {
            setCurrentProduct(prev => ({
                ...(prev as ProductFormData),
                [name]: numericFields.includes(name) ? (value === '' ? (name === 'discount' ? null : 0) : Number(value)) : value,
            }));
        }
    }
  };

  // handleDescriptionChange removed as ReactQuill is removed. handleInputChange will handle Textarea.

  const handleThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setIsUploadingThumbnail(true);
        const uploadedUrl = await handleImageUpload(file);
        if (uploadedUrl) {
            setCurrentProduct(prev => ({ ...prev as ProductFormData, thumbnailUrl: uploadedUrl }));
        }
        setIsUploadingThumbnail(false);
    }
  };


  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setCurrentProduct(prev => ({ ...(prev as ProductFormData), category: categoryId, subcategory: '' }));
  };

  const handleSubcategoryChange = (subcategoryName: string) => {
      setCurrentProduct(prev => ({ ...(prev as ProductFormData), subcategory: subcategoryName }));
  };

  const handleAddColor = () => {
      setCurrentProduct(prev => ({ ...(prev as ProductFormData), colors: [...prev.colors, { name: '', imageUrls: [], stock: 0 }]} as any));
  };

  const handleRemoveColor = (index: number) => {
      setCurrentProduct(prev => ({ ...(prev as ProductFormData), colors: prev.colors.filter((_, i) => i !== index) }));
  };

  const handleColorFieldChange = (index: number, field: keyof ProductColorFormData, value: string | number) => {
      setCurrentProduct(prev => ({
          ...(prev as ProductFormData),
          colors: prev.colors.map((color, i) => i === index ? { ...color, [field]: value } : color)
      }));
  };

  const handleAddNewFilesToColor = async (colorIndex: number, files: FileList | null | undefined) => {
    if (!files || files.length === 0) return;

    const productData = currentProduct as ProductFormData;
    const newImageUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadKey = `${colorIndex}-new-${productData.colors[colorIndex].imageUrls.length + i}`;
        setUploadingColorImages(prev => ({ ...prev, [uploadKey]: true }));
        const uploadedUrl = await handleImageUpload(file);
        if (uploadedUrl) {
            newImageUrls.push(uploadedUrl);
        }
        setUploadingColorImages(prev => ({ ...prev, [uploadKey]: false }));
    }

    if (newImageUrls.length > 0) {
        setCurrentProduct(prev => {
            const currentProductData = prev as ProductFormData;
            const updatedColors = [...currentProductData.colors];
            if (updatedColors[colorIndex]) {
                updatedColors[colorIndex] = {
                    ...updatedColors[colorIndex],
                    imageUrls: [...updatedColors[colorIndex].imageUrls, ...newImageUrls]
                };
            }
            return { ...currentProductData, colors: updatedColors };
        });
    }
  };

  const handleRemoveUploadedColorImage = (colorIndex: number, imageUrlToRemove: string) => {
    setCurrentProduct(prev => {
        const productData = prev as ProductFormData;
        const updatedColors = [...productData.colors];
        if (updatedColors[colorIndex]) {
            updatedColors[colorIndex] = {
                ...updatedColors[colorIndex],
                imageUrls: updatedColors[colorIndex].imageUrls.filter(url => url !== imageUrlToRemove)
            };
        }
        return { ...productData, colors: updatedColors };
    });
  };

  const handleSaveProduct = async () => {
    setIsDialogLoading(true);
    const productData = currentProduct as ProductFormData;

    if (!productData.title || !productData.category || !productData.description || productData.price == null || productData.price < 0) {
        toast({ variant: "destructive", title: "Validation Error", description: "Title, Category, Description, and Price (>=0) are required." });
        setIsDialogLoading(false); return;
    }
    if (!productData.thumbnailUrl || productData.thumbnailUrl.trim() === '') {
        toast({ variant: "destructive", title: "Validation Error", description: "A primary Thumbnail is required. Please upload one." });
        setIsDialogLoading(false); return;
    }
    if (productData.discount != null && (productData.discount < 0 || productData.discount > 100)) {
        toast({ variant: "destructive", title: "Validation Error", description: "Discount must be 0-100 or blank." });
        setIsDialogLoading(false); return;
    }
     if (productData.minOrderQuantity == null || productData.minOrderQuantity < 1) {
        toast({ variant: "destructive", title: "Validation Error", description: "Min Order Qty must be at least 1." });
        setIsDialogLoading(false); return;
    }

    let finalStock = 0;
    let finalColors: ProductColorFormData[] = [];

    if (productData.colors && productData.colors.length > 0) {
        for (const colorForm of productData.colors) {
            if (!colorForm.name || colorForm.name.trim() === '') {
                toast({ variant: "destructive", title: "Color Validation", description: "Color name is required for all variants." });
                setIsDialogLoading(false); return;
            }
            if (colorForm.imageUrls.length === 0) {
                 toast({ variant: "destructive", title: "Color Validation", description: `At least one image is required for color "${colorForm.name}".` });
                 setIsDialogLoading(false); return;
            }
            if (colorForm.stock === undefined || colorForm.stock === null || Number(colorForm.stock) < 0) {
                toast({ variant: "destructive", title: "Color Validation", description: `Stock for color "${colorForm.name}" must be a non-negative number.` });
                setIsDialogLoading(false); return;
            }
            finalColors.push({
                _id: colorForm._id,
                name: colorForm.name.trim(),
                hexCode: colorForm.hexCode?.trim() || undefined,
                imageUrls: colorForm.imageUrls,
                stock: Number(colorForm.stock)
            });
            finalStock += Number(colorForm.stock);
        }
    } else {
        if (productData.stock == null || productData.stock < 0) {
            toast({ variant: "destructive", title: "Validation Error", description: "Overall Stock required if no colors are added." });
            setIsDialogLoading(false); return;
        }
        finalStock = productData.stock;
    }

    const productToSave = {
        ...productData,
        colors: finalColors,
        category: selectedCategoryId,
        thumbnailUrl: productData.thumbnailUrl.trim(),
        stock: finalStock,
        minOrderQuantity: productData.minOrderQuantity,
        isTopBuy: typeof productData.isTopBuy === 'boolean' ? productData.isTopBuy : false,
        isNewlyLaunched: typeof productData.isNewlyLaunched === 'boolean' ? productData.isNewlyLaunched : false,
    };

    let finalPayload: any;
    if (isEditing && productData._id) {
        finalPayload = { ...productToSave };
        if (productData._id) finalPayload._id = productData._id;
    } else {
        const { _id, ...restOfProductToSave } = productToSave;
        finalPayload = restOfProductToSave;
    }


    try {
        let response;
        if (isEditing && finalPayload._id) {
            response = await fetch(`/api/products/${finalPayload._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalPayload) });
        } else {
            response = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalPayload) });
        }

        if (!response.ok) {
            const errorData = await response.json();
            // console.error("Error saving product:", errorData); // Removed
            throw new Error(errorData.message || 'Failed to save product');
        }
        await fetchProductsAndCategories();
        toast({ title: isEditing ? "Product Updated" : "Product Added" });
        handleCloseDialog();
    } catch (error: any) {
        // console.error("Error in handleSaveProduct:", error); // Removed
        toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setIsDialogLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string, productTitle: string) => {
    setIsDeleting(productId);
    try {
        const response = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error( (await response.json()).message || 'Failed to delete product');
        setProducts(prev => prev.filter(p => p._id !== productId));
        toast({ title: "Product Deleted", description: `"${productTitle}" removed.` });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setIsDeleting(null);
    }
  };

   const handleToggleProductStatus = async (productId: string, statusType: 'isTopBuy' | 'isNewlyLaunched', currentValue: boolean) => {
        setIsUpdatingStatus(productId);
        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [statusType]: !currentValue }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to update ${statusType} status`);
            }
            await fetchProductsAndCategories();
            toast({ title: "Success", description: `Product ${!currentValue ? 'marked as' : 'removed from'} ${statusType === 'isTopBuy' ? 'Top Buy' : 'Newly Launched'}.` });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setIsUpdatingStatus(null);
        }
    };


   const featuresToString = (features: string[] | undefined | null): string => Array.isArray(features) ? features.join(', ') : '';
   const currentSubcategories = useMemo(() => availableCategories.find(c => c._id === selectedCategoryId)?.subcategories || [], [selectedCategoryId, availableCategories]);
   const calculateTotalStock = (product: FetchedProduct): number => product.colors?.length > 0 ? product.colors.reduce((sum, color) => sum + (color.stock || 0), 0) : (product.stock || 0);

  // quillModules removed

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Manage Products</h2>
        <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full md:w-64 bg-background" />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button onClick={() => handleOpenDialog()}><PlusCircle className="mr-2 h-4 w-4" /> Add Product</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                 <DialogTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                 <DialogDescription>{isEditing ? `Update "${(currentProduct as ProductFormData).title}".` : 'New product details.'}</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="thumbnailFile">Primary Thumbnail Image <span className="text-destructive">*</span></Label>
                        <div className="flex items-center gap-4">
                            {currentProduct.thumbnailUrl && <Image src={currentProduct.thumbnailUrl} alt="Thumbnail Preview" width={64} height={64} className="rounded-md object-cover border" data-ai-hint="admin product thumbnail" />}
                            <Input id="thumbnailFile" type="file" accept="image/*" onChange={handleThumbnailFileChange} className="w-full" disabled={isDialogLoading || isUploadingThumbnail} />
                            {isUploadingThumbnail && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                        </div>
                        {(!currentProduct.thumbnailUrl && !isUploadingThumbnail) && <p className="text-xs text-destructive">Thumbnail is required.</p>}
                    </div>
                    <div className="space-y-2"><Label htmlFor="title">Title <span className="text-destructive">*</span></Label><Input id="title" name="title" value={currentProduct.title} onChange={handleInputChange} disabled={isDialogLoading} /></div>
                    <div className="space-y-2"><Label htmlFor="category">Category <span className="text-destructive">*</span></Label><Select value={selectedCategoryId} onValueChange={handleCategoryChange} disabled={isDialogLoading}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{availableCategories.map(cat => (<SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>))}</SelectContent></Select></div>
                    {selectedCategoryId && currentSubcategories.length > 0 && (<div className="space-y-2"><Label htmlFor="subcategory">Subcategory</Label><Select value={currentProduct.subcategory || ''} onValueChange={handleSubcategoryChange} disabled={isDialogLoading || !selectedCategoryId}><SelectTrigger><SelectValue placeholder="Select subcategory" /></SelectTrigger><SelectContent>{currentSubcategories.map(subcat => (<SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>))}</SelectContent></Select></div>)}
                    <div className="space-y-2"><Label htmlFor="price">Price (₹) <span className="text-destructive">*</span></Label><Input id="price" name="price" type="number" step="0.01" min="0" value={currentProduct.price ?? ''} onChange={handleInputChange} disabled={isDialogLoading}/></div>
                    <div className="space-y-2"><Label htmlFor="discount">Discount (%)</Label><Input id="discount" name="discount" type="number" min="0" max="100" value={currentProduct.discount ?? ''} onChange={handleInputChange} placeholder="e.g., 10" disabled={isDialogLoading}/></div>
                    <div className="space-y-2"><Label htmlFor="minOrderQuantity">Min Order Qty <span className="text-destructive">*</span></Label><Input id="minOrderQuantity" name="minOrderQuantity" type="number" min="1" step="1" value={currentProduct.minOrderQuantity ?? 1} onChange={handleInputChange} disabled={isDialogLoading}/></div>

                    {(!currentProduct.colors || currentProduct.colors.length === 0) && (
                        <div className="space-y-2">
                            <Label htmlFor="stock">Overall Stock <span className="text-destructive">*</span></Label>
                            <Input id="stock" name="stock" type="number" min="0" step="1" value={currentProduct.stock ?? 0} onChange={handleInputChange} disabled={isDialogLoading}/>
                            <p className="text-xs text-muted-foreground">Required if no color variants are added. This stock will be used for the product.</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={currentProduct.description}
                            onChange={handleInputChange}
                            placeholder="Enter product description..."
                            className="min-h-[200px]"
                            disabled={isDialogLoading}
                        />
                    </div>
                    <div className="space-y-2"><Label htmlFor="features">Features (Comma-separated)</Label><Input id="features" name="features" value={featuresToString(currentProduct.features)} onChange={handleInputChange} placeholder="Feature 1, Feature 2" disabled={isDialogLoading}/></div>

                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                            id="isTopBuy"
                            name="isTopBuy"
                            checked={(currentProduct as ProductFormData).isTopBuy || false}
                            onCheckedChange={(checked) => {
                                const event = { target: { name: 'isTopBuy', value: '', type: 'checkbox', checked: !!checked } } as React.ChangeEvent<HTMLInputElement>;
                                handleInputChange(event);
                             }}
                            disabled={isDialogLoading}
                        />
                        <Label htmlFor="isTopBuy" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Mark as Top Buy
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2 pt-1">
                        <Checkbox
                            id="isNewlyLaunched"
                            name="isNewlyLaunched"
                            checked={(currentProduct as ProductFormData).isNewlyLaunched || false}
                            onCheckedChange={(checked) => {
                                const event = { target: { name: 'isNewlyLaunched', value: '', type: 'checkbox', checked: !!checked } } as React.ChangeEvent<HTMLInputElement>;
                                handleInputChange(event);
                             }}
                            disabled={isDialogLoading}
                        />
                        <Label htmlFor="isNewlyLaunched" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Mark as Newly Launched
                        </Label>
                    </div>

                    <div className="space-y-4 border p-4 rounded-md">
                        <div className="flex justify-between items-center">
                             <Label className="text-base font-semibold">Color Variants</Label>
                             <Button type="button" variant="outline" size="sm" onClick={handleAddColor} disabled={isDialogLoading}><PlusCircle className="mr-2 h-4 w-4" /> Add Variant</Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Add color variants. If added, "Overall Stock" is ignored and total stock will be sum of variant stocks. Each color variant needs at least one image and stock quantity.</p>

                        {currentProduct.colors.map((color, colorIndex) => (
                            <div key={color._id || colorIndex} className="space-y-3 border p-3 rounded-md">
                                <div className="flex justify-between items-center">
                                     <Label className="text-sm font-medium">Variant #{colorIndex + 1}</Label>
                                     <Button variant="ghost" size="icon" onClick={() => handleRemoveColor(colorIndex)} disabled={isDialogLoading} className="h-7 w-7 text-destructive hover:text-destructive"><X className="h-4 w-4" /></Button>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`colorName-${colorIndex}`} className="text-xs">Name <span className="text-destructive">*</span></Label>
                                    <Input id={`colorName-${colorIndex}`} value={color.name} onChange={(e) => handleColorFieldChange(colorIndex, 'name', e.target.value)} placeholder="e.g., Ocean Blue" disabled={isDialogLoading}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`colorHex-${colorIndex}`} className="text-xs">Hex Code</Label>
                                    <div className="flex items-center gap-2">
                                        <Input id={`colorHex-${colorIndex}`} type="text" value={color.hexCode || ''} onChange={(e) => handleColorFieldChange(colorIndex, 'hexCode', e.target.value)} placeholder="#1A2B3C" className="flex-grow" disabled={isDialogLoading}/>
                                        <Input type="color" value={color.hexCode || '#000000'} onChange={(e) => handleColorFieldChange(colorIndex, 'hexCode', e.target.value)} className="p-0 h-8 w-8 rounded-md" disabled={isDialogLoading}/>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs">Images for this Color <span className="text-destructive">*</span></Label>
                                    <div className="grid grid-cols-3 gap-2 mb-2">
                                        {color.imageUrls.map((url, imgIdx) => (
                                            <div key={imgIdx} className="relative group aspect-square">
                                                <Image src={url} alt={`Color ${color.name} image ${imgIdx + 1}`} fill className="rounded-md object-cover border" data-ai-hint="product color variant image" />
                                                <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveUploadedColorImage(colorIndex, url)} disabled={isDialogLoading}><Trash2 className="h-3 w-3"/></Button>
                                            </div>
                                        ))}
                                    </div>
                                    <Input type="file" multiple accept="image/*" onChange={(e) => handleAddNewFilesToColor(colorIndex, e.target.files)} className="text-xs" disabled={isDialogLoading || !!uploadingColorImages[`${colorIndex}-new`]} />
                                    {Object.keys(uploadingColorImages).some(key => key.startsWith(`${colorIndex}-new`) && uploadingColorImages[key]) && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                                     <p className="text-xs text-muted-foreground">Upload one or more images for this color variant.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`colorStock-${colorIndex}`} className="text-xs">Stock for this color <span className="text-destructive">*</span></Label>
                                    <Input id={`colorStock-${colorIndex}`} type="number" min="0" step="1" value={color.stock ?? ''} onChange={(e) => handleColorFieldChange(colorIndex, 'stock', parseInt(e.target.value, 10))} placeholder="Enter stock" disabled={isDialogLoading}/>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <DialogFooter>
                   <DialogClose asChild><Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isDialogLoading}>Cancel</Button></DialogClose>
                    <Button type="button" onClick={handleSaveProduct} disabled={isDialogLoading || isUploadingThumbnail || Object.values(uploadingColorImages).some(s => s)}>
                        {(isDialogLoading || isUploadingThumbnail || Object.values(uploadingColorImages).some(s => s)) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
                <TableHead>Top Buy</TableHead>
                <TableHead>Newly Launched</TableHead>
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
                        <TableCell><Skeleton className="h-5 w-16 bg-muted" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20 bg-muted" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-8 w-20 mx-auto bg-muted" /></TableCell>
                    </TableRow>
                 ))
             ) : products.length > 0 ? (
                products.map((product) => {
                    const categoryDisplay = typeof product.category === 'object' && product.category !== null ? (product.category as ICategory).name : 'N/A';
                    const totalStock = calculateTotalStock(product);
                    const isInStock = totalStock > 0;
                    return (
                 <TableRow key={product._id.toString()}>
                      <TableCell>
                           <Image src={product.thumbnailUrl || '/placeholder.svg'} alt={product.title} width={40} height={40} className="w-10 h-10 object-cover rounded border" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} data-ai-hint="admin product list" />
                      </TableCell>
                    <TableCell className="font-medium">{product.title}</TableCell>
                    <TableCell>{categoryDisplay}</TableCell>
                    <TableCell>{product.subcategory || 'N/A'}</TableCell>
                     <TableCell>
                        {product.colors && product.colors.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                                {product.colors.slice(0, 3).map((color, idx) => (
                                    <Badge key={color._id?.toString() || idx} variant="outline" style={color.hexCode ? { backgroundColor: color.hexCode, color: getContrastColor(color.hexCode) } : {}}>
                                        {color.name} ({color.stock})
                                    </Badge>
                                ))}
                                {product.colors.length > 3 && <Badge variant="outline">...</Badge>}
                            </div>
                        ) : <span className="text-xs text-muted-foreground">None</span>}
                    </TableCell>
                    <TableCell className="text-right">
                        ₹{product.price.toFixed(2)}
                        {product.discount && product.discount > 0 && <span className="ml-1 text-xs text-destructive">(-{product.discount}%)</span>}
                    </TableCell>
                     <TableCell className="text-right">
                         {totalStock}
                         {product.colors && product.colors.length > 0 && (<span className="text-xs text-muted-foreground block"> (from variants)</span>)}
                      </TableCell>
                      <TableCell>
                          <Badge variant={isInStock ? 'default' : 'destructive'} className={isInStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {isInStock ? 'In Stock' : 'Out of Stock'}
                          </Badge>
                      </TableCell>
                      <TableCell>
                            <Badge variant={product.isTopBuy ? "default" : "outline"} className={product.isTopBuy ? 'bg-sky-100 text-sky-800 border-sky-200' : ''}>
                                {product.isTopBuy ? 'Yes' : 'No'}
                            </Badge>
                      </TableCell>
                      <TableCell>
                            <Badge variant={product.isNewlyLaunched ? "default" : "outline"} className={product.isNewlyLaunched ? 'bg-purple-100 text-purple-800 border-purple-200' : ''}>
                                {product.isNewlyLaunched ? 'Yes' : 'No'}
                            </Badge>
                      </TableCell>
                    <TableCell className="text-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isUpdatingStatus === product._id.toString() || isDeleting === product._id.toString()}>
                                    {(isUpdatingStatus === product._id.toString() || isDeleting === product._id.toString()) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4" />}
                                    <span className="sr-only">Actions</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenDialog(product)}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleProductStatus(product._id.toString(), 'isTopBuy', !!product.isTopBuy)}>
                                    <Star className={`mr-2 h-4 w-4 ${product.isTopBuy ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground'}`} />
                                    {product.isTopBuy ? 'Remove from Top Buys' : 'Mark as Top Buy'}
                                </DropdownMenuItem>
                                 <DropdownMenuItem onClick={() => handleToggleProductStatus(product._id.toString(), 'isNewlyLaunched', !!product.isNewlyLaunched)}>
                                    <Zap className={`mr-2 h-4 w-4 ${product.isNewlyLaunched ? 'fill-purple-400 text-purple-500' : 'text-muted-foreground'}`} />
                                    {product.isNewlyLaunched ? 'Remove from Newly Launched' : 'Mark as Newly Launched'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e)=> e.preventDefault()}>
                                             <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>Delete "{product.title}"? This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteProduct(product._id.toString(), product.title)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                 </TableRow>
                    );
                })
            ) : (
                <TableRow><TableCell colSpan={11} className="h-24 text-center text-muted-foreground">No products found{searchTerm ? ' matching your search' : ''}.</TableCell></TableRow>
            )}
            </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function getContrastColor(hexcolor: string | undefined): string {
    if (!hexcolor) return '#000000';
    hexcolor = hexcolor.replace("#", "");
    if (hexcolor.length === 3) hexcolor = hexcolor.split('').map(char => char + char).join('');
    if (hexcolor.length !== 6) return '#000000';
    const r = parseInt(hexcolor.substring(0, 2), 16);
    const g = parseInt(hexcolor.substring(2, 4), 16);
    const b = parseInt(hexcolor.substring(4, 6), 16);
    return ((r * 299) + (g * 587) + (b * 114)) / 1000 >= 128 ? '#000000' : '#FFFFFF';
}

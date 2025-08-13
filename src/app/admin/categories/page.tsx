
// src/app/admin/categories/page.tsx
'use client';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useCategoryImage } from "@/hooks/use-category-image";
import { useToast } from "@/hooks/use-toast";
import type { ICategory } from '@/models/Category';
import { Edit, Loader2, PlusCircle, Tag, Trash2, Upload } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

type CategoryData = ICategory & { _id: string };

interface CategoryFormData {
    name: string;
    image: string;
    subcategories: string[];
}

const emptyCategory: CategoryFormData = {
    name: '',
    image: '',
    subcategories: [],
};

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<CategoryFormData | CategoryData>(emptyCategory);
    const [subcategoriesInput, setSubcategoriesInput] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDialogLoading, setIsDialogLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const { toast } = useToast();
    
    // Use the custom hook for image management
    const { 
        isUploading, 
        fileName: uploadingFileName,
        uploadImage, 
        deleteImage,
        validateFile 
    } = useCategoryImage();

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/categories');
            if (!response.ok) {
                const _errorText = await response.text();
                // console.error("Failed to fetch categories. Status:", response.status, "Response:", errorText); // Removed
                throw new Error(`Failed to fetch categories. Status: ${response.status}`);
            }
            const data = await response.json();
            setCategories(Array.isArray(data.categories) ? data.categories : []);
        } catch (error: any) {
            // console.error('Error fetching categories:', error); // Removed
            toast({ variant: "destructive", title: "Error", description: error.message || "Could not load categories." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleOpenDialog = (category?: CategoryData) => {
        if (category) {
            setCurrentCategory(category);
            setSubcategoriesInput((category.subcategories || []).join(', '));
            setIsEditing(true);
        } else {
            setCurrentCategory(emptyCategory);
            setSubcategoriesInput('');
            setIsEditing(false);
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setTimeout(() => {
            setCurrentCategory(emptyCategory);
            setSubcategoriesInput('');
            setIsEditing(false);
        }, 150);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentCategory(prev => ({ ...prev, name: e.target.value }));
    };

    // Handle file upload using the custom hook
    const handleImageUpload = async (file: File): Promise<string | null> => {
        const categoryId = isEditing && '_id' in currentCategory ? currentCategory._id : undefined;
        const result = await uploadImage(file, categoryId);
        return result.success ? result.url || null : null;
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Validate file using the hook
            const validation = validateFile(file);
            if (!validation.valid) {
                return; // Hook will show toast
            }

            const uploadedUrl = await handleImageUpload(file);
            if (uploadedUrl) {
                setCurrentCategory(prev => ({ ...prev, image: uploadedUrl }));
            }
        }
    };

    const handleRemoveImage = async () => {
        if (isEditing && '_id' in currentCategory && currentCategory.image) {
            const success = await deleteImage(currentCategory._id, currentCategory.image);
            if (success) {
                setCurrentCategory(prev => ({ ...prev, image: '' }));
            }
        } else {
            // For new categories, just remove from state
            setCurrentCategory(prev => ({ ...prev, image: '' }));
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            const file = files[0];
            
            // Validate file using the hook
            const validation = validateFile(file);
            if (!validation.valid) {
                return; // Hook will show toast
            }

            const uploadedUrl = await handleImageUpload(file);
            if (uploadedUrl) {
                setCurrentCategory(prev => ({ ...prev, image: uploadedUrl }));
            }
        }
    };
    const handleSubcategoriesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSubcategoriesInput(e.target.value);
    };

    const handleSaveCategory = async () => {
        setIsDialogLoading(true);

        const subcategoriesArray = subcategoriesInput.split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        const categoryDataToSave = {
            ...currentCategory,
            subcategories: Array.from(new Set(subcategoriesArray)), // Ensure uniqueness
        };

        if (!categoryDataToSave.name || categoryDataToSave.name.trim() === '') {
            toast({ variant: "destructive", title: "Validation Error", description: "Category name is required." });
            setIsDialogLoading(false);
            return;
        }

        try {
            let response;
            let successMessage = '';

            if (isEditing && '_id' in categoryDataToSave) {
                response = await fetch(`/api/categories/${(categoryDataToSave as CategoryData)._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        name: categoryDataToSave.name, 
                        image: categoryDataToSave.image,
                        subcategories: categoryDataToSave.subcategories 
                    }),
                });
                successMessage = `Category "${categoryDataToSave.name}" has been updated.`;
            } else {
                response = await fetch('/api/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        name: categoryDataToSave.name, 
                        image: categoryDataToSave.image,
                        subcategories: categoryDataToSave.subcategories 
                    }),
                });
                successMessage = `Category "${categoryDataToSave.name}" has been added.`;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save category');
            }

            await fetchCategories(); // Re-fetch to update list
            toast({ variant: "success", title: isEditing ? "Category Updated" : "Category Added", description: successMessage });
            handleCloseDialog();
        } catch (error: any) {
            // console.error("Error saving category:", error); // Removed
            toast({ variant: "destructive", title: "Error", description: error.message || "Could not save category." });
        } finally {
            setIsDialogLoading(false);
        }
    };

    const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
        setIsDeleting(categoryId);
        try {
            // Find the category to check if it has an image
            const categoryToDelete = categories.find(c => c._id === categoryId);
            const hasImage = categoryToDelete?.image && categoryToDelete.image.trim() !== '';

            const response = await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete category');
            }

            const result = await response.json();
            setCategories(prev => prev.filter(c => c._id !== categoryId));
            
            // Show appropriate success message
            const message = hasImage && result.imageDeleted 
                ? `Category "${categoryName}" and its image have been removed.`
                : `Category "${categoryName}" has been removed.`;
                
            toast({ 
                variant: "default", 
                title: "Category Deleted", 
                description: message 
            });
        } catch (error: any) {
            // console.error("Error deleting category:", error); // Removed
            toast({ variant: "destructive", title: "Error", description: error.message || "Could not delete category." });
        } finally {
            setIsDeleting(null);
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Manage Categories</h2>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{isEditing ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                            <DialogDescription>
                                {isEditing ? `Update details for "${(currentCategory as CategoryData).name}".` : 'Create a new category and its subcategories.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" value={currentCategory.name} onChange={handleNameChange} className="w-full" disabled={isDialogLoading || isUploading}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="image">Category Image</Label>
                                <div className="space-y-3">
                                    {!currentCategory.image || currentCategory.image.trim() === '' ? (
                                        <div 
                                            className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                                                isDragOver 
                                                    ? 'border-primary bg-primary/5' 
                                                    : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                        >
                                            <div className="flex flex-col items-center justify-center text-center">
                                                <Upload className="h-10 w-10 text-gray-400 mb-3" />
                                                <div className="space-y-2">
                                                    <label
                                                        htmlFor="imageFile"
                                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {isUploading ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                Uploading {uploadingFileName ? `"${uploadingFileName}"` : '...'}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Upload className="h-4 w-4 mr-2" />
                                                                Choose Image
                                                            </>
                                                        )}
                                                        <Input
                                                            type="file"
                                                            id="imageFile"
                                                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                                            onChange={handleFileChange}
                                                            className="sr-only"
                                                            disabled={isDialogLoading || isUploading}
                                                        />
                                                    </label>
                                                    <p className="text-sm text-gray-500">
                                                        or drag and drop your image here
                                                    </p>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    PNG, JPG, GIF, WebP up to 10MB
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="relative inline-block">
                                                <div className="relative w-32 h-24 overflow-hidden rounded-lg border-2 border-gray-200 shadow-sm">
                                                    {currentCategory.image && currentCategory.image.trim() !== '' ? (
                                                        <Image
                                                            src={currentCategory.image}
                                                            alt="Category preview"
                                                            fill
                                                            className="object-cover"
                                                            sizes="128px"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                                            <Upload className="h-8 w-8" />
                                                        </div>
                                                    )}
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={handleRemoveImage}
                                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                                    disabled={isDialogLoading || isUploading}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <div>
                                                <label
                                                    htmlFor="imageFileReplace"
                                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer"
                                                >
                                                    {isUploading ? (
                                                        <>
                                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                            Uploading...
                                                        </>
                                                    ) : (
                                                        'Change Image'
                                                    )}
                                                    <Input
                                                        type="file"
                                                        id="imageFileReplace"
                                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                                        onChange={handleFileChange}
                                                        className="sr-only"
                                                        disabled={isDialogLoading || isUploading}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subcategories">Subcategories (Comma-separated)</Label>
                                <Textarea
                                    id="subcategories"
                                    value={subcategoriesInput}
                                    onChange={handleSubcategoriesChange}
                                    className="w-full min-h-[80px]"
                                    placeholder="e.g., Shirts, Pants, Dresses"
                                    disabled={isDialogLoading || isUploading}
                                />
                                 <p className="text-xs text-muted-foreground">
                                    Enter subcategories separated by commas. Duplicates and empty entries will be ignored.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isDialogLoading || isUploading}>Cancel</Button>
                            </DialogClose>
                            <Button type="button" onClick={handleSaveCategory} disabled={isDialogLoading || isUploading}>
                                {(isDialogLoading || isUploading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isUploading ? 'Uploading...' : isEditing ? 'Save Changes' : 'Add Category'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Category List</CardTitle>
                    <CardDescription>View, edit, or delete product categories.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Image</TableHead>
                                <TableHead>Subcategories</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [...Array(3)].map((_, i) => (
                                    <TableRow key={`skel-cat-${i}`}>
                                        <TableCell><Skeleton className="h-5 w-32 bg-muted" /></TableCell>
                                        <TableCell><Skeleton className="h-10 w-16 bg-muted" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-full bg-muted" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto bg-muted" /></TableCell>
                                    </TableRow>
                                ))
                            ) : categories.length > 0 ? (
                                categories.map((category) => (
                                    <TableRow key={category._id}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <Tag className="h-4 w-4 text-muted-foreground"/>
                                            {category.name}
                                        </TableCell>
                                        
                                        <TableCell>
                                            {category.image && category.image.trim() !== '' ? (
                                                <div className="relative w-16 h-10 overflow-hidden rounded border">
                                                    <Image
                                                        src={category.image}
                                                        alt={category.name}
                                                        fill
                                                        className="object-cover"
                                                        sizes="64px"
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">No image</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {category.subcategories && category.subcategories.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {category.subcategories.map(sub => (
                                                        <Badge key={sub} variant="secondary" className="text-xs">{sub}</Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">None</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(category)}>
                                                    <Edit className="h-4 w-4" />
                                                    <span className="sr-only">Edit</span>
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled={isDeleting === category._id}>
                                                            {isDeleting === category._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                            <span className="sr-only">Delete</span>
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the category "{category.name}".
                                                                Products assigned to this category might need to be reassigned.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel disabled={isDeleting === category._id}>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDeleteCategory(category._id, category.name)}
                                                                disabled={isDeleting === category._id}
                                                                className="bg-destructive hover:bg-destructive/90"
                                                            >
                                                                {isDeleting === category._id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No categories found. Start by adding one.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

// src/app/admin/categories/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, Loader2, Tag, ListChecks } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { ICategory } from '@/models/Category';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';

type CategoryData = ICategory & { _id: string };

const emptyCategory: Omit<CategoryData, '_id' | 'createdAt' | 'updatedAt'> = {
    name: '',
    subcategories: [],
};

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<Omit<CategoryData, '_id' | 'createdAt' | 'updatedAt'> | CategoryData>(emptyCategory);
    const [subcategoriesInput, setSubcategoriesInput] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDialogLoading, setIsDialogLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/categories');
            if (!response.ok) {
                // Log more details if the response is not OK
                const errorText = await response.text();
                console.error("Failed to fetch categories. Status:", response.status, "Response:", errorText);
                throw new Error(`Failed to fetch categories. Status: ${response.status}`);
            }
            const data = await response.json();
            setCategories(Array.isArray(data.categories) ? data.categories : []);
        } catch (error: any) {
            console.error('Error fetching categories:', error);
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
                    body: JSON.stringify({ name: categoryDataToSave.name, subcategories: categoryDataToSave.subcategories }),
                });
                successMessage = `Category "${categoryDataToSave.name}" has been updated.`;
            } else {
                response = await fetch('/api/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: categoryDataToSave.name, subcategories: categoryDataToSave.subcategories }),
                });
                successMessage = `Category "${categoryDataToSave.name}" has been added.`;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save category');
            }

            await fetchCategories(); // Re-fetch to update list
            toast({ title: isEditing ? "Category Updated" : "Category Added", description: successMessage });
            handleCloseDialog();
        } catch (error: any) {
            console.error("Error saving category:", error);
            toast({ variant: "destructive", title: "Error", description: error.message || "Could not save category." });
        } finally {
            setIsDialogLoading(false);
        }
    };

    const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
        setIsDeleting(categoryId);
        try {
            const response = await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete category');
            }
            setCategories(prev => prev.filter(c => c._id !== categoryId));
            toast({ title: "Category Deleted", description: `Category "${categoryName}" has been removed.` });
        } catch (error: any) {
            console.error("Error deleting category:", error);
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
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name</Label>
                                <Input id="name" value={currentCategory.name} onChange={handleNameChange} className="col-span-3" disabled={isDialogLoading}/>
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="subcategories" className="text-right pt-2">Subcategories</Label>
                                <Textarea
                                    id="subcategories"
                                    value={subcategoriesInput}
                                    onChange={handleSubcategoriesChange}
                                    className="col-span-3 min-h-[80px]"
                                    placeholder="Comma-separated, e.g., Shirts, Pants, Dresses"
                                    disabled={isDialogLoading}
                                />
                            </div>
                             <p className="col-span-4 text-xs text-muted-foreground pl-[calc(25%+1rem)]">
                                Enter subcategories separated by commas. Duplicates and empty entries will be ignored.
                            </p>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isDialogLoading}>Cancel</Button>
                            </DialogClose>
                            <Button type="button" onClick={handleSaveCategory} disabled={isDialogLoading}>
                                {isDialogLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isEditing ? 'Save Changes' : 'Add Category'}
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
                                <TableHead>Subcategories</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [...Array(3)].map((_, i) => (
                                    <TableRow key={`skel-cat-${i}`}>
                                        <TableCell><Skeleton className="h-5 w-32 bg-muted" /></TableCell>
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
                                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
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


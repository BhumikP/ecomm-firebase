
// src/app/admin/banners/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch'; // For isActive toggle
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, Loader2, UploadCloud, Link as LinkIcon, Eye, EyeOff, Baseline } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { IBanner } from '@/models/Banner';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';

type BannerData = IBanner & { _id: string };

const emptyBanner: Omit<BannerData, '_id' | 'createdAt' | 'updatedAt'> = {
    title: '',
    imageUrl: '',
    altText: '',
    linkUrl: '',
    order: 0,
    dataAiHint: '',
    isActive: true,
};

export default function AdminBannersPage() {
    const [banners, setBanners] = useState<BannerData[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentBanner, setCurrentBanner] = useState<Omit<BannerData, '_id' | 'createdAt' | 'updatedAt'> | BannerData>(emptyBanner);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDialogLoading, setIsDialogLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

    const fetchBanners = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/banners'); // Fetch all banners for admin
            if (!response.ok) {
                throw new Error(`Failed to fetch banners. Status: ${response.status}`);
            }
            const data = await response.json();
            setBanners(Array.isArray(data.banners) ? data.banners : []);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message || "Could not load banners." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleOpenDialog = (banner?: BannerData) => {
        if (banner) {
            setCurrentBanner(banner);
            setIsEditing(true);
        } else {
            setCurrentBanner(emptyBanner);
            setIsEditing(false);
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setTimeout(() => {
            setCurrentBanner(emptyBanner);
            setIsEditing(false);
            setIsUploading(false);
        }, 150);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCurrentBanner(prev => ({ ...prev, [name]: name === 'order' ? parseInt(value, 10) || 0 : value }));
    };
    
    const handleSwitchChange = (checked: boolean) => {
        setCurrentBanner(prev => ({ ...prev, isActive: checked }));
    };

    const handleImageUpload = async (file: File): Promise<string | null> => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch('/api/upload', { method: 'POST', body: formData });
            const result = await response.json();
            if (response.ok && result.success) {
                toast({ title: "Image Uploaded", description: "Banner image uploaded successfully." });
                return result.url;
            } else {
                toast({ variant: "destructive", title: "Upload Failed", description: result.message || "Could not upload image." });
                return null;
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Upload Error", description: (err as Error).message || "An error occurred." });
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const uploadedUrl = await handleImageUpload(file);
            if (uploadedUrl) {
                setCurrentBanner(prev => ({ ...prev, imageUrl: uploadedUrl }));
            }
        }
    };

    const handleSaveBanner = async () => {
        setIsDialogLoading(true);

        if (!currentBanner.imageUrl || currentBanner.imageUrl.trim() === '') {
            toast({ variant: "destructive", title: "Validation Error", description: "Banner Image URL is required." });
            setIsDialogLoading(false); return;
        }
        if (!currentBanner.altText || currentBanner.altText.trim() === '') {
            toast({ variant: "destructive", title: "Validation Error", description: "Alt Text is required." });
            setIsDialogLoading(false); return;
        }

        const bannerDataToSave = {
            title: currentBanner.title, // Pass title directly; if it's '', API will receive it as ''
            imageUrl: currentBanner.imageUrl,
            altText: currentBanner.altText,
            linkUrl: currentBanner.linkUrl || undefined,
            order: currentBanner.order || 0,
            dataAiHint: currentBanner.dataAiHint || undefined,
            isActive: currentBanner.isActive,
        };

        try {
            let response;
            if (isEditing && '_id' in currentBanner) {
                response = await fetch(`/api/admin/banners/${(currentBanner as BannerData)._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bannerDataToSave),
                });
            } else {
                response = await fetch('/api/admin/banners', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bannerDataToSave),
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save banner');
            }

            await fetchBanners();
            toast({ title: isEditing ? "Banner Updated" : "Banner Added" });
            handleCloseDialog();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Save Error", description: error.message || "Could not save banner." });
        } finally {
            setIsDialogLoading(false);
        }
    };

    const handleDeleteBanner = async (bannerId: string, bannerAlt: string) => {
        setIsDeleting(bannerId);
        try {
            const response = await fetch(`/api/admin/banners/${bannerId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error((await response.json()).message || 'Failed to delete banner');
            await fetchBanners();
            toast({ title: "Banner Deleted", description: `Banner "${bannerAlt}" removed.` });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Delete Error", description: error.message });
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Manage Banners</h2>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Banner
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[550px]">
                        <DialogHeader>
                            <DialogTitle>{isEditing ? 'Edit Banner' : 'Add New Banner'}</DialogTitle>
                            <DialogDescription>
                                {isEditing ? `Update details for the banner.` : 'Upload a new banner for the homepage.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Banner Title (Optional)</Label>
                                <Input id="title" name="title" value={currentBanner.title || ''} onChange={handleInputChange} placeholder="e.g., Summer Sale Extravaganza" className="w-full" disabled={isDialogLoading}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="imageUrl">Banner Image <span className="text-destructive">*</span></Label>
                                {currentBanner.imageUrl && (
                                    <div className="relative w-full h-48 rounded-md overflow-hidden border bg-muted">
                                        <Image src={currentBanner.imageUrl} alt="Banner Preview" layout="fill" objectFit="contain" data-ai-hint="admin banner preview"/>
                                    </div>
                                )}
                                <Input id="imageFile" type="file" accept="image/*" onChange={handleFileChange} className="w-full" disabled={isDialogLoading || isUploading}/>
                                {isUploading && <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</div>}
                                <Input id="imageUrl" name="imageUrl" value={currentBanner.imageUrl} onChange={handleInputChange} placeholder="Or paste image URL directly" className="w-full" disabled={isDialogLoading}/>
                                <p className="text-xs text-muted-foreground">Recommended size: 1200x400 pixels.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="altText">Alt Text <span className="text-destructive">*</span></Label>
                                <Input id="altText" name="altText" value={currentBanner.altText} onChange={handleInputChange} placeholder="Descriptive text for accessibility" className="w-full" disabled={isDialogLoading}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="linkUrl">Link URL (Optional)</Label>
                                <Input id="linkUrl" name="linkUrl" value={currentBanner.linkUrl || ''} onChange={handleInputChange} placeholder="e.g., /products/some-category" className="w-full" disabled={isDialogLoading}/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="dataAiHint">Data AI Hint (Optional)</Label>
                                <Input id="dataAiHint" name="dataAiHint" value={currentBanner.dataAiHint || ''} onChange={handleInputChange} placeholder="e.g., sale promotion electronics" className="w-full" disabled={isDialogLoading}/>
                                 <p className="text-xs text-muted-foreground">Max 2 keywords for image search suggestions.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="order">Display Order</Label>
                                <Input id="order" name="order" type="number" value={currentBanner.order} onChange={handleInputChange} placeholder="0" className="w-full" disabled={isDialogLoading}/>
                                <p className="text-xs text-muted-foreground">Lower numbers appear first.</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="isActive" checked={currentBanner.isActive} onCheckedChange={handleSwitchChange} disabled={isDialogLoading}/>
                                <Label htmlFor="isActive">Active (Visible on homepage)</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isDialogLoading}>Cancel</Button></DialogClose>
                            <Button type="button" onClick={handleSaveBanner} disabled={isDialogLoading || isUploading}>
                                {isDialogLoading || isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isEditing ? 'Save Changes' : 'Add Banner'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader><CardTitle>Current Banners</CardTitle><CardDescription>Manage your homepage promotional banners.</CardDescription></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Preview</TableHead>
                                <TableHead>Title / Alt Text</TableHead>
                                <TableHead>Link URL</TableHead>
                                <TableHead className="text-center">Order</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [...Array(2)].map((_, i) => (
                                    <TableRow key={`skel-banner-${i}`}>
                                        <TableCell><Skeleton className="h-16 w-24 rounded-md bg-muted" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-3/4 bg-muted" /><Skeleton className="h-4 w-1/2 bg-muted mt-1" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-1/2 bg-muted" /></TableCell>
                                        <TableCell className="text-center"><Skeleton className="h-5 w-8 bg-muted mx-auto" /></TableCell>
                                        <TableCell className="text-center"><Skeleton className="h-6 w-16 bg-muted mx-auto rounded-full" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto bg-muted" /></TableCell>
                                    </TableRow>
                                ))
                            ) : banners.length > 0 ? (
                                banners.map((banner) => (
                                    <TableRow key={banner._id}>
                                        <TableCell>
                                            <Image src={banner.imageUrl} alt={banner.altText} width={96} height={40} className="rounded-md object-contain border bg-muted" data-ai-hint="admin banner list"/>
                                        </TableCell>
                                        <TableCell>
                                            {banner.title && <p className="font-semibold">{banner.title}</p>}
                                            <p className={`font-medium ${banner.title ? 'text-xs text-muted-foreground' : ''}`}>{banner.altText}</p>
                                            {banner.dataAiHint && <p className="text-xs text-muted-foreground">Hint: {banner.dataAiHint}</p>}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {banner.linkUrl ? <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block max-w-[150px]">{banner.linkUrl}</a> : <span className="text-muted-foreground">None</span>}
                                        </TableCell>
                                        <TableCell className="text-center">{banner.order}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={banner.isActive ? 'default' : 'outline'} className={banner.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                                {banner.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(banner)}>
                                                    <Edit className="h-4 w-4" /> <span className="sr-only">Edit</span>
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled={isDeleting === banner._id}>
                                                            {isDeleting === banner._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                            <span className="sr-only">Delete</span>
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>Delete Banner?</AlertDialogTitle>
                                                        <AlertDialogDescription>This will permanently delete the banner: "{banner.altText}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel disabled={isDeleting === banner._id}>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteBanner(banner._id, banner.altText)} disabled={isDeleting === banner._id} className="bg-destructive hover:bg-destructive/90">
                                                                {isDeleting === banner._id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No banners configured yet. Add one to get started.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

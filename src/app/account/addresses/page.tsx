
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { Home, PlusCircle, Edit, Trash2, Loader2, Star, ArrowLeft } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { IShippingAddress, IUser } from '@/models/User';

type UserWithAddresses = Omit<IUser, 'passwordHash'> & {
    _id: string;
    addresses: (IShippingAddress & { _id: string })[];
};

const addressFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "A valid email is required." }),
  street: z.string().min(5, { message: "Street address is required." }),
  city: z.string().min(2, { message: "City is required." }),
  state: z.string().min(2, { message: "State is required." }),
  zip: z.string().min(5, { message: "A valid ZIP code is required." }).max(10),
  country: z.string().min(2, { message: "Country is required." }),
  phone: z.string().min(10, { message: "A valid 10-digit phone number is required." }).max(15),
  isPrimary: z.boolean().default(false),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

const emptyAddress: AddressFormValues = { name: '', email: '', street: '', city: '', state: '', zip: '', country: 'India', phone: '', isPrimary: false };

export default function ManageAddressesPage() {
    const { toast } = useToast();
    const [user, setUser] = useState<UserWithAddresses | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<IShippingAddress & { _id: string } | null>(null);

    const form = useForm<AddressFormValues>({
        resolver: zodResolver(addressFormSchema),
        defaultValues: emptyAddress,
    });

    useEffect(() => {
        const userDataString = localStorage.getItem('userData');
        if (userDataString) {
            try {
                const parsedData = JSON.parse(userDataString);
                setUser(parsedData);
            } catch (e) {
                console.error("Failed to parse user data", e);
            }
        }
        setIsLoading(false);
    }, []);

    const handleApiResponse = (response: any, successMessage: string, errorMessage: string) => {
        if (response.ok) {
            toast({ variant: "success", title: "Success", description: successMessage });
            response.json().then((data: { user: UserWithAddresses }) => {
                setUser(data.user);
                localStorage.setItem('userData', JSON.stringify(data.user)); // Update localStorage
            });
            setIsDialogOpen(false);
        } else {
            response.json().then((data: { message: string }) => {
                toast({ variant: "destructive", title: "Error", description: data.message || errorMessage });
            });
        }
    };

    const onSubmit = async (data: AddressFormValues) => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            let response;
            if (editingAddress) { // Update
                response = await fetch('/api/account/addresses', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user._id, addressId: editingAddress._id, updateData: data }),
                });
                handleApiResponse(response, "Address updated successfully.", "Failed to update address.");
            } else { // Add new
                response = await fetch('/api/account/addresses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user._id, addressData: data }),
                });
                handleApiResponse(response, "New address added successfully.", "Failed to add address.");
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Request Failed", description: "An error occurred." });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDelete = async (addressId: string) => {
        if (!user) return;
        setIsDeleting(addressId);
        try {
            const response = await fetch('/api/account/addresses', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user._id, addressId }),
            });
            handleApiResponse(response, "Address deleted.", "Failed to delete address.");
        } catch (error) {
             toast({ variant: "destructive", title: "Request Failed", description: "An error occurred." });
        } finally {
            setIsDeleting(null);
        }
    };
    
    const handleSetPrimary = async (addressId: string) => {
        if (!user) return;
        setIsSubmitting(true);
         try {
             const response = await fetch('/api/account/addresses', {
                 method: 'PUT',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ userId: user._id, addressId: addressId, updateData: { isPrimary: true } }),
             });
            handleApiResponse(response, "Primary address updated.", "Failed to set primary address.");
         } catch (error) {
             toast({ variant: "destructive", title: "Request Failed", description: "An error occurred." });
         } finally {
             setIsSubmitting(false);
         }
    };

    const openAddDialog = () => {
        setEditingAddress(null);
        const userEmail = localStorage.getItem('userEmail');
        const userName = user?.name;
        form.reset({...emptyAddress, email: userEmail || '', name: userName || ''});
        setIsDialogOpen(true);
    };

    const openEditDialog = (address: IShippingAddress & { _id: string }) => {
        setEditingAddress(address);
        form.reset(address);
        setIsDialogOpen(true);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <Button variant="outline" size="sm" asChild className="mb-4">
                <Link href="/account">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Account
                </Link>
            </Button>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Manage Shipping Addresses</CardTitle>
                            <CardDescription>Add, edit, or remove your saved addresses.</CardDescription>
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={openAddDialog}><PlusCircle className="mr-2 h-4 w-4" /> Add New</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{editingAddress ? 'Edit Address' : 'Add a New Address'}</DialogTitle>
                                </DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="street" render={({ field }) => (<FormItem><FormLabel>Street Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="state" render={({ field }) => (<FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={form.control} name="zip" render={({ field }) => (<FormItem><FormLabel>ZIP Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="country" render={({ field }) => (<FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>)} />
                                        </div>
                                        <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="isPrimary" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Set as primary address</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                        <DialogFooter>
                                            <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Address'}</Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-md" />)}
                        </div>
                    ) : user && user.addresses && user.addresses.length > 0 ? (
                        <div className="grid sm:grid-cols-2 gap-4">
                            {user.addresses.map(address => (
                                <Card key={address._id} className={address.isPrimary ? "border-primary" : ""}>
                                    <CardHeader className="flex flex-row justify-between items-start pb-2">
                                        <CardTitle className="text-base font-semibold">{address.name}</CardTitle>
                                        {address.isPrimary && <div className="flex items-center gap-1 text-xs text-primary font-semibold"><Star className="h-4 w-4 fill-primary" /> Primary</div>}
                                    </CardHeader>
                                    <CardContent className="text-sm text-muted-foreground space-y-1 pb-4">
                                        <p>{address.email}</p>
                                        <p>{address.street}</p>
                                        <p>{address.city}, {address.state} {address.zip}</p>
                                        <p>{address.country}</p>
                                        <p>{address.phone}</p>
                                    </CardContent>
                                    <CardFooter className="flex justify-end gap-2 bg-muted/50 p-2">
                                        {!address.isPrimary && <Button variant="outline" size="sm" onClick={() => handleSetPrimary(address._id)} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set Primary'}</Button>}
                                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(address)}>Edit</Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={isDeleting === address._id}>{isDeleting === address._id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Delete Address?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(address._id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <Home className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-semibold">No Saved Addresses</p>
                            <p className="text-muted-foreground">Add a new address to get started.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

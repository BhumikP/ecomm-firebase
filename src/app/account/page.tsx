
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Edit, Package, LogOut, Home, Settings, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';


interface UserData {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  joinedDate: string;
  role: 'user' | 'admin';
}

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;


export default function AccountPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: '' },
  });


  useEffect(() => {
    // This now simply loads user data from localStorage for display purposes.
    // The middleware handles the actual authentication check.
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      try {
        const parsedUserData: UserData = JSON.parse(userDataString);
        setUserData(parsedUserData);
        form.reset({ name: parsedUserData.name });
      } catch (e) {
        console.error("Failed to parse user data from localStorage", e);
        // If data is corrupt, force a logout to clear state
        handleLogout();
      }
    } else {
      // This case should ideally not be reached if middleware is working,
      // but as a fallback, redirect to login.
      router.replace('/auth/login');
    }
    setIsLoading(false);
  }, [router, form]);

  const handleLogout = () => {
    // Clear client-side storage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    localStorage.removeItem('userEmail');
    
    // The redirect is the most practical way here to clear server session cookies
    toast({ variant: "success", title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/');
    router.refresh();
  };
  
  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (!userData) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/users/${userData._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update profile');
      }

      // Update local state and localStorage for immediate UI feedback
      const updatedUserData = { ...userData, name: result.user.name };
      setUserData(updatedUserData);
      localStorage.setItem('userData', JSON.stringify(updatedUserData));
      
      toast({ variant: "success", title: 'Success', description: 'Your profile has been updated.' });
      setIsDialogOpen(false);

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };


  const getInitials = (name: string) => {
     if (!name) return '';
     const names = name.split(' ');
     if (names.length === 1) return names[0][0].toUpperCase();
     return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };
  
  if (isLoading || !userData) {
    return (
      <div className="container mx-auto px-4 py-8">
         <Card className="w-full max-w-2xl mx-auto">
           <CardHeader className="flex flex-row items-center space-x-4 pb-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-32" />
              </div>
           </CardHeader>
           <Separator />
           <CardContent className="pt-6 space-y-4">
               <Skeleton className="h-10 w-full" />
               <Skeleton className="h-10 w-full" />
               <Skeleton className="h-10 w-full" />
               <div className="pt-4 flex justify-end">
                  <Skeleton className="h-10 w-32" />
               </div>
           </CardContent>
         </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
                 <Avatar className="h-24 w-24">
                    <AvatarImage src={userData.avatarUrl} alt={userData.name} />
                    <AvatarFallback className="text-3xl">{getInitials(userData.name)}</AvatarFallback>
                </Avatar>
            </div>
          <CardTitle className="text-2xl">{userData.name}</CardTitle>
          <CardDescription>{userData.email}</CardDescription>
          <p className="text-sm text-muted-foreground pt-1">Joined: {new Date(userData.joinedDate).toLocaleDateString()}</p>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6 space-y-4">
           {userData.role === 'admin' && (
                <Button variant="default" className="w-full justify-start" asChild>
                    <Link href="/admin">
                         <Settings className="mr-2 h-4 w-4" /> Go to Admin Dashboard
                    </Link>
               </Button>
           )}
          
           <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                   <Edit className="mr-2 h-4 w-4" /> Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onProfileSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
              </DialogContent>
            </Dialog>


           <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/account/orders">
                     <Package className="mr-2 h-4 w-4" /> View Order History
                </Link>
           </Button>
           <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/account/addresses">
                     <Home className="mr-2 h-4 w-4" /> Manage Addresses
                </Link>
           </Button>

            <div className="pt-4 flex justify-end">
                <Button variant="destructive" onClick={handleLogout}>
                     <LogOut className="mr-2 h-4 w-4" /> Logout
                 </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

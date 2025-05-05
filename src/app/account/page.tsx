'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Edit, Package, LogOut } from 'lucide-react'; // Import icons

// Mock user data structure
interface UserData {
  name: string;
  email: string;
  avatarUrl?: string; // Optional avatar
  joinedDate: string;
}

export default function AccountPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!loggedIn) {
      router.replace('/auth/login'); // Redirect if not logged in
      return; // Stop further execution
    }

    // Fetch or load user data
    const fetchUserData = async () => {
      setIsLoading(true);
      // --- Mock Data Fetch ---
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
      const mockEmail = localStorage.getItem('userEmail') || 'user@example.com'; // Use stored email or default
       const mockName = mockEmail.split('@')[0].replace('.', ' ').replace(/^\w/, c => c.toUpperCase()); // Simple name from email
      setUserData({
        name: mockName,
        email: mockEmail,
        joinedDate: '2023-10-20', // Mock date
        // avatarUrl: 'https://picsum.photos/100' // Optional avatar URL
      });
      // --- End Mock ---
      setIsLoading(false);
    };

    fetchUserData();

  }, [router]);

   const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
     localStorage.removeItem('userEmail'); // Clear email if stored
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/'); // Redirect to home
  };

  // Render skeleton or loading state while checking auth/fetching data on the client
  if (!isClient || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
         <Card>
           <CardHeader className="flex flex-row items-center space-x-4 pb-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
              </div>
           </CardHeader>
           <Separator />
           <CardContent className="pt-6 space-y-6">
               <Skeleton className="h-10 w-full" />
               <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-32 ml-auto" />
           </CardContent>
         </Card>
      </div>
    );
  }

   if (!userData) {
     // Should ideally be handled by the loading state or redirect, but as a fallback:
      return (
            <div className="container mx-auto px-4 py-8 text-center">
                <p className="text-muted-foreground">Could not load user data. Please try logging in again.</p>
                 <Button onClick={() => router.push('/auth/login')} className="mt-4">Login</Button>
            </div>
        );
   }

  const getInitials = (name: string) => {
     const names = name.split(' ');
     if (names.length === 1) return names[0][0].toUpperCase();
     return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

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
           <Button variant="outline" className="w-full justify-start">
               <Edit className="mr-2 h-4 w-4" /> Edit Profile
               <span className="ml-auto text-xs text-muted-foreground">(Coming Soon)</span>
           </Button>
           <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/account/orders">
                     <Package className="mr-2 h-4 w-4" /> View Order History
                </Link>
           </Button>
           {/* Add other account links like Addresses, Payment Methods etc. */}

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

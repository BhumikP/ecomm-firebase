
'use client'; // Add 'use client'

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ShoppingCart, User, Search, Menu, LogIn, LogOut, UserPlus, Settings, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge'; // Import Badge
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import type { ICartItem } from '@/models/Cart'; // For cart item type if needed for count calculation

export function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true';
    const role = localStorage.getItem('userRole');
    const userDataString = localStorage.getItem('userData');
    
    setIsLoggedIn(loggedInStatus);
    setUserRole(role);

    if (loggedInStatus && userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        setUserId(userData._id);
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
        // Handle error, e.g., clear corrupt data
        localStorage.removeItem('userData');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        setIsLoggedIn(false);
        setUserRole(null);
      }
    } else {
      setUserId(null); // Ensure userId is null if not logged in
    }
  }, []);

  const fetchCartCount = useCallback(async () => {
    if (!userId || !isLoggedIn) {
      setCartItemCount(0); // Reset count if no user or not logged in
      return;
    }
    setIsCartLoading(true);
    try {
      const response = await fetch(`/api/cart?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.cart && data.cart.items) {
          const count = data.cart.items.reduce((sum: number, item: ICartItem) => sum + item.quantity, 0);
          setCartItemCount(count);
        } else {
          setCartItemCount(0); // No cart or no items
        }
      } else {
        // Handle non-OK responses, e.g., 404 if cart doesn't exist for user yet
        console.warn(`Failed to fetch cart count, status: ${response.status}`);
        setCartItemCount(0);
      }
    } catch (error) {
      console.error("Error fetching cart count:", error);
      setCartItemCount(0); // Reset on error
    } finally {
      setIsCartLoading(false);
    }
  }, [userId, isLoggedIn]);

  useEffect(() => {
    if (isClient && userId) { // Only fetch if client and userId is available
      fetchCartCount();
    } else if (isClient && !userId) { // If client but no userId (logged out)
      setCartItemCount(0);
    }
  }, [isClient, userId, fetchCartCount]);

  useEffect(() => {
    const handleCartUpdate = () => {
      console.log('Cart updated event received, refetching count...');
      fetchCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [fetchCartCount]);


  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
    setUserRole(null);
    setUserId(null); // Clear userId on logout
    setCartItemCount(0); // Reset cart count on logout
    router.push('/');
  };

  if (!isClient) {
     return (
        <header className="bg-secondary shadow-sm sticky top-0 z-50 h-16 animate-pulse">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center h-full">
                <div className="h-6 w-20 bg-muted rounded"></div>
                <div className="flex items-center gap-4">
                    <div className="h-8 w-20 bg-muted rounded"></div>
                    <div className="h-8 w-20 bg-muted rounded"></div>
                </div>
            </div>
        </header>
     );
  }


  return (
    <header className="bg-secondary shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4 md:gap-8">
          <Link href="/" className="text-2xl font-bold text-primary">
            eShop
          </Link>
          <div className="relative hidden md:block">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input placeholder="Search for products..." className="pl-10 w-64 lg:w-96" />
          </div>
        </div>

         <div className="md:hidden flex items-center gap-1">
             <Sheet>
               <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Search className="h-5 w-5" />
                        <span className="sr-only">Search Products</span>
                    </Button>
               </SheetTrigger>
                <SheetContent side="top" className="pt-12">
                    <div className="relative container mx-auto px-4">
                        <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search for products..." className="pl-10 w-full" />
                    </div>
                </SheetContent>
             </Sheet>

             <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle Navigation</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right">
                    <div className="flex flex-col space-y-2 pt-8">
                        <SheetClose asChild>
                             <Button variant="ghost" asChild className="justify-start relative">
                                <Link href="/cart">
                                    <ShoppingCart className="mr-2 h-4 w-4" /> Cart
                                    {isLoggedIn && cartItemCount > 0 && (
                                      <Badge variant="destructive" className="absolute top-1 right-1 text-xs px-1.5 py-0.5 h-4 min-w-[1rem] flex items-center justify-center">
                                        {cartItemCount}
                                      </Badge>
                                    )}
                                </Link>
                            </Button>
                        </SheetClose>

                        {isLoggedIn ? (
                           <>
                               <SheetClose asChild>
                                   <Button variant="ghost" asChild className="justify-start">
                                        <Link href="/account">
                                            <User className="mr-2 h-4 w-4" /> My Account
                                        </Link>
                                    </Button>
                               </SheetClose>
                                {userRole === 'admin' && (
                                    <SheetClose asChild>
                                        <Button variant="ghost" asChild className="justify-start">
                                            <Link href="/admin">
                                                <Settings className="mr-2 h-4 w-4" /> Admin Panel
                                            </Link>
                                        </Button>
                                     </SheetClose>
                                )}
                               <SheetClose asChild>
                                   <Button variant="ghost" onClick={handleLogout} className="justify-start text-destructive hover:text-destructive">
                                        <LogOut className="mr-2 h-4 w-4" /> Logout
                                    </Button>
                               </SheetClose>
                            </>
                        ) : (
                           <>
                               <SheetClose asChild>
                                   <Button variant="ghost" asChild className="justify-start">
                                        <Link href="/auth/login">
                                            <LogIn className="mr-2 h-4 w-4" /> Login
                                        </Link>
                                    </Button>
                               </SheetClose>
                               <SheetClose asChild>
                                   <Button variant="ghost" asChild className="justify-start">
                                        <Link href="/auth/register">
                                            <UserPlus className="mr-2 h-4 w-4" /> Register
                                        </Link>
                                    </Button>
                               </SheetClose>
                            </>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>

        <div className="hidden md:flex items-center gap-2">
           <Button variant="ghost" asChild size="sm" className="relative">
             <Link href="/cart" aria-label="View Shopping Cart">
               <ShoppingCart className="mr-1 h-5 w-5" />
               Cart
                {isLoggedIn && cartItemCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 text-xs px-1 py-0 h-4 min-w-[1rem] flex items-center justify-center">
                    {isCartLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : cartItemCount}
                  </Badge>
                )}
             </Link>
           </Button>

           {isLoggedIn ? (
             <>
               <Button variant="ghost" asChild size="sm">
                 <Link href="/account" aria-label="Access User Account">
                   <User className="mr-1 h-5 w-5" />
                   Account
                 </Link>
               </Button>
                {userRole === 'admin' && (
                   <Button variant="outline" asChild size="sm">
                        <Link href="/admin">Admin</Link>
                   </Button>
                )}
               <Button variant="ghost" onClick={handleLogout} size="sm" className="text-destructive hover:text-destructive">
                 <LogOut className="mr-1 h-5 w-5" />
                 Logout
               </Button>
             </>
           ) : (
             <>
               <Button variant="ghost" asChild size="sm">
                 <Link href="/auth/login" aria-label="Login">
                   <LogIn className="mr-1 h-5 w-5" />
                   Login
                 </Link>
               </Button>
               <Button variant="outline" asChild size="sm">
                    <Link href="/auth/register">Register</Link>
               </Button>
             </>
           )}
        </div>
      </nav>
    </header>
  );
}

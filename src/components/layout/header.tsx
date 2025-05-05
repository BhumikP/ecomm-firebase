'use client'; // Add 'use client'

import Link from 'next/link';
import { useEffect, useState } from 'react'; // Import useEffect and useState
import { useRouter } from 'next/navigation'; // Import useRouter
import { Button } from '@/components/ui/button';
import { ShoppingCart, User, Search, Menu, LogIn, LogOut, UserPlus, Settings } from 'lucide-react'; // Import LogIn, LogOut, UserPlus
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose, // Import SheetClose
} from "@/components/ui/sheet";

export function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false); // Track if component has mounted
  const router = useRouter();

  useEffect(() => {
    setIsClient(true); // Component has mounted
    // Check login status from localStorage only on the client side
    const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true';
    const role = localStorage.getItem('userRole');
    setIsLoggedIn(loggedInStatus);
    setUserRole(role);
  }, []); // Empty dependency array ensures this runs only once on mount


  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    setIsLoggedIn(false);
    setUserRole(null);
    // Optionally redirect to home or login page after logout
    router.push('/');
    // Optionally show a toast message
    // toast({ title: "Logged Out", description: "You have been successfully logged out." });
  };

  // Avoid rendering different content on server vs client initially
  if (!isClient) {
     // Render a placeholder or null during server render/initial client render before hydration
     return (
        <header className="bg-secondary shadow-sm sticky top-0 z-50 h-16 animate-pulse">
             {/* Simple skeleton header */}
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
          {/* Desktop Search */}
          <div className="relative hidden md:block">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input placeholder="Search for products..." className="pl-10 w-64 lg:w-96" />
          </div>
        </div>

        {/* Mobile Menu & Search Trigger */}
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
                    {/* Optionally add a search button here */}
                </SheetContent>
             </Sheet>

             {/* Mobile Navigation Menu */}
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
                             <Button variant="ghost" asChild className="justify-start">
                                <Link href="/cart">
                                    <ShoppingCart className="mr-2 h-4 w-4" /> Cart
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
                         {/* Add other mobile nav links here */}
                    </div>
                </SheetContent>
            </Sheet>
        </div>


        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
           <Button variant="ghost" asChild size="sm">
             <Link href="/cart" aria-label="View Shopping Cart">
               <ShoppingCart className="mr-1 h-5 w-5" />
               Cart
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

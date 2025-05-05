import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShoppingCart, User, Search, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Header() {
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
         <div className="md:hidden flex items-center gap-2">
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
                    {/* Mobile Navigation Links */}
                    <div className="flex flex-col space-y-4 pt-8">
                        <Button variant="ghost" asChild className="justify-start">
                            <Link href="/cart">
                                <ShoppingCart className="mr-2 h-4 w-4" /> Cart
                            </Link>
                        </Button>
                        <Button variant="ghost" asChild className="justify-start">
                            <Link href="/account">
                                <User className="mr-2 h-4 w-4" /> Account
                            </Link>
                        </Button>
                         <Button variant="ghost" asChild className="justify-start">
                            <Link href="/admin">
                                Admin Panel
                            </Link>
                        </Button>
                        {/* Add other mobile nav links here */}
                    </div>
                </SheetContent>
            </Sheet>
        </div>


        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
           <Button variant="ghost" asChild>
             <Link href="/cart" aria-label="View Shopping Cart">
               <ShoppingCart className="mr-1 h-5 w-5" />
               Cart
             </Link>
           </Button>
           <Button variant="ghost" asChild>
             <Link href="/account" aria-label="Access User Account">
               <User className="mr-1 h-5 w-5" />
               Account
             </Link>
           </Button>
           <Button variant="outline" asChild>
                <Link href="/admin">Admin</Link>
           </Button>
        </div>
      </nav>
       {/* Mobile Search Bar - only visible on mobile below nav */}
       {/*
        <div className="md:hidden px-4 pb-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search for products..." className="pl-10 w-full" />
            </div>
       </div>
       */}
    </header>
  );
}

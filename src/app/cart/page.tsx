'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Trash2, Minus, Plus, ArrowLeft, ShoppingCart } from 'lucide-react'; // Import ShoppingCart
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';


// Define Cart Item Type
interface CartItem {
  id: string; // Use product ID as the unique key in the cart
  image: string;
  title: string;
  price: number; // Price *per unit* at the time of adding (or current price)
  quantity: number;
  discount?: number | null; // Optional: store discount for display
}

// Mock Cart Data (replace with actual state/context management)
const initialCartItems: CartItem[] = [
  { id: '1', image: 'https://picsum.photos/100/100?random=1', title: 'Stylish T-Shirt', price: 25.99, quantity: 1, discount: 10 },
  { id: '2', image: 'https://picsum.photos/100/100?random=2', title: 'Wireless Headphones', price: 79.99, quantity: 1 },
  { id: '4', image: 'https://picsum.photos/100/100?random=4', title: 'Running Shoes', price: 102.00, quantity: 1, discount: 15 }, // Price after discount
];

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching cart items (e.g., from localStorage or API)
    setIsLoading(true);
    const fetchCart = async () => {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
      // In real app, load from state management or API
      setCartItems(initialCartItems);
      setIsLoading(false);
    };
    fetchCart();
  }, []);

  const handleQuantityChange = (itemId: string, change: number) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(1, item.quantity + change); // Ensure quantity is at least 1
           if (newQuantity !== item.quantity) {
                // Optionally show toast for quantity update
                // toast({ description: `Quantity for ${item.title} updated.`});
           }
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0) // Remove item if quantity becomes 0 (though button prevents this now)
    );
  };

  const handleRemoveItem = (itemId: string, itemTitle: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
    toast({
      title: "Item Removed",
      description: `${itemTitle} has been removed from your cart.`,
      variant: "destructive", // Optional: use destructive variant
    });
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  };

  const subtotal = calculateSubtotal();
  // Add calculations for shipping, taxes, discounts later
  const total = subtotal; // Placeholder total

  const handleCheckout = () => {
      // TODO: Implement checkout logic (navigate to checkout page, call API, etc.)
      console.log("Proceeding to checkout with items:", cartItems);
      toast({ title: "Redirecting to Checkout", description: "Please wait..." });
      // Example redirect (implement checkout page later)
      // router.push('/checkout');
  }


  return (
     <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
            <Button variant="outline" size="sm" asChild className="mb-6">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Continue Shopping
                </Link>
            </Button>

            <h1 className="text-3xl font-bold mb-6">Your Shopping Cart</h1>

            {isLoading ? (
                 <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-4">
                         {[...Array(2)].map((_, i) => (
                            <Card key={i} className="p-4 flex gap-4 items-center">
                                 <Skeleton className="h-24 w-24 rounded-md bg-muted" />
                                 <div className="flex-grow space-y-2">
                                    <Skeleton className="h-5 w-3/4 bg-muted" />
                                    <Skeleton className="h-4 w-1/4 bg-muted" />
                                 </div>
                                 <div className="flex items-center gap-2">
                                     <Skeleton className="h-8 w-8 bg-muted rounded" />
                                     <Skeleton className="h-6 w-8 bg-muted" />
                                     <Skeleton className="h-8 w-8 bg-muted rounded" />
                                 </div>
                                 <Skeleton className="h-8 w-8 bg-muted rounded" />
                            </Card>
                         ))}
                    </div>
                    <Card className="md:col-span-1 h-fit">
                        <CardHeader><Skeleton className="h-6 w-3/4 bg-muted" /></CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-5 w-full bg-muted" />
                            <Skeleton className="h-5 w-full bg-muted" />
                            <Skeleton className="h-10 w-full bg-muted rounded-md" />
                        </CardContent>
                    </Card>
                 </div>
            ) : cartItems.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8 items-start">
            {/* Cart Items List */}
            <div className="md:col-span-2 space-y-4">
                {cartItems.map(item => (
                <Card key={item.id} className="p-4 flex flex-col sm:flex-row gap-4 items-center">
                    <Image
                        src={item.image}
                        alt={item.title}
                        width={100}
                        height={100}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-md border"
                        data-ai-hint="cart product thumbnail"
                    />
                    <div className="flex-grow text-center sm:text-left">
                    <Link href={`/products/${item.id}`} className="font-medium hover:text-primary">{item.title}</Link>
                    <p className="text-sm text-muted-foreground">
                        ₹{item.price.toFixed(2)} each
                        {item.discount && <span className="ml-2 text-xs text-destructive">({item.discount}% off applied)</span>}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleQuantityChange(item.id, -1)}
                        disabled={item.quantity <= 1}
                    >
                        <Minus className="h-4 w-4" />
                        <span className="sr-only">Decrease quantity</span>
                    </Button>
                    <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                            const newQuantity = parseInt(e.target.value, 10);
                            if (!isNaN(newQuantity) && newQuantity >= 1) {
                                // Calculate diff and call handleQuantityChange
                                handleQuantityChange(item.id, newQuantity - item.quantity);
                            }
                         }}
                        className="w-14 h-8 text-center px-1" // Adjust size and padding
                         />
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleQuantityChange(item.id, 1)}
                    >
                        <Plus className="h-4 w-4" />
                         <span className="sr-only">Increase quantity</span>
                    </Button>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveItem(item.id, item.title)}
                    >
                    <Trash2 className="h-4 w-4" />
                     <span className="sr-only">Remove item</span>
                    </Button>
                </Card>
                ))}
            </div>

            {/* Order Summary */}
            <Card className="md:col-span-1 sticky top-20"> {/* Make summary sticky */}
                <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                    <span>Taxes</span>
                    <span>Calculated at checkout</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                    <span>Estimated Total</span>
                    <span>₹{total.toFixed(2)}</span>
                </div>
                </CardContent>
                <CardFooter>
                <Button className="w-full" onClick={handleCheckout}>
                    Proceed to Checkout
                </Button>
                </CardFooter>
            </Card>
            </div>
        ) : (
            <div className="text-center py-16">
                <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-xl font-semibold mb-2">Your cart is empty</p>
                <p className="text-muted-foreground mb-6">Looks like you haven't added anything to your cart yet.</p>
                <Button asChild>
                    <Link href="/">Start Shopping</Link>
                </Button>
            </div>
        )}
      </main>
        <Footer />
    </div>
  );
}
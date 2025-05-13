
// src/app/cart/page.tsx
'use client';

import { useState, useEffect, useCallback }
from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Trash2, Minus, Plus, ArrowLeft, ShoppingCart, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import type { ICart, ICartItem } from '@/models/Cart'; // Import backend types
import type { IProduct } from '@/models/Product'; // For populated product type

// Frontend representation of a cart item after population
interface PopulatedCartItem extends Omit<ICartItem, 'product'> {
  _id: string; // cart item's own _id
  product: Pick<IProduct, '_id' | 'title' | 'thumbnailUrl' | 'stock' | 'colors' | 'minOrderQuantity' | 'price' | 'discount'>; // Populated product details
}

interface PopulatedCart extends Omit<ICart, 'items' | 'userId'> {
  _id: string;
  userId: string; // Assuming userId is a string on frontend
  items: PopulatedCartItem[];
}

interface StoreSettings {
  taxPercentage: number;
  shippingCharge: number;
}


export default function CartPage() {
  const [cart, setCart] = useState<PopulatedCart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null); // Store cartItemId of item being updated
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);


  useEffect(() => {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      setUserId(userData._id);
    } else {
      // Handle user not logged in - redirect or show message
      toast({ variant: "destructive", title: "Not Logged In", description: "Please log in to view your cart."});
      setIsLoading(false);
      setIsSettingsLoading(false);
      // Consider redirecting: router.push('/auth/login');
    }
  }, [toast]);

  const fetchCart = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cart?userId=${userId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch cart');
      }
      const data = await response.json();
      setCart(data.cart as PopulatedCart);
      window.dispatchEvent(new CustomEvent('cartUpdated')); // Notify header
    } catch (error: any) {
      console.error("Error fetching cart:", error);
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

   const fetchStoreSettings = useCallback(async () => {
    setIsSettingsLoading(true);
    try {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch store settings');
      }
      const data = await response.json();
      if (data.settings) {
        setStoreSettings({
          taxPercentage: data.settings.taxPercentage || 0,
          shippingCharge: data.settings.shippingCharge || 0,
        });
      } else {
        setStoreSettings({ taxPercentage: 0, shippingCharge: 0 }); // Default if not found
      }
    } catch (error: any) {
      console.error("Error fetching store settings:", error);
      toast({ variant: "destructive", title: "Settings Error", description: "Could not load store settings for cart." });
      setStoreSettings({ taxPercentage: 0, shippingCharge: 0 }); // Default on error
    } finally {
      setIsSettingsLoading(false);
    }
  }, [toast]);


  useEffect(() => {
    if (userId) {
      fetchCart();
      fetchStoreSettings();
    }
  }, [userId, fetchCart, fetchStoreSettings]);

  const handleQuantityChange = async (cartItemId: string, currentQuantity: number, change: number, minOrderQty: number, stock: number) => {
    const newQuantity = Math.max(minOrderQty, currentQuantity + change);
    if (newQuantity === currentQuantity) return;
    if (newQuantity > stock) {
      toast({ variant: 'destructive', title: 'Stock Limit', description: `Only ${stock} items available.` });
      return;
    }


    setIsUpdating(cartItemId);
    try {
      const response = await fetch(`/api/cart/${cartItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newQuantity }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update quantity');
      }
      setCart(data.cart as PopulatedCart);
      window.dispatchEvent(new CustomEvent('cartUpdated')); // Notify header
      // toast({ description: `Quantity updated.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveItem = async (cartItemId: string, itemTitle: string) => {
    if (!userId) return;
    setIsUpdating(cartItemId); // Use isUpdating to show loader on the item being removed
    try {
      const response = await fetch(`/api/cart/${cartItemId}?userId=${userId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove item');
      }
      setCart(data.cart as PopulatedCart);
      window.dispatchEvent(new CustomEvent('cartUpdated')); // Notify header
      toast({
        title: "Item Removed",
        description: `${itemTitle} has been removed from your cart.`,
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Removal Failed", description: error.message });
    } finally {
      setIsUpdating(null);
    }
  };
  
  const calculateItemDisplayPrice = (item: PopulatedCartItem) => {
    // priceSnapshot already has the discounted price per unit
    return item.priceSnapshot;
  };

  const calculateSubtotal = () => {
    if (!cart) return 0;
    return cart.items.reduce((acc, item) => acc + calculateItemDisplayPrice(item) * item.quantity, 0);
  };

  const subtotal = calculateSubtotal();
  const taxAmount = storeSettings ? subtotal * (storeSettings.taxPercentage / 100) : 0;
  const shippingCost = storeSettings ? storeSettings.shippingCharge : 0;
  const total = subtotal + taxAmount + shippingCost;

  const handleCheckout = () => {
    console.log("Proceeding to checkout with cart:", cart, "Subtotal:", subtotal, "Tax:", taxAmount, "Shipping:", shippingCost, "Total:", total);
    toast({ title: "Redirecting to Checkout", description: "This feature is coming soon!" });
    // router.push('/checkout');
  };

  if (!userId && !isLoading && !isSettingsLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center text-center">
          <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-xl font-semibold mb-2">Your Cart Awaits</p>
          <p className="text-muted-foreground mb-6">Log in to see your items and continue shopping.</p>
          <Button asChild>
            <Link href="/auth/login">Login</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
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

            {(isLoading || isSettingsLoading) && !cart ? (
                 <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-4">
                         {[...Array(2)].map((_, i) => (
                            <Card key={i} className="p-4 flex gap-4 items-center animate-pulse">
                                 <Skeleton className="h-24 w-24 rounded-md bg-muted" />
                                 <div className="flex-grow space-y-2">
                                    <Skeleton className="h-5 w-3/4 bg-muted" />
                                    <Skeleton className="h-4 w-1/4 bg-muted" />
                                    <Skeleton className="h-4 w-1/2 bg-muted" />
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
                    <Card className="md:col-span-1 h-fit animate-pulse">
                        <CardHeader><Skeleton className="h-6 w-3/4 bg-muted" /></CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-5 w-full bg-muted" />
                            <Skeleton className="h-5 w-full bg-muted" />
                             <Skeleton className="h-5 w-full bg-muted" />
                            <Skeleton className="h-5 w-full bg-muted" />
                            <Skeleton className="h-10 w-full bg-muted rounded-md" />
                        </CardContent>
                    </Card>
                 </div>
            ) : cart && cart.items.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-2 space-y-4">
                {cart.items.map(item => {
                    const itemDisplayPrice = calculateItemDisplayPrice(item);
                    const productStock = item.selectedColorSnapshot && item.product.colors 
                                        ? item.product.colors.find(c => c.name === item.selectedColorSnapshot?.name)?.stock ?? 0
                                        : item.product.stock;
                    const minOrderQty = item.product.minOrderQuantity || 1;

                    return (
                        <Card key={item._id} className="p-4 flex flex-col sm:flex-row gap-4 items-center">
                            <Image
                                src={item.imageSnapshot || 'https://picsum.photos/100/100?random=placeholder'}
                                alt={item.nameSnapshot}
                                width={100}
                                height={100}
                                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-md border"
                                data-ai-hint="cart product thumbnail"
                            />
                            <div className="flex-grow text-center sm:text-left">
                                <Link href={`/products/${item.product._id}`} className="font-medium hover:text-primary">{item.nameSnapshot}</Link>
                                {item.selectedColorSnapshot && (
                                    <p className="text-sm text-muted-foreground">Color: {item.selectedColorSnapshot.name}</p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                    ₹{itemDisplayPrice.toFixed(2)} each
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleQuantityChange(item._id, item.quantity, -1, minOrderQty, productStock)}
                                disabled={isUpdating === item._id || item.quantity <= minOrderQty}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  if (!isNaN(val) && val >= minOrderQty && val <= productStock) {
                                    handleQuantityChange(item._id, item.quantity, val - item.quantity, minOrderQty, productStock);
                                  } else if (!isNaN(val) && val < minOrderQty) {
                                    handleQuantityChange(item._id, item.quantity, minOrderQty - item.quantity, minOrderQty, productStock);
                                  } else if (!isNaN(val) && val > productStock) {
                                    handleQuantityChange(item._id, item.quantity, productStock - item.quantity, minOrderQty, productStock);
                                    toast({variant: "destructive", title: "Stock limit reached", description: `Only ${productStock} available`})
                                  }
                                }}
                                className="w-14 h-8 text-center px-1"
                                disabled={isUpdating === item._id}
                                min={minOrderQty}
                                max={productStock}
                                />
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleQuantityChange(item._id, item.quantity, 1, minOrderQty, productStock)}
                                disabled={isUpdating === item._id || item.quantity >= productStock}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleRemoveItem(item._id, item.nameSnapshot)}
                                disabled={isUpdating === item._id}
                            >
                                {isUpdating === item._id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                            </Button>
                        </Card>
                    );
                })}
            </div>

            <Card className="md:col-span-1 sticky top-20">
                <CardHeader> <CardTitle>Order Summary</CardTitle> </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    {isSettingsLoading ? (
                         <>
                           <Skeleton className="h-5 w-full bg-muted" />
                           <Skeleton className="h-5 w-full bg-muted" />
                         </>
                    ) : storeSettings ? (
                         <>
                             <div className="flex justify-between text-muted-foreground">
                                 <span>Shipping</span>
                                 <span>₹{shippingCost.toFixed(2)}</span>
                             </div>
                             <div className="flex justify-between text-muted-foreground">
                                <span>Tax ({storeSettings.taxPercentage}%)</span>
                                <span>₹{taxAmount.toFixed(2)}</span>
                            </div>
                         </>
                    ) : (
                        <>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Shipping</span><span>Loading...</span>
                          </div>
                           <div className="flex justify-between text-muted-foreground">
                            <span>Tax</span><span>Loading...</span>
                          </div>
                        </>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                        <span>Estimated Total</span>
                        <span>{isSettingsLoading ? <Skeleton className="h-6 w-20 inline-block" /> : `₹${total.toFixed(2)}`}</span>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={handleCheckout} disabled={isLoading || isSettingsLoading || isUpdating !== null || (cart?.items.length ?? 0) === 0}>
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


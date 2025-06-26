
// src/app/cart/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } // Added useRef
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
import type { ICart, ICartItem } from '@/models/Cart';
import type { IProduct } from '@/models/Product';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


interface PopulatedCartItem extends Omit<ICartItem, 'product'> {
  _id: string;
  product: Pick<IProduct, '_id' | 'title' | 'thumbnailUrl' | 'stock' | 'colors' | 'minOrderQuantity' | 'price' | 'discount'>;
}

interface PopulatedCart extends Omit<ICart, 'items' | 'userId'> {
  _id: string;
  userId: string;
  items: PopulatedCartItem[];
}

interface StoreSettings {
  taxPercentage: number;
  shippingCharge: number;
}


export default function CartPage() {
  const [cart, setCart] = useState<PopulatedCart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [itemInputValues, setItemInputValues] = useState<Record<string, string>>({});
  const debounceButtonTimers = useRef<Record<string, NodeJS.Timeout | undefined>>({});


  useEffect(() => {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      setUserId(userData._id);
    } else {
      toast({ variant: "destructive", title: "Not Logged In", description: "Please log in to view your cart."});
      setIsLoading(false);
      setIsSettingsLoading(false);
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
      const fetchedCart = data.cart as PopulatedCart;
      setCart(fetchedCart);

      if (fetchedCart?.items) {
        const initialInputs: Record<string, string> = {};
        fetchedCart.items.forEach(item => {
            initialInputs[item._id] = String(item.quantity);
        });
        setItemInputValues(initialInputs);
      }
      window.dispatchEvent(new CustomEvent('cartUpdated'));
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
        setStoreSettings({ taxPercentage: 0, shippingCharge: 0 });
      }
    } catch (error: any) {
      console.error("Error fetching store settings:", error);
      toast({ variant: "destructive", title: "Settings Error", description: "Could not load store settings for cart." });
      setStoreSettings({ taxPercentage: 0, shippingCharge: 0 });
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

  useEffect(() => {
    return () => {
        Object.values(debounceButtonTimers.current).forEach(timerId => {
            if (timerId) clearTimeout(timerId);
        });
    };
  }, []);


  const handleItemInputChange = (itemId: string, rawValue: string) => {
    setItemInputValues(prev => ({ ...prev, [itemId]: rawValue }));
  };

  useEffect(() => {
      if (!cart?.items || Object.keys(itemInputValues).length === 0 || !userId) return;

      const itemIdsToProcess = Object.keys(itemInputValues).filter(itemId => {
          const cartItem = cart.items.find(ci => ci._id === itemId);
          return cartItem && String(cartItem.quantity) !== itemInputValues[itemId];
      });

      if (itemIdsToProcess.length === 0) return;

      const processItem = async (itemId: string) => {
          const rawValue = itemInputValues[itemId];
          const cartItem = cart.items.find(ci => ci._id === itemId);

          if (!cartItem) return;

          const minOrderQty = cartItem.product.minOrderQuantity || 1;
          const productStock = cartItem.selectedColorSnapshot && cartItem.product.colors
              ? cartItem.product.colors.find(c => c.name === cartItem.selectedColorSnapshot?.name)?.stock ?? 0
              : cartItem.product.stock;

          let numValue = parseInt(rawValue, 10);

          if (isNaN(numValue)) {
              setItemInputValues(prev => ({ ...prev, [itemId]: String(cartItem.quantity) }));
              return;
          }

          let validatedQty = numValue;
          if (validatedQty < minOrderQty) validatedQty = minOrderQty;
          if (validatedQty > productStock) validatedQty = productStock;

          if (validatedQty !== cartItem.quantity) {
              setIsUpdating(itemId);
              try {
                  const response = await fetch(`/api/cart/${itemId}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId, newQuantity: validatedQty }),
                  });
                  const data = await response.json();
                  if (!response.ok) throw new Error(data.message || 'Failed to update quantity');

                  setCart(data.cart as PopulatedCart);
                  setItemInputValues(prev => ({ ...prev, [itemId]: String(data.cart.items.find((i: PopulatedCartItem) => i._id === itemId)?.quantity || validatedQty) }));
                  window.dispatchEvent(new CustomEvent('cartUpdated'));
              } catch (error: any) {
                  toast({ variant: "destructive", title: "Update Failed", description: error.message });
                  setItemInputValues(prev => ({ ...prev, [itemId]: String(cartItem.quantity) }));
              } finally {
                  setIsUpdating(null);
              }
          } else if (rawValue !== String(validatedQty)) {
              setItemInputValues(prev => ({ ...prev, [itemId]: String(validatedQty) }));
          }
      };

      const timer = setTimeout(() => {
          itemIdsToProcess.forEach(processItem);
      }, 750);

      return () => clearTimeout(timer);

  }, [itemInputValues, cart, userId, toast, setCart]);


  const handleQuantityButtonClick = (itemId: string, item: PopulatedCartItem, change: number) => {
    if (!userId) return;

    const minOrderQty = item.product.minOrderQuantity || 1;
    const productStock = item.selectedColorSnapshot && item.product.colors
        ? item.product.colors.find(c => c.name === item.selectedColorSnapshot?.name)?.stock ?? 0
        : item.product.stock;

    let currentDisplayQuantity = parseInt(itemInputValues[itemId], 10);
    if (isNaN(currentDisplayQuantity)) {
        currentDisplayQuantity = item.quantity;
    }

    let newQuantity = currentDisplayQuantity + change;

    if (newQuantity < minOrderQty) newQuantity = minOrderQty;
    if (newQuantity > productStock) newQuantity = productStock;

    setItemInputValues(prev => ({ ...prev, [itemId]: String(newQuantity) }));
    setIsUpdating(itemId);

    if (debounceButtonTimers.current[itemId]) {
        clearTimeout(debounceButtonTimers.current[itemId]);
    }

    debounceButtonTimers.current[itemId] = setTimeout(async () => {
        const upToDateCartItem = cart?.items.find(ci => ci._id === itemId);
        if (upToDateCartItem && upToDateCartItem.quantity === newQuantity) {
            setIsUpdating(null);
             if (itemInputValues[itemId] !== String(newQuantity)) {
                setItemInputValues(prev => ({ ...prev, [itemId]: String(newQuantity) }));
            }
            return;
        }

        try {
            const response = await fetch(`/api/cart/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, newQuantity }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update quantity');
            }
            setCart(data.cart as PopulatedCart);
            window.dispatchEvent(new CustomEvent('cartUpdated'));
            const updatedItemFromServer = data.cart.items.find((i: PopulatedCartItem) => i._id === itemId);
            setItemInputValues(prev => ({ ...prev, [itemId]: String(updatedItemFromServer?.quantity || newQuantity) }));

        } catch (error: any) {
            toast({ variant: "destructive", title: "Update Failed", description: error.message });
            const currentCartItem = cart?.items.find(i => i._id === itemId);
            if (currentCartItem) {
                setItemInputValues(prev => ({ ...prev, [itemId]: String(currentCartItem.quantity) }));
            }
        } finally {
            setIsUpdating(null);
        }
    }, 750);
};


  const handleRemoveItem = async (cartItemId: string, itemTitle: string) => {
    if (!userId) return;
    setIsUpdating(cartItemId);
    try {
      const response = await fetch(`/api/cart/${cartItemId}?userId=${userId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove item');
      }
      setCart(data.cart as PopulatedCart);
      setItemInputValues(prev => {
          const newInputs = {...prev};
          delete newInputs[cartItemId];
          return newInputs;
      });
      window.dispatchEvent(new CustomEvent('cartUpdated'));
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

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
                            <Card key={i} className="p-4 animate-pulse">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]"><Skeleton className="h-5 w-full bg-muted" /></TableHead>
                                            <TableHead><Skeleton className="h-5 w-3/4 bg-muted" /></TableHead>
                                            <TableHead className="text-right"><Skeleton className="h-5 w-1/4 bg-muted ml-auto" /></TableHead>
                                            <TableHead className="text-center w-[120px]"><Skeleton className="h-5 w-3/4 bg-muted mx-auto" /></TableHead>
                                            <TableHead className="text-right"><Skeleton className="h-5 w-1/4 bg-muted ml-auto" /></TableHead>
                                            <TableHead className="w-[50px]"><Skeleton className="h-8 w-8 bg-muted rounded" /></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell><Skeleton className="h-24 w-24 rounded-md bg-muted" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-full bg-muted mb-1" /><Skeleton className="h-4 w-3/4 bg-muted" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-5 w-16 bg-muted ml-auto" /></TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Skeleton className="h-8 w-8 bg-muted rounded" />
                                                    <Skeleton className="h-6 w-10 bg-muted" />
                                                    <Skeleton className="h-8 w-8 bg-muted rounded" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-5 w-16 bg-muted ml-auto" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-8 bg-muted rounded" /></TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
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
            <div className="md:col-span-2">
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px] sm:w-[100px]">Item</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-center w-[130px] sm:w-[150px]">Quantity</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="w-[50px]"> </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cart.items.map(item => {
                                    const itemDisplayPrice = calculateItemDisplayPrice(item);
                                    const itemSubtotal = itemDisplayPrice * item.quantity;
                                    const productStock = item.selectedColorSnapshot && item.product.colors
                                                        ? item.product.colors.find(c => c.name === item.selectedColorSnapshot?.name)?.stock ?? 0
                                                        : item.product.stock;
                                    const minOrderQty = item.product.minOrderQuantity || 1;

                                    return (
                                        <TableRow key={item._id}>
                                            <TableCell>
                                                <Image
                                                    src={item.imageSnapshot || 'https://placehold.co/100x100.png'}
                                                    alt={item.nameSnapshot}
                                                    width={80}
                                                    height={80}
                                                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md border"
                                                    data-ai-hint="cart product thumbnail"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/products/${item.product._id}`} className="font-medium hover:text-primary">{item.nameSnapshot}</Link>
                                                {item.selectedColorSnapshot && (
                                                    <p className="text-xs text-muted-foreground">Color: {item.selectedColorSnapshot.name}</p>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">₹{formatCurrency(itemDisplayPrice)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-1 sm:gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => handleQuantityButtonClick(item._id, item, -1)}
                                                        disabled={isUpdating === item._id || (parseInt(itemInputValues[item._id] || String(item.quantity), 10) <= minOrderQty)}
                                                        aria-label="Decrease quantity"
                                                    >
                                                        {isUpdating === item._id && (itemInputValues[item._id] === String(parseInt(itemInputValues[item._id] || "0") -1) )? <Loader2 className="h-4 w-4 animate-spin"/> : <Minus className="h-4 w-4" />}
                                                    </Button>
                                                    <Input
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        value={itemInputValues[item._id] ?? ''}
                                                        onChange={(e) => handleItemInputChange(item._id, e.target.value)}
                                                        className="w-12 h-8 text-center px-1"
                                                        disabled={isUpdating === item._id}
                                                        aria-label={`Quantity for ${item.nameSnapshot}`}
                                                        />
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => handleQuantityButtonClick(item._id, item, 1)}
                                                        disabled={isUpdating === item._id || (parseInt(itemInputValues[item._id] || String(item.quantity), 10) >= productStock)}
                                                        aria-label="Increase quantity"
                                                    >
                                                        {isUpdating === item._id && (itemInputValues[item._id] === String(parseInt(itemInputValues[item._id] || "0") + 1) )? <Loader2 className="h-4 w-4 animate-spin"/> : <Plus className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">₹{formatCurrency(itemSubtotal)}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={() => handleRemoveItem(item._id, item.nameSnapshot)}
                                                    disabled={isUpdating === item._id}
                                                    aria-label={`Remove ${item.nameSnapshot} from cart`}
                                                >
                                                    {isUpdating === item._id && !debounceButtonTimers.current[item._id] ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>


            <Card className="md:col-span-1 sticky top-20">
                <CardHeader> <CardTitle>Order Summary</CardTitle> </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>₹{formatCurrency(subtotal)}</span>
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
                                 <span>₹{formatCurrency(shippingCost)}</span>
                             </div>
                             <div className="flex justify-between text-muted-foreground">
                                <span>Tax ({storeSettings.taxPercentage}%)</span>
                                <span>₹{formatCurrency(taxAmount)}</span>
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
                        <span>{isSettingsLoading ? <Skeleton className="h-6 w-20 inline-block" /> : `₹${formatCurrency(total)}`}</span>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full" size="lg" disabled={isLoading || isSettingsLoading || isUpdating !== null || (cart?.items.length ?? 0) === 0}>
                        <Link href="/checkout">Proceed to Checkout</Link>
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

// src/app/checkout/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { ICart, ICartItem } from '@/models/Cart';
import type { IProduct } from '@/models/Product';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const addressSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  street: z.string().min(5, { message: "Street address is required." }),
  city: z.string().min(2, { message: "City is required." }),
  state: z.string().min(2, { message: "State is required." }),
  zip: z.string().min(5, { message: "A valid ZIP code is required." }).max(10),
  country: z.string().min(2, { message: "Country is required." }),
  phone: z.string().min(10, { message: "A valid 10-digit phone number is required." }).max(15),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface PopulatedCartItem extends Omit<ICartItem, 'product'> {
  product: Pick<IProduct, '_id' | 'title' | 'thumbnailUrl'>;
}

interface PopulatedCart extends Omit<ICart, 'items'> {
  items: PopulatedCartItem[];
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<PopulatedCart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [razorpayKey, setRazorpayKey] = useState<string | null>(null);

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: "", street: "", city: "", state: "", zip: "", country: "India", phone: ""
    },
  });

  useEffect(() => {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      setUserId(userData._id);
      form.setValue('name', userData.name || '');
    } else {
      router.push('/auth/login?redirect=/checkout');
    }
  }, [router, form]);

  useEffect(() => {
    if (!userId) return;
    const fetchCart = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/cart?userId=${userId}`);
        const data = await response.json();
        if (!response.ok || !data.cart || data.cart.items.length === 0) {
          toast({ title: 'Your cart is empty', description: 'Redirecting you to the homepage.', variant: 'destructive' });
          router.push('/');
        } else {
          setCart(data.cart);
        }
      } catch (error) {
        toast({ title: 'Failed to load cart', variant: 'destructive' });
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCart();
  }, [userId, router, toast]);

  const subtotal = cart?.items.reduce((acc, item) => acc + item.priceSnapshot * item.quantity, 0) || 0;

  const handlePayment = async (values: AddressFormValues) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/checkout/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, shippingAddress: values }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to initiate payment.');

      setRazorpayKey(data.razorpayKeyId);

      const options = {
        key: data.razorpayKeyId,
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency,
        name: 'eShop Simplified',
        description: `Order #${data.order.orderId}`,
        order_id: data.razorpayOrder.id,
        handler: function (response: any) {
          router.push(`/payment/success?order_id=${data.order._id}`);
        },
        prefill: {
          name: values.name,
          email: JSON.parse(localStorage.getItem('userData') || '{}').email,
          contact: values.phone,
        },
        notes: {
          address: `${values.street}, ${values.city}`,
          internal_order_id: data.order._id,
        },
        theme: {
          color: '#008080',
        },
        modal: {
            ondismiss: function() {
                router.push(`/payment/failure?order_id=${data.order._id}`);
            }
        }
      };
      
      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error: any) {
      toast({ title: 'Payment Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-40 mb-6" />
          <div className="grid md:grid-cols-2 gap-8">
            <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Script id="razorpay-checkout-js" src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Button variant="outline" size="sm" asChild className="mb-6">
            <Link href="/cart"><ArrowLeft className="mr-2 h-4 w-4" />Back to Cart</Link>
          </Button>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
            <Card>
              <CardHeader><CardTitle>Shipping Information</CardTitle></CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handlePayment)} className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="street" render={({ field }) => (
                      <FormItem><FormLabel>Street Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="city" render={({ field }) => (
                        <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="state" render={({ field }) => (
                        <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="zip" render={({ field }) => (
                        <FormItem><FormLabel>ZIP Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="country" render={({ field }) => (
                        <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="submit" className="w-full mt-6" size="lg" disabled={isProcessing}>
                      {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isProcessing ? 'Processing...' : `Pay Now (₹${subtotal.toFixed(2)})`}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card className="sticky top-20">
              <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {cart?.items.map(item => (
                    <li key={item._id?.toString()} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img src={item.imageSnapshot} alt={item.nameSnapshot} className="w-16 h-16 rounded-md object-cover" />
                        <div>
                          <p className="font-medium">{item.nameSnapshot}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-medium">₹{(item.priceSnapshot * item.quantity).toFixed(2)}</p>
                    </li>
                  ))}
                </ul>
                <div className="border-t mt-4 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <p>Subtotal</p>
                    <p>₹{subtotal.toFixed(2)}</p>
                  </div>
                  {/* Shipping and tax can be added here if needed */}
                  <div className="flex justify-between font-bold text-lg">
                    <p>Total</p>
                    <p>₹{subtotal.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}

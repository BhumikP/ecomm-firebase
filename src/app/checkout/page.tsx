
// src/app/checkout/page.tsx
'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, ArrowLeft, Home, Edit2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

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

interface IShippingAddress extends AddressFormValues {
  _id?: string;
}

interface PopulatedCartItem extends Omit<ICartItem, 'product'> {
  product: Pick<IProduct, '_id' | 'title' | 'thumbnailUrl'>;
}

interface PopulatedCart extends Omit<ICart, 'items'> {
  items: PopulatedCartItem[];
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  addresses?: IShippingAddress[];
}

interface StoreSettings {
  taxPercentage: number;
  shippingCharge: number;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<PopulatedCart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [saveNewAddress, setSaveNewAddress] = useState(true);
  
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);

  const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: "", street: "", city: "", state: "", zip: "", country: "India", phone: ""
    },
  });

  useEffect(() => {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      try {
        const parsedData: UserData = JSON.parse(userDataString);
        setUserData(parsedData);
        form.setValue('name', parsedData.name || '');
        form.setValue('phone', parsedData.phone || '');
        if (parsedData.addresses && parsedData.addresses.length > 0) {
          setSelectedAddressId(parsedData.addresses[0]._id!);
        }
      } catch (e) {
        console.error("Failed to parse user data", e);
        router.push('/auth/login?redirect=/checkout');
      }
    } else {
      router.push('/auth/login?redirect=/checkout');
    }
  }, [router, form]);
  
  useEffect(() => {
    if (!userData?._id) return;

    const fetchCart = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/cart?userId=${userData._id}`);
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
  }, [userData?._id, router, toast]);

  useEffect(() => {
    const fetchStoreSettings = async () => {
      setIsSettingsLoading(true);
      try {
        const response = await fetch('/api/admin/settings');
        if (!response.ok) throw new Error('Failed to fetch store settings');
        const data = await response.json();
        setStoreSettings(data.settings || { taxPercentage: 0, shippingCharge: 0 });
      } catch (error) {
        setStoreSettings({ taxPercentage: 0, shippingCharge: 0 });
      } finally {
        setIsSettingsLoading(false);
      }
    };
    fetchStoreSettings();
  }, []);

  const handleProcessOrder = async () => {
    let shippingAddress: IShippingAddress | undefined;
    let shouldSaveAddress = false;

    if (selectedAddressId === 'new') {
      const isValid = await form.trigger();
      if (!isValid) {
        toast({ title: "Please fill out the shipping address correctly.", variant: "destructive" });
        return;
      }
      shippingAddress = form.getValues();
      shouldSaveAddress = saveNewAddress;
    } else {
      shippingAddress = userData?.addresses?.find(addr => addr._id === selectedAddressId);
    }
    
    if (!shippingAddress) {
      toast({ title: "Please select or provide a shipping address.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    if (!userData?._id) {
        toast({ title: "Error", description: "User session not found. Please log in again.", variant: "destructive" });
        setIsProcessing(false);
        return;
    }
     if (!RAZORPAY_KEY_ID) {
        toast({ title: "Configuration Error", description: "Payment gateway is not configured. Please contact support.", variant: "destructive" });
        setIsProcessing(false);
        return;
    }

    try {
        const initiateResponse = await fetch('/api/checkout/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userData._id, shippingAddress, saveAddress: shouldSaveAddress }),
        });
        const initData = await initiateResponse.json();

        if (!initiateResponse.ok) {
            throw new Error(initData.message || "Failed to initiate transaction.");
        }

        const { transactionId, razorpayOrder } = initData;

        const options = {
            key: RAZORPAY_KEY_ID,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: "eShop Simplified",
            description: `Transaction for eShop`,
            order_id: razorpayOrder.id,
            handler: async function (response: any) {
                const verifyResponse = await fetch('/api/payments/verify-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_signature: response.razorpay_signature,
                        transactionId: transactionId,
                    }),
                });
                const verificationResult = await verifyResponse.json();
                if (verifyResponse.ok && verificationResult.success) {
                    toast({ title: "Payment Successful!", description: `Order ${verificationResult.orderId} is being processed.`});
                    router.push(`/payment/success?order_id=${verificationResult.orderId}`);
                } else {
                     toast({ title: "Payment Verification Failed", description: verificationResult.message || "Please contact support.", variant: "destructive" });
                    router.push(`/payment/failure?transaction_id=${transactionId}`);
                }
            },
            prefill: {
                name: shippingAddress.name,
                email: userData.email,
                contact: shippingAddress.phone,
            },
            theme: { color: "#008080" },
            modal: {
                ondismiss: async function() {
                     toast({ title: "Payment Cancelled", description: "Your order was not completed.", variant: "default" });
                     try {
                        await fetch('/api/payments/cancel-payment', {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify({ transactionId: transactionId }),
                        });
                     } catch (cancelError) { console.error("Failed to report payment cancellation to backend:", cancelError); }
                    setIsProcessing(false);
                }
            }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();

    } catch (error: any) {
        toast({ title: "Order Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
        setIsProcessing(false);
    }
  };

  const subtotal = cart?.items.reduce((acc, item) => acc + item.priceSnapshot * item.quantity, 0) || 0;
  const taxAmount = storeSettings ? subtotal * (storeSettings.taxPercentage / 100) : 0;
  const shippingCost = storeSettings?.shippingCharge || 0;
  const grandTotal = subtotal + taxAmount + shippingCost;
  const formatCurrency = (amount: number) => amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (isLoading || isSettingsLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-40 mb-6" />
          <div className="grid md:grid-cols-2 gap-8">
            <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-80 w-full" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-56 w-full" /></CardContent></Card>
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

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader><CardTitle>1. Shipping Address</CardTitle></CardHeader>
                <CardContent>
                  <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId} className="space-y-4">
                    {userData?.addresses?.map((address) => (
                      <Label key={address._id} htmlFor={address._id} className="flex items-start gap-4 p-4 border rounded-md has-[:checked]:bg-muted has-[:checked]:border-primary transition-colors cursor-pointer">
                        <RadioGroupItem value={address._id!} id={address._id} className="mt-1" />
                        <div className="text-sm">
                          <p className="font-semibold">{address.name}</p>
                          <p>{address.street}</p>
                          <p>{address.city}, {address.state} - {address.zip}</p>
                          <p>{address.country}</p>
                          <p>Phone: {address.phone}</p>
                        </div>
                      </Label>
                    ))}
                    <Label htmlFor="new-address" className="flex items-start gap-4 p-4 border rounded-md has-[:checked]:bg-muted has-[:checked]:border-primary transition-colors cursor-pointer">
                       <RadioGroupItem value="new" id="new-address" className="mt-1" />
                       <p className="font-semibold">Add a new address</p>
                    </Label>
                  </RadioGroup>
                  
                  {selectedAddressId === 'new' && (
                    <div className="mt-6 pt-6 border-t">
                      <Form {...form}>
                        <form className="space-y-4">
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
                              <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>
                            )} />
                          </div>
                          <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <div className="flex items-center space-x-2 pt-2">
                            <Switch id="save-address-switch" checked={saveNewAddress} onCheckedChange={setSaveNewAddress} />
                            <Label htmlFor="save-address-switch">Save this address for future use</Label>
                          </div>
                        </form>
                      </Form>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                  <CardHeader><CardTitle>2. Payment</CardTitle></CardHeader>
                  <CardContent>
                      <p className="text-muted-foreground">You will be redirected to our secure payment partner, Razorpay, to complete your purchase.</p>
                  </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1 lg:sticky top-20">
              <Card>
                <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-4">
                    {cart?.items.map(item => (
                      <li key={item._id?.toString()} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <Image src={item.imageSnapshot || 'https://placehold.co/100x100.png'} alt={item.nameSnapshot} width={48} height={48} className="w-12 h-12 rounded-md object-cover border" />
                          <div>
                            <p className="font-medium line-clamp-1">{item.nameSnapshot}</p>
                            <p className="text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="font-medium">₹{formatCurrency(item.priceSnapshot * item.quantity)}</p>
                      </li>
                    ))}
                  </ul>
                  <Separator />
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Subtotal</p>
                      <p>₹{formatCurrency(subtotal)}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Shipping</p>
                      <p>₹{formatCurrency(shippingCost)}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Tax ({storeSettings?.taxPercentage || 0}%)</p>
                      <p>₹{formatCurrency(taxAmount)}</p>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <p>Total</p>
                      <p>₹{formatCurrency(grandTotal)}</p>
                    </div>
                  </div>
                   <Button onClick={handleProcessOrder} className="w-full mt-6" size="lg" disabled={isProcessing || isLoading || !cart}>
                      {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : `Proceed to Pay (₹${formatCurrency(grandTotal)})`}
                    </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}

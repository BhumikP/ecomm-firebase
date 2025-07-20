
// src/app/checkout/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
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
import { Loader2, ArrowLeft, Home, Edit2, Star, CreditCard, Truck, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import type { IShippingAddress } from '@/models/User';
import { BargainDrawer } from '@/components/checkout/bargain-drawer';
import type { BargainOutput } from '@/ai/flows/bargain-flow';

const addressSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "A valid email is required for order updates." }),
  street: z.string().min(5, { message: "Street address is required." }),
  city: z.string().min(2, { message: "City is required." }),
  state: z.string().min(2, { message: "State is required." }),
  zip: z.string().min(5, { message: "A valid ZIP code is required." }).max(10),
  country: z.string().min(2, { message: "Country is required." }),
  phone: z.string().min(10, { message: "A valid 10-digit phone number is required." }).max(15),
});

type AddressFormValues = z.infer<typeof addressSchema>;

export interface PopulatedCartItem extends Omit<ICartItem, 'product'> {
  _id: string;
  product: Pick<IProduct, '_id' | 'title' | 'thumbnailUrl' | 'price' | 'discount'>;
}

export interface PopulatedCart extends Omit<ICart, 'items'> {
  items: PopulatedCartItem[];
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  addresses?: (IShippingAddress & { _id: string })[];
}

interface StoreSettings {
  taxPercentage: number;
  shippingCharge: number;
  activePaymentGateway: 'razorpay' | 'payu';
}

type PaymentMethod = 'online' | 'cod';

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online');
  
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);

  // Bargaining state
  const [chatHistory, setChatHistory] = useState<{ author: 'user' | 'ai'; text: string }[]>([]);
  const [bargainedAmounts, setBargainedAmounts] = useState<Record<string, number>>({});
  
  const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: "", email: "", street: "", city: "", state: "", zip: "", country: "India", phone: ""
    },
  });

  useEffect(() => {
    const userDataString = localStorage.getItem('userData');
    const userEmail = localStorage.getItem('userEmail');

    if (userDataString) {
      try {
        const parsedData: UserData = JSON.parse(userDataString);
        setUserData(parsedData);
        
        const primaryAddress = parsedData.addresses?.find(addr => addr.isPrimary);
        if (primaryAddress) {
          setSelectedAddressId(primaryAddress._id);
          form.reset(primaryAddress); // Pre-fill form with primary address
        } else if (parsedData.addresses && parsedData.addresses.length > 0) {
          const firstAddress = parsedData.addresses[0];
          setSelectedAddressId(firstAddress._id);
           form.reset(firstAddress); // Pre-fill with first address
        } else {
          setSelectedAddressId('new');
          // Pre-fill new address form with user's main details
          form.setValue('name', parsedData.name || '');
          form.setValue('email', userEmail || parsedData.email || '');
          form.setValue('phone', parsedData.phone || '');
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
        const response = await fetch('/api/settings'); // Fetch from public settings endpoint
        if (!response.ok) throw new Error('Failed to fetch store settings');
        const data = await response.json();
        setStoreSettings(data);
      } catch (error) {
        console.error("Settings fetch error:", error);
        setStoreSettings({ taxPercentage: 0, shippingCharge: 0, activePaymentGateway: 'razorpay' });
      } finally {
        setIsSettingsLoading(false);
      }
    };
    fetchStoreSettings();
  }, []);

  useEffect(() => {
      if (selectedAddressId !== 'new' && userData?.addresses) {
          const address = userData.addresses.find(a => a._id === selectedAddressId);
          if (address) {
              form.reset(address);
          }
      } else {
           form.reset({
              name: userData?.name || '',
              email: localStorage.getItem('userEmail') || userData?.email || '',
              phone: userData?.phone || '',
              street: '',
              city: '',
              state: '',
              zip: '',
              country: 'India',
           });
      }
  }, [selectedAddressId, userData, form]);


    const handlePlaceCodOrder = async (shippingAddress: AddressFormValues) => {
        setIsProcessing(true);
        try {
             const response = await fetch('/api/checkout/cod', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userData!._id, shippingAddress, bargainedAmounts }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || "Failed to place Cash on Delivery order.");
            }
             toast({ title: "Order Placed!", description: `Your order ${result.orderId} has been successfully placed.`});
             router.push(`/payment/success?order_id=${result.orderId}`);
        } catch (error: any) {
             toast({ title: "Order Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
             setIsProcessing(false);
        }
    };

    const handleProcessOnlineOrder = async (shippingAddress: AddressFormValues, shouldSaveAddress: boolean) => {
      setIsProcessing(true);
      
      try {
          const initiateResponse = await fetch('/api/checkout/initiate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: userData!._id, shippingAddress, saveAddress: shouldSaveAddress, bargainedAmounts }),
          });
          const initData = await initiateResponse.json();
          if (!initiateResponse.ok) {
              throw new Error(initData.message || "Failed to initiate transaction.");
          }

          if (initData.gateway === 'razorpay') {
             if (!RAZORPAY_KEY_ID) throw new Error("Razorpay is not configured.");
              const { razorpayOrder, transactionId } = initData;
              const options = {
                  key: RAZORPAY_KEY_ID, amount: razorpayOrder.amount, currency: razorpayOrder.currency, name: "eShop Simplified",
                  description: `Transaction for order ${razorpayOrder.id}`, order_id: razorpayOrder.id,
                  handler: async function (response: any) {
                      const verifyResponse = await fetch('/api/payments/verify-payment', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ...response, transactionId }),
                      });
                      const verificationResult = await verifyResponse.json();
                      if (verifyResponse.ok && verificationResult.success) {
                          toast({ title: "Payment Successful!", description: `Order ${verificationResult.orderId} is being processed.`});
                          router.push(`/payment/success?order_id=${verificationResult.orderId}`);
                      } else {
                          toast({ title: "Payment Verification Failed", description: verificationResult.message, variant: "destructive" });
                          router.push(`/payment/failure?order_id=${razorpayOrder.id}`);
                      }
                  },
                  prefill: { name: shippingAddress.name, email: shippingAddress.email, contact: shippingAddress.phone, },
                  theme: { color: "#008080" },
                  modal: { ondismiss: () => {
                    fetch('/api/payments/cancel-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transactionId }) });
                    setIsProcessing(false);
                  }}
              };
              const rzp = new window.Razorpay(options);
              rzp.open();
          } else if (initData.gateway === 'payu') {
              const { payuDetails } = initData;
              const payuForm = document.getElementById('payu_form') as HTMLFormElement;
              if (payuForm) {
                  Object.keys(payuDetails).forEach(key => {
                      const input = document.createElement('input');
                      input.type = 'hidden';
                      input.name = key;
                      input.value = payuDetails[key];
                      payuForm.appendChild(input);
                  });
                  payuForm.submit();
              } else {
                  throw new Error("PayU form not found.");
              }
          }
          
      } catch (error: any) {
          toast({ title: "Order Error", description: error.message, variant: "destructive" });
          setIsProcessing(false);
      }
  };


  const handleProcessOrder = async () => {
    let shippingAddress: AddressFormValues;
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
      const foundAddress = userData?.addresses?.find(addr => addr._id === selectedAddressId);
      if (!foundAddress) {
          toast({ title: "Please select a valid shipping address.", variant: "destructive" });
          return;
      }
      shippingAddress = foundAddress;
    }
    
    if (!userData?._id) {
        toast({ title: "Error", description: "User session not found. Please log in again.", variant: "destructive" });
        return;
    }

    if (paymentMethod === 'cod') {
        handlePlaceCodOrder(shippingAddress);
    } else if (paymentMethod === 'online') {
        handleProcessOnlineOrder(shippingAddress, shouldSaveAddress);
    }
  };

  const handleBargainComplete = (prompt: string, result: BargainOutput) => {
    setChatHistory(prev => [
        ...prev,
        { author: 'user', text: prompt },
        { author: 'ai', text: result.responseMessage },
    ]);
    
    const newBargains: Record<string, number> = {};
    result.discounts.forEach(d => {
        newBargains[d.productId] = d.discountAmount;
    });
    setBargainedAmounts(newBargains);

    if (result.discounts.length > 0) {
        toast({
            title: "Deal made!",
            description: "Your special discounts have been applied to the order summary.",
            className: "bg-green-100 border-green-300 text-green-800",
        });
    } else {
        toast({
            title: "Nice try!",
            description: "No discount was given this time, but thanks for asking!",
        });
    }
  };

  
  const subtotal = cart?.items.reduce((acc, item) => acc + (item.product.discount ? (item.product.price * (1 - item.product.discount/100)) : item.product.price) * item.quantity, 0) || 0;
  const totalBargainDiscount = Object.values(bargainedAmounts).reduce((acc, amount) => acc + amount, 0);
  const subtotalAfterBargain = subtotal - totalBargainDiscount;
  const taxAmount = storeSettings ? subtotalAfterBargain * (storeSettings.taxPercentage / 100) : 0;
  const shippingCost = storeSettings?.shippingCharge || 0;
  const grandTotal = subtotalAfterBargain + taxAmount + shippingCost;
  const formatCurrency = (amount: number) => amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const actionButtonText = paymentMethod === 'cod' 
    ? `Place Order (COD)` 
    : `Proceed to Pay (₹${formatCurrency(grandTotal)})`;


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
        {isProcessing && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
                <h2 className="text-2xl font-semibold text-foreground">Processing Your Order...</h2>
                <p className="text-muted-foreground">Please wait and do not refresh or close this page.</p>
            </div>
        )}
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
                        <div className="text-sm flex-grow">
                            <div className="flex justify-between items-start">
                            <p className="font-semibold">{address.name}</p>
                            {address.isPrimary && <div className="flex items-center text-xs text-primary font-medium gap-1"><Star className="h-3 w-3 fill-current" /> Primary</div>}
                            </div>
                            <p>{address.email}</p>
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
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
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
                    <CardHeader><CardTitle>2. Payment Method</CardTitle></CardHeader>
                    <CardContent>
                        <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)} className="space-y-4">
                            <Label htmlFor="online-option" className="flex items-start gap-4 p-4 border rounded-md has-[:checked]:bg-muted has-[:checked]:border-primary transition-colors cursor-pointer">
                                <RadioGroupItem value="online" id="online-option" className="mt-1" />
                                <div className="flex-grow">
                                <p className="font-semibold flex items-center gap-2"><CreditCard className="h-5 w-5"/> Pay Online</p>
                                <p className="text-sm text-muted-foreground">Securely pay with UPI, Credit/Debit Card, Netbanking.</p>
                                </div>
                            </Label>
                            <Label htmlFor="cod-option" className="flex items-start gap-4 p-4 border rounded-md has-[:checked]:bg-muted has-[:checked]:border-primary transition-colors cursor-pointer">
                                <RadioGroupItem value="cod" id="cod-option" className="mt-1" />
                                <div className="flex-grow">
                                <p className="font-semibold flex items-center gap-2"><Truck className="h-5 w-5"/> Cash on Delivery (COD)</p>
                                <p className="text-sm text-muted-foreground">Pay in cash when your order is delivered.</p>
                                </div>
                            </Label>
                        </RadioGroup>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-1 lg:sticky top-20">
                <Card>
                <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
                <CardContent>
                    <ul className="space-y-3 mb-4">
                    {cart?.items.map(item => (
                        <li key={item._id.toString()} className="flex items-center justify-between text-sm">
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
                     {totalBargainDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <p>Bargain Discount</p>
                            <p>- ₹{formatCurrency(totalBargainDiscount)}</p>
                        </div>
                    )}
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
                    <Button onClick={handleProcessOrder} className="w-full mt-6" size="lg" disabled={isProcessing || isLoading || !cart}>
                        {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : <><ShieldCheck className="mr-2 h-4 w-4" />{actionButtonText}</>}
                    </Button>
                     <BargainDrawer
                        cart={cart}
                        userId={userData?._id}
                        chatHistory={chatHistory}
                        onBargainComplete={handleBargainComplete}
                    />
                    </div>
                </CardContent>
                </Card>
            </div>
            </div>
        </main>
        <Footer />
        <form id="payu_form" method="post" action={process.env.NEXT_PUBLIC_PAYU_URL} className="hidden"></form>
        </div>
    </>
  );
}

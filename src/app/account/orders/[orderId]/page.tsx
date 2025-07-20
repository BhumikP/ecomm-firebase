
// src/app/account/orders/[orderId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Package, Home, CreditCard, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { IOrder, OrderItem as OrderItemType } from '@/models/Order'; // Use IOrder from model
import type { IProduct } from '@/models/Product';

interface PopulatedOrderItem extends Omit<OrderItemType, 'productId'> {
  _id?: string; // Assuming _id might exist on subdoc
  productId: Pick<IProduct, '_id' | 'title' | 'thumbnailUrl'>; // Product is populated
  bargainDiscount?: number;
}

interface PopulatedOrder extends Omit<IOrder, 'items' | 'userId' | '_id'> {
  _id: string;
  userId: string; // Or Populated User Type
  items: PopulatedOrderItem[];
  totalBargainDiscount?: number;
}


const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const { toast } = useToast();

  const [order, setOrder] = useState<PopulatedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      const loadOrder = async () => {
        setIsLoading(true);
        setError(null);
        try {
          // TODO: Add authentication check to ensure user can view this order
          const response = await fetch(`/api/orders/${orderId}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch order details');
          }
          const data = await response.json();
          setOrder(data.order as PopulatedOrder);
        } catch (err: any) {
          setError(err.message || 'Failed to load order details.');
          toast({ variant: "destructive", title: "Load Error", description: err.message });
        } finally {
          setIsLoading(false);
        }
      };
      loadOrder();
    } else {
        setError('Invalid Order ID.');
        setIsLoading(false);
    }
  }, [orderId, toast]);

   const getStatusBadgeVariant = (status: PopulatedOrder['status']) => {
     switch (status) {
       case 'Delivered': return 'default';
       case 'Shipped': return 'secondary';
       case 'Processing': return 'outline';
       case 'Pending': return 'outline';
       case 'Payment Failed': return 'destructive';
       case 'Cancelled': return 'destructive';
       default: return 'outline';
     }
   };

    const getStatusBadgeColor = (status: PopulatedOrder['status']) => {
     switch (status) {
       case 'Delivered': return 'bg-green-100 text-green-800 border-green-200';
       case 'Shipped': return 'bg-blue-100 text-blue-800 border-blue-200';
       case 'Processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
       case 'Pending': return 'bg-orange-100 text-orange-800 border-orange-200';
       case 'Payment Failed': return 'bg-red-100 text-red-800 border-red-200';
       case 'Cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
       default: return '';
     }
   };

  if (isLoading) {
     return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <Skeleton className="h-8 w-48" /> 
            <Card>
                 <CardHeader className="space-y-2">
                     <Skeleton className="h-6 w-1/2" />
                     <Skeleton className="h-4 w-1/4" />
                     <Skeleton className="h-5 w-24" />
                 </CardHeader>
                 <CardContent>
                      <Skeleton className="h-40 w-full" /> 
                 </CardContent>
            </Card>
             <div className="grid md:grid-cols-3 gap-6">
                <Skeleton className="h-32 w-full" /> 
                <Skeleton className="h-32 w-full" /> 
                <Skeleton className="h-40 w-full" /> 
             </div>
        </div>
     );
  }

   if (error) {
     return (
        <div className="container mx-auto px-4 py-8 text-center">
           <p className="text-destructive mb-4">{error}</p>
           <Button variant="outline" asChild>
             <Link href="/account/orders">
               <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
             </Link>
           </Button>
         </div>
     );
   }

   if (!order) {
        return <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">Order data not available.</div>;
   }

  const subtotal = order.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  return (
    <div className="container mx-auto px-4 py-8">
        <Button variant="outline" size="sm" asChild className="mb-6">
            <Link href="/account/orders">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Order History
            </Link>
       </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
             <div>
                 <CardTitle>Order Details</CardTitle>
                 <CardDescription>Order ID: {order.orderId}</CardDescription>
                 <p className="text-sm text-muted-foreground">Placed on: {new Date(order.createdAt).toLocaleDateString()}</p>
             </div>
             <Badge variant={getStatusBadgeVariant(order.status)} className={`text-base px-3 py-1 ${getStatusBadgeColor(order.status)}`}>
                {order.status}
             </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Item</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item, index) => {
                 const productInfo = item.productId as Pick<IProduct, '_id' | 'title' | 'thumbnailUrl'>;
                 return (
                    <TableRow key={item._id?.toString() || index}>
                        <TableCell>
                            <Image
                               src={item.image || productInfo.thumbnailUrl || 'https://placehold.co/100x100.png'} 
                               alt={item.productName}
                               width={64}
                               height={64}
                               className="w-16 h-16 object-cover rounded-md border bg-muted"
                               data-ai-hint="order item thumbnail"
                             />
                        </TableCell>
                      <TableCell className="font-medium">
                          <Link href={`/products/${productInfo._id}`} className="hover:text-primary">
                            {item.productName}
                          </Link>
                          {item.selectedColorSnapshot && (
                              <p className="text-xs text-muted-foreground">Color: {item.selectedColorSnapshot.name}</p>
                          )}
                          {(item.bargainDiscount || 0) > 0 && (
                                <p className="text-xs text-green-600">
                                    Bargain: -₹{formatCurrency(item.bargainDiscount! * item.quantity)}
                                </p>
                          )}
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">₹{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right">₹{formatCurrency(item.price * item.quantity)}</TableCell>
                    </TableRow>
              );})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
         <Card className="md:col-span-1">
            <CardHeader className="flex flex-row items-center space-x-2 pb-2">
                <Home className="h-5 w-5 text-muted-foreground"/>
                <CardTitle className="text-lg">Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
                <p className="font-medium">{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && <p>Phone: {order.shippingAddress.phone}</p>}
            </CardContent>
         </Card>

          <Card className="md:col-span-1">
            <CardHeader className="flex flex-row items-center space-x-2 pb-2">
                <CreditCard className="h-5 w-5 text-muted-foreground"/>
                <CardTitle className="text-lg">Payment</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
                <p>Method: {order.paymentMethod}</p>
                <p>Status: <Badge variant={getStatusBadgeVariant(order.paymentStatus as PopulatedOrder['status'])} className={getStatusBadgeColor(order.paymentStatus as PopulatedOrder['status'])}>{order.paymentStatus}</Badge></p>
                {order.paymentDetails?.transactionId && <p className="text-xs text-muted-foreground">Txn ID: {order.paymentDetails.transactionId}</p>}
            </CardContent>
         </Card>


        <Card className="md:col-span-1">
           <CardHeader className="flex flex-row items-center space-x-2 pb-2">
                <Package className="h-5 w-5 text-muted-foreground"/>
                <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
          <CardContent className="space-y-2 text-sm">
             <div className="flex justify-between">
               <span>Subtotal ({order.items.reduce((sum, i) => sum + i.quantity, 0)} items)</span>
               <span>₹{formatCurrency(subtotal)}</span>
             </div>
             {(order.totalBargainDiscount || 0) > 0 && (
                <div className="flex justify-between text-green-600">
                    <span>Bargain Discount</span>
                    <span>- ₹{formatCurrency(order.totalBargainDiscount!)}</span>
                </div>
              )}
             <div className="flex justify-between">
                <span>Shipping</span>
                <span>₹{formatCurrency(order.shippingCost || 0)}</span> 
            </div>
             <div className="flex justify-between">
                <span>Taxes</span>
                <span>₹{formatCurrency(order.taxAmount || 0)}</span> 
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>Order Total</span>
              <span>₹{formatCurrency(order.total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

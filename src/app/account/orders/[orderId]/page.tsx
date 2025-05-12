'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Import useParams
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Package, Home, CreditCard } from 'lucide-react'; // Import icons

// Mock Order Data Structure (ensure consistency)
interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number; // Price per unit *when the order was placed*
  image?: string; // Optional image for display
}

interface Order {
  id: string;
  date: string;
  total: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  items: OrderItem[];
  shippingAddress: {
      name: string;
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
  };
  paymentMethod: string; // e.g., "Visa **** 1234"
}

// Mock function to get order details by ID
const fetchOrderDetails = async (orderId: string): Promise<Order | null> => {
    console.log(`Fetching details for Order ID: ${orderId}`);
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate delay

     const mockOrdersMap: { [key: string]: Order } = {
      'ORD-1001': {
        id: 'ORD-1001',
        date: '2024-03-10',
        total: 105.98,
        status: 'Delivered',
        items: [
          { productId: '1', productName: 'Stylish T-Shirt', quantity: 1, price: 25.99, image: 'https://picsum.photos/100/100?random=1' },
          { productId: '2', productName: 'Wireless Headphones', quantity: 1, price: 79.99, image: 'https://picsum.photos/100/100?random=2' },
        ],
         shippingAddress: { name: 'Alice Smith', street: '123 Main St', city: 'Anytown', state: 'CA', zip: '12345', country: 'USA' },
         paymentMethod: 'Visa **** 4321',
      },
      'ORD-1002': {
        id: 'ORD-1002',
        date: '2024-03-15',
        total: 42.75, // 45 * 0.95
        status: 'Shipped',
        items: [
          { productId: '3', productName: 'Coffee Maker', quantity: 1, price: 42.75, image: 'https://picsum.photos/100/100?random=3' },
        ],
         shippingAddress: { name: 'Bob Johnson', street: '456 Oak Ave', city: 'Otherville', state: 'NY', zip: '54321', country: 'USA' },
         paymentMethod: 'Mastercard **** 5678',
      },
       'ORD-1003': {
        id: 'ORD-1003',
        date: '2024-03-18',
        total: 102.00, // 120 * 0.85
        status: 'Processing',
        items: [
           { productId: '4', productName: 'Running Shoes', quantity: 1, price: 102.00, image: 'https://picsum.photos/100/100?random=4' },
        ],
         shippingAddress: { name: 'Charlie Brown', street: '789 Pine Ln', city: 'Smalltown', state: 'TX', zip: '67890', country: 'USA' },
         paymentMethod: 'PayPal',
      },
    };

    return mockOrdersMap[orderId] || null;
};


export default function OrderDetailPage() {
  const params = useParams(); // Get route parameters
  const router = useRouter();
  const orderId = params.orderId as string; // Extract orderId

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      const loadOrder = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedOrder = await fetchOrderDetails(orderId);
          if (fetchedOrder) {
            setOrder(fetchedOrder);
          } else {
            setError('Order not found.');
          }
        } catch (err) {
          console.error('Error fetching order details:', err);
          setError('Failed to load order details.');
        } finally {
          setIsLoading(false);
        }
      };
      loadOrder();
    } else {
        // Handle case where orderId is missing (though routing should prevent this)
        setError('Invalid Order ID.');
        setIsLoading(false);
    }
  }, [orderId]);

   const getStatusBadgeVariant = (status: Order['status']) => {
     switch (status) {
       case 'Delivered': return 'default';
       case 'Shipped': return 'secondary';
       case 'Processing': return 'outline';
       case 'Cancelled': return 'destructive';
       default: return 'outline';
     }
   };

    const getStatusBadgeColor = (status: Order['status']) => {
     switch (status) {
       case 'Delivered': return 'bg-green-100 text-green-800 border-green-200';
       case 'Shipped': return 'bg-blue-100 text-blue-800 border-blue-200';
       case 'Processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
       case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
       default: return '';
     }
   };

  if (isLoading) {
     return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <Skeleton className="h-8 w-48" /> {/* Back button skel */}
            <Card>
                 <CardHeader className="space-y-2">
                     <Skeleton className="h-6 w-1/2" />
                     <Skeleton className="h-4 w-1/4" />
                     <Skeleton className="h-5 w-24" />
                 </CardHeader>
                 <CardContent>
                      <Skeleton className="h-40 w-full" /> {/* Table skel */}
                 </CardContent>
            </Card>
             <div className="grid md:grid-cols-2 gap-6">
                <Skeleton className="h-32 w-full" /> {/* Address skel */}
                <Skeleton className="h-32 w-full" /> {/* Summary skel */}
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
        // Should be covered by error state, but as a fallback
        return <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">Order data not available.</div>;
   }


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
                 <CardDescription>Order ID: {order.id}</CardDescription>
                 <p className="text-sm text-muted-foreground">Placed on: {new Date(order.date).toLocaleDateString()}</p>
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
              {order.items.map((item, index) => (
                <TableRow key={`${order.id}-item-${index}`}>
                    <TableCell>
                        <Image
                           src={item.image || 'https://picsum.photos/100/100?random=placeholder'} // Fallback image
                           alt={item.productName}
                           width={64}
                           height={64}
                           className="w-16 h-16 object-cover rounded-md border"
                         />
                    </TableCell>
                  <TableCell className="font-medium">
                      <Link href={`/products/${item.productId}`} className="hover:text-primary">
                        {item.productName}
                      </Link>
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
         {/* Shipping Address */}
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
            </CardContent>
         </Card>

         {/* Payment Method */}
          <Card className="md:col-span-1">
            <CardHeader className="flex flex-row items-center space-x-2 pb-2">
                <CreditCard className="h-5 w-5 text-muted-foreground"/>
                <CardTitle className="text-lg">Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
                <p>{order.paymentMethod}</p>
            </CardContent>
         </Card>


        {/* Order Summary */}
        <Card className="md:col-span-1">
           <CardHeader className="flex flex-row items-center space-x-2 pb-2">
                <Package className="h-5 w-5 text-muted-foreground"/>
                <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
          <CardContent className="space-y-2 text-sm">
             {/* You might need to recalculate subtotal if items have discounts applied individually */}
             <div className="flex justify-between">
               <span>Subtotal ({order.items.reduce((sum, i) => sum + i.quantity, 0)} items)</span>
               {/* This assumes item.price already reflects discounts for simplicity */}
               <span>₹{order.items.reduce((sum, i) => sum + (i.price * i.quantity), 0).toFixed(2)}</span>
             </div>
             <div className="flex justify-between">
                <span>Shipping</span>
                <span>₹0.00</span> {/* Placeholder */}
            </div>
             <div className="flex justify-between">
                <span>Taxes</span>
                <span>₹0.00</span> {/* Placeholder */}
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>Total Paid</span>
              <span>₹{order.total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
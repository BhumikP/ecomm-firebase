
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Loader2, PackageOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { IOrder, OrderItem as OrderItemType } from '@/models/Order'; // Use IOrder from model

interface FetchedOrderItem extends Omit<OrderItemType, 'productId'> {
  productId: {
    _id: string;
    title: string;
    thumbnailUrl?: string; // Assuming product might have this
  } | string; // Can be populated or just ID string
}

interface FetchedOrder extends Omit<IOrder, 'items' | 'userId' | '_id'> {
  _id: string; // Ensure _id is string
  userId: string; // Assuming userId will be string after population or direct
  items: FetchedOrderItem[];
}

const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<FetchedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        setUserId(userData._id);
      } catch (e) {
        setError("Failed to load user data. Please log in again.");
        setIsLoading(false);
      }
    } else {
      setError("Please log in to view your order history.");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
        if (!error && isLoading) setIsLoading(false); // Stop loading if no userId and no prior error
        return;
    }

    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/orders?userId=${userId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch orders');
        }
        const data = await response.json();
        setOrders(data.orders as FetchedOrder[]);
      } catch (err: any) {
        setError(err.message || "Could not load order history.");
        setOrders([]);
        toast({ variant: "destructive", title: "Load Error", description: err.message });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [userId, toast]);

  const getStatusBadgeVariant = (status: FetchedOrder['status']) => {
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
   const getStatusBadgeColor = (status: FetchedOrder['status']) => {
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

  return (
    <div className="container mx-auto px-4 py-8">
       <Button variant="outline" size="sm" asChild className="mb-4">
            <Link href="/account">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Account
            </Link>
       </Button>

      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>View details of your past orders.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
                 {[...Array(3)].map((_, i) => ( 
                    <div key={i} className="flex justify-between items-center p-4 border rounded-md">
                       <div className="space-y-2">
                         <Skeleton className="h-5 w-24" />
                         <Skeleton className="h-4 w-32" />
                       </div>
                        <div className="space-y-2 text-right">
                            <Skeleton className="h-5 w-16 ml-auto" />
                            <Skeleton className="h-5 w-20 ml-auto" />
                        </div>
                    </div>
                 ))}
            </div>
          ) : error ? (
             <p className="text-center py-10 text-destructive">{error}</p>
          ) : orders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-medium">{order.orderId}</TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(order.status)} className={getStatusBadgeColor(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">₹{formatCurrency(order.total)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                           <Link href={`/account/orders/${order._id}`}>View Details</Link>
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10">
                <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-semibold text-foreground">No Orders Yet</p>
                <p className="text-muted-foreground">You haven't placed any orders. Start shopping to see them here!</p>
                <Button asChild className="mt-4">
                    <Link href="/">Start Shopping</Link>
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

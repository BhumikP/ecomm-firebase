
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Package, Home, CreditCard, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { IOrder, OrderItem as OrderItemType } from '@/models/Order';
import type { ITransaction } from '@/models/Transaction';
import type { IUser } from '@/models/User';
import { Label } from '@/components/ui/label';

interface PopulatedOrder extends Omit<IOrder, 'userId' | 'transactionId' | '_id'> {
  _id: string;
  userId: Pick<IUser, '_id' | 'name' | 'email'>;
  transactionId: ITransaction;
}

const formatCurrency = (amount: number) => {
    return amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const { toast } = useToast();

  const [order, setOrder] = useState<PopulatedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<IOrder['status'] | ''>('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (orderId) {
      const loadOrder = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/admin/orders/${orderId}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch order details');
          }
          const data = await response.json();
          setOrder(data.order as PopulatedOrder);
          setNewStatus(data.order.status);
        } catch (err: any) {
          setError(err.message || 'Failed to load order details.');
          toast({ variant: "destructive", title: "Load Error", description: err.message });
        } finally {
          setIsLoading(false);
        }
      };
      loadOrder();
    }
  }, [orderId, toast]);
  
  const handleStatusUpdate = async () => {
    if (!order || !newStatus || newStatus === order.status) return;
    setIsUpdating(true);
    try {
        const response = await fetch(`/api/admin/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to update status');
        }
        setOrder(data.order as PopulatedOrder);
        toast({ title: "Status Updated", description: `Order status changed to ${newStatus}.` });
    } catch (err: any) {
        toast({ variant: "destructive", title: "Update Error", description: err.message });
        setNewStatus(order.status); // Revert dropdown on failure
    } finally {
        setIsUpdating(false);
    }
  };

   const getStatusBadgeColor = (status?: IOrder['status']) => {
     if (!status) return '';
     switch (status) {
       case 'Delivered': return 'bg-green-100 text-green-800 border-green-200';
       case 'Shipped': return 'bg-blue-100 text-blue-800 border-blue-200';
       case 'Processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
       case 'Cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
       default: return '';
     }
   };

  if (isLoading) {
    return <div className="space-y-6">
        <Skeleton className="h-8 w-48" /> 
        <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
        <div className="grid md:grid-cols-3 gap-6"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>
    </div>;
  }
  if (error || !order) {
    return <div className="text-center py-10"><p className="text-destructive mb-4">{error || 'Order not found'}</p><Button variant="outline" asChild><Link href="/admin/orders"><ArrowLeft className="mr-2 h-4 w-4" />Back to Orders</Link></Button></div>;
  }

  return (
    <div className="space-y-6">
        <Button variant="outline" size="sm" asChild><Link href="/admin/orders"><ArrowLeft className="mr-2 h-4 w-4" />Back to Orders List</Link></Button>
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                        <CardTitle className="text-2xl">Order {order.orderId}</CardTitle>
                        <CardDescription>Placed on {new Date(order.createdAt).toLocaleString()}</CardDescription>
                    </div>
                    <Badge className={`text-base px-3 py-1 ${getStatusBadgeColor(order.status)}`}>{order.status}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                <p><span className="font-semibold">Customer:</span> {order.userId.name} ({order.userId.email})</p>
            </CardContent>
            <CardFooter className="bg-muted/50 p-4 rounded-b-lg flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-grow">
                    <Label htmlFor="status-select" className="text-sm font-medium">Update Order Status</Label>
                    <Select value={newStatus} onValueChange={(value) => setNewStatus(value as IOrder['status'])} disabled={isUpdating}>
                        <SelectTrigger id="status-select" className="w-full sm:w-[200px] bg-background">
                            <SelectValue placeholder="Change status..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Processing">Processing</SelectItem>
                            <SelectItem value="Shipped">Shipped</SelectItem>
                            <SelectItem value="Delivered">Delivered</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleStatusUpdate} disabled={isUpdating || newStatus === order.status} className="w-full sm:w-auto">
                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </CardFooter>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-3">
                <CardHeader><CardTitle>Order Items ({order.items.length})</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Details</TableHead><TableHead className="text-center">Quantity</TableHead><TableHead className="text-right">Unit Price</TableHead><TableHead className="text-right">Subtotal</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {order.items.map((item, index) => (
                            <TableRow key={item._id?.toString() || index}>
                                <TableCell><Image src={item.image || 'https://placehold.co/100x100.png'} alt={item.productName} width={64} height={64} className="w-16 h-16 object-cover rounded-md border" /></TableCell>
                                <TableCell>
                                    <p className="font-medium">{item.productName}</p>
                                    {item.selectedColorSnapshot && <p className="text-xs text-muted-foreground">Color: {item.selectedColorSnapshot.name}</p>}
                                    <p className="text-xs text-muted-foreground">ID: {item.productId.toString()}</p>
                                </TableCell>
                                <TableCell className="text-center">{item.quantity}</TableCell>
                                <TableCell className="text-right">₹{formatCurrency(item.price)}</TableCell>
                                <TableCell className="text-right font-semibold">₹{formatCurrency(item.price * item.quantity)}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card><CardHeader><Home className="h-5 w-5 text-muted-foreground mb-2"/><CardTitle>Shipping Address</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-1">
                    <p className="font-medium">{order.shippingAddress.name}</p>
                    <p>{order.shippingAddress.street}</p>
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                    <p>{order.shippingAddress.country}</p>
                    <p>{order.shippingAddress.phone}</p>
                </CardContent>
            </Card>

            <Card><CardHeader><CreditCard className="h-5 w-5 text-muted-foreground mb-2"/><CardTitle>Payment & Transaction</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-1">
                    <p><span className="font-semibold">Method:</span> {order.paymentMethod}</p>
                    <p><span className="font-semibold">Status:</span> <Badge variant={order.transactionId.status === 'Success' ? 'default' : 'destructive'} className={getStatusBadgeColor(order.transactionId.status === 'Success' ? 'Delivered' : 'Cancelled')}>{order.transactionId.status}</Badge></p>
                    <Separator className="my-2"/>
                    <p><span className="font-semibold">Txn ID:</span> {order.transactionId.razorpay_payment_id || 'N/A'}</p>
                    <p><span className="font-semibold">Gateway Order ID:</span> <span className="break-all">{order.transactionId.razorpay_order_id}</span></p>
                </CardContent>
            </Card>

            <Card><CardHeader><Package className="h-5 w-5 text-muted-foreground mb-2"/><CardTitle>Order Summary</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Subtotal</span><span>₹{formatCurrency(order.total - (order.taxAmount || 0) - (order.shippingCost || 0))}</span></div>
                    <div className="flex justify-between"><span>Shipping</span><span>₹{formatCurrency(order.shippingCost || 0)}</span></div>
                    <div className="flex justify-between"><span>Taxes</span><span>₹{formatCurrency(order.taxAmount || 0)}</span></div>
                    <Separator />
                    <div className="flex justify-between font-bold text-base"><span>Grand Total</span><span>₹{formatCurrency(order.total)}</span></div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react'; // Import icon

// Mock Order Data Structure
interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  date: string;
  total: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  items: OrderItem[];
}

// Mock Order Data
const mockOrders: Order[] = [
  {
    id: 'ORD-1001',
    date: '2024-03-10',
    total: 105.98,
    status: 'Delivered',
    items: [
      { productId: '1', productName: 'Stylish T-Shirt', quantity: 1, price: 25.99 },
      { productId: '2', productName: 'Wireless Headphones', quantity: 1, price: 79.99 },
    ],
  },
   {
    id: 'ORD-1002',
    date: '2024-03-15',
    total: 47.25,
    status: 'Shipped',
    items: [
        { productId: '3', productName: 'Coffee Maker', quantity: 1, price: 45.00 * 0.95 }, // Assuming 5% discount applied
    ],
  },
   {
    id: 'ORD-1003',
    date: '2024-03-18',
    total: 120.00 * 0.85, // Assuming 15% discount applied
    status: 'Processing',
    items: [
      { productId: '4', productName: 'Running Shoes', quantity: 1, price: 120.00 * 0.85 },
    ],
  },
];


export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching order data for the logged-in user
    const fetchOrders = async () => {
      setIsLoading(true);
      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 700)); // Simulate delay
      setOrders(mockOrders); // Use mock data
      setIsLoading(false);
    };

    fetchOrders();
  }, []);

  const getStatusBadgeVariant = (status: Order['status']) => {
    switch (status) {
      case 'Delivered': return 'default'; // Consider a success variant if added
      case 'Shipped': return 'secondary';
      case 'Processing': return 'outline'; // Consider a warning/info variant
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
                 {[...Array(3)].map((_, i) => ( // Skeleton rows
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
          ) : orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)} className={getStatusBadgeColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                         {/* Link to a detailed order page (implement later) */}
                         <Link href={`/account/orders/${order.id}`}>View Details</Link>
                       </Button>
                       {/* Add other actions like 'Reorder' or 'Track Shipment' if applicable */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-10">You haven't placed any orders yet.</p>
          )}
        </CardContent>
      </Card>
      {/* Add pagination if needed */}
    </div>
  );
}

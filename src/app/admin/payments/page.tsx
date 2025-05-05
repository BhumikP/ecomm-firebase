'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
// Assuming an Order model exists and includes payment details
import type { IOrder } from '@/models/Order';

// Define a type for the payment data we expect (derived from Order)
type PaymentData = Pick<IOrder, '_id' | 'orderId' | 'total' | 'currency' | 'paymentStatus' | 'paymentMethod' | 'createdAt'> & {
    paymentDetails?: { transactionId?: string; gateway?: string };
    // userId?: { _id: string; email: string; name: string }; // Include necessary user info if needed
    customerEmail?: string; // Placeholder if userId not populated fully
};


// Mock Function to fetch payment data (replace with API call)
const fetchPayments = async (filters: any): Promise<{ payments: PaymentData[], totalCount: number }> => {
    console.log("Fetching payments with filters:", filters);
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay

    // Mock data based on Order structure
    const mockPayments: PaymentData[] = [
        { _id: '60f...', orderId: 'ORD-1001', total: 105.98, currency: 'USD', paymentStatus: 'Paid', paymentMethod: 'Visa **** 4321', createdAt: new Date('2024-03-10'), paymentDetails: { transactionId: 'txn_123abc', gateway: 'Juspay' }, customerEmail: 'alice@example.com' },
        { _id: '60f...', orderId: 'ORD-1002', total: 47.25, currency: 'USD', paymentStatus: 'Paid', paymentMethod: 'Mastercard **** 5678', createdAt: new Date('2024-03-15'), paymentDetails: { transactionId: 'txn_456def', gateway: 'Juspay' }, customerEmail: 'bob@example.com'},
         { _id: '60f...', orderId: 'ORD-1003', total: 102.00, currency: 'USD', paymentStatus: 'Pending', paymentMethod: 'PayPal', createdAt: new Date('2024-03-18'), customerEmail: 'charlie@example.com' },
        { _id: '60f...', orderId: 'ORD-1004', total: 25.00, currency: 'USD', paymentStatus: 'Failed', paymentMethod: 'Visa **** 9999', createdAt: new Date('2024-03-19'), paymentDetails: { gateway: 'Juspay' }, customerEmail: 'dave@example.com' },
         { _id: '60f...', orderId: 'ORD-1005', total: 199.50, currency: 'USD', paymentStatus: 'Paid', paymentMethod: 'Amex **** 1001', createdAt: new Date('2024-03-20'), paymentDetails: { transactionId: 'txn_789ghi', gateway: 'Juspay' }, customerEmail: 'eve@example.com' },
    ];

    // Basic mock filtering (implement properly in API)
    let filtered = mockPayments;
    if (filters.searchQuery) {
         const query = filters.searchQuery.toLowerCase();
         filtered = filtered.filter(p =>
             p.orderId.toLowerCase().includes(query) ||
             (p.paymentDetails?.transactionId && p.paymentDetails.transactionId.toLowerCase().includes(query)) ||
             (p.customerEmail && p.customerEmail.toLowerCase().includes(query))
         );
    }
     if (filters.status && filters.status !== 'all') {
         filtered = filtered.filter(p => p.paymentStatus.toLowerCase() === filters.status.toLowerCase());
     }

    return { payments: filtered, totalCount: filtered.length };
};


export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<PaymentData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'paid', 'pending', 'failed'
    const { toast } = useToast();
    // TODO: Add pagination state

    // Fetch payments on mount and when filters change
    useEffect(() => {
        const loadPayments = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const filters = { searchQuery: searchTerm, status: statusFilter };
                const result = await fetchPayments(filters); // Replace with actual API call: /api/payments?search=...&status=...
                setPayments(result.payments);
                // Set pagination data if implemented
            } catch (err: any) {
                console.error("Error fetching payments:", err);
                setError(err.message || "Could not load payment history.");
                toast({ variant: "destructive", title: "Error", description: err.message || "Could not load payment history." });
            } finally {
                setIsLoading(false);
            }
        };
        loadPayments();
    }, [searchTerm, statusFilter, toast]);


     const getStatusBadgeVariant = (status: PaymentData['paymentStatus']) => {
        switch (status) {
            case 'Paid': return 'default';
            case 'Pending': return 'outline';
            case 'Failed': return 'destructive';
            case 'Refunded': return 'secondary';
            default: return 'outline';
        }
     };

      const getStatusBadgeColor = (status: PaymentData['paymentStatus']) => {
         switch (status) {
           case 'Paid': return 'bg-green-100 text-green-800 border-green-200';
           case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
           case 'Failed': return 'bg-red-100 text-red-800 border-red-200';
            case 'Refunded': return 'bg-blue-100 text-blue-800 border-blue-200';
           default: return '';
         }
       };


    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Payment History</h2>

             {/* Filters Section */}
             <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                     <div className="relative flex-grow">
                         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                         <Input
                            placeholder="Search Order ID, Txn ID, Email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full bg-background"
                         />
                     </div>
                     <div className="flex gap-2">
                         {/* Status Filter Buttons */}
                        <Button variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={() => setStatusFilter('all')}>All</Button>
                        <Button variant={statusFilter === 'Paid' ? 'default' : 'outline'} onClick={() => setStatusFilter('Paid')}>Paid</Button>
                        <Button variant={statusFilter === 'Pending' ? 'default' : 'outline'} onClick={() => setStatusFilter('Pending')}>Pending</Button>
                        <Button variant={statusFilter === 'Failed' ? 'default' : 'outline'} onClick={() => setStatusFilter('Failed')}>Failed</Button>
                        {/* Add Refunded if needed */}
                        {/* <Button variant={statusFilter === 'Refunded' ? 'default' : 'outline'} onClick={() => setStatusFilter('Refunded')}>Refunded</Button> */}
                     </div>
                      {/* TODO: Add Date Range Filter */}
                </CardContent>
             </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                    <CardDescription>Overview of recent payment transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Transaction ID</TableHead>
                                     <TableHead>Customer</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[...Array(5)].map((_, i) => (
                                    <TableRow key={`skel-${i}`}>
                                        <TableCell><Skeleton className="h-5 w-20 bg-muted" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24 bg-muted" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-28 bg-muted" /></TableCell>
                                         <TableCell><Skeleton className="h-5 w-32 bg-muted" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-16 bg-muted" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-20 bg-muted" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16 bg-muted rounded-full" /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                    ) : error ? (
                        <p className="text-center py-10 text-destructive">{error}</p>
                    ) : payments.length === 0 ? (
                        <p className="text-center py-10 text-muted-foreground">
                            No payments found{searchTerm || statusFilter !== 'all' ? ' matching your criteria' : ''}.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Transaction ID</TableHead>
                                    <TableHead>Customer Email</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Status</TableHead>
                                    {/* Add Actions if needed */}
                                    {/* <TableHead className="text-right">Actions</TableHead> */}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map((payment) => (
                                    <TableRow key={payment._id}>
                                        <TableCell>{new Date(payment.createdAt).toLocaleString()}</TableCell>
                                        <TableCell className="font-medium">
                                            <Button variant="link" asChild className="p-0 h-auto">
                                                {/* TODO: Link to Order Detail Page if exists */}
                                                {/* <Link href={`/admin/orders/${payment.orderId}`}> */}
                                                    {payment.orderId}
                                                {/* </Link> */}
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{payment.paymentDetails?.transactionId || 'N/A'}</TableCell>
                                        <TableCell>{payment.customerEmail || 'N/A'}</TableCell>
                                        <TableCell className="text-right font-medium">
                                             {payment.currency}{payment.total.toFixed(2)}
                                        </TableCell>
                                        <TableCell>{payment.paymentMethod} ({payment.paymentDetails?.gateway || 'N/A'})</TableCell>
                                        <TableCell>
                                             <Badge variant={getStatusBadgeVariant(payment.paymentStatus)} className={getStatusBadgeColor(payment.paymentStatus)}>
                                                {payment.paymentStatus}
                                            </Badge>
                                        </TableCell>
                                         {/* <TableCell className="text-right">
                                             {/* Add actions like 'Refund', 'View Details' */}
                                         {/* </TableCell> */}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
                 {/* TODO: Add Pagination Controls */}
                 {/* <CardFooter>
                     <div className="flex justify-center w-full">
                          Pagination component here
                     </div>
                 </CardFooter> */}
            </Card>
        </div>
    );
}

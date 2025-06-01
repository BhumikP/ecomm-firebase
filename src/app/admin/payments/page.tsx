
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import type { IOrder } from '@/models/Order'; // Import IOrder

// Define a type for the payment data we expect (derived from Order)
type PaymentData = Pick<IOrder, '_id' | 'orderId' | 'total' | 'currency' | 'paymentStatus' | 'paymentMethod' | 'createdAt'> & {
    paymentDetails?: { transactionId?: string; gateway?: string };
    // customerEmail field removed as IOrder does not directly contain it.
    // If needed, Order model would need userId and population, or email stored on order.
};

const ITEMS_PER_PAGE = 10;

const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};


export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<PaymentData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'Paid', 'Pending', 'Failed'
    const { toast } = useToast();
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    const fetchPaymentsData = useCallback(async (page: number, search: string, status: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(ITEMS_PER_PAGE),
            });
            if (search) params.append('searchQuery', search);
            if (status !== 'all') params.append('status', status);

            const response = await fetch(`/api/admin/orders?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch payment data');
            }
            const data = await response.json();
            
            // Transform fetched IOrder[] to PaymentData[]
            // This is straightforward if PaymentData is a subset of IOrder fields
            setPayments(data.orders as PaymentData[]);
            setTotalCount(data.totalCount);
            setTotalPages(data.totalPages);
            setCurrentPage(data.currentPage);

        } catch (err: any) {
            console.error("Error fetching payments:", err);
            setError(err.message || "Could not load payment history.");
            toast({ variant: "destructive", title: "Error", description: err.message || "Could not load payment history." });
            setPayments([]);
            setTotalCount(0);
            setTotalPages(0);
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    // Fetch payments on mount and when filters or page change
    useEffect(() => {
        fetchPaymentsData(currentPage, searchTerm, statusFilter);
    }, [currentPage, searchTerm, statusFilter, fetchPaymentsData]);


     const getStatusBadgeVariant = (status?: PaymentData['paymentStatus']) => {
        if (!status) return 'outline';
        switch (status) {
            case 'Paid': return 'default';
            case 'Pending': return 'outline';
            case 'Failed': return 'destructive';
            case 'Refunded': return 'secondary'; // Assuming Refunded is a possible status
            default: return 'outline';
        }
     };

      const getStatusBadgeColor = (status?: PaymentData['paymentStatus']) => {
         if (!status) return '';
         switch (status) {
           case 'Paid': return 'bg-green-100 text-green-800 border-green-200';
           case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
           case 'Failed': return 'bg-red-100 text-red-800 border-red-200';
           case 'Refunded': return 'bg-blue-100 text-blue-800 border-blue-200';
           default: return '';
         }
       };
    
    const handleSearchDebounced = () => {
        setCurrentPage(1); // Reset to first page on new search
        // fetchPaymentsData will be called by useEffect due to searchTerm change
    };
    
    // Simple debounce for search input
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== undefined) { // Check if searchTerm has been initialized
                 handleSearchDebounced();
            }
        }, 500); // 500ms debounce
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    const handleStatusFilterChange = (newStatus: string) => {
        setCurrentPage(1); // Reset to first page
        setStatusFilter(newStatus);
        // fetchPaymentsData will be called by useEffect due to statusFilter change
    };

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };


    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Payment History</h2>

             <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                     <div className="relative flex-grow">
                         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                         <Input
                            placeholder="Search Order ID, Txn ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full bg-background"
                         />
                     </div>
                     <div className="flex gap-2 flex-wrap">
                        <Button variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={() => handleStatusFilterChange('all')}>All</Button>
                        <Button variant={statusFilter === 'Paid' ? 'default' : 'outline'} onClick={() => handleStatusFilterChange('Paid')}>Paid</Button>
                        <Button variant={statusFilter === 'Pending' ? 'default' : 'outline'} onClick={() => handleStatusFilterChange('Pending')}>Pending</Button>
                        <Button variant={statusFilter === 'Failed' ? 'default' : 'outline'} onClick={() => handleStatusFilterChange('Failed')}>Failed</Button>
                        <Button variant={statusFilter === 'Refunded' ? 'default' : 'outline'} onClick={() => handleStatusFilterChange('Refunded')}>Refunded</Button>
                     </div>
                </CardContent>
             </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                    <CardDescription>Overview of recent payment transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && payments.length === 0 ? ( // Show skeleton only on initial load or full data refresh
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Transaction ID</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
                                    <TableRow key={`skel-${i}`}>
                                        <TableCell><Skeleton className="h-5 w-24 bg-muted" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-28 bg-muted" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32 bg-muted" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-5 w-20 bg-muted ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24 bg-muted" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 bg-muted rounded-full" /></TableCell>
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
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map((payment) => (
                                    <TableRow key={payment._id?.toString()}>
                                        <TableCell>{new Date(payment.createdAt).toLocaleString()}</TableCell>
                                        <TableCell className="font-medium">
                                            {/* TODO: Link to Order Detail Page if exists e.g. /admin/orders/{payment.orderId} */}
                                            {payment.orderId}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{payment.paymentDetails?.transactionId || 'N/A'}</TableCell>
                                        <TableCell className="text-right font-medium">
                                             {payment.currency === 'INR' ? '₹' : '$'}{formatCurrency(payment.total)}
                                        </TableCell>
                                        <TableCell>{payment.paymentMethod} ({payment.paymentDetails?.gateway || 'N/A'})</TableCell>
                                        <TableCell>
                                             <Badge 
                                                variant={getStatusBadgeVariant(payment.paymentStatus)} 
                                                className={getStatusBadgeColor(payment.paymentStatus)}
                                              >
                                                {payment.paymentStatus}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
                {payments.length > 0 && totalPages > 0 && (
                     <CardFooter className="flex items-center justify-between border-t pt-4">
                        <span className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages} ({totalCount} items)
                        </span>
                        <div className="space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage <= 1 || isLoading}
                            >
                                <ChevronLeft className="mr-1 h-4 w-4"/> Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage >= totalPages || isLoading}
                            >
                                Next <ChevronRight className="ml-1 h-4 w-4"/>
                            </Button>
                        </div>
                     </CardFooter>
                )}
            </Card>
        </div>
    );
}

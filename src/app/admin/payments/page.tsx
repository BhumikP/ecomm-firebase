
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
import type { ITransaction } from '@/models/Transaction';
import type { IUser } from '@/models/User';

// Define a type for the transaction data we expect
type TransactionData = Omit<ITransaction, 'userId'> & {
    _id: string; // Ensure _id is a string
    userId: Pick<IUser, 'name' | 'email'>;
};

const ITEMS_PER_PAGE = 10;

const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function AdminTransactionsPage() {
    const [transactions, setTransactions] = useState<TransactionData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const { toast } = useToast();
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    const fetchTransactionsData = useCallback(async (page: number, search: string, status: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(ITEMS_PER_PAGE),
            });
            if (search) params.append('searchQuery', search);
            if (status !== 'all') params.append('status', status);

            const response = await fetch(`/api/admin/transactions?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch transaction data');
            }
            const data = await response.json();
            
            setTransactions(data.transactions as TransactionData[]);
            setTotalCount(data.totalCount);
            setTotalPages(data.totalPages);
            setCurrentPage(data.currentPage);

        } catch (err: any) {
            setError(err.message || "Could not load transaction history.");
            toast({ variant: "destructive", title: "Error", description: err.message || "Could not load transaction history." });
            setTransactions([]);
            setTotalCount(0);
            setTotalPages(0);
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchTransactionsData(currentPage, searchTerm, statusFilter);
    }, [currentPage, searchTerm, statusFilter, fetchTransactionsData]);

    const getStatusBadgeVariant = (status?: TransactionData['status']) => {
        if (!status) return 'outline';
        switch (status) {
            case 'Success': return 'default';
            case 'Pending': return 'outline';
            case 'Failed': return 'destructive';
            case 'Cancelled': return 'secondary';
            default: return 'outline';
        }
    };

    const getStatusBadgeColor = (status?: TransactionData['status']) => {
        if (!status) return '';
        switch (status) {
            case 'Success': return 'bg-green-100 text-green-800 border-green-200';
            case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Failed': return 'bg-red-100 text-red-800 border-red-200';
            case 'Cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return '';
        }
    };
    
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== undefined) setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleStatusFilterChange = (newStatus: string) => {
        setCurrentPage(1);
        setStatusFilter(newStatus);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Payment Transactions</h2>

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search Order ID, Payment ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full bg-background"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Button variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={() => handleStatusFilterChange('all')}>All</Button>
                        <Button variant={statusFilter === 'Success' ? 'default' : 'outline'} onClick={() => handleStatusFilterChange('Success')}>Success</Button>
                        <Button variant={statusFilter === 'Pending' ? 'default' : 'outline'} onClick={() => handleStatusFilterChange('Pending')}>Pending</Button>
                        <Button variant={statusFilter === 'Failed' ? 'default' : 'outline'} onClick={() => handleStatusFilterChange('Failed')}>Failed</Button>
                        <Button variant={statusFilter === 'Cancelled' ? 'default' : 'outline'} onClick={() => handleStatusFilterChange('Cancelled')}>Cancelled</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>A log of all payment attempts.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && transactions.length === 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Gateway Order ID</TableHead>
                                    <TableHead>Gateway Payment ID</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
                                    <TableRow key={`skel-${i}`}>
                                        <TableCell><Skeleton className="h-5 w-24 bg-muted" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-28 bg-muted" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32 bg-muted" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32 bg-muted" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-5 w-20 bg-muted ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 bg-muted rounded-full" /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : error ? (
                        <p className="text-center py-10 text-destructive">{error}</p>
                    ) : transactions.length === 0 ? (
                        <p className="text-center py-10 text-muted-foreground">
                            No transactions found{searchTerm || statusFilter !== 'all' ? ' matching your criteria' : ''}.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Gateway Order ID</TableHead>
                                    <TableHead>Gateway Payment ID</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((transaction) => (
                                    <TableRow key={transaction._id?.toString()}>
                                        <TableCell>{new Date(transaction.createdAt).toLocaleString()}</TableCell>
                                        <TableCell className="font-medium">
                                            {transaction.userId?.name || 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{transaction.razorpay_order_id || 'N/A'}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{transaction.razorpay_payment_id || 'N/A'}</TableCell>
                                        <TableCell className="text-right font-medium">
                                            {transaction.currency === 'INR' ? '₹' : '$'}{formatCurrency(transaction.amount)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={getStatusBadgeVariant(transaction.status)} 
                                                className={getStatusBadgeColor(transaction.status)}
                                            >
                                                {transaction.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
                {transactions.length > 0 && totalPages > 0 && (
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


'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import type { IOrder } from '@/models/Order';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ITEMS_PER_PAGE = 10;

const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<IOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const { toast } = useToast();
    const router = useRouter();
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    const fetchOrdersData = useCallback(async (page: number, search: string, status: string) => {
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
                throw new Error(errorData.message || 'Failed to fetch order data');
            }
            const data = await response.json();
            
            setOrders(data.orders as IOrder[]);
            setTotalCount(data.totalCount);
            setTotalPages(data.totalPages);
            setCurrentPage(data.currentPage);

        } catch (err: any) {
            setError(err.message || "Could not load orders.");
            toast({ variant: "destructive", title: "Error", description: err.message || "Could not load orders." });
            setOrders([]);
            setTotalCount(0);
            setTotalPages(0);
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchOrdersData(currentPage, searchTerm, statusFilter);
    }, [currentPage, searchTerm, statusFilter, fetchOrdersData]);

    const getStatusBadgeVariant = (status: IOrder['status']) => {
        switch (status) {
            case 'Delivered': return 'default';
            case 'Shipped': return 'secondary';
            case 'Processing': return 'outline';
            case 'Cancelled': return 'destructive';
            default: return 'outline';
        }
    };
    const getStatusBadgeColor = (status: IOrder['status']) => {
        switch (status) {
            case 'Delivered': return 'bg-green-100 text-green-800 border-green-200';
            case 'Shipped': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
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
            <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
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
                        <Button variant={statusFilter === 'Processing' ? 'default' : 'outline'} onClick={() => handleStatusFilterChange('Processing')}>Processing</Button>
                        <Button variant={statusFilter === 'Shipped' ? 'default' : 'outline'} onClick={() => handleStatusFilterChange('Shipped')}>Shipped</Button>
                        <Button variant={statusFilter === 'Delivered' ? 'default' : 'outline'} onClick={() => handleStatusFilterChange('Delivered')}>Delivered</Button>
                        <Button variant={statusFilter === 'Cancelled' ? 'default' : 'outline'} onClick={() => handleStatusFilterChange('Cancelled')}>Cancelled</Button>
                     </div>
                </CardContent>
             </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Order List</CardTitle>
                    <CardDescription>A list of all customer orders.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && orders.length === 0 ? (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    {[...Array(6)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full bg-muted" /></TableHead>)}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
                                    <TableRow key={`skel-${i}`}>
                                        {[...Array(6)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full bg-muted" /></TableCell>)}
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                    ) : error ? (
                        <p className="text-center py-10 text-destructive">{error}</p>
                    ) : orders.length === 0 ? (
                        <p className="text-center py-10 text-muted-foreground">
                            No orders found{searchTerm || statusFilter !== 'all' ? ' matching your criteria' : ''}.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order._id?.toString()}>
                                        <TableCell className="font-medium">{order.orderId}</TableCell>
                                        <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>{order.shippingAddress.name}</TableCell>
                                        <TableCell className="text-right font-medium">₹{formatCurrency(order.total)}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(order.status)} className={getStatusBadgeColor(order.status)}>
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/admin/orders/${order._id}`}>
                                                    <Eye className="mr-2 h-4 w-4" /> View
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
                {orders.length > 0 && totalPages > 0 && (
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


'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Package, AlertCircle, Calendar, CalendarClock, CalendarDays } from 'lucide-react';
import { IndianRupee } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Skeleton } from "@/components/ui/skeleton";

interface SummaryData {
  totalRevenue: number;
  thisMonthRevenue: number;
  thisWeekRevenue: number;
  todayRevenue: number;
  
  totalOrders: number;
  thisMonthOrders: number;
  thisWeekOrders: number;
  ordersToday: number;

  totalCustomers: number;
  newCustomersThisMonth: number;

  pendingIssues: number;
}

const fetchSummaryData = async (): Promise<SummaryData> => {
  // Fetch from the new API endpoint
  const response = await fetch('/api/admin/dashboard');
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard summary data');
  }
  const data = await response.json();
  return data.summary;
};


export default function AdminDashboardPage() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchSummaryData();
        setSummaryData(data);
      } catch (error) {
        console.error("Failed to fetch dashboard summary:", error);
        // Optionally set some error state to display to the user
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (isLoading || !summaryData) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-1/2 rounded-md" /> {/* Title Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => ( // Updated to 8 skeletons
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-1/3 rounded-md" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-1/2 rounded-md mb-1" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
             <Skeleton className="h-6 w-1/4 rounded-md mb-1" />
             <Skeleton className="h-4 w-1/2 rounded-md" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full rounded-md" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Revenue Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{formatCurrency(summaryData.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">All-time successful payments</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month's Revenue</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{formatCurrency(summaryData.thisMonthRevenue)}</div>
            <p className="text-xs text-muted-foreground">Revenue in the current month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week's Revenue</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{formatCurrency(summaryData.thisWeekRevenue)}</div>
            <p className="text-xs text-muted-foreground">Revenue in the current week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{formatCurrency(summaryData.todayRevenue)}</div>
            <p className="text-xs text-muted-foreground">Revenue since midnight</p>
          </CardContent>
        </Card>

        {/* Order Cards */}
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.totalOrders.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground">All-time orders placed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month's Orders</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.thisMonthOrders.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground">Orders placed this month</p>
          </CardContent>
        </Card>
        
        {/* Customer Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.totalCustomers.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground">Total registered users</p>
          </CardContent>
        </Card>
        
        {/* Pending Issues */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.pendingIssues}</div>
            <p className="text-xs text-muted-foreground">Orders awaiting processing</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Overview of recent orders and user signups.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            [Recent activity feed, quick links, or a summary chart component will go here.]
            <br />
            For example, show last 5 orders or new user registrations.
          </p>
          <div className="mt-4 h-[200px] bg-muted rounded-md flex items-center justify-center text-muted-foreground">
            [Activity Chart/List Placeholder]
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

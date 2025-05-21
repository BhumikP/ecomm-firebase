
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Package, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { IndianRupee } from 'lucide-react'; // Corrected import
import { useEffect, useState } from 'react'; // Added for potential data fetching
import { Skeleton } from "@/components/ui/skeleton"; // Added Skeleton

// Mock Data Structure (replace with actual fetched data types)
interface SummaryData {
  totalRevenue: number;
  newCustomers: number;
  ordersToday: number;
  pendingIssues: number;
  // Add more relevant metrics as needed
  // e.g., conversionRate: number; averageOrderValue: number;
}

// Mock Function to fetch summary data (replace with actual API call)
const fetchSummaryData = async (): Promise<SummaryData> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 700));
  // In a real app, fetch this from your backend: e.g., /api/admin/dashboard/summary
  return {
    totalRevenue: 54230.50,
    newCustomers: 120,
    ordersToday: 45,
    pendingIssues: 3,
  };
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

  if (isLoading || !summaryData) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-1/2 rounded-md" /> {/* Title Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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
      {/* TODO: Implement real data fetching from backend API */}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{summaryData.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{summaryData.newCustomers}</div>
            <p className="text-xs text-muted-foreground">+15% this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.ordersToday}</div>
            <p className="text-xs text-muted-foreground">Updated just now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.pendingIssues}</div>
            <p className="text-xs text-muted-foreground">{summaryData.pendingIssues > 0 ? 'Action required' : 'All clear'}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Overview of recent orders and user signups.</CardDescription>
          {/* TODO: Fetch and display recent orders/signups or link to respective pages */}
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            [Recent activity feed, quick links, or a summary chart component will go here.]
            <br />
            For example, show last 5 orders or new user registrations.
          </p>
          {/* Example: A placeholder for a more detailed activity chart or list */}
          <div className="mt-4 h-[200px] bg-muted rounded-md flex items-center justify-center text-muted-foreground">
            [Activity Chart/List Placeholder]
          </div>
        </CardContent>
      </Card>

      {/* TODO: Add more relevant dashboard widgets as needed, e.g., quick links to common admin tasks */}
    </div>
  );
}

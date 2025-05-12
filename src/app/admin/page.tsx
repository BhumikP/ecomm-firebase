'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Package, Activity } from 'lucide-react';
// Corrected import for DollarSign icon
import { IndianRupee } from 'lucide-react';


// Mock Data (replace with actual data fetching in a real app)
const summaryData = {
  totalRevenue: 54230.50,
  newCustomers: 120,
  ordersToday: 45,
  pendingIssues: 3,
};

export default function AdminDashboardPage() {

  // TODO: Add useEffect to fetch real data if needed

  return (
    <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>

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
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.pendingIssues}</div>
             <p className="text-xs text-muted-foreground">{summaryData.pendingIssues > 0 ? 'Action required' : 'All clear'}</p>
          </CardContent>
        </Card>
      </div>

       {/* Placeholder for Recent Orders or other charts/tables */}
       <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Overview of recent orders and user signups.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">[Recent activity feed or chart component will go here]</p>
                {/* Example: Add a simple list or integrate a Chart component */}
            </CardContent>
       </Card>

    </div>
  );
}
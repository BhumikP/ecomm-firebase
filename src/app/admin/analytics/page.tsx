
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"; // Assuming ShadCN chart components are available

// Mock data structures (replace with actual fetched data types)
interface MonthlySales {
  month: string;
  sales: number;
}

interface ProductSales {
  name: string;
  sales: number; // units sold or revenue
  revenue?: number;
}

interface UserActivityData {
  date: string;
  signups: number;
  activeUsers: number;
}

// Mock fetch functions (replace with actual API calls)
const fetchSalesData = async (): Promise<MonthlySales[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return [
    { month: 'Jan', sales: 4000 },
    { month: 'Feb', sales: 3000 },
    { month: 'Mar', sales: 5000 },
    { month: 'Apr', sales: 4500 },
    { month: 'May', sales: 6000 },
    { month: 'Jun', sales: 5500 },
    { month: 'Jul', sales: 7000 },
  ];
};

const fetchTopProducts = async (): Promise<ProductSales[]> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  return [
    { name: 'Wireless Headphones', sales: 120, revenue: 9598.80 },
    { name: 'Stylish T-Shirt', sales: 95, revenue: 2468.05 },
    { name: 'Laptop Backpack', sales: 80, revenue: 3999.20 },
    { name: 'Running Shoes', sales: 75, revenue: 7650.00 },
    { name: 'Coffee Maker', sales: 60, revenue: 2565.00 },
  ];
};

const fetchUserActivity = async (): Promise<UserActivityData[]> => {
    await new Promise(resolve => setTimeout(resolve, 700));
    return [
        { date: '2024-07-01', signups: 10, activeUsers: 150 },
        { date: '2024-07-08', signups: 15, activeUsers: 160 },
        { date: '2024-07-15', signups: 8, activeUsers: 155 },
        { date: '2024-07-22', signups: 12, activeUsers: 165 },
    ];
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];


export default function AdminAnalyticsPage() {
  const [salesData, setSalesData] = useState<MonthlySales[]>([]);
  const [topProducts, setTopProducts] = useState<ProductSales[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalyticsData = async () => {
      setIsLoading(true);
      try {
        const [sales, products, activity] = await Promise.all([
          fetchSalesData(),
          fetchTopProducts(),
          fetchUserActivity(),
        ]);
        setSalesData(sales);
        setTopProducts(products);
        setUserActivity(activity);
      } catch (error) {
        console.error("Failed to load analytics data:", error);
        // Handle error state in UI
      } finally {
        setIsLoading(false);
      }
    };
    loadAnalyticsData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-1/3 rounded-md" />
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={`skel-card-main-${i}`}>
              <CardHeader>
                <Skeleton className="h-6 w-1/2 rounded-md mb-1" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
              </CardHeader>
              <CardContent><Skeleton className="h-[300px] w-full rounded-md bg-muted" /></CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/4 rounded-md" /></CardHeader>
          <CardContent><Skeleton className="h-[200px] w-full rounded-md bg-muted" /></CardContent>
        </Card>
      </div>
    );
  }

  const chartConfig = {
    sales: { label: "Sales (₹)", color: "hsl(var(--chart-1))" },
    units: { label: "Units Sold", color: "hsl(var(--chart-2))" },
    signups: { label: "New Signups", color: "hsl(var(--chart-1))" },
    activeUsers: { label: "Active Users", color: "hsl(var(--chart-2))" },
  } satisfies ChartConfig; // ChartConfig type needs to be defined or imported if using ShadCN charts strongly typed

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Analytics Overview</h2>
      {/* TODO: Add date range filters or other global filters for analytics */}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sales Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>Monthly sales overview for the last period.</CardDescription>
            {/* TODO: Add more specific period info if date filters are implemented */}
          </CardHeader>
          <CardContent>
            {/* Using Recharts directly for flexibility */}
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={salesData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--primary))' }}
                />
                <Legend wrapperStyle={{fontSize: "12px"}}/>
                <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} dot={{fill: 'hsl(var(--primary))', r:4}} />
              </RechartsLineChart>
            </ResponsiveContainer>
            {/* 
              Alternative using ShadCN Chart (ensure Chart components are correctly set up):
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <RechartsLineChart data={salesData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} stroke="hsl(var(--muted-foreground))" fontSize={12}/>
                    <YAxis tickFormatter={(value) => `₹${value/1000}k`} stroke="hsl(var(--muted-foreground))" fontSize={12}/>
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line dataKey="sales" type="monotone" stroke="var(--color-sales)" strokeWidth={2} dot={{r:4}} />
                </RechartsLineChart>
              </ChartContainer>
            */}
          </CardContent>
        </Card>

        {/* Top Selling Products Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Products with the most sales (by units) this period.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={120} interval={0} />
                <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend wrapperStyle={{fontSize: "12px"}}/>
                <Bar dataKey="sales" name="Units Sold" fill="hsl(var(--primary))" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
            <CardDescription>Weekly new user signups and active users.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Using Recharts for User Activity example */}
             <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={userActivity} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(dateStr) => new Date(dateStr).toLocaleDateString('en-US', {month:'short', day:'numeric'})} />
                    <YAxis yAxisId="left" stroke="hsl(var(--chart-1))" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" fontSize={12}/>
                    <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend wrapperStyle={{fontSize: "12px"}}/>
                    <Line yAxisId="left" type="monotone" dataKey="signups" name="New Signups" stroke="hsl(var(--chart-1))" strokeWidth={2} activeDot={{ r: 6 }} dot={{fill: 'hsl(var(--chart-1))', r:3}} />
                    <Line yAxisId="right" type="monotone" dataKey="activeUsers" name="Active Users" stroke="hsl(var(--chart-2))" strokeWidth={2} activeDot={{ r: 6 }} dot={{fill: 'hsl(var(--chart-2))', r:3}}/>
                </RechartsLineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Add more analytics cards/sections as needed */}
      {/* Example: Revenue by Category Pie Chart */}
      <Card>
          <CardHeader>
            <CardTitle>Revenue by Category (Sample)</CardTitle>
            <CardDescription>Distribution of revenue across top product categories.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={topProducts.slice(0,5)} // Using topProducts for sample, replace with actual category revenue data
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="revenue" // Assuming topProducts has revenue
                        nameKey="name"
                    >
                        {topProducts.slice(0,5).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                        formatter={(value: number, name: string) => [`₹${value.toFixed(2)}`, name]}
                    />
                    <Legend wrapperStyle={{fontSize: "12px"}}/>
                </PieChart>
            </ResponsiveContainer>
            {/* TODO: Fetch actual revenue data grouped by category */}
          </CardContent>
      </Card>
    </div>
  );
}

// Minimal ChartConfig type if not using a shared one (for Shadcn chart example)
type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
  };
};

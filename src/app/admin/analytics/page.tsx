'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// Import chart components when needed, e.g., from 'recharts' or 'shadcn/ui/chart'
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";

// Mock data - replace with real fetched data
const salesData = [
  { month: 'Jan', sales: 4000 },
  { month: 'Feb', sales: 3000 },
  { month: 'Mar', sales: 5000 },
  { month: 'Apr', sales: 4500 },
  { month: 'May', sales: 6000 },
  { month: 'Jun', sales: 5500 },
];

const topProducts = [
  { name: 'Wireless Headphones', sales: 120 },
  { name: 'Stylish T-Shirt', sales: 95 },
  { name: 'Laptop Backpack', sales: 80 },
  { name: 'Running Shoes', sales: 75 },
  { name: 'Coffee Maker', sales: 60 },
];

export default function AdminAnalyticsPage() {

  // TODO: Add state and useEffect for fetching real analytics data

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sales Trend Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>Monthly sales overview for the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] bg-muted rounded-md flex items-center justify-center text-muted-foreground">
               [Sales Line Chart Placeholder]
               {/*
               Example using Recharts (install recharts first):
               <ResponsiveContainer width="100%" height={300}>
                 <LineChart data={salesData}>
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="month" />
                   <YAxis />
                   <Tooltip />
                   <Legend />
                   <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
                 </LineChart>
               </ResponsiveContainer>
               */}

                {/*
               Example using ShadCN Chart (after setting up):
               <ChartContainer config={{ sales: { label: "Sales", color: "hsl(var(--chart-1))" } }} className="h-[300px] w-full">
                 <LineChart data={salesData}>
                     <CartesianGrid vertical={false} />
                     <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                     <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                     <Line dataKey="sales" type="natural" stroke="var(--color-sales)" strokeWidth={2} dot={false} />
                 </LineChart>
               </ChartContainer>
                */}
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Products Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Products with the most sales this period.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                 {topProducts.map((product, index) => (
                     <div key={index} className="flex justify-between items-center">
                        <span>{index + 1}. {product.name}</span>
                        <span className="font-medium">{product.sales} units</span>
                     </div>
                 ))}
             </div>
             <div className="h-[300px] bg-muted rounded-md flex items-center justify-center text-muted-foreground mt-4">
                 [Top Products Bar Chart Placeholder]
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Add more analytics cards/sections as needed */}
      <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="h-[200px] bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                  [User Signup/Activity Chart Placeholder]
              </div>
          </CardContent>
      </Card>
    </div>
  );
}

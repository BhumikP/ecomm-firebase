
'use client';

import type React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Package, Users, LogOut, Settings, BarChart3, CreditCard, ListOrdered, Image as ImageIcon, ClipboardList } from 'lucide-react';

function deleteCookie(name: string) {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  const handleLogout = () => {
    // Clear auth state from both cookies and localStorage for full logout
    deleteCookie('isLoggedIn');
    deleteCookie('userRole');
    localStorage.removeItem('isLoggedIn'); // Keep for client-side checks if any
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    localStorage.removeItem('userEmail');
    router.push('/auth/login');
  };

  // The middleware now handles the auth check.
  // The layout assumes if it's rendered, the user is an authorized admin.
  return (
    <SidebarProvider defaultOpen>
        <div className="flex min-h-screen flex-col">
            <div className="flex flex-1">
                <Sidebar side="left" variant="sidebar" collapsible="icon">
                <SidebarHeader className="p-4 justify-between items-center border-b border-sidebar-border">
                     <Link href="/admin" className="text-xl font-semibold text-primary group-data-[collapsible=icon]:hidden flex items-center gap-2">
                          <span>Admin Panel</span>
                     </Link>
                    <SidebarTrigger className="md:hidden" />
                </SidebarHeader>
                <SidebarContent className="flex-1 overflow-y-auto">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Dashboard">
                                <Link href="/admin">
                                    <LayoutDashboard />
                                    <span>Dashboard</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Manage Orders">
                                <Link href="/admin/orders">
                                    <ClipboardList />
                                    <span>Orders</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Manage Products">
                                <Link href="/admin/products">
                                    <Package />
                                    <span>Products</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Manage Categories">
                                <Link href="/admin/categories">
                                    <ListOrdered />
                                    <span>Categories</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Manage Banners">
                                <Link href="/admin/banners">
                                    <ImageIcon />
                                    <span>Banners</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Manage Users">
                                <Link href="/admin/users">
                                    <Users />
                                    <span>Users</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Payments">
                                <Link href="/admin/payments">
                                    <CreditCard />
                                    <span>Payments</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Analytics">
                                <Link href="/admin/analytics">
                                    <BarChart3 />
                                    <span>Analytics</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Settings">
                                <Link href="/admin/settings">
                                    <Settings />
                                    <span>Settings</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter className="mt-auto p-2 border-t border-sidebar-border">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={handleLogout} tooltip="Logout" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                <LogOut />
                                <span>Logout</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
                </Sidebar>

                <SidebarInset className="flex-1 p-4 md:p-6 lg:p-8 bg-muted/30">
                  <div className="flex justify-between items-center mb-6 border-b pb-4">
                      <h1 className="text-2xl font-semibold text-foreground">Admin Area</h1>
                       <div className="flex items-center gap-4">
                         <span className="text-sm text-muted-foreground hidden sm:inline">Welcome, Admin!</span>
                         <Button variant="outline" size="sm" onClick={() => router.push('/')}>View Store</Button>
                         <SidebarTrigger className="hidden md:hidden" />
                       </div>
                  </div>
                  {children}
                </SidebarInset>
            </div>
        </div>
    </SidebarProvider>
  );
}

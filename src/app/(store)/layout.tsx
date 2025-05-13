
// src/app/(store)/layout.tsx
'use client';
import type React from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
// import { useEffect, useState } from 'react'; // No longer needed for maintenance mode check here
// import { AlertTriangle } from 'lucide-react'; // No longer needed for maintenance mode icon

export default function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const [isMaintenanceMode, setIsMaintenanceMode] = useState(false); // Removed
  // const [isLoading, setIsLoading] = useState(true); // Removed

  // useEffect(() => { // Removed maintenance mode fetching logic
  //   const fetchSettings = async () => {
  //     try {
  //       const response = await fetch('/api/admin/settings'); // Assuming settings are public or a separate client-facing API exists
  //       if (response.ok) {
  //         const data = await response.json();
  //         setIsMaintenanceMode(data.settings?.maintenanceMode || false);
  //       } else {
  //         console.warn('Could not fetch store settings for maintenance mode check.');
  //       }
  //     } catch (error) {
  //       console.error('Error fetching store settings:', error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  //   fetchSettings();
  // }, []);

  // if (isLoading) { // Removed loading state for maintenance mode
  //   return (
  //     <div className="flex flex-col min-h-screen items-center justify-center">
  //       <div className="text-2xl font-semibold">Loading Store...</div>
  //     </div>
  //   );
  // }

  // if (isMaintenanceMode) { // Removed maintenance mode display
  //   return (
  //     <div className="flex flex-col min-h-screen items-center justify-center text-center p-4 bg-muted">
  //       <AlertTriangle className="h-16 w-16 text-primary mb-6" />
  //       <h1 className="text-3xl font-bold text-foreground mb-4">Under Maintenance</h1>
  //       <p className="text-lg text-muted-foreground">
  //         Our store is temporarily down for maintenance. We'll be back shortly!
  //       </p>
  //     </div>
  //   );
  // }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}

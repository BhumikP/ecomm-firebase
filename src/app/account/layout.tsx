'use client'; // Must be client component if layout contains client logic like Header

import type React from 'react';
import { Header } from '@/components/layout/header'; // Import shared header
import { Footer } from '@/components/layout/footer'; // Import shared footer
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function AccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isVerified, setIsVerified] = useState(false); // Verification state

  useEffect(() => {
    setIsClient(true);
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!loggedIn) {
      router.replace('/auth/login');
    } else {
      setIsVerified(true); // Mark as verified if logged in
    }
  }, [router]);

  // Show loading/skeleton while verifying auth on client
  if (!isClient || !isVerified) {
    return (
       <div className="flex flex-col min-h-screen">
          {/* Skeleton Header */}
          <header className="bg-secondary shadow-sm sticky top-0 z-50 h-16">
              <div className="container mx-auto px-4 py-3 flex justify-between items-center h-full">
                  <Skeleton className="h-6 w-20 bg-muted rounded" />
                  <div className="flex items-center gap-4">
                      <Skeleton className="h-8 w-20 bg-muted rounded" />
                      <Skeleton className="h-8 w-20 bg-muted rounded" />
                  </div>
              </div>
          </header>
          {/* Skeleton Content */}
          <main className="flex-grow container mx-auto px-4 py-8">
             <Skeleton className="h-64 w-full max-w-2xl mx-auto bg-muted rounded-lg" />
          </main>
          {/* Skeleton Footer */}
          <footer className="bg-muted mt-auto border-t h-40">
              <div className="container mx-auto px-4 py-8">
                  <Skeleton className="h-20 w-full bg-muted-foreground/10 rounded" />
              </div>
          </footer>
       </div>
    );
  }

  // Render the actual layout once verification is complete
  return (
    <div className="flex flex-col min-h-screen">
      <Header /> {/* Render the actual header */}
      <main className="flex-grow bg-muted/30"> {/* Optional: slightly different bg for account pages */}
        {children} {/* Render the specific account page (e.g., profile, orders) */}
      </main>
      <Footer /> {/* Render the actual footer */}
    </div>
  );
}

'use client';

import type React from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function AccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Authentication is now handled by middleware.
  // This layout can be simpler and doesn't need to be a client component.
  // However, keeping it 'use client' because Header and Footer are client components.
  // The important part is removing the blocking useEffect and skeleton.
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-muted/30">
        {children}
      </main>
      <Footer />
    </div>
  );
}

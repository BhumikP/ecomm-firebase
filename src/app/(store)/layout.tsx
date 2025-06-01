
// src/app/(store)/layout.tsx
'use client';
import type React from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';


export default function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


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

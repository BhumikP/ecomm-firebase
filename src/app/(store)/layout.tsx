
// src/app/(store)/layout.tsx
'use client';
import { AnnouncementBar } from '@/components/layout/announcement-bar';
import type React from 'react';


export default function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <main className="flex-grow px-4">
        {children}
      </main>
    </div>
  );
}

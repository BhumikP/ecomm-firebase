
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Script from 'next/script';
import * as Sentry from "@sentry/nextjs";
import { Suspense } from 'react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'), // Important for OG images
  title: {
     default: 'eShop Simplified - Your Online Store for Everything',
     template: '%s | eShop Simplified',
  },
  description: 'Discover and shop a wide range of products on eShop Simplified. Find electronics, fashion, home goods, and more at great prices.',
  manifest: '/manifest.json',
  keywords: ['ecommerce', 'online shopping', 'electronics', 'fashion', 'home goods', 'deals', 'shop', 'buy online'],
  openGraph: {
       type: 'website',
       locale: 'en_US',
       url: '/', // Relative to metadataBase
       title: 'eShop Simplified - Your Online Store',
       description: 'Shop the best deals on electronics, fashion, and more on eShop Simplified.',
       siteName: 'eShop Simplified',
       images: [
         {
           url: '/og-image.png', // Example: Place an image in /public/og-image.png
           width: 1200,
           height: 630,
           alt: 'eShop Simplified - Great Deals Online',
         },
       ],
  },
  twitter: {
       card: 'summary_large_image',
       title: 'eShop Simplified - Your Online Store',
       description: 'Shop the best deals on electronics, fashion, and more on eShop Simplified.',
       images: ['/twitter-image.png'], // Example: /public/twitter-image.png
       // site: '@YourTwitterHandle', // Optional: Add Twitter site handle
       // creator: '@CreatorHandle', // Optional
  },
  alternates: {
    canonical: '/',
  },
  robots: {
     index: true,
     follow: true,
     googleBot: {
       index: true,
       follow: true,
       'max-video-preview': -1,
       'max-image-preview': 'large',
       'max-snippet': -1,
     },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png', // Example: /public/apple-touch-icon.png
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#008080' }, // Teal for light mode
    { media: '(prefers-color-scheme: dark)', color: '#14b8a6' }, // Lighter teal for dark mode
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Allow zoom for accessibility
  userScalable: true,
};

const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "eShop Simplified",
    "url": process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002',
    "logo": `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/logo.png`, // Example: /public/logo.png
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-XXX-XXX-XXXX", // Replace with your phone
      "contactType": "Customer Service",
      "areaServed": "IN", // Example: India
      "availableLanguage": "en"
    },
    "sameAs": [ // Optional: Add social media profile URLs
      // "https://www.facebook.com/YourPage",
      // "https://twitter.com/YourHandle",
      // "https://www.instagram.com/YourProfile"
    ]
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`} suppressHydrationWarning>
       <head>
          <Script
            id="organization-schema"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            strategy="beforeInteractive"
          />
       </head>
      <body className="antialiased flex flex-col min-h-screen" suppressHydrationWarning>
         <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center">Loading application...</div>}>
          <Sentry.ErrorBoundary fallback={<div className="flex h-screen w-screen items-center justify-center text-center p-4">An error has occurred. We are working on it!</div>}>
            {children}
          </Sentry.ErrorBoundary>
        </Suspense>
        <Toaster />
      </body>
    </html>
  );
}

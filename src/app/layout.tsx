import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Script from 'next/script'; // Import Script
import * as Sentry from "@sentry/nextjs"; // Import Sentry
import { Suspense } from 'react'; // Import Suspense

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
     default: 'eShop Simplified - Your Online Store for Everything', // Default title
     template: '%s | eShop Simplified', // Title template for subpages
  },
  description: 'Discover and shop a wide range of products on eShop Simplified. Find electronics, fashion, home goods, and more at great prices.',
  manifest: '/manifest.json', // Link PWA manifest
   keywords: ['ecommerce', 'online shopping', 'electronics', 'fashion', 'home goods', 'deals'], // Add relevant keywords
   // Open Graph meta tags for social sharing
   openGraph: {
       type: 'website',
       locale: 'en_US',
       url: 'https://YOUR_DOMAIN.com/', // Replace with your actual domain
       title: 'eShop Simplified - Your Online Store',
       description: 'Shop the best deals on electronics, fashion, and more.',
       siteName: 'eShop Simplified',
       // Add an image URL for social previews
       // images: [
       //   {
       //     url: 'https://YOUR_DOMAIN.com/og-image.jpg', // Replace with your actual image URL
       //     width: 1200,
       //     height: 630,
       //     alt: 'eShop Simplified Logo and Products',
       //   },
       // ],
   },
   // Twitter card meta tags
   twitter: {
       card: 'summary_large_image',
       // title: 'eShop Simplified - Your Online Store', // Can often inherit from openGraph
       // description: 'Shop the best deals on electronics, fashion, and more.', // Can often inherit
       // images: ['https://YOUR_DOMAIN.com/twitter-image.jpg'], // Replace if different from OG image
       // Optional: Add Twitter site handle
       // site: '@YourTwitterHandle',
   },
   // Add canonical URL if needed, especially if using dynamic routes heavily
   // alternates: {
   //   canonical: 'https://YOUR_DOMAIN.com/', // Replace with your domain
   // },
   // Robots meta tag (optional, defaults usually fine)
   // robots: {
   //    index: true,
   //    follow: true,
   //    googleBot: {
   //      index: true,
   //      follow: true,
   //      'max-video-preview': -1,
   //      'max-image-preview': 'large',
   //      'max-snippet': -1,
   //    },
   // },
};

// Define PWA viewport settings
export const viewport: Viewport = {
  themeColor: '#008080', // Teal accent color
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Consider allowing zoom for accessibility (remove if needed)
  // userScalable: false, // Comment out or set to true for accessibility
};

// JSON-LD Structured Data for Organization
const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "eShop Simplified",
    "url": "https://YOUR_DOMAIN.com/", // Replace with your domain
    "logo": "https://YOUR_DOMAIN.com/logo.png", // Replace with your logo URL
    // Optional: Add social profiles, contact point, etc.
    // "sameAs": [
    //   "https://www.facebook.com/YourPage",
    //   "https://twitter.com/YourHandle"
    // ],
    // "contactPoint": {
    //   "@type": "ContactPoint",
    //   "telephone": "+1-XXX-XXX-XXXX", // Replace with your phone
    //   "contactType": "Customer Service"
    // }
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
       <head>
          {/* Inline JSON-LD Structured Data */}
          <Script
             id="organization-schema"
             type="application/ld+json"
             dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
          />
          {/* Add other head elements like favicon links if needed */}
       </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        {/* Wrap children with Sentry Error Boundary */}
         {/* Using Suspense to handle potential async operations within Sentry setup or children */}
         <Suspense fallback={<div>Loading...</div>}>
             <Sentry.ErrorBoundary fallback={<div>An error has occurred</div>}>
                 {children}
             </Sentry.ErrorBoundary>
         </Suspense>
        <Toaster />
      </body>
    </html>
  );
}

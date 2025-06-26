// src/app/payment/failure/page.tsx
'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';


function FailureContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('order_id');

    return (
        <div className="flex flex-col items-center justify-center text-center p-4">
            <XCircle className="w-16 h-16 text-destructive mb-6" />
            <h1 className="text-3xl font-bold mb-2 text-foreground">Payment Failed</h1>
            <p className="text-lg text-muted-foreground mb-8">
                Unfortunately, we were unable to process your payment. Please try again.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                 {orderId ? (
                    <Button asChild size="lg">
                        <Link href={`/checkout`}>Try Again</Link> 
                    </Button>
                 ) : (
                    <Button asChild size="lg">
                        <Link href="/cart">Back to Cart</Link>
                    </Button>
                 )}
                <Button asChild variant="outline" size="lg">
                    <Link href="/contact">Contact Support</Link>
                </Button>
            </div>
             {orderId && (
                <p className="text-sm text-muted-foreground mt-8">Your order reference: {orderId}</p>
            )}
        </div>
    );
}


export default function PaymentFailurePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 flex items-center justify-center">
         <Suspense fallback={<div>Loading status...</div>}>
            <FailureContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

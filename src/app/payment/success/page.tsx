// src/app/payment/success/page.tsx
'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

function SuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('order_id');

    return (
        <div className="flex flex-col items-center justify-center text-center p-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-6" />
            <h1 className="text-3xl font-bold mb-2 text-foreground">Payment Successful!</h1>
            <p className="text-lg text-muted-foreground mb-8">
                Thank you for your order. We've received your payment and are getting your order ready.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg">
                    <Link href="/account/orders">View Your Orders</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                    <Link href="/">Continue Shopping</Link>
                </Button>
            </div>
            {orderId && (
                <p className="text-sm text-muted-foreground mt-8">Your order reference: {orderId}</p>
            )}
        </div>
    )
}

export default function PaymentSuccessPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 flex items-center justify-center">
        <Suspense fallback={<div>Loading confirmation...</div>}>
            <SuccessContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

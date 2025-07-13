// src/components/page-specific/homepage-client-content.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LoginPromptDialog } from '@/components/shared/login-prompt-dialog';
import { ProductCard, type ProductCardProductType as FetchedProduct } from '@/components/shared/product-card';
import { useToast } from '@/hooks/use-toast';
import type { IProductColor } from '@/models/Product';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

interface HomepageClientContentProps {
  sectionTitle: string;
  products: FetchedProduct[];
  viewAllLink: string;
  sectionId: string;
  isLoading: boolean;
}

const MAX_PRODUCTS_PER_CATEGORY_HOMEPAGE = 4;

export function HomepageClientContent({ sectionTitle, products, viewAllLink, sectionId, isLoading }: HomepageClientContentProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isAddingToCart, setIsAddingToCart] = useState<Record<string, boolean>>({});
  const [selectedColorPerProduct, setSelectedColorPerProduct] = useState<Record<string, IProductColor | undefined>>({});
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);

  const handleColorSelection = (productId: string, color?: IProductColor) => {
    setSelectedColorPerProduct(prev => ({ ...prev, [productId]: color }));
  };

  const handleAddToCart = async (product: FetchedProduct, selectedColor?: IProductColor) => {
    const productId = product._id.toString();
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      setIsLoginPromptOpen(true);
      return;
    }
    
    setIsAddingToCart(prev => ({ ...prev, [productId]: true }));

    const userDataString = localStorage.getItem('userData');
    if (!userDataString) {
      toast({ variant: "destructive", title: "Please Log In", description: "You need to be logged in to add items to your cart." });
      setIsAddingToCart(prev => ({ ...prev, [productId]: false }));
      return;
    }
    const userData = JSON.parse(userDataString);
    const userId = userData._id;

    if (!userId) {
      toast({ variant: "destructive", title: "Error", description: "User ID not found. Please log in again." });
      setIsAddingToCart(prev => ({ ...prev, [productId]: false }));
      return;
    }

    const quantity = product.minOrderQuantity || 1;
    const itemToAdd = selectedColor ? `${product.title} (${selectedColor.name})` : product.title;

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          productId: product._id,
          quantity,
          selectedColorName: selectedColor?.name,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to add item to cart');
      }
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      toast({
        title: "Added to Cart",
        description: `${itemToAdd} (Qty: ${quantity}) has been added.`,
      });
      router.push('/cart');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not add item to cart.",
      });
    } finally {
      setIsAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  return (
    <>
      <LoginPromptDialog isOpen={isLoginPromptOpen} onOpenChange={setIsLoginPromptOpen} />
      <section aria-labelledby={sectionId} className="container mx-auto px-4 mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 id={sectionId} className="text-2xl md:text-3xl font-bold text-foreground">{sectionTitle}</h2>
          {viewAllLink && (
            <Button variant="link" asChild className="text-primary hover:text-primary/80">
              <Link href={viewAllLink}>View All <ChevronRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          )}
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(MAX_PRODUCTS_PER_CATEGORY_HOMEPAGE)].map((_, i) => (
              <Skeleton key={`skel-${sectionTitle.toLowerCase()}-${i}`} className="h-[400px] w-full rounded-lg bg-muted" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard
                key={product._id.toString()}
                product={product}
                selectedColor={selectedColorPerProduct[product._id.toString()]}
                onColorSelect={handleColorSelection}
                onAddToCart={handleAddToCart}
                isAddingToCart={isAddingToCart[product._id.toString()] || false}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No {sectionTitle.toLowerCase()} available at the moment.</p>
        )}
      </section>
    </>
  );
}

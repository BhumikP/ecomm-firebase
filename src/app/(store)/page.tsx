// src/app/(store)/page.tsx
import React, { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Filter, Search, Tv, Shirt, HomeIcon as HomeGoodsIcon, Footprints, Blocks, Percent, ChevronRight, Zap } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from '@/components/ui/skeleton';
import type { IProductColor } from '@/models/Product';
import type { ICategory } from '@/models/Category';
import type { IBanner } from '@/models/Banner';
import { ScrollingH1AnnouncementBar } from '@/components/layout/scrolling-h1-announcement-bar';
import { HomepageClientContent } from '@/components/page-specific/homepage-client-content';
import mongoose from 'mongoose';
import connectDb from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Banner from '@/models/Banner';
import { ProductCardProductType } from '@/components/shared/product-card';

// Types and constants
interface CategoryLink {
    name: string;
    icon: React.ElementType;
    href: string;
    ariaLabel: string;
}

const categoryLinks: CategoryLink[] = [
    { name: 'Top Offers', icon: Percent, href: '/products?discountedOnly=true', ariaLabel: 'Shop Top Offers and Discounts' },
    { name: 'Newly Launched', icon: Zap, href: '/products?isNewlyLaunched=true', ariaLabel: 'Shop Newly Launched Products' },
    { name: 'Mobiles', icon: Search, href: '/products?categoryName=Mobiles', ariaLabel: 'Shop Mobile Phones' },
    { name: 'TVs', icon: Tv, href: '/products?categoryName=Electronics&subcategoryName=TV', ariaLabel: 'Shop Televisions' },
    { name: 'Electronics', icon: Search, href: '/products?categoryName=Electronics', ariaLabel: 'Shop Electronics' },
    { name: 'Fashion', icon: Shirt, href: '/products?categoryName=Apparel', ariaLabel: 'Shop Fashion and Apparel' },
    { name: 'Home Goods', icon: HomeGoodsIcon, href: '/products?categoryName=Home Goods', ariaLabel: 'Shop Home Goods' },
    { name: 'Footwear', icon: Footprints, href: '/products?categoryName=Footwear', ariaLabel: 'Shop Footwear' },
    { name: 'Accessories', icon: Blocks, href: '/products?categoryName=Accessories', ariaLabel: 'Shop Accessories' },
];

const MAX_HOMEPAGE_CATEGORIES = 4;
const MAX_PRODUCTS_PER_CATEGORY_HOMEPAGE = 4;
const MAX_FEATURED_PRODUCTS_HOMEPAGE = 4;

// Server-side data fetching functions
async function getHomepageCategories() {
  await connectDb();
  const categories = await Category.find({}).limit(MAX_HOMEPAGE_CATEGORIES).lean();
  return JSON.parse(JSON.stringify(categories)) as ICategory[];
}

async function getProductsForCategory(categoryId: string) {
  await connectDb();
  const products = await Product.find({ category: new mongoose.Types.ObjectId(categoryId) })
    .limit(MAX_PRODUCTS_PER_CATEGORY_HOMEPAGE)
    .populate('category', 'name')
    .lean();
  return JSON.parse(JSON.stringify(products)) as ProductCardProductType[];
}

async function getFeaturedProducts(query: mongoose.FilterQuery<any>) {
  await connectDb();
  const products = await Product.find(query)
    .limit(MAX_FEATURED_PRODUCTS_HOMEPAGE)
    .populate('category', 'name')
    .lean();
  return JSON.parse(JSON.stringify(products)) as ProductCardProductType[];
}

async function getBanners() {
  await connectDb();
  const banners = await Banner.find({ isActive: true }).sort({ order: 1 }).lean();
  return JSON.parse(JSON.stringify(banners)) as IBanner[];
}

// Server Components for different sections
async function FeaturedProductSection({ title, query, viewAllLink, sectionId }: { title: string, query: mongoose.FilterQuery<any>, viewAllLink: string, sectionId: string }) {
  const products = await getFeaturedProducts(query);
  return (
    <HomepageClientContent
      sectionTitle={title}
      products={products}
      viewAllLink={viewAllLink}
      sectionId={sectionId}
      isLoading={false}
    />
  );
}

async function CategorizedProductSection({ category }: { category: ICategory }) {
  const products = await getProductsForCategory(category._id.toString());
  return (
    <HomepageClientContent
      sectionTitle={category.name}
      products={products}
      viewAllLink={`/products?category=${category._id.toString()}`}
      sectionId={`category-${category._id.toString()}`}
      isLoading={false}
    />
  );
}

// Main Page Component (Server Component)
export default async function Home() {
  const [banners, homepageCategories] = await Promise.all([
    getBanners(),
    getHomepageCategories(),
  ]);

  return (
    <>
      <section aria-labelledby="category-navigation" className="bg-background shadow-sm py-4 mb-8 print:hidden border-b border-border">
        <div className="container mx-auto px-4">
          <h2 id="category-navigation" className="sr-only">Shop by Category</h2>
          <div className="flex justify-center items-center gap-x-4 md:gap-x-8 overflow-x-auto pb-1 no-scrollbar">
            {categoryLinks.map((category, index) => (
              <Link
                key={index}
                href={category.href}
                aria-label={category.ariaLabel}
                className="flex flex-col items-center text-center hover:text-primary transition-colors duration-200 flex-shrink-0 w-20 group"
              >
                <div className="p-3 bg-muted rounded-full mb-1.5 group-hover:bg-primary/10 transition-colors">
                  <category.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
                </div>
                <span className="text-xs font-medium text-foreground">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ScrollingH1AnnouncementBar text="🎉 Grand Opening Sale! Up to 50% OFF on selected items. Limited time offer! 🎉" className="mb-8" />

      <section aria-label="Promotional Banners" className="container mx-auto px-4 mb-12 print:hidden">
        {banners.length > 0 ? (
          <Carousel
            opts={{ loop: true }}
            className="overflow-hidden rounded-lg shadow-lg border border-border"
          >
            <CarouselContent>
              {banners.map((banner, index) => (
                <CarouselItem key={banner._id?.toString() || index} className="relative">
                  <div className="relative w-full h-auto max-h-[250px] md:max-h-[400px] overflow-hidden">
                    <Image
                      src={banner.imageUrl}
                      alt={banner.altText}
                      width={1200}
                      height={400}
                      className="w-full h-full object-cover bg-muted"
                      priority={index === 0}
                      data-ai-hint={banner.dataAiHint || 'promotional banner'}
                    />
                    {banner.title && (
                      <div className="absolute inset-x-0 top-0 p-4 md:p-8 bg-gradient-to-b from-black/70 via-black/50 to-transparent">
                        <h3 className="text-xl md:text-3xl lg:text-4xl font-bold text-white shadow-md">{banner.title}</h3>
                      </div>
                    )}
                  </div>
                  {banner.linkUrl && (
                    <Link href={banner.linkUrl} aria-label={banner.altText} className="absolute inset-0">
                      <span className="sr-only">Navigate to: {banner.altText}</span>
                    </Link>
                  )}
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/60 hover:bg-background/90 text-foreground border-border" />
            <CarouselNext className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/60 hover:bg-background/90 text-foreground border-border" />
          </Carousel>
        ) : (
          <div className="w-full h-[250px] md:h-[400px] rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
            No promotional banners available currently.
          </div>
        )}
      </section>
      
      <Suspense fallback={<ProductSectionSkeleton title="Top Buys" />}>
        <FeaturedProductSection
          title="Top Buys"
          query={{ isTopBuy: true }}
          viewAllLink="/products?isTopBuy=true"
          sectionId="top-buy-products"
        />
      </Suspense>

      <Suspense fallback={<ProductSectionSkeleton title="Newly Launched" />}>
        <FeaturedProductSection
          title="Newly Launched"
          query={{ isNewlyLaunched: true }}
          viewAllLink="/products?isNewlyLaunched=true"
          sectionId="newly-launched-products"
        />
      </Suspense>

      {homepageCategories.map(category => (
        <Suspense key={category._id.toString()} fallback={<ProductSectionSkeleton title={category.name} />}>
          <CategorizedProductSection category={category} />
        </Suspense>
      ))}

    </>
  );
}

// Skeleton component for Suspense fallback
function ProductSectionSkeleton({ title }: { title: string }) {
  return (
    <section aria-label={`Loading ${title}`} className="container mx-auto px-4 mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h2>
        <Button variant="link" disabled className="text-primary hover:text-primary/80">
          View All <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(MAX_PRODUCTS_PER_CATEGORY_HOMEPAGE)].map((_, i) => (
          <Skeleton key={`skel-${title}-${i}`} className="h-[400px] w-full rounded-lg bg-muted" />
        ))}
      </div>
    </section>
  );
}

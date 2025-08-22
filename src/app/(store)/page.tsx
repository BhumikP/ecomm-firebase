// src/app/(store)/page.tsx
import { HomepageClientContent } from '@/components/page-specific/homepage-client-content';
import { ProductCardProductType } from '@/components/shared/product-card';
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from '@/components/ui/skeleton';
import connectDb from '@/lib/mongodb';
import type { IBanner } from '@/models/Banner';
import Banner from '@/models/Banner';
import type { ICategory } from '@/models/Category';
import Category from '@/models/Category';
import Product from '@/models/Product';
import { ChevronRight, Sparkles, Tag, TrendingUp } from 'lucide-react';
import mongoose from 'mongoose';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

// Constants
const MAX_PRODUCTS_PER_CATEGORY_HOMEPAGE = 4;
const MAX_FEATURED_PRODUCTS_HOMEPAGE = 4;

// Server-side data fetching functions
async function getHomepageCategories() {
  await connectDb();
  const categories = await Category.find({}).lean();
  return JSON.parse(JSON.stringify(categories)) as ICategory[];
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
  return (
    <>
      <Link href={`/products?category=${category._id}&categoryName=${encodeURIComponent(category.name)}`} key={category.name} className="group flex flex-col items-center gap-4 text-center">
        <div className="relative w-32 h-32 overflow-hidden rounded-full shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:ring-4 group-hover:ring-primary/50">
          {category?.image && category.image.trim() !== '' ? (
            <Image
              src={category.image}
              alt={category.name}
              fill
              sizes="128px"
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
              <Tag className="h-12 w-12" />
            </div>
          )}
        </div>
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{category.name}</h3>
      </Link>
    </>
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
      <section aria-label="Promotional Banners" className="container mx-auto lg:px-10 my-12 print:hidden">
        {banners.length > 0 ? (
          <Carousel
            opts={{ loop: true }}
            className="overflow-hidden rounded-lg shadow-lg border border-border"
          >
            <CarouselContent>
              {banners.map((banner, index) => (
                <CarouselItem key={banner._id?.toString() || index} className="relative">
                  <div className="relative w-full aspect-[3/1] md:aspect-[5/2] overflow-hidden bg-muted">
                    {banner.imageUrl && banner.imageUrl.trim() !== '' ? (
                      <Image
                        src={banner.imageUrl}
                        alt={banner.altText}
                        fill
                        className="object-contain"
                        priority={index === 0}
                        data-ai-hint={banner.dataAiHint || 'promotional banner'}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                        <Sparkles className="h-16 w-16" />
                      </div>
                    )}
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
    
      {/* Category-based Product Sections */}
      <section aria-label="Shop by Category" className="container mx-auto lg:px-10 mb-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-semibold font-headline text-foreground">Shop by Category</h2>
          <p className="text-muted-foreground mt-2">Explore our curated collections.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-10 py-4">
          {homepageCategories.map(category => (
            <Suspense key={(category._id as string).toString()}>
              <CategorizedProductSection category={category} />
            </Suspense>
          ))}
        </div>
      </section>

  {/* Top Buys Section */}
      <Suspense fallback={<ProductSectionSkeleton title="Top Buys" />}>
        <FeaturedProductSection
          title="Top Buys"
          query={{ isTopBuy: true }}
          viewAllLink="/products?isTopBuy=true"
          sectionId="top-buy-products"
        />
      </Suspense>

      {/* Newly Launched Section */}
      <Suspense fallback={<ProductSectionSkeleton title="Newly Launched" />}>
        <FeaturedProductSection
          title="Newly Launched"
          query={{ isNewlyLaunched: true }}
          viewAllLink="/products?isNewlyLaunched=true"
          sectionId="newly-launched-products"
        />
      </Suspense>
      
      {/* Why Shop With Us Section */}
      <section className="container mx-auto lg:px-10 mb-12">
        <div className="bg-card p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-semibold font-headline text-center text-foreground mb-8">Why Shop With Us?</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center p-4">
              <Sparkles size={48} className="text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Quality Guaranteed</h3>
              <p className="text-muted-foreground text-sm">We source only the best products, ensuring top-notch quality and durability for your satisfaction.</p>
            </div>
            <div className="flex flex-col items-center p-4">
              <Tag size={48} className="text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Great Deals</h3>
              <p className="text-muted-foreground text-sm">Enjoy competitive prices and exclusive offers on a wide range of items.</p>
            </div>
            <div className="flex flex-col items-center p-4">
              <TrendingUp size={48} className="text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Easy Shopping</h3>
              <p className="text-muted-foreground text-sm">Our minimalist design ensures a smooth and enjoyable browsing and checkout experience.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// Skeleton component for Suspense fallback
function ProductSectionSkeleton({ title }: { title: string }) {
  return (
    <section aria-label={`Loading ${title}`} className="container mx-auto mb-12">
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

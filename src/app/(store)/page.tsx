// src/app/(store)/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Filter, Search, Loader2, ShoppingCart, Tv, Shirt, HomeIcon as HomeGoodsIcon, Footprints, Blocks, Percent, ChevronRight, Zap } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import type { IProductColor } from '@/models/Product';
import type { ICategory } from '@/models/Category';
import { ProductCard, type ProductCardProductType as FetchedProduct } from '@/components/shared/product-card';
import type { IBanner } from '@/models/Banner';


interface FilterState {
  categories: { [key: string]: boolean };
  priceRange: [number];
  discountedOnly: boolean;
  searchQuery: string;
}

interface CategoryLink {
    name: string;
    icon: React.ElementType;
    href: string;
    ariaLabel: string;
}

const categoryLinks: CategoryLink[] = [
    { name: 'Top Offers', icon: Percent, href: '/products?discountedOnly=true', ariaLabel: 'Shop Top Offers and Discounts' },
    { name: 'Newly Launched', icon: Zap, href: '/products?isNewlyLaunched=true', ariaLabel: 'Shop Newly Launched Products' },
    { name: 'Mobiles', icon: ShoppingCart, href: '/products?categoryName=Mobiles', ariaLabel: 'Shop Mobile Phones' },
    { name: 'TVs', icon: Tv, href: '/products?categoryName=Electronics&subcategoryName=TV', ariaLabel: 'Shop Televisions' },
    { name: 'Electronics', icon: ShoppingCart, href: '/products?categoryName=Electronics', ariaLabel: 'Shop Electronics' },
    { name: 'Fashion', icon: Shirt, href: '/products?categoryName=Apparel', ariaLabel: 'Shop Fashion and Apparel' },
    { name: 'Home Goods', icon: HomeGoodsIcon, href: '/products?categoryName=Home Goods', ariaLabel: 'Shop Home Goods' },
    { name: 'Footwear', icon: Footprints, href: '/products?categoryName=Footwear', ariaLabel: 'Shop Footwear' },
    { name: 'Accessories', icon: Blocks, href: '/products?categoryName=Accessories', ariaLabel: 'Shop Accessories' },
];


const MAX_HOMEPAGE_CATEGORIES = 4;
const MAX_PRODUCTS_PER_CATEGORY_HOMEPAGE = 4;
const MAX_FEATURED_PRODUCTS_HOMEPAGE = 4;
const DEFAULT_MAX_PRICE = 50000;


export default function Home() {
  const { toast } = useToast();

  const [filteredProducts, setFilteredProducts] = useState<FetchedProduct[]>([]);
  const [isFilteredLoading, setIsFilteredLoading] = useState(false);
  const [filteredError, setFilteredError] = useState<string | null>(null);

  const [productsByCat, setProductsByCat] = useState<Record<string, FetchedProduct[]>>({});
  const [homepageCategories, setHomepageCategories] = useState<ICategory[]>([]);
  const [isHomepageContentLoading, setIsHomepageContentLoading] = useState(true);

  const [topBuyProducts, setTopBuyProducts] = useState<FetchedProduct[]>([]);
  const [isTopBuyLoading, setIsTopBuyLoading] = useState(true);

  const [newlyLaunchedProducts, setNewlyLaunchedProducts] = useState<FetchedProduct[]>([]);
  const [isNewlyLaunchedLoading, setIsNewlyLaunchedLoading] = useState(true);

  const [bannerImages, setBannerImages] = useState<IBanner[]>([]);
  const [isBannersLoading, setIsBannersLoading] = useState(true);


  const [isAddingToCart, setIsAddingToCart] = useState<Record<string, boolean>>({});
  const [selectedColorPerProduct, setSelectedColorPerProduct] = useState<Record<string, IProductColor | undefined>>({});

  const [availableCategoriesAndSubcategories, setAvailableCategoriesAndSubcategories] = useState<ICategory[]>([]);

  const initialFilterCategoriesState = useMemo(() => {
    const cats: { [key: string]: boolean } = {};
    availableCategoriesAndSubcategories.forEach(cat => {
        const mainCatId = cat._id.toString();
        if (cat.subcategories && cat.subcategories.length > 0) {
            cat.subcategories.forEach(sub => {
                cats[`${mainCatId}_SUB_${sub}`] = false;
            });
        } else {
            cats[mainCatId] = false;
        }
    });
    return cats;
  }, [availableCategoriesAndSubcategories]);

  const [filters, setFilters] = useState<FilterState>({
    categories: {},
    priceRange: [DEFAULT_MAX_PRICE],
    discountedOnly: false,
    searchQuery: '',
  });
  const [priceValue, setPriceValue] = useState([DEFAULT_MAX_PRICE]);
  const [isFilteredView, setIsFilteredView] = useState(false);

  const fetchAndProcessProducts = async (url: string): Promise<FetchedProduct[]> => {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch products from ${url}. Status: ${response.status}`);
    }
    const data = await response.json();
    return (Array.isArray(data.products) ? data.products : []).map((p: any) => ({
      ...p,
      _id: p._id.toString(),
      colors: (p.colors || []).map((c: any) => ({ ...c, imageUrls: Array.isArray(c.imageUrls) ? c.imageUrls : [] })),
      category: p.category || { _id: 'unknown', name: 'Uncategorized', subcategories: [] },
      minOrderQuantity: p.minOrderQuantity || 1,
      isTopBuy: p.isTopBuy || false,
      isNewlyLaunched: p.isNewlyLaunched || false,
    }));
  };

  const fetchBannersData = async () => {
    setIsBannersLoading(true);
    try {
        const response = await fetch('/api/banners');
        if (!response.ok) {
            throw new Error('Failed to fetch banners');
        }
        const data = await response.json();
        setBannerImages(Array.isArray(data.banners) ? data.banners : []);
    } catch (err) {
        toast({ variant: "destructive", title: "Banners Error", description: (err as Error).message });
        setBannerImages([]);
    } finally {
        setIsBannersLoading(false);
    }
  };


  const fetchHomepageData = async () => {
    setIsHomepageContentLoading(true);
    setIsTopBuyLoading(true);
    setIsNewlyLaunchedLoading(true);
    fetchBannersData();
    try {
      const categoriesResponse = await fetch('/api/categories');
      if (!categoriesResponse.ok) {
        const errorData = await categoriesResponse.json();
        throw new Error(errorData.message || `Failed to fetch categories for homepage. Status: ${categoriesResponse.status}`);
      }
      const categoriesData = await categoriesResponse.json();
      const allCats: ICategory[] = Array.isArray(categoriesData.categories) ? categoriesData.categories : [];
      setAvailableCategoriesAndSubcategories(allCats);

      const initialCatFilters: { [key: string]: boolean } = {};
      allCats.forEach(cat => {
          const mainCatId = cat._id.toString();
          if (cat.subcategories && cat.subcategories.length > 0) {
              cat.subcategories.forEach(sub => { initialCatFilters[`${mainCatId}_SUB_${sub}`] = false; });
          } else {
              initialCatFilters[mainCatId] = false;
          }
      });
      setFilters(prev => ({ ...prev, categories: initialCatFilters }));

      const displayCats = allCats.slice(0, MAX_HOMEPAGE_CATEGORIES);
      setHomepageCategories(displayCats);

      const productsByCategoryPromises = displayCats.map(cat =>
        fetchAndProcessProducts(`/api/products?category=${cat._id}&limit=${MAX_PRODUCTS_PER_CATEGORY_HOMEPAGE}&populate=category`)
          .then(products => ({ categoryId: cat._id.toString(), products }))
      );

      const results = await Promise.allSettled(productsByCategoryPromises);
      const newProductsByCat: Record<string, FetchedProduct[]> = {};
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          newProductsByCat[result.value.categoryId] = result.value.products;
        } else if (result.status === 'rejected') {
          // Handle rejected promises if necessary
        }
      });
      setProductsByCat(newProductsByCat);

    } catch (err) {
      toast({ variant: "destructive", title: "Homepage Load Error", description: (err as Error).message });
    } finally {
      setIsHomepageContentLoading(false);
    }

    try {
        setTopBuyProducts(await fetchAndProcessProducts(`/api/products?isTopBuy=true&limit=${MAX_FEATURED_PRODUCTS_HOMEPAGE}&populate=category`));
    } catch (err) {
        toast({ variant: "destructive", title: "Top Buys Error", description: (err as Error).message });
    } finally {
        setIsTopBuyLoading(false);
    }

    try {
        setNewlyLaunchedProducts(await fetchAndProcessProducts(`/api/products?isNewlyLaunched=true&limit=${MAX_FEATURED_PRODUCTS_HOMEPAGE}&populate=category`));
    } catch (err) {
        toast({ variant: "destructive", title: "New Arrivals Error", description: (err as Error).message });
    } finally {
        setIsNewlyLaunchedLoading(false);
    }
  };

  const fetchFilteredProducts = async (currentFilters: FilterState) => {
    setIsFilteredLoading(true);
    setFilteredError(null);
    try {
        const params = new URLSearchParams();
        if (currentFilters.searchQuery) params.append('searchQuery', currentFilters.searchQuery);

        Object.entries(currentFilters.categories)
            .filter(([, checked]) => checked)
            .forEach(([filterKey]) => {
                const parts = filterKey.split('_SUB_');
                params.append('category', parts[0]);
                if (parts.length === 2) params.append('subcategory', parts[1]);
            });

        if (currentFilters.priceRange[0] < DEFAULT_MAX_PRICE) params.append('maxPrice', currentFilters.priceRange[0].toString());
        if (currentFilters.discountedOnly) params.append('discountedOnly', 'true');

        params.append('limit', '12');
        params.append('populate', 'category');

        setFilteredProducts(await fetchAndProcessProducts(`/api/products?${params.toString()}`));
    } catch (err: any) {
        setFilteredError(err.message || "Could not load products.");
        setFilteredProducts([]);
        toast({ variant: "destructive", title: "Filter Error", description: err.message });
    } finally {
        setIsFilteredLoading(false);
    }
  };

  useEffect(() => {
    fetchHomepageData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const activeFilter = filters.searchQuery ||
                         Object.values(filters.categories).some(v => v) ||
                         filters.priceRange[0] < DEFAULT_MAX_PRICE ||
                         filters.discountedOnly;

    if (activeFilter) {
        setIsFilteredView(true);
        const debounceTimer = setTimeout(() => { fetchFilteredProducts(filters); }, 500);
        return () => clearTimeout(debounceTimer);
    } else {
        setIsFilteredView(false);
    }
  }, [filters]);


  const handleAddToCart = async (product: FetchedProduct, selectedColor?: IProductColor) => {
    const productId = product._id.toString();
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

  const handleApplyFilters = () => {
     const newFiltersState = { ...filters, priceRange: [priceValue[0]] as [number] };
     setFilters(newFiltersState);
     toast({ title: "Filters Applied", description: "Product list updated." });
     document.getElementById('close-filter-sheet')?.click();
  };

 const handleCategoryChange = (filterKey: string, checked: boolean | "indeterminate") => {
     if (typeof checked === 'boolean') {
         setFilters(prevFilters => ({
             ...prevFilters,
             categories: { ...prevFilters.categories, [filterKey]: checked }
         }));
     }
 };

 const handleDiscountChange = (checked: boolean | "indeterminate") => {
      if (typeof checked === 'boolean') {
         setFilters(prevFilters => ({ ...prevFilters, discountedOnly: checked }));
      }
 };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
     const query = event.target.value;
      setFilters(prevFilters => ({ ...prevFilters, searchQuery: query }));
  };

   const handleClearFilters = () => {
        const defaultFilters: FilterState = {
            categories: initialFilterCategoriesState,
            priceRange: [DEFAULT_MAX_PRICE],
            discountedOnly: false,
            searchQuery: '',
        };
        setPriceValue([DEFAULT_MAX_PRICE]);
        setFilters(defaultFilters);
        setIsFilteredView(false);
        toast({ title: "Filters Cleared", description: "Showing default homepage view." });
        document.getElementById('close-filter-sheet')?.click();
    };

  const handleColorSelection = (productId: string, color?: IProductColor) => {
      setSelectedColorPerProduct(prev => ({ ...prev, [productId]: color }));
  };

  const renderProductSection = (title: string, products: FetchedProduct[], isLoadingFlag: boolean, viewAllLink?: string, sectionId?: string) => {
    return (
      <section aria-labelledby={sectionId || title.toLowerCase().replace(/\s+/g, '-')} className="container mx-auto px-4 mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 id={sectionId || title.toLowerCase().replace(/\s+/g, '-')} className="text-2xl md:text-3xl font-bold text-foreground">{title}</h2>
          {viewAllLink && (
            <Button variant="link" asChild className="text-primary hover:text-primary/80">
              <Link href={viewAllLink}>View All <ChevronRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          )}
        </div>
        {isLoadingFlag ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(MAX_FEATURED_PRODUCTS_HOMEPAGE)].map((_, i) => (
              <Skeleton key={`skel-${title.toLowerCase()}-${i}`} className="h-[400px] w-full rounded-lg bg-muted" />
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
          <p className="text-muted-foreground">No {title.toLowerCase()} featured at the moment.</p>
        )}
      </section>
    );
  };


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

      <section aria-label="Promotional Banners" className="container mx-auto px-4 mb-12 print:hidden">
        {isBannersLoading ? (
          <Skeleton className="w-full h-[250px] md:h-[400px] rounded-lg bg-muted" />
        ) : bannerImages.length > 0 ? (
          <Carousel
              plugins={[ Autoplay({ delay: 4000, stopOnInteraction: true }) ]}
              opts={{ loop: true }}
              className="overflow-hidden rounded-lg shadow-lg border border-border"
          >
              <CarouselContent>
                  {bannerImages.map((banner, index) => (
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
                                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/1200x400.png?text=Banner+Error'; }}
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

      {renderProductSection("Top Buys", topBuyProducts, isTopBuyLoading, "/products?isTopBuy=true", "top-buy-products")}
      {renderProductSection("Newly Launched", newlyLaunchedProducts, isNewlyLaunchedLoading, "/products?isNewlyLaunched=true", "newly-launched-products")}

      <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 print:hidden">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {isFilteredView ? 'Filtered Products' : 'Shop All Products'}
          </h1>
          <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-grow md:flex-grow-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                      type="search"
                      placeholder="Search products..."
                      className="pl-10 w-full md:w-64 bg-background"
                      value={filters.searchQuery}
                      onChange={handleSearchChange}
                      aria-label="Search products"
                  />
              </div>
              <Sheet>
              <SheetTrigger asChild>
                  <Button variant="outline" className="shrink-0 bg-background">
                  <Filter className="mr-2 h-4 w-4" /> Filters
                  </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                  <SheetHeader>
                  <SheetTitle>Filter Products</SheetTitle>
                  <SheetDescription>Refine your search.</SheetDescription>
                  </SheetHeader>
                  <div className="grid gap-4 py-4">
                      <fieldset className="space-y-2">
                          <legend className="font-semibold mb-1 text-sm">Category</legend>
                          {availableCategoriesAndSubcategories.length > 0 ? availableCategoriesAndSubcategories.map(cat => {
                              const mainCatId = cat._id.toString();
                              return (
                              <React.Fragment key={mainCatId}>
                                  {cat.subcategories && cat.subcategories.length > 0 ? (
                                      <>
                                          <p className="font-medium text-xs pt-2 text-muted-foreground">{cat.name}</p>
                                          {cat.subcategories.map(sub => {
                                              const filterKey = `${mainCatId}_SUB_${sub}`;
                                              return (
                                                  <div key={filterKey} className="flex items-center space-x-2 pl-2">
                                                      <Checkbox
                                                          id={`cat-filter-${filterKey}`}
                                                          checked={filters.categories[filterKey] || false}
                                                          onCheckedChange={(checked) => handleCategoryChange(filterKey, checked)}
                                                          aria-labelledby={`label-cat-filter-${filterKey}`}
                                                      />
                                                      <Label id={`label-cat-filter-${filterKey}`} htmlFor={`cat-filter-${filterKey}`} className="cursor-pointer text-sm font-normal">{sub}</Label>
                                                  </div>
                                              );
                                          })}
                                      </>
                                  ) : (
                                      <div key={mainCatId} className="flex items-center space-x-2">
                                          <Checkbox
                                              id={`cat-filter-${mainCatId}`}
                                              checked={filters.categories[mainCatId] || false}
                                              onCheckedChange={(checked) => handleCategoryChange(mainCatId, checked)}
                                              aria-labelledby={`label-cat-filter-${mainCatId}`}
                                          />
                                          <Label id={`label-cat-filter-${mainCatId}`} htmlFor={`cat-filter-${mainCatId}`} className="cursor-pointer text-sm font-normal">{cat.name}</Label>
                                      </div>
                                  )}
                              </React.Fragment>
                          )}) : isHomepageContentLoading || isFilteredLoading ? (
                              <Skeleton className="h-5 w-24 bg-muted" />
                          ) : (
                              <p className="text-sm text-muted-foreground">No categories available.</p>
                          )}
                      </fieldset>
                      <div className="space-y-2">
                           <Label className="font-semibold text-sm" htmlFor="price-range">Max Price: ₹{priceValue[0].toLocaleString('en-IN')}</Label>
                          <Slider
                              value={priceValue}
                              onValueChange={setPriceValue}
                              max={DEFAULT_MAX_PRICE}
                              step={1000}
                              id="price-range"
                              aria-label="Maximum price slider"
                           />
                          <div className="flex justify-between text-xs text-muted-foreground">
                              <span>₹0</span>
                              <span>₹{DEFAULT_MAX_PRICE.toLocaleString('en-IN')}</span>
                          </div>
                      </div>
                      <div className="flex items-center space-x-2 pt-2">
                          <Checkbox
                              id="discounted"
                              checked={filters.discountedOnly}
                              onCheckedChange={handleDiscountChange}
                              aria-labelledby="label-discounted"
                          />
                          <Label id="label-discounted" htmlFor="discounted" className="cursor-pointer">Show Only Discounted Items</Label>
                      </div>
                  </div>
                   <div className="mt-6 flex flex-col gap-2">
                      <Button id="apply-filters-button" type="button" onClick={handleApplyFilters} className="w-full bg-primary hover:bg-primary/90">Apply Filters</Button>
                      <Button id="clear-filters-button" type="button" variant="outline" onClick={handleClearFilters} className="w-full">Clear Filters</Button>
                       <SheetClose id="close-filter-sheet" className="hidden" />
                  </div>
              </SheetContent>
              </Sheet>
          </div>
          </div>

          <section aria-live="polite">
              {isFilteredView ? (
                  isFilteredLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {[...Array(8)].map((_, i) => (
                              <Skeleton key={`skel-filtered-${i}`} className="h-[400px] w-full rounded-lg bg-muted" />
                          ))}
                      </div>
                  ) : filteredError ? (
                      <div className="text-center py-10 text-destructive bg-red-50 border border-destructive rounded-md p-6">
                          <h2 className="text-lg font-semibold mb-2">Failed to Load Products</h2>
                          <p className="mb-4">{filteredError}</p>
                          <Button onClick={() => fetchFilteredProducts(filters)} variant="destructive" className="mt-4">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Retry
                          </Button>
                      </div>
                  ) : filteredProducts.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                         {filteredProducts.map(product => (
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
                      <div className="text-center py-10 col-span-full bg-muted/50 rounded-md p-6">
                          <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-lg font-semibold text-foreground mb-2">No products found</p>
                          <p className="text-muted-foreground mb-4">Try adjusting your filters or search query.</p>
                          <Button onClick={handleClearFilters} variant="outline">Clear Filters</Button>
                      </div>
                  )
              ) : (
                  isHomepageContentLoading ? (
                      <div>
                          {[...Array(MAX_HOMEPAGE_CATEGORIES)].map((_, catIndex) => (
                              <div key={`skel-cat-${catIndex}`} className="mb-12">
                                  <Skeleton className="h-8 w-1/2 md:w-1/3 mb-6 bg-muted rounded" />
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                      {[...Array(MAX_PRODUCTS_PER_CATEGORY_HOMEPAGE)].map((_, prodIndex) => (
                                         <Skeleton key={`skel-prod-${catIndex}-${prodIndex}`} className="h-[400px] w-full rounded-lg bg-muted" />
                                      ))}
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : homepageCategories.length > 0 ? (
                      homepageCategories.map(category => (
                          <section key={category._id.toString()} aria-labelledby={`category-title-${category._id.toString()}`} className="mb-12">
                              <div className="flex justify-between items-center mb-6">
                                  <h2 id={`category-title-${category._id.toString()}`} className="text-2xl md:text-3xl font-bold text-foreground">{category.name}</h2>
                                  <Button variant="link" asChild className="text-primary hover:text-primary/80">
                                      <Link href={`/products?category=${category._id.toString()}`}>View All <ChevronRight className="h-4 w-4 ml-1" /></Link>
                                  </Button>
                              </div>
                              {productsByCat[category._id.toString()] && productsByCat[category._id.toString()].length > 0 ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                      {productsByCat[category._id.toString()].map(product => (
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
                                  <p className="text-muted-foreground">No products found in this category yet.</p>
                              )}
                          </section>
                      ))
                  ) : (
                       <div className="text-center py-10 col-span-full bg-muted/50 rounded-md p-6">
                          <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-lg font-semibold text-foreground mb-2">No categories to display</p>
                          <p className="text-muted-foreground">Check back later for more products.</p>
                      </div>
                  )
              )}
          </section>
      </div>
    </>
  );
}

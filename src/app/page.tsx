// src/app/page.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from '@/components/ui/input';
import { Filter, Search, Loader2, ShoppingCart, Tv, Shirt, HomeIcon as HomeGoodsIcon, Footprints, Blocks, Percent, Menu, ChevronLeft, ChevronRight, Star, Palette, X, Info } from 'lucide-react';
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
import type { IProduct, IProductColor } from '@/models/Product';
import type { ICategory } from '@/models/Category';

interface FetchedProduct extends Omit<IProduct, 'category' | 'colors' | '_id'> {
  _id: string;
  category: ICategory; // Ensure category is populated with ICategory structure
  colors: IProductColor[];
  thumbnailUrl: string;
  minOrderQuantity: number;
  isTopBuy?: boolean; // Added
}

interface FilterState {
  categories: { [key: string]: boolean }; // Key: categoryId or categoryId_SUB_subcategoryName
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

// These links will now point to /products page with query parameters
const categoryLinks: CategoryLink[] = [
    { name: 'Top Offers', icon: Percent, href: '/products?discountedOnly=true', ariaLabel: 'Shop Top Offers and Discounts' },
    { name: 'Mobiles', icon: ShoppingCart, href: '/products?categoryName=Mobiles', ariaLabel: 'Shop Mobile Phones' }, // Example: using categoryName
    { name: 'TVs', icon: Tv, href: '/products?categoryName=Electronics&subcategoryName=TV', ariaLabel: 'Shop Televisions' }, // Example for subcategory
    { name: 'Electronics', icon: ShoppingCart, href: '/products?categoryName=Electronics', ariaLabel: 'Shop Electronics' },
    { name: 'Fashion', icon: Shirt, href: '/products?categoryName=Apparel', ariaLabel: 'Shop Fashion and Apparel' },
    { name: 'Home Goods', icon: HomeGoodsIcon, href: '/products?categoryName=Home Goods', ariaLabel: 'Shop Home Goods' },
    { name: 'Footwear', icon: Footprints, href: '/products?categoryName=Footwear', ariaLabel: 'Shop Footwear' },
    { name: 'Accessories', icon: Blocks, href: '/products?categoryName=Accessories', ariaLabel: 'Shop Accessories' },
];


const bannerImages = [
    { src: 'https://picsum.photos/1200/400?random=banner1', alt: 'Special discount on latest electronics', dataAiHint: 'sale promotion electronics gadgets' },
    { src: 'https://picsum.photos/1200/400?random=banner2', alt: 'New season fashion arrivals', dataAiHint: 'new arrivals fashion clothing' },
    { src: 'https://picsum.photos/1200/400?random=banner3', alt: 'Upgrade your home appliances with our offers', dataAiHint: 'home appliance discount kitchen' },
];

const MAX_HOMEPAGE_CATEGORIES = 4;
const MAX_PRODUCTS_PER_CATEGORY_HOMEPAGE = 4;
const DEFAULT_MAX_PRICE = 50000;


export default function Home() {
  const { toast } = useToast();
  
  // State for filtered products view on homepage
  const [filteredProducts, setFilteredProducts] = useState<FetchedProduct[]>([]);
  const [isFilteredLoading, setIsFilteredLoading] = useState(false);
  const [filteredError, setFilteredError] = useState<string | null>(null);

  // State for homepage category-wise display
  const [productsByCat, setProductsByCat] = useState<Record<string, FetchedProduct[]>>({});
  const [homepageCategories, setHomepageCategories] = useState<ICategory[]>([]);
  const [isHomepageContentLoading, setIsHomepageContentLoading] = useState(true);
  
  // State for Top Buy products
  const [topBuyProducts, setTopBuyProducts] = useState<FetchedProduct[]>([]);
  const [isTopBuyLoading, setIsTopBuyLoading] = useState(true);


  // Common state
  const [availableCategoriesAndSubcategories, setAvailableCategoriesAndSubcategories] = useState<ICategory[]>([]);
  const [selectedColorPerProduct, setSelectedColorPerProduct] = useState<Record<string, IProductColor | undefined>>({});
  
  const initialFilterCategoriesState = useMemo(() => {
    const cats: { [key: string]: boolean } = {};
    availableCategoriesAndSubcategories.forEach(cat => {
        if (cat.subcategories && cat.subcategories.length > 0) {
            cat.subcategories.forEach(sub => {
                 // Use a consistent key format: categoryId_SUB_subcategoryName
                cats[`${cat._id.toString()}_SUB_${sub}`] = false;
            });
        } else {
            cats[cat._id.toString()] = false;
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


  const fetchHomepageData = async () => {
    setIsHomepageContentLoading(true);
    setIsTopBuyLoading(true); // Start loading top buys as well
    try {
      const categoriesResponse = await fetch('/api/categories');
      if (!categoriesResponse.ok) {
        const errorText = await categoriesResponse.text();
        console.error("Failed to fetch categories. Status:", categoriesResponse.status, "Response:", errorText);
        throw new Error(`Failed to fetch categories for homepage. Status: ${categoriesResponse.status}`);
      }
      const categoriesData = await categoriesResponse.json();
      const allCats: ICategory[] = Array.isArray(categoriesData.categories) ? categoriesData.categories : [];
      setAvailableCategoriesAndSubcategories(allCats);

      const initialCatFilters: { [key: string]: boolean } = {};
      allCats.forEach(cat => {
          if (cat.subcategories && cat.subcategories.length > 0) {
              cat.subcategories.forEach(sub => {
                  initialCatFilters[`${cat._id.toString()}_SUB_${sub}`] = false;
              });
          } else {
              initialCatFilters[cat._id.toString()] = false;
          }
      });
      setFilters(prev => ({ ...prev, categories: initialCatFilters }));


      const displayCats = allCats.slice(0, MAX_HOMEPAGE_CATEGORIES);
      setHomepageCategories(displayCats);

      const productsByCategoryPromises = displayCats.map(cat =>
        fetch(`/api/products?category=${cat._id}&limit=${MAX_PRODUCTS_PER_CATEGORY_HOMEPAGE}&populate=category`)
          .then(res => res.ok ? res.json() : Promise.reject(new Error(`Failed for category ${cat.name}`)))
          .then(data => ({
            categoryId: cat._id.toString(),
            products: (Array.isArray(data.products) ? data.products : []).map((p: FetchedProduct) => ({
              ...p,
              _id: p._id.toString(),
              colors: (p.colors || []).map(c => ({ ...c, imageUrls: Array.isArray(c.imageUrls) ? c.imageUrls : [] })),
              minOrderQuantity: p.minOrderQuantity || 1,
              isTopBuy: p.isTopBuy || false,
            }))
          }))
      );
      
      const results = await Promise.allSettled(productsByCategoryPromises);
      const newProductsByCat: Record<string, FetchedProduct[]> = {};
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          newProductsByCat[result.value.categoryId] = result.value.products;
        } else if (result.status === 'rejected') {
          console.error("Error fetching products for a category:", result.reason);
        }
      });
      setProductsByCat(newProductsByCat);

    } catch (err) {
      console.error("Error fetching homepage data:", err);
    } finally {
      setIsHomepageContentLoading(false);
    }

    // Fetch Top Buy products
    try {
        const topBuyResponse = await fetch(`/api/products?isTopBuy=true&limit=4&populate=category`);
        if (!topBuyResponse.ok) {
            throw new Error('Failed to fetch top buy products');
        }
        const topBuyData = await topBuyResponse.json();
        setTopBuyProducts(Array.isArray(topBuyData.products) ? topBuyData.products.map((p: FetchedProduct) => ({
            ...p,
            _id: p._id.toString(),
            colors: (p.colors || []).map(c => ({ ...c, imageUrls: Array.isArray(c.imageUrls) ? c.imageUrls : [] })),
            category: p.category || { _id: 'unknown', name: 'Unknown', subcategories: [] },
            minOrderQuantity: p.minOrderQuantity || 1,
            isTopBuy: p.isTopBuy || false,
        })) : []);
    } catch (err) {
        console.error("Error fetching top buy products:", err);
    } finally {
        setIsTopBuyLoading(false);
    }
  };

  const fetchFilteredProducts = async (currentFilters: FilterState) => {
    setIsFilteredLoading(true);
    setFilteredError(null);
    try {
        const params = new URLSearchParams();
        if (currentFilters.searchQuery) {
            params.append('searchQuery', currentFilters.searchQuery);
        }

        Object.entries(currentFilters.categories)
            .filter(([, checked]) => checked)
            .forEach(([filterKey]) => {
                const parts = filterKey.split('_SUB_');
                if (parts.length === 2) { 
                    params.append('category', parts[0]); // categoryId
                    params.append('subcategory', parts[1]); // subcategoryName
                } else { 
                    params.append('category', parts[0]); // categoryId
                }
            });

        if (currentFilters.priceRange[0] < DEFAULT_MAX_PRICE) {
            params.append('maxPrice', currentFilters.priceRange[0].toString());
        }
        if (currentFilters.discountedOnly) {
            params.append('discountedOnly', 'true');
        }
        params.append('limit', '12'); 
        params.append('populate', 'category');

        const response = await fetch(`/api/products?${params.toString()}`);
        if (!response.ok) {
            const errorText = await response.text();
            console.error("API Error Response (Filtered):", errorText);
            setFilteredError(`Failed to fetch products. Server responded with ${response.status}.`);
            throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const fetchedProductsList: FetchedProduct[] = (Array.isArray(data.products) ? data.products : []).map((p: FetchedProduct) => ({
            ...p,
            _id: p._id.toString(),
            colors: (p.colors || []).map(c => ({ ...c, imageUrls: Array.isArray(c.imageUrls) ? c.imageUrls : [] })),
            minOrderQuantity: p.minOrderQuantity || 1,
            isTopBuy: p.isTopBuy || false,
        }));
        setFilteredProducts(fetchedProductsList);
    } catch (err: any) {
        console.error("Error fetching filtered products:", err);
        setFilteredError(err.message || "Could not load products.");
        setFilteredProducts([]);
    } finally {
        setIsFilteredLoading(false);
    }
  };

  useEffect(() => {
    fetchHomepageData();
  }, []);

  useEffect(() => {
    const activeFilter = filters.searchQuery || 
                         Object.values(filters.categories).some(v => v) || 
                         filters.priceRange[0] < DEFAULT_MAX_PRICE ||
                         filters.discountedOnly;
    
    if (activeFilter) {
        setIsFilteredView(true);
        const debounceTimer = setTimeout(() => {
            fetchFilteredProducts(filters);
        }, 500); 
        return () => clearTimeout(debounceTimer);
    } else {
        setIsFilteredView(false); 
    }
  }, [filters]);


  const handleAddToCart = (product: FetchedProduct, selectedColor?: IProductColor) => {
    const itemToAdd = selectedColor ? `${product.title} (${selectedColor.name})` : product.title;
    console.log(`Adding ${itemToAdd} to cart`);
    toast({
      title: "Added to Cart",
      description: `${itemToAdd} has been added to your cart.`,
    });
  };
  
  const handleApplyFilters = () => {
     const newFiltersState = {
         ...filters,
         priceRange: [priceValue[0]] as [number],
     };
     setFilters(newFiltersState);
     toast({ title: "Filters Applied", description: "Product list updated." });
     document.getElementById('close-filter-sheet')?.click();
  };

 const handleCategoryChange = (filterKey: string, checked: boolean | "indeterminate") => {
     if (typeof checked === 'boolean') {
         setFilters(prevFilters => ({
             ...prevFilters,
             categories: {
                 ...prevFilters.categories,
                 [filterKey]: checked
             }
         }));
     }
 };

 const handleDiscountChange = (checked: boolean | "indeterminate") => {
      if (typeof checked === 'boolean') {
         setFilters(prevFilters => ({
             ...prevFilters,
             discountedOnly: checked
         }));
      }
 };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
     const query = event.target.value;
      setFilters(prevFilters => ({
          ...prevFilters,
          searchQuery: query
      }));
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

  const renderProductCard = (product: FetchedProduct) => {
    const selectedColor = selectedColorPerProduct[product._id];
    const displayImage = selectedColor?.imageUrls?.[0] ?? product.thumbnailUrl ?? 'https://picsum.photos/300/200?random=placeholder';
    const minOrderQty = product.minOrderQuantity || 1;
    const currentStock = selectedColor?.stock ?? product.stock ?? 0;
    const isOutOfStock = currentStock < minOrderQty;


    return (
        <Card key={product._id.toString()} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col bg-background group">
        <CardHeader className="p-0 relative">
            <Link href={`/products/${product._id.toString()}`} aria-label={`View details for ${product.title}`} className="block aspect-[4/3] overflow-hidden">
                <Image
                src={displayImage}
                alt={product.title}
                width={300}
                height={200}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                loading="lazy"
                data-ai-hint="product image retail fashion electronics"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/300/200?random=onerror'; }}
                />
            </Link>
            {product.discount && product.discount > 0 && (
            <Badge variant="destructive" className="absolute top-2 right-2 shadow-md">{product.discount}% OFF</Badge>
            )}
        </CardHeader>
        <CardContent className="p-4 flex-grow">
            <Link href={`/products/${product._id.toString()}`}>
                <CardTitle className="text-base md:text-lg font-semibold hover:text-primary transition-colors duration-200 mb-1 leading-tight line-clamp-2">{product.title}</CardTitle>
            </Link>
             {product.category && <p className="text-xs text-muted-foreground mb-1">{product.category.name}{product.subcategory ? ` > ${product.subcategory}` : ''}</p>}
            <div className="flex items-center gap-1 mt-1">
                 {[...Array(5)].map((_, i) => (
                     <Star key={i} className={`h-4 w-4 ${i < Math.round(product.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                 ))}
                <span className="text-xs text-muted-foreground ml-1">({product.rating?.toFixed(1) ?? 'N/A'})</span>
            </div>

            {product.colors && product.colors.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 items-center">
                    <Palette className="h-4 w-4 text-muted-foreground mr-1"/>
                    {product.colors.map((color, index) => (
                        <button
                            key={color._id?.toString() || `${color.name}-${index}`}
                            title={color.name}
                            aria-label={`Select color ${color.name}`}
                            onClick={() => handleColorSelection(product._id.toString(), color)}
                            className={`h-5 w-5 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary transition-all
                                ${selectedColor === color ? 'ring-2 ring-primary ring-offset-1 border-primary' : 'border-muted-foreground/30'}
                                ${color.stock < minOrderQty ? 'opacity-50 cursor-not-allowed relative' : ''} 
                                `}
                            style={{ backgroundColor: color.hexCode || 'transparent' }}
                            disabled={color.stock < minOrderQty}
                        >
                           {!color.hexCode && <span className="sr-only">{color.name}</span>}
                            {color.stock < minOrderQty && <X className="h-3 w-3 text-destructive-foreground absolute inset-0 m-auto opacity-70" />}
                        </button>
                    ))}
                </div>
            )}
             {minOrderQty > 1 && (
                <div className="flex items-center text-xs text-muted-foreground gap-1 mt-2">
                    <Info className="h-3 w-3"/>
                    <span>Min. order: {minOrderQty}</span>
                </div>
            )}

        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center mt-auto">
            <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground">
                    ₹{product.discount && product.discount > 0
                        ? (product.price * (1 - product.discount / 100)).toFixed(2)
                        : product.price.toFixed(2)}
                </span>
                {product.discount && product.discount > 0 && (
                    <span className="text-xs text-muted-foreground line-through">
                        ₹{product.price.toFixed(2)}
                    </span>
                )}
            </div>
            <Button
                size="sm"
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => handleAddToCart(product, selectedColor)}
                aria-label={`Add ${product.title} to cart`}
                disabled={isOutOfStock}
            >
                {!isOutOfStock ? <ShoppingCart className="h-4 w-4 mr-1 md:mr-2"/> : null}
                {isOutOfStock ? 'Out of Stock' : 'Add'}
            </Button>
        </CardFooter>
        </Card>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        <section aria-labelledby="category-navigation" className="bg-secondary shadow-sm py-3 mb-6 print:hidden">
             <div className="container mx-auto px-4">
                 <h2 id="category-navigation" className="sr-only">Shop by Category</h2>
                <div className="flex justify-center items-center gap-4 md:gap-8 overflow-x-auto pb-2 no-scrollbar">
                    {categoryLinks.map((category, index) => (
                        <Link
                             key={index}
                             href={category.href}
                             aria-label={category.ariaLabel}
                             className="flex flex-col items-center text-center hover:text-primary transition-colors duration-200 flex-shrink-0 w-20 group"
                         >
                             <div className="p-2 bg-background rounded-full mb-1 group-hover:bg-primary/10 transition-colors">
                                 <category.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
                             </div>
                             <span className="text-xs font-medium text-foreground">{category.name}</span>
                         </Link>
                    ))}
                </div>
             </div>
         </section>

        <section aria-label="Promotional Banners" className="container mx-auto px-4 mb-8 print:hidden">
           <Carousel
                plugins={[ Autoplay({ delay: 5000, stopOnInteraction: true }) ]}
                opts={{ loop: true }}
                className="overflow-hidden rounded-lg shadow-md"
           >
                <CarouselContent>
                    {bannerImages.map((banner, index) => (
                        <CarouselItem key={index}>
                             <Image
                                src={banner.src}
                                alt={banner.alt}
                                width={1200}
                                height={400}
                                className="w-full h-auto object-cover max-h-[250px] md:max-h-[400px]"
                                priority={index === 0}
                                data-ai-hint={banner.dataAiHint}
                             />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background text-foreground" />
                <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background text-foreground" />
            </Carousel>
         </section>

        {/* Top Buys Section */}
        <section aria-labelledby="top-buy-products" className="container mx-auto px-4 mb-12">
            <div className="flex justify-between items-center mb-6">
                <h2 id="top-buy-products" className="text-2xl md:text-3xl font-bold text-foreground">Top Buys</h2>
                <Button variant="link" asChild>
                    <Link href="/products?isTopBuy=true">View All <ChevronRight className="h-4 w-4 ml-1" /></Link>
                </Button>
            </div>
            {isTopBuyLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <Card key={`skel-topbuy-${i}`} className="overflow-hidden shadow-md animate-pulse">
                            <Skeleton className="w-full h-48 bg-muted" />
                            <CardContent className="p-4"><Skeleton className="h-5 w-3/4 mb-2 bg-muted rounded" /><Skeleton className="h-4 w-1/2 bg-muted rounded" /></CardContent>
                            <CardFooter className="p-4 pt-0 flex justify-between items-center"><Skeleton className="h-6 w-1/4 bg-muted rounded" /><Skeleton className="h-9 w-1/3 bg-muted rounded-md" /></CardFooter>
                        </Card>
                    ))}
                </div>
            ) : topBuyProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {topBuyProducts.map(renderProductCard)}
                </div>
            ) : (
                <p className="text-muted-foreground">No top buy products featured at the moment.</p>
            )}
        </section>


        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 print:hidden">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {isFilteredView ? 'Filtered Products' : 'Shop By Category'}
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
                            {availableCategoriesAndSubcategories.length > 0 ? availableCategoriesAndSubcategories.map(cat => (
                                <React.Fragment key={cat._id.toString()}>
                                    {cat.subcategories && cat.subcategories.length > 0 ? (
                                        <>
                                            <p className="font-medium text-xs pt-2 text-muted-foreground">{cat.name}</p>
                                            {cat.subcategories.map(sub => {
                                                const filterKey = `${cat._id.toString()}_SUB_${sub}`;
                                                const label = sub;
                                                return (
                                                    <div key={filterKey} className="flex items-center space-x-2 pl-2">
                                                        <Checkbox
                                                            id={`cat-filter-${filterKey}`}
                                                            checked={filters.categories[filterKey] || false}
                                                            onCheckedChange={(checked) => handleCategoryChange(filterKey, checked)}
                                                            aria-labelledby={`label-cat-filter-${filterKey}`}
                                                        />
                                                        <Label id={`label-cat-filter-${filterKey}`} htmlFor={`cat-filter-${filterKey}`} className="cursor-pointer text-sm font-normal">{label}</Label>
                                                    </div>
                                                );
                                            })}
                                        </>
                                    ) : (
                                        <div key={cat._id.toString()} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`cat-filter-${cat._id.toString()}`}
                                                checked={filters.categories[cat._id.toString()] || false}
                                                onCheckedChange={(checked) => handleCategoryChange(cat._id.toString(), checked)}
                                                aria-labelledby={`label-cat-filter-${cat._id.toString()}`}
                                            />
                                            <Label id={`label-cat-filter-${cat._id.toString()}`} htmlFor={`cat-filter-${cat._id.toString()}`} className="cursor-pointer text-sm font-normal">{cat.name}</Label>
                                        </div>
                                    )}
                                </React.Fragment>
                            )) : isHomepageContentLoading || isFilteredLoading ? ( 
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
                                <Card key={i} className="overflow-hidden shadow-md animate-pulse">
                                    <Skeleton className="w-full h-48 bg-muted" />
                                    <CardContent className="p-4"><Skeleton className="h-5 w-3/4 mb-2 bg-muted rounded" /><Skeleton className="h-4 w-1/2 bg-muted rounded" /></CardContent>
                                    <CardFooter className="p-4 pt-0 flex justify-between items-center"><Skeleton className="h-6 w-1/4 bg-muted rounded" /><Skeleton className="h-9 w-1/3 bg-muted rounded-md" /></CardFooter>
                                </Card>
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
                            {filteredProducts.map(renderProductCard)}
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
                                            <Card key={`skel-prod-${catIndex}-${prodIndex}`} className="overflow-hidden shadow-md animate-pulse">
                                                <Skeleton className="w-full h-48 bg-muted" />
                                                <CardContent className="p-4"><Skeleton className="h-5 w-3/4 mb-2 bg-muted rounded" /><Skeleton className="h-4 w-1/2 bg-muted rounded" /></CardContent>
                                                <CardFooter className="p-4 pt-0 flex justify-between items-center"><Skeleton className="h-6 w-1/4 bg-muted rounded" /><Skeleton className="h-9 w-1/3 bg-muted rounded-md" /></CardFooter>
                                            </Card>
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
                                     {/* Update this link to point to the new /products page with categoryName */}
                                    <Button variant="link" asChild>
                                        <Link href={`/products?categoryName=${encodeURIComponent(category.name)}`}>View All <ChevronRight className="h-4 w-4 ml-1" /></Link>
                                    </Button>
                                </div>
                                {productsByCat[category._id.toString()] && productsByCat[category._id.toString()].length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {productsByCat[category._id.toString()].map(renderProductCard)}
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
      </main>
      <Footer />
    </div>
  );
}


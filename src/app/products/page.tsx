
// src/app/products/page.tsx
'use client';

import React, { Suspense } from 'react'; // Import Suspense
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from '@/components/ui/input';
import { Filter, Search, Loader2, ShoppingCart, ChevronLeft, ChevronRight, Star, Palette, X, Info } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import type { IProduct, IProductColor } from '@/models/Product';
import type { ICategory } from '@/models/Category';

// Define FetchedProduct specifically for this page, ensuring category is an object
interface FetchedProduct extends Omit<IProduct, 'category' | 'colors' | '_id'> {
  _id: string;
  category: ICategory; // Expect category to be populated
  colors: IProductColor[];
  thumbnailUrl: string;
  minOrderQuantity: number;
}

interface FilterState {
  categories: { [key: string]: boolean }; // Key: categoryId or categoryId_SUB_subcategoryName
  priceRange: [number];
  discountedOnly: boolean;
  searchQuery: string;
  subcategoryName?: string; // Added for direct subcategory filtering
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  limit: number;
}

const DEFAULT_MAX_PRICE = 50000;
const PRODUCTS_PER_PAGE = 12;

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [products, setProducts] = useState<FetchedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<ICategory[]>([]);
  const [selectedColorPerProduct, setSelectedColorPerProduct] = useState<Record<string, IProductColor | undefined>>({});
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [pageTitle, setPageTitle] = useState('All Products');
   // State for add to cart loading
  const [isAddingToCart, setIsAddingToCart] = useState<Record<string, boolean>>({});


  // Filter state local to this page
  const [filters, setFilters] = useState<FilterState>({
    categories: {},
    priceRange: [DEFAULT_MAX_PRICE],
    discountedOnly: false,
    searchQuery: '',
  });
  const [priceValue, setPriceValue] = useState([DEFAULT_MAX_PRICE]); // For slider UI

  // Fetch available categories for filter UI
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        setAvailableCategories(Array.isArray(data.categories) ? data.categories : []);
      } catch (e) {
        console.error("Error fetching categories for filter:", e);
        toast({ variant: "destructive", title: "Error", description: "Could not load filter categories." });
      }
    };
    fetchCats();
  }, [toast]);

  // Initialize filters from URL searchParams
  useEffect(() => {
    if (availableCategories.length === 0 && searchParams.has('categoryName')) {
        // Wait for categories to load if categoryName is in query
        return;
    }

    const newFilters: FilterState = {
        categories: {},
        priceRange: [DEFAULT_MAX_PRICE],
        discountedOnly: searchParams.get('discountedOnly') === 'true',
        searchQuery: searchParams.get('searchQuery') || '',
        subcategoryName: searchParams.get('subcategoryName') || undefined,
    };

    const initialPage = parseInt(searchParams.get('page') || '1', 10);
    if (pagination?.currentPage !== initialPage) {
        setPagination(prev => ({...(prev || {totalPages:0, totalProducts:0, limit:PRODUCTS_PER_PAGE}), currentPage: initialPage}));
    }


    const categoryNameParam = searchParams.get('categoryName');
    let foundCategory: ICategory | undefined;

    if (categoryNameParam && availableCategories.length > 0) {
        foundCategory = availableCategories.find(c => c.name.toLowerCase() === categoryNameParam.toLowerCase());
        if (foundCategory) {
            setPageTitle(foundCategory.name); // Set page title to category name
             // If subcategoryName is also present, use that specific filter key
            if (newFilters.subcategoryName && foundCategory.subcategories.includes(newFilters.subcategoryName)) {
                newFilters.categories[`${foundCategory._id.toString()}_SUB_${newFilters.subcategoryName}`] = true;
                setPageTitle(`${foundCategory.name} > ${newFilters.subcategoryName}`);
            } else {
                newFilters.categories[foundCategory._id.toString()] = true;
            }
        } else {
            setPageTitle(`Category: ${categoryNameParam} (Not Found)`);
        }
    } else if (searchParams.get('isTopBuy') === 'true') {
        setPageTitle('Top Buys');
    }
     else {
        setPageTitle('All Products');
    }
    
    const maxPriceParam = searchParams.get('maxPrice');
    if (maxPriceParam) {
        const price = parseInt(maxPriceParam, 10);
        if (!isNaN(price) && price <= DEFAULT_MAX_PRICE) {
            newFilters.priceRange = [price];
            setPriceValue([price]);
        }
    } else {
        setPriceValue([DEFAULT_MAX_PRICE]);
    }
    
    setFilters(newFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, availableCategories]); // Rerun when searchParams or availableCategories change

  // Fetch products when filters or page change
  useEffect(() => {
    const fetchProductsData = async () => {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();

      if (filters.searchQuery) params.append('searchQuery', filters.searchQuery);
      if (filters.discountedOnly) params.append('discountedOnly', 'true');
      if (filters.priceRange[0] < DEFAULT_MAX_PRICE) params.append('maxPrice', filters.priceRange[0].toString());
      
      // Check if isTopBuy is a filter criterion from URL
      if (searchParams.get('isTopBuy') === 'true' && !Object.values(filters.categories).some(v => v)) {
        params.append('isTopBuy', 'true');
      }


      let specificCategoryTargeted = false;
      Object.entries(filters.categories)
        .filter(([, checked]) => checked)
        .forEach(([filterKey]) => {
          specificCategoryTargeted = true;
          const parts = filterKey.split('_SUB_');
          if (parts.length === 2) {
            params.append('category', parts[0]); // categoryId
            params.append('subcategory', parts[1]); // subcategoryName
          } else {
            params.append('category', parts[0]); // categoryId
          }
        });
        
      // If categoryName was in URL but not directly translated to a filter key yet (e.g. during init)
      const categoryNameParam = searchParams.get('categoryName');
      if (categoryNameParam && !specificCategoryTargeted && availableCategories.length > 0) {
          const foundCat = availableCategories.find(c => c.name.toLowerCase() === categoryNameParam.toLowerCase());
          if (foundCat) {
              params.append('category', foundCat._id.toString());
              const subcategoryNameParam = searchParams.get('subcategoryName');
              if (subcategoryNameParam && foundCat.subcategories.includes(subcategoryNameParam)) {
                  params.append('subcategory', subcategoryNameParam);
              }
          }
      }


      params.append('page', (pagination?.currentPage || 1).toString());
      params.append('limit', String(PRODUCTS_PER_PAGE));
      params.append('populate', 'category'); // Ensure category is populated

      try {
        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to fetch products');
        }
        const data = await res.json();
        setProducts(Array.isArray(data.products) ? data.products : []);
        setPagination(data.pagination);
      } catch (e: any) {
        console.error("Error fetching products:", e);
        setError(e.message || "Could not load products.");
        setProducts([]);
        setPagination(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if categories are loaded (needed for name-to-ID mapping if categoryName is used)
    // or if no categoryName filter is active from URL
    if ((searchParams.has('categoryName') && availableCategories.length > 0) || !searchParams.has('categoryName') || searchParams.has('isTopBuy')) {
        fetchProductsData();
    }
  }, [filters, pagination?.currentPage, searchParams, availableCategories]);


  const handleApplyFilters = () => {
    const currentPath = '/products';
    const query = new URLSearchParams();

    if (filters.searchQuery) query.set('searchQuery', filters.searchQuery);
    if (filters.discountedOnly) query.set('discountedOnly', 'true');
    if (priceValue[0] < DEFAULT_MAX_PRICE) query.set('maxPrice', priceValue[0].toString());

    let primaryCategoryName: string | null = null;
    let primarySubcategoryName: string | null = null;

    Object.entries(filters.categories)
        .filter(([, checked]) => checked)
        .forEach(([filterKey]) => {
            const parts = filterKey.split('_SUB_');
            const catId = parts[0];
            const mainCat = availableCategories.find(c => c._id.toString() === catId);
            if (mainCat && !primaryCategoryName) primaryCategoryName = mainCat.name;

            if (parts.length === 2) { // Is a subcategory
                if (!primarySubcategoryName) primarySubcategoryName = parts[1];
            }
        });
    
    if (primaryCategoryName) query.set('categoryName', primaryCategoryName);
    if (primarySubcategoryName) query.set('subcategoryName', primarySubcategoryName);
     if (searchParams.get('isTopBuy') === 'true' && !primaryCategoryName && !primarySubcategoryName) {
      query.set('isTopBuy', 'true'); // Preserve isTopBuy if no category filters are active
    }


    query.set('page', '1'); // Reset to page 1 on new filter application

    router.push(`${currentPath}?${query.toString()}`);
    document.getElementById('close-filter-sheet-products')?.click();
    toast({ title: "Filters Applied" });
  };

  const handleClearFilters = () => {
    router.push('/products'); // Clears all query params
    setPriceValue([DEFAULT_MAX_PRICE]);
    // Filters state will be reset by the useEffect watching searchParams
    document.getElementById('close-filter-sheet-products')?.click();
    toast({ title: "Filters Cleared" });
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
        setFilters(prev => ({ ...prev, discountedOnly: checked }));
    }
  };
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setFilters(prev => ({ ...prev, searchQuery: query }));
  };
  const handlePageChange = (newPage: number) => {
    const query = new URLSearchParams(searchParams.toString());
    query.set('page', newPage.toString());
    router.push(`/products?${query.toString()}`);
  };


 const handleAddToCart = async (product: FetchedProduct, selectedColor?: IProductColor) => {
    const productIdStr = product._id.toString();
    setIsAddingToCart(prev => ({ ...prev, [productIdStr]: true }));

    const userDataString = localStorage.getItem('userData');
    if (!userDataString) {
        toast({ variant: "destructive", title: "Please Log In", description: "You need to be logged in to add items to your cart." });
        setIsAddingToCart(prev => ({ ...prev, [productIdStr]: false }));
        return;
    }
    const userData = JSON.parse(userDataString);
    const userId = userData._id;

    if (!userId) {
        toast({ variant: "destructive", title: "Error", description: "User ID not found. Please log in again." });
        setIsAddingToCart(prev => ({ ...prev, [productIdStr]: false }));
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
        window.dispatchEvent(new CustomEvent('cartUpdated')); // Notify header
        toast({ title: "Added to Cart", description: `${itemToAdd} (Qty: ${quantity}) has been added.` });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message || "Could not add item to cart." });
    } finally {
        setIsAddingToCart(prev => ({ ...prev, [productIdStr]: false }));
    }
};
  const handleColorSelection = (productId: string, color?: IProductColor) => {
    setSelectedColorPerProduct(prev => ({ ...prev, [productId]: color }));
  };

  const renderProductCard = (product: FetchedProduct) => {
    const productIdStr = product._id.toString();
    const selectedColor = selectedColorPerProduct[productIdStr];
    const displayImage = selectedColor?.imageUrls?.[0] ?? product.thumbnailUrl ?? 'https://picsum.photos/300/200?random=placeholder';
    const minOrderQty = product.minOrderQuantity || 1;
    const currentStock = selectedColor?.stock ?? product.stock ?? 0;
    const isOutOfStock = currentStock < minOrderQty;
    const productIsAddingToCart = isAddingToCart[productIdStr] || false;


    return (
        <Card key={productIdStr} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col bg-card group">
        <CardHeader className="p-0 relative">
            <Link href={`/products/${productIdStr}`} aria-label={`View details for ${product.title}`} className="block aspect-[4/3] overflow-hidden">
                <Image
                src={displayImage}
                alt={product.title}
                width={300}
                height={200}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                loading="lazy"
                data-ai-hint="product image shop"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/300/200?random=onerror'; }}
                />
            </Link>
            {product.discount && product.discount > 0 && (
            <Badge variant="destructive" className="absolute top-2 right-2 shadow-md">{product.discount}% OFF</Badge>
            )}
        </CardHeader>
        <CardContent className="p-4 flex-grow">
            <Link href={`/products/${productIdStr}`}>
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
                            onClick={() => handleColorSelection(productIdStr, color)}
                            className={`h-5 w-5 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary transition-all
                                ${selectedColor === color ? 'ring-2 ring-primary ring-offset-1 border-primary' : 'border-muted-foreground/30'}
                                ${color.stock < minOrderQty ? 'opacity-50 cursor-not-allowed relative' : ''}`}
                            style={{ backgroundColor: color.hexCode || 'transparent' }}
                            disabled={color.stock < minOrderQty || productIsAddingToCart}
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
                size="sm" variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => handleAddToCart(product, selectedColor)}
                aria-label={`Add ${product.title} to cart`}
                disabled={isOutOfStock || productIsAddingToCart}
            >
                {productIsAddingToCart ? <Loader2 className="h-4 w-4 mr-1 md:mr-2 animate-spin"/> :
                 !isOutOfStock ? <ShoppingCart className="h-4 w-4 mr-1 md:mr-2"/> : null}
                 {productIsAddingToCart ? 'Adding...' : isOutOfStock ? 'Out of Stock' : 'Add'}
            </Button>
        </CardFooter>
        </Card>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{pageTitle}</h1>
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
                    <SheetDescription>Refine your product search.</SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                        <fieldset className="space-y-2">
                            <legend className="font-semibold mb-1 text-sm">Category</legend>
                            {availableCategories.length > 0 ? availableCategories.map(cat => (
                                <React.Fragment key={cat._id.toString()}>
                                   {cat.subcategories && cat.subcategories.length > 0 ? (
                                        <>
                                            <p className="font-medium text-xs pt-2 text-muted-foreground">{cat.name}</p>
                                            {cat.subcategories.map(sub => {
                                                const filterKey = `${cat._id.toString()}_SUB_${sub}`;
                                                return (
                                                    <div key={filterKey} className="flex items-center space-x-2 pl-2">
                                                        <Checkbox
                                                            id={`filter-${filterKey}`}
                                                            checked={filters.categories[filterKey] || false}
                                                            onCheckedChange={(checked) => handleCategoryChange(filterKey, checked)}
                                                            aria-labelledby={`label-filter-${filterKey}`}
                                                        />
                                                        <Label id={`label-filter-${filterKey}`} htmlFor={`filter-${filterKey}`} className="cursor-pointer text-sm font-normal">{sub}</Label>
                                                    </div>
                                                );
                                            })}
                                        </>
                                    ) : (
                                        <div key={cat._id.toString()} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`filter-${cat._id.toString()}`}
                                                checked={filters.categories[cat._id.toString()] || false}
                                                onCheckedChange={(checked) => handleCategoryChange(cat._id.toString(), checked)}
                                                aria-labelledby={`label-filter-${cat._id.toString()}`}
                                            />
                                            <Label id={`label-filter-${cat._id.toString()}`} htmlFor={`filter-${cat._id.toString()}`} className="cursor-pointer text-sm font-normal">{cat.name}</Label>
                                        </div>
                                    )}
                                </React.Fragment>
                            )) : <Skeleton className="h-5 w-24 bg-muted" /> }
                        </fieldset>
                        <div className="space-y-2">
                             <Label className="font-semibold text-sm" htmlFor="price-range-filter">Max Price: ₹{priceValue[0].toLocaleString('en-IN')}</Label>
                            <Slider
                                value={priceValue}
                                onValueChange={setPriceValue}
                                max={DEFAULT_MAX_PRICE}
                                step={1000}
                                id="price-range-filter"
                             />
                             <div className="flex justify-between text-xs text-muted-foreground">
                                <span>₹0</span>
                                <span>₹{DEFAULT_MAX_PRICE.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="discounted-filter" checked={filters.discountedOnly} onCheckedChange={handleDiscountChange} />
                            <Label htmlFor="discounted-filter" className="cursor-pointer">Show Only Discounted Items</Label>
                        </div>
                    </div>
                     <div className="mt-6 flex flex-col gap-2">
                        <Button type="button" onClick={handleApplyFilters} className="w-full">Apply Filters</Button>
                        <Button type="button" variant="outline" onClick={handleClearFilters} className="w-full">Clear Filters</Button>
                         <SheetClose id="close-filter-sheet-products" className="hidden" />
                    </div>
                </SheetContent>
                </Sheet>
            </div>
        </div>

        {isLoading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(PRODUCTS_PER_PAGE)].map((_, i) => (
                    <Card key={i} className="overflow-hidden shadow-md animate-pulse">
                        <Skeleton className="w-full h-48 bg-muted" />
                        <CardContent className="p-4"><Skeleton className="h-5 w-3/4 mb-2 bg-muted rounded" /><Skeleton className="h-4 w-1/2 bg-muted rounded" /></CardContent>
                        <CardFooter className="p-4 pt-0 flex justify-between items-center"><Skeleton className="h-6 w-1/4 bg-muted rounded" /><Skeleton className="h-9 w-1/3 bg-muted rounded-md" /></CardFooter>
                    </Card>
                ))}
            </div>
        ) : error ? (
            <div className="text-center py-10 text-destructive bg-red-50 border border-destructive rounded-md p-6">
                <h2 className="text-lg font-semibold mb-2">Failed to Load Products</h2>
                <p className="mb-4">{error}</p>
            </div>
        ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map(renderProductCard)}
            </div>
        ) : (
            <div className="text-center py-10 col-span-full bg-muted/50 rounded-md p-6">
                <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-semibold text-foreground mb-2">No products found</p>
                <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
            </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center mt-8 space-x-2">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage <= 1 || isLoading}
                    aria-label="Go to previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                    Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage >= pagination.totalPages || isLoading}
                    aria-label="Go to next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        )}
      </main>
      <Footer />
    </div>
  );
}


// Wrap with Suspense because useSearchParams() needs it
export default function ProductsPageWithSuspense() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow container mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(PRODUCTS_PER_PAGE)].map((_, i) => (
                             <Card key={i} className="overflow-hidden shadow-md animate-pulse">
                                <Skeleton className="w-full h-48 bg-muted" />
                                <CardContent className="p-4"><Skeleton className="h-5 w-3/4 mb-2 bg-muted rounded" /><Skeleton className="h-4 w-1/2 bg-muted rounded" /></CardContent>
                                <CardFooter className="p-4 pt-0 flex justify-between items-center"><Skeleton className="h-6 w-1/4 bg-muted rounded" /><Skeleton className="h-9 w-1/3 bg-muted rounded-md" /></CardFooter>
                            </Card>
                        ))}
                    </div>
                </main>
                <Footer />
            </div>
        }>
            <ProductsPageContent />
        </Suspense>
    );
}


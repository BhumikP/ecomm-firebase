
// src/app/products/page.tsx
'use client';

import React, { Suspense } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Filter, Search, Loader2, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
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
import type { IProductColor } from '@/models/Product';
import type { ICategory } from '@/models/Category';
import { ProductCard, type ProductCardProductType as FetchedProduct } from '@/components/shared/product-card';

interface FilterState {
  categories: { [key: string]: boolean }; 
  priceRange: [number];
  discountedOnly: boolean;
  searchQuery: string;
  subcategoryName?: string;
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
  const [isAddingToCart, setIsAddingToCart] = useState<Record<string, boolean>>({});

  const [filters, setFilters] = useState<FilterState>({
    categories: {},
    priceRange: [DEFAULT_MAX_PRICE],
    discountedOnly: false,
    searchQuery: '',
  });
  const [priceValue, setPriceValue] = useState([DEFAULT_MAX_PRICE]);

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = `${pageTitle} | eShop Simplified`;
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
          metaDescription = document.createElement('meta');
          metaDescription.setAttribute('name', 'description');
          document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', `Browse and shop for ${pageTitle.toLowerCase()} on eShop Simplified. Find great deals and a wide selection.`);
    }
  }, [pageTitle]);

  useEffect(() => {
    if (availableCategories.length === 0 && (searchParams.has('categoryName') || searchParams.has('category'))) {
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

    const categoryIdParam = searchParams.get('category');
    const categoryNameParam = searchParams.get('categoryName');
    let titleCandidate = 'All Products';

    if (categoryIdParam && availableCategories.length > 0) {
        const foundCategory = availableCategories.find(c => c._id.toString() === categoryIdParam);
        if (foundCategory) {
            titleCandidate = foundCategory.name;
            if (newFilters.subcategoryName && foundCategory.subcategories.includes(newFilters.subcategoryName)) {
                newFilters.categories[`${foundCategory._id.toString()}_SUB_${newFilters.subcategoryName}`] = true;
                titleCandidate = `${foundCategory.name} > ${newFilters.subcategoryName}`;
            } else {
                newFilters.categories[foundCategory._id.toString()] = true;
            }
        }
    } else if (categoryNameParam && availableCategories.length > 0) {
        const foundCategory = availableCategories.find(c => c.name.toLowerCase() === categoryNameParam.toLowerCase());
        if (foundCategory) {
            titleCandidate = foundCategory.name;
            if (newFilters.subcategoryName && foundCategory.subcategories.includes(newFilters.subcategoryName)) {
                newFilters.categories[`${foundCategory._id.toString()}_SUB_${newFilters.subcategoryName}`] = true;
                titleCandidate = `${foundCategory.name} > ${newFilters.subcategoryName}`;
            } else {
                 // If only categoryName is provided, set the main category filter
                newFilters.categories[foundCategory._id.toString()] = true;
            }
        } else {
            titleCandidate = `Category: ${categoryNameParam} (Not Found)`;
        }
    }
    
    if (searchParams.get('isTopBuy') === 'true') titleCandidate = 'Top Buys';
    if (searchParams.get('isNewlyLaunched') === 'true') titleCandidate = 'Newly Launched';
    if (filters.searchQuery) titleCandidate = `Search: "${filters.searchQuery}"`;

    setPageTitle(titleCandidate);
    
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
  }, [searchParams, availableCategories]);

  useEffect(() => {
    const fetchProductsData = async () => {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();

      if (filters.searchQuery) params.append('searchQuery', filters.searchQuery);
      if (filters.discountedOnly) params.append('discountedOnly', 'true');
      if (filters.priceRange[0] < DEFAULT_MAX_PRICE) params.append('maxPrice', filters.priceRange[0].toString());
      
      if (searchParams.get('isTopBuy') === 'true' && !Object.values(filters.categories).some(v => v) && !filters.searchQuery) {
        params.append('isTopBuy', 'true');
      }
      if (searchParams.get('isNewlyLaunched') === 'true' && !Object.values(filters.categories).some(v => v) && !filters.searchQuery) {
        params.append('isNewlyLaunched', 'true');
      }

      let specificCategoryTargeted = false;
      Object.entries(filters.categories)
        .filter(([, checked]) => checked)
        .forEach(([filterKey]) => {
          specificCategoryTargeted = true;
          const parts = filterKey.split('_SUB_');
          params.append('category', parts[0]); 
          if (parts.length === 2) params.append('subcategory', parts[1]);
        });
        
      const categoryIdFromUrl = searchParams.get('category');
      const categoryNameFromUrl = searchParams.get('categoryName');

      if (!specificCategoryTargeted && categoryIdFromUrl && mongoose.Types.ObjectId.isValid(categoryIdFromUrl)) {
          params.append('category', categoryIdFromUrl);
          if (filters.subcategoryName) params.append('subcategory', filters.subcategoryName);
      } else if (!specificCategoryTargeted && categoryNameFromUrl && availableCategories.length > 0) {
          const foundCat = availableCategories.find(c => c.name.toLowerCase() === categoryNameFromUrl.toLowerCase());
          if (foundCat) {
              params.append('category', foundCat._id.toString());
              if (filters.subcategoryName && foundCat.subcategories.includes(filters.subcategoryName)) {
                  params.append('subcategory', filters.subcategoryName);
              }
          }
      }

      params.append('page', (pagination?.currentPage || 1).toString());
      params.append('limit', String(PRODUCTS_PER_PAGE));
      params.append('populate', 'category');

      try {
        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to fetch products');
        }
        const data = await res.json();
        setProducts((Array.isArray(data.products) ? data.products : []).map((p: any) => ({
            ...p,
            category: p.category || { _id: 'unknown', name: 'Uncategorized', subcategories: [] } // Ensure category is object
        })));
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

    if ((searchParams.has('categoryName') && availableCategories.length > 0) || 
        (searchParams.has('category') && availableCategories.length > 0) ||
        (!searchParams.has('categoryName') && !searchParams.has('category'))) {
        fetchProductsData();
    }
  }, [filters, pagination?.currentPage, searchParams, availableCategories]);


  const handleApplyFilters = () => {
    const currentPath = '/products';
    const query = new URLSearchParams();

    if (filters.searchQuery) query.set('searchQuery', filters.searchQuery);
    if (filters.discountedOnly) query.set('discountedOnly', 'true');
    if (priceValue[0] < DEFAULT_MAX_PRICE) query.set('maxPrice', priceValue[0].toString());

    let primaryCategoryId: string | null = null;
    let primaryCategoryNameForUrl: string | null = null;
    let primarySubcategoryNameForUrl: string | null = null;

    Object.entries(filters.categories)
        .filter(([, checked]) => checked)
        .forEach(([filterKey]) => {
            const parts = filterKey.split('_SUB_');
            const catId = parts[0];
            if (!primaryCategoryId) primaryCategoryId = catId; // Take first active category for URL

            const mainCat = availableCategories.find(c => c._id.toString() === catId);
            if (mainCat && !primaryCategoryNameForUrl) primaryCategoryNameForUrl = mainCat.name;

            if (parts.length === 2) { 
                if (!primarySubcategoryNameForUrl) primarySubcategoryNameForUrl = parts[1];
            }
        });
    
    // Use category ID primarily for robust filtering, categoryName for user-friendly URL
    if (primaryCategoryId) query.set('category', primaryCategoryId);
    if (primaryCategoryNameForUrl && !query.has('category')) query.set('categoryName', primaryCategoryNameForUrl); // Fallback to name if ID somehow missed
    if (primarySubcategoryNameForUrl) query.set('subcategoryName', primarySubcategoryNameForUrl);
    
    if (searchParams.get('isTopBuy') === 'true' && !primaryCategoryId && !primaryCategoryNameForUrl) {
      query.set('isTopBuy', 'true');
    }
    if (searchParams.get('isNewlyLaunched') === 'true' && !primaryCategoryId && !primaryCategoryNameForUrl) {
      query.set('isNewlyLaunched', 'true');
    }


    query.set('page', '1'); 

    router.push(`${currentPath}?${query.toString()}`);
    document.getElementById('close-filter-sheet-products')?.click();
    toast({ variant: "success", title: "Filters Applied" });
  };

  const handleClearFilters = () => {
    router.push('/products'); 
    setPriceValue([DEFAULT_MAX_PRICE]);
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
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        toast({ variant: "success", title: "Added to Cart", description: `${itemToAdd} (Qty: ${quantity}) has been added.` });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message || "Could not add item to cart." });
    } finally {
        setIsAddingToCart(prev => ({ ...prev, [productIdStr]: false }));
    }
};
  const handleColorSelection = (productId: string, color?: IProductColor) => {
    setSelectedColorPerProduct(prev => ({ ...prev, [productId]: color }));
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
                <SheetContent className="overflow-y-auto w-[300px] sm:w-[400px]">
                    <SheetHeader>
                    <SheetTitle>Filter Products</SheetTitle>
                    <SheetDescription>Refine your product search.</SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                        <fieldset className="space-y-2">
                            <legend className="font-semibold mb-1 text-sm">Category</legend>
                            {availableCategories.length > 0 ? availableCategories.map(cat => {
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
                                        <div key={mainCatId} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`filter-${mainCatId}`}
                                                checked={filters.categories[mainCatId] || false}
                                                onCheckedChange={(checked) => handleCategoryChange(mainCatId, checked)}
                                                aria-labelledby={`label-filter-${mainCatId}`}
                                            />
                                            <Label id={`label-filter-${mainCatId}`} htmlFor={`filter-${mainCatId}`} className="cursor-pointer text-sm font-normal">{cat.name}</Label>
                                        </div>
                                    )}
                                </React.Fragment>
                            )}) : <Skeleton className="h-5 w-24 bg-muted" /> }
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
                    <Skeleton key={`skel-prod-list-${i}`} className="h-[400px] w-full rounded-lg bg-muted" />
                ))}
            </div>
        ) : error ? (
            <div className="text-center py-10 text-destructive bg-red-50 border border-destructive rounded-md p-6">
                <h2 className="text-lg font-semibold mb-2">Failed to Load Products</h2>
                <p className="mb-4">{error}</p>
                 <Button onClick={() => router.refresh()} variant="outline">Try Again</Button>
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
            <div className="text-center py-10 col-span-full bg-muted/50 rounded-md p-6">
                <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-semibold text-foreground mb-2">No products found</p>
                <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
                 <Button onClick={handleClearFilters} variant="outline" className="mt-4">Clear Filters</Button>
            </div>
        )}

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


export default function ProductsPageWithSuspense() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow container mx-auto px-4 py-8">
                    <div className="flex justify-between items-center mb-6">
                        <Skeleton className="h-8 w-48 bg-muted rounded" />
                        <Skeleton className="h-10 w-32 bg-muted rounded" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(PRODUCTS_PER_PAGE)].map((_, i) => (
                             <Skeleton key={`fallback-skel-${i}`} className="h-[400px] w-full rounded-lg bg-muted" />
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

// Helper for mongoose.Types.ObjectId.isValid if needed elsewhere
// For now, it's okay inside the useEffect.
const mongoose = { Types: { ObjectId: { isValid: (id: string) => /^[0-9a-fA-F]{24}$/.test(id) }}};

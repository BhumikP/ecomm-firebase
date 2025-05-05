'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from '@/components/ui/input';
import { Filter, Search, Loader2, ShoppingCart, Tv, Shirt, HomeIcon as HomeGoodsIcon, Footprints, Blocks, Percent, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
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
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay" // Import Autoplay
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { IProduct } from '@/models/Product'; // Import IProduct interface

// Define types for filter state
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
    ariaLabel: string; // Added for accessibility
}

const categoryLinks: CategoryLink[] = [
    { name: 'Top Offers', icon: Percent, href: '/products?discountedOnly=true', ariaLabel: 'Shop Top Offers and Discounts' },
    { name: 'Mobiles', icon: ShoppingCart, href: '/products?category=Mobiles', ariaLabel: 'Shop Mobile Phones' },
    { name: 'TVs', icon: Tv, href: '/products?category=Electronics', ariaLabel: 'Shop Televisions and Electronics' },
    { name: 'Electronics', icon: ShoppingCart, href: '/products?category=Electronics', ariaLabel: 'Shop Electronics' },
    { name: 'Fashion', icon: Shirt, href: '/products?category=Apparel', ariaLabel: 'Shop Fashion and Apparel' },
    { name: 'Home Goods', icon: HomeGoodsIcon, href: '/products?category=Home Goods', ariaLabel: 'Shop Home Goods' },
    { name: 'Footwear', icon: Footprints, href: '/products?category=Footwear', ariaLabel: 'Shop Footwear' },
    { name: 'Accessories', icon: Blocks, href: '/products?category=Accessories', ariaLabel: 'Shop Accessories' },
];

const bannerImages = [
    { src: 'https://picsum.photos/1200/400?random=banner1', alt: 'Special discount on latest electronics', dataAiHint: 'sale promotion electronics gadgets' },
    { src: 'https://picsum.photos/1200/400?random=banner2', alt: 'New season fashion arrivals', dataAiHint: 'new arrivals fashion clothing' },
    { src: 'https://picsum.photos/1200/400?random=banner3', alt: 'Upgrade your home appliances with our offers', dataAiHint: 'home appliance discount kitchen' },
];

export default function Home() {
  const { toast } = useToast();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const [filters, setFilters] = useState<FilterState>({
    categories: {},
    priceRange: [500],
    discountedOnly: false,
    searchQuery: '',
  });
  const [priceValue, setPriceValue] = useState([500]);


  // Fetch Products Function
  const fetchProducts = async (currentFilters: FilterState) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (currentFilters.searchQuery) {
                params.append('searchQuery', currentFilters.searchQuery);
            }
            const selectedCategories = Object.entries(currentFilters.categories)
                .filter(([, checked]) => checked)
                .map(([cat]) => cat);

            if (selectedCategories.length > 0) {
                 // If your API supports multiple category values, adjust accordingly
                 // Example for single category filter (common):
                 // if (selectedCategories.length === 1) {
                 //     params.append('category', selectedCategories[0]);
                 // }
                 // Example for multiple categories (if API supports `category=cat1&category=cat2`):
                 selectedCategories.forEach(cat => params.append('category', cat));
            }

            if (currentFilters.priceRange[0] < 500) {
                params.append('maxPrice', currentFilters.priceRange[0].toString());
            }
            if (currentFilters.discountedOnly) {
                params.append('discountedOnly', 'true');
            }
             params.append('limit', '12');

            const response = await fetch(`/api/products?${params.toString()}`);
            if (!response.ok) {
                 const errorText = await response.text(); // Get more error details
                 console.error("API Error Response:", errorText);
                 throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();

            if (!Array.isArray(data.products)) {
                console.error("API response for products is not an array:", data);
                throw new Error("Invalid product data format received.");
            }

            setProducts(data.products);

             // --- Dynamic Category Loading Logic ---
             // Only fetch categories if they haven't been loaded yet.
             // This prevents filters from resetting when applying filters.
             // A dedicated categories API endpoint is generally better.
             if (availableCategories.length === 0 && data.products.length > 0) {
                 console.log("Fetching initial categories from products...");
                 const uniqueCats = Array.from(new Set(data.products.map((p: IProduct) => p.category))) as string[];
                 console.log("Unique categories found:", uniqueCats);
                 setAvailableCategories(uniqueCats);
                 // Initialize category filters only once
                 setFilters(prev => ({
                     ...prev,
                     categories: uniqueCats.reduce((acc, cat) => ({ ...acc, [cat]: false }), {})
                 }));
             } else if (availableCategories.length === 0 && !isLoading) {
                  // Handle case where initial fetch returns no products or categories are empty
                 console.log("No products found on initial load, setting categories to empty.");
                 setAvailableCategories([]);
                 setFilters(prev => ({ ...prev, categories: {} }));
             }
            // --- End Category Loading Logic ---


        } catch (err: any) {
            console.error("Error fetching products:", err);
            setError(err.message || "Could not load products.");
            setProducts([]);
            // Don't reset categories on error, allow retry with existing filters
            // setAvailableCategories([]);
            // setFilters(prev => ({...prev, categories: {}}));
        } finally {
            setIsLoading(false);
        }
    };

   // Initial fetch on component mount
   useEffect(() => {
       console.log("Initial fetch triggered");
       fetchProducts(filters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []); // Fetch only once initially


  const handleAddToCart = (product: IProduct) => {
    console.log(`Adding ${product.title} to cart`);
    // TODO: Implement actual add to cart logic
    toast({
      title: "Added to Cart",
      description: `${product.title} has been added to your cart.`,
    });
  };

   // Handler to apply filters and fetch new data
  const handleApplyFilters = () => {
     const newFilters = {
         ...filters,
         priceRange: [priceValue[0]] as [number],
     };
     setFilters(newFilters);
     fetchProducts(newFilters);
     toast({
      title: "Filters Applied",
      description: "Product list updated.",
    });
     // Close the sheet after applying
     document.getElementById('close-filter-sheet')?.click();
  };

 const handleCategoryChange = (category: string, checked: boolean | "indeterminate") => {
     if (typeof checked === 'boolean') {
         setFilters(prevFilters => ({
             ...prevFilters,
             categories: {
                 ...prevFilters.categories,
                 [category]: checked
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
      // Debounced fetch or trigger on button click
  };

  // Debounced search fetch (optional, example with immediate fetch on change)
  useEffect(() => {
      const debounceTimer = setTimeout(() => {
          // Check if searchQuery is not undefined and has actually changed
          if (filters.searchQuery !== undefined) {
               console.log("Debounced search fetch for:", filters.searchQuery);
               fetchProducts(filters); // Fetch whenever search query changes after debounce
          }
      }, 500); // 500ms debounce

      return () => clearTimeout(debounceTimer);
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.searchQuery]); // Dependency on searchQuery

  // Reset Filters Function
   const handleClearFilters = () => {
        const defaultFilters: FilterState = {
            categories: availableCategories.reduce((acc, cat) => ({ ...acc, [cat]: false }), {}),
            priceRange: [500],
            discountedOnly: false,
            searchQuery: '',
        };
        setPriceValue([500]); // Reset slider display
        setFilters(defaultFilters);
        fetchProducts(defaultFilters); // Fetch with default filters
        toast({ title: "Filters Cleared", description: "Showing all products." });
         document.getElementById('close-filter-sheet')?.click(); // Close sheet if open
    };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        {/* Category Links Section */}
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


         {/* Promotional Banner Carousel */}
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
                                alt={banner.alt} // Descriptive alt text is crucial for SEO/Accessibility
                                width={1200}
                                height={400}
                                className="w-full h-auto object-cover max-h-[250px] md:max-h-[400px]" // Adjust height for different screens
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


        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 print:hidden">
             {/* More descriptive H1 for SEO */}
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Shop Our Latest Products</h1>
            <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-grow md:flex-grow-0">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search" // Use type="search" for semantics
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
                    <SheetDescription>
                        Refine your search.
                    </SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                        {/* Categories */}
                        <fieldset className="space-y-2">
                            <legend className="font-semibold mb-1 text-sm">Category</legend>
                            {availableCategories.length > 0 ? availableCategories.map(category => (
                                <div key={category} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`cat-${category.toLowerCase().replace(/\s+/g, '-')}`}
                                        checked={filters.categories[category] || false}
                                        onCheckedChange={(checked) => handleCategoryChange(category, checked)}
                                        aria-labelledby={`label-cat-${category.toLowerCase().replace(/\s+/g, '-')}`}
                                    />
                                    <Label id={`label-cat-${category.toLowerCase().replace(/\s+/g, '-')}`} htmlFor={`cat-${category.toLowerCase().replace(/\s+/g, '-')}`} className="cursor-pointer">{category}</Label>
                                </div>
                            )) : isLoading ? (
                                <Skeleton className="h-5 w-24 bg-muted" />
                            ) : (
                                <p className="text-sm text-muted-foreground">No categories available.</p>
                            )}
                        </fieldset>
                        {/* Price Slider */}
                        <div className="space-y-2">
                             <Label className="font-semibold text-sm" htmlFor="price-range">Max Price: ${priceValue[0]}</Label>
                            <Slider
                                value={priceValue}
                                onValueChange={setPriceValue}
                                max={500}
                                step={10}
                                id="price-range"
                                aria-label="Maximum price slider"
                             />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>$0</span>
                                <span>$500</span>
                            </div>
                        </div>
                        {/* Discount Checkbox */}
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
                         {/* SheetClose is implicitly handled by clicking outside or the X button */}
                         <SheetClose id="close-filter-sheet" className="hidden" />
                    </div>
                </SheetContent>
                </Sheet>
            </div>
            </div>

            {/* Product Grid */}
            <section aria-live="polite" aria-busy={isLoading}>
                {isLoading ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                         {[...Array(8)].map((_, i) => (
                             <Card key={i} className="overflow-hidden shadow-md animate-pulse">
                                 <Skeleton className="w-full h-48 bg-muted" />
                                 <CardContent className="p-4">
                                     <Skeleton className="h-5 w-3/4 mb-2 bg-muted rounded" />
                                     <Skeleton className="h-4 w-1/2 bg-muted rounded" />
                                 </CardContent>
                                 <CardFooter className="p-4 pt-0 flex justify-between items-center">
                                     <Skeleton className="h-6 w-1/4 bg-muted rounded" />
                                     <Skeleton className="h-9 w-1/3 bg-muted rounded-md" />
                                 </CardFooter>
                             </Card>
                         ))}
                     </div>
                ) : error ? (
                     <div className="text-center py-10 text-destructive bg-red-50 border border-destructive rounded-md p-6">
                         <h2 className="text-lg font-semibold mb-2">Failed to Load Products</h2>
                        <p className="mb-4">{error}</p>
                        <Button onClick={() => fetchProducts(filters)} variant="destructive" className="mt-4">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Retry
                        </Button>
                     </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <Card key={product._id.toString()} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col bg-background group">
                        <CardHeader className="p-0 relative">
                            <Link href={`/products/${product._id.toString()}`} aria-label={`View details for ${product.title}`} className="block aspect-[4/3] overflow-hidden">
                                <Image
                                src={product.image || 'https://picsum.photos/300/200?random=placeholder'}
                                alt={product.title} // Use product title as alt text
                                width={300}
                                height={200}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" // Optimize image loading
                                loading="lazy" // Lazy load images below the fold
                                data-ai-hint="product image retail fashion electronics"
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
                            {/* Hide description on main grid or keep it short */}
                             {/* <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p> */}
                            <div className="flex items-center gap-1 mt-1">
                                 {[...Array(5)].map((_, i) => (
                                     <Star key={i} className={`h-4 w-4 ${i < Math.round(product.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                 ))}
                                <span className="text-xs text-muted-foreground ml-1">({product.rating?.toFixed(1) ?? 'N/A'})</span>
                            </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 flex justify-between items-center mt-auto">
                            <div className="flex flex-col">
                                <span className="text-lg font-bold text-foreground">
                                    ${product.discount && product.discount > 0
                                        ? (product.price * (1 - product.discount / 100)).toFixed(2)
                                        : product.price.toFixed(2)}
                                </span>
                                {product.discount && product.discount > 0 && (
                                    <span className="text-xs text-muted-foreground line-through">
                                        ${product.price.toFixed(2)}
                                    </span>
                                )}
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                                onClick={() => handleAddToCart(product)}
                                aria-label={`Add ${product.title} to cart`}
                                disabled={product.stock <= 0} // Disable if out of stock
                            >
                                {product.stock > 0 ? <ShoppingCart className="h-4 w-4 mr-1 md:mr-2"/> : null}
                                {product.stock > 0 ? 'Add' : 'Out'}
                            </Button>
                        </CardFooter>
                        </Card>
                    ))}
                    </div>
                ) : (
                    <div className="text-center py-10 col-span-full bg-muted/50 rounded-md p-6">
                        <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-semibold text-foreground mb-2">No products found</p>
                        <p className="text-muted-foreground mb-4">Try adjusting your filters or search query.</p>
                         <Button onClick={handleClearFilters} variant="outline">Clear Filters</Button>
                    </div>
                )}
             </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

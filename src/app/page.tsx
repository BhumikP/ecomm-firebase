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
import { Filter, Search, Loader2, ShoppingBag, Tv, Shirt, HomeIcon as HomeGoodsIcon, Footprints, Blocks, Percent, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
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
}

const categoryLinks: CategoryLink[] = [
    { name: 'Top Offers', icon: Percent, href: '/products?discountedOnly=true' },
    { name: 'Mobiles', icon: ShoppingBag, href: '/products?category=Mobiles' }, // Assuming 'Mobiles' category exists
    { name: 'TVs', icon: Tv, href: '/products?category=Electronics' }, // Example grouping
    { name: 'Electronics', icon: ShoppingBag, href: '/products?category=Electronics' }, // Broad Electronics
    { name: 'Fashion', icon: Shirt, href: '/products?category=Apparel' }, // Match mock data
    { name: 'Home Goods', icon: HomeGoodsIcon, href: '/products?category=Home Goods' }, // Match mock data
    { name: 'Footwear', icon: Footprints, href: '/products?category=Footwear' }, // Match mock data
    { name: 'Accessories', icon: Blocks, href: '/products?category=Accessories' }, // Match mock data
    // Add more categories as needed
];

const bannerImages = [
    { src: 'https://picsum.photos/1200/400?random=banner1', alt: 'Promotional Banner 1', dataAiHint: 'sale promotion electronics' },
    { src: 'https://picsum.photos/1200/400?random=banner2', alt: 'Promotional Banner 2', dataAiHint: 'new arrivals fashion' },
    { src: 'https://picsum.photos/1200/400?random=banner3', alt: 'Promotional Banner 3', dataAiHint: 'home appliance discount' },
];

export default function Home() {
  const { toast } = useToast();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]); // To populate filters dynamically

  const [filters, setFilters] = useState<FilterState>({
    categories: {}, // Will be populated from availableCategories
    priceRange: [500], // Default Max price, adjust as needed
    discountedOnly: false,
    searchQuery: '',
  });
  const [priceValue, setPriceValue] = useState([500]); // Sync with initial filter state


  // Fetch Products Function
  const fetchProducts = async (currentFilters: FilterState) => {
        setIsLoading(true);
        setError(null);
        try {
            // Build query parameters based on filters
            const params = new URLSearchParams();
            if (currentFilters.searchQuery) {
                params.append('searchQuery', currentFilters.searchQuery);
            }
            Object.entries(currentFilters.categories).forEach(([cat, checked]) => {
                if (checked) {
                    params.append('category', cat); // Append multiple if needed, API should handle
                }
            });
            if (currentFilters.priceRange[0] < 500) { // Only apply if not max default
                params.append('maxPrice', currentFilters.priceRange[0].toString());
            }
            if (currentFilters.discountedOnly) {
                params.append('discountedOnly', 'true');
            }
             params.append('limit', '12'); // Adjust limit as needed

            const response = await fetch(`/api/products?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch products: ${response.statusText}`);
            }
            const data = await response.json();

            // Ensure data.products is an array
            if (!Array.isArray(data.products)) {
                console.error("API response for products is not an array:", data);
                throw new Error("Invalid product data format received.");
            }

            setProducts(data.products);

             // Extract unique categories from fetched products *only on initial load*
             // This prevents filters from resetting categories based on filtered results.
             // A better approach might be a separate API endpoint for categories.
             if (Object.keys(filters.categories).length === 0) { // Only if categories filter is empty
                 const uniqueCats = Array.from(new Set(data.products.map((p: IProduct) => p.category))) as string[];
                 setAvailableCategories(uniqueCats);
                 // Initialize filter state for categories based on fetched data
                 setFilters(prev => ({
                     ...prev,
                     categories: uniqueCats.reduce((acc, cat) => ({ ...acc, [cat]: false }), {})
                 }));
             }


        } catch (err: any) {
            console.error("Error fetching products:", err);
            setError(err.message || "Could not load products.");
            setProducts([]); // Clear products on error
        } finally {
            setIsLoading(false);
        }
    };

   // Initial fetch on component mount
   useEffect(() => {
       fetchProducts(filters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []); // Fetch only once initially


  const handleAddToCart = (productTitle: string) => {
    console.log(`Adding ${productTitle} to cart`);
    // TODO: Implement actual add to cart logic (update global cart state/context)
    toast({
      title: "Added to Cart",
      description: `${productTitle} has been added to your cart.`,
    });
  };

   // Handler to apply filters and fetch new data
  const handleApplyFilters = () => {
     // Update the main filters state with the current slider value
     const newFilters = {
         ...filters,
         priceRange: [priceValue[0]] as [number], // Ensure it's always [number]
     };
     setFilters(newFilters); // Update the main filter state
     fetchProducts(newFilters); // Fetch products with the *newly set* filters
    toast({
      title: "Filters Applied",
      description: "Product list updated based on your selections.",
    });
     // Optionally close the sheet here if needed
     // document.getElementById('close-filter-sheet')?.click(); // Requires adding an id to SheetClose
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
      // You might want to debounce this or trigger fetch on button click/enter key
      // For simplicity, we'll fetch when applying filters in the sheet
      console.log("Search query changed:", query);
 };

  // Debounced search fetch (optional, example)
  useEffect(() => {
      const debounceTimer = setTimeout(() => {
          if (filters.searchQuery !== undefined) { // Check if searchQuery has been initialized
               // Fetch products only based on search query if it changes
               // To avoid fetching on every keystroke, consider a dedicated search button or longer debounce
               // For this example, let's assume search triggers re-fetch via Apply Filters button
          }
      }, 500); // 500ms debounce

      return () => clearTimeout(debounceTimer);
  }, [filters.searchQuery]);



  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Header />
      <main className="flex-grow">
        {/* Category Links Section */}
        <section className="bg-background shadow-sm py-3 mb-6">
             <div className="container mx-auto px-4">
                <div className="flex justify-center items-center gap-4 md:gap-8 overflow-x-auto pb-2 no-scrollbar">
                    {categoryLinks.map((category, index) => (
                        <Link key={index} href={category.href} className="flex flex-col items-center text-center hover:text-primary transition-colors duration-200 flex-shrink-0 w-20">
                             <category.icon className="h-8 w-8 mb-1 text-gray-700" />
                             <span className="text-xs font-medium text-foreground">{category.name}</span>
                         </Link>
                    ))}
                </div>
             </div>
         </section>


         {/* Promotional Banner Carousel */}
        <section className="container mx-auto px-4 mb-8">
           <Carousel
                plugins={[
                    Autoplay({ // Add Autoplay plugin
                      delay: 5000, // 5 seconds delay
                      stopOnInteraction: true, // Stop autoplay on interaction
                    }),
                ]}
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
                                className="w-full h-auto object-cover max-h-[400px]" // Ensure responsiveness
                                priority={index === 0} // Prioritize loading the first banner
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
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold text-foreground">Featured Products</h1>
            <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-grow md:flex-grow-0">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search products..."
                        className="pl-10 w-full md:w-64 bg-background"
                        value={filters.searchQuery}
                        onChange={handleSearchChange}
                    />
                </div>
                <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" className="shrink-0 bg-background">
                    <Filter className="mr-2 h-4 w-4" /> Filters
                    </Button>
                </SheetTrigger>
                <SheetContent>
                    <SheetHeader>
                    <SheetTitle>Filter Products</SheetTitle>
                    <SheetDescription>
                        Refine your search using the options below.
                    </SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                        {/* Dynamic Categories */}
                        <div className="space-y-2">
                            <Label className="font-semibold">Category</Label>
                            {availableCategories.length > 0 ? availableCategories.map(category => (
                                <div key={category} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`cat-${category.toLowerCase().replace(/\s+/g, '-')}`}
                                        checked={filters.categories[category] || false} // Handle potentially undefined category
                                        onCheckedChange={(checked) => handleCategoryChange(category, checked)}
                                    />
                                    <Label htmlFor={`cat-${category.toLowerCase().replace(/\s+/g, '-')}`}>{category}</Label>
                                </div>
                            )) : (
                                <p className="text-sm text-muted-foreground">No categories loaded.</p>
                            )}
                        </div>
                        {/* Price Slider */}
                        <div className="space-y-2">
                             <Label className="font-semibold" htmlFor="price-range">Max Price: ${priceValue[0]}</Label>
                            <Slider
                                value={priceValue}
                                onValueChange={setPriceValue} // Update slider display value
                                max={500} // Adjust max price based on your product range
                                step={10}
                                id="price-range"
                             />
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>$0</span>
                                <span>$500</span>
                            </div>
                        </div>
                        {/* Discount Checkbox */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="discounted"
                                checked={filters.discountedOnly}
                                onCheckedChange={handleDiscountChange}
                            />
                            <Label htmlFor="discounted">Show Only Discounted Items</Label>
                        </div>
                    </div>
                    <SheetClose asChild>
                        <Button id="close-filter-sheet" type="button" onClick={handleApplyFilters} className="w-full mt-4 bg-primary hover:bg-primary/90">Apply Filters</Button>
                    </SheetClose>
                </SheetContent>
                </Sheet>
            </div>
            </div>

            {isLoading ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                     {[...Array(8)].map((_, i) => ( // Skeleton Loader for products
                         <Card key={i} className="overflow-hidden shadow-md">
                             <Skeleton className="w-full h-48 bg-muted" />
                             <CardContent className="p-4">
                                 <Skeleton className="h-5 w-3/4 mb-2 bg-muted" />
                                 <Skeleton className="h-4 w-1/2 bg-muted" />
                             </CardContent>
                             <CardFooter className="p-4 pt-0 flex justify-between items-center">
                                 <Skeleton className="h-6 w-1/4 bg-muted" />
                                 <Skeleton className="h-8 w-1/3 bg-muted rounded-md" />
                             </CardFooter>
                         </Card>
                     ))}
                 </div>
            ) : error ? (
                 <div className="text-center py-10 text-destructive">
                    <p>Error: {error}</p>
                    <Button onClick={() => fetchProducts(filters)} variant="outline" className="mt-4">Retry</Button>
                 </div>
            ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                    <Card key={product._id.toString()} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col bg-background">
                    <CardHeader className="p-0 relative">
                        <Link href={`/products/${product._id.toString()}`} aria-label={`View details for ${product.title}`}>
                            <Image
                            src={product.image || 'https://picsum.photos/300/200?random=placeholder'} // Fallback image
                            alt={product.title}
                            width={300}
                            height={200}
                            className="w-full h-48 object-cover"
                            data-ai-hint="product image retail"
                            />
                        </Link>
                        {product.discount && product.discount > 0 && (
                        <Badge variant="destructive" className="absolute top-2 right-2">{product.discount}% OFF</Badge>
                        )}
                    </CardHeader>
                    <CardContent className="p-4 flex-grow">
                        <Link href={`/products/${product._id.toString()}`}>
                            <CardTitle className="text-lg font-semibold hover:text-primary transition-colors duration-200 mb-2 leading-tight line-clamp-2">{product.title}</CardTitle>
                        </Link>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                        <p className="text-sm text-muted-foreground">Rating: {product.rating?.toFixed(1) ?? 'N/A'} ★</p>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-between items-center mt-auto">
                        <div className="flex flex-col">
                            <span className="text-xl font-bold text-foreground">
                                ${product.discount && product.discount > 0
                                    ? (product.price * (1 - product.discount / 100)).toFixed(2)
                                    : product.price.toFixed(2)}
                            </span>
                            {product.discount && product.discount > 0 && (
                                <span className="text-sm text-muted-foreground line-through">
                                    ${product.price.toFixed(2)}
                                </span>
                            )}
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            onClick={() => handleAddToCart(product.title)} // Add onClick handler
                        >
                            Add to Cart
                        </Button>
                    </CardFooter>
                    </Card>
                ))}
                </div>
            ) : (
                <div className="text-center py-10 col-span-full">
                    <p className="text-muted-foreground">No products found matching your criteria.</p>
                     <Button onClick={() => {
                         // Reset filters to default and fetch again
                         const defaultFilters: FilterState = {
                             categories: availableCategories.reduce((acc, cat) => ({ ...acc, [cat]: false }), {}),
                             priceRange: [500],
                             discountedOnly: false,
                             searchQuery: '',
                         };
                         setPriceValue([500]); // Reset slider display
                         setFilters(defaultFilters);
                         fetchProducts(defaultFilters);
                     }} variant="outline" className="mt-4">Clear Filters</Button>
                </div>
            )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

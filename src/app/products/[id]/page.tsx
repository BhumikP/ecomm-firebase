'use client';

import Image from 'next/image';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, Loader2 } from 'lucide-react'; // Import Loader2
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from 'react';
import { IProduct } from '@/models/Product'; // Import IProduct type

// Define Product Type matching the backend model (ensure consistency)
type ProductDetail = IProduct & { _id: string }; // Add _id from MongoDB


export default function ProductDetailPage({ params }: { params: { id: string } }) {
   const { toast } = useToast();
   const [product, setProduct] = useState<ProductDetail | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);


   useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            setError(null);
            try {
                 if (!params.id) {
                    setError("Product ID is missing.");
                    setLoading(false);
                    return;
                 }
                 const response = await fetch(`/api/products/${params.id}`);

                 if (response.status === 404) {
                    setError("Product not found");
                    setProduct(null);
                    setLoading(false);
                    return;
                 }

                 if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed to fetch product: ${response.statusText}`);
                }

                const productData: ProductDetail = await response.json();
                setProduct(productData);

            } catch (err: any) {
                console.error("Failed to fetch product:", err);
                setError(err.message || "Failed to load product details.");
                setProduct(null);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();

   }, [params.id]); // Re-run effect if ID changes

   const handleAddToCart = () => {
    if (product) {
        console.log(`Adding ${product.title} to cart`);
        // TODO: Implement actual add to cart logic (update global cart state/context)
        toast({
          title: "Added to Cart",
          description: `${product.title} has been added to your cart.`,
        });
    }
   };


   if (loading) {
      return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
                 {/* Enhanced Loading Skeleton */}
                 <div className="grid md:grid-cols-2 gap-8 lg:gap-12 w-full max-w-5xl">
                    <div className="relative aspect-square md:aspect-auto bg-muted rounded-lg animate-pulse"></div>
                    <div className="flex flex-col space-y-4">
                         <div className="h-10 bg-muted rounded w-3/4 animate-pulse mb-2"></div> {/* Title */}
                         <div className="flex items-center space-x-4 mb-2">
                            <div className="h-5 bg-muted rounded w-20 animate-pulse"></div> {/* Category */}
                            <div className="h-5 bg-muted rounded w-24 animate-pulse"></div> {/* Rating */}
                         </div>
                         <div className="h-1 bg-muted rounded w-full animate-pulse my-4"></div> {/* Separator */}
                         <div className="space-y-2"> {/* Description lines */}
                              <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                              <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
                              <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                         </div>
                         <div className="h-8 bg-muted rounded w-1/2 animate-pulse my-4"></div> {/* Price */}
                         <div className="pt-4 space-y-3"> {/* Features */}
                            <div className="h-6 bg-muted rounded w-1/3 animate-pulse mb-2"></div> {/* Features title */}
                            <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                            <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
                            <div className="h-4 bg-muted rounded w-4/6 animate-pulse"></div>
                         </div>
                         <div className="pt-4">
                            <div className="h-12 bg-muted rounded w-full md:w-40 animate-pulse"></div> {/* Button */}
                         </div>
                    </div>
                 </div>
            </main>
            <Footer />
        </div>
     );
   }

  if (error || !product) {
    // Handle product not found or error case
    return (
       <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center text-center">
                <div>
                    <h1 className="text-2xl font-semibold mb-4 text-destructive">{error || "Product Not Found"}</h1>
                    <p className="text-muted-foreground mb-6">Sorry, we couldn't find or load the product you were looking for.</p>
                    <Button asChild>
                        <Link href="/">Go Back Home</Link>
                    </Button>
                     {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
                </div>
            </main>
            <Footer />
        </div>
    );
  }

  // Product is loaded and available here
  const discountedPrice = product.discount && product.discount > 0
    ? (product.price * (1 - product.discount / 100)).toFixed(2)
    : product.price.toFixed(2);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Product Image */}
          <div className="relative aspect-square md:aspect-[4/3] bg-muted rounded-lg overflow-hidden">
            <Image
              src={product.image || 'https://picsum.photos/600/400?random=placeholder'}
              alt={product.title}
              fill // Use fill for responsive sizing within parent
              className="object-contain p-2" // contain fits image within bounds, add padding
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
              priority // Load main image quickly
              data-ai-hint="detailed product photo ecommerce"
            />
             {product.discount && product.discount > 0 && (
                <Badge variant="destructive" className="absolute top-4 left-4 text-base px-3 py-1">{product.discount}% OFF</Badge>
             )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col space-y-4">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">{product.title}</h1>

            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                 <span className="bg-secondary px-3 py-1 rounded-full text-secondary-foreground font-medium">{product.category}</span>
                 <div className="flex items-center">
                     {[...Array(5)].map((_, i) => {
                        const ratingValue = i + 1;
                        const fullStar = ratingValue <= Math.floor(product.rating || 0);
                        const halfStar = !fullStar && ratingValue - 0.5 <= (product.rating || 0);
                        return (
                             <Star
                                key={i}
                                className={`h-5 w-5 ${
                                    fullStar ? 'text-yellow-400 fill-yellow-400'
                                    : halfStar ? 'text-yellow-400' // Needs adjustment for true half fill if desired
                                    : 'text-gray-300'
                                }`}
                                // Basic half-star attempt using fill only on full stars
                                fill={fullStar ? 'currentColor' : 'none'}
                             />
                        );
                     })}
                    <span className="ml-2 text-foreground">({(product.rating || 0).toFixed(1)})</span>
                 </div>
            </div>

            <Separator className="my-4" />

             <p className="text-base text-muted-foreground leading-relaxed">{product.description}</p>

            <div className="space-y-1">
                <span className="text-3xl font-bold text-foreground">${discountedPrice}</span>
                 {product.discount && product.discount > 0 && (
                    <span className="ml-3 text-lg text-muted-foreground line-through">
                        ${product.price.toFixed(2)}
                    </span>
                 )}
             </div>

             {product.stock <= 0 ? (
                 <Badge variant="destructive" className="w-fit">Out of Stock</Badge>
             ) : product.stock < 10 ? (
                  <Badge variant="outline" className="w-fit border-yellow-500 text-yellow-600">Low Stock ({product.stock} left)</Badge>
             ): (
                 <Badge variant="default" className="w-fit bg-green-100 text-green-800 border-green-200">In Stock</Badge>
             )}


             {product.features && product.features.length > 0 && (
                 <div className="pt-4">
                     <h3 className="text-xl font-semibold mb-2 text-foreground">Features</h3>
                     <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                         {product.features.map((feature: string, index: number) => (
                            <li key={index}>{feature}</li>
                        ))}
                     </ul>
                 </div>
            )}

            <div className="pt-6">
              <Button
                size="lg"
                className="w-full md:w-auto bg-primary hover:bg-primary/90"
                onClick={handleAddToCart}
                disabled={product.stock <= 0 || loading} // Disable if out of stock or still loading
               >
                 {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            </div>
          </div>
        </div>

         {/* TODO: Add sections for Reviews, Related Products etc. */}
         {/* <Separator className="my-8" />
         <div className="mt-8">
             <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
             </div> */}

      </main>
      <Footer />
    </div>
  );
}

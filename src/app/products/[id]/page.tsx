'use client';

import Image from 'next/image';
import type { Metadata } from 'next'; // Import Metadata type
import Script from 'next/script'; // Import Script
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from 'react';
import { IProduct } from '@/models/Product';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

// Define Product Type matching the backend model (ensure consistency)
type ProductDetail = IProduct & { _id: string };

// Helper function to fetch product data for metadata generation (Server Component context)
// Note: This approach might change slightly with future Next.js data fetching patterns.
// For client components needing dynamic metadata, we handle it client-side for now,
// but ideally, a server component wrapper would handle this.
async function getProductData(id: string): Promise<ProductDetail | null> {
     // Use absolute URL for server-side fetching or relative if API routes are correctly configured
     // const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'; // Adjust port if needed
     // const res = await fetch(`${baseUrl}/api/products/${id}`, { cache: 'no-store' }); // Consider caching strategy
      // Using relative path assuming API routes are served by the same Next.js instance
     const res = await fetch(`/api/products/${id}`, { cache: 'no-store' });

    if (!res.ok) {
        // Handle errors appropriately (e.g., return null, log error)
        console.error(`Failed to fetch product ${id} for metadata: ${res.status}`);
        return null;
    }
    return res.json();
}


// Generate Metadata Function (Example for Server Components, adapted conceptually for Client)
// NOTE: generateMetadata ONLY works in Server Components. We'll use client-side updates
// via useEffect for the <title> tag as a workaround, but full SEO benefits require Server Components.
/*
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await getProductData(params.id);

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The product you are looking for does not exist.',
    };
  }

  const discountedPrice = product.discount && product.discount > 0
    ? (product.price * (1 - product.discount / 100)).toFixed(2)
    : product.price.toFixed(2);

  return {
    title: product.title,
    description: `${product.description.substring(0, 160)}... Find ${product.title} for $${discountedPrice}.`, // Truncate description
    keywords: [product.category, product.title, 'buy', 'shop', ...(product.features || [])],
    openGraph: {
      title: product.title,
      description: `On sale for $${discountedPrice}! ${product.description.substring(0, 100)}...`,
      images: [
        {
          url: product.image || 'https://YOUR_DOMAIN.com/default-product-image.jpg', // Fallback image
          width: 800, // Provide image dimensions
          height: 600,
          alt: product.title,
        },
      ],
      type: 'product', // More specific OG type
      // OpenGraph product specific tags
      // price: {
      //   amount: discountedPrice,
      //   currency: 'USD', // Adjust currency
      // },
      // availability: product.stock > 0 ? 'instock' : 'outofstock',
      // brand: 'YourBrandName', // Add brand if applicable
    },
    // Add other metadata like canonical URL if needed
     alternates: {
       canonical: `https://YOUR_DOMAIN.com/products/${product._id}`, // Replace with your domain
     },
  };
}
*/


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
                 // Use relative path for client-side fetch
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

                // --- Client-side Title Update (Workaround for Client Component SEO) ---
                 if (productData) {
                     document.title = `${productData.title} | eShop Simplified`;
                 } else {
                      document.title = `Product Not Found | eShop Simplified`;
                 }
                // --- End Title Update ---


            } catch (err: any) {
                console.error("Failed to fetch product:", err);
                setError(err.message || "Failed to load product details.");
                setProduct(null);
                 document.title = `Error Loading Product | eShop Simplified`; // Update title on error
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();

        // Cleanup function to reset title if component unmounts before product loads
        return () => {
           // Reset title or set to default if needed
        };

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

   // --- Generate JSON-LD Structured Data for Product ---
   const generateProductSchema = (productData: ProductDetail | null) => {
       if (!productData) return null;

       const discountedPriceValue = productData.discount && productData.discount > 0
            ? (productData.price * (1 - productData.discount / 100)).toFixed(2)
            : productData.price.toFixed(2);

       const schema = {
         "@context": "https://schema.org/",
         "@type": "Product",
         "name": productData.title,
         "image": productData.image || 'https://YOUR_DOMAIN.com/default-product-image.jpg', // Provide a fallback image URL
         "description": productData.description,
         // "sku": productData._id, // Optional: Use your SKU if available
         // "mpn": "YOUR_MPN", // Optional: Manufacturer Part Number
         // Optional: Add Brand
         // "brand": {
         //   "@type": "Brand",
         //   "name": "Your Brand Name"
         // },
         // Optional: Add Reviews (aggregateRating)
         "aggregateRating": productData.rating && productData.rating > 0 ? {
             "@type": "AggregateRating",
             "ratingValue": productData.rating.toFixed(1),
             "bestRating": "5",
             // "ratingCount": 123 // TODO: Add review count if available
         } : undefined,
         "offers": {
           "@type": "Offer",
           "url": `https://YOUR_DOMAIN.com/products/${productData._id}`, // Replace with your domain
           "priceCurrency": "USD", // Adjust currency
           "price": discountedPriceValue,
           "priceValidUntil": new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0], // Example: valid for 30 days
           "itemCondition": "https://schema.org/NewCondition",
           "availability": productData.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
           // Optional: Add seller info
           // "seller": {
           //   "@type": "Organization",
           //   "name": "eShop Simplified"
           // }
         }
       };
       // Remove undefined fields before stringifying
       Object.keys(schema).forEach(key => schema[key as keyof typeof schema] === undefined && delete schema[key as keyof typeof schema]);
        if (schema.offers && schema.offers.availability === undefined) delete schema.offers.availability;
        if (schema.aggregateRating === undefined) delete schema.aggregateRating;


       return JSON.stringify(schema);
   };
    const productSchemaJson = generateProductSchema(product);
   // --- End JSON-LD Generation ---


   if (loading) {
      return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
                {/* Using Skeleton component for loading state */}
                <div className="grid md:grid-cols-2 gap-8 lg:gap-12 w-full max-w-5xl mx-auto">
                    <Skeleton className="aspect-square md:aspect-[4/3] w-full rounded-lg bg-muted" />
                    <div className="flex flex-col space-y-4">
                         <Skeleton className="h-10 w-3/4 bg-muted rounded" /> {/* Title */}
                         <div className="flex items-center space-x-4">
                            <Skeleton className="h-6 w-20 bg-muted rounded-full" /> {/* Category */}
                            <Skeleton className="h-6 w-24 bg-muted rounded" /> {/* Rating */}
                         </div>
                         <Separator className="my-4 bg-muted h-px" />
                         <Skeleton className="h-4 w-full bg-muted rounded" /> {/* Description */}
                         <Skeleton className="h-4 w-5/6 bg-muted rounded" />
                         <Skeleton className="h-4 w-full bg-muted rounded" />
                         <Skeleton className="h-8 w-1/2 bg-muted rounded my-4" /> {/* Price */}
                         <div className="pt-4 space-y-2">
                             <Skeleton className="h-6 w-1/3 bg-muted rounded mb-2" /> {/* Features title */}
                             <Skeleton className="h-4 w-full bg-muted rounded" />
                             <Skeleton className="h-4 w-5/6 bg-muted rounded" />
                         </div>
                         <div className="pt-4">
                            <Skeleton className="h-12 w-40 bg-muted rounded" /> {/* Button */}
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
                    <Button asChild variant="outline">
                        <Link href="/">Go Back Home</Link>
                    </Button>
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
       {/* Add Product JSON-LD Schema */}
       {productSchemaJson && (
            <Script
                 id="product-schema"
                 type="application/ld+json"
                 dangerouslySetInnerHTML={{ __html: productSchemaJson }}
             />
       )}
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start max-w-6xl mx-auto">
          {/* Product Image */}
          <div className="relative aspect-square md:aspect-[4/3] bg-muted rounded-lg overflow-hidden shadow-md">
            <Image
              src={product.image || 'https://picsum.photos/600/400?random=placeholder'}
              alt={product.title}
              fill // Use fill for responsive sizing within parent
              className="object-contain p-4" // contain fits image within bounds, add padding
              sizes="(max-width: 768px) 100vw, 50vw" // Optimize image loading
              priority // Load main image quickly
              data-ai-hint="detailed product photo ecommerce professional"
            />
             {product.discount && product.discount > 0 && (
                <Badge variant="destructive" className="absolute top-4 left-4 text-sm md:text-base px-3 py-1 shadow-md">{product.discount}% OFF</Badge>
             )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col space-y-4">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">{product.title}</h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                 <Badge variant="secondary" className="text-sm px-3 py-1">{product.category}</Badge>
                 <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                         <Star
                            key={i}
                             className={`h-5 w-5 ${
                                 i < Math.round(product.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                             }`}
                             aria-hidden="true" // Hide decorative stars from screen readers
                         />
                      ))}
                    <span className="ml-2 text-foreground sr-only">Rating: {(product.rating || 0).toFixed(1)} out of 5 stars</span>
                     <span className="ml-2 text-foreground" aria-hidden="true">({(product.rating || 0).toFixed(1)})</span>
                 </div>
                  <span className="text-xs">ID: {product._id}</span> {/* Show product ID subtly */}
            </div>

            <Separator className="my-4" />

             <p className="text-base text-foreground/90 leading-relaxed">{product.description}</p>

            <div className="space-y-1">
                <span className="text-3xl font-bold text-primary">${discountedPrice}</span>
                 {product.discount && product.discount > 0 && (
                    <span className="ml-3 text-lg text-muted-foreground line-through">
                        ${product.price.toFixed(2)}
                    </span>
                 )}
             </div>

             {/* Stock Status */}
             <div className="pt-2">
                 {product.stock <= 0 ? (
                     <Badge variant="destructive" className="text-sm px-3 py-1">Out of Stock</Badge>
                 ) : product.stock < 10 ? (
                      <Badge variant="outline" className="text-sm px-3 py-1 border-yellow-500 text-yellow-600">Low Stock ({product.stock} left)</Badge>
                 ): (
                     <Badge variant="default" className="text-sm px-3 py-1 bg-green-100 text-green-800 border-green-200">In Stock</Badge>
                 )}
             </div>


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
                className="w-full md:w-auto bg-primary hover:bg-primary/90 text-lg px-8 py-3"
                onClick={handleAddToCart}
                disabled={product.stock <= 0 || loading} // Disable if out of stock or still loading
               >
                 {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            </div>

             {/* Share Buttons Placeholder */}
             {/* <div className="pt-6 border-t mt-6">
                 <span className="text-sm font-medium text-muted-foreground mr-2">Share:</span>
                 </div> */}
          </div>
        </div>

         {/* TODO: Add sections for Reviews, Related Products etc. */}
         {/* <Separator className="my-12" />
         <div className="mt-8 max-w-6xl mx-auto">
             <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
             </div> */}

      </main>
      <Footer />
    </div>
  );
}

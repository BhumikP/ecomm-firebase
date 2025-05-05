'use client'; // Add this directive

import Image from 'next/image';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star } from 'lucide-react';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast"; // Import useToast
import { useEffect, useState } from 'react'; // Import useEffect and useState

// Define Product Type
interface Product {
  id: string;
  image: string;
  title: string;
  price: number;
  discount: number | null;
  category: string;
  rating: number;
  description: string;
  features: string[];
}


// Mock product data fetching function (remains async for potential future API calls)
const getProductDetails = async (id: string): Promise<Product | null> => {
  // Simulate API call or database query
  // In a real app, this would fetch data, potentially on the server side if not 'use client'
  // For client-side rendering, this could be an API call inside useEffect
  console.log("Fetching details for product ID:", id);
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate minimal delay
  const products: { [key: string]: Product } = {
     '1': { id: '1', image: 'https://picsum.photos/600/400?random=11', title: 'Stylish T-Shirt', price: 25.99, discount: 10, category: 'Apparel', rating: 4.5, description: 'A comfortable and stylish t-shirt made from 100% premium cotton. Perfect for everyday wear.', features: ['100% Cotton', 'Regular Fit', 'Crew Neck', 'Machine Washable'] },
     '2': { id: '2', image: 'https://picsum.photos/600/400?random=12', title: 'Wireless Headphones', price: 79.99, discount: null, category: 'Electronics', rating: 4.8, description: 'Experience immersive sound with these noise-cancelling wireless headphones. Long battery life and comfortable design.', features: ['Active Noise Cancellation', 'Bluetooth 5.2', '20-Hour Battery Life', 'Built-in Microphone', 'Foldable Design'] },
     '3': { id: '3', image: 'https://picsum.photos/600/400?random=13', title: 'Coffee Maker', price: 45.00, discount: 5, category: 'Home Goods', rating: 4.2, description: 'Brew delicious coffee quickly and easily with this programmable coffee maker. Features a keep-warm function.', features: ['12-Cup Capacity', 'Programmable Timer', 'Keep Warm Function', 'Anti-Drip System', 'Reusable Filter'] },
     '4': { id: '4', image: 'https://picsum.photos/600/400?random=14', title: 'Running Shoes', price: 120.00, discount: 15, category: 'Footwear', rating: 4.7, description: 'Lightweight and responsive running shoes designed for comfort and performance on any terrain.', features: ['Breathable Mesh Upper', 'Cushioned Midsole', 'Durable Rubber Outsole', 'Neutral Arch Support'] },
     '5': { id: '5', image: 'https://picsum.photos/600/400?random=15', title: 'Laptop Backpack', price: 55.50, discount: null, category: 'Accessories', rating: 4.6, description: 'A durable and spacious backpack with a dedicated laptop compartment and multiple pockets for organization.', features: ['Fits up to 15.6" Laptops', 'Water-Resistant Material', 'USB Charging Port', 'Padded Shoulder Straps', 'Multiple Compartments'] },
     '6': { id: '6', image: 'https://picsum.photos/600/400?random=16', title: 'Smart Watch', price: 199.99, discount: 20, category: 'Electronics', rating: 4.9, description: 'Stay connected and track your fitness goals with this feature-packed smartwatch.', features: ['Heart Rate Monitor', 'GPS Tracking', 'Sleep Monitoring', 'Water Resistant (5ATM)', 'Notifications Sync'] },
  };
  return products[id] || null; // Return null if product not found
};

export default function ProductDetailPage({ params }: { params: { id: string } }) {
   const { toast } = useToast(); // Initialize toast hook
   const [product, setProduct] = useState<Product | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);


   useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            setError(null);
            try {
                const productData = await getProductDetails(params.id);
                if (productData) {
                    setProduct(productData);
                } else {
                    setError("Product not found");
                }
            } catch (err) {
                console.error("Failed to fetch product:", err);
                setError("Failed to load product details.");
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchProduct();
        }

   }, [params.id]); // Re-run effect if ID changes

   const handleAddToCart = () => {
    if (product) {
        console.log(`Adding ${product.title} to cart`);
        // TODO: Implement actual add to cart logic (e.g., update cart state/context)
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
                 {/* Basic Loading Skeleton */}
                 <div className="grid md:grid-cols-2 gap-8 lg:gap-12 w-full">
                    <div className="relative aspect-square md:aspect-auto bg-muted rounded-lg animate-pulse"></div>
                    <div className="flex flex-col space-y-4">
                         <div className="h-10 bg-muted rounded w-3/4 animate-pulse"></div>
                         <div className="h-4 bg-muted rounded w-1/4 animate-pulse"></div>
                         <div className="h-1 bg-muted rounded w-full animate-pulse my-4"></div>
                         <div className="h-20 bg-muted rounded animate-pulse"></div>
                         <div className="h-8 bg-muted rounded w-1/2 animate-pulse"></div>
                         <div className="pt-4 space-y-2">
                            <div className="h-6 bg-muted rounded w-1/3 animate-pulse"></div>
                            <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                            <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
                            <div className="h-4 bg-muted rounded w-4/6 animate-pulse"></div>
                         </div>
                         <div className="pt-4">
                            <div className="h-12 bg-muted rounded w-full md:w-1/3 animate-pulse"></div>
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
            <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold mb-4">{error || "Product Not Found"}</h1>
                    <p className="text-muted-foreground mb-6">Sorry, we couldn't find or load the product you were looking for.</p>
                    <Button asChild>
                        <Link href="/">Go Back Home</Link>
                    </Button>
                </div>
            </main>
            <Footer />
        </div>
    );
  }

  // Product is loaded and available here
  const discountedPrice = product.discount
    ? (product.price * (1 - product.discount / 100)).toFixed(2)
    : product.price.toFixed(2);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image */}
          <div className="relative aspect-square md:aspect-auto">
            <Image
              src={product.image}
              alt={product.title}
              fill // Use fill for responsive sizing within parent
              className="object-contain rounded-lg border p-2" // contain fits image within bounds
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px" // Adjust sizes
              priority // Load main image quickly
              data-ai-hint="detailed product photo ecommerce"
            />
             {product.discount && (
                <Badge variant="destructive" className="absolute top-4 left-4 text-base px-3 py-1">{product.discount}% OFF</Badge>
             )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col space-y-4">
            <h1 className="text-3xl lg:text-4xl font-bold">{product.title}</h1>

            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                 {/* Link to a potential category page (implement later) */}
                 {/* <Link href={`/products/category/${product.category.toLowerCase()}`} className="hover:text-primary">{product.category}</Link>
                <span>|</span> */}
                <span className="bg-secondary px-2 py-0.5 rounded text-secondary-foreground">{product.category}</span>
                 <div className="flex items-center ml-2">
                     {[...Array(5)].map((_, i) => {
                        const ratingValue = i + 1;
                        return (
                             <Star
                                key={i}
                                className={`h-4 w-4 ${
                                    ratingValue <= Math.floor(product.rating)
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : ratingValue - 0.5 <= product.rating // Handle half stars
                                    ? 'text-yellow-400' // Needs clip-path in CSS or inline style for true half star
                                    : 'text-gray-300'
                                }`}
                                // Example inline style for half star (adjust as needed)
                                style={
                                    ratingValue - 0.5 === product.rating
                                    ? { clipPath: 'inset(0 50% 0 0)' }
                                    : {}
                                }
                             />
                        );
                     })}
                    <span className="ml-1">({product.rating.toFixed(1)})</span>
                 </div>
            </div>


            <Separator />

             <p className="text-lg text-muted-foreground">{product.description}</p>

            <div className="space-y-1">
                <span className="text-3xl font-bold text-foreground">${discountedPrice}</span>
                 {product.discount && (
                    <span className="ml-2 text-lg text-muted-foreground line-through">
                        ${product.price.toFixed(2)}
                    </span>
                 )}
             </div>


            <div className="pt-4">
                 <h3 className="text-xl font-semibold mb-2">Features</h3>
                 <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                     {product.features.map((feature: string, index: number) => (
                        <li key={index}>{feature}</li>
                    ))}
                 </ul>
             </div>

            <div className="pt-4">
              <Button
                size="lg"
                className="w-full md:w-auto bg-primary hover:bg-primary/90"
                onClick={handleAddToCart} // Add onClick handler
               >
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


// Remove generateStaticParams and dynamic = 'force-static' when using 'use client'
// If you need ISR or SSG with client-side interactions, structure might differ
// (e.g., fetch data server-side, pass to client component)
// export async function generateStaticParams() { ... }
// export const dynamic = 'force-static';

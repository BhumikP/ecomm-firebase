import Image from 'next/image';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star } from 'lucide-react';
import Link from 'next/link';

// Mock product data (replace with actual data fetching based on ID)
const getProductDetails = async (id: string) => {
  // Simulate API call or database query
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
  const products: { [key: string]: any } = {
    '1': { id: '1', image: 'https://picsum.photos/600/400', title: 'Stylish T-Shirt', price: 25.99, discount: 10, category: 'Apparel', rating: 4.5, description: 'A comfortable and stylish t-shirt made from 100% premium cotton. Perfect for everyday wear.', features: ['100% Cotton', 'Regular Fit', 'Crew Neck', 'Machine Washable'] },
    '2': { id: '2', image: 'https://picsum.photos/600/400', title: 'Wireless Headphones', price: 79.99, discount: null, category: 'Electronics', rating: 4.8, description: 'Experience immersive sound with these noise-cancelling wireless headphones. Long battery life and comfortable design.', features: ['Active Noise Cancellation', 'Bluetooth 5.2', '20-Hour Battery Life', 'Built-in Microphone', 'Foldable Design'] },
    '3': { id: '3', image: 'https://picsum.photos/600/400', title: 'Coffee Maker', price: 45.00, discount: 5, category: 'Home Goods', rating: 4.2, description: 'Brew delicious coffee quickly and easily with this programmable coffee maker. Features a keep-warm function.', features: ['12-Cup Capacity', 'Programmable Timer', 'Keep Warm Function', 'Anti-Drip System', 'Reusable Filter'] },
     '4': { id: '4', image: 'https://picsum.photos/600/400', title: 'Running Shoes', price: 120.00, discount: 15, category: 'Footwear', rating: 4.7, description: 'Lightweight and responsive running shoes designed for comfort and performance on any terrain.', features: ['Breathable Mesh Upper', 'Cushioned Midsole', 'Durable Rubber Outsole', 'Neutral Arch Support'] },
     '5': { id: '5', image: 'https://picsum.photos/600/400', title: 'Laptop Backpack', price: 55.50, discount: null, category: 'Accessories', rating: 4.6, description: 'A durable and spacious backpack with a dedicated laptop compartment and multiple pockets for organization.', features: ['Fits up to 15.6" Laptops', 'Water-Resistant Material', 'USB Charging Port', 'Padded Shoulder Straps', 'Multiple Compartments'] },
     '6': { id: '6', image: 'https://picsum.photos/600/400', title: 'Smart Watch', price: 199.99, discount: 20, category: 'Electronics', rating: 4.9, description: 'Stay connected and track your fitness goals with this feature-packed smartwatch.', features: ['Heart Rate Monitor', 'GPS Tracking', 'Sleep Monitoring', 'Water Resistant (5ATM)', 'Notifications Sync'] },
  };
  return products[id] || null; // Return null if product not found
};

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getProductDetails(params.id);

  if (!product) {
    // Handle product not found case (e.g., show a 404 page or a message)
    return (
       <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold mb-4">Product Not Found</h1>
                    <p className="text-muted-foreground mb-6">Sorry, we couldn't find the product you were looking for.</p>
                    <Button asChild>
                        <Link href="/">Go Back Home</Link>
                    </Button>
                </div>
            </main>
            <Footer />
        </div>
    );
  }

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
              fill
              className="object-contain rounded-lg border p-2"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority // Load main image quickly
              data-ai-hint="detailed product photo"
            />
             {product.discount && (
                <Badge variant="destructive" className="absolute top-4 left-4 text-base px-3 py-1">{product.discount}% OFF</Badge>
             )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col space-y-4">
            <h1 className="text-3xl lg:text-4xl font-bold">{product.title}</h1>

            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                 <Link href={`/products/category/${product.category.toLowerCase()}`} className="hover:text-primary">{product.category}</Link>
                <span>|</span>
                 <div className="flex items-center">
                     {[...Array(Math.floor(product.rating))].map((_, i) => (
                        <Star key={`full-${i}`} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    ))}
                     {product.rating % 1 !== 0 && (
                         <Star key="half" className="h-4 w-4 text-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />
                     )}
                     {[...Array(5 - Math.ceil(product.rating))].map((_, i) => (
                         <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
                    ))}
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
              <Button size="lg" className="w-full md:w-auto bg-primary hover:bg-primary/90">Add to Cart</Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


// Add generateStaticParams if using SSG, or configure ISR as needed
// export async function generateStaticParams() {
//   // Fetch all product IDs
//   const productIds = ['1', '2', '3', '4', '5', '6']; // Replace with actual fetch
//   return productIds.map((id) => ({ id }));
// }

export const dynamic = 'force-static'; // Or 'force-dynamic' or configure revalidate for ISR

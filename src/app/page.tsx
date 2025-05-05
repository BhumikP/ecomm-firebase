import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from '@/components/ui/input';
import { Filter, Search } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

// Mock product data (replace with actual data fetching later)
const products = [
  { id: '1', image: 'https://picsum.photos/300/200', title: 'Stylish T-Shirt', price: 25.99, discount: 10, category: 'Apparel', rating: 4.5 },
  { id: '2', image: 'https://picsum.photos/300/200', title: 'Wireless Headphones', price: 79.99, discount: null, category: 'Electronics', rating: 4.8 },
  { id: '3', image: 'https://picsum.photos/300/200', title: 'Coffee Maker', price: 45.00, discount: 5, category: 'Home Goods', rating: 4.2 },
  { id: '4', image: 'https://picsum.photos/300/200', title: 'Running Shoes', price: 120.00, discount: 15, category: 'Footwear', rating: 4.7 },
  { id: '5', image: 'https://picsum.photos/300/200', title: 'Laptop Backpack', price: 55.50, discount: null, category: 'Accessories', rating: 4.6 },
  { id: '6', image: 'https://picsum.photos/300/200', title: 'Smart Watch', price: 199.99, discount: 20, category: 'Electronics', rating: 4.9 },
];


export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
           <h1 className="text-3xl font-bold">Products</h1>
           <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search products..." className="pl-10 w-full md:w-64" />
            </div>
             <Sheet>
               <SheetTrigger asChild>
                 <Button variant="outline" className="shrink-0">
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
                    <div className="space-y-2">
                        <Label className="font-semibold">Category</Label>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="cat-apparel" />
                            <Label htmlFor="cat-apparel">Apparel</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="cat-electronics" />
                            <Label htmlFor="cat-electronics">Electronics</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="cat-home" />
                            <Label htmlFor="cat-home">Home Goods</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="cat-footwear" />
                            <Label htmlFor="cat-footwear">Footwear</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="cat-accessories" />
                            <Label htmlFor="cat-accessories">Accessories</Label>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="font-semibold" htmlFor="price-range">Price Range</Label>
                        {/* Note: Slider needs state management for value display */}
                        <Slider defaultValue={[50]} max={200} step={1} id="price-range" />
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>$0</span>
                            <span>$200</span>
                        </div>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Checkbox id="discounted" />
                        <Label htmlFor="discounted">Show Only Discounted Items</Label>
                    </div>
                 </div>
                  <Button className="w-full mt-4 bg-primary hover:bg-primary/90">Apply Filters</Button>
               </SheetContent>
             </Sheet>
           </div>
         </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
              <CardHeader className="p-0 relative">
                 <Link href={`/products/${product.id}`} aria-label={`View details for ${product.title}`}>
                    <Image
                      src={product.image}
                      alt={product.title}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover"
                      data-ai-hint="product image"
                    />
                 </Link>
                {product.discount && (
                  <Badge variant="destructive" className="absolute top-2 right-2">{product.discount}% OFF</Badge>
                )}
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <Link href={`/products/${product.id}`}>
                    <CardTitle className="text-lg font-semibold hover:text-primary transition-colors duration-200 mb-2 leading-tight">{product.title}</CardTitle>
                </Link>
                {/* Placeholder for description or rating */}
                 <p className="text-sm text-muted-foreground">Rating: {product.rating} ★</p>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-xl font-bold text-foreground">
                        ${product.discount
                            ? (product.price * (1 - product.discount / 100)).toFixed(2)
                            : product.price.toFixed(2)}
                    </span>
                    {product.discount && (
                        <span className="text-sm text-muted-foreground line-through">
                            ${product.price.toFixed(2)}
                        </span>
                    )}
                </div>
                <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    Add to Cart
                 </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

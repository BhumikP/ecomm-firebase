// src/app/products/[id]/page.tsx
'use client';

import Image from 'next/image';
import type { Metadata } from 'next';
import Script from 'next/script';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, Loader2, Palette, X, Plus, Minus, ShoppingCart, Info } from 'lucide-react';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from 'react';
import type { IProduct, IProductColor } from '@/models/Product'; // Use base interfaces
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';

// Define Product Type matching the backend model, ensuring category is populated
interface ProductDetail extends Omit<IProduct, 'category' | 'colors' | '_id'> {
  _id: string;
  category: { _id: string; name: string; subcategories: string[] };
  colors: PopulatedProductColor[]; // Use PopulatedProductColor
  thumbnailUrl: string;
  minOrderQuantity: number;
}

// Type for color data used in frontend
interface PopulatedProductColor extends Omit<IProductColor, '_id'> {
    _id?: string;
    imageUrls: string[];
}


export default function ProductDetailPage() {
   const params = useParams();
   const id = params?.id as string;

   const { toast } = useToast();
   const [product, setProduct] = useState<ProductDetail | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [selectedImageIndex, setSelectedImageIndex] = useState(0);
   const [selectedColor, setSelectedColor] = useState<PopulatedProductColor | undefined>(undefined);
   const [quantity, setQuantity] = useState(1);
   const [isAddingToCart, setIsAddingToCart] = useState(false);


   useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            setError(null);
            try {
                 if (!id) {
                    setError("Product ID is missing.");
                    setLoading(false);
                    return;
                 }
                 const response = await fetch(`/api/products/${id}?populate=category`);

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
                const processedProductData = {
                    ...productData,
                    colors: (productData.colors || []).map(c => ({...c, imageUrls: Array.isArray(c.imageUrls) ? c.imageUrls : []})),
                    minOrderQuantity: productData.minOrderQuantity || 1,
                };
                setProduct(processedProductData);
                setQuantity(processedProductData.minOrderQuantity || 1); // Initialize quantity with minOrderQuantity


                if (processedProductData) {
                     document.title = `${processedProductData.title} | eShop Simplified`;
                     const firstAvailableColor = processedProductData.colors?.find(c => c.stock > 0 && c.stock >= (processedProductData.minOrderQuantity || 1));
                     if (firstAvailableColor) {
                         setSelectedColor(firstAvailableColor);
                         setSelectedImageIndex(0);
                     } else if (processedProductData.colors && processedProductData.colors.length > 0) {
                         setSelectedColor(processedProductData.colors[0]); // Select first color even if out of stock for display
                         setSelectedImageIndex(0);
                     } else {
                        setSelectedColor(undefined);
                        setSelectedImageIndex(0);
                     }

                } else {
                      document.title = `Product Not Found | eShop Simplified`;
                }

            } catch (err: any) {
                console.error("Failed to fetch product:", err);
                setError(err.message || "Failed to load product details.");
                setProduct(null);
                 document.title = `Error Loading Product | eShop Simplified`;
            } finally {
                setLoading(false);
            }
        };

        if (id) {
           fetchProduct();
        } else if (params) { // Check if params itself is defined
           setError("Product ID not available in route parameters.");
           setLoading(false);
        }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [id]);

   const handleAddToCart = async () => {
    if (!product) return;
    setIsAddingToCart(true);

    const userDataString = localStorage.getItem('userData');
    if (!userDataString) {
        toast({ variant: "destructive", title: "Please Log In", description: "You need to be logged in to add items to your cart." });
        setIsAddingToCart(false);
        return;
    }
    const userData = JSON.parse(userDataString);
    const userId = userData._id;

    if (!userId) {
        toast({ variant: "destructive", title: "Error", description: "User ID not found. Please log in again." });
        setIsAddingToCart(false);
        return;
    }

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

        toast({
            title: "Added to Cart",
            description: `${quantity} x ${itemToAdd} has been added to your cart.`,
        });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error Adding to Cart",
            description: error.message || "Could not add item to cart.",
        });
    } finally {
        setIsAddingToCart(false);
    }
   };

    const handleColorSelect = (color: PopulatedProductColor) => {
        setSelectedColor(color);
         setSelectedImageIndex(0);
         // Reset quantity to minOrderQuantity for the new color if its stock allows, otherwise to minOrderQty or 1
         const newMinQty = product?.minOrderQuantity || 1;
         setQuantity(color.stock >= newMinQty ? newMinQty : (color.stock > 0 ? color.stock : newMinQty) );
    };

    const currentStock = selectedColor?.stock ?? product?.stock ?? 0;
    const minOrderQty = product?.minOrderQuantity || 1;

    const handleQuantityChange = (change: number) => {
        setQuantity(prevQuantity => {
            let newQuantity = prevQuantity + change;
            if (newQuantity < minOrderQty) newQuantity = minOrderQty;
            if (newQuantity > currentStock) newQuantity = currentStock;
            return newQuantity;
        });
    };

    const handleManualQuantityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newQuantity = parseInt(e.target.value, 10);
        if (isNaN(newQuantity)) {
            setQuantity(minOrderQty);
            return;
        }
        if (newQuantity < minOrderQty) newQuantity = minOrderQty;
        if (newQuantity > currentStock) newQuantity = currentStock;
        setQuantity(newQuantity);
    };


    const displayImageSrc = selectedColor?.imageUrls?.[selectedImageIndex] ?? product?.thumbnailUrl ?? 'https://picsum.photos/600/400?random=placeholder';

   const generateProductSchema = (productData: ProductDetail | null) => {
       if (!productData) return null;

       const discountedPriceValue = productData.discount && productData.discount > 0
            ? (productData.price * (1 - productData.discount / 100)).toFixed(2)
            : productData.price.toFixed(2);

       const stockForSchema = selectedColor?.stock !== undefined ? selectedColor.stock : productData.stock;

       const schema = {
         "@context": "https://schema.org/",
         "@type": "Product",
         "name": productData.title,
         "image":  productData.thumbnailUrl || 'https://YOUR_DOMAIN.com/default-product-image.jpg', // Replace with actual domain
         "description": productData.description,
         "sku": productData._id,
         "aggregateRating": productData.rating && productData.rating > 0 ? {
             "@type": "AggregateRating",
             "ratingValue": productData.rating.toFixed(1),
             "bestRating": "5",
         } : undefined,
         "offers": {
           "@type": "Offer",
           "url": `https://YOUR_DOMAIN.com/products/${productData._id}`, // Replace with actual domain
           "priceCurrency": "INR",
           "price": discountedPriceValue,
           "priceValidUntil": new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
           "itemCondition": "https://schema.org/NewCondition",
           "availability": stockForSchema > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
         }
       };
       Object.keys(schema).forEach(key => schema[key as keyof typeof schema] === undefined && delete schema[key as keyof typeof schema]);
       if (schema.offers && schema.offers.availability === undefined) delete schema.offers.availability;
       if (schema.aggregateRating === undefined) delete schema.aggregateRating;
       return JSON.stringify(schema);
   };
   const productSchemaJson = generateProductSchema(product);


   if (loading) {
      return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="grid md:grid-cols-2 gap-8 lg:gap-12 w-full max-w-5xl mx-auto">
                    <div className="flex flex-col gap-4">
                        <Skeleton className="aspect-square md:aspect-[4/3] w-full rounded-lg bg-muted" />
                         <div className="grid grid-cols-5 gap-2">
                             {[...Array(5)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-md bg-muted" />)}
                         </div>
                    </div>
                    <div className="flex flex-col space-y-4">
                         <Skeleton className="h-10 w-3/4 bg-muted rounded" />
                         <div className="flex items-center space-x-4">
                            <Skeleton className="h-6 w-20 bg-muted rounded-full" />
                            <Skeleton className="h-6 w-24 bg-muted rounded" />
                         </div>
                         <Separator className="my-4 bg-muted h-px" />
                         <Skeleton className="h-4 w-full bg-muted rounded" />
                         <Skeleton className="h-4 w-5/6 bg-muted rounded" />
                         <Skeleton className="h-4 w-full bg-muted rounded" />
                         <Skeleton className="h-8 w-1/2 bg-muted rounded my-4" />
                         <Skeleton className="h-6 w-1/4 bg-muted rounded my-2" />
                          <div className="pt-2 space-y-2">
                             <Skeleton className="h-6 w-1/3 bg-muted rounded mb-2" />
                             <div className="flex gap-2">
                                 <Skeleton className="h-8 w-8 rounded-full bg-muted" />
                                 <Skeleton className="h-8 w-8 rounded-full bg-muted" />
                                 <Skeleton className="h-8 w-8 rounded-full bg-muted" />
                             </div>
                          </div>
                         <div className="pt-4 space-y-2">
                             <Skeleton className="h-6 w-1/3 bg-muted rounded mb-2" />
                             <Skeleton className="h-4 w-full bg-muted rounded" />
                             <Skeleton className="h-4 w-5/6 bg-muted rounded" />
                         </div>
                         <div className="pt-4">
                            <Skeleton className="h-12 w-40 bg-muted rounded" />
                         </div>
                    </div>
                 </div>
            </main>
            <Footer />
        </div>
     );
   }

  if (error || !product) {
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

  const discountedPrice = product.discount && product.discount > 0
    ? (product.price * (1 - product.discount / 100)).toFixed(2)
    : product.price.toFixed(2);

   const isOutOfStock = currentStock <= 0 || quantity > currentStock || currentStock < minOrderQty;


  return (
    <div className="flex flex-col min-h-screen bg-background">
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
          <div className="flex flex-col gap-4">
             <div className="relative aspect-square md:aspect-[4/3] bg-muted rounded-lg overflow-hidden shadow-md">
                <Image
                  src={displayImageSrc}
                  alt={product.title + (selectedColor ? ` - ${selectedColor.name}` : '')}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                  data-ai-hint="detailed product photo ecommerce professional"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/600/400?random=onerror'; }}
                />
                 {product.discount && product.discount > 0 && (
                    <Badge variant="destructive" className="absolute top-4 left-4 text-sm md:text-base px-3 py-1 shadow-md">{product.discount}% OFF</Badge>
                 )}
             </div>
             {selectedColor && selectedColor.imageUrls && selectedColor.imageUrls.length > 0 && (
                 <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                     {selectedColor.imageUrls.map((imgUrl, index) => (
                         <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                                 ${selectedImageIndex === index ? 'border-primary' : 'border-transparent hover:border-muted-foreground/50'}`}
                            aria-label={`View image ${index + 1} of ${selectedColor.name}`}
                            aria-current={selectedImageIndex === index}
                         >
                            <Image
                                src={imgUrl}
                                alt={`${product.title} - ${selectedColor.name} - thumbnail ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="100px"
                                data-ai-hint="product thumbnail gallery"
                                 onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/100/100?random=onerrorthumb'; }}
                            />
                         </button>
                     ))}
                 </div>
             )}
          </div>


          <div className="flex flex-col space-y-4">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">{product.title}</h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                 <Badge variant="secondary" className="text-sm px-3 py-1">{product.category.name}{product.subcategory ? ` > ${product.subcategory}`: ''}</Badge>
                 <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                         <Star
                            key={i}
                             className={`h-5 w-5 ${
                                 i < Math.round(product.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                             }`}
                             aria-hidden="true"
                         />
                      ))}
                    <span className="ml-2 text-foreground sr-only">Rating: {(product.rating || 0).toFixed(1)} out of 5 stars</span>
                     <span className="ml-2 text-foreground" aria-hidden="true">({(product.rating || 0).toFixed(1)})</span>
                 </div>
                  <span className="text-xs">ID: {product._id}</span>
            </div>

            <Separator className="my-4" />
             <p className="text-base text-foreground/90 leading-relaxed">{product.description}</p>

            <div className="space-y-1">
                <span className="text-3xl font-bold text-foreground">₹{discountedPrice}</span>
                 {product.discount && product.discount > 0 && (
                    <span className="ml-3 text-lg text-muted-foreground line-through">
                        ₹{product.price.toFixed(2)}
                    </span>
                 )}
             </div>

            {product.colors && product.colors.length > 0 && (
                <div className="pt-2">
                    <h3 className="text-md font-semibold mb-2 flex items-center gap-2 text-foreground"><Palette className="h-5 w-5"/> Select Color: <span className="text-muted-foreground">{selectedColor?.name || 'Default'}</span></h3>
                    <div className="flex flex-wrap gap-2">
                        {product.colors.map((color) => (
                            <button
                                key={color._id?.toString() || color.name}
                                onClick={() => handleColorSelect(color)}
                                className={`relative h-8 w-8 rounded-full border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
                                    ${selectedColor?.name === color.name ? 'ring-2 ring-primary ring-offset-2 border-primary' : 'border-muted-foreground/30 hover:border-primary'}
                                    ${color.stock < minOrderQty ? 'opacity-50 cursor-not-allowed' : ''}`}
                                style={{ backgroundColor: color.hexCode || '#ccc' }}
                                title={`${color.name} ${color.stock < minOrderQty ? '(Not enough stock)' : ''}`}
                                aria-label={`Select color ${color.name} ${color.stock < minOrderQty ? '(Not enough stock)' : ''}`}
                                disabled={color.stock < minOrderQty || isAddingToCart}
                            >
                               {color.stock < minOrderQty && (
                                     <X className="h-4 w-4 text-destructive-foreground absolute inset-0 m-auto opacity-70" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="pt-2">
                 {isOutOfStock ? (
                     <Badge variant="destructive" className="text-sm px-3 py-1">Out of Stock</Badge>
                 ) : currentStock < 10 && currentStock >= minOrderQty ? (
                      <Badge variant="outline" className="text-sm px-3 py-1 border-yellow-500 text-yellow-600">Low Stock ({currentStock} left)</Badge>
                 ): (
                     <Badge variant="default" className="text-sm px-3 py-1 bg-green-100 text-green-800 border-green-200">In Stock</Badge>
                 )}
             </div>

             {/* Quantity Selector */}
            <div className="pt-4 space-y-2">
                <label htmlFor="quantity" className="text-md font-semibold text-foreground">Quantity:</label>
                <div className="flex items-center gap-2 max-w-[150px]">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= minOrderQty || isOutOfStock || isAddingToCart}
                        aria-label="Decrease quantity"
                    >
                        <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                        id="quantity"
                        type="number"
                        value={quantity}
                        onChange={handleManualQuantityInput}
                        min={minOrderQty}
                        max={currentStock}
                        className="w-16 h-9 text-center"
                        disabled={isOutOfStock || isAddingToCart}
                        aria-label="Product quantity"
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= currentStock || isOutOfStock || isAddingToCart}
                        aria-label="Increase quantity"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                 {minOrderQty > 1 && (
                    <div className="flex items-center text-xs text-muted-foreground gap-1 mt-1">
                        <Info className="h-3 w-3"/>
                        <span>Minimum order quantity: {minOrderQty}</span>
                    </div>
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
                className="w-full md:w-auto bg-primary hover:bg-primary/90 text-lg px-8 py-3 flex items-center gap-2"
                onClick={handleAddToCart}
                disabled={isOutOfStock || loading || isAddingToCart}
               >
                 {isAddingToCart ? <Loader2 className="h-5 w-5 animate-spin"/> : <ShoppingCart className="h-5 w-5"/>}
                 {isAddingToCart ? 'Adding...' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

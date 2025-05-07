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
import { Star, Loader2, Palette } from 'lucide-react';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from 'react';
import type { IProduct, IProductColor } from '@/models/Product';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'next/navigation';

// Define Product Type matching the backend model, ensuring category is populated
interface ProductDetail extends Omit<IProduct, 'category' | 'colors'> {
  _id: string;
  category: { _id: string; name: string; subcategories: string[] };
  colors: PopulatedProductColor[]; // Use PopulatedProductColor
}

interface PopulatedProductColor extends Omit<IProductColor, '_id' | 'imageIndices'> {
    _id?: string; // Mongoose subdocument _id is optional on client
    imageIndices: number[]; // Ensure this is an array of numbers
}


export default function ProductDetailPage() {
   const pageParams = useParams<{ id: string }>();
   const id = pageParams?.id;

   const { toast } = useToast();
   const [product, setProduct] = useState<ProductDetail | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [selectedImageIndex, setSelectedImageIndex] = useState(0);
   const [selectedColor, setSelectedColor] = useState<PopulatedProductColor | undefined>(undefined);

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
                // Ensure colors and imageIndices within colors are arrays
                const processedProductData = {
                    ...productData,
                    colors: (productData.colors || []).map(c => ({...c, imageIndices: Array.isArray(c.imageIndices) ? c.imageIndices : []}))
                };
                setProduct(processedProductData);

                if (processedProductData) {
                     document.title = `${processedProductData.title} | eShop Simplified`;
                     if (processedProductData.colors && processedProductData.colors.length > 0) {
                         const firstColor = processedProductData.colors[0];
                         setSelectedColor(firstColor);
                         if (firstColor.imageIndices && firstColor.imageIndices.length > 0) {
                            setSelectedImageIndex(firstColor.imageIndices[0]);
                         } else if (processedProductData.images && processedProductData.images.length > 0) {
                            setSelectedImageIndex(0);
                         }
                     } else if (processedProductData.images && processedProductData.images.length > 0) {
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
        } else if (pageParams) { // This condition might be redundant if id is derived from pageParams
           setError("Product ID not available in route parameters.");
           setLoading(false);
        }
   }, [id, pageParams]);

   const handleAddToCart = () => {
    if (product) {
        const itemToAdd = selectedColor ? `${product.title} (${selectedColor.name})` : product.title;
        console.log(`Adding ${itemToAdd} to cart`);
        toast({
          title: "Added to Cart",
          description: `${itemToAdd} has been added to your cart.`,
        });
    }
   };

    const handleColorSelect = (color: PopulatedProductColor) => {
        setSelectedColor(color);
        if (color.imageIndices && color.imageIndices.length > 0) {
            setSelectedImageIndex(color.imageIndices[0]); // Show the first image of the selected color
        } else if (product?.images && product.images.length > 0) {
            setSelectedImageIndex(0); // Fallback to the product's primary image
        }
    };

    const handleThumbnailClick = (index: number) => {
        setSelectedImageIndex(index);
        const matchingColor = product?.colors.find(c => c.imageIndices.includes(index));
        if (matchingColor) {
            setSelectedColor(matchingColor);
        } else {
            setSelectedColor(undefined);
        }
    };


   const generateProductSchema = (productData: ProductDetail | null) => {
       if (!productData) return null;

       const discountedPriceValue = productData.discount && productData.discount > 0
            ? (productData.price * (1 - productData.discount / 100)).toFixed(2)
            : productData.price.toFixed(2);

       const schema = {
         "@context": "https://schema.org/",
         "@type": "Product",
         "name": productData.title,
         "image": (productData.images && productData.images.length > 0 ? productData.images[0] : productData.image) || 'https://YOUR_DOMAIN.com/default-product-image.jpg',
         "description": productData.description,
         "sku": productData._id,
         "aggregateRating": productData.rating && productData.rating > 0 ? {
             "@type": "AggregateRating",
             "ratingValue": productData.rating.toFixed(1),
             "bestRating": "5",
         } : undefined,
         "offers": {
           "@type": "Offer",
           "url": `https://YOUR_DOMAIN.com/products/${productData._id}`,
           "priceCurrency": "USD",
           "price": discountedPriceValue,
           "priceValidUntil": new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
           "itemCondition": "https://schema.org/NewCondition",
           "availability": productData.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
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
                        <div className="grid grid-cols-4 gap-2">
                            {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-square w-full rounded bg-muted" />)}
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

  const displayImageSrc = product.images && product.images.length > selectedImageIndex
                         ? product.images[selectedImageIndex]
                         : product.image;

  const currentStock = selectedColor?.stock !== undefined ? selectedColor.stock : product.stock;
  const isOutOfStock = currentStock <= 0;


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
                  src={displayImageSrc || 'https://picsum.photos/600/400?random=placeholder'}
                  alt={product.title}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                  data-ai-hint="detailed product photo ecommerce professional"
                />
                 {product.discount && product.discount > 0 && (
                    <Badge variant="destructive" className="absolute top-4 left-4 text-sm md:text-base px-3 py-1 shadow-md">{product.discount}% OFF</Badge>
                 )}
             </div>
             {product.images && product.images.length > 1 && (
                 <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                     {product.images.map((imgUrl, index) => (
                         <button
                            key={index}
                            onClick={() => handleThumbnailClick(index)}
                            className={`aspect-square rounded-md overflow-hidden border-2 transition-all
                                ${index === selectedImageIndex ? 'border-primary ring-2 ring-primary' : 'border-transparent hover:border-muted-foreground/50'}`}
                            aria-label={`View image ${index + 1} of ${product.images.length}`}
                         >
                            <Image
                                src={imgUrl}
                                alt={`${product.title} - thumbnail ${index + 1}`}
                                width={100}
                                height={100}
                                className="w-full h-full object-cover"
                                data-ai-hint="product thumbnail gallery"
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
                <span className="text-3xl font-bold text-primary">${discountedPrice}</span>
                 {product.discount && product.discount > 0 && (
                    <span className="ml-3 text-lg text-muted-foreground line-through">
                        ${product.price.toFixed(2)}
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
                                className={`h-8 w-8 rounded-full border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
                                    ${selectedColor?._id === color._id || selectedColor?.name === color.name ? 'ring-2 ring-primary ring-offset-2 border-primary' : 'border-muted-foreground/30 hover:border-primary'}`}
                                style={{ backgroundColor: color.hexCode || '#ccc' }}
                                title={color.name}
                                aria-label={`Select color ${color.name} ${color.stock !== undefined && color.stock <= 0 ? '(Out of stock)' : ''}`}
                                disabled={color.stock !== undefined && color.stock <= 0}
                            >
                               {color.stock !== undefined && color.stock <= 0 && (
                                    <span className="absolute inset-0 flex items-center justify-center text-destructive-foreground text-xs leading-none">X</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}


             <div className="pt-2">
                 {isOutOfStock ? (
                     <Badge variant="destructive" className="text-sm px-3 py-1">Out of Stock</Badge>
                 ) : currentStock < 10 ? (
                      <Badge variant="outline" className="text-sm px-3 py-1 border-yellow-500 text-yellow-600">Low Stock ({currentStock} left)</Badge>
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
                disabled={isOutOfStock || loading}
               >
                 {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


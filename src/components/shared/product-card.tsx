'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from '@/lib/utils';
import type { ICategory } from '@/models/Category';
import type { IProductColor } from '@/models/Product';
import { Loader2, Palette, ShoppingCart, Star, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';


export interface ProductCardProductType {
  _id: string;
  title: string;
  description: string;
  price: number;
  discount: number | null;
  category: ICategory; // Expect category to be populated object
  subcategory?: string;
  rating?: number; // Optional rating
  numRatings?: number; // Number of reviews
  stock: number;
  features: string[];
  colors: IProductColor[];
  thumbnailUrl: string;
  minOrderQuantity: number;
  isTopBuy?: boolean;
  isNewlyLaunched?: boolean;
}

interface ProductCardProps {
  product: ProductCardProductType;
  selectedColor?: IProductColor;
  onColorSelect: (productId: string, color?: IProductColor) => void;
  onAddToCart: (product: ProductCardProductType, selectedColor?: IProductColor) => void;
  isAddingToCart: boolean;
  className?: string;
}

const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export function ProductCard({
  product,
  selectedColor,
  onColorSelect,
  onAddToCart,
  isAddingToCart,
  className,
}: ProductCardProps) {
  const productIdStr = product._id.toString();
  const displayImage = selectedColor?.imageUrls?.[0] ?? product.thumbnailUrl ?? 'https://placehold.co/300x200.png';
  const safeDisplayImage = displayImage && displayImage.trim() !== '' ? displayImage : 'https://placehold.co/300x200.png';
  const minOrderQty = product.minOrderQuantity || 1;
  const currentStock = selectedColor?.stock ?? product.stock ?? 0;
  const isOutOfStock = currentStock < minOrderQty;

  const handleColorButtonClick = (e: React.MouseEvent<HTMLButtonElement>, color: IProductColor) => {
    e.preventDefault(); // Prevent link navigation if card is wrapped in Link
    e.stopPropagation(); // Prevent event bubbling
    onColorSelect(productIdStr, color);
  };

  const handleAddToCartButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(product, selectedColor);
  };


  return (
    <Card className={cn(
        "overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col bg-white/95 backdrop-blur-sm group border border-gray-200 hover:border-primary/30 rounded-xl",
        "hover:-translate-y-1 transform-gpu",
        className
      )}>
      <CardHeader className="p-0 relative bg-gradient-to-br from-gray-50 to-gray-100/50">
        <Link href={`/products/${productIdStr}`} aria-label={`View details for ${product.title}`} className="block aspect-[4/3] sm:aspect-square lg:aspect-[5/4] xl:aspect-square overflow-hidden rounded-t-xl relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Image
            src={safeDisplayImage}
            alt={product.title}
            fill
            className="object-contain hover:scale-105 transition-transform duration-300 p-2"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            loading="lazy"
            data-ai-hint={product.category?.name ? `${product.category.name.toLowerCase()} product` : "product image"}
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400.png'; }}
          />
        </Link>
        {product.isNewlyLaunched && !product.discount && (
          <Badge variant="default" className="absolute top-3 left-3 shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 font-medium text-xs px-2 py-1 rounded-full">
            ✨ New
          </Badge>
        )}
         {product.discount && product.discount > 0 && (
          <Badge variant="destructive" className={`absolute top-3 ${product.isNewlyLaunched ? 'right-3' : 'left-3'} shadow-lg bg-gradient-to-r from-red-500 to-pink-600 text-white border-0 font-bold text-xs px-2 py-1 rounded-full`}>
            -{product.discount}%
          </Badge>
        )}
      </CardHeader>
      <CardContent className="px-4 pt-4 md:px-6 md:pt-6 flex-grow bg-white">
        <Link href={`/products/${productIdStr}`}>
          <CardTitle className="text-lg font-bold hover:text-primary transition-colors duration-200 mb-2 leading-tight line-clamp-2 text-gray-800" title={product.title}>
            {product.title}
          </CardTitle>
        </Link>
        {/* {product.category && (
          <div className="text-sm mb-3 font-medium">
            <Link 
              href={`/products?category=${product.category._id}&categoryName=${encodeURIComponent(product.category.name)}`}
              className="text-gray-500 hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()} // Prevent parent link navigation
            >
              {product.category.name}
            </Link>
            {product.subcategory && (
              <>
                {' • '}
                <Link 
                  href={`/products?category=${product.category._id}&categoryName=${encodeURIComponent(product.category.name)}&subcategoryName=${encodeURIComponent(product.subcategory)}`}
                  className="text-gray-500 hover:text-primary transition-colors"
                  onClick={(e) => e.stopPropagation()} // Prevent parent link navigation
                >
                  {product.subcategory}
                </Link>
              </>
            )}
          </div>
        )} */}
        
        <div className="flex items-center gap-1 mb-4">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`h-4 w-4 ${i < Math.round(product.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
            ))}
          </div>
          <div className="ml-2 flex items-center gap-1">
            <span className="text-sm text-gray-600 font-medium">
              {product.rating ? `${product.rating.toFixed(1)}` : 'No rating'}
            </span>
            <span className="text-sm text-gray-400">
              ({(product.numRatings || 0)} {(product.numRatings || 0) === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        </div>

        {product.colors && product.colors.length > 0 && (
          <div className="flex gap-3">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-gray-500" aria-label="Available colors"/>
              <span className="text-sm font-medium text-gray-700">Colors</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.colors.slice(0,6).map((color, index) => (
                <button
                  key={color._id?.toString() || `${color.name}-${index}`}
                  title={color.name + (color.stock < minOrderQty ? ' (Low stock)' : '')}
                  aria-label={`Select color ${color.name}${color.stock < minOrderQty ? ', low stock' : ''}`}
                  onClick={(e) => handleColorButtonClick(e, color)}
                  className={`h-8 w-8 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 shadow-sm hover:shadow-md
                      ${selectedColor?.name === color.name ? 'ring-2 ring-primary ring-offset-2 border-primary shadow-lg scale-110' : 'border-gray-300 hover:border-primary/70'}
                      ${color.stock < minOrderQty ? 'opacity-40 cursor-not-allowed relative' : 'hover:scale-105'}`}
                  style={{ backgroundColor: color.hexCode || '#f3f4f6' }}
                  disabled={color.stock < minOrderQty || isAddingToCart}
                >
                  {!color.hexCode && <span className="sr-only">{color.name}</span>}
                  {color.stock < minOrderQty && <X className="h-4 w-4 text-red-500 absolute inset-0 m-auto" />}
                </button>
              ))}
              {product.colors.length > 6 && (
                <span className="text-xs text-gray-500 self-center ml-1 font-medium">
                  +{product.colors.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* {minOrderQty > 1 && (
          <div className="flex items-center text-sm text-amber-600 gap-2 mb-3 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
            <Info className="h-4 w-4"/>
            <span className="font-medium">Minimum order: {minOrderQty} units</span>
          </div>
        )} */}

        {/* Stock Status */}
        {/* <div className="flex items-center gap-2 text-sm text-gray-600 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <span className="font-medium">
              {currentStock > 0 ? `${currentStock} in stock` : 'Out of stock'}
            </span>
        </div> */}
      </CardContent>
      <CardFooter className="px-4 pb-4 md:px-6 md:pb-6 flex flex-col gap-3 items-start mt-auto bg-white border-t border-gray-100">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-gray-900">
              ₹{formatCurrency(product.discount && product.discount > 0
                ? (product.price * (1 - product.discount / 100))
                : product.price)}
            </span>
            {product.discount && product.discount > 0 && (
              <span className="text-sm text-gray-500 line-through font-medium">
                ₹{formatCurrency(product.price)}
              </span>
            )}
          </div>
          {product.discount && product.discount > 0 && (
            <span className="text-sm text-green-600 font-semibold">
              Save ₹{formatCurrency(product.price * (product.discount / 100))}
            </span>
          )}
        </div>
        <Button
          size="lg"
          variant={isOutOfStock ? "outline" : "default"}
          className={cn(
            "transition-all w-full duration-300 font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105",
            isOutOfStock
              ? "border-2 border-red-200 text-red-600 bg-red-50 hover:bg-red-100 cursor-not-allowed"
              : "bg-gradient-to-r from-primary to-primary/90 text-white hover:from-primary/90 hover:to-primary border-0 shadow-primary/25"
          )}
          onClick={handleAddToCartButtonClick}
          aria-label={`Add ${product.title} to cart`}
          disabled={isOutOfStock || isAddingToCart}
        >
          {isAddingToCart ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin"/>
              <span>Adding...</span>
            </>
          ) : !isOutOfStock ? (
            <>
              <ShoppingCart className="h-5 w-5 mr-2"/>
              <span>Add to Cart</span>
            </>
          ) : (
            <span>Out of Stock</span>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

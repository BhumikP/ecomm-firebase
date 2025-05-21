
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { IProductColor } from '@/models/Product';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Palette, X, ShoppingCart, Loader2, Info } from 'lucide-react';
import type { ICategory } from '@/models/Category';
import { cn } from '@/lib/utils';


export interface ProductCardProductType {
  _id: string;
  title: string;
  description: string;
  price: number;
  discount: number | null;
  category: ICategory; // Expect category to be populated object
  subcategory?: string;
  rating?: number; // Optional rating
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
        "overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col bg-card group border border-transparent hover:border-primary/30",
        className
      )}>
      <CardHeader className="p-0 relative">
        <Link href={`/products/${productIdStr}`} aria-label={`View details for ${product.title}`} className="block aspect-[4/3] overflow-hidden rounded-t-lg">
          <Image
            src={displayImage}
            alt={product.title}
            width={300}
            height={200}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
            data-ai-hint={product.category?.name ? `${product.category.name.toLowerCase()} product` : "product image"}
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x200.png'; }}
          />
        </Link>
        {product.isNewlyLaunched && !product.discount && ( // Show "New" only if not discounted, to avoid badge clutter
          <Badge variant="default" className="absolute top-2 left-2 shadow-md bg-primary text-primary-foreground border-primary/50">New</Badge>
        )}
         {product.discount && product.discount > 0 && (
          <Badge variant="destructive" className={`absolute top-2 ${product.isNewlyLaunched ? 'right-2' : 'left-2'} shadow-md`}>{product.discount}% OFF</Badge>
        )}
      </CardHeader>
      <CardContent className="p-3 md:p-4 flex-grow">
        <Link href={`/products/${productIdStr}`}>
          <CardTitle className="text-base font-semibold hover:text-primary transition-colors duration-200 mb-1 leading-tight line-clamp-2 h-10" title={product.title}>{product.title}</CardTitle>
        </Link>
        {product.category && <p className="text-xs text-muted-foreground mb-1.5">{product.category.name}{product.subcategory ? ` > ${product.subcategory}` : ''}</p>}
        <div className="flex items-center gap-1 mt-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${i < Math.round(product.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
          ))}
          <span className="text-xs text-muted-foreground ml-1">({product.rating?.toFixed(1) ?? 'N/A'})</span>
        </div>

        {product.colors && product.colors.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-2 items-center">
            <Palette className="h-4 w-4 text-muted-foreground mr-0.5 flex-shrink-0" aria-label="Available colors"/>
            {product.colors.slice(0,5).map((color, index) => ( // Show max 5 colors
              <button
                key={color._id?.toString() || `${color.name}-${index}`}
                title={color.name + (color.stock < minOrderQty ? ' (Low stock)' : '')}
                aria-label={`Select color ${color.name}${color.stock < minOrderQty ? ', low stock' : ''}`}
                onClick={(e) => handleColorButtonClick(e, color)}
                className={`h-5 w-5 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary transition-all
                    ${selectedColor?.name === color.name ? 'ring-2 ring-primary ring-offset-1 border-primary shadow-md' : 'border-muted-foreground/30 hover:border-primary/70'}
                    ${color.stock < minOrderQty ? 'opacity-40 cursor-not-allowed relative' : ''}`}
                style={{ backgroundColor: color.hexCode || 'transparent' }}
                disabled={color.stock < minOrderQty || isAddingToCart}
              >
                {!color.hexCode && <span className="sr-only">{color.name}</span>}
                {color.stock < minOrderQty && <X className="h-3 w-3 text-destructive-foreground absolute inset-0 m-auto opacity-70" />}
              </button>
            ))}
            {product.colors.length > 5 && <span className="text-xs text-muted-foreground">& more</span>}
          </div>
        )}
         {minOrderQty > 1 && (
            <div className="flex items-center text-xs text-muted-foreground gap-1 mt-2">
                <Info className="h-3 w-3"/>
                <span>Min. order: {minOrderQty}</span>
            </div>
        )}
      </CardContent>
      <CardFooter className="p-3 md:p-4 pt-0 flex justify-between items-center mt-auto">
        <div className="flex flex-col">
          <span className="text-lg font-bold text-foreground">
            ₹{formatCurrency(product.discount && product.discount > 0
              ? (product.price * (1 - product.discount / 100))
              : product.price)}
          </span>
          {product.discount && product.discount > 0 && (
            <span className="text-xs text-muted-foreground line-through">
              ₹{formatCurrency(product.price)}
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant={isOutOfStock ? "outline" : "default"}
          className={cn(
            "transition-colors duration-200",
            isOutOfStock
              ? "border-destructive text-destructive hover:bg-destructive/10 cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/80"
          )}
          onClick={handleAddToCartButtonClick}
          aria-label={`Add ${product.title} to cart`}
          disabled={isOutOfStock || isAddingToCart}
        >
          {isAddingToCart ? <Loader2 className="h-4 w-4 mr-1 md:mr-2 animate-spin"/> :
           !isOutOfStock ? <ShoppingCart className="h-4 w-4 mr-1 md:mr-2"/> : null}
           {isAddingToCart ? 'Adding...' : isOutOfStock ? 'Out of Stock' : 'Add'}
        </Button>
      </CardFooter>
    </Card>
  );
}


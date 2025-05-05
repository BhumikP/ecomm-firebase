import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted text-muted-foreground mt-auto border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-foreground mb-3">About Us</h3>
            <p className="text-sm">eShop Simplified provides quality products with a seamless shopping experience.</p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-3">Customer Service</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="/shipping" className="hover:text-primary transition-colors">Shipping & Returns</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-3">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products/category/apparel" className="hover:text-primary transition-colors">Apparel</Link></li>
              <li><Link href="/products/category/electronics" className="hover:text-primary transition-colors">Electronics</Link></li>
              <li><Link href="/products/category/home" className="hover:text-primary transition-colors">Home Goods</Link></li>
            </ul>
          </div>
           <div>
            <h3 className="font-semibold text-foreground mb-3">My Account</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/account" className="hover:text-primary transition-colors">Login / Register</Link></li>
              <li><Link href="/account/orders" className="hover:text-primary transition-colors">Order History</Link></li>
              <li><Link href="/cart" className="hover:text-primary transition-colors">Shopping Cart</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-6 text-center text-sm">
          <p>&copy; {currentYear} eShop Simplified. All rights reserved.</p>
          <div className="mt-2 space-x-4">
             <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
             <span>|</span>
             <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

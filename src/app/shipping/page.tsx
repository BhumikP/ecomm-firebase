
// src/app/shipping/page.tsx
import type { Metadata } from 'next';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import Link from 'next/link'; // Import Link

export const metadata: Metadata = {
  title: 'Shipping & Returns Policy',
  description: 'Learn about eShop Simplified\'s shipping procedures, delivery times, and returns policy. We aim for transparent and efficient order fulfillment.',
  keywords: ['shipping policy', 'returns policy', 'delivery information', 'order fulfillment', 'eshop shipping', 'eshop returns'],
  openGraph: {
    title: 'Shipping & Returns | eShop Simplified',
    description: 'Detailed information on our shipping and returns processes.',
    type: 'article',
    url: '/shipping',
  },
  twitter: {
    card: 'summary',
    title: 'Shipping & Returns | eShop Simplified',
    description: 'Detailed information on our shipping and returns processes.',
  },
};

export default function ShippingAndReturnsPage() {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const companyName = 'eShop Simplified';
  const contactEmail = 'support@eshopsimplified.com'; // Example email
  const contactPageUrl = '/contact';

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto prose prose-base md:prose-lg dark:prose-invert prose-headings:text-primary prose-a:text-primary hover:prose-a:text-primary/80">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Shipping & Returns Policy</h1>
          <p className="text-sm text-muted-foreground">Last Updated: {currentDate}</p>

          <p>
            At {companyName}, we are committed to providing you with a seamless shopping experience, from browsing our products to receiving your order. This policy outlines our shipping procedures and how we handle returns.
          </p>

          <h2 id="shipping-policy">Shipping Policy</h2>

          <h3>Order Processing</h3>
          <ul>
            <li><strong>Processing Time:</strong> Most orders are processed within 1-3 business days (excluding weekends and holidays) after receiving your order confirmation email. You will receive another notification when your order has shipped.</li>
            <li><strong>Bulk Orders:</strong> For large volume or B2B orders, processing times may vary. We will communicate specific timelines upon order confirmation.</li>
            <li><strong>Potential Delays:</strong> Please note that processing times may be longer during peak seasons or due to unforeseen circumstances. We will notify you of any significant delays.</li>
          </ul>

          <h3>Shipping Methods & Delivery Times</h3>
          <ul>
            <li><strong>Domestic Shipping (India):</strong> We offer standard shipping across India. Estimated delivery times typically range from 3-7 business days after shipment, depending on your location.</li>
            <li><strong>Expedited Shipping:</strong> Expedited shipping options may be available at an additional cost for select locations and products. Options will be presented at checkout if available.</li>
            <li><strong>International Shipping:</strong> Currently, we primarily ship within India. For international shipping inquiries, please <Link href={contactPageUrl}>contact our support team</Link> before placing an order.</li>
          </ul>

          <h3>Shipping Costs</h3>
          <ul>
            <li>Shipping charges for your order will be calculated and displayed at checkout.</li>
            <li>For B2B or bulk orders, shipping costs may be quoted separately based on volume, weight, and destination.</li>
            <li>We may offer free shipping promotions from time to time. Terms and conditions for such promotions will be clearly stated.</li>
          </ul>

          <h3>Shipment Tracking</h3>
          <p>
            Once your order has shipped, you will receive an email notification from us which will include a tracking number you can use to check its status. Please allow 48 hours for the tracking information to become available.
          </p>

          <h3>Incomplete or Incorrect Addresses</h3>
          <p>
            It is the customer's responsibility to provide a complete and accurate shipping address. {companyName} is not liable for orders shipped to incorrect or incomplete addresses provided by the customer. If an order is returned to us due to an incorrect address, additional shipping fees may apply to reship the order.
          </p>

          <h2 id="returns-policy">Returns Policy</h2>

          <h3>Return Eligibility</h3>
          <ul>
            <li>We accept returns for most items within <strong>30 days</strong> of the delivery date.</li>
            <li>To be eligible for a return, your item must be unused, in the same condition that you received it, and in its original packaging with all tags attached.</li>
            <li><strong>Non-Returnable Items:</strong> Certain types of items cannot be returned, such as:
              <ul>
                <li>Perishable goods (e.g., food, flowers)</li>
                <li>Custom products (such as special orders or personalized items)</li>
                <li>Personal care goods (such as beauty products, hygiene items)</li>
                <li>Hazardous materials, flammable liquids, or gases (relevant for some B2B contexts)</li>
                <li>Gift cards</li>
                <li>Downloadable software products</li>
              </ul>
            Please check the product description page to see if an item is non-returnable.</li>
          </ul>

          <h3>Return Process</h3>
          <ol>
            <li>To initiate a return, please <Link href={contactPageUrl}>contact our customer support team</Link> with your order number and details about the product you would like to return.</li>
            <li>We will provide you with instructions on how and where to send your return. Please do not send items back without first requesting a return.</li>
            <li>You will generally be responsible for paying for your own shipping costs for returning your item unless the return is due to our error (e.g., you received a defective or incorrect item). Shipping costs are non-refundable.</li>
          </ol>

          <h3>Refunds</h3>
          <ul>
            <li>Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. We will also notify you of the approval or rejection of your refund.</li>
            <li>If approved, your refund will be processed, and a credit will automatically be applied to your original method of payment, within a certain number of days (typically 5-10 business days, depending on your bank or card issuer).</li>
            <li><strong>Late or Missing Refunds:</strong> If you haven’t received a refund yet, first check your bank account again. Then contact your credit card company; it may take some time before your refund is officially posted. Next, contact your bank. If you’ve done all of this and you still have not received your refund, please <Link href={contactPageUrl}>contact us</Link>.</li>
          </ul>

          <h3>Exchanges</h3>
          <p>
            The fastest way to ensure you get what you want is to return the item you have, and once the return is accepted, make a separate purchase for the new item. We typically do not process direct exchanges due to inventory management.
          </p>

          <h3>Damaged or Defective Goods</h3>
          <p>
            Please inspect your order upon reception and contact us immediately if the item is defective, damaged, or if you receive the wrong item, so that we can evaluate the issue and make it right. Please provide your order number and photographic evidence if possible.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have any questions about our Shipping & Returns Policy, please do not hesitate to <Link href={contactPageUrl}>contact us</Link> at <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

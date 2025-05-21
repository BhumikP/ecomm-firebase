
// No longer needs 'use client'
import type { Metadata } from 'next';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import Link from 'next/link'; // Import Link for navigation

export const metadata: Metadata = {
  title: 'FAQ - Frequently Asked Questions',
  description: 'Find answers to common questions about shopping on eShop Simplified, including orders, shipping, returns, account management, and payment methods.',
  keywords: ['faq', 'frequently asked questions', 'eshop support', 'order help', 'shipping info'],
  openGraph: {
    title: 'FAQ | eShop Simplified',
    description: 'Answers to common questions about eShop Simplified.',
    type: 'website',
    url: '/faq',
  },
  twitter: {
    card: 'summary',
    title: 'FAQ | eShop Simplified',
    description: 'Answers to common questions about eShop Simplified.',
  },
};

const faqItems = [
  {
    id: "item-1",
    question: "How do I place an order?",
    answer: "Browse our products, add desired items to your cart, and then proceed to checkout. You'll need to provide your shipping information and payment details to complete your purchase. You can choose to checkout as a guest or create an account for a faster experience on future orders.",
  },
  {
    id: "item-2",
    question: "What payment methods do you accept?",
    answer: "We accept major credit cards (Visa, Mastercard, American Express, RuPay), UPI, Net Banking, and popular digital wallets. All payments are processed through a secure payment gateway. Available methods may vary slightly based on your location and order value.",
  },
  {
    id: "item-3",
    question: "How can I track my order?",
    answer: "Once your order has been shipped, you will receive an email notification containing a tracking number and a direct link to the carrier's website. If you created an account, you can also find your order status and tracking information in your account dashboard under 'Order History'.",
  },
  {
    id: "item-4",
    question: "What is your return policy?",
    answer: "We offer a 30-day return policy for most items, provided they are in new, unused condition with all original packaging and tags intact. Some items may have different return conditions due to their nature (e.g., personal care items, digital products). Please visit our 'Shipping & Returns' page for detailed information and instructions on how to initiate a return.",
  },
  {
    id: "item-5",
    question: "How do I create an account?",
    answer: "Creating an account is simple! Click on the 'Register' or 'Account' link, usually found in the header of our website. You'll be asked to fill in basic information such as your name, email address, and a secure password. After submitting the form, you may receive a confirmation email to verify your account.",
  },
  {
    id: "item-6",
    question: "Is my personal information secure?",
    answer: "Absolutely. We prioritize the security of your personal information. Our website uses industry-standard SSL (Secure Socket Layer) encryption to protect your data during transmission. We do not store your full credit card details on our servers. For more information, please refer to our comprehensive Privacy Policy.",
  },
  {
    id: "item-7",
    question: "How long does shipping take?",
    answer: "Shipping times vary depending on your location, the shipping method selected at checkout, and product availability. Standard shipping within India typically takes 3-7 business days. Expedited shipping options may be available for faster delivery. You will see an estimated delivery timeframe during the checkout process.",
  },
  {
    id: "item-8",
    question: "Do you ship internationally?",
    answer: "Currently, eShop Simplified primarily ships to addresses within India. We are continuously working to expand our shipping capabilities. Please check our 'Shipping Information' page for the most up-to-date details on our shipping destinations.",
  },
  {
    id: "item-9",
    question: "What if I receive a damaged or incorrect item?",
    answer: "We apologize for any inconvenience. If you receive a damaged, defective, or incorrect item, please contact our customer support team within 48 hours of delivery. We will arrange for a return, replacement, or refund as appropriate. Please provide your order number and photos of the issue if possible to expedite the process."
  },
  {
    id: "item-10",
    question: "How can I change or cancel my order?",
    answer: "If you need to change or cancel your order, please contact us as soon as possible. We process orders quickly, but we'll do our best to accommodate your request if the order hasn't been shipped yet. Once an order is shipped, it cannot be canceled but can be returned according to our return policy."
  }
];

export default function FaqPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <section className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">Frequently Asked Questions</h1>
            <p className="text-lg text-muted-foreground">
              Find answers to common questions below. If you can't find what you're looking for, please don't hesitate to contact us.
            </p>
          </section>

          <section>
             <Accordion type="single" collapsible className="w-full bg-card p-4 sm:p-6 rounded-lg shadow-md border">
                 {faqItems.map((item) => (
                    <AccordionItem value={item.id} key={item.id}>
                        <AccordionTrigger className="text-left text-base md:text-lg hover:no-underline focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm">
                            {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-base text-muted-foreground leading-relaxed pt-2">
                             {item.answer}
                        </AccordionContent>
                    </AccordionItem>
                 ))}
            </Accordion>
          </section>

           <section className="mt-12 text-center bg-muted/50 p-8 rounded-lg">
                <h2 className="text-2xl font-semibold mb-3 text-foreground">Still Have Questions?</h2>
                <p className="text-muted-foreground mb-6">
                   Our dedicated support team is ready to assist you with any further inquiries.
                </p>
                <Button asChild size="lg">
                    <Link href="/contact">Contact Support</Link>
                </Button>
           </section>

        </div>
      </main>
      <Footer />
    </div>
  );
}

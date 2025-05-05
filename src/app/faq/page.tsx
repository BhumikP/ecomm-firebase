import type { Metadata } from 'next';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: 'FAQ - Frequently Asked Questions',
  description: 'Find answers to common questions about shopping on eShop Simplified, orders, shipping, returns, and your account.',
};

// Define FAQ items
const faqItems = [
  {
    id: "item-1",
    question: "How do I place an order?",
    answer: "Browse our products, add items to your cart, and proceed to checkout. You'll need to provide shipping information and payment details to complete your purchase. You can checkout as a guest or create an account for easier future orders.",
  },
  {
    id: "item-2",
    question: "What payment methods do you accept?",
    answer: "We accept major credit cards (Visa, Mastercard, American Express), PayPal, and other payment options available through our secure payment gateway. Available methods may vary based on your location.",
  },
  {
    id: "item-3",
    question: "How can I track my order?",
    answer: "Once your order is shipped, you will receive an email with a tracking number and a link to the carrier's website. You can also track your order status in your account dashboard if you created one.",
  },
  {
    id: "item-4",
    question: "What is your return policy?",
    answer: "We offer a 30-day return policy for most items in new, unused condition with original packaging. Please visit our Shipping & Returns page for detailed information and instructions on how to initiate a return.",
  },
  {
    id: "item-5",
    question: "How do I create an account?",
    answer: "Click on the 'Register' or 'Account' link in the header. Fill in the required information (name, email, password) and submit the form. You'll receive a confirmation email.",
  },
    {
    id: "item-6",
    question: "Is my personal information secure?",
    answer: "Yes, we take security seriously. We use industry-standard encryption (SSL) to protect your data during transmission. We do not store your full credit card details. Please refer to our Privacy Policy for more details.",
  },
   {
    id: "item-7",
    question: "How long does shipping take?",
    answer: "Shipping times vary depending on your location and the shipping method selected at checkout. Standard shipping usually takes 3-7 business days within the continental US. Estimated delivery times are provided during checkout.",
  },
    {
    id: "item-8",
    question: "Do you ship internationally?",
    answer: "Currently, we only ship within [Your Country/Region - e.g., the United States]. We are working on expanding our shipping options in the future.",
  },
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
              Find answers to common questions below. If you can't find what you're looking for, please contact us.
            </p>
          </section>

          <section>
             <Accordion type="single" collapsible className="w-full bg-card p-4 sm:p-6 rounded-lg shadow-md border">
                 {faqItems.map((item) => (
                    <AccordionItem value={item.id} key={item.id}>
                        <AccordionTrigger className="text-left text-base md:text-lg hover:no-underline">
                            {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-base text-muted-foreground leading-relaxed pt-2">
                             {item.answer}
                        </AccordionContent>
                    </AccordionItem>
                 ))}
            </Accordion>
          </section>

           <section className="mt-12 text-center">
                <h2 className="text-2xl font-semibold mb-3">Still Have Questions?</h2>
                <p className="text-muted-foreground mb-6">
                   Our support team is ready to help.
                </p>
                <Button asChild size="lg">
                    <a href="/contact">Contact Support</a>
                </Button>
           </section>

        </div>
      </main>
      <Footer />
    </div>
  );
}

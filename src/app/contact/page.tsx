
// src/app/contact/page.tsx
import type { Metadata } from 'next';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin } from 'lucide-react';
import { ContactForm } from '@/components/contact/contact-form';

// Metadata for SEO
export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with eShop Simplified. Send us a message or find our contact details. We are here to help with your queries.',
  keywords: ['contact us', 'support', 'customer service', 'eshop contact'],
  openGraph: {
    title: 'Contact Us | eShop Simplified',
    description: 'Reach out to eShop Simplified for support and inquiries.',
    type: 'website',
    url: '/contact',
  },
  twitter: {
    card: 'summary',
    title: 'Contact Us | eShop Simplified',
    description: 'Reach out to eShop Simplified for support and inquiries.',
  },
};

export default function ContactUsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
           <section className="text-center mb-12">
             <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">Contact Us</h1>
             <p className="text-lg text-muted-foreground">
                We'd love to hear from you! Reach out with any questions or feedback.
             </p>
           </section>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
             <Card className="shadow-lg">
               <CardHeader>
                 <CardTitle>Send Us a Message</CardTitle>
                 <CardDescription>Fill out the form below and we'll get back to you as soon as possible.</CardDescription>
               </CardHeader>
               <CardContent>
                 <ContactForm />
               </CardContent>
             </Card>

              <div className="space-y-8">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>Other ways to reach us.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                     <div className="flex items-start gap-4">
                         <div className="bg-primary/10 rounded-full p-3 mt-1 flex-shrink-0">
                            <Mail className="h-5 w-5 text-primary" />
                         </div>
                        <div>
                            <h3 className="font-semibold text-lg">Email</h3>
                            <a href="mailto:support@eshopsimplified.com" className="text-primary hover:underline break-all">
                                support@eshopsimplified.com
                            </a>
                            <p className="text-sm text-muted-foreground">For general inquiries and support</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <div className="bg-primary/10 rounded-full p-3 mt-1 flex-shrink-0">
                            <Phone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Phone</h3>
                            <a href="tel:+911234567890" className="text-primary hover:underline">
                                +91-123-456-7890
                            </a>
                            <p className="text-sm text-muted-foreground">Mon-Fri, 9am - 6pm IST</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                         <div className="bg-primary/10 rounded-full p-3 mt-1 flex-shrink-0">
                             <MapPin className="h-5 w-5 text-primary" />
                         </div>
                        <div>
                            <h3 className="font-semibold text-lg">Our Office</h3>
                            <address className="not-italic">
                                123 E-commerce Avenue,<br/>
                                Tech Park, Bangalore 560001,<br/>
                                India
                            </address>
                             <p className="text-sm text-muted-foreground">(Office visits by appointment only)</p>
                        </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

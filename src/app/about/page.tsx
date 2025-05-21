
import type { Metadata } from 'next';
// Header and Footer are client components, so this page will effectively be client-rendered
// However, for simple static content like this, if Header/Footer were server components, this could be a server component.
// For now, keeping Header/Footer as client means this page also has to be effectively client.
// If metadata needs to be truly dynamic based on server-side logic, this would need a different structure
// or this page itself would fetch data if it were dynamic.
// For a static 'About Us' page, this is acceptable.
// To use `export const metadata`, this page would ideally not import client components directly at the top level if those client components
// are not essential to the core content structure that metadata describes.
//
// UPDATE: With App Router, even if child components are client, the page itself can be server component.
// The issue is that `Header` and `Footer` are likely marked 'use client' themselves.
// So, for now, we will keep this as a Server Component and let Next.js handle the boundaries.
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Target, Lightbulb } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn more about eShop Simplified, our mission, vision, and values. We are dedicated to providing the best online shopping experience.',
  keywords: ['about us', 'company mission', 'eshop vision', 'ecommerce values'],
  openGraph: {
    title: 'About Us | eShop Simplified',
    description: 'Learn more about eShop Simplified, our mission, vision, and values.',
    type: 'website',
    url: '/about', // Assuming relative to metadataBase in layout
  },
  twitter: {
    card: 'summary',
    title: 'About Us | eShop Simplified',
    description: 'Learn more about eShop Simplified, our mission, vision, and values.',
  },
};

export default function AboutUsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <section className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">About eShop Simplified</h1>
            <p className="text-lg text-muted-foreground">
              Your partner in effortless online shopping and business growth.
            </p>
          </section>

          <section className="mb-12">
            <Card className="overflow-hidden shadow-lg">
               <div className="relative w-full h-64 md:h-80">
                 <Image
                    src="https://placehold.co/1000x400.png" // Updated to placehold.co
                    alt="Our dedicated team working collaboratively in a modern office environment"
                    layout="fill"
                    objectFit="cover"
                    className="bg-muted"
                    data-ai-hint="team collaboration office work"
                 />
              </div>
              <CardContent className="p-6 md:p-8">
                <p className="text-base md:text-lg leading-relaxed">
                  Welcome to eShop Simplified! We started with a simple idea: to make online shopping and selling accessible and straightforward for everyone. Whether you're a small business looking to reach new customers or a shopper searching for great products, we aim to provide a platform that's intuitive, reliable, and efficient.
                </p>
                <p className="mt-4 text-base md:text-lg leading-relaxed">
                  Our platform combines essential e-commerce features with user-friendly design, ensuring a smooth experience from browsing to checkout. We believe in empowering businesses and delighting customers through technology, fostering a community built on trust and innovation.
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="grid md:grid-cols-3 gap-8 mb-12 text-center">
            <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out">
              <CardHeader>
                 <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-3">
                   <Target className="h-8 w-8 text-primary" />
                 </div>
                <CardTitle className="text-xl">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To simplify the complexities of e-commerce, providing powerful yet easy-to-use tools for businesses and a seamless shopping experience for customers.
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out">
              <CardHeader>
                 <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-3">
                    <Lightbulb className="h-8 w-8 text-primary" />
                 </div>
                <CardTitle className="text-xl">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To be the leading e-commerce solution for small and medium-sized businesses, fostering growth and connection in the digital marketplace.
                </p>
              </CardContent>
            </Card>
             <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out">
              <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-3">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                <CardTitle className="text-xl">Our Values</CardTitle>
              </CardHeader>
              <CardContent>
                 <ul className="text-muted-foreground list-none space-y-1">
                     <li>Simplicity</li>
                     <li>Reliability</li>
                     <li>Customer Focus</li>
                     <li>Innovation</li>
                     <li>Integrity</li>
                 </ul>
              </CardContent>
            </Card>
          </section>

          {/* Optional: Add team section or more details */}
           {/* <section className="text-center">
              <h2 className="text-3xl font-bold mb-6">Meet the Team</h2>
              </div>
            </section> */}

        </div>
      </main>
      <Footer />
    </div>
  );
}

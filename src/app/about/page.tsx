import type { Metadata } from 'next';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Target, Lightbulb } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn more about eShop Simplified, our mission, vision, and values.',
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
               <div className="relative w-full h-64">
                 <Image
                    src="https://picsum.photos/1000/400?random=about1"
                    alt="Team working together"
                    layout="fill"
                    objectFit="cover"
                    className="bg-muted"
                    data-ai-hint="team collaboration office work"
                 />
              </div>
              <CardContent className="p-6 md:p-8">
                <p className="text-base leading-relaxed">
                  Welcome to eShop Simplified! We started with a simple idea: to make online shopping and selling accessible and straightforward for everyone. Whether you're a small business looking to reach new customers or a shopper searching for great products, we aim to provide a platform that's intuitive, reliable, and efficient.
                </p>
                <p className="mt-4 text-base leading-relaxed">
                  Our platform combines essential e-commerce features with user-friendly design, ensuring a smooth experience from browsing to checkout. We believe in empowering businesses and delighting customers through technology.
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="grid md:grid-cols-3 gap-8 mb-12 text-center">
            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                 <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-3">
                   <Target className="h-8 w-8 text-primary" />
                 </div>
                <CardTitle>Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To simplify the complexities of e-commerce, providing powerful yet easy-to-use tools for businesses and a seamless shopping experience for customers.
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                 <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-3">
                    <Lightbulb className="h-8 w-8 text-primary" />
                 </div>
                <CardTitle>Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To be the leading e-commerce solution for small and medium-sized businesses, fostering growth and connection in the digital marketplace.
                </p>
              </CardContent>
            </Card>
             <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-3">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                <CardTitle>Our Values</CardTitle>
              </CardHeader>
              <CardContent>
                 <ul className="text-muted-foreground list-none space-y-1">
                     <li>Simplicity</li>
                     <li>Reliability</li>
                     <li>Customer Focus</li>
                     <li>Innovation</li>
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

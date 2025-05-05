'use client';

import type { Metadata } from 'next'; // Can still use Metadata type for reference
import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Mail, Phone, MapPin } from 'lucide-react';

// Client-side metadata setting (workaround)
if (typeof window !== 'undefined') {
    document.title = 'Contact Us | eShop Simplified';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
        metaDescription.setAttribute('content', 'Get in touch with eShop Simplified. Send us a message or find our contact details.');
    }
}


const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }).max(500, { message: "Message cannot exceed 500 characters." }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactUsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Message Sent!",
          description: "Thank you for contacting us. We'll get back to you soon.",
        });
        form.reset(); // Reset form fields on success
      } else {
         throw new Error(result.message || "Failed to send message.");
      }
    } catch (error: any) {
       console.error("Contact form submission error:", error);
      toast({
        variant: "destructive",
        title: "Error Sending Message",
        description: error.message || "An unexpected error occurred. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

          <div className="grid md:grid-cols-2 gap-12 items-start">
             {/* Contact Form Section */}
             <Card className="shadow-lg">
               <CardHeader>
                 <CardTitle>Send Us a Message</CardTitle>
                 <CardDescription>Fill out the form below and we'll get back to you.</CardDescription>
               </CardHeader>
               <CardContent>
                 <Form {...form}>
                   <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                     <FormField
                       control={form.control}
                       name="name"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Name</FormLabel>
                           <FormControl>
                             <Input placeholder="Your Name" {...field} disabled={isLoading} />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                     <FormField
                       control={form.control}
                       name="email"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Email</FormLabel>
                           <FormControl>
                             <Input type="email" placeholder="your.email@example.com" {...field} disabled={isLoading} />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                     <FormField
                       control={form.control}
                       name="subject"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Subject</FormLabel>
                           <FormControl>
                             <Input placeholder="Regarding..." {...field} disabled={isLoading} />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                     <FormField
                       control={form.control}
                       name="message"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Message</FormLabel>
                           <FormControl>
                             <Textarea placeholder="Your message here..." className="min-h-[120px]" {...field} disabled={isLoading} />
                           </FormControl>
                            <FormMessage />
                         </FormItem>
                       )}
                     />
                     <Button type="submit" className="w-full" disabled={isLoading}>
                       {isLoading ? (
                         <>
                           <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                         </>
                       ) : (
                         'Send Message'
                       )}
                     </Button>
                   </form>
                 </Form>
               </CardContent>
             </Card>

              {/* Contact Information Section */}
              <div className="space-y-8">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>Other ways to reach us.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div className="flex items-start gap-4">
                         <div className="bg-primary/10 rounded-full p-2 mt-1">
                            <Mail className="h-5 w-5 text-primary" />
                         </div>
                        <div>
                            <h3 className="font-semibold">Email</h3>
                            <a href="mailto:support@eshopsimplified.com" className="text-primary hover:underline">
                                support@eshopsimplified.com
                            </a>
                            <p className="text-sm text-muted-foreground">For general inquiries and support</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <div className="bg-primary/10 rounded-full p-2 mt-1">
                            <Phone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Phone</h3>
                            <a href="tel:+1234567890" className="text-primary hover:underline">
                                +1 (234) 567-890
                            </a>
                            <p className="text-sm text-muted-foreground">Mon-Fri, 9am - 5pm EST</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                         <div className="bg-primary/10 rounded-full p-2 mt-1">
                             <MapPin className="h-5 w-5 text-primary" />
                         </div>
                        <div>
                            <h3 className="font-semibold">Address</h3>
                            <p>123 E-commerce St,<br/> Shopping City, SC 98765,<br/> USA</p>
                             <p className="text-sm text-muted-foreground">(Office visits by appointment only)</p>
                        </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Optional: Map Embed */}
                {/* <Card>
                  <CardContent className="p-0">
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                       [Map Placeholder - e.g., Google Maps Embed]
                    </div>
                  </CardContent>
                </Card> */}
              </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

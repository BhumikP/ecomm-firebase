
'use client';

// import type { Metadata } from 'next'; // Not used directly in client components for export
import { useState, useEffect } from 'react'; // Added useEffect
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
// Label from form is preferred over direct ui/label
// import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Mail, Phone, MapPin } from 'lucide-react';


// Client-side metadata setting (useEffect for dynamic title based on component state or props)
// For static titles in client components, it's often simpler to manage via a layout or specific hook if many pages need it.
// Next.js 13+ App Router generally prefers `generateMetadata` for server components.
// This is a client component due to react-hook-form and useState.
useEffect(() => {
    document.title = 'Contact Us | eShop Simplified';
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Get in touch with eShop Simplified. Send us a message or find our contact details. We are here to help with your queries.');
     // It's good practice to also set OpenGraph and Twitter titles/descriptions if possible client-side,
     // but these are more effectively handled by server-side metadata for crawlers.
}, []);


const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(100, { message: "Name cannot exceed 100 characters."}),
  email: z.string().email({ message: "Please enter a valid email address." }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters." }).max(150, { message: "Subject cannot exceed 150 characters."}),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }).max(1000, { message: "Message cannot exceed 1000 characters." }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactUsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    mode: "onTouched", // Validate on blur/change after first touch
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
        form.reset();
      } else {
         // Enhance error message display
         const apiErrors = result.errors ? Object.values(result.errors).flat().join(', ') : '';
         throw new Error(result.message || "Failed to send message." + (apiErrors ? ` Details: ${apiErrors}` : ''));
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

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
             <Card className="shadow-lg">
               <CardHeader>
                 <CardTitle>Send Us a Message</CardTitle>
                 <CardDescription>Fill out the form below and we'll get back to you as soon as possible.</CardDescription>
               </CardHeader>
               <CardContent>
                 <Form {...form}>
                   <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                     <FormField
                       control={form.control}
                       name="name"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Full Name</FormLabel>
                           <FormControl>
                             <Input placeholder="e.g., Jane Doe" {...field} disabled={isLoading} aria-required="true" />
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
                           <FormLabel>Email Address</FormLabel>
                           <FormControl>
                             <Input type="email" placeholder="e.g., you@example.com" {...field} disabled={isLoading} aria-required="true" />
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
                             <Input placeholder="e.g., Question about an order" {...field} disabled={isLoading} aria-required="true" />
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
                             <Textarea placeholder="Please type your message here..." className="min-h-[120px] resize-y" {...field} disabled={isLoading} aria-required="true" />
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

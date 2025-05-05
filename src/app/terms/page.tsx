import type { Metadata } from 'next';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description: 'Read the terms and conditions for using the eShop Simplified website and services.',
};

export default function TermsAndConditionsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto prose prose-lg lg:prose-xl dark:prose-invert prose-headings:text-primary prose-a:text-primary hover:prose-a:text-primary/80">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Terms and Conditions</h1>
          <p className="text-sm text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>

          <p>
            Welcome to eShop Simplified! These terms and conditions outline the rules and regulations for the use of eShop Simplified's Website, located at [Your Website URL].
          </p>

          <p>
            By accessing this website we assume you accept these terms and conditions. Do not continue to use eShop Simplified if you do not agree to take all of the terms and conditions stated on this page.
          </p>

          <h2>1. Definitions</h2>
          <p>
            The following terminology applies to these Terms and Conditions, Privacy Statement and Disclaimer Notice and all Agreements: "Client", "You" and "Your" refers to you, the person log on this website and compliant to the Company’s terms and conditions. "The Company", "Ourselves", "We", "Our" and "Us", refers to our Company. "Party", "Parties", or "Us", refers to both the Client and ourselves.
          </p>

          <h2>2. Use of the Website</h2>
          <ul>
            <li>You must be at least 18 years old to use this website or place orders.</li>
            <li>You agree to use the website only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the website.</li>
            <li>You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer.</li>
          </ul>

          <h2>3. Products and Orders</h2>
          <ul>
            <li>All orders placed through the website are subject to availability and acceptance by us.</li>
            <li>We reserve the right to refuse or cancel any order for any reason, including limitations on quantities available for purchase, inaccuracies, or errors in product or pricing information.</li>
            <li>Product prices are subject to change without notice.</li>
            <li>We have made every effort to display as accurately as possible the colors and images of our products. We cannot guarantee that your computer monitor's display of any color will be accurate.</li>
          </ul>

          <h2>4. Intellectual Property</h2>
          <p>
            The content, layout, design, data, databases and graphics on this website are protected by intellectual property laws and are owned by eShop Simplified or its licensors. Unless expressly permitted in writing, you may not copy, distribute, redistribute, republish, or otherwise make the materials on this website available to anyone else.
          </p>

          <h2>5. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by applicable law, eShop Simplified shall not be liable for any indirect, incidental, special, consequential or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from (a) your access to or use of or inability to access or use the service; (b) any conduct or content of any third party on the service; (c) any content obtained from the service; and (d) unauthorized access, use or alteration of your transmissions or content.
          </p>

          <h2>6. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of [Your State/Country] and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
          </p>

          <h2>7. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
          </p>

          <h2>8. Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us via our <a href="/contact">contact page</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

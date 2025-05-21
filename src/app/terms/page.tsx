
import type { Metadata } from 'next';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import Link from 'next/link'; // Import Link

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description: 'Read the terms and conditions for using the eShop Simplified website and services. By using our site, you agree to these terms.',
  keywords: ['terms and conditions', 'terms of service', 'legal', 'eshop rules', 'user agreement'],
  openGraph: {
    title: 'Terms and Conditions | eShop Simplified',
    description: 'Our terms and conditions for service usage.',
    type: 'article',
    url: '/terms',
  },
  twitter: {
    card: 'summary',
    title: 'Terms and Conditions | eShop Simplified',
    description: 'Our terms and conditions for service usage.',
  },
};

export default function TermsAndConditionsPage() {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const websiteUrl = process.env.NEXT_PUBLIC_BASE_URL || '[Your Website URL]'; // Ensure this env var is set
  const companyName = 'eShop Simplified';
  const governingLawJurisdiction = 'Bangalore, Karnataka, India'; // Example Jurisdiction

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto prose prose-base md:prose-lg dark:prose-invert prose-headings:text-primary prose-a:text-primary hover:prose-a:text-primary/80">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Terms and Conditions</h1>
          <p className="text-sm text-muted-foreground">Last Updated: {currentDate}</p>

          <p>
            Welcome to {companyName}! These terms and conditions outline the rules and regulations for the use of {companyName}'s Website, located at <Link href={websiteUrl} className="break-all">{websiteUrl}</Link>.
          </p>

          <p>
            By accessing this website we assume you accept these terms and conditions. Do not continue to use {companyName} if you do not agree to take all of the terms and conditions stated on this page.
          </p>

          <h2>1. Definitions</h2>
          <p>
            The following terminology applies to these Terms and Conditions, Privacy Statement and Disclaimer Notice and all Agreements: "Client", "You" and "Your" refers to you, the person log on this website and compliant to the Company’s terms and conditions. "The Company", "Ourselves", "We", "Our" and "Us", refers to our Company, {companyName}. "Party", "Parties", or "Us", refers to both the Client and ourselves. All terms refer to the offer, acceptance and consideration of payment necessary to undertake the process of our assistance to the Client in the most appropriate manner for the express purpose of meeting the Client’s needs in respect of provision of the Company’s stated services, in accordance with and subject to, prevailing law of {governingLawJurisdiction}.
          </p>

          <h2>2. Use of the Website</h2>
          <ul>
            <li>You must be at least 18 years of age or accessing the site under the supervision of a parent or legal guardian.</li>
            <li>You agree to use the website only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the website. Prohibited behavior includes harassing or causing distress or inconvenience to any other user, transmitting obscene or offensive content or disrupting the normal flow of dialogue within our website.</li>
            <li>You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer or device, and you agree to accept responsibility for all activities that occur under your account or password.</li>
          </ul>

          <h2>3. Products and Orders</h2>
          <ul>
            <li>All products listed on the Website are subject to availability, and we cannot guarantee that items will be in stock. We reserve the right to discontinue any product at any time for any reason.</li>
            <li>All orders placed through the website are subject to acceptance by us. We may, in our sole discretion, refuse or cancel any order for any reason, including but not limited to: limitations on quantities available for purchase, inaccuracies or errors in product or pricing information, or problems identified by our credit and fraud avoidance department.</li>
            <li>Prices for our products are subject to change without notice. We reserve the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time.</li>
            <li>We have made every effort to display as accurately as possible the colors and images of our products that appear at the store. We cannot guarantee that your computer monitor's display of any color will be accurate.</li>
          </ul>

          <h2>4. Intellectual Property Rights</h2>
          <p>
            Unless otherwise stated, {companyName} and/or its licensors own the intellectual property rights for all material on {companyName}. All intellectual property rights are reserved. You may access this from {companyName} for your own personal use subjected to restrictions set in these terms and conditions.
          </p>
          <p>You must not:</p>
          <ul>
            <li>Republish material from {companyName}</li>
            <li>Sell, rent or sub-license material from {companyName}</li>
            <li>Reproduce, duplicate or copy material from {companyName}</li>
            <li>Redistribute content from {companyName}</li>
          </ul>
          <p>This Agreement shall begin on the date hereof.</p>

          <h2>5. User Comments, Feedback and Other Submissions</h2>
          <p>If, at our request, you send certain specific submissions (for example contest entries) or without a request from us you send creative ideas, suggestions, proposals, plans, or other materials, whether online, by email, by postal mail, or otherwise (collectively, 'comments'), you agree that we may, at any time, without restriction, edit, copy, publish, distribute, translate and otherwise use in any medium any comments that you forward to us. We are and shall be under no obligation (1) to maintain any comments in confidence; (2) to pay compensation for any comments; or (3) to respond to any comments.</p>


          <h2>6. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by applicable law, {companyName} shall not be liable for any indirect, incidental, special, consequential or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from (a) your access to or use of or inability to access or use the Service; (b) any conduct or content of any third party on the Service; (c) any content obtained from the Service; and (d) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage, and even if a remedy set forth herein is found to have failed of its essential purpose.
          </p>

          <h2>7. Indemnification</h2>
          <p>You agree to indemnify, defend and hold harmless {companyName} and our parent, subsidiaries, affiliates, partners, officers, directors, agents, contractors, licensors, service providers, subcontractors, suppliers, interns and employees, harmless from any claim or demand, including reasonable attorneys’ fees, made by any third-party due to or arising out of your breach of these Terms and Conditions or the documents they incorporate by reference, or your violation of any law or the rights of a third-party.</p>

          <h2>8. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of {governingLawJurisdiction} and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
          </p>

          <h2>9. Changes to Terms and Conditions</h2>
          <p>
            We reserve the right, at our sole discretion, to update, change or replace any part of these Terms and Conditions by posting updates and changes to our website. It is your responsibility to check our website periodically for changes. Your continued use of or access to our website or the Service following the posting of any changes to these Terms and Conditions constitutes acceptance of those changes.
          </p>

          <h2>10. Contact Information</h2>
          <p>
            Questions about the Terms and Conditions should be sent to us via our <Link href="/contact">contact page</Link> or by emailing us at legal@eshopsimplified.com.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

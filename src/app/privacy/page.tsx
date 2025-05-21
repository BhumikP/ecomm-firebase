
import type { Metadata } from 'next';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Understand how eShop Simplified collects, uses, and protects your personal information. We are committed to safeguarding your privacy.',
  keywords: ['privacy policy', 'data protection', 'user data', 'information security', 'eshop privacy'],
   openGraph: {
    title: 'Privacy Policy | eShop Simplified',
    description: 'Our commitment to your privacy at eShop Simplified.',
    type: 'article', // More specific than 'website' for policy pages
    url: '/privacy',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy | eShop Simplified',
    description: 'Our commitment to your privacy at eShop Simplified.',
  },
};

export default function PrivacyPolicyPage() {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const websiteUrl = process.env.NEXT_PUBLIC_BASE_URL || '[Your Website URL]';
  const companyName = 'eShop Simplified';
  const contactEmail = 'privacy@eshopsimplified.com'; // Example email

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto prose prose-base md:prose-lg dark:prose-invert prose-headings:text-primary prose-a:text-primary hover:prose-a:text-primary/80">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last Updated: {currentDate}</p>

          <p>
            {companyName} ("us", "we", or "our") operates the <Link href={websiteUrl} className="break-all">{websiteUrl}</Link> website (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
          </p>

          <p>
            We use your data to provide and improve the Service. By using the Service, you agree to the collection and use of information in accordance with this policy. Unless otherwise defined in this Privacy Policy, terms used in this Privacy Policy have the same meanings as in our Terms and Conditions, accessible from <Link href="/terms">{websiteUrl}/terms</Link>.
          </p>

          <h2>Information Collection and Use</h2>
          <p>
            We collect several different types of information for various purposes to provide and improve our Service to you.
          </p>

          <h3>Types of Data Collected</h3>
          <h4>Personal Data</h4>
          <p>
            While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). Personally identifiable information may include, but is not limited to:
          </p>
          <ul>
            <li>Email address</li>
            <li>First name and last name</li>
            <li>Phone number</li>
            <li>Address, State, Province, ZIP/Postal code, City, Country</li>
            <li>Order history and preferences</li>
            <li>Cookies and Usage Data</li>
          </ul>

          <h4>Usage Data</h4>
          <p>
            We may also collect information on how the Service is accessed and used ("Usage Data"). This Usage Data may include information such as your computer's Internet Protocol address (e.g., IP address), browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, unique device identifiers, and other diagnostic data.
          </p>

          <h4>Tracking & Cookies Data</h4>
          <p>
            We use cookies and similar tracking technologies (e.g., pixels, beacons) to track the activity on our Service and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier. Cookies are sent to your browser from a website and stored on your device.
          </p>
          <p>
            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
          </p>
          <p>Examples of Cookies we use:</p>
          <ul>
            <li><strong>Session Cookies:</strong> We use Session Cookies to operate our Service.</li>
            <li><strong>Preference Cookies:</strong> We use Preference Cookies to remember your preferences and various settings.</li>
            <li><strong>Security Cookies:</strong> We use Security Cookies for security purposes.</li>
            <li><strong>Analytics Cookies:</strong> We use Analytics Cookies to understand how our Service is used.</li>
          </ul>


          <h2>Use of Data</h2>
          <p>{companyName} uses the collected data for various purposes:</p>
          <ul>
            <li>To provide and maintain our Service</li>
            <li>To notify you about changes to our Service</li>
            <li>To allow you to participate in interactive features of our Service when you choose to do so</li>
            <li>To provide customer support</li>
            <li>To gather analysis or valuable information so that we can improve our Service</li>
            <li>To monitor the usage of our Service</li>
            <li>To detect, prevent and address technical issues</li>
            <li>To process your orders, manage your account, and handle payments</li>
            <li>To personalize your experience and recommend products</li>
            <li>To send you marketing and promotional communications (with your consent, where required)</li>
          </ul>

          <h2>Legal Basis for Processing Personal Data (EEA/UK Users)</h2>
          <p>If you are from the European Economic Area (EEA) or the United Kingdom (UK), {companyName}'s legal basis for collecting and using the personal information described in this Privacy Policy depends on the Personal Data we collect and the specific context in which we collect it. We may process your Personal Data because:</p>
          <ul>
            <li>We need to perform a contract with you (e.g., to process your order)</li>
            <li>You have given us permission to do so</li>
            <li>The processing is in our legitimate interests and it's not overridden by your rights</li>
            <li>For payment processing purposes</li>
            <li>To comply with the law</li>
          </ul>

          <h2>Data Retention</h2>
          <p>
            {companyName} will retain your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your Personal Data to the extent necessary to comply with our legal obligations (for example, if we are required to retain your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies.
          </p>


          <h2>Security of Data</h2>
          <p>
            The security of your data is important to us. We strive to use commercially acceptable means to protect your Personal Data, such as SSL encryption for data transmission and secure server environments. However, remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we aim to protect your Personal Data, we cannot guarantee its absolute security.
          </p>

          <h2>Your Data Protection Rights</h2>
          <p>
            {companyName} aims to take reasonable steps to allow you to correct, amend, delete, or limit the use of your Personal Data. Depending on your location and applicable laws (such as GDPR for EEA/UK residents or CCPA for California residents), you may have the following data protection rights:
          </p>
          <ul>
            <li><strong>The right to access, update or delete</strong> the information we have on you.</li>
            <li><strong>The right of rectification.</strong></li>
            <li><strong>The right to object.</strong></li>
            <li><strong>The right of restriction.</strong></li>
            <li><strong>The right to data portability.</strong></li>
            <li><strong>The right to withdraw consent.</strong></li>
          </ul>
          <p>Please contact us at <a href={`mailto:${contactEmail}`}>{contactEmail}</a> to exercise these rights. We may ask you to verify your identity before responding to such requests.</p>

          <h2>Service Providers</h2>
          <p>We may employ third-party companies and individuals to facilitate our Service ("Service Providers"), provide the Service on our behalf, perform Service-related services, or assist us in analyzing how our Service is used. These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose (e.g., payment processors, shipping companies, analytics providers).</p>


          <h2>Children's Privacy</h2>
          <p>Our Service does not address anyone under the age of 18 ("Children"). We do not knowingly collect personally identifiable information from anyone under the age of 18. If you are a parent or guardian and you are aware that your Child has provided us with Personal Data, please contact us. If we become aware that we have collected Personal Data from children without verification of parental consent, we take steps to remove that information from our servers.</p>


          <h2>Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <ul>
            <li>By email: <a href={`mailto:${contactEmail}`}>{contactEmail}</a></li>
            <li>By visiting this page on our website: <Link href="/contact">{websiteUrl}/contact</Link></li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}

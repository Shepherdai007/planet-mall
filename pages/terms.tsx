// pages/terms.tsx
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";

export default function TermsPage() {
  return (
    <>
      <Head><title>Terms of Service — Planet Mall</title></Head>
      <Layout>
        <div className="min-h-screen bg-void pt-20 pb-24 px-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-rust text-xs font-dm-sans uppercase tracking-[0.2em] mb-3">Legal</p>
            <h1 className="font-syne font-bold text-4xl text-paper mb-2">Terms of Service</h1>
            <p className="text-muted font-dm-sans text-sm mb-12">Last updated: June 2026</p>

            {[
              {
                title: "1. Acceptance of Terms",
                body: `By accessing or using Planet Mall ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform. These terms apply to all users including buyers, sellers, and visitors.`,
              },
              {
                title: "2. Description of Service",
                body: `Planet Mall is an AI-powered online marketplace that enables sellers to open stores and buyers to discover and purchase products globally. The Platform includes features such as livestream shopping, AI store building tools, classifieds, food ordering, and real-time messaging.`,
              },
              {
                title: "3. User Accounts",
                body: `You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your login credentials. You must be at least 18 years old to use the Platform. Planet Mall reserves the right to suspend or terminate accounts that violate these terms.`,
              },
              {
                title: "4. Seller Responsibilities",
                body: `Sellers are responsible for the accuracy of their product listings, pricing, and descriptions. Sellers must fulfill orders in a timely manner and communicate honestly with buyers. Sellers may not list prohibited items including counterfeit goods, illegal substances, weapons, or items that violate intellectual property rights.`,
              },
              {
                title: "5. Buyer Responsibilities",
                body: `Buyers agree to pay for items they purchase. Buyers must provide accurate shipping information. Disputes between buyers and sellers should first be resolved through the Platform's messaging system. Planet Mall offers escrow protection on eligible transactions.`,
              },
              {
                title: "6. Payments & Fees",
                body: `All payments are processed securely through Stripe. Subscription fees (Free, Premium at CA$8/month, Business at CA$10/month) are charged in Canadian dollars. Classifieds listings incur a CA$1 fee. Subscription fees are non-refundable except as required by law. You may cancel your subscription at any time.`,
              },
              {
                title: "7. Prohibited Conduct",
                body: `Users may not use the Platform for fraudulent activities, spam, harassment, or any illegal purpose. You may not attempt to reverse engineer, scrape, or disrupt the Platform. Any misuse may result in immediate account termination.`,
              },
              {
                title: "8. Intellectual Property",
                body: `All content on the Platform including logos, designs, and software is owned by Planet Mall or its licensors. Users retain ownership of content they upload but grant Planet Mall a license to display and distribute it on the Platform.`,
              },
              {
                title: "9. Limitation of Liability",
                body: `Planet Mall is not liable for any indirect, incidental, or consequential damages arising from your use of the Platform. We do not guarantee uninterrupted service. Our total liability to you shall not exceed the fees you paid in the past 12 months.`,
              },
              {
                title: "10. Changes to Terms",
                body: `Planet Mall reserves the right to modify these terms at any time. We will notify users of significant changes via email or platform notification. Continued use of the Platform after changes constitutes acceptance of the new terms.`,
              },
              {
                title: "11. Contact",
                body: `For questions about these terms, contact us at support@planetmallshop.com or via WhatsApp at +1 (647) 852-1007.`,
              },
            ].map(({ title, body }) => (
              <div key={title} className="mb-8">
                <h2 className="font-syne font-bold text-lg text-paper mb-3">{title}</h2>
                <p className="font-dm-sans text-muted text-sm leading-relaxed">{body}</p>
              </div>
            ))}

            <div className="mt-12 pt-8 border-t border-white/[0.06] flex gap-6 text-xs text-muted font-dm-sans">
              <Link href="/privacy" className="hover:text-paper transition-colors">Privacy Policy</Link>
              <Link href="/contact" className="hover:text-paper transition-colors">Contact Us</Link>
              <Link href="/" className="hover:text-paper transition-colors">Back to Home</Link>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

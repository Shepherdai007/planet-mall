// pages/privacy.tsx
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";

export default function PrivacyPage() {
  return (
    <>
      <Head><title>Privacy Policy — Planet Mall</title></Head>
      <Layout>
        <div className="min-h-screen bg-void pt-20 pb-24 px-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-rust text-xs font-dm-sans uppercase tracking-[0.2em] mb-3">Legal</p>
            <h1 className="font-syne font-bold text-4xl text-paper mb-2">Privacy Policy</h1>
            <p className="text-muted font-dm-sans text-sm mb-12">Last updated: June 2026</p>

            {[
              {
                title: "1. Information We Collect",
                body: `We collect information you provide when creating an account (name, email, role), information from transactions (purchase history, payment details processed by Stripe), usage data (pages visited, features used), and communications through our messaging system. We do not store full payment card details — these are handled securely by Stripe.`,
              },
              {
                title: "2. How We Use Your Information",
                body: `We use your information to provide and improve the Platform, process transactions, send order updates and service notifications, provide customer support, personalize your experience using AI features, and comply with legal obligations. We do not sell your personal information to third parties.`,
              },
              {
                title: "3. Information Sharing",
                body: `We share your information with Stripe for payment processing, Firebase/Google for authentication and data storage, Agora for livestream functionality, and Anthropic's Claude AI for AI-powered features. We may also share information when required by law or to protect our rights.`,
              },
              {
                title: "4. Data Storage & Security",
                body: `Your data is stored securely using Google Firebase infrastructure. We implement industry-standard security measures including encryption in transit and at rest. However, no method of transmission over the internet is 100% secure.`,
              },
              {
                title: "5. Cookies",
                body: `We use cookies and similar technologies to maintain your session, remember your preferences, and analyze Platform usage. You can control cookies through your browser settings, though disabling them may affect Platform functionality.`,
              },
              {
                title: "6. Your Rights",
                body: `You have the right to access, correct, or delete your personal data. You may request a copy of your data or ask us to delete your account by contacting support@planetmallshop.com. We will respond to requests within 30 days.`,
              },
              {
                title: "7. Children's Privacy",
                body: `Planet Mall is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.`,
              },
              {
                title: "8. Third-Party Links",
                body: `The Platform may contain links to third-party websites. We are not responsible for the privacy practices of those sites. We encourage you to review their privacy policies before providing any personal information.`,
              },
              {
                title: "9. Changes to This Policy",
                body: `We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a notice on the Platform. Your continued use of the Platform after changes constitutes acceptance of the updated policy.`,
              },
              {
                title: "10. Contact Us",
                body: `If you have questions about this Privacy Policy or how we handle your data, contact us at support@planetmallshop.com or via WhatsApp at +1 (647) 852-1007.`,
              },
            ].map(({ title, body }) => (
              <div key={title} className="mb-8">
                <h2 className="font-syne font-bold text-lg text-paper mb-3">{title}</h2>
                <p className="font-dm-sans text-muted text-sm leading-relaxed">{body}</p>
              </div>
            ))}

            <div className="mt-12 pt-8 border-t border-white/[0.06] flex gap-6 text-xs text-muted font-dm-sans">
              <Link href="/terms" className="hover:text-paper transition-colors">Terms of Service</Link>
              <Link href="/contact" className="hover:text-paper transition-colors">Contact Us</Link>
              <Link href="/" className="hover:text-paper transition-colors">Back to Home</Link>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

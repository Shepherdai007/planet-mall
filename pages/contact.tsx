// pages/contact.tsx
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";

export default function ContactPage() {
  return (
    <>
      <Head><title>Contact Us — Planet Mall</title></Head>
      <Layout>
        <div className="min-h-screen bg-void pt-20 pb-24 px-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-rust text-xs font-dm-sans uppercase tracking-[0.2em] mb-3">Get in touch</p>
            <h1 className="font-syne font-bold text-4xl text-paper mb-4">Contact Us</h1>
            <p className="text-muted font-dm-sans text-sm mb-14 leading-relaxed">
              We're here to help. Reach out through any of the channels below and we'll get back to you as soon as possible.
            </p>

            <div className="grid sm:grid-cols-2 gap-5 mb-14">
              {/* WhatsApp 1 */}
              <a href="https://wa.me/16478521007" target="_blank" rel="noopener noreferrer"
                className="p-6 rounded-2xl border border-white/[0.06] hover:border-green-500/30 hover:bg-green-500/5 transition-all group"
                style={{background:"rgba(255,255,255,0.02)"}}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{background:"rgba(37,211,102,0.15)"}}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#25D166" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                </div>
                <p className="font-syne font-semibold text-paper mb-1">WhatsApp Support</p>
                <p className="text-sm text-muted font-dm-sans mb-3">+1 (647) 852-1007</p>
                <span className="text-xs text-green-400 font-dm-sans">Chat on WhatsApp →</span>
              </a>

              {/* WhatsApp 2 */}
              <a href="https://wa.me/14168547313" target="_blank" rel="noopener noreferrer"
                className="p-6 rounded-2xl border border-white/[0.06] hover:border-green-500/30 hover:bg-green-500/5 transition-all group"
                style={{background:"rgba(255,255,255,0.02)"}}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{background:"rgba(37,211,102,0.15)"}}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#25D166" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                </div>
                <p className="font-syne font-semibold text-paper mb-1">WhatsApp (Alt)</p>
                <p className="text-sm text-muted font-dm-sans mb-3">+1 (416) 854-7313</p>
                <span className="text-xs text-green-400 font-dm-sans">Chat on WhatsApp →</span>
              </a>

              {/* Email */}
              <a href="mailto:support@planetmallshop.com"
                className="p-6 rounded-2xl border border-white/[0.06] hover:border-rust/30 hover:bg-rust/5 transition-all"
                style={{background:"rgba(255,255,255,0.02)"}}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{background:"rgba(196,83,26,0.15)"}}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="#C4531A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <p className="font-syne font-semibold text-paper mb-1">Email Support</p>
                <p className="text-sm text-muted font-dm-sans mb-3">support@planetmallshop.com</p>
                <span className="text-xs text-rust font-dm-sans">Send an email →</span>
              </a>

              {/* Social */}
              <div className="p-6 rounded-2xl border border-white/[0.06]" style={{background:"rgba(255,255,255,0.02)"}}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{background:"rgba(196,83,26,0.15)"}}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="#C4531A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <p className="font-syne font-semibold text-paper mb-1">Social Media</p>
                <p className="text-sm text-muted font-dm-sans mb-3">Reach us on any platform</p>
                <div className="flex gap-3">
                  <a href="https://facebook.com/profile.php?id=61590324584360" target="_blank" rel="noopener noreferrer" className="text-xs text-rust font-dm-sans hover:underline">Facebook</a>
                  <a href="https://instagram.com/planetmallshop" target="_blank" rel="noopener noreferrer" className="text-xs text-rust font-dm-sans hover:underline">Instagram</a>
                  <a href="https://x.com/planetmallshop" target="_blank" rel="noopener noreferrer" className="text-xs text-rust font-dm-sans hover:underline">X</a>
                </div>
              </div>
            </div>

            {/* FAQ teaser */}
            <div className="p-6 rounded-2xl border border-white/[0.06]" style={{background:"rgba(255,255,255,0.02)"}}>
              <h2 className="font-syne font-bold text-xl text-paper mb-2">Before you reach out</h2>
              <p className="text-sm text-muted font-dm-sans mb-4">Check our pricing page for answers about subscriptions, payments, and features.</p>
              <Link href="/pricing" className="inline-block px-4 py-2 bg-rust text-white text-sm font-dm-sans font-semibold rounded-full hover:bg-rust/90 transition-all">
                View Pricing & FAQ →
              </Link>
            </div>

            <div className="mt-12 pt-8 border-t border-white/[0.06] flex gap-6 text-xs text-muted font-dm-sans">
              <Link href="/terms" className="hover:text-paper transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-paper transition-colors">Privacy Policy</Link>
              <Link href="/" className="hover:text-paper transition-colors">Back to Home</Link>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

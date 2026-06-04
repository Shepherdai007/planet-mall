// pages/trust.tsx
// ─── TRUST & SAFETY CENTER ───────────────────────────────────────
// Explains how Planet Mall protects buyers and sellers.
// Covers: buyer protection, payment security, how to report scams,
//         dispute process, seller verification, safety tips.

import Head   from "next/head";
import Link   from "next/link";
import Layout from "@/components/Layout";
import ReportButton from "@/components/ReportButton";

export default function TrustPage() {
  return (
    <>
      <Head>
        <title>Trust & Safety — Planet Mall</title>
        <meta name="description" content="How Planet Mall protects buyers and sellers. Report scams, understand buyer protection, and learn about our secure payment system." />
      </Head>
      <Layout>
        <div className="min-h-screen bg-void pt-16 pb-24 px-4">
          <div className="max-w-3xl mx-auto">

            {/* Header */}
            <div className="text-center mb-16">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{background:"rgba(42,107,69,0.15)"}}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2A6B45" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h1 className="font-syne font-bold text-4xl sm:text-5xl text-paper mb-4">Trust & Safety</h1>
              <p className="text-muted font-dm-sans text-lg max-w-xl mx-auto leading-relaxed">
                Planet Mall is built to be safe for everyone. Here's exactly how we protect you.
              </p>
            </div>

            <div className="space-y-6">

              {/* Buyer Protection */}
              <Section
                icon="🛡"
                title="Planet Mall Buyer Protection"
                color="#2A6B45"
              >
                <p className="text-muted font-dm-sans text-sm leading-relaxed mb-4">
                  Every purchase made through Planet Mall is covered by our Buyer Protection program. If something goes wrong, we've got you.
                </p>
                <ul className="space-y-3">
                  {[
                    { title: "Item not received", desc: "If your order never arrives, you're entitled to a full refund. Open a dispute within 30 days of your expected delivery date." },
                    { title: "Item not as described", desc: "If what you receive is significantly different from what was advertised, you can return it for a full refund." },
                    { title: "Unauthorized payment", desc: "If you didn't make a purchase but see a charge, contact us immediately at planetmallhg@gmail.com." },
                    { title: "30-day dispute window", desc: "You have 30 days from the delivery date (or expected delivery date if not received) to open a dispute." },
                  ].map(({title,desc}) => (
                    <li key={title} className="flex gap-3">
                      <span className="text-green flex-shrink-0 mt-0.5 font-bold">✓</span>
                      <div>
                        <p className="font-dm-sans font-semibold text-sm text-paper">{title}</p>
                        <p className="font-dm-sans text-xs text-muted mt-0.5 leading-relaxed">{desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Section>

              {/* Payment Security */}
              <Section icon="🔒" title="Secure Payments via Stripe" color="#C4531A">
                <p className="text-muted font-dm-sans text-sm leading-relaxed mb-4">
                  All payments on Planet Mall are processed by <strong className="text-paper">Stripe</strong> — the same payment infrastructure used by Amazon, Google, and millions of businesses worldwide.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon:"🔐", title:"256-bit SSL encryption", desc:"Your card details are never stored on Planet Mall servers." },
                    { icon:"🏦", title:"Bank-level security", desc:"Stripe is PCI DSS Level 1 certified — the highest level of payment security." },
                    { icon:"💳", title:"All major cards accepted", desc:"Visa, Mastercard, Amex, and more. Prices in Canadian dollars (CAD)." },
                    { icon:"🚫", title:"Never pay outside Planet Mall", desc:"If a seller asks you to pay via e-transfer, cash app, or crypto — that is a scam. Report them immediately." },
                  ].map(({icon,title,desc}) => (
                    <div key={title} className="p-4 rounded-xl" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                      <p className="text-2xl mb-2">{icon}</p>
                      <p className="font-dm-sans font-semibold text-sm text-paper mb-1">{title}</p>
                      <p className="font-dm-sans text-xs text-muted leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 rounded-xl" style={{background:"rgba(196,83,26,0.08)",border:"1px solid rgba(196,83,26,0.2)"}}>
                  <p className="font-dm-sans font-semibold text-sm mb-1" style={{color:"#C4531A"}}>
                    ⚠️ Important: Only pay through Planet Mall checkout
                  </p>
                  <p className="font-dm-sans text-xs leading-relaxed" style={{color:"rgba(196,83,26,0.8)"}}>
                    Legitimate Planet Mall sellers never ask for payment outside of our platform. Any seller requesting payment via PayPal friends & family, e-transfer, Western Union, cryptocurrency, or gift cards is attempting fraud. Report them immediately using the button below.
                  </p>
                </div>
              </Section>

              {/* How to spot a scam */}
              <Section icon="🚨" title="How to Spot a Scam" color="#D4A84B">
                <p className="text-muted font-dm-sans text-sm leading-relaxed mb-4">
                  Here are the warning signs that a seller may not be legitimate:
                </p>
                <ul className="space-y-3">
                  {[
                    "Price is significantly below market value (too good to be true)",
                    "Seller asks you to pay outside Planet Mall",
                    "Seller pressures you to buy quickly or says 'offer expires soon'",
                    "Product photos look like they're taken from other websites",
                    "Seller has no reviews or very new account",
                    "Seller asks for your personal information via chat",
                    "Seller claims to ship from a different country than listed",
                    "Communication feels automated or copy-pasted",
                  ].map(item => (
                    <li key={item} className="flex gap-3 text-sm font-dm-sans" style={{color:"rgba(242,237,228,0.7)"}}>
                      <span className="flex-shrink-0" style={{color:"#D4A84B"}}>•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </Section>

              {/* How to Report */}
              <Section icon="📢" title="How to Report a Problem" color="#C4531A">
                <p className="text-muted font-dm-sans text-sm leading-relaxed mb-6">
                  If you believe you've encountered fraud, a scammer, or any safety issue, report it immediately. We investigate all reports within 24 hours.
                </p>

                <div className="space-y-4">
                  {[
                    { step:"1", title:"Report on the platform", desc:"Use the Report button on any product page, shop page, or livestream. Select the reason and describe what happened." },
                    { step:"2", title:"Contact us directly", desc:"Email planetmallhg@gmail.com with your order number and details. Include screenshots if you have them." },
                    { step:"3", title:"Open a dispute", desc:"Go to your Orders page → find the order → click 'Open dispute'. This freezes the seller's payout until resolved." },
                    { step:"4", title:"Contact your bank if needed", desc:"For serious fraud, contact your card issuer to initiate a chargeback. Stripe's buyer protection also applies." },
                  ].map(({step,title,desc}) => (
                    <div key={step} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-syne font-bold text-sm flex-shrink-0 mt-0.5"
                        style={{background:"rgba(196,83,26,0.15)",color:"#C4531A"}}>
                        {step}
                      </div>
                      <div>
                        <p className="font-dm-sans font-semibold text-sm text-paper">{title}</p>
                        <p className="font-dm-sans text-xs text-muted mt-0.5 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick report button */}
                <div className="mt-6 p-4 rounded-2xl text-center" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                  <p className="text-sm font-dm-sans text-paper mb-3">Report a seller, product, or issue directly:</p>
                  <div className="flex justify-center">
                    <Link href="mailto:planetmallhg@gmail.com"
                      className="px-6 py-2.5 rounded-xl text-white text-sm font-dm-sans font-semibold"
                      style={{background:"#C4531A"}}>
                      📧 Email planetmallhg@gmail.com
                    </Link>
                  </div>
                </div>
              </Section>

              {/* Dispute Process */}
              <Section icon="⚖️" title="Dispute Resolution Process" color="#8A8480">
                <p className="text-muted font-dm-sans text-sm leading-relaxed mb-4">
                  When you open a dispute, here's exactly what happens:
                </p>
                <div className="space-y-4">
                  {[
                    { time:"Immediately",   action:"Seller's payout is frozen until dispute is resolved" },
                    { time:"Within 2 hrs",  action:"You receive a confirmation email with your case number" },
                    { time:"Within 24 hrs", action:"Planet Mall team reviews the case and contacts both parties" },
                    { time:"Within 48 hrs", action:"Decision is made — refund issued or case dismissed" },
                    { time:"Within 5 days", action:"Refund appears in your account (depending on your bank)" },
                  ].map(({time,action}) => (
                    <div key={time} className="flex gap-4 items-start">
                      <span className="text-xs font-dm-sans font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                        style={{background:"rgba(255,255,255,0.06)",color:"#8A8480",minWidth:"90px",textAlign:"center"}}>
                        {time}
                      </span>
                      <p className="text-sm font-dm-sans text-paper/80">{action}</p>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Seller Verification */}
              <Section icon="✅" title="Seller Verification" color="#2A6B45">
                <p className="text-muted font-dm-sans text-sm leading-relaxed mb-4">
                  Planet Mall verifies sellers to ensure platform quality. Look for these trust indicators:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { badge:"✓ Verified",   color:"#2A6B45", desc:"Identity verified by Planet Mall team" },
                    { badge:"⭐ Top Seller", color:"#D4A84B", desc:"4.8+ rating with 50+ completed orders" },
                    { badge:"🔰 Premium",    color:"#C4531A", desc:"Paid subscriber — committed to the platform" },
                  ].map(({badge,color,desc}) => (
                    <div key={badge} className="p-4 rounded-xl text-center" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                      <p className="font-dm-sans font-bold text-sm mb-2" style={{color}}>{badge}</p>
                      <p className="font-dm-sans text-xs text-muted">{desc}</p>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Safety tips */}
              <Section icon="💡" title="Quick Safety Tips" color="#D4A84B">
                <ul className="space-y-2.5">
                  {[
                    "Always buy through Planet Mall checkout — never pay directly",
                    "Check seller reviews before purchasing",
                    "Read the return and shipping policy carefully",
                    "Screenshot your order confirmation and tracking info",
                    "If a deal seems too good to be true, it probably is",
                    "Never share your password or payment details in chat",
                    "Report suspicious sellers immediately — you protect other buyers too",
                  ].map(tip => (
                    <li key={tip} className="flex gap-3 text-sm font-dm-sans" style={{color:"rgba(242,237,228,0.75)"}}>
                      <span style={{color:"#D4A84B"}} className="flex-shrink-0">✦</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </Section>

              {/* Contact */}
              <div className="text-center py-10">
                <p className="font-syne font-bold text-2xl text-paper mb-3">Still have a concern?</p>
                <p className="text-muted font-dm-sans mb-6">Our safety team is available 7 days a week.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="mailto:planetmallhg@gmail.com"
                    className="px-8 py-3.5 rounded-xl text-white font-dm-sans font-semibold"
                    style={{background:"#C4531A"}}>
                    📧 planetmallhg@gmail.com
                  </Link>
                  <Link href="/explore"
                    className="px-8 py-3.5 rounded-xl font-dm-sans font-medium border border-white/10 text-muted hover:text-paper transition-colors">
                    Back to shopping
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

function Section({ icon, title, color, children }: {
  icon: string; title: string; color: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{border:"1px solid rgba(255,255,255,0.06)"}}>
      <div className="px-6 py-4 flex items-center gap-3" style={{background:"rgba(255,255,255,0.02)"}}>
        <span className="text-2xl">{icon}</span>
        <h2 className="font-syne font-bold text-xl text-paper">{title}</h2>
      </div>
      <div className="px-6 py-6" style={{background:"rgba(255,255,255,0.01)"}}>
        {children}
      </div>
    </div>
  );
}

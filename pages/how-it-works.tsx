// pages/how-it-works.tsx
// ─── HOW PLANET MALL WORKS ───────────────────────────────────────
// Explains the escrow system to both buyers and sellers.
// Linked from onboarding, checkout, and seller dashboard.

import Head   from "next/head";
import Link   from "next/link";
import Layout from "@/components/Layout";

export default function HowItWorksPage() {
  return (
    <>
      <Head>
        <title>How It Works — Planet Mall</title>
        <meta name="description" content="How Planet Mall's secure escrow payment system protects both buyers and sellers." />
      </Head>
      <Layout>
        <div className="min-h-screen bg-void pt-16 pb-24 px-4">
          <div className="max-w-3xl mx-auto">

            {/* Header */}
            <div className="text-center mb-16">
              <h1 className="font-syne font-bold text-4xl sm:text-5xl text-paper mb-4">
                How Planet Mall Works
              </h1>
              <p className="text-muted font-dm-sans text-lg">
                Secure for buyers. Fair for sellers. Protected by Planet Mall.
              </p>
            </div>

            {/* FOR BUYERS */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <span className="text-3xl">🛍</span>
                <h2 className="font-syne font-bold text-2xl text-paper">For Buyers</h2>
              </div>

              <div className="space-y-4">
                {[
                  {
                    step: "1",
                    title: "Browse and add to cart",
                    desc: "Find products from verified sellers worldwide. All prices in CAD.",
                    color: "#C4531A",
                  },
                  {
                    step: "2",
                    title: "Pay securely through Planet Mall",
                    desc: "Your payment is processed by Stripe (bank-level security). Your money goes to Planet Mall — NOT directly to the seller yet.",
                    color: "#C4531A",
                    highlight: true,
                  },
                  {
                    step: "3",
                    title: "Planet Mall holds your payment (Escrow)",
                    desc: "Your money is held safely by Planet Mall until you confirm you received your item. The seller cannot access it yet. This protects you completely.",
                    color: "#D4A84B",
                    highlight: true,
                  },
                  {
                    step: "4",
                    title: "Seller ships your order",
                    desc: "The seller ships your item and marks it as shipped. You'll see tracking information on your orders page.",
                    color: "#8A8480",
                  },
                  {
                    step: "5",
                    title: "You confirm delivery",
                    desc: "Once you receive your item, click 'I received my item' on your Orders page. This releases payment to the seller.",
                    color: "#2A6B45",
                    highlight: true,
                  },
                  {
                    step: "6",
                    title: "Problem? Open a dispute",
                    desc: "If your item doesn't arrive or isn't as described, open a dispute BEFORE confirming delivery. Your payment stays frozen while we investigate. We resolve all disputes within 48 hours.",
                    color: "#C4531A",
                    highlight: true,
                  },
                  {
                    step: "7",
                    title: "Auto-release after 14 days",
                    desc: "If you don't confirm or dispute within 14 days of shipping, payment is automatically released to the seller. Make sure to check your orders.",
                    color: "#8A8480",
                  },
                ].map(({step,title,desc,color,highlight}) => (
                  <div key={step} className="flex gap-4 p-5 rounded-2xl transition-all"
                    style={{
                      background: highlight ? `${color}08` : "rgba(255,255,255,0.02)",
                      border: `1px solid ${highlight ? `${color}20` : "rgba(255,255,255,0.06)"}`,
                    }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-syne font-bold text-sm flex-shrink-0 mt-0.5"
                      style={{background:`${color}20`,color}}>
                      {step}
                    </div>
                    <div>
                      <p className="font-dm-sans font-semibold text-sm text-paper mb-1">{title}</p>
                      <p className="font-dm-sans text-xs text-muted leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FOR SELLERS */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <span className="text-3xl">🏪</span>
                <h2 className="font-syne font-bold text-2xl text-paper">For Sellers</h2>
              </div>

              <div className="space-y-4">
                {[
                  {
                    step: "1",
                    title: "Open your store",
                    desc: "Create your store, add products, and go live. Free tier allows 1 product. Premium unlocks unlimited products and AI tools.",
                    color: "#C4531A",
                  },
                  {
                    step: "2",
                    title: "Buyer places an order",
                    desc: "You receive an order notification. The buyer's payment is held in escrow by Planet Mall — it's secured and guaranteed.",
                    color: "#2A6B45",
                  },
                  {
                    step: "3",
                    title: "Ship the item promptly",
                    desc: "Ship within your stated timeframe. Mark the order as 'Shipped' and add tracking info in your seller dashboard. Late shipping damages your seller rating.",
                    color: "#D4A84B",
                    highlight: true,
                  },
                  {
                    step: "4",
                    title: "Buyer confirms receipt",
                    desc: "Once the buyer confirms delivery, Planet Mall releases your payment minus our commission. You'll receive a notification immediately.",
                    color: "#2A6B45",
                    highlight: true,
                  },
                  {
                    step: "5",
                    title: "Auto-release after 14 days",
                    desc: "If the buyer doesn't respond within 14 days of you marking the order shipped, payment is automatically released to you.",
                    color: "#8A8480",
                  },
                  {
                    step: "6",
                    title: "Commission structure",
                    desc: "Planet Mall deducts a commission before releasing your payment: Free sellers pay 15%, Premium sellers pay 8%, Business sellers pay 5%. Upgrade to keep more of what you earn.",
                    color: "#C4531A",
                    highlight: true,
                  },
                  {
                    step: "7",
                    title: "If a dispute is opened",
                    desc: "Your payment is frozen until Planet Mall resolves the case. Respond to all dispute inquiries within 24 hours. Sellers who ship fraudulent items are permanently banned and reported.",
                    color: "#C4531A",
                    highlight: true,
                  },
                ].map(({step,title,desc,color,highlight}) => (
                  <div key={step} className="flex gap-4 p-5 rounded-2xl"
                    style={{
                      background: highlight ? `${color}08` : "rgba(255,255,255,0.02)",
                      border: `1px solid ${highlight ? `${color}20` : "rgba(255,255,255,0.06)"}`,
                    }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-syne font-bold text-sm flex-shrink-0 mt-0.5"
                      style={{background:`${color}20`,color}}>
                      {step}
                    </div>
                    <div>
                      <p className="font-dm-sans font-semibold text-sm text-paper mb-1">{title}</p>
                      <p className="font-dm-sans text-xs text-muted leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Commission table */}
            <div className="rounded-2xl overflow-hidden mb-16" style={{border:"1px solid rgba(255,255,255,0.08)"}}>
              <div className="px-6 py-4" style={{background:"rgba(255,255,255,0.03)",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                <h2 className="font-syne font-bold text-xl text-paper">Commission Rates</h2>
                <p className="text-xs text-muted font-dm-sans mt-1">Deducted before payment is released to you</p>
              </div>
              <table className="w-full text-sm font-dm-sans">
                <thead>
                  <tr style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                    {["Plan","Commission","Monthly fee","You keep on CA$100 sale"].map(h=>(
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    {plan:"Free",     commission:"15%", fee:"CA$0",     keep:"CA$85",  color:"#8A8480"},
                    {plan:"Premium",  commission:"8%",  fee:"CA$9.99",  keep:"CA$92",  color:"#C4531A"},
                    {plan:"Business", commission:"5%",  fee:"CA$29.99", keep:"CA$95",  color:"#D4A84B"},
                  ].map(({plan,commission,fee,keep,color})=>(
                    <tr key={plan} style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                      <td className="px-6 py-4 font-semibold" style={{color}}>{plan}</td>
                      <td className="px-6 py-4 text-paper">{commission}</td>
                      <td className="px-6 py-4 text-muted">{fee}</td>
                      <td className="px-6 py-4 font-semibold" style={{color:"#2A6B45"}}>{keep}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CTA */}
            <div className="text-center">
              <p className="font-syne font-bold text-2xl text-paper mb-3">Ready to get started?</p>
              <p className="text-muted font-dm-sans mb-8">Planet Mall protects everyone. Shop or sell with confidence.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup?role=seller"
                  className="px-8 py-3.5 rounded-xl text-white font-dm-sans font-semibold"
                  style={{background:"#C4531A"}}>
                  Open your store
                </Link>
                <Link href="/explore"
                  className="px-8 py-3.5 rounded-xl font-dm-sans font-medium border border-white/10 text-muted hover:text-paper transition-colors">
                  Start shopping
                </Link>
              </div>
              <p className="text-xs text-muted font-dm-sans mt-6">
                Questions? <Link href="/trust" className="text-rust hover:underline">Visit our Trust & Safety center</Link> or email safety@planetmall.com
              </p>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

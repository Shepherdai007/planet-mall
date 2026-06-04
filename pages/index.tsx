// pages/index.tsx
// ─── PLANET MALL — LANDING PAGE (PHASE 1) ──────────────────────
// Design: dark futuristic, space-inspired
// Fonts: Syne (display) + DM Sans (body)
// Colors: void bg, rust accent, gold premium, cream text

import Head          from "next/head";
import Link          from "next/link";
import { useEffect, useState } from "react";
import Layout        from "@/components/Layout";
import { useAuth }   from "@/context/AuthContext";

// ── Animated counter hook ─────────────────────────────────────────
function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

// ── Live ticker items ─────────────────────────────────────────────
const TICKER_ITEMS = [
  "◆ 12,400+ sellers live",
  "◆ Powered by Stripe — all major cards accepted",
  "◆ AI Store Builder for Premium",
  "◆ Livestream shopping now live",
  "◆ Sell anywhere · Ship everywhere",
  "◆ The world's market, in your pocket",
  "◆ Prices in CAD · Global reach",
];

export default function LandingPage() {
  const { isLoggedIn, isSeller } = useAuth();
  const sellers  = useCounter(12400);
  const products = useCounter(89000);
  const countries = useCounter(14);

  return (
    <>
      <Head>
        <title>Planet Mall — The world's market, in your pocket</title>
        <meta
          name="description"
          content="AI-powered virtual shopping mall for the world. Open a store, sell live, grow with AI. Open a store, sell live, grow with AI."
        />
      </Head>

      <Layout>
        {/* ── Grain overlay on root ───────────────────────────── */}
        <div className="grain">

          {/* ── Live ticker ──────────────────────────────────── */}
          <div className="bg-rust/10 border-b border-rust/20 overflow-hidden">
            <div className="flex animate-ticker whitespace-nowrap py-2 text-xs font-dm-sans text-rust/80 tracking-wide">
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                <span key={i} className="mx-8">{item}</span>
              ))}
            </div>
          </div>

          {/* ── HERO ─────────────────────────────────────────── */}
          <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">

            {/* Background grid */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: "linear-gradient(var(--color-paper) 1px, transparent 1px), linear-gradient(90deg, var(--color-paper) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }}
            />

            {/* Radial glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rust/5 rounded-full blur-3xl pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 text-center max-w-5xl mx-auto">

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-dm-sans text-muted mb-8 animate-fade-in">
                <span className="w-1.5 h-1.5 bg-green rounded-full animate-pulse-dot" />
                AI-powered shopping mall for the world
              </div>

              {/* Headline */}
              <h1
                className="font-syne font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-paper leading-[0.95] tracking-tight mb-6 animate-slide-up"
                style={{ animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}
              >
                The world's{" "}
                <span className="text-rust">market</span>,<br />
                in your pocket.
              </h1>

              {/* Subheading */}
              <p
                className="text-lg sm:text-xl text-muted font-dm-sans max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up"
                style={{ animationDelay: "0.2s", opacity: 0, animationFillMode: "forwards" }}
              >
                Open a store in minutes. Sell live to your audience.
                Let AI build your brand, write your products, and grow your revenue.
              </p>

              {/* CTAs */}
              <div
                className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up"
                style={{ animationDelay: "0.3s", opacity: 0, animationFillMode: "forwards" }}
              >
                {isLoggedIn ? (
                  <>
                    <Link
                      href={isSeller ? "/seller/dashboard" : "/explore"}
                      className="px-8 py-4 bg-rust text-white font-dm-sans font-semibold rounded-full hover:bg-rust/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isSeller ? "Go to Dashboard" : "Start Shopping"}
                    </Link>
                    <Link
                      href="/explore"
                      className="px-8 py-4 border border-white/15 text-paper font-dm-sans font-medium rounded-full hover:border-white/30 transition-all hover:bg-white/5"
                    >
                      Explore Marketplace
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/signup?role=seller"
                      className="px-8 py-4 bg-rust text-white font-dm-sans font-semibold rounded-full hover:bg-rust/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Open your store — free
                    </Link>
                    <Link
                      href="/explore"
                      className="px-8 py-4 border border-white/15 text-paper font-dm-sans font-medium rounded-full hover:border-white/30 transition-all hover:bg-white/5"
                    >
                      Explore Marketplace
                    </Link>
                  </>
                )}
              </div>

              {/* Social proof */}
              <p className="mt-6 text-xs text-muted/60 font-dm-sans animate-fade-in" style={{ animationDelay: "0.5s" }}>
                No credit card required · Free tier forever
              </p>
            </div>

            {/* ── Stats row ──────────────────────────────────── */}
            <div
              className="relative z-10 mt-20 grid grid-cols-3 gap-8 max-w-2xl w-full mx-auto text-center animate-slide-up"
              style={{ animationDelay: "0.4s", opacity: 0, animationFillMode: "forwards" }}
            >
              {[
                { value: sellers.toLocaleString() + "+", label: "Active sellers" },
                { value: products.toLocaleString() + "+", label: "Products listed" },
                { value: countries + "+",                 label: "Countries" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="font-syne font-bold text-3xl sm:text-4xl text-paper">{value}</p>
                  <p className="text-xs text-muted font-dm-sans mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted/40">
              <span className="text-[10px] font-dm-sans uppercase tracking-widest">Scroll</span>
              <div className="w-px h-8 bg-gradient-to-b from-muted/40 to-transparent" />
            </div>
          </section>

          {/* ── FEATURES ──────────────────────────────────────── */}
          <section className="py-32 px-4 max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <p className="text-rust text-xs font-dm-sans uppercase tracking-[0.2em] mb-4">Why Planet Mall</p>
              <h2 className="font-syne font-bold text-4xl sm:text-5xl text-paper leading-tight">
                One platform.<br />Every tool you need.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className="group p-8 bg-white/[0.03] border border-white/[0.06] rounded-2xl hover:border-rust/20 hover:bg-white/[0.05] transition-all"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="text-3xl mb-5">{f.icon}</div>
                  <h3 className="font-syne font-semibold text-lg text-paper mb-3">{f.title}</h3>
                  <p className="text-sm text-muted font-dm-sans leading-relaxed">{f.description}</p>
                  {f.badge && (
                    <span className="inline-block mt-4 px-2.5 py-1 bg-gold/10 text-gold text-xs font-semibold rounded-full">
                      {f.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ── AI SECTION ────────────────────────────────────── */}
          <section className="py-32 px-4 border-y border-white/[0.06] bg-white/[0.01]">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <div>
                  <p className="text-gold text-xs font-dm-sans uppercase tracking-[0.2em] mb-4">Planet Mall AI</p>
                  <h2 className="font-syne font-bold text-4xl text-paper leading-tight mb-6">
                    Your silent business partner, always working.
                  </h2>
                  <p className="text-muted font-dm-sans text-base leading-relaxed mb-8">
                    Claude AI is embedded in the DNA of Planet Mall. It doesn't just power features —
                    it acts proactively. Monitors your store, writes your copy, replies to customers,
                    and delivers weekly business insights.
                  </p>
                  <Link
                    href="/auth/signup?plan=premium"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gold/10 border border-gold/30 text-gold text-sm font-dm-sans font-semibold rounded-full hover:bg-gold/20 transition-all"
                  >
                    Unlock AI features
                    <span>→</span>
                  </Link>
                </div>

                <div className="space-y-3">
                  {AI_FEATURES.map((f) => (
                    <div key={f} className="flex items-start gap-3 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                      <span className="text-gold mt-0.5">✦</span>
                      <span className="text-sm font-dm-sans text-paper/80">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── PRICING ───────────────────────────────────────── */}
          <section className="py-32 px-4 max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-rust text-xs font-dm-sans uppercase tracking-[0.2em] mb-4">Simple pricing</p>
              <h2 className="font-syne font-bold text-4xl sm:text-5xl text-paper">
                Start free. Scale when ready.
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative p-8 rounded-2xl border transition-all ${
                    plan.featured
                      ? "bg-rust/5 border-rust/40 ring-1 ring-rust/20"
                      : "bg-white/[0.03] border-white/[0.06]"
                  }`}
                >
                  {plan.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-rust text-white text-xs font-bold rounded-full">
                      Most Popular
                    </span>
                  )}
                  <p className="font-syne font-bold text-xl text-paper mb-1">{plan.name}</p>
                  <p className="text-3xl font-syne font-bold text-paper mb-1">
                    {plan.price}
                    {plan.period && <span className="text-sm text-muted font-normal">/{plan.period}</span>}
                  </p>
                  <p className="text-xs text-muted font-dm-sans mb-6">{plan.subtitle}</p>
                  <ul className="space-y-2.5 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm font-dm-sans text-paper/70">
                        <span className="text-green mt-0.5 shrink-0">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/auth/signup?plan=${plan.id}`}
                    className={`block text-center py-3 rounded-full text-sm font-dm-sans font-semibold transition-all ${
                      plan.featured
                        ? "bg-rust text-white hover:bg-rust/90"
                        : "border border-white/15 text-paper hover:border-white/30 hover:bg-white/5"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* ── FINAL CTA ─────────────────────────────────────── */}
          <section className="py-32 px-4 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="font-syne font-bold text-4xl sm:text-5xl text-paper mb-6 leading-tight">
                Ready to open your store?
              </h2>
              <p className="text-muted font-dm-sans mb-10">
                Join thousands of sellers already growing on Planet Mall.
              </p>
              <Link
                href="/auth/signup"
                className="inline-block px-10 py-4 bg-rust text-white font-dm-sans font-semibold text-lg rounded-full hover:bg-rust/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Get started for free →
              </Link>
            </div>
          </section>

          {/* ── FOOTER ────────────────────────────────────────── */}
          <footer className="border-t border-white/[0.06] py-12 px-4">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.jpg" alt="Planet Mall" className="w-8 h-8 rounded-lg object-cover" />
                <span className="font-syne font-bold text-paper">Planet Mall</span>
              </div>
              <p className="text-xs text-muted font-dm-sans">
                © {new Date().getFullYear()} Planet Mall. The world's market, in your pocket.
              </p>
              <div className="flex gap-6 text-xs text-muted font-dm-sans">
                <Link href="/how-it-works" className="hover:text-paper transition-colors">How It Works</Link>
                <Link href="/terms"        className="hover:text-paper transition-colors">Terms</Link>
                <Link href="/privacy"      className="hover:text-paper transition-colors">Privacy</Link>
                <Link href="/trust"        className="hover:text-paper transition-colors">Trust & Safety</Link>
                <Link href="/contact"      className="hover:text-paper transition-colors">Contact</Link>
              </div>
            </div>
          </footer>

        </div>
      </Layout>
    </>
  );
}

// ── Static data ────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: "🏪",
    title: "Open a store in minutes",
    description: "Create your shop with a name, logo, and products. Go live immediately — no technical knowledge needed.",
  },
  {
    icon: "🤖",
    title: "AI Store Builder",
    description: "Describe your business in plain English. Claude builds your entire store: name, tagline, products, policies, colors.",
    badge: "Premium",
  },
  {
    icon: "📡",
    title: "Livestream shopping",
    description: "Broadcast live, pin products to your stream, and let viewers buy in real time. Market energy, straight to screens.",
  },
  {
    icon: "💬",
    title: "Real-time buyer-seller chat",
    description: "Direct messaging with product sharing. Share a product card right in the chat — buyers see price, image, and buy button.",
  },
  {
    icon: "💳",
    title: "Global payments via Stripe",
    description: "Accept any major credit or debit card worldwide. Prices in CAD — fast, secure, and trusted by millions.",
  },
  {
    icon: "📊",
    title: "AI business insights",
    description: "Weekly plain-English reports from Claude. Revenue trends, top products, what to improve — no spreadsheet needed.",
    badge: "Premium",
  },
];

const AI_FEATURES = [
  "AI builds your store from a single sentence prompt",
  "Writes product descriptions that sell",
  "Monitors inventory and drafts low-stock alerts automatically",
  "Replies to customer questions in your tone and voice",
  "Delivers weekly business performance reports",
  "Suggests edits when a product has zero orders after 7 days",
];

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "CA$0",
    period: null,
    subtitle: "Forever — no credit card",
    featured: false,
    cta: "Start free",
    features: [
      "Open a store",
      "Up to 10 products",
      "Real-time messaging",
      "Standard checkout",
      "1 active livestream",
      "Basic analytics",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "CA$14.99",
    period: "month",
    subtitle: "or CA$129/year (save 25%)",
    featured: true,
    cta: "Start Premium",
    features: [
      "Everything in Free",
      "AI Store Builder",
      "AI product descriptions",
      "AI business insights",
      "AI customer support bot",
      "Unlimited products",
      "Custom domain",
      "Remove Planet Mall branding",
      "Multiple staff accounts",
      "Featured placement",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: "CA$39.99",
    period: "month",
    subtitle: "For serious scale",
    featured: false,
    cta: "Go Business",
    features: [
      "Everything in Premium",
      "Bulk CSV product import",
      "API access",
      "Dedicated account manager",
      "Custom AI brand voice",
      "Multi-warehouse inventory",
      "Team permissions",
    ],
  },
];

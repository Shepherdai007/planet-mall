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
  "◆ 25+ sellers live",
  "◆ Powered by Stripe — all major cards accepted",
  "◆ AI Store Builder for Premium",
  "◆ Livestream shopping now live",
  "◆ Sell anywhere · Ship everywhere",
  "◆ The world's market, in your pocket",
  "◆ Prices in CAD · Global reach",
];

export default function LandingPage() {
  const { isLoggedIn, isSeller, isPremium, isBusiness } = useAuth();
  const sellers  = useCounter(25);
  const products = useCounter(120);
  const countries = useCounter(5);

  return (
    <>
      <Head>
        <title>Planet Mall — The world's market, in your pocket</title>
        <meta name="google-site-verification" content="opSysJ_v6Vw3YOkzY6WZwRc0doBGMT-pJH-1VpfYDSM" />
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

            {/* ── Video background ─────────────────────────────── */}
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={{zIndex:0}}
            >
              <source src="/hero.mp4" type="video/mp4" />
            </video>

            {/* Dark overlay so text is readable */}
            <div className="absolute inset-0" style={{background:"rgba(10,9,8,0.65)",zIndex:1}} />

            {/* Subtle radial glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rust/10 rounded-full blur-3xl pointer-events-none" style={{zIndex:1}} />

            {/* Content */}
            <div className="relative text-center max-w-5xl mx-auto" style={{zIndex:2}}>

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

          {/* ── VIDEO SHOWCASE ────────────────────────────────── */}
          <section className="py-16 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-10">
                <p className="text-rust text-xs font-dm-sans uppercase tracking-[0.2em] mb-3">Shop everything</p>
                <h2 className="font-syne font-bold text-3xl sm:text-4xl text-paper">
                  One marketplace. Every category.
                </h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { video:"/vid-phones.mp4",   label:"Phones & Electronics", href:"/explore",      emoji:"📱" },
                  { video:"/vid-cars.mp4",      label:"Cars & Vehicles",      href:"/classifieds",  emoji:"🚗" },
                  { video:"/vid-shoes.mp4",     label:"Shoes & Fashion",      href:"/explore",      emoji:"👟" },
                  { video:"/vid-shopping.mp4",  label:"Shop Everything",      href:"/explore",      emoji:"🛍" },
                ].map(({video,label,href,emoji}) => (
                  <a key={label} href={href}
                    className="relative rounded-2xl overflow-hidden group cursor-pointer block"
                    style={{height:"280px"}}>
                    <video autoPlay muted loop playsInline
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">
                      <source src={video} type="video/mp4" />
                    </video>
                    {/* Gradient overlay */}
                    <div className="absolute inset-0"
                      style={{background:"linear-gradient(to top, rgba(10,9,8,0.85) 0%, rgba(10,9,8,0.2) 50%, transparent 100%)"}} />
                    {/* Label */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-xl mb-1">{emoji}</p>
                      <p className="font-syne font-bold text-paper text-sm leading-tight">{label}</p>
                      <p className="text-xs text-muted font-dm-sans mt-0.5 group-hover:text-rust transition-colors">
                        Shop now →
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>

          {/* ── PROMO VIDEO GRID ──────────────────────────────── */}
          <section className="py-16 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-10">
                <p className="text-rust text-xs font-dm-sans uppercase tracking-[0.2em] mb-3">Real sellers. Real products.</p>
                <h2 className="font-syne font-bold text-3xl sm:text-4xl text-paper">
                  See what's selling on Planet Mall
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  { src: "/promo-1.mp4" },
                  { src: "/promo-2.mp4" },
                  { src: "/promo-3.mp4" },
                  { src: "/promo-4.mp4" },
                  { src: "/promo-5.mp4" },
                  { src: "/promo-6.mp4" },
                  { src: "/promo-7.mp4" },
                ].map(({ src }, i) => (
                  <div
                    key={i}
                    className={`relative rounded-2xl overflow-hidden group ${
                      i === 0 ? "col-span-2 row-span-2" : ""
                    }`}
                    style={{ height: i === 0 ? "480px" : "230px" }}
                  >
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    >
                      <source src={src} type="video/mp4" />
                    </video>
                    {/* Gradient overlay */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: "linear-gradient(to top, rgba(10,9,8,0.8) 0%, transparent 60%)" }}
                    />
                    {/* Hover CTA */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <a
                        href="/explore"
                        className="inline-block px-4 py-2 bg-rust text-white text-xs font-dm-sans font-semibold rounded-full hover:bg-rust/90 transition-all"
                      >
                        Shop now →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
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
              {PLANS.map((plan) => {
                const isCurrentPlan =
                  (plan.id === "free" && !isPremium && !isBusiness) ||
                  (plan.id === "premium" && isPremium && !isBusiness) ||
                  (plan.id === "business" && isBusiness);
                return (
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
                    {isCurrentPlan && (
                      <span className="absolute -top-3 right-6 px-3 py-1 text-white text-xs font-bold rounded-full"
                        style={{background:"#2A6B45"}}>
                        Current plan
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
                      href="/pricing"
                      className={`block text-center py-3 rounded-full text-sm font-dm-sans font-semibold transition-all ${
                        isCurrentPlan
                          ? "border border-white/10 text-green cursor-default"
                          : plan.featured
                            ? "bg-rust text-white hover:bg-rust/90"
                            : "border border-white/15 text-paper hover:border-white/30 hover:bg-white/5"
                      }`}
                    >
                      {isCurrentPlan ? "✓ Current plan" : plan.cta}
                    </Link>
                  </div>
                );
              })}
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

          {/* ── APP DOWNLOAD ──────────────────────────────────── */}
          <section className="py-20 px-4">
            <div className="max-w-4xl mx-auto rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8"
              style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
              <div>
                <p className="text-rust text-xs font-dm-sans uppercase tracking-[0.2em] mb-3">Mobile app</p>
                <h2 className="font-syne font-bold text-3xl sm:text-4xl text-paper mb-3">
                  Shop on the go
                </h2>
                <p className="text-muted font-dm-sans text-sm leading-relaxed max-w-sm">
                  The Planet Mall app is coming soon. Buy, sell, and go live from anywhere. Get notified when we launch!
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                {/* Google Play — mock */}
                <a href="#" onClick={e => { e.preventDefault(); }}
                  className="flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all hover:scale-105"
                  style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)"}}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12.954 11.557L3.27 1.292A2 2 0 015 1l10.166 5.873-2.212 4.684z"/>
                    <path fill="#FBBC05" d="M21.784 10.336l-2.582-1.49-2.396 2.654 2.396 2.654 2.618-1.51a1.5 1.5 0 00-.036-2.308z"/>
                    <path fill="#34A853" d="M3.27 22.708l9.684-10.265 2.212 2.212L5 23.001a2 2 0 01-1.73-.293z"/>
                    <path fill="#4285F4" d="M3.27 1.292C2.51 1.7 2 2.51 2 3.5v17c0 .99.51 1.8 1.27 2.208l10.37-10.985-10.37-11.43z"/>
                  </svg>
                  <div>
                    <p className="text-[10px] text-muted font-dm-sans">Coming soon on</p>
                    <p className="text-sm font-syne font-bold text-paper">Google Play</p>
                  </div>
                </a>
                {/* App Store — mock */}
                <a href="#" onClick={e => { e.preventDefault(); }}
                  className="flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all hover:scale-105"
                  style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)"}}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div>
                    <p className="text-[10px] text-muted font-dm-sans">Coming soon on</p>
                    <p className="text-sm font-syne font-bold text-paper">App Store</p>
                  </div>
                </a>
              </div>
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
            {/* Social links */}
            <div className="max-w-7xl mx-auto mt-6 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-5">
                <a href="https://facebook.com/profile.php?id=61590324584360" target="_blank" rel="noopener noreferrer"
                  className="text-muted hover:text-paper transition-colors" aria-label="Facebook">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                  </svg>
                </a>
                <a href="https://instagram.com/planetmallshop" target="_blank" rel="noopener noreferrer"
                  className="text-muted hover:text-paper transition-colors" aria-label="Instagram">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </a>
                <a href="https://x.com/planetmallshop" target="_blank" rel="noopener noreferrer"
                  className="text-muted hover:text-paper transition-colors" aria-label="X">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="https://www.threads.com/@planetmallshop" target="_blank" rel="noopener noreferrer"
                  className="text-muted hover:text-paper transition-colors" aria-label="Threads">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.5 12.01v-.017c.024-3.579 1.205-6.33 3.509-8.178C7.01 2.115 9.862 1.5 12.01 1.5h.016c2.264.017 4.224.6 5.821 1.73 1.518 1.076 2.625 2.6 3.167 4.394l-2.71.806c-.388-1.258-1.102-2.282-2.123-3.045-1.074-.804-2.472-1.225-4.162-1.238h-.012c-1.817.013-3.37.468-4.617 1.352C6.07 6.43 5.362 8.147 5.344 10.342v.02c.018 2.195.726 3.912 2.147 5.103 1.247.884 2.8 1.339 4.617 1.352h.012c1.69-.013 3.088-.434 4.162-1.238 1.021-.763 1.735-1.787 2.123-3.045l2.71.806c-.542 1.794-1.649 3.318-3.167 4.394-1.597 1.13-3.557 1.713-5.821 1.73h-.016c-2.148 0-5-.615-6.999-2.312"/>
                  </svg>
                </a>
                <a href="https://wa.me/16478521007" target="_blank" rel="noopener noreferrer"
                  className="text-muted hover:text-paper transition-colors" aria-label="WhatsApp">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                </a>
              </div>
              <p className="text-[11px] text-muted/50 font-dm-sans">Follow us for deals, drops & live shopping events</p>
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
      "Basic analytics",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "CA$8",
    period: "month",
    subtitle: "or CA$80/year (save 17%)",
    featured: true,
    cta: "Start Premium",
    features: [
      "Everything in Free",
      "AI Store Builder",
      "AI product descriptions",
      "AI business insights",
      "AI customer support bot",
      "Unlimited products",
      "1 active livestream",
      "Custom domain",
      "Remove Planet Mall branding",
      "Multiple staff accounts",
      "Featured placement",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: "CA$10",
    period: "month",
    subtitle: "For serious scale",
    featured: false,
    cta: "Go Business",
    features: [
      "Everything in Premium",
      "Unlimited livestreams",
      "Bulk CSV product import",
      "API access",
      "Dedicated account manager",
      "Custom AI brand voice",
      "Multi-warehouse inventory",
      "Team permissions",
    ],
  },
];

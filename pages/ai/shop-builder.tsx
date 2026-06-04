// pages/ai/shop-builder.tsx
// ─── AI STORE BUILDER PAGE (PHASE 6) ────────────────────────────
// Seller describes business → Claude builds the full store.
// Premium feature. Design: dark void, gold AI accent.

import Head           from "next/head";
import { useRouter }  from "next/router";
import { useState }   from "react";
import toast          from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth }    from "@/context/AuthContext";
import { createShop } from "@/services/shopService";

export default function AIShopBuilderPage() {
  return (
    <ProtectedRoute requireRole="seller">
      <AIShopBuilder />
    </ProtectedRoute>
  );
}

function AIShopBuilder() {
  const { user, isPremium } = useAuth();
  const router   = useRouter();
  const [prompt,   setPrompt]   = useState("");
  const [building, setBuilding] = useState(false);
  const [result,   setResult]   = useState<any>(null);
  const [saving,   setSaving]   = useState(false);

  const EXAMPLES = [
    "I sell handmade leather wallets and bags from Toronto",
    "Organic Nigerian spices and seasonings shipped worldwide",
    "Vintage streetwear and sneaker reselling",
    "Custom digital illustrations and art commissions",
    "Premium skincare for melanin-rich skin tones",
  ];

  async function handleBuild() {
    if (!prompt.trim()) return;
    setBuilding(true);
    setResult(null);
    try {
      const res  = await fetch("/api/ai/store-builder", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      toast.success("Store built! Review and launch below.");
    } catch {
      toast.error("AI builder failed. Try again.");
    } finally {
      setBuilding(false);
    }
  }

  async function handleLaunch() {
    if (!result || !user) return;
    setSaving(true);
    try {
      await createShop({
        ownerId: user.uid, name: result.name, tagline: result.tagline,
        description: result.description, category: result.category,
        logoURL: "", bannerURL: "",
        brandColor: result.brandColor || "#C4531A",
        accentColor: result.accentColor || "#D4A84B",
        mood: result.mood || "warm", city: "", country: "Canada",
        returnPolicy: result.returnPolicy, shippingNote: result.shippingNote,
        whatsapp: "", instagram: "", website: "",
        verified: false, isLive: true, status: "active",
        followers: 0, totalSales: 0, totalOrders: 0,
        rating: 0, reviewCount: 0, builtByAI: true, currency: "CAD",
      });
      toast.success("Store launched! 🎉");
      router.push("/seller/dashboard");
    } catch {
      toast.error("Failed to launch store");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Head><title>AI Store Builder — Planet Mall</title></Head>
      <div className="min-h-screen bg-void pt-20 pb-20 px-4">
        <div className="max-w-2xl mx-auto">

          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-dm-sans mb-6"
              style={{background:"rgba(212,168,75,0.1)",border:"1px solid rgba(212,168,75,0.2)",color:"#D4A84B"}}>
              ✦ Premium Feature
            </div>
            <h1 className="font-syne font-bold text-4xl sm:text-5xl text-paper mb-4">AI Store Builder</h1>
            <p className="text-muted font-dm-sans text-lg">Describe your business in one sentence.<br />Claude builds your entire store in seconds.</p>
          </div>

          {!isPremium && (
            <div className="p-5 rounded-2xl mb-8 text-center"
              style={{background:"rgba(212,168,75,0.05)",border:"1px solid rgba(212,168,75,0.2)"}}>
              <p className="text-sm font-dm-sans text-paper mb-3">
                AI Store Builder requires <span style={{color:"#D4A84B"}}>Premium</span>
              </p>
              <button onClick={() => router.push("/pricing")}
                className="px-5 py-2 rounded-full text-sm font-dm-sans font-semibold"
                style={{background:"#D4A84B",color:"#1A1714"}}>
                Upgrade — CA$9.99/mo
              </button>
            </div>
          )}

          <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
            placeholder="Describe your business... e.g. I sell handmade leather goods from Toronto targeting professionals"
            rows={4} disabled={!isPremium}
            className="w-full px-5 py-4 rounded-2xl text-sm font-dm-sans text-paper placeholder:text-muted/40 focus:outline-none resize-none disabled:opacity-50 mb-2"
            style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)"}}
            onFocus={e => e.target.style.borderColor="rgba(212,168,75,0.5)"}
            onBlur={e  => e.target.style.borderColor="rgba(255,255,255,0.1)"} />
          <p className="text-xs text-muted font-dm-sans mb-5">{prompt.length}/300</p>

          <div className="mb-8">
            <p className="text-xs text-muted font-dm-sans mb-3">Try an example:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map(ex => (
                <button key={ex} onClick={() => setPrompt(ex)} disabled={!isPremium}
                  className="px-3 py-1.5 rounded-full text-xs font-dm-sans border transition-all hover:border-gold/40 disabled:opacity-40"
                  style={{borderColor:"rgba(255,255,255,0.08)",color:"#8A8480",background:"rgba(255,255,255,0.02)"}}>
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleBuild} disabled={!prompt.trim() || building || !isPremium}
            className="w-full py-4 rounded-2xl font-syne font-bold text-lg disabled:opacity-40 flex items-center justify-center gap-3 mb-10"
            style={{background:"linear-gradient(135deg, #C4531A, #D4A84B)",color:"#fff"}}>
            {building
              ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Building your store...</>
              : <>✦ Build my store with AI</>}
          </button>

          {result && (
            <div className="animate-fade-in rounded-2xl overflow-hidden" style={{border:"1px solid rgba(212,168,75,0.2)"}}>
              <div className="h-20" style={{background:`linear-gradient(135deg, ${result.brandColor}30, ${result.accentColor}30)`}} />
              <div className="px-6 pb-6 pt-4" style={{background:"rgba(255,255,255,0.02)"}}>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-syne font-bold text-2xl text-paper">{result.name}</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold font-dm-sans"
                    style={{background:"rgba(212,168,75,0.15)",color:"#D4A84B"}}>✦ AI Built</span>
                </div>
                <p className="text-muted font-dm-sans text-sm mb-3">{result.tagline}</p>
                <p className="text-paper/70 font-dm-sans text-sm leading-relaxed mb-5">{result.description}</p>
                <div className="grid grid-cols-2 gap-3 mb-5 text-sm font-dm-sans">
                  <div><p className="text-[10px] text-muted uppercase tracking-wide mb-0.5">Category</p><p className="text-paper">{result.category}</p></div>
                  <div><p className="text-[10px] text-muted uppercase tracking-wide mb-0.5">Vibe</p><p className="text-paper capitalize">{result.mood}</p></div>
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-xs text-muted font-dm-sans">Colors:</span>
                  <div className="w-5 h-5 rounded-full" style={{background:result.brandColor}} />
                  <div className="w-5 h-5 rounded-full" style={{background:result.accentColor}} />
                  <span className="text-xs text-muted font-dm-sans">{result.brandColor} · {result.accentColor}</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleLaunch} disabled={saving}
                    className="flex-1 py-3 rounded-xl font-dm-sans font-bold text-sm text-white disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{background:"#C4531A"}}>
                    {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Launching...</> : "Launch this store →"}
                  </button>
                  <button onClick={() => setResult(null)}
                    className="px-4 py-3 rounded-xl font-dm-sans text-sm border"
                    style={{borderColor:"rgba(255,255,255,0.1)",color:"#8A8480"}}>
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

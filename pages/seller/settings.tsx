// pages/seller/settings.tsx
// ─── SELLER SETTINGS / EDIT STORE (PHASE 9) ─────────────────────
// Edit store details, social links, policies.
// Design: cream bg, Playfair + DM Sans.

import Head              from "next/head";
import Link              from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter }     from "next/router";
import toast             from "react-hot-toast";
import ProtectedRoute    from "@/components/ProtectedRoute";
import { useAuth }       from "@/context/AuthContext";
import { getShopByOwner, updateShop, uploadShopImage } from "@/services/shopService";
import { getTrustProfile, TRUST_LEVELS, type TrustProfile } from "@/services/trustService";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ShopData } from "@/services/shopService";

export default function SettingsPage() {
  return (
    <ProtectedRoute requireRole="seller">
      <StoreSettings />
    </ProtectedRoute>
  );
}

function StoreSettings() {
  const { user } = useAuth();
  const router   = useRouter();
  const [shop,    setShop]    = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState<Partial<ShopData>>({});
  const [trust,   setTrust]   = useState<TrustProfile | null>(null);
  const [paymentInfo, setPaymentInfo] = useState({
    etransferEmail: "",
    paypalEmail:    "",
    bankName:       "",
    bankAccount:    "",
    mobileMoneyNumber: "",
    preferredMethod:   "etransfer",
  });
  const [savingPayment, setSavingPayment] = useState(false);
  const [logoPreview,   setLogoPreview]   = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const [logoFile,   setLogoFile]   = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const logoRef   = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getShopByOwner(user.uid),
      getTrustProfile(user.uid),
      getDoc(doc(db, "sellerPaymentInfo", user.uid)),
    ]).then(([s, t, paySnap]) => {
      if (!s) { router.push("/seller/create-shop"); return; }
      setShop(s);
      setForm(s);
      setTrust(t);
      if (paySnap.exists()) {
        setPaymentInfo(p => ({ ...p, ...paySnap.data() }));
      }
      setLoading(false);
    });
  }, [user, router]);

  function up(field: keyof ShopData, value: string) {
    setForm(f => ({...f, [field]: value}));
  }

  async function savePaymentInfo() {
    if (!user) return;
    setSavingPayment(true);
    try {
      await setDoc(doc(db, "sellerPaymentInfo", user.uid), {
        ...paymentInfo,
        userId:    user.uid,
        updatedAt: new Date(),
      });
      toast.success("Payment info saved! 💰");
    } catch { toast.error("Failed to save payment info"); }
    finally { setSavingPayment(false); }
  }

  async function handleSave() {
    if (!shop || !user) return;
    setSaving(true);
    try {
      let logoURL   = form.logoURL   || shop.logoURL;
      let bannerURL = form.bannerURL || shop.bannerURL;

      if (logoFile) {
        logoURL = await uploadShopImage(logoFile, `shops/${shop.shopId}/logo-${Date.now()}`);
      }
      if (bannerFile) {
        bannerURL = await uploadShopImage(bannerFile, `shops/${shop.shopId}/banner-${Date.now()}`);
      }

      await updateShop(shop.shopId!, { ...form, logoURL, bannerURL });
      toast.success("Store updated!");
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full px-4 py-3 rounded-xl border text-sm font-dm-sans focus:outline-none transition-colors";
  const inpStyle = { background:"#fff", borderColor:"#D4CFC6", color:"#1A1714" };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:"#F6F1E9"}}>
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#C4531A"}} />
    </div>
  );

  return (
    <>
      <Head><title>Settings — {shop?.name || "Planet Mall"}</title></Head>
      <div className="min-h-screen" style={{background:"#F6F1E9",color:"#1A1714"}}>

        {/* Topbar */}
        <div style={{background:"#1A1714"}} className="px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <img src="/logo.jpg" alt="" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-syne font-bold text-paper hidden sm:block">Planet Mall</span>
            </div>
            <nav className="hidden md:flex gap-5 text-sm font-dm-sans">
              {[
                {href:"/seller/dashboard",label:"Dashboard"},
                {href:"/seller/products", label:"Products"},
                {href:"/seller/analytics",label:"Analytics"},
                {href:"/seller/settings", label:"Settings"},
              ].map(({href,label})=>(
                <Link key={href} href={href} style={{color:router.pathname===href?"#C4531A":"#8A8480"}}>{label}</Link>
              ))}
            </nav>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 rounded-full text-sm font-dm-sans font-semibold text-white disabled:opacity-50 flex items-center gap-2"
            style={{background:"#C4531A"}}>
            {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : "Save changes"}
          </button>
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">
          <h1 style={{fontFamily:"'Playfair Display',serif"}} className="text-3xl font-bold">Store settings</h1>

          {/* Basic info */}
          <Section title="Store basics">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Store name</label>
                <input className={inp} style={inpStyle} value={form.name||""} onChange={e=>up("name",e.target.value)}
                  onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
              </div>
              <div>
                <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Tagline</label>
                <input className={inp} style={inpStyle} value={form.tagline||""} onChange={e=>up("tagline",e.target.value)}
                  onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
              </div>
              <div>
                <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Description</label>
                <textarea className={`${inp} resize-none`} style={inpStyle} rows={4}
                  value={form.description||""} onChange={e=>up("description",e.target.value)}
                  onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
              </div>
            </div>
          </Section>

          {/* Images */}
          <Section title="Store images">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold font-syne mb-2" style={{color:"#1A1714"}}>Logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-dashed flex items-center justify-center cursor-pointer"
                    style={{borderColor:"#D4CFC6",background:"#fff"}}
                    onClick={()=>logoRef.current?.click()}>
                    {logoPreview || form.logoURL
                      ? <img src={logoPreview||form.logoURL} alt="" className="w-full h-full object-cover" />
                      : <span className="text-2xl">🏪</span>}
                  </div>
                  <button type="button" onClick={()=>logoRef.current?.click()}
                    className="px-4 py-2 text-sm font-dm-sans font-medium rounded-xl border"
                    style={{borderColor:"#C4531A",color:"#C4531A",background:"#FFF5F0"}}>
                    Change logo
                  </button>
                  <input ref={logoRef} type="file" accept="image/*" className="hidden"
                    onChange={e=>{const f=e.target.files?.[0];if(f){setLogoFile(f);setLogoPreview(URL.createObjectURL(f))}}} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold font-syne mb-2" style={{color:"#1A1714"}}>Banner</label>
                <div className="w-full h-28 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer"
                  style={{borderColor:"#D4CFC6",background:"#fff"}}
                  onClick={()=>bannerRef.current?.click()}>
                  {bannerPreview || form.bannerURL
                    ? <img src={bannerPreview||form.bannerURL} alt="" className="w-full h-full object-cover" />
                    : <p className="text-sm font-dm-sans" style={{color:"#8A8480"}}>Click to upload banner</p>}
                </div>
                <input ref={bannerRef} type="file" accept="image/*" className="hidden"
                  onChange={e=>{const f=e.target.files?.[0];if(f){setBannerFile(f);setBannerPreview(URL.createObjectURL(f))}}} />
              </div>
            </div>
          </Section>

          {/* Location */}
          <Section title="Location">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>City</label>
                <input className={inp} style={inpStyle} value={form.city||""} onChange={e=>up("city",e.target.value)}
                  onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
              </div>
              <div>
                <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Country</label>
                <input className={inp} style={inpStyle} value={form.country||""} onChange={e=>up("country",e.target.value)}
                  onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
              </div>
            </div>
          </Section>

          {/* Social links */}
          <Section title="Social links">
            <div className="space-y-3">
              {[
                {key:"instagram",icon:"📸",ph:"instagram.com/yourstore"},
                {key:"website",  icon:"🌐",ph:"yourstore.com"},
                {key:"whatsapp", icon:"💬",ph:"+1 (416) 000-0000"},
              ].map(({key,icon,ph})=>(
                <div key={key} className="flex items-center gap-3">
                  <span className="text-lg">{icon}</span>
                  <input className={inp} style={inpStyle} value={(form as any)[key]||""} placeholder={ph}
                    onChange={e=>up(key as keyof ShopData,e.target.value)}
                    onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                </div>
              ))}
            </div>
          </Section>

          {/* Policies */}
          <Section title="Policies">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Return policy</label>
                <textarea className={`${inp} resize-none`} style={inpStyle} rows={3}
                  value={form.returnPolicy||""} onChange={e=>up("returnPolicy",e.target.value)}
                  onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
              </div>
              <div>
                <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Shipping note</label>
                <textarea className={`${inp} resize-none`} style={inpStyle} rows={3}
                  value={form.shippingNote||""} onChange={e=>up("shippingNote",e.target.value)}
                  onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
              </div>
            </div>
          </Section>

          {/* Trust Score */}
          {trust && (
            <Section title="Trust & Seller Level">
              <div className="space-y-4">
                {/* Level badge */}
                <div className="flex items-center justify-between p-4 rounded-xl"
                  style={{background:`${TRUST_LEVELS[trust.level].color}10`,border:`1px solid ${TRUST_LEVELS[trust.level].color}30`}}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{TRUST_LEVELS[trust.level].badge}</span>
                    <div>
                      <p className="font-syne font-bold text-sm" style={{color:TRUST_LEVELS[trust.level].color}}>
                        Level {trust.level} — {TRUST_LEVELS[trust.level].label}
                      </p>
                      <p className="text-xs font-dm-sans mt-0.5" style={{color:"#8A8480"}}>
                        {TRUST_LEVELS[trust.level].description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-syne font-bold text-2xl" style={{color:TRUST_LEVELS[trust.level].color}}>{trust.score}</p>
                    <p className="text-[10px] font-dm-sans" style={{color:"#8A8480"}}>Trust score</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {label:"Orders",   value:trust.totalOrders,     icon:"📦"},
                    {label:"Disputes", value:trust.disputesAgainst, icon:"⚠️"},
                    {label:"Max Order",value:`$${trust.maxOrderAmount}`, icon:"💰"},
                  ].map(s => (
                    <div key={s.label} className="p-3 rounded-xl text-center" style={{background:"#F6F1E9",border:"1px solid #E8E2D9"}}>
                      <p className="text-lg">{s.icon}</p>
                      <p className="font-syne font-bold text-sm" style={{color:"#1A1714"}}>{s.value}</p>
                      <p className="text-[10px] font-dm-sans" style={{color:"#8A8480"}}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Verifications */}
                <div className="space-y-2">
                  <p className="text-xs font-dm-sans font-bold" style={{color:"#8A8480"}}>VERIFICATIONS</p>
                  {[
                    {label:"Phone verified",    done: trust.isPhoneVerified,  points:"+10 pts"},
                    {label:"ID verified",        done: trust.isIdVerified,     points:"+20 pts"},
                    {label:"Stripe connected",   done: trust.stripeConnected,  points:"+15 pts"},
                  ].map(v => (
                    <div key={v.label} className="flex items-center justify-between py-2 px-3 rounded-xl"
                      style={{background: v.done ? "rgba(42,107,69,0.08)" : "rgba(255,255,255,0.5)",border:"1px solid #E8E2D9"}}>
                      <div className="flex items-center gap-2">
                        <span>{v.done ? "✅" : "⭕"}</span>
                        <span className="text-sm font-dm-sans" style={{color:"#1A1714"}}>{v.label}</span>
                      </div>
                      <span className="text-xs font-dm-sans font-bold" style={{color: v.done ? "#2A6B45" : "#8A8480"}}>
                        {v.done ? "Done" : v.points}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-xs font-dm-sans" style={{color:"#8A8480"}}>
                  ⏱️ Escrow hold: <strong>{trust.escrowHoldDays} days</strong> — completes faster as you level up
                </p>
              </div>
            </Section>
          )}

          {/* Payment Info */}
          <Section title="💰 Payment Info">
            <p className="text-xs font-dm-sans mb-4" style={{color:"#8A8480"}}>
              Where should Planet Mall send your earnings? We'll use this to pay you when buyers confirm delivery.
            </p>

            {/* Preferred method */}
            <div className="mb-4">
              <label className="block text-sm font-semibold font-syne mb-2" style={{color:"#1A1714"}}>Preferred payout method</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {value:"etransfer",    label:"🏦 E-Transfer",     desc:"Canada only"},
                  {value:"paypal",       label:"💸 PayPal",          desc:"Global"},
                  {value:"mobilemoney",  label:"📱 Mobile Money",    desc:"Africa"},
                  {value:"bank",         label:"🏛️ Bank Transfer",   desc:"Global"},
                ].map(m => (
                  <button key={m.value} type="button"
                    onClick={() => setPaymentInfo(p => ({...p, preferredMethod: m.value}))}
                    className="p-3 rounded-xl text-left transition-all"
                    style={{
                      background: paymentInfo.preferredMethod === m.value ? "rgba(196,83,26,0.08)" : "#F6F1E9",
                      border:     `1px solid ${paymentInfo.preferredMethod === m.value ? "#C4531A" : "#E8E2D9"}`,
                    }}>
                    <p className="text-sm font-dm-sans font-bold" style={{color:"#1A1714"}}>{m.label}</p>
                    <p className="text-[10px] font-dm-sans" style={{color:"#8A8480"}}>{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* E-Transfer */}
            {paymentInfo.preferredMethod === "etransfer" && (
              <div>
                <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>E-Transfer Email</label>
                <input className={inp} style={inpStyle}
                  value={paymentInfo.etransferEmail}
                  onChange={e => setPaymentInfo(p => ({...p, etransferEmail: e.target.value}))}
                  placeholder="your@email.com"
                  onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
              </div>
            )}

            {/* PayPal */}
            {paymentInfo.preferredMethod === "paypal" && (
              <div>
                <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>PayPal Email</label>
                <input className={inp} style={inpStyle}
                  value={paymentInfo.paypalEmail}
                  onChange={e => setPaymentInfo(p => ({...p, paypalEmail: e.target.value}))}
                  placeholder="your@paypal.com"
                  onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
              </div>
            )}

            {/* Mobile Money */}
            {paymentInfo.preferredMethod === "mobilemoney" && (
              <div>
                <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Mobile Money Number (MTN/Vodafone/Airtel)</label>
                <input className={inp} style={inpStyle}
                  value={paymentInfo.mobileMoneyNumber}
                  onChange={e => setPaymentInfo(p => ({...p, mobileMoneyNumber: e.target.value}))}
                  placeholder="+233 XX XXX XXXX"
                  onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
              </div>
            )}

            {/* Bank */}
            {paymentInfo.preferredMethod === "bank" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Bank Name</label>
                  <input className={inp} style={inpStyle}
                    value={paymentInfo.bankName}
                    onChange={e => setPaymentInfo(p => ({...p, bankName: e.target.value}))}
                    placeholder="e.g. TD Bank, GTBank"
                    onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                </div>
                <div>
                  <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Account Number</label>
                  <input className={inp} style={inpStyle}
                    value={paymentInfo.bankAccount}
                    onChange={e => setPaymentInfo(p => ({...p, bankAccount: e.target.value}))}
                    placeholder="Account number"
                    onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                </div>
              </div>
            )}

            <button onClick={savePaymentInfo} disabled={savingPayment}
              className="mt-4 w-full py-3 rounded-xl text-white font-dm-sans font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              style={{background:"#C4531A"}}>
              {savingPayment
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                : "Save Payment Info 💰"}
            </button>

            <p className="text-[10px] font-dm-sans mt-3 text-center" style={{color:"#8A8480"}}>
              🔒 Your payment info is encrypted and only used by Planet Mall admin to send you earnings
            </p>
          </Section>

          {/* Subscription */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-dm-sans font-semibold" style={{color:"#1A1714"}}>Manage your plan</p>
                <p className="text-xs font-dm-sans mt-0.5" style={{color:"#8A8480"}}>Upgrade, downgrade, or cancel</p>
              </div>
              <Link href="/pricing"
                className="px-4 py-2 rounded-xl text-sm font-dm-sans font-medium border"
                style={{borderColor:"#D4CFC6",color:"#C4531A"}}>
                Manage plan →
              </Link>
            </div>
          </Section>

          <div className="flex justify-end pb-10">
            <button onClick={handleSave} disabled={saving}
              className="px-8 py-3.5 rounded-xl text-white font-dm-sans font-semibold disabled:opacity-50 flex items-center gap-2"
              style={{background:"#C4531A"}}>
              {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : "Save all changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-6 rounded-2xl" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
      <h2 style={{fontFamily:"'Playfair Display',serif",color:"#1A1714"}} className="text-lg font-bold mb-5">{title}</h2>
      {children}
    </div>
  );
}

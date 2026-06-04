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
  const [logoPreview,   setLogoPreview]   = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const [logoFile,   setLogoFile]   = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const logoRef   = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    getShopByOwner(user.uid).then(s => {
      if (!s) { router.push("/seller/create-shop"); return; }
      setShop(s);
      setForm(s);
      setLoading(false);
    });
  }, [user, router]);

  function up(field: keyof ShopData, value: string) {
    setForm(f => ({...f, [field]: value}));
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

          {/* Danger zone */}
          <Section title="Subscription">
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

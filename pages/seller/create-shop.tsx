// pages/seller/create-shop.tsx
// ─── SHOP CREATION WIZARD (PHASE 2) ─────────────────────────────
// Design: warm editorial — cream bg, rust accent, Playfair Display + DM Sans
// Step 1: Name, tagline, category, description, mood
// Step 2: Logo + banner upload, brand colors, social links
// Step 3: Location, return policy, shipping notes
// Step 4: Live store preview + completeness score

import Head                 from "next/head";
import { useRouter }        from "next/router";
import { useState, useRef } from "react";
import toast                from "react-hot-toast";
import ProtectedRoute       from "@/components/ProtectedRoute";
import { useAuth }          from "@/context/AuthContext";
import { createShop, uploadShopImage } from "@/services/shopService";

const CATEGORIES = [
  "Fashion & Apparel","Electronics","Home & Living","Beauty & Health",
  "Food & Beverages","Sports & Outdoors","Art & Crafts","Books & Media",
  "Toys & Games","Automotive","Pets","Digital Products","Other",
];

const MOODS = [
  { value:"minimal", label:"Minimal", desc:"Clean, simple, editorial",   emoji:"◻" },
  { value:"bold",    label:"Bold",    desc:"Strong, loud, confident",     emoji:"◼" },
  { value:"warm",    label:"Warm",    desc:"Friendly, cozy, inviting",    emoji:"◈" },
  { value:"luxury",  label:"Luxury",  desc:"Premium, refined, exclusive", emoji:"◇" },
];

const COUNTRIES = [
  "Canada","United States","United Kingdom","Australia","Germany",
  "France","Netherlands","Sweden","Japan","Singapore","UAE",
  "South Africa","Nigeria","Ghana","Kenya","India","Brazil","Other",
];

interface WizardData {
  name:string; tagline:string; category:string; description:string;
  mood:"minimal"|"bold"|"warm"|"luxury";
  logoURL:string; bannerURL:string; brandColor:string; accentColor:string;
  instagram:string; website:string; whatsapp:string;
  city:string; country:string; returnPolicy:string; shippingNote:string;
}

const EMPTY: WizardData = {
  name:"",tagline:"",category:"",description:"",mood:"warm",
  logoURL:"",bannerURL:"",brandColor:"#C4531A",accentColor:"#D4A84B",
  instagram:"",website:"",whatsapp:"",
  city:"",country:"Canada",
  returnPolicy:"30-day returns accepted on unused items in original packaging.",
  shippingNote:"Ships within 2-3 business days. Free shipping on orders over CA$75.",
};

export default function CreateShopPage() {
  return (
    <ProtectedRoute requireRole="seller" requirePhoneVerified>
      <CreateShopWizard />
    </ProtectedRoute>
  );
}

function CreateShopWizard() {
  const { user } = useAuth();
  const router   = useRouter();
  const [step,   setStep]   = useState(1);
  const [data,   setData]   = useState<WizardData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [logoFile,      setLogoFile]      = useState<File|null>(null);
  const [bannerFile,    setBannerFile]    = useState<File|null>(null);
  const [logoPreview,   setLogoPreview]   = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const [uploadPct,     setUploadPct]     = useState(0);
  const logoRef   = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  function up(field: keyof WizardData, value: string) {
    setData(d => ({...d, [field]: value}));
  }

  function pickImage(e: React.ChangeEvent<HTMLInputElement>, type:"logo"|"banner") {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type==="logo")   { setLogoFile(file);   setLogoPreview(url); }
    if (type==="banner") { setBannerFile(file); setBannerPreview(url); }
  }

  const score = Math.round([
    data.name,data.tagline,data.category,data.description,
    logoPreview||data.logoURL, bannerPreview||data.bannerURL,
    data.city,data.country,data.returnPolicy,data.shippingNote,data.brandColor,
  ].filter(Boolean).length / 11 * 100);

  async function handleSubmit() {
    if (!user) return;
    setSaving(true);
    try {
      let logoURL   = data.logoURL;
      let bannerURL = data.bannerURL;
      if (logoFile) {
        setUploadPct(0);
        logoURL = await uploadShopImage(logoFile, `shops/temp/logo-${Date.now()}`, setUploadPct);
      }
      if (bannerFile) {
        setUploadPct(0);
        bannerURL = await uploadShopImage(bannerFile, `shops/temp/banner-${Date.now()}`, setUploadPct);
      }
      await createShop({
        ownerId:user.uid, name:data.name, tagline:data.tagline,
        description:data.description, category:data.category,
        logoURL, bannerURL, brandColor:data.brandColor, accentColor:data.accentColor,
        mood:data.mood, city:data.city, country:data.country,
        returnPolicy:data.returnPolicy, shippingNote:data.shippingNote,
        whatsapp:data.whatsapp, instagram:data.instagram, website:data.website,
        verified:false, isLive:true, status:"active",
        followers:0, totalSales:0, totalOrders:0, rating:0, reviewCount:0,
        builtByAI:false, currency:"CAD",
      });
      // Fix ownerId
      toast.success("Your store is live! 🎉");
      router.push("/seller/dashboard");
    } catch(err) {
      console.error(err);
      toast.error("Failed to create shop. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full px-4 py-3 rounded-xl border text-sm font-dm-sans focus:outline-none transition-colors";
  const inpStyle = { background:"#fff", borderColor:"#D4CFC6", color:"#1A1714" };

  return (
    <>
      <Head>
        <title>Create your store — Planet Mall</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen" style={{background:"#F6F1E9",color:"#1A1714"}}>

        {/* Top bar */}
        <div style={{background:"#1A1714"}} className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.jpg" alt="Planet Mall" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-syne font-bold text-paper text-lg">Planet Mall</span>
          </div>
          <span className="text-xs font-dm-sans" style={{color:"#8A8480"}}>Setting up your store</span>
        </div>

        <div className="max-w-2xl mx-auto px-4 pt-10 pb-16">

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-10">
            {[1,2,3,4].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-syne transition-all"
                  style={{
                    background: s===step?"#C4531A":s<step?"#2A6B45":"#E8E2D9",
                    color: s<=step?"#fff":"#8A8480",
                  }}>
                  {s<step?"✓":s}
                </div>
                {s<4 && <div className="h-px w-8 sm:w-16 transition-all" style={{background:s<step?"#2A6B45":"#D4CFC6"}} />}
              </div>
            ))}
            <span className="ml-2 text-xs font-dm-sans" style={{color:"#8A8480"}}>
              {["Store basics","Branding","Location & Policies","Preview & Launch"][step-1]}
            </span>
          </div>

          {/* STEP 1 */}
          {step===1 && (
            <div className="animate-fade-in space-y-5">
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-1" style={{fontFamily:"'Playfair Display',serif",color:"#1A1714"}}>
                  Let's build your store.
                </h1>
                <p className="text-sm font-dm-sans" style={{color:"#8A8480"}}>Tell us about your business.</p>
              </div>

              <div>
                <Label>Store name *</Label>
                <input className={inp} style={inpStyle} value={data.name}
                  onChange={e=>up("name",e.target.value)} placeholder="e.g. Nova Threads" maxLength={60}
                  onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
              </div>
              <div>
                <Label hint="One sentence that captures what you sell">Tagline *</Label>
                <input className={inp} style={inpStyle} value={data.tagline}
                  onChange={e=>up("tagline",e.target.value)} placeholder="e.g. Premium streetwear, made to last" maxLength={100}
                  onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
              </div>
              <div>
                <Label>Category *</Label>
                <select className={inp} style={{...inpStyle,color:data.category?"#1A1714":"#8A8480"}}
                  value={data.category} onChange={e=>up("category",e.target.value)}>
                  <option value="">Select a category</option>
                  {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label hint="Tell buyers what makes you special">Description *</Label>
                <textarea className={`${inp} resize-none`} style={inpStyle} rows={4} value={data.description}
                  onChange={e=>up("description",e.target.value)} maxLength={500}
                  placeholder="We curate premium handcrafted goods..."
                  onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                <p className="text-right text-xs mt-1" style={{color:"#8A8480"}}>{data.description.length}/500</p>
              </div>
              <div>
                <Label>Store vibe</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {MOODS.map(m=>(
                    <button key={m.value} type="button" onClick={()=>up("mood",m.value)}
                      className="p-3 rounded-xl border text-left transition-all"
                      style={{background:data.mood===m.value?"#FFF5F0":"#fff",borderColor:data.mood===m.value?"#C4531A":"#D4CFC6",color:"#1A1714"}}>
                      <div className="text-lg mb-1">{m.emoji}</div>
                      <p className="text-xs font-semibold font-syne">{m.label}</p>
                      <p className="text-[10px] font-dm-sans mt-0.5" style={{color:"#8A8480"}}>{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end pt-3">
                <NextBtn disabled={!data.name||!data.tagline||!data.category||!data.description} onClick={()=>setStep(2)} />
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step===2 && (
            <div className="animate-fade-in space-y-6">
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-1" style={{fontFamily:"'Playfair Display',serif",color:"#1A1714"}}>
                  Make it yours.
                </h1>
                <p className="text-sm font-dm-sans" style={{color:"#8A8480"}}>Upload your logo, pick your colors, connect socials.</p>
              </div>

              {/* Logo */}
              <div>
                <Label>Store logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer flex-shrink-0"
                    style={{borderColor:logoPreview?"#C4531A":"#D4CFC6",background:"#fff"}}
                    onClick={()=>logoRef.current?.click()}>
                    {logoPreview
                      ? <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                      : <span className="text-2xl">🏪</span>}
                  </div>
                  <div>
                    <button type="button" onClick={()=>logoRef.current?.click()}
                      className="px-4 py-2 text-sm font-dm-sans font-medium rounded-xl border"
                      style={{borderColor:"#C4531A",color:"#C4531A",background:"#FFF5F0"}}>
                      {logoPreview?"Change logo":"Upload logo"}
                    </button>
                    <p className="text-xs mt-1.5 font-dm-sans" style={{color:"#8A8480"}}>Square, min 200×200px</p>
                  </div>
                  <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e=>pickImage(e,"logo")} />
                </div>
              </div>

              {/* Banner */}
              <div>
                <Label>Store banner</Label>
                <div className="w-full h-32 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer"
                  style={{borderColor:bannerPreview?"#C4531A":"#D4CFC6",background:"#fff"}}
                  onClick={()=>bannerRef.current?.click()}>
                  {bannerPreview
                    ? <img src={bannerPreview} alt="" className="w-full h-full object-cover" />
                    : <div className="text-center"><p className="text-2xl mb-1">🖼</p><p className="text-xs font-dm-sans" style={{color:"#8A8480"}}>1200×400px recommended</p></div>}
                </div>
                <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={e=>pickImage(e,"banner")} />
              </div>

              {/* Colors */}
              <div>
                <Label>Brand colors</Label>
                <div className="flex gap-8">
                  {[
                    {key:"brandColor",label:"Primary"},
                    {key:"accentColor",label:"Accent"},
                  ].map(({key,label})=>(
                    <div key={key}>
                      <p className="text-xs font-dm-sans mb-2" style={{color:"#8A8480"}}>{label}</p>
                      <div className="flex items-center gap-2">
                        <input type="color" value={data[key as keyof WizardData]}
                          onChange={e=>up(key as keyof WizardData,e.target.value)}
                          className="w-10 h-10 rounded-lg border cursor-pointer" style={{borderColor:"#D4CFC6"}} />
                        <span className="text-xs font-dm-sans uppercase" style={{color:"#8A8480"}}>{data[key as keyof WizardData]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Socials */}
              <div>
                <Label hint="Optional">Social links</Label>
                <div className="space-y-3">
                  {[
                    {key:"instagram",icon:"📸",ph:"instagram.com/yourstore"},
                    {key:"website",  icon:"🌐",ph:"yourstore.com"},
                    {key:"whatsapp", icon:"💬",ph:"+1 (416) 000-0000"},
                  ].map(({key,icon,ph})=>(
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-lg">{icon}</span>
                      <input className={inp} style={inpStyle} value={data[key as keyof WizardData]}
                        onChange={e=>up(key as keyof WizardData,e.target.value)} placeholder={ph}
                        onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-3">
                <BackBtn onClick={()=>setStep(1)} />
                <NextBtn onClick={()=>setStep(3)} />
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step===3 && (
            <div className="animate-fade-in space-y-5">
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-1" style={{fontFamily:"'Playfair Display',serif",color:"#1A1714"}}>
                  Where are you based?
                </h1>
                <p className="text-sm font-dm-sans" style={{color:"#8A8480"}}>Help buyers know where you ship from.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <input className={inp} style={inpStyle} value={data.city}
                    onChange={e=>up("city",e.target.value)} placeholder="Toronto"
                    onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                </div>
                <div>
                  <Label>Country *</Label>
                  <select className={inp} style={inpStyle} value={data.country} onChange={e=>up("country",e.target.value)}>
                    {COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <Label>Return policy *</Label>
                <textarea className={`${inp} resize-none`} style={inpStyle} rows={3}
                  value={data.returnPolicy} onChange={e=>up("returnPolicy",e.target.value)}
                  onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
              </div>

              <div>
                <Label>Shipping note *</Label>
                <textarea className={`${inp} resize-none`} style={inpStyle} rows={3}
                  value={data.shippingNote} onChange={e=>up("shippingNote",e.target.value)}
                  onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
              </div>

              <div className="flex justify-between pt-3">
                <BackBtn onClick={()=>setStep(2)} />
                <NextBtn disabled={!data.country||!data.returnPolicy||!data.shippingNote} onClick={()=>setStep(4)} />
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step===4 && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-1" style={{fontFamily:"'Playfair Display',serif",color:"#1A1714"}}>
                  Ready to go live?
                </h1>
                <p className="text-sm font-dm-sans" style={{color:"#8A8480"}}>Preview your store before launching.</p>
              </div>

              {/* Completeness */}
              <div className="mb-6 p-5 rounded-2xl" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold font-syne" style={{color:"#1A1714"}}>Store completeness</p>
                  <span className="text-lg font-bold font-syne" style={{color:score>=80?"#2A6B45":score>=50?"#C4531A":"#8A8480"}}>{score}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{background:"#E8E2D9"}}>
                  <div className="h-full rounded-full transition-all" style={{width:`${score}%`,background:score>=80?"#2A6B45":"#C4531A"}} />
                </div>
                <p className="text-xs mt-2 font-dm-sans" style={{color:"#8A8480"}}>
                  {score>=80?"Great! Your store is well set up.":"Add more details to improve discovery."}
                </p>
              </div>

              {/* Store preview */}
              <div className="rounded-2xl overflow-hidden shadow-sm mb-8" style={{border:"1px solid #E8E2D9"}}>
                <div className="h-28 flex items-center justify-center relative"
                  style={{background:bannerPreview?`url(${bannerPreview}) center/cover`:`linear-gradient(135deg, ${data.brandColor}25, ${data.accentColor}25)`}}>
                  {!bannerPreview && <p className="text-xs font-dm-sans" style={{color:"#8A8480"}}>No banner</p>}
                </div>
                <div className="p-5" style={{background:"#fff"}}>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl -mt-10 border-4 flex items-center justify-center overflow-hidden flex-shrink-0"
                      style={{background:"#F6F1E9",borderColor:"#fff"}}>
                      {logoPreview
                        ? <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                        : <span className="text-2xl">🏪</span>}
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="font-bold text-lg" style={{fontFamily:"'Playfair Display',serif",color:"#1A1714"}}>
                        {data.name||"Your Store Name"}
                      </h3>
                      <p className="text-sm font-dm-sans mt-0.5" style={{color:"#8A8480"}}>{data.tagline||"Your tagline"}</p>
                    </div>
                    <div className="px-2.5 py-1 rounded-full text-xs font-semibold font-dm-sans" style={{background:"#2A6B4515",color:"#2A6B45"}}>● Live</div>
                  </div>
                  <div className="mt-4 pt-4 grid grid-cols-3 gap-4 text-center" style={{borderTop:"1px solid #E8E2D9"}}>
                    {[{v:data.category||"—",l:"Category"},{v:data.country,l:"Ships from"},{v:data.mood,l:"Vibe"}].map(({v,l})=>(
                      <div key={l}>
                        <p className="text-xs font-semibold font-syne capitalize" style={{color:"#1A1714"}}>{v}</p>
                        <p className="text-[10px] font-dm-sans mt-0.5" style={{color:"#8A8480"}}>{l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {saving && uploadPct>0 && uploadPct<100 && (
                <div className="mb-4">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{background:"#E8E2D9"}}>
                    <div className="h-full rounded-full transition-all" style={{width:`${uploadPct}%`,background:"#C4531A"}} />
                  </div>
                  <p className="text-xs mt-1 font-dm-sans text-center" style={{color:"#8A8480"}}>Uploading... {uploadPct}%</p>
                </div>
              )}

              <div className="flex justify-between">
                <BackBtn onClick={()=>setStep(3)} />
                <button onClick={handleSubmit} disabled={saving||!data.name||!data.category}
                  className="px-8 py-3.5 rounded-xl text-white font-dm-sans font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
                  style={{background:"#C4531A"}}>
                  {saving
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Launching...</>
                    : "Launch my store →"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Label({children,hint}:{children:React.ReactNode;hint?:string}) {
  return (
    <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>
      {children}
      {hint && <span className="ml-2 text-xs font-normal font-dm-sans" style={{color:"#8A8480"}}>{hint}</span>}
    </label>
  );
}
function NextBtn({onClick,disabled}:{onClick:()=>void;disabled?:boolean}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="px-8 py-3 rounded-xl text-white font-dm-sans font-semibold text-sm disabled:opacity-40"
      style={{background:"#C4531A"}}>
      Continue →
    </button>
  );
}
function BackBtn({onClick}:{onClick:()=>void}) {
  return (
    <button onClick={onClick}
      className="px-6 py-3 rounded-xl font-dm-sans font-medium text-sm"
      style={{color:"#8A8480",border:"1px solid #D4CFC6",background:"transparent"}}>
      ← Back
    </button>
  );
}

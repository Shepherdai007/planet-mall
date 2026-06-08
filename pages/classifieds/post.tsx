// pages/classifieds/post.tsx
// ─── POST A CLASSIFIED AD ────────────────────────────────────────

import Head              from "next/head";
import { useRouter }     from "next/router";
import { useState, useRef } from "react";
import toast             from "react-hot-toast";
import Layout            from "@/components/Layout";
import { useAuth }       from "@/context/AuthContext";
import { createClassified, CLASSIFIED_CATEGORIES, PROVINCES } from "@/services/classifiedService";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export default function PostClassifiedPage() {
  const { user, userDoc, isLoggedIn, loading } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving,    setSaving]    = useState(false);
  const [images,    setImages]    = useState<File[]>([]);
  const [previews,  setPreviews]  = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title:       "",
    description: "",
    price:       "",
    priceType:   "fixed" as "fixed"|"negotiable"|"free"|"contact",
    category:    "",
    subCategory: "",
    condition:   "good" as any,
    city:        "",
    province:    "Ontario",
    country:     "Canada",
    useEscrow:   false,
    tags:        "",
    phone:       "",
    whatsapp:    "",
  });

  if (!loading && !isLoggedIn) {
    router.push("/auth/login?redirect=/classifieds/post");
    return null;
  }

  function up(field: string, value: any) {
    setForm(f => ({...f, [field]: value}));
  }

  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 5);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  }

  async function uploadImages(): Promise<string[]> {
    if (images.length === 0) return [];
    setUploading(true);
    const urls: string[] = [];
    for (const file of images) {
      const storageRef = ref(storage, `classifieds/${user!.uid}/${Date.now()}-${file.name}`);
      const task = uploadBytesResumable(storageRef, file);
      await new Promise((res, rej) => task.on("state_changed", null, rej, res as any));
      urls.push(await getDownloadURL(task.snapshot.ref));
    }
    setUploading(false);
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !userDoc) return;
    if (!form.title || !form.category || !form.city) {
      toast.error("Please fill in title, category and city");
      return;
    }
    setSaving(true);
    try {
      const imageUrls = await uploadImages();
      const id = await createClassified({
        sellerId:    user.uid,
        sellerName:  userDoc.displayName,
        sellerPhoto: userDoc.photoURL || "",
        title:       form.title,
        description: form.description,
        price:       parseFloat(form.price) || 0,
        priceType:   form.priceType,
        category:    form.category,
        subCategory: form.subCategory,
        images:      imageUrls,
        city:        form.city,
        province:    form.province,
        country:     form.country,
        condition:   form.condition,
        status:      "active",
        useEscrow:   form.useEscrow,
        featuredUntil: null,
        tags:        form.tags.split(",").map(t=>t.trim()).filter(Boolean),
        phone:       form.phone,
        whatsapp:    form.whatsapp,
      });
      toast.success("Ad posted! 🎉");
      router.push(`/classifieds/${id}`);
    } catch (err: any) {
      console.error("Post ad error:", err);
      toast.error(err?.message || "Failed to post ad — check console");
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full px-4 py-3 rounded-xl border text-sm font-dm-sans focus:outline-none transition-colors";
  const inpStyle = {background:"#fff",borderColor:"#D4CFC6",color:"#1A1714"};
  const subCategories = form.category ? (CLASSIFIED_CATEGORIES as any)[form.category] || [] : [];

  return (
    <>
      <Head><title>Post an Ad — Planet Mall Classifieds</title></Head>
      <Layout>
        <div className="min-h-screen pb-20 px-4" style={{background:"#F6F1E9"}}>
          <div className="max-w-2xl mx-auto pt-8">

            <div className="mb-8">
              <h1 className="font-syne font-bold text-3xl mb-1" style={{color:"#1A1714"}}>Post an ad</h1>
              <p className="text-sm font-dm-sans" style={{color:"#8A8480"}}>Free to post. Reach buyers across Canada and worldwide.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Images */}
              <div className="p-6 rounded-2xl" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <h2 className="font-syne font-bold text-lg mb-4" style={{color:"#1A1714"}}>Photos</h2>
                <div className="flex gap-3 flex-wrap mb-3">
                  {previews.map((p,i)=>(
                    <div key={i} className="w-20 h-20 rounded-xl overflow-hidden relative">
                      <img src={p} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={()=>{
                        setImages(imgs=>imgs.filter((_,j)=>j!==i));
                        setPreviews(ps=>ps.filter((_,j)=>j!==i));
                      }} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center">✕</button>
                    </div>
                  ))}
                  {previews.length < 5 && (
                    <button type="button" onClick={()=>fileRef.current?.click()}
                      className="w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1"
                      style={{borderColor:"#D4CFC6"}}>
                      <span className="text-2xl">📷</span>
                      <span className="text-[10px] font-dm-sans" style={{color:"#8A8480"}}>Add photo</span>
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
                <p className="text-xs font-dm-sans" style={{color:"#8A8480"}}>Up to 5 photos. First photo is your cover image.</p>
              </div>

              {/* Basic info */}
              <div className="p-6 rounded-2xl space-y-4" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <h2 className="font-syne font-bold text-lg" style={{color:"#1A1714"}}>Ad details</h2>
                <div>
                  <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Title *</label>
                  <input className={inp} style={inpStyle} value={form.title} onChange={e=>up("title",e.target.value)}
                    placeholder="e.g. 2019 Honda Civic - Low mileage"
                    onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Category *</label>
                    <select className={inp} style={inpStyle} value={form.category} onChange={e=>{up("category",e.target.value);up("subCategory","")}}
                      onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}}>
                      <option value="">Select category</option>
                      {Object.keys(CLASSIFIED_CATEGORIES).map(c=>(
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  {subCategories.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Sub-category</label>
                      <select className={inp} style={inpStyle} value={form.subCategory} onChange={e=>up("subCategory",e.target.value)}
                        onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}}>
                        <option value="">Select</option>
                        {subCategories.map((s: string)=>(
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Description</label>
                  <textarea className={`${inp} resize-none`} style={inpStyle} rows={5}
                    value={form.description} onChange={e=>up("description",e.target.value)}
                    placeholder="Describe your item in detail — condition, features, reason for selling..."
                    onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                </div>
                <div>
                  <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Condition</label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      {v:"new",label:"New"},
                      {v:"like_new",label:"Like New"},
                      {v:"good",label:"Good"},
                      {v:"fair",label:"Fair"},
                      {v:"parts_only",label:"Parts Only"},
                      {v:"na",label:"N/A"},
                    ].map(({v,label})=>(
                      <button key={v} type="button" onClick={()=>up("condition",v)}
                        className="px-3 py-1.5 rounded-xl text-xs font-dm-sans font-medium transition-all"
                        style={{
                          background: form.condition===v?"#C4531A":"#F6F1E9",
                          color:      form.condition===v?"#fff":"#8A8480",
                          border:     `1px solid ${form.condition===v?"#C4531A":"#D4CFC6"}`,
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="p-6 rounded-2xl space-y-4" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <h2 className="font-syne font-bold text-lg" style={{color:"#1A1714"}}>Price</h2>
                <div className="flex gap-2 flex-wrap">
                  {[
                    {v:"fixed",    label:"Fixed price"},
                    {v:"negotiable",label:"Negotiable (OBO)"},
                    {v:"free",     label:"Free"},
                    {v:"contact",  label:"Contact for price"},
                  ].map(({v,label})=>(
                    <button key={v} type="button" onClick={()=>up("priceType",v)}
                      className="px-4 py-2 rounded-xl text-sm font-dm-sans font-medium transition-all"
                      style={{
                        background: form.priceType===v?"#C4531A":"#F6F1E9",
                        color:      form.priceType===v?"#fff":"#8A8480",
                        border:     `1px solid ${form.priceType===v?"#C4531A":"#D4CFC6"}`,
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
                {(form.priceType === "fixed" || form.priceType === "negotiable") && (
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-dm-sans font-semibold" style={{color:"#8A8480"}}>CA$</span>
                    <input className={`${inp} pl-12`} style={inpStyle} type="number" value={form.price} onChange={e=>up("price",e.target.value)}
                      placeholder="0.00"
                      onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="p-6 rounded-2xl space-y-4" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <h2 className="font-syne font-bold text-lg" style={{color:"#1A1714"}}>Location</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>City *</label>
                    <input className={inp} style={inpStyle} value={form.city} onChange={e=>up("city",e.target.value)}
                      placeholder="e.g. Toronto"
                      onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Province</label>
                    <select className={inp} style={inpStyle} value={form.province} onChange={e=>up("province",e.target.value)}
                      onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}}>
                      {PROVINCES.map(p=><option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact info */}
              <div className="p-6 rounded-2xl space-y-4" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <h2 className="font-syne font-bold text-lg" style={{color:"#1A1714"}}>Contact information</h2>
                <p className="text-xs font-dm-sans" style={{color:"#8A8480"}}>Let buyers know how to reach you directly.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Phone number</label>
                    <input className={inp} style={inpStyle} type="tel" value={form.phone} onChange={e=>up("phone",e.target.value)}
                      placeholder="+1 (416) 000-0000"
                      onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>WhatsApp (optional)</label>
                    <input className={inp} style={inpStyle} type="tel" value={form.whatsapp} onChange={e=>up("whatsapp",e.target.value)}
                      placeholder="+1 (416) 000-0000"
                      onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                  </div>
                </div>
              </div>

              {/* Escrow option */}
              <div className="p-5 rounded-2xl" style={{background:"rgba(42,107,69,0.06)",border:"1px solid rgba(42,107,69,0.2)"}}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.useEscrow} onChange={e=>up("useEscrow",e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-green flex-shrink-0" />
                  <div>
                    <p className="font-dm-sans font-semibold text-sm" style={{color:"#2A6B45"}}>
                      🔐 Use Planet Mall Escrow Protection
                    </p>
                    <p className="text-xs font-dm-sans mt-0.5" style={{color:"#2A6B45"}}>
                      Buyers pay through Planet Mall. You receive payment after buyer confirms delivery. Builds more trust and gets more buyers.
                    </p>
                  </div>
                </label>
              </div>

              <button type="submit" disabled={saving || uploading}
                className="w-full py-4 rounded-xl text-white font-dm-sans font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2"
                style={{background:"#C4531A"}}>
                {saving || uploading
                  ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{uploading?"Uploading photos...":"Posting ad..."}</>
                  : "Post ad for free →"}
              </button>
              <p className="text-xs text-center font-dm-sans" style={{color:"#8A8480"}}>
                Free listing for 30 days. Boost to featured for CA$0.99.
              </p>
            </form>
          </div>
        </div>
      </Layout>
    </>
  );
}

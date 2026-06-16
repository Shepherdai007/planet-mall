// pages/food/post.tsx
// ─── POST A FOOD LISTING ─────────────────────────────────────────
// Works like classifieds/post.tsx — no shop required.
// Buyers order through cart → checkout → escrow (2hr release).

import Head               from "next/head";
import { useRouter }      from "next/router";
import { useState, useRef, useEffect } from "react";
import toast              from "react-hot-toast";
import Layout             from "@/components/Layout";
import { useAuth }        from "@/context/AuthContext";
import {
  createFoodListing, updateFoodListing, getFoodListing, FOOD_CATEGORIES,
} from "@/services/foodListingService";
import { PROVINCES }      from "@/services/classifiedService";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage }        from "@/lib/firebase";

export default function PostFoodPage() {
  const { user, userDoc, isLoggedIn, loading } = useAuth();
  const router  = useRouter();
  const { edit } = router.query;
  const isEditMode = !!edit;
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving,      setSaving]      = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [images,    setImages]    = useState<File[]>([]);
  const [previews,  setPreviews]  = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name:        "",
    description: "",
    category:    FOOD_CATEGORIES[0],
    price:       "",
    currency:    "CAD",
    prepTime:    "30 mins",
    city:        "",
    province:    "Ontario",
    country:     "Canada",
    phone:       "",
    whatsapp:    "",
  });

  function up(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }));
  }

  // Load existing listing in edit mode
  useEffect(() => {
    if (!edit) return;
    setEditLoading(true);
    getFoodListing(edit as string).then(listing => {
      if (!listing) return;
      setForm({
        name:        listing.name,
        description: listing.description,
        category:    listing.category,
        price:       String(listing.price),
        currency:    listing.currency || "CAD",
        prepTime:    listing.prepTime || "30 mins",
        city:        listing.city,
        province:    listing.province,
        country:     listing.country,
        phone:       listing.phone || "",
        whatsapp:    listing.whatsapp || "",
      });
      if (listing.images?.length) setPreviews(listing.images);
      setEditLoading(false);
    });
  }, [edit]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setImages(prev => [...prev, ...files].slice(0, 5));
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => setPreviews(prev => [...prev, reader.result as string].slice(0, 5));
      reader.readAsDataURL(file);
    });
  }

  function removeImage(idx: number) {
    setPreviews(prev => prev.filter((_, i) => i !== idx));
    setImages(prev => prev.filter((_, i) => i !== idx));
  }

  async function uploadImages(): Promise<string[]> {
    if (images.length === 0) return [];
    setUploading(true);
    try {
      const urls = await Promise.all(images.map(async file => {
        const path = `foodListings/${user!.uid}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, path);
        const task = uploadBytesResumable(storageRef, file);
        await new Promise((res, rej) => task.on("state_changed", null, rej, res as any));
        return getDownloadURL(task.snapshot.ref);
      }));
      return urls;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !userDoc) { router.push("/auth/login?redirect=/food/post"); return; }
    if (!form.name || !form.price || !form.city) {
      toast.error("Please fill in name, price and city");
      return;
    }

    setSaving(true);
    try {
      const newImageUrls = await uploadImages();
      const existingUrls = previews.filter(p => p.startsWith("http"));
      const allImages = [...existingUrls, ...newImageUrls];

      const data = {
        name:        form.name,
        description: form.description,
        category:    form.category,
        price:       parseFloat(form.price) || 0,
        currency:    form.currency,
        prepTime:    form.prepTime,
        images:      allImages,
        city:        form.city,
        province:    form.province,
        country:     form.country,
        phone:       form.phone,
        whatsapp:    form.whatsapp,
      };

      if (isEditMode) {
        await updateFoodListing(edit as string, data);
        toast.success("Listing updated! ✅");
        router.push(`/food/${edit}`);
      } else {
        const id = await createFoodListing({
          sellerId:    user.uid,
          sellerName:  userDoc.displayName,
          sellerPhoto: userDoc.photoURL || "",
          status:      "active",
          ...data,
        });
        toast.success("Food listing posted! 🎉");
        router.push(`/food/${id}`);
      }
    } catch (err: any) {
      console.error("Post food error:", err);
      toast.error(err?.message || "Failed to post listing");
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full px-4 py-3 rounded-xl border text-sm font-dm-sans focus:outline-none transition-colors";
  const inpStyle = { background:"#fff", borderColor:"#D4CFC6", color:"#1A1714" };

  return (
    <>
      <Head><title>{isEditMode ? "Edit Food Listing" : "Post Food"} — Planet Mall</title></Head>
      <Layout>
        <div className="min-h-screen pb-20 px-4" style={{background:"#F6F1E9"}}>
          <div className="max-w-2xl mx-auto pt-8">
            <h1 className="font-syne font-bold text-3xl mb-1" style={{color:"#1A1714"}}>
              {isEditMode ? "Edit food listing" : "Post a food listing"}
            </h1>
            <p className="text-sm font-dm-sans mb-8" style={{color:"#8A8480"}}>
              No store needed — buyers pay securely and you get paid the moment they confirm delivery.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Photos */}
              <div className="p-6 rounded-2xl" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <h2 className="font-syne font-bold text-lg mb-4" style={{color:"#1A1714"}}>Photos</h2>
                <div className="flex gap-3 flex-wrap">
                  {previews.map((src, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(i)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center">
                        ×
                      </button>
                    </div>
                  ))}
                  {previews.length < 5 && (
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center text-2xl"
                      style={{borderColor:"#D4CFC6",color:"#8A8480"}}>
                      +
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
              </div>

              {/* Basic info */}
              <div className="p-6 rounded-2xl space-y-4" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <h2 className="font-syne font-bold text-lg" style={{color:"#1A1714"}}>What are you selling?</h2>
                <input className={inp} style={inpStyle} value={form.name} onChange={e=>up("name",e.target.value)}
                  placeholder="e.g. Homemade Jollof Rice (large tray)" />
                <textarea className={inp} style={inpStyle} rows={3} value={form.description} onChange={e=>up("description",e.target.value)}
                  placeholder="Describe the food — ingredients, portion size, spice level..." />
                <select className={inp} style={inpStyle} value={form.category} onChange={e=>up("category",e.target.value)}>
                  {FOOD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div>
                  <label className="block text-xs font-dm-sans mb-1.5" style={{color:"#8A8480"}}>Prep time</label>
                  <select className={inp} style={inpStyle} value={form.prepTime} onChange={e=>up("prepTime",e.target.value)}>
                    {["Ready now","15 mins","30 mins","1 hour","2+ hours","Next day"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Price */}
              <div className="p-6 rounded-2xl space-y-3" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <h2 className="font-syne font-bold text-lg" style={{color:"#1A1714"}}>Price</h2>
                <select className={inp} style={inpStyle} value={form.currency} onChange={e=>up("currency",e.target.value)}>
                  {[
                    {code:"CAD", label:"🇨🇦 CAD — Canadian Dollar"},
                    {code:"USD", label:"🇺🇸 USD — US Dollar"},
                    {code:"GBP", label:"🇬🇧 GBP — British Pound"},
                    {code:"GHS", label:"🇬🇭 GHS — Ghanaian Cedi"},
                    {code:"NGN", label:"🇳🇬 NGN — Nigerian Naira"},
                  ].map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-dm-sans font-semibold text-sm" style={{color:"#8A8480"}}>{form.currency}</span>
                  <input className={`${inp} pl-16`} style={inpStyle} type="number" value={form.price} onChange={e=>up("price",e.target.value)} placeholder="0.00" />
                </div>
              </div>

              {/* Location */}
              <div className="p-6 rounded-2xl space-y-4" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <h2 className="font-syne font-bold text-lg" style={{color:"#1A1714"}}>Location</h2>
                <div className="grid grid-cols-2 gap-3">
                  <input className={inp} style={inpStyle} value={form.city} onChange={e=>up("city",e.target.value)} placeholder="City *" />
                  <select className={inp} style={inpStyle} value={form.province} onChange={e=>up("province",e.target.value)}>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Contact */}
              <div className="p-6 rounded-2xl space-y-4" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <h2 className="font-syne font-bold text-lg" style={{color:"#1A1714"}}>Contact (optional)</h2>
                <input className={inp} style={inpStyle} type="tel" value={form.phone} onChange={e=>up("phone",e.target.value)} placeholder="Phone number" />
                <input className={inp} style={inpStyle} type="tel" value={form.whatsapp} onChange={e=>up("whatsapp",e.target.value)} placeholder="WhatsApp number" />
              </div>

              <button type="submit" disabled={saving || uploading}
                className="w-full py-4 rounded-xl text-white font-dm-sans font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2"
                style={{background:"#C4531A"}}>
                {saving || uploading
                  ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{uploading?"Uploading photos...":isEditMode?"Saving changes...":"Posting..."}</>
                  : isEditMode ? "Save changes →" : "Post food listing →"}
              </button>
              <p className="text-xs text-center font-dm-sans" style={{color:"#8A8480"}}>
                Free to post. Payment held securely and released the moment the buyer confirms delivery.
              </p>
            </form>
          </div>
        </div>
      </Layout>
    </>
  );
}

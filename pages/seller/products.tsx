// pages/seller/products.tsx
// ─── SELLER PRODUCT MANAGEMENT (PHASE 3) ────────────────────────
// Add / edit / delete products with image upload
// Design: cream bg, editorial, Playfair + DM Sans

import Head                  from "next/head";
import Link                  from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter }         from "next/router";
import toast                 from "react-hot-toast";
import ProtectedRoute        from "@/components/ProtectedRoute";
import { useAuth }           from "@/context/AuthContext";
import { getShopByOwner }    from "@/services/shopService";
import {
  getProductsByShop, createProduct, updateProduct,
  deleteProduct, uploadProductImage,
} from "@/services/productService";
import { canAddProduct, getUpgradeMessage } from "@/lib/freeTier";
import type { ShopData }     from "@/services/shopService";
import type { ProductData }  from "@/services/productService";

const CATEGORIES = [
  "Fashion & Apparel","Electronics","Home & Living","Beauty & Health",
  "Food & Beverages","Sports & Outdoors","Art & Crafts","Books & Media",
  "Toys & Games","Automotive","Pets","Digital Products","Other",
];

const EMPTY_PRODUCT = {
  name:"", description:"", price:"", comparePrice:"",
  category:"", stock:"10", sku:"", weight:"",
  shipping:"standard", tags:"", status:"live",
};

export default function ProductsPage() {
  return (
    <ProtectedRoute requireRole="seller">
      <ProductManager />
    </ProtectedRoute>
  );
}

function ProductManager() {
  const { user, isPremium } = useAuth();
  const router    = useRouter();
  const [shop,     setShop]     = useState<ShopData|null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing,  setEditing]  = useState<ProductData|null>(null);
  const [form,     setForm]     = useState(EMPTY_PRODUCT);
  const [images,   setImages]   = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving,   setSaving]   = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    getShopByOwner(user.uid).then(s => {
      if (!s) { router.push("/seller/create-shop"); return; }
      setShop(s);
      getProductsByShop(s.shopId!).then(p => { setProducts(p); setLoading(false); });
    });
  }, [user, router]);

  // Open new product modal
  function openNew() {
    if (!canAddProduct(products.length, isPremium)) {
      toast.error(getUpgradeMessage("products"));
      router.push("/pricing");
      return;
    }
    setEditing(null);
    setForm(EMPTY_PRODUCT);
    setImages([]);
    setPreviews([]);
    setShowModal(true);
  }

  // Open edit modal
  function openEdit(p: ProductData) {
    setEditing(p);
    setForm({
      name:         p.name,
      description:  p.description,
      price:        String(p.price),
      comparePrice: String(p.comparePrice || ""),
      category:     p.category,
      stock:        String(p.stock),
      sku:          p.sku || "",
      weight:       String(p.weight || ""),
      shipping:     p.shipping || "standard",
      tags:         p.tags?.join(", ") || "",
      status:       p.status,
    });
    setPreviews(p.images || []);
    setImages([]);
    setShowModal(true);
  }

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 5);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  }

  async function handleSave() {
    if (!shop || !user) return;
    if (!form.name || !form.price || !form.category) {
      toast.error("Name, price and category are required");
      return;
    }
    setSaving(true);
    try {
      let imageURLs: string[] = editing?.images || [];

      // Upload new images if any
      if (images.length > 0) {
        const tempId = editing?.productId || `temp-${Date.now()}`;
        imageURLs = await Promise.all(
          images.map((file, i) =>
            uploadProductImage(file, shop.shopId!, tempId, i, setUploadPct)
          )
        );
      }

      const data: Omit<ProductData, "productId"> = {
        shopId:      shop.shopId!,
        ownerId:     user.uid,
        name:        form.name,
        description: form.description,
        price:       parseFloat(form.price) || 0,
        comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : null,
        category:    form.category,
        images:      imageURLs,
        status:      form.status as any,
        stock:       parseInt(form.stock) || 0,
        sku:         form.sku,
        weight:      parseFloat(form.weight) || 0,
        shipping:    form.shipping as any,
        tags:        form.tags.split(",").map(t => t.trim()).filter(Boolean),
        views:       editing?.views || 0,
        orders:      editing?.orders || 0,
        rating:      editing?.rating || 0,
        reviewCount: editing?.reviewCount || 0,
        aiGenerated: editing?.aiGenerated || false,
        currency:    "CAD",
      };

      if (editing) {
        await updateProduct(editing.productId!, data);
        toast.success("Product updated");
      } else {
        await createProduct(data);
        toast.success("Product added!");
      }

      // Reload products
      const updated = await getProductsByShop(shop.shopId!);
      setProducts(updated);
      setShowModal(false);
    } catch(err) {
      console.error(err);
      toast.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(productId: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    await deleteProduct(productId);
    setProducts(p => p.filter(x => x.productId !== productId));
    toast.success("Product deleted");
  }

  const inp = "w-full px-4 py-2.5 rounded-xl border text-sm font-dm-sans focus:outline-none transition-colors";
  const inpStyle = { background:"#fff", borderColor:"#D4CFC6", color:"#1A1714" };

  return (
    <>
      <Head>
        <title>Products — {shop?.name || "Planet Mall"}</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen" style={{background:"#F6F1E9",color:"#1A1714"}}>

        {/* Topbar */}
        <div style={{background:"#1A1714"}} className="px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <img src="/logo.jpg" alt="" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-syne font-bold text-paper text-lg hidden sm:block">Planet Mall</span>
            </div>
            <nav className="hidden md:flex gap-5 text-sm font-dm-sans">
              {[
                {href:"/seller/dashboard",label:"Dashboard"},
                {href:"/seller/products", label:"Products"},
                {href:"/seller/orders",   label:"Orders"},
              ].map(({href,label})=>(
                <Link key={href} href={href} style={{color:router.pathname===href?"#C4531A":"#8A8480"}}>{label}</Link>
              ))}
            </nav>
          </div>
          <button onClick={openNew}
            className="px-4 py-2 rounded-full text-sm font-dm-sans font-semibold text-white"
            style={{background:"#C4531A"}}>
            + Add product
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 style={{fontFamily:"'Playfair Display',serif"}} className="text-3xl font-bold">Products</h1>
              <p className="text-sm font-dm-sans mt-1" style={{color:"#8A8480"}}>{products.length} total · {products.filter(p=>p.status==="live").length} live</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#C4531A"}} />
            </div>
          ) : products.length === 0 ? (
            <div className="py-24 text-center rounded-2xl" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
              <p className="text-5xl mb-4">🏷</p>
              <h2 style={{fontFamily:"'Playfair Display',serif"}} className="text-2xl font-bold mb-2">No products yet</h2>
              <p className="text-sm font-dm-sans mb-6" style={{color:"#8A8480"}}>Add your first product to start selling</p>
              <button onClick={openNew}
                className="px-6 py-3 rounded-xl text-white font-dm-sans font-semibold"
                style={{background:"#C4531A"}}>
                Add first product
              </button>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
              <table className="w-full text-sm font-dm-sans">
                <thead>
                  <tr style={{borderBottom:"1px solid #E8E2D9"}}>
                    {["Product","Price","Stock","Status","Orders","Actions"].map(h=>(
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{color:"#8A8480"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map(p=>(
                    <tr key={p.productId} style={{borderBottom:"1px solid #F6F1E9"}}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{background:"#F6F1E9"}}>
                            {p.images?.[0]
                              ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>}
                          </div>
                          <div>
                            <p className="font-medium" style={{color:"#1A1714"}}>{p.name}</p>
                            <p className="text-xs" style={{color:"#8A8480"}}>{p.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold" style={{color:"#1A1714"}}>{formatCurrency(p.price,"CAD")}</p>
                        {p.comparePrice && <p className="text-xs line-through" style={{color:"#8A8480"}}>{formatCurrency(p.comparePrice,"CAD")}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <span style={{color:p.stock<=5?"#C4531A":"#1A1714"}}>{p.stock}</span>
                        {p.stock<=5 && <span className="ml-1 text-[10px] font-bold" style={{color:"#C4531A"}}>Low</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                          style={{
                            background:p.status==="live"?"#2A6B4515":p.status==="draft"?"#D4A84B15":"#C4531A15",
                            color:p.status==="live"?"#2A6B45":p.status==="draft"?"#D4A84B":"#C4531A",
                          }}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4" style={{color:"#8A8480"}}>{p.orders||0}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3">
                          <button onClick={()=>openEdit(p)} className="text-xs font-medium" style={{color:"#C4531A"}}>Edit</button>
                          <button onClick={()=>handleDelete(p.productId!)} className="text-xs font-medium" style={{color:"#8A8480"}}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Add/Edit Modal ──────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
          style={{background:"rgba(0,0,0,0.6)"}}>
          <div className="w-full max-w-2xl rounded-2xl shadow-2xl" style={{background:"#F6F1E9"}}>
            <div className="px-6 py-5 flex items-center justify-between" style={{borderBottom:"1px solid #E8E2D9"}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",color:"#1A1714"}} className="text-2xl font-bold">
                {editing ? "Edit product" : "Add product"}
              </h2>
              <button onClick={()=>setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full"
                style={{background:"#E8E2D9",color:"#8A8480"}}>✕</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Images */}
              <div>
                <label className="block text-sm font-semibold font-syne mb-2" style={{color:"#1A1714"}}>
                  Product images <span className="text-xs font-normal font-dm-sans" style={{color:"#8A8480"}}>Up to 5</span>
                </label>
                <div className="flex gap-3 flex-wrap mb-3">
                  {previews.map((src,i)=>(
                    <div key={i} className="w-20 h-20 rounded-xl overflow-hidden" style={{border:"1px solid #D4CFC6"}}>
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {previews.length < 5 && (
                    <button type="button" onClick={()=>fileRef.current?.click()}
                      className="w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center"
                      style={{borderColor:"#D4CFC6",color:"#8A8480"}}>
                      <span className="text-2xl">+</span>
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImagePick} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Product name *</label>
                  <input className={inp} style={inpStyle} value={form.name}
                    onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Premium Cotton T-Shirt"
                    onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                </div>
                <div>
                  <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Price (CAD) *</label>
                  <input className={inp} style={inpStyle} type="number" value={form.price}
                    onChange={e=>setForm(f=>({...f,price:e.target.value}))} placeholder="29.99"
                    onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                </div>
                <div>
                  <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Compare price</label>
                  <input className={inp} style={inpStyle} type="number" value={form.comparePrice}
                    onChange={e=>setForm(f=>({...f,comparePrice:e.target.value}))} placeholder="39.99 (original)"
                    onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                </div>
                <div>
                  <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Category *</label>
                  <select className={inp} style={inpStyle} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                    <option value="">Select</option>
                    {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Stock</label>
                  <input className={inp} style={inpStyle} type="number" value={form.stock}
                    onChange={e=>setForm(f=>({...f,stock:e.target.value}))} placeholder="10"
                    onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                </div>
                <div>
                  <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>SKU</label>
                  <input className={inp} style={inpStyle} value={form.sku}
                    onChange={e=>setForm(f=>({...f,sku:e.target.value}))} placeholder="PROD-001"
                    onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                </div>
                <div>
                  <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Shipping</label>
                  <select className={inp} style={inpStyle} value={form.shipping} onChange={e=>setForm(f=>({...f,shipping:e.target.value}))}>
                    <option value="standard">Standard</option>
                    <option value="express">Express</option>
                    <option value="pickup">Pickup only</option>
                    <option value="digital">Digital delivery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Status</label>
                  <select className={inp} style={inpStyle} value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                    <option value="live">Live</option>
                    <option value="draft">Draft</option>
                    <option value="sold_out">Sold out</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold font-syne" style={{color:"#1A1714"}}>Description</label>
                    <button type="button"
                      onClick={async () => {
                        if (!form.name) { alert("Add a product name first"); return; }
                        const res = await fetch("/api/ai/product-description", {
                          method:"POST", headers:{"Content-Type":"application/json"},
                          body: JSON.stringify({ productName:form.name, category:form.category, price:form.price }),
                        });
                        const data = await res.json();
                        if (data.description) setForm(f=>({...f, description:data.description}));
                      }}
                      className="text-xs font-dm-sans font-semibold px-3 py-1 rounded-full flex items-center gap-1"
                      style={{background:"rgba(212,168,75,0.1)",color:"#D4A84B",border:"1px solid rgba(212,168,75,0.2)"}}>
                      ✦ Write with AI
                    </button>
                  </div>
                  <textarea className={`${inp} resize-none`} style={inpStyle} rows={4}
                    value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                    placeholder="Describe your product..."
                    onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>
                    Tags <span className="text-xs font-normal font-dm-sans" style={{color:"#8A8480"}}>Comma separated</span>
                  </label>
                  <input className={inp} style={inpStyle} value={form.tags}
                    onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="cotton, unisex, summer"
                    onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                </div>
              </div>

              {saving && uploadPct > 0 && uploadPct < 100 && (
                <div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{background:"#E8E2D9"}}>
                    <div className="h-full rounded-full" style={{width:`${uploadPct}%`,background:"#C4531A"}} />
                  </div>
                  <p className="text-xs mt-1 text-center font-dm-sans" style={{color:"#8A8480"}}>Uploading... {uploadPct}%</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 flex justify-between" style={{borderTop:"1px solid #E8E2D9"}}>
              <button onClick={()=>setShowModal(false)}
                className="px-5 py-2.5 rounded-xl font-dm-sans text-sm"
                style={{color:"#8A8480",border:"1px solid #D4CFC6"}}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2.5 rounded-xl text-white font-dm-sans font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
                style={{background:"#C4531A"}}>
                {saving
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{editing?"Saving...":"Adding..."}</>
                  : editing ? "Save changes" : "Add product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

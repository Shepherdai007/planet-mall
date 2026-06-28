// pages/rooms/create.tsx
// ─── CREATE A PLANET ROOM ─────────────────────────────────────────

import Head         from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import Layout        from "@/components/Layout";
import { useAuth }   from "@/context/AuthContext";
import { createRoom, ROOM_CATEGORIES } from "@/services/roomService";
import toast         from "react-hot-toast";

export default function CreateRoomPage() {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    name:        "",
    description: "",
    category:    "Other",
    price:       "",
    isPrivate:   false,
    photo:       "",
  });
  const [saving, setSaving] = useState(false);

  function set(k: string, v: any) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit() {
    if (!isLoggedIn || !user) { toast.error("Sign in first"); return; }
    if (!form.name.trim())    { toast.error("Room name required"); return; }
    if (!form.description.trim()) { toast.error("Description required"); return; }

    setSaving(true);
    try {
      const roomId = await createRoom({
        ownerId:    user.uid,
        ownerName:  user.displayName || "Anonymous",
        ownerPhoto: user.photoURL    || "",
        name:       form.name.trim(),
        description: form.description.trim(),
        category:   form.category,
        photo:      form.photo,
        price:      parseFloat(form.price) || 0,
        currency:   "CAD",
        isPrivate:  form.isPrivate,
        status:     "active",
      });
      toast.success("Room created! 🎉");
      router.push(`/rooms/${roomId}`);
    } catch (e) {
      toast.error("Failed to create room");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Head><title>Create Room — Planet Mall</title></Head>
      <Layout>
        <div className="min-h-screen pb-20" style={{background:"#0A0908"}}>
          <div className="max-w-lg mx-auto px-4 pt-8">

            <button onClick={() => router.back()}
              className="text-sm font-dm-sans mb-6 block" style={{color:"#8A8480"}}>
              ← Back
            </button>

            <h1 className="font-syne font-bold text-2xl text-paper mb-1">Create a Room</h1>
            <p className="text-sm font-dm-sans mb-8" style={{color:"#8A8480"}}>
              Build your paid community. Planet Mall takes 10% commission.
            </p>

            <div className="space-y-4">

              {/* Name */}
              <div>
                <label className="text-xs font-dm-sans font-semibold mb-1.5 block" style={{color:"#8A8480"}}>ROOM NAME *</label>
                <input value={form.name} onChange={e => set("name", e.target.value)}
                  placeholder="e.g. VIP Sports Picks"
                  className="w-full px-4 py-3 rounded-xl text-sm font-dm-sans text-paper outline-none"
                  style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)"}} />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-dm-sans font-semibold mb-1.5 block" style={{color:"#8A8480"}}>DESCRIPTION *</label>
                <textarea value={form.description} onChange={e => set("description", e.target.value)}
                  placeholder="What is your room about?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm font-dm-sans text-paper outline-none resize-none"
                  style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)"}} />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-dm-sans font-semibold mb-1.5 block" style={{color:"#8A8480"}}>CATEGORY</label>
                <select value={form.category} onChange={e => set("category", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm font-dm-sans text-paper outline-none"
                  style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)"}}>
                  {ROOM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="text-xs font-dm-sans font-semibold mb-1.5 block" style={{color:"#8A8480"}}>MONTHLY PRICE (CAD) — set 0 for free</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-dm-sans" style={{color:"#8A8480"}}>CA$</span>
                  <input value={form.price} onChange={e => set("price", e.target.value)}
                    type="number" min="0" step="0.01" placeholder="9.99"
                    className="w-full pl-12 pr-4 py-3 rounded-xl text-sm font-dm-sans text-paper outline-none"
                    style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)"}} />
                </div>
                {form.price && parseFloat(form.price) > 0 && (
                  <p className="text-xs font-dm-sans mt-1" style={{color:"#8A8480"}}>
                    You receive CA${(parseFloat(form.price) * 0.9).toFixed(2)}/member/month after 10% commission
                  </p>
                )}
              </div>

              {/* Photo URL */}
              <div>
                <label className="text-xs font-dm-sans font-semibold mb-1.5 block" style={{color:"#8A8480"}}>ROOM PHOTO URL (optional)</label>
                <input value={form.photo} onChange={e => set("photo", e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl text-sm font-dm-sans text-paper outline-none"
                  style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)"}} />
              </div>

              {/* Submit */}
              <button onClick={handleSubmit} disabled={saving}
                className="w-full py-3.5 rounded-xl font-dm-sans font-bold text-sm transition-all mt-2 disabled:opacity-50"
                style={{background:"#C4531A",color:"#fff"}}>
                {saving ? "Creating..." : "Create Room 🏠"}
              </button>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

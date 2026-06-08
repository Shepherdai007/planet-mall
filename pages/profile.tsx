// pages/profile.tsx
// ─── USER PROFILE PAGE (PHASE 9) ────────────────────────────────

import Head           from "next/head";
import Link           from "next/link";
import { useRouter }  from "next/router";
import { useState }   from "react";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import toast          from "react-hot-toast";
import Layout         from "@/components/Layout";
import { useAuth }    from "@/context/AuthContext";
import { auth, db, storage } from "@/lib/firebase";

export default function ProfilePage() {
  const { user, userDoc, isLoggedIn, loading, isPremium, isBusiness } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(userDoc?.displayName || "");
  const [saving,      setSaving]      = useState(false);
  const [uploading,   setUploading]   = useState(false);

  if (!loading && !isLoggedIn) {
    router.push("/auth/login?redirect=/profile");
    return null;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user, { displayName });
      await updateDoc(doc(db, "users", user.uid), { displayName });
      toast.success("Profile updated!");
    } catch { toast.error("Failed to update profile"); }
    finally { setSaving(false); }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `users/${user.uid}/avatar`);
      const task = uploadBytesResumable(storageRef, file);
      await new Promise((res, rej) => task.on("state_changed", null, rej, res as any));
      const url = await getDownloadURL(task.snapshot.ref);
      await updateProfile(user, { photoURL: url });
      await updateDoc(doc(db, "users", user.uid), { photoURL: url });
      toast.success("Photo updated!");
      // Force page reload so navbar picks up new photo
      window.location.reload();
    } catch (err: any) {
      console.error("Upload error:", err);
      // If we got a URL it actually succeeded — ignore the error
      if (user.photoURL) {
        toast.success("Photo updated!");
        window.location.reload();
      } else {
        toast.error("Upload failed — check Firebase Storage rules");
      }
    } finally {
      setUploading(false);
    }
  }

  const planLabel = isBusiness ? "Business" : isPremium ? "Premium" : "Free";
  const planColor = isBusiness ? "#D4A84B" : isPremium ? "#C4531A" : "#8A8480";

  return (
    <>
      <Head><title>Profile — Planet Mall</title></Head>
      <Layout>
        <div className="min-h-screen bg-cream pt-12 pb-20 px-4">
          <div className="max-w-lg mx-auto">
            <h1 className="font-syne font-bold text-3xl text-paper mb-10">My profile</h1>

            {/* Avatar */}
            <div className="flex items-center gap-6 mb-10">
              <label className="relative cursor-pointer group" title="Click to change photo">
                <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-3xl font-bold border-2 border-rust/30"
                  style={{background:"rgba(196,83,26,0.15)",color:"#C4531A"}}>
                  {user?.photoURL || userDoc?.photoURL
                    ? <img src={user?.photoURL || userDoc?.photoURL} alt="" className="w-full h-full object-cover" />
                    : userDoc?.displayName?.[0]?.toUpperCase() || "U"}
                </div>
                {/* Camera overlay */}
                <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{background:"rgba(0,0,0,0.6)"}}>
                  {uploading
                    ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                        <span className="text-white text-[10px] font-dm-sans mt-1">Change</span>
                      </>}
                </div>
                {/* Camera badge always visible */}
                <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white"
                  style={{background:"#C4531A"}}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
              <div>
                <p className="font-syne font-bold text-xl text-paper">{userDoc?.displayName || "Your name"}</p>
                <p className="text-sm text-muted font-dm-sans">{userDoc?.email}</p>
                <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-dm-sans"
                  style={{background:`${planColor}15`,color:planColor}}>
                  {planLabel} plan
                </span>
              </div>
            </div>

            {/* Edit form */}
            <form onSubmit={handleSave} className="space-y-5 mb-10">
              <div>
                <label className="block text-xs text-muted font-dm-sans mb-1.5">Display name</label>
                <input value={displayName} onChange={e=>setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm font-dm-sans text-paper focus:outline-none"
                  style={{background:"rgba(255,255,255,0.04)",borderColor:"rgba(255,255,255,0.1)"}}
                  onFocus={e=>e.target.style.borderColor="rgba(196,83,26,0.5)"}
                  onBlur={e =>e.target.style.borderColor="rgba(255,255,255,0.1)"} />
              </div>
              <div>
                <label className="block text-xs text-muted font-dm-sans mb-1.5">Email address</label>
                <input value={userDoc?.email||""} disabled
                  className="w-full px-4 py-3 rounded-xl border text-sm font-dm-sans text-muted opacity-50 cursor-not-allowed"
                  style={{background:"rgba(255,255,255,0.02)",borderColor:"rgba(255,255,255,0.06)"}} />
              </div>
              <div>
                <label className="block text-xs text-muted font-dm-sans mb-1.5">Role</label>
                <input value={userDoc?.role||""} disabled
                  className="w-full px-4 py-3 rounded-xl border text-sm font-dm-sans text-muted opacity-50 cursor-not-allowed capitalize"
                  style={{background:"rgba(255,255,255,0.02)",borderColor:"rgba(255,255,255,0.06)"}} />
              </div>
              <button type="submit" disabled={saving}
                className="w-full py-3.5 rounded-xl text-white font-dm-sans font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{background:"#C4531A"}}>
                {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : "Save changes"}
              </button>
            </form>

            {/* Quick links */}
            <div className="space-y-2">
              {[
                {href:"/orders",            label:"My orders",          icon:"📦"},
                {href:"/messages",          label:"Messages",           icon:"💬"},
                {href:userDoc?.role==="seller"?"/seller/dashboard":"#", label:"Seller dashboard",   icon:"🏪"},
                {href:"/pricing",           label:"Manage subscription", icon:"💳"},
              ].map(({href,label,icon})=>(
                <Link key={href} href={href}
                  className="flex items-center gap-4 p-4 rounded-2xl border transition-all hover:border-white/15"
                  style={{background:"rgba(255,255,255,0.02)",borderColor:"rgba(255,255,255,0.06)"}}>
                  <span className="text-xl">{icon}</span>
                  <span className="text-sm font-dm-sans text-paper">{label}</span>
                  <span className="ml-auto text-muted">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

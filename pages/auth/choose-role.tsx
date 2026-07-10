// pages/auth/choose-role.tsx
// ─── CHOOSE ROLE — GOOGLE SIGN-IN GAP FILLER ─────────────────────
// Reached only when someone signs in with Google for the first time
// via the LOGIN page (not signup) and has no Firestore user document
// yet. signInWithGoogle() authenticates with Firebase but never
// creates that document on its own — this page finishes that setup
// by asking buyer/seller, same as signup, then creates the doc and
// sends them on their way (sellers go on to phone verification,
// same as the normal signup flow).

import Head           from "next/head";
import { useRouter }  from "next/router";
import { useState }   from "react";
import toast           from "react-hot-toast";
import { useAuth }    from "@/context/AuthContext";
import { createUserDocument } from "@/lib/auth";

type Role = "buyer" | "seller";

export default function ChooseRolePage() {
  const router  = useRouter();
  const { user, loading } = useAuth();
  const redirect = (router.query.redirect as string) || "/";
  const [saving, setSaving] = useState<Role | null>(null);

  async function handleSelect(role: Role) {
    if (!user) {
      // Shouldn't happen — but if somehow not logged in, send to login
      router.push("/auth/login");
      return;
    }
    setSaving(role);
    try {
      await createUserDocument(user, role, user.displayName || "");
      toast.success("Welcome to Planet Mall 🎉");

      if (role === "seller") {
        router.push(`/auth/verify-phone?redirect=${encodeURIComponent(redirect)}`);
      } else {
        router.push(redirect);
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong — please try again");
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background:"#0A0908"}}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#C4531A"}} />
      </div>
    );
  }

  return (
    <>
      <Head><title>Welcome — Planet Mall</title></Head>
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{background:"#0A0908"}}>
        <div className="w-full max-w-[480px]">

          <div className="flex items-center gap-2.5 mb-10 justify-center">
            <img src="/logo.jpg" alt="Planet Mall" className="w-9 h-9 rounded-lg object-cover" />
            <span className="font-syne font-bold text-xl text-paper">Planet Mall</span>
          </div>

          <h1 className="font-syne font-bold text-3xl text-paper mb-2 text-center">One last thing</h1>
          <p className="text-muted font-dm-sans text-sm mb-10 text-center">How will you use Planet Mall?</p>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleSelect("buyer")} disabled={saving !== null}
              className="group p-6 bg-white/[0.03] border border-white/10 rounded-2xl hover:border-rust/40 hover:bg-rust/5 transition-all text-left disabled:opacity-50">
              {saving === "buyer"
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mb-4" />
                : <div className="text-3xl mb-4">🛍️</div>}
              <p className="font-syne font-semibold text-paper mb-2">I'm a buyer</p>
              <p className="text-xs text-muted font-dm-sans leading-relaxed">Shop from thousands of sellers worldwide.</p>
            </button>
            <button onClick={() => handleSelect("seller")} disabled={saving !== null}
              className="group p-6 bg-white/[0.03] border border-white/10 rounded-2xl hover:border-rust/40 hover:bg-rust/5 transition-all text-left disabled:opacity-50">
              {saving === "seller"
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mb-4" />
                : <div className="text-3xl mb-4">🏪</div>}
              <p className="font-syne font-semibold text-paper mb-2">I'm a seller</p>
              <p className="text-xs text-muted font-dm-sans leading-relaxed">Open a store and sell worldwide with AI tools.</p>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

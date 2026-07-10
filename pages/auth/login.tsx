// pages/auth/login.tsx
// ─── SIGN IN PAGE (PHASE 1) ──────────────────────────────────────
// Email/password + Google sign in.
// Redirects to ?redirect= param after success, or home.

import Head            from "next/head";
import Link            from "next/link";
import { useRouter }   from "next/router";
import { useState }    from "react";
import toast           from "react-hot-toast";
import { signInWithEmail, signInWithGoogle } from "@/lib/auth";
import { useAuth }     from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db }          from "@/lib/firebase";

export default function LoginPage() {
  const router   = useRouter();
  const { isLoggedIn } = useAuth();
  const redirect = (router.query.redirect as string) || "/";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // If already logged in, redirect
  if (isLoggedIn) {
    router.replace(redirect);
    return null;
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      toast.success("Welcome back!");
      router.push(redirect);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      if (msg.includes("user-not-found") || msg.includes("wrong-password")) {
        toast.error("Email or password is incorrect");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      const user = await signInWithGoogle();

      // signInWithGoogle only authenticates with Firebase — it does NOT
      // create a Firestore user document. If this is someone's very
      // first time signing in (they've never used email signup or
      // Google before), no doc exists yet, meaning no role, no phone
      // verification status, nothing. Send them to pick buyer/seller
      // and finish setup before letting them into the app.
      const userDocSnap = await getDoc(doc(db, "users", user.uid));

      if (!userDocSnap.exists()) {
        router.push(`/auth/choose-role?redirect=${encodeURIComponent(redirect)}`);
        return;
      }

      toast.success("Signed in with Google");
      router.push(redirect);
    } catch {
      toast.error("Google sign in failed");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Sign in — Planet Mall</title>
      </Head>

      <div className="min-h-screen bg-void flex">

        {/* ── Left: branding panel (hidden on mobile) ─────────── */}
        <div className="hidden lg:flex w-1/2 flex-col justify-between p-16 relative overflow-hidden" style={{background:"#0D0B0A"}}>
          {/* Video background */}
          <video autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover" style={{zIndex:0}}>
            <source src="/auth-bg1.mp4" type="video/mp4" />
          </video>
          {/* Dark overlay */}
          <div className="absolute inset-0" style={{background:"rgba(10,9,8,0.7)",zIndex:1}} />
          <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-rust/10 rounded-full blur-3xl" style={{zIndex:1}} />

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="Planet Mall" className="w-9 h-9 rounded-lg object-cover" />
            <span className="font-syne font-bold text-2xl text-paper">Planet Mall</span>
          </div>

          {/* Quote */}
          <div className="relative z-10">
            <p className="font-syne font-bold text-4xl text-paper leading-tight mb-6">
              The world's market,<br />
              <span className="text-rust">in your pocket.</span>
            </p>
            <p className="text-muted font-dm-sans text-sm leading-relaxed max-w-sm">
              Thousands of sellers across Africa and beyond are growing their businesses
              on Planet Mall — powered by AI, built for humans.
            </p>
          </div>

          {/* Stats */}
          <div className="relative z-10 flex gap-8">
            {[
              { v: "12K+", l: "Sellers" },
              { v: "89K+", l: "Products" },
              { v: "14+",  l: "Countries" },
            ].map(({ v, l }) => (
              <div key={l}>
                <p className="font-syne font-bold text-xl text-paper">{v}</p>
                <p className="text-xs text-muted font-dm-sans">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: form ─────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[400px]">

            <div className="lg:hidden flex items-center gap-2.5 mb-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" alt="Planet Mall" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-syne font-bold text-xl text-paper">Planet Mall</span>
            </div>

            <h1 className="font-syne font-bold text-3xl text-paper mb-2">Welcome back</h1>
            <p className="text-muted font-dm-sans text-sm mb-8">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-rust hover:underline">
                Sign up free
              </Link>
            </p>

            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 border border-white/15 rounded-xl text-sm font-dm-sans text-paper hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            >
              {googleLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-xs text-muted font-dm-sans">or</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-dm-sans text-muted mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm font-dm-sans text-paper placeholder:text-muted/40 focus:outline-none focus:border-rust/50 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-dm-sans text-muted">Password</label>
                  <Link href="/auth/forgot-password" className="text-xs text-rust hover:underline font-dm-sans">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm font-dm-sans text-paper placeholder:text-muted/40 focus:outline-none focus:border-rust/50 transition-colors"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-paper transition-colors p-1">
                    {showPassword
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-rust text-white font-dm-sans font-semibold rounded-xl hover:bg-rust/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : "Sign in"}
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-muted/50 font-dm-sans">
              By continuing, you agree to Planet Mall's{" "}
              <Link href="/terms" className="text-muted hover:text-paper">Terms</Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-muted hover:text-paper">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

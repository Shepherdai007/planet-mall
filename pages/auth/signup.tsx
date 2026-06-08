// pages/auth/signup.tsx
// ─── SIGN UP PAGE (PHASE 1) ──────────────────────────────────────
// Step 1: Choose role (buyer / seller)
// Step 2: Fill email + password with strength meter
// Google signup also available.

import Head             from "next/head";
import Link             from "next/link";
import { useRouter }    from "next/router";
import { useState }     from "react";
import toast            from "react-hot-toast";
import {
  signUpWithEmail,
  signInWithGoogle,
  createUserDocument,
} from "@/lib/auth";
import {
  passwordStrength,
  strengthLabel,
  strengthColor,
} from "@/lib/helpers";
import { useAuth }      from "@/context/AuthContext";

type Role = "buyer" | "seller";

export default function SignupPage() {
  const router   = useRouter();
  const { isLoggedIn } = useAuth();

  const [step,     setStep]     = useState<1 | 2>(1);
  const [role,     setRole]     = useState<Role>("buyer");
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const pwStrength = passwordStrength(password);

  if (isLoggedIn) {
    router.replace("/");
    return null;
  }

  // Pre-select role from URL param (?role=seller)
  const urlRole = router.query.role as Role | undefined;
  if (urlRole && urlRole !== role && step === 1) setRole(urlRole);

  function handleRoleSelect(r: Role) {
    setRole(r);
    setStep(2);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (pwStrength < 2) {
      toast.error("Please choose a stronger password");
      return;
    }
    setLoading(true);
    try {
      await signUpWithEmail(email, password, name, role);
      toast.success("Account created! Welcome to Planet Mall 🎉");
      router.push(role === "seller" ? "/seller/create-shop" : "/explore");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signup failed";
      if (msg.includes("email-already-in-use")) {
        toast.error("An account with this email already exists");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setGoogleLoading(true);
    try {
      const user = await signInWithGoogle();
      // Google users still need a role assigned
      await createUserDocument(user, role, user.displayName || "");
      toast.success("Account created with Google!");
      router.push(role === "seller" ? "/seller/create-shop" : "/explore");
    } catch {
      toast.error("Google signup failed");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Create account — Planet Mall</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden" style={{background:"#0A0908"}}>
        {/* Video background */}
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" style={{zIndex:0}}>
          <source src="/auth-bg2.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0" style={{background:"rgba(10,9,8,0.75)",zIndex:1}} />
        <div className="w-full max-w-[480px]" style={{position:"relative",zIndex:2}}>

          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10 justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="Planet Mall" className="w-9 h-9 rounded-lg object-cover" />
            <span className="font-syne font-bold text-xl text-paper">Planet Mall</span>
          </div>

          {/* ── STEP 1: Role selection ──────────────────────── */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h1 className="font-syne font-bold text-3xl text-paper mb-2 text-center">
                Join Planet Mall
              </h1>
              <p className="text-muted font-dm-sans text-sm mb-10 text-center">
                How will you use Planet Mall?
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {/* Buyer card */}
                <button
                  onClick={() => handleRoleSelect("buyer")}
                  className="group p-6 bg-white/[0.03] border border-white/10 rounded-2xl hover:border-rust/40 hover:bg-rust/5 transition-all text-left"
                >
                  <div className="text-3xl mb-4">🛍️</div>
                  <p className="font-syne font-semibold text-paper mb-2">I'm a buyer</p>
                  <p className="text-xs text-muted font-dm-sans leading-relaxed">
                    Shop from thousands of sellers worldwide — discover anything.
                  </p>
                </button>

                {/* Seller card */}
                <button
                  onClick={() => handleRoleSelect("seller")}
                  className="group p-6 bg-white/[0.03] border border-white/10 rounded-2xl hover:border-rust/40 hover:bg-rust/5 transition-all text-left"
                >
                  <div className="text-3xl mb-4">🏪</div>
                  <p className="font-syne font-semibold text-paper mb-2">I'm a seller</p>
                  <p className="text-xs text-muted font-dm-sans leading-relaxed">
                    Open a store and sell to buyers worldwide with AI tools.
                  </p>
                </button>
              </div>

              <p className="text-center text-sm text-muted font-dm-sans">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-rust hover:underline">Sign in</Link>
              </p>
            </div>
          )}

          {/* ── STEP 2: Credentials ─────────────────────────── */}
          {step === 2 && (
            <div className="animate-fade-in">
              {/* Role badge + back */}
              <div className="flex items-center gap-3 mb-8">
                <button
                  onClick={() => setStep(1)}
                  className="p-2 text-muted hover:text-paper transition-colors"
                  aria-label="Back"
                >
                  ←
                </button>
                <span className="px-3 py-1 bg-rust/10 text-rust text-xs font-semibold rounded-full uppercase tracking-wide">
                  {role === "seller" ? "🏪 Opening a store" : "🛍️ Buyer account"}
                </span>
              </div>

              <h1 className="font-syne font-bold text-3xl text-paper mb-2">
                Create your account
              </h1>
              <p className="text-muted font-dm-sans text-sm mb-8">
                Already have one?{" "}
                <Link href="/auth/login" className="text-rust hover:underline">Sign in</Link>
              </p>

              {/* Google */}
              <button
                onClick={handleGoogleSignup}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-3.5 border border-white/15 rounded-xl text-sm font-dm-sans text-paper hover:bg-white/5 transition-all disabled:opacity-50 mb-6"
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

              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-xs text-muted font-dm-sans">or</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-xs font-dm-sans text-muted mb-1.5">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Your name"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm font-dm-sans text-paper placeholder:text-muted/40 focus:outline-none focus:border-rust/50 transition-colors"
                  />
                </div>

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
                  <label className="block text-xs font-dm-sans text-muted mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Min. 8 characters"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm font-dm-sans text-paper placeholder:text-muted/40 focus:outline-none focus:border-rust/50 transition-colors"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-paper transition-colors p-1">
                      {showPassword
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    </button>
                  </div>

                  {/* Password strength meter */}
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-1 flex-1 rounded-full transition-all"
                            style={{
                              background: i < pwStrength
                                ? strengthColor[pwStrength - 1]
                                : "rgba(255,255,255,0.08)",
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-xs font-dm-sans" style={{ color: strengthColor[pwStrength - 1] || "#8A8480" }}>
                        {strengthLabel[pwStrength - 1] || "Too weak"}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-rust text-white font-dm-sans font-semibold rounded-xl hover:bg-rust/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    `Create ${role === "seller" ? "seller" : ""} account`
                  )}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

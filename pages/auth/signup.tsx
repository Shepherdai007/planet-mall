// pages/auth/signup.tsx
// ─── SIGN UP PAGE ────────────────────────────────────────────────
// Step 1: Choose role (buyer / seller)
// Step 2: Fill email + password
// Step 3: Phone OTP verification (sellers only)

import Head             from "next/head";
import Link             from "next/link";
import { useRouter }    from "next/router";
import { useState, useEffect, useRef } from "react";
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
import { auth, db }     from "@/lib/firebase";
import {
  RecaptchaVerifier,
  PhoneAuthProvider,
  signInWithCredential,
  linkWithCredential,
} from "firebase/auth";
import { doc, updateDoc, getDocs, query, collection, where } from "firebase/firestore";

type Role = "buyer" | "seller";

export default function SignupPage() {
  const router   = useRouter();
  const { isLoggedIn } = useAuth();

  const [step,     setStep]     = useState<1 | 2 | 3>(1);
  const [role,     setRole]     = useState<Role>("buyer");
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const signingUpRef = useRef(false); // prevents redirect during signup flow

  // Phone verification states
  const [phone,        setPhone]        = useState("");
  const [otp,          setOtp]          = useState(["","","","","",""]);
  const [verificationId, setVerificationId] = useState("");
  const [sendingOtp,   setSendingOtp]   = useState(false);
  const [verifying,    setVerifying]    = useState(false);
  const [otpSent,      setOtpSent]      = useState(false);
  const [countdown,    setCountdown]    = useState(0);
  const recaptchaRef   = useRef<RecaptchaVerifier | null>(null);
  const otpRefs        = useRef<(HTMLInputElement | null)[]>([]);

  const pwStrength = passwordStrength(password);

  // Pre-select role from URL param
  useEffect(() => {
    const urlRole = router.query.role as Role | undefined;
    if (urlRole && urlRole !== role && step === 1) setRole(urlRole);
  }, [router.query.role]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function handleRoleSelect(r: Role) {
    setRole(r);
    setStep(2);
  }

  // ── Setup reCAPTCHA ───────────────────────────────────────────
  function setupRecaptcha() {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "normal",
        callback: () => {},
      });
      recaptchaRef.current.render();
    }
    return recaptchaRef.current;
  }

  // ── Send OTP ──────────────────────────────────────────────────
  async function handleSendOtp() {
    if (!phone || phone.length < 10) { toast.error("Enter a valid phone number"); return; }

    // Check phone not already used
    const existing = await getDocs(query(
      collection(db, "users"),
      where("phone", "==", phone)
    ));
    if (!existing.empty) {
      toast.error("This phone number is already registered on Planet Mall");
      return;
    }

    setSendingOtp(true);
    try {
      const verifier  = setupRecaptcha();
      const provider  = new PhoneAuthProvider(auth);
      const vId       = await provider.verifyPhoneNumber(phone, verifier);
      setVerificationId(vId);
      setOtpSent(true);
      setCountdown(60);
      toast.success(`OTP sent to ${phone} 📱`);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-phone-number") {
        toast.error("Invalid phone number — include country code e.g. +1 416...");
      } else if (err.code === "auth/too-many-requests") {
        toast.error("Too many attempts. Try again later.");
      } else {
        toast.error("Failed to send OTP. Try again.");
      }
      recaptchaRef.current = null;
    } finally {
      setSendingOtp(false);
    }
  }

  // ── OTP input handler ─────────────────────────────────────────
  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (!value && index > 0) otpRefs.current[index - 1]?.focus();
  }

  // ── Verify OTP ────────────────────────────────────────────────
  async function handleVerifyOtp() {
    const code = otp.join("");
    if (code.length !== 6) { toast.error("Enter all 6 digits"); return; }

    setVerifying(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      // Link phone to existing account
      if (auth.currentUser) {
        await linkWithCredential(auth.currentUser, credential);
      }
      // Save phone to user doc
      if (auth.currentUser) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          phone,
          phoneVerified: true,
        });
        // Update trust profile
        await updateDoc(doc(db, "trustProfiles", auth.currentUser.uid), {
          isPhoneVerified: true,
        }).catch(() => {}); // may not exist yet, ignore
      }
      toast.success("Phone verified! ✅ Welcome to Planet Mall 🎉");
      router.push("/seller/create-shop");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-verification-code") {
        toast.error("Wrong code. Check your SMS and try again.");
      } else if (err.code === "auth/credential-already-in-use") {
        toast.error("This phone number is already linked to another account.");
      } else {
        toast.error("Verification failed. Try again.");
      }
    } finally {
      setVerifying(false);
    }
  }

  // ── Email signup (goes to phone step for sellers) ─────────────
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (pwStrength < 2) { toast.error("Please choose a stronger password"); return; }
    setLoading(true);
    signingUpRef.current = true; // block redirect
    try {
      await signUpWithEmail(email, password, name, role);
      toast.success("Account created!");
      if (role === "seller") {
        router.push("/auth/verify-phone");
      } else {
        toast.success("Welcome to Planet Mall 🎉");
        router.push("/explore");
      }
    } catch (err: unknown) {
      signingUpRef.current = false;
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

  // ── Google signup ─────────────────────────────────────────────
  async function handleGoogleSignup() {
    setGoogleLoading(true);
    signingUpRef.current = true; // block redirect
    try {
      const user = await signInWithGoogle();
      await createUserDocument(user, role, user.displayName || "");
      toast.success("Account created with Google!");
      if (role === "seller") {
        router.push("/auth/verify-phone");
      } else {
        signingUpRef.current = false;
        router.push("/explore");
      }
    } catch {
      signingUpRef.current = false;
      toast.error("Google signup failed");
    } finally {
      setGoogleLoading(false);
    }
  }

  // ── Skip phone (buyer fallback) ───────────────────────────────
  function handleSkipPhone() {
    router.push("/seller/create-shop");
  }

  return (
    <>
      <Head><title>Create account — Planet Mall</title></Head>

      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden" style={{background:"#0A0908"}}>
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" style={{zIndex:0}}>
          <source src="/auth-bg2.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0" style={{background:"rgba(10,9,8,0.75)",zIndex:1}} />
        <div className="w-full max-w-[480px]" style={{position:"relative",zIndex:2}}>

          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10 justify-center">
            <img src="/logo.jpg" alt="Planet Mall" className="w-9 h-9 rounded-lg object-cover" />
            <span className="font-syne font-bold text-xl text-paper">Planet Mall</span>
          </div>

          {/* ── STEP 1: Role ───────────────────────────────────── */}
          {step === 1 && (
            <div>
              <h1 className="font-syne font-bold text-3xl text-paper mb-2 text-center">Join Planet Mall</h1>
              <p className="text-muted font-dm-sans text-sm mb-10 text-center">How will you use Planet Mall?</p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button onClick={() => handleRoleSelect("buyer")}
                  className="group p-6 bg-white/[0.03] border border-white/10 rounded-2xl hover:border-rust/40 hover:bg-rust/5 transition-all text-left">
                  <div className="text-3xl mb-4">🛍️</div>
                  <p className="font-syne font-semibold text-paper mb-2">I'm a buyer</p>
                  <p className="text-xs text-muted font-dm-sans leading-relaxed">Shop from thousands of sellers worldwide.</p>
                </button>
                <button onClick={() => handleRoleSelect("seller")}
                  className="group p-6 bg-white/[0.03] border border-white/10 rounded-2xl hover:border-rust/40 hover:bg-rust/5 transition-all text-left">
                  <div className="text-3xl mb-4">🏪</div>
                  <p className="font-syne font-semibold text-paper mb-2">I'm a seller</p>
                  <p className="text-xs text-muted font-dm-sans leading-relaxed">Open a store and sell worldwide with AI tools.</p>
                </button>
              </div>
              <p className="text-center text-sm text-muted font-dm-sans">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-rust hover:underline">Sign in</Link>
              </p>
            </div>
          )}

          {/* ── STEP 2: Credentials ────────────────────────────── */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-8">
                <button onClick={() => setStep(1)} className="p-2 text-muted hover:text-paper">←</button>
                <span className="px-3 py-1 bg-rust/10 text-rust text-xs font-semibold rounded-full uppercase tracking-wide">
                  {role === "seller" ? "🏪 Opening a store" : "🛍️ Buyer account"}
                </span>
              </div>
              <h1 className="font-syne font-bold text-3xl text-paper mb-2">Create your account</h1>
              <p className="text-muted font-dm-sans text-sm mb-8">
                Already have one?{" "}
                <Link href="/auth/login" className="text-rust hover:underline">Sign in</Link>
              </p>

              {/* Google */}
              <button onClick={handleGoogleSignup} disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-3.5 border border-white/15 rounded-xl text-sm font-dm-sans text-paper hover:bg-white/5 transition-all disabled:opacity-50 mb-6">
                {googleLoading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>}
                Continue with Google
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-xs text-muted font-dm-sans">or</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-xs font-dm-sans text-muted mb-1.5">Full name</label>
                  <input type="text" value={name} onChange={e=>setName(e.target.value)} required placeholder="Your name"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm font-dm-sans text-paper placeholder:text-muted/40 focus:outline-none focus:border-rust/50 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-dm-sans text-muted mb-1.5">Email address</label>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm font-dm-sans text-paper placeholder:text-muted/40 focus:outline-none focus:border-rust/50 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-dm-sans text-muted mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={e=>setPassword(e.target.value)}
                      required minLength={8} placeholder="Min. 8 characters"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm font-dm-sans text-paper placeholder:text-muted/40 focus:outline-none focus:border-rust/50 transition-colors" />
                    <button type="button" onClick={()=>setShowPassword(v=>!v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-paper p-1">
                      {showPassword
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[0,1,2,3].map(i => (
                          <div key={i} className="h-1 flex-1 rounded-full transition-all"
                            style={{background: i < pwStrength ? strengthColor[pwStrength-1] : "rgba(255,255,255,0.08)"}} />
                        ))}
                      </div>
                      <p className="text-xs font-dm-sans" style={{color:strengthColor[pwStrength-1]||"#8A8480"}}>
                        {strengthLabel[pwStrength-1]||"Too weak"}
                      </p>
                    </div>
                  )}
                </div>

                {role === "seller" && (
                  <div className="p-3 rounded-xl flex items-start gap-2"
                    style={{background:"rgba(196,83,26,0.08)",border:"1px solid rgba(196,83,26,0.2)"}}>
                    <span>📱</span>
                    <p className="text-xs font-dm-sans" style={{color:"#C4531A"}}>
                      As a seller you'll verify your phone number in the next step to protect buyers and unlock selling features.
                    </p>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3.5 bg-rust text-white font-dm-sans font-semibold rounded-xl hover:bg-rust/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</>
                    : role === "seller" ? "Continue to phone verification →" : "Create account"}
                </button>
              </form>
            </div>
          )}

          {/* ── STEP 3: Phone Verification (sellers only) ───────── */}
          {step === 3 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
                  style={{background:"rgba(196,83,26,0.1)"}}>📱</div>
                <h1 className="font-syne font-bold text-2xl text-paper mb-2">Verify your phone</h1>
                <p className="text-sm font-dm-sans" style={{color:"#8A8480"}}>
                  Required for sellers to protect buyers and unlock your full selling limit.
                </p>
              </div>

              {!otpSent ? (
                /* ── Enter phone number ── */
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-dm-sans text-muted mb-1.5">
                      Phone number (include country code)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+1 416 000 0000"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm font-dm-sans text-paper placeholder:text-muted/40 focus:outline-none focus:border-rust/50 transition-colors"
                    />
                    <p className="text-[10px] font-dm-sans mt-1" style={{color:"#8A8480"}}>
                      e.g. +1 for Canada/USA, +44 for UK, +233 for Ghana, +234 for Nigeria
                    </p>
                  </div>

                  {/* reCAPTCHA renders here */}
                  <div id="recaptcha-container" className="flex justify-center" />

                  <button onClick={handleSendOtp} disabled={sendingOtp || !phone}
                    className="w-full py-3.5 bg-rust text-white font-dm-sans font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                    {sendingOtp
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</>
                      : "Send verification code 📱"}
                  </button>

                  <button onClick={handleSkipPhone}
                    className="w-full py-3 text-sm font-dm-sans text-center"
                    style={{color:"#8A8480"}}>
                    Skip for now (limits apply)
                  </button>
                </div>
              ) : (
                /* ── Enter OTP ── */
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-dm-sans text-center mb-1" style={{color:"#8A8480"}}>
                      Enter the 6-digit code sent to
                    </p>
                    <p className="font-syne font-bold text-paper text-center">{phone}</p>
                  </div>

                  {/* OTP boxes */}
                  <div className="flex gap-2 justify-center">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Backspace" && !digit && i > 0) {
                            otpRefs.current[i-1]?.focus();
                          }
                        }}
                        className="w-12 h-14 text-center text-xl font-syne font-bold rounded-xl border focus:outline-none transition-all"
                        style={{
                          background:  "rgba(255,255,255,0.04)",
                          borderColor: digit ? "#C4531A" : "rgba(255,255,255,0.1)",
                          color:       "#F2EDE4",
                        }}
                      />
                    ))}
                  </div>

                  <button onClick={handleVerifyOtp} disabled={verifying || otp.join("").length !== 6}
                    className="w-full py-3.5 bg-rust text-white font-dm-sans font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                    {verifying
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</>
                      : "Verify & Continue ✅"}
                  </button>

                  {/* Resend */}
                  <div className="text-center">
                    {countdown > 0 ? (
                      <p className="text-xs font-dm-sans" style={{color:"#8A8480"}}>
                        Resend code in {countdown}s
                      </p>
                    ) : (
                      <button onClick={() => { setOtpSent(false); setOtp(["","","","","",""]); }}
                        className="text-xs font-dm-sans" style={{color:"#C4531A"}}>
                        Resend code
                      </button>
                    )}
                  </div>

                  <button onClick={handleSkipPhone}
                    className="w-full py-3 text-sm font-dm-sans text-center"
                    style={{color:"#8A8480"}}>
                    Skip for now (limits apply)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

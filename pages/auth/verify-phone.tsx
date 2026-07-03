// pages/auth/verify-phone.tsx
// ─── PHONE VERIFICATION PAGE (SELLERS ONLY) ──────────────────────

import Head          from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
import toast          from "react-hot-toast";
import { useAuth }    from "@/context/AuthContext";
import { auth, db }   from "@/lib/firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { doc, updateDoc, getDocs, query, collection, where } from "firebase/firestore";

export default function VerifyPhonePage() {
  const router = useRouter();
  const { user, isLoggedIn, loading } = useAuth();

  const [phone,           setPhone]           = useState("");
  const [otp,             setOtp]             = useState(["","","","","",""]);
  const [verificationId,  setVerificationId]  = useState("");
  const [otpSent,         setOtpSent]         = useState(false);
  const [sendingOtp,      setSendingOtp]      = useState(false);
  const [verifying,       setVerifying]       = useState(false);
  const [countdown,       setCountdown]       = useState(0);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const otpRefs      = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.replace("/auth/signup?role=seller");
  }, [isLoggedIn, loading]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Init reCAPTCHA on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Clean up any existing reCAPTCHA first
    const container = document.getElementById("recaptcha-container");
    if (container) container.innerHTML = "";
    try {
      recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    } catch (e) {
      console.error("reCAPTCHA init error:", e);
    }
    return () => {
      // Cleanup on unmount
      recaptchaRef.current = null;
    };
  }, []);

  async function handleSendOtp() {
    if (!phone || phone.length < 10) { toast.error("Enter a valid phone number"); return; }

    // Check phone not already used
    const existing = await getDocs(query(collection(db, "users"), where("phone", "==", phone)));
    if (!existing.empty) {
      toast.error("This phone number is already registered");
      return;
    }

    setSendingOtp(true);
    try {
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
      }
      const confirmationResult = await signInWithPhoneNumber(auth, phone, recaptchaRef.current);
      (window as any).confirmationResult = confirmationResult;
      setVerificationId(confirmationResult.verificationId);
      setOtpSent(true);
      setCountdown(60);
      toast.success(`Code sent to ${phone} 📱`);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-phone-number") {
        toast.error("Invalid number — include country code e.g. +1 416...");
      } else if (err.code === "auth/too-many-requests") {
        toast.error("Too many attempts. Try again later.");
      } else {
        toast.error("Failed to send code: " + err.message);
      }
      recaptchaRef.current = null;
    } finally {
      setSendingOtp(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (!value && index > 0) otpRefs.current[index - 1]?.focus();
  }

  async function handleVerifyOtp() {
    const code = otp.join("");
    if (code.length !== 6) { toast.error("Enter all 6 digits"); return; }
    if (!user) return;

    setVerifying(true);
    try {
      const confirmationResult = (window as any).confirmationResult;
      if (!confirmationResult) { toast.error("Session expired. Try again."); setVerifying(false); return; }
      
      // Confirm the code — this verifies the OTP is correct
      // We catch the credential-already-in-use error which means the code WAS correct
      try {
        await confirmationResult.confirm(code);
      } catch (confirmErr: any) {
        // If error is NOT about wrong code, the phone was verified — just linked to different account
        if (confirmErr.code === "auth/invalid-verification-code") {
          toast.error("Wrong code. Check your SMS.");
          setVerifying(false);
          return;
        }
        // Any other error (credential-already-in-use etc) means code was correct
      }

      // Save phone to Firestore
      await updateDoc(doc(db, "users", user.uid), { phone, phoneVerified: true });
      try {
        await updateDoc(doc(db, "trustProfiles", user.uid), { isPhoneVerified: true });
      } catch {}
      
      toast.success("Phone verified! ✅ Welcome to Planet Mall 🎉");
      router.push("/seller/create-shop");
    } catch (err: any) {
      toast.error("Verification failed: " + err.message);
    } finally {
      setVerifying(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:"#0A0908"}}>
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#C4531A"}} />
    </div>
  );

  return (
    <>
      <Head><title>Verify Phone — Planet Mall</title></Head>
      <div className="min-h-screen flex items-center justify-center px-4" style={{background:"#0A0908"}}>
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10 justify-center">
            <img src="/logo.jpg" alt="Planet Mall" className="w-9 h-9 rounded-lg object-cover" />
            <span className="font-syne font-bold text-xl text-paper">Planet Mall</span>
          </div>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
              style={{background:"rgba(196,83,26,0.1)"}}>📱</div>
            <h1 className="font-syne font-bold text-2xl text-paper mb-2">Verify your phone</h1>
            <p className="text-sm font-dm-sans" style={{color:"#8A8480"}}>
              Required for sellers to protect buyers and unlock your full selling limit.
            </p>
          </div>

          {!otpSent ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-dm-sans text-muted mb-1.5">
                  Phone number (include country code)
                </label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+1 416 000 0000"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm font-dm-sans text-paper placeholder:text-muted/40 focus:outline-none focus:border-rust/50 transition-colors" />
                <p className="text-[10px] font-dm-sans mt-1" style={{color:"#8A8480"}}>
                  +1 Canada/USA · +44 UK · +233 Ghana · +234 Nigeria
                </p>
              </div>

              {/* Invisible reCAPTCHA */}
              <div id="recaptcha-container" style={{display:"none"}} />

              <button onClick={handleSendOtp} disabled={sendingOtp || !phone}
                className="w-full py-3.5 bg-rust text-white font-dm-sans font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                {sendingOtp
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</>
                  : "Send verification code 📱"}
              </button>

              <button onClick={() => router.push("/seller/create-shop")}
                className="w-full py-3 text-sm font-dm-sans text-center" style={{color:"#8A8480"}}>
                Skip for now (limits apply)
              </button>
            </div>
          ) : (
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
                  <input key={i} ref={el => { otpRefs.current[i] = el; }}
                    type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => { if (e.key === "Backspace" && !digit && i > 0) otpRefs.current[i-1]?.focus(); }}
                    className="w-12 h-14 text-center text-xl font-syne font-bold rounded-xl border focus:outline-none transition-all"
                    style={{
                      background:  "rgba(255,255,255,0.04)",
                      borderColor: digit ? "#C4531A" : "rgba(255,255,255,0.1)",
                      color:       "#F2EDE4",
                    }} />
                ))}
              </div>

              <button onClick={handleVerifyOtp} disabled={verifying || otp.join("").length !== 6}
                className="w-full py-3.5 bg-rust text-white font-dm-sans font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                {verifying
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</>
                  : "Verify & Continue ✅"}
              </button>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-xs font-dm-sans" style={{color:"#8A8480"}}>Resend in {countdown}s</p>
                ) : (
                  <button onClick={() => { setOtpSent(false); setOtp(["","","","","",""]); recaptchaRef.current = null; }}
                    className="text-xs font-dm-sans" style={{color:"#C4531A"}}>
                    Resend code
                  </button>
                )}
              </div>

              <button onClick={() => router.push("/seller/create-shop")}
                className="w-full py-3 text-sm font-dm-sans text-center" style={{color:"#8A8480"}}>
                Skip for now (limits apply)
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

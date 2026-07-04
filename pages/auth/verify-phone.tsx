// pages/auth/verify-phone.tsx
// ─── PHONE VERIFICATION — TWILIO VERIFY ──────────────────────────

import Head          from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
import toast          from "react-hot-toast";
import { useAuth }    from "@/context/AuthContext";

export default function VerifyPhonePage() {
  const router = useRouter();
  const { user, isLoggedIn, loading } = useAuth();
  const { redirect } = router.query;

  const [phone,      setPhone]      = useState("");
  const [otp,        setOtp]        = useState(["","","","","",""]);
  const [otpSent,    setOtpSent]    = useState(false);
  const [sending,    setSending]    = useState(false);
  const [verifying,  setVerifying]  = useState(false);
  const [countdown,  setCountdown]  = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.replace("/auth/signup?role=seller");
  }, [isLoggedIn, loading]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleSendOtp() {
    if (!phone || phone.length < 10) { toast.error("Enter a valid phone number with country code"); return; }
    setSending(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send code");
      setOtpSent(true);
      setCountdown(60);
      toast.success(`Code sent to ${phone} 📱`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send code");
    } finally {
      setSending(false);
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
      const res = await fetch("/api/auth/check-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone, code, userId: user.uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      toast.success("Phone verified! ✅ Welcome to Planet Mall 🎉");
      router.push((redirect as string) || "/seller/create-shop");
    } catch (err: any) {
      toast.error(err.message || "Wrong code. Try again.");
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
              Required to post listings or open a shop — this protects buyers and keeps Planet Mall scam-free.
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

              <button onClick={handleSendOtp} disabled={sending || !phone}
                className="w-full py-3.5 bg-rust text-white font-dm-sans font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                {sending
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</>
                  : "Send verification code 📱"}
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
                  <button onClick={() => { setOtpSent(false); setOtp(["","","","","",""]); }}
                    className="text-xs font-dm-sans" style={{color:"#C4531A"}}>
                    Resend code
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

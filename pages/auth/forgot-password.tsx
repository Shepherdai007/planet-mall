// pages/auth/forgot-password.tsx
// ─── PASSWORD RESET PAGE ─────────────────────────────────────────

import Head          from "next/head";
import Link          from "next/link";
import { useState }  from "react";
import toast         from "react-hot-toast";
import { resetPassword } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch {
      toast.error("Could not send reset email. Check the address and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Reset password — Planet Mall</title>
      </Head>

      <div className="min-h-screen bg-void flex items-center justify-center px-4">
        <div className="w-full max-w-[400px]">

          <div className="flex items-center gap-2.5 mb-10 justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="Planet Mall" className="w-9 h-9 rounded-lg object-cover" />
            <span className="font-syne font-bold text-xl text-paper">Planet Mall</span>
          </div>

          {sent ? (
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 bg-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-green text-2xl">✓</span>
              </div>
              <h1 className="font-syne font-bold text-2xl text-paper mb-3">Check your email</h1>
              <p className="text-muted font-dm-sans text-sm mb-8 leading-relaxed">
                We sent a password reset link to <strong className="text-paper">{email}</strong>.
                Check your inbox (and spam folder).
              </p>
              <Link
                href="/auth/login"
                className="text-sm text-rust hover:underline font-dm-sans"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <div className="animate-fade-in">
              <h1 className="font-syne font-bold text-3xl text-paper mb-2">Reset password</h1>
              <p className="text-muted font-dm-sans text-sm mb-8">
                Enter your email and we'll send a reset link.
              </p>

              <form onSubmit={handleReset} className="space-y-4">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-rust text-white font-dm-sans font-semibold rounded-xl hover:bg-rust/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : "Send reset link"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-muted font-dm-sans">
                <Link href="/auth/login" className="text-rust hover:underline">
                  Back to sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

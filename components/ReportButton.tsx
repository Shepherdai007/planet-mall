// components/ReportButton.tsx
// ─── REPORT BUTTON + MODAL ───────────────────────────────────────
// Used on product pages, shop pages, livestream pages.
// Submits report to /api/report → saved in Firestore for admin review.

"use client";
import { useState } from "react";
import { useAuth }  from "@/context/AuthContext";
import toast        from "react-hot-toast";

interface Props {
  type:       "seller" | "product" | "livestream" | "order";
  targetId:   string;
  targetName: string;
}

const REASONS: Record<string, string> = {
  scam:          "Scam / fraud",
  fake_product:  "Fake or counterfeit product",
  no_delivery:   "Item not delivered",
  misleading:    "Misleading description or photos",
  inappropriate: "Inappropriate content",
  other:         "Other",
};

export default function ReportButton({ type, targetId, targetName }: Props) {
  const { user, userDoc } = useAuth();
  const [open,   setOpen]   = useState(false);
  const [reason, setReason] = useState("");
  const [desc,   setDesc]   = useState("");
  const [sending, setSending] = useState(false);
  const [sent,   setSent]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason || !desc.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/report", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterId:    user?.uid || null,
          reporterEmail: user?.email || null,
          type, targetId, targetName, reason,
          description: desc,
        }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      toast.success("Report submitted. We'll review it within 24 hours.");
    } catch {
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-dm-sans transition-colors"
        style={{color:"#8A8480"}}
        onMouseEnter={e => (e.target as HTMLElement).style.color = "#C4531A"}
        onMouseLeave={e => (e.target as HTMLElement).style.color = "#8A8480"}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
          <line x1="4" y1="22" x2="4" y2="15"/>
        </svg>
        Report
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
              style={{background:"#141210",border:"1px solid rgba(255,255,255,0.08)"}}>

              <div className="px-6 py-4 flex items-center justify-between"
                style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                <h3 className="font-syne font-bold text-lg text-paper">Report {type}</h3>
                <button onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-muted"
                  style={{background:"rgba(255,255,255,0.06)"}}>✕</button>
              </div>

              {sent ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-4">✅</div>
                  <p className="font-syne font-bold text-xl text-paper mb-2">Report received</p>
                  <p className="text-sm text-muted font-dm-sans mb-6 leading-relaxed">
                    Thank you for helping keep Planet Mall safe. Our team will review your report within 24 hours.
                    If the report is verified, action will be taken immediately.
                  </p>
                  <button onClick={() => { setOpen(false); setSent(false); setReason(""); setDesc(""); }}
                    className="px-6 py-2.5 rounded-xl text-sm font-dm-sans font-semibold text-white"
                    style={{background:"#C4531A"}}>
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  <div>
                    <p className="text-xs text-muted font-dm-sans mb-1">Reporting: <span className="text-paper">{targetName}</span></p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold font-syne mb-2 text-paper">Reason *</label>
                    <div className="space-y-2">
                      {Object.entries(REASONS).map(([key, label]) => (
                        <label key={key}
                          className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                          style={{
                            background: reason===key ? "rgba(196,83,26,0.1)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${reason===key ? "rgba(196,83,26,0.3)" : "rgba(255,255,255,0.06)"}`,
                          }}>
                          <input type="radio" name="reason" value={key}
                            checked={reason===key} onChange={()=>setReason(key)}
                            className="accent-rust" />
                          <span className="text-sm font-dm-sans text-paper">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold font-syne mb-2 text-paper">
                      Details *
                    </label>
                    <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={4} required
                      placeholder="Please describe what happened in detail. Include order numbers, dates, or any other relevant information."
                      className="w-full px-4 py-3 rounded-xl text-sm font-dm-sans text-paper placeholder:text-muted/40 focus:outline-none resize-none"
                      style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)"}}
                      onFocus={e=>e.target.style.borderColor="rgba(196,83,26,0.5)"}
                      onBlur={e =>e.target.style.borderColor="rgba(255,255,255,0.1)"} />
                  </div>

                  <div className="p-3 rounded-xl text-xs font-dm-sans leading-relaxed"
                    style={{background:"rgba(42,107,69,0.08)",border:"1px solid rgba(42,107,69,0.15)",color:"#2A6B45"}}>
                    ✓ All reports are confidential. False reports may result in account suspension.
                  </div>

                  <div className="flex gap-3">
                    <button type="submit" disabled={!reason || !desc.trim() || sending}
                      className="flex-1 py-3 rounded-xl text-white font-dm-sans font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{background:"#C4531A"}}>
                      {sending
                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>
                        : "Submit report"}
                    </button>
                    <button type="button" onClick={()=>setOpen(false)}
                      className="px-4 py-3 rounded-xl font-dm-sans text-sm border border-white/10 text-muted">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

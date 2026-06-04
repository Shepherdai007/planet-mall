// components/ShareButton.tsx
// ─── REUSABLE SHARE COMPONENT ────────────────────────────────────
// Used on: livestream viewer, product page, shop page, stream cards
// Features: Web Share API (mobile native), WhatsApp, Twitter/X,
//           Facebook, Telegram, Copy link

"use client";
import { useState } from "react";
import toast from "react-hot-toast";

interface ShareButtonProps {
  url:       string;   // full URL to share
  title:     string;   // share title
  text?:     string;   // share description
  variant?:  "icon" | "button" | "full"; // display style
  className?: string;
}

const PLATFORMS = [
  {
    name:    "WhatsApp",
    icon:    "💬",
    color:   "#25D366",
    getUrl:  (url: string, text: string) =>
      `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
  },
  {
    name:    "Twitter / X",
    icon:    "𝕏",
    color:   "#000000",
    getUrl:  (url: string, text: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    name:    "Facebook",
    icon:    "f",
    color:   "#1877F2",
    getUrl:  (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name:    "Telegram",
    icon:    "✈️",
    color:   "#229ED9",
    getUrl:  (url: string, text: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
];

export default function ShareButton({
  url, title, text = "", variant = "icon", className = ""
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const shareText = text || title;

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url });
        return;
      } catch {}
    }
    setOpen(true);
  }

  function handleCopy() {
    navigator.clipboard.writeText(url);
    toast.success("Link copied!");
    setOpen(false);
  }

  function handlePlatform(platformUrl: string) {
    window.open(platformUrl, "_blank", "noopener,noreferrer,width=600,height=400");
    setOpen(false);
  }

  return (
    <>
      {/* Trigger button */}
      {variant === "icon" && (
        <button
          onClick={handleNativeShare}
          className={`flex items-center justify-center transition-all ${className}`}
          aria-label="Share"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
      )}

      {variant === "button" && (
        <button
          onClick={handleNativeShare}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-dm-sans font-medium border border-white/10 text-muted hover:text-paper hover:border-white/20 transition-all ${className}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Share
        </button>
      )}

      {variant === "full" && (
        <button
          onClick={handleNativeShare}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-dm-sans font-medium border border-white/10 text-paper hover:bg-white/5 transition-all ${className}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Share this stream
        </button>
      )}

      {/* Share modal */}
      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-sm w-full">
            <div className="rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl"
              style={{background:"#141210",border:"1px solid rgba(255,255,255,0.08)"}}>

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-syne font-bold text-lg text-paper">Share</h3>
                <button onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-paper"
                  style={{background:"rgba(255,255,255,0.06)"}}>✕</button>
              </div>

              {/* Title preview */}
              <div className="p-3 rounded-xl mb-5" style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)"}}>
                <p className="text-xs text-muted font-dm-sans truncate">{url}</p>
                <p className="text-sm text-paper font-dm-sans font-medium mt-0.5 truncate">{title}</p>
              </div>

              {/* Platform buttons */}
              <div className="grid grid-cols-4 gap-3 mb-5">
                {PLATFORMS.map(p => (
                  <button
                    key={p.name}
                    onClick={() => handlePlatform(p.getUrl(url, shareText))}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all hover:scale-105"
                    style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)"}}>
                    <span className="text-xl w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{background:p.color + "20",color:p.color}}>
                      {p.icon}
                    </span>
                    <span className="text-[10px] text-muted font-dm-sans">{p.name.split("/")[0]}</span>
                  </button>
                ))}
              </div>

              {/* Copy link */}
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-3 p-4 rounded-xl transition-all hover:bg-white/5"
                style={{border:"1px solid rgba(255,255,255,0.08)"}}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{background:"rgba(196,83,26,0.15)"}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C4531A" strokeWidth="2">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-dm-sans font-medium text-paper">Copy link</p>
                  <p className="text-xs text-muted font-dm-sans truncate">{url}</p>
                </div>
                <span className="text-xs text-rust font-dm-sans font-semibold">Copy</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

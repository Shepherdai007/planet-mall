// components/InstallPrompt.tsx
// ─── PWA INSTALL BANNER ──────────────────────────────────────────
// Proactively shows an "Install app" banner instead of relying on the
// passive browser icon. Handles two cases:
//   1. Chrome/Android/Desktop — captures the native `beforeinstallprompt`
//      event and shows our own styled banner with an Install button.
//   2. iOS Safari — doesn't fire `beforeinstallprompt` at all, so we
//      show manual "tap Share → Add to Home Screen" instructions instead.
//
// Deliberately does NOT register a service worker (next-pwa stays
// disabled) — Chrome only requires a valid manifest + some user
// engagement to allow installation, so this avoids any conflict with
// the existing Firebase push notification service worker.

import { useEffect, useState } from "react";

const DISMISS_KEY = "pm_install_dismissed_at";
const DISMISS_COOLDOWN_DAYS = 7;

function isIos(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function wasRecentlyDismissed(): boolean {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = parseInt(raw, 10);
  if (isNaN(dismissedAt)) return false;
  const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return daysSince < DISMISS_COOLDOWN_DAYS;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosBanner, setShowIosBanner] = useState(false);

  useEffect(() => {
    if (isStandalone() || wasRecentlyDismissed()) return;

    // Android / Chrome / desktop path
    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // iOS path — no event fires, so just show instructions after a short delay
    if (isIos()) {
      const timer = setTimeout(() => setShowIosBanner(true), 2000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShowBanner(false);
    setShowIosBanner(false);
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    // Whatever the user chose, don't nag again immediately
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDeferredPrompt(null);
    setShowBanner(false);
  }

  if (!showBanner && !showIosBanner) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 p-4 rounded-2xl shadow-lg flex items-start gap-3"
      style={{ background: "#1A1714", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#F6F1E9" }}>
        <img src="/icons/icon-192.png" alt="Planet Mall" className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-dm-sans font-bold text-sm" style={{ color: "#F2EDE4" }}>
          Install Planet Mall
        </p>

        {showIosBanner ? (
          <p className="text-xs font-dm-sans mt-0.5" style={{ color: "rgba(242,237,228,0.7)" }}>
            Tap <span className="font-semibold">Share</span> <span aria-hidden>􀈂</span> then{" "}
            <span className="font-semibold">Add to Home Screen</span>.
          </p>
        ) : (
          <p className="text-xs font-dm-sans mt-0.5" style={{ color: "rgba(242,237,228,0.7)" }}>
            Faster access, right from your home screen.
          </p>
        )}

        <div className="flex items-center gap-3 mt-3">
          {!showIosBanner && (
            <button
              onClick={handleInstall}
              className="px-4 py-2 rounded-xl text-xs font-dm-sans font-bold"
              style={{ background: "#C4531A", color: "#fff" }}
            >
              Install
            </button>
          )}
          <button
            onClick={dismiss}
            className="px-4 py-2 rounded-xl text-xs font-dm-sans font-semibold"
            style={{ color: "rgba(242,237,228,0.6)" }}
          >
            {showIosBanner ? "Got it" : "Not now"}
          </button>
        </div>
      </div>
    </div>
  );
}

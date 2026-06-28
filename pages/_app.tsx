// pages/_app.tsx
// ─── NEXT.JS APP ROOT ────────────────────────────────────────────
// Wraps all pages with global providers and styles.
import type { AppProps } from "next/app";
import Head              from "next/head";
import { useEffect }     from "react";
import { AuthProvider, useAuth }  from "@/context/AuthContext";
import { CartProvider }  from "@/context/CartContext";
import { initPushNotifications, onForegroundMessage } from "@/lib/fcm";
import toast             from "react-hot-toast";
import "@/styles/globals.css";

function PushNotificationInit() {
  const { user, isLoggedIn } = useAuth();

  useEffect(() => {
    if (!isLoggedIn || !user) return;

    // Init push notifications when user logs in
    initPushNotifications(user.uid).catch(() => {});

    // Handle foreground messages (app is open) — show toast
    const unsub = onForegroundMessage(payload => {
      const { title, body } = payload.notification || {};
      if (title || body) {
        toast(
          <div className="flex items-start gap-3">
            <span className="text-xl">🔔</span>
            <div>
              {title && <p className="font-dm-sans font-bold text-sm">{title}</p>}
              {body  && <p className="font-dm-sans text-xs opacity-80">{body}</p>}
            </div>
          </div>,
          { duration: 5000 }
        );
      }
    });

    return () => { if (typeof unsub === "function") unsub(); };
  }, [isLoggedIn, user]);

  return null;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0A0908" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <title>Planet Mall — The world's market, in your pocket</title>
      </Head>
      <AuthProvider>
        <CartProvider>
          <PushNotificationInit />
          <Component {...pageProps} />
        </CartProvider>
      </AuthProvider>
    </>
  );
}

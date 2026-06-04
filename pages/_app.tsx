// pages/_app.tsx
// ─── NEXT.JS APP ROOT ───────────────────────────────────────────
// Wraps all pages with global providers and styles.

import type { AppProps } from "next/app";
import Head              from "next/head";
import { AuthProvider }  from "@/context/AuthContext";
import { CartProvider }  from "@/context/CartContext";
import "@/styles/globals.css";

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
          <Component {...pageProps} />
        </CartProvider>
      </AuthProvider>
    </>
  );
}

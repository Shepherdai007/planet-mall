// components/Layout.tsx
// ─── MAIN LAYOUT WRAPPER ─────────────────────────────────────────
// Wraps every page with Navbar and Toaster.
// Pages that don't want the navbar (auth pages) use their own layout.

import { Toaster }   from "react-hot-toast";
import Navbar        from "./Navbar";
import CartDrawer    from "./CartDrawer";
import AIConcierge   from "./AIConcierge";
import InstallPrompt from "./InstallPrompt";

interface Props {
  children: React.ReactNode;
  fullscreen?: boolean; // hides navbar — used for auth pages
}

export default function Layout({ children, fullscreen = false }: Props) {
  return (
    <>
      {!fullscreen && <Navbar />}
      <CartDrawer />
      <AIConcierge />
      <InstallPrompt />

      <main className={fullscreen ? "" : "pt-16"}>
        {children}
      </main>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1A1714",
            color:      "#F2EDE4",
            border:     "1px solid rgba(255,255,255,0.08)",
            fontFamily: "DM Sans, sans-serif",
            fontSize:   "14px",
          },
          success: {
            iconTheme: { primary: "#2A6B45", secondary: "#F2EDE4" },
          },
          error: {
            iconTheme: { primary: "#C4531A", secondary: "#F2EDE4" },
          },
        }}
      />
    </>
  );
}

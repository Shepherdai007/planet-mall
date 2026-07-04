// components/ContactSellerCard.tsx
// ─── REVEAL PHONE / WHATSAPP BUTTONS ─────────────────────────────
// Used on classifieds, food listings, and product pages.
// Phone stays hidden behind a tap (protects against bot scraping)
// then becomes a clickable tel: link. WhatsApp opens wa.me directly.

import { useState } from "react";

interface Props {
  phone?:    string;
  whatsapp?: string;
}

function formatForWhatsApp(num: string): string {
  // If it's already a full link (e.g. a WhatsApp group invite), use it as-is
  if (num.startsWith("http")) return num;
  // Strip everything except digits and leading +
  return num.replace(/[^\d+]/g, "").replace(/^\+/, "");
}
export default function ContactSellerCard({ phone, whatsapp }: Props) {
  const [revealed, setRevealed] = useState(false);

  if (!phone && !whatsapp) return null;

  return (
    <div className="flex flex-col gap-2">
      {phone && (
        revealed ? (
          <a href={`tel:${phone}`}
            className="w-full py-3 rounded-xl font-dm-sans font-bold text-sm text-center border transition-all"
            style={{borderColor:"#2A6B45",color:"#2A6B45",background:"rgba(42,107,69,0.06)"}}>
            📞 {phone}
          </a>
        ) : (
          <button onClick={() => setRevealed(true)}
            className="w-full py-3 rounded-xl font-dm-sans font-semibold text-sm border transition-all"
            style={{borderColor:"#D4CFC6",color:"#8A8480"}}>
            📞 Reveal phone number
          </button>
        )
      )}
      {whatsapp && (
        <a
          href={whatsapp.startsWith("http") ? whatsapp : `https://wa.me/${formatForWhatsApp(whatsapp)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 rounded-xl font-dm-sans font-bold text-sm text-center text-white flex items-center justify-center gap-2"
          style={{background:"#25D366"}}>
          💬 WhatsApp seller
        </a>
      )}
    </div>
  );
}

// components/BuyerProtectionBadge.tsx
// ─── BUYER PROTECTION BADGE ──────────────────────────────────────
// Shows on product pages and checkout to build trust.
// Links to /trust for full policy details.

import Link from "next/link";

interface Props {
  compact?: boolean;
}

export default function BuyerProtectionBadge({ compact = false }: Props) {
  if (compact) {
    return (
      <Link href="/trust"
        className="flex items-center gap-2 text-xs font-dm-sans transition-colors hover:opacity-80"
        style={{color:"#2A6B45"}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        Planet Mall Buyer Protection
      </Link>
    );
  }

  return (
    <div className="p-4 rounded-2xl" style={{background:"rgba(42,107,69,0.06)",border:"1px solid rgba(42,107,69,0.15)"}}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{background:"rgba(42,107,69,0.15)"}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2A6B45" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-dm-sans font-semibold text-sm mb-1" style={{color:"#2A6B45"}}>
            Planet Mall Buyer Protection
          </p>
          <ul className="space-y-1">
            {[
              "30-day money-back guarantee if item not delivered",
              "Payments secured by Stripe — 256-bit encryption",
              "Dispute resolution within 48 hours",
            ].map(item => (
              <li key={item} className="flex items-start gap-1.5 text-xs font-dm-sans" style={{color:"#2A6B45"}}>
                <span className="flex-shrink-0 mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <Link href="/trust"
            className="text-xs font-dm-sans font-semibold mt-2 inline-block hover:underline"
            style={{color:"#2A6B45"}}>
            Learn more about buyer protection →
          </Link>
        </div>
      </div>
    </div>
  );
}

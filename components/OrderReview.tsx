// components/OrderReview.tsx
// ─── ORDER REVIEW STEP BEFORE PAYMENT ───────────────────────────
// Shows full order summary, seller policies, escrow explanation.
// Buyer must check a confirmation box before paying.
// Reduces disputes and chargebacks significantly.

import Link from "next/link";
import { useState } from "react";
import { formatCurrency } from "@/lib/helpers";
import { getEscrowRule, isFoodOrder } from "@/lib/escrow";
import type { CartItem } from "@/context/CartContext";

interface Props {
  items:           CartItem[];
  subtotal:        number;
  shippingCost:    number;
  tax:             number;
  total:           number;
  shippingAddress: Record<string, string>;
  shippingMethod:  string;
  onConfirm:       () => void;
  onBack:          () => void;
  placing:         boolean;
}

export default function OrderReview({
  items, subtotal, shippingCost, tax, total,
  shippingAddress, shippingMethod, onConfirm, onBack, placing,
}: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const [understood, setUnderstood] = useState(false);

  const hasFood = items.some(i => isFoodOrder(i.currency)); // simplified check
  const escrowRule = getEscrowRule(items[0]?.currency || "");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-syne font-bold text-2xl text-paper mb-1">Review your order</h2>
        <p className="text-sm text-muted font-dm-sans">Please review everything carefully before paying.</p>
      </div>

      {/* Items */}
      <div className="rounded-2xl overflow-hidden" style={{border:"1px solid rgba(255,255,255,0.08)"}}>
        <div className="px-5 py-3 font-syne font-semibold text-sm text-paper" style={{background:"rgba(255,255,255,0.03)"}}>
          Order items ({items.length})
        </div>
        <div className="divide-y" style={{borderColor:"rgba(255,255,255,0.04)"}}>
          {items.map(item => (
            <div key={item.productId} className="flex gap-4 px-5 py-4">
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{background:"rgba(255,255,255,0.06)"}}>
                {item.image
                  ? <img src={item.image} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>}
              </div>
              <div className="flex-1">
                <p className="font-dm-sans font-medium text-sm text-paper">{item.name}</p>
                <p className="text-xs text-muted font-dm-sans">{item.shopName}</p>
                <p className="text-xs text-muted font-dm-sans">Qty: {item.quantity}</p>
              </div>
              <p className="font-syne font-bold text-sm text-paper">
                {formatCurrency(item.price * item.quantity, "CAD")}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping address */}
      <div className="p-5 rounded-2xl" style={{border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.02)"}}>
        <p className="font-syne font-semibold text-sm text-paper mb-3">Shipping to</p>
        <p className="font-dm-sans text-sm text-muted">
          {shippingAddress.firstName} {shippingAddress.lastName}<br/>
          {shippingAddress.address}<br/>
          {shippingAddress.city}, {shippingAddress.province} {shippingAddress.postal}<br/>
          {shippingAddress.country}
        </p>
      </div>

      {/* Price breakdown */}
      <div className="p-5 rounded-2xl" style={{border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.02)"}}>
        <p className="font-syne font-semibold text-sm text-paper mb-4">Price breakdown</p>
        <div className="space-y-2">
          {[
            {label:"Subtotal",  value:formatCurrency(subtotal,"CAD")},
            {label:"Shipping",  value:shippingCost===0?"Free":formatCurrency(shippingCost,"CAD")},
            {label:"Tax (HST)", value:formatCurrency(tax,"CAD")},
          ].map(({label,value})=>(
            <div key={label} className="flex justify-between text-sm font-dm-sans">
              <span className="text-muted">{label}</span>
              <span className="text-paper">{value}</span>
            </div>
          ))}
          <div className="flex justify-between pt-3 mt-1" style={{borderTop:"1px solid rgba(255,255,255,0.08)"}}>
            <span className="font-syne font-bold text-paper">Total</span>
            <span className="font-syne font-bold text-xl text-paper">{formatCurrency(total,"CAD")}</span>
          </div>
        </div>
      </div>

      {/* Escrow explanation */}
      <div className="p-5 rounded-2xl" style={{border:"1px solid rgba(212,168,75,0.2)",background:"rgba(212,168,75,0.05)"}}>
        <div className="flex gap-3">
          <span className="text-2xl flex-shrink-0">🔐</span>
          <div>
            <p className="font-dm-sans font-semibold text-sm text-paper mb-2">
              How your payment is protected
            </p>
            <ul className="space-y-1.5">
              {[
                "Your payment goes to Planet Mall — NOT directly to the seller",
                hasFood
                  ? "Food orders: payment released instantly when you confirm receipt"
                  : "Payment held safely until you confirm delivery (14-day auto-release)",
                "If there's a problem, open a dispute and your money stays frozen",
                "All transactions secured by Stripe — 256-bit encryption",
              ].map(item => (
                <li key={item} className="flex gap-2 text-xs font-dm-sans" style={{color:"rgba(242,237,228,0.7)"}}>
                  <span className="text-green flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/how-it-works" target="_blank"
              className="text-xs font-dm-sans font-semibold mt-2 inline-block hover:underline"
              style={{color:"#D4A84B"}}>
              Learn how Planet Mall escrow works →
            </Link>
          </div>
        </div>
      </div>

      {/* Confirmation checkboxes */}
      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl transition-all"
          style={{
            background: confirmed ? "rgba(42,107,69,0.08)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${confirmed ? "rgba(42,107,69,0.3)" : "rgba(255,255,255,0.08)"}`,
          }}>
          <input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}
            className="mt-0.5 flex-shrink-0 accent-green w-4 h-4" />
          <span className="text-sm font-dm-sans text-paper leading-relaxed">
            I have reviewed my order and confirm the items, quantities, shipping address, and total amount are correct.
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl transition-all"
          style={{
            background: understood ? "rgba(42,107,69,0.08)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${understood ? "rgba(42,107,69,0.3)" : "rgba(255,255,255,0.08)"}`,
          }}>
          <input type="checkbox" checked={understood} onChange={e=>setUnderstood(e.target.checked)}
            className="mt-0.5 flex-shrink-0 accent-green w-4 h-4" />
          <span className="text-sm font-dm-sans text-paper leading-relaxed">
            I understand that my payment is held by Planet Mall and will only be released to the seller after I confirm delivery.
            I have 14 days to report any issues.{" "}
            <Link href="/trust" target="_blank" className="underline" style={{color:"#C4531A"}}>
              Trust & Safety policy
            </Link>
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button onClick={onBack}
          className="px-6 py-3.5 rounded-xl font-dm-sans font-medium text-sm border border-white/10 text-muted hover:text-paper transition-colors">
          ← Edit order
        </button>
        <button
          onClick={onConfirm}
          disabled={!confirmed || !understood || placing}
          className="flex-1 py-3.5 rounded-xl text-white font-dm-sans font-bold text-base disabled:opacity-40 flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={{background:"#C4531A"}}>
          {placing
            ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Placing order...</>
            : `Confirm & Pay ${formatCurrency(total,"CAD")}`}
        </button>
      </div>

      <p className="text-xs text-muted text-center font-dm-sans">
        By confirming you agree to Planet Mall's{" "}
        <Link href="/terms" className="text-rust hover:underline">Terms</Link>,{" "}
        <Link href="/trust" className="text-rust hover:underline">Buyer Protection</Link> and{" "}
        <Link href="/how-it-works" className="text-rust hover:underline">Escrow Policy</Link>
      </p>
    </div>
  );
}

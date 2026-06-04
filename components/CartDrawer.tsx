// components/CartDrawer.tsx
// ─── SLIDE-OUT CART DRAWER ───────────────────────────────────────

import Link          from "next/link";
import { useCart }   from "@/context/CartContext";
import { formatCurrency } from "@/lib/helpers";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, subtotal, itemCount } = useCart();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={closeCart} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#111] border-l border-white/[0.06] flex flex-col shadow-2xl animate-slide-right">

        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-white/[0.06]">
          <div>
            <h2 className="font-syne font-bold text-xl text-paper">Your cart</h2>
            <p className="text-xs text-muted font-dm-sans mt-0.5">{itemCount} item{itemCount !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={closeCart}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-paper transition-colors"
            style={{background:"rgba(255,255,255,0.06)"}}>
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-4xl mb-4">🛍</p>
              <p className="font-syne font-semibold text-paper mb-2">Your cart is empty</p>
              <p className="text-sm text-muted font-dm-sans mb-6">Add products to get started</p>
              <button onClick={closeCart}
                className="px-5 py-2.5 rounded-full text-sm font-dm-sans font-semibold"
                style={{background:"#C4531A",color:"#fff"}}>
                Browse marketplace
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.productId} className="flex gap-4 p-3 rounded-2xl" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                {/* Image */}
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{background:"rgba(255,255,255,0.06)"}}>
                  {item.image
                    ? <img src={item.image} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-dm-sans font-medium text-paper truncate">{item.name}</p>
                  <p className="text-xs text-muted font-dm-sans mb-2">{item.shopName}</p>
                  <div className="flex items-center justify-between">
                    {/* Qty */}
                    <div className="flex items-center gap-2">
                      <button onClick={()=>item.quantity>1?updateQty(item.productId,item.quantity-1):removeItem(item.productId)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-muted hover:text-paper transition-colors"
                        style={{background:"rgba(255,255,255,0.06)"}}>−</button>
                      <span className="text-sm font-syne font-bold text-paper">{item.quantity}</span>
                      <button onClick={()=>updateQty(item.productId,item.quantity+1)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-muted hover:text-paper transition-colors"
                        style={{background:"rgba(255,255,255,0.06)"}}>+</button>
                    </div>
                    <p className="font-syne font-bold text-sm text-paper">
                      {formatCurrency(item.price * item.quantity, item.currency as any)}
                    </p>
                  </div>
                </div>

                {/* Remove */}
                <button onClick={()=>removeItem(item.productId)}
                  className="self-start text-muted hover:text-rust transition-colors text-xs mt-1">✕</button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-white/[0.06]">
            <div className="flex justify-between items-center mb-4">
              <span className="font-dm-sans text-muted text-sm">Subtotal</span>
              <span className="font-syne font-bold text-xl text-paper">{formatCurrency(subtotal,"CAD")}</span>
            </div>
            <p className="text-xs text-muted font-dm-sans mb-4 text-center">Shipping calculated at checkout</p>
            <Link href="/checkout" onClick={closeCart}
              className="block w-full py-4 rounded-xl text-center text-white font-dm-sans font-semibold transition-all hover:opacity-90"
              style={{background:"#C4531A"}}>
              Checkout — {formatCurrency(subtotal,"CAD")}
            </Link>
            <button onClick={closeCart}
              className="block w-full py-3 mt-2 text-center text-sm text-muted font-dm-sans hover:text-paper transition-colors">
              Continue shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}

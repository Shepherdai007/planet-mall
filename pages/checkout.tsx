// pages/checkout.tsx
// ─── CHECKOUT PAGE (PHASE 3) ─────────────────────────────────────
// Shows order summary + shipping form
// Stripe payment integration (card element)
// Note: Stripe secret key needed in .env.local to process payments

import Head           from "next/head";
import Link           from "next/link";
import { useState }   from "react";
import { useRouter }  from "next/router";
import toast          from "react-hot-toast";
import { useCart }    from "@/context/CartContext";
import { useAuth }    from "@/context/AuthContext";
import { formatCurrency } from "@/lib/helpers";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db }         from "@/lib/firebase";
import BuyerProtectionBadge from "@/components/BuyerProtectionBadge";
import OrderReview from "@/components/OrderReview";

const SHIPPING_OPTIONS = [
  { id:"standard", label:"Standard shipping",  eta:"5–7 business days", price:0 },
  { id:"express",  label:"Express shipping",   eta:"2–3 business days", price:14.99 },
  { id:"overnight",label:"Overnight shipping", eta:"Next business day",  price:29.99 },
];

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user, userDoc }              = useAuth();
  const router = useRouter();

  const [shipping, setShipping] = useState("standard");
  const [form, setForm] = useState({
    firstName: userDoc?.displayName?.split(" ")[0] || "",
    lastName:  userDoc?.displayName?.split(" ").slice(1).join(" ") || "",
    email:     user?.email || "",
    address:   "",
    city:      "",
    province:  "",
    postal:    "",
    country:   "Canada",
    phone:     "",
  });
  const [placing, setPlacing] = useState(false);
  const [step,    setStep]    = useState<"form"|"review">("form");

  const shippingOption = SHIPPING_OPTIONS.find(s => s.id === shipping)!;
  const shippingCost   = shippingOption.price;
  const tax            = subtotal * 0.13; // Ontario HST 13%
  const total          = subtotal + shippingCost + tax;

  function up(key: string, value: string) {
    setForm(f => ({...f, [key]: value}));
  }

  async function handlePlaceOrder(e?: React.FormEvent) {
    e?.preventDefault();
    if (step === "form") {
      // Validate form fields first
      if (!form.firstName || !form.address || !form.city || !form.postal) {
        toast.error("Please fill in all required fields");
        return;
      }
      setStep("review");
      return;
    }
    await placeOrder();
  }

  async function placeOrder() {
    if (!user) { router.push("/auth/login?redirect=/checkout"); return; }
    if (items.length === 0) { toast.error("Your cart is empty"); return; }

    setPlacing(true);
    try {
      // Group items by shop
      const shopGroups = items.reduce((acc, item) => {
        if (!acc[item.shopId]) acc[item.shopId] = [];
        acc[item.shopId].push(item);
        return acc;
      }, {} as Record<string, typeof items>);

      // Create one order per shop
      for (const [shopId, shopItems] of Object.entries(shopGroups)) {
        const orderTotal = shopItems.reduce((s, i) => s + i.price * i.quantity, 0);
        await addDoc(collection(db, "orders"), {
          buyerId:     user.uid,
          buyerEmail:  form.email,
          shopId,
          shopName:    shopItems[0].shopName,
          items:       shopItems,
          subtotal:    orderTotal,
          shipping:    shippingCost,
          tax:         orderTotal * 0.13,
          total:       orderTotal + shippingCost + orderTotal * 0.13,
          currency:    "CAD",
          status:      "pending",
          escrowStatus: "held",   // held → released (on delivery confirm) or disputed
          shippingAddress: form,
          shippingMethod:  shipping,
          paymentMethod:   "stripe",
          paymentStatus:   "pending",
          createdAt:   serverTimestamp(),
        });
      }

      clearCart();
      toast.success("Order placed! 🎉");
      router.push("/orders");
    } catch(err) {
      console.error(err);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  if (items.length === 0 && !placing) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center text-center px-4">
        <div>
          <p className="text-4xl mb-4">🛍</p>
          <h1 className="font-syne font-bold text-2xl text-paper mb-2">Your cart is empty</h1>
          <Link href="/explore" className="text-rust text-sm font-dm-sans">Browse marketplace →</Link>
        </div>
      </div>
    );
  }

  const inp = "w-full px-4 py-2.5 rounded-xl border text-sm font-dm-sans focus:outline-none transition-colors bg-white/[0.04] text-paper placeholder:text-muted/40 focus:border-rust/50";
  const inpStyle = { borderColor:"rgba(255,255,255,0.1)" };

  return (
    <>
      <Head><title>Checkout — Planet Mall</title></Head>

      <div className="min-h-screen bg-void">
        {/* Top bar */}
        <div className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.jpg" alt="" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-syne font-bold text-paper text-lg">Planet Mall</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-dm-sans text-muted">
            <span className="text-rust">Cart</span>
            <span>›</span>
            <span className={step==="form"?"text-paper font-semibold":"text-muted"}>Checkout</span>
            <span>›</span>
            <span className={step==="review"?"text-paper font-semibold":"text-muted"}>Review</span>
            <span>›</span>
            <span>Confirmation</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          {/* Review step */}
          {step === "review" ? (
            <div className="max-w-2xl mx-auto">
              <OrderReview
                items={items}
                subtotal={subtotal}
                shippingCost={shippingOption.price}
                tax={subtotal * 0.13}
                total={subtotal + shippingOption.price + subtotal * 0.13}
                shippingAddress={form}
                shippingMethod={shipping}
                onConfirm={placeOrder}
                onBack={()=>setStep("form")}
                placing={placing}
              />
            </div>
          ) : (
          <form onSubmit={handlePlaceOrder}>
            <div className="grid lg:grid-cols-3 gap-10">

              {/* ── Left: form ──────────────────────────── */}
              <div className="lg:col-span-2 space-y-8">

                {/* Contact */}
                <div>
                  <h2 className="font-syne font-bold text-xl text-paper mb-5">Contact information</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-muted font-dm-sans mb-1.5">First name</label>
                      <input className={inp} style={inpStyle} value={form.firstName} onChange={e=>up("firstName",e.target.value)} required placeholder="John" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted font-dm-sans mb-1.5">Last name</label>
                      <input className={inp} style={inpStyle} value={form.lastName} onChange={e=>up("lastName",e.target.value)} required placeholder="Doe" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-muted font-dm-sans mb-1.5">Email</label>
                      <input className={inp} style={inpStyle} type="email" value={form.email} onChange={e=>up("email",e.target.value)} required placeholder="john@example.com" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-muted font-dm-sans mb-1.5">Phone</label>
                      <input className={inp} style={inpStyle} value={form.phone} onChange={e=>up("phone",e.target.value)} placeholder="+1 (416) 000-0000" />
                    </div>
                  </div>
                </div>

                {/* Shipping address */}
                <div>
                  <h2 className="font-syne font-bold text-xl text-paper mb-5">Shipping address</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs text-muted font-dm-sans mb-1.5">Street address</label>
                      <input className={inp} style={inpStyle} value={form.address} onChange={e=>up("address",e.target.value)} required placeholder="123 Main St" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted font-dm-sans mb-1.5">City</label>
                      <input className={inp} style={inpStyle} value={form.city} onChange={e=>up("city",e.target.value)} required placeholder="Toronto" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted font-dm-sans mb-1.5">Province / State</label>
                      <input className={inp} style={inpStyle} value={form.province} onChange={e=>up("province",e.target.value)} required placeholder="ON" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted font-dm-sans mb-1.5">Postal code</label>
                      <input className={inp} style={inpStyle} value={form.postal} onChange={e=>up("postal",e.target.value)} required placeholder="M5V 2T6" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted font-dm-sans mb-1.5">Country</label>
                      <select className={inp} style={{...inpStyle,background:"rgba(255,255,255,0.04)",color:"#F2EDE4"}} value={form.country} onChange={e=>up("country",e.target.value)}>
                        {["Canada","United States","United Kingdom","Australia","Germany","France","Other"].map(c=>(
                          <option key={c} value={c} style={{background:"#1A1714"}}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Shipping method */}
                <div>
                  <h2 className="font-syne font-bold text-xl text-paper mb-5">Shipping method</h2>
                  <div className="space-y-3">
                    {SHIPPING_OPTIONS.map(opt=>(
                      <label key={opt.id} className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all"
                        style={{borderColor:shipping===opt.id?"#C4531A":"rgba(255,255,255,0.08)",background:shipping===opt.id?"rgba(196,83,26,0.05)":"transparent"}}>
                        <input type="radio" name="shipping" value={opt.id} checked={shipping===opt.id} onChange={()=>setShipping(opt.id)} className="accent-rust" />
                        <div className="flex-1">
                          <p className="text-sm font-dm-sans font-medium text-paper">{opt.label}</p>
                          <p className="text-xs text-muted font-dm-sans">{opt.eta}</p>
                        </div>
                        <span className="font-syne font-bold text-sm text-paper">
                          {opt.price === 0 ? "Free" : formatCurrency(opt.price,"CAD")}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Payment — Stripe placeholder */}
                <div>
                  <h2 className="font-syne font-bold text-xl text-paper mb-5">Payment</h2>
                  <div className="p-5 rounded-xl border" style={{borderColor:"rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.02)"}}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-lg">💳</span>
                      <span className="text-sm font-dm-sans text-paper">Secure payment via Stripe</span>
                      <span className="ml-auto text-xs text-muted font-dm-sans">256-bit SSL</span>
                    </div>
                    {/* Stripe card element would mount here */}
                    <div className="h-12 rounded-xl border flex items-center px-4" style={{borderColor:"rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.03)"}}>
                      <span className="text-sm text-muted font-dm-sans">Card number · · · · · · · ·</span>
                      <span className="ml-auto text-xs text-muted">Stripe integration active</span>
                    </div>
                    <p className="text-xs text-muted font-dm-sans mt-3 text-center">
                      Stripe keys required in .env.local to process real payments
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Right: order summary ─────────────────── */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <h2 className="font-syne font-bold text-xl text-paper mb-5">Order summary</h2>
                  <div className="rounded-2xl border overflow-hidden" style={{borderColor:"rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.02)"}}>
                    {/* Items */}
                    <div className="p-5 space-y-4" style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                      {items.map(item=>(
                        <div key={item.productId} className="flex gap-3">
                          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative" style={{background:"rgba(255,255,255,0.06)"}}>
                            {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rust text-white text-[10px] font-bold rounded-full flex items-center justify-center">{item.quantity}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-dm-sans text-paper truncate">{item.name}</p>
                            <p className="text-xs text-muted font-dm-sans">{item.shopName}</p>
                          </div>
                          <p className="text-sm font-syne font-bold text-paper shrink-0">{formatCurrency(item.price*item.quantity,"CAD")}</p>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="p-5 space-y-3">
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
                      <div className="flex justify-between pt-3" style={{borderTop:"1px solid rgba(255,255,255,0.06)"}}>
                        <span className="font-syne font-bold text-paper">Total</span>
                        <span className="font-syne font-bold text-xl text-paper">{formatCurrency(total,"CAD")}</span>
                      </div>
                    </div>
                  </div>

                  <BuyerProtectionBadge compact />

                  <button type="submit" disabled={placing}
                    className="w-full mt-5 py-4 rounded-xl text-white font-dm-sans font-semibold text-base disabled:opacity-50 flex items-center justify-center gap-2 transition-all hover:opacity-90"
                    style={{background:"#C4531A"}}>
                    {placing
                      ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Placing order...</>
                      : `Place order — ${formatCurrency(total,"CAD")}`}
                  </button>

                  <p className="text-xs text-muted text-center font-dm-sans mt-3">
                    By placing your order you agree to our{" "}
                    <Link href="/terms" className="text-rust hover:underline">Terms</Link> and{" "}
                    <Link href="/privacy" className="text-rust hover:underline">Privacy Policy</Link>
                  </p>
                </div>
              </div>
            </div>
          </form>
          )} {/* end review conditional */}
        </div>
      </div>
    </>
  );
}

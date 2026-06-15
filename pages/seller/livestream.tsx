// pages/seller/livestream.tsx
// ─── SELLER BROADCAST PAGE (PHASE 5) ────────────────────────────
// Seller starts/manages their livestream.
// Uses Agora RTC SDK for video broadcast.
// Features: start/end stream, pin products, see viewer count,
//           read live chat messages from buyers.

import Head                   from "next/head";
import { useRouter }          from "next/router";
import { useState, useEffect, useRef } from "react";
import toast                  from "react-hot-toast";
import ProtectedRoute         from "@/components/ProtectedRoute";
import { useAuth }            from "@/context/AuthContext";
import { getShopByOwner }     from "@/services/shopService";
import { getProductsByShop }  from "@/services/productService";
import {
  startLiveStream, endLiveStream, updateViewerCount,
  pinProduct, unpinProduct, listenLiveChat, sendLiveChatMessage,
  generateChannelName,
} from "@/services/livestreamService";
import { notifyFollowersLive } from "@/services/followService";
import { formatCurrency }     from "@/lib/helpers";
import ShareButton            from "@/components/ShareButton";
import type { ShopData }      from "@/services/shopService";
import type { ProductData }   from "@/services/productService";
import type { LiveChatMessage } from "@/services/livestreamService";

export default function SellerLivestreamPage() {
  return (
    <ProtectedRoute requireRole="seller">
      <BroadcastStudio />
    </ProtectedRoute>
  );
}

function BroadcastStudio() {
  const { user, userDoc } = useAuth();
  const router = useRouter();

  // Shop + products
  const [shop,     setShop]     = useState<ShopData | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);

  // Stream state
  const [streamId,   setStreamId]   = useState<string | null>(null);
  const [isLive,     setIsLive]     = useState(false);
  const [title,      setTitle]      = useState("");
  const [viewers,    setViewers]    = useState(0);
  const [hearts,     setHearts]     = useState(0);
  const [chatMsgs,   setChatMsgs]   = useState<LiveChatMessage[]>([]);
  const [chatText,   setChatText]   = useState("");
  const [pinnedId,   setPinnedId]   = useState<string | null>(null);
  const [starting,   setStarting]   = useState(false);

  // Agora
  const [agoraClient,  setAgoraClient]  = useState<any>(null);
  const [localTracks,  setLocalTracks]  = useState<any[]>([]);
  const videoRef  = useRef<HTMLDivElement>(null);
  const chatRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    getShopByOwner(user.uid).then(s => {
      if (!s) { router.push("/seller/create-shop"); return; }
      setShop(s);
      getProductsByShop(s.shopId!).then(p =>
        setProducts(p.filter(x => x.status === "live"))
      );
    });
  }, [user, router]);

  // Listen to chat when live
  useEffect(() => {
    if (!streamId) return;
    const unsub = listenLiveChat(streamId, msgs => {
      setChatMsgs(msgs);
      setHearts(msgs.filter(m => m.type === "heart").length);
      setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }), 50);
    });
    return unsub;
  }, [streamId]);

  async function handleStartStream() {
    if (!shop || !title.trim()) { toast.error("Add a title first"); return; }
    setStarting(true);
    try {
      const channelName = generateChannelName(shop.shopId!);
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;

      if (!appId) {
        toast.error("Agora App ID missing in .env.local");
        setStarting(false);
        return;
      }

      // Dynamically import Agora (browser only)
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      const client   = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      await client.setClientRole("host");
      setAgoraClient(client);

      // Join channel (no token for testing — add token server for production)
      // Fetch token from server
      const tokenRes = await fetch("/api/agora-token", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ channelName, uid: 0, role: "host" }) });
      const { token } = await tokenRes.json();
      await client.join(appId!, channelName, token, user!.uid);

      // Create and publish audio + video tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalTracks([audioTrack, videoTrack]);

      // Play local video preview
      if (videoRef.current) videoTrack.play(videoRef.current);
      await client.publish([audioTrack, videoTrack]);

      // Save stream to Firestore
      const id = await startLiveStream({
        shopId:          shop.shopId!,
        ownerId:         user!.uid,
        shopName:        shop.name,
        shopLogo:        shop.logoURL,
        title:           title.trim(),
        description:     "",
        thumbnailURL:    shop.bannerURL || shop.logoURL,
        agoraChannel:    channelName,
        status:          "live",
        viewerCount:     0,
        peakViewers:     0,
        totalHearts:     0,
        pinnedProductId: null,
      });

      setStreamId(id);
      setIsLive(true);
      toast.success("You're live! 🔴");

      // Notify all followers
      await notifyFollowersLive(shop.shopId!, shop.name, id, title.trim());

      // Mock viewer count updates (replace with real Agora events)
      const interval = setInterval(() => {
        setViewers(v => {
          const next = Math.max(0, v + Math.floor(Math.random() * 3) - 1);
          if (id) updateViewerCount(id, next);
          return next;
        });
      }, 5000);

      // Store interval to clear on end
      (window as any).__liveInterval = interval;

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to start stream");
    } finally {
      setStarting(false);
    }
  }

  async function handleEndStream() {
    if (!streamId) return;
    try {
      // Stop Agora
      localTracks.forEach(t => { t.stop(); t.close(); });
      if (agoraClient) await agoraClient.leave();
      clearInterval((window as any).__liveInterval);

      await endLiveStream(streamId);
      setIsLive(false);
      setStreamId(null);
      toast.success("Stream ended");
    } catch(err) {
      console.error(err);
      toast.error("Error ending stream");
    }
  }

  async function handlePinProduct(p: ProductData) {
    if (!streamId) return;
    if (pinnedId === p.productId) {
      await unpinProduct(streamId, p.productId!);
      setPinnedId(null);
      toast("Product unpinned");
    } else {
      await pinProduct(streamId, {
        productId: p.productId!,
        name:      p.name,
        price:     p.price,
        image:     p.images?.[0] || "",
        currency:  p.currency || "CAD",
        pinnedAt:  null,
      });
      setPinnedId(p.productId!);
      toast.success(`📦 ${p.name} pinned to stream`);
    }
  }

  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatText.trim() || !streamId || !user || !userDoc) return;
    const msg = chatText.trim();
    setChatText("");
    await sendLiveChatMessage(streamId, {
      userId:    user.uid,
      userName:  userDoc.displayName,
      userPhoto: userDoc.photoURL || "",
      text:      msg,
      type:      "message",
    });
  }

  return (
    <>
      <Head><title>Go Live — {shop?.name || "Planet Mall"}</title></Head>

      <div className="min-h-screen bg-void text-paper">
        {/* Top bar */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/[0.06]" style={{background:"#0D0B0A"}}>
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-syne font-bold text-lg text-paper">{shop?.name}</span>
            {isLive && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{background:"rgba(196,83,26,0.2)"}}>
                <span className="w-2 h-2 bg-rust rounded-full animate-pulse-dot" />
                <span className="text-rust text-xs font-bold font-dm-sans">LIVE</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isLive && (
              <div className="flex items-center gap-4 text-sm font-dm-sans">
                <span className="flex items-center gap-1.5 text-muted">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                  {viewers} watching
                </span>
                <span className="text-muted">❤️ {hearts}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              {streamId && (
                <ShareButton
                  url={typeof window !== "undefined" ? `${window.location.origin}/live/${streamId}` : ""}
                  title={title || "Live Stream"}
                  text={`🔴 ${shop?.name} is live on Planet Mall — "${title}"`}
                  variant="button"
                />
              )}
              <button
                onClick={() => router.push("/seller/dashboard")}
                className="px-4 py-2 rounded-xl text-sm font-dm-sans border border-white/10 text-muted hover:text-paper transition-colors">
                ← Dashboard
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 h-[calc(100vh-65px)]">

          {/* ── Left: Video + controls ───────────────── */}
          <div className="lg:col-span-2 flex flex-col p-3 sm:p-6 gap-4">

            {/* Video preview — full height on mobile */}
            <div className="relative rounded-2xl overflow-hidden"
              style={{
                background:"#0D0B0A",
                border:"1px solid rgba(255,255,255,0.06)",
                height: "calc(50vh)",
                minHeight: "280px",
              }}>
              <div ref={videoRef} className="w-full h-full" style={{position:"absolute",inset:0}} />

              {!isLive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📡</div>
                    <p className="font-syne font-bold text-xl text-paper mb-2">Ready to go live?</p>
                    <p className="text-sm text-muted font-dm-sans">Your camera preview will appear here</p>
                  </div>
                </div>
              )}

              {/* Live overlay info */}
              {isLive && (
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div className="px-3 py-2 rounded-xl" style={{background:"rgba(0,0,0,0.7)"}}>
                    <p className="text-sm font-dm-sans font-semibold text-paper">{title}</p>
                    <p className="text-xs text-muted font-dm-sans">{shop?.name}</p>
                  </div>
                  <button onClick={handleEndStream}
                    className="px-4 py-2 rounded-xl text-white text-sm font-dm-sans font-bold"
                    style={{background:"rgba(196,83,26,0.9)"}}>
                    End stream
                  </button>
                </div>
              )}
            </div>

            {/* Stream setup / controls */}
            {!isLive ? (
              <div className="rounded-2xl p-5" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)"}}>
                <h2 className="font-syne font-bold text-lg text-paper mb-4">Stream setup</h2>
                <div className="flex gap-4">
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Stream title — e.g. New arrivals drop 🔥"
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-dm-sans text-paper placeholder:text-muted/40 focus:outline-none border"
                    style={{background:"rgba(255,255,255,0.04)",borderColor:"rgba(255,255,255,0.1)"}}
                    onFocus={e => e.target.style.borderColor = "rgba(196,83,26,0.5)"}
                    onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                  <button
                    onClick={handleStartStream}
                    disabled={starting || !title.trim()}
                    className="px-6 py-3 rounded-xl text-white font-dm-sans font-bold text-sm disabled:opacity-40 flex items-center gap-2"
                    style={{background:"#C4531A"}}>
                    {starting
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Starting...</>
                      : "🔴 Go Live"}
                  </button>
                </div>
                <p className="text-xs text-muted font-dm-sans mt-3">
                  Make sure your Agora App ID is set in .env.local before going live.
                </p>
              </div>
            ) : (
              /* Pin products panel */
              <div className="rounded-2xl p-5" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)"}}>
                <h2 className="font-syne font-bold text-base text-paper mb-4">📦 Pin a product</h2>
                {products.length === 0 ? (
                  <p className="text-sm text-muted font-dm-sans">No live products. Add products first.</p>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {products.map(p => (
                      <button
                        key={p.productId}
                        onClick={() => handlePinProduct(p)}
                        className="flex-shrink-0 w-32 rounded-xl border p-2 text-left transition-all"
                        style={{
                          background:  pinnedId === p.productId ? "rgba(196,83,26,0.1)" : "rgba(255,255,255,0.03)",
                          borderColor: pinnedId === p.productId ? "#C4531A"              : "rgba(255,255,255,0.08)",
                        }}>
                        <div className="w-full h-20 rounded-lg overflow-hidden mb-2" style={{background:"rgba(255,255,255,0.06)"}}>
                          {p.images?.[0]
                            ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                        </div>
                        <p className="text-xs font-dm-sans text-paper line-clamp-1">{p.name}</p>
                        <p className="text-xs font-bold font-syne mt-0.5" style={{color:"#C4531A"}}>
                          {formatCurrency(p.price, "CAD")}
                        </p>
                        {pinnedId === p.productId && (
                          <p className="text-[10px] text-green font-dm-sans mt-0.5">● Pinned</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right: Live chat ──────────────────────── */}
          <div className="flex flex-col border-l border-white/[0.06]" style={{background:"#0A0908"}}>
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <h2 className="font-syne font-bold text-base text-paper">Live chat</h2>
              {isLive && <p className="text-xs text-muted font-dm-sans">{viewers} watching</p>}
            </div>

            {/* Messages */}
            <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {chatMsgs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-3xl mb-2">💬</p>
                  <p className="text-xs text-muted font-dm-sans">
                    {isLive ? "Chat will appear here" : "Go live to see chat"}
                  </p>
                </div>
              ) : (
                chatMsgs.map(msg => (
                  <div key={msg.id} className="flex gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-xs"
                      style={{background:"rgba(255,255,255,0.08)"}}>
                      {msg.userPhoto
                        ? <img src={msg.userPhoto} alt="" className="w-full h-full object-cover" />
                        : "👤"}
                    </div>
                    <div>
                      <span className="text-xs font-dm-sans font-semibold" style={{color:"#C4531A"}}>{msg.userName} </span>
                      {msg.type === "heart"
                        ? <span className="text-sm">❤️</span>
                        : <span className="text-xs font-dm-sans text-paper/80">{msg.text}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat input */}
            <form onSubmit={handleSendChat} className="px-4 py-3 border-t border-white/[0.06]">
              <div className="flex gap-2">
                <input
                  value={chatText}
                  onChange={e => setChatText(e.target.value)}
                  placeholder={isLive ? "Say something..." : "Go live to chat"}
                  disabled={!isLive}
                  className="flex-1 px-3 py-2 rounded-full text-xs font-dm-sans text-paper placeholder:text-muted/40 focus:outline-none disabled:opacity-40"
                  style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)"}}
                />
                <button type="submit" disabled={!chatText.trim() || !isLive}
                  className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-40 flex-shrink-0"
                  style={{background:"#C4531A"}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="-rotate-45 translate-x-0.5">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

// pages/live/[streamId].tsx
// ─── VIEWER WATCH PAGE (PHASE 5) ────────────────────────────────
// Buyer watches the livestream.
// Features: Agora RTC video, live chat, pinned product buy button,
//           heart reactions, viewer count.

import Head              from "next/head";
import Link              from "next/link";
import { useRouter }     from "next/router";
import { useState, useEffect, useRef } from "react";
import { useAuth }       from "@/context/AuthContext";
import { useCart }       from "@/context/CartContext";
import {
  listenStream, listenLiveChat, listenPinnedProduct,
  sendLiveChatMessage, updateViewerCount,
} from "@/services/livestreamService";
import { formatCurrency } from "@/lib/helpers";
import toast             from "react-hot-toast";
import ShareButton       from "@/components/ShareButton";
import type { LiveStream, LiveChatMessage, PinnedProduct } from "@/services/livestreamService";

export default function WatchPage() {
  const router  = useRouter();
  const { streamId } = router.query;
  const { user, userDoc } = useAuth();
  const { addItem, openCart } = useCart();

  const [stream,  setStream]  = useState<LiveStream | null>(null);
  const [chat,    setChat]    = useState<LiveChatMessage[]>([]);
  const [pinned,  setPinned]  = useState<PinnedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatText, setChatText] = useState("");
  const [hearts,  setHearts]  = useState(0);
  const videoRef  = useRef<HTMLDivElement>(null);
  const chatRef   = useRef<HTMLDivElement>(null);
  const agoraRef  = useRef<any>(null);

  // Listen to stream metadata
  useEffect(() => {
    if (!streamId) return;
    const unsub = listenStream(streamId as string, s => {
      setStream(s);
      setLoading(false);
    });
    return unsub;
  }, [streamId]);

  // Listen to chat
  useEffect(() => {
    if (!streamId) return;
    const unsub = listenLiveChat(streamId as string, msgs => {
      setChat(msgs);
      setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }), 50);
    });
    return unsub;
  }, [streamId]);

  // Listen to pinned product
  useEffect(() => {
    if (!streamId || !stream?.pinnedProductId) { setPinned(null); return; }
    const unsub = listenPinnedProduct(streamId as string, stream.pinnedProductId, setPinned);
    return unsub;
  }, [streamId, stream?.pinnedProductId]);

  // Join Agora as audience
  useEffect(() => {
    if (!stream || stream.status !== "live" || !stream.agoraChannel) return;
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    if (!appId) return;

    async function joinStream() {
      try {
        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        const client   = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
        await client.setClientRole("audience");
        agoraRef.current = client;

        client.on("user-published", async (remoteUser: any, mediaType: "audio" | "video" | "datachannel") => {
          await client.subscribe(remoteUser, mediaType);
          if (mediaType === "video" && videoRef.current) {
            remoteUser.videoTrack.play(videoRef.current);
          }
          if (mediaType === "audio") remoteUser.audioTrack.play();
        });

        // Fetch token
        const tokenRes = await fetch("/api/agora-token", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ channelName: stream!.agoraChannel, uid: 0, role: "audience" }) });
        const { token } = await tokenRes.json();
        await client.join(appId!, stream!.agoraChannel, token, user?.uid || null);

        // Update viewer count
        if (streamId) updateViewerCount(streamId as string, (stream!.viewerCount || 0) + 1);

        // Send join message
        if (user && userDoc && streamId) {
          await sendLiveChatMessage(streamId as string, {
            userId:    user.uid,
            userName:  userDoc.displayName,
            userPhoto: userDoc.photoURL || "",
            text:      "joined the stream",
            type:      "join",
          });
        }
      } catch(err) {
        console.error("Agora join error:", err);
      }
    }

    joinStream();
    return () => {
      agoraRef.current?.leave();
      if (streamId) updateViewerCount(streamId as string, Math.max(0, (stream!.viewerCount || 1) - 1));
    };
  }, [stream?.agoraChannel, stream?.status]);

  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatText.trim() || !streamId || !user || !userDoc) return;
    const msg = chatText.trim();
    setChatText("");
    await sendLiveChatMessage(streamId as string, {
      userId:    user.uid,
      userName:  userDoc.displayName,
      userPhoto: userDoc.photoURL || "",
      text:      msg,
      type:      "message",
    });
  }

  async function handleHeart() {
    if (!streamId || !user || !userDoc) return;
    setHearts(h => h + 1);
    await sendLiveChatMessage(streamId as string, {
      userId:    user.uid,
      userName:  userDoc.displayName,
      userPhoto: userDoc.photoURL || "",
      text:      "❤️",
      type:      "heart",
    });
  }

  function handleAddPinnedToCart() {
    if (!pinned || !stream) return;
    addItem({
      productId: pinned.productId,
      shopId:    stream.shopId,
      shopName:  stream.shopName,
      name:      pinned.name,
      image:     pinned.image,
      price:     pinned.price,
      quantity:  1,
      currency:  pinned.currency as any,
    });
    toast.success("Added to cart!");
    openCart();
  }

  if (loading) return (
    <div className="min-h-screen bg-void flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#C4531A"}} />
    </div>
  );

  if (!stream) return (
    <div className="min-h-screen bg-void flex items-center justify-center text-center px-4">
      <div>
        <p className="text-4xl mb-4">📡</p>
        <h1 className="font-syne font-bold text-2xl text-paper mb-2">Stream not found</h1>
        <Link href="/livestreams" className="text-rust text-sm font-dm-sans">Browse live streams →</Link>
      </div>
    </div>
  );

  const isEnded = stream.status === "ended";

  return (
    <>
      <Head><title>{stream.title} — Planet Mall Live</title></Head>

      <div className="h-screen bg-void flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.06] flex-shrink-0" style={{background:"#0D0B0A"}}>
          <div className="flex items-center gap-3">
            <Link href="/livestreams" className="text-muted hover:text-paper transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <div>
              <p className="font-dm-sans font-semibold text-sm text-paper">{stream.title}</p>
              <p className="text-xs text-muted font-dm-sans">{stream.shopName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isEnded ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{background:"rgba(196,83,26,0.15)"}}>
                <span className="w-1.5 h-1.5 bg-rust rounded-full animate-pulse-dot" />
                <span className="text-rust text-[10px] font-bold font-dm-sans">LIVE</span>
              </div>
            ) : (
              <span className="text-xs text-muted font-dm-sans px-2.5 py-1 rounded-full" style={{background:"rgba(255,255,255,0.06)"}}>Ended</span>
            )}
            <div className="flex items-center gap-1 text-xs text-muted font-dm-sans">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              {stream.viewerCount || 0}
            </div>
            <ShareButton
              url={typeof window !== "undefined" ? window.location.href : ""}
              title={stream.title}
              text={`🔴 ${stream.shopName} is live on Planet Mall — "${stream.title}"`}
              variant="button"
            />
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* ── Video ──────────────────────────────── */}
          <div className="flex-1 relative" style={{background:"#000"}}>
            <div ref={videoRef} className="w-full h-full" />

            {isEnded && (
              <div className="absolute inset-0 flex items-center justify-center" style={{background:"rgba(0,0,0,0.8)"}}>
                <div className="text-center">
                  <p className="text-4xl mb-3">📡</p>
                  <p className="font-syne font-bold text-xl text-paper mb-1">Stream ended</p>
                  <p className="text-sm text-muted font-dm-sans mb-5">Thanks for watching {stream.shopName}</p>
                  <Link href={`/shop/${stream.shopId}`}
                    className="px-5 py-2.5 rounded-full text-white text-sm font-dm-sans font-semibold"
                    style={{background:"#C4531A"}}>
                    Visit store →
                  </Link>
                </div>
              </div>
            )}

            {/* Pinned product card */}
            {pinned && !isEnded && (
              <div className="absolute bottom-6 left-4 right-4 sm:right-auto sm:max-w-xs">
                <div className="rounded-2xl overflow-hidden shadow-2xl" style={{background:"rgba(10,9,8,0.92)",border:"1px solid rgba(196,83,26,0.3)"}}>
                  <div className="flex gap-3 p-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{background:"rgba(255,255,255,0.08)"}}>
                      {pinned.image && <img src={pinned.image} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-dm-sans font-bold uppercase tracking-wide mb-0.5" style={{color:"#C4531A"}}>
                        📦 Featured product
                      </p>
                      <p className="text-sm font-dm-sans font-semibold text-paper line-clamp-1">{pinned.name}</p>
                      <p className="font-syne font-bold text-lg text-paper">{formatCurrency(pinned.price, pinned.currency as any)}</p>
                    </div>
                  </div>
                  <button onClick={handleAddPinnedToCart}
                    className="w-full py-2.5 text-white text-sm font-dm-sans font-bold transition-all hover:opacity-90"
                    style={{background:"#C4531A"}}>
                    Add to cart — {formatCurrency(pinned.price, pinned.currency as any)}
                  </button>
                </div>
              </div>
            )}

            {/* Heart button */}
            {!isEnded && (
              <button onClick={handleHeart}
                className="absolute bottom-6 right-4 w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg transition-all active:scale-90"
                style={{background:"rgba(0,0,0,0.6)",border:"1px solid rgba(255,255,255,0.1)"}}>
                ❤️
              </button>
            )}
          </div>

          {/* ── Chat sidebar ───────────────────────── */}
          <div className="w-80 flex flex-col border-l border-white/[0.06] flex-shrink-0 hidden sm:flex" style={{background:"#0A0908"}}>
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <p className="font-syne font-bold text-sm text-paper">Live chat</p>
            </div>

            <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {chat.map(msg => (
                <div key={msg.id} className="flex gap-2 items-start">
                  <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-xs mt-0.5"
                    style={{background:"rgba(255,255,255,0.08)"}}>
                    {msg.userPhoto ? <img src={msg.userPhoto} alt="" className="w-full h-full object-cover" /> : "👤"}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold font-dm-sans" style={{color: msg.type === "join" ? "#2A6B45" : "#C4531A"}}>
                      {msg.userName}{" "}
                    </span>
                    {msg.type === "heart"
                      ? <span>❤️</span>
                      : <span className="text-xs font-dm-sans text-paper/70 break-words">{msg.text}</span>}
                  </div>
                </div>
              ))}
            </div>

            {user ? (
              <form onSubmit={handleSendChat} className="px-4 py-3 border-t border-white/[0.06] flex gap-2">
                <input
                  value={chatText}
                  onChange={e => setChatText(e.target.value)}
                  placeholder="Say something..."
                  disabled={isEnded}
                  className="flex-1 px-3 py-2 rounded-full text-xs font-dm-sans text-paper placeholder:text-muted/40 focus:outline-none disabled:opacity-40"
                  style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)"}}
                />
                <button type="submit" disabled={!chatText.trim() || isEnded}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40"
                  style={{background:"#C4531A"}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="-rotate-45 translate-x-0.5">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </form>
            ) : (
              <div className="px-4 py-3 border-t border-white/[0.06] text-center">
                <Link href="/auth/login" className="text-xs text-rust font-dm-sans hover:underline">
                  Sign in to chat
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

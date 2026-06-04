// pages/messages/[conversationId].tsx
// ─── CHAT WINDOW (PHASE 4) ───────────────────────────────────────
// Real-time messaging between buyer and seller.
// Features: text messages, product card sharing, read receipts,
//           typing indicator, message timestamps, image support.

import Head              from "next/head";
import Link              from "next/link";
import { useRouter }     from "next/router";
import { useState, useEffect, useRef } from "react";
import { doc, getDoc }   from "firebase/firestore";
import { db }            from "@/lib/firebase";
import { useAuth }       from "@/context/AuthContext";
import {
  listenMessages, sendMessage, markAsRead,
} from "@/services/messageService";
import { formatCurrency, timeAgo } from "@/lib/helpers";
import type { Message, Conversation } from "@/services/messageService";

export default function ChatPage() {
  const router  = useRouter();
  const { conversationId } = router.query;
  const { user, userDoc }  = useAuth();

  const [conv,     setConv]     = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text,     setText]     = useState("");
  const [sending,  setSending]  = useState(false);
  const [loading,  setLoading]  = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Load conversation metadata
  useEffect(() => {
    if (!conversationId) return;
    getDoc(doc(db, "conversations", conversationId as string)).then(snap => {
      if (snap.exists()) setConv({ id: snap.id, ...snap.data() } as Conversation);
      setLoading(false);
    });
  }, [conversationId]);

  // Listen to messages in real time
  useEffect(() => {
    if (!conversationId) return;
    const unsub = listenMessages(conversationId as string, msgs => {
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });
    return unsub;
  }, [conversationId]);

  // Mark as read when opening
  useEffect(() => {
    if (!conversationId || !user) return;
    markAsRead(conversationId as string, user.uid);
  }, [conversationId, user]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!text.trim() || !user || !userDoc || !conversationId) return;
    const msg = text.trim();
    setText("");
    setSending(true);
    try {
      await sendMessage(conversationId as string, {
        senderId:    user.uid,
        senderName:  userDoc.displayName,
        senderPhoto: userDoc.photoURL || "",
        text:        msg,
        type:        "text",
        productCard: null,
      });
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-void flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#C4531A"}} />
    </div>
  );

  if (!conv) return (
    <div className="min-h-screen bg-void flex items-center justify-center text-center px-4">
      <div>
        <p className="text-3xl mb-3">💬</p>
        <p className="font-syne font-bold text-xl text-paper mb-2">Conversation not found</p>
        <Link href="/messages" className="text-rust text-sm font-dm-sans">← Back to messages</Link>
      </div>
    </div>
  );

  const isSeller  = user?.uid === conv.sellerId;
  const otherName  = isSeller ? conv.buyerName  : conv.shopName;
  const otherPhoto = isSeller ? conv.buyerPhoto : conv.shopLogo;
  const otherHref  = isSeller ? `/profile/${conv.buyerId}` : `/shop/${conv.shopId}`;

  return (
    <>
      <Head><title>{otherName} — Messages — Planet Mall</title></Head>

      <div className="h-screen bg-void flex flex-col">

        {/* ── Header ─────────────────────────────────── */}
        <div className="flex items-center gap-4 px-4 py-3 border-b" style={{borderColor:"rgba(255,255,255,0.06)",background:"#0D0B0A"}}>
          <Link href="/messages" className="text-muted hover:text-paper transition-colors p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Link>

          <Link href={otherHref} className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={{background:"rgba(255,255,255,0.08)"}}>
              {otherPhoto
                ? <img src={otherPhoto} alt="" className="w-full h-full object-cover" />
                : <span>{isSeller ? "👤" : "🏪"}</span>}
            </div>
            <div className="min-w-0">
              <p className="font-dm-sans font-semibold text-sm text-paper truncate">{otherName}</p>
              <p className="text-xs text-muted font-dm-sans">
                {isSeller ? "Buyer" : conv.shopName}
              </p>
            </div>
          </Link>

          {/* View shop button for buyer */}
          {!isSeller && (
            <Link href={`/shop/${conv.shopId}`}
              className="px-3 py-1.5 rounded-full text-xs font-dm-sans font-medium border border-white/10 text-muted hover:text-paper hover:border-white/20 transition-all flex-shrink-0">
              View shop
            </Link>
          )}
        </div>

        {/* ── Messages ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-3xl mb-3">👋</p>
              <p className="text-sm text-muted font-dm-sans">
                Start of your conversation with {otherName}
              </p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isMe     = msg.senderId === user?.uid;
            const showTime = i === 0 ||
              (messages[i-1] as any)?.createdAt?.seconds &&
              ((msg as any)?.createdAt?.seconds - (messages[i-1] as any)?.createdAt?.seconds) > 300;

            return (
              <div key={msg.id}>
                {/* Time separator */}
                {showTime && (msg as any).createdAt && (
                  <p className="text-center text-[10px] text-muted font-dm-sans mb-3">
                    {timeAgo((msg as any).createdAt)}
                  </p>
                )}

                <div className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Avatar */}
                  {!isMe && (
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 self-end flex items-center justify-center text-sm"
                      style={{background:"rgba(255,255,255,0.08)"}}>
                      {msg.senderPhoto
                        ? <img src={msg.senderPhoto} alt="" className="w-full h-full object-cover" />
                        : <span>👤</span>}
                    </div>
                  )}

                  <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    {/* Product card message */}
                    {msg.type === "product" && msg.productCard && (
                      <Link href={`/product/${msg.productCard.productId}`}
                        className="block rounded-2xl overflow-hidden border border-white/10 hover:border-rust/30 transition-all"
                        style={{background:"rgba(255,255,255,0.04)",maxWidth:"220px"}}>
                        <div className="h-32 bg-white/[0.04] overflow-hidden">
                          {msg.productCard.image && (
                            <img src={msg.productCard.image} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-xs font-dm-sans font-medium text-paper line-clamp-2 mb-1">
                            {msg.productCard.name}
                          </p>
                          <p className="font-syne font-bold text-sm" style={{color:"#C4531A"}}>
                            {formatCurrency(msg.productCard.price, msg.productCard.currency as any)}
                          </p>
                          <p className="text-[10px] text-muted font-dm-sans mt-1">Tap to view product →</p>
                        </div>
                      </Link>
                    )}

                    {/* Text bubble */}
                    {msg.text && (
                      <div
                        className="px-4 py-2.5 rounded-2xl text-sm font-dm-sans leading-relaxed"
                        style={{
                          background: isMe ? "#C4531A" : "rgba(255,255,255,0.08)",
                          color:      "#F2EDE4",
                          borderRadius: isMe
                            ? "20px 20px 4px 20px"
                            : "20px 20px 20px 4px",
                        }}
                      >
                        {msg.text}
                      </div>
                    )}

                    {/* Read receipt */}
                    {isMe && (
                      <p className="text-[10px] text-muted font-dm-sans px-1">
                        {msg.read ? "✓✓ Read" : "✓ Sent"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* ── Input bar ──────────────────────────────── */}
        <div className="px-4 py-3 border-t" style={{borderColor:"rgba(255,255,255,0.06)",background:"#0D0B0A"}}>
          <form onSubmit={handleSend} className="flex items-center gap-3">
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={`Message ${otherName}...`}
              className="flex-1 px-4 py-3 rounded-full text-sm font-dm-sans text-paper placeholder:text-muted/40 focus:outline-none"
              style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)"}}
              onFocus={e => e.target.style.borderColor = "rgba(196,83,26,0.5)"}
              onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
              style={{background: text.trim() ? "#C4531A" : "rgba(255,255,255,0.06)"}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-paper -rotate-45 translate-x-0.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

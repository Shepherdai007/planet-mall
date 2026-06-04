// pages/messages/index.tsx
// ─── MESSAGES INBOX (PHASE 4) ────────────────────────────────────
// Shows all conversations for the logged-in user.
// Clicking a conversation opens the chat window.
// Design: dark void bg, rust accent, DM Sans

import Head              from "next/head";
import Link              from "next/link";
import { useEffect, useState } from "react";
import { useRouter }     from "next/router";
import Layout            from "@/components/Layout";
import { useAuth }       from "@/context/AuthContext";
import { listenConversations } from "@/services/messageService";
import { timeAgo }       from "@/lib/helpers";
import type { Conversation } from "@/services/messageService";

export default function MessagesPage() {
  const { user, userDoc, isLoggedIn, loading } = useAuth();
  const router   = useRouter();
  const [convs,  setConvs]  = useState<Conversation[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = listenConversations(user.uid, c => {
      setConvs(c);
      setLoaded(true);
    });
    return unsub;
  }, [user]);

  if (!loading && !isLoggedIn) {
    router.push("/auth/login?redirect=/messages");
    return null;
  }

  const totalUnread = convs.reduce((sum, c) => {
    const isSeller = user?.uid === c.sellerId;
    return sum + (isSeller ? c.unreadSeller || 0 : c.unreadBuyer || 0);
  }, 0);

  return (
    <>
      <Head><title>Messages — Planet Mall</title></Head>
      <Layout>
        <div className="min-h-screen bg-void pt-8 pb-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">

            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-syne font-bold text-3xl text-paper">Messages</h1>
                {totalUnread > 0 && (
                  <p className="text-sm font-dm-sans mt-1" style={{color:"#C4531A"}}>
                    {totalUnread} unread
                  </p>
                )}
              </div>
            </div>

            {!loaded ? (
              <div className="flex justify-center py-20">
                <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#C4531A"}} />
              </div>
            ) : convs.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-4xl mb-4">💬</p>
                <h2 className="font-syne font-bold text-xl text-paper mb-2">No messages yet</h2>
                <p className="text-sm text-muted font-dm-sans mb-6">
                  Start a conversation by visiting a product or shop
                </p>
                <Link href="/explore"
                  className="px-6 py-3 rounded-full text-white text-sm font-dm-sans font-semibold"
                  style={{background:"#C4531A"}}>
                  Browse marketplace
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {convs.map(conv => {
                  const isSeller = user?.uid === conv.sellerId;
                  const unread   = isSeller ? conv.unreadSeller : conv.unreadBuyer;
                  const otherName  = isSeller ? conv.buyerName  : conv.shopName;
                  const otherPhoto = isSeller ? conv.buyerPhoto : conv.shopLogo;

                  return (
                    <Link
                      key={conv.id}
                      href={`/messages/${conv.id}`}
                      className="flex items-center gap-4 p-4 rounded-2xl border transition-all hover:border-white/15"
                      style={{
                        background: unread ? "rgba(196,83,26,0.05)" : "rgba(255,255,255,0.02)",
                        borderColor: unread ? "rgba(196,83,26,0.2)" : "rgba(255,255,255,0.06)",
                      }}
                    >
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-lg"
                        style={{background:"rgba(255,255,255,0.08)"}}>
                        {otherPhoto
                          ? <img src={otherPhoto} alt="" className="w-full h-full object-cover" />
                          : <span>{isSeller ? "👤" : "🏪"}</span>}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="font-dm-sans font-semibold text-sm text-paper truncate">
                            {otherName || "Unknown"}
                          </p>
                          <p className="text-xs text-muted font-dm-sans flex-shrink-0 ml-2">
                            {timeAgo(conv.lastMessageAt as any)}
                          </p>
                        </div>
                        <p className="text-xs text-muted font-dm-sans truncate">
                          {conv.lastSenderId === user?.uid ? "You: " : ""}
                          {conv.lastMessage || "Start of conversation"}
                        </p>
                      </div>

                      {/* Unread badge */}
                      {unread ? (
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                          style={{background:"#C4531A"}}>
                          {unread > 9 ? "9+" : unread}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}

// pages/notifications.tsx
// ─── NOTIFICATIONS PAGE ──────────────────────────────────────────
// Full-page notifications like Instagram/Snapchat.
// Groups by Today, Yesterday, Earlier.

"use client";
import Head          from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Link          from "next/link";
import Layout        from "@/components/Layout";
import { useAuth }   from "@/context/AuthContext";
import { listenNotifications, markNotificationRead, markAllNotificationsRead } from "@/services/notificationService";
import { timeAgo }   from "@/lib/helpers";
import type { Notification } from "@/services/notificationService";

const NOTIF_ICONS: Record<string, string> = {
  new_order:    "📦",
  new_message:  "💬",
  new_follower: "👤",
  stream_live:  "🔴",
  review:       "⭐",
  payment:      "💳",
  system:       "📢",
};

const NOTIF_COLORS: Record<string, string> = {
  new_order:    "#C4531A",
  new_message:  "#2A6B45",
  new_follower: "#D4A84B",
  stream_live:  "#C4531A",
  review:       "#D4A84B",
  payment:      "#2A6B45",
  system:       "#8A8480",
};

function groupNotifications(notifs: Notification[]) {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;

  const groups: { label: string; items: Notification[] }[] = [
    { label: "Today",     items: [] },
    { label: "Yesterday", items: [] },
    { label: "Earlier",   items: [] },
  ];

  for (const n of notifs) {
    const ts = (n.createdAt as any)?.seconds
      ? (n.createdAt as any).seconds * 1000
      : new Date(n.createdAt as any).getTime();

    if (ts >= today)         groups[0].items.push(n);
    else if (ts >= yesterday) groups[1].items.push(n);
    else                      groups[2].items.push(n);
  }

  return groups.filter(g => g.items.length > 0);
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const router   = useRouter();
  const [notifs,  setNotifs]  = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/auth/login?redirect=/notifications"); return; }
    const unsub = listenNotifications(user.uid, (n) => {
      setNotifs(n);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const unread = notifs.filter(n => !n.read);
  const groups = groupNotifications(notifs);

  async function handleRead(notif: Notification) {
    if (!user || !notif.id || notif.read) return;
    await markNotificationRead(user.uid, notif.id);
    if (notif.link) router.push(notif.link);
  }

  async function handleMarkAllRead() {
    if (!user || unread.length === 0) return;
    setMarking(true);
    const ids = unread.map(n => n.id!).filter(Boolean);
    await markAllNotificationsRead(user.uid, ids);
    setMarking(false);
  }

  return (
    <>
      <Head><title>Notifications — Planet Mall</title></Head>
      <Layout>
        <div className="min-h-screen pt-16" style={{background:"#0E0C0A"}}>
          <div className="max-w-lg mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-5 sticky top-16 z-10"
              style={{background:"#0E0C0A",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
              <div className="flex items-center gap-3">
                <button onClick={() => router.back()}
                  className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
                  style={{background:"rgba(255,255,255,0.05)"}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-paper">
                    <path d="M19 12H5M12 5l-7 7 7 7"/>
                  </svg>
                </button>
                <div>
                  <h1 className="font-syne font-bold text-xl text-paper">Notifications</h1>
                  {unread.length > 0 && (
                    <p className="text-xs font-dm-sans" style={{color:"#C4531A"}}>{unread.length} unread</p>
                  )}
                </div>
              </div>
              {unread.length > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={marking}
                  className="text-xs font-dm-sans font-medium px-3 py-1.5 rounded-full transition-all"
                  style={{background:"rgba(196,83,26,0.1)",color:"#C4531A"}}>
                  {marking ? "Marking..." : "Mark all read"}
                </button>
              )}
            </div>

            {/* Content */}
            <div className="pb-24">
              {loading ? (
                // Skeleton
                <div className="px-4 pt-4 space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex gap-3 p-4 rounded-2xl animate-pulse"
                      style={{background:"rgba(255,255,255,0.03)"}}>
                      <div className="w-11 h-11 rounded-full flex-shrink-0" style={{background:"rgba(255,255,255,0.06)"}} />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 rounded-full w-3/4" style={{background:"rgba(255,255,255,0.06)"}} />
                        <div className="h-3 rounded-full w-1/2" style={{background:"rgba(255,255,255,0.04)"}} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifs.length === 0 ? (
                // Empty state
                <div className="flex flex-col items-center justify-center pt-24 px-8 text-center">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
                    style={{background:"rgba(196,83,26,0.1)"}}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#C4531A" strokeWidth="1.5">
                      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
                    </svg>
                  </div>
                  <p className="font-syne font-bold text-xl text-paper mb-2">All caught up!</p>
                  <p className="text-sm font-dm-sans text-muted leading-relaxed">
                    You have no notifications yet. When someone orders from you, messages you, or follows your store — it'll show up here.
                  </p>
                </div>
              ) : (
                // Grouped notifications
                groups.map(group => (
                  <div key={group.label}>
                    {/* Group label */}
                    <p className="px-4 pt-5 pb-2 text-xs font-dm-sans font-semibold uppercase tracking-widest"
                      style={{color:"#8A8480"}}>
                      {group.label}
                    </p>

                    {group.items.map(notif => {
                      const color = NOTIF_COLORS[notif.type] || "#8A8480";
                      const icon  = NOTIF_ICONS[notif.type]  || "📢";

                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleRead(notif)}
                          className="flex gap-4 px-4 py-4 cursor-pointer transition-all active:scale-[0.98]"
                          style={{
                            background: !notif.read ? "rgba(196,83,26,0.04)" : "transparent",
                            borderBottom: "1px solid rgba(255,255,255,0.03)",
                          }}
                        >
                          {/* Icon circle */}
                          <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-xl"
                            style={{background:`${color}15`}}>
                            {icon}
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-sm font-dm-sans font-semibold leading-snug"
                              style={{color: notif.read ? "rgba(242,237,228,0.7)" : "#F2EDE4"}}>
                              {notif.title}
                            </p>
                            <p className="text-xs font-dm-sans mt-0.5 leading-relaxed"
                              style={{color:"#8A8480"}}>
                              {notif.body}
                            </p>
                            <p className="text-[10px] font-dm-sans mt-1.5"
                              style={{color:"rgba(138,132,128,0.6)"}}>
                              {timeAgo(notif.createdAt as any)}
                            </p>
                          </div>

                          {/* Unread dot */}
                          {!notif.read && (
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-2"
                              style={{background:"#C4531A"}} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

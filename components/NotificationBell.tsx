// components/NotificationBell.tsx
// ─── NOTIFICATION BELL ───────────────────────────────────────────
// Shows unread count badge. Dropdown with recent notifications.
// Added to Navbar.

"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { listenNotifications, markNotificationRead } from "@/services/notificationService";
import { timeAgo } from "@/lib/helpers";
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

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifs, setNotifs]   = useState<Notification[]>([]);
  const [open,   setOpen]     = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = listenNotifications(user.uid, setNotifs);
    return unsub;
  }, [user]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unread = notifs.filter(n => !n.read).length;

  async function handleOpen() {
    setOpen(o => !o);
  }

  async function handleRead(notif: Notification) {
    if (!user || !notif.id || notif.read) return;
    await markNotificationRead(user.uid, notif.id);
  }

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 text-muted hover:text-paper transition-colors"
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{background:"#C4531A"}}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-2xl overflow-hidden z-50"
          style={{background:"#141210",border:"1px solid rgba(255,255,255,0.08)"}}>

          <div className="px-4 py-3 flex items-center justify-between"
            style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
            <p className="font-syne font-bold text-sm text-paper">Notifications</p>
            {unread > 0 && (
              <span className="text-xs font-dm-sans px-2 py-0.5 rounded-full"
                style={{background:"rgba(196,83,26,0.15)",color:"#C4531A"}}>
                {unread} new
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-xs text-muted font-dm-sans">No notifications yet</p>
              </div>
            ) : (
              notifs.slice(0, 15).map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleRead(notif)}
                  className="flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/[0.03]"
                  style={{
                    background: !notif.read ? "rgba(196,83,26,0.04)" : "transparent",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">
                    {NOTIF_ICONS[notif.type] || "📢"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-dm-sans font-medium text-paper leading-snug">{notif.title}</p>
                    <p className="text-xs text-muted font-dm-sans mt-0.5 leading-relaxed">{notif.body}</p>
                    <p className="text-[10px] text-muted/60 font-dm-sans mt-1">{timeAgo(notif.createdAt as any)}</p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{background:"#C4531A"}} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

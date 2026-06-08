// components/NotificationBell.tsx
// ─── NOTIFICATION BELL ───────────────────────────────────────────
// Just shows unread badge. Clicking navigates to /notifications page.

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { listenNotifications } from "@/services/notificationService";
import type { Notification } from "@/services/notificationService";

export default function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = listenNotifications(user.uid, setNotifs);
    return unsub;
  }, [user]);

  const unread = notifs.filter(n => !n.read).length;

  if (!user) return null;

  return (
    <button
      onClick={() => router.push("/notifications")}
      className="relative flex items-center justify-center w-10 h-10 text-muted hover:text-paper transition-colors"
      aria-label="Notifications"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
      {unread > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          style={{background:"#C4531A"}}>
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
}

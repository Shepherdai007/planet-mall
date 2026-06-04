// components/FollowButton.tsx
// ─── FOLLOW / SUBSCRIBE BUTTON ───────────────────────────────────
// Shows on shop pages and product pages.
// When seller goes live, all followers get instant notification.

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth }   from "@/context/AuthContext";
import { followShop, unfollowShop, isFollowing } from "@/services/followService";
import toast from "react-hot-toast";

interface Props {
  shopId:   string;
  shopName: string;
  compact?: boolean;
}

export default function FollowButton({ shopId, shopName, compact = false }: Props) {
  const { user, userDoc, isLoggedIn } = useAuth();
  const router   = useRouter();
  const [following, setFollowing] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [checked,   setChecked]   = useState(false);

  useEffect(() => {
    if (!user || !shopId) return;
    isFollowing(user.uid, shopId).then(f => {
      setFollowing(f);
      setChecked(true);
    });
  }, [user, shopId]);

  async function handleToggle() {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    if (!user || !userDoc) return;
    setLoading(true);
    try {
      if (following) {
        await unfollowShop(user.uid, shopId);
        setFollowing(false);
        toast("Unfollowed " + shopName);
      } else {
        await followShop(user.uid, userDoc.displayName, shopId, shopName);
        setFollowing(true);
        toast.success(`Following ${shopName}! You'll be notified when they go live 🔴`);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!checked) return null;

  if (compact) {
    return (
      <button onClick={handleToggle} disabled={loading}
        className="flex items-center gap-1.5 text-xs font-dm-sans font-medium transition-all disabled:opacity-50"
        style={{color: following ? "#2A6B45" : "#8A8480"}}>
        {following ? "✓ Following" : "+ Follow"}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-dm-sans font-semibold transition-all disabled:opacity-50"
      style={{
        background: following ? "rgba(42,107,69,0.1)" : "rgba(255,255,255,0.06)",
        border:     `1px solid ${following ? "rgba(42,107,69,0.3)" : "rgba(255,255,255,0.1)"}`,
        color:      following ? "#2A6B45" : "#F2EDE4",
      }}>
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : following ? (
        <>✓ Following</>
      ) : (
        <>🔔 Follow</>
      )}
    </button>
  );
}

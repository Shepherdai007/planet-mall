// pages/rooms/index.tsx
// ─── PLANET ROOMS — BROWSE PAGE ──────────────────────────────────

import Head          from "next/head";
import Link          from "next/link";
import { useState, useEffect } from "react";
import Layout         from "@/components/Layout";
import { useAuth }    from "@/context/AuthContext";
import { getAllRooms, ROOM_CATEGORIES, type Room } from "@/services/roomService";

export default function RoomsPage() {
  const { user, isLoggedIn } = useAuth();
  const [rooms,    setRooms]    = useState<Room[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [category, setCategory] = useState("All");
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    getAllRooms().then(r => { setRooms(r); setLoading(false); });
    // Show welcome popup once a week
    const seen = localStorage.getItem("rooms_intro_seen");
    const now  = Date.now();
    if (!seen || now - parseInt(seen) > 7 * 24 * 60 * 60 * 1000) setShowInfo(true);
  }, []);

  function dismissInfo() {
    localStorage.setItem("rooms_intro_seen", Date.now().toString());
    setShowInfo(false);
  }

  const filtered = category === "All" ? rooms : rooms.filter(r => r.category === category);

  return (
    <>
      <Head>
        <title>Planet Rooms — Paid Group Communities</title>
        <meta name="description" content="Join paid group rooms. Chat, voice, video. Sports, business, education and more." />
      </Head>
      <Layout>
        <div className="min-h-screen pb-20" style={{background:"#0A0908"}}>
          <div className="max-w-3xl mx-auto px-4 pt-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-syne font-bold text-2xl text-paper">🏠 Planet Rooms</h1>
                <p className="text-sm font-dm-sans mt-1" style={{color:"#8A8480"}}>Join paid communities. Chat & go live together.</p>
              </div>
              {isLoggedIn && (
                <Link href="/rooms/create"
                  className="px-4 py-2.5 rounded-xl text-sm font-dm-sans font-bold"
                  style={{background:"#C4531A", color:"#fff"}}>
                  + Create Room
                </Link>
              )}
            </div>

            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
              {["All", ...ROOM_CATEGORIES].map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className="px-3 py-1.5 rounded-full text-xs font-dm-sans font-medium whitespace-nowrap flex-shrink-0 transition-all"
                  style={{
                    background: category === cat ? "#C4531A" : "rgba(255,255,255,0.04)",
                    color:      category === cat ? "#fff"     : "#8A8480",
                    border:     `1px solid ${category === cat ? "#C4531A" : "rgba(255,255,255,0.08)"}`,
                  }}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Rooms list */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#C4531A"}} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-4xl mb-4">🏠</p>
                <p className="font-dm-sans mb-2 text-paper">No rooms yet</p>
                <p className="text-sm font-dm-sans mb-6" style={{color:"#8A8480"}}>Be the first to create a room!</p>
                {isLoggedIn && (
                  <Link href="/rooms/create"
                    className="px-5 py-2.5 rounded-xl font-dm-sans font-bold text-sm"
                    style={{background:"#C4531A",color:"#fff"}}>
                    Create Room
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(room => (
                  <Link key={room.id} href={`/rooms/${room.id}`}
                    className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:border-orange-800"
                    style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>

                    {/* Room photo */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-2xl font-bold"
                      style={{background:"rgba(196,83,26,0.15)",color:"#C4531A"}}>
                      {room.photo
                        ? <img src={room.photo} alt="" className="w-full h-full object-cover" />
                        : room.name?.[0]?.toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-syne font-bold text-paper truncate">{room.name}</h3>
                        {room.price === 0 && room.memberCount < 2 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{background:"rgba(42,107,69,0.2)",color:"#2A6B45"}}>FREE</span>
                        )}
                        {room.price === 0 && room.memberCount >= 2 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{background:"rgba(196,83,26,0.2)",color:"#C4531A"}}>FULL</span>
                        )}
                      </div>
                      <p className="text-xs font-dm-sans truncate mb-1" style={{color:"#8A8480"}}>{room.description}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-dm-sans" style={{color:"#8A8480"}}>👥 {room.memberCount} members</span>
                        <span className="text-[10px] font-dm-sans px-2 py-0.5 rounded-full"
                          style={{background:"rgba(255,255,255,0.04)",color:"#8A8480"}}>{room.category}</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right flex-shrink-0">
                      {room.price === 0 ? (
                        <p className="font-syne font-bold text-sm" style={{color:"#2A6B45"}}>Free</p>
                      ) : (
                        <>
                          <p className="font-syne font-bold text-sm" style={{color:"#C4531A"}}>${room.price}</p>
                          <p className="text-[10px] font-dm-sans" style={{color:"#8A8480"}}>/month</p>
                        </>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── How It Works — First Visit Popup ─────────────── */}
        {showInfo && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
            style={{background:"rgba(0,0,0,0.8)"}}>
            <div className="w-full max-w-sm rounded-2xl p-6"
              style={{background:"#141210",border:"1px solid rgba(255,255,255,0.1)"}}>

              {/* Title */}
              <div className="text-center mb-5">
                <p className="text-3xl mb-2">🏠</p>
                <h2 className="font-syne font-bold text-xl text-paper mb-1">Welcome to Planet Rooms</h2>
                <p className="text-xs font-dm-sans" style={{color:"#8A8480"}}>
                  Paid communities with live chat & voice calls
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-3 mb-6">
                {[
                  { icon:"🏠", title:"Create a Room", desc:"Set a name, description, category and monthly price. Free rooms are limited to 2 members only." },
                  { icon:"💳", title:"Members Pay to Join", desc:"Set CA$2+/month to allow unlimited members. Planet Mall takes 10% — the rest is yours." },
                  { icon:"👥", title:"Free Room Limit", desc:"Free rooms (CA$0) allow only 2 members max — owner + 1 person. Upgrade to paid to grow your community." },
                  { icon:"💬", title:"Chat Together", desc:"Real-time group chat inside your room. Everyone who joins can send messages." },
                  { icon:"🎙️", title:"Voice Calls", desc:"Tap to Talk to join a live voice channel. Raise your hand and the owner approves you to speak." },
                  { icon:"🔗", title:"Invite Anyone", desc:"Share your room link on WhatsApp, Telegram or anywhere to grow your community." },
                ].map((s, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                      style={{background:"rgba(196,83,26,0.12)"}}>
                      {s.icon}
                    </div>
                    <div>
                      <p className="text-xs font-dm-sans font-bold text-paper">{s.title}</p>
                      <p className="text-[11px] font-dm-sans leading-relaxed" style={{color:"#8A8480"}}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={dismissInfo}
                className="w-full py-3 rounded-xl font-dm-sans font-bold text-sm"
                style={{background:"#C4531A",color:"#fff"}}>
                Got it — Let's Go! 🚀
              </button>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}

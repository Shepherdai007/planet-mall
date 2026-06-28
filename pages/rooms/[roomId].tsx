// pages/rooms/[roomId].tsx
// ─── INSIDE A PLANET ROOM ─────────────────────────────────────────
// Members: real-time chat + Agora voice call
// Non-members: see room info + pay to join

import Head           from "next/head";
import Link           from "next/link";
import { useRouter }  from "next/router";
import { useState, useEffect, useRef } from "react";
import Layout          from "@/components/Layout";
import { useAuth }     from "@/context/AuthContext";
import {
  getRoom, isMember, sendRoomMessage,
  listenRoomMessages, listenRoomMembers,
  type Room, type RoomMessage, type RoomMember,
} from "@/services/roomService";
import toast           from "react-hot-toast";

// Agora
let AgoraRTC: any = null;
if (typeof window !== "undefined") {
  import("agora-rtc-sdk-ng").then(m => { AgoraRTC = m.default; });
}
const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID!;

export default function RoomPage() {
  const router              = useRouter();
  const { roomId }          = router.query;
  const { user, isLoggedIn } = useAuth();

  const [room,      setRoom]      = useState<Room | null>(null);
  const [messages,  setMessages]  = useState<RoomMessage[]>([]);
  const [members,   setMembers]   = useState<RoomMember[]>([]);
  const [joined,    setJoined]    = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [text,      setText]      = useState("");
  const [sending,   setSending]   = useState(false);
  const [tab,       setTab]       = useState<"chat"|"members">("chat");
  const [paying,    setPaying]    = useState(false);

  // Voice call state
  const [inCall,       setInCall]       = useState(false);
  const [muted,        setMuted]        = useState(false);
  const [callMembers,  setCallMembers]  = useState<string[]>([]);
  const clientRef    = useRef<any>(null);
  const micTrackRef  = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isOwner = room?.ownerId === user?.uid;

  useEffect(() => {
    if (!roomId) return;
    const rid = roomId as string;

    getRoom(rid).then(async r => {
      setRoom(r);
      if (r && user) {
        const m = await isMember(rid, user.uid);
        setJoined(m);
      }
      setLoading(false);
    });

    const unsubMsgs    = listenRoomMessages(rid, setMessages);
    const unsubMembers = listenRoomMembers(rid, setMembers);
    return () => { unsubMsgs(); unsubMembers(); };
  }, [roomId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!text.trim() || !user || !room || !joined) return;
    setSending(true);
    try {
      await sendRoomMessage(room.id!, {
        userId:    user.uid,
        userName:  user.displayName || "Anonymous",
        userPhoto: user.photoURL    || "",
        text:      text.trim(),
        type:      "text",
      });
      setText("");
    } catch { toast.error("Failed to send"); }
    finally { setSending(false); }
  }

  async function handleJoinFree() {
    if (!user || !room) return;
    setPaying(true);
    try {
      const { addMember } = await import("@/services/roomService");
      await addMember(room.id!, {
        userId:          user.uid,
        userName:        user.displayName || "Anonymous",
        userPhoto:       user.photoURL    || "",
        role:            "member",
        stripeSessionId: "free",
      });
      setJoined(true);
      toast.success("Joined! Welcome 🎉");
    } catch { toast.error("Failed to join"); }
    finally { setPaying(false); }
  }

  async function handlePayAndJoin() {
    if (!user || !room) return;
    setPaying(true);
    try {
      const res = await fetch("/api/rooms/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          roomId:    room.id,
          roomName:  room.name,
          price:     room.price,
          currency:  room.currency,
          userId:    user.uid,
          userName:  user.displayName || "Anonymous",
          userPhoto: user.photoURL    || "",
        }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch { toast.error("Payment failed"); }
    finally { setPaying(false); }
  }

  // ── Voice call ────────────────────────────────────────────────
  async function startVoiceCall() {
    if (!AgoraRTC || !room) return;
    try {
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      client.on("user-published", async (remoteUser: any, mediaType: string) => {
        await client.subscribe(remoteUser, mediaType);
        if (mediaType === "audio") remoteUser.audioTrack?.play();
        setCallMembers(prev => [...new Set([...prev, remoteUser.uid.toString()])]);
      });
      client.on("user-left", (remoteUser: any) => {
        setCallMembers(prev => prev.filter(id => id !== remoteUser.uid.toString()));
      });

      await client.join(AGORA_APP_ID, room.agoraChannel, null, user!.uid);
      const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
      micTrackRef.current = micTrack;
      await client.publish([micTrack]);
      setInCall(true);
      setCallMembers([user!.uid]);
      toast.success("Joined voice call 🎙️");
    } catch (e) {
      toast.error("Could not join call");
    }
  }

  async function leaveVoiceCall() {
    micTrackRef.current?.close();
    await clientRef.current?.leave();
    setInCall(false);
    setCallMembers([]);
    toast("Left call");
  }

  function toggleMute() {
    if (!micTrackRef.current) return;
    if (muted) { micTrackRef.current.setEnabled(true); setMuted(false); }
    else        { micTrackRef.current.setEnabled(false); setMuted(true); }
  }

  if (loading) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center" style={{background:"#0A0908"}}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#C4531A"}} />
      </div>
    </Layout>
  );

  if (!room) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center text-center px-4" style={{background:"#0A0908"}}>
        <div>
          <p className="text-4xl mb-4">🏠</p>
          <p className="font-dm-sans text-paper mb-4">Room not found</p>
          <Link href="/rooms" className="text-sm font-dm-sans" style={{color:"#C4531A"}}>← Back to Rooms</Link>
        </div>
      </div>
    </Layout>
  );

  return (
    <>
      <Head><title>{room.name} — Planet Rooms</title></Head>
      <Layout>
        <div className="min-h-screen flex flex-col" style={{background:"#0A0908"}}>

          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-3 border-b" style={{borderColor:"rgba(255,255,255,0.06)"}}>
            <Link href="/rooms" className="text-sm font-dm-sans" style={{color:"#8A8480"}}>←</Link>
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center font-bold flex-shrink-0"
              style={{background:"rgba(196,83,26,0.15)",color:"#C4531A"}}>
              {room.photo ? <img src={room.photo} alt="" className="w-full h-full object-cover" /> : room.name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-syne font-bold text-paper text-sm truncate">{room.name}</p>
              <p className="text-[10px] font-dm-sans" style={{color:"#8A8480"}}>👥 {room.memberCount} members · {room.category}</p>
            </div>
            {/* Voice call button */}
            {joined && (
              inCall ? (
                <div className="flex gap-2">
                  <button onClick={toggleMute}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{background: muted ? "rgba(196,83,26,0.2)" : "rgba(42,107,69,0.2)", color: muted ? "#C4531A" : "#2A6B45"}}>
                    {muted ? "🔇 Muted" : "🎙️ Live"}
                  </button>
                  <button onClick={leaveVoiceCall}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{background:"rgba(196,83,26,0.2)",color:"#C4531A"}}>
                    Leave
                  </button>
                </div>
              ) : (
                <button onClick={startVoiceCall}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold"
                  style={{background:"rgba(255,255,255,0.06)",color:"#8A8480"}}>
                  🎙️ Voice
                </button>
              )
            )}
          </div>

          {/* Active call banner */}
          {inCall && (
            <div className="px-4 py-2 text-xs font-dm-sans font-semibold text-center"
              style={{background:"rgba(42,107,69,0.15)",color:"#2A6B45"}}>
              🎙️ Voice call active · {callMembers.length} on call
            </div>
          )}

          {/* NOT A MEMBER — show paywall */}
          {!joined ? (
            <div className="flex-1 flex items-center justify-center px-4">
              <div className="max-w-sm w-full text-center">
                <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-3xl font-bold mx-auto mb-4"
                  style={{background:"rgba(196,83,26,0.15)",color:"#C4531A"}}>
                  {room.photo ? <img src={room.photo} alt="" className="w-full h-full object-cover" /> : room.name?.[0]}
                </div>
                <h2 className="font-syne font-bold text-xl text-paper mb-2">{room.name}</h2>
                <p className="text-sm font-dm-sans mb-4" style={{color:"#8A8480"}}>{room.description}</p>

                <div className="flex justify-center gap-6 mb-6">
                  <div className="text-center">
                    <p className="font-syne font-bold text-paper">{room.memberCount}</p>
                    <p className="text-xs font-dm-sans" style={{color:"#8A8480"}}>Members</p>
                  </div>
                  <div className="text-center">
                    <p className="font-syne font-bold" style={{color:"#C4531A"}}>
                      {room.price === 0 ? "Free" : `CA$${room.price}/mo`}
                    </p>
                    <p className="text-xs font-dm-sans" style={{color:"#8A8480"}}>Price</p>
                  </div>
                  <div className="text-center">
                    <p className="font-syne font-bold text-paper">{room.category}</p>
                    <p className="text-xs font-dm-sans" style={{color:"#8A8480"}}>Category</p>
                  </div>
                </div>

                {!isLoggedIn ? (
                  <Link href="/login"
                    className="block w-full py-3.5 rounded-xl font-dm-sans font-bold text-sm text-center"
                    style={{background:"#C4531A",color:"#fff"}}>
                    Sign in to Join
                  </Link>
                ) : room.price === 0 ? (
                  <button onClick={handleJoinFree} disabled={paying}
                    className="w-full py-3.5 rounded-xl font-dm-sans font-bold text-sm disabled:opacity-50"
                    style={{background:"#C4531A",color:"#fff"}}>
                    {paying ? "Joining..." : "Join Free 🎉"}
                  </button>
                ) : (
                  <button onClick={handlePayAndJoin} disabled={paying}
                    className="w-full py-3.5 rounded-xl font-dm-sans font-bold text-sm disabled:opacity-50"
                    style={{background:"#C4531A",color:"#fff"}}>
                    {paying ? "Redirecting..." : `Join for CA$${room.price}/month`}
                  </button>
                )}

                <p className="text-xs font-dm-sans mt-3" style={{color:"#8A8480"}}>
                  {room.price > 0 ? "Billed monthly. Cancel anytime." : "Free to join — no payment needed."}
                </p>
              </div>
            </div>

          ) : (
            /* MEMBER VIEW */
            <>
              {/* Tabs */}
              <div className="flex border-b" style={{borderColor:"rgba(255,255,255,0.06)"}}>
                {(["chat","members"] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className="flex-1 py-3 text-xs font-dm-sans font-semibold capitalize transition-all"
                    style={{
                      color:        tab === t ? "#C4531A" : "#8A8480",
                      borderBottom: tab === t ? "2px solid #C4531A" : "2px solid transparent",
                    }}>
                    {t === "chat" ? "💬 Chat" : `👥 Members (${members.length})`}
                  </button>
                ))}
              </div>

              {/* Chat */}
              {tab === "chat" && (
                <div className="flex flex-col flex-1" style={{minHeight:0}}>
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{maxHeight:"calc(100vh - 260px)"}}>
                    {messages.length === 0 && (
                      <div className="text-center py-10">
                        <p className="text-sm font-dm-sans" style={{color:"#8A8480"}}>No messages yet. Say hello! 👋</p>
                      </div>
                    )}
                    {messages.map(msg => {
                      const isMe = msg.userId === user?.uid;
                      const isSystem = msg.type === "join" || msg.type === "leave";
                      if (isSystem) return (
                        <div key={msg.id} className="text-center">
                          <span className="text-xs font-dm-sans px-3 py-1 rounded-full"
                            style={{background:"rgba(255,255,255,0.04)",color:"#8A8480"}}>{msg.text}</span>
                        </div>
                      );
                      return (
                        <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                          <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-bold"
                            style={{background:"rgba(196,83,26,0.2)",color:"#C4531A"}}>
                            {msg.userPhoto
                              ? <img src={msg.userPhoto} alt="" className="w-full h-full object-cover" />
                              : msg.userName?.[0]}
                          </div>
                          <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                            {!isMe && <p className="text-[10px] font-dm-sans mb-0.5" style={{color:"#8A8480"}}>{msg.userName}</p>}
                            <div className="px-3 py-2 rounded-2xl text-sm font-dm-sans"
                              style={{
                                background: isMe ? "#C4531A" : "rgba(255,255,255,0.06)",
                                color: "#fff",
                                borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                              }}>
                              {msg.text}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="px-4 py-3 border-t" style={{borderColor:"rgba(255,255,255,0.06)"}}>
                    <div className="flex gap-2">
                      <input
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-dm-sans text-paper outline-none"
                        style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)"}}
                      />
                      <button onClick={handleSend} disabled={sending || !text.trim()}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
                        style={{background:"#C4531A",color:"#fff"}}>
                        ➤
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Members */}
              {tab === "members" && (
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                  {members.map(m => (
                    <div key={m.userId} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{background:"rgba(255,255,255,0.03)"}}>
                      <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-bold"
                        style={{background:"rgba(196,83,26,0.2)",color:"#C4531A"}}>
                        {m.userPhoto ? <img src={m.userPhoto} alt="" className="w-full h-full object-cover" /> : m.userName?.[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-dm-sans font-semibold text-paper">{m.userName}</p>
                        <p className="text-[10px] font-dm-sans" style={{color:"#8A8480"}}>
                          {m.role === "owner" ? "👑 Owner" : "Member"}
                        </p>
                      </div>
                      {callMembers.includes(m.userId) && (
                        <span className="text-[10px] font-dm-sans font-bold px-2 py-0.5 rounded-full"
                          style={{background:"rgba(42,107,69,0.2)",color:"#2A6B45"}}>🎙️ On call</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </Layout>
    </>
  );
}

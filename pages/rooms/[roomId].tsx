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
import { db } from "@/lib/firebase";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
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
  const [paying,      setPaying]      = useState(false);
  const [showInvite,  setShowInvite]  = useState(false);
  const [showEdit,    setShowEdit]    = useState(false);
  const [editForm,    setEditForm]    = useState({ name:"", description:"", price:"" });
  const [editPhoto,   setEditPhoto]   = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState("");
  const [editSaving,  setEditSaving]  = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);

  // Voice call state
  const [inCall,         setInCall]         = useState(false);
  const [muted,          setMuted]          = useState(true); // muted by default
  const [callMembers,    setCallMembers]    = useState<string[]>([]);
  const [raisedHands,    setRaisedHands]    = useState<string[]>([]); // userIds who raised hand
  const [allowedToTalk,  setAllowedToTalk]  = useState<string[]>([]); // approved by owner
  const [handRaised,     setHandRaised]     = useState(false); // current user's hand
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

    // Listen to raised hands + allowed speakers on the room doc
    const unsubRoom = onSnapshot(doc(db, "rooms", rid), snap => {
      if (!snap.exists()) return;
      const data = snap.data();
      setRaisedHands(data.raisedHands   || []);
      setAllowedToTalk(data.allowedToTalk || []);
    });

    return () => { unsubMsgs(); unsubMembers(); unsubRoom(); };
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
    } catch (e: any) {
      if (e.message === "FREE_ROOM_FULL") {
        toast.error("This free room is full (max 2 members). The owner must upgrade to CA$2+/month to allow more members.");
      } else {
        toast.error("Failed to join");
      }
    } finally { setPaying(false); }
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

  // ── Raise hand ───────────────────────────────────────────────
  async function handleRaiseHand() {
    if (!user || !room) return;
    const newHands = handRaised
      ? raisedHands.filter(id => id !== user.uid)
      : [...raisedHands, user.uid];
    setHandRaised(!handRaised);
    await updateDoc(doc(db, "rooms", room.id!), { raisedHands: newHands });
    if (!handRaised) toast("✋ Hand raised! Waiting for owner to allow you to speak...");
    else toast("Hand lowered");
  }

  // ── Owner: approve speaker ────────────────────────────────────
  async function handleApproveSpeaker(userId: string) {
    if (!room || !isOwner) return;
    const newAllowed = allowedToTalk.includes(userId)
      ? allowedToTalk.filter(id => id !== userId)
      : [...allowedToTalk, userId];
    const newHands = raisedHands.filter(id => id !== userId);
    await updateDoc(doc(db, "rooms", room.id!), {
      allowedToTalk: newAllowed,
      raisedHands:   newHands,
    });
    toast.success(allowedToTalk.includes(userId) ? "Speaker muted" : "Speaker approved ✅");
  }

  // ── Owner: edit room ──────────────────────────────────────────
  async function handleSaveEdit() {
    if (!room || !user) return;
    setEditSaving(true);
    try {
      let photoURL = room.photo;
      if (editPhoto) {
        const storage = getStorage();
        const sRef = storageRef(storage, `rooms/${user.uid}/${Date.now()}_${editPhoto.name}`);
        await uploadBytes(sRef, editPhoto);
        photoURL = await getDownloadURL(sRef);
      }
      const newPrice = parseFloat(editForm.price);
      const commission  = isNaN(newPrice) ? room.commission  : Math.round(newPrice * 0.10 * 100) / 100;
      const ownerPayout = isNaN(newPrice) ? room.ownerPayout : Math.round((newPrice - commission) * 100) / 100;

      await updateDoc(doc(db, "rooms", room.id!), {
        name:         editForm.name        || room.name,
        description:  editForm.description || room.description,
        photo:        photoURL,
        ...(!isNaN(newPrice) && { price: newPrice, commission, ownerPayout }),
      });
      setRoom(r => r ? {
        ...r,
        name:         editForm.name        || r.name,
        description:  editForm.description || r.description,
        photo:        photoURL,
        ...(!isNaN(newPrice) && { price: newPrice, commission, ownerPayout }),
      } : r);
      toast.success("Room updated! ✅");
      setShowEdit(false);
      setEditPhoto(null);
      setEditPreview("");
    } catch { toast.error("Failed to update"); }
    finally { setEditSaving(false); }
  }

  // ── Voice call ────────────────────────────────────────────────
  async function startVoiceCall() {
    if (!AgoraRTC || !room) return;
    const canTalk = isOwner || allowedToTalk.includes(user!.uid);
    try {
      const tokenRes = await fetch("/api/agora-token", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ channelName: room.agoraChannel, uid: 0, role: "host" }),
      });
      const { token } = await tokenRes.json();
      if (!token) { toast.error("Could not get call token"); return; }

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

      await client.join(AGORA_APP_ID, room.agoraChannel, token, user!.uid);
      const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
      micTrackRef.current = micTrack;
      // Start muted unless owner or approved
      await micTrack.setEnabled(canTalk);
      setMuted(!canTalk);
      await client.publish([micTrack]);
      setInCall(true);
      setCallMembers([user!.uid]);
      toast.success(canTalk ? "Joined voice call 🎙️" : "Joined call — mic muted. Raise hand to speak.");
    } catch {
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

  async function toggleMute() {
    if (!micTrackRef.current) return;
    const canTalk = isOwner || allowedToTalk.includes(user!.uid);
    if (!canTalk && muted) {
      toast.error("Raise your hand to get permission to speak ✋");
      return;
    }
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
            {/* Share/Invite button */}
            <button onClick={() => setShowInvite(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0"
              style={{background:"rgba(255,255,255,0.06)",color:"#8A8480"}}>
              🔗 Invite
            </button>
            {/* Edit button — owner only */}
            {isOwner && (
              <button onClick={() => { setEditForm({ name: room.name, description: room.description, price: room.price.toString() }); setShowEdit(true); }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0"
                style={{background:"rgba(196,83,26,0.1)",color:"#C4531A"}}>
                ✏️ Edit
              </button>
            )}
            {/* Voice call controls */}
            {joined && (
              inCall ? (
                <div className="flex gap-2">
                  {/* Tap to Talk / Mute */}
                  <button onClick={toggleMute}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: muted ? "rgba(196,83,26,0.2)" : "rgba(42,107,69,0.3)",
                      color:      muted ? "#C4531A"              : "#2A6B45",
                    }}>
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
                  🎙️ Tap to Talk
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

          {/* Raise hand banner for members not yet approved */}
          {inCall && !isOwner && !allowedToTalk.includes(user?.uid || "") && (
            <div className="px-4 py-2 flex items-center justify-between"
              style={{background:"rgba(212,168,75,0.08)",borderBottom:"1px solid rgba(212,168,75,0.15)"}}>
              <p className="text-xs font-dm-sans" style={{color:"#D4A84B"}}>
                {handRaised ? "✋ Hand raised — waiting for owner..." : "Raise your hand to speak"}
              </p>
              <button onClick={handleRaiseHand}
                className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: handRaised ? "rgba(212,168,75,0.3)" : "rgba(212,168,75,0.15)",
                  color: "#D4A84B",
                }}>
                {handRaised ? "✋ Lower Hand" : "✋ Raise Hand"}
              </button>
            </div>
          )}

          {/* Owner: raised hands approval panel */}
          {isOwner && raisedHands.length > 0 && (
            <div className="px-4 py-2 border-b" style={{borderColor:"rgba(255,255,255,0.06)",background:"rgba(196,83,26,0.05)"}}>
              <p className="text-xs font-dm-sans font-bold mb-2" style={{color:"#C4531A"}}>
                ✋ {raisedHands.length} member{raisedHands.length > 1 ? "s" : ""} want to speak
              </p>
              <div className="flex flex-wrap gap-2">
                {raisedHands.map(uid => {
                  const m = members.find(m => m.userId === uid);
                  if (!m) return null;
                  const approved = allowedToTalk.includes(uid);
                  return (
                    <button key={uid} onClick={() => handleApproveSpeaker(uid)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                      style={{
                        background: approved ? "rgba(42,107,69,0.2)" : "rgba(196,83,26,0.15)",
                        color:      approved ? "#2A6B45"              : "#C4531A",
                        border:     `1px solid ${approved ? "rgba(42,107,69,0.3)" : "rgba(196,83,26,0.2)"}`,
                      }}>
                      <span>{m.userName}</span>
                      <span>{approved ? "✅ Approved" : "Allow"}</span>
                    </button>
                  );
                })}
              </div>
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
                ) : room.price === 0 && room.memberCount >= 2 ? (
                  <div>
                    <div className="w-full py-3.5 rounded-xl font-dm-sans font-bold text-sm text-center mb-2"
                      style={{background:"rgba(255,255,255,0.05)",color:"#8A8480",border:"1px solid rgba(255,255,255,0.08)"}}>
                      🔒 Room Full
                    </div>
                    <p className="text-xs font-dm-sans text-center" style={{color:"#D4A84B"}}>
                      This free room has reached its 2-member limit. The owner needs to set a paid price to allow more members.
                    </p>
                  </div>
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
                  {room.price > 0 ? "Billed monthly. Cancel anytime." : room.memberCount >= 2 ? "" : "Free to join — no payment needed."}
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
                      {raisedHands.includes(m.userId) && (
                        <span className="text-[10px] font-dm-sans font-bold px-2 py-0.5 rounded-full"
                          style={{background:"rgba(212,168,75,0.2)",color:"#D4A84B"}}>✋ Hand raised</span>
                      )}
                      {allowedToTalk.includes(m.userId) && (
                        <span className="text-[10px] font-dm-sans font-bold px-2 py-0.5 rounded-full"
                          style={{background:"rgba(42,107,69,0.2)",color:"#2A6B45"}}>🎙️ Can speak</span>
                      )}
                      {callMembers.includes(m.userId) && !allowedToTalk.includes(m.userId) && (
                        <span className="text-[10px] font-dm-sans font-bold px-2 py-0.5 rounded-full"
                          style={{background:"rgba(42,107,69,0.2)",color:"#2A6B45"}}>🎙️ On call</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {/* ── Edit Room Modal ──────────────────────────────── */}
          {showEdit && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
              style={{background:"rgba(0,0,0,0.75)"}}
              onClick={() => setShowEdit(false)}>
              <div className="w-full max-w-sm rounded-2xl p-6"
                style={{background:"#141210",border:"1px solid rgba(255,255,255,0.1)"}}
                onClick={e => e.stopPropagation()}>

                <h3 className="font-syne font-bold text-paper text-lg mb-5">Edit Room</h3>

                {/* Photo upload */}
                <input ref={editFileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setEditPhoto(f);
                    setEditPreview(URL.createObjectURL(f));
                  }} />
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center font-bold text-xl flex-shrink-0 cursor-pointer"
                    style={{background:"rgba(196,83,26,0.15)",color:"#C4531A",border:"2px dashed rgba(196,83,26,0.4)"}}
                    onClick={() => editFileRef.current?.click()}>
                    {editPreview
                      ? <img src={editPreview} alt="" className="w-full h-full object-cover" />
                      : room.photo
                        ? <img src={room.photo} alt="" className="w-full h-full object-cover" />
                        : "📷"}
                  </div>
                  <div className="flex-1">
                    <button onClick={() => editFileRef.current?.click()}
                      className="w-full py-2 rounded-xl text-xs font-dm-sans font-semibold"
                      style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",color:"#8A8480"}}>
                      {editPreview ? "Change Photo" : "Upload Photo"}
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div className="mb-3">
                  <label className="text-xs font-dm-sans font-semibold mb-1.5 block" style={{color:"#8A8480"}}>ROOM NAME</label>
                  <input value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-dm-sans text-paper outline-none"
                    style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)"}} />
                </div>

                {/* Description */}
                <div className="mb-5">
                  <label className="text-xs font-dm-sans font-semibold mb-1.5 block" style={{color:"#8A8480"}}>DESCRIPTION</label>
                  <textarea value={editForm.description} rows={3}
                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-dm-sans text-paper outline-none resize-none"
                    style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)"}} />
                </div>

                {/* Price */}
                <div className="mb-5">
                  <label className="text-xs font-dm-sans font-semibold mb-1.5 block" style={{color:"#8A8480"}}>MONTHLY PRICE (CAD) — set 0 for free (max 2 members)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-dm-sans" style={{color:"#8A8480"}}>CA$</span>
                    <input value={editForm.price}
                      onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                      type="number" min="0" step="0.01"
                      className="w-full pl-12 pr-4 py-2.5 rounded-xl text-sm font-dm-sans text-paper outline-none"
                      style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)"}} />
                  </div>
                  {editForm.price && parseFloat(editForm.price) > 0 && (
                    <p className="text-xs font-dm-sans mt-1" style={{color:"#8A8480"}}>
                      You receive CA${(parseFloat(editForm.price) * 0.9).toFixed(2)}/member/month after 10% commission
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setShowEdit(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-dm-sans font-semibold"
                    style={{background:"rgba(255,255,255,0.06)",color:"#8A8480"}}>
                    Cancel
                  </button>
                  <button onClick={handleSaveEdit} disabled={editSaving}
                    className="flex-1 py-2.5 rounded-xl text-sm font-dm-sans font-bold disabled:opacity-50"
                    style={{background:"#C4531A",color:"#fff"}}>
                    {editSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Invite Modal ────────────────────────────────── */}
          {showInvite && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
              style={{background:"rgba(0,0,0,0.7)"}}
              onClick={() => setShowInvite(false)}>
              <div className="w-full max-w-sm rounded-2xl p-6"
                style={{background:"#141210",border:"1px solid rgba(255,255,255,0.1)"}}
                onClick={e => e.stopPropagation()}>

                <h3 className="font-syne font-bold text-paper text-lg mb-1">Invite People</h3>
                <p className="text-xs font-dm-sans mb-5" style={{color:"#8A8480"}}>
                  Share this link to invite people to <strong style={{color:"#C4531A"}}>{room.name}</strong>
                </p>

                {/* Link box */}
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 px-3 py-2.5 rounded-xl text-xs font-dm-sans truncate"
                    style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",color:"#8A8480"}}>
                    {typeof window !== "undefined" ? window.location.href : ""}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied! 🔗");
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold flex-shrink-0"
                    style={{background:"#C4531A",color:"#fff"}}>
                    Copy
                  </button>
                </div>

                {/* Share options */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {/* WhatsApp */}
                  <button onClick={() => {
                    window.open(`https://wa.me/?text=Join%20${encodeURIComponent(room.name)}%20on%20Planet%20Mall!%20${encodeURIComponent(window.location.href)}`,"_blank");
                  }} className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                    style={{background:"rgba(37,211,102,0.08)",border:"1px solid rgba(37,211,102,0.2)"}}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="#25D366">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span className="text-[10px] font-dm-sans font-bold" style={{color:"#25D366"}}>WhatsApp</span>
                  </button>

                  {/* Telegram */}
                  <button onClick={() => {
                    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent("Join " + room.name + " on Planet Mall!")}`, "_blank");
                  }} className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                    style={{background:"rgba(0,136,204,0.08)",border:"1px solid rgba(0,136,204,0.2)"}}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="#0088cc">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    <span className="text-[10px] font-dm-sans font-bold" style={{color:"#0088cc"}}>Telegram</span>
                  </button>

                  {/* More / Native share */}
                  <button onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: room.name, text: `Join ${room.name} on Planet Mall!`, url: window.location.href });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied!");
                    }
                  }} className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                    style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8A8480" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                    <span className="text-[10px] font-dm-sans font-bold" style={{color:"#8A8480"}}>Share</span>
                  </button>
                </div>

                <button onClick={() => setShowInvite(false)}
                  className="w-full py-2.5 rounded-xl text-sm font-dm-sans font-semibold"
                  style={{background:"rgba(255,255,255,0.06)",color:"#8A8480"}}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}

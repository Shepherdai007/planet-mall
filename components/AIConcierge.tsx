// components/AIConcierge.tsx
// ─── PLANET MALL AI CONCIERGE BUBBLE ────────────────────────────
// Floating chat bubble powered by Claude AI.
// Appears on all pages via Layout.tsx.
// Helps buyers find products, guides sellers, answers questions.

"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface Message {
  role:    "user" | "assistant";
  content: string;
}

const WELCOME_MESSAGES = [
  "Hey! 👋 I'm your Planet Mall assistant. Looking for something specific, or need help getting started?",
  "Hi there! I'm here to help you find the perfect product, understand how Planet Mall works, or answer any questions.",
];

export default function AIConcierge() {
  const { userDoc } = useAuth();
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [welcomed, setWelcomed] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Show welcome message when first opened
  useEffect(() => {
    if (open && !welcomed) {
      const welcome = WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
      const greeting = userDoc?.displayName
        ? welcome.replace("Hey!", `Hey ${userDoc.displayName.split(" ")[0]}!`)
        : welcome;
      setMessages([{ role: "assistant", content: greeting }]);
      setWelcomed(true);
    }
  }, [open, welcomed, userDoc]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 100);
    }
  }, [open, messages]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/concierge", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: newMessages, userId: userDoc?.uid }),
      });
      const data = await res.json();

      if (res.status === 403 && data.error === "upgrade") {
        setMessages(m => [...m, {
          role: "assistant",
          content: data.message || "Upgrade to Premium to use the AI Concierge! 🚀",
        }]);
        // Add upgrade button message
        setMessages(m => [...m, {
          role: "assistant",
          content: "👉 [Upgrade to Premium — CA$8/month](/pricing)",
        }]);
        return;
      }

      setMessages(m => [...m, { role: "assistant", content: data.text || "Sorry, I couldn't process that. Try again!" }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "I'm having trouble connecting right now. Please try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  }

  // Quick suggestion chips
  const SUGGESTIONS = [
    "How do I open a store?",
    "How does livestream work?",
    "What's Premium?",
    "How do I track my order?",
  ];

  return (
    <>
      {/* ── Chat window ─────────────────────────── */}
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-96 flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
          style={{
            background:  "#141210",
            border:      "1px solid rgba(255,255,255,0.08)",
            maxHeight:   "520px",
          }}>

          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between flex-shrink-0"
            style={{borderBottom:"1px solid rgba(255,255,255,0.06)",background:"#0D0B0A"}}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{background:"linear-gradient(135deg, #C4531A, #D4A84B)"}}>
                ✦
              </div>
              <div>
                <p className="text-sm font-syne font-bold text-paper">Planet Mall AI</p>
                <p className="text-[10px] text-green font-dm-sans flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green rounded-full" />
                  Always here to help
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-paper transition-colors text-sm"
              style={{background:"rgba(255,255,255,0.06)"}}>
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{minHeight:0}}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mr-2 mt-0.5 self-start"
                    style={{background:"linear-gradient(135deg, #C4531A, #D4A84B)"}}>
                    ✦
                  </div>
                )}
                <div
                  className="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm font-dm-sans leading-relaxed"
                  style={{
                    background: msg.role === "user"
                      ? "#C4531A"
                      : "rgba(255,255,255,0.06)",
                    color:       "#F2EDE4",
                    borderRadius: msg.role === "user"
                      ? "20px 20px 4px 20px"
                      : "20px 20px 20px 4px",
                  }}>
                  {msg.content.includes("[Upgrade to Premium") ? (
                    <a href="/pricing" className="flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-white transition-all hover:opacity-90"
                      style={{background:"linear-gradient(135deg,#C4531A,#D4A84B)"}}>
                      ✦ Upgrade to Premium — CA$8/month
                    </a>
                  ) : msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mr-2"
                  style={{background:"linear-gradient(135deg, #C4531A, #D4A84B)"}}>✦</div>
                <div className="px-4 py-3 rounded-2xl" style={{background:"rgba(255,255,255,0.06)"}}>
                  <div className="flex gap-1 items-center h-4">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
                        style={{background:"#8A8480",animationDelay:`${i*0.2}s`}} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions — show only on first message */}
          {messages.length <= 1 && (
            <div className="px-4 pb-3 flex gap-2 overflow-x-auto flex-shrink-0">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => { setInput(s); setTimeout(() => handleSend(), 50); }}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-dm-sans border transition-all hover:border-rust/40 hover:text-paper whitespace-nowrap"
                  style={{borderColor:"rgba(255,255,255,0.1)",color:"#8A8480",background:"rgba(255,255,255,0.03)"}}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSend}
            className="px-4 py-3 flex gap-2 flex-shrink-0"
            style={{borderTop:"1px solid rgba(255,255,255,0.06)"}}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 px-3.5 py-2.5 rounded-full text-sm font-dm-sans text-paper placeholder:text-muted/40 focus:outline-none"
              style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)"}}
              onFocus={e => e.target.style.borderColor = "rgba(196,83,26,0.5)"}
              onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            />
            <button type="submit" disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
              style={{background:input.trim() ? "linear-gradient(135deg, #C4531A, #D4A84B)" : "rgba(255,255,255,0.06)"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"
                className="-rotate-45 translate-x-0.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* ── Floating bubble trigger ──────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95"
        style={{
          background: open
            ? "rgba(255,255,255,0.1)"
            : "linear-gradient(135deg, #C4531A, #D4A84B)",
          border: "2px solid rgba(255,255,255,0.1)",
        }}
        aria-label="Open AI assistant"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        ) : (
          <span className="text-2xl">✦</span>
        )}
      </button>
    </>
  );
}

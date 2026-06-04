// pages/livestreams/index.tsx
// ─── LIVE STREAMS DISCOVERY PAGE (PHASE 5) ──────────────────────
// Shows all currently live streams + recently ended
// Design: dark void, pulse animations for live indicators

import Head              from "next/head";
import Link              from "next/link";
import { useEffect, useState } from "react";
import Layout            from "@/components/Layout";
import { listenLiveStreams } from "@/services/livestreamService";
import { timeAgo }       from "@/lib/helpers";
import ShareButton       from "@/components/ShareButton";
import type { LiveStream } from "@/services/livestreamService";

export default function LivestreamsPage() {
  const [streams,  setStreams]  = useState<LiveStream[]>([]);
  const [loaded,   setLoaded]  = useState(false);

  useEffect(() => {
    const unsub = listenLiveStreams(s => { setStreams(s); setLoaded(true); });
    return unsub;
  }, []);

  return (
    <>
      <Head><title>Live Now — Planet Mall</title></Head>
      <Layout>
        <div className="min-h-screen bg-void pt-8 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">

            {/* Header */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-3 h-3 bg-green rounded-full animate-pulse-dot" />
              <h1 className="font-syne font-bold text-3xl text-paper">Live now</h1>
              {streams.length > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-dm-sans font-bold"
                  style={{background:"rgba(42,107,69,0.15)",color:"#2A6B45"}}>
                  {streams.length} stream{streams.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {!loaded ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_,i) => (
                  <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                    <div className="aspect-video bg-white/[0.04]" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-white/[0.06] rounded w-3/4" />
                      <div className="h-3 bg-white/[0.06] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : streams.length === 0 ? (
              <div className="py-32 text-center">
                <div className="text-6xl mb-6">📡</div>
                <h2 className="font-syne font-bold text-2xl text-paper mb-3">No streams live right now</h2>
                <p className="text-muted font-dm-sans mb-8 max-w-md mx-auto">
                  Be the first to go live today. Sellers on Premium can start a livestream from their dashboard.
                </p>
                <Link href="/seller/dashboard"
                  className="px-6 py-3 rounded-full text-white text-sm font-dm-sans font-semibold"
                  style={{background:"#C4531A"}}>
                  Go live now →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {streams.map(stream => (
                  <StreamCard key={stream.streamId} stream={stream} />
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}

function StreamCard({ stream }: { stream: LiveStream }) {
  return (
    <Link href={`/live/${stream.streamId}`}
      className="group rounded-2xl overflow-hidden border transition-all hover:border-rust/30"
      style={{background:"rgba(255,255,255,0.02)",borderColor:"rgba(255,255,255,0.06)"}}>

      {/* Thumbnail */}
      <div className="aspect-video relative overflow-hidden" style={{background:"#0D0B0A"}}>
        {stream.thumbnailURL ? (
          <img src={stream.thumbnailURL} alt={stream.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">📡</div>
              <p className="text-xs text-muted font-dm-sans">{stream.shopName}</p>
            </div>
          </div>
        )}

        {/* Live badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{background:"rgba(196,83,26,0.9)"}}>
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse-dot" />
          <span className="text-white text-[10px] font-bold font-dm-sans uppercase tracking-wide">Live</span>
        </div>

        {/* Viewer count */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{background:"rgba(0,0,0,0.6)"}}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
          <span className="text-white text-[10px] font-dm-sans">{stream.viewerCount || 0}</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
            style={{background:"rgba(255,255,255,0.08)"}}>
            {stream.shopLogo
              ? <img src={stream.shopLogo} alt="" className="w-full h-full object-cover" />
              : <span className="text-xs">🏪</span>}
          </div>
          <span className="text-xs text-muted font-dm-sans">{stream.shopName}</span>
        </div>
        <p className="font-dm-sans font-semibold text-sm text-paper line-clamp-2 leading-snug">
          {stream.title}
        </p>
        <p className="text-xs text-muted font-dm-sans mt-2">
          Started {timeAgo(stream.startedAt as any)}
        </p>
        <div className="mt-3" onClick={e => e.preventDefault()}>
          <ShareButton
            url={typeof window !== "undefined" ? `${window.location.origin}/live/${stream.streamId}` : ""}
            title={stream.title}
            text={`🔴 ${stream.shopName} is live on Planet Mall — "${stream.title}"`}
            variant="button"
            className="text-xs"
          />
        </div>
      </div>
    </Link>
  );
}

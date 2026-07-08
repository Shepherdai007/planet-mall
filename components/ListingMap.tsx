// components/ListingMap.tsx
// ─── LISTING MAP ─────────────────────────────────────────────────
// Small Google Map with a single pin, shown on Real Estate listing pages.
// Uses the Maps JavaScript API directly (not the Embed API iframe) since
// that's what's enabled on the API key.

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";

interface Props {
  lat?: number;
  lng?: number;
  address?: string;
}

export default function ListingMap({ lat, lng, address }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!lat || !lng) return;
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapRef.current) return;
        const google = (window as any).google;
        const map = new google.maps.Map(mapRef.current, {
          center: { lat, lng },
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
        });
        new google.maps.Marker({ position: { lat, lng }, map });
      })
      .catch(() => setFailed(true));

    return () => { cancelled = true; };
  }, [lat, lng]);

  if (!lat || !lng) return null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E8E2D9" }}>
      {failed ? (
        <div className="h-48 flex items-center justify-center text-sm font-dm-sans" style={{ background: "#F6F1E9", color: "#8A8480" }}>
          Map unavailable
        </div>
      ) : (
        <div ref={mapRef} className="h-48 w-full" style={{ background: "#F6F1E9" }} />
      )}
      {address && (
        <div className="px-4 py-2 text-xs font-dm-sans" style={{ background: "#fff", color: "#8A8480" }}>
          📍 {address}
        </div>
      )}
    </div>
  );
}

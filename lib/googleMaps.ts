// lib/googleMaps.ts
// ─── GOOGLE MAPS LOADER ──────────────────────────────────────────
// Loads the Maps JavaScript API (with the Places library) exactly once
// and caches the loading promise so multiple components can call this
// safely without double-injecting the <script> tag.
//
// Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to be set in your Vercel
// project env vars (must be NEXT_PUBLIC_ prefixed since it's used
// client-side). Restrict the key to your domain + these APIs in the
// Google Cloud Console: Geocoding API, Maps JavaScript API, Places API.

let mapsPromise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).google?.maps?.places) return Promise.resolve();
  if (mapsPromise) return mapsPromise;

  mapsPromise = new Promise((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      reject(new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY env var"));
      return;
    }

    const existing = document.getElementById("google-maps-script") as HTMLScriptElement | null;
    if (existing) {
      if ((window as any).google?.maps?.places) { resolve(); return; }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps")));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return mapsPromise;
}

// Geocode a free-typed address into coordinates. Uses google.maps.Geocoder
// (part of the JS API, billed against the Geocoding API) instead of the raw
// REST endpoint — the REST endpoint doesn't send CORS headers, so a plain
// browser fetch() to it will fail silently. This path works reliably.
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number; formattedAddress: string } | null> {
  if (!address?.trim()) return null;
  try {
    await loadGoogleMaps();
    const google = (window as any).google;
    if (!google?.maps) return null;
    const geocoder = new google.maps.Geocoder();
    return await new Promise((resolve) => {
      geocoder.geocode({ address }, (results: any[], status: string) => {
        if (status === "OK" && results?.[0]) {
          const loc = results[0].geometry.location;
          resolve({
            lat: loc.lat(),
            lng: loc.lng(),
            formattedAddress: results[0].formatted_address,
          });
        } else {
          resolve(null);
        }
      });
    });
  } catch {
    return null;
  }
}

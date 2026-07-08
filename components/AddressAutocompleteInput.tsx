// components/AddressAutocompleteInput.tsx
// ─── ADDRESS AUTOCOMPLETE INPUT ──────────────────────────────────
// Plain text input that upgrades itself with Google Places Autocomplete
// once the Maps script has loaded. Falls back to a normal text field if
// Google Maps fails to load (e.g. missing/invalid API key) so the form
// never gets blocked.

import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";

interface PlaceResult {
  address: string;
  lat: number;
  lng: number;
  city?: string;
  province?: string;
}

interface Props {
  value: string;
  onChange: (address: string) => void;
  onPlaceSelected: (place: PlaceResult) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export default function AddressAutocompleteInput({
  value, onChange, onPlaceSelected, placeholder, className, style, onFocus, onBlur,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !inputRef.current || autocompleteRef.current) return;
        const google = (window as any).google;
        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "geometry", "address_components"],
          types: ["address"],
          componentRestrictions: undefined, // allow any country — sellers list from Canada & Ghana
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place?.geometry?.location) return; // user hit enter without picking a suggestion

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address || "";

          let city = "", province = "";
          for (const comp of place.address_components || []) {
            if (comp.types.includes("locality")) city = comp.long_name;
            if (comp.types.includes("administrative_area_level_1")) province = comp.long_name;
          }

          onChange(address);
          onPlaceSelected({ address, lat, lng, city, province });
        });

        autocompleteRef.current = autocomplete;
      })
      .catch(() => {
        // Google Maps couldn't load — input silently degrades to plain text
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      style={style}
      onFocus={onFocus}
      onBlur={onBlur}
      autoComplete="off"
    />
  );
}

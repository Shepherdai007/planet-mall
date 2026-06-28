// lib/countryFlags.ts
// ─── COUNTRY FLAG EMOJI HELPER ────────────────────────────────────
// Maps country names and common football nation names to flag emojis.
// Used in predictions for team/league display.

export const COUNTRY_FLAGS: Record<string, string> = {
  // Major football nations
  "Brazil": "🇧🇷", "Argentina": "🇦🇷", "France": "🇫🇷", "Germany": "🇩🇪",
  "Spain": "🇪🇸", "Italy": "🇮🇹", "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Portugal": "🇵🇹",
  "Netherlands": "🇳🇱", "Belgium": "🇧🇪", "Croatia": "🇭🇷", "Morocco": "🇲🇦",
  "Senegal": "🇸🇳", "Ghana": "🇬🇭", "Nigeria": "🇳🇬", "Cameroon": "🇨🇲",
  "USA": "🇺🇸", "Mexico": "🇲🇽", "Canada": "🇨🇦", "Japan": "🇯🇵",
  "South Korea": "🇰🇷", "Australia": "🇦🇺", "Saudi Arabia": "🇸🇦",
  "Iran": "🇮🇷", "Qatar": "🇶🇦", "UAE": "🇦🇪", "Egypt": "🇪🇬",
  "South Africa": "🇿🇦", "Kenya": "🇰🇪", "Ethiopia": "🇪🇹",
  "Colombia": "🇨🇴", "Uruguay": "🇺🇾", "Chile": "🇨🇱", "Peru": "🇵🇪",
  "Ecuador": "🇪🇨", "Bolivia": "🇧🇴", "Paraguay": "🇵🇾", "Venezuela": "🇻🇪",
  "Poland": "🇵🇱", "Ukraine": "🇺🇦", "Serbia": "🇷🇸", "Sweden": "🇸🇪",
  "Denmark": "🇩🇰", "Norway": "🇳🇴", "Switzerland": "🇨🇭", "Austria": "🇦🇹",
  "Turkey": "🇹🇷", "Greece": "🇬🇷", "Romania": "🇷🇴", "Hungary": "🇭🇺",
  "Czech Republic": "🇨🇿", "Slovakia": "🇸🇰", "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Wales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿", "Ireland": "🇮🇪", "Russia": "🇷🇺",
  "China": "🇨🇳", "India": "🇮🇳", "Pakistan": "🇵🇰", "Indonesia": "🇮🇩",
  "Thailand": "🇹🇭", "Vietnam": "🇻🇳", "Malaysia": "🇲🇾",
  "Jordan": "🇯🇴", "Algeria": "🇩🇿", "Tunisia": "🇹🇳", "Ivory Coast": "🇨🇮",
  "DR Congo": "🇨🇩", "Angola": "🇦🇴", "Zambia": "🇿🇲", "Zimbabwe": "🇿🇼",
  // Clubs (common)
  "Man City": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Man United": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Chelsea": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Arsenal": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Liverpool": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Tottenham": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Real Madrid": "🇪🇸", "Barcelona": "🇪🇸", "Atletico": "🇪🇸",
  "Bayern Munich": "🇩🇪", "Dortmund": "🇩🇪",
  "PSG": "🇫🇷", "Juventus": "🇮🇹", "Inter Milan": "🇮🇹", "AC Milan": "🇮🇹",
  "Ajax": "🇳🇱", "Porto": "🇵🇹", "Benfica": "🇵🇹",
  "Washington Mystics": "🇺🇸", "Portland Fire": "🇺🇸",
  "Manly W.": "🇦🇺", "Bankstown Bruins": "🇦🇺",
  "Newcastle Falcons": "🇦🇺", "Penrith P.": "🇦🇺",
};

export function getTeamDisplay(name: string): string {
  const flag = COUNTRY_FLAGS[name];
  return flag ? `${flag} ${name}` : name;
}

export function getLeagueFlag(league: string): string {
  for (const [country, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (league.toLowerCase().includes(country.toLowerCase())) return flag;
  }
  if (league.includes("FIFA") || league.includes("World Cup")) return "🌍";
  if (league.includes("Champions")) return "⭐";
  if (league.includes("NBA")) return "🇺🇸";
  if (league.includes("WNBA")) return "🇺🇸";
  if (league.includes("ATP") || league.includes("WTA")) return "🎾";
  return "🏆";
}

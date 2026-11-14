// Demo data. Everything here is replaced by Supabase tables when matches go online.

export type Format = 'blitz' | 'classic' | 'grand';

export const FORMATS: { id: Format; name: string; passes: number; blurb: string }[] = [
  { id: 'blitz', name: 'Blitz', passes: 3, blurb: '3 passes, about two minutes' },
  { id: 'classic', name: 'Classic', passes: 5, blurb: '5 passes, wear starts to matter' },
  { id: 'grand', name: 'Grand', passes: 7, blurb: '7 passes, stamina decides it' },
];

const LEAGUES: [string, number][] = [['Champion', 2100], ['Earl', 1800], ['Baron', 1500], ['Knight', 1200], ['Squire', 0]];
export const leagueOf = (rating: number) => LEAGUES.find(([, min]) => rating >= min)![0];

export interface Knight {
  name: string;
  country: string;
  colors: [string, string]; // heraldry
  rating: Record<Format, number>;
  wins: number;
  losses: number;
  online: boolean;
}

const NAMES = ['Mordane', 'Ser_Isolde', 'BlackThorn', 'Ravenmoor', 'Ulric_the_Grey', 'Brannoch', 'Lady_Hesper', 'Ironhand',
  'Wulfgar', 'Seraphine', 'Dunstan', 'Corvin', 'Maelis', 'Aldric_Voss', 'Thessaly', 'Garrow'];
const COUNTRIES = ['KG', 'US', 'DE', 'FR', 'TR', 'GB', 'KZ', 'ES', 'PL', 'IT', 'BR', 'JP', 'SE', 'CZ', 'NL', 'CA'];
export const TINCTURES = ['#b3121b', '#1b1b1f', '#8d9199', '#c9a227', '#1f3a5f', '#2f5d3a', '#e6e1d8', '#4a1f5c'];

export const knights: Knight[] = NAMES.map((name, i) => {
  const base = 2380 - i * 71;
  return {
    name,
    country: COUNTRIES[i],
    colors: [TINCTURES[i % 8], TINCTURES[(i * 3 + 1) % 8]],
    rating: { blitz: base, classic: base - 40 + ((i * 37) % 90), grand: base - 90 + ((i * 53) % 150) },
    wins: 412 - i * 19,
    losses: 120 + i * 11,
    online: i % 3 !== 2,
  };
});

export const guest = (name: string): Knight => ({
  name, country: '—', colors: ['#b3121b', '#1b1b1f'], rating: { blitz: 1200, classic: 1200, grand: 1200 }, wins: 0, losses: 0, online: true,
});
export const findKnight = (name: string) => knights.find((k) => k.name === name) ?? guest(name);

export const BOTS = [
  { id: 'headhunter', name: 'The Headhunter', rating: 1350, colors: ['#b3121b', '#e6e1d8'] as [string, string], style: 'Aims for your helm every pass. Duck, or keep your shield high.' },
  { id: 'turtle', name: 'The Turtle', rating: 1100, colors: ['#2f5d3a', '#8d9199'] as [string, string], style: 'Braces and waits. Break the shield before you try to unhorse.' },
  { id: 'feinter', name: 'The Feinter', rating: 1600, colors: ['#4a1f5c', '#c9a227'] as [string, string], style: 'Hides the lance until the last second. Trust nothing you see early.' },
] as const;

export const PLANS = [
  { id: 'charge', name: 'Full charge', note: 'Hardest hit, heavy sway, costs stamina' },
  { id: 'steady', name: 'Steady canter', note: 'Tightest aim, average force' },
  { id: 'braced', name: 'Braced seat', note: 'Very hard to unhorse, weak hit' },
  { id: 'feint', name: 'Feint approach', note: 'Lance raised until late' },
  { id: 'tempo', name: 'Tempo change', note: 'Slow start, late burst' },
];

export interface Tournament {
  id: string; name: string; format: Format; size: 8 | 16; joined: number;
  band: string; status: 'open' | 'live' | 'finished'; starts: string;
}
export const tournaments: Tournament[] = [
  { id: 'ashen-cup', name: 'The Ashen Cup', format: 'classic', size: 8, joined: 8, band: 'Open', status: 'live', starts: 'Round 2 now' },
  { id: 'iron-vigil', name: 'Iron Vigil', format: 'blitz', size: 16, joined: 11, band: '1500 and above', status: 'open', starts: 'Starts in 24 min' },
  { id: 'squires-proving', name: "Squires' Proving", format: 'blitz', size: 8, joined: 5, band: 'Under 1200', status: 'open', starts: 'Starts in 1 h 10 min' },
  { id: 'long-night', name: 'The Long Night', format: 'grand', size: 8, joined: 2, band: 'Open', status: 'open', starts: 'Saturday 20:00' },
  { id: 'thornfield', name: 'Thornfield Melee', format: 'classic', size: 16, joined: 16, band: '1800 and above', status: 'finished', starts: 'Won by Mordane' },
];

export const DRILLS = [
  { bot: 'turtle', name: 'Break the wall', goal: 'Beat The Turtle. Crack the shield twice, then go for the chest.' },
  { bot: 'headhunter', name: 'Keep your head', goal: 'Beat The Headhunter. Guard high or duck, and punish the full charge.' },
  { bot: 'feinter', name: 'Read the feint', goal: 'Beat The Feinter. Do not commit your shield until the lance comes down.' },
] as const;

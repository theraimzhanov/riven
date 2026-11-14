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
const TINCTURES = ['#b3121b', '#1b1b1f', '#8d9199', '#c9a227', '#1f3a5f', '#2f5d3a', '#e6e1d8', '#4a1f5c'];

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
  { name: 'The Headhunter', rating: 1350, style: 'Aims for your helm every pass. Duck, or keep your shield high.' },
  { name: 'The Turtle', rating: 1100, style: 'Braces and waits. Break the shield before you try to unhorse.' },
  { name: 'The Feinter', rating: 1600, style: 'Hides the lance until the last second. Trust nothing you see early.' },
];

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
  { name: 'Find the visor', goal: 'Land 5 helm strikes at a steady canter', bot: 'The Turtle', best: '3 of 5' },
  { name: 'Hold the saddle', goal: 'Survive 3 full charges without being unhorsed', bot: 'The Headhunter', best: 'Not tried' },
  { name: 'Read the feint', goal: 'Guard correctly against 4 late lances', bot: 'The Feinter', best: '1 of 4' },
  { name: 'On the beat', goal: 'Reach top speed without a single stumble', bot: 'No opponent', best: 'Done' },
];

export const ARMOURY = [
  { name: 'Quartered field', kind: 'Heraldry', note: 'Split your shield in four colours' },
  { name: 'Blackened plate', kind: 'Armour', note: 'Oil-dark steel with a dull edge' },
  { name: 'Thorn crest', kind: 'Helm', note: 'Iron briar across the brow' },
  { name: 'Ash-grey destrier', kind: 'Horse', note: 'Pale coat, dark mane' },
  { name: 'Blood caparison', kind: 'Horse cloth', note: 'Deep red, torn hem' },
  { name: 'Splinter lance', kind: 'Lance', note: 'Striped shaft, breaks loud' },
];

// deterministic rating history for the profile graph
export const history = (end: number) =>
  Array.from({ length: 24 }, (_, i) => Math.round(end - 180 + i * 7.8 + Math.sin(i * 1.7) * 38 + Math.cos(i * 0.6) * 22));

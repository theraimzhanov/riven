// Match state: what carries between passes, the score, and who won.
import { newKnight, resolvePass, type KnightState, type PassInput, type Plan, type Strike } from './resolvePass';
import { T } from './tuning';

export interface MatchState {
  passes: number; // 3 blitz, 5 classic, 7 grand
  played: number;
  score: [number, number];
  knights: [KnightState, KnightState];
  winner: 0 | 1 | null;
  endedBy: 'points' | 'unhorse' | 'fouls' | null;
  history: { plans: [Plan, Plan]; points: [number, number] }[]; // compact summary, not a replay
  last: [Strike, Strike] | null;
}

export const newMatch = (passes: number): MatchState => ({
  passes, played: 0, score: [0, 0], knights: [newKnight(), newKnight()], winner: null, endedBy: null, history: [], last: null,
});

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** One knight's state after a pass: `own` is their strike, `taken` is the strike that hit them. */
function after(s: KnightState, i: PassInput, own: Strike, taken: Strike): KnightState {
  const rested = i.skill === 'secondWind';
  return {
    stamina: clamp(s.stamina + (rested ? T.secondWind.stamina : -T.staminaCost[i.plan]) + T.staminaRegen, 0, 1),
    poise: clamp(s.poise - (taken.zone === 'chest' ? taken.force * T.poise.chestDrain : 0), T.poise.floor, T.poise.base),
    shieldHp: Math.max(0, s.shieldHp - (taken.zone === 'shieldSolid' ? 1 : 0)),
    dazed: taken.zone === 'helm', // lasts exactly one pass
    fouls: s.fouls + (own.zone === 'foul' ? 1 : 0),
    uses: i.skill === 'none' ? s.uses : { ...s.uses, [i.skill]: (s.uses[i.skill] ?? 0) + 1 },
  };
}

export function playPass(m: MatchState, a: PassInput, b: PassInput): MatchState {
  if (m.winner !== null) throw new Error('Match is already over');
  const r = resolvePass(a, m.knights[0], b, m.knights[1]);
  const knights: [KnightState, KnightState] = [after(r.states[0], r.inputs[0], r.a, r.b), after(r.states[1], r.inputs[1], r.b, r.a)];
  const score: [number, number] = [m.score[0] + r.a.points, m.score[1] + r.b.points];
  const played = m.played + 1;

  let winner: 0 | 1 | null = null;
  let endedBy: MatchState['endedBy'] = null;
  const out = [knights[0].fouls >= T.maxFouls, knights[1].fouls >= T.maxFouls];
  if (r.a.unhorsed !== r.b.unhorsed) { winner = r.a.unhorsed ? 0 : 1; endedBy = 'unhorse'; } // both down: decided on points
  else if (out[0] !== out[1]) { winner = out[0] ? 1 : 0; endedBy = 'fouls'; }
  else if (played >= m.passes && score[0] !== score[1]) { winner = score[0] > score[1] ? 0 : 1; endedBy = 'points'; } // tie: sudden death

  return {
    passes: m.passes, played, score, knights, winner, endedBy,
    history: [...m.history, { plans: [r.inputs[0].plan, r.inputs[1].plan], points: [r.a.points, r.b.points] }],
    last: [r.a, r.b],
  };
}

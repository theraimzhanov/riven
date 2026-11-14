// Computer knights. Each returns a full PassInput from what it can know: its own state and the opponent's.
import { skillAllowed, speedCap, type Final, type KnightState, type PassInput, type Plan, type Skill } from './resolvePass';

export type Rng = () => number;
export type Bot = (me: KnightState, foe: KnightState, rng: Rng) => PassInput;

const SWAY: Record<Plan, number> = { charge: 0.2, steady: 0.06, braced: 0.06, feint: 0.12, tempo: 0.15 };
const pick = <V>(rng: Rng, xs: readonly V[]): V => xs[Math.floor(rng() * xs.length)];

function build(me: KnightState, rng: Rng, o: { plan: Plan; skill?: Skill; target: 'helm' | 'chest'; final: Final } & Partial<PassInput>): PassInput {
  const skill = o.skill && skillAllowed(o.skill, me) ? o.skill : 'none';
  const sway = SWAY[o.plan] * (skill === 'couchLate' ? 0.3 : 1);
  const noise = () => (rng() - 0.5) * 2 * sway;
  return {
    shield: 'mid', lean: 'none', rein: 'mid', visorDown: true,
    ...o,
    skill,
    speed: speedCap({ plan: o.plan, skill }, me) * (0.85 + 0.15 * rng()),
    aim: { x: noise(), y: (o.target === 'helm' ? 0.8 : 0.4) + noise() },
    timing: 0.45 + 0.55 * rng(), // sometimes mistimes, like a person
  };
}

/** Aims for the helm every pass and rides hard while the horse lasts. */
export const headhunter: Bot = (me, _foe, rng) =>
  build(me, rng, {
    plan: me.stamina > 0.5 ? 'charge' : 'steady',
    skill: me.stamina <= 0.5 ? 'spurBurst' : 'none',
    target: 'helm', final: 'drive', lean: 'in', shield: 'mid',
  });

/** Braces, waits, wears the shield down. */
export const turtle: Bot = (me, foe, rng) =>
  build(me, rng, {
    plan: 'braced',
    skill: me.stamina < 0.4 ? 'secondWind' : rng() < 0.3 ? 'slantGuard' : 'none',
    target: foe.shieldHp === 0 ? 'chest' : pick(rng, ['chest', 'chest', 'helm'] as const),
    final: 'lock', shield: pick(rng, ['high', 'mid'] as const), rein: 'wide',
  });

/** Hides the lance and changes pace; you cannot read it early. */
export const feinter: Bot = (me, _foe, rng) =>
  build(me, rng, {
    plan: me.stamina > 0.4 ? pick(rng, ['feint', 'tempo'] as const) : 'steady',
    skill: rng() < 0.35 ? 'couchLate' : 'none',
    target: pick(rng, ['helm', 'chest'] as const),
    final: pick(rng, ['duck', 'swivel', 'drive'] as const),
    shield: pick(rng, ['high', 'mid'] as const), lean: pick(rng, ['none', 'away'] as const),
  });

export const BOTS = { headhunter, turtle, feinter };

/** Small seeded generator so bot matches can be repeated exactly in tests. */
export function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

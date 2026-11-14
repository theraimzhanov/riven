// The one formula. Pure and deterministic: no 3D, no network, no randomness.
// Shared by the browser (bots, practice) and the server (ranked results).
import { T } from './tuning';

export type Plan = 'charge' | 'steady' | 'braced' | 'feint' | 'tempo';
export type Skill = 'none' | 'couchLate' | 'slantGuard' | 'spurBurst' | 'visorLate' | 'secondWind';
export type Final = 'none' | 'drive' | 'lock' | 'duck' | 'swivel' | 'release';
export type Zone = 'miss' | 'shieldGlance' | 'shieldSolid' | 'chest' | 'helm' | 'foul';

export const PLANS: Plan[] = ['charge', 'steady', 'braced', 'feint', 'tempo'];
export const SKILLS: Skill[] = ['none', 'couchLate', 'slantGuard', 'spurBurst', 'visorLate', 'secondWind'];
export const FINALS: Final[] = ['none', 'drive', 'lock', 'duck', 'swivel', 'release'];

/** What one knight did in one pass. Comes from a client: never trusted. */
export interface PassInput {
  plan: Plan;
  skill: Skill;
  speed: number; // 0..1 at impact
  aim: { x: number; y: number }; // lance tip on the opponent; x < 0 is the barrier side
  shield: 'high' | 'mid'; // high covers helm, mid covers chest
  lean: 'in' | 'none' | 'away';
  rein: 'tight' | 'mid' | 'wide';
  final: Final;
  timing: number; // 0..1, how well the final move was timed
  visorDown: boolean; // only matters with the visorLate skill
}

/** What carries between passes. Owned by the server. */
export interface KnightState {
  stamina: number; // 0..1
  poise: number; // floor..100
  shieldHp: number; // solid hits left before the straps snap
  dazed: boolean; // took a helm hit last pass
  fouls: number;
  uses: Partial<Record<Skill, number>>;
}

export interface Strike {
  zone: Zone;
  points: number;
  force: number;
  unhorsed: boolean; // attacker unhorsed the defender
  lanceBroken: boolean;
}

export const newKnight = (): KnightState => ({ stamina: 1, poise: T.poise.base, shieldHp: T.shieldHp, dazed: false, fouls: 0, uses: {} });

const clamp01 = (n: number) => (n > 0 ? (n < 1 ? n : 1) : 0); // NaN -> 0
const oneOf = <V extends string>(v: unknown, list: readonly V[], fallback: V): V => (list.includes(v as V) ? (v as V) : fallback);

export const skillAllowed = (skill: Skill, s: KnightState) => (s.uses[skill] ?? 0) < T.skillUses[skill];

/** Top speed this knight can really reach this pass: plan, skill and a tired horse all limit it. */
export function speedCap(i: Pick<PassInput, 'plan' | 'skill'>, s: KnightState) {
  const cap = i.skill === 'secondWind' ? T.secondWind.speedCap : i.skill === 'spurBurst' ? 1 : T.speedCap[i.plan];
  return cap * (0.5 + 0.5 * s.stamina);
}

/** Force every field into its legal range. An illegal or used-up skill becomes "none". */
export function clean(i: PassInput, s: KnightState): PassInput {
  const plan = oneOf(i?.plan, PLANS, 'steady');
  let skill = oneOf(i?.skill, SKILLS, 'none');
  if (!skillAllowed(skill, s)) skill = 'none';
  const num = (n: unknown) => (Number.isFinite(n) ? (n as number) : 99); // garbage aim -> a miss
  return {
    plan,
    skill,
    speed: Math.min(clamp01(i?.speed), speedCap({ plan, skill }, s)),
    aim: { x: num(i?.aim?.x), y: num(i?.aim?.y) },
    shield: oneOf(i?.shield, ['high', 'mid'] as const, 'mid'),
    lean: oneOf(i?.lean, ['in', 'none', 'away'] as const, 'none'),
    rein: oneOf(i?.rein, ['tight', 'mid', 'wide'] as const, 'mid'),
    final: oneOf(i?.final, FINALS, 'none'),
    timing: clamp01(i?.timing),
    visorDown: i?.visorDown !== false,
  };
}

/** Zone under the lance tip and how centred the hit is (1 at the centre, 0.5 at the edge). */
export function zoneAt({ x, y }: { x: number; y: number }, defenderWide = false): ['helm' | 'chest' | 'foul' | 'miss', number] {
  const dHelm = Math.hypot(x, y - T.helm.y) / T.helm.r;
  if (dHelm <= 1) return ['helm', 1 - 0.5 * dHelm];
  const halfW = defenderWide ? T.chest.wideHalfW : T.chest.halfW;
  const { y0, y1 } = T.chest;
  if (Math.abs(x) <= halfW && y >= y0 && y <= y1) {
    return ['chest', 1 - 0.5 * Math.max(Math.abs(x) / halfW, Math.abs(y - (y0 + y1) / 2) / ((y1 - y0) / 2))];
  }
  if (Math.abs(x) <= 0.4 && y < 0 && y >= -0.6) return ['foul', 0]; // the horse
  return ['miss', 0];
}

/** Poise the defender actually has this pass. */
export function seat(def: PassInput, ds: KnightState) {
  let p = ds.poise * (0.7 + 0.3 * ds.stamina);
  if (def.plan === 'braced') p *= T.poise.braced;
  if (def.final === 'lock' && def.timing >= T.moveTiming) p *= T.poise.lock;
  if (def.lean === 'in') p *= T.poise.leanIn;
  if (ds.dazed) p *= T.poise.dazed;
  return p;
}

function strike(att: PassInput, as: KnightState, def: PassInput, ds: KnightState): Strike {
  const timed = (i: PassInput, f: Final) => i.final === f && i.timing >= T.moveTiming;
  let [zone, centred]: [Zone, number] = zoneAt(att.aim, def.rein === 'wide');
  if (att.rein === 'tight' && att.aim.y < T.barrier.y && att.aim.x < 0) zone = 'foul';
  if (att.skill === 'couchLate' || (att.skill === 'visorLate' && !att.visorDown)) centred = Math.min(1, centred + T.aimBonus);

  // moves that give up the attacker's own strike
  const noOffence = att.final === 'swivel' || att.final === 'release' || (att.final === 'drive' && att.timing < T.driveTiming);
  if (noOffence && zone !== 'foul') zone = 'miss';

  const ducked = timed(def, 'duck');
  if (zone === 'helm' && ducked) zone = 'miss';

  let force = 0;
  if (zone === 'chest' || zone === 'helm') {
    force = ((att.speed + def.speed) / 2) * centred * 100;
    if (att.lean === 'in') force *= T.force.leanIn;
    if (att.lean === 'away') force *= T.force.leanAway;
    if (att.final === 'drive') force *= T.force.drive;
    if (att.rein === 'tight' && zone === 'chest') force *= T.force.tight;
    if (att.rein === 'wide') force *= T.force.wide;
    if (as.dazed) force *= T.force.dazed;
    if (def.lean === 'away') force *= T.force.defAway;
    if (def.final === 'release') force *= T.force.release;
  }

  const hasShield = ds.shieldHp > 0;
  if (hasShield && def.skill === 'slantGuard') {
    if (zone === 'chest' && centred < T.slantPerfect) { zone = 'miss'; force = 0; } // glances off; helm is left open
  } else if (hasShield && ((zone === 'helm' && def.shield === 'high') || (zone === 'chest' && def.shield === 'mid'))) {
    zone = force >= T.solidHit ? 'shieldSolid' : 'shieldGlance';
  }
  if (hasShield && timed(def, 'swivel') && (zone === 'chest' || zone === 'shieldSolid')) { zone = 'shieldGlance'; force = 0; }

  if (zone === 'chest' && ducked) { zone = 'helm'; force *= T.force.duckInto; } // ducked into a body strike

  const body = zone === 'chest' || zone === 'helm';
  const openVisor = zone === 'helm' && def.skill === 'visorLate' && !def.visorDown;
  const lanceBroken = zone !== 'miss' && zone !== 'foul' && force >= (att.final === 'drive' ? T.lanceBreakDrive : T.lanceBreak);

  return {
    zone,
    points: T.points[zone] + (lanceBroken ? T.lanceBonus : 0),
    force,
    unhorsed: body && (openVisor || force > seat(def, ds)),
    lanceBroken,
  };
}

/** Resolve one pass. Inputs are cleaned first, so any garbage from a client is harmless. */
export function resolvePass(a: PassInput, sa: KnightState, b: PassInput, sb: KnightState) {
  // Second Wind resets poise before the lances meet
  const pa = a?.skill === 'secondWind' && skillAllowed('secondWind', sa) ? { ...sa, poise: T.poise.base } : sa;
  const pb = b?.skill === 'secondWind' && skillAllowed('secondWind', sb) ? { ...sb, poise: T.poise.base } : sb;
  const ca = clean(a, pa), cb = clean(b, pb);
  return { inputs: [ca, cb] as const, states: [pa, pb] as const, a: strike(ca, pa, cb, pb), b: strike(cb, pb, ca, pa) };
}

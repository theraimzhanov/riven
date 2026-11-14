// Server-side check of what a client sent. resolvePass already clamps everything, so a cheat cannot
// gain from bad values; this tells the server *that* a client sent something a real game never would.
import { FINALS, PLANS, SKILLS, skillAllowed, speedCap, type KnightState, type PassInput } from './resolvePass';

export function validateInputs(i: PassInput, s: KnightState): string[] {
  const bad: string[] = [];
  if (!i || typeof i !== 'object') return ['input is not an object'];
  if (!PLANS.includes(i.plan)) bad.push('unknown plan');
  if (!SKILLS.includes(i.skill)) bad.push('unknown skill');
  else if (!skillAllowed(i.skill, s)) bad.push(`skill ${i.skill} has no uses left`);
  if (!FINALS.includes(i.final)) bad.push('unknown final move');
  if (!['high', 'mid'].includes(i.shield)) bad.push('unknown shield position');
  if (!['in', 'none', 'away'].includes(i.lean)) bad.push('unknown lean');
  if (!['tight', 'mid', 'wide'].includes(i.rein)) bad.push('unknown rein line');
  if (!Number.isFinite(i.aim?.x) || !Number.isFinite(i.aim?.y)) bad.push('aim is not a number');
  if (!(i.timing >= 0 && i.timing <= 1)) bad.push('timing outside 0..1');
  if (!(i.speed >= 0 && i.speed <= 1)) bad.push('speed outside 0..1');
  else if (PLANS.includes(i.plan) && SKILLS.includes(i.skill) && i.speed > speedCap(i, s) + 0.01) bad.push('speed above what the horse could reach');
  return bad;
}

/**
 * Crude bot check on final-move timing across a match: humans vary, scripts do not.
 * shortcut: catches only naive bots; one that fakes jitter passes. Upgrade when ranked play has real stakes.
 */
export function suspiciousTiming(timings: number[]): boolean {
  if (timings.length < 5) return false;
  const mean = timings.reduce((a, b) => a + b, 0) / timings.length;
  const sd = Math.sqrt(timings.reduce((a, t) => a + (t - mean) ** 2, 0) / timings.length);
  return sd < 0.01;
}

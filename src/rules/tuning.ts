// Every balance number in one place. Tuning never touches the formula.
// Force and poise share one scale: a clean hit between two steady riders is about 60, base poise is 100.

export const T = {
  speedCap: { charge: 1, steady: 0.75, braced: 0.5, feint: 0.8, tempo: 0.9 },
  staminaCost: { charge: 0.35, steady: 0.15, braced: 0.1, feint: 0.15, tempo: 0.3 },
  staminaRegen: 0.1, // per pass, so a spent horse is slow but never stuck
  skillUses: { none: Infinity, couchLate: 1, slantGuard: 2, spurBurst: 1, visorLate: Infinity, secondWind: 1 },
  secondWind: { speedCap: 0.3, stamina: 0.25 },
  aimBonus: 0.1, // couchLate / visor up: steadier lance

  points: { miss: 0, shieldGlance: 1, shieldSolid: 1, chest: 2, helm: 3, foul: -2 },
  lanceBonus: 1,

  // target, in metres from the opponent's saddle centre
  helm: { y: 0.8, r: 0.15 },
  chest: { halfW: 0.25, wideHalfW: 0.18, y0: 0.2, y1: 0.6 },
  barrier: { y: 0.15 }, // riding tight, a tip this low on the inner side (x < 0) clips the tilt

  force: { leanIn: 1.2, leanAway: 0.8, drive: 1.25, tight: 1.15, wide: 0.85, defAway: 0.7, duckInto: 1.25, release: 0.65, dazed: 0.85 },
  poise: { base: 100, floor: 30, braced: 1.5, lock: 1.4, leanIn: 0.8, dazed: 0.9, chestDrain: 0.25 },

  solidHit: 45, // force at which a shield hit cracks the shield
  lanceBreak: 70,
  lanceBreakDrive: 55,
  shieldHp: 2,
  slantPerfect: 0.9, // centring needed to beat a slanted shield
  driveTiming: 0.6,
  moveTiming: 0.5,
  maxFouls: 2,
} as const;

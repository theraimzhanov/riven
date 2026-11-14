import { describe, expect, it } from 'vitest';
import { BOTS, seeded, type Bot } from './bots';
import { newMatch, playPass, type MatchState } from './match';
import { FINALS, PLANS, SKILLS, newKnight, resolvePass, type KnightState, type PassInput } from './resolvePass';
import { suspiciousTiming, validateInputs } from './validateInputs';

const CHEST = { x: 0, y: 0.4 }, CHEST_EDGE = { x: 0.15, y: 0.4 }, HELM = { x: 0, y: 0.8 }, HORSE = { x: 0, y: -0.3 }, AIR = { x: 2, y: 2 };
const k = (o: Partial<PassInput> = {}): PassInput => ({
  plan: 'steady', skill: 'none', speed: 0.6, aim: AIR, shield: 'mid', lean: 'none', rein: 'mid', final: 'none', timing: 1, visorDown: true, ...o,
});
const st = (o: Partial<KnightState> = {}): KnightState => ({ ...newKnight(), ...o });
const hit = (a: Partial<PassInput>, b: Partial<PassInput> = {}, sa = st(), sb = st()) => resolvePass(k(a), sa, k(b), sb).a;
const LANCER = { plan: 'charge', speed: 1, aim: CHEST, lean: 'in', final: 'drive' } as const;

describe('scoring table', () => {
  it('miss 0, chest 2, helm 3', () => {
    expect(hit({}).points).toBe(0);
    expect(hit({ aim: CHEST }, { shield: 'high' })).toMatchObject({ zone: 'chest', points: 2, force: 60 });
    expect(hit({ aim: HELM })).toMatchObject({ zone: 'helm', points: 3 });
  });
  it('shield turns a hit into 1 point: glancing when soft, solid when hard', () => {
    expect(hit({ aim: CHEST, speed: 0.3 }, { speed: 0.3 })).toMatchObject({ zone: 'shieldGlance', points: 1 });
    expect(hit({ aim: CHEST })).toMatchObject({ zone: 'shieldSolid', points: 1, unhorsed: false });
    expect(hit({ aim: HELM }, { shield: 'high' }).zone).toBe('shieldSolid');
  });
  it('a clean hard hit breaks the lance for +1', () => {
    expect(hit({ plan: 'charge', speed: 1, aim: CHEST }, { shield: 'high' })).toMatchObject({ lanceBroken: true, points: 3, unhorsed: false });
  });
  it('hitting the horse or clipping the barrier is a foul', () => {
    expect(hit({ aim: HORSE })).toMatchObject({ zone: 'foul', points: -2 });
    expect(hit({ rein: 'tight', aim: { x: -0.1, y: 0.1 } }).zone).toBe('foul');
    expect(hit({ rein: 'mid', aim: { x: -0.1, y: 0.1 } }).zone).toBe('miss');
  });
  it('both knights can score in one pass', () => {
    const r = resolvePass(k({ aim: CHEST, shield: 'high' }), st(), k({ aim: HELM, shield: 'high' }), st());
    expect([r.a.zone, r.b.zone]).toEqual(['chest', 'shieldSolid']);
  });
});

describe('impact moves', () => {
  it('drive adds force; mistimed it slips off', () => {
    expect(hit({ aim: CHEST, final: 'drive' }, { shield: 'high' }).force).toBe(75);
    expect(hit({ aim: CHEST, final: 'drive', timing: 0.3 }, { shield: 'high' }).zone).toBe('miss');
  });
  it('lock stirrups keeps a braced rider in the saddle', () => {
    expect(hit(LANCER, { shield: 'high', speed: 0.75 }).unhorsed).toBe(true);
    expect(hit(LANCER, { plan: 'braced', speed: 0.5, shield: 'high', final: 'lock' }).unhorsed).toBe(false);
  });
  it('duck dodges the helm but turns a chest strike into a harder helm hit', () => {
    expect(hit({ aim: HELM }, { final: 'duck' }).zone).toBe('miss');
    expect(hit({ aim: CHEST }, { final: 'duck', shield: 'high' })).toMatchObject({ zone: 'helm', force: 75 });
    expect(hit({ aim: HELM }, { final: 'duck', timing: 0.2 }).zone).toBe('helm');
  });
  it('swivel deflects a body hit for no force and gives up your own strike', () => {
    const r = resolvePass(k({ aim: CHEST }), st(), k({ aim: CHEST, shield: 'high', final: 'swivel' }), st());
    expect(r.a).toMatchObject({ zone: 'shieldGlance', force: 0 });
    expect(r.b.zone).toBe('miss');
    expect(hit({ aim: HELM }, { final: 'swivel' }).zone).toBe('helm'); // the head is not covered
  });
  it('release takes less force and scores nothing', () => {
    const r = resolvePass(k({ aim: CHEST }), st(), k({ aim: CHEST, shield: 'high', final: 'release' }), st());
    expect(r.a.force).toBeCloseTo(39);
    expect(r.b.points).toBe(0);
  });
});

describe('tactical skills', () => {
  it('slant guard glances off anything but a perfect chest strike and leaves the helm open', () => {
    expect(hit({ aim: CHEST_EDGE }, { skill: 'slantGuard' })).toMatchObject({ zone: 'miss', force: 0 });
    expect(hit({ aim: CHEST }, { skill: 'slantGuard' }).zone).toBe('chest');
    expect(hit({ aim: HELM }, { skill: 'slantGuard', shield: 'high' }).zone).toBe('helm');
  });
  it('visor left up: any helm hit unhorses', () => {
    expect(hit({ aim: HELM, speed: 0.2 }, { skill: 'visorLate', visorDown: false, speed: 0.2 }).unhorsed).toBe(true);
    expect(hit({ aim: HELM, speed: 0.2 }, { skill: 'visorLate', visorDown: true, speed: 0.2 }).unhorsed).toBe(false);
  });
  it('spur burst reaches top speed on a slow plan', () => {
    expect(hit({ plan: 'braced', speed: 1, skill: 'spurBurst', aim: CHEST }, { shield: 'high' }).force).toBe(80);
    expect(hit({ plan: 'braced', speed: 1, aim: CHEST }, { shield: 'high' }).force).toBeCloseTo(55);
  });
  it('second wind restores stamina and poise, once', () => {
    let m: MatchState = { ...newMatch(7), knights: [st({ stamina: 0.4, poise: 50 }), st()] };
    m = playPass(m, k({ skill: 'secondWind' }), k());
    expect(m.knights[0].stamina).toBeCloseTo(0.75);
    expect(m.knights[0].poise).toBe(100);
    m = playPass(m, k({ skill: 'secondWind' }), k()); // used up: counts as an ordinary pass
    expect(m.knights[0].uses.secondWind).toBe(1);
    expect(m.knights[0].stamina).toBeCloseTo(0.7);
  });
});

describe('wear carries between passes', () => {
  it('two solid hits break the shield, then the chest is open', () => {
    let m = newMatch(7);
    m = playPass(m, k({ aim: CHEST }), k());
    expect(m.knights[1].shieldHp).toBe(1);
    m = playPass(m, k({ aim: CHEST }), k());
    expect(m.knights[1].shieldHp).toBe(0);
    m = playPass(m, k({ aim: CHEST }), k());
    expect(m.last![0].zone).toBe('chest');
  });
  it('a full charge drains the horse, and a tired horse is slower', () => {
    let m = newMatch(7);
    m = playPass(m, k({ plan: 'charge', speed: 1 }), k());
    expect(m.knights[0].stamina).toBeCloseTo(0.75);
    const fresh = hit({ plan: 'charge', speed: 1, aim: CHEST }, { shield: 'high' }).force;
    const tired = hit({ plan: 'charge', speed: 1, aim: CHEST }, { shield: 'high' }, st({ stamina: 0.2 })).force;
    expect(tired).toBeLessThan(fresh);
  });
  it('chest hits drain poise; a helm hit dazes for exactly one pass', () => {
    let m = newMatch(7);
    m = playPass(m, k({ aim: CHEST }), k({ shield: 'high' }));
    expect(m.knights[1].poise).toBe(85);
    m = playPass(m, k({ aim: HELM }), k());
    expect(m.knights[1].dazed).toBe(true);
    m = playPass(m, k(), k());
    expect(m.knights[1].dazed).toBe(false);
  });
});

describe('match', () => {
  it('most points after the last pass wins', () => {
    let m = newMatch(3);
    m = playPass(m, k({ aim: CHEST }), k({ shield: 'high' }));
    m = playPass(m, k(), k());
    expect(m.winner).toBe(null);
    m = playPass(m, k(), k());
    expect(m).toMatchObject({ winner: 0, endedBy: 'points', score: [2, 0] });
    expect(() => playPass(m, k(), k())).toThrow();
  });
  it('a tie goes to sudden death', () => {
    let m = newMatch(3);
    for (let i = 0; i < 3; i++) m = playPass(m, k(), k());
    expect(m.winner).toBe(null);
    m = playPass(m, k(), k({ aim: HELM }));
    expect(m.winner).toBe(1);
  });
  it('unhorse wins at once', () => {
    expect(playPass(newMatch(5), k(LANCER), k({ shield: 'high', speed: 0.75 }))).toMatchObject({ winner: 0, endedBy: 'unhorse' });
  });
  it('a second foul forfeits', () => {
    let m = playPass(newMatch(5), k({ aim: HORSE }), k());
    expect(m.winner).toBe(null);
    m = playPass(m, k({ aim: HORSE }), k());
    expect(m).toMatchObject({ winner: 1, endedBy: 'fouls' });
  });
  it('keeps a compact summary, one small entry per pass', () => {
    const m = playPass(newMatch(3), k({ plan: 'charge', aim: CHEST }), k({ shield: 'high' }));
    expect(m.history).toEqual([{ plans: ['charge', 'steady'], points: [2, 0] }]);
  });
});

describe('untrusted input', () => {
  it('clamps speed and survives garbage', () => {
    expect(hit({ plan: 'braced', speed: 99, aim: CHEST }, { shield: 'high' }).force).toBeCloseTo(55);
    const junk = { plan: 'fly', skill: 'nuke', speed: NaN, aim: null, timing: 'x' } as unknown as PassInput;
    const r = resolvePass(junk, st(), k({ aim: CHEST }), st());
    expect(r.a).toMatchObject({ zone: 'miss', points: 0 });
    expect(Number.isFinite(r.b.force)).toBe(true);
  });
  it('every plan, skill and final move gives a sane result', () => {
    for (const plan of PLANS) for (const skill of SKILLS) for (const final of FINALS) for (const aim of [CHEST, HELM, HORSE, AIR]) {
      const m = playPass(newMatch(5), k({ plan, skill, final, aim, speed: 1 }), k({ plan, skill, final, aim: CHEST }));
      for (const s of m.last!) {
        expect(Number.isFinite(s.force) && s.force >= 0).toBe(true);
        expect(s.points).toBeGreaterThanOrEqual(-2);
        expect(s.points).toBeLessThanOrEqual(4);
      }
      for (const kn of m.knights) {
        expect(kn.stamina).toBeGreaterThanOrEqual(0);
        expect(kn.stamina).toBeLessThanOrEqual(1);
        expect(kn.poise).toBeGreaterThanOrEqual(30);
      }
    }
  });
  it('validateInputs names what a real game would never send', () => {
    expect(validateInputs(k(), st())).toEqual([]);
    expect(validateInputs(k({ plan: 'braced', speed: 1 }), st())).toContain('speed above what the horse could reach');
    expect(validateInputs(k({ skill: 'couchLate' }), st({ uses: { couchLate: 1 } }))).toContain('skill couchLate has no uses left');
    expect(validateInputs(k({ timing: 1.5 }), st())).toContain('timing outside 0..1');
    expect(validateInputs(k({ aim: { x: NaN, y: 0 } }), st())).toContain('aim is not a number');
  });
  it('flags machine-perfect timing', () => {
    expect(suspiciousTiming([1, 1, 1, 1, 1])).toBe(true);
    expect(suspiciousTiming([0.9, 0.7, 1, 0.8, 0.95])).toBe(false);
    expect(suspiciousTiming([1, 1])).toBe(false);
  });
});

describe('bot matches', () => {
  function series(a: Bot, b: Bot, games: number) {
    const rng = seeded(7);
    let winsA = 0, passes = 0, unhorse = 0;
    for (let g = 0; g < games; g++) {
      let m = newMatch(5);
      while (m.winner === null) {
        m = playPass(m, a(m.knights[0], m.knights[1], rng), b(m.knights[1], m.knights[0], rng));
        if (m.played > 60) throw new Error('match did not end');
      }
      winsA += m.winner === 0 ? 1 : 0;
      passes += m.played;
      unhorse += m.endedBy === 'unhorse' ? 1 : 0;
    }
    return { winRate: winsA / games, avgPasses: passes / games, unhorseRate: unhorse / games };
  }
  const names = Object.keys(BOTS) as (keyof typeof BOTS)[];
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    it(`${names[i]} v ${names[j]}: every match ends and neither style dominates`, () => {
      const r = series(BOTS[names[i]], BOTS[names[j]], 400);
      console.log(`${names[i]} v ${names[j]}: ${names[i]} wins ${(r.winRate * 100).toFixed(0)}%, ${r.avgPasses.toFixed(1)} passes, unhorse ends ${(r.unhorseRate * 100).toFixed(0)}%`);
      expect(r.winRate).toBeGreaterThan(0.15);
      expect(r.winRate).toBeLessThan(0.85);
    });
  }
});

import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BOTS as BOT_INFO, FORMATS, PLANS, leagueOf } from '../data/mock';
import { Charge } from '../game/Charge';
import { asKnight, ratingOf, saveMatch } from '../lib/api';
import { useAuth } from '../lib/auth';
import { BOTS } from '../rules/bots';
import { newMatch, playPass, type MatchState } from '../rules/match';
import type { KnightState, PassInput, Plan, Strike, Zone } from '../rules/resolvePass';
import { T } from '../rules/tuning';
import { KnightCell, Shield } from '../ui';

const PLAN_SECONDS = 10;
const ZONE_NAMES: Record<Zone, string> = {
  miss: 'Miss', shieldGlance: 'Shield, glancing', shieldSolid: 'Shield, solid', chest: 'Chest', helm: 'Helm', foul: 'Foul',
};
const KEYS: [string, string][] = [
  ['Mouse', 'Aim the lance tip at the helm or chest'],
  ['Space', 'Spur. Tap steadily; mashing makes the horse stumble'],
  ['W / S', 'Shield high (helm) or mid (chest)'],
  ['A / D', 'Lean in for force, or away to be harder to hit'],
  ['Q / E', 'Ride tight to the barrier, or wide'],
  ['1 2 3 4', 'Skill: couch late, slant guard, spur burst, second wind'],
  ['V', 'Raise the visor for a steadier aim. Press again to drop it before impact'],
  ['J K L U I', 'At impact: drive, lock stirrups, duck, swivel, release'],
];

const Wear = ({ s }: { s: KnightState }) => (
  <span className="wear">
    <span>Stamina <b>{Math.round(s.stamina * 100)}%</b></span>
    <span>Poise <b>{Math.round(s.poise)}</b></span>
    <span>Shield <b>{s.shieldHp ? `${s.shieldHp}/${T.shieldHp}` : 'broken'}</b></span>
    {s.dazed && <b className="down">Dazed</b>}
  </span>
);

export default function Match() {
  const [q] = useSearchParams();
  const { user, profile } = useAuth();
  const format = FORMATS.find((f) => f.id === q.get('format')) ?? FORMATS[1];
  const bot = BOT_INFO.find((b) => b.id === q.get('vs')) ?? BOT_INFO[0];
  const foe = { name: bot.name, colors: bot.colors };
  const you = profile ? asKnight(profile) : { name: 'Guest', colors: ['#b3121b', '#1b1b1f'] as [string, string] };
  const [saved, setSaved] = useState('');

  const [match, setMatch] = useState<MatchState>(() => newMatch(format.passes));
  const [strikes, setStrikes] = useState<[Strike, Strike][]>([]);
  const [phase, setPhase] = useState<'plan' | 'charge' | 'hit' | 'over'>('plan');
  const [pass, setPass] = useState<{ plan: Plan; foe: PassInput } | null>(null);
  const [left, setLeft] = useState(PLAN_SECONDS);
  const [yielded, setYielded] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  const [me, them] = match.knights;
  const won = !yielded && match.winner === 0;

  function start(plan: Plan) { // both plans are locked in before the horses move
    setPass({ plan, foe: BOTS[bot.id](them, me, Math.random) });
    setPhase('charge');
  }

  /** Keep the finished match in the knight's history. Guests have none. */
  async function keep(m: MatchState, gaveUp: boolean) {
    if (!user) return setSaved('Log in to keep your matches.');
    const { error } = await saveMatch({
      opponent: bot.name, format: format.id, won: !gaveUp && m.winner === 0,
      score_for: m.score[0], score_against: m.score[1], ended_by: gaveUp ? 'yield' : m.endedBy ?? 'points',
    });
    setSaved(error ? 'This match could not be saved to your history.' : 'Saved to your history.');
  }

  function impact(mine: PassInput) {
    const next = playPass(match, mine, pass!.foe);
    setMatch(next);
    setStrikes((s) => [...s, next.last!]);
    setPhase('hit');
    if (next.winner !== null) keep(next, false);
    setTimeout(() => { setLeft(PLAN_SECONDS); setPhase(next.winner === null ? 'plan' : 'over'); }, 2200);
  }

  useEffect(() => { // out of time: a steady canter
    if (phase !== 'plan') return;
    if (left === 0) return start('steady');
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, left]);

  useEffect(() => { if (phase === 'over') dialog.current?.showModal(); }, [phase]);

  function reset() {
    dialog.current?.close();
    setMatch(newMatch(format.passes)); setStrikes([]); setYielded(false); setSaved(''); setLeft(PLAN_SECONDS); setPhase('plan');
  }

  const describe = (s: Strike) => `${ZONE_NAMES[s.zone]}${s.points ? ` ${s.points > 0 ? '+' : '−'}${Math.abs(s.points)}` : ''}${s.lanceBroken ? ', lance broken' : ''}${s.unhorsed ? ', unhorse' : ''}`;
  const lastPass = strikes.at(-1);
  const outcome = yielded ? 'You yielded.'
    : match.endedBy === 'unhorse' ? (won ? `You unhorsed ${foe.name}.` : `${foe.name} unhorsed you.`)
    : match.endedBy === 'fouls' ? (won ? `${foe.name} fouled twice.` : 'You fouled twice.')
    : `${match.score[0]} to ${match.score[1]} on points.`;

  return (
    <div className="grid2">
      <div className="stack">
        <div className="bar">
          <span className="stack" style={{ gap: 4 }}><KnightCell k={foe} sub={`Bot, ${bot.rating}`} link={false} /><Wear s={them} /></span>
          <span className="score num">{match.score[1]}</span>
        </div>

        {phase === 'charge' && pass ? (
          <Charge key={match.played} plan={pass.plan} me={me} foe={pass.foe} foeState={them} foeColors={foe.colors} onDone={impact} />
        ) : (
          <div className={`arena ${phase === 'hit' ? 'charging hit' : ''}`}>
            <span className="rider you"><Shield colors={you.colors} /></span>
            <span className="rider foe"><Shield colors={foe.colors} /></span>
            <span className="flash" />
            <p className="caption" role="status">
              {phase === 'hit' && lastPass ? `You: ${describe(lastPass[0])}. ${foe.name}: ${describe(lastPass[1])}.`
                : 'Choose a riding plan. The charge starts at once and lasts six seconds.'}
            </p>
          </div>
        )}

        <div className="bar">
          <span className="stack" style={{ gap: 4 }}><KnightCell k={you} sub={profile ? `${leagueOf(ratingOf(profile, format.id))} ${ratingOf(profile, format.id)}` : 'Not logged in'} link={false} /><Wear s={me} /></span>
          <span className="row">
            {phase === 'plan' && <span className={left <= 3 ? 'timer low' : 'timer'} aria-label={`${left} seconds to choose`}>0:{String(left).padStart(2, '0')}</span>}
            <span className="score num">{match.score[0]}</span>
          </span>
        </div>
      </div>

      <div className="stack">
        <div className="shield-panel"><div>
          <h2>{phase === 'plan' ? `Pass ${match.played + 1}: choose your plan` : phase === 'over' ? 'Match over' : phase === 'charge' ? 'Ride!' : 'Impact'}</h2>
          <div className="stack">
            {PLANS.map((p) => (
              <button key={p.id} className="pick" disabled={phase !== 'plan'} onClick={() => start(p.id as Plan)}>
                <b>{p.name}</b><span>{p.note}</span>
              </button>
            ))}
          </div>
        </div></div>

        <div className="panel">
          <h2>Controls during the charge</h2>
          <dl className="keys">
            {KEYS.map(([k, what]) => <div key={k} style={{ display: 'contents' }}><dt><kbd>{k}</kbd></dt><dd>{what}</dd></div>)}
          </dl>
          <p className="muted" style={{ margin: '12px 0 0' }}>One skill and one impact move per pass. Keyboard and mouse only for now.</p>
        </div>

        <div className="panel">
          <h2>{format.name}, practice</h2>
          {strikes.length === 0 ? <p className="muted">No passes yet. Each pass appears here with where both lances landed.</p> : (
            <ol className="passes">
              {strikes.map((pair, i) => (
                <li key={i}>
                  <span className="num">{i + 1}</span>
                  {pair.map((s, j) => (
                    <span key={j}>{describe(s)}<br /><small className="muted">{PLANS.find((p) => p.id === match.history[i].plans[j])!.name}</small></span>
                  ))}
                </li>
              ))}
            </ol>
          )}
          <button className="link" disabled={phase !== 'plan'} onClick={() => { setYielded(true); setPhase('over'); keep(match, true); }}>Yield the match</button>
        </div>
      </div>

      <dialog className="result" ref={dialog} onClose={() => phase === 'over' && dialog.current?.showModal()}>
        <div className="shield-panel"><div>
          <h2>{won ? 'Victory' : 'Defeat'}</h2>
          <p className="muted" style={{ textAlign: 'center', margin: '0 auto 8px' }}>{outcome}</p>
          <p className="delta muted">Practice match, rating unchanged</p>
          <p className="muted" role="status" style={{ textAlign: 'center', margin: '0 auto 16px' }}>{saved}</p>
          <div className="stack">
            <button className="btn" onClick={reset}>Rematch</button>
            <Link className="ghost" to="/play">New match</Link>
          </div>
        </div></div>
      </dialog>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FORMATS, PLANS, findKnight, guest } from '../data/mock';
import { useAuth } from '../lib/auth';
import { KnightCell, Shield } from '../ui';

interface Pass { plan: string; you: string; foe: string; youPts: number; foePts: number; unhorse: 0 | 1 | 2 }

// Demo only: random outcomes until the rules engine and arena exist.
const ZONES: [string, number][] = [['Miss', 0], ['Shield', 1], ['Shield', 1], ['Chest', 2], ['Chest', 2], ['Helm', 3]];
const roll = () => ZONES[Math.floor(Math.random() * ZONES.length)];
const PLAN_SECONDS = 10;

export default function Match() {
  const [q] = useSearchParams();
  const { username } = useAuth();
  const format = FORMATS.find((f) => f.id === q.get('format')) ?? FORMATS[1];
  const rated = q.get('rated') === '1';
  const foe = findKnight(q.get('vs') ?? 'Mordane');
  const you = guest(username ?? 'Guest');

  const [passes, setPasses] = useState<Pass[]>([]);
  const [phase, setPhase] = useState<'plan' | 'charge' | 'hit' | 'over'>('plan');
  const [left, setLeft] = useState(PLAN_SECONDS);
  const [yielded, setYielded] = useState(false);
  const [delta] = useState(() => 8 + Math.floor(Math.random() * 7));
  const dialog = useRef<HTMLDialogElement>(null);

  const score = passes.reduce((s, p) => [s[0] + p.youPts, s[1] + p.foePts], [0, 0]);
  const unhorse = passes.at(-1)?.unhorse ?? 0;
  const won = !yielded && (unhorse === 1 || (unhorse === 0 && score[0] > score[1]));

  function ride(plan: string) {
    setPhase('charge');
    setTimeout(() => {
      const [a, ap] = roll(), [b, bp] = roll();
      const r = Math.random();
      const un = r < 0.06 && ap >= 2 ? 1 : r > 0.94 && bp >= 2 ? 2 : 0;
      setPasses((ps) => {
        const next = [...ps, { plan, you: a, foe: b, youPts: ap, foePts: bp, unhorse: un as 0 | 1 | 2 }];
        const s = next.reduce((t, p) => [t[0] + p.youPts, t[1] + p.foePts], [0, 0]);
        const done = un !== 0 || (next.length >= format.passes && s[0] !== s[1]); // tie: sudden death
        setPhase('hit');
        setTimeout(() => { setLeft(PLAN_SECONDS); setPhase(done ? 'over' : 'plan'); }, 900);
        return next;
      });
    }, 2200);
  }

  useEffect(() => { // plan timer: out of time means a steady canter
    if (phase !== 'plan') return;
    if (left === 0) return ride('Steady canter');
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, left]);

  useEffect(() => { if (phase === 'over') dialog.current?.showModal(); }, [phase]);

  function reset() {
    dialog.current?.close();
    setPasses([]); setYielded(false); setLeft(PLAN_SECONDS); setPhase('plan');
  }

  return (
    <div className="grid2">
      <div className="stack">
        <div className="bar">
          <KnightCell k={foe} rating={foe.rating[format.id]} />
          <span className="score num">{score[1]}</span>
        </div>
        <div className={`arena ${phase === 'charge' || phase === 'hit' ? 'charging' : ''} ${phase === 'hit' ? 'hit' : ''}`}>
          <span className="rider you"><Shield colors={you.colors} /></span>
          <span className="rider foe"><Shield colors={foe.colors} /></span>
          <span className="flash" />
          <p className="caption">Demo match. Results are random until the arena is built.</p>
        </div>
        <div className="bar">
          <KnightCell k={you} rating={you.rating[format.id]} link={false} />
          <span className="row">
            {phase === 'plan' && <span className={left <= 3 ? 'timer low' : 'timer'} aria-label={`${left} seconds to choose`}>0:{String(left).padStart(2, '0')}</span>}
            <span className="score num">{score[0]}</span>
          </span>
        </div>
      </div>

      <div className="stack">
        <div className="shield-panel"><div>
          <h2>{phase === 'plan' ? `Pass ${passes.length + 1}: choose your plan` : phase === 'over' ? 'Match over' : 'Charging'}</h2>
          <div className="stack">
            {PLANS.map((p) => (
              <button key={p.id} className="pick" disabled={phase !== 'plan'} onClick={() => ride(p.name)}>
                <b>{p.name}</b><span>{p.note}</span>
              </button>
            ))}
          </div>
        </div></div>

        <div className="panel">
          <h2>{format.name}, {rated ? 'rated' : 'friendly'}</h2>
          {passes.length === 0 ? <p className="muted">No passes yet. Each pass appears here with where both lances landed.</p> : (
            <ol className="passes">
              {passes.map((p, i) => (
                <li key={i}>
                  <span className="num">{i + 1}</span>
                  <span>{p.you} <b className="num">+{p.youPts}</b>{p.unhorse === 1 && ', unhorsed them'}<br /><small className="muted">{p.plan}</small></span>
                  <span>{p.foe} <b className="num">+{p.foePts}</b>{p.unhorse === 2 && ', unhorsed you'}</span>
                </li>
              ))}
            </ol>
          )}
          <button className="link" disabled={phase === 'over'} onClick={() => { setYielded(true); setPhase('over'); }}>Yield the match</button>
        </div>
      </div>

      <dialog className="result" ref={dialog} onClose={() => phase === 'over' && dialog.current?.showModal()}>
        <div className="shield-panel"><div>
          <h2>{won ? 'Victory' : 'Defeat'}</h2>
          <p className="muted" style={{ textAlign: 'center', margin: '0 auto 8px' }}>
            {yielded ? 'You yielded.' : unhorse === 1 ? `You unhorsed ${foe.name}.` : unhorse === 2 ? `${foe.name} unhorsed you.` : `${score[0]} to ${score[1]} on points.`}
          </p>
          <p className={`delta ${won ? 'up' : 'down'}`}>{rated ? `${won ? '+' : '−'}${delta} rating` : 'Friendly, rating unchanged'}</p>
          <div className="stack">
            <button className="btn" onClick={reset}>Rematch</button>
            <Link className="ghost" to="/play">New match</Link>
          </div>
        </div></div>
      </dialog>
    </div>
  );
}

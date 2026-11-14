import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FORMATS, PLANS, findKnight, guest } from '../data/mock';
import { useAuth } from '../lib/auth';
import { BOTS, ride } from '../rules/bots';
import { newMatch, playPass, type MatchState } from '../rules/match';
import type { Final, KnightState, PassInput, Plan, Skill, Strike, Zone } from '../rules/resolvePass';
import { T } from '../rules/tuning';
import { KnightCell, Shield } from '../ui';

const PLAN_SECONDS = 10;
const SKILL_NAMES: Record<Skill, string> = {
  none: 'No skill', couchLate: 'Couch late', slantGuard: 'Slant guard', spurBurst: 'Spur burst', visorLate: 'Drop visor late', secondWind: 'Second wind',
};
const FINAL_NAMES: Record<Final, string> = {
  none: 'No move', drive: 'Drive', lock: 'Lock stirrups', duck: 'Duck', swivel: 'Swivel deflect', release: 'Release lance',
};
const ZONE_NAMES: Record<Zone, string> = {
  miss: 'Miss', shieldGlance: 'Shield, glancing', shieldSolid: 'Shield, solid', chest: 'Chest', helm: 'Helm', foul: 'Foul',
};

type Choice = { plan: Plan; skill: Skill; target: 'helm' | 'chest'; shield: PassInput['shield']; lean: PassInput['lean']; rein: PassInput['rein']; final: Final };
const START: Choice = { plan: 'steady', skill: 'none', target: 'chest', shield: 'mid', lean: 'none', rein: 'mid', final: 'none' };

const botFor = (name: string) =>
  name.includes('Headhunter') ? BOTS.headhunter : name.includes('Turtle') ? BOTS.turtle : name.includes('Feinter') ? BOTS.feinter
    : Object.values(BOTS)[name.length % 3];

const Wear = ({ s }: { s: KnightState }) => (
  <span className="wear">
    <span>Stamina <b>{Math.round(s.stamina * 100)}%</b></span>
    <span>Poise <b>{Math.round(s.poise)}</b></span>
    <span>Shield <b>{s.shieldHp ? `${s.shieldHp}/${T.shieldHp}` : 'broken'}</b></span>
    {s.dazed && <b className="down">Dazed</b>}
  </span>
);

function Pick<V extends string>({ label, value, options, onChange, disabled }: {
  label: string; value: V; options: [V, string][]; onChange: (v: V) => void; disabled: boolean;
}) {
  return (
    <label className="field">{label}
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value as V)}>
        {options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
      </select>
    </label>
  );
}

export default function Match() {
  const [q] = useSearchParams();
  const { username } = useAuth();
  const format = FORMATS.find((f) => f.id === q.get('format')) ?? FORMATS[1];
  const rated = q.get('rated') === '1';
  const foe = findKnight(q.get('vs') ?? 'Mordane');
  const you = guest(username ?? 'Guest');

  const [match, setMatch] = useState<MatchState>(() => newMatch(format.passes));
  const [strikes, setStrikes] = useState<[Strike, Strike][]>([]);
  const [c, setC] = useState<Choice>(START);
  const [phase, setPhase] = useState<'plan' | 'charge' | 'hit' | 'over'>('plan');
  const [left, setLeft] = useState(PLAN_SECONDS);
  const [yielded, setYielded] = useState(false);
  const [delta] = useState(() => 8 + Math.floor(Math.random() * 7)); // demo rating change
  const dialog = useRef<HTMLDialogElement>(null);
  const live = useRef({ c, match }); // the timer must ride with the latest choices
  live.current = { c, match };

  const set = <K extends keyof Choice>(key: K) => (v: Choice[K]) => setC((old) => ({ ...old, [key]: v }));
  const [me, them] = match.knights;
  const won = !yielded && match.winner === 0;

  function charge() {
    const { c, match } = live.current;
    const [me, them] = match.knights;
    // Until the arena exists, aim wobble and impact timing are simulated the same way as for the bots.
    const mine = ride(me, Math.random, { ...c, visorDown: Math.random() < 0.85 });
    const next = playPass(match, mine, botFor(foe.name)(them, me, Math.random));
    setPhase('charge');
    setTimeout(() => {
      setMatch(next);
      setStrikes((s) => [...s, next.last!]);
      setPhase('hit');
      setTimeout(() => {
        setLeft(PLAN_SECONDS);
        setC((old) => ({ ...old, skill: 'none', final: 'none' })); // skills and final moves are chosen fresh each pass
        setPhase(next.winner === null ? 'plan' : 'over');
      }, 900);
    }, 2200);
  }

  useEffect(() => { // out of time: ride with whatever is selected
    if (phase !== 'plan') return;
    if (left === 0) return charge();
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, left]);

  useEffect(() => { if (phase === 'over') dialog.current?.showModal(); }, [phase]);

  function reset() {
    dialog.current?.close();
    setMatch(newMatch(format.passes)); setStrikes([]); setC(START); setYielded(false); setLeft(PLAN_SECONDS); setPhase('plan');
  }

  const planning = phase === 'plan';
  const skills = (Object.keys(SKILL_NAMES) as Skill[]).map((s): [Skill, string] => {
    const leftUses = T.skillUses[s] - (me.uses[s] ?? 0);
    return [s, Number.isFinite(leftUses) ? `${SKILL_NAMES[s]} (${leftUses > 0 ? `${leftUses} left` : 'used'})` : SKILL_NAMES[s]];
  });
  const outcome = yielded ? 'You yielded.'
    : match.endedBy === 'unhorse' ? (won ? `You unhorsed ${foe.name}.` : `${foe.name} unhorsed you.`)
    : match.endedBy === 'fouls' ? (won ? `${foe.name} fouled twice.` : 'You fouled twice.')
    : `${match.score[0]} to ${match.score[1]} on points.`;

  return (
    <div className="grid2">
      <div className="stack">
        <div className="bar">
          <span className="stack" style={{ gap: 4 }}><KnightCell k={foe} rating={foe.rating[format.id]} /><Wear s={them} /></span>
          <span className="score num">{match.score[1]}</span>
        </div>
        <div className={`arena ${phase === 'charge' || phase === 'hit' ? 'charging' : ''} ${phase === 'hit' ? 'hit' : ''}`}>
          <span className="rider you"><Shield colors={you.colors} /></span>
          <span className="rider foe"><Shield colors={foe.colors} /></span>
          <span className="flash" />
          <p className="caption">Real rules, simulated riding: your aim and timing are rolled for you until the arena is built.</p>
        </div>
        <div className="bar">
          <span className="stack" style={{ gap: 4 }}><KnightCell k={you} rating={you.rating[format.id]} link={false} /><Wear s={me} /></span>
          <span className="row">
            {planning && <span className={left <= 3 ? 'timer low' : 'timer'} aria-label={`${left} seconds to choose`}>0:{String(left).padStart(2, '0')}</span>}
            <span className="score num">{match.score[0]}</span>
          </span>
        </div>
      </div>

      <div className="stack">
        <div className="shield-panel"><div>
          <h2>{planning ? `Pass ${match.played + 1}: plan your ride` : phase === 'over' ? 'Match over' : 'Charging'}</h2>
          <fieldset className="choice" disabled={!planning}>
            <legend>Riding plan</legend>
            {PLANS.map((p) => (
              <label key={p.id}>
                <input type="radio" name="plan" checked={c.plan === p.id} onChange={() => set('plan')(p.id as Plan)} />
                <b>{p.name}</b><span>{p.note}</span>
              </label>
            ))}
          </fieldset>
          <div className="controls">
            <Pick label="Tactical skill" value={c.skill} onChange={set('skill')} disabled={!planning} options={skills} />
            <Pick label="Aim at" value={c.target} onChange={set('target')} disabled={!planning} options={[['chest', 'Chest, 2 points'], ['helm', 'Helm, 3 points']]} />
            <Pick label="Shield" value={c.shield} onChange={set('shield')} disabled={!planning} options={[['mid', 'Mid, covers chest'], ['high', 'High, covers helm']]} />
            <Pick label="Lean" value={c.lean} onChange={set('lean')} disabled={!planning} options={[['none', 'Upright'], ['in', 'In: more force, less poise'], ['away', 'Away: harder to hit']]} />
            <Pick label="Rein line" value={c.rein} onChange={set('rein')} disabled={!planning} options={[['mid', 'Middle'], ['tight', 'Tight: more force, foul risk'], ['wide', 'Wide: safer, weaker']]} />
            <Pick label="At impact" value={c.final} onChange={set('final')} disabled={!planning}
              options={(Object.keys(FINAL_NAMES) as Final[]).map((f) => [f, FINAL_NAMES[f]])} />
          </div>
          <button className="btn big" disabled={!planning} onClick={charge}>Charge</button>
        </div></div>

        <div className="panel">
          <h2>{format.name}, {rated ? 'rated' : 'friendly'}</h2>
          {strikes.length === 0 ? <p className="muted">No passes yet. Each pass appears here with where both lances landed.</p> : (
            <ol className="passes">
              {strikes.map(([a, b], i) => (
                <li key={i}>
                  <span className="num">{i + 1}</span>
                  {[a, b].map((s, j) => (
                    <span key={j}>
                      {ZONE_NAMES[s.zone]} <b className="num">{s.points > 0 ? `+${s.points}` : s.points < 0 ? `−${-s.points}` : ''}</b>
                      {s.lanceBroken && ', lance broken'}{s.unhorsed && ', unhorse'}
                      <br /><small className="muted">{PLANS.find((p) => p.id === match.history[i].plans[j])!.name}</small>
                    </span>
                  ))}
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
          <p className="muted" style={{ textAlign: 'center', margin: '0 auto 8px' }}>{outcome}</p>
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

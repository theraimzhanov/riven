import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ARMOURY, DRILLS, FORMATS, findKnight, history, knights, leagueOf, tournaments, type Format, type Knight } from '../data/mock';
import { useAuth } from '../lib/auth';
import { KnightCell, Shield, Tabs } from '../ui';

const FORMAT_TABS = FORMATS.map((f) => [f.id, f.name] as [Format, string]);
const formatName = (id: Format) => FORMATS.find((f) => f.id === id)!.name;

export function Leaderboard() {
  const [format, setFormat] = useState<Format>('classic');
  const rows = [...knights].sort((a, b) => b.rating[format] - a.rating[format]);
  return (
    <>
      <h1>Leaderboard</h1>
      <Tabs value={format} onChange={setFormat} options={FORMAT_TABS} />
      <div className="scroll">
        <table>
          <thead><tr><th>Rank</th><th>Knight</th><th>Country</th><th>Rating</th><th>Won</th><th>Lost</th></tr></thead>
          <tbody>
            {rows.map((k, i) => (
              <tr key={k.name}>
                <td className="rank">{i + 1}</td>
                <td><KnightCell k={k} rating={k.rating[format]} /></td>
                <td className="muted">{k.country}</td>
                <td className="num">{k.rating[format]}</td>
                <td className="num">{k.wins}</td>
                <td className="num muted">{k.losses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const STATUS = { open: 'Open', live: 'Live', finished: 'Finished' };

export function Tournaments() {
  return (
    <>
      <h1>Tournaments</h1>
      <p className="muted">Knockout brackets for 8 or 16 knights. Lose once and you are out. The winner keeps a trophy on their profile.</p>
      <div className="scroll">
        <table>
          <thead><tr><th>Name</th><th>Format</th><th>Knights</th><th>Rating</th><th>Status</th><th>When</th></tr></thead>
          <tbody>
            {tournaments.map((t) => (
              <tr key={t.id}>
                <td><Link to={`/tournaments/${t.id}`}><b>{t.name}</b></Link></td>
                <td>{formatName(t.format)}</td>
                <td className="num">{t.joined}/{t.size}</td>
                <td className="muted">{t.band}</td>
                <td><span className={t.status === 'live' ? 'tag live' : 'tag'}>{STATUS[t.status]}</span></td>
                <td className="muted">{t.starts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const ROUND_NAMES: Record<number, string> = { 8: 'Round of 16', 4: 'Quarter-finals', 2: 'Semi-finals', 1: 'Final' };

export function TournamentPage() {
  const { id } = useParams();
  const t = tournaments.find((x) => x.id === id);
  const [joined, setJoined] = useState(false);
  if (!t) return <><h1>Tournament not found</h1><p><Link to="/tournaments">See all tournaments</Link></p></>;

  const field = knights.slice(0, t.size);
  // demo bracket: higher rating advances; live = first round played, finished = all rounds
  const playedRounds = t.status === 'finished' ? 99 : t.status === 'live' ? 1 : 0;
  const rounds: (Knight | null)[][] = [field.map((_, i) => field[i % 2 ? t.size - 1 - (i >> 1) : i >> 1])]; // 1 v last, 2 v second-last
  for (let r = 0; rounds[r].length > 1; r++) {
    rounds.push(Array.from({ length: rounds[r].length / 2 }, (_, i) => {
      const [a, b] = [rounds[r][i * 2], rounds[r][i * 2 + 1]];
      return r < playedRounds && a && b ? (a.rating[t.format] >= b.rating[t.format] ? a : b) : null;
    }));
  }

  return (
    <>
      <p><Link to="/tournaments">Tournaments</Link></p>
      <h1>{t.name}</h1>
      <p className="row muted">
        <span className={t.status === 'live' ? 'tag live' : 'tag'}>{STATUS[t.status]}</span>
        {formatName(t.format)}, {t.size} knights, {t.band}. {t.starts}.
      </p>
      {t.status === 'open' && (
        <div className="row" style={{ marginBottom: 24 }}>
          <button className={joined ? 'ghost' : 'btn'} onClick={() => setJoined(!joined)}>{joined ? 'Leave tournament' : 'Join tournament'}</button>
          <span className="muted num">{t.joined + +joined}/{t.size} joined</span>
        </div>
      )}

      {t.status === 'open' ? (
        <div className="panel">
          <h2>Knights so far</h2>
          <div className="cards">{field.slice(0, t.joined).map((k) => <KnightCell key={k.name} k={k} rating={k.rating[t.format]} />)}</div>
          <p className="muted" style={{ marginTop: 16 }}>The bracket is drawn by rating when the tournament starts.</p>
        </div>
      ) : (
        <div className="bracket">
          {rounds.slice(0, -1).map((round, r) => (
            <div className="round" key={r}>
              <h3>{ROUND_NAMES[round.length / 2]}</h3>
              {Array.from({ length: round.length / 2 }, (_, i) => {
                const winner = rounds[r + 1][i];
                return (
                  <div className="tie" key={i}>
                    {[round[i * 2], round[i * 2 + 1]].map((k, j) => (
                      <div key={j} className={winner && k ? (winner === k ? 'won' : 'lost') : ''}>
                        {k ? <><Shield colors={k.colors} /> {k.name}</> : <span className="muted">To be decided</span>}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function KnightPage() {
  const name = useParams().name ?? '';
  const { username } = useAuth();
  const k = findKnight(name);
  const isReal = knights.includes(k);
  const games = k.wins + k.losses;
  const pts = history(k.rating.classic);
  const [lo, hi] = [Math.min(...pts), Math.max(...pts)];
  const trophies = tournaments.filter((t) => t.starts === `Won by ${k.name}`);

  return (
    <>
      <div className="profile-head">
        <Shield colors={k.colors} lg />
        <div>
          <h1 style={{ marginBottom: 4 }}>{k.name}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {leagueOf(k.rating.classic)}{isReal && `, ${k.country}`}{name === username && '. This is you.'}
          </p>
        </div>
      </div>

      <div className="stats">
        {FORMATS.map((f) => <div className="stat" key={f.id}><span className="num">{k.rating[f.id]}</span><span className="muted">{f.name}</span></div>)}
        <div className="stat"><span className="num">{k.wins}</span><span className="muted">Won</span></div>
        <div className="stat"><span className="num">{k.losses}</span><span className="muted">Lost</span></div>
        <div className="stat"><span className="num">{games ? Math.round((k.wins / games) * 100) : 0}%</span><span className="muted">Win rate</span></div>
      </div>

      {!isReal ? (
        <div className="panel">
          <h2>No matches yet</h2>
          <p className="muted">Every knight starts at 1200. Play a rated match and your history starts here.</p>
          <Link className="btn" to="/play">Find opponent</Link>
        </div>
      ) : (
        <div className="grid2">
          <div className="panel">
            <h2>Classic rating, last 24 matches</h2>
            <svg className="graph" viewBox={`0 0 23 ${hi - lo}`} preserveAspectRatio="none" role="img"
              aria-label={`Rating rose from ${pts[0]} to ${pts[23]} over the last 24 matches`}>
              {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="0" x2="23" y1={(hi - lo) * f} y2={(hi - lo) * f} />)}
              <polyline points={pts.map((p, i) => `${i},${hi - p}`).join(' ')} />
            </svg>
            <p className="muted row" style={{ justifyContent: 'space-between', maxWidth: 'none', margin: '8px 0 0' }}>
              <span className="num">{pts[0]}</span><span className="num">{pts[23]}</span>
            </p>
          </div>
          <div className="stack">
            <div className="panel">
              <h2>Recent matches</h2>
              <ul className="passes">
                {knights.filter((o) => o !== k).slice(0, 5).map((o, i) => (
                  <li key={o.name} style={{ gridTemplateColumns: '1fr auto' }}>
                    <KnightCell k={o} rating={o.rating.classic} />
                    <b className={i % 3 === 2 ? 'down' : 'up'}>{i % 3 === 2 ? 'Lost' : 'Won'}</b>
                  </li>
                ))}
              </ul>
            </div>
            <div className="panel">
              <h2>Trophies</h2>
              {trophies.length ? trophies.map((t) => <p key={t.id}><Link to={`/tournaments/${t.id}`}>{t.name}</Link>, winner</p>)
                : <p className="muted">None yet. Win a tournament to hang one here.</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function Drills() {
  return (
    <>
      <h1>Drills</h1>
      <p className="muted">Short tasks against a bot that train one skill at a time. Drills do not change your rating.</p>
      <div className="cards">
        {DRILLS.map((d) => (
          <div className="panel stack" key={d.name}>
            <h2>{d.name}</h2>
            <p>{d.goal}</p>
            <p className="muted">Against: {d.bot}. Best: {d.best}.</p>
            <Link className="ghost" to={`/match?format=blitz&vs=${encodeURIComponent(d.bot)}&rated=0`}>Start drill</Link>
          </div>
        ))}
      </div>
    </>
  );
}

export function Armoury() {
  return (
    <>
      <h1>Armoury</h1>
      <p className="muted">Looks only. Nothing here changes speed, force or balance: every knight rides with the same strength.</p>
      <div className="cards">
        {ARMOURY.map((a) => (
          <div className="panel stack" key={a.name}>
            <span className="tag" style={{ justifySelf: 'start' }}>{a.kind}</span>
            <h2>{a.name}</h2>
            <p className="muted">{a.note}</p>
            <button className="ghost" disabled>Not on sale yet</button>
          </div>
        ))}
      </div>
    </>
  );
}

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BOTS, DRILLS, FORMATS, knights, leagueOf, tournaments, type Format, type Knight } from '../data/mock';
import { asKnight, getProfile, matchesOf, ratingOf, recordOf, topKnights, useLoad } from '../lib/api';
import { useAuth } from '../lib/auth';
import { KnightCell, NeedsLogin, Shield, Tabs } from '../ui';

const FORMAT_TABS = FORMATS.map((f) => [f.id, f.name] as [Format, string]);
const formatName = (id: Format) => FORMATS.find((f) => f.id === id)!.name;
const countryName = (code: string | null) => {
  if (!code) return '';
  try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code; } catch { return code; }
};

export function Leaderboard() {
  const [format, setFormat] = useState<Format>('classic');
  const { username } = useAuth();
  const { data, loading } = useLoad(() => topKnights(format), [format]);
  return (
    <>
      <h1>Leaderboard</h1>
      <p className="muted">Every knight starts at 1200. Ratings move once ranked play opens; until then the order is who joined first.</p>
      <Tabs value={format} onChange={setFormat} options={FORMAT_TABS} />
      {loading ? <p className="muted">Loading the roll.</p> : !data?.length ? (
        <div className="panel"><h2>No knights yet</h2><p className="muted">The first account takes the first place.</p><Link className="btn" to="/register">Create account</Link></div>
      ) : (
        <div className="scroll">
          <table>
            <thead><tr><th>Rank</th><th>Knight</th><th>Country</th><th>Rating</th></tr></thead>
            <tbody>
              {data.map((p, i) => (
                <tr key={p.id} className={p.username === username ? 'me' : ''}>
                  <td className="rank">{i + 1}</td>
                  <td><KnightCell k={asKnight(p)} sub={leagueOf(ratingOf(p, format))} /></td>
                  <td className="muted">{countryName(p.country)}</td>
                  <td className="num">{ratingOf(p, format)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function KnightPage() {
  const name = useParams().name ?? '';
  const { username } = useAuth();
  const { data, loading } = useLoad(async () => {
    const profile = await getProfile(name);
    if (!profile) return null;
    const [record, matches] = await Promise.all([recordOf(profile.id), matchesOf(profile.id, 10)]);
    return { profile, record, matches };
  }, [name]);

  if (loading) return <p className="muted">Loading {name}.</p>;
  if (!data) return <><h1>No such knight</h1><p>Nobody rides under the name {name}. <Link to="/leaderboard">See the leaderboard</Link>.</p></>;
  const { profile: p, record, matches } = data;
  const games = record.wins + record.losses;

  return (
    <>
      <div className="profile-head">
        <Shield colors={[p.color_a, p.color_b]} division={p.division} lg />
        <div>
          <h1 style={{ marginBottom: 4 }}>{p.username}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {[leagueOf(p.rating_classic), countryName(p.country), `joined ${new Date(p.created_at).toLocaleDateString()}`].filter(Boolean).join(', ')}
          </p>
          {p.username === username && <p style={{ margin: '8px 0 0' }}><Link to="/armoury">Change heraldry</Link> or <Link to="/settings">account settings</Link></p>}
        </div>
      </div>

      <div className="stats">
        {FORMATS.map((f) => <div className="stat" key={f.id}><span className="num">{ratingOf(p, f.id)}</span><span className="muted">{f.name}</span></div>)}
        <div className="stat"><span className="num">{record.wins}</span><span className="muted">Practice wins</span></div>
        <div className="stat"><span className="num">{record.losses}</span><span className="muted">Practice losses</span></div>
        <div className="stat"><span className="num">{games ? Math.round((record.wins / games) * 100) : 0}%</span><span className="muted">Win rate</span></div>
      </div>

      <div className="grid2">
        <div className="panel">
          <h2>Recent matches</h2>
          {!matches.length ? <p className="muted">No matches yet.</p> : (
            <ul className="passes">
              {matches.map((m) => (
                <li key={m.id} style={{ gridTemplateColumns: '1fr auto auto' }}>
                  <span><b>{m.opponent}</b><br /><small className="muted">{formatName(m.format)}, {new Date(m.created_at).toLocaleDateString()}, by {m.ended_by}</small></span>
                  <span className="num muted">{m.score_for} : {m.score_against}</span>
                  <b className={m.won ? 'up' : 'down'}>{m.won ? 'Won' : 'Lost'}</b>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="panel">
          <h2>Trophies</h2>
          <p className="muted">None yet. Trophies come from tournaments, which open with the arena.</p>
        </div>
      </div>
    </>
  );
}

export function Drills() {
  const { user } = useAuth();
  const { data } = useLoad(async () => (user ? matchesOf(user.id, 200) : []), [user?.id]);
  return (
    <>
      <h1>Drills</h1>
      <p className="muted">Each bot rides one way. Beat all three and you have met the three habits you will see most in other knights.</p>
      <div className="cards">
        {DRILLS.map((d) => {
          const bot = BOTS.find((b) => b.id === d.bot)!;
          const wins = (data ?? []).filter((m) => m.opponent === bot.name && m.won).length;
          return (
            <div className="panel stack" key={d.bot}>
              <h2>{d.name}</h2>
              <p>{d.goal}</p>
              <p className="muted">{!user ? 'Log in to track your wins.' : wins ? `Beaten ${wins} time${wins === 1 ? '' : 's'}.` : 'Not beaten yet.'}</p>
              <Link className={wins ? 'ghost' : 'btn'} to={`/match?format=blitz&vs=${d.bot}`}>Ride against {bot.name}</Link>
            </div>
          );
        })}
      </div>
      {!user && <div style={{ marginTop: 24 }}><NeedsLogin what="to track your drills" /></div>}
    </>
  );
}

// ---------- tournaments: preview with sample knights until the arena exists ----------
const STATUS = { open: 'Open', live: 'Live', finished: 'Finished' };
const Preview = () => <p className="notice">Preview with sample knights. Tournaments open after the arena is built.</p>;

export function Tournaments() {
  return (
    <>
      <h1>Tournaments</h1>
      <Preview />
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
const sample = (k: Knight) => ({ name: k.name, colors: k.colors });

export function TournamentPage() {
  const { id } = useParams();
  const t = tournaments.find((x) => x.id === id);
  if (!t) return <><h1>Tournament not found</h1><p><Link to="/tournaments">See all tournaments</Link></p></>;

  const field = knights.slice(0, t.size);
  // sample bracket: higher rating advances; live = first round played, finished = all rounds
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
      <Preview />
      <p className="row muted">
        <span className={t.status === 'live' ? 'tag live' : 'tag'}>{STATUS[t.status]}</span>
        {formatName(t.format)}, {t.size} knights, {t.band}. {t.starts}.
      </p>
      {t.status === 'open' ? (
        <div className="panel">
          <h2>Knights so far</h2>
          <div className="cards">{field.slice(0, t.joined).map((k) => <KnightCell key={k.name} k={sample(k)} sub={`${leagueOf(k.rating[t.format])} ${k.rating[t.format]}`} link={false} />)}</div>
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

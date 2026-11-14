import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BOTS, FORMATS, leagueOf, type Format } from '../data/mock';
import { acceptFriend, addFriend, asKnight, listFriends, matchesOf, ratingOf, removeFriend, useLoad } from '../lib/api';
import { useAuth } from '../lib/auth';
import { KnightCell, NeedsLogin, Tabs } from '../ui';

type Tab = 'ride' | 'matches' | 'friends';
const formatName = (id: Format) => FORMATS.find((f) => f.id === id)!.name;

function Matches({ me }: { me: string }) {
  const { data, loading } = useLoad(() => matchesOf(me, 12), [me]);
  if (loading) return <p className="muted">Loading your matches.</p>;
  if (!data?.length) return <p className="muted">No matches yet. Ride against a bot and it appears here.</p>;
  return (
    <ul className="passes">
      {data.map((m) => (
        <li key={m.id} style={{ gridTemplateColumns: '1fr auto auto' }}>
          <span><b>{m.opponent}</b><br /><small className="muted">{formatName(m.format)}, {new Date(m.created_at).toLocaleDateString()}</small></span>
          <span className="num muted">{m.score_for} : {m.score_against}</span>
          <b className={m.won ? 'up' : 'down'}>{m.won ? 'Won' : 'Lost'}</b>
        </li>
      ))}
    </ul>
  );
}

function Friends({ me, format }: { me: string; format: Format }) {
  const { online } = useAuth();
  const { data, loading, reload } = useLoad(() => listFriends(me), [me]);
  const [error, setError] = useState('');
  const [sent, setSent] = useState('');

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = String(new FormData(form).get('name'));
    setError(''); setSent('');
    const problem = await addFriend(me, name);
    if (problem) return setError(problem);
    setSent(`Request sent to ${name}.`);
    form.reset();
    reload();
  }

  return (
    <div className="stack">
      <form className="row" onSubmit={add}>
        <input name="name" type="text" required placeholder="Knight name" aria-label="Knight name to add" style={{ flex: 1, minWidth: 0 }} />
        <button className="ghost small">Send request</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
      {sent && <p className="ok" role="status">{sent}</p>}
      {loading ? <p className="muted">Loading your friends.</p> : !data?.length ? (
        <p className="muted">No friends yet. Add a knight by name; they see your request the next time they open this tab.</p>
      ) : (
        <ul className="passes">
          {data.map(({ profile: p, status, incoming }) => (
            <li key={p.id} style={{ gridTemplateColumns: 'auto 1fr auto', alignItems: 'center' }}>
              <span className={online.has(p.username) ? 'dot' : 'dot off'} role="img" aria-label={online.has(p.username) ? 'Online' : 'Offline'} />
              <KnightCell k={asKnight(p)} sub={status === 'pending' ? (incoming ? 'Wants to be your friend' : 'Request sent') : `${leagueOf(ratingOf(p, format))} ${ratingOf(p, format)}`} />
              <span className="row">
                {status === 'pending' && incoming && <button className="btn small" onClick={() => acceptFriend(me, p.id).then(reload)}>Accept</button>}
                <button className="link" onClick={() => removeFriend(me, p.id).then(reload)}>{status === 'accepted' ? 'Remove' : incoming ? 'Decline' : 'Cancel'}</button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="muted" style={{ margin: 0 }}>Challenging a friend opens with online play.</p>
    </div>
  );
}

export default function Lobby() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('ride');
  const [format, setFormat] = useState<Format>('classic');

  return (
    <div className="grid2">
      <div className="stack">
        <div className="arena art" style={{ backgroundImage: 'url(/media/hero.png)' }}>
          <p className="caption">The tiltyard. You ride here against the bots today; other knights join when online play opens.</p>
        </div>
        <div className="panel">
          <h2>New here?</h2>
          <p className="muted">A pass lasts six seconds and you control all of it: lance, spurs, shield, one skill and one move at impact.</p>
          <Link className="ghost" to="/rules">How to play</Link>
        </div>
      </div>

      <div className="shield-panel"><div>
        <Tabs value={tab} onChange={setTab} options={[['ride', 'Ride'], ['matches', 'Matches'], ['friends', 'Friends']]} />

        {tab === 'ride' && (
          <>
            <fieldset className="choice">
              <legend>Format</legend>
              {FORMATS.map((f) => (
                <label key={f.id}>
                  <input type="radio" name="format" checked={format === f.id} onChange={() => setFormat(f.id)} />
                  <b>{f.name}</b><span>{f.blurb}</span>
                </label>
              ))}
            </fieldset>
            <p className="muted" style={{ marginBottom: 8 }}>Choose your opponent</p>
            <div className="stack">
              {BOTS.map((b) => (
                <button key={b.id} className="pick" onClick={() => nav(`/match?format=${format}&vs=${b.id}`)}>
                  <b>{b.name} <span className="num muted">{b.rating}</span></b><span>{b.style}</span>
                </button>
              ))}
              <button className="ghost" disabled>Find a human opponent</button>
              <p className="muted" style={{ margin: 0 }}>Ranked matches against other knights open with the arena. Practice matches do not change your rating.</p>
            </div>
          </>
        )}
        {tab === 'matches' && (user ? <Matches me={user.id} /> : <NeedsLogin what="to keep a match history" />)}
        {tab === 'friends' && (user ? <Friends me={user.id} format={format} /> : <NeedsLogin what="to add friends" />)}
      </div></div>
    </div>
  );
}

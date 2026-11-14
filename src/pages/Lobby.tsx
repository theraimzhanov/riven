import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import emblem from '../../assets/brand/riven-emblem.jpg';
import { BOTS, FORMATS, knights, type Format } from '../data/mock';
import { KnightCell, Shield, Tabs } from '../ui';

type Tab = 'new' | 'matches' | 'knights';

export default function Lobby() {
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>('new');
  const [format, setFormat] = useState<Format>('classic');
  const [rated, setRated] = useState(true);
  const [seeking, setSeeking] = useState(false);
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);

  const start = (vs: string, isRated = rated) => nav(`/match?format=${format}&vs=${encodeURIComponent(vs)}&rated=${isRated ? 1 : 0}`);

  useEffect(() => {
    if (!seeking) return;
    // demo: "finds" a random online knight after a short wait
    const online = knights.filter((k) => k.online);
    const t = setTimeout(() => start(online[Math.floor(Math.random() * online.length)].name), 2600);
    return () => clearTimeout(t);
  }, [seeking]);

  return (
    <div className="grid2">
      <div className="stack">
        <div className="arena">
          <img className="emblem" src={emblem} alt="" />
          <span className="rider you"><Shield colors={['#b3121b', '#1b1b1f']} /></span>
          <span className="rider foe"><Shield colors={['#8d9199', '#1b1b1f']} /></span>
          <p className="caption">The 3D arena will appear here.</p>
        </div>
        <div className="panel">
          <h2>Practice against a bot</h2>
          <div className="stack">
            {BOTS.map((b) => (
              <button key={b.name} className="pick" onClick={() => start(b.name, false)}>
                <b>{b.name} <span className="num muted">{b.rating}</span></b><span>{b.style}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="shield-panel"><div>
        <Tabs value={tab} onChange={setTab} options={[['new', 'New match'], ['matches', 'Matches'], ['knights', 'Knights']]} />

        {tab === 'new' && (seeking ? (
          <div className="seeking" role="status">
            <div className="pulse" />
            <p>Looking for a {FORMATS.find((f) => f.id === format)!.name} opponent near your rating.</p>
            <button className="ghost" onClick={() => setSeeking(false)}>Cancel</button>
          </div>
        ) : (
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
            <label className="row" style={{ marginBottom: 16 }}>
              <input type="checkbox" checked={rated} onChange={(e) => setRated(e.target.checked)} /> Rated match
            </label>
            <div className="stack">
              <button className="btn big" onClick={() => setSeeking(true)}>Find opponent</button>
              <button className="ghost" onClick={() => { setLink(`${location.origin}/match?format=${format}&vs=Friend&rated=0`); setCopied(false); }}>
                Challenge a friend
              </button>
              {link && (
                <div className="row">
                  <input type="text" readOnly value={link} aria-label="Challenge link" style={{ flex: 1, minWidth: 0 }} onFocus={(e) => e.target.select()} />
                  <button className="ghost small" onClick={() => navigator.clipboard.writeText(link).then(() => setCopied(true))}>
                    {copied ? 'Copied' : 'Copy link'}
                  </button>
                </div>
              )}
              <button className="ghost" onClick={() => nav('/tournaments')}>Tournaments</button>
            </div>
          </>
        ))}

        {tab === 'matches' && (
          <ul className="passes">
            {knights.slice(3, 9).map((k, i) => (
              <li key={k.name} style={{ gridTemplateColumns: '1fr auto auto' }}>
                <KnightCell k={k} rating={k.rating.classic} />
                <span className="muted">{FORMATS[i % 3].name}</span>
                <b className={i % 3 === 1 ? 'down' : 'up'}>{i % 3 === 1 ? 'Lost' : 'Won'}</b>
              </li>
            ))}
          </ul>
        )}

        {tab === 'knights' && (
          <ul className="passes">
            {knights.slice(0, 8).map((k) => (
              <li key={k.name} style={{ gridTemplateColumns: 'auto 1fr auto', alignItems: 'center' }}>
                <span className={k.online ? 'dot' : 'dot off'} title={k.online ? 'Online' : 'Offline'} />
                <KnightCell k={k} rating={k.rating[format]} />
                <button className="ghost small" disabled={!k.online} onClick={() => start(k.name)}>Challenge</button>
              </li>
            ))}
          </ul>
        )}
      </div></div>
    </div>
  );
}

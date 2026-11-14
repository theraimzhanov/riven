import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import emblem from '../../assets/brand/riven-emblem.jpg';
import { FORMATS } from '../data/mock';

const EMBERS = Array.from({ length: 14 }, (_, i) => ({
  '--x': `${(i * 37 + 5) % 100}%`, '--dx': `${(i % 5 - 2) * 30}px`, '--t': `${7 + (i % 4) * 2}s`, '--d': `${1.6 + i * 0.7}s`,
}) as CSSProperties);

export default function Landing() {
  return (
    <>
      <header className="hero">
        <div className="embers" aria-hidden="true">{EMBERS.map((s, i) => <i key={i} style={s} />)}</div>
        <img className="hero-emblem" src={emblem} alt="A black horse rearing in front of a cracked steel shield" />
        <h1 className="wordmark" aria-label="Riven">
          <span className="top" aria-hidden="true">Riven</span>
          <span className="bot" aria-hidden="true">Riven</span>
        </h1>
        <p className="hero-line">Two knights, one barrier, six seconds. Nothing you can buy makes you stronger.</p>
        <div className="tilt" aria-hidden="true"><i className="lance l" /><i className="lance r" /><i className="spark" /></div>
        <div className="row">
          <Link className="btn" to="/play">Enter the lists</Link>
          <Link className="ghost" to="/register">Create account</Link>
        </div>
      </header>

      <section className="section">
        <h2>One pass, three decisions</h2>
        <ol className="phases">
          <li><h3>Plan in secret</h3><p className="muted">Ten seconds. Choose how you ride and one tactical skill. Your opponent chooses too, and neither of you sees the other.</p></li>
          <li><h3>Ride the charge</h3><p className="muted">Spur on the beat, hold your line against the barrier, bring the lance down, set your shield. Your arm tires if you aim too early.</p></li>
          <li><h3>Commit at impact</h3><p className="muted">Four tenths of a second. Drive through, lock your stirrups, duck, deflect or let go. Then someone is still in the saddle.</p></li>
        </ol>
      </section>

      <section className="section">
        <h2>Formats</h2>
        <div className="scroll">
          <table>
            <tbody>
              {FORMATS.map((f) => (
                <tr key={f.id}><td><b>{f.name}</b></td><td className="muted">{f.blurb}</td><td className="num">{f.passes} passes</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginTop: 20 }}>
          Stamina, shield and poise carry from pass to pass. Each format has its own rating, and unhorsing your opponent ends the match at once.
        </p>
      </section>

      <footer>Riven is in development. The arena is not built yet; matches on this site are demonstrations.</footer>
    </>
  );
}

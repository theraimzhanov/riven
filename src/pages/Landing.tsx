import { Link } from 'react-router-dom';
import emblem from '../../assets/brand/riven-emblem.jpg';
import { FORMATS } from '../data/mock';
import { useAuth } from '../lib/auth';

export const Footer = () => (
  <footer>
    <nav className="row" style={{ justifyContent: 'center' }} aria-label="Footer">
      <Link to="/rules">How to play</Link><Link to="/terms">Terms</Link><Link to="/privacy">Privacy</Link>
    </nav>
    <p style={{ margin: '12px auto 0' }}>Riven is in development. Ranked play and tournaments open with the arena.</p>
  </footer>
);

export default function Landing() {
  const { user } = useAuth();
  return (
    <>
      <header className="hero">
        {/* poster shows first, and alone when the viewer asks for reduced motion */}
        <video className="hero-video" poster="/media/hero.png" autoPlay muted loop playsInline aria-hidden="true">
          <source src="/media/hero.mp4" type="video/mp4" />
        </video>
        <div className="hero-shade" aria-hidden="true" />
        <img className="hero-emblem" src={emblem} alt="A black horse rearing in front of a cracked steel shield" />
        <h1 className="wordmark" aria-label="Riven">
          <span className="top" aria-hidden="true">Riven</span>
          <span className="bot" aria-hidden="true">Riven</span>
        </h1>
        <p className="hero-line">Two knights, one barrier, six seconds. Nothing you can buy makes you stronger.</p>
        <div className="tilt" aria-hidden="true"><i className="lance l" /><i className="lance r" /><i className="spark" /></div>
        <div className="row">
          <Link className="btn" to="/play">Enter the lists</Link>
          {user ? <Link className="ghost" to="/rules">How to play</Link> : <Link className="ghost" to="/register">Create account</Link>}
        </div>
      </header>

      <section className="section">
        <h2>One pass, three decisions</h2>
        <ol className="phases">
          <li><h3>Plan in secret</h3><p className="muted">Ten seconds. Choose how you ride. Your opponent chooses too, and neither of you sees the other.</p></li>
          <li><h3>Ride the charge</h3><p className="muted">Spur on the beat, hold your line against the barrier, bring the lance down, set your shield, spend a skill. Your arm tires if you aim too early.</p></li>
          <li><h3>Commit at impact</h3><p className="muted">A fraction of a second. Drive through, lock your stirrups, duck, deflect or let go. Then someone is still in the saddle.</p></li>
        </ol>
        <p style={{ marginTop: 24 }}><Link to="/rules">Read the full rules</Link></p>
      </section>

      <section className="band" style={{ backgroundImage: 'url(/media/tiltyard.png)' }}>
        <div>
          <h2>Every knight is equal</h2>
          <p>Same horse, same lance, same armour. There are no stats to raise and nothing to unlock that hits harder. You win by reading the knight in front of you and holding your nerve longer than they do.</p>
          <p>Your shield cracks, your horse tires and your seat loosens from pass to pass. What you spend early, you ride without later.</p>
        </div>
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
        <p className="muted" style={{ marginTop: 20 }}>Unhorsing your opponent ends the match at once. Hitting the horse twice forfeits it.</p>
        <Link className="btn" to="/play">Ride against a bot now</Link>
      </section>
      <Footer />
    </>
  );
}

// Static pages: the rules, terms and privacy.
import { Link } from 'react-router-dom';

const Table = ({ head, rows }: { head: string[]; rows: string[][] }) => (
  <div className="scroll">
    <table>
      <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i} className={i ? 'muted' : ''}>{i ? c : <b>{c}</b>}</td>)}</tr>)}</tbody>
    </table>
  </div>
);

export function Rules() {
  return (
    <div className="prose">
      <h1>How to play</h1>
      <p>Two knights ride at each other along a barrier. Each ride is a pass. You score by where your lance lands, and you win at once if you knock your opponent off their horse.</p>

      <h2>The match</h2>
      <Table head={['Format', 'Passes']} rows={[['Blitz', '3'], ['Classic', '5'], ['Grand', '7']]} />
      <p>Most points after the last pass wins. A tie is settled by extra passes until someone leads. Both knights can score in the same pass.</p>

      <h2>Scoring</h2>
      <Table head={['Your lance lands on', 'Points', 'What else happens']} rows={[
        ['Nothing', '0', ''],
        ['Shield, glancing', '1', ''],
        ['Shield, solid', '1', 'Cracks the shield. Two solid hits break it for the rest of the match.'],
        ['Chest', '2', 'Loosens their seat for later passes.'],
        ['Helm', '3', 'Dazes them: their lance is slower to follow on the next pass.'],
        ['Their horse, or the barrier', '−2', 'A foul. A second foul loses the match.'],
      ]} />
      <p>Breaking your lance on a hard, clean hit adds one point.</p>

      <h2>What carries between passes</h2>
      <p>Your horse's stamina, your shield and your seat do not reset. A tired horse is slower, and a slower horse hits softer. A rider who has taken chest hits is easier to unhorse.</p>

      <h2>Before the charge: your riding plan</h2>
      <p>You have ten seconds, and your opponent cannot see your choice.</p>
      <Table head={['Plan', 'Gives you', 'Costs you']} rows={[
        ['Full charge', 'Top speed and the hardest hit', 'A shaking lance and a third of your stamina'],
        ['Steady canter', 'The calmest lance', 'Average force'],
        ['Braced seat', 'A seat that is very hard to break', 'Low speed, weak hit'],
        ['Feint approach', 'Your lance stays up until two seconds before impact', 'Almost no time to aim'],
        ['Tempo change', 'An uneven pace that throws off their timing', 'Stamina, and a wide sway'],
      ]} />

      <h2>During the charge</h2>
      <p>The charge lasts six seconds and you do everything by hand.</p>
      <Table head={['Control', 'Key', 'What it does']} rows={[
        ['Aim', 'Mouse', 'Moves the lance tip. Hold it on target too long and your arm tires.'],
        ['Spur', 'Space', 'Builds speed. Tap steadily; mashing makes the horse stumble.'],
        ['Shield', 'W / S', 'High covers the helm, mid covers the chest.'],
        ['Lean', 'A / D', 'In: more force, weaker seat. Away: harder to hit, worse aim.'],
        ['Rein line', 'Q / E', 'Tight to the barrier hits harder but risks a foul. Wide is safer and weaker.'],
      ]} />

      <h2>Skills</h2>
      <p>One skill per pass, and most can be used only once or twice in a match.</p>
      <Table head={['Skill', 'Key', 'Uses', 'What it does']} rows={[
        ['Couch late', '1', 'Once', 'Your lance is perfectly still for a moment.'],
        ['Slant guard', '2', 'Twice', 'Anything but a perfect chest strike glances off. Your helm is left open.'],
        ['Spur burst', '3', 'Once', 'Top speed at once.'],
        ['Second wind', '4', 'Once', 'You give up speed this pass to rest the horse and settle your seat.'],
        ['Visor up', 'V', 'Any pass', 'Steadier aim. Press V again to drop it before impact, or any helm hit unhorses you.'],
      ]} />

      <h2>At impact</h2>
      <p>One move, timed against the closing ring on your lance tip.</p>
      <Table head={['Move', 'Key', 'What it does']} rows={[
        ['Drive', 'J', 'More force and an easier lance break. Mistimed, your lance slips off.'],
        ['Lock stirrups', 'K', 'A much firmer seat.'],
        ['Duck', 'L', 'Dodges a helm strike. A chest strike becomes a harder helm hit.'],
        ['Swivel', 'U', 'Turns a body hit into a harmless glance. You score nothing this pass.'],
        ['Release', 'I', 'You drop the lance and take a third less force. You score nothing.'],
      ]} />

      <p><Link className="btn" to="/play">Ride against a bot</Link></p>
    </div>
  );
}

export function Terms() {
  return (
    <div className="prose">
      <h1>Terms of use</h1>
      <p className="muted">Draft. Have these reviewed before the game opens to the public.</p>
      <h2>Your account</h2>
      <p>You need to be old enough to hold an account under the law where you live. One person, one account. Keep your password to yourself; what happens on your account is your responsibility.</p>
      <h2>Fair play</h2>
      <p>Do not use scripts, bots or modified clients, do not play on someone else's account, and do not lose on purpose to move a rating. Accounts that do can be suspended or closed.</p>
      <h2>Conduct</h2>
      <p>Knight names and heraldry must not harass, impersonate or threaten anyone. We can rename or remove accounts that do.</p>
      <h2>The game</h2>
      <p>Riven is in development. Features, ratings and records can change or be reset, and the service can be unavailable. It is provided as it is, without a guarantee that it will always work.</p>
      <h2>Leaving</h2>
      <p>You can delete your account at any time from <Link to="/settings">Settings</Link>. Your profile, history and friends are removed with it.</p>
    </div>
  );
}

export function Privacy() {
  return (
    <div className="prose">
      <h1>Privacy</h1>
      <p className="muted">Draft. Have this reviewed before the game opens to the public.</p>
      <h2>What we store</h2>
      <p>Your email address and a protected form of your password, to log you in. Your knight name, country if you give one, heraldry, ratings, match history and friends list.</p>
      <h2>What other people can see</h2>
      <p>Your knight name, country, heraldry, ratings and match history are public. Your email address is never shown. Your friends list is visible only to you and the friends on it. While you are logged in, other players can see that you are online.</p>
      <h2>Where it is kept</h2>
      <p>Accounts and game data are stored with Supabase, our database provider. We do not sell your data or use it for advertising.</p>
      <h2>Deleting it</h2>
      <p>Deleting your account in <Link to="/settings">Settings</Link> removes your profile, history and friends at once.</p>
    </div>
  );
}

// Pages that change your own account: heraldry, settings, password reset.
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import emblem from '../../assets/brand/riven-emblem.jpg';
import { TINCTURES } from '../data/mock';
import { updateProfile, type Division } from '../lib/api';
import { supabase, useAuth } from '../lib/auth';
import { NeedsLogin, Shield } from '../ui';

const TINCTURE_NAMES = ['Blood', 'Sable', 'Steel', 'Gold', 'Azure', 'Vert', 'Bone', 'Purpure'];
const DIVISIONS: [Division, string][] = [['pale', 'Split down the middle'], ['fess', 'Split across'], ['bend', 'Split on the diagonal'], ['quarterly', 'Quartered']];

function Swatches({ label, value, onChange }: { label: string; value: string; onChange: (c: string) => void }) {
  return (
    <fieldset className="swatches">
      <legend>{label}</legend>
      {TINCTURES.map((c, i) => (
        <label key={c} title={TINCTURE_NAMES[i]}>
          <input type="radio" name={label} checked={value === c} onChange={() => onChange(c)} />
          <span style={{ background: c }} /><span className="sr">{TINCTURE_NAMES[i]}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function Armoury() {
  const { user, profile, refreshProfile } = useAuth();
  const [a, setA] = useState('#b3121b');
  const [b, setB] = useState('#1b1b1f');
  const [division, setDivision] = useState<Division>('pale');
  const [status, setStatus] = useState('');

  useEffect(() => { if (profile) { setA(profile.color_a); setB(profile.color_b); setDivision(profile.division); } }, [profile]);

  async function save() {
    const { error } = await updateProfile(user!.id, { color_a: a, color_b: b, division });
    setStatus(error ? `Not saved: ${error.message}` : 'Heraldry saved.');
    if (!error) refreshProfile();
  }

  return (
    <>
      <h1>Armoury</h1>
      <p className="muted">Looks only. Nothing here changes speed, force or balance: every knight rides with the same strength.</p>
      {!user ? <NeedsLogin what="to choose your heraldry" /> : (
        <div className="grid2">
          <div className="panel stack">
            <h2>Your shield</h2>
            <Swatches label="First colour" value={a} onChange={setA} />
            <Swatches label="Second colour" value={b} onChange={setB} />
            <fieldset className="choice">
              <legend>Division</legend>
              {DIVISIONS.map(([id, label]) => (
                <label key={id}><input type="radio" name="division" checked={division === id} onChange={() => setDivision(id)} /><b>{label}</b></label>
              ))}
            </fieldset>
            <div className="row">
              <button className="btn" onClick={save}>Save heraldry</button>
              {status && <span className={status.startsWith('Not') ? 'error' : 'ok'} role="status">{status}</span>}
            </div>
          </div>
          <div className="panel" style={{ textAlign: 'center' }}>
            <Shield colors={[a, b]} division={division} lg />
            <p className="muted" style={{ margin: '16px auto 0' }}>This shield stands beside your name on the leaderboard, in the lobby and in every match.</p>
          </div>
        </div>
      )}
      <div className="panel" style={{ marginTop: 24 }}>
        <h2>Still at the smith</h2>
        <p className="muted" style={{ marginBottom: 0 }}>Armour, helms, lances and horses arrive with the 3D arena. They will change how you look and nothing else.</p>
      </div>
    </>
  );
}

export function Settings() {
  const nav = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [country, setCountry] = useState('');
  const [status, setStatus] = useState<Record<string, string>>({});
  const say = (key: string, text: string) => setStatus((s) => ({ ...s, [key]: text }));

  useEffect(() => { setCountry(profile?.country ?? ''); }, [profile]);
  if (!user || !profile) return <><h1>Settings</h1><NeedsLogin what="to change your settings" /></>;

  let countryLabel = '';
  try { countryLabel = country.length === 2 ? new Intl.DisplayNames(['en'], { type: 'region' }).of(country) ?? '' : ''; } catch { /* not a region code */ }

  async function saveCountry(e: FormEvent) {
    e.preventDefault();
    const { error } = await updateProfile(user!.id, { country: country || null });
    say('country', error ? 'Not saved. Use a two-letter country code, such as KG or US.' : 'Country saved.');
    if (!error) refreshProfile();
  }

  async function savePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const { error } = await supabase.auth.updateUser({ password: String(new FormData(form).get('password')) });
    say('password', error ? `Not changed: ${error.message}` : 'Password changed.');
    if (!error) form.reset();
  }

  async function deleteAccount(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (String(new FormData(e.currentTarget).get('confirm')) !== profile!.username) return say('delete', 'Type your knight name exactly to confirm.');
    const { error } = await supabase.rpc('delete_my_account');
    if (error) return say('delete', `Not deleted: ${error.message}`);
    await supabase.auth.signOut();
    nav('/');
  }

  return (
    <div className="prose">
      <h1>Settings</h1>
      <p className="muted">Logged in as {profile.username} ({user.email}). Your knight name cannot be changed.</p>

      <form className="panel stack" onSubmit={saveCountry}>
        <h2>Country</h2>
        <label className="field">Two-letter country code
          <input type="text" value={country} maxLength={2} pattern="[A-Z]{2}" placeholder="KG"
            onChange={(e) => setCountry(e.target.value.toUpperCase())} style={{ maxWidth: 120 }} />
          <small>{countryLabel || 'Shown on your profile and the leaderboard. Leave empty to hide it.'}</small>
        </label>
        <div className="row"><button className="ghost">Save country</button>{status.country && <span role="status" className="muted">{status.country}</span>}</div>
      </form>

      <form className="panel stack" onSubmit={savePassword}>
        <h2>Password</h2>
        <label className="field">New password
          <input name="password" type="password" required minLength={8} autoComplete="new-password" />
          <small>At least 8 characters.</small>
        </label>
        <div className="row"><button className="ghost">Change password</button>{status.password && <span role="status" className="muted">{status.password}</span>}</div>
      </form>

      <form className="panel stack" onSubmit={deleteAccount}>
        <h2>Delete account</h2>
        <p className="muted">This removes your profile, match history and friends at once. It cannot be undone.</p>
        <label className="field">Type {profile.username} to confirm
          <input name="confirm" type="text" required autoComplete="off" />
        </label>
        <div className="row"><button className="btn">Delete my account</button>{status.delete && <span role="alert" className="error">{status.delete}</span>}</div>
      </form>
    </div>
  );
}

/** Ask for a reset email. */
export function Forgot() {
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get('email'));
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/reset` });
    setError(error?.message ?? '');
    if (!error) setNotice('If that email has an account, a reset link is on its way.');
  }
  return (
    <div className="auth">
      <form onSubmit={submit}>
        <Link to="/" style={{ display: 'grid' }}><img src={emblem} alt="Riven home" /></Link>
        <h1 style={{ textAlign: 'center' }}>Reset password</h1>
        <label className="field">Email<input name="email" type="email" required autoComplete="email" /></label>
        {error && <p className="error" role="alert">{error}</p>}
        {notice && <p className="ok" role="status">{notice}</p>}
        <button className="btn">Send reset link</button>
        <p className="muted" style={{ textAlign: 'center' }}><Link to="/login">Back to log in</Link></p>
      </form>
    </div>
  );
}

/** Reached from the reset email: the link has already logged the knight in. */
export function Reset() {
  const nav = useNavigate();
  const { user, ready } = useAuth();
  const [error, setError] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: String(new FormData(e.currentTarget).get('password')) });
    if (error) return setError(error.message);
    nav('/play');
  }
  return (
    <div className="auth">
      <form onSubmit={submit}>
        <Link to="/" style={{ display: 'grid' }}><img src={emblem} alt="Riven home" /></Link>
        <h1 style={{ textAlign: 'center' }}>Choose a new password</h1>
        {ready && !user ? (
          <p className="error" role="alert">This reset link is no longer valid. <Link to="/forgot">Send a new one</Link>.</p>
        ) : (
          <>
            <label className="field">New password
              <input name="password" type="password" required minLength={8} autoComplete="new-password" />
              <small>At least 8 characters.</small>
            </label>
            {error && <p className="error" role="alert">{error}</p>}
            <button className="btn">Save password</button>
          </>
        )}
      </form>
    </div>
  );
}

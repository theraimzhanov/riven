import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import emblem from '../../assets/brand/riven-emblem.jpg';
import { supabase } from '../lib/auth';

export default function Auth({ mode }: { mode: 'login' | 'register' }) {
  const nav = useNavigate();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const register = mode === 'register';

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email')), password = String(f.get('password')), username = String(f.get('username') ?? '');
    setError(''); setNotice(''); setBusy(true);

    if (register) {
      const taken = await supabase.from('profiles').select('id').eq('username', username).maybeSingle();
      if (taken.data) { setBusy(false); return setError('That name is taken. Choose another.'); }
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
      setBusy(false);
      if (error) return setError(error.message);
      if (data.session) return nav('/play');
      return setNotice('Account created. Open the link in the email we sent, then log in.');
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setError(error.message);
    nav('/play');
  }

  return (
    <div className="auth">
      <form onSubmit={submit}>
        <Link to="/" style={{ display: 'grid' }}><img src={emblem} alt="Riven home" /></Link>
        <h1 style={{ textAlign: 'center' }}>{register ? 'Create account' : 'Log in'}</h1>
        {register && (
          <label className="field">Knight name
            <input name="username" type="text" required pattern="[A-Za-z0-9_]{3,20}" autoComplete="username"
              title="3 to 20 letters, numbers or underscores" />
            <small>3 to 20 letters, numbers or underscores. Shown on the leaderboard.</small>
          </label>
        )}
        <label className="field">Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label className="field">Password
          <input name="password" type="password" required minLength={8} autoComplete={register ? 'new-password' : 'current-password'} />
          {register && <small>At least 8 characters.</small>}
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        {notice && <p className="ok" role="status">{notice}</p>}
        <button className="btn" disabled={busy}>{register ? 'Create account' : 'Log in'}</button>
        <p className="muted" style={{ textAlign: 'center' }}>
          {register ? <>Already have an account? <Link to="/login">Log in</Link></>
            : <>New here? <Link to="/register">Create account</Link>. <Link to="/forgot">Forgot your password?</Link></>}
        </p>
      </form>
    </div>
  );
}

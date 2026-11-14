import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, NavLink, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, supabase, useAuth } from './lib/auth';
import emblem from '../assets/brand/riven-emblem.jpg';
import Landing from './pages/Landing';
import Lobby from './pages/Lobby';
import Match from './pages/Match';
import Auth from './pages/Auth';
import { Armoury, Drills, KnightPage, Leaderboard, TournamentPage, Tournaments } from './pages/Platform';
import './styles.css';

const NAV = [['/play', 'Play'], ['/drills', 'Drills'], ['/tournaments', 'Tournaments'], ['/leaderboard', 'Leaderboard'], ['/armoury', 'Armoury']];

function Shell() {
  const { user, username } = useAuth();
  return (
    <div className="shell">
      <nav className="side" aria-label="Main">
        <Link to="/" className="brand"><img src={emblem} alt="" />Riven</Link>
        {NAV.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
        <div className="side-foot">
          {user ? (
            <>
              <Link to={`/knight/${username}`}>{username}</Link>
              <button className="link" onClick={() => supabase.auth.signOut()}>Log out</button>
            </>
          ) : (
            <>
              <Link className="btn small" to="/register">Create account</Link>
              <Link to="/login">Log in</Link>
            </>
          )}
          <p className="demo-note">Demo data: knights, ratings and results are placeholders.</p>
        </div>
      </nav>
      <main><Outlet /></main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        <Route element={<Shell />}>
          <Route path="/play" element={<Lobby />} />
          <Route path="/match" element={<Match />} />
          <Route path="/drills" element={<Drills />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/tournaments/:id" element={<TournamentPage />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/armoury" element={<Armoury />} />
          <Route path="/knight/:name" element={<KnightPage />} />
          <Route path="*" element={<><h1>Nothing here</h1><p>This page does not exist. <Link to="/play">Go to the lobby</Link>.</p></>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </AuthProvider>,
);

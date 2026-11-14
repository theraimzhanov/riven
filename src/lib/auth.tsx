import type { User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getProfileById, type Profile } from './api';
import { supabase } from './supabase';

export { supabase };

interface Auth {
  user: User | null;
  ready: boolean; // false until the saved session has been read
  username: string | null;
  profile: Profile | null;
  refreshProfile: () => void;
  online: Set<string>; // knight names currently on the site
}
const Ctx = createContext<Auth>({ user: null, ready: false, username: null, profile: null, refreshProfile: () => {}, online: new Set() });
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [online, setOnline] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  const id = user?.id;
  const refreshProfile = useCallback(() => {
    if (id) getProfileById(id).then(setProfile); else setProfile(null);
  }, [id]);
  useEffect(refreshProfile, [refreshProfile]);

  const username = profile?.username ?? null;
  useEffect(() => { // presence: who is on the site right now
    if (!username) return;
    const ch = supabase.channel('online', { config: { presence: { key: username } } });
    ch.on('presence', { event: 'sync' }, () => setOnline(new Set(Object.keys(ch.presenceState()))))
      .subscribe((status) => { if (status === 'SUBSCRIBED') ch.track({}); });
    return () => { supabase.removeChannel(ch); setOnline(new Set()); };
  }, [username]);

  return <Ctx.Provider value={{ user, ready, username, profile, refreshProfile, online }}>{children}</Ctx.Provider>;
}

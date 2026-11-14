import { createClient, type User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// Publishable key: safe in the browser. Row-level security protects the data.
export const supabase = createClient(
  'https://hgtodegbjjmxiytnpwcv.supabase.co',
  'sb_publishable_MrMu_cSSYo6P3Kh14qpHeA_Wx2qvi7H',
);

const Ctx = createContext<{ user: User | null; username: string | null }>({ user: null, username: null });
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  const username = (user?.user_metadata?.username as string | undefined) ?? null;
  return <Ctx.Provider value={{ user, username }}>{children}</Ctx.Provider>;
}

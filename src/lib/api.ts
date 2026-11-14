// Everything the site reads from or writes to Supabase.
import { useCallback, useEffect, useState } from 'react';
import type { Format } from '../data/mock';
import { supabase } from './supabase';

export type Division = 'pale' | 'fess' | 'bend' | 'quarterly';
export interface Profile {
  id: string; username: string; country: string | null;
  color_a: string; color_b: string; division: Division;
  rating_blitz: number; rating_classic: number; rating_grand: number; created_at: string;
}
export interface MatchRow {
  id: number; opponent: string; format: Format; won: boolean;
  score_for: number; score_against: number; ended_by: string; created_at: string;
}
export interface Friend { profile: Profile; status: 'pending' | 'accepted'; incoming: boolean }

export const ratingOf = (p: Profile, f: Format) => p[`rating_${f}`];
export const asKnight = (p: Profile) => ({ name: p.username, colors: [p.color_a, p.color_b] as [string, string], division: p.division });

export const getProfileById = async (id: string) =>
  (await supabase.from('profiles').select('*').eq('id', id).maybeSingle()).data as Profile | null;
export const getProfile = async (username: string) =>
  (await supabase.from('profiles').select('*').eq('username', username).maybeSingle()).data as Profile | null;

export const topKnights = async (format: Format) =>
  ((await supabase.from('profiles').select('*').order(`rating_${format}`, { ascending: false }).order('created_at').limit(100)).data ?? []) as Profile[];

export const matchesOf = async (player: string, limit = 10) =>
  ((await supabase.from('matches').select('*').eq('player', player).order('created_at', { ascending: false }).limit(limit)).data ?? []) as MatchRow[];

export async function recordOf(player: string) {
  const count = async (won: boolean) =>
    (await supabase.from('matches').select('id', { count: 'exact', head: true }).eq('player', player).eq('won', won)).count ?? 0;
  const [wins, losses] = await Promise.all([count(true), count(false)]);
  return { wins, losses };
}

export const saveMatch = (m: Omit<MatchRow, 'id' | 'created_at'>) => supabase.from('matches').insert(m);

export const updateProfile = (id: string, patch: Partial<Pick<Profile, 'country' | 'color_a' | 'color_b' | 'division'>>) =>
  supabase.from('profiles').update(patch).eq('id', id);

const FRIEND_COLUMNS = 'status, requester:profiles!friendships_requester_fkey(*), addressee:profiles!friendships_addressee_fkey(*)';
export async function listFriends(me: string): Promise<Friend[]> {
  const { data } = await supabase.from('friendships').select(FRIEND_COLUMNS);
  return ((data ?? []) as unknown as { status: Friend['status']; requester: Profile; addressee: Profile }[]).map((f) => {
    const incoming = f.addressee.id === me;
    return { profile: incoming ? f.requester : f.addressee, status: f.status, incoming };
  });
}

/** Returns an error message, or null when the request was sent. */
export async function addFriend(me: string, username: string): Promise<string | null> {
  const other = await getProfile(username.trim());
  if (!other) return 'No knight has that name.';
  if (other.id === me) return 'That is you.';
  const { error } = await supabase.from('friendships').insert({ addressee: other.id });
  if (!error) return null;
  return error.code === '23505' ? 'You already sent that knight a request.' : error.message;
}
export const acceptFriend = (me: string, requester: string) =>
  supabase.from('friendships').update({ status: 'accepted' }).eq('requester', requester).eq('addressee', me);
export const removeFriend = (me: string, other: string) =>
  supabase.from('friendships').delete().or(`and(requester.eq.${me},addressee.eq.${other}),and(requester.eq.${other},addressee.eq.${me})`);

/** Load something from the database; `reload` fetches it again. */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data: T | null; loading: boolean }>({ data: null, loading: true });
  const reload = useCallback(() => { load().then((data) => setState({ data, loading: false })); }, deps);
  useEffect(() => { setState((s) => ({ ...s, loading: true })); reload(); }, [reload]);
  return { ...state, reload };
}

import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';

export interface KnightLook { name: string; colors: [string, string]; division?: string }

const FIELD: Record<string, (a: string, b: string) => string> = {
  pale: (a, b) => `linear-gradient(90deg, ${a} 50%, ${b} 50%)`,
  fess: (a, b) => `linear-gradient(180deg, ${a} 50%, ${b} 50%)`,
  bend: (a, b) => `linear-gradient(135deg, ${a} 50%, ${b} 50%)`,
  quarterly: (a, b) => `conic-gradient(${b} 0 25%, ${a} 0 50%, ${b} 0 75%, ${a} 0)`,
};

export const Shield = ({ colors, division = 'pale', lg }: { colors: [string, string]; division?: string; lg?: boolean }) => (
  <span className={lg ? 'shield lg' : 'shield'} aria-hidden="true"
    style={{ background: (FIELD[division] ?? FIELD.pale)(colors[0], colors[1]) } as CSSProperties} />
);

export const KnightCell = ({ k, sub, link = true }: { k: KnightLook; sub?: ReactNode; link?: boolean }) => (
  <span className="knight">
    <Shield colors={k.colors} division={k.division} />
    <span className="who">
      {link ? <Link to={`/knight/${k.name}`}>{k.name}</Link> : <b>{k.name}</b>}
      {sub && <small>{sub}</small>}
    </span>
  </span>
);

export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="tabs" role="tablist">
      {options.map(([id, label]) => (
        <button key={id} role="tab" aria-selected={value === id} onClick={() => onChange(id)}>{label}</button>
      ))}
    </div>
  );
}

/** Shown where a page needs an account. */
export const NeedsLogin = ({ what }: { what: string }) => (
  <div className="panel">
    <h2>Log in {what}</h2>
    <p className="muted">Riding against the bots needs no account. An account keeps your name, heraldry, history and friends.</p>
    <div className="row"><Link className="btn" to="/register">Create account</Link><Link className="ghost" to="/login">Log in</Link></div>
  </div>
);

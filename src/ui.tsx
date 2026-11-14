import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { leagueOf, type Knight } from './data/mock';

export const Shield = ({ colors, lg }: { colors: [string, string]; lg?: boolean }) => (
  <span className={lg ? 'shield lg' : 'shield'} style={{ '--a': colors[0], '--b': colors[1] } as CSSProperties} aria-hidden="true" />
);

export const KnightCell = ({ k, rating, link = true }: { k: Knight; rating: number; link?: boolean }) => (
  <span className="knight">
    <Shield colors={k.colors} />
    <span className="who">
      {link ? <Link to={`/knight/${k.name}`}>{k.name}</Link> : <b>{k.name}</b>}
      <small>{leagueOf(rating)} <span className="num">{rating}</span></small>
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

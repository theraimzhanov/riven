// The live pass: six seconds where the player aims the lance, spurs, guards, uses a skill and commits a final move.
// 2D stand-in for the 3D arena. It produces the same PassInput the arena will, so the rules do not change later.
import { useEffect, useRef } from 'react';
import { skillAllowed, speedCap, zoneAt, type Final, type KnightState, type PassInput, type Plan, type Skill } from '../rules/resolvePass';

export const CHARGE_SECONDS = 6;
const WINDOW = 0.6; // seconds before impact in which a final move counts
const SWAY: Record<Plan, number> = { charge: 0.2, steady: 0.06, braced: 0.06, feint: 0.12, tempo: 0.15 };
const SKILL_KEYS: Record<string, Skill> = { Digit1: 'couchLate', Digit2: 'slantGuard', Digit3: 'spurBurst', Digit4: 'secondWind', KeyV: 'visorLate' };
const FINAL_KEYS: Record<string, Final> = { KeyJ: 'drive', KeyK: 'lock', KeyL: 'duck', KeyU: 'swivel', KeyI: 'release' };
const NAMES: Record<string, string> = {
  none: 'none', couchLate: 'Couch late', slantGuard: 'Slant guard', spurBurst: 'Spur burst', secondWind: 'Second wind', visorLate: 'Visor up',
  drive: 'Drive', lock: 'Lock stirrups', duck: 'Duck', swivel: 'Swivel', release: 'Release',
};

interface Props {
  plan: Plan;
  me: KnightState;
  foe: PassInput; // what the opponent is doing this pass; only the visible parts are drawn
  foeState: KnightState;
  foeColors: [string, string];
  onDone: (input: PassInput) => void;
}

export function Charge({ plan, me, foe, foeState, foeColors, onDone }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const g = cv.getContext('2d')!;
    let t = 0, last = performance.now(), raf = 0, finished = false;
    let speed = 0, lastSpur = -9, stumbleUntil = -9, couchUntil = -9, onTarget = 0;
    let skill: Skill = 'none', final: Final = 'none', timing = 0, visorUp = false, lanceUp = false;
    let shield: PassInput['shield'] = 'mid', lean: PassInput['lean'] = 'none', rein: PassInput['rein'] = 'mid';
    const mouse = { x: 0, y: 0.4 }, hand = { x: 0, y: 0.4 }, aim = { x: 0, y: 0.4 };
    const view = { cx: 0, cy: 0, unit: 1 };

    const cap = () => speedCap({ plan, skill }, me);

    function key(e: KeyboardEvent) {
      if (e.repeat) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (skill === 'secondWind') return;
        if (t - lastSpur < 0.18) stumbleUntil = t + 0.45; // mashing off the beat: the horse stumbles
        else speed = Math.min(cap(), speed + 0.13);
        lastSpur = t;
      }
      if (e.code === 'KeyW') shield = 'high';
      if (e.code === 'KeyS') shield = 'mid';
      if (e.code === 'KeyA') lean = lean === 'in' ? 'none' : 'in';
      if (e.code === 'KeyD') lean = lean === 'away' ? 'none' : 'away';
      if (e.code === 'KeyQ') rein = rein === 'tight' ? 'mid' : 'tight';
      if (e.code === 'KeyE') rein = rein === 'wide' ? 'mid' : 'wide';

      const s = SKILL_KEYS[e.code];
      if (s === 'visorLate' && skill === 'visorLate') visorUp = false; // second press drops the visor
      else if (s && skill === 'none' && skillAllowed(s, me)) { // one skill per pass
        skill = s;
        if (s === 'couchLate') couchUntil = t + 0.8;
        if (s === 'spurBurst') speed = cap();
        if (s === 'secondWind') speed = Math.min(speed, cap());
        if (s === 'visorLate') visorUp = true;
      }
      const f = FINAL_KEYS[e.code];
      if (f && final === 'none') { final = f; timing = Math.max(0, 1 - (CHARGE_SECONDS - t) / WINDOW); }
    }

    function move(e: PointerEvent) {
      const r = cv.getBoundingClientRect();
      const k = cv.width / r.width;
      mouse.x = ((e.clientX - r.left) * k - view.cx) / view.unit;
      mouse.y = (view.cy - (e.clientY - r.top) * k) / view.unit;
    }

    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;
      speed = Math.max(0, speed - 0.12 * dt);

      // the hand follows the mouse; a dazed rider is slower
      const follow = 1 - Math.exp(-dt * (me.dazed ? 5 : 18));
      hand.x += (mouse.x - hand.x) * follow;
      hand.y += (mouse.y - hand.y) * follow;

      lanceUp = plan === 'feint' && t < CHARGE_SECONDS - 2;
      const steady = t < couchUntil ? 0 : visorUp ? 0.6 : 1;
      const sway = SWAY[plan] * (0.4 + speed) * steady;
      if (zoneAt(aim)[0] === 'helm' || zoneAt(aim)[0] === 'chest') onTarget += dt;
      const dip = Math.max(0, onTarget - 3) * 0.15; // arm fatigue
      aim.x = lanceUp ? 0.5 : hand.x + sway * Math.sin(t * 7);
      aim.y = lanceUp ? 1.5 : hand.y + sway * Math.sin(t * 9 + 1) - dip + (t < stumbleUntil ? 0.3 : 0);

      draw();
      if (t >= CHARGE_SECONDS && !finished) {
        finished = true;
        onDone({ plan, skill, speed, aim: { ...aim }, shield, lean, rein, final, timing, visorDown: !visorUp });
        return;
      }
      raf = requestAnimationFrame(frame);
    }

    function draw() {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      if (cv.width !== Math.round(r.width * dpr)) { cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); }
      const w = cv.width, h = cv.height, k = Math.min(t / CHARGE_SECONDS, 1);
      view.cx = w / 2; view.cy = h * 0.66; view.unit = h * 0.4 * (0.4 + 0.6 * k * k); // the opponent grows as they close
      const X = (x: number) => view.cx + x * view.unit, Y = (y: number) => view.cy - y * view.unit, U = view.unit;

      const sky = g.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0c0b0d'); sky.addColorStop(0.62, '#1a171b'); sky.addColorStop(0.63, '#1d1512'); sky.addColorStop(1, '#0d0a09');
      g.fillStyle = sky; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#2a211c'; g.lineWidth = 2; // ground streaks rush past with speed
      for (let i = 0; i < 7; i++) {
        const p = ((i / 7 + t * (0.25 + speed)) % 1) ** 2;
        g.beginPath(); g.moveTo(0, h * 0.64 + p * h * 0.36); g.lineTo(w, h * 0.64 + p * h * 0.36); g.stroke();
      }
      g.fillStyle = '#3a2c20'; // the tilt barrier, on the left
      g.beginPath(); g.moveTo(0, h); g.lineTo(w * 0.2, h); g.lineTo(X(-0.55), Y(-0.1)); g.lineTo(X(-0.7), Y(-0.1)); g.closePath(); g.fill();

      // opponent: horse, rider, helm
      g.fillStyle = '#241a13'; g.fillRect(X(-0.4), Y(0), 0.8 * U, 0.6 * U);
      g.fillStyle = '#15110f'; g.fillRect(X(-0.18), Y(0.15), 0.36 * U, 0.3 * U); // horse head
      g.fillStyle = '#5d6168'; g.fillRect(X(-0.25), Y(0.6), 0.5 * U, 0.4 * U);
      g.fillStyle = '#9a9ea6'; g.beginPath(); g.arc(X(0), Y(0.8), 0.15 * U, 0, 7); g.fill();
      g.fillStyle = '#0a0908'; g.fillRect(X(-0.11), Y(0.83), 0.22 * U, 0.035 * U); // visor slit
      if (foeState.shieldHp > 0) { // their guard is readable: high covers the helm, mid the chest, slanted leaves the helm open
        g.save();
        g.translate(X(0), Y(foe.shield === 'high' && foe.skill !== 'slantGuard' ? 0.8 : 0.4));
        if (foe.skill === 'slantGuard') g.rotate(-Math.PI / 4);
        g.globalAlpha = 0.85;
        g.fillStyle = foeColors[0]; g.fillRect(-0.22 * U, -0.2 * U, 0.22 * U, 0.4 * U);
        g.fillStyle = foeColors[1]; g.fillRect(0, -0.2 * U, 0.22 * U, 0.4 * U);
        g.restore();
      }
      g.strokeStyle = '#d8d3c8'; g.lineWidth = Math.max(2, 0.03 * U); // their lance, coming at you
      g.beginPath(); g.moveTo(X(0.3), Y(0.45)); g.lineTo(X(0.55), Y(0.2 - 0.5 * k)); g.stroke();

      // your lance and its tip
      const zone = zoneAt(aim, foe.rein === 'wide')[0];
      const tipColor = zone === 'helm' ? '#ff4a2b' : zone === 'chest' ? '#e6e1d8' : zone === 'foul' ? '#e0a020' : '#6b6e75';
      g.strokeStyle = '#cfc9bd'; g.lineWidth = Math.max(4, w * 0.008);
      g.beginPath(); g.moveTo(w * 0.86, h * 1.02); g.lineTo(X(aim.x), Y(aim.y)); g.stroke();
      g.strokeStyle = tipColor; g.lineWidth = 3;
      g.beginPath(); g.arc(X(aim.x), Y(aim.y), h * 0.022, 0, 7); g.stroke();
      const toImpact = CHARGE_SECONDS - t;
      if (toImpact < 1.5 && final === 'none') { // closing ring: commit when it meets the tip
        g.strokeStyle = toImpact < WINDOW * 0.4 ? '#ff4a2b' : '#9a9ea6'; g.lineWidth = 2;
        g.beginPath(); g.arc(X(aim.x), Y(aim.y), h * (0.022 + 0.12 * (toImpact / 1.5)), 0, 7); g.stroke();
      }

      // readout
      const f = Math.round(h * 0.042);
      g.font = `600 ${f}px "Barlow Condensed", sans-serif`; g.fillStyle = '#e6e1d8'; g.textBaseline = 'top';
      g.fillText(`Impact in ${Math.max(0, toImpact).toFixed(1)}s`, f * 0.6, f * 0.5);
      g.fillStyle = '#302f36'; g.fillRect(f * 0.6, f * 1.9, f * 6, f * 0.4);
      g.fillStyle = '#b3121b'; g.fillRect(f * 0.6, f * 1.9, f * 6 * speed, f * 0.4);
      g.fillStyle = '#9a9ea6'; g.font = `500 ${Math.round(f * 0.78)}px "Barlow", sans-serif`;
      const lines = [
        `Shield ${shield}   Lean ${lean}   Rein ${rein}`,
        `Skill: ${NAMES[skill]}${skill === 'visorLate' && !visorUp ? ' (visor dropped)' : ''}   Final: ${NAMES[final]}`,
        lanceUp ? 'Feint: lance held up' : t < stumbleUntil ? 'Stumble!' : onTarget > 3 ? 'Arm tiring' : me.dazed ? 'Dazed' : '',
      ];
      lines.forEach((s, i) => g.fillText(s, f * 0.6, f * (2.7 + i * 1.05)));
    }

    addEventListener('keydown', key);
    cv.addEventListener('pointermove', move);
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); removeEventListener('keydown', key); cv.removeEventListener('pointermove', move); };
  }, []);

  return <canvas ref={ref} className="charge" aria-label="Live charge. Aim the lance with the mouse and use the keys listed beside the arena." />;
}

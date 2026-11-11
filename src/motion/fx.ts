// Shared "juice" layer for the whole app: particle bursts, squishy button
// presses and tiny feedback sounds. Everything draws on ONE fixed canvas
// (no DOM nodes per particle) and the animation loop only runs while there
// is something on screen, so it costs nothing when idle. No dependencies.
import { playCorrectChime, playOopsBoop, playTapPop } from '../utils/sfx';

export type BurstKind = 'stars' | 'confetti' | 'sparkle' | 'hearts';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  spin: number;
  life: number;
  maxLife: number;
  color: string;
  shape: 'star' | 'rect' | 'dot' | 'heart';
  gravity: number;
}

const COLORS = ['#ff6fa5', '#ffb703', '#2fa4e7', '#4caf50', '#9b6bdf', '#ffd84a'];
const STAR_COLORS = ['#ffd84a', '#ffb703', '#fff3b0'];
const HEART_COLORS = ['#ff6fa5', '#ff8fc0', '#ff4d8d'];
const MAX_PARTICLES = 220;

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let rafId = 0;
let lastTime = 0;
let dpr = 1;
let soundOn = true;
let installed = false;

const reducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const resize = () => {
  if (!canvas) return;
  // Capped at 2x: a 3x phone canvas is 2.25x the pixels for no visible gain
  // on fast-moving particles.
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
};

const ensureCanvas = (): boolean => {
  if (typeof document === 'undefined') return false;
  if (canvas && ctx) return true;
  canvas = document.createElement('canvas');
  canvas.className = 'fx-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
  return ctx !== null;
};

const drawStar = (c: CanvasRenderingContext2D, r: number) => {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    c.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
  }
  c.closePath();
  c.fill();
};

const drawHeart = (c: CanvasRenderingContext2D, r: number) => {
  c.beginPath();
  c.moveTo(0, r * 0.9);
  c.bezierCurveTo(-r * 1.4, -r * 0.2, -r * 0.6, -r * 1.1, 0, -r * 0.35);
  c.bezierCurveTo(r * 0.6, -r * 1.1, r * 1.4, -r * 0.2, 0, r * 0.9);
  c.fill();
};

const tick = (now: number) => {
  if (!canvas || !ctx) return;
  // Clamp dt so a backgrounded tab doesn't fling everything off screen.
  const dt = Math.min((now - lastTime) / 1000, 0.034);
  lastTime = now;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  const alive: Particle[] = [];
  for (const p of particles) {
    p.life += dt;
    if (p.life >= p.maxLife) continue;
    p.vy += p.gravity * dt;
    const drag = 1 - 1.6 * dt;
    p.vx *= drag;
    p.vy *= drag;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.spin * dt;
    if (p.y > window.innerHeight + 40) continue;
    alive.push(p);

    const t = p.life / p.maxLife;
    // Pop in fast, hold, then shrink + fade over the last 40%.
    const scaleIn = Math.min(1, p.life / 0.08);
    const fade = t > 0.6 ? 1 - (t - 0.6) / 0.4 : 1;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    const s = p.size * scaleIn * (0.6 + 0.4 * fade);
    if (p.shape === 'star') drawStar(ctx, s);
    else if (p.shape === 'heart') drawHeart(ctx, s);
    else if (p.shape === 'rect') ctx.fillRect(-s * 0.5, -s * 0.8, s, s * 1.6);
    else {
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  particles = alive;

  if (particles.length > 0) {
    rafId = requestAnimationFrame(tick);
  } else {
    rafId = 0;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
};

const start = () => {
  if (rafId) return;
  lastTime = performance.now();
  rafId = requestAnimationFrame(tick);
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

interface BurstOptions {
  count?: number;
  /** Multiplies launch speed (1 = default). */
  power?: number;
}

/** Fires a particle burst at viewport coordinates (x, y). */
export const burst = (x: number, y: number, kind: BurstKind = 'stars', options: BurstOptions = {}): void => {
  if (reducedMotion() || !ensureCanvas()) return;
  const power = options.power ?? 1;
  const defaults: Record<BurstKind, number> = { stars: 14, confetti: 28, sparkle: 5, hearts: 8 };
  const count = options.count ?? defaults[kind];

  for (let i = 0; i < count; i++) {
    if (particles.length >= MAX_PARTICLES) break;
    const angle = kind === 'confetti' ? rand(-Math.PI * 0.95, -Math.PI * 0.05) : rand(0, Math.PI * 2);
    const speed =
      (kind === 'sparkle' ? rand(60, 150) : kind === 'confetti' ? rand(260, 620) : rand(140, 380)) * power;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (kind === 'hearts' ? 120 : kind === 'stars' ? 80 : 0),
      size: kind === 'sparkle' ? rand(3, 6) : kind === 'confetti' ? rand(5, 9) : rand(6, 12),
      rot: rand(0, Math.PI * 2),
      spin: rand(-8, 8),
      life: 0,
      maxLife: kind === 'sparkle' ? rand(0.3, 0.5) : kind === 'confetti' ? rand(1.2, 2) : rand(0.6, 1),
      color: kind === 'stars' ? pick(STAR_COLORS) : kind === 'hearts' ? pick(HEART_COLORS) : pick(COLORS),
      shape:
        kind === 'stars'
          ? i % 4 === 3
            ? 'dot'
            : 'star'
          : kind === 'hearts'
            ? 'heart'
            : kind === 'confetti'
              ? i % 5 === 0
                ? 'dot'
                : 'rect'
              : 'dot',
      gravity: kind === 'confetti' ? 900 : kind === 'hearts' ? -60 : kind === 'sparkle' ? 0 : 520,
    });
  }
  start();
};

/** Fires a burst from the centre of an element. */
export const burstFrom = (el: Element | null, kind: BurstKind = 'stars', options?: BurstOptions): void => {
  if (!el) return;
  const r = el.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, kind, options);
};

/** Big end-of-level celebration: two confetti cannons from the bottom corners. */
export const celebrate = (big = false): void => {
  if (reducedMotion()) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const fire = () => {
    burst(w * 0.12, h * 0.72, 'confetti', { count: big ? 34 : 24, power: 1.25 });
    burst(w * 0.88, h * 0.72, 'confetti', { count: big ? 34 : 24, power: 1.25 });
  };
  fire();
  if (big) {
    window.setTimeout(() => burst(w * 0.5, h * 0.35, 'stars', { count: 22, power: 1.3 }), 320);
    window.setTimeout(fire, 650);
  }
};

/** Mirrors the app's sound setting so feedback sounds respect the mute button. */
export const setFxSound = (on: boolean): void => {
  soundOn = on;
};

/** One call for "that was right": stars from the element + a rising chime. */
export const cheerAt = (el: Element | null): void => {
  burstFrom(el, 'stars');
  if (soundOn) playCorrectChime();
};

/** One call for "not quite": a soft, non-scary boop. No red flash, no buzzer. */
export const oops = (): void => {
  if (soundOn) playOopsBoop();
};

const PRESS_SELECTOR = 'button, [role="button"], .fx-press';

const pressTarget = (event: Event): HTMLElement | null => {
  const target = event.target;
  if (!(target instanceof Element)) return null;
  const el = target.closest(PRESS_SELECTOR);
  if (!(el instanceof HTMLElement)) return null;
  if (el instanceof HTMLButtonElement && el.disabled) return null;
  if (el.dataset.fx === 'off') return null;
  return el;
};

// Uses the standalone `scale` property (not `transform`) through the Web
// Animations API, so it layers on top of whatever transform/animation a
// button already has in its own CSS instead of fighting it.
const pressAnims = new WeakMap<HTMLElement, Animation>();

const squish = (el: HTMLElement) => {
  if (typeof el.animate !== 'function') return;
  pressAnims.get(el)?.cancel();
  pressAnims.set(
    el,
    el.animate([{ scale: '1' }, { scale: '0.93' }], { duration: 90, easing: 'ease-out', fill: 'forwards' }),
  );
};

const release = (el: HTMLElement) => {
  if (typeof el.animate !== 'function') return;
  // The bounce-back starts from the squished size, so the held (forwards
  // filled) press animation can be dropped straight away without a jump.
  el.animate(
    [{ scale: '0.93' }, { scale: '1.06', offset: 0.4 }, { scale: '0.985', offset: 0.7 }, { scale: '1' }],
    { duration: 380, easing: 'ease-out' },
  );
  pressAnims.get(el)?.cancel();
  pressAnims.delete(el);
};

/**
 * Installs the global press feedback (squish + bounce-back, a few sparkles
 * and a soft pop) for every button in the app, including the adventure
 * worlds. Call once at startup. Safe to call more than once.
 */
export const initMotion = (): void => {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  let pressed: HTMLElement | null = null;

  document.addEventListener(
    'pointerdown',
    (event) => {
      const el = pressTarget(event);
      if (!el) return;
      pressed = el;
      if (reducedMotion()) return;
      squish(el);
    },
    { passive: true },
  );

  const end = (event: PointerEvent) => {
    const el = pressed;
    pressed = null;
    if (!el) return;
    if (!reducedMotion()) release(el);
    if (event.type === 'pointerup') {
      burst(event.clientX, event.clientY, 'sparkle');
      if (soundOn) playTapPop();
    }
  };
  document.addEventListener('pointerup', end, { passive: true });
  document.addEventListener('pointercancel', end, { passive: true });
};

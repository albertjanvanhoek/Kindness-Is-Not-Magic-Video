// Craft materials for the background layer, drawn with Canvas2D in 1920x1080 logical px
// (origin top-left, y down): twisted yarn, felt buttons, a paper name tag, a yarn ball,
// cross-stitches and a gold bead. Everything is deterministic (seeded, no Math.random).
import { CSS } from './look';

export type Pt = [number, number];

export function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerpPt = (a: Pt, b: Pt, t: number): Pt => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

// ---------------------------------------------------------------- yarn

/** base, light, dark */
export const YARN_COLORS = {
  cream: [CSS.paper, CSS.cream, '#b58f5d'],
  honey: [CSS.honey, '#e0c695', '#876e42'],
  gold: [CSS.gold, '#f0cc78', '#9a6e22'],
} as const;
export type YarnColor = keyof typeof YARN_COLORS;

export interface YarnStyle {
  width?: number;
  color?: YarnColor;
  /** draw only this fraction of the path, from its start (or its end when negative) */
  to?: number;
  /** 0..1: loose fibres sticking out */
  fray?: number;
  seed?: number;
}

function cumulative(pts: Pt[]): number[] {
  const out = [0];
  for (let i = 1; i < pts.length; i++) {
    out.push(out[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  return out;
}

/** Point and unit tangent at arc length `s`. */
function sampleAt(pts: Pt[], cum: number[], s: number): { p: Pt; d: Pt } {
  let i = 1;
  while (i < pts.length - 1 && cum[i] < s) i++;
  const seg = Math.max(1e-6, cum[i] - cum[i - 1]);
  const u = Math.max(0, Math.min(1, (s - cum[i - 1]) / seg));
  const a = pts[i - 1], b = pts[i];
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.max(1e-6, Math.hypot(dx, dy));
  return { p: [a[0] + dx * u, a[1] + dy * u], d: [dx / len, dy / len] };
}

/** The part of a polyline between arc lengths s0 and s1. */
function slice(pts: Pt[], cum: number[], s0: number, s1: number): Pt[] {
  const out: Pt[] = [sampleAt(pts, cum, s0).p];
  for (let i = 1; i < pts.length - 1; i++) if (cum[i] > s0 && cum[i] < s1) out.push(pts[i]);
  out.push(sampleAt(pts, cum, s1).p);
  return out;
}

function smoothPath(ctx: CanvasRenderingContext2D, pts: Pt[]): void {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last[0], last[1]);
}

/** A strand of twisted yarn along `pts`, with a soft cast shadow and visible plies. */
export function drawYarn(ctx: CanvasRenderingContext2D, pts: Pt[], style: YarnStyle = {}): void {
  if (pts.length < 2) return;
  const w = style.width ?? 10;
  const [base, light, dark] = YARN_COLORS[style.color ?? 'cream'];
  const cum = cumulative(pts);
  const total = cum[cum.length - 1];
  const to = style.to ?? 1;
  if (Math.abs(to) <= 0.001 || total < 1) return;
  const s0 = to < 0 ? total * (1 + to) : 0;
  const s1 = to < 0 ? total : total * Math.min(1, to);
  const part = slice(pts, cum, s0, s1);
  const pcum = cumulative(part);
  const len = pcum[pcum.length - 1];
  if (len < 1) return;

  const A = ctx.globalAlpha;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // body with its shadow on the backdrop
  ctx.shadowColor = 'rgba(30, 26, 12, 0.42)';
  ctx.shadowBlur = w * 0.9;
  ctx.shadowOffsetY = w * 0.55;
  ctx.strokeStyle = base;
  ctx.lineWidth = w;
  smoothPath(ctx, part);
  ctx.stroke();
  ctx.shadowColor = 'transparent';

  // twist: short diagonal plies, dark with a light edge
  const step = w * 0.62;
  const phase = (style.seed ?? 0) * 0.37 * step;
  for (let s = phase % step; s < len; s += step) {
    const { p, d } = sampleAt(part, pcum, s);
    const n: Pt = [-d[1], d[0]];
    const hx = n[0] * w * 0.44, hy = n[1] * w * 0.44;
    const tx = d[0] * w * 0.24, ty = d[1] * w * 0.24;
    ctx.strokeStyle = dark;
    ctx.globalAlpha = A * 0.55;
    ctx.lineWidth = Math.max(1, w * 0.15);
    ctx.beginPath();
    ctx.moveTo(p[0] + hx - tx, p[1] + hy - ty);
    ctx.lineTo(p[0] - hx + tx, p[1] - hy + ty);
    ctx.stroke();
    ctx.strokeStyle = light;
    ctx.globalAlpha = A * 0.45;
    ctx.lineWidth = Math.max(0.8, w * 0.10);
    const ox = d[0] * w * 0.2, oy = d[1] * w * 0.2;
    ctx.beginPath();
    ctx.moveTo(p[0] + hx * 0.8 - tx + ox, p[1] + hy * 0.8 - ty + oy);
    ctx.lineTo(p[0] - hx * 0.8 + tx + ox, p[1] - hy * 0.8 + ty + oy);
    ctx.stroke();
  }

  // stray fibres
  const fray = style.fray ?? 0.06;
  if (fray > 0) {
    const rand = mulberry32((style.seed ?? 1) * 7919 + 3);
    ctx.strokeStyle = light;
    ctx.lineWidth = 0.9;
    for (let s = 0; s < len; s += w * 0.9) {
      const r1 = rand(), r2 = rand(), r3 = rand();
      if (r1 > fray) continue;
      const { p, d } = sampleAt(part, pcum, s);
      const side = r2 < 0.5 ? -1 : 1;
      const n: Pt = [-d[1] * side, d[0] * side];
      const L = w * (0.6 + 1.6 * r3) * (0.5 + fray);
      ctx.globalAlpha = A * 0.6;
      ctx.beginPath();
      ctx.moveTo(p[0] + n[0] * w * 0.4, p[1] + n[1] * w * 0.4);
      ctx.quadraticCurveTo(
        p[0] + n[0] * L + d[0] * L * 0.5, p[1] + n[1] * L + d[1] * L * 0.5,
        p[0] + n[0] * L * 0.8 + d[0] * L, p[1] + n[1] * L * 0.8 + d[1] * L
      );
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Points along a gently sagging strand from a to b. */
export function strand(a: Pt, b: Pt, sag = 20, n = 40, wave?: (q: number) => Pt): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const q = i / (n - 1);
    const p = lerpPt(a, b, q);
    p[1] += sag * Math.sin(Math.PI * q);
    if (wave) { const o = wave(q); p[0] += o[0]; p[1] += o[1]; }
    out.push(p);
  }
  return out;
}

/** Point on a sagging strand at fraction q (matches `strand`). */
export function strandPoint(a: Pt, b: Pt, sag: number, q: number): Pt {
  const p = lerpPt(a, b, q);
  p[1] += sag * Math.sin(Math.PI * q);
  return p;
}

// ---------------------------------------------------------------- felt buttons

export const BUTTON_COLORS = {
  honey: [CSS.honey, '#e3c995', '#7d5c30'],
  cream: [CSS.paper, '#fbf0d4', '#b08a58'],
  gold: [CSS.gold, '#f2cf7c', '#94671e'],
  brown: ['#7d572f', '#a37d4e', '#45301a'],
  sage: [CSS.sage, '#a0a67c', '#4b5a35'],
} as const;
export type ButtonColor = keyof typeof BUTTON_COLORS;

const SPRITE_R = 96;
const sprites = new Map<string, HTMLCanvasElement>();

/** A felt-covered button, rendered once at high resolution and reused. */
function buttonSprite(color: ButtonColor, holes: 2 | 4): HTMLCanvasElement {
  const key = `${color}-${holes}`;
  const cached = sprites.get(key);
  if (cached) return cached;

  const R = SPRITE_R, S = (R + 6) * 2, c = S / 2;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d')!;
  const [base, light, dark] = BUTTON_COLORS[color];
  const rand = mulberry32(color.length * 131 + holes);

  // felt body, lit from the top left
  const body = ctx.createRadialGradient(c - R * 0.35, c - R * 0.4, R * 0.1, c, c, R);
  body.addColorStop(0, light);
  body.addColorStop(0.55, base);
  body.addColorStop(1, dark);
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.arc(c, c, R, 0, Math.PI * 2); ctx.fill();

  // felt fibres
  ctx.save();
  ctx.beginPath(); ctx.arc(c, c, R - 1, 0, Math.PI * 2); ctx.clip();
  ctx.lineCap = 'round';
  for (let i = 0; i < 2200; i++) {
    const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * R;
    const x = c + Math.cos(a) * r, y = c + Math.sin(a) * r;
    const d = rand() * Math.PI * 2, L = 2 + rand() * 6;
    ctx.strokeStyle = rand() < 0.5 ? light : dark;
    ctx.globalAlpha = 0.10 + rand() * 0.14;
    ctx.lineWidth = 0.8 + rand() * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(d) * L, y + Math.sin(d) * L);
    ctx.stroke();
  }
  ctx.restore();

  // pressed rim
  ctx.lineWidth = R * 0.06;
  ctx.strokeStyle = dark; ctx.globalAlpha = 0.35;
  ctx.beginPath(); ctx.arc(c + 1.5, c + 2, R * 0.74, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = light; ctx.globalAlpha = 0.45;
  ctx.beginPath(); ctx.arc(c - 1, c - 1.5, R * 0.74, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 1;

  // holes, sewn on with cream yarn
  const h = R * 0.2;
  const holePts: Pt[] = holes === 2
    ? [[c - h, c], [c + h, c]]
    : [[c - h, c - h], [c + h, c - h], [c - h, c + h], [c + h, c + h]];
  for (const [x, y] of holePts) {
    ctx.fillStyle = '#2e1f10';
    ctx.beginPath(); ctx.arc(x, y, R * 0.085, 0, Math.PI * 2); ctx.fill();
  }
  ctx.lineCap = 'round';
  const sew = (a: Pt, b: Pt) => {
    ctx.strokeStyle = 'rgba(30, 20, 8, 0.45)'; ctx.lineWidth = R * 0.09;
    ctx.beginPath(); ctx.moveTo(a[0] + 1.5, a[1] + 2.5); ctx.lineTo(b[0] + 1.5, b[1] + 2.5); ctx.stroke();
    ctx.strokeStyle = CSS.cream; ctx.lineWidth = R * 0.075;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  };
  if (holes === 2) sew(holePts[0], holePts[1]);
  else { sew(holePts[0], holePts[3]); sew(holePts[1], holePts[2]); }

  // outer edge
  ctx.strokeStyle = 'rgba(40, 26, 10, 0.5)'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(c, c, R - 1, 0, Math.PI * 2); ctx.stroke();

  sprites.set(key, canvas);
  return canvas;
}

export interface ButtonStyle {
  color?: ButtonColor;
  holes?: 2 | 4;
  /** rotation in radians */
  rot?: number;
  /** extra scale, e.g. for popping in */
  scale?: number;
  /** draw a contact shadow, for buttons resting on the ground */
  grounded?: boolean;
}

export function drawButton(ctx: CanvasRenderingContext2D, p: Pt, r: number, style: ButtonStyle = {}): void {
  const s = style.scale ?? 1;
  if (s <= 0.001) return;
  const rr = r * s;
  const sprite = buttonSprite(style.color ?? 'honey', style.holes ?? 4);
  ctx.save();
  if (style.grounded) {
    const g = ctx.createRadialGradient(p[0], p[1] + rr * 0.85, 0, p[0], p[1] + rr * 0.85, rr * 1.3);
    g.addColorStop(0, 'rgba(30, 22, 10, 0.45)');
    g.addColorStop(1, 'rgba(30, 22, 10, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(p[0], p[1] + rr * 0.85, rr * 1.3, rr * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.shadowColor = 'rgba(30, 26, 12, 0.45)';
    ctx.shadowBlur = rr * 0.5;
    ctx.shadowOffsetY = rr * 0.25;
  }
  ctx.translate(p[0], p[1]);
  ctx.rotate(style.rot ?? 0);
  const k = rr / SPRITE_R;
  ctx.drawImage(sprite, -sprite.width / 2 * k, -sprite.height / 2 * k, sprite.width * k, sprite.height * k);
  ctx.restore();
}

// ---------------------------------------------------------------- other props

/** A cream paper name tag tied to `anchor`, standing above it on a short string. */
export function drawTag(ctx: CanvasRenderingContext2D, anchor: Pt, text: string, swing: number): void {
  ctx.save();
  ctx.translate(anchor[0], anchor[1]);
  ctx.rotate(swing);
  const rise = 40, tw = 176, th = 58;
  const x = -tw / 2, y = -rise - th;
  ctx.strokeStyle = '#6b4c2a'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10, -rise * 0.5, 0, -rise - 8); ctx.stroke();
  ctx.shadowColor = 'rgba(30, 26, 12, 0.4)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 6;
  ctx.fillStyle = CSS.paper;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + tw, y);
  ctx.lineTo(x + tw, y + th - 14);
  ctx.lineTo(x + tw - 18, y + th);
  ctx.lineTo(x + 18, y + th);
  ctx.lineTo(x, y + th - 14);
  ctx.closePath();
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(58, 38, 20, 0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#6b4c2a';
  ctx.beginPath(); ctx.arc(0, y + th - 9, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = CSS.ink;
  ctx.font = '700 26px Jost, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase().split('').join(String.fromCharCode(8202)), 0, y + th / 2 - 4);
  ctx.restore();
}

/** A ball of yarn: a felt-like sphere wrapped in strands, rolled by `roll` radians. */
export function drawYarnBall(ctx: CanvasRenderingContext2D, p: Pt, r: number, roll: number, color: YarnColor = 'honey'): void {
  if (r < 1) return;
  const [base, light, dark] = YARN_COLORS[color];
  const A = ctx.globalAlpha;
  ctx.save();
  const g = ctx.createRadialGradient(p[0], p[1] + r * 0.9, 0, p[0], p[1] + r * 0.9, r * 1.2);
  g.addColorStop(0, 'rgba(30, 22, 10, 0.45)');
  g.addColorStop(1, 'rgba(30, 22, 10, 0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(p[0], p[1] + r * 0.9, r * 1.2, r * 0.32, 0, 0, Math.PI * 2); ctx.fill();

  const body = ctx.createRadialGradient(p[0] - r * 0.35, p[1] - r * 0.4, r * 0.1, p[0], p[1], r);
  body.addColorStop(0, light); body.addColorStop(0.6, base); body.addColorStop(1, dark);
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2); ctx.fill();
  ctx.clip();
  ctx.translate(p[0], p[1]);
  ctx.rotate(roll);
  const rand = mulberry32(42);
  ctx.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI, e = 0.25 + rand() * 0.75;
    ctx.save();
    ctx.rotate(a);
    ctx.strokeStyle = rand() < 0.5 ? dark : light;
    ctx.globalAlpha = A * 0.45;
    ctx.lineWidth = Math.max(1, r * 0.07);
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.98, r * e, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

/** Cross-stitches over a repaired join: `count` stitches, the first `shown` (fractional) visible. */
export function drawStitches(ctx: CanvasRenderingContext2D, p: Pt, shown: number, count = 4): void {
  ctx.save();
  ctx.lineCap = 'round';
  const gap = 22;
  for (let i = 0; i < count; i++) {
    const k = Math.max(0, Math.min(1, shown - i));
    if (k <= 0) continue;
    const x = p[0] + (i - (count - 1) / 2) * gap, y = p[1];
    const s = 13 * k;
    for (const [dx, dy] of [[1, 1], [1, -1]] as const) {
      ctx.strokeStyle = 'rgba(30, 20, 8, 0.45)'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x - s * dx + 1, y - s * dy + 3); ctx.lineTo(x + s * dx + 1, y + s * dy + 3); ctx.stroke();
      ctx.strokeStyle = CSS.gold; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x - s * dx, y - s * dy); ctx.lineTo(x + s * dx, y + s * dy); ctx.stroke();
    }
  }
  ctx.restore();
}

/** A small gold bead, used to show something travelling along a thread. */
export function drawBead(ctx: CanvasRenderingContext2D, p: Pt, r: number): void {
  ctx.save();
  ctx.shadowColor = 'rgba(30, 26, 12, 0.5)'; ctx.shadowBlur = r; ctx.shadowOffsetY = r * 0.5;
  const g = ctx.createRadialGradient(p[0] - r * 0.35, p[1] - r * 0.4, r * 0.1, p[0], p[1], r);
  g.addColorStop(0, '#fbe3a2'); g.addColorStop(0.5, CSS.gold); g.addColorStop(1, '#8a5f1a');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

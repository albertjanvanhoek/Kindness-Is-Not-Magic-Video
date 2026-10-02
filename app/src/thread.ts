// The background layer (the "30 %"): two felt buttons on the burlap, joined by a yarn thread
// that acts out each lyric line behind the words. One scene per lyric section; every scene is
// a pure function of song time, drawn with Canvas2D in 1920x1080 logical px (y down).
import {
  type LineTiming, beatAtOrAfter, beatPosition, clamp01, findLine, findWord, nearestBeatPulse, smoothstep,
} from './lyrics';
import {
  type ButtonColor, type Pt, type YarnColor,
  drawBead, drawButton, drawStitches, drawTag, drawYarn, drawYarnBall, lerp, lerpPt, strand, strandPoint,
} from './yarn';

const W = 1920;
const H = 1080;

// ---------------------------------------------------------------- easing

const easeOutCubic = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const easeOutBack = (x: number) => {
  const k = clamp01(x), c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
};
/** 0 → 1 with a small settle, for things dropping onto the cloth. */
const dropIn = (x: number) => {
  const k = clamp01(x);
  return k < 0.7 ? Math.pow(k / 0.7, 2) : 1 - Math.sin((k - 0.7) / 0.3 * Math.PI) * 0.06;
};
const popIn = (t: number, at: number) => easeOutBack((t - at) / 0.35);

// ---------------------------------------------------------------- the cast

/** The two buttons sit on the burlap, like the two bears on the sleeve. */
const A: Pt = [600, 958];
const B: Pt = [1320, 958];
const PAIR_R = 56;

type Node = { p: Pt; r: number; color: ButtonColor; holes: 2 | 4; grounded: boolean };

/** The wider world, kept to the edges of the frame so the lyrics stay clear. */
const NET: Node[] = [
  { p: [230, 190], r: 29, color: 'sage', holes: 4, grounded: false },
  { p: [620, 135], r: 27, color: 'honey', holes: 2, grounded: false },
  { p: [1010, 180], r: 31, color: 'cream', holes: 4, grounded: false },
  { p: [1390, 125], r: 27, color: 'brown', holes: 2, grounded: false },
  { p: [1720, 210], r: 29, color: 'honey', holes: 4, grounded: false },
  { p: [150, 560], r: 29, color: 'brown', holes: 2, grounded: false },
  { p: [1780, 600], r: 29, color: 'sage', holes: 4, grounded: false },
  { p: [290, 968], r: 42, color: 'brown', holes: 4, grounded: true },
  { p: A, r: PAIR_R, color: 'honey', holes: 4, grounded: true },
  { p: [960, 985], r: 36, color: 'sage', holes: 2, grounded: true },
  { p: B, r: PAIR_R, color: 'cream', holes: 2, grounded: true },
  { p: [1650, 968], r: 42, color: 'gold', holes: 2, grounded: true },
];
const IA = 8, IB = 10;

/** The ring around the frame, then the extra "redundant" links that make it strong. */
const RING: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 6], [6, 11], [11, 10], [10, 9], [9, 8], [8, 7], [7, 5], [5, 0],
];
const EXTRA: Array<[number, number]> = [[1, 3], [8, 10], [5, 8], [6, 10]];

function edgeSag(u: Pt, v: Pt): number {
  if (u[1] < 300 && v[1] < 300) return 42;  // garlands hanging across the top
  if (u[1] > 900 && v[1] > 900) return 10;  // lying on the cloth
  return 18;
}

// ---------------------------------------------------------------- drawing helpers

function pair(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, sa = 1, sb = 1): void {
  drawButton(ctx, a, PAIR_R, { color: 'honey', holes: 4, grounded: true, scale: sa, rot: 0.2 });
  drawButton(ctx, b, PAIR_R, { color: 'cream', holes: 2, grounded: true, scale: sb, rot: -0.35 });
}

function thread(ctx: CanvasRenderingContext2D, pts: Pt[], o: { to?: number; width?: number; fray?: number; color?: YarnColor } = {}): void {
  drawYarn(ctx, pts, { width: o.width ?? 14, color: o.color ?? 'cream', to: o.to, fray: o.fray ?? 0.06, seed: 1 });
}

interface NetState {
  /** 0..1 how far each node has appeared (pop-in scale) */
  node?: (i: number) => number;
  /** 0..1 how much of each ring edge is drawn */
  ring?: (i: number) => number;
  /** 0..1 how much of each extra edge is drawn */
  extra?: (i: number) => number;
  /** 0..1 pull toward the centre ("people come closer") */
  closer?: number;
  /** yarn width multiplier ("trust grows") */
  thick?: number;
  /** draw beads travelling along the ring */
  beads?: number;
  /** position offset per node */
  drift?: (i: number) => Pt;
  /** skip drawing the pair's own buttons (the scene draws them) */
  skipPair?: boolean;
}

function netPos(i: number, s: NetState): Pt {
  const n = NET[i];
  const c = (s.closer ?? 0) * 0.07;
  const p: Pt = [lerp(n.p[0], W / 2, c), n.grounded ? n.p[1] : lerp(n.p[1], H / 2, c)];
  if (s.drift) { const d = s.drift(i); p[0] += d[0]; p[1] += d[1]; }
  return p;
}

function network(ctx: CanvasRenderingContext2D, t: number, s: NetState): void {
  const pos = NET.map((_, i) => netPos(i, s));
  const width = 8 * (s.thick ?? 1);
  const edges: Array<[[number, number], number]> = [
    ...RING.map((e, i) => [e, s.ring?.(i) ?? 0] as [[number, number], number]),
    ...EXTRA.map((e, i) => [e, s.extra?.(i) ?? 0] as [[number, number], number]),
  ];
  for (const [[u, v], k] of edges) {
    if (k <= 0.001) continue;
    const sag = edgeSag(pos[u], pos[v]);
    drawYarn(ctx, strand(pos[u], pos[v], sag, 28), { width, color: 'honey', to: k, fray: 0.05, seed: u * 13 + v });
  }
  if (s.beads) {
    const bp = beatPosition(t);
    const prev = ctx.globalAlpha;
    ctx.globalAlpha = prev * s.beads;
    RING.forEach(([u, v], i) => {
      if ((s.ring?.(i) ?? 0) < 1) return;
      const q = (bp * 0.25 + i * 0.37) % 1;
      drawBead(ctx, strandPoint(pos[u], pos[v], edgeSag(pos[u], pos[v]), q), 6 + 2 * nearestBeatPulse(t, 0.12));
    });
    ctx.globalAlpha = prev;
  }
  NET.forEach((n, i) => {
    if (s.skipPair !== false && (i === IA || i === IB)) return;
    const k = s.node?.(i) ?? 1;
    if (k <= 0.001) return;
    drawButton(ctx, pos[i], n.r, { color: n.color, holes: n.holes, grounded: n.grounded, scale: k, rot: i * 0.7 });
  });
}

/** Staggered 0..1 reveals across [t0, t1] for `n` items. */
const stagger = (t: number, t0: number, t1: number, n: number, spread = 0.6) => (i: number) => {
  const d = (t1 - t0) * spread / Math.max(1, n - 1);
  return easeOutCubic((t - t0 - i * d) / Math.max(0.2, (t1 - t0) * (1 - spread)));
};

const withAlpha = (ctx: CanvasRenderingContext2D, a: number, draw: () => void) => {
  if (a <= 0.001) return;
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = prev * a;
  draw();
  ctx.globalAlpha = prev;
};

// ---------------------------------------------------------------- scenes

type Scene = { from: number; draw: (ctx: CanvasRenderingContext2D, t: number) => void };

function line(fragment: string, occurrence = 0): LineTiming {
  return findLine(fragment, occurrence);
}

function buildScenes(): Scene[] {
  const op1 = line('Nobody invented kindness');
  const op2 = line('People gave it a name');
  const op3 = line('kindness was already there');
  const help = line('helps another person');
  const share = line('shares their food');
  const comfort = line('comforts a friend');
  const truth = line('tells the truth');
  const special = line('something special happens');
  const closer = line('People come closer');
  const trust = line('Trust grows');
  const stronger = line('they become stronger');
  const kindness1 = line('That is kindness');
  const easy = line('does not always feel easy');
  const sharing = line('kindness means sharing');
  const listening = line('it means listening');
  const saying = line('it means saying');
  const wrong = line('I was wrong');
  const or = line('Or:');
  const forgive = line('I forgive you');
  const failure = line('does not always win');
  const without = line('But without kindness');
  const drift = line('people drift apart');
  const brk = line('Friendships break');
  const families = line('Families fall apart');
  const lonely = line('world becomes lonelier');
  const rediscover = line('keep discovering kindness');
  const stay = line('helps us stay together');
  const ret = line('We did not invent kindness');
  const gaveName = line('We only gave a name');
  const beautiful = line('something beautiful');
  const possible = line('always possible');

  const popA = beatAtOrAfter(9.4);
  const popB = beatAtOrAfter(popA + 0.6);
  const kindWord = findWord(op1, 'kindness');
  const nameWord = findWord(op2, 'name');
  const nameWord2 = findWord(gaveName, 'name');
  const helpsWord = findWord(help, 'helps');
  const sharesWord = findWord(share, 'shares');
  const friendWord = findWord(comfort, 'friend');
  const truthWord = findWord(truth, 'truth');
  const hardWord = findWord(truth, 'hard');
  const closerWord = findWord(closer, 'closer');
  const growsWord = findWord(trust, 'grows');
  const sharingWord = findWord(sharing, 'sharing');
  const wrongWord = findWord(wrong, 'wrong');
  const forgiveWord = findWord(forgive, 'forgive');
  const breakWord = findWord(brk, 'break');
  const familiesApart = findWord(families, 'apart');
  const driftApart = findWord(drift, 'apart');
  const togetherWord = findWord(stay, 'together');
  const endFade = possible.end + 0.9;

  const restingThread = () => strand(A, B, 22, 44);
  const tagSwing = (t: number, at: number) => {
    const k = Math.max(0, t - at);
    return 0.55 * Math.exp(-2.4 * k) * Math.sin(7 * k) + 0.03 * Math.sin(t * 1.3);
  };
  const tagAt = (ctx: CanvasRenderingContext2D, t: number, at: number, a = 1) => {
    if (t < at - 0.25) return;
    const k = clamp01((t - at + 0.25) / 0.35);
    const anchor = strandPoint(A, B, 22, 0.5);
    withAlpha(ctx, a * k, () => drawTag(ctx, [anchor[0], anchor[1] - 30 * (1 - k)], 'kindness', tagSwing(t, at)));
  };

  /** Share: one ball of yarn splits into two that roll to each person. */
  const shareScene = (from: number, word: { start: number; end: number }) => (ctx: CanvasRenderingContext2D, t: number) => {
    thread(ctx, restingThread());
    const appear = popIn(t, from);
    const split = easeOutCubic((t - word.start) / Math.max(0.5, word.end - word.start + 0.4));
    const c: Pt = [960, 952];
    if (split <= 0) {
      drawYarnBall(ctx, c, 44 * appear, 0);
    } else {
      const r = lerp(44, 32, Math.min(1, split * 3));
      const l: Pt = [lerp(c[0], A[0] + 95, split), 964];
      const rr: Pt = [lerp(c[0], B[0] - 95, split), 964];
      drawYarn(ctx, strand(l, rr, 8, 20), { width: 6, color: 'honey', fray: 0.04, seed: 9 });
      drawYarnBall(ctx, l, r, -(c[0] - l[0]) / r, 'honey');
      drawYarnBall(ctx, rr, r, (rr[0] - c[0]) / r, 'honey');
    }
    pair(ctx, A, B);
  };

  const scenes: Scene[] = [
    {
      // The sleeve fades; two buttons drop onto the cloth on the beat; a thread begins.
      from: 0,
      draw: (ctx, t) => {
        thread(ctx, restingThread(), { to: 0.35 * smoothstep(popB + 0.3, op1.start, t) });
        pair(ctx, A, B, popIn(t, popA), popIn(t, popB));
      },
    },
    {
      // "Nobody invented kindness": the thread reaches across before the word arrives.
      from: op1.start,
      draw: (ctx, t) => {
        thread(ctx, restingThread(), { to: lerp(0.35, 1, smoothstep(op1.start, kindWord.end, t)) });
        pair(ctx, A, B);
      },
    },
    {
      // "People gave it a name": a paper name tag drops onto the thread.
      from: op2.start,
      draw: (ctx, t) => {
        thread(ctx, restingThread());
        pair(ctx, A, B);
        tagAt(ctx, t, nameWord.start);
      },
    },
    {
      // "But kindness was already there": the wider world was connected all along.
      from: op3.start,
      draw: (ctx, t) => {
        const t0 = op3.words[1].start, t1 = op3.end;
        network(ctx, t, {
          node: stagger(t, t0, t1, NET.length),
          ring: stagger(t, t0 + 0.4, t1 + 0.4, RING.length),
        });
        thread(ctx, restingThread());
        pair(ctx, A, B);
        tagAt(ctx, t, nameWord.start);
      },
    },
    {
      // "Whenever someone helps another person": the thread sags; a helper drops in and holds it up.
      from: help.start,
      draw: (ctx, t) => {
        const fade = 1 - smoothstep(help.start, help.start + 0.6, t);
        withAlpha(ctx, fade, () => network(ctx, t, { ring: () => 1 }));
        withAlpha(ctx, fade, () => tagAt(ctx, t, nameWord.start));
        const sag = lerp(22, 74, smoothstep(help.start, helpsWord.start, t));
        const land = dropIn((t - (helpsWord.start - 0.25)) / 0.6);
        const C: Pt = [960, lerp(-80, 975, land)];
        const lift = smoothstep(0.85, 1, land);
        const top: Pt = [960, 975 - 38];
        const sagPts = strand(A, B, sag, 44);
        const heldPts = [...strand(A, top, 10, 23), ...strand(top, B, 10, 22).slice(1)]; // 44 points, like sagPts
        thread(ctx, sagPts.map((p, i) => lerpPt(p, heldPts[i], lift)));
        if (land > 0) drawButton(ctx, C, 42, { color: 'gold', holes: 2, grounded: land >= 0.99, rot: 0.4 });
        pair(ctx, A, B);
      },
    },
    { from: share.start, draw: shareScene(share.start, sharesWord) },
    {
      // "comforts a friend": one button trembles; the connection calms it.
      from: comfort.start,
      draw: (ctx, t) => {
        const calm = smoothstep(comfort.start, friendWord.end, t);
        const amp = (1 - calm) * smoothstep(comfort.start - 0.1, comfort.start + 0.25, t);
        const a: Pt = [A[0] + Math.sin(t * 31) * 7 * amp, A[1] + Math.sin(t * 23) * 4 * amp];
        thread(ctx, strand(a, B, 22, 48, (q) => [0, Math.sin(q * 18 - t * 14) * 26 * amp * (1 - q)]));
        pair(ctx, a, B);
      },
    },
    {
      // "or tells the truth even when it is hard": a tangle pulled straight.
      from: truth.start,
      draw: (ctx, t) => {
        const amp = (1 - smoothstep(truthWord.start, hardWord.end, t)) * smoothstep(truth.start, truth.start + 0.4, t);
        thread(ctx, strand(A, B, lerp(22, 4, smoothstep(truthWord.start, hardWord.end, t)), 64, (q) => {
          const env = Math.sin(Math.PI * q);
          return [Math.sin(q * Math.PI * 7) * 46 * amp * env, -Math.abs(Math.sin(q * Math.PI * 5 + 0.6)) * 110 * amp * env];
        }), { fray: 0.06 + 0.2 * amp });
        pair(ctx, A, B);
      },
    },
    {
      // "something special happens / People come closer / Trust grows / they become stronger"
      from: special.start,
      draw: (ctx, t) => {
        network(ctx, t, {
          node: stagger(t, special.start, special.end, NET.length),
          ring: stagger(t, special.start + 0.3, special.end + 0.6, RING.length),
          closer: smoothstep(closerWord.start, closerWord.end + 0.3, t),
          thick: lerp(1, 1.6, smoothstep(growsWord.start, growsWord.end + 0.2, t)),
          extra: stagger(t, stronger.start, stronger.end, EXTRA.length),
        });
        thread(ctx, strand(A, B, 4, 44));
        pair(ctx, A, B);
      },
    },
    {
      // "That is kindness / It is not magic": the mechanism at work, beads carried on the beat.
      from: kindness1.start,
      draw: (ctx, t) => {
        network(ctx, t, { ring: () => 1, extra: () => 1, closer: 1, thick: 1.6, beads: smoothstep(kindness1.start, kindness1.start + 0.6, t) });
        thread(ctx, strand(A, B, 4, 44));
        pair(ctx, A, B);
      },
    },
    {
      // "And it does not always feel easy": the pair strains; the thread frays.
      from: easy.start,
      draw: (ctx, t) => {
        const fade = 1 - smoothstep(easy.start, easy.start + 0.7, t);
        withAlpha(ctx, fade, () => network(ctx, t, { ring: () => 1, extra: () => 1, closer: 1, thick: 1.6 }));
        const k = smoothstep(easy.start, easy.end, t);
        const a: Pt = [A[0] - 40 * k, A[1]], b: Pt = [B[0] + 40 * k, B[1]];
        thread(ctx, strand(a, b, lerp(4, 0, k), 52, (q) => [0, Math.sin(q * 40 + t * 60) * 3 * k * Math.sin(Math.PI * q)]), { fray: lerp(0.06, 0.55, k) });
        pair(ctx, a, b);
      },
    },
    { from: sharing.start, draw: shareScene(sharing.start, sharingWord) },
    {
      // "Sometimes it means listening": a message travels along the thread and is received.
      from: listening.start,
      draw: (ctx, t) => {
        const bp = beatPosition(t);
        const q = 1 - ((bp / 2) % 1);
        thread(ctx, strand(A, B, 22, 64, (u) => [0, -38 * Math.exp(-Math.pow((u - q) / 0.06, 2))]));
        const arrive = Math.exp(-Math.pow(q / 0.08, 2));
        pair(ctx, A, B, 1 + 0.12 * arrive, 1);
      },
    },
    {
      // "Sometimes it means saying: I was wrong": a knot forms, and is untied.
      from: saying.start,
      draw: (ctx, t) => {
        const r = 34 * smoothstep(saying.start, saying.end, t) * (1 - smoothstep(wrongWord.start, wrongWord.end + 0.3, t));
        const pts = strand(A, B, 22, 64);
        if (r > 0.5) {
          const m = strandPoint(A, B, 22, 0.5);
          const loop: Pt[] = [];
          for (let i = 0; i <= 24; i++) {
            const a = Math.PI / 2 + (i / 24) * Math.PI * 2;
            loop.push([m[0] + Math.cos(a) * r * 0.9, m[1] - r + Math.sin(a) * r]);
          }
          const half = pts.length >> 1;
          thread(ctx, [...pts.slice(0, half), ...loop, ...pts.slice(half)], { fray: 0.1 });
        } else {
          thread(ctx, pts);
        }
        pair(ctx, A, B);
      },
    },
    {
      // "Or: I forgive you": the thread is broken, then stitched back, and the stitches stay.
      from: or.start,
      draw: (ctx, t) => {
        const mend = easeOutCubic((t - forgiveWord.start) / 0.6);
        const gap = lerp(90, 0, mend);
        const m = strandPoint(A, B, 22, 0.5);
        const l: Pt = [m[0] - 6 - gap, m[1] + 18 * (1 - mend)];
        const r: Pt = [m[0] + 6 + gap, m[1] + 18 * (1 - mend)];
        thread(ctx, strand(A, l, 14, 26), { fray: 0.12 });
        thread(ctx, strand(r, B, 14, 26), { fray: 0.12 });
        drawStitches(ctx, m, 4 * smoothstep(forgiveWord.start + 0.2, forgive.end, t));
        pair(ctx, A, B);
      },
    },
    {
      // "Kindness does not always win right away": a tug of war; the mend holds.
      from: failure.start,
      draw: (ctx, t) => {
        const pull = 0.5 + 0.5 * Math.sin(beatPosition(t) * Math.PI * 0.5);
        const a: Pt = [A[0] - 26 * pull, A[1]], b: Pt = [B[0] + 26 * (1 - pull), B[1]];
        const sag = lerp(22, 6, pull);
        thread(ctx, strand(a, b, sag, 44), { fray: 0.14 });
        drawStitches(ctx, strandPoint(a, b, sag, 0.5), 4);
        pair(ctx, a, b);
      },
    },
    {
      // "But without kindness, people drift apart": the pair slides apart; the thread thins.
      from: without.start,
      draw: (ctx, t) => {
        const k = smoothstep(without.start, driftApart.end, t);
        const a: Pt = [lerp(A[0], 330, k), A[1]], b: Pt = [lerp(B[0], 1590, k), B[1]];
        const sag = lerp(22, 8, k);
        thread(ctx, strand(a, b, sag, 52), { width: lerp(14, 7, k), fray: lerp(0.14, 0.6, k) });
        drawStitches(ctx, strandPoint(a, b, sag, 0.5), 4);
        pair(ctx, a, b);
      },
    },
    {
      // "Friendships break": the thread snaps and both ends fall back.
      from: brk.start,
      draw: (ctx, t) => {
        const a: Pt = [330, A[1]], b: Pt = [1590, B[1]];
        const snap = easeOutCubic((t - breakWord.start) / 0.7);
        const m = strandPoint(a, b, 8, 0.5);
        const le: Pt = [lerp(m[0] - 4, a[0] + 120, snap), lerp(m[1], a[1] + 30, snap)];
        const re: Pt = [lerp(m[0] + 4, b[0] - 120, snap), lerp(m[1], b[1] + 30, snap)];
        thread(ctx, strand(a, le, lerp(4, 18, snap), 30), { width: 7, fray: 0.6 });
        thread(ctx, strand(re, b, lerp(4, 18, snap), 30), { width: 7, fray: 0.6 });
        pair(ctx, a, b);
      },
    },
    {
      // "Families fall apart": two small groups, and the links between them give way.
      from: families.start,
      draw: (ctx, t) => {
        const k = easeOutCubic((t - familiesApart.start) / 0.9);
        const dl = -110 * k, dr = 110 * k;
        const left = [NET[7].p, A].map((p): Pt => [p[0] + dl, p[1]]);
        const right = [B, NET[11].p].map((p): Pt => [p[0] + dr, p[1]]);
        drawYarn(ctx, strand(left[0], left[1], 10, 20), { width: 7, color: 'honey', seed: 3 });
        drawYarn(ctx, strand(right[0], right[1], 10, 20), { width: 7, color: 'honey', seed: 4 });
        withAlpha(ctx, 1 - k, () => thread(ctx, strand(left[1], right[0], 18, 44), { width: 7, fray: 0.5 }));
        drawButton(ctx, left[0], 42, { color: 'brown', holes: 4, grounded: true, rot: 5.6 });
        drawButton(ctx, right[1], 42, { color: 'gold', holes: 2, grounded: true, rot: 7.7 });
        pair(ctx, left[1], right[0]);
      },
    },
    {
      // "And the world becomes lonelier": everyone alone, drifting.
      from: lonely.start,
      draw: (ctx, t) => {
        withAlpha(ctx, 0.78, () => network(ctx, t, {
          drift: (i) => [Math.sin(t * 0.6 + i * 1.7) * 14, NET[i].grounded ? 0 : Math.cos(t * 0.5 + i) * 10],
          skipPair: false,
        }));
      },
    },
    {
      // "So people keep discovering kindness, again and again": links return, one per beat.
      from: rediscover.start,
      draw: (ctx, t) => {
        const b0 = Math.ceil(beatPosition(rediscover.start));
        const bp = beatPosition(t);
        network(ctx, t, {
          ring: (i) => easeOutCubic(bp - b0 - i),
          extra: (i) => easeOutCubic(bp - b0 - RING.length - i),
          skipPair: false,
        });
      },
    },
    {
      // "because it helps us stay together": the whole web, strong and carrying.
      from: stay.start,
      draw: (ctx, t) => {
        network(ctx, t, {
          ring: () => 1, extra: () => 1, beads: 1,
          closer: smoothstep(togetherWord.start, togetherWord.end, t),
          thick: lerp(1, 1.6, smoothstep(stay.start, togetherWord.end, t)),
          skipPair: false,
        });
      },
    },
    {
      // "We did not invent kindness. We only gave a name": back to the pair, and the tag again.
      from: ret.start,
      draw: (ctx, t) => {
        const fade = 1 - smoothstep(ret.start, ret.start + 1.2, t);
        withAlpha(ctx, fade, () => network(ctx, t, { ring: () => 1, extra: () => 1, closer: 1, thick: 1.6 }));
        thread(ctx, restingThread());
        pair(ctx, A, B);
        tagAt(ctx, t, nameWord2.start);
      },
    },
    {
      // "to something beautiful that was always possible": the thread turns gold, then the sleeve returns.
      from: beautiful.start,
      draw: (ctx, t) => {
        const out = 1 - smoothstep(endFade, endFade + 1.4, t);
        withAlpha(ctx, out, () => {
          thread(ctx, restingThread());
          withAlpha(ctx, smoothstep(findWord(beautiful, 'beautiful').start, possible.end, t), () => thread(ctx, restingThread(), { color: 'gold' }));
          pair(ctx, A, B);
          tagAt(ctx, t, nameWord2.start, 1 - smoothstep(beautiful.start, beautiful.start + 1, t));
        });
      },
    },
  ];
  return scenes;
}

// ---------------------------------------------------------------- the layer

export class ThreadLayer {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly scenes = buildScenes();

  constructor(parent: Element) {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'thread';
    this.canvas.width = W;
    this.canvas.height = H;
    this.ctx = this.canvas.getContext('2d')!;
    parent.appendChild(this.canvas);
  }

  /** Match the on-screen size of the WebGL canvas. */
  setDisplaySize(w: number, h: number): void {
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
  }

  render(t: number): void {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);
    let scene: Scene | undefined;
    for (const s of this.scenes) if (t >= s.from) scene = s;
    scene?.draw(ctx, t);
  }
}

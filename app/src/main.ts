import * as THREE from 'three';
import '@fontsource-variable/fraunces/full.css';
import '@fontsource/jost/500.css';
import '@fontsource/jost/700.css';
import { Backdrop, CSS, Grain, PALETTE } from './look';
import { ThreadLayer } from './thread';
import {
  type LineTiming, type WordTiming,
  beats, clamp01, findLine, lines, nearestBeatPulse, smoothstep, wordProgress,
} from './lyrics';

const LOGICAL_W = 1920;
const LOGICAL_H = 1080;

const opening1 = findLine('Nobody invented kindness');
const opening2 = findLine('People gave it a name');
const opening3 = findLine('kindness was already there');
const helpLine = findLine('Whenever someone helps another person');
const shareLine = findLine('shares their food');
const comfortLine = findLine('comforts a friend');
const truthLine = findLine('tells the truth');
const specialLine = findLine('something special happens');
const closerLine = findLine('People come closer');
const trustLine = findLine('Trust grows');
const strongerLine = findLine('together they become stronger');
const kindnessLine = findLine('That is kindness');
const kindnessLine2 = findLine('That is kindness', 1);
const notMagicLine = findLine('It is not magic');
const notMagicLine2 = findLine('It is not magic', 1);
const easyLine = findLine('does not always feel easy');
const meansShareLine = findLine('Sometimes kindness means sharing');
const listeningLine = findLine('Sometimes it means listening');
const sayingLine = findLine('Sometimes it means saying');
const wrongLine = findLine('I was wrong');
const orLine = findLine('Or:');
const forgiveLine = findLine('I forgive you');
const failureLine = findLine('Kindness does not always win right away');
const withoutLine = findLine('But without kindness');
const driftLine = findLine('people drift apart');
const breakLine = findLine('Friendships break');
const familiesLine = findLine('Families fall apart');
const lonelyLine = findLine('world becomes lonelier');
const rediscoverLine = findLine('keep discovering kindness');
const againLine = findLine('again and again');
const stayLine = findLine('helps us stay together');
const returnLine = findLine('We did not invent kindness');
const gaveNameLine = findLine('gave a name');
const beautifulLine = findLine('something beautiful');
const possibleLine = findLine('always possible');

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(PALETTE.greenDeep, 1);
document.querySelector('#app')!.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
  -LOGICAL_W / 2,
  LOGICAL_W / 2,
  LOGICAL_H / 2,
  -LOGICAL_H / 2,
  -10,
  10
);

const BONE: number = PALETTE.cream;
const SIGNAL: number = PALETTE.gold;
const GRAPHITE: number = PALETTE.greenDark;
const ASH: number = PALETTE.paper;

function basicMaterial(color: number, opacity = 1): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
}

function makeNode(x: number, y: number, radius = 13, color = BONE): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 48), basicMaterial(color, 0));
  mesh.position.set(x, y, 0);
  scene.add(mesh);
  return mesh;
}

function makeCircle(radius: number, color: number): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), basicMaterial(color, 0));
  scene.add(mesh);
  return mesh;
}

function makeLine(color = GRAPHITE, maxPoints = 32): { line: THREE.Line; positions: Float32Array } {
  const positions = new Float32Array(maxPoints * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setDrawRange(0, 2);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0 });
  const line = new THREE.Line(geometry, material);
  scene.add(line);
  return { line, positions };
}

function setLinePoints(
  obj: { line: THREE.Line; positions: Float32Array },
  pts: Array<[number, number]>,
  opacity = 1
): void {
  const n = Math.min(pts.length, obj.positions.length / 3);
  for (let i = 0; i < n; i++) {
    obj.positions[i * 3] = pts[i][0];
    obj.positions[i * 3 + 1] = pts[i][1];
    obj.positions[i * 3 + 2] = 0;
  }
  obj.line.geometry.setDrawRange(0, n);
  (obj.line.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  (obj.line.material as THREE.LineBasicMaterial).opacity = opacity;
}

function hideLine(obj: { line: THREE.Line }): void {
  (obj.line.material as THREE.LineBasicMaterial).opacity = 0;
}

function setOpacity(obj: THREE.Object3D, opacity: number): void {
  const material = (obj as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
  if (material) material.opacity = clamp01(opacity);
}

const backdrop = new Backdrop();
scene.add(backdrop.mesh);

const a = makeNode(-280, 0);
const b = makeNode(280, 0);

const mainThread = makeLine(SIGNAL, 40);

const backgroundNodes = [
  makeNode(-680, 260, 8, GRAPHITE),
  makeNode(-520, -300, 8, GRAPHITE),
  makeNode(-120, 330, 8, GRAPHITE),
  makeNode(180, -310, 8, GRAPHITE),
  makeNode(560, 270, 8, GRAPHITE),
  makeNode(720, -180, 8, GRAPHITE)
];
const backgroundLinks = [
  makeLine(GRAPHITE), makeLine(GRAPHITE), makeLine(GRAPHITE),
  makeLine(GRAPHITE), makeLine(GRAPHITE), makeLine(GRAPHITE)
];
const backgroundPairs: Array<[THREE.Mesh, THREE.Mesh]> = [
  [backgroundNodes[0], backgroundNodes[2]],
  [backgroundNodes[1], backgroundNodes[2]],
  [backgroundNodes[2], a],
  [b, backgroundNodes[4]],
  [backgroundNodes[3], b],
  [backgroundNodes[4], backgroundNodes[5]]
];

// Help plate
const obstacle = makeLine(ASH, 4);
const route = makeLine(SIGNAL, 8);
const helper = makeNode(-500, -180, 11, SIGNAL);

// Share plate
const resource = makeCircle(48, BONE);
const shareLeft = makeCircle(26, SIGNAL);
const shareRight = makeCircle(26, SIGNAL);
const shareRelation = makeLine(SIGNAL, 4);

// Comfort plate
const comfortWave = makeLine(SIGNAL, 64);
const regulationAxis = makeLine(GRAPHITE, 4);

// Truth plate
const truthPath = makeLine(ASH, 8);
const truthCore = makeLine(SIGNAL, 8);
const truthSignal = makeCircle(11, SIGNAL);
const resistance = makeLine(GRAPHITE, 8);

// Emergence / trust / strength sequence
const networkExtraLinks = [
  makeLine(GRAPHITE), makeLine(GRAPHITE), makeLine(GRAPHITE),
  makeLine(GRAPHITE), makeLine(GRAPHITE), makeLine(GRAPHITE)
];
const loadSignal = makeCircle(14, SIGNAL);
const strainEdge = makeLine(SIGNAL, 32);
const engineeringAxis = makeLine(GRAPHITE, 8);

// Explicit maintenance verbs
const listenWave1 = makeLine(SIGNAL, 48);
const listenWave2 = makeLine(GRAPHITE, 48);
const repairLeft = makeLine(SIGNAL, 8);
const repairRight = makeLine(SIGNAL, 8);
const repairScar = makeLine(ASH, 8);

// Final third
const fractureLinks = [makeLine(SIGNAL), makeLine(SIGNAL), makeLine(SIGNAL)];
const familyLinks = [makeLine(SIGNAL), makeLine(SIGNAL), makeLine(SIGNAL), makeLine(SIGNAL)];
const lonelyHalo = makeCircle(110, GRAPHITE);
const rediscoveryLinks = [makeLine(SIGNAL), makeLine(SIGNAL), makeLine(SIGNAL), makeLine(SIGNAL)];
const returnGhostLinks = [makeLine(GRAPHITE), makeLine(GRAPHITE), makeLine(GRAPHITE)];

// The yarn-and-buttons world, between the painted backdrop and the lyrics.
const threadLayer = new ThreadLayer(document.querySelector('#app')!);

const textLayer = document.createElement('div');
textLayer.id = 'lyrics';
document.querySelector('#app')!.appendChild(textLayer);

const annotation = document.createElement('div');
annotation.id = 'annotation';
document.querySelector('#app')!.appendChild(annotation);

const plateLabel = document.createElement('div');
plateLabel.id = 'plate-label';
document.querySelector('#app')!.appendChild(plateLabel);

const centerTitle = document.createElement('div');
centerTitle.id = 'center-title';
document.querySelector('#app')!.appendChild(centerTitle);

const kineticLayer = document.createElement('div');
kineticLayer.id = 'kinetic-lyrics';
document.querySelector('#app')!.appendChild(kineticLayer);

// The paper edge of the record sleeve, shown around the title card at the start and the end.
const sleeve = document.createElement('div');
sleeve.id = 'sleeve';
document.querySelector('#app')!.appendChild(sleeve);

const grain = new Grain(document.querySelector('#app')!);

const audio = new Audio('/Kindness Is Not Magic 1.mp3');
audio.preload = 'auto';

const query = new URLSearchParams(location.search);
const requestedTime = Number(query.get('t') ?? '0');
const renderMode = query.get('render') === '1';

audio.addEventListener('loadedmetadata', () => {
  if (Number.isFinite(requestedTime) && requestedTime > 0) {
    audio.currentTime = Math.min(requestedTime, audio.duration);
  }
});

window.addEventListener('keydown', async (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    if (audio.paused) await audio.play();
    else audio.pause();
  }
  if (event.code === 'ArrowRight') {
    audio.currentTime = Math.min(audio.duration || Infinity, audio.currentTime + (event.shiftKey ? 5 : 1));
  }
  if (event.code === 'ArrowLeft') {
    audio.currentTime = Math.max(0, audio.currentTime - (event.shiftKey ? 5 : 1));
  }
});

function lineHTML(line: LineTiming, t: number): string {
  const openingBreak =
    line === opening1 ? 2 :
    line === opening2 ? 3 :
    line === opening3 ? 3 :
    line === helpLine ? 3 :
    line === truthLine ? 4 :
    -1;

  return line.words
    .map((word, i) => {
      const p = wordProgress(word, t);
      const active = p > 0 && p < 1;
      const done = p >= 1;
      const span = `<span class="${active ? 'word active' : done ? 'word done' : 'word'}">${word.w}</span>`;
      return openingBreak === i + 1 ? span + '<br>' : span;
    })
    .join(' ');
}


type KineticMode =
  | 'opening' | 'name' | 'reveal'
  | 'help' | 'share' | 'comfort' | 'truth'
  | 'spark' | 'closer' | 'grow' | 'stronger'
  | 'label' | 'notmagic' | 'easy'
  | 'sharing' | 'listening' | 'saying'
  | 'wrong' | 'or' | 'forgive'
  | 'failure' | 'without' | 'drift'
  | 'break' | 'family' | 'lonely'
  | 'rediscover' | 'again' | 'together'
  | 'return' | 'beautiful' | 'possible';

type KineticLayout = {
  rows: number[] | null;
  maxSpread: number;
  maxScale: number;
  fontVW: number;
  gapEm: number;
};

const kineticLayouts: Record<KineticMode, KineticLayout> = {
  opening:    { rows: [2], maxSpread: 42, maxScale: 1.48, fontVW: 7.2, gapEm: 0.20 },
  name:       { rows: [3], maxSpread: 40, maxScale: 1.42, fontVW: 6.8, gapEm: 0.20 },
  reveal:     { rows: [3], maxSpread: 42, maxScale: 1.38, fontVW: 6.6, gapEm: 0.19 },
  help:       { rows: [3], maxSpread: 58, maxScale: 1.32, fontVW: 6.8, gapEm: 0.22 },
  share:      { rows: null, maxSpread: 62, maxScale: 1.18, fontVW: 7.2, gapEm: 0.24 },
  comfort:    { rows: null, maxSpread: 20, maxScale: 1.14, fontVW: 7.0, gapEm: 0.22 },
  truth:      { rows: [4], maxSpread: 42, maxScale: 1.28, fontVW: 5.5, gapEm: 0.16 },
  spark:      { rows: null, maxSpread: 38, maxScale: 1.55, fontVW: 6.8, gapEm: 0.20 },
  closer:     { rows: null, maxSpread: 70, maxScale: 1.30, fontVW: 7.1, gapEm: 0.20 },
  grow:       { rows: null, maxSpread: 36, maxScale: 1.72, fontVW: 8.2, gapEm: 0.26 },
  stronger:   { rows: [3], maxSpread: 44, maxScale: 1.52, fontVW: 6.3, gapEm: 0.18 },
  label:      { rows: null, maxSpread: 32, maxScale: 1.62, fontVW: 8.0, gapEm: 0.22 },
  notmagic:   { rows: null, maxSpread: 34, maxScale: 1.42, fontVW: 7.8, gapEm: 0.22 },
  easy:       { rows: [4], maxSpread: 26, maxScale: 1.28, fontVW: 5.9, gapEm: 0.16 },
  sharing:    { rows: [3], maxSpread: 64, maxScale: 1.34, fontVW: 6.4, gapEm: 0.18 },
  listening:  { rows: [3], maxSpread: 20, maxScale: 1.30, fontVW: 6.4, gapEm: 0.18 },
  saying:     { rows: [3], maxSpread: 30, maxScale: 1.34, fontVW: 6.2, gapEm: 0.18 },
  wrong:      { rows: null, maxSpread: 36, maxScale: 1.58, fontVW: 8.0, gapEm: 0.22 },
  or:         { rows: null, maxSpread: 20, maxScale: 1.18, fontVW: 6.0, gapEm: 0.20 },
  forgive:    { rows: null, maxSpread: 68, maxScale: 1.48, fontVW: 7.4, gapEm: 0.22 },
  failure:    { rows: [4], maxSpread: 28, maxScale: 1.30, fontVW: 5.7, gapEm: 0.16 },
  without:    { rows: null, maxSpread: 34, maxScale: 1.32, fontVW: 6.9, gapEm: 0.20 },
  drift:      { rows: null, maxSpread: 86, maxScale: 1.30, fontVW: 7.0, gapEm: 0.22 },
  break:      { rows: null, maxSpread: 84, maxScale: 1.42, fontVW: 8.2, gapEm: 0.24 },
  family:     { rows: null, maxSpread: 88, maxScale: 1.36, fontVW: 7.2, gapEm: 0.22 },
  lonely:     { rows: [3], maxSpread: 72, maxScale: 1.48, fontVW: 6.2, gapEm: 0.18 },
  rediscover: { rows: [4], maxSpread: 28, maxScale: 1.34, fontVW: 5.9, gapEm: 0.16 },
  again:      { rows: null, maxSpread: 28, maxScale: 1.45, fontVW: 7.5, gapEm: 0.24 },
  together:   { rows: [4], maxSpread: 72, maxScale: 1.38, fontVW: 5.9, gapEm: 0.16 },
  return:     { rows: [3], maxSpread: 40, maxScale: 1.42, fontVW: 6.5, gapEm: 0.19 },
  beautiful:  { rows: null, maxSpread: 34, maxScale: 1.62, fontVW: 7.2, gapEm: 0.20 },
  possible:   { rows: [3], maxSpread: 36, maxScale: 1.58, fontVW: 6.6, gapEm: 0.19 },
};

const lyricProjectionPlan: Array<{ line: LineTiming; mode: KineticMode }> = [
  { line: opening1, mode: 'opening' },
  { line: opening2, mode: 'name' },
  { line: opening3, mode: 'reveal' },
  { line: helpLine, mode: 'help' },
  { line: shareLine, mode: 'share' },
  { line: comfortLine, mode: 'comfort' },
  { line: truthLine, mode: 'truth' },
  { line: specialLine, mode: 'spark' },
  { line: closerLine, mode: 'closer' },
  { line: trustLine, mode: 'grow' },
  { line: strongerLine, mode: 'stronger' },
  { line: kindnessLine, mode: 'label' },
  { line: kindnessLine2, mode: 'label' },
  { line: notMagicLine, mode: 'notmagic' },
  { line: notMagicLine2, mode: 'notmagic' },
  { line: easyLine, mode: 'easy' },
  { line: meansShareLine, mode: 'sharing' },
  { line: listeningLine, mode: 'listening' },
  { line: sayingLine, mode: 'saying' },
  { line: wrongLine, mode: 'wrong' },
  { line: orLine, mode: 'or' },
  { line: forgiveLine, mode: 'forgive' },
  { line: failureLine, mode: 'failure' },
  { line: withoutLine, mode: 'without' },
  { line: driftLine, mode: 'drift' },
  { line: breakLine, mode: 'break' },
  { line: familiesLine, mode: 'family' },
  { line: lonelyLine, mode: 'lonely' },
  { line: rediscoverLine, mode: 'rediscover' },
  { line: againLine, mode: 'again' },
  { line: stayLine, mode: 'together' },
  { line: returnLine, mode: 'return' },
  { line: gaveNameLine, mode: 'name' },
  { line: beautifulLine, mode: 'beautiful' },
  { line: possibleLine, mode: 'possible' },
];

function projectionAt(t: number): { line: LineTiming; mode: KineticMode } | null {
  for (let i = 0; i < lyricProjectionPlan.length; i++) {
    const item = lyricProjectionPlan[i];
    const next = lyricProjectionPlan[i + 1]?.line.start ?? item.line.end + 0.8;
    if (t >= item.line.start - 0.12 && t < Math.min(next - 0.08, item.line.end + 0.6)) return item;
  }
  return null;
}

function splitWordsIntoRows(words: WordTiming[], breaks: number[] | null): WordTiming[][] {
  if (!breaks || breaks.length === 0) return [words];
  const out: WordTiming[][] = [];
  let start = 0;
  for (const at of breaks) {
    out.push(words.slice(start, at));
    start = at;
  }
  out.push(words.slice(start));
  return out.filter((row) => row.length > 0);
}

function getSafeBox() {
  const padX = window.innerWidth * 0.09;
  const padY = window.innerHeight * 0.11;
  return {
    left: padX,
    right: window.innerWidth - padX,
    top: padY,
    bottom: window.innerHeight - padY,
    width: window.innerWidth - 2 * padX,
    height: window.innerHeight - 2 * padY,
  };
}

function kineticWordStyle(
  line: LineTiming,
  word: WordTiming,
  index: number,
  t: number,
  mode: KineticMode,
  layout: KineticLayout
): string {
  const p = wordProgress(word, t);
  const before = t < word.start;
  const active = p > 0 && p < 1;
  const after = t >= word.end;

  let x = 0;
  let y = 0;
  let rot = 0;
  let scale = 1;
  let opacity = before ? 0.34 : 1;
  let letter = 0;
  let z = 0;

  const center = (line.words.length - 1) / 2;
  const rel = index - center;

  if (mode === 'opening') {
    const key = word.w.toLowerCase();
    x = rel * 34;
    y = Math.sin(index * 1.1) * 8;
    if (key === 'kindness') {
      scale = Math.min(layout.maxScale, 1.10 + 0.34 * p);
      y -= 16 * p;
    }
  }

  if (mode === 'name') {
    const key = word.w.toLowerCase();
    x = rel * 30;
    if (key === 'name') {
      scale = Math.min(layout.maxScale, 1.08 + 0.30 * p);
      rot = THREE.MathUtils.lerp(-8, 0, p);
      letter = 0.05 * p;
    }
  }

  if (mode === 'reveal') {
    const key = word.w.toLowerCase();
    const local = smoothstep(line.start, line.end, t);
    x = rel * 30;
    z = THREE.MathUtils.lerp(-110 + index * 18, 0, local);
    y = Math.sin(index) * 12 * (1 - local);
    if (key === 'there') scale = Math.min(layout.maxScale, 1.05 + 0.28 * p);
  }

  if (mode === 'spark') {
    const key = word.w.toLowerCase();
    x = rel * 30;
    y = -Math.abs(rel) * 8 * p;
    if (key === 'special') scale = Math.min(layout.maxScale, 1.08 + 0.38 * p);
    if (key === 'happens') rot = THREE.MathUtils.lerp(-7, 0, p);
  }

  if (mode === 'closer') {
    const local = smoothstep(line.start, line.end, t);
    x = rel * layout.maxSpread * (1 - 0.72 * local);
    scale = 1 + 0.08 * p;
  }

  if (mode === 'grow') {
    const key = word.w.toLowerCase();
    x = rel * 32;
    if (key === 'grows') {
      scale = Math.min(layout.maxScale, 1.04 + 0.58 * p);
      letter = 0.09 * p;
    }
  }

  if (mode === 'stronger') {
    const key = word.w.toLowerCase();
    x = rel * 28;
    scale = 1 + 0.04 * p;
    if (key === 'stronger') scale = Math.min(layout.maxScale, 1.08 + 0.34 * p);
  }

  if (mode === 'label') {
    const key = word.w.toLowerCase();
    x = rel * 24;
    if (key === 'kindness') scale = Math.min(layout.maxScale, 1.08 + 0.42 * p);
  }

  if (mode === 'notmagic') {
    const key = word.w.toLowerCase();
    x = rel * 24;
    if (key === 'not') scale = Math.min(layout.maxScale, 1.04 + 0.28 * p);
    if (key === 'magic') {
      rot = THREE.MathUtils.lerp(8, 0, p);
      opacity = before ? 0.28 : 0.92;
    }
  }

  if (mode === 'easy') {
    const key = word.w.toLowerCase();
    const local = smoothstep(line.start, line.end, t);
    x = rel * 22;
    y = Math.sin(t * 4 + index * 0.8) * 12 * (1 - 0.55 * local);
    rot = Math.sin(index * 1.4) * 3 * (1 - local);
    if (key === 'easy') scale = Math.min(layout.maxScale, 1.05 + 0.20 * p);
  }

  if (mode === 'sharing') {
    const centerDir = rel < 0 ? -1 : rel > 0 ? 1 : 0;
    x = centerDir * layout.maxSpread * (active || after ? 1 : 0);
    if (word.w.toLowerCase() === 'sharing') scale = Math.min(layout.maxScale, 1.06 + 0.24 * p);
  }

  if (mode === 'listening') {
    const settle = smoothstep(line.start, line.end, t);
    const jitter = (1 - settle) * layout.maxSpread;
    x = Math.sin(t * 14 + index * 1.7) * jitter;
    y = Math.cos(t * 12 + index) * jitter * 0.5;
    if (word.w.toLowerCase() === 'listening') scale = Math.min(layout.maxScale, 1.04 + 0.20 * p);
  }

  if (mode === 'saying') {
    const entry = smoothstep(word.start - 0.3, word.end, t);
    x = rel * 24;
    y = THREE.MathUtils.lerp(30, 0, entry);
    opacity = Math.max(opacity, entry);
    if (word.w.toLowerCase() === 'saying') scale = Math.min(layout.maxScale, 1.05 + 0.18 * p);
  }

  if (mode === 'wrong') {
    const key = word.w.toLowerCase();
    x = rel * 34;
    rot = THREE.MathUtils.lerp(-10, 0, smoothstep(line.start, line.end, t));
    if (key === 'wrong') {
      scale = Math.min(layout.maxScale, 1.08 + 0.34 * p);
      y -= 12 * p;
    }
  }

  if (mode === 'or') {
    x = 0;
    scale = 0.88 + 0.16 * p;
  }

  if (mode === 'forgive') {
    const local = smoothstep(line.start, line.end, t);
    x = rel * layout.maxSpread * (1 - 0.72 * local);
    if (word.w.toLowerCase() === 'forgive') scale = Math.min(layout.maxScale, 1.06 + 0.28 * p);
  }

  if (mode === 'failure') {
    const key = word.w.toLowerCase();
    x = rel * 20;
    y = Math.sin(index * 1.2) * 8;
    if (key === 'win') scale = Math.min(layout.maxScale, 1.04 + 0.18 * p);
    if (key === 'away') x += 26 * p;
  }

  if (mode === 'without') {
    const key = word.w.toLowerCase();
    x = rel * 28;
    if (key === 'kindness' && after) opacity = 0.44;
  }

  if (mode === 'drift') {
    const local = smoothstep(line.start, line.end, t);
    x = rel * layout.maxSpread * local;
    y = rel * 5 * local;
  }

  if (mode === 'break') {
    const local = smoothstep(line.start, line.end, t);
    const dir = rel < 0 ? -1 : rel > 0 ? 1 : 0;
    x = dir * layout.maxSpread * local;
    rot = dir * 7 * local;
    if (word.w.toLowerCase() === 'break') scale = Math.min(layout.maxScale, 1.05 + 0.28 * p);
  }

  if (mode === 'family') {
    const local = smoothstep(line.start, line.end, t);
    const dir = rel < 0 ? -1 : rel > 0 ? 1 : 0;
    x = dir * layout.maxSpread * local;
    y = Math.abs(rel) * 8 * local;
    if (word.w.toLowerCase() === 'apart') scale = Math.min(layout.maxScale, 1.04 + 0.22 * p);
  }

  if (mode === 'lonely') {
    const key = word.w.toLowerCase();
    const local = smoothstep(line.start, line.end, t);
    x = rel * layout.maxSpread * local;
    if (key !== 'lonelier') opacity *= THREE.MathUtils.lerp(1, 0.58, local);
    if (key === 'lonelier') scale = Math.min(layout.maxScale, 1.06 + 0.34 * p);
  }

  if (mode === 'rediscover') {
    x = rel * 22;
    y = Math.sin(t * 5.5 + index * 1.25) * 10;
    if (word.w.toLowerCase() === 'kindness') scale = Math.min(layout.maxScale, 1.05 + 0.24 * p);
  }

  if (mode === 'again') {
    const beat = nearestBeatPulse(t, 0.18);
    x = rel * 26;
    scale = Math.min(layout.maxScale, 1 + 0.18 * beat + 0.08 * p);
    y = Math.sin(t * 6 + index) * 5;
  }

  if (mode === 'together') {
    const local = smoothstep(line.start, line.end, t);
    x = rel * layout.maxSpread * (1 - 0.76 * local);
    if (word.w.toLowerCase() === 'together') scale = Math.min(layout.maxScale, 1.06 + 0.28 * p);
  }

  if (mode === 'return') {
    const key = word.w.toLowerCase();
    x = rel * 30;
    if (key === 'kindness') scale = Math.min(layout.maxScale, 1.06 + 0.30 * p);
  }

  if (mode === 'beautiful') {
    x = rel * 28;
    if (word.w.toLowerCase() === 'beautiful') {
      scale = Math.min(layout.maxScale, 1.06 + 0.38 * p);
      letter = 0.035 * p;
    }
  }

  if (mode === 'possible') {
    const key = word.w.toLowerCase();
    const local = smoothstep(line.start, line.end, t);
    x = rel * 26;
    z = THREE.MathUtils.lerp(-100 + index * 14, 0, local);
    if (key === 'possible') scale = Math.min(layout.maxScale, 1.06 + 0.36 * p);
  }

  if (mode === 'help') {
    const helpsIndex = line.words.findIndex((w) => w.w.toLowerCase() === 'helps');
    const anchor = index - helpsIndex;
    x = anchor * Math.min(layout.maxSpread, 58);
    y = Math.abs(anchor) * 11;

    if (index === helpsIndex) {
      scale = Math.min(layout.maxScale, 1.08 + 0.24 * p);
      y -= 13 * p;
      letter = 0.012 * p;
    } else {
      const approach = smoothstep(word.start - 0.35, word.end, t);
      x *= 1 - 0.18 * approach;
    }
  }

  if (mode === 'share') {
    const dir = rel < 0 ? -1 : rel > 0 ? 1 : 0;
    const spread = active || after ? 1 : 0;
    x = dir * layout.maxSpread * spread;
    y = dir === 0 ? -12 * p : 8 * Math.sin((index + 1) * 1.7);
    scale = index === 0
      ? Math.min(layout.maxScale, 1.06 + 0.11 * p)
      : Math.min(layout.maxScale, 1 + 0.05 * p);
    letter = 0.014 * p;
  }

  if (mode === 'comfort') {
    const settle = smoothstep(line.start, line.end, t);
    const jitter = (1 - settle) * layout.maxSpread;
    x = Math.sin(t * 18 + index * 2.3) * jitter;
    y = Math.cos(t * 15 + index * 1.9) * jitter * 0.62;
    rot = Math.sin(t * 13 + index) * 3.2 * (1 - settle);
    scale = Math.min(layout.maxScale, 1 + (index === 0 ? 0.10 : 0.05) * p);
    letter = 0.014 * settle;
  }

  if (mode === 'truth') {
    const key = word.w.toLowerCase();
    const local = smoothstep(line.start, line.end, t);
    x = rel * layout.maxSpread;
    y = Math.sin(index * 0.9) * 10 * (1 - local);
    rot = THREE.MathUtils.lerp(index % 2 ? -5 : 5, 0, local);
    z = THREE.MathUtils.lerp(-70 + index * 10, 0, local);

    if (key === 'truth') {
      scale = Math.min(layout.maxScale, 1.08 + 0.20 * p);
      y -= 18 * p;
    }
    if (key === 'hard') {
      scale = Math.min(layout.maxScale, 1.04 + 0.14 * p);
      rot = THREE.MathUtils.lerp(10, 0, p);
    }
  }

  if (active) opacity = 1;
  if (after) opacity = 0.96;

  const color = active ? CSS.gold : after ? CSS.cream : CSS.paper;
  // scale() does not take part in layout: give an enlarged word the extra room it needs on each
  // side, about half its growth (Fraunces runs ~0.55em per letter at this weight)
  const room = Math.max(0, scale - 1) * 0.5 * word.w.length * 0.55;
  return [
    `margin: 0 ${room}em`,
    `transform: translate3d(${x}px,${y}px,${z}px) rotate(${rot}deg) scale(${scale})`,
    `opacity:${opacity}`,
    `letter-spacing:${letter}em`,
    `color:${color}`
  ].join(';');
}

function fitKineticContentToSafeArea(content: HTMLElement): void {
  const words = Array.from(content.querySelectorAll<HTMLElement>('.kinetic-word'));
  if (words.length === 0) return;

  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;

  for (const word of words) {
    const r = word.getBoundingClientRect();
    left = Math.min(left, r.left);
    right = Math.max(right, r.right);
    top = Math.min(top, r.top);
    bottom = Math.max(bottom, r.bottom);
  }

  const width = Math.max(1, right - left);
  const height = Math.max(1, bottom - top);
  const safe = getSafeBox();

  const fitScale = Math.min(1, safe.width / width, safe.height / height);
  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  const safeCx = safe.left + safe.width / 2;
  const safeCy = safe.top + safe.height / 2;

  const dx = (safeCx - cx) / Math.max(0.001, fitScale);
  const dy = (safeCy - cy) / Math.max(0.001, fitScale);

  content.style.transform = `translate(${dx}px, ${dy}px) scale(${fitScale})`;
}

function renderKineticTypography(line: LineTiming, t: number, mode: KineticMode): void {
  textLayer.innerHTML = '';
  plateLabel.textContent = '';
  annotation.textContent = '';
  annotation.style.opacity = '0';

  const layout = kineticLayouts[mode];
  const progress = smoothstep(line.start - 0.2, line.end + 0.2, t);
  const rows = splitWordsIntoRows(line.words, layout.rows);

  kineticLayer.className = `kinetic mode-${mode}`;
  kineticLayer.style.opacity = String(
    smoothstep(line.start - 0.18, line.start + 0.05, t) *
    (1 - smoothstep(line.end + 0.15, line.end + 0.45, t))
  );
  kineticLayer.style.setProperty('--kinetic-font-vw', `${layout.fontVW}vw`);
  // + 0.1em: the ink outline grows outward and would otherwise eat into the gap
  kineticLayer.style.setProperty('--kinetic-gap-em', `${layout.gapEm + 0.1}em`);

  const rowHTML = rows.map((row) => {
    const wordsHTML = row.map((word) => {
      const globalIndex = line.words.indexOf(word);
      const style = kineticWordStyle(line, word, globalIndex, t, mode, layout);
      return `<span class="kinetic-word" style="${style}">${word.w}</span>`;
    }).join('');
    return `<div class="kinetic-row">${wordsHTML}</div>`;
  }).join('');

  kineticLayer.innerHTML = `<div class="kinetic-content">${rowHTML}</div>`;

  const tilt =
    mode === 'truth' ? THREE.MathUtils.lerp(-6, 0, progress) :
    mode === 'comfort' ? Math.sin(t * 1.8) * 0.9 * (1 - progress) :
    0;

  const depth =
    mode === 'help' ? THREE.MathUtils.lerp(0.97, 1.02, progress) :
    mode === 'share' ? THREE.MathUtils.lerp(0.96, 1.03, progress) :
    1;

  kineticLayer.style.transform = `perspective(900px) rotateX(${tilt}deg) scale(${depth})`;

  const content = kineticLayer.querySelector<HTMLElement>('.kinetic-content');
  if (content) fitKineticContentToSafeArea(content);
}

function activeLyric(t: number): LineTiming | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextStart = lines[i + 1]?.start ?? Infinity;
    const holdUntil = Math.min(line.end + 0.9, nextStart - 0.12);
    if (t >= line.start - 0.12 && t < holdUntil) return line;
  }
  return null;
}

function updateText(t: number): void {
  kineticLayer.innerHTML = '';
  kineticLayer.style.opacity = '0';
  kineticLayer.className = '';
  const line = activeLyric(t);
  textLayer.innerHTML = line ? lineHTML(line, t) : '';

  const nameWord = opening2.words.find((w) => w.w.toLowerCase() === 'name');
  if (nameWord && t >= nameWord.start && t < opening3.start) {
    annotation.textContent = 'name assigned later';
    annotation.style.opacity = String(smoothstep(nameWord.start, nameWord.start + 0.35, t));
  } else {
    annotation.style.opacity = '0';
  }

  if (t >= helpLine.start && t < shareLine.start) plateLabel.textContent = 'help';
  else if (t >= shareLine.start && t < comfortLine.start) plateLabel.textContent = 'share';
  else if (t >= comfortLine.start && t < truthLine.start) plateLabel.textContent = 'comfort';
  else if (t >= truthLine.start && t < truthLine.end) plateLabel.textContent = 'truth';
  else if (t >= specialLine.start && t < closerLine.start) plateLabel.textContent = 'PATTERN · different acts, same structure';
  else if (t >= closerLine.start && t < trustLine.start) plateLabel.textContent = 'CLOSER · distance decreases';
  else if (t >= trustLine.start && t < strongerLine.start) plateLabel.textContent = 'TRUST · edge capacity grows';
  else if (t >= strongerLine.start && t < kindnessLine.start) plateLabel.textContent = 'STRONGER · redundant paths carry load';
  else if (t >= notMagicLine.start && t < easyLine.end) plateLabel.textContent = 'NOT MAGIC · maintenance under load';
  else if (t >= meansShareLine.start && t < listeningLine.start) plateLabel.textContent = 'SHARING · distribute without severing relation';
  else if (t >= listeningLine.start && t < sayingLine.start) plateLabel.textContent = 'LISTENING · keep the channel open';
  else if (t >= sayingLine.start && t < forgiveLine.start) plateLabel.textContent = 'CORRECTION · update the model';
  else if (t >= forgiveLine.start && t < forgiveLine.end) plateLabel.textContent = 'FORGIVENESS · repair without erasing damage';
  else if (t >= failureLine.start && t < withoutLine.start) plateLabel.textContent = 'LIMITS · kindness is not immediate victory';
  else if (t >= withoutLine.start && t < driftLine.start) plateLabel.textContent = 'LOSS · remove kindness, weaken the network';
  else if (t >= driftLine.start && t < breakLine.start) plateLabel.textContent = 'DRIFT · edges lengthen past repair';
  else if (t >= breakLine.start && t < familiesLine.start) plateLabel.textContent = 'BREAK · friendships fracture';
  else if (t >= familiesLine.start && t < lonelyLine.start) plateLabel.textContent = 'FAMILY · clusters split apart';
  else if (t >= lonelyLine.start && t < rediscoverLine.start) plateLabel.textContent = 'LONELY · isolated nodes remain';
  else if (t >= rediscoverLine.start && t < stayLine.start) plateLabel.textContent = 'REDISCOVERY · connection appears again and again';
  else if (t >= stayLine.start && t < returnLine.start) plateLabel.textContent = 'WHY · together is stronger';
  else if (t >= returnLine.start && t < beautifulLine.start) plateLabel.textContent = 'RETURN · the name came later';
  else if (t >= beautifulLine.start && t < possibleLine.end) plateLabel.textContent = 'POSSIBLE · always available';
  else plateLabel.textContent = '';

  plateLabel.style.opacity = plateLabel.textContent ? '1' : '0';

  centerTitle.textContent = '';
  centerTitle.style.opacity = '0';
}

function resetPlateObjects(): void {
  [a, b, helper, resource, shareLeft, shareRight, truthSignal, loadSignal, lonelyHalo].forEach((x) => {
    setOpacity(x, 0);
    x.scale.setScalar(1);
  });
  backgroundNodes.forEach((x) => {
    setOpacity(x, 0);
    x.scale.setScalar(1);
  });
  [mainThread, ...backgroundLinks, ...networkExtraLinks, ...fractureLinks, ...familyLinks, ...rediscoveryLinks, ...returnGhostLinks, obstacle, route, shareRelation, comfortWave, regulationAxis, truthPath, truthCore, resistance, strainEdge, engineeringAxis, listenWave1, listenWave2, repairLeft, repairRight, repairScar]
    .forEach(hideLine);
  camera.zoom = 1;
  camera.position.set(0, 0, 5);
  camera.rotation.z = 0;
  lonelyHalo.scale.setScalar(1);
  centerTitle.textContent = '';
  centerTitle.style.opacity = '0';
  centerTitle.style.transform = '';
  centerTitle.classList.remove('cover');
  delete centerTitle.dataset.cover;
  sleeve.style.opacity = '0';
  annotation.textContent = '';
  annotation.style.opacity = '0';
  kineticLayer.innerHTML = '';
  kineticLayer.style.opacity = '0';
  kineticLayer.className = '';
  camera.updateProjectionMatrix();
}

const COVER_HTML =
  '<div class="cover-title"><span class="cover-big">Kindness</span> <span class="cover-small">is not</span> <span class="cover-big cover-magic">Magic</span></div>' +
  '<div class="cover-sub">Produced by Emergence</div>';

/** The record-sleeve title card: the film opens and closes on it. */
function renderCover(t: number, opacity: number): void {
  const breathe = 1 + Math.sin(t * 1.35) * 0.010 + nearestBeatPulse(t, 0.18) * 0.018;
  if (centerTitle.dataset.cover !== '1') {
    centerTitle.innerHTML = COVER_HTML;
    centerTitle.dataset.cover = '1';
  }
  centerTitle.classList.add('cover');
  centerTitle.style.opacity = String(opacity);
  centerTitle.style.transform = `scale(${breathe}) translateY(${Math.sin(t * 0.55) * 4}px)`;
}

function renderPreludeTypography(t: number): void {
  textLayer.innerHTML = '';
  plateLabel.textContent = '';
  annotation.textContent = '';
  annotation.style.opacity = '0';

  const titleIn = smoothstep(0.8, 2.4, t);
  const titleOut = 1 - smoothstep(9.6, opening1.start - 0.15, t);
  renderCover(t, titleIn * titleOut);
  sleeve.style.opacity = String(titleOut);
}

function renderOpening(t: number): void {
  // Pre-lyric musical intro: establish the visual world before the first word.
  const introFade = smoothstep(0.4, 2.8, t);
  const nodeReveal = smoothstep(3.2, 7.0, t);
  const preConnect = smoothstep(7.0, opening1.start - 0.45, t);
  const beat = nearestBeatPulse(t, 0.18);

  a.position.set(-270, 0, 0);
  b.position.set(270, 0, 0);

  const sungAppear = smoothstep(opening1.start, opening1.words[0].end, t);
  const nodeOpacity = Math.max(nodeReveal * 0.9, sungAppear);
  setOpacity(a, nodeOpacity);
  setOpacity(b, nodeOpacity);

  const breathe = 1 + beat * 0.055 + Math.sin(t * 1.35) * 0.012 * introFade;
  a.scale.setScalar(breathe);
  b.scale.setScalar(breathe);

  // The relationship exists before the word "kindness" arrives.
  const kindness = opening1.words.find((w) => w.w.toLowerCase() === 'kindness')!;
  const sungConnect = smoothstep(opening1.words[1].start, kindness.end, t);
  const connect = Math.max(preConnect * 0.72, sungConnect);

  setLinePoints(mainThread, [
    [a.position.x, a.position.y],
    [THREE.MathUtils.lerp(a.position.x, b.position.x, connect), b.position.y]
  ], smoothstep(6.8, 8.0, t) * 0.9);

  // A faint world emerges during the humming intro.
  const introPositions: Array<[number, number]> = [
    [-610, 220], [-520, -245], [-120, 300],
    [155, -285], [555, 230], [660, -155]
  ];
  backgroundNodes.forEach((node, i) => {
    node.position.set(introPositions[i][0], introPositions[i][1], 0);
    const stagger = smoothstep(5.0 + i * 0.45, 8.8 + i * 0.35, t);
    setOpacity(node, stagger * 0.28);
    node.scale.setScalar(1 + Math.sin(t * 0.9 + i) * 0.035);
  });

  // Title appears briefly in the instrumental/hummed introduction.
  const titleIn = smoothstep(1.2, 2.5, t);
  const titleOut = smoothstep(7.5, 9.6, t);
  if (t < opening1.start - 0.6) {
    centerTitle.textContent = 'KINDNESS IS NOT MAGIC';
    centerTitle.style.opacity = String(titleIn * (1 - titleOut) * 0.92);
    annotation.textContent = 'produced by emergence';
    annotation.style.opacity = String(smoothstep(2.4, 3.2, t) * (1 - smoothstep(8.0, 9.6, t)) * 0.72);
  }

  // On "already there", reveal that the pair sits inside a larger pre-existing network.
  const reveal = smoothstep(opening3.words[1].start, opening3.end, t);
  const cameraPull = smoothstep(opening3.start, opening3.end, t);
  camera.zoom = THREE.MathUtils.lerp(1.08, 0.82, cameraPull);
  camera.updateProjectionMatrix();

  backgroundNodes.forEach((node, i) => {
    const base = smoothstep(5.0 + i * 0.45, 8.8 + i * 0.35, t) * 0.28;
    setOpacity(node, Math.max(base, Math.max(0, reveal - i * 0.08) * 0.85));
  });

  backgroundPairs.forEach(([from, to], i) => {
    const p = clamp01((reveal - 0.16 - i * 0.07) * 2);
    if (p > 0) {
      setLinePoints(backgroundLinks[i], [
        [from.position.x, from.position.y],
        [
          THREE.MathUtils.lerp(from.position.x, to.position.x, p),
          THREE.MathUtils.lerp(from.position.y, to.position.y, p)
        ]
      ], p * 0.42);
    }
  });
}
function renderHelp(t: number): void {
  const p = smoothstep(helpLine.start, helpLine.end, t);
  const helps = helpLine.words.find((w) => w.w.toLowerCase() === 'helps')!;
  const helpP = wordProgress(helps, t);
  const beat = nearestBeatPulse(t);

  a.position.set(-520, -110, 0);
  b.position.set(520, 110, 0);
  helper.position.set(
    THREE.MathUtils.lerp(-700, -560, smoothstep(helpLine.start, helps.start, t)),
    -250,
    0
  );

  setOpacity(a, 1);
  setOpacity(b, 1);
  setOpacity(helper, smoothstep(helpLine.start, helps.start, t));

  a.scale.setScalar(1 + beat * 0.12);
  b.scale.setScalar(1 + beat * 0.08);
  helper.scale.setScalar(1 + beat * 0.16);

  setLinePoints(obstacle, [[0, -300], [0, 170]], 0.34);

  const routeP = smoothstep(helps.start, helpLine.end, t);
  const peak = THREE.MathUtils.lerp(0, 300, helpP);
  const pts: Array<[number, number]> = [
    [-520, -110],
    [-210, -110],
    [-110, peak],
    [110, peak],
    [210, 110],
    [520, 110]
  ];
  const visibleCount = Math.max(2, Math.min(pts.length, 2 + Math.floor(routeP * (pts.length - 1))));
  setLinePoints(route, pts.slice(0, visibleCount), 0.82);

  // The helper physically closes the final gap to the route on "helps".
  if (helpP > 0) {
    setLinePoints(mainThread, [
      [helper.position.x, helper.position.y],
      [-210, -110]
    ], helpP);
  }

  // slight camera move gives the route room to become the image
  camera.zoom = THREE.MathUtils.lerp(0.98, 0.9, p);
  camera.updateProjectionMatrix();
}

function renderShare(t: number): void {
  const p = smoothstep(shareLine.start, shareLine.end, t);
  const shares = shareLine.words[0];
  const split = wordProgress(shares, t);
  const beat = nearestBeatPulse(t);

  a.position.set(-430, 0, 0);
  b.position.set(430, 0, 0);
  setOpacity(a, 1);
  setOpacity(b, 1);

  resource.position.set(0, 0, 0);
  setOpacity(resource, 1 - split);

  shareLeft.position.set(THREE.MathUtils.lerp(0, -250, split), 0, 0);
  shareRight.position.set(THREE.MathUtils.lerp(0, 250, split), 0, 0);
  setOpacity(shareLeft, split);
  setOpacity(shareRight, split);

  const s = 1 + beat * 0.18;
  shareLeft.scale.setScalar(s);
  shareRight.scale.setScalar(s);

  setLinePoints(shareRelation, [[a.position.x, 0], [b.position.x, 0]], smoothstep(0.45, 1, p) * 0.72);
}

function renderComfort(t: number): void {
  const local = smoothstep(comfortLine.start, comfortLine.end, t);
  const comforts = comfortLine.words[0];
  const connect = wordProgress(comforts, t);
  const friend = comfortLine.words.find((w) => w.w.toLowerCase() === 'friend')!;
  const settled = wordProgress(friend, t);

  const amp = THREE.MathUtils.lerp(145, 18, smoothstep(0.15, 0.92, local));
  const wobble = Math.sin(t * 13.5) * amp * (1 - settled * 0.65);

  a.position.set(-420, wobble, 0);
  b.position.set(420, Math.sin(t * 4.0) * 8 * connect, 0);
  setOpacity(a, 1);
  setOpacity(b, 1);

  setLinePoints(regulationAxis, [[-650, 0], [650, 0]], 0.14);

  const pts: Array<[number, number]> = [];
  const n = 48;
  for (let i = 0; i < n; i++) {
    const q = i / (n - 1);
    const x = THREE.MathUtils.lerp(a.position.x, b.position.x, q);
    const envelope = Math.sin(Math.PI * q);
    const phase = t * 8 - q * 10;
    const waveAmp = THREE.MathUtils.lerp(85, 9, settled) * envelope;
    const y = THREE.MathUtils.lerp(a.position.y, b.position.y, q) + Math.sin(phase) * waveAmp * connect;
    pts.push([x, y]);
  }
  setLinePoints(comfortWave, pts, connect * 0.82);

  const beat = nearestBeatPulse(t);
  a.scale.setScalar(1 + beat * 0.10);
  b.scale.setScalar(1 + beat * 0.10);
}

function renderTruth(t: number): void {
  const truthWord = truthLine.words.find((w) => w.w.toLowerCase() === 'truth')!;
  const hardWord = truthLine.words.find((w) => w.w.toLowerCase() === 'hard')!;
  const signalP = smoothstep(truthLine.words[1].start, truthWord.end, t);
  const straighten = smoothstep(truthWord.end, hardWord.end, t);
  const arrival = smoothstep(0.78, 1, signalP);

  a.position.set(-520, 0, 0);
  b.position.set(520 + Math.sin(t * 24) * 24 * arrival * (1 - straighten), 0, 0);
  setOpacity(a, 1);
  setOpacity(b, 1);

  const bend = THREE.MathUtils.lerp(230, 25, straighten);
  const pathPts: Array<[number, number]> = [
    [-520, 0],
    [-260, 0],
    [-80, bend],
    [80, -bend],
    [260, 0],
    [520, 0]
  ];
  setLinePoints(truthPath, pathPts, 0.28);

  // resistance is visible as a narrow gate the signal has to pass
  setLinePoints(resistance, [[-45, -220], [-45, 70], [45, -70], [45, 220]], 0.26 * (1 - straighten));

  // signal follows the bent route approximately, then reaches the receiver
  const x = THREE.MathUtils.lerp(-520, 520, signalP);
  const q = signalP;
  const y = Math.sin(q * Math.PI * 2) * bend * Math.sin(Math.PI * q);
  truthSignal.position.set(x, y, 0);
  setOpacity(truthSignal, smoothstep(0.02, 0.12, signalP) * (1 - smoothstep(0.98, 1, signalP)));

  // stronger channel appears underneath after the difficult signal has landed
  setLinePoints(truthCore, [[-520, 0], [520, 0]], straighten * 0.82);
}
function networkLayout(scale = 1): Array<THREE.Mesh> {
  const nodes = [a, b, ...backgroundNodes];
  const targets: Array<[number, number]> = [
    [-420, 0], [420, 0],
    [-300, 250], [-300, -250], [-90, 145],
    [90, -145], [300, 250], [300, -250]
  ];
  nodes.forEach((node, i) => {
    node.position.set(targets[i][0] * scale, targets[i][1] * scale, 0);
    setOpacity(node, 1);
  });
  return nodes;
}

function drawNetwork(nodes: Array<THREE.Mesh>, opacity: number, redundancy: number): void {
  const pairs: Array<[number, number]> = [
    [0,2],[0,3],[0,4],[4,2],[4,5],[5,1],
    [1,6],[1,7],[5,6],[3,5],[2,6],[3,7]
  ];
  const all = [...backgroundLinks, ...networkExtraLinks];
  all.forEach((link, i) => {
    const [u, v] = pairs[i];
    const extra = i >= 6;
    const op = opacity * (extra ? redundancy : 1);
    setLinePoints(link, [
      [nodes[u].position.x, nodes[u].position.y],
      [nodes[v].position.x, nodes[v].position.y]
    ], op);
  });
}

function renderEmergence(t: number): void {
  const nodes = networkLayout(1.18);
  const p = smoothstep(specialLine.start, specialLine.end, t);

  // Four pairs appear in different places, then become visually identical.
  const pairLinks = [backgroundLinks[0], backgroundLinks[1], backgroundLinks[2], backgroundLinks[3]];
  const pairIndices: Array<[number, number]> = [[0,2],[3,4],[5,1],[6,7]];
  pairLinks.forEach((link, i) => {
    const [u,v] = pairIndices[i];
    const reveal = clamp01(p * 1.6 - i * 0.18);
    setLinePoints(link, [
      [nodes[u].position.x, nodes[u].position.y],
      [nodes[v].position.x, nodes[v].position.y]
    ], reveal);
  });

  // As "special happens" completes, differences collapse into one grammar.
  const pulse = nearestBeatPulse(t);
  nodes.forEach((n, i) => n.scale.setScalar(1 + pulse * (i % 2 ? 0.07 : 0.11) * p));
  camera.zoom = THREE.MathUtils.lerp(0.86, 0.78, p);
  camera.updateProjectionMatrix();
}

function renderCloser(t: number): void {
  const closer = closerLine.words.find((w) => w.w.toLowerCase() === 'closer')!;
  const p = wordProgress(closer, t);
  const scale = THREE.MathUtils.lerp(1.18, 0.82, p);
  const nodes = networkLayout(scale);
  drawNetwork(nodes, 0.72, 0.0);
  camera.zoom = THREE.MathUtils.lerp(0.78, 0.9, p);
  camera.updateProjectionMatrix();
}

function renderTrust(t: number): void {
  const grows = trustLine.words.find((w) => w.w.toLowerCase() === 'grows')!;
  const p = wordProgress(grows, t);
  const nodes = networkLayout(0.82);
  drawNetwork(nodes, THREE.MathUtils.lerp(0.34, 0.95, p), p * 0.35);

  // Capacity is represented by parallel nearby traces rather than glow.
  backgroundLinks.slice(0, 4).forEach((link, i) => {
    const from = nodes[[0,3,5,1][i]];
    const to = nodes[[2,4,1,6][i]];
    const off = 8 + p * 10;
    setLinePoints(networkExtraLinks[i], [
      [from.position.x, from.position.y + off],
      [to.position.x, to.position.y + off]
    ], p * 0.55);
  });
}

function renderStronger(t: number): void {
  const stronger = strongerLine.words.find((w) => w.w.toLowerCase() === 'stronger')!;
  const p = smoothstep(strongerLine.start, stronger.end, t);
  const nodes = networkLayout(0.82);
  drawNetwork(nodes, 0.9, smoothstep(0.05, 0.7, p));

  // A load enters the network; redundant routes remain available around it.
  const q = smoothstep(strongerLine.words[1].start, stronger.end, t);
  const path: Array<[number, number]> = [
    [nodes[0].position.x, nodes[0].position.y],
    [nodes[4].position.x, nodes[4].position.y],
    [nodes[5].position.x, nodes[5].position.y],
    [nodes[1].position.x, nodes[1].position.y]
  ];
  const seg = Math.min(path.length - 2, Math.floor(q * (path.length - 1)));
  const local = q * (path.length - 1) - seg;
  loadSignal.position.set(
    THREE.MathUtils.lerp(path[seg][0], path[seg + 1][0], local),
    THREE.MathUtils.lerp(path[seg][1], path[seg + 1][1], local),
    0
  );
  setOpacity(loadSignal, smoothstep(0.03, 0.12, q) * (1 - smoothstep(0.94, 1, q)));
  const beat = nearestBeatPulse(t);
  loadSignal.scale.setScalar(1 + beat * 0.3);
}

function renderKindnessReveal(t: number): void {
  const nodes = networkLayout(0.82);
  drawNetwork(nodes, 0.9, 0.85);
  const kindness = kindnessLine.words.find((w) => w.w.toLowerCase() === 'kindness')!;
  const inP = smoothstep(kindness.start - 0.45, kindness.start + 0.2, t);
  const outP = smoothstep(kindness.end - 0.35, kindness.end + 0.25, t);
  centerTitle.textContent = 'KINDNESS';
  centerTitle.style.opacity = String(inP * (1 - outP));
}

function renderNotMagic(t: number): void {
  a.position.set(-430, 0, 0);
  b.position.set(430, 0, 0);
  setOpacity(a, 1);
  setOpacity(b, 1);

  const notWord = notMagicLine.words.find((w) => w.w.toLowerCase() === 'not')!;
  const magicWord = notMagicLine.words.find((w) => w.w.toLowerCase() === 'magic')!;
  const demystify = smoothstep(notWord.start, magicWord.end, t);

  setLinePoints(engineeringAxis, [[-650,0],[650,0]], 0.22);
  setLinePoints(mainThread, [[-430,0],[430,0]], 0.92);

  centerTitle.textContent = 'NOT MAGIC';
  centerTitle.style.opacity = String(demystify * (1 - smoothstep(magicWord.end - 0.2, magicWord.end + 0.4, t)));

  annotation.textContent = 'load · signal · repair · response';
  annotation.style.opacity = String(demystify * 0.8);
}

function renderNotEasy(t: number): void {
  a.position.set(-500, 0, 0);
  b.position.set(500, 0, 0);
  setOpacity(a, 1);
  setOpacity(b, 1);

  const easy = easyLine.words.find((w) => w.w.toLowerCase() === 'easy')!;
  const local = smoothstep(easyLine.start, easy.end, t);
  const stress = Math.sin(local * Math.PI) * 210;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 24; i++) {
    const q = i / 23;
    const y = Math.sin(q * Math.PI) * stress * (0.75 + 0.25 * Math.sin(t * 7 + q * 5));
    pts.push([THREE.MathUtils.lerp(-500,500,q), y]);
  }
  setLinePoints(strainEdge, pts, 0.95);
  setLinePoints(engineeringAxis, [[-650,0],[650,0]], 0.18);

  annotation.textContent = 'maintenance under tension';
  annotation.style.opacity = '0.85';
}
function renderMeansSharing(t: number): void {
  const sharing = meansShareLine.words.find((w) => w.w.toLowerCase() === 'sharing')!;
  const p = wordProgress(sharing, t);

  a.position.set(-430, 0, 0);
  b.position.set(430, 0, 0);
  setOpacity(a, 1);
  setOpacity(b, 1);

  resource.position.set(0, 0, 0);
  setOpacity(resource, 1 - p);
  shareLeft.position.set(THREE.MathUtils.lerp(0, -260, p), 0, 0);
  shareRight.position.set(THREE.MathUtils.lerp(0, 260, p), 0, 0);
  setOpacity(shareLeft, p);
  setOpacity(shareRight, p);
  setLinePoints(shareRelation, [[-430,0],[430,0]], smoothstep(0.3,1,p));
}

function renderListening(t: number): void {
  const listening = listeningLine.words.find((w) => w.w.toLowerCase() === 'listening')!;
  const p = smoothstep(listeningLine.start, listening.end, t);

  a.position.set(-430, 0, 0);
  b.position.set(430, 0, 0);
  setOpacity(a, 1);
  setOpacity(b, 1);

  const wave = (phaseOffset: number, amp: number): Array<[number,number]> => {
    const pts: Array<[number,number]> = [];
    for (let i=0;i<40;i++) {
      const q=i/39;
      const x=THREE.MathUtils.lerp(b.position.x,a.position.x,q);
      const envelope=Math.sin(Math.PI*q);
      const y=Math.sin(t*10 + q*18 + phaseOffset)*amp*envelope*(1-0.55*p);
      pts.push([x,y]);
    }
    return pts;
  };
  setLinePoints(listenWave2,wave(Math.PI,42),0.28);
  setLinePoints(listenWave1,wave(0,70),0.9);

  // Receiver stays still; the signal is allowed to arrive.
  a.scale.setScalar(1 + nearestBeatPulse(t)*0.08*p);
}

function renderSaying(t: number): void {
  a.position.set(-360, 0, 0);
  b.position.set(360, 0, 0);
  setOpacity(a, 0.7);
  setOpacity(b, 0.7);
  setLinePoints(mainThread,[[-360,0],[360,0]],0.38);
  const saying = sayingLine.words.find((w) => w.w.toLowerCase() === 'saying')!;
  const p = wordProgress(saying,t);
  centerTitle.textContent='SAYING';
  centerTitle.style.opacity=String(p*0.7);
}

function renderWrong(t: number): void {
  const wrong = wrongLine.words.find((w) => w.w.toLowerCase() === 'wrong')!;
  const p = wordProgress(wrong,t);

  a.position.set(-420,-120,0);
  b.position.set(420,120,0);
  setOpacity(a,1);
  setOpacity(b,1);

  setLinePoints(engineeringAxis,[[-620,0],[620,0]],0.26);
  setLinePoints(mainThread,[
    [-420,-120],
    [THREE.MathUtils.lerp(0,0,p), THREE.MathUtils.lerp(150,0,p)],
    [420,120]
  ],0.95);

  camera.rotation.z = THREE.MathUtils.lerp(0.16,0,p);
  camera.updateProjectionMatrix();

  centerTitle.textContent='I WAS WRONG';
  centerTitle.style.opacity=String(smoothstep(wrong.start-0.45,wrong.start+0.15,t) * (1-smoothstep(wrong.end-0.2,wrong.end+0.3,t)));
  annotation.textContent='model updated';
  annotation.style.opacity=String(p*0.9);
}

function renderOr(t: number): void {
  a.position.set(-360,0,0);
  b.position.set(360,0,0);
  setOpacity(a,1);
  setOpacity(b,1);
  setLinePoints(repairLeft,[[-360,0],[-55,0]],0.8);
  setLinePoints(repairRight,[[55,0],[360,0]],0.8);
  setLinePoints(repairScar,[[-55,-14],[-55,14],[55,-14],[55,14]],0.6);
}

function renderForgive(t: number): void {
  const forgive = forgiveLine.words.find((w) => w.w.toLowerCase() === 'forgive')!;
  const p = wordProgress(forgive,t);

  a.position.set(-360,0,0);
  b.position.set(360,0,0);
  setOpacity(a,1);
  setOpacity(b,1);

  const gap=THREE.MathUtils.lerp(70,8,p);
  setLinePoints(repairLeft,[[-360,0],[-gap,0]],0.95);
  setLinePoints(repairRight,[[gap,0],[360,0]],0.95);

  // Scar remains even after reconnection.
  setLinePoints(repairScar,[[-10,-18],[0,18],[10,-18]],0.55 + 0.25*p);

  centerTitle.textContent='I FORGIVE YOU';
  centerTitle.style.opacity=String(smoothstep(forgive.start-0.3,forgive.start+0.2,t) * (1-smoothstep(forgiveLine.end-0.25,forgiveLine.end+0.25,t)));
  annotation.textContent='repair ≠ erasure';
  annotation.style.opacity=String(0.5 + 0.4*p);
}
function renderFailure(t: number): void {
  const away = failureLine.words.find((w) => w.w.toLowerCase() === 'away')!;
  const p = smoothstep(failureLine.start, away.end, t);

  a.position.set(-430, 0, 0);
  b.position.set(430, 0, 0);
  setOpacity(a, 1);
  setOpacity(b, 1);

  const strain = 120 + 70 * Math.sin(t * 4.8) * (1 - p * 0.4);
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 28; i++) {
    const q = i / 27;
    const x = THREE.MathUtils.lerp(-430, 430, q);
    const y = Math.sin(Math.PI * q) * strain * Math.sin(t * 6 + q * 3) * 0.25;
    pts.push([x, y]);
  }

  setLinePoints(strainEdge, pts, 0.92);
  setLinePoints(engineeringAxis, [[-620, 0], [620, 0]], 0.18);
  annotation.textContent = 'persistence ≠ immediate victory';
  annotation.style.opacity = '0.82';
}

function renderWithoutKindness(t: number): void {
  const p = smoothstep(withoutLine.start, withoutLine.end, t);
  const nodes = networkLayout(0.84);
  const fade = THREE.MathUtils.lerp(0.85, 0.18, p);
  drawNetwork(nodes, fade, 0.35 * (1 - p));
  annotation.textContent = 'remove repair → lose resilience';
  annotation.style.opacity = '0.8';
}

function renderDriftApart(t: number): void {
  const apart = driftLine.words.find((w) => w.w.toLowerCase() === 'apart')!;
  const p = smoothstep(driftLine.start, apart.end, t);

  const leftX = THREE.MathUtils.lerp(-260, -560, p);
  const rightX = THREE.MathUtils.lerp(260, 560, p);
  a.position.set(leftX, 0, 0);
  b.position.set(rightX, 0, 0);
  setOpacity(a, 1);
  setOpacity(b, 1);

  const gap = THREE.MathUtils.lerp(0, 120, smoothstep(0.58, 1, p));
  setLinePoints(fractureLinks[0], [[leftX, 0], [-gap, 0]], 0.95);
  setLinePoints(fractureLinks[1], [[gap, 0], [rightX, 0]], 0.95);
  annotation.textContent = 'distance increases faster than repair';
  annotation.style.opacity = '0.84';
}

function renderBreak(t: number): void {
  const brk = breakLine.words.find((w) => w.w.toLowerCase() === 'break')!;
  const p = smoothstep(breakLine.start, brk.end, t);

  a.position.set(-320, 140, 0);
  b.position.set(320, 140 + 120 * p, 0);
  backgroundNodes[0].position.set(0, -220, 0);

  setOpacity(a, 1);
  setOpacity(b, 1);
  setOpacity(backgroundNodes[0], 1);

  setLinePoints(fractureLinks[0], [[a.position.x, a.position.y], [b.position.x, b.position.y]], 0.9 * (1 - p));
  setLinePoints(fractureLinks[1], [[a.position.x, a.position.y], [backgroundNodes[0].position.x, backgroundNodes[0].position.y]], 0.9);
  setLinePoints(fractureLinks[2], [[backgroundNodes[0].position.x, backgroundNodes[0].position.y], [b.position.x, b.position.y]], 0.9 * (1 - 0.4 * p));
}

function renderFamiliesFall(t: number): void {
  const apart = familiesLine.words.find((w) => w.w.toLowerCase() === 'apart')!;
  const p = smoothstep(familiesLine.start, apart.end, t);

  a.position.set(-420 - 90 * p, -20 - 40 * p, 0);
  backgroundNodes[0].position.set(-300 - 60 * p, 120 - 30 * p, 0);
  backgroundNodes[1].position.set(-300 - 50 * p, -160 - 20 * p, 0);
  b.position.set(420 + 90 * p, 20 + 40 * p, 0);
  backgroundNodes[2].position.set(300 + 60 * p, 150 + 35 * p, 0);
  backgroundNodes[3].position.set(300 + 55 * p, -150 + 15 * p, 0);

  [a, b, backgroundNodes[0], backgroundNodes[1], backgroundNodes[2], backgroundNodes[3]].forEach((n) => setOpacity(n, 1));

  setLinePoints(familyLinks[0], [[a.position.x, a.position.y], [backgroundNodes[0].position.x, backgroundNodes[0].position.y]], 0.88);
  setLinePoints(familyLinks[1], [[a.position.x, a.position.y], [backgroundNodes[1].position.x, backgroundNodes[1].position.y]], 0.88);
  setLinePoints(familyLinks[2], [[b.position.x, b.position.y], [backgroundNodes[2].position.x, backgroundNodes[2].position.y]], 0.88);
  setLinePoints(familyLinks[3], [[b.position.x, b.position.y], [backgroundNodes[3].position.x, backgroundNodes[3].position.y]], 0.88);
}

function renderLonelier(t: number): void {
  const lonely = lonelyLine.words.find((w) => w.w.toLowerCase() === 'lonelier')!;
  const p = smoothstep(lonelyLine.start, lonely.end, t);

  const positions: Array<[number, number]> = [
    [-620, -180], [-420, 250], [-160, -260], [140, 260], [420, -210], [650, 110]
  ];
  const visible = [a, b, backgroundNodes[0], backgroundNodes[1], backgroundNodes[2], backgroundNodes[3]];
  visible.forEach((node, i) => {
    node.position.set(positions[i][0], positions[i][1], 0);
    setOpacity(node, THREE.MathUtils.lerp(0.92, 0.55, p));
    node.scale.setScalar(1 - 0.08 * p);
  });

  lonelyHalo.position.set(0, 0, 0);
  setOpacity(lonelyHalo, 0.08 + 0.12 * p);
  lonelyHalo.scale.setScalar(1 + 3.5 * p);
  annotation.textContent = 'alive, but disconnected';
  annotation.style.opacity = '0.8';
}

function renderRediscovery(t: number): void {
  const p = smoothstep(rediscoverLine.start, againLine.end, t);
  const pulse = nearestBeatPulse(t, 0.16);

  const nodes = networkLayout(0.95);
  const rediscoveryPairs: Array<[THREE.Mesh, THREE.Mesh]> = [
    [nodes[0], nodes[4]],
    [nodes[3], nodes[5]],
    [nodes[2], nodes[4]],
    [nodes[5], nodes[1]]
  ];

  rediscoveryPairs.forEach(([u, v], i) => {
    const local = clamp01(p * 1.25 - i * 0.18);
    const op = Math.max(0, local * 0.55 + pulse * 0.55 - i * 0.05);
    setLinePoints(rediscoveryLinks[i], [[u.position.x, u.position.y], [v.position.x, v.position.y]], op);
  });

  annotation.textContent = 'discovered again and again';
  annotation.style.opacity = '0.86';
}

function renderStayTogether(t: number): void {
  const together = stayLine.words.find((w) => w.w.toLowerCase() === 'together')!;
  const p = smoothstep(stayLine.start, together.end, t);

  const nodes = networkLayout(0.82);
  drawNetwork(nodes, 0.88, 0.82);

  const path: Array<[number, number]> = [
    [nodes[0].position.x, nodes[0].position.y],
    [nodes[4].position.x, nodes[4].position.y],
    [nodes[6].position.x, nodes[6].position.y],
    [nodes[1].position.x, nodes[1].position.y],
    [nodes[5].position.x, nodes[5].position.y],
    [nodes[3].position.x, nodes[3].position.y],
    [nodes[0].position.x, nodes[0].position.y]
  ];

  const q = clamp01(p) * (path.length - 1);
  const seg = Math.min(path.length - 2, Math.floor(q));
  const local = q - seg;
  loadSignal.position.set(
    THREE.MathUtils.lerp(path[seg][0], path[seg + 1][0], local),
    THREE.MathUtils.lerp(path[seg][1], path[seg + 1][1], local),
    0
  );
  setOpacity(loadSignal, 0.92);
  loadSignal.scale.setScalar(1 + 0.2 * nearestBeatPulse(t));
  annotation.textContent = 'the point is resilience';
  annotation.style.opacity = '0.88';
}

function renderReturn(t: number): void {
  const p = smoothstep(returnLine.start, gaveNameLine.end, t);

  a.position.set(-260, 0, 0);
  b.position.set(260, 0, 0);
  setOpacity(a, 1);
  setOpacity(b, 1);
  setLinePoints(mainThread, [[-260, 0], [260, 0]], 0.98);

  backgroundNodes[0].position.set(-520, 180, 0);
  backgroundNodes[1].position.set(-470, -180, 0);
  backgroundNodes[2].position.set(470, 180, 0);
  backgroundNodes[3].position.set(520, -180, 0);
  [backgroundNodes[0], backgroundNodes[1], backgroundNodes[2], backgroundNodes[3]].forEach((n) => setOpacity(n, 0.22 * p));

  setLinePoints(returnGhostLinks[0], [[backgroundNodes[0].position.x, backgroundNodes[0].position.y], [-260, 0]], 0.18 * p);
  setLinePoints(returnGhostLinks[1], [[-260, 0], [260, 0]], 0.14 * p);
  setLinePoints(returnGhostLinks[2], [[260, 0], [backgroundNodes[2].position.x, backgroundNodes[2].position.y]], 0.18 * p);

  annotation.textContent = 'the name came later';
  annotation.style.opacity = '0.8';
}

function renderBeautiful(t: number): void {
  const beautiful = beautifulLine.words.find((w) => w.w.toLowerCase() === 'beautiful')!;
  const possible = possibleLine.words.find((w) => w.w.toLowerCase() === 'possible')!;
  const p1 = smoothstep(beautiful.start - 0.2, beautiful.end, t);
  const p2 = smoothstep(possible.start - 0.2, possible.end, t);

  a.position.set(-260, 0, 0);
  b.position.set(260, 0, 0);
  setOpacity(a, 1);
  setOpacity(b, 1);
  setLinePoints(mainThread, [[-260, 0], [260, 0]], 1);

  const quiet: Array<[number, number]> = [
    [-520, 160], [-520, -160], [520, 160], [520, -160]
  ];
  [backgroundNodes[0], backgroundNodes[1], backgroundNodes[2], backgroundNodes[3]].forEach((n, i) => {
    n.position.set(quiet[i][0], quiet[i][1], 0);
    setOpacity(n, 0.18 * p1);
  });

  centerTitle.textContent = 'POSSIBLE';
  centerTitle.style.opacity = String(0.12 + 0.22 * p2);
  annotation.textContent = 'always there';
  annotation.style.opacity = String(0.35 + 0.35 * p2);
}

const coverReturn = possibleLine.end + 0.9;

function renderAt(t: number): void {
  resetPlateObjects();
  backdrop.update(t, nearestBeatPulse(t, 0.16));
  grain.update(t);
  threadLayer.render(t);

  // Keep the hummed/instrumental opening atmospheric.
  if (t < opening1.start) {
    renderPreludeTypography(t);
    renderer.render(scene, camera);
    return;
  }

  // From the first sung word onward, the lyrics themselves are the film.
  const projection = projectionAt(t);
  if (projection) {
    renderKineticTypography(projection.line, t, projection.mode);
  } else if (t >= coverReturn) {
    // Bookend: the film closes on the same sleeve it opened with.
    const back = smoothstep(coverReturn, coverReturn + 1.6, t);
    textLayer.innerHTML = '';
    renderCover(t, back);
    sleeve.style.opacity = String(back);
  } else {
    textLayer.innerHTML = '';
    kineticLayer.innerHTML = '';
    kineticLayer.style.opacity = '0';
  }

  renderer.render(scene, camera);
}

function resize(): void {
  const scale = Math.min(window.innerWidth / LOGICAL_W, window.innerHeight / LOGICAL_H);
  renderer.setSize(Math.floor(LOGICAL_W * scale), Math.floor(LOGICAL_H * scale), false);
  threadLayer.setDisplaySize(Math.floor(LOGICAL_W * scale), Math.floor(LOGICAL_H * scale));
}

window.addEventListener('resize', resize);
resize();

let previewClockRunning = false;
let previewClockBase = 0;
let previewClockEpoch = 0;

declare global {
  interface Window {
    __renderAt?: (t: number) => void;
    __videoReady?: boolean;
    __startPreview?: (t: number) => Promise<void>;
    __pausePreview?: () => void;
  }
}

window.__renderAt = renderAt;
window.__startPreview = async (t: number) => {
  audio.pause();
  previewClockBase = t;
  previewClockEpoch = performance.now();
  previewClockRunning = true;
  renderAt(t);
};
window.__pausePreview = () => {
  previewClockRunning = false;
  audio.pause();
};
// Renders wait for this flag, so it is only raised once the fonts are usable.
Promise.all([
  document.fonts.load('900 100px "Fraunces Variable"'),
  document.fonts.load('700 40px "Jost"'),
  document.fonts.load('500 40px "Jost"'),
]).then(() => document.fonts.ready).then(() => {
  window.__videoReady = true;
});

function frame(): void {
  const t = previewClockRunning
    ? previewClockBase + (performance.now() - previewClockEpoch) / 1000
    : (audio.currentTime || requestedTime || 0);
  renderAt(t);
  requestAnimationFrame(frame);
}

if (renderMode) {
  renderAt(requestedTime || 0);
} else {
  frame();
}

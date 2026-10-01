import * as THREE from 'three';
import lyricData from '../../data/lyrics.json';
import audioData from '../../data/audio.json';

const LOGICAL_W = 1920;
const LOGICAL_H = 1080;

type WordTiming = { w: string; start: number; end: number };
type LineTiming = { text: string; start: number; end: number; words: WordTiming[] };

const lines = (lyricData as { lines: LineTiming[] }).lines;
const beats = (audioData as { beats: number[] }).beats;

function findLine(fragment: string): LineTiming {
  const line = lines.find((x) => x.text.toLowerCase().includes(fragment.toLowerCase()));
  if (!line) throw new Error(`Missing lyric line: ${fragment}`);
  return line;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function smoothstep(a: number, b: number, x: number): number {
  const t = clamp01((x - a) / Math.max(0.0001, b - a));
  return t * t * (3 - 2 * t);
}

function wordProgress(word: WordTiming, t: number): number {
  return smoothstep(word.start, word.end, t);
}

function nearestBeatPulse(t: number, width = 0.10): number {
  let best = Infinity;
  for (const beat of beats) {
    if (beat > t + width) break;
    best = Math.min(best, Math.abs(t - beat));
  }
  return clamp01(1 - best / width);
}

const opening1 = findLine('Nobody invented kindness');
const opening2 = findLine('People gave it a name');
const opening3 = findLine('kindness was already there');
const helpLine = findLine('Whenever someone helps another person');
const shareLine = findLine('shares their food');
const comfortLine = findLine('comforts a friend');
const truthLine = findLine('tells the truth');

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x0b0b0c, 1);
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

const BONE = 0xeee9df;
const SIGNAL = 0xff7a3d;
const GRAPHITE = 0x5e5b57;
const ASH = 0x9c978f;
const DARK = 0x151517;

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

const textLayer = document.createElement('div');
textLayer.id = 'lyrics';
document.querySelector('#app')!.appendChild(textLayer);

const annotation = document.createElement('div');
annotation.id = 'annotation';
document.querySelector('#app')!.appendChild(annotation);

const plateLabel = document.createElement('div');
plateLabel.id = 'plate-label';
document.querySelector('#app')!.appendChild(plateLabel);

const audio = new Audio('/kindness-is-not-magic.wav');
audio.preload = 'auto';

const requestedTime = Number(new URLSearchParams(location.search).get('t') ?? '0');

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
  return line.words
    .map((word) => {
      const p = wordProgress(word, t);
      const active = p > 0 && p < 1;
      const done = p >= 1;
      return `<span class="${active ? 'word active' : done ? 'word done' : 'word'}">${word.w}</span>`;
    })
    .join(' ');
}

function activeLyric(t: number): LineTiming | null {
  return lines.find((line) => t >= line.start - 0.12 && t < line.end + 0.08) ?? null;
}

function updateText(t: number): void {
  const line = activeLyric(t);
  textLayer.innerHTML = line ? lineHTML(line, t) : '';

  const nameWord = opening2.words.find((w) => w.w.toLowerCase() === 'name');
  if (nameWord && t >= nameWord.start && t < opening3.start) {
    annotation.textContent = 'name assigned later';
    annotation.style.opacity = String(smoothstep(nameWord.start, nameWord.start + 0.35, t));
  } else {
    annotation.style.opacity = '0';
  }

  if (t >= helpLine.start && t < shareLine.start) plateLabel.textContent = 'HELP · shared route';
  else if (t >= shareLine.start && t < comfortLine.start) plateLabel.textContent = 'SHARE · redistribution → relation';
  else if (t >= comfortLine.start && t < truthLine.start) plateLabel.textContent = 'COMFORT · co-regulation';
  else if (t >= truthLine.start && t < truthLine.end) plateLabel.textContent = 'TRUTH · preserve the channel';
  else plateLabel.textContent = '';

  plateLabel.style.opacity = plateLabel.textContent ? '1' : '0';
}

function resetPlateObjects(): void {
  [a, b, helper, resource, shareLeft, shareRight, truthSignal].forEach((x) => {
    setOpacity(x, 0);
    x.scale.setScalar(1);
  });
  backgroundNodes.forEach((x) => {
    setOpacity(x, 0);
    x.scale.setScalar(1);
  });
  [mainThread, ...backgroundLinks, obstacle, route, shareRelation, comfortWave, regulationAxis, truthPath, truthCore, resistance]
    .forEach(hideLine);
  camera.zoom = 1;
  camera.position.set(0, 0, 5);
  camera.updateProjectionMatrix();
}

function renderOpening(t: number): void {
  const appear = smoothstep(opening1.start, opening1.words[0].end, t);
  const kindness = opening1.words.find((w) => w.w.toLowerCase() === 'kindness')!;
  const connect = smoothstep(opening1.words[1].start, kindness.end, t);

  a.position.set(-260, 0, 0);
  b.position.set(260, 0, 0);
  setOpacity(a, appear);
  setOpacity(b, appear);
  setLinePoints(mainThread, [
    [a.position.x, a.position.y],
    [THREE.MathUtils.lerp(a.position.x, b.position.x, connect), b.position.y]
  ], smoothstep(opening1.words[1].start - 0.1, kindness.start, t));

  const reveal = smoothstep(opening3.words[1].start, opening3.end, t);
  const cameraPull = smoothstep(opening3.start, opening3.end, t);
  camera.zoom = THREE.MathUtils.lerp(1.15, 0.82, cameraPull);
  camera.updateProjectionMatrix();

  backgroundNodes.forEach((node, i) => {
    setOpacity(node, Math.max(0, reveal - i * 0.08) * 1.5);
  });

  backgroundPairs.forEach(([from, to], i) => {
    const p = clamp01((reveal - 0.18 - i * 0.07) * 2);
    setLinePoints(backgroundLinks[i], [
      [from.position.x, from.position.y],
      [
        THREE.MathUtils.lerp(from.position.x, to.position.x, p),
        THREE.MathUtils.lerp(from.position.y, to.position.y, p)
      ]
    ], p * 0.65);
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

  setLinePoints(obstacle, [[0, -330], [0, 180]], 0.65);

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
  setLinePoints(route, pts.slice(0, visibleCount), 0.95);

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

  setLinePoints(shareRelation, [[a.position.x, 0], [b.position.x, 0]], smoothstep(0.45, 1, p) * 0.85);
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

  setLinePoints(regulationAxis, [[-650, 0], [650, 0]], 0.23);

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
  setLinePoints(comfortWave, pts, connect);

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
  setLinePoints(truthPath, pathPts, 0.42);

  // resistance is visible as a narrow gate the signal has to pass
  setLinePoints(resistance, [[-45, -240], [-45, 80], [45, -80], [45, 240]], 0.45 * (1 - straighten));

  // signal follows the bent route approximately, then reaches the receiver
  const x = THREE.MathUtils.lerp(-520, 520, signalP);
  const q = signalP;
  const y = Math.sin(q * Math.PI * 2) * bend * Math.sin(Math.PI * q);
  truthSignal.position.set(x, y, 0);
  setOpacity(truthSignal, smoothstep(0.02, 0.12, signalP) * (1 - smoothstep(0.98, 1, signalP)));

  // stronger channel appears underneath after the difficult signal has landed
  setLinePoints(truthCore, [[-520, 0], [520, 0]], straighten * 0.95);
}

function renderAt(t: number): void {
  resetPlateObjects();

  if (t < helpLine.start) renderOpening(t);
  else if (t < shareLine.start) renderHelp(t);
  else if (t < comfortLine.start) renderShare(t);
  else if (t < truthLine.start) renderComfort(t);
  else if (t < truthLine.end + 0.05) renderTruth(t);

  updateText(t);
  renderer.render(scene, camera);
}

function resize(): void {
  const scale = Math.min(window.innerWidth / LOGICAL_W, window.innerHeight / LOGICAL_H);
  renderer.setSize(Math.floor(LOGICAL_W * scale), Math.floor(LOGICAL_H * scale), false);
}

window.addEventListener('resize', resize);
resize();

function frame(): void {
  renderAt(audio.currentTime || requestedTime || 0);
  requestAnimationFrame(frame);
}

frame();

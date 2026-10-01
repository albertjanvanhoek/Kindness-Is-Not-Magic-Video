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
const specialLine = findLine('something special happens');
const closerLine = findLine('People come closer');
const trustLine = findLine('Trust grows');
const strongerLine = findLine('together they become stronger');
const kindnessLine = findLine('That is kindness');
const notMagicLine = findLine('It is not magic');
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

const audio = new Audio('/kindness-is-not-magic.mp3');
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
  annotation.textContent = '';
  annotation.style.opacity = '0';
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

function renderAt(t: number): void {
  resetPlateObjects();
  updateText(t);

  if (t < helpLine.start) renderOpening(t);
  else if (t < shareLine.start) renderHelp(t);
  else if (t < comfortLine.start) renderShare(t);
  else if (t < truthLine.start) renderComfort(t);
  else if (t < truthLine.end + 0.05) renderTruth(t);
  else if (t < closerLine.start) renderEmergence(t);
  else if (t < trustLine.start) renderCloser(t);
  else if (t < strongerLine.start) renderTrust(t);
  else if (t < kindnessLine.start) renderStronger(t);
  else if (t < notMagicLine.start) renderKindnessReveal(t);
  else if (t < easyLine.start) renderNotMagic(t);
  else if (t < easyLine.end + 0.05) renderNotEasy(t);
  else if (t < listeningLine.start) renderMeansSharing(t);
  else if (t < sayingLine.start) renderListening(t);
  else if (t < wrongLine.start) renderSaying(t);
  else if (t < orLine.start) renderWrong(t);
  else if (t < forgiveLine.start) renderOr(t);
  else if (t < forgiveLine.end + 0.05) renderForgive(t);
  else if (t < withoutLine.start) renderFailure(t);
  else if (t < driftLine.start) renderWithoutKindness(t);
  else if (t < breakLine.start) renderDriftApart(t);
  else if (t < familiesLine.start) renderBreak(t);
  else if (t < lonelyLine.start) renderFamiliesFall(t);
  else if (t < rediscoverLine.start) renderLonelier(t);
  else if (t < stayLine.start) renderRediscovery(t);
  else if (t < returnLine.start) renderStayTogether(t);
  else if (t < beautifulLine.start) renderReturn(t);
  else if (t < possibleLine.end + 0.1) renderBeautiful(t);

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

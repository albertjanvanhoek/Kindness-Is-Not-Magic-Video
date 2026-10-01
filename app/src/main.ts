import * as THREE from 'three';
import lyricData from '../../data/lyrics.json';

const LOGICAL_W = 1920;
const LOGICAL_H = 1080;

type WordTiming = { w: string; start: number; end: number };
type LineTiming = { text: string; start: number; end: number; words: WordTiming[] };

const lines = (lyricData as { lines: LineTiming[] }).lines;

function findLine(fragment: string): LineTiming {
  const line = lines.find((x) => x.text.toLowerCase().includes(fragment.toLowerCase()));
  if (!line) throw new Error(`Missing lyric line: ${fragment}`);
  return line;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function smoothstep(a: number, b: number, x: number): number {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

function wordProgress(word: WordTiming, t: number): number {
  return smoothstep(word.start, word.end, t);
}

const line1 = findLine('Nobody invented kindness');
const line2 = findLine('People gave it a name');
const line3 = findLine('kindness was already there');

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

const nodeMaterial = new THREE.MeshBasicMaterial({ color: BONE, transparent: true });
const faintNodeMaterial = new THREE.MeshBasicMaterial({ color: GRAPHITE, transparent: true });
const threadMaterial = new THREE.LineBasicMaterial({ color: SIGNAL, transparent: true });

function makeNode(x: number, y: number, faint = false): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CircleGeometry(faint ? 8 : 13, 48),
    faint ? faintNodeMaterial.clone() : nodeMaterial.clone()
  );
  mesh.position.set(x, y, 0);
  scene.add(mesh);
  return mesh;
}

const a = makeNode(-260, 0);
const b = makeNode(260, 0);

const backgroundNodes = [
  makeNode(-680, 260, true),
  makeNode(-520, -300, true),
  makeNode(-120, 330, true),
  makeNode(180, -310, true),
  makeNode(560, 270, true),
  makeNode(720, -180, true)
];

const threadGeometry = new THREE.BufferGeometry();
const threadPositions = new Float32Array(6);
threadGeometry.setAttribute('position', new THREE.BufferAttribute(threadPositions, 3));
const thread = new THREE.Line(threadGeometry, threadMaterial);
scene.add(thread);

type Link = {
  line: THREE.Line;
  positions: Float32Array;
  from: THREE.Mesh;
  to: THREE.Mesh;
};

function makeLink(from: THREE.Mesh, to: THREE.Mesh): Link {
  const positions = new Float32Array(6);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({
    color: GRAPHITE,
    transparent: true,
    opacity: 0
  });
  const line = new THREE.Line(geometry, material);
  scene.add(line);
  return { line, positions, from, to };
}

const backgroundLinks = [
  makeLink(backgroundNodes[0], backgroundNodes[2]),
  makeLink(backgroundNodes[1], backgroundNodes[2]),
  makeLink(backgroundNodes[2], a),
  makeLink(b, backgroundNodes[4]),
  makeLink(backgroundNodes[3], b),
  makeLink(backgroundNodes[4], backgroundNodes[5])
];

const textLayer = document.createElement('div');
textLayer.id = 'lyrics';
document.querySelector('#app')!.appendChild(textLayer);

const annotation = document.createElement('div');
annotation.id = 'annotation';
document.querySelector('#app')!.appendChild(annotation);

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
      const cls = active ? 'word active' : done ? 'word done' : 'word';
      return `<span class="${cls}">${word.w}</span>`;
    })
    .join(' ');
}

function updateText(t: number): void {
  let line: LineTiming | null = null;
  if (t >= line1.start - 0.2 && t < line2.start) line = line1;
  else if (t >= line2.start && t < line3.start) line = line2;
  else if (t >= line3.start && t < line3.end + 0.4) line = line3;

  textLayer.innerHTML = line ? lineHTML(line, t) : '';

  const nameWord = line2.words.find((w) => w.w.toLowerCase() === 'name');
  if (nameWord && t >= nameWord.start) {
    annotation.textContent = 'name assigned later';
    annotation.style.opacity = String(smoothstep(nameWord.start, nameWord.start + 0.35, t));
  } else {
    annotation.textContent = '';
    annotation.style.opacity = '0';
  }
}

function updateMainThread(t: number): void {
  const appear = smoothstep(line1.start, line1.words[0].end, t);
  const kindness = line1.words.find((w) => w.w.toLowerCase() === 'kindness')!;
  const connect = smoothstep(line1.words[1].start, kindness.end, t);

  for (const n of [a, b]) {
    (n.material as THREE.MeshBasicMaterial).opacity = appear;
  }

  threadPositions[0] = a.position.x;
  threadPositions[1] = a.position.y;
  threadPositions[2] = 0;
  threadPositions[3] = THREE.MathUtils.lerp(a.position.x, b.position.x, connect);
  threadPositions[4] = b.position.y;
  threadPositions[5] = 0;

  (threadGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  threadMaterial.opacity = smoothstep(line1.words[1].start - 0.1, kindness.start, t);
}

function updateBackground(t: number): void {
  const reveal = smoothstep(line3.words[1].start, line3.end, t);
  const cameraPull = smoothstep(line3.start, line3.end, t);

  camera.zoom = THREE.MathUtils.lerp(1.15, 0.82, cameraPull);
  camera.updateProjectionMatrix();

  backgroundNodes.forEach((node, i) => {
    const phase = Math.max(0, reveal - i * 0.08);
    (node.material as THREE.MeshBasicMaterial).opacity = clamp01(phase * 1.5);
  });

  backgroundLinks.forEach((link, i) => {
    const p = clamp01((reveal - 0.18 - i * 0.07) * 2.0);
    link.positions[0] = link.from.position.x;
    link.positions[1] = link.from.position.y;
    link.positions[2] = 0;
    link.positions[3] = THREE.MathUtils.lerp(link.from.position.x, link.to.position.x, p);
    link.positions[4] = THREE.MathUtils.lerp(link.from.position.y, link.to.position.y, p);
    link.positions[5] = 0;
    (link.line.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (link.line.material as THREE.LineBasicMaterial).opacity = p * 0.65;
  });
}

function renderAt(t: number): void {
  updateMainThread(t);
  updateBackground(t);
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

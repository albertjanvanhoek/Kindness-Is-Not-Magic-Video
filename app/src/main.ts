import * as THREE from 'three';

const LOGICAL_W = 1920;
const LOGICAL_H = 1080;

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

const bone = new THREE.Color(0xeee9df);
const signal = new THREE.Color(0xff7a3d);

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function smoothstep(a: number, b: number, x: number): number {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

function makeNode(x: number, y: number): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({ color: bone, transparent: true });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(13, 48), mat);
  mesh.position.set(x, y, 0);
  scene.add(mesh);
  return mesh;
}

const a = makeNode(-260, 0);
const b = makeNode(260, 0);

const threadGeometry = new THREE.BufferGeometry();
const threadPositions = new Float32Array(6);
threadGeometry.setAttribute('position', new THREE.BufferAttribute(threadPositions, 3));

const threadMaterial = new THREE.LineBasicMaterial({
  color: signal,
  transparent: true,
  opacity: 1
});
const thread = new THREE.Line(threadGeometry, threadMaterial);
scene.add(thread);

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
  if (event.code === 'ArrowRight') audio.currentTime = Math.min(audio.duration || Infinity, audio.currentTime + 1);
  if (event.code === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 1);
});

function renderAt(t: number): void {
  const nodeIn = smoothstep(0.5, 1.6, t);
  const connect = smoothstep(1.8, 4.2, t);

  (a.material as THREE.MeshBasicMaterial).opacity = nodeIn;
  (b.material as THREE.MeshBasicMaterial).opacity = nodeIn;

  const x0 = a.position.x;
  const x1 = THREE.MathUtils.lerp(a.position.x, b.position.x, connect);

  threadPositions[0] = x0;
  threadPositions[1] = a.position.y;
  threadPositions[2] = 0;
  threadPositions[3] = x1;
  threadPositions[4] = b.position.y;
  threadPositions[5] = 0;

  (threadGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  threadMaterial.opacity = smoothstep(1.7, 2.0, t);

  renderer.render(scene, camera);
}

function resize(): void {
  const scale = Math.min(
    window.innerWidth / LOGICAL_W,
    window.innerHeight / LOGICAL_H
  );
  renderer.setSize(
    Math.floor(LOGICAL_W * scale),
    Math.floor(LOGICAL_H * scale),
    false
  );
}

window.addEventListener('resize', resize);
resize();

function frame(): void {
  renderAt(audio.currentTime || requestedTime || 0);
  requestAnimationFrame(frame);
}

frame();

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

const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0xeee9df });
const threadMaterial = new THREE.LineBasicMaterial({ color: 0xff7a3d });

function makeNode(x: number, y: number): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(13, 48), nodeMaterial);
  mesh.position.set(x, y, 0);
  scene.add(mesh);
  return mesh;
}

const a = makeNode(-260, 0);
const b = makeNode(260, 0);

const geometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(a.position.x, a.position.y, 0),
  new THREE.Vector3(b.position.x, b.position.y, 0)
]);

scene.add(new THREE.Line(geometry, threadMaterial));

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

function render(): void {
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

render();

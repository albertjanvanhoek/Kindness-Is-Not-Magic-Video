import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const start = Number(arg('start', '0'));
const end = Number(arg('end', '15'));
const name = arg('name', 'preview');
const fps = Number(arg('fps', '30'));
const baseUrl = arg('url', 'http://127.0.0.1:4173');
const width = Number(arg('width', '1280'));
const height = Number(arg('height', '720'));

const outDir = path.resolve('rendered', name);
const framesDir = path.join(outDir, 'frames');
await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(framesDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width, height } });
await page.goto(`${baseUrl}/?render=1&t=${start}`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__videoReady === true);

const total = Math.ceil((end - start) * fps);
for (let i = 0; i < total; i++) {
  const t = start + i / fps;
  await page.evaluate((time) => window.__renderAt?.(time), t);
  await page.screenshot({
    path: path.join(framesDir, String(i).padStart(6, '0') + '.jpg'),
    type: 'jpeg',
    quality: 88
  });
}
await browser.close();

const videoOnly = path.join(outDir, `${name}-silent.mp4`);
let res = spawnSync('ffmpeg', [
  '-y', '-framerate', String(fps),
  '-i', path.join(framesDir, '%06d.jpg'),
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
  videoOnly
], { stdio: 'inherit' });
if (res.status !== 0) process.exit(res.status ?? 1);

const audio = path.resolve('../audio/kindness-is-not-magic.mp3');
try {
  await fs.access(audio);
  const final = path.join(outDir, `${name}.mp4`);
  res = spawnSync('ffmpeg', [
    '-y', '-i', videoOnly,
    '-ss', String(start), '-t', String(end - start), '-i', audio,
    '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
    '-shortest', '-movflags', '+faststart',
    final
  ], { stdio: 'inherit' });
  if (res.status !== 0) process.exit(res.status ?? 1);
  console.log(`Rendered ${final}`);
} catch {
  console.log(`MP3 not found; rendered silent preview: ${videoOnly}`);
}

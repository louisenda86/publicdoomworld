// 2D layer: one 1920x1080 canvas uploaded as a texture each frame a shot draws into it.
import * as THREE from 'three';
import { W, H } from '../core.js';

// "WHAT IF" template — the reference's own system: near-black card #0c0f0f with cream lowercase Helvetica Neue Bold,
// light-blue #a6d7e6 cards / label boxes / multiply highlights. Clickbait red + yellow only for thumbnails and alarms.
// Japanese accent words are set in Hiragino Sans.
export const C = {
  ink: '#0c0f0f', cream: '#f0e8da', blue: '#a6d7e6', red: '#ff3b30', yellow: '#ffd60a', grey: '#9aa3a6', white: '#ffffff', deep: '#1d3b52', pink: '#ff7eb6', green: '#3ddc84',
  // legacy names used by the shared helpers
  black: '#0c0f0f', paper: '#f0e8da', bone: '#f0e8da', slime: '#a6d7e6', volt: '#1d3b52', cobalt: '#1d3b52', blueHL: 'rgba(166,215,230,0.75)',
};
export const HEL = '"Helvetica Neue", Helvetica, Arial, sans-serif';
export const SANS = HEL;              // display type (kinetic cards, labels)
export const TIMES = '"Times New Roman", Times, serif';
export const UI = '"Helvetica Neue", Helvetica, Arial, sans-serif'; // fake app chrome
export const COND = '"Avenir Next Condensed", Futura, sans-serif';
export const MONO = 'Menlo, "SF Mono", Monaco, monospace';
export const SERIF = '"Times New Roman", Times, serif';
export const JP = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Hiragino Kaku Gothic Pro", sans-serif';

export class Overlay {
  constructor() {
    this.canvas = document.createElement('canvas'); this.canvas.width = W; this.canvas.height = H;
    this.g = this.canvas.getContext('2d', { willReadFrequently: false });
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.minFilter = THREE.LinearFilter; this.tex.magFilter = THREE.LinearFilter; this.tex.generateMipmaps = false;
    this.tex.colorSpace = THREE.NoColorSpace;
  }
  clear() { const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; g.clearRect(0, 0, W, H); }
  async ready() {
    const fams = [`800 100px ${JP}`, `700 100px ${JP}`, `300 100px ${JP}`, `italic 700 100px ${SANS}`, `700 100px ${UI}`, `500 100px ${UI}`, `400 100px ${UI}`, `700 100px ${SANS}`, `400 100px ${SANS}`, `500 100px ${SANS}`, `300 100px ${SANS}`, `800 100px ${COND}`, `600 100px ${COND}`, `400 40px ${MONO}`, `700 40px ${MONO}`, `400 40px ${SERIF}`];
    for (const f of fams) { try { await document.fonts.load(f, 'Aa'); } catch (e) { } }
  }
}

// ---------- image + clip loading (async, cached) ----------
const IMG = new Map();
export function loadImage(url) {
  if (!IMG.has(url)) IMG.set(url, (async () => { for (let k = 0; ; k++) { try { const r = await fetch(url, { cache: 'no-store' }); if (!r.ok) throw new Error('missing ' + url); return await createImageBitmap(await r.blob()); } catch (e) { if (k >= 4) throw e; await new Promise(res => setTimeout(res, 200 * (k + 1))); } } })());
  return IMG.get(url);
}
export const CLIPS = {};
// frame of a clip at clip-local time s (seconds from the clip's first extracted frame)
const CLIPCACHE = new Map();
export async function clipFrame(name, s) {
  const c = CLIPS[name]; const i = Math.max(1, Math.min(c.n, Math.floor(s * c.fps) + 1));
  const url = `./data/clips/${name}/${String(i).padStart(4, '0')}.jpg`;
  if (CLIPCACHE.has(url)) return CLIPCACHE.get(url);
  const p = loadImage(url); CLIPCACHE.set(url, p);
  if (CLIPCACHE.size > 400) { const k = CLIPCACHE.keys().next().value; CLIPCACHE.delete(k); IMG.delete(k); }
  return p;
}
export async function loadJSON(url) { const r = await fetch(url); return r.json(); }

// PS1-style pixel text: rasterise at 1/k scale, upscale with nearest filtering
const PXC = document.createElement('canvas'); PXC.width = 960; PXC.height = 200; const PXG = PXC.getContext('2d');
export function pixText(g, str, x, y, { size = 30, k = 3, font = SANS, weight = 700, color = '#000', track = 0, align = 'left', alpha = 1, shadow = null } = {}) {
  const s = Math.max(4, Math.round(size / k)); PXG.setTransform(1, 0, 0, 1, 0, 0); PXG.clearRect(0, 0, PXC.width, PXC.height);
  PXG.font = `${weight} ${s}px ${font}`; PXG.letterSpacing = `${track * s}px`; PXG.textBaseline = 'alphabetic';
  const w = Math.ceil(PXG.measureText(str).width) + 4, h = Math.ceil(s * 1.5);
  const by = Math.round(s * 1.1);
  if (shadow) { PXG.fillStyle = shadow; PXG.fillText(str, 2, by + 1); }
  PXG.fillStyle = color; PXG.fillText(str, 1, by);
  // hard threshold the alpha (no anti-aliasing, like a bitmap font)
  const id = PXG.getImageData(0, 0, w, h); const d = id.data; for (let i = 3; i < d.length; i += 4) d[i] = d[i] > 110 ? 255 : 0; PXG.putImageData(id, 0, 0);
  const ox = align === 'center' ? -w * k / 2 : align === 'right' ? -w * k : 0;
  g.save(); g.imageSmoothingEnabled = false; g.globalAlpha = alpha;
  g.drawImage(PXC, 0, 0, w, h, Math.round((x + ox) / k) * k, Math.round((y - by * k) / k) * k, w * k, h * k); g.restore();
  return w * k;
}

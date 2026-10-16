// Pixel textures (PS1 look): tiny canvases, nearest filtering, deterministic noise.
import * as THREE from 'three';
import { rng } from '../core.js';

export function hex2rgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
export function rgb2hex([r, g, b]) { const c = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'); return '#' + c(r) + c(g) + c(b); }
export function shade(h, f) { const [r, g, b] = hex2rgb(h); return f >= 1 ? rgb2hex([r + (255 - r) * (f - 1), g + (255 - g) * (f - 1), b + (255 - b) * (f - 1)]) : rgb2hex([r * f, g * f, b * f]); }
export function mixc(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A.map((v, i) => v + (B[i] - v) * t)); }

const CACHE = new Map();
// paint(g, w, h, R) draws into a w x h canvas; returns a nearest-filtered sRGB texture
export function ptex(key, w, h, paint, { repeat = null, linear = false } = {}) {
  if (key && CACHE.has(key)) return CACHE.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  paint(g, w, h, rng(hashStr(key || 'x')));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false;
  t.magFilter = linear ? THREE.LinearFilter : THREE.NearestFilter; t.minFilter = linear ? THREE.LinearFilter : THREE.NearestFilter;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  else { t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; }
  t.anisotropy = 1;
  if (key) CACHE.set(key, t);
  return t;
}
export function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

// fill with a base colour plus per-pixel value noise (PS1 painted-texture grain)
export const NOISE_K = { v: 0.55 }; // this film's painted textures are cleaner than the PS1 originals
export function noiseFill(g, w, h, base, amp, R, cell = 1) {
  const [r, gg, b] = hex2rgb(base); amp *= NOISE_K.v;
  for (let y = 0; y < h; y += cell) for (let x = 0; x < w; x += cell) {
    const n = (R() - 0.5) * 2 * amp; g.fillStyle = rgb2hex([r * (1 + n), gg * (1 + n), b * (1 + n)]); g.fillRect(x, y, cell, cell);
  }
}
export function vgrad(g, w, h, top, bot) { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
export function speckle(g, w, h, color, n, R, s = 1) { g.fillStyle = color; for (let i = 0; i < n; i++) g.fillRect(Math.floor(R() * w), Math.floor(R() * h), s, s); }
// solid colour texture with grain (cached by colour)
export function grain(color, amp = 0.06, size = 16, cell = 1) { return ptex(`grain:${color}:${amp}:${size}:${cell}`, size, size, (g, w, h, R) => noiseFill(g, w, h, color, amp, R, cell)); }
// text painted into a texture (signs, labels)
export function textTex(key, w, h, draw) { return ptex(key, w, h, draw, { linear: true }); }

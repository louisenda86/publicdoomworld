// Props: the AI monolith, GPUs, CRT TV, furniture, playground, market stall, house, van, crates, roulette, city blocks.
import * as THREE from 'three';
import { box, taper, lam, basic, cmat, cyl, at, group, blob } from './kit.js';
import { ptex, shade, noiseFill, textTex } from './tex.js';
import { rng, clamp, hash2 } from '../core.js';
import { SANS, MONO } from '../ov/overlay.js';

// ---------- live screens (canvas texture redrawn by shots) ----------
export class Screen {
  constructor(w = 512, h = 384, glow = 1.6) {
    this.c = document.createElement('canvas'); this.c.width = w; this.c.height = h; this.g = this.c.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.c); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.minFilter = THREE.LinearFilter; this.tex.generateMipmaps = false;
    this.mat = new THREE.MeshBasicMaterial({ map: this.tex, color: new THREE.Color(glow, glow, glow), toneMapped: false });
    this.w = w; this.h = h;
  }
  async draw(fn) { const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; await fn(g, this.w, this.h); this.tex.needsUpdate = true; }
}

// ---------- the AI: a black server monolith with LED strips, a screen and one red eye ----------
export function aiBox({ h = 2.4, w = 1.1, d = 0.9, screen = true } = {}) {
  const g = new THREE.Group();
  const side = ptex('ai_side', 32, 64, (c, W, H, R) => { noiseFill(c, W, H, '#14161b', 0.08, R); for (let y = 4; y < H; y += 6) { c.fillStyle = '#0a0b0e'; c.fillRect(2, y, W - 4, 2); for (let x = 3; x < W - 3; x += 3) { c.fillStyle = R() > 0.6 ? '#2aa0ff' : '#0d2a3e'; c.fillRect(x, y + 3, 1, 1); } } });
  const top = ptex('ai_top', 16, 16, (c, W, H, R) => noiseFill(c, W, H, '#1a1d23', 0.06, R));
  const mS = lam({ map: side, emissive: 0x4488ff, emissiveMap: side, ei: 0.7 }), mT = lam({ map: top });
  const body = box(w, h, d, [mS, mS, mT, mT, mS, mS], 'bottom'); g.add(body);
  // front panel
  const front = ptex('ai_front', 32, 64, (c, W, H, R) => { noiseFill(c, W, H, '#101216', 0.06, R); c.fillStyle = '#05060a'; c.fillRect(3, 3, W - 6, H - 6); for (let y = 30; y < H - 4; y += 3) { c.fillStyle = R() > 0.5 ? '#3cf' : '#0b2433'; c.fillRect(5 + (R() * 20 | 0), y, 2, 1); } });
  const fm = lam({ map: front, emissive: 0xffffff, emissiveMap: front, ei: 0.9 });
  const panel = box(w * 0.86, h * 0.92, 0.02, fm, 'bottom'); panel.position.set(0, h * 0.04, d / 2 + 0.01); g.add(panel);
  // LED strips (glow)
  const led = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 1.4, 3.2), toneMapped: false });
  for (const s of [-1, 1]) { const l = box(0.025, h * 0.9, 0.025, led, 'bottom'); l.position.set(s * w * 0.45, h * 0.05, d / 2 + 0.03); g.add(l); }
  // eye
  const eyeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 0.25, 0.15), toneMapped: false });
  const eyeRing = cyl(0.13, 0.13, 0.05, 16, cmat('#2a2d33')); eyeRing.rotation.x = Math.PI / 2; eyeRing.position.set(0, h * 0.78, d / 2 + 0.035); g.add(eyeRing);
  const eye = new THREE.Mesh(new THREE.CircleGeometry(0.095, 20), eyeMat); eye.position.set(0, h * 0.78, d / 2 + 0.062); g.add(eye);
  const lid = new THREE.Mesh(new THREE.CircleGeometry(0.1, 20), new THREE.MeshBasicMaterial({ color: 0x08090b })); lid.position.set(0, h * 0.78, d / 2 + 0.064); g.add(lid);
  let scr = null;
  if (screen) { scr = new Screen(512, 320, 1.5); const sm = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.72, w * 0.45), scr.mat); sm.position.set(0, h * 0.5, d / 2 + 0.035); g.add(sm); }
  const sh = blob(Math.max(w, d) * 0.9, 0.5); g.add(sh);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
  return { g, eye, eyeMat, lid, scr, h, w, d, led,
    // open: 0 closed .. 1 fully open; glow multiplier
    setEye(open, glow = 1) { lid.scale.set(1, 1 - clamp(open), 1); lid.position.y = h * 0.78 + 0.1 * clamp(open) * 0.98; eyeMat.color.setRGB(4 * glow, 0.25 * glow, 0.15 * glow); lid.visible = open < 0.995; },
  };
}

// ---------- GPU card ----------
export function gpu(seed = 0, s = 1) {
  const g = new THREE.Group();
  const shroud = ptex('gpu_shroud', 64, 24, (c, W, H, R) => { noiseFill(c, W, H, '#202328', 0.06, R); c.fillStyle = '#7cff3a'; c.fillRect(2, H - 3, W - 4, 1); c.fillStyle = '#9aa0a8'; c.font = 'bold 7px sans-serif'; c.fillText('RTX', 4, 9); });
  const m = lam({ map: shroud, emissive: 0x335522, emissiveMap: shroud, ei: 0.4 });
  const b = box(0.32 * s, 0.06 * s, 0.13 * s, [cmat('#2a2d33'), cmat('#2a2d33'), m, cmat('#111'), m, m]); g.add(b);
  const fanM = lam({ map: ptex('fan', 16, 16, (c, W) => { c.fillStyle = '#0c0d10'; c.fillRect(0, 0, 16, 16); c.fillStyle = '#3a3f47'; for (let i = 0; i < 7; i++) { c.save(); c.translate(8, 8); c.rotate(i * 0.9); c.fillRect(0, -1, 7, 2); c.restore(); } c.fillStyle = '#7cff3a'; c.fillRect(7, 7, 2, 2); }) });
  for (const x of [-0.08, 0.08]) { const f = new THREE.Mesh(new THREE.CircleGeometry(0.05 * s, 12), fanM); f.rotation.x = -Math.PI / 2; f.position.set(x * s, 0.031 * s, 0); g.add(f); }
  const bracket = box(0.012 * s, 0.07 * s, 0.13 * s, cmat('#b8bec6')); bracket.position.set(-0.165 * s, 0, 0); g.add(bracket);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
export function gpuBox(s = 1) { // retail box
  const t = ptex('gpubox', 32, 24, (c, W, H, R) => { noiseFill(c, W, H, '#16181c', 0.05, R); c.fillStyle = '#76b900'; c.fillRect(0, 0, W, 5); c.fillStyle = '#fff'; c.font = 'bold 7px sans-serif'; c.fillText('GPU', 3, 16); c.fillStyle = '#76b900'; c.fillRect(20, 10, 9, 9); });
  const m = lam({ map: t }); const b = box(0.42 * s, 0.14 * s, 0.26 * s, [m, m, m, m, m, m], 'bottom'); b.castShadow = true; return b;
}

// ---------- CRT TV on a wooden cabinet ----------
export function crt({ wood = true } = {}) {
  const g = new THREE.Group();
  const shell = cmat('#3b2a1e', 0.1);
  const cab = box(0.9, 0.55, 0.5, shell, 'bottom'); g.add(cab);
  const tv = box(0.72, 0.56, 0.55, cmat('#2b2622', 0.08), 'bottom'); tv.position.y = 0.55; g.add(tv);
  const scr = new Screen(320, 240, 1.35);
  const sm = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.4), scr.mat); sm.position.set(-0.05, 0.83, 0.28); g.add(sm);
  const knobs = ptex('knobs', 8, 16, (c) => { c.fillStyle = '#2b2622'; c.fillRect(0, 0, 8, 16); c.fillStyle = '#bbb'; c.fillRect(2, 2, 4, 3); c.fillRect(2, 7, 4, 3); c.fillStyle = '#e33'; c.fillRect(3, 12, 2, 2); });
  const kp = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.38), lam({ map: knobs })); kp.position.set(0.28, 0.83, 0.276); g.add(kp);
  const ant = cyl(0.006, 0.006, 0.45, 4, cmat('#999')); ant.position.set(0.1, 1.25, 0); ant.rotation.z = -0.5; g.add(ant);
  const ant2 = ant.clone(); ant2.position.x = -0.1; ant2.rotation.z = 0.5; g.add(ant2);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { g, scr, screenMesh: sm };
}

// ---------- furniture ----------
export function armchair(color = '#5a3a24') {
  const g = new THREE.Group();
  const fab = ptex('chair' + color, 16, 16, (c, W, H, R) => { noiseFill(c, W, H, color, 0.08, R); for (let x = 0; x < W; x += 3) { c.fillStyle = shade(color, 0.8); c.fillRect(x, 0, 1, H); } });
  const m = lam({ map: fab });
  g.add(at(box(0.8, 0.42, 0.75, m, 'bottom'), 0, 0, 0));
  g.add(at(box(0.8, 0.55, 0.18, m, 'bottom'), 0, 0.42, -0.3));
  for (const s of [-1, 1]) g.add(at(box(0.16, 0.22, 0.72, m, 'bottom'), s * 0.36, 0.42, 0));
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
export function lampFloor(on = true) {
  const g = new THREE.Group();
  g.add(cyl(0.12, 0.14, 0.03, 8, cmat('#2a2a2a')));
  const p = cyl(0.015, 0.015, 1.45, 5, cmat('#2a2a2a')); p.position.y = 0.73; g.add(p);
  const shadeM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 1.45, 0.95), side: THREE.DoubleSide, toneMapped: false });
  const sh = cyl(0.13, 0.22, 0.26, 10, on ? shadeM : cmat('#d9c9a0'), true); sh.position.y = 1.5; g.add(sh);
  if (on) { const L = new THREE.PointLight(0xffc98a, 3.2, 7, 1.6); L.position.y = 1.45; g.add(L); }
  return g;
}
export function table(w = 1.2, d = 0.7, h = 0.75, color = '#6b4a30') {
  const g = new THREE.Group(); const m = cmat(color, 0.1);
  g.add(at(box(w, 0.05, d, m, 'bottom'), 0, h - 0.05, 0));
  for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) g.add(at(box(0.05, h - 0.05, 0.05, m, 'bottom'), x * (w / 2 - 0.05), 0, z * (d / 2 - 0.05)));
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
export function laptop(open = 1.9) {
  const g = new THREE.Group();
  g.add(at(box(0.34, 0.02, 0.24, cmat('#c8ccd2', 0.04), 'bottom'), 0, 0, 0));
  const lidG = new THREE.Group(); lidG.position.set(0, 0.02, -0.12); g.add(lidG);
  lidG.add(at(box(0.34, 0.23, 0.012, cmat('#c8ccd2', 0.04), 'bottom'), 0, 0, 0));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.19), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.7, 1.0, 1.4), toneMapped: false })); scr.position.set(0, 0.115, 0.007); lidG.add(scr);
  lidG.rotation.x = -(Math.PI - open);
  return { g, lid: lidG, scr };
}
export function bed() {
  const g = new THREE.Group();
  g.add(at(box(1.0, 0.35, 2.0, cmat('#4a3a2e'), 'bottom'), 0, 0, 0));
  const sheet = ptex('sheet', 16, 16, (c, W, H, R) => { noiseFill(c, W, H, '#5d6aa0', 0.08, R); for (let y = 0; y < H; y += 4) { c.fillStyle = '#4d5a8a'; c.fillRect(0, y, W, 1); } });
  g.add(at(box(0.96, 0.14, 1.9, lam({ map: sheet }), 'bottom'), 0, 0.35, 0.02));
  g.add(at(box(0.6, 0.12, 0.35, cmat('#e8e4f0', 0.05), 'bottom'), 0, 0.49, -0.75));
  g.add(at(box(1.0, 0.7, 0.08, cmat('#4a3a2e'), 'bottom'), 0, 0, -1.0));
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
// pinned-paper conspiracy board with red strings
export function doomBoard() {
  const t = ptex('doomboard', 96, 64, (c, W, H, R) => {
    noiseFill(c, W, H, '#a4794c', 0.1, R);
    const notes = []; for (let i = 0; i < 14; i++) { const x = 4 + R() * (W - 18), y = 4 + R() * (H - 16); notes.push([x + 6, y + 5]); c.fillStyle = R() > 0.7 ? '#f3e27a' : '#f4f1e6'; c.fillRect(x, y, 12 + (R() * 4 | 0), 10); c.fillStyle = '#555'; for (let k = 0; k < 3; k++) c.fillRect(x + 2, y + 3 + k * 2, 6 + (R() * 4 | 0), 1); if (R() > 0.6) { c.strokeStyle = '#c33'; c.beginPath(); c.moveTo(x + 2, y + 9); c.lineTo(x + 5, y + 5); c.lineTo(x + 8, y + 7); c.lineTo(x + 11, y + 2); c.stroke(); } c.fillStyle = '#d22'; c.fillRect(x + 5, y, 2, 2); }
    c.strokeStyle = '#d0201a'; c.lineWidth = 1; for (let i = 0; i < 12; i++) { const a = notes[R() * notes.length | 0], b = notes[R() * notes.length | 0]; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
    c.fillStyle = '#111'; c.font = 'bold 9px monospace'; c.fillText('P(DOOM)', 30, 36);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.2), lam({ map: t })); return m;
}
// ---------- outdoors ----------
export function bench(w = 1.8) {
  const g = new THREE.Group(); const wood = cmat('#8a5a32', 0.12), stone = cmat('#9a9a9a', 0.08);
  for (const s of [-1, 1]) g.add(at(box(0.25, 0.42, 0.4, stone, 'bottom'), s * (w / 2 - 0.2), 0, 0));
  g.add(at(box(w, 0.06, 0.42, wood, 'bottom'), 0, 0.42, 0));
  g.add(at(box(w, 0.32, 0.05, wood, 'bottom'), 0, 0.55, -0.22));
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
export function busShelter() {
  const g = new THREE.Group(); const frame = cmat('#6d7c7a', 0.06);
  const glass = new THREE.MeshLambertMaterial({ color: 0xbfd6dc, transparent: true, opacity: 0.45 });
  g.add(at(box(3.2, 0.1, 1.5, cmat('#7a5233'), 'bottom'), 0, 2.4, 0));
  for (const x of [-1.55, 1.55]) for (const z of [-0.7, 0.7]) g.add(at(box(0.08, 2.4, 0.08, frame, 'bottom'), x, 0, z));
  g.add(at(box(3.1, 2.0, 0.04, glass, 'bottom'), 0, 0.3, -0.7));
  g.add(at(box(0.04, 2.0, 1.4, glass, 'bottom'), 1.55, 0.3, 0));
  g.add(at(bench(2.2), 0, 0, -0.35));
  return g;
}
export function sandbox(size = 3.2) {
  const g = new THREE.Group(); const wood = cmat('#8b5e34', 0.14);
  const sand = ptex('sand', 16, 16, (c, W, H, R) => { noiseFill(c, W, H, '#d8c08a', 0.1, R); for (let i = 0; i < 20; i++) { c.fillStyle = '#c4a870'; c.fillRect(R() * W | 0, R() * H | 0, 1, 1); } }, { repeat: [3, 3] });
  const sm = new THREE.Mesh(new THREE.PlaneGeometry(size - 0.2, size - 0.2), lam({ map: sand })); sm.rotation.x = -Math.PI / 2; sm.position.y = 0.18; sm.receiveShadow = true; g.add(sm);
  for (const [x, z, w, d] of [[0, size / 2, size, 0.18], [0, -size / 2, size, 0.18], [size / 2, 0, 0.18, size], [-size / 2, 0, 0.18, size]]) g.add(at(box(w, 0.28, d, wood, 'bottom'), x, 0, z));
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
export function slide() {
  const g = new THREE.Group(); const red = cmat('#c8402e', 0.06), metal = cmat('#8a96a0', 0.05);
  for (const x of [-0.3, 0.3]) for (const z of [-0.3, 0.3]) g.add(at(box(0.06, 1.8, 0.06, metal, 'bottom'), x, 0, z));
  g.add(at(box(0.7, 0.06, 0.7, red, 'bottom'), 0, 1.5, 0));
  const ch = box(0.5, 0.05, 2.6, cmat('#e8c23a', 0.06), 'center'); ch.position.set(0, 0.8, 1.55); ch.rotation.x = 0.62; g.add(ch);
  const lad = box(0.5, 1.6, 0.05, metal, 'bottom'); lad.position.set(0, 0, -0.55); lad.rotation.x = -0.25; g.add(lad);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
export function lampPost(on = true, color = 0xffd9a0) {
  const g = new THREE.Group(); const m = cmat('#2b3036', 0.05);
  g.add(at(box(0.12, 3.6, 0.12, m, 'bottom'), 0, 0, 0)); g.add(at(box(0.7, 0.08, 0.12, m, 'bottom'), 0.3, 3.55, 0));
  const head = box(0.3, 0.1, 0.22, new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.0, 1.4), toneMapped: false }), 'top'); head.position.set(0.6, 3.56, 0); g.add(head);
  if (on) { const L = new THREE.SpotLight(color, 26, 16, 0.75, 0.6, 1.4); L.position.set(0.6, 3.5, 0); L.target.position.set(0.6, 0, 0); L.castShadow = true; L.shadow.mapSize.set(1024, 1024); L.shadow.bias = -0.001; g.add(L); g.add(L.target); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
export function fence(len = 6, color = '#8b5e34') {
  const g = new THREE.Group(); const m = cmat(color, 0.12);
  for (let x = 0; x <= len; x += 1.5) g.add(at(box(0.1, 0.9, 0.1, m, 'bottom'), x - len / 2, 0, 0));
  g.add(at(box(len, 0.08, 0.06, m, 'bottom'), 0, 0.7, 0)); g.add(at(box(len, 0.08, 0.06, m, 'bottom'), 0, 0.35, 0));
  return g;
}
// big wall with spray text (TIDAK MAU homage to the reference photo)
export function graffitiWall(text = 'TIDAK MAU', w = 9, h = 3.4) {
  const t = ptex('wall:' + text, 192, 72, (c, W, H, R) => {
    noiseFill(c, W, H, '#8d8d86', 0.12, R);
    for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(30,30,28,${R() * 0.2})`; c.fillRect(R() * W, R() * H, 1 + R() * 3, 1 + R() * 3); }
    c.fillStyle = 'rgba(20,20,20,0.35)'; c.fillRect(0, H * 0.62, W, 6);
    c.save(); c.font = 'bold 30px Impact, sans-serif'; c.fillStyle = '#16161a'; c.globalAlpha = 0.85; c.translate(16, 44); c.rotate(-0.03); c.fillText(text, 0, 0); c.restore();
  });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.4), [cmat('#8d8d86'), cmat('#8d8d86'), cmat('#7d7d76'), cmat('#7d7d76'), lam({ map: t }), cmat('#8d8d86')]);
  m.position.y = h / 2; m.receiveShadow = true; m.castShadow = true; return m;
}
export function crate(label = 'FLAMETHROWER', s = 1) {
  const t = ptex('crate:' + label, 48, 32, (c, W, H, R) => { noiseFill(c, W, H, '#b0814a', 0.1, R); c.fillStyle = '#7a5530'; c.fillRect(0, 0, W, 3); c.fillRect(0, H - 3, W, 3); c.fillRect(0, 0, 3, H); c.fillRect(W - 3, 0, 3, H); c.fillStyle = '#c2271d'; c.font = 'bold 6px monospace'; c.fillText(label, 4, 15); c.fillStyle = '#1a1a1a'; c.fillText('⚠ FRAGILE', 4, 24); });
  const m = lam({ map: t }); const b = box(0.7 * s, 0.45 * s, 0.5 * s, [m, m, cmat('#a87a45'), m, m, m], 'bottom'); b.castShadow = true; b.receiveShadow = true; return b;
}
export function sign(text, w = 1.2, h = 0.6, bg = '#f4d03f', fg = '#111', post = true) {
  const t = textTex('sign:' + text + bg, 256, Math.round(256 * h / w), (c, W, H) => { c.fillStyle = bg; c.fillRect(0, 0, W, H); c.fillStyle = fg; c.font = `bold ${Math.round(H * 0.42)}px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, W / 2, H / 2 + 2); c.strokeStyle = fg; c.lineWidth = 6; c.strokeRect(6, 6, W - 12, H - 12); });
  const g = new THREE.Group(); const b = box(w, h, 0.03, [cmat('#ddd'), cmat('#ddd'), cmat('#ddd'), cmat('#ddd'), lam({ map: t }), lam({ map: t })]); b.position.y = post ? 1.0 + h / 2 : 0; g.add(b);
  if (post) g.add(at(box(0.04, 1.0, 0.04, cmat('#888'), 'bottom'), 0, 0, -0.02));
  return g;
}
export function marketStall(text = 'GPUs') {
  const g = new THREE.Group(); const wood = cmat('#6a4a2e', 0.12);
  g.add(at(box(3.0, 1.0, 1.0, wood, 'bottom'), 0, 0, 0));
  for (const x of [-1.45, 1.45]) g.add(at(box(0.08, 2.6, 0.08, wood, 'bottom'), x, 0, -0.4));
  const awn = ptex('awning', 16, 8, (c, W, H) => { for (let x = 0; x < W; x++) { c.fillStyle = (x >> 1) % 2 ? '#e8e2d0' : '#2f7a3a'; c.fillRect(x, 0, 1, H); } });
  const aw = box(3.2, 0.06, 1.4, lam({ map: awn }), 'center'); aw.position.set(0, 2.55, 0.1); aw.rotation.x = 0.2; g.add(aw);
  const neonT = textTex('neon:' + text, 512, 128, (c, W, H) => { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); c.font = `bold 96px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = '#7cff3a'; c.shadowBlur = 18; c.fillStyle = '#d7ffc0'; c.fillText(text, W / 2, H / 2 + 4); });
  const nm = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: neonT, color: new THREE.Color(2.2, 2.6, 2.0), transparent: true, blending: THREE.AdditiveBlending, toneMapped: false, depthWrite: false }));
  nm.position.set(0, 2.15, -0.38); g.add(nm);
  const L = new THREE.PointLight(0x9cff6a, 6, 8, 1.5); L.position.set(0, 2.0, 0.5); g.add(L);
  for (let i = 0; i < 8; i++) { const b = gpuBox(1); b.position.set(-1.1 + (i % 4) * 0.55, 1.0 + Math.floor(i / 4) * 0.15, 0.1 + (i % 2) * 0.05); b.rotation.y = (hash2(i, 3) - 0.5) * 0.3; g.add(b); }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
export function house({ w = 7, d = 6, h = 3.0, wall = '#d9cdb0', roof = '#7a3b2e', glow = 0 } = {}) {
  const g = new THREE.Group();
  const wt = ptex('siding' + wall, 16, 16, (c, W, H, R) => { noiseFill(c, W, H, wall, 0.06, R); for (let y = 0; y < H; y += 4) { c.fillStyle = shade(wall, 0.85); c.fillRect(0, y, W, 1); } }, { repeat: [w / 2, h / 2] });
  const wm = lam({ map: wt });
  g.add(at(box(w, h, d, wm, 'bottom'), 0, 0, 0));
  // gable roof
  const rt = ptex('roof' + roof, 16, 16, (c, W, H, R) => { noiseFill(c, W, H, roof, 0.1, R); for (let y = 0; y < H; y += 3) { c.fillStyle = shade(roof, 0.75); c.fillRect(0, y, W, 1); } }, { repeat: [3, 2] });
  const rm = lam({ map: rt });
  const rh = 1.6; const slope = Math.hypot(d / 2 + 0.4, rh);
  for (const s of [-1, 1]) { const r = box(w + 0.6, 0.12, slope, rm, 'center'); r.position.set(0, h + rh / 2, s * (d / 4 + 0.1)); r.rotation.x = s * Math.atan2(rh, d / 2 + 0.4); g.add(r); }
  const gable = new THREE.Shape(); gable.moveTo(-d / 2, 0); gable.lineTo(d / 2, 0); gable.lineTo(0, rh); gable.lineTo(-d / 2, 0);
  for (const s of [-1, 1]) { const gm = new THREE.Mesh(new THREE.ShapeGeometry(gable), wm); gm.position.set(s * w / 2, h, 0); gm.rotation.y = s * Math.PI / 2; g.add(gm); }
  // windows + door
  const winM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 1.25, 0.55), toneMapped: false });
  const wins = [];
  for (const x of [-2.2, 2.2]) { const wn = box(1.1, 0.9, 0.05, winM, 'bottom'); wn.position.set(x, 1.1, d / 2 + 0.02); g.add(wn); wins.push(wn); const fr = box(1.2, 0.08, 0.08, cmat('#f0f0f0'), 'bottom'); fr.position.set(x, 1.55, d / 2 + 0.05); g.add(fr); }
  g.add(at(box(1.0, 2.1, 0.06, cmat('#5a3a24'), 'bottom'), 0, 0, d / 2 + 0.02));
  g.add(at(box(2.4, 0.2, 1.2, cmat('#9a9a92'), 'bottom'), 0, 0, d / 2 + 0.6));
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { g, wins, winM };
}
export function van(color = '#e9e6dc', label = 'EXPRESS') {
  const g = new THREE.Group();
  const side = ptex('van' + color + label, 64, 32, (c, W, H, R) => { noiseFill(c, W, H, color, 0.05, R); c.fillStyle = '#c0392b'; c.fillRect(0, 18, W, 4); c.fillStyle = '#222'; c.font = 'bold 9px sans-serif'; c.fillText(label, 6, 14); });
  const m = lam({ map: side }), plain = cmat(color, 0.05);
  g.add(at(box(4.4, 1.9, 1.9, [plain, plain, plain, plain, m, m], 'bottom'), 0, 0.35, 0));
  g.add(at(box(1.2, 1.2, 1.9, plain, 'bottom'), 2.6, 0.35, 0));
  const glass = cmat('#2a3a4a', 0.04); g.add(at(box(0.05, 0.6, 1.6, glass, 'bottom'), 3.21, 0.85, 0));
  const tire = cmat('#151515', 0.05);
  for (const x of [-1.4, 1.4, 2.6]) for (const z of [-0.95, 0.95]) { const t = cyl(0.36, 0.36, 0.25, 10, tire); t.rotation.x = Math.PI / 2; t.position.set(x, 0.36, z); g.add(t); }
  const hl = box(0.05, 0.18, 0.3, new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 3, 2.4), toneMapped: false }), 'bottom'); hl.position.set(3.22, 0.7, 0.6); g.add(hl); const hl2 = hl.clone(); hl2.position.z = -0.6; g.add(hl2);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
export function handTruck() {
  const g = new THREE.Group(); const m = cmat('#c8402e', 0.06);
  for (const x of [-0.25, 0.25]) { const r = box(0.04, 1.3, 0.04, m, 'bottom'); r.position.set(x, 0, -0.05); r.rotation.x = -0.15; g.add(r); }
  g.add(at(box(0.6, 0.03, 0.3, m, 'bottom'), 0, 0.02, 0.08));
  for (const x of [-0.3, 0.3]) { const w = cyl(0.12, 0.12, 0.06, 8, cmat('#111')); w.rotation.z = Math.PI / 2; w.position.set(x, 0.12, -0.08); g.add(w); }
  return g;
}
export function car(color = '#3e6f7a') {
  const g = new THREE.Group(); const m = cmat(color, 0.06), dark = cmat('#20262c', 0.05);
  g.add(at(box(1.8, 0.6, 4.0, m, 'bottom'), 0, 0.3, 0)); g.add(at(box(1.6, 0.55, 2.0, m, 'bottom'), 0, 0.9, -0.3));
  g.add(at(box(1.62, 0.42, 0.05, dark, 'bottom'), 0, 0.95, 0.72));
  for (const x of [-0.85, 0.85]) for (const z of [-1.3, 1.3]) { const t = cyl(0.32, 0.32, 0.22, 10, cmat('#151515')); t.rotation.z = Math.PI / 2; t.position.set(x, 0.32, z); g.add(t); }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
// ---------- roulette ----------
export function roulette(labels) {
  const g = new THREE.Group();
  const n = labels.length;
  const t = textTex('roulette' + n, 512, 512, (c, W, H) => {
    c.translate(256, 256);
    for (let i = 0; i < n; i++) { c.save(); c.rotate(i / n * Math.PI * 2); c.fillStyle = i === 0 ? '#1f8a3a' : i % 2 ? '#c0281d' : '#141414'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 250, -Math.PI / n, Math.PI / n); c.closePath(); c.fill();
      c.fillStyle = '#f6efe0'; c.font = `bold 22px ${SANS}`; c.textAlign = 'center'; c.translate(210, 0); c.rotate(Math.PI / 2); c.fillText(labels[i], 0, 8); c.restore(); }
    c.fillStyle = '#6b4a2a'; c.beginPath(); c.arc(0, 0, 150, 0, 7); c.fill(); c.fillStyle = '#c9a24a'; c.beginPath(); c.arc(0, 0, 40, 0, 7); c.fill();
  });
  const wheel = new THREE.Group(); g.add(wheel);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.52, 0.06, 40), cmat('#4a2e18')); body.castShadow = true; wheel.add(body);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.5, 48), lam({ map: t, flat: false })); face.rotation.x = -Math.PI / 2; face.position.y = 0.031; wheel.add(face);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.04, 6, 40), cmat('#5a3a1e')); rim.rotation.x = Math.PI / 2; rim.position.y = 0.04; g.add(rim);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x444444 })); g.add(ball);
  return { g, wheel, ball, n };
}
export function chips(n = 6, color = '#d22') {
  const g = new THREE.Group(); const m = cmat(color, 0.04);
  for (let i = 0; i < n; i++) { const c = cyl(0.04, 0.04, 0.012, 12, m); c.position.y = i * 0.013 + 0.006; c.rotation.y = i; g.add(c); }
  return g;
}
// ---------- city blocks (utopia) ----------
export function cityBlock(seed, day = true) {
  const R = rng(seed); const g = new THREE.Group();
  const cols = day ? ['#e8eef2', '#cfe3ea', '#f3e9d8', '#d7e7d2'] : ['#2a3140', '#323a4c'];
  const n = 3 + (R() * 3 | 0);
  for (let i = 0; i < n; i++) {
    const w = 1.5 + R() * 2.5, d = 1.5 + R() * 2.5, h = 3 + R() * R() * 22; const col = cols[R() * cols.length | 0];
    const t = ptex(`bld:${col}:${day}`, 16, 32, (c, W, H, RR) => { noiseFill(c, W, H, col, 0.04, RR); for (let y = 2; y < H; y += 4) for (let x = 2; x < W; x += 4) { c.fillStyle = day ? (RR() > 0.5 ? '#7fb3cc' : '#9cc6d8') : (RR() > 0.6 ? '#ffd27a' : '#1a2030'); c.fillRect(x, y, 2, 2); } }, { repeat: [Math.max(1, w / 2) | 0, Math.max(1, h / 4) | 0] });
    const b = box(w, h, d, lam({ map: t }), 'bottom'); b.position.set((R() - 0.5) * 6, 0, (R() - 0.5) * 6); g.add(b);
    if (R() > 0.55) { const gr = box(w * 0.8, 0.3, d * 0.8, cmat('#6fbf5a'), 'bottom'); gr.position.set(b.position.x, h, b.position.z); g.add(gr); }
  }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
export function windTurbine(s = 1) {
  const g = new THREE.Group(); const m = cmat('#f2f2f2', 0.03);
  g.add(at(cyl(0.12 * s, 0.25 * s, 12 * s, 8, m), 0, 6 * s, 0));
  const hub = new THREE.Group(); hub.position.set(0, 12 * s, 0.3 * s); g.add(hub);
  for (let i = 0; i < 3; i++) { const b = box(0.3 * s, 5 * s, 0.06 * s, m, 'bottom'); b.rotation.z = i * Math.PI * 2 / 3; hub.add(b); }
  return { g, hub };
}

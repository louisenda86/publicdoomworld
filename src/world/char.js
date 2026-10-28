// PS1-era anime characters: rigid low-poly segments on a joint hierarchy, painted pixel textures,
// spiky flat-shaded hair with spring-driven secondary motion, swappable face textures.
import * as THREE from 'three';
import { taper, lam, blob, soft, phong } from './kit.js';
// curvy segment shapes (trim, rounded low-poly instead of boxes)
const SH = {
  torso: { seg: 12, rings: 8, sq: 2.3, capT: 0.2, capK: 0.6, prof: s => [1 + 0.05 * Math.sin(Math.PI * s * 0.9), 1 + 0.13 * Math.exp(-(((s - 0.62) / 0.24) ** 2))] },
  shell: { seg: 12, rings: 8, sq: 2.3, capT: 0.2, capK: 0.6, prof: s => [1 + 0.05 * Math.sin(Math.PI * s * 0.9), 1 + 0.13 * Math.exp(-(((s - 0.62) / 0.24) ** 2))] },
  pelvis: { seg: 12, rings: 4, sq: 2.2, capB: 0.4, capK: 0.55 },
  band: { seg: 12, rings: 1, sq: 2.2 },
  neck: { seg: 10, rings: 2, sq: 2 },
  thigh: { seg: 10, rings: 7, bulge: 0.1, at: 0.72, wid: 0.4, capT: 0.22, capB: 0.18, capK: 0.5 },
  shin: { seg: 10, rings: 7, bulge: 0.16, at: 0.74, wid: 0.22, capT: 0.12, capK: 0.4 },
  knee: { seg: 10, rings: 3, capT: 0.4, capB: 0.4, capK: 0.6 },
  ua: { seg: 9, rings: 6, bulge: 0.12, at: 0.6, wid: 0.3, capT: 0.3, capB: 0.2, capK: 0.6 },
  fa: { seg: 9, rings: 6, bulge: 0.14, at: 0.78, wid: 0.25, capT: 0.15, capK: 0.5 },
  hand: { seg: 8, rings: 4, capB: 0.4, capT: 0.2, capK: 0.7, sq: 2.4 },
  digit: { seg: 6, rings: 3, capB: 0.5, capK: 0.8 },
  bulb: { seg: 10, rings: 5, capT: 0.5, capB: 0.5, capK: 0.9 },
  shoe: { seg: 12, rings: 5, sq: 2.6, capT: 0.35, capK: 0.55, rot: 0 },
  // fitness build (NOVA / SUNNY): hourglass torso, full thighs, calves, glutes
  torsoF: { seg: 14, rings: 9, sq: 2.1, capT: 0.2, capK: 0.6, prof: s => [1 - 0.06 * Math.exp(-(((s - 0.12) / 0.16) ** 2)) + 0.1 * Math.exp(-(((s - 0.72) / 0.2) ** 2)), 1 + 0.16 * Math.exp(-(((s - 0.66) / 0.22) ** 2))] },
  pelvisF: { seg: 14, rings: 5, sq: 2.1, capB: 0.38, capK: 0.55, prof: s => [1 + 0.06 * Math.sin(Math.PI * s), 1 + 0.08 * Math.sin(Math.PI * s)] },
  thighF: { seg: 12, rings: 8, bulge: 0.15, at: 0.66, wid: 0.42, capT: 0.22, capB: 0.18, capK: 0.5 },
  shinF: { seg: 12, rings: 8, bulge: 0.24, at: 0.72, wid: 0.2, capT: 0.12, capK: 0.4 },
  uaF: { seg: 10, rings: 6, bulge: 0.16, at: 0.62, wid: 0.28, capT: 0.32, capB: 0.2, capK: 0.6 },
};
const sf = (h, top, bot, mats, opts, shape) => soft(h, top, bot, mats, { ...(opts || {}), ...SH[shape] });
import { ptex, shade, noiseFill, hex2rgb, rgb2hex } from './tex.js';
import { faceTex } from './faces.js';
import { drawStrokesLogo } from '../art/strokes.js';
import { helmet as helmetProp } from './props5.js';
import { clamp, hash2, vox, vnoise, fract } from '../core.js';

// ---------------- textures for clothing parts ----------------
function fabric(key, base, { w = 16, h = 32, amp = 0.07, paint } = {}) {
  return ptex('fab:' + key, w, h, (g, W, H, R) => { noiseFill(g, W, H, base, amp, R); if (paint) paint(g, W, H, R); });
}
const M = (map, extra = {}) => lam({ map, flat: true, ...extra });

// ---------------- head geometry ----------------
function headGeo(hw, hh, hd, chin = 1) {
  const g = new THREE.SphereGeometry(0.5, 12, 10);
  const p = g.attributes.position; const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const s = clamp((-y - 0.02) / 0.48);              // 0 at mid, 1 at chin
    x *= 1 - 0.52 * Math.pow(s, 1.25) * chin;
    z = z > 0 ? z * (1 - 0.18 * s) + 0.07 * s * s * chin : z * (1 + 0.06 * (1 - s));
    if (y < -0.3) y = -0.3 + (y + 0.3) * 1.25;         // longer jaw
    if (z > 0.32) z = 0.32 + (z - 0.32) * 0.55;        // flatter face plane
    x *= hw; y *= hh; z *= hd;
    p.setXYZ(i, x, y, z);
    uv.setXY(i, 0.5 + x / hw, 0.5 + y / hh * 1.0);      // planar front projection (face texture)
  }
  g.computeVertexNormals();
  return g;
}

// one pyramid spike from base centre b (with tangent frame) to tip
function spikeGeo(spikes) {
  const pos = [];
  const v = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), d = new THREE.Vector3();
  for (const s of spikes) {
    const base = new THREE.Vector3(...s.base), tip = new THREE.Vector3(...s.tip);
    const ax = tip.clone().sub(base).normalize();
    const t1 = new THREE.Vector3(...(s.side || [1, 0, 0])); t1.sub(ax.clone().multiplyScalar(t1.dot(ax))).normalize();
    const t2 = ax.clone().cross(t1).normalize();
    const w = s.w / 2, dd = (s.d ?? s.w * 0.55) / 2;
    a.copy(base).addScaledVector(t1, w).addScaledVector(t2, dd); b.copy(base).addScaledVector(t1, -w).addScaledVector(t2, dd);
    c.copy(base).addScaledVector(t1, -w).addScaledVector(t2, -dd); d.copy(base).addScaledVector(t1, w).addScaledVector(t2, -dd);
    const tri = (p, q, r) => pos.push(p.x, p.y, p.z, q.x, q.y, q.z, r.x, r.y, r.z);
    tri(a, b, tip); tri(b, c, tip); tri(c, d, tip); tri(d, a, tip); tri(a, d, c); tri(a, c, b);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  // uv: tip lighter band (simple: per-vertex v from height)
  const uv = []; for (let i = 0; i < pos.length / 3; i++) uv.push(0.5, (i % 3 === 2) ? 1 : 0); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals(); return g;
}
function hairTex(col, hi) {
  // clean painted gradient along each spike: darker root, base colour, lighter tip (no stripes)
  return ptex('hair3:' + col, 4, 16, (g, w, h) => { for (let y = 0; y < h; y++) { const t = y / h; const f = t < 0.25 ? 0.8 : t < 0.62 ? 1.0 : t < 0.86 ? 1.14 : 1.26; g.fillStyle = shade(col, f); g.fillRect(0, y, w, 1); } });
}
// prints (ImageBitmaps) a shot can register before building a character, e.g. PRINTS.strokes
export const PRINTS = {};

// ---------------- character definitions ----------------
export const CAST = {
  JAX: { // main character: mullet; HOMER'S diner crew uniform (cream shirt, red collar + trim, name tag, black half apron, red visor)
    scale: 1.06, skin: '#f2c9a8', build: 'boy',
    face: { skin: '#f2c9a8', iris: '#7a4a28', lash: '#22150f', brow: '#3b2618', eye: 'soft', lookIn: 1 },
    hair: { style: 'mullet', col: '#4a2d1a', hi: '#7a5233' }, visor: { col: '#c8242c', logo: '#f3eee2' },
    top: { col: '#f3eee2', kind: 'uniform', trim: '#c8242c', apron: '#17171a', tag: 'JAX' }, legs: { col: '#1c1c21', kind: 'jeans' }, shoes: { col: '#141416', sole: '#2b2b30', kind: 'sneaker' },
  },
  TOPENG: { // masked graffiti street fighter: red balaclava, white gaiter, PINK The Strokes tee (blue logo), cargo pants, boots
    scale: 1.1, skin: '#9a6744', build: 'muscle',
    face: { skin: '#9a6744', iris: '#2a1a10', lash: '#0e0907', brow: '#0e0907', eye: 'sharp', mask: 'balaclava', knit: '#d8261c', lookIn: -3, eyeH: 17, eyeW: 26, eyeY: 68, eyeX: 26 },
    hair: { style: 'none' },
    top: { col: '#ff8fbf', kind: 'tee', print: 'strokes_blue' }, legs: { col: '#3f3526', kind: 'cargo' }, shoes: { col: '#201b17', sole: '#111', kind: 'boot' },
  },
  NOVA: { // gym girl: black sports bra with violet trim, high-waist leggings, high ponytail
    scale: 0.99, skin: '#f2d0bc', build: 'fit', earring: '#e6e6f0',
    face: { skin: '#f2d0bc', iris: '#7d5bc4', lash: '#1a1220', brow: '#211825', eye: 'tired', blush: true, lashFlick: true, lookIn: 0.5, lip: '#b0406a' },
    hair: { style: 'pony', col: '#1c1824', hi: '#4a4370', tie: '#8b5cf6' },
    top: { col: '#141218', kind: 'sportsbra', trim: '#8b5cf6' },
    legs: { col: '#211b2d', kind: 'leggings', stripe: '#8b5cf6' }, shoes: { col: '#f1eff5', sole: '#141218', kind: 'sneaker' },
  },
  SUNNY: { // gym girl: yellow sports bra with pink trim, pink bike shorts, crew socks, twin tails
    scale: 0.96, skin: '#f6d2b2', build: 'fit', earring: '#ffd43b',
    face: { skin: '#f6d2b2', iris: '#2f9a8a', lash: '#2a1810', brow: '#b8682a', eye: 'round', blush: true, lashFlick: true, lookIn: 0.5, lip: '#e8607a' },
    hair: { style: 'twin', col: '#ee9a3a', hi: '#ffd27a', tie: '#ff63b0' },
    top: { col: '#ffd43b', kind: 'sportsbra', trim: '#ff63b0' },
    legs: { col: '#ff63b0', kind: 'bike', sock: '#ffffff', sockBand: '#ffd43b' }, shoes: { col: '#ffffff', sole: '#ff63b0', kind: 'sneaker' },
  },
  // Named main cast aliases + alternate outfits for Public Doom interactive world
  AYESHA: { // Ayesha: high ponytail, violet eyes, black & violet aesthetic
    scale: 0.99, skin: '#f2d0bc', build: 'fit', earring: '#e6e6f0',
    face: { skin: '#f2d0bc', iris: '#7d5bc4', lash: '#1a1220', brow: '#211825', eye: 'tired', blush: true, lashFlick: true, lookIn: 0.5, lip: '#b0406a' },
    hair: { style: 'pony', col: '#1c1824', hi: '#4a4370', tie: '#8b5cf6' },
    top: { col: '#141218', kind: 'sportsbra', trim: '#8b5cf6' },
    legs: { col: '#211b2d', kind: 'leggings', stripe: '#8b5cf6' }, shoes: { col: '#f1eff5', sole: '#141218', kind: 'sneaker' },
  },
  ATHENA: { // Athena: orange twin-tails, teal eyes, yellow & pink aesthetic
    scale: 0.96, skin: '#f6d2b2', build: 'fit', earring: '#ffd43b',
    face: { skin: '#f6d2b2', iris: '#2f9a8a', lash: '#2a1810', brow: '#b8682a', eye: 'round', blush: true, lashFlick: true, lookIn: 0.5, lip: '#e8607a' },
    hair: { style: 'twin', col: '#ee9a3a', hi: '#ffd27a', tie: '#ff63b0' },
    top: { col: '#ffd43b', kind: 'sportsbra', trim: '#ff63b0' },
    legs: { col: '#ff63b0', kind: 'bike', sock: '#ffffff', sockBand: '#ffd43b' }, shoes: { col: '#ffffff', sole: '#ff63b0', kind: 'sneaker' },
  },
  JAX_STREET: { // Jax in black leather biker jacket over The Strokes tee
    scale: 1.06, skin: '#f2c9a8', build: 'boy',
    face: { skin: '#f2c9a8', iris: '#7a4a28', lash: '#22150f', brow: '#3b2618', eye: 'soft', lookIn: 1 },
    hair: { style: 'mullet', col: '#4a2d1a', hi: '#7a5233' },
    top: { col: '#141418', kind: 'jensen', tee: '#141418' }, legs: { col: '#1c1c21', kind: 'jeans' }, shoes: { col: '#141416', sole: '#f2eee6', kind: 'sneaker' },
  },
  TOPENG_TANK: { // Topeng in weathered white ribbed tank top
    scale: 1.1, skin: '#9a6744', build: 'muscle',
    face: { skin: '#9a6744', iris: '#2a1a10', lash: '#0e0907', brow: '#0e0907', eye: 'sharp', mask: 'balaclava', knit: '#d8261c', lookIn: -3, eyeH: 17, eyeW: 26, eyeY: 68, eyeX: 26 },
    hair: { style: 'none' },
    top: { col: '#ece6dc', kind: 'tank' }, legs: { col: '#3f3526', kind: 'cargo' }, shoes: { col: '#201b17', sole: '#111', kind: 'boot' },
  },
  AYESHA_STAGE: { // Ayesha in cropped jacket & violet pleated skirt
    scale: 0.99, skin: '#f2d0bc', build: 'fit', earring: '#e6e6f0',
    face: { skin: '#f2d0bc', iris: '#7d5bc4', lash: '#1a1220', brow: '#211825', eye: 'tired', blush: true, lashFlick: true, lookIn: 0.5, lip: '#b0406a' },
    hair: { style: 'pony', col: '#1c1824', hi: '#4a4370', tie: '#8b5cf6' },
    top: { col: '#141218', kind: 'jacket', inner: '#8b5cf6' },
    legs: { col: '#181422', kind: 'skirt', skirt: '#6d3fe0', hem: '#c4b5fd', boot: '#141218' }, shoes: { col: '#141218', sole: '#8b5cf6', kind: 'boot' },
  },
  ATHENA_STAGE: { // Athena in white/gold cropped jacket & pleated skirt
    scale: 0.96, skin: '#f6d2b2', build: 'fit', earring: '#ffd43b',
    face: { skin: '#f6d2b2', iris: '#2f9a8a', lash: '#2a1810', brow: '#b8682a', eye: 'round', blush: true, lashFlick: true, lookIn: 0.5, lip: '#e8607a' },
    hair: { style: 'twin', col: '#ee9a3a', hi: '#ffd27a', tie: '#ff63b0' },
    top: { col: '#f7f4ec', kind: 'jacket', inner: '#ffd43b' },
    legs: { col: '#f6d2b2', kind: 'skirt', skirt: '#f7f4ec', hem: '#f59e0b', sock: '#ffffff', sockBand: '#ff63b0' }, shoes: { col: '#ffffff', sole: '#ff63b0', kind: 'sneaker' },
  },
  // THE ODYSSEY bits (sets dressing, not the real cast): a hoplite HERO, ZEUS in a toga, a giant CYCLOPS, a salon STYLIST
  HERO: { scale: 1.05, skin: '#c99a76', build: 'muscle', helmet: '#b8261e',
    face: { skin: '#c99a76', iris: '#2a1a10', lash: '#140e0a', brow: '#2a1a10', eye: 'sharp', beard: '#3a2618', lookIn: 0.5, eyeH: 24 },
    hair: { style: 'short', col: '#2a1a10', hi: '#4a3020' }, top: { col: '#b8833a', kind: 'armor', cape: '#9a1e18' }, legs: { col: '#c99a76', kind: 'skirt', skirt: '#9a1e18', hem: '#b8833a', boot: '#8a6230' }, shoes: { col: '#6a4a2a', sole: '#2a1a10', kind: 'boot' } },
  ZEUS: { scale: 1.08, skin: '#e8c0a0', build: 'boy', laurel: '#d8b23a',
    face: { skin: '#e8c0a0', iris: '#3a6aa0', lash: '#140e0a', brow: '#f0f0f0', eye: 'sharp', beard: '#f2f2f2', lookIn: 0.5 },
    hair: { style: 'swept', col: '#ececec', hi: '#ffffff' }, top: { col: '#f4f0e6', kind: 'toga', trim: '#d8b23a' }, legs: { col: '#e8c0a0', kind: 'skirt', skirt: '#f4f0e6', hem: '#d8b23a' }, shoes: { col: '#8a6230', sole: '#4a3020', kind: 'sneaker' } },
  CYCLOPS: { scale: 3.4, skin: '#8a9a7a', build: 'muscle',
    face: { skin: '#8a9a7a', iris: '#c8a020', lash: '#1a1410', brow: '#2a2a20', eye: 'sharp', cyclops: true, beard: '#3a3a2a', eyeY: 66, eyeW: 30, eyeH: 34 },
    hair: { style: 'none' }, top: { col: '#8a9a7a', kind: 'bare' }, legs: { col: '#8a9a7a', kind: 'skirt', skirt: '#5a4a32', hem: '#3a2a1a' }, shoes: { col: '#7a8a6a', sole: '#3a3a2a', kind: 'boot' } },
  STYLIST: { scale: 0.98, skin: '#d8a888', build: 'girl', earring: '#ffd43b',
    face: { skin: '#d8a888', iris: '#3a2a1a', lash: '#1a1210', brow: '#2a1a12', eye: 'soft', lookIn: 0.5, lip: '#a84a5a' },
    hair: { style: 'long', col: '#5a2a1a', hi: '#8a4a2a' }, top: { col: '#16110f', kind: 'tee' }, legs: { col: '#16110f', kind: 'jeans' }, shoes: { col: '#f3eee2', sole: '#16110f', kind: 'sneaker' } },
  // FOR RESEARCH PURPOSES additions
  ROGAN: { // podcast host caricature: shaved head, short beard, muscular, black tee
    scale: 1.0, skin: '#e2b089', build: 'muscle',
    face: { skin: '#e2b089', iris: '#3a2a1a', lash: '#1e140e', brow: '#3e2a1c', eye: 'sharp', beard: '#4e3a2c', lookIn: 0.5, eyeH: 26, eyeW: 26 },
    hair: { style: 'none' }, top: { col: '#141416', kind: 'tee' }, legs: { col: '#2a2f3a', kind: 'jeans' }, shoes: { col: '#111', sole: '#222', kind: 'sneaker' },
  },
  JUDGE: { scale: 1.02, skin: '#e0b48e', build: 'boy', face: { skin: '#e0b48e', iris: '#2b1d14', lash: '#140e0a', brow: '#d0d0d0', eye: 'sharp' },
    hair: { style: 'swept', col: '#d9d9d9', hi: '#ffffff' }, top: { col: '#111114', kind: 'jacket', inner: '#f2f0ea' }, legs: { col: '#111114', kind: 'jeans' }, shoes: { col: '#111', sole: '#111', kind: 'boot' } },
  CRITIC: { scale: 1.0, skin: '#f0c8a8', build: 'boy', face: { skin: '#f0c8a8', iris: '#3a5a2a', lash: '#140e0a', brow: '#5a4020', eye: 'soft', glasses: '#16110f' },
    hair: { style: 'short', col: '#6a4a2a', hi: '#8a6a4a' }, top: { col: '#b8322a', kind: 'jacket', inner: '#e8e2d4' }, legs: { col: '#2a3040', kind: 'jeans' }, shoes: { col: '#ddd', sole: '#555', kind: 'sneaker' } },
  GUY1: { scale: 1.0, skin: '#c99a76', build: 'boy', face: { skin: '#c99a76', iris: '#2a1a10', lash: '#140e0a', brow: '#1a120c', eye: 'round' }, hair: { style: 'short', col: '#1a120c', hi: '#3a2a1c' }, top: { col: '#2f7a4a', kind: 'hoodie' }, legs: { col: '#2a2f3a', kind: 'jeans' }, shoes: { col: '#eee', sole: '#555', kind: 'sneaker' } },
  GUY2: { scale: 0.98, skin: '#f2cfb0', build: 'boy', face: { skin: '#f2cfb0', iris: '#3a6aa0', lash: '#140e0a', brow: '#c08a3a', eye: 'soft' }, hair: { style: 'swept', col: '#d8a04a', hi: '#f0c070' }, top: { col: '#e9e4d6', kind: 'tee' }, legs: { col: '#5a4a3a', kind: 'cargo' }, shoes: { col: '#7a5a3a', sole: '#333', kind: 'boot' } },
  GUY3: { scale: 1.04, skin: '#8a5a3a', build: 'boy', face: { skin: '#8a5a3a', iris: '#1a1008', lash: '#0e0907', brow: '#0e0907', eye: 'sharp' }, hair: { style: 'short', col: '#0e0907', hi: '#2a1a10' }, top: { col: '#2747c9', kind: 'windbreaker' }, legs: { col: '#1a1c22', kind: 'jeans' }, shoes: { col: '#fff', sole: '#d8262f', kind: 'sneaker' } },
  ELEC: { scale: 1.0, skin: '#f0c8a8', build: 'boy', face: { skin: '#f0c8a8', iris: '#4a6a8a', lash: '#140e0a', brow: '#8a6a3a', eye: 'soft', beard: '#9a7040' }, hair: { style: 'short', col: '#8a6a3a', hi: '#aa8a5a' }, top: { col: '#2a4a8a', kind: 'windbreaker' }, legs: { col: '#2a4a8a', kind: 'cargo' }, shoes: { col: '#2a1a10', sole: '#111', kind: 'boot' } },
  // extras
  VENDOR: { scale: 1.0, skin: '#e7b993', build: 'boy', face: { skin: '#e7b993', iris: '#2b1d14', lash: '#140e0a', brow: '#cfcfcf', eye: 'soft' },
    hair: { style: 'swept', col: '#d9d9d9', hi: '#ffffff' }, top: { col: '#141414', kind: 'leather' }, legs: { col: '#1a1a1a', kind: 'jeans' }, shoes: { col: '#111', sole: '#111', kind: 'boot' } },
  EXEC: { scale: 1.02, skin: '#e8c0a0', build: 'boy', face: { skin: '#e8c0a0', iris: '#3a2a1a', lash: '#140e0a', brow: '#8a8a8a', eye: 'sharp' },
    hair: { style: 'swept', col: '#9a9a9a', hi: '#d0d0d0' }, top: { col: '#2b2d35', kind: 'jacket', inner: '#f2f2f2', tie: '#c0392b' }, legs: { col: '#2b2d35', kind: 'jeans' }, shoes: { col: '#111', sole: '#111', kind: 'boot' } },
  EXEC2: { scale: 0.98, skin: '#c99a76', build: 'boy', face: { skin: '#c99a76', iris: '#2a1a10', lash: '#140e0a', brow: '#1a120c', eye: 'soft' },
    hair: { style: 'short', col: '#1a120c', hi: '#3a2a1c' }, top: { col: '#3a3528', kind: 'jacket', inner: '#e8e4d8', tie: '#2a4a8a' }, legs: { col: '#3a3528', kind: 'jeans' }, shoes: { col: '#2a1a10', sole: '#111', kind: 'boot' } },
  EXTRA: { scale: 1.0, skin: '#e8c0a0', build: 'boy', face: { skin: '#e8c0a0', iris: '#3a2a1a', lash: '#140e0a', brow: '#2a1c12', eye: 'soft' },
    hair: { style: 'short', col: '#2a1c12', hi: '#4a3422' }, top: { col: '#5a6a7a', kind: 'tee' }, legs: { col: '#2a3040', kind: 'jeans' }, shoes: { col: '#ddd', sole: '#555', kind: 'sneaker' } },
};

// AI fan jerseys (variants of the main cast)
for (const [k, base, col, nm, num] of [['FAN_OPUS', 'TOPENG', '#c8642e', 'OPUS', '7'], ['FAN_FABLE', 'NOVA', '#ff7eb6', 'FABLE', '5'], ['FAN_GEMINI', 'SUNNY', '#1db954', 'GEMINI', '10'], ['FAN_ASTRA', 'JAX', '#2747c9', 'ASTRA', '6']])
  CAST[k] = { ...CAST[base], top: { col, kind: 'tee', print: `text:${nm}:${num}` } };

// ---------------- builder ----------------
export class Character {
  constructor(name, overrides = {}) {
    const D = this.D = JSON.parse(JSON.stringify({ ...CAST[name], ...overrides })); this.name = name; this.id = name + (overrides.id || '');
    this.seed = [...this.id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 9973;
    const fit = D.build === 'fit', girl = D.build === 'girl' || fit, musc = D.build === 'muscle';
    const S = this.dims = {
      headW: girl ? 0.212 : 0.222, headH: girl ? 0.262 : 0.272, headD: 0.24,
      neck: 0.075, torso: girl ? 0.3 : 0.32, shW: musc ? 0.46 : fit ? 0.335 : girl ? 0.31 : 0.37, waist: musc ? 0.3 : fit ? 0.215 : girl ? 0.22 : 0.27, chD: musc ? 0.22 : fit ? 0.17 : girl ? 0.16 : 0.18,
      pelvis: 0.12, hipW: fit ? 0.355 : girl ? 0.28 : 0.27, ua: girl ? 0.26 : 0.28, fa: girl ? 0.235 : 0.25, hand: 0.15,
      armT: musc ? 0.12 : fit ? 0.082 : girl ? 0.068 : 0.08, foreT: musc ? 0.095 : fit ? 0.061 : girl ? 0.058 : 0.068,
      th: girl ? 0.41 : 0.42, sh: girl ? 0.4 : 0.41, legT: musc ? 0.16 : fit ? 0.17 : girl ? 0.13 : 0.14, footL: fit ? 0.23 : 0.24, footH: 0.08, hipX: fit ? 0.1 : girl ? 0.085 : 0.09,
    };
    const root = this.root = new THREE.Group(); root.scale.setScalar(D.scale || 1);
    const J = this.J = {};
    const mk = (name, parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); J[name] = g; return g; };
    const legLen = S.th + S.sh + S.footH;
    const hips = mk('hips', root, 0, legLen, 0);
    const spine = mk('spine', hips, 0, 0, 0);
    const chest = mk('chest', spine, 0, 0, 0);
    const neck = mk('neck', chest, 0, S.torso, 0.0);
    const head = mk('head', neck, 0, S.neck, 0.01);
    const shL = mk('shL', chest, S.shW / 2 - S.armT * 0.35, S.torso - 0.045, 0); const shR = mk('shR', chest, -S.shW / 2 + S.armT * 0.35, S.torso - 0.045, 0);
    for (const sh of [shL, shR]) sh.rotation.order = 'XZY';
    const elL = mk('elL', shL, 0, -S.ua, 0), elR = mk('elR', shR, 0, -S.ua, 0);
    const wrL = mk('wrL', elL, 0, -S.fa, 0), wrR = mk('wrR', elR, 0, -S.fa, 0);
    const hipL = mk('hipL', hips, S.hipX, -0.05, 0), hipR = mk('hipR', hips, -S.hipX, -0.05, 0);
    for (const hp of [hipL, hipR]) hp.rotation.order = 'XZY';
    const knL = mk('knL', hipL, 0, -S.th + 0.0, 0), knR = mk('knR', hipR, 0, -S.th, 0);
    const anL = mk('anL', knL, 0, -S.sh, 0), anR = mk('anR', knR, 0, -S.sh, 0);
    head.rotation.order = 'YXZ';
    this.buildBody(); this.buildHead(); this.buildHair();
    this.shadow = blob(0.34 * (D.scale || 1), 0.42); root.add(this.shadow); this.shadow.scale.setScalar(1 / (D.scale || 1));
    this.state = { eyes: 'open', mouth: 'closed', talk: false };
    this.selfLight(0.18);
  }
  // emissive self-light keeps faces readable at night (PS1 games did the same with vertex colours)
  selfLight(k) { this.root.traverse(o => { if (o.isMesh && o.material && !o.userData.noSelf) { const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) if (!m) console.log('UNDEF MAT in', this.name, o.parent && Object.keys(this.J).find(k => this.J[k] === o.parent), o.geometry.type); else if (m.isMeshLambertMaterial || m.isMeshPhongMaterial) { const kk = m.userData.self ?? k; m.emissive.setRGB(kk, kk, kk); m.emissiveMap = m.map; } } }); return this; }
  part(parent, mesh, x = 0, y = 0, z = 0) { mesh.position.set(x, y, z); parent.add(mesh); return mesh; }
  buildBody() {
    const D = this.D, S = this.dims, J = this.J, skinM = M(fabric('skin' + D.skin, D.skin, { amp: 0.03 }));
    const top = D.top, legs = D.legs, sh = D.shoes;
    const fit = D.build === 'fit', girl = D.build === 'girl' || fit, musc = D.build === 'muscle';
    // ----- torso -----
    let chestMats;
    const tcol = top.col;
    const side = M(fabric('tside' + tcol, tcol));
    if (top.kind === 'jacket' || top.kind === 'windbreaker' || top.kind === 'leather') {
      const front = ptex(`front:${top.kind}:${tcol}:${top.inner}`, 32, 32, (g, w, h, R) => {
        noiseFill(g, w, h, tcol, 0.07, R);
        if (top.inner) { noiseFill(g, 0, 0, tcol, 0, R); g.fillStyle = top.inner; g.fillRect(12, 0, 8, h); g.fillStyle = shade(top.inner, 0.85); g.fillRect(12, 0, 1, h); g.fillRect(19, 0, 1, h); }
        g.fillStyle = shade(tcol, 0.7); g.fillRect(11, 0, 1, h); g.fillRect(20, 0, 1, h);                 // open edges
        g.fillStyle = shade(tcol, 1.25); g.fillRect(6, 0, 4, 3); g.fillRect(22, 0, 4, 3);                 // collar
        g.fillStyle = shade(tcol, 0.75); g.fillRect(0, h - 3, w, 3);                                      // waistband
        if (top.star) { g.fillStyle = top.star; const cx = 25, cy = 11; for (const [dx, dy] of [[0, -2], [-1, -1], [0, -1], [1, -1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-1, 1], [1, 1], [-2, 2], [2, 2]]) g.fillRect(cx + dx, cy + dy, 1, 1); }
        if (top.kind === 'leather') { g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(4, 6, 2, 14); g.fillRect(25, 8, 2, 12); }
        if (top.tie) { g.fillStyle = top.tie; g.fillRect(15, 1, 3, 3); g.fillRect(15, 4, 2, 18); g.fillRect(14, 20, 4, 3); g.fillStyle = shade(top.tie, 0.7); g.fillRect(16, 5, 1, 16); }
      });
      const back = fabric('back' + tcol, tcol, { paint: (g, w, h) => { g.fillStyle = shade(tcol, 1.2); g.fillRect(0, 0, w, 2); g.fillStyle = shade(tcol, 0.75); g.fillRect(0, h - 3, w, 3); } });
      chestMats = [side, side, side, side, M(front), M(back)];
    } else if (top.kind === 'jensen') {
      // black tee with the hand-drawn Strokes ring logo; the open leather jacket is a separate shell (below)
      const tee = top.tee || '#141418';
      const front = ptex('jtee:' + tee + D.skin, 512, 512, (g, w, h, R) => {
        noiseFill(g, w, h, tee, 0.05, R, 4);
        g.fillStyle = D.skin; g.beginPath(); g.ellipse(256, 0, 66, 44, 0, 0, 7); g.fill();
        g.strokeStyle = shade(tee, 1.7); g.lineWidth = 12; g.beginPath(); g.ellipse(256, 0, 73, 51, 0, 0, Math.PI); g.stroke();
        drawStrokesLogo(g, 116, 112, 280, 240);
        g.fillStyle = shade(tee, 0.8); g.fillRect(0, h - 20, w, 20);
      });
      const tS = M(fabric('tside' + tee, tee));
      chestMats = [tS, tS, tS, tS, M(front), tS];
    } else if (top.kind === 'tank') {
      // skin torso; the ribbed tank is its own shell (narrow straps at the top, full width at the hem)
      chestMats = [skinM, skinM, skinM, skinM, skinM, skinM];
      const tankF = ptex('tank2:' + tcol + D.skin, 32, 32, (g, w, h, R) => {
        noiseFill(g, w, h, tcol, 0.05, R);
        for (let x = 0; x < w; x += 2) { g.fillStyle = 'rgba(150,140,120,0.18)'; g.fillRect(x, 0, 1, h); }                // ribs
        for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(${120 + R() * 40},${95 + R() * 30},60,${0.08 + R() * 0.14})`; g.fillRect(R() * w, 6 + R() * (h - 6), 1 + R() * 4, 1 + R() * 3); } // grime
        g.save(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.moveTo(9, 0); g.quadraticCurveTo(16, 13, 23, 0); g.fill();   // scoop neck
        g.beginPath(); g.moveTo(0, 0); g.lineTo(5, 0); g.quadraticCurveTo(6, 9, 0, 12); g.fill(); g.beginPath(); g.moveTo(32, 0); g.lineTo(27, 0); g.quadraticCurveTo(26, 9, 32, 12); g.fill(); g.restore();
        g.strokeStyle = shade(tcol, 0.75); g.lineWidth = 1; g.beginPath(); g.moveTo(9, 0); g.quadraticCurveTo(16, 13, 23, 0); g.stroke();
      });
      const tankS = ptex('tankside:' + tcol, 16, 32, (g, w, h, R) => { noiseFill(g, w, h, tcol, 0.05, R); g.clearRect(0, 0, w, 11); });
      this.tankMat = M(tankF, { alphaTest: 0.5 }); this.tankSide = M(tankS, { alphaTest: 0.5 }); this.tankPec = M(fabric('tankpec' + tcol, tcol, { amp: 0.05 }));
    } else if (top.kind === 'hoodie') {
      const front = ptex('hood:' + tcol, 32, 32, (g, w, h, R) => {
        noiseFill(g, w, h, tcol, 0.06, R); g.fillStyle = shade(tcol, 0.72); g.fillRect(7, 19, 18, 1); g.fillRect(7, 19, 1, 10); g.fillRect(24, 19, 1, 10); // pocket
        g.fillStyle = '#e8e3f2'; g.fillRect(13, 2, 1, 9); g.fillRect(18, 2, 1, 8); g.fillStyle = shade(tcol, 0.6); g.fillRect(0, h - 3, w, 3);
        g.fillStyle = shade(tcol, 1.3); g.font = 'bold 6px monospace'; g.fillText('?!', 12, 16);
      });
      chestMats = [side, side, side, side, M(front), side];
    } else if (top.kind === 'sweat') {
      // crewneck sweatshirt with a real print (registered in PRINTS), ribbed collar and hem
      const img = PRINTS[top.print]; const drawn = top.print === 'strokes_drawn';
      const front = ptex('sweat:' + tcol + top.print + D.skin + (img ? 1 : 0), drawn ? 512 : 256, drawn ? 512 : 256, (g, w, h, R) => {
        const k = w / 256; noiseFill(g, w, h, tcol, 0.05, R, 2 * k);
        g.save(); g.scale(k, k);
        g.fillStyle = D.skin; g.beginPath(); g.ellipse(128, 0, 38, 24, 0, 0, 7); g.fill();
        g.strokeStyle = shade(tcol, 1.35); g.lineWidth = 11; g.beginPath(); g.ellipse(128, 0, 45, 31, 0, 0, Math.PI); g.stroke();
        g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1; for (let a = 0.15; a < Math.PI; a += 0.12) { g.beginPath(); g.moveTo(128 + Math.cos(a) * 40, Math.sin(a) * 26); g.lineTo(128 + Math.cos(a) * 50, Math.sin(a) * 36); g.stroke(); }
        g.restore();
        if (drawn) { drawStrokesLogo(g, 42, 84, 428, 367); g.fillStyle = shade(tcol, 0.82); g.fillRect(0, h - 44, w, 44); for (let x = 0; x < w; x += 6) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x, h - 44, 2, 44); } return; }
        if (img) { const tc = document.createElement('canvas'); tc.width = 192; tc.height = 165; const tg = tc.getContext('2d'); tg.imageSmoothingEnabled = true; tg.drawImage(img, 300, 262, 700, 600, 0, 0, 192, 165); tg.globalCompositeOperation = 'destination-in'; const rg = tg.createRadialGradient(96, 82, 52, 96, 82, 98); rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(0.72, 'rgba(0,0,0,1)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); tg.fillStyle = rg; tg.fillRect(0, 0, 192, 165); g.drawImage(tc, 32, 52); }
        g.fillStyle = shade(tcol, 0.82); g.fillRect(0, h - 22, w, 22); for (let x = 0; x < w; x += 4) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x, h - 22, 1, 22); }
      });
      const back = fabric('sweatback' + tcol, tcol, { paint: (g, w, h) => { g.fillStyle = shade(tcol, 0.82); g.fillRect(0, h - 3, w, 3); } });
      chestMats = [side, side, side, side, M(front), M(back)];
    } else if (top.kind === 'armor' || top.kind === 'bare' || top.kind === 'toga') {
      const k2 = top.kind;
      const front = ptex(`t5:${k2}:${tcol}:${top.trim}:${D.skin}`, 64, 64, (g, w, h, R) => {
        if (k2 === 'armor') { noiseFill(g, w, h, tcol, 0.06, R); g.strokeStyle = shade(tcol, 0.62); g.lineWidth = 1.5; g.beginPath(); g.moveTo(32, 6); g.lineTo(32, 60); for (const s of [-1, 1]) { g.moveTo(32, 18); g.quadraticCurveTo(32 + s * 18, 14, 32 + s * 24, 26); } for (const y of [36, 46]) { g.moveTo(22, y); g.lineTo(42, y); } g.stroke(); g.fillStyle = shade(tcol, 1.3); g.fillRect(6, 4, 3, 3); g.fillRect(55, 4, 3, 3); g.fillStyle = shade(tcol, 0.6); g.fillRect(0, h - 5, w, 5); }
        else if (k2 === 'bare') { noiseFill(g, w, h, D.skin, 0.04, R); g.strokeStyle = shade(D.skin, 0.72); g.lineWidth = 1.2; g.beginPath(); for (const s of [-1, 1]) { g.moveTo(32, 16); g.quadraticCurveTo(32 + s * 16, 14, 32 + s * 22, 24); } g.moveTo(32, 26); g.lineTo(32, 60); for (const y of [36, 44, 52]) { g.moveTo(24, y); g.lineTo(40, y); } g.stroke(); }
        else { noiseFill(g, w, h, D.skin, 0.03, R); g.fillStyle = tcol; g.beginPath(); g.moveTo(0, 26); g.lineTo(46, 0); g.lineTo(64, 0); g.lineTo(64, 64); g.lineTo(0, 64); g.closePath(); g.fill(); g.strokeStyle = shade(tcol, 0.82); g.lineWidth = 1; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(4 + k * 10, 40 + k * 2); g.quadraticCurveTo(30 + k * 5, 30 - k * 3, 52 + k * 2, 8 + k * 4); g.stroke(); } g.fillStyle = top.trim || '#d8b23a'; g.beginPath(); g.moveTo(0, 26); g.lineTo(46, 0); g.lineTo(50, 0); g.lineTo(0, 30); g.fill(); }
      });
      const sideT = k2 === 'bare' ? skinM : M(fabric('t5side' + k2 + tcol, k2 === 'toga' ? tcol : tcol));
      const back = k2 === 'bare' ? skinM : M(fabric('t5back' + k2 + tcol, tcol, { paint: (g, w, h) => { if (top.cape) { g.fillStyle = top.cape; g.fillRect(0, 0, w, h); } } }));
      chestMats = [sideT, sideT, k2 === 'toga' ? sideT : sideT, sideT, M(front), back];
    } else if (top.kind === 'uniform') {
      // HOMER'S diner crew shirt: cream, red pointed collar + placket piping, embroidered laurel logo, name tag
      const tr = top.trim;
      const front = ptex('unif:' + tcol + tr + top.tag + D.skin, 256, 256, (g, w, h, R) => {
        noiseFill(g, w, h, tcol, 0.035, R, 2);
        g.fillStyle = D.skin; g.beginPath(); g.moveTo(98, 0); g.lineTo(128, 46); g.lineTo(158, 0); g.fill();                      // V neck opening
        g.fillStyle = tr; for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(128 + sg * 30, 0); g.lineTo(128 + sg * 74, 0); g.lineTo(128 + sg * 62, 30); g.lineTo(128 + sg * 6, 58); g.closePath(); g.fill(); } // collar points
        g.fillStyle = shade(tr, 0.7); for (const sg of [-1, 1]) { g.fillRect(128 + sg * 4 - 1, 46, 2, 190); }
        g.fillStyle = shade(tcol, 0.86); g.fillRect(124, 46, 8, 194);                                                             // placket
        g.fillStyle = '#fbfaf6'; for (let y = 76; y < 236; y += 38) { g.beginPath(); g.arc(128, y, 4.5, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(126, y - 1, 4, 1); g.fillStyle = '#fbfaf6'; }
        // embroidered logo (wearer's left chest = viewer's right)
        g.save(); g.translate(188, 100); g.strokeStyle = tr; g.lineWidth = 3; for (const sg of [-1, 1]) { g.beginPath(); g.arc(0, 0, 22, Math.PI / 2 + sg * 0.25, Math.PI / 2 + sg * 2.2, sg < 0); g.stroke(); for (let k = 0; k < 5; k++) { const a = Math.PI / 2 + sg * (0.55 + k * 0.36); g.fillStyle = tr; g.beginPath(); g.ellipse(Math.cos(a) * 24, Math.sin(a) * 24, 5, 2.4, a + sg * 0.9, 0, 7); g.fill(); } }
        g.fillStyle = tr; g.fillRect(-9, -8, 3, 16); g.fillRect(-1, -8, 3, 16); g.fillRect(7, -8, 3, 16); g.fillRect(-12, -11, 25, 3); g.fillRect(-12, 8, 25, 3);   // column
        g.font = '800 15px "Avenir Next Condensed", Futura, sans-serif'; g.textAlign = 'center'; g.fillText("HOMER'S", 0, 44); g.restore();
        // name tag (viewer's left)
        g.save(); g.translate(46, 84); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(3, 3, 66, 36); g.fillStyle = '#fdfcf8'; g.fillRect(0, 0, 66, 36); g.fillStyle = tr; g.fillRect(0, 0, 66, 11);
        g.fillStyle = '#fff'; g.font = '700 8px "Helvetica Neue", Arial'; g.textAlign = 'center'; g.fillText("HOMER'S", 33, 9); g.fillStyle = '#16110f'; g.font = '800 19px "Avenir Next Condensed", Futura, sans-serif'; g.fillText(top.tag || 'JAX', 33, 31); g.restore();
        g.fillStyle = shade(tcol, 0.84); g.fillRect(0, h - 10, w, 10);
      });
      const back = fabric('unifback' + tcol + tr, tcol, { w: 32, h: 32, paint: (g, w, h) => { g.fillStyle = tr; g.fillRect(0, 0, w, 3); g.fillStyle = shade(tcol, 0.84); g.fillRect(0, h - 2, w, 2); } });
      chestMats = [side, side, side, side, M(front), M(back)];
    } else if (top.kind === 'sportsbra') {
      // gym: sports bra (straps, under-band) over a bare toned midriff with soft ab lines
      const tr = top.trim;
      const abs = (g, w, h, y0) => { g.fillStyle = 'rgba(120,70,50,0.16)'; g.fillRect(w / 2 - 1, y0, 2, h - y0 - 4); for (const y of [y0 + 8, y0 + 18]) { g.fillRect(w / 2 - 12, y, 10, 1); g.fillRect(w / 2 + 2, y, 10, 1); } g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(w / 2 - 12, y0 + 2, 9, 5); g.fillRect(w / 2 + 3, y0 + 2, 9, 5); g.fillStyle = shade(D.skin, 0.78); g.fillRect(w / 2 - 1, h - 10, 2, 2); };
      const front = ptex(`bra:${tcol}:${tr}:${D.skin}`, 64, 64, (g, w, h, R) => {
        noiseFill(g, w, h, D.skin, 0.025, R); noiseFill(g, w, 30, tcol, 0.04, R);
        g.fillStyle = D.skin; g.beginPath(); g.moveTo(14, 0); g.quadraticCurveTo(32, 22, 50, 0); g.fill();                      // scoop
        g.fillStyle = tr; g.beginPath(); g.moveTo(14, 0); g.quadraticCurveTo(32, 22, 50, 0); g.lineTo(48, 0); g.quadraticCurveTo(32, 19, 16, 0); g.fill();
        g.fillStyle = tr; g.fillRect(0, 26, w, 4); g.fillStyle = shade(tcol, 0.7); g.fillRect(0, 30, w, 1);                        // under-band
        abs(g, w, h, 36);
      });
      const side2 = ptex(`braS:${tcol}:${tr}:${D.skin}`, 16, 64, (g, w, h, R) => { noiseFill(g, w, h, D.skin, 0.025, R); noiseFill(g, w, 30, tcol, 0.04, R); g.clearRect(0, 0, w, 0); g.fillStyle = D.skin; g.fillRect(0, 0, w, 10); g.fillStyle = tr; g.fillRect(0, 26, w, 4); });
      const back = ptex(`braB:${tcol}:${tr}:${D.skin}`, 64, 64, (g, w, h, R) => { noiseFill(g, w, h, D.skin, 0.025, R); g.fillStyle = tcol; g.beginPath(); g.moveTo(20, 0); g.lineTo(28, 0); g.lineTo(34, 18); g.lineTo(44, 0); g.lineTo(52, 0); g.lineTo(64, 18); g.lineTo(64, 30); g.lineTo(0, 30); g.lineTo(0, 18); g.closePath(); g.fill(); g.fillStyle = tr; g.fillRect(0, 26, w, 4); g.fillStyle = 'rgba(120,70,50,0.18)'; g.fillRect(31, 34, 2, 26); });
      chestMats = [M(side2), M(side2), side, side, M(front), M(back)];
      this.bustMat = M(ptex(`brabust:${tcol}:${tr}`, 16, 16, (g, w, h, R) => { noiseFill(g, w, h, tcol, 0.05, R); g.fillStyle = tr; g.fillRect(0, h - 2, w, 2); }));
    } else if (top.kind === 'tee' && top.print) {
      // band tee: crew neck + printed logo (64 px so the print reads in close-ups)
      const big = top.print === 'strokes_blue', TS = big ? 512 : 64;
      const front = ptex('teeprint:' + tcol + top.print + D.skin, TS, TS, (g, w, h, R) => {
        if (big) { noiseFill(g, w, h, tcol, 0.04, R, 8); g.fillStyle = D.skin; g.beginPath(); g.ellipse(256, 0, 86, 54, 0, 0, 7); g.fill();
          g.strokeStyle = shade(tcol, 0.82); g.lineWidth = 16; g.beginPath(); g.ellipse(256, 0, 94, 62, 0, 0, Math.PI); g.stroke();
          drawStrokesLogo(g, 96, 118, 320, 274, { seed: 11, pal: { blue: '#2f5fe0', orange: '#1b3d9e', shadow: '#0f1f55', glow: 'rgba(40,80,220,0.0)', spark: '#2f5fe0' } });
          for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(255,170,205,0.5)'; g.fillRect(96 + R() * 320 | 0, 118 + R() * 274 | 0, 2 + R() * 4 | 0, 1); }
          g.fillStyle = shade(tcol, 0.8); g.fillRect(0, h - 24, w, 24); return; }
        noiseFill(g, w, h, tcol, 0.05, R);
        g.fillStyle = D.skin; g.beginPath(); g.ellipse(32, 0, 10, 6, 0, 0, 7); g.fill();
        g.strokeStyle = shade(tcol, 2.2); g.lineWidth = 2; g.beginPath(); g.ellipse(32, 0, 11, 7, 0, 0, Math.PI); g.stroke();
        g.fillStyle = shade(tcol, 0.7); g.fillRect(0, h - 4, w, 4);
        if (top.print.startsWith('text:')) { // fan jersey: name across the chest + a big number
          const [, nm, num] = top.print.split(':'); g.textAlign = 'center'; g.fillStyle = '#f3ecdd';
          g.font = '700 10px "Times New Roman", Times, serif'; g.fillText(nm, 32, 24); g.font = '700 26px "Times New Roman", Times, serif'; g.fillText(num || '', 32, 50);
          g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(0, 56, w, 2);
        }
        if (top.print === 'strokes') {
          g.save(); g.translate(32, 30); g.transform(1, 0, -0.18, 1, 0, 0); g.textAlign = 'center'; g.fillStyle = '#f1ede2';
          g.font = '800 11px "Avenir Next Condensed", Futura, sans-serif'; g.fillText('The', -9, -3);
          g.font = '800 19px "Avenir Next Condensed", Futura, sans-serif'; g.fillText('Strokes', 1, 14);
          g.restore();
          for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(20,20,24,0.35)'; g.fillRect(14 + R() * 38 | 0, 18 + R() * 30 | 0, 1, 1); } // cracked-print wear
        }
      });
      const back = fabric('teeback' + tcol, tcol, { paint: (g, w, h) => { g.fillStyle = shade(tcol, 0.7); g.fillRect(0, h - 3, w, 3); } });
      chestMats = [side, side, side, side, M(front), M(back)];
    } else if (top.kind === 'crop') {
      // K-pop stage look: cropped jacket open over a crop top, bare midriff below
      const inner = top.inner, trim = top.trim || shade(tcol, 1.3), cut = 0.62;
      const front = ptex(`crop:${tcol}:${inner}:${trim}:${D.skin}:${top.studs}:${top.sparkle}`, 32, 32, (g, w, h, R) => {
        const yc = Math.round(h * cut);
        noiseFill(g, w, h, D.skin, 0.03, R); noiseFill(g, w, yc, tcol, 0.06, R);
        g.fillStyle = inner; g.fillRect(10, 2, 12, yc - 4); g.fillStyle = shade(inner, 0.75); g.fillRect(10, yc - 3, 12, 1);
        g.fillStyle = D.skin; g.beginPath(); g.moveTo(11, 0); g.quadraticCurveTo(16, 8, 21, 0); g.fill();
        g.fillStyle = trim; g.fillRect(9, 0, 1, yc); g.fillRect(22, 0, 1, yc); g.fillRect(0, yc - 1, 10, 1); g.fillRect(22, yc - 1, 10, 1);
        if (top.studs) { g.fillStyle = trim; for (let y = 2; y < yc - 2; y += 3) { g.fillRect(6, y, 1, 1); g.fillRect(25, y, 1, 1); } g.fillRect(3, 4, 4, 1); g.fillRect(25, 4, 4, 1); }
        if (top.sparkle) { g.fillStyle = top.sparkle; for (let i = 0; i < 16; i++) { const x = R() * w | 0; if (x > 9 && x < 23) continue; g.fillRect(x, R() * (yc - 2) | 0, 1, 1); } }
        g.fillStyle = shade(D.skin, 0.8); g.fillRect(16, yc + 6, 1, 1);
      });
      const half = (key, W) => ptex(`cropside:${key}:${tcol}:${D.skin}:${trim}`, W, 32, (g, w, h, R) => { const yc = Math.round(h * cut); noiseFill(g, w, h, D.skin, 0.03, R); noiseFill(g, w, yc, tcol, 0.06, R); g.fillStyle = trim; g.fillRect(0, yc - 1, w, 1); });
      chestMats = [M(half('s', 16)), M(half('s', 16)), side, side, M(front), M(half('b', 32))];
      this.bustMat = M(ptex(`cropbust:${tcol}:${inner}:${trim}`, 16, 8, (g, w, h, R) => { noiseFill(g, w, h, inner, 0.05, R); g.fillStyle = tcol; g.fillRect(0, 0, 4, h); g.fillRect(12, 0, 4, h); g.fillStyle = trim; g.fillRect(4, 0, 1, h); g.fillRect(11, 0, 1, h); }));
    } else {
      chestMats = [side, side, side, side, side, side];
    }
    const chestW = S.shW * 0.92;
    const torso = sf(S.torso, [chestW, S.chD], [S.waist, S.chD * 0.92], chestMats, { pivot: 'bottom', off: [0, 0.008] }, fit ? 'torsoF' : 'torso');
    this.part(J.chest, torso);
    if (top.kind === 'jensen') this.buildJacket(chestW);
    if (top.kind === 'hoodie') { const hood = taper(0.12, [0.26, 0.09], [0.22, 0.06], side, { pivot: 'bottom' }); this.part(J.chest, hood, 0, S.torso - 0.07, -S.chD / 2 - 0.02).rotation.x = -0.3; }
    if (fit) { for (const sx of [-1, 1]) { const b = sf(0.105, [0.106, 0.064], [0.112, 0.084], this.bustMat || chestMats[4], { pivot: 'center' }, 'bulb'); this.part(J.chest, b, sx * 0.054, S.torso * 0.64, S.chD / 2 - 0.004).rotation.set(0.12, sx * 0.12, 0); } }
    else if (girl && top.kind !== 'hoodie') { const bust = sf(0.1, [S.shW * 0.62, 0.05], [S.shW * 0.62, 0.07], this.bustMat || chestMats[4], { pivot: 'center' }, 'bulb'); this.part(J.chest, bust, 0, S.torso * 0.66, S.chD / 2 - 0.005); }
    if (top.kind === 'tank') {
      const tank = sf(S.torso * 0.985, [chestW * 1.04, S.chD * 1.1], [S.waist * 1.05, S.chD * 1.02], [this.tankSide, this.tankSide, this.tankSide, this.tankSide, this.tankMat, this.tankMat], { pivot: 'bottom', off: [0, 0.008] }, 'shell');
      tank.geometry.groups = tank.geometry.groups.filter(gr => gr.materialIndex !== 2); this.part(J.chest, tank, 0, -0.012, 0.0);
    }
    if (musc) { // pecs + traps for the fighter
      const teeM = (top.kind === 'tank' || top.kind === 'bare') ? null : side; if (!teeM) { const pec = sf(0.12, [0.15, 0.05], [0.15, 0.06], this.tankPec || skinM, { pivot: 'center' }, 'bulb'); this.part(J.chest, pec, 0.075, S.torso * 0.7, S.chD * 0.5); this.part(J.chest, pec.clone(), -0.075, S.torso * 0.7, S.chD * 0.5); }
      const trap = sf(0.07, [0.12, 0.08], [0.3, 0.14], teeM || skinM, { pivot: 'bottom' }, 'pelvis'); this.part(J.chest, trap, 0, S.torso - 0.035, -0.02);
    }
    // neck
    const neckM = D.face.mask ? M(fabric('gaiter', '#ebe7de', { amp: 0.08, paint: (g, w, h, R) => { for (let y = 0; y < h; y += 3) { g.fillStyle = 'rgba(120,110,95,0.25)'; g.fillRect(0, y, w, 1); } } })) : skinM;
    const nk = sf(S.neck + 0.03, [0.072, 0.075], [0.088, 0.09], neckM, { pivot: 'bottom' }, 'neck'); this.part(J.neck, nk, 0, -0.02, 0);
    if (D.choker) { const ch = soft(0.022, [0.082, 0.082], [0.082, 0.082], M(fabric('choker' + D.choker, D.choker, { paint: (g, w, h) => { g.fillStyle = '#d8d8e0'; g.fillRect(w / 2 - 1, 0, 2, h); } })), { pivot: 'center' }); this.part(J.neck, ch, 0, 0.045, 0.004); }
    if (D.face.mask) { // crumpled neck gaiter pulled over chin and nose
      const gaiter = new THREE.Mesh(new THREE.CylinderGeometry(0.094, 0.1, 0.2, 10, 3, true), M(fabric('gaiter2', '#eeeae2', { amp: 0.1, paint: (g, w, h, R) => { for (let i = 0; i < 20; i++) { g.fillStyle = 'rgba(110,100,85,0.3)'; g.fillRect(R() * w, R() * h, 3, 1); } } }), { side: THREE.DoubleSide }));
      const gp = gaiter.geometry.attributes.position; for (let i = 0; i < gp.count; i++) { const y = gp.getY(i); gp.setX(i, gp.getX(i) * (1 + 0.08 * Math.sin(i * 2.7))); gp.setZ(i, gp.getZ(i) * (1 + 0.08 * Math.cos(i * 1.9)) + (y > 0 ? 0.02 : 0)); }
      gaiter.scale.set(1.0, 1, 1.12); gaiter.geometry.computeVertexNormals(); gaiter.castShadow = true; this.part(J.neck, gaiter, 0, 0.085, 0.012);
    }
    // ----- pelvis / legs -----
    const lcol = legs.col;
    const legM = M(fabric('leg' + lcol + legs.kind, lcol, { paint: (g, w, h, R) => {
      if (legs.kind === 'jeans' || legs.kind === 'shorts') { g.fillStyle = shade(lcol, 1.25); g.fillRect(w - 2, 0, 1, h); }
      if (legs.kind === 'cargo') { g.fillStyle = shade(lcol, 0.75); for (let y = 4; y < h; y += 7) g.fillRect(0, y + (R() * 3 | 0), w, 1); }
      if (legs.kind === 'leggings') { g.fillStyle = legs.stripe; g.fillRect(w - 3, 0, 2, h); g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(w * 0.3, 0, 2, h); }
    } }));
    const pelvisTop = legs.kind === 'skirt' ? M(fabric('skirt' + legs.skirt, legs.skirt)) : legM;
    const shortsM = legs.kind === 'bike' ? M(fabric('bike' + lcol, lcol, { amp: 0.05, paint: (g, w, h) => { g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(w - 3, 0, 1, h); } })) : null;
    const pelvis = sf(S.pelvis * 1.25, [S.waist * 0.98, S.chD * 0.9], [S.hipW, S.chD * 1.02], shortsM || pelvisTop, { pivot: 'top' }, fit ? 'pelvisF' : 'pelvis');
    this.part(J.hips, pelvis, 0, 0.0, 0);
    if (fit) for (const sx of [-1, 1]) { const gl = sf(0.17, [0.15, 0.12], [0.14, 0.13], shortsM || pelvisTop, { pivot: 'center' }, 'bulb'); this.part(J.hips, gl, sx * 0.074, -0.115, -S.chD * 0.4).rotation.set(-0.15, 0, sx * 0.08); }
    // belt
    const beltCol = legs.kind === 'leggings' ? legs.stripe : legs.kind === 'bike' ? shade(lcol, 0.8) : top.kind === 'tank' ? '#2a2018' : '#2a2a2a';
    const belt = soft(0.035, [S.waist * 1.02, S.chD * 0.95], [S.waist * 1.02, S.chD * 0.95], M(fabric('belt' + beltCol, beltCol)), { pivot: 'center' }); this.part(J.hips, belt, 0, -0.005, 0);
    if (top.kind === 'uniform') this.buildApron();
    if (legs.kind === 'skirt') {
      const hem = legs.hem || '#5a4a7a';
      const sk = new THREE.Mesh(new THREE.CylinderGeometry(S.hipW * 0.56, S.hipW * 1.0, 0.25, 12, 1, true), M(ptex('pleat' + legs.skirt + hem + (legs.plaid || ''), 24, 8, (g, w, h, R) => { for (let x = 0; x < w; x++) { g.fillStyle = shade(legs.skirt, x % 2 ? 0.8 : 1.15); g.fillRect(x, 0, 1, h); } if (legs.plaid) { g.fillStyle = legs.plaid; for (let x = 1; x < w; x += 4) g.fillRect(x, 0, 1, h); g.fillRect(0, 2, w, 1); g.fillRect(0, 5, w, 1); } g.fillStyle = hem; g.fillRect(0, h - 2, w, 1); }), { side: THREE.DoubleSide }));
      sk.castShadow = true; this.part(J.hips, sk, 0, -0.125, 0); this.skirt = sk;
      if (legs.chain) { const chn = new THREE.Mesh(new THREE.TorusGeometry(S.hipW * 0.6, 0.008, 3, 14), lam({ color: new THREE.Color(legs.chain), flat: true })); chn.rotation.x = Math.PI / 2 + 0.12; chn.rotation.z = 0.2; this.part(J.hips, chn, 0.01, -0.04, 0.01); }
    }
    const legMats = (upper) => {
      if (legs.boot && !upper) return M(fabric('tallboot' + legs.boot, legs.boot, { amp: 0.06, paint: (g, w, h) => { g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(w - 4, 0, 1, h); g.fillStyle = '#9a9aa6'; for (let y = 4; y < h; y += 7) g.fillRect(2, y, 3, 1); } }));
      if (legs.boot && upper) return M(fabric('thighboot' + legs.boot + lcol, lcol, { amp: 0.04, paint: (g, w, h, R) => { noiseFill(g, w, Math.floor(h * 0.5), lcol, 0.04, R); g.fillStyle = legs.boot; g.fillRect(0, Math.floor(h * 0.5), w, h); g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(w - 4, Math.floor(h * 0.5), 1, h); } }));
      if (legs.sock && !upper && legs.kind !== 'shorts') return M(fabric('kneesock' + legs.sock + D.skin + legs.sockBand, D.skin, { amp: 0.03, paint: (g, w, h) => { g.fillStyle = legs.sock; g.fillRect(0, h * 0.22, w, h * 0.78); if (legs.sockBand) { g.fillStyle = legs.sockBand; g.fillRect(0, h * 0.26, w, 2); g.fillRect(0, h * 0.34, w, 1); } } }));
      if (legs.kind === 'bike' && upper) return M(fabric('bikeT' + lcol + D.skin, D.skin, { amp: 0.03, paint: (g, w, h, R) => { noiseFill(g, w, Math.floor(h * 0.6), lcol, 0.05, R); g.fillStyle = shade(lcol, 0.75); g.fillRect(0, Math.floor(h * 0.6) - 1, w, 1); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(w - 3, 0, 1, Math.floor(h * 0.6)); } }));
      if (legs.kind === 'bike' && !upper) return M(fabric('crew' + legs.sock + D.skin + legs.sockBand, D.skin, { amp: 0.03, paint: (g, w, h) => { g.fillStyle = legs.sock; g.fillRect(0, h * 0.7, w, h * 0.3); g.fillStyle = legs.sockBand; g.fillRect(0, h * 0.72, w, 1); } }));
      if (legs.kind === 'shorts' && !upper) return M(fabric('sock' + legs.sock + D.skin, D.skin, { amp: 0.03, paint: (g, w, h) => { g.fillStyle = legs.sock; g.fillRect(0, h * 0.45, w, h * 0.55); g.fillStyle = shade(legs.sock, 0.8); g.fillRect(0, h * 0.45, w, 1); } }));
      if (legs.kind === 'shorts' && upper) return M(fabric('short' + lcol + D.skin, D.skin, { amp: 0.03, paint: (g, w, h, R) => { noiseFill(g, w, Math.floor(h * 0.28), lcol, 0.07, R); g.fillStyle = shade(lcol, 1.3); g.fillRect(0, Math.floor(h * 0.28), w, 1); } }));
      return legM;
    };
    for (const s of ['L', 'R']) {
      const thigh = sf(S.th + 0.04, [S.legT * 1.04, S.legT * 1.05], [S.legT * (fit ? 0.68 : 0.74), S.legT * (fit ? 0.74 : 0.8)], legMats(true), { pivot: 'top' }, fit ? 'thighF' : 'thigh'); thigh.position.y = 0.03; this.part(J['hip' + s], thigh);
      const shin = sf(S.sh + 0.02, [S.legT * (fit ? 0.68 : 0.74), S.legT * (fit ? 0.72 : 0.78)], [S.legT * (fit ? 0.44 : 0.5), S.legT * (fit ? 0.5 : 0.56)], legMats(false), { pivot: 'top' }, fit ? 'shinF' : 'shin'); this.part(J['kn' + s], shin);
      const kneeCap = sf(0.09, [S.legT * (fit ? 0.68 : 0.74), S.legT * (fit ? 0.74 : 0.8)], [S.legT * (fit ? 0.68 : 0.74), S.legT * (fit ? 0.74 : 0.8)], legMats(false), { pivot: 'center' }, 'knee'); this.part(J['kn' + s], kneeCap);
      if (legs.kind === 'cargo') { const pk = taper(0.12, [0.03, 0.09], [0.035, 0.1], M(fabric('pocket', shade(lcol, 0.9))), { pivot: 'top' }); this.part(J['hip' + s], pk, (s === 'L' ? 1 : -1) * S.legT * 0.55, -S.th * 0.42, 0); }
      // shoe
      const boot = sh.kind === 'boot', plat = sh.kind === 'platform';
      const shoeTex = ptex(`shoe:${sh.col}:${sh.sole}:${sh.kind}`, 16, 16, (g, w, h, R) => { noiseFill(g, w, h, sh.col, boot ? 0.12 : 0.04, R); g.fillStyle = sh.sole; g.fillRect(0, h - (plat ? 8 : 4), w, plat ? 8 : 4); if (!boot) { g.fillStyle = shade(sh.col, 0.8); g.fillRect(3, 3, 10, 1); g.fillRect(3, 6, 10, 1); } else { g.fillStyle = '#5a4f45'; for (let y = 2; y < 10; y += 2) g.fillRect(6, y, 4, 1); } });
      const foot = sf(S.footH + (boot || plat ? 0.05 : 0) + 0.02, [S.legT * 0.6, S.footL * 0.5], [S.legT * 0.8, S.footL * (boot ? 1.04 : 1)], M(shoeTex), { pivot: 'top', botOff: [0, S.footL * 0.3] }, 'shoe'); foot.position.y = 0.02;
      this.part(J['an' + s], foot, 0, (boot || plat ? 0.05 : 0) + 0.02, -0.01);
    }
    // ----- arms -----
    const sleeve = top.kind === 'tank' ? null : side;
    for (const s of ['L', 'R']) {
      const sgn = s === 'L' ? 1 : -1;
      if (top.kind === 'jensen') { this.armLeather(s); continue; }
      const uaM = (top.kind === 'tank' || top.kind === 'sportsbra' || top.kind === 'bare' || top.kind === 'armor') ? skinM : top.kind === 'toga' ? (sgn > 0 ? skinM : side) : top.kind === 'uniform' ? M(fabric('usleeve' + tcol + top.trim + D.skin, D.skin, { amp: 0.03, paint: (g, w, h, R) => { noiseFill(g, w, Math.floor(h * 0.42), tcol, 0.035, R); g.fillStyle = top.trim; g.fillRect(0, Math.floor(h * 0.42) - 2, w, 2); } })) : (top.kind === 'windbreaker' || top.kind === 'jacket' || top.kind === 'hoodie' || top.kind === 'leather' || top.kind === 'crop' || top.kind === 'sweat') ? sleeve : M(fabric('tee' + tcol + D.skin, D.skin, { amp: 0.03, paint: (g, w, h, R) => { noiseFill(g, w, Math.floor(h * 0.4), tcol, 0.06, R); } }));
      const faM = (top.kind === 'jacket' || top.kind === 'windbreaker' || top.kind === 'hoodie' || top.kind === 'leather' || top.kind === 'crop' || top.kind === 'sweat') ? M(fabric('cuff' + tcol + (top.trim || '') + top.kind, tcol, { paint: (g, w, h) => { g.fillStyle = top.trim || shade(tcol, top.kind === 'sweat' ? 0.8 : 0.7); g.fillRect(0, h - (top.kind === 'sweat' ? 6 : 4), w, top.kind === 'sweat' ? 6 : 4); if (top.kind === 'sweat') for (let x = 0; x < w; x += 2) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x, h - 6, 1, 6); } } })) : skinM;
      const ua = sf(S.ua + 0.05, [S.armT * 1.08, S.armT * 1.1], [S.armT * 0.8, S.armT * 0.84], uaM, { pivot: 'top' }, fit ? 'uaF' : 'ua'); this.part(J['sh' + s], ua, 0, 0.02, 0);
      if (D.build === 'muscle') { const bi = sf(0.13, [0.07, 0.06], [0.06, 0.05], skinM, { pivot: 'center' }, 'bulb'); this.part(J['sh' + s], bi, 0, -S.ua * 0.55, S.armT * 0.4); const delt = (top.kind === 'tank' || top.kind === 'bare') ? sf(0.09, [0.15, 0.14], [0.12, 0.12], skinM, { pivot: 'top' }, 'bulb') : sf(0.08, [0.13, 0.125], [0.115, 0.11], side, { pivot: 'top' }, 'bulb'); this.part(J['sh' + s], delt, sgn * 0.01, 0.045, 0); }
      const fa = sf(S.fa + 0.03, [S.foreT * 1.1, S.foreT * 1.1], [S.foreT * 0.74, S.foreT * 0.68], faM, { pivot: 'top' }, 'fa'); fa.position.y = 0.015; this.part(J['el' + s], fa);
      this.buildHand(s, skinM);
    }
  }
  // black half apron tied at the waist: a front shell that swings onto the lap when the hips flex (see apply)
  buildApron() {
    const S = this.dims, J = this.J, col = this.D.top.apron, tr = this.D.top.trim;
    const tex = ptex('apron:' + col + tr, 64, 64, (g, w, h, R) => { noiseFill(g, w, h, col, 0.05, R); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, 0, w, 3);
      g.fillStyle = shade(col, 1.35); g.fillRect(10, 20, 44, 1); g.fillRect(10, 20, 1, 18); g.fillRect(53, 20, 1, 18); g.fillRect(32, 20, 1, 18);            // pocket
      g.fillStyle = '#d8d6cf'; g.fillRect(40, 15, 2, 9); g.fillStyle = tr; g.fillRect(40, 13, 2, 3);                                                 // pen
      g.fillStyle = tr; g.font = '800 7px "Avenir Next Condensed", Futura, sans-serif'; g.textAlign = 'center'; g.fillText("HOMER'S", 21, 48); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, h - 2, w, 2); });
    const geo = new THREE.CylinderGeometry(S.hipW * 0.6, S.hipW * 0.66, 0.34, 10, 2, true, -Math.PI * 0.42, Math.PI * 0.84); geo.translate(0, -0.17, 0);
    const ap = new THREE.Mesh(geo, M(tex, { side: THREE.DoubleSide })); ap.castShadow = true; ap.scale.z = 1.18;
    const piv = new THREE.Group(); piv.position.set(0, 0.0, 0.004); piv.add(ap); J.hips.add(piv); this.apron = piv;
  }
  // five-fingered low-poly hand: palm + 4 two-joint fingers + two-joint thumb. Palm faces local -z (down when the arm
  // reaches forward), thumb on the medial side. apply() curls the joints from p.fist / p.pointX / p.thumbUp.
  buildHand(s, skinM) {
    const S = this.dims, J = this.J, sgn = s === 'L' ? 1 : -1, musc = this.D.build === 'muscle';
    const hw = clamp(S.foreT * 1.12, 0.062, musc ? 0.094 : 0.08), th = hw * 0.4, ph = S.hand * (musc ? 0.5 : 0.48);
    const hg = new THREE.Group(); hg.position.y = 0.004; J['wr' + s].add(hg);
    const palm = soft(ph, [hw * 0.86, th], [hw, th * 0.86], skinM, { pivot: 'top', seg: 10, rings: 3, sq: 2.6, capT: 0.25, capB: 0.18, capK: 0.6 }); hg.add(palm);
    const fingers = [];
    const LEN = [0.92, 1.0, 0.95, 0.76], fl = S.hand * (musc ? 0.43 : 0.47), fw = hw * 0.235, ft = th * 0.82;
    for (let i = 0; i < 4; i++) {
      const k = new THREE.Group(); k.position.set(-sgn * (1.5 - i) * hw * 0.245, -ph + 0.004, -th * 0.04); k.rotation.z = sgn * (i - 1.5) * 0.06; hg.add(k);
      const L = fl * LEN[i];
      const p1 = soft(L * 0.56, [fw, ft], [fw * 0.9, ft * 0.88], skinM, { pivot: 'top', seg: 6, rings: 2, sq: 2.2, capT: 0.3, capK: 0.7 }); k.add(p1);
      const d = new THREE.Group(); d.position.y = -L * 0.54; k.add(d);
      const p2 = soft(L * 0.5, [fw * 0.9, ft * 0.88], [fw * 0.78, ft * 0.74], skinM, { pivot: 'top', seg: 6, rings: 3, sq: 2.2, capB: 0.45, capT: 0.2, capK: 0.85 }); d.add(p2);
      fingers.push({ k, d });
    }
    const tb = new THREE.Group(); tb.position.set(-sgn * hw * 0.44, -ph * 0.32, -th * 0.18); hg.add(tb);
    const tl = fl * 0.82, tw = hw * 0.27;
    const t1 = soft(tl * 0.55, [tw, tw * 0.9], [tw * 0.92, tw * 0.82], skinM, { pivot: 'top', seg: 6, rings: 2, sq: 2.2, capT: 0.35, capK: 0.7 }); tb.add(t1);
    const td = new THREE.Group(); td.position.y = -tl * 0.53; tb.add(td);
    const t2 = soft(tl * 0.48, [tw * 0.92, tw * 0.82], [tw * 0.78, tw * 0.68], skinM, { pivot: 'top', seg: 6, rings: 3, sq: 2.2, capB: 0.45, capK: 0.85 }); td.add(t2);
    this['hand' + s] = { fingers, tb, td, sgn };
  }
  // Jensen-style black leather moto jacket worn open: glossy shell over the tee, wide lapels, stand collar, zips
  leatherTex(key, w, h, paint) {
    const L = this.D.top.col;
    return ptex('lea:' + key + L, w, h, (g, W, H, R) => {
      noiseFill(g, W, H, L, 0.09, R, Math.max(1, W / 64));
      for (let i = 0; i < W * H / 400; i++) { g.fillStyle = `rgba(255,255,255,${0.015 + R() * 0.03})`; g.fillRect(R() * W, R() * H, 2 + R() * W * 0.12, 1); } // creases
      if (paint) paint(g, W, H, R);
    });
  }
  leatherMat(tex, extra = {}) { const m = phong({ map: tex, spec: 0x8a8a96, shin: 36, ...extra }); m.userData.self = 0.32; return m; }
  buildJacket(chestW) {
    const S = this.dims, J = this.J, D = this.D;
    const half = v => v > 0.52 ? 0.17 + (v - 0.52) / 0.48 * 0.17 : 0.17 - (0.52 - v) * 0.03; // opening half-width (u units) by height
    const front = this.leatherTex('front', 128, 128, (g, W, H) => {
      for (let y = 0; y < H; y++) { const v = 1 - y / H, hw = half(v) * W; g.clearRect(W / 2 - hw, y, hw * 2, 1);
        g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(W / 2 - hw - 2, y, 1, 1); g.fillRect(W / 2 + hw + 1, y, 1, 1); }
      g.fillStyle = '#9ea0a8'; for (let y = 52; y < H - 4; y += 3) g.fillRect(W / 2 - half(1 - y / H) * W - 6, y, 2, 2); // open zip teeth
      g.fillStyle = 'rgba(200,200,210,0.55)'; g.save(); g.translate(W * 0.8, H * 0.42); g.rotate(-0.5); g.fillRect(-12, 0, 24, 2); g.restore(); // chest zip pocket
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, H - 6, W, 6); // hem band
    });
    const side = this.leatherTex('side', 32, 64, (g, W, H) => { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, H - 3, W, 3); });
    const back = this.leatherTex('back', 64, 64, (g, W, H) => { g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 16, W, 1); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, H - 4, W, 4); });
    const fM = this.leatherMat(front, { alphaTest: 0.5 }), sM = this.leatherMat(side), bM = this.leatherMat(back);
    const shell = soft(S.torso + 0.075, [chestW * 1.1, S.chD * 1.28], [S.waist * 1.16, S.chD * 1.2], [sM, sM, sM, sM, fM, bM], { pivot: 'bottom', off: [0, 0.006], ...SH.shell, capT: 0.18 });
    this.part(J.chest, shell, 0, -0.085, 0);
    // lapels: folded-back wedges from the collar to mid-chest
    const lapT = this.leatherTex('lapel', 16, 32, (g, W, H) => { g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(0, 0, 1, H); g.fillStyle = '#c8c8d0'; g.fillRect(W - 5, 6, 3, 3); g.fillRect(W - 5, H - 10, 3, 3); });
    const lapM = this.leatherMat(lapT);
    for (const sg of [-1, 1]) {
      const lap = soft(S.torso * 0.5, [0.1, 0.012], [0.012, 0.01], lapM, { pivot: 'top', seg: 4, rings: 2, sq: 2, off: [sg * 0.03, 0] });
      lap.position.set(sg * chestW * 0.21, S.torso - 0.035, S.chD * 0.66); lap.rotation.set(-0.12, sg * 0.42, sg * 0.08); J.chest.add(lap);
    }
    // stand collar (open at the front)
    const colT = this.leatherTex('collar', 64, 16, (g, W, H) => { g.clearRect(W * 0.36, 0, W * 0.28, H); g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(0, 0, W, 1); });
    const colM = this.leatherMat(colT, { alphaTest: 0.5, side: THREE.DoubleSide });
    const col = soft(0.07, [0.15, 0.135], [0.17, 0.15], [colM, colM, colM, colM, colM, colM], { pivot: 'bottom', seg: 12, rings: 1, sq: 2 });
    col.geometry.groups = col.geometry.groups.filter(gr => gr.materialIndex !== 2 && gr.materialIndex !== 3);
    this.part(J.chest, col, 0, S.torso - 0.035, -0.004); col.rotation.x = -0.12;
  }
  armLeather(s) {
    const S = this.dims, J = this.J;
    const sl = this.leatherMat(this.leatherTex('sleeve', 32, 64, (g, W, H) => { g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(W * 0.45, 0, 1, H); }));
    const cuff = this.leatherMat(this.leatherTex('cuff', 32, 64, (g, W, H) => { g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(0, H - 8, W, 8); g.fillStyle = '#b4b6be'; for (let y = H - 22; y < H - 8; y += 3) g.fillRect(W * 0.7, y, 2, 2); }));
    const skinM = M(fabric('skin' + this.D.skin, this.D.skin, { amp: 0.03 }));
    const ua = soft(S.ua + 0.06, [S.armT * 1.28, S.armT * 1.3], [S.armT * 0.98, S.armT * 1.0], sl, { pivot: 'top', ...SH.ua }); this.part(J['sh' + s], ua, 0, 0.025, 0);
    const fa = soft(S.fa + 0.01, [S.foreT * 1.36, S.foreT * 1.36], [S.foreT * 1.08, S.foreT * 1.04], cuff, { pivot: 'top', ...SH.fa }); this.part(J['el' + s], fa, 0, 0.02, 0);
    this.buildHand(s, skinM);
  }
  buildHead() {
    const D = this.D, S = this.dims;
    const geo = headGeo(S.headW, S.headH, S.headD);
    this.faceMat = lam({ map: faceTex(this.id, D.face), flat: false });
    const head = new THREE.Mesh(geo, this.faceMat); head.castShadow = true; head.position.y = S.headH * 0.5 - 0.005;
    this.J.head.add(head); this.headMesh = head;
    // ears
    const skinM = M(fabric('skin' + D.skin, D.face.mask ? (D.face.knit || '#d8261c') : D.skin, { amp: 0.03 }));
    for (const s of [-1, 1]) { const ear = taper(0.05, [0.016, 0.035], [0.012, 0.025], skinM, { pivot: 'center' }); ear.position.set(s * S.headW * 0.49, S.headH * 0.48, -0.0); this.J.head.add(ear); }
    if (D.earring) for (const sx of [-1, 1]) { const er = new THREE.Mesh(new THREE.OctahedronGeometry(0.012, 0), lam({ color: new THREE.Color(D.earring), emissive: new THREE.Color(D.earring), ei: 0.4 })); er.position.set(sx * S.headW * 0.5, S.headH * 0.36, 0.0); er.userData.noSelf = true; this.J.head.add(er); }
    if (D.mic) { // K-pop headset: ear pod + thin boom to the mouth corner
      const mk = lam({ color: 0x1a1a1f, flat: true }); mk.userData = {};
      const pod = taper(0.04, [0.02, 0.045], [0.02, 0.045], mk, { pivot: 'center' }); pod.position.set(S.headW * 0.5, S.headH * 0.47, 0); this.J.head.add(pod);
      const A = new THREE.Vector3(S.headW * 0.5, S.headH * 0.44, 0.01), B = new THREE.Vector3(0.035, S.headH * 0.2, 0.105);
      const len = A.distanceTo(B); const boom = new THREE.Mesh(new THREE.BoxGeometry(0.013, 0.013, len), mk); boom.position.copy(A).lerp(B, 0.5); boom.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), B.clone().sub(A).normalize()); this.J.head.add(boom);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), mk); tip.position.copy(B); this.J.head.add(tip);
    }
    if (D.helmet) { const hm = helmetProp({ crest: D.helmet, s: 1.22 }); hm.position.set(0, S.headH * 0.56, -0.005); this.J.head.add(hm); this.helmet = hm; }
    if (D.laurel) { const lm = lam({ color: new THREE.Color(D.laurel), flat: true }); const ring = new THREE.Group(); ring.position.set(0, S.headH * 0.72, -0.01); ring.scale.set(S.headW * 4.9, 1, S.headD * 4.9); this.J.head.add(ring);
      for (let k = 0; k < 18; k++) { const a = Math.PI * 0.62 + k / 17 * Math.PI * 1.76; const lf = new THREE.Mesh(new THREE.OctahedronGeometry(0.012, 0), lm); lf.scale.set(1, 0.5, 2.2); lf.position.set(Math.sin(a) * 0.1, 0, Math.cos(a) * 0.1); lf.rotation.y = a; ring.add(lf); } }
    if (D.top && D.top.cape) { const cp = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.95, 2, 4), lam({ map: ptex('cape' + D.top.cape, 16, 32, (g, w, h, R) => { noiseFill(g, w, h, D.top.cape, 0.08, R); for (let x = 2; x < w; x += 4) { g.fillStyle = shade(D.top.cape, 0.75); g.fillRect(x, 0, 1, h); } }), side: THREE.DoubleSide }));
      const p2 = cp.geometry.attributes.position; for (let i = 0; i < p2.count; i++) { const y = p2.getY(i); p2.setY(i, y - 0.475); p2.setZ(i, -Math.abs(p2.getX(i)) * 0.15 - (0.475 - y) * 0.08); } cp.geometry.computeVertexNormals(); cp.position.set(0, S.torso - 0.02, -S.chD * 0.62); cp.castShadow = true; this.J.chest.add(cp); }
    if (D.face.mask) { // balaclava crown seam + a slight peak
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 6, 0, Math.PI * 2, 0, 1.2), lam({ map: ptex('knitcrown2', 64, 32, (g, w, h, R) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { g.fillStyle = shade('#d8261c', (x % 3 === 0 ? 0.86 : 1.02) * (0.95 + R() * 0.08)); g.fillRect(x, y, 1, 1); } }), flat: false }));
      crown.scale.set(S.headW * 1.03, S.headH * 1.0, S.headD * 1.03); crown.position.set(0, S.headH * 0.52, -0.004); this.J.head.add(crown);
    }
    if (D.headphones) { // Studio over-ear headphones
      const hpCol = typeof D.headphones === 'string' ? D.headphones : '#ff3b30';
      const bandM = lam({ color: new THREE.Color('#18181f'), flat: true });
      const cupM = lam({ color: new THREE.Color(hpCol), emissive: new THREE.Color(hpCol), ei: 0.25, flat: true });
      const arc = new THREE.Mesh(new THREE.TorusGeometry(S.headW * 0.56, 0.014, 6, 14, Math.PI), bandM);
      arc.position.set(0, S.headH * 0.54, 0);
      this.J.head.add(arc);
      for (const sx of [-1, 1]) {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.032, 10), cupM);
        cup.rotation.z = Math.PI / 2;
        cup.position.set(sx * (S.headW * 0.55), S.headH * 0.48, 0.0);
        this.J.head.add(cup);
      }
    }
    if (D.shades) { // Cyber visor sunglasses
      const shCol = typeof D.shades === 'string' ? D.shades : '#00f0ff';
      const frameM = lam({ color: new THREE.Color('#111116'), flat: true });
      const lensM = lam({ color: new THREE.Color(shCol), emissive: new THREE.Color(shCol), ei: 0.45, flat: true });
      const bar = new THREE.Mesh(new THREE.BoxGeometry(S.headW * 0.96, 0.016, 0.02), frameM);
      bar.position.set(0, S.headH * 0.54, S.headD * 0.49);
      this.J.head.add(bar);
      for (const sx of [-1, 1]) {
        const lens = new THREE.Mesh(new THREE.BoxGeometry(S.headW * 0.38, 0.044, 0.015), lensM);
        lens.position.set(sx * S.headW * 0.23, S.headH * 0.50, S.headD * 0.50);
        this.J.head.add(lens);
      }
    }
    if (D.visor) { // diner visor: open band + curved brim, laurel logo on the front
      const V = D.visor, hw = S.headW / 2, hh = S.headH / 2, hd = S.headD / 2, cy = S.headH * 0.5;
      const btex = ptex('visorband:' + V.col + V.logo, 128, 16, (g, w, h, R) => { noiseFill(g, w, h, V.col, 0.05, R); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, h - 2, w, 2); g.fillStyle = V.logo; g.fillRect(58, 4, 2, 8); g.fillRect(63, 4, 2, 8); g.fillRect(68, 4, 2, 8); g.fillRect(56, 3, 16, 2); g.fillRect(56, 11, 16, 2); for (let k = 0; k < 4; k++) { g.fillRect(51 - k * 2, 5 + k * 2, 2, 1); g.fillRect(75 + k * 2, 5 + k * 2, 2, 1); } });
      const band = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.05, 16, 1, true, Math.PI, Math.PI * 2), lam({ map: btex, side: THREE.DoubleSide })); band.material.userData.self = 0.12;
      band.scale.set(hw * 1.1, 0.8, hd * 1.13); band.position.set(0, cy + hh * 0.84, -0.02); band.rotation.x = 0.3; band.castShadow = true; this.J.head.add(band);
      const sh = new THREE.Shape(); sh.moveTo(-hw * 1.08, 0); sh.quadraticCurveTo(-hw * 0.95, 0.105, 0, 0.115); sh.quadraticCurveTo(hw * 0.95, 0.105, hw * 1.08, 0); sh.quadraticCurveTo(0, 0.035, -hw * 1.08, 0);
      const brim = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.008, bevelEnabled: false, curveSegments: 6 }), lam({ color: new THREE.Color(V.col).multiplyScalar(0.8), flat: true })); brim.material.userData.self = 0.04;
      brim.rotation.x = Math.PI / 2 + 0.12; brim.position.set(0, cy + hh * 0.84 - 0.0, hd * 0.92); brim.scale.set(0.95, 0.85, 1); brim.castShadow = true; this.J.head.add(brim);
    }
  }
  buildHair() {
    const D = this.D, S = this.dims, H = D.hair; if (!H || H.style === 'none') return;
    const mat = lam({ map: hairTex(H.col, null), color: 0xffffff, flat: true });
    const hw = S.headW / 2, hh = S.headH / 2, hd = S.headD / 2, cy = S.headH * 0.5;
    const head = this.J.head;
    // cap: dome over top/back
    const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 7, 0, Math.PI * 2, 0, 1.75), lam({ map: hairTex(H.col, null), flat: true }));
    cap.scale.set(hw * 1.1, hh * 1.06, hd * 1.1); cap.position.set(0, cy + 0.01, -0.012); cap.rotation.x = -0.42; cap.castShadow = true; head.add(cap);
    // helper: point on scalp ellipsoid by yaw (0 = front) and pitch (0 = horizon, +up)
    const P = (yaw, pitch, r = 1.06) => [Math.sin(yaw) * Math.cos(pitch) * hw * r, cy + Math.sin(pitch) * hh * r, Math.cos(yaw) * Math.cos(pitch) * hd * r - 0.01];
    const add = (spikes, pivot) => { const m = new THREE.Mesh(spikeGeo(spikes), mat); m.castShadow = true; if (pivot) { pivot.add(m); } else head.add(m); return m; };
    const fixed = [], dyn = [];
    const rnd = (i, k) => hash2(this.seed + i, k);
    const tip = (b, dx, dy, dz) => [b[0] + dx, b[1] + dy, b[2] + dz];
    if (H.style === 'mullet' || H.style === 'short' || H.style === 'swept') {
      // fringe swept to the right, spiky
      for (let i = 0; i < 5; i++) { const yaw = -0.62 + i * 0.3; const b = P(yaw, 0.62, 1.02); fixed.push({ base: b, tip: tip(b, Math.sin(yaw) * 0.02 - 0.03, -0.055 - rnd(i, 1) * 0.02, 0.045), w: 0.055, side: [1, 0, 0] }); }
      // top spikes
      for (let i = 0; i < 9; i++) { const yaw = -1.2 + (i % 5) * 0.6 + (i > 4 ? 0.3 : 0), pitch = i > 4 ? 0.95 : 0.6; const b = P(yaw, pitch, 0.95); fixed.push({ base: b, tip: tip(b, Math.sin(yaw) * 0.07, 0.05 + rnd(i, 2) * 0.04, Math.cos(yaw) * 0.02 - 0.06), w: 0.08 }); }
      // sides over the ears
      for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const b = P(s * (1.35 + i * 0.35), 0.2, 1.0); fixed.push({ base: b, tip: tip(b, s * 0.02, -0.11 - i * 0.02, -0.01), w: 0.06, side: [0, 0, 1] }); }
      if (H.style === 'mullet') {
        const piv = new THREE.Group(); piv.position.set(0, cy - 0.01, -hd * 0.85); head.add(piv);
        const sp = []; for (let i = 0; i < 7; i++) { const x = (i - 3) * 0.028; const b = [x, 0.02, 0.0]; sp.push({ base: b, tip: [x * 1.5, -0.2 - rnd(i, 3) * 0.06 - (i === 3 ? 0.04 : 0), -0.06 - Math.abs(x) * 0.3], w: 0.065, side: [1, 0, 0] }); }
        for (let i = 0; i < 4; i++) { const x = (i - 1.5) * 0.04; sp.push({ base: [x, 0.08, 0.02], tip: [x * 1.4, -0.12, -0.07], w: 0.07, side: [1, 0, 0] }); }
        add(sp, piv); dyn.push({ piv, k: 1.0, len: 0.2 });
      } else {
        for (let i = 0; i < 6; i++) { const b = P(Math.PI + (i - 2.5) * 0.35, 0.1, 1.0); fixed.push({ base: b, tip: tip(b, 0, -0.08, -0.03), w: 0.07, side: [1, 0, 0] }); }
      }
    } else if (H.style === 'long') {
      // blunt bangs
      for (let i = 0; i < 8; i++) { const yaw = -0.8 + i * 0.23; const b = P(yaw, 0.62, 1.03); fixed.push({ base: b, tip: tip(b, Math.sin(yaw) * 0.01, -0.06, 0.025), w: 0.055, d: 0.02, side: [1, 0, 0] }); }
      for (let i = 0; i < 6; i++) { const yaw = -1.0 + i * 0.4; const b = P(yaw, 0.95, 0.95); fixed.push({ base: b, tip: tip(b, Math.sin(yaw) * 0.05, -0.02, -0.05), w: 0.09 }); }
      // side curtains (dynamic, light)
      for (const s of [-1, 1]) {
        const piv = new THREE.Group(); piv.position.set(s * hw * 0.92, cy + 0.02, 0.01); head.add(piv);
        add([{ base: [0, 0.02, 0], tip: [s * 0.03, -0.32, 0.02], w: 0.06, side: [0, 0, 1] }, { base: [0, 0.02, -0.03], tip: [s * 0.04, -0.36, -0.04], w: 0.06, side: [0, 0, 1] }], piv);
        dyn.push({ piv, k: 0.6, len: 0.3 });
      }
      const piv = new THREE.Group(); piv.position.set(0, cy + 0.02, -hd * 0.8); head.add(piv);
      const sp = []; for (let i = 0; i < 7; i++) { const x = (i - 3) * 0.032; sp.push({ base: [x, 0.04, 0.0], tip: [x * 1.25, -0.46 - rnd(i, 5) * 0.06, -0.06], w: 0.075, d: 0.03, side: [1, 0, 0] }); }
      add(sp, piv); dyn.push({ piv, k: 0.8, len: 0.45 });
    } else if (H.style === 'pony') {
      // gym high ponytail: side-swept fringe, everything else pulled back to a tie at the crown
      for (let i = 0; i < 6; i++) { const yaw = -0.85 + i * 0.3; const b = P(yaw, 0.66, 1.02); fixed.push({ base: b, tip: tip(b, 0.035 + Math.sin(yaw) * 0.015, -0.05 - rnd(i, 1) * 0.02, 0.035), w: 0.056, d: 0.022, side: [1, 0, 0] }); }
      for (let i = 0; i < 7; i++) { const yaw = -1.3 + i * 0.43; const b = P(yaw, 0.7, 0.98); fixed.push({ base: b, tip: tip(b, -Math.sin(yaw) * 0.02, 0.03, -0.09), w: 0.09, d: 0.03 }); }
      for (const sg of [-1, 1]) for (let i = 0; i < 2; i++) { const b = P(sg * (1.3 + i * 0.4), 0.25, 1.0); fixed.push({ base: b, tip: tip(b, 0, 0.04, -0.07), w: 0.06, side: [0, 1, 0] }); }
      const piv = new THREE.Group(); piv.position.set(0, cy + hh * 0.72, -hd * 0.86); head.add(piv);
      const tie = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 8), lam({ color: H.tie || '#8b5cf6' })); tie.rotation.x = Math.PI / 2 - 0.5; piv.add(tie);
      const sp = []; for (let i = 0; i < 8; i++) { const a = i * 0.8; sp.push({ base: [Math.cos(a) * 0.016, 0.0 + Math.sin(a) * 0.012, -0.01], tip: [Math.cos(a) * 0.05 + (rnd(i, 6) - 0.5) * 0.04, -0.34 - rnd(i, 5) * 0.08, -0.07 + Math.sin(a) * 0.03], w: 0.075, d: 0.05, side: [1, 0, 0] }); }
      sp.push({ base: [0, 0.01, 0], tip: [0, 0.07, -0.05], w: 0.07, d: 0.05, side: [1, 0, 0] }); // the loop over the tie
      add(sp, piv); dyn.push({ piv, k: 1.15, len: 0.36 });
    } else if (H.style === 'twin') {
      for (let i = 0; i < 6; i++) { const yaw = -0.8 + i * 0.3; const b = P(yaw, 0.64, 1.02); fixed.push({ base: b, tip: tip(b, -0.03 + Math.sin(yaw) * 0.02, -0.055 - rnd(i, 1) * 0.02, 0.04), w: 0.058, side: [1, 0, 0] }); }
      for (let i = 0; i < 8; i++) { const yaw = -1.6 + i * 0.45; const b = P(yaw, 0.85, 0.96); fixed.push({ base: b, tip: tip(b, Math.sin(yaw) * 0.05, 0.02, -0.05), w: 0.09 }); }
      for (let i = 0; i < 6; i++) { const b = P(Math.PI + (i - 2.5) * 0.4, 0.05, 1.0); fixed.push({ base: b, tip: tip(b, 0, -0.1, -0.02), w: 0.075, side: [1, 0, 0] }); }
      for (const s of [-1, 1]) { const b = P(s * 1.45, 0.1, 1.0); fixed.push({ base: b, tip: tip(b, s * 0.01, -0.12, 0.02), w: 0.05, side: [0, 0, 1] }); }
      for (const s of [-1, 1]) {
        const piv = new THREE.Group(); piv.position.set(s * hw * 1.0, cy + hh * 0.55, -hd * 0.5); head.add(piv);
        const tie = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.035, 6), lam({ color: H.tie || '#ff63b0' })); tie.rotation.z = Math.PI / 2; piv.add(tie);
        const sp = []; for (let i = 0; i < 7; i++) { const a = i * 0.9; sp.push({ base: [s * 0.035 + Math.cos(a) * 0.015, Math.sin(a) * 0.015, 0], tip: [s * (0.08 + rnd(i, 7) * 0.07), -0.3 - rnd(i, 8) * 0.1, -0.04 + Math.cos(a) * 0.05], w: 0.075, d: 0.05, side: [0, 0, 1] }); }
        add(sp, piv); dyn.push({ piv, k: 1.3, len: 0.3, side: s });
      }
    } else if (H.style === 'buns') {
      // Twin Space Buns + face-framing side strands
      for (let i = 0; i < 6; i++) { const yaw = -0.75 + i * 0.3; const b = P(yaw, 0.64, 1.02); fixed.push({ base: b, tip: tip(b, Math.sin(yaw) * 0.02, -0.055, 0.035), w: 0.055, side: [1, 0, 0] }); }
      for (const s of [-1, 1]) {
        const bunG = new THREE.Group();
        bunG.position.set(s * hw * 0.95, cy + hh * 0.86, -hd * 0.35);
        head.add(bunG);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.012, 6, 10), lam({ color: H.tie || '#8b5cf6' }));
        ring.rotation.y = s * 0.6;
        bunG.add(ring);
        const bunMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.068, 0), mat);
        bunMesh.position.set(s * 0.02, 0.02, -0.01);
        bunG.add(bunMesh);
        // Side cheek strand
        const piv = new THREE.Group(); piv.position.set(s * hw * 0.92, cy + 0.02, 0.03); head.add(piv);
        add([{ base: [0, 0.01, 0], tip: [s * 0.02, -0.22, 0.02], w: 0.048, side: [0, 0, 1] }], piv);
        dyn.push({ piv, k: 0.7, len: 0.22, side: s });
      }
    } else if (H.style === 'bob') {
      // Sleek Cyber Bob Cut (blunt bangs + chin-length angled side panels)
      for (let i = 0; i < 8; i++) { const yaw = -0.82 + i * 0.23; const b = P(yaw, 0.62, 1.04); fixed.push({ base: b, tip: tip(b, 0, -0.062, 0.03), w: 0.058, d: 0.022, side: [1, 0, 0] }); }
      for (const s of [-1, 1]) {
        const piv = new THREE.Group(); piv.position.set(s * hw * 0.98, cy + 0.05, 0.0); head.add(piv);
        const sp = [];
        for (let i = 0; i < 4; i++) {
          const zOff = 0.04 - i * 0.035;
          sp.push({ base: [0, 0.02, zOff], tip: [s * 0.015, -0.21 + i * 0.015, zOff + 0.015], w: 0.068, side: [0, 0, 1] });
        }
        add(sp, piv);
        dyn.push({ piv, k: 0.45, len: 0.2, side: s });
      }
      for (let i = 0; i < 6; i++) { const b = P(Math.PI + (i - 2.5) * 0.36, 0.12, 1.02); fixed.push({ base: b, tip: tip(b, 0, -0.14, -0.02), w: 0.075, side: [1, 0, 0] }); }
    }
    if (fixed.length) add(fixed);
    this.hairDyn = dyn;
  }
  // ---------- pose application ----------
  // pose: { root:[x,y,z,ry], hipsY, joints: {name:[rx,ry,rz]}, eyes, mouth }
  apply(p) {
    const J = this.J;
    for (const k in J) J[k].rotation.set(0, 0, 0);
    J.hips.position.y = p.sitH != null ? p.sitH / this.root.scale.y + 0.115 + (p.hipsY || 0) : this.dims.th + this.dims.sh + this.dims.footH + (p.hipsY || 0);
    if (p.joints) for (const k in p.joints) { const r = p.joints[k]; if (J[k]) J[k].rotation.set(r[0] || 0, r[1] || 0, r[2] || 0); }
    if (p.root) { this.root.position.set(p.root[0], p.root[1], p.root[2]); this.root.rotation.y = p.root[3] || 0; }
    if (this.apron) { const a = Math.max(-(p.joints?.hipL?.[0] || 0), -(p.joints?.hipR?.[0] || 0), 0); this.apron.rotation.x = -Math.min(a, 1.55) * 0.97; this.apron.position.z = 0.004 + Math.min(a, 1.5) * 0.03; }
    if (this.skirt) { const a = Math.max(-(p.joints?.hipL?.[0] || 0), -(p.joints?.hipR?.[0] || 0), 0); this.skirt.rotation.x = -Math.min(a, 1.4) * 0.5; this.skirt.scale.set(1, 1 - Math.min(a, 1.4) * 0.2, 1 + Math.min(a, 1.4) * 0.35); }
    // fingers: rest curl grades toward the pinky; fist closes all four; pointX keeps the index straight; thumbUp
    for (const s of ['L', 'R']) {
      const H = this['hand' + s]; if (!H) continue; const sg = H.sgn;
      const f = p.fist?.[s === 'L' ? 0 : 1] ?? (this.D.build === 'muscle' ? 0.85 : 0.12), point = !!p['point' + s], tup = !!p['thumbUp' + s] || (p.thumbUp && s === 'R');
      H.fingers.forEach((F, i) => {
        let c = 0.16 + i * 0.07; c = c + (1 - c) * (point ? 1 : f); if (point && i === 0) c = 0.03;
        F.k.rotation.x = c * 1.5; F.d.rotation.x = c * 1.55; F.k.rotation.z = sg * (i - 1.5) * 0.06 * (1 - c);
      });
      const fc = point ? 1 : f;
      if (tup) { H.tb.rotation.set(0.1, 0, -sg * 1.45); H.td.rotation.set(0, 0, 0); }
      else { H.tb.rotation.set(0.35 + fc * 0.75, sg * fc * 0.3, -sg * (0.55 - fc * 0.25)); H.td.rotation.set(fc * 0.7, 0, 0); }
    }
  }
  setFace(eyes, mouth) {
    if (this._fk === eyes + mouth) return;
    this._fk = eyes + mouth; this.faceMat.map = faceTex(this.id, this.D.face, eyes, mouth); this.faceMat.emissiveMap = this.faceMat.map; this.faceMat.needsUpdate = true;
  }
  // full update: poseFn(t) -> pose. Hair springs integrate the head motion over the last ~0.8 s.
  update(t, poseFn, opts = {}) {
    const p = poseFn(t); this.apply(p);
    // blink + expression + talking
    let eyes = p.eyes || 'open', mouth = p.mouth || 'closed';
    const bl = fract((t + this.seed * 0.37) / (3.1 + (this.seed % 7) * 0.23));
    if (!p.noBlink && (eyes === 'open' || eyes === 'wide' || eyes === 'angry' || eyes === 'sad') && bl < 0.045) eyes = bl < 0.015 || bl > 0.03 ? 'half' : 'closed';
    if (p.talk) { const v = vox(t); mouth = v > 0.42 ? 'talk2' : v > 0.14 ? 'talk1' : (p.mouth || 'closed'); }
    this.setFace(eyes, mouth);
    if (this.hairDyn && this.hairDyn.length) this.hairPhysics(t, poseFn, p);
  }
  hairPhysics(t, poseFn, p) {
    // drive: head yaw/pitch velocity + root velocity + gentle wind, as a damped spring (deterministic re-integration)
    const N = 48, dt = 1 / 60; let ax = 0, vx = 0, az = 0, vz = 0;
    let prev = null;
    for (let i = N; i >= 0; i--) {
      const tt = t - i * dt; const q = i === 0 ? p : poseFn(tt);
      const hj = q.joints || {}; const hy = (hj.head?.[1] || 0) + (hj.neck?.[1] || 0) + (hj.chest?.[1] || 0) + (q.root?.[3] || 0);
      const hp = (hj.head?.[0] || 0) + (hj.chest?.[0] || 0) + (hj.spine?.[0] || 0) + (hj.neck?.[0] || 0);
      const rx = q.root?.[0] || 0, rz = q.root?.[2] || 0, hyb = q.hipsY || 0;
      if (prev) {
        const dYaw = (hy - prev.hy) / dt, dPitch = (hp - prev.hp) / dt, dX = (rx - prev.rx) / dt, dZ = (rz - prev.rz) / dt, dY = (hyb - prev.hyb) / dt;
        const ry = q.root?.[3] || 0; const fwd = dX * Math.sin(ry) + dZ * Math.cos(ry), lat = dX * Math.cos(ry) - dZ * Math.sin(ry);
        const fx = -dPitch * 0.9 + fwd * 1.4 + dY * 2.2 + Math.sin(tt * 1.7 + this.seed) * 0.4;
        const fz = dYaw * 0.8 + lat * 1.4;
        const K = 70, C = 7.5;
        vx += (fx * 6 - K * ax - C * vx) * dt; ax += vx * dt;
        vz += (fz * 6 - K * az - C * vz) * dt; az += vz * dt;
      }
      prev = { hy, hp, rx, rz, hyb };
    }
    for (const d of this.hairDyn) {
      d.piv.rotation.x = clamp(ax * d.k * 0.6 + (hp_rest(p) * 0.8), -0.25, 1.1);
      d.piv.rotation.z = clamp(az * d.k * 0.5, -0.6, 0.6) + (d.side ? d.side * 0.06 : 0);
    }
    function hp_rest(q) { const j = q.joints || {}; return -((j.head?.[0] || 0) + (j.neck?.[0] || 0)) * 0.7; } // keep hanging under gravity when the head pitches
  }
}

// ---------------- pose library (pure functions of t) ----------------
// joint angle conventions: shoulder [flex(+back,-fwd), twist, abduct(+out for L, -out for R)], elbow [-bend], hip [-fwd], knee [+bend], head [+down, +left]
export function idle(t, seed = 0, a = 1) {
  const br = Math.sin(t * 2.1 + seed) * 0.5 + 0.5;
  const n1 = vnoise(t * 0.35, seed), n2 = vnoise(t * 0.27, seed + 9);
  return {
    hipsY: -0.004 * br,
    joints: {
      hips: [0, n2 * 0.05 * a, n1 * 0.02 * a], chest: [0.015 * br * a - 0.02, -n2 * 0.04 * a, -n1 * 0.02 * a], neck: [0.02, 0, 0],
      head: [n2 * 0.06 * a + 0.04, n1 * 0.12 * a, n1 * 0.03 * a],
      shL: [0.05, 0, 0.1 + 0.02 * br], shR: [0.05, 0, -0.1 - 0.02 * br], elL: [-0.18, 0, 0], elR: [-0.18, 0, 0], wrL: [0, 0.3, 0], wrR: [0, -0.3, 0],
      hipL: [0, 0, 0.03], hipR: [0, 0, -0.03], knL: [0.02, 0, 0], knR: [0.02, 0, 0],
    },
  };
}
export function merge(base, over) {
  const out = { ...base, ...over, joints: { ...(base.joints || {}) } };
  if (over.joints) for (const k in over.joints) out.joints[k] = over.joints[k];
  return out;
}
export function addJ(base, add) { const out = { ...base, joints: { ...base.joints } }; for (const k in add) { const a = out.joints[k] || [0, 0, 0], b = add[k]; out.joints[k] = [a[0] + (b[0] || 0), a[1] + (b[1] || 0), a[2] + (b[2] || 0)]; } return out; }
export function blendPose(a, b, u) {
  const out = { ...(u < 0.5 ? a : b), joints: {} };
  const keys = new Set([...Object.keys(a.joints || {}), ...Object.keys(b.joints || {})]);
  for (const k of keys) { const x = a.joints[k] || [0, 0, 0], y = b.joints[k] || [0, 0, 0]; out.joints[k] = [x[0] + (y[0] - x[0]) * u, x[1] + (y[1] - x[1]) * u, x[2] + (y[2] - x[2]) * u]; }
  out.hipsY = (a.hipsY || 0) + ((b.hipsY || 0) - (a.hipsY || 0)) * u;
  if (a.root && b.root) out.root = a.root.map((v, i) => v + (b.root[i] - v) * u);
  return out;
}
export const POSE = {
  crossArms: { shL: [-0.48, -1.25, 0.18], shR: [-0.48, 1.25, -0.18], elL: [-1.9, 0, 0], elR: [-1.82, 0, 0], wrL: [0, 0, 0], wrR: [0, 0, 0] },
  hipsHands: { shL: [0.15, -1.5, 0.62], shR: [0.15, 1.5, -0.62], elL: [-1.65, 0, 0], elR: [-1.65, 0, 0] },
  pocket: { shL: [0.25, 0, 0.12], shR: [0.25, 0, -0.12], elL: [-0.35, 0, 0], elR: [-0.35, 0, 0] },
  fightStance: { shL: [0.05, 0, 0.32], shR: [0.05, 0, -0.32], elL: [-0.35, 0, -0.1], elR: [-0.35, 0, 0.1], hipL: [0, 0, 0.16], hipR: [0, 0, -0.16], anL: [0, 0, -0.14], anR: [0, 0, 0.14] },
  pointFwdR: { shR: [-1.45, 0, -0.12], elR: [-0.1, 0, 0] },
  pointCamR: { shR: [-1.35, 0.0, -0.05], elR: [-0.15, 0, 0] },
  thumbsUpR: { shR: [-0.5, 0, -0.25], elR: [-1.5, -0.4, 0] },
  shrug: { shL: [-0.1, 0.9, 0.45], shR: [-0.1, -0.9, -0.45], elL: [-1.45, 0, 0], elR: [-1.45, 0, 0], wrL: [0, 0, -0.6], wrR: [0, 0, 0.6], neck: [0, 0, 0.12] },
  armsUp: { shL: [-0.3, 0, 2.6], shR: [-0.3, 0, -2.6], elL: [-0.3, 0, 0], elR: [-0.3, 0, 0] },
  carry: { shL: [-0.85, 0, 0.18], shR: [-0.85, 0, -0.18], elL: [-0.85, 0.4, 0], elR: [-0.85, -0.4, 0] },
  push: { shL: [-1.35, 0, 0.12], shR: [-1.35, 0, -0.12], elL: [-0.35, 0, 0], elR: [-0.35, 0, 0], chest: [0.25, 0, 0] },
  typing: { shL: [-0.55, 0, 0.12], shR: [-0.55, 0, -0.12], elL: [-1.05, 0.3, 0], elR: [-1.05, -0.3, 0] },
  hugKnees: { shL: [-0.75, -0.9, 0.12], shR: [-0.75, 0.9, -0.12], elL: [-1.35, 0, 0], elR: [-1.35, 0, 0] },
  phone: { shR: [-0.6, 0, -0.15], elR: [-1.9, -0.4, 0], shL: [0.05, 0, 0.1], elL: [-0.2, 0, 0] },
  handChin: { shR: [-0.6, 0, -0.1], elR: [-2.3, -0.3, 0] },
};
export function sitPose(seatH, legs = 1) {
  return { hipsY: -0.0, sitH: seatH, joints: { hipL: [-1.5, 0, 0.06], hipR: [-1.5, 0, -0.06], knL: [1.45 * legs, 0, 0], knR: [1.45 * legs, 0, 0], anL: [0.05, 0, 0], anR: [0.05, 0, 0] } };
}
// walk cycle at phase ph (cycles), speed scales amplitude
export function walk(ph, amp = 1) {
  const s = Math.sin(ph * Math.PI * 2), c = Math.cos(ph * Math.PI * 2);
  const kneeL = Math.max(0, -Math.sin(ph * Math.PI * 2 - 0.9)) * 0.9, kneeR = Math.max(0, Math.sin(ph * Math.PI * 2 - 0.9)) * 0.9;
  return {
    hipsY: -Math.abs(c) * 0.025 * amp + 0.01,
    joints: {
      hipL: [-s * 0.42 * amp, 0, 0.02], hipR: [s * 0.42 * amp, 0, -0.02], knL: [kneeL * amp + 0.05, 0, 0], knR: [kneeR * amp + 0.05, 0, 0],
      anL: [s * 0.15 * amp, 0, 0], anR: [-s * 0.15 * amp, 0, 0],
      shL: [s * 0.38 * amp, 0, 0.08], shR: [-s * 0.38 * amp, 0, -0.08], elL: [-0.25 - Math.max(0, -s) * 0.3, 0, 0], elR: [-0.25 - Math.max(0, s) * 0.3, 0, 0],
      chest: [0.04, -s * 0.06 * amp, 0], hips: [0, s * 0.08 * amp, 0], head: [0.02, s * 0.03, 0],
    },
  };
}
// head look toward a world-space target from a character root (yaw only + pitch)
export function lookAt(ch, from, tgt) {
  const dx = tgt[0] - from[0], dy = tgt[1] - from[1], dz = tgt[2] - from[2];
  const yaw = Math.atan2(dx, dz) - (from[3] || 0); const pitch = -Math.atan2(dy, Math.hypot(dx, dz));
  return [clamp(pitch, -0.6, 0.6), clamp(((yaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI, -1.2, 1.2), 0];
}

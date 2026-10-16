// Environment pieces: sky domes, stars, moon, lights, voxel terrain, water, low-poly trees.
import * as THREE from 'three';
import { ptex, shade, noiseFill, hex2rgb } from './tex.js';
import { lam, basic, box, cmat } from './kit.js';
import { rng, fbm2, hash2, clamp } from '../core.js';

export function skyDome(top, mid, bot, r = 400) {
  const g = new THREE.SphereGeometry(r, 24, 16); const col = [];
  const A = new THREE.Color(top), B = new THREE.Color(mid), Cc = new THREE.Color(bot); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i) / r; const c = y > 0.12 ? B.clone().lerp(A, clamp((y - 0.12) / 0.6)) : Cc.clone().lerp(B, clamp((y + 0.1) / 0.22)); col.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  m.renderOrder = -10; return m;
}
export function stars(n = 900, r = 380, seed = 3) {
  const R = rng(seed); const pos = [], col = [];
  for (let i = 0; i < n; i++) { const u = R() * 2 - 1, a = R() * Math.PI * 2; const y = Math.abs(u) * 0.9 + 0.08; const s = Math.sqrt(1 - y * y); pos.push(Math.cos(a) * s * r, y * r, Math.sin(a) * s * r); const b = 0.5 + R() * 0.8; col.push(b, b, b * 1.05); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false }));
}
export function moon(pos = [-120, 160, -260], r = 9) {
  const t = ptex('moon', 32, 32, (g, w, h, R) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4f1dc'; g.beginPath(); g.arc(16, 16, 14, 0, 7); g.fill(); g.fillStyle = '#d9d3b8'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(8 + R() * 16, 8 + R() * 16, 1 + R() * 2.5, 0, 7); g.fill(); } });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: t, transparent: true, blending: THREE.AdditiveBlending, fog: false, depthWrite: false, color: new THREE.Color(1.6, 1.6, 1.5) }));
  m.position.set(...pos); m.lookAt(0, 0, 0); return m;
}
export function lights(scene, { hemiSky = 0x9db6e6, hemiGround = 0x3a4a3a, hemi = 1.2, sun = 0xffffff, sunI = 1.6, sunPos = [8, 14, 6], shadow = true, area = 14, amb = 0 } = {}) {
  const h = new THREE.HemisphereLight(hemiSky, hemiGround, hemi); scene.add(h);
  const d = new THREE.DirectionalLight(sun, sunI); d.position.set(...sunPos); d.target.position.set(0, 0, 0);
  if (shadow) { d.castShadow = true; d.shadow.mapSize.set(2048, 2048); const c = d.shadow.camera; c.left = -area; c.right = area; c.top = area; c.bottom = -area; c.near = 0.5; c.far = 80; d.shadow.bias = -0.0005; d.shadow.normalBias = 0.02; d.shadow.radius = 3; }
  scene.add(d); scene.add(d.target);
  if (amb) scene.add(new THREE.AmbientLight(0xffffff, amb));
  return { hemi: h, sun: d };
}

// voxel terrain: instanced 1 m blocks with grass tops and dirt sides
export function grassMats(day = true) {
  const top = ptex('grass_top' + day, 16, 16, (g, w, h, R) => { noiseFill(g, w, h, day ? '#5fa53d' : '#3c6e34', 0.12, R); for (let i = 0; i < 18; i++) { g.fillStyle = day ? '#7cc24f' : '#4f8a40'; g.fillRect(R() * w | 0, R() * h | 0, 1, 1); } });
  const side = ptex('grass_side' + day, 16, 16, (g, w, h, R) => { noiseFill(g, w, h, '#7a5634', 0.12, R); for (let x = 0; x < w; x++) { const d = 3 + (R() * 3 | 0); g.fillStyle = day ? '#5fa53d' : '#3c6e34'; g.fillRect(x, 0, 1, d); } });
  const dirt = ptex('dirt', 16, 16, (g, w, h, R) => noiseFill(g, w, h, '#7a5634', 0.12, R));
  const L = m => lam({ map: m, flat: true });
  return [L(side), L(side), L(top), L(dirt), L(side), L(side)];
}
export function voxelTerrain({ x0 = -30, x1 = 30, z0 = -30, z1 = 30, height = (x, z) => 0, mats = grassMats(), seed = 1, skip = null, depth = 2 }) {
  const cells = [];
  for (let x = x0; x < x1; x++) for (let z = z0; z < z1; z++) {
    if (skip && skip(x, z)) continue;
    const h = Math.round(height(x + 0.5, z + 0.5));
    for (let k = 0; k < depth; k++) cells.push([x + 0.5, h - 0.5 - k, z + 0.5]);
  }
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const im = new THREE.InstancedMesh(geo, mats, cells.length);
  const m4 = new THREE.Matrix4(), c = new THREE.Color();
  cells.forEach((p, i) => { m4.makeTranslation(p[0], p[1], p[2]); im.setMatrixAt(i, m4); const v = 0.86 + hash2(p[0] * 7 | 0, p[2] * 13 | 0) * 0.22; im.setColorAt(i, c.setRGB(v, v, v)); });
  im.receiveShadow = true; im.castShadow = false;
  return im;
}
export function water(size = 400, day = true, y = -0.35) {
  const t = ptex('water' + day, 32, 32, (g, w, h, R) => { noiseFill(g, w, h, day ? '#3f8fc9' : '#1b2f5a', 0.1, R); for (let i = 0; i < 40; i++) { g.fillStyle = day ? '#7cc0ec' : '#36507e'; g.fillRect(R() * w | 0, R() * h | 0, 2 + (R() * 3 | 0), 1); } }, { repeat: [size / 6, size / 6] });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), lam({ map: t, flat: true, emissive: day ? 0x103050 : 0x050a18 }));
  m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; m.userData.tex = t; return m;
}
// low-poly tree: box trunk + 3-4 faceted foliage clumps
export function tree(seed = 1, s = 1, day = true) {
  const R = rng(seed); const g = new THREE.Group();
  const bark = cmat('#6a4a2e', 0.12);
  const trunk = box(0.35 * s, 2.2 * s, 0.35 * s, bark, 'bottom'); g.add(trunk);
  const leafT = ptex('leaf' + day, 16, 16, (gg, w, h, RR) => { noiseFill(gg, w, h, day ? '#4e9a3a' : '#2f5e2e', 0.16, RR); });
  const lm = lam({ map: leafT, flat: true });
  const n = 3 + (R() * 2 | 0);
  for (let i = 0; i < n; i++) { const r = (0.9 + R() * 0.6) * s; const ico = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), lm); ico.position.set((R() - 0.5) * 1.2 * s, (2.2 + R() * 1.1) * s, (R() - 0.5) * 1.2 * s); ico.rotation.set(R() * 3, R() * 3, R() * 3); ico.castShadow = true; ico.receiveShadow = true; g.add(ico); }
  trunk.castShadow = true; return g;
}
export function bush(seed = 1, s = 1, day = true) {
  const R = rng(seed); const g = new THREE.Group();
  const lm = lam({ map: ptex('leaf' + day, 16, 16, (gg, w, h, RR) => { noiseFill(gg, w, h, day ? '#4e9a3a' : '#2f5e2e', 0.16, RR); }), flat: true });
  for (let i = 0; i < 3; i++) { const ico = new THREE.Mesh(new THREE.IcosahedronGeometry((0.35 + R() * 0.25) * s, 0), lm); ico.position.set((R() - 0.5) * 0.6 * s, 0.3 * s, (R() - 0.5) * 0.6 * s); ico.castShadow = true; g.add(ico); }
  return g;
}
// flat ground plane with a tiled pixel texture
export function ground(texKey, color, size = 60, rep = 30, amp = 0.1, paint) {
  const t = ptex(texKey, 16, 16, (g, w, h, R) => { noiseFill(g, w, h, color, amp, R); if (paint) paint(g, w, h, R); }, { repeat: [rep, rep] });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), lam({ map: t, flat: true })); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; return m;
}

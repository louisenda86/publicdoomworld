// PUBLIC DOOM — PS1-style boot intro. Two screens, like the console's BIOS:
//   i01 (bright): polygon shards fly in and lock into the P(●) emblem, wordmark fades in under it.
//   i02 (dark):   the 3D PUBLIC DOOM wordmark rises off a glossy black floor, licensed-by line, CRT power-off.
import * as THREE from 'three';
import { clamp, E, lerp, rng, fbm2 } from '../core.js';
import { lam, basic } from '../world/kit.js';
import { text3d } from '../world/glyph3d.js';
import { MONO, pixText } from '../ov/overlay.js';
// the channel ident keeps the PUBLIC DOOM brand palette + Futura regardless of the film's template
const C = { ink: '#170e1f', bone: '#f5efe0', slime: '#c4f03a', pink: '#ff63b0', volt: '#4a5cff', black: '#170e1f', cream: '#f5efe0' };
const SANS = 'Futura, "Avenir Next", "Helvetica Neue", sans-serif';
const pixF = (g, s, x, y, o = {}) => pixText(g, s, x, y, { font: SANS, ...o });
import { camera, aim } from './kit.js';

export const INTRO = { i01: 0, i02: 4.2, end: 8.2 };
const PSX = { ps1: 3, affine: 0.8, dither: 1, grain: 0.022, scan: 0.1, barrel: 0.07, ca: 0.3, bloom: 0.45, bloomThresh: 0.95 };
const col = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);
const M = (h, k = 1, ex = {}) => { const m = lam({ color: col(h, k), flat: true, ...ex }); return m; };

// --- shards: every triangle of a mesh flies in from off-screen and snaps into place ---
function shatterable(mesh, seed, { dist = [3.5, 8], spin = 7, stagger = 0.55, toward = 1.2 } = {}) {
  let g = mesh.geometry; if (g.index) { g = g.toNonIndexed(); mesh.geometry = g; }
  const pos = g.attributes.position; const base = pos.array.slice(); const n = pos.count / 3;
  const R = rng(seed); g.computeBoundingBox(); const bb = g.boundingBox; const tris = [];
  for (let i = 0; i < n; i++) {
    const c = [0, 0, 0]; for (let k = 0; k < 3; k++) for (let a = 0; a < 3; a++) c[a] += base[(i * 3 + k) * 3 + a] / 3;
    const th = R() * Math.PI * 2, z = R() * 2 - 1, s = Math.sqrt(1 - z * z), d = dist[0] + R() * (dist[1] - dist[0]);
    const dir = [Math.cos(th) * s * 1.6, Math.sin(th) * s, Math.abs(z) * toward + 0.25];
    const ax = new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).normalize();
    const ord = (c[0] - bb.min.x) / (bb.max.x - bb.min.x + 1e-6);
    tris.push({ c, off: dir.map(v => v * d), ax, ang: (R() * 2 - 1) * spin, delay: ord * 0.6 + R() * 0.4 });
  }
  mesh.frustumCulled = false;
  const q = new THREE.Quaternion(), v = new THREE.Vector3();
  let last = -1;
  return (u) => {
    if (u === last) return; last = u; const a = pos.array;
    for (let i = 0; i < n; i++) {
      const T = tris[i]; const p = clamp((u - T.delay * stagger) / (1 - stagger));
      if (p >= 1) { for (let k = 0; k < 9; k++) a[i * 9 + k] = base[i * 9 + k]; continue; }
      const e = E.outC(p); q.setFromAxisAngle(T.ax, T.ang * (1 - e)); const sc = lerp(0.15, 1, e);
      for (let k = 0; k < 3; k++) {
        const o = (i * 3 + k) * 3; v.set(base[o] - T.c[0], base[o + 1] - T.c[1], base[o + 2] - T.c[2]).multiplyScalar(sc).applyQuaternion(q);
        a[o] = T.c[0] + v.x + T.off[0] * (1 - e); a[o + 1] = T.c[1] + v.y + T.off[1] * (1 - e); a[o + 2] = T.c[2] + v.z + T.off[2] * (1 - e);
      }
    }
    pos.needsUpdate = true;
  };
}

// --- emblem parts ---
function paren(h, thick, mats, flip = false) {
  const R = h * 0.78, a0 = Math.asin((h / 2) / R), seg = 5; const pts = [];
  const X = (a) => -Math.cos(a) * R + Math.cos(a0) * R;
  for (let i = 0; i <= seg; i++) { const a = -a0 + 2 * a0 * i / seg; pts.push(new THREE.Vector2(X(a), Math.sin(a) * R)); }
  for (let i = seg; i >= 0; i--) { const a = -a0 + 2 * a0 * i / seg; const w = 0.28 + 0.72 * Math.cos((a / a0) * Math.PI / 2); pts.push(new THREE.Vector2(X(a) + thick * w, Math.sin(a) * R * 0.985)); }
  const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: 0.3, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.022, bevelSegments: 1, curveSegments: 1 });
  geo.translate(0, 0, -0.15); if (flip) geo.scale(-1, 1, 1);
  if (flip) { const idx = geo.attributes.position; /* mirrored winding */ const a = idx.array; for (let i = 0; i < a.length; i += 9) for (let k = 0; k < 3; k++) { const t = a[i + 3 + k]; a[i + 3 + k] = a[i + 6 + k]; a[i + 6 + k] = t; } geo.computeVertexNormals(); }
  return new THREE.Mesh(geo, mats);
}
function globe(r, seed, land, sea, detail = 1) {
  const geo = new THREE.IcosahedronGeometry(r, detail); const p = geo.attributes.position; const cols = [];
  const L = col(land), S = col(sea), Sh = col(sea).multiplyScalar(0.75);
  for (let i = 0; i < p.count; i += 3) {
    const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, cy = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3, cz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
    const n = fbm2(cx / r * 1.6 + seed, cz / r * 1.6 + cy / r * 0.9, 3, seed);
    const c = n > 0.08 ? L : (i / 3) % 3 === 0 ? Sh : S;
    for (let k = 0; k < 3; k++) cols.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  return new THREE.Mesh(geo, lam({ vc: true, flat: true }));
}
export function buildEmblem(pal = {}) {
  const g = new THREE.Group();
  const P = text3d('P', { font: '700 400px Futura', px: 400, eps: 2.4, unit: 1.36, depth: 0.32, bevel: 0.035, mats: [M(pal.P || C.volt), M(pal.P || C.volt, 0.55)] });
  const pl = paren(1.3, 0.2, [M(pal.paren || C.pink), M(pal.paren || C.pink, 0.6)]);
  const pr = paren(1.3, 0.2, [M(pal.paren || C.pink), M(pal.paren || C.pink, 0.6)], true);
  const gl = globe(0.43, 3, pal.land || C.slime, pal.sea || C.ink, 1);
  P.position.set(0, 0, 0); pl.position.set(1.3, 0.5, 0); gl.position.set(2.06, 0.5, 0); pr.position.set(2.82, 0.5, 0);
  g.add(P, pl, gl, pr);
  const inner = new THREE.Group(); inner.add(g); g.position.set(-1.45, -0.5, 0);
  return { root: inner, P, pl, pr, gl, parts: [P, pl, gl, pr] };
}
// 3D wordmark: one pivot per glyph so each can rise on its own; O's are planets
export function buildWordmark(text = 'PUBLIC DOOM', { unit = 0.52, face = C.bone, side = C.pink, oFace = C.slime, oSea = C.volt } = {}) {
  const c = document.createElement('canvas').getContext('2d'); const px = 400; const track = -0.01 * px;
  c.font = `700 ${px}px Futura`; c.letterSpacing = track + 'px';
  const s = unit / px; const total = c.measureText(text).width * s; const cap = 0.74 * unit;
  const root = new THREE.Group(); const pivots = [];
  const mFace = M(face), mSide = M(side, 0.85);
  let k = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]; if (ch === ' ') continue;
    const x0 = c.measureText(text.slice(0, i)).width * s - total / 2; const adv = c.measureText(ch).width * s;
    const pv = new THREE.Group(); pv.position.x = x0; root.add(pv);
    let mesh;
    if (ch === 'O') { mesh = globe(cap * 0.53, 11 + i, oFace, oSea, 1); mesh.position.set(adv / 2, cap / 2, 0); mesh.userData.spin = true; }
    else mesh = text3d(ch, { font: `700 ${px}px Futura`, px, eps: 2.4, unit, depth: 0.2, bevel: 0.022, mats: [mFace, mSide] });
    pv.add(mesh); pv.userData = { i: k++, mesh, ch }; pivots.push(pv);
  }
  return { root, pivots, total, cap };
}

function bgPlane(inner, outer, z = -12, w = 60, h = 34) {
  const geo = new THREE.PlaneGeometry(w, h, 16, 10); const p = geo.attributes.position; const cs = []; const A = col(inner), B = col(outer);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) / (w / 2), y = p.getY(i) / (h / 2); const d = clamp(Math.sqrt(x * x * 0.8 + y * y * 1.2)); const c = A.clone().lerp(B, d * d); cs.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3));
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, depthWrite: false })); m.position.z = z; m.renderOrder = -5; return m;
}
function sparkle(g, x, y, s, color) { // blocky 4-point sparkle snapped to the PS1 pixel grid
  const k = 3; const L = Math.round(s * 9) * k; if (L <= 0) return; x = Math.round(x / k) * k; y = Math.round(y / k) * k;
  g.fillStyle = color; g.fillRect(x - L, y - k / 2 - 1, L * 2, k + 1); g.fillRect(x - k / 2 - 1, y - L, k + 1, L * 2);
  const d = Math.round(L * 0.35 / k) * k; g.fillRect(x - d, y - d, d * 2, d * 2);
}

export const I = {
  // ---------------- screen 1: bone-white void, shards -> emblem ----------------
  i01(ctx) {
    const scene = new THREE.Scene(); scene.add(bgPlane('#fbf8f1', '#ddd5c6'));
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb9b0a2, 1.9)); const d = new THREE.DirectionalLight(0xffffff, 1.6); d.position.set(-3, 4, 6); scene.add(d);
    const em = buildEmblem(); scene.add(em.root);
    const sets = em.parts.map((m, i) => shatterable(m, 101 + i * 17, { dist: [4, 9], spin: 8, stagger: 0.5 }));
    em.parts.forEach(m => { const ms = Array.isArray(m.material) ? m.material : [m.material]; ms.forEach(mm => { mm.userData.base = mm.color.clone(); }); });
    const rings = [0, 1].map(i => { const r = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.025, 28), basic({ color: col(i ? C.volt : C.pink), transparent: true, depthWrite: false })); r.position.z = -0.6; scene.add(r); return r; });
    const cam = camera(30); const T0 = 0.2, T1 = 2.35;
    const glowMats = []; em.parts.forEach(m => (Array.isArray(m.material) ? m.material : [m.material]).forEach(mm => glowMats.push(mm)));
    return { scene, camera: cam,
      update(t) {
        const u = clamp((t - T0) / (T1 - T0));
        sets.forEach((s, i) => s(clamp(u * 1.08 - i * 0.02)));
        const settle = E.outC(clamp((t - T0) / 2.6));
        em.root.rotation.set(lerp(0.35, 0.06, settle) + Math.sin(t * 1.3) * 0.015, lerp(-0.9, -0.12, settle) + Math.sin(t * 0.9) * 0.03, 0);
        em.root.position.set(0, 0.42 + Math.sin(t * 1.7) * 0.012, 0);
        em.gl.rotation.y = t * 0.9; em.gl.rotation.x = 0.3;
        // lock flash
        const fl = t > T1 ? Math.exp(-(t - T1) * 6) : 0;
        for (const mm of glowMats) { if (mm.vertexColors) mm.emissive.setRGB(fl * 0.5, fl * 0.5, fl * 0.5); else mm.emissive.copy(mm.userData.base).multiplyScalar(0.12 + fl * 0.9); }
        rings.forEach((r, i) => { const lt = t - T1 - i * 0.12; const a = clamp(lt / 0.75); r.visible = lt > 0 && a < 1; r.scale.setScalar(lerp(1.75, 5.0, E.outC(a))); r.material.opacity = (1 - a) * 0.85; r.position.y = 0.42; });
        aim(cam, [0, 0.1, 6.4 - settle * 0.35], [0, 0.05, 0], t, 0);
        const fadeIn = 1 - clamp(t / 0.35), fadeOut = E.inQ(clamp((t - 3.72) / 0.45));
        return { look: { ...PSX, bloom: 0.25, bloomThresh: 1.1, fade: Math.max(fadeIn, fadeOut), fadeCol: [0, 0, 0] } };
      },
      draw2d(g, t) {
        const a1 = clamp((t - 2.55) / 0.5), a2 = clamp((t - 2.85) / 0.5);
        if (a1 > 0) pixF(g, 'PUBLIC DOOM', 960, 846, { size: 78, k: 3, color: C.ink, track: 0.16, align: 'center', alpha: a1 });
        if (a2 > 0) pixF(g, 'ENTERTAINMENT', 960, 900, { size: 30, k: 3, weight: 500, color: '#6b6170', track: 0.62, align: 'center', alpha: a2 });
        // sparkles after the lock
        const sp = [[700, 300, 2.42, C.pink], [1268, 352, 2.55, C.volt], [1092, 236, 2.7, C.pink], [640, 650, 2.86, C.volt], [1330, 610, 3.0, C.pink], [905, 280, 3.18, C.volt]];
        for (const [x, y, t0, c] of sp) { const lt = t - t0; if (lt < 0 || lt > 0.42) continue; sparkle(g, x, y, Math.sin(Math.PI * lt / 0.42), c); }
        return true;
      } };
  },
  // ---------------- screen 2: black, 3D wordmark rises ----------------
  i02(ctx) {
    const scene = new THREE.Scene(); scene.add(bgPlane('#140b1a', '#020103', -14, 70, 40));
    scene.add(new THREE.HemisphereLight(0x8a7aa0, 0x0a0610, 0.7));
    const key = new THREE.DirectionalLight(0xfff4e8, 2.0); key.position.set(3, 5, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(new THREE.Color(C.pink), 2.4); rim.position.set(-4, 2, -5); scene.add(rim);
    const sweep = new THREE.PointLight(0xffffff, 0, 3.5, 1.6); scene.add(sweep);
    const wm = buildWordmark('PUBLIC DOOM'); scene.add(wm.root); wm.root.position.y = 0.0;
    // glossy floor = a darkened mirrored copy
    const mirror = new THREE.Group(); mirror.scale.y = -1; scene.add(mirror);
    const mpiv = wm.pivots.map(pv => { const c = pv.clone(true); c.traverse(o => { if (o.isMesh) { o.material = Array.isArray(o.material) ? o.material.map(m => { const q = m.clone(); q.color.multiplyScalar(0.16); q.vertexColors = m.vertexColors; return q; }) : (() => { const q = o.material.clone(); q.color.multiplyScalar(0.16); return q; })(); } }); mirror.add(c); return c; });
    const glowMats = new Set(); wm.root.traverse(o => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => glowMats.add(m)); });
    const line = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.012), basic({ color: col(C.slime, 3.0) })); line.position.set(0, 0.002, -0.35); scene.add(line);
    // drifting polygon dust
    const R = rng(77); const dust = [];
    for (let i = 0; i < 28; i++) { const m = new THREE.Mesh(new THREE.TetrahedronGeometry(0.05 + R() * 0.12, 0), M([C.pink, C.volt, C.slime, C.bone][i % 4], 0.5)); m.position.set((R() - 0.5) * 12, R() * 4 - 0.6, -2 - R() * 7); m.userData = { sp: (R() - 0.5) * 1.5, ph: R() * 6 }; scene.add(m); dust.push(m); }
    const cam = camera(30); const T0 = INTRO.i02, HIT = T0 + 0.24;
    return { scene, camera: cam,
      update(t) {
        const lt = t - HIT;
        wm.pivots.forEach((pv, i) => {
          const p = clamp((lt - i * 0.045) / 0.42); const e = p <= 0 ? 0 : E.outBack(p, 2.2);
          const rx = lerp(-Math.PI / 2, 0, e); pv.rotation.x = rx; mpiv[i].rotation.x = rx;
          const m = pv.userData.mesh; if (m.userData.spin) { const ry = t * 1.4 + i; m.rotation.y = ry; mpiv[i].children[0].rotation.y = ry; }
          pv.visible = mpiv[i].visible = lt > i * 0.045 - 0.02;
        });
        const fl = lt > 0.35 ? Math.exp(-(lt - 0.35) * 4) : 0; for (const m of glowMats) { if (m.vertexColors) m.emissive.setRGB(fl * 0.3, fl * 0.3, fl * 0.3); else { m.userData.base = m.userData.base || m.color.clone(); m.emissive.copy(m.userData.base).multiplyScalar(0.06 + fl * 0.45); } }
        const lw = E.outExpo(clamp((lt - 0.3) / 0.7)); line.scale.x = Math.max(0.001, lw * 14); line.material.color.copy(col(C.slime, 0.6 + 2.6 * Math.exp(-Math.max(0, lt - 0.3) * 2.2)));
        const sw = clamp((t - (T0 + 1.25)) / 1.3); sweep.intensity = Math.sin(Math.PI * sw) * 4.5; sweep.position.set(lerp(-3.4, 3.4, E.ioS(sw)), 0.5, 1.3);
        dust.forEach(m => { m.rotation.set(t * m.userData.sp + m.userData.ph, t * 0.7 * m.userData.sp, 0); m.position.y += 0; });
        const u = E.ioS(clamp((t - T0) / 3.4));
        aim(cam, [lerp(-0.35, 0.25, u), lerp(0.05, 0.42, u), lerp(6.6, 5.4, u)], [0, 0.04, 0], t, 0);
        const crt = clamp((t - (INTRO.end - 0.75)) / 0.5);
        const fadeIn = 1 - clamp((t - T0) / 0.15);
        return { look: { ...PSX, crt, fade: fadeIn, fadeCol: [0, 0, 0], bloom: 0.6, bloomThresh: 0.9 } };
      },
      draw2d(g, t) {
        const a = clamp((t - (INTRO.i02 + 1.0)) / 0.45);
        if (a > 0) {
          pixF(g, 'LICENSED BY THE SINGULARITY', 960, 930, { size: 30, k: 3, color: C.bone, track: 0.32, align: 'center', alpha: a });
          pixF(g, '™ & © 2026 PUBLIC DOOM ENTERTAINMENT · ALL SLOP RESERVED', 960, 980, { size: 21, k: 3, weight: 500, color: '#8c7f96', track: 0.18, align: 'center', alpha: a * 0.9 });
        }
        const b = clamp((t - (INTRO.i02 + 0.5)) / 0.3);
        if (b > 0) { pixF(g, 'PDOM-00777', 120, 120, { size: 24, k: 3, font: MONO, weight: 700, color: '#5d5266', alpha: b }); pixF(g, 'NTSC / SLOP', 1800, 120, { size: 24, k: 3, font: MONO, weight: 700, color: '#5d5266', align: 'right', alpha: b }); }
        return true;
      } };
  },
};

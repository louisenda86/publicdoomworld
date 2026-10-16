// WHAT IF "simulations": the low-poly planets and monsters Topeng watches. Every object is a pure function of t.
import * as THREE from 'three';
import { lam, basic, cmat, box, cyl, soft } from './kit.js';
import { ptex, shade } from './tex.js';
import { stars } from './env.js';
import { fbm2, rng, clamp, hash2, lerp, E } from '../core.js';

const col = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);
// 3D value noise via two fbm2 planes (seamless on a sphere)
const n3 = (x, y, z, s) => (fbm2(x * 1.7 + s, z * 1.7 - y * 0.6, 4, s) + fbm2(y * 1.9 - s, x * 1.3 + z * 0.8, 3, s + 9)) * 0.5;

// ---------- EARTH that morphs into a donut (sphere poles open into the hole) and can shatter ----------
export function morphEarth({ R = 1, nu = 56, nv = 28, seed = 3, Rt = null, rt = null } = {}) {
  Rt = Rt ?? 1.05 * R; rt = rt ?? 0.52 * R;
  const tris = [];
  const sph = (u, v) => { const th = u * Math.PI * 2, ph = v * Math.PI; return [Math.sin(ph) * Math.cos(th) * R, Math.cos(ph) * R, Math.sin(ph) * Math.sin(th) * R]; };
  const tor = (u, v) => { const th = u * Math.PI * 2, ps = Math.PI - v * Math.PI * 2; const rr = Rt + rt * Math.cos(ps); return [rr * Math.cos(th), rt * Math.sin(ps), rr * Math.sin(th)]; };
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
    tris.push([[u0, v0], [u0, v1], [u1, v1]], [[u0, v0], [u1, v1], [u1, v0]]);
  }
  const N = tris.length * 3;
  const pS = new Float32Array(N * 3), pT = new Float32Array(N * 3), cols = new Float32Array(N * 3), pos = new Float32Array(N * 3);
  const cen = new Float32Array(tris.length * 3), rnd = new Float32Array(tris.length * 3);
  const sea = col('#1d4f8a'), sea2 = col('#245fa0'), land = col('#3f8f46'), land2 = col('#6aa64a'), desert = col('#c8a860'), ice = col('#eef4f6'), cloud = col('#f4f6f8');
  const R2 = rng(seed);
  tris.forEach((tr, k) => {
    const um = (tr[0][0] + tr[1][0] + tr[2][0]) / 3, vm = (tr[0][1] + tr[1][1] + tr[2][1]) / 3;
    const [x, y, z] = sph(um, vm); const n = n3(x, y, z, seed);
    let c;
    const lat = Math.abs(y / R);
    if (lat > 0.96 || (lat > 0.92 && n > 0.0)) c = ice;
    else if (n > 0.03) c = (n > 0.24 ? (lat < 0.35 ? desert : land2) : land);
    else c = (k % 3 === 0 ? sea2 : sea);
    if (n3(x * 1.6 + 5, y * 2.2, z * 1.6, seed + 40) > 0.2 && lat < 0.8) c = c.clone().lerp(cloud, 0.85);
    tr.forEach((p, q) => { const a = sph(p[0], p[1]), b = tor(p[0], p[1]); const o = (k * 3 + q) * 3; pS.set(a, o); pT.set(b, o); pos.set(a, o); cols.set([c.r, c.g, c.b], o); });
    rnd.set([R2(), R2(), R2()], k * 3);
  });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(cols, 3)); geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, lam({ vc: true, flat: true })); mesh.castShadow = true; mesh.receiveShadow = true;
  const atmo = new THREE.Mesh(new THREE.IcosahedronGeometry(R * 1.06, 3), new THREE.MeshBasicMaterial({ color: col('#6ab4ff', 0.5), transparent: true, opacity: 0.1, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  const g = new THREE.Group(); g.add(mesh); g.add(atmo);
  let lastK = -1, lastX = -1;
  // k: 0 sphere .. 1 torus;  x: 0 whole .. 1 shattered (shards fly out along their centre direction)
  function set(k = 0, x = 0, hole = null) {
    if (k === lastK && x === lastX) return; lastK = k; lastX = x;
    const kk = E.ioS(clamp(k));
    for (let t = 0; t < tris.length; t++) {
      let cx = 0, cy = 0, cz = 0;
      for (let q = 0; q < 3; q++) { const o = (t * 3 + q) * 3; for (let a = 0; a < 3; a++) pos[o + a] = pS[o + a] + (pT[o + a] - pS[o + a]) * kk; cx += pos[o]; cy += pos[o + 1]; cz += pos[o + 2]; }
      if (x > 0) {
        cx /= 3; cy /= 3; cz /= 3; const l = Math.hypot(cx, cy, cz) || 1; const sp = (0.6 + rnd[t * 3] * 1.6) * x * x * 3.2 + x * 0.4; const shr = 1 - 0.55 * x * rnd[t * 3 + 1];
        const jx = (rnd[t * 3 + 2] - 0.5) * x, jy = (rnd[t * 3 + 1] - 0.5) * x;
        for (let q = 0; q < 3; q++) { const o = (t * 3 + q) * 3; pos[o] = cx + (pos[o] - cx) * shr + cx / l * sp + jx; pos[o + 1] = cy + (pos[o + 1] - cy) * shr + cy / l * sp + jy; pos[o + 2] = cz + (pos[o + 2] - cz) * shr + cz / l * sp; }
      }
    }
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
    atmo.visible = k < 0.05 && x < 0.02;
  }
  set(0, 0);
  return { g, mesh, atmo, set };
}
export function sun(r = 1) {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 2), new THREE.MeshBasicMaterial({ color: col('#ffd27a', 2.6), toneMapped: false })); g.add(core);
  const cT = ptex('corona', 128, 128, (gg) => { const gr = gg.createRadialGradient(64, 64, 8, 64, 64, 64); gr.addColorStop(0, 'rgba(255,220,140,1)'); gr.addColorStop(0.35, 'rgba(255,170,60,0.45)'); gr.addColorStop(1, 'rgba(255,120,30,0)'); gg.fillStyle = gr; gg.fillRect(0, 0, 128, 128); }, { linear: true });
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: cT, color: col('#ffffff', 1.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); halo.scale.setScalar(r * 5.5); g.add(halo);
  return { g, core, halo };
}
export function moonBall(r = 0.27, seed = 5) {
  const geo = new THREE.IcosahedronGeometry(r, 2); const p = geo.attributes.position; const cs = [];
  for (let i = 0; i < p.count; i += 3) { const n = n3(p.getX(i) * 3, p.getY(i) * 3, p.getZ(i) * 3, seed); const c = col(n > 0.1 ? '#8a8a8c' : '#c4c4c2'); for (let k = 0; k < 3; k++) cs.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3)); return new THREE.Mesh(geo, lam({ vc: true, flat: true }));
}
export function jupiter(r = 10, seed = 2) {
  const geo = new THREE.IcosahedronGeometry(r, 18); const p = geo.attributes.position; const cs = [];
  const bands = ['#e8d8bc', '#c89a6a', '#f0e4cc', '#a8704a', '#e2c8a0', '#b88458', '#efe0c4'];
  for (let i = 0; i < p.count; i += 3) {
    const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, cy = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3, cz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
    const lat = cy / r + fbm2(cx / r * 3, cz / r * 3, 3, seed) * 0.05; let c = col(bands[Math.floor((lat * 0.5 + 0.5) * 13) % bands.length]);
    const lon = Math.atan2(cz, cx); if (Math.abs(lat + 0.36) < 0.08 && Math.abs(lon - 0.6) < 0.25) c = col('#c8502a');
    for (let k = 0; k < 3; k++) cs.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3)); const m = new THREE.Mesh(geo, lam({ vc: true, flat: true })); m.receiveShadow = true; return m;
}
export function starfield(sc, seed = 17) { sc.add(stars(2400, 380, seed)); sc.add(stars(800, 300, seed + 14)); }

// ---------- tiny people (instanced) — a jumping crowd on a globe, a staring crowd on a hill ----------
function personGeo() {
  const parts = [];
  const body = new THREE.CylinderGeometry(0.16, 0.2, 0.62, 7, 1); body.translate(0, 0.62, 0); parts.push(body);
  const legs = new THREE.CylinderGeometry(0.14, 0.11, 0.34, 6, 1); legs.translate(0, 0.17, 0); parts.push(legs);
  const head = new THREE.IcosahedronGeometry(0.16, 1); head.translate(0, 1.07, 0); parts.push(head);
  let n = 0; const pos = [], nor = []; for (const g of parts) { const ng = g.index ? g.toNonIndexed() : g; pos.push(...ng.attributes.position.array); nor.push(...ng.attributes.normal.array); n++; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return g;
}
const SHIRTS = ['#ff3b30', '#ffd60a', '#a6d7e6', '#3ddc84', '#f0e8da', '#ff7eb6', '#1d3b52', '#e8913a', '#9a5bff'];
export function crowd(n = 400, { seed = 4, scale = 1 } = {}) {
  const im = new THREE.InstancedMesh(personGeo(), lam({ flat: true }), n); im.castShadow = true; im.receiveShadow = true;
  const R = rng(seed); const c = new THREE.Color(); const meta = [];
  for (let i = 0; i < n; i++) { im.setColorAt(i, c.set(SHIRTS[(R() * SHIRTS.length) | 0])); meta.push({ ph: R(), s: (0.85 + R() * 0.3) * scale, r: R() }); }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), v = new THREE.Vector3(), sc = new THREE.Vector3();
  // place(i, position, normal, jumpHeight, yaw)
  function place(i, p, nrm, jump = 0, yaw = 0, squash = 1) {
    q.setFromUnitVectors(up, nrm); const qy = new THREE.Quaternion().setFromAxisAngle(up, yaw); q.multiply(qy);
    v.copy(p).addScaledVector(nrm, jump); const s = meta[i].s; sc.set(s / Math.sqrt(squash), s * squash, s / Math.sqrt(squash)); m4.compose(v, q, sc); im.setMatrixAt(i, m4);
  }
  return { im, meta, place, done() { im.instanceMatrix.needsUpdate = true; } };
}
// jump curve for a synchronized jump starting at t0 (crouch, launch, hang, land, squash)
export function jumpY(t, t0, h = 0.6) {
  const u = t - t0; if (u < 0) return [0, 1];
  if (u < 0.18) return [0, 1 - 0.25 * Math.sin(u / 0.18 * Math.PI / 2)];
  const a = u - 0.18, T = 0.62; if (a < T) { const s = a / T; return [h * 4 * s * (1 - s), 1.12 - 0.12 * Math.abs(1 - 2 * s)]; }
  const b = a - T; if (b < 0.2) return [0, 1 - 0.28 * Math.sin(b / 0.2 * Math.PI)]; return [0, 1];
}

// ---------- monsters ----------
// giant spider: legs are two-segment soft limbs with a procedural walk; origin = between the feet
export function spider({ s = 1, body = '#2a1a14', hair = '#4a2e1e', eye = '#ff3b30' } = {}) {
  const g = new THREE.Group(); const m = cmat(body, 0.12), m2 = cmat(hair, 0.15);
  const root = new THREE.Group(); root.position.y = 0.7 * s; g.add(root);
  const ceph = soft(0.5 * s, [0.42 * s, 0.5 * s], [0.42 * s, 0.5 * s], m, { pivot: 'center', seg: 10, rings: 5, capT: 0.5, capB: 0.5, capK: 0.9 }); ceph.rotation.x = Math.PI / 2; ceph.position.z = 0.25 * s; root.add(ceph);
  const abd = soft(0.95 * s, [0.8 * s, 0.75 * s], [0.8 * s, 0.75 * s], m2, { pivot: 'center', seg: 12, rings: 7, capT: 0.5, capB: 0.5, capK: 0.95, bulge: 0.12 }); abd.rotation.x = Math.PI / 2 + 0.25; abd.position.set(0, 0.22 * s, -0.55 * s); root.add(abd);
  const eM = new THREE.MeshBasicMaterial({ color: col(eye, 2.5), toneMapped: false });
  for (const [x, y] of [[-0.09, 0.12], [0.09, 0.12], [-0.18, 0.08], [0.18, 0.08], [-0.05, 0.2], [0.05, 0.2]]) { const e = new THREE.Mesh(new THREE.IcosahedronGeometry(0.04 * s, 0), eM); e.position.set(x * s, y * s, 0.52 * s); root.add(e); }
  for (const sx of [-1, 1]) { const f = soft(0.18 * s, [0.05 * s, 0.05 * s], [0.07 * s, 0.07 * s], m, { pivot: 'top', seg: 6, rings: 2, capB: 0.5 }); f.position.set(sx * 0.07 * s, -0.05 * s, 0.5 * s); f.rotation.x = 0.4; root.add(f); }
  const legs = [];
  for (let i = 0; i < 8; i++) {
    const sx = i < 4 ? 1 : -1, k = i % 4; const hip = new THREE.Group(); hip.position.set(sx * 0.18 * s, 0, (0.35 - k * 0.14) * s); root.add(hip);
    hip.rotation.order = 'YZX';
    const up = soft(0.75 * s, [0.06 * s, 0.06 * s], [0.09 * s, 0.09 * s], m2, { pivot: 'bottom', seg: 6, rings: 3, capT: 0.3, capB: 0.3 }); up.rotation.z = -sx * 0; hip.add(up);
    const knee = new THREE.Group(); knee.position.y = 0.75 * s; hip.add(knee);
    const lo = soft(1.0 * s, [0.06 * s, 0.06 * s], [0.025 * s, 0.025 * s], m, { pivot: 'bottom', seg: 6, rings: 3, capB: 0.2 }); knee.add(lo);
    legs.push({ hip, knee, sx, k });
  }
  function pose(t, speed = 1) {
    for (const L of legs) { const ph = t * 5 * speed + L.k * 1.6 + (L.sx > 0 ? 0 : Math.PI); const lift = Math.max(0, Math.sin(ph));
      L.hip.rotation.z = -L.sx * (0.85 + 0.3 * lift); L.knee.rotation.z = -L.sx * (1.55 - 0.2 * lift);
      L.hip.rotation.y = L.sx * (L.k - 1.5) * 0.45 + Math.cos(ph) * 0.16 * speed; }
    root.position.y = 0.72 * s + Math.sin(t * 10 * speed) * 0.02 * s;
  }
  pose(0); g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { g, pose, root };
}
// giant mosquito: segmented body, six long legs, beating wings, proboscis
export function mosquito({ s = 1 } = {}) {
  const g = new THREE.Group(); const m = cmat('#3a2e26', 0.12), mb = cmat('#5a4a3a', 0.12), stripe = cmat('#d8d0c0', 0.06);
  const root = new THREE.Group(); g.add(root);
  const thorax = soft(0.5 * s, [0.36 * s, 0.4 * s], [0.36 * s, 0.4 * s], mb, { pivot: 'center', seg: 10, rings: 5, capT: 0.5, capB: 0.5, capK: 0.9 }); thorax.rotation.x = Math.PI / 2 - 0.3; root.add(thorax);
  const abd = new THREE.Group(); abd.position.set(0, -0.05 * s, -0.25 * s); abd.rotation.x = -0.35; root.add(abd);
  for (let i = 0; i < 6; i++) { const seg = soft(0.22 * s, [0.26 * s * (1 - i * 0.08), 0.24 * s * (1 - i * 0.08)], [0.24 * s * (1 - i * 0.09), 0.22 * s * (1 - i * 0.09)], i % 2 ? stripe : m, { pivot: 'center', seg: 8, rings: 2, capT: 0.2, capB: 0.2 }); seg.rotation.x = Math.PI / 2; seg.position.z = -i * 0.2 * s; abd.add(seg); }
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16 * s, 1), m); head.position.set(0, 0.06 * s, 0.32 * s); root.add(head);
  const eM = lam({ color: col('#8a1a12'), flat: true }); for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1 * s, 1), eM); e.position.set(sx * 0.1 * s, 0.08 * s, 0.38 * s); root.add(e); }
  const prob = soft(0.8 * s, [0.02 * s, 0.02 * s], [0.006 * s, 0.006 * s], m, { pivot: 'bottom', seg: 5, rings: 2 }); prob.position.set(0, 0.0, 0.42 * s); prob.rotation.x = Math.PI / 2 + 0.6; root.add(prob);
  const wingT = ptex('mwing', 32, 64, (gg, w, h) => { gg.clearRect(0, 0, w, h); gg.fillStyle = 'rgba(210,225,235,0.5)'; gg.beginPath(); gg.ellipse(w / 2, h / 2, w / 2 - 1, h / 2 - 1, 0, 0, 7); gg.fill(); gg.strokeStyle = 'rgba(60,60,60,0.7)'; gg.lineWidth = 1; for (let i = 0; i < 5; i++) { gg.beginPath(); gg.moveTo(w / 2, 2); gg.lineTo(4 + i * 6, h - 4); gg.stroke(); } }, { linear: true });
  const wings = []; for (const sx of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(sx * 0.12 * s, 0.2 * s, 0.05 * s); root.add(piv); const w = new THREE.Mesh(new THREE.PlaneGeometry(0.42 * s, 1.3 * s), new THREE.MeshLambertMaterial({ map: wingT, transparent: true, side: THREE.DoubleSide, depthWrite: false })); w.rotation.x = -Math.PI / 2; w.position.set(sx * 0.0, 0, -0.6 * s); w.rotation.z = sx * 0.25; piv.add(w); wings.push({ piv, sx }); }
  const legs = []; for (let i = 0; i < 6; i++) { const sx = i < 3 ? 1 : -1, k = i % 3; const hip = new THREE.Group(); hip.position.set(sx * 0.12 * s, -0.12 * s, (0.12 - k * 0.14) * s); root.add(hip);
    const a = soft(0.9 * s, [0.018 * s, 0.018 * s], [0.03 * s, 0.03 * s], m, { pivot: 'bottom', seg: 5, rings: 2 }); hip.add(a); const kn = new THREE.Group(); kn.position.y = 0.9 * s; hip.add(kn); const b = soft(1.4 * s, [0.014 * s, 0.014 * s], [0.018 * s, 0.018 * s], stripe, { pivot: 'bottom', seg: 5, rings: 2 }); kn.add(b); legs.push({ hip, kn, sx, k }); }
  function pose(t) {
    for (const w of wings) w.piv.rotation.z = w.sx * (0.15 + 0.7 * Math.sin(t * 80));
    for (const L of legs) { L.hip.rotation.order = 'YZX'; L.hip.rotation.y = L.sx * (L.k - 1) * 0.7; L.hip.rotation.z = -L.sx * (1.15 + 0.05 * Math.sin(t * 3 + L.k)); L.kn.rotation.z = -L.sx * (1.55 + 0.04 * Math.sin(t * 2 + L.k)); }
    root.position.y = Math.sin(t * 2.2) * 0.08 * s;
  }
  pose(0); g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { g, pose, root };
}
// low-poly city block field (for the mosquito)
export function cityField(n = 60, seed = 9, spread = 30) {
  const g = new THREE.Group(); const R = rng(seed);
  const winT = ptex('cwin', 16, 32, (gg, w, h, R2) => { gg.fillStyle = '#c8c4bc'; gg.fillRect(0, 0, w, h); for (let y = 2; y < h; y += 4) for (let x = 2; x < w; x += 4) { gg.fillStyle = R2() > 0.5 ? '#2a3a4a' : '#5a7a8a'; gg.fillRect(x, y, 2, 2); } }, { repeat: [1, 3] });
  const m = lam({ map: winT });
  for (let i = 0; i < n; i++) { const w = 1 + R() * 2, h = 2 + R() * 8, d = 1 + R() * 2; const b = box(w, h, d, [m, m, cmat('#8a8a86'), m, m, m], 'bottom'); b.position.set((R() - 0.5) * spread, 0, (R() - 0.5) * spread * 0.6 - 4); g.add(b); }
  return g;
}

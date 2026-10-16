// THE DEATH OF INTERESTING THINGS — props: the cat, Greek kit (trireme, hoplite helmet/shield/spear/sword, column),
// IMAX camera, CCTV camera, drinking glass + shards, salon furniture, tombstones, palms, the marquee.
import * as THREE from 'three';
import { box, lam, basic, cmat, cyl, soft, phong } from './kit.js';
import { ptex, shade, noiseFill, textTex } from './tex.js';
import { glow, add } from './props3.js';
import * as P from './props.js';
import { rng, clamp, hash2, E } from '../core.js';
import { HEL, JP, TIMES, COND } from '../ov/overlay.js';

const M = (hex, amp = 0.05, extra) => cmat(hex, amp, extra);
const sh = g => { g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
const S = (h, top, bot, mat, o = {}) => soft(h, top, bot, mat, { seg: 10, rings: 5, capT: 0.4, capB: 0.4, capK: 0.8, ...o });

// ---------- the cat (ginger tabby) — pose(t) drives a fall-off-the-chair animation ----------
// origin = floor under the cat's chest; faces +z. pose: { sit, fall (0..1 + tumble), roll, look:[yaw,pitch], tail }
export function cat({ col = '#e0913f', stripe = '#a85a22', belly = '#f6e2c4' } = {}) {
  const g = new THREE.Group(); const root = new THREE.Group(); g.add(root);
  const fur = ptex('catfur' + col, 32, 32, (c, w, h, R) => { noiseFill(c, w, h, col, 0.06, R); c.fillStyle = stripe; for (let x = 2; x < w; x += 6) c.fillRect(x, 0, 2, h); });
  const furM = lam({ map: fur }), bellyM = M(belly, 0.04), dark = M('#2a1a10', 0.03);
  const body = new THREE.Group(); body.position.set(0, 0.2, 0); root.add(body);
  const torso = S(0.36, [0.17, 0.2], [0.19, 0.22], [furM, furM, furM, bellyM, furM, furM], { pivot: 'center' }); torso.rotation.x = Math.PI / 2; body.add(torso);
  const headG = new THREE.Group(); headG.position.set(0, 0.1, 0.2); body.add(headG);
  const face = ptex('catface' + col, 64, 64, (c, w, h, R) => { noiseFill(c, w, h, col, 0.05, R); c.fillStyle = stripe; c.fillRect(28, 0, 2, 14); c.fillRect(34, 0, 2, 12); c.fillRect(22, 2, 2, 9); c.fillRect(40, 2, 2, 9);
    c.fillStyle = belly; c.beginPath(); c.ellipse(32, 46, 16, 12, 0, 0, 7); c.fill();
    for (const sx of [-1, 1]) { c.fillStyle = '#d8e85a'; c.beginPath(); c.ellipse(32 + sx * 12, 30, 7, 6, 0, 0, 7); c.fill(); c.fillStyle = '#111'; c.fillRect(31 + sx * 12, 25, 3, 10); c.fillStyle = '#fff'; c.fillRect(33 + sx * 12, 27, 2, 2); }
    c.fillStyle = '#e88a8a'; c.beginPath(); c.moveTo(29, 40); c.lineTo(35, 40); c.lineTo(32, 44); c.fill(); c.strokeStyle = '#5a3a2a'; c.lineWidth = 1; c.beginPath(); c.moveTo(32, 44); c.lineTo(32, 47); c.moveTo(32, 47); c.quadraticCurveTo(28, 50, 26, 47); c.moveTo(32, 47); c.quadraticCurveTo(36, 50, 38, 47); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.7)'; for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(32 + sx * 8, 45 + k); c.lineTo(32 + sx * 26, 41 + k * 4); c.stroke(); } });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), [lam({ map: face })]); head.scale.set(1.12, 0.95, 1); head.geometry.computeVertexNormals();
  { const p = head.geometry.attributes.position, uv = head.geometry.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, 0.5 + p.getX(i) / 0.22, 0.5 + p.getY(i) / 0.22); }
  headG.add(head);
  for (const sx of [-1, 1]) { const ear = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.08, 4), furM); ear.position.set(sx * 0.065, 0.1, -0.01); ear.rotation.z = -sx * 0.25; headG.add(ear); }
  const muzzle = S(0.05, [0.07, 0.05], [0.08, 0.06], bellyM, { pivot: 'center' }); muzzle.rotation.x = Math.PI / 2; muzzle.position.set(0, -0.035, 0.09); headG.add(muzzle);
  const legs = [];
  for (const [x, z] of [[0.06, 0.13], [-0.06, 0.13], [0.065, -0.12], [-0.065, -0.12]]) { const l = new THREE.Group(); l.position.set(x, 0.0, z); body.add(l); const m = S(0.2, [0.05, 0.05], [0.04, 0.045], furM, { pivot: 'top' }); l.add(m); const paw = S(0.03, [0.045, 0.06], [0.05, 0.065], bellyM, { pivot: 'top' }); paw.position.y = -0.2; l.add(paw); legs.push(l); }
  const tail = new THREE.Group(); tail.position.set(0, 0.04, -0.2); body.add(tail); const segs = [];
  let parent = tail; for (let i = 0; i < 5; i++) { const s = new THREE.Group(); if (i) s.position.y = 0.07; parent.add(s); const m = S(0.075, [0.03 - i * 0.003, 0.03 - i * 0.003], [0.034 - i * 0.003, 0.034 - i * 0.003], i === 4 ? M(stripe) : furM, { pivot: 'bottom' }); s.add(m); segs.push(s); parent = s; }
  sh(g);
  function pose({ sit = 0, fall = 0, roll = 0, look = [0, 0], tail: tw = 0, t = 0, legsOut = 0 } = {}) {
    // sit: haunches down; fall: slide off the seat edge and tip forward; legsOut: flailing paws
    body.rotation.set(-sit * 0.55 + fall * 1.4, 0, roll); body.position.set(0, 0.2 + sit * 0.04, fall * 0.12);
    legs.forEach((l, i) => { const back = i >= 2; l.rotation.set(back ? sit * 1.2 : -sit * 0.2, 0, 0); if (legsOut) { l.rotation.x += Math.sin(t * 22 + i * 1.7) * 0.6 * legsOut; l.rotation.z = (i % 2 ? -1 : 1) * 0.5 * legsOut; } });
    headG.rotation.set(look[1] - fall * 0.6, look[0], 0);
    segs.forEach((s, i) => { s.rotation.set(i === 0 ? -1.0 + sit * 0.6 : 0.2 + Math.sin(t * 2.4 - i * 0.7) * 0.12 + tw * 0.3, 0, Math.sin(t * 1.6 - i * 0.5) * 0.15); });
  }
  pose({});
  return { g, root, pose };
}

// ---------- kitchen / dining chair (origin floor, seat height 0.46, back on -z) ----------
export function chair(col = '#7a5232') {
  const g = new THREE.Group(); const m = M(col, 0.06);
  add(g, box(0.44, 0.05, 0.42, m, 'bottom'), 0, 0.42, 0);
  for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) add(g, box(0.04, 0.42, 0.04, m, 'bottom'), x * 0.19, 0, z * 0.18);
  add(g, box(0.44, 0.48, 0.04, m, 'bottom'), 0, 0.47, -0.2); return sh(g);
}

// ---------- Greek kit ----------
const BRONZE = '#b8833a';
export function helmet({ crest = '#b8261e', s = 1 } = {}) { // Corinthian helmet: origin = crown pivot (fits a 0.22-wide head)
  const g = new THREE.Group(); g.scale.setScalar(s);
  const bz = phong({ map: ptex('bronze', 16, 16, (c, w, h, R) => noiseFill(c, w, h, BRONZE, 0.08, R)), spec: 0xffd8a0, shin: 60 });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.135, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.62), bz); dome.scale.set(1.0, 1.1, 1.08); dome.position.y = 0.0; g.add(dome);
  // cheek guards with an eye slot (open front T)
  const cheek = new THREE.Mesh(new THREE.CylinderGeometry(0.136, 0.12, 0.17, 12, 1, true, Math.PI * 0.12, Math.PI * 1.76), bz); cheek.material.side = THREE.DoubleSide; cheek.position.y = -0.1; cheek.scale.z = 1.08; g.add(cheek);
  const nose = box(0.022, 0.1, 0.02, bz, 'top'); nose.position.set(0, -0.02, 0.145); g.add(nose);
  const crestT = ptex('crest' + crest, 8, 32, (c, w, h, R) => { noiseFill(c, w, h, crest, 0.12, R); for (let y = 0; y < h; y += 2) { c.fillStyle = shade(crest, 0.75); c.fillRect(0, y, w, 1); } });
  const cr = S(0.3, [0.03, 0.05], [0.03, 0.05], lam({ map: crestT }), { pivot: 'center', capT: 0.3, capB: 0.3 }); cr.rotation.x = Math.PI / 2; cr.scale.set(1, 1, 1); cr.position.set(0, 0.17, -0.02); g.add(cr);
  const crH = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 5, 14, Math.PI), lam({ map: crestT })); crH.rotation.y = Math.PI / 2; crH.position.set(0, 0.06, -0.01); g.add(crH);
  return sh(g);
}
export function shield({ col = '#b8261e', emblem = 'eye', r = 0.45 } = {}) { // hoplon, origin centre, faces +z
  const g = new THREE.Group();
  const face = ptex('hoplon:' + col + emblem, 128, 128, (c, w, h, R) => { c.fillStyle = BRONZE; c.fillRect(0, 0, w, h); c.fillStyle = col; c.beginPath(); c.arc(64, 64, 52, 0, 7); c.fill();
    c.fillStyle = '#1a1210';
    if (emblem === 'eye') { c.fillStyle = '#f0e6d0'; c.beginPath(); c.ellipse(64, 64, 34, 18, 0, 0, 7); c.fill(); c.fillStyle = '#1a1210'; c.beginPath(); c.arc(64, 64, 12, 0, 7); c.fill(); }
    else { c.beginPath(); c.moveTo(64, 26); c.lineTo(74, 56); c.lineTo(104, 56); c.lineTo(80, 74); c.lineTo(90, 104); c.lineTo(64, 86); c.lineTo(38, 104); c.lineTo(48, 74); c.lineTo(24, 56); c.lineTo(54, 56); c.fill(); }
    for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(0,0,0,${R() * 0.12})`; c.fillRect(R() * w, R() * h, 2, 2); } });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.04, 20), [M(BRONZE), lam({ map: face }), M('#6a4a2a')]); disc.rotation.x = Math.PI / 2; g.add(disc);
  { const uv = disc.geometry.attributes.uv; } // cap UVs: top cap carries the face (CylinderGeometry cap maps a disc) — fine for symmetric emblems
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.025, 4, 20), M(BRONZE)); g.add(rim);
  return sh(g);
}
export function spear(len = 2.4) { const g = new THREE.Group(); add(g, cyl(0.015, 0.015, len, 6, M('#6a4a2a')), 0, 0, 0); const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), M('#c8c0b0')); tip.scale.set(0.5, 2.2, 0.25); tip.position.y = len / 2 + 0.1; g.add(tip); return sh(g); }
export function sword(len = 0.75) { const g = new THREE.Group(); const blade = phong({ color: 0xd8dde4, spec: 0xffffff, shin: 90 }); const b = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), blade); b.scale.set(0.09, len, 0.015); b.position.y = len / 2 + 0.06; g.add(b); add(g, box(0.2, 0.03, 0.04, M(BRONZE)), 0, 0.06, 0); add(g, cyl(0.018, 0.018, 0.14, 6, M('#3a2414')), 0, -0.03, 0); return sh(g); }
export function column(h = 4, r = 0.32, col = '#e8e0cc') {
  const g = new THREE.Group(); const m = M(col, 0.05);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r, h, 14, 1), m); shaft.position.y = h / 2; g.add(shaft);
  add(g, box(r * 2.6, 0.16, r * 2.6, m, 'bottom'), 0, h, 0); add(g, box(r * 2.4, 0.12, r * 2.4, m, 'bottom'), 0, -0.02, 0);
  return sh(g);
}
// trireme: hull + painted eye + mast + square sail + two banks of oars. update(t) rows and bobs.
export function trireme({ sail = '#e8dcc0', motif = '#b8261e', len = 14 } = {}) {
  const g = new THREE.Group(); const rig = new THREE.Group(); g.add(rig);
  const wood = lam({ map: ptex('hullwood', 32, 32, (c, w, h, R) => { noiseFill(c, w, h, '#4a2e1c', 0.08, R); for (let y = 0; y < h; y += 4) { c.fillStyle = '#2e1c10'; c.fillRect(0, y, w, 1); } c.fillStyle = '#16100c'; c.fillRect(0, h - 6, w, 6); }, { repeat: [3, 1] }) });
  // hull: lofted along x (bow at +x)
  const hull = soft(len, [0.6, 0.6], [0.6, 0.6], wood, { pivot: 'center', seg: 12, rings: 14, sq: 2.4, capT: 0.32, capB: 0.22, capK: 0.98, prof: s => [1.0, 1.0] });
  hull.rotation.z = -Math.PI / 2; hull.scale.set(1.25, 1, 2.2); hull.position.y = 0.1; rig.add(hull);
  const deck = box(len * 0.82, 0.08, 1.9, M('#6a4a2e', 0.06), 'bottom'); deck.position.y = 0.55; rig.add(deck);
  const rail = box(len * 0.8, 0.3, 2.3, M('#3a2414', 0.06), 'bottom'); rail.position.y = 0.32; rig.add(rail);
  // bow ram + upturned stern
  const ram = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.4, 6), M(BRONZE)); ram.rotation.z = -Math.PI / 2; ram.position.set(len / 2 + 0.3, -0.05, 0); rig.add(ram);
  const stern = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.16, 5, 10, Math.PI * 0.6), wood); stern.position.set(-len / 2 + 0.8, 1.2, 0); stern.rotation.z = Math.PI * 0.55; rig.add(stern);
  // painted eyes on the bow
  const eyeT = ptex('triremeeye', 32, 16, (c, w, h) => { c.fillStyle = '#f0e6d0'; c.beginPath(); c.ellipse(16, 8, 13, 6, 0, 0, 7); c.fill(); c.fillStyle = '#1a1210'; c.beginPath(); c.arc(17, 8, 4, 0, 7); c.fill(); c.strokeStyle = motif; c.lineWidth = 1.5; c.beginPath(); c.ellipse(16, 8, 14, 7, 0, 0, 7); c.stroke(); });
  for (const sz of [-1, 1]) { const e = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), lam({ map: eyeT, transparent: true, alphaTest: 0.5 })); e.position.set(len / 2 - 0.9, 0.35, sz * 1.18); e.rotation.y = sz > 0 ? 0.25 : Math.PI - 0.25; rig.add(e); }
  // mast + yard + sail
  add(rig, cyl(0.08, 0.1, 7.5, 8, M('#5a3a22')), 0.5, 4.2, 0);
  add(rig, box(0.12, 0.12, 5.6, M('#5a3a22')), 0.65, 7.4, 0);
  const sailT = ptex('sail' + sail + motif, 64, 64, (c, w, h, R) => { noiseFill(c, w, h, sail, 0.05, R); for (let x = 0; x < w; x += 8) { c.fillStyle = shade(sail, 0.9); c.fillRect(x, 0, 1, h); } c.fillStyle = motif; c.beginPath(); c.arc(32, 30, 14, 0, 7); c.fill(); for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; c.fillRect(32 + Math.cos(a) * 18 - 1.5, 30 + Math.sin(a) * 18 - 1.5, 3, 3); } c.fillStyle = shade(sail, 0.7); c.fillRect(0, h - 3, w, 3); });
  const sg = new THREE.PlaneGeometry(5.2, 4.6, 6, 6); { const p = sg.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) / 2.6, y = p.getY(i) / 2.3; p.setZ(i, 0.55 * (1 - x * x) * (1 - 0.5 * y * y)); } sg.computeVertexNormals(); }
  const sailM = new THREE.Mesh(sg, lam({ map: sailT, side: THREE.DoubleSide })); sailM.rotation.y = Math.PI / 2; sailM.position.set(0.75, 5.05, 0); rig.add(sailM);
  // oars
  const oars = []; const oarM = M('#7a5a3a', 0.05);
  for (const sz of [-1, 1]) for (let i = 0; i < 14; i++) { const o = new THREE.Group(); o.position.set(-len * 0.36 + i * len * 0.052, 0.3, sz * 1.15); rig.add(o); const b = box(0.05, 0.05, 2.6, oarM, 'center'); b.position.z = sz * 1.2; o.add(b); const bl = box(0.06, 0.3, 0.4, oarM, 'center'); bl.position.z = sz * 2.45; o.add(bl); oars.push({ o, sz, i }); }
  sh(g); sailM.castShadow = true;
  function update(t, { row = 1, bob = 1, heel = 0 } = {}) {
    rig.position.y = Math.sin(t * 0.9) * 0.12 * bob; rig.rotation.x = Math.sin(t * 0.7) * 0.03 * bob + heel; rig.rotation.z = Math.sin(t * 0.55 + 1) * 0.025 * bob;
    for (const { o, sz, i } of oars) { const ph = t * 1.3 * row * Math.PI * 2 / 2.2; o.rotation.set(0, sz * Math.sin(ph) * 0.35 * row, -sz * (0.35 + Math.cos(ph) * 0.18 * row)); }
  }
  update(0);
  return { g, rig, sail: sailM, update };
}
// a simple low-poly rock (displaced icosahedron)
export function rock(r = 1, seed = 1, col = '#7a6a5a') {
  const geo = new THREE.IcosahedronGeometry(r, 1); const p = geo.attributes.position; const R = rng(seed); const seen = new Map();
  for (let i = 0; i < p.count; i++) { const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`; if (!seen.has(k)) seen.set(k, 0.75 + R() * 0.5); const f = seen.get(k); p.setXYZ(i, p.getX(i) * f, p.getY(i) * f * 0.8, p.getZ(i) * f); }
  geo.computeVertexNormals(); const m = new THREE.Mesh(geo, M(col, 0.1)); m.castShadow = true; m.receiveShadow = true; return m;
}

// ---------- film kit ----------
export function imaxCamera() { // big black 65 mm IMAX body on a geared head + tripod; lens faces +z. origin = floor
  const g = new THREE.Group(); const blk = M('#151517', 0.04), grey = M('#3a3c40', 0.04);
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; const l = box(0.05, 1.3, 0.05, M('#2a2a2e'), 'bottom'); l.position.set(Math.sin(a) * 0.45, 0, Math.cos(a) * 0.45); l.rotation.set(Math.cos(a) * 0.32, 0, -Math.sin(a) * 0.32); g.add(l); }
  const head = new THREE.Group(); head.position.y = 1.25; g.add(head);
  add(head, box(0.34, 0.16, 0.34, grey, 'bottom'), 0, 0, 0);
  const body = new THREE.Group(); body.position.y = 0.16; head.add(body);
  add(body, box(0.62, 0.48, 0.9, blk, 'bottom'), 0, 0, -0.05);
  const magT = ptex('imaxmag', 32, 32, (c, w, h, R) => { noiseFill(c, w, h, '#1a1a1c', 0.04, R); c.fillStyle = '#f0f0f0'; c.font = `800 7px ${HEL}`; c.textAlign = 'center'; c.fillText('IMAX', 16, 18); });
  for (const sz of [-1, 1]) { const mag = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.16, 16), [M('#1a1a1c'), lam({ map: magT }), lam({ map: magT })]); mag.rotation.z = Math.PI / 2; mag.position.set(0, 0.62, -0.05 + sz * 0.28); body.add(mag); }
  const lens = cyl(0.16, 0.18, 0.5, 14, M('#0d0d0f', 0.03)); lens.rotation.x = Math.PI / 2; lens.position.set(0, 0.24, 0.65); body.add(lens);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.13, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 0.35, 0.6), toneMapped: false })); glass.position.set(0, 0.24, 0.905); body.add(glass);
  add(body, box(0.5, 0.36, 0.06, blk), 0, 0.25, 0.94); // matte box
  const lbl = textTex('imaxlabel', 64, 16, (c, w, h) => { c.fillStyle = '#151517'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8e8e8'; c.font = `800 12px ${HEL}`; c.textAlign = 'center'; c.fillText('IMAX', 32, 13); });
  const lb = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.1), basic({ map: lbl })); lb.position.set(0.312, 0.3, 0.0); lb.rotation.y = Math.PI / 2; body.add(lb);
  return { g: sh(g), head, body };
}
export function cctv() { // wall-mounted CCTV dome-less bullet camera; looks along +z of `cam` group, red REC led
  const g = new THREE.Group(); const w = M('#e8e6e0', 0.03), d = M('#222', 0.03);
  add(g, box(0.1, 0.1, 0.04, w), 0, 0, 0); const arm = new THREE.Group(); arm.position.set(0, 0, 0.05); g.add(arm);
  add(arm, cyl(0.02, 0.02, 0.18, 6, w), 0, -0.02, 0.06, Math.PI / 2);
  const cam = new THREE.Group(); cam.position.set(0, -0.06, 0.16); arm.add(cam);
  add(cam, box(0.12, 0.11, 0.3, w), 0, 0, 0); add(cam, box(0.15, 0.02, 0.34, w), 0, 0.07, 0.02);
  const len = cyl(0.04, 0.04, 0.02, 10, d); len.rotation.x = Math.PI / 2; len.position.z = 0.155; cam.add(len);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), glow('#ff2a1a', 4)); led.position.set(0.04, 0.035, 0.152); cam.add(led);
  return { g: sh(g), cam, led };
}
// drinking glass + shards (shatter(u): 0 intact .. 1 scattered)
export function glassCup() {
  const g = new THREE.Group();
  const gm = new THREE.MeshPhongMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.38, shininess: 120, specular: 0xffffff, side: THREE.DoubleSide, depthWrite: false });
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.033, 0.12, 12, 1, true), gm); cup.position.y = 0.06; g.add(cup);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.037, 0.032, 0.07, 12), new THREE.MeshPhongMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0.45, depthWrite: false })); water.position.y = 0.037; g.add(water);
  const shards = new THREE.Group(); g.add(shards); const R = rng(42); const meta = [];
  for (let i = 0; i < 26; i++) { const s = new THREE.Mesh(new THREE.TetrahedronGeometry(0.012 + R() * 0.02, 0), gm); const a = R() * Math.PI * 2, v = 0.6 + R() * 1.6; meta.push({ s, vx: Math.cos(a) * v, vz: Math.sin(a) * v, vy: 0.6 + R() * 1.4, r: R() * 9 }); s.visible = false; shards.add(s); }
  const drops = []; for (let i = 0; i < 14; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.008 + R() * 0.008, 5, 4), water.material); d.visible = false; shards.add(d); const a = R() * 6.283, v = 0.4 + R() * 1.2; drops.push({ s: d, vx: Math.cos(a) * v, vz: Math.sin(a) * v, vy: 0.8 + R(), r: 0 }); }
  function shatter(u, h0 = 0) { // u = seconds since impact (<0 intact); h0 = impact height above the group's floor
    const on = u >= 0; cup.visible = water.visible = !on;
    for (const m of [...meta, ...drops]) { m.s.visible = on; if (!on) continue; const tt = Math.min(u, 1.2); const y = Math.max(0.006, h0 + 0.05 + m.vy * tt - 4.9 * tt * tt); const k = Math.min(tt, y <= 0.006 ? 0.3 + tt * 0.2 : tt); m.s.position.set(m.vx * k * 0.7, y, m.vz * k * 0.7); m.s.rotation.set(m.r + tt * 8, m.r * 2, tt * 5); }
  }
  shatter(-1);
  return { g, cup, shatter };
}

// ---------- salon ----------
export function salonChair(col = '#ff7eb6') { // hydraulic styling chair, sitter faces +z; seat height 0.55
  const g = new THREE.Group(); const c = M(col, 0.04), chrome = phong({ color: 0xd8dce2, spec: 0xffffff, shin: 80 });
  add(g, cyl(0.28, 0.3, 0.04, 16, chrome), 0, 0.02, 0); add(g, cyl(0.05, 0.05, 0.42, 10, chrome), 0, 0.22, 0);
  add(g, S(0.14, [0.5, 0.5], [0.52, 0.5], c, { pivot: 'bottom', sq: 2.6, capT: 0.4, capB: 0 }), 0, 0.42, 0);
  const back = S(0.62, [0.46, 0.12], [0.5, 0.14], c, { pivot: 'bottom', sq: 2.6, capT: 0.4, capB: 0 }); back.position.set(0, 0.5, -0.22); back.rotation.x = -0.12; g.add(back);
  for (const sx of [-1, 1]) add(g, S(0.08, [0.08, 0.42], [0.08, 0.42], c, { pivot: 'bottom', sq: 3, capT: 0.4 }), sx * 0.29, 0.62, 0.0);
  add(g, box(0.36, 0.03, 0.12, chrome), 0, 0.12, 0.3); // footrest
  return sh(g);
}
export function hoodDryer(col = '#f3eee6') { // salon hood dryer behind a chair; dome centred at y 1.32, z -0.08
  const g = new THREE.Group(); const m = M(col, 0.03), chrome = phong({ color: 0xd8dce2, spec: 0xffffff, shin: 80 });
  add(g, cyl(0.05, 0.05, 1.2, 8, chrome), 0, 0.6, -0.36);
  const arm = box(0.05, 0.05, 0.3, chrome, 'center'); arm.position.set(0, 1.25, -0.22); g.add(arm);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 9, 0, Math.PI * 2, 0, Math.PI * 0.55), m); dome.material.side = THREE.DoubleSide; dome.scale.set(1, 1.05, 1.15); dome.position.set(0, 1.3, -0.08); dome.rotation.x = -0.75; g.add(dome);
  const vent = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 5, 16), M('#c8c4bc')); vent.position.set(0, 1.21, 0.07); vent.rotation.x = -0.75 + Math.PI / 2; g.add(vent);
  return sh(g);
}
export function vanity(w = 1.2, h = 1.4) { // mirror with bulbs + counter; origin floor, mirror faces +z
  const g = new THREE.Group();
  add(g, box(w + 0.2, 0.86, 0.5, M('#f6f2ee', 0.03), 'bottom'), 0, 0, 0);
  add(g, box(w + 0.24, 0.04, 0.54, phong({ color: 0xffffff, spec: 0xffffff, shin: 50 }), 'bottom'), 0, 0.86, 0);
  const mir = new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic({ map: ptex('mirrorrefl', 32, 48, (c, W, H) => { const gr = c.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#c8d4dc'); gr.addColorStop(0.45, '#9aa8b4'); gr.addColorStop(1, '#7a8894'); c.fillStyle = gr; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.moveTo(4, 0); c.lineTo(12, 0); c.lineTo(2, 20); c.lineTo(0, 12); c.fill(); c.fillStyle = 'rgba(255,220,230,0.35)'; c.fillRect(0, H * 0.7, W, H * 0.3); }, { linear: true }), color: new THREE.Color(0.85, 0.85, 0.9) })); mir.position.set(0, 0.9 + h / 2 + 0.06, -0.2); g.add(mir);
  add(g, box(w + 0.16, h + 0.16, 0.03, M('#e8e0dc', 0.03)), 0, 0.9 + h / 2 + 0.06, -0.22);
  const bulb = glow('#fff1d6', 3.2);
  for (let i = 0; i < 6; i++) for (const sx of [-1, 1]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), bulb); b.position.set(sx * (w / 2 + 0.04), 0.98 + i * (h / 5.2), -0.18); g.add(b); }
  for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), bulb); b.position.set(-w / 2 + 0.1 + i * (w - 0.2) / 4, 0.98 + h + 0.03, -0.18); g.add(b); }
  // bottles
  const R = rng(7); for (let i = 0; i < 6; i++) { const col = ['#ff7eb6', '#a6d7e6', '#ffd43b', '#f3eee6', '#8b5cf6', '#3ddc84'][i]; const b = cyl(0.03, 0.035, 0.12 + R() * 0.12, 8, M(col, 0.03)); b.position.set(-w / 2 + 0.12 + i * 0.12, 0.9 + 0.08, 0.05 + R() * 0.1); g.add(b); }
  const light = new THREE.PointLight(0xffe2c0, 3, 3.2, 1.5); light.position.set(0, 1.7, 0.4); g.add(light);
  return sh(g);
}

// ---------- graveyard ----------
export function tombstone(text, { sub = '', w = 0.9, h = 1.15, col = '#8a8c90', seed = 1 } = {}) {
  const g = new THREE.Group(); const R = rng(seed);
  const face = ptex('tomb:' + text + sub + col, 128, 160, (c, W, H, RR) => { noiseFill(c, W, H, col, 0.09, RR, 2); for (let i = 0; i < 40; i++) { c.fillStyle = 'rgba(60,90,50,' + (RR() * 0.35) + ')'; c.fillRect(RR() * W, H * 0.6 + RR() * H * 0.4, 3 + RR() * 8, 2); }
    c.fillStyle = 'rgba(20,20,22,0.85)'; c.textAlign = 'center'; c.font = `700 13px ${TIMES}`; c.fillText('R . I . P', W / 2, 40);
    let fs = 22; c.font = `700 ${fs}px ${TIMES}`; while (c.measureText(text).width > W - 16 && fs > 10) { fs--; c.font = `700 ${fs}px ${TIMES}`; } c.fillText(text, W / 2, 76);
    c.font = `italic 400 12px ${TIMES}`; c.fillText(sub, W / 2, 98); c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(W / 2 - 30, 108, 60, 1); });
  const sh_ = new THREE.Shape(); sh_.moveTo(-w / 2, 0); sh_.lineTo(-w / 2, h - w / 2); sh_.absarc(0, h - w / 2, w / 2, Math.PI, 0, true); sh_.lineTo(w / 2, 0); sh_.lineTo(-w / 2, 0);
  const geo = new THREE.ExtrudeGeometry(sh_, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1, curveSegments: 6 });
  { const p = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, p.getY(i) / h); }
  const stoneM = M(col, 0.1); const m = new THREE.Mesh(geo, [lam({ map: face }), stoneM]); m.position.z = -0.08; g.add(m);
  g.rotation.z = (R() - 0.5) * 0.12; g.rotation.x = -(R()) * 0.08; return sh(g);
}
// palm tree (curved trunk of stacked rings + drooping fronds)
export function palm(seed = 1, h = 7) {
  const g = new THREE.Group(); const R = rng(seed); const bark = M('#6a5038', 0.1), leaf = lam({ map: ptex('palmleaf', 16, 32, (c, w, hh, RR) => { noiseFill(c, w, hh, '#2f6a32', 0.14, RR); c.fillStyle = '#1e4a24'; c.fillRect(w / 2 - 1, 0, 2, hh); }), side: THREE.DoubleSide });
  const lean = (R() - 0.5) * 0.5; let x = 0, y = 0;
  for (let i = 0; i < 12; i++) { const s = cyl(0.17 - i * 0.006, 0.19 - i * 0.006, h / 12 + 0.02, 7, bark); x = Math.sin(i / 12 * 1.2) * lean * h * 0.4; s.position.set(x, y + h / 24, 0); g.add(s); y += h / 12; }
  const crown = new THREE.Group(); crown.position.set(x, y, 0); g.add(crown);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + R(); const fr = new THREE.PlaneGeometry(0.6, 3.2, 1, 6); const p = fr.attributes.position; for (let k = 0; k < p.count; k++) { const yy = (p.getY(k) + 1.6) / 3.2; p.setY(k, yy * 3.2); p.setZ(k, -yy * yy * 1.6); p.setX(k, p.getX(k) * (1 - yy * 0.7)); } fr.computeVertexNormals(); const f = new THREE.Mesh(fr, leaf); f.rotation.set(-1.0 + R() * 0.3, a, 0, 'YXZ'); crown.add(f); }
  return sh(g);
}

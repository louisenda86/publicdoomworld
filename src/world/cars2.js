// Generic low-poly cars (no badges): wedge supercar, round sports coupe, 70s sedan, 70s coupe, 90s hatch.
// All face +z, sit on y=0, ~4.2 m long. Returns { g, wheels, spin(d) }.
import * as THREE from 'three';
import { box, taper, lam, cmat, cyl } from './kit.js';
import { ptex, shade, noiseFill } from './tex.js';
import { glow, add } from './props3.js';

const glassM = () => new THREE.MeshLambertMaterial({ color: 0x223040, transparent: true, opacity: 0.75 });
function paint(col) { return lam({ map: ptex('cpaint' + col, 16, 16, (g, w, h, R) => { noiseFill(g, w, h, col, 0.02, R); g.fillStyle = shade(col, 1.18); g.fillRect(0, 1, w, 1); }) }); }
function wheelSet(g, xs, zs, r = 0.33, chromeHub = true) {
  const hub = ptex('hub2' + chromeHub, 16, 16, (c) => { c.fillStyle = '#121212'; c.fillRect(0, 0, 16, 16); c.fillStyle = chromeHub ? '#c8ccd2' : '#5a5e66'; c.beginPath(); c.arc(8, 8, 5.5, 0, 7); c.fill(); c.fillStyle = '#2a2a2e'; c.beginPath(); c.arc(8, 8, 1.6, 0, 7); c.fill(); });
  const wheels = [];
  for (const x of xs) for (const z of zs) { const wg = new THREE.Group(); add(g, wg, x, r, z); const t = cyl(r, r, 0.24, 14, [cmat('#141414', 0.05), lam({ map: hub }), lam({ map: hub })]); t.rotation.z = Math.PI / 2; wg.add(t); wheels.push(wg); }
  return wheels;
}
export function carGeneric(kind = 'wedge', col = '#d8262f') {
  const g = new THREE.Group(); const P = paint(col), G = glassM(), dark = cmat('#18191c', 0.04);
  let wheels;
  if (kind === 'wedge') { // flat, angular supercar
    add(g, taper(0.55, [1.6, 2.6], [2.0, 4.4], [P, P, P, dark, P, P], { pivot: 'bottom', off: [0, -0.5] }), 0, 0.2, 0);
    add(g, taper(0.38, [1.1, 0.9], [1.5, 1.8], [G, G, G, dark, G, G], { pivot: 'bottom', off: [0, -0.3] }), 0, 0.75, -0.3);
    add(g, box(1.9, 0.06, 0.4, P), 0, 1.0, -2.0); for (const s of [-1, 1]) add(g, box(0.06, 0.3, 0.06, dark, 'bottom'), s * 0.7, 0.72, -2.0);
    wheels = wheelSet(g, [0.95, -0.95], [1.4, -1.4], 0.34);
  } else if (kind === 'round') { // rear-engine coupe silhouette
    add(g, taper(0.5, [1.7, 3.6], [1.75, 4.2], [P, P, P, dark, P, P], { pivot: 'bottom' }), 0, 0.22, 0);
    const cab = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), P); cab.scale.set(0.8, 0.55, 1.5); cab.position.set(0, 0.7, -0.35); g.add(cab);
    const ws = new THREE.Mesh(new THREE.SphereGeometry(1.01, 10, 6, -0.7, 1.4, 0.35, 0.8), G); ws.scale.set(0.8, 0.55, 1.5); ws.position.set(0, 0.7, -0.35); g.add(ws);
    for (const s of [-1, 1]) add(g, new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), glow('#fff6dc', 1.6)), s * 0.6, 0.62, 2.05);
    wheels = wheelSet(g, [0.85, -0.85], [1.3, -1.35], 0.32);
  } else if (kind === 'sedan70') { // boxy 70s/80s saloon with chrome
    add(g, box(1.75, 0.6, 4.7, [P, P, P, dark, P, P], 'bottom'), 0, 0.28, 0); add(g, taper(0.5, [1.5, 1.7], [1.7, 2.3], [G, G, P, dark, G, G], { pivot: 'bottom' }), 0, 0.88, -0.2);
    add(g, box(1.8, 0.1, 0.1, cmat('#d0d4da', 0.02)), 0, 0.45, 2.36); add(g, box(1.8, 0.1, 0.1, cmat('#d0d4da', 0.02)), 0, 0.45, -2.36); add(g, box(0.7, 0.3, 0.05, cmat('#c8ccd2')), 0, 0.68, 2.36);
    wheels = wheelSet(g, [0.82, -0.82], [1.45, -1.45], 0.33);
  } else if (kind === 'coupe70') { // small 2-door with round lamps
    add(g, box(1.6, 0.55, 4.2, [P, P, P, dark, P, P], 'bottom'), 0, 0.28, 0); add(g, taper(0.48, [1.35, 1.4], [1.55, 1.9], [G, G, P, dark, G, G], { pivot: 'bottom', off: [0, -0.1] }), 0, 0.83, -0.15);
    for (const s of [-1, 1]) add(g, cyl(0.12, 0.12, 0.05, 10, glow('#fff6dc', 1.4)), s * 0.55, 0.63, 2.11, Math.PI / 2);
    add(g, box(1.65, 0.08, 0.08, cmat('#d0d4da')), 0, 0.38, 2.12);
    wheels = wheelSet(g, [0.75, -0.75], [1.3, -1.3], 0.31);
  } else { // 'hatch' 90s hatchback
    add(g, box(1.65, 0.6, 3.9, [P, P, P, dark, P, P], 'bottom'), 0, 0.28, 0); add(g, taper(0.5, [1.45, 1.2], [1.6, 2.4], [G, G, P, dark, G, G], { pivot: 'bottom', off: [0, -0.45] }), 0, 0.88, -0.45);
    for (const s of [-1, 1]) add(g, box(0.4, 0.12, 0.04, glow('#fff6dc', 1.4)), s * 0.55, 0.7, 1.96);
    wheels = wheelSet(g, [0.78, -0.78], [1.25, -1.2], 0.3, false);
  }
  for (const s of [-1, 1]) add(g, box(0.34, 0.12, 0.04, glow('#ff2a2a', 1.2)), s * 0.6, 0.66, kind === 'sedan70' ? -2.37 : kind === 'wedge' ? -2.2 : -2.0);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { g, wheels, spin(d) { for (const w of wheels) w.rotation.x = d / 0.33; } };
}
// tuner kit for the toyota: wing, underglow, side decal
export function tunerKit() {
  const g = new THREE.Group(); const blk = cmat('#111', 0.04);
  add(g, box(1.7, 0.06, 0.38, cmat('#d8262f', 0.03)), 0, 1.38, -2.05); for (const s of [-1, 1]) add(g, box(0.06, 0.38, 0.12, blk, 'bottom'), s * 0.6, 0.98, -2.05);
  const glowM = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 1.6, 2.8), transparent: true, opacity: 0.85, toneMapped: false, depthWrite: false });
  const ug = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4.8), glowM); ug.rotation.x = -Math.PI / 2; ug.position.y = 0.03; g.add(ug);
  const L = new THREE.PointLight(0x3ad0ff, 6, 4, 1.5); L.position.y = 0.2; g.add(L);
  for (const s of [-1, 1]) { const d = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.22), new THREE.MeshLambertMaterial({ map: ptex('decal', 64, 8, (c, w, h) => { c.fillStyle = '#d8262f'; c.beginPath(); c.moveTo(0, h); c.lineTo(w, 0); c.lineTo(w, h); c.fill(); c.fillStyle = '#16110f'; c.fillRect(0, h - 2, w, 2); }), transparent: true, side: THREE.DoubleSide })); d.position.set(s * 0.86, 0.6, -0.2); d.rotation.y = Math.PI / 2; g.add(d); }
  return g;
}

// THE DEATH OF INTERESTING THINGS — interior sets (cached per film). Each returns { scene, ...anchors }.
import * as THREE from 'three';
import { box, lam, basic, cmat, at, cyl, soft, phong } from './kit.js';
import { ptex, shade, noiseFill, textTex } from './tex.js';
import { lights, skyDome } from './env.js';
import * as P from './props.js';
import * as P2 from './props2.js';
import * as R3 from './props3.js';
import { glow, add, woodTex } from './props3.js';
import { room, cached } from './sets3.js';
import { monitor, gamingChair, wallClock, drawClock } from './sets4.js';
import * as Q from './props5.js';
import { text3d } from './glyph3d.js';
import { rng, clamp, hash2 } from '../core.js';
import { C, HEL, JP, UI, MONO, TIMES, COND } from '../ov/overlay.js';
export { cached };

const M = (hex, amp = 0.05, extra) => cmat(hex, amp, extra);
const sh = g => { g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
const wp = (key, base, stripe, rep, step = 8, sw = 1) => ptex('wp5:' + key, 32, 32, (g, w, h, R) => { noiseFill(g, w, h, base, 0.03, R); if (stripe) for (let x = 0; x < w; x += step) { g.fillStyle = stripe; g.fillRect(x, 0, sw, h); } }, { repeat: rep });
const tiles = (key, a, b, rep, n = 4) => ptex('tl5:' + key, 16, 16, (g, w, h) => { for (let y = 0; y < h; y += n) for (let x = 0; x < w; x += n) { g.fillStyle = ((x + y) / n) % 2 ? a : b; g.fillRect(x, y, n, n); } }, { repeat: rep });
function neon(text, col, { font = `800 64px ${HEL}`, w = 512, h = 128, k = 3.2, size = [2, 0.5] } = {}) {
  const t = textTex('neon5:' + text + col + font, w, h, (g) => { g.clearRect(0, 0, w, h); g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = col; g.shadowBlur = 18; g.fillStyle = col; g.fillText(text, w / 2, h / 2); g.shadowBlur = 0; g.fillStyle = '#ffffff'; g.globalAlpha = 0.7; g.fillText(text, w / 2, h / 2); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), new THREE.MeshBasicMaterial({ map: t, transparent: true, color: new THREE.Color(k, k, k), toneMapped: false, depthWrite: false }));
  m.userData.noSelf = true; return m;
}
export { neon };
const pendant = (sc, x, y, z, col = 0xffd59a, I = 6, dist = 6) => { const g = new THREE.Group(); g.position.set(x, y, z); sc.add(g); add(g, cyl(0.005, 0.005, 0.6, 4, M('#222')), 0, 0.3, 0); const shd = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.2, 12, 1, true), lam({ color: new THREE.Color('#c8262a'), side: THREE.DoubleSide })); g.add(shd); const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), glow('#ffe6b0', 3)); b.position.y = -0.06; g.add(b); const L = new THREE.PointLight(col, I, dist, 1.4); L.position.y = -0.15; g.add(L); return { g, L }; };

// ---------------- HOMER'S — JAX's diner (counter, stools, booths, the high CRT, menu board, night windows) ----------------
export function homersDiner(ctx) {
  return cached(ctx, 'homers', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x0a0a0c);
    const W = 10, D = 8, Hh = 3.2;
    const wall = ptex('homerswall', 32, 32, (g, w, h, R) => { noiseFill(g, w, h, '#efe4cc', 0.03, R); g.fillStyle = '#c8242c'; g.fillRect(0, h * 0.6, w, 3); g.fillStyle = '#2747c9'; g.fillRect(0, h * 0.6 + 4, w, 1); noiseFill(g, 0, 0, '#fff', 0, R); for (let x = 0; x < w; x += 4) { g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(x, h * 0.62, 1, h * 0.38); } }, { repeat: [6, 1] });
    room(sc, { w: W, d: D, h: Hh, wall, floor: tiles('homersfloor', '#16110f', '#f3ecdd', [12, 10]), ceil: '#e8e0cc', front: true });
    // counter (customer side +z), JAX works behind it (z ≈ -2.2)
    const cnt = new THREE.Group(); cnt.position.set(1.2, 0, -1.3); sc.add(cnt);
    const front = ptex('cntfront', 64, 16, (g, w, h, R) => { noiseFill(g, w, h, '#c8242c', 0.04, R); for (let x = 0; x < w; x += 4) { g.fillStyle = '#a81c22'; g.fillRect(x, 0, 1, h); } g.fillStyle = '#d8d6d0'; g.fillRect(0, 0, w, 2); g.fillRect(0, h - 2, w, 2); });
    add(cnt, box(6, 1.0, 0.7, [M('#a81c22'), M('#a81c22'), M('#a81c22'), M('#111'), lam({ map: front }), M('#a81c22')], 'bottom'), 0, 0, 0);
    add(cnt, box(6.2, 0.06, 0.9, phong({ map: ptex('formica', 16, 16, (g, w, h, R) => { noiseFill(g, w, h, '#e9e6dc', 0.03, R); for (let i = 0; i < 12; i++) { g.fillStyle = '#c8c0b0'; g.fillRect(R() * w, R() * h, 2, 1); } }), spec: 0x666666, shin: 30 }), 'bottom'), 0, 1.0, 0.05);
    const stools = [];
    for (let i = 0; i < 6; i++) { const s = new THREE.Group(); s.position.set(-2.4 + i * 0.95, 0, 0.75); cnt.add(s); add(s, cyl(0.04, 0.05, 0.72, 8, phong({ color: 0xd0d4d8, spec: 0xffffff, shin: 70 })), 0, 0.36, 0); add(s, cyl(0.2, 0.2, 0.08, 14, M('#c8242c', 0.04)), 0, 0.74, 0); add(s, cyl(0.2, 0.22, 0.03, 14, M('#888')), 0, 0.015, 0); stools.push([1.2 - 2.4 + i * 0.95, 0.78, -1.3 + 0.75]); }
    // back bar: coffee machine, pie case, milkshake mixers
    const bb = new THREE.Group(); bb.position.set(1.2, 0, -3.65); sc.add(bb);
    add(bb, box(6.4, 0.95, 0.6, M('#d8d0bc', 0.04), 'bottom'), 0, 0, 0);
    add(bb, box(0.55, 0.6, 0.45, phong({ color: 0xc8ccd0, spec: 0xffffff, shin: 60 }), 'bottom'), -2.2, 0.95, 0);
    const pie = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.45, 12, 1, true), new THREE.MeshPhongMaterial({ color: 0xddeeff, transparent: true, opacity: 0.35, shininess: 100, depthWrite: false })); pie.position.set(0.4, 1.18, 0); bb.add(pie);
    for (let k = 0; k < 2; k++) { const p = cyl(0.3, 0.3, 0.08, 12, M(k ? '#d8a050' : '#b8442a', 0.06)); p.position.set(0.4, 1.0 + k * 0.2, 0); bb.add(p); }
    for (let i = 0; i < 3; i++) { add(bb, box(0.16, 0.5, 0.2, M(['#7ab8d8', '#ff7eb6', '#f3eee2'][i], 0.03), 'bottom'), 1.6 + i * 0.3, 0.95, 0); }
    // kitchen pass-through + heat lamps
    add(sc, box(2.4, 0.9, 0.05, M('#111'), 'bottom'), 2.3, 1.45, -3.97);
    const kitchen = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.85), basic({ color: new THREE.Color(1.6, 1.3, 0.9), map: ptex('kitchen', 64, 32, (g, w, h, R) => { noiseFill(g, w, h, '#c8b89a', 0.06, R); g.fillStyle = '#8a8a8a'; g.fillRect(0, 18, w, 3); for (let i = 0; i < 6; i++) { g.fillStyle = '#d0d4d8'; g.fillRect(4 + i * 10, 8, 6, 10); } }) })); kitchen.position.set(2.3, 1.9, -3.94); sc.add(kitchen);
    for (let i = 0; i < 3; i++) { const hl = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), glow('#ff8a40', 3)); hl.position.set(1.6 + i * 0.7, 2.28, -3.85); sc.add(hl); }
    // menu board (live canvas)
    const menu = new P.Screen(640, 200, 1.15); const mm = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.3), menu.mat); mm.position.set(-1.0, 2.45, -3.95); mm.userData.noSelf = true; sc.add(mm);
    // the high CRT in the corner (cold-open TV)
    const tv = R3.crt60({ legs: false, scale: 0.75 }); tv.g.position.set(-3.85, 2.05, -3.3); tv.g.rotation.y = 0.62; sc.add(tv.g);
    add(sc, box(1.1, 0.05, 0.75, M('#3a2a20'), 'bottom'), -3.85, 2.0, -3.3, 0, 0.62);
    // booths along the left wall
    const booths = [];
    for (const z of [-1.4, 0.6, 2.6]) { const b = new THREE.Group(); b.position.set(-4.1, 0, z); sc.add(b); const red = M('#c8262a', 0.05);
      for (const s of [-1, 1]) { add(b, box(0.55, 0.45, 1.4, red, 'bottom'), s * 0.75, 0, 0); add(b, box(0.15, 0.8, 1.4, red, 'bottom'), s * 1.0, 0.45, 0); }
      add(b, box(0.9, 0.05, 1.3, phong({ color: 0xe8e4dc, spec: 0x444444, shin: 30 }), 'bottom'), 0, 0.74, 0); add(b, cyl(0.06, 0.08, 0.74, 6, M('#bbb')), 0, 0, 0); booths.push(b); }
    // jukebox
    const jb = new THREE.Group(); jb.position.set(-4.4, 0, 3.6); jb.rotation.y = Math.PI * 0.8; sc.add(jb);
    add(jb, box(0.8, 1.3, 0.55, M('#5a2a1a', 0.06), 'bottom'), 0, 0, 0); const arch = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.08, 6, 16, Math.PI), glow('#ffb347', 2.4)); arch.position.set(0, 1.3, 0.2); jb.add(arch);
    for (let i = 0; i < 3; i++) add(jb, box(0.06, 0.9, 0.04, glow(['#ff7eb6', '#a6d7e6', '#ffd43b'][i], 2.2), 'bottom'), -0.24 + i * 0.24, 0.2, 0.29);
    // right-wall windows onto a night street (neon)
    const night = ptex('homersnight', 128, 64, (g, w, h, R) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a0c1e'); gr.addColorStop(1, '#1e1430'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let x = 0; x < w;) { const bw = 8 + R() * 16 | 0, bh = 16 + R() * 34 | 0; g.fillStyle = '#0d0e18'; g.fillRect(x, h - bh, bw, bh); for (let yy = h - bh + 3; yy < h - 4; yy += 4) for (let xx = x + 2; xx < x + bw - 2; xx += 3) if (R() < 0.3) { g.fillStyle = R() < 0.5 ? '#ffd27a' : '#7ab8ff'; g.fillRect(xx, yy, 1, 2); } x += bw + 1; } g.fillStyle = '#ff3b6b'; g.fillRect(20, 30, 14, 2); g.fillStyle = '#3ddcff'; g.fillRect(80, 24, 10, 2); });
    for (const z of [-1.6, 1.6]) { const wv = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6), basic({ map: night, color: new THREE.Color(1.3, 1.3, 1.4) })); wv.position.set(W / 2 - 0.01, 1.75, z); wv.rotation.y = -Math.PI / 2; sc.add(wv); add(sc, box(0.06, 1.7, 2.7, M('#d8d8d8')), W / 2 - 0.04, 1.75, z); }
    const sgn = neon("HOMER'S", '#ff3b4b', { font: `800 92px ${COND}` , size: [2.2, 0.55] }); sgn.position.set(-1.0, 3.0, -3.93); sc.add(sgn);
    const open = neon('OPEN 24H', '#3ddcff', { font: `800 70px ${COND}`, size: [1.0, 0.25] }); open.position.set(W / 2 - 0.05, 2.75, 0); open.rotation.y = -Math.PI / 2; sc.add(open);
    // lights: three pendants over the counter, cool street spill, warm hemi
    const pends = [-1.2, 0.8, 2.8].map(x => pendant(sc, x, 2.55, -1.2, 0xffd59a, 7, 6));
    sc.add(new THREE.HemisphereLight(0xffe8c8, 0x3a2a20, 0.75));
    const street = new THREE.DirectionalLight(0x7a8cff, 0.8); street.position.set(8, 3, 1); street.target.position.set(0, 0, 0); sc.add(street); sc.add(street.target);
    const key = new THREE.DirectionalLight(0xffe2b8, 0.9); key.position.set(-2, 6, 4); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); { const c = key.shadow.camera; c.left = -6; c.right = 6; c.top = 6; c.bottom = -6; c.near = 1; c.far = 20; } key.target.position.set(0, 0, -1); sc.add(key); sc.add(key.target);
    sh(cnt); sh(bb);
    return { scene: sc, tv, menu, stools, booths, pends, jaxSpot: [1.2, 0, -2.2, 0], counterY: 1.06 };
  });
}
export function drawMenu(scr) { return scr.draw((g, w, h) => {
  g.fillStyle = '#16110f'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c8242c'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = '#f3ecdd'; g.font = `800 34px ${COND}`; g.textAlign = 'center'; g.fillText("— HOMER'S —  EST. 8TH CENTURY BC", w / 2, 50);
  const items = [['THE ODYSSEY BURGER', '9.99'], ['CYCLOPS EGG (ONE)', '4.50'], ['TROJAN FRIES', '3.99'], ['SIREN SHAKE', '5.25'], ['NOSTOS PIE', '4.75'], ['10-YEAR SLOW ROAST', '27.00']];
  g.font = `700 22px ${COND}`; items.forEach(([n, p], i) => { const x = i % 2 ? w * 0.54 : 40, y = 92 + (i >> 1) * 36; g.textAlign = 'left'; g.fillStyle = '#f3ecdd'; g.fillText(n, x, y); g.textAlign = 'right'; g.fillStyle = '#ffd43b'; g.fillText(p, x + w * 0.42, y); });
}); }

// ---------------- JAX's media studio (the confessional): foam, neon, shelves, boom-arm mic ----------------
export function mediaStudio(ctx) {
  return cached(ctx, 'mediastudio', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x07080c);
    const W = 4.6, D = 4.2, Hh = 2.7;
    room(sc, { w: W, d: D, h: Hh, wall: wp('msw', '#2a2e36', null, [4, 2]), floor: ptex('msfloor', 32, 32, (g, w, h, R) => { noiseFill(g, w, h, '#4a3a2e', 0.05, R); for (let y = 0; y < h; y += 8) { g.fillStyle = '#3a2c22'; g.fillRect(0, y, w, 1); } }, { repeat: [5, 5] }), ceil: '#141519', front: true });
    // acoustic foam grid on the back wall
    const foamT = ptex('foam', 32, 32, (g, w, h, R) => { for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 8) { const vert = ((x + y) / 8) % 2; for (let k = 0; k < 8; k++) { g.fillStyle = shade('#2d3038', 0.8 + (vert ? k : 7 - k) * 0.05); if (vert) g.fillRect(x + k, y, 1, 8); else g.fillRect(x, y + k, 8, 1); } } }, { repeat: [6, 3] });
    const foam = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.8), lam({ map: foamT })); foam.position.set(0, 1.45, -D / 2 + 0.03); sc.add(foam);
    // neon "PUBLIC DOOM" + P(●) mark
    const n1 = neon('PUBLIC DOOM', '#a6d7e6', { font: `800 72px ${HEL}`, size: [1.5, 0.37], k: 2.8 }); n1.position.set(-0.75, 1.95, -D / 2 + 0.06); sc.add(n1);
    const n2 = neon('P(●)', '#ff7eb6', { font: `800 80px ${HEL}`, size: [0.9, 0.3], k: 2.6 }); n2.position.set(0.95, 1.95, -D / 2 + 0.06); sc.add(n2);
    // shelves with toys: a trireme model, a cat figurine, books, a tiny HOMER'S cup
    const shelf = new THREE.Group(); shelf.position.set(1.45, 0, -D / 2 + 0.2); sc.add(shelf);
    for (let i = 0; i < 3; i++) add(shelf, box(1.1, 0.03, 0.28, M('#5a3a24', 0.05), 'bottom'), 0, 0.7 + i * 0.42, 0);
    const shipM = Q.trireme({ len: 3 }); shipM.g.scale.setScalar(0.1); shipM.g.position.set(-0.15, 1.17, 0); shelf.add(shipM.g);
    const kitty = Q.cat(); kitty.g.scale.setScalar(0.45); kitty.g.position.set(0.32, 0.73, 0.02); kitty.pose({ sit: 1 }); shelf.add(kitty.g);
    const R = rng(5); for (let i = 0; i < 9; i++) add(shelf, box(0.05, 0.2 + R() * 0.08, 0.17, M(['#c8242c', '#2747c9', '#f3eee2', '#ffd43b', '#1d3b52'][i % 5], 0.04), 'bottom'), -0.5 + i * 0.07, 1.56, 0);
    const cup = R3.mug('#f3eee2'); cup.position.set(-0.3, 0.73, 0.02); shelf.add(cup);
    // desk + monitor + boom mic (JAX sits at [0, 0.48, -0.9] facing +z)
    const desk = P.table(1.4, 0.7, 0.74, '#2a2a2e'); desk.position.set(0, 0, -0.35); sc.add(desk);
    const mon = monitor(0.62, 0.36, [640, 360], 1.3); mon.g.position.set(0.82, 0.98, -0.42); mon.g.rotation.y = -0.6; sc.add(mon.g);
    const mic = R3.podMic(); mic.position.set(-0.62, 0.74, -0.5); mic.rotation.y = 0.95; sc.add(mic);
    const chair = gamingChair('#a6d7e6'); chair.g.position.set(0, 0, -0.95); chair.g.rotation.y = Math.PI; sc.add(chair.g);
    // LED strip along the ceiling edge
    for (const [x, z, w, ry] of [[0, -D / 2 + 0.05, W, 0], [-W / 2 + 0.05, 0, D, Math.PI / 2], [W / 2 - 0.05, 0, D, Math.PI / 2]]) { const l = box(w, 0.03, 0.03, glow('#8b5cf6', 2.6)); l.position.set(x, Hh - 0.05, z); l.rotation.y = ry; sc.add(l); }
    // ring light + camera on tripod (front, usually behind our camera)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.025, 6, 24), glow('#ffffff', 2.4)); ring.position.set(0.6, 1.35, 1.4); ring.rotation.y = Math.PI + 0.3; sc.add(ring);
    const cam = P2.filmCamera(); cam.position.set(-0.2, 0, 1.5); cam.rotation.y = Math.PI; sc.add(cam);
    // lights: soft key from the ring light side, purple rim, cool fill
    sc.add(new THREE.HemisphereLight(0xb8c8ff, 0x2a2024, 0.55));
    const key = new THREE.DirectionalLight(0xfff2e2, 1.5); key.position.set(1.8, 2.6, 2.6); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); { const c = key.shadow.camera; c.left = -3; c.right = 3; c.top = 3; c.bottom = -3; c.near = 0.5; c.far = 12; } key.target.position.set(0, 1, -1); sc.add(key); sc.add(key.target);
    const rim = new THREE.PointLight(0x9b6cff, 5, 4, 1.6); rim.position.set(-1.3, 2.2, -1.6); sc.add(rim);
    const rim2 = new THREE.PointLight(0x6ad7ff, 3, 4, 1.6); rim2.position.set(1.4, 2.0, -1.6); sc.add(rim2);
    sh(shelf);
    return { scene: sc, seat: [0, 0.48, -0.95, 0], mon: mon.scr, monG: mon.g, mic, ring, cam, key };
  });
}

// ---------------- TOPENG LABS: the white experiment room + the observation room behind the one-way mirror ----------------
// experiment room x∈[-2.5,2.5], z∈[-2.5,2.5]; mirror on the x=-2.5 wall; observation room x∈[-6,-2.5]
export function lab(ctx) {
  return cached(ctx, 'lab', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x05060a);
    const panel = ptex('labpanel', 32, 32, (g, w, h, R) => { noiseFill(g, w, h, '#e9ece9', 0.02, R); g.fillStyle = '#cdd2d0'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); }, { repeat: [5, 3] });
    const fl = tiles('labfloor', '#b9beba', '#c4c8c4', [10, 10], 8);
    const walls = room(sc, { w: 5, d: 5, h: 3, wall: panel, floor: fl, ceil: '#eef0ee', left: false, front: true });
    // left wall with the mirror window (built around a 2.6 x 1.3 hole)
    const lw = lam({ map: panel });
    const seg = (w, h, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lw); m.position.set(-2.5, y, z); m.rotation.y = Math.PI / 2; m.receiveShadow = true; sc.add(m); return m; };
    seg(5, 0.9, 0.45, 0); seg(5, 0.8, 2.6, 0); seg(1.2, 1.3, 1.55, -1.9); seg(1.2, 1.3, 1.55, 1.9);
    const mirror = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), new THREE.MeshPhongMaterial({ color: 0x1a2028, transparent: true, opacity: 0.55, shininess: 140, specular: 0x9aa4b0, side: THREE.DoubleSide, depthWrite: false })); mirror.position.set(-2.5, 1.55, 0); mirror.rotation.y = Math.PI / 2; sc.add(mirror);
    // ceiling light panels
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const lp = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), glow('#f4f8ff', 2.2)); lp.rotation.x = Math.PI / 2; lp.position.set(x, 2.99, z); sc.add(lp); }
    // the chair (Topeng faces -z toward the screen)
    const chairG = Q.chair('#d8dcdc'); chairG.position.set(0, 0, 0.7); chairG.rotation.y = Math.PI; sc.add(chairG);
    // rolling monitor stand with a swappable screen material
    const stand = new THREE.Group(); stand.position.set(0, 0, -0.65); sc.add(stand);
    add(stand, cyl(0.04, 0.04, 1.0, 8, M('#3a3c40')), 0, 0.5, 0); add(stand, box(0.7, 0.04, 0.5, M('#3a3c40'), 'bottom'), 0, 0.02, 0);
    const scrW = 0.96, scrH = 0.54; add(stand, box(scrW + 0.05, scrH + 0.05, 0.05, M('#121214'), 'center'), 0, 1.25, -0.03);
    const scr = new P.Screen(640, 360, 1.25); const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(scrW, scrH), scr.mat); screenMesh.position.set(0, 1.25, 0.0); screenMesh.userData.noSelf = true; stand.add(screenMesh);
    const scrLight = new THREE.PointLight(0x9ac4ff, 0, 3.5, 1.6); scrLight.position.set(0, 1.25, 0.5); stand.add(scrLight);
    // side table + glass
    const tbl = P.table(0.4, 0.4, 0.62, '#d8dcdc'); tbl.position.set(0.62, 0, 0.55); sc.add(tbl);
    const glassC = Q.glassCup(); glassC.g.position.set(0.62, 0.62, 0.55); sc.add(glassC.g);
    // CCTV in the corner over the screen side, looking at the chair
    const cc = Q.cctv(); cc.g.position.set(2.42, 2.75, -2.42); cc.g.rotation.y = -Math.PI * 0.25 - Math.PI / 2 + Math.PI / 2; sc.add(cc.g);
    const ccLook = new THREE.Object3D(); sc.add(ccLook);
    // signage
    const logo = textTex('topenglabs', 256, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#16110f'; g.font = `800 34px ${HEL}`; g.fillText('TOPENG LABS', 8, 40); g.fillStyle = '#d8262f'; g.fillRect(8, 48, 60, 4); g.font = `700 20px ${JP}`; g.fillStyle = '#5a6066'; g.fillText('実験室 01', 160, 58); });
    const lg = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), lam({ map: logo, transparent: true })); lg.position.set(1.0, 2.35, -2.49); sc.add(lg);
    const door = new THREE.Group(); door.position.set(2.46, 0, 0.93); sc.add(door); const dp = box(0.06, 2.1, 0.95, M('#9aa2a6', 0.03), 'bottom'); dp.position.set(0, 0, 0.475); door.add(dp); const dwin = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.5), M('#2a3036')); dwin.rotation.y = -Math.PI / 2; dwin.position.set(-0.035, 1.5, 0.475); door.add(dwin); const doorLight = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 2.1), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 3.0, 2.7), toneMapped: false })); doorLight.position.set(2.495, 1.05, 1.405); doorLight.rotation.y = -Math.PI / 2; sc.add(doorLight); const doorLamp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.3), M('#5a1010')); doorLamp.position.set(2.45, 2.35, 1.4); sc.add(doorLamp);
    add(sc, box(0.03, 0.03, 0.15, M('#888')), 2.42, 1.0, 1.05);
    // ---- observation room
    const ow = wp('obswall', '#20242c', '#1a1d24', [4, 2]);
    const obs = new THREE.Group(); sc.add(obs);
    const ofl = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 5), lam({ map: ptex('obsfloor', 16, 16, (g, w, h, R) => noiseFill(g, w, h, '#2a2c30', 0.08, R), { repeat: [4, 5] }) })); ofl.rotation.x = -Math.PI / 2; ofl.position.set(-4.25, 0, 0); ofl.receiveShadow = true; obs.add(ofl);
    const ocl = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 5), M('#16181c')); ocl.rotation.x = Math.PI / 2; ocl.position.set(-4.25, 3, 0); obs.add(ocl);
    for (const [x, z, ry, w] of [[-6, 0, Math.PI / 2, 5], [-4.25, -2.5, 0, 3.5], [-4.25, 2.5, Math.PI, 3.5]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 3), lam({ map: ow })); m.position.set(x, 1.5, z); m.rotation.y = ry; obs.add(m); }
    for (const [w, h, y, z] of [[5, 0.9, 0.45, 0], [5, 0.8, 2.6, 0], [1.2, 1.3, 1.55, -1.9], [1.2, 1.3, 1.55, 1.9]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lam({ map: ow })); m.position.set(-2.52, y, z); m.rotation.y = -Math.PI / 2; obs.add(m); }
    const odesk = P.table(0.8, 2.4, 0.76, '#2a2c30'); odesk.position.set(-3.05, 0, 0); obs.add(odesk);
    const obsMons = []; for (let i = 0; i < 3; i++) { const m = monitor(0.56, 0.33, [640, 360], 1.3); m.g.position.set(-2.95, 1.1, -0.75 + i * 0.75); m.g.rotation.y = -Math.PI / 2 + (i - 1) * -0.18; obs.add(m.g); obsMons.push(m); }
    const intercom = R3.podMic(); intercom.position.set(-2.85, 0.76, 0.95); intercom.rotation.y = -Math.PI / 2 - 0.6; intercom.scale.setScalar(0.8); obs.add(intercom);
    const ochair = gamingChair('#3a3c40'); ochair.g.position.set(-3.75, 0, 0.0); ochair.g.rotation.y = -Math.PI / 2; obs.add(ochair.g);
    const obsL = new THREE.PointLight(0x6a8cff, 2.2, 5, 1.6); obsL.position.set(-4.5, 2.4, 0); obs.add(obsL);
    // lights (experiment room is flat fluorescent)
    const hemi = new THREE.HemisphereLight(0xf4f8ff, 0x9aa0a0, 1.25); sc.add(hemi);
    const key = new THREE.DirectionalLight(0xf6f8ff, 0.9); key.position.set(1.5, 6, 2.5); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); { const c = key.shadow.camera; c.left = -4; c.right = 4; c.top = 4; c.bottom = -4; c.near = 1; c.far = 14; } key.target.position.set(0, 0, 0); sc.add(key); sc.add(key.target);
    const fill = new THREE.PointLight(0xffffff, 4, 6, 1.5); fill.position.set(0, 2.6, 0.5); sc.add(fill);
    sh(stand); stand.traverse(o => { if (o === screenMesh) o.castShadow = false; });
    return { scene: sc, chair: chairG, seat: [0, 0.47, 0.72, Math.PI], stand, scr, screenMesh, scrLight, glass: glassC, doorLamp, doorLight, tablePos: [0.62, 0.62, 0.55], cctv: cc, obsMons, obsSeat: [-3.75, 0.48, 0.0, -Math.PI / 2 + Math.PI], hemi, key, fill, obsL, mirror, door };
  });
}

// ---------------- beauty salon: 3 vanity stations, hood dryers, nail table, pink neon ----------------
export function salon(ctx) {
  return cached(ctx, 'salon', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x120a10);
    const W = 9, D = 7, Hh = 3.1;
    room(sc, { w: W, d: D, h: Hh, wall: wp('salonw', '#f4d6dc', '#efcbd2', [6, 2], 16, 3), floor: ptex('terrazzo', 32, 32, (g, w, h, R) => { noiseFill(g, w, h, '#efe8e2', 0.03, R); for (let i = 0; i < 60; i++) { g.fillStyle = ['#ff7eb6', '#a6d7e6', '#c8c0b8', '#ffd43b'][i % 4]; g.fillRect(R() * w, R() * h, 1 + R() * 2, 1); } }, { repeat: [10, 8] }), ceil: '#fbf4f2', front: true });
    // stations along the back wall; chairs face the mirrors (-z)
    const stations = [];
    for (let i = 0; i < 3; i++) { const x = -2.6 + i * 2.6; const v = Q.vanity(1.25, 1.35); v.position.set(x, 0, -D / 2 + 0.3); sc.add(v); const ch = Q.salonChair(['#ff7eb6', '#a6d7e6', '#ffd43b'][i]); ch.position.set(x, 0, -D / 2 + 1.55); ch.rotation.y = Math.PI; sc.add(ch); stations.push({ x, chair: ch, seat: [x, 0.56, -D / 2 + 1.5, Math.PI] }); }
    // hood dryers on the right wall, sitters face -x
    const dryers = [];
    for (let i = 0; i < 2; i++) { const z = -0.6 + i * 1.6; const g = new THREE.Group(); g.position.set(W / 2 - 0.75, 0, z); g.rotation.y = -Math.PI / 2; sc.add(g); const ch = Q.salonChair('#f3eee6'); g.add(ch); const dr = Q.hoodDryer(); g.add(dr); dryers.push({ g, seat: [W / 2 - 0.72, 0.56, z, -Math.PI / 2] }); }
    // nail table front-left with two chairs facing each other across x
    const nt = new THREE.Group(); nt.position.set(-2.6, 0, 1.5); sc.add(nt);
    add(nt, box(1.2, 0.05, 0.6, phong({ color: 0xffffff, spec: 0xffffff, shin: 40 }), 'bottom'), 0, 0.74, 0); add(nt, box(1.1, 0.72, 0.5, M('#f6dfe6'), 'bottom'), 0, 0, 0);
    const lampN = R3.mug('#ff7eb6'); lampN.position.set(0.3, 0.79, -0.15); nt.add(lampN);
    for (let i = 0; i < 6; i++) add(nt, cyl(0.015, 0.02, 0.07, 6, M(['#ff3b6b', '#ff7eb6', '#8b5cf6', '#ffd43b', '#3ddc84', '#a6d7e6'][i], 0.02)), -0.45 + i * 0.07, 0.79, -0.2);
    const nailSeats = [[-3.35, 0.47, 1.5, Math.PI / 2], [-1.85, 0.47, 1.5, -Math.PI / 2]];
    for (const s of nailSeats) { const c = Q.chair('#f3eee6'); c.position.set(s[0] - Math.sin(s[3]) * 0.05, 0, s[2]); c.rotation.y = s[3]; sc.add(c); }
    // shelves of products on the left wall + plants
    const shelf = new THREE.Group(); shelf.position.set(-W / 2 + 0.2, 0, -1.0); shelf.rotation.y = Math.PI / 2; sc.add(shelf);
    const R = rng(11); for (let r = 0; r < 4; r++) { add(shelf, box(2.0, 0.03, 0.3, M('#ffffff', 0.02), 'bottom'), 0, 0.6 + r * 0.42, 0); for (let i = 0; i < 12; i++) add(shelf, cyl(0.04, 0.045, 0.12 + R() * 0.14, 8, M(['#ff7eb6', '#a6d7e6', '#ffd43b', '#f3eee6', '#8b5cf6', '#1d1d22'][(R() * 6) | 0], 0.03)), -0.9 + i * 0.16, 0.63 + r * 0.42, 0); }
    for (const [x, z] of [[-W / 2 + 0.5, 3.0], [W / 2 - 0.5, 3.0], [-W / 2 + 0.5, -D / 2 + 0.5]]) { const pot = cyl(0.22, 0.17, 0.4, 10, M('#f3eee6')); pot.position.set(x, 0.2, z); sc.add(pot); for (let k = 0; k < 7; k++) { const l = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.9, 4), M('#3f8a4a', 0.12)); l.position.set(x + Math.sin(k * 2.4) * 0.12, 0.75, z + Math.cos(k * 2.4) * 0.12); l.rotation.set(Math.cos(k * 2.4) * 0.4, 0, -Math.sin(k * 2.4) * 0.4); sc.add(l); } }
    // pink neon
    const n1 = neon('サロン', '#ff5fa8', { font: `800 96px ${JP}`, size: [1.6, 0.4], k: 3 }); n1.position.set(-1.3, 2.75, -D / 2 + 0.05); sc.add(n1);
    const n2 = neon('glow up', '#ff5fa8', { font: `italic 700 84px ${HEL}`, size: [1.5, 0.37], k: 3 }); n2.position.set(1.4, 2.75, -D / 2 + 0.05); sc.add(n2);
    // left-wall window (day street)
    const day = ptex('salonday', 128, 64, (g, w, h, R) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9fd2f2'); gr.addColorStop(1, '#e8f4fa'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let x = 0; x < w;) { const bw = 10 + R() * 18 | 0, bh = 18 + R() * 30 | 0; g.fillStyle = ['#e8d8c8', '#d8c8b8', '#f0e0d8'][(R() * 3) | 0]; g.fillRect(x, h - bh, bw, bh); x += bw + 2; } });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), basic({ map: day, color: new THREE.Color(1.5, 1.5, 1.5) })); win.position.set(-W / 2 + 0.01, 1.7, 2.0); win.rotation.y = Math.PI / 2; sc.add(win);
    sc.add(new THREE.HemisphereLight(0xfff0f4, 0xd8b8c0, 1.0));
    const key = new THREE.DirectionalLight(0xfff4ec, 1.2); key.position.set(-5, 5, 3); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); { const c = key.shadow.camera; c.left = -6; c.right = 6; c.top = 6; c.bottom = -6; c.near = 1; c.far = 20; } key.target.position.set(0, 0, 0); sc.add(key); sc.add(key.target);
    const pinkL = new THREE.PointLight(0xff6fb0, 4, 6, 1.5); pinkL.position.set(0, 2.6, -2.6); sc.add(pinkL);
    sh(nt); sh(shelf);
    return { scene: sc, stations, dryers, nailSeats, key };
  });
}

// ---------------- MUSIC TV studio (TRL-style): window wall on a neon street, couch, host desk, the big M ----------------
export function mtvStudio(ctx) {
  return cached(ctx, 'mtv', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x05040a);
    const W = 12, D = 9, Hh = 4.4;
    room(sc, { w: W, d: D, h: Hh, back: false, wall: wp('mtvw', '#1c1a2a', '#2a2440', [6, 2], 8, 2), floor: ptex('mtvfloor', 32, 32, (g, w, h, R) => { noiseFill(g, w, h, '#1a1824', 0.05, R); g.fillStyle = '#ffd43b'; g.fillRect(0, 0, w, 1); g.fillStyle = '#ff3b8b'; g.fillRect(0, 16, w, 1); }, { repeat: [8, 6] }), ceil: '#0a0a10' });
    // window wall: a painted night street with billboards
    const street = ptex('mtvstreet', 512, 192, (g, w, h, R) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#120c2a'); gr.addColorStop(1, '#2a1a3a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let x = 0; x < w;) { const bw = 30 + R() * 60 | 0, bh = 80 + R() * 110 | 0; g.fillStyle = '#100e1c'; g.fillRect(x, h - bh, bw, bh); for (let k = 0; k < 2; k++) { const bx = x + 4 + R() * (bw - 30), by = h - bh + 10 + R() * (bh - 60); g.fillStyle = ['#ff3b8b', '#ffd43b', '#3ddcff', '#8b5cf6', '#3ddc84', '#ff7a2b'][(R() * 6) | 0]; g.fillRect(bx, by, 26 + R() * 30, 18 + R() * 26); } for (let yy = h - bh + 4; yy < h - 6; yy += 6) for (let xx = x + 3; xx < x + bw - 3; xx += 5) if (R() < 0.25) { g.fillStyle = '#ffe8b0'; g.fillRect(xx, yy, 2, 3); } x += bw + 3; }
      g.fillStyle = '#ffd43b'; g.fillRect(0, h - 10, w, 2); for (let x = 0; x < w; x += 12) { g.fillStyle = R() < 0.5 ? '#ff4040' : '#fff6d0'; g.fillRect(x + R() * 6, h - 7, 3, 2); } });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(W, Hh), basic({ map: street, color: new THREE.Color(1.5, 1.5, 1.5) })); win.position.set(0, Hh / 2, -D / 2 - 0.4); sc.add(win);
    for (let x = -W / 2; x <= W / 2; x += 2) add(sc, box(0.12, Hh, 0.12, M('#141420')), x, Hh / 2, -D / 2);
    add(sc, box(W, 0.18, 0.2, M('#141420')), 0, Hh * 0.52, -D / 2);
    // the big M sculpture + small "music television"
    const Mm = text3d('M', { font: `900 200px ${HEL}`, px: 200, depth: 0.5, bevel: 0.04, unit: 2.2, mats: [lam({ color: new THREE.Color('#ffd43b') }), lam({ color: new THREE.Color('#d8a800') })] });
    Mm.position.set(-4.6, 0.2, -3.0); Mm.rotation.y = 0.5; sc.add(Mm); Mm.castShadow = true;
    const tvs = neon('music television', '#3ddcff', { font: `italic 800 64px ${HEL}`, size: [1.9, 0.45], k: 2.6 }); tvs.position.set(-3.7, 2.9, -3.3); tvs.rotation.y = 0.5; sc.add(tvs);
    // couch (3 seats, faces +z) + coffee table
    const couch = new THREE.Group(); couch.position.set(0.4, 0, -1.6); sc.add(couch); const cm = M('#ff3b8b', 0.05);
    add(couch, box(2.6, 0.42, 0.8, cm, 'bottom'), 0, 0, 0); add(couch, box(2.6, 0.55, 0.22, cm, 'bottom'), 0, 0.42, -0.32); for (const s of [-1, 1]) add(couch, box(0.25, 0.62, 0.8, cm, 'bottom'), s * 1.3, 0, 0);
    add(sc, box(1.4, 0.36, 0.6, phong({ color: 0x8b5cf6, spec: 0xffffff, shin: 60 }), 'bottom'), 0.4, 0, -0.35);
    // host desk (right)
    const desk = new THREE.Group(); desk.position.set(3.6, 0, -1.4); desk.rotation.y = -0.4; sc.add(desk);
    add(desk, box(1.8, 1.0, 0.7, [M('#2a2440'), M('#2a2440'), M('#2a2440'), M('#111'), lam({ map: ptex('mtvdesk', 64, 32, (g, w, h, R) => { noiseFill(g, w, h, '#2a2440', 0.05, R); g.fillStyle = '#ffd43b'; g.font = `900 22px ${HEL}`; g.fillText('M', 4, 26); g.fillStyle = '#3ddcff'; g.font = `italic 700 9px ${HEL}`; g.fillText('LIVE · NEWS', 26, 20); }) }), M('#2a2440')], 'bottom'), 0, 0, 0);
    // trusses + colored spots
    for (let i = 0; i < 6; i++) { const x = -5 + i * 2; const sp = new THREE.SpotLight(['#ff3b8b', '#3ddcff', '#ffd43b', '#8b5cf6', '#3ddc84', '#ff7a2b'][i], 14, 12, 0.5, 0.6, 1.2); sp.position.set(x, Hh - 0.2, 1.5); sp.target.position.set(x * 0.4, 0, -2); sc.add(sp); sc.add(sp.target); add(sc, cyl(0.12, 0.1, 0.25, 8, M('#111')), x, Hh - 0.15, 1.5, 0.6); }
    add(sc, box(W, 0.12, 0.12, M('#888')), 0, Hh - 0.05, 1.5);
    // studio cameras on pedestals
    for (const [x, z, ry] of [[-2.2, 2.8, 0.25], [2.8, 2.6, -0.35]]) { const c = P2.filmCamera(); c.position.set(x, 0, z); c.rotation.y = Math.PI + ry; sc.add(c); }
    const wall = P2.ledWall(2.6, 1.5, [512, 288]); wall.mesh.position.set(4.6, 2.6, -2.6); wall.mesh.rotation.y = -0.6; sc.add(wall.mesh);
    sc.add(new THREE.HemisphereLight(0x8a7aff, 0x2a1a30, 0.8));
    const key = new THREE.DirectionalLight(0xfff0f8, 1.3); key.position.set(2, 6, 6); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); { const c = key.shadow.camera; c.left = -7; c.right = 7; c.top = 7; c.bottom = -7; c.near = 1; c.far = 24; } key.target.position.set(0, 0, -1); sc.add(key); sc.add(key.target);
    sh(couch); sh(desk);
    return { scene: sc, couchSeat: (k) => [0.4 - 0.8 + k * 0.8, 0.45, -1.62, 0], desk, deskSpot: [3.85, 0, -2.0, -0.4], wall: wall.scr, M: Mm };
  });
}

// ---------------- cinema auditorium: raked rows of red seats, the big screen (live canvas), projector beam ----------------
export function cinema(ctx) {
  return cached(ctx, 'cinema', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x030203);
    const W = 14, D = 16, Hh = 7;
    room(sc, { w: W, d: D, h: Hh, wall: wp('cinw', '#2a1014', '#220c10', [8, 2], 8, 3), floor: ptex('cinfloor', 16, 16, (g, w, h, R) => noiseFill(g, w, h, '#2a1418', 0.1, R), { repeat: [10, 10] }), ceil: '#0a0606', front: true });
    const scr = new P.Screen(960, 400, 1.15); const sm = new THREE.Mesh(new THREE.PlaneGeometry(10, 4.17), scr.mat); sm.position.set(0, 3.6, -D / 2 + 0.1); sm.userData.noSelf = true; sc.add(sm);
    add(sc, box(10.6, 4.7, 0.1, M('#0a0a0a')), 0, 3.6, -D / 2 + 0.02);
    const seatG = new THREE.Group(); sc.add(seatG); const red = M('#a8141e', 0.06);
    const geoSeat = new THREE.BoxGeometry(0.5, 0.45, 0.5), geoBack = new THREE.BoxGeometry(0.5, 0.6, 0.1);
    const n = 12 * 9; const im1 = new THREE.InstancedMesh(geoSeat, red, n), im2 = new THREE.InstancedMesh(geoBack, red, n); im1.castShadow = im2.castShadow = true; im1.receiveShadow = im2.receiveShadow = true;
    const m4 = new THREE.Matrix4(); let k = 0; const seats = [];
    for (let r = 0; r < 9; r++) for (let c = 0; c < 12; c++) { const x = -3.85 + c * 0.7, y = r * 0.22, z = -3 + r * 1.05; m4.makeTranslation(x, y + 0.22, z); im1.setMatrixAt(k, m4); m4.makeTranslation(x, y + 0.6, z + 0.25); im2.setMatrixAt(k, m4); seats.push([x, y + 0.45, z, Math.PI]); k++; }
    seatG.add(im1, im2);
    for (let r = 0; r < 9; r++) add(sc, box(W, r * 0.22 + 0.001, 1.05, M('#2a1418', 0.08), 'bottom'), 0, 0, -3 + r * 1.05);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(2.6, 15, 16, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 0.55, 0.7), transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); beam.rotation.x = -Math.PI / 2 + 0.06; beam.position.set(0, 4.2, 0.5); sc.add(beam);
    const scrL = new THREE.PointLight(0x9ab0ff, 6, 18, 1.2); scrL.position.set(0, 3.5, -D / 2 + 2); sc.add(scrL);
    sc.add(new THREE.HemisphereLight(0x5a4a6a, 0x200a0c, 0.8));
    for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), glow('#ffb070', 2.2)); s.position.set(i % 2 ? W / 2 - 0.05 : -W / 2 + 0.05, 2.4, -4 + (i >> 1) * 4); sc.add(s); }
    return { scene: sc, scr, seats, scrL, beam };
  });
}

// ---------------- kaiten bar: a conveyor loop of plated "experiences" ----------------
export function kaiten(ctx) {
  return cached(ctx, 'kaiten', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x0b0806); sc.fog = new THREE.Fog(0x0b0806, 7, 16);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), lam({ map: ptex('kfloor', 16, 16, (g, w, h, R) => noiseFill(g, w, h, '#2a1e16', 0.08, R), { repeat: [10, 10] }) })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; sc.add(fl);
    const wood = lam({ map: woodTex('kwood', '#b8875a', 32, 32, [4, 1], 3) });
    // loop: two straights along x at z=±0.55 + semicircle ends; belt top y=0.95
    const L = 6, r = 0.55; add(sc, box(L + 2 * r + 0.6, 0.9, 2 * r + 0.8, wood, 'bottom'), 0, 0, 0);
    const beltM = M('#d8d2c4', 0.04); add(sc, box(L, 0.04, 0.32, beltM, 'bottom'), 0, 0.9, r); add(sc, box(L, 0.04, 0.32, beltM, 'bottom'), 0, 0.9, -r);
    for (const s of [-1, 1]) { const ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.16, r + 0.16, 16, 1, s > 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI), beltM); ring.rotation.x = -Math.PI / 2; ring.position.set(s * L / 2, 0.945, 0); sc.add(ring); }
    const pathAt = (u) => { const per = 2 * L + 2 * Math.PI * r; let d = ((u % per) + per) % per; if (d < L) return [-L / 2 + d, r]; d -= L; if (d < Math.PI * r) { const a = d / r; return [L / 2 + Math.sin(a) * r, Math.cos(a) * r]; } d -= Math.PI * r; if (d < L) return [L / 2 - d, -r]; d -= L; const a = d / r; return [-L / 2 - Math.sin(a) * r, -Math.cos(a) * r]; };
    // plates carrying tiny experiences
    const plates = []; const kinds = ['moon', 'stage', 'sunset', 'ship', 'heart', 'globe', 'temple', 'cat'];
    for (let i = 0; i < 16; i++) { const p = new THREE.Group(); sc.add(p); add(p, cyl(0.13, 0.1, 0.03, 14, M(i % 2 ? '#e8e2d4' : '#c8262a', 0.03)), 0, 0.015, 0); const kd = kinds[i % kinds.length]; let o;
      if (kd === 'moon') { o = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 1), M('#d8d6d0', 0.12)); o.position.y = 0.1; }
      else if (kd === 'stage') { o = new THREE.Group(); add(o, box(0.18, 0.04, 0.1, M('#222')), 0, 0.05, 0); add(o, box(0.16, 0.08, 0.01, glow('#ff3b8b', 2)), 0, 0.11, -0.04); }
      else if (kd === 'sunset') { o = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), glow('#ff8a3a', 2.2)); o.position.y = 0.03; }
      else if (kd === 'ship') { const sh2 = Q.trireme({ len: 2 }); sh2.g.scale.setScalar(0.07); sh2.g.position.y = 0.05; o = sh2.g; }
      else if (kd === 'heart') { o = new THREE.Mesh(new THREE.OctahedronGeometry(0.07, 0), glow('#ff3b6b', 1.8)); o.position.y = 0.1; }
      else if (kd === 'globe') { o = new THREE.Mesh(new THREE.IcosahedronGeometry(0.075, 1), M('#2f7ac8', 0.1)); o.position.y = 0.1; }
      else if (kd === 'temple') { o = new THREE.Group(); for (let c = 0; c < 4; c++) add(o, cyl(0.012, 0.012, 0.12, 6, M('#e8e0cc')), -0.06 + c * 0.04, 0.09, 0); add(o, box(0.16, 0.02, 0.06, M('#e8e0cc')), 0, 0.16, 0); }
      else { const k2 = Q.cat(); k2.g.scale.setScalar(0.32); k2.pose({ sit: 1 }); o = k2.g; o.position.y = 0.03; }
      p.add(o); plates.push({ p, i, o }); }
    const lantern = (x) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.45, 10), glow('#ff5a2a', 1.6)); l.position.set(x, 2.3, -1.4); sc.add(l); const pl = new THREE.PointLight(0xff8a4a, 3, 5, 1.5); pl.position.set(x, 2.1, -1.0); sc.add(pl); };
    lantern(-2.5); lantern(0); lantern(2.5);
    const noren = textTex('noren', 256, 64, (g, w, h) => { g.fillStyle = '#1d2a4a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f3ecdd'; g.font = `800 40px ${JP}`; g.textAlign = 'center'; g.fillText('体験回転寿司', w / 2, 46); });
    const nm = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), lam({ map: noren, side: THREE.DoubleSide })); nm.position.set(0, 2.6, -2.4); sc.add(nm);
    sc.add(new THREE.HemisphereLight(0xffd8b0, 0x2a1a10, 0.7));
    const key = new THREE.DirectionalLight(0xffe0c0, 1.1); key.position.set(2, 6, 4); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); { const c = key.shadow.camera; c.left = -6; c.right = 6; c.top = 6; c.bottom = -6; c.near = 1; c.far = 20; } sc.add(key);
    function update(t, speed = 0.9) { for (const pl of plates) { const [x, z] = pathAt(pl.i * 1.0 + t * speed); pl.p.position.set(x, 0.94, z); pl.o.rotation.y = t * 0.6 + pl.i; } }
    update(0);
    return { scene: sc, update, plates, pathAt, seat: (x) => [x, 0.62, r + 0.95, Math.PI] };
  });
}

// ---------------- 1969 living room: wood panelling, shag rug, the family CRT ----------------
export function room69(ctx) {
  return cached(ctx, 'room69', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x0a0806);
    room(sc, { w: 7, d: 6, h: 2.7, wall: woodTex('panel69', '#7a5232', 32, 32, [7, 1], 6), floor: ptex('shag', 16, 16, (g, w, h, R) => noiseFill(g, w, h, '#c8822a', 0.16, R), { repeat: [8, 8] }), ceil: '#d8ccb0' });
    const tv = R3.crt60({ legs: true }); tv.g.position.set(0, 0, -2.4); sc.add(tv.g);
    const couch = new THREE.Group(); couch.position.set(0, 0, 1.2); couch.rotation.y = Math.PI; sc.add(couch); const cm = M('#5a7a3a', 0.08);
    add(couch, box(2.4, 0.42, 0.8, cm, 'bottom'), 0, 0, 0); add(couch, box(2.4, 0.5, 0.2, cm, 'bottom'), 0, 0.42, -0.32); for (const s of [-1, 1]) add(couch, box(0.22, 0.6, 0.8, cm, 'bottom'), s * 1.2, 0, 0);
    const lampG = P.lampFloor(true); lampG.position.set(-2.4, 0, 1.6); sc.add(lampG);
    const art = R3.poster('moonposter', 0.8, 1.0, (g, w, h) => { g.fillStyle = '#0a0a1a'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8e2d0'; g.beginPath(); g.arc(w / 2, h * 0.4, 30, 0, 7); g.fill(); g.font = `700 12px ${HEL}`; g.textAlign = 'center'; g.fillText('APOLLO', w / 2, h * 0.82); }); art.position.set(2.0, 1.6, -2.98); sc.add(art);
    sc.add(new THREE.HemisphereLight(0xffd8a8, 0x3a2a1a, 0.7));
    const key = new THREE.PointLight(0xffc880, 6, 7, 1.4); key.position.set(-2, 2.3, 1.5); key.castShadow = true; sc.add(key);
    sh(couch);
    return { scene: sc, tv, couchSeat: (k) => [-0.7 + k * 0.7, 0.45, 1.25, Math.PI] };
  });
}

// ---------------- studio executive office: Hollywood sign through the window, pitch screen, long table ----------------
export function execOffice(ctx) {
  return cached(ctx, 'exec', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x05060c);
    const W = 10, D = 8, Hh = 3.3;
    room(sc, { w: W, d: D, h: Hh, back: false, wall: wp('execw', '#d8d0c0', null, [5, 2]), floor: ptex('execcarpet', 16, 16, (g, w, h, R) => noiseFill(g, w, h, '#3a3440', 0.06, R), { repeat: [10, 8] }), ceil: '#e8e4dc', front: true });
    const view = ptex('execview', 256, 96, (g, w, h, R) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ff9a6a'); gr.addColorStop(0.55, '#ffd2a0'); gr.addColorStop(1, '#c88a6a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#7a5a4a'; g.beginPath(); g.moveTo(0, 60); for (let x = 0; x <= w; x += 8) g.lineTo(x, 46 + Math.sin(x * 0.04) * 10 + Math.sin(x * 0.11) * 4); g.lineTo(w, h); g.lineTo(0, h); g.fill();
      g.fillStyle = '#f4f0e8'; g.font = `800 15px ${HEL}`; g.fillText('HOLLYWOOD', 92, 50);
      for (let x = 0; x < w;) { const bw = 6 + R() * 12 | 0, bh = 6 + R() * 18 | 0; g.fillStyle = '#3a2a2a'; g.fillRect(x, h - bh, bw, bh); x += bw + 1; } });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(W, Hh), basic({ map: view, color: new THREE.Color(1.3, 1.25, 1.2) })); win.position.set(0, Hh / 2, -D / 2 - 0.3); sc.add(win);
    for (let x = -W / 2; x <= W / 2; x += 2.5) add(sc, box(0.08, Hh, 0.08, M('#1a1a1a')), x, Hh / 2, -D / 2);
    const tbl = new THREE.Group(); tbl.position.set(0, 0, 0.2); sc.add(tbl);
    add(tbl, box(1.6, 0.06, 4.8, phong({ color: 0x1a1210, spec: 0x664433, shin: 40 }), 'bottom'), 0, 0.74, 0); add(tbl, box(0.5, 0.72, 4.0, M('#120c0a'), 'bottom'), 0, 0, 0);
    const chairs = []; for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { const c = new THREE.Group(); c.position.set(sx * 1.15, 0, -1.4 + i * 1.4); c.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2; sc.add(c); add(c, box(0.55, 0.1, 0.55, M('#111'), 'bottom'), 0, 0.42, 0); add(c, box(0.55, 0.7, 0.1, M('#111'), 'bottom'), 0, 0.48, -0.25); add(c, cyl(0.03, 0.03, 0.42, 6, M('#444')), 0, 0, 0); chairs.push([sx * 1.15, 0.5, -1.4 + i * 1.4, sx > 0 ? -Math.PI / 2 : Math.PI / 2]); }
    // pitch screen at the head of the table (front, +z end) facing -z
    const pitch = new P.Screen(768, 432, 1.25); const pm = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.69), pitch.mat); pm.position.set(0, 1.75, 3.9); pm.rotation.y = Math.PI; pm.userData.noSelf = true; sc.add(pm);
    // awards shelf + a gold statuette
    for (let i = 0; i < 3; i++) { const st = new THREE.Group(); st.position.set(-4.6, 1.2, -1 + i * 0.6); sc.add(st); add(st, cyl(0.06, 0.07, 0.08, 8, M('#111')), 0, 0, 0); const fig = soft(0.3, [0.05, 0.05], [0.04, 0.04], phong({ color: 0xe8b83a, spec: 0xfff0b0, shin: 90 }), { pivot: 'bottom', seg: 8, rings: 5, capT: 0.3, prof: s => [1 - 0.5 * Math.sin(Math.PI * s * 0.8), 1] }); fig.position.y = 0.04; st.add(fig); }
    add(sc, box(0.3, 0.04, 2.2, M('#3a2a20'), 'bottom'), -4.65, 1.16, -0.4);
    sc.add(new THREE.HemisphereLight(0xffe8d0, 0x3a2a30, 0.8));
    const sun = new THREE.DirectionalLight(0xffb87a, 1.6); sun.position.set(-3, 4, -10); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); { const c = sun.shadow.camera; c.left = -7; c.right = 7; c.top = 7; c.bottom = -7; c.near = 1; c.far = 30; } sc.add(sun);
    const lamp = new THREE.PointLight(0xffd7a0, 6, 8, 1.4); lamp.position.set(0, 2.9, 0.5); sc.add(lamp);
    sh(tbl);
    return { scene: sc, chairs, pitch, headSpot: [0, 0, 3.0, Math.PI] };
  });
}

// ---------------- bookshelf wall of Odyssey editions ----------------
export function odysseyShelf(ctx) {
  return cached(ctx, 'odyshelf', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x0c0806);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), M('#2a1a10', 0.06)); back.position.set(0, 2.5, -0.35); sc.add(back);
    const tr = ['FAGLES', 'WILSON', 'LATTIMORE', 'FITZGERALD', 'POPE', 'BUTLER', 'LOMBARDO', 'RIEU', 'CHAPMAN', 'MANDELBAUM', 'GREEN', 'MERRILL', 'VERITY', 'COWPER', 'MURRAY', 'SHAW', 'PALMER', 'COOK'];
    const cols = ['#7a1a1a', '#1d3b52', '#2a4a2a', '#c8a050', '#1a1a1a', '#e8e0cc', '#5a2a4a', '#8a4a20', '#20304a', '#a6d7e6', '#c8242c', '#f3eee2'];
    const R = rng(21); let k = 0;
    for (let row = 0; row < 5; row++) { add(sc, box(13, 0.05, 0.4, M('#4a3020', 0.06), 'bottom'), 0, row * 0.95, -0.15); let x = -6.3;
      while (x < 6.2) { const w = 0.08 + R() * 0.07, h = 0.62 + R() * 0.24; const col = cols[(R() * cols.length) | 0]; const name = tr[k++ % tr.length];
        const spine = textTex('spine:' + name + col + (k % 3), 32, 192, (g, W, H) => { g.fillStyle = col; g.fillRect(0, 0, W, H); const fg = /e8|f3|a6/.test(col) ? '#16110f' : '#f0e8da'; g.fillStyle = fg; g.fillRect(0, 10, W, 2); g.fillRect(0, H - 14, W, 2); g.save(); g.translate(W / 2 + 5, H / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.font = `700 13px ${TIMES}`; g.fillText('THE ODYSSEY', 0, -2); g.font = `400 9px ${TIMES}`; g.fillText('HOMER · ' + name, 0, 9); g.restore(); });
        const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.3), [M(col), M(col), M(col), M('#e8e0cc'), lam({ map: spine }), M(col)]); b.position.set(x + w / 2, row * 0.95 + 0.05 + h / 2, 0); b.rotation.z = (R() < 0.08 ? (R() - 0.5) * 0.3 : 0); b.castShadow = true; sc.add(b); x += w + 0.004; } }
    sc.add(new THREE.HemisphereLight(0xffe0b0, 0x2a1a10, 0.6));
    const key = new THREE.SpotLight(0xffd8a0, 30, 14, 0.7, 0.6, 1.2); key.position.set(2, 4, 4); key.target.position.set(0, 2, 0); key.castShadow = true; sc.add(key); sc.add(key.target);
    return { scene: sc };
  });
}

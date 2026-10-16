// FOR RESEARCH PURPOSES sets (cached per film). Each returns { scene, ...anchors }.
import * as THREE from 'three';
import { box, lam, basic, cmat, at, cyl, taper } from './kit.js';
import { ptex, shade, noiseFill, textTex } from './tex.js';
import { skyDome, stars, moon, lights, voxelTerrain, grassMats, water, tree, bush, ground } from './env.js';
import * as P from './props.js';
import * as Q from './props2.js';
import * as R3 from './props3.js';
import { glow, add, woodTex } from './props3.js';
import { carGeneric, tunerKit } from './cars2.js';
export { carGeneric, tunerKit };
import { fbm2, rng, clamp, hash2 } from '../core.js';
import { C, TIMES, UI, MONO } from '../ov/overlay.js';

const _CACHE = new Map();
export function cached(ctx, key, fn) { const c = (ctx && ctx.cache) || _CACHE; if (!c.has(key)) c.set(key, fn()); return c.get(key); }
const sh = g => { g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
export function room(sc, { w, d, h, wall, floor, ceil = '#cfc8bc', back = true, front = false, left = true, right = true, wallRep = [4, 2], floorRep = [6, 6] }) {
  const fm = lam({ map: floor }); const wm = lam({ map: wall });
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), fm); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; sc.add(fl);
  const ce = new THREE.Mesh(new THREE.PlaneGeometry(w, d), cmat(ceil, 0.03)); ce.rotation.x = Math.PI / 2; ce.position.y = h; sc.add(ce);
  const walls = { ceil: ce };
  const wallM = (W, x, z, ry, k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(W, h), wm); m.position.set(x, h / 2, z); m.rotation.y = ry; m.receiveShadow = true; sc.add(m); walls[k] = m; return m; };
  if (back) wallM(w, 0, -d / 2, 0, 'back'); if (front) wallM(w, 0, d / 2, Math.PI, 'front');
  if (left) wallM(d, -w / 2, 0, Math.PI / 2, 'left'); if (right) wallM(d, w / 2, 0, -Math.PI / 2, 'right');
  return walls;
}
const wallpaper = (key, base, stripe, rep) => ptex('wp:' + key, 32, 32, (g, w, h, R) => { noiseFill(g, w, h, base, 0.03, R); for (let x = 0; x < w; x += 8) { g.fillStyle = stripe; g.fillRect(x, 0, 2, h); } }, { repeat: rep });
const planks = (key, base, rep) => ptex('pl:' + key, 32, 32, (g, w, h, R) => { noiseFill(g, w, h, base, 0.04, R); for (let y = 0; y < h; y += 8) { g.fillStyle = shade(base, 0.72); g.fillRect(0, y, w, 1); const x = (y * 7) % w; g.fillRect(x, y, 1, 8); } }, { repeat: rep });

// ---------------- JAX'S BEDROOM, 2 AM (phone glow, alarm clock, posters, night window) ----------------
export function jaxRoom(ctx, variant = 'jax') {
  return cached(ctx, 'room:' + variant, () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x05060c);
    const isTop = variant === 'top';
    room(sc, { w: 5, d: 5, h: 2.8, wall: wallpaper(variant, isTop ? '#3a2a2a' : '#2f3a5a', isTop ? '#332424' : '#2a3452', [4, 2]), floor: planks(variant, '#5a4030', [5, 5]), ceil: '#22242e' });
    const bed = P.bed(); bed.position.set(-1.2, 0, -1.2); bed.rotation.y = Math.PI / 2; sc.add(bed);
    const ns = P.table(0.45, 0.4, 0.55, '#3a2a20'); ns.position.set(-1.9, 0, 0.1); sc.add(ns);
    const clock = R3.alarmClock(); clock.g.position.set(-1.9, 0.55, 0.12); clock.g.rotation.y = Math.PI / 2 - 0.3; sc.add(clock.g);
    const lampT = R3.mug('#d8d2c0'); lampT.position.set(-1.95, 0.55, 0.28); sc.add(lampT);
    // posters
    if (!isTop) {
      const st = R3.poster('strokesposter', 0.8, 1.1, (g, W, H) => { g.fillStyle = '#16110f'; g.fillRect(0, 0, W, H); g.fillStyle = '#f3ecdd'; g.font = `italic 700 26px ${TIMES}`; g.textAlign = 'center'; g.fillText('The', W / 2, 60); g.font = `700 34px ${TIMES}`; g.fillText('STROKES', W / 2, 96); g.fillStyle = '#d8262f'; g.fillRect(20, 120, W - 40, 4); g.fillStyle = '#f3ecdd'; g.font = `700 12px ${TIMES}`; g.fillText('REALITY AWAITS', W / 2, 150); });
      st.position.set(0.4, 1.6, -2.49); sc.add(st);
      const p2 = R3.poster('filmposter', 0.6, 0.85, (g, W, H) => { g.fillStyle = '#2747c9'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffe04a'; g.beginPath(); g.arc(W / 2, 70, 34, 0, 7); g.fill(); g.fillStyle = '#f3ecdd'; g.font = `700 18px ${TIMES}`; g.textAlign = 'center'; g.fillText('NIGHT DRIVE', W / 2, 150); });
      p2.position.set(1.4, 1.55, -2.49); sc.add(p2);
    } else {
      const gr = R3.poster('topgraf', 1.4, 0.8, (g, W, H) => { g.fillStyle = '#e8e2d4'; g.fillRect(0, 0, W, H); g.fillStyle = '#d8262f'; g.font = `700 40px ${TIMES}`; g.textAlign = 'center'; g.fillText('TIDAK MAU', W / 2, 80); }, [256, 140]);
      gr.position.set(0.4, 1.6, -2.49); sc.add(gr);
    }
    // window: city at night + moon
    const sky = ptex('roomsky' + variant, 64, 48, (g, w, h, R) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#060818'); gr.addColorStop(1, '#1c2450'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let x = 0; x < w;) { const bw = 4 + R() * 8 | 0, bh = 8 + R() * 22 | 0; g.fillStyle = '#080a14'; g.fillRect(x, h - bh, bw, bh); for (let y = h - bh + 2; y < h - 1; y += 3) for (let xx = x + 1; xx < x + bw - 1; xx += 2) if (R() > 0.7) { g.fillStyle = '#ffd27a'; g.fillRect(xx, y, 1, 1); } x += bw + 1; } g.fillStyle = '#f4f1dc'; g.beginPath(); g.arc(48, 10, 4, 0, 7); g.fill(); });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.0), new THREE.MeshBasicMaterial({ map: sky, color: new THREE.Color(1.2, 1.2, 1.3) })); win.position.set(2.49, 1.6, -0.6); win.rotation.y = -Math.PI / 2; sc.add(win);
    for (const [dy, dz, w, h] of [[0, 0, 0.06, 1.1], [0, 0, 1.4, 0.06]]) { const f = box(0.06, h, w, cmat('#d8d4c8'), 'center'); f.position.set(2.47, 1.6 + dy, -0.6 + dz); sc.add(f); }
    // light: moon key through the window + phone glow (moved by shots) + dim fill
    const moonL = new THREE.DirectionalLight(0x8aa4ff, 0.9); moonL.position.set(6, 4, -1.5); moonL.castShadow = true; moonL.shadow.mapSize.set(1024, 1024); const c = moonL.shadow.camera; c.left = -4; c.right = 4; c.top = 4; c.bottom = -4; sc.add(moonL);
    const phoneL = new THREE.PointLight(0x9ad0ff, 3.0, 2.2, 1.6); phoneL.position.set(-1.2, 0.9, -0.5); sc.add(phoneL);
    sc.add(new THREE.HemisphereLight(0x3a4a7a, 0x181418, 0.55));
    const phone = R3.phone3d(); sc.add(phone.g);
    return { scene: sc, bed, clock, phone, phoneL, moonL };
  });
}

// ---------------- COURTROOM (the trial of liking things) ----------------
export function courtroom(ctx) {
  return cached(ctx, 'court', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x0b0806);
    const wood = woodTex('courtwall', '#6a4426', 32, 32, [6, 2], 4);
    const walls = room(sc, { w: 12, d: 14, h: 5.2, wall: ptex('courtwall2', 32, 32, (g, w, h, R) => { noiseFill(g, w, h, '#d9ccb0', 0.03, R); g.fillStyle = '#cbbd9e'; g.fillRect(0, 0, w, 2); }, { repeat: [6, 3] }), floor: ptex('courtfloor', 32, 32, (g, w, h, R) => { noiseFill(g, w, h, '#4a2a1a', 0.05, R); for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 8) { g.fillStyle = ((x + y) / 8) % 2 ? '#3e2316' : '#55301e'; g.fillRect(x, y, 8, 8); } }, { repeat: [8, 9] }), ceil: '#e6dcc6' });
    // wood wainscot around
    const wain = []; for (const [x, z, ry, len] of [[0, -6.98, 0, 12], [-5.98, 0, Math.PI / 2, 14], [5.98, 0, -Math.PI / 2, 14]]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(len, 1.6), lam({ map: wood })); p.position.set(x, 0.8, z); p.rotation.y = ry; sc.add(p); wain.push(p); }
    const W = lam({ map: woodTex('courtbench', '#5a361c', 32, 32, null, 4) }), Wd = cmat('#3e2412', 0.05);
    // judge's bench (raised) at the back
    const bench = new THREE.Group(); bench.position.set(0, 0, -5.4); sc.add(bench);
    add(bench, box(4.2, 1.0, 1.6, Wd, 'bottom'), 0, 0, 0.2); add(bench, box(4.4, 1.5, 0.3, W, 'bottom'), 0, 0, 1.0); add(bench, box(4.6, 0.08, 0.5, Wd, 'bottom'), 0, 1.5, 0.95);
    const seal = R3.poster('seal', 1.1, 1.1, (g, Wd2, H) => { g.fillStyle = '#d4a63a'; g.beginPath(); g.arc(Wd2 / 2, H / 2, Wd2 / 2 - 4, 0, 7); g.fill(); g.fillStyle = '#16110f'; g.beginPath(); g.arc(Wd2 / 2, H / 2, Wd2 / 2 - 18, 0, 7); g.fill(); g.fillStyle = '#d4a63a'; g.font = `700 15px ${TIMES}`; g.textAlign = 'center'; g.fillText('COURT OF', Wd2 / 2, H / 2 - 18); g.fillText('PUBLIC', Wd2 / 2, H / 2 + 4); g.fillText('OPINION', Wd2 / 2, H / 2 + 26); }, [128, 128]);
    seal.position.set(0, 3.6, -6.95); sc.add(seal);
    for (const s of [-1, 1]) { const fl = new THREE.Group(); fl.position.set(s * 3.2, 0, -6.3); sc.add(fl); add(fl, cyl(0.03, 0.03, 2.6, 6, cmat('#c9a24a')), 0, 1.3, 0); const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.1), lam({ color: new THREE.Color(s < 0 ? '#2747c9' : '#d8262f'), side: THREE.DoubleSide })); flag.position.set(0.42, 2.0, 0); fl.add(flag); }
    const gavel = R3.gavel(); gavel.position.set(0.6, 1.62, -4.5); gavel.rotation.y = 0.4; sc.add(gavel);
    const block = cyl(0.1, 0.1, 0.04, 10, Wd); block.position.set(0.35, 1.6, -4.45); sc.add(block);
    // witness stand (left) and defendant + prosecution tables
    const stand = new THREE.Group(); stand.position.set(-3.0, 0, -3.6); sc.add(stand); add(stand, box(1.4, 1.1, 1.1, W, 'bottom')); add(stand, box(1.5, 0.06, 1.2, Wd, 'bottom'), 0, 1.1, 0);
    const tables = []; for (const [x, label] of [[-1.7, 'DEFENDANT'], [1.7, 'PROSECUTION']]) { const tb = R3.add(sc, new THREE.Group(), x, 0, -0.6); add(tb, box(2.2, 0.06, 0.9, Wd, 'bottom'), 0, 0.76, 0); add(tb, box(2.1, 0.7, 0.06, W, 'bottom'), 0, 0.05, 0.42); const np = R3.nameplate(label, 0.55); np.position.set(0, 0.86, 0.3); np.rotation.x = -0.4; tb.add(np); tables.push(tb); }
    const chairs = []; for (const x of [-2.1, -1.3, 1.3, 2.1]) { const ch = new THREE.Group(); ch.position.set(x, 0, 0.2); sc.add(ch); add(ch, box(0.5, 0.06, 0.5, Wd, 'bottom'), 0, 0.46, 0); add(ch, box(0.5, 0.65, 0.06, Wd, 'bottom'), 0, 0.5, 0.24); add(ch, box(0.06, 0.46, 0.06, Wd, 'bottom')); chairs.push(ch); }
    // rail + gallery benches + jury box (right)
    add(sc, box(10, 0.9, 0.08, W, 'bottom'), 0, 0, 1.4);
    for (let r = 0; r < 4; r++) for (const s of [-1, 1]) { const b = new THREE.Group(); b.position.set(s * 3, 0, 2.6 + r * 1.2); sc.add(b); add(b, box(4.2, 0.08, 0.5, Wd, 'bottom'), 0, 0.45, 0); add(b, box(4.2, 0.7, 0.08, W, 'bottom'), 0, 0.45, 0.25); }
    const jury = new THREE.Group(); jury.position.set(4.6, 0, -2.4); jury.rotation.y = -Math.PI / 2; sc.add(jury); add(jury, box(3.6, 0.9, 1.6, W, 'bottom')); add(jury, box(3.6, 0.5, 0.06, Wd, 'bottom'), 0, 0.9, 0.8);
    // evidence screen on an easel
    const ev = new P.Screen(512, 384, 1.25); const evg = new THREE.Group(); evg.position.set(3.4, 0, -4.0); evg.rotation.y = -0.6; sc.add(evg);
    add(evg, box(1.7, 1.3, 0.06, cmat('#222'), 'bottom'), 0, 1.0, 0); const em = add(evg, new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), ev.mat), 0, 1.65, 0.035); em.userData.noSelf = true;
    for (const s of [-1, 1]) add(evg, box(0.05, 1.05, 0.05, cmat('#333'), 'bottom'), s * 0.6, 0, -0.1, 0.1);
    // lights: warm high windows + key
    lights(sc, { hemiSky: 0xfff0d8, hemiGround: 0x4a3020, hemi: 0.9, sun: 0xffe2b8, sunI: 1.5, sunPos: [-6, 10, 6], area: 9 });
    const pend = []; for (const x of [-3, 0, 3]) for (const z of [-3, 2]) { const L = new THREE.Group(); L.position.set(x, 4.6, z); sc.add(L); add(L, cyl(0.01, 0.01, 1.2, 4, cmat('#222')), 0, 0.6, 0); add(L, new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), glow('#ffe4b0', 2.2))); pend.push(L); }
    return { scene: sc, bench, stand, tables, chairs, gavel, block, ev, evg, jury, pend, walls, wain, seal, sky: null,
      anchor: { judge: [0, 0, -5.55, 0], witness: [-3.0, 0, -3.75, 0.5], defendant: [-1.7, 0, -0.1, Math.PI], prosecutor: [1.7, 0, -0.1, Math.PI] } };
  });
}

// ---------------- ARCHAEOLOGICAL DIG (that's archaeology) ----------------
export function digSite(ctx) {
  return cached(ctx, 'dig', () => {
    const sc = new THREE.Scene(); sc.fog = new THREE.Fog(0xf2dcb0, 30, 120);
    sc.add(skyDome('#7fb6e0', '#f0d9a8', '#f6e6c0'));
    lights(sc, { hemiSky: 0xfff0d0, hemiGround: 0xa07a4a, hemi: 1.15, sun: 0xfff0c8, sunI: 2.2, sunPos: [8, 14, 5], area: 9 });
    const sand = ptex('sandtop', 16, 16, (g, w, h, R) => { noiseFill(g, w, h, '#d8b47a', 0.08, R); for (let i = 0; i < 10; i++) { g.fillStyle = '#c49a5e'; g.fillRect(R() * w | 0, R() * h | 0, 1, 1); } });
    const strata = ptex('strata', 16, 16, (g, w, h, R) => { const cols = ['#c49a5e', '#a87c48', '#8e6638', '#b48a54', '#7a5430']; for (let y = 0; y < h; y++) { g.fillStyle = cols[Math.floor(y / 3.2) % 5]; g.fillRect(0, y, w, 1); } for (let i = 0; i < 14; i++) { g.fillStyle = '#e8dcc0'; g.fillRect(R() * w | 0, R() * h | 0, 1, 1); } });
    const L = m => lam({ map: m, flat: true }); const mats = [L(strata), L(strata), L(sand), L(strata), L(strata), L(strata)];
    // a 6x4 m pit 2 m deep in a flat desert
    sc.add(R3.add(new THREE.Group(), voxelTerrain({ x0: -30, x1: 30, z0: -30, z1: 20, height: (x, z) => (Math.abs(x) < 3 && Math.abs(z + 1) < 2 ? -1.2 : 0), mats, depth: 3 })));
    // grid strings + tools + the find (a phone with a 2018 photo)
    const pegs = new THREE.Group(); sc.add(pegs); for (let i = -3; i <= 3; i++) { add(pegs, box(0.04, 0.4, 0.04, cmat('#7a5a3a'), 'bottom'), i, 0, -3.05); add(pegs, box(0.02, 0.01, 4, cmat('#f2f0ea')), i, 0.32, -1.0); }
    for (let j = -3; j <= 1; j++) add(pegs, box(6, 0.01, 0.02, cmat('#f2f0ea')), 0, 0.32, j);
    const find = R3.phone3d([180, 380]); find.g.position.set(0.4, -1.18, -0.6); find.g.rotation.set(-Math.PI / 2, 0, 0.4); sc.add(find.g);
    const brush = new THREE.Group(); add(brush, box(0.03, 0.18, 0.02, cmat('#a0703a'), 'bottom')); add(brush, box(0.05, 0.06, 0.03, cmat('#2a2a2a'), 'top'), 0, 0.0, 0); sc.add(brush);
    const tent = new THREE.Group(); tent.position.set(-6, 0, -6); sc.add(tent); add(tent, new THREE.Mesh(new THREE.ConeGeometry(2.4, 2.4, 4), cmat('#e8dcc0', 0.03)), 0, 1.2, 0, 0, Math.PI / 4);
    const sign = P.sign('SITE 17', 1.0, 0.45, '#ffe04a', '#16110f'); sign.position.set(3.6, 0, -3.4); sc.add(sign);
    return { scene: sc, find, brush };
  });
}

// ---------------- an empty HR OFFICE (dust, cobweb, nameplate) ----------------
export function hrOffice(ctx) {
  return cached(ctx, 'hr', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x101010);
    room(sc, { w: 5, d: 5, h: 2.8, wall: wallpaper('hr', '#b8b4a6', '#aaa698', [4, 2]), floor: ptex('hrcarpet', 16, 16, (g, w, h, R) => noiseFill(g, w, h, '#5a5f66', 0.08, R), { repeat: [6, 6] }), ceil: '#d8d6cc' });
    const desk = P.table(1.6, 0.8, 0.76, '#7a6a52'); desk.position.set(0, 0, -1.2); sc.add(desk);
    const np = R3.nameplate('HUMAN RESOURCES', 0.6, '#16110f', '#f3ecdd'); np.position.set(0, 0.86, -0.85); np.rotation.x = -0.3; sc.add(np);
    const chair = new THREE.Group(); chair.position.set(0, 0, -1.9); sc.add(chair); add(chair, box(0.55, 0.08, 0.55, cmat('#222'), 'bottom'), 0, 0.45, 0); add(chair, box(0.55, 0.75, 0.08, cmat('#222'), 'bottom'), 0, 0.5, -0.25); add(chair, box(0.06, 0.45, 0.06, cmat('#444'), 'bottom'));
    const web = R3.poster('cobweb', 0.9, 0.9, (g, W, H) => { g.clearRect(0, 0, W, H); g.strokeStyle = 'rgba(240,240,240,0.8)'; g.lineWidth = 1; for (let a = 0; a < 7; a++) { g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a * 0.24) * W * 1.4, Math.sin(a * 0.24) * H * 1.4); g.stroke(); } for (let r = 20; r < W * 1.3; r += 18) { g.beginPath(); g.arc(0, 0, r, 0, Math.PI / 2); g.stroke(); } }, [128, 128]);
    web.material.transparent = true; web.position.set(-0.6, 1.3, -0.82); sc.add(web);
    const door = R3.poster('hrdoor', 0.9, 2.0, (g, W, H) => { g.fillStyle = '#c8b898'; g.fillRect(0, 0, W, H); g.fillStyle = '#16110f'; g.fillRect(14, 30, W - 28, 30); g.fillStyle = '#f3ecdd'; g.font = `700 20px ${TIMES}`; g.textAlign = 'center'; g.fillText('HR', W / 2, 52); g.fillStyle = '#d8262f'; g.font = `700 13px ${TIMES}`; g.fillText('POSITION VACANT', W / 2, 90); }, [128, 280]);
    door.position.set(2.49, 1.0, 0.6); door.rotation.y = -Math.PI / 2; sc.add(door);
    lights(sc, { hemiSky: 0xf0f4ff, hemiGround: 0x404040, hemi: 0.8, sun: 0xfff6e8, sunI: 1.0, sunPos: [2, 6, 4], area: 4 });
    return { scene: sc };
  });
}

// ---------------- THEATER: red seats, a proscenium stage, one spotlight (only the audience changed) ----------------
export function theater(ctx) {
  return cached(ctx, 'theater', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x050304); sc.fog = new THREE.Fog(0x0a0506, 14, 40);
    const fl = ground('theaterfloor', '#2a1612', 60, 30, 0.06); sc.add(fl);
    const stg = box(12, 1.0, 5, [cmat('#1a0e0a'), cmat('#1a0e0a'), lam({ map: woodTex('stagewood', '#6a4426', 32, 32, [6, 3], 4) }), cmat('#1a0e0a'), cmat('#2a1a10'), cmat('#1a0e0a')], 'bottom'); stg.position.set(0, 0, -4.5); sc.add(stg);
    const cur = ptex('curtain', 32, 32, (g, w, h, R) => { for (let x = 0; x < w; x++) { g.fillStyle = shade('#8a1218', x % 4 < 2 ? 0.75 : 1.1); g.fillRect(x, 0, 1, h); } g.fillStyle = '#d4a63a'; g.fillRect(0, h - 3, w, 2); }, { repeat: [4, 1] });
    for (const sx of [-1, 1]) { const c = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 7), lam({ map: cur, side: THREE.DoubleSide })); c.position.set(sx * 5.0, 4.5, -2.2); sc.add(c); }
    const val = new THREE.Mesh(new THREE.PlaneGeometry(13, 1.4), lam({ map: cur })); val.position.set(0, 7.3, -2.2); sc.add(val);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), cmat('#0c0606', 0.03)); back.position.set(0, 4, -7); sc.add(back);
    // seats: instanced red chairs
    const seatG = new THREE.BoxGeometry(0.5, 0.45, 0.5), backG = new THREE.BoxGeometry(0.5, 0.6, 0.1);
    const pos = []; for (let r = 0; r < 9; r++) for (let i = -8; i <= 8; i++) { if (i === 0) continue; pos.push([i * 0.62 + (r % 2) * 0.1, r * 0.18, 0.8 + r * 0.95]); }
    const seats = new THREE.InstancedMesh(seatG, cmat('#9a1a20', 0.08), pos.length), backs = new THREE.InstancedMesh(backG, cmat('#7a1218', 0.08), pos.length);
    const m4 = new THREE.Matrix4(); pos.forEach(([x, y, z], i) => { m4.makeTranslation(x, y + 0.22, z); seats.setMatrixAt(i, m4); m4.makeTranslation(x, y + 0.6, z + 0.25); backs.setMatrixAt(i, m4); });
    for (const m of [seats, backs]) { m.castShadow = true; m.receiveShadow = true; sc.add(m); }
    for (let r = 0; r < 9; r++) { const riser = box(12, r * 0.18 + 0.001, 0.95, cmat('#1e0f0c'), 'bottom'); riser.position.set(0, 0, 0.8 + r * 0.95); sc.add(riser); }
    const spot = new THREE.SpotLight(0xfff2dc, 120, 30, 0.22, 0.5, 1.2); spot.position.set(0, 10, 6); spot.target.position.set(0, 1, -4.5); spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); sc.add(spot, spot.target);
    const house = new THREE.PointLight(0xffb070, 6, 20, 1.5); house.position.set(0, 5, 6); sc.add(house);
    sc.add(new THREE.HemisphereLight(0x3a2a2a, 0x0a0505, 0.35));
    return { scene: sc, spot, house, stageY: 1.0, seatAt: (row, i) => [i * 0.62 + (row % 2) * 0.1, row * 0.18 + 0.47, 0.8 + row * 0.95 - 0.04, Math.PI] };
  });
}
// ---------------- UNDERGROUND cutaway: strata wall with a shaft (the car sinks) ----------------
export function cutaway(ctx) {
  return cached(ctx, 'cutaway', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x9ccbe6);
    sc.add(skyDome('#7ab8e2', '#b8dcef', '#e6f2f6'));
    const strata = ptex('strata3', 32, 64, (g, w, h, R) => { const bands = [['#5fa53d', 3], ['#7a5634', 7], ['#9a6e44', 9], ['#6a4a2e', 6], ['#b48a54', 8], ['#5a4030', 10], ['#8a8a8a', 7], ['#4a3a30', 14]]; let y = 0; for (const [c, n] of bands) { for (let yy = y; yy < Math.min(h, y + n); yy++) for (let x = 0; x < w; x++) { g.fillStyle = shade(c, 0.94 + R() * 0.1); g.fillRect(x, yy, 1, 1); } y += n; } for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(230,220,200,0.6)'; g.fillRect(R() * w | 0, 12 + R() * (h - 12) | 0, 2, 1); } });
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 16), lam({ map: strata })); wall.position.set(0, -8, -1.4); sc.add(wall);
    const top = ground('cutgrass', '#5fa53d', 30, 15, 0.1); top.position.set(0, 0, -16.4); sc.add(top);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(30, 3.2), cmat('#55575c', 0.08)); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, 0.2); sc.add(road);
    const hole = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 16), cmat('#2a1e16', 0.05)); hole.position.set(0, -8, -1.39); sc.add(hole);
    for (const s of [-1, 1]) { const e = box(0.12, 16, 0.2, cmat('#3a2a1e'), 'center'); e.position.set(s * 2.36, -8, -1.3); sc.add(e); }
    lights(sc, { hemiSky: 0xcfeaff, hemiGround: 0x6a5a40, hemi: 1.1, sun: 0xfff0d6, sunI: 1.8, sunPos: [6, 12, 10], area: 12 });
    const lamp = new THREE.PointLight(0xffc888, 0, 8, 1.5); lamp.position.set(0, -3, 2); sc.add(lamp);
    return { scene: sc, lamp };
  });
}

// ---------------- PODCAST STUDIO (dark wood, red-amber backlight, two boom mics, the 60s console CRT) ----------------
export function studio(ctx) {
  return cached(ctx, 'studio', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x060404);
    const slat = ptex('slats', 32, 32, (g, w, h, R) => { noiseFill(g, w, h, '#2a1d16', 0.05, R); for (let x = 0; x < w; x += 4) { g.fillStyle = '#1a120e'; g.fillRect(x, 0, 1, h); g.fillStyle = '#352519'; g.fillRect(x + 1, 0, 1, h); } }, { repeat: [10, 2] });
    room(sc, { w: 10, d: 8, h: 3.4, wall: slat, floor: ptex('studiofloor', 32, 32, (g, w, h, R) => { noiseFill(g, w, h, '#2a2220', 0.05, R); }, { repeat: [8, 8] }), ceil: '#0e0b0a' });
    // backlit gradient panel behind the host (the signature warm red glow)
    const bl = ptex('backlit', 64, 32, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h * 0.65, 2, w / 2, h * 0.6, w * 0.6); gr.addColorStop(0, '#ff8a3a'); gr.addColorStop(0.45, '#c8262a'); gr.addColorStop(1, '#2a0606'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, { linear: true });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2.6), new THREE.MeshBasicMaterial({ map: bl, color: new THREE.Color(1.15, 1.0, 1.0) })); panel.position.set(0, 1.75, -3.98); sc.add(panel);
    for (const sx of [-1, 1]) { const pil = box(0.22, 3.4, 0.22, cmat('#140d0a'), 'bottom'); pil.position.set(sx * 3.3, 0, -3.88); sc.add(pil); }
    // neon ON AIR + shelf with odd decor
    const onAirT = textTex('onair', 256, 80, (c, W, H) => { c.clearRect(0, 0, W, H); c.strokeStyle = '#ff3a2a'; c.lineWidth = 5; c.strokeRect(6, 6, W - 12, H - 12); c.fillStyle = '#ff5a3a'; c.font = `700 52px ${TIMES}`; c.textAlign = 'center'; c.fillText('ON AIR', W / 2, 60); });
    const onAirM = new THREE.MeshBasicMaterial({ map: onAirT, transparent: true, color: new THREE.Color(0.25, 0.25, 0.25), toneMapped: false });
    const onAir = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.4), onAirM); onAir.position.set(-2.1, 2.85, -3.95); sc.add(onAir);
    const shelf = new THREE.Group(); shelf.position.set(3.2, 0, -2.2); shelf.rotation.y = -Math.PI / 2; sc.add(shelf);
    for (const y of [0.9, 1.5, 2.1]) add(shelf, box(1.8, 0.05, 0.35, cmat('#3a2618'), 'bottom'), 0, y, 0);
    const bone = cmat('#e6dcc4', 0.05);
    for (let i = 0; i < 3; i++) { const sk = new THREE.Group(); add(shelf, sk, -0.6 + i * 0.6, 0.95 + i % 2 * 0.6, 0); add(sk, new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 0), bone), 0, 0.12, 0); add(sk, box(0.12, 0.07, 0.1, bone), 0, 0.03, 0.02); }
    const moonG = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 1), cmat('#cfcab8', 0.1)); add(shelf, moonG, 0.5, 2.33, 0);
    // the desk: a big dark-wood slab with rounded ends
    const desk = new THREE.Group(); sc.add(desk);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.07, 20, 1, false, 0, Math.PI * 2), lam({ map: woodTex('desktop', '#4a2e1a', 32, 32, null, 3) })); top.scale.set(1.7, 1, 0.75); top.position.set(0, 0.76, 0); desk.add(top);
    add(desk, cyl(0.5, 0.6, 0.72, 10, cmat('#22160e')), 0, 0.36, 0);
    // mics, headphones, mugs, a laptop
    const mics = [R3.podMic(), R3.podMic()];
    mics[0].position.set(-0.8, 0.79, 0.12); mics[0].rotation.y = -Math.PI * 0.5 - 0.25; desk.add(mics[0]);
    mics[1].position.set(0.8, 0.79, 0.12); mics[1].rotation.y = Math.PI * 0.5 + 0.25; desk.add(mics[1]);
    const m1 = R3.mug('#16110f', 'COFFEE'); m1.position.set(-0.95, 0.795, 0.25); desk.add(m1); const m2 = R3.mug('#f1ece0'); m2.position.set(1.05, 0.795, -0.3); desk.add(m2);
    const lt = P.laptop(1.9); lt.g.position.set(0.25, 0.795, 0.4); lt.g.rotation.y = 0.4; desk.add(lt.g);
    // chairs
    const chair = (x, ry) => { const c = new THREE.Group(); c.position.set(x, 0, 0); c.rotation.y = ry; sc.add(c); const lea = cmat('#1a1716', 0.05); add(c, box(0.6, 0.12, 0.6, lea, 'bottom'), 0, 0.45, 0); add(c, box(0.6, 0.8, 0.12, lea, 'bottom'), 0, 0.5, -0.3, -0.12); add(c, cyl(0.04, 0.04, 0.45, 6, cmat('#333')), 0, 0.22, 0); add(c, cyl(0.3, 0.3, 0.04, 8, cmat('#222')), 0, 0.02, 0); return c; };
    const chairs = [chair(-1.6, Math.PI / 2 - 0.3), chair(1.6, -Math.PI / 2 + 0.3)];
    // the 1960s console CRT beside the desk
    const tv = R3.crt60({ scale: 1.0 }); tv.g.position.set(-3.0, 0, -2.6); tv.g.rotation.y = 0.75; sc.add(tv.g);
    // producer booth window (left wall) with a silhouette
    const booth = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.08, 0.12, 0.2) })); booth.position.set(-4.98, 1.6, 0.6); booth.rotation.y = Math.PI / 2; sc.add(booth);
    const prod = box(0.4, 0.55, 0.05, new THREE.MeshBasicMaterial({ color: 0x020304 }), 'bottom'); prod.position.set(-4.96, 1.05, 0.5); prod.rotation.y = Math.PI / 2; sc.add(prod); const ph = new THREE.Mesh(new THREE.CircleGeometry(0.13, 10), new THREE.MeshBasicMaterial({ color: 0x020304 })); ph.position.set(-4.96, 1.75, 0.5); ph.rotation.y = Math.PI / 2; sc.add(ph);
    const glowS = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 0.8, 1.6), toneMapped: false })); glowS.position.set(-4.95, 1.2, 1.1); glowS.rotation.y = Math.PI / 2; sc.add(glowS);
    const rug = new THREE.Mesh(new THREE.CircleGeometry(2.6, 24), cmat('#3a1414', 0.08)); rug.rotation.x = -Math.PI / 2; rug.position.y = 0.005; rug.scale.set(1.4, 1, 1); sc.add(rug);
    // light: warm key from above-front, red back glow, small fill
    const key = new THREE.SpotLight(0xffd8b0, 40, 14, 0.75, 0.6, 1.3); key.position.set(0.5, 3.2, 3.2); key.target.position.set(0, 1.0, 0); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); sc.add(key, key.target);
    const back = new THREE.PointLight(0xff4a2a, 12, 9, 1.4); back.position.set(0, 2.2, -3.2); sc.add(back);
    sc.add(new THREE.HemisphereLight(0x5a3a2a, 0x100808, 0.6));
    return { scene: sc, tv, onAirM, mics, chairs, lt, panel,
      seat: { host: [1.6, 0.55, 0, -Math.PI / 2 + 0.3], guest: [-1.6, 0.55, 0, Math.PI / 2 - 0.3] } };
  });
}

// ---------------- LISTENING ROOM: couch, record player, 60s CRT (album / review / shrek nights) ----------------
export function listenRoom(ctx) {
  return cached(ctx, 'listen', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x07060a);
    room(sc, { w: 7, d: 6, h: 3.0, wall: wallpaper('listen', '#3e5a52', '#36504a', [5, 2]), floor: planks('listen', '#6a4a30', [6, 6]), ceil: '#2a2622' });
    const couch = new THREE.Group(); couch.position.set(0, 0, 1.2); couch.rotation.y = Math.PI; sc.add(couch);
    const fab = lam({ map: ptex('couchfab', 16, 16, (g, w, h, R) => { noiseFill(g, w, h, '#b8562e', 0.06, R); for (let x = 0; x < w; x += 4) { g.fillStyle = '#a84a26'; g.fillRect(x, 0, 1, h); } }) });
    add(couch, box(2.2, 0.42, 0.9, fab, 'bottom')); add(couch, box(2.2, 0.55, 0.22, fab, 'bottom'), 0, 0.42, -0.36); for (const s of [-1, 1]) add(couch, box(0.22, 0.25, 0.9, fab, 'bottom'), s * 1.0, 0.42, 0);
    const cab = new THREE.Group(); cab.position.set(1.6, 0, -2.4); sc.add(cab); add(cab, box(1.4, 0.7, 0.5, lam({ map: woodTex('cab', '#7a4b2a', 32, 32, null, 2) }), 'bottom'));
    const tt = Q.turntable(); tt.position.set(1.55, 0.7, -2.4); tt.scale.setScalar(1.3); sc.add(tt);
    tt.userData.rec.material = lam({ map: ptex('vinylHi', 96, 96, (g, W, H) => { g.fillStyle = '#0c0c0e'; g.fillRect(0, 0, W, H); for (let r = 12; r < 47; r += 1.5) { g.strokeStyle = r % 6 < 1.5 ? '#26262a' : '#161618'; g.lineWidth = 1; g.beginPath(); g.arc(48, 48, r, 0, 7); g.stroke(); } g.fillStyle = '#d8262f'; g.beginPath(); g.arc(48, 48, 13, 0, 7); g.fill(); g.fillStyle = '#f3ecdd'; g.fillRect(40, 44, 16, 2); g.fillStyle = '#0c0c0e'; g.beginPath(); g.arc(48, 48, 1.5, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 6; g.beginPath(); g.arc(48, 48, 32, -0.6, 0.2); g.stroke(); }) });
    const crates = new THREE.Group(); crates.position.set(2.7, 0, -2.4); sc.add(crates); add(crates, box(0.5, 0.35, 0.4, cmat('#8a6a4a'), 'bottom')); for (let i = 0; i < 8; i++) add(crates, box(0.02, 0.3, 0.3, cmat(['#d8262f', '#2747c9', '#ffe04a', '#16110f'][i % 4]), 'bottom'), -0.2 + i * 0.05, 0.2, 0, 0, 0, 0.1);
    const tv = R3.crt60({ scale: 1.0 }); tv.g.position.set(-1.2, 0, -2.3); tv.g.rotation.y = 0.15; sc.add(tv.g);
    const lamp = P.lampFloor(true); lamp.position.set(-2.8, 0, -1.9); sc.add(lamp);
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2), lam({ map: ptex('rug', 32, 32, (g, w, h, R) => { noiseFill(g, w, h, '#2a3a5a', 0.05, R); g.strokeStyle = '#ffe04a'; g.lineWidth = 2; g.strokeRect(3, 3, w - 6, h - 6); }) })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.006, -0.4); sc.add(rug);
    const tape = new THREE.Group(); tape.visible = false; sc.add(tape);
    const tapeM = lam({ map: ptex('cstape', 64, 8, (g, w, h) => { g.fillStyle = '#ffe04a'; g.fillRect(0, 0, w, h); g.fillStyle = '#16110f'; g.font = `700 7px ${TIMES}`; for (let x = 0; x < w; x += 48) g.fillText('DO NOT CROSS', x + 2, 6); }), side: THREE.DoubleSide });
    for (const [x, z, ry, len] of [[1.55, -1.75, 0, 1.8], [0.65, -2.4, Math.PI / 2, 1.4], [2.45, -2.4, Math.PI / 2, 1.4]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.08), tapeM); m.position.set(x, 1.0, z); m.rotation.y = ry; tape.add(m); }
    const markers = []; for (let i = 0; i < 3; i++) { const m = R3.poster('marker' + i, 0.12, 0.1, (g, W, H) => { g.fillStyle = '#ffe04a'; g.fillRect(0, 0, W, H); g.fillStyle = '#16110f'; g.font = `700 60px ${TIMES}`; g.textAlign = 'center'; g.fillText(String(i + 1), W / 2, 80); }, [96, 96]); m.position.set(1.3 + i * 0.25, 0.86, -2.15); m.rotation.x = -0.6; tape.add(m); markers.push(m); }
    sc.add(new THREE.HemisphereLight(0x8a7a6a, 0x2a2018, 0.7));
    const key = new THREE.DirectionalLight(0xffe2c0, 0.9); key.position.set(3, 5, 4); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); const c = key.shadow.camera; c.left = -5; c.right = 5; c.top = 5; c.bottom = -5; sc.add(key);
    return { scene: sc, tv, tt, tape, couch, seat: (k) => [-0.55 + k * 0.6, 0.45, 1.05, Math.PI] };
  });
}
// ---------------- DINER (the burger review) ----------------
export function diner(ctx) {
  return cached(ctx, 'diner', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x0a0a0a);
    room(sc, { w: 8, d: 6, h: 3.0, wall: ptex('dinerwall', 32, 32, (g, w, h, R) => { noiseFill(g, w, h, '#f0e6d0', 0.03, R); g.fillStyle = '#d8262f'; g.fillRect(0, h * 0.55, w, 3); g.fillStyle = '#2747c9'; g.fillRect(0, h * 0.55 + 4, w, 2); }, { repeat: [5, 1] }), floor: ptex('checker', 16, 16, (g, w, h) => { for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) { g.fillStyle = ((x + y) / 4) % 2 ? '#16110f' : '#f3ecdd'; g.fillRect(x, y, 4, 4); } }, { repeat: [10, 8] }), ceil: '#e8e0cc' });
    const booth = (x, z) => { const b = new THREE.Group(); b.position.set(x, 0, z); sc.add(b); const red = cmat('#c8262a', 0.05); add(b, box(1.4, 0.45, 0.55, red, 'bottom'), 0, 0, -0.75); add(b, box(1.4, 0.75, 0.15, red, 'bottom'), 0, 0.45, -1.0); add(b, box(1.4, 0.45, 0.55, red, 'bottom'), 0, 0, 0.75); add(b, box(1.4, 0.75, 0.15, red, 'bottom'), 0, 0.45, 1.0); add(b, box(1.3, 0.05, 0.9, cmat('#e8e4dc', 0.03), 'bottom'), 0, 0.74, 0); add(b, cyl(0.06, 0.08, 0.74, 6, cmat('#bbb')), 0, 0, 0); return b; };
    const b1 = booth(0, 0); booth(-2.6, 0); booth(2.6, 0);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 1.3), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.7, 0.85, 1.1) })); win.position.set(0, 1.75, -2.98); sc.add(win);
    const sign = R3.poster('dinersign', 2.2, 0.5, (g, W, H) => { g.fillStyle = '#16110f'; g.fillRect(0, 0, W, H); g.fillStyle = '#ff5a8a'; g.font = `italic 700 50px ${TIMES}`; g.textAlign = 'center'; g.fillText('burgers', W / 2, 58); }, [256, 64]); sign.position.set(0, 2.65, -2.97); sc.add(sign);
    const bur = R3.burger(1.0); bur.position.set(-0.12, 0.79, 0.05); sc.add(bur);
    const plate = cyl(0.2, 0.18, 0.02, 14, cmat('#ffffff', 0.02)); plate.position.set(-0.12, 0.78, 0.05); sc.add(plate);
    const ph = R3.phone3d([200, 380]); ph.g.position.set(0.32, 0.87, -0.2); ph.g.rotation.set(-0.35, -0.3, 0); sc.add(ph.g);
    lights(sc, { hemiSky: 0xfff6e8, hemiGround: 0x6a4030, hemi: 1.0, sun: 0xfff2dc, sunI: 1.4, sunPos: [2, 6, 5], area: 5 });
    return { scene: sc, burger: bur, phone: ph, seat: [0, 0.45, 0.75, Math.PI] };
  });
}
// ---------------- CAFE at night (the first date): string lights, candle, two chairs ----------------
export function cafe(ctx) {
  return cached(ctx, 'cafe', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x0b0a12);
    room(sc, { w: 7, d: 6, h: 3.0, wall: ptex('cafewall', 32, 32, (g, w, h, R) => { noiseFill(g, w, h, '#5a3a2a', 0.04, R); for (let y = 0; y < h; y += 6) for (let x = (y / 6) % 2 ? 4 : 0; x < w; x += 8) { g.fillStyle = '#4a2e20'; g.fillRect(x, y, 7, 5); } }, { repeat: [5, 2] }), floor: planks('cafe', '#3a2a20', [6, 6]), ceil: '#1a1412' });
    const tbl = P.table(0.8, 0.8, 0.75, '#2a1c14'); sc.add(tbl);
    const candle = cyl(0.03, 0.03, 0.12, 6, cmat('#f3ecdd')); candle.position.set(0, 0.81, 0); sc.add(candle);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.05, 6), R3.glow('#ffb04a', 3)); flame.position.set(0, 0.9, 0); sc.add(flame);
    const cl = new THREE.PointLight(0xffa860, 0.9, 2.5, 1.8); cl.position.set(0, 1.25, 0); sc.add(cl);
    for (const s of [-1, 1]) { const m = R3.mug(s < 0 ? '#f1ece0' : '#d8262f'); m.position.set(s * 0.2, 0.75, 0.05); sc.add(m); }
    const ch = (x, ry) => { const c = new THREE.Group(); c.position.set(x, 0, 0); c.rotation.y = ry; sc.add(c); const m = cmat('#1a1210', 0.05); add(c, box(0.45, 0.05, 0.45, m, 'bottom'), 0, 0.45, 0); add(c, box(0.45, 0.55, 0.05, m, 'bottom'), 0, 0.48, -0.21); for (const [a, b] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) add(c, box(0.04, 0.45, 0.04, m, 'bottom'), a * 0.19, 0, b * 0.19); };
    ch(-0.75, Math.PI / 2); ch(0.75, -Math.PI / 2);
    for (let i = 0; i < 4; i++) { const sl = R3.stringLights(6.6, 18); sl.position.set(0, 2.7 - (i % 2) * 0.1, -2.5 + i * 1.5); sc.add(sl); }
    const winT = ptex('cafewin2', 96, 36, (g, w, h, R) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#060818'); gr.addColorStop(1, '#1c2450'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let x = 0; x < w;) { const bw = 4 + R() * 8 | 0, bh = 8 + R() * 20 | 0; g.fillStyle = '#080a14'; g.fillRect(x, h - bh, bw, bh); for (let y = h - bh + 2; y < h - 1; y += 3) for (let xx = x + 1; xx < x + bw - 1; xx += 2) if (R() > 0.7) { g.fillStyle = R() > 0.85 ? '#ff7eb6' : '#ffd27a'; g.fillRect(xx, y, 1, 1); } x += bw + 1; } });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.5), new THREE.MeshBasicMaterial({ map: winT })); win.position.set(0, 1.6, -2.98); sc.add(win);
    sc.add(new THREE.HemisphereLight(0x6a5a7a, 0x1a1210, 0.55));
    const warm = new THREE.PointLight(0xffc888, 6, 8, 1.4); warm.position.set(0, 2.5, 1.5); sc.add(warm);
    return { scene: sc, flame, seat: { jax: [-0.75, 0.47, 0, Math.PI / 2], date: [0.75, 0.47, 0, -Math.PI / 2] } };
  });
}
// ---------------- HOUSE PARTY (movies): living room, crowd with cups, projector screen ----------------
export function party(ctx) {
  return cached(ctx, 'party', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x08060c);
    room(sc, { w: 9, d: 8, h: 3.0, wall: wallpaper('party', '#3a2a4a', '#32243f', [6, 2]), floor: planks('party', '#4a3424', [7, 7]), ceil: '#1c1622' });
    const scr = new P.Screen(640, 480, 1.3); const sm = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.95), scr.mat); sm.position.set(0, 1.6, -3.95); sm.userData.noSelf = true; sc.add(sm);
    const disco = Q.discoBall(0.25); disco.position.set(1.5, 2.6, 0); sc.add(disco);
    const R = rng(77); const ppl = [];
    for (let i = 0; i < 14; i++) { const x = (R() - 0.5) * 7, z = -1.5 + R() * 5; if (Math.abs(x) < 1.2 && z > -0.5 && z < 2) continue; ppl.push([x, z, R() * 6]); }
    const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 1.0, 0.26), lam({ flat: true }), ppl.length), heads = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.14, 0), lam({ flat: true }), ppl.length), cups = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.04, 0.03, 0.1, 6), lam({ color: new THREE.Color('#d8262f') }), ppl.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1), e = new THREE.Euler(), col = new THREE.Color();
    ppl.forEach(([x, z, r], i) => { q.setFromEuler(e.set(0, r, 0)); v.set(x, 0.85, z); s.set(1, 1.5, 1); m4.compose(v, q, s); bodies.setMatrixAt(i, m4); bodies.setColorAt(i, col.set(['#2747c9', '#d8262f', '#16110f', '#ffe04a', '#3a3a3a'][i % 5])); s.set(1, 1, 1); v.set(x, 1.72, z); m4.compose(v, q, s); heads.setMatrixAt(i, m4); heads.setColorAt(i, col.set(['#f0c8a8', '#c99a76', '#8a5a3a'][i % 3])); v.set(x + 0.25 * Math.cos(r), 1.2, z - 0.25 * Math.sin(r)); m4.compose(v, q, s); cups.setMatrixAt(i, m4); });
    for (const m of [bodies, heads, cups]) { m.castShadow = true; sc.add(m); }
    const L1 = new THREE.PointLight(0xff5aa0, 8, 9, 1.4); L1.position.set(-3, 2.6, 0); sc.add(L1); const L2 = new THREE.PointLight(0x5a8aff, 8, 9, 1.4); L2.position.set(3, 2.6, 1); sc.add(L2);
    const proj = new THREE.PointLight(0xdde8ff, 4, 6, 1.5); proj.position.set(0, 1.6, -3.2); sc.add(proj);
    sc.add(new THREE.HemisphereLight(0x5a4a6a, 0x100810, 0.6));
    return { scene: sc, scr, disco };
  });
}
// ---------------- HEAVEN (heaven forbid): cloud floor, pearly gate, rays ----------------
export function heaven(ctx) {
  return cached(ctx, 'heaven', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0xfff3d8); sc.fog = new THREE.Fog(0xfff3d8, 14, 60);
    sc.add(skyDome('#ffe8b8', '#fff4dc', '#ffffff'));
    lights(sc, { hemiSky: 0xffffff, hemiGround: 0xffe6c0, hemi: 1.4, sun: 0xfff0d0, sunI: 1.6, sunPos: [0, 12, 6], area: 10 });
    const R = rng(12); const cm = cmat('#ffffff', 0.02);
    for (let i = 0; i < 70; i++) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8 + R() * 1.6, 0), cm); c.position.set((R() - 0.5) * 30, -0.6 + R() * 0.4, -20 + R() * 24); c.scale.y = 0.45; sc.add(c); }
    const gate = new THREE.Group(); gate.position.set(0, 0, -4); sc.add(gate); const gold = lam({ color: new THREE.Color('#e8c25a'), emissive: new THREE.Color('#5a4010') });
    for (const s of [-1, 1]) { add(gate, box(0.3, 3.4, 0.3, gold, 'bottom'), s * 1.6, 0, 0); for (let i = 0; i < 5; i++) add(gate, box(0.05, 2.6, 0.05, gold, 'bottom'), s * (0.25 + i * 0.27), 0, 0); }
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.12, 6, 20, Math.PI), gold); arch.position.set(0, 3.4, 0); gate.add(arch);
    const sign = R3.poster('heavensign', 1.6, 0.4, (g, W, H) => { g.fillStyle = '#16110f'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffe04a'; g.font = `italic 700 34px ${TIMES}`; g.textAlign = 'center'; g.fillText('no donkeys', W / 2, 44); }, [256, 64]); sign.position.set(0, 2.9, 0.2); gate.add(sign);
    return { scene: sc, gate };
  });
}

// ---------------- SHOWROOM: glossy dark floor, spotlights on three dream cars ----------------
export function showroom(ctx) {
  return cached(ctx, 'showroom', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x060607);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshLambertMaterial({ color: 0x1a1a1e })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; sc.add(fl);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(40, 10), cmat('#0e0e12', 0.03)); back.position.set(0, 5, -6); sc.add(back);
    const cars = [carGeneric('wedge', '#d8262f'), carGeneric('round', '#c8ccd2'), carGeneric('wedge', '#ffe04a')];
    cars.forEach((c, i) => { c.g.position.set((i - 1) * 3.6, 0, -1.5); c.g.rotation.y = 0.5 - i * 0.12; sc.add(c.g); const disc = new THREE.Mesh(new THREE.CircleGeometry(2.6, 30), cmat('#2a2a30', 0.02)); disc.rotation.x = -Math.PI / 2; disc.position.set((i - 1) * 3.6, 0.01, -1.5); sc.add(disc);
      const sp = new THREE.SpotLight(0xfff2e0, 26, 14, 0.42, 0.5, 1.2); sp.position.set((i - 1) * 3.6, 7, 1); sp.target.position.set((i - 1) * 3.6, 0, -1.5); sp.castShadow = true; sp.shadow.mapSize.set(512, 512); sc.add(sp, sp.target); });
    const sign = R3.poster('showsign', 4.2, 0.6, (g, W, H) => { g.fillStyle = '#060607'; g.fillRect(0, 0, W, H); g.fillStyle = '#f3ecdd'; g.font = `700 40px ${TIMES}`; g.textAlign = 'center'; g.letterSpacing = '12px'; g.fillText('DREAM CARS', W / 2, 56); }, [512, 76]); sign.position.set(0, 4.2, -5.95); sc.add(sign);
    sc.add(new THREE.HemisphereLight(0x4a4a5a, 0x101012, 0.5));
    return { scene: sc, cars };
  });
}
// ---------------- HILL AT NIGHT with a huge moon and stars ----------------
export function hillNight(ctx) {
  return cached(ctx, 'hill', () => {
    const sc = new THREE.Scene(); sc.fog = new THREE.Fog(0x0a1230, 30, 160);
    sc.add(skyDome('#02030a', '#0a1236', '#1a2a5a')); sc.add(stars(2400, 380, 33));
    const moonM = new THREE.Mesh(new THREE.IcosahedronGeometry(14, 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.0, 1.95, 1.75), toneMapped: false, fog: false })); moonM.position.set(30, 46, -150); sc.add(moonM);
    const crater = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.45, 1.3), toneMapped: false, fog: false });
    for (let i = 0; i < 7; i++) { const c = new THREE.Mesh(new THREE.CircleGeometry(1.5 + (i % 3), 10), crater); const a = i * 1.7; c.position.set(30 + Math.cos(a) * 7, 46 + Math.sin(a) * 6, -136); sc.add(c); }
    lights(sc, { hemiSky: 0x3a4a8a, hemiGround: 0x0a1410, hemi: 0.6, sun: 0xb0c0ff, sunI: 0.9, sunPos: [10, 14, -20], area: 10 });
    const height = (x, z) => Math.max(0, Math.round(2.2 - Math.hypot(x, z + 2) * 0.22 + fbm2(x * 0.1, z * 0.1, 2, 5) * 1.2));
    sc.add(voxelTerrain({ x0: -40, x1: 40, z0: -60, z1: 20, height, mats: grassMats(false), depth: 3 }));
    const scope = new THREE.Group(); scope.position.set(1.0, height(1, -2), -2.2); sc.add(scope); for (const a of [0, 2.1, 4.2]) R3.add(scope, box(0.03, 1.1, 0.03, cmat('#2a2a2a'), 'bottom'), Math.cos(a) * 0.25, 0, Math.sin(a) * 0.25, Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2); const tube = cyl(0.07, 0.09, 0.9, 10, cmat('#e8e4dc')); tube.position.set(0, 1.2, 0); tube.rotation.set(-0.9, 0, 0.3); scope.add(tube);
    return { scene: sc, moon: moonM, height };
  });
}
// ---------------- LECTURE HALL / GRADUATION (does the car attend university?) ----------------
export function lecture(ctx) {
  return cached(ctx, 'lecture', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x0c0a08);
    room(sc, { w: 14, d: 14, h: 6, wall: woodTex('lectwall', '#6a4a2e', 32, 32, [7, 3], 4), floor: planks('lect', '#5a3e2a', [8, 8]), ceil: '#2a2420' });
    const board = new THREE.Mesh(new THREE.PlaneGeometry(6, 2.4), lam({ map: ptex('board', 128, 52, (g, w, h) => { g.fillStyle = '#20382c'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8e8e0'; g.font = `700 13px ${TIMES}`; g.fillText('PHIL 101: what is a car?', 6, 16); g.font = `italic 400 10px ${TIMES}`; g.fillText('"i drive, therefore i am."', 6, 32); g.fillText('ship of theseus → timing belt', 6, 46); }) })); board.position.set(0, 2.3, -6.95); sc.add(board);
    const R = rng(5); const N = 40; const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 0.6, 0.26), lam({ flat: true }), N), heads = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.14, 0), lam({ flat: true }), N), desks = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, 0.06, 0.45), cmat('#4a3020'), N);
    const m4 = new THREE.Matrix4(), col = new THREE.Color(); let k = 0;
    for (let r = 0; r < 5; r++) for (let i = 0; i < 8; i++) { const x = -5 + i * 1.4, z = -1 + r * 1.5, y = r * 0.35; if (r === 0 && (i === 3 || i === 4)) { k++; continue; } m4.makeTranslation(x, y + 0.75, z); bodies.setMatrixAt(k, m4); bodies.setColorAt(k, col.set(['#2747c9', '#d8262f', '#16110f', '#e8e2d4', '#3a5a3a'][k % 5])); m4.makeTranslation(x, y + 1.2, z); heads.setMatrixAt(k, m4); heads.setColorAt(k, col.set(['#f0c8a8', '#c99a76', '#8a5a3a'][k % 3])); m4.makeTranslation(x, y + 0.8, z - 0.45); desks.setMatrixAt(k, m4); k++; }
    for (const m of [bodies, heads, desks]) { m.castShadow = true; sc.add(m); }
    for (let r = 0; r < 5; r++) { const tier = box(14, r * 0.35 + 0.001, 1.5, cmat('#3a2618'), 'bottom'); tier.position.set(0, 0, -1 + r * 1.5); sc.add(tier); }
    const podium = box(0.9, 1.1, 0.6, cmat('#3a2618'), 'bottom'); podium.position.set(-3.5, 0, -5.2); sc.add(podium);
    const banner = R3.poster('gradbanner', 5, 0.9, (g, W, H) => { g.fillStyle = '#16110f'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffe04a'; g.font = `italic 700 54px ${TIMES}`; g.textAlign = 'center'; g.fillText('class of 2026', W / 2, 72); }, [512, 96]); banner.position.set(0, 4.4, -6.95); banner.visible = false; sc.add(banner);
    lights(sc, { hemiSky: 0xfff0d8, hemiGround: 0x3a2a1a, hemi: 0.9, sun: 0xffe8c8, sunI: 1.5, sunPos: [4, 9, 6], area: 9 });
    return { scene: sc, banner, students: [bodies, heads, desks] };
  });
}
// ---------------- WORKSHOP (his own car is at the workshop. again.) ----------------
export function workshop(ctx) {
  return cached(ctx, 'workshop', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x0a0a0a);
    room(sc, { w: 10, d: 8, h: 4.5, wall: ptex('shopwall', 32, 32, (g, w, h, R) => { noiseFill(g, w, h, '#8a8a80', 0.05, R); g.fillStyle = '#ffe04a'; g.fillRect(0, h - 6, w, 3); g.fillStyle = '#16110f'; for (let x = 0; x < w; x += 8) g.fillRect(x, h - 6, 4, 3); }, { repeat: [6, 2] }), floor: ptex('shopfloor', 32, 32, (g, w, h, R) => { noiseFill(g, w, h, '#6a6a66', 0.07, R); for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(20,20,20,0.35)'; g.beginPath(); g.ellipse(R() * w, R() * h, 3 + R() * 5, 2 + R() * 3, 0, 0, 7); g.fill(); } }, { repeat: [6, 5] }), ceil: '#3a3a38' });
    const car = carGeneric('hatch', '#2f5a8a'); car.g.position.set(0, 1.2, -0.8); car.g.rotation.y = 0.4; sc.add(car.g);
    for (const s of [-1, 1]) { const post = box(0.25, 3.0, 0.25, cmat('#d8262f'), 'bottom'); post.position.set(s * 1.5, 0, -0.8); sc.add(post); const arm = box(0.12, 0.08, 2.2, cmat('#333'), 'bottom'); arm.position.set(s * 0.9, 1.12, -0.8); sc.add(arm); }
    const smoke = []; for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.25, 0), new THREE.MeshLambertMaterial({ color: 0xcfcfcf, transparent: true, opacity: 0.45, depthWrite: false })); sc.add(m); smoke.push(m); }
    const sign = R3.poster('ooo', 1.0, 0.5, (g, W, H) => { g.fillStyle = '#ffe04a'; g.fillRect(0, 0, W, H); g.fillStyle = '#16110f'; g.font = `700 30px ${TIMES}`; g.textAlign = 'center'; g.fillText('OUT OF', W / 2, 40); g.fillText('ORDER', W / 2, 74); }, [160, 90]); sign.position.set(0.0, 1.9, 1.3); sign.rotation.y = 0.4; sc.add(sign);
    const visits = R3.poster('visits', 1.2, 1.4, (g, W, H) => { g.fillStyle = '#f3ecdd'; g.fillRect(0, 0, W, H); g.fillStyle = '#16110f'; g.font = `700 22px ${TIMES}`; g.fillText('SERVICE LOG', 14, 34); g.font = `400 18px ${MONO}`; ['jan  brakes', 'mar  brakes', 'apr  "noise"', 'jun  brakes', 'aug  ???', 'oct  again'].forEach((s, i) => g.fillText(s, 14, 70 + i * 28)); }, [200, 240]); visits.position.set(3.5, 1.8, -3.98); sc.add(visits);
    lights(sc, { hemiSky: 0xf0f4ff, hemiGround: 0x404040, hemi: 0.9, sun: 0xfff6e8, sunI: 1.3, sunPos: [3, 8, 5], area: 6 });
    return { scene: sc, car, smoke };
  });
}

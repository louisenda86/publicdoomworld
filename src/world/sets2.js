// SLOPCORE sets (cached per film): coloured voids, K-pop stage, museum, giant-laptop studio, label boardroom,
// landfill at dusk, black-hole singularity, phone-zombie plaza.
import * as THREE from 'three';
import { box, lam, basic, cmat, at, group, blob, cyl, taper } from './kit.js';
import { ptex, shade, noiseFill } from './tex.js';
import { skyDome, stars, lights, ground, voxelTerrain, tree } from './env.js';
import * as P from './props.js';
import * as Q from './props2.js';
import { Character } from './char.js';
import { fbm2, rng, clamp, hash2 } from '../core.js';
import { C, SANS, MONO, COND } from '../ov/overlay.js';

function cached(ctx, key, fn) { if (!ctx.cache.has(key)) ctx.cache.set(key, fn()); return ctx.cache.get(key); }
const glow = (hex, k = 2.5) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), toneMapped: false });

// ---------------- coloured void with a shadow catcher (the template's card colours in 3D) ----------------
export function voidSet(ctx, key = 'slime', color = C.slime, { hemi = 1.4, sunI = 1.6 } = {}) {
  return cached(ctx, 'void:' + key, () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(color);
    lights(sc, { hemiSky: 0xffffff, hemiGround: new THREE.Color(color).getHex(), hemi, sun: 0xffffff, sunI, sunPos: [4, 10, 7], area: 10 });
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.22 })); sh.rotation.x = -Math.PI / 2; sh.receiveShadow = true; sc.add(sh);
    return { scene: sc, floor: sh };
  });
}

// ---------------- K-POP CONCERT STAGE ----------------
export function stage(ctx) {
  return cached(ctx, 'stage', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x07040b); sc.fog = new THREE.Fog(0x140a1e, 12, 46);
    const floorT = ptex('stagefloor', 32, 32, (g, w, h, R) => { noiseFill(g, w, h, '#151019', 0.06, R); g.fillStyle = '#211a28'; for (let i = 0; i < w; i += 8) { g.fillRect(i, 0, 1, h); g.fillRect(0, i, w, 1); } }, { repeat: [6, 4] });
    const deck = box(14, 1.2, 8, [cmat('#0d0a10'), cmat('#0d0a10'), lam({ map: floorT }), cmat('#0d0a10'), cmat('#0d0a10'), cmat('#0d0a10')], 'top'); deck.position.set(0, 0, 0); deck.receiveShadow = true; sc.add(deck);
    const edge = box(14, 0.05, 0.05, glow(C.slime, 2.4), 'center'); edge.position.set(0, 0.0, 4.02); sc.add(edge);
    const edge2 = box(14, 0.04, 0.04, glow(C.pink, 2.4), 'center'); edge2.position.set(0, -0.6, 4.02); sc.add(edge2);
    // centre runway + stairs feel
    const run = box(2.4, 1.2, 4, [cmat('#0d0a10'), cmat('#0d0a10'), lam({ map: floorT }), cmat('#0d0a10'), cmat('#0d0a10'), cmat('#0d0a10')], 'top'); run.position.set(0, 0, 6); sc.add(run);
    for (const sx of [-1, 1]) { const e = box(0.04, 0.04, 4, glow(C.slime, 2.2), 'center'); e.position.set(sx * 1.21, 0, 6); sc.add(e); }
    // LED wall + side towers
    const wall = Q.ledWall(11.5, 4.8, [768, 320]); wall.mesh.position.set(0, 2.75, -3.3); sc.add(wall.mesh);
    const frame = box(11.9, 5.2, 0.2, cmat('#111014'), 'center'); frame.position.set(0, 2.75, -3.42); sc.add(frame);
    const sideL = Q.ledWall(2.2, 4.8, [128, 280]), sideR = Q.ledWall(2.2, 4.8, [128, 280]);
    sideL.mesh.position.set(-7.1, 2.75, -2.6); sideL.mesh.rotation.y = 0.45; sideR.mesh.position.set(7.1, 2.75, -2.6); sideR.mesh.rotation.y = -0.45; sc.add(sideL.mesh, sideR.mesh);
    for (const sx of [-1, 1]) { const s1 = Q.speakerStack(2.6); s1.position.set(sx * 6.3, 0, 2.4); s1.rotation.y = -sx * 0.25; sc.add(s1); }
    // truss + moving-head beams
    const trussM = cmat('#3a3a42', 0.08); const tr = box(15, 0.3, 0.3, trussM, 'center'); tr.position.set(0, 6.4, 1.0); sc.add(tr);
    for (const sx of [-1, 1]) { const tp = box(0.3, 7.6, 0.3, trussM, 'bottom'); tp.position.set(sx * 7.4, -1.2, 1.0); sc.add(tp); }
    const beams = []; const bc = [C.slime, C.pink, C.volt, C.pink, C.slime, C.volt];
    for (let i = 0; i < 6; i++) { const x = -6 + i * 2.4; const head = box(0.3, 0.32, 0.3, cmat('#202024'), 'center'); head.position.set(x, 6.1, 1.0); sc.add(head);
      const b = Q.beam(bc[i], 10, 1.25, 0.16); b.position.set(x, 6.0, 1.0); sc.add(b); beams.push({ g: b, x, col: bc[i] }); }
    // crowd: instanced fans + lightsticks in the pit
    const R = rng(41); const N = 360; const fans = [];
    for (let i = 0; i < N; i++) { const z = 5 + R() * 14, x = (R() - 0.5) * (10 + z * 0.9); if (Math.abs(x) < 1.6 && z < 8.5) continue; fans.push({ x, z, h: 1.5 + R() * 0.3, ph: R() * 6.28, col: ['#2a2232', '#1c2030', '#30222a', '#222a24'][i % 4], stick: [C.slime, C.pink, C.volt, C.slime][(i * 7) % 4] }); }
    const bodyG = new THREE.BoxGeometry(0.42, 1, 0.26), headG = new THREE.IcosahedronGeometry(0.13, 0), stickG = new THREE.SphereGeometry(0.06, 5, 4);
    const bodies = new THREE.InstancedMesh(bodyG, lam({ flat: true }), fans.length), heads = new THREE.InstancedMesh(headG, lam({ flat: true }), fans.length);
    const sticks = new THREE.InstancedMesh(stickG, new THREE.MeshBasicMaterial({ toneMapped: false }), fans.length);
    const col = new THREE.Color(); fans.forEach((f, i) => { bodies.setColorAt(i, col.set(f.col)); heads.setColorAt(i, col.set(f.col).multiplyScalar(1.4)); sticks.setColorAt(i, col.set(f.stick).multiplyScalar(2.6)); });
    for (const m of [bodies, heads, sticks]) { m.frustumCulled = false; sc.add(m); }
    const m4 = new THREE.Matrix4(), v = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
    const crowd = { update(t, energy = 1, bpm = 128) { const beat = t * bpm / 60;
      fans.forEach((f, i) => { const jump = Math.max(0, Math.sin((beat + f.ph * 0.1) * Math.PI)) * 0.18 * energy; const y0 = -1.2 + jump;
        v.set(f.x, y0 + f.h * 0.35, f.z); s.set(1, f.h * 0.7, 1); m4.compose(v, q.identity(), s); bodies.setMatrixAt(i, m4);
        v.set(f.x, y0 + f.h * 0.78, f.z); s.set(1, 1, 1); m4.compose(v, q, s); heads.setMatrixAt(i, m4);
        const sw = Math.sin(beat * Math.PI + f.ph) * 0.5 * energy; v.set(f.x + Math.sin(sw) * 0.35 + 0.2, y0 + f.h + 0.35 + Math.cos(sw) * 0.25, f.z - 0.1); m4.compose(v, q, s); sticks.setMatrixAt(i, m4); });
      bodies.instanceMatrix.needsUpdate = heads.instanceMatrix.needsUpdate = sticks.instanceMatrix.needsUpdate = true; } };
    crowd.update(0);
    const conf = Q.confetti(500, [14, 7, 8]); conf.position.set(0, 0, 2); conf.visible = false; sc.add(conf);
    const ball = Q.discoBall(0.45); ball.position.set(0, 7.2, 3); sc.add(ball);
    // lights
    sc.add(new THREE.HemisphereLight(0x6a5a8a, 0x100810, 0.5));
    const key = new THREE.SpotLight(0xfff0e0, 60, 30, 0.5, 0.6, 1.2); key.position.set(0, 8, 12); key.target.position.set(0, 1, 0); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); sc.add(key, key.target);
    const rimL = new THREE.PointLight(new THREE.Color(C.pink), 30, 16, 1.5); rimL.position.set(-5, 4, -1.5); sc.add(rimL);
    const rimR = new THREE.PointLight(new THREE.Color(C.volt), 30, 16, 1.5); rimR.position.set(5, 4, -1.5); sc.add(rimR);
    const wallGlow = new THREE.PointLight(0xc8a8ff, 12, 12, 1.6); wallGlow.position.set(0, 2.6, -2.2); sc.add(wallGlow);
    return { scene: sc, wall: wall.scr, sideL: sideL.scr, sideR: sideR.scr, beams, crowd, confetti: conf, ball, key, rimL, rimR,
      setBeams(t, mode = 'sweep', k = 1) { beams.forEach((b, i) => { const a = mode === 'sweep' ? Math.sin(t * 1.3 + i * 0.9) * 0.55 : mode === 'cross' ? (i % 2 ? 1 : -1) * (0.3 + 0.25 * Math.sin(t * 2.2)) : 0; b.g.rotation.set(0.35 + Math.sin(t * 0.9 + i) * 0.15, 0, a); b.g.userData.beam.material.opacity = 0.14 * k * (0.75 + 0.25 * Math.sin(t * 6 + i)); }); } };
  });
}

// ---------------- MUSEUM: the pedestal of humanity's latest achievement ----------------
export function museum(ctx) {
  return cached(ctx, 'museum', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x07050a);
    const wallT = ptex('musewall', 32, 32, (g, w, h, R) => { noiseFill(g, w, h, '#3a1f2c', 0.04, R); }, { repeat: [4, 2] });
    const floorT = ptex('musefloor', 16, 16, (g, w, h, R) => { noiseFill(g, w, h, '#2a1d16', 0.08, R); g.fillStyle = '#20150f'; for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1); }, { repeat: [10, 10] });
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), lam({ map: floorT })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; sc.add(fl);
    for (const [x, z, ry] of [[0, -5, 0], [-6, 0, Math.PI / 2], [6, 0, -Math.PI / 2]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(12, 5), lam({ map: wallT })); m.position.set(x, 2.5, z); m.rotation.y = ry; m.receiveShadow = true; sc.add(m); }
    // framed "masterpieces" on the walls (procedural brushwork)
    const R = rng(9);
    [[-3.2, -4.97, 0], [3.2, -4.97, 0], [-5.97, -1.5, Math.PI / 2], [5.97, -1.5, -Math.PI / 2]].forEach(([x, z, ry], i) => {
      const art = ptex('art' + i, 32, 24, (g, w, h, RR) => { const pal = [['#2a4a7a', '#e8c35a', '#1a2a4a'], ['#7a2a2a', '#e8b07a', '#3a1a1a'], ['#2a5a3a', '#d8d07a', '#1a3a2a'], ['#5a3a7a', '#f0a0c0', '#2a1a3a']][i]; g.fillStyle = pal[0]; g.fillRect(0, 0, w, h); for (let k = 0; k < 60; k++) { g.fillStyle = pal[k % 3]; g.fillRect(RR() * w | 0, RR() * h | 0, 2 + RR() * 5 | 0, 1 + RR() * 2 | 0); } });
      const fr = new THREE.Group(); fr.add(box(1.7, 1.3, 0.08, cmat('#b08a3a', 0.1))); const pic = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.1), lam({ map: art })); pic.position.z = 0.045; fr.add(pic); fr.position.set(x, 2.3, z); fr.rotation.y = ry; sc.add(fr);
      const sp = new THREE.SpotLight(0xffe2b0, 6, 6, 0.5, 0.7, 1.5); sp.position.set(x * 0.8, 4.2, z * 0.8 + (ry === 0 ? 1.2 : 0)); sp.target = fr; sc.add(sp);
    });
    const ped = Q.pedestal(1.05, 0.7); ped.position.set(0, 0, -1); sc.add(ped);
    const ropes = Q.ropePosts(2.6); ropes.position.set(0, 0, 0.6); sc.add(ropes);
    const pl = Q.plaque(["HUMANITY'S LATEST", 'CULTURAL ACHIEVEMENT', 'c. 2026 · mixed media (garbage)'], 0.7, 0.32); pl.position.set(0.0, 1.0, 0.95); pl.rotation.x = -0.4; sc.add(pl);
    const plStand = box(0.06, 0.95, 0.06, cmat('#2a2622'), 'bottom'); plStand.position.set(0, 0, 0.92); sc.add(plStand);
    // the exhibit: a trash bag + SLOP can, under a cloth
    const item = new THREE.Group(); item.position.set(0, 1.11, -1); sc.add(item);
    const bag = Q.trashBag('#18181e', 0.85, 4); bag.position.set(-0.13, 0, -0.02); item.add(bag);
    const can = Q.trashCan('SLOP'); can.scale.setScalar(0.5); can.position.set(0.2, 0, 0.12); can.rotation.y = -0.5; item.add(can);
    const flies = new THREE.Group(); for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.012, 4, 3), cmat('#0a0a0a')); flies.add(f); } item.add(flies);
    const cloth = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.62, 0.95, 10, 3, true), lam({ color: 0x8a1c2a, flat: true, side: THREE.DoubleSide }));
    const cp = cloth.geometry.attributes.position; for (let i = 0; i < cp.count; i++) { const y = cp.getY(i); const a = Math.atan2(cp.getZ(i), cp.getX(i)); const r = 1 + 0.08 * Math.sin(a * 5) * (0.5 - y); cp.setX(i, cp.getX(i) * r); cp.setZ(i, cp.getZ(i) * r); } cloth.geometry.computeVertexNormals();
    cloth.position.set(0, 1.11 + 0.47, -1); cloth.castShadow = true; sc.add(cloth);
    const spot = new THREE.SpotLight(0xfff1d8, 70, 9, 0.32, 0.45, 1.2); spot.position.set(0, 5.5, 0.6); spot.target.position.set(0, 1.1, -1); spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); sc.add(spot, spot.target);
    const cone = Q.beam('#fff1d8', 4.6, 0.85, 0.08); cone.position.set(0, 5.5, 0.6); cone.lookAt(0, 1.1, -1); cone.rotateX(Math.PI / 2); sc.add(cone);
    sc.add(new THREE.HemisphereLight(0x5a4060, 0x100808, 0.45));
    return { scene: sc, item, cloth, flies, spot, bag, can };
  });
}

// ---------------- GIANT LAPTOP: a film studio on the keyboard ----------------
export const LK = 30; // laptop scale (a 34 cm laptop becomes 10 m)
export function laptopWorld(ctx) {
  return cached(ctx, 'laptop', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x0a0810); sc.fog = new THREE.Fog(0x0a0810, 30, 140);
    const W = 0.34 * LK, D = 0.24 * LK, T = 0.018 * LK;
    const alu = cmat('#b9bcc2', 0.04);
    const keysT = ptex('lapkeys', 128, 64, (g, w, h, R) => { noiseFill(g, w, h, '#b9bcc2', 0.03, R); g.fillStyle = '#1b1c20';
      for (let r = 0; r < 6; r++) for (let c = 0; c < 15; c++) { const kx = 6 + c * 7.8, ky = 4 + r * 7.2; const kw = (r === 5 && c > 4 && c < 10) ? 0 : 6.6; if (kw) g.fillRect(kx, ky, kw, 6); }
      g.fillRect(6 + 5 * 7.8, 4 + 5 * 7.2, 5 * 7.8 - 1.2, 6);
      g.fillStyle = '#a9acb2'; g.fillRect(40, 50, 48, 12); g.fillStyle = '#9fa2a8'; g.fillRect(41, 51, 46, 10); });
    const deck = box(W, T, D, [alu, alu, lam({ map: keysT }), alu, alu, alu], 'top'); sc.add(deck); deck.receiveShadow = true;
    // lid + display (hinged at the back edge, tilted back 108 degrees)
    const hinge = new THREE.Group(); hinge.position.set(0, 0, -D / 2); hinge.rotation.x = -0.32; sc.add(hinge);
    const lid = box(W, 0.22 * LK, 0.012 * LK, alu, 'bottom'); lid.position.z = -0.006 * LK; hinge.add(lid);
    const disp = new P.Screen(960, 600, 1.1); const dm = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.92, 0.2 * LK * 0.95), disp.mat); dm.position.set(0, 0.11 * LK, 0.0005 * LK); hinge.add(dm);
    // desk
    const deskT = ptex('desk', 32, 32, (g, w, h, R) => { noiseFill(g, w, h, '#4a3324', 0.06, R); for (let y = 0; y < h; y += 3) { g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(0, y, w, 1); } }, { repeat: [8, 8] });
    const desk = new THREE.Mesh(new THREE.PlaneGeometry(260, 200), lam({ map: deskT })); desk.rotation.x = -Math.PI / 2; desk.position.y = -T; desk.receiveShadow = true; sc.add(desk);
    const mug = cyl(0.04 * LK, 0.04 * LK, 0.1 * LK, 12, cmat('#f5efe0', 0.03)); mug.position.set(W * 0.75, -T + 0.05 * LK, D * 0.1); sc.add(mug);
    // the crew (human scale, standing on the keys)
    const crew = {};
    crew.suno = Q.robot({ name: 'SUNO', body: '#1c1c20', accent: '#ff8a3d' }); crew.suno.g.position.set(-3.3, 0, 0.6); crew.suno.g.rotation.y = 0.5; sc.add(crew.suno.g);
    const syn = Q.synthKeys(); syn.position.set(-3.05, 0, 1.15); syn.rotation.y = 0.5 + Math.PI; sc.add(syn); crew.synth = syn;
    crew.mj = Q.robot({ name: 'MIDJOURNEY', body: '#efeee9', accent: '#4a5cff' }); crew.mj.g.position.set(3.4, 0, 0.7); crew.mj.g.rotation.y = -0.9; sc.add(crew.mj.g);
    const canvasScr = new P.Screen(256, 256, 1.0); const es = Q.easel(canvasScr); es.position.set(2.75, 0, 1.25); es.rotation.y = -0.9 + Math.PI; sc.add(es); crew.canvas = canvasScr;
    crew.seed = Q.robot({ name: 'SEEDANCE', body: '#2456d8', accent: '#2ef0e0' }); crew.seed.g.position.set(0.9, 0, 2.3); crew.seed.g.rotation.y = Math.PI; sc.add(crew.seed.g);
    const cam = Q.filmCamera(); cam.position.set(0.55, 0, 1.75); cam.rotation.y = Math.PI; sc.add(cam); crew.camera = cam;
    crew.claude = Q.robot({ name: 'CLAUDE', body: '#d97757', accent: '#f5efe0', faceCol: '#f5efe0' }); crew.claude.g.position.set(-1.0, 0.0, 2.9); crew.claude.g.rotation.y = Math.PI - 0.25; sc.add(crew.claude.g);
    const chair = Q.directorChair('CLAUDE'); chair.position.set(-1.0, 0, 3.0); chair.rotation.y = Math.PI - 0.25; sc.add(chair); crew.chair = chair;
    const mega = Q.megaphone(); crew.mega = mega;
    // monitor cart: code / timeline / lyrics
    const cart = new THREE.Group(); cart.position.set(-2.4, 0, 2.9); cart.rotation.y = Math.PI - 0.6; sc.add(cart);
    cart.add(at(box(1.4, 0.9, 0.5, cmat('#26262c'), 'bottom'), 0, 0, 0));
    const mons = [0, 1, 2].map(i => { const s = new P.Screen(256, 160, 1.3); const m = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.27), s.mat); m.position.set(-0.45 + i * 0.45, 1.12, 0.05); m.rotation.y = (1 - i) * 0.25; cart.add(m); const bz = box(0.46, 0.31, 0.03, cmat('#111'), 'center'); bz.position.set(-0.45 + i * 0.45, 1.12, 0.03); bz.rotation.y = (1 - i) * 0.25; cart.add(bz); return s; });
    crew.monitors = mons;
    // the mini stage with the idols, backed by a small LED panel
    const riser = box(3.2, 0.25, 1.8, [cmat('#111'), cmat('#111'), cmat('#2a2232'), cmat('#111'), cmat('#111'), cmat('#111')], 'bottom'); riser.position.set(0, 0, -1.0); sc.add(riser);
    const panel = Q.ledWall(3.4, 1.9, [384, 216]); panel.mesh.position.set(0, 1.35, -2.0); sc.add(panel.mesh);
    for (const sx of [-1, 1]) { const L = Q.studioLight('#fff1d6'); L.position.set(sx * 2.4, 0, 0.9); L.rotation.y = sx * 2.4; sc.add(L); }
    const boom = Q.boomMic(); boom.position.set(-1.6, 0, -0.3); boom.rotation.y = 0.2; sc.add(boom);
    const clap = Q.clapper(); clap.position.set(1.6, 0, 0.2); clap.rotation.y = -0.4; sc.add(clap); crew.clapper = clap;
    // cables across the keys
    for (let i = 0; i < 5; i++) { const c = box(0.05, 0.03, 4 + i * 0.6, cmat('#111'), 'bottom'); c.position.set(-1.5 + i * 0.7, 0, 1.0); c.rotation.y = (i - 2) * 0.3; sc.add(c); }
    // lights: display glow, warm studio keys, ambient
    const dispGlow = new THREE.PointLight(0x9ab8ff, 30, 24, 1.4); dispGlow.position.set(0, 3.5, -2.5); sc.add(dispGlow);
    const keyL = new THREE.SpotLight(0xfff0d8, 50, 20, 0.6, 0.6, 1.2); keyL.position.set(3, 7, 6); keyL.target.position.set(0, 0.5, 0); keyL.castShadow = true; keyL.shadow.mapSize.set(1024, 1024); sc.add(keyL, keyL.target);
    sc.add(new THREE.HemisphereLight(0x8a90b0, 0x2a2020, 0.65));
    // giant JAX at the desk (only shown in the pull-back reveal)
    const giant = new Character('JAX', { id: '#giant', scale: 1.06 * LK }); giant.root.visible = false; sc.add(giant.root);
    return { scene: sc, display: disp, panel: panel.scr, crew, giant, W, D, T, hinge };
  });
}

// ---------------- RECORD LABEL BOARDROOM ----------------
export function boardroom(ctx) {
  return cached(ctx, 'board', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x05060c);
    const carpet = ptex('boardcarpet', 16, 16, (g, w, h, R) => noiseFill(g, w, h, '#2a2430', 0.06, R), { repeat: [10, 8] });
    const panel = ptex('boardwall', 32, 32, (g, w, h, R) => { noiseFill(g, w, h, '#3a2618', 0.06, R); for (let x = 0; x < w; x += 8) { g.fillStyle = '#2e1e12'; g.fillRect(x, 0, 1, h); } }, { repeat: [5, 2] });
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), lam({ map: carpet })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; sc.add(fl);
    const ce = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), cmat('#1c1a1e')); ce.rotation.x = Math.PI / 2; ce.position.y = 3.4; sc.add(ce);
    for (const [x, z, ry, w] of [[-6, 0, Math.PI / 2, 10], [6, 0, -Math.PI / 2, 10], [0, 5, Math.PI, 12]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 3.4), lam({ map: panel })); m.position.set(x, 1.7, z); m.rotation.y = ry; sc.add(m); }
    // window wall with a night skyline
    const sky = ptex('skyline', 256, 96, (g, w, h, R) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a0c22'); gr.addColorStop(1, '#2a1a3a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let x = 0; x < w;) { const bw = 8 + R() * 18 | 0, bh = 20 + R() * 60 | 0; g.fillStyle = '#0c0d16'; g.fillRect(x, h - bh, bw, bh); for (let yy = h - bh + 3; yy < h - 2; yy += 4) for (let xx = x + 2; xx < x + bw - 2; xx += 3) if (R() > 0.55) { g.fillStyle = R() > 0.8 ? '#ffd27a' : '#f0e2b0'; g.fillRect(xx, yy, 1, 2); } x += bw + 1; } }, { linear: false });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(12, 3.4), new THREE.MeshBasicMaterial({ map: sky, color: new THREE.Color(1.1, 1.1, 1.2) })); win.position.set(0, 1.7, -5); sc.add(win);
    for (let i = -5; i <= 5; i += 2.4) { const mu = box(0.08, 3.4, 0.08, cmat('#111'), 'bottom'); mu.position.set(i, 0, -4.95); sc.add(mu); }
    // table + chairs
    const tbl = new THREE.Group(); tbl.add(at(box(5.2, 0.08, 1.6, cmat('#2a1810', 0.08), 'bottom'), 0, 0.74, 0)); tbl.add(at(box(4.4, 0.72, 0.5, cmat('#1c100a'), 'bottom'), 0, 0, 0)); tbl.position.set(0, 0, -0.5); sc.add(tbl);
    const chairs = []; for (const sz of [-1, 1]) for (let i = 0; i < 3; i++) { const ch = new THREE.Group(); ch.add(at(box(0.55, 0.08, 0.55, cmat('#111'), 'bottom'), 0, 0.46, 0)); ch.add(at(box(0.55, 0.7, 0.08, cmat('#111'), 'bottom'), 0, 0.5, -0.26)); ch.add(at(box(0.06, 0.46, 0.06, cmat('#333'), 'bottom'), 0, 0, 0)); ch.position.set(-1.6 + i * 1.6, 0, -0.5 + sz * 1.25); ch.rotation.y = sz > 0 ? Math.PI : 0; sc.add(ch); chairs.push(ch); }
    // gold records + fictional label sign + a wall TV
    for (let i = 0; i < 4; i++) { const fr = new THREE.Group(); fr.add(box(0.7, 0.9, 0.05, cmat('#1a1a1a'))); const d = cyl(0.25, 0.25, 0.01, 18, lam({ color: 0xe8c33a, emissive: 0x332200 })); d.rotation.x = Math.PI / 2; d.position.z = 0.03; fr.add(d); fr.position.set(-5.96, 1.9, -3 + i * 1.3); fr.rotation.y = Math.PI / 2; sc.add(fr); }
    const signT = ptex('labelsign', 128, 32, (g, w, h) => { g.fillStyle = '#e8c33a'; g.font = `800 20px ${COND}`; g.textAlign = 'center'; g.fillText('BIG LABEL RECORDS', w / 2, 23); g.fillRect(14, 27, w - 28, 2); }, { linear: true });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshBasicMaterial({ map: signT, transparent: true, color: new THREE.Color(1.6, 1.4, 1.0), toneMapped: false })); sign.rotation.y = -Math.PI / 2; sign.position.set(5.96, 2.5, -1); sc.add(sign);
    const tv = new P.Screen(384, 216, 1.2); const tvm = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.35), tv.mat); tvm.position.set(5.95, 1.5, -1); tvm.rotation.y = -Math.PI / 2; sc.add(tvm);
    const papers = new THREE.Group(); for (let i = 0; i < 24; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.29), lam({ color: 0xf2f0ea, side: THREE.DoubleSide })); papers.add(p); } papers.visible = false; sc.add(papers);
    const lamp = new THREE.PointLight(0xffd7a0, 14, 10, 1.4); lamp.position.set(0, 3.0, -0.5); lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); sc.add(lamp);
    sc.add(new THREE.HemisphereLight(0x5a5a8a, 0x201810, 0.6));
    const cityL = new THREE.PointLight(0x7a7aff, 8, 9, 1.5); cityL.position.set(0, 1.8, -4); sc.add(cityL);
    return { scene: sc, tv, papers, chairs, tableY: 0.82 };
  });
}

// ---------------- LANDFILL at dusk ----------------
export function landfill(ctx) {
  return cached(ctx, 'landfill', () => {
    const sc = new THREE.Scene(); sc.fog = new THREE.Fog(0xe0a0a8, 30, 120);
    sc.add(skyDome('#3a2a6a', '#e98aa6', '#ffd0a0'));
    const sun = new THREE.Mesh(new THREE.CircleGeometry(10, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.2, 1.4), fog: false, toneMapped: false })); sun.position.set(-60, 14, -200); sc.add(sun);
    lights(sc, { hemiSky: 0xffc2c8, hemiGround: 0x4a3a40, hemi: 1.05, sun: 0xffb890, sunI: 2.0, sunPos: [-14, 8, -20], area: 24 });
    const trashTop = ptex('trashtop', 16, 16, (g, w, h, R) => { noiseFill(g, w, h, '#4a4040', 0.15, R); const cols = ['#c4f03a', '#ff63b0', '#4a5cff', '#f5efe0', '#2a2a30', '#8a6a4a', '#1c1c22']; for (let i = 0; i < 26; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect(R() * w | 0, R() * h | 0, 1 + R() * 3 | 0, 1 + R() * 2 | 0); } });
    const mats = [lam({ map: trashTop }), lam({ map: trashTop }), lam({ map: trashTop }), lam({ map: trashTop }), lam({ map: trashTop }), lam({ map: trashTop })];
    const height = (x, z) => Math.max(0, Math.round(fbm2(x * 0.08 + 5, z * 0.08, 3, 11) * 4 + 1.2 - Math.max(0, 6 - Math.hypot(x, z - 2)) * 0.3));
    sc.add(voxelTerrain({ x0: -40, x1: 40, z0: -40, z1: 25, height, mats, depth: 2 }));
    const R = rng(23); const bags = [];
    for (let i = 0; i < 70; i++) { const x = (R() - 0.5) * 30, z = -12 + R() * 22; const y = height(x, z); let o;
      const k = i % 7; if (k < 3) o = Q.trashBag(['#18181e', '#2a2a6a', '#3a2a1a', '#c4f03a'][i % 4], 0.8 + R() * 0.6, i); else if (k === 3) o = Q.disc('cd', ['#ff63b0', '#4a5cff', '#c4f03a'][i % 3]); else if (k === 4) o = Q.disc('cassette', '#ff63b0'); else if (k === 5) o = Q.disc('vinyl', '#c4f03a'); else o = Q.phone();
      o.position.set(x, y + (k >= 3 ? 0.05 : 0), z); o.rotation.set(k >= 3 ? -Math.PI / 2 + (R() - 0.5) * 0.6 : 0, R() * 6, (R() - 0.5) * 0.5); if (k >= 3) o.scale.setScalar(2.2); sc.add(o); bags.push(o); }
    // gulls
    const gulls = new THREE.Group(); const gm = lam({ color: 0xf2f0ea, side: THREE.DoubleSide });
    for (let i = 0; i < 9; i++) { const gg = new THREE.Group(); for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.14), gm); w.position.x = s * 0.25; gg.add(w); gg.userData['w' + s] = w; } gg.userData.ph = i * 0.7; gulls.add(gg); } sc.add(gulls);
    const hero = Q.trashBag('#18181e', 1.6, 77); hero.position.set(0, height(0, 2) + 0.0, 2); sc.add(hero);
    return { scene: sc, gulls, height, hero,
      updGulls(t) { gulls.children.forEach((g, i) => { const a = t * 0.35 + g.userData.ph; g.position.set(Math.cos(a) * (9 + i), 9 + Math.sin(t * 0.8 + i) * 1.5, -6 + Math.sin(a) * (7 + i)); g.rotation.y = -a; const f = Math.sin(t * 9 + i) * 0.6; g.userData['w-1'].rotation.z = f; g.userData['w1'].rotation.z = -f; }); } };
  });
}

// ---------------- SPACE: the technological singularity ----------------
export function space(ctx) {
  return cached(ctx, 'space', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x020106);
    sc.add(stars(2200, 380, 17)); sc.add(stars(900, 300, 31));
    const neb = ptex('nebula', 128, 128, (g, w, h, R) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { const x = R() * w, y = h * 0.5 + (R() - 0.5) * h * 0.5 * R(); const r = 4 + R() * 18; const gr = g.createRadialGradient(x, y, 0, x, y, r); const c = [C.pink, C.volt, '#8a3aff'][i % 3]; gr.addColorStop(0, c + '30'); gr.addColorStop(1, c + '00'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } }, { linear: true });
    const nb = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshBasicMaterial({ map: neb, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); nb.position.z = -250; sc.add(nb);
    const holeG = new THREE.Group(); holeG.position.set(0, 0, -30); sc.add(holeG);
    const hole = new THREE.Mesh(new THREE.SphereGeometry(4, 20, 14), new THREE.MeshBasicMaterial({ color: 0x000000 })); holeG.add(hole);
    const diskT = ptex('disk', 128, 8, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.12, 'rgba(255,220,150,1)'); gr.addColorStop(0.35, 'rgba(255,99,176,0.9)'); gr.addColorStop(0.7, 'rgba(74,92,255,0.5)'); gr.addColorStop(1, 'rgba(74,92,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 3) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, 0, 1, h); } }, { linear: true });
    const dg = new THREE.RingGeometry(4.6, 15, 72, 1); const uv = dg.attributes.uv, pp = dg.attributes.position; for (let i = 0; i < pp.count; i++) { const r = Math.hypot(pp.getX(i), pp.getY(i)); uv.setXY(i, (r - 4.6) / 10.4, 0.5); }
    const disk = new THREE.Mesh(dg, new THREE.MeshBasicMaterial({ map: diskT, color: new THREE.Color(2.2, 2, 2), transparent: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })); disk.rotation.x = -Math.PI / 2 + 0.22; holeG.add(disk);
    const halo = new THREE.Mesh(new THREE.RingGeometry(4.05, 4.9, 72, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.4, 1.8), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); holeG.add(halo);
    const arc = new THREE.Mesh(dg.clone(), disk.material); arc.rotation.x = 0.0; arc.scale.set(1, 0.38, 1); arc.position.z = -0.1; holeG.add(arc);
    const planet = new THREE.Mesh(new THREE.IcosahedronGeometry(3, 1), lam({ color: new THREE.Color(C.slime), flat: true })); planet.position.set(-22, 8, -60); sc.add(planet);
    const moonP = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 1), lam({ color: new THREE.Color(C.pink), flat: true })); moonP.position.set(26, -6, -45); sc.add(moonP);
    // music notes spiralling in
    const noteT = ptex('note', 32, 32, (g, w, h) => { g.fillStyle = '#fff'; g.font = `700 28px ${SANS}`; g.textAlign = 'center'; g.fillText('♪', w / 2, 26); }, { linear: true });
    const notes = []; const R = rng(5); for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: noteT, transparent: true, color: new THREE.Color([C.slime, C.pink, C.bone][i % 3]).multiplyScalar(1.6), depthWrite: false, toneMapped: false })); m.userData = { a: R() * 6.28, r: 8 + R() * 18, y: (R() - 0.5) * 6, sp: 0.3 + R() * 0.5 }; holeG.add(m); notes.push(m); }
    sc.add(new THREE.HemisphereLight(0xb090ff, 0x100820, 0.9));
    const dl = new THREE.DirectionalLight(0xffd0e0, 1.6); dl.position.set(0, 2, -20); sc.add(dl);
    return { scene: sc, holeG, disk, halo, notes, planet,
      upd(t) { disk.rotation.z = t * 0.25; arc.rotation.z = -t * 0.2; notes.forEach(n => { const u = n.userData; const a = u.a + t * u.sp * 1.6; const r = u.r * (1 - ((t * 0.05 + u.a) % 1) * 0.6); n.position.set(Math.cos(a) * r, u.y * (r / 26), Math.sin(a) * r * 0.4); n.lookAt(0, 0, 60); }); planet.rotation.y = t * 0.2; } };
  });
}

// ---------------- PLAZA: everyone scrolling ----------------
export function plaza(ctx) {
  return cached(ctx, 'plaza', () => {
    const sc = new THREE.Scene(); sc.fog = new THREE.Fog(0x0b0a18, 12, 70); sc.background = new THREE.Color(0x070612);
    sc.add(skyDome('#04040c', '#14102a', '#1c1438'));
    lights(sc, { hemiSky: 0x4a4a8a, hemiGround: 0x151020, hemi: 0.5, sun: 0x8080c0, sunI: 0.4, sunPos: [6, 12, 8], area: 20, shadow: false });
    const tiles = ground('plazatiles', '#2a2830', 90, 45, 0.08, (g, w, h) => { g.fillStyle = '#222028'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); }); sc.add(tiles);
    for (let i = -3; i <= 3; i++) { const b = P.cityBlock(300 + i * 13, false); b.position.set(i * 12, 0, -24); sc.add(b); }
    for (const sx of [-1, 1]) for (let j = 0; j < 3; j++) { const b = P.cityBlock(400 + j * 7 + sx * 3, false); b.position.set(sx * 30, 0, -10 + j * 12); sc.add(b); }
    const bills = [0, 1, 2].map(i => { const s = Q.ledWall(9, 5, [480, 270]); s.mesh.position.set(-13 + i * 13, 9.5, -17.5); sc.add(s.mesh); return s.scr; });
    const R = rng(61); const ppl = [];
    for (let i = 0; i < 420; i++) { const x = (R() - 0.5) * 34, z = -14 + R() * 26; if (Math.abs(x) < 1.4 && z > 4 && z < 9) continue; ppl.push({ x, z, ry: (R() - 0.5) * 1.2 + (R() > 0.85 ? Math.PI : 0), h: 1.5 + R() * 0.35, col: ['#2a2a38', '#3a2a30', '#22302c', '#30303a', '#4a3a2a'][i % 5] }); }
    const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(0.44, 1, 0.26), lam({ flat: true }), ppl.length);
    const heads = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.13, 0), lam({ flat: true, emissive: 0x223355 }), ppl.length);
    const phones = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.08, 0.15), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 1.8, 2.4), toneMapped: false, side: THREE.DoubleSide }), ppl.length);
    const m4 = new THREE.Matrix4(), v = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(), e = new THREE.Euler(), col = new THREE.Color();
    ppl.forEach((p, i) => { q.setFromEuler(e.set(0, p.ry, 0)); s.set(1, p.h * 0.62, 1); v.set(p.x, p.h * 0.31, p.z); m4.compose(v, q, s); bodies.setMatrixAt(i, m4); bodies.setColorAt(i, col.set(p.col));
      s.set(1, 1, 1); const fx = Math.sin(p.ry), fz = Math.cos(p.ry); q.setFromEuler(e.set(0.5, p.ry, 0)); v.set(p.x + fx * 0.04, p.h * 0.66 + 0.1, p.z + fz * 0.04); m4.compose(v, q, s); heads.setMatrixAt(i, m4); heads.setColorAt(i, col.set('#c9a78a'));
      q.setFromEuler(e.set(-1.0, p.ry, 0)); v.set(p.x + fx * 0.3, p.h * 0.55, p.z + fz * 0.3); m4.compose(v, q, s); phones.setMatrixAt(i, m4); });
    for (const m of [bodies, heads, phones]) { m.frustumCulled = false; sc.add(m); }
    const lp1 = P.lampPost(true, 0xffd9a0); lp1.position.set(-7, 0, 4); sc.add(lp1); const lp2 = P.lampPost(true, 0xffd9a0); lp2.position.set(8, 0, -2); sc.add(lp2);
    const fill = new THREE.PointLight(0x9ab0ff, 20, 30, 1.2); fill.position.set(0, 6, 8); sc.add(fill);
    return { scene: sc, bills };
  });
}

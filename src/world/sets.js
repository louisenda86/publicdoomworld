// Sets (cached per film): each returns { scene, ...anchors }.
import * as THREE from 'three';
import { box, lam, cmat, at, group, blob } from './kit.js';
import { ptex, shade, noiseFill } from './tex.js';
import { skyDome, stars, moon, lights, voxelTerrain, grassMats, water, tree, ground } from './env.js';
import * as P from './props.js';
import { fbm2, rng, clamp, hash2 } from '../core.js';

const _CACHE = new Map();
function cached(ctx, key, fn) { const c = (ctx && ctx.cache) || _CACHE; if (!c.has(key)) c.set(key, fn()); return c.get(key); }
function room(sc, { w, d, h, wallTex, floorTex, ceil = '#cfc8bc', back = true, front = false, left = true, right = true }) {
  const fm = lam({ map: floorTex }); const wm = lam({ map: wallTex });
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), fm); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; sc.add(fl);
  const ce = new THREE.Mesh(new THREE.PlaneGeometry(w, d), cmat(ceil, 0.04)); ce.rotation.x = Math.PI / 2; ce.position.y = h; sc.add(ce);
  const wall = (W, x, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(W, h), wm); m.position.set(x, h / 2, z); m.rotation.y = ry; m.receiveShadow = true; sc.add(m); return m; };
  if (back) wall(w, 0, -d / 2, 0); if (front) wall(w, 0, d / 2, Math.PI);
  if (left) wall(d, -w / 2, 0, Math.PI / 2); if (right) wall(d, w / 2, 0, -Math.PI / 2);
}

// ---------------- GARAGE (the hub) ----------------
export function garage(ctx) {
  return cached(ctx, 'garage', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x05070c); sc.fog = new THREE.Fog(0x0a0d14, 9, 22);
    const conc = ptex('concrete', 16, 16, (g, w, h, R) => { noiseFill(g, w, h, '#6f6d68', 0.1, R); for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(40,40,40,0.25)'; g.fillRect(R() * w | 0, R() * h | 0, 3, 2); } }, { repeat: [8, 7] });
    const brick = ptex('garagewall', 32, 32, (g, w, h, R) => { noiseFill(g, w, h, '#8a8478', 0.06, R); for (let y = 0; y < h; y += 8) { g.fillStyle = '#6e695f'; g.fillRect(0, y, w, 1); for (let x = (y / 8) % 2 ? 0 : 8; x < w; x += 16) g.fillRect(x, y, 1, 8); } }, { repeat: [5, 2] });
    room(sc, { w: 9, d: 8, h: 3.4, wallTex: brick, floorTex: conc, front: true });
    // the AI monolith, back-centre
    const ai = P.aiBox({ h: 2.3, w: 1.1, d: 0.85 }); ai.g.position.set(0, 0, -2.6); sc.add(ai.g);
    // cables snaking from it
    const cab = cmat('#151515', 0.05);
    for (let i = 0; i < 6; i++) { const c = box(0.05, 0.04, 2.4 + i * 0.3, cab, 'bottom'); c.position.set(-0.4 + i * 0.16, 0.0, -1.2 + i * 0.1); c.rotation.y = (i - 2.5) * 0.18; sc.add(c); }
    // workbench (left wall) with tools, GPUs, laptop
    const wb = P.table(2.6, 0.8, 0.92, '#7a5536'); wb.position.set(-3.9, 0, -0.6); wb.rotation.y = Math.PI / 2; sc.add(wb);
    for (let i = 0; i < 4; i++) { const gp = P.gpu(i); gp.position.set(-3.85 + (i % 2) * 0.12, 0.95 + i * 0.065, -1.4 + i * 0.1); gp.rotation.y = i * 0.3; sc.add(gp); }
    const lap = P.laptop(1.9); lap.g.position.set(-3.8, 0.92, 0.2); lap.g.rotation.y = Math.PI / 2; sc.add(lap.g);
    // pegboard
    const peg = ptex('pegboard', 32, 16, (g, w, h, R) => { noiseFill(g, w, h, '#b48a5a', 0.05, R); for (let y = 1; y < h; y += 3) for (let x = 1; x < w; x += 3) { g.fillStyle = '#6a4f30'; g.fillRect(x, y, 1, 1); } g.fillStyle = '#333'; g.fillRect(4, 3, 1, 8); g.fillRect(10, 4, 5, 1); g.fillRect(20, 2, 2, 9); g.fillStyle = '#c33'; g.fillRect(26, 3, 3, 6); });
    const pb = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.2), lam({ map: peg })); pb.position.set(-4.48, 1.75, -0.6); pb.rotation.y = Math.PI / 2; sc.add(pb);
    // shelves (right wall) with boxes
    for (let s = 0; s < 3; s++) { const sh = box(0.5, 0.04, 2.6, cmat('#5a5a5a'), 'bottom'); sh.position.set(4.2, 0.6 + s * 0.8, -1.2); sc.add(sh); for (let k = 0; k < 4; k++) { if (hash2(s, k) > 0.7) continue; const b = P.gpuBox(1.2); b.position.set(4.2, 0.64 + s * 0.8, -2.2 + k * 0.6); b.rotation.y = Math.PI / 2; sc.add(b); } }
    // side door (right wall, front) — NOVA appears here
    const doorFrame = box(1.2, 2.3, 0.12, cmat('#3a2c22'), 'bottom'); doorFrame.position.set(4.44, 0, 2.3); doorFrame.rotation.y = -Math.PI / 2; sc.add(doorFrame);
    const doorHole = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.15), new THREE.MeshBasicMaterial({ color: 0x0b1530 })); doorHole.position.set(4.37, 1.075, 2.3); doorHole.rotation.y = -Math.PI / 2; sc.add(doorHole);
    // roll-up garage door (front wall)
    const rd = ptex('rolldoor', 16, 32, (g, w, h, R) => { noiseFill(g, w, h, '#a7aaa8', 0.04, R); for (let y = 0; y < h; y += 3) { g.fillStyle = '#7d817f'; g.fillRect(0, y, w, 1); } });
    const rollDoor = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.8), lam({ map: rd })); rollDoor.position.set(0, 1.4, 3.97); rollDoor.rotation.y = Math.PI; sc.add(rollDoor);
    // beanbag + crates + a poster
    const bean = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 1), cmat('#c0392b', 0.1)); bean.scale.set(1.2, 0.6, 1.2); bean.position.set(2.4, 0.25, 0.6); bean.castShadow = true; sc.add(bean);
    for (let i = 0; i < 3; i++) { const c = P.crate(i ? 'GPU' : 'H100', 1); c.position.set(3.0 - i * 0.2, i * 0.45, -2.9); c.rotation.y = i * 0.2; sc.add(c); }
    const poster = ptex('poster_agi', 24, 32, (g, w, h) => { g.fillStyle = '#121a2a'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8d7a0'; g.font = 'bold 7px monospace'; g.fillText('FEEL', 3, 11); g.fillText('THE', 3, 19); g.fillText('AGI', 3, 27); g.fillStyle = '#e33'; g.fillRect(17, 4, 4, 4); });
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1.0), lam({ map: poster })); pm.position.set(-1.9, 1.9, -3.98); sc.add(pm);
    // string lights along the back wall
    const bulbM = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.2, 1.2), toneMapped: false });
    for (let i = 0; i < 18; i++) { const x = -4.2 + i * 0.5; const b = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), bulbM); b.position.set(x, 3.0 - 0.12 * Math.sin((i % 6) / 6 * Math.PI), -3.95); sc.add(b); }
    // casino table (hidden unless the gambling scene)
    const felt = ptex('felt', 16, 16, (g, w, h, R) => noiseFill(g, w, h, '#1f6b3a', 0.06, R));
    const casino = new THREE.Group(); casino.visible = false; sc.add(casino);
    const ct = P.table(2.6, 1.4, 0.85, '#4a2e18'); casino.add(ct); const top = box(2.5, 0.03, 1.3, lam({ map: felt }), 'bottom'); top.position.y = 0.85; casino.add(top);
    const rl = P.roulette(['0%', '1%', '5%', '10%', '20%', '25%', '50%', '70%', '85%', '95%', '99%', '?']); rl.g.position.set(0.5, 0.88, 0); casino.add(rl.g);
    const chipSets = []; for (let i = 0; i < 5; i++) { const c = P.chips(4 + i, ['#d22', '#225', '#ddd', '#2a2', '#e6b422'][i]); c.position.set(-0.8 + i * 0.18, 0.88, 0.35 - (i % 2) * 0.2); casino.add(c); chipSets.push(c); }
    casino.position.set(0, 0, 0.4);
    // lights: warm bulb, cold AI glow, dim moonlight through the door
    const bulb = new THREE.PointLight(0xffc580, 9, 12, 1.5); bulb.position.set(-0.6, 3.1, 0.6); bulb.castShadow = true; bulb.shadow.mapSize.set(1024, 1024); bulb.shadow.bias = -0.002; sc.add(bulb);
    const bulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 3, 1.8), toneMapped: false })); bulbMesh.position.copy(bulb.position); sc.add(bulbMesh);
    const cord = box(0.01, 0.3, 0.01, cmat('#111'), 'bottom'); cord.position.set(-0.6, 3.1, 0.6); sc.add(cord);
    const aiGlow = new THREE.PointLight(0x4a9cff, 5, 7, 1.6); aiGlow.position.set(0, 1.6, -1.6); sc.add(aiGlow);
    const red = new THREE.PointLight(0xff3020, 0, 6, 1.6); red.position.set(0, 1.8, -1.8); sc.add(red);
    sc.add(new THREE.HemisphereLight(0x6070a0, 0x302820, 0.55));
    return { scene: sc, ai, lap, casino, roulette: rl, chipSets, bulb, aiGlow, red, rollDoor, doorPos: [4.2, 0, 2.3] };
  });
}

// ---------------- EXTERIOR NIGHT: cliff town by the sea ----------------
export function exteriorNight(ctx) {
  return cached(ctx, 'extNight', () => {
    const sc = new THREE.Scene(); sc.fog = new THREE.Fog(0x0b1530, 30, 110);
    sc.add(skyDome('#050a1e', '#13265a', '#1d3366')); sc.add(stars(1100)); sc.add(moon([-140, 120, -220], 10));
    const L = lights(sc, { hemiSky: 0x4a62a8, hemiGround: 0x1a2a1a, hemi: 0.75, sun: 0x9fb4ff, sunI: 0.9, sunPos: [-14, 22, -10], area: 26 });
    const height = (x, z) => { if (z < -14) return -3; const b = fbm2(x * 0.07, z * 0.07, 3, 4) * 2.2; return Math.max(0, Math.round(b + (z > 6 ? 0 : 0))); };
    const terr = voxelTerrain({ x0: -40, x1: 40, z0: -14, z1: 30, height, mats: grassMats(false), depth: 3 }); sc.add(terr);
    sc.add(water(400, false, -0.6));
    // cliff face (stone blocks) along z=-14
    const stoneT = ptex('stone', 16, 16, (g, w, h, R) => { noiseFill(g, w, h, '#5f646c', 0.14, R); g.fillStyle = '#4a4e55'; g.fillRect(0, 7, w, 1); g.fillRect(7, 0, 1, 7); });
    const stoneM = lam({ map: stoneT });
    const stones = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), stoneM, 80 * 4); let k = 0; const m4 = new THREE.Matrix4();
    for (let x = -40; x < 40; x++) for (let y = 0; y < 4; y++) { m4.makeTranslation(x + 0.5, -0.5 - y + (hash2(x, y) > 0.8 ? 0.3 : 0), -14.5 - (hash2(x, 9) * 0.6)); stones.setMatrixAt(k++, m4); }
    stones.count = k; sc.add(stones);
    // road
    const road = ptex('road', 16, 16, (g, w, h, R) => { noiseFill(g, w, h, '#2e3136', 0.08, R); g.fillStyle = '#c9b35a'; g.fillRect(7, 0, 2, 6); }, { repeat: [1, 30] });
    const rm = new THREE.Mesh(new THREE.PlaneGeometry(5, 120), lam({ map: road })); rm.rotation.x = -Math.PI / 2; rm.rotation.z = Math.PI / 2; rm.position.set(0, 0.03, 8); rm.receiveShadow = true; sc.add(rm);
    // the house with the garage (lit)
    const hs = P.house({ w: 8, d: 6, h: 3.2, wall: '#b8b0a0', roof: '#4a2a26' }); hs.g.position.set(6, 0, 1); sc.add(hs.g);
    const gdoor = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.4), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.5, 0.8), toneMapped: false })); gdoor.position.set(3.0, 1.2, 4.03); sc.add(gdoor);
    const spill = new THREE.SpotLight(0xffb060, 30, 14, 0.9, 0.7, 1.3); spill.position.set(3, 2.3, 3.6); spill.target.position.set(3, 0, 9); sc.add(spill); sc.add(spill.target);
    const ai2 = P.aiBox({ h: 2.0, w: 0.9, d: 0.7, screen: false }); ai2.g.position.set(3.0, 0, 2.6); sc.add(ai2.g);
    const car = P.car('#2f5f6a'); car.position.set(-3, 0, 6); car.rotation.y = 0.4; sc.add(car);
    const lp = P.lampPost(true); lp.position.set(-1, 0, 11); sc.add(lp);
    for (let i = 0; i < 9; i++) { const tr = tree(30 + i, 1 + hash2(i, 2) * 0.5, false); const x = -30 + i * 7 + hash2(i, 1) * 3, z = -6 + hash2(i, 4) * 26; if (Math.abs(z - 8) < 4 || (x > 0 && x < 12 && z > -3 && z < 6)) continue; tr.position.set(x, Math.round(height(x, z)), z); sc.add(tr); }
    // monolith for the "push" shot (hidden by default)
    const big = P.aiBox({ h: 3.2, w: 1.5, d: 1.2, screen: false }); big.g.visible = false; sc.add(big.g);
    return { scene: sc, house: hs, ai2, big, height, sun: L.sun };
  });
}

// ---------------- NOVA'S BEDROOM ----------------
export function bedroom(ctx) {
  return cached(ctx, 'bedroom', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x05060a);
    const wall = ptex('bedwall', 32, 32, (g, w, h, R) => { noiseFill(g, w, h, '#3d3a5c', 0.05, R); for (let x = 0; x < w; x += 8) { g.fillStyle = '#36334f'; g.fillRect(x, 0, 2, h); } }, { repeat: [4, 2] });
    const floor = ptex('bedfloor', 16, 16, (g, w, h, R) => { noiseFill(g, w, h, '#5a4436', 0.08, R); for (let y = 0; y < h; y += 4) { g.fillStyle = '#4a372b'; g.fillRect(0, y, w, 1); } }, { repeat: [6, 6] });
    room(sc, { w: 6, d: 6, h: 3.0, wallTex: wall, floorTex: floor, ceil: '#2a2840' });
    const b = P.bed(); b.position.set(-1.2, 0, -1.4); b.rotation.y = Math.PI / 2; sc.add(b);
    const board = P.doomBoard(); board.position.set(0.6, 1.65, -2.98); sc.add(board);
    // window with moon
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.1), new THREE.MeshBasicMaterial({ color: 0x1b2d62 })); win.position.set(-2.98, 1.7, -0.2); win.rotation.y = Math.PI / 2; sc.add(win);
    const fr = box(0.06, 1.2, 0.06, cmat('#ddd'), 'center'); fr.position.set(-2.95, 1.7, -0.2); sc.add(fr); const fr2 = box(0.06, 0.06, 1.3, cmat('#ddd'), 'center'); fr2.position.set(-2.95, 1.7, -0.2); sc.add(fr2);
    const mn = new THREE.Mesh(new THREE.CircleGeometry(0.13, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.4, 2.1), toneMapped: false })); mn.position.set(-2.96, 1.95, -0.45); mn.rotation.y = Math.PI / 2; sc.add(mn);
    // desk + CRT monitor glowing red
    const dk = P.table(1.2, 0.6, 0.75, '#3a2c22'); dk.position.set(1.9, 0, -2.4); sc.add(dk);
    const mon = P.crt(); mon.g.scale.setScalar(0.6); mon.g.position.set(1.9, 0.75 - 0.33, -2.45); sc.add(mon.g);
    const moonL = new THREE.DirectionalLight(0x7d9cff, 1.0); moonL.position.set(-6, 4, -1); moonL.castShadow = true; moonL.shadow.mapSize.set(1024, 1024); const c = moonL.shadow.camera; c.left = -4; c.right = 4; c.top = 4; c.bottom = -4; sc.add(moonL);
    const redL = new THREE.PointLight(0xff4a3a, 3.5, 6, 1.6); redL.position.set(1.9, 1.3, -1.8); sc.add(redL);
    const lamp = new THREE.PointLight(0xb58cff, 2.5, 6, 1.5); lamp.position.set(-2, 2.4, 1.2); sc.add(lamp);
    sc.add(new THREE.HemisphereLight(0x5a5a9a, 0x2a2030, 0.6));
    return { scene: sc, mon };
  });
}

// ---------------- DAYTIME MEADOW + BUS STOP ----------------
export function meadow(ctx) {
  return cached(ctx, 'meadow', () => {
    const sc = new THREE.Scene(); sc.fog = new THREE.Fog(0xbfe3f2, 40, 140);
    sc.add(skyDome('#7ec4ea', '#b9e2f4', '#e8f6fb'));
    lights(sc, { hemiSky: 0xcfeaff, hemiGround: 0x6a8a4a, hemi: 1.25, sun: 0xfff1d6, sunI: 2.1, sunPos: [10, 16, 8], area: 22 });
    const height = (x, z) => { if (z < -16) return -3; return Math.max(0, Math.round(fbm2(x * 0.06 + 3, z * 0.06, 3, 7) * 2.4)); };
    sc.add(voxelTerrain({ x0: -40, x1: 40, z0: -16, z1: 30, height: (x, z) => (Math.abs(x) < 6 && z > -4 && z < 6 ? 0 : height(x, z)), mats: grassMats(true), depth: 3 }));
    sc.add(water(400, true, -0.6));
    const pathT = ptex('path', 16, 16, (g, w, h, R) => { noiseFill(g, w, h, '#9b7a55', 0.12, R); }, { repeat: [2, 10] });
    const path = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 40), lam({ map: pathT })); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.02, 6); path.receiveShadow = true; sc.add(path);
    const sh = P.busShelter(); sh.position.set(0, 0, -1.2); sc.add(sh);
    const bs = P.sign('BUS', 0.5, 0.5, '#2f7a3a', '#fff'); bs.position.set(2.2, 0, 0.2); sc.add(bs);
    for (let i = 0; i < 12; i++) { const x = -34 + i * 6 + hash2(i, 1) * 3, z = -12 + hash2(i, 5) * 30; if (Math.abs(x) < 8 && z > -6 && z < 12) continue; const tr = tree(70 + i, 1 + hash2(i, 2) * 0.6, true); tr.position.set(x, Math.round(height(x, z)), z); sc.add(tr); }
    const flowers = new THREE.Group(); for (let i = 0; i < 60; i++) { const f = box(0.06, 0.06, 0.06, cmat(['#f7f1a0', '#ffffff', '#f2a3c0'][i % 3], 0.02), 'bottom'); const x = (hash2(i, 11) - 0.5) * 14, z = (hash2(i, 12) - 0.3) * 12; f.position.set(x, 0, z); flowers.add(f); } sc.add(flowers);
    return { scene: sc };
  });
}

// ---------------- LIVING ROOM with the CRT (reference homage) ----------------
export function livingRoom(ctx) {
  return cached(ctx, 'living', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x05060a);
    const paper = ptex('wallpaper', 32, 32, (g, w, h, R) => { noiseFill(g, w, h, '#2f4a46', 0.05, R); for (let y = 0; y < h; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < w; x += 8) { g.fillStyle = '#3e5c56'; g.fillRect(x + 2, y + 2, 3, 3); g.fillStyle = '#264040'; g.fillRect(x + 3, y + 3, 1, 1); } }, { repeat: [6, 3] });
    const carpet = ptex('carpet', 16, 16, (g, w, h, R) => noiseFill(g, w, h, '#2e3a4a', 0.1, R), { repeat: [10, 10] });
    room(sc, { w: 7, d: 7, h: 3.0, wallTex: paper, floorTex: carpet, ceil: '#2a2a28' });
    const wain = ptex('wainscot', 32, 16, (g, w, h, R) => { noiseFill(g, w, h, '#5a3a22', 0.08, R); for (let x = 0; x < w; x += 4) { g.fillStyle = '#4a2e1a'; g.fillRect(x, 0, 1, h); } g.fillStyle = '#6d4a2c'; g.fillRect(0, 0, w, 2); }, { repeat: [6, 1] });
    for (const [x, z, ry, len] of [[0, -3.48, 0, 7], [-3.48, 0, Math.PI / 2, 7], [3.48, 0, -Math.PI / 2, 7]]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(len, 1.0), lam({ map: wain })); p.position.set(x, 0.5, z); p.rotation.y = ry; sc.add(p); }
    const tv = P.crt(); tv.g.position.set(-2.2, 0, -2.4); tv.g.rotation.y = 0.55; sc.add(tv.g);
    const c1 = P.armchair('#5a3a24'); c1.position.set(0.6, 0, 0.2); c1.rotation.y = -2.32; sc.add(c1);
    const c2 = P.armchair('#4f3a2c'); c2.position.set(1.8, 0, -1.3); c2.rotation.y = -1.84; sc.add(c2);
    const lamp = P.lampFloor(true); lamp.position.set(2.6, 0, -2.6); sc.add(lamp);
    const side = P.table(0.5, 0.5, 0.6, '#4a2e1a'); side.position.set(1.4, 0, 1.5); sc.add(side);
    const door = box(1.0, 2.2, 0.08, cmat('#3a2418'), 'bottom'); door.position.set(3.45, 0, 1.8); door.rotation.y = -Math.PI / 2; sc.add(door);
    const pic = ptex('painting', 24, 18, (g, w, h, R) => { g.fillStyle = '#c8a24a'; g.fillRect(0, 0, w, h); noiseFill(g, w - 4, h - 4, '#2a4a7a', 0.2, R); g.fillStyle = '#c8a24a'; g.fillRect(0, 0, w, 2); });
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.55), lam({ map: pic })); pm.position.set(3.47, 1.9, -1.2); pm.rotation.y = -Math.PI / 2; sc.add(pm);
    const tvL = new THREE.PointLight(0x9cc8ff, 3.0, 6, 1.6); tvL.position.set(-1.7, 1.0, -1.7); sc.add(tvL);
    sc.add(new THREE.HemisphereLight(0x5a6a8a, 0x2a2420, 0.6));
    return { scene: sc, tv, tvL, chairs: [c1, c2] };
  });
}

// ---------------- PLAYGROUND with the sandbox ----------------
export function playground(ctx) {
  return cached(ctx, 'playground', () => {
    const sc = new THREE.Scene(); sc.fog = new THREE.Fog(0x0c1428, 14, 60);
    sc.add(skyDome('#060b20', '#122458', '#1a2f60')); sc.add(stars(900, 380, 9)); sc.add(moon([120, 140, -200], 8));
    lights(sc, { hemiSky: 0x4a62a8, hemiGround: 0x1a2a1a, hemi: 0.7, sun: 0x9fb4ff, sunI: 0.8, sunPos: [10, 18, -6], area: 16 });
    sc.add(voxelTerrain({ x0: -30, x1: 30, z0: -30, z1: 30, height: (x, z) => (Math.hypot(x, z) < 12 ? 0 : Math.max(0, Math.round(fbm2(x * 0.08, z * 0.08, 3, 2) * 2.5))), mats: grassMats(false), depth: 2 }));
    const sb = P.sandbox(3.6); sc.add(sb);
    const ai = P.aiBox({ h: 1.7, w: 0.85, d: 0.7 }); ai.g.position.set(0, 0.18, -0.2); sc.add(ai.g);
    // glowing boundary tape around the sandbox
    const tapeM = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.2, 0.3), toneMapped: false });
    const tape = new THREE.Group(); for (const [x, z, w, d] of [[0, 2.4, 5.0, 0.07], [0, -2.4, 5.0, 0.07], [2.5, 0, 0.07, 4.8], [-2.5, 0, 0.07, 4.8]]) { const t = box(w, 0.02, d, tapeM, 'bottom'); t.position.set(x, 0.01, z); tape.add(t); } sc.add(tape);
    const sl = P.slide(); sl.position.set(-5.5, 0, -2.5); sl.rotation.y = 0.6; sc.add(sl);
    const lp = P.lampPost(true); lp.position.set(3.4, 0, -2.8); lp.rotation.y = Math.PI * 0.85; sc.add(lp);
    const wall = P.graffitiWall('TIDAK MAU'); wall.position.set(0, 0, -7); sc.add(wall);
    const fc = P.fence(10); fc.position.set(-4, 0, 5.5); sc.add(fc);
    const bs = P.bench(1.6); bs.position.set(4.5, 0, 1.5); bs.rotation.y = -Math.PI / 2; sc.add(bs);
    const warn = P.sign('DO NOT CROSS', 1.3, 0.5, '#f4d03f', '#111'); warn.position.set(2.7, 0, 2.6); warn.rotation.y = -0.4; sc.add(warn);
    for (let i = 0; i < 6; i++) { const tr = tree(90 + i, 1.1, false); const a = i / 6 * Math.PI * 2 + 0.4; tr.position.set(Math.cos(a) * 13, 0, Math.sin(a) * 13); sc.add(tr); }
    return { scene: sc, ai, tape, tapeM };
  });
}

// ---------------- NIGHT MARKET (GPU stall) ----------------
export function market(ctx) {
  return cached(ctx, 'market', () => {
    const sc = new THREE.Scene(); sc.fog = new THREE.Fog(0x0b0f1c, 10, 40); sc.background = new THREE.Color(0x070a14);
    sc.add(skyDome('#04060f', '#0c1430', '#121c3a'));
    lights(sc, { hemiSky: 0x404a80, hemiGround: 0x181818, hemi: 0.6, sun: 0x8090c0, sunI: 0.5, sunPos: [6, 12, 8], area: 14 });
    const asphalt = ground('asphalt', '#2a2c31', 80, 40, 0.1, (g, w, h, R) => { if (R() > 0.5) { g.fillStyle = '#3a3c41'; g.fillRect(R() * w | 0, R() * h | 0, 2, 1); } }); sc.add(asphalt);
    const st = P.marketStall('GPUs'); st.position.set(0, 0, -1); sc.add(st);
    // shop fronts behind
    for (let i = -3; i <= 3; i++) { if (i === 0) continue; const cb = box(3.6, 4 + hash2(i, 2) * 3, 2, cmat(['#3a3550', '#40343a', '#2f3b47'][(i + 3) % 3], 0.06), 'bottom'); cb.position.set(i * 3.7, 0, -4.5); sc.add(cb); const sgn = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.5), new THREE.MeshBasicMaterial({ color: new THREE.Color(...[[2.4, 0.4, 1.2], [0.4, 1.6, 2.6], [2.6, 1.6, 0.3]][(i + 3) % 3]), toneMapped: false })); sgn.position.set(i * 3.7, 3.0, -3.49); sc.add(sgn); }
    const lp1 = P.lampPost(true, 0xffe0b0); lp1.position.set(-4.5, 0, 2); sc.add(lp1);
    const lp2 = P.lampPost(true, 0xffe0b0); lp2.position.set(5, 0, 2.5); lp2.rotation.y = Math.PI; sc.add(lp2);
    return { scene: sc };
  });
}

// ---------------- SUBURB: house + lawn at night ----------------
export function suburb(ctx) {
  return cached(ctx, 'suburb', () => {
    const sc = new THREE.Scene(); sc.fog = new THREE.Fog(0x0b1530, 18, 70);
    sc.add(skyDome('#050a1e', '#13265a', '#1d3366')); sc.add(stars(900, 380, 5)); sc.add(moon([-90, 130, -200], 8));
    lights(sc, { hemiSky: 0x4a62a8, hemiGround: 0x1a2a1a, hemi: 0.7, sun: 0x9fb4ff, sunI: 0.8, sunPos: [-8, 16, 10], area: 18 });
    sc.add(voxelTerrain({ x0: -30, x1: 30, z0: -20, z1: 30, height: () => 0, mats: grassMats(false), depth: 1 }));
    const hs = P.house({ w: 7, d: 6, h: 3.0, wall: '#d9cdb0', roof: '#7a3b2e' }); hs.g.position.set(0, 0, -4); sc.add(hs.g);
    const drive = ground('drive', '#6f6d68', 3, 1, 0.08); drive.geometry = new THREE.PlaneGeometry(3, 14); drive.position.set(5, 0.02, 2); sc.add(drive);
    const vn = P.van('#e9e6dc', 'FLAME EXPRESS'); vn.position.set(9, 0, 6); vn.rotation.y = Math.PI / 2 + 0.2; sc.add(vn);
    const lp = P.lampPost(true); lp.position.set(-6, 0, 6); sc.add(lp);
    const mailbox = box(0.3, 1.1, 0.4, cmat('#3a5a8a'), 'bottom'); mailbox.position.set(2.2, 0, 4.2); sc.add(mailbox);
    for (let i = 0; i < 6; i++) { const tr = tree(120 + i, 1.1, false); tr.position.set(-14 + i * 6 + hash2(i, 3) * 2, 0, -10 - hash2(i, 4) * 6); sc.add(tr); }
    // fire: emissive flicker planes in windows + orange light + smoke puffs (hidden until needed)
    const fireL = new THREE.PointLight(0xff6a20, 0, 10, 1.4); fireL.position.set(0, 1.6, -0.6); sc.add(fireL);
    const smoke = new THREE.Group(); for (let i = 0; i < 10; i++) { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6 + hash2(i, 1) * 0.5, 0), new THREE.MeshLambertMaterial({ color: 0x3a3a40, transparent: true, opacity: 0.75 })); smoke.add(p); } smoke.visible = false; sc.add(smoke);
    const crates = new THREE.Group(); sc.add(crates);
    // flames: additive flickering cones in the windows and over the roof (driven by setFire)
    const flameM = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 1.2, 0.25), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const flameM2 = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.5, 2.6, 0.6), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const flames = new THREE.Group(); const spots = [];
    for (const x of [-2.2, 2.2]) for (let k = 0; k < 4; k++) spots.push([x - 0.35 + k * 0.23, 1.15, -0.9, 0.35]);
    for (let k = 0; k < 9; k++) spots.push([-2.6 + k * 0.65, 4.0 + (k % 2) * 0.3, -3.2 + (k % 3) * 0.4, 0.9]);
    spots.forEach(([x, y, z, s], i) => { const f = new THREE.Mesh(new THREE.ConeGeometry(0.22 * s, 1.0 * s, 5), i % 2 ? flameM : flameM2); f.position.set(x, y + 0.5 * s, z); f.userData = { base: [x, y, z, s], ph: hash2(i, 7) * 6.28 }; flames.add(f); });
    flames.visible = false; sc.add(flames);
    const setFire = (level, t) => { flames.visible = level > 0.01; flames.children.forEach((f, i) => { const d = f.userData; const fl = 0.7 + 0.3 * Math.sin(t * 17 + d.ph) + 0.15 * Math.sin(t * 31 + d.ph * 2); const s = d.base[3] * level * fl; f.scale.set(level * (0.8 + 0.2 * fl), Math.max(0.01, level * fl * 1.2), level * (0.8 + 0.2 * fl)); f.position.y = d.base[1] + 0.5 * d.base[3] * level * fl; }); };
    return { scene: sc, house: hs, fireL, smoke, crates, flames, setFire };
  });
}

// ---------------- UTOPIA CITY at sunrise ----------------
export function utopia(ctx) {
  return cached(ctx, 'utopia', () => {
    const sc = new THREE.Scene(); sc.fog = new THREE.Fog(0xf3c9a8, 40, 180);
    sc.add(skyDome('#7fb2e0', '#f6c7a2', '#ffe6c4'));
    const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(14, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.6, 1.6), toneMapped: false, fog: false })); sunDisc.position.set(40, 22, -300); sc.add(sunDisc);
    lights(sc, { hemiSky: 0xffe2c4, hemiGround: 0x6a8a6a, hemi: 1.1, sun: 0xffcf9a, sunI: 2.4, sunPos: [20, 10, -30], area: 60 });
    sc.add(voxelTerrain({ x0: -60, x1: 60, z0: -80, z1: 30, height: () => 0, mats: grassMats(true), depth: 1 }));
    for (let i = -4; i <= 4; i++) for (let j = -7; j <= 1; j++) { if (i === 0 && j > -2) continue; const b = P.cityBlock(i * 31 + j * 7 + 100, true); b.position.set(i * 12, 0, j * 11); sc.add(b); }
    const turbines = []; for (let i = 0; i < 6; i++) { const wt = P.windTurbine(1.2); wt.g.position.set(-70 + i * 26, 0, -95 - (i % 2) * 10); sc.add(wt.g); turbines.push(wt); }
    const river = new THREE.Mesh(new THREE.PlaneGeometry(8, 200), lam({ color: 0x6fb7e0, emissive: 0x204060 })); river.rotation.x = -Math.PI / 2; river.position.set(0, 0.03, -30); sc.add(river);
    return { scene: sc, turbines };
  });
}

// ---------------- BLUE VOID (3D objects on the reference's light-blue card) ----------------
export function blueVoid(ctx, key = 'void') {
  return cached(ctx, 'blue:' + key, () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0xa6d7e6);
    lights(sc, { hemiSky: 0xffffff, hemiGround: 0x9ab8c4, hemi: 1.4, sun: 0xffffff, sunI: 1.6, sunPos: [4, 10, 7], area: 10 });
    const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.18 })); shadowCatcher.rotation.x = -Math.PI / 2; shadowCatcher.receiveShadow = true; sc.add(shadowCatcher);
    return { scene: sc, floor: shadowCatcher };
  });
}

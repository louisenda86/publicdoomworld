// THE DEATH OF INTERESTING THINGS — exterior + abstract sets: Hollywood, the Greek shore (The Odyssey), the graveyard
// of dead things, a voxel parkour run (the "Minecraft underneath"), the recommendation-feed maze, the recap economy,
// the data void, the factory of the extraordinary.
import * as THREE from 'three';
import { box, lam, basic, cmat, at, cyl, soft, phong } from './kit.js';
import { ptex, shade, noiseFill, textTex } from './tex.js';
import { lights, skyDome, stars, moon, voxelTerrain, grassMats, tree } from './env.js';
import * as P from './props.js';
import * as P2 from './props2.js';
import * as R3 from './props3.js';
import { glow, add } from './props3.js';
import { cached } from './sets3.js';
import * as Q from './props5.js';
import { text3d } from './glyph3d.js';
import { rng, clamp, hash2, fbm2 } from '../core.js';
import { C, HEL, JP, UI, MONO, TIMES, COND } from '../ov/overlay.js';
import { neon } from './sets5.js';

const M = (hex, amp = 0.05, extra) => cmat(hex, amp, extra);
const sh = g => { g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
function heightfield(size, segs, hfn, col, key, amp = 0.08) {
  const geo = new THREE.PlaneGeometry(size, size, segs, segs); geo.rotateX(-Math.PI / 2); const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, hfn(p.getX(i), p.getZ(i)));
  geo.computeVertexNormals(); const m = new THREE.Mesh(geo, lam({ map: ptex(key, 32, 32, (g, w, h, R) => noiseFill(g, w, h, col, amp, R), { repeat: [size / 8, size / 8] }) })); m.receiveShadow = true; m.castShadow = true; return m;
}

// ---------------- HOLLYWOOD: hills + sign, a boulevard with palms, Walk-of-Fame stars and a marquee cinema ----------------
export function hollywood(ctx) {
  return cached(ctx, 'hollywood', () => {
    const sc = new THREE.Scene(); sc.fog = new THREE.Fog(0xd88a7a, 60, 260); sc.background = new THREE.Color(0xe89a7a);
    sc.add(skyDome('#5a4a9a', '#e8807a', '#ffc89a'));
    const hf = (x, z) => { const d = Math.max(0, -z - 30); return Math.min(1, d / 40) * (18 + fbm2(x * 0.015, z * 0.015, 3, 4) * 22) - 0.3; }; const hills = heightfield(320, 64, hf, '#8a7a5a', 'hwhills', 0.1); hills.position.z = -40; sc.add(hills);
    // sign: white letters on the hillside
    const sign = new THREE.Group(); sign.position.set(-6, 0, -118); sc.add(sign);
    const letters = 'HOLLYWOOD'; const lm = lam({ color: new THREE.Color('#fbf8f2'), emissive: 0x302a24 }); let baseY = -1e9; for (let i = 0; i < letters.length; i++) for (let k = 0; k <= 8; k++) baseY = Math.max(baseY, hf(-34 + i * 8.1 - 6 + k, -118 + 40 + 2));
    for (let i = 0; i < letters.length; i++) { const L = text3d(letters[i], { font: `800 200px ${HEL}`, px: 200, depth: 0.4, bevel: 0.0, unit: 9, mats: [lm, M('#cfc8bc')] }); const lx = -34 + i * 8.1; L.position.set(lx, baseY + 0.6 + Math.sin(i * 0.9) * 0.5, 0); L.rotation.set(-0.08, 0, (hash2(i, 3) - 0.5) * 0.06); L.castShadow = true; sign.add(L); for (const sx of [-1, 1]) add(sign, box(0.25, 5, 0.25, M('#7a7468')), lx + 3 + sx * 1.8, L.position.y - 1.5, -0.6); }
    // boulevard
    const road = new THREE.Mesh(new THREE.PlaneGeometry(200, 12), lam({ map: ptex('hwroad', 32, 32, (g, w, h, R) => { noiseFill(g, w, h, '#2a2a30', 0.08, R); g.fillStyle = '#e8d07a'; for (let x = 0; x < w; x += 8) g.fillRect(x, 15, 4, 1); }, { repeat: [25, 1] }) })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, 0); road.receiveShadow = true; sc.add(road);
    const walkT = ptex('walkfame', 64, 64, (g, w, h, R) => { noiseFill(g, w, h, '#3a2e30', 0.05, R); g.fillStyle = '#5a4a4c'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); g.fillStyle = '#e88aa0'; g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 9 : 22; g.lineTo(32 + Math.cos(a) * r, 30 + Math.sin(a) * r); } g.fill(); g.strokeStyle = '#e8c87a'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#e8c87a'; g.fillRect(24, 28, 16, 3); }, { repeat: [60, 2] });
    for (const z of [-8, 8]) { const sw = new THREE.Mesh(new THREE.PlaneGeometry(200, 4), lam({ map: walkT })); sw.rotation.x = -Math.PI / 2; sw.position.set(0, 0.06, z); sw.receiveShadow = true; sc.add(sw); add(sc, box(200, 0.06, 0.2, M('#b8b0a8')), 0, 0.03, z > 0 ? 6.05 : -6.05); }
    for (let i = 0; i < 14; i++) { const p = Q.palm(i + 3, 9 + hash2(i, 5) * 4); p.position.set(-60 + i * 9.5, 0, i % 2 ? -9.5 : 9.5); sc.add(p); }
    // cinema with a live marquee (left side of the road, facing +z)
    const cin = new THREE.Group(); cin.position.set(6, 0, -14); sc.add(cin);
    add(cin, box(16, 9, 8, [M('#c8a07a'), M('#c8a07a'), M('#8a6a4a'), M('#111'), lam({ map: ptex('cinfront', 64, 32, (g, w, h, R) => { noiseFill(g, w, h, '#d8b088', 0.05, R); for (let x = 2; x < w; x += 8) { g.fillStyle = '#b88a62'; g.fillRect(x, 0, 2, h); } g.fillStyle = '#1a1210'; g.fillRect(20, 20, 24, 12); }) }), M('#c8a07a')], 'bottom'), 0, 0, 0);
    const marquee = new P.Screen(768, 192, 1.35); const mq = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.5), marquee.mat); mq.position.set(0, 5.2, 4.95); mq.userData.noSelf = true; cin.add(mq);
    add(cin, box(10.6, 0.25, 2.2, M('#2a2220'), 'bottom'), 0, 3.85, 5.0); add(cin, box(10.6, 3.2, 0.15, M('#2a2220'), 'center'), 0, 5.2, 4.85);
    const bulbs = glow('#ffe2a0', 3); for (let i = 0; i < 26; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), bulbs); b.position.set(-5.1 + i * 0.408, 6.55, 5.0); cin.add(b); const b2 = b.clone(); b2.position.y = 3.85; cin.add(b2); }
    const vert = neon('CINEMA', '#ff3b5b', { font: `900 80px ${COND}`, size: [3.6, 0.9], k: 3 }); vert.rotation.z = Math.PI / 2; vert.position.set(-6.5, 6.4, 5.1); cin.add(vert);
    const doors = box(5, 2.8, 0.05, phong({ color: 0x20242a, spec: 0x8899aa, shin: 90 }), 'bottom'); doors.position.set(0, 0, 4.03); cin.add(doors);
    // a billboard + lamp posts
    const bill = new P.Screen(512, 256, 1.2); const bm = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.5), bill.mat); bm.position.set(-22, 11, -12); bm.rotation.y = 0.35; bm.userData.noSelf = true; sc.add(bm); add(sc, box(0.4, 9, 0.4, M('#444')), -22, 4.5, -12.6);
    for (let i = 0; i < 8; i++) { const lp = P.lampPost(true); lp.position.set(-40 + i * 11, 0, i % 2 ? -6.6 : 6.6); sc.add(lp); }
    const L = lights(sc, { hemiSky: 0xffc0a0, hemiGround: 0x5a3a3a, hemi: 1.05, sun: 0xffb27a, sunI: 2.0, sunPos: [-40, 18, -20], area: 40 });
    sh(cin);
    return { scene: sc, marquee, bill, sign, cinema: cin, sun: L.sun, signY: baseY + 5 };
  });
}
// marquee text (two lines of letterboard)
export function drawMarquee(scr, l1, l2, { flick = 0 } = {}) { return scr.draw((g, w, h) => {
  g.fillStyle = '#f6efe0'; g.fillRect(0, 0, w, h); g.fillStyle = '#d8cfbc'; for (let y = 6; y < h; y += 30) g.fillRect(0, y, w, 2);
  g.fillStyle = '#16110f'; g.textAlign = 'center'; g.font = `800 64px ${COND}`; g.fillText(l1, w / 2, 78); g.font = `800 52px ${COND}`; g.fillStyle = '#b8261e'; g.fillText(l2, w / 2, 160);
  if (flick) { g.fillStyle = `rgba(0,0,0,${flick})`; g.fillRect(0, 0, w, h); }
}); }

// ---------------- THE GREEK SHORE: animated sea, beach, cliffs, temple, trireme, cyclops cave, film crew ----------------
export function greekShore(ctx) {
  return cached(ctx, 'greek', () => {
    const sc = new THREE.Scene(); sc.fog = new THREE.Fog(0xe0a080, 60, 300); sc.background = new THREE.Color(0xe8a888);
    const dome = skyDome('#3a4a8a', '#e88a6a', '#ffd2a0'); sc.add(dome);
    const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(9, 24), glow('#ffd8a0', 3.2)); sunDisc.position.set(-60, 22, -260); sc.add(sunDisc);
    // sea: CPU-animated flat-shaded swells
    const N = 72, S = 360; const seaGeo = new THREE.PlaneGeometry(S, S, N, N); seaGeo.rotateX(-Math.PI / 2);
    const seaM = lam({ color: new THREE.Color('#2a6a8a'), flat: true }); const sea = new THREE.Mesh(seaGeo, seaM); sea.receiveShadow = true; sea.position.set(0, 0, -120); sc.add(sea);
    const base = Float32Array.from(seaGeo.attributes.position.array);
    function seaUpdate(t, amp = 1) { const p = seaGeo.attributes.position; for (let i = 0; i < p.count; i++) { const x = base[i * 3], z = base[i * 3 + 2]; p.setY(i, amp * (0.45 * Math.sin(x * 0.09 + t * 0.9) + 0.35 * Math.sin(z * 0.12 - t * 1.1 + x * 0.03) + 0.2 * Math.sin((x + z) * 0.25 + t * 1.7))); } p.needsUpdate = true; seaGeo.computeVertexNormals(); }
    seaUpdate(0);
    // beach + cliffs
    const beach = heightfield(120, 40, (x, z) => -0.6 + (z + 60) * 0.035 + fbm2(x * 0.05, z * 0.05, 2, 3) * 0.4, '#e2c89a', 'sand', 0.06); beach.position.set(0, 0, 40); sc.add(beach);
    for (let i = 0; i < 14; i++) { const r = Q.rock(6 + hash2(i, 1) * 8, i + 7, '#9a8070'); r.position.set(-95 + (i % 7) * 8 + hash2(i, 2) * 6, 2 + hash2(i, 3) * 6, -20 - (i >> 1) * 4 - (i % 2) * 30); r.scale.y = 1.4 + hash2(i, 4); sc.add(r); }
    for (let i = 0; i < 8; i++) { const r = Q.rock(1 + hash2(i, 5) * 1.5, i + 30, '#8a7464'); r.position.set(8 + i * 3, 0, 8 - (i % 3) * 3); sc.add(r); }
    // temple on the headland
    const temple = new THREE.Group(); temple.position.set(-52, 14, -38); sc.add(temple);
    add(temple, box(14, 1.2, 8, M('#d8ccb4'), 'bottom'), 0, -1.2, 0); for (let i = 0; i < 6; i++) for (const z of [-3, 3]) { const c = Q.column(5, 0.4, '#e8dcc4'); c.position.set(-6 + i * 2.4, 0, z); temple.add(c); }
    add(temple, box(14.4, 0.9, 8.4, M('#e2d6be'), 'bottom'), 0, 5.2, 0); const pedS = new THREE.Shape(); pedS.moveTo(-4.3, 0); pedS.lineTo(4.3, 0); pedS.lineTo(0, 1.9); pedS.lineTo(-4.3, 0); const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(pedS, { depth: 14.2, bevelEnabled: false }), M('#e2d6be')); ped.rotation.y = Math.PI / 2; ped.position.set(-7.1, 6.1, 0); temple.add(ped);
    // cyclops cave mouth (dark arch in a big rock)
    const cave = Q.rock(14, 99, '#7a6a5a'); cave.position.set(46, 6, -30); cave.scale.set(1.4, 1.2, 1); sc.add(cave);
    const mouth = new THREE.Mesh(new THREE.CircleGeometry(4.5, 12, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x050302 })); mouth.position.set(40, 0.2, -18.6); mouth.rotation.y = -0.4; sc.add(mouth);
    // the ship
    const ship = Q.trireme({ len: 16 }); ship.home = () => { ship.g.position.set(12, 0.2, -40); ship.g.rotation.y = 0.25; }; ship.home(); sc.add(ship.g);
    // film crew kit on the beach (IMAX camera, director's chair, light)
    const crew = new THREE.Group(); crew.position.set(4, 0.0, 14); sc.add(crew);
    const imax = Q.imaxCamera(); imax.g.rotation.y = Math.PI - 0.35; crew.add(imax.g);
    const dc = P2.directorChair('DIRECTOR'); dc.position.set(2.2, 0, 1.4); dc.rotation.y = Math.PI - 0.5; crew.add(dc);
    const lt = P2.studioLight('#fff2d6', true); lt.position.set(-3, 0, 1.0); lt.rotation.y = Math.PI * 0.8; crew.add(lt);
    // torches
    for (const [x, z] of [[-14, 8], [-10, 4], [14, 2]]) { add(sc, cyl(0.06, 0.08, 2, 6, M('#3a2414')), x, 1, z); const f = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 6), glow('#ff8a2a', 3)); f.position.set(x, 2.2, z); sc.add(f); const pl = new THREE.PointLight(0xff9a4a, 6, 8, 1.6); pl.position.set(x, 2.3, z); sc.add(pl); }
    const L = lights(sc, { hemiSky: 0xffc8a8, hemiGround: 0x4a5a6a, hemi: 1.0, sun: 0xffc08a, sunI: 2.2, sunPos: [-40, 26, -60], area: 50 });
    sh(temple);
    return { scene: sc, sea, seaUpdate, seaM, ship, imax, crew, temple, sunDisc, dome, L };
  });
}

// ---------------- GRAVEYARD of dead things: tombstones in mist, dead tree, moon ----------------
export function graveyard(ctx) {
  return cached(ctx, 'grave', () => {
    const sc = new THREE.Scene(); sc.fog = new THREE.Fog(0x141a24, 6, 34); sc.background = new THREE.Color(0x0c1018);
    sc.add(stars(700, 300, 9)); const mn = moon([-40, 60, -150], 10); sc.add(mn);
    const gr = heightfield(80, 40, (x, z) => fbm2(x * 0.08, z * 0.08, 3, 2) * 0.35, '#2a3a2a', 'gravegrass', 0.14); sc.add(gr);
    const names = [['HOLLYWOOD', '1911 – 2026'], ['MUSIC', '40,000 BC – 2026'], ['YOUTUBE', '2005 – 2026'], ['CREATIVITY', '∞ – 2026'], ['CINEMA', '1895 – 2026'], ['THE NOVEL', '1605 – 2026'], ['RADIO', '1920 – 2026'], ['PAINTING', '40,000 BC – 2026'], ['TELEVISION', '1927 – 2026'], ['ROCK', '1955 – 2026'], ['MEMES', '2007 – 2026'], ['FASHION', '— 2026']];
    const stones = []; const R = rng(4);
    names.forEach(([n, d], i) => { const s = Q.tombstone(n, { sub: d, seed: i + 1, col: ['#8a8c90', '#7a7c80', '#9a9890'][i % 3] }); const row = i < 4 ? 0 : 1; const x = row ? -7 + (i - 4) * 2 + R() * 0.6 : -3.3 + i * 2.2; const z = row ? -4.5 - R() * 2 : -0.4 - (i % 2) * 0.5; s.position.set(x, 0, z); sc.add(s); stones.push(s); });
    // dead tree
    const tr = new THREE.Group(); tr.position.set(6.5, 0, -6); sc.add(tr); const bark = M('#2a2420', 0.1);
    const branch = (par, len, r, depth, seed) => { const b = cyl(r * 0.6, r, len, 5, bark); b.position.y = len / 2; const g = new THREE.Group(); g.add(b); par.add(g); if (depth > 0) for (let k = 0; k < 2; k++) { const c = new THREE.Group(); c.position.y = len; c.rotation.set((hash2(seed, k) - 0.5) * 1.4, hash2(seed, k + 3) * 6, (k ? 1 : -1) * (0.4 + hash2(seed, k + 7) * 0.5)); g.add(c); branch(c, len * 0.7, r * 0.62, depth - 1, seed * 3 + k); } return g; };
    branch(tr, 2.6, 0.28, 4, 5);
    // iron fence
    for (let i = 0; i < 30; i++) { add(sc, box(0.04, 1.2, 0.04, M('#121416')), -15 + i, 0.6, -10); const sp = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 4), M('#121416')); sp.position.set(-15 + i, 1.27, -10); sc.add(sp); } add(sc, box(30, 0.05, 0.05, M('#121416')), 0, 1.05, -10);
    // ground mist
    const mistT = ptex('mist', 64, 64, (g, w, h) => { const rg = g.createRadialGradient(32, 32, 2, 32, 32, 32); rg.addColorStop(0, 'rgba(200,210,230,0.5)'); rg.addColorStop(1, 'rgba(200,210,230,0)'); g.fillStyle = rg; g.fillRect(0, 0, w, h); }, { linear: true });
    const mists = []; for (let i = 0; i < 18; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(7, 2.2), new THREE.MeshBasicMaterial({ map: mistT, transparent: true, opacity: 0.4, depthWrite: false, color: new THREE.Color(0.7, 0.75, 0.9) })); m.position.set(-12 + (i % 6) * 5, 0.5, -8 + (i / 6 | 0) * 4); m.userData.ph = i * 1.3; sc.add(m); mists.push(m); }
    const L = lights(sc, { hemiSky: 0x5a6a9a, hemiGround: 0x1a2018, hemi: 0.7, sun: 0x9ab0ff, sunI: 1.1, sunPos: [-10, 14, -12], area: 16 });
    const lantern = new THREE.PointLight(0xffb070, 5, 7, 1.5); lantern.position.set(1, 1.2, 2); sc.add(lantern);
    sh(tr);
    function update(t, cam) { for (const m of mists) { m.position.x += 0; m.material.opacity = 0.28 + 0.12 * Math.sin(t * 0.5 + m.userData.ph); if (cam) m.quaternion.copy(cam.quaternion); } }
    return { scene: sc, stones, update, lantern };
  });
}

// ---------------- voxel parkour: floating blocks over lava (first-person run under the subtitles) ----------------
export function parkour(ctx) {
  return cached(ctx, 'parkour', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x7ab8f0); sc.fog = new THREE.Fog(0x9ad0f8, 20, 80);
    sc.add(skyDome('#5a9ae8', '#9ad0f8', '#d8f0ff'));
    const gm = grassMats(true);
    const lavaT = ptex('lava', 16, 16, (g, w, h, R) => { noiseFill(g, w, h, '#ff6a1a', 0.2, R); for (let i = 0; i < 20; i++) { g.fillStyle = '#ffd040'; g.fillRect(R() * w | 0, R() * h | 0, 2, 1); } }, { repeat: [40, 40] });
    const lava = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), basic({ map: lavaT, color: new THREE.Color(1.6, 1.2, 0.9) })); lava.rotation.x = -Math.PI / 2; lava.position.y = -6; sc.add(lava);
    // path of single blocks: positions along z with sideways jitter and small height steps
    const path = []; const R = rng(8); let x = 0, y = 0;
    for (let i = 0; i < 40; i++) { path.push([Math.round(x), y, -i * 2.6]); x += (R() - 0.5) * 2.2; if (R() < 0.3) y += R() < 0.5 ? 1 : -1; y = clamp(y, -1, 3); }
    const geo = new THREE.BoxGeometry(1, 1, 1); const blocks = new THREE.InstancedMesh(geo, gm, path.length);
    const m4 = new THREE.Matrix4(); path.forEach((p, i) => { m4.makeTranslation(p[0], p[1] - 0.5, p[2]); blocks.setMatrixAt(i, m4); }); blocks.castShadow = blocks.receiveShadow = true; sc.add(blocks);
    // big terrain islands in the distance
    const terr = voxelTerrain({ x0: -24, x1: 24, z0: -150, z1: -100, height: (xx, zz) => Math.round(4 + fbm2(xx * 0.08, zz * 0.08, 3, 5) * 6), seed: 3 }); terr.position.y = -6; sc.add(terr);
    const L = lights(sc, { hemiSky: 0xbfe0ff, hemiGround: 0x6a4a2a, hemi: 1.2, sun: 0xfff2d8, sunI: 1.8, sunPos: [10, 20, 8], area: 30 });
    // blocky first-person arm
    const arm = new THREE.Group(); const skin = M('#c89a76', 0.06); add(arm, box(0.18, 0.18, 0.7, skin, 'center'), 0, 0, -0.35);
    return { scene: sc, path, arm };
  });
}

// ---------------- the recommendation feed as a maze (walls tiled with thumbnails; textures supplied by the shot) ----------------
export function feedMaze(ctx, thumbTex) {
  return cached(ctx, 'maze', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x0c0f0f); sc.fog = new THREE.Fog(0x0c0f0f, 8, 40);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), lam({ map: ptex('mazefloor', 32, 32, (g, w, h, R) => { noiseFill(g, w, h, '#16191a', 0.04, R); g.fillStyle = '#20262a'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); }, { repeat: [40, 40] }) })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; sc.add(fl);
    // grid maze from a fixed layout (1 = wall), cell 3 m
    const G = ['1111111111111', '1000100000001', '1010101111101', '1010001000101', '1011111010101', '1000000010001', '1110111110111', '1000100000101', '1011101110101', '1000001000001', '1111111111101'];
    const walls = []; const cell = 3, hW = 2.8;
    const mats = thumbTex.map(t => lam({ map: t, emissive: 0xffffff, emissiveMap: t, ei: 0.75 }));
    let k = 0; const side = M('#0c0f0f');
    for (let r = 0; r < G.length; r++) for (let c = 0; c < G[r].length; c++) if (G[r][c] === '1') { const mt = mats[k++ % mats.length]; const b = new THREE.Mesh(new THREE.BoxGeometry(cell, hW, cell), [mt, mt, side, side, mt, mt]); b.position.set((c - 6) * cell, hW / 2, (r - 5) * cell); b.castShadow = b.receiveShadow = true; sc.add(b); walls.push(b); }
    sc.add(new THREE.HemisphereLight(0xa6d7e6, 0x2a3236, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(10, 30, 14); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); { const c = key.shadow.camera; c.left = -24; c.right = 24; c.top = 24; c.bottom = -24; c.near = 1; c.far = 80; } sc.add(key);
    return { scene: sc, grid: G, cell, cellPos: (r, c) => [(c - 6) * cell, 0, (r - 5) * cell] };
  });
}

// ---------------- the recap economy: one film reel at the centre, rings of orbiting videos ----------------
export function economy(ctx, thumbTex) {
  return cached(ctx, 'economy', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x0c0f0f);
    sc.add(stars(900, 200, 3));
    const reel = new THREE.Group(); sc.add(reel);
    const rm = phong({ color: 0x2a2c30, spec: 0x99aabb, shin: 60 }); const disc = cyl(1.4, 1.4, 0.18, 24, rm); disc.rotation.x = Math.PI / 2; reel.add(disc);
    for (let i = 0; i < 6; i++) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 10), M('#0c0f0f')); h.rotation.x = Math.PI / 2; h.position.set(Math.cos(i / 6 * 6.283) * 0.8, Math.sin(i / 6 * 6.283) * 0.8, 0); reel.add(h); }
    const film = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.12, 6, 32), M('#3a2a1a', 0.06)); reel.add(film);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), glow('#ffd8a0', 1.8)); reel.add(core);
    const rings = []; const radii = [3.2, 5.0, 7.0, 9.4];
    radii.forEach((R0, ri) => { const n = 6 + ri * 4; const g = new THREE.Group(); sc.add(g); rings.push(g); g.rotation.x = 0.35 + ri * 0.05; g.rotation.z = (ri - 1.5) * 0.12;
      for (let i = 0; i < n; i++) { const tx = thumbTex[(i + ri * 7) % thumbTex.length]; const p = new THREE.Mesh(new THREE.PlaneGeometry(1.0 + ri * 0.1, (1.0 + ri * 0.1) * 9 / 16), basic({ map: tx, side: THREE.DoubleSide })); const a = i / n * Math.PI * 2; p.position.set(Math.cos(a) * R0, 0, Math.sin(a) * R0); p.lookAt(0, 0, 0); g.add(p); }
      const orbit = new THREE.Mesh(new THREE.TorusGeometry(R0, 0.008, 3, 96), basic({ color: new THREE.Color('#a6d7e6'), transparent: true, opacity: 0.35 })); orbit.rotation.x = Math.PI / 2; g.add(orbit); });
    sc.add(new THREE.HemisphereLight(0xa6d7e6, 0x0c0f0f, 1.0)); const kl = new THREE.PointLight(0xffd8a0, 20, 30, 1.4); sc.add(kl);
    function update(t) { reel.rotation.z = -t * 0.3; rings.forEach((g, i) => { g.rotation.y = t * (0.25 - i * 0.04) * (i % 2 ? -1 : 1); }); }
    return { scene: sc, update, reel };
  });
}

// ---------------- data void: a point cloud that assembles into a seated figure; dotted network lines ----------------
export function dataVoid(ctx) {
  return cached(ctx, 'datavoid', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x05080a);
    const n = 2600; const R = rng(77); const target = new Float32Array(n * 3), start = new Float32Array(n * 3);
    // sample a rough seated-figure volume (head, torso, legs) — a silhouette, not a likeness
    for (let i = 0; i < n; i++) { let x, y, z; const u = R();
      if (u < 0.14) { const a = R() * 6.283, b = Math.acos(2 * R() - 1), r = 0.13; x = Math.sin(b) * Math.cos(a) * r; y = 1.35 + Math.cos(b) * r * 1.2; z = Math.sin(b) * Math.sin(a) * r; }
      else if (u < 0.5) { x = (R() - 0.5) * 0.42; y = 0.75 + R() * 0.5; z = (R() - 0.5) * 0.24; }
      else if (u < 0.78) { x = (R() < 0.5 ? -1 : 1) * (0.08 + R() * 0.08); y = 0.48 + R() * 0.1; z = R() * 0.45; }
      else { x = (R() < 0.5 ? -1 : 1) * (0.25 + R() * 0.06); y = 0.6 + R() * 0.55; z = (R() - 0.3) * 0.2; }
      target.set([x, y, z], i * 3); const a = R() * 6.283, r = 3 + R() * 6; start.set([Math.cos(a) * r, R() * 5 - 1, Math.sin(a) * r - 2], i * 3); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(start.slice(), 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: new THREE.Color('#a6d7e6').multiplyScalar(1.6), size: 0.022, toneMapped: false })); sc.add(pts);
    const lineGeo = new THREE.BufferGeometry(); const lp = []; for (let i = 0; i < 260; i++) { const a = (R() * n) | 0, b = (R() * n) | 0; lp.push(...target.slice(a * 3, a * 3 + 3), ...target.slice(b * 3, b * 3 + 3)); }
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: new THREE.Color('#ff7eb6'), transparent: true, opacity: 0.0, toneMapped: false })); sc.add(lines);
    function update(u) { const p = geo.attributes.position; for (let i = 0; i < n; i++) { const k = clamp(u * 1.3 - (i % 97) / 97 * 0.3); const e = k * k * (3 - 2 * k); for (let j = 0; j < 3; j++) p.array[i * 3 + j] = start[i * 3 + j] + (target[i * 3 + j] - start[i * 3 + j]) * e; } p.needsUpdate = true; lines.material.opacity = clamp((u - 0.7) * 2) * 0.5; }
    update(0);
    return { scene: sc, update, pts };
  });
}

// ---------------- the factory of the extraordinary: conveyor of glowing wonders + the ORDINARY stamp ----------------
export function factory(ctx) {
  return cached(ctx, 'factory5', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x14181c); sc.fog = new THREE.Fog(0x14181c, 9, 26);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), lam({ map: ptex('facfloor', 32, 32, (g, w, h, R) => { noiseFill(g, w, h, '#3a3e42', 0.06, R); g.fillStyle = '#ffd43b'; g.fillRect(0, 30, w, 2); }, { repeat: [12, 12] }) })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; sc.add(fl);
    const beltT = ptex('belt5', 64, 16, (g, w, h) => { g.fillStyle = '#1a1c1e'; g.fillRect(0, 0, w, h); g.fillStyle = '#2e3236'; for (let x = 0; x < w; x += 8) g.fillRect(x, 0, 3, h); }, { repeat: [10, 1] });
    const belt = new THREE.Mesh(new THREE.BoxGeometry(16, 0.12, 1.1), [M('#555'), M('#555'), lam({ map: beltT }), M('#555'), M('#555'), M('#555')]); belt.position.set(0, 0.9, 0); sc.add(belt);
    for (let i = -7; i <= 7; i += 2) add(sc, box(0.1, 0.9, 1.0, M('#333')), i, 0.45, 0);
    // stamp press
    const press = new THREE.Group(); press.position.set(0, 0, 0); sc.add(press);
    for (const s of [-1, 1]) add(press, box(0.25, 3.2, 0.25, M('#d8a800')), s * 0.9, 1.6, 0); add(press, box(2.1, 0.5, 1.4, M('#d8a800')), 0, 3.2, 0);
    const piston = new THREE.Group(); piston.position.y = 2.95; press.add(piston); add(piston, box(0.2, 1.0, 0.2, M('#888')), 0, -0.5, 0);
    const stampT = textTex('stampface', 128, 64, (g, w, h) => { g.fillStyle = '#2a2c30'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d8262f'; g.lineWidth = 5; g.strokeRect(6, 6, w - 12, h - 12); g.fillStyle = '#d8262f'; g.font = `900 22px ${HEL}`; g.textAlign = 'center'; g.fillText('ORDINARY', w / 2, 41); });
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.25, 0.8), [M('#2a2c30'), M('#2a2c30'), M('#2a2c30'), lam({ map: stampT }), M('#2a2c30'), M('#2a2c30')]); head.position.y = -1.1; piston.add(head);
    // wonders: glowing objects; after the press they turn grey
    const kinds = () => [new THREE.IcosahedronGeometry(0.28, 0), new THREE.OctahedronGeometry(0.3, 0), new THREE.TorusKnotGeometry(0.18, 0.06, 32, 5), new THREE.DodecahedronGeometry(0.26, 0)];
    const items = []; const cols = ['#ff7eb6', '#a6d7e6', '#ffd43b', '#3ddc84', '#8b5cf6', '#ff7a2b'];
    for (let i = 0; i < 9; i++) { const geoA = kinds()[i % 4]; const hot = glow(cols[i % cols.length], 2.4), cold = M('#8a8c90', 0.05); const m = new THREE.Mesh(geoA, hot); m.userData = { hot, cold, i }; m.castShadow = true; sc.add(m); items.push(m); }
    const hemi = new THREE.HemisphereLight(0xdde6ff, 0x30302a, 0.9); sc.add(hemi);
    const key = new THREE.SpotLight(0xffffff, 40, 16, 0.6, 0.5, 1.2); key.position.set(2, 7, 4); key.target.position.set(0, 1, 0); key.castShadow = true; sc.add(key); sc.add(key.target);
    sh(press);
    function update(t) { const sp = 1.4; beltT.offset.x = -t * sp / 1.6; for (const m of items) { const x = ((m.userData.i * 1.8 + t * sp) % 16.2) - 8.1; m.position.set(x, 1.25, 0); m.rotation.set(t * 0.7 + m.userData.i, t * 0.9, 0); m.material = x > 0.05 ? m.userData.cold : m.userData.hot; m.scale.setScalar(x > 0.05 ? 0.85 : 1); }
      const ph = (t * sp / 1.8) % 1; piston.position.y = 2.95 - 0.9 * Math.max(0, Math.sin(clamp((ph - 0.0) / 0.25) * Math.PI)); }
    return { scene: sc, update };
  });
}

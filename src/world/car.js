// The secondhand Toyota (a beige 2000s sedan, no badges) with a full interior: dashboard + live radio LCD,
// steering wheel, five seats, an opening passenger door, roll-down windows. Plus an endless road (day / night).
// Car local frame: +z forward, +x = driver's left (left-hand drive: driver at x = +DRV_X).
import * as THREE from 'three';
import { box, taper, lam, cmat, cyl, at } from './kit.js';
import { ptex, shade, noiseFill, textTex } from './tex.js';
import { Screen } from './props.js';
import { skyDome, stars, lights, tree, bush } from './env.js';
import { glow, add, woodTex } from './props3.js';
import { rng, hash2, clamp } from '../core.js';
import { TIMES, UI, MONO } from '../ov/overlay.js';

export const DRV_X = 0.37, SEAT_Y = 0.5, SEAT_Z = -0.12, BACK_Z = -1.0;
const shadowsOn = g => { g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };

export function toyota({ paint = '#d8c7a2', id = 'main' } = {}) {
  const g = new THREE.Group();
  const paintT = ptex('carpaint' + paint, 32, 32, (c, w, h, R) => { noiseFill(c, w, h, paint, 0.02, R); c.fillStyle = shade(paint, 1.12); c.fillRect(0, 2, w, 1); });
  const P = lam({ map: paintT, side: THREE.DoubleSide }), dark = cmat('#1c1d20', 0.04), trim = cmat('#2b2c30', 0.04), chrome = cmat('#b9bcc2', 0.03);
  const inner = cmat('#5b5650', 0.05), fabric = lam({ map: ptex('seatfab', 16, 16, (c, w, h, R) => { noiseFill(c, w, h, '#6d665c', 0.08, R); for (let y = 0; y < h; y += 4) { c.fillStyle = '#5c564d'; c.fillRect(0, y, w, 1); } }) });
  const glass = new THREE.MeshLambertMaterial({ color: 0x9ab8c8, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide });
  // --- lower body (hood + trunk solid, cabin hollow) ---
  add(g, taper(0.66, [1.62, 1.3], [1.68, 1.38], [P, P, P, dark, P, P], { pivot: 'bottom', off: [0, -0.06] }), 0, 0.26, 1.53);       // hood block z 0.85..2.2
  add(g, taper(0.7, [1.6, 0.74], [1.68, 0.78], [P, P, P, dark, P, P], { pivot: 'bottom', off: [0, 0.03] }), 0, 0.26, -1.82);         // trunk block
  add(g, box(1.66, 0.06, 2.4, inner, 'bottom'), 0, 0.24, -0.3);                                                                      // floor
  add(g, box(1.7, 0.16, 4.45, trim, 'bottom'), 0, 0.12, 0);                                                                          // sill / bumpers band
  // side panels (left side fixed; right side has the opening front door)
  const sideP = (x, z0, z1, mats) => add(g, box(0.06, 0.7, z1 - z0, mats || P, 'bottom'), x, 0.26, (z0 + z1) / 2);
  sideP(0.82, -1.45, 0.85); sideP(-0.82, -1.45, -0.44);
  const door = new THREE.Group(); add(g, door, -0.82, 0, 0.85);                     // hinge at the front edge
  add(door, box(0.06, 0.7, 1.29, P, 'bottom'), 0, 0.26, -0.645);
  const dWin = add(door, new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.42), glass), 0, 1.17, -0.66, 0, Math.PI / 2, 0);
  add(door, box(0.07, 0.03, 0.06, chrome), 0.03, 0.82, -1.1);                         // handle
  // --- greenhouse: pillars, roof, glass ---
  const pillar = (x, z0, y0, z1, y1) => { const dx = 0, dy = y1 - y0, dz = z1 - z0; const len = Math.hypot(dy, dz); const m = box(0.07, len, 0.07, P, 'bottom'); m.position.set(x, y0, z0); m.rotation.x = Math.atan2(dz, dy); g.add(m); return m; };
  for (const x of [0.78, -0.78]) { pillar(x, 0.85, 0.96, 0.2, 1.4); pillar(x, -0.47, 0.96, -0.47, 1.42); pillar(x, -1.42, 0.96, -0.98, 1.42); }
  add(g, box(1.56, 0.05, 1.2, P, 'bottom'), 0, 1.4, -0.39);                                                                          // roof
  add(g, box(1.5, 0.02, 1.16, cmat('#cfc8b8', 0.03), 'bottom'), 0, 1.385, -0.39);                                                    // headliner
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.52, Math.hypot(0.65, 0.44)), glass); ws.position.set(0, 1.18, 0.53); ws.rotation.x = -Math.atan2(0.65, 0.44); g.add(ws);
  const rw = new THREE.Mesh(new THREE.PlaneGeometry(1.5, Math.hypot(0.44, 0.46)), glass); rw.position.set(0, 1.19, -1.2); rw.rotation.x = Math.atan2(0.44, 0.46); g.add(rw);
  const wins = {};
  for (const [k, x, z0, z1] of [['FL', 0.8, -0.44, 0.82], ['RL', 0.8, -1.4, -0.5], ['RR', -0.8, -1.4, -0.5]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(z1 - z0, 0.42), glass); m.position.set(x, 1.17, (z0 + z1) / 2); m.rotation.y = Math.PI / 2; g.add(m); wins[k] = m; }
  wins.FR = dWin;
  // --- wheels ---
  const hubT = ptex('hubcap', 16, 16, (c, w, h) => { c.fillStyle = '#151515'; c.fillRect(0, 0, w, h); c.fillStyle = '#9aa0a8'; c.beginPath(); c.arc(8, 8, 5.5, 0, 7); c.fill(); c.fillStyle = '#6a7078'; for (let a = 0; a < 6; a++) c.fillRect(8 + Math.cos(a) * 3 - 0.5, 8 + Math.sin(a) * 3 - 0.5, 1.5, 1.5); });
  const wheels = [];
  for (const [x, z] of [[0.78, 1.38], [-0.78, 1.38], [0.78, -1.32], [-0.78, -1.32]]) { const wg = new THREE.Group(); add(g, wg, x, 0.31, z); const t = cyl(0.31, 0.31, 0.2, 14, [cmat('#141414', 0.05), lam({ map: hubT }), lam({ map: hubT })]); t.rotation.z = Math.PI / 2; wg.add(t); wheels.push(wg); }
  // --- lights, grille, mirrors, plate ---
  const hl = glow('#fff6dc', 2.2), tl = glow('#ff2a2a', 1.4);
  for (const s of [1, -1]) { add(g, box(0.36, 0.13, 0.04, hl), s * 0.58, 0.8, 2.24); add(g, box(0.34, 0.14, 0.04, tl), s * 0.6, 0.85, -2.24); add(g, box(0.05, 0.1, 0.16, P), s * 0.88, 1.0, 0.72); }
  add(g, box(0.62, 0.12, 0.03, trim), 0, 0.72, 2.25);
  const plate = textTex('plate:' + id, 128, 40, (c, w, h) => { c.fillStyle = '#f2efe4'; c.fillRect(0, 0, w, h); c.strokeStyle = '#2747c9'; c.lineWidth = 3; c.strokeRect(2, 2, w - 4, h - 4); c.fillStyle = '#16110f'; c.font = `700 24px ${MONO}`; c.textAlign = 'center'; c.fillText('RSRCH 17', w / 2, 29); });
  add(g, new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.125), lam({ map: plate })), 0, 0.5, -2.25, 0, Math.PI, 0);
  // --- interior: dashboard, radio LCD, wheel, seats ---
  const dashT = ptex('dash', 64, 16, (c, w, h, R) => { noiseFill(c, w, h, '#2a2a2e', 0.05, R); c.fillStyle = '#121214'; c.fillRect(38, 3, 20, 9); c.fillStyle = '#ff8a2a'; for (let i = 0; i < 6; i++) c.fillRect(40 + i * 3, 9 - i % 3, 2, 1); c.fillStyle = '#1a1a1c'; c.fillRect(0, 0, w, 1); });
  const dash = add(g, box(1.56, 0.26, 0.5, [trim, trim, lam({ map: dashT }), trim, trim, lam({ map: dashT })], 'bottom'), 0, 0.72, 0.78);
  add(g, box(0.3, 0.42, 0.34, trim, 'bottom'), 0, 0.3, 0.55);                                                                         // centre console
  const radio = new Screen(256, 96, 1.5);
  const lcd = add(g, new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.098), radio.mat), 0, 0.86, 0.528, -0.12, Math.PI, 0); lcd.userData.noSelf = true;
  const btns = []; for (let i = 0; i < 6; i++) { const b = box(0.032, 0.018, 0.02, cmat('#3a3b40', 0.03)); add(g, b, -0.09 + i * 0.036, 0.785, 0.53); btns.push(b); }
  const knob = cyl(0.022, 0.022, 0.03, 8, trim); knob.rotation.x = Math.PI / 2; add(g, knob, 0.12, 0.83, 0.535);
  const sw = new THREE.Group(); add(g, sw, DRV_X, 0.93, 0.48, -0.42 + Math.PI / 2 - Math.PI / 2, 0, 0);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.022, 5, 18), cmat('#18181a', 0.04)); rim.rotation.x = 0.35; sw.add(rim);
  for (const a of [0, 2.4, -2.4]) { const sp = box(0.03, 0.15, 0.02, cmat('#202022')); sp.position.set(Math.sin(a) * 0.075, -Math.cos(a) * 0.075 * Math.cos(0.35), Math.cos(a) * 0.075 * Math.sin(0.35)); sp.rotation.set(0.35, 0, a); sw.add(sp); }
  const hub = cyl(0.05, 0.05, 0.04, 8, cmat('#202022')); hub.rotation.x = Math.PI / 2 + 0.35; sw.add(hub);
  add(g, cyl(0.025, 0.025, 0.3, 6, trim), DRV_X, 0.87, 0.62, Math.PI / 2 + 0.35);                                                   // column
  const seat = (x, z, wd = 0.5) => { const s = new THREE.Group(); add(g, s, x, 0, z); add(s, box(wd, 0.16, 0.5, fabric, 'bottom'), 0, 0.32, 0.05); const back = box(wd, 0.62, 0.12, fabric, 'bottom'); add(s, back, 0, 0.44, -0.24, -0.16); add(s, box(wd * 0.55, 0.16, 0.1, fabric, 'bottom'), 0, 1.02, -0.33, -0.16); add(s, box(0.08, 0.32, 0.08, trim, 'bottom'), 0, 0.0, 0.05); return s; };
  const seats = { D: seat(DRV_X, SEAT_Z), P: seat(-DRV_X, SEAT_Z) };
  const rear = new THREE.Group(); add(g, rear, 0, 0, BACK_Z); add(rear, box(1.5, 0.18, 0.5, fabric, 'bottom'), 0, 0.3, 0.05); add(rear, box(1.5, 0.62, 0.12, fabric, 'bottom'), 0, 0.44, -0.26, -0.18);
  const mirror = add(g, box(0.24, 0.07, 0.03, trim), 0, 1.3, 0.6, 0.15);
  const dice = new THREE.Group(); add(g, dice, 0, 1.18, 0.6); for (const s of [-1, 1]) { const d = box(0.03, 0.03, 0.03, lam({ map: ptex('die', 8, 8, (c) => { c.fillStyle = '#f4f0e6'; c.fillRect(0, 0, 8, 8); c.fillStyle = '#d8262f'; c.fillRect(1, 1, 2, 2); c.fillRect(5, 5, 2, 2); c.fillRect(3, 3, 2, 2); }) })); d.position.set(s * 0.03, -s * 0.02, 0); dice.add(d); }
  shadowsOn(g); for (const m of [ws, rw, ...Object.values(wins)]) { m.castShadow = false; m.receiveShadow = false; m.renderOrder = 2; }
  // interior courtesy light (night)
  const dome = new THREE.PointLight(0xffe2b0, 0, 2.4, 1.6); dome.position.set(0, 1.3, -0.3); g.add(dome);
  const lcdLight = new THREE.PointLight(0x7ad0ff, 0, 1.6, 1.8); lcdLight.position.set(0, 0.95, 0.3); g.add(lcdLight);
  return { g, door, wins, wheels, radio, lcd, lcdLight, dome, sw, seats, btns, dice, mirror,
    // seat anchors in car-local coordinates for sitPose characters: [x, y(seat height), z, ry]
    seatAt: { D: [DRV_X, SEAT_Y, SEAT_Z - 0.06, 0], P: [-DRV_X, SEAT_Y, SEAT_Z - 0.06, 0], RL: [0.48, 0.48, BACK_Z - 0.02, 0], RM: [0, 0.48, BACK_Z - 0.02, 0], RR: [-0.48, 0.48, BACK_Z - 0.02, 0] },
    setWindow(k, u) { const m = wins[k]; if (m) m.position.y = 1.17 - 0.42 * clamp(1 - u); },
    spin(dist) { for (const w of wheels) w.rotation.x = dist / 0.31; },
  };
}

// radio LCD painter: station text + scrolling title + spectrum
export function radioPaint(scr, t, { title = 'FM 101.7', artist = '', col = '#7ad0ff', bg = '#061018', bars = 1, flash = 0 } = {}) {
  scr.draw((g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 8;
    g.font = `700 18px ${MONO}`; g.fillText(title, 10, 24);
    if (artist) { g.font = `700 34px ${MONO}`; const tw = g.measureText(artist).width; const x = tw > w - 20 ? 10 - ((t * 60) % (tw + 60)) : 10; g.fillText(artist, x, 66); if (tw > w - 20) g.fillText(artist, x + tw + 60, 66); }
    if (bars) for (let i = 0; i < 16; i++) { const v = 0.3 + 0.7 * Math.abs(Math.sin(t * (5 + i * 0.7) + i)); g.fillRect(150 + i * 6, 30 - v * 22 * bars, 4, v * 22 * bars); }
    g.shadowBlur = 0;
    if (flash) { g.fillStyle = `rgba(255,255,255,${flash})`; g.fillRect(0, 0, w, h); }
  });
}

// ---------------- the endless road (the world scrolls past a parked car) ----------------
export function road(ctx, night = false) {
  const key = 'road:' + night; if (ctx.cache.has(key)) return ctx.cache.get(key);
  const sc = new THREE.Scene();
  if (night) { sc.add(skyDome('#03040c', '#0c1430', '#1a2448')); sc.add(stars(1400, 380, 21)); sc.fog = new THREE.Fog(0x0a1024, 25, 140); }
  else { sc.add(skyDome('#6fb6e6', '#b5def2', '#e8f4f6')); sc.fog = new THREE.Fog(0xcfe8f2, 40, 220); }
  const L = lights(sc, night ? { hemiSky: 0x3a4a8a, hemiGround: 0x101420, hemi: 0.55, sun: 0x8aa0ff, sunI: 0.35, sunPos: [-20, 30, 10], area: 9 } : { hemiSky: 0xcfeaff, hemiGround: 0x7a8a5a, hemi: 1.2, sun: 0xfff0d6, sunI: 2.1, sunPos: [12, 18, 6], area: 9 });
  const SEG = 80, world = new THREE.Group(); world.position.x = 2.1; sc.add(world);
  const asphalt = ptex('asphalt' + night, 32, 32, (c, w, h, R) => { noiseFill(c, w, h, night ? '#2a2c32' : '#55575c', 0.1, R); for (let i = 0; i < 30; i++) { c.fillStyle = night ? '#34363c' : '#686a70'; c.fillRect(R() * w | 0, R() * h | 0, 1, 1); } }, { repeat: [3, SEG / 4] });
  const grassT = ptex('verge' + night, 32, 32, (c, w, h, R) => { noiseFill(c, w, h, night ? '#1f3a24' : '#5fa53d', 0.1, R); for (let i = 0; i < 40; i++) { c.fillStyle = night ? '#2a4a2e' : '#7cc24f'; c.fillRect(R() * w | 0, R() * h | 0, 1, 2); } }, { repeat: [24, SEG / 3] });
  const dashT = ptex('dashline', 4, 32, (c, w, h) => { c.fillStyle = '#e8e2c8'; c.fillRect(0, 0, w, 18); }, { repeat: [1, SEG / 8] });
  const segs = [];
  for (let k = 0; k < 3; k++) {
    const sg = new THREE.Group(); sg.position.z = (k - 1) * SEG; world.add(sg); segs.push(sg);
    const r = new THREE.Mesh(new THREE.PlaneGeometry(9, SEG), lam({ map: asphalt })); r.rotation.x = -Math.PI / 2; r.receiveShadow = true; sg.add(r);
    const ln = new THREE.Mesh(new THREE.PlaneGeometry(0.16, SEG), new THREE.MeshLambertMaterial({ map: dashT, transparent: true, polygonOffset: true, polygonOffsetFactor: -1 })); ln.rotation.x = -Math.PI / 2; ln.position.set(0, 0.01, 0); sg.add(ln);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.PlaneGeometry(0.14, SEG), lam({ color: 0xe8e2c8 })); e.rotation.x = -Math.PI / 2; e.position.set(s * 4.1, 0.01, 0); sg.add(e);
      const gr = new THREE.Mesh(new THREE.PlaneGeometry(80, SEG), lam({ map: grassT })); gr.rotation.x = -Math.PI / 2; gr.position.set(s * 44.5, -0.02, 0); gr.receiveShadow = true; sg.add(gr); }
    const R = rng(90 + k);
    for (let i = 0; i < 9; i++) { const s = R() > 0.5 ? 1 : -1; const tr = tree(300 + k * 20 + i, 1.1 + R() * 0.8, !night); tr.position.set(s * (8 + R() * 22), 0, -SEG / 2 + R() * SEG); sg.add(tr); }
    for (let i = 0; i < 6; i++) { const b = bush(400 + k * 9 + i, 1.2, !night); b.position.set((R() > 0.5 ? 1 : -1) * (5.5 + R() * 6), 0, -SEG / 2 + R() * SEG); sg.add(b); }
    // lamp posts every 20 m on the right
    for (let z = -SEG / 2 + 10; z < SEG / 2; z += 20) { const lp = new THREE.Group(); lp.position.set(-5.2, 0, z); sg.add(lp); add(lp, box(0.12, 6.2, 0.12, cmat('#4a4c52'), 'bottom')); add(lp, box(1.4, 0.1, 0.12, cmat('#4a4c52')), 0.65, 6.15, 0); add(lp, box(0.4, 0.08, 0.22, night ? glow('#ffd59a', 3) : cmat('#d8d8d0')), 1.2, 6.06, 0); }
  }
  // distant hills
  for (let i = 0; i < 14; i++) { const R = rng(500 + i); const h = new THREE.Mesh(new THREE.ConeGeometry(18 + R() * 20, 10 + R() * 14, 6), lam({ color: new THREE.Color(night ? '#121c2e' : '#7aa86a'), flat: true })); h.position.set((i % 2 ? 1 : -1) * (70 + R() * 60), 0, -150 + i * 22); sc.add(h); }
  // moving street-light pool for night interiors (passes overhead every 20 m)
  const pool = new THREE.PointLight(0xffc888, 0, 14, 1.4); pool.position.set(-1.4, 5.6, 0); sc.add(pool);
  const set = { scene: sc, world, segs, SEG, sun: L.sun, hemi: L.hemi, pool, night,
    // drive: distance travelled d (m) -> world offset; car stays at the origin facing +z
    drive(d) { const off = ((d % SEG) + SEG) % SEG; world.position.z = -off; if (night) { const zz = ((-d % 20) + 20) % 20 - 10; pool.position.z = zz + 2; pool.intensity = 18 * Math.max(0, 1 - Math.abs(zz) / 9); } },
  };
  ctx.cache.set(key, set); return set;
}

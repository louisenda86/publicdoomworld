// WHAT IF sets (cached per film). Each returns { scene, ...anchors }.
import * as THREE from 'three';
import { box, lam, basic, cmat, at, cyl, soft, phong } from './kit.js';
import { ptex, shade, noiseFill, textTex } from './tex.js';
import { lights, skyDome, tree, bush, ground } from './env.js';
import * as P from './props.js';
import * as R3 from './props3.js';
import { glow, add, woodTex } from './props3.js';
import { room, cached } from './sets3.js';
import { rng, clamp, hash2 } from '../core.js';
import { C, HEL, JP, UI, MONO } from '../ov/overlay.js';
export { cached };

const wp = (key, base, stripe, rep, step = 8) => ptex('wp4:' + key, 32, 32, (g, w, h, R) => { noiseFill(g, w, h, base, 0.03, R); if (stripe) for (let x = 0; x < w; x += step) { g.fillStyle = stripe; g.fillRect(x, 0, 1, h); } }, { repeat: rep });
const carpet = (key, base, rep) => ptex('cp4:' + key, 16, 16, (g, w, h, R) => noiseFill(g, w, h, base, 0.12, R), { repeat: rep });
const M = (hex, amp = 0.05, extra) => cmat(hex, amp, extra);
const sh = g => { g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };

// tin can / energy drink
export function can(col = '#3ddc84', label = 'VOLT', s = 1) {
  const t = ptex('can:' + col + label, 32, 32, (g, w, h, R) => { noiseFill(g, w, h, col, 0.04, R); g.fillStyle = '#e8e8ea'; g.fillRect(0, 0, w, 3); g.fillRect(0, h - 3, w, 3); g.fillStyle = '#111'; g.font = `800 9px ${HEL}`; g.textAlign = 'center'; g.fillText(label, w / 2, 19); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(6, 4, 2, h - 8); });
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.033 * s, 0.033 * s, 0.12 * s, 10), [lam({ map: t }), M('#d8d8dc'), M('#b8b8bc')]); m.castShadow = true; m.position.y = 0.06 * s; const g = new THREE.Group(); g.add(m); return g;
}
// monitor with a live Screen; returns { g, scr }
export function monitor(w = 0.66, h = 0.39, res = [768, 448], glowK = 1.45) {
  const g = new THREE.Group(); const scr = new P.Screen(res[0], res[1], glowK);
  add(g, box(w + 0.03, h + 0.03, 0.035, M('#111114', 0.03)), 0, 0, -0.02);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), scr.mat); s.position.z = 0.0; g.add(s);
  add(g, box(0.05, 0.22, 0.04, M('#18181c')), 0, -h / 2 - 0.1, -0.05); add(g, box(0.26, 0.015, 0.18, M('#18181c')), 0, -h / 2 - 0.21, -0.03);
  return { g, scr, screen: s };
}
// gaming chair (origin floor centre, faces -z: sitter looks toward -z)
export function gamingChair(col = '#c8281e') {
  const g = new THREE.Group(); const blk = M('#141416', 0.04), red = M(col, 0.05);
  const spin = new THREE.Group(); g.add(spin);
  add(spin, box(0.52, 0.09, 0.5, [blk, blk, red, blk, blk, blk], 'bottom'), 0, 0.44, 0);
  const back = new THREE.Group(); back.position.set(0, 0.5, 0.24); back.rotation.x = 0.16; spin.add(back);
  add(back, box(0.5, 0.82, 0.08, [blk, blk, blk, blk, M('#141416'), blk], 'bottom'), 0, 0, 0);
  add(back, box(0.1, 0.8, 0.085, red, 'bottom'), -0.15, 0.02, -0.003); add(back, box(0.1, 0.8, 0.085, red, 'bottom'), 0.15, 0.02, -0.003);
  add(back, box(0.24, 0.12, 0.1, blk, 'bottom'), 0, 0.78, -0.01);
  for (const sx of [-1, 1]) { add(spin, box(0.05, 0.2, 0.32, blk, 'bottom'), sx * 0.28, 0.5, 0.0); add(spin, box(0.08, 0.03, 0.3, M('#222226'), 'bottom'), sx * 0.28, 0.7, 0.0); }
  add(g, cyl(0.03, 0.035, 0.36, 8, M('#2a2a2e')), 0, 0.26, 0);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const leg = box(0.05, 0.04, 0.32, blk, 'center'); leg.position.set(Math.sin(a) * 0.15, 0.06, Math.cos(a) * 0.15); leg.rotation.y = a; g.add(leg); const wh = cyl(0.03, 0.03, 0.03, 8, blk); wh.rotation.z = Math.PI / 2; wh.position.set(Math.sin(a) * 0.3, 0.03, Math.cos(a) * 0.3); g.add(wh); }
  return { g: sh(g), spin };
}
// desk lamp with a switchable bulb + spot
export function deskLamp(on = true) {
  const g = new THREE.Group(); const m = M('#1d1d22', 0.04);
  add(g, cyl(0.08, 0.09, 0.025, 12, m), 0, 0.012, 0);
  const a1 = box(0.022, 0.36, 0.022, m, 'bottom'); a1.position.set(0, 0.02, 0); a1.rotation.x = -0.35; g.add(a1);
  const hd = new THREE.Group(); hd.position.set(0, 0.36, -0.13); g.add(hd);
  const shade_ = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.12, 12, 1, true), lam({ color: new THREE.Color('#1d1d22'), side: THREE.DoubleSide })); shade_.rotation.x = Math.PI * 0.62; hd.add(shade_);
  const bulbOn = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 3.4, 2.4), toneMapped: false }), bulbOff = M('#8a8a80');
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), on ? bulbOn : bulbOff); bulb.position.set(0, -0.02, -0.03); hd.add(bulb);
  const spot = new THREE.SpotLight(0xffd9a0, on ? 6 : 0, 3.2, 0.75, 0.6, 1.4); spot.position.set(0, 0, 0); spot.target.position.set(0, -1, -0.6); hd.add(spot); hd.add(spot.target);
  return { g: sh(g), bulb, spot, set(v) { bulb.material = v ? bulbOn : bulbOff; spot.intensity = v ? 6 : 0; } };
}
// wall clock / calendar faces (live canvases)
export function wallClock(r = 0.17) { const scr = new P.Screen(128, 128, 1.0); const g = new THREE.Group(); add(g, cyl(r * 1.08, r * 1.08, 0.04, 20, M('#16161a')), 0, 0, 0, Math.PI / 2); const f = new THREE.Mesh(new THREE.CircleGeometry(r, 24), lam({ map: scr.tex })); f.position.z = 0.022; g.add(f); return { g, scr, mat: f.material }; }
export function drawClock(scr, hours) { const g = scr.g, w = scr.w; g.fillStyle = '#efe9dc'; g.fillRect(0, 0, w, w); g.strokeStyle = '#222'; g.lineCap = 'round'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.lineWidth = i % 3 ? 2 : 4; g.beginPath(); g.moveTo(64 + Math.sin(a) * 50, 64 - Math.cos(a) * 50); g.lineTo(64 + Math.sin(a) * 58, 64 - Math.cos(a) * 58); g.stroke(); } const ha = hours / 12 * Math.PI * 2, ma = (hours % 1) * Math.PI * 2; g.lineWidth = 6; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.sin(ha) * 30, 64 - Math.cos(ha) * 30); g.stroke(); g.lineWidth = 4; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.sin(ma) * 46, 64 - Math.cos(ma) * 46); g.stroke(); g.fillStyle = '#d33'; g.beginPath(); g.arc(64, 64, 4, 0, 7); g.fill(); scr.tex.needsUpdate = true; }
export function drawCalendar(scr, { cross = 0, circle = 2, q = false } = {}) {
  const g = scr.g, w = scr.w, h = scr.h; g.fillStyle = '#f3efe6'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8281e'; g.fillRect(0, 0, w, 44); g.fillStyle = '#fff'; g.font = `800 26px ${HEL}`; g.textAlign = 'center'; g.fillText('OCTOBER', w / 2, 32);
  g.font = `700 13px ${HEL}`; g.fillStyle = '#333'; ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach((d, i) => g.fillText(d, 14 + i * 22, 62));
  for (let k = 0; k < 31; k++) { const c = (k + 2) % 7, r = Math.floor((k + 2) / 7); const x = 14 + c * 22, y = 84 + r * 26; g.fillStyle = '#222'; g.font = `600 13px ${HEL}`; g.fillText(String(k + 1), x, y); if (k < cross) { g.strokeStyle = '#c8281e'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 8, y - 12); g.lineTo(x + 8, y + 3); g.moveTo(x + 8, y - 12); g.lineTo(x - 8, y + 3); g.stroke(); } if (k === circle) { g.strokeStyle = '#1d6fd8'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y - 5, 11, 0, 7); g.stroke(); } }
  if (q) { g.fillStyle = 'rgba(200,40,30,0.9)'; g.font = `800 90px ${HEL}`; g.fillText('?', w / 2, h - 40); }
  g.textAlign = 'left'; scr.tex.needsUpdate = true;
}

// ---------------- TOPENG'S ROOM: dark, monitor-lit, blinds with daylight slits, prepper shelf, kitchenette ----------------
export function topengRoom(ctx) {
  return cached(ctx, 'troom', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x06070a);
    const W = 5.6, D = 5.2, Hh = 2.7;
    const walls = room(sc, { w: W, d: D, h: Hh, wall: wp('troom', '#2c363a', '#283135', [5, 2]), floor: carpet('troom', '#2f4034', [8, 8]), ceil: '#1c2024', front: false });
    // left wall rebuilt around the window so only the blinds let the sun in; walls + ceiling cast shadows
    sc.remove(walls.left); walls.ceil.castShadow = true; walls.back.castShadow = true; walls.right.castShadow = true;
    const lwm = walls.left.material; const lseg = (z0, z1, y0, y1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(z1 - z0, y1 - y0), lwm); m.position.set(-W / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.rotation.y = Math.PI / 2; m.receiveShadow = true; m.castShadow = true; sc.add(m); };
    lseg(-D / 2, 0.35, 0, Hh); lseg(1.55, D / 2, 0, Hh); lseg(0.35, 1.55, 0, 1.0); lseg(0.35, 1.55, 2.1, Hh);
    // front wall with a doorway (x 1.2..2.1), hallway behind
    const wm = lam({ map: wp('troom', '#2c363a', '#283135', [5, 2]) });
    const wallSeg = (x0, x1, y0, y1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), wm); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, D / 2); m.rotation.y = Math.PI; m.receiveShadow = true; m.castShadow = true; sc.add(m); };
    wallSeg(-W / 2, 1.2, 0, Hh); wallSeg(2.1, W / 2, 0, Hh); wallSeg(1.2, 2.1, 2.05, Hh);
    const trim = M('#d8d2c4', 0.03); add(sc, box(0.06, 2.08, 0.12, trim, 'bottom'), 1.17, 0, D / 2); add(sc, box(0.06, 2.08, 0.12, trim, 'bottom'), 2.13, 0, D / 2); add(sc, box(1.02, 0.06, 0.12, trim, 'bottom'), 1.65, 2.05, D / 2);
    const door = new THREE.Group(); door.position.set(1.2, 0, D / 2 - 0.03); door.rotation.y = 1.75; sc.add(door);
    add(door, box(0.88, 2.02, 0.04, [M('#7a5a3e'), M('#7a5a3e'), M('#6a4a30'), M('#6a4a30'), M('#7a5a3e'), M('#7a5a3e')], 'bottom'), 0.44, 0, 0);
    const sgn = R3.poster('dnd', 0.22, 0.3, (g, w, h) => { g.fillStyle = '#c8281e'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = `800 15px ${HEL}`; g.textAlign = 'center'; g.fillText('DO NOT', w / 2, 40); g.fillText('DISTURB', w / 2, 60); g.font = `800 12px ${JP}`; g.fillText('研究中', w / 2, 90); }, [96, 128]);
    sgn.position.set(0.44, 1.45, -0.025); sgn.rotation.y = Math.PI; door.add(sgn);
    // hallway
    const hall = new THREE.Group(); sc.add(hall);
    const hf = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.2), lam({ map: ptex('hallfl', 16, 16, (g, w, h, R) => noiseFill(g, w, h, '#6a5844', 0.08, R), { repeat: [3, 4] }) })); hf.rotation.x = -Math.PI / 2; hf.position.set(1.65, 0.001, D / 2 + 1.6); hf.receiveShadow = true; hall.add(hf);
    const hw = lam({ map: wp('hall', '#b9ae98', null, [2, 1]) });
    for (const [x, ry] of [[0.45, Math.PI / 2], [2.85, -Math.PI / 2]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(3.2, Hh), hw); m.position.set(x, Hh / 2, D / 2 + 1.6); m.rotation.y = ry; m.receiveShadow = true; hall.add(m); }
    const hb = new THREE.Mesh(new THREE.PlaneGeometry(2.4, Hh), hw); hb.position.set(1.65, Hh / 2, D / 2 + 3.2); hb.rotation.y = Math.PI; hall.add(hb);
    const hc = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.2), M('#d8d2c4')); hc.rotation.x = Math.PI / 2; hc.position.set(1.65, Hh, D / 2 + 1.6); hall.add(hc);
    const hallL = new THREE.PointLight(0xffd8a8, 2.2, 5, 1.5); hallL.position.set(1.65, 2.4, D / 2 + 1.8); sc.add(hallL);
    // desk + monitors + peripherals
    const desk = P.table(1.75, 0.78, 0.75, '#232327'); desk.position.set(0.5, 0, -2.18); sc.add(desk);
    const mon = monitor(0.7, 0.4, [768, 440], 1.5); mon.g.position.set(0.45, 1.07, -2.42); sc.add(mon.g);
    const mon2 = monitor(0.38, 0.5, [320, 420], 1.3); mon2.g.position.set(1.12, 1.1, -2.34); mon2.g.rotation.y = -0.45; sc.add(mon2.g);
    const kb = box(0.46, 0.022, 0.15, [M('#1a1a1e'), M('#1a1a1e'), lam({ map: ptex('kbd', 64, 20, (g, w, h) => { g.fillStyle = '#18181c'; g.fillRect(0, 0, w, h); for (let y = 2; y < h - 2; y += 4) for (let x = 2; x < w - 2; x += 4) { g.fillStyle = `hsl(${(x * 5 + y * 3) % 360},90%,55%)`; g.fillRect(x, y, 3, 3); } }) }), M('#1a1a1e'), M('#1a1a1e'), M('#1a1a1e')], 'bottom'); kb.position.set(0.42, 0.75, -1.98); sc.add(kb);
    const mouse = new THREE.Group(); mouse.position.set(0.86, 0.75, -1.96); sc.add(mouse);
    const ms = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M('#202024')); ms.scale.set(0.7, 0.55, 1.15); ms.castShadow = true; mouse.add(ms);
    const mled = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.004, 0.03), glow('#ff3b30', 3)); mled.position.set(0, 0.024, -0.02); mouse.add(mled);
    add(sc, box(1.7, 0.012, 0.012, glow('#9a5bff', 3), 'center'), 0.5, 0.735, -1.8); // LED strip under the desk edge
    const lamp = deskLamp(true); lamp.g.position.set(-0.2, 0.75, -2.3); lamp.g.rotation.y = 0.5; sc.add(lamp.g);
    // cans everywhere
    const R = rng(11); const cans = [];
    for (let i = 0; i < 7; i++) { const cn = can(['#3ddc84', '#3ddc84', '#ffd60a', '#3ddc84', '#ff3b30'][i % 5], ['VOLT', 'VOLT', 'ZAP', 'VOLT', 'NUKE'][i % 5]); cn.position.set(-0.25 + R() * 1.4 + (i > 4 ? 0.6 : 0), 0.75, -2.02 - R() * 0.25); cn.rotation.y = R() * 6; sc.add(cn); cans.push(cn); }
    for (let i = 0; i < 6; i++) { const cn = can('#3ddc84', 'VOLT'); cn.position.set(-0.6 + R() * 2.0, 0, -1.2 + R() * 1.0); if (i % 2) { cn.rotation.z = Math.PI / 2; cn.position.y = 0.033; } sc.add(cn); }
    const pizza = box(0.42, 0.05, 0.42, [M('#c8a878'), M('#c8a878'), lam({ map: ptex('pizzabox', 32, 32, (g, w, h, R2) => { noiseFill(g, w, h, '#d2b48a', 0.05, R2); g.fillStyle = '#c8281e'; g.font = `800 8px ${HEL}`; g.textAlign = 'center'; g.fillText('PIZZA', w / 2, 18); }) }), M('#c8a878'), M('#c8a878'), M('#c8a878')], 'bottom'); pizza.position.set(-1.0, 0, -0.4); pizza.rotation.y = 0.4; sc.add(pizza);
    // gaming chair
    const chair = gamingChair(); chair.g.position.set(0.45, 0, -1.5); sc.add(chair.g);
    // bed against the left wall
    const bed = P.bed(); bed.position.set(-1.95, 0, -1.25); bed.rotation.y = Math.PI / 2; sc.add(bed);
    // window + blinds (left wall), bright day outside
    const sky = ptex('tsky', 64, 48, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8fd0ff'); gr.addColorStop(1, '#dff2ff'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#9ab89a'; for (let x = 0; x < w; x += 6) g.fillRect(x, h - 10 - (x * 7 % 9), 6, 12); });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.1), new THREE.MeshBasicMaterial({ map: sky, color: new THREE.Color(2.2, 2.2, 2.2), toneMapped: false })); win.position.set(-W / 2 + 0.005, 1.55, 0.95); win.rotation.y = Math.PI / 2; sc.add(win);
    const slats = new THREE.Group(); slats.position.set(-W / 2 + 0.07, 1.55, 0.95); sc.add(slats); const slatM = M('#e6e0d2', 0.03); const slatList = [];
    for (let i = 0; i < 18; i++) { const s = box(0.06, 0.004, 1.24, slatM, 'center'); s.position.y = 0.55 - i * 0.062; s.rotation.z = -0.38; s.castShadow = true; slats.add(s); slatList.push(s); }
    for (const z of [-0.64, 0.64]) add(sc, box(0.08, 1.2, 0.05, M('#d8d2c4'), 'center'), -W / 2 + 0.04, 1.55, 0.95 + z);
    const sun = new THREE.DirectionalLight(0xffeccc, 3.2); sun.position.set(-9, 5.0, 2.6); sun.target.position.set(0, 0, 0.6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); { const c = sun.shadow.camera; c.left = -4; c.right = 4; c.top = 4; c.bottom = -4; c.near = 1; c.far = 20; } sun.shadow.bias = -0.0006; sc.add(sun); sc.add(sun.target);
    // prepper shelf (right wall, front)
    const shelf = new THREE.Group(); shelf.position.set(2.5, 0, 0.75); shelf.rotation.y = -Math.PI / 2; sc.add(shelf);
    const sm = M('#6b6f74', 0.04);
    for (const x of [-0.62, 0.62]) for (const z of [-0.18, 0.18]) add(shelf, box(0.03, 1.9, 0.03, sm, 'bottom'), x, 0, z);
    for (let k = 0; k < 4; k++) add(shelf, box(1.26, 0.025, 0.4, sm, 'bottom'), 0, 0.15 + k * 0.48, 0);
    const shelfItems = [];
    for (let k = 0; k < 4; k++) { const y = 0.175 + k * 0.48; const R2 = rng(40 + k);
      if (k === 0) for (let i = 0; i < 3; i++) { const j = box(0.22, 0.3, 0.22, new THREE.MeshLambertMaterial({ color: 0x6fb7e8, transparent: true, opacity: 0.75 }), 'bottom'); j.position.set(-0.4 + i * 0.32, y, 0); shelf.add(j); }
      if (k === 1) for (let i = 0; i < 9; i++) { const cn = can(['#c8a040', '#b84030', '#4a7a3a'][i % 3], ['BEANS', 'SOUP', 'PEAS'][i % 3], 1.3); cn.position.set(-0.5 + (i % 5) * 0.22, y + (i > 4 ? 0.16 : 0), (i > 4 ? -0.06 : 0.06)); shelf.add(cn); }
      if (k === 2) { const fa = box(0.28, 0.18, 0.12, lam({ map: ptex('firstaid', 32, 20, (g, w, h) => { g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, w, h); g.fillStyle = '#d22'; g.fillRect(13, 4, 6, 12); g.fillRect(10, 7, 12, 6); }) }), 'bottom'); fa.position.set(-0.35, y, 0); shelf.add(fa);
        for (let i = 0; i < 3; i++) { const tp = cyl(0.06, 0.06, 0.11, 10, M('#f4f4f0', 0.02)); tp.position.set(0.1 + i * 0.13, y + 0.055, 0); shelf.add(tp); }
        const radio = box(0.22, 0.13, 0.08, M('#3a3f2a'), 'bottom'); radio.position.set(0.48, y, 0); shelf.add(radio); }
      if (k === 3) { // gas mask + flashlight + label
        const gm = new THREE.Group(); gm.position.set(-0.3, y + 0.12, 0.05); shelf.add(gm); add(gm, new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), M('#3a3f3a')), 0, 0, 0); for (const sx of [-1, 1]) add(gm, cyl(0.035, 0.035, 0.02, 10, glow('#8ab8c8', 0.9)), sx * 0.045, 0.03, 0.095, Math.PI / 2); add(gm, cyl(0.045, 0.05, 0.08, 10, M('#2a2e2a')), 0, -0.06, 0.1, Math.PI / 2);
        const fl = cyl(0.025, 0.03, 0.2, 8, M('#d8b830')); fl.rotation.z = Math.PI / 2; fl.position.set(0.2, y + 0.03, 0); shelf.add(fl); }
    }
    const tag = R3.poster('shelftag', 0.8, 0.16, (g, w, h) => { g.fillStyle = '#ffd60a'; g.fillRect(0, 0, w, h); for (let x = -h; x < w; x += 28) { g.fillStyle = '#111'; g.beginPath(); g.moveTo(x, h); g.lineTo(x + 14, h); g.lineTo(x + 14 + h, 0); g.lineTo(x + h, 0); g.fill(); } g.fillStyle = '#ffd60a'; g.fillRect(w * 0.18, 4, w * 0.64, h - 8); g.fillStyle = '#111'; g.font = `800 26px ${JP}`; g.textAlign = 'center'; g.fillText('終末 · DOOMSDAY', w / 2, h * 0.68); }, [320, 64]);
    tag.position.set(0, 2.05, 0.02); shelf.add(tag);
    sh(shelf);
    // kitchenette (front-left corner): counter, toaster, hot plate + pan
    const kit = new THREE.Group(); kit.position.set(-2.1, 0, 1.95); sc.add(kit);
    add(kit, box(1.3, 0.88, 0.6, [M('#e8e2d4'), M('#e8e2d4'), M('#9a948a'), M('#e8e2d4'), M('#e8e2d4'), M('#e8e2d4')], 'bottom'), 0, 0, 0);
    const toaster = new THREE.Group(); toaster.position.set(-0.35, 0.88, 0.02); kit.add(toaster);
    add(toaster, box(0.26, 0.17, 0.15, phong({ color: new THREE.Color('#c8ccd4'), spec: 0xffffff, shin: 60 }), 'bottom'), 0, 0, 0);
    for (const dz of [-0.03, 0.03]) add(toaster, box(0.17, 0.005, 0.02, M('#111'), 'center'), 0, 0.172, dz);
    add(toaster, box(0.02, 0.03, 0.03, M('#222'), 'center'), 0.14, 0.12, 0);
    const toasts = []; for (const dz of [-0.03, 0.03]) { const tst = box(0.13, 0.13, 0.014, lam({ map: ptex('toast', 16, 16, (g, w, h, R2) => { noiseFill(g, w, h, '#1c1410', 0.2, R2); g.fillStyle = '#2a1a10'; g.fillRect(0, 0, w, 2); }) }), 'bottom'); tst.position.set(0, 0.06, dz); toaster.add(tst); toasts.push(tst); }
    const plate = box(0.34, 0.04, 0.3, M('#2a2a2e'), 'bottom'); plate.position.set(0.25, 0.88, 0); kit.add(plate);
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.008, 4, 16), glow('#ff4a1a', 1.2)); coil.rotation.x = Math.PI / 2; coil.position.set(0.25, 0.925, 0); kit.add(coil);
    const pan = new THREE.Group(); pan.position.set(0.25, 0.93, 0); kit.add(pan); add(pan, cyl(0.12, 0.1, 0.04, 14, M('#202022')), 0, 0.02, 0); add(pan, box(0.03, 0.02, 0.24, M('#202022'), 'center'), 0, 0.03, 0.22);
    const egg = new THREE.Mesh(new THREE.CircleGeometry(0.07, 10), lam({ map: ptex('eggburnt', 16, 16, (g, w, h, R2) => { noiseFill(g, w, h, '#2a2016', 0.3, R2); g.fillStyle = '#3a2a10'; g.beginPath(); g.arc(8, 8, 3, 0, 7); g.fill(); }) })); egg.rotation.x = -Math.PI / 2; egg.position.set(0.0, 0.042, 0.0); pan.add(egg);
    const cereal = box(0.18, 0.28, 0.07, lam({ map: ptex('cereal', 32, 48, (g, w, h) => { g.fillStyle = '#ffd60a'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8281e'; g.font = `800 9px ${HEL}`; g.textAlign = 'center'; g.fillText('CRUNCH', w / 2, 14); g.fillStyle = '#b86a2a'; for (let i = 0; i < 9; i++) g.fillRect(6 + (i % 3) * 7, 22 + Math.floor(i / 3) * 7, 5, 5); }) }), 'bottom'); cereal.position.set(0.53, 0.88, -0.12); kit.add(cereal);
    const alarm = new THREE.Group(); alarm.position.set(-1.6, Hh - 0.02, 1.4); sc.add(alarm); add(alarm, cyl(0.07, 0.08, 0.035, 14, M('#efefe8')), 0, -0.018, 0); const aled = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 4), glow('#ff2a1a', 4)); aled.position.set(0.03, -0.038, 0); alarm.add(aled);
    sh(kit);
    // smoke sprites (shot-driven)
    const smokeT = ptex('smoke', 64, 64, (g, w) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(70,70,74,0.85)'); gr.addColorStop(0.6, 'rgba(60,60,64,0.4)'); gr.addColorStop(1, 'rgba(60,60,64,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }, { linear: true });
    const smoke = []; for (let i = 0; i < 26; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeT, transparent: true, depthWrite: false, opacity: 0 })); s.visible = false; sc.add(s); smoke.push(s); }
    // wall clock + calendar + posters (back wall)
    const clock = wallClock(0.17); clock.g.position.set(-0.95, 2.05, -D / 2 + 0.03); sc.add(clock.g); drawClock(clock.scr, 3.2);
    const calScr = new P.Screen(160, 220, 1.0); const cal = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.47), lam({ map: calScr.tex })); cal.position.set(-1.62, 1.55, -D / 2 + 0.012); sc.add(cal); drawCalendar(calScr);
    const gr = R3.poster('tgraf', 1.1, 0.62, (g, w, h) => { g.fillStyle = '#e8e2d4'; g.fillRect(0, 0, w, h); g.fillStyle = '#d8262f'; g.font = `800 46px ${HEL}`; g.textAlign = 'center'; g.fillText('TIDAK MAU', w / 2, 84); g.fillStyle = '#111'; g.font = `700 14px ${JP}`; g.fillText('いやだ', w / 2, 112); }, [256, 140]);
    gr.position.set(1.95, 1.75, -D / 2 + 0.01); sc.add(gr);
    const qp = R3.poster('qposter', 0.5, 0.7, (g, w, h) => { g.fillStyle = '#0c0f0f'; g.fillRect(0, 0, w, h); g.fillStyle = '#a6d7e6'; g.font = `800 120px ${HEL}`; g.textAlign = 'center'; g.fillText('?', w / 2, 120); g.font = `800 20px ${JP}`; g.fillStyle = '#f0e8da'; g.fillText('もしも', w / 2, 160); }, [128, 180]);
    qp.position.set(-0.25, 1.95, -D / 2 + 0.01); sc.add(qp);
    // ceiling fixture (off)
    add(sc, cyl(0.22, 0.26, 0.06, 16, M('#d8d4c8')), 0, Hh - 0.03, -0.3);
    // lights
    const hemi = new THREE.HemisphereLight(0x33405a, 0x0e0c10, 0.5); sc.add(hemi);
    const monL = new THREE.PointLight(0x8fc4ff, 2.2, 3.6, 1.3); monL.position.set(0.45, 1.12, -2.2); sc.add(monL);
    return { scene: sc, mon, mon2, chair, bed, lamp, sun, slats: slatList, shelf, kit, toaster, toasts, pan, coil, smoke, alarm, aled, clock, calScr, door, cans, mouse, hallL, monL, hemi, win, W, D, Hh,
      seat: [0.45, 0.5, -1.5, Math.PI] };
  });
}

// ---------------- JAX'S OFFICE (PUBLIC DOOM HQ): talking-head corner, desk + thumbnail monitor, whiteboard, crew gear ----------------
export function jaxOffice(ctx) {
  return cached(ctx, 'jaxoffice', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x101418);
    const W = 6, D = 5.4, Hh = 2.8;
    room(sc, { w: W, d: D, h: Hh, wall: wp('jo', '#c9c4b6', '#bfb9ab', [6, 2], 16), floor: carpet('jo', '#55606a', [8, 8]), ceil: '#e6e2d8', front: true });
    // back wall: window with blinds, daylight
    const sky = ptex('josky', 64, 48, (g, w, h, R) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9fd2f2'); gr.addColorStop(1, '#e8f4fa'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let x = 0; x < w;) { const bw = 4 + R() * 8 | 0, bh = 10 + R() * 22 | 0; g.fillStyle = '#b8c4cc'; g.fillRect(x, h - bh, bw, bh); x += bw + 1; } });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.3), new THREE.MeshBasicMaterial({ map: sky, color: new THREE.Color(1.9, 1.9, 1.9), toneMapped: false })); win.position.set(0.9, 1.6, -D / 2 + 0.005); sc.add(win);
    const slats = new THREE.Group(); slats.position.set(0.9, 1.6, -D / 2 + 0.07); sc.add(slats);
    for (let i = 0; i < 21; i++) { const s = box(2.26, 0.004, 0.06, M('#ece8de', 0.02), 'center'); s.position.y = 0.64 - i * 0.064; s.rotation.x = -0.6; s.castShadow = true; slats.add(s); }
    const sun = new THREE.DirectionalLight(0xfff2dc, 1.7); sun.position.set(2.5, 6, -10); sun.target.position.set(0, 0, 0); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); { const c = sun.shadow.camera; c.left = -5; c.right = 5; c.top = 5; c.bottom = -5; c.near = 1; c.far = 24; } sc.add(sun); sc.add(sun.target);
    // JAX's desk (right), monitor faces +z... desk against right wall, user faces +x
    const desk = P.table(1.6, 0.8, 0.75, '#c8b898'); desk.position.set(2.45, 0, 0.4); desk.rotation.y = Math.PI / 2; sc.add(desk);
    const mon = monitor(0.78, 0.46, [896, 528], 1.35); mon.g.position.set(2.72, 1.12, 0.4); mon.g.rotation.y = -Math.PI / 2; sc.add(mon.g);
    const chair = gamingChair('#2a2d35'); chair.g.position.set(1.9, 0, 0.4); chair.g.rotation.y = -Math.PI / 2; sc.add(chair.g);
    const mug = R3.mug('#f0e8da', 'DOOM'); mug.position.set(2.5, 0.75, 0.95); sc.add(mug);
    // whiteboard (left wall)
    const wbScr = new P.Screen(1024, 576, 1.0);
    const wb = new THREE.Group(); wb.position.set(-W / 2 + 0.04, 1.5, -0.2); wb.rotation.y = Math.PI / 2; sc.add(wb);
    add(wb, box(2.1, 1.22, 0.03, M('#9aa0a6'), 'center'), 0, 0, 0); const wbs = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.125), lam({ map: wbScr.tex })); wbs.position.z = 0.017; wb.add(wbs);
    wbScr.draw((g, w, h) => { g.fillStyle = '#f6f6f2'; g.fillRect(0, 0, w, h); });
    // talking-head corner (back-left): armchair-ish office chair, bookshelf + plant + P(●) poster behind
    const thChair = new THREE.Group(); thChair.position.set(-1.7, 0, -1.6); thChair.rotation.y = 0.5; sc.add(thChair);
    add(thChair, box(0.56, 0.12, 0.52, M('#3a4a5a'), 'bottom'), 0, 0.36, 0); add(thChair, box(0.56, 0.5, 0.1, M('#3a4a5a'), 'bottom'), 0, 0.46, -0.22); add(thChair, cyl(0.03, 0.03, 0.36, 8, M('#888')), 0, 0, 0);
    const bk = new THREE.Group(); bk.position.set(-2.1, 0, -D / 2 + 0.22); sc.add(bk);
    const wd = M('#6a4e36'); add(bk, box(1.2, 1.9, 0.03, wd, 'bottom'), 0, 0, -0.155); for (const sx of [-1, 1]) add(bk, box(0.04, 1.9, 0.34, wd, 'bottom'), sx * 0.58, 0, 0);
    for (let k = 0; k < 5; k++) add(bk, box(1.16, 0.03, 0.32, wd, 'bottom'), 0, 0.06 + k * 0.45, 0);
    const R = rng(7); for (let k = 0; k < 4; k++) { let x = -0.53; while (x < 0.5) { const w = 0.03 + R() * 0.05, h = 0.22 + R() * 0.14; const lean = R() < 0.08; const b = box(w, h, 0.22, M(['#c8281e', '#1d3b52', '#e8e2d4', '#2f4034', '#d8a830', '#222'][(R() * 6) | 0]), 'bottom'); b.position.set(x + w / 2, 0.09 + k * 0.45, -0.02); if (lean) b.rotation.z = -0.25; bk.add(b); x += w + 0.006 + (lean ? 0.06 : 0); } }
    const plant = new THREE.Group(); plant.position.set(-0.95, 0, -D / 2 + 0.35); sc.add(plant); add(plant, cyl(0.16, 0.12, 0.34, 10, M('#c8b8a0')), 0, 0.17, 0);
    for (let i = 0; i < 9; i++) { const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), M('#3d7a3a', 0.12)); lf.position.set((R() - 0.5) * 0.3, 0.45 + R() * 0.55, (R() - 0.5) * 0.3); lf.scale.set(0.6, 1.4, 0.6); lf.rotation.set(R(), R(), R()); lf.castShadow = true; plant.add(lf); }
    const logo = R3.poster('pdlogo', 0.7, 0.7, (g, w, h) => { g.fillStyle = '#0c0f0f'; g.fillRect(0, 0, w, h); g.fillStyle = '#f0e8da'; g.font = `800 64px ${HEL}`; g.textAlign = 'center'; g.fillText('P(●)', w / 2, 92); g.font = `800 16px ${HEL}`; g.fillText('PUBLIC DOOM', w / 2, 130); g.fillStyle = '#a6d7e6'; g.fillRect(24, 140, w - 48, 3); }, [180, 180]);
    logo.position.set(-0.95, 1.95, -D / 2 + 0.01); sc.add(logo);
    // crew gear: ring light + tripod camera (visible in the reveal)
    const ring = new THREE.Group(); ring.position.set(0.6, 0, 1.5); sc.add(ring); add(ring, cyl(0.015, 0.015, 1.6, 6, M('#222')), 0, 0.8, 0); const rl = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 6, 20), glow('#fff6e8', 2.2)); rl.position.y = 1.65; ring.add(rl);
    const lights_ = lights(sc, { hemiSky: 0xeef2ff, hemiGround: 0x4a4a48, hemi: 0.95, sun: 0xfff6e8, sunI: 0.0, shadow: false });
    const fill = new THREE.PointLight(0xfff0dc, 2.0, 7, 1.2); fill.position.set(0.4, 2.3, 1.2); sc.add(fill);
    return { scene: sc, mon, chair, wbScr, wb, thChair, sun, ring, desk, W, D, Hh,
      thSeat: [-1.7, 0.46, -1.6, 0.5], deskSeat: [1.9, 0.5, 0.4, -Math.PI / 2] };
  });
}

// ---------------- small props ----------------
export function suitcase(col = '#7a45e0') {
  const g = new THREE.Group(); const m = M(col, 0.05), d = M(shade(col, 0.6), 0.05);
  add(g, box(0.42, 0.56, 0.2, [m, m, m, m, lam({ map: ptex('suit' + col, 16, 24, (gg, w, h, R) => { noiseFill(gg, w, h, col, 0.05, R); gg.fillStyle = shade(col, 0.7); for (let x = 3; x < w; x += 5) gg.fillRect(x, 0, 1, h); gg.fillStyle = '#ffd60a'; gg.fillRect(2, 3, 4, 3); }) }), m], 'bottom'), 0, 0.04, 0);
  add(g, box(0.16, 0.05, 0.03, d, 'bottom'), 0, 0.6, 0); for (const x of [-0.15, 0.15]) add(g, cyl(0.025, 0.025, 0.03, 8, M('#111')), x, 0.02, 0.06, 0, 0, Math.PI / 2);
  return sh(g);
}
export function necktie(col = '#c8281e') { const g = new THREE.Group(); const m = M(col, 0.04); add(g, box(0.05, 0.04, 0.02, m, 'center'), 0, 0, 0); const b = soft(0.24, [0.04, 0.012], [0.07, 0.012], m, { pivot: 'top', seg: 4, rings: 2 }); b.position.y = -0.02; g.add(b); return g; }
// low-poly brain (two lobes, folded) with a bandage
export function brain(col = '#f29bb0') {
  const g = new THREE.Group();
  const mk = (sx) => { const geo = new THREE.IcosahedronGeometry(0.5, 4); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const f = 1 + 0.07 * Math.sin(x * 22 + Math.sin(z * 14) * 2) * Math.cos(y * 18 + z * 6); p.setXYZ(i, x * 0.62 * f, y * 0.78 * f, z * 1.05 * f); } geo.computeVertexNormals(); const m = new THREE.Mesh(geo, lam({ color: new THREE.Color(col), flat: true })); m.position.x = sx * 0.33; m.castShadow = true; return m; };
  g.add(mk(-1), mk(1));
  const stem = soft(0.36, [0.16, 0.16], [0.1, 0.1], M('#d88098'), { pivot: 'top', seg: 8, rings: 2 }); stem.position.set(0, -0.28, -0.2); stem.rotation.x = 0.3; g.add(stem);
  const band = M('#f4efe2', 0.04); const b1 = box(0.16, 0.02, 0.9, band, 'center'); b1.position.set(0.15, 0.39, 0.05); b1.rotation.set(0.15, 0.6, 0.0); g.add(b1); const b2 = b1.clone(); b2.rotation.y = -0.6; b2.position.x = -0.12; g.add(b2);
  return g;
}

// ---------------- THE INFINITE LIBRARY (entire history of human knowledge) ----------------
export function library(ctx) {
  return cached(ctx, 'library', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x0c0a12); sc.fog = new THREE.Fog(0x0c0a12, 12, 70);
    const bookT = ptex('books', 64, 64, (g, w, h, R) => { g.fillStyle = '#2a1a10'; g.fillRect(0, 0, w, h); for (let row = 0; row < 4; row++) { let x = 0; while (x < w) { const bw = 2 + (R() * 4 | 0); g.fillStyle = ['#8a2a1e', '#1d3b52', '#d8b060', '#2f5a3a', '#6a3a7a', '#c8c0a8', '#a6d7e6', '#ff7e5a'][(R() * 8) | 0]; g.fillRect(x, row * 16 + 2 + (R() * 2 | 0), bw, 13); x += bw; } g.fillStyle = '#4a2e1a'; g.fillRect(0, row * 16 + 15, w, 1); } }, { repeat: [3, 2] });
    const shelfM = lam({ map: bookT }), wood = M('#4a2e1a', 0.06);
    const rows = new THREE.Group(); sc.add(rows);
    for (let k = 0; k < 16; k++) for (const sx of [-1, 1]) { const s = box(0.6, 6, 6, [shelfM, shelfM, wood, wood, wood, wood], 'bottom'); s.position.set(sx * 2.2, 0, -k * 7); s.rotation.y = sx > 0 ? 0 : Math.PI; rows.add(s); const s2 = box(0.6, 6, 6, [shelfM, shelfM, wood, wood, wood, wood], 'bottom'); s2.position.set(sx * 2.2, 6, -k * 7); rows.add(s2); }
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(8, 140), lam({ map: ptex('libfl', 16, 16, (g, w, h, R) => { noiseFill(g, w, h, '#5a2a24', 0.1, R); g.fillStyle = '#d8b060'; g.fillRect(0, 0, 1, h); g.fillRect(w - 1, 0, 1, h); }, { repeat: [1, 20] }) })); fl.rotation.x = -Math.PI / 2; fl.position.z = -60; fl.receiveShadow = true; sc.add(fl);
    const lampM = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.4, 1.4), toneMapped: false });
    const lamps = []; for (let k = 0; k < 16; k++) { const l = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), lampM); l.position.set(0, 4.6, -k * 7 - 3.5); sc.add(l); if (k % 3 === 0) { const p = new THREE.PointLight(0xffc880, 6, 14, 1.4); p.position.copy(l.position); sc.add(p); lamps.push(p); } }
    const R = rng(21); const books = [];
    for (let i = 0; i < 60; i++) { const b = box(0.32, 0.44, 0.08, [M('#e8e0c8'), M('#e8e0c8'), M('#e8e0c8'), M('#e8e0c8'), M(['#c8281e', '#1d3b52', '#ffd60a', '#3ddc84', '#a6d7e6'][i % 5]), M('#2a2a2a')], 'center'); b.userData = { x: (R() - 0.5) * 3, y: 1 + R() * 5, z: -R() * 90, s: R() * 6, sp: 0.2 + R() * 0.6 }; sc.add(b); books.push(b); }
    sc.add(new THREE.HemisphereLight(0x8a7aa0, 0x1a1010, 0.6));
    return { scene: sc, books, upd(t) { for (const b of books) { const u = b.userData; b.position.set(u.x + Math.sin(t * u.sp + u.s) * 0.2, u.y + Math.sin(t * 0.7 + u.s) * 0.3, u.z); b.rotation.set(t * u.sp + u.s, t * 0.3 + u.s, 0.3); } } };
  });
}
// ---------------- EARTH covered in people holding glowing phones (jump / look-up driven by shots) ----------------
import * as SIM from './sim.js';
export function peoplePlanet(ctx, key = 'pp', n = 1100, R0 = 2) {
  return cached(ctx, key, () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x02030a); SIM.starfield(sc, 23);
    const earth = SIM.morphEarth({ R: R0, nu: 64, nv: 32 }); sc.add(earth.g);
    const cr = SIM.crowd(n, { scale: 0.06, seed: 8 }); sc.add(cr.im);
    const R = rng(5); const pts = []; for (let i = 0; i < n; i++) { const u = R() * 2 - 1, a = R() * Math.PI * 2; const s2 = Math.sqrt(1 - u * u); pts.push(new THREE.Vector3(s2 * Math.cos(a), u, s2 * Math.sin(a))); }
    // phone glows: tiny emissive quads hovering in front of each head
    const ph = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.018, 0.026), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 2.2, 2.6), toneMapped: false, side: THREE.DoubleSide }), n); sc.add(ph);
    const sun = new THREE.DirectionalLight(0xfff4e0, 2.4); sun.position.set(6, 3, 5); sc.add(sun); sc.add(new THREE.HemisphereLight(0x8090c0, 0x101018, 0.5));
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    // jump(t) -> [height, squash]; look 0 phone-down .. 1 look up
    function upd(t, { jump = null, phones = 1, look = 0 } = {}) {
      for (let i = 0; i < n; i++) {
        const nrm = pts[i]; const [jy, sq] = jump ? jump(t, i) : [0, 1];
        cr.place(i, v.copy(nrm).multiplyScalar(R0), nrm, jy * 0.05, i * 2.3, sq);
        q.setFromUnitVectors(up, nrm); const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
        const hp = v.copy(nrm).multiplyScalar(R0 + 0.035 + jy * 0.05).addScaledVector(fwd, 0.012);
        m4.compose(hp, q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -1.2 + look * 1.2)), one.set(phones, phones, phones)); ph.setMatrixAt(i, m4);
      }
      cr.done(); ph.instanceMatrix.needsUpdate = true;
    }
    upd(0);
    return { scene: sc, earth, cr, ph, pts, upd, sun, R0 };
  });
}
export function gasMask() { const gm = new THREE.Group(); const rub = M('#2e332e', 0.06); const v = soft(0.17, [0.2, 0.13], [0.16, 0.12], rub, { pivot: 'center', seg: 10, rings: 3, capT: 0.3, capB: 0.3 }); gm.add(v); for (const sx of [-1, 1]) { const l = cyl(0.042, 0.042, 0.03, 12, new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.78, 0.9) })); l.rotation.x = Math.PI / 2; l.position.set(sx * 0.05, 0.035, 0.065); gm.add(l); const r = new THREE.Mesh(new THREE.TorusGeometry(0.044, 0.008, 4, 12), M('#111')); r.position.set(sx * 0.05, 0.035, 0.08); gm.add(r); } const can_ = cyl(0.045, 0.055, 0.08, 10, M('#3a3f2a')); can_.rotation.x = Math.PI / 2 + 0.4; can_.position.set(0, -0.05, 0.1); gm.add(can_); const cap = cyl(0.058, 0.058, 0.02, 10, M('#d8b830')); cap.rotation.x = Math.PI / 2 + 0.4; cap.position.set(0, -0.065, 0.145); gm.add(cap); return sh(gm); }
export function spatula() { const g = new THREE.Group(); add(g, box(0.02, 0.26, 0.02, M('#222'), 'top'), 0, 0, 0); add(g, box(0.08, 0.1, 0.008, M('#888'), 'top'), 0, -0.26, 0); return g; }
export function flames(n = 7) { const g = new THREE.Group(); const ms = [new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 1.6, 0.3), toneMapped: false }), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 3, 0.8), toneMapped: false })]; const list = []; for (let i = 0; i < n; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.14, 5), ms[i % 2]); f.position.set(Math.cos(i * 2.4) * 0.06, 0.07, Math.sin(i * 2.4) * 0.06); g.add(f); list.push(f); } g.userData.list = list; const L = new THREE.PointLight(0xff7a2a, 3, 3, 1.5); L.position.y = 0.25; g.add(L); g.userData.light = L; return g; }
export function flicker(fl, t) { fl.userData.list.forEach((f, i) => { const s = 0.7 + 0.5 * Math.abs(Math.sin(t * (13 + i * 3.1) + i)); f.scale.set(1, s, 1); f.rotation.y = t * 3 + i; }); fl.userData.light.intensity = 2.5 + 1.2 * Math.sin(t * 23); }
// the product nobody will ever buy: the BUNKER TOASTER 3000 (chrome toaster in camo armour with an antenna)
export function bunkerToaster() {
  const g = new THREE.Group(); const chrome = phong({ color: new THREE.Color('#c8ccd4'), spec: 0xffffff, shin: 80 });
  const camo = lam({ map: ptex('camo', 32, 32, (gg, w, h, R) => { gg.fillStyle = '#5a6a3a'; gg.fillRect(0, 0, w, h); for (let i = 0; i < 26; i++) { gg.fillStyle = ['#3a4a2a', '#7a7a4a', '#2a2a1e'][i % 3]; gg.beginPath(); gg.ellipse(R() * w, R() * h, 2 + R() * 5, 1 + R() * 3, R() * 3, 0, 7); gg.fill(); } }) });
  add(g, box(0.6, 0.4, 0.36, [camo, camo, chrome, chrome, lam({ map: ptex('bt3000', 64, 32, (gg, w, h) => { gg.fillStyle = '#5a6a3a'; gg.fillRect(0, 0, w, h); gg.fillStyle = '#ffd60a'; gg.fillRect(4, 10, w - 8, 12); gg.fillStyle = '#111'; gg.font = `800 9px ${HEL}`; gg.textAlign = 'center'; gg.fillText('BUNKER 3000', w / 2, 19); }) }), camo], 'bottom'), 0, 0, 0);
  for (const dz of [-0.07, 0.07]) add(g, box(0.4, 0.01, 0.04, M('#111'), 'center'), 0, 0.402, dz);
  add(g, cyl(0.008, 0.008, 0.5, 6, M('#222')), 0.22, 0.65, -0.1); add(g, new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), glow('#ff3b30', 3)), 0.22, 0.9, -0.1);
  for (const sx of [-1, 1]) add(g, box(0.05, 0.1, 0.4, chrome, 'bottom'), sx * 0.32, 0.02, 0);
  const lever = box(0.06, 0.04, 0.06, glow('#ffd60a', 1.4), 'center'); lever.position.set(0.32, 0.25, 0.12); g.add(lever);
  return sh(g);
}
export function backScratcher() { const g = new THREE.Group(); add(g, box(0.02, 0.5, 0.02, M('#a8783a'), 'top'), 0, 0, 0); const hd = soft(0.07, [0.05, 0.015], [0.06, 0.015], M('#c8a060'), { pivot: 'top', seg: 6, rings: 2 }); hd.position.y = -0.48; g.add(hd); return g; }

// ---------------- THE STUDIO (dramatization): open-plan office, five desks, storyboard wall, corkboard, copier ----------------
export function studioOffice(ctx) {
  return cached(ctx, 'studio', () => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0xdfe6ea);
    const W = 10, D = 8, Hh = 3.0;
    const walls = room(sc, { w: W, d: D, h: Hh, wall: wp('studio', '#e8e4da', null, [6, 2]), floor: carpet('studio', '#7a8a94', [12, 10]), ceil: '#f2f0ea', front: true });
    // window wall (back) with city
    const city = ptex('studiocity', 128, 48, (g, w, h, R) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9fd2f2'); gr.addColorStop(1, '#eaf6fc'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let x = 0; x < w;) { const bw = 5 + R() * 10 | 0, bh = 12 + R() * 30 | 0; g.fillStyle = ['#b8c4cc', '#a8b4bc', '#c8d0d6'][(R() * 3) | 0]; g.fillRect(x, h - bh, bw, bh); for (let y = h - bh + 2; y < h - 1; y += 3) for (let xx = x + 1; xx < x + bw - 1; xx += 2) if (R() > 0.6) { g.fillStyle = '#8aa0b0'; g.fillRect(xx, y, 1, 1); } x += bw + 1; } });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.8), new THREE.MeshBasicMaterial({ map: city, color: new THREE.Color(1.6, 1.6, 1.6), toneMapped: false })); win.position.set(0, 1.75, -D / 2 + 0.01); sc.add(win);
    for (let i = 0; i <= 8; i++) add(sc, box(0.06, 1.9, 0.06, M('#5a6066'), 'center'), -4 + i, 1.75, -D / 2 + 0.04);
    // ceiling light panels
    const panM = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.2, 2.1), toneMapped: false });
    for (let x = -3; x <= 3; x += 3) for (let z = -2; z <= 2; z += 2) { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.5), panM); p.rotation.x = Math.PI / 2; p.position.set(x, Hh - 0.01, z); sc.add(p); }
    // desks: [x, z, ry] — the worker sits at +z side facing -z unless rotated
    const deskSpots = [[-3.2, -1.6, 0], [-1.0, -1.6, 0], [1.2, -1.6, 0], [-2.1, 1.0, Math.PI], [0.4, 1.0, Math.PI]];
    const desks = deskSpots.map(([x, z, ry], i) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; sc.add(g);
      const tb = P.table(1.5, 0.75, 0.74, '#d8d0c0'); g.add(tb);
      add(g, box(1.6, 0.5, 0.04, M('#5a7a8a', 0.04), 'bottom'), 0, 0.74, -0.42); // partition
      const mon = monitor(0.6, 0.35, [640, 372], 1.3); mon.g.position.set(0, 1.04, -0.28); g.add(mon.g);
      const chair = gamingChair('#3a4a5a'); chair.g.position.set(0, 0, 0.55); g.add(chair.g);
      const mugp = R3.mug(['#ff3b30', '#a6d7e6', '#ffd60a', '#f0e8da', '#3ddc84'][i]); mugp.position.set(0.55, 0.74, 0.1); g.add(mugp);
      return { g, mon, chair, seat: [x + Math.sin(ry) * 0.55, 0.5, z + Math.cos(ry) * 0.55, ry + Math.PI] };
    });
    // paper stacks on the researcher desk
    for (let i = 0; i < 4; i++) { const st = box(0.24, 0.05 + i * 0.04, 0.32, M('#f4f2ea', 0.03), 'bottom'); st.position.set(-0.5 + i * 0.08, 0.74, 0.0); st.rotation.y = i * 0.2; desks[0].g.add(st); }
    // corkboard + storyboard (left wall)
    const cork = new P.Screen(1024, 512, 1.0); const corkM = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), lam({ map: cork.tex })); corkM.position.set(-W / 2 + 0.02, 1.6, -1.2); corkM.rotation.y = Math.PI / 2; sc.add(corkM);
    const story = new P.Screen(1024, 400, 1.0); const storyM = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.17), lam({ map: story.tex })); storyM.position.set(-W / 2 + 0.02, 1.6, 2.0); storyM.rotation.y = Math.PI / 2; sc.add(storyM);
    // copier (front-right)
    const copier = new THREE.Group(); copier.position.set(3.6, 0, 2.6); copier.rotation.y = -Math.PI / 2 - 0.3; sc.add(copier);
    add(copier, box(0.9, 1.0, 0.7, [M('#e8e6e0'), M('#e8e6e0'), M('#c8c6c0'), M('#888'), lam({ map: ptex('copierfront', 32, 32, (g, w, h) => { g.fillStyle = '#e8e6e0'; g.fillRect(0, 0, w, h); g.fillStyle = '#9aa'; g.fillRect(2, 18, w - 4, 2); g.fillRect(2, 24, w - 4, 2); g.fillStyle = '#3ddc84'; g.fillRect(24, 4, 4, 3); }) }), M('#e8e6e0')], 'bottom'), 0, 0, 0);
    add(copier, box(0.5, 0.04, 0.4, M('#f8f8f4'), 'bottom'), 0.0, 0.62, 0.48);
    const plant = new THREE.Group(); plant.position.set(4.3, 0, -3.4); sc.add(plant); add(plant, cyl(0.2, 0.16, 0.42, 10, M('#c8b8a0')), 0, 0.21, 0); for (let i = 0; i < 10; i++) { const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), M('#3d7a3a', 0.12)); lf.position.set(Math.sin(i * 2.4) * 0.2, 0.55 + (i % 4) * 0.22, Math.cos(i * 2.4) * 0.2); lf.scale.set(0.6, 1.5, 0.6); plant.add(lf); }
    const sign = R3.poster('studiosign', 1.6, 0.4, (g, w, h) => { g.fillStyle = '#0c0f0f'; g.fillRect(0, 0, w, h); g.fillStyle = '#f0e8da'; g.font = `800 38px ${HEL}`; g.textAlign = 'center'; g.fillText('THE STUDIO', w / 2, 52); g.fillStyle = '#a6d7e6'; g.font = `600 18px ${HEL}`; g.fillText('(a dramatization)', w / 2, 80); }, [320, 96]);
    sign.position.set(0, 2.55, -D / 2 + 0.05); sc.add(sign);
    sh(copier);
    lights(sc, { hemiSky: 0xf4f8ff, hemiGround: 0x6a6a68, hemi: 1.05, sun: 0xfff6ea, sunI: 1.1, sunPos: [3, 8, -6], area: 7 });
    return { scene: sc, desks, cork, story, copier, W, D, Hh };
  });
}
export function lightBulb() { const g = new THREE.Group(); const on = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 3.0, 1.6), toneMapped: false }), off = M('#e8e8e0'); const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 1), off); b.scale.set(1, 1.15, 1); g.add(b); add(g, cyl(0.04, 0.045, 0.06, 8, M('#a8a8a0')), 0, -0.11, 0); g.userData = { set(v) { b.material = v ? on : off; } }; return g; }
// low-poly sabre-tooth (procedural run cycle) — origin between the feet, faces +z
export function sabretooth() {
  const g = new THREE.Group(); const fur = lam({ map: ptex('tigerfur', 32, 16, (gg, w, h, R) => { noiseFill(gg, w, h, '#d8892e', 0.08, R); gg.fillStyle = '#3a2210'; for (let x = 2; x < w; x += 5) gg.fillRect(x + (R() * 2 | 0), 0, 2, h * 0.7); }) }), belly = M('#f0d8b0'), dark = M('#2a1a10');
  const root = new THREE.Group(); root.position.y = 0.75; g.add(root);
  const body = soft(1.3, [0.5, 0.55], [0.46, 0.5], [fur, fur, fur, belly, fur, fur], { pivot: 'center', seg: 10, rings: 6, capT: 0.4, capB: 0.4, capK: 0.8, bulge: 0.1 }); body.rotation.x = Math.PI / 2; root.add(body);
  const neck = new THREE.Group(); neck.position.set(0, 0.12, 0.62); root.add(neck);
  const head = soft(0.42, [0.34, 0.3], [0.3, 0.26], fur, { pivot: 'bottom', seg: 9, rings: 4, capT: 0.5, capK: 0.8 }); head.rotation.x = Math.PI / 2 - 0.2; neck.add(head);
  const jaw = soft(0.3, [0.2, 0.08], [0.24, 0.1], belly, { pivot: 'bottom', seg: 6, rings: 2, capT: 0.4 }); jaw.rotation.x = Math.PI / 2 + 0.25; jaw.position.y = -0.1; neck.add(jaw);
  for (const sx of [-1, 1]) { const fang = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.26, 5), M('#f8f4e8')); fang.position.set(sx * 0.07, -0.12, 0.36); fang.rotation.x = Math.PI + 0.25; neck.add(fang); const eye = new THREE.Mesh(new THREE.IcosahedronGeometry(0.035, 0), glow('#ffd60a', 2)); eye.position.set(sx * 0.11, 0.08, 0.3); neck.add(eye); const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 4), fur); ear.position.set(sx * 0.12, 0.17, 0.08); neck.add(ear); }
  const legs = []; for (const [x, z, fr] of [[0.18, 0.45, 1], [-0.18, 0.45, 1], [0.18, -0.45, 0], [-0.18, -0.45, 0]]) { const hip = new THREE.Group(); hip.position.set(x, -0.05, z); root.add(hip); const up = soft(0.42, [0.15, 0.17], [0.11, 0.12], fur, { pivot: 'top', seg: 7, rings: 3, capT: 0.3 }); hip.add(up); const kn = new THREE.Group(); kn.position.y = -0.4; hip.add(kn); const lo = soft(0.36, [0.1, 0.1], [0.09, 0.12], fur, { pivot: 'top', seg: 7, rings: 3, capB: 0.3 }); kn.add(lo); legs.push({ hip, kn, fr, side: x > 0 ? 0 : 1 }); }
  const tail = soft(0.5, [0.06, 0.06], [0.03, 0.03], fur, { pivot: 'bottom', seg: 6, rings: 3 }); tail.position.set(0, 0.12, -0.72); tail.rotation.x = -2.2; root.add(tail);
  function pose(t, speed = 1) { const ph = t * 9 * speed; legs.forEach((L, i) => { const p = ph + (L.fr ? 0 : Math.PI) + L.side * 0.6; L.hip.rotation.x = Math.sin(p) * 0.7; L.kn.rotation.x = Math.max(0, -Math.cos(p)) * (L.fr ? -1.0 : 1.0); }); root.position.y = 0.75 + Math.abs(Math.sin(ph)) * 0.08; root.rotation.x = Math.sin(ph) * 0.06; neck.rotation.x = Math.sin(ph * 2) * 0.05 - 0.1; tail.rotation.x = -2.2 + Math.sin(ph) * 0.3; }
  pose(0); return { g: sh(g), pose };
}
// low-poly dinosaur (long-neck) for the extinction sim
export function dino(col = '#5a8a4a') {
  const g = new THREE.Group(); const m = M(col, 0.1), b = M(shade(col, 1.3), 0.08);
  const body = soft(2.2, [1.0, 1.1], [0.9, 1.0], [m, m, m, b, m, m], { pivot: 'center', seg: 10, rings: 6, capT: 0.45, capB: 0.45, capK: 0.85, bulge: 0.12 }); body.rotation.x = Math.PI / 2; body.position.y = 1.9; g.add(body);
  const neck = soft(2.4, [0.24, 0.24], [0.5, 0.5], m, { pivot: 'bottom', seg: 8, rings: 5 }); neck.position.set(0, 2.1, 0.9); neck.rotation.x = 0.55; g.add(neck);
  const head = soft(0.55, [0.3, 0.32], [0.3, 0.32], m, { pivot: 'bottom', seg: 8, rings: 3, capT: 0.5, capB: 0.3 }); head.position.set(0, 4.15, 2.25); head.rotation.x = 1.3; g.add(head);
  const tail = soft(2.8, [0.08, 0.08], [0.5, 0.5], m, { pivot: 'bottom', seg: 8, rings: 5 }); tail.position.set(0, 1.85, -1.0); tail.rotation.x = -1.9; g.add(tail);
  for (const [x, z] of [[0.38, 0.6], [-0.38, 0.6], [0.38, -0.6], [-0.38, -0.6]]) { const l = soft(1.7, [0.36, 0.36], [0.3, 0.32], m, { pivot: 'top', seg: 8, rings: 3, capB: 0.2 }); l.position.set(x, 1.7, z); g.add(l); }
  return sh(g);
}
// instanced grass blades (for touch grass)
export function grassPatch(n = 2500, size = 3, seed = 4) {
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute([-0.012, 0, 0, 0.012, 0, 0, 0, 0.16, 0], 3)); geo.computeVertexNormals();
  const im = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, flatShading: true }), n); const R = rng(seed); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
  const meta = []; for (let i = 0; i < n; i++) { meta.push({ x: (R() - 0.5) * size, z: (R() - 0.5) * size, h: 0.6 + R() * 1.0, ry: R() * 6.28, lean: (R() - 0.5) * 0.4, ph: R() * 6.28 }); im.setColorAt(i, c.set(['#4f9a3a', '#5fae44', '#3f8a32', '#7cc24f'][i % 4])); }
  im.userData.upd = (t, press = null) => { for (let i = 0; i < n; i++) { const b = meta[i]; let lean = b.lean + 0.12 * Math.sin(t * 2 + b.ph); if (press) { const dx = b.x - press[0], dz = b.z - press[1]; const d = Math.hypot(dx, dz); if (d < press[2]) lean += (1 - d / press[2]) * 1.2 * Math.sign(dx || 1); } e.set(0, b.ry, lean); q.setFromEuler(e); m4.compose(new THREE.Vector3(b.x, 0, b.z), q, new THREE.Vector3(1, b.h, 1)); im.setMatrixAt(i, m4); } im.instanceMatrix.needsUpdate = true; };
  im.userData.upd(0); im.receiveShadow = true; return im;
}
export function kite() { const g = new THREE.Group(); const sh = new THREE.Shape([new THREE.Vector2(0, 0.45), new THREE.Vector2(0.3, 0), new THREE.Vector2(0, -0.6), new THREE.Vector2(-0.3, 0)]); const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshLambertMaterial({ color: 0xff3b30, side: THREE.DoubleSide })); g.add(m); const m2 = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0.45), new THREE.Vector2(0.3, 0), new THREE.Vector2(0, 0)])), new THREE.MeshLambertMaterial({ color: 0xffd60a, side: THREE.DoubleSide })); m2.position.z = 0.002; g.add(m2); return g; }

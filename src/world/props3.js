// FOR RESEARCH PURPOSES props: 1960s console CRT, podcast kit, phone, alarm clock, courtroom kit, burger, hats,
// fridge-on-wheels, calculators, ballot box, misc. Painted pixel textures, low poly.
import * as THREE from 'three';
import { box, taper, lam, basic, cmat, cyl, at, group } from './kit.js';
import { ptex, shade, noiseFill, hex2rgb, textTex } from './tex.js';
import { Screen } from './props.js';
import { rng, clamp, hash2, lerp } from '../core.js';
import { SANS, MONO, UI, TIMES } from '../ov/overlay.js';
import { clipFrame } from '../ov/overlay.js';

export const glow = (hex, k = 2.5) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), toneMapped: false });
export const add = (g, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { m.position.set(x, y, z); m.rotation.set(rx, ry, rz); g.add(m); return m; };
const shadows = g => { g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };

// ---------- wood with painted grain (the reference's bench look) ----------
export function woodTex(key, base = '#8a5a34', w = 32, h = 32, rep = null, planks = 4) {
  return ptex('wood3:' + key + base + planks, w, h, (g, W, H, R) => {
    noiseFill(g, W, H, base, 0.04, R);
    const ph = H / planks;
    for (let p = 0; p < planks; p++) {
      const y0 = Math.round(p * ph);
      g.fillStyle = shade(base, 0.62); g.fillRect(0, y0, W, 1);
      g.fillStyle = shade(base, 1.12); g.fillRect(0, y0 + 1, W, 1);
      for (let k = 0; k < 3; k++) { const y = y0 + 2 + Math.floor(R() * (ph - 3)); const x = Math.floor(R() * W * 0.6); g.fillStyle = shade(base, 0.8); g.fillRect(x, y, Math.floor(W * (0.2 + R() * 0.4)), 1); }
    }
  }, rep ? { repeat: rep } : {});
}

// ---------- 1960s console CRT TV (rounded tube, wood cabinet, tapered legs, rabbit ears) ----------
// draw(g, w, h) paints the picture; the prop adds scanlines, curvature shading and the rounded mask.
export function crt60({ legs = true, wood = '#7a4b2a', scale = 1 } = {}) {
  const g = new THREE.Group(); g.scale.setScalar(scale);
  const woodM = lam({ map: woodTex('crtcab', wood, 32, 32, null, 3) }), dark = cmat('#2b211a', 0.04), metal = cmat('#c9c3b5', 0.03);
  const W = 1.05, Hc = 0.82, D = 0.62, y0 = legs ? 0.32 : 0;
  add(g, box(W, Hc, D, [woodM, woodM, woodM, woodM, dark, woodM], 'bottom'), 0, y0, 0);
  // bezel: cream plastic surround with rounded tube inside
  const bez = ptex('crtbez', 64, 48, (c, w, h, R) => { noiseFill(c, w, h, '#d9d0bb', 0.03, R); c.fillStyle = '#1a1612'; c.beginPath(); c.roundRect(5, 4, 42, 40, 9); c.fill(); c.fillStyle = '#8f8670'; c.fillRect(51, 6, 9, 36); for (let y = 8; y < 40; y += 2) { c.fillStyle = '#6e6654'; c.fillRect(52, y, 7, 1); } });
  add(g, new THREE.Mesh(new THREE.PlaneGeometry(W * 0.94, Hc * 0.9), lam({ map: bez })), 0, y0 + Hc / 2, D / 2 + 0.002);
  const scr = new Screen(640, 480, 1.25);
  const sw = W * 0.94 * (42 / 64), sh = Hc * 0.9 * (40 / 48);
  const sx = -W * 0.94 / 2 + W * 0.94 * (26 / 64), sy = y0 + Hc / 2 + Hc * 0.9 * (0.5 - 24 / 48);
  // slightly bulged tube
  const tg = new THREE.PlaneGeometry(sw * 0.97, sh * 0.97, 12, 10); const p = tg.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) / (sw / 2), y = p.getY(i) / (sh / 2); p.setZ(i, 0.035 * (1 - x * x * 0.6 - y * y * 0.6)); }
  tg.computeVertexNormals();
  const tube = add(g, new THREE.Mesh(tg, scr.mat), sx, sy, D / 2 + 0.004); tube.userData.noSelf = true;
  // knobs on the speaker panel
  for (const [ky, kr] of [[0.18, 0.045], [0.02, 0.038]]) { const k = cyl(kr, kr, 0.04, 10, metal); k.rotation.x = Math.PI / 2; add(g, k, W * 0.94 * (0.5 - 9.5 / 64) - 0.02, y0 + Hc / 2 + ky, D / 2 + 0.02, Math.PI / 2); }
  if (legs) for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { const l = taper(y0 + 0.02, [0.05, 0.05], [0.025, 0.025], dark, { pivot: 'top', off: [0, 0] }); l.position.set(x * (W / 2 - 0.08), y0 + 0.01, z * (D / 2 - 0.08)); l.rotation.z = x * 0.12; l.rotation.x = -z * 0.1; g.add(l); }
  // rabbit ears
  const ant = new THREE.Group(); add(g, ant, -0.1, y0 + Hc, -0.05);
  add(ant, new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), dark));
  for (const s of [-1, 1]) { const r = cyl(0.006, 0.006, 0.62, 4, metal); r.position.set(s * 0.15, 0.28, 0); r.rotation.z = -s * 0.55; ant.add(r); }
  shadows(g); tube.castShadow = false;
  const light = new THREE.PointLight(0xa8c8ff, 0, 4.5, 1.6); light.position.set(sx, sy, D / 2 + 0.6); g.add(light);
  return { g, scr, tube, light, center: [sx, sy, D / 2] };
}
// paint a CRT picture: content(g, w, h) then scanlines, bloom-ish edge glow, rounded-tube vignette, optional power on/off
export async function crtPaint(scr, t, content, { on = 1, noise = 0.06, roll = 0, tint = null, light = null } = {}) {
  await scr.draw(async (g, w, h) => {
    g.fillStyle = '#05070a'; g.fillRect(0, 0, w, h);
    if (on > 0) {
      g.save();
      // power-on: line -> full picture
      const vs = clamp(on * 1.6, 0.004, 1), hs = clamp(on * 3, 0.02, 1);
      g.translate(w / 2, h / 2); g.scale(hs, vs); g.translate(-w / 2, -h / 2);
      if (roll) g.translate(0, (roll % 1) * h);
      await content(g, w, h);
      if (roll) { g.translate(0, -h); await content(g, w, h); }
      g.restore();
      if (tint) { g.globalCompositeOperation = 'multiply'; g.fillStyle = tint; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over'; }
      // scanlines + static
      g.fillStyle = 'rgba(0,0,0,0.28)'; for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
      if (noise > 0) { const R = rng(Math.floor(t * 60) * 7 + 3); for (let i = 0; i < 900 * noise / 0.06; i++) { g.fillStyle = R() < 0.5 ? `rgba(255,255,255,${noise * 2})` : `rgba(0,0,0,${noise * 2})`; g.fillRect(R() * w, R() * h, 2, 1); } }
      if (on < 1) { g.fillStyle = `rgba(255,255,255,${clamp(1 - on * 2.2) * 0.9})`; g.fillRect(0, h / 2 - 3, w, 6); }
    }
    // tube vignette (rounded corners darker)
    const gr = g.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.78); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.75)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.07)'; g.beginPath(); g.ellipse(w * 0.32, h * 0.25, w * 0.22, h * 0.1, -0.35, 0, 7); g.fill();
  });
  if (light) light.intensity = on * 2.6;
}
// helper: draw a named clip frame (4:3 crop already baked into the clip) to fill the tube
export async function clipContent(name, local, { zoom = 1, cx = 0.5, cy = 0.5, filter = null } = {}) {
  const img = await clipFrame(name, local);
  return (g, w, h) => {
    const ar = img.width / img.height, tar = w / h; let sw = img.width, sh = img.height; if (ar > tar) sw = img.height * tar; else sh = img.width / tar; sw /= zoom; sh /= zoom;
    const sx = clamp((img.width - sw) * cx, 0, img.width - sw), sy = clamp((img.height - sh) * cy, 0, img.height - sh);
    if (filter) g.filter = filter; g.drawImage(img, sx, sy, sw, sh, 0, 0, w, h); g.filter = 'none';
  };
}

// ---------- podcast kit ----------
export function podMic() { // broadcast dynamic mic on a boom arm; origin = desk clamp; mic head at local (0, 0.42, 0.42)
  const g = new THREE.Group(); const blk = cmat('#1b1b1e', 0.04), steel = cmat('#3a3b40', 0.04);
  add(g, box(0.05, 0.1, 0.05, blk, 'bottom'), 0, 0, 0);
  const a1 = box(0.025, 0.42, 0.025, steel, 'bottom'); add(g, a1, 0, 0.08, 0, -0.35);
  const a2 = box(0.025, 0.36, 0.025, steel, 'bottom'); add(g, a2, 0, 0.47, 0.14, -1.25);
  const mic = new THREE.Group(); add(g, mic, 0, 0.44, 0.47, 0.3);
  const body = cyl(0.045, 0.04, 0.17, 10, blk); body.rotation.x = Math.PI / 2; mic.add(body);
  const ws = cyl(0.05, 0.05, 0.05, 10, cmat('#111113', 0.08)); ws.rotation.x = Math.PI / 2; ws.position.z = 0.1; mic.add(ws);
  const yoke = box(0.11, 0.015, 0.06, blk); yoke.position.y = 0.05; mic.add(yoke);
  return shadows(g);
}
export function headphones(col = '#151517') { // fits a 0.22-wide head; origin = crown
  const g = new THREE.Group(); const m = cmat(col, 0.05), pad = cmat('#2a2a2e', 0.05);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.014, 4, 14, Math.PI), m); g.add(band); band.position.y = -0.1;
  for (const s of [-1, 1]) { const cup = cyl(0.055, 0.055, 0.045, 10, pad); cup.rotation.z = Math.PI / 2; cup.position.set(s * 0.135, -0.11, 0); g.add(cup); }
  return shadows(g);
}
export function mug(col = '#f1ece0', label = null) {
  const g = new THREE.Group(); const t = label ? ptex('mug' + col + label, 32, 16, (c, w, h, R) => { noiseFill(c, w, h, col, 0.03, R); c.fillStyle = '#111'; c.font = `700 7px ${UI}`; c.fillText(label, 3, 10); }) : null;
  const m = t ? lam({ map: t }) : cmat(col, 0.03);
  add(g, cyl(0.045, 0.04, 0.11, 10, m), 0, 0.055, 0);
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.009, 4, 8), cmat(col, 0.03)); add(g, h, 0.05, 0.06, 0, 0, 0, Math.PI / 2);
  return shadows(g);
}

// ---------- phone with a live screen ----------
export function phone3d(res = [180, 380]) {
  const scr = new Screen(res[0], res[1], 1.15); const g = new THREE.Group();
  add(g, box(0.075, 0.155, 0.008, cmat('#16161a', 0.03)), 0, 0, 0);
  const s = add(g, new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.144), scr.mat), 0, 0, 0.0045); s.userData.noSelf = true;
  return { g, scr };
}
// ---------- bedside alarm clock (red 7-seg on a live screen) ----------
export function alarmClock() {
  const scr = new Screen(160, 64, 1.6); const g = new THREE.Group();
  add(g, taper(0.1, [0.2, 0.08], [0.22, 0.1], cmat('#1a1a1c', 0.04), { pivot: 'bottom' }), 0, 0, 0);
  add(g, new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.068), scr.mat), 0, 0.052, 0.046, -0.1);
  return { g, scr };
}
export function sevenSeg(g, w, h, text, col = '#ff2a1a') {
  g.fillStyle = '#100404'; g.fillRect(0, 0, w, h);
  g.font = `700 ${h * 0.86}px ${MONO}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = 'rgba(255,40,30,0.08)'; g.fillText('88:88', w / 2, h / 2 + 2);
  g.shadowColor = col; g.shadowBlur = 10; g.fillStyle = col; g.fillText(text, w / 2, h / 2 + 2); g.shadowBlur = 0; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
}

// ---------- courtroom kit ----------
export function gavel() {
  const g = new THREE.Group(); const w = cmat('#5a3418', 0.06);
  const head = cyl(0.04, 0.04, 0.16, 10, w); head.rotation.z = Math.PI / 2; add(g, head, 0, 0, 0);
  add(g, cyl(0.012, 0.012, 0.26, 6, w), 0, -0.13, 0);
  return shadows(g);
}
export function scales() {
  const g = new THREE.Group(); const gold = lam({ color: new THREE.Color('#d4a63a'), emissive: new THREE.Color('#5a3d08'), flat: true });
  add(g, cyl(0.16, 0.2, 0.05, 10, gold), 0, 0.025, 0); add(g, cyl(0.02, 0.02, 0.9, 6, gold), 0, 0.47, 0);
  const beam = new THREE.Group(); add(g, beam, 0, 0.9, 0); add(beam, box(0.9, 0.025, 0.025, gold));
  const pans = [];
  for (const s of [-1, 1]) { const pan = new THREE.Group(); add(beam, pan, s * 0.44, 0, 0); for (const a of [0, 2.1, 4.2]) { const r = cyl(0.003, 0.003, 0.36, 3, gold); r.position.set(Math.cos(a) * 0.08, -0.18, Math.sin(a) * 0.08); r.rotation.set(Math.sin(a) * 0.22, 0, -Math.cos(a) * 0.22); pan.add(r); } const dish = cyl(0.14, 0.1, 0.03, 12, gold); dish.position.y = -0.36; pan.add(dish); pans.push(pan); }
  return { g: shadows(g), beam, pans };
}
export function nameplate(text, w = 0.6, col = '#2a1d12', fg = '#e8d9a8') {
  const t = textTex('plate:' + text + col, 256, 48, (c, W, H) => { c.fillStyle = col; c.fillRect(0, 0, W, H); c.strokeStyle = fg; c.lineWidth = 3; c.strokeRect(4, 4, W - 8, H - 8); c.fillStyle = fg; let fs = 28; c.font = `700 ${fs}px ${TIMES}`; while (c.measureText(text).width > W - 26 && fs > 10) { fs--; c.font = `700 ${fs}px ${TIMES}`; } c.textAlign = 'center'; c.fillText(text, W / 2, 24 + fs * 0.33); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 48 / 256), lam({ map: t })); return m;
}

// ---------- food ----------
export function burger(s = 1, bite = 0) {
  const g = new THREE.Group(); g.scale.setScalar(s);
  const bun = lam({ map: ptex('bun', 16, 16, (c, w, h, R) => { noiseFill(c, w, h, '#d98b3a', 0.06, R); for (let i = 0; i < 14; i++) { c.fillStyle = '#f6e7b8'; c.fillRect(R() * w | 0, R() * h | 0, 1, 2); } }), flat: true });
  const layers = [['bunB', 0.045, 0.11, 0.115, '#d98b3a'], ['patty', 0.035, 0.12, 0.12, '#5a2e18'], ['cheese', 0.012, 0.125, 0.125, '#ffc21a'], ['lettuce', 0.014, 0.13, 0.128, '#5fbf3a'], ['tomato', 0.016, 0.115, 0.115, '#e0402a']];
  let y = 0; for (const [k, h, rt, rb, col] of layers) { const m = cyl(rt, rb, h, 12, k === 'bunB' ? bun : cmat(col, 0.06)); m.position.y = y + h / 2; g.add(m); y += h; }
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), bun); top.scale.y = 0.75; top.position.y = y; g.add(top);
  if (bite) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), cmat('#000')); b.visible = false; g.userData.bite = b; }
  return shadows(g);
}
// ---------- hats & accessories (attach to J.head; origin = top of head) ----------
export function beret(col = '#1a1a1e') { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 6), cmat(col, 0.05)); m.scale.set(1.05, 0.32, 1.0); g.add(m); m.rotation.z = 0.25; m.position.set(-0.02, 0.0, 0); add(g, cyl(0.008, 0.008, 0.03, 4, cmat(col)), 0, 0.05, 0); return shadows(g); }
export function pithHelmet() { const g = new THREE.Group(); const m = cmat('#d8c89a', 0.05); const d = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), m); d.scale.set(1.05, 0.9, 1.15); g.add(d); add(g, cyl(0.22, 0.22, 0.012, 14, m), 0, 0, 0.0); add(g, cyl(0.142, 0.142, 0.02, 12, cmat('#6a5030')), 0, 0.012, 0); return shadows(g); }
export function gradCap(col = '#151518') { const g = new THREE.Group(); const m = cmat(col, 0.04); add(g, cyl(0.12, 0.13, 0.08, 10, m), 0, -0.02, 0); add(g, box(0.34, 0.015, 0.34, m), 0, 0.03, 0, 0, Math.PI / 4); const tas = box(0.012, 0.12, 0.012, lam({ color: new THREE.Color('#e8b93a') }), 'top'); add(g, tas, 0.13, 0.03, 0.0); return shadows(g); }
export function sunglasses() { const g = new THREE.Group(); const m = lam({ color: new THREE.Color('#0b0b0d'), flat: true }); for (const s of [-1, 1]) add(g, box(0.085, 0.045, 0.01, m), s * 0.055, 0, 0); add(g, box(0.04, 0.01, 0.01, m), 0, 0.012, 0); return g; }
export function monocle() { const g = new THREE.Group(); add(g, new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.004, 4, 12), lam({ color: new THREE.Color('#d4a63a') }))); return g; }

// ---------- appliances & misc ----------
export function fridgeCar() { // a beige refrigerator with wheels
  const g = new THREE.Group(); const t = ptex('fridge', 32, 64, (c, w, h, R) => { noiseFill(c, w, h, '#e3d6b4', 0.03, R); c.fillStyle = '#b8aa88'; c.fillRect(0, 22, w, 1); c.fillStyle = '#9a8e72'; c.fillRect(25, 6, 2, 12); c.fillRect(25, 28, 2, 20); c.fillStyle = '#c8bb98'; c.fillRect(2, 2, w - 4, 1); });
  const m = lam({ map: t }), side = cmat('#d8cba8', 0.03);
  add(g, box(0.8, 1.75, 0.75, [side, side, side, side, m, side], 'bottom'), 0, 0.32, 0);
  for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { const w = cyl(0.17, 0.17, 0.12, 10, cmat('#161616', 0.05)); w.rotation.z = Math.PI / 2; add(g, w, x * 0.44, 0.17, z * 0.26); const hub = cyl(0.07, 0.07, 0.125, 8, cmat('#bbb')); hub.rotation.z = Math.PI / 2; add(g, hub, x * 0.44, 0.17, z * 0.26); }
  return shadows(g);
}
export function calculator(kind = 'casio') {
  const g = new THREE.Group(); const body = kind === 'casio' ? '#2d3036' : '#1c2a4a';
  const t = ptex('calc' + kind, 32, 64, (c, w, h, R) => { noiseFill(c, w, h, body, 0.04, R); c.fillStyle = '#9bb08a'; c.fillRect(4, 6, w - 8, 12); c.fillStyle = '#334'; c.font = `700 6px ${MONO}`; c.fillText(kind === 'casio' ? '2+2=' : '42', 7, 15); for (let y = 0; y < 6; y++) for (let x = 0; x < 4; x++) { c.fillStyle = y === 0 ? '#8a4a2a' : kind === 'casio' ? '#4a4e56' : '#d8d8d8'; c.fillRect(4 + x * 7, 24 + y * 6, 5, 4); } c.fillStyle = '#ccc'; c.font = `700 5px ${UI}`; c.fillText(kind === 'casio' ? 'CASIO' : 'TI-84', 4, 4.5); });
  add(g, box(0.09, 0.17, 0.018, [cmat(body), cmat(body), cmat(body), cmat(body), lam({ map: t }), cmat(body)]), 0, 0, 0);
  return shadows(g);
}
export function ballotBox(label = 'REFERENDUM') {
  const g = new THREE.Group(); const t = textTex('ballot' + label, 128, 96, (c, W, H) => { c.fillStyle = '#e9e4d8'; c.fillRect(0, 0, W, H); c.fillStyle = '#2747c9'; c.fillRect(0, 0, W, 18); c.fillStyle = '#16110f'; c.font = `700 20px ${TIMES}`; c.textAlign = 'center'; c.fillText(label, W / 2, 56); c.font = `700 13px ${TIMES}`; c.fillText('your taste', W / 2, 78); });
  const m = lam({ map: t }), s = cmat('#e9e4d8', 0.02);
  add(g, box(0.5, 0.5, 0.4, [s, s, s, s, m, s], 'bottom'), 0, 0, 0); add(g, box(0.25, 0.01, 0.03, cmat('#111')), 0, 0.505, 0);
  return shadows(g);
}
export function poster(key, w, h, paint, res = [128, 180]) { const t = textTex('poster:' + key, res[0], res[1], paint); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lam({ map: t })); m.receiveShadow = true; return m; }
export function stringLights(len = 6, n = 14, col = '#ffd88a') {
  const g = new THREE.Group(); const m = glow(col, 2.6);
  for (let i = 0; i < n; i++) { const x = -len / 2 + len * i / (n - 1); const y = -0.18 * Math.sin(Math.PI * i / (n - 1)); const b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), m); b.position.set(x, y, 0); g.add(b); }
  return g;
}
export function donkey() { // low-poly talking donkey (grey, big ears)
  const g = new THREE.Group(); const fur = cmat('#8d8a86', 0.08), muzzle = cmat('#d8d2c4', 0.05), dark = cmat('#3a3634', 0.05);
  add(g, box(0.9, 0.5, 0.4, fur, 'center'), 0, 0.85, 0);
  for (const [x, z] of [[0.35, 0.14], [0.35, -0.14], [-0.35, 0.14], [-0.35, -0.14]]) add(g, box(0.1, 0.62, 0.1, fur, 'top'), x, 0.65, z);
  const neck = new THREE.Group(); add(g, neck, 0.42, 1.0, 0, 0, 0, -0.6); add(neck, box(0.22, 0.42, 0.22, fur, 'bottom'));
  const head = new THREE.Group(); add(neck, head, 0.0, 0.42, 0, 0, 0, 1.1); add(head, box(0.42, 0.22, 0.24, fur, 'center'), 0.12, 0, 0); add(head, box(0.16, 0.19, 0.22, muzzle, 'center'), 0.36, -0.02, 0);
  for (const s of [-1, 1]) { const ear = box(0.06, 0.3, 0.1, fur, 'bottom'); add(head, ear, -0.02, 0.08, s * 0.08, s * 0.35, 0, 0.2); }
  for (const s of [-1, 1]) { const eye = box(0.04, 0.05, 0.01, dark); add(head, eye, 0.16, 0.05, s * 0.121); const hl = box(0.015, 0.015, 0.012, glow('#ffffff', 1.2)); add(head, hl, 0.17, 0.065, s * 0.122); }
  const mouth = box(0.02, 0.05, 0.2, dark); add(head, mouth, 0.44, -0.08, 0); g.userData.head = head; g.userData.jaw = mouth;
  add(g, box(0.05, 0.36, 0.05, dark, 'top'), -0.46, 1.0, 0, 0, 0, -0.3);
  return shadows(g);
}
export function ruinBlocks(labels, seed = 3) { // a tower of labelled blocks (the imaginary social structure)
  const g = new THREE.Group(); const R = rng(seed); const blocks = [];
  const n = labels.length; let y = 0;
  for (let i = 0; i < n; i++) {
    const w = 2.4 - (i % 3) * 0.35, h = 0.7;
    const t = textTex('blk:' + labels[i], 256, 76, (c, W, H) => { c.fillStyle = '#efe7d4'; c.fillRect(0, 0, W, H); c.strokeStyle = '#16110f'; c.lineWidth = 4; c.strokeRect(2, 2, W - 4, H - 4); c.fillStyle = '#16110f'; c.font = `700 30px ${TIMES}`; c.textAlign = 'center'; c.fillText(labels[i], W / 2, 50); });
    const side = cmat('#d9cfb8', 0.03); const m = lam({ map: t });
    const b = box(w, h, 0.9, [side, side, side, side, m, m], 'center'); b.position.set((R() - 0.5) * 0.4, y + h / 2, 0); b.rotation.y = (R() - 0.5) * 0.15; g.add(b);
    blocks.push({ m: b, x: b.position.x, y: b.position.y, ry: b.rotation.y, vx: (R() - 0.5) * 2.5, vz: (R() - 0.3) * 2.0, spin: (R() - 0.5) * 3, delay: (n - i) * 0.05 + R() * 0.1 });
    y += h;
  }
  shadows(g); return { g, blocks };
}

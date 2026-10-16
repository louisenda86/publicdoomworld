// SLOPCORE props: pipeline robots, film-crew kit, K-pop stage kit, trash, money, radio, phones, misc.
import * as THREE from 'three';
import { box, taper, lam, basic, cmat, cyl, at, group, blob } from './kit.js';
import { ptex, shade, noiseFill, hex2rgb } from './tex.js';
import { Screen } from './props.js';
import { rng, clamp, hash2 } from '../core.js';
import { SANS, MONO, COND } from '../ov/overlay.js';

const glow = (hex, k = 2.5) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), toneMapped: false });
const add = (g, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { m.position.set(x, y, z); m.rotation.set(rx, ry, rz); g.add(m); return m; };

// ---------- pipeline robot: boxy PS1 bot with a screen face, posable arms ----------
const ROBOT_FACES = {
  happy: (g, w, h, c) => { g.fillStyle = c; g.fillRect(w * 0.26, h * 0.32, w * 0.12, h * 0.2); g.fillRect(w * 0.62, h * 0.32, w * 0.12, h * 0.2); g.fillRect(w * 0.34, h * 0.66, w * 0.32, h * 0.08); g.fillRect(w * 0.3, h * 0.6, w * 0.06, h * 0.08); g.fillRect(w * 0.64, h * 0.6, w * 0.06, h * 0.08); },
  focus: (g, w, h, c) => { g.fillStyle = c; g.fillRect(w * 0.22, h * 0.4, w * 0.2, h * 0.08); g.fillRect(w * 0.58, h * 0.4, w * 0.2, h * 0.08); g.fillRect(w * 0.4, h * 0.68, w * 0.2, h * 0.06); },
  star: (g, w, h, c) => { g.fillStyle = c; for (const cx of [0.32, 0.68]) { g.fillRect(w * (cx - 0.1), h * 0.4, w * 0.2, h * 0.06); g.fillRect(w * (cx - 0.03), h * 0.26, w * 0.06, h * 0.34); } g.fillRect(w * 0.36, h * 0.7, w * 0.28, h * 0.06); },
  sad: (g, w, h, c) => { g.fillStyle = c; g.fillRect(w * 0.26, h * 0.36, w * 0.12, h * 0.12); g.fillRect(w * 0.62, h * 0.36, w * 0.12, h * 0.12); g.fillRect(w * 0.36, h * 0.66, w * 0.28, h * 0.06); g.fillRect(w * 0.3, h * 0.72, w * 0.08, h * 0.06); g.fillRect(w * 0.62, h * 0.72, w * 0.08, h * 0.06); },
  wow: (g, w, h, c) => { g.fillStyle = c; g.fillRect(w * 0.24, h * 0.28, w * 0.16, h * 0.26); g.fillRect(w * 0.6, h * 0.28, w * 0.16, h * 0.26); g.fillRect(w * 0.42, h * 0.62, w * 0.16, h * 0.18); },
  dollar: (g, w, h, c) => { g.fillStyle = c; g.font = `700 ${h * 0.55}px ${MONO}`; g.textAlign = 'center'; g.fillText('$$', w / 2, h * 0.7); },
  zero: (g, w, h, c) => { g.fillStyle = c; g.font = `700 ${h * 0.4}px ${MONO}`; g.textAlign = 'center'; g.fillText('$0.00', w / 2, h * 0.64); },
  code: (g, w, h, c) => { g.fillStyle = c; g.font = `700 ${h * 0.5}px ${MONO}`; g.textAlign = 'center'; g.fillText('</>', w / 2, h * 0.68); },
  off: (g, w, h, c) => { g.fillStyle = shade(c, 0.35); g.fillRect(w * 0.25, h * 0.47, w * 0.5, h * 0.05); },
};
export function robot({ name = 'BOT', body = '#2b2d35', accent = '#c4f03a', trim = '#16171c', s = 1, faceCol = null } = {}) {
  const g = new THREE.Group(); g.scale.setScalar(s);
  const bodyT = ptex(`rbody:${name}:${body}:${accent}`, 32, 32, (c, w, h, R) => { noiseFill(c, w, h, body, 0.06, R); c.fillStyle = shade(body, 0.75); c.fillRect(0, 0, w, 2); c.fillRect(0, h - 3, w, 3); c.fillStyle = accent; c.fillRect(3, 5, w - 6, 9); c.fillStyle = shade(accent, 0.25); c.font = `800 8px ${COND}`; c.textAlign = 'center'; c.fillText(name, w / 2, 12.5); for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? accent : shade(accent, 0.5); c.fillRect(6 + i * 6, 19, 3, 3); } });
  const side = cmat(shade(body, 0.85), 0.06), dark = cmat(trim, 0.05), acc = lam({ color: new THREE.Color(accent), flat: true });
  const bodyM = lam({ map: bodyT });
  const torso = box(0.44, 0.46, 0.3, [side, side, side, dark, bodyM, side], 'bottom'); add(g, torso, 0, 0.5, 0);
  for (const sx of [-1, 1]) { const leg = box(0.12, 0.42, 0.14, dark, 'bottom'); add(g, leg, sx * 0.12, 0.08, 0); const foot = box(0.16, 0.08, 0.24, side, 'bottom'); add(g, foot, sx * 0.12, 0, 0.04); }
  const neck = box(0.1, 0.06, 0.1, dark, 'bottom'); add(g, neck, 0, 0.96, 0);
  const head = new THREE.Group(); head.position.set(0, 1.02, 0); g.add(head);
  const hb = box(0.42, 0.32, 0.32, [side, side, side, dark, side, side], 'bottom'); head.add(hb);
  const scr = new Screen(96, 64, 1.0); const sm = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.24), scr.mat); sm.position.set(0, 0.16, 0.162); head.add(sm);
  const ant = cyl(0.01, 0.01, 0.16, 4, dark); ant.position.set(0.12, 0.4, 0); head.add(ant);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), glow(accent, 2.2)); tip.position.set(0.12, 0.49, 0); head.add(tip);
  for (const sx of [-1, 1]) { const ear = cyl(0.06, 0.06, 0.04, 8, acc); ear.rotation.z = Math.PI / 2; ear.position.set(sx * 0.225, 0.16, 0); head.add(ear); }
  const arms = {};
  for (const [k, sx] of [['L', 1], ['R', -1]]) {
    const sh = new THREE.Group(); sh.position.set(sx * 0.27, 0.9, 0); sh.rotation.order = 'XZY'; g.add(sh);
    const ua = box(0.09, 0.24, 0.09, side, 'top'); sh.add(ua);
    const el = new THREE.Group(); el.position.set(0, -0.24, 0); sh.add(el);
    const fa = box(0.08, 0.22, 0.08, dark, 'top'); el.add(fa);
    const hand = new THREE.Group(); hand.position.set(0, -0.22, 0); el.add(hand);
    for (const cz of [-1, 1]) { const f = box(0.03, 0.08, 0.025, acc, 'top'); f.position.set(0, 0, cz * 0.025); hand.add(f); }
    arms[k] = { sh, el, hand };
  }
  const sh = blob(0.4, 0.45); g.add(sh);
  g.traverse(o => { if (o.isMesh && o !== sh) o.castShadow = true; });
  let fk = '';
  return { g, head, arms, scr, tip,
    setFace(expr = 'happy', col = faceCol || accent) {
      const k = expr + col; if (k === fk) return; fk = k;
      scr.draw((c, w, h) => { c.fillStyle = '#05060a'; c.fillRect(0, 0, w, h); (ROBOT_FACES[expr] || ROBOT_FACES.happy)(c, w, h, col); c.fillStyle = 'rgba(255,255,255,0.06)'; for (let y = 0; y < h; y += 3) c.fillRect(0, y, w, 1); });
    },
    // pose: { L:[sx,sz,el], R:[...], head:[rx,ry], bob }
    pose(p = {}) {
      for (const k of ['L', 'R']) { const a = p[k] || [0.1, 0.15, -0.3]; const sgn = k === 'L' ? 1 : -1; arms[k].sh.rotation.set(a[0], 0, sgn * a[1]); arms[k].el.rotation.set(a[2], 0, 0); }
      head.rotation.set(p.head?.[0] || 0, p.head?.[1] || 0, p.head?.[2] || 0);
      g.position.y = (p.y || 0) + (p.bob || 0);
    } };
}

// ---------- film crew kit ----------
export function filmCamera() {
  const g = new THREE.Group(); const k = cmat('#1b1c20', 0.06), m = cmat('#3a3c44', 0.06);
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; const l = cyl(0.015, 0.02, 1.25, 4, m); l.position.set(Math.cos(a) * 0.22, 0.6, Math.sin(a) * 0.22); l.rotation.set(Math.sin(a) * 0.32, 0, -Math.cos(a) * 0.32); g.add(l); }
  add(g, box(0.18, 0.06, 0.18, m), 0, 1.22, 0);
  const body = add(g, box(0.22, 0.24, 0.42, k, 'bottom'), 0, 1.25, 0);
  const lens = cyl(0.07, 0.085, 0.2, 10, m); lens.rotation.x = Math.PI / 2; add(g, lens, 0, 1.37, 0.3);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.066, 12), lam({ color: 0x223355, emissive: 0x112244 })); glass.position.set(0, 1.37, 0.401); g.add(glass);
  for (const [z, r] of [[0.05, 0.13], [-0.18, 0.13]]) { const reel = cyl(r, r, 0.03, 12, k); reel.rotation.z = Math.PI / 2; add(g, reel, 0, 1.6, z); }
  const rec = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), glow('#ff2a2a', 3)); rec.position.set(0.08, 1.46, 0.18); g.add(rec);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.userData.rec = rec; return g;
}
export function studioLight(col = '#fff2d6', on = true) {
  const g = new THREE.Group(); const m = cmat('#202126', 0.06);
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; const l = cyl(0.012, 0.012, 1.0, 4, m); l.position.set(Math.cos(a) * 0.2, 0.48, Math.sin(a) * 0.2); l.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4); g.add(l); }
  add(g, cyl(0.015, 0.015, 1.2, 4, m), 0, 1.4, 0);
  const head = new THREE.Group(); head.position.set(0, 2.0, 0); g.add(head);
  const can = cyl(0.17, 0.22, 0.3, 10, m); can.rotation.x = Math.PI / 2; head.add(can);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.2, 12), on ? glow(col, 3) : cmat('#444')); face.position.z = 0.151; head.add(face);
  for (const s of [-1, 1]) { const door = box(0.02, 0.36, 0.16, m); door.position.set(s * 0.26, 0, 0.2); door.rotation.y = s * -0.5; head.add(door); }
  g.userData.head = head; g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g;
}
export function boomMic() {
  const g = new THREE.Group(); const m = cmat('#2a2b30', 0.05);
  const pole = cyl(0.012, 0.012, 2.4, 4, m); pole.rotation.z = Math.PI / 2 - 0.35; pole.position.set(0.9, 1.9, 0); g.add(pole);
  const fuzz = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 8), cmat('#8a8378', 0.15)); fuzz.rotation.z = Math.PI / 2; fuzz.position.set(2.0, 2.3, 0); g.add(fuzz);
  return g;
}
export function directorChair(label = 'DIRECTOR') {
  const g = new THREE.Group(); const w = cmat('#6b4a2a', 0.08);
  const canvasT = ptex('dchair:' + label, 32, 12, (c, W, H) => { c.fillStyle = '#1b1b1f'; c.fillRect(0, 0, W, H); c.fillStyle = '#f5efe0'; c.font = `800 7px ${COND}`; c.textAlign = 'center'; c.fillText(label, W / 2, 8.5); });
  const cv = lam({ map: canvasT, side: THREE.DoubleSide });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = box(0.035, 0.95, 0.035, w, 'bottom'); l.position.set(sx * 0.24, 0, sz * 0.2); l.rotation.x = sz * 0.12 * sx; g.add(l); }
  add(g, box(0.5, 0.03, 0.4, cmat('#1b1b1f')), 0, 0.5, 0);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.2), cv); back.position.set(0, 0.85, -0.2); g.add(back);
  for (const sx of [-1, 1]) add(g, box(0.04, 0.03, 0.42, w), sx * 0.26, 0.7, 0);
  return g;
}
export function megaphone(col = '#f5efe0') {
  const g = new THREE.Group(); const m = lam({ color: new THREE.Color(col), flat: true, side: THREE.DoubleSide });
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.11, 0.28, 8, 1, true), m); cone.rotation.x = Math.PI / 2; cone.position.z = 0.14; g.add(cone);
  add(g, box(0.03, 0.08, 0.03, cmat('#222')), 0, -0.05, 0.03);
  return g;
}
export function clapper(text = 'SLOPCORE  TAKE 999') {
  const g = new THREE.Group(); const t = ptex('clap:' + text, 32, 24, (c, W, H) => { c.fillStyle = '#18181c'; c.fillRect(0, 0, W, H); c.fillStyle = '#f5efe0'; c.font = `700 4px ${MONO}`; c.fillText('SCENE', 2, 10); c.fillText(text.slice(0, 16), 2, 16); c.fillText('DIR: CLAUDE', 2, 22); });
  add(g, box(0.28, 0.22, 0.02, [cmat('#18181c'), cmat('#18181c'), cmat('#18181c'), cmat('#18181c'), lam({ map: t }), cmat('#18181c')], 'bottom'), 0, 0, 0);
  const stick = ptex('clapstick', 16, 4, (c, W, H) => { for (let x = 0; x < W; x += 4) { c.fillStyle = (x / 4) % 2 ? '#f5efe0' : '#18181c'; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 4, 0); c.lineTo(x + 2, H); c.lineTo(x - 2, H); c.fill(); } });
  const top = new THREE.Group(); top.position.set(-0.14, 0.22, 0); g.add(top); add(top, box(0.29, 0.05, 0.022, lam({ map: stick }), 'bottom'), 0.145, 0, 0);
  g.userData.top = top; return g;
}
export function synthKeys(col = '#1a1a1a') {
  const g = new THREE.Group(); const kT = ptex('synthkeys', 64, 8, (c, W, H) => { c.fillStyle = '#f2f2ee'; c.fillRect(0, 0, W, H); c.fillStyle = '#222'; for (let x = 0; x < W; x += 3) c.fillRect(x, 0, 1, H); for (let x = 1; x < W; x += 21) for (const o of [2, 5, 11, 14, 17]) c.fillRect(x + o, 0, 2, H * 0.6); });
  add(g, box(1.1, 0.08, 0.36, cmat(col, 0.05), 'bottom'), 0, 0.88, 0);
  const keys = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.14), lam({ map: kT })); keys.rotation.x = -Math.PI / 2; keys.position.set(0, 0.961, 0.08); g.add(keys);
  for (let i = 0; i < 6; i++) { const k = cyl(0.015, 0.015, 0.02, 6, cmat('#ff8a3d')); k.position.set(-0.4 + i * 0.12, 0.97, -0.09); g.add(k); }
  for (const sx of [-1, 1]) { const l = box(0.04, 0.86, 0.04, cmat('#333'), 'bottom'); l.position.set(sx * 0.42, 0, 0); l.rotation.z = sx * 0.25; g.add(l); }
  return g;
}
export function easel(scr) {
  const g = new THREE.Group(); const w = cmat('#8a6a42', 0.1);
  for (const [x, rz] of [[-0.3, -0.12], [0.3, 0.12]]) { const l = box(0.04, 1.8, 0.04, w, 'bottom'); l.position.set(x, 0, 0); l.rotation.z = rz; l.rotation.x = -0.12; g.add(l); }
  const back = box(0.04, 1.6, 0.04, w, 'bottom'); back.position.set(0, 0, -0.35); back.rotation.x = 0.22; g.add(back);
  add(g, box(0.8, 0.04, 0.08, w), 0, 0.7, 0.06);
  const cv = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), scr ? scr.mat : cmat('#f6f2ea')); cv.position.set(0, 1.12, 0.09); cv.rotation.x = -0.12; g.add(cv);
  return g;
}
// ---------- music kit ----------
export function guitar(col = '#c0392b') {
  const g = new THREE.Group(); const b = lam({ color: new THREE.Color(col), flat: true });
  const body = box(0.34, 0.42, 0.06, b); body.position.y = -0.1; g.add(body);
  const horn = box(0.12, 0.14, 0.06, b); horn.position.set(-0.13, 0.15, 0); horn.rotation.z = 0.4; g.add(horn);
  add(g, box(0.06, 0.62, 0.035, cmat('#3a2414')), 0, 0.4, 0.02);
  add(g, box(0.09, 0.14, 0.03, cmat('#1a1a1a')), 0, 0.76, 0.02);
  const guard = box(0.16, 0.2, 0.01, cmat('#f2f0e8')); guard.position.set(0.04, -0.12, 0.035); g.add(guard);
  return g;
}
export function amp(label = 'SLOPSHALL') {
  const g = new THREE.Group(); const t = ptex('amp:' + label, 32, 32, (c, W, H, R) => { noiseFill(c, W, H, '#151515', 0.08, R); c.fillStyle = '#2a2622'; c.fillRect(2, 8, W - 4, H - 10); for (let y = 9; y < H - 2; y += 2) { c.fillStyle = '#1d1a17'; c.fillRect(2, y, W - 4, 1); } c.fillStyle = '#d8c690'; c.font = `700 5px ${SANS}`; c.textAlign = 'center'; c.fillText(label, W / 2, 6); });
  const m = lam({ map: t }), s = cmat('#151515');
  add(g, box(0.75, 0.62, 0.36, [s, s, s, s, m, s], 'bottom'), 0, 0, 0);
  add(g, box(0.75, 0.62, 0.36, [s, s, s, s, m, s], 'bottom'), 0, 0.62, 0);
  add(g, box(0.75, 0.28, 0.32, [s, s, s, s, m, s], 'bottom'), 0, 1.24, 0);
  return g;
}
export function boombox() {
  const g = new THREE.Group(); const t = ptex('boombox', 48, 24, (c, W, H, R) => { noiseFill(c, W, H, '#c9cacc', 0.04, R); for (const cx of [10, 38]) { c.fillStyle = '#1a1a1c'; c.beginPath(); c.arc(cx, 14, 8, 0, 7); c.fill(); c.fillStyle = '#444'; c.beginPath(); c.arc(cx, 14, 4, 0, 7); c.fill(); } c.fillStyle = '#222'; c.fillRect(19, 9, 10, 9); c.fillStyle = '#5cf'; c.fillRect(20, 3, 8, 3); });
  const s = cmat('#a9aaad', 0.04);
  add(g, box(0.7, 0.36, 0.2, [s, s, s, s, lam({ map: t }), s], 'bottom'), 0, 0, 0);
  const h = box(0.5, 0.03, 0.03, cmat('#333'), 'bottom'); h.position.set(0, 0.42, 0); g.add(h);
  for (const sx of [-1, 1]) add(g, box(0.03, 0.08, 0.03, cmat('#333'), 'bottom'), sx * 0.24, 0.35, 0);
  return g;
}
export function turntable() {
  const g = new THREE.Group(); add(g, box(0.5, 0.1, 0.4, cmat('#1c1c20'), 'bottom'), 0, 0, 0);
  const rec = cyl(0.17, 0.17, 0.01, 18, lam({ map: ptex('vinyl', 32, 32, (c, W) => { c.fillStyle = '#0d0d0f'; c.fillRect(0, 0, W, W); c.strokeStyle = '#222'; for (let r = 4; r < 16; r += 2) { c.beginPath(); c.arc(16, 16, r, 0, 7); c.stroke(); } c.fillStyle = '#ff63b0'; c.beginPath(); c.arc(16, 16, 4, 0, 7); c.fill(); }) }));
  rec.position.set(-0.04, 0.105, 0); g.add(rec); g.userData.rec = rec;
  const arm = box(0.02, 0.015, 0.22, cmat('#bbb')); arm.position.set(0.16, 0.13, -0.02); arm.rotation.y = 0.4; g.add(arm);
  return g;
}
export function micStand() {
  const g = new THREE.Group(); const m = cmat('#202125', 0.05);
  add(g, cyl(0.16, 0.16, 0.02, 10, m), 0, 0.01, 0); add(g, cyl(0.012, 0.012, 1.5, 4, m), 0, 0.76, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), cmat('#888', 0.2)); head.position.set(0, 1.56, 0.06); g.add(head);
  return g;
}
export function speakerStack(h = 2) {
  const g = new THREE.Group(); const t = ptex('spk', 16, 32, (c, W, H, R) => { noiseFill(c, W, H, '#111', 0.05, R); for (const cy of [9, 23]) { c.fillStyle = '#2a2a2e'; c.beginPath(); c.arc(8, cy, 6, 0, 7); c.fill(); c.fillStyle = '#0a0a0c'; c.beginPath(); c.arc(8, cy, 3, 0, 7); c.fill(); } });
  const s = cmat('#121214'); add(g, box(0.7, h, 0.6, [s, s, s, s, lam({ map: t }), s], 'bottom'), 0, 0, 0); return g;
}
export function lightstick(col = '#c4f03a') { const g = new THREE.Group(); add(g, box(0.025, 0.18, 0.025, cmat('#eee')), 0, 0, 0); const h = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), glow(col, 3)); h.position.y = 0.13; g.add(h); return g; }
export function discoBall(r = 0.4) {
  const t = ptex('disco', 32, 32, (c, W, H, R) => { for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { const v = 140 + R() * 115 | 0; c.fillStyle = `rgb(${v},${v},${v + 10})`; c.fillRect(x, y, 2, 2); } });
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), lam({ map: t, emissive: 0x444444, emissiveMap: t })); return m;
}
// ---------- trash, media, money ----------
export function trashBag(col = '#1c1c22', s = 1, seed = 1) {
  const g = new THREE.Group(); const geo = new THREE.IcosahedronGeometry(0.32 * s, 1); const p = geo.attributes.position; const R = rng(seed);
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setXYZ(i, p.getX(i) * (1 + (R() - 0.5) * 0.15), y * 0.82 * (y < 0 ? 0.8 : 1), p.getZ(i) * (1 + (R() - 0.5) * 0.15)); }
  geo.computeVertexNormals(); const b = new THREE.Mesh(geo, lam({ color: new THREE.Color(col), flat: true })); b.position.y = 0.22 * s; b.castShadow = true; g.add(b);
  const knot = new THREE.Mesh(new THREE.ConeGeometry(0.06 * s, 0.16 * s, 5), lam({ color: new THREE.Color(col), flat: true })); knot.position.y = 0.5 * s; g.add(knot);
  return g;
}
export function trashCan(label = 'SLOP') {
  const g = new THREE.Group(); const t = ptex('can:' + label, 32, 32, (c, W, H, R) => { noiseFill(c, W, H, '#8f969c', 0.07, R); for (let x = 0; x < W; x += 4) { c.fillStyle = '#7b8287'; c.fillRect(x, 0, 1, H); } c.fillStyle = '#c4f03a'; c.fillRect(4, 11, W - 8, 10); c.fillStyle = '#170e1f'; c.font = `800 9px ${COND}`; c.textAlign = 'center'; c.fillText(label, W / 2, 19.5); });
  const can = cyl(0.26, 0.22, 0.7, 12, lam({ map: t })); can.position.y = 0.35; g.add(can);
  const lid = new THREE.Group(); lid.position.y = 0.72; g.add(lid);
  lid.add(cyl(0.29, 0.29, 0.04, 12, cmat('#9aa1a6'))); const hd = box(0.12, 0.04, 0.03, cmat('#666')); hd.position.y = 0.04; lid.add(hd);
  g.userData.lid = lid; g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g;
}
export function disc(kind = 'cd', col = '#ff63b0') {
  if (kind === 'vinyl') { const m = cyl(0.15, 0.15, 0.006, 16, lam({ color: 0x0c0c0e })); const l = cyl(0.05, 0.05, 0.008, 12, lam({ color: new THREE.Color(col) })); const g = group(m, l); return g; }
  if (kind === 'cassette') { const t = ptex('cass:' + col, 16, 10, (c, W, H) => { c.fillStyle = '#1a1a1d'; c.fillRect(0, 0, W, H); c.fillStyle = col; c.fillRect(1, 1, W - 2, 4); c.fillStyle = '#ddd'; c.fillRect(4, 6, 2, 2); c.fillRect(10, 6, 2, 2); }); return box(0.1, 0.064, 0.012, [cmat('#1a1a1d'), cmat('#1a1a1d'), cmat('#1a1a1d'), cmat('#1a1a1d'), lam({ map: t }), cmat('#1a1a1d')]); }
  const t = ptex('cd:' + col, 32, 32, (c, W) => { const gr = c.createRadialGradient(16, 16, 2, 16, 16, 16); gr.addColorStop(0, '#eee'); gr.addColorStop(0.5, col); gr.addColorStop(0.8, '#9ff'); gr.addColorStop(1, '#ddd'); c.fillStyle = gr; c.fillRect(0, 0, W, W); c.fillStyle = '#000'; c.beginPath(); c.arc(16, 16, 2.5, 0, 7); c.fill(); });
  return cyl(0.12, 0.12, 0.004, 16, lam({ map: t, emissive: 0x222222 }));
}
export function phone(scrMat = null) {
  const g = new THREE.Group(); add(g, box(0.075, 0.155, 0.009, cmat('#141418')), 0, 0, 0);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.145), scrMat || glow('#9fd0ff', 1.6)); s.position.z = 0.0051; g.add(s); g.userData.scr = s; return g;
}
export function moneyStack(n = 10) {
  const t = ptex('bill', 32, 16, (c, W, H, R) => { noiseFill(c, W, H, '#7fae6a', 0.06, R); c.strokeStyle = '#3d6b35'; c.strokeRect(1.5, 1.5, W - 3, H - 3); c.fillStyle = '#3d6b35'; c.beginPath(); c.arc(16, 8, 4, 0, 7); c.fill(); c.font = `700 5px ${SANS}`; c.fillText('100', 3, 7); });
  const side = cmat('#e8eadc', 0.05), top = lam({ map: t }), band = cmat('#c9a227');
  const g = new THREE.Group(); const b = box(0.32, 0.012 * n, 0.15, [side, side, top, top, side, side], 'bottom'); g.add(b);
  const bd = box(0.05, 0.012 * n + 0.004, 0.152, band, 'bottom'); bd.position.y = -0.002; g.add(bd); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g;
}
export function bill() { return new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.15), lam({ map: ptex('bill', 32, 16, () => {}), side: THREE.DoubleSide })); }
export function pedestal(h = 1.0, w = 0.6) {
  const g = new THREE.Group(); const m = cmat('#ece6da', 0.04); add(g, box(w, h, w, m, 'bottom'), 0, 0, 0); add(g, box(w * 1.15, 0.06, w * 1.15, cmat('#d8d0c2'), 'bottom'), 0, h, 0); add(g, box(w * 1.15, 0.06, w * 1.15, cmat('#d8d0c2'), 'bottom'), 0, 0, 0); return g;
}
export function ropePosts(len = 2.4) {
  const g = new THREE.Group(); const brass = lam({ color: 0xc9a227, emissive: 0x332200 }); const red = cmat('#8a1c2a', 0.06);
  for (const x of [-len / 2, 0, len / 2]) { add(g, cyl(0.12, 0.14, 0.03, 10, brass), x, 0.015, 0); add(g, cyl(0.025, 0.025, 0.9, 6, brass), x, 0.45, 0); add(g, new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), brass), x, 0.92, 0); }
  for (const x0 of [-len / 2, 0]) { const pts = []; for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push(new THREE.Vector3(x0 + u * len / 2, 0.86 - Math.sin(Math.PI * u) * 0.18, 0)); } g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, 0.02, 4), red)); }
  return g;
}
export function plaque(lines, w = 0.8, h = 0.4) {
  const t = ptex('plaque:' + lines.join('|'), 128, 64, (c, W, H) => { c.fillStyle = '#2a2622'; c.fillRect(0, 0, W, H); c.strokeStyle = '#c9a227'; c.lineWidth = 2; c.strokeRect(3, 3, W - 6, H - 6); c.fillStyle = '#e8dcb8'; c.textAlign = 'center'; lines.forEach((l, i) => { c.font = `${i ? 400 : 700} ${i ? 9 : 11}px ${SANS}`; c.fillText(l, W / 2, 20 + i * 14); }); }, { linear: true });
  return box(w, h, 0.03, [cmat('#2a2622'), cmat('#2a2622'), cmat('#2a2622'), cmat('#2a2622'), lam({ map: t }), cmat('#2a2622')], 'center');
}
export function oldRadio() {
  const g = new THREE.Group(); const t = ptex('radio', 48, 32, (c, W, H, R) => { noiseFill(c, W, H, '#7a4a26', 0.1, R); c.fillStyle = '#d9c9a0'; c.fillRect(4, 4, 24, 24); for (let y = 6; y < 27; y += 2) { c.fillStyle = '#8a7a58'; c.fillRect(5, y, 22, 1); } c.fillStyle = '#f3e7c4'; c.fillRect(31, 6, 13, 9); c.fillStyle = '#c0392b'; c.fillRect(37, 6, 1, 9); c.fillStyle = '#3a2414'; c.beginPath(); c.arc(34, 23, 3, 0, 7); c.fill(); c.beginPath(); c.arc(42, 23, 3, 0, 7); c.fill(); });
  const s = cmat('#6a3e20', 0.1); const top = taper(0.18, [0.62, 0.3], [0.7, 0.32], [s, s, s, s, s, s], { pivot: 'bottom' });
  add(g, box(0.7, 0.44, 0.32, [s, s, s, s, lam({ map: t }), s], 'bottom'), 0, 0, 0); add(g, top, 0, 0.44, 0);
  return g;
}
export function trophy(col = '#e8c33a') { const g = new THREE.Group(); const m = lam({ color: new THREE.Color(col), emissive: new THREE.Color(col).multiplyScalar(0.25), flat: true }); add(g, box(0.22, 0.08, 0.22, cmat('#2a2a2a'), 'bottom'), 0, 0, 0); add(g, cyl(0.03, 0.05, 0.16, 6, m), 0, 0.16, 0); const cup = cyl(0.14, 0.06, 0.22, 8, m, true); cup.position.y = 0.35; g.add(cup); for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 4, 8, Math.PI), m); h.position.set(s * 0.15, 0.36, 0); h.rotation.z = s * -Math.PI / 2; g.add(h); } return g; }
export function pcTower(scr) {
  const g = new THREE.Group(); const t = ptex('pc', 16, 32, (c, W, H, R) => { noiseFill(c, W, H, '#1a1b20', 0.05, R); c.fillStyle = '#2b2c33'; c.fillRect(2, 2, W - 4, 6); for (const cy of [14, 23]) { c.strokeStyle = '#c4f03a'; c.beginPath(); c.arc(8, cy, 4, 0, 7); c.stroke(); } });
  const s = cmat('#16171c'); add(g, box(0.22, 0.48, 0.46, [s, lam({ map: t, emissive: 0xffffff, emissiveMap: t, ei: 0.6 }), s, s, s, s], 'bottom'), 0, 0, 0);
  return g;
}
export function calendarPad() {
  const scr = new Screen(256, 256, 1.0); const g = new THREE.Group(); add(g, box(0.8, 0.9, 0.04, cmat('#2a2a30')), 0, 0, 0); const p = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.72), scr.mat); p.position.set(0, -0.04, 0.022); g.add(p);
  for (const sx of [-0.2, 0.2]) add(g, cyl(0.02, 0.02, 0.1, 6, cmat('#999')), sx, 0.42, 0.03);
  return { g, scr };
}
// confetti: n coloured squares falling with flutter; update(t, t0)
export function confetti(n = 400, area = [8, 6, 4], cols = ['#c4f03a', '#ff63b0', '#4a5cff', '#f5efe0', '#ffd43b'], seed = 3) {
  const geo = new THREE.PlaneGeometry(0.06, 0.04); const mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false });
  const im = new THREE.InstancedMesh(geo, mat, n); const R = rng(seed); const P = []; const c = new THREE.Color();
  for (let i = 0; i < n; i++) { P.push({ x: (R() - 0.5) * area[0], z: (R() - 0.5) * area[2], y0: area[1] + R() * 3, sp: 0.6 + R() * 0.6, ph: R() * 6.28, rs: R() * 4 + 2 }); im.setColorAt(i, c.set(cols[i % cols.length]).multiplyScalar(1.3)); }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1);
  im.frustumCulled = false;
  im.userData.update = (t, t0) => { const lt = Math.max(0, t - t0); for (let i = 0; i < n; i++) { const p = P[i]; let y = p.y0 - lt * p.sp * 1.4; v.set(p.x + Math.sin(lt * 2 + p.ph) * 0.2, y, p.z + Math.cos(lt * 1.7 + p.ph) * 0.15); e.set(lt * p.rs + p.ph, lt * p.rs * 0.7, p.ph); q.setFromEuler(e); s.setScalar(y > -0.2 ? 1 : 0); m4.compose(v, q, s); im.setMatrixAt(i, m4); } im.instanceMatrix.needsUpdate = true; };
  return im;
}
// volumetric-ish beam: additive open cone with a soft vertical gradient
let BEAMT = null;
export function beam(col = '#c4f03a', len = 9, r = 1.2, op = 0.22) {
  if (!BEAMT) BEAMT = ptex('beamgrad', 4, 64, (c, W, H) => { const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,1)'); c.fillStyle = gr; c.fillRect(0, 0, W, H); }, { linear: true });
  const geo = new THREE.CylinderGeometry(0.06, r, len, 14, 1, true); geo.translate(0, -len / 2, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: BEAMT, color: new THREE.Color(col).multiplyScalar(1.4), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  const g = new THREE.Group(); g.add(m); g.userData.beam = m; return g;
}
export function ledWall(w = 10, h = 4.2, res = [640, 270]) { const scr = new Screen(res[0], res[1], 1.25); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), scr.mat); return { mesh: m, scr }; }

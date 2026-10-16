// Mesh kit: tapered boxes with per-face materials, materials cache, blob shadows, misc helpers.
import * as THREE from 'three';
import { grain, ptex } from './tex.js';
import { ps1Patch } from './ps1.js';

export function lam(opts = {}) {
  const m = new THREE.MeshLambertMaterial({ color: opts.color ?? 0xffffff, map: opts.map || null, flatShading: opts.flat ?? true,
    emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.ei ?? 1, emissiveMap: opts.emissiveMap || null, transparent: !!opts.transparent,
    opacity: opts.opacity ?? 1, side: opts.side ?? THREE.FrontSide, vertexColors: !!opts.vc, depthWrite: opts.depthWrite ?? true, alphaTest: opts.alphaTest ?? 0 });
  return ps1Patch(m);
}
export function basic(opts = {}) {
  return ps1Patch(new THREE.MeshBasicMaterial({ color: opts.color ?? 0xffffff, map: opts.map || null, transparent: !!opts.transparent, opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide, depthWrite: opts.depthWrite ?? true, toneMapped: false, blending: opts.blending ?? THREE.NormalBlending, fog: opts.fog ?? true }));
}
// material from a hex colour with grain texture
const MC = new Map();
export function cmat(color, amp = 0.07, extra = {}) {
  const key = color + ':' + amp + ':' + JSON.stringify(extra);
  if (!MC.has(key)) MC.set(key, lam({ map: grain(color, amp), ...extra }));
  return MC.get(key);
}

// Tapered box. Spans y in [y0, y0+h] (pivot 'top' => [-h,0], 'bottom' => [0,h], 'center').
// top: [w, d], bot: [w, d], off: [x, z] shift of the top face relative to the bottom. mats: 1 or 6 (+x,-x,+y,-y,+z,-z)
export function taperGeo(h, top, bot, { pivot = 'top', off = [0, 0], botOff = [0, 0] } = {}) {
  const y0 = pivot === 'top' ? -h : pivot === 'bottom' ? 0 : -h / 2, y1 = y0 + h;
  const [tw, td] = top, [bw, bd] = bot;
  const T = (sx, sz) => [sx * tw / 2 + off[0], y1, sz * td / 2 + off[1]];
  const B = (sx, sz) => [sx * bw / 2 + botOff[0], y0, sz * bd / 2 + botOff[1]];
  // faces as quads [a,b,c,d] counter-clockwise from outside, uv a=(0,0) b=(1,0) c=(1,1) d=(0,1)
  const faces = [
    [B(1, 1), B(1, -1), T(1, -1), T(1, 1)],     // +x
    [B(-1, -1), B(-1, 1), T(-1, 1), T(-1, -1)], // -x
    [T(-1, 1), T(1, 1), T(1, -1), T(-1, -1)],   // +y
    [B(-1, -1), B(1, -1), B(1, 1), B(-1, 1)],   // -y
    [B(-1, 1), B(1, 1), T(1, 1), T(-1, 1)],     // +z
    [B(1, -1), B(-1, -1), T(-1, -1), T(1, -1)], // -z
  ];
  const pos = [], uv = [], groups = [];
  faces.forEach((f, i) => {
    const [a, b, c, d] = f; pos.push(...a, ...b, ...c, ...a, ...c, ...d); uv.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1); groups.push([i * 6, 6, i]);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  for (const [s, c, m] of groups) g.addGroup(s, c, m);
  g.computeVertexNormals();
  return g;
}
export function taper(h, top, bot, mats, opts) {
  const m = new THREE.Mesh(taperGeo(h, top, bot, opts), Array.isArray(mats) ? (mats.length === 6 ? mats : [mats[0], mats[0], mats[0], mats[0], mats[0], mats[0]]) : [mats, mats, mats, mats, mats, mats]);
  m.castShadow = true; m.receiveShadow = true; return m;
}
export function box(w, h, d, mats, pivot = 'center') { return taper(h, [w, d], [w, d], mats, { pivot }); }
export function at(obj, x, y, z, rx = 0, ry = 0, rz = 0) { obj.position.set(x, y, z); obj.rotation.set(rx, ry, rz); return obj; }

// blob shadow (PS1 staple)
let BLOB = null;
export function blob(r = 0.35, op = 0.45) {
  if (!BLOB) BLOB = ptex('blob', 64, 64, (g, w) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }, { linear: true });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: BLOB, transparent: true, opacity: op, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.012; m.renderOrder = 1; return m;
}
export function group(...kids) { const g = new THREE.Group(); for (const k of kids) if (k) g.add(k); return g; }
// orbit-ish camera helper: place camera at pos looking at target
export function look(cam, pos, tgt, roll = 0) { cam.position.set(...pos); cam.up.set(Math.sin(roll), Math.cos(roll), 0); cam.lookAt(...tgt); return cam; }
export function cyl(rt, rb, h, seg, mat, open = false) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), mat); m.castShadow = true; m.receiveShadow = true; return m; }
export function shadowsOn(obj, cast = true, recv = true) { obj.traverse(o => { if (o.isMesh) { o.castShadow = cast; o.receiveShadow = recv; } }); return obj; }

// ---------- curvy low-poly segments (WHAT IF cast) ----------
// Lofted superellipse cross-sections with a shape profile and domed caps: same call signature and the same
// 6-material contract as taper() (+x,-x,+y,-y,+z,-z), so outfit textures still land on the right faces.
// Faces are grouped by their facing direction and each group gets a planar UV projection over the mesh bbox.
// shape: { seg, rings, sq (superellipse exponent), bulge, at (bulge centre 0..1), wid (bulge width), capT, capB, prof(s)->[kx,kz] }
export function softGeo(h, top, bot, { pivot = 'top', off = [0, 0], botOff = [0, 0], seg = 10, rings = 6, sq = 2, bulge = 0, at = 0.5, wid = 0.35, capT = 0, capB = 0, capK = 0.88, prof = null, rot = 0 } = {}) {
  const y0 = pivot === 'top' ? -h : pivot === 'bottom' ? 0 : -h / 2;
  const [tw, td] = top, [bw, bd] = bot;
  const ringPts = [];
  const ex = 2 / sq;
  for (let i = 0; i <= rings; i++) {
    const s = i / rings; let kx = 1 + bulge * Math.exp(-((s - at) * (s - at)) / (wid * wid)), kz = kx;
    if (prof) { const p = prof(s); kx *= p[0]; kz *= p[1]; }
    let ky = 0;
    if (capT > 0 && s > 1 - capT) { const u = (s - (1 - capT)) / capT; const c = Math.sqrt(Math.max(0, 1 - u * u * capK)); kx *= c; kz *= c; }
    if (capB > 0 && s < capB) { const u = (capB - s) / capB; const c = Math.sqrt(Math.max(0, 1 - u * u * capK)); kx *= c; kz *= c; }
    const w = (bw + (tw - bw) * s) * kx / 2, d = (bd + (td - bd) * s) * kz / 2;
    const cx = botOff[0] + (off[0] - botOff[0]) * s, cz = botOff[1] + (off[1] - botOff[1]) * s;
    const pts = [];
    for (let j = 0; j < seg; j++) {
      const a = (j + 0.5) / seg * Math.PI * 2 + rot; const sa = Math.sin(a), ca = Math.cos(a);
      pts.push([cx + w * Math.sign(sa) * Math.pow(Math.abs(sa), ex), y0 + s * h + ky, cz + d * Math.sign(ca) * Math.pow(Math.abs(ca), ex)]);
    }
    ringPts.push(pts);
  }
  const tris = [];
  for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) {
    const a = ringPts[i][j], b = ringPts[i][(j + 1) % seg], c = ringPts[i + 1][(j + 1) % seg], d = ringPts[i + 1][j];
    tris.push([a, c, d], [a, b, c]);
  }
  const cen = (r) => { let x = 0, y = 0, z = 0; for (const p of r) { x += p[0]; y += p[1]; z += p[2]; } return [x / r.length, y / r.length, z / r.length]; };
  const rt = ringPts[rings], rb = ringPts[0], ct = cen(rt), cb = cen(rb);
  for (let j = 0; j < seg; j++) { tris.push([ct, rt[j], rt[(j + 1) % seg]]); tris.push([cb, rb[(j + 1) % seg], rb[j]]); }
  // bbox for planar projections
  let mnx = 1e9, mxx = -1e9, mnz = 1e9, mxz = -1e9;
  for (const r of ringPts) for (const p of r) { mnx = Math.min(mnx, p[0]); mxx = Math.max(mxx, p[0]); mnz = Math.min(mnz, p[2]); mxz = Math.max(mxz, p[2]); }
  const W = Math.max(mxx - mnx, 1e-6), D = Math.max(mxz - mnz, 1e-6);
  const groups = [[], [], [], [], [], []];
  for (const t of tris) {
    const [a, b, c] = t; const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    let gi;
    if (ny > 0.8) gi = 2; else if (ny < -0.8) gi = 3;
    else { const ang = Math.atan2(nx, nz); const A = Math.abs(ang); gi = A < 0.9 ? 4 : A > Math.PI - 0.9 ? 5 : nx > 0 ? 0 : 1; }
    groups[gi].push(t);
  }
  const pos = [], uv = [], g = new THREE.BufferGeometry(); let start = 0;
  groups.forEach((list, gi) => {
    for (const t of list) for (const p of t) {
      pos.push(p[0], p[1], p[2]); const vy = (p[1] - y0) / h;
      let u, v = vy;
      if (gi === 4) u = (p[0] - mnx) / W; else if (gi === 5) u = (mxx - p[0]) / W;
      else if (gi === 0) u = (mxz - p[2]) / D; else if (gi === 1) u = (p[2] - mnz) / D;
      else if (gi === 2) { u = (p[0] - mnx) / W; v = (mxz - p[2]) / D; } else { u = (p[0] - mnx) / W; v = (p[2] - mnz) / D; }
      uv.push(u, v);
    }
    if (list.length) g.addGroup(start, list.length * 3, gi); start += list.length * 3;
  });
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}
export function soft(h, top, bot, mats, opts = {}) {
  const m = new THREE.Mesh(softGeo(h, top, bot, opts), Array.isArray(mats) ? (mats.length === 6 ? mats : [mats[0], mats[0], mats[0], mats[0], mats[0], mats[0]]) : [mats, mats, mats, mats, mats, mats]);
  m.castShadow = true; m.receiveShadow = true; return m;
}
// glossy leather (Phong, so the toon halftone keeps a crisp specular streak on top)
export function phong(opts = {}) {
  const m = new THREE.MeshPhongMaterial({ color: opts.color ?? 0xffffff, map: opts.map || null, flatShading: opts.flat ?? true, specular: opts.spec ?? 0x5a5a64, shininess: opts.shin ?? 48,
    emissive: 0x000000, transparent: !!opts.transparent, alphaTest: opts.alphaTest ?? 0, side: opts.side ?? THREE.FrontSide });
  return ps1Patch(m);
}
export function camera(fov = 45) {
  return new THREE.PerspectiveCamera(fov, 16 / 9, 0.08, 250);
}
export function aim(cam, pos, target) {
  cam.position.set(pos[0], pos[1], pos[2]);
  cam.lookAt(target[0], target[1], target[2]);
  return cam;
}


// Low-poly 3D lettering from any installed font: rasterise the text into a canvas, trace the pixel
// boundaries, corner-cut + Douglas-Peucker simplify (the faceting IS the PS1 look), extrude with a chamfer.
import * as THREE from 'three';

function traceLoops(bin, W, H) {
  // directed boundary edges on the pixel-corner lattice, filled pixel on the LEFT (y down)
  const key = (x, y) => y * (W + 1) + x;
  const out = new Map(); // start -> [end,...]
  const push = (x0, y0, x1, y1) => { const k = key(x0, y0); if (!out.has(k)) out.set(k, []); out.get(k).push([x1, y1]); };
  const f = (x, y) => x >= 0 && y >= 0 && x < W && y < H && bin[y * W + x];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!f(x, y)) continue;
    if (!f(x, y - 1)) push(x + 1, y, x, y);         // top edge, walking left
    if (!f(x - 1, y)) push(x, y, x, y + 1);         // left edge, walking down
    if (!f(x, y + 1)) push(x, y + 1, x + 1, y + 1); // bottom edge, walking right
    if (!f(x + 1, y)) push(x + 1, y + 1, x + 1, y); // right edge, walking up
  }
  const loops = [];
  for (const [k0, list] of out) {
    while (list.length) {
      const sx = k0 % (W + 1), sy = (k0 / (W + 1)) | 0;
      const loop = [[sx, sy]]; let [cx, cy] = list.pop(); let px = sx, py = sy;
      let guard = 0;
      while (!(cx === sx && cy === sy) && guard++ < 1e6) {
        loop.push([cx, cy]);
        const cand = out.get(key(cx, cy)); if (!cand || !cand.length) break;
        let pick = 0;
        if (cand.length > 1) { // saddle: prefer the left turn relative to the incoming direction
          const dx = cx - px, dy = cy - py; let best = -9;
          cand.forEach((c, i) => { const ex = c[0] - cx, ey = c[1] - cy; const cr = dx * ey - dy * ex; const sc = cr > 0 ? 1 : cr === 0 ? 0 : -1; if (sc > best) { best = sc; pick = i; } });
        }
        const nx = cand.splice(pick, 1)[0]; px = cx; py = cy; [cx, cy] = nx;
      }
      if (loop.length > 3) loops.push(loop);
    }
  }
  return loops;
}
function cornerCut(loop) { const o = []; for (let i = 0; i < loop.length; i++) { const a = loop[i], b = loop[(i + 1) % loop.length]; o.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]); } return o; }
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  const d2 = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1]; const L = dx * dx + dy * dy || 1e-9; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); const x = a[0] + t * dx - p[0], y = a[1] + t * dy - p[1]; return x * x + y * y; };
  let idx = -1, mx = 0; for (let i = 1; i < pts.length - 1; i++) { const d = d2(pts[i], pts[0], pts[pts.length - 1]); if (d > mx) { mx = d; idx = i; } }
  if (mx > eps * eps) { const a = rdp(pts.slice(0, idx + 1), eps), b = rdp(pts.slice(idx), eps); return a.slice(0, -1).concat(b); }
  return [pts[0], pts[pts.length - 1]];
}
function simplifyLoop(loop, eps) {
  // split the closed loop at its two farthest-apart points so RDP has stable anchors
  let i0 = 0; for (let i = 1; i < loop.length; i++) if (loop[i][0] + loop[i][1] < loop[i0][0] + loop[i0][1]) i0 = i;
  const L = loop.slice(i0).concat(loop.slice(0, i0)); let i1 = 0, md = 0;
  for (let i = 0; i < L.length; i++) { const d = (L[i][0] - L[0][0]) ** 2 + (L[i][1] - L[0][1]) ** 2; if (d > md) { md = d; i1 = i; } }
  const a = rdp(L.slice(0, i1 + 1), eps), b = rdp(L.slice(i1).concat([L[0]]), eps);
  return a.slice(0, -1).concat(b.slice(0, -1));
}
const area = (p) => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; };
function inside(pt, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > pt[1]) !== (b[1] > pt[1]) && pt[0] < (b[0] - a[0]) * (pt[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }

// text -> { shapes (THREE.Shape[] in world units, baseline y=0, left x=0), width, height }
export function textShapes(text, { font = '700 200px Futura', px = 200, eps = 1.6, track = 0, unit = 1, align = 'left' } = {}) {
  const c = document.createElement('canvas'); const g = c.getContext('2d');
  g.font = font; g.letterSpacing = track + 'px';
  const m = g.measureText(text); const pad = Math.ceil(px * 0.3);
  const W = Math.ceil(m.width + pad * 2), H = Math.ceil(px * 1.5 + pad * 2);
  c.width = W; c.height = H; g.font = font; g.letterSpacing = track + 'px'; g.fillStyle = '#fff'; g.textBaseline = 'alphabetic';
  const base = pad + px * 1.05; g.fillText(text, pad, base);
  const d = g.getImageData(0, 0, W, H).data; const bin = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) bin[i] = d[i * 4 + 3] > 127 ? 1 : 0;
  const loops = traceLoops(bin, W, H).map(l => simplifyLoop(cornerCut(l), eps)).filter(l => l.length >= 3 && Math.abs(area(l)) > 4);
  // with filled-on-left in y-down coords, outer loops have negative shoelace area here
  const outers = loops.filter(l => area(l) < 0), holes = loops.filter(l => area(l) > 0);
  const s = unit / px; const ox = align === 'center' ? -(m.width / 2) - pad : -pad;
  const toV = (p) => new THREE.Vector2((p[0] + ox) * s, (base - p[1]) * s);
  const shapes = outers.map(o => { const sh = new THREE.Shape(o.map(toV)); sh.userData = { poly: o }; return sh; });
  for (const h of holes) {
    let best = null, ba = Infinity;
    shapes.forEach(sh => { if (inside(h[0], sh.userData.poly)) { const a = Math.abs(area(sh.userData.poly)); if (a < ba) { ba = a; best = sh; } } });
    if (best) best.holes.push(new THREE.Path(h.map(toV)));
  }
  return { shapes, width: m.width * s, height: px * s };
}
// extruded mesh; mats = [face, side]
export function text3d(text, opts = {}) {
  const { depth = 0.25, bevel = 0.03, mats } = opts;
  const { shapes, width, height } = textShapes(text, opts);
  const geo = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 1, curveSegments: 1, steps: 1 });
  geo.translate(0, 0, -depth / 2);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mats); mesh.userData.width = width; mesh.userData.height = height;
  return mesh;
}

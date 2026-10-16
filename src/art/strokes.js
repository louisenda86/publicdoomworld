// Hand-drawn recreation of the circular "The Strokes" logo: ring + speed stripes, squarish 70s block lettering
// built from bars, blue face over an orange offset and a brown drop shadow, sparkles and a worn print.
// Drawn in a 700x600 design space and scaled into (x, y, w, h).
const BLUE = '#5163c4', ORANGE = '#f2875c', SHADOW = '#3e281e', GLOW = 'rgba(255,196,150,0.5)';
function R(L, x, y, w, h) { const r = Math.min(w, h) * 0.18; L.moveTo(x + r, y); L.lineTo(x + w - r, y); L.lineTo(x + w, y + r); L.lineTo(x + w, y + h - r); L.lineTo(x + w - r, y + h); L.lineTo(x + r, y + h); L.lineTo(x, y + h - r); L.lineTo(x, y + r); L.closePath(); }
function bar(L, x0, y0, x1, y1, s) { const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy), nx = -dy / l * s / 2, ny = dx / l * s / 2; L.moveTo(x0 + nx, y0 + ny); L.lineTo(x1 + nx, y1 + ny); L.lineTo(x1 - nx, y1 - ny); L.lineTo(x0 - nx, y0 - ny); L.closePath(); }
// block glyphs: (L, x, baseline, C cap, X x-height, s stroke) -> advance
const G = {
  T: (L, x, b, C, X, s) => { const W = C * 0.8; R(L, x, b - C, W, s); R(L, x + W / 2 - s / 2, b - C, s, C); return W; },
  h: (L, x, b, C, X, s) => { const W = C * 0.52; R(L, x, b - C, s, C); R(L, x, b - X, W, s); R(L, x + W - s, b - X, s, X); return W; },
  e: (L, x, b, C, X, s) => { const W = C * 0.52; R(L, x, b - X, W, s); R(L, x, b - X, s, X); R(L, x, b - s, W, s); R(L, x + W - s, b - X, s, X * 0.5 + s * 0.5); R(L, x, b - X * 0.5 - s * 0.5, W, s); return W; },
  S: (L, x, b, C, X, s, tail = 0) => { const W = C * 0.62; R(L, x, b - C, W, s); R(L, x + W - s, b - C, s, s * 1.7); R(L, x, b - C, s, C * 0.5 + s * 0.5); R(L, x, b - C * 0.5 - s * 0.5, W, s); R(L, x + W - s, b - C * 0.5 - s * 0.5, s, C * 0.5 + s * 0.5); R(L, x - tail, b - s, W + tail, s); return W; },
  t: (L, x, b, C, X, s) => { const W = C * 0.38; R(L, x + s * 0.35, b - C * 0.86, s, C * 0.86); R(L, x, b - X, W, s); R(L, x + s * 0.35, b - s, W - s * 0.35, s); return W; },
  r: (L, x, b, C, X, s) => { const W = C * 0.42; R(L, x, b - X, s, X); R(L, x, b - X, W, s); R(L, x + W - s, b - X, s, s * 1.6); return W; },
  o: (L, x, b, C, X, s) => { const W = C * 0.52; R(L, x, b - X, W, s); R(L, x, b - s, W, s); R(L, x, b - X, s, X); R(L, x + W - s, b - X, s, X); return W; },
  k: (L, x, b, C, X, s) => { const W = C * 0.52; R(L, x, b - C, s, C); bar(L, x + s * 0.6, b - X * 0.42, x + W - s * 0.45, b - X + s * 0.45, s * 0.95); bar(L, x + s * 1.1, b - X * 0.55, x + W - s * 0.45, b - s * 0.45, s * 0.95); R(L, x + W - s * 1.1, b - X, s * 1.1, s); return W; },
  s: (L, x, b, C, X, s) => { const W = C * 0.5; R(L, x, b - X, W, s); R(L, x, b - X, s, X * 0.5 + s * 0.5); R(L, x, b - X * 0.5 - s * 0.5, W, s); R(L, x + W - s, b - X * 0.5 - s * 0.5, s, X * 0.5 + s * 0.5); R(L, x, b - s, W, s); return W; },
};
function word(L, text, x, b, C, X, s, sp, tail = 0) { for (const ch of text) { const adv = ch === 'S' ? G.S(L, x, b, C, X, s, tail) : G[ch](L, x, b, C, X, s); x += adv + sp; } return x; }
function sparkle(L, x, y, s, col) { L.fillStyle = col; L.beginPath(); for (const [ax, ay] of [[0.7, -0.7], [0.7, 0.7], [-0.7, 0.7], [-0.7, -0.7]]) { L.moveTo(x - ay * s * 0.06, y + ax * s * 0.06); L.lineTo(x + ax * s, y + ay * s); L.lineTo(x + ay * s * 0.06, y - ax * s * 0.06); L.closePath(); } L.fill(); L.beginPath(); L.arc(x, y, s * 0.09, 0, 7); L.fill(); }
export function drawStrokesLogo(g, x, y, w, h, { seed = 7, wear = 1, pal = null } = {}) {
  const P = { blue: BLUE, orange: ORANGE, shadow: SHADOW, glow: GLOW, spark: '#c4cdfa', ...(pal || {}) };
  const c = document.createElement('canvas'); c.width = 700; c.height = 600; const L = c.getContext('2d');
  const shapes = (col) => {
    L.fillStyle = col; L.strokeStyle = col;
    L.lineWidth = 16; L.beginPath(); L.arc(352, 300, 212, 0, Math.PI * 2); L.stroke();
    L.save(); L.transform(1, 0, -0.12, 1, 0, 0);
    L.beginPath();
    const tEnd = word(L, 'The', 222, 206, 104, 80, 20, 8);
    R(L, tEnd + 12, 166, 668 - tEnd, 18);                                    // stripe after "The", running out of the ring
    word(L, 'Strokes', 168, 334, 130, 100, 26, 9, 92);                     // S tail runs left out of the ring
    R(L, 262, 350, 400, 18); R(L, 96, 388, 500, 17);                         // stripes under the word
    L.fill('nonzero'); L.restore();
  };
  L.translate(350, 300); L.rotate(-0.13); L.translate(-350, -300);
  for (const [dx, dy, col] of [[13, 11, P.shadow], [8, 7, P.orange], [0, 0, P.blue]]) { L.save(); L.translate(dx, dy); shapes(col); L.restore(); }
  if (wear) { let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; L.save(); L.setTransform(1, 0, 0, 1, 0, 0); L.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 1600 * wear; i++) { L.globalAlpha = 0.3 + rnd() * 0.6; L.fillRect(rnd() * 700, rnd() * 600, 1 + rnd() * 3.5, 1 + rnd() * 1.8); }
    for (let i = 0; i < 90 * wear; i++) { L.globalAlpha = 0.45; L.fillRect(rnd() * 700, rnd() * 600, 6 + rnd() * 30, 1.3); } L.restore(); }
  L.setTransform(1, 0, 0, 1, 0, 0);
  for (const [sx, sy, ss] of [[552, 88, 40], [118, 232, 30], [598, 150, 24], [206, 470, 30]]) { sparkle(L, sx + 2, sy + 2, ss, P.orange); sparkle(L, sx, sy, ss, P.spark); }
  g.save(); g.shadowColor = P.glow; g.shadowBlur = Math.max(6, w * 0.05); g.drawImage(c, x, y, w, h); g.restore();
  g.drawImage(c, x, y, w, h);
}

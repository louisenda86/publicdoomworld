// P(DOOM) — core constants, math, easing, and interactive talk envelope.

const _Q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : null;
export const W = +((_Q && _Q.get('w')) || 1920), H = +((_Q && _Q.get('h')) || 1080), FPS = 60;
export const OFF = 8.5;
export const DUR = 547.0;
export const NFRAMES = Math.round(DUR * FPS);
export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;

export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (t, t0, t1) => clamp((t - t0) / (t1 - t0));
export const smooth = t => t * t * (3 - 2 * t);
export const smoother = t => t * t * t * (t * (t * 6 - 15) + 10);
export const fract = x => x - Math.floor(x);
export const sstep = (a, b, x) => smooth(clamp((x - a) / (b - a)));
export const pulse = (x, w) => Math.exp(-(x * x) / (w * w));

export function hash(n) {
  n |= 0;
  n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d);
  n ^= n >>> 12;
  n = Math.imul(n ^ (n >>> 13), 0x297a2d39);
  n ^= n >>> 15;
  return (n >>> 0) / 4294967296;
}
export const hash2 = (a, b) => hash(Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ 0x5bd1e995);
export const hash3 = (a, b, c) => hash(Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x9e3779b1));
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function vnoise(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash2(i, seed), hash2(i + 1, seed), u) * 2 - 1;
}
export function vnoise2(x, y, seed = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash3(ix, iy, seed), b = hash3(ix + 1, iy, seed), c = hash3(ix, iy + 1, seed), d = hash3(ix + 1, iy + 1, seed);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy) * 2 - 1;
}
export function fbm2(x, y, oct = 4, seed = 0) {
  let s = 0, a = 0.5, n = 0;
  for (let i = 0; i < oct; i++) { s += a * vnoise2(x, y, seed + i * 17); n += a; x *= 2.03; y *= 2.03; a *= 0.5; }
  return s / n;
}

export const E = {
  lin: t => t,
  inQ: t => t * t,
  outQ: t => 1 - (1 - t) * (1 - t),
  ioQ: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inC: t => t * t * t,
  outC: t => 1 - Math.pow(1 - t, 3),
  ioC: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuint: t => 1 - Math.pow(1 - t, 5),
  ioS: t => 0.5 - 0.5 * Math.cos(Math.PI * t),
  outExpo: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  ioExpo: t => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
  outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  outElastic: t => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1),
};
export function track(keys, t, ease = E.ioS) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, a] = keys[i - 1], [t1, b, e] = keys[i];
      const u = (e || ease)((t - t0) / (t1 - t0));
      if (Array.isArray(a)) return a.map((x, k) => x + (b[k] - x) * u);
      return a + (b - a) * u;
    }
  }
  return keys[keys.length - 1][1];
}

let _talkUntil = 0;
export function triggerTalk(dur = 3.2, now = performance.now() * 0.001) {
  _talkUntil = Math.max(_talkUntil, now + dur);
}
export function vox(t) {
  if (t < _talkUntil) {
    return clamp(0.45 + 0.45 * Math.sin(t * 24.0) * Math.cos(t * 11.3), 0, 1);
  }
  return clamp(0.32 + 0.35 * vnoise(t * 9.5, 77), 0, 1);
}


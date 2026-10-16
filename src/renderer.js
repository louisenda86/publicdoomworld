// Renderer: linear HDR scene (MSAA) -> small bloom -> composite (grade, overlay, CRT/glitch/fade FX) -> screen | YUV420 for capture
import * as THREE from 'three';
import { W, H } from './core.js';
import { PS1U, sceneKey } from './world/ps1.js';

const VERT = /* glsl */`
in vec3 position; in vec2 uv; out vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
function quadMat(frag, uniforms, extra = {}) {
  return new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VERT,
    fragmentShader: 'precision highp float; precision highp int;\n' + frag, uniforms, depthTest: false, depthWrite: false, ...extra });
}
const PREFILTER = /* glsl */`
uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThresh; in vec2 vUv; out vec4 o;
vec3 s(vec2 d){ return texture(tSrc, vUv + d * uTexel).rgb; }
void main(){ vec3 c = (s(vec2(-1.,-1.)) + s(vec2(1.,-1.)) + s(vec2(-1.,1.)) + s(vec2(1.,1.))) * 0.25;
  float br = max(c.r, max(c.g, c.b)); float w = clamp((br - uThresh) / max(br, 1e-4), 0., 1.); o = vec4(min(c * w, vec3(32.0)), 1.0); }`;
const DOWN = /* glsl */`
uniform sampler2D tSrc; uniform vec2 uTexel; in vec2 vUv; out vec4 o;
vec3 s(float x, float y){ return texture(tSrc, vUv + vec2(x, y) * uTexel).rgb; }
void main(){ vec3 r = s(0.,0.) * 0.25 + (s(-1.,1.) + s(1.,1.) + s(-1.,-1.) + s(1.,-1.)) * 0.125 + (s(-2.,0.) + s(2.,0.) + s(0.,2.) + s(0.,-2.)) * 0.0625; o = vec4(r, 1.0); }`;
const UP = /* glsl */`
uniform sampler2D tSrc; uniform vec2 uTexel; in vec2 vUv; out vec4 o;
vec3 s(float x, float y){ return texture(tSrc, vUv + vec2(x, y) * uTexel).rgb; }
void main(){ vec3 r = s(0.,0.) * 4.0 + (s(-1.,0.) + s(1.,0.) + s(0.,-1.) + s(0.,1.)) * 2.0 + (s(-1.,-1.) + s(1.,-1.) + s(-1.,1.) + s(1.,1.)); o = vec4(r / 16.0, 1.0); }`;

const COMP = /* glsl */`
uniform sampler2D tScene, tBloom, tOverlay;
uniform vec2 uRes; uniform float uTime, uFrame;
uniform float uExposure, uContrast, uSat, uVignette, uGrain, uBloom, uFade, uFlash, uOverlayOn, uSceneOn, uOverlayUnder;
uniform float uCrt, uGlitch, uDither, uScan, uCA, uWarm, uBW, uDPix, uBarrel, uZoomB; uniform vec2 uSmear;
uniform vec3 uTint, uLift, uFadeCol;
uniform float uDz, uDzPx, uDzLv, uDzMode, uDzCon; uniform vec3 uDzP0, uDzP1, uDzP2, uDzP3;
in vec2 vUv; out vec4 o;
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec3 toSRGB(vec3 c){ c = clamp(c, 0., 1.); return mix(c * 12.92, 1.055 * pow(c, vec3(1./2.4)) - 0.055, step(0.0031308, c)); }
float luma(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
float b2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float b4(vec2 a){ return b2(0.5 * a) * 0.25 + b2(a); }
float bayer8(vec2 a){ return b4(0.5 * a) * 0.25 + b2(a); }
float bayer4(vec2 p){ ivec2 q = ivec2(mod(p, 4.0)); int m[16] = int[16](0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5); return (float(m[q.y*4+q.x]) + 0.5) / 16.0; }
vec3 sceneCol(vec2 uv){
  vec3 hdr = texture(tScene, uv).rgb + texture(tBloom, uv).rgb * uBloom;
  vec3 c = toSRGB(hdr * uExposure * uTint);
  c = c + uLift * (1.0 - c);
  float l = luma(c); c = mix(vec3(l), c, uSat);
  c = (c - 0.5) * uContrast + 0.5;
  c = mix(c, vec3(luma(c)), uBW);
  return clamp(c, 0., 1.);
}
void main(){
  vec2 uv = vUv;
  if (uDz > 0.0) { vec2 cc = (floor(uv * uRes / uDzPx) + 0.5) * uDzPx / uRes; uv = cc; }
  if (uBarrel > 0.0) { vec2 d = uv - 0.5; float r2 = dot(d * vec2(1.0, 0.5625), d * vec2(1.0, 0.5625)); uv = 0.5 + d * (1.0 + uBarrel * r2) / (1.0 + uBarrel * 0.18); }
  vec2 px = uv * uRes;
  // glitch: horizontal band tearing
  if (uGlitch > 0.0) {
    float band = floor(px.y / 18.0); float r = hash12(vec2(band, floor(uFrame / 2.0)));
    if (r < uGlitch * 0.6) uv.x += (hash12(vec2(band, uFrame)) - 0.5) * 0.08 * uGlitch;
  }
  // CRT power-off: squash to a line, then to a dot
  float crtV = 1.0, crtH = 1.0;
  if (uCrt > 0.0) { crtV = max(1.0 - smoothstep(0.0, 0.55, uCrt), 0.004); crtH = 1.0 - smoothstep(0.55, 1.0, uCrt) * 0.995; }
  vec2 cuv = (uv - 0.5) / vec2(crtH, crtV) + 0.5;
  bool inside = all(greaterThanEqual(cuv, vec2(0.))) && all(lessThanEqual(cuv, vec2(1.)));
  vec3 col = vec3(0.0);
  if (uSmear.x != 0.0 || uSmear.y != 0.0 || uZoomB > 0.0) {
    // whip-pan smear / zoom blur over the composited picture (scene + overlay)
    vec3 acc = vec3(0.0);
    for (int k = 0; k < 15; k++) { float f = float(k) / 14.0 - 0.5; vec2 q = cuv + uSmear * f; q = 0.5 + (q - 0.5) * (1.0 - uZoomB * (f + 0.5));
      vec3 c = uSceneOn > 0.5 ? sceneCol(q) : vec3(0.0); if (uOverlayOn > 0.5) { vec4 ov = texture(tOverlay, q); c = mix(c, ov.rgb, ov.a); } acc += c; }
    col = acc / 15.0;
  } else {
    if (uSceneOn > 0.5) {
      if (uCA > 0.0) { vec2 d = (cuv - 0.5) * uCA * 0.006; col = vec3(sceneCol(cuv + d).r, sceneCol(cuv).g, sceneCol(cuv - d).b); }
      else col = sceneCol(cuv);
    }
    if (uOverlayOn > 0.5) { vec4 ov = texture(tOverlay, cuv); col = mix(col, ov.rgb, ov.a); }
  }
  if (uCrt > 0.0) { col *= inside ? 1.0 : 0.0; col += vec3(1.0) * smoothstep(0.35, 0.75, uCrt) * (inside ? 1.0 : 0.0) * (1.0 - smoothstep(0.85, 1.0, uCrt)); }
  if (uScan > 0.0) { col *= 1.0 - uScan * (0.5 + 0.5 * sin(px.y / uDPix * 3.14159)); }
  vec2 dc = uv - 0.5; dc.x *= uRes.x / uRes.y;
  col *= 1.0 - uVignette * smoothstep(0.45, 1.1, length(dc));
  if (uGlitch > 0.0) { float b = floor(px.y / 6.0); col += (hash12(vec2(b, uFrame)) - 0.5) * 0.12 * uGlitch; }
  col += (hash12(px * 0.997 + fract(uFrame * 0.618) * 113.0) - 0.5) * uGrain;
  if (uDz > 0.0) {
    float bb = bayer8(floor(px / uDzPx)) - 0.5;
    vec3 dc2;
    if (uDzMode > 0.5) { float lv = uDzLv - 1.0; vec3 cq = clamp((col - 0.5) * uDzCon + 0.5, 0.0, 1.0); dc2 = floor(cq * lv + 0.5 + bb) / lv; }
    else { float l = clamp((luma(col) - 0.5) * uDzCon + 0.5, 0.0, 1.0); float n = uDzLv - 1.0; float k = clamp(floor(l * n + 0.5 + bb), 0.0, n);
      dc2 = k < 0.5 ? uDzP0 : k < 1.5 ? uDzP1 : k < 2.5 ? uDzP2 : uDzP3; if (n < 1.5 && k > 0.5) dc2 = uDzP3; else if (n < 2.5 && k > 1.5) dc2 = uDzP3; }
    col = mix(col, clamp(dc2, 0.0, 1.0), uDz);
  }
  if (uDither > 0.0) { float lv = 31.0; col = floor(col * lv + bayer4(floor(px / uDPix))) / lv * uDither + col * (1.0 - uDither); }
  if (uBarrel > 0.0) { vec2 e = smoothstep(vec2(0.0), vec2(0.004), uv) * smoothstep(vec2(0.0), vec2(0.004), 1.0 - uv); col *= e.x * e.y; }
  col = mix(col, vec3(1.0), uFlash);
  col = mix(col, uFadeCol, uFade);
  o = vec4(clamp(col, 0., 1.), 1.0);
}`;

const YUVFRAG = /* glsl */`
uniform sampler2D tSrc; out vec4 o;
vec3 rgb(int x, int yTop){ return texelFetch(tSrc, ivec2(x, ${H - 1} - yTop), 0).rgb; }
float fY(vec3 c){ return (16.0 + (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) * 219.0) / 255.0; }
float fU(vec3 c){ return (128.0 + (-0.1146 * c.r - 0.3854 * c.g + 0.5 * c.b) * 224.0) / 255.0; }
float fV(vec3 c){ return (128.0 + (0.5 * c.r - 0.4542 * c.g - 0.0458 * c.b) * 224.0) / 255.0; }
void main(){
  int x = int(gl_FragCoord.x); int r = int(gl_FragCoord.y); vec4 v;
  if (r < ${H}) { for (int k = 0; k < 4; k++) v[k] = fY(rgb(4 * x + k, r)); }
  else { bool isU = r < ${H + H / 4}; int base = isU ? ${H} : ${H + H / 4}; int idx0 = ((r - base) * ${W / 4} + x) * 4;
    for (int k = 0; k < 4; k++) { int idx = idx0 + k; int cy = idx / ${W / 2}; int cx = idx - cy * ${W / 2};
      vec3 c = (rgb(2 * cx, 2 * cy) + rgb(2 * cx + 1, 2 * cy) + rgb(2 * cx, 2 * cy + 1) + rgb(2 * cx + 1, 2 * cy + 1)) * 0.25; v[k] = isU ? fU(c) : fV(c); } }
  o = v;
}`;

export const DEFAULT_LOOK = {
  exposure: 1.0, contrast: 1.0, sat: 1.0, vignette: 0.0, grain: 0.0, bloom: 0.35, bloomThresh: 1.0,
  tint: [1, 1, 1], lift: [0, 0, 0], fade: 0, fadeCol: [0, 0, 0], flash: 0, crt: 0, glitch: 0, dither: 0, scan: 0, ca: 0, bw: 0, overlay: true, ps1: 0, affine: 0.7, snap: 1, barrel: 0, clear: 0x000000,
  smear: [0, 0], zoomB: 0, dz: 0, dzPx: 4, dzLv: 4, dzMode: 0, dzCon: 1.15, dzPal: ['#0c0f0f', '#1d3b52', '#a6d7e6', '#f0e8da'], toon: 0, ht: 3.2, toonStep: 0.7, toonClean: 0.8, toonKey: 0, toonFloor: 0,
};

export class Renderer {
  constructor(canvas) {
    this.W = canvas.clientWidth || W;
    this.H = canvas.clientHeight || H;
    const r = this.r = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); r.setSize(this.W, this.H, false);
    r.outputColorSpace = THREE.LinearSRGBColorSpace; r.toneMapping = THREE.NoToneMapping;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); this.quad.frustumCulled = false;
    this.quadScene = new THREE.Scene(); this.quadScene.add(this.quad);
    this.rt = new THREE.WebGLRenderTarget(this.W, this.H, { type: THREE.HalfFloatType, samples: 2, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    this.mips = []; let w = Math.max(2, this.W >> 1), h = Math.max(2, this.H >> 1);
    for (let i = 0; i < 5; i++) { this.mips.push(new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, depthBuffer: false })); w = Math.max(2, w >> 1); h = Math.max(2, h >> 1); }
    this.mPre = quadMat(PREFILTER, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uThresh: { value: 1 } });
    this.mDown = quadMat(DOWN, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } });
    this.mUp = quadMat(UP, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } },
      { blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, transparent: true });
    const U = (v) => ({ value: v });
    this.mComp = quadMat(COMP, {
      tScene: U(null), tBloom: U(null), tOverlay: U(null), uRes: U(new THREE.Vector2(this.W, this.H)), uTime: U(0), uFrame: U(0),
      uExposure: U(1), uContrast: U(1), uSat: U(1), uVignette: U(0), uGrain: U(0), uBloom: U(0), uFade: U(0), uFlash: U(0), uOverlayOn: U(0), uSceneOn: U(1), uOverlayUnder: U(0),
      uSmear: U(new THREE.Vector2()), uZoomB: U(0), uCrt: U(0), uGlitch: U(0), uDither: U(0), uScan: U(0), uCA: U(0), uWarm: U(0), uBW: U(0), uDPix: U(1), uBarrel: U(0),
      uDz: U(0), uDzPx: U(4), uDzLv: U(4), uDzMode: U(0), uDzCon: U(1.15), uDzP0: U(new THREE.Vector3()), uDzP1: U(new THREE.Vector3()), uDzP2: U(new THREE.Vector3()), uDzP3: U(new THREE.Vector3()),
      uTint: U(new THREE.Vector3(1, 1, 1)), uLift: U(new THREE.Vector3()), uFadeCol: U(new THREE.Vector3()),
    });
    this.finalRT = new THREE.WebGLRenderTarget(this.W, this.H, { depthBuffer: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    this.lows = new Map();
    this.blackTex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1); this.blackTex.needsUpdate = true;
  }
  resize(w, h) {
    if (!w || !h || (w === this.W && h === this.H)) return;
    this.W = w; this.H = h;
    this.r.setSize(w, h, false);
    this.rt.setSize(w, h);
    this.finalRT.setSize(w, h);
    let mw = Math.max(2, w >> 1), mh = Math.max(2, h >> 1);
    for (let i = 0; i < this.mips.length; i++) { this.mips[i].setSize(mw, mh); mw = Math.max(2, mw >> 1); mh = Math.max(2, mh >> 1); }
    for (const rt of this.lows.values()) rt.dispose();
    this.lows.clear();
    this.mComp.uniforms.uRes.value.set(w, h);
  }
  lowRT(k) {
    if (!this.lows.has(k)) this.lows.set(k, new THREE.WebGLRenderTarget(Math.max(64, Math.round(this.W / k)), Math.max(64, Math.round(this.H / k)), { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter }));
    return this.lows.get(k);
  }
  pass(mat, target) { this.quad.material = mat; this.r.setRenderTarget(target); this.r.render(this.quadScene, this.quadCam); }
  bloom(src, L) {
    const m = this.mips;
    this.mPre.uniforms.tSrc.value = src; this.mPre.uniforms.uTexel.value.set(1 / this._sw, 1 / this._sh); this.mPre.uniforms.uThresh.value = L.bloomThresh;
    this.pass(this.mPre, m[0]);
    for (let i = 1; i < m.length; i++) { this.mDown.uniforms.tSrc.value = m[i - 1].texture; this.mDown.uniforms.uTexel.value.set(1 / m[i - 1].width, 1 / m[i - 1].height); this.pass(this.mDown, m[i]); }
    this.r.autoClear = false;
    for (let i = m.length - 1; i > 0; i--) { this.mUp.uniforms.tSrc.value = m[i].texture; this.mUp.uniforms.uTexel.value.set(1 / m[i].width, 1 / m[i].height); this.pass(this.mUp, m[i - 1]); }
    this.r.autoClear = true;
    return m[0].texture;
  }
  // views: [{scene, camera, rect:[x,y,w,h] (0..1, origin bottom-left)}]
  frame({ scene, camera, views, look, overlay, overlayOn, t, frame, target }) {
    const L = { ...DEFAULT_LOOK, ...(look || {}) };
    const k = L.ps1 || 0; const rt = k ? this.lowRT(k) : this.rt; const r = this.r; const RW = rt.width, RH = rt.height;
    PS1U.uSnap.value.set(RW, RH); PS1U.uSnapOn.value = k && L.snap ? 1 : 0; PS1U.uAffine.value = k ? L.affine : 0;
    PS1U.uToon.value = L.toon; PS1U.uHT.value = L.ht; PS1U.uStep.value = L.toonStep; PS1U.uClean.value = L.toonClean; PS1U.uFloor.value = L.toonFloor;
    const ks = (views && views.length) ? views[0].scene : scene; PS1U.uKey.value = L.toonKey || (ks ? sceneKey(ks) : 1);
    let sceneOn = 1;
    if (views && views.length) {
      r.setRenderTarget(rt); r.setClearColor(L.clear, 1); r.clear(); r.autoClear = false;
      for (const v of views) {
        const [x, y, w, h] = v.rect; const px = Math.round(x * RW), py = Math.round(y * RH), pw = Math.round(w * RW), ph = Math.round(h * RH);
        if (v.wipe) rt.viewport.set(0, 0, RW, RH); else rt.viewport.set(px, py, pw, ph);
        rt.scissor.set(px, py, pw, ph); rt.scissorTest = true; r.setRenderTarget(rt);
        if (v.before) v.before();
        if (v.camera.isPerspectiveCamera) { v.camera.aspect = v.wipe ? RW / RH : pw / ph; v.camera.updateProjectionMatrix(); }
        r.clearDepth(); r.render(v.scene, v.camera);
      }
      rt.viewport.set(0, 0, RW, RH); rt.scissor.set(0, 0, RW, RH); rt.scissorTest = false; r.setRenderTarget(rt); r.autoClear = true;
    } else if (scene && camera) {
      if (camera.isPerspectiveCamera && Math.abs(camera.aspect - this.W / this.H) > 0.001) {
        camera.aspect = this.W / this.H; camera.updateProjectionMatrix();
      }
      r.setRenderTarget(rt); r.setClearColor(L.clear, 1); r.render(scene, camera);
    }
    else { sceneOn = 0; }
    const u = this.mComp.uniforms;
    this._sw = RW; this._sh = RH; u.tBloom.value = sceneOn && L.bloom > 0 ? this.bloom(rt.texture, L) : this.blackTex;
    u.tScene.value = rt.texture; u.uSceneOn.value = sceneOn;
    u.tOverlay.value = overlay || this.blackTex; u.uOverlayOn.value = overlay && overlayOn && L.overlay ? 1 : 0;
    u.uTime.value = t; u.uFrame.value = frame;
    u.uExposure.value = L.exposure; u.uContrast.value = L.contrast; u.uSat.value = L.sat; u.uVignette.value = L.vignette; u.uGrain.value = L.grain;
    u.uBloom.value = L.bloom; u.uFade.value = L.fade; u.uFlash.value = L.flash; u.uCrt.value = L.crt; u.uGlitch.value = L.glitch; u.uDither.value = L.dither;
    u.uScan.value = L.scan; u.uCA.value = L.ca; u.uBW.value = L.bw; u.uDPix.value = k || L.dpix || 1; u.uBarrel.value = L.barrel;
    u.uDz.value = L.dz; u.uDzPx.value = L.dzPx; u.uDzLv.value = L.dzLv; u.uDzMode.value = L.dzMode; u.uDzCon.value = L.dzCon;
    for (let i = 0; i < 4; i++) { const n = parseInt((L.dzPal[i] || L.dzPal[L.dzPal.length - 1]).slice(1), 16); u['uDzP' + i].value.set(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); }
    u.uSmear.value.fromArray(L.smear); u.uZoomB.value = L.zoomB; u.uTint.value.fromArray(L.tint); u.uLift.value.fromArray(L.lift); u.uFadeCol.value.fromArray(L.fadeCol);
    this.pass(this.mComp, target === 'screen' ? null : this.finalRT);
  }
  readYUV() {
    this.mYuv.uniforms.tSrc.value = this.finalRT.texture; this.pass(this.mYuv, this.yuvRT);
    this.r.readRenderTargetPixels(this.yuvRT, 0, 0, W / 4, H * 3 / 2, this.yuvBuf);
    return this.yuvBuf;
  }
}

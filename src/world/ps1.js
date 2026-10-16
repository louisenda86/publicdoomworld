// Material patch injected into every lam()/basic() material:
//  - PS1 vertex snapping + affine UVs (legacy; off in this film)
//  - HALFTONE TOON lighting (this film's look): bright light stays clean, everything below a "clean" level is
//    quantised in fixed stops with a 45-degree dot screen between the stops, so terminators and cast shadows
//    read as printed halftone dots while the painted pixel textures stay crisp.
// Uniforms are shared, so the renderer flips them once per frame from the shot's look.
import * as THREE from 'three';
export const PS1U = {
  uSnap: { value: new THREE.Vector2(480, 270) },
  uSnapOn: { value: 0 },
  uAffine: { value: 0 },
  uToon: { value: 0 }, uHT: { value: 3.2 }, uStep: { value: 0.7 }, uClean: { value: 0.8 }, uKey: { value: 1 }, uFloor: { value: 0.0 },
};
const VDECL = `uniform vec2 uSnap; uniform float uSnapOn;
#ifdef USE_MAP
varying vec3 vMapUvA;
#endif
`;
const FDECL = `uniform float uAffine; uniform float uToon, uHT, uStep, uClean, uKey, uFloor;
#ifdef USE_MAP
varying vec3 vMapUvA;
#endif
`;
const MAPF = `#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D( map, mix( vMapUv, vMapUvA.xy / vMapUvA.z, uAffine ) );
  diffuseColor *= sampledDiffuseColor;
#endif`;
const EMIF = `#ifdef USE_EMISSIVEMAP
  #ifdef USE_MAP
  vec4 emissiveColor = texture2D( emissiveMap, mix( vEmissiveMapUv, vMapUvA.xy / vMapUvA.z, uAffine ) );
  #else
  vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
  #endif
  totalEmissiveRadiance *= emissiveColor.rgb;
#endif`;
const TOON = `#include <aomap_fragment>
if (uToon > 0.0) {
  vec3 litC = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
  float la = max(dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722)), 0.004);
  float sn = dot(litC, vec3(0.2126, 0.7152, 0.0722)) / la / uKey * 3.14159265;
  vec2 hp = gl_FragCoord.xy / uHT; hp = vec2(hp.x + hp.y, hp.y - hp.x) * 0.70710678;
  vec2 hf = fract(hp) - 0.5; float th = clamp(dot(hf, hf) * 2.0, 0.0, 1.0);
  float lg = log2(max(sn, 1e-3) / uClean) / uStep;
  float sq = uClean * exp2(min(floor(lg + th), 0.0) * uStep);
  sq = max(sq, uFloor);
  float sOut = sn >= uClean ? sn : sq;
  float k = mix(1.0, sOut / max(sn, 1e-4), uToon);
  reflectedLight.directDiffuse *= k; reflectedLight.indirectDiffuse *= k;
}`;
function onBC(sh) {
  for (const k of ['uSnap', 'uSnapOn', 'uAffine', 'uToon', 'uHT', 'uStep', 'uClean', 'uKey', 'uFloor']) sh.uniforms[k] = PS1U[k];
  sh.vertexShader = VDECL + sh.vertexShader
    .replace('#include <project_vertex>', '#include <project_vertex>\nif (uSnapOn > 0.5 && gl_Position.w > 0.0) { vec2 hs = uSnap * 0.5; gl_Position.xy = floor(gl_Position.xy / gl_Position.w * hs + 0.5) / hs * gl_Position.w; }\n#ifdef USE_MAP\n vMapUvA = vec3(vMapUv * gl_Position.w, gl_Position.w);\n#endif');
  sh.fragmentShader = FDECL + sh.fragmentShader.replace('#include <map_fragment>', MAPF).replace('#include <emissivemap_fragment>', EMIF).replace('#include <aomap_fragment>', TOON);
}
export function ps1Patch(m) { m.onBeforeCompile = onBC; m.customProgramCacheKey = () => 'ps1v3'; return m; }
// fully-lit reference irradiance of a scene (key light + sky), cached on the scene
export function sceneKey(scene) {
  if (scene.userData.toonKey != null) return scene.userData.toonKey;
  let k = 0;
  scene.traverse(o => {
    if (!o.isLight || o.visible === false) return;
    const lum = c => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
    if (o.isDirectionalLight) k = Math.max(k, 0) + o.intensity * lum(o.color);
    else if (o.isHemisphereLight) k += o.intensity * lum(o.color) * 0.9;
    else if (o.isAmbientLight) k += o.intensity * lum(o.color);
  });
  scene.userData.toonKey = Math.max(k, 0.35);
  return scene.userData.toonKey;
}

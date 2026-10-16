// Interactive 3D Worlds for PUBLIC DOOM:
// 1. studio     — Public Doom HQ (Their Studio)
// 2. playground — Night/Dusk Concrete Park (Their Playground)
// 3. diner      — Homer's 24H Diner (Their Fav Restaurant)
// 4. meadow     — Voxel Grass Field (Grass Field)
// 5. island     — Overview Diorama Hub connecting all 4 worlds (Logartis-style spatial overview)

import * as THREE from 'three';
import { box, cyl, lam, basic, cmat } from './world/kit.js';
import { ptex } from './world/tex.js';
import { skyDome, stars, lights, tree } from './world/env.js';
import { Character, POSE, idle, merge, sitPose } from './world/char.js';
import { mediaStudio, homersDiner, drawMenu, neon } from './world/sets5.js';
import { playground, meadow } from './world/sets.js';
import { text3d } from './world/glyph3d.js';
import * as P from './world/props.js';
import * as P2 from './world/props2.js';
import * as R3 from './world/props3.js';
import * as Q from './world/props5.js';

function place(parent, obj, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  obj.position.set(x, y, z);
  obj.rotation.set(rx, ry, rz);
  parent.add(obj);
  return obj;
}

export const CHARACTER_DATA = {
  JAX: {
    id: 'JAX',
    name: 'JAX',
    role: 'HOST // WRITER // DINER SHIFT LEAD',
    tag: 'MAIN CHARACTER // P(●) 01',
    accent: '#ff3b30',
    outfits: [
      { key: 'JAX', label: "HOMER'S CREW UNIFORM" },
      { key: 'JAX_STREET', label: 'LEATHER JACKET + STROKES TEE' },
    ],
    bio: 'Founder and sleep-deprived narrator of PUBLIC DOOM. Splits his waking hours between dissecting cultural stagnation on a boom mic and working the late fryer shift at Homer\'s 24H Diner.',
    stats: { BOREDOM_RES: '94%', CAFFEINE: '410mg', ESSAY_LEN: '09:07', VIBES: 'PS1_1998' },
    quotes: [
      '"Did interesting things actually die in 2026, or did we just optimize all the friction out of living?"',
      '"Welcome back to Public Doom. Tonight we\'re ordering the 10-Year Slow Roast at Homer\'s."',
      '"Every algorithm wants a smooth surface. We\'re bringing back vertex jitter and 4-bit Bayer dither."',
      '"Topeng locked himself in the research lab for 48 hours and came out with a toaster."',
    ],
  },
  TOPENG: {
    id: 'TOPENG',
    name: 'TOPENG',
    role: 'HEAD OF RESEARCH // GRAFFITI OPS',
    tag: 'TOPENG LABS // P(●) 02',
    accent: '#ff7eb6',
    outfits: [
      { key: 'TOPENG', label: 'PINK STROKES TEE + BALACLAVA' },
      { key: 'TOPENG_TANK', label: 'RIBBED TANK + CARGO OPS' },
    ],
    bio: 'Chief investigator at TOPENG LABS and nocturnal street artist behind the "TIDAK MAU" wall. Never removes the red knit balaclava or white cloth gaiter. Communicates in deadpan empirical proofs.',
    stats: { ANONYMITY: '100%', SPRAY_CANS: '14', LAB_CLEARANCE: 'LVL_9', VIBES: 'TIDAK_MAU' },
    quotes: [
      '"TIDAK MAU. I refuse the flattened feed. Paint the concrete until the polygons show."',
      '"For research purposes only: I have replaced the studio router with a 1997 Sony Trinitron."',
      '"Look at the graph on the board. Novelty peaked right before everyone bought the same beige sofa."',
      '"If Homer\'s stops serving the Cyclops Egg at 3 AM, we riot at the playground."',
    ],
  },
  AYESHA: {
    id: 'AYESHA',
    name: 'AYESHA',
    role: 'CREATIVE DIRECTOR // VISUAL ARCHIVIST',
    tag: 'ART & CAMERA // P(●) 03',
    accent: '#9b6bff',
    outfits: [
      { key: 'AYESHA', label: 'VIOLET ATHLETIC SET' },
      { key: 'AYESHA_STAGE', label: 'CROPPED MOTO + PLEATED SKIRT' },
    ],
    bio: 'Visual architect of PUBLIC DOOM. Curates the classical paintings, 32-bit CRT color palettes, and sharpest camera blocking in the studio. Unimpressed by hype; fiercely protective of the channel\'s aesthetic.',
    stats: { AESTHETIC: '99%', CRT_BIAS: '15.7kHz', COLOR_KEY: '#8B5CF6', VIBES: 'LATE_NIGHT' },
    quotes: [
      '"If the frame doesn\'t look like a forgotten 1999 demo disc found in a thrift store, re-render it."',
      '"Jax talks for nine minutes straight; my job is making sure every second looks like a painting."',
      '"Athena and I claimed the corner booth at Homer\'s. Nobody touches the jukebox without asking."',
      '"Touch grass? We built a whole voxel meadow just so we could touch low-poly grass in 240p."',
    ],
  },
  ATHENA: {
    id: 'ATHENA',
    name: 'ATHENA',
    role: 'SOUND DESIGNER // LORE KEEPER',
    tag: 'SYNTH & MYTH // P(●) 04',
    accent: '#ffd43b',
    outfits: [
      { key: 'ATHENA', label: 'SUNNY YELLOW + PINK SHORTS' },
      { key: 'ATHENA_STAGE', label: 'GOLD/WHITE PLEATED STAGE SET' },
    ],
    bio: 'Composer of PUBLIC DOOM\'s FM-bell and saw-pad soundtracks and resident classical mythologist. Connects Homer\'s Odyssey to modern internet malaise while drinking strawberry Siren Shakes.',
    stats: { FM_BELLS: '48kHz', ODYSSEY_LORE: 'MAX', REVERB_T60: '2.8s', VIBES: 'GOLDEN_HOUR' },
    quotes: [
      '"Every chord in the studio track is a detuned saw pad running through an 8-line FDN reverb!"',
      '"Odysseus took ten years to get home because the journey had friction. Friction is where stories live!"',
      '"Listen to the PS1 boot chime—those fifths locking in is the sound of a real world loading."',
      '"Meet me by the bus stop in the grass field when the sun hits golden hour!"',
    ],
  },
};

export const WORLD_ORDER = ['studio', 'playground', 'diner', 'meadow', 'island'];

export const WORLD_META = {
  studio: {
    id: 'studio',
    index: '01',
    title: 'PUBLIC DOOM STUDIO',
    subtitle: 'HQ // BROADCAST & EDITING BUNKER',
    location: 'SECTOR 01 · JAKARTA / CYBERSPACE',
    bgm: 'studio-lofi',
    bgmTitle: '01 · STUDIO LOFI (CH.LOFI // SCORE_D)',
    description: 'Where Jax, Topeng, Ayesha, and Athena write, shoot, and edit Public Doom episodes surrounded by acoustic foam, glowing neon, and CRT monitors.',
    defaultCam: { pos: [0.1, 1.58, 2.55], target: [0.0, 1.15, -0.75], fov: 48 },
    look: {
      clear: 0x07080d, exposure: 1.15, contrast: 1.08, sat: 1.08, bloom: 0.36, bloomThresh: 0.88,
      vignette: 0.28, grain: 0.022, dither: 0.65, ps1: 2, affine: 0.65, snap: 1, scan: 0.14, barrel: 0.05,
      tint: [1.0, 0.99, 1.04], lift: [0.01, 0.01, 0.025],
    },
    views: [
      { id: 'overview', label: 'WIDE STUDIO', pos: [0.1, 1.58, 2.55], target: [0.0, 1.15, -0.75], fov: 48 },
      { id: 'desk', label: 'EDITING DESK', pos: [-0.25, 1.42, 1.15], target: [0.15, 1.05, -0.55], fov: 40 },
      { id: 'neon', label: 'NEON & SHELF', pos: [0.85, 1.55, 1.45], target: [1.35, 1.25, -1.85], fov: 40 },
    ],
  },
  playground: {
    id: 'playground',
    index: '02',
    title: 'THE PLAYGROUND',
    subtitle: 'TIDAK MAU WALL // AFTER-HOURS PARK',
    location: 'SECTOR 02 · CONCRETE SANDBOX',
    bgm: 'playground-retro',
    bgmTitle: '02 · TIDAK MAU BEAT (CH.RETRO // SCORE_D)',
    description: 'The crew\'s late-night concrete hangout under a flickering sodium streetlamp. Features Topeng\'s signature red "TIDAK MAU" graffiti wall, the sandbox, and the metal slide.',
    defaultCam: { pos: [0.25, 1.85, 4.8], target: [0.0, 1.15, -1.6], fov: 46 },
    look: {
      clear: 0x090b14, exposure: 1.22, contrast: 1.08, sat: 1.08, bloom: 0.36, bloomThresh: 0.88,
      vignette: 0.28, grain: 0.025, dither: 0.7, ps1: 2, affine: 0.65, snap: 1, scan: 0.16, barrel: 0.06,
      tint: [0.98, 0.99, 1.06], lift: [0.02, 0.02, 0.035],
    },
    views: [
      { id: 'overview', label: 'PARK WIDE', pos: [0.25, 1.85, 4.8], target: [0.0, 1.15, -1.6], fov: 46 },
      { id: 'graffiti', label: 'TIDAK MAU WALL', pos: [-0.3, 1.65, -0.8], target: [0.0, 1.45, -6.8], fov: 40 },
      { id: 'slide', label: 'SLIDE & SANDBOX', pos: [-1.6, 1.85, 3.6], target: [-2.8, 1.0, -1.5], fov: 44 },
    ],
  },
  diner: {
    id: 'diner',
    index: '03',
    title: "HOMER'S 24H DINER",
    subtitle: 'FAV RESTAURANT // EST. 8TH CENTURY BC',
    location: 'SECTOR 03 · NIGHTHAWK BOULEVARD',
    bgm: 'diner-warm',
    bgmTitle: "03 · HOMER'S LATE SHIFT (CH.WARM // SCORE_D)",
    description: 'Their favorite 24-hour retro restaurant. Red vinyl booths, checkerboard floors, Odyssey Burgers, Siren Shakes, a glowing Wurlitzer jukebox, and a corner CRT TV.',
    defaultCam: { pos: [0.25, 1.72, 2.75], target: [0.0, 1.18, -1.4], fov: 50 },
    look: {
      clear: 0x120b09, exposure: 1.12, contrast: 1.08, sat: 1.12, bloom: 0.42, bloomThresh: 0.85,
      vignette: 0.28, grain: 0.022, dither: 0.65, ps1: 2, affine: 0.65, snap: 1, scan: 0.14, barrel: 0.05,
      tint: [1.06, 0.99, 0.93], lift: [0.02, 0.01, 0.005],
    },
    views: [
      { id: 'overview', label: 'DINER FLOOR', pos: [0.25, 1.72, 2.75], target: [0.0, 1.18, -1.4], fov: 50 },
      { id: 'counter', label: 'COUNTER & MENU', pos: [0.8, 1.6, 1.2], target: [0.8, 1.45, -3.1], fov: 42 },
      { id: 'booths', label: 'RED BOOTHS', pos: [-0.8, 1.58, 2.3], target: [-3.2, 1.1, -0.2], fov: 44 },
    ],
  },
  meadow: {
    id: 'meadow',
    index: '04',
    title: 'THE GRASS FIELD',
    subtitle: 'VOXEL MEADOW // BUS SHELTER OVERLOOK',
    location: 'SECTOR 04 · DAYLIGHT OUTSKIRTS',
    bgm: 'meadow-home',
    bgmTitle: '04 · TOUCHING LOW-POLY GRASS (CH.HOME // SCORE_D)',
    description: 'An open, sunlit low-poly grass field where the crew escapes the bunker. Stepped voxel hills, wildflowers, swaying trees, and the glass bus stop shelter.',
    defaultCam: { pos: [-0.25, 1.78, 4.6], target: [0.0, 1.05, -0.4], fov: 46 },
    look: {
      clear: 0x7ec0ee, exposure: 1.02, contrast: 1.05, sat: 1.12, bloom: 0.26, bloomThresh: 0.92,
      vignette: 0.20, grain: 0.016, dither: 0.6, ps1: 2, affine: 0.65, snap: 1, scan: 0.1, barrel: 0.04,
      tint: [1.02, 1.01, 0.98], lift: [0.01, 0.015, 0.02],
    },
    views: [
      { id: 'overview', label: 'MEADOW WIDE', pos: [-0.25, 1.78, 4.6], target: [0.0, 1.05, -0.4], fov: 46 },
      { id: 'shelter', label: 'BUS SHELTER', pos: [0.3, 1.55, 2.4], target: [0.0, 1.15, -1.2], fov: 40 },
      { id: 'picnic', label: 'FLOWER PATCH', pos: [-2.1, 1.45, 3.2], target: [-1.1, 1.0, 0.5], fov: 40 },
    ],
  },
  island: {
    id: 'island',
    index: '00',
    title: 'PUBLIC DOOM ATLAS',
    subtitle: 'INTERACTIVE 3D DIORAMA // ALL SECTORS',
    location: 'ORBITAL VIEW · LOGARTIS SPATIAL MAP',
    bgm: 'video-bgm-extract',
    bgmTitle: '00 · DEATH OF INTERESTING THINGS (ORIGINAL VIDEO BGM)',
    description: 'Spatial diorama overview of the Public Doom universe. Orbit freely or click any sector beacon or cast member to dive straight into their world.',
    defaultCam: { pos: [0.0, 5.4, 9.8], target: [0.0, 0.9, 0.0], fov: 44 },
    look: {
      clear: 0x070912, exposure: 1.14, contrast: 1.08, sat: 1.1, bloom: 0.42, bloomThresh: 0.82,
      vignette: 0.30, grain: 0.022, dither: 0.65, ps1: 2, affine: 0.65, snap: 1, scan: 0.14, barrel: 0.05,
      tint: [1.0, 1.0, 1.04], lift: [0.015, 0.018, 0.03],
    },
    views: [
      { id: 'overview', label: 'ORBITAL MAP', pos: [0.0, 5.4, 9.8], target: [0.0, 0.9, 0.0], fov: 44 },
      { id: 'cast', label: 'CENTER OVERLOOK', pos: [0.0, 1.85, 3.8], target: [0.0, 1.15, 0.3], fov: 40 },
    ],
  },
};

function tagPickable(root, payload) {
  root.userData.pick = payload;
  root.traverse(o => {
    if (o.isMesh) o.userData.pick = payload;
  });
}

function createCastEntry(worldKey, charId, { x = 0, y = 0, z = 0, ry = 0, pose = 'stand', sit = false }) {
  const holder = new THREE.Group();
  holder.position.set(x, y, z);
  holder.rotation.y = ry;

  let currentOutfitIdx = 0;
  const meta = CHARACTER_DATA[charId];

  function buildChar(outfitIdx = 0) {
    while (holder.children.length) holder.remove(holder.children[0]);
    const outfitKey = meta.outfits[outfitIdx % meta.outfits.length].key;
    const ch = new Character(outfitKey);
    holder.add(ch.root);
    tagPickable(holder, {
      type: 'character',
      id: charId,
      world: worldKey,
    });
    return ch;
  }

  let ch = buildChar(0);
  let customPose = pose;
  let customExpr = 'neutral';
  let waveUntil = 0;

  return {
    id: charId,
    meta,
    holder,
    get char() { return ch; },
    get outfitIndex() { return currentOutfitIdx; },
    get outfitLabel() { return meta.outfits[currentOutfitIdx % meta.outfits.length].label; },
    cycleOutfit() {
      currentOutfitIdx = (currentOutfitIdx + 1) % meta.outfits.length;
      ch = buildChar(currentOutfitIdx);
      return this.outfitLabel;
    },
    setPose(p) {
      customPose = p;
    },
    setExpr(e) {
      customExpr = e;
    },
    triggerWave(now) {
      waveUntil = now + 2.4;
    },
    getHeadWorldPos() {
      const v = new THREE.Vector3(0, 1.92 * (ch.D.scale || 1), 0);
      holder.updateMatrixWorld();
      return v.applyMatrix4(holder.matrixWorld);
    },
    getFocusCam() {
      holder.updateMatrixWorld();
      const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), holder.rotation.y);
      const base = holder.position.clone();
      const camPos = base.clone().addScaledVector(forward, 1.95).add(new THREE.Vector3(0.18, 1.38, 0));
      const target = base.clone().add(new THREE.Vector3(0, 1.25, 0));
      return {
        pos: [camPos.x, camPos.y, camPos.z],
        target: [target.x, target.y, target.z],
        fov: 36,
      };
    },
    update(t, idx) {
      const exprMap = {
        neutral: { eyes: 'open', mouth: 'closed' },
        happy: { eyes: 'happy', mouth: 'smile' },
        smug: { eyes: 'half', mouth: 'smirk' },
        shock: { eyes: 'wide', mouth: 'open' },
        sad: { eyes: 'sad', mouth: 'frown' },
        angry: { eyes: 'angry', mouth: 'frown' },
        talk: { eyes: 'open', mouth: 'smile', talk: true },
      };
      const faceSpec = exprMap[customExpr] || exprMap.neutral;

      const poseFn = tt => {
        let p = idle(tt, idx * 17 + 3);
        const activePose = tt < waveUntil ? 'wave' : customPose;
        if (activePose === 'cross') p = merge(p, { joints: POSE.crossArms });
        else if (activePose === 'hip') p = merge(p, { joints: POSE.hipsHands });
        else if (activePose === 'point') p = merge(p, { joints: POSE.pointFwdR });
        else if (activePose === 'shrug') p = merge(p, { joints: POSE.shrug });
        else if (activePose === 'cheer') p = merge(p, { joints: POSE.armsUp });
        else if (activePose === 'explain') p = merge(p, { joints: POSE.handChin });
        else if (activePose === 'wave') {
          const wv = Math.sin(tt * 9.0) * 0.35;
          p = merge(p, { joints: { shR: [-0.35, 0, -2.35 + wv], elR: [-0.55 + wv * 0.5, 0, 0] } });
        }
        return { ...p, ...faceSpec };
      };
      ch.update(t, poseFn);
    },
  };
}

// ============================================================================
// 1. THE STUDIO (PUBLIC DOOM HQ)
// ============================================================================
function buildStudioWorld(ctx) {
  const { scene: s, mon, monG, ring, cam } = mediaStudio(ctx);

  // Move foreground tripod camera & ring light to the wings so the center stage is completely clear!
  if (cam) { cam.position.set(-1.75, 0, 1.35); cam.rotation.y = Math.PI - 0.45; }
  if (ring) { ring.position.set(1.75, 1.35, 1.25); ring.rotation.y = Math.PI + 0.45; }

  // Add Public Doom Research Board on left wall
  const board = P.doomBoard();
  board.position.set(-2.15, 0, -0.35);
  board.rotation.y = Math.PI / 2 - 0.25;
  s.add(board);

  // Cast in the Studio:
  const cast = {
    JAX: createCastEntry('studio', 'JAX', { x: -0.45, y: 0, z: 0.18, ry: 0.18, pose: 'explain' }),
    TOPENG: createCastEntry('studio', 'TOPENG', { x: -1.38, y: 0, z: -0.25, ry: 0.42, pose: 'cross' }),
    AYESHA: createCastEntry('studio', 'AYESHA', { x: 0.55, y: 0, z: 0.18, ry: -0.22, pose: 'hip' }),
    ATHENA: createCastEntry('studio', 'ATHENA', { x: 1.38, y: 0, z: -0.22, ry: -0.42, pose: 'wave' }),
  };
  Object.values(cast).forEach(c => s.add(c.holder));

  const hotspots = [
    {
      id: 'studio-pc',
      label: 'EDITING SUITE // NLE_98',
      sub: 'PLAY EPISODE ARCHIVE',
      pos: new THREE.Vector3(0.82, 1.32, -0.42),
      cam: { pos: [0.15, 1.38, 0.95], target: [0.65, 1.05, -0.45], fov: 36 },
      action: 'episode',
      title: 'PUBLIC DOOM // EDITING WORKSTATION',
      desc: 'PS1 non-linear editing deck running "THE DEATH OF INTERESTING THINGS (1080p60)". Timeline locked at 547.0s with custom GLSL Bayer dithering and procedural FDN reverb score.',
    },
    {
      id: 'studio-board',
      label: 'DOOM RESEARCH BOARD',
      sub: 'NOVELTY DECAY GRAPH',
      pos: new THREE.Vector3(-1.95, 1.45, -0.35),
      cam: { pos: [-0.4, 1.45, 0.85], target: [-2.0, 1.25, -0.35], fov: 38 },
      action: 'inspect',
      title: 'TOPENG LABS // CULTURAL ENTROPY BOARD',
      desc: 'Tracks the steady decline of unscripted weirdness from 1969 to 2026 across red yarn conspiracy threads.',
    },
    {
      id: 'studio-shelf',
      label: 'ARTIFACT SHELF',
      sub: 'TRIREME & LUCKY CAT',
      pos: new THREE.Vector3(1.45, 1.55, -1.85),
      cam: { pos: [0.95, 1.48, -0.35], target: [1.45, 1.2, -1.9], fov: 36 },
      action: 'inspect',
      title: 'STUDIO ARTIFACTS // ODYSSEY TRIREME & MANEKI-NEKO',
      desc: 'Scale wooden Greek trireme from the Odyssey act alongside the golden studio cat and leather-bound editions of Homer.',
    },
  ];

  if (monG) tagPickable(monG, { type: 'hotspot', hotspot: hotspots[0] });
  tagPickable(board, { type: 'hotspot', hotspot: hotspots[1] });

  return {
    id: 'studio',
    scene: s,
    cast,
    hotspots,
    update(t) {
      if (mon) {
        mon.draw((g, w, h) => {
          g.fillStyle = '#0c0f18';
          g.fillRect(0, 0, w, h);
          g.fillStyle = '#ff3b30';
          g.fillRect(16, 14, w - 32, 34);
          g.fillStyle = '#fff';
          g.font = 'bold 20px monospace';
          g.fillText('P(●) NLE // DEATH_OF_INTERESTING_THINGS.MP4', 28, 38);
          for (let i = 0; i < 32; i++) {
            const bh = 24 + Math.abs(Math.sin(t * 4.2 + i * 0.45)) * 120;
            g.fillStyle = i % 4 === 0 ? '#ff3b30' : i % 2 === 0 ? '#9b6bff' : '#ffd43b';
            g.fillRect(28 + i * 18, 190 - bh * 0.5, 12, bh);
          }
          const px = 28 + ((t * 60) % (w - 64));
          g.fillStyle = '#ffffff';
          g.fillRect(px, 60, 4, 240);
        });
      }
      Object.values(cast).forEach((c, i) => c.update(t, i));
    },
  };
}

// ============================================================================
// 2. THE PLAYGROUND (NIGHT/DUSK CONCRETE PARK)
// ============================================================================
function buildPlaygroundWorld(ctx) {
  const { scene: s, ai } = playground(ctx);

  // Move the AI box to the side of the sandbox so the TIDAK MAU graffiti wall & sandbox are unobstructed
  if (ai && ai.g) {
    ai.g.position.set(3.4, 0.0, -0.5);
    ai.g.rotation.y = -0.45;
  }

  const lampGlow = new THREE.PointLight(0xffb86c, 3.2, 16);
  lampGlow.position.set(2.2, 3.6, 1.8);
  s.add(lampGlow);

  const fillLight = new THREE.PointLight(0x9fb4ff, 2.0, 14);
  fillLight.position.set(-2.2, 3.0, 3.2);
  s.add(fillLight);

  // Add boombox by the sandbox ledge
  const boom = place(s, P2.boombox(), -1.55, 0.28, 1.55, 0, 0.4, 0);

  // Cast in the Playground:
  const cast = {
    TOPENG: createCastEntry('playground', 'TOPENG', { x: -0.65, y: 0.18, z: -1.15, ry: 0.15, pose: 'point' }),
    JAX: createCastEntry('playground', 'JAX', { x: -1.65, y: 0, z: 0.95, ry: 0.32, pose: 'explain' }),
    AYESHA: createCastEntry('playground', 'AYESHA', { x: 1.65, y: 0, z: 0.85, ry: -0.38, pose: 'hip' }),
    ATHENA: createCastEntry('playground', 'ATHENA', { x: 0.55, y: 0.18, z: -0.35, ry: -0.22, pose: 'cheer' }),
  };
  Object.values(cast).forEach(c => s.add(c.holder));

  let lampMode = 0;
  const hotspots = [
    {
      id: 'pg-graffiti',
      label: '"TIDAK MAU" WALL',
      sub: 'TOPENG GRAFFITI MANIFESTO',
      pos: new THREE.Vector3(0.0, 2.2, -6.8),
      cam: { pos: [-0.2, 1.75, -1.6], target: [0.0, 1.65, -6.9], fov: 40 },
      action: 'inspect',
      title: 'TIDAK MAU // CONCRETE WALL MURAL',
      desc: '"TIDAK MAU" ("I DO NOT WANT IT") — Topeng\'s signature crimson block-letter piece sprayed across the back wall of Sector 02.',
    },
    {
      id: 'pg-sandbox',
      label: 'SANDBOX & BOOMBOX',
      sub: 'PLAYGROUND BEAT DECK',
      pos: new THREE.Vector3(-1.55, 0.75, 1.55),
      cam: { pos: [-0.8, 1.45, 3.8], target: [-1.2, 0.65, 1.2], fov: 38 },
      action: 'bgm-cycle',
      title: 'SANDBOX BOOMBOX // CH.RETRO DECK',
      desc: 'Blasting the synthesized FM-bell and sub-bass stems from DEATH OF INTERESTING THINGS. Click to cycle the active background music track!',
    },
    {
      id: 'pg-lamp',
      label: 'SODIUM STREETLAMP',
      sub: 'TOGGLE NIGHT MOOD',
      pos: new THREE.Vector3(3.4, 3.1, -2.8),
      cam: { pos: [1.2, 1.85, 2.8], target: [3.1, 1.8, -2.5], fov: 42 },
      action: 'custom',
      onTrigger() {
        lampMode = (lampMode + 1) % 3;
        if (lampMode === 0) { lampGlow.color.setHex(0xffb86c); lampGlow.intensity = 3.2; }
        else if (lampMode === 1) { lampGlow.color.setHex(0xff2e55); lampGlow.intensity = 3.6; }
        else { lampGlow.color.setHex(0x5ce1e6); lampGlow.intensity = 3.4; }
      },
      title: 'SECTOR 02 // SODIUM VAPOR LAMP',
      desc: 'Toggles the playground streetlamp spectrum between Warm Sodium (1998), Crimson Alert (Doom Mode), and Cyber Cyan.',
    },
  ];

  tagPickable(boom, { type: 'hotspot', hotspot: hotspots[1] });

  return {
    id: 'playground',
    scene: s,
    cast,
    hotspots,
    update(t) {
      boom.scale.setScalar(1 + Math.sin(t * 11.0) * 0.03);
      Object.values(cast).forEach((c, i) => c.update(t, i));
    },
  };
}

// ============================================================================
// 3. FAV RESTAURANT (HOMER'S 24H DINER — EST. 8TH CENTURY BC)
// ============================================================================
function buildDinerWorld(ctx) {
  const { scene: s, menu, tv } = homersDiner(ctx);
  if (menu) drawMenu(menu);

  // Add Odyssey Burgers & mugs on the counter and booth tables using place(parent, obj, x, y, z)!
  const b1 = place(s, R3.burger(1.1), 0.2, 1.07, -1.25);
  const m1 = place(s, R3.mug('#ff7eb6'), 0.55, 1.07, -1.2);
  place(s, R3.burger(1.0), -3.9, 0.76, -1.4);
  place(s, R3.mug('#ffd43b'), -3.65, 0.76, -1.35);
  place(s, R3.burger(1.0), -3.9, 0.76, 0.6);
  place(s, R3.mug('#9b6bff'), -3.65, 0.76, 0.65);

  const specialsGroup = new THREE.Group();
  s.add(specialsGroup);
  let specialCount = 0;

  // Cast in Homer's Diner:
  const cast = {
    JAX: createCastEntry('diner', 'JAX', { x: 1.15, y: 0, z: -0.15, ry: -0.25, pose: 'wave' }),
    TOPENG: createCastEntry('diner', 'TOPENG', { x: -0.35, y: 0, z: 0.25, ry: 0.18, pose: 'cross' }),
    AYESHA: createCastEntry('diner', 'AYESHA', { x: -1.75, y: 0, z: 0.25, ry: 0.35, pose: 'hip' }),
    ATHENA: createCastEntry('diner', 'ATHENA', { x: 2.15, y: 0, z: 0.35, ry: -0.42, pose: 'cheer' }),
  };
  Object.values(cast).forEach(c => s.add(c.holder));

  const hotspots = [
    {
      id: 'diner-menu',
      label: "HOMER'S MENU BOARD",
      sub: 'ORDER ODYSSEY SPECIAL',
      pos: new THREE.Vector3(-1.0, 2.35, -3.8),
      cam: { pos: [-0.2, 1.65, 1.15], target: [-0.8, 1.75, -3.5], fov: 40 },
      action: 'custom',
      onTrigger() {
        specialCount = (specialCount + 1) % 5;
        while (specialsGroup.children.length) specialsGroup.remove(specialsGroup.children[0]);
        for (let i = 0; i < specialCount; i++) {
          place(specialsGroup, R3.burger(1.05), -0.8 + i * 0.48, 1.07, -1.25);
          place(specialsGroup, R3.mug(i % 2 ? '#ff63b0' : '#8b5cf6'), -0.62 + i * 0.48, 1.07, -1.15);
        }
      },
      title: "HOMER'S DINER // EST. 8TH CENTURY BC MENU",
      desc: 'THE ODYSSEY BURGER ($9.99) · CYCLOPS EGG ($4.50) · TROJAN FRIES ($3.99) · SIREN SHAKE ($5.25) · NOSTOS PIE ($4.75) · 10-YEAR SLOW ROAST ($27.00). Click to ring up another order on the counter!',
    },
    {
      id: 'diner-jukebox',
      label: 'WURLITZER JUKEBOX',
      sub: 'SWITCH BGM TRACK',
      pos: new THREE.Vector3(-3.2, 1.35, 1.8),
      cam: { pos: [-0.8, 1.55, 2.3], target: [-3.4, 1.05, 1.2], fov: 42 },
      action: 'bgm-cycle',
      title: 'NEON WURLITZER // SOUNDTRACK SELECTOR',
      desc: 'Loaded with 48kHz synth-pad & lo-fi cuts from DEATH OF INTERESTING THINGS. Click to cycle the active diner soundtrack!',
    },
    {
      id: 'diner-crt',
      label: 'CORNER CRT TV',
      sub: 'WATCH PUBLIC DOOM BROADCAST',
      pos: new THREE.Vector3(-3.75, 2.35, -3.2),
      cam: { pos: [-1.2, 1.75, -0.4], target: [-3.8, 2.15, -3.2], fov: 38 },
      action: 'episode',
      title: 'HIGH-MOUNTED TRINITRON // LATE NIGHT BROADCAST',
      desc: 'Bolted in the high corner of Homer\'s Diner, broadcasting Public Doom\'s latest video essay to the 3 AM crowd.',
    },
  ];

  tagPickable(b1, { type: 'hotspot', hotspot: hotspots[0] });
  tagPickable(m1, { type: 'hotspot', hotspot: hotspots[0] });

  return {
    id: 'diner',
    scene: s,
    cast,
    hotspots,
    update(t) {
      if (tv && tv.scr) {
        tv.scr.draw((g, w, h) => {
          g.fillStyle = '#120d18';
          g.fillRect(0, 0, w, h);
          g.fillStyle = '#ff3b30';
          g.font = 'bold 28px monospace';
          g.textAlign = 'center';
          g.fillText('PUBLIC DOOM P(●)', w / 2, h / 2 - 10);
          g.fillStyle = '#ffd43b';
          g.font = '18px monospace';
          g.fillText('LIVE ON CH 03 // HOMER\'S', w / 2, h / 2 + 24);
        });
      }
      Object.values(cast).forEach((c, i) => c.update(t, i));
    },
  };
}

// ============================================================================
// 4. GRASS FIELD (VOXEL MEADOW & BUS SHELTER)
// ============================================================================
function buildMeadowWorld(ctx) {
  const { scene: s } = meadow(ctx);

  const bench = place(s, P.bench(1.8), -2.2, 0.02, 0.85, 0, 0.55, 0);
  const boom = place(s, P2.boombox(), -1.15, 0.18, 1.45, 0, -0.35, 0);

  // Floating dandelion / pollen particles in the sunlit grass field
  const pGeo = new THREE.BufferGeometry();
  const pCount = 90;
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pPos[i * 3] = (Math.sin(i * 7.13) - 0.5) * 14;
    pPos[i * 3 + 1] = 0.4 + (i % 10) * 0.28;
    pPos[i * 3 + 2] = (Math.cos(i * 3.71) - 0.5) * 12;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pollen = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xfff8c8, size: 0.06, transparent: true, opacity: 0.85 }));
  s.add(pollen);

  // Cast in the Grass Field:
  const cast = {
    JAX: createCastEntry('meadow', 'JAX', { x: -0.65, y: 0.02, z: 0.75, ry: 0.25, pose: 'wave' }),
    TOPENG: createCastEntry('meadow', 'TOPENG', { x: 1.15, y: 0.02, z: -0.25, ry: -0.42, pose: 'cross' }),
    AYESHA: createCastEntry('meadow', 'AYESHA', { x: -1.65, y: 0.02, z: 1.45, ry: 0.55, pose: 'hip' }),
    ATHENA: createCastEntry('meadow', 'ATHENA', { x: 0.45, y: 0.02, z: 1.35, ry: -0.32, pose: 'cheer' }),
  };
  Object.values(cast).forEach(c => s.add(c.holder));

  let goldenHour = false;
  const hotspots = [
    {
      id: 'meadow-halte',
      label: 'BUS STOP SHELTER',
      sub: 'TRANSIT TO ALL SECTORS',
      pos: new THREE.Vector3(0.0, 1.85, -1.2),
      cam: { pos: [0.35, 1.5, 2.2], target: [0.0, 1.15, -1.2], fov: 38 },
      action: 'inspect',
      title: 'OUTSKIRTS BUS STOP // PUBLIC DOOM TRANSIT',
      desc: 'Connects the Voxel Meadow back to Homer\'s 24H Diner, the Concrete Playground, and the Public Doom Broadcast Studio.',
    },
    {
      id: 'meadow-picnic',
      label: 'FIELD BOOMBOX',
      sub: 'CYCLE AMBIENT SCORE',
      pos: new THREE.Vector3(-1.15, 0.65, 1.45),
      cam: { pos: [-1.1, 1.25, 3.3], target: [-1.1, 0.55, 1.2], fov: 38 },
      action: 'bgm-cycle',
      title: 'TOUCHING GRASS // FIELD SESSION',
      desc: 'Playing the glass & home FM-bell stems from DEATH OF INTERESTING THINGS out on the lawn. Click to cycle the soundtrack!',
    },
    {
      id: 'meadow-sun',
      label: 'SKYLINE OVERLOOK',
      sub: 'TOGGLE GOLDEN HOUR / NOON',
      pos: new THREE.Vector3(2.2, 1.6, 0.2),
      cam: { pos: [-0.4, 1.75, 4.6], target: [0.5, 1.2, -1.0], fov: 44 },
      action: 'custom',
      onTrigger(world, engine) {
        goldenHour = !goldenHour;
        if (engine) {
          engine.activeMeta.look.tint = goldenHour ? [1.14, 0.94, 0.80] : [1.02, 1.01, 0.98];
        }
      },
      title: 'VOXEL SKY // DAYLIGHT GRADE',
      desc: 'Switches the Grass Field between Crisp Noon Daylight and Warm PS1 Golden Hour.',
    },
  ];

  tagPickable(bench, { type: 'hotspot', hotspot: hotspots[1] });
  tagPickable(boom, { type: 'hotspot', hotspot: hotspots[1] });

  return {
    id: 'meadow',
    scene: s,
    cast,
    hotspots,
    update(t) {
      const attr = pGeo.attributes.position;
      for (let i = 0; i < pCount; i++) {
        const y0 = 0.35 + ((i * 0.23 + t * 0.18) % 2.6);
        attr.setY(i, y0);
        attr.setX(i, attr.getX(i) + Math.sin(t * 1.2 + i) * 0.002);
      }
      attr.needsUpdate = true;
      Object.values(cast).forEach((c, i) => c.update(t, i));
    },
  };
}

// ============================================================================
// 5. SPATIAL DIORAMA ISLAND (LOGARTIS-STYLE INTERCONNECTED WORLD MAP)
// ============================================================================
function buildIslandWorld() {
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x070912);
  s.fog = new THREE.FogExp2(0x070912, 0.025);
  lights(s, { hemiSky: 0xb8c8ff, hemiGround: 0x2a2438, hemi: 1.1, sun: 0xffe6c8, sunI: 1.5, sunPos: [8, 16, 10], area: 18 });
  s.add(skyDome('#05070f', '#0e1328', '#1a1428', 180));
  s.add(stars(420, 150));

  const hubGroup = new THREE.Group();
  s.add(hubGroup);

  const gridTex = ptex('island_grid', 64, 64, (g, w, h) => {
    g.fillStyle = '#090c18'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(139,92,246,0.28)'; g.lineWidth = 2;
    g.strokeRect(0, 0, w, h);
  });
  gridTex.wrapS = gridTex.wrapT = THREE.RepeatWrapping;
  gridTex.repeat.set(36, 36);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), basic({ map: gridTex }));
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -1.2;
  s.add(sea);

  // Center Hub Platform
  place(hubGroup, cyl(3.1, 2.4, 0.65, 8, cmat('#252a3f')), 0, -0.32, 0);
  place(hubGroup, cyl(2.85, 2.85, 0.1, 8, cmat('#38405f')), 0, 0.02, 0);

  // 3D PUBLIC DOOM Monolith Emblem above center
  const logoGroup = new THREE.Group();
  const pdSign = neon('PUBLIC DOOM', '#ff3b30', { size: [3.2, 0.72], k: 2.8 });
  pdSign.position.set(0, 2.65, -0.9);
  logoGroup.add(pdSign);
  const subSign = neon('P(●) // 4 INTERACTIVE WORLDS', '#ffd43b', { size: [2.4, 0.42], k: 2.4 });
  subSign.position.set(0, 2.05, -0.9);
  logoGroup.add(subSign);
  hubGroup.add(logoGroup);

  const sectors = [
    {
      targetWorld: 'studio',
      label: '01 // THE STUDIO',
      sub: 'PUBLIC DOOM HQ',
      pos: [-4.4, 0.15, -2.2],
      col: '#8b5cf6',
      buildMini(g) {
        place(g, box(2.2, 1.35, 0.14, cmat('#25293a')), 0, 0.68, -0.85);
        place(g, neon('THE STUDIO', '#a6d7e6', { size: [1.6, 0.38], k: 2.5 }), 0, 1.05, -0.72);
        place(g, box(1.3, 0.45, 0.6, cmat('#3e2d20')), 0, 0.22, 0);
      },
    },
    {
      targetWorld: 'playground',
      label: '02 // PLAYGROUND',
      sub: 'TIDAK MAU WALL',
      pos: [4.4, 0.15, -2.2],
      col: '#ff3b30',
      buildMini(g) {
        place(g, box(2.2, 1.25, 0.16, cmat('#565864')), 0, 0.62, -0.8);
        place(g, neon('TIDAK MAU', '#ff3b30', { size: [1.6, 0.38], k: 2.5 }), 0, 0.95, -0.7);
        place(g, box(0.95, 0.14, 0.95, cmat('#d7b377')), -0.35, 0.08, 0.2);
      },
    },
    {
      targetWorld: 'diner',
      label: "03 // HOMER'S DINER",
      sub: 'FAV 24H RESTAURANT',
      pos: [-4.2, 0.15, 2.5],
      col: '#ff9f1c',
      buildMini(g) {
        place(g, box(2.2, 1.3, 0.16, cmat('#4a2d24')), 0, 0.65, -0.8);
        place(g, neon("HOMER'S 24H", '#ffd43b', { size: [1.6, 0.38], k: 2.5 }), 0, 1.0, -0.7);
        place(g, box(1.6, 0.5, 0.5, cmat('#c8242c')), 0, 0.25, 0.05);
      },
    },
    {
      targetWorld: 'meadow',
      label: '04 // GRASS FIELD',
      sub: 'VOXEL MEADOW',
      pos: [4.2, 0.15, 2.5],
      col: '#38d399',
      buildMini(g) {
        place(g, box(2.1, 0.22, 2.1, cmat('#4ead5b')), 0, 0.11, 0);
        place(g, tree(101, 0.48, true), -0.65, 0.2, -0.45);
        place(g, tree(202, 0.42, true), 0.68, 0.2, -0.35);
      },
    },
  ];

  const sectorMeshes = [];
  const hotspots = [];

  for (const sec of sectors) {
    const [sx, sy, sz] = sec.pos;
    const island = new THREE.Group();
    island.position.set(sx, sy, sz);
    island.lookAt(0, sy, 0);
    island.rotation.x = 0; island.rotation.z = 0;

    place(island, cyl(1.85, 1.35, 0.55, 8, cmat('#252b42')), 0, -0.28, 0);
    place(island, cyl(1.75, 1.75, 0.08, 8, cmat('#353d5c')), 0, 0.02, 0);
    const ring = place(island, cyl(1.82, 1.82, 0.04, 8, basic({ color: sec.col })), 0, 0.04, 0);
    sec.buildMini(island);

    const dist = Math.hypot(sx, sz);
    const bridge = box(0.32, 0.06, dist - 2.6, basic({ color: sec.col }));
    bridge.position.set(sx * 0.5, -0.02, sz * 0.5);
    bridge.lookAt(sx, -0.02, sz);
    s.add(bridge);

    const hs = {
      id: 'enter-' + sec.targetWorld,
      label: sec.label,
      sub: 'ENTER WORLD →',
      pos: new THREE.Vector3(sx, sy + 1.65, sz),
      action: 'world',
      targetWorld: sec.targetWorld,
      title: sec.label,
      desc: `Click to fly camera into ${sec.label} (${sec.sub}).`,
    };
    hotspots.push(hs);
    tagPickable(island, { type: 'world-portal', targetWorld: sec.targetWorld, hotspot: hs });
    s.add(island);
    sectorMeshes.push({ island, baseY: sy, ring });
  }

  const cast = {
    JAX: createCastEntry('island', 'JAX', { x: -1.15, y: 0.06, z: 0.45, ry: 0.28, pose: 'wave' }),
    TOPENG: createCastEntry('island', 'TOPENG', { x: -0.38, y: 0.06, z: 0.25, ry: 0.12, pose: 'cross' }),
    AYESHA: createCastEntry('island', 'AYESHA', { x: 0.42, y: 0.06, z: 0.28, ry: -0.15, pose: 'hip' }),
    ATHENA: createCastEntry('island', 'ATHENA', { x: 1.18, y: 0.06, z: 0.48, ry: -0.32, pose: 'cheer' }),
  };
  Object.values(cast).forEach(c => s.add(c.holder));

  return {
    id: 'island',
    scene: s,
    cast,
    hotspots,
    update(t) {
      logoGroup.position.y = Math.sin(t * 1.6) * 0.12;
      logoGroup.rotation.y = Math.sin(t * 0.55) * 0.14;
      sectorMeshes.forEach((m, idx) => {
        m.island.position.y = m.baseY + Math.sin(t * 1.5 + idx * 1.4) * 0.09;
      });
      Object.values(cast).forEach((c, i) => c.update(t, i));
    },
  };
}

export function createAllWorlds() {
  const ctx = { cache: new Map() };
  return {
    studio: buildStudioWorld(ctx),
    playground: buildPlaygroundWorld(ctx),
    diner: buildDinerWorld(ctx),
    meadow: buildMeadowWorld(ctx),
    island: buildIslandWorld(ctx),
  };
}

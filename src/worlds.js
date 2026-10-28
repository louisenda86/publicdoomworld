// Interactive 3D Worlds for PUBLIC DOOM:
// 1. studio     — Public Doom HQ (Their Studio)
// 2. playground — Night/Dusk Concrete Park (Their Playground)
// 3. diner      — Homer's 24H Diner (Their Fav Restaurant)
// 4. meadow     — Voxel Grass Field (Grass Field)
// 5. gym        — MEJALS GYM (Fitness & Iron Bunker)
// 6. chess      — Chess Room (Play Chess vs Crew — Beginner Skill)
// 7. spa        — Bathroom & Jacuzzi (Steaming Cyber Jacuzzi)
// 8. jam        — Jamming Room (Play Synth, Drum, Guitar, Bass, Piano)
// 9. tunnel     — Boring Tunnel // CAPSULE CORP. Hyperloop Hub
// 0. island     — 3D Atlas Map connecting all sectors

import * as THREE from 'three';
import { box, cyl, lam, basic, cmat } from './world/kit.js';
import { ptex } from './world/tex.js';
import { skyDome, stars, lights, tree } from './world/env.js';
import { Character, POSE, idle, merge, walk } from './world/char.js';
import { mediaStudio, homersDiner, drawMenu, neon } from './world/sets5.js';
import { playground, meadow } from './world/sets.js';
import * as P from './world/props.js';
import * as P2 from './world/props2.js';
import * as R3 from './world/props3.js';
import {
  buildCapsulePod,
  buildGymWorld,
  buildChessWorld,
  buildSpaWorld,
  buildJamWorld,
  buildTunnelWorld,
} from './rooms_extra.js';

function place(parent, obj, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  obj.position.set(x, y, z);
  obj.rotation.set(rx, ry, rz);
  parent.add(obj);
  return obj;
}

// ============================================================================
// 5 ATTIRES FOR MALE & 5 ATTIRES FOR FEMALE
// ============================================================================
export const MALE_ATTIRES = [
  {
    id: 'm_attire_1',
    label: '01 · SIGNATURE CREW / STROKES',
    getOverrides(charId) {
      if (charId === 'TOPENG') {
        return { top: { col: '#ff8fbf', kind: 'tee', print: 'strokes_blue' }, legs: { col: '#3f3526', kind: 'cargo' }, shoes: { col: '#201b17', sole: '#111', kind: 'boot' } };
      }
      return { top: { col: '#f3eee2', kind: 'uniform', trim: '#c8242c', apron: '#17171a', tag: 'JAX' }, legs: { col: '#1c1c21', kind: 'jeans' }, shoes: { col: '#141416', sole: '#2b2b30', kind: 'sneaker' } };
    },
  },
  {
    id: 'm_attire_2',
    label: '02 · LEATHER MOTO JACKET',
    getOverrides() {
      return { top: { col: '#141418', kind: 'jensen', tee: '#141418' }, legs: { col: '#1c1c21', kind: 'jeans' }, shoes: { col: '#141416', sole: '#f2eee6', kind: 'sneaker' } };
    },
  },
  {
    id: 'm_attire_3',
    label: '03 · MEJALS GYM PUMP TANK',
    getOverrides() {
      return { top: { col: '#ece6dc', kind: 'tank' }, legs: { col: '#202430', kind: 'cargo' }, shoes: { col: '#ef4444', sole: '#ffffff', kind: 'sneaker' } };
    },
  },
  {
    id: 'm_attire_4',
    label: '04 · MARS CYBER WINDBREAKER',
    getOverrides() {
      return { top: { col: '#2747c9', kind: 'windbreaker', inner: '#0f172a' }, legs: { col: '#18181f', kind: 'jeans' }, shoes: { col: '#ffffff', sole: '#38bdf8', kind: 'sneaker' } };
    },
  },
  {
    id: 'm_attire_5',
    label: '05 · CAPSULE CORP EXEC SUIT',
    getOverrides() {
      return { top: { col: '#1e222d', kind: 'jacket', inner: '#f8fafc', tie: '#ff3b30' }, legs: { col: '#1e222d', kind: 'jeans' }, shoes: { col: '#111115', sole: '#111115', kind: 'boot' } };
    },
  },
];

export const FEMALE_ATTIRES = [
  {
    id: 'f_attire_1',
    label: '01 · SIGNATURE ATHLETIC SET',
    getOverrides(charId) {
      if (charId === 'ATHENA') {
        return { top: { col: '#ffd43b', kind: 'sportsbra', trim: '#ff63b0' }, legs: { col: '#ff63b0', kind: 'bike', sock: '#ffffff', sockBand: '#ffd43b' }, shoes: { col: '#ffffff', sole: '#ff63b0', kind: 'sneaker' } };
      }
      return { top: { col: '#141218', kind: 'sportsbra', trim: '#8b5cf6' }, legs: { col: '#211b2d', kind: 'leggings', stripe: '#8b5cf6' }, shoes: { col: '#f1eff5', sole: '#141218', kind: 'sneaker' } };
    },
  },
  {
    id: 'f_attire_2',
    label: '02 · STAGE JACKET & PLEATED SKIRT',
    getOverrides(charId) {
      if (charId === 'ATHENA') {
        return { top: { col: '#f7f4ec', kind: 'jacket', inner: '#ffd43b' }, legs: { col: '#f6d2b2', kind: 'skirt', skirt: '#f7f4ec', hem: '#f59e0b', sock: '#ffffff', sockBand: '#ff63b0' }, shoes: { col: '#ffffff', sole: '#ff63b0', kind: 'sneaker' } };
      }
      return { top: { col: '#141218', kind: 'jacket', inner: '#8b5cf6' }, legs: { col: '#181422', kind: 'skirt', skirt: '#6d3fe0', hem: '#c4b5fd', boot: '#141218' }, shoes: { col: '#141218', sole: '#8b5cf6', kind: 'boot' } };
    },
  },
  {
    id: 'f_attire_3',
    label: '03 · MEJALS GYM PRO SET',
    getOverrides() {
      return { top: { col: '#ef4444', kind: 'sportsbra', trim: '#ffffff' }, legs: { col: '#18181b', kind: 'leggings', stripe: '#ef4444' }, shoes: { col: '#ffffff', sole: '#ef4444', kind: 'sneaker' } };
    },
  },
  {
    id: 'f_attire_4',
    label: "04 · HOMER'S DINER SHIFT CREW",
    getOverrides(charId) {
      return { top: { col: '#f3eee2', kind: 'uniform', trim: '#c8242c', apron: '#17171a', tag: charId }, legs: { col: '#1c1c21', kind: 'skirt', skirt: '#c8242c', hem: '#f3eee2' }, shoes: { col: '#141416', sole: '#f3eee2', kind: 'sneaker' } };
    },
  },
  {
    id: 'f_attire_5',
    label: '05 · MARS AUSTIN CYBER HOODIE',
    getOverrides() {
      return { top: { col: '#3b0764', kind: 'hoodie' }, legs: { col: '#1e1b4b', kind: 'jeans' }, shoes: { col: '#f8fafc', sole: '#a855f7', kind: 'sneaker' } };
    },
  },
];

// ============================================================================
// 5 ACCESSORIES (FOR BOTH MALE & FEMALE)
// ============================================================================
export const ACCESSORIES_LIST = [
  { id: 'acc_none', label: '00 · DEFAULT / NONE', overrides: { headphones: false, shades: false, visor: null, laurel: null, mic: false } },
  { id: 'acc_1', label: '01 · STUDIO HEADPHONES', overrides: { headphones: '#ff3b30', shades: false, visor: null, laurel: null, mic: false } },
  { id: 'acc_2', label: '02 · CYBER SHADES VISOR', overrides: { headphones: false, shades: '#00f0ff', visor: null, laurel: null, mic: false } },
  { id: 'acc_3', label: "03 · HOMER'S RED VISOR", overrides: { headphones: false, shades: false, visor: { col: '#c8242c', logo: '#f3eee2' }, laurel: null, mic: false } },
  { id: 'acc_4', label: '04 · GOLDEN LAUREL CROWN', overrides: { headphones: false, shades: false, visor: null, laurel: '#ffd43b', mic: false } },
  { id: 'acc_5', label: '05 · BROADCAST HEADSET MIC', overrides: { headphones: '#8b5cf6', shades: false, visor: null, laurel: null, mic: true } },
];

// ============================================================================
// 5 HAIRSTYLES FOR FEMALE (AYESHA & ATHENA)
// ============================================================================
export const FEMALE_HAIRSTYLES = [
  { id: 'pony', label: '01 · HIGH PONYTAIL' },
  { id: 'twin', label: '02 · TWIN-TAILS' },
  { id: 'buns', label: '03 · SPACE TWIN-BUNS' },
  { id: 'long', label: '04 · LONG FLOWING' },
  { id: 'bob',  label: '05 · CYBER BOB CUT' },
];

// ============================================================================
// 10 LINGERIE / LOUNGE COLLECTION FOR FEMALE (PASSWORD PROTECTED: 5539)
// ============================================================================
export const FEMALE_LINGERIE_COLLECTION = [
  {
    id: 'ling_01',
    label: '01 · CRIMSON VELVET SET',
    overrides: { top: { col: '#be123c', kind: 'sportsbra', trim: '#fecdd3' }, legs: { col: '#be123c', kind: 'bike', sock: '#fff1f2', sockBand: '#be123c' }, shoes: { col: '#be123c', sole: '#fff1f2', kind: 'sneaker' } },
  },
  {
    id: 'ling_02',
    label: '02 · MIDNIGHT LACE CAMISOLE',
    overrides: { top: { col: '#0f0e17', kind: 'sportsbra', trim: '#f472b6' }, legs: { col: '#0f0e17', kind: 'bike', sock: '#18181b', sockBand: '#f472b6' }, shoes: { col: '#18181b', sole: '#f472b6', kind: 'sneaker' } },
  },
  {
    id: 'ling_03',
    label: '03 · VIOLET SILK BOUDOIR',
    overrides: { top: { col: '#6d28d9', kind: 'sportsbra', trim: '#e9d5ff' }, legs: { col: '#6d28d9', kind: 'bike', sock: '#f3e8ff', sockBand: '#6d28d9' }, shoes: { col: '#6d28d9', sole: '#f3e8ff', kind: 'sneaker' } },
  },
  {
    id: 'ling_04',
    label: '04 · PEARL SATIN CORSET SET',
    overrides: { top: { col: '#fffbeb', kind: 'sportsbra', trim: '#fb7185' }, legs: { col: '#fffbeb', kind: 'bike', sock: '#ffffff', sockBand: '#fb7185' }, shoes: { col: '#fffbeb', sole: '#fb7185', kind: 'sneaker' } },
  },
  {
    id: 'ling_05',
    label: '05 · ROSE QUARTZ BABYDOLL',
    overrides: { top: { col: '#f43f5e', kind: 'sportsbra', trim: '#ffe4e6' }, legs: { col: '#fb7185', kind: 'skirt', skirt: '#fb7185', hem: '#ffe4e6', sock: '#fff1f2', sockBand: '#f43f5e' }, shoes: { col: '#ffe4e6', sole: '#f43f5e', kind: 'sneaker' } },
  },
  {
    id: 'ling_06',
    label: '06 · CYBER NEON MESH SET',
    overrides: { top: { col: '#090d16', kind: 'sportsbra', trim: '#00f0ff' }, legs: { col: '#090d16', kind: 'bike', sock: '#090d16', sockBand: '#00f0ff' }, shoes: { col: '#090d16', sole: '#00f0ff', kind: 'sneaker' } },
  },
  {
    id: 'ling_07',
    label: '07 · GOLDEN HOUR SILK SET',
    overrides: { top: { col: '#f59e0b', kind: 'sportsbra', trim: '#fef08a' }, legs: { col: '#f59e0b', kind: 'bike', sock: '#fefce8', sockBand: '#f59e0b' }, shoes: { col: '#fef08a', sole: '#b45309', kind: 'sneaker' } },
  },
  {
    id: 'ling_08',
    label: '08 · EMERALD SATIN SLIP',
    overrides: { top: { col: '#059669', kind: 'sportsbra', trim: '#a7f3d0' }, legs: { col: '#059669', kind: 'skirt', skirt: '#059669', hem: '#a7f3d0', sock: '#ecfdf5', sockBand: '#059669' }, shoes: { col: '#059669', sole: '#ecfdf5', kind: 'sneaker' } },
  },
  {
    id: 'ling_09',
    label: '09 · LAVENDER RIBBED LOUNGE',
    overrides: { top: { col: '#a855f7', kind: 'sportsbra', trim: '#faf5ff' }, legs: { col: '#a855f7', kind: 'bike', sock: '#faf5ff', sockBand: '#a855f7' }, shoes: { col: '#faf5ff', sole: '#a855f7', kind: 'sneaker' } },
  },
  {
    id: 'ling_10',
    label: '10 · STARLIGHT SILVER ARCHIVE',
    overrides: { top: { col: '#cbd5e1', kind: 'sportsbra', trim: '#38bdf8' }, legs: { col: '#cbd5e1', kind: 'bike', sock: '#f8fafc', sockBand: '#38bdf8' }, shoes: { col: '#f8fafc', sole: '#38bdf8', kind: 'sneaker' } },
  },
];

// ============================================================================
// CHARACTER PROFILES & FULL CREW LORE
// ============================================================================
export const CHARACTER_DATA = {
  JAX: {
    id: 'JAX',
    name: 'JAX',
    gender: 'male',
    age: '17',
    origin: 'Mars, City of Austin',
    highSchool: 'Reed High School',
    college: 'MIT Dropout',
    formerJobs: 'OpenAI Ex-Employee · Anthropic Ex-Employee · SpaceXSI Ex-Employee',
    family: 'No family — only the four of them',
    role: 'MAIN HOST // WRITER // DINER SHIFT LEAD',
    tag: 'MAIN CHARACTER // P(●) 01 · AGE 17',
    accent: '#ff3b30',
    outfits: [
      { key: 'JAX', label: "HOMER'S CREW UNIFORM" },
      { key: 'JAX_STREET', label: 'LEATHER JACKET + STROKES TEE' },
    ],
    bio: 'Age 17. Born in Mars, City of Austin. Attended Reed High School, dropped out of MIT, and worked at OpenAI, Anthropic, and SpaceXSI before walking away to found PUBLIC DOOM. Has no family—only Topeng, Ayesha, and Athena.',
    stats: { AGE: '17', ORIGIN: 'MARS_AUSTIN', SCHOOL: 'REED_HS / MIT', EX_CORP: 'OAI·ANT·SPX' },
    quotes: [
      '"We grew up in Mars, City of Austin, went to Reed High, dropped out of MIT, and left OpenAI, Anthropic, and SpaceXSI behind."',
      '"We have no family—it\'s just the four of us in this bunker and down the Boring Tunnel."',
      '"Every algorithm wants a smooth surface. We\'re bringing back vertex jitter and 4-bit Bayer dither."',
      '"Meet me in the Chess Room or grab a Capsule Corp pod to Mejals Gym!"',
    ],
  },
  TOPENG: {
    id: 'TOPENG',
    name: 'TOPENG',
    gender: 'male',
    age: '18.5',
    origin: 'Mars, City of Austin',
    highSchool: 'Reed High School',
    college: 'MIT Dropout',
    formerJobs: 'OpenAI Ex-Employee · Anthropic Ex-Employee · SpaceXSI Ex-Employee',
    family: 'No family — only the four of them',
    role: 'HEAD OF RESEARCH // GRAFFITI & BUNKER OPS',
    tag: 'TOPENG LABS // P(●) 02 · AGE 18.5',
    accent: '#ff7eb6',
    outfits: [
      { key: 'TOPENG', label: 'PINK STROKES TEE + BALACLAVA' },
      { key: 'TOPENG_TANK', label: 'RIBBED TANK + CARGO OPS' },
    ],
    bio: 'Age 18.5. Raised in Mars, City of Austin alongside Jax, Ayesha, and Athena. Reed High School alum, MIT dropout, and former researcher at OpenAI, Anthropic, and SpaceXSI. Has no family except this crew.',
    stats: { AGE: '18.5', ORIGIN: 'MARS_AUSTIN', SCHOOL: 'REED_HS / MIT', EX_CORP: 'OAI·ANT·SPX' },
    quotes: [
      '"TIDAK MAU. I saw the weights inside OpenAI, Anthropic, and SpaceXSI and chose the red balaclava instead."',
      '"No family, no safety net—just the four of us from Reed High School in Mars, City of Austin."',
      '"I bored a Capsule Corp tunnel connecting our Studio, Mejals Gym, the Jacuzzi, and the Jamming Room."',
      '"If Homer\'s stops serving the Cyclops Egg at 3 AM, we riot at the playground."',
    ],
  },
  AYESHA: {
    id: 'AYESHA',
    name: 'AYESHA',
    gender: 'female',
    age: '18',
    origin: 'Mars, City of Austin',
    highSchool: 'Reed High School',
    college: 'MIT Dropout',
    formerJobs: 'OpenAI Ex-Employee · Anthropic Ex-Employee · SpaceXSI Ex-Employee',
    family: 'No family — only the four of them',
    role: 'CREATIVE DIRECTOR // VISUAL ARCHIVIST',
    tag: 'ART & CAMERA // P(●) 03 · AGE 18',
    accent: '#9b6bff',
    outfits: [
      { key: 'AYESHA', label: 'VIOLET ATHLETIC SET' },
      { key: 'AYESHA_STAGE', label: 'CROPPED MOTO + PLEATED SKIRT' },
    ],
    bio: 'Age 18. From Mars, City of Austin. Reed High School graduate, MIT dropout, and ex-OpenAI, ex-Anthropic, and ex-SpaceXSI engineer turned visual director of PUBLIC DOOM. Has no family—only the crew.',
    stats: { AGE: '18', ORIGIN: 'MARS_AUSTIN', SCHOOL: 'REED_HS / MIT', EX_CORP: 'OAI·ANT·SPX' },
    quotes: [
      '"From Reed High in Mars Austin to dropping out of MIT—we traded frontier labs for 240p truth."',
      '"We don\'t have family out there. Jax, Topeng, Athena, and I are all we\'ve got."',
      '"Try out my 5 hairstyles and attires, or challenge me in the Chess Room!"',
      '"After Mejals Gym, Athena and I are heading straight to the Cyber Jacuzzi via Capsule Corp."',
    ],
  },
  ATHENA: {
    id: 'ATHENA',
    name: 'ATHENA',
    gender: 'female',
    age: '17.5',
    origin: 'Mars, City of Austin',
    highSchool: 'Reed High School',
    college: 'MIT Dropout',
    formerJobs: 'OpenAI Ex-Employee · Anthropic Ex-Employee · SpaceXSI Ex-Employee',
    family: 'No family — only the four of them',
    role: 'SOUND DESIGNER // SYNTH & LORE KEEPER',
    tag: 'SYNTH & MYTH // P(●) 04 · AGE 17.5',
    accent: '#ffd43b',
    outfits: [
      { key: 'ATHENA', label: 'SUNNY YELLOW + PINK SHORTS' },
      { key: 'ATHENA_STAGE', label: 'GOLD/WHITE PLEATED STAGE SET' },
    ],
    bio: 'Age 17.5. Born in Mars, City of Austin. Reed High School prodigy, MIT dropout, and ex-OpenAI, ex-Anthropic, and ex-SpaceXSI audio/systems architect. Has no family—only Jax, Topeng, and Ayesha.',
    stats: { AGE: '17.5', ORIGIN: 'MARS_AUSTIN', SCHOOL: 'REED_HS / MIT', EX_CORP: 'OAI·ANT·SPX' },
    quotes: [
      '"Age 17.5, Mars City of Austin! Reed High, MIT dropout, ex-OpenAI, ex-Anthropic, ex-SpaceXSI!"',
      '"We have no family anywhere else—the four of us built our own world down here!"',
      '"Come to the Jamming Room! You can play the Synth, Drums, Guitar, Bass, and Piano with us!"',
      '"Hop in the Capsule Corp pod and let\'s ride the Boring Tunnel!"',
    ],
  },
};

export const WORLD_ORDER = [
  'studio',
  'playground',
  'diner',
  'meadow',
  'gym',
  'chess',
  'spa',
  'jam',
  'tunnel',
  'island',
];

export const WORLD_META = {
  studio: {
    id: 'studio',
    index: '01',
    title: 'PUBLIC DOOM STUDIO',
    subtitle: 'HQ // BROADCAST & EDITING BUNKER',
    location: 'SECTOR 01 · MARS CITY OF AUSTIN',
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
    description: 'The crew\'s late-night concrete hangout under a flickering sodium streetlamp. Features Topeng\'s signature red "TIDAK MAU" graffiti wall, the sandbox, and Capsule Corp link.',
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
  gym: {
    id: 'gym',
    index: '05',
    title: 'MEJALS GYM',
    subtitle: 'IRON BUNKER // BENCH, TREADMILLS & HEAVY BAG',
    location: 'SECTOR 05 · BORING TUNNEL NORTH',
    bgm: 'playground-retro',
    bgmTitle: '05 · MEJALS IRON PUMP (CH.RETRO // SCORE_D)',
    description: 'The crew\'s private fitness bunker connected via the Boring Tunnel. Equipped with a 225-lb bench press, dumbbell rack, motorized treadmills, heavy boxing bag, and wall mirrors.',
    defaultCam: { pos: [0.0, 1.68, 3.1], target: [0.0, 1.1, -0.8], fov: 48 },
    look: {
      clear: 0x090b12, exposure: 1.16, contrast: 1.1, sat: 1.1, bloom: 0.38, bloomThresh: 0.85,
      vignette: 0.28, grain: 0.024, dither: 0.65, ps1: 2, affine: 0.65, snap: 1, scan: 0.14, barrel: 0.05,
      tint: [1.04, 0.99, 1.02], lift: [0.015, 0.01, 0.02],
    },
    views: [
      { id: 'overview', label: 'GYM FLOOR', pos: [0.0, 1.68, 3.1], target: [0.0, 1.1, -0.8], fov: 48 },
      { id: 'bench', label: 'BENCH & WEIGHTS', pos: [-0.8, 1.52, 1.1], target: [-1.8, 0.95, -1.4], fov: 42 },
      { id: 'bag', label: 'HEAVY BAG & POD', pos: [0.9, 1.58, 1.2], target: [2.1, 1.1, -1.6], fov: 42 },
    ],
  },
  chess: {
    id: 'chess',
    index: '06',
    title: 'THE CHESS ROOM',
    subtitle: 'PLAY CHESS VS CREW // BEGINNER SKILL CLUB',
    location: 'SECTOR 06 · GRANDMASTER LOUNGE',
    bgm: 'studio-lofi',
    bgmTitle: '06 · ENDGAME STUDY (CH.LOFI // SCORE_D)',
    description: 'Wood-paneled chess sanctuary along the Boring Tunnel. Click the Chess Table or HUD button to play a live game of Chess against Jax, Topeng, Ayesha, or Athena!',
    defaultCam: { pos: [0.0, 1.72, 2.75], target: [0.0, 1.0, -0.25], fov: 46 },
    look: {
      clear: 0x0c0a12, exposure: 1.15, contrast: 1.08, sat: 1.08, bloom: 0.36, bloomThresh: 0.86,
      vignette: 0.28, grain: 0.022, dither: 0.65, ps1: 2, affine: 0.65, snap: 1, scan: 0.14, barrel: 0.05,
      tint: [1.05, 1.0, 0.94], lift: [0.02, 0.015, 0.01],
    },
    views: [
      { id: 'overview', label: 'CHESS LOUNGE', pos: [0.0, 1.72, 2.75], target: [0.0, 1.0, -0.25], fov: 46 },
      { id: 'board', label: 'BOARD CLOSEUP', pos: [0.0, 1.62, 1.35], target: [0.0, 0.78, -0.15], fov: 38 },
    ],
  },
  spa: {
    id: 'spa',
    index: '07',
    title: 'BATHROOM & JACUZZI',
    subtitle: '104°F CYBER JACUZZI // STYLING VANITY',
    location: 'SECTOR 07 · HYDRO-THERMAL SUITE',
    bgm: 'diner-warm',
    bgmTitle: '07 · STEAM & NEON JETS (CH.WARM // SCORE_D)',
    description: 'Tiled cyber-bathhouse featuring a steaming 104°F mineral Jacuzzi with chromotherapy LED jets and a full styling vanity mirror for changing attires and hairstyles.',
    defaultCam: { pos: [0.0, 1.72, 2.95], target: [0.0, 1.0, -0.45], fov: 48 },
    look: {
      clear: 0x07111a, exposure: 1.15, contrast: 1.06, sat: 1.14, bloom: 0.42, bloomThresh: 0.84,
      vignette: 0.26, grain: 0.02, dither: 0.65, ps1: 2, affine: 0.65, snap: 1, scan: 0.14, barrel: 0.05,
      tint: [0.95, 1.03, 1.08], lift: [0.01, 0.02, 0.03],
    },
    views: [
      { id: 'overview', label: 'JACUZZI WIDE', pos: [0.0, 1.72, 2.95], target: [0.0, 1.0, -0.45], fov: 48 },
      { id: 'pool', label: 'HOT TUB JETS', pos: [0.4, 1.55, 1.65], target: [0.0, 0.65, -0.45], fov: 40 },
      { id: 'vanity', label: 'STYLING VANITY', pos: [-0.8, 1.5, 0.4], target: [-2.5, 1.2, -1.2], fov: 40 },
    ],
  },
  jam: {
    id: 'jam',
    index: '08',
    title: 'THE JAMMING ROOM',
    subtitle: 'PLAY LIVE // SYNTH · DRUMS · GUITAR · BASS · PIANO',
    location: 'SECTOR 08 · SOUNDPROOF STAGE',
    bgm: 'video-ost-cut',
    bgmTitle: '08 · JAM SESSION MASTER (CH.OST // SCORE_D)',
    description: 'Acoustic-treated band rehearsal studio. Click any instrument or open the Jamming Deck to play the Synthesizer, Drum Kit, Electric Guitar, Bass, and Studio Piano live!',
    defaultCam: { pos: [0.0, 1.72, 3.1], target: [0.0, 1.05, -0.8], fov: 48 },
    look: {
      clear: 0x0b0814, exposure: 1.16, contrast: 1.08, sat: 1.12, bloom: 0.4, bloomThresh: 0.85,
      vignette: 0.28, grain: 0.022, dither: 0.65, ps1: 2, affine: 0.65, snap: 1, scan: 0.14, barrel: 0.05,
      tint: [1.03, 0.98, 1.06], lift: [0.02, 0.01, 0.03],
    },
    views: [
      { id: 'overview', label: 'STAGE WIDE', pos: [0.0, 1.72, 3.1], target: [0.0, 1.05, -0.8], fov: 48 },
      { id: 'drums', label: 'DRUM RISER', pos: [0.0, 1.55, 1.1], target: [0.0, 0.95, -1.55], fov: 40 },
      { id: 'synth', label: 'SYNTH & PIANO', pos: [0.6, 1.52, 1.8], target: [1.8, 0.95, -0.3], fov: 42 },
    ],
  },
  tunnel: {
    id: 'tunnel',
    index: '09',
    title: 'BORING TUNNEL',
    subtitle: 'CAPSULE CORP. TRANSIT // ALL ROOMS CONNECTED',
    location: 'SECTOR 09 · MARS–AUSTIN HYPERLOOP',
    bgm: 'video-bgm-extract',
    bgmTitle: '09 · HYPERLOOP TRANSIT (ORIGINAL VIDEO BGM)',
    description: 'Subterranean Boring Tunnel linking every Public Doom room via high-speed CAPSULE CORP. pods. Click the Capsule Pod to warp to any sector!',
    defaultCam: { pos: [0.0, 1.78, 3.6], target: [0.0, 1.15, -1.5], fov: 48 },
    look: {
      clear: 0x05070e, exposure: 1.16, contrast: 1.1, sat: 1.1, bloom: 0.42, bloomThresh: 0.84,
      vignette: 0.3, grain: 0.024, dither: 0.65, ps1: 2, affine: 0.65, snap: 1, scan: 0.15, barrel: 0.05,
      tint: [0.96, 1.02, 1.08], lift: [0.01, 0.018, 0.03],
    },
    views: [
      { id: 'overview', label: 'TUNNEL PLATFORM', pos: [0.0, 1.78, 3.6], target: [0.0, 1.15, -1.5], fov: 48 },
      { id: 'pod', label: 'CAPSULE POD CC-01', pos: [1.2, 1.45, 1.8], target: [0.0, 0.95, -1.2], fov: 40 },
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
    description: 'Spatial diorama overview of the Public Doom universe connected by the Boring Tunnel & Capsule Corp. Click any sector beacon or cast member to dive in.',
    defaultCam: { pos: [0.0, 5.8, 10.6], target: [0.0, 0.9, 0.0], fov: 45 },
    look: {
      clear: 0x070912, exposure: 1.14, contrast: 1.08, sat: 1.1, bloom: 0.42, bloomThresh: 0.82,
      vignette: 0.30, grain: 0.022, dither: 0.65, ps1: 2, affine: 0.65, snap: 1, scan: 0.14, barrel: 0.05,
      tint: [1.0, 1.0, 1.04], lift: [0.015, 0.018, 0.03],
    },
    views: [
      { id: 'overview', label: 'ORBITAL MAP', pos: [0.0, 5.8, 10.6], target: [0.0, 0.9, 0.0], fov: 45 },
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

// ============================================================================
// CHARACTER INSTANCE CONTROLLER (OUTFITS, ACCESSORIES, HAIRSTYLES, WALKING)
// ============================================================================
function createCastEntry(worldKey, charId, { x = 0, y = 0, z = 0, ry = 0, pose = 'stand' }) {
  const holder = new THREE.Group();
  holder.position.set(x, y, z);
  holder.rotation.y = ry;

  const meta = CHARACTER_DATA[charId];
  const isFemale = meta.gender === 'female';
  const attireList = isFemale ? FEMALE_ATTIRES : MALE_ATTIRES;

  let currentAttireId = attireList[0].id;
  let currentAccessoryId = 'acc_none';
  let currentHairstyleId = charId === 'ATHENA' ? 'twin' : charId === 'AYESHA' ? 'pony' : (charId === 'JAX' ? 'mullet' : 'none');
  let customLabel = meta.outfits[0].label;
  let activeOverrides = {};

  function rebuildCharacter() {
    while (holder.children.length) holder.remove(holder.children[0]);

    // Merge attire + accessory + hairstyle overrides
    const combined = { ...activeOverrides };
    const accObj = ACCESSORIES_LIST.find(a => a.id === currentAccessoryId);
    if (accObj && accObj.id !== 'acc_none') {
      Object.assign(combined, accObj.overrides);
    }
    if (isFemale && currentHairstyleId) {
      const baseHairCol = charId === 'ATHENA' ? '#ee9a3a' : '#1c1824';
      const baseHairHi  = charId === 'ATHENA' ? '#ffd27a' : '#4a4370';
      const baseHairTie = charId === 'ATHENA' ? '#ff63b0' : '#8b5cf6';
      combined.hair = { style: currentHairstyleId, col: baseHairCol, hi: baseHairHi, tie: baseHairTie };
    }

    const ch = new Character(charId, combined);
    holder.add(ch.root);
    tagPickable(holder, {
      type: 'character',
      id: charId,
      world: worldKey,
    });
    return ch;
  }

  let ch = rebuildCharacter();
  let customPose = pose;
  let customExpr = 'neutral';
  let waveUntil = 0;

  // Game-like walking state (WASD / Arrows / Click-to-Walk)
  let walkPhase = 0;
  let walkTimer = 0;
  let waypoint = null;

  return {
    id: charId,
    meta,
    holder,
    get char() { return ch; },
    get outfitLabel() { return customLabel; },
    get attireId() { return currentAttireId; },
    get accessoryId() { return currentAccessoryId; },
    get hairstyleId() { return currentHairstyleId; },

    cycleOutfit() {
      const idx = attireList.findIndex(a => a.id === currentAttireId);
      const next = attireList[(idx + 1) % attireList.length];
      return this.setAttire(next.id);
    },

    setAttire(attireId) {
      const found = attireList.find(a => a.id === attireId) ||
        FEMALE_LINGERIE_COLLECTION.find(l => l.id === attireId);
      if (!found) return this.outfitLabel;
      currentAttireId = found.id;
      customLabel = found.label;
      activeOverrides = found.getOverrides ? found.getOverrides(charId) : { ...found.overrides };
      ch = rebuildCharacter();
      return customLabel;
    },

    setAccessory(accId) {
      const found = ACCESSORIES_LIST.find(a => a.id === accId);
      if (!found) return;
      currentAccessoryId = found.id;
      ch = rebuildCharacter();
      return found.label;
    },

    setHairstyle(styleId) {
      if (!isFemale) return;
      currentHairstyleId = styleId;
      ch = rebuildCharacter();
      const found = FEMALE_HAIRSTYLES.find(h => h.id === styleId);
      return found ? found.label : styleId;
    },

    setPose(p) { customPose = p; },
    setExpr(e) { customExpr = e; },
    triggerWave(now) { waveUntil = now + 2.4; },

    // Direct WASD / Arrow movement step
    moveStep(dx, dz, dt, bounds = { minX: -2.8, maxX: 2.8, minZ: -2.0, maxZ: 2.2 }) {
      if (Math.abs(dx) < 1e-4 && Math.abs(dz) < 1e-4) return false;
      waypoint = null;
      const speed = 2.35;
      const len = Math.hypot(dx, dz) || 1;
      const vx = (dx / len) * speed * dt;
      const vz = (dz / len) * speed * dt;
      holder.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, holder.position.x + vx));
      holder.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, holder.position.z + vz));
      const targetYaw = Math.atan2(dx, dz);
      // Smooth angle interpolation
      let diff = ((targetYaw - holder.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (diff < -Math.PI) diff += Math.PI * 2;
      holder.rotation.y += diff * Math.min(1, dt * 12);
      walkPhase += dt * 2.2;
      walkTimer = 0.18;
      return true;
    },

    // Mouse Click-to-Walk waypoint
    setWaypoint(tx, tz, bounds = { minX: -2.8, maxX: 2.8, minZ: -2.0, maxZ: 2.2 }) {
      waypoint = {
        x: Math.max(bounds.minX, Math.min(bounds.maxX, tx)),
        z: Math.max(bounds.minZ, Math.min(bounds.maxZ, tz)),
      };
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

    update(t, idx, dt = 1 / 60) {
      // Advance waypoint walking if active
      if (waypoint) {
        const dx = waypoint.x - holder.position.x;
        const dz = waypoint.z - holder.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.08) {
          waypoint = null;
        } else {
          const step = Math.min(dist, 2.2 * dt);
          holder.position.x += (dx / dist) * step;
          holder.position.z += (dz / dist) * step;
          const targetYaw = Math.atan2(dx, dz);
          let diff = ((targetYaw - holder.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
          if (diff < -Math.PI) diff += Math.PI * 2;
          holder.rotation.y += diff * Math.min(1, dt * 10);
          walkPhase += dt * 2.1;
          walkTimer = 0.15;
        }
      } else if (walkTimer > 0) {
        walkTimer = Math.max(0, walkTimer - dt);
      }

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
      const isWalkingNow = walkTimer > 0;

      const poseFn = tt => {
        if (isWalkingNow) {
          const wp = walk(walkPhase, 1.0);
          return { ...wp, ...faceSpec };
        }
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

  if (cam) { cam.position.set(-1.75, 0, 1.35); cam.rotation.y = Math.PI - 0.45; }
  if (ring) { ring.position.set(1.75, 1.35, 1.25); ring.rotation.y = Math.PI + 0.45; }

  const board = P.doomBoard();
  board.position.set(-2.15, 0, -0.35);
  board.rotation.y = Math.PI / 2 - 0.25;
  s.add(board);

  // Capsule Corp Pod linking Studio to the Boring Tunnel
  const pod = buildCapsulePod('studio', [2.15, 0, 0.85], -0.65);
  s.add(pod.group);

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
      sub: 'WATCH EPISODES 1–3',
      pos: new THREE.Vector3(0.82, 1.32, -0.42),
      cam: { pos: [0.15, 1.38, 0.95], target: [0.65, 1.05, -0.45], fov: 36 },
      action: 'episode',
      title: 'PUBLIC DOOM // EDITING WORKSTATION',
      desc: 'Click to watch Public Doom Episode 1, Episode 2, and Episode 3 directly in the broadcast monitor!',
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
    pod.hotspot,
  ];

  if (monG) tagPickable(monG, { type: 'hotspot', hotspot: hotspots[0] });
  tagPickable(board, { type: 'hotspot', hotspot: hotspots[1] });

  return {
    id: 'studio',
    scene: s,
    cast,
    hotspots,
    bounds: { minX: -2.2, maxX: 2.2, minZ: -1.5, maxZ: 1.9 },
    update(t) {
      if (mon) {
        mon.draw((g, w, h) => {
          g.fillStyle = '#0c0f18';
          g.fillRect(0, 0, w, h);
          g.fillStyle = '#ff3b30';
          g.fillRect(16, 14, w - 32, 34);
          g.fillStyle = '#fff';
          g.font = 'bold 20px monospace';
          g.fillText('P(●) NLE // YOUTUBE.COM/@PUBLICDOOM', 28, 38);
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

  const boom = place(s, P2.boombox(), -1.55, 0.28, 1.55, 0, 0.4, 0);
  const pod = buildCapsulePod('playground', [2.85, 0, 1.65], -0.55);
  s.add(pod.group);

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
    pod.hotspot,
  ];

  tagPickable(boom, { type: 'hotspot', hotspot: hotspots[1] });

  return {
    id: 'playground',
    scene: s,
    cast,
    hotspots,
    bounds: { minX: -3.2, maxX: 3.2, minZ: -3.5, maxZ: 2.8 },
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

  const b1 = place(s, R3.burger(1.1), 0.2, 1.07, -1.25);
  const m1 = place(s, R3.mug('#ff7eb6'), 0.55, 1.07, -1.2);
  place(s, R3.burger(1.0), -3.9, 0.76, -1.4);
  place(s, R3.mug('#ffd43b'), -3.65, 0.76, -1.35);
  place(s, R3.burger(1.0), -3.9, 0.76, 0.6);
  place(s, R3.mug('#9b6bff'), -3.65, 0.76, 0.65);

  const specialsGroup = new THREE.Group();
  s.add(specialsGroup);
  let specialCount = 0;

  const pod = buildCapsulePod('diner', [3.2, 0, 1.2], -0.6);
  s.add(pod.group);

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
      id: 'diner-crt',
      label: 'CORNER CRT TV',
      sub: 'WATCH PUBLIC DOOM EPISODES',
      pos: new THREE.Vector3(-3.75, 2.35, -3.2),
      cam: { pos: [-1.2, 1.75, -0.4], target: [-3.8, 2.15, -3.2], fov: 38 },
      action: 'episode',
      title: 'HIGH-MOUNTED TRINITRON // LATE NIGHT BROADCAST',
      desc: 'Bolted in the high corner of Homer\'s Diner, broadcasting Public Doom\'s Episodes 1–3 to the 3 AM crowd.',
    },
    pod.hotspot,
  ];

  tagPickable(b1, { type: 'hotspot', hotspot: hotspots[0] });
  tagPickable(m1, { type: 'hotspot', hotspot: hotspots[0] });

  return {
    id: 'diner',
    scene: s,
    cast,
    hotspots,
    bounds: { minX: -2.8, maxX: 2.8, minZ: -0.6, maxZ: 2.1 },
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
  const pod = buildCapsulePod('meadow', [2.65, 0.02, 0.85], -0.5);
  s.add(pod.group);

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
    pod.hotspot,
  ];

  tagPickable(bench, { type: 'hotspot', hotspot: hotspots[0] });
  tagPickable(boom, { type: 'hotspot', hotspot: hotspots[0] });

  return {
    id: 'meadow',
    scene: s,
    cast,
    hotspots,
    bounds: { minX: -3.4, maxX: 3.4, minZ: -1.8, maxZ: 2.8 },
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
// 00. SPATIAL DIORAMA ISLAND (ALL 9 ROOMS CONNECTED ALONG BORING TUNNEL)
// ============================================================================
function buildIslandWorld() {
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x070912);
  s.fog = new THREE.FogExp2(0x070912, 0.022);
  lights(s, { hemiSky: 0xb8c8ff, hemiGround: 0x2a2438, hemi: 1.1, sun: 0xffe6c8, sunI: 1.5, sunPos: [8, 16, 10], area: 22 });
  s.add(skyDome('#05070f', '#0e1328', '#1a1428', 180));
  s.add(stars(420, 150));

  const hubGroup = new THREE.Group();
  s.add(hubGroup);

  const gridTex = ptex('island_grid', 64, 64, (g, w, h) => {
    g.fillStyle = '#090c18'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(0,240,255,0.25)'; g.lineWidth = 2;
    g.strokeRect(0, 0, w, h);
  });
  gridTex.wrapS = gridTex.wrapT = THREE.RepeatWrapping;
  gridTex.repeat.set(36, 36);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), basic({ map: gridTex }));
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -1.2;
  s.add(sea);

  // Center Hub Platform (CAPSULE CORP. CENTRAL TERMINAL)
  place(hubGroup, cyl(3.1, 2.4, 0.65, 8, cmat('#252a3f')), 0, -0.32, 0);
  place(hubGroup, cyl(2.85, 2.85, 0.1, 8, cmat('#38405f')), 0, 0.02, 0);

  const logoGroup = new THREE.Group();
  const pdSign = neon('PUBLIC DOOM // BORING TUNNEL ATLAS', '#ff3b30', { size: [3.6, 0.65], k: 2.8 });
  pdSign.position.set(0, 2.65, -0.9);
  logoGroup.add(pdSign);
  const subSign = neon('CAPSULE CORP. // 9 INTERCONNECTED SECTORS', '#00f0ff', { size: [2.8, 0.38], k: 2.4 });
  subSign.position.set(0, 2.05, -0.9);
  logoGroup.add(subSign);
  hubGroup.add(logoGroup);

  const sectors = [
    { targetWorld: 'studio',     label: '01 // THE STUDIO',       sub: 'PUBLIC DOOM HQ',      angle: 0.0,  col: '#8b5cf6' },
    { targetWorld: 'playground', label: '02 // PLAYGROUND',       sub: 'TIDAK MAU WALL',      angle: 0.78, col: '#ff3b30' },
    { targetWorld: 'diner',      label: "03 // HOMER'S DINER",    sub: 'FAV 24H RESTAURANT',  angle: 1.57, col: '#ff9f1c' },
    { targetWorld: 'meadow',     label: '04 // GRASS FIELD',      sub: 'VOXEL MEADOW',        angle: 2.35, col: '#38d399' },
    { targetWorld: 'gym',        label: '05 // MEJALS GYM',       sub: 'IRON BUNKER',         angle: 3.14, col: '#ef4444' },
    { targetWorld: 'chess',      label: '06 // CHESS ROOM',       sub: 'PLAY VS CREW',        angle: 3.92, col: '#ffd43b' },
    { targetWorld: 'spa',        label: '07 // JACUZZI & SPA',    sub: '104°F CYBER TUB',     angle: 4.71, col: '#00f0ff' },
    { targetWorld: 'jam',        label: '08 // JAMMING ROOM',     sub: 'SYNTH·DRUM·GUITAR',   angle: 5.50, col: '#ff7eb6' },
  ];

  const sectorMeshes = [];
  const hotspots = [];

  for (const sec of sectors) {
    const R = 5.6;
    const sx = Math.sin(sec.angle) * R;
    const sy = 0.15;
    const sz = Math.cos(sec.angle) * R - 0.5;

    const island = new THREE.Group();
    island.position.set(sx, sy, sz);
    island.lookAt(0, sy, 0);
    island.rotation.x = 0; island.rotation.z = 0;

    place(island, cyl(1.45, 1.05, 0.5, 8, cmat('#252b42')), 0, -0.25, 0);
    place(island, cyl(1.38, 1.38, 0.08, 8, cmat('#353d5c')), 0, 0.02, 0);
    const ring = place(island, cyl(1.44, 1.44, 0.04, 8, basic({ color: sec.col })), 0, 0.04, 0);
    place(island, neon(sec.label.split('// ')[1], sec.col, { size: [1.45, 0.32], k: 2.4 }), 0, 0.85, -0.35);

    const dist = Math.hypot(sx, sz);
    const bridge = box(0.28, 0.08, dist - 2.4, basic({ color: sec.col }));
    bridge.position.set(sx * 0.5, -0.02, sz * 0.5);
    bridge.lookAt(sx, -0.02, sz);
    s.add(bridge);

    const hs = {
      id: 'enter-' + sec.targetWorld,
      label: sec.label,
      sub: 'CAPSULE TRANSIT →',
      pos: new THREE.Vector3(sx, sy + 1.45, sz),
      action: 'world',
      targetWorld: sec.targetWorld,
      title: sec.label,
      desc: `Click to board the Capsule Corp pod through the Boring Tunnel to ${sec.label} (${sec.sub}).`,
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
    bounds: { minX: -2.2, maxX: 2.2, minZ: -1.8, maxZ: 1.8 },
    update(t) {
      logoGroup.position.y = Math.sin(t * 1.6) * 0.12;
      logoGroup.rotation.y = Math.sin(t * 0.55) * 0.14;
      sectorMeshes.forEach((m, idx) => {
        m.island.position.y = m.baseY + Math.sin(t * 1.5 + idx * 1.1) * 0.08;
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
    gym: buildGymWorld(ctx, createCastEntry),
    chess: buildChessWorld(ctx, createCastEntry),
    spa: buildSpaWorld(ctx, createCastEntry),
    jam: buildJamWorld(ctx, createCastEntry),
    tunnel: buildTunnelWorld(ctx, createCastEntry),
    island: buildIslandWorld(ctx),
  };
}

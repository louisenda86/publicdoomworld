// Extra Interactive 3D Rooms for PUBLIC DOOM:
// - MEJALS GYM (gym)
// - CHESS ROOM (chess)
// - BATHROOM & JACUZZI (spa)
// - JAMMING ROOM (jam) — Synth, Drum, Guitar, Bass, Piano
// - BORING TUNNEL // CAPSULE CORP. HUB (tunnel)
// Plus the shared CAPSULE CORP. Transport Pod placed in every room!

import * as THREE from 'three';
import { box, cyl, lam, basic, cmat, phong } from './world/kit.js';
import { ptex, noiseFill, shade } from './world/tex.js';
import { lights } from './world/env.js';
import { room } from './world/sets3.js';
import { neon } from './world/sets5.js';
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

function tagPickable(root, payload) {
  root.userData.pick = payload;
  root.traverse(o => {
    if (o.isMesh) o.userData.pick = payload;
  });
}

// ============================================================================
// SHARED PROP: CAPSULE CORP. BORING TUNNEL TRANSPORT POD
// ============================================================================
export function buildCapsulePod(worldId, pos = [2.35, 0, -1.65], ry = -0.5) {
  const g = new THREE.Group();
  g.position.set(pos[0], pos[1], pos[2]);
  g.rotation.y = ry;

  const whiteM = phong({ color: 0xf4f6fb, spec: 0xffffff, shin: 70 });
  const cyanGlow = basic({ color: 0x00f0ff });
  const darkM = cmat('#181c26', 0.05);
  const glassM = new THREE.MeshPhongMaterial({
    color: 0x38bdf8,
    emissive: 0x082f49,
    transparent: true,
    opacity: 0.42,
    shininess: 90,
  });

  // Base pad + Boring Tunnel hatch ring
  place(g, cyl(0.68, 0.74, 0.08, 14, darkM), 0, 0.04, 0);
  place(g, cyl(0.62, 0.62, 0.03, 14, cyanGlow), 0, 0.085, 0);

  // Spherical Capsule Corp dome shell + glass front
  const lowerDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.56, 14, 10, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45),
    whiteM
  );
  lowerDome.position.y = 0.62;
  g.add(lowerDome);

  const upperDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
    glassM
  );
  upperDome.position.y = 0.62;
  g.add(upperDome);

  // Capsule Corp label band around equator
  const ccTex = ptex('cc_band', 128, 24, (c, w, h) => {
    c.fillStyle = '#f4f6fb';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#0f172a';
    c.fillRect(0, 0, w, 3);
    c.fillRect(0, h - 3, w, 3);
    c.fillStyle = '#0284c7';
    c.font = 'bold 11px monospace';
    c.textAlign = 'center';
    c.fillText('CAPSULE CORP // BORING TUNNEL', w / 2, 16);
  });
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(0.565, 0.565, 0.14, 16, 1, true),
    lam({ map: ccTex, side: THREE.DoubleSide })
  );
  band.position.y = 0.62;
  g.add(band);

  // Top beacon antenna
  place(g, cyl(0.03, 0.05, 0.18, 8, darkM), 0, 1.24, 0);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), cyanGlow);
  tip.position.set(0, 1.35, 0);
  g.add(tip);

  const hotspot = {
    id: `capsule-pod-${worldId}`,
    label: 'CAPSULE CORP. POD',
    sub: 'BORING TUNNEL TRANSIT →',
    pos: new THREE.Vector3(pos[0], pos[1] + 1.48, pos[2]),
    action: 'capsule-menu',
    title: 'CAPSULE CORP. // BORING TUNNEL TRANSIT',
    desc: 'High-speed subterranean capsule transport linking all Public Doom sectors alongside the Mars–Austin Boring Tunnel.',
  };
  tagPickable(g, { type: 'hotspot', hotspot });

  return { group: g, tip, hotspot };
}

// ============================================================================
// 5. MEJALS GYM (SECTOR 05)
// ============================================================================
export function buildGymWorld(ctx, createCastEntry) {
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x090b12);
  const W = 7.4, D = 6.2, H = 3.2;

  const wallTex = ptex('gym_wall', 64, 64, (g, w, h, R) => {
    noiseFill(g, w, h, '#1b1e28', 0.05, R);
    g.fillStyle = '#ff3b30';
    g.fillRect(0, h - 10, w, 4);
    g.fillStyle = '#ffd43b';
    g.fillRect(0, h - 6, w, 2);
  }, { repeat: [5, 2] });

  const floorTex = ptex('gym_floor', 64, 64, (g, w, h, R) => {
    noiseFill(g, w, h, '#14161d', 0.08, R);
    g.strokeStyle = 'rgba(255,255,255,0.06)';
    g.strokeRect(0, 0, w, h);
  }, { repeat: [8, 8] });

  room(s, { w: W, d: D, h: H, wall: wallTex, floor: floorTex, ceil: '#101218', front: false });
  lights(s, { hemiSky: 0xdbeafe, hemiGround: 0x1e1b2e, hemi: 1.05, sun: 0xfff0d4, sunI: 1.4, sunPos: [3, 6, 5], area: 10 });

  const neonRed = new THREE.PointLight(0xff3b30, 2.6, 9);
  neonRed.position.set(0, 2.6, -2.4);
  s.add(neonRed);

  const neonCyan = new THREE.PointLight(0x38bdf8, 2.2, 9);
  neonCyan.position.set(-2.4, 2.4, 0.5);
  s.add(neonCyan);

  // Giant MEJALS GYM Neon Sign on back wall
  const gymSign = neon('MEJALS GYM', '#ff3b30', { size: [3.2, 0.68], k: 2.9 });
  gymSign.position.set(0, 2.38, -D / 2 + 0.08);
  s.add(gymSign);

  const subSign = neon('MARS CITY OF AUSTIN // IRON BUNKER', '#ffd43b', { size: [2.4, 0.34], k: 2.2 });
  subSign.position.set(0, 1.88, -D / 2 + 0.08);
  s.add(subSign);

  // Wall Mirror Panels on Left Wall
  const mirrorMat = phong({ color: 0x94a3b8, emissive: 0x1e293b, spec: 0xffffff, shin: 100 });
  for (let i = 0; i < 3; i++) {
    place(s, box(0.04, 1.75, 1.35, mirrorMat), -W / 2 + 0.03, 1.25, -1.5 + i * 1.5);
  }

  // Bench Press + Barbell (Left-Center)
  const benchG = new THREE.Group();
  benchG.position.set(-1.85, 0, -1.45);
  const steelM = cmat('#64748b', 0.05);
  const padM = cmat('#c8242c', 0.05);
  const plateM = cmat('#111318', 0.06);
  place(benchG, box(0.38, 0.42, 1.25, padM, 'bottom'), 0, 0, 0.15);
  for (const sx of [-0.26, 0.26]) {
    place(benchG, cyl(0.03, 0.03, 1.15, 8, steelM), sx, 0.58, -0.42);
  }
  const barbell = new THREE.Group();
  barbell.position.set(0, 0.98, -0.42);
  place(barbell, cyl(0.02, 0.02, 1.65, 8, steelM), 0, 0, 0, 0, 0, Math.PI / 2);
  for (const sx of [-0.62, -0.54, 0.54, 0.62]) {
    place(barbell, cyl(0.18, 0.18, 0.04, 12, plateM), sx, 0, 0, 0, 0, Math.PI / 2);
  }
  benchG.add(barbell);
  s.add(benchG);

  // Heavy Boxing Bag (Right-Back)
  const bagPivot = new THREE.Group();
  bagPivot.position.set(1.95, 2.85, -1.55);
  place(bagPivot, cyl(0.015, 0.015, 0.65, 6, steelM), 0, -0.32, 0);
  const heavyBag = cyl(0.24, 0.24, 1.25, 12, cmat('#b91c1c', 0.06));
  heavyBag.position.set(0, -1.2, 0);
  bagPivot.add(heavyBag);
  s.add(bagPivot);

  // 2 Motorized Treadmills (Left-Front & Right-Front)
  for (const tx of [-2.35, 2.35]) {
    const tm = new THREE.Group();
    tm.position.set(tx, 0, 0.85);
    tm.rotation.y = tx < 0 ? 0.35 : -0.35;
    place(tm, box(0.76, 0.12, 1.55, cmat('#1e293b'), 'bottom'), 0, 0, 0);
    place(tm, box(0.62, 0.02, 1.35, cmat('#0f172a'), 'bottom'), 0, 0.12, 0.05);
    place(tm, box(0.05, 1.15, 0.05, steelM, 'bottom'), -0.34, 0.1, -0.65);
    place(tm, box(0.05, 1.15, 0.05, steelM, 'bottom'), 0.34, 0.1, -0.65);
    place(tm, box(0.76, 0.22, 0.28, cmat('#1e293b'), 'bottom'), 0, 1.18, -0.65, -0.3, 0, 0);
    s.add(tm);
  }

  // Dumbbell Rack (Back Center)
  const rack = new THREE.Group();
  rack.position.set(0.0, 0, -2.35);
  place(rack, box(1.6, 0.72, 0.38, steelM, 'bottom'), 0, 0, 0);
  for (let i = 0; i < 5; i++) {
    const dx = -0.6 + i * 0.3;
    place(rack, cyl(0.06, 0.06, 0.24, 8, plateM), dx, 0.78, 0, Math.PI / 2, 0, 0);
  }
  s.add(rack);

  // Capsule Corp Pod
  const pod = buildCapsulePod('gym', [2.85, 0, -2.15], -0.45);
  s.add(pod.group);

  // Cast in MEJALS GYM
  const cast = {
    TOPENG: createCastEntry('gym', 'TOPENG', { x: -1.1, y: 0, z: -0.35, ry: 0.22, pose: 'cheer' }),
    JAX: createCastEntry('gym', 'JAX', { x: -0.25, y: 0, z: 0.35, ry: 0.1, pose: 'hip' }),
    AYESHA: createCastEntry('gym', 'AYESHA', { x: 0.65, y: 0, z: 0.25, ry: -0.18, pose: 'hip' }),
    ATHENA: createCastEntry('gym', 'ATHENA', { x: 1.45, y: 0, z: -0.35, ry: -0.32, pose: 'wave' }),
  };
  Object.values(cast).forEach(c => s.add(c.holder));

  const hotspots = [
    {
      id: 'gym-bench',
      label: 'MEJALS BENCH & IRON RACK',
      sub: 'PUMP IRON // 225 LBS',
      pos: new THREE.Vector3(-1.85, 1.25, -1.45),
      cam: { pos: [-0.6, 1.55, 0.8], target: [-1.85, 0.9, -1.45], fov: 40 },
      action: 'inspect',
      title: 'MEJALS GYM // HEAVY BENCH STATION',
      desc: 'Where Topeng and Ayesha max out between 14-hour editing marathons. Loaded with 45-lb low-poly iron plates.',
    },
    {
      id: 'gym-bag',
      label: 'HEAVY BOXING BAG',
      sub: 'STRIKE COMBO TEST',
      pos: new THREE.Vector3(1.95, 1.65, -1.55),
      cam: { pos: [0.8, 1.6, 0.9], target: [1.95, 1.35, -1.55], fov: 40 },
      action: 'inspect',
      title: 'MEJALS GYM // CRIMSON HEAVY BAG',
      desc: 'Reinforced synth-leather heavy bag stamped with the Reed High School & Mars City boxing club emblem.',
    },
    pod.hotspot,
  ];

  tagPickable(benchG, { type: 'hotspot', hotspot: hotspots[0] });
  tagPickable(bagPivot, { type: 'hotspot', hotspot: hotspots[1] });

  return {
    id: 'gym',
    scene: s,
    cast,
    hotspots,
    bounds: { minX: -2.9, maxX: 2.9, minZ: -1.9, maxZ: 2.2 },
    update(t) {
      barbell.position.y = 0.98 + Math.sin(t * 3.2) * 0.14;
      bagPivot.rotation.z = Math.sin(t * 2.6) * 0.08;
      Object.values(cast).forEach((c, i) => c.update(t, i));
    },
  };
}

// ============================================================================
// 6. CHESS ROOM (SECTOR 06 — PLAYABLE CHESS WITH CREW)
// ============================================================================
export function buildChessWorld(ctx, createCastEntry) {
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x0c0a12);
  const W = 6.6, D = 5.8, H = 3.0;

  const wallTex = ptex('chess_wall', 64, 64, (g, w, h, R) => {
    noiseFill(g, w, h, '#261c18', 0.05, R);
    g.fillStyle = '#d4a359';
    g.fillRect(0, h - 6, w, 2);
  }, { repeat: [4, 2] });

  const floorTex = ptex('chess_floor', 64, 64, (g, w, h) => {
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        g.fillStyle = (x + y) % 2 === 0 ? '#2b211b' : '#1b1512';
        g.fillRect(x * 8, y * 8, 8, 8);
      }
    }
  }, { repeat: [4, 4] });

  room(s, { w: W, d: D, h: H, wall: wallTex, floor: floorTex, ceil: '#16110e', front: false });
  lights(s, { hemiSky: 0xffe4b5, hemiGround: 0x1c1412, hemi: 1.1, sun: 0xffd28a, sunI: 1.5, sunPos: [2, 6, 4], area: 9 });

  const warmLamp = new THREE.PointLight(0xffb86c, 2.8, 8);
  warmLamp.position.set(0, 2.35, -0.2);
  s.add(warmLamp);

  const chessSign = neon('GRANDMASTER LOUNGE // CHESS CLUB', '#ffd43b', { size: [3.1, 0.48], k: 2.5 });
  chessSign.position.set(0, 2.35, -D / 2 + 0.08);
  s.add(chessSign);

  // Center Chess Table + 8x8 Board + 3D Low-Poly Pieces
  const tableG = new THREE.Group();
  tableG.position.set(0, 0, -0.15);
  place(tableG, P.table(1.35, 1.35, 0.74, '#4a2e1b'), 0, 0, 0);

  const boardTex = ptex('chess_board_top', 128, 128, (g, w, h) => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        g.fillStyle = (r + c) % 2 === 0 ? '#f3ead8' : '#7c2d12';
        g.fillRect(c * 16, r * 16, 16, 16);
      }
    }
  });
  const boardMesh = box(0.84, 0.04, 0.84, lam({ map: boardTex }), 'bottom');
  boardMesh.position.set(0, 0.74, 0);
  tableG.add(boardMesh);

  // 32 Mini 3D Chess Pieces on the board
  const whitePieceM = cmat('#f8fafc', 0.02);
  const blackPieceM = cmat('#1e293b', 0.04);
  for (let c = 0; c < 8; c++) {
    const px = -0.35 + c * 0.1;
    // White back rank & pawns
    place(tableG, cyl(0.022, 0.03, 0.11, 6, whitePieceM), px, 0.83, 0.35);
    place(tableG, cyl(0.018, 0.025, 0.075, 6, whitePieceM), px, 0.81, 0.25);
    // Black back rank & pawns
    place(tableG, cyl(0.022, 0.03, 0.11, 6, blackPieceM), px, 0.83, -0.35);
    place(tableG, cyl(0.018, 0.025, 0.075, 6, blackPieceM), px, 0.81, -0.25);
  }
  s.add(tableG);

  // Leather Armchairs around the Chess Table
  place(s, P.armchair('#7c2d12'), -1.45, 0, -0.15, 0, Math.PI / 2, 0);
  place(s, P.armchair('#7c2d12'), 1.45, 0, -0.15, 0, -Math.PI / 2, 0);

  // Capsule Corp Pod
  const pod = buildCapsulePod('chess', [2.45, 0, -1.95], -0.45);
  s.add(pod.group);

  const cast = {
    JAX: createCastEntry('chess', 'JAX', { x: -0.82, y: 0, z: -0.65, ry: 0.45, pose: 'explain' }),
    TOPENG: createCastEntry('chess', 'TOPENG', { x: 0.82, y: 0, z: -0.65, ry: -0.45, pose: 'cross' }),
    AYESHA: createCastEntry('chess', 'AYESHA', { x: -1.65, y: 0, z: 0.65, ry: 0.35, pose: 'hip' }),
    ATHENA: createCastEntry('chess', 'ATHENA', { x: 1.65, y: 0, z: 0.65, ry: -0.35, pose: 'wave' }),
  };
  Object.values(cast).forEach(c => s.add(c.holder));

  const hotspots = [
    {
      id: 'chess-board-play',
      label: '♟ PLAY CHESS VS CREW',
      sub: 'CHOOSE OPPONENT (BEGINNER SKILL)',
      pos: new THREE.Vector3(0, 1.05, -0.15),
      cam: { pos: [0.0, 1.68, 1.85], target: [0.0, 0.85, -0.15], fov: 40 },
      action: 'open-chess',
      title: 'PUBLIC DOOM // INTERACTIVE CHESS TABLE',
      desc: 'Challenge Jax, Topeng, Ayesha, or Athena to a live game of Chess! All four have Beginner Skill ratings and react to your moves.',
    },
    pod.hotspot,
  ];

  tagPickable(tableG, { type: 'hotspot', hotspot: hotspots[0] });

  return {
    id: 'chess',
    scene: s,
    cast,
    hotspots,
    bounds: { minX: -2.6, maxX: 2.6, minZ: -1.9, maxZ: 2.1 },
    update(t) {
      Object.values(cast).forEach((c, i) => c.update(t, i));
    },
  };
}

// ============================================================================
// 7. BATHROOM & JACUZZI (SECTOR 07)
// ============================================================================
export function buildSpaWorld(ctx, createCastEntry) {
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x07111a);
  const W = 7.0, D = 6.0, H = 3.1;

  const tileWall = ptex('spa_tile_wall', 64, 64, (g, w, h) => {
    g.fillStyle = '#0f293a';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#38bdf8';
    g.lineWidth = 1;
    for (let i = 0; i <= 64; i += 16) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke();
      g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke();
    }
  }, { repeat: [6, 3] });

  const tileFloor = ptex('spa_tile_floor', 64, 64, (g, w, h) => {
    g.fillStyle = '#0b1924';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#1e3a5f';
    g.strokeRect(0, 0, w, h);
  }, { repeat: [8, 8] });

  room(s, { w: W, d: D, h: H, wall: tileWall, floor: tileFloor, ceil: '#071118', front: false });
  lights(s, { hemiSky: 0x7dd3fc, hemiGround: 0x0f172a, hemi: 1.15, sun: 0xe0f2fe, sunI: 1.2, sunPos: [2, 6, 4], area: 10 });

  const aquaGlow = new THREE.PointLight(0x00f0ff, 3.2, 9);
  aquaGlow.position.set(0, 1.5, -0.4);
  s.add(aquaGlow);

  const pinkGlow = new THREE.PointLight(0xff63b0, 2.2, 8);
  pinkGlow.position.set(-2.2, 2.2, -1.2);
  s.add(pinkGlow);

  const spaSign = neon('BATHROOM & CYBER JACUZZI // 104°F', '#38bdf8', { size: [3.2, 0.48], k: 2.6 });
  spaSign.position.set(0, 2.38, -D / 2 + 0.08);
  s.add(spaSign);

  // Center Steaming Jacuzzi Hot Tub
  const jacuzziG = new THREE.Group();
  jacuzziG.position.set(0, 0, -0.45);
  const rimM = cmat('#e2e8f0', 0.04);
  const tubM = cmat('#1e293b', 0.05);
  place(jacuzziG, cyl(1.75, 1.65, 0.62, 16, tubM), 0, 0.31, 0);
  place(jacuzziG, cyl(1.82, 1.82, 0.08, 16, rimM), 0, 0.62, 0);

  const waterMat = new THREE.MeshPhongMaterial({
    color: 0x00e5ff,
    emissive: 0x0284c7,
    transparent: true,
    opacity: 0.78,
    shininess: 95,
  });
  const waterMesh = new THREE.Mesh(new THREE.CircleGeometry(1.62, 20), waterMat);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.y = 0.56;
  jacuzziG.add(waterMesh);
  s.add(jacuzziG);

  // Rising Steam / Bubble Particles above the Jacuzzi
  const steamGeo = new THREE.BufferGeometry();
  const steamCount = 70;
  const steamPos = new Float32Array(steamCount * 3);
  for (let i = 0; i < steamCount; i++) {
    const a = (i / steamCount) * Math.PI * 2 * 3;
    const r = (i % 9) * 0.16;
    steamPos[i * 3] = Math.cos(a) * r;
    steamPos[i * 3 + 1] = 0.6 + (i % 10) * 0.16;
    steamPos[i * 3 + 2] = -0.45 + Math.sin(a) * r;
  }
  steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));
  const steamPts = new THREE.Points(
    steamGeo,
    new THREE.PointsMaterial({ color: 0xe0f2fe, size: 0.09, transparent: true, opacity: 0.65 })
  );
  s.add(steamPts);

  // Bathroom Vanity Mirror + Sink on Left Wall
  const vanity = Q.vanity(1.3, 1.5);
  vanity.position.set(-2.55, 0, -1.2);
  vanity.rotation.y = Math.PI / 2;
  s.add(vanity);

  // Capsule Corp Pod
  const pod = buildCapsulePod('spa', [2.55, 0, -1.85], -0.5);
  s.add(pod.group);

  const cast = {
    AYESHA: createCastEntry('spa', 'AYESHA', { x: -0.65, y: 0.0, z: -0.35, ry: 0.25, pose: 'wave' }),
    ATHENA: createCastEntry('spa', 'ATHENA', { x: 0.65, y: 0.0, z: -0.35, ry: -0.25, pose: 'cheer' }),
    JAX: createCastEntry('spa', 'JAX', { x: -1.85, y: 0, z: 0.65, ry: 0.42, pose: 'explain' }),
    TOPENG: createCastEntry('spa', 'TOPENG', { x: 1.85, y: 0, z: 0.65, ry: -0.42, pose: 'cross' }),
  };
  Object.values(cast).forEach(c => s.add(c.holder));

  let jetColorIdx = 0;
  const jetColors = [0x00f0ff, 0xff63b0, 0x9b6bff, 0x38d399];

  const hotspots = [
    {
      id: 'spa-jacuzzi',
      label: 'HEATED JACUZZI JETS',
      sub: 'CYCLE NEON HYDRO-JETS',
      pos: new THREE.Vector3(0, 0.95, -0.45),
      cam: { pos: [0.0, 1.65, 2.45], target: [0.0, 0.8, -0.45], fov: 42 },
      action: 'custom',
      onTrigger() {
        jetColorIdx = (jetColorIdx + 1) % jetColors.length;
        aquaGlow.color.setHex(jetColors[jetColorIdx]);
        waterMat.color.setHex(jetColors[jetColorIdx]);
      },
      title: 'CYBER JACUZZI // HYDRO-THERMAL POOL',
      desc: '104°F mineral jacuzzi fed by Martian geothermal vents. Click to cycle the underwater neon chromotherapy jets!',
    },
    {
      id: 'spa-vanity',
      label: 'BATHROOM VANITY & MIRROR',
      sub: 'OPEN ATTIRES & HAIRSTYLE MENU',
      pos: new THREE.Vector3(-2.45, 1.35, -1.2),
      cam: { pos: [-0.9, 1.5, -0.4], target: [-2.55, 1.25, -1.2], fov: 40 },
      action: 'open-wardrobe',
      title: 'BATHROOM VANITY // WARDROBE & STYLING MIRROR',
      desc: 'Change attires, accessories, female hairstyles (5 styles), or unlock the 10-item Vault Collection (Passcode: 5539).',
    },
    pod.hotspot,
  ];

  tagPickable(jacuzziG, { type: 'hotspot', hotspot: hotspots[0] });
  tagPickable(vanity, { type: 'hotspot', hotspot: hotspots[1] });

  return {
    id: 'spa',
    scene: s,
    cast,
    hotspots,
    bounds: { minX: -2.8, maxX: 2.8, minZ: -1.9, maxZ: 2.2 },
    update(t) {
      waterMesh.position.y = 0.56 + Math.sin(t * 4.0) * 0.015;
      const attr = steamGeo.attributes.position;
      for (let i = 0; i < steamCount; i++) {
        const y = 0.6 + ((i * 0.19 + t * 0.38) % 1.75);
        attr.setY(i, y);
      }
      attr.needsUpdate = true;
      Object.values(cast).forEach((c, i) => c.update(t, i));
    },
  };
}

// ============================================================================
// 8. JAMMING ROOM (SECTOR 08 — SYNTH, DRUM, GUITAR, BASS, PIANO)
// ============================================================================
export function buildJamWorld(ctx, createCastEntry) {
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x0b0814);
  const W = 7.4, D = 6.2, H = 3.2;

  const foamTex = ptex('jam_foam', 32, 32, (g, w, h, R) => {
    noiseFill(g, w, h, '#1c162b', 0.08, R);
    g.fillStyle = '#2a2040';
    g.fillRect(0, 0, w / 2, h / 2);
    g.fillRect(w / 2, h / 2, w / 2, h / 2);
  }, { repeat: [8, 4] });

  const stageFloor = ptex('jam_floor', 64, 64, (g, w, h, R) => {
    noiseFill(g, w, h, '#241a14', 0.06, R);
  }, { repeat: [6, 6] });

  room(s, { w: W, d: D, h: H, wall: foamTex, floor: stageFloor, ceil: '#110d1a', front: false });
  lights(s, { hemiSky: 0xe9d5ff, hemiGround: 0x1e1b2e, hemi: 1.05, sun: 0xffd8a8, sunI: 1.35, sunPos: [2, 6, 4], area: 10 });

  const stageLight1 = new THREE.PointLight(0x9b6bff, 3.0, 9);
  stageLight1.position.set(-1.8, 2.5, -0.5);
  s.add(stageLight1);

  const stageLight2 = new THREE.PointLight(0xff7eb6, 2.8, 9);
  stageLight2.position.set(1.8, 2.5, -0.5);
  s.add(stageLight2);

  const jamSign = neon('PUBLIC DOOM JAMMING STUDIO // LIVE DECK', '#ff7eb6', { size: [3.4, 0.5], k: 2.6 });
  jamSign.position.set(0, 2.45, -D / 2 + 0.08);
  s.add(jamSign);

  // 1. SYNTHESIZER (Athena's station — Front Right)
  const synthG = P2.synthKeys('#7c3aed');
  place(s, synthG, 1.55, 0, 0.35, 0, -0.35, 0);

  // 2. DRUM KIT (Center Back on Riser)
  const drumG = new THREE.Group();
  drumG.position.set(0, 0, -1.55);
  place(drumG, box(2.1, 0.14, 1.6, cmat('#27272a'), 'bottom'), 0, 0, 0);
  const shellM = phong({ color: 0xe11d48, spec: 0xffffff, shin: 80 });
  const headM = cmat('#f8fafc', 0.03);
  const brassM = phong({ color: 0xfacc15, spec: 0xffffff, shin: 90 });
  // Kick drum
  place(drumG, cyl(0.36, 0.36, 0.42, 14, shellM), 0, 0.5, 0.1, Math.PI / 2, 0, 0);
  place(drumG, cyl(0.37, 0.37, 0.44, 14, headM), 0, 0.5, 0.1, Math.PI / 2, 0, 0);
  // Snare + Toms
  place(drumG, cyl(0.2, 0.2, 0.16, 12, shellM), -0.42, 0.68, 0.25);
  place(drumG, cyl(0.16, 0.16, 0.18, 12, shellM), -0.2, 0.88, -0.05, 0.3, 0, 0);
  place(drumG, cyl(0.18, 0.18, 0.2, 12, shellM), 0.22, 0.88, -0.05, 0.3, 0, 0);
  place(drumG, cyl(0.24, 0.24, 0.38, 12, shellM), 0.48, 0.52, 0.22);
  // Cymbals
  place(drumG, cyl(0.015, 0.015, 1.15, 6, cmat('#94a3b8')), -0.68, 0.65, 0.15);
  place(drumG, cyl(0.24, 0.24, 0.012, 14, brassM), -0.68, 1.22, 0.15, 0.2, 0, 0.15);
  place(drumG, cyl(0.015, 0.015, 1.25, 6, cmat('#94a3b8')), 0.68, 0.68, -0.1);
  place(drumG, cyl(0.28, 0.28, 0.012, 14, brassM), 0.68, 1.32, -0.1, 0.25, 0, -0.18);
  s.add(drumG);

  // 3. ELECTRIC GUITAR + AMP (Front Left)
  const guitarG = new THREE.Group();
  guitarG.position.set(-1.65, 0, 0.35);
  guitarG.rotation.y = 0.38;
  place(guitarG, P2.amp('DOOMSHALL'), -0.45, 0, -0.65);
  const gMesh = P2.guitar('#ef4444');
  place(guitarG, gMesh, 0, 0.55, 0, -0.2, 0, 0.15);
  s.add(guitarG);

  // 4. BASS GUITAR + BASS STACK (Mid Left)
  const bassG = new THREE.Group();
  bassG.position.set(-2.35, 0, -0.85);
  bassG.rotation.y = 0.55;
  place(bassG, P2.speakerStack(1.45), -0.35, 0, -0.45);
  const bMesh = P2.guitar('#38bdf8');
  bMesh.scale.set(1.08, 1.18, 1.0);
  place(bassG, bMesh, 0.1, 0.6, 0.1, -0.18, 0, -0.12);
  s.add(bassG);

  // 5. STUDIO UPRIGHT / GRAND PIANO (Mid Right)
  const pianoG = new THREE.Group();
  pianoG.position.set(2.35, 0, -0.95);
  pianoG.rotation.y = -0.55;
  const ebM = phong({ color: 0x111318, spec: 0xffffff, shin: 85 });
  place(pianoG, box(1.38, 1.12, 0.58, ebM, 'bottom'), 0, 0, 0);
  place(pianoG, box(1.32, 0.08, 0.32, ebM, 'bottom'), 0, 0.72, 0.28);
  const pKeysTex = ptex('piano_keys_tex', 64, 12, (c, w, h) => {
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#111111';
    for (let x = 0; x < w; x += 4) c.fillRect(x, 0, 1, h);
    for (let x = 2; x < w; x += 8) c.fillRect(x, 0, 2, h * 0.62);
  });
  const pKeys = new THREE.Mesh(new THREE.PlaneGeometry(1.24, 0.18), lam({ map: pKeysTex }));
  pKeys.rotation.x = -Math.PI / 2;
  pKeys.position.set(0, 0.805, 0.32);
  pianoG.add(pKeys);
  s.add(pianoG);

  // Capsule Corp Pod
  const pod = buildCapsulePod('jam', [2.85, 0, -2.15], -0.45);
  s.add(pod.group);

  const cast = {
    JAX: createCastEntry('jam', 'JAX', { x: -1.15, y: 0, z: 0.25, ry: 0.28, pose: 'cheer' }),
    TOPENG: createCastEntry('jam', 'TOPENG', { x: -0.05, y: 0.14, z: -0.95, ry: 0.0, pose: 'wave' }),
    AYESHA: createCastEntry('jam', 'AYESHA', { x: -1.85, y: 0, z: -0.45, ry: 0.42, pose: 'hip' }),
    ATHENA: createCastEntry('jam', 'ATHENA', { x: 1.25, y: 0, z: 0.15, ry: -0.32, pose: 'cheer' }),
  };
  Object.values(cast).forEach(c => s.add(c.holder));

  const hotspots = [
    {
      id: 'jam-synth',
      label: '🎹 PLAY SYNTHESIZER',
      sub: 'INTERACTIVE FM / SAW SYNTH',
      pos: new THREE.Vector3(1.55, 1.15, 0.35),
      cam: { pos: [0.8, 1.55, 2.2], target: [1.45, 0.95, 0.25], fov: 40 },
      action: 'open-jam',
      instrument: 'synth',
      title: 'ATHENA // POLYPHONIC ANALOG SYNTH',
      desc: 'Click to open the interactive Jamming Studio Deck and play Synth, Drums, Electric Guitar, Bass, and Piano live!',
    },
    {
      id: 'jam-drums',
      label: '🥁 PLAY DRUM KIT',
      sub: '8-PAD BEAT DECK + LOOP',
      pos: new THREE.Vector3(0, 1.35, -1.55),
      cam: { pos: [0.0, 1.65, 1.4], target: [0.0, 0.9, -1.55], fov: 42 },
      action: 'open-jam',
      instrument: 'drums',
      title: 'PUBLIC DOOM // ACOUSTIC & 909 DRUM KIT',
      desc: 'Trigger Kick, Snare, Hi-Hats, Toms, and Crash Cymbals or toggle the live studio beat loop!',
    },
    {
      id: 'jam-guitar',
      label: '🎸 PLAY GUITAR & BASS',
      sub: 'OVERDRIVE & SUB BASS',
      pos: new THREE.Vector3(-1.65, 1.15, 0.35),
      cam: { pos: [-0.8, 1.55, 2.2], target: [-1.55, 0.85, 0.1], fov: 40 },
      action: 'open-jam',
      instrument: 'guitar',
      title: 'DOOMSHALL STACK // ELECTRIC GUITAR & BASS',
      desc: 'Shred custom low-poly guitar riffs and deep Martian slap bass through the studio stack.',
    },
    {
      id: 'jam-piano',
      label: '🎼 PLAY STUDIO PIANO',
      sub: 'GRAND PIANO KEYS',
      pos: new THREE.Vector3(2.35, 1.25, -0.95),
      cam: { pos: [0.9, 1.55, 0.9], target: [2.25, 0.9, -0.95], fov: 40 },
      action: 'open-jam',
      instrument: 'piano',
      title: 'EBONY UPRIGHT // GRAND STUDIO PIANO',
      desc: 'Play warm harmonic chords and melodies on the studio piano.',
    },
    pod.hotspot,
  ];

  tagPickable(synthG, { type: 'hotspot', hotspot: hotspots[0] });
  tagPickable(drumG, { type: 'hotspot', hotspot: hotspots[1] });
  tagPickable(guitarG, { type: 'hotspot', hotspot: hotspots[2] });
  tagPickable(bassG, { type: 'hotspot', hotspot: hotspots[2] });
  tagPickable(pianoG, { type: 'hotspot', hotspot: hotspots[3] });

  return {
    id: 'jam',
    scene: s,
    cast,
    hotspots,
    bounds: { minX: -2.8, maxX: 2.8, minZ: -1.8, maxZ: 2.2 },
    update(t) {
      Object.values(cast).forEach((c, i) => c.update(t, i));
    },
  };
}

// ============================================================================
// 9. BORING TUNNEL // CAPSULE CORP. TRANSIT HUB (SECTOR 09)
// ============================================================================
export function buildTunnelWorld(ctx, createCastEntry) {
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x05070e);
  s.fog = new THREE.FogExp2(0x05070e, 0.045);

  lights(s, { hemiSky: 0x38bdf8, hemiGround: 0x0f172a, hemi: 1.15, sun: 0xe0f2fe, sunI: 1.3, sunPos: [0, 5, 6], area: 14 });

  // Cylindrical Boring Tunnel segments extending along Z
  const segM = cmat('#1e2433', 0.07);
  const ribM = cmat('#334155', 0.05);
  const cyanGlow = basic({ color: 0x00f0ff });
  const amberGlow = basic({ color: 0xffd43b });

  for (let i = -6; i <= 4; i++) {
    const z = i * 2.2;
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(3.8, 3.8, 2.0, 18, 1, true),
      segM
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 1.8, z);
    s.add(ring);

    const rib = new THREE.Mesh(
      new THREE.TorusGeometry(3.75, 0.09, 6, 18),
      ribM
    );
    rib.position.set(0, 1.8, z);
    s.add(rib);

    // Neon strip lights along tunnel walls
    place(s, box(0.06, 0.06, 1.9, i % 2 === 0 ? cyanGlow : amberGlow), -3.55, 2.1, z);
    place(s, box(0.06, 0.06, 1.9, i % 2 === 0 ? cyanGlow : amberGlow), 3.55, 2.1, z);
  }

  // Concrete Station Platform + Hyperloop Magnetic Track
  place(s, box(7.4, 0.2, 24, cmat('#0f1420'), 'top'), 0, 0, -2);
  place(s, box(1.5, 0.08, 24, cmat('#1e293b'), 'bottom'), 0, 0, -2);
  place(s, box(0.08, 0.04, 24, cyanGlow, 'bottom'), -0.65, 0.08, -2);
  place(s, box(0.08, 0.04, 24, cyanGlow, 'bottom'), 0.65, 0.08, -2);

  const sign1 = neon('BORING TUNNEL // MARS–AUSTIN HYPERLOOP', '#38bdf8', { size: [3.6, 0.52], k: 2.8 });
  sign1.position.set(0, 3.15, -3.2);
  s.add(sign1);

  const sign2 = neon('CAPSULE CORP. TRANSIT AUTHORITY // ALL ROOMS LINKED', '#ffd43b', { size: [2.8, 0.36], k: 2.2 });
  sign2.position.set(0, 2.6, -3.2);
  s.add(sign2);

  // Animated CAPSULE CORP. Transit Pod gliding on the center track
  const roverPod = buildCapsulePod('tunnel', [0, 0.08, -1.2], 0);
  roverPod.group.scale.setScalar(1.35);
  s.add(roverPod.group);

  const cast = {
    JAX: createCastEntry('tunnel', 'JAX', { x: -1.85, y: 0, z: 0.45, ry: 0.35, pose: 'wave' }),
    TOPENG: createCastEntry('tunnel', 'TOPENG', { x: -1.15, y: 0, z: -0.55, ry: 0.25, pose: 'point' }),
    AYESHA: createCastEntry('tunnel', 'AYESHA', { x: 1.15, y: 0, z: -0.55, ry: -0.25, pose: 'hip' }),
    ATHENA: createCastEntry('tunnel', 'ATHENA', { x: 1.85, y: 0, z: 0.45, ry: -0.35, pose: 'cheer' }),
  };
  Object.values(cast).forEach(c => s.add(c.holder));

  const hotspots = [
    {
      id: 'tunnel-capsule-main',
      label: 'CAPSULE CORP. EXPRESS POD',
      sub: 'SELECT DESTINATION ROOM →',
      pos: new THREE.Vector3(0, 1.95, -1.2),
      cam: { pos: [0.0, 1.75, 3.2], target: [0.0, 1.1, -1.2], fov: 44 },
      action: 'capsule-menu',
      title: 'CAPSULE CORP. // BORING TUNNEL EXPRESS',
      desc: 'Select any room along the Boring Tunnel (Studio, Playground, Homer\'s Diner, Grass Field, Mejals Gym, Chess Room, Bathroom & Jacuzzi, or Jamming Room) for instant Capsule transport!',
    },
  ];

  return {
    id: 'tunnel',
    scene: s,
    cast,
    hotspots,
    bounds: { minX: -2.9, maxX: 2.9, minZ: -3.2, maxZ: 2.6 },
    update(t) {
      roverPod.group.position.z = -1.2 + Math.sin(t * 1.4) * 1.35;
      roverPod.group.position.y = 0.12 + Math.sin(t * 4.5) * 0.03;
      Object.values(cast).forEach((c, i) => c.update(t, i));
    },
  };
}

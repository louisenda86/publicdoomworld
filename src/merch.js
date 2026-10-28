// PUBLIC DOOM // MERCHANDISE & SUPPLY ARCHIVE
// Features 8 signature low-poly / dithered channel artifacts worn or used by Jax, Topeng, Ayesha, and Athena,
// plus procedural PS1 pixel-dithered product art generator.

import { drawStrokesLogo } from './art/strokes.js';

export const MERCH_ITEMS = [
  {
    id: 'homers-crew-shirt',
    code: 'PD-M01',
    name: "HOMER'S DINER CREW SHIRT",
    subtitle: 'WORN BY JAX // EST. 8TH CENTURY BC',
    category: 'APPAREL',
    character: 'JAX',
    outfitKey: 'JAX',
    price: 48,
    badge: 'BESTSELLER',
    colors: ['#f3eee2', '#c8242c', '#17171a'],
    sizes: ['S', 'M', 'L', 'XL'],
    desc: 'Heavyweight cream camp-collar work shirt with crimson pointed lapels, embroidered Greek column III laurel crest, and removable "HOMER\'S // JAX" magnetic name tag.',
    specs: ['100% 240GSM Cotton Twill', 'Embroidered III Laurel Crest', 'Includes Clip-On Name Badge', 'Dither-Washed Finish'],
    drawPreview(g, w, h, t) {
      // Cream work shirt with red collar and III laurel
      g.fillStyle = '#181316'; g.fillRect(0, 0, w, h);
      // Grid background
      g.strokeStyle = 'rgba(200,36,44,0.18)'; g.lineWidth = 1;
      for (let x = 0; x < w; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
      for (let y = 0; y < h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      const bob = Math.sin(t * 2.2) * 4;
      g.save(); g.translate(w / 2, h / 2 + bob);
      // Sleeves
      g.fillStyle = '#e7e0d2';
      g.beginPath(); g.moveTo(-48, -46); g.lineTo(-82, -12); g.lineTo(-66, 12); g.lineTo(-44, -10); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(48, -46); g.lineTo(82, -12); g.lineTo(66, 12); g.lineTo(44, -10); g.closePath(); g.fill();
      g.strokeStyle = '#c8242c'; g.lineWidth = 4;
      g.beginPath(); g.moveTo(-80, -8); g.lineTo(-64, 10); g.moveTo(80, -8); g.lineTo(64, 10); g.stroke();
      // Torso
      g.fillStyle = '#f3eee2'; g.fillRect(-48, -48, 96, 104);
      // Red collar
      g.fillStyle = '#c8242c';
      g.beginPath(); g.moveTo(-26, -48); g.lineTo(-6, -18); g.lineTo(0, -34); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(26, -48); g.lineTo(6, -18); g.lineTo(0, -34); g.closePath(); g.fill();
      // Placket
      g.fillRect(-2, -24, 4, 80);
      // Name tag
      g.fillStyle = '#ffffff'; g.fillRect(-36, -12, 24, 13);
      g.fillStyle = '#c8242c'; g.fillRect(-36, -12, 24, 4);
      g.fillStyle = '#111'; g.font = 'bold 7px monospace'; g.fillText('JAX', -31, -2);
      // III Laurel
      g.strokeStyle = '#c8242c'; g.lineWidth = 2;
      g.beginPath(); g.arc(22, -5, 10, 0.3, Math.PI * 2 - 0.3); g.stroke();
      g.fillStyle = '#c8242c'; g.font = 'bold 9px monospace'; g.fillText('III', 15, -2);
      g.restore();
    },
  },
  {
    id: 'topeng-strokes-tee',
    code: 'PD-M02',
    name: 'TOPENG PINK STROKES TEE',
    subtitle: 'WORN BY TOPENG // TIDAK MAU EDITION',
    category: 'APPAREL',
    character: 'TOPENG',
    outfitKey: 'TOPENG',
    price: 42,
    badge: 'ICONIC',
    colors: ['#ff8fbf', '#2668d8', '#141418'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    desc: 'Boxy bubblegum-pink heavyweight tee featuring the hand-drawn royal blue Magna-ring graphic from Topeng\'s late-night graveyard & bunker scenes.',
    specs: ['280GSM Combed Cotton', 'Hand-Drawn Blue Ring Screenprint', 'Boxy Street-Fighter Cut', 'Includes "TIDAK MAU" Woven Tag'],
    drawPreview(g, w, h, t) {
      g.fillStyle = '#12101b'; g.fillRect(0, 0, w, h);
      const bob = Math.sin(t * 2.2 + 1) * 4;
      g.save(); g.translate(w / 2, h / 2 + bob);
      g.fillStyle = '#ff8fbf';
      g.beginPath();
      g.moveTo(-46, -50); g.lineTo(-80, -18); g.lineTo(-64, 8); g.lineTo(-46, -8);
      g.lineTo(-46, 54); g.lineTo(46, 54); g.lineTo(46, -8); g.lineTo(64, 8); g.lineTo(80, -18); g.lineTo(46, -50);
      g.closePath(); g.fill();
      g.fillStyle = '#12101b'; g.beginPath(); g.arc(0, -50, 16, 0, Math.PI); g.fill();
      drawStrokesLogo(g, -34, -26, 68, 58);
      g.restore();
    },
  },
  {
    id: 'public-doom-hoodie',
    code: 'PD-M03',
    name: 'P(●) BROADCAST HEAVY HOODIE',
    subtitle: 'STUDIO BUNKER ISSUE // 480GSM',
    category: 'APPAREL',
    character: 'JAX',
    outfitKey: 'JAX_STREET',
    price: 74,
    badge: 'LIMITED',
    colors: ['#14141c', '#ff3b30', '#f4efe4'],
    sizes: ['S', 'M', 'L', 'XL'],
    desc: 'Acoustic-foam charcoal hoodie embroidered with the 3D bevelled PUBLIC DOOM P(●) emblem on the chest and the 1969–2026 tombstone coordinates on the back.',
    specs: ['480GSM French Terry', 'Puff-Print P(●) Emblem', 'Double-Lined Bunker Hood', 'Thumbhole Rib Cuffs'],
    drawPreview(g, w, h, t) {
      g.fillStyle = '#0d0f17'; g.fillRect(0, 0, w, h);
      const bob = Math.sin(t * 2.2 + 2) * 4;
      g.save(); g.translate(w / 2, h / 2 + bob);
      // Hood
      g.fillStyle = '#232634'; g.beginPath(); g.arc(0, -46, 26, Math.PI, 0); g.fill();
      // Body
      g.fillStyle = '#181a24';
      g.beginPath();
      g.moveTo(-48, -44); g.lineTo(-78, 18); g.lineTo(-58, 28); g.lineTo(-46, -6);
      g.lineTo(-46, 56); g.lineTo(46, 56); g.lineTo(46, -6); g.lineTo(58, 28); g.lineTo(78, 18); g.lineTo(48, -44);
      g.closePath(); g.fill();
      // Pocket
      g.fillStyle = '#12131c'; g.fillRect(-30, 22, 60, 22);
      // P(●) Logo
      g.fillStyle = '#f4efe4'; g.font = 'bold 20px monospace'; g.textAlign = 'center';
      g.fillText('P( )', 0, -4);
      g.fillStyle = '#ff3b30'; g.beginPath(); g.arc(6, -11, 6, 0, Math.PI * 2); g.fill();
      g.restore();
    },
  },
  {
    id: 'ayesha-violet-set',
    code: 'PD-M04',
    name: 'AYESHA VIOLET STUDIO TRACK SET',
    subtitle: 'WORN BY AYESHA // 15.7KHZ VIOLET',
    category: 'APPAREL',
    character: 'AYESHA',
    outfitKey: 'AYESHA',
    price: 64,
    badge: 'AYESHA PICK',
    colors: ['#141218', '#8b5cf6', '#f1eff5'],
    sizes: ['XS', 'S', 'M', 'L'],
    desc: 'Ayesha\'s signature two-piece studio & fitness set in deep obsidian with ultraviolet side-stripes and high-pony scrunchy.',
    specs: ['Compression Matte Nylon-Spandex', 'Ultraviolet #8B5CF6 Piping', 'Includes Matching Hair Tie', 'Zero-Glitch Flatlock Seams'],
    drawPreview(g, w, h, t) {
      g.fillStyle = '#110e1b'; g.fillRect(0, 0, w, h);
      const bob = Math.sin(t * 2.2 + 3) * 4;
      g.save(); g.translate(w / 2, h / 2 + bob);
      // Crop top
      g.fillStyle = '#16131f';
      g.fillRect(-34, -48, 68, 34);
      g.fillStyle = '#8b5cf6';
      g.fillRect(-34, -18, 68, 5);
      // High-waist leggings
      g.fillStyle = '#211b2d';
      g.beginPath();
      g.moveTo(-32, -4); g.lineTo(32, -4); g.lineTo(36, 56); g.lineTo(8, 56); g.lineTo(0, 14); g.lineTo(-8, 56); g.lineTo(-36, 56);
      g.closePath(); g.fill();
      g.strokeStyle = '#8b5cf6'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(-31, -2); g.lineTo(-34, 54); g.moveTo(31, -2); g.lineTo(34, 54); g.stroke();
      g.restore();
    },
  },
  {
    id: 'athena-golden-set',
    code: 'PD-M05',
    name: 'ATHENA SUNNY SYNTH RUNNER SET',
    subtitle: 'WORN BY ATHENA // GOLDEN HOUR',
    category: 'APPAREL',
    character: 'ATHENA',
    outfitKey: 'ATHENA',
    price: 62,
    badge: 'ATHENA PICK',
    colors: ['#ffd43b', '#ff63b0', '#ffffff'],
    sizes: ['XS', 'S', 'M', 'L'],
    desc: 'Athena\'s bright golden-yellow & electric-pink active set paired with striped varsity crew socks for voxel meadow walks.',
    specs: ['breathable Rib-Knit Jersey', 'Solar Yellow + Siren Pink Trim', 'Includes Striped Crew Socks', 'FM-Bell Woven Patch'],
    drawPreview(g, w, h, t) {
      g.fillStyle = '#191218'; g.fillRect(0, 0, w, h);
      const bob = Math.sin(t * 2.2 + 4) * 4;
      g.save(); g.translate(w / 2, h / 2 + bob);
      // Top
      g.fillStyle = '#ffd43b'; g.fillRect(-34, -46, 68, 32);
      g.fillStyle = '#ff63b0'; g.fillRect(-34, -18, 68, 5);
      // Shorts
      g.fillStyle = '#ff63b0';
      g.beginPath();
      g.moveTo(-32, -4); g.lineTo(32, -4); g.lineTo(35, 36); g.lineTo(6, 36); g.lineTo(0, 14); g.lineTo(-6, 36); g.lineTo(-35, 36);
      g.closePath(); g.fill();
      // Socks
      g.fillStyle = '#ffffff'; g.fillRect(-30, 42, 18, 18); g.fillRect(12, 42, 18, 18);
      g.fillStyle = '#ffd43b'; g.fillRect(-30, 45, 18, 4); g.fillRect(12, 45, 18, 4);
      g.restore();
    },
  },
  {
    id: 'topeng-balaclava-kit',
    code: 'PD-M06',
    name: 'TOPENG BALACLAVA + GAITER KIT',
    subtitle: 'TOPENG LABS // ANONYMITY LVL 9',
    category: 'ACCESSORIES',
    character: 'TOPENG',
    outfitKey: 'TOPENG_TANK',
    price: 34,
    badge: 'RESTOCKED',
    colors: ['#d8261c', '#ece8df'],
    sizes: ['ONE SIZE'],
    desc: 'Ribbed crimson watch-cap balaclava paired with the pleated off-white cloth street gaiter. Guaranteed to survive 4-bit quantization.',
    specs: ['Heavy Ribbed Acrylic Knit', 'Pleated Cotton Canvas Gaiter', 'Anti-Surveillance Silhouette', 'Machine Wash Cold'],
    drawPreview(g, w, h, t) {
      g.fillStyle = '#12131a'; g.fillRect(0, 0, w, h);
      const bob = Math.sin(t * 2.2 + 5) * 4;
      g.save(); g.translate(w / 2, h / 2 + bob);
      // Red dome
      g.fillStyle = '#d8261c';
      g.beginPath(); g.arc(0, -14, 38, Math.PI, 0); g.fill();
      g.fillRect(-40, -18, 80, 14);
      // Eye band
      g.fillStyle = '#9a6744'; g.fillRect(-32, -4, 64, 16);
      g.fillStyle = '#111'; g.fillRect(-20, 1, 12, 7); g.fillRect(8, 1, 12, 7);
      // White gaiter
      g.fillStyle = '#ece8df'; g.fillRect(-34, 12, 68, 38);
      g.strokeStyle = '#c8c2b4'; g.lineWidth = 2;
      for (let y = 20; y <= 44; y += 8) { g.beginPath(); g.moveTo(-32, y); g.lineTo(32, y); g.stroke(); }
      g.restore();
    },
  },
  {
    id: 'homers-visor',
    code: 'PD-M07',
    name: "HOMER'S 'III' NIGHT SHIFT VISOR",
    subtitle: 'JAX SIGNATURE HEADWEAR',
    category: 'ACCESSORIES',
    character: 'JAX',
    outfitKey: 'JAX',
    price: 28,
    badge: 'CLASSIC',
    colors: ['#c8242c', '#f3eee2'],
    sizes: ['ONE SIZE'],
    desc: 'Curved translucent-brim diner visor in Homer\'s crimson with cream piping and the Roman numeral III emblem on the brow.',
    specs: ['Curved Low-Poly Brim', 'Velcro Back Strap', 'Embroidered III Brow Crest', '24H Fry-Line Approved'],
    drawPreview(g, w, h, t) {
      g.fillStyle = '#141114'; g.fillRect(0, 0, w, h);
      const bob = Math.sin(t * 2.2 + 0.5) * 4;
      g.save(); g.translate(w / 2, h / 2 + bob);
      g.fillStyle = '#c8242c';
      g.fillRect(-44, -14, 88, 22);
      g.fillStyle = '#f3eee2';
      g.fillRect(-44, -14, 88, 3);
      g.fillRect(-44, 5, 88, 3);
      g.font = 'bold 14px monospace'; g.textAlign = 'center';
      g.fillText('III', 0, 2);
      // Curved bill
      g.fillStyle = '#e0525a';
      g.beginPath(); g.moveTo(-46, 8); g.quadraticCurveTo(0, 34, 46, 8); g.closePath(); g.fill();
      g.restore();
    },
  },
  {
    id: 'bunker-toaster-vinyl',
    code: 'PD-M08',
    name: 'BUNKER TOASTER 3000 + OST CASSETTE',
    subtitle: 'COLLECTIBLE DESK ARTIFACT + SCORE TAPE',
    category: 'COLLECTIBLES',
    character: 'ATHENA',
    outfitKey: 'ATHENA_STAGE',
    price: 55,
    badge: 'ARTIFACT',
    colors: ['#d8dde6', '#ff3b30', '#ffd43b'],
    sizes: ['ONE SIZE'],
    desc: '1:3 scale low-poly chrome Bunker Toaster desk collectible bundled with the 9-minute DEATH OF INTERESTING THINGS soundtrack on ferro-chrome cassette + digital WAV/MP3 download.',
    specs: ['Spring-Loaded Toast Slots', 'Includes 48kHz OST Download', 'Numbered Edition of 300', 'Designed by Topeng & Athena'],
    drawPreview(g, w, h, t) {
      g.fillStyle = '#0e1118'; g.fillRect(0, 0, w, h);
      const bob = Math.sin(t * 2.2 + 1.5) * 4;
      g.save(); g.translate(w / 2, h / 2 + bob);
      // Toast popping up
      const ty = -34 - Math.abs(Math.sin(t * 3)) * 12;
      g.fillStyle = '#d4944a';
      g.fillRect(-26, ty, 20, 22);
      g.fillRect(6, ty, 20, 22);
      // Chrome toaster body
      g.fillStyle = '#d8dde6';
      g.fillRect(-42, -20, 84, 54);
      g.fillStyle = '#9aa4b8';
      g.fillRect(-42, -20, 12, 54);
      // Slots & dial
      g.fillStyle = '#181a22';
      g.fillRect(-46, 32, 92, 7);
      g.fillStyle = '#ff3b30';
      g.beginPath(); g.arc(26, 14, 6, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#111'; g.font = 'bold 8px monospace'; g.textAlign = 'center';
      g.fillText('P(●) 3000', -6, 12);
      g.restore();
    },
  },
];

export function renderMerchGraphic(canvas, item, t = 0) {
  if (!canvas || !item || typeof item.drawPreview !== 'function') return;
  const g = canvas.getContext('2d');
  if (!g) return;
  item.drawPreview(g, canvas.width, canvas.height, t);
}


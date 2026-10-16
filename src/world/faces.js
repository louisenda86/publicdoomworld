// Painted anime faces (128x128, nearest filtered) — one texture per expression, cached per character.
import { ptex, shade, noiseFill, mixc } from './tex.js';

// face params: skin, iris, lash, brow, eye ('round'|'sharp'|'tired'|'soft'), blush, mask ('balaclava')
export function faceTex(id, P, eyes = 'open', mouth = 'closed') {
  return ptex(`face:${id}:${eyes}:${mouth}`, 128, 128, (g, w, h, R) => {
    const skin = P.skin;
    // base skin with soft side shading (painted light like PS1 textures)
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      const dx = (x - 64) / 64, dy = (y - 64) / 64;
      const f = 1.02 - 0.16 * Math.pow(Math.abs(dx), 2.2) - (y > 108 ? (y - 108) / 120 : 0) + (R() - 0.5) * 0.03;
      g.fillStyle = shade(skin, f); g.fillRect(x, y, 1, 1);
    }
    if (P.mask === 'balaclava') {
      // red knit everywhere except an eye slot; white gaiter fabric below the nose bridge
      for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
        const slot = y > 50 && y < 84 && x > 16 && x < 112 && !(y > 78 && (x < 26 || x > 102));
        if (slot) continue;
        const knit = ((x >> 1) + (y >> 2)) % 2 ? 0.94 : 1.02;
        const col = y >= 84 ? shade('#e8e4da', knit * (0.97 + (R() - 0.5) * 0.08)) : shade(P.knit || '#d8261c', knit * (0.98 + (R() - 0.5) * 0.1) * (1 - 0.12 * Math.abs((x - 64) / 64)));
        g.fillStyle = col; g.fillRect(x, y, 1, 1);
      }
      // seam shadow along the slot edge
      g.fillStyle = 'rgba(60,0,0,0.45)'; g.fillRect(17, 50, 95, 2); g.fillStyle = 'rgba(80,70,60,0.35)'; g.fillRect(17, 83, 95, 2);
    }
    const EY = P.eyeY ?? 71, EX = P.eyeX ?? 26, EW = P.eyeW ?? 29, EH = P.eyeH ?? 33;
    const eye = (cx, side) => drawEye(g, cx, EY, EW, EH, side, P, eyes);
    if (P.cyclops) drawEye(g, 64, EY - 2, EW * 1.55, EH * 1.35, 1, { ...P, lookIn: 0 }, eyes); else { eye(64 - EX, -1); eye(64 + EX, 1); }
    // brows
    g.strokeStyle = P.brow; g.lineCap = 'round';
    const browY = EY - EH * 0.78 - (eyes === 'wide' ? 4 : eyes === 'scared' ? 7 : 0) + (eyes === 'angry' ? 3 : 0);
    if (P.cyclops) { g.lineWidth = 6; g.beginPath(); g.moveTo(34, browY - 8 + (eyes === 'angry' ? 0 : 6)); g.quadraticCurveTo(64, browY - 4 + (eyes === 'angry' ? 14 : 0), 94, browY - 8 + (eyes === 'angry' ? 0 : 6)); g.stroke(); }
    else for (const s of [-1, 1]) {
      const bx = 64 + s * EX; g.lineWidth = P.mask ? 4 : 2.6; g.beginPath();
      if (eyes === 'scared' || eyes === 'sad2') { g.moveTo(bx - s * 13, browY - 6); g.quadraticCurveTo(bx, browY - 7, bx + s * 12, browY + 4); }
      else if (eyes === 'tired') { g.moveTo(bx - s * 13, browY + 1); g.quadraticCurveTo(bx, browY - 4, bx + s * 12, browY + 3); }
      else if (eyes === 'sad') { g.moveTo(bx - s * 13, browY - 2); g.quadraticCurveTo(bx, browY - 5, bx + s * 12, browY + 4); }
      else if (eyes === 'angry' || P.eye === 'sharp') { g.moveTo(bx - s * 13, browY + (eyes === 'angry' ? 7 : 5)); g.lineTo(bx + s * 13, browY - 3); }
      else if (eyes === 'sad' || eyes === 'tired' || P.eye === 'tired') { g.moveTo(bx - s * 13, browY + 3); g.quadraticCurveTo(bx, browY - 3, bx + s * 12, browY - 1); }
      else { g.moveTo(bx - s * 13, browY + 1); g.quadraticCurveTo(bx, browY - 4, bx + s * 12, browY + 1); }
      g.stroke();
    }
    if (P.mask === 'balaclava') return;
    if (P.beard) { // short boxed beard + moustache, stubble dots
      g.fillStyle = P.beard; g.beginPath(); g.moveTo(14, 84); g.quadraticCurveTo(18, 118, 64, 126); g.quadraticCurveTo(110, 118, 114, 84); g.lineTo(104, 86); g.quadraticCurveTo(98, 112, 64, 114); g.quadraticCurveTo(30, 112, 24, 86); g.closePath(); g.fill();
      g.fillRect(48, 94, 32, 5); g.beginPath(); g.ellipse(64, 114, 16, 9, 0, 0, 7); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 120; i++) { const x = 20 + R() * 88, y = 86 + R() * 38; g.fillRect(x, y, 1, 1); }
    }
    if (P.glasses) { g.strokeStyle = P.glasses; g.lineWidth = 3; for (const s2 of [-1, 1]) { g.beginPath(); g.roundRect(64 + s2 * EX - 17, EY - 17, 34, 32, 6); g.stroke(); } g.beginPath(); g.moveTo(64 - EX + 17, EY - 6); g.lineTo(64 + EX - 17, EY - 6); g.stroke(); }
    // nose: tiny shadow tick
    g.fillStyle = shade(skin, 0.78); g.fillRect(64, 88, 2, 4); g.fillStyle = shade(skin, 0.86); g.fillRect(62, 92, 3, 1);
    if (P.blush) { g.fillStyle = 'rgba(240,110,120,0.35)'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(64 + s * 30, 90, 9, 4, 0, 0, 7); g.fill(); } }
    if (P.eye === 'tired') { g.strokeStyle = 'rgba(90,60,90,0.45)'; g.lineWidth = 1.5; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(64 + s * EX - 10, EY + EH * 0.62); g.quadraticCurveTo(64 + s * EX, EY + EH * 0.74, 64 + s * EX + 10, EY + EH * 0.62); g.stroke(); } }
    drawMouth(g, mouth, skin, P);
  });
}

function drawEye(g, cx, cy, ew, eh, side, P, state) {
  const lash = P.lash || '#1d1418';
  if (state === 'closed' || state === 'happy') {
    g.strokeStyle = lash; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath();
    if (state === 'happy') { g.moveTo(cx - ew / 2, cy + 2); g.quadraticCurveTo(cx, cy - eh * 0.45, cx + ew / 2, cy + 2); }
    else { g.moveTo(cx - ew / 2, cy - 1); g.quadraticCurveTo(cx, cy + eh * 0.22, cx + ew / 2, cy - 1); }
    g.stroke(); return;
  }
  const open = state === 'half' ? 0.5 : state === 'wide' ? 1.12 : state === 'scared' ? 1.2 : state === 'tired' ? 0.38 : 1;
  const irisK = state === 'scared' ? 0.55 : 1;
  const top = cy - eh * 0.5 * open, bot = cy + eh * 0.5;
  // sclera
  g.save(); g.beginPath();
  g.moveTo(cx - ew / 2, cy + eh * 0.05); g.quadraticCurveTo(cx - ew * 0.45, top, cx, top);
  g.quadraticCurveTo(cx + ew * 0.5, top, cx + ew / 2 + (P.eye === 'sharp' ? 3 * side : 0), cy - eh * (P.eye === 'sharp' ? 0.1 : 0.0));
  g.quadraticCurveTo(cx + ew * 0.45, bot, cx, bot); g.quadraticCurveTo(cx - ew * 0.45, bot, cx - ew / 2, cy + eh * 0.05);
  g.closePath(); g.fillStyle = '#fbf8f4'; g.fill(); g.clip();
  // iris (tall ellipse) with gradient, pupil, highlights
  const iw = ew * (P.eye === 'sharp' ? 0.3 : 0.36) * irisK, ih = eh * (P.eye === 'sharp' ? 0.62 : 0.46) * irisK, ix = cx + side * -1 * (P.lookIn ?? 1), iy = cy + eh * 0.08;
  const gr = g.createLinearGradient(0, iy - ih, 0, iy + ih); gr.addColorStop(0, shade(P.iris, 0.45)); gr.addColorStop(0.55, P.iris); gr.addColorStop(1, shade(P.iris, 1.35));
  g.fillStyle = gr; g.beginPath(); g.ellipse(ix, iy, iw, ih, 0, 0, 7); g.fill();
  g.fillStyle = shade(P.iris, 0.25); g.beginPath(); g.ellipse(ix, iy + 1, iw * 0.45, ih * 0.5, 0, 0, 7); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(ix - iw * 0.35, iy - ih * 0.42, iw * 0.32, ih * 0.22, 0, 0, 7); g.fill();
  g.fillRect(Math.round(ix + iw * 0.3), Math.round(iy + ih * 0.3), 2, 2);
  // upper lid shadow
  g.fillStyle = 'rgba(80,40,60,0.25)'; g.fillRect(cx - ew, top - 2, ew * 2, eh * 0.18);
  if (state === 'tired') { g.strokeStyle = 'rgba(220,40,40,0.75)'; g.lineWidth = 1; for (let k = 0; k < 5; k++) { g.beginPath(); const sx0 = cx + side * (ew * 0.5 - 1), sy0 = cy + (k - 2) * 2; g.moveTo(sx0, sy0); g.lineTo(sx0 - side * (4 + k % 3 * 2), sy0 + (k % 2 ? 2 : -2)); g.stroke(); } }
  g.restore();
  if (state === 'tired') { g.strokeStyle = 'rgba(70,30,60,0.55)'; g.lineWidth = 2; for (let k = 0; k < 2; k++) { g.beginPath(); g.moveTo(cx - ew * 0.42, bot + 2 + k * 3); g.quadraticCurveTo(cx, bot + 6 + k * 3, cx + ew * 0.42, bot + 2 + k * 3); g.stroke(); } }
  // lashes: thick top line with a flick
  g.strokeStyle = lash; g.lineCap = 'round'; g.lineWidth = 3.4; g.beginPath();
  g.moveTo(cx - ew / 2 - 1, cy + eh * 0.04); g.quadraticCurveTo(cx - ew * 0.45, top - 1, cx, top - 1); g.quadraticCurveTo(cx + ew * 0.52, top - 1, cx + ew / 2 + 3 * side, cy - eh * 0.12);
  g.stroke();
  if (P.lashFlick) { g.lineWidth = 2; g.beginPath(); g.moveTo(cx + side * ew / 2, cy - eh * 0.1); g.lineTo(cx + side * (ew / 2 + 5), cy - eh * 0.28); g.stroke(); }
  g.lineWidth = 1.4; g.strokeStyle = shade(lash, 1.6); g.beginPath(); g.moveTo(cx - ew * 0.3, bot + 0.5); g.lineTo(cx + ew * 0.3, bot + 0.5); g.stroke();
}

function drawMouth(g, m, skin, P) {
  const mx = 64, my = 102, lip = P.lip || shade(skin, 0.55), inside = '#6d2630';
  g.lineCap = 'round'; g.strokeStyle = lip; g.lineWidth = 2;
  const open = (w, hgt) => { g.fillStyle = inside; g.beginPath(); g.ellipse(mx, my, w, hgt, 0, 0, 7); g.fill(); if (hgt > 3) { g.fillStyle = '#e88b93'; g.beginPath(); g.ellipse(mx, my + hgt * 0.5, w * 0.6, hgt * 0.35, 0, 0, 7); g.fill(); } g.fillStyle = '#ffffff'; g.fillRect(mx - w * 0.6, my - hgt, w * 1.2, Math.max(1, hgt * 0.25)); };
  switch (m) {
    case 'smile': g.beginPath(); g.moveTo(mx - 8, my - 2); g.quadraticCurveTo(mx, my + 5, mx + 8, my - 2); g.stroke(); break;
    case 'grin': g.fillStyle = inside; g.beginPath(); g.moveTo(mx - 10, my - 3); g.quadraticCurveTo(mx, my + 10, mx + 10, my - 3); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.fillRect(mx - 8, my - 3, 16, 3); break;
    case 'smirk': g.beginPath(); g.moveTo(mx - 6, my); g.quadraticCurveTo(mx + 2, my + 2, mx + 8, my - 4); g.stroke(); break;
    case 'frown': g.beginPath(); g.moveTo(mx - 7, my + 2); g.quadraticCurveTo(mx, my - 3, mx + 7, my + 2); g.stroke(); break;
    case 'flat': g.beginPath(); g.moveTo(mx - 6, my); g.lineTo(mx + 6, my); g.stroke(); break;
    case 'o': open(4, 5); break;
    case 'talk1': open(5, 2.5); break;
    case 'talk2': open(6, 5); break;
    case 'open': open(7, 7); break;
    case 'shock': open(6, 9); break;
    default: g.beginPath(); g.moveTo(mx - 5, my); g.quadraticCurveTo(mx, my + 1.5, mx + 5, my); g.stroke();
  }
}

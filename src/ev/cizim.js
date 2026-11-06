// Ev modu çizimi: Canvas 2D ile sıcak, düşük poligonlu izometrik ev (motor yok, görsel paket yok).
import { ODALAR, DIS, ESYALAR, ALANLAR, KAPILAR, DUVAR_Y, DIS_KAPI } from './plan.js';

/** Kamera: dünya (x, y, z) → ekran. */
export class Kamera {
  constructor() { this.zum = 1; this.mx = 9; this.my = 9; this.W = 360; this.H = 640; this.oy = 0.5; }
  get tw() { return 46 * this.zum; } // karo genişliği (px / birim)
  get th() { return 23 * this.zum; }
  get tz() { return 30 * this.zum; }
  ekran(x, y, z = 0) {
    const a = (x - y) - (this.mx - this.my), b = (x + y) - (this.mx + this.my);
    return [this.W / 2 + a * this.tw / 2, this.H * this.oy + b * this.th / 2 - z * this.tz];
  }
  dunya(sx, sy) {
    const a = (sx - this.W / 2) / (this.tw / 2) + (this.mx - this.my);
    const b = (sy - this.H * this.oy) / (this.th / 2) + (this.mx + this.my);
    return [(a + b) / 2, (b - a) / 2];
  }
}

const hex = (c) => { if (c[0] !== '#') { const m = c.match(/[\d.]+/g) ?? [0, 0, 0]; return m.slice(0, 3).map(Number); } const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export function ton(c, k) {
  const [r, g, b] = hex(c);
  const f = (v) => Math.max(0, Math.min(255, Math.round(k >= 1 ? v + (255 - v) * (k - 1) : v * k)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

function poli(ctx, pts, dolgu, cizgi) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  if (dolgu) { ctx.fillStyle = dolgu; ctx.fill(); }
  if (cizgi) { ctx.strokeStyle = cizgi; ctx.lineWidth = 1; ctx.stroke(); }
}

/** Kutu: üst + görünen iki yan yüz. Hafif "low-poly" için üst yüzde ince bir köşegen ton farkı. */
export function kutu(ctx, k, x, y, g, d, z, h, renk, ops = {}) {
  const P = (a, b, c) => k.ekran(a, b, c);
  const z1 = z + h;
  const ust = [P(x, y, z1), P(x + g, y, z1), P(x + g, y + d, z1), P(x, y + d, z1)];
  const onY = [P(x, y + d, z1), P(x + g, y + d, z1), P(x + g, y + d, z), P(x, y + d, z)];
  const onX = [P(x + g, y, z1), P(x + g, y + d, z1), P(x + g, y + d, z), P(x + g, y, z)];
  const kenar = ops.kenar ?? ton(renk, 0.62);
  if (h > 0.001) { poli(ctx, onY, ton(renk, 0.74), kenar); poli(ctx, onX, ton(renk, 0.88), kenar); }
  poli(ctx, ust, renk, kenar);
  if (ops.faset !== false && g * d > 0.3) poli(ctx, [ust[0], ust[1], ust[2]], ton(renk, 1.06));
  return { ust, onY, onX };
}

// Yüz üstünde (u, v ∈ 0..1) nokta: X yüzü (x = x+g; u: y yönü, v: z yönü), Y yüzü (y = y+d; u: x yönü)
const yuzX = (k, e, u, v, z0 = e.z ?? 0) => k.ekran(e.x + e.g, e.y + e.d * u, z0 + e.h * v);
const yuzY = (k, e, u, v, z0 = e.z ?? 0) => k.ekran(e.x + e.g * u, e.y + e.d, z0 + e.h * v);
function daire(ctx, [x, y], r, dolgu, cizgi) { ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.9, 0, 0, Math.PI * 2); if (dolgu) { ctx.fillStyle = dolgu; ctx.fill(); } if (cizgi) { ctx.strokeStyle = cizgi; ctx.lineWidth = 1.5; ctx.stroke(); } }

/** Eşya çizimi (türüne göre birkaç kutu + detay). */
export function esyaCiz(ctx, k, e, durum = {}) {
  const z = e.z ?? 0, R = e.renk;
  switch (e.t) {
    case 'yatak': {
      kutu(ctx, k, e.x, e.y, e.g, e.d, z, e.h * 0.55, R);
      kutu(ctx, k, e.x + 0.05, e.y + 0.05, e.g - 0.1, e.d - 0.1, z + e.h * 0.55, e.h * 0.35, '#F3F0EA');
      kutu(ctx, k, e.x + 0.08, e.y + e.d * 0.32, e.g - 0.16, e.d * 0.66, z + e.h * 0.9, 0.08, e.ust ?? '#A9BFB2');
      kutu(ctx, k, e.x + 0.15, e.y + 0.12, e.g * 0.38, 0.45, z + e.h * 0.9, 0.12, '#FFFFFF');
      kutu(ctx, k, e.x + e.g * 0.55, e.y + 0.12, e.g * 0.38, 0.45, z + e.h * 0.9, 0.12, '#FFFFFF');
      kutu(ctx, k, e.x, e.y, e.g, 0.12, z, e.h * 1.6, R);
      break;
    }
    case 'kanepe': {
      kutu(ctx, k, e.x, e.y, e.g, e.d, z, e.h * 0.5, R);
      kutu(ctx, k, e.x + e.g * 0.7, e.y, e.g * 0.3, e.d, z + e.h * 0.5, e.h * 0.5, ton(R, 0.92));
      for (let i = 0; i < 3; i++) kutu(ctx, k, e.x + e.g * 0.02, e.y + 0.05 + i * (e.d - 0.1) / 3, e.g * 0.68, (e.d - 0.1) / 3 - 0.04, z + e.h * 0.5, 0.1, ton(R, 1.08));
      kutu(ctx, k, e.x + e.g * 0.4, e.y + e.d * 0.2, 0.35, 0.35, z + e.h * 0.62, 0.22, '#E6E2D8');
      break;
    }
    case 'koltuk': {
      kutu(ctx, k, e.x, e.y, e.g, e.d, z, e.h * 0.5, R);
      kutu(ctx, k, e.x + e.g - 0.3, e.y, 0.3, e.d, z + e.h * 0.5, e.h * 0.5, ton(R, 0.93));
      kutu(ctx, k, e.x, e.y, e.g, 0.25, z + e.h * 0.5, e.h * 0.3, ton(R, 0.96));
      break;
    }
    case 'masa': {
      const ayak = Math.min(0.08, e.g * 0.1);
      for (const [ax, ay] of [[0, 0], [e.g - ayak, 0], [0, e.d - ayak], [e.g - ayak, e.d - ayak]]) kutu(ctx, k, e.x + ax, e.y + ay, ayak, ayak, z, e.h - 0.06, ton(R, 0.8), { faset: false });
      kutu(ctx, k, e.x, e.y, e.g, e.d, z + e.h - 0.06, 0.06, R);
      if (e.id === 'ofismasa') {
        kutu(ctx, k, e.x + 0.35, e.y + 0.4, 0.06, 1.3, z + e.h, 0.45, '#1A1C22');
        poli(ctx, [k.ekran(e.x + 0.41, e.y + 0.47, e.h + 0.42), k.ekran(e.x + 0.41, e.y + 1.63, e.h + 0.42), k.ekran(e.x + 0.41, e.y + 1.63, e.h + 0.06), k.ekran(e.x + 0.41, e.y + 0.47, e.h + 0.06)], durum.gece ? '#9EC7FF' : '#6E8FC9');
      }
      if (e.id === 'yemekmasa') for (let i = 0; i < 3; i++) for (const sx of [-0.5, e.g + 0.05]) kutu(ctx, k, e.x + sx, e.y + 0.2 + i * 0.75, 0.45, 0.45, 0, 0.45, '#EFEDE8');
      if (e.id === 'bmasa') for (const [sx, sy] of [[-0.5, 0.2], [-0.5, 0.85], [e.g + 0.05, 0.2], [e.g + 0.05, 0.85]]) kutu(ctx, k, e.x + sx, e.y + sy, 0.45, 0.45, 0, 0.45, '#2A2C30');
      break;
    }
    case 'sandalye': {
      kutu(ctx, k, e.x + 0.25, e.y + 0.25, 0.1, 0.1, z, 0.45, '#555');
      kutu(ctx, k, e.x, e.y, e.g, e.d, z + 0.45, 0.1, R);
      kutu(ctx, k, e.x + e.g - 0.12, e.y, 0.12, e.d, z + 0.55, 0.5, R);
      break;
    }
    case 'aynali': {
      const b = kutu(ctx, k, e.x, e.y, e.g, e.d, z, e.h, R);
      for (let i = 1; i < 3; i++) { const u = i / 3; ctx.strokeStyle = ton(R, 0.6); ctx.beginPath(); const a = yuzY(k, e, u, 0.05), c = yuzY(k, e, u, 0.95); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke(); }
      poli(ctx, [yuzY(k, e, 0.36, 0.1), yuzY(k, e, 0.64, 0.1), yuzY(k, e, 0.64, 0.9), yuzY(k, e, 0.36, 0.9)], 'rgba(190,215,230,0.75)');
      void b; break;
    }
    case 'dolap': case 'cekmece': case 'aski': {
      kutu(ctx, k, e.x, e.y, e.g, e.d, z, e.h, R);
      const n = e.t === 'cekmece' ? 4 : 2;
      ctx.strokeStyle = ton(R, 0.6);
      for (let i = 1; i < n; i++) { const v = i / n; const a = e.t === 'cekmece' ? yuzX(k, e, 0.05, v) : yuzX(k, e, v, 0.05); const c = e.t === 'cekmece' ? yuzX(k, e, 0.95, v) : yuzX(k, e, v, 0.95); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke(); }
      if (e.t === 'cekmece') daire(ctx, k.ekran(e.x + e.g * 0.5, e.y + 0.05, e.h + 0.55), 13 * k.zum, 'rgba(200,222,235,0.95)', '#D8D2C6');
      if (e.t === 'aski') { kutu(ctx, k, e.x + 0.05, e.y + 0.2, 0.3, 0.45, e.h * 0.55, 0.6, '#2E3B55'); kutu(ctx, k, e.x + 0.05, e.y + 0.75, 0.3, 0.4, e.h * 0.5, 0.65, '#C44B4B'); }
      break;
    }
    case 'raf': {
      kutu(ctx, k, e.x, e.y, e.g, e.d, z, e.h, R);
      const renkler = ['#E57373', '#FFC94D', '#81C784', '#64B5F6', '#B9A3D6'];
      for (let i = 0; i < 4; i++) kutu(ctx, k, e.x + 0.08, e.y + 0.15 + i * (e.d - 0.3) / 4, e.g - 0.16, (e.d - 0.3) / 4 - 0.08, e.h, 0.18, renkler[(i + e.id.length) % 5]);
      break;
    }
    case 'evcik': {
      kutu(ctx, k, e.x, e.y, e.g, e.d, z, e.h * 0.7, R);
      cati(ctx, k, e.x, e.y, e.g, e.d, e.h * 0.7, e.h * 0.35, '#F2A7B5');
      break;
    }
    case 'hasir': {
      kutu(ctx, k, e.x, e.y, e.g, e.d, z, e.h, R);
      ctx.strokeStyle = ton(R, 0.72); ctx.lineWidth = 1;
      const n = 8;
      for (let i = 0; i <= n; i++) { const a = k.ekran(e.x + e.g * i / n, e.y + e.d, 0.05), c = k.ekran(e.x + e.g * i / n, e.y + e.d, e.h - 0.05); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke(); }
      for (let j = 1; j < 6; j++) { const a = k.ekran(e.x, e.y + e.d, e.h * j / 6), c = k.ekran(e.x + e.g, e.y + e.d, e.h * j / 6); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke(); }
      break;
    }
    case 'tv': {
      kutu(ctx, k, e.x, e.y, e.g, e.d, z, e.h, R);
      kutu(ctx, k, e.x + e.g - 0.3, e.y + 0.2, 0.08, e.d - 0.4, e.h, 1.0, '#141518');
      poli(ctx, [k.ekran(e.x + e.g - 0.22, e.y + 0.27, e.h + 0.95), k.ekran(e.x + e.g - 0.22, e.y + e.d - 0.27, e.h + 0.95), k.ekran(e.x + e.g - 0.22, e.y + e.d - 0.27, e.h + 0.07), k.ekran(e.x + e.g - 0.22, e.y + 0.27, e.h + 0.07)], '#23262E');
      kutu(ctx, k, e.x + 0.1, e.y + 0.1, 0.3, 0.3, e.h, 0.35, '#4E8B4E');
      break;
    }
    case 'robot': {
      const [cx, cy] = k.ekran(e.x + e.g / 2 + (durum.robot?.[0] ?? 0), e.y + e.d / 2 + (durum.robot?.[1] ?? 0), 0.08);
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(cx, cy + 4 * k.zum, 12 * k.zum, 6 * k.zum, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = R; ctx.beginPath(); ctx.ellipse(cx, cy, 11 * k.zum, 5.6 * k.zum, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4A4D55'; ctx.beginPath(); ctx.ellipse(cx, cy - 2 * k.zum, 4 * k.zum, 2 * k.zum, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = durum.robotCalisiyor ? '#8FBF9A' : '#E8C35A'; ctx.beginPath(); ctx.arc(cx + 5 * k.zum, cy - 1 * k.zum, 1.6 * k.zum, 0, 7); ctx.fill();
      break;
    }
    case 'dyson': {
      kutu(ctx, k, e.x + 0.12, e.y + 0.12, 0.06, 0.06, 0.1, e.h - 0.1, '#9A8BC0', { faset: false });
      kutu(ctx, k, e.x, e.y, e.g, e.d, 0.55, 0.28, R);
      kutu(ctx, k, e.x + 0.02, e.y + 0.02, 0.26, 0.26, 0, 0.1, '#3B3D44');
      break;
    }
    case 'makine2': {
      for (const [z0, ad] of [[0, 'ç'], [e.h / 2, 'k']]) {
        const ee = { ...e, z: z0, h: e.h / 2 - 0.02 };
        kutu(ctx, k, e.x, e.y, e.g, e.d, z0, e.h / 2 - 0.02, R);
        const c = yuzX(k, ee, 0.5, 0.45, z0);
        daire(ctx, c, 9 * k.zum, ad === 'ç' && durum.camasirCalisiyor ? '#7FB3D8' : '#C9D3DA', '#8E979E');
      }
      break;
    }
    case 'bulasik': {
      kutu(ctx, k, e.x, e.y, e.g, e.d, z, e.h, R);
      poli(ctx, [yuzY(k, e, 0.1, 0.85), yuzY(k, e, 0.9, 0.85), yuzY(k, e, 0.9, 0.95), yuzY(k, e, 0.1, 0.95)], '#9AA1A8');
      break;
    }
    case 'buzdolabi': {
      kutu(ctx, k, e.x, e.y, e.g, e.d, z, e.h, R);
      ctx.strokeStyle = '#A9AEB3'; ctx.lineWidth = 1.2;
      const a = yuzY(k, e, 0.05, 0.62), c = yuzY(k, e, 0.95, 0.62); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke();
      for (const v of [0.48, 0.75]) { const p = yuzY(k, e, 0.85, v), q = yuzY(k, e, 0.85, v + 0.1); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.lineWidth = 2; ctx.stroke(); }
      for (let i = 0; i < 4; i++) daire(ctx, yuzY(k, e, 0.2 + i * 0.15, 0.8 - (i % 2) * 0.06), 2.2 * k.zum, ['#E57373', '#FFC94D', '#81C784', '#64B5F6'][i]);
      break;
    }
    case 'tezgah': {
      kutu(ctx, k, e.x, e.y, e.g, e.d, z, e.h - 0.05, R);
      kutu(ctx, k, e.x - 0.02, e.y - 0.02, e.g + 0.04, e.d + 0.04, z + e.h - 0.05, 0.05, '#F1EFEA');
      if (e.id === 'tezgah') kutu(ctx, k, e.x, e.y, 0.4, e.d, 1.45, 0.75, R);
      if (e.id === 'kahvetezgah') kutu(ctx, k, e.x, e.y, e.g, 0.35, 1.45, 0.75, R);
      break;
    }
    case 'kahve': {
      kutu(ctx, k, e.x, e.y, e.g, e.d, z, e.h, R);
      kutu(ctx, k, e.x + 0.05, e.y + 0.05, e.g - 0.1, 0.12, z + e.h, 0.08, '#3B3D44');
      daire(ctx, yuzY(k, e, 0.5, 0.3), 2.5 * k.zum, '#F3F1EE');
      if (durum.kahveBuhar) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5; const [bx, by] = k.ekran(e.x + e.g / 2, e.y + e.d, z + e.h + 0.1); const t = durum.t ?? 0; ctx.beginPath(); for (let i = 0; i < 12; i++) ctx.lineTo(bx + Math.sin(t * 3 + i * 0.7) * 3, by - i * 2.5 * k.zum); ctx.stroke(); }
      break;
    }
    case 'eviye': {
      kutu(ctx, k, e.x, e.y, e.g, e.d, z, e.h, '#C9CDD1');
      kutu(ctx, k, e.x + 0.08, e.y + 0.1, e.g - 0.16, e.d - 0.2, z + e.h, 0.01, '#9EA5AC');
      kutu(ctx, k, e.x + e.g - 0.1, e.y + e.d / 2, 0.05, 0.05, z + e.h, 0.25, '#B0B5BA');
      break;
    }
    case 'ocak': {
      kutu(ctx, k, e.x, e.y, e.g, e.d, z, e.h, R);
      for (const [u, v] of [[0.3, 0.25], [0.7, 0.25], [0.3, 0.72], [0.7, 0.72]]) { const [px, py] = k.ekran(e.x + e.g * u, e.y + e.d * v, z + e.h + 0.005); ctx.strokeStyle = '#555B63'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(px, py, 5 * k.zum, 2.5 * k.zum, 0, 0, 7); ctx.stroke(); }
      break;
    }
    case 'cop': {
      kutu(ctx, k, e.x, e.y, e.g, e.d, z, e.h, R);
      if (durum.copDolu) kutu(ctx, k, e.x + 0.5, e.y + 0.05, 0.4, 0.4, 0, 0.42, '#3E4350');
      break;
    }
    case 'klozet': {
      kutu(ctx, k, e.x, e.y, e.g, 0.22, z, e.h + 0.35, R);
      kutu(ctx, k, e.x + 0.06, e.y + 0.2, e.g - 0.12, e.d - 0.2, z, e.h, R);
      const [px, py] = k.ekran(e.x + e.g / 2, e.y + 0.2 + (e.d - 0.2) / 2, e.h + 0.005);
      ctx.fillStyle = '#D7DEE2'; ctx.beginPath(); ctx.ellipse(px, py, 6 * k.zum, 3.4 * k.zum, 0, 0, 7); ctx.fill();
      break;
    }
    case 'lavabo': {
      kutu(ctx, k, e.x + 0.1, e.y + 0.25, e.g - 0.2, e.d - 0.5, 0, e.h - 0.18, '#E6E6E2');
      kutu(ctx, k, e.x, e.y, e.g, e.d, e.h - 0.18, 0.18, R);
      const [px, py] = k.ekran(e.x + e.g / 2, e.y + e.d / 2, e.h + 0.005);
      ctx.fillStyle = '#CBD6DB'; ctx.beginPath(); ctx.ellipse(px, py, 7 * k.zum, 3.6 * k.zum, 0, 0, 7); ctx.fill();
      // ayna (duvarda)
      const ax = e.x < 10 ? e.x : e.x + e.g;
      poli(ctx, [k.ekran(ax, e.y + 0.1, 1.2), k.ekran(ax, e.y + e.d - 0.1, 1.2), k.ekran(ax, e.y + e.d - 0.1, 1.85), k.ekran(ax, e.y + 0.1, 1.85)], 'rgba(198,222,236,0.92)', '#A9B6BD');
      break;
    }
    case 'kuvet': {
      kutu(ctx, k, e.x, e.y, e.g, e.d, z, e.h, R);
      kutu(ctx, k, e.x + 0.1, e.y + 0.12, e.g - 0.2, e.d - 0.24, z + e.h - 0.02, 0.01, '#B9DCE6');
      break;
    }
    case 'dus': {
      kutu(ctx, k, e.x, e.y, e.g, e.d, z, 0.08, '#E9EEF0');
      ctx.globalAlpha = 0.38; kutu(ctx, k, e.x, e.y, e.g, e.d, 0.08, e.h - 0.08, R, { kenar: '#9FB9BF', faset: false }); ctx.globalAlpha = 1;
      kutu(ctx, k, e.x + e.g - 0.1, e.y + 0.15, 0.06, 0.06, 1.55, 0.3, '#B0B5BA');
      if (durum.dusAkiyor) { ctx.strokeStyle = 'rgba(150,200,230,.85)'; ctx.lineWidth = 1; const t = durum.t ?? 0; for (let i = 0; i < 7; i++) { const [a, b] = k.ekran(e.x + e.g - 0.2 - (i % 3) * 0.1, e.y + 0.25 + (i % 4) * 0.12, 1.5 - ((t * 2 + i * 0.15) % 1) * 1.3); ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(a, b + 5 * k.zum); ctx.stroke(); } }
      break;
    }
    case 'pano': {
      kutu(ctx, k, e.x, e.y, e.g, e.d, z, e.h, '#C99A5B');
      const kag = ['#FFE699', '#F3F1EE', '#FFC9B9', '#CDE8D3'];
      for (let i = 0; i < 4; i++) poli(ctx, [k.ekran(e.x - 0.001, e.y + 0.1 + (i % 2) * 0.62, z + 0.12 + ((i / 2) | 0) * 0.45), k.ekran(e.x - 0.001, e.y + 0.62 + (i % 2) * 0.62, z + 0.12 + ((i / 2) | 0) * 0.45), k.ekran(e.x - 0.001, e.y + 0.62 + (i % 2) * 0.62, z + 0.5 + ((i / 2) | 0) * 0.45), k.ekran(e.x - 0.001, e.y + 0.1 + (i % 2) * 0.62, z + 0.5 + ((i / 2) | 0) * 0.45)], kag[i]);
      break;
    }
    case 'kulube': {
      kutu(ctx, k, e.x, e.y, e.g, e.d, z, e.h, R);
      ctx.strokeStyle = ton(R, 0.6);
      for (let i = 1; i < 6; i++) { const a = yuzX(k, e, i / 6, 0.02), c = yuzX(k, e, i / 6, 0.98); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke(); }
      poli(ctx, [yuzX(k, e, 0.3, 0), yuzX(k, e, 0.7, 0), yuzX(k, e, 0.7, 0.8), yuzX(k, e, 0.3, 0.8)], ton(R, 0.55));
      cati(ctx, k, e.x - 0.1, e.y - 0.1, e.g + 0.2, e.d + 0.2, e.h, 0.45, '#3D4148');
      // Pfand kasası: kulübede biriken şişeler görünür
      const n = Math.min(24, durum.pfandKulube ?? 0);
      if (n > 0) {
        kutu(ctx, k, e.x - 0.7, e.y + 1.0, 0.55, 0.7, 0, 0.32, '#3E7D5A');
        for (let i = 0; i < Math.min(12, Math.ceil(n / 2)); i++) kutu(ctx, k, e.x - 0.65 + (i % 3) * 0.16, e.y + 1.05 + ((i / 3) | 0) * 0.16, 0.08, 0.08, 0.32, 0.22, i % 2 ? '#A7D3B5' : '#E8F0E6', { faset: false });
      }
      break;
    }
    case 'trambolin': {
      const [cx, cy] = k.ekran(e.x + e.g / 2, e.y + e.d / 2, e.h);
      const rx = (e.g / 2) * k.tw * 0.71, ry = (e.d / 2) * k.th * 0.71 * 2 / 2;
      ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(cx, cy + e.h * k.tz, rx, ry, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#2A2D33'; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry); ctx.lineTo(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry + e.h * k.tz); ctx.stroke(); }
      ctx.fillStyle = '#E86FA0'; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#1F2226'; ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.86, ry * 0.86, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(40,45,52,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(cx, cy - 1.3 * k.tz, rx, ry, 0, Math.PI, Math.PI * 2); ctx.stroke();
      break;
    }
    case 'mangal': {
      kutu(ctx, k, e.x + 0.3, e.y + 0.2, 0.15, 0.15, 0, 0.5, '#444');
      kutu(ctx, k, e.x, e.y, e.g, e.d, 0.5, e.h - 0.5, R);
      cati(ctx, k, e.x, e.y, e.g, e.d, e.h, 0.18, '#2E3035');
      break;
    }
    case 'sera': {
      kutu(ctx, k, e.x, e.y, e.g, e.d, 0, 0.12, '#8C8F94');
      for (let i = 0; i < 3; i++) kutu(ctx, k, e.x + 0.25, e.y + 0.3 + i * 0.6, 0.35, 0.35, 0.12, 0.35 + (i % 2) * 0.15, '#5E9B4C');
      ctx.globalAlpha = 0.42; kutu(ctx, k, e.x, e.y, e.g, e.d, 0.12, e.h - 0.6, R, { kenar: '#8FAFAA', faset: false }); cati(ctx, k, e.x, e.y, e.g, e.d, e.h - 0.48, 0.48, R, '#8FAFAA'); ctx.globalAlpha = 1;
      break;
    }
    case 'salincak': {
      ctx.strokeStyle = R; ctx.lineWidth = 3 * k.zum;
      for (const sx of [0, e.g]) { const a = k.ekran(e.x + sx, e.y, 0), b = k.ekran(e.x + sx, e.y + e.d / 2, e.h), c = k.ekran(e.x + sx, e.y + e.d, 0); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.stroke(); }
      const p = k.ekran(e.x, e.y + e.d / 2, e.h), q = k.ekran(e.x + e.g, e.y + e.d / 2, e.h); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
      const t = durum.t ?? 0, s = Math.sin(t * 1.5) * 0.15;
      ctx.lineWidth = 1;
      const o1 = k.ekran(e.x + e.g * 0.5, e.y + e.d / 2 + s, 0.45);
      for (const u of [0.38, 0.62]) { const a = k.ekran(e.x + e.g * u, e.y + e.d / 2, e.h); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(o1[0] + (u - 0.5) * 18 * k.zum, o1[1]); ctx.stroke(); }
      kutu(ctx, k, e.x + e.g * 0.38, e.y + e.d / 2 - 0.12 + s, e.g * 0.24, 0.24, 0.42, 0.05, '#E86FA0');
      break;
    }
    case 'hortum': {
      const [cx, cy] = k.ekran(e.x + e.g / 2, e.y + e.d / 2, 0.2);
      ctx.strokeStyle = R; ctx.lineWidth = 3 * k.zum;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(cx, cy - i * 2 * k.zum, 8 * k.zum, 4 * k.zum, 0, 0, 7); ctx.stroke(); }
      break;
    }
    case 'araba': {
      const yk = e.h * 0.5;
      for (const [u, v] of [[0.18, 0], [0.78, 0], [0.18, 1], [0.78, 1]]) { const [wx, wy] = k.ekran(e.x + e.g * u, e.y + e.d * v, 0.18); ctx.fillStyle = '#1C1D20'; ctx.beginPath(); ctx.ellipse(wx, wy, 6 * k.zum, 6 * k.zum, 0, 0, 7); ctx.fill(); }
      kutu(ctx, k, e.x, e.y, e.g, e.d, 0.15, yk, R);
      kutu(ctx, k, e.x + e.g * 0.25, e.y + 0.08, e.g * 0.5, e.d - 0.16, 0.15 + yk, e.h - yk - 0.15, ton(R, 0.95));
      poli(ctx, [k.ekran(e.x + e.g * 0.27, e.y + e.d - 0.08, 0.2 + yk), k.ekran(e.x + e.g * 0.73, e.y + e.d - 0.08, 0.2 + yk), k.ekran(e.x + e.g * 0.73, e.y + e.d - 0.08, e.h - 0.05), k.ekran(e.x + e.g * 0.27, e.y + e.d - 0.08, e.h - 0.05)], '#2D3A48');
      poli(ctx, [k.ekran(e.x + e.g * 0.75, e.y + 0.12, 0.2 + yk), k.ekran(e.x + e.g * 0.75, e.y + e.d - 0.12, 0.2 + yk), k.ekran(e.x + e.g * 0.75, e.y + e.d - 0.12, e.h - 0.05), k.ekran(e.x + e.g * 0.75, e.y + 0.12, e.h - 0.05)], '#33465A');
      if (e.id === 'araba' && (durum.pfandAraba ?? 0) > 0) { // bagajda Pfand
        kutu(ctx, k, e.x + 0.05, e.y + 0.25, 0.45, 1.0, 0.15 + yk, 0.25, '#3E7D5A');
      }
      break;
    }
    case 'agac': {
      kutu(ctx, k, e.x + e.g / 2 - 0.12, e.y + e.d / 2 - 0.12, 0.24, 0.24, 0, e.h * 0.4, '#6B4A30');
      kutu(ctx, k, e.x + 0.1, e.y + 0.1, e.g - 0.2, e.d - 0.2, e.h * 0.35, e.h * 0.35, R);
      kutu(ctx, k, e.x + 0.3, e.y + 0.3, e.g - 0.6, e.d - 0.6, e.h * 0.7, e.h * 0.3, ton(R, 1.12));
      break;
    }
    case 'beton': {
      kutu(ctx, k, e.x, e.y, e.g, e.d, 0, e.h, R, { faset: false });
      ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 1;
      for (let i = 1; i < e.g; i++) { const a = k.ekran(e.x + i, e.y, e.h), b = k.ekran(e.x + i, e.y + e.d, e.h); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
      for (let j = 1; j < e.d; j++) { const a = k.ekran(e.x, e.y + j, e.h), b = k.ekran(e.x + e.g, e.y + j, e.h); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
      break;
    }
    default: kutu(ctx, k, e.x, e.y, e.g, e.d, z, e.h, R);
  }
}

function cati(ctx, k, x, y, g, d, z, h, renk, kenar) {
  const t1 = k.ekran(x + g / 2, y, z + h), t2 = k.ekran(x + g / 2, y + d, z + h);
  const a = k.ekran(x, y, z), b = k.ekran(x + g, y, z), c = k.ekran(x + g, y + d, z), dd = k.ekran(x, y + d, z);
  poli(ctx, [t1, t2, c, b], ton(renk, 0.9), kenar ?? ton(renk, 0.6));
  poli(ctx, [dd, c, t2], ton(renk, 0.75), kenar ?? ton(renk, 0.6));
  poli(ctx, [a, dd, t2, t1], ton(renk, 1.05), kenar ?? ton(renk, 0.6));
}

/** Zemin: odalar, bahçe çimi, otopark, yol. */
export function zeminCiz(ctx, k, durum) {
  const dort = (x, y, g, d, z = 0) => [k.ekran(x, y, z), k.ekran(x + g, y, z), k.ekran(x + g, y + d, z), k.ekran(x, y + d, z)];
  // otopark + yol
  poli(ctx, dort(0, 18.5, 18, 3.3), '#9A9CA0');
  poli(ctx, dort(0, 21.8, 18, 1.7), '#6E7177');
  ctx.strokeStyle = '#F3F1EE'; ctx.lineWidth = 2 * k.zum; ctx.setLineDash([10 * k.zum, 8 * k.zum]);
  { const a = k.ekran(0, 22.65), b = k.ekran(18, 22.65); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.5;
  for (const px of [0, 3.7, 7.4, 11.1, 14.8]) { const a = k.ekran(px, 18.9), b = k.ekran(px, 21.4); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  // bahçe
  poli(ctx, dort(0, 12.5, 18, 6), '#86AE5C');
  if (durum.cimUzun) { ctx.strokeStyle = '#5E8E3C'; ctx.lineWidth = 1.2; for (let i = 0; i < 160; i++) { const x = (i * 7.3) % 18, y = 15.8 + ((i * 3.7) % 2.6); if (x > 14.6 && x < 17.2 && y < 17.4) continue; const [a, b] = k.ekran(x, y); ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(a + 1.5, b - 5 * k.zum); ctx.stroke(); } }
  // ev zemini
  for (const o of ODALAR) for (const [x, y, g, d] of o.r) poli(ctx, dort(x, y, g, d), o.zemin, ton(o.zemin, 0.85));
  // ev tabanı (dış duvarın altı)
  poli(ctx, [k.ekran(0, 12.5), k.ekran(10, 12.5), k.ekran(10, 12.5, -0.15), k.ekran(0, 12.5, -0.15)], '#9C8B78');
  poli(ctx, [k.ekran(10, 12.5), k.ekran(18, 12.5), k.ekran(18, 12.5, -0.15), k.ekran(10, 12.5, -0.15)], '#9C8B78');
}

/** Duvar parçaları (kesik, alçak) — sıralamaya girecek kutular olarak döner. */
export function duvarKutulari(kenarlar) {
  const T = 0.14, out = [];
  for (const [x1, y1, x2, y2] of kenarlar) {
    if (y1 === y2) out.push({ x: Math.min(x1, x2), y: y1 - T / 2, g: Math.abs(x2 - x1), d: T });
    else out.push({ x: x1 - T / 2, y: Math.min(y1, y2), g: T, d: Math.abs(y2 - y1) });
  }
  return out;
}
export function duvarCiz(ctx, k, w, renk) { kutu(ctx, k, w.x, w.y, w.g, w.d, 0, DUVAR_Y, renk, { faset: false, kenar: ton(renk, 0.7) }); }

/** Çit: bahçe kapısı hariç. */
export function citKutulari() {
  const out = [];
  for (let x = 0; x < 18; x += 0.6) { if (x + 0.6 > KAPILAR[11][0] && x < KAPILAR[11][2]) continue; out.push({ x, y: 18.25, g: 0.6, d: 0.45, h: 1.05 }); }
  return out;
}

/** Kesik çizgili bırakma alanı + yazısı (başlangıçtaki tarz). */
export function alanCiz(ctx, k, a, durum) {
  if (a.gizli || a.g === 0) return;
  const p = [k.ekran(a.x, a.y, 0.02), k.ekran(a.x + a.g, a.y, 0.02), k.ekran(a.x + a.g, a.y + a.d, 0.02), k.ekran(a.x, a.y + a.d, 0.02)];
  const yakin = durum.yakin === a.id;
  poli(ctx, p, yakin ? 'rgba(255,255,255,.55)' : a.vurgu ? 'rgba(143,191,154,.55)' : 'rgba(255,248,235,.32)');
  ctx.setLineDash([6 * k.zum, 4 * k.zum]); ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.6 * k.zum;
  ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < 4; i++) ctx.lineTo(p[i][0], p[i][1]); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
}
export function alanYazisi(ctx, k, a, merkez) {
  if (a.gizli || a.g === 0) return;
  if (merkez && k.zum < 1.25 && !a.vurgu && Math.hypot(a.x + a.g / 2 - merkez[0], a.y + a.d / 2 - merkez[1]) > 4.5) return;
  const [cx, cy] = k.ekran(a.x + a.g / 2, a.y + a.d / 2, 0.05);
  const fs = Math.max(8, 10.5 * k.zum);
  ctx.font = `800 ${fs}px Quicksand, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(60,50,40,.55)'; ctx.strokeText(a.ad, cx, cy);
  ctx.fillStyle = '#FFFFFF'; ctx.fillText(a.ad, cx, cy);
}

/** Etiket hapı (oda adı, "BAGAJ 12" gibi). */
export function hap(ctx, x, y, metin, { arka = '#5B4636', renk = '#FFF7EC', boy = 11 } = {}) {
  ctx.font = `800 ${boy}px Quicksand, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(metin).width + boy * 1.3, h = boy * 1.9;
  ctx.fillStyle = 'rgba(0,0,0,.22)'; yuvarlak(ctx, x - w / 2, y - h / 2 + 2, w, h, h / 2); ctx.fill();
  ctx.fillStyle = arka; yuvarlak(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = renk; ctx.fillText(metin, x, y + 0.5);
}
function yuvarlak(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

/** "Vakti geldi" işareti: zıplayan turuncu elmas. */
export function isaretCiz(ctx, x, y, t, renk = '#F2B33D') {
  const s = Math.sin(t * 4) * 3;
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.moveTo(x, y + 14 + s); ctx.lineTo(x + 9, y + 2 + s); ctx.lineTo(x, y - 10 + s); ctx.lineTo(x - 9, y + 2 + s); ctx.closePath(); ctx.fill();
  ctx.fillStyle = renk; ctx.beginPath(); ctx.moveTo(x, y + 12 + s); ctx.lineTo(x + 9, y + s); ctx.lineTo(x, y - 12 + s); ctx.lineTo(x - 9, y + s); ctx.closePath(); ctx.fill();
  ctx.fillStyle = ton(renk, 1.25); ctx.beginPath(); ctx.moveTo(x, y - 12 + s); ctx.lineTo(x + 9, y + s); ctx.lineTo(x, y + s); ctx.closePath(); ctx.fill();
}

/**
 * Karakter: uzun siyah saçlı, fit, gülümseyen. Basit poligonlarla (özgün çizim).
 * yon: -1 sol, 1 sağ; adim: yürüme fazı; poz: 'dur' | 'yuru' | 'bravo'; yuk: elde taşınan Pfand sayısı.
 */
export function karakterCiz(ctx, k, x, y, { yon = 1, adim = 0, poz = 'dur', t = 0, yuk = 0 } = {}) {
  const [px, py] = k.ekran(x, y, 0);
  const s = 1.05 * k.zum;
  ctx.save(); ctx.translate(px, py); ctx.scale(s * yon, s);
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 5, 0, 0, 7); ctx.fill();
  const yuru = poz === 'yuru', sal = yuru ? Math.sin(adim) : 0, zip = yuru ? Math.abs(Math.cos(adim)) * 2 : Math.sin(t * 2) * 0.6;
  ctx.translate(0, -zip);
  // bacaklar
  ctx.fillStyle = '#2C3142';
  ctx.save(); ctx.translate(-3, -20); ctx.rotate(sal * 0.45); ctx.fillRect(-2.6, 0, 5.2, 19); ctx.fillStyle = '#F3F1EE'; ctx.fillRect(-3, 17, 6.5, 3.5); ctx.restore();
  ctx.fillStyle = '#2C3142';
  ctx.save(); ctx.translate(3, -20); ctx.rotate(-sal * 0.45); ctx.fillRect(-2.6, 0, 5.2, 19); ctx.fillStyle = '#F3F1EE'; ctx.fillRect(-3, 17, 6.5, 3.5); ctx.restore();
  // saç (arkada, uzun)
  ctx.fillStyle = '#17141A';
  ctx.beginPath(); ctx.moveTo(-8.5, -47); ctx.quadraticCurveTo(-11, -30, -8, -22); ctx.lineTo(7, -22); ctx.quadraticCurveTo(10, -32, 8.5, -47); ctx.closePath(); ctx.fill();
  // gövde (spor tişört, mercan)
  ctx.fillStyle = '#EE8A6E';
  ctx.beginPath(); ctx.moveTo(-7.5, -40); ctx.lineTo(7.5, -40); ctx.lineTo(6, -20); ctx.lineTo(-6, -20); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#D9735A'; ctx.fillRect(-6, -23, 12, 3);
  // kollar
  const kol = (sx, aci, bravo) => {
    ctx.save(); ctx.translate(sx, -38); ctx.rotate(aci);
    ctx.fillStyle = '#EE8A6E'; ctx.fillRect(-2.2, 0, 4.4, 6);
    ctx.fillStyle = '#D9A07A'; ctx.fillRect(-1.9, 6, 3.8, 9);
    ctx.beginPath(); ctx.arc(0, 16, 2.6, 0, 7); ctx.fill();
    if (bravo) { ctx.fillRect(-1, 10.5, 2.2, 4); }
    ctx.restore();
  };
  if (poz === 'bravo') { kol(-8, 0.15, false); kol(8, Math.PI - 0.35, true); }
  else if (yuk > 0) { kol(-8, Math.PI - 0.2, false); kol(8, Math.PI + 0.2, false); }
  else { kol(-8, 0.1 - sal * 0.4, false); kol(8, -0.1 + sal * 0.4, false); }
  // boyun + baş
  ctx.fillStyle = '#D9A07A'; ctx.fillRect(-2, -44, 4, 5);
  ctx.fillStyle = '#E4AE86'; ctx.beginPath(); ctx.ellipse(0, -51, 7.2, 8, 0, 0, 7); ctx.fill();
  // saç üstü + perçem
  ctx.fillStyle = '#17141A';
  ctx.beginPath(); ctx.ellipse(0, -55, 7.8, 5.2, 0, Math.PI, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-7.8, -55); ctx.quadraticCurveTo(-1, -53, 4, -57); ctx.lineTo(7.8, -55); ctx.lineTo(7.6, -50); ctx.quadraticCurveTo(5, -54, 1, -53.5); ctx.quadraticCurveTo(-5, -53, -7.6, -49); ctx.closePath(); ctx.fill();
  // yüz (sağa bakarken görünür)
  ctx.fillStyle = '#2A1E1A'; ctx.beginPath(); ctx.arc(2.2, -51, 0.95, 0, 7); ctx.arc(5.2, -51, 0.95, 0, 7); ctx.fill();
  ctx.strokeStyle = '#8A3B2E'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(3.8, -48.4, 2.4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  ctx.fillStyle = 'rgba(238,138,110,.45)'; ctx.beginPath(); ctx.arc(6.3, -48.8, 1.3, 0, 7); ctx.fill();
  ctx.restore();
  // taşınan Pfand çuvalı (başın üstünde)
  if (yuk > 0) {
    ctx.save(); ctx.translate(px, py - (zip + 66) * s);
    ctx.fillStyle = '#3E7D5A'; ctx.beginPath(); ctx.ellipse(0, 0, 13 * s, 9 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#A7D3B5'; for (let i = 0; i < 4; i++) ctx.fillRect((-8 + i * 5) * s, -12 * s, 2.6 * s, 7 * s);
    ctx.restore();
    hap(ctx, px, py - (zip + 88) * s, `PFAND ${yuk}`, { arka: '#B5562F', boy: 10 });
  }
}

/** Uçuşan yazı (iş kaydedilince). */
export function ucanYaziCiz(ctx, x, y, metin, oran) {
  ctx.globalAlpha = Math.max(0, 1 - oran);
  hap(ctx, x, y - oran * 40, metin, { arka: '#4F8F64', boy: 12 });
  ctx.globalAlpha = 1;
}

export { DIS, DIS_KAPI };

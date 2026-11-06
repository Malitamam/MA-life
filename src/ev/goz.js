// Ev modu, karakterin gözünden: Canvas 2D ile basit perspektif (motor yok).
// Sahne bir kez kutulardan kurulur; her karede görünen yüzler uzaktan yakına boyanır.
import { ODALAR, DIS, ESYALAR, ALANLAR, KAPILAR, DIS_KAPI, bolge, evMi } from './plan.js';
import { ton, citKutulari } from './cizim.js';

export const GOZ = 1.55; // göz yüksekliği (m)
export const TAVAN = 2.45;
const YAKIN = 0.06;

const rgb = (s) => { const m = String(s).match(/[\d.]+/g) ?? [0, 0, 0]; return m.slice(0, 3).map(Number); };
const renkT = (c, k) => rgb(ton(c, k));

/** Bir eşyayı birkaç kutuya böler (yaklaşık şekil). */
function parcalar(e) {
  const { x, y, g, d, h, renk } = e, z = e.z ?? 0;
  const B = (bx, by, bg, bd, bz, bh, r = renk, a = 1) => ({ x: bx, y: by, g: bg, d: bd, z: bz, h: bh, r, a });
  const ayak = (zz, L = 0.07, r = renk) => [B(x + 0.05, y + 0.05, L, L, 0, zz, r), B(x + g - 0.05 - L, y + 0.05, L, L, 0, zz, r), B(x + 0.05, y + d - 0.05 - L, L, L, 0, zz, r), B(x + g - 0.05 - L, y + d - 0.05 - L, L, L, 0, zz, r)];
  switch (e.t) {
    case 'yatak': return [B(x, y, g, d, 0, h * 0.55), B(x + 0.05, y + 0.05, g - 0.1, d - 0.1, h * 0.55, h * 0.45, e.ust ?? '#EEE')];
    case 'masa': {
      const out = [B(x, y, g, d, h - 0.05, 0.05), ...ayak(h - 0.05)];
      if (e.id === 'ofismasa') out.push(B(x + 0.3, y + d / 2 - 0.4, 0.05, 0.8, h + 0.08, 0.45, '#1E2128'), B(x + 0.38, y + d / 2 - 0.06, 0.12, 0.12, h, 0.08, '#3A3D45'));
      return out;
    }
    case 'kanepe': return [B(x, y, g, d, 0, 0.42), B(x + g * 0.7, y, g * 0.3, d, 0.42, h - 0.42), B(x, y, g * 0.7, 0.2, 0.42, 0.18), B(x, y + d - 0.2, g * 0.7, 0.2, 0.42, 0.18)];
    case 'koltuk': return [B(x, y, g, d, 0, 0.42), B(x + g - 0.3, y, 0.3, d, 0.42, h - 0.42)];
    case 'sandalye': return [B(x + g / 2 - 0.04, y + d / 2 - 0.04, 0.08, 0.08, 0, 0.44), B(x, y, g, d, 0.44, 0.08), B(x + g - 0.08, y, 0.08, d, 0.52, h - 0.52)];
    case 'tv': return [B(x, y, g, d, 0, h), B(x + 0.12, y + 0.25, 0.06, d - 0.5, h + 0.1, 0.8, '#15171C')];
    case 'agac': return [B(x + g / 2 - 0.13, y + d / 2 - 0.13, 0.26, 0.26, 0, h * 0.45, '#6B4A31'), B(x, y, g, d, h * 0.4, h * 0.45), B(x + g * 0.2, y + d * 0.2, g * 0.6, d * 0.6, h * 0.85, h * 0.15)];
    case 'kulube': { const k = ton(renk, 0.7); return [B(x, y, g, d, 0, h * 0.78), B(x - 0.1, y - 0.1, g + 0.2, d + 0.2, h * 0.78, 0.12, k), B(x + 0.25, y + 0.25, g - 0.5, d - 0.5, h * 0.9, h * 0.1, k)]; }
    case 'araba': {
      const t = '#1F2226';
      return [B(x, y, g, d, 0.2, 0.5), B(x + 0.5, y + 0.1, g - 1, d - 0.2, 0.7, h - 0.7, '#A9C2CE'),
        B(x + 0.3, y - 0.02, 0.45, 0.2, 0, 0.38, t), B(x + g - 0.75, y - 0.02, 0.45, 0.2, 0, 0.38, t),
        B(x + 0.3, y + d - 0.18, 0.45, 0.2, 0, 0.38, t), B(x + g - 0.75, y + d - 0.18, 0.45, 0.2, 0, 0.38, t)];
    }
    case 'sera': return [B(x, y, g, d, 0, 0.12, '#9C9A92'), B(x, y, g, d, 0.12, h - 0.12, renk, 0.42)];
    case 'dus': return [B(x, y, g, d, 0, 0.08, '#F7F7F5'), B(x, y, g, d, 0.08, h - 0.08, renk, 0.38)];
    case 'trambolin': return [B(x, y, g, d, h - 0.06, 0.06, '#22252A'), B(x - 0.05, y - 0.05, g + 0.1, 0.08, h - 0.08, 0.1, '#E86A8A'), B(x - 0.05, y + d - 0.03, g + 0.1, 0.08, h - 0.08, 0.1, '#E86A8A'), ...ayak(h - 0.06, 0.06, '#5C6066')];
    case 'salincak': return [B(x, y + d / 2 - 0.05, 0.1, 0.1, 0, h), B(x + g - 0.1, y + d / 2 - 0.05, 0.1, 0.1, 0, h), B(x, y + d / 2 - 0.05, g, 0.1, h - 0.1, 0.1), B(x + g / 2 - 0.25, y + d / 2 - 0.15, 0.5, 0.3, 0.45, 0.05, '#E86A8A')];
    case 'mangal': return [B(x, y, g, d, 0.6, 0.25), ...ayak(0.6, 0.05)];
    case 'kuvet': return [B(x, y, g, 0.08, 0, h), B(x, y + d - 0.08, g, 0.08, 0, h), B(x, y, 0.08, d, 0, h), B(x + g - 0.08, y, 0.08, d, 0, h), B(x + 0.08, y + 0.08, g - 0.16, d - 0.16, 0, 0.12, '#CFE3E6')];
    default: return [B(x, y, g, d, z, h)];
  }
}

function kutuYuzleri(out, b, sahip) {
  const { x, y, g, d, z, h, r, a } = b, x1 = x + g, y1 = y + d, z1 = z + h;
  const yuz = (p, n, f) => out.push({ p, n, rgb: renkT(r, f), a, sahip, c: [(p[0][0] + p[2][0]) / 2, (p[0][1] + p[2][1]) / 2, (p[0][2] + p[2][2]) / 2] });
  yuz([[x, y, z1], [x1, y, z1], [x1, y1, z1], [x, y1, z1]], [0, 0, 1], 1);
  if (z > 0.05) yuz([[x, y, z], [x, y1, z], [x1, y1, z], [x1, y, z]], [0, 0, -1], 0.62);
  if (h > 0.001) {
    yuz([[x, y, z], [x1, y, z], [x1, y, z1], [x, y, z1]], [0, -1, 0], 0.9);
    yuz([[x1, y1, z], [x, y1, z], [x, y1, z1], [x1, y1, z1]], [0, 1, 0], 0.76);
    yuz([[x, y1, z], [x, y, z], [x, y, z1], [x, y1, z1]], [-1, 0, 0], 0.83);
    yuz([[x1, y, z], [x1, y1, z], [x1, y1, z1], [x1, y, z1]], [1, 0, 0], 0.96);
  }
}

const DUVAR = '#EFE6D8', DUVAR_DIS = '#E2D3BC', DUVAR_OFIS = '#E7B4BE';
const duvarRengi = (x, y) => { const b = bolge(x, y); return b === 'ofis' ? DUVAR_OFIS : evMi(b) ? DUVAR : DUVAR_DIS; };

/** Sahneyi kur: zemin/tavan (önce boyanır) ve yüzler (sıralanır). */
export function sahneKur(iz) {
  const zemin = [], yuzler = [];
  const duz = (x, y, g, d, z, renk, sahip, asagi = false) => {
    const p = asagi ? [[x, y, z], [x, y + d, z], [x + g, y + d, z], [x + g, y, z]] : [[x, y, z], [x + g, y, z], [x + g, y + d, z], [x, y + d, z]];
    zemin.push({ p, n: [0, 0, asagi ? -1 : 1], rgb: rgb(ton(renk, 1)), a: 1, sahip });
  };
  for (const o of DIS) for (const [x, y, g, d] of o.r) duz(x, y, g, d, 0, o.id === 'bahce' ? '#86AE5C' : '#9A9CA0', { zemin: o.id });
  duz(0, 21.8, 18, 1.7, 0.003, '#6E7177', { zemin: 'otopark' });
  for (let i = 0; i < 9; i++) duz(i * 2 + 0.4, 22.6, 1.1, 0.1, 0.006, '#F3F1EE', { zemin: 'otopark' });
  for (const px of [0, 3.7, 7.4, 11.1, 14.8]) duz(px - 0.04, 18.9, 0.08, 2.5, 0.006, '#F1F0EC', { zemin: 'otopark' });
  for (const o of ODALAR) for (const [x, y, g, d] of o.r) { duz(x, y, g, d, 0, o.zemin, { zemin: o.id }); duz(x, y, g, d, TAVAN, '#F5F0E8', { tavan: true }, true); }
  for (const e of ESYALAR) if (e.gec) duz(e.x, e.y, e.g, e.d, e.t === 'robot' ? 0.012 : 0.008, e.renk, e.e ? { e } : { zemin: bolge(e.x + 0.01, e.y + 0.01) });
  // eşyalar (gec olsa da robot gibi yüksekliği olanlar kutu olarak da)
  for (const e of ESYALAR) { if (e.gec && e.h < 0.05) continue; for (const b of parcalar(e)) kutuYuzleri(yuzler, b, e.e ? { e } : { esya: e.id }); }
  // duvarlar: 1 m'lik parçalara bölünür (sıralama düzgün olsun)
  const T = 0.07;
  for (const [x1, y1, x2, y2] of iz.kenarlar) {
    const yatay = y1 === y2, L = yatay ? Math.abs(x2 - x1) : Math.abs(y2 - y1), n = Math.max(1, Math.ceil(L / 1));
    for (let i = 0; i < n; i++) {
      const a = i * L / n, b = (i + 1) * L / n;
      const kutuk = yatay ? { x: Math.min(x1, x2) + a, y: y1 - T, g: b - a, d: 2 * T } : { x: x1 - T, y: Math.min(y1, y2) + a, g: 2 * T, d: b - a };
      duvarYuzleri(yuzler, kutuk, 0, TAVAN);
    }
  }
  // kapı üstü (lento)
  const lento = [...KAPILAR.slice(0, 11), DIS_KAPI];
  for (const [x1, y1, x2, y2] of lento) {
    const k = x1 === x2 ? { x: x1 - T, y: Math.min(y1, y2), g: 2 * T, d: Math.abs(y2 - y1) } : { x: Math.min(x1, x2), y: y1 - T, g: Math.abs(x2 - x1), d: 2 * T };
    duvarYuzleri(yuzler, k, 2.08, TAVAN - 2.08);
  }
  // ön kapı kanadı (açık durur) ve çit
  for (const c of citKutulari()) kutuYuzleri(yuzler, { ...c, z: 0, r: '#3F6B3A', a: 1 }, { cit: true });
  return { zemin, yuzler };
}
function duvarYuzleri(out, k, z, h) {
  const { x, y, g, d } = k, x1 = x + g, y1 = y + d, z1 = z + h;
  const yuz = (p, n, cx, cy, f) => out.push({ p, n, rgb: renkT(duvarRengi(cx, cy), f), a: 1, sahip: { duvar: true }, c: [(p[0][0] + p[2][0]) / 2, (p[0][1] + p[2][1]) / 2, (p[0][2] + p[2][2]) / 2] });
  const mx = x + g / 2, my = y + d / 2;
  yuz([[x, y, z1], [x1, y, z1], [x1, y1, z1], [x, y1, z1]], [0, 0, 1], mx, my, 0.8);
  if (z > 0) yuz([[x, y, z], [x, y1, z], [x1, y1, z], [x1, y, z]], [0, 0, -1], mx, my, 0.82);
  yuz([[x, y, z], [x1, y, z], [x1, y, z1], [x, y, z1]], [0, -1, 0], mx, y - 0.2, 0.97);
  yuz([[x1, y1, z], [x, y1, z], [x, y1, z1], [x1, y1, z1]], [0, 1, 0], mx, y1 + 0.2, 0.86);
  yuz([[x, y1, z], [x, y, z], [x, y, z1], [x, y1, z1]], [-1, 0, 0], x - 0.2, my, 0.9);
  yuz([[x1, y, z], [x1, y1, z], [x1, y1, z1], [x1, y, z1]], [1, 0, 0], x1 + 0.2, my, 0.93);
}

/** Göz kamerası. a: sağa-sola bakış (radyan, 0 = +x), p: yukarı-aşağı. */
export class GozKamera {
  constructor() { this.x = 9; this.y = 9; this.z = GOZ; this.a = 0; this.p = -0.14; this.W = 360; this.H = 640; this.fov = 1.25; }
  get yatay() { return Math.min(2.2, this.W < this.H ? this.fov * 1.22 : this.fov); }
  get F() { return (this.W / 2) / Math.tan(this.yatay / 2); }
  eksen() {
    const ca = Math.cos(this.a), sa = Math.sin(this.a), cp = Math.cos(this.p), sp = Math.sin(this.p);
    return { f: [ca * cp, sa * cp, sp], r: [-sa, ca, 0], u: [-ca * sp, -sa * sp, cp] };
  }
  /** Dünya → kamera uzayı [sağ, yukarı, ileri]. */
  kam(P, E = this.eksen()) {
    const dx = P[0] - this.x, dy = P[1] - this.y, dz = P[2] - this.z;
    return [dx * E.r[0] + dy * E.r[1], dx * E.u[0] + dy * E.u[1] + dz * E.u[2], dx * E.f[0] + dy * E.f[1] + dz * E.f[2]];
  }
  yansit([r, u, f]) { const F = this.F; return [this.W / 2 + r / f * F, this.H / 2 - u / f * F]; }
  ekran(P) { const c = this.kam(P); return c[2] > YAKIN ? this.yansit(c) : null; }
  /** Ekran noktasından zemine (z = 0) ışın. */
  zemine(sx, sy) {
    const E = this.eksen(), F = this.F, rx = (sx - this.W / 2) / F, uy = -(sy - this.H / 2) / F;
    const d = [E.f[0] + rx * E.r[0] + uy * E.u[0], E.f[1] + rx * E.r[1] + uy * E.u[1], E.f[2] + uy * E.u[2]];
    if (d[2] >= -1e-4) return null;
    const t = -this.z / d[2];
    return [this.x + d[0] * t, this.y + d[1] * t];
  }
}

function kirp(cs) {
  const out = [];
  for (let i = 0; i < cs.length; i++) {
    const a = cs[i], b = cs[(i + 1) % cs.length], ai = a[2] >= YAKIN, bi = b[2] >= YAKIN;
    if (ai) out.push(a);
    if (ai !== bi) { const t = (YAKIN - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, YAKIN]); }
  }
  return out;
}

const SIS = [236, 226, 210], SIS_GECE = [40, 46, 60];
function boya(ctx, k, E, y, sis, cizilen) {
  const n = y.n, p0 = y.p[0];
  if ((k.x - p0[0]) * n[0] + (k.y - p0[1]) * n[1] + (k.z - p0[2]) * n[2] <= 0) return;
  const cs = kirp(y.p.map((P) => k.kam(P, E)));
  if (cs.length < 3) return;
  const pts = cs.map((c) => k.yansit(c));
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [sx, sy] of pts) { if (sx < x0) x0 = sx; if (sx > x1) x1 = sx; if (sy < y0) y0 = sy; if (sy > y1) y1 = sy; }
  if (x1 < 0 || x0 > k.W || y1 < 0 || y0 > k.H) return;
  const uz = y.c ? Math.hypot(y.c[0] - k.x, y.c[1] - k.y) : 0, s = Math.min(0.45, uz / 34);
  const [r, g, b] = y.rgb, c = `rgb(${Math.round(r + (sis[0] - r) * s)},${Math.round(g + (sis[1] - g) * s)},${Math.round(b + (sis[2] - b) * s)})`;
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.globalAlpha = y.a; ctx.fillStyle = c; ctx.fill();
  if (y.a === 1) { ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.stroke(); }
  else { ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.stroke(); }
  ctx.globalAlpha = 1;
  cizilen.push({ pts, sahip: y.sahip });
}

/** Tüm sahneyi çizer; dokunma için çizilen yüzleri (çizim sırasıyla) döndürür. */
export function gozCiz(ctx, k, sahne, { gece = false, yakinAlan = null } = {}) {
  const W = k.W, H = k.H, E = k.eksen(), sis = gece ? SIS_GECE : SIS;
  const ufuk = H / 2 - Math.tan(k.p) * k.F;
  const gok = ctx.createLinearGradient(0, 0, 0, Math.max(1, ufuk));
  gok.addColorStop(0, gece ? '#1C2233' : '#9CC7E4'); gok.addColorStop(1, gece ? '#3A4258' : '#E9EEF0');
  ctx.fillStyle = gok; ctx.fillRect(0, 0, W, Math.max(0, ufuk));
  ctx.fillStyle = gece ? '#2C3A2A' : '#7FA35A'; ctx.fillRect(0, Math.max(0, ufuk), W, H);
  const cizilen = [];
  for (const y of sahne.zemin) boya(ctx, k, E, y, sis, cizilen);
  // bırakma alanları (kesik çizgi)
  for (const a of ALANLAR) {
    if (a.gizli || a.g === 0) continue;
    const cs = kirp([[a.x, a.y, 0.02], [a.x + a.g, a.y, 0.02], [a.x + a.g, a.y + a.d, 0.02], [a.x, a.y + a.d, 0.02]].map((P) => k.kam(P, E)));
    if (cs.length < 3) continue;
    const pts = cs.map((c) => k.yansit(c));
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath();
    ctx.fillStyle = yakinAlan === a.id ? 'rgba(255,255,255,.5)' : a.vurgu ? 'rgba(143,191,154,.5)' : 'rgba(255,248,235,.28)'; ctx.fill();
    ctx.setLineDash([7, 5]); ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
    cizilen.push({ pts, sahip: { alan: a } });
  }
  const sirali = [];
  for (const y of sahne.yuzler) { const dx = y.c[0] - k.x, dy = y.c[1] - k.y, dz = y.c[2] - k.z; y._d = dx * dx + dy * dy + dz * dz; if (y._d < 1600) sirali.push(y); }
  sirali.sort((a, b) => b._d - a._d);
  for (const y of sirali) boya(ctx, k, E, y, sis, cizilen);
  return cizilen;
}

export function noktaIcinde(px, py, pts) {
  let ic = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) ic = !ic;
  }
  return ic;
}

/** Küçük harita (sağ üst). */
export function haritaCiz(ctx, k, x0, y0, olcek, gece) {
  ctx.save(); ctx.translate(x0, y0);
  ctx.fillStyle = gece ? 'rgba(20,22,30,.72)' : 'rgba(46,48,56,.62)';
  ctx.beginPath(); ctx.roundRect?.(-6, -6, 18 * olcek + 12, 23.5 * olcek + 12, 10); ctx.fill();
  for (const o of DIS) for (const [x, y, g, d] of o.r) { ctx.fillStyle = o.id === 'bahce' ? '#86AE5C' : '#9A9CA0'; ctx.fillRect(x * olcek, y * olcek, g * olcek, d * olcek); }
  for (const o of ODALAR) for (const [x, y, g, d] of o.r) { ctx.fillStyle = o.zemin; ctx.fillRect(x * olcek, y * olcek, g * olcek, d * olcek); }
  const px = k.x * olcek, py = k.y * olcek;
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, 22, k.a - k.yatay / 2, k.a + k.yatay / 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#EE8A6E'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(px, py, 4, 0, 7); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// Stok rafı: oyunlardaki depo rafı gibi; her ürün rafta bir kutu (simge yığını, adet, kaç gün yeter).
// Takviyeler rafta tek bir "takviye kutusu"; dokununca içindeki gözler (Çinko, Omega 3…) açılır.
import { html, useState } from '../../vendor/preact-htm.js';
import { M, git } from './durum.js';
import { Dialog } from './ortak.js';
import { StokMantik, sayi } from '../mantik.js';
import { urunEmoji, urunRozet } from '../ikonlar.js';
import { katalogGrup } from '../katalog.js';

const IKON_EMOJI = { bulasik: '🍽️', camasir: '🧺', cop: '🗑️', tiras: '🪒', filtre: '🚰', kahve: '☕', temizlik: '🧽', su: '💧', paket: '📦' };
const IKON_RAF = { bulasik: 'Ev ve temizlik', camasir: 'Ev ve temizlik', cop: 'Ev ve temizlik', filtre: 'Ev ve temizlik', kahve: 'Ev ve temizlik', temizlik: 'Ev ve temizlik', tiras: 'Kişisel bakım' };
const RAF_SIRA = ['Ev ve temizlik', 'Kişisel bakım', 'Çocuk', 'Kuru gıda ve bakliyat', 'Kahve ve çay', 'İçecek'];

export function urunSimgesi(u) {
  const e = urunEmoji(u.ad);
  return e !== '🛒' ? { e, r: urunRozet(u.ad) } : { e: IKON_EMOJI[u.ikon] ?? '📦', r: null };
}
const rafAdi = (u) => katalogGrup(u.ad) ?? IKON_RAF[u.ikon] ?? 'Diğer';

/** Takviye simgesi: adından (omega → balık, D vitamini → güneş…), yoksa şekline göre. */
export function takviyeSimgesi(t) {
  const s = String(t.ad ?? '').toLocaleLowerCase('tr-TR');
  const k = [['omega', '🐟'], ['balık', '🐟'], ['magnez', '✨'], ['çinko', '🔩'], ['zinc', '🔩'], ['theanin', '🍵'], ['kolin', '🧠'], ['d3', '☀️'], ['vitamin d', '☀️'],
    ['c vit', '🍊'], ['vitamin c', '🍊'], ['b12', '🔴'], ['demir', '🧲'], ['probiyot', '🦠'], ['kolajen', '💅'], ['kreatin', '💪'], ['protein', '💪'], ['melatonin', '🌙'], ['k2', '🥬']];
  for (const [a, e] of k) if (s.includes(a)) return e;
  return t.sekil === 'damla' ? '💧' : '💊';
}


// ---------- Ahşap raf (SVG): ürünler gerçek boyutlarına yakın, tek tek sayılabilir ----------
// Ölçek: 1 birim ≈ 0.5 cm. Raf genişliği 360 birim (ekrana göre ölçeklenir).
const W = 360, KENAR = 10, IC = W - 2 * KENAR;

/** Ürün adından çizim tipi ve ölçüleri. y: üst üste konabilir mi (rulolar, kutular, tabletler). */
const TIPLER = [
  [/tuvalet/, { t: 'uc', w: 20, h: 20, renk: '#f6f4ee', ic: '#c9a77a', y: true }],
  [/havlu|mutfak rulo|kağıt havlu/, { t: 'rulo', w: 22, h: 40, renk: '#fbfaf6', y: true }],
  [/brita|filtre/, { t: 'kartus', w: 14, h: 30, renk: '#f2f5f7', kapak: '#2f7fd1' }],
  [/çamaşır makinesi temiz/, { t: 'sise', w: 13, h: 26, renk: '#5fb3a8', kapak: '#2c6e66' }],
  [/bulaşık makinesi temiz/, { t: 'sise', w: 13, h: 26, renk: '#8cc06a', kapak: '#4d7d34' }],
  [/çöp poşet/, { t: 'rulo', w: 17, h: 16, renk: '#3b3f48', ic: '#22252b', y: true }],
  [/bulaşık deterjan/, { t: 'kutu', w: 30, h: 24, renk: '#4f9be0', y: true }],
  [/yağ çözme|tablet/, { t: 'tablet', w: 9, h: 5, renk: '#ffffff', y: true }],
  [/yumuşatıcı/, { t: 'sise', w: 24, h: 44, renk: '#b9a3d6', kapak: '#7a5fa3' }],
  [/deterjan/, { t: 'sise', w: 26, h: 46, renk: '#ee8a6e', kapak: '#b55a40' }],
  [/deodorant|köpü|sprey/, { t: 'sprey', w: 11, h: 34, renk: '#5b6f8a', kapak: '#d9dde3' }],
  [/tıraş bıçağı|jilet/, { t: 'kutu', w: 18, h: 25, renk: '#2f6fb5', y: true }],
  [/şampuan|duş|sabun|krem|jöle/, { t: 'sise', w: 16, h: 32, renk: '#e8c35a', kapak: '#9a7a22' }],
];
const tipBul = (u) => { const s = u.ad.toLocaleLowerCase('tr-TR'); for (const [r, t] of TIPLER) if (r.test(s)) return t; return { t: 'kutu', w: 22, h: 22, renk: '#d9c7a8', y: true, emoji: true }; };

const ARA = 2, YATAY_MAX = 14, CIZ_MAX = 42;

/** Bölme ölçüsü: kaç sütun, kaç sıra. */
function bolmeOlc(u, tip) {
  const n = Math.min(Math.max(0, Math.floor(u.stok ?? 0)), CIZ_MAX);
  const enFazlaSutun = Math.max(1, Math.min(YATAY_MAX, Math.floor((IC - 12) / (tip.w + ARA))));
  const sutun = Math.max(1, Math.min(n || 1, enFazlaSutun, tip.y ? Math.ceil(Math.sqrt(n * 1.6)) || 1 : enFazlaSutun));
  const sira = Math.max(1, Math.ceil((n || 1) / sutun));
  const araRaf = tip.y ? 0 : 4; // şişeler üst üste konmaz: sıralar arası ince tahta
  const w = Math.max(74, sutun * (tip.w + ARA) + 12);
  const h = sira * tip.h + (sira - 1) * (tip.y ? 0 : araRaf + 2) + 6;
  return { n, sutun, sira, w: Math.min(w, IC), h, araRaf };
}

// Tek bir ürünün çizimi (x: sol, yb: taban).
function Birim({ tip, x, yb, bos, emoji }) {
  const { w, h } = tip;
  const op = bos ? 0.28 : 1;
  const st = bos ? { strokeDasharray: '2 2' } : null;
  if (tip.t === 'uc') { const r = w / 2, cx = x + r, cy = yb - r; return html`<g opacity=${op}>
    <circle cx=${cx} cy=${cy} r=${r - 0.3} fill=${tip.renk} stroke="rgba(0,0,0,.28)" stroke-width=".6" style=${st} />
    <circle cx=${cx} cy=${cy} r=${r * 0.62} fill="none" stroke="rgba(0,0,0,.06)" stroke-width=".6" />
    <circle cx=${cx} cy=${cy} r=${r * 0.34} fill=${tip.ic} />
    <circle cx=${cx} cy=${cy} r=${r * 0.22} fill="rgba(0,0,0,.45)" />
  </g>`; }
  if (tip.t === 'rulo') return html`<g opacity=${op}>
    <rect x=${x} y=${yb - h} width=${w} height=${h} rx="1.5" fill=${tip.renk} stroke="rgba(0,0,0,.25)" stroke-width=".6" style=${st} />
    <rect x=${x} y=${yb - h} width=${w * 0.28} height=${h} fill="rgba(0,0,0,.07)" />
    <rect x=${x + w * 0.78} y=${yb - h} width=${w * 0.22} height=${h} fill="rgba(0,0,0,.10)" />
    <line x1=${x + 1} y1=${yb - h * 0.5} x2=${x + w - 1} y2=${yb - h * 0.5} stroke="rgba(0,0,0,.08)" stroke-width=".6" />
  </g>`;
  if (tip.t === 'kartus') return html`<g opacity=${op}>
    <path d=${`M${x + w * 0.12},${yb - h * 0.78} L${x + w * 0.88},${yb - h * 0.78} L${x + w * 0.76},${yb} L${x + w * 0.24},${yb} Z`} fill=${tip.renk} stroke="rgba(0,0,0,.25)" stroke-width=".6" style=${st} />
    <rect x=${x} y=${yb - h} width=${w} height=${h * 0.24} rx="2" fill=${tip.kapak} />
    <rect x=${x + w * 0.3} y=${yb - h * 0.7} width=${w * 0.4} height=${h * 0.5} rx="1" fill="rgba(47,127,209,.18)" />
  </g>`;
  if (tip.t === 'sise') return html`<g opacity=${op}>
    <rect x=${x} y=${yb - h * 0.78} width=${w} height=${h * 0.78} rx=${w * 0.28} fill=${tip.renk} stroke="rgba(0,0,0,.25)" stroke-width=".6" style=${st} />
    <rect x=${x + w * 0.3} y=${yb - h * 0.9} width=${w * 0.4} height=${h * 0.14} fill=${tip.renk} />
    <rect x=${x + w * 0.24} y=${yb - h} width=${w * 0.52} height=${h * 0.12} rx="1" fill=${tip.kapak} />
    <rect x=${x + w * 0.15} y=${yb - h * 0.55} width=${w * 0.7} height=${h * 0.24} rx="1" fill="rgba(255,255,255,.55)" />
    <rect x=${x + w * 0.12} y=${yb - h * 0.74} width=${w * 0.12} height=${h * 0.6} rx="1" fill="rgba(255,255,255,.25)" />
  </g>`;
  if (tip.t === 'sprey') return html`<g opacity=${op}>
    <rect x=${x} y=${yb - h * 0.84} width=${w} height=${h * 0.84} rx="2" fill=${tip.renk} stroke="rgba(0,0,0,.25)" stroke-width=".6" style=${st} />
    <path d=${`M${x},${yb - h * 0.84} Q${x + w / 2},${yb - h * 1.02} ${x + w},${yb - h * 0.84} Z`} fill=${tip.kapak} />
    <rect x=${x + w * 0.15} y=${yb - h * 0.7} width=${w * 0.16} height=${h * 0.55} fill="rgba(255,255,255,.25)" />
  </g>`;
  if (tip.t === 'tablet') return html`<g opacity=${op}>
    <rect x=${x} y=${yb - h} width=${w} height=${h} rx="2.4" fill=${tip.renk} stroke="rgba(0,0,0,.3)" stroke-width=".5" style=${st} />
    <line x1=${x + w / 2} y1=${yb - h + 1} x2=${x + w / 2} y2=${yb - 1} stroke="rgba(0,0,0,.2)" stroke-width=".5" />
  </g>`;
  return html`<g opacity=${op}>
    <rect x=${x} y=${yb - h} width=${w} height=${h} rx="1.5" fill=${tip.renk} stroke="rgba(0,0,0,.28)" stroke-width=".6" style=${st} />
    <rect x=${x} y=${yb - h} width=${w} height=${h * 0.16} fill="rgba(255,255,255,.25)" />
    ${emoji && html`<text x=${x + w / 2} y=${yb - h * 0.32} font-size=${Math.min(w, h) * 0.55} text-anchor="middle">${emoji}</text>`}
  </g>`;
}

/** Bir bölme: ürünler sıra sıra (alttan üste), altta etiket. */
function Bolme({ u, b, tip, olc, x, yb, onSay }) {
  const { n, sutun, sira } = olc;
  const icW = sutun * (tip.w + ARA) - ARA;
  const x0 = x + (olc.w - icW) / 2;
  const birimler = [];
  const emoji = tip.emoji ? urunSimgesi(u).e : null;
  if (n === 0) birimler.push(html`<${Birim} key="b" tip=${tip} x=${x + (olc.w - tip.w) / 2} yb=${yb - 2} bos emoji=${emoji} />`);
  for (let i = 0; i < n; i++) {
    const s = Math.floor(i / sutun), k = i % sutun;
    const yRow = yb - 2 - s * (tip.h + (tip.y ? 0 : olc.araRaf + 2));
    // üst sıra eksikse ortala (piramit gibi)
    const buSira = Math.min(sutun, n - s * sutun);
    const kay = ((sutun - buSira) * (tip.w + ARA)) / 2;
    birimler.push(html`<${Birim} key=${i} tip=${tip} x=${x0 + kay + k * (tip.w + ARA)} yb=${yRow} emoji=${emoji} />`);
  }
  const araTahtalar = !tip.y && sira > 1 ? Array.from({ length: sira - 1 }, (_, s) => {
    const yy = yb - 2 - (s + 1) * (tip.h + olc.araRaf + 2) + olc.araRaf + 2;
    return html`<rect x=${x + 3} y=${yy} width=${olc.w - 6} height=${olc.araRaf - 1} rx="1" fill="url(#tahtaIn)" />`;
  }) : null;
  const durum = !u.stokTakip ? 'n' : b.alinmali ? 'k' : b.sayim ? 's' : 'n';
  const gun = !u.stokTakip ? 'takip yok' : b.kalan != null ? `~${b.kalan} gün` : n === 0 ? 'bitti' : b.sayim ? 'say' : '';
  const ad = u.ad.length > Math.floor(olc.w / 5.2) ? u.ad.slice(0, Math.floor(olc.w / 5.2) - 1) + '…' : u.ad;
  return html`<g class="bolme" role="button" aria-label=${`${u.ad}: ${n} ${u.birim ?? ''}. Saymak için dokun`} onClick=${() => onSay(u)}>
    <rect x=${x} y=${yb - olc.h - 8} width=${olc.w} height=${olc.h + 8} fill="transparent" />
    ${araTahtalar}${birimler}
    ${(u.stok ?? 0) > CIZ_MAX && html`<text x=${x + olc.w - 4} y=${yb - olc.h - 1} font-size="8" text-anchor="end" class="raf-yazi">+${Math.floor(u.stok) - CIZ_MAX}</text>`}
    <g onClick=${(e) => { e.stopPropagation(); git('urun/' + u.id); }} role="link" aria-label=${u.ad + ' ayrıntı'}>
      <rect x=${x + 3} y=${yb + 3} width=${olc.w - 6} height="25" rx="2" fill=${durum === 'k' ? '#f6d2c6' : durum === 's' ? '#f6e6b0' : '#f3ead8'} stroke="rgba(60,40,20,.35)" stroke-width=".6" />
      <text x=${x + olc.w / 2} y=${yb + 13} font-size="8.2" font-weight="700" text-anchor="middle" fill="#3b2f22">${ad}</text>
      <text x=${x + olc.w / 2} y=${yb + 24} font-size="8.6" text-anchor="middle" fill=${durum === 'k' ? '#b3442a' : '#5a4a36'}><tspan font-weight="800" font-size="10">${Math.floor(u.stok ?? 0)}</tspan> ${u.birim ?? ''}${gun ? ' · ' + gun : ''}</text>
    </g>
  </g>`;
}

/** Takviye kutusu (haftalık ilaç kutusu gibi), dokununca gözler açılır. */
function TakviyeKutusuCizim({ takviyeler, bugun, x, yb, w, onAc }) {
  const n = Math.max(takviyeler.length, 1), gw = (w - 8) / n, h = 30;
  return html`<g class="bolme" role="button" aria-label="Takviye kutusunu aç" onClick=${onAc}>
    <rect x=${x} y=${yb - h - 2} width=${w} height=${h} rx="4" fill="#9d86c4" stroke="rgba(0,0,0,.3)" stroke-width=".6" />
    ${takviyeler.map((t, i) => html`<g key=${t.id}>
      <rect x=${x + 4 + i * gw} y=${yb - h + 2} width=${gw - 2} height=${h - 8} rx="2" fill=${StokMantik.takviyeAzMi(t, bugun) ? '#f2a48e' : '#e7dcf6'} stroke="rgba(0,0,0,.2)" stroke-width=".5" />
      <text x=${x + 4 + i * gw + (gw - 2) / 2} y=${yb - h / 2 + 2} font-size=${Math.min(11, gw * 0.55)} text-anchor="middle">${takviyeSimgesi(t)}</text>
    </g>`)}
    <rect x=${x + 3} y=${yb + 3} width=${w - 6} height="25" rx="2" fill="#efe6fa" stroke="rgba(60,40,90,.35)" stroke-width=".6" />
    <text x=${x + w / 2} y=${yb + 13} font-size="8.2" font-weight="700" text-anchor="middle" fill="#3b2f52">Takviye kutusu</text>
    <text x=${x + w / 2} y=${yb + 24} font-size="8.2" text-anchor="middle" fill="#5a4a76">${takviyeler.length} takviye · ${takviyeler.filter((t) => StokMantik.takviyeAzMi(t, bugun)).length} azaldı · aç</text>
  </g>`;
}

/** Bölmeleri raf katlarına dağıtır (soldan sağa, sığmayan alt kata). */
function katlaraDagit(ogeler) {
  const katlar = []; let kat = null, x = 0;
  for (const o of ogeler) {
    if (!kat || x + o.w > IC) { kat = []; katlar.push(kat); x = 0; }
    kat.push({ ...o, x: KENAR + x }); x += o.w;
  }
  // Kat içinde artan boşluğu bölmelere paylaştır (raf dolu görünsün)
  for (const k of katlar) { const bos = IC - k.reduce((s, o) => s + o.w, 0); let ek = 0; for (const o of k) { o.x += ek; const pay = bos / k.length; o.w += pay; ek += pay; } }
  return katlar;
}

export function RafGorunumu({ urunler, bilgi, bugun, onSay }) {
  const [kutuAcik, setKutuAcik] = useState(false);
  const takviyeler = M.db.hepsi('takviyeler').sort((a, b) => a.id - b.id);
  const takipli = [...urunler].sort((a, b) => (a.stokTakip === b.stokTakip ? 0 : a.stokTakip ? -1 : 1));
  const ogeler = [];
  if (takviyeler.length) ogeler.push({ takviye: true, w: Math.min(IC, Math.max(150, takviyeler.length * 26 + 10)), h: 32 });
  for (const u of takipli) { const tip = tipBul(u); const olc = bolmeOlc(u, tip); ogeler.push({ u, tip, olc, w: olc.w, h: olc.h }); }
  const katlar = katlaraDagit(ogeler);
  const UST = 14, ETIKET = 30, TAHTA = 9;
  let y = 8;
  const katCizim = katlar.map((k, i) => {
    const icH = Math.max(...k.map((o) => o.h)) + UST;
    const yb = y + icH; // rafın üst yüzü
    const g = html`<g key=${i}>
      <rect x=${KENAR} y=${y} width=${IC} height=${icH} fill="url(#arka)" />
      <rect x=${KENAR} y=${y} width=${IC} height="5" fill="rgba(0,0,0,.18)" />
      ${k.slice(1).map((o) => html`<rect x=${o.x - 1} y=${y + 4} width="2" height=${icH - 4} fill="rgba(60,35,15,.25)" />`)}
      <rect x=${KENAR} y=${yb} width=${IC} height=${TAHTA} fill="url(#tahta)" />
      <rect x=${KENAR} y=${yb} width=${IC} height="1.2" fill="rgba(255,235,200,.35)" />
      <rect x=${KENAR} y=${yb + TAHTA} width=${IC} height=${ETIKET - TAHTA + 2} fill="url(#tahtaOn)" />
      ${k.map((o) => o.takviye
        ? html`<${TakviyeKutusuCizim} key="tk" takviyeler=${takviyeler} bugun=${bugun} x=${o.x} yb=${yb} w=${o.w} onAc=${() => setKutuAcik(true)} />`
        : html`<${Bolme} key=${o.u.id} u=${o.u} b=${bilgi(o.u)} tip=${o.tip} olc=${{ ...o.olc, w: o.w }} x=${o.x} yb=${yb} onSay=${onSay} />`)}
    </g>`;
    y = yb + ETIKET + 4;
    return g;
  });
  const H = y + 6;
  return html`<div class="ahsap-raf">
    <svg viewBox=${`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Stok rafı">
      <defs>
        <linearGradient id="tahta" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8875a" /><stop offset="1" stop-color="#8a5f3b" /></linearGradient>
        <linearGradient id="tahtaOn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a5232" /><stop offset="1" stop-color="#5f3e25" /></linearGradient>
        <linearGradient id="tahtaIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c49668" /><stop offset="1" stop-color="#94673f" /></linearGradient>
        <linearGradient id="arka" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a3c26" /><stop offset=".5" stop-color="#6b4a30" /><stop offset="1" stop-color="#553824" /></linearGradient>
        <linearGradient id="yan" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7d5434" /><stop offset="1" stop-color="#a7774c" /></linearGradient>
        <pattern id="damar" width="60" height="9" patternUnits="userSpaceOnUse"><path d="M0,3 C15,1 30,5 60,3 M0,7 C20,6 40,8 60,6" stroke="rgba(60,30,10,.18)" stroke-width=".6" fill="none" /></pattern>
      </defs>
      <rect x="0" y="0" width=${KENAR} height=${H} fill="url(#yan)" />
      <rect x=${W - KENAR} y="0" width=${KENAR} height=${H} fill="url(#yan)" />
      <rect x="0" y="0" width=${W} height="8" fill="url(#tahta)" />
      ${katCizim}
      <rect x="0" y=${H - 6} width=${W} height="6" fill="url(#tahtaOn)" />
      <rect x="0" y="0" width=${W} height=${H} fill="url(#damar)" opacity=".5" pointer-events="none" />
    </svg>
    <div class="bk soluk" style="padding:6px 2px 0">Ürüne dokun: say · etikete dokun: ayrıntı · kırmızı etiket: azaldı/bitti · sarı: sayım vakti</div>
    ${kutuAcik && html`<${TakviyeKutusuDialog} takviyeler=${takviyeler} bugun=${bugun} onKapat=${() => setKutuAcik(false)} />`}
  </div>`;
}

/** Takviye kutusu: her takviye bir göz; adet, kaç gün yeter, azaldıysa kırmızı. Göze dokun → Takviye ekranı. */
function TakviyeKutusuDialog({ takviyeler, bugun, onKapat }) {
  return html`<${Dialog} baslik="Takviye kutusu" onKapat=${onKapat} butonlar=${[
    { metin: 'Takviye ekranı', onClick: () => { onKapat(); git('takviye'); } },
    { metin: 'Kapat', onClick: onKapat },
  ]}>
    <div class="kutu-icerik">${takviyeler.map((t) => {
      const stok = StokMantik.takviyeStok(t, bugun);
      const kalan = StokMantik.takviyeKalanGun(t, bugun);
      const az = StokMantik.takviyeAzMi(t, bugun);
      const ayarsiz = t.gunlukDoz <= 0;
      return html`<button key=${t.id} class=${'kutu-goz' + (az ? ' az' : '')} onClick=${() => { onKapat(); git('takviye'); }}>
        <span class="kutu-goz-e" aria-hidden="true">${takviyeSimgesi(t)}</span>
        <span class="kutu-goz-ad">${t.ad}</span>
        <span class="kutu-goz-bilgi">${ayarsiz ? 'doz gir' : `${sayi(stok)} adet`}</span>
        ${!ayarsiz && html`<span class=${'kutu-goz-gun' + (az ? ' kirmizi' : '')}>~${kalan} gün</span>`}
      </button>`;
    })}</div>
  </${Dialog}>`;
}

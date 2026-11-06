// Uygulama kabuğu: veri açılışı, gezinme, petek alt menü, rozetler, "Geri al" çubuğu, ortak pencereler (MainActivity.kt, PetekMenu.kt).
import { html, render, useState, useEffect } from '../vendor/preact-htm.js';
import { Db } from './db.js';
import { Depo } from './depo.js';
import { M, temaUygula, useVeri, useBugun, gunuYenile, useRota, useSonIslem, usePencere, git, SEKMELER } from './ui/durum.js';
import { Ikon, MetinButon, Toast, RENK } from './ui/ortak.js';
import { Mantik, PanoMantik, StokMantik } from './mantik.js';
import { PanoEkrani } from './ui/pano.js';
import { TakipEkrani, IsDetay, YeniIsDialog, ErteleDialog } from './ui/takip.js';
import { SayacEkrani } from './ui/sayac.js';
import { AjandaEkrani, AjandaDetay, AjandaDialog } from './ui/ajanda.js';
import { AlisverisEkrani, StokEkrani, TakviyeEkrani, KartEkrani, UrunDetay } from './ui/alim.js';
import { NotlarEkrani, NotDetay } from './ui/notlar.js';
import { GunlukEkrani } from './ui/gunluk.js';
import { ZincirDetay } from './ui/zincir.js';
import { AramaEkrani, OzetEkrani, AyarlarEkrani } from './ui/ekstra.js';
import { haftalikYedekGerekirse, sabahOzetiGerekirse } from './sistem.js';
import { Is } from './ui/islem.js';
import { Dialog } from './ui/ortak.js';

// Sekme: rota, ad, renk, ikon, sütun, üstte mi
const SEKME = [
  ['pano', 'Pano', RENK.mercan, 'pano', 0, false],
  ['takip', 'Ev işleri', RENK.adacayi, 'ev', 1, true],
  ['sayac', 'Sayaç', RENK.sari, 'sayac', 1, false],
  ['ajanda', 'Ajanda', RENK.sari, 'ajanda', 2, false],
  ['alim', 'Alışveriş', RENK.mercan, 'alim', 3, true],
  ['stok', 'Stok', RENK.adacayi, 'stok', 3, false],
  ['takviye', 'Takviye', RENK.lavanta, 'takviye', 4, false],
  ['notlar', 'Notlar', RENK.adacayi, 'notlar', 5, true],
  ['gunluk', 'Günlük', RENK.lavanta, 'gunluk', 5, false],
].map(([rota, ad, renk, ikon, sutun, ust]) => ({ rota, ad, renk, ikon, sutun, ust }));

/** Köşeleri yumuşatılmış, düz tepeli altıgen. */
function yumusakAltigen(cx, cy, r, k = 0.18) {
  const p = Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 3 * i; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
  let d = '';
  for (let i = 0; i < 6; i++) {
    const p0 = p[(i + 5) % 6], p1 = p[i], p2 = p[(i + 1) % 6];
    const a = [p1[0] + (p0[0] - p1[0]) * k, p1[1] + (p0[1] - p1[1]) * k];
    const b = [p1[0] + (p2[0] - p1[0]) * k, p1[1] + (p2[1] - p1[1]) * k];
    d += `${i === 0 ? 'M' : 'L'}${a[0].toFixed(2)},${a[1].toFixed(2)} Q${p1[0].toFixed(2)},${p1[1].toFixed(2)} ${b[0].toFixed(2)},${b[1].toFixed(2)} `;
  }
  return d + 'Z';
}

function useGenislik() {
  const [w, setW] = useState(innerWidth);
  useEffect(() => { const f = () => setW(innerWidth); addEventListener('resize', f); return () => removeEventListener('resize', f); }, []);
  return w;
}

function PetekMenu({ secili, rozetler }) {
  const ekran = Math.min(useGenislik(), 560);
  const W = ekran - 32;
  const w = W / 4.75, h = w * Math.sqrt(3) / 2, adim = w * 0.75;
  const dis = yumusakAltigen(w / 2, h / 2, w / 2), ic = yumusakAltigen(w / 2, h / 2, w / 2 - 3);
  return html`<nav class="petek" style=${{ height: (h * 2 + 12) + 'px', width: W + 'px', alignSelf: 'center' }} aria-label="Bölümler">
    ${SEKME.map((s) => {
      const x = adim * s.sutun;
      const y = s.sutun % 2 === 0 ? h / 2 + 8 : s.ust ? 8 : h + 8;
      const aktif = s.rota === secili;
      return html`<button key=${s.rota} class="hucre" role="tab" aria-selected=${aktif} aria-label=${s.ad} onClick=${() => git(s.rota)}
          style=${{ left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' }}>
        <svg class="zem" viewBox=${`0 0 ${w} ${h}`}>
          <path d=${dis} fill="var(--petek)" style="pointer-events:auto" />
          ${aktif ? html`<path d=${ic} fill=${s.renk} />` : html`<path d=${ic} fill="none" stroke=${s.renk} stroke-opacity="0.6" stroke-width="1.6" />`}
        </svg>
        <${Ikon} ad=${s.ikon} boy=${19} renk=${aktif ? 'var(--murekkep)' : s.renk} />
        <span style=${{ color: aktif ? 'var(--murekkep)' : 'var(--yazi)' }}>${s.ad}</span>
      </button>`;
    })}
    ${SEKME.map((s) => {
      const rozet = rozetler[s.rota];
      if (!rozet) return null;
      const x = adim * s.sutun, y = s.sutun % 2 === 0 ? h / 2 + 8 : s.ust ? 8 : h + 8;
      return html`<span key=${'r' + s.rota} class="rz" style=${{ left: (x + w * 0.72) + 'px', top: (y + 2) + 'px', background: rozet === '!' ? RENK.mercan : RENK.sari }}>${rozet}</span>`;
    })}
  </nav>`;
}

function Ekran({ rota }) {
  const [ad, idS] = rota.split('/');
  const id = idS != null ? Number(idS) : null;
  switch (ad) {
    case 'pano': return html`<${PanoEkrani} />`;
    case 'takip': return html`<${TakipEkrani} onAc=${(i) => git('is/' + i)} />`;
    case 'sayac': return html`<${SayacEkrani} onAc=${(i) => git('is/' + i)} />`;
    case 'ajanda': return id != null ? html`<${AjandaDetay} key=${id} id=${id} />` : html`<${AjandaEkrani} />`;
    case 'alim': return id === 1 ? html`<${StokEkrani} />` : id === 2 ? html`<${TakviyeEkrani} />` : id === 3 ? html`<${KartEkrani} />` : html`<${AlisverisEkrani} />`;
    case 'stok': return html`<${StokEkrani} />`;
    case 'takviye': return html`<${TakviyeEkrani} />`;
    case 'kart': return html`<${KartEkrani} />`;
    case 'notlar': return html`<${NotlarEkrani} />`;
    case 'gunluk': return html`<${GunlukEkrani} />`;
    case 'is': return html`<${IsDetay} key=${id} id=${id} />`;
    case 'zincir': return html`<${ZincirDetay} key=${id} id=${id} />`;
    case 'not': return html`<${NotDetay} key=${id} id=${id} />`;
    case 'urun': return html`<${UrunDetay} key=${id} id=${id} />`;
    case 'ara': return html`<${AramaEkrani} />`;
    case 'ozet': return html`<${OzetEkrani} />`;
    case 'ayarlar': return html`<${AyarlarEkrani} />`;
    default: return html`<${PanoEkrani} />`;
  }
}

function seciliSekme(rota) {
  const ad = rota.split('/')[0];
  if (SEKMELER.includes(ad) && !rota.includes('/')) return ad;
  return { is: 'takip', ajanda: 'ajanda', not: 'notlar', urun: 'stok', alim: 'alim' }[ad] ?? 'pano';
}

function Snack() {
  const [s, setS] = useSonIslem();
  useEffect(() => { if (!s) return; const z = setTimeout(() => setS(null), 4000); return () => clearTimeout(z); }, [s]);
  if (!s) return null;
  return html`<div class="snack" role="status"><span class="dolu bm">${s.metin}</span>
    ${s.kayitId > 0 && html`<${MetinButon} onClick=${() => { Is.geriAl(s.kayitId); setS(null); }}>Geri al</${MetinButon}>`}</div>`;
}

function Pencereler() {
  const [p, setP] = usePencere();
  const bugun = useBugun();
  if (!p) return null;
  const kapat = () => setP(null);
  if (p.tur === 'yeniIs') return html`<${YeniIsDialog} ilkTur=${p.ilkTur} onKapat=${kapat} />`;
  if (p.tur === 'ertele') return html`<${ErteleDialog} onKapat=${kapat} onSec=${(g) => { M.depo.ertele(p.id, g); kapat(); }} />`;
  if (p.tur === 'ajanda') {
    const kategoriler = M.db.hepsi('kategoriler').sort((a, b) => a.sira - b.sira || a.id - b.id);
    return html`<${AjandaDialog} ilkGun=${p.gun ?? null} bugun=${bugun} kategoriler=${kategoriler} onKapat=${kapat} ilkBaslik=${p.baslik ?? ''} ilkTur=${p.ajandaTur ?? 'GOREV'}
      onKaydet=${(k, altlar) => { M.depo.ajandaKaydet({ ...k, notId: p.notId ?? k.notId ?? null }, altlar); if (p.notId != null) Is.notIslendi(p.notId); kapat(); }} />`;
  }
  if (p.tur === 'sabah') return html`<${Dialog} baslik=${p.baslik} onKapat=${kapat} butonlar=${[{ metin: 'Tamam', onClick: kapat }]}>
    ${p.satirlar.slice(0, 12).map((s) => html`<div class="bm">• ${s}</div>`)}</${Dialog}>`;
  return null;
}

function Uygulama() {
  const depo = useVeri();
  const bugun = useBugun();
  const rota = useRota();
  const isler = depo.isDurumlari(bugun);
  const vakti = isler.filter((d) => d.tur === 'PERIYODIK' && Mantik.durum(d.sonGun, d.periyotGun, bugun, d.ertelenenGun) === 'VAKTI_GELDI').length;
  const bakim = PanoMantik.bakimVakti(isler, bugun).length;
  const alimRozet = depo.acikAlisveris().some((m) => depo.simdi() - m.eklenme > 7 * 86_400_000);
  const stokIsi = depo.urunler().filter((u) => StokMantik.sayimVakti(u, bugun)).length;
  const azTakviye = M.db.hepsi('takviyeler').filter((t) => StokMantik.takviyeAzMi(t, bugun)).length;
  const islenmemis = M.db.hepsi('notlar').filter((n) => !n.islendi).length;
  const rozetler = {};
  if (vakti > 0) rozetler.takip = String(vakti);
  if (bakim > 0) rozetler.sayac = String(bakim);
  if (alimRozet) rozetler.alim = '!';
  if (stokIsi > 0) rozetler.stok = String(stokIsi);
  if (azTakviye > 0) rozetler.takviye = String(azTakviye);
  if (islenmemis > 0) rozetler.notlar = String(islenmemis);

  useEffect(() => { document.querySelector('.ust-alan > .icerik')?.scrollTo?.(0, 0); }, [rota]);

  return html`<div class="ust-alan" style="padding-top:12px">
      <${Ekran} key=${rota.split('/')[0]} rota=${rota} />
      <${Snack} />
    </div>
    <${PetekMenu} secili=${seciliSekme(rota)} rozetler=${rozetler} />
    <${Pencereler} />
    <${Toast} />`;
}

async function basla() {
  const kok = document.getElementById('uygulama');
  try {
    const db = new Db();
    await db.ac(indexedDB);
    M.db = db;
    M.depo = new Depo(db);
    temaUygula();
    matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', temaUygula);
    M.depo.ilkKurulum();
    navigator.storage?.persist?.().catch(() => {});
    render(html`<${Uygulama} />`, kok);
    const tazele = () => {
      gunuYenile();
      M.depo.takviyeKontrol();
      const s = sabahOzetiGerekirse();
      if (s) import('./ui/durum.js').then((d) => d.pencereAc({ tur: 'sabah', ...s }));
    };
    tazele();
    haftalikYedekGerekirse();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tazele(); });
    setInterval(tazele, 60_000);
  } catch (e) {
    console.error(e);
    kok.innerHTML = `<div class="icerik"><div class="kart" style="padding:16px"><b>MALI açılamadı.</b><br><span class="bk soluk">${String(e?.message ?? e)}</span></div></div>`;
  }
}

basla();

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

const parca = (l, n) => { const r = []; for (let i = 0; i < l.length; i += n) r.push(l.slice(i, i + n)); return r; };

/**
 * Raf görünümü. bilgi(u) → { kalan, alinmali, sayim } (StokEkrani hesaplar). onSay(u): stok sayma penceresi.
 */
export function RafGorunumu({ urunler, bilgi, bugun, onSay }) {
  const [kutuAcik, setKutuAcik] = useState(false);
  const raflar = new Map();
  for (const u of urunler) { const r = rafAdi(u); if (!raflar.has(r)) raflar.set(r, []); raflar.get(r).push(u); }
  const sirali = [...raflar.keys()].sort((a, b) => ((RAF_SIRA.indexOf(a) + 1 || 99) - (RAF_SIRA.indexOf(b) + 1 || 99)) || a.localeCompare(b, 'tr'));
  const takviyeler = M.db.hepsi('takviyeler').sort((a, b) => a.id - b.id);
  const azTakviye = takviyeler.filter((t) => StokMantik.takviyeAzMi(t, bugun)).length;

  return html`<div class="raflar">
    ${takviyeler.length > 0 && html`<section class="raf" aria-label="Takviyeler">
      <div class="raf-ad">Takviyeler</div>
      <div class="raf-sira">
        <button class=${'raf-kutu takviye-kutusu' + (azTakviye ? ' az' : '')} aria-label="Takviye kutusunu aç" onClick=${() => setKutuAcik(true)}>
          <div class="kutu-gozler">${takviyeler.slice(0, 8).map((t) => html`<span class=${'goz' + (StokMantik.takviyeAzMi(t, bugun) ? ' az' : '')}>${takviyeSimgesi(t)}</span>`)}</div>
          <span class="raf-urun-ad">Takviye kutusu</span>
          <span class=${'raf-gun' + (azTakviye ? ' kirmizi' : '')}>${takviyeler.length} takviye${azTakviye ? ` · ${azTakviye} azaldı` : ''}</span>
        </button>
      </div>
    </section>`}
    ${sirali.map((r) => html`<section key=${r} class="raf" aria-label=${r}>
      <div class="raf-ad">${r}</div>
      ${parca(raflar.get(r), 3).map((sira, i) => html`<div key=${i} class="raf-sira">${sira.map((u) => html`<${RafUrunu} key=${u.id} u=${u} b=${bilgi(u)} onSay=${onSay} />`)}</div>`)}
    </section>`)}
    ${kutuAcik && html`<${TakviyeKutusuDialog} takviyeler=${takviyeler} bugun=${bugun} onKapat=${() => setKutuAcik(false)} />`}
  </div>`;
}

function RafUrunu({ u, b, onSay }) {
  const { e, r } = urunSimgesi(u);
  const adet = Math.max(0, Math.floor(u.stok ?? 0));
  const yigin = Math.min(adet, 4);
  const durum = !u.stokTakip ? '' : b.alinmali ? ' kirmizi' : b.sayim ? ' sari' : '';
  return html`<div class=${'raf-kutu' + durum}>
    <button class="raf-urun" aria-label=${`${u.ad}, ${u.stokTakip ? adet + ' ' + (u.birim ?? '') : 'stok takibi yok'}`} onClick=${() => git('urun/' + u.id)}>
      <div class=${'yigin' + (u.stokTakip && adet === 0 ? ' bos' : '')} aria-hidden="true">
        ${!u.stokTakip || adet === 0 ? html`<span class="yigin-e">${e}${r && html`<i class="alt-rozet">${r}</i>`}</span>`
          : Array.from({ length: yigin }, (_, i) => html`<span class="yigin-e" style=${{ zIndex: 10 - i, marginLeft: i ? '-14px' : 0, transform: `translateY(${i % 2 ? -3 : 0}px)` }}>${e}${i === 0 && r && html`<i class="alt-rozet">${r}</i>`}</span>`)}
      </div>
      <span class="raf-urun-ad">${u.ad}</span>
      <span class=${'raf-gun' + durum}>${!u.stokTakip ? 'takip yok' : b.kalan != null ? `~${b.kalan} gün yeter` : adet === 0 ? 'bitti' : b.sayim ? 'sayım vakti' : 'süre bilinmiyor'}</span>
    </button>
    ${u.stokTakip && html`<button class="raf-adet" aria-label=${u.ad + ' stoğunu say'} onClick=${() => onSay(u)}>${adet} <small>${u.birim ?? ''}</small></button>`}
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

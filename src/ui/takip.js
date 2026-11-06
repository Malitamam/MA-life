// Ev işleri listesi, iş detayı, yeni öğe, tutar ve erteleme pencereleri (TakipEkrani.kt, IsDetay.kt).
import { html, useState } from '../../vendor/preact-htm.js';
import { M, useVeri, useBugun, geri, pencereAc } from './durum.js';
import { Ikon, Kart, Cip, Segment, YuvarlakButon, TikButon, MetinButon, Dialog, Girdi, Anahtar, vurgu, RENK, sadeceSayi } from './ortak.js';
import { Mantik, PanoMantik, parseEuro, euro } from '../mantik.js';
import { tarih, GUN_KISA, AY_KISA, saatMetni } from '../tarih.js';
import { TarihButon } from './gunluk.js';
import { Is } from './islem.js';

export function durumMetni(d, bugun) {
  const kalan = Mantik.kalanGun(d.sonGun, d.periyotGun, bugun);
  const ertelendi = d.ertelenenGun != null && d.ertelenenGun > bugun;
  if (d.tur === 'SAYAC') return d.bugunSayi > 0 ? `bugün ${d.bugunSayi} · bu ay ${d.buAySayi}` : `bu ay ${d.buAySayi}`;
  if (ertelendi) return `ertelendi · ${d.ertelenenGun - bugun} gün`;
  if (kalan == null) { if (d.sonGun == null) return 'henüz yok'; const g = bugun - d.sonGun; return g === 0 ? 'bugün' : `son: ${g} gün önce`; }
  if (d.sonGun == null) return 'henüz yapılmadı';
  if (kalan > 0) return `${kalan} gün kaldı`;
  return 'vakti geldi';
}

export function durumRengi(d, bugun) {
  const s = Mantik.durum(d.sonGun, d.periyotGun, bugun, d.ertelenenGun);
  return s === 'VAKTI_GELDI' ? RENK.mercan : s === 'YAKLASIYOR' ? RENK.sari : RENK.adacayi;
}

/** Tutar sorulan işte önce tutar penceresi açılır. */
export function useYap() {
  const [tutarIcin, setTutarIcin] = useState(null);
  const yap = (d) => { if (d.tutarSor) setTutarIcin(d); else Is.yap(d.id, d.ad); };
  const pencere = tutarIcin && html`<${TutarDialog} ad=${tutarIcin.ad} onKapat=${() => setTutarIcin(null)} onTamam=${(sent) => { Is.yap(tutarIcin.id, tutarIcin.ad, sent); setTutarIcin(null); }} />`;
  return [yap, pencere];
}

export function TakipEkrani({ onAc }) {
  const depo = useVeri();
  const bugun = useBugun();
  const [filtre, setFiltre] = useState(0);
  const [yap, tutarPenceresi] = useYap();
  const isler = depo.isDurumlari(bugun);
  const evIsleri = isler.filter((d) => d.tur === 'PERIYODIK');
  const yakin = PanoMantik.evIsleriYakin(isler, bugun);
  const yakinId = new Set(yakin.map((d) => d.id));
  const gruplar = [
    ['Vakti gelen ve yaklaşan', evIsleri.filter((d) => yakinId.has(d.id))],
    ['Sonra', evIsleri.filter((d) => !yakinId.has(d.id))],
  ].filter((_, i) => filtre === 0 || filtre === i + 1);
  const kalan = (d) => Mantik.kalanGun(d.sonGun, d.periyotGun, bugun) ?? Number.MAX_SAFE_INTEGER;

  return html`<div class="icerik"><div class="sutun">
    <div>
      <div class="satir">
        <span class="bs dolu">Ev işleri</span>
        <${YuvarlakButon} ikon="arti" aciklama="Yeni ev işi" arka=${RENK.mercan} onClick=${() => pencereAc({ tur: 'yeniIs', ilkTur: 'PERIYODIK' })} />
      </div>
      <div class="bk soluk">${yakin.length === 0 ? '2 gün içinde vakti gelen iş yok.' : `2 gün içinde ${yakin.length} iş`}</div>
      <div style="height:8px"></div>
      <${Segment} secenekler=${['Hepsi', 'Yakında', 'Sonra']} secili=${filtre} onSec=${setFiltre} />
    </div>
    ${gruplar.filter(([, l]) => l.length).map(([baslik, liste]) => html`<${Kart} key=${baslik} dikey=${4}>
      <div class="lk soluk" style="padding:6px 0 2px">${baslik}</div>
      ${[...liste].sort((a, b) => kalan(a) - kalan(b)).map((d) => html`<${IsSatiri} key=${d.id} d=${d} bugun=${bugun} onAc=${() => onAc(d.id)} onYap=${() => yap(d)} />`)}
    </${Kart}>`)}
  </div>${tutarPenceresi}</div>`;
}

export function IsSatiri({ d, bugun, onAc, onYap }) {
  const renk = d.tur === 'SAYAC' ? vurgu(d.renk) : durumRengi(d, bugun);
  const s = d.stok ?? 0;
  return html`<div class="satir tikla" style="height:46px" onClick=${onAc}>
    <${Ikon} ad=${d.ikon} boy=${19} renk=${vurgu(d.renk)} />
    <div class="dolu" style="margin-left:10px">
      <div class="bm tek" style="font-weight:700">${d.ad}</div>
      <div class="bk"><span style=${{ color: renk === RENK.mercan && d.tur !== 'SAYAC' ? RENK.mercan : 'var(--soluk)' }}>${durumMetni(d, bugun)}</span>
        ${d.stokUrunId != null && html`<span style=${{ color: s < d.stokKullanim ? RENK.mercan : 'var(--soluk)' }}>  · stok ${s}</span>`}</div>
    </div>
    ${d.tur === 'SAYAC'
      ? html`<${TikButon} renk=${renk} dolu=${d.bugunSayi > 0} aciklama=${d.ad + ' +1'} onClick=${onYap} />`
      : html`<${TikButon} renk=${renk} dolu=${d.sonGun === bugun} aciklama=${d.ad + ' yaptım'} onClick=${onYap} />`}
  </div>`;
}

export function TutarDialog({ ad, onKapat, onTamam }) {
  const [metin, setMetin] = useState('');
  return html`<${Dialog} baslik=${ad} onKapat=${onKapat} butonlar=${[{ metin: 'Vazgeç', onClick: onKapat }, { metin: 'Kaydet', onClick: () => onTamam(parseEuro(metin)) }]}>
    <${Girdi} etiket="Tutar € (isteğe bağlı)" deger=${metin} onDeger=${(v) => setMetin(sadeceSayi(v))} inputmode="decimal" otomatik />
  </${Dialog}>`;
}

export const ERTELE_SECENEK = [['Yarın', 1], ['3 gün', 3], ['5 gün', 5], ['1 hafta', 7], ['2 hafta', 14], ['1 ay', 30]];
export function ErteleDialog({ onKapat, onSec }) {
  return html`<${Dialog} baslik="Ne zamana ertelensin?" onKapat=${onKapat} butonlar=${[{ metin: 'Vazgeç', onClick: onKapat }]}>
    <div class="sar" style="gap:8px">${ERTELE_SECENEK.map(([ad, g]) => html`<${Cip} metin=${ad} renk=${RENK.sari} onClick=${() => onSec(g)} />`)}</div>
  </${Dialog}>`;
}

const tamTarih = (g) => { const t = tarih(g); return `${t.d} ${AY_KISA[t.m - 1]} ${t.y}, ${GUN_KISA[t.hg - 1]}`; };

export function IsDetay({ id }) {
  const depo = useVeri();
  const bugun = useBugun();
  const [adDuzenle, setAdDuzenle] = useState(false);
  const [kaldirSor, setKaldirSor] = useState(false);
  const [erteleAcik, setErteleAcik] = useState(false);
  const i = M.db.getir('isler', id);
  if (!i) return html`<div class="icerik"><${YuvarlakButon} ikon="geri" aciklama="Geri" onClick=${geri} /></div>`;
  const kayitlar = depo.isKayitlari(id);
  const kaydet = (degisim) => M.db.guncelle('isler', id, degisim);
  const p = i.periyotGun;

  return html`<div class="icerik"><div class="sutun">
    <div class="satir">
      <${YuvarlakButon} ikon="geri" aciklama="Geri" onClick=${geri} />
      <span style="width:10px"></span>
      <${Ikon} ad=${i.ikon} boy=${22} renk=${vurgu(i.renk)} />
      <span style="width:8px"></span>
      <span class="tm dolu tikla" onClick=${() => setAdDuzenle(true)}>${i.ad}</span>
    </div>
    <${Kart} dikey=${10}><div class="sutun g10">
      ${i.tur !== 'SAYAC' && html`
        <div class="satir"><span class="bm dolu">Periyot</span>
          <${MetinButon} onClick=${() => kaydet({ periyotGun: p != null && p - 1 > 0 ? p - 1 : null })}>−</${MetinButon}>
          <span class="ts">${p != null ? `${p} gün` : 'yok'}</span>
          <${MetinButon} onClick=${() => kaydet({ periyotGun: (p ?? 0) + 1 })}>+</${MetinButon}></div>
        <div class="satir"><span class="bm dolu">Hatırlatıcı</span><${Anahtar} acik=${i.hatirlatici} etiket="Hatırlatıcı" onDegis=${(v) => kaydet({ hatirlatici: v })} /></div>`}
      <div class="satir"><span class="bm dolu">Panoda göster ★</span><${Anahtar} acik=${i.yildizli} etiket="Panoda göster" onDegis=${(v) => kaydet({ yildizli: v })} /></div>
      ${i.tur !== 'SAYAC' && html`<div class="satir">
        <span class="bm dolu">${i.ertelenenGun != null && i.ertelenenGun > bugun ? `Ertelendi: ${i.ertelenenGun - bugun} gün` : 'Ertele'}</span>
        ${i.ertelenenGun != null && html`<${MetinButon} onClick=${() => kaydet({ ertelenenGun: null })}>Kaldır</${MetinButon}>`}
        <${MetinButon} onClick=${() => setErteleAcik(true)}>Ertele…</${MetinButon}></div>`}
      <div><${TarihButon} gun=${bugun} bugun=${bugun} enGec=${bugun} metin="Geçmiş tarihli kayıt ekle"
        onGun=${(g) => Is.yap(i.id, i.ad, null, depo.ogle(g))} /></div>
    </div></${Kart}>
    <div class="lk soluk" style="padding-top:4px">Geçmiş · ${kayitlar.length} kayıt</div>
    <div class="sutun g2">${kayitlar.map((k) => html`<div key=${k.id} class="satir" style="height:36px">
      <span class="bm dolu">${tamTarih(k.gun)}</span>
      ${k.tutarSent != null && html`<span class="bk soluk">${euro(k.tutarSent)}  </span>`}
      <span class="bk soluk">${saatMetni(k.zaman)}</span>
      <${MetinButon} renk=${RENK.mercan} onClick=${() => Is.geriAl(k.id)}>Geri al</${MetinButon}>
    </div>`)}</div>
  </div>
  ${erteleAcik && html`<${ErteleDialog} onKapat=${() => setErteleAcik(false)} onSec=${(g) => { depo.ertele(i.id, g); setErteleAcik(false); }} />`}
  ${adDuzenle && html`<${AdDialog} ad=${i.ad} onKapat=${() => setAdDuzenle(false)} onKaydet=${(ad) => { if (ad.trim()) kaydet({ ad: ad.trim() }); setAdDuzenle(false); }}
    onKaldir=${() => { setAdDuzenle(false); setKaldirSor(true); }} />`}
  ${kaldirSor && html`<${Dialog} baslik=${`"${i.ad}" kaldırılsın mı?`} onKapat=${() => setKaldirSor(false)}
    butonlar=${[{ metin: 'Vazgeç', onClick: () => setKaldirSor(false) }, { metin: 'Kaldır', renk: RENK.mercan, onClick: () => { kaydet({ arsiv: true }); setKaldirSor(false); geri(); } }]}>
    <span class="bm">Listeden çıkar. Günlük'teki geçmişi kalır.</span></${Dialog}>`}
  </div>`;
}

function AdDialog({ ad: ilk, onKapat, onKaydet, onKaldir }) {
  const [ad, setAd] = useState(ilk);
  return html`<${Dialog} baslik="Adı değiştir" onKapat=${onKapat}
    butonlar=${[{ metin: 'Öğeyi kaldır', renk: RENK.mercan, onClick: onKaldir }, { metin: 'Kaydet', onClick: () => onKaydet(ad) }]}>
    <${Girdi} deger=${ad} onDeger=${setAd} otomatik />
  </${Dialog}>`;
}

export function YeniIsDialog({ ilkTur = 'PERIYODIK', onKapat }) {
  const [ad, setAd] = useState('');
  const [tur, setTur] = useState(ilkTur);
  const [periyot, setPeriyot] = useState('14');
  const ekle = () => {
    if (!ad.trim()) return;
    M.db.ekle('isler', {
      ad: ad.trim(), tur, ikon: 'paket', renk: tur === 'BAKIM' ? 3 : 2,
      periyotGun: tur === 'SAYAC' ? null : (parseInt(periyot, 10) || null),
      hatirlatici: tur === 'PERIYODIK', yildizli: tur === 'SAYAC', sira: 999,
    });
    onKapat();
  };
  return html`<${Dialog} baslik="Yeni öğe" onKapat=${onKapat} butonlar=${[{ metin: 'Vazgeç', onClick: onKapat }, { metin: 'Ekle', onClick: ekle }]}>
    <div class="sutun g8">
      <${Girdi} etiket="Ad" deger=${ad} onDeger=${setAd} otomatik />
      <div class="satir" style="gap:6px">
        <${Cip} metin="Ev işi" secili=${tur === 'PERIYODIK'} onClick=${() => setTur('PERIYODIK')} />
        <${Cip} metin="Sayaç" secili=${tur === 'SAYAC'} onClick=${() => setTur('SAYAC')} />
        <${Cip} metin="Bakım" secili=${tur === 'BAKIM'} onClick=${() => setTur('BAKIM')} />
      </div>
      ${tur !== 'SAYAC' && html`<${Girdi} etiket="Periyot (gün, boş = yok)" deger=${periyot} onDeger=${(v) => setPeriyot(sadeceSayi(v, false))} inputmode="numeric" />`}
    </div>
  </${Dialog}>`;
}

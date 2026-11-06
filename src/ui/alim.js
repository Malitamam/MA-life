// Alışveriş, Stok, Takviye, Şirket kartı, ürün detayı ve pencereleri (AlimEkrani.kt, UrunDetay.kt).
import { html, useState } from '../../vendor/preact-htm.js';
import { M, Ayar, useVeri, useBugun, git, geri } from './durum.js';
import { Ikon, Kart, Cip, Segment, YuvarlakButon, IkonButon, TikButon, MetinButon, Dialog, Girdi, Anahtar, SesleYaz, uzunBas, sadeceSayi, RENK } from './ortak.js';
import { AlimMantik, StokMantik, STOK_ESIGI, TAKVIYE_UYARI_GUN, parseEuro, sayi, tutarMetni as tl } from '../mantik.js';
import { tarih, gunBaslik, gunAyHg, gunYil, AY_UZUN } from '../tarih.js';
import { TarihButon } from './gunluk.js';
import { KART_TUTARLARI, KucukKutu } from './pano.js';
import { urunIkonu } from '../ikonlar.js';
import { Is } from './islem.js';

const esitTr = (a, b) => a.trim().toLocaleLowerCase('tr-TR') === b.trim().toLocaleLowerCase('tr-TR');
const kucukTr = (s) => s.toLocaleLowerCase('tr-TR');
const buyukIlk = (s) => s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1);
const euroGirdi = (sent) => (sent == null ? '' : `${Math.floor(sent / 100)},${String(sent % 100).padStart(2, '0')}`);

function Ekran({ baslik, alt, children }) {
  return html`<div class="icerik"><div class="bs">${baslik}</div>${alt && html`<div class="bk soluk">${alt}</div>`}<div style="height:8px"></div>
    <div class="sutun g8">${children}</div></div>`;
}

// ---------------- Alışveriş listesi ----------------
export function AlisverisEkrani() {
  const depo = useVeri();
  const bugun = useBugun();
  const [yeni, setYeni] = useState('');
  const [alimIcin, setAlimIcin] = useState(null);
  const [online, setOnline] = useState(0);
  const [hizliEkle, setHizliEkle] = useState(false);
  const [hizliDuzen, setHizliDuzen] = useState(false);
  const acik = M.db.hepsi('alisveris').sort((a, b) => a.eklenme - b.eklenme);
  const bekleyen = acik.filter((m) => !m.alindi);
  const urunler = depo.urunler();
  const hizli = Ayar.hizliSecimler;
  const simdi = depo.simdi();
  const gorunen = bekleyen.filter((m) => m.online === (online === 1));
  const alinanlar = M.db.hepsi('alisveris').filter((m) => m.alindi);
  const ekle = (ad) => {
    const u = urunler.find((x) => esitTr(x.ad, ad));
    depo.alisveriseEkle(buyukIlk(ad.trim()), u?.id ?? null, u?.ikon && u.ikon !== 'paket' ? u.ikon : urunIkonu(ad), false, online === 1);
  };
  const listede = new Set(bekleyen.map((m) => kucukTr(m.ad)));
  const azalan = urunler.filter((u) => StokMantik.azMi(u) && !listede.has(kucukTr(u.ad)));
  // Android'de "alındı" işaretlileri liste sonunda soluk durur, "Alışverişi bitir" ile temizlenir
  const liste = [...gorunen, ...alinanlar.filter((m) => m.online === (online === 1))];
  const alinanSayi = alinanlar.length;

  return html`<${Ekran} baslik="Alışveriş">
    <div><${Segment} secenekler=${[`Market · ${bekleyen.filter((m) => !m.online).length}`, `Online · ${bekleyen.filter((m) => m.online).length}`]} secili=${online} onSec=${setOnline} /></div>
    <${Kart} dikey=${6}><div class="satir" style="gap:4px">
      <div class="dolu"><${Girdi} deger=${yeni} onDeger=${setYeni} ipucu="Ekle: süt, ekmek…" onKeyDown=${(e) => { if (e.key === 'Enter' && yeni.trim()) { ekle(yeni); setYeni(''); } }} /></div>
      <${SesleYaz} onMetin=${setYeni} />
      <${IkonButon} ikon="arti" aciklama="Ekle" boy=${20} onClick=${() => { if (yeni.trim()) { ekle(yeni); setYeni(''); } }} />
    </div></${Kart}>
    <div>
      <div class="satir"><span class="lk soluk dolu">Hızlı seç</span><${MetinButon} onClick=${() => setHizliDuzen(!hizliDuzen)}>${hizliDuzen ? 'Bitti' : 'Düzenle'}</${MetinButon}></div>
      ${hizliDuzen && html`<div class="bk c-sari" style="margin-bottom:6px">Çıkarmak için dokun.</div>`}
      <div class="izgara6">
        ${hizli.map((ad) => {
          const var_ = listede.has(kucukTr(ad));
          return html`<${KucukKutu} key=${ad} dar o=${{ id: ad, ad: hizliDuzen ? ad + ' ×' : ad, tamAd: ad, ikon: urunIkonu(ad), renk: RENK.mercan, zemin: 'color-mix(in srgb, var(--mercan) 18%, transparent)', secili: var_,
            onClick: () => { if (hizliDuzen) Ayar.hizliSecimler = hizli.filter((x) => x !== ad); else if (!var_) ekle(ad); } }} />`;
        })}
        <button class="kkutu dar" aria-label="Hızlı seçime ekle" onClick=${() => setHizliEkle(true)}><${Ikon} ad="arti" boy=${18} renk="var(--soluk)" /></button>
      </div>
      ${azalan.length > 0 && html`<div class="lk soluk" style="margin:8px 0 6px">Stokta azalanlar</div>
        <div class="sar">${azalan.map((u) => html`<button class="satir" style="border-radius:12px;background:var(--yuzey);padding:6px 9px" onClick=${() => depo.alisveriseEkle(u.ad, u.id, u.ikon, false, online === 1)}>
          <${Ikon} ad=${u.ikon} boy=${14} renk=${RENK.mercan} /><span class="lk soluk tek" style="margin-left:5px">${u.ad} · ${u.stok}</span></button>`)}</div>`}
    </div>
    <${Kart} dikey=${6}>
      <div class="satir" style="height:32px">
        <span class="lk soluk dolu">${online === 1 ? 'Online liste' : 'Market listesi'} · ${gorunen.length} ürün</span>
        ${alinanSayi > 0 && html`<${MetinButon} onClick=${() => Is.alisverisiBitir()}>Alışverişi bitir (${alinanSayi})</${MetinButon}>`}
      </div>
      ${liste.length === 0 && html`<div class="bm soluk" style="padding:8px 0">Liste boş.</div>`}
      ${liste.map((m) => {
        const eski = !m.alindi && simdi - m.eklenme > 7 * 86_400_000;
        return html`<div key=${m.id} class="satir" style="height:42px" ...${uzunBas(() => M.db.sil('alisveris', m.id), null)}>
          <${Ikon} ad=${m.ikon && m.ikon !== 'paket' ? m.ikon : urunIkonu(m.ad)} boy=${16} renk=${RENK.mercan} />
          <span class=${'bm dolu tek' + (m.alindi ? ' soluk cizik' : '')} style="margin-left:9px">${m.ad}</span>
          ${eski && html`<span class="tm c-mercan" style="padding:0 6px">!</span>`}
          ${m.otomatik && !m.alindi && html`<span class="bk soluk">oto</span>`}
          <${TikButon} renk=${RENK.mercan} dolu=${m.alindi} aciklama=${m.ad + ' alındı'} onClick=${() => {
            const u = (m.urunId != null ? urunler.find((x) => x.id === m.urunId) : null) ?? urunler.find((x) => esitTr(x.ad, m.ad));
            if (!m.alindi && u) setAlimIcin([m, u]); else depo.alisverisIsaretle(m, !m.alindi);
          }} />
        </div>`;
      })}
      ${liste.length > 0 && html`<div class="bk soluk" style="padding:4px 0">Uzun bas: listeden sil · ! = 7 günden uzun süredir listede · stoklu ürün alınınca kaç tane aldığın sorulur</div>`}
    </${Kart}>
    ${hizliEkle && html`<${TekAlanDialog} baslik="Hızlı seçime ekle" ipucu="örn. Avokado" tamam="Ekle" onKapat=${() => setHizliEkle(false)}
      onTamam=${(ad) => { if (ad.trim()) Ayar.hizliSecimler = [...hizli, buyukIlk(ad.trim())]; setHizliEkle(false); }} />`}
    ${alimIcin && html`<${AlimDialog} u=${alimIcin[1]} bugun=${bugun} kapatMetni="Sadece işaretle"
      onKapat=${() => { depo.alisverisIsaretle(alimIcin[0], true); setAlimIcin(null); }} onVazgec=${() => setAlimIcin(null)}
      onKaydet=${(g, adet, od, nr, yer) => { Is.alimEkle(alimIcin[1].id, g, adet, od, nr, yer); setAlimIcin(null); }} />`}
  </${Ekran}>`;
}

function TekAlanDialog({ baslik, ipucu, tamam, ilk = '', sayisal, onKapat, onTamam }) {
  const [v, setV] = useState(ilk);
  return html`<${Dialog} baslik=${baslik} onKapat=${onKapat} butonlar=${[{ metin: 'Vazgeç', onClick: onKapat }, { metin: tamam, onClick: () => onTamam(v) }]}>
    <${Girdi} deger=${v} onDeger=${(x) => setV(sayisal ? sadeceSayi(x, false) : x)} ipucu=${ipucu} inputmode=${sayisal ? 'numeric' : undefined} otomatik
      onKeyDown=${(e) => { if (e.key === 'Enter') onTamam(v); }} />
  </${Dialog}>`;
}

// ---------------- Stok ----------------
export const sayimMetni = (g) => ({ 7: 'haftada bir', 14: '2 haftada bir', 30: 'ayda bir', 90: '3 ayda bir' })[g] ?? `${g} günde bir`;

export function StokEkrani() {
  const depo = useVeri();
  const bugun = useBugun();
  const [yeniUrun, setYeniUrun] = useState(false);
  const [sayilacak, setSayilacak] = useState(null);
  const urunler = depo.urunler();
  const alimlar = M.db.hepsi('alimlar');
  const acik = depo.acikAlisveris();
  const grup = new Map();
  for (const a of alimlar) { if (!grup.has(a.urunId)) grup.set(a.urunId, []); grup.get(a.urunId).push(a); }
  const sayimVakti = urunler.filter((u) => StokMantik.sayimVakti(u, bugun));
  const genel = AlimMantik.ozet(alimlar, bugun);
  const sirali = [...urunler].sort((a, b) => (a.stokTakip === b.stokTakip ? a.ad.localeCompare(b.ad, 'tr') : a.stokTakip ? -1 : 1));

  return html`<${Ekran} baslik="Stok" alt="Evde ne kadar var, ne zaman biter">
    <${Kart} dikey=${10}><div class="satir">
      <div class="dolu"><div class="bk soluk">Bu yıl harcama</div><div class="tm">${tl(genel.buYilHarcama)}</div></div>
      <div class="dolu"><div class="bk soluk">Bu yıl tasarruf</div><div class="tm c-adacayi">${tl(genel.buYilTasarruf)}</div></div>
      <${YuvarlakButon} ikon="arti" aciklama="Ürün ekle" arka=${RENK.adacayi} onClick=${() => setYeniUrun(true)} />
    </div></${Kart}>
    ${sayimVakti.length > 0 && html`<${Kart} dikey=${6}>
      <div class="ts c-sari">Stoğu sayar mısın?</div>
      ${sayimVakti.map((u) => html`<div class="satir" style="height:42px">
        <${Ikon} ad=${u.ikon} boy=${16} renk=${RENK.sari} />
        <span class="bm dolu tek" style="margin-left:9px">${u.ad} · şu an ${u.stok} ${u.birim}</span>
        <${MetinButon} onClick=${() => setSayilacak(u)}>Say</${MetinButon}></div>`)}
    </${Kart}>`}
    <${Kart} dikey=${4}>${sirali.map((u, i) => {
      const ul = grup.get(u.id) ?? [];
      const o = AlimMantik.ozet(ul, bugun);
      const gunluk = u.stokTakip ? StokMantik.gunlukTuketim(ul, u.stok, bugun) : null;
      const kalan = StokMantik.kalanGun(u.stok, gunluk);
      const alinmali = StokMantik.alinmali(u, kalan);
      const listedeMi = acik.some((m) => m.urunId === u.id || esitTr(m.ad, u.ad));
      const alt = [
        kalan != null ? `~${kalan} gün yeter` : null,
        gunluk != null ? (gunluk >= 1 ? `günde ~${sayi(Math.round(gunluk * 10) / 10)}` : `~${Math.round(1 / gunluk)} günde 1`) : null,
        o.sonGun != null ? `son alım: ${kucukTr(gunBaslik(o.sonGun, bugun))}` : 'henüz alım yok',
        o.ortalamaAralikGun != null && kalan == null ? `~${o.ortalamaAralikGun} günde bir alınıyor` : null,
        u.sayimGun != null ? `sayım: ${sayimMetni(u.sayimGun)}` : null,
      ].filter(Boolean).join(' · ');
      return html`<div key=${u.id}>${i > 0 && html`<div class="ayrac"></div>`}
        <div class="satir tikla" style="height:48px" onClick=${() => git('urun/' + u.id)}>
          <${Ikon} ad=${u.ikon} boy=${18} renk=${RENK.mercan} />
          <div class="dolu" style="margin-left:10px"><div class="bm tek">${u.ad}</div><div class="bk soluk tek">${alt}</div></div>
          ${u.stokTakip && html`<button class="ts" style=${{ padding: '6px', color: alinmali ? RENK.mercan : 'var(--yazi)' }} onClick=${(e) => { e.stopPropagation(); setSayilacak(u); }}>${u.stok}</button>`}
          ${alinmali && (listedeMi ? html`<span class="bk soluk">listede</span>`
            : html`<${MetinButon} onClick=${(e) => { e.stopPropagation(); depo.alisveriseEkle(u.ad, u.id, u.ikon); }}>Listeye</${MetinButon}>`)}
        </div></div>`;
    })}</${Kart}>
    ${yeniUrun && html`<${UrunDialog} onKapat=${() => setYeniUrun(false)} onKaydet=${(u) => { Is.urunKaydet(u); setYeniUrun(false); }} />`}
    ${sayilacak && html`<${StokSayDialog} u=${sayilacak} onKapat=${() => setSayilacak(null)} onKaydet=${(n) => { depo.stokSay(sayilacak.id, n); setSayilacak(null); }} />`}
  </${Ekran}>`;
}

/** Alım kaydı: tarih, miktar, birim fiyat, normal fiyat (tasarruf açıksa), nereden. */
export function AlimDialog({ u, bugun, onKapat, kapatMetni = 'Vazgeç', onVazgec, onKaydet }) {
  const [adet, setAdet] = useState(1);
  const [fiyat, setFiyat] = useState('');
  const [normal, setNormal] = useState(euroGirdi(u.normalFiyatSent));
  const [yer, setYer] = useState('');
  const [gun, setGun] = useState(bugun);
  const f = parseEuro(fiyat), n = parseEuro(normal);
  return html`<${Dialog} baslik=${`${u.ad} alındı`} onKapat=${onVazgec ?? onKapat}
    butonlar=${[{ metin: kapatMetni, onClick: onKapat }, { metin: 'Kaydet', onClick: () => onKaydet(gun, adet, f, n, yer.trim() || null) }]}>
    <div class="sutun g8">
      <div class="satir">
        <${MetinButon} stil=${{ fontSize: '20px' }} onClick=${() => setAdet(Math.max(1, adet - 1))}>−</${MetinButon}>
        <span class="tm dolu" style="text-align:center">${adet} ${u.birim}</span>
        <${MetinButon} stil=${{ fontSize: '20px' }} onClick=${() => setAdet(adet + 1)}>+</${MetinButon}>
      </div>
      <${Girdi} etiket="Birim fiyat € (isteğe bağlı)" deger=${fiyat} onDeger=${(v) => setFiyat(sadeceSayi(v))} inputmode="decimal" />
      ${u.tasarruf && html`<${Girdi} etiket="Normal fiyat € (indirimsiz)" deger=${normal} onDeger=${(v) => setNormal(sadeceSayi(v))} inputmode="decimal" />`}
      <${Girdi} etiket="Nereden (isteğe bağlı)" deger=${yer} onDeger=${setYer} />
      <div class="satir"><span class="bm">Tarih:</span><${TarihButon} gun=${gun} bugun=${bugun} enGec=${bugun} onGun=${setGun} /></div>
      ${u.tasarruf && f != null && n != null && n > f && html`<span class="ts c-adacayi">Tasarruf: ${tl((n - f) * adet)}</span>`}
    </div>
  </${Dialog}>`;
}

export function UrunDialog({ u = null, onKapat, onKaydet }) {
  const [ad, setAd] = useState(u?.ad ?? '');
  const [birim, setBirim] = useState(u?.birim ?? 'adet');
  const [tasarruf, setTasarruf] = useState(u?.tasarruf ?? false);
  const [stok, setStok] = useState(u?.stokTakip ?? false);
  const [sayim, setSayim] = useState(u?.sayimGun ?? null);
  const [esik, setEsik] = useState(u?.esik != null ? String(u.esik) : '');
  return html`<${Dialog} baslik=${u == null ? 'Yeni ürün' : 'Ürünü düzenle'} onKapat=${onKapat}
    butonlar=${[{ metin: 'Vazgeç', onClick: onKapat }, { metin: 'Kaydet', disabled: !ad.trim(), onClick: () => onKaydet({ ...(u ?? {}), ad: ad.trim(), birim, tasarruf, stokTakip: stok,
      sayimGun: stok ? sayim : null, esik: stok && esik ? parseInt(esik, 10) : null }) }]}>
    <div class="sutun g8">
      <${Girdi} etiket="Ad" deger=${ad} onDeger=${setAd} otomatik=${!u} />
      <div class="sar">${['adet', 'paket', 'kg', 'şişe', 'rulo'].map((b) => html`<${Cip} metin=${b} secili=${birim === b} onClick=${() => setBirim(b)} />`)}</div>
      <div class="satir"><span class="bm dolu">Tasarruf takibi</span><${Anahtar} acik=${tasarruf} etiket="Tasarruf takibi" onDegis=${setTasarruf} /></div>
      <div class="satir"><span class="bm dolu">Stok takibi</span><${Anahtar} acik=${stok} etiket="Stok takibi" onDegis=${setStok} /></div>
      ${stok && html`<span class="bk">Stoğu sayar mısın? Ne sıklıkla sorayım:</span>
        <div class="sar">${[[null, 'Sorma'], [7, 'Haftada bir'], [14, '2 haftada'], [30, 'Ayda bir'], [90, '3 ayda']].map(([g, a]) => html`<${Cip} metin=${a} secili=${sayim === g} onClick=${() => setSayim(g)} />`)}</div>
        <${Girdi} etiket=${`Kaç tane kalınca listeye? (boş = ${STOK_ESIGI})`} deger=${esik} onDeger=${(v) => setEsik(sadeceSayi(v, false).slice(0, 3))} inputmode="numeric" />`}
    </div>
  </${Dialog}>`;
}

/** "Kaç tane var?" elle sayım. */
export function StokSayDialog({ u, baslik, onKapat, onKaydet }) {
  const [deger, setDeger] = useState(String(u.stok));
  const n = parseInt(deger, 10);
  return html`<${Dialog} baslik=${baslik ?? `${u.ad}: kaç ${u.birim} var?`} onKapat=${onKapat}
    butonlar=${[{ metin: 'Vazgeç', onClick: onKapat }, { metin: 'Kaydet', onClick: () => { if (!Number.isNaN(n)) onKaydet(n); } }]}>
    <div class="satir" style="gap:4px">
      <${MetinButon} stil=${{ fontSize: '22px' }} onClick=${() => setDeger(String(Math.max(0, (n || 0) - 1)))}>−</${MetinButon}>
      <div class="dolu"><${Girdi} deger=${deger} onDeger=${(v) => setDeger(sadeceSayi(v, false).slice(0, 4))} inputmode="numeric" stil=${{ textAlign: 'center' }} /></div>
      <${MetinButon} stil=${{ fontSize: '22px' }} onClick=${() => setDeger(String((n || 0) + 1))}>+</${MetinButon}>
    </div>
  </${Dialog}>`;
}

// ---------------- Takviye ----------------
export const sekilIkonu = (s) => (s === 'damla' ? 'su' : s === 'tablet' ? 'tablet' : 'hap');
const ondalik = (s) => { const x = parseFloat(String(s).replace(',', '.')); return Number.isNaN(x) ? null : x; };

export function TakviyeEkrani() {
  useVeri();
  const bugun = useBugun();
  const [duzenle, setDuzenle] = useState(null);
  const [ekle, setEkle] = useState(null);
  const liste = M.db.hepsi('takviyeler').sort((a, b) => a.id - b.id);
  return html`<${Ekran} baslik="Takviye">
    <div class="bk soluk">Dozun kadar stoktan kendiliğinden düşer. Kuralı her takviyede seçebilirsin (örn. 10 adetin altına inince); seçmezsen ${TAKVIYE_UYARI_GUN} gün kala alışveriş listesine eklenir ve sabah haber verilir.</div>
    ${liste.map((t) => {
      const stok = StokMantik.takviyeStok(t, bugun);
      const kalan = StokMantik.takviyeKalanGun(t, bugun);
      const az = StokMantik.takviyeAzMi(t, bugun);
      return html`<${Kart} key=${t.id} dikey=${8}><div class="satir tikla" onClick=${() => setDuzenle(t)}>
        <${Ikon} ad=${sekilIkonu(t.sekil)} boy=${20} renk=${RENK.lavanta} />
        <div class="dolu" style="margin-left:10px">
          <div class="bm">${t.ad}</div>
          <div class="bk" style=${{ color: t.gunlukDoz <= 0 ? RENK.sari : 'var(--soluk)' }}>${t.gunlukDoz <= 0 ? 'Doz ve stok gir'
            : `${StokMantik.siklikMetni(t.siklikGun)} ${sayi(t.gunlukDoz)} · stok ${sayi(stok)}` + (t.esikAdet != null ? ` · ${sayi(t.esikAdet)} altında listeye` : '')}</div>
        </div>
        ${t.gunlukDoz > 0 && html`<span class="ts" style=${{ color: az ? RENK.mercan : 'var(--yazi)' }}>${kalan} gün</span>`}
        <${MetinButon} onClick=${(e) => { e.stopPropagation(); setEkle(t); }}>+ Aldım</${MetinButon}>
      </div></${Kart}>`;
    })}
    <div><${MetinButon} onClick=${() => setDuzenle({ ad: '', gunlukDoz: 1, stok: 0, stokGunu: bugun, sekil: 'kapsul', siklikGun: 1, esikAdet: null })}>+ Takviye ekle</${MetinButon}></div>
    ${duzenle && html`<${TakviyeDialog} t=${duzenle} bugun=${bugun} onKapat=${() => setDuzenle(null)}
      onSil=${() => { M.db.sil('takviyeler', duzenle.id); setDuzenle(null); }} onKaydet=${(t) => { Is.takviyeKaydet(t); setDuzenle(null); }} />`}
    ${ekle && html`<${TekAlanDialog} baslik=${`${ekle.ad}: kaç adet aldın?`} ilk="30" sayisal tamam="Stoğa ekle" onKapat=${() => setEkle(null)}
      onTamam=${(v) => { const n = ondalik(v); if (n != null) M.depo.takviyeEkle(ekle, n); setEkle(null); }} />`}
  </${Ekran}>`;
}

function TakviyeDialog({ t, bugun, onKapat, onSil, onKaydet }) {
  const [ad, setAd] = useState(t.ad);
  const [sekil, setSekil] = useState(t.sekil ?? 'kapsul');
  const [doz, setDoz] = useState(sayi(t.gunlukDoz));
  const [stok, setStok] = useState(sayi(StokMantik.takviyeStok(t, bugun)));
  const [siklik, setSiklik] = useState(Math.max(t.siklikGun ?? 1, 1));
  const [esik, setEsik] = useState(t.esikAdet != null ? sayi(t.esikAdet) : '');
  return html`<${Dialog} baslik=${!t.id ? 'Yeni takviye' : t.ad} onKapat=${onKapat}
    butonlar=${[{ metin: 'Vazgeç', onClick: onKapat }, { metin: 'Kaydet', disabled: !ad.trim(), onClick: () => onKaydet({ ...t, ad: ad.trim(), sekil,
      gunlukDoz: ondalik(doz) ?? 0, stok: ondalik(stok) ?? 0, stokGunu: bugun, siklikGun: siklik, esikAdet: ondalik(esik) }) }]}>
    <div class="sutun g8">
      <${Girdi} etiket="Ad" deger=${ad} onDeger=${setAd} otomatik=${!t.id} />
      <div class="satir" style="gap:6px">${[['kapsul', 'Kapsül'], ['tablet', 'Tablet'], ['damla', 'Damla']].map(([k, a]) => html`<${Cip} metin=${a} secili=${sekil === k} onClick=${() => setSekil(k)} />`)}</div>
      <div class="satir" style="gap:6px">${[[1, 'Her gün'], [2, '2 günde'], [7, 'Haftada']].map(([g, a]) => html`<${Cip} metin=${a} secili=${siklik === g} onClick=${() => setSiklik(g)} />`)}</div>
      <${Girdi} etiket="Her seferinde kaç adet" deger=${doz} onDeger=${(v) => setDoz(sadeceSayi(v))} inputmode="decimal" />
      <${Girdi} etiket="Şu an elindeki (adet)" deger=${stok} onDeger=${(v) => setStok(sadeceSayi(v))} inputmode="decimal" />
      <${Girdi} etiket="Kural: kaç adetin altına inince listeye?" ipucu=${`boş = ${TAKVIYE_UYARI_GUN} gün kala`} deger=${esik} onDeger=${(v) => setEsik(sadeceSayi(v))} inputmode="decimal" />
      ${!!t.id && html`<div><${MetinButon} renk=${RENK.mercan} onClick=${onSil}>Sil</${MetinButon}></div>`}
    </div>
  </${Dialog}>`;
}

// ---------------- Şirket kartı ----------------
export function KartEkrani() {
  const depo = useVeri();
  const bugun = useBugun();
  const bt = tarih(bugun);
  const [yil, setYil] = useState(bt.y);
  const [ay, setAy] = useState(bt.m);
  const [tutar, setTutar] = useState('10');
  const [gun, setGun] = useState(bugun);
  const [silSor, setSilSor] = useState(null);
  const liste = M.db.hepsi('para').sort((a, b) => b.gun - a.gun || b.id - a.id);
  const aylik = AlimMantik.aylikToplam(liste);
  const ayListe = liste.filter((p) => { const d = tarih(p.gun); return d.y === yil && d.m === ay; });
  const ekle = () => { const s = parseEuro(tutar); if (s != null && s > 0) { Is.paraEkle(gun, s); setTutar('10'); setGun(bugun); } };
  return html`<${Ekran} baslik="Şirket kartı" alt="Yüklenen paralar">
    <${Kart} dikey=${8}><div class="satir" style="gap:4px">
      <div class="dolu"><${Girdi} etiket="Tutar €" deger=${tutar} onDeger=${(v) => setTutar(sadeceSayi(v))} inputmode="decimal" /></div>
      <${TarihButon} gun=${gun} bugun=${bugun} enGec=${bugun} onGun=${setGun} />
      <${YuvarlakButon} ikon="tik" aciklama="Ekle" arka=${RENK.sari} onClick=${ekle} />
    </div></${Kart}>
    <div class="satir" style="gap:6px">${KART_TUTARLARI.map((e) => html`<${Cip} metin=${e + ' €'} secili=${parseEuro(tutar) === e * 100} renk=${RENK.sari} onClick=${() => setTutar(String(e))} />`)}</div>
    <${Kart} dikey=${10}>
      <div class="satir">
        <${IkonButon} ikon="geri" aciklama="Önceki yıl" onClick=${() => setYil(yil - 1)} />
        <span class="ts">${yil}</span>
        <${IkonButon} ikon="ileri" aciklama="Sonraki yıl" onClick=${() => setYil(yil + 1)} />
        <span class="dolu"></span>
        <div style="text-align:right"><div class="lk">Yıl: ${tl(AlimMantik.yilToplam(liste, yil))}</div>
          <div class="bk soluk">Aylık ort.: ${tl(AlimMantik.aylikOrtalama(liste, yil, bugun))}</div></div>
      </div>
      <${AylikGrafik} yil=${yil} seciliAy=${ay} aylik=${aylik} onAy=${setAy} />
    </${Kart}>
    <div class="lk soluk">${AY_UZUN[ay - 1]} ${yil} · ${tl(ayListe.reduce((s, p) => s + p.tutarSent, 0))}</div>
    <${Kart} dikey=${4}>
      ${ayListe.length === 0 && html`<div class="bm soluk" style="padding:8px 0">Bu ay kayıt yok.</div>`}
      ${ayListe.map((p) => html`<div key=${p.id} class="satir" style="height:36px" ...${uzunBas(() => setSilSor(p), null)}>
        <${Ikon} ad="kart" boy=${16} renk=${RENK.sari} />
        <span class="bm dolu" style="margin-left:9px">${gunAyHg(p.gun)}</span>
        <span class="ts">${tl(p.tutarSent)}</span></div>`)}
    </${Kart}>
    ${silSor && html`<${Dialog} baslik=${`${tl(silSor.tutarSent)} kaydı silinsin mi?`} onKapat=${() => setSilSor(null)}
      butonlar=${[{ metin: 'Vazgeç', onClick: () => setSilSor(null) }, { metin: 'Sil', renk: RENK.mercan, onClick: () => { depo.paraSil(silSor); setSilSor(null); } }]} />`}
  </${Ekran}>`;
}

function AylikGrafik({ yil, seciliAy, aylik, onAy }) {
  const degerler = Array.from({ length: 12 }, (_, i) => aylik.get(yil * 100 + i + 1) ?? 0);
  const enFazla = Math.max(...degerler, 1);
  return html`<div class="satir" style="height:110px;align-items:flex-end">${degerler.map((v, i) => html`
    <button class="dolu" style="display:flex;flex-direction:column;align-items:center" aria-label=${AY_UZUN[i]} onClick=${() => onAy(i + 1)}>
      <div style="height:86px;width:100%;padding:0 3px;display:flex;align-items:flex-end">
        <i style=${{ display: 'block', width: '100%', height: (86 * v / enFazla) + 'px', borderRadius: '3px 3px 0 0', background: i + 1 === seciliAy ? RENK.sari : 'color-mix(in srgb, var(--sari) 45%, transparent)' }}></i></div>
      <span class="bk" style=${{ color: i + 1 === seciliAy ? 'var(--yazi)' : 'var(--soluk)' }}>${i + 1}</span>
    </button>`)}</div>`;
}

// ---------------- Ürün detayı ----------------
function Satir({ ad, deger, renk }) {
  return html`<div class="satir"><span class="bm soluk dolu">${ad}</span><span class="ts" style=${{ color: renk }}>${deger}</span></div>`;
}

export function UrunDetay({ id }) {
  const depo = useVeri();
  const bugun = useBugun();
  const [sekme, setSekme] = useState(0);
  const [aldim, setAldim] = useState(false);
  const [duzenle, setDuzenle] = useState(false);
  const [say, setSay] = useState(false);
  const u = M.db.getir('urunler', id);
  if (!u || u.arsiv) return html`<div class="icerik"><${YuvarlakButon} ikon="geri" aciklama="Geri" onClick=${geri} /></div>`;
  const alimlar = M.db.hepsi('alimlar').filter((a) => a.urunId === id).sort((a, b) => b.gun - a.gun || b.id - a.id);
  const o = AlimMantik.ozet(alimlar, bugun);
  const gerekli = u.stokTakip ? AlimMantik.yilSonunaKadarGerekli(o.yillikAdet, u.stok, bugun) : null;
  return html`<div class="icerik"><div class="sutun g10">
    <div class="satir">
      <${YuvarlakButon} ikon="geri" aciklama="Geri" onClick=${geri} /><span style="width:10px"></span>
      <${Ikon} ad=${u.ikon} boy=${22} renk=${RENK.mercan} /><span style="width:8px"></span>
      <span class="tm dolu">${u.ad}</span>
      <${MetinButon} onClick=${() => setDuzenle(true)}>Düzenle</${MetinButon}>
    </div>
    <div class="satir" style="gap:8px">
      <${YuvarlakButon} ikon="arti" aciklama="Aldım" arka=${RENK.adacayi} onClick=${() => setAldim(true)} />
      <span class="bm dolu">Aldım</span>
      ${u.stokTakip && html`<${MetinButon} onClick=${() => setSay(true)}>Stok: ${u.stok} · say</${MetinButon}>`}
    </div>
    <${Kart} dikey=${10}><div class="sutun g4">
      <${Satir} ad="Toplam alım" deger=${`${o.alimSayisi} kez · ${o.toplamAdet} ${u.birim}`} />
      <${Satir} ad="Sıklık" deger=${o.ortalamaAralikGun != null ? `~${o.ortalamaAralikGun} günde bir` : '—'} />
      <${Satir} ad="Yıllık tüketim" deger=${o.yillikAdet != null ? `~${o.yillikAdet} ${u.birim}` : 'en az 2 ay veri gerekli'} />
      <${Satir} ad="Bu ay harcama" deger=${tl(o.buAyHarcama)} />
      <${Satir} ad="Bu yıl harcama" deger=${tl(o.buYilHarcama)} />
      ${u.tasarruf && html`<${Satir} ad="Normal fiyat" deger=${u.normalFiyatSent != null ? tl(u.normalFiyatSent) : '—'} />
        <${Satir} ad="Bu yıl tasarruf" deger=${tl(o.buYilTasarruf)} renk=${RENK.adacayi} />
        <${Satir} ad="Toplam tasarruf" deger=${tl(o.toplamTasarruf)} renk=${RENK.adacayi} />`}
      ${u.stokTakip && html`<${Satir} ad="Yıl sonuna kadar" deger=${gerekli == null ? '—' : gerekli === 0 ? 'stok yetiyor' : `${gerekli} ${u.birim} daha`} />`}
    </div></${Kart}>
    <div><${Segment} secenekler=${['Fiyat geçmişi', 'Tüm alımlar']} secili=${sekme} onSec=${setSekme} /></div>
    ${sekme === 0 ? html`
      <${Kart} dikey=${10}><div class="sutun g4">
        <${Satir} ad="Son fiyat" deger=${o.sonFiyat != null ? tl(o.sonFiyat) : '—'} />
        <${Satir} ad="En ucuz" deger=${o.enUcuz != null ? tl(o.enUcuz) : '—'} />
        <${Satir} ad="En pahalı" deger=${o.enPahali != null ? tl(o.enPahali) : '—'} />
      </div></${Kart}>
      ${alimlar.filter((a) => a.odenenSent != null).map((a) => html`<div class="satir" style="height:30px">
        <span class="bk soluk" style="width:100px;flex:none">${gunYil(a.gun)}</span><span class="bk soluk dolu tek">${a.yer ?? ''}</span><span class="ts">${tl(a.odenenSent)}</span></div>`)}`
    : html`${alimlar.map((a) => html`<div class="satir" style="height:30px">
        <span class="bk soluk" style="width:100px;flex:none">${gunYil(a.gun)}</span><span class="bm dolu">${a.adet} ${u.birim}</span>
        ${a.odenenSent != null && html`<span class="bk soluk">${tl(a.odenenSent * a.adet)}</span>`}</div>`)}
      ${alimlar.length === 0 && html`<div class="bm soluk" style="padding:8px">Henüz alım yok.</div>`}`}
  </div>
  ${aldim && html`<${AlimDialog} u=${u} bugun=${bugun} onKapat=${() => setAldim(false)} onKaydet=${(g, adet, od, nr, yer) => { Is.alimEkle(u.id, g, adet, od, nr, yer); setAldim(false); }} />`}
  ${duzenle && html`<${UrunDialog} u=${u} onKapat=${() => setDuzenle(false)} onKaydet=${(x) => { Is.urunKaydet(x); setDuzenle(false); }} />`}
  ${say && html`<${StokSayDialog} u=${u} baslik=${`Elde kaç ${u.birim} var?`} onKapat=${() => setSay(false)} onKaydet=${(n) => { depo.stokSay(u.id, n); setSay(false); }} />`}
  </div>`;
}

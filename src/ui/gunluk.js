// Günlük ekranı: gün/hafta/ay, filtre, kayıtlı filtreler, elle kayıt, düzenle/geri al (GunlukEkrani.kt).
import { html, useState, useMemo } from '../../vendor/preact-htm.js';
import { M, useVeri, useBugun } from './durum.js';
import { Ikon, Kart, Cip, Segment, YuvarlakButon, IkonButon, MetinButon, Dialog, Girdi, SesleYaz, uzunBas, vurgu, RENK } from './ortak.js';
import { GunlukMantik, euro } from '../mantik.js';
import { gunBaslik, saatMetni, tarih, isoHafta, AY_KISA, AY_UZUN, gunInput, inputGun } from '../tarih.js';
import { ikonAdi } from '../ikonlar.js';
import { sonIslem } from './durum.js';

export const KAYNAKLAR = ['TAKIP', 'SAYAC', 'BAKIM', 'ALIM', 'ALISVERIS', 'AJANDA', 'ZINCIR', 'PARA', 'ELLE'];
export const kaynakAdi = (k) => ({ TAKIP: 'Takip', SAYAC: 'Sayaç', BAKIM: 'Bakım', ALIM: 'Alım', ALISVERIS: 'Alışveriş', AJANDA: 'Ajanda', ZINCIR: 'Zincir', PARA: 'Para', ELLE: 'Elle' })[k];
export const kaynakRengi = (k) => ({ TAKIP: RENK.adacayi, BAKIM: RENK.adacayi, SAYAC: RENK.sari, PARA: RENK.sari, ALIM: RENK.mercan, ALISVERIS: RENK.mercan, AJANDA: RENK.lavanta, ZINCIR: RENK.lavanta, ELLE: RENK.lavanta })[k];
export const kaynakIkonu = (k) => ({ TAKIP: 'takip', SAYAC: 'tik', BAKIM: 'kalp', ALIM: 'paket', ALISVERIS: 'alim', AJANDA: 'ajanda', ZINCIR: 'zincir', PARA: 'isci', ELLE: 'kalem' })[k];

const MOD_RENK = [RENK.mercan, RENK.sari, RENK.adacayi];
const MOD_AD = ['zor', 'orta', 'iyi'];

/** 3 yüz: zor · orta · iyi. Seçili olana tekrar dokunmak kaldırır. */
export function ModSecici({ mod, kucuk, onMod }) {
  const b = kucuk ? 30 : 38, p = kucuk ? 6 : 7;
  return html`<div class="satir">${[0, 1, 2].map((s) => {
    const secili = mod === s;
    return html`<button aria-label=${'Günün modu: ' + MOD_AD[s]} onClick=${() => onMod(secili ? null : s)} style=${{ width: b + 'px', height: b + 'px', padding: p + 'px', color: secili ? MOD_RENK[s] : mod == null ? 'var(--soluk)' : 'var(--cizgi)' }}>
      <${Ikon} ad=${'yuz' + s} boy=${b - 2 * p} /></button>`;
  })}</div>`;
}

export function KayitSatiri({ k, ikonAdi: ia, onUzun }) {
  return html`<div class="satir tikla" style=${{ height: '32px' }} ...${uzunBas(onUzun, onUzun)}>
    <${Ikon} ad=${ia ? ikonAdi(ia) : kaynakIkonu(k.kaynak)} boy=${16} renk=${kaynakRengi(k.kaynak)} />
    <span class="bm dolu tek" style=${{ marginLeft: '9px' }}>${k.metin}</span>
    ${k.tutarSent != null && html`<span class="bk soluk">${euro(k.tutarSent)}  </span>`}
    <span class="bk soluk" style=${{ marginLeft: '6px' }}>${saatMetni(k.zaman)}</span>
  </div>`;
}

function donemMetni(gorunum, a, bugun) {
  if (gorunum === 0) return gunBaslik(a.bas, bugun);
  if (gorunum === 1) { const b = tarih(a.bas), s = tarih(a.son); return `Hafta ${isoHafta(a.bas)} · ${b.d}–${s.d} ${AY_KISA[s.m - 1]}`; }
  const t = tarih(a.bas); return `${AY_UZUN[t.m - 1]} ${t.y}`;
}

const bosFiltre = () => ({ kaynaklar: new Set(), kategoriler: new Set(), arama: '', aralik: 0 });
const aktif = (f) => f.kaynaklar.size > 0 || f.kategoriler.size > 0 || f.arama.trim() !== '' || f.aralik !== 0;

export function GunlukEkrani() {
  const depo = useVeri();
  const bugun = useBugun();
  const [gorunum, setGorunum] = useState(1);
  const [ofset, setOfset] = useState(0);
  const [filtre, setFiltre] = useState(bosFiltre());
  const [filtreAcik, setFiltreAcik] = useState(false);
  const [ekleAcik, setEkleAcik] = useState(false);
  const [duzenle, setDuzenle] = useState(null);
  const [eskiOnce, setEskiOnce] = useState(false);

  const aralik = filtre.aralik === 1 ? { bas: bugun - 29, son: bugun } : filtre.aralik === 2 ? GunlukMantik.yil(bugun) : filtre.aralik === 3 ? { bas: 0, son: bugun + 3650 }
    : gorunum === 0 ? GunlukMantik.gun(bugun, ofset) : gorunum === 1 ? GunlukMantik.hafta(bugun, ofset) : GunlukMantik.ay(bugun, ofset);
  const ham = depo.aralik(aralik.bas, aralik.son);
  const modMap = new Map(depo.modAralik(aralik.bas, aralik.son).map((m) => [m.gun, m.seviye]));
  const kategoriler = M.db.hepsi('kategoriler').sort((a, b) => a.sira - b.sira || a.id - b.id);
  const isIkon = new Map(depo.isDurumlari(bugun).map((d) => [d.id, d.ikon]));
  const liste = GunlukMantik.filtrele(ham, filtre.kaynaklar, filtre.kategoriler, filtre.arama);
  const gruplar = GunlukMantik.gruplu(liste, eskiOnce);

  return html`<div class="icerik sabit">
    <div class="satir">
      <span class="bs dolu">Günlük</span>
      <${YuvarlakButon} ikon="sirala" aciklama=${eskiOnce ? 'Sıralama: eskiden yeniye' : 'Sıralama: yeniden eskiye'} arka=${eskiOnce ? RENK.lavanta : null} onClick=${() => setEskiOnce(!eskiOnce)} />
      <span style="width:8px"></span>
      <${YuvarlakButon} ikon="filtrele" aciklama="Filtre" arka=${aktif(filtre) ? RENK.lavanta : null} onClick=${() => setFiltreAcik(true)} />
      <span style="width:8px"></span>
      <${YuvarlakButon} ikon="arti" aciklama="Elle kayıt ekle" arka=${RENK.adacayi} onClick=${() => setEkleAcik(true)} />
    </div>
    <div style="height:8px"></div>
    ${filtre.aralik === 0 ? html`<div class="satir">
        <${Segment} secenekler=${['Gün', 'Hafta', 'Ay']} secili=${gorunum} onSec=${(i) => { setGorunum(i); setOfset(0); }} />
        <span class="dolu"></span>
        <${IkonButon} ikon="geri" aciklama="Önceki" boy=${18} onClick=${() => setOfset(ofset - 1)} />
        <button class="lk" onClick=${() => setOfset(0)}>${donemMetni(gorunum, aralik, bugun)}</button>
        <${IkonButon} ikon="ileri" aciklama="Sonraki" boy=${18} disabled=${ofset >= 0} renk=${ofset < 0 ? 'var(--yazi)' : 'var(--cizgi)'} onClick=${() => { if (ofset < 0) setOfset(ofset + 1); }} />
      </div>` : html`<div class="satir">
        <span class="lk dolu">${['', 'Son 30 gün', 'Bu yıl', 'Tüm kayıtlar'][filtre.aralik]} · ${liste.length} kayıt</span>
        <${MetinButon} onClick=${() => setFiltre(bosFiltre())}>Filtreyi kaldır</${MetinButon}>
      </div>`}
    ${aktif(filtre) && filtre.aralik === 0 && html`<div class="satir">
      <span class="bk soluk dolu tek">${filtreOzet(filtre, kategoriler)}</span>
      <${MetinButon} onClick=${() => setFiltre(bosFiltre())}>Kaldır</${MetinButon}>
    </div>`}
    <div style="height:6px"></div>
    <div class="kaydir">
      ${gorunum === 2 && filtre.aralik === 0 && !aktif(filtre)
        ? html`<${AyGorunumu} a=${aralik} bugun=${bugun} gruplar=${new Map(gruplar)} modlar=${modMap} onGun=${(g) => { setGorunum(0); setOfset(g - bugun); }} />`
        : gruplar.length === 0
          ? html`<${Kart} dikey=${14}><span class="bm soluk">${aktif(filtre) ? 'Bu filtreyle kayıt yok.' : 'Bu dönemde kayıt yok. Bir işi tikleyince ya da + ile yazınca burada görünür.'}</span></${Kart}>`
          : html`<div class="sutun g8">${gruplar.map(([g, kayitlar]) => html`<${Kart} key=${g} dikey=${6}>
              <${GunBasligi} g=${g} bugun=${bugun} sayi=${kayitlar.length} mod=${modMap.get(g)} onMod=${(s) => depo.modYaz(g, s)} />
              ${kayitlar.map((k) => html`<${KayitSatiri} key=${k.id} k=${k} ikonAdi=${isIkon.get(k.refId)} onUzun=${() => setDuzenle(k)} />`)}
            </${Kart}>`)}</div>`}
    </div>
    ${filtreAcik && html`<${FiltrePaneli} mevcut=${filtre} kategoriler=${kategoriler} onKapat=${() => setFiltreAcik(false)} onUygula=${(f) => { setFiltre(f); setFiltreAcik(false); }} />`}
    ${ekleAcik && html`<${KayitDialog} ilkGun=${gorunum === 0 && filtre.aralik === 0 ? Math.min(aralik.bas, bugun) : bugun} bugun=${bugun} kategoriler=${kategoriler}
      onKapat=${() => setEkleAcik(false)} onKaydet=${(m, g, kat) => { const id = depo.elleKayit(m, g, kat); sonIslem('Günlüğe yazıldı', id); setEkleAcik(false); }} />`}
    ${duzenle && html`<${KayitDialog} k=${duzenle} ilkGun=${duzenle.gun} bugun=${bugun} kategoriler=${kategoriler}
      onKapat=${() => setDuzenle(null)} onSil=${() => { depo.geriAl(duzenle.id); setDuzenle(null); }}
      onKaydet=${(m, g, kat) => { depo.kayitDuzenle(duzenle.id, m, g, kat); setDuzenle(null); }} />`}
  </div>`;
}

function filtreOzet(f, kat) {
  const l = [];
  if (f.kaynaklar.size) l.push([...f.kaynaklar].map(kaynakAdi).join(', '));
  if (f.kategoriler.size) l.push(kat.filter((k) => f.kategoriler.has(k.id)).map((k) => k.ad).join(', '));
  if (f.arama.trim()) l.push(`"${f.arama}"`);
  return l.join(' · ');
}

export function GunBasligi({ g, bugun, sayi, mod, onMod }) {
  return html`<div class="satir" style=${{ height: '30px' }}>
    <span class="ts">${gunBaslik(g, bugun)}</span>
    <span class="bk soluk dolu">  · ${sayi} kayıt</span>
    <${ModSecici} mod=${mod} kucuk onMod=${onMod} />
  </div><div class="ayrac"></div>`;
}

function AyGorunumu({ a, bugun, gruplar, modlar, onGun }) {
  const gunler = [];
  for (let g = a.son; g >= a.bas; g--) if (g <= bugun) gunler.push(g);
  return html`<${Kart} dikey=${6}>${gunler.map((g) => {
    const l = gruplar.get(g) ?? [];
    const md = modlar.get(g);
    return html`<div class="satir tikla" style=${{ height: '28px' }} onClick=${() => onGun(g)}>
      <span class="bm" style=${{ width: '110px', flex: 'none' }}>${gunBaslik(g, bugun)}</span>
      <span class="bk soluk dolu tek">${l.length === 0 ? '—' : `${l.length} kayıt · ` + l.slice(0, 2).map((k) => k.metin.split(':')[0]).join(', ')}</span>
      ${md != null && html`<${Ikon} ad=${'yuz' + md} boy=${16} renk=${MOD_RENK[md]} />`}
    </div>`;
  })}</${Kart}>`;
}

function FiltrePaneli({ mevcut, kategoriler, onKapat, onUygula }) {
  useVeri();
  const [f, setF] = useState({ ...mevcut, kaynaklar: new Set(mevcut.kaynaklar), kategoriler: new Set(mevcut.kategoriler) });
  const [kayitAdi, setKayitAdi] = useState('');
  const [silSor, setSilSor] = useState(null);
  const kayitlilar = M.db.hepsi('filtreler').sort((a, b) => a.id - b.id);
  const degis = (set, x) => { const y = new Set(set); if (y.has(x)) y.delete(x); else y.add(x); return y; };
  const cevir = (k) => ({ kaynaklar: new Set(k.kaynaklar.split(',').map((x) => x.trim()).filter((x) => KAYNAKLAR.includes(x))),
    kategoriler: new Set(k.kategoriler.split(',').map((x) => parseInt(x, 10)).filter((x) => !Number.isNaN(x))), arama: k.arama, aralik: 0 });
  return html`<${Dialog} baslik="Filtre" onKapat=${onKapat} butonlar=${[{ metin: 'Temizle', onClick: () => onUygula(bosFiltre()) }, { metin: 'Uygula', onClick: () => onUygula(f) }]}>
    <div class="sutun g10">
      ${kayitlilar.length > 0 && html`<div><div class="lk" style="margin-bottom:6px">Kayıtlı filtreler</div><div class="sar">
        ${kayitlilar.map((k) => html`<button class="cip secili" style=${{ background: RENK.lavanta }} ...${uzunBas(() => setSilSor(k), () => onUygula(cevir(k)))}>${k.ad}</button>`)}
      </div></div>`}
      <${Girdi} etiket="Ara (örn. çarşaf)" deger=${f.arama} onDeger=${(v) => setF({ ...f, arama: v })} />
      <div><div class="lk" style="margin-bottom:6px">Kaynak</div><div class="sar">
        ${KAYNAKLAR.map((k) => html`<${Cip} metin=${kaynakAdi(k)} secili=${f.kaynaklar.has(k)} renk=${kaynakRengi(k)} onClick=${() => setF({ ...f, kaynaklar: degis(f.kaynaklar, k) })} />`)}
      </div></div>
      <div><div class="lk" style="margin-bottom:6px">Kategori</div><div class="sar">
        ${kategoriler.map((k) => html`<${Cip} metin=${k.ad} secili=${f.kategoriler.has(k.id)} renk=${vurgu(k.renk)} onClick=${() => setF({ ...f, kategoriler: degis(f.kategoriler, k.id) })} />`)}
      </div></div>
      <div><div class="lk" style="margin-bottom:6px">Tarih</div><div class="sar">
        ${['Görünüm', 'Son 30 gün', 'Bu yıl', 'Tümü'].map((s, i) => html`<${Cip} metin=${s} secili=${f.aralik === i} onClick=${() => setF({ ...f, aralik: i })} />`)}
      </div></div>
      <div class="satir" style="gap:4px">
        <div class="dolu"><${Girdi} etiket="Bu filtreyi kaydet: ad" deger=${kayitAdi} onDeger=${setKayitAdi} /></div>
        <${IkonButon} ikon="kaydet" aciklama="Kaydet" boy=${20} onClick=${() => {
          if (kayitAdi.trim() && aktif(f)) {
            M.db.ekle('filtreler', { ad: kayitAdi.trim(), kaynaklar: [...f.kaynaklar].join(','), kategoriler: [...f.kategoriler].join(','), arama: f.arama });
            setKayitAdi('');
          }
        }} />
      </div>
    </div>
    ${silSor && html`<${Dialog} baslik=${`"${silSor.ad}" silinsin mi?`} onKapat=${() => setSilSor(null)}
      butonlar=${[{ metin: 'Vazgeç', onClick: () => setSilSor(null) }, { metin: 'Sil', onClick: () => { M.db.sil('filtreler', silSor.id); setSilSor(null); } }]} />`}
  </${Dialog}>`;
}

/** Elle kayıt ekleme / düzenleme. Silme = geri alma (stok vb. iade edilir). */
export function KayitDialog({ k = null, ilkGun, bugun, kategoriler, onKapat, onSil, ilkMetin = '', onKaydet }) {
  const [metin, setMetin] = useState(k?.metin ?? ilkMetin);
  const [gun, setGun] = useState(ilkGun);
  const [kat, setKat] = useState(k?.kategoriId ?? null);
  const [silSor, setSilSor] = useState(false);
  return html`<${Dialog} baslik=${k ? 'Kaydı düzenle' : 'Günlüğe yaz'} onKapat=${onKapat}
    butonlar=${[{ metin: 'Vazgeç', onClick: onKapat }, { metin: 'Kaydet', disabled: !metin.trim(), onClick: () => { if (metin.trim()) onKaydet(metin, gun, kat); } }]}>
    <div class="sutun g10">
      <div class="satir" style="gap:4px"><div class="dolu"><${Girdi} deger=${metin} onDeger=${setMetin} ipucu="Örn. Nehir'i hastaneye götürdük" otomatik=${!k} /></div>
        <${SesleYaz} onMetin=${(s) => setMetin(metin.trim() ? `${metin} ${s}` : s)} /></div>
      <${TarihSatiri} etiket="Tarih:" gun=${gun} bugun=${bugun} enGec=${bugun} onGun=${setGun} bugunButonu />
      <div class="sar">${kategoriler.map((c) => html`<${Cip} metin=${c.ad} secili=${kat === c.id} renk=${vurgu(c.renk)} onClick=${() => setKat(kat === c.id ? null : c.id)} />`)}</div>
      ${k && html`<${MetinButon} renk=${RENK.mercan} stil=${{ alignSelf: 'flex-start' }} onClick=${() => setSilSor(true)}>Bu kaydı sil / geri al</${MetinButon}>`}
    </div>
    ${silSor && html`<${Dialog} baslik="Kayıt silinsin mi?" onKapat=${() => setSilSor(false)}
      butonlar=${[{ metin: 'Vazgeç', onClick: () => setSilSor(false) }, { metin: 'Sil', onClick: () => { onSil(); setSilSor(false); } }]}>
      <span class="bm">Takip ya da sayaç kaydıysa sayım ve stok da geri alınır.</span></${Dialog}>`}
  </${Dialog}>`;
}

/** "Tarih: [Bugün]" düğmesi; dokununca telefonun tarih seçicisi açılır. */
export function TarihSatiri({ etiket, gun, bugun, onGun, enGec, enErken, bugunButonu, bos = null }) {
  return html`<div class="satir" style="gap:2px;flex-wrap:wrap">
    ${etiket && html`<span class="bm">${etiket}</span>`}
    <${TarihButon} gun=${gun} bugun=${bugun} onGun=${onGun} enGec=${enGec} enErken=${enErken} bos=${bos} />
    ${bugunButonu && gun !== bugun && html`<${MetinButon} onClick=${() => onGun(bugun)}>Bugün</${MetinButon}>`}
  </div>`;
}

export function TarihButon({ gun, bugun, onGun, enGec, enErken, bos = null, metin }) {
  return html`<label class="metinbtn" style="position:relative;overflow:hidden">${metin ?? (gun == null ? bos : gunBaslik(gun, bugun))}
    <input type="date" value=${gun != null ? gunInput(gun) : ''} max=${enGec != null ? gunInput(enGec) : undefined} min=${enErken != null ? gunInput(enErken) : undefined}
      style="position:absolute;inset:0;opacity:0;width:100%;cursor:pointer"
      onChange=${(e) => { let g = inputGun(e.target.value); if (g == null) return; if (enGec != null) g = Math.min(g, enGec); onGun(g); }} /></label>`;
}

export function useHafiza(f, deps) { return useMemo(f, deps); }

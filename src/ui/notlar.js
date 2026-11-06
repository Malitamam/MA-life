// Notlar: bekleyenler (İşlenmemiş), arama, liste, sesli not; not detayı (NotlarEkrani.kt, NotDetay.kt).
import { html, useState, useEffect, useRef } from '../../vendor/preact-htm.js';
import { M, useVeri, useBugun, git, geri, pencereAc } from './durum.js';
import { Ikon, Kart, Cip, YuvarlakButon, IkonButon, MetinButon, Dialog, Girdi, SesleYaz, uzunBas, vurgu, RENK } from './ortak.js';
import { GunlukMantik, NotMantik } from '../mantik.js';
import { zamanMetni } from '../tarih.js';
import { KayitDialog } from './gunluk.js';
import { useKayitta, sesToggle } from './ses.js';
import { Is } from './islem.js';

const ilkSatir = (m) => (m.split('\n')[0] ?? '').slice(0, 80);

export function siraliNotlar() {
  return M.db.hepsi('notlar').sort((a, b) => (a.islendi - b.islendi) || (b.sabit - a.sabit) || (b.olusturma - a.olusturma));
}

export function NotlarEkrani() {
  const depo = useVeri();
  const bugun = useBugun();
  const [yeni, setYeni] = useState(false);
  const [ara, setAra] = useState('');
  const [gunlugeIcin, setGunlugeIcin] = useState(null);
  const [silinecek, setSilinecek] = useState(null);
  const notlar = siraliNotlar();
  const kategoriler = M.db.hepsi('kategoriler').sort((a, b) => a.sira - b.sira || a.id - b.id);
  const islenmemis = notlar.filter((n) => !n.islendi);
  const digerleri = notlar.filter((n) => n.islendi && GunlukMantik.eslesir(n.metin, ara));

  return html`<div class="icerik"><div class="sutun g8">
    <div class="satir">
      <span class="bs dolu">Notlar</span>
      <${KayitButonu} />
      <span style="width:8px"></span>
      <${YuvarlakButon} ikon="arti" aciklama="Yeni not" arka=${RENK.lavanta} onClick=${() => setYeni(true)} />
    </div>
    ${islenmemis.length > 0 && html`<div class="lk soluk">Bekleyen · ${islenmemis.length}</div>
      ${islenmemis.map((n) => html`<${Kart} key=${'i' + n.id} dikey=${8}>
        <div class="satir" style="align-items:flex-start">
          ${n.sesYolu && html`<${SesOynat} yol=${n.sesYolu} />`}
          <span class="bm dolu uc tikla" style="padding-top:2px" onClick=${() => git('not/' + n.id)}>${n.metin.trim() || 'Yazıya dökülüyor…'}</span>
          <span class="bk soluk" style="margin-left:6px">${zamanMetni(n.olusturma, bugun)}</span>
        </div>
        <div class="sar" style="margin-top:6px">
          <${Cip} metin="Görev" renk=${RENK.adacayi} onClick=${() => pencereAc({ tur: 'ajanda', notId: n.id, baslik: ilkSatir(n.metin) })} />
          <${Cip} metin="Etkinlik" renk=${RENK.lavanta} onClick=${() => pencereAc({ tur: 'ajanda', notId: n.id, baslik: ilkSatir(n.metin), ajandaTur: 'ETKINLIK' })} />
          <${Cip} metin="Alışveriş" renk=${RENK.mercan} onClick=${() => {
            M.db.islem(() => { for (const p of n.metin.split(/[,\n]/).map((x) => x.trim()).filter(Boolean)) depo.alisveriseEkle(p.charAt(0).toLocaleUpperCase('tr-TR') + p.slice(1), null, 'paket'); Is.notIslendi(n.id); });
          }} />
          <${Cip} metin="Günlük" renk=${RENK.sari} onClick=${() => setGunlugeIcin(n)} />
          <${Cip} metin="Not kalsın" onClick=${() => Is.notIslendi(n.id)} />
          <${Cip} metin="Sil" renk=${RENK.mercan} onClick=${() => setSilinecek(n)} />
        </div>
      </${Kart}>`)}`}
    <${Girdi} deger=${ara} onDeger=${setAra} ipucu="Notlarda ara" />
    <${Kart} dikey=${4}>
      ${digerleri.length === 0 && html`<div class="bm soluk" style="padding:8px 0">Not yok.</div>`}
      ${digerleri.map((n, i) => {
        const kat = kategoriler.find((k) => k.id === n.kategoriId);
        return html`<div key=${n.id}>${i > 0 && html`<div class="ayrac"></div>`}
          <div class="satir tikla" style="min-height:46px" ...${uzunBas(() => M.db.guncelle('notlar', n.id, { sabit: !n.sabit }), () => git('not/' + n.id))}>
            ${n.sabit && html`<${Ikon} ad="yildiz" boy=${13} renk=${RENK.sari} />`}
            ${n.sesYolu && html`<${Ikon} ad="mikrofon" boy=${13} renk="var(--soluk)" />`}
            <div class="dolu" style="margin-left:6px;padding:4px 0">
              <div class="bm iki">${n.metin.trim() || '(boş)'}</div>
              <div class="bk" style=${{ color: kat ? vurgu(kat.renk) : 'var(--soluk)' }}>${[kat?.ad, zamanMetni(n.olusturma, bugun)].filter(Boolean).join(' · ')}</div>
            </div>
          </div></div>`;
      })}
    </${Kart}>
    <div class="bk soluk">Uzun bas: not üstte sabitlenir.</div>
  </div>
  ${yeni && html`<${YeniNotDialog} onKapat=${() => setYeni(false)} onKaydet=${(m) => { Is.notKaydet({ metin: m, olusturma: depo.simdi() }); setYeni(false); }} />`}
  ${silinecek && html`<${NotSilDialog} n=${silinecek} onKapat=${() => setSilinecek(null)} onSil=${() => { Is.notSil(silinecek); setSilinecek(null); }} />`}
  ${gunlugeIcin && html`<${KayitDialog} ilkGun=${bugun} bugun=${bugun} kategoriler=${kategoriler} ilkMetin=${gunlugeIcin.metin} onKapat=${() => setGunlugeIcin(null)}
    onKaydet=${(m, g, k) => { Is.elleKayit(m, g, k); Is.notIslendi(gunlugeIcin.id); setGunlugeIcin(null); }} />`}
  </div>`;
}

function NotSilDialog({ n, onKapat, onSil }) {
  return html`<${Dialog} baslik="Not silinsin mi?" onKapat=${onKapat} butonlar=${[{ metin: 'Vazgeç', onClick: onKapat }, { metin: 'Sil', renk: RENK.mercan, onClick: onSil }]}>
    ${n.sesYolu && html`<span class="bm">Ses kaydı da silinir.</span>`}</${Dialog}>`;
}

function YeniNotDialog({ onKapat, onKaydet }) {
  const [m, setM] = useState('');
  return html`<${Dialog} baslik="Not" onKapat=${onKapat} butonlar=${[{ metin: 'Vazgeç', onClick: onKapat }, { metin: 'Kaydet', disabled: !m.trim(), onClick: () => onKaydet(m.trim()) }]}>
    <div class="satir" style="align-items:flex-start;gap:4px">
      <div class="dolu"><${Girdi} tek=${false} deger=${m} onDeger=${setM} ipucu="Aklına geleni yaz…" otomatik /></div>
      <${SesleYaz} onMetin=${(s) => setM(m.trim() ? `${m}\n${s}` : s)} />
    </div>
  </${Dialog}>`;
}

/** Uygulama içinden sesli not: bas-başlat, bas-durdur. */
export function KayitButonu() {
  const { kayitta, baslangic } = useKayitta();
  const [, setT] = useState(0);
  useEffect(() => { if (!kayitta) return; const z = setInterval(() => setT((x) => x + 1), 500); return () => clearInterval(z); }, [kayitta]);
  const sure = kayitta ? Math.floor((Date.now() - baslangic) / 1000) : 0;
  return html`<${YuvarlakButon} ikon=${kayitta ? 'durdur' : 'mikrofon'} aciklama=${kayitta ? 'Kaydı durdur' : 'Sesli not'} arka=${kayitta ? RENK.mercan : null} onClick=${sesToggle} />
    ${kayitta && html`<span class="lk c-mercan"> ${Math.floor(sure / 60)}:${String(sure % 60).padStart(2, '0')}</span>`}`;
}

/** Sesli notu dinle. */
export function SesOynat({ yol }) {
  const [oynuyor, setOynuyor] = useState(false);
  const ref = useRef(null);
  useEffect(() => () => { ref.current?.pause(); if (ref.current?.src) URL.revokeObjectURL(ref.current.src); }, [yol]);
  const bas = async () => {
    if (oynuyor) { ref.current?.pause(); setOynuyor(false); return; }
    const blob = await M.db.sesAl(yol).catch(() => null);
    if (!blob) return;
    const a = new Audio(URL.createObjectURL(blob));
    a.onended = () => setOynuyor(false);
    ref.current = a;
    a.play().then(() => setOynuyor(true)).catch(() => setOynuyor(false));
  };
  return html`<${IkonButon} ikon=${oynuyor ? 'durdur' : 'oynat'} aciklama=${oynuyor ? 'Durdur' : 'Dinle'} boy=${18} renk=${RENK.lavanta} onClick=${bas} />`;
}

export function NotDetay({ id }) {
  useVeri();
  const n = M.db.getir('notlar', id);
  if (!n) return html`<div class="icerik"><${YuvarlakButon} ikon="geri" aciklama="Geri" onClick=${geri} /></div>`;
  return html`<${NotDetayIc} key=${id} n=${n} />`;
}

function NotDetayIc({ n }) {
  const [metin, setMetin] = useState(n.metin);
  const [silSor, setSilSor] = useState(false);
  const id = n.id;
  const kategoriler = M.db.hepsi('kategoriler').sort((a, b) => a.sira - b.sira || a.id - b.id);
  const bagli = M.db.hepsi('ajanda').filter((a) => a.notId === id);
  const satirlar = NotMantik.satirlar(metin);
  const kaydet = () => { if (metin !== n.metin) M.db.guncelle('notlar', id, { metin }); };
  const ajanda = (baslik, tur) => { kaydet(); pencereAc({ tur: 'ajanda', notId: id, baslik, ajandaTur: tur }); };

  return html`<div class="icerik"><div class="sutun g10">
    <div class="satir">
      <${YuvarlakButon} ikon="geri" aciklama="Geri" onClick=${() => { kaydet(); geri(); }} /><span style="width:10px"></span>
      <span class="tm dolu">${n.islendi ? 'Not' : 'İşlenmemiş not'}</span>
      ${n.sesYolu && html`<${SesOynat} yol=${n.sesYolu} />`}
      <${MetinButon} onClick=${() => M.db.guncelle('notlar', id, { sabit: !n.sabit })}>${n.sabit ? 'Sabiti kaldır' : 'Sabitle'}</${MetinButon}>
    </div>
    <div>
      <div class="satir" style="align-items:flex-start;gap:4px">
        <div class="dolu"><${Girdi} tek=${false} deger=${metin} onDeger=${setMetin} stil=${{ minHeight: '140px' }} onBlur=${kaydet} /></div>
        <${SesleYaz} onMetin=${(s) => setMetin(metin.trim() ? `${metin}\n${s}` : s)} />
      </div>
      ${metin !== n.metin && html`<${MetinButon} onClick=${kaydet}>Kaydet</${MetinButon}>`}
    </div>
    <div class="sar">${kategoriler.map((c) => html`<${Cip} metin=${c.ad} secili=${n.kategoriId === c.id} renk=${vurgu(c.renk)}
      onClick=${() => M.db.guncelle('notlar', id, { metin, kategoriId: n.kategoriId === c.id ? null : c.id })} />`)}</div>
    ${satirlar.length > 0 && html`<${Kart} dikey=${8}>
      <div class="lk soluk">Satırdan görev çıkar</div>
      ${satirlar.map((s) => {
        const giden = bagli.find((a) => NotMantik.ayni(a.baslik, s));
        return html`<div class="satir" style="min-height:40px">
          <span class=${'bm dolu' + (giden ? ' soluk cizik' : '')} style="padding:4px 0">${s}</span>
          ${giden ? html`<${MetinButon} onClick=${() => git('ajanda/' + giden.id)}>ajandada</${MetinButon}>`
            : html`<${MetinButon} onClick=${() => ajanda(s, 'GOREV')}>Görev yap</${MetinButon}>`}
        </div>`;
      })}
    </${Kart}>`}
    <div class="sar">
      <${Cip} metin="Etkinlik yap" renk=${RENK.lavanta} onClick=${() => ajanda(satirlar[0] ?? '', 'ETKINLIK')} />
      <${Cip} metin="Randevu yap" renk=${RENK.mercan} onClick=${() => ajanda(satirlar[0] ?? '', 'RANDEVU')} />
      ${!n.islendi && html`<${Cip} metin="İşlendi" renk=${RENK.sari} onClick=${() => { kaydet(); Is.notIslendi(id); }} />`}
      <${Cip} metin="Sil" renk=${RENK.mercan} onClick=${() => setSilSor(true)} />
    </div>
  </div>
  ${silSor && html`<${NotSilDialog} n=${n} onKapat=${() => setSilSor(false)} onSil=${() => { Is.notSil(n); setSilSor(false); geri(); }} />`}
  </div>`;
}

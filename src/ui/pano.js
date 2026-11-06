// Pano: üst şerit, Bugün/Hafta, zincirler, sayaç kısa yolları, bölüm butonları, düzen modu (PanoEkrani.kt).
import { html, useState } from '../../vendor/preact-htm.js';
import { M, Ayar, useVeri, useBugun, git, koyuMu, sonIslem } from './durum.js';
import { Ikon, Kart, Cip, Segment, YuvarlakButon, TikButon, MetinButon, Dialog, Girdi, SesleYaz, MiniRozet, Anahtar, uzunBas, vurgu, saydam, RENK } from './ortak.js';
import { AjandaMantik, GunlukMantik, PanoMantik, PanoDuzen, SayacMantik, StokMantik, tutarMetni } from '../mantik.js';
import { ayBasi, isoHafta, gunUzun, gunBaslik, saatMetni, saatYazi, gunAyHg } from '../tarih.js';
import { ModSecici, KayitDialog, kaynakIkonu, kaynakRengi } from './gunluk.js';
import { useYap } from './takip.js';
import { useSayacGirisi } from './sayac.js';
import { ZincirSatiri, ZincirKurDialog } from './zincir.js';
import { turRengi } from './ajanda.js';
import { useKayitta, sesToggle } from './ses.js';
import { Is } from './islem.js';
import { urunIkonu, urunEmoji, URUN_KATALOG } from '../ikonlar.js';

export const KART_TUTARLARI = [10, 20, 30, 40, 50];

const KISA = { 'Bulaşık makinesi': 'Bulaşık', 'Çamaşır makinesi': 'Çamaşır', 'Kurutma makinesi': 'Kurutma', 'Çamaşır asma': 'Asma', 'Bulaşık boşaltma': 'Boşaltma', 'Kahve paketi açtım': 'Kahve', 'Pfand iade': 'Pfand' };
const kisaAd = (ad) => KISA[ad] ?? ad;

/**
 * Pano kategorileri. Sayaç kategorilerinde öğe kimliği hazır sayacın anahtarıdır (diğer sayaçlarda 'is:<id>'),
 * buton kategorilerinde butonun anahtarı. varsayilan: favori seçilmemişken gösterilenler (null = hepsi).
 */
export const PANO_KATEGORI = [
  { k: 'sayac', ad: 'Hızlı sayaçlar', sayac: ['bulasik_calis', 'bulasik_bosalt', 'camasir', 'kurutucu', 'asma', 'cop', 'dyson', 'roborock'], digerleri: true, dar: true,
    varsayilan: ['bulasik_calis', 'camasir', 'kurutucu', 'asma', 'cop', 'dyson', 'roborock', '*'] },
  { k: 'liste', ad: 'Alışveriş listesi', liste: true, dar: true, varsayilan: null },
  { k: 'alim', ad: 'Alışveriş ve para', buton: ['alisveris', 'para', 'stok', 'takviye'], varsayilan: null },
  { k: 'kayit', ad: 'Not ve kayıt', buton: ['ses', 'elle', 'etkinlik'], varsayilan: null },
  { k: 'bolum', ad: 'Bölümler', buton: ['ev', 'sayacb', 'ozet'], varsayilan: null },
];
const HAZIR_ANAHTAR = new Set(PANO_KATEGORI.flatMap((k) => (Array.isArray(k.sayac) ? k.sayac : [])));

function favoriler() {
  let f; try { f = JSON.parse(M.db.ayarAl('pano_favori', '{}')) ?? {}; } catch { f = {}; }
  // Eski üç sayaç kategorisinin (mutfak, temizlik, diger) seçimleri tek listede birleşir.
  if (!f.sayac && (f.mutfak || f.temizlik || f.diger)) {
    const tanim = { mutfak: ['bulasik_calis', 'camasir', 'kurutucu', 'asma'], temizlik: ['cop', 'dyson', 'roborock'], diger: ['*'] };
    f.sayac = ['mutfak', 'temizlik', 'diger'].flatMap((k) => f[k] ?? tanim[k]);
  }
  return f;
}
function favoriYaz(kat, liste) { M.db.ayarYaz('pano_favori', JSON.stringify({ ...favoriler(), [kat]: liste })); }

export function PanoEkrani() {
  const depo = useVeri();
  const bugun = useBugun();
  const [elleKayit, setElleKayit] = useState(false);
  const [etkinlikYakala, setEtkinlikYakala] = useState(false);
  const [kartAcik, setKartAcik] = useState(false);
  const [favoriKat, setFavoriKat] = useState(null);
  const [yap0, tutarPenceresi] = useYap();
  const [sayacGiris, sayacPenceresi] = useSayacGirisi();
  const kayit = useKayitta();

  const isler = depo.isDurumlari(bugun);
  const islenmemis = M.db.hepsi('notlar').filter((n) => !n.islendi).length;
  const mod = M.db.getir('modlar', bugun)?.seviye ?? null;
  const kategoriler = M.db.hepsi('kategoriler').sort((a, b) => a.sira - b.sira || a.id - b.id);
  const evYakin = PanoMantik.evIsleriYakin(isler, bugun);
  const yap = (d) => { if (d.anahtar != null) sayacGiris(d.anahtar); else yap0(d); };
  const koyu = koyuMu();

  // Sayaç öğeleri
  const sayacOgesi = (d) => ({ id: d.anahtar ?? 'is:' + d.id, ad: kisaAd(d.ad), tamAd: d.ad, ikon: d.ikon, renk: vurgu(d.renk), zemin: saydam(vurgu(d.renk), 22),
    rozet: d.bugunSayi > 0 ? String(d.bugunSayi) : null, onClick: () => yap(d), onUzun: () => git('is/' + d.id) });
  const kullanim = new Map();
  for (const k of depo.aralik(bugun - 30, bugun)) if (k.kaynak === 'SAYAC') kullanim.set(k.refId, (kullanim.get(k.refId) ?? 0) + 1);
  const digerSayaclar = isler.filter((d) => d.tur === 'SAYAC' && !HAZIR_ANAHTAR.has(d.anahtar))
    .sort((a, b) => (kullanim.get(b.id) ?? 0) - (kullanim.get(a.id) ?? 0) || a.id - b.id);

  // Buton öğeleri
  const butonlar = [
    { anahtar: 'ev', ad: 'Ev işleri', ikon: 'ev', renk: RENK.adacayi, bilgi: evYakin.length === 0 ? '2 günde yok' : `2 günde ${evYakin.length}`, onClick: () => git('takip') },
    { anahtar: 'sayacb', ad: 'Sayaç', ikon: 'sayac', renk: RENK.sari, bilgi: (() => { const n = PanoMantik.bakimVakti(isler, bugun).length; return n > 0 ? `${n} bakım` : 'yapılanlar'; })(), onClick: () => git('sayac') },
    ...alimButonlari(depo, bugun, () => setKartAcik(true)),
    { anahtar: 'ozet', ad: 'Özet', ikon: 'detay', renk: RENK.adacayi, bilgi: `Hafta ${isoHafta(bugun)}`, onClick: () => git('ozet') },
    { anahtar: 'etkinlik', ad: 'Etkinlik', ikon: 'afis', renk: RENK.lavanta, bilgi: 'yakala', onClick: () => setEtkinlikYakala(true) },
    { anahtar: 'elle', ad: 'Elle kayıt', ikon: 'kalem', renk: RENK.lavanta, bilgi: 'Günlük', onClick: () => setElleKayit(true) },
    { anahtar: 'ses', ad: kayit.kayitta ? 'Durdur' : 'Sesli not', ikon: kayit.kayitta ? 'durdur' : 'mikrofon', renk: RENK.mercan, bilgi: kayit.kayitta ? 'kayıtta' : 'bas, konuş', onClick: sesToggle },
  ].map((b) => ({ ...b, id: b.anahtar, tamAd: b.ad, zemin: saydam(b.renk, 18) }));

  // Alışveriş listesi: sadece Alışveriş sekmesinde listede olan (henüz alınmamış) ürünler. Simgesi olanlar kutu,
  // elle yazılanlar (simgesi yok) altta yan yana. Dokununca Alışveriş sekmesi açılır.
  const acikListe = depo.acikAlisveris().filter((m) => !m.alindi).sort((a, b) => a.eklenme - b.eklenme);
  const hizliAd = new Set([...Ayar.hizliSecimler, ...URUN_KATALOG.flatMap((g) => g.urunler.map(([ad]) => ad))].map((x) => x.toLocaleLowerCase('tr-TR')));
  const simgeli = (m) => hizliAd.has(m.ad.trim().toLocaleLowerCase('tr-TR')) && urunEmoji(m.ad) !== '🛒';
  const listeOgeleri = acikListe.filter(simgeli).map((m) => ({ id: 'l:' + m.id, ad: m.ad, tamAd: m.ad, emoji: urunEmoji(m.ad),
    secili: false, etiket: m.ad + ' (alışveriş listesinde)', onClick: () => git('alim') }));
  const listeDisi = acikListe.filter((m) => !simgeli(m));

  const tumOgeler = (kat) => {
    if (kat.sayac) return [...kat.sayac.map((a) => isler.find((d) => d.anahtar === a)).filter(Boolean), ...(kat.digerleri ? digerSayaclar : [])].map(sayacOgesi);
    if (kat.liste) return listeOgeleri;
    return kat.buton.map((a) => butonlar.find((b) => b.anahtar === a)).filter(Boolean);
  };
  const fav = favoriler();
  // '*' = listede adı geçmeyen diğer tüm öğeler (yeni eklenen sayaçlar da kendiliğinden görünür).
  const seciliIdler = (kat, ogeler) => {
    const l = fav[kat.k] ?? kat.varsayilan ?? ogeler.map((o) => o.id);
    if (!l.includes('*')) return l;
    const adli = new Set([...l, ...(kat.sayac ?? [])]);
    return l.flatMap((id) => (id === '*' ? ogeler.filter((o) => !adli.has(o.id)).map((o) => o.id) : [id]));
  };

  return html`<div class="icerik"><div class="sutun">
    <div class="satir">
      <div class="dolu">
        <div class="tm">${gunUzun(bugun)}</div>
        <div class="bk soluk">Hafta ${isoHafta(bugun)}</div>
      </div>
      <${ModSecici} mod=${mod} kucuk onMod=${(s) => depo.modYaz(bugun, s)} />
      <span style="width:4px"></span>
      <div style="position:relative">
        <${YuvarlakButon} ikon="notlar" aciklama="İşlenmemiş notlar" onClick=${() => git('notlar')} />
        ${islenmemis > 0 && html`<${MiniRozet} metin=${String(islenmemis)} stil=${{ top: '-4px', right: '-4px' }} />`}
      </div>
      <span style="width:6px"></span>
      <${YuvarlakButon} ikon=${koyu ? 'gunes' : 'ay'} aciklama=${koyu ? 'Açık tema' : 'Koyu tema'} onClick=${() => { Ayar.tema = koyu ? 1 : 2; }} />
      <span style="width:6px"></span>
      <${YuvarlakButon} ikon="ara" aciklama="Ara" onClick=${() => git('ara')} />
      <span style="width:6px"></span>
      <${YuvarlakButon} ikon="ayar" aciklama="Ayarlar" onClick=${() => git('ayarlar')} />
    </div>
    ${PANO_KATEGORI.map((kat) => {
      const ogeler = tumOgeler(kat);
      if (!ogeler.length && !kat.liste) return null;
      if (kat.liste) return html`<section key=${kat.k} class="pano-kat" aria-label=${kat.ad}>
        <button class="satir pano-kat-bas" style="width:100%;text-align:left" onClick=${() => git('alim')}>
          <span class="lk soluk dolu">${kat.ad} · ${acikListe.length} ürün</span><${Ikon} ad="ileri" boy=${13} renk="var(--soluk)" /></button>
        ${acikListe.length === 0 && html`<div class="bk soluk" style="padding:0 2px">Liste boş.</div>`}
        ${ogeler.length > 0 && html`<div class="izgara6">${ogeler.map((o) => html`<${KucukKutu} key=${o.id} o=${o} dar />`)}</div>`}
        ${listeDisi.length > 0 && html`<div class="sar" style="gap:6px">${listeDisi.map((m) => html`<button key=${m.id} class="liste-cip" onClick=${() => git('alim')}>${m.ad}</button>`)}</div>`}
      </section>`;
      const secili = seciliIdler(kat, ogeler);
      const gorunen = secili.map((id) => ogeler.find((o) => o.id === id)).filter(Boolean);
      return html`<section key=${kat.k} class="pano-kat" aria-label=${kat.ad}>
        <div class="satir pano-kat-bas">
          <span class="lk soluk dolu">${kat.ad}</span>
          <button class="ucnokta" aria-label=${kat.ad + ': favorileri seç'} onClick=${() => setFavoriKat(kat.k)}>⋯</button>
        </div>
        ${gorunen.length === 0
          ? html`<button class="bk soluk" style="padding:4px 2px 2px;text-align:left" onClick=${() => setFavoriKat(kat.k)}>Favori yok. ⋯ ile seç.</button>`
          : html`<div class=${kat.dar ? 'izgara6' : 'izgara5'}>${gorunen.map((o) => html`<${KucukKutu} key=${o.id} o=${o} dar=${kat.dar} />`)}</div>`}
      </section>`;
    })}
  </div>
  ${tutarPenceresi}${sayacPenceresi}
  ${favoriKat && (() => {
    const kat = PANO_KATEGORI.find((k) => k.k === favoriKat);
    const ogeler = tumOgeler(kat);
    return html`<${FavoriDialog} kat=${kat} ogeler=${ogeler} secili=${seciliIdler(kat, ogeler)} onKapat=${() => setFavoriKat(null)} />`;
  })()}
  ${etkinlikYakala && html`<${EtkinlikYakalaDialog} onKapat=${() => setEtkinlikYakala(false)}
    onKaydet=${(m) => { Is.notKaydet({ metin: m, olusturma: depo.simdi(), islendi: false }); setEtkinlikYakala(false); }} />`}
  ${kartAcik && html`<${KartDialog} bugun=${bugun} onKapat=${() => setKartAcik(false)} onTumu=${() => { setKartAcik(false); git('kart'); }} />`}
  ${elleKayit && html`<${KayitDialog} ilkGun=${bugun} bugun=${bugun} kategoriler=${kategoriler} onKapat=${() => setElleKayit(false)}
    onKaydet=${(m, g, k) => { Is.elleKayit(m, g, k); setElleKayit(false); }} />`}
  </div>`;
}

/** Panodaki küçük kare kutu: simge, kısa ad, (varsa) kısa bilgi ve bugünkü sayı rozeti. Uzun basınca ayrıntı. */
export function KucukKutu({ o, dar }) {
  const olay = o.onUzun ? uzunBas(o.onUzun, o.onClick) : { onClick: o.onClick };
  return html`<button class=${'kkutu' + (dar ? ' dar' : '') + (o.secili ? ' secili' : '')} aria-label=${o.etiket ?? (o.onUzun ? o.tamAd + ' +1' : o.tamAd)} aria-pressed=${o.secili == null ? undefined : !!o.secili} ...${olay}>
    ${o.emoji ? html`<span class="kkutu-emoji" aria-hidden="true">${o.emoji}</span>`
      : html`<div class="daire" style=${{ width: dar ? '26px' : '30px', height: dar ? '26px' : '30px', background: o.zemin }}><${Ikon} ad=${o.ikon} boy=${dar ? 15 : 17} renk=${o.renk} /></div>`}
    <span class="kkutu-ad">${o.ad}</span>
    ${o.bilgi && html`<span class="kkutu-bilgi">${o.bilgi}</span>`}
    ${o.secili && html`<span class="kkutu-tik"><${Ikon} ad="tik" boy=${9} /></span>`}
    ${o.rozet && html`<${MiniRozet} metin=${o.rozet} stil=${{ top: '2px', right: '2px' }} />`}
  </button>`;
}

/** Kategorinin ⋯ menüsü: hangi öğelerin panoda görüneceğini (favoriler) seçer. Sıra: seçiliş sırası. */
function FavoriDialog({ kat, ogeler, secili, onKapat }) {
  const [liste, setListe] = useState(secili.filter((id) => ogeler.some((o) => o.id === id)));
  const degis = (id, acik) => setListe(acik ? [...liste, id] : liste.filter((x) => x !== id));
  return html`<${Dialog} baslik=${'Favoriler · ' + kat.ad} onKapat=${onKapat} butonlar=${[
    { metin: 'Vazgeç', onClick: onKapat },
    { metin: 'Kaydet', onClick: () => { favoriYaz(kat.k, liste); onKapat(); } },
  ]}>
    <span class="bk soluk">Açık olanlar panoda görünür.</span>
    ${ogeler.map((o) => html`<div key=${o.id} class="satir" style="min-height:44px">
      <div class="daire" style=${{ width: '28px', height: '28px', background: o.zemin, flex: 'none' }}><${Ikon} ad=${o.ikon} boy=${16} renk=${o.renk} /></div>
      <span class="bm dolu" style="margin-left:10px">${o.tamAd}</span>
      <${Anahtar} acik=${liste.includes(o.id)} etiket=${o.tamAd} onDegis=${(a) => degis(o.id, a)} />
    </div>`)}
  </${Dialog}>`;
}

function PanoAjandaSatiri({ g, gr, bugun, kategoriler }) {
  const kat = kategoriler.find((k) => k.id === gr.a.kategoriId);
  const ust = [g !== bugun && gr.a.tarih != null ? gunBaslik(g, bugun) : null, gr.a.saatDakika != null ? saatYazi(gr.a.saatDakika) : null, gr.a.baslik].filter((x) => x != null).join(' · ');
  return html`<div class="satir tikla" style="height:42px" onClick=${() => git('ajanda/' + gr.a.id)}>
    <${Ikon} ad="ajanda" boy=${15} renk=${turRengi(gr.a.tur)} />
    <div class="dolu" style="margin-left:9px">
      <div class="bm tek">${ust}</div>
      ${kat && html`<div class="bk tek" style=${{ color: vurgu(kat.renk) }}>${kat.ad}</div>`}
    </div>
    ${gr.gecikti && html`<span class="bk c-sari">yeni tarih?</span>`}
    <${TikButon} renk=${turRengi(gr.a.tur)} dolu=${false} aciklama=${gr.a.baslik + ' yapıldı'} onClick=${() => Is.ajandaTikle(gr.a.id, gr.olay, gr.a.baslik)} />
  </div>`;
}

export function BolumKutusu({ b }) {
  return html`<button class="bolum" aria-label=${b.ad} onClick=${b.onClick}>
    <${Ikon} ad=${b.ikon} boy=${20} renk=${b.renk} />
    <span class="lk tek">${b.ad}</span>
    ${b.bilgi && html`<span class="bk soluk tek">${b.bilgi}</span>`}
  </button>`;
}

/** Bölüm kısa yolları: Alışveriş, Stok, Takviye, Şirket kartı. */
function alimButonlari(depo, bugun, onKart) {
  const takviyeler = M.db.hepsi('takviyeler');
  const acik = depo.acikAlisveris();
  const urunler = depo.urunler();
  const rozet = acik.some((m) => depo.simdi() - m.eklenme > 7 * 86_400_000);
  const azTakviye = takviyeler.filter((t) => StokMantik.takviyeAzMi(t, bugun));
  let enYakin = null;
  for (const t of takviyeler.filter((x) => x.gunlukDoz > 0)) if (!enYakin || StokMantik.takviyeKalanGun(t, bugun) < StokMantik.takviyeKalanGun(enYakin, bugun)) enYakin = t;
  const ab = ayBasi(bugun);
  const buAy = M.db.hepsi('para').filter((p) => p.gun >= ab && p.gun <= bugun).reduce((s, p) => s + p.tutarSent, 0);
  const bekleyen = acik.length;
  const sayim = urunler.filter((u) => StokMantik.sayimVakti(u, bugun)).length;
  const azStok = urunler.filter((u) => StokMantik.azMi(u)).length;
  return [
    { anahtar: 'alisveris', ad: 'Alışveriş', ikon: 'alim', renk: RENK.mercan, bilgi: bekleyen === 0 ? 'boş' : `${bekleyen} ürün` + (rozet ? ' (!)' : ''), onClick: () => git('alim') },
    { anahtar: 'stok', ad: 'Stok', ikon: 'stok', renk: RENK.adacayi, bilgi: sayim > 0 ? `${sayim} sayılacak` : azStok > 0 ? `${azStok} azaldı` : 'tamam', onClick: () => git('stok') },
    { anahtar: 'takviye', ad: 'Takviye', ikon: 'takviye', renk: RENK.lavanta,
      bilgi: azTakviye.length ? `${azTakviye.length} azaldı` : enYakin ? `${enYakin.ad.slice(0, 8)} · ${StokMantik.takviyeKalanGun(enYakin, bugun)} g` : 'ayarla', onClick: () => git('takviye') },
    { anahtar: 'para', ad: 'Kart', ikon: 'kart', renk: RENK.sari, bilgi: 'bu ay ' + tutarMetni(buAy), onClick: onKart },
  ];
}

/** Şirket kartı: 10/20/30/40/50 € tek dokunuşla eklenir; bu ayın tarihli listesi ve toplamı. */
function KartDialog({ bugun, onKapat, onTumu }) {
  useVeri();
  const [secili, setSecili] = useState(10);
  const ab = ayBasi(bugun);
  const buAy = M.db.hepsi('para').filter((p) => p.gun >= ab && p.gun <= bugun).sort((a, b) => b.gun - a.gun || b.id - a.id);
  return html`<${Dialog} baslik="Şirket kartı" onKapat=${onKapat} butonlar=${[{ metin: 'Tümü, grafik', onClick: onTumu }, { metin: 'Kapat', onClick: onKapat }]}>
    <div class="sutun g8">
      <div class="sar">${KART_TUTARLARI.map((e) => html`<${Cip} metin=${e + ' €'} secili=${secili === e} renk=${RENK.sari} onClick=${() => setSecili(e)} />`)}</div>
      <button class="anabtn" onClick=${() => Is.paraEkle(bugun, secili * 100)}>Ekle · ${secili} €</button>
      <span class="ts">Bu ay · ${tutarMetni(buAy.reduce((s, p) => s + p.tutarSent, 0))}</span>
      ${buAy.length === 0 && html`<span class="bk soluk">Bu ay henüz yükleme yok.</span>`}
      ${buAy.slice(0, 8).map((p) => html`<div class="satir"><span class="bk soluk dolu">${gunAyHg(p.gun)}</span><span class="bk">${tutarMetni(p.tutarSent)}</span></div>`)}
      ${buAy.length > 8 && html`<span class="bk soluk">+${buAy.length - 8} kayıt daha</span>`}
    </div>
  </${Dialog}>`;
}

/** Düzen modunda blok başında ↑ ↓. Uzun basınca düzen modu açılır. */
function BlokCercevesi({ anahtar, sira, toplam, duzenMod, onTasi, onUzun, children }) {
  const ad = { gun: 'Bugün / Hafta', zincir: 'Zincirler', sayac: 'Sayaçlar' }[anahtar] ?? 'Butonlar';
  const u = uzunBas(onUzun, null);
  return html`<div onPointerDown=${u.onPointerDown} onPointerUp=${u.onPointerUp} onPointerLeave=${u.onPointerLeave} onPointerCancel=${u.onPointerCancel} onPointerMove=${u.onPointerMove}>
    ${duzenMod && html`<div class="satir">
      <span class="lk c-sari dolu">${ad}</span>
      <${MetinButon} disabled=${sira === 0} onClick=${() => onTasi(-1)}>↑ yukarı</${MetinButon}>
      <${MetinButon} disabled=${sira >= toplam - 1} onClick=${() => onTasi(1)}>↓ aşağı</${MetinButon}>
    </div>`}
    ${children}
  </div>`;
}

/** Hızlı etkinlik yakalama: Notlar'a (İşlenmemiş) düşer; sonra nottan "Etkinlik yap". */
function EtkinlikYakalaDialog({ onKapat, onKaydet }) {
  const [m, setM] = useState('');
  return html`<${Dialog} baslik="Etkinlik yakala" onKapat=${onKapat}
    butonlar=${[{ metin: 'Vazgeç', onClick: onKapat }, { metin: 'Kaydet', disabled: !m.trim(), onClick: () => onKaydet(m.trim()) }]}>
    <span class="bk">Ne, nerede, ne zaman? Kısaca yaz ya da söyle. Notlar'da İşlenmemiş kutusuna düşer.</span>
    <div class="satir" style="gap:4px"><div class="dolu"><${Girdi} tek=${false} stil=${{ minHeight: '70px' }} deger=${m} onDeger=${setM} ipucu="örn. Dachau şehir festivali 14 Haziran" otomatik /></div>
      <${SesleYaz} onMetin=${(s) => setM(m.trim() ? `${m} ${s}` : s)} /></div>
  </${Dialog}>`;
}

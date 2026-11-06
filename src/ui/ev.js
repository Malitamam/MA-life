// Ev modu: evin krokisi (2D) ve karakterle gezinti (2.5D). Nesneye dokunmak, uygulamanın zaten yaptığı kaydı yapar.
import { html, useState, useEffect, useRef, useMemo } from '../../vendor/preact-htm.js';
import { M, Ayar, useVeri, useBugun, git, pencereAc } from './durum.js';
import { Ikon, MetinButon, Girdi, Segment, bildir, saydam, RENK } from './ortak.js';
import { Mantik, SayacMantik, StokMantik, AjandaMantik } from '../mantik.js';
import { gunAyHg } from '../tarih.js';
import { durumMetni, durumRengi, TutarDialog } from './takip.js';
import { useSayacGirisi } from './sayac.js';
import { Is } from './islem.js';
import { ODALAR, DIS, ESYALAR, ALANLAR, ODA_AD, bolge, izgaraKur, yolBul, eylemNoktasi } from '../ev/plan.js';
import { Kamera, zeminCiz, esyaCiz, duvarKutulari, duvarCiz, citKutulari, kutu, alanCiz, alanYazisi, hap, isaretCiz, karakterCiz, ucanYaziCiz } from '../ev/cizim.js';

// ---------------------------------------------------------------- veri bağlantısı

const esit = (a, b) => a.toLocaleLowerCase('tr-TR') === b.toLocaleLowerCase('tr-TR');
const isBul = (isler, ad) => isler.find((i) => esit(i.ad, ad)) ?? null;

/** Nesne → satırlar. is: mevcut iş adı; yeni: yoksa ilk dokunuşta açılır; sayac: hazır sayaç anahtarı. */
const AYNA = [
  { is: 'Diş fırçalama', yeni: { tur: 'SAYAC', ikon: 'dis', renk: 2, kategoriId: 3, yildizli: false } },
  { is: 'Sakal tıraşı' }, { is: 'Saç tıraşı' }, { is: 'Ağda' }, { is: 'El tırnağı' }, { is: 'Ayak tırnağı' },
];
const BAHCE = (ad, gun, ikon = 'su') => ({ is: ad, yeni: { tur: 'PERIYODIK', periyotGun: gun, ikon, renk: 2, kategoriId: 1, hatirlatici: false } });
const EYLEM = {
  yatak: { baslik: 'Yatak', satir: [{ is: 'Bizim çarşaf' }, { git: 'gunluk', metin: 'Günlüğe yaz', ikon: 'gunluk' }] },
  nyatak: { baslik: "Nehir'in yatağı", satir: [{ is: "Nehir'in çarşafı" }] },
  wc: { baslik: 'Tuvalet', satir: [{ is: 'Tuvalet temizliği', yeni: { tur: 'PERIYODIK', periyotGun: 7, ikon: 'temizlik', renk: 2, kategoriId: 1, hatirlatici: false } }, { is: 'Lavabo temizliği' }] },
  aynawc: { baslik: 'Ayna (WC)', satir: AYNA },
  aynaantre: { baslik: 'Antre aynası', satir: AYNA },
  aynabanyo: { baslik: 'Banyo aynası', satir: AYNA },
  dus: { baslik: 'Duş', satir: [{ is: 'Banyo', metin: 'Duş aldım' }] },
  kuvet: { baslik: 'Küvet', satir: [{ is: 'Banyo temizliği' }] },
  banyotemiz: { baslik: 'Banyo temizliği', satir: [{ is: 'Banyo temizliği' }, { is: 'Komple temizlik' }] },
  camasir: { baslik: 'Çamaşır ve kurutma', satir: [{ sayac: 'camasir' }, { sayac: 'kurutucu' }, { sayac: 'asma' }, { is: 'Çamaşır makinesi temizliği' }] },
  bulasik: { baslik: 'Bulaşık makinesi', satir: [{ sayac: 'bulasik_calis' }, { sayac: 'bulasik_bosalt' }, { is: 'Bulaşık makinesi temizliği' }] },
  kahve: { baslik: 'Kahve makinesi', satir: [{ is: 'Kahve paketi açtım' }, { is: 'Kahve makinesi mekanizma temizliği' }, { is: 'Kahve makinesi yağ çözme' }] },
  eviye: { baslik: 'Eviye', satir: [{ is: 'Brita filtre yenileme' }, { is: 'Lavabo temizliği' }] },
  cop: { baslik: 'Çöp', satir: [{ sayac: 'cop', metin: 'Çöpü çıkardım' }] },
  roborock: { baslik: 'Roborock', satir: [{ sayac: 'roborock', metin: 'Roborock süpürdü' }, { bilgi: 'Gerçek komut göndermek ileride gelecek (evde Home Assistant köprüsüyle). Şimdilik kayıt tutar.' }] },
  dyson: { baslik: 'Dyson', satir: [{ sayac: 'dyson', metin: 'Dyson ile süpürdüm' }] },
  mangal: { baslik: 'Mangal', satir: [{ is: 'Mangal', metin: 'Mangal yaptık' }] },
  cim: { baslik: 'Çim', satir: [BAHCE('Çim biçme', 14, 'temizlik')] },
  teras: { baslik: 'Teras', satir: [BAHCE('Teras süpürme', 7, 'supurge')] },
  sulama: { baslik: 'Bahçe hortumu', satir: [BAHCE('Bahçe sulama', 3)] },
  sera: { baslik: 'Sera', satir: [BAHCE('Sera sulama', 2), BAHCE('Sera bakımı', 14, 'gunes')] },
  trambolin: { baslik: 'Trambolin', satir: [{ elle: "Nehir'le trambolinde oynadık", kat: 4, metin: "Nehir'le oynadık", ikon: 'bebek' }] },
  ofis: { baslik: 'Çalışma masası', satir: [{ git: 'notlar', metin: 'Notlar', ikon: 'notlar' }, { git: 'ajanda', metin: 'Ajanda', ikon: 'ajanda' }, { git: 'ozet', metin: 'Haftanın özeti', ikon: 'detay' }] },
  yemek: { baslik: 'Yemek masası', satir: [{ elle: 'Ailece yemek yedik', metin: 'Ailece yemek yedik', ikon: 'kalp' }] },
  takviye: { baslik: 'Takviye kutusu', ozel: 'takviye' },
  buzdolabi: { baslik: 'Buzdolabı', ozel: 'buzdolabi' },
  pano: { baslik: 'Duvar panosu', ozel: 'pano' },
  kulube: { baslik: 'Kulübe · Pfand', ozel: 'kulube' },
  araba: { baslik: 'Araba', ozel: 'araba' },
  kapi: { baslik: 'Dışarı', ozel: 'dis' },
};

function isOlustur(ad, yeni) {
  const sira = Math.max(0, ...M.db.hepsi('isler').map((i) => i.sira)) + 1;
  return M.db.ekle('isler', { ad, sira, ...yeni });
}

/** Pfand konumu (kulübe → elde → araba). Yedekle taşınsın diye uygulama ayarlarında. */
const PFAND = 'ev_pfand';
function pfandAl() { try { return { kulube: 0, elde: 0, araba: 0, ...JSON.parse(Ayar.al(PFAND, '{}')) }; } catch { return { kulube: 0, elde: 0, araba: 0 }; } }
function pfandYaz(p) { Ayar.yaz(PFAND, JSON.stringify(p)); }

/** Bir eylemin "vakti geldi" durumu (en fazla 3 işaret gösterilir). */
function eylemVakti(isler, bugun) {
  const out = [];
  for (const [e, t] of Object.entries(EYLEM)) {
    if (!t.satir) continue;
    let en = null;
    for (const s of t.satir) {
      if (!s.is) continue;
      const d = isBul(isler, s.is);
      if (!d || d.tur !== 'PERIYODIK') continue;
      const kalan = Mantik.kalanGun(d.sonGun, d.periyotGun, bugun);
      if (Mantik.durum(d.sonGun, d.periyotGun, bugun, d.ertelenenGun) === 'VAKTI_GELDI' && (en == null || kalan < en)) en = kalan;
    }
    if (en != null) out.push([e, en]);
  }
  return out.sort((a, b) => a[1] - b[1]);
}

const TEBRIK = ['Harika!', 'Süper, bir iş daha', 'Ev sana teşekkür ediyor', 'Bravo!', 'İşte bu!', 'Tamamdır'];

// ---------------------------------------------------------------- ekran

export function EvEkrani() {
  const depo = useVeri();
  const bugun = useBugun();
  const [mod, setMod] = useState(() => { try { return Number(localStorage.getItem('mali_ev_mod') ?? 0); } catch { return 0; } });
  const [acik, setAcik] = useState(null); // { e } | { oda }
  const [dis, setDis] = useState(null);
  const [tutarIcin, setTutarIcin] = useState(null);
  const [sayacGiris, sayacPenceresi] = useSayacGirisi();
  const oyun = useRef(null);

  useEffect(() => { try { localStorage.setItem('mali_ev_mod', String(mod)); } catch {} }, [mod]);
  const isler = depo.isDurumlari(bugun);
  const pf = pfandAl();
  const vakit = eylemVakti(isler, bugun);
  const copIs = depo.anahtarla('cop');
  const copSon = copIs ? depo.ogeKayitlari(copIs.id, 'SAYAC')[0]?.gun ?? null : null;
  const cim = isBul(isler, 'Çim biçme');
  const durum = {
    vakit: vakit.slice(0, 3).map(([e]) => e),
    pfandKulube: pf.kulube, pfandAraba: pf.araba, elde: pf.elde,
    copDolu: copIs != null && (copSon == null || bugun - copSon >= 3),
    cimUzun: cim ? Mantik.durum(cim.sonGun, cim.periyotGun, bugun) === 'VAKTI_GELDI' : true,
    gece: new Date().getHours() >= 19 || new Date().getHours() < 7,
  };

  const kutla = (metin) => oyun.current?.kutla(metin ?? TEBRIK[Math.floor(Math.random() * TEBRIK.length)]);
  const eylemAc = (e) => { if (e === 'kapi') { setDis({ ulasim: null }); return; } setAcik({ e }); };

  // Arabaya yaklaşınca elde taşınan Pfand bagaja geçer.
  const alanaGirdi = (e) => {
    if (e === 'araba' && pf.elde > 0) { pfandYaz({ ...pf, araba: pf.araba + pf.elde, elde: 0 }); kutla(`Bagaja kondu · ${pf.elde}`); }
    eylemAc(e);
  };

  return html`<div class="ev-ekran">
    <div class="ev-ust">
      <button class="yuvarlak" aria-label="Panoya dön" onClick=${() => git('pano')}><${Ikon} ad="geri" boy=${18} /></button>
      <div class="dolu" style="min-width:0">
        <div class="tm">Evim</div>
        <div class="bk soluk tek">${vakit.length ? `${vakit.length} yerde vakti gelen iş var` : 'Ev bugün rahat'}${pf.kulube + pf.elde + pf.araba > 0 ? ` · Pfand ${pf.kulube + pf.elde + pf.araba}` : ''}</div>
      </div>
      <${Segment} secenekler=${['3D', 'Kroki']} secili=${mod} onSec=${setMod} />
    </div>
    <div class="ev-sahne">
      ${mod === 0
        ? html`<${Gezinti} ref_=${oyun} durum=${durum} sayfaAcik=${!!(acik || dis)} onEylem=${eylemAc} onAlan=${alanaGirdi} />`
        : html`<${Kroki} durum=${durum} isler=${isler} bugun=${bugun} onEylem=${eylemAc} onOda=${(oda) => setAcik({ oda })} />`}
    </div>
    ${acik && html`<${Sayfa} key=${acik.e ?? acik.oda} acik=${acik} isler=${isler} bugun=${bugun} pf=${pf}
      onKapat=${() => setAcik(null)} onEylem=${(e) => setAcik({ e })} kutla=${kutla} sayacGiris=${sayacGiris}
      tutarIste=${setTutarIcin} disaCik=${(u) => { setAcik(null); setDis({ ulasim: u }); }} />`}
    ${dis && html`<${DisariSayfasi} ulasim=${dis.ulasim} bugun=${bugun} pf=${pf} onKapat=${() => setDis(null)} kutla=${kutla} tutarIste=${setTutarIcin}
      setUlasim=${(u) => setDis({ ulasim: u })} />`}
    ${sayacPenceresi}
    ${tutarIcin && html`<${TutarDialog} ad=${tutarIcin.ad} onKapat=${() => setTutarIcin(null)} onTamam=${(sent) => { tutarIcin.tamam(sent); setTutarIcin(null); }} />`}
  </div>`;
}

// ---------------------------------------------------------------- alt sayfa (nesne / oda)

function Sayfa({ acik, isler, bugun, pf, onKapat, onEylem, kutla, sayacGiris, tutarIste, disaCik }) {
  if (acik.oda) {
    const liste = [...new Map(ESYALAR.filter((x) => x.oda === acik.oda && x.e).map((x) => [x.e, x])).values()];
    return html`<${AltSayfa} baslik=${ODA_AD[acik.oda]} alt="Odadaki eşyalar" onKapat=${onKapat}>
      ${liste.length === 0 && html`<span class="bk soluk">Bu odada dokunulacak eşya yok.</span>`}
      ${liste.map((x) => {
        const vakti = eylemVakti(isler, bugun).some(([e]) => e === x.e);
        return html`<button class="ev-satir" onClick=${() => onEylem(x.e)}>
          <span class="ev-nokta" style=${{ background: vakti ? RENK.mercan : RENK.adacayi }}></span>
          <span class="dolu bm tek" style="text-align:left">${EYLEM[x.e]?.baslik ?? x.ad}</span>
          <span class="bk soluk">${vakti ? 'vakti geldi' : ''}</span><${Ikon} ad="ileri" boy=${14} renk="var(--soluk)" /></button>`;
      })}
    </${AltSayfa}>`;
  }
  const t = EYLEM[acik.e];
  if (!t) return null;
  const nokta = eylemNoktasi(acik.e);
  const odaAd = ODA_AD[ESYALAR.find((x) => x.e === acik.e)?.oda ?? (nokta ? bolge(nokta[0], nokta[1]) : '')] ?? '';
  if (t.ozel) return html`<${OzelSayfa} tur=${t.ozel} baslik=${t.baslik} alt=${odaAd} bugun=${bugun} pf=${pf} onKapat=${onKapat} kutla=${kutla} tutarIste=${tutarIste} disaCik=${disaCik} isler=${isler} />`;
  return html`<${AltSayfa} baslik=${t.baslik} alt=${odaAd} onKapat=${onKapat}>
    ${t.satir.map((s, i) => html`<${EylemSatiri} key=${i} s=${s} isler=${isler} bugun=${bugun} kutla=${kutla} sayacGiris=${sayacGiris} tutarIste=${tutarIste} />`)}
  </${AltSayfa}>`;
}

function AltSayfa({ baslik, alt, onKapat, children }) {
  useEffect(() => { const f = (e) => { if (e.key === 'Escape') onKapat(); }; addEventListener('keydown', f); return () => removeEventListener('keydown', f); }, [onKapat]);
  return html`<div class="ev-sayfa" role="dialog" aria-label=${baslik}>
    <div class="satir" style="gap:8px;margin-bottom:6px">
      <div class="dolu"><div class="tm tek">${baslik}</div>${alt && html`<div class="bk soluk">${alt}</div>`}</div>
      <button class="ikonbtn" aria-label="Kapat" onClick=${onKapat}><${Ikon} ad="kapat" boy=${16} renk="var(--soluk)" /></button>
    </div>
    <div class="sutun g6 ev-sayfa-ic">${children}</div>
  </div>`;
}

function EylemSatiri({ s, isler, bugun, kutla, sayacGiris, tutarIste }) {
  if (s.bilgi) return html`<div class="bk soluk" style="padding:4px 2px">${s.bilgi}</div>`;
  if (s.git) return html`<button class="ev-satir" onClick=${() => git(s.git)}>
    <${Ikon} ad=${s.ikon ?? 'ileri'} boy=${18} renk=${RENK.lavanta} /><span class="dolu bm" style="text-align:left">${s.metin}</span><${Ikon} ad="ileri" boy=${14} renk="var(--soluk)" /></button>`;
  if (s.elle) return html`<button class="ev-satir" onClick=${() => { Is.elleKayit(s.elle, bugun, s.kat ?? null); kutla(); }}>
    <${Ikon} ad=${s.ikon ?? 'kalem'} boy=${18} renk=${RENK.lavanta} /><span class="dolu bm" style="text-align:left">${s.metin}</span><span class="ev-yap">Yaptım</span></button>`;
  let d = null, ad = s.metin;
  if (s.sayac) { const h = SayacMantik.hazir(s.sayac); const i = M.depo.anahtarla(s.sayac); d = i ? isler.find((x) => x.id === i.id) ?? null : null; ad = ad ?? h?.ad ?? s.sayac; }
  else { d = isBul(isler, s.is); ad = ad ?? s.is; if (!d && !s.yeni) return null; }
  const yap = () => {
    if (s.sayac) { sayacGiris(s.sayac); if (s.sayac !== SayacMantik.BULASIK && s.sayac !== SayacMantik.CAMASIR) kutla(); return; }
    let id = d?.id;
    if (id == null) { id = isOlustur(s.is, s.yeni); bildir(`"${s.is}" Ev işleri'ne eklendi`); }
    const i = M.db.getir('isler', id);
    if (i?.tutarSor) tutarIste({ ad: i.ad, tamam: (sent) => { Is.yap(id, i.ad, sent); kutla(); } });
    else { Is.yap(id, i?.ad ?? s.is); kutla(); }
  };
  const ikon = d?.ikon ?? s.yeni?.ikon ?? SayacMantik.hazir(s.sayac ?? '')?.ikon ?? 'ev';
  const renk = d ? durumRengi(d, bugun) : RENK.adacayi;
  return html`<button class="ev-satir" onClick=${yap}>
    <span class="ev-ikon" style=${{ background: saydam(renk, 28) }}><${Ikon} ad=${ikon} boy=${17} renk=${renk} /></span>
    <span class="dolu" style="text-align:left;min-width:0"><span class="bm tek" style="display:block">${ad}</span>
      <span class="bk soluk tek" style="display:block">${d ? durumMetni(d, bugun) : 'ilk dokunuşta Ev işleri\'ne eklenir'}</span></span>
    <span class="ev-yap">Yaptım</span></button>`;
}

function OzelSayfa({ tur, baslik, alt, bugun, pf, onKapat, kutla, tutarIste, disaCik, isler }) {
  const depo = M.depo;
  const [yeni, setYeni] = useState('');
  if (tur === 'buzdolabi') {
    const stok = depo.urunler().filter((u) => u.stokTakip);
    const acik = depo.acikAlisveris();
    const sonAlim = M.db.hepsi('alimlar').sort((a, b) => b.gun - a.gun || b.id - a.id).slice(0, 5);
    return html`<${AltSayfa} baslik=${baslik} alt=${`${alt} · listede ${acik.length} ürün`} onKapat=${onKapat}>
      <span class="lk soluk">Son aldıkların</span>
      ${sonAlim.length === 0 && html`<span class="bk soluk">Henüz alım kaydı yok.</span>`}
      ${sonAlim.map((a) => html`<div class="satir bk"><span class="dolu tek">${M.db.getir('urunler', a.urunId)?.ad ?? 'Ürün'} · ${a.adet}</span><span class="soluk">${gunAyHg(a.gun)}</span></div>`)}
      <span class="lk soluk" style="margin-top:6px">Stok</span>
      ${stok.map((u) => { const az = StokMantik.azMi(u); const listede = acik.some((m) => m.urunId === u.id);
        return html`<div class="ev-satir" style="cursor:default">
          <span class="ev-nokta" style=${{ background: az ? RENK.mercan : RENK.adacayi }}></span>
          <span class="dolu bm tek">${u.ad}</span><span class="bk soluk" style="margin-right:8px">${u.stok} ${u.birim}</span>
          <button class="ev-yap" disabled=${listede} style=${listede ? 'opacity:.5' : ''} onClick=${() => { depo.alisveriseEkle(u.ad, u.id, u.ikon); bildir(`${u.ad} listeye eklendi`); }}>${listede ? 'Listede' : 'Bitti'}</button></div>`; })}
      <div class="satir" style="gap:8px;margin-top:4px"><button class="anabtn" onClick=${() => git('stok')}>Stok</button><button class="anabtn" style="background:var(--mercan)" onClick=${() => git('alim')}>Alışveriş</button></div>
    </${AltSayfa}>`;
  }
  if (tur === 'takviye') {
    const t = M.db.hepsi('takviyeler');
    return html`<${AltSayfa} baslik=${baslik} alt=${alt} onKapat=${onKapat}>
      ${t.map((x) => html`<div class="satir bm"><span class="ev-nokta" style=${{ background: StokMantik.takviyeAzMi(x, bugun) ? RENK.mercan : RENK.lavanta, marginRight: '8px' }}></span>
        <span class="dolu tek">${x.ad}</span><span class="bk soluk">${x.gunlukDoz > 0 ? StokMantik.takviyeKalanGun(x, bugun) + ' gün' : 'doz yok'}</span></div>`)}
      <button class="anabtn" style="background:var(--lavanta)" onClick=${() => git('takviye')}>Takviye bölümü</button>
    </${AltSayfa}>`;
  }
  if (tur === 'pano') {
    const gun = AjandaMantik.gunListesi(depo.ajanda(), depo.tamamSet(), bugun, bugun).filter((g) => !g.yapildi).slice(0, 8);
    const acik = depo.acikAlisveris();
    return html`<${AltSayfa} baslik=${baslik} alt="Bugünkü ajanda ve alışveriş listesi" onKapat=${onKapat}>
      <span class="lk soluk">Bugün</span>
      ${gun.length === 0 && html`<span class="bk soluk">Bugün yapılacak iş yok.</span>`}
      ${gun.map((g) => html`<button class="ev-satir" onClick=${() => { Is.ajandaTikle(g.a.id, g.olay, g.a.baslik); kutla(); }}>
        <span class="ev-nokta" style=${{ background: g.gecikti ? RENK.mercan : RENK.sari }}></span><span class="dolu bm tek" style="text-align:left">${g.a.baslik}</span><span class="ev-yap">Yaptım</span></button>`)}
      <span class="lk soluk" style="margin-top:6px">Alışveriş listesi · ${acik.length}</span>
      ${acik.slice(0, 10).map((m) => html`<button class="ev-satir" onClick=${() => depo.alisverisIsaretle(m, true)}>
        <span class="ev-nokta" style=${{ background: RENK.mercan }}></span><span class="dolu bm tek" style="text-align:left">${m.ad}</span><span class="bk soluk">alındı</span></button>`)}
      <div class="satir" style="gap:6px"><div class="dolu"><${Girdi} deger=${yeni} onDeger=${setYeni} ipucu="Listeye ekle" /></div>
        <${MetinButon} disabled=${!yeni.trim()} onClick=${() => { depo.alisveriseEkle(yeni.trim()); setYeni(''); }}>Ekle</${MetinButon}></div>
      <div class="satir" style="gap:8px"><button class="anabtn" style="background:var(--sari)" onClick=${() => git('ajanda')}>Ajanda</button>
        <button class="anabtn" style="background:var(--mercan)" onClick=${() => pencereAc({ tur: 'ajanda', gun: bugun })}>Yeni görev</button></div>
    </${AltSayfa}>`;
  }
  if (tur === 'kulube') {
    const ekle = (n) => { pfandYaz({ ...pf, kulube: pf.kulube + n }); };
    return html`<${AltSayfa} baslik=${baslik} alt="Şişeler kulübede birikir, arabaya taşınır" onKapat=${onKapat}>
      <div class="ev-pfand"><span><b>${pf.kulube}</b><i>kulübede</i></span><span><b>${pf.elde}</b><i>elinde</i></span><span><b>${pf.araba}</b><i>bagajda</i></span></div>
      <div class="satir" style="gap:8px">${[1, 5, 10].map((n) => html`<button class="ev-cip" onClick=${() => ekle(n)}>+${n} şişe</button>`)}
        <button class="ev-cip" disabled=${pf.kulube === 0} onClick=${() => ekle(-1)}>−1</button></div>
      <button class="anabtn" disabled=${pf.kulube === 0} style=${pf.kulube === 0 ? 'opacity:.5' : ''}
        onClick=${() => { pfandYaz({ ...pf, kulube: 0, elde: pf.elde + pf.kulube }); onKapat(); bildir('Pfandları aldın. Bahçe kapısından arabaya götür.'); }}>Hepsini al, arabaya götür</button>
      ${pf.elde > 0 && html`<${MetinButon} onClick=${() => pfandYaz({ ...pf, kulube: pf.kulube + pf.elde, elde: 0 })}>Elindekileri kulübeye geri koy</${MetinButon}>`}
    </${AltSayfa}>`;
  }
  if (tur === 'araba') {
    const pfIs = isBul(isler, 'Pfand iade');
    const arabaIsleri = AjandaMantik.gunListesi(depo.ajanda(), depo.tamamSet(), bugun, bugun).filter((g) => !g.yapildi && g.a.kategoriId === 2);
    const iade = () => tutarIste({ ad: 'Pfand iade', tamam: (sent) => {
      if (pfIs) Is.yap(pfIs.id, 'Pfand iade', sent); else Is.sayacYap('pfand', null);
      pfandYaz({ ...pfandAl(), araba: 0 }); kutla('Pfand iade edildi');
    } });
    return html`<${AltSayfa} baslik=${baslik} alt="Otopark" onKapat=${onKapat}>
      <div class="ev-pfand"><span><b>${pf.araba}</b><i>bagajda Pfand</i></span>${pf.elde > 0 && html`<span><b>${pf.elde}</b><i>elinde</i></span>`}</div>
      <button class="anabtn" disabled=${pf.araba === 0} style=${pf.araba === 0 ? 'opacity:.5' : ''} onClick=${iade}>Markette iade ettim</button>
      ${arabaIsleri.length > 0 && html`<span class="lk soluk">Araba işleri</span>`}
      ${arabaIsleri.map((g) => html`<button class="ev-satir" onClick=${() => { Is.ajandaTikle(g.a.id, g.olay, g.a.baslik); kutla(); }}>
        <span class="ev-nokta" style=${{ background: RENK.sari }}></span><span class="dolu bm tek" style="text-align:left">${g.a.baslik}</span><span class="ev-yap">Yaptım</span></button>`)}
      <button class="anabtn" style="background:var(--sari)" onClick=${() => disaCik('Araba')}>Arabayla bir yere git</button>
    </${AltSayfa}>`;
  }
  return null;
}

/** Ev kapısından ya da yoldan çıkınca: İş, Market, Tatil, Etkinlik. */
function DisariSayfasi({ ulasim, bugun, pf, onKapat, kutla, tutarIste, setUlasim }) {
  const depo = M.depo;
  const [hedef, setHedef] = useState(null);
  const yakin = (tur) => depo.ajanda().filter((a) => a.tur === tur && a.tarih != null && (a.bitis ?? a.tarih) >= bugun).slice(0, 4);
  const HEDEF = [
    { id: 'is', ad: 'İş', ikon: 'isci', renk: RENK.adacayi },
    { id: 'market', ad: 'Market', ikon: 'alim', renk: RENK.mercan },
    { id: 'tatil', ad: 'Tatil', ikon: 'gunes', renk: RENK.sari },
    { id: 'etkinlik', ad: 'Etkinlik', ikon: 'afis', renk: RENK.lavanta },
  ];
  let ic;
  if (!hedef) ic = html`<div class="ev-hedefler">${HEDEF.map((h) => html`<button class="ev-hedef" style=${{ background: saydam(h.renk, 30) }} onClick=${() => setHedef(h.id)}>
    <${Ikon} ad=${h.ikon} boy=${26} renk=${h.renk} /><span class="ts">${h.ad}</span></button>`)}</div>`;
  else if (hedef === 'is') ic = html`<span class="bm">Nasıl gidiyorsun?</span>
    <div class="satir" style="gap:8px">${['Bisiklet', 'Araba'].map((u) => html`<button class="ev-hedef dolu" style=${{ background: saydam(u === 'Araba' ? RENK.sari : RENK.adacayi, 30), height: '76px' }}
      onClick=${() => { Is.elleKayit(`İşe gittim · ${u.toLocaleLowerCase('tr-TR')}`, bugun, null); kutla('İyi çalışmalar'); onKapat(); }}>
      <${Ikon} ad=${u === 'Araba' ? 'araba' : 'kosu'} boy=${24} /><span class="ts">${u}</span></button>`)}</div>`;
  else if (hedef === 'market') {
    const acik = depo.acikAlisveris();
    ic = html`<span class="lk soluk">Alışveriş listesi · ${acik.length}</span>
      ${acik.length === 0 && html`<span class="bk soluk">Liste boş.</span>`}
      ${acik.slice(0, 12).map((m) => html`<button class="ev-satir" onClick=${() => depo.alisverisIsaretle(m, !m.alindi)}>
        <span class="ev-nokta" style=${{ background: RENK.mercan }}></span><span class="dolu bm tek" style="text-align:left">${m.ad}</span><span class="bk soluk">sepete</span></button>`)}
      <button class="anabtn" style="background:var(--mercan)" onClick=${() => { Is.alisverisiBitir(); kutla('Market tamam'); }}>Alışverişi bitir</button>
      ${pf.araba > 0 && html`<button class="anabtn" onClick=${() => tutarIste({ ad: 'Pfand iade', tamam: (sent) => {
        const i = M.db.hepsi('isler').find((x) => esit(x.ad, 'Pfand iade')); if (i) Is.yap(i.id, 'Pfand iade', sent); else Is.sayacYap('pfand', null);
        pfandYaz({ ...pfandAl(), araba: 0 }); kutla('Pfand iade edildi'); } })}>Bagajdaki ${pf.araba} Pfandı da iade et</button>`}
      ${ulasim !== 'Araba' && pf.araba > 0 && html`<span class="bk soluk">Pfand arabada. Arabayla gidersen iade edebilirsin.</span>`}`;
  } else {
    const tur = hedef === 'tatil' ? 'IZIN' : 'ETKINLIK';
    const l = yakin(tur);
    ic = html`<span class="lk soluk">${hedef === 'tatil' ? 'Yaklaşan izinler' : 'Yaklaşan etkinlikler'}</span>
      ${l.length === 0 && html`<span class="bk soluk">Ajandada yok.</span>`}
      ${l.map((a) => html`<div class="satir bm"><span class="dolu tek">${a.baslik}</span><span class="bk soluk">${gunAyHg(a.tarih)}</span></div>`)}
      <button class="anabtn" style=${{ background: hedef === 'tatil' ? 'var(--sari)' : 'var(--lavanta)' }}
        onClick=${() => { onKapat(); pencereAc({ tur: 'ajanda', gun: bugun, ajandaTur: tur }); }}>${hedef === 'tatil' ? 'Tatil ekle' : 'Etkinlik ekle'}</button>`;
  }
  return html`<${AltSayfa} baslik=${hedef ? HEDEF.find((h) => h.id === hedef).ad : 'Nereye?'} alt=${ulasim ? `${ulasim} ile` : 'Evden çıkıyorsun'} onKapat=${onKapat}>
    ${hedef && html`<${MetinButon} stil=${{ alignSelf: 'flex-start' }} onClick=${() => setHedef(null)}>← Başka yer</${MetinButon}>`}
    ${ic}
    ${!hedef && !ulasim && html`<span class="bk soluk">Arabayla gitmek için otoparktaki arabaya git.</span>`}
    ${!hedef && ulasim && html`<${MetinButon} onClick=${() => setUlasim(null)}>Yürüyerek</${MetinButon}>`}
  </${AltSayfa}>`;
}

// ---------------------------------------------------------------- 2.5D gezinti

const KONUM = 'mali_ev_konum';
function konumAl() { try { const k = JSON.parse(localStorage.getItem(KONUM)); if (Array.isArray(k) && bolge(k[0], k[1])) return k; } catch {} return [9.5, 2.2]; }

function Gezinti({ ref_, durum, onEylem, onAlan, sayfaAcik }) {
  const sa = useRef(false); sa.current = sayfaAcik;
  const tuval = useRef(null);
  const d = useRef(durum); d.current = durum;
  const cb = useRef({ onEylem, onAlan }); cb.current = { onEylem, onAlan };
  const [oda, setOda] = useState(null);
  const iz = useMemo(() => izgaraKur(), []);
  const duvarlar = useMemo(() => duvarKutulari(iz.kenarlar), [iz]);
  const cit = useMemo(() => citKutulari(), []);
  const s = useRef(null);
  if (!s.current) {
    const [x, y] = konumAl();
    var ilkDuvar = duvarlar, ilkCit = cit;
    const k = new Kamera(); k.mx = x; k.my = y; k.zum = innerWidth < 500 ? 0.95 : 1.15;
    s.current = { k, x, y, yol: [], hedefE: null, adim: 0, yon: 1, bravo: 0, ucan: [], takip: true, sonAlan: null, t: 0, robot: [0, 0], robotT: 0, _duvar: ilkDuvar, cit: ilkCit };
  }

  useEffect(() => {
    ref_.current = {
      kutla: (metin) => { const o = s.current; o.bravo = 1.3; const [sx, sy] = o.k.ekran(o.x, o.y, 2.3); o.ucan.push({ metin, x: sx, y: sy, t: 0, dunya: [o.x, o.y] }); },
      git: (x, y, e) => yuru(x, y, e),
    };
    return () => { ref_.current = null; };
  });

  const yuru = (x, y, e = null) => {
    const o = s.current;
    const yol = yolBul(iz, [o.x, o.y], [x, y]);
    if (!yol) return;
    o.yol = yol; o.hedefE = e; o.takip = true;
    if (yol.length === 0 && e) cb.current.onEylem(e);
  };

  useEffect(() => {
    const c = tuval.current, ctx = c.getContext('2d');
    let raf = 0, son = performance.now(), canli = true;
    const boyut = () => { const r = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); c.width = r.width * dpr; c.height = r.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); s.current.k.W = r.width; s.current.k.H = r.height; };
    boyut();
    const ro = new ResizeObserver(boyut); ro.observe(c);
    const kare = (simdi) => {
      if (!canli) return;
      const dt = Math.min(0.05, (simdi - son) / 1000); son = simdi;
      adimAt(s.current, dt);
      ciz(ctx, s.current, d.current);
      raf = requestAnimationFrame(kare);
    };
    raf = requestAnimationFrame(kare);
    return () => { canli = false; cancelAnimationFrame(raf); ro.disconnect(); try { localStorage.setItem(KONUM, JSON.stringify([s.current.x, s.current.y])); } catch {} };
  }, []);

  function adimAt(o, dt) {
    o.t += dt;
    o.k.oy += ((sa.current && o.k.H < 900 ? 0.27 : 0.5) - o.k.oy) * Math.min(1, dt * 6);
    if (o.yol.length) {
      const [hx, hy] = o.yol[0];
      const dx = hx - o.x, dy = hy - o.y, uz = Math.hypot(dx, dy), hiz = 3.6 * dt;
      if (uz <= hiz) { o.x = hx; o.y = hy; o.yol.shift(); } else { o.x += dx / uz * hiz; o.y += dy / uz * hiz; }
      const sx = dx - dy; if (Math.abs(sx) > 0.01) o.yon = sx > 0 ? 1 : -1;
      o.adim += dt * 11;
      if (!o.yol.length) {
        try { localStorage.setItem(KONUM, JSON.stringify([o.x, o.y])); } catch {}
        if (o.hedefE) { const e = o.hedefE; o.hedefE = null; o.sonAlan = ALANLAR.find((a) => a.e === e)?.id ?? null; cb.current.onAlan(e); }
        else alanKontrol(o);
      }
    } else alanKontrol(o, true);
    const b = bolge(o.x, o.y); if (b !== o._oda) { o._oda = b; setOda(b); }
    if (o.takip) { o.k.mx += (o.x - o.k.mx) * Math.min(1, dt * 4); o.k.my += (o.y - o.k.my) * Math.min(1, dt * 4); }
    if (o.bravo > 0) o.bravo -= dt;
    for (const u of o.ucan) u.t += dt / 1.6;
    o.ucan = o.ucan.filter((u) => u.t < 1);
    o.robotT += dt; o.robot = [Math.sin(o.robotT * 0.35) * 1.4, Math.sin(o.robotT * 0.23) * 1.8 + 1.2];
  }
  function alanKontrol(o, sadeceCikis = false) {
    const a = ALANLAR.find((z) => !z.gizli && z.g > 0 && o.x >= z.x && o.x <= z.x + z.g && o.y >= z.y && o.y <= z.y + z.d);
    if (!a) { o.sonAlan = null; return; }
    if (sadeceCikis || o.sonAlan === a.id) return;
    o.sonAlan = a.id; cb.current.onAlan(a.e);
  }

  // ---- dokunma, sürükleme, yakınlaştırma
  const p = useRef({ basla: null, iki: null, surukle: false, noktalar: new Map() });
  const asagi = (ev) => {
    tuval.current.setPointerCapture?.(ev.pointerId);
    const q = p.current; q.noktalar.set(ev.pointerId, [ev.offsetX, ev.offsetY]);
    if (q.noktalar.size === 1) { q.basla = [ev.offsetX, ev.offsetY, s.current.k.mx, s.current.k.my]; q.surukle = false; }
    else if (q.noktalar.size === 2) { const [a, b] = [...q.noktalar.values()]; q.iki = { uz: Math.hypot(a[0] - b[0], a[1] - b[1]), zum: s.current.k.zum }; q.surukle = true; }
  };
  const hareket = (ev) => {
    const q = p.current; if (!q.noktalar.has(ev.pointerId)) return;
    q.noktalar.set(ev.pointerId, [ev.offsetX, ev.offsetY]);
    const k = s.current.k;
    if (q.noktalar.size === 2 && q.iki) { const [a, b] = [...q.noktalar.values()]; k.zum = sinir(q.iki.zum * Math.hypot(a[0] - b[0], a[1] - b[1]) / q.iki.uz, 0.5, 2.4); return; }
    if (!q.basla) return;
    const dx = ev.offsetX - q.basla[0], dy = ev.offsetY - q.basla[1];
    if (!q.surukle && Math.hypot(dx, dy) > 8) q.surukle = true;
    if (q.surukle) {
      s.current.takip = false;
      const a = dx / (k.tw / 2), b = dy / (k.th / 2);
      k.mx = q.basla[2] - (a + b) / 2; k.my = q.basla[3] - (b - a) / 2;
    }
  };
  const yukari = (ev) => {
    const q = p.current; q.noktalar.delete(ev.pointerId);
    if (q.noktalar.size > 0) return;
    if (!q.surukle && q.basla) dokun(ev.offsetX, ev.offsetY);
    q.basla = null; q.iki = null;
  };
  const tekerlek = (ev) => { ev.preventDefault(); const k = s.current.k; k.zum = sinir(k.zum * (ev.deltaY < 0 ? 1.1 : 0.9), 0.5, 2.4); };
  function dokun(sx, sy) {
    const o = s.current, k = o.k;
    // önce eşyalar (öndekinden arkaya)
    const adaylar = ESYALAR.filter((e) => e.e).map((e) => ({ e, kutu: ekranKutusu(k, e) })).filter(({ kutu: b }) => sx >= b[0] && sx <= b[2] && sy >= b[1] && sy <= b[3]);
    adaylar.sort((a, b) => (b.e.x + b.e.g + b.e.y + b.e.d) - (a.e.x + a.e.g + a.e.y + a.e.d));
    if (adaylar.length) { const e = adaylar[0].e.e; const n = eylemNoktasi(e); if (n) yuru(n[0], n[1], e); return; }
    const [wx, wy] = k.dunya(sx, sy);
    const a = ALANLAR.find((z) => !z.gizli && z.g > 0 && wx >= z.x && wx <= z.x + z.g && wy >= z.y && wy <= z.y + z.d);
    if (a) { yuru(a.x + a.g / 2, a.y + a.d / 2, a.e); return; }
    if (bolge(wx, wy)) yuru(wx, wy);
  }

  const odaGit = (id) => {
    const o = [...ODALAR, ...DIS].find((x) => x.id === id); if (!o) return;
    const [x, y, g, dd] = o.r[0];
    const hedef = id === 'bahce' ? [11, 15] : id === 'otopark' ? [13.5, 18.9] : [x + g / 2, y + dd / 2];
    yuru(hedef[0], hedef[1]);
  };

  return html`<div class="ev-tuval-kap">
    <canvas ref=${tuval} class="ev-tuval" onPointerDown=${asagi} onPointerMove=${hareket} onPointerUp=${yukari} onPointerCancel=${yukari} onWheel=${tekerlek}
      aria-label="Evin 2.5D görünümü. Bir eşyaya dokun, karakterin oraya yürüsün."></canvas>
    <div class="ev-odalar">${[...ODALAR, ...DIS].map((o) => html`<button class=${'ev-oda-cip' + (oda === o.id ? ' secili' : '')} onClick=${() => odaGit(o.id)}>${o.ad}</button>`)}</div>
    <div class="ev-zum">
      <button class="yuvarlak" aria-label="Yakınlaştır" onClick=${() => { const k = s.current.k; k.zum = sinir(k.zum * 1.2, 0.5, 2.4); }}><${Ikon} ad="arti" boy=${16} /></button>
      <button class="yuvarlak" aria-label="Uzaklaştır" onClick=${() => { const k = s.current.k; k.zum = sinir(k.zum / 1.2, 0.5, 2.4); }}><span style="font-size:20px;line-height:1">−</span></button>
      <button class="yuvarlak" aria-label="Karaktere dön" onClick=${() => { s.current.takip = true; }}><${Ikon} ad="oto" boy=${16} /></button>
    </div>
  </div>`;
}

const sinir = (v, a, b) => Math.max(a, Math.min(b, v));
function ekranKutusu(k, e) {
  const z = e.z ?? 0, h = Math.max(e.h, 0.3);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [a, b] of [[e.x, e.y], [e.x + e.g, e.y], [e.x, e.y + e.d], [e.x + e.g, e.y + e.d]]) for (const c of [z, z + h]) {
    const [sx, sy] = k.ekran(a, b, c); x0 = Math.min(x0, sx); y0 = Math.min(y0, sy); x1 = Math.max(x1, sx); y1 = Math.max(y1, sy);
  }
  return [x0 - 4, y0 - 4, x1 + 4, y1 + 4];
}

const DUVAR_RENK = { ofis: '#E7B4BE' };
function ciz(ctx, o, durum) {
  const k = o.k, W = k.W, H = k.H;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, durum.gece ? '#2B3140' : '#F1DFC2'); g.addColorStop(1, durum.gece ? '#1E2230' : '#E6CFA9');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  zeminCiz(ctx, k, durum);
  for (const a of ALANLAR) alanCiz(ctx, k, a, { yakin: o.sonAlan });
  // derinliğe göre sırala: duvarlar, çit, eşyalar, karakter
  const liste = [];
  for (const w of duvarlarCache(o)) liste.push({ k: w.x + w.g / 2 + w.y + w.d / 2, f: () => duvarCiz(ctx, k, w, DUVAR_RENK[bolge(w.x + w.g / 2 - 0.2, w.y + w.d / 2 - 0.2)] ?? '#EFE6D8') });
  for (const c of o.cit) liste.push({ k: c.x + c.g / 2 + c.y + c.d / 2, f: () => kutu(ctx, k, c.x, c.y, c.g, c.d, 0, c.h, '#3F6B3A', { kenar: '#2F5229' }) });
  const ed = { ...durum, t: o.t, robot: o.robot, robotCalisiyor: true, kahveBuhar: true, dusAkiyor: o.sonAlan === 'z-dus', camasirCalisiyor: false };
  for (const e of ESYALAR) liste.push({ k: e.gec ? -100 + e.x + e.y : e.x + e.g / 2 + e.y + e.d / 2 + (e.z ? 0.3 : 0), f: () => esyaCiz(ctx, k, e, ed) });
  liste.push({ k: o.x + o.y + 0.25, f: () => karakterCiz(ctx, k, o.x, o.y, { yon: o.yon, adim: o.adim, poz: o.bravo > 0 ? 'bravo' : o.yol.length ? 'yuru' : 'dur', t: o.t, yuk: durum.elde }) });
  liste.sort((a, b) => a.k - b.k);
  for (const x of liste) x.f();
  for (const a of ALANLAR) alanYazisi(ctx, k, a, [o.x, o.y]);
  // oda adları
  for (const od of ODALAR) { const [x, y, gg, dd] = od.r[0]; const [sx, sy] = k.ekran(x + gg / 2, y + dd / 2, 2.4); if (k.zum >= 0.7) hap(ctx, sx, sy, od.ad.toLocaleUpperCase('tr-TR'), { arka: 'rgba(70,55,45,.72)', boy: Math.max(8, 9 * k.zum) }); }
  // vakti gelen işaretleri (en fazla 3)
  for (const e of durum.vakit) { const n = ESYALAR.find((x) => x.e === e); if (!n) continue; const [sx, sy] = k.ekran(n.x + n.g / 2, n.y + n.d / 2, (n.z ?? 0) + n.h + 0.6); isaretCiz(ctx, sx, sy, o.t); }
  // Pfand etiketleri
  if (durum.pfandKulube > 0) { const [sx, sy] = k.ekran(16.9, 14, 2.8); hap(ctx, sx, sy, `KULÜBE ${durum.pfandKulube}`, { arka: '#3E7D5A' }); }
  if (durum.pfandAraba > 0) { const [sx, sy] = k.ekran(13.25, 19.95, 2.1); hap(ctx, sx, sy, `BAGAJ ${durum.pfandAraba}`, { arka: '#B5562F' }); }
  for (const u of o.ucan) { const [sx, sy] = k.ekran(u.dunya[0], u.dunya[1], 2.4); ucanYaziCiz(ctx, sx, sy, u.metin, u.t); }
}
const duvarlarCache = (o) => o._duvar;

// ---------------------------------------------------------------- 2D kroki

function Kroki({ durum, isler, bugun, onEylem, onOda }) {
  const iz = useMemo(() => izgaraKur(), []);
  const [x0, y0] = konumAl();
  const vakit = new Set(durum.vakit);
  return html`<div class="ev-kroki-kap">
    <svg class="ev-kroki" viewBox="-0.4 -0.4 18.8 24.3" role="img" aria-label="Evin krokisi">
      ${DIS.map((o) => o.r.map(([x, y, g, d]) => html`<rect x=${x} y=${y} width=${g} height=${d} fill=${o.id === 'bahce' ? '#9CC072' : '#A7A9AD'} onClick=${() => onOda(o.id)} />`))}
      <rect x="0" y="21.8" width="18" height="1.7" fill="#7D8086" />
      ${[...ODALAR].map((o) => o.r.map(([x, y, g, d]) => html`<rect x=${x} y=${y} width=${g} height=${d} fill=${o.zemin} onClick=${() => onOda(o.id)} style="cursor:pointer" />`))}
      ${ESYALAR.filter((e) => e.h > 0.03 || e.e).map((e) => html`<rect x=${e.x} y=${e.y} width=${e.g} height=${e.d} rx="0.08" fill=${e.renk} stroke="rgba(0,0,0,.35)" stroke-width="0.04"
        style=${e.e ? 'cursor:pointer' : 'pointer-events:none'} onClick=${e.e ? (ev) => { ev.stopPropagation(); onEylem(e.e); } : null} />`)}
      ${iz.kenarlar.map(([a, b, c, d]) => html`<line x1=${a} y1=${b} x2=${c} y2=${d} stroke="#4B4038" stroke-width="0.16" stroke-linecap="square" />`)}
      <line x1="0" y1="18.5" x2="14.5" y2="18.5" stroke="#3F6B3A" stroke-width="0.4" /><line x1="15.5" y1="18.5" x2="18" y2="18.5" stroke="#3F6B3A" stroke-width="0.4" />
      ${ALANLAR.filter((a) => !a.gizli && a.g > 0).map((a) => html`<rect x=${a.x} y=${a.y} width=${a.g} height=${a.d} rx="0.1" fill="rgba(255,255,255,.25)" stroke="#fff" stroke-width="0.05" stroke-dasharray="0.18 0.12"
        style="cursor:pointer" onClick=${(ev) => { ev.stopPropagation(); onEylem(a.e); }} />`)}
      ${[...ODALAR, ...DIS].map((o) => { const [x, y, g, d] = o.r[0]; return html`<text x=${x + g / 2} y=${y + d / 2} text-anchor="middle" class="ev-kroki-yazi">${o.ad}</text>`; })}
      ${[...vakit].map((e) => { const n = ESYALAR.find((x) => x.e === e); return n && html`<g style="pointer-events:none"><circle cx=${n.x + n.g / 2} cy=${n.y + n.d / 2} r="0.38" fill="#F2B33D" stroke="#fff" stroke-width="0.06" /><text x=${n.x + n.g / 2} y=${n.y + n.d / 2 + 0.17} text-anchor="middle" class="ev-kroki-unlem">!</text></g>`; })}
      ${durum.pfandKulube > 0 && html`<text x="16.85" y="15.3" text-anchor="middle" class="ev-kroki-yazi">Pfand ${durum.pfandKulube}</text>`}
      ${durum.pfandAraba > 0 && html`<text x="13.25" y="21.4" text-anchor="middle" class="ev-kroki-yazi">Bagaj ${durum.pfandAraba}</text>`}
      <circle cx=${x0} cy=${y0} r="0.32" fill="#EE8A6E" stroke="#17141A" stroke-width="0.12" style="pointer-events:none" />
    </svg>
    <div class="bk soluk" style="text-align:center;padding:6px 16px 10px">Odaya dokun: o odanın işleri. Eşyaya dokun: hemen kayıt.</div>
  </div>`;
}

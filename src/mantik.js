// Saf hesaplar: Android sürümündeki Mantik, AjandaMantik, AlimMantik, StokMantik, SayacMantik,
// GunlukMantik, PanoMantik, PanoDuzen, OzetMantik, BildirimMantik ve NotMantik'in birebir karşılığı.
import { tarih, gunYap, haftaSonu as hs, ayBasi as ab, pazartesi } from './tarih.js';

const tam = (x) => Math.trunc(x);
const sinir = (x, a, b) => Math.min(Math.max(x, a), b);

// ---------------- Mantik ----------------
export const Mantik = {
  kalanGun(sonGun, periyotGun, bugun) {
    if (periyotGun == null || periyotGun <= 0) return null;
    if (sonGun == null) return 0;
    return sonGun + periyotGun - bugun;
  },
  durum(sonGun, periyotGun, bugun, ertelenenGun = null) {
    const kalan = Mantik.kalanGun(sonGun, periyotGun, bugun);
    if (kalan == null) return 'PERIYOTSUZ';
    if (ertelenenGun != null && ertelenenGun > bugun) return 'TAMAM';
    if (kalan <= 0) return 'VAKTI_GELDI';
    if (kalan <= Math.max(1, Math.min(tam(periyotGun / 7), 3))) return 'YAKLASIYOR';
    return 'TAMAM';
  },
  stokYetmezMi: (stok, kullanim) => stok < kullanim,
  zincirOzet(baslangic, gunSayisi, hedef, isaretler, bugun) {
    const son = baslangic + gunSayisi - 1;
    const gecen = sinir(Math.min(bugun, son) - baslangic + 1, 0, gunSayisi);
    let tamG = 0, kismi = 0, bos = 0, seri = 0, enUzun = 0;
    for (let i = 0; i < gecen; i++) {
      const g = baslangic + i;
      const a = isaretler.get(g) ?? 0;
      if (a >= hedef) { tamG++; seri++; enUzun = Math.max(enUzun, seri); }
      else if (a > 0) { kismi++; seri = 0; }
      else { if (g !== bugun) bos++; if (g !== bugun) seri = 0; }
    }
    const bugunSayilir = bugun > son || (isaretler.get(bugun) ?? 0) >= hedef;
    const payda = bugunSayilir ? gecen : Math.max(gecen - 1, 0);
    const yuzde = payda === 0 ? 0 : Math.min(tam(tamG * 100 / payda), 100);
    return { toplamGun: gunSayisi, gecenGun: gecen, tamGun: tamG, kismiGun: kismi, bosGun: bos, yuzde, enUzunSeri: enUzun,
      kalanGun: sinir(son - bugun, 0, gunSayisi), bitti: bugun > son };
  },
  sonYediGun(baslangic, gunSayisi, bugun) {
    const son = baslangic + gunSayisi - 1;
    const l = [];
    for (let k = 6; k >= 0; k--) { const g = bugun - k; l.push(g >= baslangic && g <= son ? g : null); }
    return l;
  },
  sonrakiAdet: (mevcut, hedef) => (mevcut >= hedef ? 0 : mevcut + 1),
  tasarrufSent: (normal, odenen, adet) => (normal == null || odenen == null ? 0 : Math.max((normal - odenen) * adet, 0)),
  ayBasi: ab,
};

// ---------------- AjandaMantik ----------------
export const ARKA_PLAN = new Set(['RESMI_TATIL', 'IZIN', 'FIRMA_IZNI', 'KITA_KAPALI', 'KRANK']);
const DURUM_SIRASI = ['KRANK', 'IZIN', 'RESMI_TATIL', 'FIRMA_IZNI', 'KITA_KAPALI'];

export const AjandaMantik = {
  ARKA_PLAN,
  DURUM_SIRASI,
  gunde(a, gun) {
    const t = a.tarih;
    if (t == null) return false;
    if (gun < t) return false;
    const d = tarih(gun);
    switch (a.tekrar || 'YOK') {
      case 'YOK': return gun === t || (a.bitis != null && gun >= t && gun <= a.bitis);
      case 'HAFTALIK': return d.hg === (a.tekrarGun ?? tarih(t).hg);
      case 'AYLIK': return d.d === Math.min(a.tekrarGun ?? tarih(t).d, d.ayGun);
      case 'YILLIK': { const b = tarih(t); return d.m === b.m && d.d === Math.min(b.d, d.ayGun); }
    }
    return false;
  },
  olayGunu(a, gun) {
    if ((a.tekrar || 'YOK') === 'YOK') return a.tarih ?? null;
    const sure = sinir(a.sureGun ?? 0, 0, 31);
    for (let k = 0; k <= sure; k++) { const o = gun - k; if (AjandaMantik.gunde(a, o)) return o; }
    return null;
  },
  /** tamam: Set of "ajandaId:gun" */
  yapildiMi(a, olay, tamamS) {
    return (a.tekrar || 'YOK') === 'YOK' ? !!a.yapildi : olay != null && tamamS.has(a.id + ':' + olay);
  },
  gunListesi(liste, tamamS, gun, bugun) {
    const out = [];
    for (const a of liste) {
      if (a.ustId != null || ARKA_PLAN.has(a.tur)) continue;
      const tekrar = a.tekrar || 'YOK';
      const gorev = a.tur === 'GOREV' || (a.tur === 'RANDEVU' && a.tarih == null);
      if (gorev && tekrar === 'YOK') {
        const acikBas = a.tarih ?? -Infinity;
        if (a.yapildi) { if (a.yapildiGun === gun) out.push({ a, olay: a.tarih ?? null, yapildi: true, gecikti: false }); }
        else if (gun === bugun && acikBas <= bugun) out.push({ a, olay: a.tarih ?? null, yapildi: false, gecikti: a.sonTarih != null && a.sonTarih < bugun });
        else if (gun > bugun && (a.tarih === gun || (a.sonTarih === gun && acikBas < gun))) out.push({ a, olay: a.tarih ?? null, yapildi: false, gecikti: false });
        else if (gun < bugun && a.tarih === gun) out.push({ a, olay: a.tarih ?? null, yapildi: false, gecikti: false });
      } else if (tekrar !== 'YOK' && a.tur === 'GOREV') {
        const o = AjandaMantik.olayGunu(a, gun);
        if (o == null) continue;
        const y = tamamS.has(a.id + ':' + o);
        if (gun !== bugun && o !== gun) continue;
        if (y && gun === bugun && o !== gun) continue;
        out.push({ a, olay: o, yapildi: y, gecikti: false });
      } else {
        if (!AjandaMantik.gunde(a, gun)) continue;
        const o = AjandaMantik.olayGunu(a, gun);
        out.push({ a, olay: o, yapildi: AjandaMantik.yapildiMi(a, o, tamamS), gecikti: false });
      }
    }
    const B = Number.MAX_SAFE_INTEGER;
    return out.sort((x, y) =>
      (x.yapildi - y.yapildi) || ((x.a.saatDakika ?? B) - (y.a.saatDakika ?? B)) ||
      ((x.a.sonTarih ?? B) - (y.a.sonTarih ?? B)) || (x.a.baslik < y.a.baslik ? -1 : x.a.baslik > y.a.baslik ? 1 : 0));
  },
  arkaPlan: (liste, gun) => liste.filter((a) => ARKA_PLAN.has(a.tur) && AjandaMantik.gunde(a, gun)),
  gunDurumlari(liste, gun) {
    const goruldu = new Set();
    const l = AjandaMantik.arkaPlan(liste, gun).filter((a) => (goruldu.has(a.tur) ? false : (goruldu.add(a.tur), true)));
    return l.sort((a, b) => DURUM_SIRASI.indexOf(a.tur) - DURUM_SIRASI.indexOf(b.tur)).slice(0, 2);
  },
  haftaSonu: hs,
  yakinGunler(bugun, n = 3) { const l = []; for (let g = bugun; g <= bugun + n; g++) l.push(g); return l; },
  takipVade(sonGun, periyotGun, ertelenenGun, bugun) {
    const kalan = Mantik.kalanGun(sonGun, periyotGun, bugun);
    if (kalan == null) return null;
    let vade = bugun + Math.max(kalan, 0);
    if (ertelenenGun != null && ertelenenGun > vade) vade = ertelenenGun;
    return vade;
  },
  TAKIP_YAKIN_GUN: 2,
  takipGorunur: (vade, bugun, hepsi) => hepsi || vade - bugun <= 2,
  planlar: (liste, gun) => liste.filter((a) => a.ustId == null && a.bitis != null && !ARKA_PLAN.has(a.tur) && AjandaMantik.gunde(a, gun)),
  gecikti: (a, bugun) => !a.yapildi && a.sonTarih != null && a.sonTarih < bugun,
  hazirlik: (altlar) => [altlar.filter((x) => x.yapildi).length, altlar.length],
  sabahSatirlari(liste, tamamS, bugun) {
    return AjandaMantik.gunListesi(liste, tamamS, bugun, bugun).filter((g) => !g.yapildi && g.a.hatirlatici)
      .filter((g) => {
        const sure = g.a.sureGun ?? 0;
        return (g.a.tekrar || 'YOK') === 'YOK' || sure === 0 || g.olay == null || bugun === g.olay || bugun >= g.olay + sure - 1;
      })
      .map((g) => (g.a.saatDakika != null ? `${String(Math.floor(g.a.saatDakika / 60)).padStart(2, '0')}:${String(g.a.saatDakika % 60).padStart(2, '0')} ${g.a.baslik}` : g.a.baslik));
  },
  izinGunu(bas, son, tatiller) {
    let n = 0;
    for (let g = bas; g <= son; g++) if (tarih(g).hg <= 5 && !tatiller.has(g)) n++;
    return n;
  },
  yillikIzin: (liste, yil) => AjandaMantik.yillikGun(liste, yil, 'IZIN'),
  yillikGun(liste, yil, tur) {
    const bas = gunYap(yil, 1, 1), son = gunYap(yil, 12, 31);
    const tatilKayit = liste.filter((a) => a.tur === 'RESMI_TATIL' || a.tur === 'FIRMA_IZNI');
    const tatil = new Set();
    for (let g = bas; g <= son; g++) if (tatilKayit.some((a) => AjandaMantik.gunde(a, g))) tatil.add(g);
    let top = 0;
    for (const a of liste) {
      if (a.tur !== tur || a.tarih == null) continue;
      const b = Math.max(a.tarih, bas), s = Math.min(a.bitis ?? a.tarih, son);
      if (s >= b) top += AjandaMantik.izinGunu(b, s, tatil);
    }
    return top;
  },
  kopruGunleri(tatiller) {
    const set = new Set(tatiller);
    return tatiller.map((g) => { const h = tarih(g).hg; return h === 2 ? g - 1 : h === 4 ? g + 1 : null; })
      .filter((k) => k != null && !set.has(k));
  },
  icinde: (bugun, gun) => bugun + gun,
};

// ---------------- AlimMantik ----------------
export const STOK_ESIGI = 1;
export const TAKVIYE_UYARI_GUN = 14;

export function tutarMetni(sent) {
  const isaret = sent < 0 ? '-' : '';
  const m = Math.abs(sent);
  const e = Math.floor(m / 100), k = m % 100;
  return k === 0 ? `${isaret}${e} €` : `${isaret}${e},${String(k).padStart(2, '0')} €`;
}

export const AlimMantik = {
  STOK_ESIGI,
  TAKVIYE_UYARI_GUN,
  ozet(alimlar, bugun) {
    const s = [...alimlar].sort((a, b) => a.gun - b.gun);
    const gunler = [...new Set(s.map((a) => a.gun))];
    const aralik = gunler.length >= 2 ? tam((gunler[gunler.length - 1] - gunler[0]) / (gunler.length - 1)) : null;
    const toplam = s.reduce((t, a) => t + a.adet, 0);
    let yillik = null;
    if (s.length) { const sure = Math.max(bugun - s[0].gun, 1); yillik = sure < 60 ? null : Math.round(toplam * 365 / sure); }
    const fiyatli = s.filter((a) => a.odenenSent != null);
    const t = tarih(bugun);
    const ayBas = gunYap(t.y, t.m, 1), yilBas = gunYap(t.y, 1, 1);
    const harcama = (a) => (a.odenenSent ?? 0) * a.adet;
    const tasarruf = (a) => Mantik.tasarrufSent(a.normalSent ?? null, a.odenenSent ?? null, a.adet);
    const top = (l, f) => l.reduce((x, a) => x + f(a), 0);
    return {
      alimSayisi: s.length, toplamAdet: toplam, sonGun: s.length ? s[s.length - 1].gun : null,
      ortalamaAralikGun: aralik, yillikAdet: yillik,
      sonFiyat: fiyatli.length ? fiyatli[fiyatli.length - 1].odenenSent : null,
      enUcuz: fiyatli.length ? Math.min(...fiyatli.map((a) => a.odenenSent)) : null,
      enPahali: fiyatli.length ? Math.max(...fiyatli.map((a) => a.odenenSent)) : null,
      buAyHarcama: top(s.filter((a) => a.gun >= ayBas && a.gun <= bugun), harcama),
      buYilHarcama: top(s.filter((a) => a.gun >= yilBas && a.gun <= bugun), harcama),
      toplamTasarruf: top(s, tasarruf),
      buYilTasarruf: top(s.filter((a) => a.gun >= yilBas && a.gun <= bugun), tasarruf),
    };
  },
  yilSonunaKadarGerekli(yillikAdet, stok, bugun) {
    if (yillikAdet == null) return null;
    const d = tarih(bugun);
    const kalanGun = d.yilUzun - d.yilGun + 1;
    const ihtiyac = Math.ceil(yillikAdet * kalanGun / d.yilUzun);
    return Math.max(ihtiyac - stok, 0);
  },
  aylikToplam(liste) {
    const m = new Map();
    for (const p of liste) { const d = tarih(p.gun); const k = d.y * 100 + d.m; m.set(k, (m.get(k) ?? 0) + p.tutarSent); }
    return m;
  },
  yilToplam: (liste, yil) => liste.filter((p) => tarih(p.gun).y === yil).reduce((t, p) => t + p.tutarSent, 0),
  aylikOrtalama(liste, yil, bugun) {
    const d = tarih(bugun);
    let sonAy;
    if (yil < d.y) sonAy = 12; else if (yil === d.y) sonAy = d.m; else return 0;
    if (!liste.length) return 0;
    const ilk = tarih(Math.min(...liste.map((p) => p.gun)));
    let basAy;
    if (ilk.y === yil) basAy = ilk.m; else if (ilk.y > yil) return 0; else basAy = 1;
    const aySayisi = Math.max(sonAy - basAy + 1, 1);
    return tam(AlimMantik.yilToplam(liste, yil) / aySayisi);
  },
  alimMetni(ad, adet, birim, birimSent) {
    let s = `${ad} alındı, ${adet} ${birim}`;
    if (birimSent != null) s += `, ${tutarMetni(birimSent * adet)}`;
    return s;
  },
  tutarMetni,
};

// ---------------- StokMantik ----------------
export const StokMantik = {
  TAKVIYE_UYARI_GUN,
  ALIM_UYARI_GUN: 7,
  esik: (u) => u.esik ?? STOK_ESIGI,
  azMi: (u) => !!u.stokTakip && u.stok <= StokMantik.esik(u),
  sayimVakti(u, bugun) {
    const s = u.sayimGun;
    if (s == null) return false;
    if (s <= 0 || u.arsiv) return false;
    if (u.sonSayimGun == null) return true;
    return bugun - u.sonSayimGun >= s;
  },
  gunlukTuketim(alimlar, stok, bugun) {
    if (!alimlar.length) return null;
    const ilk = Math.min(...alimlar.map((a) => a.gun));
    const sure = bugun - ilk;
    if (alimlar.length < 2 && sure < 30) return null;
    if (sure <= 0) return null;
    const tuketilen = Math.max(alimlar.reduce((t, a) => t + a.adet, 0) - stok, 0);
    if (tuketilen === 0) return null;
    return tuketilen / sure;
  },
  kalanGun: (stok, gunluk) => (gunluk == null || gunluk <= 0 ? null : tam(stok / gunluk)),
  alinmali: (u, kalan) => StokMantik.azMi(u) || (!!u.stokTakip && kalan != null && kalan <= 7),
  siklik: (t) => Math.max(t.siklikGun ?? 1, 1),
  takviyeStok(t, bugun) {
    if (t.gunlukDoz <= 0) return Math.max(t.stok, 0);
    const alim = Math.floor(Math.max(bugun - t.stokGunu, 0) / StokMantik.siklik(t));
    return Math.max(t.stok - t.gunlukDoz * alim, 0);
  },
  takviyeKalanGun(t, bugun) {
    if (t.gunlukDoz <= 0) return Number.MAX_SAFE_INTEGER;
    return tam(StokMantik.takviyeStok(t, bugun) / t.gunlukDoz) * StokMantik.siklik(t);
  },
  takviyeAzMi(t, bugun) {
    if (t.gunlukDoz <= 0 && t.esikAdet == null) return false;
    const e = t.esikAdet;
    return e != null ? StokMantik.takviyeStok(t, bugun) < e : StokMantik.takviyeKalanGun(t, bugun) <= TAKVIYE_UYARI_GUN;
  },
  siklikMetni(g) { g = Math.max(g, 1); return g === 1 ? 'her gün' : g === 2 ? '2 günde bir' : g === 7 ? 'haftada bir' : `${g} günde bir`; },
};

// ---------------- SayacMantik ----------------
export const SayacMantik = {
  BULASIK: 'bulasik_calis', BOSALT: 'bulasik_bosalt', CAMASIR: 'camasir', KURUTUCU: 'kurutucu',
  ASMA: 'asma', COP: 'cop', DYSON: 'dyson', ROBOROCK: 'roborock',
  HAZIR: [
    { anahtar: 'bulasik_calis', ad: 'Bulaşık makinesi', ikon: 'bulasik', renk: 2, secenekler: ['70°C', '60°C'] },
    { anahtar: 'bulasik_bosalt', ad: 'Bulaşık boşaltma', ikon: 'bosalt', renk: 2, secenekler: [] },
    { anahtar: 'camasir', ad: 'Çamaşır makinesi', ikon: 'camasir', renk: 3, secenekler: [] },
    { anahtar: 'kurutucu', ad: 'Kurutma makinesi', ikon: 'kurutucu', renk: 1, secenekler: [] },
    { anahtar: 'asma', ad: 'Çamaşır asma', ikon: 'asma', renk: 1, secenekler: [] },
    { anahtar: 'cop', ad: 'Çöp', ikon: 'cop', renk: 0, secenekler: [] },
    { anahtar: 'dyson', ad: 'Dyson', ikon: 'supurge', renk: 3, secenekler: [] },
    { anahtar: 'roborock', ad: 'Roborock', ikon: 'robot', renk: 2, secenekler: [] },
  ],
  PANO: ['bulasik_calis', 'camasir', 'kurutucu', 'cop'],
  CAMASIR_SURE: ['Kısa', 'Uzun'],
  CAMASIR_TUR: ['Beyaz', 'Siyah', 'Renkli', 'Nehir', 'Havlu'],
  hazir: (anahtar) => SayacMantik.HAZIR.find((h) => h.anahtar === anahtar) ?? null,
  ek(sure, turler, diger = null) {
    const d = diger?.trim() || null;
    const t = [...new Set([...turler, ...(d ? [d] : [])])];
    const parca = [sure, t.join(', ') || null].filter((x) => x);
    return parca.join(' · ') || null;
  },
  metin: (ad, ek) => (!ek || !ek.trim() ? ad : `${ad} · ${ek}`),
  secenekSayilari(metinler, ad) {
    const say = new Map();
    for (const m of metinler) {
      if (!m.startsWith(`${ad} · `)) continue;
      for (const p of m.slice(ad.length + 3).split(/ · |, /)) { const x = p.trim(); if (x) say.set(x, (say.get(x) ?? 0) + 1); }
    }
    return [...say.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  },
};

// ---------------- GunlukMantik ----------------
const SADE = { 'ç': 'c', 'Ç': 'c', 'ş': 's', 'Ş': 's', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'I': 'i', 'İ': 'i', 'ö': 'o', 'Ö': 'o', 'ü': 'u', 'Ü': 'u', 'ä': 'a', 'Ä': 'a', 'ß': 's' };
export const GunlukMantik = {
  gun: (bugun, ofset) => ({ bas: bugun + ofset, son: bugun + ofset }),
  hafta(bugun, ofset) { const p = pazartesi(bugun) + ofset * 7; return { bas: p, son: p + 6 }; },
  ay(bugun, ofset) {
    const t = tarih(bugun);
    const d = new Date(Date.UTC(t.y, t.m - 1 + ofset, 1));
    const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1;
    return { bas: gunYap(y, m, 1), son: gunYap(y, m + 1, 1) - 1 };
  },
  yil(bugun) { const y = tarih(bugun).y; return { bas: gunYap(y, 1, 1), son: gunYap(y, 12, 31) }; },
  sade(s) { let o = ''; for (const c of s) o += SADE[c] ?? c.toLowerCase(); return o; },
  eslesir(metin, arama) {
    const a = GunlukMantik.sade(arama.trim());
    if (!a) return true;
    const m = GunlukMantik.sade(metin);
    return a.split(' ').filter((x) => x.trim()).every((x) => m.includes(x));
  },
  filtrele: (liste, kaynaklar, kategoriler, arama) => liste.filter((k) =>
    (kaynaklar.size === 0 || kaynaklar.has(k.kaynak)) &&
    (kategoriler.size === 0 || (k.kategoriId != null && kategoriler.has(k.kategoriId))) &&
    GunlukMantik.eslesir(k.metin, arama)),
  gruplu(liste, eskiOnce = false) {
    const m = new Map();
    for (const k of liste) { if (!m.has(k.gun)) m.set(k.gun, []); m.get(k.gun).push(k); }
    const gunler = [...m.keys()].sort((a, b) => (eskiOnce ? a - b : b - a));
    return gunler.map((g) => [g, m.get(g).slice().sort((a, b) => (eskiOnce ? a.zaman - b.zaman : b.zaman - a.zaman))]);
  },
};

// ---------------- PanoMantik ----------------
export const PanoMantik = {
  EV_YAKIN_GUN: 2,
  evIsleriYakin: (isler, bugun) => PanoMantik.yapilacaklar(isler.filter((d) => d.tur === 'PERIYODIK'), bugun, 2),
  bakimVakti: (isler, bugun) => PanoMantik.yapilacaklar(isler.filter((d) => d.tur === 'BAKIM'), bugun, 0),
  yapilacaklar(isler, bugun, gunIleri) {
    const l = [];
    for (const d of isler) {
      if (d.tur === 'SAYAC' || d.periyotGun == null) continue;
      const kalan = Mantik.kalanGun(d.sonGun, d.periyotGun, bugun);
      if (kalan == null) continue;
      const ertelendi = d.ertelenenGun != null && d.ertelenenGun > bugun;
      const etkin = ertelendi ? Math.max(kalan, d.ertelenenGun - bugun) : kalan;
      if (etkin <= gunIleri) l.push([d, etkin]);
    }
    return l.sort((a, b) => a[1] - b[1] || a[0].sira - b[0].sira).map((x) => x[0]);
  },
};

// ---------------- PanoDuzen ----------------
export const PanoDuzen = {
  BLOKLAR: ['gun', 'zincir', 'sayac', 'buton'],
  BUTONLAR: ['takviye', 'para', 'alisveris', 'ozet', 'etkinlik', 'elle', 'ses'],
  bloklar: (k) => PanoDuzen.sirala(k, PanoDuzen.BLOKLAR),
  butonlar: (k) => PanoDuzen.sirala(k, PanoDuzen.BUTONLAR),
  sirala(kayit, hepsi) {
    const k = [...new Set(kayit.split(',').map((x) => x.trim()).filter((x) => hepsi.includes(x)))];
    return [...k, ...hepsi.filter((x) => !k.includes(x))];
  },
  tasi(l, i, yon) {
    const j = i + yon;
    if (i < 0 || i >= l.length || j < 0 || j >= l.length) return l;
    const y = l.slice(); [y[i], y[j]] = [y[j], y[i]]; return y;
  },
};

// ---------------- OzetMantik ----------------
export const OzetMantik = {
  anahtar: (metin) => metin.split(' · ')[0].split(' (')[0].trim(),
  hesapla(kayitlar, modlar, aralik, enCokSayi = 5) {
    const icinde = kayitlar.filter((k) => k.gun >= aralik.bas && k.gun <= aralik.son);
    const ks = new Map();
    for (const k of icinde) ks.set(k.kaynak, (ks.get(k.kaynak) ?? 0) + 1);
    const kaynaklar = [...ks.entries()].sort((a, b) => b[1] - a[1]);
    const ec = new Map();
    for (const k of icinde) {
      if (k.kaynak === 'ELLE' || k.kaynak === 'PARA') continue;
      const a = OzetMantik.anahtar(k.metin);
      if (a) ec.set(a, (ec.get(a) ?? 0) + 1);
    }
    const enCok = [...ec.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)).slice(0, enCokSayi);
    const para = icinde.filter((k) => k.kaynak === 'PARA').reduce((t, k) => t + (k.tutarSent ?? 0), 0);
    const m = [0, 0, 0];
    for (const x of modlar) if (x.gun >= aralik.bas && x.gun <= aralik.son && x.seviye >= 0 && x.seviye <= 2) m[x.seviye]++;
    return { toplam: icinde.length, aktifGun: new Set(icinde.map((k) => k.gun)).size, gunSayisi: aralik.son - aralik.bas + 1, kaynaklar, enCok, paraSent: para, modlar: m };
  },
};

// ---------------- BildirimMantik ----------------
export const BildirimMantik = {
  sessizMi: (dk, bas, son) => (bas === son ? false : bas < son ? dk >= bas && dk < son : dk >= bas || dk < son),
  ozetMetni(adlar) {
    if (adlar.length === 0) return '';
    if (adlar.length === 1) return adlar[0];
    if (adlar.length <= 3) return adlar.join(', ');
    return adlar.slice(0, 3).join(', ') + ` ve ${adlar.length - 3} iş daha`;
  },
};

// ---------------- NotMantik ----------------
export const NotMantik = {
  satirlar: (metin) => metin.split(/\r?\n/).map((s) => s.trim().replace(/^([-•*]|\d+[.)])\s*/, '').trim()).filter((s) => s),
  ayni: (a, b) => GunlukMantik.sade(a.trim()) === GunlukMantik.sade(b.trim()),
};

// ---------------- Para ayrıştırma ----------------
export function parseEuro(s) {
  const t = String(s ?? '').trim().replace(',', '.');
  if (!t) return null;
  const d = Number(t);
  if (!Number.isFinite(d)) return null;
  return Math.round(d * 100);
}
export const sayi = (d) => (d % 1 === 0 ? String(Math.trunc(d)) : d.toFixed(1).replace('.', ','));
export const euro = (sent) => { const e = tam(sent / 100); const s = Math.abs(sent % 100); return `€ ${e},${String(s).padStart(2, '0')}`; };
export const ilkBuyuk = (s) => (s ? s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1) : s);

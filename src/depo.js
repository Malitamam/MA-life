// Depo: uygulamanın tüm yazma işlemleri (Android Depo.kt + Tohum.kt + Yedek.kt).
import { gunOf, gunSaat, gunYap, tarih, ayBasi } from './tarih.js';
import { Mantik, AjandaMantik, AlimMantik, StokMantik, SayacMantik } from './mantik.js';
import { TABLOLAR, duzelt } from './db.js';

export const CIFT_DOKUNMA_MS = 60_000;
const IS_KAYNAK = new Set(['TAKIP', 'SAYAC', 'BAKIM']);
const esitTr = (a, b) => a.toLocaleLowerCase('tr-TR') === b.toLocaleLowerCase('tr-TR');

export class Depo {
  constructor(db, saat = () => Date.now()) {
    this.db = db;
    this.saat = saat;
    this._dc = null;
  }
  simdi() { return this.saat(); }
  bugun() { return gunOf(this.saat()); }
  ogle(gun) { return gun === this.bugun() ? this.saat() : gunSaat(gun, 12); }

  // ---------- okuma yardımcıları ----------

  /** Ev işi / sayaç / bakım durumu: son yapılma, bu ayki ve bugünkü sayı, bağlı stok (IsDao.durumlar). */
  isDurumlari(bugun = this.bugun()) {
    const db = this.db;
    if (this._dc && this._dc.surum === db.surum && this._dc.bugun === bugun) return this._dc.liste;
    const ab = ayBasi(bugun);
    const ozet = new Map();
    for (const k of db.t.kayitlar.values()) {
      if (k.refId == null || !IS_KAYNAK.has(k.kaynak)) continue;
      let o = ozet.get(k.refId);
      if (!o) ozet.set(k.refId, (o = { sonZaman: null, sonGun: null, buAy: 0, bugun: 0 }));
      if (o.sonZaman == null || k.zaman > o.sonZaman) o.sonZaman = k.zaman;
      if (o.sonGun == null || k.gun > o.sonGun) o.sonGun = k.gun;
      if (k.gun >= ab) o.buAy++;
      if (k.gun === bugun) o.bugun++;
    }
    const liste = db.hepsi('isler').filter((i) => !i.arsiv).sort((a, b) => a.sira - b.sira || a.id - b.id).map((i) => {
      const o = ozet.get(i.id);
      return { ...i, sonZaman: o?.sonZaman ?? null, sonGun: o?.sonGun ?? null, buAySayi: o?.buAy ?? 0, bugunSayi: o?.bugun ?? 0,
        stok: i.stokUrunId != null ? (db.getir('urunler', i.stokUrunId)?.stok ?? null) : null };
    });
    this._dc = { surum: db.surum, bugun, liste };
    return liste;
  }
  ogeKayitlari(refId, kaynak) { return this.db.hepsi('kayitlar').filter((k) => k.refId === refId && k.kaynak === kaynak).sort((a, b) => b.zaman - a.zaman); }
  isKayitlari(refId) { return this.db.hepsi('kayitlar').filter((k) => k.refId === refId && IS_KAYNAK.has(k.kaynak)).sort((a, b) => b.zaman - a.zaman); }
  aralik(bas, son) { return this.db.hepsi('kayitlar').filter((k) => k.gun >= bas && k.gun <= son).sort((a, b) => b.zaman - a.zaman); }
  modAralik(bas, son) { return this.db.hepsi('modlar').filter((m) => m.gun >= bas && m.gun <= son); }
  acikAlisveris() { return this.db.hepsi('alisveris').filter((m) => !m.alindi).sort((a, b) => a.eklenme - b.eklenme); }
  urunler() { return this.db.hepsi('urunler').filter((u) => !u.arsiv).sort((a, b) => a.ad.localeCompare(b.ad, 'tr')); }
  tamamSet() { return new Set(this.db.hepsi('tamamlar').map((t) => t.ajandaId + ':' + t.gun)); }
  ajanda() { return this.db.hepsi('ajanda').sort((a, b) => ((a.tarih ?? -1e9) - (b.tarih ?? -1e9)) || ((a.saatDakika ?? -1) - (b.saatDakika ?? -1))); }
  urunAdla(ad) { return this.db.hepsi('urunler').find((u) => u.ad === ad) ?? null; }
  anahtarla(a) { return this.db.hepsi('isler').find((i) => i.anahtar === a) ?? null; }
  stokDegistir(id, fark) { const u = this.db.getir('urunler', id); if (u) this.db.guncelle('urunler', id, { stok: Math.max(0, u.stok + fark) }); }

  // ---------- Takip / sayaç ----------

  isYap(isId, zaman = this.saat(), tutarSent = null, ek = null) {
    const db = this.db;
    return db.islem(() => {
      const i = db.getir('isler', isId);
      if (!i) return -1;
      const kaynak = i.tur === 'SAYAC' ? 'SAYAC' : i.tur === 'BAKIM' ? 'BAKIM' : 'TAKIP';
      if (i.tur !== 'SAYAC') {
        const son = this.ogeKayitlari(isId, kaynak)[0];
        if (son && Math.abs(zaman - son.zaman) < CIFT_DOKUNMA_MS) return son.id;
      }
      const metin = i.tur === 'SAYAC' ? SayacMantik.metin(i.ad, ek) : `${i.ad}: yapıldı`;
      const id = db.ekle('kayitlar', { zaman, gun: gunOf(zaman), kaynak, refId: i.id, metin, kategoriId: i.kategoriId, tutarSent });
      if (i.ertelenenGun != null) db.guncelle('isler', i.id, { ertelenenGun: null });
      if (i.stokUrunId != null) {
        this.stokDegistir(i.stokUrunId, -i.stokKullanim);
        const u = db.getir('urunler', i.stokUrunId);
        if (u && (Mantik.stokYetmezMi(u.stok, i.stokKullanim) || StokMantik.azMi(u))) this.alisveriseEkle(u.ad, u.id, u.ikon, true);
      }
      return id;
    });
  }

  sayacYap(anahtar, ek = null, zaman = this.saat()) {
    let i = this.anahtarla(anahtar);
    if (!i) { Tohum.yukleV4(this); i = this.anahtarla(anahtar); }
    if (!i) return -1;
    return this.isYap(i.id, zaman, null, ek);
  }

  geriAl(kayitId) {
    const db = this.db;
    db.islem(() => {
      const k = db.getir('kayitlar', kayitId);
      if (!k) return;
      if (IS_KAYNAK.has(k.kaynak) && k.refId != null) {
        const i = db.getir('isler', k.refId);
        if (i?.stokUrunId != null) this.stokDegistir(i.stokUrunId, i.stokKullanim);
      }
      if (k.kaynak === 'ZINCIR' && k.refId != null) {
        const anahtar = k.refId + ':' + k.gun;
        const m = db.getir('isaretler', anahtar);
        if (m) { if (m.adet <= 1) db.sil('isaretler', anahtar); else db.guncelle('isaretler', anahtar, { adet: m.adet - 1 }); }
      }
      if (k.kaynak === 'ALIM' && k.refId != null) {
        const a = db.getir('alimlar', k.refId);
        if (a) {
          const u = db.getir('urunler', a.urunId);
          if (u?.stokTakip) this.stokDegistir(u.id, -a.adet);
          db.sil('alimlar', a.id);
        }
      }
      if (k.kaynak === 'PARA' && k.refId != null) db.sil('para', k.refId);
      if (k.kaynak === 'AJANDA' && k.refId != null) {
        const a = db.getir('ajanda', k.refId);
        if (a) {
          if ((a.tekrar || 'YOK') === 'YOK') db.guncelle('ajanda', a.id, { yapildi: false, yapildiGun: null });
          else {
            const tm = db.hepsi('tamamlar');
            const o = tm.find((t) => t.kayitId === k.id)?.gun ??
              this.tekrarOlayi(a, k, tm.filter((t) => t.ajandaId === a.id && t.kayitId == null).map((t) => t.gun));
            if (o != null) db.sil('tamamlar', a.id + ':' + o);
          }
        }
      }
      db.sil('kayitlar', k.id);
    });
  }

  ertele(isId, gunSonra) { this.db.guncelle('isler', isId, { ertelenenGun: this.bugun() + gunSonra }); }

  elleKayit(metin, gun = this.bugun(), kategoriId = null) {
    const zaman = gun === this.bugun() ? this.saat() : gunSaat(gun, 12);
    return this.db.ekle('kayitlar', { zaman, gun, kaynak: 'ELLE', metin: metin.trim(), kategoriId });
  }

  kayitDuzenle(kayitId, metin, gun, kategoriId) {
    const k = this.db.getir('kayitlar', kayitId);
    if (!k) return;
    let zaman = k.zaman;
    if (gun !== k.gun) { const d = new Date(k.zaman); zaman = gunSaat(gun, d.getHours(), d.getMinutes()) + d.getSeconds() * 1000 + d.getMilliseconds(); }
    this.db.guncelle('kayitlar', kayitId, { metin: metin.trim(), gun, zaman, kategoriId });
  }

  modYaz(gun, seviye) {
    if (seviye == null) this.db.sil('modlar', gun);
    else this.db.yaz('modlar', { gun, seviye: Math.min(Math.max(seviye, 0), 2) });
  }

  // ---------- Zincir ----------
  zincirKur(ad, ikon, renk, gunSayisi, hedef, baslangic = this.bugun()) {
    return this.db.ekle('zincirler', { ad: ad.trim(), ikon, renk, gunSayisi: Math.min(Math.max(gunSayisi, 1), 3650), baslangic, gunlukHedef: Math.min(Math.max(hedef, 1), 10) });
  }

  zincirDokun(zincirId, gun = this.bugun()) {
    const db = this.db;
    db.islem(() => {
      const z = db.getir('zincirler', zincirId);
      if (!z) return;
      if (gun < z.baslangic || gun > z.baslangic + z.gunSayisi - 1) return;
      const anahtar = zincirId + ':' + gun;
      const mevcut = db.getir('isaretler', anahtar)?.adet ?? 0;
      const yeni = Mantik.sonrakiAdet(mevcut, z.gunlukHedef);
      if (yeni === 0) {
        db.sil('isaretler', anahtar);
        for (const k of this.aralik(gun, gun)) if (k.kaynak === 'ZINCIR' && k.refId === zincirId) db.sil('kayitlar', k.id);
      } else {
        db.yaz('isaretler', { zincirId, gun, adet: yeni });
        const gunNo = gun - z.baslangic + 1;
        const ek = z.gunlukHedef > 1 ? ` (${yeni}/${z.gunlukHedef})` : '';
        const zaman = gun === this.bugun() ? this.saat() : gunSaat(gun, 12);
        db.ekle('kayitlar', { zaman, gun, kaynak: 'ZINCIR', refId: zincirId, metin: `${z.ad} ✓ ${gunNo}/${z.gunSayisi}${ek}` });
      }
    });
  }

  // ---------- Alışveriş ----------
  alisveriseEkle(ad, urunId = null, ikon = 'paket', otomatik = false, online = false) {
    ad = ad.trim();
    if (!ad) return;
    const acik = this.acikAlisveris();
    if (acik.some((m) => (urunId != null && m.urunId === urunId) || esitTr(m.ad, ad))) return;
    this.db.ekle('alisveris', { ad, urunId, ikon, eklenme: this.saat(), otomatik, online });
  }

  alimEkle(urunId, gun, adet, odenenSent, normalSent, yer) {
    const db = this.db;
    return db.islem(() => {
      const u = db.getir('urunler', urunId);
      if (!u) return -1;
      adet = Math.max(adet, 1);
      const normal = u.tasarruf ? (normalSent ?? u.normalFiyatSent) : null;
      const aid = db.ekle('alimlar', { urunId, gun, adet, odenenSent, normalSent: normal, yer: yer?.trim() || null });
      if (u.stokTakip) this.stokDegistir(urunId, adet);
      if (u.tasarruf && normalSent != null && normalSent !== u.normalFiyatSent) db.guncelle('urunler', urunId, { normalFiyatSent: normalSent });
      for (const m of this.acikAlisveris()) if (m.urunId === urunId || esitTr(m.ad, u.ad)) db.guncelle('alisveris', m.id, { alindi: true });
      return db.ekle('kayitlar', { zaman: this.ogle(gun), gun, kaynak: 'ALIM', refId: aid, metin: AlimMantik.alimMetni(u.ad, adet, u.birim, odenenSent),
        kategoriId: u.kategoriId, tutarSent: odenenSent != null ? odenenSent * adet : null });
    });
  }

  stokSay(urunId, yeni) {
    this.db.islem(() => {
      const u = this.db.guncelle('urunler', urunId, { stok: Math.max(yeni, 0), sonSayimGun: this.bugun() });
      if (u && StokMantik.azMi(u)) this.alisveriseEkle(u.ad, u.id, u.ikon, true);
    });
  }

  alisverisIsaretle(m, alindi) { this.db.guncelle('alisveris', m.id, { alindi }); }

  alisverisiBitir() {
    const db = this.db;
    return db.islem(() => {
      const alinan = db.hepsi('alisveris').filter((m) => m.alindi);
      if (!alinan.length) return 0;
      for (const m of alinan) db.sil('alisveris', m.id);
      db.ekle('kayitlar', { zaman: this.saat(), gun: this.bugun(), kaynak: 'ALISVERIS', metin: `Markete gidildi, ${alinan.length} ürün` });
      return alinan.length;
    });
  }

  paraEkle(gun, sent) {
    const db = this.db;
    return db.islem(() => {
      const id = db.ekle('para', { gun, tutarSent: sent });
      return db.ekle('kayitlar', { zaman: this.ogle(gun), gun, kaynak: 'PARA', refId: id, metin: `Şirkette ${AlimMantik.tutarMetni(sent)} yüklendi`, tutarSent: sent });
    });
  }

  paraSil(p) {
    this.db.islem(() => {
      for (const k of this.aralik(p.gun, p.gun)) if (k.kaynak === 'PARA' && k.refId === p.id) this.db.sil('kayitlar', k.id);
      this.db.sil('para', p.id);
    });
  }

  takviyeEkle(t, adet) {
    const b = this.bugun();
    const simdi = StokMantik.takviyeStok(t, b);
    this.db.guncelle('takviyeler', t.id, { stok: Math.max(simdi + adet, 0), stokGunu: b, siklikGun: Math.max(t.siklikGun ?? 1, 1) });
  }

  takviyeKontrol() {
    const b = this.bugun();
    this.db.islem(() => {
      for (const t of this.db.hepsi('takviyeler')) if (StokMantik.takviyeAzMi(t, b)) this.alisveriseEkle(t.ad, null, 'hap', true);
    });
  }

  // ---------- Ajanda ----------
  ajandaEkle(a) { return this.db.ekle('ajanda', a); }

  ajandaTikle(id, olay) {
    const db = this.db;
    return db.islem(() => {
      const a = db.getir('ajanda', id);
      if (!a) return -1;
      const b = this.bugun();
      const tekrarli = (a.tekrar || 'YOK') !== 'YOK';
      const tm = db.hepsi('tamamlar');
      const yapildi = tekrarli ? olay != null && tm.some((t) => t.ajandaId === id && t.gun === olay) : a.yapildi;
      if (yapildi) {
        const kayitlar = this.ogeKayitlari(id, 'AJANDA');
        if (tekrarli && olay != null) {
          const t = db.getir('tamamlar', id + ':' + olay);
          let k = t?.kayitId != null ? kayitlar.find((x) => x.id === t.kayitId) : null;
          if (!k) {
            const eski = tm.filter((x) => x.ajandaId === id && x.kayitId == null).map((x) => x.gun);
            const sahipli = new Set(tm.map((x) => x.kayitId).filter((x) => x != null));
            k = kayitlar.filter((x) => !sahipli.has(x.id)).find((x) => this.tekrarOlayi(a, x, eski) === olay) ?? null;
          }
          if (k) db.sil('kayitlar', k.id);
          db.sil('tamamlar', id + ':' + olay);
        } else {
          for (const k of kayitlar) db.sil('kayitlar', k.id);
          db.guncelle('ajanda', id, { yapildi: false, yapildiGun: null });
        }
        return -1;
      }
      if (!tekrarli) db.guncelle('ajanda', id, { yapildi: true, yapildiGun: b });
      const ust = a.ustId != null ? db.getir('ajanda', a.ustId) : null;
      const metin = ust ? `${ust.baslik} · ${a.baslik}: yapıldı` : `${a.baslik}: yapıldı`;
      const kid = db.ekle('kayitlar', { zaman: this.saat(), gun: b, kaynak: 'AJANDA', refId: id, metin, kategoriId: a.kategoriId ?? ust?.kategoriId ?? null });
      if (tekrarli) db.yaz('tamamlar', { ajandaId: id, gun: olay ?? b, kayitId: kid });
      return kid;
    });
  }

  tekrarOlayi(a, k, tamamlar) {
    const o = AjandaMantik.olayGunu(a, k.gun);
    if (o != null && tamamlar.includes(o)) return o;
    const l = tamamlar.filter((g) => g <= k.gun);
    return l.length ? Math.max(...l) : null;
  }

  ajandaSil(id) {
    const db = this.db;
    db.islem(() => {
      const tamamSil = (aid) => { for (const t of db.hepsi('tamamlar')) if (t.ajandaId === aid) db.sil('tamamlar', t.ajandaId + ':' + t.gun); };
      for (const x of db.hepsi('ajanda')) if (x.ustId === id) { db.sil('ajanda', x.id); tamamSil(x.id); }
      db.sil('ajanda', id);
      tamamSil(id);
    });
  }

  /** Ajanda kaydı + alt adımlar (AnaVM.ajandaKaydet). */
  ajandaKaydet(a, altlar = []) {
    const db = this.db;
    return db.islem(() => {
      let id;
      if (!a.id) id = this.ajandaEkle(a); else { db.yaz('ajanda', a); id = a.id; }
      for (const x of altlar) {
        if (!x.trim()) continue;
        this.ajandaEkle({ tur: 'GOREV', baslik: x.trim(), tarih: this.bugun(), ustId: id, kategoriId: a.kategoriId ?? null,
          sonTarih: a.tur === 'GOREV' ? (a.sonTarih ?? null) : (a.tarih != null ? a.tarih - 1 : null) });
      }
      return id;
    });
  }

  ilkKurulum() {
    this.db.islem(() => {
      Tohum.yukle(this);
      Tohum.yukleV2(this);
      Tohum.yukleV3(this);
      Tohum.yukleV4(this);
    });
    this.takviyeKontrol();
  }

  // ---------- Yedek ----------
  paketle(zaman = this.saat()) {
    const p = { surum: 1, olusturma: zaman };
    for (const ad of Object.keys(TABLOLAR)) p[ad] = this.db.hepsi(ad).map((r) => duzelt(ad, r));
    return p;
  }

  /** Mevcut veriyi silip yedekten yükler. Android uygulamasının yedek dosyası da olur. */
  yukle(p) {
    if (!p || typeof p !== 'object' || !Array.isArray(p.isler) && !Array.isArray(p.kayitlar)) throw new Error('Bu bir MALI yedek dosyası değil');
    const db = this.db;
    db.islem(() => {
      db.hepsiniSil();
      for (const ad of Object.keys(TABLOLAR)) for (const r of p[ad] ?? []) db.yaz(ad, normalle(ad, r));
    });
  }
}

/** Yedekten gelen satır: eksik alanlar varsayılan, eski sürümlerdeki 0 sıklık 1 olur. */
function normalle(ad, r) {
  const x = duzelt(ad, r);
  if (ad === 'takviyeler') x.siklikGun = Math.max(x.siklikGun || 1, 1);
  if (ad === 'ajanda' && !x.tekrar) x.tekrar = 'YOK';
  return x;
}

// ---------------- Tohum: ilk açılışta hazır gelen veriler ----------------
export const Tohum = {
  KATEGORILER: [
    { ad: 'Ev', renk: 2, sira: 0 }, { ad: 'Araba', renk: 1, sira: 1 }, { ad: 'Sağlık', renk: 0, sira: 2 }, { ad: 'Nehir', renk: 3, sira: 3 },
    { ad: 'Resmi işler', renk: 3, sira: 4 }, { ad: 'Alışveriş', renk: 0, sira: 5 }, { ad: 'Tatil', renk: 1, sira: 6 }, { ad: 'Diğer', renk: 2, sira: 7 },
  ],

  yukle(depo) {
    const db = depo.db;
    if (db.sayi('kategoriler') === 0) for (const k of Tohum.KATEGORILER) db.ekle('kategoriler', k);
    if (db.sayi('isler') > 0) return;
    const u = (r) => db.ekle('urunler', r);
    const bulasikTemiz = u({ ad: 'Bulaşık makinesi temizleyici', stokTakip: true, stok: 2 });
    const camasirTemiz = u({ ad: 'Çamaşır makinesi temizleyici', stokTakip: true, stok: 2 });
    const yagCoz = u({ ad: 'Kahve makinesi yağ çözme tableti', stokTakip: true, stok: 0 });
    const brita = u({ ad: 'Brita filtre', stokTakip: true, stok: 2 });
    let s = 0;
    const g = gunYap;
    const p = (ad, ikon, renk, gun, son = null, stok = null, kullanim = 1, hat = true) =>
      ({ i: { ad, tur: 'PERIYODIK', ikon, renk, periyotGun: gun, hatirlatici: hat, stokUrunId: stok, stokKullanim: kullanim, sira: s++, kategoriId: 1 }, son });
    const c = (ad, ikon, renk, tutar = false) => ({ i: { ad, tur: 'SAYAC', ikon, renk, yildizli: true, tutarSor: tutar, sira: s++, kategoriId: 1 }, son: null });
    const b = (ad, ikon, renk, gun, hat, yildiz = false) => ({ i: { ad, tur: 'BAKIM', ikon, renk, periyotGun: gun, hatirlatici: hat, yildizli: yildiz, sira: s++, kategoriId: 3 }, son: null });
    const liste = [
      p("Nehir'in çarşafı", 'carsaf', 0, 14, g(2026, 11, 5)),
      p('Bizim çarşaf', 'carsaf', 0, 14, g(2026, 10, 31)),
      p('Bulaşık makinesi temizliği', 'bulasik', 2, 30, g(2026, 10, 17), bulasikTemiz),
      p('Çamaşır makinesi temizliği', 'camasir', 2, 30, g(2026, 10, 21), camasirTemiz),
      p('Kahve makinesi mekanizma temizliği', 'kahve', 1, 15),
      p('Kahve makinesi yağ çözme', 'kahve', 1, 20, null, yagCoz),
      p('Lavabo temizliği', 'lavabo', 2, 14),
      p('Banyo temizliği', 'banyo', 2, 14),
      p('Komple temizlik', 'temizlik', 3, 90),
      p('Brita filtre yenileme', 'filtre', 3, 35, g(2026, 10, 30), brita, 2),
      c('Bulaşık makinesi', 'bulasik', 2),
      c('Çamaşır makinesi', 'camasir', 2),
      c('Mangal', 'ates', 0),
      c('Kahve paketi açtım', 'kahve', 1),
      c('Pfand iade', 'pfand', 2, true),
      b('Saç tıraşı', 'makas', 3, 35, true),
      b('Sakal tıraşı', 'tiras', 3, null, false, true),
      b('Banyo', 'dus', 3, null, false),
      b('Ağda', 'agda', 3, 30, true),
      b('El tırnağı', 'tirnak', 3, 7, false),
      b('Ayak tırnağı', 'tirnak', 3, 14, false),
    ];
    for (const t of liste) {
      const id = db.ekle('isler', t.i);
      if (t.son != null) db.ekle('kayitlar', { zaman: gunSaat(t.son, 10), gun: t.son, kaynak: 'TAKIP', refId: id, metin: `${t.i.ad}: yapıldı`, kategoriId: t.i.kategoriId });
    }
    depo.alisveriseEkle('Kahve makinesi yağ çözme tableti', yagCoz, 'paket', true);
  },

  yukleV2(depo) {
    const db = depo.db;
    const liste = [
      ['Kahve', 'kg', 'kahve', true, false], ['Kıyma', 'kg', 'paket', false, false], ['Tuvalet kâğıdı', 'paket', 'paket', true, true],
      ['Havlu peçete', 'paket', 'paket', true, true], ['Çamaşır deterjanı', 'şişe', 'camasir', true, false], ['Yumuşatıcı', 'şişe', 'camasir', true, false],
      ['Bulaşık deterjanı / tableti', 'kg', 'bulasik', true, false], ['Çöp poşeti', 'rulo', 'cop', false, true], ['Deodorant', 'adet', 'paket', true, false],
      ['Tıraş bıçağı', 'paket', 'tiras', true, false], ['Tıraş köpüğü', 'kutu', 'tiras', true, false],
    ];
    for (const [ad, birim, ikon, tasarruf, stok] of liste) if (!depo.urunAdla(ad)) db.ekle('urunler', { ad, birim, ikon, tasarruf, stokTakip: stok, kategoriId: 1 });
    for (const [ad, ikon] of [['Brita filtre', 'filtre'], ['Kahve makinesi yağ çözme tableti', 'kahve'], ['Bulaşık makinesi temizleyici', 'bulasik'], ['Çamaşır makinesi temizleyici', 'camasir']]) {
      const u = depo.urunAdla(ad);
      if (u && u.ikon === 'paket') db.guncelle('urunler', u.id, { ikon });
    }
    if (db.sayi('takviyeler') === 0) {
      for (const [ad, sekil] of [['Omega 3', 'tablet'], ['Magnezyum', 'kapsul'], ['Çinko', 'tablet'], ['L-Theanine', 'kapsul'], ['Kolin', 'kapsul'], ['Vitamin D + K2', 'damla']])
        db.ekle('takviyeler', { ad, sekil, gunlukDoz: 0, stok: 0, stokGunu: depo.bugun() });
    }
  },

  yukleV3(depo) {
    const db = depo.db;
    if (db.hepsi('ajanda').some((a) => a.tur === 'RESMI_TATIL')) return;
    const g = gunYap;
    const t = (ad, y, m, d) => ({ tur: 'RESMI_TATIL', baslik: ad, tarih: g(y, m, d) });
    const tatiller = [
      t('Yılbaşı', 2026, 1, 1), t('Epiphanias', 2026, 1, 6), t('Karfreitag', 2026, 4, 3), t('Ostermontag', 2026, 4, 6),
      t('Tag der Arbeit', 2026, 5, 1), t('Christi Himmelfahrt', 2026, 5, 14), t('Pfingstmontag', 2026, 5, 25),
      t('Fronleichnam', 2026, 6, 4), t('Mariä Himmelfahrt', 2026, 8, 15), t('Tag der Deutschen Einheit', 2026, 10, 3),
      t('Allerheiligen', 2026, 11, 1), t('1. Weihnachtstag', 2026, 12, 25), t('2. Weihnachtstag', 2026, 12, 26),
      t('Yılbaşı', 2027, 1, 1), t('Epiphanias', 2027, 1, 6), t('Karfreitag', 2027, 3, 26), t('Ostermontag', 2027, 3, 29),
      t('Tag der Arbeit', 2027, 5, 1), t('Christi Himmelfahrt', 2027, 5, 6), t('Pfingstmontag', 2027, 5, 17),
      t('Fronleichnam', 2027, 5, 27), t('Mariä Himmelfahrt', 2027, 8, 15), t('Tag der Deutschen Einheit', 2027, 10, 3),
      t('Allerheiligen', 2027, 11, 1), t('1. Weihnachtstag', 2027, 12, 25), t('2. Weihnachtstag', 2027, 12, 26),
    ];
    for (const x of tatiller) depo.ajandaEkle(x);
    depo.ajandaEkle({ tur: 'FIRMA_IZNI', baslik: 'Firma izni (Freistellung)', tarih: g(2027, 12, 24) });
    depo.ajandaEkle({ tur: 'FIRMA_IZNI', baslik: 'Firma izni (Freistellung)', tarih: g(2027, 12, 27), bitis: g(2027, 12, 31) });
    depo.ajandaEkle({ tur: 'IZIN', baslik: 'Yaz izni', tarih: g(2027, 8, 2), bitis: g(2027, 8, 13), kategoriId: 7 });
    const k = (y, m, d, son = null, ad = 'Kita kapalı') => ({ tur: 'KITA_KAPALI', baslik: ad, tarih: g(y, m, d), bitis: son != null ? g(y, m, son) : null, tahmini: true, kategoriId: 4 });
    for (const x of [k(2027, 1, 4, 5), k(2027, 2, 8, 9), k(2027, 3, 24, 25), k(2027, 5, 7), k(2027, 5, 26), k(2027, 5, 28),
      k(2027, 8, 2, 13), k(2027, 10, 4), k(2027, 12, 24), k(2027, 12, 27, 31), k(2027, 11, 17, null, 'Buß- und Bettag: okul ve Kita kapalı (tatil değil)')]) depo.ajandaEkle(x);
    const b = depo.bugun();
    depo.ajandaEkle({ tur: 'GOREV', baslik: 'Arabayı yıkat', tarih: b, sonTarih: g(2026, 11, 20), kategoriId: 2, ilkAdim: 'Yıkama yerinin saatine bak' });
    const montaj = depo.ajandaEkle({ tur: 'GOREV', baslik: 'Montaj işleri', tarih: b, sonTarih: g(2026, 11, 11), kategoriId: 1 });
    for (const x of ['Süpürge', 'Lamba', 'Korniş', 'Ayna']) depo.ajandaEkle({ tur: 'GOREV', baslik: x, tarih: b, ustId: montaj, kategoriId: 1 });
    depo.ajandaEkle({ tur: 'RANDEVU', baslik: 'Dyson hava temizleyici ve süpürge servisi', tarih: null, sonTarih: b + 7, kategoriId: 1, ilkAdim: 'Servisi ara, randevu al' });
    const hg = tarih(b).hg;
    const pzt = b + ((8 - hg) % 7);
    depo.ajandaEkle({ tur: 'ETKINLIK', baslik: 'Nehir spor', tarih: pzt, saatDakika: 17 * 60, tekrar: 'HAFTALIK', tekrarGun: 1, kategoriId: 4, hatirlatici: true });
    depo.ajandaEkle({ tur: 'GOREV', baslik: "IG Metal Gutschein'larını al", tarih: ayBasi(b), tekrar: 'AYLIK', tekrarGun: 1, sureGun: 6, kategoriId: 5, hatirlatici: true });
  },

  yukleV4(depo) {
    const db = depo.db;
    let sira = Math.max(0, ...db.hepsi('isler').filter((i) => !i.arsiv).map((i) => i.sira)) + 1;
    for (const h of SayacMantik.HAZIR) {
      if (depo.anahtarla(h.anahtar)) continue;
      const eski = db.hepsi('isler').find((i) => !i.arsiv && i.tur === 'SAYAC' && i.anahtar == null && i.ad === h.ad);
      if (eski) db.guncelle('isler', eski.id, { anahtar: h.anahtar });
      else db.ekle('isler', { ad: h.ad, tur: 'SAYAC', ikon: h.ikon, renk: h.renk, yildizli: false, sira: sira++, kategoriId: 1, anahtar: h.anahtar });
    }
  },
};

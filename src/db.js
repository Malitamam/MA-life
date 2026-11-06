// Veri katmanı: tüm tablolar bellekte, her değişiklik IndexedDB'ye yazılır (telefonda kalır).
// Tablo adları Android yedek dosyasındaki (YedekPaket) alan adlarıyla aynı.

export const TABLOLAR = {
  kategoriler: 'id', isler: 'id', kayitlar: 'id', modlar: 'gun', zincirler: 'id', isaretler: ['zincirId', 'gun'],
  urunler: 'id', alimlar: 'id', alisveris: 'id', takviyeler: 'id', para: 'id', ajanda: 'id', notlar: 'id',
  filtreler: 'id', tamamlar: ['ajandaId', 'gun'],
};

/** Her tablonun alanları ve varsayılanları (Android Varliklar.kt). Eksik alanlar bununla doldurulur. */
export const SEMA = {
  kategoriler: { id: 0, ad: '', renk: 0, sira: 0 },
  isler: { id: 0, ad: '', tur: 'PERIYODIK', ikon: 'paket', renk: 2, periyotGun: null, hatirlatici: false, yildizli: false, stokUrunId: null,
    stokKullanim: 1, tutarSor: false, ilkAdim: null, kategoriId: null, sira: 0, arsiv: false, ertelenenGun: null, anahtar: null },
  kayitlar: { id: 0, zaman: 0, gun: 0, kaynak: 'ELLE', refId: null, metin: '', kategoriId: null, tutarSent: null },
  modlar: { gun: 0, seviye: 1 },
  zincirler: { id: 0, ad: '', ikon: 'gunes', renk: 2, gunSayisi: 10, baslangic: 0, gunlukHedef: 1, sira: 0, arsiv: false },
  isaretler: { zincirId: 0, gun: 0, adet: 1 },
  urunler: { id: 0, ad: '', birim: 'adet', ikon: 'paket', tasarruf: false, stokTakip: false, stok: 0, normalFiyatSent: null, yillikHedef: null,
    kategoriId: null, arsiv: false, sayimGun: null, sonSayimGun: null, esik: null },
  alimlar: { id: 0, urunId: 0, gun: 0, adet: 1, odenenSent: null, normalSent: null, yer: null },
  alisveris: { id: 0, ad: '', urunId: null, ikon: 'paket', eklenme: 0, alindi: false, otomatik: false, online: false },
  takviyeler: { id: 0, ad: '', sekil: 'kapsul', gunlukDoz: 0, stok: 0, stokGunu: 0, siklikGun: 1, esikAdet: null },
  para: { id: 0, gun: 0, tutarSent: 0 },
  ajanda: { id: 0, tur: 'GOREV', baslik: '', tarih: null, bitis: null, saatDakika: null, sonTarih: null, kesin: true, tekrar: 'YOK', tekrarGun: null,
    hatirlatici: false, kategoriId: null, ilkAdim: null, yapildi: false, yapildiGun: null, ustId: null, notId: null, tahmini: false,
    yer: null, aciklama: null, sureGun: null },
  notlar: { id: 0, metin: '', sesYolu: null, olusturma: 0, islendi: true, sabit: false, kategoriId: null },
  filtreler: { id: 0, ad: '', kaynaklar: '', kategoriler: '', arama: '' },
  tamamlar: { ajandaId: 0, gun: 0, kayitId: null },
};

export function duzelt(tablo, r) {
  const s = SEMA[tablo];
  const o = {};
  for (const k in s) o[k] = r[k] === undefined ? s[k] : r[k];
  return o;
}

const anahtarOf = (tablo, r) => {
  const k = TABLOLAR[tablo];
  return Array.isArray(k) ? k.map((x) => r[x]).join(':') : r[k];
};
const otomatikId = (tablo) => TABLOLAR[tablo] === 'id';

const AD = 'mali';
const SURUM = 1;

function istek(r) { return new Promise((ok, hata) => { r.onsuccess = () => ok(r.result); r.onerror = () => hata(r.error); }); }

export class Db {
  constructor() {
    this.t = {};
    for (const k in TABLOLAR) this.t[k] = new Map();
    this.ayar = new Map();
    this.sira = {};
    for (const k in TABLOLAR) if (otomatikId(k)) this.sira[k] = 0;
    this.surum = 0;
    this.dinleyiciler = new Set();
    this.idb = null;
    this.bekleyen = null; // açık işlem
    this.yazim = Promise.resolve();
  }

  /** IndexedDB'yi aç ve hepsini belleğe al. idb yoksa (test) sadece bellek. */
  async ac(indexedDB = globalThis.indexedDB) {
    if (!indexedDB) return this;
    const r = indexedDB.open(AD, SURUM);
    r.onupgradeneeded = () => {
      const d = r.result;
      for (const [ad, k] of Object.entries(TABLOLAR)) if (!d.objectStoreNames.contains(ad)) d.createObjectStore(ad, { keyPath: k });
      if (!d.objectStoreNames.contains('ayar')) d.createObjectStore('ayar');
      if (!d.objectStoreNames.contains('sesler')) d.createObjectStore('sesler');
      if (!d.objectStoreNames.contains('yedekler')) d.createObjectStore('yedekler');
    };
    this.idb = await istek(r);
    const tx = this.idb.transaction([...Object.keys(TABLOLAR), 'ayar'], 'readonly');
    for (const ad of Object.keys(TABLOLAR)) {
      const l = await istek(tx.objectStore(ad).getAll());
      for (const x of l) this.t[ad].set(anahtarOf(ad, x), x);
    }
    const st = tx.objectStore('ayar');
    const anahtarlar = await istek(st.getAllKeys());
    const degerler = await istek(st.getAll());
    anahtarlar.forEach((k, i) => this.ayar.set(k, degerler[i]));
    for (const ad of Object.keys(TABLOLAR)) {
      if (!otomatikId(ad)) continue;
      let m = this.ayar.get('sira_' + ad) ?? 0;
      for (const x of this.t[ad].values()) if (x.id > m) m = x.id;
      this.sira[ad] = m;
    }
    return this;
  }

  dinle(f) { this.dinleyiciler.add(f); return () => this.dinleyiciler.delete(f); }
  haber() { this.surum++; for (const f of this.dinleyiciler) f(this.surum); }

  hepsi(tablo) { return [...this.t[tablo].values()]; }
  getir(tablo, anahtar) { return this.t[tablo].get(anahtar) ?? null; }
  sayi(tablo) { return this.t[tablo].size; }

  /** Birden fazla yazmayı tek işlem yapar: hata olursa bellekteki değişiklikler geri alınır. */
  islem(f) {
    if (this.bekleyen) return f();
    const kayit = { yaz: new Map(), ayar: new Map(), eski: [] };
    this.bekleyen = kayit;
    let sonuc;
    try {
      sonuc = f();
    } catch (e) {
      for (let i = kayit.eski.length - 1; i >= 0; i--) {
        const [tablo, k, onceki] = kayit.eski[i];
        if (tablo === '#ayar') { if (onceki === undefined) this.ayar.delete(k); else this.ayar.set(k, onceki); }
        else if (onceki === undefined) this.t[tablo].delete(k); else this.t[tablo].set(k, onceki);
      }
      this.bekleyen = null;
      throw e;
    }
    this.bekleyen = null;
    if (kayit.yaz.size || kayit.ayar.size) { this.kalici(kayit); this.haber(); }
    return sonuc;
  }

  _yaz(tablo, k, deger) {
    if (!this.bekleyen) return this.islem(() => this._yaz(tablo, k, deger));
    const m = this.t[tablo];
    this.bekleyen.eski.push([tablo, k, m.get(k)]);
    if (deger === undefined) m.delete(k); else m.set(k, deger);
    this.bekleyen.yaz.set(tablo + '\u0000' + k, [tablo, k, deger]);
  }

  ekle(tablo, r) {
    const x = duzelt(tablo, r);
    if (otomatikId(tablo)) {
      return this.islem(() => {
        x.id = ++this.sira[tablo];
        this.ayarYaz('sira_' + tablo, this.sira[tablo]);
        this._yaz(tablo, x.id, x);
        return x.id;
      });
    }
    this._yaz(tablo, anahtarOf(tablo, x), x);
    return anahtarOf(tablo, x);
  }
  /** Var olanı günceller ya da ekler (id verilmişse). */
  yaz(tablo, r) {
    const x = duzelt(tablo, r);
    if (otomatikId(tablo) && x.id > (this.sira[tablo] ?? 0)) { this.sira[tablo] = x.id; this.ayarYaz('sira_' + tablo, x.id); }
    this._yaz(tablo, anahtarOf(tablo, x), x);
  }
  guncelle(tablo, anahtar, degisim) {
    const e = this.getir(tablo, anahtar);
    if (!e) return null;
    const y = { ...e, ...degisim };
    this._yaz(tablo, anahtar, y);
    return y;
  }
  sil(tablo, anahtar) { if (this.t[tablo].has(anahtar)) this._yaz(tablo, anahtar, undefined); }

  ayarAl(k, varsayilan) { return this.ayar.has(k) ? this.ayar.get(k) : varsayilan; }
  ayarYaz(k, v) {
    if (!this.bekleyen) return this.islem(() => this.ayarYaz(k, v));
    this.bekleyen.eski.push(['#ayar', k, this.ayar.get(k)]);
    this.ayar.set(k, v);
    this.bekleyen.ayar.set(k, v);
  }

  /** Tüm tabloları temizler (yedekten yükleme öncesi). */
  hepsiniSil() {
    this.islem(() => { for (const ad of Object.keys(TABLOLAR)) for (const k of [...this.t[ad].keys()]) this._yaz(ad, k, undefined); });
  }

  kalici(kayit) {
    if (!this.idb) return;
    const idb = this.idb;
    this.yazim = this.yazim.then(() => new Promise((ok) => {
      const tx = idb.transaction([...Object.keys(TABLOLAR), 'ayar'], 'readwrite');
      for (const [tablo, k, deger] of kayit.yaz.values()) {
        const st = tx.objectStore(tablo);
        if (deger === undefined) st.delete(Array.isArray(TABLOLAR[tablo]) ? String(k).split(':').map(Number) : k);
        else st.put(deger);
      }
      for (const [k, v] of kayit.ayar) tx.objectStore('ayar').put(v, k);
      tx.oncomplete = () => ok();
      tx.onerror = () => { console.error('Kayıt yazılamadı', tx.error); ok(); };
      tx.onabort = () => { console.error('Kayıt iptal', tx.error); ok(); };
    }));
  }

  /** Bekleyen tüm yazmalar bitene kadar bekler. */
  bitir() { return this.yazim; }

  // ---- Ses kayıtları ve iç yedekler (bellekte tutulmaz) ----
  async _kv(store, yontem, ...arg) {
    if (!this.idb) return null;
    const tx = this.idb.transaction(store, yontem === 'get' || yontem === 'getAllKeys' ? 'readonly' : 'readwrite');
    return istek(tx.objectStore(store)[yontem](...arg));
  }
  sesYaz(ad, blob) { return this._kv('sesler', 'put', blob, ad); }
  sesAl(ad) { return this._kv('sesler', 'get', ad); }
  sesSil(ad) { return this._kv('sesler', 'delete', ad); }
  icYedekYaz(ad, json) { return this._kv('yedekler', 'put', json, ad); }
  icYedekAl(ad) { return this._kv('yedekler', 'get', ad); }
  icYedekler() { return this._kv('yedekler', 'getAllKeys'); }
  icYedekSil(ad) { return this._kv('yedekler', 'delete', ad); }
}

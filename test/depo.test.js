// Depo testleri: Günlük'e yazma, geri alma, stok, ajanda tikleri, yedek ve Android yedeğinden içe aktarma.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Db } from '../src/db.js';
import { Depo } from '../src/depo.js';
import { gunYap, gunSaat } from '../src/tarih.js';

function yeni(gun = gunYap(2026, 11, 6), saat = 10) {
  let simdi = gunSaat(gun, saat);
  const depo = new Depo(new Db(), () => simdi);
  depo.ilkKurulum();
  return { depo, db: depo.db, ileri: (ms) => { simdi += ms; } };
}

test('ilk kurulum hazır verileri yükler', () => {
  const { db, depo } = yeni();
  assert.equal(db.sayi('kategoriler'), 8);
  assert.ok(db.hepsi('isler').length >= 21 + 6);
  assert.ok(depo.anahtarla('bulasik_calis'), 'eski Bulaşık makinesi sayacı bağlandı');
  assert.equal(db.hepsi('isler').filter((i) => i.ad === 'Bulaşık makinesi').length, 1);
  assert.ok(db.hepsi('ajanda').some((a) => a.tur === 'RESMI_TATIL'));
  assert.ok(depo.acikAlisveris().some((m) => m.ad === 'Kahve makinesi yağ çözme tableti'));
  depo.ilkKurulum(); // ikinci kez: çoğaltmaz
  assert.equal(db.sayi('kategoriler'), 8);
  assert.equal(db.hepsi('isler').filter((i) => i.anahtar === 'cop').length, 1);
});

test('yaptım: çift dokunma, stok düşer, geri al iade eder', () => {
  const { db, depo, ileri } = yeni();
  const brita = db.hepsi('isler').find((i) => i.ad === 'Brita filtre yenileme');
  const u0 = db.getir('urunler', brita.stokUrunId).stok;
  const k1 = depo.isYap(brita.id);
  ileri(10_000);
  const k2 = depo.isYap(brita.id);
  assert.equal(k1, k2, '60 sn içinde ikinci kayıt yok');
  assert.equal(db.getir('urunler', brita.stokUrunId).stok, u0 - 2);
  assert.ok(depo.acikAlisveris().some((m) => m.urunId === brita.stokUrunId), 'stok yetmiyor, listeye');
  const d = depo.isDurumlari().find((x) => x.id === brita.id);
  assert.equal(d.sonGun, depo.bugun());
  depo.geriAl(k1);
  assert.equal(db.getir('urunler', brita.stokUrunId).stok, u0);
});

test('hazır sayaç ekleri ve sayılar', () => {
  const { depo } = yeni();
  depo.sayacYap('camasir', 'Uzun · Beyaz');
  depo.sayacYap('camasir', 'Kısa');
  const d = depo.isDurumlari().find((x) => x.anahtar === 'camasir');
  assert.equal(d.bugunSayi, 2);
  assert.ok(depo.aralik(depo.bugun(), depo.bugun()).some((k) => k.metin === 'Çamaşır makinesi · Uzun · Beyaz'));
});

test('zincir dokunuşları', () => {
  const { depo, db } = yeni();
  const z = depo.zincirKur('Erken kalk', 'gunes', 2, 10, 2);
  depo.zincirDokun(z);
  depo.zincirDokun(z);
  assert.equal(db.getir('isaretler', z + ':' + depo.bugun()).adet, 2);
  assert.equal(depo.aralik(depo.bugun(), depo.bugun()).filter((k) => k.kaynak === 'ZINCIR').length, 2);
  depo.zincirDokun(z); // sıfırlar
  assert.equal(db.getir('isaretler', z + ':' + depo.bugun()), null);
  assert.equal(depo.aralik(depo.bugun(), depo.bugun()).filter((k) => k.kaynak === 'ZINCIR').length, 0);
});

test('alım, liste, alışverişi bitir', () => {
  const { depo, db } = yeni();
  const u = db.hepsi('urunler').find((x) => x.ad === 'Tuvalet kâğıdı');
  depo.alisveriseEkle('tuvalet KÂĞIDI');
  depo.alisveriseEkle('Tuvalet kâğıdı', u.id);
  assert.equal(depo.acikAlisveris().filter((m) => m.ad.toLowerCase().includes('tuvalet')).length, 1, 'aynı ad iki kez eklenmez');
  const kid = depo.alimEkle(u.id, depo.bugun(), 3, 499, 699, ' Lidl ');
  assert.equal(db.getir('urunler', u.id).stok, 3);
  assert.equal(db.getir('urunler', u.id).normalFiyatSent, 699);
  assert.equal(db.getir('kayitlar', kid).metin, 'Tuvalet kâğıdı alındı, 3 paket, 14,97 €');
  assert.equal(depo.alisverisiBitir(), 1);
  depo.geriAl(kid);
  assert.equal(db.getir('urunler', u.id).stok, 0);
  assert.equal(db.hepsi('alimlar').length, 0);
});

test('ajanda: tekrarlı görev tikle, geri al doğru haftayı siler', () => {
  const { depo, db } = yeni(gunYap(2026, 11, 10));
  const id = depo.ajandaEkle({ tur: 'GOREV', baslik: 'Çöp', tarih: gunYap(2026, 11, 3), tekrar: 'HAFTALIK', tekrarGun: 2 });
  const k1 = depo.ajandaTikle(id, gunYap(2026, 11, 3));
  const k2 = depo.ajandaTikle(id, gunYap(2026, 11, 10));
  assert.ok(k1 > 0 && k2 > 0);
  assert.equal(db.hepsi('tamamlar').length, 2);
  depo.ajandaTikle(id, gunYap(2026, 11, 3)); // geri al
  assert.equal(db.getir('kayitlar', k1), null);
  assert.ok(db.getir('kayitlar', k2));
  assert.deepEqual(db.hepsi('tamamlar').map((t) => t.gun), [gunYap(2026, 11, 10)]);
  depo.geriAl(k2);
  assert.equal(db.hepsi('tamamlar').length, 0);
});

test('para ve takviye', () => {
  const { depo, db } = yeni();
  const kid = depo.paraEkle(depo.bugun(), 1000);
  const p = db.hepsi('para')[0];
  assert.equal(db.getir('kayitlar', kid).metin, 'Şirkette 10 € yüklendi');
  depo.paraSil(p);
  assert.equal(db.getir('kayitlar', kid), null);
  const t = db.hepsi('takviyeler')[0];
  db.guncelle('takviyeler', t.id, { gunlukDoz: 1, stok: 5, stokGunu: depo.bugun() });
  depo.takviyeKontrol();
  assert.ok(depo.acikAlisveris().some((m) => m.ad === t.ad));
  depo.takviyeEkle(db.getir('takviyeler', t.id), 30);
  assert.equal(db.getir('takviyeler', t.id).stok, 35);
});

test('yedek: paketle → yükle aynı veri; Android yedeği (null alanlar yok) içe aktarılır', () => {
  const { depo } = yeni();
  depo.elleKayit('Nehir hastaneye');
  const p = JSON.parse(JSON.stringify(depo.paketle()));
  const ikinci = new Depo(new Db(), () => depo.simdi());
  ikinci.yukle(p);
  assert.deepEqual(ikinci.paketle(1), depo.paketle(1));
  // Android Gson yedeği: null alanlar yazılmaz, eski sürümde yeni alanlar yok
  const android = {
    surum: 1, olusturma: 1, kategoriler: [{ id: 1, ad: 'Ev', renk: 2, sira: 0 }],
    isler: [{ id: 7, ad: 'Bizim çarşaf', tur: 'PERIYODIK', ikon: 'carsaf', renk: 0, periyotGun: 14, hatirlatici: true, yildizli: false, stokKullanim: 1, tutarSor: false, kategoriId: 1, sira: 1, arsiv: false }],
    kayitlar: [{ id: 3, zaman: 1762333200000, gun: 20397, kaynak: 'TAKIP', refId: 7, metin: 'Bizim çarşaf: yapıldı', kategoriId: 1 }],
    modlar: [], zincirler: [], isaretler: [], urunler: [], alimlar: [], alisveris: [{ id: 1, ad: 'Süt', ikon: 'paket', eklenme: 5, alindi: false, otomatik: false }],
    takviyeler: [{ id: 1, ad: 'Omega 3', sekil: 'tablet', gunlukDoz: 2.0, stok: 60.0, stokGunu: 20390 }], para: [], ajanda: [{ id: 1, tur: 'GOREV', baslik: 'X', tarih: 20397, kesin: true, tekrar: 'YOK', hatirlatici: false, yapildi: false, tahmini: false }],
    notlar: [], filtreler: [],
  };
  const d3 = new Depo(new Db(), () => depo.simdi());
  d3.yukle(android);
  assert.equal(d3.db.getir('isler', 7).ertelenenGun, null);
  assert.equal(d3.db.getir('alisveris', 1).online, false);
  assert.equal(d3.db.getir('takviyeler', 1).siklikGun, 1);
  assert.equal(d3.isDurumlari(20397)[0].sonGun, 20397);
  const yeniId = d3.db.ekle('isler', { ad: 'Yeni', tur: 'SAYAC' });
  assert.equal(yeniId, 8, 'yeni kayıt numarası çakışmaz');
  assert.throws(() => d3.yukle({ foo: 1 }));
});

test('hata olursa işlem geri alınır', () => {
  const { depo, db } = yeni();
  const once = db.sayi('kayitlar');
  assert.throws(() => db.islem(() => { depo.elleKayit('a'); throw new Error('x'); }));
  assert.equal(db.sayi('kayitlar'), once);
});

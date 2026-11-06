// Android birim testlerinin (MantikTest, AjandaMantikTest, SayacStokTest ...) karşılığı.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Mantik, AjandaMantik, StokMantik, SayacMantik, GunlukMantik, PanoMantik, AlimMantik, OzetMantik, NotMantik, PanoDuzen, BildirimMantik, tutarMetni, parseEuro } from '../src/mantik.js';
import { gunYap as g, tarih, isoHafta, gunOf, gunSaat } from '../src/tarih.js';

const M = (o) => new Map(Object.entries(o).map(([k, v]) => [Number(k), v]));
const A = (o) => ({ tekrar: 'YOK', kesin: true, yapildi: false, ustId: null, ...o });

test('tarih yardımcıları', () => {
  assert.equal(g(1970, 1, 1), 0);
  assert.equal(tarih(g(2026, 11, 6)).hg, 5); // Cuma
  assert.equal(tarih(g(2026, 11, 9)).hg, 1); // Pazartesi
  assert.equal(isoHafta(g(2026, 11, 6)), 45);
  assert.equal(isoHafta(g(2027, 1, 1)), 53);
  assert.equal(isoHafta(g(2026, 1, 1)), 1);
  assert.equal(gunOf(gunSaat(g(2026, 3, 29), 12)), g(2026, 3, 29)); // yaz saati günü
  assert.equal(tarih(g(2024, 2, 1)).ayGun, 29);
});

test('kalanGun ve durum', () => {
  assert.equal(Mantik.kalanGun(100, 14, 100), 14);
  assert.equal(Mantik.kalanGun(100, 14, 114), 0);
  assert.equal(Mantik.kalanGun(100, 14, 117), -3);
  assert.equal(Mantik.kalanGun(100, null, 117), null);
  assert.equal(Mantik.kalanGun(null, 7, 117), 0);
  assert.equal(Mantik.durum(100, 14, 120), 'VAKTI_GELDI');
  assert.equal(Mantik.durum(100, 14, 120, 121), 'TAMAM');
  assert.equal(Mantik.durum(100, 14, 121, 121), 'VAKTI_GELDI');
  assert.equal(Mantik.durum(100, null, 120), 'PERIYOTSUZ');
  assert.ok(Mantik.stokYetmezMi(1, 2));
  assert.ok(!Mantik.stokYetmezMi(2, 2));
});

test('zincir', () => {
  const o = Mantik.zincirOzet(0, 10, 1, M({ 0: 1, 1: 1, 3: 1 }), 4);
  assert.equal(o.gecenGun, 5); assert.equal(o.tamGun, 3); assert.equal(o.bosGun, 1); assert.equal(o.yuzde, 75); assert.equal(o.enUzunSeri, 2); assert.equal(o.kalanGun, 5);
  const o2 = Mantik.zincirOzet(0, 3, 2, M({ 0: 2, 1: 1, 2: 2 }), 5);
  assert.equal(o2.tamGun, 2); assert.equal(o2.kismiGun, 1); assert.ok(o2.bitti); assert.equal(o2.yuzde, 66);
  assert.deepEqual(Mantik.sonYediGun(10, 30, 12), [null, null, null, null, 10, 11, 12]);
  assert.equal(Mantik.sonrakiAdet(0, 2), 1); assert.equal(Mantik.sonrakiAdet(1, 2), 2); assert.equal(Mantik.sonrakiAdet(2, 2), 0);
  assert.equal(Mantik.tasarrufSent(2199, 1499, 2), 1400); assert.equal(Mantik.tasarrufSent(null, 1499, 2), 0);
});

test('ajanda tekrarlar', () => {
  const spor = A({ id: 1, tur: 'ETKINLIK', baslik: 'Nehir spor', tarih: g(2026, 11, 9), tekrar: 'HAFTALIK', tekrarGun: 1 });
  assert.ok(AjandaMantik.gunde(spor, g(2026, 11, 16)));
  assert.ok(!AjandaMantik.gunde(spor, g(2026, 11, 17)));
  assert.ok(!AjandaMantik.gunde(spor, g(2026, 11, 2)));
  const ay31 = A({ id: 2, tur: 'GOREV', baslik: 'Ay sonu', tarih: g(2026, 1, 31), tekrar: 'AYLIK', tekrarGun: 31 });
  assert.ok(AjandaMantik.gunde(ay31, g(2026, 2, 28)));
  assert.ok(AjandaMantik.gunde(ay31, g(2026, 4, 30)));
  const dogum = A({ id: 3, tur: 'ETKINLIK', baslik: 'Doğum günü', tarih: g(2024, 2, 29), tekrar: 'YILLIK' });
  assert.ok(AjandaMantik.gunde(dogum, g(2026, 2, 28)));
});

test('gutschein açık kalır', () => {
  const a = A({ id: 5, tur: 'GOREV', baslik: 'IG Metal Gutschein', tarih: g(2026, 11, 1), tekrar: 'AYLIK', tekrarGun: 1, sureGun: 6, hatirlatici: true });
  const b = g(2026, 11, 4);
  assert.equal(AjandaMantik.olayGunu(a, b), g(2026, 11, 1));
  assert.equal(AjandaMantik.gunListesi([a], new Set(), b, b).length, 1);
  assert.equal(AjandaMantik.gunListesi([a], new Set(['5:' + g(2026, 11, 1)]), b, b).length, 0);
  assert.equal(AjandaMantik.olayGunu(a, g(2026, 11, 9)), null);
  assert.equal(AjandaMantik.sabahSatirlari([a], new Set(), g(2026, 11, 1)).length, 1);
  assert.equal(AjandaMantik.sabahSatirlari([a], new Set(), g(2026, 11, 3)).length, 0);
  assert.equal(AjandaMantik.sabahSatirlari([a], new Set(), g(2026, 11, 6)).length, 1);
});

test('açık görev bugünde kalır', () => {
  const b = g(2026, 11, 10);
  const gorev = A({ id: 1, tur: 'GOREV', baslik: 'Arabayı yıkat', tarih: g(2026, 11, 6), sonTarih: g(2026, 11, 8) });
  const l = AjandaMantik.gunListesi([gorev], new Set(), b, b);
  assert.equal(l.length, 1); assert.ok(l[0].gecikti);
  assert.equal(AjandaMantik.gunListesi([gorev], new Set(), g(2026, 11, 7), b).length, 0);
  assert.equal(AjandaMantik.gunListesi([{ ...gorev, sonTarih: g(2026, 11, 14) }], new Set(), g(2026, 11, 14), b).length, 1);
  const y = { ...gorev, yapildi: true, yapildiGun: b };
  assert.equal(AjandaMantik.gunListesi([y], new Set(), b, b).length, 1);
  assert.equal(AjandaMantik.gunListesi([y], new Set(), b + 1, b + 1).length, 0);
});

test('izin sayacı, köprü, durumlar', () => {
  const tatil = A({ id: 1, tur: 'RESMI_TATIL', baslik: 'Mariä', tarih: g(2027, 8, 15) });
  const izin = A({ id: 2, tur: 'IZIN', baslik: 'Yaz', tarih: g(2027, 8, 2), bitis: g(2027, 8, 13) });
  assert.equal(AjandaMantik.yillikIzin([tatil, izin], 2027), 10);
  const t2 = A({ id: 3, tur: 'RESMI_TATIL', baslik: 'Allerheiligen', tarih: g(2027, 11, 1) });
  const izin2 = A({ id: 4, tur: 'IZIN', baslik: 'Kasım', tarih: g(2027, 11, 1), bitis: g(2027, 11, 5) });
  assert.equal(AjandaMantik.yillikIzin([tatil, izin, t2, izin2], 2027), 14);
  assert.deepEqual(AjandaMantik.kopruGunleri([g(2027, 5, 6)]), [g(2027, 5, 7)]);
  const iz = A({ id: 10, tur: 'IZIN', baslik: 'İzin', tarih: g(2026, 12, 21), bitis: g(2026, 12, 23) });
  const kr = A({ id: 11, tur: 'KRANK', baslik: 'Hastalık', tarih: g(2026, 12, 22) });
  const ki = A({ id: 12, tur: 'KITA_KAPALI', baslik: 'Kita', tarih: g(2026, 12, 22), bitis: g(2026, 12, 31) });
  const ki2 = A({ id: 13, tur: 'KITA_KAPALI', baslik: 'Kita 2', tarih: g(2026, 12, 22) });
  const l = [iz, kr, ki, ki2];
  const turler = (gun) => AjandaMantik.gunDurumlari(l, gun).map((x) => x.tur);
  assert.deepEqual(turler(g(2026, 12, 21)), ['IZIN']);
  assert.deepEqual(turler(g(2026, 12, 22)), ['KRANK', 'IZIN']);
  assert.deepEqual(turler(g(2026, 12, 23)), ['IZIN', 'KITA_KAPALI']);
  assert.deepEqual(turler(g(2026, 12, 30)), ['KITA_KAPALI']);
  assert.deepEqual(turler(g(2027, 1, 1)), []);
  assert.equal(AjandaMantik.gunListesi(l, new Set(), g(2026, 12, 22), g(2026, 12, 22)).length, 0);
  const l2 = [A({ id: 1, tur: 'IZIN', tarih: g(2026, 12, 21), bitis: g(2026, 12, 23) }), A({ id: 2, tur: 'KRANK', tarih: g(2026, 11, 2), bitis: g(2026, 11, 8) })];
  assert.equal(AjandaMantik.yillikIzin(l2, 2026), 3);
  assert.equal(AjandaMantik.yillikGun(l2, 2026, 'KRANK'), 5);
});

test('hafta sonu, yakın günler, ev işi vadesi', () => {
  assert.ok(AjandaMantik.haftaSonu(g(2026, 11, 7)));
  assert.ok(AjandaMantik.haftaSonu(g(2026, 11, 8)));
  assert.ok(!AjandaMantik.haftaSonu(g(2026, 11, 6)));
  assert.deepEqual(AjandaMantik.yakinGunler(g(2026, 11, 6)), [g(2026, 11, 6), g(2026, 11, 7), g(2026, 11, 8), g(2026, 11, 9)]);
  const b = g(2026, 11, 6);
  const vade = AjandaMantik.takipVade(b - 10, 30, null, b);
  assert.equal(vade, b + 20);
  assert.ok(!AjandaMantik.takipGorunur(vade, b, false));
  assert.ok(AjandaMantik.takipGorunur(vade, b, true));
  assert.ok(AjandaMantik.takipGorunur(b + 2, b, false));
  assert.ok(!AjandaMantik.takipGorunur(b + 3, b, false));
  assert.equal(AjandaMantik.takipVade(b - 40, 30, null, b), b);
  assert.equal(AjandaMantik.takipVade(b - 40, 30, b + 5, b), b + 5);
  assert.equal(AjandaMantik.takipVade(b, null, null, b), null);
});

test('sayaç ekleri', () => {
  assert.equal(SayacMantik.ek('Uzun', ['Beyaz', 'Havlu']), 'Uzun · Beyaz, Havlu');
  assert.equal(SayacMantik.ek(null, ['Nehir'], ' perde '), 'Nehir, perde');
  assert.equal(SayacMantik.ek(null, [], '  '), null);
  assert.equal(SayacMantik.metin('Çamaşır makinesi', null), 'Çamaşır makinesi');
  assert.equal(SayacMantik.metin('Bulaşık makinesi', '70°C'), 'Bulaşık makinesi · 70°C');
  const m = ['Bulaşık makinesi · 70°C', 'Bulaşık makinesi · 60°C', 'Bulaşık makinesi · 70°C', 'Bulaşık makinesi', 'Başka · 70°C'];
  assert.deepEqual(SayacMantik.secenekSayilari(m, 'Bulaşık makinesi'), [['70°C', 2], ['60°C', 1]]);
  const c = ['Çamaşır makinesi · Uzun · Beyaz, Havlu', 'Çamaşır makinesi · Kısa · Beyaz'];
  assert.deepEqual(SayacMantik.secenekSayilari(c, 'Çamaşır makinesi'), [['Beyaz', 2], ['Havlu', 1], ['Kısa', 1], ['Uzun', 1]]);
});

test('stok ve takviye', () => {
  const urun = (stok, o = {}) => ({ id: 1, ad: 'Tuvalet kâğıdı', stokTakip: true, stok, esik: null, sayimGun: null, sonSayimGun: null, ...o });
  assert.ok(StokMantik.azMi(urun(1)));
  assert.ok(!StokMantik.azMi(urun(2)));
  assert.ok(StokMantik.azMi(urun(5, { esik: 5 })));
  assert.ok(!StokMantik.azMi(urun(0, { stokTakip: false })));
  assert.ok(!StokMantik.sayimVakti(urun(3), 100));
  assert.ok(StokMantik.sayimVakti(urun(3, { sayimGun: 30 }), 100));
  assert.ok(!StokMantik.sayimVakti(urun(3, { sayimGun: 30, sonSayimGun: 80 }), 100));
  assert.ok(StokMantik.sayimVakti(urun(3, { sayimGun: 30, sonSayimGun: 70 }), 100));
  const a = [{ gun: 40, adet: 4 }, { gun: 70, adet: 4 }, { gun: 90, adet: 4 }];
  const gt = StokMantik.gunlukTuketim(a, 2, 100);
  assert.ok(Math.abs(gt - 10 / 60) < 1e-9);
  assert.equal(StokMantik.kalanGun(2, gt), 12);
  assert.ok(StokMantik.alinmali(urun(2), 5));
  assert.ok(!StokMantik.alinmali(urun(6), 30));
  assert.equal(StokMantik.gunlukTuketim([{ gun: 95, adet: 4 }], 2, 100), null);
  assert.equal(StokMantik.gunlukTuketim([], 0, 100), null);
  const her = { ad: 'Omega 3', gunlukDoz: 2, stok: 60, stokGunu: 0, siklikGun: 1, esikAdet: null };
  assert.equal(StokMantik.takviyeStok(her, 10), 40);
  assert.equal(StokMantik.takviyeKalanGun(her, 10), 20);
  const ikide = { ...her, siklikGun: 2 };
  assert.equal(StokMantik.takviyeStok(ikide, 10), 50);
  assert.equal(StokMantik.takviyeKalanGun(ikide, 10), 50);
  assert.equal(StokMantik.takviyeStok({ ...her, siklikGun: 0 }, 10), 40);
  const kural = { ...her, esikAdet: 10 };
  assert.ok(!StokMantik.takviyeAzMi(kural, 25));
  assert.ok(StokMantik.takviyeAzMi(kural, 26));
  assert.ok(StokMantik.takviyeAzMi(her, 16));
  assert.ok(!StokMantik.takviyeAzMi(her, 15));
  assert.equal(StokMantik.takviyeStok(her, 1000), 0);
  assert.ok(!StokMantik.takviyeAzMi({ ...her, gunlukDoz: 0 }, 1000));
});

test('ev işleri yakın ve bakım vakti', () => {
  const b = 1000;
  const d = (id, tur, periyotGun, sonGun, ertelenenGun = null) => ({ id, tur, periyotGun, sonGun, ertelenenGun, sira: 0 });
  const l = [d(1, 'PERIYODIK', 14, b - 14), d(2, 'PERIYODIK', 14, b - 12), d(3, 'PERIYODIK', 14, b - 11), d(4, 'PERIYODIK', 14, b - 30),
    d(5, 'PERIYODIK', 14, b - 30, b + 5), d(6, 'BAKIM', 7, b - 7), d(7, 'SAYAC', null, null)];
  assert.deepEqual(new Set(PanoMantik.evIsleriYakin(l, b).map((x) => x.id)), new Set([1, 2, 4]));
  assert.deepEqual(PanoMantik.bakimVakti(l, b).map((x) => x.id), [6]);
});

test('günlük gruplama, arama', () => {
  const k = [{ id: 1, zaman: 100, gun: 1, metin: 'a' }, { id: 2, zaman: 300, gun: 1, metin: 'b' }, { id: 3, zaman: 200, gun: 2, metin: 'c' }];
  assert.deepEqual(GunlukMantik.gruplu(k).map((x) => x[0]), [2, 1]);
  assert.deepEqual(GunlukMantik.gruplu(k).at(-1)[1].map((x) => x.id), [2, 1]);
  assert.deepEqual(GunlukMantik.gruplu(k, true).map((x) => x[0]), [1, 2]);
  assert.deepEqual(GunlukMantik.gruplu(k, true)[0][1].map((x) => x.id), [1, 2]);
  assert.ok(GunlukMantik.eslesir("Nehir'in çarşafı: yapıldı", 'carsaf'));
  assert.ok(GunlukMantik.eslesir('İzin günü', 'izin'));
  assert.ok(!GunlukMantik.eslesir('Banyo', 'mutfak'));
  const h = GunlukMantik.hafta(g(2026, 11, 6), 0);
  assert.equal(h.bas, g(2026, 11, 2)); assert.equal(h.son, g(2026, 11, 8));
  const ay = GunlukMantik.ay(g(2026, 11, 6), 2);
  assert.equal(ay.bas, g(2027, 1, 1)); assert.equal(ay.son, g(2027, 1, 31));
});

test('alım özetleri ve para', () => {
  const b = g(2026, 11, 6);
  const al = [{ gun: b - 100, adet: 2, odenenSent: 1000, normalSent: 1500 }, { gun: b - 40, adet: 1, odenenSent: 1200, normalSent: 1500 }, { gun: b - 2, adet: 3, odenenSent: 900, normalSent: null }];
  const o = AlimMantik.ozet(al, b);
  assert.equal(o.alimSayisi, 3); assert.equal(o.toplamAdet, 6); assert.equal(o.ortalamaAralikGun, 49);
  assert.equal(o.yillikAdet, Math.round(6 * 365 / 100)); assert.equal(o.enUcuz, 900); assert.equal(o.enPahali, 1200); assert.equal(o.sonFiyat, 900);
  assert.equal(o.buAyHarcama, 2700); assert.equal(o.toplamTasarruf, 1000 + 300);
  assert.equal(tutarMetni(1000), '10 €'); assert.equal(tutarMetni(1499), '14,99 €'); assert.equal(tutarMetni(-5), '-0,05 €');
  assert.equal(AlimMantik.alimMetni('Kahve', 3, 'kg', 499), 'Kahve alındı, 3 kg, 14,97 €');
  const p = [{ gun: g(2026, 9, 3), tutarSent: 1000 }, { gun: g(2026, 11, 2), tutarSent: 2000 }];
  assert.equal(AlimMantik.yilToplam(p, 2026), 3000);
  assert.equal(AlimMantik.aylikOrtalama(p, 2026, b), 1000);
  assert.equal(parseEuro('14,99'), 1499); assert.equal(parseEuro(''), null); assert.equal(parseEuro('abc'), null);
});

test('özet, not, pano düzeni, bildirim', () => {
  const a = { bas: 0, son: 6 };
  const k = [{ gun: 1, kaynak: 'SAYAC', metin: 'Su içtim · 3' }, { gun: 1, kaynak: 'SAYAC', metin: 'Su içtim · 4' }, { gun: 2, kaynak: 'PARA', metin: 'x', tutarSent: 1000 }, { gun: 9, kaynak: 'ELLE', metin: 'dışarıda' }];
  const o = OzetMantik.hesapla(k, [{ gun: 1, seviye: 2 }], a);
  assert.equal(o.toplam, 3); assert.equal(o.aktifGun, 2); assert.deepEqual(o.enCok, [['Su içtim', 2]]); assert.equal(o.paraSent, 1000); assert.deepEqual(o.modlar, [0, 0, 1]);
  assert.deepEqual(NotMantik.satirlar('- süt\n• ekmek\n\n1. lamba\n2) korniş'), ['süt', 'ekmek', 'lamba', 'korniş']);
  assert.deepEqual(PanoDuzen.bloklar('buton,gun'), ['buton', 'sayac']);
  assert.deepEqual(PanoDuzen.tasi(['a', 'b', 'c'], 1, -1), ['b', 'a', 'c']);
  assert.ok(BildirimMantik.sessizMi(23 * 60, 22 * 60, 7 * 60));
  assert.ok(!BildirimMantik.sessizMi(8 * 60, 22 * 60, 7 * 60));
  assert.equal(BildirimMantik.ozetMetni(['a', 'b', 'c', 'd', 'e']), 'a, b, c ve 2 iş daha');
});

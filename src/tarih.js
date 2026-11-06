// Tarih yardımcıları. Gün = epochDay (1970-01-01'den beri gün, yerel takvim), zaman = epoch ms.
export const GUN_MS = 86_400_000;

export function gunOf(ms) {
  const d = new Date(ms);
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / GUN_MS);
}
export const bugunGun = () => gunOf(Date.now());

/** y, m (1-12), d → epochDay. Taşmalar Date.UTC ile düzelir. */
export const gunYap = (y, m, d) => Math.round(Date.UTC(y, m - 1, d) / GUN_MS);

/** epochDay → { y, m, d, hg (1 = Pazartesi … 7 = Pazar), ayGun, yilGun, yilUzun } */
export function tarih(g) {
  const t = new Date(g * GUN_MS);
  const y = t.getUTCFullYear(), m = t.getUTCMonth() + 1, d = t.getUTCDate();
  const hg = ((t.getUTCDay() + 6) % 7) + 1;
  const ayGun = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const yilUzun = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365;
  const yilGun = g - gunYap(y, 1, 1) + 1;
  return { y, m, d, hg, ayGun, yilGun, yilUzun };
}

/** Yerel saatte o günün belli saati (ms). */
export function gunSaat(g, saat = 12, dk = 0) {
  const t = tarih(g);
  return new Date(t.y, t.m - 1, t.d, saat, dk).getTime();
}

export const haftaSonu = (g) => tarih(g).hg >= 6;
export const ayBasi = (g) => { const t = tarih(g); return gunYap(t.y, t.m, 1); };
export const pazartesi = (g) => g - (tarih(g).hg - 1);
/** Ayı ekle (gün ay sonuna sıkışır). */
export function ayEkle(g, n) {
  const t = tarih(g);
  const yeni = new Date(Date.UTC(t.y, t.m - 1 + n, 1));
  const y = yeni.getUTCFullYear(), m = yeni.getUTCMonth() + 1;
  const son = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return gunYap(y, m, Math.min(t.d, son));
}

/** ISO 8601 hafta numarası. */
export function isoHafta(g) {
  const t = tarih(g);
  const persembe = g - t.hg + 4;
  const yil = tarih(persembe).y;
  return Math.floor((persembe - gunYap(yil, 1, 1)) / 7) + 1;
}

export const GUN_KISA = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
export const GUN_UZUN = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
export const AY_UZUN = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const AY_KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

const iki = (n) => String(n).padStart(2, '0');
export const saatYazi = (dk) => `${iki(Math.floor(dk / 60))}:${iki(dk % 60)}`;
export function saatMetni(ms) { const d = new Date(ms); return `${iki(d.getHours())}:${iki(d.getMinutes())}`; }

/** "Pzt 9 Kas" */
export function gunKisa(g) { const t = tarih(g); return `${GUN_KISA[t.hg - 1]} ${t.d} ${AY_KISA[t.m - 1]}`; }
/** "9 Kas Pzt" */
export function gunAyHg(g) { const t = tarih(g); return `${t.d} ${AY_KISA[t.m - 1]} ${GUN_KISA[t.hg - 1]}`; }
/** "Pazartesi 9 Kasım" */
export function gunUzun(g) { const t = tarih(g); return `${GUN_UZUN[t.hg - 1]} ${t.d} ${AY_UZUN[t.m - 1]}`; }
/** "9 Kas 2026" */
export function gunYil(g) { const t = tarih(g); return `${t.d} ${AY_KISA[t.m - 1]} ${t.y}`; }
/** "9 Kas 2026, Pzt" */
export function gunYilHg(g) { const t = tarih(g); return `${t.d} ${AY_KISA[t.m - 1]} ${t.y}, ${GUN_KISA[t.hg - 1]}`; }

/** "Bugün", "Dün", yoksa "Pzt 9 Kas". */
export function gunBaslik(g, bugun) {
  if (g === bugun) return 'Bugün';
  if (g === bugun - 1) return 'Dün';
  return gunKisa(g);
}

/** Bugünse saat, değilse gün başlığı. */
export function zamanMetni(ms, bugun) {
  const g = gunOf(ms);
  return g === bugun ? saatMetni(ms) : gunBaslik(g, bugun);
}

/** <input type=date> değeri ↔ epochDay */
export function gunInput(g) { const t = tarih(g); return `${t.y}-${iki(t.m)}-${iki(t.d)}`; }
export function inputGun(s) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? gunYap(+m[1], +m[2], +m[3]) : null; }

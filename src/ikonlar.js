// Çizgi ikonlar (Android MaliIkon.kt ile aynı yollar). Alt menü ikonları 20'lik, diğerleri 24'lük ızgarada.
const kutu = (x, y, w, h, r) =>
  `M${x + r},${y} h${w - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${h - 2 * r} a${r},${r} 0 0 1 -${r},${r} h-${w - 2 * r} a${r},${r} 0 0 1 -${r},-${r} v-${h - 2 * r} a${r},${r} 0 0 1 ${r},-${r} z`;
const daire = (cx, cy, r) => `M${cx - r},${cy} a${r},${r} 0 1 0 ${2 * r},0 a${r},${r} 0 1 0 -${2 * r},0 z`;

const v20 = (...y) => ({ vb: 20, y });
const v24 = (...y) => ({ vb: 24, y });

export const IKON = {
  pano: v20(kutu(2, 2, 7, 7, 2), kutu(11, 2, 7, 7, 2), kutu(2, 11, 7, 7, 2), kutu(11, 11, 7, 7, 2)),
  takip: v20('M16.5 7.5A7 7 0 0 0 4 6', 'M4 2.5V6h3.5', 'M3.5 12.5A7 7 0 0 0 16 14', 'M16 17.5V14h-3.5'),
  ajanda: v20(kutu(2, 4, 16, 14, 3), 'M2 8h16', 'M6 2v4', 'M14 2v4'),
  gunluk: v20('M4 3h10a2 2 0 0 1 2 2v13H6a2 2 0 0 1-2-2z', 'M8 7h5', 'M8 11h5'),
  alim: v20('M3 4h2l2 10h9l2-7H6', daire(8, 17, 1.3), daire(15, 17, 1.3)),
  notlar: v20('M5 2h7l4 4v12H5z', 'M12 2v4h4', 'M8 11h5', 'M8 14h4'),
  ev: v20('M2.5 9.5L10 3l7.5 6.5', 'M4.5 8v9.5h11V8', 'M8.5 17.5v-4.5h3v4.5'),
  sayac: v20('M4.5 4v12', 'M8 4v12', 'M11.5 4v12', 'M15 4v12', 'M2.5 13l15-6'),
  stok: v20(kutu(2, 10.5, 7, 7, 1.5), kutu(11, 10.5, 7, 7, 1.5), kutu(6.5, 2.5, 7, 7, 1.5)),
  takviye: v20('M8 16.5l8.5-8.5a3.5 3.5 0 0 0-5-5L3 11.5a3.5 3.5 0 0 0 5 5z', 'M7.25 7.25l5 5'),

  carsaf: v24(kutu(3, 7, 18, 11, 2), 'M3 11h18', 'M7 7V5'),
  bulasik: v24(kutu(4, 3, 16, 18, 2.5), 'M4 8h16', 'M7.5 5.5h1', 'M11 5.5h1', 'M8 13h8', 'M8 16.5h8'),
  camasir: v24(kutu(4, 3, 16, 18, 2.5), 'M4 7h16', daire(12, 14, 4)),
  ates: v24('M12 3c1 3.5 5 5 5 9.5a5 5 0 0 1-10 0c0-2.5 1.5-3.5 2-5.5 1 1 1.5 1.8 2.5 2 .3-2.2-.3-4 .5-6z', 'M5 21h14'),
  kahve: v24('M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z', 'M16 10.5h1.5a2 2 0 0 1 0 4H16', 'M8.5 3.5v2.5', 'M11.5 3.5v2.5'),
  pfand: v24('M10 2h4v3l1.5 2.5V20a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2V7.5L10 5z', 'M8.5 12h7'),
  tiras: v24(kutu(5, 4, 14, 4, 1.5), 'M7 8v1.5', 'M10 8v1.5', 'M14 8v1.5', 'M17 8v1.5', 'M12 9.5V20'),
  makas: v24(daire(6, 6, 3), daire(6, 18, 3), 'M8.5 7.5L20 18', 'M8.5 16.5L20 6'),
  dus: v24('M4 20V8a4 4 0 0 1 8 0', 'M10 8h6', 'M12 12v1', 'M15 12v1', 'M18 12v1', 'M12 16v1', 'M15 16v1', 'M18 16v1'),
  agda: v24('M6 4h12v4H6z', 'M8 8v11a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8'),
  tirnak: v24('M8 21V9a4 4 0 0 1 8 0v12', 'M10 9a2 2 0 0 1 4 0v3h-4z'),
  lavabo: v24('M3 12h18a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6z', 'M12 12V5h4', 'M10 21h4'),
  banyo: v24('M3 12h18v3a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5z', 'M6 12V5a2 2 0 0 1 4 0'),
  temizlik: v24('M12 3v8', 'M7 21l1-10h8l1 10z', 'M10 15v6', 'M14 15v6'),
  filtre: v24('M7 3h10l-1 18H8z', 'M8 9h8', 'M8.5 15h7'),
  paket: v24('M3 7l9-4 9 4v10l-9 4-9-4z', 'M3 7l9 4 9-4', 'M12 11v10'),
  gunes: v24(daire(12, 12, 4), 'M12 2v2', 'M12 20v2', 'M4 12H2', 'M22 12h-2', 'M5 5l1.5 1.5', 'M17.5 17.5L19 19', 'M5 19l1.5-1.5', 'M17.5 6.5L19 5'),
  dis: v24('M7 3c-2.5 0-4 2-3.5 5 .4 2.5 1.5 4 2 7 .4 2.8 1 6 2.5 6s1.5-4 4-4 2.5 4 4 4 2.1-3.2 2.5-6c.5-3 1.6-4.5 2-7 .5-3-1-5-3.5-5-2 0-3 1-5 1S9 3 7 3z'),
  kalp: v24('M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z'),
  kitap: v24('M4 4h7a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z', 'M20 4h-7a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h7z'),
  kosu: v24(daire(15, 4.5, 1.8), 'M8 21l3-6 3 2v5', 'M6 12l4-4 4 2 3 3', 'M11 15l-1-5'),
  su: v24('M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z'),

  tik: v24('M5 12l5 5 9-10'),
  arti: v24('M12 5v14', 'M5 12h14'),
  ara: v24(daire(11, 11, 7), 'M20 20l-3.5-3.5'),
  mikrofon: v24(kutu(9, 3, 6, 11, 3), 'M5.5 11a6.5 6.5 0 0 0 13 0', 'M12 17.5V21'),
  geri: v24('M15 5l-7 7 7 7'),
  yildiz: v24('M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z'),
  saat: v24(daire(12, 12, 8), 'M12 8v4l2.5 2'),
  kalem: v24('M4 4h9a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z', 'M14.5 15l5.5-5.5 1.5 1.5-5.5 5.5H14.5z'),
  filtrele: v24('M4 5h16l-6 7v6l-4 2v-8z'),
  zincir: v24(kutu(2.5, 8, 9, 8, 4), kutu(12.5, 8, 9, 8, 4), 'M9 12h6'),
  tablet: v24(daire(12, 12, 8), 'M6.5 17.5l11-11'),
  hap: v24('M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z', 'M8.5 8.5l7 7'),
  isci: v24(daire(9, 8, 3), 'M5 7.5a4 4 0 0 1 8 0z', 'M3.5 20a5.5 5.5 0 0 1 11 0', 'M21 9.5a3 3 0 1 0 0 5', 'M16.5 11h3.5', 'M16.5 13h3.5'),
  araba: v24('M3 4h2l2 10h9l2-7H6', daire(8, 18, 1.4), daire(15, 18, 1.4)),
  detay: v24('M4 5h9', 'M4 9h6', 'M4 13h5', 'M4 17h9', daire(16.5, 13, 3.5), 'M19 15.5l2.5 2.5'),
  afis: v24(kutu(4, 3, 16, 18, 2), daire(12, 10, 3), 'M8 17h8'),
  telefon: v24('M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z'),
  oto: v24('M4 15l1.5-5a2 2 0 0 1 2-1.5h9a2 2 0 0 1 2 1.5L20 15v3H4z', daire(7.5, 15.5, 1), daire(16.5, 15.5, 1)),
  cop: v24('M4 7h16', 'M9 7V4h6v3', 'M6 7l1 13h10l1-13'),
  durdur: v24(kutu(6, 6, 12, 12, 2)),
  oynat: v24('M7 4l12 8-12 8z'),
  ayar: v24(daire(12, 12, 3), 'M12 2v3', 'M12 19v3', 'M2 12h3', 'M19 12h3', 'M5 5l2 2', 'M17 17l2 2', 'M5 19l2-2', 'M17 7l2-2'),
  yuz0: v24(daire(12, 12, 9), 'M8.5 10h.01', 'M15.5 10h.01', 'M8 16.5a5 5 0 0 1 8 0'),
  yuz1: v24(daire(12, 12, 9), 'M8.5 10h.01', 'M15.5 10h.01', 'M8.5 15.5h7'),
  yuz2: v24(daire(12, 12, 9), 'M8.5 10h.01', 'M15.5 10h.01', 'M8 14.5a5 5 0 0 0 8 0'),
  ileri: v24('M9 5l7 7-7 7'),
  kapat: v24('M6 6l12 12', 'M18 6L6 18'),
  kart: v24(kutu(2, 5, 20, 14, 2.5), 'M2 9.5h20', 'M12 13.2a2.6 2.6 0 1 0 0 3.6', 'M7.5 14.4h3.5', 'M7.5 15.8h3.5'),
  ay: v24('M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z'),
  bosalt: v24(kutu(4, 3, 16, 18, 2.5), 'M12 17V9', 'M8.5 12.5L12 9l3.5 3.5'),
  kurutucu: v24(kutu(4, 3, 16, 18, 2.5), 'M7.5 6.5h1', daire(12, 13.5, 4.5), 'M9.5 13.5c.8-.8 1.7.8 2.5 0s1.7-.8 2.5 0'),
  asma: v24('M2 5h20', 'M8 5v2.5', 'M16 5v2.5', 'M8 7.5L5 10.5l2 2 1-1V19h8v-7.5l1 1 2-2-3-3h-2a2 2 0 0 1-4 0z'),
  supurge: v24('M17 2.5L10.5 17', 'M5 17h8.5a2 2 0 0 1 0 4H5a2 2 0 0 1 0-4z', 'M17 2.5h3'),
  robot: v24(daire(12, 12, 9), daire(12, 9, 2), 'M7.5 15.5h9'),
  bebek: v24(daire(12, 6.5, 3), 'M7 21v-4.5a5 5 0 0 1 10 0V21', 'M10.5 6.5h.01', 'M13.5 6.5h.01'),
  havlu: v24(kutu(6, 3, 12, 15, 2), 'M6 8h12', 'M9 18v3', 'M15 18v3'),
  sirala: v24('M7 4v16', 'M3.5 16.5L7 20l3.5-3.5', 'M17 20V4', 'M13.5 7.5L17 4l3.5 3.5'),
  kaydet: v24('M5 3h11l3 3v15H5z', 'M8 3v5h7V3', 'M8 21v-6h8v6'),
  // Alışveriş ürünleri (hızlı seç)
  ekmek: v24('M6 11.5A4 4 0 0 1 7 3.5h10a4 4 0 0 1 1 8V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z', 'M10 9l-1.5 3', 'M14.5 9L13 12'),
  brokoli: v24(daire(8, 9.5, 3.2), daire(16, 9.5, 3.2), daire(12, 6.5, 3.5), 'M10.5 13l.8 8h1.4l.8-8'),
  domates: v24(daire(12, 14, 7), 'M8.5 7.8L12 9.5l3.5-1.7', 'M12 9.5V4.5'),
  salatalik: v24('M5.6 18.4a3 3 0 0 1 0-4.2l8.6-8.6a3 3 0 0 1 4.2 4.2l-8.6 8.6a3 3 0 0 1-4.2 0z', 'M9.5 14.5h.01', 'M12 12h.01', 'M14.5 9.5h.01'),
  maydanoz: v24('M12 21V11', 'M12 15l-4.5-4.5', 'M12 13l4.5-4.5', daire(6.5, 9.5, 2.2), daire(17.5, 7.5, 2.2), daire(12, 7, 2.4)),
  sogan: v24('M12 4c-1 3-6.5 5-6.5 10a6.5 6.5 0 0 0 13 0c0-5-5.5-7-6.5-10z', 'M12 4V2.5', 'M12 9c-1.5 1.8-2.8 3.5-2.8 6', 'M10.5 21.5h3'),
  patates: v24('M4.5 13.5C4.5 9 8 5 13 5c3.8 0 6.5 2.6 6.5 6 0 4.5-3 9-8.5 9-4 0-6.5-2.5-6.5-6.5z', 'M10 10.5h.01', 'M14.5 12.5h.01', 'M10.5 15.5h.01'),
  sut: v24('M8.5 2.5h7', 'M8.5 2.5V5L6 9v12h12V9l-2.5-4V2.5', 'M6 9h12', 'M9.5 13h5'),
  peynir: v24('M3 15L15.5 6.5 21 10v9H3z', 'M3 15h18', daire(9, 17.2, 0.9), daire(16, 12.2, 1.1)),
  makarna: v24('M3 12h18a9 8 0 0 1-18 0z', 'M8 12c0-3 2-3.5 2-6.5', 'M12 12c0-3 2-3.5 2-6.5', 'M16 12c0-2.5 1.5-3.5 1.5-6'),
  tereyag: v24('M3 12l3-4h15l-3 4z', 'M3 12h15v7H3z', 'M18 12l3-4v7l-3 4'),
  icecek: v24('M7 8h10l-1.5 13h-7z', 'M12 8l2-5h3', 'M7.5 12.5h9'),
  et: v24('M4 12c0-4.5 4-8 9-8 4.2 0 7 2.6 7 6 0 2.6-2 4-4.8 5.1-2.6 1-3.6 4.9-7.2 4.9C5.6 20 4 16.6 4 12z', daire(10, 11, 1.8)),
  tavuk: v24('M10.5 13.5c-2-2-2.5-6.2.3-8.8 2.8-2.6 7.6-2.4 9.2.2 1.6 2.6.6 6.8-1.8 8.4-2.4 1.6-5.7 2.2-7.7.2z', 'M10.5 13.5L6 18', daire(5, 19.5, 1.5), daire(3.8, 17.6, 1.2)),
  balik: v24('M3 12c3-5 9.5-6 13.5-2.8L21 6v12l-4.5-3.2C12.5 18 6 17 3 12z', daire(8, 11, 0.6)),
  yogurt: v24('M5.5 9h13l-1.4 11a1 1 0 0 1-1 1H7.9a1 1 0 0 1-1-1z', 'M4.5 9h15', kutu(6, 5, 12, 4, 1)),
  yag: v24('M10 2.5h4', 'M10.5 2.5V6L8 9.5V20a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V9.5L13.5 6V2.5', 'M12 12s-1.6 2-1.6 3.2a1.6 1.6 0 0 0 3.2 0C13.6 14 12 12 12 12z'),
  yemis: v24('M5 10a7 5 0 0 1 14 0z', 'M6.2 10c0 5.5 2.8 9.5 5.8 11 3-1.5 5.8-5.5 5.8-11', 'M12 5V2.5'),
  musli: v24('M3 11h18a9 8 0 0 1-18 0z', 'M8 8h.01', 'M12 7h.01', 'M16 8h.01', 'M10 4.5h.01', 'M14 4.5h.01'),
  pommes: v24('M5 10h14l-2 11H7z', 'M8 10V4', 'M11 10V3', 'M14 10V4', 'M16.5 10l1-5', 'M6.8 10L6 5.5'),
  buz: v24('M12 3l8 4.5v9L12 21l-8-4.5v-9z', 'M4 7.5l8 4.5 8-4.5', 'M12 12v9'),
};

/** Veritabanındaki ikon adından ikon adı (bilinmeyen → paket). */
const ESLE = { kapsul: 'hap', damla: 'su' };
export const ikonAdi = (ad) => (IKON[ESLE[ad] ?? ad] ? ESLE[ad] ?? ad : 'paket');
export const SECILEBILIR = ['gunes', 'dis', 'kosu', 'su', 'kitap', 'kalp', 'hap', 'temizlik', 'ates', 'kahve', 'paket', 'zincir'];

/** Ürün adından alışveriş simgesi (ad içinde geçen kelimeye bakar; bilinmeyen → paket). */
const URUN_KELIME = [
  ['ekmek', 'ekmek'], ['brokoli', 'brokoli'], ['domates', 'domates'], ['salatalık', 'salatalik'], ['maydanoz', 'maydanoz'],
  ['soğan', 'sogan'], ['patates', 'patates'], ['süt', 'sut'], ['peynir', 'peynir'], ['kahve', 'kahve'], ['makarna', 'makarna'],
  ['tereyağ', 'tereyag'], ['içecek', 'icecek'], ['kola', 'icecek'], ['meyve suyu', 'icecek'], ['su', 'su'], ['kırmızı et', 'et'], ['kıyma', 'et'], ['et', 'et'],
  ['tavuk', 'tavuk'], ['balık', 'balik'], ['yoğurt', 'yogurt'], ['yağ', 'yag'], ['yemiş', 'yemis'], ['fındık', 'yemis'], ['ceviz', 'yemis'], ['badem', 'yemis'],
  ['müsli', 'musli'], ['pommes', 'pommes'], ['patates kızartma', 'pommes'], ['buz', 'buz'],
];
export function urunIkonu(ad) {
  const s = String(ad ?? '').toLocaleLowerCase('tr-TR').trim();
  const kelimeler = s.split(/\s+/);
  for (const [k, ik] of URUN_KELIME) if (k.includes(' ') && s.includes(k)) return ik;
  // Kısa kelimeler (su, et, yağ, süt, buz) tam eşleşmeli: "sucuk" su değildir.
  for (const [k, ik] of URUN_KELIME) if (!k.includes(' ') && kelimeler.some((w) => w === k || (k.length >= 4 && w.startsWith(k)))) return ik;
  return 'paket';
}

/** Renkli ürün simgesi (emoji): telefonda hemen tanınır. Bilinmeyen ürün → alışveriş arabası. */
const URUN_EMOJI = { ekmek: '🍞', brokoli: '🥦', domates: '🍅', salatalik: '🥒', maydanoz: '🌿', sogan: '🧅', patates: '🥔', sut: '🥛',
  peynir: '🧀', kahve: '☕', makarna: '🍝', tereyag: '🧈', icecek: '🥤', su: '💧', et: '🥩', tavuk: '🍗', balik: '🐟', yogurt: '🥣',
  yag: '🫒', yemis: '🥜', musli: '🌾', pommes: '🍟', buz: '🧊', paket: '🛒' };
export const urunEmoji = (ad) => URUN_EMOJI[urunIkonu(ad)] ?? '🛒';

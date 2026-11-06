// Ev modu planı: MAli'nin elle çizdiği krokiden çıkarılan ev + bahçe + otopark.
// Birim ≈ 1 m. x: yatak odasından mutfağa (uzun kenar), y: dış kapıdan bahçeye doğru.
// Fotoğraflardan sadece büyük eşyaların yeri ve rengi alındı.

export const IZGARA = 0.5; // yol bulma hücresi
export const DUNYA = { gen: 18, der: 23.5 };
export const DUVAR_Y = 0.55; // kesik duvar yüksekliği (bebek evi gibi içi görünsün)

/** Odalar: her biri bir ya da birkaç dikdörtgen [x, y, gen, der]. */
export const ODALAR = [
  { id: 'yatak', ad: 'Yatak odası', r: [[0, 0, 5, 6]], zemin: '#C99B63' },
  { id: 'cocuk', ad: "Nehir'in odası", r: [[0, 6, 4.5, 6.5]], zemin: '#D6AB72' },
  { id: 'wc', ad: 'WC', r: [[5, 0, 2.5, 3]], zemin: '#4F6F66' },
  { id: 'antre', ad: 'Antre', r: [[5, 3, 5, 4.5], [7.5, 0, 2.5, 3], [4.5, 6, 0.5, 1.5]], zemin: '#DDB57E' },
  { id: 'ofis', ad: 'Çalışma odası', r: [[4.5, 7.5, 5.5, 5]], zemin: '#CDA26C', duvar: '#E7B4BE' },
  { id: 'koridor', ad: 'Koridor', r: [[10, 2, 5, 1.5]], zemin: '#E0B77D' },
  { id: 'salon', ad: 'Salon', r: [[10, 3.5, 5, 9]], zemin: '#C2905A' },
  { id: 'banyo', ad: 'Banyo', r: [[15, 2, 3, 5.5]], zemin: '#7FA59C' },
  { id: 'mutfak', ad: 'Mutfak', r: [[15, 7.5, 3, 5]], zemin: '#DCCDB2' },
];
export const DIS = [
  { id: 'bahce', ad: 'Bahçe', r: [[0, 12.5, 18, 6]], zemin: '#86AE5C' },
  { id: 'otopark', ad: 'Otopark', r: [[0, 18.5, 18, 5]], zemin: '#8E9094' },
];

/** Kapılar: bölge sınırındaki geçitler [x1, y1, x2, y2]. */
export const KAPILAR = [
  [5, 4, 5, 5.5], // yatak – antre
  [6, 3, 7, 3], // wc – antre
  [4.5, 6.2, 4.5, 7.3], // çocuk – antre
  [7, 7.5, 8.5, 7.5], // ofis – antre
  [10, 2, 10, 3], // antre – koridor
  [10, 4.5, 10, 6], // antre – salon
  [15, 2.2, 15, 3.3], // koridor – banyo
  [15, 8, 15, 9.5], // salon – mutfak
  [2.5, 12.5, 3.5, 12.5], // çocuk – bahçe
  [5, 12.5, 6, 12.5], // ofis – bahçe
  [12.5, 12.5, 13.5, 12.5], // salon – bahçe
  [2.5, 18.5, 3.5, 18.5], // bahçe kapısı – otopark
];
export const DIS_KAPI = [8, 0, 9, 0];

/**
 * Eşyalar. x,y,g(genişlik),d(derinlik),h(yükseklik),z(yerden),renk, t: çizim türü, e: eylem anahtarı.
 * gec: üstünden yürünür (halı, teras). on: detayın çizildiği görünen yüz ('x' ya da 'y').
 */
export const ESYALAR = [
  // Yatak odası
  { id: 'yatak', ad: 'Yatak', oda: 'yatak', x: 1.3, y: 0.15, g: 2.2, d: 3.1, h: 0.55, renk: '#3A3A40', t: 'yatak', e: 'yatak', ust: '#9FB6A8' },
  { id: 'komodin1', ad: 'Komodin', oda: 'yatak', x: 0.15, y: 0.15, g: 1, d: 0.7, h: 0.55, renk: '#7A5638' },
  { id: 'komodin2', ad: 'Komodin', oda: 'yatak', x: 3.7, y: 0.15, g: 0.9, d: 0.7, h: 0.55, renk: '#F2EFEA' },
  { id: 'gardirop', ad: 'Aynalı dolap', oda: 'yatak', x: 0.8, y: 5.1, g: 3.6, d: 0.75, h: 2.1, renk: '#F4F1EC', t: 'aynali' },
  // Nehir'in odası
  { id: 'nyatak', ad: "Nehir'in yatağı", oda: 'cocuk', x: 3, y: 8.3, g: 1.35, d: 2.6, h: 0.5, renk: '#E9D3B0', t: 'yatak', e: 'nyatak', ust: '#F3B6C3' },
  { id: 'ndolap', ad: "Nehir'in dolabı", oda: 'cocuk', x: 3.4, y: 11.2, g: 0.95, d: 1, h: 1.3, renk: '#F4F1EC', t: 'dolap' },
  { id: 'oyuncak', ad: 'Oyuncak rafları', oda: 'cocuk', x: 0.15, y: 9.6, g: 0.7, d: 2.5, h: 0.75, renk: '#D9B98A', t: 'raf' },
  { id: 'kmutfak', ad: 'Oyuncak mutfak', oda: 'cocuk', x: 3.2, y: 6.5, g: 1.1, d: 0.7, h: 0.9, renk: '#F7F3EA' },
  { id: 'evcik', ad: 'Bebek evi', oda: 'cocuk', x: 0.2, y: 6.4, g: 1.1, d: 0.6, h: 1.1, renk: '#E8D2B4', t: 'evcik' },
  { id: 'nhali', ad: 'Halı', oda: 'cocuk', x: 0.9, y: 8.4, g: 1.9, d: 2.4, h: 0.02, renk: '#8C8F96', gec: true },
  // WC
  { id: 'wcklozet', ad: 'Klozet', oda: 'wc', x: 6.2, y: 0.15, g: 0.6, d: 0.75, h: 0.45, renk: '#F7F7F5', t: 'klozet', e: 'wc' },
  { id: 'wclavabo', ad: 'Lavabo', oda: 'wc', x: 5.15, y: 1.3, g: 0.55, d: 0.8, h: 0.85, renk: '#F7F7F5', t: 'lavabo', e: 'aynawc' },
  // Antre
  { id: 'cekmece', ad: 'Çekmeceli dolap', oda: 'antre', x: 5.2, y: 3.15, g: 1.2, d: 0.5, h: 0.95, renk: '#F6F4F0', t: 'cekmece', e: 'aynaantre' },
  { id: 'ayakkabi', ad: 'Ayakkabılık ve askı', oda: 'antre', x: 9.35, y: 5.9, g: 0.5, d: 1.4, h: 1.7, renk: '#F6F4F0', t: 'aski' },
  { id: 'pano', ad: 'Duvar panosu', oda: 'antre', x: 9.82, y: 0.6, g: 0.12, d: 1.4, h: 1.0, z: 0.8, renk: '#C99A5B', t: 'pano', e: 'pano' },
  // Çalışma odası
  { id: 'koltuk', ad: 'Koltuk', oda: 'ofis', x: 5.4, y: 8.6, g: 1.3, d: 1.3, h: 0.8, renk: '#E9E3D6', t: 'koltuk' },
  { id: 'raf', ad: 'Raf', oda: 'ofis', x: 4.65, y: 10.1, g: 0.45, d: 2, h: 1.2, renk: '#F4F1EC', t: 'raf' },
  { id: 'ofismasa', ad: 'Çalışma masası', oda: 'ofis', x: 8.5, y: 9.8, g: 1.3, d: 2.4, h: 0.75, renk: '#F2EEE6', t: 'masa', e: 'ofis' },
  { id: 'ofissandalye', ad: 'Ofis sandalyesi', oda: 'ofis', x: 7.6, y: 10.6, g: 0.6, d: 0.6, h: 1.0, renk: '#2E3340', t: 'sandalye' },
  { id: 'dyson', ad: 'Dyson', oda: 'ofis', x: 9.55, y: 8.0, g: 0.3, d: 0.3, h: 1.1, renk: '#B5A2D9', t: 'dyson', e: 'dyson' },
  // Koridor
  { id: 'gomme', ad: 'Gömme dolap', oda: 'koridor', x: 10.3, y: 2.03, g: 4.4, d: 0.55, h: 2.3, renk: '#D6A15C', t: 'hasir' },
  // Salon
  { id: 'kanepe1', ad: 'Kanepe', oda: 'salon', x: 10.15, y: 6.3, g: 1.1, d: 3, h: 0.75, renk: '#BDB9B1', t: 'kanepe' },
  { id: 'kanepe2', ad: 'Kanepe', oda: 'salon', x: 10.15, y: 9.35, g: 1.1, d: 2.95, h: 0.75, renk: '#B3AFA7', t: 'kanepe' },
  { id: 'puf', ad: 'Puf', oda: 'salon', x: 11.7, y: 10.3, g: 0.55, d: 0.55, h: 0.4, renk: '#B05F2E' },
  { id: 'salonhali', ad: 'Halı', oda: 'salon', x: 11.4, y: 7.2, g: 2.2, d: 4.4, h: 0.02, renk: '#9C9A90', gec: true },
  { id: 'tv', ad: 'Televizyon', oda: 'salon', x: 14.2, y: 8.9, g: 0.6, d: 3, h: 0.5, renk: '#5A3A28', t: 'tv' },
  { id: 'yemekmasa', ad: 'Yemek masası', oda: 'salon', x: 13.2, y: 4.0, g: 1.4, d: 2.4, h: 0.75, renk: '#8B5A30', t: 'masa', e: 'yemek' },
  { id: 'roborock', ad: 'Roborock', oda: 'salon', x: 12.3, y: 6.3, g: 0.45, d: 0.45, h: 0.12, renk: '#2F3136', t: 'robot', e: 'roborock', gec: true },
  // Banyo
  { id: 'camasir', ad: 'Çamaşır + kurutma', oda: 'banyo', x: 17.2, y: 2.2, g: 0.7, d: 0.7, h: 1.8, renk: '#F4F5F6', t: 'makine2', e: 'camasir' },
  { id: 'sepet', ad: 'Kirli sepeti', oda: 'banyo', x: 16.4, y: 2.3, g: 0.5, d: 0.5, h: 0.6, renk: '#E3E0D8' },
  { id: 'blavabo', ad: 'Lavabo ve ayna', oda: 'banyo', x: 17.3, y: 4.0, g: 0.6, d: 0.9, h: 0.85, renk: '#F7F7F5', t: 'lavabo', e: 'aynabanyo' },
  { id: 'kuvet', ad: 'Küvet', oda: 'banyo', x: 15.1, y: 4.3, g: 0.8, d: 1.8, h: 0.55, renk: '#F7F7F5', t: 'kuvet', e: 'kuvet' },
  { id: 'dus', ad: 'Duş kabini', oda: 'banyo', x: 17.0, y: 6.3, g: 0.95, d: 1.1, h: 1.9, renk: '#CFE3E6', t: 'dus', e: 'dus' },
  { id: 'bklozet', ad: 'Klozet', oda: 'banyo', x: 15.2, y: 6.65, g: 0.6, d: 0.75, h: 0.45, renk: '#F7F7F5', t: 'klozet', e: 'banyotemiz' },
  // Mutfak
  { id: 'buzdolabi', ad: 'Buzdolabı', oda: 'mutfak', x: 15.15, y: 7.6, g: 0.7, d: 0.7, h: 1.85, renk: '#ECEEF0', t: 'buzdolabi', e: 'buzdolabi' },
  { id: 'kahvetezgah', ad: 'Tezgâh', oda: 'mutfak', x: 15.9, y: 7.6, g: 1.4, d: 0.65, h: 0.9, renk: '#C98B42', t: 'tezgah' },
  { id: 'kahve', ad: 'Kahve makinesi', oda: 'mutfak', x: 16.05, y: 7.68, g: 0.4, d: 0.42, h: 0.4, z: 0.9, renk: '#26272B', t: 'kahve', e: 'kahve' },
  { id: 'tezgah', ad: 'Tezgâh', oda: 'mutfak', x: 17.3, y: 7.6, g: 0.65, d: 4.8, h: 0.9, renk: '#C98B42', t: 'tezgah' },
  { id: 'bulasik', ad: 'Bulaşık makinesi', oda: 'mutfak', x: 17.28, y: 9.0, g: 0.67, d: 0.6, h: 0.91, renk: '#D5D8DC', t: 'bulasik', e: 'bulasik' },
  { id: 'mlavabo', ad: 'Eviye', oda: 'mutfak', x: 17.35, y: 9.75, g: 0.55, d: 0.8, h: 0.04, z: 0.9, renk: '#E7EAEC', t: 'eviye', e: 'eviye' },
  { id: 'ocak', ad: 'Ocak', oda: 'mutfak', x: 17.35, y: 11.0, g: 0.55, d: 0.75, h: 0.03, z: 0.9, renk: '#1F2024', t: 'ocak' },
  { id: 'konsol', ad: 'Konsol', oda: 'mutfak', x: 15.15, y: 10.0, g: 0.6, d: 2.3, h: 0.9, renk: '#8E5E34', t: 'tezgah' },
  { id: 'takviye', ad: 'Takviye kutusu', oda: 'mutfak', x: 15.25, y: 10.2, g: 0.4, d: 0.35, h: 0.22, z: 0.9, renk: '#B9A3D6', e: 'takviye' },
  { id: 'cop', ad: 'Çöp kovası', oda: 'mutfak', x: 15.95, y: 11.7, g: 0.45, d: 0.45, h: 0.65, renk: '#6C7178', t: 'cop', e: 'cop' },
  // Bahçe
  { id: 'teras', ad: 'Beton teras', oda: 'bahce', x: 4.5, y: 12.55, g: 10, d: 3.1, h: 0.03, renk: '#BFBCB4', gec: true, t: 'beton' },
  { id: 'kulube', ad: 'Kulübe', oda: 'bahce', x: 0.2, y: 13.1, g: 1.9, d: 1.8, h: 1.8, renk: '#5B3F2C', t: 'kulube', e: 'kulube' },
  { id: 'trambolin', ad: 'Trambolin', oda: 'bahce', x: 1.0, y: 15.3, g: 2, d: 2, h: 0.6, renk: '#1F2226', t: 'trambolin', e: 'trambolin' },
  { id: 'mangal', ad: 'Mangal', oda: 'bahce', x: 8.6, y: 12.75, g: 0.8, d: 0.6, h: 0.85, renk: '#24262A', t: 'mangal', e: 'mangal' },
  { id: 'bmasa', ad: 'Bahçe masası', oda: 'bahce', x: 10.9, y: 13.2, g: 1.4, d: 1.5, h: 0.72, renk: '#3A3D42', t: 'masa' },
  { id: 'sera', ad: 'Sera', oda: 'bahce', x: 15.8, y: 13.9, g: 1.9, d: 2.2, h: 1.9, renk: '#D9EBE7', t: 'sera', e: 'sera' },
  { id: 'salincak', ad: 'Salıncak', oda: 'bahce', x: 14.9, y: 16.8, g: 1.6, d: 0.7, h: 1.8, renk: '#5C6066', t: 'salincak' },
  { id: 'hortum', ad: 'Bahçe hortumu', oda: 'bahce', x: 14.7, y: 12.65, g: 0.45, d: 0.45, h: 0.35, renk: '#5D9E4A', t: 'hortum', e: 'sulama' },
  // Otopark
  { id: 'araba', ad: 'Araba', oda: 'otopark', x: 3.6, y: 19.2, g: 2.3, d: 1.5, h: 1.25, renk: '#EE8A6E', t: 'araba', e: 'araba' },
  { id: 'araba2', ad: 'Komşu arabası', oda: 'otopark', x: 7.6, y: 19.2, g: 2.3, d: 1.5, h: 1.25, renk: '#9AA3AE', t: 'araba' },
  { id: 'araba3', ad: 'Komşu arabası', oda: 'otopark', x: 14.6, y: 19.2, g: 2.3, d: 1.5, h: 1.25, renk: '#6F7E73', t: 'araba' },
  { id: 'agac1', ad: 'Ağaç', oda: 'otopark', x: 0.4, y: 19.0, g: 1.4, d: 1.4, h: 3.2, renk: '#4E7A3F', t: 'agac' },
  { id: 'agac2', ad: 'Ağaç', oda: 'otopark', x: 11.4, y: 19.1, g: 1.2, d: 1.2, h: 2.8, renk: '#557F45', t: 'agac' },
];

/** Bırakma alanları: kesik çizgili, üzerine gelince ya da dokununca eylem açılır. */
export const ALANLAR = [
  { id: 'z-yatak', ad: 'YATAK', x: 2.0, y: 3.4, g: 1.2, d: 0.8, e: 'yatak' },
  { id: 'z-nyatak', ad: 'NEHİR', x: 1.5, y: 8.9, g: 1.2, d: 1.0, e: 'nyatak' },
  { id: 'z-wc', ad: 'TUVALET', x: 6.0, y: 1.1, g: 1.2, d: 0.9, e: 'wc' },
  { id: 'z-aynawc', ad: 'AYNA', x: 5.85, y: 1.9, g: 0.0, d: 0.0, e: 'aynawc', gizli: true },
  { id: 'z-aynaantre', ad: 'AYNA', x: 5.3, y: 3.8, g: 1.1, d: 0.7, e: 'aynaantre' },
  { id: 'z-pano', ad: 'PANO', x: 8.6, y: 0.7, g: 1.0, d: 1.1, e: 'pano' },
  { id: 'z-kapi', ad: 'DIŞARI ÇIK', x: 7.9, y: 0.15, g: 1.2, d: 0.5, e: 'kapi', vurgu: true },
  { id: 'z-ofis', ad: 'MASA', x: 7.2, y: 9.6, g: 1.0, d: 0.8, e: 'ofis' },
  { id: 'z-dyson', ad: 'DYSON', x: 8.7, y: 8.0, g: 0.8, d: 0.7, e: 'dyson' },
  { id: 'z-roborock', ad: 'ROBOROCK', x: 12.1, y: 5.4, g: 1.1, d: 0.7, e: 'roborock' },
  { id: 'z-yemek', ad: 'MASA', x: 12.2, y: 4.4, g: 0.9, d: 1.4, e: 'yemek', gizli: true },
  { id: 'z-camasir', ad: 'ÇAMAŞIR', x: 16.3, y: 3.0, g: 0.85, d: 0.85, e: 'camasir' },
  { id: 'z-aynabanyo', ad: 'AYNA', x: 16.4, y: 4.1, g: 0.8, d: 0.8, e: 'aynabanyo' },
  { id: 'z-kuvet', ad: 'KÜVET', x: 15.95, y: 4.95, g: 0.0, d: 0.0, e: 'kuvet', gizli: true },
  { id: 'z-dus', ad: 'DUŞ', x: 16.15, y: 5.5, g: 0.8, d: 0.75, e: 'dus' },
  { id: 'z-banyotemiz', ad: 'TEMİZLİK', x: 15.95, y: 6.5, g: 0.0, d: 0.0, e: 'banyotemiz', gizli: true },
  { id: 'z-buzdolabi', ad: 'BUZDOLABI', x: 15.2, y: 8.4, g: 0.9, d: 0.7, e: 'buzdolabi' },
  { id: 'z-kahve', ad: 'KAHVE', x: 16.0, y: 8.35, g: 0.8, d: 0.6, e: 'kahve' },
  { id: 'z-bulasik', ad: 'BULAŞIK', x: 16.4, y: 9.0, g: 0.8, d: 0.7, e: 'bulasik' },
  { id: 'z-eviye', ad: 'EVİYE', x: 16.4, y: 9.8, g: 0.8, d: 0.6, e: 'eviye', gizli: true },
  { id: 'z-takviye', ad: 'TAKVİYE', x: 15.85, y: 10.3, g: 0.0, d: 0.0, e: 'takviye', gizli: true },
  { id: 'z-cop', ad: 'ÇÖP', x: 16.5, y: 11.6, g: 0.75, d: 0.7, e: 'cop' },
  { id: 'z-kulube', ad: 'PFAND AL', x: 2.25, y: 13.4, g: 1.1, d: 1.1, e: 'kulube', vurgu: true },
  { id: 'z-mangal', ad: 'MANGAL', x: 8.6, y: 13.5, g: 0.9, d: 0.7, e: 'mangal' },
  { id: 'z-cim', ad: 'ÇİM BİÇ', x: 6.5, y: 16.3, g: 2.0, d: 1.4, e: 'cim' },
  { id: 'z-supur', ad: 'TERAS SÜPÜR', x: 6.0, y: 14.0, g: 1.6, d: 0.9, e: 'teras' },
  { id: 'z-sulama', ad: 'SULAMA', x: 13.9, y: 13.3, g: 0.9, d: 0.8, e: 'sulama' },
  { id: 'z-sera', ad: 'SERA', x: 14.7, y: 14.6, g: 0.9, d: 1.0, e: 'sera' },
  { id: 'z-trambolin', ad: 'TRAMBOLİN', x: 3.2, y: 15.8, g: 1.1, d: 0.9, e: 'trambolin' },
  { id: 'z-araba', ad: 'PFAND BIRAK', x: 3.9, y: 18.75, g: 1.7, d: 0.5, e: 'araba', vurgu: true },
  { id: 'z-yol', ad: 'YOLA ÇIK', x: 8.0, y: 21.8, g: 3.0, d: 1.0, e: 'kapi', vurgu: true },
];

/** Bir noktanın bölgesi (oda id'si, 'bahce', 'otopark' ya da null = dışarısı). */
export function bolge(x, y) {
  for (const o of ODALAR) for (const [rx, ry, rg, rd] of o.r) if (x >= rx && x < rx + rg && y >= ry && y < ry + rd) return o.id;
  for (const o of DIS) for (const [rx, ry, rg, rd] of o.r) if (x >= rx && x < rx + rg && y >= ry && y < ry + rd) return o.id;
  return null;
}

export const ODA_AD = Object.fromEntries([...ODALAR, ...DIS].map((o) => [o.id, o.ad]));

const kapidaMi = (mx, my) => KAPILAR.some(([x1, y1, x2, y2]) =>
  (x1 === x2 ? Math.abs(mx - x1) < 0.01 && my > Math.min(y1, y2) && my < Math.max(y1, y2)
    : Math.abs(my - y1) < 0.01 && mx > Math.min(x1, x2) && mx < Math.max(x1, x2)));

/** Yol bulma ızgarası ve duvar kenarları. */
export function izgaraKur() {
  const S = IZGARA, NX = Math.round(DUNYA.gen / S), NY = Math.round(DUNYA.der / S);
  const hucre = new Array(NX * NY);
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) hucre[j * NX + i] = bolge((i + 0.5) * S, (j + 0.5) * S);
  const dolu = new Uint8Array(NX * NY);
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const cx = (i + 0.5) * S, cy = (j + 0.5) * S;
    if (hucre[j * NX + i] == null) { dolu[j * NX + i] = 1; continue; }
    for (const e of ESYALAR) if (!e.gec && !e.z && cx > e.x - 0.05 && cx < e.x + e.g + 0.05 && cy > e.y - 0.05 && cy < e.y + e.d + 0.05) { dolu[j * NX + i] = 1; break; }
  }
  // Duvar kenarları: komşu iki hücrenin bölgesi farklıysa ve kapı yoksa geçilmez.
  const geçilmez = (a, b, mx, my) => a !== b && !kapidaMi(mx, my);
  const sagKapali = new Uint8Array(NX * NY), altKapali = new Uint8Array(NX * NY);
  const kenarlar = [];
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const a = hucre[j * NX + i];
    if (i + 1 < NX) {
      const b = hucre[j * NX + i + 1], mx = (i + 1) * S, my = (j + 0.5) * S;
      if (geçilmez(a, b, mx, my)) { sagKapali[j * NX + i] = 1; if (evMi(a) || evMi(b)) kenarlar.push([mx, j * S, mx, (j + 1) * S]); }
    }
    if (j + 1 < NY) {
      const b = hucre[(j + 1) * NX + i], mx = (i + 0.5) * S, my = (j + 1) * S;
      if (geçilmez(a, b, mx, my)) { altKapali[j * NX + i] = 1; if (evMi(a) || evMi(b)) kenarlar.push([i * S, my, (i + 1) * S, my]); }
    }
  }
  // dış kenarlar (evin dışarıya bakan sınırı: x=0, y=0)
  for (let j = 0; j < NY; j++) if (evMi(hucre[j * NX])) kenarlar.push([0, j * S, 0, (j + 1) * S]);
  for (let i = 0; i < NX; i++) if (evMi(hucre[i]) && !((i + 0.5) * S > DIS_KAPI[0] && (i + 0.5) * S < DIS_KAPI[2])) kenarlar.push([i * S, 0, (i + 1) * S, 0]);
  return { NX, NY, S, hucre, dolu, sagKapali, altKapali, kenarlar: birlestir(kenarlar) };
}
const EV = new Set(ODALAR.map((o) => o.id));
export const evMi = (b) => EV.has(b);

function birlestir(k) {
  // aynı doğrudaki bitişik parçaları birleştir (daha az çizim)
  const yatay = new Map(), dikey = new Map();
  for (const s of k) { const [x1, y1, x2, y2] = s; if (y1 === y2) (yatay.get(y1) ?? yatay.set(y1, []).get(y1)).push([x1, x2]); else (dikey.get(x1) ?? dikey.set(x1, []).get(x1)).push([y1, y2]); }
  const out = [];
  const bir = (m, yap) => { for (const [c, l] of m) { l.sort((a, b) => a[0] - b[0]); let [s, e] = l[0]; for (let i = 1; i < l.length; i++) { if (l[i][0] <= e + 1e-6) e = Math.max(e, l[i][1]); else { yap(c, s, e); [s, e] = l[i]; } } yap(c, s, e); } };
  bir(yatay, (y, a, b) => out.push([a, y, b, y]));
  bir(dikey, (x, a, b) => out.push([x, a, x, b]));
  return out;
}

/** 8 yönlü A* (duvar köşesinden kesmeden). */
export function yolBul(iz, [sx, sy], [hx, hy]) {
  const { NX, NY, S, dolu, sagKapali, altKapali } = iz;
  const ci = (x) => Math.max(0, Math.min(NX - 1, Math.floor(x / S))), cj = (y) => Math.max(0, Math.min(NY - 1, Math.floor(y / S)));
  const bas = cj(sy) * NX + ci(sx);
  let hedef = cj(hy) * NX + ci(hx);
  if (dolu[hedef]) hedef = enYakinBos(iz, hedef, bas);
  if (hedef < 0) return null;
  const gec = (a, di, dj) => {
    const i = a % NX, j = (a / NX) | 0, ni = i + di, nj = j + dj;
    if (ni < 0 || nj < 0 || ni >= NX || nj >= NY) return false;
    const b = nj * NX + ni;
    if (dolu[b]) return false;
    if (di && dj) return gec(a, di, 0) && gec(a, 0, dj) && gec(j * NX + ni, 0, dj) && gec(nj * NX + i, di, 0);
    if (di === 1) return !sagKapali[a];
    if (di === -1) return !sagKapali[b];
    if (dj === 1) return !altKapali[a];
    return !altKapali[b];
  };
  const g = new Float32Array(NX * NY).fill(Infinity), ata = new Int32Array(NX * NY).fill(-1), kapali = new Uint8Array(NX * NY);
  const h = (a) => { const dx = Math.abs(a % NX - hedef % NX), dy = Math.abs(((a / NX) | 0) - ((hedef / NX) | 0)); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
  const acik = [bas]; g[bas] = 0;
  const f = new Float32Array(NX * NY).fill(Infinity); f[bas] = h(bas);
  while (acik.length) {
    let bi = 0; for (let k = 1; k < acik.length; k++) if (f[acik[k]] < f[acik[bi]]) bi = k;
    const a = acik[bi]; acik[bi] = acik[acik.length - 1]; acik.pop();
    if (a === hedef) break;
    if (kapali[a]) continue; kapali[a] = 1;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      if (!gec(a, di, dj)) continue;
      const b = a + dj * NX + di, ng = g[a] + (di && dj ? 1.414 : 1);
      if (ng < g[b]) { g[b] = ng; ata[b] = a; f[b] = ng + h(b); acik.push(b); }
    }
  }
  if (ata[hedef] < 0 && hedef !== bas) return null;
  const yol = [];
  for (let a = hedef; a !== bas && a >= 0; a = ata[a]) yol.push([(a % NX + 0.5) * S, (((a / NX) | 0) + 0.5) * S]);
  yol.reverse();
  if (yol.length && !dolu[cj(hy) * NX + ci(hx)]) yol[yol.length - 1] = [hx, hy];
  return yol;
}

function enYakinBos(iz, hedef, bas) {
  const { NX, NY, dolu, hucre } = iz;
  const hi = hedef % NX, hj = (hedef / NX) | 0;
  let en = -1, ed = Infinity;
  for (let j = Math.max(0, hj - 4); j <= Math.min(NY - 1, hj + 4); j++) for (let i = Math.max(0, hi - 4); i <= Math.min(NX - 1, hi + 4); i++) {
    const a = j * NX + i; if (dolu[a] || hucre[a] == null) continue;
    const d = (i - hi) ** 2 + (j - hj) ** 2; if (d < ed) { ed = d; en = a; }
  }
  return en >= 0 ? en : bas;
}

/** Bir eylemin karakterin duracağı noktası: alanın ortası. */
export function eylemNoktasi(e) {
  const a = ALANLAR.find((z) => z.e === e);
  if (a) return [a.x + a.g / 2, a.y + a.d / 2];
  const es = ESYALAR.find((x) => x.e === e);
  return es ? [es.x + es.g / 2, es.y + es.d + 0.4] : null;
}

// Alışveriş ürün kataloğu: ~300 sık alınan ürün, renkli simgesiyle (emoji). Arama önerisi ve "Listeden seç" bunu kullanır.
// Not: Unicode 15+ emojiler (eski telefonlarda kutu çıkar) bilerek kullanılmadı.

// Satır: "Ad|simge" ya da "Ad|simge|rozet". Rozet, aynı simgeyi paylaşan ürünleri ayırır (köşede küçük ikinci simge).
const G = (grup, metin) => ({ grup, urunler: metin.trim().split('\n').map((s) => { const [ad, e, r] = s.trim().split('|'); return [ad.trim(), e.trim(), r?.trim() || null]; }) });

const HAM = [
  G('Fırın ve kahvaltı', `
    Ekmek|🍞
    Tam buğday ekmeği|🍞|🌾
    Tost ekmeği|🍞|🔥
    Brötchen|🥖|🥨
    Baget|🥖
    Simit|🥯
    Poğaça|🥐|🧀
    Kruvasan|🥐
    Lavaş|🫓
    Yufka|🫓|📃
    Pide|🫓|🧀
    Yumurta|🥚
    Zeytin|🫒
    Siyah zeytin|🫒|⚫
    Bal|🍯
    Reçel|🫙|🍓
    Nutella|🫙|🍫
    Tahin|🫙|⚪
    Pekmez|🫙|🍇
    Fıstık ezmesi|🫙|🥜
    Müsli|🥣|🌾
    Mısır gevreği|🥣|🌽
    Yulaf|🌾
    Tereyağı|🧈
    Margarin|🧈|🌻`),
  G('Peynir ve şarküteri', `
    Peynir|🧀
    Beyaz peynir|🧀|⚪
    Kaşar|🧀|🟡
    Lor|🧀|☁️
    Labne|🫙|🧀
    Krem peynir|🧀|🥄
    Hellim|🧀|🔥
    Mozzarella|🧀|🍅
    Parmesan|🧀|🍝
    Sucuk|🌭|🔥
    Salam|🥓|⭕
    Pastırma|🥓|🌶️
    Jambon|🥓|🥪
    Sosis|🌭`),
  G('Sebze', `
    Brokoli|🥦
    Karnabahar|🥦|⚪
    Domates|🍅
    Cherry domates|🍅|🤏
    Salatalık|🥒
    Maydanoz|🌿
    Dereotu|🌿|🐟
    Nane|🌿|🍃
    Fesleğen|🌿|🍅
    Roka|🥬|🍃
    Marul|🥬
    Ispanak|🥬|💪
    Lahana|🥬|🥗
    Brüksel lahanası|🥬|🤏
    Pırasa|🥬|🧅
    Kereviz|🥬|🥕
    Soğan|🧅
    Kırmızı soğan|🧅|🔴
    Taze soğan|🧅|🌱
    Sarımsak|🧄
    Patates|🥔
    Tatlı patates|🍠
    Biber|🫑
    Kapya biber|🫑|🔴
    Sivri biber|🌶️|🟢
    Acı biber|🌶️
    Havuç|🥕
    Kabak|🥒|🌼
    Patlıcan|🍆
    Mantar|🍄
    Mısır|🌽
    Bezelye|🌱|🟢
    Taze fasulye|🌱
    Bamya|🌱|⭐
    Enginar|🥬|🌸
    Zencefil|🌿|🔥
    Limon|🍋
    Avokado|🥑
    Turp|🥕|🔴
    Pancar|🍠|🟣`),
  G('Meyve', `
    Elma|🍎
    Yeşil elma|🍏
    Muz|🍌
    Portakal|🍊
    Mandalina|🍊|🤏
    Greyfurt|🍊|🔴
    Üzüm|🍇
    Çilek|🍓
    Ahududu|🍓|🔴
    Yaban mersini|🫐
    Armut|🍐
    Karpuz|🍉
    Kavun|🍈
    Kivi|🥝
    Ananas|🍍
    Mango|🥭
    Şeftali|🍑
    Kayısı|🍑|🟠
    Erik|🍑|🟣
    Kiraz|🍒
    Vişne|🍒|🟤
    Nar|🍎|💎
    İncir|🍈|🟣
    Hurma|🌴
    Hindistan cevizi|🥥
    Misket limonu|🍋|🟢`),
  G('Süt ürünleri', `
    Süt|🥛
    Laktozsuz süt|🥛|🚫
    Yulaf sütü|🥛|🌾
    Badem sütü|🥛|🌰
    Yoğurt|🥣
    Süzme yoğurt|🥣|🧀
    Meyveli yoğurt|🥣|🍓
    Quark|🥣|⚪
    Ayran|🥛|🧂
    Kefir|🥛|🫧
    Krema|🍶
    Kaymak|🍶|🍯
    Puding|🍮
    Sütlaç|🍮|🍚`),
  G('Et, tavuk ve balık', `
    Kırmızı et|🥩
    Kıyma|🥩|🌀
    Kuşbaşı|🥩|🎲
    Biftek|🥩|🔥
    Antrikot|🥩|⭐
    Pirzola|🍖
    Köfte|🧆
    Döner eti|🥙
    Tavuk|🍗
    Tavuk göğsü|🍗|💪
    Tavuk but|🍗|🦵
    Tavuk kanat|🍗|🕊️
    Bütün tavuk|🐔
    Hindi|🦃
    Balık|🐟
    Somon|🐟|🟠
    Levrek|🐟|⚪
    Çipura|🐟|🟡
    Ton balığı|🐟|🔵
    Karides|🦐
    Kalamar|🦑
    Midye|🦪`),
  G('Kuru gıda ve bakliyat', `
    Makarna|🍝
    Spagetti|🍝|🍅
    Lazanya|🍝|🧀
    Erişte|🍜
    Noodle|🍜|🥢
    Pirinç|🍚
    Basmati pirinç|🍚|✨
    Bulgur|🌾|🍚
    Kuskus|🌾|🔸
    Un|🌾|🛍️
    Mısır unu|🌽|🌾
    İrmik|🌾|🍮
    Nişasta|🌾|🥄
    Şeker|🍬
    Esmer şeker|🍬|🟤
    Tuz|🧂
    Karabiber|🧂|⚫
    Pul biber|🌶️|🧂
    Kimyon|🧂|🟤
    Kekik|🌿|🍕
    Baharat|🧂|🌶️
    Mercimek|🫘|🟢
    Kırmızı mercimek|🫘|🔴
    Nohut|🫘|🟡
    Kuru fasulye|🫘
    Barbunya|🫘|🟣
    Salça|🥫|🔴
    Domates salçası|🥫|🍅
    Biber salçası|🥫|🌶️
    Konserve|🥫
    Mısır konservesi|🥫|🌽
    Ton balığı konservesi|🥫|🐟
    Turşu|🫙|🥒
    Kabartma tozu|🧁
    Maya|🍞|🫧
    Vanilin|🧁|🌼`),
  G('Yağ ve sos', `
    Yağ|🫗
    Zeytinyağı|🫗|🫒
    Ayçiçek yağı|🫗|🌻
    Sirke|🍶|🍎
    Ketçap|🫙|🍅
    Mayonez|🫙|🥚
    Hardal|🫙|🟡
    Soya sosu|🍶|🍣
    Nar ekşisi|🍶|💎
    Pesto|🫙|🌿
    Barbekü sosu|🍶|🔥
    Acı sos|🌶️|🍶`),
  G('Kahve ve çay', `
    Kahve|☕
    Türk kahvesi|☕|🇹🇷
    Filtre kahve|☕|💧
    Kahve kapsülü|☕|💊
    Espresso|☕|⚡
    Çay|🍵
    Yeşil çay|🍵|🟢
    Bitki çayı|🍵|🌿
    Kakao|🍫|🥄
    Sıcak çikolata|☕|🍫`),
  G('İçecek', `
    İçecek|🍹
    Su|💧
    Maden suyu|💧|🫧
    Soda|🫧
    Meyve suyu|🧃
    Portakal suyu|🧃|🍊
    Kola|🥤
    Gazoz|🥤|🫧
    Ice tea|🧋
    Enerji içeceği|⚡
    Limonata|🥤|🍋
    Şalgam|🥤|🟣
    Bira|🍺
    Şarap|🍷
    Rakı|🥃|🦁
    Viski|🥃`),
  G('Atıştırmalık ve tatlı', `
    Kuru yemiş|🥜|🌰
    Fındık|🌰
    Ceviz|🌰|🧠
    Badem|🌰|🔸
    Fıstık|🥜
    Kaju|🥜|🌙
    Ay çekirdeği|🌻
    Kuru üzüm|🍇|☀️
    Kuru kayısı|🍑|☀️
    Cips|🥔|🛍️
    Kraker|🍘
    Bisküvi|🍪
    Kurabiye|🍪|⭐
    Gofret|🧇
    Çikolata|🍫
    Bitter çikolata|🍫|⚫
    Şekerleme|🍭
    Sakız|🍬|🫧
    Lokum|🍬|🌹
    Helva|🍯|🥜
    Kek|🍰
    Pasta|🎂
    Dondurma|🍦
    Patlamış mısır|🍿`),
  G('Dondurulmuş ve hazır', `
    Pommes|🍟
    Buz|🧊
    Pizza|🍕
    Dondurulmuş sebze|🥦|❄️
    Mantı|🥟
    Börek|🥧
    Lahmacun|🫓|🥩
    Hamburger köftesi|🍔
    Nugget|🍗|❄️
    Hazır çorba|🍲
    Sandviç|🥪
    Sushi|🍣`),
  G('Ev ve temizlik', `
    Tuvalet kâğıdı|🧻
    Havlu peçete|🧻|🍽️
    Kâğıt mendil|🤧
    Peçete|🧻|🍴
    Çöp poşeti|🗑️
    Buzdolabı poşeti|🛍️
    Alüminyum folyo|🥈
    Streç film|🎞️
    Pişirme kâğıdı|🧻|🔥
    Bulaşık tableti|🍽️|💊
    Bulaşık deterjanı|🍽️|🧴
    Bulaşık makinesi tuzu|🧂|🍽️
    Parlatıcı|✨
    Makine temizleyici|🫧|⚙️
    Çamaşır deterjanı|🧺
    Sıvı deterjan|🧺|💧
    Yumuşatıcı|🧴|🧸
    Leke çıkarıcı|🧴|🎯
    Çamaşır suyu|🧴|⚠️
    Yüzey temizleyici|🧽|✨
    Cam temizleyici|🪟
    Banyo temizleyici|🛁
    Tuvalet temizleyici|🚽
    Kireç çözücü|🧴|🪨
    Sünger|🧽
    Temizlik bezi|🧽|🟦
    Eldiven|🧤
    Süpürge torbası|🧹
    Pil|🔋
    Ampul|💡
    Mum|🕯️
    Kibrit|🔥
    Oda kokusu|🌸|💨`),
  G('Kişisel bakım', `
    Diş macunu|🪥|🦷
    Diş fırçası|🪥
    Diş ipi|🦷|🧵
    Ağız gargarası|🧴|👄
    Şampuan|🧴|💇
    Saç kremi|🧴|💆
    Saç jölesi|🧴|💈
    Sabun|🧼
    Sıvı sabun|🧼|💧
    Duş jeli|🚿
    Deodorant|🧴|💨
    Parfüm|🌸|✨
    Tıraş bıçağı|🪒
    Tıraş köpüğü|🪒|🫧
    Krem|🧴
    El kremi|🧴|✋
    Nemlendirici|🧴|💧
    Güneş kremi|☀️
    Pamuk|☁️
    Kulak çubuğu|👂
    Hijyenik ped|🩸
    Yara bandı|🩹
    Ağrı kesici|💊|🤕
    Vitamin|💊|🍊
    İlaç|💊
    Tırnak makası|✂️`),
  G('Çocuk', `
    Bebek bezi|👶
    Islak mendil|🧻|💧
    Bebek maması|🍼|🥣
    Bebek sütü|🍼|🥛
    Biberon|🍼
    Emzik|👶|⭕
    Meyve püresi|🍼|🍎
    Bebek şampuanı|🧴|👶
    Pişik kremi|🧴|🍑
    Çocuk bisküvisi|🍪|👶
    Oyuncak|🧸
    Boya kalemi|🖍️`),
  G('Evcil hayvan', `
    Kedi maması|🐱
    Köpek maması|🐶
    Kedi kumu|🐱|🪣
    Ödül maması|🦴`),
  G('Diğer', `
    Çiçek|💐
    Hediye|🎁
    Kalem|✏️
    Defter|📒
    Zarf|✉️
    Koli bandı|📦
    Pfand şişe|🍾`),
];

// Aynı ad iki grupta geçerse ilki kalır.
const gorulen = new Set();
export const URUN_KATALOG = HAM.map((g) => ({ grup: g.grup, urunler: g.urunler.filter(([ad]) => { const k = ad.toLocaleLowerCase('tr-TR'); if (gorulen.has(k)) return false; gorulen.add(k); return true; }) }));
export const KATALOG_URUNLER = URUN_KATALOG.flatMap((g) => g.urunler);

/** Arama için sadeleştirme: küçük harf, Türkçe harfler düz (ekmek = EKMEK, sut = süt). */
export const sade = (s) => String(s ?? '').toLocaleLowerCase('tr-TR').trim()
  .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u');

const GRUP = new Map(URUN_KATALOG.flatMap((g) => g.urunler.map(([ad]) => [sade(ad), g.grup])));
/** Ürünün katalog grubu (raf adı); tam ad, yoksa son kelime. */
export const katalogGrup = (ad) => { const s = sade(ad); return GRUP.get(s) ?? GRUP.get(s.split(/\s+/).pop()) ?? null; };
const EMOJI = new Map(KATALOG_URUNLER.map(([ad, e]) => [sade(ad), e]));
const ROZET = new Map(KATALOG_URUNLER.filter(([, , r]) => r).map(([ad, , r]) => [sade(ad), r]));
/** Katalogdaki tam ad için köşe rozeti (yoksa null). */
export const katalogRozet = (ad) => ROZET.get(sade(ad)) ?? null;
const TEK_KELIME = KATALOG_URUNLER.filter(([ad]) => !ad.includes(' ')).map(([ad, e]) => [sade(ad), e]);

/** Ürün adından renkli simge: tam ad → katalog; değilse addaki bir kelime (örn. "Tam yağlı süt" → süt); yoksa null. */
export function katalogEmoji(ad) {
  const s = sade(ad);
  if (!s) return null;
  if (EMOJI.has(s)) return EMOJI.get(s);
  // Türkçede asıl ürün son kelimedir: "Tam yağlı süt" → süt; "Kahve makinesi yağ çözme tableti" → tablet (bilinmiyor).
  const son = s.split(/\s+/).pop();
  if (EMOJI.has(son)) return EMOJI.get(son);
  for (const [k, e] of TEK_KELIME) if (k.length >= 4 && son.startsWith(k)) return e;
  return null;
}

/**
 * Arama önerileri. adaylar: [{ad, emoji, sayi}] (katalog + kullanıcının ürünleri). Sıra: baştan eşleşen,
 * sonra kelime başı, sonra içinde; eşitlikte sık eklenen önce.
 */
export function oneriler(sorgu, adaylar, adet = 8) {
  const q = sade(sorgu);
  if (!q) return [];
  const puan = (ad) => {
    const s = sade(ad);
    if (s === q) return 0;
    if (s.startsWith(q)) return 1;
    if (s.split(/\s+/).some((w) => w.startsWith(q))) return 2;
    if (q.length >= 3 && s.includes(q)) return 3;
    return 9;
  };
  return adaylar.map((a) => ({ ...a, p: puan(a.ad) })).filter((a) => a.p < 9)
    .sort((a, b) => a.p - b.p || (b.sayi ?? 0) - (a.sayi ?? 0) || a.ad.length - b.ad.length || a.ad.localeCompare(b.ad, 'tr'))
    .slice(0, adet);
}

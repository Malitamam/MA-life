// Yedek (haftalık iç yedek, paylaş, dışa aktar, geri yükle) ve sabah özeti (MaliApp.kt, Bildirim.kt).
import { M, Ayar } from './ui/durum.js';
import { Mantik, AjandaMantik, StokMantik, BildirimMantik } from './mantik.js';
import { gunInput, bugunGun } from './tarih.js';

const HAFTA_MS = 7 * 24 * 3600 * 1000;

export const yedekJson = () => JSON.stringify(M.depo.paketle(Date.now()), null, 2);

/** İç yedek yazar (telefonda, uygulamanın içinde), son 8 yedeği tutar. */
export async function yedekAl() {
  const json = yedekJson();
  const ad = `mali-yedek-${gunInput(bugunGun())}.json`;
  await M.db.icYedekYaz(ad, json);
  const adlar = ((await M.db.icYedekler()) ?? []).filter((x) => String(x).startsWith('mali-yedek-')).sort().reverse();
  for (const x of adlar.slice(8)) await M.db.icYedekSil(x);
  Ayar.sonYedek = Date.now();
  return { ad, json };
}

export async function haftalikYedekGerekirse() {
  if (Date.now() - Ayar.sonYedek > HAFTA_MS) { try { await yedekAl(); } catch (e) { console.error(e); } }
}

export function indir(ad, metin, tur = 'application/json') {
  const url = URL.createObjectURL(new Blob([metin], { type: tur }));
  const a = document.createElement('a');
  a.href = url; a.download = ad; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** Yedeği paylaşım menüsüyle gönderir (Drive'a kaydet); olmazsa dosyayı indirir. */
export async function yedekPaylas() {
  const { ad, json } = await yedekAl();
  const dosya = new File([json], ad, { type: 'application/json' });
  if (navigator.canShare?.({ files: [dosya] })) {
    try { await navigator.share({ files: [dosya], title: 'MALI yedeği' }); return 'paylasildi'; }
    catch (e) { if (e?.name === 'AbortError') return 'iptal'; }
  }
  indir(ad, json);
  return 'indirildi';
}

/** Geri yükleme: önce iç yedek alınır, sonra mevcut veri silinip dosyadaki yüklenir. */
export async function geriYukle(metin) {
  const p = JSON.parse(metin);
  await yedekAl();
  M.depo.yukle(p);
  await M.db.bitir();
}

// ---------------- Sabah özeti ----------------
export function sabahSatirlari(bugun = bugunGun()) {
  const isler = M.depo.isDurumlari(bugun);
  const vakti = isler.filter((d) => d.hatirlatici && Mantik.durum(d.sonGun, d.periyotGun, bugun, d.ertelenenGun) === 'VAKTI_GELDI');
  const ajanda = AjandaMantik.sabahSatirlari(M.depo.ajanda(), M.depo.tamamSet(), bugun);
  const takviye = M.db.hepsi('takviyeler').filter((t) => StokMantik.takviyeAzMi(t, bugun))
    .map((t) => `${t.ad} azalıyor (${Math.floor(StokMantik.takviyeStok(t, bugun))} kaldı)`);
  const say = M.depo.urunler().filter((u) => StokMantik.sayimVakti(u, bugun));
  const sayim = say.length ? [`Stoğu say: ${say.slice(0, 3).map((u) => u.ad).join(', ')}${say.length > 3 ? ` +${say.length - 3}` : ''}`] : [];
  return [...vakti.map((d) => d.ad), ...ajanda, ...takviye, ...sayim];
}

export const bildirimVar = () => typeof Notification !== 'undefined';
export const bildirimIzni = () => (bildirimVar() ? Notification.permission : 'denied');

export async function bildirimGoster(baslik, govde, etiket = 'mali') {
  if (!bildirimVar() || Notification.permission !== 'granted') return false;
  try {
    const kayit = await navigator.serviceWorker?.getRegistration?.();
    const s = { body: govde, icon: 'ikon/192.png', badge: 'ikon/192.png', tag: etiket, data: { url: './#/pano' } };
    if (kayit) await kayit.showNotification(baslik, s); else new Notification(baslik, s);
    return true;
  } catch { return false; }
}

/**
 * Web'de arka planda zamanlı bildirim yok: uygulama açıldığında (ya da açıkken saat gelince)
 * o günün sabah saati geçmişse ve sessiz saatte değilse özet bir kez gösterilir.
 */
export function sabahOzetiGerekirse(simdi = new Date()) {
  const bugun = bugunGun();
  const hg = ((simdi.getDay() + 6) % 7) + 1;
  const saat = Ayar.sabahSaati(hg);
  if (saat == null) return null;
  const dk = simdi.getHours() * 60 + simdi.getMinutes();
  if (dk < saat) return null;
  if (M.db.ayarAl('sabah_gosterildi', -1) === bugun) return null;
  if (BildirimMantik.sessizMi(dk, Ayar.sessizBas, Ayar.sessizSon)) return null;
  const satirlar = sabahSatirlari(bugun);
  M.db.ayarYaz('sabah_gosterildi', bugun);
  if (!satirlar.length) return null;
  const baslik = `Günaydın · bugün ${satirlar.length} şey var`;
  bildirimGoster(baslik, satirlar.slice(0, 7).join('\n'), 'sabah');
  return { baslik, satirlar };
}

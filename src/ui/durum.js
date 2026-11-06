// Uygulama durumu: veri, ayarlar, gezinme, "Geri al" çubuğu. (Android AnaVM + Ayarlar)
import { useState, useEffect } from '../../vendor/preact-htm.js';
import { bugunGun } from '../tarih.js';

export const M = { db: null, depo: null };

const VARSAYILAN_HIZLI = ['Ekmek', 'Brokoli', 'Domates', 'Salatalık', 'Maydanoz', 'Soğan', 'Patates', 'Süt', 'Peynir', 'Kahve',
  'Makarna', 'Tereyağı', 'İçecek', 'Su', 'Kırmızı et', 'Tavuk', 'Balık', 'Yoğurt', 'Yağ', 'Kuru yemiş', 'Müsli', 'Pommes', 'Buz'];

/** Ayarlar (SharedPreferences karşılığı; IndexedDB'de). */
export const Ayar = {
  al: (k, v) => M.db.ayarAl(k, v),
  yaz: (k, v) => M.db.ayarYaz(k, v),
  sabahSaati: (g) => { const v = M.db.ayarAl('sabah_' + g, 420); return v >= 0 ? v : null; },
  sabahSaatiYaz: (g, dk) => M.db.ayarYaz('sabah_' + g, dk ?? -1),
  get sessizBas() { return M.db.ayarAl('sessiz_bas', 22 * 60); }, set sessizBas(v) { M.db.ayarYaz('sessiz_bas', v); },
  get sessizSon() { return M.db.ayarAl('sessiz_son', 7 * 60); }, set sessizSon(v) { M.db.ayarYaz('sessiz_son', v); },
  get sonYedek() { return M.db.ayarAl('son_yedek', 0); }, set sonYedek(v) { M.db.ayarYaz('son_yedek', v); },
  get panoDuzeni() { return M.db.ayarAl('pano_duzen', ''); }, set panoDuzeni(v) { M.db.ayarYaz('pano_duzen', v); },
  get butonDuzeni() { return M.db.ayarAl('buton_duzen', ''); }, set butonDuzeni(v) { M.db.ayarYaz('buton_duzen', v); },
  izinHakki: (yil) => M.db.ayarAl('izin_' + yil, 42),
  izinHakkiYaz: (yil, g) => M.db.ayarYaz('izin_' + yil, g),
  get tema() { return M.db.ayarAl('tema', 0); }, set tema(v) { M.db.ayarYaz('tema', v); temaUygula(); },
  get hizliSecimler() { const s = M.db.ayarAl('hizli_secim', null); return s == null ? VARSAYILAN_HIZLI : s.split('|').filter((x) => x.trim()); },
  set hizliSecimler(v) { M.db.ayarYaz('hizli_secim', [...new Set(v.map((x) => x.trim()).filter((x) => x))].join('|')); },
};

export function temaUygula() {
  const t = M.db ? Ayar.tema : 0;
  const el = document.documentElement;
  if (t === 1) el.dataset.theme = 'light'; else if (t === 2) el.dataset.theme = 'dark'; else delete el.dataset.theme;
  const koyu = koyuMu();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', koyu ? '#22232A' : '#DDE7E0');
}
export function koyuMu() {
  const t = M.db ? Ayar.tema : 0;
  if (t === 1) return false;
  if (t === 2) return true;
  return !matchMedia('(prefers-color-scheme: light)').matches;
}

/** Veri değişince yeniden çizer; depo ve bugünü verir. */
export function useVeri() {
  const [, setS] = useState(0);
  useEffect(() => M.db.dinle((s) => setS(s)), []);
  return M.depo;
}

let bugunDinleyici = new Set();
let _bugun = bugunGun();
export function gunuYenile() {
  const b = bugunGun();
  if (b !== _bugun) { _bugun = b; for (const f of bugunDinleyici) f(b); }
}
export function useBugun() {
  const [b, setB] = useState(_bugun);
  useEffect(() => { bugunDinleyici.add(setB); setB(_bugun); return () => bugunDinleyici.delete(setB); }, []);
  return b;
}
export const bugunNe = () => _bugun;

// ---- "Geri al" çubuğu (Snackbar) ----
let sonDinleyici = null;
export function sonIslem(metin, kayitId = -1) { sonDinleyici?.(metin == null ? null : { metin, kayitId, z: Date.now() }); }
export function useSonIslem() {
  const [s, setS] = useState(null);
  useEffect(() => { sonDinleyici = setS; return () => { sonDinleyici = null; }; }, []);
  return [s, setS];
}

// ---- Gezinme (#/rota) ----
export const SEKMELER = ['pano', 'takip', 'sayac', 'ajanda', 'alim', 'stok', 'takviye', 'notlar', 'gunluk'];
export function rotaAl() { return (location.hash.replace(/^#\/?/, '') || 'pano'); }
const haber = () => dispatchEvent(new Event('rota'));
export function git(rota) {
  const simdi = rotaAl();
  if (rota === simdi) return;
  const sekmeye = SEKMELER.includes(rota);
  const sekmede = SEKMELER.includes(simdi) && simdi !== 'pano';
  // sekmeler arasında geçmiş birikmesin: Pano'nun üstünde tek sekme durur, geri tuşu Pano'ya döner
  if (sekmeye && sekmede) {
    if (rota === 'pano' && history.state?.ustPano) { history.back(); return; }
    history.replaceState({ ustPano: history.state?.ustPano ?? false }, '', '#/' + rota);
  } else history.pushState({ ustPano: simdi === 'pano' && sekmeye }, '', '#/' + rota);
  haber();
}
export function geri() { if (history.state && history.length > 1) history.back(); else { history.replaceState(null, '', '#/pano'); haber(); } }
export function useRota() {
  const [r, setR] = useState(rotaAl());
  useEffect(() => { const f = () => setR(rotaAl()); addEventListener('hashchange', f); addEventListener('popstate', f); addEventListener('rota', f); return () => { removeEventListener('hashchange', f); removeEventListener('popstate', f); removeEventListener('rota', f); }; }, []);
  return r;
}

// ---- Uygulama içi yeni kayıt pencereleri (yeni iş, ajanda taslağı) ----
let pencereF = null;
export function pencereAc(p) { pencereF?.(p); }
export function usePencere() {
  const [p, setP] = useState(null);
  useEffect(() => { pencereF = setP; return () => { pencereF = null; }; }, []);
  return [p, setP];
}

// Sesli not: bas-başlat, tekrar bas-durdur. Ses her durumda saklanır (IndexedDB);
// tarayıcı konuşma tanıma verirse metin nota yazılır, yoksa "Sesli not (m:ss)" (SesKayit.kt).
import { useState, useEffect } from '../../vendor/preact-htm.js';
import { M } from './durum.js';
import { bildir, duzelt } from './ortak.js';

const durum = { kayitta: false, baslangic: 0, kayit: null, parcalar: [], tanima: null, metin: [], akim: null };
const dinleyiciler = new Set();
const haber = () => { for (const f of dinleyiciler) f({ kayitta: durum.kayitta, baslangic: durum.baslangic }); };

export function useKayitta() {
  const [s, setS] = useState({ kayitta: durum.kayitta, baslangic: durum.baslangic });
  useEffect(() => { dinleyiciler.add(setS); return () => dinleyiciler.delete(setS); }, []);
  return s;
}

export async function sesToggle() {
  if (durum.kayitta) { bitir(); return; }
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { bildir('Bu tarayıcıda ses kaydı yok'); return; }
  let akim;
  try { akim = await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch { bildir('Mikrofon izni olmadan kayıt yapılamaz'); return; }
  const tur = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg'].find((t) => MediaRecorder.isTypeSupported?.(t));
  const kayit = new MediaRecorder(akim, tur ? { mimeType: tur } : undefined);
  durum.akim = akim; durum.kayit = kayit; durum.parcalar = []; durum.metin = [];
  kayit.ondataavailable = (e) => { if (e.data?.size) durum.parcalar.push(e.data); };
  kayit.start(1000);
  durum.kayitta = true; durum.baslangic = Date.now();
  // Konuşma tanıma: aynı anda dener; desteklenmez ya da mikrofonu paylaşamazsa sessizce vazgeçer.
  const SR = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
  if (SR) {
    try {
      const r = new SR();
      r.lang = 'tr-TR'; r.continuous = true; r.interimResults = false;
      r.onresult = (e) => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) durum.metin.push(e.results[i][0].transcript); };
      r.onerror = () => {};
      r.onend = () => { if (durum.kayitta && durum.tanima === r) { try { r.start(); } catch { durum.tanima = null; } } };
      r.start();
      durum.tanima = r;
    } catch { durum.tanima = null; }
  }
  haber();
}

function bitir() {
  const kayit = durum.kayit, tanima = durum.tanima;
  const sure = Math.round((Date.now() - durum.baslangic) / 1000);
  durum.kayitta = false; durum.tanima = null; haber();
  const tanimaBitti = new Promise((coz) => {
    if (!tanima) { coz(); return; }
    const z = setTimeout(coz, 2500);
    tanima.onend = () => { clearTimeout(z); coz(); };
    try { tanima.stop(); } catch { clearTimeout(z); coz(); }
  });
  const sesBitti = new Promise((coz) => { kayit.onstop = coz; try { kayit.stop(); } catch { coz(); } });
  Promise.all([sesBitti, tanimaBitti]).then(async () => {
    durum.akim?.getTracks().forEach((t) => t.stop());
    const blob = new Blob(durum.parcalar, { type: kayit.mimeType || 'audio/webm' });
    const ad = `not-${Date.now()}`;
    try { await M.db.sesYaz(ad, blob); } catch { /* ses saklanamadıysa yalnız metin kalır */ }
    const m = durum.metin.join(' ').trim();
    M.db.ekle('notlar', { metin: m ? duzelt(m) : `Sesli not (${Math.floor(sure / 60)}:${String(sure % 60).padStart(2, '0')})`, sesYolu: ad, olusturma: Date.now(), islendi: false });
    bildir("Kaydedildi · Notlar'da İşlenmemiş");
  });
}

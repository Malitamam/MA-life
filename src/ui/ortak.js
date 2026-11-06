// Ortak bileşenler: kil kart, tik, çip, segment, dialog, anahtar, sesle yaz… (Android ui/ortak).
import { html, useState, useEffect, useRef } from '../../vendor/preact-htm.js';
import { IKON, ikonAdi } from '../ikonlar.js';

export const RENK = { mercan: 'var(--mercan)', sari: 'var(--sari)', adacayi: 'var(--adacayi)', lavanta: 'var(--lavanta)', murekkep: 'var(--murekkep)' };
export const vurgu = (n) => [RENK.mercan, RENK.sari, RENK.adacayi, RENK.lavanta][n] ?? RENK.lavanta;
export const saydam = (renk, yuzde) => `color-mix(in srgb, ${renk} ${yuzde}%, transparent)`;

export function Ikon({ ad, boy = 20, renk, stil }) {
  const i = IKON[ad] ?? IKON[ikonAdi(ad)];
  return html`<svg class="ik" width=${boy} height=${boy} viewBox="0 0 ${i.vb} ${i.vb}" style=${{ color: renk, ...stil }} aria-hidden="true">
    ${i.y.map((d) => html`<path d=${d} />`)}</svg>`;
}

export function Kart({ dikey = 8, yatay = 12, stil, sinif = '', children, ...p }) {
  return html`<div class=${'kart ' + sinif} style=${{ padding: `${dikey}px ${yatay}px`, ...stil }} ...${p}>${children}</div>`;
}

export function TikButon({ renk, dolu, aciklama, onClick }) {
  return html`<button class=${'tikbtn' + (dolu ? ' dolu' : '')} style=${{ color: renk }} aria-label=${aciklama} onClick=${(e) => { e.stopPropagation(); onClick(); }}>
    <span>${dolu && html`<${Ikon} ad="tik" boy=${15} />`}</span></button>`;
}

export function Cip({ metin, secili, renk = RENK.adacayi, onClick, stil }) {
  return html`<button class=${'cip' + (secili ? ' secili' : '')} style=${{ background: secili ? renk : undefined, ...stil }} onClick=${onClick}>${metin}</button>`;
}

export function Segment({ secenekler, secili, onSec }) {
  return html`<div class="segment">${secenekler.map((s, i) => html`<button class=${i === secili ? 'secili' : ''} onClick=${() => onSec(i)}>${s}</button>`)}</div>`;
}

export function YuvarlakButon({ ikon, aciklama, arka, onClick, boy = 18 }) {
  return html`<button class=${'yuvarlak' + (arka ? ' vurgulu' : '')} style=${{ background: arka }} aria-label=${aciklama} title=${aciklama} onClick=${onClick}>
    <${Ikon} ad=${ikon} boy=${boy} /></button>`;
}

export function IkonButon({ ikon, aciklama, onClick, renk, boy = 16, disabled }) {
  return html`<button class="ikonbtn" aria-label=${aciklama} disabled=${disabled} onClick=${onClick} style=${{ color: renk ?? 'var(--yazi)', opacity: disabled ? 0.4 : 1 }}>
    <${Ikon} ad=${ikon} boy=${boy} /></button>`;
}

export function MetinButon({ children, onClick, renk, disabled, stil }) {
  return html`<button class="metinbtn" disabled=${disabled} style=${{ color: renk, ...stil }} onClick=${onClick}>${children}</button>`;
}

export function Anahtar({ acik, onDegis, etiket }) {
  return html`<label class="anahtar"><input type="checkbox" role="switch" aria-label=${etiket} checked=${acik} onChange=${(e) => onDegis(e.target.checked)} /><i></i></label>`;
}

export function AnahtarSatiri({ metin, acik, onDegis, kucuk }) {
  return html`<div class="satir" style=${{ minHeight: '44px' }}><span class=${'dolu ' + (kucuk ? 'bk' : 'bm')}>${metin}</span><${Anahtar} acik=${acik} onDegis=${onDegis} etiket=${metin} /></div>`;
}

export function MiniRozet({ metin, stil }) { return html`<span class="rozet" style=${stil}>${metin}</span>`; }

/** Basit dialog (Material AlertDialog karşılığı). butonlar: [{metin, onClick, renk, disabled}] sağdan sola gibi dizilir. */
export function Dialog({ baslik, onKapat, butonlar = [], children }) {
  useEffect(() => {
    const f = (e) => { if (e.key === 'Escape') onKapat?.(); };
    addEventListener('keydown', f);
    return () => removeEventListener('keydown', f);
  }, [onKapat]);
  return html`<div class="ortu" onClick=${(e) => { if (e.target === e.currentTarget) onKapat?.(); }}>
    <div class="dialog" role="dialog" aria-modal="true">
      ${baslik && html`<h2>${baslik}</h2>`}
      <div class="govde">${children}</div>
      <div class="butonlar">${butonlar.filter(Boolean).map((b) => html`<${MetinButon} renk=${b.renk} disabled=${b.disabled} onClick=${b.onClick}>${b.metin}</${MetinButon}>`)}</div>
    </div></div>`;
}

/** Uzun bas: 500 ms. Kısa dokunuş onTik'e gider. */
export function uzunBas(onUzun, onTik) {
  let zaman = null, oldu = false, x = 0, y = 0;
  const iptal = () => { clearTimeout(zaman); zaman = null; };
  return {
    onPointerDown: (e) => { oldu = false; x = e.clientX; y = e.clientY; iptal(); zaman = setTimeout(() => { oldu = true; navigator.vibrate?.(20); onUzun(); }, 500); },
    onPointerUp: iptal,
    onPointerLeave: iptal,
    onPointerCancel: iptal,
    onPointerMove: (e) => { if (Math.abs(e.clientX - x) > 10 || Math.abs(e.clientY - y) > 10) iptal(); },
    onContextMenu: (e) => e.preventDefault(),
    onClick: (e) => { if (oldu) { e.preventDefault(); oldu = false; return; } onTik?.(e); },
  };
}

/** F27: Türkçe-Almanca karışık konuşmada sık yanlış anlaşılan sözcükler. */
const SOZLUK = [
  ['rat hausa', "Rathaus'a"], ['rathausa', "Rathaus'a"], ['rat haus', 'Rathaus'], ['kita', 'Kita'], ['kitaya', "Kita'ya"],
  ['pfandı', "Pfand'ı"], ['fant', 'Pfand'], ['dahau', 'Dachau'], ['termin', 'Termin'], ['brita', 'Brita'],
];
export function duzelt(s) {
  let t = s;
  for (const [y, d] of SOZLUK) t = t.replace(new RegExp(`(?<!\\p{L})${y.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!\\p{L})`, 'giu'), d);
  return t.charAt(0).toLocaleUpperCase('tr-TR') + t.slice(1);
}

export const konusmaVar = () => !!(globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition);

/** Yazı alanının yanındaki mikrofon: konuşma tanıma (tr-TR). */
export function SesleYaz({ onMetin }) {
  const [dinliyor, setDinliyor] = useState(false);
  const ref = useRef(null);
  const bas = () => {
    const SR = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
    if (!SR) { bildir('Bu tarayıcıda konuşma tanıma bulunamadı'); return; }
    if (dinliyor) { ref.current?.stop(); return; }
    const r = new SR();
    r.lang = 'tr-TR'; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e) => { const m = e.results?.[0]?.[0]?.transcript; if (m) onMetin(duzelt(m)); };
    r.onerror = (e) => { if (e.error === 'not-allowed') bildir('Mikrofon izni verilmedi'); };
    r.onend = () => setDinliyor(false);
    ref.current = r;
    try { r.start(); setDinliyor(true); } catch { setDinliyor(false); }
  };
  return html`<button class="ikonbtn" aria-label="Sesle yaz" onClick=${bas} style=${{ color: dinliyor ? 'var(--mercan)' : 'var(--yazi)' }}>
    <${Ikon} ad=${dinliyor ? 'durdur' : 'mikrofon'} boy=${20} /></button>`;
}

// ---- Kısa bildirim (Toast) ----
let toastF = null;
export function bildir(metin) { toastF?.(metin); }
export function Toast() {
  const [m, setM] = useState(null);
  useEffect(() => { toastF = (x) => { setM(x); clearTimeout(toastF.z); toastF.z = setTimeout(() => setM(null), 2600); }; return () => { toastF = null; }; }, []);
  return m && html`<div class="snack" style=${{ bottom: 'auto', top: '12px', justifyContent: 'center', paddingRight: '16px' }}>${m}</div>`;
}

/** Sayı girişi: rakam ve virgül. */
export const sadeceSayi = (s, ondalik = true) => s.replace(ondalik ? /[^0-9.,]/g : /[^0-9]/g, '');

export function Girdi({ deger, onDeger, ipucu, etiket, tek = true, tur = 'text', stil, otomatik, ...p }) {
  const ref = useRef(null);
  useEffect(() => { if (otomatik) setTimeout(() => ref.current?.focus(), 50); }, []);
  const el = tek
    ? html`<input ref=${ref} class="girdi" type=${tur} value=${deger} placeholder=${ipucu} onInput=${(e) => onDeger(e.target.value)} style=${stil} ...${p} />`
    : html`<textarea ref=${ref} class="girdi" value=${deger} placeholder=${ipucu} onInput=${(e) => onDeger(e.target.value)} style=${stil} ...${p}></textarea>`;
  return etiket ? html`<label class="etiketli"><span>${etiket}</span>${el}</label>` : el;
}

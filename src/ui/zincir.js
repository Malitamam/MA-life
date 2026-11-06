// Zincir: halkalar, panodaki satır, detay, kurma penceresi (Zincir.kt).
import { html, useState } from '../../vendor/preact-htm.js';
import { M, useVeri, useBugun, geri } from './durum.js';
import { Ikon, Kart, Cip, YuvarlakButon, MetinButon, Dialog, Girdi, vurgu, RENK } from './ortak.js';
import { Mantik } from '../mantik.js';
import { tarih } from '../tarih.js';
import { SECILEBILIR } from '../ikonlar.js';

export function zincirIsaretleri(id) {
  const m = new Map();
  for (const x of M.db.hepsi('isaretler')) if (x.zincirId === id) m.set(x.gun, x.adet);
  return m;
}

function Halka({ g, adet, hedef, renk, bugun, boy }) {
  const sw = 2, r = boy / 2 - sw / 2, c = boy / 2;
  let ic = null;
  if (g == null) ic = null;
  else if (adet >= hedef) ic = html`<circle cx=${c} cy=${c} r=${boy / 2} fill=${renk} stroke="none" />`;
  else if (adet > 0) {
    const ri = (boy - sw * 3) / 2, a = 2 * Math.PI * adet / hedef;
    const x = c + ri * Math.sin(a), y = c - ri * Math.cos(a);
    ic = html`<circle cx=${c} cy=${c} r=${r} fill="none" stroke=${renk} stroke-width=${sw} />
      <path d=${`M${c},${c} L${c},${c - ri} A${ri},${ri} 0 ${a > Math.PI ? 1 : 0} 1 ${x},${y} Z`} fill=${renk} stroke="none" />`;
  } else if (g === bugun) ic = html`<circle cx=${c} cy=${c} r=${r} fill="none" stroke=${renk} stroke-width=${sw} />`;
  else ic = html`<circle cx=${c} cy=${c} r=${r} fill="none" stroke="var(--cizgi)" stroke-width=${sw} stroke-dasharray="2 2" />`;
  return html`<svg width=${boy} height=${boy} style="display:block;overflow:visible">${ic}</svg>`;
}

/** Halkalar birbirine bağlı: tam gün dolu, kısmi gün yarım, kaçan gün kesik çizgi; zincir yine devam eder. */
export function ZincirHalkalari({ gunler, isaretler, hedef, renk, bugun, halka = 18, onGun }) {
  return html`<div class="satir">${gunler.map((g, i) => {
    const onceki = i > 0 ? gunler[i - 1] : null;
    const bagli = g != null && onceki != null && (isaretler.get(onceki) ?? 0) >= hedef && (isaretler.get(g) ?? 0) >= hedef;
    const adet = g != null ? (isaretler.get(g) ?? 0) : 0;
    const tik = onGun && g != null && g <= bugun;
    return html`${i > 0 && html`<svg width="5" height=${halka} style="display:block;flex:none"><line x1="0" x2="5" y1=${halka / 2} y2=${halka / 2}
        stroke=${bagli ? renk : 'var(--cizgi)'} stroke-width="2" stroke-dasharray=${bagli ? undefined : '1.5 1.5'} /></svg>`}
      <div style=${{ width: halka + 'px', height: halka + 'px', position: 'relative', flex: 'none', cursor: tik ? 'pointer' : undefined }}
        onClick=${tik ? (e) => { e.stopPropagation(); onGun(g); } : undefined}>
        <${Halka} g=${g} adet=${adet} hedef=${hedef} renk=${renk} bugun=${bugun} boy=${halka} />
        ${g != null && adet >= hedef && html`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
          <${Ikon} ad="tik" boy=${Math.round(halka * 0.6)} renk="var(--murekkep)" /></div>`}
      </div>`;
  })}</div>`;
}

/** Panodaki alçak zincir satırı. Bugünün halkasına dokununca işaretler, satıra dokununca detay. */
export function ZincirSatiri({ z, isaretler, bugun, onDokun, onAc }) {
  const o = Mantik.zincirOzet(z.baslangic, z.gunSayisi, z.gunlukHedef, isaretler, bugun);
  return html`<div class="satir tikla" style="height:32px" onClick=${onAc}>
    <${Ikon} ad=${z.ikon} boy=${16} renk=${vurgu(z.renk)} />
    <span class="bk dolu tek" style="margin-left:6px">${z.ad}</span>
    <${ZincirHalkalari} gunler=${Mantik.sonYediGun(z.baslangic, z.gunSayisi, bugun)} isaretler=${isaretler} hedef=${z.gunlukHedef} renk=${vurgu(z.renk)} bugun=${bugun}
      onGun=${(g) => { if (g === bugun) onDokun(g); else onAc(); }} />
    <span class="lk soluk" style="width:38px;flex:none;margin-left:6px">${o.bitti ? 'bitti' : `${o.gecenGun}/${z.gunSayisi}`}</span>
  </div>`;
}

function Stat({ ad, deger }) {
  return html`<div class="dolu" style="display:flex;flex-direction:column;align-items:center"><span class="tm">${deger}</span><span class="bk soluk">${ad}</span></div>`;
}

export function ZincirDetay({ id }) {
  const depo = useVeri();
  const bugun = useBugun();
  const [silSor, setSilSor] = useState(false);
  const z = M.db.getir('zincirler', id);
  if (!z) return html`<div class="icerik"><${YuvarlakButon} ikon="geri" aciklama="Geri" onClick=${geri} /></div>`;
  const isaretler = zincirIsaretleri(id);
  const o = Mantik.zincirOzet(z.baslangic, z.gunSayisi, z.gunlukHedef, isaretler, bugun);
  let metin = `${o.gecenGun}. gün / ${z.gunSayisi}`;
  if (o.kismiGun > 0) metin += ` · ${o.kismiGun} yarım gün`;
  if (z.gunlukHedef > 1) metin += ` · günde ${z.gunlukHedef} kez`;
  metin += o.bitti ? ' · zincir tamamlandı' : ` · ${o.kalanGun} gün kaldı`;
  const haftalar = [];
  for (let i = 0; i < z.gunSayisi; i += 7) haftalar.push(Array.from({ length: Math.min(7, z.gunSayisi - i) }, (_, k) => z.baslangic + i + k));

  return html`<div class="icerik"><div class="sutun g10">
    <div class="satir">
      <${YuvarlakButon} ikon="geri" aciklama="Geri" onClick=${geri} />
      <span style="width:10px"></span><${Ikon} ad=${z.ikon} boy=${22} renk=${vurgu(z.renk)} /><span style="width:8px"></span>
      <span class="tm dolu">${z.ad}</span>
    </div>
    <${Kart} dikey=${12}><div class="sutun g6">
      <div class="satir"><${Stat} ad="Başarı" deger=${'%' + o.yuzde} /><${Stat} ad="Tam gün" deger=${o.tamGun} /><${Stat} ad="Kaçan" deger=${o.bosGun} /><${Stat} ad="En uzun seri" deger=${o.enUzunSeri} /></div>
      <span class="bk soluk">${metin}</span>
    </div></${Kart}>
    <${Kart} dikey=${12}><div class="sutun g6">
      <span class="lk soluk">Tüm günler (geçmiş bir güne dokunarak düzeltebilirsin)</span>
      ${haftalar.map((h) => { const t = tarih(h[0]); return html`<div class="satir">
        <span class="bk soluk" style="width:40px;flex:none">${t.d}.${t.m}</span>
        <${ZincirHalkalari} gunler=${h} isaretler=${isaretler} hedef=${z.gunlukHedef} renk=${vurgu(z.renk)} bugun=${bugun} halka=${26} onGun=${(g) => depo.zincirDokun(z.id, g)} />
      </div>`; })}
    </div></${Kart}>
    <div class="satir">
      <${MetinButon} onClick=${() => M.db.guncelle('zincirler', z.id, { gunSayisi: z.gunSayisi + 7 })}>+7 gün uzat</${MetinButon}>
      <span class="dolu"></span>
      <${MetinButon} renk=${RENK.mercan} onClick=${() => setSilSor(true)}>Zinciri kaldır</${MetinButon}>
    </div>
  </div>
  ${silSor && html`<${Dialog} baslik="Zincir panodan kaldırılsın mı?" onKapat=${() => setSilSor(false)}
    butonlar=${[{ metin: 'Vazgeç', onClick: () => setSilSor(false) }, { metin: 'Kaldır', onClick: () => { M.db.guncelle('zincirler', z.id, { arsiv: true }); setSilSor(false); geri(); } }]}>
    <span class="bm">Günlük'teki kayıtları kalır.</span></${Dialog}>`}
  </div>`;
}

export function ZincirKurDialog({ bugun, onKapat }) {
  const [ad, setAd] = useState('');
  const [ikon, setIkon] = useState('gunes');
  const [renk, setRenk] = useState(2);
  const [gun, setGun] = useState(10);
  const [hedef, setHedef] = useState(1);
  const [yarin, setYarin] = useState(false);
  return html`<${Dialog} baslik="Zincir kur" onKapat=${onKapat}
    butonlar=${[{ metin: 'Vazgeç', onClick: onKapat }, { metin: 'Kur', disabled: !ad.trim(), onClick: () => { M.depo.zincirKur(ad, ikon, renk, gun, hedef, yarin ? bugun + 1 : bugun); onKapat(); } }]}>
    <div class="sutun g10">
      <${Girdi} etiket="Ne? (örn. 7'den önce kalk)" deger=${ad} onDeger=${setAd} otomatik />
      <div class="sar">${SECILEBILIR.map((i) => html`<button aria-label=${i} onClick=${() => setIkon(i)} style="width:34px;height:34px;padding:6px">
        <${Ikon} ad=${i} boy=${22} renk=${i === ikon ? vurgu(renk) : 'var(--soluk)'} /></button>`)}</div>
      <div class="satir" style="gap:6px">${[0, 1, 2, 3].map((c) => html`<button aria-label=${'Renk ' + (c + 1)} onClick=${() => setRenk(c)} style="width:28px;height:28px;display:flex;align-items:center;justify-content:center">
        <i style=${{ display: 'block', width: c === renk ? '28px' : '20px', height: c === renk ? '28px' : '20px', borderRadius: '50%', background: vurgu(c) }}></i></button>`)}</div>
      <span class="lk">Kaç gün?</span>
      <div class="sar">${[7, 10, 14, 21, 25, 30, 60, 90].map((g) => html`<${Cip} metin=${String(g)} secili=${gun === g} onClick=${() => setGun(g)} />`)}</div>
      <span class="lk">Günde kaç kez?</span>
      <div class="satir" style="gap:6px">${[1, 2, 3].map((h) => html`<${Cip} metin=${String(h)} secili=${hedef === h} onClick=${() => setHedef(h)} />`)}</div>
      <div class="satir" style="gap:6px"><${Cip} metin="Bugün başla" secili=${!yarin} onClick=${() => setYarin(false)} /><${Cip} metin="Yarın başla" secili=${yarin} onClick=${() => setYarin(true)} /></div>
    </div>
  </${Dialog}>`;
}

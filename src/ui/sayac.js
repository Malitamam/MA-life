// Sayaç bölümü: hızlı giriş, bugün yapılanlar, sayaçlar, kişisel bakım; bulaşık/çamaşır/kurutma pencereleri (SayacEkrani.kt).
import { html, useState } from '../../vendor/preact-htm.js';
import { useVeri, useBugun, pencereAc } from './durum.js';
import { Ikon, Kart, Cip, Segment, YuvarlakButon, MetinButon, Dialog, Girdi, MiniRozet, vurgu, saydam, RENK } from './ortak.js';
import { Mantik, SayacMantik } from '../mantik.js';
import { ayBasi, saatMetni } from '../tarih.js';
import { IsSatiri, useYap } from './takip.js';
import { Is } from './islem.js';

/** Hazır sayaç girişi: bulaşıkta 70/60 °C, çamaşırda süre + tür, ardından "nasıl kurutacaksın?". */
export function useSayacGirisi() {
  const [acik, setAcik] = useState(null); // 'bulasik' | 'camasir' | 'kurutma'
  const dokun = (anahtar) => {
    if (anahtar === SayacMantik.BULASIK) setAcik('bulasik');
    else if (anahtar === SayacMantik.CAMASIR) setAcik('camasir');
    else Is.sayacYap(anahtar, null);
  };
  const kapat = () => setAcik(null);
  const pencere = acik === 'bulasik' ? html`<${SecenekDialog} baslik="Bulaşık makinesi" soru="Kaç derece?" secenekler=${SayacMantik.hazir(SayacMantik.BULASIK).secenekler}
      onKapat=${kapat} onSec=${(s) => { Is.sayacYap(SayacMantik.BULASIK, s); kapat(); }} />`
    : acik === 'camasir' ? html`<${CamasirDialog} onKapat=${kapat} onKaydet=${(ek) => { Is.sayacYap(SayacMantik.CAMASIR, ek); setAcik('kurutma'); }} />`
    : acik === 'kurutma' ? html`<${KurutmaDialog} onKapat=${kapat} onSec=${(a) => { Is.sayacYap(a, null); kapat(); }} />` : null;
  return [dokun, pencere];
}

function BuyukSecim({ metin, ikon, renk, onClick }) {
  return html`<button class="dolu" onClick=${onClick} style=${{ height: '72px', borderRadius: '16px', background: renk, color: 'var(--murekkep)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px' }}>
    ${ikon && html`<${Ikon} ad=${ikon} boy=${22} />`}<span class="ts tek">${metin}</span></button>`;
}

export function SecenekDialog({ baslik, soru, secenekler, onKapat, onSec }) {
  return html`<${Dialog} baslik=${baslik} onKapat=${onKapat} butonlar=${[{ metin: 'Vazgeç', onClick: onKapat }, { metin: 'Seçmeden kaydet', onClick: () => onSec(null) }]}>
    <div class="sutun g10"><span class="bm">${soru}</span>
      <div class="satir" style="gap:10px">${secenekler.map((s) => html`<${BuyukSecim} metin=${s} renk=${RENK.adacayi} onClick=${() => onSec(s)} />`)}</div></div>
  </${Dialog}>`;
}

function TurKutusu({ tur, secili, onClick }) {
  const kenar = secili ? RENK.adacayi : saydam('var(--soluk)', 60);
  const kutu = (arka, ic) => html`<div style=${{ width: '20px', height: '20px', borderRadius: '4px', background: arka, border: `1.5px solid ${kenar}`, overflow: 'hidden', display: 'flex' }}>${ic}</div>`;
  const sekil = tur === 'Beyaz' ? kutu('#FFFFFF') : tur === 'Siyah' ? kutu('#222222')
    : tur === 'Renkli' ? kutu('transparent', ['#E57373', '#FFC94D', '#81C784', '#64B5F6'].map((c) => html`<i style=${{ flex: 1, background: c }}></i>`))
    : tur === 'Nehir' ? html`<${Ikon} ad="bebek" boy=${22} renk=${RENK.lavanta} />`
    : tur === 'Havlu' ? html`<${Ikon} ad="havlu" boy=${22} renk=${RENK.adacayi} />`
    : html`<${Ikon} ad="ileri" boy=${20} renk="var(--soluk)" />`;
  return html`<button role="checkbox" aria-checked=${secili} onClick=${onClick} style=${{ width: '58px', borderRadius: '12px', padding: '6px 0', background: secili ? saydam(RENK.adacayi, 35) : 'var(--zemin)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div style="width:26px;height:26px;display:flex;align-items:center;justify-content:center">${sekil}</div>
    <span class="lk tek">${tur}</span></button>`;
}

export function CamasirDialog({ onKapat, onKaydet }) {
  const [sure, setSure] = useState(null);
  const [turler, setTurler] = useState(new Set());
  const [digerAcik, setDigerAcik] = useState(false);
  const [diger, setDiger] = useState('');
  const degis = (t) => { const y = new Set(turler); if (y.has(t)) y.delete(t); else y.add(t); setTurler(y); };
  return html`<${Dialog} baslik="Çamaşır makinesi" onKapat=${onKapat}
    butonlar=${[{ metin: 'Vazgeç', onClick: onKapat }, { metin: 'Kaydet', onClick: () => onKaydet(SayacMantik.ek(sure, SayacMantik.CAMASIR_TUR.filter((t) => turler.has(t)), digerAcik ? diger : null)) }]}>
    <div class="sutun g10">
      <div class="satir" style="gap:8px">${SayacMantik.CAMASIR_SURE.map((s) => html`<${Cip} metin=${s} secili=${sure === s} renk=${RENK.sari} onClick=${() => setSure(sure === s ? null : s)} />`)}</div>
      <span class="bk">Ne yıkadın? (birden fazla seçebilirsin)</span>
      <div class="sar">${SayacMantik.CAMASIR_TUR.map((t) => html`<${TurKutusu} tur=${t} secili=${turler.has(t)} onClick=${() => degis(t)} />`)}
        <${TurKutusu} tur="Diğer" secili=${digerAcik} onClick=${() => setDigerAcik(!digerAcik)} /></div>
      ${digerAcik && html`<${Girdi} deger=${diger} onDeger=${setDiger} ipucu="örn. perde" otomatik />`}
    </div>
  </${Dialog}>`;
}

export function KurutmaDialog({ onKapat, onSec }) {
  return html`<${Dialog} baslik="Nasıl kurutacaksın?" onKapat=${onKapat} butonlar=${[{ metin: 'Sonra', onClick: onKapat }]}>
    <div class="satir" style="gap:10px">
      <${BuyukSecim} metin="Kurutma mak." ikon="kurutucu" renk=${RENK.sari} onClick=${() => onSec(SayacMantik.KURUTUCU)} />
      <${BuyukSecim} metin="Asacağım" ikon="asma" renk=${RENK.adacayi} onClick=${() => onSec(SayacMantik.ASMA)} />
    </div>
  </${Dialog}>`;
}

export function SayacEkrani({ onAc }) {
  const depo = useVeri();
  const bugun = useBugun();
  const [sekme, setSekme] = useState(0);
  const [yap, tutarPenceresi] = useYap();
  const [giris, girisPenceresi] = useSayacGirisi();
  const isler = depo.isDurumlari(bugun);
  const buAy = depo.aralik(ayBasi(bugun), bugun);
  const sayaclar = isler.filter((d) => d.tur === 'SAYAC');
  const hazirlar = SayacMantik.HAZIR.map((h) => sayaclar.find((d) => d.anahtar === h.anahtar)).filter(Boolean);
  const digerSayac = sayaclar.filter((d) => SayacMantik.hazir(d.anahtar) == null);
  const bakim = isler.filter((d) => d.tur === 'BAKIM');
  const bugunYapilan = buAy.filter((k) => k.gun === bugun && (k.kaynak === 'SAYAC' || k.kaynak === 'BAKIM'));
  const dokun = (d) => { if (d.anahtar != null) giris(d.anahtar); else yap(d); };
  const kalan = (d) => Mantik.kalanGun(d.sonGun, d.periyotGun, bugun) ?? Number.MAX_SAFE_INTEGER;

  return html`<div class="icerik"><div class="sutun">
    <div>
      <div class="satir"><span class="bs dolu">Sayaç</span>
        <${YuvarlakButon} ikon="arti" aciklama="Yeni sayaç" arka=${RENK.sari} onClick=${() => pencereAc({ tur: 'yeniIs', ilkTur: 'SAYAC' })} /></div>
      <div style="height:8px"></div>
      <${Segment} secenekler=${['Yapılanlar', 'Sayaçlar']} secili=${sekme} onSec=${setSekme} />
    </div>
    ${sekme === 0 ? html`
      <${HizliIzgara} liste=${[...hazirlar, ...digerSayac.filter((d) => d.yildizli)]} onDokun=${dokun} />
      <${Kart} dikey=${6}>
        <div class="lk soluk" style="padding:4px 0">Bugün yapılanlar · ${bugunYapilan.length}</div>
        ${bugunYapilan.length === 0 && html`<div class="bk soluk" style="padding-bottom:6px">Henüz bir şey yok. Yukarıdan bir düğmeye dokun.</div>`}
        ${bugunYapilan.map((k) => html`<div key=${k.id} class="satir" style="height:34px">
          <span class="lk soluk" style="width:46px;flex:none">${saatMetni(k.zaman)}</span>
          <span class="bm dolu tek">${k.metin}</span>
          <${MetinButon} onClick=${() => Is.geriAl(k.id)}>Geri al</${MetinButon}></div>`)}
      </${Kart}>` : html`
      <${Kart} dikey=${4}>
        <div class="lk soluk" style="padding:6px 0 2px">Sayaçlar</div>
        ${[...hazirlar, ...digerSayac].map((d) => {
          const dagilim = SayacMantik.secenekSayilari(buAy.filter((k) => k.refId === d.id && k.kaynak === 'SAYAC').map((k) => k.metin), d.ad);
          return html`<div key=${d.id}><${IsSatiri} d=${d} bugun=${bugun} onAc=${() => onAc(d.id)} onYap=${() => dokun(d)} />
            ${dagilim.length > 0 && html`<div class="bk soluk iki" style="padding:0 0 4px 29px">bu ay: ${dagilim.map(([a, n]) => `${a} ${n}`).join(' · ')}</div>`}</div>`;
        })}
      </${Kart}>
      ${bakim.length > 0 && html`<${Kart} dikey=${4}>
        <div class="lk soluk" style="padding:6px 0 2px">Kişisel bakım</div>
        ${[...bakim].sort((a, b) => kalan(a) - kalan(b)).map((d) => html`<${IsSatiri} key=${d.id} d=${d} bugun=${bugun} onAc=${() => onAc(d.id)} onYap=${() => Is.yap(d.id, d.ad)} />`)}
      </${Kart}>`}`}
  </div>${girisPenceresi}${tutarPenceresi}</div>`;
}

/** Büyük kare hızlı giriş düğmeleri: simge, ad, bugünkü sayı rozeti. */
export function HizliIzgara({ liste, onDokun }) {
  return html`<div class="izgara4">${liste.map((d) => html`<button key=${d.id} class="hizli" aria-label=${d.ad + ' +1'} onClick=${() => onDokun(d)}>
    <div class="daire" style=${{ width: '38px', height: '38px', background: saydam(vurgu(d.renk), 22) }}><${Ikon} ad=${d.ikon} boy=${21} renk=${vurgu(d.renk)} /></div>
    <span class="lk iki" style="margin-top:3px">${d.ad}</span>
    ${d.bugunSayi > 0 && html`<${MiniRozet} metin=${String(d.bugunSayi)} stil=${{ top: '4px', right: '4px' }} />`}
  </button>`)}</div>`;
}

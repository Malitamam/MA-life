// Ajanda: Hafta · Ay · Yıl, kayıt penceresi, hazırlık, aralık türü, detay (AjandaEkrani.kt, AjandaDialog.kt, AjandaDetay.kt).
import { html, useState } from '../../vendor/preact-htm.js';
import { M, Ayar, useVeri, useBugun, git, geri, pencereAc } from './durum.js';
import { Ikon, Kart, Cip, Segment, YuvarlakButon, IkonButon, TikButon, MetinButon, Dialog, Girdi, SesleYaz, Anahtar, vurgu, saydam, RENK } from './ortak.js';
import { AjandaMantik, ARKA_PLAN, GunlukMantik } from '../mantik.js';
import { tarih, isoHafta, gunKisa, gunBaslik, saatYazi, gunAyHg, AY_UZUN, AY_KISA, gunYap } from '../tarih.js';
import { TarihButon } from './gunluk.js';
import { Is } from './islem.js';

export const turRengi = (t) => ({ ETKINLIK: RENK.lavanta, GOREV: RENK.adacayi, RANDEVU: RENK.mercan, PLAN: RENK.sari,
  RESMI_TATIL: 'var(--tatil)', IZIN: 'var(--izin)', FIRMA_IZNI: 'var(--firma)', KITA_KAPALI: 'var(--kita)', KRANK: 'var(--krank)' })[t] ?? RENK.lavanta;
export const turAdi = (t) => ({ ETKINLIK: 'Etkinlik', GOREV: 'Görev', RANDEVU: 'Randevu', PLAN: 'Plan', RESMI_TATIL: 'Resmi tatil', IZIN: 'İzin',
  FIRMA_IZNI: 'Firma izni', KITA_KAPALI: 'Kita kapalı', KRANK: 'Hastalık' })[t] ?? t;
const BUGUN_RENGI = 'var(--bugun)';

function zeminStil(g, durumlar) {
  const hs = AjandaMantik.haftaSonu(g) ? saydam('var(--soluk)', 16) : 'transparent';
  if (!durumlar.length) return { background: hs };
  const r = durumlar.map((d) => saydam(turRengi(d.tur), d.tahmini ? 45 : 90));
  if (r.length === 1) return { background: r[0] };
  const n = r.length, adim = 100 / n;
  return { background: `linear-gradient(90deg, ${r.map((c, i) => `${c} ${i * adim}% ${(i + 1) * adim}%`).join(', ')})` };
}

const DURUM_ACIKLAMA = ['RESMI_TATIL', 'FIRMA_IZNI', 'IZIN', 'KRANK', 'KITA_KAPALI'];
function DurumAciklama({ planDa }) {
  const kutu = (renk, ad) => html`<span class="satir" style="font-size:10px;color:var(--soluk)"><i style=${{ width: '9px', height: '9px', borderRadius: '2px', background: renk, display: 'inline-block' }}></i> ${ad}</span>`;
  return html`<div class="sar" style="gap:4px 10px">${kutu(saydam('var(--soluk)', 30), 'Hafta sonu')}
    ${[...DURUM_ACIKLAMA, ...(planDa ? ['PLAN'] : [])].map((t) => kutu(turRengi(t), turAdi(t)))}</div>`;
}

function DurumEtiketi({ t }) {
  return html`<span class="lk" style=${{ color: 'var(--murekkep)', background: turRengi(t), borderRadius: '8px', padding: '2px 6px', whiteSpace: 'nowrap' }}>${turAdi(t)}</span>`;
}

export function AjandaEkrani() {
  const [gorunum, setGorunum] = useState(0);
  return html`<div class="icerik sabit">
    <div class="satir"><span class="bs dolu">Ajanda</span>
      <${YuvarlakButon} ikon="arti" aciklama="Yeni" arka=${RENK.lavanta} onClick=${() => pencereAc({ tur: 'ajanda' })} /></div>
    <div style="height:8px"></div>
    <div><${Segment} secenekler=${['Hafta', 'Ay', 'Yıl']} secili=${gorunum} onSec=${setGorunum} /></div>
    <div style="height:8px"></div>
    <div class="kaydir">${gorunum === 0 ? html`<${HaftaGorunumu} />` : gorunum === 1 ? html`<${AyGorunumu} />` : html`<${YilGorunumu} />`}</div>
  </div>`;
}

/** Ev işlerinin o güne düşen vakti (bugün ve sonrası). hepsi=false: vadesine 2 gün ya da daha az kalanlar. */
export function takipVakti(isler, g, bugun, hepsi = true) {
  if (g < bugun) return [];
  return isler.filter((d) => {
    if (d.periyotGun == null || !d.hatirlatici) return false;
    const vade = AjandaMantik.takipVade(d.sonGun, d.periyotGun, d.ertelenenGun, bugun);
    return vade != null && vade === g && AjandaMantik.takipGorunur(vade, bugun, hepsi);
  });
}

function TakipSatiri({ d }) {
  return html`<div class="satir" style="height:30px"><${Ikon} ad=${d.ikon} boy=${13} renk="var(--soluk)" />
    <span class="bk soluk" style="margin-left:8px">${d.ad} (Ev işi)</span></div>`;
}

function HaftaGorunumu() {
  const depo = useVeri();
  const bugun = useBugun();
  const [ofset, setOfset] = useState(0);
  const [acik, setAcik] = useState({ ofset: 0, s: new Set([bugun]) });
  const [evHepsi, setEvHepsi] = useState(false);
  const liste = depo.ajanda(), tamam = depo.tamamSet(), isler = depo.isDurumlari(bugun);
  const kategoriler = M.db.hepsi('kategoriler');
  const a = GunlukMantik.hafta(bugun, ofset);
  const acikS = acik.ofset === ofset ? acik.s : new Set([bugun]);
  const setAcikS = (s) => setAcik({ ofset, s });
  const gunler = []; for (let g = a.bas; g <= a.son; g++) gunler.push(g);
  const gizli = gunler.reduce((t, g) => t + takipVakti(isler, g, bugun, true).length - takipVakti(isler, g, bugun, false).length, 0);
  return html`<div class="sutun g6">
    <div class="satir">
      <${IkonButon} ikon="geri" aciklama="Önceki hafta" onClick=${() => setOfset(ofset - 1)} />
      <button class="lk" onClick=${() => setOfset(0)}>Hafta ${isoHafta(a.bas)}${ofset === 0 ? ' · bu hafta' : ''}</button>
      <${IkonButon} ikon="ileri" aciklama="Sonraki hafta" onClick=${() => setOfset(ofset + 1)} />
      <span class="dolu"></span>
      <button class="ikonbtn" aria-label=${evHepsi ? 'Uzun vadeli Ev işlerini gizle' : 'Uzun vadeli Ev işlerini göster'} onClick=${() => setEvHepsi(!evHepsi)}>
        <span class="daire" style=${{ width: '30px', height: '30px', background: evHepsi ? RENK.adacayi : 'transparent' }}><${Ikon} ad="takip" boy=${18} renk=${evHepsi ? 'var(--murekkep)' : 'var(--soluk)'} /></span></button>
      ${!evHepsi && gizli > 0 && html`<span class="lk soluk">+${gizli}</span>`}
      <${MetinButon} onClick=${() => setAcikS(acikS.size === 7 ? new Set() : new Set(gunler))}>${acikS.size === 7 ? 'Tümünü kapat' : 'Tümünü aç'}</${MetinButon}>
    </div>
    ${gunler.map((g) => {
      const gorunen = AjandaMantik.gunListesi(liste, tamam, g, bugun);
      const arka = AjandaMantik.arkaPlan(liste, g);
      const takip = takipVakti(isler, g, bugun, evHepsi);
      const acikMi = acikS.has(g);
      const acikSayi = gorunen.filter((x) => !x.yapildi).length + takip.length;
      return html`<${Kart} key=${g} dikey=${4}>
        <div class="satir tikla" style="height:36px" onClick=${() => { const s = new Set(acikS); if (acikMi) s.delete(g); else s.add(g); setAcikS(s); }}>
          <span class="ts" style=${{ color: g === bugun ? RENK.adacayi : undefined }}>${gunKisa(g)}</span>
          <span class="bk soluk dolu">  · ${acikSayi === 0 ? 'boş' : `${acikSayi} iş`}</span>
          ${AjandaMantik.gunDurumlari(liste, g).map((d) => html`<span style="width:4px"></span><${DurumEtiketi} t=${d.tur} />`)}
        </div>
        ${acikMi && html`
          ${arka.map((b) => html`<div class="bk soluk">${b.baslik}${b.tahmini ? ' (tahmini)' : ''}</div>`)}
          ${gorunen.map((gr) => html`<${AjandaSatiri} gr=${gr} liste=${liste} kategoriler=${kategoriler} bugun=${bugun} />`)}
          ${takip.map((d) => html`<${TakipSatiri} d=${d} />`)}
          ${gorunen.length === 0 && takip.length === 0 && html`<div class="bk soluk" style="padding-bottom:6px">Bir şey yok.</div>`}`}
      </${Kart}>`;
    })}
  </div>`;
}

export function AjandaSatiri({ gr, liste, kategoriler, bugun }) {
  const a = gr.a;
  const altlar = liste.filter((x) => x.ustId === a.id);
  const kat = kategoriler.find((k) => k.id === a.kategoriId);
  const alt = [];
  if (a.tur === 'RANDEVU' && a.tarih == null) alt.push('randevu alınacak');
  if (altlar.length) { const [h, t] = AjandaMantik.hazirlik(altlar); alt.push(a.tur === 'GOREV' ? `${h}/${t} adım` : `${h}/${t} hazır`); }
  if (a.sonTarih != null && !gr.yapildi) alt.push(a.sonTarih < bugun ? 'son tarih geçti, yeni tarih seç' : a.sonTarih === bugun ? 'son gün bugün' : `${a.sonTarih - bugun} gün kaldı`);
  if (a.yer) alt.push(a.yer);
  return html`<div class="satir tikla" style="height:44px" onClick=${() => git('ajanda/' + a.id)}>
    <i style=${{ width: '8px', height: '8px', borderRadius: '50%', flex: 'none', background: kat ? vurgu(kat.renk) : turRengi(a.tur) }}></i>
    <span style="width:8px"></span>
    ${a.saatDakika != null && html`<span class="lk">${saatYazi(a.saatDakika)}  </span>`}
    <div class="dolu">
      <div class=${'bm tek' + (gr.yapildi ? ' soluk cizik' : '')}>${a.baslik}${!a.kesin ? ' (taslak)' : ''}</div>
      ${alt.length > 0 && html`<div class="bk tek" style=${{ color: gr.gecikti ? RENK.sari : 'var(--soluk)' }}>${alt.join(' · ')}</div>`}
    </div>
    <${TikButon} renk=${turRengi(a.tur)} dolu=${gr.yapildi} aciklama=${a.baslik + ' yapıldı'} onClick=${() => Is.ajandaTikle(a.id, gr.olay, a.baslik)} />
  </div>`;
}

function AyGorunumu() {
  const depo = useVeri();
  const bugun = useBugun();
  const [ofset, setOfset] = useState(0);
  const [secili, setSecili] = useState(bugun);
  const liste = depo.ajanda(), tamam = depo.tamamSet(), isler = depo.isDurumlari(bugun);
  const kategoriler = M.db.hepsi('kategoriler');
  const a = GunlukMantik.ay(bugun, ofset);
  const ilk = tarih(a.bas);
  const hucreler = [...Array(ilk.hg - 1).fill(null)];
  for (let g = a.bas; g <= a.son; g++) hucreler.push(g);
  while (hucreler.length % 7) hucreler.push(null);
  const yakin = AjandaMantik.yakinGunler(bugun);
  const kartProp = { liste, tamam, isler, kategoriler, bugun };
  return html`<div class="sutun g8">
    <${Kart} dikey=${8}>
      <div class="satir">
        <${IkonButon} ikon="geri" aciklama="Önceki ay" onClick=${() => setOfset(ofset - 1)} />
        <button class="ts dolu" style="text-align:left" onClick=${() => setOfset(0)}>${AY_UZUN[ilk.m - 1]} ${ilk.y}</button>
        <${IkonButon} ikon="ileri" aciklama="Sonraki ay" onClick=${() => setOfset(ofset + 1)} />
      </div>
      <div class="ay7">${['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'].map((d) => html`<span class="bk soluk">${d}</span>`)}</div>
      <div class="ay7">${hucreler.map((g) => {
        if (g == null) return html`<div class="hucre-ay"></div>`;
        const gorunen = AjandaMantik.gunListesi(liste, tamam, g, bugun);
        const onemli = gorunen.some((x) => x.a.tur !== 'GOREV' && !x.yapildi) || AjandaMantik.planlar(liste, g).length > 0;
        const hafif = gorunen.some((x) => x.a.tur === 'GOREV') || takipVakti(isler, g, bugun).length > 0;
        const durumlar = AjandaMantik.gunDurumlari(liste, g);
        const kenar = g === secili ? `inset 0 0 0 2px ${RENK.adacayi}` : g === bugun ? `inset 0 0 0 1.5px ${BUGUN_RENGI}` : 'none';
        const renk = g === bugun ? BUGUN_RENGI : durumlar.length ? 'var(--murekkep)' : AjandaMantik.haftaSonu(g) ? 'var(--soluk)' : 'var(--yazi)';
        return html`<div class="hucre-ay"><div class="tikla" onClick=${() => setSecili(g)}
            style=${{ ...zeminStil(g, durumlar), boxShadow: kenar, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style=${{ fontSize: '13px', fontWeight: g === bugun ? 700 : 500, color: renk }}>${tarih(g).d}</span>
          <div class="satir" style="gap:2px;height:4px">
            ${onemli && html`<i style=${{ width: '10px', height: '4px', borderRadius: '2px', background: RENK.mercan }}></i>`}
            ${hafif && html`<i style=${{ width: '3px', height: '3px', borderRadius: '50%', background: saydam('var(--soluk)', 60) }}></i>`}
          </div></div></div>`;
      })}</div>
      <div style="height:6px"></div>
      <${DurumAciklama} />
    </${Kart}>
    ${!yakin.includes(secili) && html`<${GunKarti} g=${secili} vurgulu ...${kartProp} />`}
    <div class="ts" style="padding-top:4px">Bugün ve sonraki 3 gün</div>
    ${yakin.map((g) => html`<${GunKarti} key=${g} g=${g} vurgulu=${g === secili && g !== bugun} ...${kartProp} />`)}
  </div>`;
}

function GunKarti({ g, bugun, liste, tamam, isler, kategoriler, vurgulu }) {
  const gorunen = AjandaMantik.gunListesi(liste, tamam, g, bugun);
  const takip = takipVakti(isler, g, bugun);
  return html`<${Kart} dikey=${4} stil=${vurgulu ? { boxShadow: `var(--golge), inset 0 0 0 2px ${RENK.adacayi}` } : undefined}>
    <div class="satir">
      <span class="ts dolu" style=${{ color: g === bugun ? BUGUN_RENGI : undefined }}>${gunBaslik(g, bugun)}</span>
      ${AjandaMantik.gunDurumlari(liste, g).map((d) => html`<${DurumEtiketi} t=${d.tur} /><span style="width:4px"></span>`)}
      <${MetinButon} onClick=${() => pencereAc({ tur: 'ajanda', gun: g })}>+ ekle</${MetinButon}>
    </div>
    ${AjandaMantik.arkaPlan(liste, g).filter((b) => b.baslik !== turAdi(b.tur)).map((b) => html`<div class="bk soluk">${turAdi(b.tur)}: ${b.baslik}${b.tahmini ? ' (tahmini)' : ''}</div>`)}
    ${AjandaMantik.planlar(liste, g).filter((p) => !gorunen.some((x) => x.a.id === p.id)).map((p) => html`<div class="bk soluk">${p.baslik} (${p.kesin ? 'kesin' : 'taslak'})</div>`)}
    ${gorunen.map((gr) => html`<${AjandaSatiri} gr=${gr} liste=${liste} kategoriler=${kategoriler} bugun=${bugun} />`)}
    ${takip.map((d) => html`<${TakipSatiri} d=${d} />`)}
    ${gorunen.length === 0 && takip.length === 0 && html`<div class="bk soluk" style="padding-bottom:6px">Bir şey yok.</div>`}
  </${Kart}>`;
}

function YilGorunumu() {
  const depo = useVeri();
  const bugun = useBugun();
  const [yil, setYil] = useState(tarih(bugun).y);
  const [secimBas, setSecimBas] = useState(null);
  const [secim, setSecim] = useState(null);
  const liste = depo.ajanda();
  const hak = Ayar.izinHakki(yil);
  const kullanilan = AjandaMantik.yillikIzin(liste, yil);
  const hastalik = AjandaMantik.yillikGun(liste, yil, 'KRANK');
  const tatiller = liste.filter((a) => a.tur === 'RESMI_TATIL' && a.tarih != null && tarih(a.tarih).y === yil).map((a) => a.tarih);
  const kopru = new Set(AjandaMantik.kopruGunleri(tatiller));
  const ucler = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]];
  return html`<div class="sutun g8">
    <${Kart} dikey=${8}><div class="satir">
      <${IkonButon} ikon="geri" aciklama="Önceki yıl" onClick=${() => setYil(yil - 1)} />
      <span class="ts">${yil}</span>
      <${IkonButon} ikon="ileri" aciklama="Sonraki yıl" onClick=${() => setYil(yil + 1)} />
      <span class="dolu"></span>
      <div style="text-align:right">
        <div class="lk">İzin: ${kullanilan} / ${hak} gün</div>
        <div class="bk" style=${{ color: hak - kullanilan < 0 ? RENK.mercan : RENK.adacayi }}>kalan ${hak - kullanilan}</div>
        ${hastalik > 0 && html`<div class="bk soluk">Hastalık: ${hastalik} gün</div>`}
      </div>
    </div></${Kart}>
    <${DurumAciklama} planDa />
    <div class="bk" style=${{ color: secimBas == null ? 'var(--soluk)' : RENK.sari }}>${secimBas == null ? 'İzin ya da plan eklemek için başlangıç gününe dokun.' : 'Şimdi bitiş gününe dokun (tek gün için aynı güne).'}</div>
    ${ucler.map((uc) => html`<div class="satir" style="gap:6px;align-items:flex-start">${uc.map((ay) => html`<${MiniAy} yil=${yil} ay=${ay} liste=${liste} bugun=${bugun} kopru=${kopru} secimBas=${secimBas}
      onGun=${(g) => { if (secimBas == null) setSecimBas(g); else setSecim(g); }} />`)}</div>`)}
    ${kopru.size > 0 && html`<div class="bk soluk">Köprü günü ipucu: ${[...kopru].sort((x, y) => x - y).filter((g) => tarih(g).y === yil).map(gunAyHg).join(', ')}</div>`}
    ${secimBas != null && secim != null && html`<${AralikTurDialog} bas=${Math.min(secimBas, secim)} son=${Math.max(secimBas, secim)}
      onKapat=${() => { setSecimBas(null); setSecim(null); }} onKaydet=${(a) => { depo.ajandaKaydet(a); setSecimBas(null); setSecim(null); }} />`}
  </div>`;
}

function MiniAy({ yil, ay, liste, bugun, kopru, secimBas, onGun }) {
  const bas = gunYap(yil, ay, 1);
  const t = tarih(bas);
  const gunler = [...Array(t.hg - 1).fill(null)];
  for (let i = 0; i < t.ayGun; i++) gunler.push(bas + i);
  return html`<div class="mini-ay dolu">
    <div class="lk">${AY_KISA[ay - 1]}</div>
    <div class="ay7">${gunler.map((g) => {
      if (g == null) return html`<div></div>`;
      const durumlar = AjandaMantik.gunDurumlari(liste, g);
      const plan = durumlar.length ? null : AjandaMantik.planlar(liste, g)[0] ?? null;
      const zemin = plan ? { background: saydam(turRengi(plan.tur), plan.kesin ? 85 : 35) } : zeminStil(g, durumlar);
      const kenar = g === secimBas ? `inset 0 0 0 1px ${RENK.sari}` : g === bugun ? `inset 0 0 0 1px ${BUGUN_RENGI}` : kopru.has(g) ? 'inset 0 0 0 1px var(--soluk)' : 'none';
      const renk = g === bugun ? BUGUN_RENGI : durumlar.length || plan ? 'var(--murekkep)' : AjandaMantik.haftaSonu(g) ? 'var(--soluk)' : 'var(--yazi)';
      return html`<div><div class="tikla" onClick=${() => onGun(g)} style=${{ position: 'absolute', inset: '0.5px', borderRadius: '3px', ...zemin, boxShadow: kenar,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: g === bugun ? 700 : 500, color: renk }}>${tarih(g).d}</div></div>`;
    })}</div>
  </div>`;
}

const ornek = (t) => ({ GOREV: 'örn. Arabayı yıkat', ETKINLIK: 'örn. Şehir festivali', RANDEVU: 'örn. Dyson servisi' })[t] ?? 'örn. Kış tatili';
const SON_SECENEK = [['bugün', 0], ['3 gün', 3], ['5 gün', 5], ['1 hafta', 7], ['2 hafta', 14], ['1 ay', 30]];

/** Yeni / düzenle. Etkinlik ve planda kaydedince "öncesinde yapılacak bir şey var mı?" sorulur. */
export function AjandaDialog({ mevcut = null, ilkGun = null, bugun, kategoriler, onKapat, ilkBaslik = '', ilkTur = 'GOREV', onKaydet }) {
  const [tur, setTur] = useState(mevcut?.tur ?? ilkTur);
  const [baslik, setBaslik] = useState(mevcut?.baslik ?? ilkBaslik);
  const [gun, setGun] = useState(mevcut?.tarih ?? ilkGun ?? bugun);
  const [tarihYok, setTarihYok] = useState(mevcut != null && mevcut.tarih == null);
  const [bitis, setBitis] = useState(mevcut?.bitis ?? null);
  const [saat, setSaat] = useState(mevcut?.saatDakika ?? null);
  const [sonTarih, setSonTarih] = useState(mevcut?.sonTarih ?? null);
  const [tekrar, setTekrar] = useState(mevcut?.tekrar ?? 'YOK');
  const [kesin, setKesin] = useState(mevcut?.kesin ?? true);
  const [hatir, setHatir] = useState(mevcut?.hatirlatici ?? false);
  const [kat, setKat] = useState(mevcut?.kategoriId ?? null);
  const [ilkAdim, setIlkAdim] = useState(mevcut?.ilkAdim ?? '');
  const [yer, setYer] = useState(mevcut?.yer ?? '');
  const [sure, setSure] = useState(mevcut?.sureGun ?? null);
  const [altlar, setAltlar] = useState([]);
  const [yeniAlt, setYeniAlt] = useState('');
  const [hazirlikSor, setHazirlikSor] = useState(null);

  const kayit = () => {
    const t = tur === 'RANDEVU' && tarihYok ? null : gun;
    const tt = t != null ? tarih(t) : null;
    return {
      ...(mevcut ?? {}), tur, baslik: baslik.trim(), tarih: t,
      bitis: (tur === 'PLAN' || tur === 'ETKINLIK') && bitis != null && t != null && bitis > t ? bitis : null,
      saatDakika: tur === 'ETKINLIK' || tur === 'RANDEVU' ? saat : null,
      sonTarih: tur === 'GOREV' || tur === 'RANDEVU' ? sonTarih : null,
      tekrar, tekrarGun: tekrar === 'HAFTALIK' ? tt?.hg ?? null : tekrar === 'AYLIK' ? tt?.d ?? null : null,
      sureGun: tekrar !== 'YOK' && tur === 'GOREV' ? sure : null,
      kesin, hatirlatici: hatir, kategoriId: kat, ilkAdim: ilkAdim.trim() || null, yer: yer.trim() || null,
    };
  };
  const kaydet = () => {
    const l = yeniAlt.trim() ? [...altlar, yeniAlt.trim()] : altlar;
    const k = kayit();
    if (mevcut == null && (k.tur === 'ETKINLIK' || k.tur === 'PLAN')) setHazirlikSor(k); else onKaydet(k, l);
  };
  const saatInput = (dk) => dk == null ? '' : saatYazi(dk);

  return html`<${Dialog} baslik=${mevcut == null ? 'Ajandaya ekle' : 'Düzenle'} onKapat=${onKapat}
    butonlar=${[{ metin: 'Vazgeç', onClick: onKapat }, { metin: 'Kaydet', disabled: !baslik.trim(), onClick: kaydet }]}>
    <div class="sutun g8">
      <div class="sar">${['GOREV', 'ETKINLIK', 'RANDEVU', 'PLAN'].map((t) => html`<${Cip} metin=${turAdi(t)} secili=${tur === t} renk=${turRengi(t)} onClick=${() => setTur(t)} />`)}</div>
      <div class="satir" style="gap:4px"><div class="dolu"><${Girdi} deger=${baslik} onDeger=${setBaslik} ipucu=${ornek(tur)} otomatik=${!mevcut} /></div>
        <${SesleYaz} onMetin=${(s) => setBaslik(baslik.trim() ? `${baslik} ${s}` : s)} /></div>
      ${tur === 'RANDEVU' && html`<div class="satir"><span class="bk dolu">Randevu tarihi henüz yok (önce ara)</span><${Anahtar} acik=${tarihYok} etiket="Tarih yok" onDegis=${setTarihYok} /></div>`}
      ${!(tur === 'RANDEVU' && tarihYok) && html`<div class="satir" style="flex-wrap:wrap">
        <span class="bm">${tur === 'GOREV' ? 'Başlangıç:' : 'Tarih:'}</span>
        <${TarihButon} gun=${gun} bugun=${bugun} onGun=${setGun} />
        ${(tur === 'ETKINLIK' || tur === 'RANDEVU') && html`<label class="metinbtn" style="position:relative;overflow:hidden">${saat != null ? saatYazi(saat) : 'saat ekle'}
          <input type="time" value=${saatInput(saat ?? 600)} style="position:absolute;inset:0;opacity:0;width:100%;cursor:pointer"
            onChange=${(e) => { const m = /^(\d{2}):(\d{2})/.exec(e.target.value); setSaat(m ? +m[1] * 60 + +m[2] : null); }} /></label>
          ${saat != null && html`<${MetinButon} renk="var(--soluk)" onClick=${() => setSaat(null)}>saatsiz</${MetinButon}>`}`}
      </div>`}
      ${(tur === 'PLAN' || tur === 'ETKINLIK') && html`
        <div class="satir"><span class="bm">Bitiş:</span>
          <${TarihButon} gun=${bitis} bugun=${bugun} bos="tek gün" enErken=${gun} onGun=${setBitis} />
          ${bitis != null && html`<${MetinButon} onClick=${() => setBitis(null)}>kaldır</${MetinButon}>`}</div>
        <div class="sar"><${Cip} metin="Taslak" secili=${!kesin} renk=${RENK.sari} onClick=${() => setKesin(false)} /><${Cip} metin="Kesinleşti" secili=${kesin} onClick=${() => setKesin(true)} /></div>`}
      ${(tur === 'GOREV' || tur === 'RANDEVU') && html`
        <span class="bm">Son tarih${sonTarih != null ? ': ' + gunBaslik(sonTarih, bugun) : ''}</span>
        <div class="sar">
          <${Cip} metin="yok" secili=${sonTarih == null} onClick=${() => setSonTarih(null)} />
          ${SON_SECENEK.map(([a, g]) => html`<${Cip} metin=${a} secili=${sonTarih === bugun + g} onClick=${() => setSonTarih(bugun + g)} />`)}
          <${TarihButon} gun=${sonTarih ?? bugun} bugun=${bugun} onGun=${setSonTarih} metin=${html`<span class="cip" style="display:inline-block">tarih seç</span>`} />
        </div>`}
      ${tur !== 'PLAN' && html`
        <span class="bm">Tekrar</span>
        <div class="sar">${[['YOK', 'Yok'], ['HAFTALIK', 'Her hafta'], ['AYLIK', 'Her ay'], ['YILLIK', 'Her yıl']].map(([t, a]) => html`<${Cip} metin=${a} secili=${tekrar === t} onClick=${() => setTekrar(t)} />`)}</div>
        ${tekrar !== 'YOK' && tur === 'GOREV' && html`<span class="bk">Kaç gün açık kalsın? (örn. ayın 1'i + 6 gün)</span>
          <div class="sar">${[[null, 'o gün'], [2, '3 gün'], [6, '1 hafta']].map(([g, a]) => html`<${Cip} metin=${a} secili=${sure === g} onClick=${() => setSure(g)} />`)}</div>`}`}
      <div class="satir"><span class="bm dolu">Sabah özetinde hatırlat</span><${Anahtar} acik=${hatir} etiket="Sabah özetinde hatırlat" onDegis=${setHatir} /></div>
      <div class="sar">${kategoriler.map((c) => html`<${Cip} metin=${c.ad} secili=${kat === c.id} renk=${vurgu(c.renk)} onClick=${() => setKat(kat === c.id ? null : c.id)} />`)}</div>
      ${(tur === 'GOREV' || tur === 'RANDEVU') && html`<${Girdi} etiket="İlk adım (2 dk, isteğe bağlı)" deger=${ilkAdim} onDeger=${setIlkAdim} />`}
      ${(tur === 'ETKINLIK' || tur === 'RANDEVU') && html`<${Girdi} etiket="Yer (isteğe bağlı)" deger=${yer} onDeger=${setYer} />`}
      ${tur === 'GOREV' && mevcut == null && html`
        <span class="bm">Alt adımlar (isteğe bağlı)</span>
        ${altlar.map((x) => html`<span class="bk">• ${x}</span>`)}
        <div class="satir" style="gap:4px"><div class="dolu"><${Girdi} deger=${yeniAlt} onDeger=${setYeniAlt} ipucu="örn. lamba"
          onKeyDown=${(e) => { if (e.key === 'Enter' && yeniAlt.trim()) { setAltlar([...altlar, yeniAlt.trim()]); setYeniAlt(''); } }} /></div>
          <${MetinButon} onClick=${() => { if (yeniAlt.trim()) { setAltlar([...altlar, yeniAlt.trim()]); setYeniAlt(''); } }}>Ekle</${MetinButon}></div>`}
    </div>
    ${hazirlikSor && html`<${HazirlikDialog} baslik=${hazirlikSor.baslik} onKapat=${() => onKaydet(hazirlikSor, [])} onTamam=${(l) => onKaydet(hazirlikSor, l)} />`}
  </${Dialog}>`;
}

const HAZIR = ['Bilet al', 'Rezervasyon yap', 'Pasaportları kontrol et', 'Pasaportları yanına al', 'Yol planı', 'Bavul hazırla'];
export function HazirlikDialog({ baslik, onKapat, onTamam }) {
  const [secilen, setSecilen] = useState([]);
  const [yeni, setYeni] = useState('');
  const degis = (s) => setSecilen(secilen.includes(s) ? secilen.filter((x) => x !== s) : [...secilen, s]);
  return html`<${Dialog} baslik=${`${baslik}: öncesinde yapılacak bir şey var mı?`} onKapat=${onKapat}
    butonlar=${[{ metin: 'Atla', onClick: onKapat }, { metin: secilen.length === 0 ? 'Yok, kaydet' : `Kaydet (${secilen.length})`, onClick: () => onTamam([...secilen, ...(yeni.trim() ? [yeni.trim()] : [])]) }]}>
    <div class="sutun g8">
      <div class="sar">${[...HAZIR, ...secilen.filter((s) => !HAZIR.includes(s))].map((s) => html`<${Cip} metin=${s} secili=${secilen.includes(s)} onClick=${() => degis(s)} />`)}</div>
      <div class="satir" style="gap:4px"><div class="dolu"><${Girdi} deger=${yeni} onDeger=${setYeni} ipucu="başka…" /></div>
        <${MetinButon} onClick=${() => { if (yeni.trim()) { setSecilen([...secilen, yeni.trim()]); setYeni(''); } }}>Ekle</${MetinButon}></div>
      <span class="bk">Son tarih: etkinlikten bir gün önce.</span>
    </div>
  </${Dialog}>`;
}

/** Yıllık görünümde gün aralığı seçilince: izin mi, plan mı, tatil mi? */
function AralikTurDialog({ bas, son, onKapat, onKaydet }) {
  const [tur, setTur] = useState('IZIN');
  const [ad, setAd] = useState('');
  const [kesin, setKesin] = useState(true);
  return html`<${Dialog} baslik=${bas === son ? gunBaslik(bas, bas - 2) : `${gunBaslik(bas, bas - 2)} – ${gunBaslik(son, bas - 2)}`} onKapat=${onKapat}
    butonlar=${[{ metin: 'Vazgeç', onClick: onKapat }, { metin: 'Kaydet', onClick: () => onKaydet({ tur, baslik: ad.trim() || turAdi(tur), tarih: bas, bitis: son > bas ? son : null, kesin,
      kategoriId: tur === 'PLAN' || tur === 'IZIN' ? 7 : null }) }]}>
    <div class="sutun g8">
      <div class="sar">${['IZIN', 'KRANK', 'PLAN', 'RESMI_TATIL', 'FIRMA_IZNI', 'KITA_KAPALI'].map((t) => html`<${Cip} metin=${turAdi(t)} secili=${tur === t} renk=${turRengi(t)} onClick=${() => setTur(t)} />`)}</div>
      <${Girdi} deger=${ad} onDeger=${setAd} ipucu=${tur === 'PLAN' ? 'örn. Kış tatili' : 'isteğe bağlı'} />
      ${tur === 'PLAN' && html`<div class="sar"><${Cip} metin="Taslak" secili=${!kesin} renk=${RENK.sari} onClick=${() => setKesin(false)} /><${Cip} metin="Kesinleşti" secili=${kesin} onClick=${() => setKesin(true)} /></div>`}
    </div>
  </${Dialog}>`;
}

function Bilgi({ ad, deger }) {
  return html`<div class="satir" style="align-items:flex-start"><span class="bm soluk" style="width:96px;flex:none">${ad}</span><span class="bm dolu">${deger}</span></div>`;
}

export function AjandaDetay({ id }) {
  const depo = useVeri();
  const bugun = useBugun();
  const [duzenle, setDuzenle] = useState(false);
  const [silSor, setSilSor] = useState(false);
  const [yeniAlt, setYeniAlt] = useState('');
  const liste = depo.ajanda();
  const kategoriler = M.db.hepsi('kategoriler').sort((x, y) => x.sira - y.sira || x.id - y.id);
  const a = liste.find((x) => x.id === id);
  if (!a) return html`<div class="icerik"><${YuvarlakButon} ikon="geri" aciklama="Geri" onClick=${geri} /></div>`;
  const altlar = liste.filter((x) => x.ustId === id);
  const olay = AjandaMantik.olayGunu(a, bugun);
  const yapildi = AjandaMantik.yapildiMi(a, olay, depo.tamamSet());
  const [h, t] = AjandaMantik.hazirlik(altlar);
  const tekrarAd = { HAFTALIK: 'her hafta', AYLIK: 'her ay', YILLIK: 'her yıl' }[a.tekrar] ?? '';
  const katAd = kategoriler.find((k) => k.id === a.kategoriId)?.ad;
  const altEkle = () => {
    if (!yeniAlt.trim()) return;
    depo.ajandaKaydet({ tur: 'GOREV', baslik: yeniAlt.trim(), tarih: bugun, ustId: a.id, kategoriId: a.kategoriId,
      sonTarih: a.tur === 'GOREV' ? a.sonTarih : a.tarih != null ? a.tarih - 1 : null });
    setYeniAlt('');
  };

  return html`<div class="icerik"><div class="sutun g10">
    <div class="satir">
      <${YuvarlakButon} ikon="geri" aciklama="Geri" onClick=${geri} /><span style="width:10px"></span>
      <span class="tm dolu">${a.baslik}</span>
      ${!ARKA_PLAN.has(a.tur) && html`<${TikButon} renk=${turRengi(a.tur)} dolu=${yapildi} aciklama="Yapıldı" onClick=${() => Is.ajandaTikle(a.id, olay, a.baslik)} />`}
    </div>
    <${Kart} dikey=${10}><div class="sutun g4">
      <${Bilgi} ad="Tür" deger=${turAdi(a.tur) + (!a.kesin ? ' · taslak' : '')} />
      ${a.tarih != null && html`<${Bilgi} ad="Tarih" deger=${gunBaslik(a.tarih, bugun) + (a.bitis != null ? ' – ' + gunBaslik(a.bitis, bugun) : '')} />`}
      ${a.saatDakika != null && html`<${Bilgi} ad="Saat" deger=${saatYazi(a.saatDakika)} />`}
      ${a.sonTarih != null && html`<${Bilgi} ad="Son tarih" deger=${gunBaslik(a.sonTarih, bugun)} />`}
      ${a.tekrar !== 'YOK' && html`<${Bilgi} ad="Tekrar" deger=${tekrarAd + (a.sureGun != null ? ` · ${a.sureGun + 1} gün açık` : '')} />`}
      ${a.yer && html`<${Bilgi} ad="Yer" deger=${a.yer} />`}
      ${a.ilkAdim && html`<${Bilgi} ad="İlk adım" deger=${a.ilkAdim} />`}
      ${katAd && html`<${Bilgi} ad="Kategori" deger=${katAd} />`}
      ${a.hatirlatici && html`<${Bilgi} ad="Hatırlatma" deger="aynı gün sabah" />`}
      ${a.notId != null && html`<div><${MetinButon} onClick=${() => git('not/' + a.notId)}>Geldiği nota git</${MetinButon}></div>`}
    </div></${Kart}>
    ${a.tur === 'RANDEVU' && a.tarih == null && html`<${Kart} dikey=${10}>
      <div class="bm">Önce ara, randevu al. Tarihi belli olunca buraya gir.</div>
      <${MetinButon} onClick=${() => setDuzenle(true)}>Randevu tarihini gir</${MetinButon}></${Kart}>`}
    ${!yapildi && a.sonTarih != null && a.sonTarih < bugun && html`<${Kart} dikey=${10}>
      <div class="bm c-sari">Son tarih geçti. Sorun değil, yeni bir tarih seçelim mi?</div>
      <div class="satir" style="gap:6px;padding-top:6px">${[['yarın', 1], ['3 gün', 3], ['1 hafta', 7]].map(([ad, g]) => html`<${Cip} metin=${ad} renk=${RENK.sari} onClick=${() => depo.ajandaKaydet({ ...a, sonTarih: bugun + g })} />`)}</div>
    </${Kart}>`}
    ${(altlar.length > 0 || a.tur !== 'RESMI_TATIL') && html`<${Kart} dikey=${8}>
      <div class="lk soluk">${a.tur === 'GOREV' ? 'Alt adımlar' + (t > 0 ? ` · ${h}/${t}` : '') : 'Hazırlık' + (t > 0 ? ` · ${h}/${t} hazır` : '')}</div>
      ${t > 0 && html`<div class="cubuk" style="margin-top:4px"><i style=${{ width: (h / t * 100) + '%', background: RENK.adacayi }}></i></div>`}
      ${altlar.map((x) => html`<div key=${x.id} class="satir" style="height:42px">
        <div class="dolu">
          <div class=${'bm' + (x.yapildi ? ' soluk' : '')}>${x.baslik}</div>
          ${x.sonTarih != null && !x.yapildi && html`<div class="bk" style=${{ color: x.sonTarih < bugun ? RENK.sari : 'var(--soluk)' }}>son: ${gunBaslik(x.sonTarih, bugun)}</div>`}
        </div>
        <${MetinButon} renk="var(--soluk)" onClick=${() => depo.ajandaSil(x.id)}>sil</${MetinButon}>
        <${TikButon} renk=${turRengi(a.tur)} dolu=${x.yapildi} aciklama=${x.baslik + ' yapıldı'} onClick=${() => Is.ajandaTikle(x.id, x.tarih, x.baslik)} />
      </div>`)}
      <div class="satir" style="gap:4px"><div class="dolu"><${Girdi} deger=${yeniAlt} onDeger=${setYeniAlt} ipucu=${a.tur === 'GOREV' ? 'adım ekle' : 'örn. bilet al'}
        onKeyDown=${(e) => { if (e.key === 'Enter') altEkle(); }} /></div>
        <${MetinButon} onClick=${altEkle}>Ekle</${MetinButon}></div>
    </${Kart}>`}
    <div class="satir">
      <${MetinButon} onClick=${() => setDuzenle(true)}>Düzenle</${MetinButon}><span class="dolu"></span>
      <${MetinButon} renk=${RENK.mercan} onClick=${() => setSilSor(true)}>Sil</${MetinButon}>
    </div>
  </div>
  ${duzenle && html`<${AjandaDialog} mevcut=${a} bugun=${bugun} kategoriler=${kategoriler} onKapat=${() => setDuzenle(false)} onKaydet=${(k) => { depo.ajandaKaydet(k); setDuzenle(false); }} />`}
  ${silSor && html`<${Dialog} baslik=${`"${a.baslik}" silinsin mi?`} onKapat=${() => setSilSor(false)}
    butonlar=${[{ metin: 'Vazgeç', onClick: () => setSilSor(false) }, { metin: 'Sil', renk: RENK.mercan, onClick: () => { depo.ajandaSil(a.id); setSilSor(false); geri(); } }]}>
    ${a.tekrar !== 'YOK' && html`<span class="bm">Tüm tekrarları silinir. Günlük'teki geçmiş kalır.</span>`}</${Dialog}>`}
  </div>`;
}

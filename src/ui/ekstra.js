// Arama, Özet ve Ayarlar (AramaEkrani.kt, OzetEkrani.kt, AyarlarEkrani.kt).
import { html, useState, useRef } from '../../vendor/preact-htm.js';
import { M, Ayar, useVeri, useBugun, git, geri } from './durum.js';
import { Ikon, Kart, Cip, YuvarlakButon, MetinButon, Dialog, Girdi, Anahtar, SesleYaz, bildir, vurgu, RENK } from './ortak.js';
import { GunlukMantik, OzetMantik, ARKA_PLAN, tutarMetni } from '../mantik.js';
import { gunBaslik, saatYazi, GUN_UZUN } from '../tarih.js';
import { kaynakAdi, kaynakIkonu, kaynakRengi } from './gunluk.js';
import { yedekPaylas, yedekJson, indir, geriYukle, bildirimVar, bildirimIzni, bildirimGoster, sabahSatirlari } from '../sistem.js';
import { gunInput, bugunGun } from '../tarih.js';

// ---------------- Arama ----------------
function AramaBaslik({ s }) { return html`<div class="lk soluk" style="height:26px;display:flex;align-items:flex-end">${s}</div>`; }
function AramaSatiri({ ikon, renk, metin, alt, onClick }) {
  return html`<div class="satir tikla" style="height:36px" onClick=${onClick}>
    <${Ikon} ad=${ikon} boy=${16} renk=${renk} />
    <span class="bm dolu tek" style="margin-left:9px">${metin}</span>
    ${alt && html`<span class="bk soluk">${alt}</span>`}
  </div>`;
}

export function AramaEkrani() {
  const depo = useVeri();
  const bugun = useBugun();
  const [q, setQ] = useState('');
  const bos = !q.trim();
  const isSonuc = bos ? [] : depo.isDurumlari(bugun).filter((d) => GunlukMantik.eslesir(d.ad, q));
  const kayitSonuc = bos ? [] : depo.aralik(-1e9, 1e9).filter((k) => GunlukMantik.eslesir(k.metin, q)).slice(0, 200);
  const ekler = bos ? [] : [
    ...depo.ajanda().filter((a) => !ARKA_PLAN.has(a.tur)).map((a) => ({ k: 'a' + a.id, metin: a.baslik, alt: 'Ajanda', ikon: 'ajanda', renk: RENK.lavanta, rota: 'ajanda/' + a.id })),
    ...M.db.hepsi('notlar').map((n) => ({ k: 'n' + n.id, metin: n.metin.split('\n')[0] ?? '', alt: 'Not', ikon: 'notlar', renk: RENK.sari, rota: 'not/' + n.id })),
    ...depo.urunler().map((u) => ({ k: 'u' + u.id, metin: u.ad, alt: 'Ürün', ikon: u.ikon, renk: RENK.mercan, rota: 'urun/' + u.id })),
    ...depo.acikAlisveris().map((m) => ({ k: 'l' + m.id, metin: m.ad, alt: 'Alışveriş listesi', ikon: 'alim', renk: RENK.mercan, rota: 'alim' })),
  ].filter((e) => GunlukMantik.eslesir(e.metin, q)).slice(0, 100);

  return html`<div class="icerik"><div class="sutun g2">
    <div class="satir" style="gap:8px;margin-bottom:8px">
      <${YuvarlakButon} ikon="geri" aciklama="Geri" onClick=${geri} />
      <div class="dolu"><${Girdi} deger=${q} onDeger=${setQ} ipucu="Her yerde ara" otomatik type="search" /></div>
      <${SesleYaz} onMetin=${setQ} />
    </div>
    ${!bos && !isSonuc.length && !kayitSonuc.length && !ekler.length && html`<div class="bm soluk">Sonuç yok.</div>`}
    ${isSonuc.length > 0 && html`<${AramaBaslik} s="Takip" />`}
    ${isSonuc.map((d) => html`<${AramaSatiri} key=${'i' + d.id} ikon=${d.ikon} renk=${vurgu(d.renk)} metin=${d.ad} onClick=${() => git('is/' + d.id)} />`)}
    ${ekler.length > 0 && html`<${AramaBaslik} s="Ajanda · Notlar · Alım" />`}
    ${ekler.map((e) => html`<${AramaSatiri} key=${e.k} ikon=${e.ikon} renk=${e.renk} metin=${e.metin} alt=${e.alt} onClick=${() => git(e.rota)} />`)}
    ${kayitSonuc.length > 0 && html`<${AramaBaslik} s=${`Günlük · ${kayitSonuc.length}`} />`}
    ${kayitSonuc.map((k) => html`<${AramaSatiri} key=${'k' + k.id} ikon=${kaynakIkonu(k.kaynak)} renk=${kaynakRengi(k.kaynak)} metin=${k.metin} alt=${gunBaslik(k.gun, bugun)} />`)}
  </div></div>`;
}

// ---------------- Özet ----------------
export function OzetEkrani() {
  const depo = useVeri();
  const bugun = useBugun();
  const [mod, setMod] = useState(0);
  const [ofset, setOfset] = useState(0);
  const a = mod === 0 ? GunlukMantik.hafta(bugun, ofset) : GunlukMantik.ay(bugun, ofset);
  const o = OzetMantik.hesapla(depo.aralik(a.bas, a.son), depo.modAralik(a.bas, a.son), a);
  const m = o.modlar;
  const enFazla = Math.max(o.kaynaklar[0]?.[1] ?? 1, 1);
  return html`<div class="icerik"><div class="sutun g10">
    <div class="satir">
      <${YuvarlakButon} ikon="geri" aciklama="Geri" onClick=${geri} /><span style="width:10px"></span>
      <span class="tm dolu">Özet</span>
      <${Cip} metin="Hafta" secili=${mod === 0} onClick=${() => { setMod(0); setOfset(0); }} /><span style="width:6px"></span>
      <${Cip} metin="Ay" secili=${mod === 1} onClick=${() => { setMod(1); setOfset(0); }} />
    </div>
    <div class="satir">
      <${YuvarlakButon} ikon="geri" aciklama="Önceki" onClick=${() => setOfset(ofset - 1)} />
      <span class="bm dolu" style="padding:0 8px">${gunBaslik(a.bas, bugun)} – ${gunBaslik(a.son, bugun)}</span>
      ${ofset < 0 && html`<${Cip} metin=${'bu ' + (mod === 0 ? 'hafta' : 'ay')} onClick=${() => setOfset(0)} />`}
    </div>
    <${Kart} dikey=${10}><div class="sutun g4">
      <span class="bl">${o.toplam} kayıt · ${o.aktifGun}/${o.gunSayisi} gün bir şey yapıldı</span>
      ${o.paraSent > 0 && html`<span class="bm c-sari">Para: ${tutarMetni(o.paraSent)}</span>`}
      ${m[0] + m[1] + m[2] > 0 && html`<span class="bm soluk">Mod: iyi ${m[2]} · orta ${m[1]} · zor ${m[0]}</span>`}
      ${o.toplam === 0 && html`<span class="bm soluk">Bu aralıkta kayıt yok. Sorun değil.</span>`}
    </div></${Kart}>
    ${o.kaynaklar.length > 0 && html`<${Kart} dikey=${10}><div class="sutun g6">
      <span class="lk soluk">Nereden</span>
      ${o.kaynaklar.map(([k, n]) => html`<div class="satir">
        <span class="bm" style="width:90px;flex:none">${kaynakAdi(k)}</span>
        <div class="cubuk dolu"><i style=${{ width: (n / enFazla * 100) + '%', background: kaynakRengi(k) }}></i></div>
        <span class="bm">  ${n}</span></div>`)}
    </div></${Kart}>`}
    ${o.enCok.length > 0 && html`<${Kart} dikey=${10}><div class="sutun g4">
      <span class="lk soluk">En çok</span>
      ${o.enCok.map(([ad, n]) => html`<div class="satir"><span class="bm dolu">${ad}</span><span class="bm c-adacayi">${n}×</span></div>`)}
    </div></${Kart}>`}
  </div></div>`;
}

// ---------------- Ayarlar ----------------
function SaatButon({ dk, onDk, disabled, metin }) {
  const iki = (x) => String(x).padStart(2, '0');
  return html`<label class="metinbtn" style=${{ position: 'relative', overflow: 'hidden', opacity: disabled ? 0.38 : 1 }}>${metin ?? saatYazi(dk)}
    ${!disabled && html`<input type="time" value=${`${iki(Math.floor(dk / 60))}:${iki(dk % 60)}`} style="position:absolute;inset:0;opacity:0;width:100%;cursor:pointer"
      onChange=${(e) => { const m = /^(\d{2}):(\d{2})/.exec(e.target.value); if (m) onDk(+m[1] * 60 + +m[2]); }} />`}</label>`;
}

const tarihSaat = (ms) => { const d = new Date(ms); const iki = (x) => String(x).padStart(2, '0'); return `${d.getDate()}.${iki(d.getMonth() + 1)}.${d.getFullYear()} ${iki(d.getHours())}:${iki(d.getMinutes())}`; };

export function AyarlarEkrani() {
  useVeri();
  const [geriYukleSor, setGeriYukleSor] = useState(null);
  const [izin, setIzin] = useState(bildirimIzni());
  const [icler, setIcler] = useState(null);
  const dosya = useRef(null);
  const son = Ayar.sonYedek;
  const kurulu = matchMedia('(display-mode: standalone)').matches || navigator.standalone;

  const dosyaSecildi = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setGeriYukleSor({ ad: f.name, metin: await f.text() });
  };
  const yukle = async (metin) => {
    setGeriYukleSor(null);
    try { await geriYukle(metin); bildir('Geri yüklendi'); }
    catch (err) { console.error(err); bildir('Dosya okunamadı'); }
  };
  const icleriAc = async () => setIcler(((await M.db.icYedekler()) ?? []).map(String).sort().reverse());

  return html`<div class="icerik"><div class="sutun g10">
    <div class="satir"><${YuvarlakButon} ikon="geri" aciklama="Geri" onClick=${geri} /><span style="width:10px"></span><span class="tm">Ayarlar</span></div>

    <${Kart} dikey=${10}>
      <div class="ts">Sabah özeti (gün gün)</div>
      <div class="bk soluk">O gün vakti gelen ve hatırlatıcısı açık işler, ajanda, takviye ve stok tek özette gelir. Web uygulamasında özet, o günün saati geçtikten sonra MALI'yi ilk açtığında gösterilir.</div>
      ${[1, 2, 3, 4, 5, 6, 7].map((g) => {
        const s = Ayar.sabahSaati(g);
        return html`<div class="satir" style="height:40px">
          <span class="bm dolu">${GUN_UZUN[g - 1]}</span>
          <${SaatButon} dk=${s ?? 420} disabled=${s == null} metin=${s == null ? 'kapalı' : undefined} onDk=${(d) => Ayar.sabahSaatiYaz(g, d)} />
          <${Anahtar} acik=${s != null} etiket=${GUN_UZUN[g - 1]} onDegis=${(v) => Ayar.sabahSaatiYaz(g, v ? 420 : null)} />
        </div>`;
      })}
    </${Kart}>

    <${Kart} dikey=${10}>
      <div class="ts">Sessiz saatler</div>
      <div class="satir"><span class="bm dolu">Başlangıç</span><${SaatButon} dk=${Ayar.sessizBas} onDk=${(d) => { Ayar.sessizBas = d; }} /></div>
      <div class="satir"><span class="bm dolu">Bitiş</span><${SaatButon} dk=${Ayar.sessizSon} onDk=${(d) => { Ayar.sessizSon = d; }} /></div>
      <div class="sar">
        ${bildirimVar() && izin !== 'granted' && html`<${MetinButon} onClick=${async () => setIzin(await Notification.requestPermission())}>Bildirim izni ver</${MetinButon}>`}
        <${MetinButon} onClick=${async () => {
          const ok = await bildirimGoster('MALI deneme bildirimi', 'Bunu görüyorsan bildirimler çalışıyor.', 'deneme');
          if (!ok) bildir(izin === 'denied' ? 'Bildirim izni kapalı (tarayıcı ayarlarından açılır)' : 'Önce bildirim izni ver');
        }}>Deneme bildirimi gönder</${MetinButon}>
        <${MetinButon} onClick=${() => { const l = sabahSatirlari(); bildir(l.length ? `Günaydın · bugün ${l.length} şey var` : 'Bugün için özet yok'); }}>Sabah özetini şimdi göster</${MetinButon}>
      </div>
    </${Kart}>

    <${Kart} dikey=${10}>
      <div class="ts">Yedek</div>
      <div class="bk soluk">${son === 0 ? 'Henüz yedek yok. Her hafta kendiliğinden alınır.' : 'Son yedek: ' + tarihSaat(son)}</div>
      <div class="sutun g2" style="align-items:flex-start">
        <${MetinButon} onClick=${async () => { const r = await yedekPaylas(); if (r === 'indirildi') bildir('Yedek indirildi'); }}>Şimdi yedekle ve Drive'a paylaş</${MetinButon}>
        <${MetinButon} onClick=${() => { indir(`mali-${gunInput(bugunGun())}.json`, yedekJson()); bildir('Dışa aktarıldı'); }}>JSON olarak dışa aktar</${MetinButon}>
        <${MetinButon} renk=${RENK.mercan} onClick=${() => dosya.current?.click()}>Yedekten geri yükle</${MetinButon}>
        <${MetinButon} renk="var(--soluk)" onClick=${icleriAc}>Uygulamadaki haftalık yedekler</${MetinButon}>
      </div>
      <div class="bk soluk">Android'deki MALI'nin yedek dosyası (mali-….json) da buradan yüklenir.</div>
      <input ref=${dosya} type="file" accept="application/json,.json" style="display:none" onChange=${dosyaSecildi} />
    </${Kart}>

    <${Kart} dikey=${10}>
      <div class="ts">Telefona kur</div>
      <div class="bk soluk">${kurulu ? 'MALI ana ekranda kurulu. Güncellemeler uygulamayı yeniden açınca kendiliğinden gelir.'
        : "Chrome'da sağ üstteki ⋮ menüsünden \"Ana ekrana ekle\" ya da \"Uygulamayı yükle\" seç. Sonra MALI ayrı bir uygulama gibi açılır; güncellemeler yeniden açınca gelir."}</div>
      <div class="bk soluk" style="margin-top:4px">Veriler bu telefonda, tarayıcının içinde durur. Tarayıcı verilerini silersen gider; haftalık yedeği Drive'a paylaşmayı unutma.</div>
    </${Kart}>

    <div class="bk soluk">MALI web ${globalThis.MALI_SURUM ?? ''}</div>
  </div>
  ${geriYukleSor && html`<${Dialog} baslik="Yedekten geri yüklensin mi?" onKapat=${() => setGeriYukleSor(null)}
    butonlar=${[{ metin: 'Vazgeç', onClick: () => setGeriYukleSor(null) }, { metin: 'Geri yükle', renk: RENK.mercan, onClick: () => yukle(geriYukleSor.metin) }]}>
    <span class="bm">Telefondaki mevcut veriler silinir ve yedekteki veriler yüklenir. Önce otomatik bir yedek alınır.</span>
    <span class="bk soluk">${geriYukleSor.ad}</span></${Dialog}>`}
  ${icler && html`<${Dialog} baslik="Haftalık yedekler" onKapat=${() => setIcler(null)} butonlar=${[{ metin: 'Kapat', onClick: () => setIcler(null) }]}>
    ${icler.length === 0 && html`<span class="bm soluk">Henüz yok.</span>`}
    ${icler.map((ad) => html`<div class="satir"><span class="bk dolu tek">${ad}</span>
      <${MetinButon} onClick=${async () => indir(ad, await M.db.icYedekAl(ad))}>İndir</${MetinButon}>
      <${MetinButon} renk=${RENK.mercan} onClick=${async () => { const m = await M.db.icYedekAl(ad); setIcler(null); setGeriYukleSor({ ad, metin: m }); }}>Yükle</${MetinButon}></div>`)}
  </${Dialog}>`}
  </div>`;
}

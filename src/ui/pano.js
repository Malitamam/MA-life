// Pano: üst şerit, Bugün/Hafta, zincirler, sayaç kısa yolları, bölüm butonları, düzen modu (PanoEkrani.kt).
import { html, useState } from '../../vendor/preact-htm.js';
import { M, Ayar, useVeri, useBugun, git, koyuMu } from './durum.js';
import { Ikon, Kart, Cip, Segment, YuvarlakButon, TikButon, MetinButon, Dialog, Girdi, SesleYaz, MiniRozet, uzunBas, vurgu, saydam, RENK } from './ortak.js';
import { AjandaMantik, GunlukMantik, PanoMantik, PanoDuzen, SayacMantik, StokMantik, tutarMetni } from '../mantik.js';
import { ayBasi, isoHafta, gunUzun, gunBaslik, saatMetni, saatYazi, gunAyHg } from '../tarih.js';
import { ModSecici, KayitDialog, kaynakIkonu, kaynakRengi } from './gunluk.js';
import { useYap } from './takip.js';
import { useSayacGirisi } from './sayac.js';
import { ZincirSatiri, ZincirKurDialog } from './zincir.js';
import { turRengi } from './ajanda.js';
import { useKayitta, sesToggle } from './ses.js';
import { Is } from './islem.js';

export const KART_TUTARLARI = [10, 20, 30, 40, 50];

export function PanoEkrani() {
  const depo = useVeri();
  const bugun = useBugun();
  const [hafta, setHafta] = useState(0);
  const [zincirKur, setZincirKur] = useState(false);
  const [elleKayit, setElleKayit] = useState(false);
  const [duzenMod, setDuzenMod] = useState(false);
  const [etkinlikYakala, setEtkinlikYakala] = useState(false);
  const [gunAcik, setGunAcik] = useState(true);
  const [katFiltre, setKatFiltre] = useState(null);
  const [kartAcik, setKartAcik] = useState(false);
  const [yap0, tutarPenceresi] = useYap();
  const [sayacGiris, sayacPenceresi] = useSayacGirisi();
  const kayit = useKayitta();

  const isler = depo.isDurumlari(bugun);
  const zincirler = M.db.hepsi('zincirler').filter((z) => !z.arsiv).sort((a, b) => a.id - b.id);
  const islenmemis = M.db.hepsi('notlar').filter((n) => !n.islendi).length;
  const mod = M.db.getir('modlar', bugun)?.seviye ?? null;
  const kategoriler = M.db.hepsi('kategoriler').sort((a, b) => a.sira - b.sira || a.id - b.id);
  const duzen = PanoDuzen.bloklar(Ayar.panoDuzeni);
  const duzenTasi = (i, yon) => { Ayar.panoDuzeni = PanoDuzen.tasi(duzen, i, yon).join(','); };

  const hs = GunlukMantik.hafta(bugun, 0);
  const aralik = hafta === 0 ? [bugun, bugun] : [hs.bas, hs.son];
  const yapilanlar = depo.aralik(aralik[0], aralik[1]);
  const ajanda = depo.ajanda();
  const tamam = depo.tamamSet();
  const son = hafta === 0 ? bugun : hs.son;
  const ajandaIs = [];
  const goruldu = new Set();
  for (let g = bugun; g <= son; g++) for (const gr of AjandaMantik.gunListesi(ajanda, tamam, g, bugun)) {
    if (gr.yapildi || goruldu.has(gr.a.id)) continue;
    goruldu.add(gr.a.id); ajandaIs.push([g, gr]);
  }
  const sayaclar = [...SayacMantik.PANO.map((a) => isler.find((d) => d.anahtar === a)).filter(Boolean),
    ...isler.filter((d) => d.yildizli && d.tur === 'SAYAC' && d.anahtar == null)];
  const evYakin = PanoMantik.evIsleriYakin(isler, bugun);
  const isaretMap = new Map();
  for (const x of M.db.hepsi('isaretler')) { if (!isaretMap.has(x.zincirId)) isaretMap.set(x.zincirId, new Map()); isaretMap.get(x.zincirId).set(x.gun, x.adet); }
  const yap = (d) => { if (d.anahtar != null) sayacGiris(d.anahtar); else yap0(d); };
  const koyu = koyuMu();

  const bloklar = {
    gun: () => {
      const filtreli = ajandaIs.filter(([, gr]) => katFiltre == null || gr.a.kategoriId === katFiltre);
      const tarihli = filtreli.filter(([, gr]) => gr.a.tarih != null).sort((x, y) => x[0] - y[0] || (x[1].a.saatDakika ?? 1e9) - (y[1].a.saatDakika ?? 1e9));
      const tarihsiz = filtreli.filter(([, gr]) => gr.a.tarih == null);
      const katIdler = [...new Set(ajandaIs.map(([, gr]) => gr.a.kategoriId).filter((x) => x != null))];
      const katlar = katIdler.map((id) => kategoriler.find((k) => k.id === id)).filter(Boolean);
      return html`<${Kart} dikey=${8}>
        <div class="satir">
          <${Segment} secenekler=${['Bugün', 'Hafta']} secili=${hafta} onSec=${setHafta} />
          <span class="dolu"></span>
          <button class="lk soluk" style="padding:8px 0" onClick=${() => setGunAcik(!gunAcik)}>${ajandaIs.length} yapılacak · ${yapilanlar.length} yapıldı</button>
          <button class="ikonbtn" style="width:36px;height:36px" aria-label=${gunAcik ? 'Listeyi kapat' : 'Listeyi aç'} onClick=${() => setGunAcik(!gunAcik)}>
            <${Ikon} ad=${gunAcik ? 'kapat' : 'detay'} boy=${15} renk="var(--soluk)" /></button>
        </div>
        <button class="satir" style="width:100%;height:36px;border-radius:10px;text-align:left" onClick=${() => git('takip')}>
          <${Ikon} ad="ev" boy=${15} renk=${RENK.adacayi} />
          <span class=${'bk dolu ' + (evYakin.length ? 'yazi' : 'soluk')} style="margin-left:9px">${evYakin.length === 0 ? 'Ev işleri: 2 gün içinde iş yok' : `Ev işleri: 2 gün içinde ${evYakin.length} iş`}</span>
          <${Ikon} ad="ileri" boy=${13} renk="var(--soluk)" />
        </button>
        ${gunAcik && html`
          ${katlar.length > 1 && html`<div class="sar" style="padding:4px 0">
            <${Cip} metin="Hepsi" secili=${katFiltre == null} onClick=${() => setKatFiltre(null)} />
            ${katlar.map((k) => html`<${Cip} metin=${k.ad} secili=${katFiltre === k.id} renk=${vurgu(k.renk)} onClick=${() => setKatFiltre(katFiltre === k.id ? null : k.id)} />`)}
          </div>`}
          <div style="height:4px"></div>
          ${tarihli.map(([g, gr]) => html`<${PanoAjandaSatiri} key=${'t' + gr.a.id} g=${g} gr=${gr} bugun=${bugun} kategoriler=${kategoriler} />`)}
          ${tarihsiz.length > 0 && html`<div class="lk soluk" style="padding-top:6px">Tarihsiz</div>
            ${tarihsiz.map(([g, gr]) => html`<${PanoAjandaSatiri} key=${'s' + gr.a.id} g=${g} gr=${gr} bugun=${bugun} kategoriler=${kategoriler} />`)}`}
          ${filtreli.length === 0 && html`<div class="bm soluk" style="padding:8px 0">${hafta === 0 ? 'Bugün için yapılacak yok.' : 'Bu hafta yapılacak yok.'}</div>`}
          ${yapilanlar.length > 0 && html`<div style="height:4px"></div><div class="lk soluk">Yapılanlar</div>
            ${yapilanlar.slice(0, 8).map((k) => html`<div key=${k.id} class="satir" style="height:24px">
              <${Ikon} ad=${kaynakIkonu(k.kaynak)} boy=${13} renk=${kaynakRengi(k.kaynak)} />
              <span class="bk soluk dolu tek" style="margin-left:8px">${k.metin}</span>
              <span class="bk soluk">${saatMetni(k.zaman)}</span></div>`)}
            ${yapilanlar.length > 8 && html`<div class="bk soluk">+${yapilanlar.length - 8} daha (Günlük'te)</div>`}`}
        `}
      </${Kart}>`;
    },
    zincir: () => html`<${Kart} dikey=${6}>
      <div class="satir" style="height:30px">
        <span class="lk soluk dolu">Zincirler</span>
        <button class="daire" aria-label="Zincir kur" style=${{ width: '28px', height: '28px', background: RENK.adacayi, color: 'var(--murekkep)' }} onClick=${() => setZincirKur(true)}><${Ikon} ad="arti" boy=${15} /></button>
      </div>
      ${zincirler.length === 0 && html`<div class="bk soluk" style="padding-bottom:6px">Bir alışkanlık için zincir kur: örn. 10 gün 7'den önce kalk.</div>`}
      ${zincirler.map((z) => html`<${ZincirSatiri} key=${z.id} z=${z} isaretler=${isaretMap.get(z.id) ?? new Map()} bugun=${bugun}
        onDokun=${(g) => depo.zincirDokun(z.id, g)} onAc=${() => git('zincir/' + z.id)} />`)}
    </${Kart}>`,
    sayac: () => (sayaclar.length || duzenMod) && html`<${Kart} dikey=${8}>
      <div class="sar" style="justify-content:space-evenly;gap:6px 0">${sayaclar.map((d) => html`<button key=${d.id} aria-label=${d.ad + ' +1'}
          style="width:54px;border-radius:12px;padding:4px 0;display:flex;flex-direction:column;align-items:center" ...${uzunBas(() => git('is/' + d.id), () => yap(d))}>
        <div style="position:relative">
          <div class="daire" style=${{ width: '38px', height: '38px', background: saydam(vurgu(d.renk), 22) }}><${Ikon} ad=${d.ikon} boy=${19} renk=${vurgu(d.renk)} /></div>
          ${d.bugunSayi > 0 && html`<${MiniRozet} metin=${String(d.bugunSayi)} stil=${{ top: '-3px', right: '-4px' }} />`}
        </div>
        <span class="bk soluk tek" style="max-width:54px">${d.ad}</span>
      </button>`)}</div>
    </${Kart}>`,
    buton: () => {
      const ham = [
        { anahtar: 'ev', ad: 'Ev işleri', ikon: 'ev', renk: RENK.adacayi, bilgi: evYakin.length === 0 ? '2 günde yok' : `2 günde ${evYakin.length}`, onClick: () => git('takip') },
        { anahtar: 'sayacb', ad: 'Sayaç', ikon: 'sayac', renk: RENK.sari, bilgi: (() => { const n = PanoMantik.bakimVakti(isler, bugun).length; return n > 0 ? `${n} bakım vakti` : 'yapılanlar'; })(), onClick: () => git('sayac') },
        ...alimButonlari(depo, bugun, () => setKartAcik(true)),
        { anahtar: 'ozet', ad: 'Özet', ikon: 'detay', renk: RENK.adacayi, bilgi: `Hafta ${isoHafta(bugun)}`, onClick: () => git('ozet') },
        { anahtar: 'etkinlik', ad: 'Etkinlik', ikon: 'afis', renk: RENK.lavanta, bilgi: 'hızlı yakala', onClick: () => setEtkinlikYakala(true) },
        { anahtar: 'elle', ad: 'Elle kayıt', ikon: 'kalem', renk: RENK.lavanta, bilgi: "Günlük'e yaz", onClick: () => setElleKayit(true) },
        { anahtar: 'ses', ad: kayit.kayitta ? 'Durdur' : 'Sesli not', ikon: kayit.kayitta ? 'durdur' : 'mikrofon', renk: RENK.mercan, bilgi: kayit.kayitta ? 'kayıt sürüyor' : 'bas, konuş', onClick: sesToggle },
      ];
      const sira = PanoDuzen.butonlar(Ayar.butonDuzeni);
      const yer = (b) => { const i = sira.indexOf(b.anahtar); return i < 0 ? 99 : i; };
      const butonlar = ham.sort((a, b) => yer(a) - yer(b));
      return html`<div>
        ${duzenMod && html`<div class="bk c-sari" style="margin-bottom:6px">Bir butona dokun: bir öne alınır.</div>`}
        <div class="izgara4">${butonlar.map((b, i) => html`<${BolumKutusu} key=${b.anahtar} b=${duzenMod
          ? { ...b, onClick: () => { Ayar.butonDuzeni = PanoDuzen.tasi(butonlar.map((x) => x.anahtar), i, -1).join(','); } } : b} />`)}</div>
      </div>`;
    },
  };

  return html`<div class="icerik"><div class="sutun">
    <div class="satir">
      <div class="dolu">
        <div class="tm">${gunUzun(bugun)}</div>
        <div class="bk soluk">Hafta ${isoHafta(bugun)}</div>
      </div>
      <${ModSecici} mod=${mod} kucuk onMod=${(s) => depo.modYaz(bugun, s)} />
      <span style="width:4px"></span>
      <div style="position:relative">
        <${YuvarlakButon} ikon="notlar" aciklama="İşlenmemiş notlar" onClick=${() => git('notlar')} />
        ${islenmemis > 0 && html`<${MiniRozet} metin=${String(islenmemis)} stil=${{ top: '-4px', right: '-4px' }} />`}
      </div>
      <span style="width:6px"></span>
      <${YuvarlakButon} ikon=${koyu ? 'gunes' : 'ay'} aciklama=${koyu ? 'Açık tema' : 'Koyu tema'} onClick=${() => { Ayar.tema = koyu ? 1 : 2; }} />
      <span style="width:6px"></span>
      <${YuvarlakButon} ikon="ara" aciklama="Ara" onClick=${() => git('ara')} />
      <span style="width:6px"></span>
      <${YuvarlakButon} ikon="ayar" aciklama="Ayarlar" onClick=${() => git('ayarlar')} />
    </div>
    ${duzen.map((blok, sira) => {
      const ic = bloklar[blok]?.();
      if (!ic) return null;
      return html`<${BlokCercevesi} key=${blok} anahtar=${blok} sira=${sira} toplam=${duzen.length} duzenMod=${duzenMod} onTasi=${(y) => duzenTasi(sira, y)} onUzun=${() => setDuzenMod(true)}>${ic}</${BlokCercevesi}>`;
    })}
    <div class="satir" style="justify-content:center">
      <${MetinButon} renk="var(--soluk)" stil=${{ fontSize: '11px', fontWeight: 600 }} onClick=${() => setDuzenMod(!duzenMod)}>${duzenMod ? 'Düzen bitti' : 'Panonun düzenini değiştir'}</${MetinButon}>
    </div>
  </div>
  ${tutarPenceresi}${sayacPenceresi}
  ${zincirKur && html`<${ZincirKurDialog} bugun=${bugun} onKapat=${() => setZincirKur(false)} />`}
  ${etkinlikYakala && html`<${EtkinlikYakalaDialog} onKapat=${() => setEtkinlikYakala(false)}
    onKaydet=${(m) => { Is.notKaydet({ metin: m, olusturma: depo.simdi(), islendi: false }); setEtkinlikYakala(false); }} />`}
  ${kartAcik && html`<${KartDialog} bugun=${bugun} onKapat=${() => setKartAcik(false)} onTumu=${() => { setKartAcik(false); git('kart'); }} />`}
  ${elleKayit && html`<${KayitDialog} ilkGun=${bugun} bugun=${bugun} kategoriler=${kategoriler} onKapat=${() => setElleKayit(false)}
    onKaydet=${(m, g, k) => { Is.elleKayit(m, g, k); setElleKayit(false); }} />`}
  </div>`;
}

function PanoAjandaSatiri({ g, gr, bugun, kategoriler }) {
  const kat = kategoriler.find((k) => k.id === gr.a.kategoriId);
  const ust = [g !== bugun && gr.a.tarih != null ? gunBaslik(g, bugun) : null, gr.a.saatDakika != null ? saatYazi(gr.a.saatDakika) : null, gr.a.baslik].filter((x) => x != null).join(' · ');
  return html`<div class="satir tikla" style="height:42px" onClick=${() => git('ajanda/' + gr.a.id)}>
    <${Ikon} ad="ajanda" boy=${15} renk=${turRengi(gr.a.tur)} />
    <div class="dolu" style="margin-left:9px">
      <div class="bm tek">${ust}</div>
      ${kat && html`<div class="bk tek" style=${{ color: vurgu(kat.renk) }}>${kat.ad}</div>`}
    </div>
    ${gr.gecikti && html`<span class="bk c-sari">yeni tarih?</span>`}
    <${TikButon} renk=${turRengi(gr.a.tur)} dolu=${false} aciklama=${gr.a.baslik + ' yapıldı'} onClick=${() => Is.ajandaTikle(gr.a.id, gr.olay, gr.a.baslik)} />
  </div>`;
}

export function BolumKutusu({ b }) {
  return html`<button class="bolum" aria-label=${b.ad} onClick=${b.onClick}>
    <${Ikon} ad=${b.ikon} boy=${20} renk=${b.renk} />
    <span class="lk tek">${b.ad}</span>
    ${b.bilgi && html`<span class="bk soluk tek">${b.bilgi}</span>`}
  </button>`;
}

/** Bölüm kısa yolları: Alışveriş, Stok, Takviye, Şirket kartı. */
function alimButonlari(depo, bugun, onKart) {
  const takviyeler = M.db.hepsi('takviyeler');
  const acik = depo.acikAlisveris();
  const urunler = depo.urunler();
  const rozet = acik.some((m) => depo.simdi() - m.eklenme > 7 * 86_400_000);
  const azTakviye = takviyeler.filter((t) => StokMantik.takviyeAzMi(t, bugun));
  let enYakin = null;
  for (const t of takviyeler.filter((x) => x.gunlukDoz > 0)) if (!enYakin || StokMantik.takviyeKalanGun(t, bugun) < StokMantik.takviyeKalanGun(enYakin, bugun)) enYakin = t;
  const ab = ayBasi(bugun);
  const buAy = M.db.hepsi('para').filter((p) => p.gun >= ab && p.gun <= bugun).reduce((s, p) => s + p.tutarSent, 0);
  const bekleyen = acik.length;
  const sayim = urunler.filter((u) => StokMantik.sayimVakti(u, bugun)).length;
  const azStok = urunler.filter((u) => StokMantik.azMi(u)).length;
  return [
    { anahtar: 'alisveris', ad: 'Alışveriş', ikon: 'alim', renk: RENK.mercan, bilgi: bekleyen === 0 ? 'boş' : `${bekleyen} ürün` + (rozet ? ' (!)' : ''), onClick: () => git('alim') },
    { anahtar: 'stok', ad: 'Stok', ikon: 'stok', renk: RENK.adacayi, bilgi: sayim > 0 ? `${sayim} sayılacak` : azStok > 0 ? `${azStok} azaldı` : 'tamam', onClick: () => git('stok') },
    { anahtar: 'takviye', ad: 'Takviye', ikon: 'takviye', renk: RENK.lavanta,
      bilgi: azTakviye.length ? `${azTakviye.length} azaldı` : enYakin ? `${enYakin.ad.slice(0, 8)} · ${StokMantik.takviyeKalanGun(enYakin, bugun)} g` : 'ayarla', onClick: () => git('takviye') },
    { anahtar: 'para', ad: 'Kart', ikon: 'kart', renk: RENK.sari, bilgi: 'bu ay ' + tutarMetni(buAy), onClick: onKart },
  ];
}

/** Şirket kartı: 10/20/30/40/50 € tek dokunuşla eklenir; bu ayın tarihli listesi ve toplamı. */
function KartDialog({ bugun, onKapat, onTumu }) {
  useVeri();
  const [secili, setSecili] = useState(10);
  const ab = ayBasi(bugun);
  const buAy = M.db.hepsi('para').filter((p) => p.gun >= ab && p.gun <= bugun).sort((a, b) => b.gun - a.gun || b.id - a.id);
  return html`<${Dialog} baslik="Şirket kartı" onKapat=${onKapat} butonlar=${[{ metin: 'Tümü, grafik', onClick: onTumu }, { metin: 'Kapat', onClick: onKapat }]}>
    <div class="sutun g8">
      <div class="sar">${KART_TUTARLARI.map((e) => html`<${Cip} metin=${e + ' €'} secili=${secili === e} renk=${RENK.sari} onClick=${() => setSecili(e)} />`)}</div>
      <button class="anabtn" onClick=${() => Is.paraEkle(bugun, secili * 100)}>Ekle · ${secili} €</button>
      <span class="ts">Bu ay · ${tutarMetni(buAy.reduce((s, p) => s + p.tutarSent, 0))}</span>
      ${buAy.length === 0 && html`<span class="bk soluk">Bu ay henüz yükleme yok.</span>`}
      ${buAy.slice(0, 8).map((p) => html`<div class="satir"><span class="bk soluk dolu">${gunAyHg(p.gun)}</span><span class="bk">${tutarMetni(p.tutarSent)}</span></div>`)}
      ${buAy.length > 8 && html`<span class="bk soluk">+${buAy.length - 8} kayıt daha</span>`}
    </div>
  </${Dialog}>`;
}

/** Düzen modunda blok başında ↑ ↓. Uzun basınca düzen modu açılır. */
function BlokCercevesi({ anahtar, sira, toplam, duzenMod, onTasi, onUzun, children }) {
  const ad = { gun: 'Bugün / Hafta', zincir: 'Zincirler', sayac: 'Sayaçlar' }[anahtar] ?? 'Butonlar';
  const u = uzunBas(onUzun, null);
  return html`<div onPointerDown=${u.onPointerDown} onPointerUp=${u.onPointerUp} onPointerLeave=${u.onPointerLeave} onPointerCancel=${u.onPointerCancel} onPointerMove=${u.onPointerMove}>
    ${duzenMod && html`<div class="satir">
      <span class="lk c-sari dolu">${ad}</span>
      <${MetinButon} disabled=${sira === 0} onClick=${() => onTasi(-1)}>↑ yukarı</${MetinButon}>
      <${MetinButon} disabled=${sira >= toplam - 1} onClick=${() => onTasi(1)}>↓ aşağı</${MetinButon}>
    </div>`}
    ${children}
  </div>`;
}

/** Hızlı etkinlik yakalama: Notlar'a (İşlenmemiş) düşer; sonra nottan "Etkinlik yap". */
function EtkinlikYakalaDialog({ onKapat, onKaydet }) {
  const [m, setM] = useState('');
  return html`<${Dialog} baslik="Etkinlik yakala" onKapat=${onKapat}
    butonlar=${[{ metin: 'Vazgeç', onClick: onKapat }, { metin: 'Kaydet', disabled: !m.trim(), onClick: () => onKaydet(m.trim()) }]}>
    <span class="bk">Ne, nerede, ne zaman? Kısaca yaz ya da söyle. Notlar'da İşlenmemiş kutusuna düşer.</span>
    <div class="satir" style="gap:4px"><div class="dolu"><${Girdi} tek=${false} stil=${{ minHeight: '70px' }} deger=${m} onDeger=${setM} ipucu="örn. Dachau şehir festivali 14 Haziran" otomatik /></div>
      <${SesleYaz} onMetin=${(s) => setM(m.trim() ? `${m} ${s}` : s)} /></div>
  </${Dialog}>`;
}

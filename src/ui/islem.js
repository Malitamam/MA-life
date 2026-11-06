// AnaVM eylemleri: depo çağrısı + "Geri al" çubuğu mesajı.
import { M, sonIslem } from './durum.js';
import { SayacMantik, tutarMetni } from '../mantik.js';

export const Is = {
  yap(isId, ad, tutarSent = null, zaman = null) {
    const id = zaman != null ? M.depo.isYap(isId, zaman, tutarSent) : M.depo.isYap(isId, undefined, tutarSent);
    if (id > 0) sonIslem(`${ad} kaydedildi`, id);
  },
  sayacYap(anahtar, ek) {
    const id = M.depo.sayacYap(anahtar, ek);
    if (id > 0) sonIslem(SayacMantik.metin(SayacMantik.hazir(anahtar)?.ad ?? 'Sayaç', ek) + ' +1', id);
  },
  geriAl(kayitId) { M.depo.geriAl(kayitId); sonIslem(null); },
  elleKayit(metin, gun, kat) { const id = M.depo.elleKayit(metin, gun, kat); sonIslem('Günlüğe yazıldı', id); },
  ajandaTikle(id, olay, baslik) { const k = M.depo.ajandaTikle(id, olay); if (k > 0) sonIslem(`${baslik}: yapıldı`, k); },
  alimEkle(urunId, gun, adet, odenen, normal, yer) { const id = M.depo.alimEkle(urunId, gun, adet, odenen, normal, yer); if (id > 0) sonIslem('Alım kaydedildi', id); },
  alisverisiBitir() { const n = M.depo.alisverisiBitir(); if (n > 0) sonIslem(`Markete gidildi, ${n} ürün`, -1); },
  paraEkle(gun, sent) { const id = M.depo.paraEkle(gun, sent); sonIslem(`${tutarMetni(sent)} yüklendi`, id); },
  takviyeKaydet(t) { if (!t.id) M.db.ekle('takviyeler', t); else M.db.yaz('takviyeler', t); M.depo.takviyeKontrol(); },
  urunKaydet(u) { if (!u.id) return M.db.ekle('urunler', u); M.db.yaz('urunler', u); return u.id; },
  notKaydet(n) { if (!n.id) return M.db.ekle('notlar', n); M.db.yaz('notlar', n); return n.id; },
  notIslendi(id) { const n = M.db.getir('notlar', id); if (n && !n.islendi) M.db.guncelle('notlar', id, { islendi: true }); },
  notSil(n) { if (n.sesYolu) M.db.sesSil(n.sesYolu).catch(() => {}); M.db.sil('notlar', n.id); },
};

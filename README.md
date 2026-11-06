# MA-life · MALI

MALI'nin web sürümü: telefona kurulan uygulama (PWA). Ev işleri, sayaçlar, zincirler, ajanda, alışveriş, stok, takviye, şirket kartı, notlar ve günlük.

- Açmak: https://malitamam.github.io/MA-life/ (Chrome → ⋮ → "Uygulamayı yükle" / "Ana ekrana ekle")
- Veriler telefonda, tarayıcının IndexedDB'sinde durur. Ayarlar → Yedek ile Drive'a paylaşılır; Android MALI'nin `mali-….json` yedeği de içe aktarılır.
- Her `main` gönderiminde testler çalışır ve site GitHub Pages'e yayınlanır. Uygulama yeniden açılınca yeni sürüm gelir.

Yapı: derleme adımı yok. `vendor/preact-htm.js` (Preact + htm), `src/` altında ES modülleri:
`tarih.js` (gün hesapları), `mantik.js` (Android'deki hesapların birebir karşılığı), `db.js` (IndexedDB), `depo.js` (işlemler, tohum veri, yedek), `sistem.js` (yedek, sabah özeti), `ui/` (ekranlar).

Test: `npm test`

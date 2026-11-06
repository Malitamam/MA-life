// Önce ağ: internet varken her açılışta en yeni sürüm gelir; yoksa son kaydedilen sürüm açılır.
const ON_BELLEK = 'mali-v1';

const DOSYALAR = ["./", "index.html", "stil.css", "manifest.webmanifest", "fonts/quicksand.ttf", "vendor/preact-htm.js", "ikon/192.png", "ikon/512.png", "src/app.js", "src/db.js", "src/depo.js", "src/ikonlar.js", "src/mantik.js", "src/sistem.js", "src/tarih.js", "src/ui/ajanda.js", "src/ui/alim.js", "src/ui/durum.js", "src/ui/ekstra.js", "src/ui/gunluk.js", "src/ui/islem.js", "src/ui/notlar.js", "src/ui/ortak.js", "src/ui/pano.js", "src/ui/sayac.js", "src/ui/ses.js", "src/ui/takip.js", "src/ui/zincir.js", "src/ui/ev.js", "src/ev/plan.js", "src/ev/cizim.js", "src/ev/goz.js"];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(ON_BELLEK).then((c) => c.addAll(DOSYALAR)).catch(() => {}));
});
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(ON_BELLEK);
    try {
      const yanit = await fetch(r, { cache: 'no-cache' });
      if (yanit.ok) c.put(r, yanit.clone());
      return yanit;
    } catch {
      const eski = await c.match(r, { ignoreSearch: true }) ?? (r.mode === 'navigate' ? await c.match('./') ?? await c.match('index.html') : null);
      return eski ?? Response.error();
    }
  })());
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const l = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (l[0]) return l[0].focus();
    return self.clients.openWindow(e.notification.data?.url ?? './');
  })());
});

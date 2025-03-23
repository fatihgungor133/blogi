// service-worker.js
const CACHE_NAME = 'manisa-haber-cache-v2';
const CONTENT_CACHE_NAME = 'manisa-haber-content-cache-v2';
const API_CACHE_PREFIX = 'api-cache-';

// Önbelleğe alınacak statik varlıklar
const staticAssets = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo.png',
];

// Servis işçisi kurulumu
self.addEventListener('install', async event => {
  console.log('Service Worker kuruldu (v2)');
  
  // Statik varlıkları önbelleğe al
  const cache = await caches.open(CACHE_NAME);
  cache.addAll(staticAssets);
  
  // Hemen aktifleştir
  self.skipWaiting();
});

// Aktifleştirme olayı - TÜM ESKİ ÖNBELLEKLERİ TEMİZLE
self.addEventListener('activate', event => {
  console.log('Service Worker aktifleştirildi (v2)');
  
  // Eski önbellekleri temizle - TÜM ÖNBELLEKLERİ SİL
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          // Yeni cache versiyonları dışındaki tüm önbellekleri sil
          if (key !== CACHE_NAME && key !== CONTENT_CACHE_NAME) {
            console.log('Eski önbellek siliniyor:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  
  // Tüm istemcilerde kontrolü al
  self.clients.claim();
});

// Fetch - API isteklerini önbelleğe alma
self.addEventListener('fetch', event => {
  // Yalnızca get isteklerini ele alıyoruz
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  
  // İçerik API'sini ele al
  if (requestUrl.pathname.match(/\/api\/content\/\d+$/)) {
    // Stale-while-revalidate stratejisi - önce cache, sonra network
    event.respondWith(
      caches.open(CONTENT_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        
        // Ağdan verileri al (arka planda)
        const networkPromise = fetch(event.request.clone())
          .then(response => {
            // Yanıt başarılıysa önbelleğe yeni verileri al
            if (response && response.status === 200) {
              cache.put(event.request, response.clone())
                .catch(err => console.error('Önbelleğe alma hatası:', err));
            }
            return response;
          })
          .catch(err => {
            console.error('Ağ isteği hatası:', err);
            // Ağ hatası durumunda önbellekte var mı diye kontrol et
            return cachedResponse || Response.error();
          });
        
        // Önbellekte varsa hemen döndür, yoksa ağdan yanıtı bekle
        return cachedResponse || networkPromise;
      })
    );
    return;
  }

  // Normal sayfa yükleme istekleri için network-first stratejisi
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Başarılı yanıtları önbelleğe al
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseToCache))
            .catch(err => console.error('Önbelleğe alma hatası:', err));
        }
        return networkResponse;
      })
      .catch(error => {
        // Ağ hatası durumunda önbellekten yanıt vermeyi dene
        console.log('Ağ hatası, önbellekten yanıt alınıyor:', error);
        return caches.match(event.request);
      })
  );
}); 
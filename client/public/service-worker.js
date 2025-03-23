// service-worker.js
const CACHE_NAME = 'manisa-haber-cache-v1';
const CONTENT_CACHE_NAME = 'manisa-haber-content-cache-v1';

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
  console.log('Service Worker kuruldu');
  
  // Statik varlıkları önbelleğe al
  const cache = await caches.open(CACHE_NAME);
  cache.addAll(staticAssets);
  
  // Hemen aktifleştir
  self.skipWaiting();
});

// Aktifleştirme olayı
self.addEventListener('activate', event => {
  console.log('Service Worker aktifleştirildi');
  
  // Eski önbellekleri temizle
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
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
  // API istekleri için özel cache stratejisi
  if (event.request.url.includes('/api/content/')) {
    // Stale-while-revalidate stratejisi
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // Diğer istekler için network-first stratejisi
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 404 veya 500 gibi hata yanıtlarını önbelleğe alma
        if (!response || response.status !== 200) {
          return response;
        }

        // Yanıtın bir kopyasını önbelleğe al
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });

        return response;
      })
      .catch(() => {
        // Ağ başarısız olursa önbellekten yanıt ver
        return caches.match(event.request);
      })
  );
});

// İçerik API'si için stale-while-revalidate stratejisi
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CONTENT_CACHE_NAME);
  
  // Önce önbellekten kontrol et
  const cachedResponse = await cache.match(request);
  
  // Arka planda network isteği başlat
  const networkResponsePromise = fetch(request).then(networkResponse => {
    // Sadece başarılı yanıtları önbelleğe al
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(error => {
    console.error('Network isteği başarısız:', error);
    return null;
  });
  
  // Eğer önbellekte varsa önce onu döndür
  return cachedResponse || networkResponsePromise;
} 
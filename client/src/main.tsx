import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Ana uygulama kodunu oluştur
const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);

// Service Worker yönetimi
if ('serviceWorker' in navigator) {
  // Önce tüm service worker'ları kaldır ve önbelleği temizle
  const clearServiceWorkerCache = async () => {
    try {
      // Tüm service workerları bul
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      // Her birini kaldır
      for (const registration of registrations) {
        await registration.unregister();
        console.log('Service worker kaldırıldı');
      }
      
      // Önbellekleri temizle
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log(`Önbellek temizleniyor: ${cacheName}`);
            return caches.delete(cacheName);
          })
        );
        console.log('Tüm önbellekler temizlendi');
      }
      
      return true;
    } catch (error) {
      console.error('Service worker temizleme hatası:', error);
      return false;
    }
  };

  // Sayfa yüklendiğinde service worker'ı temizle ve yeniden yükle
  window.addEventListener('load', async () => {
    try {
      // Eğer sayfa URL'inde "clearCache" parametresi varsa önbelleği temizle
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('clearCache')) {
        await clearServiceWorkerCache();
        // Parametreyi kaldırarak sayfayı yenile
        urlParams.delete('clearCache');
        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.location.href = newUrl;
        return;
      }
      
      // Service worker'ı kaydet
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        updateViaCache: 'none' // Tarayıcı önbelleğini atlayarak her zaman yeni sürümü kontrol et
      });
      
      console.log('Service worker başarıyla kaydedildi:', registration.scope);
      
      // Her 30 dakikada bir service worker'ı güncelle
      setInterval(() => {
        registration.update();
        console.log('Service worker güncellemesi kontrol ediliyor');
      }, 30 * 60 * 1000);
    } catch (error) {
      console.error('Service worker kaydı başarısız:', error);
    }
  });
}

// Web Vitals ölçümlerini başlatma işlemini ana içerik yüklendikten sonraya ertele
if (typeof window !== 'undefined') {
  // requestIdleCallback API varsa kullan, yoksa setTimeout kullan
  const scheduleTask = 'requestIdleCallback' in window 
    ? (window as any).requestIdleCallback 
    : (fn: Function) => setTimeout(fn, 100);
  
  // Sayfa yüklendikten sonra web-vitals'ı yükle
  window.addEventListener('load', () => {
    scheduleTask(async () => {
      try {
        const { measureWebVitals, observePerformance } = await import('./lib/web-vitals');
        
        // Web Vitals'ı yükle
        measureWebVitals();
        
        // Performans gözlemcilerini başlat
        observePerformance();
        
        console.log('Performance monitoring initialized');
      } catch (error) {
        console.error('Performance monitoring failed to initialize:', error);
      }
    });
  });
}

import { Metric } from 'web-vitals';

// Web Vitals metrikleri için analitik endpointimiz
// Production'da gerçek bir endpoint'e göndermek istiyorsanız burayı değiştirin
const analyticsEndpoint = '/api/analytics/vitals';

/**
 * Web Vitals metriklerini raporlama fonksiyonu
 * @param metric web-vitals kütüphanesinden gelen metrik
 */
export function reportWebVitals(metric: Metric): void {
  // Metriği konsola yazdır (geliştirme aşamasında faydalı)
  if (process.env.NODE_ENV !== 'production') {
    console.log(metric);
  }

  // Metriği sunucuya gönder
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating, // 'good', 'needs-improvement' veya 'poor'
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    page: window.location.pathname,
    timestamp: Date.now(),
  });

  // Beacon API destekleniyorsa, onu kullan (sayfa kapanırken bile çalışır)
  if (navigator.sendBeacon) {
    navigator.sendBeacon(analyticsEndpoint, body);
  } else {
    // Desteklenmiyorsa fetch API kullan
    fetch(analyticsEndpoint, {
      body,
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch(error => {
      console.error('Web vitals raporu gönderilemedi:', error);
    });
  }
}

/**
 * Web Vitals metrikleri ölçmeye başlama
 */
export async function measureWebVitals(): Promise<void> {
  try {
    const { onCLS, onFID, onLCP, onFCP, onTTFB } = await import('web-vitals');
    
    // Core Web Vitals metriklerini izle
    onCLS(reportWebVitals);  // Cumulative Layout Shift
    onFID(reportWebVitals);  // First Input Delay
    onLCP(reportWebVitals);  // Largest Contentful Paint
    
    // Diğer önemli metrikler
    onFCP(reportWebVitals);  // First Contentful Paint
    onTTFB(reportWebVitals); // Time to First Byte
  } catch (error) {
    console.error('Web vitals yüklenemedi:', error);
  }
}

/**
 * Performans gözlemcisi ile düzen kaymasını ve uzun görevleri tespit etme
 */
export function observePerformance(): void {
  if (typeof window === 'undefined' || !window.PerformanceObserver) {
    return;
  }

  try {
    // Düzen Kayması (Layout Shift) Ölçümü
    const layoutShiftObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as PerformanceEntry[]) {
        // @ts-ignore: layout-shift özel özellikler içeriyor
        if (entry.hadRecentInput === false && entry.value >= 0.05) {
          console.warn('Büyük düzen kayması tespit edildi:', {
            value: entry.value,
            time: entry.startTime,
            url: window.location.href,
          });
        }
      }
    });
    
    layoutShiftObserver.observe({ type: 'layout-shift', buffered: true });

    // Uzun Görevler (Long Task) Ölçümü
    const longTaskObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.duration > 50) { // 50ms'den uzun görevler
          console.warn('Uzun görev tespit edildi:', {
            duration: entry.duration,
            time: entry.startTime,
            url: window.location.href,
          });
        }
      }
    });
    
    longTaskObserver.observe({ type: 'longtask', buffered: true });

    // Sayfa kaynak yükleme performansı
    const resourceObserver = new PerformanceObserver((entryList) => {
      const slowResources = entryList.getEntries().filter(entry => entry.duration > 1000);
      
      if (slowResources.length) {
        console.warn('Yavaş yüklenen kaynaklar:', slowResources);
      }
    });
    
    resourceObserver.observe({ type: 'resource', buffered: true });

    return () => {
      layoutShiftObserver.disconnect();
      longTaskObserver.disconnect();
      resourceObserver.disconnect();
    };
  } catch (error) {
    console.error('Performans gözlemcisi başlatılamadı:', error);
  }
} 
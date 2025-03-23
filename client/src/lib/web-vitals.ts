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

// Uzun görevleri kaydeden bir harita - sorunlu alanları tespit etmek için
const longTasksMap = new Map<string, number>();

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
        if (entry.hadRecentInput === false && entry.value >= 0.1) {
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
        // 50ms'den uzun görevler için uyarı
        if (entry.duration > 50) {
          const taskInfo = {
            duration: entry.duration,
            time: entry.startTime,
            url: window.location.href,
          };
          
          console.warn('Uzun görev tespit edildi:', taskInfo);
          
          // URL'yi sayfaya göre gruplandır
          const pageUrl = window.location.pathname;
          const currentCount = longTasksMap.get(pageUrl) || 0;
          longTasksMap.set(pageUrl, currentCount + 1);
          
          // Eğer aynı sayfada çok sayıda uzun görev varsa, detaylı inceleme için kod analizi öner
          if (currentCount >= 3) {
            console.error(`${pageUrl} sayfasında çok sayıda uzun görev tespit edildi. Sayfa kodunu optimize edin.`);
            optimizePagePerformance();
          }
        }
      }
    });
    
    // Sadece long task'ları değil tüm task'ları gözlemle
    try {
      longTaskObserver.observe({ type: 'longtask', buffered: true });
    } catch (e) {
      console.warn('LongTask API desteklenmiyor:', e);
    }

    // Sayfa kaynak yükleme performansı
    const resourceObserver = new PerformanceObserver((entryList) => {
      const slowResources = entryList.getEntries().filter(entry => entry.duration > 1000);
      
      if (slowResources.length) {
        console.warn('Yavaş yüklenen kaynaklar:', slowResources);
      }
    });
    
    resourceObserver.observe({ type: 'resource', buffered: true });

    // First Paint ve First Contentful Paint izleme
    const paintObserver = new PerformanceObserver((entryList) => {
      const paintEntries = entryList.getEntries();
      for (const entry of paintEntries) {
        console.log(`${entry.name}: ${entry.startTime}`);
      }
    });
    
    paintObserver.observe({ type: 'paint', buffered: true });

    return () => {
      layoutShiftObserver.disconnect();
      longTaskObserver.disconnect();
      resourceObserver.disconnect();
      paintObserver.disconnect();
    };
  } catch (error) {
    console.error('Performans gözlemcisi başlatılamadı:', error);
  }
}

/**
 * Sayfa performansını iyileştirmek için öneriler sunar
 * Uzun görevleri azaltmak için kullanılır
 */
function optimizePagePerformance() {
  if (process.env.NODE_ENV !== 'production') {
    console.info(`
=== PERFORMANS İYİLEŞTİRME ÖNERİLERİ ===
1. Ağır hesaplamaları requestIdleCallback veya Web Worker'a taşıyın
2. JavaScript'i daha küçük parçalara bölerek bölünmüş yükleme yapın
3. Büyük bileşenleri React.lazy() ile ihtiyaç duyulduğunda yükleyin
4. Gereksiz render işlemlerini useMemo ve useCallback ile azaltın
5. Büyük listeler için sanal liste kullanın (windowing/virtualization)
6. setTimeout ile ağır işlemleri daha küçük işlere bölün
7. İmaj optimizasyonu için next/image veya lazy loading kullanın
8. Font yükleme stratejinizi gözden geçirin, display=swap kullanın
9. Büyük JS kütüphanelerinin alternatiflerini değerlendirin
10. React Profiler ile gereksiz render'ları tespit edin
`);
  }
  
  // Tarayıcı performans analizi verilerini topla
  const performanceMetrics = {
    memory: (window.performance as any).memory ? {
      usedJSHeapSize: (window.performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (window.performance as any).memory.totalJSHeapSize,
    } : "Not available",
    navigation: window.performance.getEntriesByType('navigation'),
    resources: window.performance.getEntriesByType('resource'),
    longTasks: Array.from(longTasksMap.entries())
  };
  
  // Tarayıcı bellek/performans durumunu değerlendir
  if ((window.performance as any).memory && 
      (window.performance as any).memory.usedJSHeapSize > 300 * 1024 * 1024) {
    console.warn('Yüksek bellek kullanımı tespit edildi! Bellek sızıntılarını kontrol edin.');
  }
  
  // Tarayıcı konsol API'si süslü çıktı verir
  console.groupCollapsed('Detaylı performans metrikleri');
  console.table(performanceMetrics);
  console.groupEnd();
} 
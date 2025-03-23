import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Ana uygulama kodunu oluştur
const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);

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

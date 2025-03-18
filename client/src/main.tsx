import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./globals.css";
import { measureWebVitals, observePerformance } from './lib/web-vitals';

// Web Vitals ölçümlerini başlat
if (typeof window !== 'undefined') {
  // Web Vitals'ı yükle
  measureWebVitals();
  
  // Performans gözlemcilerini başlat
  observePerformance();
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

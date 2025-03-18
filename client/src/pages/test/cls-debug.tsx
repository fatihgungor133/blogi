import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type CLSEntry = {
  value: number;
  time: number;
  element?: string;
  url: string;
};

export default function CLSDebugPage() {
  const [clsEvents, setClsEvents] = useState<CLSEntry[]>([]);
  const [totalCLS, setTotalCLS] = useState<number>(0);
  const [cssProperty, setCssProperty] = useState<string>("");
  const [cssValue, setCssValue] = useState<string>("");
  const [testElement, setTestElement] = useState<HTMLDivElement | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // PerformanceObserver kurulumu
  useEffect(() => {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    let clsValue = 0;
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceEntry[]) {
        // @ts-ignore: layout-shift özel özellikler içeriyor
        if (entry.hadRecentInput === false) {
          const entryValue = (entry as any).value;
          clsValue += entryValue;
          setTotalCLS(parseFloat(clsValue.toFixed(4)));
          
          // Etkilenen elemanları tespit et
          let elementInfo = "Bilinmiyor";
          try {
            // @ts-ignore: layout-shift özel özellikler içeriyor
            const sources = entry.sources || [];
            if (sources.length > 0 && sources[0].node) {
              const node = sources[0].node;
              const tagName = node.tagName?.toLowerCase() || "bilinmeyen";
              const id = node.id ? `#${node.id}` : "";
              const classList = Array.from(node.classList || []).map(c => `.${c}`).join("");
              elementInfo = `${tagName}${id}${classList}`;
            }
          } catch (e) {
            console.error("Element bilgisi alınamadı:", e);
          }
          
          const newEntry: CLSEntry = {
            value: entryValue,
            time: entry.startTime,
            element: elementInfo,
            url: window.location.href
          };
          
          setClsEvents(prev => [...prev, newEntry]);
        }
      }
    });
    
    observer.observe({ type: 'layout-shift', buffered: true });
    
    return () => {
      observer.disconnect();
    };
  }, []);

  // Test fonksiyonu - CSS değişikliği yaparak layout shift tetikler
  const triggerLayoutShift = () => {
    if (!testElement || !cssProperty || !cssValue) return;
    
    // CSS özelliğini değiştir
    (testElement.style as any)[cssProperty] = cssValue;
  };
  
  // Rastgele CSS değişikliği yaparak otomatik test
  const runAutomaticTest = () => {
    if (!testElement) return;
    
    setIsRunning(true);
    
    // Rastgele CSS değişiklikleri
    const properties = ['width', 'height', 'margin-top', 'padding', 'font-size'];
    const values = ['100px', '200px', '50px', '10px', '24px', '0px'];
    
    let counter = 0;
    const interval = setInterval(() => {
      if (counter >= 10 || !isRunning) {
        clearInterval(interval);
        setIsRunning(false);
        return;
      }
      
      const randomProp = properties[Math.floor(Math.random() * properties.length)];
      const randomValue = values[Math.floor(Math.random() * values.length)];
      
      setCssProperty(randomProp);
      setCssValue(randomValue);
      (testElement.style as any)[randomProp] = randomValue;
      
      counter++;
    }, 1000);
    
    return () => {
      clearInterval(interval);
      setIsRunning(false);
    };
  };
  
  const stopTest = () => {
    setIsRunning(false);
  };
  
  const resetTest = () => {
    if (!testElement) return;
    
    // Test elementini sıfırla
    testElement.style.cssText = "min-height: 100px; width: 100%; background-color: #f3f4f6; padding: 10px; transition: none;";
    setClsEvents([]);
    setTotalCLS(0);
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <Helmet>
        <title>CLS Debug - Layout Shift Tespiti</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Cumulative Layout Shift (CLS) Tespiti</CardTitle>
          <p className="text-muted-foreground">
            Bu sayfa, Layout Shift sorunlarını tespit etmenize yardımcı olur.
          </p>
        </CardHeader>
        
        <CardContent>
          <div className="grid gap-6">
            <div ref={setTestElement} style={{ minHeight: '100px', width: '100%', backgroundColor: '#f3f4f6', padding: '10px' }}>
              <h3 className="text-lg font-medium">Test Alanı</h3>
              <p>Bu alan CSS değişikliklerini test etmek için kullanılır.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="css-property">CSS Özelliği</Label>
                <Input
                  id="css-property"
                  placeholder="width, height, margin, padding, vb."
                  value={cssProperty}
                  onChange={(e) => setCssProperty(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="css-value">CSS Değeri</Label>
                <Input
                  id="css-value"
                  placeholder="100px, 50%, 2rem, vb."
                  value={cssValue}
                  onChange={(e) => setCssValue(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button onClick={triggerLayoutShift} variant="default">
                Layout Shift Tetikle
              </Button>
              
              {!isRunning ? (
                <Button onClick={runAutomaticTest} variant="secondary">
                  Otomatik Test Başlat
                </Button>
              ) : (
                <Button onClick={stopTest} variant="destructive">
                  Testi Durdur
                </Button>
              )}
              
              <Button onClick={resetTest} variant="outline">
                Sıfırla
              </Button>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-2">Toplam CLS Değeri: {totalCLS}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                0.1 veya altı: İyi | 0.1 - 0.25: İyileştirme Gerekli | 0.25+: Kötü
              </p>
              
              {clsEvents.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <div className="grid grid-cols-3 bg-muted p-3 font-medium">
                    <div>CLS Değeri</div>
                    <div>Etkilenen Element</div>
                    <div>Zaman (ms)</div>
                  </div>
                  
                  <div className="divide-y">
                    {clsEvents.map((event, i) => (
                      <div key={i} className="grid grid-cols-3 p-3">
                        <div>{event.value.toFixed(4)}</div>
                        <div className="text-sm truncate">{event.element}</div>
                        <div>{event.time.toFixed(0)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p>Henüz layout shift tespit edilmedi. Test edin veya sayfada gezinin.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
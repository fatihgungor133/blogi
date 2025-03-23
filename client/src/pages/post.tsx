import { useEffect, useState } from "react";
import { useRoute, useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { getPost, viewPost } from "@/lib/api";
import { formatDate, getFromLocalCache, saveToLocalCache } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, List, RefreshCw } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumb } from "@/components/Breadcrumb";
import { parseHeadings, addHeadingIds } from "@/lib/utils";
import type { Content } from "@shared/schema";
import { ShareButtons } from "@/components/ShareButtons";

// Görüntüleme kaydı için bir araç fonksiyonu
async function recordView(id: string) {
  try {
    // Önbelleğe almayı kesinlikle önlemek için, URL'ye timestamp ekleyelim
    const timestamp = new Date().getTime();
    const response = await fetch(`/api/views/record?id=${id}&t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      // Önbelleğe almayı kesinlikle reddetmek için
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Görüntüleme kaydedilemedi');
    }
  } catch (error) {
    console.error('Görüntüleme kaydedilirken hata oluştu:', error);
  }
}

// Cache anahtarı oluşturma fonksiyonu
const getContentCacheKey = (id: number) => [`/api/content`, id];
const getLocalStorageKey = (id: number) => `content_${id}`;

export default function Post() {
  const { id, slug } = useParams();
  const { theme } = useTheme();
  const [hasViewed, setHasViewed] = useState(false);
  const [layoutShifts, setLayoutShifts] = useState<{value: number, time: number}[]>([]);
  const queryClient = useQueryClient();
  const [retryCount, setRetryCount] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // URL'deki id parametresini sayıya çevir
  const postId = id ? parseInt(id, 10) : 0;

  // Önbelleği temizleme fonksiyonu
  const clearPostCache = () => {
    try {
      // LocalStorage'dan temizle
      localStorage.removeItem(getLocalStorageKey(postId));
      
      // React Query önbelleğinden temizle
      queryClient.removeQueries({ queryKey: getContentCacheKey(postId) });
      
      console.log(`İçerik önbelleği temizlendi: ID=${postId}`);
      
      // Yeniden denemek için sayaç artır
      setRetryCount(prev => prev + 1);
      setFetchError(null);
    } catch (error) {
      console.error('Önbellek temizleme hatası:', error);
    }
  };

  // Önce yerel önbellekten içeriğe erişmeyi dene
  const [localCachedContent, setLocalCachedContent] = useState<Content | null>(null);

  // Önbellekten içeriği yükleme
  useEffect(() => {
    if (postId > 0) {
      const cached = getFromLocalCache<Content>(getLocalStorageKey(postId));
      if (cached) {
        setLocalCachedContent(cached);
        console.log("İçerik yerel önbellekten yüklendi");
      }
    }
  }, [postId, retryCount]);

  // İçerik sorgusu
  const { data: content, isLoading, error, isError } = useQuery<Content>({
    queryKey: [...getContentCacheKey(postId), retryCount], // retryCount ekleyerek yeniden yükleme sağlanıyor
    queryFn: async () => {
      setFetchError(null);
      try {
        // Doğrudan ağdan al - önbellek sorunlarını çözmek için
        const response = await fetch(`/api/content/${postId}?t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          cache: 'no-store' // Fetch API'de önbelleği devre dışı bırak
        });
        
        if (!response.ok) {
          throw new Error(`API yanıt hatası: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Geçerli içerik kontrolü
        if (!data || !data.id || !data.content) {
          throw new Error('API geçersiz içerik döndürdü');
        }
        
        // Başarılı veriyi önbelleğe kaydet
        saveToLocalCache(getLocalStorageKey(postId), data);
        
        return data;
      } catch (error) {
        console.error('İçerik yükleme hatası:', error);
        setFetchError(error instanceof Error ? error.message : 'Bilinmeyen hata');
        
        // Önbellekte varsa onu kullan
        const cachedContent = getFromLocalCache<Content>(getLocalStorageKey(postId));
        if (cachedContent) {
          console.log('Hata durumunda önbellekten veri kullanılıyor');
          return cachedContent;
        }
        
        throw error;
      }
    },
    enabled: postId > 0,
    initialData: localCachedContent,
    retry: 2,
    retryDelay: 1000,
    // HARD CACHE AYARLARI
    staleTime: 1000 * 60 * 60 * 24,
    cacheTime: 1000 * 60 * 60 * 24 * 7,
    refetchOnWindowFocus: false,
    refetchOnMount: false, 
    refetchOnReconnect: false,
  });

  // Diğer içerikler için ön yükleme (preloading)
  useEffect(() => {
    if (content && content.id) {
      // Bir sonraki içeriği de ön yükle (varsa)
      const nextPostId = content.id + 1;
      queryClient.prefetchQuery({
        queryKey: getContentCacheKey(nextPostId),
        queryFn: () => {
          // Önce yerel önbellekten kontrol et
          const cachedContent = getFromLocalCache<Content>(getLocalStorageKey(nextPostId));
          if (cachedContent) {
            return Promise.resolve(cachedContent);
          }
          
          // Önbellekte yoksa sunucudan al
          return fetch(`/api/content/${nextPostId}`)
            .then(res => res.json())
            .then(data => {
              // Yerel önbelleğe kaydet
              saveToLocalCache(getLocalStorageKey(nextPostId), data);
              return data;
            });
        },
        staleTime: 1000 * 60 * 60 * 24, // 24 saat
      });
    }
  }, [content, queryClient]);

  // CLS (Cumulative Layout Shift) izleme
  useEffect(() => {
    // CLS'yi izleyen PerformanceObserver
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        // Toplam CLS değeri
        let cumulativeLayoutShiftScore = 0;
        
        const observer = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            // Layout shift değeri
            if (!entry.hadRecentInput) {
              const currentShift = entry.value;
              cumulativeLayoutShiftScore += currentShift;
              
              // 0.1'den büyük layout shiftleri kaydet
              if (currentShift > 0.05) {
                console.log(`Layout shift tespit edildi: ${currentShift.toFixed(4)}`);
                setLayoutShifts(prev => [...prev, {
                  value: currentShift,
                  time: entry.startTime
                }]);
                
                // Büyük layout shiftleri tespit et (>0.1)
                if (currentShift > 0.1) {
                  console.warn(`Büyük düzen kayması tespit edildi: ${currentShift.toFixed(4)} at ${entry.startTime.toFixed(0)}ms`);
                }
              }
            }
          }
        });
        
        // Layout shift'leri izle
        observer.observe({ type: 'layout-shift', buffered: true });
        
        return () => {
          observer.disconnect();
        };
      } catch (e) {
        console.error('Layout shift izleme hatası:', e);
      }
    }
  }, []);

  // Görüntüleme sayısını kaydetme mutasyonu
  const viewMutation = useMutation({
    mutationFn: (id: string) => recordView(id),
  });

  useEffect(() => {
    if (content && id && !hasViewed) {
      // Sadece bir kere görüntüleme kaydı yapıyoruz
      viewMutation.mutate(id);
      setHasViewed(true);
    }
  }, [content, id, hasViewed, viewMutation]);

  // Minimum içerik yüksekliği - CLS önleme için ama boşluk sorununu çözmek için düşürüldü
  const minContentHeight = "min-h-[50vh]";

  if (isLoading) {
    return (
      <div className={cn("container mx-auto p-4", minContentHeight)}>
        <Card className="animate-pulse border border-border rounded-lg shadow-sm">
          <CardHeader className="py-3 px-4">
            <Skeleton className="h-10 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-1" />
            <Skeleton className="h-3 w-32" />
          </CardHeader>
          
          <div className="p-6">            
            <div className="space-y-4 mt-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
          
          <CardContent className="p-6 border-t">
            <Skeleton className="h-8 w-full mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !content) {
    return (
      <div className={cn("container mx-auto p-4", minContentHeight)}>
        <Card className="bg-destructive/10">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-bold">İçerik bulunamadı</h1>
            <p className="mt-4">
              Aradığınız içerik bulunamadı veya geçici bir hata oluştu.
            </p>
            
            {fetchError && (
              <div className="mt-4 p-3 bg-destructive/5 rounded text-left text-sm">
                <p className="font-semibold">Hata detayı:</p>
                <p>{fetchError}</p>
              </div>
            )}
            
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="flex items-center"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Sayfayı Yenile
              </Button>
              
              <Button 
                variant="default" 
                onClick={clearPostCache}
                className="flex items-center"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Önbelleği Temizle ve Yeniden Dene
              </Button>
              
              <Link href="/">
                <Button variant="secondary" className="w-full sm:w-auto">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Ana Sayfaya Dön
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // İçeriği lokal storage'a da kaydet
  useEffect(() => {
    if (content) {
      saveToLocalCache(getLocalStorageKey(content.id), content);
    }
  }, [content]);

  const truncatedContent = content.content.substring(0, 160);
  const currentSlug = content.slug || `icerik-${content.id}`;
  const contentWithIds = addHeadingIds(content.content);
  const headings = parseHeadings(content.content);
  const currentUrl = `${window.location.origin}/post/${content.baslik_id}/${currentSlug}`;

  // Redirect if slug doesn't match
  if (slug !== currentSlug) {
    window.location.href = `/post/${content.baslik_id}/${currentSlug}`;
    return null;
  }

  // Schema.org TableOfContents markup
  const tableOfContentsSchema = {
    "@context": "https://schema.org",
    "@type": "Makale",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${window.location.origin}/post/${content.baslik_id}/${currentSlug}`
    },
    "name": content.title || `İçerik #${content.id}`,
    "hasPart": headings.map(heading => ({
      "@type": "WebPageElement",
      "name": heading.text,
      "url": `${window.location.origin}/post/${content.baslik_id}/${currentSlug}#${heading.id}`
    }))
  };

  return (
    <>
      <Helmet>
        <title>{content.title}</title>
        <meta name="description" content={truncatedContent} />
        <meta property="og:title" content={content.title} />
        <meta property="og:description" content={truncatedContent} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={content.title} />
        <meta name="twitter:description" content={truncatedContent} />
      </Helmet>

      <div className={cn("container mx-auto p-4", minContentHeight)}>
        <Seo 
          title={content.title || `İçerik #${content.id}`}
          description={truncatedContent}
          type="article"
          canonicalUrl={currentUrl}
          breadcrumb={[
            { position: 1, name: "Ana Sayfa", item: `${window.location.origin}/` },
            { position: 2, name: "Blog Yazıları", item: `${window.location.origin}/` },
            { position: 3, name: content.title || `İçerik #${content.id}`, item: currentUrl }
          ]}
        />

        <script type="application/ld+json">
          {JSON.stringify(tableOfContentsSchema)}
        </script>

        <Breadcrumb 
          items={[
            { label: "Blog Yazıları", href: "/" },
            { label: content.title || `İçerik #${content.id}` }
          ]} 
        />

        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Yazılara Dön
          </Button>
        </Link>

        <Card className="mb-4 border border-border rounded-lg overflow-hidden shadow-sm">
          <CardHeader className="py-3 px-4">
            <CardTitle className="mb-1 text-2xl font-bold tracking-tight">
              {content.title || `İçerik #${content.id}`}
            </CardTitle>
            
            {content.excerpt && (
              <CardDescription>{content.excerpt}</CardDescription>
            )}
            
            {content.created_at && (
              <div className="text-sm text-muted-foreground mt-1">
                {new Date(content.created_at).toLocaleDateString('tr-TR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </div>
            )}
          </CardHeader>
          
          <div 
            className="prose prose-lg max-w-none content-placeholder" 
            style={{ 
              display: 'block',
              width: '100%',
              padding: '0 1rem 1.5rem 1rem'
            }}
            dangerouslySetInnerHTML={{ __html: contentWithIds }} 
          />

          <CardContent className="p-6 border-t">
            <ShareButtons 
              url={currentUrl}
              title={content.title || `İçerik #${content.id}`}
              description={truncatedContent}
            />

            {headings.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <div className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <List className="h-5 w-5" />
                  <h2>İçindekiler</h2>
                </div>
                <nav className="space-y-2">
                  {headings.map((heading, index) => (
                    <a
                      key={index}
                      href={`#${heading.id}`}
                      className="block text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {heading.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
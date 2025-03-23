/**
 * Sunucudan direkt API çağrısı ile içerik getir
 * (Önbellek bypass)
 */
export async function fetchContentDirect(id: number): Promise<any> {
  const urls = [
    `/api/content/${id}`,                   // Standart yol
    `/api/contents/${id}`,                  // Çoğul versiyonu
    `/api/content/get/${id}`,               // Detaylı yol
    `/api/blog/content/${id}`,              // Blog alt yolu
    `/api/contents/detail/${id}`,           // Detay yolu
    `/api/content/id/${id}`,                // ID ile
    `/api/content?id=${id}`                 // Query string versiyonu
  ];
  
  let successfulUrl = null;
  let successData = null;
  
  // Tüm muhtemel URL'leri dene
  for (const url of urls) {
    try {
      console.log(`API endpoint test: ${url}`);
      const response = await fetch(`${url}?bypass=true&t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          if (data && (data.id || data.content)) {
            console.log(`Başarılı API endpoint bulundu: ${url}`);
            console.log('Veri:', data);
            successfulUrl = url;
            successData = data;
            break;
          }
        } catch (e) {
          console.log(`${url} geçersiz JSON döndürdü:`, text);
        }
      }
    } catch (error) {
      console.log(`${url} testi başarısız:`, error);
    }
  }
  
  if (successfulUrl) {
    // Başarılı URL'yi localStorage'a kaydet
    try {
      localStorage.setItem('api_content_endpoint', successfulUrl.split('/').slice(0, -1).join('/'));
    } catch (e) {
      console.error('API endpoint kaydetme hatası:', e);
    }
    return successData;
  }
  
  throw new Error('Hiçbir API endpoint çalışmıyor');
}

/**
 * Doğru API endpoint'ini al
 */
export function getContentEndpoint(): string {
  // LocalStorage'dan kaydedilmiş endpoint'i kontrol et
  try {
    const savedEndpoint = localStorage.getItem('api_content_endpoint');
    if (savedEndpoint) {
      return savedEndpoint;
    }
  } catch (e) {
    console.error('API endpoint okuma hatası:', e);
  }
  
  // Varsayılan değeri döndür
  return '/api/content';
} 
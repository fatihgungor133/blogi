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
    `/api/content?id=${id}`,                // Query string versiyonu
    `/api/content?baslik_id=${id}`          // Başlık ID versiyonu
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
          // Hem id hem de baslik_id'yi kontrol et
          if (data && (data.id || data.baslik_id || data.content)) {
            console.log(`Başarılı API endpoint bulundu: ${url}`);
            console.log('Veri:', data);
            
            // URL'den endpoint kısmını çıkar
            let endpoint = '';
            if (url.includes('?')) {
              // Query string varsa onu koru
              endpoint = url.split('?')[0];
              // Başlık ID ile çalışan endpoint'i belirt
              if (url.includes('baslik_id')) {
                endpoint += '?baslik_id=';
                localStorage.setItem('api_baslik_id_param', 'true');
              } else {
                endpoint += '?id=';
              }
            } else {
              // Klasik ID endpoint'i
              endpoint = url.split('/').slice(0, -1).join('/');
            }
            
            successfulUrl = endpoint;
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
      localStorage.setItem('api_content_endpoint', successfulUrl);
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

/**
 * Başlık ID ile mi çalıştığını kontrol et
 */
export function useBaslikIdParam(): boolean {
  try {
    return localStorage.getItem('api_baslik_id_param') === 'true';
  } catch (e) {
    return false;
  }
}

/**
 * API İşlemleri
 */

/**
 * İçerik detayını getir
 */
export async function getPost(id: number) {
  const response = await fetch(`/api/content/${id}`);
  if (!response.ok) {
    throw new Error('İçerik alınamadı');
  }
  return response.json();
}

/**
 * Görüntüleme sayısını artır
 */
export async function viewPost(id: number) {
  const response = await fetch(`/api/views/record?id=${id}`, {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    cache: 'no-store'
  });
  
  if (!response.ok) {
    throw new Error('Görüntüleme kaydedilemedi');
  }
  
  return response.json();
} 
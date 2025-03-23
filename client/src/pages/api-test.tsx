import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchContentDirect, getContentEndpoint, useBaslikIdParam } from "@/lib/api";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "wouter";

export default function ApiTest() {
  const [postId, setPostId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedEndpoint, setSavedEndpoint] = useState('');
  const [isBaslikIdParam, setIsBaslikIdParam] = useState(false);

  useEffect(() => {
    // Kaydedilmiş endpoint'i getir
    const endpoint = getContentEndpoint();
    setSavedEndpoint(endpoint);
    setIsBaslikIdParam(useBaslikIdParam());
  }, []);

  const testApi = async () => {
    if (!postId || isNaN(parseInt(postId))) {
      setError('Lütfen geçerli bir ID girin');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await fetchContentDirect(parseInt(postId));
      setResult(data);
      
      // Endpoint güncellenmiş olabilir, yeniden kontrol et
      const updatedEndpoint = getContentEndpoint();
      setSavedEndpoint(updatedEndpoint);
      setIsBaslikIdParam(useBaslikIdParam());
    } catch (err: any) {
      setError(err.message || 'API testi başarısız oldu');
    } finally {
      setIsLoading(false);
    }
  };

  const clearEndpoint = () => {
    try {
      localStorage.removeItem('api_content_endpoint');
      localStorage.removeItem('api_baslik_id_param');
      setSavedEndpoint('');
      setIsBaslikIdParam(false);
      setResult(null);
      setError(null);
    } catch (e) {
      console.error('Endpoint temizleme hatası:', e);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Ana Sayfaya Dön
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>API Endpoint Testi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="postId">İçerik ID veya Başlık ID</Label>
              <Input
                id="postId"
                type="number"
                value={postId}
                onChange={(e) => setPostId(e.target.value)}
                placeholder="Örn: 123"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={testApi}
                disabled={isLoading}
                className="flex items-center"
              >
                {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                {!isLoading && <RefreshCw className="mr-2 h-4 w-4" />}
                API Endpoint Testi Yap
              </Button>

              <Button
                variant="outline"
                onClick={clearEndpoint}
                disabled={!savedEndpoint}
                className="flex items-center"
              >
                Kaydedilmiş Endpoint'i Temizle
              </Button>
            </div>

            {savedEndpoint && (
              <div className="mt-4 p-3 bg-muted rounded">
                <p className="font-medium">Kaydedilmiş API Endpoint:</p>
                <code className="block mt-1 text-sm">{savedEndpoint}</code>
                {isBaslikIdParam && (
                  <p className="mt-2 text-sm bg-green-100 dark:bg-green-900 p-2 rounded">
                    <strong>Parametre Tipi:</strong> baslik_id (Başlık ID kullanıyor)
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-destructive/10 rounded">
                <p className="font-medium">Hata:</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {result && (
              <div className="mt-4">
                <p className="font-medium mb-2">API Yanıtı:</p>
                <div className="bg-muted p-3 rounded overflow-auto max-h-96">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
                
                {result && result.id && result.baslik_id && (
                  <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900 rounded">
                    <p className="font-medium">ID Bilgileri:</p>
                    <ul className="mt-1 text-sm space-y-1">
                      <li><strong>İçerik ID:</strong> {result.id}</li>
                      <li><strong>Başlık ID:</strong> {result.baslik_id}</li>
                      <li><strong>Test Edilen ID:</strong> {postId}</li>
                    </ul>
                    <p className="mt-2 text-xs bg-yellow-100 dark:bg-yellow-900 p-2 rounded">
                      Not: URL'de kullanılan ID, içeriğin kendi ID'si değil Başlık ID'si olabilir. 
                      Sistem artık her iki türde sorgu yapabilecek şekilde güncellenmiştir.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kullanım Talimatları</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2">
            <li>Bir içerik ID'si veya Başlık ID'si girin (Ana sayfada görüntülenen herhangi bir içeriğin ID'si)</li>
            <li>"API Endpoint Testi Yap" düğmesine tıklayın</li>
            <li>Test, farklı API endpoint'lerini deneyecek ve çalışan bir endpoint bulacaktır</li>
            <li>Başarılı olursa, bu endpoint kaydedilecek ve tüm içerik istekleri için kullanılacaktır</li>
            <li>Kaydedilmiş endpoint'i temizlemek ve yeniden test etmek için "Kaydedilmiş Endpoint'i Temizle" düğmesini kullanabilirsiniz</li>
          </ol>
          
          <div className="mt-6 p-3 bg-yellow-100 dark:bg-yellow-900 rounded">
            <p className="font-medium">Önemli Not:</p>
            <p className="mt-1 text-sm">
              Sistem artık hem doğrudan ID hem de Başlık ID ile çalışabilmektedir. URL'lerde görünen ID'ler 
              genellikle içeriğin kendi ID'si değil, Başlık ID'si olabilir. Bu güncelleme ile her iki durumda 
              da içerikler doğru şekilde yüklenecektir.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
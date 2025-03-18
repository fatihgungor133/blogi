import { useEffect, useState } from "react";
import { useRoute, useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { getPost, viewPost } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, List } from "lucide-react";
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

export default function Post() {
  const { id, slug } = useParams();
  const { theme } = useTheme();
  const [hasViewed, setHasViewed] = useState(false);

  // ID parametresi string olarak gelir, sayıya çevirmemiz gerekiyor
  const postId = id ? parseInt(id) : 0;

  const { data: content, isLoading, error } = useQuery<Content>({
    queryKey: ['/api/content', postId],
    queryFn: () => 
      fetch(`/api/content/${postId}`).then(res => res.json()),
    enabled: postId > 0,
  });

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

  // Minimum içerik yüksekliği - CLS önleme için
  const minContentHeight = "min-h-[70vh]";

  if (isLoading) {
    return (
      <div className={cn("container mx-auto p-4", minContentHeight)}>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <Skeleton className="h-12 w-3/4 mb-4" />
            <div className="flex space-x-4 items-center mb-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            
            <div className="space-y-4 mt-8">
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
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className={cn("container mx-auto p-4", minContentHeight)}>
        <Card className="bg-destructive/10">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-bold">İçerik bulunamadı</h1>
            <p className="mt-4">
              Aradığınız içerik bulunamadı veya kaldırılmış olabilir.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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

        <Card>
          <CardContent className="p-6">
            <h1 className="text-3xl font-bold mb-6">
              {content.title || `İçerik #${content.id}`}
            </h1>

            <ShareButtons 
              url={currentUrl}
              title={content.title || `İçerik #${content.id}`}
              description={truncatedContent}
            />

            <div 
              className="prose prose-lg max-w-none mt-6 content-placeholder min-h-[300px]" 
              style={{ 
                // İçerik yüklenirken dengelenmesi için CSS
                // CLS sorununu azaltır
                minHeight: 'calc(100vh - 400px)',
                display: 'block',
                width: '100%'
              }}
              dangerouslySetInnerHTML={{ __html: contentWithIds }} 
            />

            {headings.length > 0 && (
              <div className="mt-8 border-t pt-6">
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
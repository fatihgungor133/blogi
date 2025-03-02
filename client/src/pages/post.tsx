import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { Content } from "@shared/schema";

export default function Post() {
  const { id, slug } = useParams();

  const { data: content, isLoading } = useQuery<Content>({
    queryKey: ['/api/content', id],
    queryFn: () => 
      fetch(`/api/content/${id}`).then(res => res.json())
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card className="animate-pulse">
          <CardContent className="h-96 bg-muted mt-4" />
        </Card>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="container mx-auto p-4">
        <Card className="bg-destructive/10">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">İçerik bulunamadı</h2>
            <p>Bu içerik silinmiş veya mevcut değil.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const truncatedContent = content.content.substring(0, 160);
  const currentSlug = content.slug || `icerik-${content.id}`;

  // Redirect if slug doesn't match
  if (slug !== currentSlug) {
    window.location.href = `/post/${content.baslik_id}/${currentSlug}`;
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <Seo 
        title={content.title || `İçerik #${content.id}`}
        description={truncatedContent}
        type="article"
        canonicalUrl={`/post/${content.baslik_id}/${currentSlug}`}
        breadcrumb={[
          { position: 1, name: "Ana Sayfa", item: "/" },
          { position: 2, name: "Blog Posts", item: "/" },
          { position: 3, name: content.title || `İçerik #${content.id}`, item: `/post/${content.baslik_id}/${currentSlug}` }
        ]}
      />

      <Breadcrumb 
        items={[
          { label: "Blog Posts", href: "/" },
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
          <div className="prose prose-lg max-w-none">
            {content.content}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
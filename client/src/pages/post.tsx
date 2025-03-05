import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, List } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumb } from "@/components/Breadcrumb";
import { parseHeadings, addHeadingIds } from "@/lib/utils";
import type { Content } from "@shared/schema";
import { ShareButtons } from "@/components/ShareButtons";

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
    <div className="container mx-auto p-4">
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

          <div className="prose prose-lg max-w-none mt-6" dangerouslySetInnerHTML={{ __html: contentWithIds }} />

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
  );
}
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { Content } from "@shared/schema";

export default function Post() {
  const { id } = useParams();

  const { data: content, isLoading } = useQuery<Content>({
    queryKey: ['/api/content', id],
    queryFn: () => 
      fetch(`/api/content/${id}`).then(res => res.json())
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card className="animate-pulse">
          <CardHeader className="h-20 bg-muted" />
          <CardContent className="h-96 bg-muted mt-4" />
        </Card>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="container mx-auto p-4">
        <Card className="bg-destructive/10">
          <CardHeader>
            <CardTitle>Content not found</CardTitle>
          </CardHeader>
          <CardContent>
            This post might have been removed or doesn't exist.
          </CardContent>
        </Card>
      </div>
    );
  }

  const truncatedContent = content.content.substring(0, 160);

  return (
    <div className="container mx-auto p-4">
      <Seo 
        title={content.title || `İçerik #${content.id}`}
        description={truncatedContent}
        type="article"
        canonicalUrl={`/post/${content.baslik_id}`}
      />

      <Breadcrumb 
        items={[
          { label: "Blog Posts", href: "/" },
          { label: content.title || `İçerik #${content.id}` }
        ]} 
      />

      <Link href="/">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to posts
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
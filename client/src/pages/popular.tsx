import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Seo } from "@/components/Seo";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Eye } from "lucide-react";
import type { Content } from "@shared/schema";

export default function Popular() {
  const { data: titles, isLoading } = useQuery<Content[]>({
    queryKey: ['/api/popular'],
    queryFn: () =>
      fetch('/api/popular').then(res => {
        if (!res.ok) {
          throw new Error('Popüler içerikler yüklenirken hata oluştu');
        }
        return res.json();
      })
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-muted" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Seo
        title="Popüler İçerikler"
        description="En çok okunan blog yazıları"
        type="website"
        breadcrumb={[
          { position: 1, name: "Ana Sayfa", item: `${window.location.origin}/` },
          { position: 2, name: "Popüler İçerikler", item: `${window.location.origin}/popular` }
        ]}
      />

      <Breadcrumb items={[{ label: "Popüler İçerikler" }]} />

      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
        Popüler İçerikler
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {titles?.map((content) => (
          <Link
            key={content.id}
            href={`/post/${content.baslik_id}/${content.slug || `icerik-${content.id}`}`}
          >
            <Card className="hover:bg-accent transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-lg cursor-pointer h-full group">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="group-hover:translate-x-1 transition-transform duration-300">
                    {content.title || `İçerik #${content.id}`}
                  </CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground group-hover:translate-x-1 transition-transform duration-300">
                    <Eye className="h-4 w-4 mr-1" />
                    <span>{content.views}</span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
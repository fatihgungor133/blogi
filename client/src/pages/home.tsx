import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { Content } from "@shared/schema";

export default function Home() {
  const [page, setPage] = useState(1);
  const limit = 40; // Sayfa başına 40 içerik

  const { data, isLoading, error } = useQuery<{titles: Content[], total: number}>({
    queryKey: ['/api/titles', page, limit],
    queryFn: () => 
      fetch(`/api/titles?page=${page}&limit=${limit}`).then(res => {
        if (!res.ok) {
          throw new Error('İçerik yüklenirken hata oluştu');
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

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="bg-destructive/10">
          <CardHeader>
            <CardTitle>İçerik yüklenirken hata oluştu</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const titles = data?.titles ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / limit);

  return (
    <div className="container mx-auto p-4">
      <Seo 
        title="Blog Yazıları"
        description="Güncel blog yazıları ve içerikler"
        type="website"
      />

      <Breadcrumb items={[{ label: "Blog Yazıları" }]} />

      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
        Blog Yazıları
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {titles.map((content) => (
          <Link 
            key={content.id} 
            href={`/post/${content.baslik_id}/${content.slug || `icerik-${content.id}`}`}
          >
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle>{content.title || `İçerik #${content.id}`}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {titles.length > 0 && (
        <div className="flex justify-between items-center mt-8">
          <Button 
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Önceki
          </Button>
          <span>Sayfa {page} / {totalPages}</span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Sonraki <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
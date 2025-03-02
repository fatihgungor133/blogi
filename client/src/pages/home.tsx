import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Title } from "@shared/schema";

export default function Home() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, error } = useQuery<{titles: Title[], total: number}>({
    queryKey: ['/api/titles', page, limit],
    queryFn: () => 
      fetch(`/api/titles?page=${page}&limit=${limit}`).then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch titles');
        }
        return res.json();
      })
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse bg-muted h-24" />
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
            <CardTitle>Error loading posts</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const titles = data?.titles ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / limit);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
        Blog Posts
      </h1>

      <div className="grid gap-4">
        {titles.map((title) => (
          <Link key={title.id} href={`/post/${title.id}`}>
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle>{title.title}</CardTitle>
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
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <span>Page {page} of {totalPages}</span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
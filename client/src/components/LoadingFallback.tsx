import { Skeleton } from "@/components/ui/skeleton";

export function LoadingFallback() {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-10">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-8 w-24" />
      </div>
      
      {/* Main content skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        
        <div className="py-4">
          <Skeleton className="h-64 w-full rounded-md" />
        </div>
        
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
} 
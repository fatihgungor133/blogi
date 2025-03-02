import { useQuery } from "@tanstack/react-query";
import { Route, Redirect } from "wouter";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { data: auth, isLoading } = useQuery({
    queryKey: ['/api/admin/auth'],
    queryFn: () => fetch('/api/admin/auth').then(res => {
      if (!res.ok) throw new Error('Unauthorized');
      return res.json();
    }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!auth) {
    return <Redirect to="/admin/login" />;
  }

  return <Component />;
}

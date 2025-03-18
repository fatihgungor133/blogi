import { Suspense, lazy } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/lib/protected-route";
import { LoadingFallback } from '@/components/LoadingFallback';
import { useEffect, useState } from "react";

// Lazy loaded components
const Home = lazy(() => import('@/pages/home'));
const Post = lazy(() => import('@/pages/post'));
const Popular = lazy(() => import('@/pages/popular'));
const AdminLogin = lazy(() => import('@/pages/admin/login'));
const AdminDashboard = lazy(() => import('@/pages/admin/dashboard'));
const AdminSettings = lazy(() => import('@/pages/admin/settings'));
const CLSDebug = lazy(() => import('@/pages/test/cls-debug'));
const NotFound = lazy(() => import('@/pages/not-found'));

function Router() {
  // URL'yi kontrol ederek admin sayfalarını tespit ediyoruz
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  
  useEffect(() => {
    // URL'yi kontrol et
    const checkIfAdminRoute = () => {
      const pathname = window.location.pathname;
      setIsAdminRoute(pathname.startsWith("/admin"));
    };
    
    // Sayfa yüklendiğinde kontrol et
    checkIfAdminRoute();
    
    // URL değişimlerini dinle
    window.addEventListener("popstate", checkIfAdminRoute);
    
    return () => {
      window.removeEventListener("popstate", checkIfAdminRoute);
    };
  }, []);
  
  return (
    <Layout hideAds={isAdminRoute}>
      <Suspense fallback={<LoadingFallback />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/post/:id/:slug" component={Post} />
          <Route path="/popular" component={Popular} />
          <Route path="/admin/login" component={AdminLogin} />
          <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} />
          <ProtectedRoute path="/admin/settings" component={AdminSettings} />
          <Route path="/test/cls" component={CLSDebug} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="blog-theme">
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <Router />
          <Toaster />
        </QueryClientProvider>
      </HelmetProvider>
    </ThemeProvider>
  );
}

export default App;
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Post from "@/pages/post";
import Popular from "@/pages/popular";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminSettings from "@/pages/admin/settings";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/lib/protected-route";
import { useEffect, useState } from "react";

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
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/post/:id/:slug" component={Post} />
        <Route path="/popular" component={Popular} />
        <Route path="/admin/login" component={AdminLogin} />
        <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} />
        <ProtectedRoute path="/admin/settings" component={AdminSettings} />
        <Route component={NotFound} />
      </Switch>
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
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Post from "@/pages/post";
import Popular from "@/pages/popular";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminSettings from "@/pages/admin/settings";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/post/:id/:slug" component={Post} />
      <Route path="/popular" component={Popular} />
      <Route path="/admin/login" component={AdminLogin} />
      <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} />
      <ProtectedRoute path="/admin/settings" component={AdminSettings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Layout>
          <Router />
        </Layout>
        <Toaster />
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
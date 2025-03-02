import { useQuery } from "@tanstack/react-query";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Seo } from "./Seo";
import type { SiteSettings, FooterSettings } from "@shared/schema";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function Layout({ children, title, description }: LayoutProps) {
  const { data: siteSettings } = useQuery<SiteSettings>({
    queryKey: ['/api/site/settings'],
    queryFn: () => fetch('/api/site/settings').then(res => res.json())
  });

  const { data: footerSettings } = useQuery<FooterSettings>({
    queryKey: ['/api/site/footer'],
    queryFn: () => fetch('/api/site/footer').then(res => res.json())
  });

  const pageTitle = title 
    ? `${title} | ${siteSettings?.siteName || 'Blog'}`
    : siteSettings?.siteName || 'Blog';

  return (
    <div className="min-h-screen flex flex-col">
      <Seo 
        title={pageTitle}
        description={description || siteSettings?.metaDescription || 'Blog içeriklerini keşfedin'}
      />
      <Header siteName={siteSettings?.siteName} />
      <main className="flex-grow">
        {children}
      </main>
      <Footer settings={footerSettings} />
    </div>
  );
}
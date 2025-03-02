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
  const { data: siteSettings, isLoading } = useQuery<SiteSettings>({
    queryKey: ['/api/site/settings'],
    queryFn: () => fetch('/api/site/settings').then(res => {
      if (!res.ok) throw new Error('Site ayarları yüklenemedi');
      return res.json();
    })
  });

  const { data: footerSettings } = useQuery<FooterSettings>({
    queryKey: ['/api/site/footer']
  });

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  const siteName = siteSettings?.siteName || '';
  const pageTitle = title ? `${title} | ${siteName}` : siteName;

  return (
    <div className="min-h-screen flex flex-col">
      {siteSettings && (
        <Seo 
          title={pageTitle}
          description={description || siteSettings.metaDescription || ''}
          type="website"
        />
      )}
      <Header siteName={siteName} />
      <main className="flex-grow">
        {children}
      </main>
      <Footer settings={footerSettings} />
    </div>
  );
}
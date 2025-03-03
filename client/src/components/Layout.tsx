import { Header } from "./Header";
import { Footer } from "./Footer";
import { Seo } from "./Seo";
import type { SiteSettings, FooterSettings } from "@shared/schema";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

// Varsayılan ayarlar
const defaultSiteSettings: SiteSettings = {
  siteName: 'Blog İçerik Tarayıcısı',
  siteDescription: 'Tüm blog içerikleriniz için tek adres',
  logoUrl: '/logo.png',
  faviconUrl: '/favicon.ico',
  primaryColor: '#3490dc',
  secondaryColor: '#ffed4a',
  fontFamily: 'Roboto, sans-serif'
};

const defaultFooterSettings: FooterSettings = {
  copyrightText: '© 2023 Blog İçerik Tarayıcısı. Tüm hakları saklıdır.',
  showSocialLinks: true,
  facebookUrl: 'https://facebook.com',
  twitterUrl: 'https://twitter.com',
  instagramUrl: 'https://instagram.com',
  linkedinUrl: 'https://linkedin.com',
  showContactInfo: true,
  email: 'info@example.com',
  phone: '+90 555 123 4567',
  address: 'İstanbul, Türkiye'
};

export function Layout({ children, title, description }: LayoutProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [footerSettings, setFooterSettings] = useState<FooterSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const siteSettingsData = await apiRequest("GET", "/api/site/settings");
        const footerSettingsData = await apiRequest("GET", "/api/site/footer");
        setSiteSettings(siteSettingsData);
        setFooterSettings(footerSettingsData);
      } catch (error) {
        // Hata durumunda varsayılan ayarları kullan
        setSiteSettings(defaultSiteSettings);
        setFooterSettings(defaultFooterSettings);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

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
          description={description || siteSettings.siteDescription || ''}
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
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
  siteName: 'Manisa Haber Gazetesi',
  metaDescription: 'Manisa\'dan güncel haberler ve içerikler',
  logoUrl: '/logo.png',
  faviconUrl: '/favicon.ico',
  primaryColor: '#3490dc',
  secondaryColor: '#ffed4a',
  fontFamily: 'Roboto, sans-serif'
};

const defaultFooterSettings: FooterSettings = {
  copyright: '© 2023 Manisa Haber Gazetesi. Tüm hakları saklıdır.',
  showSocialLinks: true,
  facebookUrl: 'https://facebook.com/manisahabergazetesi',
  twitterUrl: 'https://twitter.com/manisahaber',
  instagramUrl: 'https://instagram.com/manisahabergazetesi',
  linkedinUrl: 'https://linkedin.com/company/manisahabergazetesi',
  showContactInfo: true,
  email: 'info@manisahabergazetesi.com.tr',
  phone: '+90 555 123 4567',
  address: 'Manisa, Türkiye'
};

export function Layout({ children, title, description }: LayoutProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [footerSettings, setFooterSettings] = useState<FooterSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const siteSettingsResponse = await apiRequest("GET", "/api/site/settings");
        const footerSettingsResponse = await apiRequest("GET", "/api/site/footer");
        
        const siteSettingsData = await siteSettingsResponse.json();
        const footerSettingsData = await footerSettingsResponse.json();
        
        // Site ayarları boş veya geçersizse varsayılan değerleri kullan
        if (!siteSettingsData || !siteSettingsData.siteName) {
          console.warn("Site ayarları boş veya eksik, varsayılan değerler kullanılıyor");
          setSiteSettings(defaultSiteSettings);
        } else {
          setSiteSettings(siteSettingsData);
        }
        
        setFooterSettings(footerSettingsData || defaultFooterSettings);
        
        console.log("Site Ayarları:", siteSettingsData);
      } catch (error) {
        console.error("Ayarlar yüklenirken hata:", error);
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

  // Varsayılan değeri doğrudan belirtin
  const siteName = siteSettings?.siteName || 'Manisa Haber Gazetesi';
  const pageTitle = title ? `${title} | ${siteName}` : siteName;

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {siteSettings && (
        <Seo 
          title={pageTitle}
          description={description || siteSettings.metaDescription || ''}
          type="website"
        />
      )}
      <Header siteName={siteName} />
      <main className="w-full mb-auto">
        {children}
      </main>
      <Footer settings={footerSettings || defaultFooterSettings} />
    </div>
  );
}
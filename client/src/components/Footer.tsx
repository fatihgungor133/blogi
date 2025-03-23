import type { FooterSettings } from "@shared/schema";

interface FooterProps {
  settings?: FooterSettings;
}

export function Footer({ settings }: FooterProps) {
  return (
    <footer className="bg-background border-t w-full">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold mb-3">Hakkımızda</h3>
            <p className="text-muted-foreground">
              {settings?.aboutText || 'Modern ve SEO uyumlu blog platformu'}
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Hızlı Linkler</h3>
            <ul className="space-y-1">
              <li>
                <a href="/" className="text-muted-foreground hover:text-foreground">
                  Ana Sayfa
                </a>
              </li>
              <li>
                <a href="/about" className="text-muted-foreground hover:text-foreground">
                  Hakkımızda
                </a>
              </li>
              <li>
                <a href="/contact" className="text-muted-foreground hover:text-foreground">
                  İletişim
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">İletişim</h3>
            <p className="text-muted-foreground">
              Email: {settings?.email || 'info@example.com'}<br />
              Tel: {settings?.phone || '+90 212 123 45 67'}
            </p>
          </div>
        </div>
        <div className="border-t mt-6 pt-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {settings?.copyright || 'Manisa Haber Gazetesi. Tüm hakları saklıdır.'}</p>
        </div>
      </div>
    </footer>
  );
}
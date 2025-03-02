export function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold mb-4">Hakkımızda</h3>
            <p className="text-muted-foreground">
              Modern ve SEO uyumlu blog platformu
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Hızlı Linkler</h3>
            <ul className="space-y-2">
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
            <h3 className="font-semibold mb-4">İletişim</h3>
            <p className="text-muted-foreground">
              Email: info@example.com<br />
              Tel: +90 212 123 45 67
            </p>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Blog. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
}

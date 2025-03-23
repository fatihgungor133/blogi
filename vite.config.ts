import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Robots.txt içeriği
const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/admin/
Disallow: /admin/

# Sitemap
Sitemap: https://www.manisahabergazetesi.com.tr/sitemap.xml

# Crawl-delay
Crawl-delay: 10`;

// HTML dönüşüm eklentisi
const htmlPlugin = () => {
  return {
    name: 'html-transform',
    transformIndexHtml(html: string) {
      return html;
    }
  };
};

// Robots.txt dosyasını kopyalayan eklenti
const copyConfigFiles = () => {
  return {
    name: 'copy-config-files',
    closeBundle: () => {
      const outDir = path.resolve(__dirname, "dist/public");
      
      // Robots.txt kopyala
      const robotsTxtPath = path.join(outDir, 'robots.txt');
      try {
        fs.writeFileSync(robotsTxtPath, robotsTxt);
        console.log('Robots.txt dosyası derleme sonrası kopyalandı:', robotsTxtPath);
      } catch (error) {
        console.error('Robots.txt dosyası kopyalanırken hata:', error);
      }
    }
  };
};

export default defineConfig({
  plugins: [
    htmlPlugin(),
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    copyConfigFiles(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});

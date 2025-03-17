import express, { type Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { requireAuth } from "./middleware/auth";
import bcrypt from "bcrypt";
import session from "express-session";
import { createClient } from "redis";
// connect-redis entegrasyonunu kaldırıyoruz çünkü ESM modülüyle uyumlu değil
import { pool } from './db'; // Fixed import
import fs from "fs";
import path from "path";
import { createSlug } from "../client/src/lib/utils";
import { DatabaseStorage } from "./storage";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Geçici olarak memory store'a dönüyoruz
// Redis entegrasyonunu daha sonra düzgün bir şekilde yapacağız
declare module "express-session" {
  interface SessionData {
    adminId?: number;
  }
}

export async function registerRoutes(app: Express) {
  // Session middleware - basit bellek tabanlı
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "gizli-anahtar",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production', // Production'da true, development'ta false
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 saat
      }
    })
  );

  // Mevcut API rotaları
  app.get('/api/titles', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 40;

      const result = await storage.getTitles(page, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'İçerikler yüklenirken hata oluştu' });
    }
  });

  app.get('/api/content/:titleId', async (req, res) => {
    try {
      const titleId = parseInt(req.params.titleId);
      const content = await storage.getContent(titleId);

      if (!content) {
        return res.status(404).json({ error: 'İçerik bulunamadı' });
      }

      res.json(content);
    } catch (error) {
      res.status(500).json({ error: 'İçerik yüklenirken hata oluştu' });
    }
  });

  app.get('/api/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 3) {
        return res.json([]);
      }

      const results = await storage.searchContent(query);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: 'Arama yapılırken hata oluştu' });
    }
  });

  app.get('/api/popular', async (req, res) => {
    try {
      const results = await storage.getPopularContent();
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: 'Popüler içerikler yüklenirken hata oluştu' });
    }
  });

  // Admin API rotaları
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const admin = await storage.getAdminByUsername(username);
      
      if (!admin) {
        return res.status(401).json({ message: "Geçersiz kullanıcı adı veya şifre" });
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Geçersiz kullanıcı adı veya şifre" });
      }

      // Basit oturum yönetimi
      req.session.adminId = admin.id;
      
      res.json({ message: "Giriş başarılı" });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Giriş yapılırken hata oluştu' });
    }
  });

  // Test endpoint'i - oturum verilerini kontrol etmek için
  app.get('/api/admin/session-debug', async (req, res) => {
    // Bu endpoint'i production'da devre dışı bırakıyoruz
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: 'Not found' });
    }
    
    res.json({
      sessionID: req.sessionID,
      hasSession: !!req.session,
      adminId: req.session?.adminId || null,
      cookies: req.headers.cookie
    });
  });

  app.get('/api/admin/auth', async (req, res) => {
    if (!req.session || typeof req.session.adminId === 'undefined') {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Basit doğrulama
    res.json({ 
      authenticated: true,
      adminId: req.session.adminId
    });
  });

  app.post('/api/admin/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Çıkış yapıldı" });
    });
  });

  // Admin ayarları API rotaları
  app.get('/api/admin/settings/site', requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error in /api/admin/settings/site:', error);
      res.status(500).json({ error: 'Site ayarları yüklenirken hata oluştu' });
    }
  });

  app.patch('/api/admin/settings/site', requireAuth, async (req, res) => {
    try {
      const settings = await storage.updateSiteSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error('Error in PATCH /api/admin/settings/site:', error);
      res.status(500).json({ error: 'Site ayarları güncellenirken hata oluştu' });
    }
  });

  app.get('/api/admin/settings/footer', requireAuth, async (req, res) => {
    try {
      const settings = await storage.getFooterSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error in /api/admin/settings/footer:', error);
      res.status(500).json({ error: 'Footer ayarları yüklenirken hata oluştu' });
    }
  });

  app.patch('/api/admin/settings/footer', requireAuth, async (req, res) => {
    try {
      const settings = await storage.updateFooterSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error('Error in PATCH /api/admin/settings/footer:', error);
      res.status(500).json({ error: 'Footer ayarları güncellenirken hata oluştu' });
    }
  });

  // Public site settings API
  app.get('/api/site/settings', async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error in /api/site/settings:', error);
      res.status(500).json({ error: 'Site ayarları yüklenirken hata oluştu' });
    }
  });

  app.get('/api/site/footer', async (req, res) => {
    try {
      const settings = await storage.getFooterSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error in /api/site/footer:', error);
      res.status(500).json({ error: 'Footer ayarları yüklenirken hata oluştu' });
    }
  });

  // Add after other admin routes
  app.post('/api/admin/change-password', requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!req.session?.adminId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get admin from database
      const admin = await storage.getAdminByUsername('admin'); // Since we only have one admin
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Mevcut şifre yanlış" });
      }

      // Hash new password and update
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query('UPDATE admins SET password = $1 WHERE id = $2', [hashedPassword, admin.id]);

      res.json({ message: "Şifre başarıyla güncellendi" });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ message: "Şifre değiştirme sırasında bir hata oluştu" });
    }
  });

  // Admin sitemap oluşturma endpoint'i
  app.post('/api/admin/generate-sitemap', requireAuth, async (req, res) => {
    try {
      await generateSitemaps();
      res.json({ message: 'Sitemap başarıyla oluşturuldu' });
    } catch (error) {
      console.error('Sitemap oluşturma hatası:', error);
      res.status(500).json({ error: 'Sitemap oluşturulurken bir hata oluştu' });
    }
  });

  // Sitemap API
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const sitemapIndexPath = path.join(__dirname, 'public', 'sitemap-index.xml');
      
      // Eğer sitemap-index.xml dosyası varsa ve 24 saatten daha yeni ise, onu doğrudan döndür
      if (fs.existsSync(sitemapIndexPath)) {
        const stats = fs.statSync(sitemapIndexPath);
        const fileAge = Date.now() - stats.mtimeMs;
        
        // 24 saatten daha yeni ise (86400000 ms = 24 saat)
        if (fileAge < 86400000) {
          res.header('Content-Type', 'application/xml');
          return res.sendFile(sitemapIndexPath);
        }
      }
      
      // Sitemap'i yeniden oluştur
      await generateSitemaps();
      
      res.header('Content-Type', 'application/xml');
      res.sendFile(sitemapIndexPath);
    } catch (error) {
      console.error('Sitemap oluşturma hatası:', error);
      res.status(500).send('Sitemap oluşturulurken bir hata oluştu');
    }
  });

  app.get('/sitemap-:num.xml', (req, res) => {
    const sitemapNum = req.params.num;
    const sitemapPath = path.join(__dirname, 'public', `sitemap-${sitemapNum}.xml`);
    
    if (fs.existsSync(sitemapPath)) {
      res.header('Content-Type', 'application/xml');
      res.sendFile(sitemapPath);
    } else {
      res.status(404).send('Sitemap bulunamadı');
    }
  });

  return createServer(app);
}

// Sitemap oluşturma fonksiyonu
async function generateSitemaps() {
  const storage = new DatabaseStorage();
  const publicDir = path.join(__dirname, 'public');
  
  // public klasörünü oluştur (eğer yoksa)
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  try {
    // Tüm içerik ID'lerini al
    const allContent = await storage.getAllContentIds();
    const siteSettings = await storage.getSiteSettings();
    
    // Site URL'sini .env dosyasından veya varsayılan değerden al
    const siteUrl = process.env.SITE_URL || 'https://www.localhost.tr';
    
    // Her sitemap için maksimum kayıt sayısı
    const MAX_URLS_PER_SITEMAP = 20000;
    
    // Kaç sitemap dosyası oluşturulacak
    const totalSitemaps = Math.ceil(allContent.length / MAX_URLS_PER_SITEMAP);
    
    // Sitemap index dosyası oluştur
    let sitemapIndexContent = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    
    for (let i = 1; i <= totalSitemaps; i++) {
      sitemapIndexContent += `
  <sitemap>
    <loc>${siteUrl}/sitemap-${i}.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`;
    }
    
    sitemapIndexContent += `
</sitemapindex>`;
    
    // Sitemap index dosyasını kaydet
    fs.writeFileSync(path.join(publicDir, 'sitemap-index.xml'), sitemapIndexContent);
    
    // Her bir sitemap dosyasını oluştur
    for (let i = 0; i < totalSitemaps; i++) {
      const startIdx = i * MAX_URLS_PER_SITEMAP;
      const endIdx = Math.min(startIdx + MAX_URLS_PER_SITEMAP, allContent.length);
      const sitemapContent = await generateSitemapFile(allContent.slice(startIdx, endIdx), siteUrl);
      
      fs.writeFileSync(path.join(publicDir, `sitemap-${i + 1}.xml`), sitemapContent);
    }
    
    console.log(`${totalSitemaps} sitemap dosyası başarıyla oluşturuldu.`);
  } catch (error) {
    console.error('Sitemap oluşturma hatası:', error);
    throw error;
  }
}

// Tek bir sitemap dosyası oluşturma fonksiyonu
async function generateSitemapFile(contentList: {id: number, baslik_id: number, title: string | null}[], siteUrl: string): Promise<string> {
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  
  // Ana sayfa
  sitemap += `
  <url>
    <loc>${siteUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;
  
  // Popüler içerikler sayfası
  sitemap += `
  <url>
    <loc>${siteUrl}/popular</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
  
  // İçerik sayfaları
  for (const content of contentList) {
    const slug = content.title ? createSlug(content.title) : `icerik-${content.id}`;
    
    sitemap += `
  <url>
    <loc>${siteUrl}/post/${content.baslik_id}/${slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
  }
  
  sitemap += `
</urlset>`;
  
  return sitemap;
}
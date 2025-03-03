import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { requireAuth } from "./middleware/auth";
import bcrypt from "bcrypt";
import session from "express-session";
import memorystore from "memorystore";
import { pool } from './db'; // Fixed import

const MemoryStore = memorystore(session);

declare module "express-session" {
  interface SessionData {
    adminId?: number;
  }
}

export async function registerRoutes(app: Express) {
  // Session middleware
  app.use(
    session({
      store: new MemoryStore({
        checkPeriod: 86400000 // 24 saat
      }),
      secret: process.env.SESSION_SECRET || "gizli-anahtar",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 86400000, // 24 saat
        sameSite: 'lax', // CSRF koruması için
        httpOnly: true, // JavaScript erişimini engeller
        path: '/' // Tüm yollar için geçerli
      },
      name: 'blog_session' // Varsayılan connect.sid yerine özel isim
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
      console.log('Login attempt for username:', username);

      const admin = await storage.getAdminByUsername(username);
      console.log('Found admin:', admin ? 'Yes' : 'No');

      if (!admin) {
        console.log('Admin not found');
        return res.status(401).json({ message: "Geçersiz kullanıcı adı veya şifre" });
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password);
      console.log('Password valid:', isPasswordValid);

      if (!isPasswordValid) {
        console.log('Invalid password');
        return res.status(401).json({ message: "Geçersiz kullanıcı adı veya şifre" });
      }

      // Oturumu temizle ve yeni oturum oluştur
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ error: 'Oturum oluşturulurken hata oluştu' });
        }
        
        // Oturum verilerini ayarla
        req.session.adminId = admin.id;
        console.log('Session set, adminId:', admin.id);
        
        // Oturumu kaydet
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ error: 'Oturum kaydedilirken hata oluştu' });
          }
          
          // Başarılı yanıt gönder
          res.json({ message: "Giriş başarılı" });
        });
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Giriş yapılırken hata oluştu' });
    }
  });

  app.get('/api/admin/auth', async (req, res) => {
    console.log('Auth check, session:', req.session);
    console.log('Auth check, adminId:', req.session?.adminId);
    
    if (!req.session || !req.session.adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Oturumdaki admin ID'sini doğrula
      const admin = await storage.getAdminById(req.session.adminId);
      
      if (!admin) {
        // Admin bulunamadıysa oturumu temizle
        req.session.destroy((err) => {
          if (err) console.error('Session destroy error:', err);
        });
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Admin bilgilerini döndür (şifre hariç)
      const { password, ...adminData } = admin;
      res.json(adminData);
    } catch (error) {
      console.error('Auth check error:', error);
      res.status(500).json({ error: 'Kimlik doğrulama sırasında hata oluştu' });
    }
  });

  app.post('/api/admin/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Çıkış yapıldı" });
    });
  });

  // Admin ayarları API rotaları
  app.get('/api/admin/settings/site', requireAuth, async (req, res) => {
    try {
      console.log('Session in site settings:', req.session);
      const settings = await storage.getSiteSettings();
      console.log('Retrieved site settings:', settings);
      res.json(settings);
    } catch (error) {
      console.error('Error in /api/admin/settings/site:', error);
      res.status(500).json({ error: 'Site ayarları yüklenirken hata oluştu' });
    }
  });

  app.patch('/api/admin/settings/site', requireAuth, async (req, res) => {
    try {
      console.log('Session in update site settings:', req.session);
      console.log('Updating site settings with:', req.body);
      const settings = await storage.updateSiteSettings(req.body);
      console.log('Updated site settings:', settings);
      res.json(settings);
    } catch (error) {
      console.error('Error in PATCH /api/admin/settings/site:', error);
      res.status(500).json({ error: 'Site ayarları güncellenirken hata oluştu' });
    }
  });

  app.get('/api/admin/settings/footer', requireAuth, async (req, res) => {
    try {
      console.log('Session in footer settings:', req.session);
      const settings = await storage.getFooterSettings();
      console.log('Retrieved footer settings:', settings);
      res.json(settings);
    } catch (error) {
      console.error('Error in /api/admin/settings/footer:', error);
      res.status(500).json({ error: 'Footer ayarları yüklenirken hata oluştu' });
    }
  });

  app.patch('/api/admin/settings/footer', requireAuth, async (req, res) => {
    try {
      console.log('Session in update footer settings:', req.session);
      console.log('Updating footer settings with:', req.body);
      const settings = await storage.updateFooterSettings(req.body);
      console.log('Updated footer settings:', settings);
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
      console.log('Public site settings:', settings);
      res.json(settings);
    } catch (error) {
      console.error('Error in /api/site/settings:', error);
      res.status(500).json({ error: 'Site ayarları yüklenirken hata oluştu' });
    }
  });

  app.get('/api/site/footer', async (req, res) => {
    try {
      const settings = await storage.getFooterSettings();
      console.log('Public footer settings:', settings);
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

  return createServer(app);
}
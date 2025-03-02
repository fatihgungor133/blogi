import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { requireAuth } from "./middleware/auth";
import bcrypt from "bcrypt";
import session from "express-session";
import memorystore from "memorystore";

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
      cookie: { secure: process.env.NODE_ENV === "production" }
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

      if (!admin || !await bcrypt.compare(password, admin.password)) {
        return res.status(401).json({ message: "Geçersiz kullanıcı adı veya şifre" });
      }

      req.session.adminId = admin.id;
      res.json({ message: "Giriş başarılı" });
    } catch (error) {
      res.status(500).json({ error: 'Giriş yapılırken hata oluştu' });
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
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Site ayarları yüklenirken hata oluştu' });
    }
  });

  app.patch('/api/admin/settings/site', requireAuth, async (req, res) => {
    try {
      const settings = await storage.updateSiteSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Site ayarları güncellenirken hata oluştu' });
    }
  });

  app.get('/api/admin/settings/footer', requireAuth, async (req, res) => {
    try {
      const settings = await storage.getFooterSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Footer ayarları yüklenirken hata oluştu' });
    }
  });

  app.patch('/api/admin/settings/footer', requireAuth, async (req, res) => {
    try {
      const settings = await storage.updateFooterSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Footer ayarları güncellenirken hata oluştu' });
    }
  });

  return createServer(app);
}
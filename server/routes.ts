import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express) {
  app.get('/api/titles', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await storage.getTitles(page, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch titles' });
    }
  });

  app.get('/api/content/:titleId', async (req, res) => {
    try {
      const titleId = parseInt(req.params.titleId);
      const content = await storage.getContent(titleId);

      if (!content) {
        return res.status(404).json({ error: 'Content not found' });
      }

      res.json(content);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch content' });
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
      res.status(500).json({ error: 'Failed to search content' });
    }
  });

  return createServer(app);
}
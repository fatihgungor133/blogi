import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import './migrations';
import { createTables } from "./migrations";
import cors from "cors";
import path from "path";
import fs from "fs";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS ayarları
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function startServer() {
  try {
    // Veritabanı tablolarını oluştur
    await createTables();

    const app = express();
    
    // CORS ayarları
    app.use(cors({
      origin: '*', // Tüm originlere izin ver
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true,
      optionsSuccessStatus: 204,
    }));

    app.use(express.json());

    // Statik dosyaları sunmak için public klasörünü ayarla
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    app.use(express.static(publicDir));

    const server = await registerRoutes(app);

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      log(`Server running on port ${PORT}`);
    });

    // Geliştirme modunda Vite'ı kur
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      // Üretim modunda statik dosyaları sun
      serveStatic(app);
    }
  } catch (error) {
    console.error("Server başlatılırken hata oluştu:", error);
    process.exit(1);
  }
}

startServer();
#!/bin/bash

# Git değişikliklerini çek
git pull origin main

# Bağımlılıkları yükle
npm install

# Uygulamayı derle
npm run build

# Robots.txt dosyasının varlığını kontrol et
echo "Robots.txt dosyası kontrol ediliyor..."
if [ ! -f "dist/public/robots.txt" ]; then
  echo "Robots.txt dosyası oluşturuluyor..."
  mkdir -p dist/public
  cat > dist/public/robots.txt << EOL
User-agent: *
Allow: /
Disallow: /api/admin/
Disallow: /admin/

# Sitemap
Sitemap: https://www.localhost.tr/sitemap.xml

# Crawl-delay
Crawl-delay: 10
EOL
  echo "Robots.txt dosyası oluşturuldu."
else
  echo "Robots.txt dosyası zaten mevcut."
fi

# PM2 servisini yeniden başlat
pm2 restart blog-app

# Nginx servisini yeniden başlat
sudo systemctl restart nginx

echo "Güncelleme tamamlandı!" 
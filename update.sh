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
  # Robots.txt dosyasını doğrudan oluştur
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
fi

# Ads.txt dosyasının varlığını kontrol et
echo "Ads.txt dosyası kontrol ediliyor..."
if [ ! -f "dist/public/ads.txt" ]; then
  echo "Ads.txt dosyası oluşturuluyor..."
  mkdir -p dist/public
  # Ads.txt dosyasını doğrudan oluştur
  cat > dist/public/ads.txt << EOL
google.com, pub-6656219753705244, DIRECT, f08c47fec0942fa0
EOL
  echo "Ads.txt dosyası oluşturuldu."
fi

# Robots.txt dosyasının içeriğini göster
echo "Robots.txt dosyası içeriği:"
cat dist/public/robots.txt

# Ads.txt dosyasının içeriğini göster
echo "Ads.txt dosyası içeriği:"
cat dist/public/ads.txt

# Robots.txt ve Ads.txt dosyalarının izinlerini ayarla
chmod 644 dist/public/robots.txt
chmod 644 dist/public/ads.txt
echo "Dosya izinleri ayarlandı."

# PM2 servisini yeniden başlat
pm2 restart blog-app

# Nginx servisini yeniden başlat
sudo systemctl restart nginx

echo "Güncelleme tamamlandı!" 
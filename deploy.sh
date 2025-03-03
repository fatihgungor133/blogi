#!/bin/bash

# Gerekli paketleri yükle
echo "Gerekli paketler yükleniyor..."
apt-get update
apt-get install -y nodejs npm nginx

# Node.js'in güncel sürümünü yükle
echo "Node.js güncelleniyor..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# PM2'yi yükle
echo "PM2 yükleniyor..."
npm install -g pm2

# Bağımlılıkları yükle
echo "Bağımlılıklar yükleniyor..."
npm install

# Uygulamayı derle
echo "Uygulama derleniyor..."
npm run build

# PM2 ile uygulamayı başlat
echo "Uygulama başlatılıyor..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Nginx yapılandırması
echo "Nginx yapılandırılıyor..."
cat > /etc/nginx/sites-available/blog-app << 'EOL'
server {
    listen 80;
    server_name example.com www.example.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOL

# Nginx yapılandırmasını etkinleştir
ln -s /etc/nginx/sites-available/blog-app /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

echo "Kurulum tamamlandı!"
echo "Nginx yapılandırmasında 'example.com' yerine kendi domain adınızı eklemeyi unutmayın." 
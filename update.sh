#!/bin/bash

# Git değişikliklerini çek
git pull origin main

# Bağımlılıkları yükle
npm install

# Uygulamayı derle
npm run build

# PM2 servisini yeniden başlat
pm2 restart blog-app

# Nginx servisini yeniden başlat
sudo systemctl restart nginx

echo "Güncelleme tamamlandı!" 
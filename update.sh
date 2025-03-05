#!/bin/bash

# Git'ten en son değişiklikleri çek
git pull origin main

# Bağımlılıkları güncelle
npm install

# Uygulamayı derle
npm run build

# PM2 ile uygulamayı yeniden başlat
pm2 restart blog-app

# Nginx'i yeniden başlat
sudo systemctl restart nginx 
import { pool } from './db';

async function createTables() {
  try {
    // Admins tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Site ayarları tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        site_name VARCHAR(100) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Footer ayarları tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS footer_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        about_text TEXT NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Varsayılan admin kullanıcısı (admin:admin123)
    await pool.query(`
      INSERT INTO admins (username, password)
      SELECT 'admin', '$2b$10$8KvT5KXpdLH6kFzVPOf/heYoKzx9wkZbE1eM9v6VBCfj7OqUYhZie'
      WHERE NOT EXISTS (SELECT 1 FROM admins WHERE username = 'admin')
    `);

    // Varsayılan site ayarları
    await pool.query(`
      INSERT INTO site_settings (site_name)
      SELECT 'Blog'
      WHERE NOT EXISTS (SELECT 1 FROM site_settings LIMIT 1)
    `);

    // Varsayılan footer ayarları
    await pool.query(`
      INSERT INTO footer_settings (about_text, email, phone)
      SELECT 'Modern ve SEO uyumlu blog platformu', 'info@example.com', '+90 212 123 45 67'
      WHERE NOT EXISTS (SELECT 1 FROM footer_settings LIMIT 1)
    `);

    console.log('Migration başarıyla tamamlandı');
  } catch (error) {
    console.error('Migration sırasında hata:', error);
    throw error;
  }
}

// Migration'ı başlat
createTables().catch(console.error);

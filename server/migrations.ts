import { pool } from './db';
import bcrypt from 'bcrypt';

async function createTables() {
  try {
    // Drop existing tables to start fresh
    await pool.query('DROP TABLE IF EXISTS admins, site_settings, footer_settings');

    // Admins tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Varsayılan admin şifresini hash'le
    const defaultPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Varsayılan admin kullanıcısı
    await pool.query(`
      INSERT INTO admins (username, password)
      SELECT 'admin', ? 
      WHERE NOT EXISTS (SELECT 1 FROM admins WHERE username = 'admin')
    `, [hashedPassword]);

    // Diğer tablolar aynı kalacak...
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        site_name VARCHAR(100) NOT NULL,
        meta_description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS footer_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        about_text TEXT NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Varsayılan site ayarları
    await pool.query(`
      INSERT INTO site_settings (site_name, meta_description)
      SELECT 'Blog', 'Modern, çok dilli blog platformu'
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
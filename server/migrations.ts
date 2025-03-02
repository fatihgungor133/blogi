import { pool } from './db';
import bcrypt from 'bcrypt';

async function createTables() {
  try {
    // Admins tablosu - varsa bırak, yoksa oluştur
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Varsayılan admin kullanıcısı - sadece tablo boşsa ekle
    const defaultPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    await pool.query(`
      INSERT INTO admins (username, password)
      SELECT 'admin', ? 
      WHERE NOT EXISTS (SELECT 1 FROM admins WHERE username = 'admin')
    `, [hashedPassword]);

    // Site ayarları tablosu - varsa bırak, yoksa oluştur
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        site_name VARCHAR(100) NOT NULL,
        meta_description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Footer ayarları tablosu - varsa bırak, yoksa oluştur
    await pool.query(`
      CREATE TABLE IF NOT EXISTS footer_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        about_text TEXT NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Varsayılan site ayarları - sadece tablo boşsa ekle
    await pool.query(`
      INSERT INTO site_settings (site_name, meta_description)
      SELECT 'Blog', 'Modern, çok dilli blog platformu'
      WHERE NOT EXISTS (SELECT 1 FROM site_settings LIMIT 1)
    `);

    // Varsayılan footer ayarları - sadece tablo boşsa ekle
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
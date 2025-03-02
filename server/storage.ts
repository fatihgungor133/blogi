import { pool } from './db';
import type { Content, Admin, SiteSettings, FooterSettings } from '@shared/schema';
import { createSlug } from '../client/src/lib/utils';

export interface IStorage {
  getTitles(page: number, limit: number): Promise<{titles: Content[], total: number}>;
  getContent(titleId: number): Promise<Content | undefined>;
  searchContent(query: string): Promise<Content[]>;
  getPopularContent(): Promise<Content[]>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  getSiteSettings(): Promise<SiteSettings>;
  updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings>;
  getFooterSettings(): Promise<FooterSettings>;
  updateFooterSettings(settings: Partial<FooterSettings>): Promise<FooterSettings>;
}

export class DatabaseStorage implements IStorage {
  async getTitles(page: number, limit: number): Promise<{titles: Content[], total: number}> {
    try {
      const [rows] = await pool.query(
        'SELECT i.id, i.baslik_id, i.content, i.views, t.title FROM icerik i LEFT JOIN titles t ON i.baslik_id = t.id ORDER BY i.id DESC LIMIT ?, ?',
        [(page - 1) * limit, limit]
      );

      const [totalRows] = await pool.query('SELECT COUNT(*) as total FROM icerik');
      const total = totalRows[0].total;

      const titlesWithSlug = (rows as Content[]).map(content => ({
        ...content,
        slug: content.title ? createSlug(content.title) : `icerik-${content.id}`
      }));

      return {
        titles: titlesWithSlug,
        total: total as number
      };
    } catch (error) {
      console.error('Error fetching content:', error);
      throw error;
    }
  }

  async getContent(titleId: number): Promise<Content | undefined> {
    try {
      const [rows] = await pool.query(
        'SELECT i.id, i.baslik_id, i.content, i.views, t.title FROM icerik i LEFT JOIN titles t ON i.baslik_id = t.id WHERE i.baslik_id = ?',
        [titleId]
      );

      const content = rows[0] as Content | undefined;

      if (content) {
        content.slug = content.title ? createSlug(content.title) : `icerik-${content.id}`;
      }

      return content;
    } catch (error) {
      console.error('Error fetching content:', error);
      throw error;
    }
  }

  async searchContent(query: string): Promise<Content[]> {
    try {
      const [rows] = await pool.query(
        `SELECT i.id, i.baslik_id, i.content, i.views, t.title 
         FROM icerik i 
         LEFT JOIN titles t ON i.baslik_id = t.id 
         WHERE t.title LIKE ? OR i.content LIKE ?
         LIMIT 10`,
        [`%${query}%`, `%${query}%`]
      );

      return (rows as Content[]).map(content => ({
        ...content,
        slug: content.title ? createSlug(content.title) : `icerik-${content.id}`
      }));
    } catch (error) {
      console.error('Error searching content:', error);
      throw error;
    }
  }

  async getPopularContent(): Promise<Content[]> {
    try {
      const [rows] = await pool.query(
        `SELECT i.id, i.baslik_id, i.content, i.views, t.title 
         FROM icerik i 
         LEFT JOIN titles t ON i.baslik_id = t.id 
         ORDER BY i.views DESC 
         LIMIT 40`
      );

      return (rows as Content[]).map(content => ({
        ...content,
        slug: content.title ? createSlug(content.title) : `icerik-${content.id}`
      }));
    } catch (error) {
      console.error('Error fetching popular content:', error);
      throw error;
    }
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    try {
      console.log('Getting admin by username:', username);
      const [rows] = await pool.query(
        'SELECT * FROM admins WHERE username = ?',
        [username]
      );
      console.log('Query result:', rows);
      return rows[0] as Admin | undefined;
    } catch (error) {
      console.error('Error fetching admin:', error);
      throw error;
    }
  }

  async getSiteSettings(): Promise<SiteSettings> {
    try {
      console.log('Fetching site settings');
      const [rows] = await pool.query('SELECT * FROM site_settings LIMIT 1');
      console.log('Raw site settings from DB:', rows[0]);

      if (!rows[0]) {
        console.log('No settings found, creating default settings');
        const [result] = await pool.query(
          'INSERT INTO site_settings (site_name, meta_description) VALUES (?, ?)',
          ['Blog', 'Modern, çok dilli blog platformu']
        );
        const [inserted] = await pool.query('SELECT * FROM site_settings WHERE id = ?', [result.insertId]);
        console.log('Created default settings:', inserted[0]);

        return {
          id: inserted[0].id,
          siteName: inserted[0].site_name,
          metaDescription: inserted[0].meta_description,
          updatedAt: inserted[0].updated_at
        };
      }

      const settings = {
        id: rows[0].id,
        siteName: rows[0].site_name,
        metaDescription: rows[0].meta_description,
        updatedAt: rows[0].updated_at
      };

      console.log('Transformed site settings:', settings);
      return settings;
    } catch (error) {
      console.error('Error fetching site settings:', error);
      throw error;
    }
  }

  async updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    try {
      console.log('Updating site settings with:', settings);
      const [existing] = await pool.query('SELECT * FROM site_settings LIMIT 1');
      console.log('Existing settings:', existing[0]);

      if (existing[0]) {
        await pool.query(
          'UPDATE site_settings SET site_name = ?, meta_description = ?, updated_at = NOW() WHERE id = ?',
          [
            settings.siteName || existing[0].site_name,
            settings.metaDescription || existing[0].meta_description,
            existing[0].id
          ]
        );

        const [updated] = await pool.query('SELECT * FROM site_settings WHERE id = ?', [existing[0].id]);
        console.log('Raw updated settings from DB:', updated[0]);

        const transformedSettings = {
          id: updated[0].id,
          siteName: updated[0].site_name,
          metaDescription: updated[0].meta_description,
          updatedAt: updated[0].updated_at
        };

        console.log('Transformed updated settings:', transformedSettings);
        return transformedSettings;
      } else {
        const [result] = await pool.query(
          'INSERT INTO site_settings (site_name, meta_description) VALUES (?, ?)',
          [settings.siteName, settings.metaDescription]
        );

        const [inserted] = await pool.query('SELECT * FROM site_settings WHERE id = ?', [result.insertId]);
        console.log('Raw inserted settings from DB:', inserted[0]);

        const transformedSettings = {
          id: inserted[0].id,
          siteName: inserted[0].site_name,
          metaDescription: inserted[0].meta_description,
          updatedAt: inserted[0].updated_at
        };

        console.log('Transformed inserted settings:', transformedSettings);
        return transformedSettings;
      }
    } catch (error) {
      console.error('Error updating site settings:', error);
      throw error;
    }
  }

  async getFooterSettings(): Promise<FooterSettings> {
    try {
      const [rows] = await pool.query('SELECT * FROM footer_settings LIMIT 1');
      return rows[0] as FooterSettings;
    } catch (error) {
      console.error('Error fetching footer settings:', error);
      throw error;
    }
  }

  async updateFooterSettings(settings: Partial<FooterSettings>): Promise<FooterSettings> {
    try {
      const [existing] = await pool.query('SELECT * FROM footer_settings LIMIT 1');

      if (existing[0]) {
        const [rows] = await pool.query(
          'UPDATE footer_settings SET about_text = ?, email = ?, phone = ?, updated_at = NOW() WHERE id = ?',
          [settings.aboutText, settings.email, settings.phone, existing[0].id]
        );
        return rows[0] as FooterSettings;
      } else {
        const [rows] = await pool.query(
          'INSERT INTO footer_settings (about_text, email, phone) VALUES (?, ?, ?)',
          [settings.aboutText, settings.email, settings.phone]
        );
        return rows[0] as FooterSettings;
      }
    } catch (error) {
      console.error('Error updating footer settings:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
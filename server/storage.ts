import { pool } from './db';
import type { Content, Admin, SiteSettings, FooterSettings } from '@shared/schema';
import { createSlug } from '../client/src/lib/utils';

export interface IStorage {
  getTitles(page: number, limit: number): Promise<{titles: Content[], total: number}>;
  getContent(titleId: number): Promise<Content | undefined>;
  searchContent(query: string): Promise<Content[]>;
  getPopularContent(): Promise<Content[]>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  getAdminById(id: number): Promise<Admin | undefined>;
  getSiteSettings(): Promise<SiteSettings>;
  updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings>;
  getFooterSettings(): Promise<FooterSettings>;
  updateFooterSettings(settings: Partial<FooterSettings>): Promise<FooterSettings>;
  getAllContentIds(): Promise<{id: number, baslik_id: number, title: string | null}[]>;
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
      const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error fetching admin:', error);
      throw error;
    }
  }

  async getAdminById(id: number): Promise<Admin | undefined> {
    try {
      const [rows] = await pool.query('SELECT * FROM admins WHERE id = ?', [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error fetching admin:', error);
      throw error;
    }
  }

  async getSiteSettings(): Promise<SiteSettings> {
    try {
      const [rows] = await pool.query('SELECT * FROM site_settings LIMIT 1');
      
      if (rows.length === 0) {
        // Varsayılan ayarları oluştur
        const defaultSettings: SiteSettings = {
          siteName: 'Blog İçerik Tarayıcısı',
          siteDescription: 'Tüm blog içerikleriniz için tek adres',
          logoUrl: '/logo.png',
          faviconUrl: '/favicon.ico',
          primaryColor: '#3490dc',
          secondaryColor: '#ffed4a',
          fontFamily: 'Roboto, sans-serif'
        };
        
        const [inserted] = await pool.query(
          'INSERT INTO site_settings (site_name, site_description, logo_url, favicon_url, primary_color, secondary_color, font_family) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [defaultSettings.siteName, defaultSettings.siteDescription, defaultSettings.logoUrl, defaultSettings.faviconUrl, defaultSettings.primaryColor, defaultSettings.secondaryColor, defaultSettings.fontFamily]
        );
        
        return defaultSettings;
      }
      
      // Veritabanı sütun adlarını JavaScript camelCase'e dönüştür
      const settings: SiteSettings = {
        siteName: rows[0].site_name,
        siteDescription: rows[0].site_description,
        logoUrl: rows[0].logo_url,
        faviconUrl: rows[0].favicon_url,
        primaryColor: rows[0].primary_color,
        secondaryColor: rows[0].secondary_color,
        fontFamily: rows[0].font_family
      };
      
      return settings;
    } catch (error) {
      console.error('Error fetching site settings:', error);
      throw error;
    }
  }

  async updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    try {
      const [existing] = await pool.query('SELECT * FROM site_settings LIMIT 1');
      
      if (existing.length === 0) {
        // Ayarlar yoksa, yeni ayarlar oluştur
        const newSettings: SiteSettings = {
          siteName: settings.siteName || 'Blog İçerik Tarayıcısı',
          siteDescription: settings.siteDescription || 'Tüm blog içerikleriniz için tek adres',
          logoUrl: settings.logoUrl || '/logo.png',
          faviconUrl: settings.faviconUrl || '/favicon.ico',
          primaryColor: settings.primaryColor || '#3490dc',
          secondaryColor: settings.secondaryColor || '#ffed4a',
          fontFamily: settings.fontFamily || 'Roboto, sans-serif'
        };
        
        const [inserted] = await pool.query(
          'INSERT INTO site_settings (site_name, site_description, logo_url, favicon_url, primary_color, secondary_color, font_family) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [newSettings.siteName, newSettings.siteDescription, newSettings.logoUrl, newSettings.faviconUrl, newSettings.primaryColor, newSettings.secondaryColor, newSettings.fontFamily]
        );
        
        const transformedSettings: SiteSettings = {
          siteName: newSettings.siteName,
          siteDescription: newSettings.siteDescription,
          logoUrl: newSettings.logoUrl,
          faviconUrl: newSettings.faviconUrl,
          primaryColor: newSettings.primaryColor,
          secondaryColor: newSettings.secondaryColor,
          fontFamily: newSettings.fontFamily
        };
        
        return transformedSettings;
      }
      
      // Mevcut ayarları güncelle
      const updateFields = [];
      const updateValues = [];
      
      if (settings.siteName !== undefined) {
        updateFields.push('site_name = ?');
        updateValues.push(settings.siteName);
      }
      
      if (settings.siteDescription !== undefined) {
        updateFields.push('site_description = ?');
        updateValues.push(settings.siteDescription);
      }
      
      if (settings.logoUrl !== undefined) {
        updateFields.push('logo_url = ?');
        updateValues.push(settings.logoUrl);
      }
      
      if (settings.faviconUrl !== undefined) {
        updateFields.push('favicon_url = ?');
        updateValues.push(settings.faviconUrl);
      }
      
      if (settings.primaryColor !== undefined) {
        updateFields.push('primary_color = ?');
        updateValues.push(settings.primaryColor);
      }
      
      if (settings.secondaryColor !== undefined) {
        updateFields.push('secondary_color = ?');
        updateValues.push(settings.secondaryColor);
      }
      
      if (settings.fontFamily !== undefined) {
        updateFields.push('font_family = ?');
        updateValues.push(settings.fontFamily);
      }
      
      if (updateFields.length > 0) {
        const [updated] = await pool.query(
          `UPDATE site_settings SET ${updateFields.join(', ')}`,
          updateValues
        );
      }
      
      // Güncellenmiş ayarları getir
      return await this.getSiteSettings();
    } catch (error) {
      console.error('Error updating site settings:', error);
      throw error;
    }
  }

  async getFooterSettings(): Promise<FooterSettings> {
    try {
      const [rows] = await pool.query('SELECT * FROM footer_settings LIMIT 1');
      
      if (rows.length === 0) {
        // Varsayılan footer ayarlarını oluştur
        const defaultSettings: FooterSettings = {
          copyrightText: '© 2023 Blog İçerik Tarayıcısı. Tüm hakları saklıdır.',
          showSocialLinks: true,
          facebookUrl: 'https://facebook.com',
          twitterUrl: 'https://twitter.com',
          instagramUrl: 'https://instagram.com',
          linkedinUrl: 'https://linkedin.com',
          showContactInfo: true,
          email: 'info@example.com',
          phone: '+90 555 123 4567',
          address: 'İstanbul, Türkiye'
        };
        
        const [inserted] = await pool.query(
          'INSERT INTO footer_settings (copyright_text, show_social_links, facebook_url, twitter_url, instagram_url, linkedin_url, show_contact_info, email, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [defaultSettings.copyrightText, defaultSettings.showSocialLinks, defaultSettings.facebookUrl, defaultSettings.twitterUrl, defaultSettings.instagramUrl, defaultSettings.linkedinUrl, defaultSettings.showContactInfo, defaultSettings.email, defaultSettings.phone, defaultSettings.address]
        );
        
        return defaultSettings;
      }
      
      // Veritabanı sütun adlarını JavaScript camelCase'e dönüştür
      const settings: FooterSettings = {
        copyrightText: rows[0].copyright_text,
        showSocialLinks: Boolean(rows[0].show_social_links),
        facebookUrl: rows[0].facebook_url,
        twitterUrl: rows[0].twitter_url,
        instagramUrl: rows[0].instagram_url,
        linkedinUrl: rows[0].linkedin_url,
        showContactInfo: Boolean(rows[0].show_contact_info),
        email: rows[0].email,
        phone: rows[0].phone,
        address: rows[0].address
      };
      
      return settings;
    } catch (error) {
      console.error('Error fetching footer settings:', error);
      throw error;
    }
  }

  async updateFooterSettings(settings: Partial<FooterSettings>): Promise<FooterSettings> {
    try {
      const [existing] = await pool.query('SELECT * FROM footer_settings LIMIT 1');
      
      if (existing.length === 0) {
        // Ayarlar yoksa, yeni ayarlar oluştur
        const newSettings: FooterSettings = {
          copyrightText: settings.copyrightText || '© 2023 Blog İçerik Tarayıcısı. Tüm hakları saklıdır.',
          showSocialLinks: settings.showSocialLinks !== undefined ? settings.showSocialLinks : true,
          facebookUrl: settings.facebookUrl || 'https://facebook.com',
          twitterUrl: settings.twitterUrl || 'https://twitter.com',
          instagramUrl: settings.instagramUrl || 'https://instagram.com',
          linkedinUrl: settings.linkedinUrl || 'https://linkedin.com',
          showContactInfo: settings.showContactInfo !== undefined ? settings.showContactInfo : true,
          email: settings.email || 'info@example.com',
          phone: settings.phone || '+90 555 123 4567',
          address: settings.address || 'İstanbul, Türkiye'
        };
        
        const [inserted] = await pool.query(
          'INSERT INTO footer_settings (copyright_text, show_social_links, facebook_url, twitter_url, instagram_url, linkedin_url, show_contact_info, email, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [newSettings.copyrightText, newSettings.showSocialLinks, newSettings.facebookUrl, newSettings.twitterUrl, newSettings.instagramUrl, newSettings.linkedinUrl, newSettings.showContactInfo, newSettings.email, newSettings.phone, newSettings.address]
        );
        
        const transformedSettings: FooterSettings = {
          copyrightText: newSettings.copyrightText,
          showSocialLinks: newSettings.showSocialLinks,
          facebookUrl: newSettings.facebookUrl,
          twitterUrl: newSettings.twitterUrl,
          instagramUrl: newSettings.instagramUrl,
          linkedinUrl: newSettings.linkedinUrl,
          showContactInfo: newSettings.showContactInfo,
          email: newSettings.email,
          phone: newSettings.phone,
          address: newSettings.address
        };
        
        return transformedSettings;
      }
      
      // Mevcut ayarları güncelle
      const updateFields = [];
      const updateValues = [];
      
      if (settings.copyrightText !== undefined) {
        updateFields.push('copyright_text = ?');
        updateValues.push(settings.copyrightText);
      }
      
      if (settings.showSocialLinks !== undefined) {
        updateFields.push('show_social_links = ?');
        updateValues.push(settings.showSocialLinks);
      }
      
      if (settings.facebookUrl !== undefined) {
        updateFields.push('facebook_url = ?');
        updateValues.push(settings.facebookUrl);
      }
      
      if (settings.twitterUrl !== undefined) {
        updateFields.push('twitter_url = ?');
        updateValues.push(settings.twitterUrl);
      }
      
      if (settings.instagramUrl !== undefined) {
        updateFields.push('instagram_url = ?');
        updateValues.push(settings.instagramUrl);
      }
      
      if (settings.linkedinUrl !== undefined) {
        updateFields.push('linkedin_url = ?');
        updateValues.push(settings.linkedinUrl);
      }
      
      if (settings.showContactInfo !== undefined) {
        updateFields.push('show_contact_info = ?');
        updateValues.push(settings.showContactInfo);
      }
      
      if (settings.email !== undefined) {
        updateFields.push('email = ?');
        updateValues.push(settings.email);
      }
      
      if (settings.phone !== undefined) {
        updateFields.push('phone = ?');
        updateValues.push(settings.phone);
      }
      
      if (settings.address !== undefined) {
        updateFields.push('address = ?');
        updateValues.push(settings.address);
      }
      
      if (updateFields.length > 0) {
        const [updated] = await pool.query(
          `UPDATE footer_settings SET ${updateFields.join(', ')}`,
          updateValues
        );
      }
      
      // Güncellenmiş ayarları getir
      return await this.getFooterSettings();
    } catch (error) {
      console.error('Error updating footer settings:', error);
      throw error;
    }
  }

  async getAllContentIds(): Promise<{id: number, baslik_id: number, title: string | null}[]> {
    try {
      const [rows] = await pool.query(
        'SELECT i.id, i.baslik_id, t.title FROM icerik i LEFT JOIN titles t ON i.baslik_id = t.id ORDER BY i.id'
      );
      
      return rows as {id: number, baslik_id: number, title: string | null}[];
    } catch (error) {
      console.error('Error fetching all content IDs:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
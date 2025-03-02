import { pool } from './db';
import type { Content } from '@shared/schema';
import { createSlug } from '../client/src/lib/utils';

export interface IStorage {
  getTitles(page: number, limit: number): Promise<{titles: Content[], total: number}>;
  getContent(titleId: number): Promise<Content | undefined>;
  searchContent(query: string): Promise<Content[]>;
  getPopularContent(): Promise<Content[]>;
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
}

export const storage = new DatabaseStorage();
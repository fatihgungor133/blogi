import { pool } from './db';
import type { Content } from '@shared/schema';

export interface IStorage {
  getTitles(page: number, limit: number): Promise<{titles: Content[], total: number}>;
  getContent(titleId: number): Promise<Content | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getTitles(page: number, limit: number): Promise<{titles: Content[], total: number}> {
    try {
      const [rows] = await pool.execute<any>(
        'SELECT id, baslik_id, content FROM icerik LIMIT ?, ?',
        [(page - 1) * limit, limit]
      );

      const [totalRows] = await pool.execute<any>('SELECT COUNT(*) as total FROM icerik');
      const total = totalRows[0].total;

      return {
        titles: rows as Content[],
        total: total as number
      };
    } catch (error) {
      console.error('Error fetching content:', error);
      throw error;
    }
  }

  async getContent(titleId: number): Promise<Content | undefined> {
    try {
      const [rows] = await pool.execute<any>(
        'SELECT id, baslik_id, content FROM icerik WHERE baslik_id = ?',
        [titleId]
      );

      const content = rows[0];
      return content as Content | undefined;
    } catch (error) {
      console.error('Error fetching content:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
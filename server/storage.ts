import { pool } from './db';
import type { Title, Content } from '@shared/schema';

export interface IStorage {
  getTitles(page: number, limit: number): Promise<{titles: Title[], total: number}>;
  getContent(titleId: number): Promise<Content | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getTitles(page: number, limit: number): Promise<{titles: Title[], total: number}> {
    const offset = (page - 1) * limit;

    try {
      // Use prepared statement for better security
      const [rows] = await pool.execute<any>(
        'SELECT SQL_CALC_FOUND_ROWS id, title FROM baslik LIMIT ? OFFSET ?',
        [limit, offset]
      );

      const [totalRows] = await pool.execute<any>('SELECT FOUND_ROWS() as total');
      const total = totalRows[0].total;

      return {
        titles: rows as Title[],
        total: total as number
      };
    } catch (error) {
      console.error('Error fetching titles:', error);
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
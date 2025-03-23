import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createSlug(title: string): string {
  // Satır atlama karakterlerini tamamen kaldır
  const cleanTitle = title.replace(/[\n\r]+/g, '');
  
  return cleanTitle
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function parseHeadings(content: string): { id: string; text: string }[] {
  const headingRegex = /<h2[^>]*>(.*?)<\/h2>/g;
  const headings: { id: string; text: string }[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const text = match[1].replace(/<[^>]*>/g, ''); // Remove any nested HTML tags
    const id = createSlug(text);
    headings.push({ id, text });
  }

  return headings;
}

export function addHeadingIds(content: string): string {
  return content.replace(
    /<h2[^>]*>(.*?)<\/h2>/g,
    (match, text) => `<h2 id="${createSlug(text.replace(/<[^>]*>/g, ''))}">${text}</h2>`
  );
}

/**
 * Yerel depolamadan içeriği getir
 * @param key - Önbellek anahtarı
 * @returns İçerik veya null
 */
export function getFromLocalCache<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch (error) {
    console.error('Yerel önbellek okuma hatası:', error);
  }
  return null;
}

/**
 * Yerel depolamaya içeriği kaydet
 * @param key - Önbellek anahtarı
 * @param data - Kaydedilecek veri
 */
export function saveToLocalCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Yerel önbellek yazma hatası:', error);
  }
}
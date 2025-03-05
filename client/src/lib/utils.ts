import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/\?/g, '')
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
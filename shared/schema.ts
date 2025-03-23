import { pgTable, text, serial, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const titles = pgTable("titles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull()
});

export const contents = pgTable("icerik", {
  id: serial("id").primaryKey(),
  baslik_id: integer("baslik_id").notNull(),
  content: text("content").notNull(),
  views: integer("views").default(0).notNull()
});

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  siteName: varchar("site_name", { length: 100 }).notNull(),
  metaDescription: text("meta_description"),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const footerSettings = pgTable("footer_settings", {
  id: serial("id").primaryKey(),
  aboutText: text("about_text").notNull(),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Types
export interface Content {
  id: number;
  baslik_id: number;
  content: string;
  title?: string;
  slug?: string;
  views: number;
}

export interface Admin {
  id: number;
  username: string;
  password: string;
  createdAt: Date;
}

export interface SiteSettings {
  id: number;
  siteName: string;
  metaDescription: string | null;
  updatedAt: Date;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
}

export interface FooterSettings {
  id: number;
  aboutText: string;
  email: string | null;
  phone: string | null;
  updatedAt: Date;
  copyright?: string;
  showSocialLinks?: boolean;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  showContactInfo?: boolean;
  address?: string;
}

// Zod schemas for validation
export const insertAdminSchema = createInsertSchema(admins).extend({
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır")
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettings);
export const insertFooterSettingsSchema = createInsertSchema(footerSettings);

export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type InsertFooterSettings = z.infer<typeof insertFooterSettingsSchema>;
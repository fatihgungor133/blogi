import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const titles = pgTable("baslik", {
  id: serial("id").primaryKey(),
  title: text("title").notNull()
});

export const contents = pgTable("icerik", {
  id: serial("id").primaryKey(),
  baslik_id: integer("baslik_id").notNull(),
  content: text("content").notNull()
});

export type Title = typeof titles.$inferSelect;
export type Content = typeof contents.$inferSelect;
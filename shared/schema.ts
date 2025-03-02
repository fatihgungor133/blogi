import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const contents = pgTable("icerik", {
  id: serial("id").primaryKey(),
  baslik_id: integer("baslik_id").notNull(),
  content: text("content").notNull()
});

export type Content = typeof contents.$inferSelect;
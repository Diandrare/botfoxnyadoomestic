import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const moderationActionsTable = pgTable("moderation_actions", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  moderatorId: text("moderator_id").notNull(),
  moderatorName: text("moderator_name").notNull(),
  action: text("action").notNull(), // kick, ban, warn, mute
  reason: text("reason"),
  duration: integer("duration"), // mute duration in minutes
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertModerationActionSchema = createInsertSchema(moderationActionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertModerationAction = z.infer<typeof insertModerationActionSchema>;
export type ModerationAction = typeof moderationActionsTable.$inferSelect;

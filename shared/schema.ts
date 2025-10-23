import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  integer,
  text,
  date,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  passwordHash: varchar("password_hash"),
  passwordSalt: varchar("password_salt"),
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),
  goalDays: integer("goal_days").default(30),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Recovery streak tracking
export const streaks = pgTable("streaks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  startDate: date("start_date"),
  lastResetDate: date("last_reset_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Private journal entries
export const journalEntries = pgTable("journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  mood: varchar("mood", { enum: ["good", "neutral", "difficult"] }).notNull(),
  entryDate: date("entry_date").notNull(),
  isPrivate: boolean("is_private").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Progress milestones
export const milestones = pgTable("milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  targetDays: integer("target_days").notNull(),
  achievedDate: date("achieved_date"),
  isAchieved: boolean("is_achieved").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Goal achievements (completed goals)
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  goalDays: integer("goal_days").notNull(),
  startDate: date("start_date").notNull(),
  completedDate: date("completed_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas for validation
export const insertJournalEntrySchema = createInsertSchema(journalEntries).pick({
  content: true,
  mood: true,
  entryDate: true,
});

export const insertStreakSchema = createInsertSchema(streaks).pick({
  currentStreak: true,
  longestStreak: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Streak = typeof streaks.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type Milestone = typeof milestones.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type InsertStreak = z.infer<typeof insertStreakSchema>;

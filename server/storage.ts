import {
  users,
  streaks,
  journalEntries,
  milestones,
  achievements,
  type User,
  type UpsertUser,
  type Streak,
  type JournalEntry,
  type Milestone,
  type Achievement,
  type InsertJournalEntry,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { encryptJournalContent, decryptJournalContent } from "./crypto";
import { randomUUID } from "crypto";

// Interface for storage operations
export interface IStorage {
  // User operations - (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUserWithPassword(user: { email: string; firstName: string; lastName: string; passwordHash: string; passwordSalt: string }): Promise<User>;
  
  // Onboarding operations
  completeOnboarding(userId: string, goalDays: number): Promise<void>;
  initializeStreak(userId: string, startDate: string): Promise<void>;

  // Streak operations
  getStreakByUserId(userId: string): Promise<Streak | undefined>;
  updateStreak(userId: string, currentStreak: number, longestStreak: number): Promise<Streak>;
  resetStreak(userId: string): Promise<Streak>;
  
  // Journal operations
  getJournalEntries(userId: string): Promise<JournalEntry[]>;
  createJournalEntry(userId: string, entry: InsertJournalEntry): Promise<JournalEntry>;
  updateJournalEntry(entryId: string, userId: string, entry: InsertJournalEntry): Promise<JournalEntry>;
  deleteJournalEntry(entryId: string, userId: string): Promise<void>;

  // Milestone operations
  getMilestones(userId: string): Promise<Milestone[]>;
  createDefaultMilestones(userId: string): Promise<void>;
  updateMilestone(milestoneId: string, isAchieved: boolean, achievedDate?: string): Promise<void>;

  // Achievement operations
  getAchievements(userId: string): Promise<Achievement[]>;
  createAchievement(userId: string, goalDays: number, startDate: string, completedDate: string): Promise<Achievement>;

  // Goal update operations
  updateUserGoal(userId: string, goalDays: number, startDate: string, isNewGoal: boolean): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations - (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUserWithPassword(userData: { email: string; firstName: string; lastName: string; passwordHash: string; passwordSalt: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        passwordHash: userData.passwordHash,
        passwordSalt: userData.passwordSalt,
      })
      .returning();

    // Create default streak and milestones for new users
    await this.ensureUserDefaults(user.id);

    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Create default streak and milestones for new users
    await this.ensureUserDefaults(user.id);

    return user;
  }

  // Onboarding operations
  async completeOnboarding(userId: string, goalDays: number): Promise<void> {
    await db
      .update(users)
      .set({
        hasCompletedOnboarding: true,
        goalDays,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async initializeStreak(userId: string, startDate: string): Promise<void> {
    await db
      .update(streaks)
      .set({
        startDate,
        updatedAt: new Date(),
      })
      .where(eq(streaks.userId, userId));
  }

  // Streak operations
  async getStreakByUserId(userId: string): Promise<Streak | undefined> {
    const [streak] = await db.select().from(streaks).where(eq(streaks.userId, userId));

    if (!streak) {
      return undefined;
    }

    // Calculate current streak based on start date
    if (streak.startDate) {
      const startDate = new Date(streak.startDate);
      const today = new Date();

      // Reset time to start of day for accurate day calculation
      startDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      // Calculate the difference in days
      const diffInMs = today.getTime() - startDate.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      // Update the currentStreak with calculated value
      const calculatedStreak = Math.max(0, diffInDays);

      // Update the longest streak if current is higher
      const updatedLongestStreak = Math.max(streak.longestStreak, calculatedStreak);

      // Update streak in database with calculated values
      if (calculatedStreak !== streak.currentStreak || updatedLongestStreak !== streak.longestStreak) {
        const [updatedStreak] = await db
          .update(streaks)
          .set({
            currentStreak: calculatedStreak,
            longestStreak: updatedLongestStreak,
            updatedAt: new Date(),
          })
          .where(eq(streaks.userId, userId))
          .returning();

        return updatedStreak;
      }
    }

    return streak;
  }

  async updateStreak(userId: string, currentStreak: number, longestStreak: number): Promise<Streak> {
    const existingStreak = await this.getStreakByUserId(userId);
    
    if (existingStreak) {
      const [updatedStreak] = await db
        .update(streaks)
        .set({
          currentStreak,
          longestStreak: Math.max(longestStreak, currentStreak),
          updatedAt: new Date(),
        })
        .where(eq(streaks.userId, userId))
        .returning();
      return updatedStreak;
    } else {
      const [newStreak] = await db
        .insert(streaks)
        .values({
          userId,
          currentStreak,
          longestStreak: Math.max(longestStreak, currentStreak),
        })
        .returning();
      return newStreak;
    }
  }

  async resetStreak(userId: string): Promise<Streak> {
    const today = new Date().toISOString().split('T')[0];
    const [resetStreak] = await db
      .update(streaks)
      .set({
        currentStreak: 0,
        startDate: today,
        lastResetDate: today,
        updatedAt: new Date(),
      })
      .where(eq(streaks.userId, userId))
      .returning();
    return resetStreak;
  }

  // Journal operations
  async getJournalEntries(userId: string): Promise<JournalEntry[]> {
    const encryptedEntries = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt));
    
    // Decrypt journal content before returning with proper error handling
    return encryptedEntries.map(entry => {
      try {
        return {
          ...entry,
          content: decryptJournalContent(entry.content)
        };
      } catch (error) {
        console.error(`Failed to decrypt journal entry ${entry.id}:`, error);
        // Return entry with error message instead of throwing
        return {
          ...entry,
          content: '[ENCRYPTED DATA - DECRYPTION FAILED]'
        };
      }
    });
  }

  async createJournalEntry(userId: string, entry: InsertJournalEntry): Promise<JournalEntry> {
    try {
      // Encrypt the journal content before storing
      const encryptedContent = encryptJournalContent(entry.content);

      const [newEntry] = await db
        .insert(journalEntries)
        .values({
          userId,
          ...entry,
          content: encryptedContent,
        })
        .returning();

      // Return with decrypted content for immediate use
      return {
        ...newEntry,
        content: entry.content // Return original content, not encrypted
      };
    } catch (error) {
      console.error('Failed to create journal entry:', error);
      if (error instanceof Error && error.message.includes('encrypt')) {
        throw new Error('Failed to securely store journal entry - encryption error');
      }
      throw error; // Re-throw other database errors
    }
  }

  async updateJournalEntry(entryId: string, userId: string, entry: InsertJournalEntry): Promise<JournalEntry> {
    try {
      // Encrypt the updated content
      const encryptedContent = encryptJournalContent(entry.content);

      const [updatedEntry] = await db
        .update(journalEntries)
        .set({
          content: encryptedContent,
          mood: entry.mood,
          entryDate: entry.entryDate,
          updatedAt: new Date(),
        })
        .where(and(eq(journalEntries.id, entryId), eq(journalEntries.userId, userId)))
        .returning();

      if (!updatedEntry) {
        throw new Error('Journal entry not found or unauthorized');
      }

      return {
        ...updatedEntry,
        content: entry.content // Return decrypted content
      };
    } catch (error) {
      console.error('Failed to update journal entry:', error);
      throw error;
    }
  }

  async deleteJournalEntry(entryId: string, userId: string): Promise<void> {
    try {
      await db
        .delete(journalEntries)
        .where(and(eq(journalEntries.id, entryId), eq(journalEntries.userId, userId)));
    } catch (error) {
      console.error('Failed to delete journal entry:', error);
      throw error;
    }
  }

  // Milestone operations
  async getMilestones(userId: string): Promise<Milestone[]> {
    return await db
      .select()
      .from(milestones)
      .where(eq(milestones.userId, userId))
      .orderBy(milestones.targetDays);
  }

  async createDefaultMilestones(userId: string): Promise<void> {
    const defaultMilestones = [
      { title: "First Day Clean", targetDays: 1 },
      { title: "One Week Strong", targetDays: 7 },
      { title: "Two Weeks Free", targetDays: 14 },
      { title: "One Month Milestone", targetDays: 30 },
      { title: "Two Months Clean", targetDays: 60 },
      { title: "Three Months Strong", targetDays: 90 },
      { title: "Half Year Achievement", targetDays: 180 },
      { title: "One Year Victory", targetDays: 365 },
    ];

    await db.insert(milestones).values(
      defaultMilestones.map(milestone => ({
        userId,
        ...milestone,
      }))
    );
  }

  async updateMilestone(milestoneId: string, isAchieved: boolean, achievedDate?: string): Promise<void> {
    await db
      .update(milestones)
      .set({
        isAchieved,
        achievedDate: achievedDate || null,
      })
      .where(eq(milestones.id, milestoneId));
  }

  // Achievement operations
  async getAchievements(userId: string): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId))
      .orderBy(desc(achievements.completedDate));
  }

  async createAchievement(userId: string, goalDays: number, startDate: string, completedDate: string): Promise<Achievement> {
    const [achievement] = await db
      .insert(achievements)
      .values({
        userId,
        goalDays,
        startDate,
        completedDate,
      })
      .returning();
    return achievement;
  }

  // Goal update operations
  async updateUserGoal(userId: string, goalDays: number, startDate: string, isNewGoal: boolean): Promise<void> {
    // Update user's goal
    await db
      .update(users)
      .set({
        goalDays,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // If this is a new goal (after completion), create achievement for previous goal
    if (isNewGoal) {
      const user = await this.getUser(userId);
      const streak = await this.getStreakByUserId(userId);

      if (user && streak && user.goalDays && streak.startDate) {
        // Save previous goal as an achievement
        await this.createAchievement(
          userId,
          user.goalDays,
          streak.startDate,
          new Date().toISOString().split('T')[0]
        );
      }
    }

    // Update streak with new start date
    await this.initializeStreak(userId, startDate);
  }

  // Helper method to ensure user has default data
  private async ensureUserDefaults(userId: string): Promise<void> {
    // Check if user already has streak
    const existingStreak = await this.getStreakByUserId(userId);
    if (!existingStreak) {
      await db.insert(streaks).values({ userId });
    }

    // Check if user already has milestones
    const existingMilestones = await this.getMilestones(userId);
    if (existingMilestones.length === 0) {
      await this.createDefaultMilestones(userId);
    }
  }
}

// In-memory storage for local development without a database
class MemoryStorage implements IStorage {
  private users = new Map<string, User>();
  private streaks = new Map<string, Streak>();
  private journalEntries: JournalEntry[] = [];
  private milestones = new Map<string, Milestone[]>();
  private achievements = new Map<string, Achievement[]>();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const userArray = Array.from(this.users.values());
    return userArray.find(user => user.email === email);
  }

  async createUserWithPassword(userData: { email: string; firstName: string; lastName: string; passwordHash: string; passwordSalt: string }): Promise<User> {
    const now = new Date();
    const user: User = {
      id: randomUUID(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      profileImageUrl: null as any,
      passwordHash: userData.passwordHash,
      passwordSalt: userData.passwordSalt,
      createdAt: now,
      updatedAt: now,
    } as User;
    this.users.set(user.id, user);
    await this.ensureUserDefaults(user.id);
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = this.users.get(userData.id!);
    const now = new Date();
    const user: User = {
      id: userData.id || randomUUID(),
      email: userData.email ?? existing?.email ?? null as any,
      firstName: userData.firstName ?? existing?.firstName ?? null as any,
      lastName: userData.lastName ?? existing?.lastName ?? null as any,
      profileImageUrl: userData.profileImageUrl ?? existing?.profileImageUrl ?? null as any,
      passwordHash: existing?.passwordHash ?? null as any,
      passwordSalt: existing?.passwordSalt ?? null as any,
      hasCompletedOnboarding: existing?.hasCompletedOnboarding ?? false,
      goalDays: existing?.goalDays ?? 30,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    } as User;
    this.users.set(user.id, user);
    await this.ensureUserDefaults(user.id);
    return user;
  }

  async completeOnboarding(userId: string, goalDays: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      this.users.set(userId, {
        ...user,
        hasCompletedOnboarding: true,
        goalDays,
        updatedAt: new Date(),
      } as User);
    }
  }

  async initializeStreak(userId: string, startDate: string): Promise<void> {
    const streak = this.streaks.get(userId);
    if (streak) {
      this.streaks.set(userId, {
        ...streak,
        startDate: startDate as any,
        updatedAt: new Date(),
      });
    }
  }

  async getStreakByUserId(userId: string): Promise<Streak | undefined> {
    const streak = this.streaks.get(userId);

    if (!streak) {
      return undefined;
    }

    // Calculate current streak based on start date
    if (streak.startDate) {
      const startDate = new Date(streak.startDate);
      const today = new Date();

      // Reset time to start of day for accurate day calculation
      startDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      // Calculate the difference in days
      const diffInMs = today.getTime() - startDate.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      // Update the currentStreak with calculated value
      const calculatedStreak = Math.max(0, diffInDays);

      // Update the longest streak if current is higher
      const updatedLongestStreak = Math.max(streak.longestStreak, calculatedStreak);

      // Update streak in memory with calculated values
      if (calculatedStreak !== streak.currentStreak || updatedLongestStreak !== streak.longestStreak) {
        const updatedStreak = {
          ...streak,
          currentStreak: calculatedStreak,
          longestStreak: updatedLongestStreak,
          updatedAt: new Date(),
        };

        this.streaks.set(userId, updatedStreak);
        return updatedStreak;
      }
    }

    return streak;
  }

  async updateStreak(userId: string, currentStreak: number, longestStreak: number): Promise<Streak> {
    const existing = this.streaks.get(userId);
    const now = new Date();
    const updated: Streak = existing
      ? { ...existing, currentStreak, longestStreak: Math.max(longestStreak, currentStreak), updatedAt: now }
      : {
          id: randomUUID(),
          userId,
          currentStreak,
          longestStreak: Math.max(longestStreak, currentStreak),
          lastResetDate: null as any,
          createdAt: now,
          updatedAt: now,
        } as Streak;
    this.streaks.set(userId, updated);
    return updated;
  }

  async resetStreak(userId: string): Promise<Streak> {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const reset: Streak = {
      id: this.streaks.get(userId)?.id || randomUUID(),
      userId,
      currentStreak: 0,
      longestStreak: this.streaks.get(userId)?.longestStreak ?? 0,
      startDate: today as any,
      lastResetDate: today as any,
      createdAt: this.streaks.get(userId)?.createdAt ?? now,
      updatedAt: now,
    } as Streak;
    this.streaks.set(userId, reset);
    return reset;
  }

  async getJournalEntries(userId: string): Promise<JournalEntry[]> {
    const entries = this.journalEntries
      .filter((e) => e.userId === userId)
      .sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());

    return entries.map((entry) => {
      try {
        return { ...entry, content: decryptJournalContent(entry.content) };
      } catch (error) {
        console.error(`Failed to decrypt journal entry ${entry.id}:`, error);
        return { ...entry, content: "[ENCRYPTED DATA - DECRYPTION FAILED]" };
      }
    });
  }

  async createJournalEntry(userId: string, entry: InsertJournalEntry): Promise<JournalEntry> {
    const now = new Date();
    const encryptedContent = encryptJournalContent(entry.content);
    const stored: JournalEntry = {
      id: randomUUID(),
      userId,
      content: encryptedContent,
      mood: entry.mood as any,
      entryDate: entry.entryDate as any,
      isPrivate: true as any,
      createdAt: now,
      updatedAt: now,
    } as JournalEntry;
    this.journalEntries.unshift(stored);
    return { ...stored, content: entry.content };
  }

  async updateJournalEntry(entryId: string, userId: string, entry: InsertJournalEntry): Promise<JournalEntry> {
    const index = this.journalEntries.findIndex(e => e.id === entryId && e.userId === userId);
    if (index === -1) {
      throw new Error('Journal entry not found or unauthorized');
    }

    const encryptedContent = encryptJournalContent(entry.content);
    const updated: JournalEntry = {
      ...this.journalEntries[index],
      content: encryptedContent,
      mood: entry.mood as any,
      entryDate: entry.entryDate as any,
      updatedAt: new Date(),
    };

    this.journalEntries[index] = updated;
    return { ...updated, content: entry.content };
  }

  async deleteJournalEntry(entryId: string, userId: string): Promise<void> {
    const index = this.journalEntries.findIndex(e => e.id === entryId && e.userId === userId);
    if (index !== -1) {
      this.journalEntries.splice(index, 1);
    }
  }

  async getMilestones(userId: string): Promise<Milestone[]> {
    return (this.milestones.get(userId) || []).slice().sort((a, b) => a.targetDays - b.targetDays);
  }

  async createDefaultMilestones(userId: string): Promise<void> {
    const defaults = [
      { title: "First Day Clean", targetDays: 1 },
      { title: "One Week Strong", targetDays: 7 },
      { title: "Two Weeks Free", targetDays: 14 },
      { title: "One Month Milestone", targetDays: 30 },
      { title: "Two Months Clean", targetDays: 60 },
      { title: "Three Months Strong", targetDays: 90 },
      { title: "Half Year Achievement", targetDays: 180 },
      { title: "One Year Victory", targetDays: 365 },
    ];
    const list: Milestone[] = defaults.map((m) => ({
      id: randomUUID(),
      userId,
      title: m.title,
      targetDays: m.targetDays,
      achievedDate: null as any,
      isAchieved: false,
      createdAt: new Date(),
    })) as Milestone[];
    this.milestones.set(userId, list);
  }

  async updateMilestone(milestoneId: string, isAchieved: boolean, achievedDate?: string): Promise<void> {
    this.milestones.forEach((list, userId) => {
      const idx = list.findIndex((m: Milestone) => m.id === milestoneId);
      if (idx !== -1) {
        const updated = { ...list[idx], isAchieved, achievedDate: achievedDate ?? null } as Milestone;
        list[idx] = updated;
        this.milestones.set(userId, list);
      }
    });
  }

  // Achievement operations
  async getAchievements(userId: string): Promise<Achievement[]> {
    return (this.achievements.get(userId) || []).slice().sort((a, b) =>
      new Date(b.completedDate || 0).getTime() - new Date(a.completedDate || 0).getTime()
    );
  }

  async createAchievement(userId: string, goalDays: number, startDate: string, completedDate: string): Promise<Achievement> {
    const achievement: Achievement = {
      id: randomUUID(),
      userId,
      goalDays,
      startDate: startDate as any,
      completedDate: completedDate as any,
      createdAt: new Date(),
    } as Achievement;

    const userAchievements = this.achievements.get(userId) || [];
    userAchievements.push(achievement);
    this.achievements.set(userId, userAchievements);

    return achievement;
  }

  // Goal update operations
  async updateUserGoal(userId: string, goalDays: number, startDate: string, isNewGoal: boolean): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      // If this is a new goal (after completion), create achievement for previous goal
      if (isNewGoal) {
        const streak = this.streaks.get(userId);
        if (user.goalDays && streak?.startDate) {
          await this.createAchievement(
            userId,
            user.goalDays,
            streak.startDate as string,
            new Date().toISOString().split('T')[0]
          );
        }
      }

      // Update user's goal
      this.users.set(userId, {
        ...user,
        goalDays,
        updatedAt: new Date(),
      } as User);

      // Update streak with new start date
      await this.initializeStreak(userId, startDate);
    }
  }

  private async ensureUserDefaults(userId: string): Promise<void> {
    if (!this.streaks.get(userId)) {
      const now = new Date();
      this.streaks.set(userId, {
        id: randomUUID(),
        userId,
        currentStreak: 0,
        longestStreak: 0,
        lastResetDate: null as any,
        createdAt: now,
        updatedAt: now,
      } as Streak);
    }
    if (!this.milestones.get(userId) || this.milestones.get(userId)!.length === 0) {
      await this.createDefaultMilestones(userId);
    }
  }
}

const storageProvider = (process.env.STORAGE_PROVIDER || "db").toLowerCase();
export const storage: IStorage = storageProvider === "memory" ? new MemoryStorage() : new DatabaseStorage();

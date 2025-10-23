import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./localAuth";
import { insertJournalEntrySchema, insertStreakSchema } from "@shared/schema";
import { csrfTokenProvider, csrfProtection } from "./csrf";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  
  // CSRF middleware
  app.use(csrfTokenProvider);
  app.use(csrfProtection);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Onboarding route
  app.post('/api/user/onboarding', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { goalDays, startDate } = req.body;

      // Update user onboarding status and goal
      await storage.completeOnboarding(userId, goalDays);

      // Update streak with start date
      await storage.initializeStreak(userId, startDate);

      res.json({ message: "Onboarding completed successfully" });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  // Update goal route (for relapse or goal completion)
  app.post('/api/user/update-goal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { goalDays, startDate, isNewGoal } = req.body;

      // Update user's goal, streak, and potentially create achievement
      await storage.updateUserGoal(userId, goalDays, startDate, isNewGoal || false);

      // Reset streak on relapse (if not a new goal)
      if (!isNewGoal) {
        await storage.resetStreak(userId);
      }

      res.json({ message: "Goal updated successfully" });
    } catch (error) {
      console.error("Error updating goal:", error);
      res.status(500).json({ message: "Failed to update goal" });
    }
  });

  // CSRF token endpoint - ensures CSRF token is available for authenticated users
  app.get('/api/auth/csrf', isAuthenticated, async (req: any, res) => {
    try {
      // The csrfTokenProvider middleware will automatically set the token if not present
      // This endpoint just confirms the token is set and returns success
      res.json({ message: "CSRF token set" });
    } catch (error) {
      console.error("Error setting CSRF token:", error);
      res.status(500).json({ message: "Failed to set CSRF token" });
    }
  });

  // Streak routes
  app.get('/api/streak', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const streak = await storage.getStreakByUserId(userId);
      res.json(streak || { currentStreak: 0, longestStreak: 0 });
    } catch (error) {
      console.error("Error fetching streak:", error);
      res.status(500).json({ message: "Failed to fetch streak" });
    }
  });

  app.put('/api/streak', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const streakData = insertStreakSchema.parse(req.body);
      const updatedStreak = await storage.updateStreak(userId, streakData.currentStreak!, streakData.longestStreak!);
      res.json(updatedStreak);
    } catch (error) {
      console.error("Error updating streak:", error);
      res.status(500).json({ message: "Failed to update streak" });
    }
  });

  app.post('/api/streak/reset', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const resetStreak = await storage.resetStreak(userId);
      res.json(resetStreak);
    } catch (error) {
      console.error("Error resetting streak:", error);
      res.status(500).json({ message: "Failed to reset streak" });
    }
  });

  // Journal routes
  app.get('/api/journal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entries = await storage.getJournalEntries(userId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      res.status(500).json({ message: "Failed to fetch journal entries" });
    }
  });

  app.post('/api/journal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entryData = insertJournalEntrySchema.parse(req.body);
      const newEntry = await storage.createJournalEntry(userId, entryData);
      res.json(newEntry);
    } catch (error) {
      console.error("Error creating journal entry:", error);
      res.status(500).json({ message: "Failed to create journal entry" });
    }
  });

  app.put('/api/journal/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const entryData = insertJournalEntrySchema.parse(req.body);
      const updatedEntry = await storage.updateJournalEntry(id, userId, entryData);
      res.json(updatedEntry);
    } catch (error) {
      console.error("Error updating journal entry:", error);
      res.status(500).json({ message: "Failed to update journal entry" });
    }
  });

  app.delete('/api/journal/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      await storage.deleteJournalEntry(id, userId);
      res.json({ message: "Journal entry deleted successfully" });
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      res.status(500).json({ message: "Failed to delete journal entry" });
    }
  });

  // Milestone routes
  app.get('/api/milestones', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const milestones = await storage.getMilestones(userId);
      res.json(milestones);
    } catch (error) {
      console.error("Error fetching milestones:", error);
      res.status(500).json({ message: "Failed to fetch milestones" });
    }
  });

  // Achievement routes
  app.get('/api/achievements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const achievements = await storage.getAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.patch('/api/milestones/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { isAchieved, achievedDate } = req.body;

      if (typeof isAchieved !== 'boolean') {
        return res.status(400).json({ message: "isAchieved must be a boolean" });
      }

      await storage.updateMilestone(id, isAchieved, achievedDate);
      res.json({ message: "Milestone updated successfully" });
    } catch (error) {
      console.error("Error updating milestone:", error);
      res.status(500).json({ message: "Failed to update milestone" });
    }
  });

  app.post('/api/milestones/check-achievements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const streak = await storage.getStreakByUserId(userId);
      const milestones = await storage.getMilestones(userId);

      if (!streak) {
        return res.json({ message: "No streak data found" });
      }

      const today = new Date().toISOString().split('T')[0];
      let updated = 0;

      // Auto-achieve milestones based on current streak
      for (const milestone of milestones) {
        if (!milestone.isAchieved && streak.currentStreak >= milestone.targetDays) {
          await storage.updateMilestone(milestone.id, true, today);
          updated++;
        }
      }

      res.json({ message: `${updated} milestone(s) automatically achieved`, updated });
    } catch (error) {
      console.error("Error checking milestone achievements:", error);
      res.status(500).json({ message: "Failed to check milestone achievements" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

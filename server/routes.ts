import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import session from "express-session";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  loginSchema, 
  changePasswordSchema, 
  updateTrustedEmailSchema,
  insertJournalEntrySchema 
} from "@shared/schema";
import { analyzeSentiment, getMoodQuoteTag } from "./services/sentiment";
import { emailService } from "./services/email";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }));

  // Initialize quotes on startup
  await storage.initializeQuotes();

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(validatedData.password, 12);
      
      // Create user
      const user = await storage.createUser({
        email: validatedData.email,
        passwordHash,
        trustedEmail: validatedData.trustedEmail,
      });

      // Set session
      req.session.userId = user.id;

      res.json({ 
        id: user.id, 
        email: user.email, 
        trustedEmail: user.trustedEmail 
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ message: "Invalid input data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;

      res.json({ 
        id: user.id, 
        email: user.email, 
        trustedEmail: user.trustedEmail 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid input data" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        id: user.id, 
        email: user.email, 
        trustedEmail: user.trustedEmail 
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Journal entry routes
  app.post("/api/journal/entries", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { entryText } = req.body;

      if (!entryText || typeof entryText !== 'string') {
        return res.status(400).json({ message: "Entry text is required" });
      }

      // Analyze sentiment
      const sentimentResult = analyzeSentiment(entryText);
      
      // Get matching quote
      const quoteTag = getMoodQuoteTag(sentimentResult.mood);
      const availableQuotes = await storage.getQuotesByMoodTag(quoteTag);
      const randomQuote = availableQuotes[Math.floor(Math.random() * availableQuotes.length)];

      // Create journal entry
      const entry = await storage.createJournalEntry({
        userId,
        entryText,
        detectedMood: sentimentResult.mood,
        quoteId: randomQuote?.id || null,
        isQuoteRevealed: false,
      });

      // If crisis detected, send alert email
      if (sentimentResult.isCrisis) {
        const user = await storage.getUser(userId);
        if (user) {
          try {
            await emailService.sendCrisisAlert({
              userEmail: user.email,
              trustedPersonEmail: user.trustedEmail,
              entryText,
              timestamp: new Date(),
            });
          } catch (emailError) {
            console.error("Failed to send crisis alert:", emailError);
            // Don't fail the request if email fails
          }
        }
      }

      // Return entry with quote
      const entryWithQuote = await storage.getJournalEntryWithQuote(entry.id);
      
      res.json(entryWithQuote);
    } catch (error) {
      console.error("Create journal entry error:", error);
      res.status(500).json({ message: "Failed to create journal entry" });
    }
  });

  app.get("/api/journal/entries", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const entries = await storage.getUserJournalEntries(userId);
      
      res.json(entries);
    } catch (error) {
      console.error("Get journal entries error:", error);
      res.status(500).json({ message: "Failed to fetch journal entries" });
    }
  });

  app.get("/api/journal/entries/:id", requireAuth, async (req, res) => {
    try {
      const entryId = parseInt(req.params.id);
      const entry = await storage.getJournalEntryWithQuote(entryId);
      
      if (!entry || entry.userId !== req.session.userId!) {
        return res.status(404).json({ message: "Entry not found" });
      }

      res.json(entry);
    } catch (error) {
      console.error("Get journal entry error:", error);
      res.status(500).json({ message: "Failed to fetch journal entry" });
    }
  });

  app.post("/api/journal/entries/:id/reveal-quote", requireAuth, async (req, res) => {
    try {
      const entryId = parseInt(req.params.id);
      const entry = await storage.getJournalEntryWithQuote(entryId);
      
      if (!entry || entry.userId !== req.session.userId!) {
        return res.status(404).json({ message: "Entry not found" });
      }

      await storage.markQuoteAsRevealed(entryId);
      
      res.json({ message: "Quote revealed" });
    } catch (error) {
      console.error("Reveal quote error:", error);
      res.status(500).json({ message: "Failed to reveal quote" });
    }
  });

  // Mood tracking routes
  app.get("/api/mood/weekly", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 6); // Last 7 days
      
      const entries = await storage.getUserEntriesInDateRange(userId, startDate, endDate);
      
      // Group entries by date
      const moodByDate: Record<string, string[]> = {};
      entries.forEach(entry => {
        const dateKey = entry.createdAt?.toISOString().split('T')[0] || '';
        if (!moodByDate[dateKey]) {
          moodByDate[dateKey] = [];
        }
        moodByDate[dateKey].push(entry.detectedMood);
      });

      // Generate weekly mood data
      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        const dayMoods = moodByDate[dateKey] || [];
        
        // Calculate average mood for the day
        let dominantMood = 'neutral';
        if (dayMoods.length > 0) {
          const moodCounts: Record<string, number> = {};
          dayMoods.forEach(mood => {
            moodCounts[mood] = (moodCounts[mood] || 0) + 1;
          });
          
          // Find the most frequent mood
          const sortedMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
          const topMood = sortedMoods[0];
          
          // Check if there's a tie for the most frequent mood
          const tiedMoods = sortedMoods.filter(([_, count]) => count === topMood[1]);
          
          if (tiedMoods.length > 1) {
            // If there's a tie, default to neutral
            dominantMood = 'neutral';
          } else {
            // Otherwise, use the most frequent mood
            dominantMood = topMood[0];
          }
        }

        weeklyData.push({
          date: dateKey,
          mood: dominantMood,
          entries: dayMoods.length,
        });
      }

      res.json(weeklyData);
    } catch (error) {
      console.error("Get weekly mood error:", error);
      res.status(500).json({ message: "Failed to fetch mood data" });
    }
  });

  // Profile routes
  app.post("/api/profile/change-password", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 12);
      await storage.updateUserPassword(userId, newPasswordHash);

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(400).json({ message: "Invalid input data" });
    }
  });

  app.post("/api/profile/update-trusted-email", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { trustedEmail } = updateTrustedEmailSchema.parse(req.body);
      
      await storage.updateUserTrustedEmail(userId, trustedEmail);

      res.json({ message: "Trusted email updated successfully" });
    } catch (error) {
      console.error("Update trusted email error:", error);
      res.status(400).json({ message: "Invalid input data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import { 
  users, 
  journalEntries, 
  quotes,
  type User, 
  type InsertUser,
  type JournalEntry,
  type InsertJournalEntry,
  type Quote,
  type InsertQuote
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: { email: string; passwordHash: string; trustedEmail: string }): Promise<User>;
  updateUserPassword(id: number, passwordHash: string): Promise<void>;
  updateUserTrustedEmail(id: number, trustedEmail: string): Promise<void>;
  
  // Journal entry operations
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  getUserJournalEntries(userId: number): Promise<JournalEntry[]>;
  getJournalEntryWithQuote(id: number): Promise<(JournalEntry & { quote?: Quote }) | undefined>;
  markQuoteAsRevealed(id: number): Promise<void>;
  getUserEntriesInDateRange(userId: number, startDate: Date, endDate: Date): Promise<JournalEntry[]>;
  
  // Quote operations
  getQuotesByMoodTag(moodTag: string): Promise<Quote[]>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  initializeQuotes(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: { email: string; passwordHash: string; trustedEmail: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserPassword(id: number, passwordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async updateUserTrustedEmail(id: number, trustedEmail: string): Promise<void> {
    await db
      .update(users)
      .set({ trustedEmail, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const [journalEntry] = await db
      .insert(journalEntries)
      .values(entry)
      .returning();
    return journalEntry;
  }

  async getUserJournalEntries(userId: number): Promise<JournalEntry[]> {
    return await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt));
  }

  async getJournalEntryWithQuote(id: number): Promise<(JournalEntry & { quote?: Quote }) | undefined> {
    const [result] = await db
      .select({
        id: journalEntries.id,
        userId: journalEntries.userId,
        entryText: journalEntries.entryText,
        detectedMood: journalEntries.detectedMood,
        quoteId: journalEntries.quoteId,
        isQuoteRevealed: journalEntries.isQuoteRevealed,
        createdAt: journalEntries.createdAt,
        quote: quotes,
      })
      .from(journalEntries)
      .leftJoin(quotes, eq(journalEntries.quoteId, quotes.id))
      .where(eq(journalEntries.id, id));

    if (!result) return undefined;

    return {
      id: result.id,
      userId: result.userId,
      entryText: result.entryText,
      detectedMood: result.detectedMood,
      quoteId: result.quoteId,
      isQuoteRevealed: result.isQuoteRevealed,
      createdAt: result.createdAt,
      quote: result.quote || undefined,
    };
  }

  async markQuoteAsRevealed(id: number): Promise<void> {
    await db
      .update(journalEntries)
      .set({ isQuoteRevealed: true })
      .where(eq(journalEntries.id, id));
  }

  async getUserEntriesInDateRange(userId: number, startDate: Date, endDate: Date): Promise<JournalEntry[]> {
    return await db
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.userId, userId),
          gte(journalEntries.createdAt, startDate),
          lte(journalEntries.createdAt, endDate)
        )
      )
      .orderBy(desc(journalEntries.createdAt));
  }

  async getQuotesByMoodTag(moodTag: string): Promise<Quote[]> {
    return await db
      .select()
      .from(quotes)
      .where(eq(quotes.moodTag, moodTag));
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    const [newQuote] = await db
      .insert(quotes)
      .values(quote)
      .returning();
    return newQuote;
  }

  async initializeQuotes(): Promise<void> {
    const existingQuotes = await db.select().from(quotes).limit(1);
    if (existingQuotes.length > 0) return;

    const initialQuotes: InsertQuote[] = [
      // Happy quotes
      { quoteText: "Gratitude turns what we have into enough, and more.", author: "Melody Beattie", moodTag: "happy" },
      { quoteText: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb", moodTag: "happy" },
      { quoteText: "Happiness is not something ready made. It comes from your own actions.", author: "Dalai Lama", moodTag: "happy" },
      { quoteText: "Joy is not in things; it is in us.", author: "Richard Wagner", moodTag: "happy" },
      { quoteText: "The secret of being happy is accepting where you are in life and making the most out of everyday.", author: "Unknown", moodTag: "happy" },
      { quoteText: "Happiness is a choice, not a result. Nothing will make you happy until you choose to be happy.", author: "Ralph Marston", moodTag: "happy" },
      { quoteText: "Count your age by friends, not years. Count your life by smiles, not tears.", author: "John Lennon", moodTag: "happy" },
      { quoteText: "The happiest people don't have the best of everything, they just make the best of everything.", author: "Unknown", moodTag: "happy" },
      
      // Sad quotes
      { quoteText: "Every moment is a fresh beginning.", author: "T.S. Eliot", moodTag: "sad" },
      { quoteText: "The wound is the place where the Light enters you.", author: "Rumi", moodTag: "sad" },
      { quoteText: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson", moodTag: "sad" },
      { quoteText: "The darkest nights produce the brightest stars.", author: "John Green", moodTag: "sad" },
      { quoteText: "Sometimes you need to sit lonely on the floor in a quiet room in order to hear your own voice and not let it get drowned out by others.", author: "Charlotte Eriksson", moodTag: "sad" },
      { quoteText: "Pain is inevitable. Suffering is optional.", author: "Haruki Murakami", moodTag: "sad" },
      { quoteText: "The sun will rise and we will try again.", author: "Twenty One Pilots", moodTag: "sad" },
      { quoteText: "You are allowed to feel messed up and inside out. It doesn't mean you're defective - it just means you're human.", author: "David Mitchell", moodTag: "sad" },
      { quoteText: "This too shall pass. It might pass like a kidney stone, but it will pass.", author: "Unknown", moodTag: "sad" },
      
      // Anxious quotes
      { quoteText: "You have been assigned this mountain to show others it can be moved.", author: "Mel Robbins", moodTag: "anxious" },
      { quoteText: "Anxiety is the dizziness of freedom.", author: "Søren Kierkegaard", moodTag: "anxious" },
      { quoteText: "Nothing can harm you as much as your own thoughts unguarded.", author: "Buddha", moodTag: "anxious" },
      { quoteText: "You are braver than you believe, stronger than you seem, and smarter than you think.", author: "A.A. Milne", moodTag: "anxious" },
      { quoteText: "Breathe in peace, breathe out stress.", author: "Unknown", moodTag: "anxious" },
      { quoteText: "Worry does not empty tomorrow of its sorrow, it empties today of its strength.", author: "Corrie ten Boom", moodTag: "anxious" },
      { quoteText: "You can't control everything. Sometimes you just need to relax and have faith that things will work out.", author: "Kody Keplinger", moodTag: "anxious" },
      { quoteText: "Take deep breaths and remember: you've survived 100% of your bad days so far.", author: "Unknown", moodTag: "anxious" },
      { quoteText: "Anxiety is not your enemy. It's your body's way of telling you to slow down and pay attention.", author: "Unknown", moodTag: "anxious" },
      
      // General quotes
      { quoteText: "Progress, not perfection.", author: "Anonymous", moodTag: "general" },
      { quoteText: "You are braver than you believe, stronger than you seem, and smarter than you think.", author: "A.A. Milne", moodTag: "general" },
      { quoteText: "The only way out is through.", author: "Robert Frost", moodTag: "general" },
      { quoteText: "Be yourself; everyone else is already taken.", author: "Oscar Wilde", moodTag: "general" },
      { quoteText: "Life is 10% what happens to you and 90% how you react to it.", author: "Charles R. Swindoll", moodTag: "general" },
      { quoteText: "The journey of a thousand miles begins with one step.", author: "Lao Tzu", moodTag: "general" },
      { quoteText: "What doesn't kill you makes you stronger.", author: "Friedrich Nietzsche", moodTag: "general" },
      { quoteText: "Yesterday is history, tomorrow is a mystery, today is a gift of God, which is why we call it the present.", author: "Bill Keane", moodTag: "general" },
      { quoteText: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle", moodTag: "general" },
      { quoteText: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", moodTag: "general" },
    ];

    await db.insert(quotes).values(initialQuotes);
  }
}

export const storage = new DatabaseStorage();

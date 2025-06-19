export type MoodType = 'happy' | 'sad' | 'anxious' | 'suicidal' | 'neutral';

interface SentimentAnalysisResult {
  mood: MoodType;
  confidence: number;
  isCrisis: boolean;
}

// Keywords for mood detection
const moodKeywords = {
  happy: ['happy', 'joy', 'excited', 'grateful', 'blessed', 'amazing', 'wonderful', 'great', 'fantastic', 'love', 'celebration', 'success', 'achievement', 'proud', 'smile', 'laugh'],
  sad: ['sad', 'depressed', 'down', 'upset', 'disappointed', 'heartbroken', 'crying', 'tears', 'lonely', 'empty', 'loss', 'grief', 'miss', 'hurt', 'pain'],
  anxious: ['anxious', 'worried', 'nervous', 'stress', 'panic', 'overwhelmed', 'scared', 'fear', 'tension', 'restless', 'uncertain', 'doubt', 'pressure', 'worry'],
  suicidal: ['suicide', 'kill myself', 'end it all', 'want to die', 'no point', 'hopeless', 'worthless', 'better off dead', 'can\'t go on', 'give up', 'end my life'],
};

export function analyzeSentiment(text: string): SentimentAnalysisResult {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  
  // Check for crisis keywords first
  const crisisKeywords = moodKeywords.suicidal;
  const hasCrisisKeywords = crisisKeywords.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );
  
  if (hasCrisisKeywords) {
    return {
      mood: 'suicidal',
      confidence: 0.9,
      isCrisis: true,
    };
  }
  
  // Count keyword matches for each mood
  const moodScores: Record<MoodType, number> = {
    happy: 0,
    sad: 0,
    anxious: 0,
    suicidal: 0,
    neutral: 0,
  };
  
  Object.entries(moodKeywords).forEach(([mood, keywords]) => {
    if (mood === 'suicidal') return; // Already checked above
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        moodScores[mood as MoodType] += matches.length;
      }
    });
  });
  
  // Find the mood with highest score
  const maxScore = Math.max(...Object.values(moodScores));
  
  if (maxScore === 0) {
    return {
      mood: 'neutral',
      confidence: 0.5,
      isCrisis: false,
    };
  }
  
  const detectedMood = Object.entries(moodScores).find(
    ([_, score]) => score === maxScore
  )?.[0] as MoodType;
  
  const confidence = Math.min(maxScore / words.length * 10, 1); // Normalize confidence
  
  return {
    mood: detectedMood || 'neutral',
    confidence,
    isCrisis: false,
  };
}

export function getMoodQuoteTag(mood: MoodType): string {
  switch (mood) {
    case 'happy':
      return 'happy';
    case 'sad':
    case 'suicidal':
      return 'sad';
    case 'anxious':
      return 'anxious';
    case 'neutral':
    default:
      return 'general';
  }
}

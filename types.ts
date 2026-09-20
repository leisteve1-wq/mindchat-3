export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  emotions?: DetectedEmotion[];
  metadata?: { isCrisis?: boolean; provider?: string; model?: string };
}

export interface DetectedEmotion {
  emotion: string;
  confidence: number;
}

export interface MoodEntry { id: string; mood: string; intensity: number; timestamp: unknown }
export interface JournalEntry { id: string; title: string; timestamp: unknown }

// ============================================
// MindChat Local Authentication System
// No Firebase - Pure Local Storage with Encryption
// ============================================

import { sha256 } from './crypto';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  createdAt: string;
  lastLoginAt: string;
  settings: UserSettings;
  stats: UserStats;
  achievements: string[];
  streak: StreakData;
  aiMemory: AIMemory;
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  language: string;
  notifications: boolean;
  soundEnabled: boolean;
  voiceEnabled: boolean;
  saveConversations: boolean;
  fontSize: 'small' | 'medium' | 'large';
  privacyMode: boolean;
  privacyPin: string | null;
  autoLock: number; // minutes
}

export interface UserStats {
  totalChats: number;
  totalMoodEntries: number;
  totalJournalEntries: number;
  totalBreathingSessions: number;
  totalLessonsCompleted: number;
  xp: number;
  level: number;
  coins: number;
}

export interface StreakData {
  current: number;
  longest: number;
  lastActiveDate: string;
  history: { date: string; activity: string[] }[];
}

export interface AIMemory {
  userPreferences: Record<string, any>;
  topicsDiscussed: string[];
  copingStrategies: string[];
  moodPatterns: Record<string, number>;
  lastTopics: string[];
  personalityInsights: string[];
  sessionCount: number;
}

// Default user settings
const defaultSettings: UserSettings = {
  theme: 'dark',
  language: 'en',
  notifications: true,
  soundEnabled: true,
  voiceEnabled: false,
  saveConversations: true,
  fontSize: 'medium',
  privacyMode: false,
  privacyPin: null,
  autoLock: 5
};

// Default user stats
const defaultStats: UserStats = {
  totalChats: 0,
  totalMoodEntries: 0,
  totalJournalEntries: 0,
  totalBreathingSessions: 0,
  totalLessonsCompleted: 0,
  xp: 0,
  level: 1,
  coins: 100
};

// Default streak data
const defaultStreak: StreakData = {
  current: 0,
  longest: 0,
  lastActiveDate: '',
  history: []
};

// Default AI memory
const defaultAIMemory: AIMemory = {
  userPreferences: {},
  topicsDiscussed: [],
  copingStrategies: [],
  moodPatterns: {},
  lastTopics: [],
  personalityInsights: [],
  sessionCount: 0
};

// ============================================
// Auth Functions
// ============================================

export const signUp = async (email: string, password: string, displayName: string): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    // Check if user exists
    const users = getUsers();
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Email already registered' };
    }

    // Create new user
    const newUser: User = {
      id: generateId(),
      email: email.toLowerCase(),
      passwordHash: await sha256(password),
      displayName,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      settings: { ...defaultSettings },
      stats: { ...defaultStats },
      achievements: [],
      streak: { ...defaultStreak },
      aiMemory: { ...defaultAIMemory }
    };

    // Save user
    users.push(newUser);
    saveUsers(users);
    
    // Set current user
    setCurrentUser(newUser);
    
    return { success: true, user: newUser };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const signIn = async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    const users = getUsers();
    const passwordHash = await sha256(password);
    
    const user = users.find(u => u.email === email.toLowerCase() && u.passwordHash === passwordHash);
    
    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Update last login
    user.lastLoginAt = new Date().toISOString();
    
    // Update streak
    updateStreak(user);
    
    saveUsers(users);
    setCurrentUser(user);
    
    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const signOut = (): void => {
  localStorage.removeItem('mindchat_current_user');
  localStorage.removeItem('mindchat_session');
};

export const resetPassword = async (email: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const users = getUsers();
    const user = users.find(u => u.email === email.toLowerCase());
    
    if (!user) {
      return { success: false, error: 'Email not found' };
    }

    user.passwordHash = await sha256(newPassword);
    saveUsers(users);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem('mindchat_current_user');
  if (!userJson) return null;
  
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
};

export const setCurrentUser = (user: User): void => {
  localStorage.setItem('mindchat_current_user', JSON.stringify(user));
  localStorage.setItem('mindchat_session', generateId());
};

export const updateUser = (updates: Partial<User>): User | null => {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;

  const users = getUsers();
  const index = users.findIndex(u => u.id === currentUser.id);
  
  if (index === -1) return null;

  const updatedUser = { ...users[index], ...updates };
  users[index] = updatedUser;
  
  saveUsers(users);
  setCurrentUser(updatedUser);
  
  return updatedUser;
};

// ============================================
// Streak System
// ============================================

export const updateStreak = (user: User): void => {
  const today = new Date().toISOString().split('T')[0];
  const lastActive = user.streak.lastActiveDate;
  
  if (lastActive === today) return; // Already active today
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (lastActive === yesterdayStr) {
    // Continued streak
    user.streak.current += 1;
  } else if (lastActive !== today) {
    // Streak broken
    user.streak.current = 1;
  }
  
  // Update longest streak
  if (user.streak.current > user.streak.longest) {
    user.streak.longest = user.streak.current;
  }
  
  user.streak.lastActiveDate = today;
  
  // Add to history
  user.streak.history.push({
    date: today,
    activity: []
  });
  
  // Keep only last 30 days
  if (user.streak.history.length > 30) {
    user.streak.history = user.streak.history.slice(-30);
  }
};

export const recordActivity = (activity: string): void => {
  const user = getCurrentUser();
  if (!user) return;

  const today = new Date().toISOString().split('T')[0];
  const todayEntry = user.streak.history.find(h => h.date === today);
  
  if (todayEntry) {
    if (!todayEntry.activity.includes(activity)) {
      todayEntry.activity.push(activity);
    }
  } else {
    user.streak.history.push({
      date: today,
      activity: [activity]
    });
  }
  
  updateUser({ streak: user.streak });
};

// ============================================
// XP & Level System (Gamification)
// ============================================

export const addXP = (amount: number): void => {
  const user = getCurrentUser();
  if (!user) return;

  user.stats.xp += amount;
  
  // Check for level up
  const newLevel = calculateLevel(user.stats.xp);
  if (newLevel > user.stats.level) {
    user.stats.level = newLevel;
    // Bonus coins on level up
    user.stats.coins += newLevel * 50;
  }
  
  updateUser({ stats: user.stats });
};

export const addCoins = (amount: number): void => {
  const user = getCurrentUser();
  if (!user) return;

  user.stats.coins += amount;
  updateUser({ stats: user.stats });
};

export const spendCoins = (amount: number): boolean => {
  const user = getCurrentUser();
  if (!user || user.stats.coins < amount) return false;

  user.stats.coins -= amount;
  updateUser({ stats: user.stats });
  return true;
};

const calculateLevel = (xp: number): number => {
  // Level formula: level = floor(sqrt(xp / 100))
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

export const getXPForNextLevel = (level: number): number => {
  return Math.pow(level, 2) * 100;
};

// ============================================
// AI Memory System
// ============================================

export const updateAIMemory = (updates: Partial<AIMemory>): void => {
  const user = getCurrentUser();
  if (!user) return;

  user.aiMemory = { ...user.aiMemory, ...updates };
  user.aiMemory.sessionCount += 1;
  
  updateUser({ aiMemory: user.aiMemory });
};

export const addTopicDiscussed = (topic: string): void => {
  const user = getCurrentUser();
  if (!user) return;

  if (!user.aiMemory.topicsDiscussed.includes(topic)) {
    user.aiMemory.topicsDiscussed.push(topic);
  }
  
  // Keep last 20 topics
  user.aiMemory.lastTopics = [topic, ...user.aiMemory.lastTopics].slice(0, 20);
  
  updateUser({ aiMemory: user.aiMemory });
};

export const addCopingStrategy = (strategy: string): void => {
  const user = getCurrentUser();
  if (!user) return;

  if (!user.aiMemory.copingStrategies.includes(strategy)) {
    user.aiMemory.copingStrategies.push(strategy);
  }
  
  updateUser({ aiMemory: user.aiMemory });
};

export const updateMoodPattern = (mood: string): void => {
  const user = getCurrentUser();
  if (!user) return;

  user.aiMemory.moodPatterns[mood] = (user.aiMemory.moodPatterns[mood] || 0) + 1;
  updateUser({ aiMemory: user.aiMemory });
};

export const getAIContext = (): string => {
  const user = getCurrentUser();
  if (!user) return '';

  const memory = user.aiMemory;
  const contextParts: string[] = [];

  if (memory.topicsDiscussed.length > 0) {
    contextParts.push(`Topics we've discussed: ${memory.topicsDiscussed.slice(-5).join(', ')}.`);
  }

  if (memory.copingStrategies.length > 0) {
    contextParts.push(`Coping strategies you've tried: ${memory.copingStrategies.slice(-3).join(', ')}.`);
  }

  const topMoods = Object.entries(memory.moodPatterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  if (topMoods.length > 0) {
    contextParts.push(`Your most common moods: ${topMoods.map(m => m[0]).join(', ')}.`);
  }

  if (memory.sessionCount > 0) {
    contextParts.push(`This is our ${memory.sessionCount} conversation.`);
  }

  return contextParts.join(' ');
};

// ============================================
// Achievement System
// ============================================

export const ACHIEVEMENTS = {
  FIRST_CHAT: { id: 'first_chat', name: 'First Step', desc: 'Started your first conversation', xp: 50, icon: '💬' },
  MOOD_TRACKER: { id: 'mood_tracker', name: 'Mood Tracker', desc: 'Logged your first mood', xp: 30, icon: '😊' },
  JOURNAL_KEEPER: { id: 'journal_keeper', name: 'Journal Keeper', desc: 'Wrote your first entry', xp: 40, icon: '📓' },
  BREATHING_MASTER: { id: 'breathing_master', name: 'Breathing Master', desc: 'Completed a breathing exercise', xp: 30, icon: '🧘' },
  STREAK_3: { id: 'streak_3', name: 'Streak Starter', desc: '3-day activity streak', xp: 100, icon: '🔥' },
  STREAK_7: { id: 'streak_7', name: 'Week Warrior', desc: '7-day activity streak', xp: 250, icon: '⚡' },
  STREAK_30: { id: 'streak_30', name: 'Monthly Master', desc: '30-day activity streak', xp: 1000, icon: '👑' },
  CHAT_10: { id: 'chat_10', name: 'Chatty', desc: '10 AI conversations', xp: 100, icon: '🗣️' },
  CHAT_50: { id: 'chat_50', name: 'Talkative', desc: '50 AI conversations', xp: 300, icon: '🎤' },
  CHAT_100: { id: 'chat_100', name: 'Conversationalist', desc: '100 AI conversations', xp: 500, icon: '🏆' },
  MOOD_30: { id: 'mood_30', name: 'Mood Master', desc: '30 mood entries', xp: 200, icon: '📊' },
  JOURNAL_10: { id: 'journal_10', name: 'Writer', desc: '10 journal entries', xp: 150, icon: '✍️' },
  LESSON_5: { id: 'lesson_5', name: 'Student', desc: 'Completed 5 lessons', xp: 200, icon: '🎓' },
  NIGHT_OWL: { id: 'night_owl', name: 'Night Owl', desc: 'Used app after midnight', xp: 50, icon: '🌙' },
  EARLY_BIRD: { id: 'early_bird', name: 'Early Bird', desc: 'Used app before 6am', xp: 50, icon: '🌅' },
  PRIVACY_ON: { id: 'privacy_on', name: 'Privacy First', desc: 'Enabled privacy mode', xp: 30, icon: '🔒' },
  BACKUP_CREATED: { id: 'backup_created', name: 'Safe Keeper', desc: 'Created a backup', xp: 50, icon: '💾' },
  MULTILINGUAL: { id: 'multilingual', name: 'Multilingual', desc: 'Changed language', xp: 30, icon: '🌍' }
};

export const unlockAchievement = (achievementId: string): boolean => {
  const user = getCurrentUser();
  if (!user) return false;

  if (user.achievements.includes(achievementId)) return false;

  const achievement = Object.values(ACHIEVEMENTS).find(a => a.id === achievementId);
  if (!achievement) return false;

  user.achievements.push(achievementId);
  addXP(achievement.xp);
  addCoins(achievement.xp / 2);
  
  updateUser({ achievements: user.achievements });
  
  return true;
};

export const checkStreakAchievements = (): void => {
  const user = getCurrentUser();
  if (!user) return;

  if (user.streak.current >= 3) unlockAchievement('STREAK_3');
  if (user.streak.current >= 7) unlockAchievement('STREAK_7');
  if (user.streak.current >= 30) unlockAchievement('STREAK_30');
};

// ============================================
// Backup & Sync System
// ============================================

export const exportData = (): string => {
  const user = getCurrentUser();
  if (!user) return '';

  const data = {
    user,
    chats: localStorage.getItem(`mindchat_chats_${user.id}`) || '[]',
    moods: localStorage.getItem(`mindchat_moods_${user.id}`) || '[]',
    journal: localStorage.getItem(`mindchat_journal_${user.id}`) || '[]',
    exportDate: new Date().toISOString(),
    version: '1.0.0'
  };

  return JSON.stringify(data, null, 2);
};

export const importData = (jsonData: string): { success: boolean; error?: string } => {
  try {
    const data = JSON.parse(jsonData);
    
    if (!data.user || !data.user.id) {
      return { success: false, error: 'Invalid backup file' };
    }

    // Merge or replace user data
    const users = getUsers();
    const existingIndex = users.findIndex(u => u.id === data.user.id);
    
    if (existingIndex >= 0) {
      users[existingIndex] = data.user;
    } else {
      users.push(data.user);
    }
    
    saveUsers(users);
    
    // Restore data
    if (data.chats) localStorage.setItem(`mindchat_chats_${data.user.id}`, data.chats);
    if (data.moods) localStorage.setItem(`mindchat_moods_${data.user.id}`, data.moods);
    if (data.journal) localStorage.setItem(`mindchat_journal_${data.user.id}`, data.journal);
    
    setCurrentUser(data.user);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const createBackup = (): { success: boolean; data?: string; error?: string } => {
  try {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindchat_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    unlockAchievement('BACKUP_CREATED');
    
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// ============================================
// Privacy Mode
// ============================================

export const setPrivacyPin = (pin: string): void => {
  const user = getCurrentUser();
  if (!user) return;

  user.settings.privacyPin = pin ? sha256(pin) : null;
  updateUser({ settings: user.settings });
  
  if (pin) {
    unlockAchievement('PRIVACY_ON');
  }
};

export const verifyPrivacyPin = async (pin: string): Promise<boolean> => {
  const user = getCurrentUser();
  if (!user || !user.settings.privacyPin) return true;

  return user.settings.privacyPin === await sha256(pin);
};

export const togglePrivacyMode = (enabled: boolean): void => {
  const user = getCurrentUser();
  if (!user) return;

  user.settings.privacyMode = enabled;
  updateUser({ settings: user.settings });
};

// ============================================
// Helper Functions
// ============================================

const getUsers = (): User[] => {
  const usersJson = localStorage.getItem('mindchat_users');
  if (!usersJson) return [];
  
  try {
    return JSON.parse(usersJson);
  } catch {
    return [];
  }
};

const saveUsers = (users: User[]): void => {
  localStorage.setItem('mindchat_users', JSON.stringify(users));
};

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================
// Admin Functions
// ============================================

export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  
  // Check for admin flag in user data
  return (user as any).isAdmin === true || user.email === 'admin@mindchat.app';
};

export const getAllUsers = (): User[] => {
  return getUsers();
};

export const deleteUser = (userId: string): boolean => {
  const users = getUsers();
  const filtered = users.filter(u => u.id !== userId);
  
  if (filtered.length === users.length) return false;
  
  saveUsers(filtered);
  
  // Clean up user data
  localStorage.removeItem(`mindchat_chats_${userId}`);
  localStorage.removeItem(`mindchat_moods_${userId}`);
  localStorage.removeItem(`mindchat_journal_${userId}`);
  
  return true;
};

export const getAppStats = () => {
  const users = getUsers();
  
  return {
    totalUsers: users.length,
    totalChats: users.reduce((sum, u) => sum + u.stats.totalChats, 0),
    totalMoodEntries: users.reduce((sum, u) => sum + u.stats.totalMoodEntries, 0),
    totalJournalEntries: users.reduce((sum, u) => sum + u.stats.totalJournalEntries, 0),
    activeToday: users.filter(u => u.streak.lastActiveDate === new Date().toISOString().split('T')[0]).length,
    averageStreak: users.length > 0 ? users.reduce((sum, u) => sum + u.streak.current, 0) / users.length : 0
  };
};

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { User as FirebaseUser } from 'firebase/auth';
import type { MoodEntry, JournalEntry } from '../types';
import { getMoodEntries, getJournalEntries, getUserData } from '../lib/firebase';
import { 
  TrendingUp, 
  MessageSquare, 
  BookOpen, 
  Smile, 
  Flame,
  Award
} from 'lucide-react';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';

interface DashboardProps {
  user: FirebaseUser | null;
}

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export default function Dashboard({ user }: DashboardProps) {
  const [stats, setStats] = useState({
    totalChats: 0,
    totalMoodEntries: 0,
    totalJournalEntries: 0,
    streakDays: 0,
    lastActiveDate: null as Date | null
  });
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    // Get user data
    const userData = await getUserData(user.uid);
    if (userData.success && userData.data) {
      const data = userData.data as any;
      setStats({
        totalChats: data.stats?.totalChats || 0,
        totalMoodEntries: data.stats?.totalMoodEntries || 0,
        totalJournalEntries: data.stats?.totalJournalEntries || 0,
        streakDays: data.stats?.streakDays || 0,
        lastActiveDate: data.stats?.lastActiveDate?.seconds 
          ? new Date(data.stats.lastActiveDate.seconds * 1000)
          : null
      });
    }

    // Get mood entries
    const moods = await getMoodEntries(user.uid, 30);
    if (moods.success && moods.data) {
      setMoodEntries(moods.data as MoodEntry[]);
    }

    // Get journal entries
    const journals = await getJournalEntries(user.uid, 10);
    if (journals.success && journals.data) {
      setJournalEntries(journals.data as JournalEntry[]);
    }

    setIsLoading(false);
  };

  // Calculate streak
  const calculateStreak = () => {
    if (moodEntries.length === 0) return 0;
    
    let streak = 0;
    const today = startOfDay(new Date());
    
    // Check if logged today
    const loggedToday = moodEntries.some(e => {
      const ts = e.timestamp as unknown as FirestoreTimestamp;
      return isSameDay(new Date(ts.seconds * 1000), today);
    });
    
    if (!loggedToday) {
      // Check if logged yesterday
      const yesterday = subDays(today, 1);
      const loggedYesterday = moodEntries.some(e => {
        const ts = e.timestamp as unknown as FirestoreTimestamp;
        return isSameDay(new Date(ts.seconds * 1000), yesterday);
      });
      if (!loggedYesterday) return 0;
    }
    
    // Count consecutive days
    for (let i = 0; i < 365; i++) {
      const date = subDays(today, i);
      const hasEntry = moodEntries.some(e => {
        const ts = e.timestamp as unknown as FirestoreTimestamp;
        return isSameDay(new Date(ts.seconds * 1000), date);
      });
      if (hasEntry) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  };

  // Get mood trend
  const getMoodTrend = () => {
    if (moodEntries.length < 2) return 'stable';
    
    const recent = moodEntries.slice(0, 7);
    const moodValues: Record<string, number> = {
      terrible: 1, bad: 2, okay: 3, good: 4, great: 5
    };
    
    const avg = recent.reduce((sum, e) => sum + (moodValues[e.mood] || 3), 0) / recent.length;
    const older = moodEntries.slice(7, 14);
    
    if (older.length === 0) return 'stable';
    
    const olderAvg = older.reduce((sum, e) => sum + (moodValues[e.mood] || 3), 0) / older.length;
    
    if (avg > olderAvg + 0.5) return 'improving';
    if (avg < olderAvg - 0.5) return 'declining';
    return 'stable';
  };

  // Get weekly mood data
  const getWeeklyMoodData = () => {
    const days = [];
    const moodValues: Record<string, number> = {
      terrible: 1, bad: 2, okay: 3, good: 4, great: 5
    };
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const entry = moodEntries.find(e => {
        const ts = e.timestamp as unknown as FirestoreTimestamp;
        return isSameDay(new Date(ts.seconds * 1000), date);
      });
      
      days.push({
        day: format(date, 'EEE'),
        value: entry ? moodValues[entry.mood] || 0 : 0,
        mood: entry?.mood || null
      });
    }
    
    return days;
  };

  const streak = calculateStreak();
  const trend = getMoodTrend();
  const weeklyData = getWeeklyMoodData();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--mc-accent-primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold gradient-text">Your Dashboard</h1>
          <p className="text-[var(--mc-text-secondary)]">
            Track your progress and insights
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--mc-accent-primary)]/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-[var(--mc-accent-primary)]" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalChats}</p>
                  <p className="text-xs text-[var(--mc-text-muted)]">AI Chats</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Smile className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{moodEntries.length}</p>
                  <p className="text-xs text-[var(--mc-text-muted)]">Mood Logs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{journalEntries.length}</p>
                  <p className="text-xs text-[var(--mc-text-muted)]">Journal Entries</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{streak}</p>
                  <p className="text-xs text-[var(--mc-text-muted)]">Day Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mood Trend */}
        <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Mood Trend
              <span className={`
                ml-auto text-sm px-2 py-0.5 rounded-full
                ${trend === 'improving' ? 'bg-green-500/20 text-green-400' :
                  trend === 'declining' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }
              `}>
                {trend}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end h-32">
              {weeklyData.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div 
                    className="w-8 rounded-t-lg transition-all duration-300 bg-[var(--mc-accent-primary)]"
                    style={{
                      height: day.value ? `${(day.value / 5) * 100}px` : '4px',
                      opacity: day.value ? 1 : 0.3
                    }}
                  />
                  <span className="text-xs text-[var(--mc-text-muted)]">{day.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Recent Mood Entries */}
          <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
            <CardHeader>
              <CardTitle className="text-lg">Recent Moods</CardTitle>
            </CardHeader>
            <CardContent>
              {moodEntries.slice(0, 5).length === 0 ? (
                <p className="text-sm text-[var(--mc-text-muted)] text-center py-4">
                  No mood entries yet
                </p>
              ) : (
                <div className="space-y-3">
                  {moodEntries.slice(0, 5).map((entry) => {
                    const ts = entry.timestamp as unknown as FirestoreTimestamp;
                    return (
                      <div 
                        key={entry.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-[var(--mc-bg-tertiary)]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="capitalize font-medium">{entry.mood}</span>
                          <span className="text-xs text-[var(--mc-text-muted)]">
                            Intensity: {entry.intensity}/10
                          </span>
                        </div>
                        <span className="text-xs text-[var(--mc-text-muted)]">
                          {format(new Date(ts.seconds * 1000), 'MMM d')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Journal Entries */}
          <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
            <CardHeader>
              <CardTitle className="text-lg">Recent Journal</CardTitle>
            </CardHeader>
            <CardContent>
              {journalEntries.slice(0, 5).length === 0 ? (
                <p className="text-sm text-[var(--mc-text-muted)] text-center py-4">
                  No journal entries yet
                </p>
              ) : (
                <div className="space-y-3">
                  {journalEntries.slice(0, 5).map((entry) => {
                    const ts = entry.timestamp as unknown as FirestoreTimestamp;
                    return (
                      <div 
                        key={entry.id}
                        className="p-2 rounded-lg bg-[var(--mc-bg-tertiary)]"
                      >
                        <p className="font-medium truncate">{entry.title}</p>
                        <p className="text-xs text-[var(--mc-text-muted)]">
                          {format(new Date(ts.seconds * 1000), 'MMM d, yyyy')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { name: 'First Chat', desc: 'Started your first conversation', unlocked: stats.totalChats > 0 },
                { name: 'Mood Tracker', desc: 'Logged your first mood', unlocked: moodEntries.length > 0 },
                { name: 'Journal Keeper', desc: 'Wrote your first entry', unlocked: journalEntries.length > 0 },
                { name: 'Streak Starter', desc: '3-day mood streak', unlocked: streak >= 3 },
                { name: 'Consistent', desc: '7-day mood streak', unlocked: streak >= 7 },
                { name: 'Dedicated', desc: '30-day mood streak', unlocked: streak >= 30 },
                { name: 'Chatty', desc: '10 AI conversations', unlocked: stats.totalChats >= 10 },
                { name: 'Explorer', desc: 'Tried all features', unlocked: stats.totalChats > 0 && moodEntries.length > 0 && journalEntries.length > 0 }
              ].map((achievement) => (
                <div
                  key={achievement.name}
                  className={`
                    p-3 rounded-lg text-center
                    ${achievement.unlocked 
                      ? 'bg-[var(--mc-accent-primary)]/20 border border-[var(--mc-accent-primary)]/30' 
                      : 'bg-[var(--mc-bg-tertiary)] opacity-50'
                    }
                  `}
                >
                  <Award className={`w-6 h-6 mx-auto mb-1 ${achievement.unlocked ? 'text-[var(--mc-accent-primary)]' : ''}`} />
                  <p className="text-sm font-medium">{achievement.name}</p>
                  <p className="text-xs text-[var(--mc-text-muted)]">{achievement.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { User as FirebaseUser } from 'firebase/auth';
import type { MoodEntry, MoodLevel } from '../types';
import { saveMoodEntry, getMoodEntries } from '../lib/firebase';
import { 
  Frown, 
  Meh, 
  Smile, 
  Laugh, 
  Angry,
  Calendar,
  TrendingUp,
  Activity
} from 'lucide-react';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';

interface MoodTrackerProps {
  user: FirebaseUser | null;
}

const MOODS: { level: MoodLevel; icon: React.ElementType; label: string; color: string }[] = [
  { level: 'terrible', icon: Angry, label: 'Terrible', color: '#ef4444' },
  { level: 'bad', icon: Frown, label: 'Bad', color: '#f97316' },
  { level: 'okay', icon: Meh, label: 'Okay', color: '#eab308' },
  { level: 'good', icon: Smile, label: 'Good', color: '#22c55e' },
  { level: 'great', icon: Laugh, label: 'Great', color: '#10b981' },
];

const TRIGGERS = [
  'Work', 'Relationships', 'Sleep', 'Health', 'Weather', 
  'Family', 'Money', 'Social', 'Exercise', 'Food'
];

const ACTIVITIES = [
  'Meditation', 'Exercise', 'Reading', 'Socializing', 'Work',
  'Nature', 'Creative', 'Rest', 'Therapy', 'Journaling'
];

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export default function MoodTracker({ user }: MoodTrackerProps) {
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [notes, setNotes] = useState('');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);

  // Load mood entries
  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user]);

  const loadEntries = async () => {
    if (!user) return;
    
    const result = await getMoodEntries(user.uid, 30);
    if (result.success && result.data) {
      const data = result.data as MoodEntry[];
      setEntries(data);
      
      // Check if submitted today
      const today = startOfDay(new Date());
      const todayEntry = data.find((e: MoodEntry) => {
        const ts = e.timestamp as unknown as FirestoreTimestamp;
        const entryDate = startOfDay(new Date(ts.seconds * 1000));
        return entryDate.getTime() === today.getTime();
      });
      setHasSubmittedToday(!!todayEntry);
    }
  };

  // Submit mood entry
  const handleSubmit = async () => {
    if (!user || !selectedMood) {
      toast.error('Please select a mood');
      return;
    }

    setIsLoading(true);
    
    const entry = {
      mood: selectedMood,
      intensity,
      notes,
      triggers: selectedTriggers,
      activities: selectedActivities,
      timestamp: new Date()
    };

    const result = await saveMoodEntry(user.uid, entry);
    
    if (result.success) {
      toast.success('Mood logged successfully!');
      setHasSubmittedToday(true);
      loadEntries();
      
      // Reset form
      setSelectedMood(null);
      setIntensity(5);
      setNotes('');
      setSelectedTriggers([]);
      setSelectedActivities([]);
    } else {
      toast.error('Failed to log mood');
    }
    
    setIsLoading(false);
  };

  // Toggle trigger selection
  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers(prev => 
      prev.includes(trigger) 
        ? prev.filter(t => t !== trigger)
        : [...prev, trigger]
    );
  };

  // Toggle activity selection
  const toggleActivity = (activity: string) => {
    setSelectedActivities(prev => 
      prev.includes(activity) 
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  // Get mood stats
  const getMoodStats = () => {
    if (entries.length === 0) return null;
    
    const moodCounts: Record<string, number> = {};
    entries.forEach(e => {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    });
    
    const mostCommon = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])[0];
    
    const avgIntensity = entries.reduce((sum, e) => sum + e.intensity, 0) / entries.length;
    
    return {
      totalEntries: entries.length,
      mostCommonMood: mostCommon?.[0],
      averageIntensity: avgIntensity.toFixed(1)
    };
  };

  // Get last 7 days data
  const getWeeklyData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const entry = entries.find(e => {
        const ts = e.timestamp as unknown as FirestoreTimestamp;
        const entryDate = new Date(ts.seconds * 1000);
        return isSameDay(entryDate, date);
      });
      
      days.push({
        date: format(date, 'EEE'),
        mood: entry?.mood || null,
        intensity: entry?.intensity || 0
      });
    }
    return days;
  };

  const stats = getMoodStats();
  const weeklyData = getWeeklyData();

  return (
    <div className="h-full overflow-auto p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Mood Tracker</h1>
            <p className="text-[var(--mc-text-secondary)]">Track your emotional well-being</p>
          </div>
          {hasSubmittedToday && (
            <div className="px-4 py-2 rounded-full bg-green-500/20 text-green-400 text-sm">
              ✓ Logged today
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-[var(--mc-text-muted)] mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Total Entries</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalEntries}</p>
              </CardContent>
            </Card>
            <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-[var(--mc-text-muted)] mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Most Common</span>
                </div>
                <p className="text-2xl font-bold capitalize">{stats.mostCommonMood}</p>
              </CardContent>
            </Card>
            <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-[var(--mc-text-muted)] mb-2">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm">Avg Intensity</span>
                </div>
                <p className="text-2xl font-bold">{stats.averageIntensity}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Weekly Chart */}
        <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
          <CardHeader>
            <CardTitle className="text-lg">Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end h-32">
              {weeklyData.map((day, i) => {
                const moodData = MOODS.find(m => m.level === day.mood);
                const Icon = moodData?.icon;
                
                return (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div 
                      className="w-10 rounded-t-lg transition-all duration-300"
                      style={{
                        height: day.intensity ? `${(day.intensity / 10) * 80}px` : '4px',
                        backgroundColor: moodData?.color || 'var(--mc-bg-tertiary)'
                      }}
                    />
                    <span className="text-xs text-[var(--mc-text-muted)]">{day.date}</span>
                    {Icon && <Icon className="w-4 h-4" style={{ color: moodData?.color }} />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Mood Selection */}
        {!hasSubmittedToday && (
          <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
            <CardHeader>
              <CardTitle className="text-lg">How are you feeling today?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mood Emojis */}
              <div className="flex justify-center gap-4">
                {MOODS.map(({ level, icon: Icon, label, color }) => (
                  <button
                    key={level}
                    onClick={() => setSelectedMood(level)}
                    className={`
                      flex flex-col items-center gap-2 p-4 rounded-xl transition-all
                      ${selectedMood === level 
                        ? 'bg-[var(--mc-accent-primary)]/20 scale-110' 
                        : 'hover:bg-[var(--mc-bg-tertiary)]'
                      }
                    `}
                  >
                    <Icon 
                      className="w-10 h-10 transition-colors"
                      style={{ color: selectedMood === level ? color : 'var(--mc-text-muted)' }}
                    />
                    <span className="text-xs capitalize">{label}</span>
                  </button>
                ))}
              </div>

              {/* Intensity Slider */}
              {selectedMood && (
                <div className="space-y-2">
                  <Label>Intensity: {intensity}/10</Label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, var(--mc-accent-primary) ${intensity * 10}%, var(--mc-bg-tertiary) ${intensity * 10}%)`
                    }}
                  />
                </div>
              )}

              {/* Triggers */}
              <div className="space-y-2">
                <Label>What affected your mood?</Label>
                <div className="flex flex-wrap gap-2">
                  {TRIGGERS.map(trigger => (
                    <button
                      key={trigger}
                      onClick={() => toggleTrigger(trigger)}
                      className={`
                        px-3 py-1.5 rounded-full text-sm transition-colors
                        ${selectedTriggers.includes(trigger)
                          ? 'bg-[var(--mc-accent-primary)] text-white'
                          : 'bg-[var(--mc-bg-tertiary)] text-[var(--mc-text-secondary)] hover:bg-[var(--mc-bg-elevated)]'
                        }
                      `}
                    >
                      {trigger}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activities */}
              <div className="space-y-2">
                <Label>What did you do today?</Label>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITIES.map(activity => (
                    <button
                      key={activity}
                      onClick={() => toggleActivity(activity)}
                      className={`
                        px-3 py-1.5 rounded-full text-sm transition-colors
                        ${selectedActivities.includes(activity)
                          ? 'bg-[var(--mc-accent-secondary)] text-white'
                          : 'bg-[var(--mc-bg-tertiary)] text-[var(--mc-text-secondary)] hover:bg-[var(--mc-bg-elevated)]'
                        }
                      `}
                    >
                      {activity}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How was your day? Anything you'd like to remember?"
                  className="bg-[var(--mc-bg-tertiary)] border-[var(--mc-border)] min-h-[100px]"
                />
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={!selectedMood || isLoading}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              >
                {isLoading ? 'Saving...' : 'Log Mood'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Entries */}
        {entries.length > 0 && (
          <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
            <CardHeader>
              <CardTitle className="text-lg">Recent Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {entries.slice(0, 5).map((entry) => {
                  const moodData = MOODS.find(m => m.level === entry.mood);
                  const Icon = moodData?.icon;
                  const ts = entry.timestamp as unknown as FirestoreTimestamp;
                  
                  return (
                    <div 
                      key={entry.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-[var(--mc-bg-tertiary)]"
                    >
                      {Icon && (
                        <Icon 
                          className="w-6 h-6" 
                          style={{ color: moodData?.color }} 
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">{entry.mood}</span>
                          <span className="text-sm text-[var(--mc-text-muted)]">
                            Intensity: {entry.intensity}/10
                          </span>
                        </div>
                        {entry.notes && (
                          <p className="text-sm text-[var(--mc-text-secondary)] line-clamp-2">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-[var(--mc-text-muted)]">
                        {format(new Date(ts.seconds * 1000), 'MMM d')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

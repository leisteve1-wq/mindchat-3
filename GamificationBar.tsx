import { useState, useEffect } from 'react';
import { getCurrentUser, getXPForNextLevel, ACHIEVEMENTS, checkStreakAchievements } from '../lib/auth';
import { X, Zap, Flame, Coins, Trophy, Star } from 'lucide-react';

interface GamificationBarProps {
  onClose: () => void;
}

export default function GamificationBar({ onClose }: GamificationBarProps) {
  const [user, setUser] = useState(getCurrentUser());
  const [showAchievements, setShowAchievements] = useState(false);

  // Refresh user data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setUser(getCurrentUser());
      checkStreakAchievements();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  const xpForNextLevel = getXPForNextLevel(user.stats.level);
  const xpProgress = (user.stats.xp / xpForNextLevel) * 100;

  // Get recent achievements
  const recentAchievements = user.achievements
    .slice(-3)
    .map(id => Object.values(ACHIEVEMENTS).find(a => a.id === id))
    .filter(Boolean);

  return (
    <>
      {/* Gamification Bar */}
      <div className="bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-pink-600/90 backdrop-blur-sm text-white px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Level & XP */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Star className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs opacity-80">Level</span>
                <p className="font-bold leading-none">{user.stats.level}</p>
              </div>
            </div>
            
            {/* XP Bar */}
            <div className="hidden sm:block w-24">
              <div className="flex justify-between text-xs mb-1">
                <span>{user.stats.xp} XP</span>
                <span className="opacity-70">{xpForNextLevel}</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Center: Streak */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Flame className={`w-5 h-5 ${user.streak.current > 0 ? 'text-orange-400' : 'opacity-50'}`} />
              <div>
                <span className="text-xs opacity-80">Streak</span>
                <p className="font-bold leading-none">{user.streak.current}d</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-yellow-500/30 flex items-center justify-center">
                <Coins className="w-4 h-4 text-yellow-300" />
              </div>
              <div>
                <span className="text-xs opacity-80">Coins</span>
                <p className="font-bold leading-none">{user.stats.coins}</p>
              </div>
            </div>
          </div>

          {/* Right: Achievements & Close */}
          <div className="flex items-center gap-2">
            {recentAchievements.length > 0 && (
              <button
                onClick={() => setShowAchievements(!showAchievements)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Trophy className="w-4 h-4 text-yellow-300" />
                <span className="text-xs">{user.achievements.length}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Achievements Dropdown */}
      {showAchievements && (
        <div className="absolute top-14 right-4 z-50 w-72 bg-[var(--mc-bg-secondary)] border border-[var(--mc-border)] rounded-xl shadow-xl">
          <div className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Recent Achievements
            </h3>
            <div className="space-y-2">
              {recentAchievements.map((achievement) => (
                <div 
                  key={achievement!.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-[var(--mc-bg-tertiary)]"
                >
                  <span className="text-2xl">{achievement!.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{achievement!.name}</p>
                    <p className="text-xs text-[var(--mc-text-muted)]">{achievement!.desc}</p>
                  </div>
                  <span className="text-xs text-green-400">+{achievement!.xp} XP</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowAchievements(false)}
              className="w-full mt-3 py-2 text-sm text-[var(--mc-text-muted)] hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

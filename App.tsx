import { useState, useEffect, useCallback } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import type { User } from './lib/auth';
import { getCurrentUser, signOut, recordActivity, isAdmin, initLanguage, t } from './lib';

// Components
import AuthScreen from './components/AuthScreen';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import MoodTracker from './components/MoodTracker';
import Journal from './components/Journal';
import BreathingExercise from './components/BreathingExercise';
import Community from './components/Community';
import PsychologyLessons from './components/PsychologyLessons';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import AdminPanel from './components/AdminPanel';
import UpdateNotification from './components/UpdateNotification';
import VoiceInput from './components/VoiceInput';
import PrivacyLock from './components/PrivacyLock';
import GamificationBar from './components/GamificationBar';

// Icons
import { 
  MessageCircle, 
  Smile, 
  BookOpen, 
  Wind, 
  Users, 
  GraduationCap,
  LayoutDashboard,
  Settings as SettingsIcon,
  Shield,
  Mic
} from 'lucide-react';

// App version
const APP_VERSION = '2.0.0';

type ViewType = 'chat' | 'mood' | 'journal' | 'breathing' | 'community' | 'lessons' | 'dashboard' | 'settings' | 'admin';

function App() {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLocked, setIsLocked] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showGamification, setShowGamification] = useState(true);

  // Initialize app
  useEffect(() => {
    console.log(`[MindChat] App initializing v${APP_VERSION}`);
    
    // Initialize language
    initLanguage();
    
    // Check for existing session
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setIsAdminUser(isAdmin());
      
      // Check if privacy mode is enabled
      if (currentUser.settings.privacyMode && currentUser.settings.privacyPin) {
        setIsLocked(true);
      }
      
      // Record app open activity
      recordActivity('app_open');
    }
    
    setIsLoading(false);

    // Listen for service worker updates
    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
      toast.info(t('update.available'), {
        description: t('update.description'),
        action: {
          label: t('action.update'),
          onClick: () => window.location.reload()
        }
      });
    };

    window.addEventListener('sw-update-available', handleUpdateAvailable);

    // Listen for online/offline
    const handleOnline = () => {
      setIsOnline(true);
      toast.success(t('online.title'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning(t('offline.title'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Auto-lock timer
    const lockInterval = setInterval(() => {
      if (user?.settings.privacyMode && user?.settings.privacyPin && !isLocked) {
        const inactiveTime = Date.now() - lastActivity;
        const lockTime = (user.settings.autoLock || 5) * 60 * 1000;
        
        if (inactiveTime > lockTime) {
          setIsLocked(true);
        }
      }
    }, 10000);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(lockInterval);
    };
  }, [user, lastActivity, isLocked]);

  // Track user activity
  const trackActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Handle auth success
  const handleAuthSuccess = (newUser: User) => {
    setUser(newUser);
    setIsAdminUser(isAdmin());
    toast.success(t('auth.welcome', { name: newUser.displayName || 'friend' }));
    
    // Check for privacy mode
    if (newUser.settings.privacyMode && newUser.settings.privacyPin) {
      setIsLocked(true);
    }
  };

  // Handle logout
  const handleLogout = () => {
    signOut();
    setUser(null);
    setIsAdminUser(false);
    setCurrentView('dashboard');
    toast.success(t('auth.loggedOut'));
  };

  // Handle privacy unlock
  const handleUnlock = () => {
    setIsLocked(false);
    setLastActivity(Date.now());
  };

  // Handle voice input
  const handleVoiceResult = (transcript: string) => {
    setShowVoiceInput(false);
    if (transcript && currentView === 'chat') {
      window.dispatchEvent(new CustomEvent('voice-input', { detail: transcript }));
    }
  };

  // Navigation items
  const navItems = [
    { id: 'dashboard' as ViewType, label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'chat' as ViewType, label: t('nav.chat'), icon: MessageCircle },
    { id: 'mood' as ViewType, label: t('nav.mood'), icon: Smile },
    { id: 'journal' as ViewType, label: t('nav.journal'), icon: BookOpen },
    { id: 'breathing' as ViewType, label: t('nav.breathing'), icon: Wind },
    { id: 'community' as ViewType, label: t('nav.community'), icon: Users },
    { id: 'lessons' as ViewType, label: t('nav.lessons'), icon: GraduationCap },
    { id: 'settings' as ViewType, label: t('nav.settings'), icon: SettingsIcon },
    ...(isAdminUser ? [{ id: 'admin' as ViewType, label: t('nav.admin'), icon: Shield }] : []),
  ];

  // Render current view
  const renderView = () => {
    if (!user) return null;
    
    switch (currentView) {
      case 'chat':
        return <ChatInterface user={user} />;
      case 'mood':
        return <MoodTracker user={user} />;
      case 'journal':
        return <Journal user={user} />;
      case 'breathing':
        return <BreathingExercise />;
      case 'community':
        return <Community user={user} />;
      case 'lessons':
        return <PsychologyLessons />;
      case 'dashboard':
        return <Dashboard user={user} />;
      case 'settings':
        return <Settings user={user} onLogout={handleLogout} />;
      case 'admin':
        return isAdminUser ? <AdminPanel /> : <Dashboard user={user} />;
      default:
        return <Dashboard user={user} />;
    }
  };

  // Show loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--mc-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
            <span className="text-3xl">🧠</span>
          </div>
          <h1 className="text-2xl font-bold gradient-text mb-2">{t('app.name')}</h1>
          <p className="text-[var(--mc-text-secondary)]">{t('action.loading')}</p>
        </div>
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!user) {
    return (
      <>
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  // Show privacy lock if enabled
  if (isLocked) {
    return (
      <>
        <PrivacyLock onUnlock={handleUnlock} />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  return (
    <div 
      className="min-h-screen bg-[var(--mc-bg-primary)] flex"
      onClick={trackActivity}
      onKeyDown={trackActivity}
      onMouseMove={trackActivity}
    >
      {/* Update Notification */}
      {updateAvailable && (
        <UpdateNotification onUpdate={() => window.location.reload()} />
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500/90 text-black text-center py-2 z-50 text-sm font-medium">
          {t('error.offline')}
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentView={currentView}
        onViewChange={setCurrentView}
        navItems={navItems}
        user={user}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen relative">
        {/* Gamification Bar */}
        {showGamification && (
          <GamificationBar onClose={() => setShowGamification(false)} />
        )}

        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-[var(--mc-bg-secondary)] border-b border-[var(--mc-border)]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-[var(--mc-bg-tertiary)] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold gradient-text">{t('app.name')}</h1>
          <button
            onClick={() => setShowVoiceInput(true)}
            className="p-2 rounded-lg hover:bg-[var(--mc-bg-tertiary)] transition-colors"
          >
            <Mic className="w-5 h-5" />
          </button>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between p-4 bg-[var(--mc-bg-secondary)] border-b border-[var(--mc-border)]">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold gradient-text">
              {navItems.find(item => item.id === currentView)?.label || t('app.name')}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowVoiceInput(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--mc-bg-tertiary)] hover:bg-[var(--mc-bg-elevated)] transition-colors"
            >
              <Mic className="w-4 h-4" />
              <span className="text-sm">{t('nav.voice')}</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--mc-bg-tertiary)]">
              <div className="w-2 h-2 rounded-full bg-green-500 pulse-live" />
              <span className="text-xs text-[var(--mc-text-secondary)]">{t('online.status')}</span>
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-hidden">
          {renderView()}
        </div>

        {/* Version Footer */}
        <footer className="hidden lg:block p-2 text-center text-xs text-[var(--mc-text-muted)] border-t border-[var(--mc-border)]">
          {t('app.name')} v{APP_VERSION} • {t('app.tagline')}
        </footer>
      </main>

      {/* Voice Input Modal */}
      {showVoiceInput && (
        <VoiceInput
          onResult={handleVoiceResult}
          onClose={() => setShowVoiceInput(false)}
        />
      )}

      {/* Toast Container */}
      <Toaster 
        position="top-center" 
        richColors 
        toastOptions={{
          style: {
            background: 'var(--mc-bg-secondary)',
            border: '1px solid var(--mc-border)',
            color: 'var(--mc-text-primary)'
          }
        }}
      />
    </div>
  );
}

export default App;

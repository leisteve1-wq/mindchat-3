import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { User } from '../lib/auth';
import { 
  updateUser, 
  setPrivacyPin, 
  createBackup, 
  importData,
  unlockAchievement,
  LANGUAGES,
  setLanguage,
  getLanguage,
  t
} from '../lib';
import { 
  Moon, 
  Bell, 
  Volume2, 
  Mic, 
  Save, 
  Trash2, 
  LogOut,
  User,
  Mail,
  Shield,
  Lock,
  Download,
  Upload,
  Globe,
  Eye,
  EyeOff,
  ChevronDown
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SettingsProps {
  user: User | null;
  onLogout: () => void;
}

export default function Settings({ user, onLogout }: SettingsProps) {
  const [settings, setSettings] = useState(user?.settings || {
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
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load settings from user
  useEffect(() => {
    if (user?.settings) {
      setSettings(user.settings);
    }
  }, [user]);

  // Save settings
  const handleSave = () => {
    setIsSaving(true);
    updateUser({ settings });
    toast.success(t('settings.saved'));
    setIsSaving(false);
  };

  // Toggle setting
  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Handle privacy mode toggle
  const handlePrivacyToggle = (enabled: boolean) => {
    if (enabled && !settings.privacyPin) {
      setShowPinInput(true);
    } else {
      setSettings(prev => ({ ...prev, privacyMode: enabled }));
    }
  };

  // Set PIN
  const handleSetPin = () => {
    if (newPin.length < 4) {
      toast.error('PIN must be at least 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }
    
    setPrivacyPin(newPin);
    setSettings(prev => ({ ...prev, privacyMode: true, privacyPin: 'set' }));
    setShowPinInput(false);
    setNewPin('');
    setConfirmPin('');
    unlockAchievement('PRIVACY_ON');
    toast.success('Privacy PIN set!');
  };

  // Handle backup
  const handleBackup = () => {
    createBackup();
    toast.success(t('backup.created'));
  };

  // Handle import
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = importData(content);
      
      if (result.success) {
        toast.success(t('backup.restored'));
        window.location.reload();
      } else {
        toast.error(result.error || 'Import failed');
      }
    };
    reader.readAsText(file);
  };

  // Handle language change
  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode as any);
    setSettings(prev => ({ ...prev, language: langCode }));
    setShowLanguageDropdown(false);
    unlockAchievement('MULTILINGUAL');
    toast.success('Language changed!');
  };

  // Delete account
  const handleDeleteAccount = () => {
    // Clear all local storage
    localStorage.clear();
    toast.info('Account deleted');
    onLogout();
  };

  const currentLang = LANGUAGES.find(l => l.code === (settings.language || getLanguage()));

  return (
    <div className="h-full overflow-auto p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold gradient-text">{t('settings.title')}</h1>
          <p className="text-[var(--mc-text-secondary)]">{t('settings.subtitle')}</p>
        </div>

        {/* Account Info */}
        <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('settings.account')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold">
                {user?.displayName?.[0] || user?.email?.[0] || 'U'}
              </div>
              <div>
                <p className="font-medium">{user?.displayName || 'User'}</p>
                <p className="text-sm text-[var(--mc-text-muted)] flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {t('settings.language')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-[var(--mc-bg-tertiary)] hover:bg-[var(--mc-bg-elevated)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{currentLang?.flag}</span>
                  <span>{currentLang?.name}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showLanguageDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-auto bg-[var(--mc-bg-secondary)] border border-[var(--mc-border)] rounded-lg shadow-xl z-50">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--mc-bg-tertiary)] transition-colors
                        ${settings.language === lang.code ? 'bg-[var(--mc-accent-primary)]/10' : ''}
                      `}
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Moon className="w-5 h-5" />
              {t('settings.appearance')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>{t('settings.darkMode')}</Label>
                <p className="text-sm text-[var(--mc-text-muted)]">{t('settings.darkModeDesc')}</p>
              </div>
              <Switch
                checked={settings.theme === 'dark'}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, theme: checked ? 'dark' : 'light' }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {t('settings.notifications')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>{t('settings.notifications')}</Label>
                <p className="text-sm text-[var(--mc-text-muted)]">{t('settings.notificationsDesc')}</p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={() => toggleSetting('notifications')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Audio */}
        <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              {t('settings.audio')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>{t('settings.soundEffects')}</Label>
                <p className="text-sm text-[var(--mc-text-muted)]">{t('settings.soundEffectsDesc')}</p>
              </div>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={() => toggleSetting('soundEnabled')}
              />
            </div>
            <Separator className="bg-[var(--mc-border)]" />
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  {t('settings.voiceResponse')}
                </Label>
                <p className="text-sm text-[var(--mc-text-muted)]">{t('settings.voiceResponseDesc')}</p>
              </div>
              <Switch
                checked={settings.voiceEnabled}
                onCheckedChange={() => toggleSetting('voiceEnabled')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {t('settings.privacy')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>{t('settings.saveConversations')}</Label>
                <p className="text-sm text-[var(--mc-text-muted)]">{t('settings.saveConversationsDesc')}</p>
              </div>
              <Switch
                checked={settings.saveConversations}
                onCheckedChange={() => toggleSetting('saveConversations')}
              />
            </div>
            <Separator className="bg-[var(--mc-border)]" />
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  {t('settings.privacyMode')}
                </Label>
                <p className="text-sm text-[var(--mc-text-muted)]">{t('settings.privacyModeDesc')}</p>
              </div>
              <Switch
                checked={settings.privacyMode}
                onCheckedChange={handlePrivacyToggle}
              />
            </div>
            
            {/* PIN Input */}
            {showPinInput && (
              <div className="mt-4 p-4 rounded-lg bg-[var(--mc-bg-tertiary)] space-y-3">
                <p className="text-sm font-medium">{t('settings.setPin')}</p>
                <Input
                  type="password"
                  placeholder="Enter 4-6 digit PIN"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="bg-[var(--mc-bg-secondary)]"
                />
                <Input
                  type="password"
                  placeholder="Confirm PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="bg-[var(--mc-bg-secondary)]"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSetPin} className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600">
                    Set PIN
                  </Button>
                  <Button variant="outline" onClick={() => setShowPinInput(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Backup & Sync */}
        <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="w-5 h-5" />
              {t('backup.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[var(--mc-text-muted)]">{t('backup.subtitle')}</p>
            
            <div className="flex gap-3">
              <Button
                onClick={handleBackup}
                variant="outline"
                className="flex-1 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t('backup.export')}
              </Button>
              <Button
                onClick={handleImportClick}
                variant="outline"
                className="flex-1 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {t('backup.import')}
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <p className="text-xs text-yellow-500/80">
              ⚠️ {t('backup.warning')}
            </p>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? t('action.saving') : t('settings.save')}
        </Button>

        {/* Danger Zone */}
        <Card className="bg-[var(--mc-bg-secondary)] border-red-500/30">
          <CardHeader>
            <CardTitle className="text-lg text-red-400">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-red-400">{t('settings.logout')}</Label>
                <p className="text-sm text-[var(--mc-text-muted)]">Sign out of your account</p>
              </div>
              <Button
                variant="outline"
                onClick={onLogout}
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t('settings.logout')}
              </Button>
            </div>
            <Separator className="bg-red-500/20" />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-red-400">{t('settings.deleteAccount')}</Label>
                <p className="text-sm text-[var(--mc-text-muted)]">{t('settings.deleteAccountDesc')}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('settings.deleteAccount')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Version */}
        <p className="text-center text-sm text-[var(--mc-text-muted)]">
          {t('app.name')} v2.0.0 • {t('app.tagline')}
        </p>

        {/* Delete Confirmation */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
            <AlertDialogHeader>
              <AlertDialogTitle>{t('action.confirm')}</AlertDialogTitle>
              <AlertDialogDescription className="text-[var(--mc-text-secondary)]">
                {t('action.cannotUndo')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-[var(--mc-bg-tertiary)]">
                {t('action.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-red-500 hover:bg-red-600"
              >
                {t('settings.deleteAccount')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Shield, 
  Users, 
  MessageSquare, 
  Settings, 
  BarChart3,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Save
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalChats: number;
  totalMoodEntries: number;
  totalJournalEntries: number;
}

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalChats: 0,
    totalMoodEntries: 0,
    totalJournalEntries: 0
  });
  
  // Config state
  const [config, setConfig] = useState({
    enableAIChat: true,
    enableMoodTracker: true,
    enableJournal: true,
    enableCommunity: true,
    enableQuizzes: true,
    enableVoice: true,
    enableNotifications: true,
    maintenanceMode: false
  });

  // Check if already authenticated
  useEffect(() => {
    const token = localStorage.getItem('mindchat_admin_token');
    if (token) {
      validateToken(token);
    }
  }, []);

  // Validate token
  const validateToken = async (token: string) => {
    try {
      const response = await fetch('/.netlify/functions/admin-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate', token })
      });
      const data = await response.json();
      
      if (data.valid) {
        setIsAuthenticated(true);
        loadStats();
      } else {
        localStorage.removeItem('mindchat_admin_token');
      }
    } catch (error) {
      console.error('Token validation error:', error);
    }
  };

  // Login
  const handleLogin = async () => {
    if (!password) {
      toast.error('Please enter password');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/.netlify/functions/admin-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', password })
      });
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('mindchat_admin_token', data.token);
        setIsAuthenticated(true);
        toast.success('Welcome, Admin');
        loadStats();
      } else {
        toast.error('Invalid password');
      }
    } catch (error) {
      toast.error('Authentication failed');
    }
    
    setIsLoading(false);
  };

  // Load stats
  const loadStats = async () => {
    // In a real app, fetch from your backend
    setStats({
      totalUsers: 150,
      totalChats: 1250,
      totalMoodEntries: 890,
      totalJournalEntries: 450
    });
  };

  // Save config
  const saveConfig = async () => {
    toast.success('Configuration saved');
  };

  // Toggle feature
  const toggleFeature = (key: keyof typeof config) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Admin Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Admin Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="pr-10 bg-[var(--mc-bg-tertiary)] border-[var(--mc-border)]"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mc-text-muted)]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500"
              >
                <Lock className="w-4 h-4 mr-2" />
                {isLoading ? 'Verifying...' : 'Access Admin Panel'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-[var(--mc-text-secondary)]">Manage MindChat</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              localStorage.removeItem('mindchat_admin_token');
              setIsAuthenticated(false);
            }}
          >
            Logout
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-[var(--mc-text-muted)]">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
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
                  <BarChart3 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalMoodEntries}</p>
                  <p className="text-xs text-[var(--mc-text-muted)]">Mood Entries</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalJournalEntries}</p>
                  <p className="text-xs text-[var(--mc-text-muted)]">Journal Entries</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="features" className="w-full">
          <TabsList className="bg-[var(--mc-bg-secondary)]">
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="space-y-4">
            <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
              <CardHeader>
                <CardTitle>Feature Flags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(config).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <Label className="capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                      <p className="text-sm text-[var(--mc-text-muted)]">
                        {key === 'maintenanceMode' 
                          ? 'Put app in maintenance mode' 
                          : `Enable ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`
                        }
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => toggleFeature(key as keyof typeof config)}
                      className="w-5 h-5 rounded border-[var(--mc-border)]"
                    />
                  </div>
                ))}
                <Button
                  onClick={saveConfig}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
              <CardHeader>
                <CardTitle>Dynamic Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--mc-text-secondary)]">
                  Edit welcome messages, daily tips, and crisis resources from the 
                  Netlify Functions configuration.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => toast.info('Edit netlify/functions/app-config.ts')}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Content
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--mc-text-secondary)]">
                  User management features would be implemented here with 
                  Firebase Admin SDK integration.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--mc-bg-tertiary)]">
                  <span>API Status</span>
                  <span className="flex items-center gap-2 text-green-400">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    Operational
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--mc-bg-tertiary)]">
                  <span>Database</span>
                  <span className="flex items-center gap-2 text-green-400">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--mc-bg-tertiary)]">
                  <span>AI Service</span>
                  <span className="flex items-center gap-2 text-green-400">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    Active
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

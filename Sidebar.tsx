import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import type { User as FirebaseUser } from 'firebase/auth';
import { LogOut, X, ChevronLeft, ChevronRight, Brain } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onViewChange: (view: any) => void;
  navItems: NavItem[];
  user: FirebaseUser | null;
}

export default function Sidebar({ 
  isOpen, 
  onClose, 
  currentView, 
  onViewChange, 
  navItems,
  user 
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const handleNavClick = (viewId: string) => {
    onViewChange(viewId);
    onClose();
  };

  const handleLogout = async () => {
    try {
      const { logOut } = await import('../lib/firebase');
      await logOut();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  // Get user initials
  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return user?.email?.[0].toUpperCase() || 'U';
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-[var(--mc-bg-secondary)] border-r border-[var(--mc-border)]
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'lg:w-20' : 'w-72 lg:w-64'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${collapsed ? 'lg:hidden' : ''}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="lg:block">
              <h1 className="font-bold gradient-text">MindChat</h1>
              <p className="text-xs text-[var(--mc-text-muted)]">by SteveAI</p>
            </div>
          </div>
          
          {/* Mobile close button */}
          <button 
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-[var(--mc-bg-tertiary)]"
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* Desktop collapse button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-[var(--mc-bg-tertiary)] text-[var(--mc-text-muted)]"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <Separator className="bg-[var(--mc-border)]" />

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-indigo-500/20 to-purple-600/20 text-[var(--mc-accent-primary)] border border-[var(--mc-accent-primary)]/30' 
                      : 'text-[var(--mc-text-secondary)] hover:bg-[var(--mc-bg-tertiary)] hover:text-[var(--mc-text-primary)]'
                    }
                    ${collapsed ? 'lg:justify-center' : ''}
                  `}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[var(--mc-accent-primary)]' : ''}`} />
                  <span className={`text-sm font-medium ${collapsed ? 'lg:hidden' : ''}`}>
                    {item.label}
                  </span>
                  {isActive && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--mc-accent-primary)]" />
                  )}
                </button>
              );
            })}
          </nav>
        </ScrollArea>

        <Separator className="bg-[var(--mc-border)]" />

        {/* User Section */}
        <div className="p-4">
          <div className={`
            flex items-center gap-3 p-3 rounded-lg bg-[var(--mc-bg-tertiary)]
            ${collapsed ? 'lg:justify-center lg:p-2' : ''}
          `}>
            <Avatar className="w-9 h-9 flex-shrink-0">
              <AvatarImage src={user?.photoURL || ''} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-xs text-[var(--mc-text-muted)] truncate">
                  {user?.email}
                </p>
              </div>
            )}
            
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-[var(--mc-bg-secondary)] text-[var(--mc-text-muted)] hover:text-[var(--mc-error)] transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Collapsed logout button */}
          {collapsed && (
            <button
              onClick={handleLogout}
              className="hidden lg:flex w-full mt-2 p-2 rounded-lg hover:bg-[var(--mc-bg-tertiary)] text-[var(--mc-text-muted)] hover:text-[var(--mc-error)] justify-center"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Version */}
        {!collapsed && (
          <div className="px-4 pb-4 text-center">
            <p className="text-xs text-[var(--mc-text-muted)]">v1.0.0</p>
          </div>
        )}
      </aside>
    </>
  );
}

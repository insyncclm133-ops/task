import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListTodo, LogOut, User, Users, Shield, Briefcase, Settings, Menu, X, Wallet, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationBell } from '@/components/tasks/NotificationBell';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, userRole, orgName, signOut, isPlatformAdmin, trialDaysLeft, isTrialExpired, orgPlan } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-close sidebar on navigate
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const showTrialBanner = !isPlatformAdmin && orgPlan === 'trial' && (isTrialExpired || trialDaysLeft <= 5);

  const navItems = isPlatformAdmin
    ? [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }]
    : [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/tasks', icon: ListTodo, label: 'Tasks' },
      ];

  const adminNavItems = isPlatformAdmin
    ? []
    : isAdmin
      ? [
          { to: '/users', icon: Users, label: 'Users' },
          { to: '/designations', icon: Briefcase, label: 'Designations' },
          { to: '/access-management', icon: Shield, label: 'Access' },
          { to: '/billing', icon: Wallet, label: 'Billing' },
        ]
      : [];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border">
        <Settings className="h-5 w-5 text-sidebar-primary" />
        <span className="font-bold text-sm text-white truncate">{isPlatformAdmin ? 'Task Platform' : (orgName || 'Work-Sync')}</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
              location.pathname === item.to
                ? 'bg-sidebar-accent text-sidebar-primary'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-white'
            )}
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </Link>
        ))}

        {adminNavItems.length > 0 && (
          <>
            <div className="pt-4 pb-2 px-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                Admin
              </span>
            </div>
            {adminNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  location.pathname === item.to
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-white'
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4 space-y-3">
        {/* User info — clickable to profile */}
        <Link to="/profile" className="flex items-center gap-3 rounded-lg p-1 -m-1 hover:bg-sidebar-accent transition-colors">
          <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-sidebar-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate">{profile?.full_name || user?.email}</p>
            {userRole && (
              <p className="text-[10px] text-sidebar-foreground capitalize">{userRole.replace('_', ' ')}</p>
            )}
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={signOut}
            className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile hamburger */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-4 z-50 p-2 rounded-lg bg-sidebar-background text-white shadow-lg"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-sidebar-background text-sidebar-foreground transition-transform duration-300',
          isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0',
          !isMobile && 'translate-x-0'
        )}
      >
        {isMobile && sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-3 top-4 p-1 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <main className="min-h-screen p-6 pt-16 lg:ml-64 lg:pt-8">
        {/* Trial banner */}
        {showTrialBanner && (
          <div className={`flex items-center gap-3 rounded-xl px-4 py-3 mb-4 text-sm ${
            isTrialExpired
              ? 'bg-destructive/10 border border-destructive/30 text-destructive'
              : trialDaysLeft <= 2
              ? 'bg-orange-50 border border-orange-200 text-orange-800'
              : 'bg-amber-50 border border-amber-200 text-amber-800'
          }`}>
            {isTrialExpired
              ? <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              : <Clock className="h-4 w-4 flex-shrink-0" />
            }
            <span className="flex-1">
              {isTrialExpired
                ? 'Your 14-day free trial has expired.'
                : `Your free trial expires in ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'}.`
              }
            </span>
            <Link
              to="/billing"
              className="flex-shrink-0 font-semibold underline underline-offset-2 hover:opacity-80"
            >
              Upgrade now
            </Link>
          </div>
        )}

        {/* Top bar with notification */}
        <div className="flex justify-end mb-4">
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={(id) => markAsRead.mutate(id)}
            onMarkAllAsRead={() => markAllAsRead.mutate()}
            onNotificationClick={(n) => {
              if (n.task_id) navigate(`/tasks/${n.task_id}`);
            }}
          />
        </div>
        {children}
      </main>
    </div>
  );
}

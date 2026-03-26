import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListTodo, LogOut, User, Users, Shield, Briefcase, Settings, Menu, X, Wallet } from 'lucide-react';
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
  const { user, profile, isAdmin, userRole, orgName, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-close sidebar on navigate
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/tasks', icon: ListTodo, label: 'Tasks' },
  ];

  const adminNavItems = isAdmin
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
        <span className="font-bold text-sm text-white truncate">{orgName || 'TaskManager'}</span>
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
        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-sidebar-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate">{profile?.full_name || user?.email}</p>
            {userRole && (
              <p className="text-[10px] text-sidebar-foreground capitalize">{userRole.replace('_', ' ')}</p>
            )}
          </div>
        </div>

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

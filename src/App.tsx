import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { Layout } from '@/components/Layout';
import { DashboardPage } from '@/pages/Dashboard';
import { PlatformDashboard } from '@/pages/PlatformDashboard';
import { TasksPage } from '@/pages/Tasks';
import { TaskDetailPage } from '@/pages/TaskDetail';
import { AuthPage } from '@/pages/Auth';
import { LandingPage } from '@/pages/Landing';
import { OnboardingPage } from '@/pages/Onboarding';
import { UserManagementPage } from '@/pages/UserManagement';
import { DesignationsPage } from '@/pages/Designations';
import { BillingPage } from '@/pages/Billing';
import { ProfilePage } from '@/pages/Profile';
import Demo from '@/pages/Demo';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
    </div>
  );
}

function ProtectedRoute({ children, requiredAdmin, requireOrg }: { children: React.ReactNode; requiredAdmin?: boolean; requireOrg?: boolean }) {
  const { user, isLoading, isInitialized, isAdmin, isPlatformAdmin, isTrialExpired } = useAuth();
  const location = useLocation();

  if (!isInitialized || isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/auth" replace />;

  // Platform admin cannot access org-level routes
  if (isPlatformAdmin && (requiredAdmin || requireOrg)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Org admin routes require org admin role
  if (requiredAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Trial expired: only billing page is accessible
  if (isTrialExpired && location.pathname !== '/billing') {
    return <Navigate to="/billing" replace />;
  }

  return <Layout>{children}</Layout>;
}

/** Smart dashboard: platform admin sees platform overview, org users see task dashboard */
function SmartDashboard() {
  const { isPlatformAdmin } = useAuth();
  return isPlatformAdmin ? <PlatformDashboard /> : <DashboardPage />;
}

function AppRoutes() {
  const { user, isLoading, isInitialized } = useAuth();

  if (!isInitialized || isLoading) return <LoadingSpinner />;

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <OnboardingPage />} />
      <Route path="/demo" element={<Demo />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><SmartDashboard /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute requireOrg><TasksPage /></ProtectedRoute>} />
      <Route path="/tasks/:id" element={<ProtectedRoute requireOrg><TaskDetailPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      {/* Admin routes (org-level) */}
      <Route path="/billing" element={<ProtectedRoute requiredAdmin><BillingPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute requiredAdmin><UserManagementPage /></ProtectedRoute>} />
      <Route path="/designations" element={<ProtectedRoute requiredAdmin><DesignationsPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

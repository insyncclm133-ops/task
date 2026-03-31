import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function OnboardingPage() {
  const navigate = useNavigate();

  const [orgName, setOrgName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canSubmit =
    orgName.trim().length >= 2 &&
    adminName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail) &&
    adminPassword.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError('');
    setIsSubmitting(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'register-organization',
        {
          body: {
            org_name: orgName.trim(),
            admin_name: adminName.trim(),
            admin_email: adminEmail.toLowerCase().trim(),
            admin_password: adminPassword,
          },
        },
      );

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      // Auto-login with the new credentials
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: adminEmail.toLowerCase().trim(),
        password: adminPassword,
      });

      if (loginError) {
        toast.info('Organization created successfully. Please sign in to continue.', {
          duration: 5000,
        });
        navigate('/auth');
        return;
      }

      toast.success('Welcome! Your organization is ready. Redirecting to dashboard...');
      navigate('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Registration failed. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 to-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="text-lg font-bold">
            <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Work-Sync
            </span>
          </a>
          <button
            onClick={() => navigate('/auth')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Already have an account? Sign In
          </button>
        </div>
      </header>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl border bg-card shadow-xl overflow-hidden">
            {/* Card Header */}
            <div className="text-center px-8 pt-8 pb-4">
              <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold">Register Your Organization</h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Set up your workspace and start managing tasks with your team.
              </p>
            </div>

            {/* Card Body */}
            <div className="px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Organization Name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="mt-1 w-full h-11 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g., Acme Corp"
                    maxLength={100}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Your Full Name</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="mt-1 w-full h-11 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g., Amit Sengupta"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Work Email</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="mt-1 w-full h-11 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Password</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="mt-1 w-full h-11 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Min. 6 characters"
                    minLength={6}
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="w-full h-12 text-sm font-medium rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating your organization...
                    </>
                  ) : (
                    'Create Organization'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate('/')}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to home
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

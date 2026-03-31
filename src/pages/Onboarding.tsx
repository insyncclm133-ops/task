import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export function OnboardingPage() {
  const { profile, refreshAuth } = useAuth();
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = orgName.trim();
    if (!trimmed) return;

    setError('');
    setLoading(true);

    try {
      const { error: rpcError } = await supabase.rpc('setup_new_organization', {
        p_org_name: trimmed,
      });

      if (rpcError) throw rpcError;

      // Refresh auth context to pick up the new org_id, role, etc.
      await refreshAuth();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const firstName = profile?.first_name || profile?.full_name?.split(' ')[0] || '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Building2 className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            Welcome{firstName ? `, ${firstName}` : ''}!
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Set up your organization to start managing tasks with your team.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-card p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium">Organization Name</label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="mt-1 w-full h-11 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g. Acme Corp"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                You'll be the admin of this organization.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !orgName.trim()}
              className="w-full h-11 text-sm font-medium rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                'Creating...'
              ) : (
                <>
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-2 text-[11px] text-muted-foreground justify-center">
            <Sparkles className="h-3 w-3" />
            <span>You can invite team members after setup</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

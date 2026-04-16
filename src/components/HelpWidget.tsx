import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { HelpCircle, X, Loader2, CheckCircle2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

type Category = 'bug' | 'feature' | 'question' | 'billing' | 'other';
type Priority = 'low' | 'medium' | 'high';

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'bug', label: 'Bug / Issue' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'question', label: 'Question' },
  { value: 'billing', label: 'Billing' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-700 border-red-300' },
];

export function HelpWidget() {
  const { user, profile, orgId } = useAuth();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('question');
  const [priority, setPriority] = useState<Priority>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!user) return null;

  const resetForm = () => {
    setSubject('');
    setDescription('');
    setCategory('question');
    setPriority('medium');
    setSubmitted(false);
  };

  const close = () => {
    setOpen(false);
    setTimeout(resetForm, 200);
  };

  const valid = subject.trim().length >= 3 && description.trim().length >= 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('support_tickets').insert({
        org_id: orgId,
        user_id: user.id,
        user_email: user.email,
        user_name: profile?.full_name ?? null,
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
        page_url: `${location.pathname}${location.search}`,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      });
      if (error) throw error;

      setSubmitted(true);
      toast.success('Ticket raised. Our team will get back to you shortly.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not raise ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating launcher */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Raise a help ticket"
        className={cn(
          'fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full',
          'bg-gradient-to-br from-violet-600 to-purple-600 text-white',
          'shadow-xl shadow-violet-500/40 hover:shadow-violet-500/60',
          'flex items-center justify-center transition-transform hover:scale-105 active:scale-95',
          open && 'opacity-0 pointer-events-none'
        )}
      >
        <HelpCircle className="h-6 w-6" />
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-end p-0 sm:p-5 pointer-events-none">
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-black/40 sm:hidden pointer-events-auto"
            onClick={close}
          />

          <div className="relative w-full sm:w-[26rem] max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-card border shadow-2xl pointer-events-auto animate-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold leading-tight">Need help?</h2>
                  <p className="text-xs text-white/80 leading-tight">Raise a ticket — we'll respond soon</p>
                </div>
              </div>
              <button
                onClick={close}
                aria-label="Close help widget"
                className="p-1.5 rounded-md hover:bg-white/15"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            {submitted ? (
              <div className="px-6 py-10 text-center space-y-4">
                <div className="mx-auto h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-green-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold">Ticket raised successfully</h3>
                  <p className="text-sm text-muted-foreground">
                    Our support team will reach out to <strong>{user.email}</strong> soon.
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 h-10 text-sm font-medium rounded-lg border border-input hover:bg-muted transition-colors"
                  >
                    Raise another
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    className="flex-1 h-10 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Category */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="mt-1 w-full h-10 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Priority</label>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    {PRIORITIES.map((p) => (
                      <button
                        type="button"
                        key={p.value}
                        onClick={() => setPriority(p.value)}
                        className={cn(
                          'h-9 text-xs font-medium rounded-lg border transition-colors',
                          priority === p.value
                            ? p.color
                            : 'bg-background border-input text-muted-foreground hover:bg-muted'
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Short summary of the issue"
                    maxLength={120}
                    className="mt-1 w-full h-10 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what's happening, steps to reproduce, what you expected…"
                    rows={5}
                    maxLength={2000}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                  <div className="mt-1 text-[11px] text-muted-foreground text-right">
                    {description.length} / 2000
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!valid || submitting}
                  className="w-full h-11 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                  ) : (
                    <><Send className="h-4 w-4" /> Raise Ticket</>
                  )}
                </button>

                <p className="text-[11px] text-muted-foreground text-center">
                  We'll reply to <strong>{user.email}</strong>
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

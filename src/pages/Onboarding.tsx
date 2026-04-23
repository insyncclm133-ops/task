import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, ArrowLeft, Loader2, Mail, MessageSquare, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function OnboardingPage() {
  const navigate = useNavigate();

  // Form fields
  const [orgName, setOrgName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP state
  const [verificationId, setVerificationId] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // UI state
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const formValid =
    orgName.trim().length >= 2 &&
    adminName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail) &&
    adminPhone.trim().length >= 10 &&
    adminPassword.length >= 6;

  const otpValid = emailOtp.length === 6 && phoneOtp.length === 6;

  const handleSendOtp = async () => {
    if (!formValid) return;
    setError('');
    setIsSendingOtp(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('send-otp', {
        body: { email: adminEmail.toLowerCase().trim(), phone: adminPhone.trim() },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setVerificationId(data.verification_id);
      setOtpSent(true);
      setEmailOtp('');
      setPhoneOtp('');
      toast.success('OTPs sent! Check your email and WhatsApp.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTPs. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent || !otpValid) return;
    setError('');
    setIsSubmitting(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('register-organization', {
        body: {
          org_name: orgName.trim(),
          admin_name: adminName.trim(),
          admin_email: adminEmail.toLowerCase().trim(),
          admin_password: adminPassword,
          admin_phone: adminPhone.trim(),
          verification_id: verificationId,
          email_otp: emailOtp.trim(),
          phone_otp: phoneOtp.trim(),
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: adminEmail.toLowerCase().trim(),
        password: adminPassword,
      });

      if (loginError) {
        toast.info('Organization created! Please sign in.');
        navigate('/auth');
        return;
      }

      toast.success('Welcome! Your organization is ready.');
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
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

                {/* Organization Name */}
                <div>
                  <label className="text-sm font-medium">Organization Name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    disabled={otpSent}
                    className="mt-1 w-full h-11 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="e.g., Acme Corp"
                    maxLength={100}
                    autoFocus
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label className="text-sm font-medium">Your Full Name</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    disabled={otpSent}
                    className="mt-1 w-full h-11 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="e.g., Amit Sengupta"
                    maxLength={100}
                  />
                </div>

                {/* Work Email */}
                <div>
                  <label className="text-sm font-medium">Work Email</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    disabled={otpSent}
                    className="mt-1 w-full h-11 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="you@company.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-sm font-medium">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    disabled={otpSent}
                    className="mt-1 w-full h-11 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="e.g., 919876543210"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Include country code, e.g. 91 for India</p>
                </div>

                {/* Password */}
                <div>
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative mt-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      disabled={otpSent}
                      className="w-full h-11 px-3 pr-10 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder="Min. 6 characters"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={otpSent}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Send OTP Button */}
                {!otpSent && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={!formValid || isSendingOtp}
                    className="w-full h-11 text-sm font-medium rounded-lg border-2 border-primary text-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isSendingOtp ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Sending OTPs...</>
                    ) : (
                      'Send Verification Codes'
                    )}
                  </button>
                )}

                {/* OTP Fields — appear inline after sending */}
                <AnimatePresence>
                  {otpSent && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 p-3 text-xs text-violet-700 dark:text-violet-300">
                        OTPs sent to <strong>{adminEmail}</strong> and your WhatsApp <strong>{adminPhone}</strong>.
                      </div>

                      {/* Email OTP */}
                      <div>
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          Email OTP
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                          className="mt-1 w-full h-11 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring tracking-widest text-center font-mono text-lg"
                          placeholder="— — — — — —"
                          autoFocus
                        />
                      </div>

                      {/* WhatsApp OTP */}
                      <div>
                        <label className="text-sm font-medium flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          WhatsApp OTP
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={phoneOtp}
                          onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                          className="mt-1 w-full h-11 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring tracking-widest text-center font-mono text-lg"
                          placeholder="— — — — — —"
                        />
                      </div>

                      {/* Resend link */}
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => { setOtpSent(false); setVerificationId(''); setEmailOtp(''); setPhoneOtp(''); }}
                          className="text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          Didn't receive? Edit details or resend
                        </button>
                      </div>

                      {/* Submit */}
                      {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                          {error}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={!otpValid || isSubmitting}
                        className="w-full h-12 text-sm font-medium rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Creating your organization...</>
                        ) : (
                          <><CheckCircle2 className="h-4 w-4" /> Create Organization</>
                        )}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error (before OTP sent) */}
                {!otpSent && error && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                )}
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

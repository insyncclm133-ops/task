import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import {
  Settings, ArrowRight, CheckCircle, Users, Calendar, Flag,
  MessageSquare, BarChart3, Sparkles, Clock, ListTodo, Target,
  TrendingUp, Zap, Check, Crown, Gift,
} from 'lucide-react';

/* ── Animation variants ─────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ── AnimatedSection ────────────────────── */

function AnimatedSection({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Floating Particles ─────────────────── */

function FloatingParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-primary/10"
          style={{
            width: 8 + i * 12,
            height: 8 + i * 12,
            left: `${15 + i * 14}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15 * (i % 2 === 0 ? 1 : -1), 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4 + i * 0.7,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  );
}

/* ── Animated Counter ───────────────────── */

function AnimatedCounter({ target, label }: { target: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let current = 0;
    const step = Math.max(1, Math.floor(target / 40));
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(current);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [isInView, target]);

  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl font-bold text-foreground">{count.toLocaleString()}+</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

/* ── Data ────────────────────────────────── */

const features = [
  { icon: CheckCircle, title: 'Task Assignment', desc: 'Assign tasks to team members with priorities and deadlines.', gradient: 'from-sky-500/10 to-blue-500/10' },
  { icon: Users, title: 'Team Workload', desc: 'Visualize workload across your team at a glance.', gradient: 'from-violet-500/10 to-purple-500/10' },
  { icon: Calendar, title: 'Due Date Tracking', desc: 'Never miss a deadline with smart due date tracking.', gradient: 'from-amber-500/10 to-orange-500/10' },
  { icon: Flag, title: 'Priority Management', desc: 'Set priorities from low to urgent for every task.', gradient: 'from-rose-500/10 to-pink-500/10' },
  { icon: MessageSquare, title: 'Real-time Comments', desc: 'Collaborate with comments and file attachments.', gradient: 'from-fuchsia-500/10 to-purple-500/10' },
  { icon: BarChart3, title: 'Progress Analytics', desc: 'Track completion rates, trends, and team performance.', gradient: 'from-cyan-500/10 to-teal-500/10' },
];

const steps = [
  { icon: ListTodo, title: 'Create Tasks', description: 'Define tasks with descriptions, priorities, and due dates.' },
  { icon: Target, title: 'Assign', description: 'Assign to team members based on role and workload.' },
  { icon: TrendingUp, title: 'Track', description: 'Monitor progress with real-time status updates.' },
  { icon: Zap, title: 'Achieve', description: 'Complete tasks and celebrate team achievements.' },
];

/* ── Landing Page ────────────────────────── */

export function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ──────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <Settings className="h-5 w-5 text-primary" />
            TaskManager
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link
              to="/auth"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────── */}
      <section ref={heroRef} className="relative overflow-hidden">
        {/* Gradient mesh bg */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-400/6 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-300/5 rounded-full blur-[80px]" />
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <FloatingParticles />

        <motion.div style={{ y: heroY }} className="mx-auto max-w-4xl text-center px-6 py-28 lg:py-40">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Task Management Reimagined
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight"
          >
            Manage Tasks with{' '}
            <span className="bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
              Precision
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            A powerful task management platform that helps teams assign, track, and complete
            work with clarity and confidence.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all hover:scale-105"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border font-medium hover:bg-muted transition-all hover:scale-105"
            >
              Learn More
            </a>
          </motion.div>

          {/* Trust signals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-14 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Free to start
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              No credit card
            </span>
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Team ready
            </span>
          </motion.div>
        </motion.div>

        {/* Embedded product demo — outside parallax wrapper */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="relative mx-auto max-w-5xl px-4 pb-20 sm:px-6 sm:pb-28"
        >
          <div className="relative rounded-2xl border border-border/60 bg-black shadow-2xl shadow-primary/10 overflow-hidden">
            {/* Browser-style top bar */}
            <div className="flex items-center gap-2 border-b border-white/10 bg-black/80 px-4 py-2.5">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <div className="ml-3 flex-1 rounded-md bg-white/10 px-3 py-1 text-[11px] text-white/40">
                app.taskmanager.com/demo
              </div>
            </div>
            <iframe
              src="/demo"
              title="TaskManager Product Demo"
              className="w-full border-0"
              style={{ height: 'min(70vh, 540px)' }}
              loading="eager"
            />
          </div>
        </motion.div>
      </section>

      {/* ── Features ────────────────────── */}
      <section id="features" className="relative border-t border-border/50 py-24 sm:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-20">
            <motion.div
              variants={fadeUp}
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Features
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="text-3xl sm:text-5xl font-bold tracking-tight"
            >
              Everything you need to{' '}
              <span className="text-primary">manage tasks</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto"
            >
              Built for teams who want clarity, accountability, and results.
            </motion.p>
          </AnimatedSection>

          <AnimatedSection className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => (
              <motion.div
                key={feat.title}
                variants={fadeUp}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`rounded-2xl border bg-gradient-to-br ${feat.gradient} p-7 h-full`}
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <feat.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feat.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feat.desc}</p>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* ── How It Works ────────────────── */}
      <section
        id="how-it-works"
        className="relative border-t border-border/50 bg-muted/30"
      >
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <AnimatedSection className="mx-auto max-w-2xl text-center">
            <motion.div
              variants={fadeUp}
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
            >
              <Clock className="h-3.5 w-3.5" />
              How It Works
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl"
            >
              Up and running in{' '}
              <span className="text-primary">minutes</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-5 text-lg text-muted-foreground"
            >
              Four simple steps to transform your workflow
            </motion.p>
          </AnimatedSection>

          <AnimatedSection className="relative mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Connecting line (desktop only) */}
            <div className="pointer-events-none absolute top-14 left-[12%] right-[12%] hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block" />

            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                variants={fadeUp}
                className="relative text-center"
              >
                {/* Step number ring */}
                <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/20" />
                  <div className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25">
                    {i + 1}
                  </div>
                  <step.icon className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mx-auto mt-2 max-w-[240px] text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* ── Stats ───────────────────────── */}
      <section className="border-t border-border/50 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <AnimatedCounter target={5000} label="Tasks Completed" />
              <AnimatedCounter target={200} label="Teams Active" />
              <AnimatedCounter target={99} label="Uptime %" />
              <AnimatedCounter target={50} label="Countries" />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Pricing ──────────────────────── */}
      <section id="pricing" className="border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 sm:py-32">
          <AnimatedSection className="text-center">
            <motion.div
              variants={fadeUp}
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
            >
              <Crown className="h-3.5 w-3.5" />
              Pricing
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="text-3xl sm:text-5xl font-bold tracking-tight"
            >
              One Plan.{' '}
              <span className="text-primary">Everything Included.</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto"
            >
              No tiers, no hidden fees. Full access for your entire team.
            </motion.p>
          </AnimatedSection>

          <AnimatedSection className="mt-16 flex justify-center">
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative w-full max-w-md rounded-3xl border-2 border-primary/30 bg-card p-10 shadow-xl shadow-primary/5"
            >
              {/* Popular badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-1.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25">
                  <Sparkles className="h-3.5 w-3.5" />
                  Most Popular
                </span>
              </div>

              {/* Price */}
              <div className="text-center pt-4 pb-8 border-b border-border/50">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-extrabold tracking-tight">₹199</span>
                  <span className="text-muted-foreground text-lg">/user/mo</span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Billed monthly. Cancel anytime.
                </p>
              </div>

              {/* Welcome credits callout */}
              <div className="mt-6 flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/10 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Gift className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">₹100 Welcome Credits</p>
                  <p className="text-xs text-muted-foreground">Free credits on every new account</p>
                </div>
              </div>

              {/* Feature list */}
              <ul className="mt-8 space-y-4">
                {[
                  'Unlimited tasks & projects',
                  'Team collaboration & assignment',
                  'Priority & due-date tracking',
                  'Real-time comments & updates',
                  'Dashboard analytics & charts',
                  'Role-based access control',
                  'User & designation management',
                  'Dark mode & mobile responsive',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                to="/auth"
                className="mt-10 flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all hover:scale-[1.02]"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                No credit card required. 14-day free trial.
              </p>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── CTA ─────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <motion.div
              variants={fadeUp}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-purple-700 p-12 sm:p-16 text-center text-white"
            >
              {/* Decorative blobs */}
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/5 rounded-full blur-3xl" />

              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to get started?</h2>
                <p className="text-white/80 mb-10 max-w-md mx-auto text-lg">
                  Join teams already using TaskManager to achieve their goals.
                </p>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-purple-700 font-semibold hover:bg-white/90 transition-all hover:scale-105 shadow-lg"
                >
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Footer ──────────────────────── */}
      <footer className="border-t py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Settings className="h-4 w-4 text-primary" />
            TaskManager
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} TaskManager. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight, CheckCircle, Users, Flag,
  MessageSquare, BarChart3, Sparkles, Clock, AlertTriangle,
  Bell, Shield, Check, Crown, Phone, Mail, Zap, Star,
} from 'lucide-react';

/* ── GA4 Lead Tracking ───────────────────── */

function trackLeadEvent(ctaLabel: string) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'generate_lead', {
      product_key: 'crm',
      form_type: 'signup',
      cta_label: ctaLabel,
    });
  }
}

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

const clientLogos = [
  { src: '/logos/quess.png', alt: 'Quess Corp' },
  { src: '/logos/motherson.jpg', alt: 'Motherson' },
  { src: '/logos/hiranandani.png', alt: 'Hiranandani' },
  { src: '/logos/audi.png', alt: 'Audi' },
  { src: '/logos/college-dekho.jpg', alt: 'College Dekho' },
  { src: '/logos/zolve.webp', alt: 'Zolve' },
  { src: '/logos/capital-india.webp', alt: 'Capital India' },
  { src: '/logos/ecofy.png', alt: 'Ecofy' },
  { src: '/logos/zopper.png', alt: 'Zopper' },
  { src: '/logos/alice-blue.png', alt: 'Alice Blue' },
  { src: '/logos/ezeepay.png', alt: 'Ezeepay' },
  { src: '/logos/incred.png', alt: 'InCred' },
  { src: '/logos/seeds.png', alt: 'Seeds' },
  { src: '/logos/growthvine.png', alt: 'GrowthVine' },
  { src: '/logos/uhc.png', alt: 'UHC' },
  { src: '/logos/car-trends.webp', alt: 'Car Trends' },
  { src: '/logos/legitquest.png', alt: 'LegitQuest' },
  { src: '/logos/evco.jpg', alt: 'EV Co' },
  { src: '/logos/bluspring.png', alt: 'BluSpring' },
  { src: '/logos/cubit.jpeg', alt: 'Cubit' },
  { src: '/logos/smb-connect.jpg', alt: 'SMB Connect' },
  { src: '/logos/rb.jpg', alt: 'RB' },
];

const painPoints = [
  { icon: AlertTriangle, title: 'Tasks given, never tracked', desc: 'Managers assign tasks verbally or over chat. No record. No follow-up.' },
  { icon: Clock, title: 'Deadlines missed silently', desc: 'Due dates pass. Nobody knows until the client complains.' },
  { icon: Users, title: 'No accountability chain', desc: 'Who assigned it? Who was supposed to do it? Nobody remembers.' },
  { icon: MessageSquare, title: 'Updates lost in WhatsApp', desc: 'Task status buried in chat groups. Impossible to extract.' },
];

const howItWorks = [
  { step: 1, title: 'Assign', desc: 'Create a task with deadline, priority, and assignee. Instant WhatsApp + email notification.', icon: Flag },
  { step: 2, title: 'Notify', desc: 'Assignee gets notified on WhatsApp and email. No more "I didn\'t know about it".', icon: Bell },
  { step: 3, title: 'Update', desc: 'Status changes trigger automatic alerts. Everyone stays in the loop.', icon: BarChart3 },
  { step: 4, title: 'Confirm', desc: 'Assigner signs off on completion quality. "Done" means actually done.', icon: CheckCircle },
];

const features = [
  { icon: Phone, title: 'WhatsApp Alerts', desc: 'Instant task notifications on WhatsApp at every lifecycle stage — the one weapon Asana cannot match.', gradient: 'from-emerald-500/10 to-green-500/10' },
  { icon: CheckCircle, title: 'Satisfaction Confirmation', desc: 'The task giver signs off on completion quality. "Done" is not done until the assigner confirms. No competitor has this.', gradient: 'from-violet-500/10 to-purple-500/10' },
  { icon: Shield, title: 'Designation Hierarchy', desc: 'MD → VP → Manager → Executive. Built for how Indian organisations are actually structured, not flat western teams.', gradient: 'from-sky-500/10 to-blue-500/10' },
  { icon: Mail, title: 'Email + WhatsApp Fallback', desc: 'WhatsApp from wallet. Wallet empty? Notifications fall back to email automatically — no disruption, no surprise charges.', gradient: 'from-amber-500/10 to-orange-500/10' },
  { icon: Sparkles, title: 'AI Insights', desc: 'Smart analysis of overdue rates, workload imbalance, bottlenecks, and performer rankings.', gradient: 'from-rose-500/10 to-pink-500/10' },
  { icon: BarChart3, title: 'Team Analytics', desc: 'Completion rates, stacked workload charts, and performance dashboards by designation level.', gradient: 'from-cyan-500/10 to-teal-500/10' },
];

const plans = [
  {
    name: 'Team',
    price: '₹199',
    priceSuffix: '/user/mo',
    billingNote: 'Billed quarterly',
    description: 'For teams that need task accountability',
    highlighted: true,
    features: [
      'Unlimited users & tasks',
      'WhatsApp + email notifications',
      'Designation hierarchy',
      'Satisfaction confirmation',
      'AI insights & analytics',
      'Team workload dashboard',
      'Role-based access control',
      'Comments & attachments',
    ],
    cta: 'Start 14-Day Free Trial',
  },
  {
    name: 'Business',
    price: '₹299',
    priceSuffix: '/user/mo',
    billingNote: 'Billed monthly or quarterly',
    description: 'For organizations needing full control',
    highlighted: false,
    features: [
      'Everything in Team',
      'API access',
      'Custom roles & permissions',
      'Advanced reporting & exports',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
      'Priority support',
    ],
    cta: 'Contact Sales',
  },
];

const reviews = [
  { name: 'Rajesh K.', role: 'Branch Manager, NBFC', rating: 5, text: 'I finally know what my team is doing. Every task has a trail — who assigned it, when it was done, and whether the quality was accepted.' },
  { name: 'Meera S.', role: 'Operations Head, DSA Network', rating: 5, text: 'The WhatsApp notifications changed everything. My field agents actually respond now because they see it where they already work.' },
  { name: 'Anil P.', role: 'VP Operations, Trading Co.', rating: 5, text: 'We moved from Excel tracking to Work-Sync in one day. The designation hierarchy matched our org structure perfectly.' },
  { name: 'Priya D.', role: 'Team Lead, Logistics', rating: 5, text: 'The satisfaction confirmation feature is a game-changer. Earlier, tasks were marked "done" but the quality was never verified.' },
  { name: 'Vikram M.', role: 'CEO, Professional Services', rating: 5, text: 'Tried Asana and ClickUp — both built for American startups. Work-Sync understands Indian team dynamics.' },
  { name: 'Sonal R.', role: 'Regional Manager, Insurance', rating: 4, text: 'My agents across 3 states get WhatsApp alerts the moment a task is assigned. Response time dropped from 2 days to 4 hours.' },
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
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span>Work-Sync</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#problem" className="hover:text-foreground transition-colors">Why Work-Sync</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link
              to="/register"
              onClick={() => trackLeadEvent('header_get_started')}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero: The Pain ────────────── */}
      <section ref={heroRef} className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-400/6 rounded-full blur-[100px]" />
        </div>

        <div
          className="absolute inset-0 -z-10 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <FloatingParticles />

        <motion.div style={{ y: heroY }} className="mx-auto max-w-4xl text-center px-6 py-28 lg:py-40">
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
            Part of the In-Sync family
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight"
          >
            You gave the task.{' '}
            <span className="bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
              Do you know if it's done?
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Hierarchical task accountability with WhatsApp + email alerts at every step
            — built for how Indian teams actually work.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/register"
              onClick={() => trackLeadEvent('hero_start_free')}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all hover:scale-105"
            >
              Start Free — No Card Needed
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              onClick={() => trackLeadEvent('hero_see_how_it_works')}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border font-medium hover:bg-muted transition-all hover:scale-105"
            >
              See How It Works
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-14 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground"
          >
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-emerald-500" />
              WhatsApp alerts
            </span>
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-500" />
              Email notifications
            </span>
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Designation hierarchy
            </span>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Social Proof: Trusted By ──── */}
      <section className="relative border-t border-border/50 bg-muted/30 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-6">
          <AnimatedSection className="text-center mb-10">
            <motion.p variants={fadeUp} className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Trusted by 100+ businesses across India
            </motion.p>
          </AnimatedSection>
        </div>
        {/* Marquee Row 1 */}
        <div className="overflow-hidden">
          <div className="flex animate-marquee gap-6 py-2">
            {[...clientLogos.slice(0, 11), ...clientLogos.slice(0, 11)].map((logo, i) => (
              <div
                key={`r1-${i}`}
                className="flex h-14 w-32 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-background/80 px-4 py-2 grayscale opacity-50 transition-all duration-300 hover:border-border hover:opacity-100 hover:grayscale-0 hover:shadow-md"
              >
                <img src={logo.src} alt={logo.alt} className="max-h-8 max-w-full object-contain" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
        {/* Marquee Row 2 (reverse) */}
        <div className="overflow-hidden mt-4">
          <div className="flex animate-marquee-reverse gap-6 py-2">
            {[...clientLogos.slice(11), ...clientLogos.slice(11)].map((logo, i) => (
              <div
                key={`r2-${i}`}
                className="flex h-14 w-32 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-background/80 px-4 py-2 grayscale opacity-50 transition-all duration-300 hover:border-border hover:opacity-100 hover:grayscale-0 hover:shadow-md"
              >
                <img src={logo.src} alt={logo.alt} className="max-h-8 max-w-full object-contain" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Problem ───────────────── */}
      <section id="problem" className="relative border-t border-border/50 py-24 sm:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-20">
            <motion.div
              variants={fadeUp}
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-1.5 text-sm font-medium text-red-600"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              The Problem
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-5xl font-bold tracking-tight">
              Tasks given.{' '}
              <span className="text-red-500">Tasks forgotten.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
              In most Indian teams, task assignment happens over calls, WhatsApp, or verbal instructions.
              There's no system, no tracking, and no accountability.
            </motion.p>
          </AnimatedSection>

          <AnimatedSection className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {painPoints.map((point) => (
              <motion.div
                key={point.title}
                variants={fadeUp}
                className="rounded-2xl border border-red-200/50 bg-red-50/30 p-7"
              >
                <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center mb-5">
                  <point.icon className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{point.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{point.desc}</p>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* ── How Work-Sync Works ────────── */}
      <section id="how-it-works" className="relative border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <AnimatedSection className="mx-auto max-w-2xl text-center">
            <motion.div
              variants={fadeUp}
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
            >
              <Zap className="h-3.5 w-3.5" />
              How Work-Sync Works
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight sm:text-5xl">
              Assign → Notify → Update →{' '}
              <span className="text-primary">Confirm</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-5 text-lg text-muted-foreground">
              Every task gets tracked from assignment to completion with automatic alerts
            </motion.p>
          </AnimatedSection>

          <AnimatedSection className="relative mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="pointer-events-none absolute top-14 left-[12%] right-[12%] hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block" />

            {howItWorks.map((step) => (
              <motion.div key={step.title} variants={fadeUp} className="relative text-center">
                <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/20" />
                  <div className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25">
                    {step.step}
                  </div>
                  <step.icon className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-[240px] text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* ── Features ──────────────────── */}
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
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-5xl font-bold tracking-tight">
              Built for{' '}
              <span className="text-primary">Indian teams</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto">
              WhatsApp-first notifications, designation hierarchies, and the accountability your team needs.
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

      {/* ── Stats ─────────────────────── */}
      <section className="border-t border-border/50 bg-muted/30 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <AnimatedCounter target={5000} label="Tasks Tracked" />
              <AnimatedCounter target={200} label="Teams Active" />
              <AnimatedCounter target={99} label="Uptime %" />
              <AnimatedCounter target={50} label="Cities" />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Pricing ────────────────────── */}
      <section id="pricing" className="border-t border-border/50">
        <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6 sm:py-32">
          <AnimatedSection className="text-center">
            <motion.div
              variants={fadeUp}
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
            >
              <Crown className="h-3.5 w-3.5" />
              Pricing
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-5xl font-bold tracking-tight">
              Simple pricing.{' '}
              <span className="text-primary">14-day free trial.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto">
              No credit card required. All features included. Cancel anytime.
            </motion.p>
          </AnimatedSection>

          <AnimatedSection className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {plans.map((plan) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`relative rounded-3xl p-8 ${
                  plan.highlighted
                    ? 'border-2 border-primary/30 bg-card shadow-xl shadow-primary/5'
                    : 'border bg-card'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-1.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25">
                      <Sparkles className="h-3.5 w-3.5" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className={`${plan.highlighted ? 'pt-4' : ''}`}>
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>

                  <div className="mt-6 mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                      {plan.priceSuffix && (
                        <span className="text-muted-foreground text-lg">{plan.priceSuffix}</span>
                      )}
                    </div>
                    {plan.billingNote && (
                      <p className="text-xs text-muted-foreground mt-1">{plan.billingNote}</p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-3 text-sm">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        {feat}
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/register"
                    onClick={() => trackLeadEvent(`pricing_${plan.name.toLowerCase()}_cta`)}
                    className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] ${
                      plan.highlighted
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90'
                        : 'border hover:bg-muted'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatedSection>

          {/* WhatsApp Wallet Callout */}
          <AnimatedSection className="mt-10 max-w-3xl mx-auto">
            <motion.div
              variants={fadeUp}
              className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 flex-shrink-0">
                <Phone className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm">WhatsApp Notifications — Pay-per-use</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  WhatsApp alerts billed at <span className="font-semibold text-emerald-700">₹0.20/message</span> from your wallet (min recharge ₹500).
                  Wallet empty? Notifications fall back to email automatically — no disruption, no surprise charges.
                </p>
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Target Verticals ───────────── */}
      <section className="border-t border-border/50 bg-muted/30 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <AnimatedSection>
            <motion.p variants={fadeUp} className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
              Built for teams in
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-3">
              {['NBFCs', 'DSA Networks', 'Trading Companies', 'Logistics Firms', 'Professional Services', 'Insurance', 'Real Estate', 'EdTech'].map((v) => (
                <span key={v} className="px-4 py-2 rounded-full border bg-background text-sm font-medium hover:border-primary/30 hover:bg-primary/5 transition-colors">
                  {v}
                </span>
              ))}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Testimonial ───────────────── */}
      <section className="border-t border-border/50 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <motion.div variants={fadeUp}>
              <div className="text-4xl mb-6">"</div>
              <blockquote className="text-xl sm:text-2xl font-medium leading-relaxed text-foreground">
                I finally know what my team is doing. Every task has a trail — who assigned it, when it was done, and whether the quality was accepted.
              </blockquote>
              <div className="mt-8">
                <p className="font-semibold">Operations Head</p>
                <p className="text-sm text-muted-foreground">NBFC with 50+ field agents across 3 states</p>
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Reviews ──────────────────────── */}
      <section className="border-t border-border/50 bg-muted/30 py-24 sm:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <motion.div
              variants={fadeUp}
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-600"
            >
              <Star className="h-3.5 w-3.5 fill-amber-500" />
              Reviews
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-5xl font-bold tracking-tight">
              What our users{' '}
              <span className="text-primary">say</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-3 flex items-center justify-center gap-2 text-muted-foreground">
              <span className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </span>
              4.8 out of 5 from 127+ reviews
            </motion.p>
          </AnimatedSection>

          <AnimatedSection className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <motion.div
                key={review.name}
                variants={fadeUp}
                className="rounded-2xl border bg-card p-7"
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
                    />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground mb-5">"{review.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{review.name}</p>
                    <p className="text-xs text-muted-foreground">{review.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
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
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/5 rounded-full blur-3xl" />

              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">Stop losing tasks in WhatsApp groups.</h2>
                <p className="text-white/80 mb-10 max-w-md mx-auto text-lg">
                  Give your team accountability that actually works. 14-day free trial, no card needed.
                </p>
                <Link
                  to="/register"
                  onClick={() => trackLeadEvent('cta_get_started_free')}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-purple-700 font-semibold hover:bg-white/90 transition-all hover:scale-105 shadow-lg"
                >
                  Get Started Free
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
            <div className="h-5 w-5 rounded bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Zap className="h-3 w-3 text-white" />
            </div>
            Work-Sync
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} In-Sync Solutions. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

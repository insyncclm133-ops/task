import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, LayoutDashboard, ListTodo, Users, Briefcase, Shield,
  ArrowRight, Play, Pause, RotateCcw, CheckCircle, AlertTriangle,
  Clock, Flag, MessageSquare, User, Calendar, TrendingUp,
  Eye, Edit, Tag, Sparkles, Search, Plus, FileText, Wallet,
  IndianRupee, Receipt, CreditCard,
} from 'lucide-react';

/* ── Timing ───────────────────────────────────────────── */

const SCENES = [
  { id: 'intro', label: 'Intro', duration: 5000 },
  { id: 'dashboard', label: 'Dashboard', duration: 10000 },
  { id: 'tasks', label: 'Tasks', duration: 10000 },
  { id: 'taskDetail', label: 'Detail', duration: 10000 },
  { id: 'comments', label: 'Comments', duration: 8000 },
  { id: 'users', label: 'Users', duration: 8000 },
  { id: 'designations', label: 'Roles', duration: 8000 },
  { id: 'access', label: 'Access', duration: 8000 },
  { id: 'billing', label: 'Billing', duration: 10000 },
  { id: 'outro', label: 'Summary', duration: 5000 },
] as const;

const TOTAL = SCENES.reduce((s, sc) => s + sc.duration, 0);
/* ── Helpers ──────────────────────────────────────────── */

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.5 },
};

const slideUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay } },
});

const slideRight = (delay = 0) => ({
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5, delay } },
});

/* ── Mock Sidebar ─────────────────────────────────────── */

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: ListTodo, label: 'Tasks' },
  { icon: Users, label: 'Users' },
  { icon: Briefcase, label: 'Designations' },
  { icon: Shield, label: 'Access' },
  { icon: Wallet, label: 'Billing' },
];

function MockSidebar({ active }: { active: string }) {
  return (
    <motion.div
      {...slideRight()}
      className="flex w-52 shrink-0 flex-col border-r border-border/60 bg-[hsl(220,20%,10%)]"
    >
      <div className="flex h-14 items-center gap-2 border-b border-white/10 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Settings className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-bold tracking-tight text-white">TaskManager</span>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-3">
        {navItems.map((item) => {
          const isActive = item.label === active;
          return (
            <div
              key={item.label}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                isActive ? 'bg-primary/15 text-primary' : 'text-white/50'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-4 py-3">
        <p className="truncate text-[10px] text-white/40">admin@company.com</p>
      </div>
    </motion.div>
  );
}

/* ── Animated Value ───────────────────────────────────── */

function AnimatedValue({ value, delay }: { value: string; delay: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay * 1000);
    return () => clearTimeout(t);
  }, [delay]);
  return <p className="mt-1 text-2xl font-bold text-foreground">{show ? value : '—'}</p>;
}

/* ── KPI Card ─────────────────────────────────────────── */

function KpiCard({
  label, value, color, icon: Icon, delay,
}: {
  label: string; value: string; color: string; icon: React.ElementType; delay: number;
}) {
  return (
    <motion.div {...slideUp(delay)} className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${color} p-4 text-white`}>
      <div className="relative z-10">
        <AnimatedValue value={value} delay={delay + 0.3} />
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/80">{label}</p>
      </div>
      <Icon className="absolute bottom-2 right-2 h-10 w-10 opacity-[0.07]" strokeWidth={1.5} />
    </motion.div>
  );
}

/* ── Mini Bar Chart ───────────────────────────────────── */

function MiniBarChart() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data = [65, 42, 88, 55, 95, 30, 70];
  const max = 100;
  return (
    <motion.div {...slideUp(0.6)} className="overflow-hidden rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">Tasks Created vs Completed</p>
        <div className="flex gap-3 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-violet-500" /> Created</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-400" /> Completed</span>
        </div>
      </div>
      <div className="flex items-end gap-2" style={{ height: 80 }}>
        {data.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-px">
            <div className="flex w-full items-end gap-px" style={{ height: 70 }}>
              <motion.div
                className="flex-1 rounded-t bg-violet-500"
                initial={{ height: 0 }}
                animate={{ height: `${(d / max) * 100}%` }}
                transition={{ duration: 0.8, delay: 1.0 + i * 0.1, ease: 'easeOut' }}
              />
              <motion.div
                className="flex-1 rounded-t bg-purple-400"
                initial={{ height: 0 }}
                animate={{ height: `${((d * 0.7) / max) * 100}%` }}
                transition={{ duration: 0.8, delay: 1.1 + i * 0.1, ease: 'easeOut' }}
              />
            </div>
            <span className="mt-1 text-[9px] text-muted-foreground">{days[i]}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Scene: Intro ─────────────────────────────────────── */

function SceneIntro() {
  return (
    <motion.div {...fade} className="flex h-full flex-col items-center justify-center bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/4 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 h-[300px] w-[300px] rounded-full bg-violet-500/8 blur-[100px]" />
      </div>

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary shadow-2xl shadow-primary/30"
      >
        <Settings className="h-12 w-12 text-primary-foreground" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="relative text-5xl font-extrabold tracking-tight text-foreground"
      >
        TaskManager
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="relative mt-3 text-lg text-muted-foreground"
      >
        Task Management with Precision
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="relative mt-8 flex items-center gap-4"
      >
        {[
          { icon: CheckCircle, label: 'Task Tracking' },
          { icon: Users, label: 'Team Management' },
          { icon: Shield, label: 'Role-Based Access' },
          { icon: TrendingUp, label: 'Analytics' },
        ].map((p, i) => (
          <motion.div
            key={p.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 + i * 0.15 }}
            className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary"
          >
            <p.icon className="h-3 w-3" /> {p.label}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ── Scene: Dashboard ─────────────────────────────────── */

function SceneDashboard() {
  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Dashboard" />
      <div className="flex-1 overflow-hidden p-5">
        <motion.div {...slideUp(0)} className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Task <span className="bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">Command Center</span>
            </h2>
            <p className="text-xs text-muted-foreground">Monitor and manage your team's progress</p>
          </div>
        </motion.div>

        <div className="mt-4 grid grid-cols-4 gap-3">
          <KpiCard label="My Open Tasks" value="12" color="from-sky-500 to-blue-600" icon={ListTodo} delay={0.15} />
          <KpiCard label="Overdue Tasks" value="3" color="from-rose-500 to-pink-600" icon={AlertTriangle} delay={0.25} />
          <KpiCard label="Completed This Week" value="28" color="from-emerald-500 to-green-600" icon={CheckCircle} delay={0.35} />
          <KpiCard label="Total Tasks" value="156" color="from-violet-500 to-purple-600" icon={Clock} delay={0.45} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <MiniBarChart />
          <motion.div {...slideUp(0.8)} className="overflow-hidden rounded-xl border border-border/60 bg-card p-4">
            <p className="mb-3 text-xs font-semibold text-foreground flex items-center gap-2">
              <Users className="h-3.5 w-3.5" /> Team Workload
            </p>
            <div className="space-y-2">
              {[
                { name: 'Sarah Johnson', tasks: 8, percent: 80 },
                { name: 'Mike Chen', tasks: 6, percent: 60 },
                { name: 'Lisa Park', tasks: 5, percent: 50 },
                { name: 'James Wilson', tasks: 3, percent: 30 },
              ].map((w, i) => (
                <motion.div key={w.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: 1.0 + i * 0.15 } }}
                  className="flex items-center gap-3"
                >
                  <span className="text-[11px] text-muted-foreground w-28 truncate">{w.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${w.percent}%` }}
                      transition={{ duration: 0.8, delay: 1.2 + i * 0.15 }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-foreground w-4 text-right">{w.tasks}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Scene: Tasks ─────────────────────────────────────── */

function SceneTasks() {
  const tasks = [
    { id: 'TSK-001', name: 'Design system overhaul', assignee: 'Sarah J.', priority: 'urgent', status: 'in_progress', due: 'Mar 28' },
    { id: 'TSK-002', name: 'API integration testing', assignee: 'Mike C.', priority: 'high', status: 'pending', due: 'Mar 30' },
    { id: 'TSK-003', name: 'Client onboarding docs', assignee: 'Lisa P.', priority: 'medium', status: 'completed', due: 'Mar 25' },
    { id: 'TSK-004', name: 'Database migration plan', assignee: 'James W.', priority: 'high', status: 'in_progress', due: 'Apr 01' },
    { id: 'TSK-005', name: 'Q1 performance review', assignee: 'Sarah J.', priority: 'low', status: 'pending', due: 'Apr 05' },
  ];

  const priorityColors: Record<string, string> = { urgent: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-blue-500', low: 'bg-gray-400' };
  const statusColors: Record<string, string> = { pending: 'text-amber-600 bg-amber-50', in_progress: 'text-blue-600 bg-blue-50', completed: 'text-green-600 bg-green-50' };
  const statusLabels: Record<string, string> = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed' };

  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Tasks" />
      <div className="flex-1 overflow-hidden p-5">
        <motion.div {...slideUp(0)} className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Tasks</h2>
            <p className="text-xs text-muted-foreground">156 total tasks</p>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
            <Plus className="h-3.5 w-3.5" /> New Task
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.div {...slideUp(0.2)} className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-[11px] text-muted-foreground">
            <Search className="h-3 w-3" /> Search tasks...
          </div>
          <div className="rounded-lg border border-border/60 bg-card px-3 py-1.5 text-[11px] text-muted-foreground">Status: All</div>
          <div className="rounded-lg border border-border/60 bg-card px-3 py-1.5 text-[11px] text-muted-foreground">Priority: All</div>
        </motion.div>

        {/* Task list */}
        <div className="space-y-2">
          {tasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.4 + i * 0.12 } }}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 hover:border-primary/30 transition-colors"
            >
              <div className={`h-2 w-2 rounded-full ${priorityColors[task.priority]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground">{task.id}</span>
                  <span className="text-xs font-medium text-foreground">{task.name}</span>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground">{task.assignee}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[task.status]}`}>
                {statusLabels[task.status]}
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {task.due}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Scene: Task Detail ───────────────────────────────── */

function SceneTaskDetail() {
  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Tasks" />
      <div className="flex-1 overflow-hidden p-5">
        <motion.div {...slideUp(0)} className="mb-4">
          <p className="text-[10px] text-muted-foreground mb-2">← Back to Tasks</p>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">TSK-001</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-blue-600 bg-blue-50">In Progress</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-red-600 bg-red-50">Urgent</span>
          </div>
          <h2 className="text-lg font-bold text-foreground">Design system overhaul</h2>
        </motion.div>

        <div className="grid grid-cols-3 gap-4">
          {/* Details */}
          <motion.div {...slideUp(0.2)} className="col-span-2 rounded-xl border border-border/60 bg-card p-4">
            <p className="text-xs text-muted-foreground mb-3">Redesign the entire component library with new design tokens, accessibility improvements, and dark mode support.</p>
            <div className="grid grid-cols-3 gap-3 text-[11px]">
              <div>
                <span className="text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Assigned To</span>
                <p className="font-medium mt-0.5">Sarah Johnson</p>
              </div>
              <div>
                <span className="text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Created By</span>
                <p className="font-medium mt-0.5">Admin User</p>
              </div>
              <div>
                <span className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Due Date</span>
                <p className="font-medium mt-0.5">Mar 28, 2026</p>
              </div>
            </div>
            {/* Progress */}
            <motion.div {...slideUp(0.6)} className="mt-4">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">65%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: '65%' }} transition={{ duration: 1, delay: 0.8 }} />
              </div>
            </motion.div>
          </motion.div>

          {/* Actions + Tags */}
          <motion.div {...slideUp(0.4)} className="space-y-3">
            <div className="rounded-xl border border-border/60 bg-card p-3">
              <p className="text-[10px] font-semibold mb-2 text-foreground">Actions</p>
              <div className="space-y-1.5">
                {[
                  { icon: CheckCircle, label: 'Complete', color: 'text-green-600' },
                  { icon: Edit, label: 'Edit', color: 'text-muted-foreground' },
                  { icon: Eye, label: 'View History', color: 'text-muted-foreground' },
                ].map((a, i) => (
                  <motion.div key={a.label}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { delay: 0.6 + i * 0.15 } }}
                    className={`flex items-center gap-2 text-[11px] font-medium ${a.color} rounded-lg px-2 py-1.5 hover:bg-muted/50`}
                  >
                    <a.icon className="h-3.5 w-3.5" /> {a.label}
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-3">
              <p className="text-[10px] font-semibold mb-2 text-foreground flex items-center gap-1"><Tag className="h-3 w-3" /> Tags</p>
              <div className="flex flex-wrap gap-1">
                {['design', 'ui', 'priority'].map((tag, i) => (
                  <motion.span key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1, transition: { delay: 0.8 + i * 0.1 } }}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                  >{tag}</motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Scene: Comments ──────────────────────────────────── */

function SceneComments() {
  const comments = [
    { name: 'Sarah Johnson', time: '2 hours ago', text: 'Updated the color tokens. Ready for review.' },
    { name: 'Mike Chen', time: '1 hour ago', text: 'Looks great! The dark mode variants are solid.' },
    { name: 'Admin User', time: '30 min ago', text: 'Approved. Please also update the button component.' },
  ];

  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Tasks" />
      <div className="flex-1 overflow-hidden p-5">
        <motion.div {...slideUp(0)} className="mb-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> Comments & Attachments
          </h2>
          <p className="text-xs text-muted-foreground">TSK-001 — Design system overhaul</p>
        </motion.div>

        <div className="grid grid-cols-5 gap-4">
          {/* Comments */}
          <div className="col-span-3 space-y-3">
            {comments.map((c, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0, transition: { delay: 0.3 + i * 0.3 } }}
                className="rounded-xl border border-border/60 bg-card p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{c.name}</span>
                  <span className="text-[10px] text-muted-foreground">{c.time}</span>
                </div>
                <p className="text-[11px] text-foreground/80">{c.text}</p>
              </motion.div>
            ))}

            {/* Typing indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 1.5 } }}
              className="rounded-xl border border-primary/20 bg-primary/5 p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 flex-1 text-[11px] text-muted-foreground">
                  Add a comment...
                </div>
                <div className="rounded-lg bg-primary px-3 py-1.5 text-[10px] font-medium text-primary-foreground">Send</div>
              </div>
            </motion.div>
          </div>

          {/* Attachments */}
          <motion.div {...slideUp(0.8)} className="col-span-2">
            <div className="rounded-xl border border-border/60 bg-card p-3">
              <p className="text-[10px] font-semibold mb-3 text-foreground flex items-center gap-1">
                <FileText className="h-3 w-3" /> Attachments (3)
              </p>
              <div className="space-y-2">
                {[
                  { name: 'design-tokens.json', size: '24 KB' },
                  { name: 'mockup-v2.figma', size: '1.2 MB' },
                  { name: 'review-notes.pdf', size: '156 KB' },
                ].map((f, i) => (
                  <motion.div key={f.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { delay: 1.0 + i * 0.2 } }}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                  >
                    <span className="text-[11px] text-foreground">{f.name}</span>
                    <span className="text-[10px] text-muted-foreground">{f.size}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Scene: Users ─────────────────────────────────────── */

function SceneUsers() {
  const users = [
    { name: 'Sarah Johnson', email: 'sarah@company.com', role: 'Admin', status: true },
    { name: 'Mike Chen', email: 'mike@company.com', role: 'Manager', status: true },
    { name: 'Lisa Park', email: 'lisa@company.com', role: 'Sales Agent', status: true },
    { name: 'James Wilson', email: 'james@company.com', role: 'Sales Agent', status: false },
  ];

  const roleBadge: Record<string, string> = {
    Admin: 'text-purple-700 bg-purple-50 border-purple-200',
    Manager: 'text-blue-700 bg-blue-50 border-blue-200',
    'Sales Agent': 'text-gray-700 bg-gray-50 border-gray-200',
  };

  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Users" />
      <div className="flex-1 overflow-hidden p-5">
        <motion.div {...slideUp(0)} className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5" /> User Management
          </h2>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
            <Plus className="h-3.5 w-3.5" /> Add User
          </motion.div>
        </motion.div>

        <motion.div {...slideUp(0.2)} className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Role</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <motion.tr key={u.email}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.4 + i * 0.15 } }}
                  className="border-b last:border-b-0"
                >
                  <td className="px-4 py-2.5 font-medium">{u.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${roleBadge[u.role]}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${u.status ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-700 border border-gray-200'}`}>
                      {u.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">
                    <Edit className="h-3.5 w-3.5 inline" />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ── Scene: Designations ──────────────────────────────── */

function SceneDesignations() {
  const designations = [
    { name: 'Senior Manager', role: 'Admin', reports: null, employees: 2 },
    { name: 'Team Lead', role: 'Manager', reports: 'Senior Manager', employees: 3 },
    { name: 'Sales Executive', role: 'Sales Agent', reports: 'Team Lead', employees: 8 },
    { name: 'Support Agent', role: 'Sales Agent', reports: 'Team Lead', employees: 5 },
  ];

  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Designations" />
      <div className="flex-1 overflow-hidden p-5">
        <motion.div {...slideUp(0)} className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="h-5 w-5" /> Designations
          </h2>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
            <Plus className="h-3.5 w-3.5" /> Add Designation
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          {designations.map((d, i) => (
            <motion.div key={d.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.3 + i * 0.15 } }}
              className="rounded-xl border border-border/60 bg-card p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground">{d.name}</h3>
                <Edit className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium border text-purple-700 bg-purple-50 border-purple-200">{d.role}</span>
              {d.reports && (
                <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Reports to: {d.reports}
                </p>
              )}
              <div className="mt-2 pt-2 border-t border-border/40">
                <span className="text-[10px] text-muted-foreground">{d.employees} employees</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Scene: Access Management ─────────────────────────── */

function SceneAccess() {
  const features = ['Task Management', 'User Management', 'Reports', 'Designations'];

  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Access" />
      <div className="flex-1 overflow-hidden p-5">
        <motion.div {...slideUp(0)} className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5" /> Access Management
          </h2>
        </motion.div>

        <motion.div {...slideUp(0.2)} className="mb-4">
          <label className="text-[11px] font-medium text-muted-foreground">Select Designation</label>
          <div className="mt-1 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs text-foreground w-48">
            Team Lead
          </div>
        </motion.div>

        <motion.div {...slideUp(0.4)} className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Feature</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">View</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Create</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Edit</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Delete</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => (
                <motion.tr key={f}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.6 + i * 0.15 } }}
                  className="border-b last:border-b-0"
                >
                  <td className="px-4 py-2.5 font-medium">{f}</td>
                  {['view', 'create', 'edit', 'delete'].map((perm, j) => (
                    <td key={perm} className="text-center px-4 py-2.5">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, transition: { delay: 0.8 + i * 0.1 + j * 0.05 } }}
                        className={`mx-auto h-4 w-4 rounded border ${
                          i < 2 || j === 0 ? 'bg-primary border-primary' : 'border-border'
                        } flex items-center justify-center`}
                      >
                        {(i < 2 || j === 0) && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                      </motion.div>
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 1.5 } }}
          className="mt-4 flex justify-end"
        >
          <div className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Save Permissions
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ── Scene: Billing ───────────────────────────────────── */

function SceneBilling() {
  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Billing" />
      <div className="flex-1 overflow-hidden p-5">
        <motion.div {...slideUp(0)} className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Wallet className="h-5 w-5" /> Billing & Pricing
          </h2>
        </motion.div>

        <div className="grid grid-cols-5 gap-4">
          {/* Wallet Card */}
          <motion.div {...slideUp(0.2)} className="col-span-2 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Wallet Balance</p>
                <AnimatedValue value="₹100.00" delay={0.5} />
              </div>
            </div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.8 } }}
              className="flex items-center gap-1 text-[10px] text-primary font-medium">
              <Sparkles className="h-3 w-3" /> Welcome bonus — ₹100 free credits
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 1.0 } }}
              className="mt-3 flex items-center gap-2">
              <div className="rounded-lg bg-primary px-3 py-1.5 text-[10px] font-medium text-primary-foreground flex items-center gap-1">
                <CreditCard className="h-3 w-3" /> Add Funds
              </div>
            </motion.div>
          </motion.div>

          {/* Pricing Card */}
          <motion.div {...slideUp(0.4)} className="col-span-3 rounded-xl border border-border/60 bg-card p-5">
            <div className="text-center mb-4">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold text-primary mb-2">
                RECOMMENDED
              </motion.div>
              <p className="text-sm font-bold text-foreground">TaskManager Pro</p>
              <p className="text-[10px] text-muted-foreground">Everything your team needs</p>
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.7 } }} className="text-center mb-4">
              <span className="text-3xl font-extrabold text-foreground">₹199</span>
              <span className="text-xs text-muted-foreground"> /user/month</span>
            </motion.div>

            <div className="space-y-1.5">
              {[
                'Unlimited tasks & subtasks',
                'Team workload analytics',
                'Role-based access control',
                'Comments & file attachments',
                'Priority & deadline tracking',
                'Designation hierarchy',
                'Email notifications',
                'Export reports',
              ].map((feat, i) => (
                <motion.div key={feat}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: 0.9 + i * 0.08 } }}
                  className="flex items-center gap-2 text-[11px] text-foreground"
                >
                  <CheckCircle className="h-3 w-3 text-primary flex-shrink-0" />
                  {feat}
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 1.8 } }} className="mt-4 text-center">
              <div className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground inline-flex items-center gap-1">
                Start Free Trial <ArrowRight className="h-3 w-3" />
              </div>
              <p className="text-[9px] text-muted-foreground mt-1">No credit card required · Cancel anytime</p>
            </motion.div>
          </motion.div>
        </div>

        {/* Recent Transactions */}
        <motion.div {...slideUp(0.8)} className="mt-4 rounded-xl border border-border/60 bg-card p-4">
          <p className="mb-3 text-xs font-semibold text-foreground flex items-center gap-1">
            <Receipt className="h-3.5 w-3.5" /> Recent Transactions
          </p>
          <div className="space-y-1.5">
            {[
              { desc: 'Welcome bonus — free credits', amount: '+₹100.00', type: 'credit', time: 'Just now' },
              { desc: 'Pro Plan — 5 users × ₹199', amount: '-₹995.00', type: 'debit', time: 'Pending' },
            ].map((tx, i) => (
              <motion.div key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 1.2 + i * 0.2 } }}
                className="flex items-center justify-between rounded-lg bg-background px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <div className={`h-1.5 w-1.5 rounded-full ${tx.type === 'credit' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                  <span className="text-[11px] text-foreground">{tx.desc}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground">{tx.time}</span>
                  <span className={`text-xs font-semibold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>{tx.amount}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ── Scene: Outro ─────────────────────────────────────── */

function SceneOutro() {
  return (
    <motion.div {...fade} className="flex h-full flex-col items-center justify-center bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/3 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative text-4xl font-extrabold tracking-tight text-foreground"
      >
        Manage tasks with precision.
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative mt-8 grid grid-cols-4 gap-3"
      >
        {[
          { icon: ListTodo, title: 'Task Tracking', desc: 'Create, assign, and track tasks with priorities and deadlines' },
          { icon: Users, title: 'Team Management', desc: 'Manage users, roles, and team workload distribution' },
          { icon: Shield, title: 'Access Control', desc: 'Role-based permissions with designation-level granularity' },
          { icon: TrendingUp, title: 'Analytics', desc: 'Real-time dashboards with status, priority, and trend insights' },
          { icon: MessageSquare, title: 'Collaboration', desc: 'Comments, attachments, and activity tracking per task' },
          { icon: Briefcase, title: 'Designations', desc: 'Define org hierarchy with reporting relationships' },
          { icon: Flag, title: 'Priority System', desc: 'Low to urgent priority with visual indicators' },
          { icon: CheckCircle, title: 'Completion Flow', desc: 'Start, complete, close, restart — full lifecycle tracking' },
        ].map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + i * 0.1 }}
            className="relative rounded-xl border border-border/60 bg-card p-4 text-center"
          >
            <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <p.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground">{p.title}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{p.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8 }}
        className="relative mt-8"
      >
        <Link to="/auth" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-medium shadow-xl shadow-primary/25 hover:bg-primary/90 transition-colors">
          Get Started Free <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </motion.div>
  );
}

/* ── Main Demo Page ───────────────────────────────────── */

export default function Demo() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  const currentScene = SCENES[sceneIndex];

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      if (sceneIndex < SCENES.length - 1) {
        setSceneIndex((i) => i + 1);
      } else {
        setPlaying(false);
      }
    }, currentScene.duration);
    return () => clearTimeout(timer);
  }, [sceneIndex, playing, currentScene.duration]);

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => { setElapsed((e) => e + 100); }, 100);
    return () => clearInterval(interval);
  }, [playing]);

  useEffect(() => { setElapsed(0); }, [sceneIndex]);

  const totalElapsed = SCENES.slice(0, sceneIndex).reduce((s, sc) => s + sc.duration, 0) + elapsed;
  const progress = Math.min((totalElapsed / TOTAL) * 100, 100);

  const restart = useCallback(() => {
    setSceneIndex(0);
    setElapsed(0);
    setPlaying(true);
  }, []);

  const renderScene = () => {
    switch (currentScene.id) {
      case 'intro': return <SceneIntro />;
      case 'dashboard': return <SceneDashboard />;
      case 'tasks': return <SceneTasks />;
      case 'taskDetail': return <SceneTaskDetail />;
      case 'comments': return <SceneComments />;
      case 'users': return <SceneUsers />;
      case 'designations': return <SceneDesignations />;
      case 'access': return <SceneAccess />;
      case 'billing': return <SceneBilling />;
      case 'outro': return <SceneOutro />;
    }
  };

  return (
    <div className="flex h-screen flex-col bg-black">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-black px-4 py-2">
        <Link to="/" className="flex items-center gap-2 text-sm text-white/60 hover:text-white/80">
          <Settings className="h-4 w-4" />
          <span className="font-medium">TaskManager Demo</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="mr-4 hidden items-center gap-1 sm:flex">
            {SCENES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { setSceneIndex(i); setElapsed(0); setPlaying(true); }}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                  i === sceneIndex
                    ? 'bg-primary text-primary-foreground'
                    : i < sceneIndex
                    ? 'bg-white/20 text-white/60'
                    : 'bg-white/5 text-white/30'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setPlaying(!playing)}
            className="rounded-lg bg-white/10 p-1.5 text-white/60 hover:bg-white/20 hover:text-white"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button onClick={restart} className="rounded-lg bg-white/10 p-1.5 text-white/60 hover:bg-white/20 hover:text-white">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5">
        <motion.div className="h-full bg-primary" style={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
      </div>

      {/* Scene viewport */}
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto h-full max-w-6xl">
          <AnimatePresence mode="wait">
            <motion.div key={currentScene.id} className="h-full">
              {renderScene()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

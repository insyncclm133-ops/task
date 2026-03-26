import { motion } from 'framer-motion';
import {
  Wallet, IndianRupee, CreditCard, CheckCircle,
  Receipt, Crown, Phone,
} from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const planFeatures = [
  'Unlimited tasks & subtasks',
  'WhatsApp + email notifications',
  'Satisfaction confirmation',
  'Designation hierarchy',
  'AI insights & analytics',
  'Team workload dashboard',
  'Role-based access control',
  'Comments & file attachments',
];

const transactions = [
  { desc: 'WhatsApp wallet recharge', amount: '+₹500.00', type: 'credit' as const, date: 'Mar 26, 2026' },
  { desc: 'Team Plan — 5 users × ₹199', amount: '-₹995.00', type: 'debit' as const, date: 'Pending' },
];

export function BillingPage() {
  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Wallet className="h-7 w-7 text-primary" />
          Billing &{' '}
          <span className="bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
            Subscription
          </span>
        </h1>
        <p className="text-muted-foreground mt-1">Manage your plan, WhatsApp wallet, and payment history</p>
      </motion.div>

      {/* Top row: WhatsApp Wallet + Current Plan */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* WhatsApp Wallet Card */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-7">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-4 mb-5">
              <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Phone className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">WhatsApp Wallet</p>
                <p className="text-4xl font-extrabold tracking-tight">₹500.00</p>
              </div>
            </div>

            <div className="text-sm text-muted-foreground mb-5">
              <span className="font-medium text-emerald-700">₹0.20/message</span> &middot; ~2,500 notifications remaining
            </div>

            <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
              When wallet is empty, notifications automatically fall back to email — no disruption.
            </p>

            <div className="flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-sm shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 transition-colors">
                <CreditCard className="h-4 w-4" />
                Recharge Wallet (min ₹500)
              </button>
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card text-foreground font-medium text-sm hover:bg-muted transition-colors">
                Auto-recharge Settings
              </button>
            </div>
          </div>
        </div>

        {/* Current Plan Card */}
        <div className="relative overflow-hidden rounded-2xl border bg-card p-7">
          <div className="absolute -top-4 right-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/25">
              <Crown className="h-3.5 w-3.5" />
              Active Plan
            </span>
          </div>

          <div className="pt-4">
            <h3 className="text-xl font-bold mb-1">Work-Sync Team</h3>
            <p className="text-sm text-muted-foreground mb-5">Full task accountability for your team</p>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tracking-tight">₹199</span>
                <span className="text-muted-foreground text-lg">/user/month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Billed quarterly</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {planFeatures.map((feat) => (
                <div key={feat} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  {feat}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Subscription Info Banner */}
      <motion.div variants={fadeUp} className="mb-8">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 flex-shrink-0">
            <IndianRupee className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm">Subscription + WhatsApp Wallet</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Your subscription covers all features including email notifications. WhatsApp notifications are billed separately
              from your wallet at ₹0.20 per message. Minimum recharge is ₹500. If your wallet runs dry, notifications
              automatically fall back to email — no disruption, no surprise charges.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Transaction History */}
      <motion.div variants={fadeUp} className="rounded-2xl border bg-card p-6">
        <h3 className="font-semibold text-sm mb-5 flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          Transaction History
        </h3>

        <div className="space-y-3">
          {transactions.map((tx, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl bg-muted/50 px-5 py-4 gap-2"
            >
              <div className="flex items-center gap-3">
                <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${tx.type === 'credit' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                <span className="text-sm font-medium">{tx.desc}</span>
              </div>
              <div className="flex items-center gap-4 sm:gap-6 pl-5 sm:pl-0">
                <span className="text-sm text-muted-foreground">{tx.date}</span>
                <span className={`text-sm font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {tx.amount}
                </span>
              </div>
            </div>
          ))}
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No transactions yet
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

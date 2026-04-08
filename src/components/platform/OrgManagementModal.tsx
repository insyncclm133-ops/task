import { useState } from 'react';
import { toast } from 'sonner';
import { Building2, Calendar, CreditCard, IndianRupee, Receipt } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogCloseButton,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { OrgRow } from '@/hooks/usePlatformDashboard';
import {
  useExtendTrial, useRecordPayment, useOrgPayments,
} from '@/hooks/useOrgManagement';

interface Props {
  org: OrgRow;
  open: boolean;
  onClose: () => void;
}

type Tab = 'trial' | 'payment';

const PLAN_LABELS: Record<string, string> = { trial: 'Trial', team: 'Team', business: 'Business' };

const planBadgeClass = (plan: string) => {
  if (plan === 'team') return 'bg-violet-100 text-violet-700';
  if (plan === 'business') return 'bg-emerald-100 text-emerald-700';
  return 'bg-amber-100 text-amber-700';
};

function formatDate(iso: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function OrgManagementModal({ org, open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('trial');

  // Trial extension state
  const [trialDays, setTrialDays] = useState('7');
  const extendTrial = useExtendTrial();

  // Payment state
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('upi');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [planTarget, setPlanTarget] = useState<'team' | 'business'>('team');
  const recordPayment = useRecordPayment();

  const { data: payments } = useOrgPayments(open ? org.id : null);

  const handleExtendTrial = async () => {
    const days = parseInt(trialDays, 10);
    if (isNaN(days) || days < 1) { toast.error('Enter a valid number of days'); return; }
    const base = org.trialEndsAt && org.trialDaysLeft > 0
      ? new Date(org.trialEndsAt)
      : new Date();
    base.setDate(base.getDate() + days);
    try {
      await extendTrial.mutateAsync({ orgId: org.id, newDate: base.toISOString() });
      toast.success(`Trial extended by ${days} day${days === 1 ? '' : 's'}`);
    } catch (e: unknown) {
      toast.error((e as Error).message ?? 'Failed to extend trial');
    }
  };

  const handleRecordPayment = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { toast.error('Enter a valid amount'); return; }
    try {
      await recordPayment.mutateAsync({ orgId: org.id, amount: amt, method, referenceNo, notes, planTarget });
      toast.success(`Payment recorded — plan upgraded to ${PLAN_LABELS[planTarget]}`);
      setAmount(''); setReferenceNo(''); setNotes('');
    } catch (e: unknown) {
      toast.error((e as Error).message ?? 'Failed to record payment');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogCloseButton onClick={onClose} />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {org.name}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${planBadgeClass(org.plan)}`}>
              {PLAN_LABELS[org.plan] ?? org.plan}
            </span>
            {org.plan === 'trial' && (
              <span className="text-xs text-muted-foreground">
                {org.trialDaysLeft > 0
                  ? `Trial ends ${formatDate(org.trialEndsAt)} (${org.trialDaysLeft}d left)`
                  : `Trial expired ${formatDate(org.trialEndsAt)}`}
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b mb-4">
          <button
            onClick={() => setTab('trial')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'trial' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Extend Trial</span>
          </button>
          <button
            onClick={() => setTab('payment')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'payment' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Record Payment</span>
          </button>
        </div>

        {tab === 'trial' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Extend this organization's trial period. Days are added from the current expiry date (or from today if already expired).
            </p>
            <div>
              <label className="text-xs font-medium mb-1 block">Days to extend</label>
              <div className="flex gap-2">
                {['3', '7', '14', '30'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setTrialDays(d)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      trialDays === d ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
                <Input
                  type="number"
                  min={1}
                  value={trialDays}
                  onChange={(e) => setTrialDays(e.target.value)}
                  className="w-20 h-8 text-xs"
                  placeholder="days"
                />
              </div>
            </div>
            <Button
              onClick={handleExtendTrial}
              disabled={extendTrial.isPending}
              className="w-full"
            >
              {extendTrial.isPending ? 'Extending…' : `Extend trial by ${trialDays} day${trialDays === '1' ? '' : 's'}`}
            </Button>
          </div>
        )}

        {tab === 'payment' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Recording a payment will immediately upgrade the organization's plan to the selected tier.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Amount (₹)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Payment method</label>
                <Select value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card</option>
                  <option value="cash">Cash</option>
                  <option value="manual">Manual / Other</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">Upgrade plan to</label>
              <div className="flex gap-2">
                {(['team', 'business'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlanTarget(p)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      planTarget === p
                        ? p === 'team' ? 'border-violet-400 bg-violet-50 text-violet-700' : 'border-emerald-400 bg-emerald-50 text-emerald-700'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {PLAN_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">Reference / transaction ID</label>
              <Input
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="UTR, transaction ID, etc."
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">Notes (optional)</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes"
              />
            </div>

            <Button
              onClick={handleRecordPayment}
              disabled={recordPayment.isPending || !amount}
              className="w-full"
            >
              {recordPayment.isPending ? 'Recording…' : `Record ₹${amount || '0'} & upgrade to ${PLAN_LABELS[planTarget]}`}
            </Button>

            {/* Payment history */}
            {payments && payments.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5" /> Payment history
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs">
                      <div>
                        <span className="font-medium">₹{Number(p.amount).toLocaleString('en-IN')}</span>
                        <span className="text-muted-foreground ml-1.5">· {p.method} · {PLAN_LABELS[p.plan_target] ?? p.plan_target}</span>
                        {p.reference_no && <span className="text-muted-foreground ml-1.5">· {p.reference_no}</span>}
                      </div>
                      <span className="text-muted-foreground">{formatDate(p.created_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

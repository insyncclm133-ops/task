import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export interface Payment {
  id: string;
  org_id: string;
  amount: number;
  currency: string;
  method: string;
  reference_no: string | null;
  notes: string | null;
  plan_target: string;
  recorded_by: string;
  created_at: string;
}

export function useOrgPayments(orgId: string | null) {
  return useQuery({
    queryKey: ['org-payments', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('org_id', orgId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Payment[];
    },
  });
}

export function useExtendTrial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orgId, newDate }: { orgId: string; newDate: string }) => {
      const { error } = await supabase
        .from('organizations')
        .update({ trial_ends_at: newDate })
        .eq('id', orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-dashboard'] });
    },
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: {
      orgId: string;
      amount: number;
      method: string;
      referenceNo: string;
      notes: string;
      planTarget: 'team' | 'business';
    }) => {
      const { error: payError } = await supabase.from('payments').insert({
        org_id: data.orgId,
        amount: data.amount,
        method: data.method,
        reference_no: data.referenceNo || null,
        notes: data.notes || null,
        plan_target: data.planTarget,
        recorded_by: user!.id,
      });
      if (payError) throw payError;

      const { error: planError } = await supabase
        .from('organizations')
        .update({ plan: data.planTarget })
        .eq('id', data.orgId);
      if (planError) throw planError;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['platform-dashboard'] });
      qc.invalidateQueries({ queryKey: ['org-payments', variables.orgId] });
    },
  });
}

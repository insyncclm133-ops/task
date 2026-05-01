import { useQuery } from '@tanstack/react-query';
import type { Profile } from '@/types/task';
import { supabase } from '@/lib/supabase';

export function useProfiles() {
  const { data: profiles = [], isLoading } = useQuery<Profile[]>({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) {
        throw error;
      }

      return data;
    },
  });

  return { profiles, isLoading };
}

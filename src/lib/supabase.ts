import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cjlkwdfsovatxigvbjvu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqbGt3ZGZzb3ZhdHhpZ3ZianZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjI0MzgsImV4cCI6MjA5MDAzODQzOH0.pLsdw53lL2ByhJBEnbz78vCwRYpouk7wrzKqa6u2Iy4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

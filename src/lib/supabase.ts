import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://seijjmcncrbekngurxxj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaWpqbWNuY3JiZWtuZ3VyeHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDAxODIsImV4cCI6MjA5MDAxNjE4Mn0.N9CPT713v2OUIiES5DIiL6WlDFh-tD3dGo1wZb0ecX4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

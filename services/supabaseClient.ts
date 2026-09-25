import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env ?? {};

// Publishable (client-safe) credentials. Row Level Security restricts every row to its owner.
const SUPABASE_URL: string = env.VITE_SUPABASE_URL || 'https://znkcorbcxjtwcnwhqvej.supabase.co';
const SUPABASE_KEY: string = env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_jnZuDala4olyo23tZpKS8g_Qh7t_1ie';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

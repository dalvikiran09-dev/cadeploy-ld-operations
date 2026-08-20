import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
export const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseAnonKey !== 'placeholder-key'
);

export const maskSupabaseUrl = (url: string) => {
  if (!url) return 'NOT_CONFIGURED';
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    const projectRef = host.split('.')[0] || '';
    if (projectRef.length > 6) {
      return `https://${projectRef.slice(0, 4)}***${projectRef.slice(-3)}.supabase.co (${projectRef})`;
    }
    return `https://${host} (${projectRef})`;
  } catch {
    return url.slice(0, 8) + '...';
  }
};

export const maskKey = (key: string) => {
  if (!key) return 'UNDEFINED / EMPTY';
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'cadeploy_supabase_auth_token'
    }
  }
);

export const getSupabase = (_user?: { id?: string; username?: string; role?: string } | null) => {
  return supabase;
};

export const getSupabaseClient = getSupabase;



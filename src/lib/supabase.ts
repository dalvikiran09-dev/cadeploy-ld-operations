import { createClient } from '@supabase/supabase-js';

const sanitizeEnv = (raw: string | undefined): string => {
  if (!raw) return '';
  let str = String(raw).trim();
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }
  return str;
};

const rawUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const rawAnon = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

export const supabaseUrl = sanitizeEnv(rawUrl).replace(/\/+$/, '');
export const supabaseAnonKey = sanitizeEnv(rawAnon);

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseAnonKey !== 'placeholder-key'
);

export const getSupabaseProjectRef = (url: string = supabaseUrl): string => {
  if (!url || url === 'https://placeholder.supabase.co') return 'zmchtexsimubpwyiihyl';
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    return host.split('.')[0] || 'zmchtexsimubpwyiihyl';
  } catch {
    return 'zmchtexsimubpwyiihyl';
  }
};

export const maskSupabaseUrl = (url: string = supabaseUrl) => {
  if (!url || url === 'https://placeholder.supabase.co') return 'NOT_CONFIGURED (zmchtexsimubpwyiihyl)';
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

export const maskKey = (key: string = supabaseAnonKey) => {
  if (!key || key === 'placeholder-key') return 'UNDEFINED / EMPTY';
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
};

export const getSupabaseRuntimeConfig = () => {
  return {
    supabaseUrl: supabaseUrl || 'NOT_CONFIGURED',
    projectRef: getSupabaseProjectRef(),
    isConfigured: isSupabaseConfigured,
    maskedUrl: maskSupabaseUrl()
  };
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




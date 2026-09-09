import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://winapknggfwotdazsqla.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpbmFwa25nZ2Z3b3RkYXpzcWxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NDczOTcsImV4cCI6MjEwNDUyMzM5N30.wWdA-opt0brkYWT7PTeqU0BBOiSxlLb-5uDM1kMcwT4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export async function checkSupabaseConnection(): Promise<{ connected: boolean; message?: string }> {
  try {
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error && error.code !== '42P01' && error.message?.includes('FetchError')) {
      return { connected: false, message: error.message };
    }
    return { connected: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { connected: false, message };
  }
}

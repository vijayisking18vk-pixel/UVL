import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://winapknggfwotdazsqla.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpbmFwa25nZ2Z3b3RkYXpzcWxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NDczOTcsImV4cCI6MjEwNDUyMzM5N30.wWdA-opt0brkYWT7PTeqU0BBOiSxlLb-5uDM1kMcwT4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpbmFwa25nZ2Z3b3RkYXpzcWxhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODk0NzM5NywiZXhwIjoyMTA0NTIzMzk3fQ.OtLZSSOtyWdGpx7ISsSkivB3h_C2ytTW7F2TgajNCqE';

// Service client for authorized storage uploads and administrative provisioning
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
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

/**
 * Upload an image, document, or audio voice note directly to the Supabase 'files' storage bucket.
 * Returns the permanent public URL to stream, download, or embed.
 */
export async function uploadToStorage(
  file: Blob | File,
  destinationPath: string,
  contentType?: string
): Promise<{ url: string; path: string }> {
  const sanitizedPath = destinationPath.replace(/[^a-zA-Z0-9._/-]/g, '_');
  const type = contentType || (file instanceof File ? file.type : 'application/octet-stream');

  const { data, error } = await supabaseAdmin.storage
    .from('files')
    .upload(sanitizedPath, file, {
      contentType: type || 'application/octet-stream',
      upsert: true,
    });

  if (error) {
    console.error('Supabase storage upload error:', error);
    throw error;
  }

  const { data: urlData } = supabaseAdmin.storage
    .from('files')
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
  };
}

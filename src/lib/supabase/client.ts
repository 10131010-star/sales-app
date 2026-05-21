import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && key);
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!url || !key) {
    throw new Error('Supabase が未設定です。.env に VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を設定してください。');
  }
  if (!client) {
    client = createClient(url, key);
  }
  return client;
}

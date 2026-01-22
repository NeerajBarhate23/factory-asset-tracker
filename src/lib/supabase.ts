import { createClient } from '@jsr/supabase__supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Supabase Config Check:');
console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseAnonKey);
console.log('Key length:', supabaseAnonKey?.length);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Make sure you have:');
  console.error('VITE_SUPABASE_URL=your_url');
  console.error('VITE_SUPABASE_ANON_KEY=your_key');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lfxisyhsogruphtrfitw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlzeWhzb2dydXBodHJmaXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NzMxMTcsImV4cCI6MjA5MTA0OTExN30.CkDvh4YCCTPtlJLVfsu_qvhCiPAQb7lQ625pkzWiL58';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase Environment Variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

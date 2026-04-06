import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lfxisyhsogruphtrfitw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlzeWhzb2dydXBodHJmaXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI0MTIzMDksImV4cCI6MjAyODAxMjMwOX0.5uXG9hZ1-X9lbipM97mAzUF5SAYgVXw_AGaIRLap';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase Environment Variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

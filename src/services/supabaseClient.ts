import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://bfdrnjxqjytyrjpdbnrs.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZHJuanhxanl0eXJqcGRibnJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1OTEyODMsImV4cCI6MjEwMzE2NzI4M30.7NaODAaHq7cc8-b7IwJtqdY_rtmtaOfI_GfZHnash3U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

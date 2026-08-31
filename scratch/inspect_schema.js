import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bfdrnjxqjytyrjpdbnrs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZHJuanhxanl0eXJqcGRibnJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1OTEyODMsImV4cCI6MjEwMzE2NzI4M30.7NaODAaHq7cc8-b7IwJtqdY_rtmtaOfI_GfZHnash3U';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectSchema() {
  const { data, error } = await supabase.from('products').insert([{ id: 'test', name: 'test', category: 'test', category_label: 'test', price: 100 }]);
  console.log('Insert test result:', error);
}

inspectSchema();

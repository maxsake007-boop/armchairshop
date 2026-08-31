import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bfdrnjxqjytyrjpdbnrs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZHJuanhxanl0eXJqcGRibnJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1OTEyODMsImV4cCI6MjEwMzE2NzI4M30.7NaODAaHq7cc8-b7IwJtqdY_rtmtaOfI_GfZHnash3U';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  console.log('--- Testing Supabase Tables ---');
  
  const tables = ['lead_requests', 'products', 'categories', 'admins', 'settings'];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(3);
    if (error) {
      console.log(`❌ Table '${table}': ERROR - ${error.message} (code: ${error.code})`);
    } else {
      console.log(`✅ Table '${table}': OK (${data.length} items found)`);
    }
  }
}

checkTables();

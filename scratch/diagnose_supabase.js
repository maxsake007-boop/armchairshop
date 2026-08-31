import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bfdrnjxqjytyrjpdbnrs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZHJuanhxanl0eXJqcGRibnJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1OTEyODMsImV4cCI6MjEwMzE2NzI4M30.7NaODAaHq7cc8-b7IwJtqdY_rtmtaOfI_GfZHnash3U';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runDiagnosis() {
  console.log('================ DIAGNOSIS START ================');

  // 1. Check Tables Data
  console.log('\n--- 1. DATABASE TABLES ---');
  
  const { data: leadReqs, error: leadErr } = await supabase.from('lead_requests').select('*');
  console.log('lead_requests count:', leadReqs?.length, '| Error:', leadErr?.message || 'NONE');

  const { data: categories, error: catErr } = await supabase.from('categories').select('*');
  console.log('categories count:', categories?.length, '| Data:', categories, '| Error:', catErr?.message || 'NONE');

  const { data: products, error: prodErr } = await supabase.from('products').select('*');
  console.log('products count:', products?.length, '| Data:', products, '| Error:', prodErr?.message || 'NONE');

  const { data: settings, error: setErr } = await supabase.from('settings').select('*');
  console.log('settings count:', settings?.length, '| Data:', settings, '| Error:', setErr?.message || 'NONE');

  const { data: admins, error: admErr } = await supabase.from('admins').select('*');
  console.log('admins count:', admins?.length, '| Data:', admins, '| Error:', admErr?.message || 'NONE');

  // 2. Check Storage Buckets
  console.log('\n--- 2. STORAGE BUCKETS ---');
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  console.log('Buckets list:', buckets, '| Error:', bErr?.message || 'NONE');

  // 3. Test Storage List Files in 'chairs-media'
  console.log('\n--- 3. STORAGE FILES IN chairs-media ---');
  const { data: files, error: fErr } = await supabase.storage.from('chairs-media').list();
  console.log('Files in chairs-media:', files, '| Error:', fErr?.message || 'NONE');

  // 4. Test Dummy Upload to Storage to test RLS & bucket existence
  console.log('\n--- 4. TEST STORAGE UPLOAD ---');
  const dummyBuffer = Buffer.from('test image content');
  const testFileName = `test_diag_${Date.now()}.txt`;
  const { data: upData, error: upErr } = await supabase.storage.from('chairs-media').upload(testFileName, dummyBuffer, {
    contentType: 'text/plain',
    upsert: true
  });
  console.log('Upload test result:', upData, '| Error:', upErr?.message || 'NONE');

  if (!upErr && upData) {
    const { data: pubUrl } = supabase.storage.from('chairs-media').getPublicUrl(testFileName);
    console.log('Public URL test:', pubUrl?.publicUrl);
    // Cleanup test file
    await supabase.storage.from('chairs-media').remove([testFileName]);
  }

  // 5. Test Product Update / Insert with Supabase to check DB column match
  console.log('\n--- 5. TEST DB PRODUCT UPSERT ---');
  const testProd = {
    id: 'test-diag-id',
    name: 'Test Chair Diag',
    category: 'ergonomic',
    category_label: 'Эргономичное',
    price: 1000,
    description: 'Test description',
    images: ['/chair.jpg'],
    is_popular: false,
    in_stock: true
  };
  const { data: upsertData, error: upsertErr } = await supabase.from('products').upsert(testProd);
  console.log('Products upsert test error:', upsertErr?.message || 'NONE', '| Code:', upsertErr?.code);

  if (!upsertErr) {
    // Delete test prod
    await supabase.from('products').delete().eq('id', 'test-diag-id');
  }

  console.log('\n================ DIAGNOSIS END ================');
}

runDiagnosis();

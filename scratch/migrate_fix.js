import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bfdrnjxqjytyrjpdbnrs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZHJuanhxanl0eXJqcGRibnJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1OTEyODMsImV4cCI6MjEwMzE2NzI4M30.7NaODAaHq7cc8-b7IwJtqdY_rtmtaOfI_GfZHnash3U';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrate() {
  console.log('=== Step 1: Delete test record ===');
  const { error: delErr } = await supabase.from('products').delete().eq('id', 'test');
  console.log('Delete test:', delErr?.message || 'OK');

  console.log('\n=== Step 2: Insert 4 real products ===');
  const realProducts = [
    {
      id: 'comet-ergo-white',
      name: 'Comet Ergo White Pro',
      category: 'ergonomic',
      category_label: 'Эргономичное',
      price: 3450000,
      description: 'Флагманское эргономичное кресло с динамической поддержкой поясницы, регулируемыми 4D подлокотниками и итальянской дышащей сеткой. Идеально для работы 8+ часов в день.',
      specs: {
        ergonomics: 'Динамическая 3D поясничная зона',
        armrests: '4D с мягким полиуретаном',
        reclineAngle: '90° - 135° с фиксацией в 4 положениях',
        maxWeight: 'До 140 кг',
        material: 'Высокопрочная сетка Dupont',
        warranty: '3 года гарантии',
      },
      is_popular: true,
      in_stock: true,
    },
    {
      id: 'comet-gaming-cyber',
      name: 'Comet Cyber Gaming Black',
      category: 'gaming',
      category_label: 'Геймерское',
      price: 2890000,
      description: 'Геймерское кресло анатомической формы из износостойкой экокожи с подушками под шею и поясницу. Откидная спинка 180 градусов для полного расслабления.',
      specs: {
        ergonomics: 'Боковая поддержка и выносные подушки',
        armrests: '3D регулировка по высоте и углу',
        reclineAngle: '90° - 180° раскладывание',
        maxWeight: 'До 150 кг',
        material: 'Перфорированная экокожа PU',
        warranty: '2 года гарантии',
      },
      is_popular: true,
      in_stock: true,
    },
    {
      id: 'comet-executive-mesh',
      name: 'Comet Executive Mesh Grey',
      category: 'office',
      category_label: 'Офисное премиум',
      price: 2450000,
      description: 'Современное офисное кресло в минималистичном дизайне. Алюминиевая крестовина, бесшумные ролики и регулируемый подголовник.',
      specs: {
        ergonomics: 'Регулируемый подголовник и поясничный упор',
        armrests: '2D с синхронным механизмом',
        reclineAngle: '90° - 120°',
        maxWeight: 'До 120 кг',
        material: 'Аэросетка + Металлический каркас',
        warranty: '2 года гарантии',
      },
      is_popular: false,
      in_stock: true,
    },
    {
      id: 'comet-boss-leather',
      name: 'Comet Boss Leather Black',
      category: 'executive',
      category_label: 'Руководительское',
      price: 4200000,
      description: 'Премиальное кожаное кресло руководителя с мультиблоком и подголовником. Натуральная кожа люкс класса.',
      specs: {
        ergonomics: 'Анатомическая монолитная спинка',
        armrests: 'Кожаные мягкие накладки',
        reclineAngle: 'Мультиблок с качанием',
        maxWeight: 'До 160 кг',
        material: 'Натуральная кожа Люкс',
        warranty: '3 года гарантии',
      },
      is_popular: true,
      in_stock: true,
    },
  ];

  // Try inserting without 'images' column first (since it may not exist yet)
  for (const prod of realProducts) {
    const { error } = await supabase.from('products').upsert(prod);
    if (error) {
      console.log(`  Product ${prod.id}: ERROR - ${error.message} (code: ${error.code})`);
    } else {
      console.log(`  Product ${prod.id}: OK`);
    }
  }

  console.log('\n=== Step 3: Fix banner blob URL ===');
  const { data: settings } = await supabase.from('settings').select('*').eq('key', 'reels_promo').single();
  if (settings?.value?.coverImage && settings.value.coverImage.startsWith('blob:')) {
    console.log('  Found blob URL in banner coverImage, replacing with /chair.jpg');
    const fixedValue = { ...settings.value, coverImage: '/chair.jpg' };
    const { error: fixErr } = await supabase.from('settings').upsert({ key: 'reels_promo', value: fixedValue });
    console.log('  Fix banner:', fixErr?.message || 'OK');
  } else {
    console.log('  Banner coverImage is OK:', settings?.value?.coverImage);
  }

  console.log('\n=== Step 4: Verify final state ===');
  const { data: prods, error: pErr } = await supabase.from('products').select('id, name, price');
  console.log('Products in DB:', prods, '| Error:', pErr?.message || 'NONE');

  const { data: stg } = await supabase.from('settings').select('*').eq('key', 'reels_promo').single();
  console.log('Banner coverImage:', stg?.value?.coverImage);

  // Test storage upload
  console.log('\n=== Step 5: Test Storage upload ===');
  const testBuf = Buffer.from('storage-test');
  const testName = `_diag_test_${Date.now()}.txt`;
  const { data: upData, error: upErr } = await supabase.storage.from('chairs-media').upload(testName, testBuf, { contentType: 'text/plain', upsert: true });
  console.log('Storage upload:', upErr?.message || 'OK');
  if (!upErr) {
    const { data: pubUrl } = supabase.storage.from('chairs-media').getPublicUrl(testName);
    console.log('Public URL:', pubUrl?.publicUrl);
    await supabase.storage.from('chairs-media').remove([testName]);
    console.log('Cleanup: OK');
  }

  console.log('\n=== MIGRATION COMPLETE ===');
}

migrate();

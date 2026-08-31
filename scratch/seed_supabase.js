import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bfdrnjxqjytyrjpdbnrs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZHJuanhxanl0eXJqcGRibnJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1OTEyODMsImV4cCI6MjEwMzE2NzI4M30.7NaODAaHq7cc8-b7IwJtqdY_rtmtaOfI_GfZHnash3U';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const initialProducts = [
  {
    id: 'comet-ergo-pro-1',
    name: 'Comet Ergo Pro White',
    category: 'ergonomic',
    category_label: 'Эргономичное',
    price: 3200000,
    description: 'Флагманское эргономичное кресло с анатомической поддержкой поясницы 3D и адаптивным сетчатым подголовником.',
    specs: {
      ergonomics: 'Анатомическая поддержка 3D',
      armrests: '4D Регулировка (высота, угол, вылет)',
      reclineAngle: '90° - 135° с фиксацией в 4 положениях',
      maxWeight: 'До 150 кг',
      material: 'Высокопрочная "дышащая" сетка Dupont',
      warranty: '3 года официальной гарантии'
    },
    images: ['/chair.jpg'],
    rating: 4.9,
    reviews_count: 28,
    is_popular: true,
    in_stock: true
  },
  {
    id: 'comet-gaming-titan-2',
    name: 'Comet Gaming Titan Black/Red',
    category: 'gaming',
    category_label: 'Геймерское',
    price: 2850000,
    description: 'Премиальное геймерское кресло из экокожи с эффектом памяти, выдвижной подставкой для ног и подушкой под поясницу.',
    specs: {
      ergonomics: 'Боковая поддержка спорткара',
      armrests: '3D Регулируемые',
      reclineAngle: '90° - 180° раскладывание',
      maxWeight: 'До 140 кг',
      material: 'Перфорированная экокожа премиум',
      warranty: '2 года гарантии'
    },
    images: ['/chair.jpg'],
    rating: 4.8,
    reviews_count: 19,
    is_popular: true,
    in_stock: true
  },
  {
    id: 'comet-[#0052ff]-mesh-3',
    name: 'Comet Air Mesh Executive',
    category: 'office',
    category_label: 'Офисное',
    price: 2400000,
    description: 'Стильное офисное кресло для топ-менеджеров с корейской сеткой высокой плотности и стальным основанием.',
    specs: {
      ergonomics: 'Динамический поясничный упор',
      armrests: '2D Регулировка',
      reclineAngle: '90° - 125°',
      maxWeight: 'До 130 кг',
      material: 'Сетка Wintex (Корея)',
      warranty: '2 года гарантии'
    },
    images: ['/chair.jpg'],
    rating: 4.7,
    reviews_count: 14,
    is_popular: false,
    in_stock: true
  },
  {
    id: 'comet-compact-study-4',
    name: 'Comet Compact Home Office',
    category: 'compact',
    category_label: 'Компактное',
    price: 1850000,
    description: 'Компактное и эргономичное кресло для дома и работы за ноутбуком. Идеально подходит для небольших кабинетов.',
    specs: {
      ergonomics: 'Поддержка грудного отдела',
      armrests: 'Откидные на 90°',
      reclineAngle: 'Функция качания Top-Gan',
      maxWeight: 'До 110 кг',
      material: 'Аэросетка + мягкое сиденье',
      warranty: '1.5 года гарантии'
    },
    images: ['/chair.jpg'],
    rating: 4.9,
    reviews_count: 32,
    is_popular: true,
    in_stock: true
  }
];

const initialCategories = [
  { id: 'cat-1', name: 'Все кресла', slug: 'all', count: 4, icon_name: 'Grid' },
  { id: 'cat-2', name: 'Эргономичные', slug: 'ergonomic', count: 1, icon_name: 'Armchair' },
  { id: 'cat-3', name: 'Геймерские', slug: 'gaming', count: 1, icon_name: 'Gamepad2' },
  { id: 'cat-4', name: 'Офисные', slug: 'office', count: 1, icon_name: 'Briefcase' },
  { id: 'cat-5', name: 'Компактные', slug: 'compact', count: 1, icon_name: 'Laptop' }
];

const initialReelsSetting = {
  key: 'reels_promo',
  value: {
    id: 'reels-1',
    badge: 'Новинка',
    title: 'кресло, которое стоит попробовать',
    buttonText: 'Смотреть обзор',
    instagramUrl: 'https://instagram.com/comet.uz',
    coverImage: '/chair.jpg',
    isActive: true
  }
};

async function seed() {
  console.log('--- Seeding Initial Data into Supabase ---');

  // Seed Products
  const { error: pErr } = await supabase.from('products').upsert(initialProducts);
  console.log('Products seed:', pErr ? pErr.message : 'OK');

  // Seed Categories
  const { error: cErr } = await supabase.from('categories').upsert(initialCategories);
  console.log('Categories seed:', cErr ? cErr.message : 'OK');

  // Seed Settings
  const { error: sErr } = await supabase.from('settings').upsert(initialReelsSetting);
  console.log('Settings seed:', sErr ? sErr.message : 'OK');
}

seed();

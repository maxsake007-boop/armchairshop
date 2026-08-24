import { Product, Category, Banner, ReelsPromo } from '../types';

export const CHAIR_IMAGE = '/chair.jpg';

export const MOCK_CATEGORIES: Category[] = [
  { id: 'all', name: 'Все кресла', slug: 'all', count: 4, iconName: 'Grid' },
  { id: 'ergonomic', name: 'Эргономичные', slug: 'ergonomic', count: 1, iconName: 'Activity' },
  { id: 'gaming', name: 'Геймерские', slug: 'gaming', count: 1, iconName: 'Gamepad2' },
  { id: 'office', name: 'Офисные', slug: 'office', count: 1, iconName: 'Briefcase' },
  { id: 'executive', name: 'Руководительские', slug: 'executive', count: 1, iconName: 'Crown' },
];

export const MOCK_BANNERS: Banner[] = [
  {
    id: 'b1',
    title: 'Comet.Uz Seating',
    subtitle: 'Премиальные эргономичные кресла',
    imageUrl: '/chair.jpg',
    buttonText: 'Смотреть каталог',
  },
];

export const DEFAULT_REELS_PROMO: ReelsPromo = {
  id: 'reels-1',
  badge: 'Новинка',
  title: 'кресло, которое стоит попробовать',
  buttonText: 'Смотреть обзор',
  instagramUrl: 'https://instagram.com/comet.uz',
  coverImage: '/reels_cover.png',
  isActive: true,
};

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'comet-ergo-white',
    name: 'Comet Ergo White Pro',
    category: 'ergonomic',
    categoryLabel: 'Эргономичное',
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
    images: [CHAIR_IMAGE, CHAIR_IMAGE, CHAIR_IMAGE, CHAIR_IMAGE],
    rating: 4.9,
    reviewsCount: 42,
    isPopular: true,
    inStock: true,
  },
  {
    id: 'comet-gaming-cyber',
    name: 'Comet Cyber Gaming Black',
    category: 'gaming',
    categoryLabel: 'Геймерское',
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
    images: [CHAIR_IMAGE, CHAIR_IMAGE, CHAIR_IMAGE, CHAIR_IMAGE],
    rating: 4.8,
    reviewsCount: 38,
    isPopular: true,
    inStock: true,
  },
  {
    id: 'comet-executive-mesh',
    name: 'Comet Executive Mesh Grey',
    category: 'office',
    categoryLabel: 'Офисное премиум',
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
    images: [CHAIR_IMAGE],
    rating: 4.7,
    reviewsCount: 19,
    isPopular: false,
    inStock: true,
  },
  {
    id: 'comet-boss-leather',
    name: 'Comet Boss Leather Black',
    category: 'executive',
    categoryLabel: 'Руководительское',
    price: 4900000,
    description: 'Роскошное кресло руководителя из натуральной кожи с деревянными подлокотниками и механизмом мультиблок.',
    specs: {
      ergonomics: 'Многослойный наполнитель плотностью High-Density',
      armrests: 'Массив дерева с кожаными накладками',
      reclineAngle: 'Мультиблок с фиксацией в 5 положениях',
      maxWeight: 'До 160 кг',
      material: 'Натуральная кожа класса Люкс',
      warranty: '5 лет гарантии',
    },
    images: [CHAIR_IMAGE],
    rating: 5.0,
    reviewsCount: 14,
    isPopular: true,
    inStock: true,
  },
];

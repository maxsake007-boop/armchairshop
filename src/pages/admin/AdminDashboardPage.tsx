import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ArrowLeft,
  LogOut,
  Search,
  Filter,
  Instagram,
  Sparkles,
  Save,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Edit3,
  UserPlus,
  Users,
  LayoutDashboard,
  Calendar,
  ExternalLink,
  Phone,
  Send,
  Upload,
  AlertCircle,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  Package,
  Armchair,
  ShoppingBag,
  Bell,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { useRequests } from '../../context/RequestsContext';
import { useSettings } from '../../context/SettingsContext';
import { formatDate, formatPrice } from '../../utils/formatters';
import { LeadRequest, Product, AdminUser, RequestStatus } from '../../types';
import { MOCK_PRODUCTS } from '../../services/mockData';
import { supabase } from '../../services/supabaseClient';

interface AdminDashboardPageProps {
  onBackToApp: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onBackToApp }) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Main Active Sidebar Tab
  const [adminTab, setAdminTab] = useState<'dashboard' | 'requests' | 'catalog' | 'media' | 'admins'>('dashboard');

  // Requests state & filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequestModal, setSelectedRequestModal] = useState<LeadRequest | null>(null);

  // Dashboard time filter
  const [dashboardTimeFilter, setDashboardTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');

  // Products State (Catalog)
  const [productsList, setProductsList] = useState<Product[]>(MOCK_PRODUCTS);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Admin Users State
  const [adminsList, setAdminsList] = useState<AdminUser[]>([
    {
      id: 'ADM-1',
      username: 'admin',
      fullName: 'Главный Администратор',
      role: 'superadmin',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ADM-2',
      username: 'manager1',
      fullName: 'Алишер Менеджер',
      role: 'manager',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ]);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [newAdminUser, setNewAdminUser] = useState({ username: '', fullName: '', password: '', role: 'manager' as const });

  // Settings & Context
  const { reelsPromo, updateReelsPromo } = useSettings();
  const { requests, updateRequestStatus } = useRequests();

  // Reels Edit state
  const [editReelsTitle, setEditReelsTitle] = useState(reelsPromo.title);
  const [editReelsBadge, setEditReelsBadge] = useState(reelsPromo.badge);
  const [editReelsUrl, setEditReelsUrl] = useState(reelsPromo.instagramUrl);
  const [editReelsActive, setEditReelsActive] = useState(reelsPromo.isActive);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  // Fetch products from Supabase if available
  useEffect(() => {
    const fetchSupabaseProducts = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (!error && data && data.length > 0) {
          const mapped: Product[] = data.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            categoryLabel: item.category_label,
            price: Number(item.price),
            description: item.description || '',
            specs: item.specs || {
              ergonomics: '', armrests: '', reclineAngle: '', maxWeight: '', material: '', warranty: ''
            },
            images: item.images || ['/chair.jpg'],
            rating: item.rating || 4.9,
            reviewsCount: item.reviews_count || 0,
            isPopular: item.is_popular,
            inStock: item.in_stock ?? true,
          }));
          setProductsList(mapped);
        }
      } catch (err) {
        console.warn('Using local products fallback:', err);
      }
    };

    fetchSupabaseProducts();
  }, []);

  // Fetch Admins from Supabase if available
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const { data, error } = await supabase.from('admins').select('*');
        if (!error && data && data.length > 0) {
          const mapped: AdminUser[] = data.map((a) => ({
            id: String(a.id),
            username: a.username,
            fullName: a.full_name,
            role: a.role as any,
            isActive: a.is_active,
            createdAt: a.created_at,
          }));
          setAdminsList(mapped);
        }
      } catch (err) {
        console.warn('Admins table fallback:', err);
      }
    };
    fetchAdmins();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123' || password === 'comet2026') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Неверный пароль администратора');
    }
  };

  // Filter requests based on time period
  const getFilteredRequestsByTime = (reqs: LeadRequest[]) => {
    const now = new Date();
    return reqs.filter((r) => {
      const created = new Date(r.createdAt);
      if (dashboardTimeFilter === 'today') {
        return created.toDateString() === now.toDateString();
      }
      if (dashboardTimeFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return created >= weekAgo;
      }
      if (dashboardTimeFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return created >= monthAgo;
      }
      return true;
    });
  };

  const filteredRequests = requests.filter((r) => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesQuery =
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phoneNumber.includes(searchQuery) ||
      (r.telegramUsername && r.telegramUsername.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  // Export Requests to CSV
  const handleExportCSV = () => {
    const headers = ['ID,Customer Name,Phone,Telegram,Product,Price (UZS),Status,Date\n'];
    const rows = requests.map(
      (r) =>
        `"${r.id}","${r.customerName}","${r.phoneNumber}","${r.telegramUsername || ''}","${
          r.productName || ''
        }","${r.productPrice || 0}","${r.status}","${formatDate(r.createdAt)}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + headers.concat(rows).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CometUz_Requests_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save Reels Promo Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateReelsPromo({
      ...reelsPromo,
      title: editReelsTitle,
      badge: editReelsBadge,
      instagramUrl: editReelsUrl,
      isActive: editReelsActive,
    });
    setSaveSuccessMessage('Настройки баннера и Reels успешно сохранены!');
    setTimeout(() => setSaveSuccessMessage(''), 3000);
  };

  // Product Image Upload to Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `chair_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage.from('chairs-media').upload(fileName, file);

      if (error) {
        console.warn('Storage upload notice:', error.message);
        const localUrl = URL.createObjectURL(file);
        setEditingProduct((prev) => ({
          ...prev,
          images: [...(prev?.images || []), localUrl].slice(0, 4),
        }));
      } else if (data) {
        const { data: publicData } = supabase.storage.from('chairs-media').getPublicUrl(fileName);
        setEditingProduct((prev) => ({
          ...prev,
          images: [...(prev?.images || []), publicData.publicUrl].slice(0, 4),
        }));
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  // Save Product (Add / Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.price) return;

    const isNew = !editingProduct.id;
    const prodId = editingProduct.id || `comet-chair-${Date.now()}`;

    const savedProd: Product = {
      id: prodId,
      name: editingProduct.name || 'Новое кресло',
      category: editingProduct.category || 'ergonomic',
      categoryLabel: editingProduct.categoryLabel || 'Эргономичное',
      price: Number(editingProduct.price) || 0,
      description: editingProduct.description || '',
      specs: editingProduct.specs || {
        ergonomics: 'Анатомическая поддержка',
        armrests: '4D Регулировка',
        reclineAngle: '90° - 135°',
        maxWeight: 'До 130 кг',
        material: 'Высокопрочная сетка',
        warranty: '2 года гарантии',
      },
      images: editingProduct.images?.length ? editingProduct.images : ['/chair.jpg'],
      rating: 4.9,
      reviewsCount: 12,
      isPopular: !!editingProduct.isPopular,
      inStock: editingProduct.inStock ?? true,
    };

    if (isNew) {
      setProductsList((prev) => [savedProd, ...prev]);
    } else {
      setProductsList((prev) => prev.map((p) => (p.id === prodId ? savedProd : p)));
    }

    try {
      await supabase.from('products').upsert({
        id: savedProd.id,
        name: savedProd.name,
        category: savedProd.category,
        category_label: savedProd.categoryLabel,
        price: savedProd.price,
        description: savedProd.description,
        specs: savedProd.specs,
        images: savedProd.images,
        is_popular: savedProd.isPopular,
        in_stock: savedProd.inStock,
      });
    } catch (err) {
      console.warn('Supabase product save fallback:', err);
    }

    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  // Delete Product
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это кресло из каталога?')) return;

    setProductsList((prev) => prev.filter((p) => p.id !== productId));
    try {
      await supabase.from('products').delete().eq('id', productId);
    } catch (err) {
      console.error('Delete product error:', err);
    }
  };

  // Add Admin User
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUser.username || !newAdminUser.fullName || !newAdminUser.password) return;

    const newAdmin: AdminUser = {
      id: `ADM-${Date.now()}`,
      username: newAdminUser.username.trim(),
      fullName: newAdminUser.fullName.trim(),
      role: newAdminUser.role,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setAdminsList((prev) => [...prev, newAdmin]);

    try {
      await supabase.from('admins').insert({
        username: newAdmin.username,
        full_name: newAdmin.fullName,
        password_hash: newAdminUser.password,
        role: newAdmin.role,
      });
    } catch (err) {
      console.warn('Add admin fallback:', err);
    }

    setIsAdminModalOpen(false);
    setNewAdminUser({ username: '', fullName: '', password: '', role: 'manager' });
  };

  // Delete Admin User
  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('Удалить этого администратора?')) return;
    setAdminsList((prev) => prev.filter((a) => a.id !== adminId));
    try {
      await supabase.from('admins').delete().eq('id', adminId);
    } catch (err) {
      console.warn('Delete admin fallback:', err);
    }
  };

  // Stitch Pill Badge Renderer for Statuses
  const renderStitchStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fef3c7] text-[#92400e]">
            Новая
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#dfe3ff] text-[#0038b6]">
            В процессе
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#dcfce7] text-[#166534]">
            Успешно (Продано)
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#edeeef] text-[#5f5e5e]">
            Закрыта (Отказ)
          </span>
        );
    }
  };

  // Metrics calculation
  const timeFilteredReqs = getFilteredRequestsByTime(requests);
  const totalCount = timeFilteredReqs.length;
  const newCount = timeFilteredReqs.filter((r) => r.status === 'new').length;
  const inProgressCount = timeFilteredReqs.filter((r) => r.status === 'in_progress').length;
  const completedCount = timeFilteredReqs.filter((r) => r.status === 'completed').length;
  const closedCount = timeFilteredReqs.filter((r) => r.status === 'closed').length;

  const totalRevenue = timeFilteredReqs
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + (r.productPrice || 0), 0);

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d] flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-[0_4px_25px_rgba(0,0,0,0.06)] border border-[#e1e3e4]">
          <div className="flex items-center justify-center w-14 h-14 bg-[#0052ff]/10 text-[#0052ff] rounded-2xl mx-auto mb-4 border border-[#0052ff]/20">
            <ShieldCheck className="w-8 h-8 text-[#0052ff]" />
          </div>

          <h2 className="font-bold text-2xl text-center text-[#1A1A1B] mb-1">
            CometAdmin
          </h2>
          <p className="text-xs text-[#71717A] text-center mb-6 font-medium">
            Furniture Solutions • Десктопная панель
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold text-center">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1B] mb-1">
                Пароль администратора
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль..."
                className="w-full px-4 py-3 rounded-xl bg-[#f3f4f5] border border-[#c3c5d9]/60 text-sm text-[#1A1A1B] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/30 font-mono"
              />
              <span className="text-[10px] text-[#71717A] mt-1 block">
                Демо-пароль: <code className="text-[#1A1A1B] font-mono">admin123</code> или <code className="text-[#1A1A1B] font-mono">comet2026</code>
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-[#0052ff] hover:bg-[#004ced] text-white font-bold text-sm tracking-wide shadow-md shadow-[#0052ff]/25 transition-all"
            >
              ВОЙТИ В АДМИНКУ
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#e1e3e4] flex justify-center">
            <button
              onClick={onBackToApp}
              className="text-xs text-[#71717A] hover:text-[#0052ff] flex items-center gap-1.5 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Вернуться в клиентский Mini App</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d] font-sans flex">
      {/* 1. STITCH SIDE NAVIGATION BAR (w-64 fixed left-0 top-0) */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-[#f3f4f5] flex flex-col py-4 px-4 z-50 border-r border-[#c3c5d9]/30">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 mb-6">
          <div className="w-10 h-10 bg-[#0052ff] rounded-xl flex items-center justify-center text-white shadow-md">
            <Armchair className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base text-[#003ec7] leading-tight">CometAdmin</h1>
            <p className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Seating Solutions</p>
          </div>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="flex-1 flex flex-col gap-1.5">
          <button
            onClick={() => setAdminTab('dashboard')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              adminTab === 'dashboard'
                ? 'bg-[#0052ff] text-white shadow-md shadow-[#0052ff]/20'
                : 'text-[#434656] hover:bg-[#e7e8e9] hover:text-[#1A1A1B]'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Дашборд</span>
          </button>

          <button
            onClick={() => setAdminTab('requests')}
            className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              adminTab === 'requests'
                ? 'bg-[#0052ff] text-white shadow-md shadow-[#0052ff]/20'
                : 'text-[#434656] hover:bg-[#e7e8e9] hover:text-[#1A1A1B]'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5" />
              <span>Заявки</span>
            </div>
            {newCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                adminTab === 'requests' ? 'bg-white text-[#0052ff]' : 'bg-[#0052ff] text-white'
              }`}>
                {newCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setAdminTab('catalog')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              adminTab === 'catalog'
                ? 'bg-[#0052ff] text-white shadow-md shadow-[#0052ff]/20'
                : 'text-[#434656] hover:bg-[#e7e8e9] hover:text-[#1A1A1B]'
            }`}
          >
            <Package className="w-5 h-5" />
            <span>Каталог кресел</span>
          </button>

          <button
            onClick={() => setAdminTab('media')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              adminTab === 'media'
                ? 'bg-[#0052ff] text-white shadow-md shadow-[#0052ff]/20'
                : 'text-[#434656] hover:bg-[#e7e8e9] hover:text-[#1A1A1B]'
            }`}
          >
            <Instagram className="w-5 h-5" />
            <span>Баннеры & Reels</span>
          </button>

          <button
            onClick={() => setAdminTab('admins')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              adminTab === 'admins'
                ? 'bg-[#0052ff] text-white shadow-md shadow-[#0052ff]/20'
                : 'text-[#434656] hover:bg-[#e7e8e9] hover:text-[#1A1A1B]'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Администраторы</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="mt-auto border-t border-[#c3c5d9]/30 pt-3 space-y-1">
          <button
            onClick={onBackToApp}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[#434656] hover:bg-[#e7e8e9] hover:text-[#1A1A1B] transition-colors rounded-xl font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>В Mini App</span>
          </button>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[#ba1a1a] hover:bg-[#ffdad6]/60 transition-colors rounded-xl font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* 2. STITCH TOP NAVIGATION BAR (fixed top-0 right-0 w-[calc(100%-16rem)]) */}
      <nav className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 bg-white/80 backdrop-blur-md shadow-sm border-b border-[#c3c5d9]/30 z-40 px-6 flex justify-between items-center">
        {/* Search Input */}
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени, номеру или ID..."
              className="w-full pl-10 pr-4 py-2 bg-[#f3f4f5] border-none rounded-full text-xs text-[#1A1A1B] focus:ring-2 focus:ring-[#0052ff]/20 outline-none placeholder-[#71717A]"
            />
          </div>
        </div>

        {/* Header Actions & Profile */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingProduct({
                name: '',
                category: 'ergonomic',
                categoryLabel: 'Эргономичное',
                price: 2800000,
                description: '',
                images: [],
                isPopular: true,
                inStock: true,
              });
              setIsProductModalOpen(true);
            }}
            className="bg-[#0052ff] text-white px-5 py-2 rounded-full text-xs font-bold shadow-md shadow-[#0052ff]/20 hover:bg-[#004ced] transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Создать кресло</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="text-[#0052ff] border border-[#0052ff] px-4 py-2 rounded-full text-xs font-bold hover:bg-[#EBF2FF] transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Экспорт</span>
          </button>

          <div className="flex items-center gap-2 border-l border-[#c3c5d9]/40 pl-4 ml-2">
            <div className="w-8 h-8 rounded-full bg-[#0052ff]/10 text-[#0052ff] flex items-center justify-center font-bold text-xs border border-[#0052ff]/20">
              GA
            </div>
            <div className="text-left hidden sm:block">
              <span className="block text-xs font-bold text-[#1A1A1B] leading-none">Главный Менеджер</span>
              <span className="text-[10px] text-[#71717A]">Comet.Uz Admin</span>
            </div>
          </div>
        </div>
      </nav>

      {/* 3. MAIN CONTENT CANVAS (ml-64 mt-16 p-8) */}
      <main className="ml-64 mt-16 p-8 flex-1 min-h-[calc(100vh-4rem)] max-w-[1600px] space-y-6">

        {/* ================= TAB 1: DASHBOARD ================= */}
        {adminTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Header & Period Pills */}
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-[#1A1A1B] tracking-tight">Обзор панели</h2>
                <p className="text-xs text-[#71717A] mt-0.5 font-medium">Ключевые показатели деятельности Comet.Uz</p>
              </div>

              <div className="flex items-center gap-1 bg-[#e7e8e9] rounded-xl p-1">
                {(['today', 'week', 'month', 'all'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setDashboardTimeFilter(period)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      dashboardTimeFilter === period
                        ? 'bg-white text-[#1A1A1B] shadow-sm'
                        : 'text-[#434656] hover:text-[#1A1A1B]'
                    }`}
                  >
                    {period === 'today' ? 'Сегодня' : period === 'week' ? 'Неделя' : period === 'month' ? 'Месяц' : 'Все время'}
                  </button>
                ))}
              </div>
            </div>

            {/* STITCH KPI CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: New Requests */}
              <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#e1e3e4] flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-[#fef3c7] rounded-xl text-[#92400e]">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="flex items-center text-xs text-[#059669] bg-[#059669]/10 px-2 py-0.5 rounded-full font-bold">
                    <TrendingUp className="w-3.5 h-3.5 mr-1" /> +12%
                  </span>
                </div>
                <div>
                  <p className="text-[#71717A] text-xs font-semibold">Новые заявки</p>
                  <p className="text-2xl font-extrabold text-[#1A1A1B] mt-0.5">{newCount}</p>
                </div>
              </div>

              {/* Card 2: In Progress */}
              <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#e1e3e4] flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-[#dfe3ff] rounded-xl text-[#0038b6]">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <p className="text-[#71717A] text-xs font-semibold">В процессе обработки</p>
                  <p className="text-2xl font-extrabold text-[#1A1A1B] mt-0.5">{inProgressCount}</p>
                </div>
              </div>

              {/* Card 3: Successfully Completed */}
              <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#e1e3e4] flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-[#dcfce7] rounded-xl text-[#166534]">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="flex items-center text-xs text-[#059669] bg-[#059669]/10 px-2 py-0.5 rounded-full font-bold">
                    <TrendingUp className="w-3.5 h-3.5 mr-1" /> +5%
                  </span>
                </div>
                <div>
                  <p className="text-[#71717A] text-xs font-semibold">Успешно продано</p>
                  <p className="text-2xl font-extrabold text-[#166534] mt-0.5">{completedCount}</p>
                </div>
              </div>

              {/* Card 4: Total Revenue */}
              <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#e1e3e4] flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-[#EBF2FF] rounded-xl text-[#0052ff]">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <p className="text-[#71717A] text-xs font-semibold">Выручка проданных кресел</p>
                  <p className="text-xl font-black text-[#0052ff] font-mono mt-0.5">{formatPrice(totalRevenue)}</p>
                </div>
              </div>
            </div>

            {/* STITCH CHART & RECENT ORDERS MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (2/3): Chart & Table */}
              <div className="lg:col-span-2 space-y-6">
                {/* SVG Curve Chart Area */}
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#e1e3e4] p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-base text-[#1A1A1B]">Активность приложения</h3>
                      <p className="text-xs text-[#71717A]">Динамика поступающих заказов</p>
                    </div>
                    <span className="text-xs font-bold text-[#0052ff] bg-[#EBF2FF] px-3 py-1 rounded-full">
                      Live Traffic
                    </span>
                  </div>

                  {/* SVG Chart curve */}
                  <div className="h-60 w-full border-b border-l border-[#c3c5d9]/40 relative mt-4">
                    <div className="absolute bottom-0 left-0 w-full h-[65%] bg-gradient-to-t from-[#0052ff]/15 to-transparent" />
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <path
                        className="text-[#0052ff]"
                        d="M0,80 Q15,65 30,50 T60,35 T80,45 T100,15"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <circle className="text-[#0052ff]" cx="100" cy="15" fill="currentColor" r="3" />
                      <circle className="text-[#0052ff]" cx="80" cy="45" fill="currentColor" r="3" />
                      <circle className="text-[#0052ff]" cx="60" cy="35" fill="currentColor" r="3" />
                      <circle className="text-[#0052ff]" cx="30" cy="50" fill="currentColor" r="3" />
                    </svg>
                  </div>
                  <div className="flex justify-between text-xs text-[#71717A] px-2 font-mono">
                    <span>08:00</span>
                    <span>11:00</span>
                    <span>14:00</span>
                    <span>17:00</span>
                    <span>20:00</span>
                    <span>23:00</span>
                  </div>
                </div>

                {/* Recent Orders Table */}
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#e1e3e4] overflow-hidden">
                  <div className="p-5 border-b border-[#e1e3e4] flex justify-between items-center">
                    <h3 className="font-bold text-base text-[#1A1A1B]">Последние заявки</h3>
                    <button
                      onClick={() => setAdminTab('requests')}
                      className="text-xs font-bold text-[#0052ff] hover:underline flex items-center gap-1"
                    >
                      <span>Все заявки</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#f8f9fa] border-b border-[#e1e3e4] text-[#71717A] uppercase font-bold tracking-wider">
                          <th className="p-4">ID</th>
                          <th className="p-4">Клиент</th>
                          <th className="p-4">Телефон</th>
                          <th className="p-4">Кресло</th>
                          <th className="p-4">Дата</th>
                          <th className="p-4">Статус</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e1e3e4]">
                        {requests.slice(0, 5).map((req) => (
                          <tr
                            key={req.id}
                            onClick={() => setSelectedRequestModal(req)}
                            className="hover:bg-[#F2F2F2]/60 cursor-pointer transition-colors"
                          >
                            <td className="p-4 font-mono font-bold text-[#1A1A1B]">{req.id}</td>
                            <td className="p-4 font-semibold text-[#1A1A1B]">{req.customerName}</td>
                            <td className="p-4 font-mono text-[#71717A]">{req.phoneNumber}</td>
                            <td className="p-4 font-medium text-[#1A1A1B] max-w-[150px] truncate">
                              {req.productName || 'Не указано'}
                            </td>
                            <td className="p-4 text-[#71717A]">{formatDate(req.createdAt)}</td>
                            <td className="p-4">{renderStitchStatusBadge(req.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column (1/3): Visitors & Popular Items */}
              <div className="space-y-6">
                {/* Visitors Widget */}
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#e1e3e4] p-5 space-y-4">
                  <h3 className="font-bold text-base text-[#1A1A1B]">Посетители приложения</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#F2F2F2] rounded-xl p-3">
                      <p className="text-[11px] text-[#71717A] font-semibold">Сегодня</p>
                      <p className="font-headline-sm text-[#1A1A1B] font-bold mt-0.5">1,245</p>
                    </div>
                    <div className="bg-[#F2F2F2] rounded-xl p-3">
                      <p className="text-[11px] text-[#71717A] font-semibold">7 дней</p>
                      <p className="font-headline-sm text-[#1A1A1B] font-bold mt-0.5">8,430</p>
                    </div>
                    <div className="bg-[#F2F2F2] rounded-xl p-3">
                      <p className="text-[11px] text-[#71717A] font-semibold">30 дней</p>
                      <p className="font-headline-sm text-[#1A1A1B] font-bold mt-0.5">32,100</p>
                    </div>
                    <div className="bg-[#F2F2F2] rounded-xl p-3">
                      <p className="text-[11px] text-[#71717A] font-semibold">Всего</p>
                      <p className="font-headline-sm text-[#1A1A1B] font-bold mt-0.5">145k</p>
                    </div>
                  </div>
                </div>

                {/* Popular Chairs Ranking */}
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#e1e3e4] p-5 space-y-4">
                  <h3 className="font-bold text-base text-[#1A1A1B]">Популярные кресла</h3>
                  <div className="space-y-3">
                    {productsList.slice(0, 4).map((p) => (
                      <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl bg-[#f8f9fa] border border-[#e1e3e4]">
                        <img src={p.images[0] || '/chair.jpg'} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-white" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-[#1A1A1B] truncate">{p.name}</h4>
                          <span className="font-mono font-bold text-xs text-[#0052ff]">{formatPrice(p.price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: REQUESTS / ORDERS ================= */}
        {adminTab === 'requests' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-[#1A1A1B] tracking-tight">Заявки клиентов</h2>
                <p className="text-xs text-[#71717A] mt-0.5 font-medium">Управление всеми поступающими обращениями из Mini App</p>
              </div>

              <button
                onClick={handleExportCSV}
                className="bg-[#0052ff] text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-md shadow-[#0052ff]/20 hover:bg-[#004ced] transition-all flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Скачать CSV (Excel)</span>
              </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#e1e3e4] shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1 max-w-md bg-[#f3f4f5] px-4 py-2 rounded-full border border-[#c3c5d9]/40">
                <Search className="w-4 h-4 text-[#71717A]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по имени, номеру, Telegram..."
                  className="bg-transparent border-none text-xs text-[#1A1A1B] placeholder-[#71717A] focus:outline-none w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#71717A]" />
                <span className="text-xs text-[#71717A] font-bold mr-1">Статус:</span>
                {[
                  { id: 'all', label: 'Все' },
                  { id: 'new', label: 'Новые' },
                  { id: 'in_progress', label: 'В процессе' },
                  { id: 'completed', label: 'Успешно' },
                  { id: 'closed', label: 'Закрыта' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setFilterStatus(st.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                      filterStatus === st.id
                        ? 'bg-[#0052ff] text-white shadow-sm'
                        : 'bg-[#f3f4f5] text-[#434656] hover:bg-[#e7e8e9]'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-2xl border border-[#e1e3e4] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-[#e1e3e4] text-[#71717A] uppercase font-bold tracking-wider">
                    <th className="p-4">ID</th>
                    <th className="p-4">Клиент</th>
                    <th className="p-4">Телефон</th>
                    <th className="p-4">Telegram</th>
                    <th className="p-4">Товар</th>
                    <th className="p-4">Сумма</th>
                    <th className="p-4">Дата</th>
                    <th className="p-4">Статус</th>
                    <th className="p-4 text-right">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e1e3e4]">
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map((req) => (
                      <tr
                        key={req.id}
                        onClick={() => setSelectedRequestModal(req)}
                        className="hover:bg-[#F2F2F2]/70 cursor-pointer transition-colors"
                      >
                        <td className="p-4 font-mono font-bold text-[#1A1A1B]">{req.id}</td>
                        <td className="p-4 font-semibold text-[#1A1A1B]">{req.customerName}</td>
                        <td className="p-4 font-mono text-[#434656]">{req.phoneNumber}</td>
                        <td className="p-4 font-mono font-bold text-[#0052ff]">
                          {req.telegramUsername || '-'}
                        </td>
                        <td className="p-4 max-w-[180px] truncate font-medium text-[#1A1A1B]">
                          {req.productName || 'Не указано'}
                        </td>
                        <td className="p-4 font-extrabold text-[#1A1A1B]">
                          {req.productPrice ? formatPrice(req.productPrice) : '-'}
                        </td>
                        <td className="p-4 text-[#71717A]">{formatDate(req.createdAt)}</td>
                        <td className="p-4">{renderStitchStatusBadge(req.status)}</td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={req.status}
                            onChange={(e) =>
                              updateRequestStatus(req.id, e.target.value as RequestStatus)
                            }
                            className="bg-[#f3f4f5] border border-[#c3c5d9]/60 text-xs text-[#1A1A1B] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 font-medium"
                          >
                            <option value="new">Новая</option>
                            <option value="in_progress">В процессе</option>
                            <option value="completed">Успешно (Продано)</option>
                            <option value="closed">Закрыта (Отказ)</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-10 text-center text-[#71717A]">
                        Заявки по выбранному фильтру не найдены.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: CATALOG ================= */}
        {adminTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-[#1A1A1B] tracking-tight">Каталог кресел</h2>
                <p className="text-xs text-[#71717A] mt-0.5 font-medium">Управление товарами, ценами и загрузкой фото в Supabase Storage</p>
              </div>

              <button
                onClick={() => {
                  setEditingProduct({
                    name: '',
                    category: 'ergonomic',
                    categoryLabel: 'Эргономичное',
                    price: 2800000,
                    description: '',
                    images: [],
                    isPopular: true,
                    inStock: true,
                  });
                  setIsProductModalOpen(true);
                }}
                className="bg-[#0052ff] text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-md shadow-[#0052ff]/20 hover:bg-[#004ced] transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить кресло</span>
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productsList.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-[#e1e3e4] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-3 flex flex-col justify-between"
                >
                  <div className="p-5 space-y-3">
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#F2F2F2]">
                      <img
                        src={product.images[0] || '/chair.jpg'}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {product.isPopular && (
                        <span className="absolute top-3 left-3 bg-[#0052ff] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                          <Sparkles className="w-3 h-3 fill-white" />
                          <span>Топ подборка</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-extrabold text-[#0052ff] tracking-wider">
                        {product.categoryLabel}
                      </span>
                      <h3 className="font-bold text-sm text-[#1A1A1B] line-clamp-1">{product.name}</h3>
                      <p className="text-xs text-[#71717A] line-clamp-2 mt-1">{product.description}</p>
                    </div>

                    <div className="font-extrabold text-base text-[#1A1A1B] font-mono">
                      {formatPrice(product.price)}
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-[#e1e3e4] flex items-center justify-between gap-2 mt-auto">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setIsProductModalOpen(true);
                      }}
                      className="flex-1 py-2.5 rounded-full bg-[#f3f4f5] hover:bg-[#e7e8e9] text-[#1A1A1B] text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Edit3 className="w-4 h-4 text-[#0052ff]" />
                      <span>Редактировать</span>
                    </button>

                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2.5 rounded-full bg-[#ffdad6]/60 text-[#ba1a1a] hover:bg-[#ffdad6] transition-all"
                      title="Удалить кресло"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: MARKETING / REELS ================= */}
        {adminTab === 'media' && (
          <div className="bg-white rounded-2xl border border-[#e1e3e4] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#e1e3e4] pb-4">
              <div>
                <h2 className="font-bold text-lg text-[#1A1A1B]">
                  Настройка баннеров и Instagram Reels
                </h2>
                <p className="text-xs text-[#71717A]">
                  Управление рекламным промо-блоком и ссылкой на видеообзор в Instagram
                </p>
              </div>

              {saveSuccessMessage && (
                <div className="flex items-center gap-2 text-xs font-bold text-[#166534] bg-[#dcfce7] px-4 py-2 rounded-full border border-[#059669]/20">
                  <CheckCircle2 className="w-4 h-4 text-[#166534]" />
                  <span>{saveSuccessMessage}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="bg-[#f8f9fa] p-5 rounded-2xl border border-[#e1e3e4] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#0052ff] font-bold text-sm">
                    <Instagram className="w-4 h-4 text-[#0052ff]" />
                    <span>Блок Instagram Reels / Stories Review</span>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-[#1A1A1B] font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editReelsActive}
                      onChange={(e) => setEditReelsActive(e.target.checked)}
                      className="rounded border-[#c3c5d9] bg-white text-[#0052ff] focus:ring-[#0052ff] w-4 h-4"
                    />
                    <span>Отображать блок на Главной странице</span>
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-[#71717A] font-semibold mb-1">
                      Бейдж Reels (например: «Новинка»)
                    </label>
                    <input
                      type="text"
                      value={editReelsBadge}
                      onChange={(e) => setEditReelsBadge(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#c3c5d9]/60 text-xs text-[#1A1A1B] focus:ring-2 focus:ring-[#0052ff]/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#71717A] font-semibold mb-1">
                      Текст на баннере
                    </label>
                    <input
                      type="text"
                      value={editReelsTitle}
                      onChange={(e) => setEditReelsTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#c3c5d9]/60 text-xs text-[#1A1A1B] focus:ring-2 focus:ring-[#0052ff]/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#71717A] font-semibold mb-1">
                      Ссылка на Instagram Reel / Story
                    </label>
                    <input
                      type="text"
                      value={editReelsUrl}
                      onChange={(e) => setEditReelsUrl(e.target.value)}
                      placeholder="https://instagram.com/reel/..."
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#c3c5d9]/60 text-xs text-[#1A1A1B] font-mono focus:ring-2 focus:ring-[#0052ff]/20 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-full bg-[#0052ff] hover:bg-[#004ced] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[#0052ff]/20 transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>СОХРАНИТЬ ИЗМЕНЕНИЯ</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= TAB 5: ADMINS ================= */}
        {adminTab === 'admins' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-[#1A1A1B] tracking-tight">Администраторы</h2>
                <p className="text-xs text-[#71717A] mt-0.5 font-medium">Создание аккаунтов для менеджеров и права доступа</p>
              </div>

              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="bg-[#0052ff] text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-md shadow-[#0052ff]/20 hover:bg-[#004ced] transition-all flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Добавить админа</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#e1e3e4] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-[#e1e3e4] text-[#71717A] uppercase font-bold tracking-wider">
                    <th className="p-4">ID</th>
                    <th className="p-4">ФИО / Имя</th>
                    <th className="p-4">Логин</th>
                    <th className="p-4">Роль</th>
                    <th className="p-4">Статус</th>
                    <th className="p-4 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e1e3e4]">
                  {adminsList.map((adm) => (
                    <tr key={adm.id} className="hover:bg-[#F2F2F2]/60 transition-colors">
                      <td className="p-4 font-mono font-bold text-[#1A1A1B]">{adm.id}</td>
                      <td className="p-4 font-semibold text-[#1A1A1B]">{adm.fullName}</td>
                      <td className="p-4 font-mono font-bold text-[#0052ff]">@{adm.username}</td>
                      <td className="p-4 uppercase font-bold text-[10px] text-[#434656]">
                        {adm.role === 'superadmin' ? 'Суперадмин' : 'Менеджер'}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#dcfce7] text-[#166534]">
                          Активен
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {adm.role !== 'superadmin' && (
                          <button
                            onClick={() => handleDeleteAdmin(adm.id)}
                            className="p-1.5 rounded-full bg-[#ffdad6]/60 text-[#ba1a1a] hover:bg-[#ffdad6] transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ================= MODALS ================= */}

      {/* MODAL 1: REQUEST DETAIL MODAL */}
      {selectedRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 border border-[#e1e3e4] shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#e1e3e4] pb-4">
              <div>
                <span className="text-xs text-[#71717A] font-mono font-bold block">
                  Заявка #{selectedRequestModal.id}
                </span>
                <h3 className="font-bold text-lg text-[#1A1A1B]">Детали обращения клиента</h3>
              </div>
              <button
                onClick={() => setSelectedRequestModal(null)}
                className="p-2 rounded-full hover:bg-[#f3f4f5] text-[#71717A] hover:text-[#1A1A1B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Summary */}
            {selectedRequestModal.productName && (
              <div className="bg-[#f8f9fa] p-4 rounded-xl border border-[#e1e3e4] flex items-center gap-4">
                <img
                  src={selectedRequestModal.productImage || '/chair.jpg'}
                  alt={selectedRequestModal.productName}
                  className="w-14 h-14 object-cover rounded-xl bg-white border border-[#e1e3e4]"
                />
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-[#1A1A1B]">
                    {selectedRequestModal.productName}
                  </h4>
                  <span className="font-extrabold text-sm text-[#0052ff] font-mono">
                    {selectedRequestModal.productPrice ? formatPrice(selectedRequestModal.productPrice) : '-'}
                  </span>
                </div>
              </div>
            )}

            {/* Client Details Grid */}
            <div className="bg-[#f8f9fa] p-4 rounded-xl border border-[#e1e3e4] space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-[#71717A]">Имя клиента:</span>
                <span className="font-bold text-[#1A1A1B]">{selectedRequestModal.customerName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#71717A]">Телефон:</span>
                <a
                  href={`tel:${selectedRequestModal.phoneNumber.replace(/\s+/g, '')}`}
                  className="font-mono font-bold text-[#0052ff] hover:underline flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{selectedRequestModal.phoneNumber}</span>
                </a>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#71717A]">Telegram Никнейм:</span>
                {selectedRequestModal.telegramUsername ? (
                  <a
                    href={`https://t.me/${selectedRequestModal.telegramUsername.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono font-bold text-[#0052ff] hover:underline flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{selectedRequestModal.telegramUsername}</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                ) : (
                  <span className="text-[#71717A]">-</span>
                )}
              </div>

              <div className="flex justify-between">
                <span className="text-[#71717A]">Дата создания:</span>
                <span className="text-[#1A1A1B]">{formatDate(selectedRequestModal.createdAt)}</span>
              </div>

              {selectedRequestModal.notes && (
                <div className="pt-2 border-t border-[#e1e3e4]">
                  <span className="text-[#71717A] block mb-1">Комментарий к заказу:</span>
                  <p className="text-[#1A1A1B] bg-white p-3 rounded-lg border border-[#e1e3e4] italic">
                    "{selectedRequestModal.notes}"
                  </p>
                </div>
              )}
            </div>

            {/* Status Change Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#1A1A1B]">
                Изменить статус заявки:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'new', label: 'Новая', color: 'bg-[#fef3c7] text-[#92400e]' },
                  { id: 'in_progress', label: 'В процессе', color: 'bg-[#dfe3ff] text-[#0038b6]' },
                  { id: 'completed', label: 'Успешно', color: 'bg-[#dcfce7] text-[#166534]' },
                  { id: 'closed', label: 'Закрыта', color: 'bg-[#edeeef] text-[#5f5e5e]' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      updateRequestStatus(selectedRequestModal.id, st.id as RequestStatus);
                      setSelectedRequestModal((prev) => (prev ? { ...prev, status: st.id as RequestStatus } : null));
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${st.color} ${
                      selectedRequestModal.status === st.id ? 'ring-2 ring-[#0052ff] scale-105 shadow-sm' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedRequestModal(null)}
                className="px-6 py-2.5 rounded-full bg-[#f3f4f5] hover:bg-[#e7e8e9] text-[#1A1A1B] font-bold text-xs"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD/EDIT PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-white rounded-2xl p-6 border border-[#e1e3e4] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e1e3e4] pb-3">
              <h3 className="font-bold text-base text-[#1A1A1B]">
                {editingProduct?.id ? 'Редактировать кресло' : 'Добавить новое кресло в каталог'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#f3f4f5] text-[#71717A] hover:text-[#1A1A1B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#1A1A1B] mb-1">Название кресла *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct?.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="Например: Comet Ergo Pro White"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#f8f9fa] border border-[#c3c5d9]/60 text-[#1A1A1B] focus:ring-2 focus:ring-[#0052ff]/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1A1A1B] mb-1">Цена (сум) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct?.price || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    placeholder="3450000"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#f8f9fa] border border-[#c3c5d9]/60 text-[#1A1A1B] font-mono focus:ring-2 focus:ring-[#0052ff]/20 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#1A1A1B] mb-1">Категория *</label>
                  <select
                    value={editingProduct?.category || 'ergonomic'}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        category: e.target.value as any,
                        categoryLabel:
                          e.target.value === 'ergonomic'
                            ? 'Эргономичное'
                            : e.target.value === 'gaming'
                            ? 'Геймерское'
                            : e.target.value === 'office'
                            ? 'Офисное'
                            : 'Премиум',
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-[#f8f9fa] border border-[#c3c5d9]/60 text-[#1A1A1B] focus:ring-2 focus:ring-[#0052ff]/20 outline-none"
                  >
                    <option value="ergonomic">Эргономичное</option>
                    <option value="gaming">Геймерское</option>
                    <option value="office">Офисное</option>
                    <option value="executive">Премиум / Руководитель</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <label className="flex items-center gap-2 font-bold text-[#1A1A1B] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!editingProduct?.isPopular}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isPopular: e.target.checked })}
                      className="rounded border-[#c3c5d9] bg-white text-[#0052ff] w-4 h-4"
                    />
                    <span>В «Топ подборку»</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1A1A1B] mb-1">Описание кресла</label>
                <textarea
                  rows={3}
                  value={editingProduct?.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Опишите особенности кресла..."
                  className="w-full px-3 py-2.5 rounded-xl bg-[#f8f9fa] border border-[#c3c5d9]/60 text-[#1A1A1B] resize-none focus:ring-2 focus:ring-[#0052ff]/20 outline-none"
                />
              </div>

              {/* Photo Upload to Supabase Storage */}
              <div className="bg-[#f8f9fa] p-4 rounded-xl border border-[#e1e3e4] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#1A1A1B] flex items-center gap-2">
                    <Upload className="w-4 h-4 text-[#0052ff]" />
                    <span>Фотографии кресла (до 4 шт. в Supabase Storage)</span>
                  </label>
                  {uploadingImage && <span className="text-[#0052ff] animate-pulse text-[10px] font-bold">Загрузка...</span>}
                </div>

                <div className="flex items-center gap-3">
                  {editingProduct?.images?.map((url, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#c3c5d9] bg-white group">
                      <img src={url} alt="Chair" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setEditingProduct({
                            ...editingProduct,
                            images: editingProduct.images?.filter((_, i) => i !== idx),
                          })
                        }
                        className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {(editingProduct?.images?.length || 0) < 4 && (
                    <label className="w-16 h-16 rounded-lg border border-dashed border-[#c3c5d9] hover:border-[#0052ff] flex flex-col items-center justify-center cursor-pointer text-[#71717A] hover:text-[#0052ff] transition-all bg-white">
                      <Plus className="w-5 h-5" />
                      <span className="text-[9px] font-bold mt-0.5">Загрузить</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-[#f3f4f5] text-[#1A1A1B] font-bold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#004ced] text-white font-bold shadow-md shadow-[#0052ff]/20"
                >
                  Сохранить кресло
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD ADMIN USER MODAL */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 border border-[#e1e3e4] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e1e3e4] pb-3">
              <h3 className="font-bold text-base text-[#1A1A1B]">Добавить администратора</h3>
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#f3f4f5] text-[#71717A] hover:text-[#1A1A1B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#1A1A1B] mb-1">ФИО сотрудника *</label>
                <input
                  type="text"
                  required
                  value={newAdminUser.fullName}
                  onChange={(e) => setNewAdminUser({ ...newAdminUser, fullName: e.target.value })}
                  placeholder="Например: Алишер Валиев"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#f8f9fa] border border-[#c3c5d9]/60 text-[#1A1A1B] focus:ring-2 focus:ring-[#0052ff]/20 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1A1A1B] mb-1">Логин *</label>
                <input
                  type="text"
                  required
                  value={newAdminUser.username}
                  onChange={(e) => setNewAdminUser({ ...newAdminUser, username: e.target.value })}
                  placeholder="manager_alisher"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#f8f9fa] border border-[#c3c5d9]/60 text-[#1A1A1B] font-mono focus:ring-2 focus:ring-[#0052ff]/20 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1A1A1B] mb-1">Пароль *</label>
                <input
                  type="password"
                  required
                  value={newAdminUser.password}
                  onChange={(e) => setNewAdminUser({ ...newAdminUser, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#f8f9fa] border border-[#c3c5d9]/60 text-[#1A1A1B] font-mono focus:ring-2 focus:ring-[#0052ff]/20 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1A1A1B] mb-1">Роль</label>
                <select
                  value={newAdminUser.role}
                  onChange={(e) => setNewAdminUser({ ...newAdminUser, role: e.target.value as any })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#f8f9fa] border border-[#c3c5d9]/60 text-[#1A1A1B] focus:ring-2 focus:ring-[#0052ff]/20 outline-none"
                >
                  <option value="manager">Менеджер</option>
                  <option value="superadmin">Суперадминистратор</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-[#f3f4f5] text-[#1A1A1B] font-bold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#004ced] text-white font-bold shadow-md shadow-[#0052ff]/20"
                >
                  Создать аккаунт
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

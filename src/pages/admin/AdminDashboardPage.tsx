import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Monitor,
  ArrowLeft,
  LogOut,
  Search,
  Filter,
  Instagram,
  Sparkles,
  Layers,
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

  // Main Active Tab
  const [adminTab, setAdminTab] = useState<'dashboard' | 'requests' | 'catalog' | 'media' | 'admins'>('dashboard');

  // Requests state & filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequestModal, setSelectedRequestModal] = useState<LeadRequest | null>(null);

  // Dashboard time filter
  const [dashboardTimeFilter, setDashboardTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');

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

  // Settings
  const { reelsPromo, updateReelsPromo } = useSettings();
  const { requests, updateRequestStatus } = useRequests();

  // Reels Edit state
  const [editReelsTitle, setEditReelsTitle] = useState(reelsPromo.title);
  const [editReelsBadge, setEditReelsBadge] = useState(reelsPromo.badge);
  const [editReelsUrl, setEditReelsUrl] = useState(reelsPromo.instagramUrl);
  const [editReelsActive, setEditReelsActive] = useState(reelsPromo.isActive);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  // Sync products from Supabase if available
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

  // Filter requests based on time & status
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

  // Export Requests to CSV file
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

  // Handle Save Reels/Media
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
        // Fallback: create Object URL locally
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

    // Async save to Supabase
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

  // Delete Product & clean up
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это кресло из каталога?')) return;

    setProductsList((prev) => prev.filter((p) => p.id !== productId));
    try {
      await supabase.from('products').delete().eq('id', productId);
    } catch (err) {
      console.error('Delete product error:', err);
    }
  };

  // Add New Admin
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

  // Delete Admin
  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('Удалить этого администратора?')) return;
    setAdminsList((prev) => prev.filter((a) => a.id !== adminId));
    try {
      await supabase.from('admins').delete().eq('id', adminId);
    } catch (err) {
      console.warn('Delete admin fallback:', err);
    }
  };

  // Helper for Status Badges
  const renderStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>Новая</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>В обработке</span>
          </span>
        );
      case 'completed':
        return (
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Успешно (Продано)</span>
          </span>
        );
      case 'closed':
        return (
          <span className="bg-zinc-500/20 text-zinc-400 border border-zinc-500/30 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1">
            <X className="w-3 h-3" />
            <span>Закрыта (Отказ)</span>
          </span>
        );
    }
  };

  // Metrics for Dashboard & Requests
  const timeFilteredReqs = getFilteredRequestsByTime(requests);
  const totalCount = timeFilteredReqs.length;
  const newCount = timeFilteredReqs.filter((r) => r.status === 'new').length;
  const inProgressCount = timeFilteredReqs.filter((r) => r.status === 'in_progress').length;
  const completedCount = timeFilteredReqs.filter((r) => r.status === 'completed').length;
  const closedCount = timeFilteredReqs.filter((r) => r.status === 'closed').length;

  const totalRevenue = timeFilteredReqs
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + (r.productPrice || 0), 0);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700">
          <div className="flex items-center justify-center w-14 h-14 bg-primary/20 text-primary rounded-2xl mx-auto mb-4 border border-primary/30">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>

          <h2 className="font-bold text-2xl text-center text-white mb-1">
            Comet.Uz Admin Panel
          </h2>
          <p className="text-xs text-slate-400 text-center mb-6">
            Защищённый вход в Панель Управления Десктоп
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold text-center">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Пароль администратора
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Демо-пароль: <code className="text-slate-300 font-mono">admin123</code> или <code className="text-slate-300 font-mono">comet2026</code>
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm tracking-wide shadow-lg shadow-primary/30 transition-all"
            >
              ВОЙТИ В АДМИНКУ
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700/50 flex justify-center">
            <button
              onClick={onBackToApp}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Mobile Notice */}
      <div className="lg:hidden bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-bold flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <Monitor className="w-5 h-5 shrink-0" />
          <span>Панель администратора оптимизирована для десктопных экранов.</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="min-w-[1024px] max-w-[1440px] mx-auto p-6 space-y-6">
        {/* Header Bar */}
        <header className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Comet.Uz" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-bold text-lg text-white leading-none">
                Comet.Uz — Панель Управления
              </h1>
              <span className="text-xs text-slate-400">
                Десктопная админка • База данных Supabase Connected
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 p-1 rounded-xl flex items-center gap-1 border border-slate-800">
              <button
                onClick={() => setAdminTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  adminTab === 'dashboard' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Дашборд</span>
              </button>

              <button
                onClick={() => setAdminTab('requests')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  adminTab === 'requests' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Заявки ({requests.length})</span>
              </button>

              <button
                onClick={() => setAdminTab('catalog')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  adminTab === 'catalog' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Каталог ({productsList.length})</span>
              </button>

              <button
                onClick={() => setAdminTab('media')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  adminTab === 'media' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Instagram className="w-4 h-4 text-pink-400" />
                <span>Reels & Баннер</span>
              </button>

              <button
                onClick={() => setAdminTab('admins')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  adminTab === 'admins' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Админы ({adminsList.length})</span>
              </button>
            </div>

            <button
              onClick={onBackToApp}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>В Mini App</span>
            </button>

            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Выйти</span>
            </button>
          </div>
        </header>

        {/* TAB 1: DASHBOARD */}
        {adminTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Time Period Filter Bar */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-300">Период аналитики:</span>
              </div>
              <div className="flex items-center gap-2">
                {(['today', 'week', 'month', 'all'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setDashboardTimeFilter(period)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all uppercase tracking-wider ${
                      dashboardTimeFilter === period
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {period === 'today' ? 'Сегодня' : period === 'week' ? 'Неделя' : period === 'month' ? 'Месяц' : 'Все время'}
                  </button>
                ))}
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                  Всего обращений
                </span>
                <span className="text-3xl font-bold text-white">{totalCount}</span>
                <div className="absolute right-4 bottom-4 p-3 rounded-xl bg-slate-800/50 text-slate-400">
                  <Layers className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
                <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider block mb-1">
                  Новые заявки
                </span>
                <span className="text-3xl font-bold text-amber-400">{newCount}</span>
                <div className="absolute right-4 bottom-4 p-3 rounded-xl bg-amber-500/10 text-amber-400">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
                <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider block mb-1">
                  В обработке
                </span>
                <span className="text-3xl font-bold text-blue-400">{inProgressCount}</span>
                <div className="absolute right-4 bottom-4 p-3 rounded-xl bg-blue-500/10 text-blue-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden">
                <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider block mb-1">
                  Успешно (Продано)
                </span>
                <span className="text-3xl font-bold text-emerald-400">{completedCount}</span>
                <div className="absolute right-4 bottom-4 p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-zinc-800 relative overflow-hidden">
                <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
                  Закрыта (Отказ)
                </span>
                <span className="text-3xl font-bold text-zinc-400">{closedCount}</span>
                <div className="absolute right-4 bottom-4 p-3 rounded-xl bg-zinc-800 text-zinc-400">
                  <X className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Total Revenue & Chart Section */}
            <div className="grid grid-cols-3 gap-6">
              {/* Revenue Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Общая выручка продаж
                  </span>
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                  {formatPrice(totalRevenue)}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Рассчитано по всем успешно закрытым заявкам со статусом «Успешно» за выбранный период.
                </p>
              </div>

              {/* Status Breakdown Bar Visualizer */}
              <div className="col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span>Соотношение статусов заявок</span>
                </h3>

                {totalCount > 0 ? (
                  <div className="space-y-4 pt-2">
                    {/* Progress Bar */}
                    <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800 p-0.5">
                      <div
                        style={{ width: `${(completedCount / totalCount) * 100}%` }}
                        className="bg-emerald-500 h-full rounded-l-full transition-all"
                        title="Успешно"
                      />
                      <div
                        style={{ width: `${(inProgressCount / totalCount) * 100}%` }}
                        className="bg-blue-500 h-full transition-all"
                        title="В обработке"
                      />
                      <div
                        style={{ width: `${(newCount / totalCount) * 100}%` }}
                        className="bg-amber-500 h-full transition-all"
                        title="Новые"
                      />
                      <div
                        style={{ width: `${(closedCount / totalCount) * 100}%` }}
                        className="bg-zinc-600 h-full rounded-r-full transition-all"
                        title="Закрыто"
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-emerald-500" />
                        <span className="text-slate-300">
                          Успешно ({Math.round((completedCount / (totalCount || 1)) * 100)}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-blue-500" />
                        <span className="text-slate-300">
                          В обработке ({Math.round((inProgressCount / (totalCount || 1)) * 100)}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-amber-500" />
                        <span className="text-slate-300">
                          Новые ({Math.round((newCount / (totalCount || 1)) * 100)}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-zinc-600" />
                        <span className="text-slate-300">
                          Закрыта ({Math.round((closedCount / (totalCount || 1)) * 100)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    Нет данных по заявкам за этот период.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REQUESTS LIST */}
        {adminTab === 'requests' && (
          <div className="space-y-6">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold block mb-1">Всего заявок</span>
                <span className="text-2xl font-bold text-white">{requests.length}</span>
              </div>
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-amber-400 font-semibold block mb-1">Новые</span>
                <span className="text-2xl font-bold text-amber-400">
                  {requests.filter((r) => r.status === 'new').length}
                </span>
              </div>
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-blue-400 font-semibold block mb-1">В обработке</span>
                <span className="text-2xl font-bold text-blue-400">
                  {requests.filter((r) => r.status === 'in_progress').length}
                </span>
              </div>
              <div className="bg-slate-900 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                <span className="text-xs text-emerald-400 font-semibold block mb-1">Успешно</span>
                <span className="text-2xl font-bold text-emerald-400">
                  {requests.filter((r) => r.status === 'completed').length}
                </span>
              </div>
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-zinc-400 font-semibold block mb-1">Закрыта</span>
                <span className="text-2xl font-bold text-zinc-400">
                  {requests.filter((r) => r.status === 'closed').length}
                </span>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по имени, номеру, Telegram или ID..."
                  className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-400 font-semibold mr-1">Статус:</span>
                </div>
                {[
                  { id: 'all', label: 'Все' },
                  { id: 'new', label: 'Новые' },
                  { id: 'in_progress', label: 'В обработке' },
                  { id: 'completed', label: 'Успешно' },
                  { id: 'closed', label: 'Закрыта' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setFilterStatus(st.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filterStatus === st.id
                        ? 'bg-primary text-white shadow'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}

                <button
                  onClick={handleExportCSV}
                  className="ml-2 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="Скачать в CSV Excel"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Экспорт CSV</span>
                </button>
              </div>
            </div>

            {/* Requests Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">Клиент</th>
                    <th className="p-4">Телефон</th>
                    <th className="p-4">Telegram</th>
                    <th className="p-4">Товар</th>
                    <th className="p-4">Сумма</th>
                    <th className="p-4">Дата</th>
                    <th className="p-4">Статус</th>
                    <th className="p-4 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map((req) => (
                      <tr
                        key={req.id}
                        onClick={() => setSelectedRequestModal(req)}
                        className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        <td className="p-4 font-mono font-bold text-white">{req.id}</td>
                        <td className="p-4 font-semibold text-white">{req.customerName}</td>
                        <td className="p-4 font-mono">{req.phoneNumber}</td>
                        <td className="p-4 font-mono text-primary-fixed">
                          {req.telegramUsername || '-'}
                        </td>
                        <td className="p-4 max-w-[180px] truncate font-medium text-slate-200">
                          {req.productName || 'Не указано'}
                        </td>
                        <td className="p-4 font-extrabold text-white">
                          {req.productPrice ? formatPrice(req.productPrice) : '-'}
                        </td>
                        <td className="p-4 text-slate-400">{formatDate(req.createdAt)}</td>
                        <td className="p-4">{renderStatusBadge(req.status)}</td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={req.status}
                            onChange={(e) =>
                              updateRequestStatus(req.id, e.target.value as RequestStatus)
                            }
                            className="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="new">Новая</option>
                            <option value="in_progress">В обработке</option>
                            <option value="completed">Успешно</option>
                            <option value="closed">Закрыта</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-10 text-center text-slate-500">
                        Заявки по выбранному фильтру не найдены.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CATALOG (PRODUCTS CRUD & STORAGE) */}
        {adminTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div>
                <h2 className="font-bold text-base text-white">Управление каталогом кресел</h2>
                <p className="text-xs text-slate-400">
                  Добавление товаров, редактирование описания, загрузка фото в Supabase Storage
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingProduct({
                    name: '',
                    category: 'ergonomic',
                    categoryLabel: 'Эргономичное',
                    price: 2500000,
                    description: '',
                    images: [],
                    isPopular: true,
                    inStock: true,
                  });
                  setIsProductModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить кресло</span>
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-3 gap-6">
              {productsList.map((product) => (
                <div
                  key={product.id}
                  className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl space-y-3 flex flex-col justify-between"
                >
                  <div className="p-4 space-y-3">
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-950">
                      <img
                        src={product.images[0] || '/chair.jpg'}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {product.isPopular && (
                        <span className="absolute top-2 left-2 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                          <Sparkles className="w-3 h-3 fill-slate-950" />
                          <span>Топ подборка</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                        {product.categoryLabel}
                      </span>
                      <h3 className="font-bold text-sm text-white line-clamp-1">{product.name}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">{product.description}</p>
                    </div>

                    <div className="font-extrabold text-sm text-white font-mono">
                      {formatPrice(product.price)}
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-auto">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setIsProductModalOpen(true);
                      }}
                      className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Редактировать</span>
                    </button>

                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
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

        {/* TAB 4: REELS & BANNER */}
        {adminTab === 'media' && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="font-bold text-lg text-white">
                  Настройка баннеров и Instagram Reels
                </h2>
                <p className="text-xs text-slate-400">
                  Управление рекламным промо-блоком и ссылкой на видеообзор в Instagram
                </p>
              </div>

              {saveSuccessMessage && (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{saveSuccessMessage}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Instagram Reels Settings */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-pink-400 font-bold text-sm">
                    <Instagram className="w-4 h-4" />
                    <span>Блок Instagram Reels / Stories Review</span>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editReelsActive}
                      onChange={(e) => setEditReelsActive(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-primary focus:ring-primary w-4 h-4"
                    />
                    <span>Отображать блок на Главной странице</span>
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1">
                      Бейдж Reels (например: «Новинка»)
                    </label>
                    <input
                      type="text"
                      value={editReelsBadge}
                      onChange={(e) => setEditReelsBadge(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1">
                      Текст на баннере
                    </label>
                    <input
                      type="text"
                      value={editReelsTitle}
                      onChange={(e) => setEditReelsTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1">
                      Ссылка на Instagram Reel / Story
                    </label>
                    <input
                      type="text"
                      value={editReelsUrl}
                      onChange={(e) => setEditReelsUrl(e.target.value)}
                      placeholder="https://instagram.com/reel/..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Submit / Save Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>СОХРАНИТЬ ИЗМЕНЕНИЯ</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 5: ADMIN USERS */}
        {adminTab === 'admins' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div>
                <h2 className="font-bold text-base text-white">Управление администраторами</h2>
                <p className="text-xs text-slate-400">
                  Создание аккаунтов для менеджеров и распределение доступов
                </p>
              </div>

              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Добавить администратора</span>
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">ФИО / Имя</th>
                    <th className="p-4">Логин</th>
                    <th className="p-4">Роль</th>
                    <th className="p-4">Статус</th>
                    <th className="p-4 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {adminsList.map((adm) => (
                    <tr key={adm.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-white">{adm.id}</td>
                      <td className="p-4 font-semibold text-white">{adm.fullName}</td>
                      <td className="p-4 font-mono text-primary-fixed">@{adm.username}</td>
                      <td className="p-4 uppercase font-bold text-[10px]">
                        {adm.role === 'superadmin' ? 'Суперадмин' : 'Менеджер'}
                      </td>
                      <td className="p-4">
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          Активен
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {adm.role !== 'superadmin' && (
                          <button
                            onClick={() => handleDeleteAdmin(adm.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
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
      </div>

      {/* MODAL 1: REQUEST DETAIL MODAL */}
      {selectedRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs text-slate-400 font-mono font-bold block">
                  Заявка #{selectedRequestModal.id}
                </span>
                <h3 className="font-bold text-lg text-white">Детали обращения клиента</h3>
              </div>
              <button
                onClick={() => setSelectedRequestModal(null)}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Summary */}
            {selectedRequestModal.productName && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
                <img
                  src={selectedRequestModal.productImage || '/chair.jpg'}
                  alt={selectedRequestModal.productName}
                  className="w-14 h-14 object-cover rounded-xl bg-slate-900"
                />
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-white">
                    {selectedRequestModal.productName}
                  </h4>
                  <span className="font-extrabold text-sm text-emerald-400 font-mono">
                    {selectedRequestModal.productPrice ? formatPrice(selectedRequestModal.productPrice) : '-'}
                  </span>
                </div>
              </div>
            )}

            {/* Client Info Grid */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Имя клиента:</span>
                <span className="font-bold text-white">{selectedRequestModal.customerName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Телефон:</span>
                <a
                  href={`tel:${selectedRequestModal.phoneNumber.replace(/\s+/g, '')}`}
                  className="font-mono font-bold text-primary-fixed hover:underline flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{selectedRequestModal.phoneNumber}</span>
                </a>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Telegram Никнейм:</span>
                {selectedRequestModal.telegramUsername ? (
                  <a
                    href={`https://t.me/${selectedRequestModal.telegramUsername.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{selectedRequestModal.telegramUsername}</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Дата создания:</span>
                <span className="text-slate-300">{formatDate(selectedRequestModal.createdAt)}</span>
              </div>

              {selectedRequestModal.notes && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-400 block mb-1">Комментарий к заказу:</span>
                  <p className="text-slate-200 bg-slate-900 p-2.5 rounded-lg border border-slate-800 italic">
                    "{selectedRequestModal.notes}"
                  </p>
                </div>
              )}
            </div>

            {/* Status Change Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Изменить статус заявки:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'new', label: 'Новая', color: 'border-amber-500/40 text-amber-300' },
                  { id: 'in_progress', label: 'В обработке', color: 'border-blue-500/40 text-blue-300' },
                  { id: 'completed', label: 'Успешно', color: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10' },
                  { id: 'closed', label: 'Закрыта', color: 'border-zinc-700 text-zinc-400 bg-zinc-800/40' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      updateRequestStatus(selectedRequestModal.id, st.id as RequestStatus);
                      setSelectedRequestModal((prev) => (prev ? { ...prev, status: st.id as RequestStatus } : null));
                    }}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${st.color} ${
                      selectedRequestModal.status === st.id ? 'ring-2 ring-primary scale-105' : 'opacity-70 hover:opacity-100'
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
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD/EDIT PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">
                {editingProduct?.id ? 'Редактировать кресло' : 'Добавить новое кресло в каталог'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Название кресла *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct?.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="Например: Comet Ergo Pro White"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Цена (сум) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct?.price || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    placeholder="3450000"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Категория *</label>
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
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="ergonomic">Эргономичное</option>
                    <option value="gaming">Геймерское</option>
                    <option value="office">Офисное</option>
                    <option value="executive">Премиум / Руководитель</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <label className="flex items-center gap-2 font-semibold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!editingProduct?.isPopular}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isPopular: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-950 text-primary w-4 h-4"
                    />
                    <span>В «Топ подборку»</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Описание кресла</label>
                <textarea
                  rows={3}
                  value={editingProduct?.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Опишите особенности кресла..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white resize-none"
                />
              </div>

              {/* Photo Upload to Supabase Storage */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-primary" />
                    <span>Фотографии кресла (до 4 шт. в Supabase Storage)</span>
                  </label>
                  {uploadingImage && <span className="text-primary animate-pulse text-[10px]">Загрузка...</span>}
                </div>

                <div className="flex items-center gap-3">
                  {editingProduct?.images?.map((url, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 group">
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
                    <label className="w-16 h-16 rounded-lg border border-dashed border-slate-700 hover:border-primary flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-white transition-all bg-slate-900">
                      <Plus className="w-5 h-5" />
                      <span className="text-[9px] mt-0.5">Загрузить</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold shadow-lg shadow-primary/20"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Добавить нового администратора</h3>
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">ФИО сотрудника *</label>
                <input
                  type="text"
                  required
                  value={newAdminUser.fullName}
                  onChange={(e) => setNewAdminUser({ ...newAdminUser, fullName: e.target.value })}
                  placeholder="Например: Алишер Валиев"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Логин *</label>
                <input
                  type="text"
                  required
                  value={newAdminUser.username}
                  onChange={(e) => setNewAdminUser({ ...newAdminUser, username: e.target.value })}
                  placeholder="manager_alisher"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Пароль *</label>
                <input
                  type="password"
                  required
                  value={newAdminUser.password}
                  onChange={(e) => setNewAdminUser({ ...newAdminUser, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Роль</label>
                <select
                  value={newAdminUser.role}
                  onChange={(e) => setNewAdminUser({ ...newAdminUser, role: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="manager">Менеджер</option>
                  <option value="superadmin">Суперадминистратор</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold shadow-lg shadow-primary/20"
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

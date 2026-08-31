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
  Clock,
  ChevronRight,
  BarChart2,
  Tag,
  Lock,
  ChevronDown,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useRequests } from '../../context/RequestsContext';
import { useSettings } from '../../context/SettingsContext';
import { useCatalog } from '../../context/CatalogContext';
import { formatDate, formatPrice, formatPriceDots, parsePriceDots } from '../../utils/formatters';
import { LeadRequest, Product, AdminUser, RequestStatus, Category } from '../../types';
import { supabase } from '../../services/supabaseClient';

import { compressImage } from '../../utils/imageCompressor';

interface AdminDashboardPageProps {
  onBackToApp: () => void;
}

// Custom Styled Select Component (Replaces native unstyled OS selects)
interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, placeholder, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOpt = options.find((o) => o.value === value) || options[0];

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-white border border-[#c3c5d9] font-extrabold text-xs text-[#1A1A1B] shadow-sm hover:border-[#0052ff] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 transition-all cursor-pointer"
      >
        <span className="truncate">{selectedOpt?.label || placeholder || 'Выберите...'}</span>
        <ChevronDown className={`w-4 h-4 text-[#71717A] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-[#e1e3e4] rounded-2xl shadow-xl py-2 max-h-60 overflow-y-auto animate-fade-in">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs font-extrabold flex items-center justify-between transition-colors ${
                  opt.value === value ? 'bg-[#EBF2FF] text-[#0052ff]' : 'text-[#1A1A1B] hover:bg-[#f8f9fa]'
                }`}
              >
                <span>{opt.label}</span>
                {opt.value === value && <Check className="w-4 h-4 text-[#0052ff]" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onBackToApp }) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<'superadmin' | 'manager'>('superadmin');

  // Main Active Sidebar Tab (Default: 'requests')
  const [adminTab, setAdminTab] = useState<'requests' | 'dashboard' | 'catalog' | 'media' | 'admins'>('requests');

  // Requests state & filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequestModal, setSelectedRequestModal] = useState<LeadRequest | null>(null);

  // Dashboard time filter & selected year
  const [dashboardTimeFilter, setDashboardTimeFilter] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('today');
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Context & Catalog State
  const { products, categories, addProduct, updateProduct, deleteProduct, addCategory, deleteCategory } = useCatalog();
  const { reelsPromo, updateReelsPromo } = useSettings();
  const { requests, updateRequestStatus } = useRequests();

  // Product Edit State
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingPriceFormatted, setEditingPriceFormatted] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [directUrlInput, setDirectUrlInput] = useState('');

  // Deletion PIN Modal '1111'
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'product' | 'category' | 'admin'; id: string; name: string } | null>(null);
  const [securityPinInput, setSecurityPinInput] = useState('');
  const [securityPinError, setSecurityPinError] = useState('');

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

  // Reels & Banner Edit state
  const [editReelsTitle, setEditReelsTitle] = useState(reelsPromo.title || '');
  const [editReelsBadge, setEditReelsBadge] = useState(reelsPromo.badge || '');
  const [editReelsUrl, setEditReelsUrl] = useState(reelsPromo.instagramUrl || '');
  const [editReelsCover, setEditReelsCover] = useState(reelsPromo.coverImage || '/chair.jpg');
  const [editReelsActive, setEditReelsActive] = useState(reelsPromo.isActive ?? true);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  // Sync ReelsPromo state whenever reelsPromo context changes
  useEffect(() => {
    setEditReelsTitle(reelsPromo.title || '');
    setEditReelsBadge(reelsPromo.badge || '');
    setEditReelsUrl(reelsPromo.instagramUrl || '');
    setEditReelsCover(reelsPromo.coverImage || '/chair.jpg');
    setEditReelsActive(reelsPromo.isActive ?? true);
  }, [reelsPromo]);

  // Fetch Admins from Supabase on mount
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
            isActive: a.is_active ?? true,
            createdAt: a.created_at || new Date().toISOString(),
          }));
          setAdminsList(mapped);
        }
      } catch (err) {
        console.warn('Admins fetch fallback:', err);
      }
    };
    fetchAdmins();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123' || password === 'comet2026') {
      setIsAuthenticated(true);
      setCurrentUserRole('superadmin');
      setLoginError('');
    } else if (password === 'manager123') {
      setIsAuthenticated(true);
      setCurrentUserRole('manager');
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
      if (dashboardTimeFilter === 'quarter') {
        const qMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        return created >= qMonthsAgo;
      }
      if (dashboardTimeFilter === 'year') {
        return created.getFullYear() === selectedYear;
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

  // Save Banner & Reels Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateReelsPromo({
      ...reelsPromo,
      title: editReelsTitle,
      badge: editReelsBadge,
      instagramUrl: editReelsUrl,
      coverImage: editReelsCover,
      isActive: editReelsActive,
    });
    setSaveSuccessMessage('Настройки баннера и Reels успешно сохранены!');
    setTimeout(() => setSaveSuccessMessage(''), 3000);
  };

  // Multi-file Image Upload to Supabase Storage with WebP Auto-Compression
  const handleMultiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const originalFile = files[i];
        // ⚡ Compress image client-side to WebP format (~100KB)
        const compressedFile = await compressImage(originalFile, 1200, 1200, 0.82);

        const fileName = `chair_${Date.now()}_${i}.webp`;
        const { data, error } = await supabase.storage.from('chairs-media').upload(fileName, compressedFile, {
          contentType: 'image/webp',
          upsert: true,
        });

        if (!error && data) {
          const { data: publicData } = supabase.storage.from('chairs-media').getPublicUrl(fileName);
          uploadedUrls.push(publicData.publicUrl);
        } else {
          uploadedUrls.push(URL.createObjectURL(compressedFile));
        }
      }

      setEditingProduct((prev) => ({
        ...prev,
        images: [...(prev?.images || []), ...uploadedUrls].slice(0, 4),
      }));
    } catch (err) {
      console.error('Multi upload error:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  // Banner Cover Upload with WebP Auto-Compression
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      // ⚡ Compress banner image client-side
      const compressedFile = await compressImage(file, 1400, 900, 0.85);
      const fileName = `banner_${Date.now()}.webp`;
      const { data, error } = await supabase.storage.from('chairs-media').upload(fileName, compressedFile, {
        contentType: 'image/webp',
        upsert: true,
      });

      if (!error && data) {
        const { data: publicData } = supabase.storage.from('chairs-media').getPublicUrl(fileName);
        setEditReelsCover(publicData.publicUrl);
      } else {
        setEditReelsCover(URL.createObjectURL(compressedFile));
      }
    } catch (err) {
      console.error('Banner upload error:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  // Save Product (Add / Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawPrice = parsePriceDots(editingPriceFormatted);
    if (!editingProduct?.name || !rawPrice) return;

    const isNew = !editingProduct.id;
    const prodId = editingProduct.id || `comet-chair-${Date.now()}`;

    const categoryObj = categories.find((c) => c.slug === editingProduct.category || c.name === editingProduct.categoryLabel);

    const savedProd: Product = {
      id: prodId,
      name: editingProduct.name || 'Новое кресло',
      category: (editingProduct.category as any) || 'ergonomic',
      categoryLabel: categoryObj?.name || editingProduct.categoryLabel || 'Эргономичное',
      price: rawPrice,
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
      await addProduct(savedProd);
    } else {
      await updateProduct(savedProd);
    }

    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  // Open Delete Confirmation Modal
  const requestDelete = (type: 'product' | 'category' | 'admin', id: string, name: string) => {
    setDeleteTarget({ type, id, name });
    setSecurityPinInput('');
    setSecurityPinError('');
  };

  // Confirm Delete with PIN '1111'
  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (securityPinInput !== '1111') {
      setSecurityPinError('Неверный код подтверждения! Введите 1111');
      return;
    }

    if (!deleteTarget) return;

    if (deleteTarget.type === 'product') {
      // Find product to clean up images from Supabase Storage
      const prodToDelete = products.find((p) => p.id === deleteTarget.id);
      if (prodToDelete?.images) {
        for (const imgUrl of prodToDelete.images) {
          if (imgUrl.includes('/chairs-media/')) {
            const fileName = imgUrl.split('/chairs-media/').pop();
            if (fileName) {
              await supabase.storage.from('chairs-media').remove([fileName]);
            }
          }
        }
      }
      await deleteProduct(deleteTarget.id);
    } else if (deleteTarget.type === 'category') {
      await deleteCategory(deleteTarget.id);
    } else if (deleteTarget.type === 'admin') {
      const targetAdmin = adminsList.find((a) => a.id === deleteTarget.id);
      setAdminsList((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      if (targetAdmin) {
        try {
          await supabase.from('admins').delete().eq('username', targetAdmin.username);
        } catch (err) {
          console.warn('Delete admin fallback:', err);
        }
      }
    }

    setDeleteTarget(null);
  };

  // Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    const slug = newCategoryName.toLowerCase().replace(/\s+/g, '-');
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: newCategoryName.trim(),
      slug: slug,
      count: 0,
      iconName: 'Armchair',
    };

    await addCategory(newCat);
    setNewCategoryName('');
    setIsCategoryModalOpen(false);
  };

  // Add Admin User
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUserRole !== 'superadmin') return;
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

  // Status Badge Helper
  const renderStitchStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-[#fef3c7] text-[#92400e]">
            Новая
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-[#dfe3ff] text-[#0038b6]">
            В процессе
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-[#dcfce7] text-[#166534]">
            Успешно (Продано)
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-[#edeeef] text-[#5f5e5e]">
            Закрыта (Отказ)
          </span>
        );
    }
  };

  // Metrics
  const timeFilteredReqs = getFilteredRequestsByTime(requests);
  const totalCount = timeFilteredReqs.length;
  const newCount = timeFilteredReqs.filter((r) => r.status === 'new').length;
  const inProgressCount = timeFilteredReqs.filter((r) => r.status === 'in_progress').length;
  const completedCount = timeFilteredReqs.filter((r) => r.status === 'completed').length;
  const closedCount = timeFilteredReqs.filter((r) => r.status === 'closed').length;

  const totalRevenue = timeFilteredReqs
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + (r.productPrice || 0), 0);

  // Dynamic Chart Datasets for Recharts
  const chartDataArea =
    dashboardTimeFilter === 'today'
      ? [
          { time: '08:00', sales: 12, revenue: 33600000 },
          { time: '10:00', sales: 24, revenue: 67200000 },
          { time: '12:00', sales: 38, revenue: 106400000 },
          { time: '14:00', sales: 45, revenue: 126000000 },
          { time: '16:00', sales: 52, revenue: 145600000 },
          { time: '18:00', sales: 61, revenue: 170800000 },
          { time: '20:00', sales: 54, revenue: 151200000 },
          { time: '22:00', sales: 70, revenue: 196000000 },
        ]
      : dashboardTimeFilter === 'week'
      ? [
          { time: 'Пн', sales: 18, revenue: 50400000 },
          { time: 'Вт', sales: 32, revenue: 89600000 },
          { time: 'Ср', sales: 45, revenue: 126000000 },
          { time: 'Чт', sales: 40, revenue: 112000000 },
          { time: 'Пт', sales: 65, revenue: 182000000 },
          { time: 'Сб', sales: 88, revenue: 246400000 },
          { time: 'Вс', sales: 75, revenue: 210000000 },
        ]
      : dashboardTimeFilter === 'month'
      ? [
          { time: '1-5 числа', sales: 42, revenue: 117600000 },
          { time: '6-10 числа', sales: 78, revenue: 218400000 },
          { time: '11-15 числа', sales: 95, revenue: 266000000 },
          { time: '16-20 числа', sales: 110, revenue: 308000000 },
          { time: '21-25 числа', sales: 140, revenue: 392000000 },
          { time: '26-31 числа', sales: 165, revenue: 462000000 },
        ]
      : [
          { time: 'Янв', sales: 85, revenue: 238000000 },
          { time: 'Фев', sales: 92, revenue: 257600000 },
          { time: 'Мар', sales: 120, revenue: 336000000 },
          { time: 'Апр', sales: 110, revenue: 308000000 },
          { time: 'Май', sales: 135, revenue: 378000000 },
          { time: 'Июн', sales: 150, revenue: 420000000 },
          { time: 'Июл', sales: 140, revenue: 392000000 },
          { time: 'Авг', sales: 160, revenue: 448000000 },
          { time: 'Сен', sales: 175, revenue: 490000000 },
          { time: 'Окт', sales: 190, revenue: 532000000 },
          { time: 'Ноя', sales: 210, revenue: 588000000 },
          { time: 'Дек', sales: 250, revenue: 700000000 },
        ];

  const chartDataBar = [
    { name: 'Q1 (Янв-Мар)', sales: 297, revenue: 831600000 },
    { name: 'Q2 (Апр-Июн)', sales: 395, revenue: 1106000000 },
    { name: 'Q3 (Июл-Сен)', sales: 475, revenue: 1330000000 },
    { name: 'Q4 (Окт-Дек)', sales: 650, revenue: 1820000000 },
  ];

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d] flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-[0_4px_25px_rgba(0,0,0,0.06)] border border-[#e1e3e4]">
          <div className="flex items-center justify-center w-14 h-14 bg-[#0052ff]/10 text-[#0052ff] rounded-2xl mx-auto mb-4 border border-[#0052ff]/20">
            <ShieldCheck className="w-8 h-8 text-[#0052ff]" />
          </div>

          <h2 className="font-extrabold text-2xl text-center text-[#1A1A1B] mb-1">
            CometAdmin
          </h2>
          <p className="text-xs text-[#71717A] text-center mb-6 font-extrabold">
            Seating Solutions • Десктопная панель
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-extrabold text-center">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-extrabold text-[#1A1A1B] mb-1">
                Пароль администратора
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль..."
                className="w-full px-4 py-3 rounded-xl bg-[#f3f4f5] border border-[#c3c5d9]/60 text-sm text-[#1A1A1B] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/30 font-mono font-bold"
              />
              <span className="text-[10px] text-[#71717A] mt-1 block font-bold">
                Пароль Суперадмина: <code className="text-[#1A1A1B] font-bold font-mono">admin123</code> | Менеджера: <code className="text-[#1A1A1B] font-bold font-mono">manager123</code>
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-[#0052ff] hover:bg-[#004ced] text-white font-extrabold text-sm tracking-wide shadow-md shadow-[#0052ff]/25 transition-all"
            >
              ВОЙТИ В АДМИНКУ
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#e1e3e4] flex justify-center">
            <button
              onClick={onBackToApp}
              className="text-xs text-[#71717A] hover:text-[#0052ff] flex items-center gap-1.5 transition-colors font-extrabold"
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
      {/* 1. STITCH SIDEBAR (Requests FIRST) */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-[#f3f4f5] flex flex-col py-4 px-4 z-50 border-r border-[#c3c5d9]/30">
        <div className="flex items-center gap-3 px-2 mb-6">
          <div className="w-10 h-10 bg-[#0052ff] rounded-2xl flex items-center justify-center text-white shadow-md">
            <Armchair className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-base text-[#003ec7] leading-tight">CometAdmin</h1>
            <p className="text-[10px] text-[#71717A] uppercase font-black tracking-wider">Seating Solutions</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1.5">
          <button
            onClick={() => setAdminTab('requests')}
            className={`flex items-center justify-between px-4 py-3 rounded-xl font-extrabold text-xs transition-all ${
              adminTab === 'requests'
                ? 'bg-[#0052ff] text-white shadow-md shadow-[#0052ff]/20'
                : 'text-[#434656] hover:bg-[#e7e8e9] hover:text-[#1A1A1B]'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5" />
              <span>Заявки клиентов</span>
            </div>
            {newCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                adminTab === 'requests' ? 'bg-white text-[#0052ff]' : 'bg-[#0052ff] text-white'
              }`}>
                {newCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setAdminTab('dashboard')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-extrabold text-xs transition-all ${
              adminTab === 'dashboard'
                ? 'bg-[#0052ff] text-white shadow-md shadow-[#0052ff]/20'
                : 'text-[#434656] hover:bg-[#e7e8e9] hover:text-[#1A1A1B]'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Дашборд аналитики</span>
          </button>

          <button
            onClick={() => setAdminTab('catalog')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-extrabold text-xs transition-all ${
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
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-extrabold text-xs transition-all ${
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
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-extrabold text-xs transition-all ${
              adminTab === 'admins'
                ? 'bg-[#0052ff] text-white shadow-md shadow-[#0052ff]/20'
                : 'text-[#434656] hover:bg-[#e7e8e9] hover:text-[#1A1A1B]'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Администраторы</span>
          </button>
        </nav>

        <div className="mt-auto border-t border-[#c3c5d9]/30 pt-3 space-y-1">
          <button
            onClick={onBackToApp}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[#434656] hover:bg-[#e7e8e9] hover:text-[#1A1A1B] transition-colors rounded-xl font-extrabold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>В Mini App</span>
          </button>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[#ba1a1a] hover:bg-[#ffdad6]/60 transition-colors rounded-xl font-black"
          >
            <LogOut className="w-4 h-4" />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* 2. TOP HEADER */}
      <nav className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 bg-white/80 backdrop-blur-md shadow-sm border-b border-[#c3c5d9]/30 z-40 px-6 flex justify-between items-center">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени, номеру или ID..."
              className="w-full pl-10 pr-4 py-2 bg-[#f3f4f5] border-none rounded-full text-xs text-[#1A1A1B] font-extrabold focus:ring-2 focus:ring-[#0052ff]/20 outline-none placeholder-[#71717A]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border-l border-[#c3c5d9]/40 pl-4">
            <div className="w-8 h-8 rounded-full bg-[#0052ff] text-white flex items-center justify-center font-black text-xs shadow-sm">
              {currentUserRole === 'superadmin' ? 'SA' : 'M'}
            </div>
            <div className="text-left hidden sm:block">
              <span className="block text-xs font-black text-[#1A1A1B] leading-none">
                {currentUserRole === 'superadmin' ? 'Главный Суперадмин' : 'Менеджер'}
              </span>
              <span className="text-[10px] text-[#71717A] font-bold">Comet.Uz Admin</span>
            </div>
          </div>
        </div>
      </nav>

      {/* 3. MAIN CANVAS */}
      <main className="ml-64 mt-16 p-8 flex-1 min-h-[calc(100vh-4rem)] max-w-[1600px] space-y-6">

        {/* ================= TAB 1: REQUESTS ================= */}
        {adminTab === 'requests' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-[#1A1A1B] tracking-tight">Заявки клиентов</h2>
                <p className="text-xs text-[#71717A] mt-0.5 font-bold">Поступающие обращения из Telegram Mini App</p>
              </div>

              <button
                onClick={handleExportCSV}
                className="bg-[#0052ff] text-white px-6 py-2.5 rounded-full text-xs font-black shadow-md shadow-[#0052ff]/20 hover:bg-[#004ced] transition-all flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Скачать CSV (Excel)</span>
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#e1e3e4] shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1 max-w-md bg-[#f3f4f5] px-4 py-2 rounded-full border border-[#c3c5d9]/40">
                <Search className="w-4 h-4 text-[#71717A]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по имени, номеру, Telegram..."
                  className="bg-transparent border-none text-xs text-[#1A1A1B] font-extrabold placeholder-[#71717A] focus:outline-none w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#71717A]" />
                <span className="text-xs text-[#71717A] font-black mr-1">Статус:</span>
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
                    className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
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

            <div className="bg-white rounded-2xl border border-[#e1e3e4] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-[#e1e3e4] text-[#71717A] uppercase font-black tracking-wider">
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
                        <td className="p-4 font-mono font-black text-[#1A1A1B]">{req.id}</td>
                        <td className="p-4 font-black text-[#1A1A1B]">{req.customerName}</td>
                        <td className="p-4 font-mono font-extrabold text-[#434656]">{req.phoneNumber}</td>
                        <td className="p-4 font-mono font-black text-[#0052ff]">
                          {req.telegramUsername || '-'}
                        </td>
                        <td className="p-4 max-w-[180px] truncate font-extrabold text-[#1A1A1B]">
                          {req.productName || 'Не указано'}
                        </td>
                        <td className="p-4 font-black text-[#1A1A1B]">
                          {req.productPrice ? formatPrice(req.productPrice) : '-'}
                        </td>
                        <td className="p-4 text-[#71717A] font-extrabold">{formatDate(req.createdAt)}</td>
                        <td className="p-4">{renderStitchStatusBadge(req.status)}</td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <CustomSelect
                            value={req.status}
                            options={[
                              { value: 'new', label: 'Новая' },
                              { value: 'in_progress', label: 'В процессе' },
                              { value: 'completed', label: 'Успешно (Продано)' },
                              { value: 'closed', label: 'Закрыта (Отказ)' },
                            ]}
                            onChange={(val) => updateRequestStatus(req.id, val as RequestStatus)}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-10 text-center text-[#71717A] font-extrabold">
                        Заявки по выбранному фильтру не найдены.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 2: DASHBOARD ================= */}
        {adminTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black text-[#1A1A1B] tracking-tight">Дашборд аналитики</h2>
                <p className="text-xs text-[#71717A] mt-0.5 font-bold">Интерактивный анализ продаж и динамики заявок</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-[#e7e8e9] rounded-xl p-1">
                  {(['today', 'week', 'month', 'quarter', 'year'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setDashboardTimeFilter(period)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                        dashboardTimeFilter === period
                          ? 'bg-white text-[#1A1A1B] shadow-sm'
                          : 'text-[#434656] hover:text-[#1A1A1B]'
                      }`}
                    >
                      {period === 'today'
                        ? 'Сегодня'
                        : period === 'week'
                        ? 'Неделя'
                        : period === 'month'
                        ? 'Месяц'
                        : period === 'quarter'
                        ? 'Квартал'
                        : 'Год'}
                    </button>
                  ))}
                </div>

                {dashboardTimeFilter === 'year' && (
                  <CustomSelect
                    value={String(selectedYear)}
                    options={[
                      { value: '2026', label: '2026 год' },
                      { value: '2025', label: '2025 год' },
                      { value: '2024', label: '2024 год' },
                    ]}
                    onChange={(val) => setSelectedYear(Number(val))}
                  />
                )}
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#e1e3e4] flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-[#fef3c7] rounded-xl text-[#92400e]">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="flex items-center text-xs text-[#059669] bg-[#059669]/10 px-2 py-0.5 rounded-full font-black">
                    <TrendingUp className="w-3.5 h-3.5 mr-1" /> +12%
                  </span>
                </div>
                <div>
                  <p className="text-[#71717A] text-xs font-extrabold">Новые заявки</p>
                  <p className="text-2xl font-black text-[#1A1A1B] mt-0.5">{newCount}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#e1e3e4] flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-[#dfe3ff] rounded-xl text-[#0038b6]">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <p className="text-[#71717A] text-xs font-extrabold">В процессе обработки</p>
                  <p className="text-2xl font-black text-[#1A1A1B] mt-0.5">{inProgressCount}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#e1e3e4] flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-[#dcfce7] rounded-xl text-[#166534]">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="flex items-center text-xs text-[#059669] bg-[#059669]/10 px-2 py-0.5 rounded-full font-black">
                    <TrendingUp className="w-3.5 h-3.5 mr-1" /> +5%
                  </span>
                </div>
                <div>
                  <p className="text-[#71717A] text-xs font-extrabold">Успешно продано</p>
                  <p className="text-2xl font-black text-[#166534] mt-0.5">{completedCount}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#e1e3e4] flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-[#EBF2FF] rounded-xl text-[#0052ff]">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <p className="text-[#71717A] text-xs font-extrabold">Выручка продаж</p>
                  <p className="text-xl font-black text-[#0052ff] font-mono mt-0.5">{formatPrice(totalRevenue)}</p>
                </div>
              </div>
            </div>

            {/* REAL RECHARTS CHART COMPONENT */}
            <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#e1e3e4] p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-black text-lg text-[#1A1A1B]">
                    {dashboardTimeFilter === 'quarter' ? 'Столбчатый график продаж по кварталам' : 'Интерактивный график динамики продаж'}
                  </h3>
                  <p className="text-xs text-[#71717A] font-extrabold">
                    {dashboardTimeFilter === 'today'
                      ? 'Динамика заказов по часам за сегодня'
                      : dashboardTimeFilter === 'week'
                      ? 'Продажи по дням недели'
                      : dashboardTimeFilter === 'month'
                      ? 'Продажи по дням месяца'
                      : dashboardTimeFilter === 'quarter'
                      ? 'Продажи по кварталам Q1 - Q4'
                      : `Продажи по месяцам за ${selectedYear} год`}
                  </p>
                </div>
                <span className="text-xs font-black text-[#0052ff] bg-[#EBF2FF] px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                  <BarChart2 className="w-4 h-4" />
                  <span>{dashboardTimeFilter === 'quarter' ? 'Bar Chart' : 'Area Chart'}</span>
                </span>
              </div>

              <div className="w-full h-72 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  {dashboardTimeFilter === 'quarter' ? (
                    <BarChart data={chartDataBar}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1e3e4" />
                      <XAxis dataKey="name" stroke="#71717A" fontSize={11} fontWeight={700} />
                      <YAxis stroke="#71717A" fontSize={11} fontWeight={700} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e1e3e4', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontWeight: 'bold' }}
                        formatter={(val: any) => [`${val} продаж`, 'Количество']}
                      />
                      <Bar dataKey="sales" fill="#0052ff" radius={[12, 12, 0, 0]} />
                    </BarChart>
                  ) : (
                    <AreaChart data={chartDataArea}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0052ff" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0052ff" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1e3e4" />
                      <XAxis dataKey="time" stroke="#71717A" fontSize={11} fontWeight={700} />
                      <YAxis stroke="#71717A" fontSize={11} fontWeight={700} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e1e3e4', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontWeight: 'bold' }}
                        formatter={(val: any) => [`${val} заявок`, 'Заказы']}
                      />
                      <Area type="monotone" dataKey="sales" stroke="#0052ff" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: CATALOG ================= */}
        {adminTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-[#1A1A1B] tracking-tight">Каталог кресел</h2>
                <p className="text-xs text-[#71717A] mt-0.5 font-bold">Управление товарами, категориями и выгрузкой фото в Supabase Storage</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="bg-[#f3f4f5] hover:bg-[#e7e8e9] text-[#1A1A1B] border border-[#c3c5d9] px-5 py-2.5 rounded-full text-xs font-black transition-all flex items-center gap-2"
                >
                  <Tag className="w-4 h-4 text-[#0052ff]" />
                  <span>Категории ({categories.length})</span>
                </button>

                <button
                  onClick={() => {
                    setEditingProduct({
                      name: '',
                      category: 'ergonomic',
                      categoryLabel: categories[0]?.name || 'Эргономичное',
                      price: 2800000,
                      description: '',
                      images: [],
                      isPopular: true,
                      inStock: true,
                    });
                    setEditingPriceFormatted('2.800.000');
                    setIsProductModalOpen(true);
                  }}
                  className="bg-[#0052ff] text-white px-6 py-2.5 rounded-full text-xs font-black shadow-md shadow-[#0052ff]/20 hover:bg-[#004ced] transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить кресло</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-3xl border border-[#e1e3e4] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-3 flex flex-col justify-between"
                >
                  <div className="p-5 space-y-3">
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#F2F2F2]">
                      <img
                        src={product.images[0] || '/chair.jpg'}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {product.isPopular && (
                        <span className="absolute top-3 left-3 bg-[#0052ff] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                          <Sparkles className="w-3 h-3 fill-white" />
                          <span>Топ подборка</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-black text-[#0052ff] tracking-wider">
                        {product.categoryLabel}
                      </span>
                      <h3 className="font-black text-base text-[#1A1A1B] line-clamp-1">{product.name}</h3>
                      <p className="text-xs text-[#71717A] line-clamp-2 mt-1 font-bold">{product.description}</p>
                    </div>

                    <div className="font-black text-lg text-[#1A1A1B] font-mono">
                      {formatPrice(product.price)}
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-[#e1e3e4] flex items-center justify-between gap-2 mt-auto">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setEditingPriceFormatted(formatPriceDots(product.price));
                        setIsProductModalOpen(true);
                      }}
                      className="flex-1 py-2.5 rounded-full bg-[#f3f4f5] hover:bg-[#e7e8e9] text-[#1A1A1B] text-xs font-black flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Edit3 className="w-4 h-4 text-[#0052ff]" />
                      <span>Редактировать</span>
                    </button>

                    <button
                      onClick={() => requestDelete('product', product.id, product.name)}
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
          <div className="bg-white rounded-3xl border border-[#e1e3e4] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#e1e3e4] pb-4">
              <div>
                <h2 className="font-black text-xl text-[#1A1A1B]">
                  Настройка Главного Баннера и Reels
                </h2>
                <p className="text-xs text-[#71717A] font-bold">
                  Загрузка изображения баннера, замена текста и ссылки на ролик в Instagram
                </p>
              </div>

              {saveSuccessMessage && (
                <div className="flex items-center gap-2 text-xs font-black text-[#166534] bg-[#dcfce7] px-4 py-2 rounded-full border border-[#059669]/20">
                  <CheckCircle2 className="w-4 h-4 text-[#166534]" />
                  <span>{saveSuccessMessage}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="bg-[#f8f9fa] p-6 rounded-3xl border border-[#e1e3e4] space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#0052ff] font-black text-sm">
                    <Instagram className="w-5 h-5 text-[#0052ff]" />
                    <span>Главный Промо-Баннер Reels</span>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-[#1A1A1B] font-black cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editReelsActive}
                      onChange={(e) => setEditReelsActive(e.target.checked)}
                      className="rounded border-[#c3c5d9] bg-white text-[#0052ff] focus:ring-[#0052ff] w-4 h-4"
                    />
                    <span>Показывать на Главной странице Mini App</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-[#71717A] font-black mb-1">
                        Текст бейджа (например: «Новинка»)
                      </label>
                      <input
                        type="text"
                        value={editReelsBadge}
                        onChange={(e) => setEditReelsBadge(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-white border border-[#c3c5d9]/60 text-xs text-[#1A1A1B] font-black focus:ring-2 focus:ring-[#0052ff]/20 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[#71717A] font-black mb-1">
                        Главный заголовок на баннере
                      </label>
                      <input
                        type="text"
                        value={editReelsTitle}
                        onChange={(e) => setEditReelsTitle(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-white border border-[#c3c5d9]/60 text-xs text-[#1A1A1B] font-black focus:ring-2 focus:ring-[#0052ff]/20 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[#71717A] font-black mb-1">
                        Ссылка на Instagram Reel / Story
                      </label>
                      <input
                        type="text"
                        value={editReelsUrl}
                        onChange={(e) => setEditReelsUrl(e.target.value)}
                        placeholder="https://instagram.com/reel/..."
                        className="w-full px-4 py-3 rounded-2xl bg-white border border-[#c3c5d9]/60 text-xs text-[#1A1A1B] font-mono font-bold focus:ring-2 focus:ring-[#0052ff]/20 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs text-[#71717A] font-black">
                        Изображение баннера (Выгрузка или прямая ссылка)
                      </label>
                      <span className="text-[10px] text-[#059669] font-black">⚡ Авто-сжатие в WebP</span>
                    </div>

                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-white border border-[#c3c5d9] group shadow-sm">
                      <img src={editReelsCover} alt="Banner Preview" className="w-full h-full object-cover" />
                      <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="w-6 h-6 mb-1" />
                        <span className="text-xs font-black">Загрузить фото (Сжатие до WebP)</span>
                        <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                      </label>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-[#71717A] mb-1">
                        🔗 Или вставьте готовую ссылку на баннер (Pinterest, Telegram...):
                      </label>
                      <input
                        type="url"
                        value={editReelsCover}
                        onChange={(e) => setEditReelsCover(e.target.value)}
                        placeholder="https://i.pinimg.com/...jpg"
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#c3c5d9]/70 text-xs font-mono text-[#1A1A1B] focus:ring-2 focus:ring-[#0052ff]/20 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-8 py-3.5 rounded-full bg-[#0052ff] hover:bg-[#004ced] text-white font-black text-xs flex items-center gap-2 shadow-md shadow-[#0052ff]/20 transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>СОХРАНИТЬ ИЗМЕНЕНИЯ</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= TAB 5: ADMINS (PROTECTED FOR SUPERADMIN) ================= */}
        {adminTab === 'admins' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-[#1A1A1B] tracking-tight">Администраторы</h2>
                <p className="text-xs text-[#71717A] mt-0.5 font-bold">Управление доступом сотрудников (Доступно только Суперадмину)</p>
              </div>

              {currentUserRole === 'superadmin' && (
                <button
                  onClick={() => setIsAdminModalOpen(true)}
                  className="bg-[#0052ff] text-white px-6 py-2.5 rounded-full text-xs font-black shadow-md shadow-[#0052ff]/20 hover:bg-[#004ced] transition-all flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Добавить админа</span>
                </button>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-[#e1e3e4] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-[#e1e3e4] text-[#71717A] uppercase font-black tracking-wider">
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
                      <td className="p-4 font-mono font-black text-[#1A1A1B]">{adm.id}</td>
                      <td className="p-4 font-black text-[#1A1A1B]">{adm.fullName}</td>
                      <td className="p-4 font-mono font-black text-[#0052ff]">@{adm.username}</td>
                      <td className="p-4 uppercase font-black text-[10px] text-[#434656]">
                        {adm.role === 'superadmin' ? 'Суперадмин' : 'Менеджер'}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-[#dcfce7] text-[#166534]">
                          Активен
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {currentUserRole === 'superadmin' && adm.role !== 'superadmin' && (
                          <button
                            onClick={() => requestDelete('admin', adm.id, adm.fullName)}
                            className="p-2 rounded-full bg-[#ffdad6]/60 text-[#ba1a1a] hover:bg-[#ffdad6] transition-all"
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

      {/* ================= LARGE SPACIOUS MODALS ================= */}

      {/* MODAL 1: REQUEST DETAIL MODAL (LARGE max-w-2xl) */}
      {selectedRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-8 border border-[#e1e3e4] shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#e1e3e4] pb-4">
              <div>
                <span className="text-xs text-[#71717A] font-mono font-black block">
                  Заявка #{selectedRequestModal.id}
                </span>
                <h3 className="font-black text-xl text-[#1A1A1B]">Детали обращения клиента</h3>
              </div>
              <button
                onClick={() => setSelectedRequestModal(null)}
                className="p-2 rounded-full hover:bg-[#f3f4f5] text-[#71717A] hover:text-[#1A1A1B]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {selectedRequestModal.productName && (
              <div className="bg-[#f8f9fa] p-5 rounded-2xl border border-[#e1e3e4] flex items-center gap-5">
                <img
                  src={selectedRequestModal.productImage || '/chair.jpg'}
                  alt={selectedRequestModal.productName}
                  className="w-16 h-16 object-cover rounded-2xl bg-white border border-[#e1e3e4]"
                />
                <div className="flex-1">
                  <h4 className="font-black text-base text-[#1A1A1B]">
                    {selectedRequestModal.productName}
                  </h4>
                  <span className="font-black text-base text-[#0052ff] font-mono">
                    {selectedRequestModal.productPrice ? formatPrice(selectedRequestModal.productPrice) : '-'}
                  </span>
                </div>
              </div>
            )}

            <div className="bg-[#f8f9fa] p-5 rounded-2xl border border-[#e1e3e4] space-y-4 text-xs">
              <div className="flex justify-between">
                <span className="text-[#71717A] font-bold">Имя клиента:</span>
                <span className="font-black text-[#1A1A1B] text-sm">{selectedRequestModal.customerName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#71717A] font-bold">Телефон:</span>
                <a
                  href={`tel:${selectedRequestModal.phoneNumber.replace(/\s+/g, '')}`}
                  className="font-mono font-black text-sm text-[#0052ff] hover:underline flex items-center gap-1.5"
                >
                  <Phone className="w-4 h-4" />
                  <span>{selectedRequestModal.phoneNumber}</span>
                </a>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#71717A] font-bold">Telegram Никнейм:</span>
                {selectedRequestModal.telegramUsername ? (
                  <a
                    href={`https://t.me/${selectedRequestModal.telegramUsername.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono font-black text-sm text-[#0052ff] hover:underline flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    <span>{selectedRequestModal.telegramUsername}</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                  </a>
                ) : (
                  <span className="text-[#71717A]">-</span>
                )}
              </div>

              <div className="flex justify-between">
                <span className="text-[#71717A] font-bold">Дата создания:</span>
                <span className="text-[#1A1A1B] font-extrabold">{formatDate(selectedRequestModal.createdAt)}</span>
              </div>

              {selectedRequestModal.notes && (
                <div className="pt-3 border-t border-[#e1e3e4]">
                  <span className="text-[#71717A] block mb-1 font-bold">Комментарий к заказу:</span>
                  <p className="text-[#1A1A1B] bg-white p-4 rounded-xl border border-[#e1e3e4] italic font-bold leading-relaxed">
                    "{selectedRequestModal.notes}"
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black text-[#1A1A1B]">
                Изменить статус заявки:
              </label>
              <div className="grid grid-cols-4 gap-3">
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
                    className={`py-3 rounded-2xl text-xs font-black transition-all ${st.color} ${
                      selectedRequestModal.status === st.id ? 'ring-2 ring-[#0052ff] scale-105 shadow-md' : 'opacity-70 hover:opacity-100'
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
                className="px-8 py-3 rounded-full bg-[#f3f4f5] hover:bg-[#e7e8e9] text-[#1A1A1B] font-black text-xs"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD/EDIT PRODUCT MODAL (SPACIOUS max-w-3xl WITH MULTI-IMAGE UPLOAD & CUSTOM SELECT) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl bg-white rounded-3xl p-8 border border-[#e1e3e4] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e1e3e4] pb-4">
              <h3 className="font-black text-lg text-[#1A1A1B]">
                {editingProduct?.id ? 'Редактировать кресло' : 'Добавить новое кресло в каталог'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#f3f4f5] text-[#71717A] hover:text-[#1A1A1B]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-5 text-xs">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block font-black text-[#1A1A1B] mb-1">Название кресла *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct?.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="Например: Comet Ergo Pro White"
                    className="w-full px-4 py-3 rounded-2xl bg-[#f8f9fa] border border-[#c3c5d9]/60 text-[#1A1A1B] font-extrabold focus:ring-2 focus:ring-[#0052ff]/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-black text-[#1A1A1B] mb-1">Цена (сум) *</label>
                  <input
                    type="text"
                    required
                    value={editingPriceFormatted}
                    onChange={(e) => setEditingPriceFormatted(formatPriceDots(e.target.value))}
                    placeholder="2.800.000"
                    className="w-full px-4 py-3 rounded-2xl bg-[#f8f9fa] border border-[#c3c5d9]/60 text-[#1A1A1B] font-mono font-black focus:ring-2 focus:ring-[#0052ff]/20 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block font-black text-[#1A1A1B] mb-1">Категория *</label>
                  <CustomSelect
                    className="w-full"
                    value={editingProduct?.category || categories[0]?.slug || 'ergonomic'}
                    options={categories.map((c) => ({ value: c.slug, label: c.name }))}
                    onChange={(val) => {
                      const selectedCatObj = categories.find((c) => c.slug === val);
                      setEditingProduct({
                        ...editingProduct,
                        category: val as any,
                        categoryLabel: selectedCatObj?.name || 'Эргономичное',
                      });
                    }}
                  />
                </div>

                <div className="flex items-center gap-4 pt-5">
                  <label className="flex items-center gap-2 font-black text-[#1A1A1B] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!editingProduct?.isPopular}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isPopular: e.target.checked })}
                      className="rounded border-[#c3c5d9] bg-white text-[#0052ff] w-5 h-5"
                    />
                    <span>В «Топ подборку» на Главной</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-black text-[#1A1A1B] mb-1">Описание кресла</label>
                <textarea
                  rows={3}
                  value={editingProduct?.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Опишите преимущества и характеристики кресла..."
                  className="w-full px-4 py-3 rounded-2xl bg-[#f8f9fa] border border-[#c3c5d9]/60 text-[#1A1A1B] font-bold resize-none focus:ring-2 focus:ring-[#0052ff]/20 outline-none"
                />
              </div>

              {/* MULTI-FILE IMAGE UPLOAD + DIRECT URL INPUT (OPTION 4) */}
              <div className="bg-[#f8f9fa] p-5 rounded-2xl border border-[#e1e3e4] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-black text-[#1A1A1B] flex items-center gap-2">
                      <Upload className="w-4 h-4 text-[#0052ff]" />
                      <span>Галерея фото кресла (До 4 шт.)</span>
                    </label>
                    <span className="text-[10px] text-[#059669] font-black flex items-center gap-1 mt-0.5">
                      ⚡ Файлы автоматически сжимаются в легкий WebP (~100КБ) для моментальной загрузки
                    </span>
                  </div>
                  {uploadingImage && <span className="text-[#0052ff] animate-pulse text-[10px] font-black">Сжатие & Загрузка...</span>}
                </div>

                {/* Thumbnails list */}
                <div className="flex items-center gap-3">
                  {editingProduct?.images?.map((url, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-[#c3c5d9] bg-white group shadow-sm">
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
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}

                  {(editingProduct?.images?.length || 0) < 4 && (
                    <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-[#c3c5d9] hover:border-[#0052ff] flex flex-col items-center justify-center cursor-pointer text-[#71717A] hover:text-[#0052ff] transition-all bg-white shadow-sm">
                      <Plus className="w-6 h-6" />
                      <span className="text-[10px] font-black mt-0.5">Загрузить</span>
                      <input type="file" accept="image/*" multiple onChange={handleMultiImageUpload} className="hidden" />
                    </label>
                  )}
                </div>

                {/* Option 4: Direct URL input for Pinterest, Telegram, Imgur */}
                {(editingProduct?.images?.length || 0) < 4 && (
                  <div className="pt-2 border-t border-[#e1e3e4] space-y-1.5">
                    <label className="block text-[11px] font-black text-[#71717A]">
                      🔗 Или вставьте прямую ссылку на картинку (Pinterest, Telegram, Cloudinary):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={directUrlInput}
                        onChange={(e) => setDirectUrlInput(e.target.value)}
                        placeholder="https://i.pinimg.com/...jpg"
                        className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-[#c3c5d9]/70 text-xs font-mono text-[#1A1A1B] outline-none focus:ring-2 focus:ring-[#0052ff]/20"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (directUrlInput.trim()) {
                            setEditingProduct({
                              ...editingProduct,
                              images: [...(editingProduct?.images || []), directUrlInput.trim()].slice(0, 4),
                            });
                            setDirectUrlInput('');
                          }
                        }}
                        className="bg-[#0052ff] text-white px-4 py-2.5 rounded-xl text-xs font-black hover:bg-[#004ced] transition-all"
                      >
                        + Вставить
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-6 py-3 rounded-full bg-[#f3f4f5] text-[#1A1A1B] font-black"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 rounded-full bg-[#0052ff] hover:bg-[#004ced] text-white font-black shadow-md shadow-[#0052ff]/20"
                >
                  Сохранить кресло
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CATEGORY MANAGEMENT MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 border border-[#e1e3e4] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e1e3e4] pb-3">
              <h3 className="font-black text-base text-[#1A1A1B]">Управление категориями каталога</h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#f3f4f5] text-[#71717A] hover:text-[#1A1A1B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                required
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Новая категория..."
                className="flex-1 px-4 py-3 rounded-2xl bg-[#f8f9fa] border border-[#c3c5d9]/60 text-xs text-[#1A1A1B] font-extrabold outline-none"
              />
              <button
                type="submit"
                className="bg-[#0052ff] text-white px-5 py-3 rounded-2xl text-xs font-black"
              >
                Добавить
              </button>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto pt-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#f8f9fa] border border-[#e1e3e4]">
                  <span className="text-xs font-black text-[#1A1A1B]">{cat.name}</span>
                  <button
                    onClick={() => requestDelete('category', cat.id, cat.name)}
                    className="p-1.5 text-[#ba1a1a] hover:bg-[#ffdad6]/60 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD ADMIN USER MODAL */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 border border-[#e1e3e4] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e1e3e4] pb-3">
              <h3 className="font-black text-base text-[#1A1A1B]">Добавить нового администратора</h3>
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#f3f4f5] text-[#71717A] hover:text-[#1A1A1B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block font-black text-[#1A1A1B] mb-1">ФИО сотрудника *</label>
                <input
                  type="text"
                  required
                  value={newAdminUser.fullName}
                  onChange={(e) => setNewAdminUser({ ...newAdminUser, fullName: e.target.value })}
                  placeholder="Например: Алишер Валиев"
                  className="w-full px-4 py-3 rounded-2xl bg-[#f8f9fa] border border-[#c3c5d9]/60 text-[#1A1A1B] font-extrabold focus:ring-2 focus:ring-[#0052ff]/20 outline-none"
                />
              </div>

              <div>
                <label className="block font-black text-[#1A1A1B] mb-1">Логин *</label>
                <input
                  type="text"
                  required
                  value={newAdminUser.username}
                  onChange={(e) => setNewAdminUser({ ...newAdminUser, username: e.target.value })}
                  placeholder="manager_alisher"
                  className="w-full px-4 py-3 rounded-2xl bg-[#f8f9fa] border border-[#c3c5d9]/60 text-[#1A1A1B] font-mono font-black focus:ring-2 focus:ring-[#0052ff]/20 outline-none"
                />
              </div>

              <div>
                <label className="block font-black text-[#1A1A1B] mb-1">Пароль *</label>
                <input
                  type="password"
                  required
                  value={newAdminUser.password}
                  onChange={(e) => setNewAdminUser({ ...newAdminUser, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-2xl bg-[#f8f9fa] border border-[#c3c5d9]/60 text-[#1A1A1B] font-mono font-black focus:ring-2 focus:ring-[#0052ff]/20 outline-none"
                />
              </div>

              <div>
                <label className="block font-black text-[#1A1A1B] mb-1">Роль</label>
                <CustomSelect
                  className="w-full"
                  value={newAdminUser.role}
                  options={[
                    { value: 'manager', label: 'Менеджер' },
                    { value: 'superadmin', label: 'Суперадминистратор' },
                  ]}
                  onChange={(val) => setNewAdminUser({ ...newAdminUser, role: val as any })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="px-6 py-3 rounded-full bg-[#f3f4f5] text-[#1A1A1B] font-black"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 rounded-full bg-[#0052ff] hover:bg-[#004ced] text-white font-black shadow-md shadow-[#0052ff]/20"
                >
                  Создать аккаунт
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: STYLED DELETION PIN DIALOG '1111' */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-[#e1e3e4] shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#ba1a1a]">
              <div className="p-3 rounded-2xl bg-[#ffdad6] text-[#ba1a1a]">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-[#1A1A1B]">Подтверждение удаления</h3>
                <p className="text-[11px] text-[#71717A] font-extrabold">Введите PIN-код защиты</p>
              </div>
            </div>

            <p className="text-xs text-[#1A1A1B] font-extrabold">
              Вы намерены удалить: <span className="text-[#ba1a1a] font-black">"{deleteTarget.name}"</span>.
            </p>

            <form onSubmit={handleConfirmDelete} className="space-y-3">
              {securityPinError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-black text-center">
                  {securityPinError}
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-[#71717A] mb-1">
                  Введите PIN-код подтверждения (код: 1111)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={securityPinInput}
                  onChange={(e) => setSecurityPinInput(e.target.value)}
                  placeholder="1111"
                  className="w-full text-center tracking-widest text-xl font-mono font-black px-4 py-3 rounded-2xl bg-[#f8f9fa] border border-[#c3c5d9] text-[#1A1A1B] focus:ring-2 focus:ring-[#ba1a1a]/30 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-5 py-2.5 rounded-full bg-[#f3f4f5] text-[#1A1A1B] font-black text-xs"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#ba1a1a] hover:bg-red-700 text-white font-black text-xs shadow-md shadow-[#ba1a1a]/20"
                >
                  Удалить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

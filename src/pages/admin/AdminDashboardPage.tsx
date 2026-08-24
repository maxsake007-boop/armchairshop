import React, { useState } from 'react';
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
} from 'lucide-react';
import { useRequests } from '../../context/RequestsContext';
import { useSettings } from '../../context/SettingsContext';
import { formatDate, formatPrice } from '../../utils/formatters';
import { LeadRequest } from '../../types';

interface AdminDashboardPageProps {
  onBackToApp: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onBackToApp }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [adminTab, setAdminTab] = useState<'requests' | 'media'>('requests');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { requests, updateRequestStatus } = useRequests();
  const { banner, reelsPromo, updateBanner, updateReelsPromo } = useSettings();

  // Local state for editing banner and reels in admin
  const [editBannerTitle, setEditBannerTitle] = useState(banner.title);
  const [editBannerSubtitle, setEditBannerSubtitle] = useState(banner.subtitle);
  const [editBannerBadge, setEditBannerBadge] = useState(banner.badge || 'АКЦИЯ НЕДЕЛИ');

  const [editReelsTitle, setEditReelsTitle] = useState(reelsPromo.title);
  const [editReelsBadge, setEditReelsBadge] = useState(reelsPromo.badge);
  const [editReelsUrl, setEditReelsUrl] = useState(reelsPromo.instagramUrl);
  const [editReelsActive, setEditReelsActive] = useState(reelsPromo.isActive);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123' || password === 'comet2026') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Неверный пароль администратора');
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateBanner({
      ...banner,
      title: editBannerTitle,
      subtitle: editBannerSubtitle,
      badge: editBannerBadge,
    });
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

  const filteredRequests = requests.filter((r) => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesQuery =
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phoneNumber.includes(searchQuery) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

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
                Демо-пароль: <code className="text-slate-300 font-mono">admin123</code>
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
      {/* Desktop Non-Responsive Notice for Mobile Viewports */}
      <div className="lg:hidden bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-bold flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <Monitor className="w-5 h-5 shrink-0" />
          <span>ВНИМАНИЕ: Админ-панель спроектирована исключительно для ПК (Desktop Only).</span>
        </div>
      </div>

      {/* Main Fixed Desktop Container (min-w-[1024px]) */}
      <div className="min-w-[1024px] max-w-[1400px] mx-auto p-6 space-y-6">
        {/* Top Bar */}
        <header className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Comet.Uz" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-bold text-lg text-white leading-none">
                Comet.Uz — Админ Панель
              </h1>
              <span className="text-xs text-slate-400">
                Управление заявками, баннерами и Reels (Desktop View)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tabs Toggle */}
            <div className="bg-slate-950 p-1 rounded-xl flex items-center gap-1 border border-slate-800">
              <button
                onClick={() => setAdminTab('requests')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  adminTab === 'requests'
                    ? 'bg-primary text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Заявки ({requests.length})</span>
              </button>

              <button
                onClick={() => setAdminTab('media')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  adminTab === 'media'
                    ? 'bg-primary text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Instagram className="w-4 h-4 text-pink-400" />
                <span>Баннеры & Reels</span>
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

        {adminTab === 'requests' ? (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                  Всего заявок
                </span>
                <span className="text-3xl font-bold text-white">{requests.length}</span>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider block mb-1">
                  Новые заявки
                </span>
                <span className="text-3xl font-bold text-amber-400">
                  {requests.filter((r) => r.status === 'new').length}
                </span>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider block mb-1">
                  В обработке
                </span>
                <span className="text-3xl font-bold text-blue-400">
                  {requests.filter((r) => r.status === 'in_progress').length}
                </span>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider block mb-1">
                  Завершено
                </span>
                <span className="text-3xl font-bold text-emerald-400">
                  {requests.filter((r) => r.status === 'completed').length}
                </span>
              </div>
            </div>

            {/* Table Filters & Toolbar */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по имени, номеру или ID заявки..."
                  className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400 font-semibold">Статус:</span>
                {['all', 'new', 'in_progress', 'completed', 'canceled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all uppercase tracking-wider ${
                      filterStatus === st
                        ? 'bg-primary text-white shadow'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st === 'all' ? 'Все' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Lead Requests Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">Клиент</th>
                    <th className="p-4">Телефон</th>
                    <th className="p-4">Кресло / Товар</th>
                    <th className="p-4">Сумма</th>
                    <th className="p-4">Дата</th>
                    <th className="p-4">Статус</th>
                    <th className="p-4 text-right">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-mono font-bold text-white">{req.id}</td>
                        <td className="p-4 font-semibold text-white">{req.customerName}</td>
                        <td className="p-4 font-mono">{req.phoneNumber}</td>
                        <td className="p-4">
                          <span className="font-medium text-slate-200 block truncate max-w-[200px]">
                            {req.productName || 'Не указан'}
                          </span>
                          {req.notes && (
                            <span className="text-[10px] text-slate-500 block truncate max-w-[200px]">
                              Заметка: {req.notes}
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-bold text-primary-fixed">
                          {req.productPrice ? formatPrice(req.productPrice) : '-'}
                        </td>
                        <td className="p-4 text-slate-400">{formatDate(req.createdAt)}</td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider inline-block ${
                              req.status === 'new'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : req.status === 'in_progress'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : req.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <select
                            value={req.status}
                            onChange={(e) =>
                              updateRequestStatus(req.id, e.target.value as LeadRequest['status'])
                            }
                            className="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="new">Новая</option>
                            <option value="in_progress">В обработке</option>
                            <option value="completed">Доставлено</option>
                            <option value="canceled">Отменено</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-slate-500">
                        Список заявок пуст. Клиентские заказы из Mini App появятся здесь в реальном времени.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* Media, Banners & Reels Management Tab */
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="font-bold text-lg text-white">
                  Настройка баннеров и Instagram Reels
                </h2>
                <p className="text-xs text-slate-400">
                  Управление рекламным промо-блоком и ссылкой на последний видеообзор
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
              {/* Promo Banner Settings */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Главный Промо-баннер («Акция недели»)</span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1">
                      Бейдж акции
                    </label>
                    <input
                      type="text"
                      value={editBannerBadge}
                      onChange={(e) => setEditBannerBadge(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1">
                      Заголовок баннера
                    </label>
                    <input
                      type="text"
                      value={editBannerTitle}
                      onChange={(e) => setEditBannerTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1">
                      Подзаголовок (скидка/описание)
                    </label>
                    <input
                      type="text"
                      value={editBannerSubtitle}
                      onChange={(e) => setEditBannerSubtitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

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
      </div>
    </div>
  );
};

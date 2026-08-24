import React from 'react';
import { Home, LayoutGrid, Heart, ClipboardList } from 'lucide-react';
import { triggerHaptic } from '../../utils/formatters';
import { useFavorites } from '../../context/FavoritesContext';
import { useRequests } from '../../context/RequestsContext';

export type TabType = 'home' | 'catalog' | 'favorites' | 'requests';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { favorites } = useFavorites();
  const { requests } = useRequests();

  const handleSelect = (tab: TabType) => {
    if (tab !== activeTab) {
      triggerHaptic('light');
      onTabChange(tab);
    }
  };

  const navItems = [
    { id: 'home' as TabType, label: 'Главная', icon: Home },
    { id: 'catalog' as TabType, label: 'Каталог', icon: LayoutGrid },
    { id: 'favorites' as TabType, label: 'Избранное', icon: Heart, badge: favorites.length },
    { id: 'requests' as TabType, label: 'Мои заявки', icon: ClipboardList, badge: requests.length },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 dark:bg-surface-dark/95 backdrop-blur-lg border-t border-surface-card dark:border-surface-card-dark px-2 pt-2 pb-3 flex items-center justify-around transition-colors max-w-md mx-auto left-1/2 -translate-x-1/2 w-full" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleSelect(item.id)}
            className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 ${
              isActive
                ? 'text-primary dark:text-primary-container font-semibold'
                : 'text-charcoal-muted dark:text-zinc-400 hover:text-charcoal dark:hover:text-white'
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-6 h-6 transition-transform duration-200 ${
                  isActive ? 'scale-110' : ''
                }`}
              />
              {item.badge && item.badge > 0 ? (
                <span className="absolute -top-1.5 -right-2.5 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {item.badge}
                </span>
              ) : null}
            </div>
            <span className="text-[11px] mt-1 tracking-tight leading-none">{item.label}</span>
            {isActive && (
              <span className="absolute bottom-0 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            )}
          </button>
        );
      })}
    </nav>
  );
};

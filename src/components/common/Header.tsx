import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTelegram } from '../../context/TelegramContext';
import { triggerHaptic } from '../../utils/formatters';

export const Header: React.FC = () => {
  const { colorScheme, toggleTheme, user } = useTelegram();

  const handleThemeToggle = () => {
    triggerHaptic('light');
    toggleTheme();
  };

  return (
    <header className="sticky top-0 z-30 bg-surface/95 dark:bg-surface-dark/95 backdrop-blur-md border-b border-surface-card dark:border-surface-card-dark transition-colors px-5 py-3 flex items-center justify-between">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <img
          src="/logo.png"
          alt="Comet.Uz"
          className="h-9 w-9 object-contain"
        />
        <div>
          <span className="font-extrabold text-lg tracking-tight text-charcoal dark:text-white leading-none">
            Comet.Uz
          </span>
          <p className="text-[11px] text-charcoal-muted dark:text-zinc-400 font-medium leading-tight">
            {user?.first_name ? `Привет, ${user.first_name} 👋` : 'Эргономика & Комфорт'}
          </p>
        </div>
      </div>

      {/* Theme Toggle */}
      <button
        onClick={handleThemeToggle}
        className="p-2.5 rounded-xl bg-surface-card dark:bg-surface-card-dark text-charcoal dark:text-white hover:opacity-75 active:scale-90 transition-all border border-black/5 dark:border-white/10"
        aria-label="Toggle Theme"
      >
        {colorScheme === 'dark' ? (
          <Sun className="w-5 h-5 text-amber-400" />
        ) : (
          <Moon className="w-5 h-5 text-charcoal" />
        )}
      </button>
    </header>
  );
};

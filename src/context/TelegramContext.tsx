import React, { createContext, useContext, useEffect, useState } from 'react';

interface TelegramUser {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramContextType {
  user: TelegramUser | null;
  colorScheme: 'light' | 'dark';
  isTelegram: boolean;
  expandApp: () => void;
  closeApp: () => void;
  toggleTheme: () => void;
}

const TelegramContext = createContext<TelegramContextType>({
  user: null,
  colorScheme: 'light',
  isTelegram: false,
  expandApp: () => {},
  closeApp: () => {},
  toggleTheme: () => {},
});

export const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      setIsTelegram(true);

      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }

      // Apply Telegram safe area insets as CSS variables (fallback if not set automatically)
      const applySafeAreaInsets = () => {
        const root = document.documentElement;
        const safeArea = (tg as any).safeAreaInset;
        const contentSafeArea = (tg as any).contentSafeAreaInset;
        if (safeArea) {
          root.style.setProperty('--tg-safe-area-inset-top', `${safeArea.top ?? 0}px`);
          root.style.setProperty('--tg-safe-area-inset-bottom', `${safeArea.bottom ?? 0}px`);
        }
        if (contentSafeArea) {
          root.style.setProperty('--tg-content-safe-area-inset-top', `${contentSafeArea.top ?? 0}px`);
          root.style.setProperty('--tg-content-safe-area-inset-bottom', `${contentSafeArea.bottom ?? 0}px`);
        }
      };

      applySafeAreaInsets();
      // Re-apply on viewport change (rotation, resize)
      tg.onEvent('viewportChanged', applySafeAreaInsets);

      // Initial color scheme detection from Telegram or system preference
      const scheme = tg.colorScheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      setColorScheme(scheme);
      applyTheme(scheme);

      // Event listener for Telegram theme changes
      const handleThemeChange = () => {
        const newScheme = tg.colorScheme || 'light';
        setColorScheme(newScheme);
        applyTheme(newScheme);
      };

      tg.onEvent('themeChanged', handleThemeChange);
      return () => {
        tg.offEvent('themeChanged', handleThemeChange);
        tg.offEvent('viewportChanged', applySafeAreaInsets);
      };
    } else {
      // Browser fallback theme detection
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialScheme = isSystemDark ? 'dark' : 'light';
      setColorScheme(initialScheme);
      applyTheme(initialScheme);
    }
  }, []);

  const applyTheme = (scheme: 'light' | 'dark') => {
    const root = document.documentElement;
    if (scheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    const nextScheme = colorScheme === 'light' ? 'dark' : 'light';
    setColorScheme(nextScheme);
    applyTheme(nextScheme);
  };

  const expandApp = () => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.expand();
    }
  };

  const closeApp = () => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    }
  };

  return (
    <TelegramContext.Provider
      value={{
        user,
        colorScheme,
        isTelegram,
        expandApp,
        closeApp,
        toggleTheme,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => useContext(TelegramContext);

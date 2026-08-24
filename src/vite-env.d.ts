/// <reference types="vite/client" />

interface Window {
  Telegram?: {
    WebApp?: {
      ready: () => void;
      expand: () => void;
      close: () => void;
      colorScheme: 'light' | 'dark';
      themeParams: Record<string, string>;
      initDataUnsafe?: {
        user?: {
          id?: number;
          first_name?: string;
          last_name?: string;
          username?: string;
          language_code?: string;
        };
      };
      HapticFeedback?: {
        impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
        notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        selectionChanged: () => void;
      };
      onEvent: (eventType: string, eventHandler: () => void) => void;
      offEvent: (eventType: string, eventHandler: () => void) => void;
      setHeaderColor: (color: string) => void;
      setBackgroundColor: (color: string) => void;
      openLink?: (url: string) => void;
    };
  };
}

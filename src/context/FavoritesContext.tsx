import React, { createContext, useContext, useEffect, useState } from 'react';
import { triggerHaptic } from '../utils/formatters';

interface FavoritesContextType {
  favorites: string[]; // product IDs
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  toggleFavorite: () => {},
  isFavorite: () => false,
});

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('comet_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('comet_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save favorites', e);
    }
  }, [favorites]);

  const toggleFavorite = (productId: string) => {
    triggerHaptic('light');
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);

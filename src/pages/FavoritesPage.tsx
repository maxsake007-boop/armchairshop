import React from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { MOCK_PRODUCTS } from '../services/mockData';
import { useFavorites } from '../context/FavoritesContext';
import { ProductCard } from '../components/catalog/ProductCard';
import { triggerHaptic } from '../utils/formatters';

interface FavoritesPageProps {
  onSelectProduct: (product: Product) => void;
  onOrderClick: (product: Product) => void;
  onGoToCatalog: () => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  onSelectProduct,
  onOrderClick,
  onGoToCatalog,
}) => {
  const { favorites } = useFavorites();
  const favoriteProducts = MOCK_PRODUCTS.filter((p) => favorites.includes(p.id));

  return (
    <div className="space-y-4 px-5 pt-3 pb-24 animate-fade-in">
      <div>
        <h1 className="font-bold text-xl text-charcoal dark:text-white tracking-tight">
          Избранное
        </h1>
        <p className="text-xs text-charcoal-muted dark:text-zinc-400">
          Сохранённые модели кресел ({favoriteProducts.length})
        </p>
      </div>

      {favoriteProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 pt-2">
          {favoriteProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              onOrderClick={onOrderClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-surface-card dark:bg-surface-card-dark rounded-card border border-black/5 dark:border-white/5 my-6">
          <Heart className="w-12 h-12 text-charcoal-muted dark:text-zinc-500 mx-auto mb-3" />
          <h3 className="font-semibold text-sm text-charcoal dark:text-white mb-1">
            Список избранного пуст
          </h3>
          <p className="text-xs text-charcoal-muted dark:text-zinc-400 mb-4 max-w-xs mx-auto">
            Нажимайте на иконку сердечка на карточках кресел, чтобы не потерять понравившиеся модели
          </p>
          <button
            onClick={() => {
              triggerHaptic('light');
              onGoToCatalog();
            }}
            className="bg-primary text-white font-bold text-xs px-5 py-2.5 rounded-button shadow-md inline-flex items-center gap-2 hover:bg-primary-hover"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Выбрать кресло</span>
          </button>
        </div>
      )}
    </div>
  );
};

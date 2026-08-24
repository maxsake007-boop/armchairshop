import React from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product } from '../../types';
import { formatPrice, triggerHaptic } from '../../utils/formatters';
import { useFavorites } from '../../context/FavoritesContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onOrderClick: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onOrderClick,
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(product.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  const handleOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    onOrderClick(product);
  };

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative bg-surface-card dark:bg-surface-card-dark rounded-card flex flex-col transition-all duration-300 hover:shadow-floating dark:hover:shadow-floating-dark border border-black/5 dark:border-white/5 cursor-pointer active:scale-[0.98] overflow-hidden"
    >
      {/* Image Section — portrait ratio for chairs */}
      <div className="relative w-full aspect-[3/4] bg-surface-light dark:bg-zinc-800 overflow-hidden">
        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-2.5 right-2.5 z-10 p-2 rounded-full backdrop-blur-sm transition-all shadow ${
            favorite
              ? 'bg-red-500 text-white'
              : 'bg-white/80 dark:bg-black/40 text-charcoal dark:text-white'
          }`}
          aria-label="Избранное"
        >
          <Heart className={`w-4 h-4 ${favorite ? 'fill-white' : ''}`} />
        </button>

        {/* Chair Image */}
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          loading="lazy"
        />
      </div>

      {/* Info Section */}
      <div className="p-3 flex flex-col gap-2">
        {/* Category Label */}
        <span className="text-[10px] uppercase font-bold tracking-wider text-charcoal-muted dark:text-zinc-400">
          {product.categoryLabel}
        </span>

        {/* Product Name */}
        <h3 className="font-bold text-sm text-charcoal dark:text-white line-clamp-2 leading-snug group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
          {product.name}
        </h3>

        {/* Price Row */}
        <div className="flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/5">
          <span className="font-extrabold text-sm text-charcoal dark:text-white leading-none">
            {formatPrice(product.price)}
          </span>

          <button
            onClick={handleOrder}
            className="bg-primary hover:bg-primary-hover active:scale-95 text-white p-2.5 rounded-xl shadow-sm shadow-primary/30 transition-all"
            aria-label="Заказать"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

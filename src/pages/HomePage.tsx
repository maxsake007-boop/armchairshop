import React from 'react';
import { ArrowRight, Sparkles, Play } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from '../components/catalog/ProductCard';
import { CategoryChips } from '../components/catalog/CategoryChips';
import { triggerHaptic } from '../utils/formatters';
import { useSettings } from '../context/SettingsContext';
import { useCatalog } from '../context/CatalogContext';

interface HomePageProps {
  onSelectProduct: (product: Product) => void;
  onOrderClick: (product: Product) => void;
  onGoToCatalog: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectProduct,
  onOrderClick,
  onGoToCatalog,
}) => {
  const { reelsPromo } = useSettings();
  const { products, categories } = useCatalog();

  const popularProducts = products.filter((p) => p.isPopular);

  const handleOpenInstagram = () => {
    triggerHaptic('medium');
    const url = reelsPromo.instagramUrl || 'https://instagram.com/comet.uz';
    if (window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-5 px-5 pt-3 pb-24 animate-fade-in">
      {/* 1. Instagram Reels / Stories Review Banner */}
      {reelsPromo.isActive && (
        <div
          onClick={handleOpenInstagram}
          className="group relative h-80 rounded-card overflow-hidden cursor-pointer shadow-lg active:scale-[0.99] transition-all border border-black/5 dark:border-white/10"
        >
          {/* Background Cover Image */}
          <img
            src={reelsPromo.coverImage || '/chair.jpg'}
            alt="Comet Review"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

          {/* Bottom Content */}
          <div className="absolute bottom-4 left-4 right-4 space-y-3">
            <span className="inline-block bg-primary text-white text-[10px] font-bold tracking-wider px-3 py-1 rounded-full uppercase shadow">
              {reelsPromo.badge || 'Новинка'}
            </span>

            <h2 className="text-white font-extrabold text-lg leading-snug tracking-tight drop-shadow-md">
              {reelsPromo.title || 'кресло, которое стоит попробовать'}
            </h2>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenInstagram();
              }}
              className="bg-primary hover:bg-primary-hover active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-button shadow-md flex items-center gap-2 transition-all"
            >
              <div className="w-4 h-4 rounded-full bg-white text-primary flex items-center justify-center">
                <Play className="w-2.5 h-2.5 fill-primary ml-0.5" />
              </div>
              <span>{reelsPromo.buttonText || 'Смотреть обзор'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Category Filter Chips */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-base text-charcoal dark:text-white tracking-tight">
            Категории
          </h2>
          <button
            onClick={onGoToCatalog}
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
          >
            Все
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <CategoryChips
          categories={categories}
          selectedCategory="all"
          onSelectCategory={() => onGoToCatalog()}
        />
      </div>

      {/* 3. Top Selection Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500/20" />
            <h2 className="font-bold text-base text-charcoal dark:text-white tracking-tight">
              Топ подборка
            </h2>
          </div>
          <button
            onClick={onGoToCatalog}
            className="text-xs text-primary font-semibold hover:underline"
          >
            Смотреть все
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {popularProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              onOrderClick={onOrderClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

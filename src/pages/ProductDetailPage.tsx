import React, { useState } from 'react';
import { ArrowLeft, Heart, Shield, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { formatPrice, triggerHaptic } from '../utils/formatters';
import { useFavorites } from '../context/FavoritesContext';

interface ProductDetailPageProps {
  product: Product;
  onBack: () => void;
  onOrderClick: (product: Product) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onBack,
  onOrderClick,
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(product.id);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Maximum 4 photos for gallery
  const galleryImages = product.images.slice(0, 4);
  const hasGallery = galleryImages.length > 1;

  const handleFavorite = () => {
    toggleFavorite(product.id);
  };

  const handleOrder = () => {
    triggerHaptic('medium');
    onOrderClick(product);
  };

  return (
    <div className="pb-32 animate-fade-in bg-surface dark:bg-surface-dark min-h-screen">
      {/* Top Sticky Bar */}
      <div className="sticky top-0 z-20 px-5 py-3 flex items-center justify-between bg-surface/90 dark:bg-surface-dark/90 backdrop-blur-md border-b border-surface-card dark:border-surface-card-dark">
        <button
          onClick={() => {
            triggerHaptic('light');
            onBack();
          }}
          className="p-2.5 rounded-xl bg-surface-card dark:bg-surface-card-dark text-charcoal dark:text-white hover:opacity-80 transition-all border border-black/5 dark:border-white/10 flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад</span>
        </button>

        <button
          onClick={handleFavorite}
          className={`p-2.5 rounded-xl backdrop-blur-md transition-all border border-black/5 dark:border-white/10 ${
            favorite
              ? 'bg-red-500 text-white'
              : 'bg-surface-card dark:bg-surface-card-dark text-charcoal dark:text-white'
          }`}
          aria-label="Избранное"
        >
          <Heart className={`w-4 h-4 ${favorite ? 'fill-white' : ''}`} />
        </button>
      </div>

      {/* Main Product Showcase / Gallery Box */}
      <div className="px-5 pt-3 space-y-3">
        {/* Main Image Frame — whole photo fills rounded-3xl frame seamlessly */}
        <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden border border-black/5 dark:border-white/10 shadow-md bg-surface-card dark:bg-zinc-900">
          <img
            src={galleryImages[activeImageIndex] || product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover object-center transition-all duration-500"
          />

          {/* Slide Indicator Dots (Only visible if multiple photos) */}
          {hasGallery && (
            <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              {galleryImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeImageIndex === idx
                      ? 'w-5 bg-white shadow'
                      : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Слайд ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnail Preview Selector (Max 4 photos, only if hasGallery) */}
        {hasGallery && (
          <div className="flex items-center justify-center gap-2.5 pt-1">
            {galleryImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  triggerHaptic('light');
                  setActiveImageIndex(idx);
                }}
                className={`w-16 h-20 rounded-2xl overflow-hidden border transition-all ${
                  activeImageIndex === idx
                    ? 'border-primary ring-2 ring-primary/30 scale-105 shadow-md'
                    : 'border-black/5 dark:border-white/10 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="px-5 space-y-5 pt-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary block mb-1">
            {product.categoryLabel}
          </span>

          <h1 className="font-extrabold text-xl text-charcoal dark:text-white tracking-tight leading-tight">
            {product.name}
          </h1>

          {/* Clean bold price in matching name color */}
          <div className="mt-2">
            <span className="font-extrabold text-2xl text-charcoal dark:text-white">
              {formatPrice(product.price)}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="bg-surface-card dark:bg-surface-card-dark p-4 rounded-2xl border border-black/5 dark:border-white/5">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-charcoal-muted dark:text-zinc-400 mb-2">
            Описание модели
          </h3>
          <p className="text-xs text-charcoal dark:text-zinc-300 leading-relaxed font-medium">
            {product.description}
          </p>
        </div>

        {/* Specifications Grid */}
        <div>
          <h3 className="font-bold text-sm text-charcoal dark:text-white mb-3">
            Технические характеристики
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-surface-card dark:bg-surface-card-dark p-3 rounded-xl border border-black/5 dark:border-white/5">
              <span className="block text-[10px] text-charcoal-muted dark:text-zinc-400 uppercase font-semibold">
                Поясничный упор
              </span>
              <span className="text-xs font-bold text-charcoal dark:text-white">
                {product.specs.ergonomics}
              </span>
            </div>
            <div className="bg-surface-card dark:bg-surface-card-dark p-3 rounded-xl border border-black/5 dark:border-white/5">
              <span className="block text-[10px] text-charcoal-muted dark:text-zinc-400 uppercase font-semibold">
                Подлокотники
              </span>
              <span className="text-xs font-bold text-charcoal dark:text-white">
                {product.specs.armrests}
              </span>
            </div>
            <div className="bg-surface-card dark:bg-surface-card-dark p-3 rounded-xl border border-black/5 dark:border-white/5">
              <span className="block text-[10px] text-charcoal-muted dark:text-zinc-400 uppercase font-semibold">
                Наклон спинки
              </span>
              <span className="text-xs font-bold text-charcoal dark:text-white">
                {product.specs.reclineAngle}
              </span>
            </div>
            <div className="bg-surface-card dark:bg-surface-card-dark p-3 rounded-xl border border-black/5 dark:border-white/5">
              <span className="block text-[10px] text-charcoal-muted dark:text-zinc-400 uppercase font-semibold">
                Макс. нагрузка
              </span>
              <span className="text-xs font-bold text-charcoal dark:text-white">
                {product.specs.maxWeight}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery & Warranty info */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
          <Shield className="w-5 h-5 shrink-0" />
          <div className="text-xs">
            <span className="font-bold block">{product.specs.warranty}</span>
            <span className="opacity-90">Бесплатная сборка и тест-драйв перед покупкой</span>
          </div>
        </div>
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 dark:bg-surface-dark/95 backdrop-blur-md border-t border-surface-card dark:border-surface-card-dark p-4 flex items-center justify-between gap-4 max-w-md mx-auto left-1/2 -translate-x-1/2 w-full">
        <div>
          <span className="block text-[10px] text-charcoal-muted dark:text-zinc-400 uppercase font-bold">
            Итоговая цена
          </span>
          <span className="font-extrabold text-lg text-charcoal dark:text-white leading-none">
            {formatPrice(product.price)}
          </span>
        </div>

        <button
          onClick={handleOrder}
          className="flex-1 py-3.5 px-6 rounded-button bg-primary hover:bg-primary-hover active:scale-[0.99] text-white font-bold text-xs tracking-wider shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>ОФОРМИТЬ ЗАЯВКУ</span>
        </button>
      </div>
    </div>
  );
};

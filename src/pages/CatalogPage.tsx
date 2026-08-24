import React, { useState } from 'react';
import { Search, SlidersHorizontal, PackageSearch } from 'lucide-react';
import { Product } from '../types';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '../services/mockData';
import { CategoryChips } from '../components/catalog/CategoryChips';
import { ProductCard } from '../components/catalog/ProductCard';

interface CatalogPageProps {
  onSelectProduct: (product: Product) => void;
  onOrderClick: (product: Product) => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  onSelectProduct,
  onOrderClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredProducts = MOCK_PRODUCTS.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4 px-5 pt-3 pb-24 animate-fade-in">
      {/* Search Header */}
      <div>
        <h1 className="font-bold text-xl text-charcoal dark:text-white mb-3 tracking-tight">
          Каталог кресел
        </h1>

        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-charcoal-muted dark:text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию или характеристикам..."
            className="w-full pl-10 pr-10 py-3 rounded-2xl bg-surface-card dark:bg-surface-card-dark border border-black/5 dark:border-white/10 text-xs text-charcoal dark:text-white placeholder:text-charcoal-muted dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-xs text-charcoal-muted hover:text-charcoal dark:text-zinc-400 font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Chips */}
      <CategoryChips
        categories={MOCK_CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 pt-2">
          {filteredProducts.map((product) => (
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
          <PackageSearch className="w-12 h-12 text-charcoal-muted dark:text-zinc-500 mx-auto mb-3" />
          <h3 className="font-semibold text-sm text-charcoal dark:text-white mb-1">
            Кресла не найдены
          </h3>
          <p className="text-xs text-charcoal-muted dark:text-zinc-400">
            Попробуйте изменить поисковый запрос или выбранную категорию
          </p>
        </div>
      )}
    </div>
  );
};

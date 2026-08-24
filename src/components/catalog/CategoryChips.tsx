import React from 'react';
import { Category } from '../../types';
import { triggerHaptic } from '../../utils/formatters';

interface CategoryChipsProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryChips: React.FC<CategoryChipsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const handleSelect = (id: string) => {
    triggerHaptic('light');
    onSelectCategory(id);
  };

  return (
    <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-2 px-5 -mx-5">
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => handleSelect(cat.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-2xl text-xs font-semibold tracking-tight transition-all duration-200 flex items-center gap-1.5 ${
              isSelected
                ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                : 'bg-surface-card dark:bg-surface-card-dark text-charcoal dark:text-zinc-300 hover:bg-surface-card/80 border border-black/5 dark:border-white/5'
            }`}
          >
            <span>{cat.name}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isSelected
                  ? 'bg-white/20 text-white'
                  : 'bg-black/5 dark:bg-white/10 text-charcoal-muted dark:text-zinc-400'
              }`}
            >
              {cat.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

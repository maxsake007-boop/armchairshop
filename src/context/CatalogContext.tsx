import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product, Category } from '../types';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '../services/mockData';
import { supabase } from '../services/supabaseClient';

interface CatalogContextType {
  products: Product[];
  categories: Category[];
  addProduct: (product: Product) => Promise<{ success: boolean; error?: string }>;
  updateProduct: (product: Product) => Promise<{ success: boolean; error?: string }>;
  deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>;
  addCategory: (category: Category) => Promise<{ success: boolean; error?: string }>;
  deleteCategory: (id: string) => Promise<{ success: boolean; error?: string }>;
  refreshProducts: () => Promise<void>;
}

const CatalogContext = createContext<CatalogContextType>({
  products: [],
  categories: [],
  addProduct: async () => ({ success: false }),
  updateProduct: async () => ({ success: false }),
  deleteProduct: async () => ({ success: false }),
  addCategory: async () => ({ success: false }),
  deleteCategory: async () => ({ success: false }),
  refreshProducts: async () => {},
});

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);

  // Fetch Products & Categories from Supabase on mount
  const loadData = async () => {
    let prods: Product[] = [];
    let cats: Category[] = [];

    const { data: pData, error: pError } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (pError) {
      console.error('[CatalogContext] fetchProducts error:', pError.message, pError.code);
      prods = MOCK_PRODUCTS;
    } else if (pData && pData.length > 0) {
      prods = pData.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        categoryLabel: item.category_label,
        price: Number(item.price),
        description: item.description || '',
        specs: item.specs || {
          ergonomics: 'Анатомическая поддержка',
          armrests: '4D Регулировка',
          reclineAngle: '90° - 135°',
          maxWeight: 'До 130 кг',
          material: 'Сетка Dupont',
          warranty: '2 года гарантии',
        },
        images: item.images && item.images.length > 0 ? item.images : ['/chair.jpg'],
        rating: item.rating || 4.9,
        reviewsCount: item.reviews_count || 12,
        isPopular: item.is_popular ?? false,
        inStock: item.in_stock ?? true,
      }));
    } else {
      prods = MOCK_PRODUCTS;
    }

    const { data: cData, error: cError } = await supabase.from('categories').select('*');
    if (cError) {
      console.error('[CatalogContext] fetchCategories error:', cError.message);
      cats = MOCK_CATEGORIES;
    } else if (cData && cData.length > 0) {
      cats = cData.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        count: 0,
        iconName: c.icon_name || 'Armchair',
      }));
    } else {
      cats = MOCK_CATEGORIES;
    }

    // Ensure "all" (Все кресла) category exists at the start
    const hasAll = cats.some((c) => c.slug === 'all' || c.id === 'all');
    if (!hasAll) {
      cats.unshift({
        id: 'all',
        name: 'Все кресла',
        slug: 'all',
        count: prods.length,
        iconName: 'Grid',
      });
    }

    // Compute live counts
    const updatedCats = cats.map((c) => {
      if (c.slug === 'all' || c.id === 'all') {
        return { ...c, count: prods.length };
      }
      const matchingCount = prods.filter((p) =>
        p.category === c.slug ||
        p.category === c.id ||
        p.categoryLabel === c.name ||
        p.category === c.name
      ).length;
      return { ...c, count: matchingCount };
    });

    setProducts(prods);
    setCategories(updatedCats);
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshProducts = async () => {
    await loadData();
  };

  const addProduct = async (prod: Product): Promise<{ success: boolean; error?: string }> => {
    const dbRow = {
      id: prod.id,
      name: prod.name,
      category: prod.category,
      category_label: prod.categoryLabel,
      price: prod.price,
      description: prod.description,
      specs: prod.specs,
      images: prod.images,
      is_popular: prod.isPopular,
      in_stock: prod.inStock,
    };

    const { error } = await supabase.from('products').insert(dbRow);
    if (error) {
      console.error('[CatalogContext] addProduct error:', error.message, error.code);
      return { success: false, error: error.message };
    }

    // Re-fetch from DB to guarantee consistency
    await loadData();
    return { success: true };
  };

  const updateProduct = async (prod: Product): Promise<{ success: boolean; error?: string }> => {
    const dbRow = {
      id: prod.id,
      name: prod.name,
      category: prod.category,
      category_label: prod.categoryLabel,
      price: prod.price,
      description: prod.description,
      specs: prod.specs,
      images: prod.images,
      is_popular: prod.isPopular,
      in_stock: prod.inStock,
    };

    const { error } = await supabase.from('products').upsert(dbRow);
    if (error) {
      console.error('[CatalogContext] updateProduct error:', error.message, error.code);
      return { success: false, error: error.message };
    }

    // Re-fetch from DB to guarantee consistency
    await loadData();
    return { success: true };
  };

  const deleteProduct = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      console.error('[CatalogContext] deleteProduct error:', error.message, error.code);
      return { success: false, error: error.message };
    }

    // Re-fetch from DB to guarantee consistency
    await loadData();
    return { success: true };
  };

  const addCategory = async (cat: Category): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.from('categories').insert({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      count: cat.count,
      icon_name: cat.iconName,
    });
    if (error) {
      console.error('[CatalogContext] addCategory error:', error.message);
      return { success: false, error: error.message };
    }

    await loadData();
    return { success: true };
  };

  const deleteCategory = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      console.error('[CatalogContext] deleteCategory error:', error.message);
      return { success: false, error: error.message };
    }

    await loadData();
    return { success: true };
  };

  return (
    <CatalogContext.Provider
      value={{
        products,
        categories,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        deleteCategory,
        refreshProducts,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => useContext(CatalogContext);

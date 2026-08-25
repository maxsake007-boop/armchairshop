import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product, Category } from '../types';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '../services/mockData';
import { supabase } from '../services/supabaseClient';

interface CatalogContextType {
  products: Product[];
  categories: Category[];
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

const CatalogContext = createContext<CatalogContextType>({
  products: MOCK_PRODUCTS,
  categories: MOCK_CATEGORIES,
  addProduct: async () => {},
  updateProduct: async () => {},
  deleteProduct: async () => {},
  addCategory: async () => {},
  deleteCategory: async () => {},
});

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);

  // Fetch Products from Supabase on mount
  useEffect(() => {
    const fetchSupabaseProducts = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (!error && data && data.length > 0) {
          const mapped: Product[] = data.map((item) => ({
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
            reviewsCount: item.reviews_count || 15,
            isPopular: item.is_popular ?? false,
            inStock: item.in_stock ?? true,
          }));
          setProducts(mapped);
        }
      } catch (err) {
        console.warn('Products fallback to mockData:', err);
      }
    };

    fetchSupabaseProducts();
  }, []);

  // Fetch Categories from Supabase on mount
  useEffect(() => {
    const fetchSupabaseCategories = async () => {
      try {
        const { data, error } = await supabase.from('categories').select('*');
        if (!error && data && data.length > 0) {
          const mapped: Category[] = data.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            count: c.count || 0,
            iconName: c.icon_name || 'Armchair',
          }));
          setCategories(mapped);
        }
      } catch (err) {
        console.warn('Categories fallback to mockData:', err);
      }
    };

    fetchSupabaseCategories();
  }, []);

  const addProduct = async (prod: Product) => {
    setProducts((prev) => [prod, ...prev]);

    try {
      await supabase.from('products').insert({
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
      });
    } catch (err) {
      console.warn('Add product Supabase error:', err);
    }
  };

  const updateProduct = async (prod: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === prod.id ? prod : p)));

    try {
      await supabase.from('products').upsert({
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
      });
    } catch (err) {
      console.warn('Update product Supabase error:', err);
    }
  };

  const deleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));

    try {
      await supabase.from('products').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete product Supabase error:', err);
    }
  };

  const addCategory = async (cat: Category) => {
    setCategories((prev) => [...prev, cat]);

    try {
      await supabase.from('categories').insert({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        count: cat.count,
        icon_name: cat.iconName,
      });
    } catch (err) {
      console.warn('Add category Supabase error:', err);
    }
  };

  const deleteCategory = async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));

    try {
      await supabase.from('categories').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete category Supabase error:', err);
    }
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
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => useContext(CatalogContext);

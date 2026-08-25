import React, { createContext, useContext, useEffect, useState } from 'react';
import { Banner, ReelsPromo } from '../types';
import { MOCK_BANNERS, DEFAULT_REELS_PROMO } from '../services/mockData';
import { supabase } from '../services/supabaseClient';

interface SettingsContextType {
  banner: Banner;
  reelsPromo: ReelsPromo;
  updateBanner: (banner: Banner) => void;
  updateReelsPromo: (promo: ReelsPromo) => void;
}

const SettingsContext = createContext<SettingsContextType>({
  banner: MOCK_BANNERS[0],
  reelsPromo: DEFAULT_REELS_PROMO,
  updateBanner: () => {},
  updateReelsPromo: () => {},
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [banner, setBanner] = useState<Banner>(MOCK_BANNERS[0]);
  const [reelsPromo, setReelsPromo] = useState<ReelsPromo>(DEFAULT_REELS_PROMO);

  // Fetch Settings from Supabase on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from('settings').select('*').eq('key', 'reels_promo').single();
        if (!error && data?.value) {
          setReelsPromo(data.value);
        } else {
          // Local fallback
          const saved = localStorage.getItem('comet_reels');
          if (saved) setReelsPromo(JSON.parse(saved));
        }
      } catch (e) {
        console.warn('Settings fetch fallback:', e);
      }
    };
    fetchSettings();
  }, []);

  const updateBanner = (newBanner: Banner) => setBanner(newBanner);

  const updateReelsPromo = async (newPromo: ReelsPromo) => {
    setReelsPromo(newPromo);
    try {
      localStorage.setItem('comet_reels', JSON.stringify(newPromo));
      await supabase.from('settings').upsert({ key: 'reels_promo', value: newPromo });
    } catch (e) {
      console.warn('Save settings error:', e);
    }
  };

  return (
    <SettingsContext.Provider value={{ banner, reelsPromo, updateBanner, updateReelsPromo }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);

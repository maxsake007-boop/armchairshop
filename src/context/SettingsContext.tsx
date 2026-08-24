import React, { createContext, useContext, useEffect, useState } from 'react';
import { Banner, ReelsPromo } from '../types';
import { MOCK_BANNERS, DEFAULT_REELS_PROMO } from '../services/mockData';

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
  const [banner, setBanner] = useState<Banner>(() => {
    try {
      const saved = localStorage.getItem('comet_banner');
      return saved ? JSON.parse(saved) : MOCK_BANNERS[0];
    } catch {
      return MOCK_BANNERS[0];
    }
  });

  const [reelsPromo, setReelsPromo] = useState<ReelsPromo>(() => {
    try {
      const saved = localStorage.getItem('comet_reels');
      return saved ? JSON.parse(saved) : DEFAULT_REELS_PROMO;
    } catch {
      return DEFAULT_REELS_PROMO;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('comet_banner', JSON.stringify(banner));
    } catch (e) {
      console.error('Failed to save banner settings', e);
    }
  }, [banner]);

  useEffect(() => {
    try {
      localStorage.setItem('comet_reels', JSON.stringify(reelsPromo));
    } catch (e) {
      console.error('Failed to save reels settings', e);
    }
  }, [reelsPromo]);

  const updateBanner = (newBanner: Banner) => setBanner(newBanner);
  const updateReelsPromo = (newPromo: ReelsPromo) => setReelsPromo(newPromo);

  return (
    <SettingsContext.Provider value={{ banner, reelsPromo, updateBanner, updateReelsPromo }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);

import React, { useState } from 'react';
import { TelegramProvider } from './context/TelegramContext';
import { SettingsProvider } from './context/SettingsContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { RequestsProvider } from './context/RequestsContext';
import { Header } from './components/common/Header';
import { BottomNav, TabType } from './components/common/BottomNav';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { RequestsPage } from './pages/RequestsPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { LeadModal } from './components/lead/LeadModal';
import { SuccessModal } from './components/lead/SuccessModal';
import { Product } from './types';

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [leadProduct, setLeadProduct] = useState<Product | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);

  // Check URL path for /admin
  React.useEffect(() => {
    if (window.location.pathname === '/admin') {
      setIsAdminView(true);
    }
  }, []);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleOrderClick = (product: Product) => {
    setLeadProduct(product);
    setIsLeadModalOpen(true);
  };

  const handleLeadSuccess = () => {
    setIsLeadModalOpen(false);
    setIsSuccessModalOpen(true);
  };

  if (isAdminView) {
    return (
      <AdminDashboardPage
        onBackToApp={() => {
          setIsAdminView(false);
          window.history.pushState({}, '', '/');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dark text-charcoal dark:text-white transition-colors duration-200">
      {/* Top Header */}
      <Header />

      {/* View Switcher */}
      <main className="max-w-md mx-auto">
        {selectedProduct ? (
          <ProductDetailPage
            product={selectedProduct}
            onBack={() => setSelectedProduct(null)}
            onOrderClick={handleOrderClick}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomePage
                onSelectProduct={handleSelectProduct}
                onOrderClick={handleOrderClick}
                onGoToCatalog={() => setActiveTab('catalog')}
              />
            )}
            {activeTab === 'catalog' && (
              <CatalogPage
                onSelectProduct={handleSelectProduct}
                onOrderClick={handleOrderClick}
              />
            )}
            {activeTab === 'favorites' && (
              <FavoritesPage
                onSelectProduct={handleSelectProduct}
                onOrderClick={handleOrderClick}
                onGoToCatalog={() => setActiveTab('catalog')}
              />
            )}
            {activeTab === 'requests' && (
              <RequestsPage onGoToCatalog={() => setActiveTab('catalog')} />
            )}
          </>
        )}
      </main>

      {/* Floating Bottom Nav (Hidden when viewing product detail) */}
      {!selectedProduct && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {/* Lead Modal Form */}
      <LeadModal
        product={leadProduct}
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSuccess={handleLeadSuccess}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        onViewRequests={() => {
          setIsSuccessModalOpen(false);
          setSelectedProduct(null);
          setActiveTab('requests');
        }}
      />
    </div>
  );
};

import { CatalogProvider } from './context/CatalogContext';

export function App() {
  return (
    <TelegramProvider>
      <SettingsProvider>
        <CatalogProvider>
          <FavoritesProvider>
            <RequestsProvider>
              <AppContent />
            </RequestsProvider>
          </FavoritesProvider>
        </CatalogProvider>
      </SettingsProvider>
    </TelegramProvider>
  );
}

export default App;

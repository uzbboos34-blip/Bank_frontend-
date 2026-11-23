import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';
import { syncPendingActions, getPendingActions } from '../../utils/offlineSync';

const ROUTE_TITLES = {
  '/debtors': "Kredit portfeli va NPL kreditlar ro'yxati",
  '/report': 'Hisobot',
  '/import': 'Excel yuklash',
  '/employees': 'Xodimlarni boshqarish',
};

export default function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(getPendingActions().length);
  const location = useLocation();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingActions().then(() => {
        setPendingCount(getPendingActions().length);
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setPendingCount(getPendingActions().length);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Dastur ochilganda internet bo'lsa, qolib ketganlarni sinxronlashtiramiz
    if (navigator.onLine) {
      syncPendingActions().then(() => {
        setPendingCount(getPendingActions().length);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getTitle = () => {
    if (location.pathname.startsWith('/debtor/')) {
      return 'Qarzdor ma\'lumotlari';
    }
    return ROUTE_TITLES[location.pathname] || 'Undiruv Tizimi';
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      {/* 1. Desktop Sidebar (hidden on mobile, drawer on mobile click) */}
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* 2. Fluid Adaptive Content Area (Adapts to full screen on Desktop and Mobile) */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuToggle={() => setMobileMenuOpen(true)} title={getTitle()} />

        {/* 📴 OFFLINE STATUS BANNER */}
        {!isOnline && (
          <div className="bg-amber-500 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              <span>📴 Oflayn rejim — kiritilgan ma'lumotlar telefon xotirasida saqlanadi</span>
            </div>
            {pendingCount > 0 && (
              <span className="bg-amber-700/60 px-2 py-0.5 rounded text-[11px]">
                {pendingCount} ta amal kutilmoqda
              </span>
            )}
          </div>
        )}

        {/* Content expands fluidly to fill 100% of the screen like BOSS CRM */}
        <main className="flex-1 p-3 sm:p-5 md:p-6 pb-24 md:pb-8 w-full">
          <Outlet />
        </main>

        {/* 3. Mobile Bottom Navigation (Visible ONLY on mobile screens, hidden on desktop) */}
        <MobileBottomNav />
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { showToast } from '../components/GlobalToast';

export function useLiveUpdate() {
  useEffect(() => {
    // Faqat haqiqiy Android/iOS native ilovasida ishlaydi
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // 1. Ilova muvaffaqiyatli ochilganini DARHOL xabar qilish (rollback bo'lmasligi uchun)
    CapacitorUpdater.notifyAppReady().catch((err) => {
      console.warn('[LiveUpdate] notifyAppReady warning:', err);
    });

    const checkUpdates = async () => {
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'https://bank-backend-syzt.onrender.com';
        const response = await fetch(`${backendUrl}/auth/app-version?t=${Date.now()}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (!data.success || !data.version || data.version === '1.0.0') {
          return;
        }

        const latestVersion = data.version;
        const downloadUrl = data.url;

        let currentVersion = 'builtin';
        try {
          const current = await CapacitorUpdater.current();
          currentVersion = current?.bundle?.version || 'builtin';
        } catch (currentErr) {
          console.warn('[LiveUpdate] current version error:', currentErr);
        }

        if (currentVersion !== latestVersion && downloadUrl) {
          showToast('Yangi versiya yuklanmoqda...', 'info');
          const bundle = await CapacitorUpdater.download({
            url: downloadUrl,
            version: latestVersion,
          });
          // Keshni tozalaymiz va darhol yangi versiyaga o'tamiz
          try {
            localStorage.removeItem('cached_debtors_list');
          } catch (e) {}
          showToast('Ilova yangilandi! Ochilmoqda...', 'success');
          await CapacitorUpdater.set(bundle);
        }
      } catch (error) {
        console.error('[LiveUpdate] Xatolik:', error);
      }
    };

    const timer = setTimeout(() => {
      checkUpdates();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);
}

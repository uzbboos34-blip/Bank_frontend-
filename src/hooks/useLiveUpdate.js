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

    const checkUpdates = async () => {
      try {
        // 1. Ilova muvaffaqiyatli yuklanganini xabar qilish
        try {
          await CapacitorUpdater.notifyAppReady();
          console.log('[LiveUpdate] App ready');
        } catch (readyErr) {
          console.warn('[LiveUpdate] notifyAppReady warning:', readyErr);
        }

        // 2. Yangilanish foydalanuvchiga xalaqit bermasligi uchun fonda yuklanadi
        try {
          await CapacitorUpdater.setDelay({ kind: 'background' });
        } catch (delayErr) {
          console.warn('[LiveUpdate] setDelay warning:', delayErr);
        }

        // 3. Yangi versiya metadata ma'lumotini backenddan so'rash
        const backendUrl = import.meta.env.VITE_API_URL || 'https://undiruv-backend.onrender.com';
        const response = await fetch(`${backendUrl}/auth/app-version?t=${Date.now()}`);

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (!data.success || !data.version) {
          return;
        }

        const latestVersion = data.version;
        const downloadUrl = data.url;

        // 4. Hozirgi o'rnatilgan versiyani tekshirish
        let currentVersion = 'builtin';
        try {
          const current = await CapacitorUpdater.current();
          currentVersion = current?.bundle?.version || 'builtin';
        } catch (currentErr) {
          console.warn('[LiveUpdate] current version error:', currentErr);
        }

        console.log(`[LiveUpdate] Hozirgi: ${currentVersion}, Yangi: ${latestVersion}`);

        if (currentVersion !== latestVersion && downloadUrl) {
          console.log(`[LiveUpdate] Yangi versiya topildi: ${latestVersion}, yuklanmoqda...`);
          // Yangi versiyani fonda yuklab olib o'rnatadi
          const bundle = await CapacitorUpdater.download({
            url: downloadUrl,
            version: latestVersion,
          });
          await CapacitorUpdater.set(bundle);
          showToast('Ilova yangilandi. Qayta kirilganda yangi versiya ochiladi', 'info');
        }
      } catch (error) {
        console.error('[LiveUpdate] Xatolik:', error);
      }
    };

    // Ilova yuklangandan 3 soniya o'tib fonda yangilanishni tekshiradi
    const timer = setTimeout(() => {
      checkUpdates();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);
}

import api from '../api/axios';
import { showToast } from '../components/GlobalToast';

const PENDING_STORAGE_KEY = 'pending_debtor_actions';

/**
 * Saqlangan oflayn amallarni olish
 */
export function getPendingActions() {
  try {
    const raw = localStorage.getItem(PENDING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Yangi oflayn amalni navbatga qo'shish
 */
export function savePendingAction(action) {
  try {
    const pending = getPendingActions();
    pending.push({
      ...action,
      id: 'pending-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(pending));
    return true;
  } catch (err) {
    console.error('Oflayn amalni saqlashda xatolik:', err);
    return false;
  }
}

/**
 * Internet paydo bo'lganda oflayn to'plangan barcha amallarni serverga sinxronlashtirish
 */
export async function syncPendingActions() {
  if (!navigator.onLine) {
    return;
  }

  const pending = getPendingActions();
  if (pending.length === 0) {
    return;
  }

  console.log(`[AutoSync] ${pending.length} ta oflayn amal sinxronlashtirilmoqda...`);
  const remaining = [];
  let successCount = 0;

  for (const item of pending) {
    try {
      // 1. Status va va'da sanasini yangilash
      await api.patch(`/debtors/${item.debtorId}`, {
        status: item.status,
        promiseDate: item.promiseDate,
      });

      // 2. Qayd (note) saqlash
      if (item.note || item.status) {
        const clientId = 'note-sync-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
        await api.post(`/debtors/${item.debtorId}/notes`, {
          clientId,
          status: item.status,
          text: item.note || undefined,
        });
      }

      successCount++;
    } catch (err) {
      console.error(`[AutoSync] Debtor #${item.debtorId} sinxronlashda xatolik:`, err);
      remaining.push(item); // Agar xatolik bo'lsa, navbatda qoldiramiz
    }
  }

  localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(remaining));

  if (successCount > 0) {
    showToast(`✅ ${successCount} ta oflayn amal serverga muvaffaqiyatli yuklandi!`, 'success');
  }
}

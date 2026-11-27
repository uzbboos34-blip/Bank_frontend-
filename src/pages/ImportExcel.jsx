import React, { useState } from 'react';
import api from '../api/axios';
import { showToast } from '../components/GlobalToast';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { CircularProgress } from '@mui/material';

export default function ImportExcel() {
  const [loading, setLoading] = useState(false);
  const [uploadStats, setUploadStats] = useState(() => {
    const saved = localStorage.getItem('last_import_stats');
    return saved
      ? JSON.parse(saved)
      : {
          date: '16-noyabr, 09:12',
          created: 12,
          updated: 34,
          archived: 3,
        };
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/debtors/import', formData, { timeout: 120000 });
      const nowStr = new Date().toLocaleDateString('uz-UZ', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      });

      const newStats = {
        date: nowStr,
        created: res.data.created,
        updated: res.data.updated,
        archived: res.data.archived,
      };

      setUploadStats(newStats);
      localStorage.setItem('last_import_stats', JSON.stringify(newStats));
      localStorage.removeItem('cached_debtors_list');
      showToast('Excel muvaffaqiyatli yuklandi!', 'success');
    } catch (err) {
      showToast(err.userMessage || 'Excel faylni yuklashda xatolik', 'error');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4 pb-6 select-none">
      {/* Header: Title (Screenshot 4) */}
      <div className="pt-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Excel yuklash</h1>
      </div>

      {/* Top Card: Explanation & Big Blue Select Button (Screenshot 4) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
          Bank bergan yangi ro'yxatni (.xlsx) tanlang. Dastur o'zi o'qib, qarzdorlarni joylashtiradi.
        </p>

        {/* Big Blue Button with hidden file input */}
        <label className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-2xl font-black text-sm sm:text-base shadow-md shadow-blue-600/25 transition cursor-pointer flex items-center justify-center gap-2">
          {loading ? (
            <>
              <CircularProgress size={20} color="inherit" />
              <span>O'qilmoqda...</span>
            </>
          ) : (
            <>
              <ArrowUpwardIcon sx={{ fontSize: 20 }} />
              <span>Excel faylni tanlash</span>
            </>
          )}
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            disabled={loading}
            className="hidden"
          />
        </label>
      </div>

      {/* Middle Card: Oxirgi yuklash · 16-noyabr, 09:12 (Screenshot 4) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
        <span className="text-xs font-bold text-slate-700 block">
          Oxirgi yuklash · {uploadStats.date}
        </span>

        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          {/* Yangi */}
          <div>
            <span className="text-3xl font-black text-blue-600 block tracking-tight">
              {uploadStats.created}
            </span>
            <span className="text-xs font-bold text-slate-600 block mt-0.5">Yangi</span>
          </div>

          {/* Yangilandi */}
          <div>
            <span className="text-3xl font-black text-slate-900 block tracking-tight">
              {uploadStats.updated}
            </span>
            <span className="text-xs font-bold text-slate-600 block mt-0.5">Yangilandi</span>
          </div>

          {/* Arxivga */}
          <div>
            <span className="text-3xl font-black text-slate-900 block tracking-tight">
              {uploadStats.archived}
            </span>
            <span className="text-xs font-bold text-slate-600 block mt-0.5">Arxivga</span>
          </div>
        </div>
      </div>

      {/* Bottom Notice Card (Light Blue Container - Screenshot 4) */}
      <div className="bg-[#eef5ff] border border-blue-100 rounded-3xl p-4 sm:p-5">
        <p className="text-xs sm:text-sm text-blue-950 font-semibold leading-relaxed">
          Sizning qaydlaringiz va va'da sanalaringiz o'zgarmaydi. Yangi ro'yxatda yo'q bo'lgan mijozlar o'chmaydi, arxivga o'tadi.
        </p>
      </div>
    </div>
  );
}

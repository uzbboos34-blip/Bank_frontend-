import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { showToast } from '../components/GlobalToast';
import { CircularProgress } from '@mui/material';

export default function Report() {
  const [period, setPeriod] = useState('bugun'); // 'bugun' | 'hafta' | 'oy'
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [period]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/stats/report', { params: { period } });
      setReportData(res.data);
    } catch (err) {
      showToast(err.userMessage || 'Hisobotni yuklashda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = () => {
    if (!reportData?.summaryText) return;
    navigator.clipboard.writeText(reportData.summaryText);
    showToast('Hisobot matni nusxalandi!', 'success');
  };

  const handleShare = () => {
    if (!reportData?.summaryText) return;
    const text = encodeURIComponent(reportData.summaryText);
    if (navigator.share) {
      navigator.share({
        title: 'Undiruv hisoboti',
        text: reportData.summaryText,
      }).catch(() => {});
    } else {
      window.open(`https://t.me/share/url?url=${text}`, '_blank');
    }
  };

  const todayDateStr = new Date().toLocaleDateString('uz-UZ', {
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="space-y-4 pb-4 select-none w-full max-w-5xl mx-auto">
      {/* Header: Title & Current Date (Screenshot 3) */}
      <div className="flex items-baseline justify-between pt-1">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Hisobot</h1>
        <span className="text-sm font-semibold text-slate-500">{todayDateStr}</span>
      </div>

      {/* Period Switcher (Bugun | Hafta | Oy) */}
      <div className="bg-slate-200/70 p-1 rounded-2xl flex items-center max-w-md">
        <button
          type="button"
          onClick={() => setPeriod('bugun')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer text-center ${
            period === 'bugun'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Bugun
        </button>
        <button
          type="button"
          onClick={() => setPeriod('hafta')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer text-center ${
            period === 'hafta'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Hafta
        </button>
        <button
          type="button"
          onClick={() => setPeriod('oy')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer text-center ${
            period === 'oy'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Oy
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400">
          <CircularProgress size={30} />
          <p className="text-xs mt-2 font-medium">Hisobot hisoblanmoqda...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Column 1: Undirildi & To'lovlar */}
          <div className="space-y-4">
            {/* Card: Bugun undirildi (Screenshot 3) */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-3">
              <span className="text-xs font-semibold text-slate-600 block">
                {period === 'bugun' ? 'Bugun undirildi' : period === 'hafta' ? 'Hafta davomida undirildi' : 'Oy davomida undirildi'}
              </span>

              <div>
                <div className="text-3xl sm:text-4xl font-black text-emerald-800 tracking-tight">
                  {reportData?.undirildiFormatted || '0 so\'m'}
                </div>
                <span className="text-xs font-semibold text-slate-500 mt-0.5 block">
                  {reportData?.tolaganCount || 0} ta mijozdan
                </span>
              </div>

              <div className="border-t border-slate-100 pt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="block text-xl font-black text-slate-900">
                    {reportData?.borildiCount || 0}
                  </span>
                  <span className="block text-xs font-bold text-slate-500 mt-0.5">Borildi</span>
                </div>
                <div>
                  <span className="block text-xl font-black text-emerald-700">
                    {reportData?.tolaganCount || 0}
                  </span>
                  <span className="block text-xs font-bold text-slate-500 mt-0.5">To'ladi</span>
                </div>
                <div>
                  <span className="block text-xl font-black text-amber-700">
                    {reportData?.vadaCount || 0}
                  </span>
                  <span className="block text-xs font-bold text-slate-500 mt-0.5">Va'da berdi</span>
                </div>
              </div>
            </div>

            {/* Card: To'lovlar (Screenshot 3) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
              <h3 className="font-extrabold text-slate-900 text-base">To'lovlar</h3>

              {!reportData?.toLovlar || reportData.toLovlar.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">Hali to'lovlar qayd etilmagan</p>
              ) : (
                <div className="space-y-3">
                  {reportData.toLovlar.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs sm:text-sm border-b border-slate-100 last:border-b-0 pb-2 last:pb-0">
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-slate-900 truncate block">
                          {item.fullName}
                        </span>
                        {item.paidFormatted && (
                          <span className="text-[11px] text-slate-500 font-medium block">
                            To'lov: {item.paidFormatted}
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-black text-emerald-700 block text-xs sm:text-sm">
                          {item.amountFormatted}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-semibold">
                          Asosiy qarz
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Rahbarga yuboriladigan matn & Tugmalar */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase">Rahbarga yuboriladigan matn</h4>
              <div className="bg-slate-50 p-4 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-line border border-slate-100 min-h-[160px]">
                {reportData?.summaryText || 'Hisobot ma\'lumoti mavjud emas'}
              </div>

              {/* 2 Action Buttons (Screenshot 3: Nusxa olish / Yuborish) */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="py-3.5 px-4 bg-white hover:bg-slate-50 active:scale-[0.99] text-blue-600 border-2 border-blue-600 rounded-2xl font-black text-sm transition cursor-pointer text-center"
                >
                  Nusxa olish
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-2xl font-black text-sm shadow-md shadow-blue-600/25 transition cursor-pointer text-center"
                >
                  Yuborish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

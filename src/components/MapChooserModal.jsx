import React from 'react';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CloseIcon from '@mui/icons-material/Close';
import NavigationIcon from '@mui/icons-material/Navigation';

export default function MapChooserModal({ isOpen, onClose, address, mfy, lat, lng, fullName }) {
  if (!isOpen) return null;

  // Agar manzilda "Беруний" yoki "Beruniy" bo'lmasa — xaritaga aniq "Беруний тумани" deb qo'shib yuboramiz.
  // Shunda Yandex/Google xaritasi Toshkent yoki Urganchga adashib ketmaydi, aynan Bерунийдан qidiradi!
  const rawAddress = [mfy, address].filter(Boolean).join(', ') || 'Беруний';
  const hasBeruniy = rawAddress.toLowerCase().includes('беруний') || rawAddress.toLowerCase().includes('beruniy');
  const searchAddress = hasBeruniy ? rawAddress : `Беруний тумани, ${rawAddress}`;

  const openYandex = () => {
    let url = '';
    if (lat && lng) {
      url = `https://yandex.uz/maps/?pt=${lng},${lat}&z=16&l=map&text=${encodeURIComponent(searchAddress)}`;
    } else {
      url = `https://yandex.uz/maps/?text=${encodeURIComponent(searchAddress)}`;
    }
    window.open(url, '_system');
    onClose();
  };

  const openGoogle = () => {
    let url = '';
    if (lat && lng) {
      url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchAddress)}`;
    }
    window.open(url, '_system');
    onClose();
  };

  const open2Gis = () => {
    const url = `https://2gis.uz/search/${encodeURIComponent(searchAddress)}`;
    window.open(url, '_system');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in select-none">
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 w-full max-w-sm shadow-2xl border border-slate-100 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Yuqori chiziqcha (mobil uchun) */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto sm:hidden mb-1" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <NavigationIcon sx={{ fontSize: 22 }} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Xaritani tanlang</h3>
              <p className="text-[11px] text-slate-500 font-medium">Qaysi dasturda ochmoqchisiz?</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Manzil kartochkasi */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
          {fullName && (
            <span className="block font-bold text-slate-800 text-xs mb-0.5">{fullName}</span>
          )}
          <div className="flex items-start gap-1.5 text-slate-600">
            <LocationOnIcon sx={{ fontSize: 16 }} className="text-rose-500 shrink-0 mt-0.5" />
            <span className="font-medium text-[11px] leading-tight">{searchAddress}</span>
          </div>
        </div>

        {/* Xarita variantlari */}
        <div className="space-y-2 pt-1">
          {/* 1. Yandex Xarita */}
          <button
            type="button"
            onClick={openYandex}
            className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-400 rounded-2xl transition cursor-pointer active:scale-[0.99] text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                Я
              </div>
              <div>
                <span className="block text-sm font-extrabold text-slate-900 group-hover:text-red-600 transition">
                  Yandex Xarita (Яндекс)
                </span>
                <span className="block text-[11px] text-slate-500 font-medium">
                  Yandex Maps & Navigator
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-red-600 px-2 py-1 bg-red-50 rounded-lg">
              Ochish
            </span>
          </button>

          {/* 2. Google Maps */}
          <button
            type="button"
            onClick={openGoogle}
            className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-400 rounded-2xl transition cursor-pointer active:scale-[0.99] text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                G
              </div>
              <div>
                <span className="block text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition">
                  Google Maps
                </span>
                <span className="block text-[11px] text-slate-500 font-medium">
                  Google Xaritalar
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-600 px-2 py-1 bg-blue-50 rounded-lg">
              Ochish
            </span>
          </button>

          {/* 3. 2GIS */}
          <button
            type="button"
            onClick={open2Gis}
            className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-400 rounded-2xl transition cursor-pointer active:scale-[0.99] text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                2G
              </div>
              <div>
                <span className="block text-sm font-extrabold text-slate-900 group-hover:text-emerald-600 transition">
                  2GIS (2ГИС)
                </span>
                <span className="block text-[11px] text-slate-500 font-medium">
                  Shahar xaritasi va marshrut
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 px-2 py-1 bg-emerald-50 rounded-lg">
              Ochish
            </span>
          </button>
        </div>

        {/* Bekor qilish */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer mt-1"
        >
          Bekor qilish
        </button>
      </div>
    </div>
  );
}

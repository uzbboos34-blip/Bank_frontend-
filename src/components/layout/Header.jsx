import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';

export default function Header({ onMenuToggle, title }) {
  const { user, logout } = useAuth();

  // Mobil ekranlar uchun qisqa sarlavha
  const displayTitle = title === "Kredit portfeli va NPL kreditlar ro'yxati" ? "Qarzdorlar" : title;

  return (
    <header className="sticky top-0 z-30 bg-white/95 border-b border-slate-200 px-3.5 py-2.5 sm:px-6 pt-[max(env(safe-area-inset-top,6px),10px)]">
      <div className="flex items-center justify-between max-w-7xl mx-auto gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onMenuToggle}
            className="md:hidden p-1.5 -ml-1 rounded-xl text-slate-700 hover:bg-slate-100 transition shrink-0"
            aria-label="Menyu"
          >
            <MenuIcon sx={{ fontSize: 24 }} />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight truncate leading-tight">
              <span className="sm:hidden">{displayTitle}</span>
              <span className="hidden sm:inline">{title || "Undiruv Tizimi"}</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Bank undiruv bo'limi avtomatlashtirilgan tizimi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-full py-1 px-2 sm:py-1.5 sm:px-3">
            <Avatar
              sx={{
                width: 26,
                height: 26,
                bgcolor: user?.role === 'SUPER_ADMIN' ? '#6366f1' : '#2563eb',
                fontSize: '0.75rem',
                fontWeight: 800,
              }}
            >
              {user?.fullName ? user.fullName[0].toUpperCase() : (user?.login ? user.login[0].toUpperCase() : 'U')}
            </Avatar>
            <div className="text-left hidden xs:block">
              <span className="block text-xs font-bold text-slate-900 leading-tight">
                {user?.fullName || user?.login}
              </span>
              <span className="block text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">
                {user?.role === 'SUPER_ADMIN' ? 'Admin' : 'Kollektor'}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            title="Tizimdan chiqish"
          >
            <LogoutIcon sx={{ fontSize: 20 }} />
          </button>
        </div>
      </div>
    </header>
  );
}

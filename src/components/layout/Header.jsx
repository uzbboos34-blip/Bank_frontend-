import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';

export default function Header({ onMenuToggle, title }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            aria-label="Menyu"
          >
            <MenuIcon />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {title || "Undiruv Tizimi"}
            </h1>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Bank undiruv bo'limi avtomatlashtirilgan tizimi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 rounded-full py-1.5 px-3">
            <Avatar
              sx={{
                width: 30,
                height: 30,
                bgcolor: user?.role === 'SUPER_ADMIN' ? '#6366f1' : '#2563eb',
                fontSize: '0.85rem',
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
                {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Undiruvchi'}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            title="Tizimdan chiqish"
          >
            <LogoutIcon fontSize="small" />
          </button>
        </div>
      </div>
    </header>
  );
}

import React from 'react';
import { NavLink } from 'react-router-dom';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import BarChartIcon from '@mui/icons-material/BarChart';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

export default function MobileBottomNav() {
  const navItems = [
    { label: "Ro'yxat", path: '/debtors', icon: <FormatListBulletedIcon sx={{ fontSize: 24 }} /> },
    { label: 'Hisobot', path: '/report', icon: <BarChartIcon sx={{ fontSize: 24 }} /> },
    { label: 'Yuklash', path: '/import', icon: <ArrowUpwardIcon sx={{ fontSize: 24 }} /> },
  ];

  return (
    // DIQQAT: Faqat mobil ekranlarda chiqadi (md:hidden), desktopda yon panel bor!
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-md border-t border-slate-200/90 py-2 px-6 flex items-center justify-around shadow-lg shadow-slate-900/10">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 transition min-w-[70px] ${
              isActive
                ? 'text-blue-600 font-extrabold scale-105'
                : 'text-slate-500 hover:text-slate-800 font-semibold'
            }`
          }
        >
          <div className="mb-0.5">{item.icon}</div>
          <span className="text-[11px] tracking-tight leading-none">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

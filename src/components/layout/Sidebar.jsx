import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import BarChartIcon from '@mui/icons-material/BarChart';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CloseIcon from '@mui/icons-material/Close';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const location = useLocation();

  const menuItems = [
    { label: "Ro'yxat", path: '/debtors', icon: <FormatListBulletedIcon sx={{ fontSize: 20 }} /> },
    { label: 'Hisobot', path: '/report', icon: <BarChartIcon sx={{ fontSize: 20 }} /> },
  ];

  if (user?.role === 'SUPER_ADMIN') {
    menuItems.push({
      label: 'Xodimlar',
      path: '/employees',
      icon: <SupervisorAccountIcon sx={{ fontSize: 20 }} />,
    });
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 w-64 select-none">
      {/* Brand Logo & Name */}
      <div className="p-5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <AccountBalanceIcon sx={{ fontSize: 22 }} />
          </div>
          <div>
            <span className="font-black text-white text-base tracking-tight block">Undiruv</span>
            <span className="text-[11px] font-bold text-blue-400 tracking-wider uppercase block">Bank CRM</span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <CloseIcon fontSize="small" />
          </button>
        )}
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
          Asosiy menyu
        </div>

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-sm transition ${
                isActive || (item.path === '/debtors' && location.pathname.startsWith('/debtor/'))
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
              }`
            }
          >
            <span className="text-inherit opacity-90">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer User Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs">
        <p className="font-bold text-slate-200 truncate">{user?.fullName || user?.login}</p>
        <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider mt-0.5">
          {user?.role === 'SUPER_ADMIN' ? 'Super Administrator' : 'Undiruv xodimi'}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:block w-64 h-screen sticky top-0 shrink-0 z-30 border-r border-slate-800">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <div className="relative flex-1 max-w-xs w-full bg-slate-900 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

import React from 'react';

const STATUS_CONFIG = {
  NEW: { label: 'Yangi', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  NOT_HOME: { label: 'Uyda yo\'q', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  PROMISED: { label: 'Va\'da bergan', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  NO_MONEY: { label: 'Puli yo\'q', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  PHONE_OFF: { label: 'O\'chiq', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  MOVED: { label: 'Ko\'chgan', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  PAID: { label: 'To\'langan', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

export default function StatusBadge({ status, className = '' }) {
  const config = STATUS_CONFIG[status] || {
    label: status || 'Noma\'lum',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {config.label}
    </span>
  );
}

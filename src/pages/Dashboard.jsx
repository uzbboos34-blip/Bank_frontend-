import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HandshakeIcon from '@mui/icons-material/Handshake';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PhoneIcon from '@mui/icons-material/Phone';
import StatusBadge from '../components/StatusBadge';
import { CircularProgress } from '@mui/material';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, visited: 0, promised: 0, paid: 0 });
  const [todayDebtors, setTodayDebtors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, todayRes] = await Promise.all([
        api.get('/stats/today'),
        api.get('/debtors/today'),
      ]);
      setStats(statsRes.data);
      setTodayDebtors(todayRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('uz-UZ').format(num) + ' so\'m';
  };

  const statCards = [
    {
      title: 'Jami Qarzdorlar',
      value: stats.total,
      icon: <PeopleAltIcon sx={{ fontSize: 26 }} />,
      color: 'bg-blue-500 text-white',
      border: 'border-blue-100',
    },
    {
      title: 'Bugun Borilgan',
      value: stats.visited,
      icon: <DirectionsWalkIcon sx={{ fontSize: 26 }} />,
      color: 'bg-amber-500 text-white',
      border: 'border-amber-100',
    },
    {
      title: 'Va\'da Bergan',
      value: stats.promised,
      icon: <HandshakeIcon sx={{ fontSize: 26 }} />,
      color: 'bg-purple-600 text-white',
      border: 'border-purple-100',
    },
    {
      title: 'Qarzni To\'lagan',
      value: stats.paid,
      icon: <CheckCircleOutlineIcon sx={{ fontSize: 26 }} />,
      color: 'bg-emerald-600 text-white',
      border: 'border-emerald-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 rounded-3xl p-5 sm:p-7 text-white shadow-xl shadow-indigo-950/20 relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur rounded-full text-xs font-semibold text-indigo-200 mb-2">
            Bugungi sana: {new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Assalomu alaykum, {user?.fullName || user?.login}!
          </h2>
          <p className="text-sm text-indigo-200/90 mt-1 max-w-lg">
            Bugungi rejangizda <span className="font-bold text-white underline">{todayDebtors.length} ta</span> qarzdor sizni kutmoqda.
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              onClick={() => navigate('/today')}
              className="px-4 py-2 bg-white text-indigo-900 rounded-xl font-bold text-xs sm:text-sm shadow hover:bg-slate-100 transition flex items-center gap-2"
            >
              <EventNoteIcon fontSize="small" />
              <span>Bugungi rejaga o'tish</span>
            </button>
            <button
              onClick={() => navigate('/import')}
              className="px-4 py-2 bg-indigo-700/80 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2"
            >
              <UploadFileIcon fontSize="small" />
              <span>Excel yuklash</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.title}</span>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color} shadow-sm`}>
                {card.icon}
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? <CircularProgress size={24} /> : card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Today's Urgent Debtors List Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <EventNoteIcon fontSize="small" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Bugungi rejadagi qarzdorlar</h3>
              <p className="text-xs text-slate-500">To'lov va'dasi berilgan yoki muddati o'tganlar</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/today')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1"
          >
            <span>Barchasi ({todayDebtors.length})</span>
            <ArrowForwardIosIcon sx={{ fontSize: 10 }} />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              <CircularProgress size={28} />
              <p className="text-xs mt-2">Yuklanmoqda...</p>
            </div>
          ) : todayDebtors.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <CheckCircleOutlineIcon sx={{ fontSize: 40 }} className="text-emerald-500 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Bugungi rejada hech qanday qarz yo'q!</p>
              <p className="text-xs text-slate-400 mt-0.5">Barcha bugungi va'dalar bajarilgan yoki yangi reja kiritilmagan.</p>
            </div>
          ) : (
            todayDebtors.slice(0, 5).map((debtor) => (
              <div
                key={debtor.id}
                onClick={() => navigate(`/debtors/${debtor.id}`)}
                className="p-4 hover:bg-slate-50/80 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900 text-sm truncate">{debtor.fullName}</span>
                    <StatusBadge status={debtor.status} />
                  </div>
                  <p className="text-xs text-slate-500 truncate mb-1.5">
                    📍 {debtor.mfy ? `${debtor.mfy}, ` : ''}{debtor.address || 'Manzil ko\'rsatilmagan'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                      Qarz: {formatMoney(debtor.minDebt)}
                    </span>
                    {debtor.promiseDate && (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-medium">
                        ⏰ Va'da: {new Date(debtor.promiseDate).toLocaleDateString('uz-UZ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {debtor.phones && debtor.phones[0] && (
                    <a
                      href={`tel:${debtor.phones[0]}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1.5 border border-emerald-200 transition"
                    >
                      <PhoneIcon fontSize="small" />
                      <span>Qo'ng'iroq</span>
                    </a>
                  )}
                  <div className="text-slate-400">
                    <ArrowForwardIosIcon sx={{ fontSize: 12 }} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

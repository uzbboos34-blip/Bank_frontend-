import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { CircularProgress } from '@mui/material';

export default function Login() {
  const [loginVal, setLoginVal] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!loginVal.trim() || !pin.trim()) {
      setError('Login va PIN kodni kiriting');
      return;
    }

    const res = await login(loginVal.trim(), pin.trim());
    if (res.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(res.error);
    }
  };

  const handleQuickFill = (uLogin, uPin) => {
    setLoginVal(uLogin);
    setPin(uPin);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20 backdrop-blur-sm">
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-600/30 mb-3">
              <AccountBalanceIcon sx={{ fontSize: 34 }} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Undiruv Yordamchisi</h2>
            <p className="text-sm text-slate-500 mt-1">Bank qarzdorlar tizimiga kirish</p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-2 animate-in fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Login
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <PersonOutlineIcon fontSize="small" />
                </div>
                <input
                  type="text"
                  value={loginVal}
                  onChange={(e) => setLoginVal(e.target.value)}
                  placeholder="Loginni kiriting"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm font-medium transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                PIN Kod
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <LockOutlinedIcon fontSize="small" />
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="PIN kodni kiriting (masalan: 1234)"
                  required
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm font-medium transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPin ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/30 transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {loading ? (
                <>
                  <CircularProgress size={18} color="inherit" />
                  <span>Tekshirilmoqda...</span>
                </>
              ) : (
                <span>Tizimga kirish</span>
              )}
            </button>
          </form>

          {/* Quick Demo logins for convenience */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2.5">
              Tezkor tanlash (Sinov uchun)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('bank_collector', '1234')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 text-slate-700 text-left transition"
              >
                <span className="block font-bold text-indigo-600">Undiruvchi</span>
                <span className="text-[11px] text-slate-500">bank_collector / 1234</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('super_admin', '7777')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-purple-400 bg-slate-50 hover:bg-purple-50/50 text-slate-700 text-left transition"
              >
                <span className="block font-bold text-purple-600">Super Admin</span>
                <span className="text-[11px] text-slate-500">super_admin / 7777</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          &copy; {new Date().getFullYear()} Bank Undiruv Bo'limi. Xavfsiz tizim.
        </p>
      </div>
    </div>
  );
}

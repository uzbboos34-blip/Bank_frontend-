import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/GlobalToast';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LockResetIcon from '@mui/icons-material/LockReset';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import {
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
} from '@mui/material';

export default function Employees() {
  const { user: currentUser } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Employee modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newLogin, setNewLogin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('COLLECTOR');
  const [adding, setAdding] = useState(false);

  // Reset PIN modal
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [updatedPin, setUpdatedPin] = useState('');
  const [updatingPin, setUpdatingPin] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setEmployees(res.data);
    } catch (err) {
      showToast(err.userMessage || 'Xodimlarni yuklashda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (!newLogin.trim() || !newPin.trim()) {
      showToast('Login va PIN kiritilishi shart', 'error');
      return;
    }

    setAdding(true);
    try {
      await api.post('/users', {
        login: newLogin.trim(),
        pin: newPin.trim(),
        fullName: newFullName.trim() || undefined,
        role: newRole,
      });
      showToast('Yangi xodim muvaffaqiyatli qo\'shildi!', 'success');
      setAddModalOpen(false);
      setNewLogin('');
      setNewPin('');
      setNewFullName('');
      loadEmployees();
    } catch (err) {
      showToast(err.userMessage || 'Xodim qo\'shishda xatolik', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleActive = async (emp) => {
    try {
      await api.patch(`/users/${emp.id}`, {
        isActive: !emp.isActive,
      });
      showToast(
        `Xodim ${!emp.isActive ? 'faollashtirildi' : 'bloklandi'}`,
        'success',
      );
      loadEmployees();
    } catch (err) {
      showToast(err.userMessage || 'Xatolik yuz berdi', 'error');
    }
  };

  const handleOpenPinModal = (emp) => {
    setSelectedUser(emp);
    setUpdatedPin('');
    setPinModalOpen(true);
  };

  const handleSaveNewPin = async () => {
    if (!updatedPin.trim() || updatedPin.length < 4) {
      showToast('PIN kamida 4 xonali bo\'lishi kerak', 'error');
      return;
    }

    setUpdatingPin(true);
    try {
      await api.patch(`/users/${selectedUser.id}`, {
        pin: updatedPin.trim(),
      });
      showToast('Yangi PIN kod muvaffaqiyatli o\'rnatildi', 'success');
      setPinModalOpen(false);
    } catch (err) {
      showToast(err.userMessage || 'PIN yangilashda xatolik', 'error');
    } finally {
      setUpdatingPin(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Xodimlarni Boshqarish
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Undiruv xodimlarini ro'yxatdan o'tkazish, PIN kodini almashtirish va faolligini nazorat qilish
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <PersonAddIcon fontSize="small" />
          <span>Yangi xodim qo'shish</span>
        </button>
      </div>

      {/* Employees Table / Cards */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">
          <CircularProgress size={32} />
          <p className="text-xs mt-2">Xodimlar ro'yxati yuklanmoqda...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-200">
          Xodimlar topilmadi
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className={`bg-white rounded-2xl p-5 border ${
                emp.isActive ? 'border-slate-200/80' : 'border-rose-200 bg-rose-50/20'
              } shadow-sm space-y-3`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-base">{emp.fullName || emp.login}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        emp.role === 'SUPER_ADMIN'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {emp.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Undiruvchi'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono block mt-0.5">Login: @{emp.login}</span>
                </div>

                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                    emp.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {emp.isActive ? 'Faol' : 'Bloklangan'}
                </span>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl flex items-center justify-between">
                <span>Biriktirilgan qarzdorlar:</span>
                <strong className="text-slate-900 text-sm">{emp._count?.debtors || 0} ta</strong>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenPinModal(emp)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <LockResetIcon fontSize="small" />
                  <span>PIN almashtirish</span>
                </button>

                {emp.id !== currentUser?.id && (
                  <button
                    onClick={() => handleToggleActive(emp)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${
                      emp.isActive
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {emp.isActive ? (
                      <>
                        <BlockIcon sx={{ fontSize: 14 }} />
                        <span>Bloklash</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon sx={{ fontSize: 14 }} />
                        <span>Faollashtirish</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Employee Dialog */}
      <Dialog open={addModalOpen} onClose={() => setAddModalOpen(false)} fullWidth maxWidth="xs">
        <form onSubmit={handleCreateEmployee}>
          <DialogTitle sx={{ fontWeight: 800 }}>Yangi Xodim Qo'shish</DialogTitle>
          <DialogContent dividers className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Xodim F.I.O</label>
              <TextField
                fullWidth
                size="small"
                placeholder="Ahmad Karimov"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Login *</label>
              <TextField
                required
                fullWidth
                size="small"
                placeholder="ahmad_collector"
                value={newLogin}
                onChange={(e) => setNewLogin(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Boshlang'ich PIN kod *
              </label>
              <TextField
                required
                fullWidth
                size="small"
                placeholder="Kamida 4 ta belgi (masalan: 1234)"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Roli</label>
              <TextField
                select
                fullWidth
                size="small"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                <MenuItem value="COLLECTOR">Undiruvchi xodim</MenuItem>
                <MenuItem value="SUPER_ADMIN">Super Administrator</MenuItem>
              </TextField>
            </div>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setAddModalOpen(false)} color="inherit">
              Bekor qilish
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={adding}
              sx={{ bgcolor: '#4f46e5', fontWeight: 700 }}
            >
              {adding ? 'Qo\'shilmoqda...' : 'Qo\'shish'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Reset PIN Dialog */}
      <Dialog open={pinModalOpen} onClose={() => setPinModalOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>PIN Kodni Almashtirish</DialogTitle>
        <DialogContent dividers className="space-y-3">
          <p className="text-xs text-slate-600">
            Xodim: <strong className="text-slate-900">{selectedUser?.fullName || selectedUser?.login}</strong>
          </p>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Yangi PIN kod</label>
            <TextField
              required
              fullWidth
              size="small"
              placeholder="Yangi PIN kodni kiriting"
              value={updatedPin}
              onChange={(e) => setUpdatedPin(e.target.value)}
            />
          </div>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPinModalOpen(false)} color="inherit">
            Bekor qilish
          </Button>
          <Button
            onClick={handleSaveNewPin}
            variant="contained"
            disabled={updatingPin}
            sx={{ bgcolor: '#4f46e5', fontWeight: 700 }}
          >
            {updatingPin ? 'Saqlanmoqda...' : 'PIN Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

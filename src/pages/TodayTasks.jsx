import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { showToast } from '../components/GlobalToast';
import StatusBadge from '../components/StatusBadge';
import PhoneIcon from '@mui/icons-material/Phone';
import NavigationIcon from '@mui/icons-material/Navigation';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Button } from '@mui/material';

const STATUS_OPTIONS = [
  { value: 'PROMISED', label: 'Va\'da bergan' },
  { value: 'NOT_HOME', label: 'Uyda yo\'q' },
  { value: 'NO_MONEY', label: 'Puli yo\'q' },
  { value: 'PHONE_OFF', label: 'Telefon o\'chiq' },
  { value: 'MOVED', label: 'Ko\'chib ketgan' },
  { value: 'PAID', label: 'To\'landi' },
];

export default function TodayTasks() {
  const [debtors, setDebtors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDebtor, setSelectedDebtor] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modal form fields
  const [newStatus, setNewStatus] = useState('');
  const [promiseDate, setPromiseDate] = useState('');
  const [noteText, setNoteText] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    loadTodayDebtors();
  }, []);

  const loadTodayDebtors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/debtors/today');
      setDebtors(res.data);
    } catch (err) {
      showToast(err.userMessage || 'Bugungi ro\'yxatni yuklashda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenActionModal = (debtor, e) => {
    e.stopPropagation();
    setSelectedDebtor(debtor);
    setNewStatus(debtor.status || 'PROMISED');
    setPromiseDate(debtor.promiseDate ? debtor.promiseDate.split('T')[0] : '');
    setNoteText('');
    setModalOpen(true);
  };

  const handleSaveAction = async () => {
    if (!selectedDebtor) return;
    setSubmitting(true);
    try {
      // 1. Status va promiseDate ni yangilash
      await api.patch(`/debtors/${selectedDebtor.id}`, {
        status: newStatus,
        promiseDate: promiseDate ? new Date(promiseDate).toISOString() : null,
      });

      // 2. Agar qayd matni yozilgan bo'lsa qayd qo'shish
      if (noteText.trim()) {
        const clientId = 'note-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        await api.post(`/debtors/${selectedDebtor.id}/notes`, {
          clientId,
          status: newStatus,
          text: noteText.trim(),
        });
      }

      showToast('Qarzdor ma\'lumotlari muvaffaqiyatli saqlandi', 'success');
      setModalOpen(false);
      loadTodayDebtors(); // Ro'yxatni yangilash
    } catch (err) {
      showToast(err.userMessage || 'Saqlashda xatolik yuz berdi', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatMoney = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('uz-UZ').format(num) + ' so\'m';
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Bugungi Reja</h2>
          <p className="text-xs text-slate-500">
            To'lov va'dasi bugun yoki o'tib ketgan faol qarzdorlar ({debtors.length} ta)
          </p>
        </div>
        <button
          onClick={loadTodayDebtors}
          className="self-start sm:self-auto text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl transition"
        >
          🔄 Yangilash
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <CircularProgress size={32} />
          <p className="text-xs mt-2">Bugungi reja yuklanmoqda...</p>
        </div>
      ) : debtors.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200/80 shadow-sm">
          <CheckCircleOutlineIcon sx={{ fontSize: 48 }} className="text-emerald-500 mb-2" />
          <h3 className="text-base font-bold text-slate-800">Bugungi vazifalar bajarildi!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Bugun to'lov qilishga va'da bergan yoki muddati o'tgan barcha qarzdorlar ko'rib chiqilgan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {debtors.map((debtor) => (
            <div
              key={debtor.id}
              onClick={() => navigate(`/debtors/${debtor.id}`)}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden"
            >
              {/* Top Row: Name, Status, Money */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
                      ID: {debtor.externalId}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base leading-tight truncate">
                      {debtor.fullName}
                    </h3>
                  </div>
                  <StatusBadge status={debtor.status} />
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                  📍 {debtor.mfy ? <strong className="text-slate-800">{debtor.mfy}: </strong> : ''}
                  {debtor.address || 'Manzil kiritilmagan'}
                </p>

                <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
                  <span className="bg-slate-100 text-slate-800 font-extrabold px-2.5 py-1 rounded-lg">
                    Qarz: {formatMoney(debtor.minDebt)}
                  </span>
                  {debtor.promiseDate && (
                    <span className="bg-amber-50 text-amber-800 font-bold px-2 py-1 rounded-lg border border-amber-200/60">
                      ⏰ Va'da: {new Date(debtor.promiseDate).toLocaleDateString('uz-UZ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {debtor.phones && debtor.phones[0] && (
                    <a
                      href={`tel:${debtor.phones[0]}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1.5 border border-emerald-200 transition"
                      title={debtor.phones[0]}
                    >
                      <PhoneIcon fontSize="small" />
                      <span className="hidden xs:inline">Qo'ng'iroq</span>
                    </a>
                  )}

                  {debtor.address && (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(
                        (debtor.mfy ? debtor.mfy + ', ' : '') + debtor.address,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs flex items-center justify-center transition"
                      title="Xaritada ochish"
                    >
                      <NavigationIcon fontSize="small" />
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => handleOpenActionModal(debtor, e)}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                >
                  <EditNoteIcon fontSize="small" />
                  <span>Qayd / Holat</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Action & Note Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
          Qarzdor Holatini Yangilash
        </DialogTitle>
        <DialogContent dividers className="space-y-4">
          <p className="text-xs text-slate-600 font-medium">
            Mijoz: <strong className="text-slate-900">{selectedDebtor?.fullName}</strong>
          </p>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Yangi holat</label>
            <TextField
              select
              fullWidth
              size="small"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              To'lov va'dasi sanasi
            </label>
            <TextField
              type="date"
              fullWidth
              size="small"
              value={promiseDate}
              onChange={(e) => setPromiseDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Qayd (Izoh)
            </label>
            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              placeholder="Qarzdor bilan nima haqida gaplashildi?"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
          </div>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalOpen(false)} color="inherit">
            Bekor qilish
          </Button>
          <Button
            onClick={handleSaveAction}
            variant="contained"
            disabled={submitting}
            sx={{ bgcolor: '#4f46e5', fontWeight: 700 }}
          >
            {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

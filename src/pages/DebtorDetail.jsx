import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { showToast } from '../components/GlobalToast';
import { savePendingAction } from '../utils/offlineSync';
import MapChooserModal from '../components/MapChooserModal';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import { CircularProgress } from '@mui/material';

const STATUS_BUTTONS = [
  { value: 'NOT_HOME', label: "Uyda yo'q" },
  { value: 'PROMISED', label: "Va'da berdi", isHighlight: true },
  { value: 'NO_MONEY', label: "Pul yo'q" },
  { value: 'PHONE_OFF', label: "Telefon o'chiq" },
  { value: 'MOVED', label: "Ko'chib ketgan" },
  { value: 'PAID', label: "To'ladi", isPaid: true },
];

export default function DebtorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Keshdan yoki navigatsiya holatidan darhol o'qish (0 ms kechikish)
  const getInitialDebtor = () => {
    if (location.state?.debtor) return location.state.debtor;
    try {
      const cached = localStorage.getItem('cached_debtors_list');
      if (cached) {
        const parsed = JSON.parse(cached);
        return (parsed.items || []).find((d) => String(d.id) === String(id)) || null;
      }
    } catch (e) {}
    return null;
  };

  const initialDebtor = getInitialDebtor();
  const [debtor, setDebtor] = useState(initialDebtor);
  const [loading, setLoading] = useState(!initialDebtor);

  // Form states matching Screenshot 2
  const [selectedStatus, setSelectedStatus] = useState(initialDebtor?.status || 'PROMISED');
  const [promiseDateType, setPromiseDateType] = useState('ertaga'); // 'ertaga' | '3kundan' | 'custom'
  const [customDate, setCustomDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [paidAmount, setPaidAmount] = useState(''); // To'ladi uchun summa
  const [submitting, setSubmitting] = useState(false);

  // 📸 Kamera uchun
  const [photoBase64, setPhotoBase64] = useState(null);
  const [photoTakenAt, setPhotoTakenAt] = useState(null);
  const [sendingPhoto, setSendingPhoto] = useState(false);
  const [savedSummary, setSavedSummary] = useState(null); // Saqlangandan keyingi xulosa oynasi
  const [showMapModal, setShowMapModal] = useState(false); // Xarita tanlash oynasi

  useEffect(() => {
    loadDebtor();
  }, [id]);

  const loadDebtor = async () => {
    // Agar keshda ma'lumot bo'lsa, foydalanuvchiga spinner ko'rsatmasdan orqa fonda yangilaymiz
    if (!debtor) setLoading(true);
    try {
      const res = await api.get(`/debtors/${id}`);
      setDebtor(res.data);
      if (res.data.status) {
        setSelectedStatus(res.data.status);
      }
    } catch (err) {
      if (!debtor) {
        showToast(err.userMessage || 'Qarzdorni yuklashda xatolik', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('uz-UZ').format(Math.round(num));
  };

  const formatDate = (val) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      let calculatedDate = null;
      const now = new Date();

      if (selectedStatus === 'PROMISED') {
        if (promiseDateType === 'ertaga') {
          const tomorrow = new Date(now);
          tomorrow.setDate(now.getDate() + 1);
          calculatedDate = tomorrow.toISOString();
        } else if (promiseDateType === '3kundan') {
          const threeDays = new Date(now);
          threeDays.setDate(now.getDate() + 3);
          calculatedDate = threeDays.toISOString();
        } else if (promiseDateType === 'custom' && customDate) {
          calculatedDate = new Date(customDate).toISOString();
        }
      }

      // To'ladi bo'lsa — summani note ichiga qo'shamiz
      let finalNoteText = noteText.trim();
      if (selectedStatus === 'PAID' && paidAmount) {
        const formatted = Number(paidAmount.replace(/\s/g, '')).toLocaleString('uz-UZ');
        finalNoteText = `To'ladi: ${formatted} so'm` + (finalNoteText ? `. ${finalNoteText}` : '');
      }

      // ── Agar internet yo'q bo'lsa — telefon xotirasiga oflayn saqlaymiz ──
      if (!navigator.onLine) {
        savePendingAction({
          debtorId: id,
          status: selectedStatus,
          promiseDate: calculatedDate,
          note: finalNoteText,
        });
        showToast('💾 Oflayn saqlandi! Internet yonganda avtomatik serverga yuboriladi.', 'info');
      } else {
        // Backendga parallel saqlaymiz (tezkor, orqa fonda)
        const clientId = 'note-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        Promise.all([
          api.patch(`/debtors/${id}`, {
            status: selectedStatus,
            promiseDate: calculatedDate,
          }),
          api.post(`/debtors/${id}/notes`, {
            clientId,
            status: selectedStatus,
            text: finalNoteText || undefined,
          }),
        ]).catch((err) => {
          console.error('Saqlash xatosi:', err);
          showToast(err.userMessage || 'Serverga saqlashda xatolik', 'error');
        });

        // Agar rasm bo'lsa — orqa fonda Telegramga yuboramiz
        if (photoBase64) {
          api.post(`/debtors/${id}/send-photo`, {
            imageBase64: photoBase64,
            status: selectedStatus,
            promiseDate: calculatedDate || undefined,
            paidAmount: selectedStatus === 'PAID' && paidAmount ? Number(paidAmount.replace(/\s+/g, '')) : undefined,
            note: noteText.trim() || undefined,
            takenAt: photoTakenAt || Date.now(),
          }).catch((photoErr) => {
            console.error('Telegram fonda yuborish xatosi:', photoErr);
          });
        }
      }

      const statusLabelsMap = {
        PROMISED: "Va'da berdi",
        NOT_HOME: "Uyda yo'q",
        NO_MONEY: "Pul yo'q",
        PHONE_OFF: "Telefon o'chiq",
        MOVED: "Ko'chib ketgan",
        PAID: "To'ladi",
      };

      // Lokal ma'lumotni darhol yangilaymiz (foydalanuvchi kutib qolmaydi)
      setDebtor((prev) => ({
        ...prev,
        status: selectedStatus,
        promiseDate: calculatedDate,
        lastNote: finalNoteText ? { text: finalNoteText, createdAt: new Date().toISOString() } : prev?.lastNote,
        notes: finalNoteText
          ? [{ id: Date.now(), text: finalNoteText, status: selectedStatus, createdAt: new Date().toISOString() }, ...(prev?.notes || [])]
          : prev?.notes,
      }));

      // Saqlangan ma'lumotlar xulosasini ko'rsatamiz
      setSavedSummary({
        fullName: debtor.fullName,
        status: statusLabelsMap[selectedStatus] || selectedStatus,
        promiseDate: calculatedDate ? new Date(calculatedDate).toLocaleDateString('uz-UZ') : null,
        note: finalNoteText || "Izoh kiritilmadi",
        hasPhoto: !!photoBase64,
      });

      setPhotoBase64(null);
      setPhotoTakenAt(null);
      setNoteText('');
      setPaidAmount('');
      showToast("Muvaffaqiyatli saqlandi!", "success");
    } catch (err) {
      showToast(err.userMessage || 'Saqlashda xatolik yuz berdi', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 📸 Rasm olish (kameradan yoki galereyadan)
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoTakenAt(file.lastModified || Date.now());
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoBase64(ev.target.result);
    reader.readAsDataURL(file);
  };

  // 📤 Rasmni Telegram guruhga yuborish
  const handleSendPhoto = async () => {
    if (!photoBase64) return;
    setSendingPhoto(true);
    try {
      let calculatedPromiseDate;
      if (selectedStatus === 'PROMISED') {
        const now = new Date();
        if (promiseDateType === 'ertaga') {
          const t = new Date(now);
          t.setDate(now.getDate() + 1);
          calculatedPromiseDate = t.toISOString();
        } else if (promiseDateType === '3kundan') {
          const t = new Date(now);
          t.setDate(now.getDate() + 3);
          calculatedPromiseDate = t.toISOString();
        } else if (promiseDateType === 'custom' && customDate) {
          calculatedPromiseDate = new Date(customDate).toISOString();
        } else if (debtor?.promiseDate) {
          calculatedPromiseDate = debtor.promiseDate;
        }
      }

      const res = await api.post(`/debtors/${id}/send-photo`, {
        imageBase64: photoBase64,
        status: selectedStatus,
        promiseDate: calculatedPromiseDate,
        paidAmount: selectedStatus === 'PAID' && paidAmount ? Number(paidAmount.replace(/\s+/g, '')) : undefined,
        note: noteText.trim() || undefined,
        takenAt: photoTakenAt || Date.now(),
      });
      if (res.data.success) {
        showToast('📸 Rasm Telegram guruhga yuborildi!', 'success');
        setPhotoBase64(null);
        setPhotoTakenAt(null);
      } else {
        showToast('Rasm yuborishda xatolik', 'error');
      }
    } catch (err) {
      showToast(err.userMessage || 'Telegram xatolik', 'error');
    } finally {
      setSendingPhoto(false);
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center text-slate-400">
        <CircularProgress size={32} />
        <p className="text-xs mt-3 font-semibold text-slate-600">Ma'lumotlar yuklanmoqda...</p>
      </div>
    );
  }

  if (!debtor) {
    return (
      <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
        <p className="text-sm font-bold text-slate-700">Qarzdor topilmadi</p>
        <button
          onClick={() => navigate('/debtors')}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          Ro'yxatga qaytish
        </button>
      </div>
    );
  }

  const lastNote = debtor.notes && debtor.notes.length > 0 ? debtor.notes[0] : null;
  const lastNoteText = lastNote
    ? `Oxirgi qayd: ${new Date(lastNote.createdAt).toLocaleDateString('uz-UZ', {
        day: 'numeric',
        month: 'long',
      })} — ${lastNote.text || 'Holat yangilandi'}`
    : 'Oxirgi qayd mavjud emas';

  const firstPhone = (debtor.phones && debtor.phones[0]) || '';
  const displayPhone = firstPhone ? firstPhone.replace('+998', '') : '90 123 45 67';

  return (
    <div className="space-y-4 pb-6 select-none max-w-5xl mx-auto w-full">
      {/* Top Back Navigation (Screenshot 2: < Ro'yxat) */}
      <button
        onClick={() => navigate('/debtors')}
        className="flex items-center gap-1 text-blue-600 font-bold text-sm hover:underline cursor-pointer -ml-1"
      >
        <ArrowBackIosNewIcon sx={{ fontSize: 13 }} />
        <span>Ro'yxat</span>
      </button>

      {/* Debtor Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-mono font-bold text-xs">
            ID: {debtor.externalId}
          </span>
          {debtor.treasuryId && (
            <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs font-semibold">
              Xazna ID: {debtor.treasuryId}
            </span>
          )}
          <span className="px-2.5 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-bold text-xs border border-rose-200">
            Макс кун: {debtor.overdueDays || 0} кун
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
          {debtor.fullName}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          {debtor.mfy ? `${debtor.mfy} · ` : ''}
          {debtor.address || 'Manzil kiritilmagan'}
        </p>
        <button
          type="button"
          onClick={() => setShowMapModal(true)}
          className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 mt-1 cursor-pointer"
        >
          <LocationOnIcon sx={{ fontSize: 16 }} className="text-rose-500" />
          <span>Xaritada ochish</span>
        </button>
      </div>

      {/* Responsive layout: 1 col on mobile, 2 cols on desktop/tablet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: Debt Info + Bank Sheet Details + Action Buttons */}
        <div className="space-y-4">
          {/* White Debt Card (Screenshot 2: Minimal va Foiz o'rni almashtirildi) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-2">
            <span className="text-xs font-semibold text-slate-600 block">Jami qarzdorlik</span>
            <div className="text-3xl sm:text-4xl font-black text-blue-700 tracking-tight">
              {formatMoney(debtor.totalDebt)}{' '}
              <span className="text-lg font-bold text-slate-700">so'm</span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Asosiy qarz: <strong>{formatMoney(debtor.principalDebt)}</strong> · Minimal: <strong>{formatMoney(debtor.minDebt)}</strong>
            </p>
          </div>

          {/* Bank NPL Attributes Card (Haqiqiy bank hujjati ma'lumotlari) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <AccountBalanceIcon sx={{ fontSize: 18, color: '#2563eb' }} />
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                Bank Shartnomasi va NPL Ko'rsatkichlari
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-500 block font-semibold">Kredit summasi</span>
                <span className="font-bold text-slate-900">{formatMoney(debtor.loanAmount)} so'm</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-500 block font-semibold">Jami qarzdorlik</span>
                <span className="font-bold text-slate-900">{formatMoney(debtor.totalDebt)} so'm</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-500 block font-semibold">Макс кун (Муддати ўтган)</span>
                <span className="font-bold text-rose-700">{debtor.overdueDays || 0} кун</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-500 block font-semibold">Berilgan sana</span>
                <span className="font-bold text-slate-900">{formatDate(debtor.issuedAt)}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-500 block font-semibold">Tugallanish sana</span>
                <span className="font-bold text-slate-900">{formatDate(debtor.closingAt)}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-500 block font-semibold">MFY</span>
                <span className="font-bold text-slate-900 truncate block">{debtor.mfy || '—'}</span>
              </div>
            </div>

            {debtor.phoneNote && (
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <span className="font-bold block text-[10px] uppercase text-amber-700">Qo'shimcha ma'lumot:</span>
                <span>{debtor.phoneNote}</span>
              </div>
            )}
          </div>

          {/* Quick Action Buttons (2 Columns: Qo'ng'iroq / Xaritada) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Call Button (Solid Blue) */}
            <a
              href={`tel:${firstPhone || '+998901234567'}`}
              className="bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white p-3.5 sm:p-4 rounded-2xl flex items-center gap-2.5 shadow-md shadow-blue-600/20 transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <PhoneIcon sx={{ fontSize: 18 }} />
              </div>
              <div className="min-w-0 text-left">
                <span className="block text-xs font-bold leading-tight">Qo'ng'iroq</span>
                <span className="block text-[11px] font-semibold opacity-90 truncate">{displayPhone}</span>
              </div>
            </a>

            {/* Maps Button (White with Blue Border) */}
            <button
              type="button"
              onClick={() => setShowMapModal(true)}
              className="bg-white hover:bg-slate-50 active:scale-[0.98] text-blue-700 border-2 border-blue-600 p-3 sm:p-4 rounded-2xl flex items-center gap-2.5 transition cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <LocationOnIcon sx={{ fontSize: 18 }} />
              </div>
              <div className="min-w-0 text-left">
                <span className="block text-xs font-bold leading-tight">Xaritada</span>
                <span className="block text-[11px] text-blue-600 font-semibold truncate">Yandex / Google / 2GIS</span>
              </div>
            </button>
          </div>

          {/* Past Notes history on desktop view */}
          {debtor.notes && debtor.notes.length > 0 && (
            <div className="hidden md:block bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-2.5">
              <h4 className="text-xs font-bold text-slate-500 uppercase">Qaydlar tarixi</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {debtor.notes.map((n) => (
                  <div key={n.id} className="p-2.5 bg-slate-50 rounded-xl text-xs">
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      {new Date(n.createdAt).toLocaleDateString('uz-UZ')}
                    </span>
                    <span className="text-slate-800 font-medium">{n.text || 'Holat o\'zgartirildi'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Bugungi natija + Form (Screenshot 2 Match) */}
        <div className="space-y-3.5 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm">
          {/* Bugungi Natija Section (6 Grid Buttons) */}
          <div>
            <h3 className="font-extrabold text-slate-900 text-base mb-2.5">Bugungi natija</h3>

            <div className="grid grid-cols-2 gap-2.5">
              {STATUS_BUTTONS.map((item) => {
                const isSelected = selectedStatus === item.value;
                const activeStyle =
                  item.value === 'PROMISED'
                    ? 'bg-[#b45309] text-white border-[#b45309] shadow-md shadow-amber-900/20'
                    : item.value === 'PAID'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                    : 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20';

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSelectedStatus(item.value)}
                    className={`py-3.5 px-3 rounded-2xl text-xs sm:text-sm font-extrabold border transition cursor-pointer ${
                      isSelected
                        ? activeStyle
                        : 'bg-white text-slate-800 border-slate-200/90 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── VA'DA BERDI: Qachon beradi? ── */}
          {selectedStatus === 'PROMISED' && (
            <div className="pt-1 space-y-2">
              <h4 className="text-xs font-bold text-slate-700">Qachon beradi? (shart emas)</h4>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => { setPromiseDateType('ertaga'); setShowDatePicker(false); }}
                  className={`py-2.5 px-2 rounded-2xl text-xs font-bold border transition cursor-pointer text-center ${
                    promiseDateType === 'ertaga' && !showDatePicker
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-800 border-slate-200/90 hover:bg-slate-50'
                  }`}
                >
                  Ertaga
                </button>
                <button
                  type="button"
                  onClick={() => { setPromiseDateType('3kundan'); setShowDatePicker(false); }}
                  className={`py-2.5 px-2 rounded-2xl text-xs font-bold border transition cursor-pointer text-center ${
                    promiseDateType === '3kundan' && !showDatePicker
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-800 border-slate-200/90 hover:bg-slate-50'
                  }`}
                >
                  3 kundan
                </button>
                <button
                  type="button"
                  onClick={() => { setPromiseDateType('custom'); setShowDatePicker(true); }}
                  className={`py-2.5 px-2 rounded-2xl text-xs font-bold border transition cursor-pointer text-center ${
                    showDatePicker
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-800 border-slate-200/90 hover:bg-slate-50'
                  }`}
                >
                  Boshqa sana
                </button>
              </div>
              {showDatePicker && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          )}

          {/* ── TO'LADI: Qancha to'ladi? (sonli input) ── */}
          {selectedStatus === 'PAID' && (
            <div className="pt-1 space-y-2">
              <h4 className="text-xs font-bold text-slate-700">Qancha to'ladi? (so'mda)</h4>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={paidAmount}
                onChange={(e) => {
                  // Faqat raqamlar va bo'sh joy
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setPaidAmount(val);
                }}
                placeholder="Masalan: 500000"
                className="w-full px-4 py-3.5 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-lg font-black text-emerald-900 placeholder:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 tracking-wider"
              />
              {paidAmount && (
                <p className="text-xs text-emerald-700 font-bold px-1">
                  ✓ {Number(paidAmount).toLocaleString('uz-UZ')} so'm
                </p>
              )}
            </div>
          )}

          {/* ── IZOH (barcha holatlarda ko'rinadi, majburiy emas) ── */}
          <div className="pt-1">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Izoh (shart emas)"
              className="w-full px-4 py-3 bg-white border border-slate-200/90 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Last Note text */}
          <div className="px-1 text-xs text-slate-500 font-medium">
            {lastNoteText}
          </div>

          {/* 📸 Kamera — Tashrif isboti */}
          <div className="pt-1 space-y-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 pt-1">📸 Tashrif isboti (Telegram)</h4>

            {/* Rasm olish tugmasi */}
            {!photoBase64 ? (
              <label className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 hover:bg-slate-200 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer transition">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs font-bold text-slate-600">Rasm olish yoki tanlash</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
            ) : (
              <div className="space-y-2">
                {/* Rasm preview */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-200">
                  <img src={photoBase64} alt="Tashrif isboti" className="w-full max-h-48 object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoBase64(null)}
                    className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black transition"
                    title="Rasmni o'chirish"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {/* Rasm biriktirildi xabari */}
                <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
                  <span>✓ Rasm biriktirildi ("Saqlash" bosilganda Telegramga avtomatik yuboriladi)</span>
                </div>
              </div>
            )}
          </div>

          {/* Saqlash tugmasi */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting}
              className="w-full py-4 bg-[#0f172a] hover:bg-black active:scale-[0.99] text-white rounded-2xl font-black text-base shadow-lg shadow-slate-900/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </div>
      </div>

      {/* 🎉 Muvaffaqiyatli saqlangan ma'lumotlar xulosasi va Asosiy ekranga qaytish oynasi */}
      {savedSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4 text-center">
            {/* Yashil belgi */}
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Muvaffaqiyatli saqlandi!</h3>
              <p className="text-xs text-slate-500 mt-0.5">Qarzdor ma'lumotlari yangilandi</p>
            </div>

            {/* Nimani saqlaganini ko'rsatuvchi xulosa bloki */}
            <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2.5 border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Qarzdor:</span>
                <span className="font-bold text-slate-800 text-sm leading-tight block">{savedSummary.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Yangi holat:</span>
                <span className="inline-block px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold mt-0.5">
                  {savedSummary.status} {savedSummary.promiseDate ? `• ${savedSummary.promiseDate}` : ''}
                </span>
              </div>
              {savedSummary.note && (
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Izoh:</span>
                  <span className="text-slate-700 font-medium">{savedSummary.note}</span>
                </div>
              )}
              {savedSummary.hasPhoto && (
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold pt-1 border-t border-slate-200/60">
                  <span>📸 Rasm Telegram guruhga fonda yuborilmoqda</span>
                </div>
              )}
            </div>

            {/* Asosiy ekranga o'tish tugmasi */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => navigate('/debtors')}
                className="w-full py-4 bg-[#0f172a] hover:bg-black active:scale-[0.99] text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/30 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🏠 Asosiy ekranga o'tish</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSavedSummary(null);
                  loadDebtor();
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Shu sahifada qolish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🗺 Xaritani tanlash oynasi (Yandex / Google / 2GIS) */}
      <MapChooserModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        address={debtor.address}
        mfy={debtor.mfy}
        lat={debtor.lat}
        lng={debtor.lng}
        fullName={debtor.fullName}
      />
    </div>
  );
}

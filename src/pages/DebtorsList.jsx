import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { showToast } from '../components/GlobalToast';
import MapChooserModal from '../components/MapChooserModal';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import TableChartIcon from '@mui/icons-material/TableChart';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { CircularProgress } from '@mui/material';

export default function DebtorsList() {
  const getInitialCache = () => {
    try {
      const cached = localStorage.getItem('cached_debtors_list');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return null;
  };

  const initialData = getInitialCache();
  const [debtors, setDebtors] = useState(initialData?.items || []);
  const [counts, setCounts] = useState(initialData?.counts || { yangi: 0, jarayonda: 0, tolagan: 0, barchasi: 0 });
  const [totals, setTotals] = useState(initialData?.totals || { principalDebt: 0, interestDebt: 0, totalDebt: 0, minDebt: 0, loanAmount: 0 });
  const [tab, setTab] = useState('barchasi'); // 'barchasi' | 'yangi' | 'jarayonda' | 'tolagan'
  const [statusFilter, setStatusFilter] = useState(''); // Qo'shimcha status: PROMISED, NOT_HOME, NO_MONEY, va h.k.
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(!initialData?.items?.length);
  const [viewMode, setViewMode] = useState('table'); // Faqat Excel jadval
  const [mapTarget, setMapTarget] = useState(null); // Xaritada ochilishi kerak bo'lgan qarzdor
  const [userCoords, setUserCoords] = useState(null); // Xodimning haqiqiy GPS koordinatasi

  // ---- YANGI: Checkbox va Delete holatlari ----
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  // ---- YANGI: Edit modal ----
  const [editTarget, setEditTarget] = useState(null); // { id, phones: [...], address: '' }
  const [editSaving, setEditSaving] = useState(false);

  const navigate = useNavigate();

  // Qidiruv klaviaturadan terilganda 300ms kutib, keyin backendga bitta toza so'rov yuboradi
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // 🛰 Ilova ochilganda telefon GPS lokatsiyasini so'raydi
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          loadDebtors(coords, debouncedSearch);
        },
        (err) => {
          console.warn('GPS ruxsat berilmadi yoki xato:', err);
          loadDebtors(undefined, debouncedSearch);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      loadDebtors(undefined, debouncedSearch);
    }
  }, []);

  useEffect(() => {
    loadDebtors(userCoords, debouncedSearch);
  }, [tab, statusFilter, debouncedSearch]);

  const loadDebtors = async (coords = userCoords, s = debouncedSearch) => {
    if (!debtors || debtors.length === 0) {
      setLoading(true);
    }
    try {
      const params = {
        limit: 100,
      };
      if (coords?.lat && coords?.lng) {
        params.userLat = coords.lat;
        params.userLng = coords.lng;
      }
      if (tab !== 'barchasi') {
        params.tab = tab;
      }
      if (statusFilter) {
        params.status = statusFilter;
      }
      if (s && s.trim()) {
        params.search = s.trim();
      }

      // Backend API ga so'rov yuborish (Frontendda emas, to'liq backendda hisoblanadi)
      const res = await api.get('/debtors', { params });
      const items = res.data.items || [];
      setDebtors(items);
      if (res.data.counts) {
        setCounts(res.data.counts);
      }
      if (res.data.totals) {
        setTotals(res.data.totals);
      }
      // Oflayn rejim uchun keshga saqlab qo'yamiz
      try {
        localStorage.setItem(
          'cached_debtors_list',
          JSON.stringify({
            items,
            counts: res.data.counts,
            totals: res.data.totals,
            savedAt: new Date().toISOString(),
          }),
        );
      } catch (e) {}
    } catch (err) {
      // Agar internet yo'q bo'lsa yoki server javob bermasa — keshdan o'qiymiz
      const cached = localStorage.getItem('cached_debtors_list');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setDebtors(parsed.items || []);
          if (parsed.counts) setCounts(parsed.counts);
          if (parsed.totals) setTotals(parsed.totals);
          showToast("📴 Internet yo'q: keshdagi ma'lumotlar ko'rsatilmoqda", 'info');
        } catch (e) {
          showToast(err.userMessage || 'Qarzdorlarni yuklashda xatolik', 'error');
        }
      } else {
        showToast(err.userMessage || 'Qarzdorlarni yuklashda xatolik', 'error');
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

  const getPaidAmountDisplay = (debtor) => {
    if (debtor.status !== 'PAID') return '—';
    const text = debtor.lastNote?.text || '';
    if (text) {
      // 1. "To'ladi: 500 000 so'm" formatini qidirish
      const match = text.match(/To['’`]?ladi:\s*([0-9\s.,]+(?:\s*so['’`]?m)?)/i);
      if (match) {
        let val = match[1].trim();
        if (!val.toLowerCase().includes("so'm") && !val.toLowerCase().includes("som")) {
          val += " so'm";
        }
        return val;
      }
      // 2. Qayd ichidagi ixtiyoriy summani qidirish
      const genericMatch = text.match(/([0-9][0-9\s.,]{2,})\s*(?:so['’`]?m|som|сум)/i);
      if (genericMatch) {
        return `${genericMatch[1].trim()} so'm`;
      }
    }
    // 3. Agar alohida summa yozilmagan bo'lsa, minDebt ni ko'rsatish
    if (debtor.minDebt && Number(debtor.minDebt) > 0) {
      return `${formatMoney(debtor.minDebt)} so'm`;
    }
    return "To'landi";
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'NEW':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Yangi</span>;
      case 'PROMISED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">Va'da berdi</span>;
      case 'PAID':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">To'ladi</span>;
      case 'NOT_HOME':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Uyda yo'q</span>;
      case 'NO_MONEY':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Pul yo'q</span>;
      case 'PHONE_OFF':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-800 border border-slate-300">Telefon o'chiq</span>;
      case 'MOVED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-900 border border-orange-200">Ko'chib ketgan</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  // Excelga eksport qilish (.csv UTF-8 BOM bilan - Excelda darhol to'g'ri ochiladi)
  // ---- YANGI: Checkbox yordamchilari ----
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === debtors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(debtors.map((d) => d.id)));
    }
  };

  // ---- YANGI: O'chirish ----
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`${selectedIds.size} ta qarzdorni o'chirishni tasdiqlaysizmi? Bu amal qaytarilmaydi!`)) return;
    setDeleting(true);
    try {
      await api.delete('/debtors/bulk', { data: { ids: Array.from(selectedIds) } });
      setDebtors((prev) => prev.filter((d) => !selectedIds.has(d.id)));
      setSelectedIds(new Set());
      showToast(`${selectedIds.size} ta qarzdor o'chirildi`, 'success');
    } catch (err) {
      showToast(err.userMessage || "O'chirishda xatolik", 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteOne = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Bu qarzdorni o'chirishni tasdiqlaysizmi?")) return;
    try {
      await api.delete(`/debtors/${id}`);
      setDebtors((prev) => prev.filter((d) => d.id !== id));
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      showToast("Qarzdor o'chirildi", 'success');
    } catch (err) {
      showToast(err.userMessage || "O'chirishda xatolik", 'error');
    }
  };

  // ---- YANGI: Edit modal ----
  const openEditModal = (debtor, e) => {
    e.stopPropagation();
    setEditTarget({
      id: debtor.id,
      phones: debtor.phones && debtor.phones.length > 0 ? [...debtor.phones] : [''],
      address: debtor.address || '',
    });
  };

  const closeEditModal = () => setEditTarget(null);

  const handleEditPhoneChange = (idx, val) => {
    setEditTarget((prev) => {
      const phones = [...prev.phones];
      phones[idx] = val;
      return { ...prev, phones };
    });
  };

  const handleAddPhone = () => {
    setEditTarget((prev) => ({ ...prev, phones: [...prev.phones, ''] }));
  };

  const handleRemovePhone = (idx) => {
    setEditTarget((prev) => {
      const phones = prev.phones.filter((_, i) => i !== idx);
      return { ...prev, phones: phones.length === 0 ? [''] : phones };
    });
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    setEditSaving(true);
    try {
      const cleanPhones = editTarget.phones.map((p) => p.trim()).filter((p) => p.length > 0);
      const res = await api.patch(`/debtors/${editTarget.id}`, {
        phones: cleanPhones,
        address: editTarget.address.trim(),
      });
      setDebtors((prev) =>
        prev.map((d) =>
          d.id === editTarget.id
            ? { ...d, phones: cleanPhones, address: editTarget.address.trim() }
            : d,
        ),
      );
      showToast("Ma'lumotlar saqlandi", 'success');
      closeEditModal();
    } catch (err) {
      showToast(err.userMessage || "Saqlashda xatolik", 'error');
    } finally {
      setEditSaving(false);
    }
  };

  // Excelga eksport qilish (.csv UTF-8 BOM bilan - Excelda darhol to'g'ri ochiladi)
  const exportToExcel = async () => {
    try {
      showToast("Excel fayli tayyorlanmoqda...", "info");
      const params = {};
      if (tab !== 'barchasi') params.tab = tab;
      if (statusFilter) params.status = statusFilter;
      if (debouncedSearch && debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const res = await api.get('/debtors/export', {
        params,
        responseType: 'blob',
        timeout: 60000,
      });

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NPL_Kreditlar_Portfeli_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Excel (.xlsx) fayli yuklab olindi", "success");
    } catch (err) {
      // Oflayn bo'lsa keshdagi ro'yxatdan CSV qilib berish
      if (debtors.length === 0) {
        showToast(err.userMessage || "Eksport qilishda xatolik", 'error');
        return;
      }
      const headers = [
        '№', 'ID', 'Xazna ID', 'Maks kun', '22-band', 'Mijoz nomi',
        'Telefon', 'MFY', 'Manzil', 'Kredit summasi', 'Berilgan sana',
        'Tugallanish sana', 'Asosiy qarz', 'Jami qarzdorlik', 'JAMI minimal',
        'Holati', "Va'da / To'lov", 'Izoh',
      ];
      const rows = debtors.map((d, i) => [
        i + 1, d.externalId || '', d.treasuryId || '', d.overdueDays || 0, d.code || '0',
        `"${(d.fullName || '').replace(/"/g, '""')}"`,
        `"${(d.phones || []).join(', ')}"`,
        `"${(d.mfy || '').replace(/"/g, '""')}"`,
        `"${(d.address || '').replace(/"/g, '""')}"`,
        d.loanAmount || 0, formatDate(d.issuedAt), formatDate(d.closingAt),
        d.principalDebt || 0, d.totalDebt || 0, d.minDebt || 0, d.status || '',
        `"${d.status === 'PAID' ? getPaidAmountDisplay(d) : (d.status === 'PROMISED' ? formatDate(d.promiseDate) : '—')}"`,
        `"${(d.lastNote?.text || d.phoneNote || '').replace(/"/g, '""')}"`,
      ]);
      const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NPL_Kreditlar_Portfeli_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Oflayn Excel (.csv) yuklab olindi", "info");
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 select-none w-full">
      {/* ─── 1. Header Toolbar (Mobil moslashtirilgan ixcham panel) ─── */}
      <div className="flex items-center justify-between gap-2 bg-white p-2 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        {/* Desktopda to'liq sarlavha (Mobilda ixcham) */}
        <div className="hidden sm:block">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Kredit portfeli va harakatsiz (NPL) kreditlar
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Bank filiali bo'yicha qarzdorlar ro'yxati va amallar jadvali
          </p>
        </div>

        {/* Action Buttons (Yangilash, Excel yuklash va Excel olish) */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            {/* Refresh */}
            <button
              onClick={() => {
                try {
                  localStorage.removeItem('cached_debtors_list');
                } catch (e) {}
                showToast("Eski kesh tozalandi, yangilanmoqda...", 'info');
                loadDebtors(userCoords);
              }}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
              title="Yangilash va eski keshni tozalash"
            >
              <RefreshIcon sx={{ fontSize: 18 }} />
            </button>

            {/* Excel yuklash (Import) */}
            <button
              type="button"
              onClick={() => navigate('/import')}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              title="Yangi Excel faylini yuklash (Import)"
            >
              <FileUploadIcon sx={{ fontSize: 16 }} />
              <span>Yuklash</span>
            </button>

            {/* Export to Excel (Yuklab olish) */}
            <button
              type="button"
              onClick={exportToExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              title="Excel formatida (.xlsx) yuklab olish"
            >
              <FileDownloadIcon sx={{ fontSize: 16 }} />
              <span>Excel</span>
            </button>

            {/* Tanlanganlarni o'chirish tugmasi */}
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                title="Tanlangan qarzdorlarni o'chirish"
              >
                <DeleteIcon sx={{ fontSize: 16 }} />
                <span>{deleting ? "O'chirilmoqda..." : `O'chirish (${selectedIds.size})`}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── 2. Top Statistic Cards (Backenddan kelgan sonlar, bosilmaydi va ko'k bo'lmaydi) ─── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Barchasi */}
        <div className="bg-white rounded-2xl py-2.5 px-3 border border-slate-200/90 shadow-xs flex flex-col items-center justify-center">
          <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
            {counts.barchasi || debtors.length}
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-1">Barchasi</span>
        </div>

        {/* Jarayonda */}
        <div className="bg-white rounded-2xl py-2.5 px-3 border border-slate-200/90 shadow-xs flex flex-col items-center justify-center">
          <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
            {counts.jarayonda || 0}
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-1">Jarayonda</span>
        </div>

        {/* To'lagan */}
        <div className="bg-white rounded-2xl py-2.5 px-3 border border-slate-200/90 shadow-xs flex flex-col items-center justify-center">
          <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
            {counts.tolagan || 0}
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-1">To'lagan</span>
        </div>
      </div>

      {/* ─── 3. Search Bar & Status Sub-filters ─── */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <SearchIcon sx={{ fontSize: 20 }} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism, telefon, ID (5715018), Xazna ID yoki manzil bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        {/* Quick status sub-filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 cursor-pointer transition ${
              !statusFilter ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Hammasi
          </button>
          <button
            onClick={() => setStatusFilter('PROMISED')}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 cursor-pointer transition ${
              statusFilter === 'PROMISED' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
            }`}
          >
            Va'da berganlar
          </button>
          <button
            onClick={() => setStatusFilter('NOT_HOME')}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 cursor-pointer transition ${
              statusFilter === 'NOT_HOME' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
            }`}
          >
            Uyda yo'q
          </button>
          <button
            onClick={() => setStatusFilter('NO_MONEY')}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 cursor-pointer transition ${
              statusFilter === 'NO_MONEY' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-900 hover:bg-rose-100'
            }`}
          >
            Pul yo'q
          </button>
          <button
            onClick={() => setStatusFilter('PAID')}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 cursor-pointer transition ${
              statusFilter === 'PAID' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
            }`}
          >
            To'laganlar
          </button>
        </div>
      </div>

      {/* ─── 4. Main Content: Excel Table or Cards ─── */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 text-center text-slate-400 border border-slate-200">
          <CircularProgress size={32} />
          <p className="text-xs mt-3 font-semibold text-slate-600">Qarzdorlar jadvali yuklanmoqda...</p>
        </div>
      ) : debtors.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">
          <p className="font-bold text-base text-slate-700">Hech qanday qarzdor topilmadi</p>
          <p className="text-xs text-slate-400 mt-1">Qidiruv yoki filtrlarni o'zgartirib ko'ring</p>
        </div>
      ) : viewMode === 'table' ? (
        /* ─── EXCEL JADVAL KO'RINISHI (Full Bank Spreadsheet) ─── */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Scroll hint for smaller screens */}
          <div className="block lg:hidden px-4 py-1.5 bg-blue-50 text-blue-700 text-[11px] font-semibold border-b border-blue-100">
            👉 Jadvalni to'liq ko'rish uchun chapga/o'ngga suring
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[1600px]">
              {/* Excel Table Head */}
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 text-[11px] font-extrabold uppercase tracking-wider">
                  {/* Checkbox (hammasi) */}
                  <th className="py-3 px-2 w-10 text-center border-r border-slate-200" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={debtors.length > 0 && selectedIds.size === debtors.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 cursor-pointer accent-rose-600"
                      title="Hammasini tanlash"
                    />
                  </th>
                  <th className="py-3 px-3 w-12 text-center border-r border-slate-200">№</th>
                  <th className="py-3 px-3 w-24 border-r border-slate-200">ID</th>
                  <th className="py-3 px-3 w-28 border-r border-slate-200">Xazna ID</th>
                  <th className="py-3 px-3 text-center border-r border-slate-200 bg-rose-50/80 text-rose-900 font-black min-w-[90px]">Макс кун</th>
                  <th className="py-3 px-2 w-16 text-center border-r border-slate-200">22-банд</th>
                  <th className="py-3 px-4 min-w-[220px] border-r border-slate-200">Mijoz nomi (F.I.SH)</th>
                  <th className="py-3 px-3 min-w-[160px] border-r border-slate-200">Telefon</th>
                  <th className="py-3 px-3 min-w-[140px] border-r border-slate-200">MFY</th>
                  <th className="py-3 px-4 min-w-[200px] border-r border-slate-200">Manzil</th>
                  <th className="py-3 px-3 text-right min-w-[130px] border-r border-slate-200">Kredit summasi</th>
                  <th className="py-3 px-2.5 text-center w-24 border-r border-slate-200">Berilgan</th>
                  <th className="py-3 px-2.5 text-center w-24 border-r border-slate-200">Tugallanish</th>
                  <th className="py-3 px-3 text-right min-w-[130px] border-r border-slate-200 bg-slate-100/90">Asosiy qarz</th>
                  <th className="py-3 px-3 text-right min-w-[140px] border-r border-slate-200 bg-blue-50 text-blue-900">JAMI minimal</th>
                  <th className="py-3 px-3 text-right min-w-[130px] border-r border-slate-200">Jami qarz</th>
                  <th className="py-3 px-3 text-center min-w-[110px] border-r border-slate-200">Holati</th>
                  <th className="py-3 px-2.5 text-center min-w-[120px] border-r border-slate-200">Va'da / To'lov</th>
                  {/* Amallar ustuni */}
                  <th className="py-3 px-2 text-center min-w-[90px] border-r border-slate-200">Amallar</th>
                </tr>
              </thead>

              {/* Excel Table Body */}
              <tbody className="divide-y divide-slate-200 text-xs">
                {debtors.map((debtor, idx) => (
                  <tr
                    key={debtor.id}
                    onClick={() => navigate(`/debtor/${debtor.id}`, { state: { debtor } })}
                    className={`hover:bg-blue-50/70 transition cursor-pointer odd:bg-white even:bg-slate-50/50 ${selectedIds.has(debtor.id) ? 'bg-rose-50/60 border-l-2 border-l-rose-400' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="py-2.5 px-2 text-center border-r border-slate-200" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(debtor.id)}
                        onChange={() => toggleSelect(debtor.id)}
                        className="w-4 h-4 cursor-pointer accent-rose-600"
                      />
                    </td>

                    {/* 1. № */}
                    <td className="py-2.5 px-3 text-center font-bold text-slate-500 border-r border-slate-200">
                      {idx + 1}
                    </td>

                    {/* 2. ID */}
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700 border-r border-slate-200">
                      {debtor.externalId || '—'}
                    </td>

                    {/* 3. Xazna ID */}
                    <td className="py-2.5 px-3 font-mono text-slate-700 border-r border-slate-200">
                      {debtor.treasuryId || '—'}
                    </td>

                    {/* 4. Макс кун (Муддати ўтган кун) */}
                    <td className="py-2.5 px-3 text-center border-r border-slate-200 bg-rose-50/20 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black ${
                        debtor.overdueDays > 0
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {debtor.overdueDays || 0} кун
                      </span>
                    </td>

                    {/* 5. 22-банд */}
                    <td className="py-2.5 px-2 text-center font-mono text-slate-600 border-r border-slate-200">
                      {debtor.code || '0'}
                    </td>

                    {/* 6. Mijoz nomi (F.I.SH) */}
                    <td className="py-2.5 px-4 font-extrabold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                          {debtor.fullName ? debtor.fullName[0] : 'M'}
                        </span>
                        <span>{debtor.fullName}</span>
                      </div>
                    </td>

                    {/* 7. Telefon */}
                    <td
                      className="py-2 px-3 font-medium text-slate-800 border-r border-slate-200 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {debtor.phones && debtor.phones.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {debtor.phones.map((phone, pIdx) => (
                            <a
                              key={pIdx}
                              href={`tel:${phone}`}
                              className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1.5 hover:underline text-xs tracking-tight"
                              title={`${phone} raqamiga qo'ng'iroq qilish`}
                            >
                              <PhoneIcon sx={{ fontSize: 13 }} className="text-blue-500 shrink-0" />
                              <span>{phone}</span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                      {debtor.phoneNote && (
                        <p
                          className="text-[10px] text-amber-900 font-semibold whitespace-normal max-w-[200px] mt-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 leading-tight"
                          title={debtor.phoneNote}
                        >
                          {debtor.phoneNote}
                        </p>
                      )}
                    </td>

                    {/* 8. MFY */}
                    <td className="py-2.5 px-3 font-semibold text-slate-700 border-r border-slate-200 whitespace-nowrap">
                      {debtor.mfy ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-bold">
                          {debtor.mfy}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* 9. Manzil */}
                    <td
                      className="py-2.5 px-4 text-slate-600 border-r border-slate-200 max-w-[220px] truncate hover:text-blue-600 cursor-pointer"
                      title={`${debtor.address || ''} (Xaritada ochish)`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMapTarget(debtor);
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <LocationOnIcon sx={{ fontSize: 13 }} className="text-rose-500 shrink-0" />
                        <span className="truncate">{debtor.address || '—'}</span>
                      </div>
                    </td>

                    {/* 10. Kredit summasi */}
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-800 border-r border-slate-200 whitespace-nowrap">
                      {formatMoney(debtor.loanAmount)}
                    </td>

                    {/* 11. Berilgan sana */}
                    <td className="py-2.5 px-2.5 text-center font-mono text-slate-600 border-r border-slate-200 whitespace-nowrap">
                      {formatDate(debtor.issuedAt)}
                    </td>

                    {/* 12. Tugallanish sana */}
                    <td className="py-2.5 px-2.5 text-center font-mono text-slate-600 border-r border-slate-200 whitespace-nowrap">
                      {formatDate(debtor.closingAt)}
                    </td>

                    {/* 13. Asosiy qarz */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                      {formatMoney(debtor.principalDebt)}
                    </td>

                    {/* 14. JAMI minimal */}
                    <td className="py-2.5 px-3 text-right font-mono font-black text-blue-700 bg-blue-50/50 border-r border-slate-200 whitespace-nowrap text-sm">
                      {formatMoney(debtor.minDebt)}
                    </td>

                    {/* 15. Jami qarz */}
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                      {formatMoney(debtor.totalDebt || (Number(debtor.principalDebt) + Number(debtor.interestDebt)))}
                    </td>


                    {/* 17. Holati */}
                    <td className="py-2.5 px-3 text-center border-r border-slate-200 whitespace-nowrap">
                      {getStatusBadge(debtor.status)}
                    </td>

                    {/* 18. Va'da sanasi / To'lov summasi */}
                    <td className="py-2.5 px-2.5 text-center font-mono text-slate-700 border-r border-slate-200 whitespace-nowrap">
                      {debtor.status === 'PAID' ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-black text-[11px] border border-emerald-200">
                          {getPaidAmountDisplay(debtor)}
                        </span>
                      ) : debtor.status === 'PROMISED' && debtor.promiseDate ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 font-bold text-[11px] border border-amber-200">
                          {formatDate(debtor.promiseDate)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">—</span>
                      )}
                    </td>

                    {/* 19. Amallar (Tahrirlash / O'chirish) */}
                    <td
                      className="py-2 px-2 text-center border-r border-slate-200 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => openEditModal(debtor, e)}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition cursor-pointer"
                          title="Telefon va manzilni tahrirlash"
                        >
                          <EditIcon sx={{ fontSize: 16 }} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteOne(debtor.id, e)}
                          className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                          title="Qarzdorni o'chirish"
                        >
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Excel Summary Footer */}
              <tfoot>
                <tr className="bg-slate-200/90 font-black text-slate-900 border-t-2 border-slate-400 text-xs">
                  <td colSpan={10} className="py-3 px-4 text-left border-r border-slate-300">
                    JAMI: {debtors.length} ta qarzdor (so'mda)
                  </td>
                  <td className="py-3 px-3 text-right font-mono border-r border-slate-300">
                    {formatMoney(totals.loanAmount)}
                  </td>
                  <td colSpan={2} className="py-3 px-2 text-center border-r border-slate-300">—</td>
                  <td className="py-3 px-3 text-right font-mono border-r border-slate-300">
                    {formatMoney(totals.principalDebt)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-blue-900 bg-blue-100 border-r border-slate-300 text-sm">
                    {formatMoney(totals.minDebt)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono border-r border-slate-300">
                    {formatMoney(totals.totalDebt)}
                  </td>
                  <td colSpan={3} className="py-3 px-3 text-center bg-slate-200/90 font-bold">
                    Jadval yakuni
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        /* ─── KARTALAR KO'RINISHI (Mobile / Responsive Grid) ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {debtors.map((debtor) => (
            <div
              key={debtor.id}
              onClick={() => navigate(`/debtor/${debtor.id}`)}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition active:scale-[0.99] cursor-pointer flex flex-col justify-between gap-3"
            >
              {/* Card Top: Name & Amount */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      ID: {debtor.externalId}
                    </span>
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      Макс кун: {debtor.overdueDays || 0} кун
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base leading-tight truncate">
                    {debtor.fullName}
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-1">
                    {debtor.mfy ? `${debtor.mfy} · ` : ''}
                    {debtor.address || 'Manzil ko\'rsatilmagan'}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-black text-slate-900 text-base sm:text-lg block tracking-tight">
                    {formatMoney(debtor.minDebt)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMapTarget(debtor);
                    }}
                    className="text-blue-600 text-xs font-bold flex items-center justify-end gap-0.5 mt-0.5 hover:underline cursor-pointer"
                    title="Xaritada ochish"
                  >
                    <LocationOnIcon sx={{ fontSize: 14 }} className="text-rose-500" />
                    <span>{debtor.distanceFormatted || '500 m'}</span>
                  </button>
                </div>
              </div>

              {/* Card Bottom: Amounts details and Status */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <div className="space-x-2">
                  <span>Asosiy: <strong className="text-slate-800">{formatMoney(debtor.principalDebt)}</strong></span>
                </div>
                <div>
                  {getStatusBadge(debtor.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🗺 Xaritani tanlash oynasi (Yandex / Google / 2GIS) */}
      <MapChooserModal
        isOpen={!!mapTarget}
        onClose={() => setMapTarget(null)}
        address={mapTarget?.address}
        mfy={mapTarget?.mfy}
        lat={mapTarget?.lat}
        lng={mapTarget?.lng}
        fullName={mapTarget?.fullName}
      />

      {/* ✏️ Telefon va manzilni tahrirlash modali */}
      {editTarget && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={closeEditModal}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Telefon va manzilni tahrirlash
              </h3>
              <button
                type="button"
                onClick={closeEditModal}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Telefon raqamlar ro'yxati */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Telefon raqamlar (O'zbekiston, Rossiya +7 va b.)
                </label>
                <button
                  type="button"
                  onClick={handleAddPhone}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  <AddIcon sx={{ fontSize: 15 }} />
                  <span>Raqam qo'shish</span>
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {editTarget.phones.map((phone, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => handleEditPhoneChange(idx, e.target.value)}
                      placeholder="+998901234567 yoki +79991234567"
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhone(idx)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 cursor-pointer"
                      title="O'chirish"
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Manzil */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Manzil
              </label>
              <textarea
                rows={3}
                value={editTarget.address}
                onChange={(e) => setEditTarget((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Yashash manzili..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Tugmalar */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={editSaving}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleEditSave}
                disabled={editSaving}
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl shadow-xs transition cursor-pointer"
              >
                {editSaving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

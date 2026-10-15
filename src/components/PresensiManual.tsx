import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  Filter, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Send, 
  RotateCcw, 
  BookOpen, 
  Save,
  Users,
  Search,
  Heart,
  UserCheck,
  AlertCircle,
  Sparkles,
  Trash2,
  Check,
  UserX,
  PlusCircle,
  ShieldCheck
} from 'lucide-react';
import { 
  ActivityType, 
  ACTIVITY_OPTIONS, 
  SCHOOL_CLASSES, 
  Student, 
  AttendanceRecord, 
  AttendanceStatus 
} from '../types';
import { soundService } from '../services/soundService';

interface PresensiManualProps {
  students: Student[];
  recentAttendance?: AttendanceRecord[];
  onAddAttendance?: (record: AttendanceRecord) => void;
  onUpdateAttendance?: (record: AttendanceRecord) => void;
  onDeleteAttendance?: (id: string) => void;
  onBatchSaveAttendance: (records: AttendanceRecord[]) => void;
  onSyncSpreadsheet: () => void;
  isSyncing: boolean;
}

export const PresensiManual: React.FC<PresensiManualProps> = ({
  students,
  recentAttendance = [],
  onAddAttendance,
  onUpdateAttendance,
  onDeleteAttendance,
  onBatchSaveAttendance,
  onSyncSpreadsheet,
  isSyncing,
}) => {
  // Mode Tab: 'quick_individual' (Cepat 1-2 Murid Lupa Kartu / Haid) vs 'class_batch' (1 Kelas Penuh)
  const [viewMode, setViewMode] = useState<'quick_individual' | 'class_batch'>('quick_individual');
  
  // Common Settings
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('Sholat Dzuhur Berjama’ah');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString('id-ID', { hour12: false }));
  const [customNote, setCustomNote] = useState<string>('');

  // Quick Individual Input State
  const [quickSearch, setQuickSearch] = useState<string>('');
  const [quickClassFilter, setQuickClassFilter] = useState<string>('Semua Kelas');
  const [quickGenderFilter, setQuickGenderFilter] = useState<'ALL' | 'L' | 'P'>('ALL');
  const [quickCategoryFilter, setQuickCategoryFilter] = useState<'all' | 'haid_only' | 'lupa_kartu'>('all');
  const [quickFeedbackMsg, setQuickFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Class Batch Input State
  const [selectedClass, setSelectedClass] = useState<string>('X-1');
  const [topicNotes, setTopicNotes] = useState<string>('Materi Bab: Akhlak Terpuji & Pembiasaan Ibadah');
  const [attendanceState, setAttendanceState] = useState<Record<string, { status: AttendanceStatus; note: string }>>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Filter students for Class Batch Mode
  const classStudents = students.filter((s) => s.className === selectedClass);

  // Filter students for Quick Individual Mode
  const filteredQuickStudents = students.filter((std) => {
    // Class filter
    if (quickClassFilter !== 'Semua Kelas' && std.className !== quickClassFilter) {
      return false;
    }
    // Gender filter
    if (quickGenderFilter !== 'ALL' && std.gender !== quickGenderFilter) {
      return false;
    }
    // Category filter: Haid only (female only)
    if (quickCategoryFilter === 'haid_only' && std.gender !== 'P') {
      return false;
    }
    // Search query
    if (quickSearch.trim()) {
      const q = quickSearch.toLowerCase();
      const matchName = std.name.toLowerCase().includes(q);
      const matchNisn = std.nisn.toLowerCase().includes(q);
      const matchNis = std.nis.toLowerCase().includes(q);
      const matchClass = std.className.toLowerCase().includes(q);
      if (!matchName && !matchNisn && !matchNis && !matchClass) {
        return false;
      }
    }
    return true;
  });

  // Today's attendance for the selected activity
  const todayRecords = recentAttendance.filter(
    (a) => a.date === date && a.activity === selectedActivity
  );

  // Helper to find record for a specific student
  const getTodayRecordForStudent = (studentId: string, nisn: string): AttendanceRecord | undefined => {
    return recentAttendance.find(
      (a) => (a.studentId === studentId || a.studentNisn === nisn) && a.date === date && a.activity === selectedActivity
    );
  };

  // Quick Action: Record 1 Student directly
  const handleQuickRecordStudent = (
    student: Student,
    status: AttendanceStatus,
    noteText?: string
  ) => {
    const existing = getTodayRecordForStudent(student.id, student.nisn);
    const currentTime = new Date().toLocaleTimeString('id-ID', { hour12: false });
    
    let defaultNote = noteText || '';
    if (!defaultNote) {
      if (status === 'Berhalangan') {
        defaultNote = 'Berhalangan sholat (Haid)';
      } else if (status === 'Hadir') {
        defaultNote = 'Hadir (Lupa Kartu QR)';
      } else {
        defaultNote = customNote || `Keterangan: ${status}`;
      }
    }

    if (existing && onUpdateAttendance) {
      // Update existing record
      const updated: AttendanceRecord = {
        ...existing,
        status,
        time: currentTime,
        notes: defaultNote,
        method: 'MANUAL',
        teacher: 'Ulfatul Husna, S.Ag.,M.Pd.',
        syncedToSpreadsheet: false,
      };
      onUpdateAttendance(updated);
      soundService.playSuccessBeep();
      setQuickFeedbackMsg({
        text: `Presensi ${student.name} diperbarui menjadi "${status === 'Berhalangan' ? 'Berhalangan (Haid)' : status}".`,
        type: 'success'
      });
    } else {
      // Create new record
      const newRec: AttendanceRecord = {
        id: `att-manual-${Date.now()}-${student.id}`,
        studentId: student.id,
        studentNisn: student.nisn,
        studentName: student.name,
        className: student.className,
        activity: selectedActivity,
        date,
        time: currentTime,
        status,
        notes: defaultNote,
        method: 'MANUAL',
        teacher: 'Ulfatul Husna, S.Ag.,M.Pd.',
        deviceStation: 'Input Manual Guru',
        operatorName: 'Ulfatul Husna, S.Ag.,M.Pd.',
        syncedToSpreadsheet: false,
      };

      if (onAddAttendance) {
        onAddAttendance(newRec);
      } else {
        onBatchSaveAttendance([newRec]);
      }
      soundService.playSuccessBeep();
      setQuickFeedbackMsg({
        text: `✓ Berhasil mencatat ${student.name} (${student.className}) sebagai "${status === 'Berhalangan' ? 'Berhalangan (Haid)' : status}". Data siap dikirim ke Spreadsheet!`,
        type: 'success'
      });
    }

    setTimeout(() => {
      setQuickFeedbackMsg(null);
    }, 4500);
  };

  // Quick Action: Delete / Revert 1 Student Attendance
  const handleQuickDeleteRecord = (recordId: string, studentName: string) => {
    if (onDeleteAttendance) {
      onDeleteAttendance(recordId);
      setQuickFeedbackMsg({
        text: `Presensi ${studentName} berhasil dihapus / dibatalkan.`,
        type: 'info'
      });
      setTimeout(() => setQuickFeedbackMsg(null), 3000);
    }
  };

  // Class Batch Handlers
  const getStudentStatus = (studentId: string): AttendanceStatus => {
    return attendanceState[studentId]?.status || 'Hadir';
  };

  const getStudentNote = (studentId: string): string => {
    return attendanceState[studentId]?.note || '';
  };

  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState((prev) => {
      const existingNote = prev[studentId]?.note || '';
      const autoNote = (status === 'Berhalangan' && !existingNote)
        ? 'Berhalangan sholat (Haid)'
        : existingNote;
      return {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          status,
          note: autoNote,
        },
      };
    });
  };

  const setStudentNote = (studentId: string, note: string) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || 'Hadir',
        note,
      },
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, { status: AttendanceStatus; note: string }> = {};
    classStudents.forEach((s) => {
      updated[s.id] = {
        status,
        note: attendanceState[s.id]?.note || '',
      };
    });
    setAttendanceState(updated);
  };

  const handleResetBatch = () => {
    setAttendanceState({});
    setSaveSuccessMsg('');
  };

  const handleSaveBatch = () => {
    if (classStudents.length === 0) return;

    const records: AttendanceRecord[] = classStudents.map((student) => {
      const state = attendanceState[student.id] || { status: 'Hadir', note: '' };
      return {
        id: `att-${Date.now()}-${student.id}`,
        studentId: student.id,
        studentNisn: student.nisn,
        studentName: student.name,
        className: student.className,
        activity: selectedActivity,
        date,
        time,
        status: state.status,
        notes: state.note || topicNotes,
        method: 'MANUAL',
        teacher: 'Ulfatul Husna, S.Ag.,M.Pd.',
        syncedToSpreadsheet: false,
      };
    });

    onBatchSaveAttendance(records);
    setSaveSuccessMsg(`Berhasil menyimpan presensi ${classStudents.length} siswa kelas ${selectedClass} untuk kegiatan ${selectedActivity}. Data otomatis siap disinkronkan ke Spreadsheet.`);
    
    setTimeout(() => {
      onSyncSpreadsheet();
    }, 500);

    setTimeout(() => {
      setSaveSuccessMsg('');
    }, 5000);
  };

  // Status counts for class batch
  const countBatchStatus = (status: AttendanceStatus) => {
    return classStudents.filter((s) => getStudentStatus(s.id) === status).length;
  };

  const femaleStudentsTotal = students.filter((s) => s.gender === 'P').length;

  return (
    <div className="space-y-6 pb-12">
      {/* MODE TAB SELECTOR AT TOP */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
              <ClipboardCheck className="w-4 h-4 text-teal-600" />
              <span>Input Presensi Manual PAI &amp; Budi Pekerti</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Pilihan Mode Input Presensi Siswa
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan <strong className="text-emerald-700">Mode Cepat 1-2 Murid</strong> jika siswa lupa membawa kartu QR atau berhalangan sholat (haid), atau gunakan <strong className="text-teal-700">Mode 1 Kelas Penuh</strong> untuk rekap satu rombel sekaligus.
            </p>
          </div>

          {/* Tab Switcher Buttons */}
          <div className="inline-flex rounded-xl p-1.5 bg-slate-100 border border-slate-200 text-xs font-bold shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode('quick_individual')}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 cursor-pointer ${
                viewMode === 'quick_individual'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-200" />
              <span>Mode Cepat 1-2 Murid (Lupa Kartu / Haid)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('class_batch')}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 cursor-pointer ${
                viewMode === 'class_batch'
                  ? 'bg-teal-700 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-teal-200" />
              <span>Mode 1 Kelas Penuh (Rombel)</span>
            </button>
          </div>
        </div>

        {/* Common Activity, Date, & Time Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          {/* Pilihan Kegiatan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>Pilihan Kegiatan:</span>
            </label>
            <select
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value as ActivityType)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-lg p-2.5 focus:border-teal-500 focus:bg-white focus:outline-none"
            >
              {ACTIVITY_OPTIONS.map((act) => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>

          {/* Tanggal Presensi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>Tanggal:</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2.5 focus:border-teal-500 focus:bg-white focus:outline-none font-mono"
            />
          </div>

          {/* Jam / Waktu Presensi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>Waktu Presensi (WIB):</span>
            </label>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="07:15:00"
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2.5 focus:border-teal-500 focus:bg-white focus:outline-none font-mono"
            />
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* MODE 1: MODE CEPAT 1-2 MURID (LUPA KARTU QR / BERHALANGAN HAID) */}
      {/* ============================================================== */}
      {viewMode === 'quick_individual' && (
        <section className="space-y-4">
          {/* Search and Filters Bar */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white border border-emerald-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Pencarian Cepat Siswa Lintas Semua Kelas</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ketik nama murid, lalu tekan tombol 1-klik untuk Hadir (Lupa Kartu QR) atau Berhalangan (Haid).
                </p>
              </div>

              {/* Quick Filter Shortcut Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setQuickCategoryFilter('all');
                    setQuickGenderFilter('ALL');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    quickCategoryFilter === 'all' && quickGenderFilter === 'ALL'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Semua ({students.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuickCategoryFilter('haid_only');
                    setQuickGenderFilter('P');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    quickCategoryFilter === 'haid_only'
                      ? 'bg-pink-600 text-white shadow-xs ring-2 ring-pink-300'
                      : 'bg-pink-50 hover:bg-pink-100 text-pink-800 border border-pink-200'
                  }`}
                  title="Filter hanya siswi putri untuk kemudahan presensi haid"
                >
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span>🌸 Siswi Berhalangan (Haid) ({femaleStudentsTotal})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuickCategoryFilter('lupa_kartu');
                    setQuickGenderFilter('ALL');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    quickCategoryFilter === 'lupa_kartu'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                  title="Fokus input murid yang lupa membawa kartu fisik"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>⚠️ Lupa Kartu QR</span>
                </button>
              </div>
            </div>

            {/* Input Search Box and Dropdown Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
              {/* Search Box */}
              <div className="sm:col-span-6 relative">
                <Search className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                <input
                  type="text"
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  placeholder="Ketik nama murid, NISN, atau kelas..."
                  autoFocus
                  className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium placeholder:text-slate-400"
                />
                {quickSearch && (
                  <button
                    type="button"
                    onClick={() => setQuickSearch('')}
                    className="absolute right-2.5 top-2.5 w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter Kelas */}
              <div className="sm:col-span-3">
                <select
                  value={quickClassFilter}
                  onChange={(e) => setQuickClassFilter(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl p-2.5 focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="Semua Kelas">Semua Kelas ({students.length} Siswa)</option>
                  {SCHOOL_CLASSES.map((cls) => (
                    <option key={cls} value={cls}>Kelas {cls}</option>
                  ))}
                </select>
              </div>

              {/* Filter Gender */}
              <div className="sm:col-span-3">
                <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl p-1 text-xs h-full">
                  <button
                    type="button"
                    onClick={() => setQuickGenderFilter('ALL')}
                    className={`flex-1 py-1 rounded-lg font-bold text-center transition cursor-pointer ${
                      quickGenderFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    L &amp; P
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickGenderFilter('L')}
                    className={`flex-1 py-1 rounded-lg font-bold text-center transition cursor-pointer ${
                      quickGenderFilter === 'L' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Putra (L)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickGenderFilter('P')}
                    className={`flex-1 py-1 rounded-lg font-bold text-center transition cursor-pointer ${
                      quickGenderFilter === 'P' ? 'bg-pink-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Putri (P)
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Notes / Dispensasi Tambahan (Optional) */}
            <div className="flex items-center gap-2 pt-1 text-xs">
              <label className="text-slate-600 font-semibold shrink-0">Catatan Khusus (opsional):</label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Contoh: Dispensasi lomba, piket musholla, izin UKS..."
                className="flex-1 bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Feedback Banner */}
          {quickFeedbackMsg && (
            <div className={`p-4 rounded-xl text-xs flex items-center justify-between shadow-xs animate-fadeIn ${
              quickFeedbackMsg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                : 'bg-sky-50 border border-sky-300 text-sky-900'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">{quickFeedbackMsg.text}</span>
              </div>
              <button
                type="button"
                onClick={onSyncSpreadsheet}
                disabled={isSyncing}
                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-xs flex items-center gap-1 transition cursor-pointer shrink-0"
              >
                <Send className="w-3 h-3" />
                <span>{isSyncing ? 'Mengirim...' : 'Kirim ke Spreadsheet'}</span>
              </button>
            </div>
          )}

          {/* Student Search Results Cards */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 text-xs text-slate-500">
              <span>
                Menampilkan <strong>{filteredQuickStudents.length}</strong> siswa yang cocok
                {quickSearch && <span> untuk kata kunci &quot;<strong className="text-slate-800">{quickSearch}</strong>&quot;</span>}
              </span>
              <span className="text-[11px] text-emerald-700 font-bold">
                Kegiatan: {selectedActivity}
              </span>
            </div>

            {filteredQuickStudents.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <UserX className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">Tidak ada murid yang cocok dengan pencarian.</p>
                <p className="text-[11px] text-slate-400">Silakan ubah kata kunci nama atau reset filter kelas di atas.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredQuickStudents.map((std) => {
                  const todayRec = getTodayRecordForStudent(std.id, std.nisn);
                  const isRecorded = Boolean(todayRec);
                  const status = todayRec?.status;

                  return (
                    <div
                      key={std.id}
                      className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition ${
                        status === 'Hadir'
                          ? 'bg-emerald-50/70 border-emerald-300'
                          : status === 'Berhalangan'
                          ? 'bg-pink-50/80 border-pink-300'
                          : status === 'Sakit'
                          ? 'bg-blue-50/70 border-blue-300'
                          : status === 'Izin'
                          ? 'bg-amber-50/70 border-amber-300'
                          : status === 'Terlambat'
                          ? 'bg-purple-50/70 border-purple-300'
                          : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      {/* Student Info */}
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl text-xs font-black flex items-center justify-center shrink-0 ${
                          std.gender === 'P' ? 'bg-pink-100 text-pink-700 border border-pink-300' : 'bg-sky-100 text-sky-700 border border-sky-300'
                        }`}>
                          {std.gender}
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2 flex-wrap">
                            <span>{std.name}</span>
                            <span className="text-[11px] bg-slate-200/80 text-slate-800 px-2 py-0.2 rounded-md font-bold font-mono">
                              Kelas {std.className}
                            </span>
                            {isRecorded && (
                              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1 ${
                                status === 'Hadir' ? 'bg-emerald-600 text-white shadow-2xs' :
                                status === 'Berhalangan' ? 'bg-pink-600 text-white shadow-2xs' :
                                status === 'Sakit' ? 'bg-blue-600 text-white' :
                                status === 'Izin' ? 'bg-amber-600 text-white' :
                                'bg-purple-600 text-white'
                              }`}>
                                {status === 'Berhalangan' ? '🌸 Berhalangan (Haid)' : `✓ ${status}`}
                                {todayRec?.time && (
                                  <span className="text-[10px] opacity-90 font-mono">({todayRec.time} WIB)</span>
                                )}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                            <span>NISN: {std.nisn}</span>
                            {todayRec?.notes && (
                              <span className="text-slate-600 italic">· &quot;{todayRec.notes}&quot;</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 1-Click Action Buttons for this Student */}
                      <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                        {/* Tombol 1: Hadir (Lupa Kartu QR) */}
                        <button
                          type="button"
                          onClick={() => handleQuickRecordStudent(std, 'Hadir', 'Hadir (Lupa Kartu QR)')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                            status === 'Hadir'
                              ? 'bg-emerald-700 text-white ring-2 ring-emerald-400'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                          title="Tandai Hadir (karena murid lupa membawa kartu QR fisik)"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Hadir (Lupa Kartu)</span>
                        </button>

                        {/* Tombol 2: 🌸 Berhalangan (Haid) - Disorot Khusus Siswi Putri */}
                        {std.gender === 'P' && (
                          <button
                            type="button"
                            onClick={() => handleQuickRecordStudent(std, 'Berhalangan', 'Berhalangan sholat (Haid)')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                              status === 'Berhalangan'
                                ? 'bg-pink-600 text-white ring-2 ring-pink-400'
                                : 'bg-pink-50 hover:bg-pink-100 text-pink-900 border border-pink-300'
                            }`}
                            title="Tandai siswi berhalangan sholat karena haid / uzur syar'i"
                          >
                            <Heart className="w-3.5 h-3.5 text-pink-600 fill-current" />
                            <span>🌸 Berhalangan (Haid)</span>
                          </button>
                        )}

                        {/* Tombol 3: Sakit */}
                        <button
                          type="button"
                          onClick={() => handleQuickRecordStudent(std, 'Sakit')}
                          className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                            status === 'Sakit'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white hover:bg-blue-50 text-blue-800 border border-slate-200'
                          }`}
                        >
                          <span>Sakit</span>
                        </button>

                        {/* Tombol 4: Izin */}
                        <button
                          type="button"
                          onClick={() => handleQuickRecordStudent(std, 'Izin')}
                          className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                            status === 'Izin'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-white hover:bg-amber-50 text-amber-800 border border-slate-200'
                          }`}
                        >
                          <span>Izin</span>
                        </button>

                        {/* Tombol 5: Terlambat */}
                        <button
                          type="button"
                          onClick={() => handleQuickRecordStudent(std, 'Terlambat')}
                          className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                            status === 'Terlambat'
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-white hover:bg-purple-50 text-purple-800 border border-slate-200'
                          }`}
                        >
                          <span>Terlambat</span>
                        </button>

                        {/* Delete / Batal Presensi if already recorded */}
                        {isRecorded && todayRec && onDeleteAttendance && (
                          <button
                            type="button"
                            onClick={() => handleQuickDeleteRecord(todayRec.id, std.name)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Batal / Hapus presensi siswa ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live Session Log: Presensi yang Baru Saja Disimpan Hari Ini */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-teal-600" />
                  <span>Daftar Presensi yang Tercatat Hari Ini ({todayRecords.length} Siswa)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kegiatan: <strong className="text-slate-800">{selectedActivity}</strong> · Tanggal: <strong className="font-mono text-slate-800">{date}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onSyncSpreadsheet}
                  disabled={isSyncing || todayRecords.length === 0}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSyncing ? 'Menyinkronkan...' : 'Kirim ke Spreadsheet Sekarang'}</span>
                </button>
              </div>
            </div>

            {todayRecords.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                Belum ada presensi yang tercatat untuk kegiatan {selectedActivity} pada tanggal ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">No</th>
                      <th className="py-2.5 px-3">Nama Siswa</th>
                      <th className="py-2.5 px-3 w-20">Kelas</th>
                      <th className="py-2.5 px-3 w-24">Waktu</th>
                      <th className="py-2.5 px-3 w-36 text-center">Status</th>
                      <th className="py-2.5 px-3">Catatan / Keterangan</th>
                      <th className="py-2.5 px-3 w-20 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {todayRecords.map((rec, idx) => (
                      <tr key={rec.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{rec.studentName}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">{rec.className}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{rec.time} WIB</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            rec.status === 'Hadir' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            rec.status === 'Berhalangan' ? 'bg-pink-100 text-pink-800 border border-pink-300' :
                            rec.status === 'Sakit' ? 'bg-blue-100 text-blue-800' :
                            rec.status === 'Izin' ? 'bg-amber-100 text-amber-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {rec.status === 'Berhalangan' ? '🌸 Berhalangan (Haid)' : rec.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{rec.notes || '-'}</td>
                        <td className="py-2.5 px-3 text-center">
                          {onDeleteAttendance && (
                            <button
                              type="button"
                              onClick={() => handleQuickDeleteRecord(rec.id, rec.studentName)}
                              className="text-rose-600 hover:text-rose-800 font-semibold text-xs transition cursor-pointer"
                              title="Hapus presensi siswa ini"
                            >
                              Hapus
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* MODE 2: MODE 1 KELAS PENUH (ROMBONGAN BELAJAR)                  */}
      {/* ============================================================== */}
      {viewMode === 'class_batch' && (
        <section className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  <span>Presensi Rombongan Belajar 1 Kelas Penuh</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Catat seluruh siswa dalam rombel ini. Khusus siswi putri, tombol &quot;B&quot; akan otomatis mencatat Berhalangan (Haid).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMarkAll('Hadir')}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Semua Hadir (H)
                </button>
                <button
                  type="button"
                  onClick={handleResetBatch}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveBatch}
                  disabled={classStudents.length === 0}
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Presensi Kelas {selectedClass}</span>
                </button>
              </div>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pilih Rombongan Belajar (Kelas):</span>
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-lg p-2.5 focus:border-teal-500 focus:bg-white focus:outline-none"
                >
                  {SCHOOL_CLASSES.map((cls) => (
                    <option key={cls} value={cls}>Kelas {cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>Topik / Materi / Keterangan Pembelajaran:</span>
                </label>
                <input
                  type="text"
                  value={topicNotes}
                  onChange={(e) => setTopicNotes(e.target.value)}
                  placeholder="Contoh: Bab 2 / Juz 15"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2.5 focus:border-teal-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Live Stats */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
              <div className="flex items-center gap-4 flex-wrap">
                <span>Total Siswa: <strong className="font-mono text-slate-900">{classStudents.length}</strong></span>
                <span className="text-emerald-700 font-medium">Hadir: <strong className="font-mono">{countBatchStatus('Hadir')}</strong></span>
                <span className="text-pink-700 font-medium">Berhalangan (Haid): <strong className="font-mono">{countBatchStatus('Berhalangan')}</strong></span>
                <span className="text-blue-700 font-medium">Sakit: <strong className="font-mono">{countBatchStatus('Sakit')}</strong></span>
                <span className="text-amber-700 font-medium">Izin: <strong className="font-mono">{countBatchStatus('Izin')}</strong></span>
                <span className="text-rose-700 font-medium">Alpa: <strong className="font-mono">{countBatchStatus('Alpa')}</strong></span>
                <span className="text-purple-700 font-medium">Terlambat: <strong className="font-mono">{countBatchStatus('Terlambat')}</strong></span>
              </div>
            </div>
          </div>

          {saveSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center justify-between shadow-xs animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{saveSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={onSyncSpreadsheet}
                disabled={isSyncing}
                className="px-3 py-1 bg-emerald-700 text-white rounded font-medium hover:bg-emerald-800 transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Send className="w-3 h-3" />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Kirim Sekarang'}</span>
              </button>
            </div>
          )}

          {/* Student Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                <span>Daftar Siswa Kelas {selectedClass} ({classStudents.length} Siswa)</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Kegiatan: <strong className="text-teal-800">{selectedActivity}</strong>
              </span>
            </div>

            {classStudents.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">Tidak ada siswa terdaftar di kelas {selectedClass}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Tambahkan siswa baru melalui menu &quot;Data Murid&quot; untuk kelas {selectedClass}.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">No</th>
                      <th className="py-3 px-4 w-32">NISN</th>
                      <th className="py-3 px-4 min-w-[200px]">Nama Lengkap Siswa</th>
                      <th className="py-3 px-4 w-16 text-center">L/P</th>
                      <th className="py-3 px-4 text-center min-w-[280px]">Status Kehadiran</th>
                      <th className="py-3 px-4 min-w-[200px]">Catatan / Alasan Khusus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {classStudents.map((student, idx) => {
                      const currentStatus = getStudentStatus(student.id);
                      const currentNote = getStudentNote(student.id);

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono text-slate-700">{student.nisn}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{student.name}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              student.gender === 'L' ? 'bg-sky-50 text-sky-700' : 'bg-pink-50 text-pink-700'
                            }`}>
                              {student.gender}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1">
                              {(['Hadir', 'Berhalangan', 'Sakit', 'Izin', 'Alpa', 'Terlambat'] as AttendanceStatus[]).map((st) => {
                                const isSelected = currentStatus === st;
                                let activeClass = 'bg-teal-700 text-white font-bold';
                                if (st === 'Berhalangan') activeClass = 'bg-pink-600 text-white font-bold shadow-xs';
                                if (st === 'Sakit') activeClass = 'bg-blue-700 text-white font-bold';
                                if (st === 'Izin') activeClass = 'bg-amber-600 text-white font-bold';
                                if (st === 'Alpa') activeClass = 'bg-rose-700 text-white font-bold';
                                if (st === 'Terlambat') activeClass = 'bg-purple-700 text-white font-bold';

                                const label = st === 'Hadir' ? 'H' : st === 'Berhalangan' ? 'B' : st === 'Sakit' ? 'S' : st === 'Izin' ? 'I' : st === 'Alpa' ? 'A' : 'T';
                                const title = st === 'Berhalangan' ? 'Berhalangan (Haid / Uzur Syar\'i)' : st;

                                return (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => setStudentStatus(student.id, st)}
                                    title={title}
                                    className={`w-8 h-8 rounded text-xs font-semibold transition cursor-pointer flex items-center justify-center ${
                                      isSelected 
                                        ? activeClass 
                                        : st === 'Berhalangan' && student.gender === 'P'
                                        ? 'bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                    }`}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={currentNote}
                              onChange={(e) => setStudentNote(student.id, e.target.value)}
                              placeholder="Keterangan dispensasi / uzur..."
                              className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-teal-500"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Pastikan data sudah benar sebelum menekan tombol simpan.
              </div>
              <button
                type="button"
                onClick={handleSaveBatch}
                disabled={classStudents.length === 0}
                className="px-5 py-2 bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Presensi Kelas {selectedClass} &amp; Kirim ke Spreadsheet</span>
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

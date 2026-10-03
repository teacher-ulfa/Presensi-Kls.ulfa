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
  Users
} from 'lucide-react';
import { 
  ActivityType, 
  ACTIVITY_OPTIONS, 
  SCHOOL_CLASSES, 
  Student, 
  AttendanceRecord, 
  AttendanceStatus 
} from '../types';

interface PresensiManualProps {
  students: Student[];
  onBatchSaveAttendance: (records: AttendanceRecord[]) => void;
  onSyncSpreadsheet: () => void;
  isSyncing: boolean;
}

export const PresensiManual: React.FC<PresensiManualProps> = ({
  students,
  onBatchSaveAttendance,
  onSyncSpreadsheet,
  isSyncing,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('X-1');
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('Pembelajaran');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString('id-ID', { hour12: false }));
  const [topicNotes, setTopicNotes] = useState<string>('Materi Bab: Akhlak Terpuji & Pembiasaan Ibadah');
  
  // Class student attendance state: studentId -> { status, note }
  const [attendanceState, setAttendanceState] = useState<Record<string, { status: AttendanceStatus; note: string }>>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Filter students for the selected class
  const classStudents = students.filter((s) => s.className === selectedClass);

  const getStudentStatus = (studentId: string): AttendanceStatus => {
    return attendanceState[studentId]?.status || 'Hadir';
  };

  const getStudentNote = (studentId: string): string => {
    return attendanceState[studentId]?.note || '';
  };

  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        note: prev[studentId]?.note || '',
      },
    }));
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

  const handleReset = () => {
    setAttendanceState({});
    setSaveSuccessMsg('');
  };

  const handleSave = () => {
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
        syncedToSpreadsheet: true,
      };
    });

    onBatchSaveAttendance(records);
    setSaveSuccessMsg(`Berhasil menyimpan presensi ${classStudents.length} siswa kelas ${selectedClass} untuk kegiatan ${selectedActivity}. Data otomatis siap disinkronkan ke Spreadsheet.`);
    
    // Automatically trigger sync if requested
    setTimeout(() => {
      onSyncSpreadsheet();
    }, 500);

    setTimeout(() => {
      setSaveSuccessMsg('');
    }, 5000);
  };

  // Status counts
  const countStatus = (status: AttendanceStatus) => {
    return classStudents.filter((s) => getStudentStatus(s.id) === status).length;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Controls */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-teal-600" />
              <span>Input Presensi Manual PAI &amp; Budi Pekerti</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Catat kehadiran per rombongan belajar dengan opsi status Hadir, Sakit, Izin, Alpa, Terlambat
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleMarkAll('Hadir')}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Semua Hadir (H)
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleSave}
              disabled={classStudents.length === 0}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Presensi</span>
            </button>
          </div>
        </div>

        {/* Filters Form Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          {/* Filter Berdasarkan Kelas */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Filter Kelas:</span>
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-semibold rounded-lg p-2.5 focus:border-emerald-500 focus:bg-white focus:outline-none"
            >
              {SCHOOL_CLASSES.map((cls) => (
                <option key={cls} value={cls}>Kelas {cls}</option>
              ))}
            </select>
          </div>

          {/* Dropdown Kegiatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Pilihan Kegiatan:</span>
            </label>
            <select
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value as ActivityType)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-semibold rounded-lg p-2.5 focus:border-emerald-500 focus:bg-white focus:outline-none"
            >
              {ACTIVITY_OPTIONS.map((act) => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>

          {/* Tanggal */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Tanggal:</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2 focus:border-emerald-500 focus:bg-white focus:outline-none font-mono"
            />
          </div>

          {/* Catatan Materi / Surah */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>Topik / Surah / Keterangan:</span>
            </label>
            <input
              type="text"
              value={topicNotes}
              onChange={(e) => setTopicNotes(e.target.value)}
              placeholder="Contoh: Bab 2 / Juz 15"
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2 focus:border-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Live Attendance Stats Counter */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
          <div className="flex items-center gap-4">
            <span>Total Siswa: <strong className="font-mono text-slate-900">{classStudents.length}</strong></span>
            <span className="text-emerald-700 font-medium">Hadir: <strong className="font-mono">{countStatus('Hadir')}</strong></span>
            <span className="text-blue-700 font-medium">Sakit: <strong className="font-mono">{countStatus('Sakit')}</strong></span>
            <span className="text-amber-700 font-medium">Izin: <strong className="font-mono">{countStatus('Izin')}</strong></span>
            <span className="text-rose-700 font-medium">Alpa: <strong className="font-mono">{countStatus('Alpa')}</strong></span>
            <span className="text-purple-700 font-medium">Terlambat: <strong className="font-mono">{countStatus('Terlambat')}</strong></span>
          </div>

          <div className="text-[11px] text-slate-500">
            Guru: <strong className="text-slate-800">Ulfatul Husna, S.Ag.,M.Pd.</strong>
          </div>
        </div>
      </section>

      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{saveSuccessMsg}</span>
          </div>
          <button
            onClick={onSyncSpreadsheet}
            disabled={isSyncing}
            className="px-3 py-1 bg-emerald-700 text-white rounded font-medium hover:bg-emerald-800 transition flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Send className="w-3 h-3" />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Kirim Sekarang'}</span>
          </button>
        </div>
      )}

      {/* Student List Table */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <span>Daftar Siswa Kelas {selectedClass} ({classStudents.length} Siswa)</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Kegiatan: <strong className="text-emerald-800">{selectedActivity}</strong>
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
                          {(['Hadir', 'Sakit', 'Izin', 'Alpa', 'Terlambat'] as AttendanceStatus[]).map((st) => {
                            const isSelected = currentStatus === st;
                            let activeClass = 'bg-emerald-700 text-white font-bold';
                            if (st === 'Sakit') activeClass = 'bg-blue-700 text-white font-bold';
                            if (st === 'Izin') activeClass = 'bg-amber-600 text-white font-bold';
                            if (st === 'Alpa') activeClass = 'bg-rose-700 text-white font-bold';
                            if (st === 'Terlambat') activeClass = 'bg-purple-700 text-white font-bold';

                            const label = st === 'Hadir' ? 'H' : st === 'Sakit' ? 'S' : st === 'Izin' ? 'I' : st === 'Alpa' ? 'A' : 'T';

                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => setStudentStatus(student.id, st)}
                                title={st}
                                className={`w-8 h-8 rounded text-xs font-semibold transition cursor-pointer flex items-center justify-center ${
                                  isSelected 
                                    ? activeClass 
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
                          className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-emerald-500"
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
            onClick={handleSave}
            disabled={classStudents.length === 0}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Presensi Kelas {selectedClass} &amp; Kirim ke Spreadsheet</span>
          </button>
        </div>
      </section>
    </div>
  );
};

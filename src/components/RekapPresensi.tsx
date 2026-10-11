import React, { useState } from 'react';
import { 
  BarChart3, 
  Filter, 
  Download, 
  Printer, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  FileSpreadsheet, 
  Award,
  Users,
  Smartphone,
  Layers,
  AlertCircle
} from 'lucide-react';
import { 
  AttendanceRecord, 
  Student, 
  SCHOOL_CLASSES, 
  ACTIVITY_OPTIONS, 
  ActivityType,
  ROHIS_DEFAULT_STATIONS 
} from '../types';
import { spreadsheetService } from '../services/spreadsheetService';

interface RekapPresensiProps {
  attendanceRecords: AttendanceRecord[];
  students: Student[];
  onBatchMergeAttendance?: (records: AttendanceRecord[]) => { addedCount: number; duplicateCount: number };
}

export const RekapPresensi: React.FC<RekapPresensiProps> = ({
  attendanceRecords,
  students,
  onBatchMergeAttendance,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('X-1');
  const [selectedActivity, setSelectedActivity] = useState<string>('Semua');
  const [selectedPos, setSelectedPos] = useState<string>('Semua');
  const [viewMode, setViewMode] = useState<'rekap' | 'log'>('rekap');

  // Multi-device Merge Modal
  const [showMergeModal, setShowMergeModal] = useState<boolean>(false);
  const [mergeJsonInput, setMergeJsonInput] = useState<string>('');
  const [mergeResultMsg, setMergeResultMsg] = useState<{ text: string; success: boolean } | null>(null);

  // Filter students based on class
  const classStudents = selectedClass === 'Semua Kelas'
    ? students
    : students.filter((s) => s.className === selectedClass);

  // Filter records
  const filteredRecords = attendanceRecords.filter((rec) => {
    const matchClass = selectedClass === 'Semua Kelas' || rec.className === selectedClass;
    const matchActivity = selectedActivity === 'Semua' || rec.activity === selectedActivity;
    const matchPos = selectedPos === 'Semua' || 
      (rec.deviceStation && rec.deviceStation.toLowerCase().includes(selectedPos.toLowerCase()));
    return matchClass && matchActivity && matchPos;
  });

  // Calculate stats
  const totalHadir = filteredRecords.filter((r) => r.status === 'Hadir').length;
  const totalBerhalangan = filteredRecords.filter((r) => r.status === 'Berhalangan').length;
  const totalSakit = filteredRecords.filter((r) => r.status === 'Sakit').length;
  const totalIzin = filteredRecords.filter((r) => r.status === 'Izin').length;
  const totalAlpa = filteredRecords.filter((r) => r.status === 'Alpa').length;
  const totalTerlambat = filteredRecords.filter((r) => r.status === 'Terlambat').length;
  const totalEntries = filteredRecords.length;

  const attendanceRate = totalEntries > 0 
    ? Math.round(((totalHadir + totalTerlambat + totalBerhalangan) / totalEntries) * 100) 
    : 100;

  // Compute student summary per student
  const studentRecap = classStudents.map((std) => {
    const stdRecords = filteredRecords.filter((r) => r.studentId === std.id || r.studentNisn === std.nisn);
    const h = stdRecords.filter((r) => r.status === 'Hadir').length;
    const b = stdRecords.filter((r) => r.status === 'Berhalangan').length;
    const s = stdRecords.filter((r) => r.status === 'Sakit').length;
    const i = stdRecords.filter((r) => r.status === 'Izin').length;
    const a = stdRecords.filter((r) => r.status === 'Alpa').length;
    const t = stdRecords.filter((r) => r.status === 'Terlambat').length;
    const total = stdRecords.length;
    // Berhalangan haid is counted as valid excused attendance in Islamic prayer
    const pct = total > 0 ? Math.round(((h + t + b) / total) * 100) : 100;

    let sikap = 'Sangat Baik (A)';
    if (pct < 75 || a > 2) sikap = 'Cukup (C)';
    else if (pct < 90 || a > 0) sikap = 'Baik (B)';

    return {
      student: std,
      h,
      b,
      s,
      i,
      a,
      t,
      total,
      pct,
      sikap,
    };
  });

  const handleExportCSV = () => {
    spreadsheetService.exportAttendanceToCSV(filteredRecords);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleProcessMerge = () => {
    if (!mergeJsonInput.trim()) return;
    try {
      const parsed = JSON.parse(mergeJsonInput);
      if (!Array.isArray(parsed)) {
        setMergeResultMsg({ text: 'Data tidak valid. Format harus berupa array presensi JSON.', success: false });
        return;
      }
      if (onBatchMergeAttendance) {
        const res = onBatchMergeAttendance(parsed);
        setMergeResultMsg({
          text: `Alhamdulillah! Berhasil menggabungkan ${res.addedCount} data baru. (${res.duplicateCount} duplikasi diabaikan)`,
          success: true,
        });
        setMergeJsonInput('');
      }
    } catch (err) {
      setMergeResultMsg({
        text: 'Format JSON salah: ' + (err instanceof Error ? err.message : String(err)),
        success: false,
      });
    }
  };

  const handleFileUploadMerge = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setMergeJsonInput(content);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Filter Controls */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-700" />
              <span>Rekapitulasi Presensi PAI &amp; Budi Pekerti</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Laporan terpadu presensi multi-perangkat (6-7 HP ROHIS &amp; Pengampu) TP 2026-2027 · SMAN 1 Krembung
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onBatchMergeAttendance && (
              <button
                type="button"
                onClick={() => {
                  setShowMergeModal(true);
                  setMergeResultMsg(null);
                }}
                className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                title="Gabungkan file hasil scan dari 6-7 HP murid ROHIS"
              >
                <Layers className="w-3.5 h-3.5 text-teal-700" />
                <span>Gabungkan 6-7 HP ROHIS</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekspor Spreadsheet (.csv)</span>
            </button>
          </div>
        </div>

        {/* Filter Selection Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          {/* Filter Berdasarkan Kelas */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <label htmlFor="rekap-class-select" className="text-slate-500 font-medium">Kelas:</label>
            <select
              id="rekap-class-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="Semua Kelas">Semua Kelas</option>
              {SCHOOL_CLASSES.map((cls) => (
                <option key={cls} value={cls}>Kelas {cls}</option>
              ))}
            </select>
          </div>

          {/* Filter Kegiatan */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <label htmlFor="rekap-activity-select" className="text-slate-500 font-medium">Kegiatan:</label>
            <select
              id="rekap-activity-select"
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
              className="w-full bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua Kegiatan</option>
              {ACTIVITY_OPTIONS.map((act) => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>

          {/* Filter Pos / Perangkat ROHIS */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
            <Smartphone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <label htmlFor="rekap-pos-select" className="text-slate-500 font-medium">Pos HP:</label>
            <select
              id="rekap-pos-select"
              value={selectedPos}
              onChange={(e) => setSelectedPos(e.target.value)}
              className="w-full bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua Pos (1 - 7)</option>
              {ROHIS_DEFAULT_STATIONS.map((st) => (
                <option key={st.id} value={`Pos ${st.id}`}>
                  Pos {st.id}
                </option>
              ))}
            </select>
          </div>

          {/* Tampilan Mode Tab Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('rekap')}
              className={`flex-1 py-1 px-2.5 rounded-md text-xs font-bold transition cursor-pointer ${
                viewMode === 'rekap' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ringkasan Siswa
            </button>
            <button
              type="button"
              onClick={() => setViewMode('log')}
              className={`flex-1 py-1 px-2.5 rounded-md text-xs font-bold transition cursor-pointer ${
                viewMode === 'log' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Log Pos ROHIS ({filteredRecords.length})
            </button>
          </div>
        </div>
      </section>

      {/* KPI Stats Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">Persentase Hadir</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700 font-mono tabular-nums">
            {attendanceRate}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Termasuk Uzur Syar'i</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">Hadir</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600 font-mono tabular-nums">
            {totalHadir}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Siswa</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-medium text-pink-700 font-bold">🌸 Berhalangan (Haid)</div>
          <div className="mt-1 text-2xl font-bold text-pink-600 font-mono tabular-nums">
            {totalBerhalangan}
          </div>
          <div className="text-[10px] text-pink-500 mt-0.5">Siswi Putri</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">Terlambat</div>
          <div className="mt-1 text-2xl font-bold text-purple-600 font-mono tabular-nums">
            {totalTerlambat}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Siswa</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">Sakit</div>
          <div className="mt-1 text-2xl font-bold text-blue-600 font-mono tabular-nums">
            {totalSakit}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Siswa</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">Izin</div>
          <div className="mt-1 text-2xl font-bold text-amber-600 font-mono tabular-nums">
            {totalIzin}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Siswa</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">Alpa / Tanpa Ket.</div>
          <div className="mt-1 text-2xl font-bold text-rose-600 font-mono tabular-nums">
            {totalAlpa}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Siswa</div>
        </div>
      </section>

      {/* Main Table Content */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        {viewMode === 'rekap' ? (
          <div>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" />
                <span>Ringkasan Kehadiran Per Siswa ({classStudents.length} Siswa)</span>
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>Kelas: <strong className="text-slate-800">{selectedClass}</strong></span>
                <span className="hidden sm:inline text-pink-700 font-medium">· B = Berhalangan (Haid)</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-32">NISN</th>
                    <th className="py-3 px-4 min-w-[200px]">Nama Siswa</th>
                    <th className="py-3 px-3 text-center w-14">L/P</th>
                    <th className="py-3 px-4 w-16 text-center">Kelas</th>
                    <th className="py-3 px-3 text-center w-14 font-mono">H</th>
                    <th className="py-3 px-3 text-center w-14 font-mono text-pink-700 bg-pink-50" title="Berhalangan (Haid)">B</th>
                    <th className="py-3 px-3 text-center w-14 font-mono">S</th>
                    <th className="py-3 px-3 text-center w-14 font-mono">I</th>
                    <th className="py-3 px-3 text-center w-14 font-mono">A</th>
                    <th className="py-3 px-3 text-center w-14 font-mono">T</th>
                    <th className="py-3 px-4 text-center w-28">Kehadiran (%)</th>
                    <th className="py-3 px-4 text-center w-36">Predikat Sikap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {studentRecap.map((item, idx) => (
                    <tr key={item.student.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{item.student.nisn}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{item.student.name}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.student.gender === 'L' ? 'bg-sky-50 text-sky-700' : 'bg-pink-50 text-pink-700'
                        }`}>
                          {item.student.gender}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-700">{item.student.className}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50/50">{item.h}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-pink-700 bg-pink-50/50">{item.b}</td>
                      <td className="py-3 px-3 text-center font-mono text-blue-700">{item.s}</td>
                      <td className="py-3 px-3 text-center font-mono text-amber-700">{item.i}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-rose-700 bg-rose-50/50">{item.a}</td>
                      <td className="py-3 px-3 text-center font-mono text-purple-700">{item.t}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-mono font-bold text-slate-800">{item.pct}%</span>
                          <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${item.pct >= 85 ? 'bg-emerald-600' : item.pct >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                              style={{ width: `${item.pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.sikap.includes('Sangat Baik') 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : item.sikap.includes('Baik')
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.sikap}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-teal-700" />
                <span>Log Presensi Multi-Perangkat (Pos 1 s/d Pos 7 di Masjid Al Hikmah)</span>
              </h2>
              <span className="text-xs text-slate-500">{filteredRecords.length} Catatan Presensi</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-3 w-24">Tanggal</th>
                    <th className="py-3 px-3 w-20">Waktu</th>
                    <th className="py-3 px-4 min-w-[180px]">Nama Siswa</th>
                    <th className="py-3 px-3 w-16 text-center">Kelas</th>
                    <th className="py-3 px-3">Kegiatan</th>
                    <th className="py-3 px-3">Pos Perangkat (ROHIS)</th>
                    <th className="py-3 px-3">Petugas</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Belum ada rekaman presensi pada filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r, idx) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono text-slate-600">{r.date}</td>
                        <td className="py-3 px-3 font-mono text-slate-700 font-semibold">{r.time} WIB</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{r.studentName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{r.studentNisn}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-700">{r.className}</td>
                        <td className="py-3 px-3 text-slate-800">{r.activity}</td>
                        <td className="py-3 px-3">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                            {r.deviceStation || 'Perangkat Utama'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 text-[11px]">
                          {r.operatorName || 'Guru Pengampu'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === 'Hadir' ? 'bg-emerald-100 text-emerald-800' :
                            r.status === 'Berhalangan' ? 'bg-pink-100 text-pink-800 border border-pink-300' :
                            r.status === 'Terlambat' ? 'bg-purple-100 text-purple-800' :
                            r.status === 'Sakit' ? 'bg-blue-100 text-blue-800' :
                            r.status === 'Izin' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {r.status === 'Berhalangan' ? 'Berhalangan (Haid)' : r.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* MODAL GABUNGKAN DATA DARI 6-7 HP ROHIS */}
      {showMergeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl border border-slate-200 space-y-4 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Gabungkan Data Presensi dari 6-7 HP ROHIS
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kompilasi otomatis rekaman dari Pos 1 s/d Pos 7 dengan deduplikasi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMergeModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed space-y-1.5">
              <p>
                Unggah file <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">.json</code> yang dikirim oleh murid petugas ROHIS dari HP Pos 1 s/d Pos 7, atau tempel teks kodenya di bawah:
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih File JSON dari HP Murid ROHIS:
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUploadMerge}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Atau Tempel (Paste) Kode JSON di Sini:
              </label>
              <textarea
                value={mergeJsonInput}
                onChange={(e) => setMergeJsonInput(e.target.value)}
                placeholder='Tempel data JSON di sini, contoh: [{"id":"att-1", "studentNisn":"008...", ...}]'
                rows={4}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-teal-500"
              />
            </div>

            {mergeResultMsg && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                mergeResultMsg.success 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {mergeResultMsg.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span>{mergeResultMsg.text}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMergeModal(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleProcessMerge}
                disabled={!mergeJsonInput.trim()}
                className="px-5 py-2 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
              >
                Proses &amp; Gabungkan Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

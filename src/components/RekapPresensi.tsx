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
  Users
} from 'lucide-react';
import { 
  AttendanceRecord, 
  Student, 
  SCHOOL_CLASSES, 
  ACTIVITY_OPTIONS, 
  ActivityType 
} from '../types';
import { spreadsheetService } from '../services/spreadsheetService';

interface RekapPresensiProps {
  attendanceRecords: AttendanceRecord[];
  students: Student[];
}

export const RekapPresensi: React.FC<RekapPresensiProps> = ({
  attendanceRecords,
  students,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('X-1');
  const [selectedActivity, setSelectedActivity] = useState<string>('Semua');

  // Filter students based on class
  const classStudents = selectedClass === 'Semua Kelas'
    ? students
    : students.filter((s) => s.className === selectedClass);

  // Filter records
  const filteredRecords = attendanceRecords.filter((rec) => {
    const matchClass = selectedClass === 'Semua Kelas' || rec.className === selectedClass;
    const matchActivity = selectedActivity === 'Semua' || rec.activity === selectedActivity;
    return matchClass && matchActivity;
  });

  // Calculate stats
  const totalHadir = filteredRecords.filter((r) => r.status === 'Hadir').length;
  const totalSakit = filteredRecords.filter((r) => r.status === 'Sakit').length;
  const totalIzin = filteredRecords.filter((r) => r.status === 'Izin').length;
  const totalAlpa = filteredRecords.filter((r) => r.status === 'Alpa').length;
  const totalTerlambat = filteredRecords.filter((r) => r.status === 'Terlambat').length;
  const totalEntries = filteredRecords.length;

  const attendanceRate = totalEntries > 0 
    ? Math.round(((totalHadir + totalTerlambat) / totalEntries) * 100) 
    : 100;

  // Compute student summary per student
  const studentRecap = classStudents.map((std) => {
    const stdRecords = filteredRecords.filter((r) => r.studentId === std.id || r.studentNisn === std.nisn);
    const h = stdRecords.filter((r) => r.status === 'Hadir').length;
    const s = stdRecords.filter((r) => r.status === 'Sakit').length;
    const i = stdRecords.filter((r) => r.status === 'Izin').length;
    const a = stdRecords.filter((r) => r.status === 'Alpa').length;
    const t = stdRecords.filter((r) => r.status === 'Terlambat').length;
    const total = stdRecords.length;
    const pct = total > 0 ? Math.round(((h + t) / total) * 100) : 100;

    let sikap = 'Sangat Baik (A)';
    if (pct < 75 || a > 2) sikap = 'Cukup (C)';
    else if (pct < 90 || a > 0) sikap = 'Baik (B)';

    return {
      student: std,
      h,
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

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Filter Controls */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>Rekapitulasi Presensi PAI &amp; Budi Pekerti</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Laporan persentase kehadiran dan penilaian pembiasaan ibadah SMAN 1 Krembung TP 2026-2027
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan Rapor</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekspor ke Spreadsheet (.csv)</span>
            </button>
          </div>
        </div>

        {/* Filter Selection Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100">
          {/* Filter Berdasarkan Kelas */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <label htmlFor="rekap-class-select" className="text-slate-500 font-medium">Filter Kelas:</label>
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

          {/* Teacher Signature Info */}
          <div className="flex items-center justify-between sm:justify-end text-xs text-slate-500">
            <span>Guru: <strong className="text-slate-800">Ulfatul Husna, S.Ag.,M.Pd.</strong></span>
          </div>
        </div>
      </section>

      {/* KPI Stats Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">Persentase Hadir</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700 font-mono tabular-nums">
            {attendanceRate}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Rata-rata Kelas</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">Hadir (H)</div>
          <div className="mt-1 text-2xl font-bold text-slate-800 font-mono tabular-nums">
            {totalHadir}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">Tepat Waktu</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">Sakit (S)</div>
          <div className="mt-1 text-2xl font-bold text-blue-700 font-mono tabular-nums">
            {totalSakit}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Dengan Surat</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">Izin (I)</div>
          <div className="mt-1 text-2xl font-bold text-amber-600 font-mono tabular-nums">
            {totalIzin}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Uzur Syar&apos;i</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">Alpa (A)</div>
          <div className="mt-1 text-2xl font-bold text-rose-700 font-mono tabular-nums">
            {totalAlpa}
          </div>
          <div className="text-[10px] text-rose-600 mt-0.5 font-medium">Tanpa Keterangan</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">Terlambat (T)</div>
          <div className="mt-1 text-2xl font-bold text-purple-700 font-mono tabular-nums">
            {totalTerlambat}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Perlu Pembinaan</div>
        </div>
      </section>

      {/* Recap Table per Student */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <span>Rekapitulasi Kehadiran Siswa ({selectedClass})</span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Kegiatan: <strong className="text-indigo-800">{selectedActivity}</strong>
          </div>
        </div>

        {studentRecap.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-sm font-semibold text-slate-700">Tidak ada data rekapitulasi untuk filter ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 w-32">NISN</th>
                  <th className="py-3 px-4 min-w-[200px]">Nama Siswa</th>
                  <th className="py-3 px-4 w-16 text-center">Kelas</th>
                  <th className="py-3 px-3 text-center w-14 font-mono">H</th>
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
                    <td className="py-3 px-4 text-center font-semibold text-slate-700">{item.student.className}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50/50">{item.h}</td>
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
        )}
      </section>
    </div>
  );
};

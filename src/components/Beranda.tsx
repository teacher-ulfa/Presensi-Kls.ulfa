import React from 'react';
import { 
  QrCode, 
  ClipboardCheck, 
  Users, 
  AlertTriangle, 
  BarChart3, 
  FileSpreadsheet, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  BookOpen, 
  HeartHandshake, 
  CalendarCheck,
  Award,
  Clock,
  Send,
  Printer,
  Filter
} from 'lucide-react';
import { ActiveTab } from './HeaderNav';
import { 
  Student, 
  AttendanceRecord, 
  DisciplineRecord, 
  ActivityType, 
  ACTIVITY_OPTIONS,
  SCHOOL_CLASSES 
} from '../types';

interface BerandaProps {
  onNavigate: (tab: ActiveTab) => void;
  onQuickScanActivity: (act: ActivityType) => void;
  onNavigateToPrintWithClass?: (className: string) => void;
  students: Student[];
  attendance: AttendanceRecord[];
  discipline: DisciplineRecord[];
  onSyncSpreadsheet: () => void;
  isSyncing: boolean;
}

export const Beranda: React.FC<BerandaProps> = ({
  onNavigate,
  onQuickScanActivity,
  onNavigateToPrintWithClass,
  students,
  attendance,
  discipline,
  onSyncSpreadsheet,
  isSyncing,
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const todayAttendance = attendance.filter((a) => a.date === today || a.date === '2026-10-02');
  const activeDiscipline = discipline.filter((d) => d.status === 'Dalam Pembinaan');

  const handlePrintClassClick = (cls: string) => {
    if (onNavigateToPrintWithClass) {
      onNavigateToPrintWithClass(cls);
    } else {
      onNavigate('cetak-qr');
    }
  };

  const stats = [
    {
      title: 'Total Murid Terdaftar',
      value: students.length,
      unit: 'Siswa',
      desc: '8 Rombel: X-1 s/d X-4 & XII-9 s/d XII-12',
      icon: <Users className="w-5 h-5 text-emerald-600" />,
      onClick: () => onNavigate('data-murid'),
    },
    {
      title: 'Menu Cetak Kartu QR',
      value: `${students.length} Kartu`,
      unit: 'Aktif',
      desc: 'Tersedia filter 8 rombel siap cetak A4',
      icon: <Printer className="w-5 h-5 text-emerald-700" />,
      onClick: () => handlePrintClassClick('Semua Kelas'),
      highlight: true,
    },
    {
      title: 'Presensi Ibadah & KBM',
      value: attendance.length,
      unit: 'Entri',
      desc: `${todayAttendance.length} entri tercatat hari ini`,
      icon: <CalendarCheck className="w-5 h-5 text-teal-600" />,
      onClick: () => onNavigate('rekap-presensi'),
    },
    {
      title: 'Catatan Kedisiplinan',
      value: discipline.length,
      unit: 'Kasus',
      desc: `${activeDiscipline.length} siswa dalam tahap pembinaan`,
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      onClick: () => onNavigate('catatan-kedisiplinan'),
    },
    {
      title: 'Integrasi Spreadsheet',
      value: 'Online',
      unit: 'Tersinkron',
      desc: 'Otomatis update ke Google Spreadsheet',
      icon: <FileSpreadsheet className="w-5 h-5 text-emerald-700" />,
      onClick: () => onNavigate('spreadsheet'),
    },
  ];

  const features = [
    {
      id: 'cetak-qr' as ActiveTab,
      title: 'Cetak Kartu & QR Code Massal',
      badge: 'MENU AKTIF · FILTER 8 KELAS',
      badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold',
      desc: 'Cetak kartu presensi digital ber-QR Code untuk 282 siswa SMANIKRE. Dilengkapi filter kelas (X-1 s/d X-4 & XII-9 s/d XII-12), pratinjau lembar A4, serta unduh HTML siap cetak.',
      icon: <Printer className="w-6 h-6 text-emerald-700" />,
      actionText: 'Buka Halaman Cetak QR Code',
      highlightBorder: true,
      hasQuickClasses: true,
    },
    {
      id: 'scan-qr' as ActiveTab,
      title: 'Scan QR.Code Presensi',
      badge: 'Cepat & Akurat',
      badgeColor: 'bg-slate-100 text-slate-700',
      desc: 'Presensi otomatis realtime via kamera atau scanner digital. Dilengkapi filter kelas dan 6 jenis kegiatan ibadah & pembelajaran.',
      icon: <QrCode className="w-6 h-6 text-emerald-600" />,
      actionText: 'Buka Scanner QR',
      quickList: ['Pembelajaran', 'Sholat Dhuha', 'Dzuhur', 'Ashar', 'Istighotsah', 'Khotmil Qur’an']
    },
    {
      id: 'presensi-manual' as ActiveTab,
      title: 'Input Presensi Manual',
      badge: 'Filter per Kelas',
      badgeColor: 'bg-slate-100 text-slate-700',
      desc: 'Pencatatan presensi terstruktur per rombongan belajar (X-1 s/d X-4 & XII-9 s/d XII-12) dengan opsi Hadir, Sakit, Izin, Alpa, Terlambat, dan tombol Semua Hadir.',
      icon: <ClipboardCheck className="w-6 h-6 text-teal-600" />,
      actionText: 'Input Presensi Kelas',
    },
    {
      id: 'data-murid' as ActiveTab,
      title: 'Data Murid SMAN 1 Krembung',
      badge: 'Unggah Massal & Master',
      badgeColor: 'bg-slate-100 text-slate-700',
      desc: 'Basis data siswa lengkap SMANIKRE dengan nomor induk, NISN, unggah massal CSV/Excel, serta generator kartu ID Presensi QR Code per siswa.',
      icon: <Users className="w-6 h-6 text-sky-600" />,
      actionText: 'Kelola Data Siswa',
    },
    {
      id: 'catatan-kedisiplinan' as ActiveTab,
      title: 'Catatan Kedisiplinan Siswa',
      badge: 'Ringan · Sedang · Berat',
      badgeColor: 'bg-slate-100 text-slate-700',
      desc: 'Pencatatan pelanggaran tata tertib dan adab ibadah dengan kategorisasi poin serta rancangan bimbingan budi pekerti Kurikulum Merdeka yang terukur.',
      icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
      actionText: 'Lihat Catatan Disiplin',
    },
    {
      id: 'rekap-presensi' as ActiveTab,
      title: 'Rekap Presensi & Evaluasi',
      badge: 'Persentase & Rapor',
      badgeColor: 'bg-slate-100 text-slate-700',
      desc: 'Analisis komprehensif kehadiran per kelas, per kegiatan, dan per siswa dengan persentase kehadiran untuk penilaian asesmen PAI.',
      icon: <BarChart3 className="w-6 h-6 text-indigo-600" />,
      actionText: 'Buka Rekapitulasi',
    },
    {
      id: 'spreadsheet' as ActiveTab,
      title: 'Integrasi Google Spreadsheet',
      badge: 'Sinkronisasi 1-Klik',
      badgeColor: 'bg-slate-100 text-slate-700',
      desc: 'Seluruh data presensi dan catatan kedisiplinan otomatis terkirim ke Google Spreadsheet milik sekolah via Webhook atau ekspor CSV berkala.',
      icon: <FileSpreadsheet className="w-6 h-6 text-emerald-700" />,
      actionText: 'Kelola Spreadsheet',
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner */}
      <section className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl text-white p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-2">
            <span>Kurikulum Merdeka</span>
            <span aria-hidden="true">·</span>
            <span>Deep Learning PAI &amp; Budi Pekerti</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Selamat Datang di SIAP PAI SMAN 1 Krembung
          </h1>
          <p className="mt-2 text-sm sm:text-base text-emerald-100/90 leading-relaxed font-normal">
            Sistem Informasi dan Aplikasi Presensi terpadu untuk monitoring pembelajaran, pembiasaan ibadah harian, dan pencetakan kartu presensi QR Code untuk 8 kelas yang diampu tahun pelajaran 2026-2027.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => handlePrintClassClick('Semua Kelas')}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kartu QR Siswa (Pilih Kelas)</span>
            </button>

            <button
              onClick={() => onNavigate('scan-qr')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg backdrop-blur-xs transition flex items-center gap-2 border border-white/20 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-emerald-300" />
              <span>Buka Scanner Presensi</span>
            </button>

            <button
              onClick={onSyncSpreadsheet}
              disabled={isSyncing}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg backdrop-blur-xs transition flex items-center gap-2 border border-white/20 cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>{isSyncing ? 'Mengirim Data...' : 'Kirim ke Spreadsheet'}</span>
            </button>
          </div>
        </div>

        {/* Ambient watermark pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-radial from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
      </section>

      {/* Quick Launch Bar: Scan QR per Activity */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span>Pintasan Cepat Scan QR.Code Berdasarkan Kegiatan</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Pilih kegiatan untuk langsung memulai scanner presensi dengan preset aktif
            </p>
          </div>
          <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-200">
            6 Pilihan Pembiasaan &amp; KBM
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          {ACTIVITY_OPTIONS.map((act) => (
            <button
              key={act}
              onClick={() => onQuickScanActivity(act)}
              className="p-3 text-left bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 rounded-lg transition group cursor-pointer"
            >
              <div className="text-[11px] font-semibold text-slate-800 group-hover:text-emerald-800 line-clamp-1">
                {act}
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 group-hover:text-emerald-700">
                <span>Scan QR</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Summary KPI Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {stats.map((s, idx) => (
          <div
            key={idx}
            onClick={s.onClick}
            className={`border rounded-xl p-4 shadow-2xs transition cursor-pointer flex flex-col justify-between ${
              s.highlight 
                ? 'bg-emerald-50/70 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-100/60'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${s.highlight ? 'text-emerald-900' : 'text-slate-500'}`}>
                {s.title}
              </span>
              <div className={`p-1.5 rounded-lg ${s.highlight ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`}>
                {s.icon}
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-bold tracking-tight font-mono tabular-nums ${
                  s.highlight ? 'text-emerald-950 font-extrabold' : 'text-slate-900'
                }`}>
                  {s.value}
                </span>
                <span className="text-xs text-slate-500 font-medium">{s.unit}</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{s.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Fitur Utama SIAP PAI Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Menu &amp; Fitur Utama SIAP PAI</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                Semua Menu Aktif
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Pusat pengelolaan presensi harian, cetak kartu QR per kelas, dan rekapitulasi data SMAN 1 Krembung
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.id}
              className={`bg-white rounded-xl p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between group ${
                f.highlightBorder 
                  ? 'border-2 border-emerald-500/80 bg-gradient-to-b from-emerald-50/30 to-white' 
                  : 'border border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-slate-50 group-hover:bg-emerald-50 rounded-lg border border-slate-100 group-hover:border-emerald-200 transition">
                    {f.icon}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${f.badgeColor}`}>
                    {f.badge}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  {f.desc}
                </p>

                {/* Quick Class Selector for Cetak QR card */}
                {f.hasQuickClasses && (
                  <div className="mt-3 pt-3 border-t border-emerald-100 space-y-1.5">
                    <div className="text-[11px] font-semibold text-emerald-900 flex items-center gap-1">
                      <Filter className="w-3 h-3 text-emerald-700" />
                      <span>Pilih Kelas untuk Langsung Dicetak:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => handlePrintClassClick('Semua Kelas')}
                        className="px-2 py-1 bg-emerald-800 text-white rounded text-[10px] font-bold hover:bg-emerald-700 transition cursor-pointer"
                      >
                        Semua ({students.length})
                      </button>
                      {SCHOOL_CLASSES.map((cls) => {
                        const count = students.filter((s) => s.className === cls).length;
                        return (
                          <button
                            key={cls}
                            onClick={() => handlePrintClassClick(cls)}
                            className="px-2 py-1 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 rounded text-[10px] font-semibold transition cursor-pointer"
                          >
                            {cls} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onNavigate(f.id)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group-hover:gap-1.5 transition-all cursor-pointer"
                >
                  <span>{f.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pendekatan Deep Learning & Kurikulum Merdeka Info Deck */}
      <section className="bg-slate-900 text-slate-100 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>Filsafat Kurikulum Merdeka &amp; Deep Learning PAI</span>
        </div>

        <h3 className="text-xl font-bold text-white tracking-tight">
          3 Dimensi Deep Learning dalam Pendidikan Agama Islam SMANIKRE
        </h3>
        <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
          Mengubah presensi dari sekadar administratif menjadi momentum refleksi spiritual, keterhubungan batin dengan Allah SWT, dan internalisasi budi pekerti sehari-hari.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-slate-800/70 border border-slate-700 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              1. Mindful Learning (Ibadah Khusyuk)
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Siswa hadir dengan kesadaran penuh saat Sholat Dhuha, Dzuhur, dan Ashar Berjama&apos;ah di masjid sekolah, bukan karena paksaan formalitas belaka.
            </p>
          </div>

          <div className="p-4 bg-slate-800/70 border border-slate-700 rounded-xl">
            <div className="flex items-center gap-2 text-teal-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              2. Meaningful Learning (Makna Budi Pekerti)
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Memahami hikmah di balik ayat Al-Qur&apos;an pada Khotmil Qur&apos;an dan Istighotsah untuk diaplikasikan dalam sikap jujur, disiplin, dan santun.
            </p>
          </div>

          <div className="p-4 bg-slate-800/70 border border-slate-700 rounded-xl">
            <div className="flex items-center gap-2 text-sky-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              3. Joyful Learning (Ukhuwah Bahagia)
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Membangun atmosfer kebersamaan yang damai, hangat, dan menyenangkan antara guru dan peserta didik di SMA Negeri 1 Krembung.
            </p>
          </div>
        </div>

        {/* Profil Guru Footer Box */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
          <div>
            Guru Pengampu &amp; Pembina Karakter: <strong className="text-white">Ulfatul Husna, S.Ag.,M.Pd.</strong> (NIP: 197410101998022001)
          </div>
          <div className="text-emerald-400 font-medium">
            SMA Negeri 1 Krembung · Kab. Sidoarjo
          </div>
        </div>
      </section>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  ActivityType, 
  ACTIVITY_OPTIONS, 
  UserRole, 
  RohisSession, 
  ROHIS_DEFAULT_STATIONS, 
  MASTER_APP_PASSWORD 
} from '../types';
import { 
  QrCode, 
  LogIn, 
  CheckCircle2, 
  Lock, 
  UserCheck, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Award,
  Smartphone,
  Users,
  KeyRound,
  Check
} from 'lucide-react';

interface CoverLoginProps {
  onLogin: (role: UserRole, rohisSession?: RohisSession) => void;
  onQuickScan: (activity: ActivityType, rohisSession?: RohisSession) => void;
}

const LOGO_SMANIKRE = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhjhEe7DsQaweQWtckuBY0QdRPB_J0RbHqfSXb0fFnNGOQYwfzbn9SyTV1WORteNpd7S3rcGj3FYpaCf0X7tjQpcXoDfErD-aWPD9kTf-6auJIoAZ3ETmXpvuoVydS7H87HO-vidqv4ECyayUG4dFJNZNMuVWD2lUyaMaF7ox5BYCfAksicgx7ryvy6V56Z/s1600/LOGO%20SMANIKRE%20(1).png";

export const CoverLogin: React.FC<CoverLoginProps> = ({ onLogin, onQuickScan }) => {
  // Tab mode: 'guru' (Akses Penuh) vs 'rohis' (Khusus Scan QR 6-7 Perangkat)
  const [selectedRole, setSelectedRole] = useState<UserRole>('guru');

  // Credentials for Guru
  const [username, setUsername] = useState('197410101998022001');
  const [guruPassword, setGuruPassword] = useState('');

  // Credentials and config for Murid ROHIS (6-7 Perangkat)
  const [rohisPassword, setRohisPassword] = useState('');
  const [rohisPosId, setRohisPosId] = useState<number>(1);
  const [rohisOfficerName, setRohisOfficerName] = useState('Petugas ROHIS');
  const [rohisActivity, setRohisActivity] = useState<ActivityType>('Sholat Dzuhur Berjama’ah');

  // Quick activity launcher
  const [selectedQuickActivity, setSelectedQuickActivity] = useState<ActivityType>('Pembelajaran');

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal for quick scan password verification
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickModalPassword, setQuickModalPassword] = useState('');
  const [quickModalError, setQuickModalError] = useState('');

  // Validate teacher login
  const isTargetAccount = 
    username.trim() === '197410101998022001' && 
    (guruPassword.trim() === MASTER_APP_PASSWORD || guruPassword.trim() === '197410101998022001');

  const teacherName = isTargetAccount ? 'Ulfatul Husna, S.Ag.,M.Pd.' : '';

  // Submit Handler for Guru
  const handleGuruSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPass = guruPassword.trim();
    if (cleanPass === MASTER_APP_PASSWORD || cleanPass === '197410101998022001') {
      setIsSubmitting(true);
      setTimeout(() => {
        onLogin('guru');
      }, 300);
    } else {
      setErrorMsg('Password salah! Silakan periksa kembali kata sandi pengampu.');
    }
  };

  // Submit Handler for Murid ROHIS (6-7 Perangkat)
  const handleRohisSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPass = rohisPassword.trim();
    if (cleanPass === MASTER_APP_PASSWORD || cleanPass === '197410101998022001') {
      setIsSubmitting(true);
      const chosenStation = ROHIS_DEFAULT_STATIONS.find(s => s.id === rohisPosId) || ROHIS_DEFAULT_STATIONS[0];
      
      const session: RohisSession = {
        stationId: chosenStation.id,
        stationName: chosenStation.name,
        officerName: rohisOfficerName.trim() || `Petugas ${chosenStation.name}`,
        activity: rohisActivity,
        startedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };

      setTimeout(() => {
        onLogin('rohis', session);
      }, 300);
    } else {
      setErrorMsg('Kata sandi keamanan salah! Akses ditolak.');
    }
  };

  // Quick scan launch button on cover
  const handleQuickScanLaunchClick = () => {
    setShowQuickModal(true);
    setQuickModalError('');
    setQuickModalPassword('');
  };

  const handleConfirmQuickScan = () => {
    if (quickModalPassword.trim() === MASTER_APP_PASSWORD || quickModalPassword.trim() === '197410101998022001') {
      setShowQuickModal(false);
      onQuickScan(selectedQuickActivity);
    } else {
      setQuickModalError('Password salah! Silakan coba lagi.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col justify-between text-slate-100 selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* Background subtle Islamic geometric motif */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="islamic-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M30 0 L60 30 L30 60 L0 30 Z" fill="none" stroke="currentColor" strokeWidth="1" />
              <circle cx="30" cy="30" r="14" fill="none" stroke="currentColor" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#islamic-grid)" />
        </svg>
      </div>

      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 md:py-10 flex items-center justify-center relative z-10">
        <div className="w-full bg-slate-900/85 backdrop-blur-xl border border-emerald-500/20 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Sebelah Kiri: Memuat Logo SMAN 1 Krembung & Identitas Sekolah */}
          <div className="lg:col-span-5 p-6 md:p-8 bg-gradient-to-b from-emerald-900/50 via-slate-900/80 to-slate-950 flex flex-col items-center justify-between border-b lg:border-b-0 lg:border-r border-emerald-500/20 text-center relative">
            <div className="w-full flex items-center justify-between text-xs text-emerald-400/90 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Portal Presensi Terpadu
              </span>
              <span className="text-slate-400">SMANIKRE</span>
            </div>

            {/* Logo SMAN 1 Krembung */}
            <div className="my-6 flex flex-col items-center">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full blur-md opacity-40 group-hover:opacity-75 transition duration-500" />
                <div className="relative w-36 h-36 md:w-40 md:h-40 rounded-full bg-white p-3 shadow-xl flex items-center justify-center border-4 border-emerald-400/30">
                  <img 
                    src={LOGO_SMANIKRE} 
                    alt="Logo SMAN 1 Krembung" 
                    className="w-full h-full object-contain filter drop-shadow-md hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=300&auto=format&fit=crop&q=80";
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 space-y-1">
                <h2 className="text-lg md:text-xl font-bold tracking-tight text-white">
                  SMA NEGERI 1 KREMBUNG
                </h2>
                <p className="text-xs text-emerald-300 font-medium tracking-wide">
                  Terakreditasi A · Kabupaten Sidoarjo
                </p>
                <div className="pt-1 flex items-center justify-center gap-1 text-[11px] text-slate-400">
                  <span>Kurikulum Merdeka</span>
                  <span aria-hidden="true">·</span>
                  <span>Deep Learning PAI</span>
                </div>
              </div>
            </div>

            {/* Banner Keamanan & Dukungan Multi-Perangkat ROHIS */}
            <div className="w-full space-y-2 text-left">
              <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                  <KeyRound className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Keamanan Akses Terproteksi</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-300">
                  Aplikasi dilindungi dengan kata sandi rahasia untuk menjaga kerahasiaan dan integritas data presensi siswa.
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 border border-teal-500/30 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-teal-300">
                  <Smartphone className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Terpusat di Masjid Al Hikmah</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                  Semua pos presensi (Pos 1 s/d Pos 7) terpusat di Masjid Al Hikmah SMAN 1 Krembung untuk pemindaian bersamaan oleh tim ROHIS.
                </p>
              </div>
            </div>
          </div>

          {/* Sebelah Kanan: Pilihan Akses & Form Login */}
          <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-between">
            <div>
              {/* Header Title */}
              <div className="mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-400 tracking-wider uppercase">
                    Tahun Pelajaran 2026-2027
                  </span>
                  <span className="text-[11px] bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-medium">
                    Terproteksi Sandi
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-extrabold text-white mt-1 leading-tight tracking-tight">
                  SIAP <span className="text-emerald-400 font-bold">(Sistem Informasi dan Aplikasi Presensi)</span>
                </h1>
                <p className="text-xs md:text-sm text-slate-300 mt-1 font-medium">
                  Pendidikan Agama Islam &amp; Budi Pekerti · SMA Negeri 1 Krembung
                </p>
              </div>

              {/* Mode Selector Tab: Guru vs Murid ROHIS (6-7 Perangkat) */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 border border-slate-800 rounded-xl mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('guru');
                    setErrorMsg('');
                  }}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    selectedRole === 'guru'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Akun Guru Pengampu</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('rohis');
                    setErrorMsg('');
                  }}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    selectedRole === 'rohis'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Mode Petugas ROHIS (6-7 HP)</span>
                </button>
              </div>

              {/* FORM TAB 1: GURU PENGAMPU */}
              {selectedRole === 'guru' && (
                <form onSubmit={handleGuruSubmit} className="space-y-4">
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-200">
                    <strong>Akses Guru Pengampu:</strong> Memiliki akses penuh ke Beranda, Data Murid, Catatan Kedisiplinan, Rekap Presensi, Cetak Kartu QR, Spreadsheet Hub, dan Scanner.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Username / NIP Guru Pengampu
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="NIP Pengampu"
                        required
                        className="w-full px-4 py-2 bg-slate-950/70 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setUsername('197410101998022001');
                        }}
                        title="Klik untuk mengisi NIP pengampu"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-emerald-400 hover:text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 transition cursor-pointer"
                      >
                        Isi NIP
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Password Keamanan Guru Pengampu
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={guruPassword}
                        onChange={(e) => setGuruPassword(e.target.value)}
                        placeholder="Masukkan kata sandi rahasia..."
                        required
                        className="w-full px-4 py-2 bg-slate-950/70 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Teacher Name Verification Preview */}
                  {teacherName && (
                    <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wide text-emerald-300 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Guru Terverifikasi:
                          </div>
                          <div className="text-sm font-bold text-white tracking-tight">
                            {teacherName}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {errorMsg && (
                    <p className="text-xs text-rose-300 bg-rose-950/60 p-2.5 rounded-lg border border-rose-800">
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition text-sm disabled:opacity-50 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{isSubmitting ? 'Memverifikasi...' : 'Masuk ke Aplikasi SIAP PAI'}</span>
                  </button>
                </form>
              )}

              {/* FORM TAB 2: MODE PETUGAS SCAN ROHIS (6-7 PERANGKAT) */}
              {selectedRole === 'rohis' && (
                <form onSubmit={handleRohisSubmit} className="space-y-3.5">
                  <div className="p-3 bg-teal-950/60 border border-teal-500/40 rounded-xl text-xs text-teal-200">
                    <strong>Mode Khusus Scan QR ROHIS:</strong> Semua pos presensi terpusat di Masjid Al Hikmah SMAN 1 Krembung untuk 6-7 murid ROHIS yang memegang HP saat presensi. Perangkat ini dikunci aman khusus di menu Scan QR Code saja.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Pilih Pos Perangkat (1 s/d 7) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Pilih Pos Perangkat (1 - 7)
                      </label>
                      <select
                        value={rohisPosId}
                        onChange={(e) => setRohisPosId(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950/70 border border-teal-500/40 rounded-lg text-white text-xs focus:outline-none focus:border-teal-400 transition"
                      >
                        {ROHIS_DEFAULT_STATIONS.map((station) => (
                          <option key={station.id} value={station.id} className="bg-slate-900 text-white">
                            {station.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Nama Murid Petugas ROHIS */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nama Murid Petugas ROHIS
                      </label>
                      <input
                        type="text"
                        value={rohisOfficerName}
                        onChange={(e) => setRohisOfficerName(e.target.value)}
                        placeholder="Contoh: Ahmad / Siti (ROHIS)"
                        required
                        className="w-full px-3 py-2 bg-slate-950/70 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teal-400 transition"
                      />
                    </div>
                  </div>

                  {/* Kegiatan yang Di-scan */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Kegiatan yang Sedang Berlangsung
                    </label>
                    <select
                      value={rohisActivity}
                      onChange={(e) => setRohisActivity(e.target.value as ActivityType)}
                      className="w-full px-3 py-2 bg-slate-950/70 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teal-400 transition"
                    >
                      {ACTIVITY_OPTIONS.map((act) => (
                        <option key={act} value={act} className="bg-slate-900 text-white">
                          {act}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Password Pengamanan Rahasia */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Kata Sandi Rahasia Petugas
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={rohisPassword}
                        onChange={(e) => setRohisPassword(e.target.value)}
                        placeholder="Masukkan kata sandi rahasia..."
                        required
                        className="w-full px-4 py-2 bg-slate-950/70 border border-teal-500/50 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition"
                      />
                      <Lock className="w-4 h-4 text-teal-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {errorMsg && (
                    <p className="text-xs text-rose-300 bg-rose-950/60 p-2.5 rounded-lg border border-rose-800">
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg shadow-lg shadow-teal-900/30 flex items-center justify-center gap-2 transition text-sm disabled:opacity-50 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>{isSubmitting ? 'Mengaktifkan Scanner...' : 'Mulai Scan Sebagai Petugas ROHIS'}</span>
                  </button>
                </form>
              )}
            </div>

            {/* Bagian Pintasan Cepat Scan QR.Code dengan Pilihan Dropdown & Proteksi Password */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                  Pintasan Cepat Scan QR
                </span>
                <span className="text-[10px] text-slate-400">Terproteksi Sandi</span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1">
                  <select
                    value={selectedQuickActivity}
                    onChange={(e) => setSelectedQuickActivity(e.target.value as ActivityType)}
                    className="w-full bg-slate-950 border border-emerald-500/40 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-400"
                  >
                    {ACTIVITY_OPTIONS.map((act) => (
                      <option key={act} value={act} className="bg-slate-900 text-white">
                        {act}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleQuickScanLaunchClick}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition shadow whitespace-nowrap cursor-pointer"
                >
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>Scan Cepat</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Modal Verifikasi Password untuk Pintasan Cepat */}
      {showQuickModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Konfirmasi Password</h3>
                <p className="text-xs text-slate-400">Masukkan sandi aplikasi untuk membuka pemindai</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Kata Sandi Aplikasi
              </label>
              <input
                type="password"
                value={quickModalPassword}
                onChange={(e) => setQuickModalPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                autoFocus
                className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/40 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>

            {quickModalError && (
              <p className="text-xs text-rose-400 bg-rose-950/60 p-2 rounded-lg border border-rose-800">
                {quickModalError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowQuickModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmQuickScan}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Buka Pemindai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Wajib: oleh Ulfatul Husna, S.Ag.,M.Pd. */}
      <footer className="w-full py-3.5 px-6 border-t border-emerald-500/20 bg-slate-950/90 text-center relative z-10">
        <p className="text-xs text-slate-300 font-medium">
          oleh <span className="text-emerald-400 font-semibold">Ulfatul Husna, S.Ag.,M.Pd.</span> · SMA Negeri 1 Krembung Tahun Pelajaran 2026-2027
        </p>
      </footer>
    </div>
  );
};

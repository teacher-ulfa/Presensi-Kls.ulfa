import React, { useState, useEffect } from 'react';
import { ActivityType, ACTIVITY_OPTIONS } from '../types';
import { 
  QrCode, 
  LogIn, 
  CheckCircle2, 
  Lock, 
  UserCheck, 
  Sparkles, 
  BookOpen, 
  ArrowRight,
  ShieldCheck,
  Award
} from 'lucide-react';

interface CoverLoginProps {
  onLogin: () => void;
  onQuickScan: (activity: ActivityType) => void;
}

const LOGO_SMANIKRE = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhjhEe7DsQaweQWtckuBY0QdRPB_J0RbHqfSXb0fFnNGOQYwfzbn9SyTV1WORteNpd7S3rcGj3FYpaCf0X7tjQpcXoDfErD-aWPD9kTf-6auJIoAZ3ETmXpvuoVydS7H87HO-vidqv4ECyayUG4dFJNZNMuVWD2lUyaMaF7ox5BYCfAksicgx7ryvy6V56Z/s1600/LOGO%20SMANIKRE%20(1).png";

export const CoverLogin: React.FC<CoverLoginProps> = ({ onLogin, onQuickScan }) => {
  const [username, setUsername] = useState('197410101998022001');
  const [password, setPassword] = useState('197410101998022001');
  const [selectedQuickActivity, setSelectedQuickActivity] = useState<ActivityType>('Pembelajaran');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-detect matching credentials
  const isTargetAccount = 
    username.trim() === '197410101998022001' && 
    password.trim() === '197410101998022001';

  const teacherName = isTargetAccount ? 'Ulfatul Husna, S.Ag.,M.Pd.' : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (username.trim() === '197410101998022001' && password.trim() === '197410101998022001') {
      setIsSubmitting(true);
      setTimeout(() => {
        onLogin();
      }, 400);
    } else {
      setErrorMsg('Username atau Password tidak sesuai. Silakan gunakan NIP: 197410101998022001');
    }
  };

  const handleQuickScanLaunch = () => {
    // Allows direct launch from cover shortcut as requested
    onQuickScan(selectedQuickActivity);
  };

  const fillDefaultCredentials = () => {
    setUsername('197410101998022001');
    setPassword('197410101998022001');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col justify-between text-slate-100 selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* Background subtle Islamic geometric motif and glow */}
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
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 md:py-12 flex items-center justify-center relative z-10">
        <div className="w-full bg-slate-900/80 backdrop-blur-xl border border-emerald-500/20 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Sebelah Kiri: Memuat Logo SMAN 1 Krembung & Identitas Sekolah */}
          <div className="lg:col-span-5 p-8 md:p-10 bg-gradient-to-b from-emerald-900/50 via-slate-900/80 to-slate-950 flex flex-col items-center justify-between border-b lg:border-b-0 lg:border-r border-emerald-500/20 text-center relative">
            <div className="w-full flex items-center justify-between text-xs text-emerald-400/90 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Portal Resmi PAI
              </span>
              <span className="text-slate-400">SMANIKRE</span>
            </div>

            {/* Logo SMAN 1 Krembung */}
            <div className="my-8 flex flex-col items-center">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full blur-md opacity-40 group-hover:opacity-75 transition duration-500" />
                <div className="relative w-44 h-44 rounded-full bg-white p-3 shadow-xl flex items-center justify-center border-4 border-emerald-400/30">
                  <img 
                    src={LOGO_SMANIKRE} 
                    alt="Logo SMAN 1 Krembung" 
                    className="w-full h-full object-contain filter drop-shadow-md hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Fallback if network blocked
                      (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=300&auto=format&fit=crop&q=80";
                    }}
                  />
                </div>
              </div>

              <div className="mt-5 space-y-1">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  SMA NEGERI 1 KREMBUNG
                </h2>
                <p className="text-xs text-emerald-300 font-medium tracking-wide">
                  Terakreditasi A · Kabupaten Sidoarjo
                </p>
                <div className="pt-2 flex items-center justify-center gap-1 text-[11px] text-slate-400">
                  <span>Kurikulum Merdeka</span>
                  <span aria-hidden="true">·</span>
                  <span>Deep Learning PAI</span>
                </div>
              </div>
            </div>

            {/* Nilai Karakter Islami SMANIKRE */}
            <div className="w-full p-3.5 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-left">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Profil Pelajar Berakhlak Mulia</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                Pembiasaan Ibadah, Khotmil Qur&apos;an, Sholat Berjama&apos;ah, &amp; Penanaman Budi Pekerti Berkelanjutan.
              </p>
            </div>
          </div>

          {/* Sebelah Kanan: SIAP PAI SMA Negeri 1 Krembung & Form Login */}
          <div className="lg:col-span-7 p-8 md:p-10 flex flex-col justify-between">
            <div>
              {/* Header Title */}
              <div className="mb-6">
                <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">
                  Tahun Pelajaran 2026-2027
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1 leading-tight tracking-tight">
                  SIAP <span className="text-emerald-400 font-bold">(Sistem Informasi dan Aplikasi Presensi)</span>
                </h1>
                <p className="text-sm md:text-base text-slate-300 mt-2 font-medium">
                  Pendidikan Agama Islam dan Budi Pekerti SMA Negeri 1 Krembung
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Username / NIP Guru Pengampu
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan Username / NIP"
                      required
                      className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    />
                    <button
                      type="button"
                      onClick={fillDefaultCredentials}
                      title="Klik untuk mengisi akun otomatis"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 transition"
                    >
                      NIP Resmi
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan Password"
                      required
                      className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Otomatis muncul nama pengguna jika username dan password diinput */}
                {teacherName && (
                  <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/40 rounded-xl transition-all duration-300 animate-fadeIn">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-emerald-300 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Nama Pengguna Terverifikasi:
                        </div>
                        <div className="text-sm font-bold text-white tracking-tight">
                          {teacherName}
                        </div>
                        <div className="text-[11px] text-emerald-200/80">
                          Guru PAI &amp; Budi Pekerti · SMA Negeri 1 Krembung
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <p className="text-xs text-rose-400 bg-rose-950/50 p-2.5 rounded-lg border border-rose-800">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition duration-200 text-sm disabled:opacity-50 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isSubmitting ? 'Memverifikasi...' : 'Masuk ke Aplikasi SIAP'}</span>
                </button>
              </form>
            </div>

            {/* Bagian Pintasan Cepat Scan QR.Code dengan Pilihan Dropdown */}
            <div className="mt-8 pt-6 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  Pintasan Cepat Scan QR.Code
                </span>
                <span className="text-[11px] text-slate-400">Akses Langsung Ibadah/KBM</span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="flex-1">
                  <select
                    value={selectedQuickActivity}
                    onChange={(e) => setSelectedQuickActivity(e.target.value as ActivityType)}
                    className="w-full bg-slate-950 border border-emerald-500/40 text-slate-100 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
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
                  onClick={handleQuickScanLaunch}
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition shadow whitespace-nowrap cursor-pointer"
                >
                  <span>Mulai Scan Sekarang</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                <span>Pilihan:</span>
                <span className="text-slate-300">Pembelajaran</span>
                <span>·</span>
                <span className="text-slate-300">Sholat Dhuha</span>
                <span>·</span>
                <span className="text-slate-300">Sholat Dzuhur</span>
                <span>·</span>
                <span className="text-slate-300">Sholat Ashar</span>
                <span>·</span>
                <span className="text-slate-300">Istighotsah</span>
                <span>·</span>
                <span className="text-slate-300">Khotmil Qur’an</span>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer Wajib: oleh Ulfatul Husna, S.Ag.,M.Pd. */}
      <footer className="w-full py-4 px-6 border-t border-emerald-500/20 bg-slate-950/90 text-center relative z-10">
        <p className="text-xs md:text-sm text-slate-300 font-medium">
          oleh <span className="text-emerald-400 font-semibold">Ulfatul Husna, S.Ag.,M.Pd.</span> · SMA Negeri 1 Krembung Tahun Pelajaran 2026-2027
        </p>
      </footer>
    </div>
  );
};

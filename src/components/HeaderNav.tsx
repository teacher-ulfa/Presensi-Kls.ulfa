import React, { useState } from 'react';
import { 
  Home, 
  QrCode, 
  ClipboardCheck, 
  Users, 
  FileSpreadsheet, 
  AlertTriangle, 
  BarChart3, 
  LogOut,
  RefreshCw,
  Printer,
  Sparkles,
  Lock,
  Smartphone,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { ActivityType, UserRole, RohisSession } from '../types';

export type ActiveTab = 
  | 'beranda'
  | 'scan-qr'
  | 'presensi-manual'
  | 'data-murid'
  | 'catatan-kedisiplinan'
  | 'rekap-presensi'
  | 'cetak-qr'
  | 'spreadsheet';

interface HeaderNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onLogout: () => void;
  onSyncSpreadsheet: () => void;
  isSyncing: boolean;
  onLaunchQuickScan?: (act: ActivityType) => void;
  userRole: UserRole;
  rohisSession?: RohisSession | null;
  onSwitchToGuru: (password: string) => boolean;
  onSwitchToRohis: () => void;
  unsyncedCount?: number;
}

const LOGO_SMANIKRE = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhjhEe7DsQaweQWtckuBY0QdRPB_J0RbHqfSXb0fFnNGOQYwfzbn9SyTV1WORteNpd7S3rcGj3FYpaCf0X7tjQpcXoDfErD-aWPD9kTf-6auJIoAZ3ETmXpvuoVydS7H87HO-vidqv4ECyayUG4dFJNZNMuVWD2lUyaMaF7ox5BYCfAksicgx7ryvy6V56Z/s1600/LOGO%20SMANIKRE%20(1).png";

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  setActiveTab,
  onLogout,
  onSyncSpreadsheet,
  isSyncing,
  userRole,
  rohisSession,
  onSwitchToGuru,
  onSwitchToRohis,
  unsyncedCount = 0,
}) => {
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [switchPassword, setSwitchPassword] = useState('');
  const [switchError, setSwitchError] = useState('');

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'beranda', label: 'Beranda', icon: <Home className="w-4 h-4" /> },
    { id: 'scan-qr', label: 'Scan QR.Code', icon: <QrCode className="w-4 h-4" /> },
    { id: 'presensi-manual', label: 'Input Presensi', icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: 'data-murid', label: 'Data Murid', icon: <Users className="w-4 h-4" /> },
    { id: 'catatan-kedisiplinan', label: 'Kedisiplinan', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'rekap-presensi', label: 'Rekap Presensi', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'cetak-qr', label: 'Cetak Kartu QR', icon: <Printer className="w-4 h-4" />, badge: 'AKTIF' },
    { 
      id: 'spreadsheet', 
      label: 'Spreadsheet', 
      icon: <FileSpreadsheet className="w-4 h-4" />,
      badge: unsyncedCount > 0 ? `${unsyncedCount} BARU` : undefined
    },
  ];

  const handleConfirmSwitchToGuru = () => {
    setSwitchError('');
    const success = onSwitchToGuru(switchPassword);
    if (success) {
      setShowSwitchModal(false);
      setSwitchPassword('');
    } else {
      setSwitchError('Password salah! Silakan periksa kembali kata sandi pengampu.');
    }
  };

  // IF IN ROHIS MODE: Murid ROHIS is restricted to Scan QR only!
  if (userRole === 'rohis') {
    return (
      <header className="sticky top-0 z-40 bg-white border-b border-teal-200/90 shadow-sm print:hidden">
        {/* Top micro info banner for ROHIS */}
        <div className="bg-teal-950 text-teal-200 text-[11px] px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">SMAN 1 Krembung</span>
            <span className="text-teal-400">·</span>
            <span className="bg-teal-800 text-teal-100 px-2 py-0.2 rounded-full font-bold uppercase tracking-wider text-[10px]">
              Tim Scanner ROHIS
            </span>
            <span className="hidden sm:inline text-teal-300">
              {rohisSession?.stationName || 'Pos 1'}
            </span>
            <span className="hidden md:inline text-teal-400/80">
              · Masjid Al Hikmah
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-200 text-[11px]">
            <span className="hidden sm:inline">Petugas:</span>
            <strong className="text-teal-300 font-medium">{rohisSession?.officerName || 'Murid ROHIS'}</strong>
          </div>
        </div>

        {/* Main Header bar for ROHIS */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <img 
              src={LOGO_SMANIKRE} 
              alt="Logo SMANIKRE" 
              className="w-10 h-10 object-contain drop-shadow-xs"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
                <span>SIAP PAI</span>
                <span className="text-teal-700 font-bold text-xs bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  {rohisSession?.stationName || 'Pos 1'}
                </span>
              </div>
              <div className="text-[11px] text-teal-700 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Terpusat di Masjid Al Hikmah SMAN 1 Krembung</span>
              </div>
            </div>
          </div>

          {/* Action buttons for ROHIS */}
          <div className="flex items-center gap-2">
            {/* Sync button */}
            <button
              onClick={onSyncSpreadsheet}
              disabled={isSyncing}
              title="Kirim presensi ke Google Spreadsheet"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-900 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-teal-600' : ''}`} />
              <span>{isSyncing ? 'Mengirim...' : 'Kirim Spreadsheet'}</span>
            </button>

            {/* Switch to Teacher Mode */}
            <button
              onClick={() => {
                setShowSwitchModal(true);
                setSwitchError('');
                setSwitchPassword('');
              }}
              title="Beralih ke Akun Guru Pengampu (Perlu Kata Sandi)"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden md:inline">Beralih ke Akun Guru</span>
              <span className="md:hidden">Guru</span>
            </button>

            {/* Logout / Change Post */}
            <button
              onClick={onLogout}
              title="Ganti Pos atau Keluar"
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* Modal Beralih ke Akun Guru */}
        {showSwitchModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Beralih ke Mode Guru</h3>
                  <p className="text-xs text-slate-500">Masukkan password pengampu untuk akses penuh</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password Guru Pengampu
                </label>
                <input
                  type="password"
                  value={switchPassword}
                  onChange={(e) => setSwitchPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  autoFocus
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>

              {switchError && (
                <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                  {switchError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSwitchModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSwitchToGuru}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Buka Akses Guru
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    );
  }

  // IF IN GURU MODE: Full Navigation
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs print:hidden">
      {/* Top micro info banner */}
      <div className="bg-emerald-950 text-emerald-200 text-[11px] px-4 py-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">SMAN 1 Krembung</span>
          <span className="text-emerald-400">·</span>
          <span>Pendidikan Agama Islam &amp; Budi Pekerti (2026-2027)</span>
        </div>
        <div className="flex items-center gap-3 text-slate-300">
          <span className="hidden sm:inline">Pengampu: <strong className="text-white font-medium">Ulfatul Husna, S.Ag.,M.Pd.</strong></span>
          <span className="bg-emerald-900/80 text-emerald-200 text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            Akses Guru Pengampu
          </span>
        </div>
      </div>

      {/* Main 3-zone Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand wordmark */}
        <div 
          onClick={() => setActiveTab('beranda')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <img 
            src={LOGO_SMANIKRE} 
            alt="Logo SMANIKRE" 
            className="w-10 h-10 object-contain drop-shadow-xs group-hover:scale-105 transition-transform"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="text-base font-extrabold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
              SIAP PAI SMANIKRE
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              E-Presensi &amp; Budi Pekerti
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 overflow-x-auto py-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const isCetak = item.id === 'cetak-qr';
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? 'bg-emerald-700 text-white shadow-xs' 
                    : isCetak
                      ? 'text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                    isActive ? 'bg-emerald-900 text-emerald-200' : 'bg-emerald-600 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Switch to ROHIS quick simulation button */}
          <button
            onClick={onSwitchToRohis}
            title="Buka Mode Petugas Scan ROHIS (Pos 1 s/d Pos 7)"
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-300 hover:bg-teal-100 rounded-lg transition cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden md:inline">Mode ROHIS (Pos 1-7)</span>
            <span className="md:hidden">ROHIS</span>
          </button>

          <button
            onClick={onSyncSpreadsheet}
            disabled={isSyncing}
            title={unsyncedCount > 0 ? `Kirim ${unsyncedCount} data baru ke Google Spreadsheet` : 'Semua data telah tersinkronkan ke Spreadsheet'}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isSyncing ? 'Mengirim...' : 'Kirim Spreadsheet'}</span>
            {unsyncedCount > 0 && (
              <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                {unsyncedCount}
              </span>
            )}
          </button>

          <button
            onClick={onLogout}
            title="Keluar ke Halaman Cover"
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>

      {/* Mobile / Compact Secondary Navigation Row */}
      <div className="lg:hidden border-t border-slate-100 bg-slate-50/90 px-3 py-1.5 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isCetak = item.id === 'cetak-qr';
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition ${
                isActive 
                  ? 'bg-emerald-700 text-white shadow-xs' 
                  : isCetak
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && (
                <span className={`text-[8px] px-1 py-0.2 rounded-full font-bold uppercase ${
                  isActive ? 'bg-emerald-900 text-emerald-200' : 'bg-emerald-700 text-white'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};

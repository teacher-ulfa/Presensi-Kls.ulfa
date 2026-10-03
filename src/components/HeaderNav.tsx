import React from 'react';
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
  Sparkles
} from 'lucide-react';
import { ActivityType } from '../types';

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
}

const LOGO_SMANIKRE = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhjhEe7DsQaweQWtckuBY0QdRPB_J0RbHqfSXb0fFnNGOQYwfzbn9SyTV1WORteNpd7S3rcGj3FYpaCf0X7tjQpcXoDfErD-aWPD9kTf-6auJIoAZ3ETmXpvuoVydS7H87HO-vidqv4ECyayUG4dFJNZNMuVWD2lUyaMaF7ox5BYCfAksicgx7ryvy6V56Z/s1600/LOGO%20SMANIKRE%20(1).png";

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  setActiveTab,
  onLogout,
  onSyncSpreadsheet,
  isSyncing,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'beranda', label: 'Beranda', icon: <Home className="w-4 h-4" /> },
    { id: 'scan-qr', label: 'Scan QR.Code', icon: <QrCode className="w-4 h-4" /> },
    { id: 'presensi-manual', label: 'Input Presensi', icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: 'data-murid', label: 'Data Murid', icon: <Users className="w-4 h-4" /> },
    { id: 'catatan-kedisiplinan', label: 'Kedisiplinan', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'rekap-presensi', label: 'Rekap Presensi', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'cetak-qr', label: 'Cetak Kartu QR', icon: <Printer className="w-4 h-4" />, badge: 'AKTIF' },
    { id: 'spreadsheet', label: 'Spreadsheet', icon: <FileSpreadsheet className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs print:hidden">
      {/* Top micro info banner */}
      <div className="bg-emerald-950 text-emerald-200 text-[11px] px-4 py-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">SMAN 1 Krembung</span>
          <span className="text-emerald-400">·</span>
          <span>Pendidikan Agama Islam &amp; Budi Pekerti (2026-2027)</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-slate-300">
          <span>Pengampu: <strong className="text-white font-medium">Ulfatul Husna, S.Ag.,M.Pd.</strong></span>
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
          <button
            onClick={onSyncSpreadsheet}
            disabled={isSyncing}
            title="Kirim dan sinkronkan semua data ke Google Spreadsheet"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isSyncing ? 'Mengirim...' : 'Kirim Spreadsheet'}</span>
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

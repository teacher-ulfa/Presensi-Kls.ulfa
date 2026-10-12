import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Send, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Settings, 
  RefreshCw, 
  Database, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { AttendanceRecord, DisciplineRecord, SpreadsheetConfig } from '../types';
import { spreadsheetService, SyncResult } from '../services/spreadsheetService';

interface SpreadsheetHubProps {
  config: SpreadsheetConfig;
  onUpdateConfig: (config: SpreadsheetConfig) => void;
  attendanceRecords: AttendanceRecord[];
  disciplineRecords: DisciplineRecord[];
  onManualSync: () => void;
  isSyncing: boolean;
  lastSyncResult: SyncResult | null;
}

export const SpreadsheetHub: React.FC<SpreadsheetHubProps> = ({
  config,
  onUpdateConfig,
  attendanceRecords,
  disciplineRecords,
  onManualSync,
  isSyncing,
  lastSyncResult,
}) => {
  const [activeSheetTab, setActiveSheetTab] = useState<'presensi' | 'kedisiplinan' | 'panduan'>('presensi');
  const [copiedCode, setCopiedCode] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [formConfig, setFormConfig] = useState<SpreadsheetConfig>(config);
  const [showTroubleshoot, setShowTroubleshoot] = useState(true);
  const [filterTodayOnly, setFilterTodayOnly] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const todayAttendance = attendanceRecords.filter((r) => r.date === today);
  const displayedAttendance = filterTodayOnly ? todayAttendance : attendanceRecords;

  const isPlaceholderUrl = !config.webhookUrl || config.webhookUrl.includes('SMANIKRE_SIAP_PAI_PROXY');
  const isGoogleDocLink = Boolean(config.webhookUrl && config.webhookUrl.includes('docs.google.com/spreadsheets'));
  const isValidWebhook = Boolean(
    config.webhookUrl &&
    config.webhookUrl.startsWith('https://script.google.com/macros/s/') &&
    !isPlaceholderUrl
  );

  const handleCopyScript = () => {
    navigator.clipboard.writeText(spreadsheetService.getAppsScriptTemplate());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(formConfig);
    setShowConfigModal(false);
  };

  const handleTestWebhookInModal = async () => {
    setTestingWebhook(true);
    setTestResult(null);
    const res = await spreadsheetService.testWebhook(formConfig.webhookUrl);
    setTestingWebhook(false);
    setTestResult(res);
  };

  const openGoogleSpreadsheetTab = () => {
    const sheetId = config.spreadsheetId || '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
    window.open(`https://docs.google.com/spreadsheets/d/${sheetId}/edit`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner and Quick Sync Actions */}
      <section className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-sm border border-emerald-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Pusat Sinkronisasi Data Spreadsheet</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
              Integrasi Google Spreadsheet Sekolah
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Catatan presensi KBM, sholat dhuha, sholat berjama&apos;ah, istighotsah, khotmil Qur&apos;an, dan catatan kedisiplinan tersimpan di aplikasi dan dapat disinkronkan langsung ke Google Sheets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg shadow-md flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Mengirim Data...' : 'Kirim Semua Sekarang'}</span>
            </button>

            <button
              onClick={() => spreadsheetService.exportTodayAttendanceToCSV(attendanceRecords)}
              className="px-3.5 py-2 bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg border border-teal-600 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Unduh presensi khusus hari ini ke file CSV/Excel langsung"
            >
              <Download className="w-3.5 h-3.5 text-teal-300" />
              <span>Unduh CSV Hari Ini</span>
            </button>

            <button
              onClick={() => {
                const todayStr = new Date().toISOString().slice(0, 10);
                const todayRecs = attendanceRecords.filter(a => a.date === todayStr);
                const recsToExport = todayRecs.length > 0 ? todayRecs : attendanceRecords;
                const jsonStr = JSON.stringify(recsToExport, null, 2);
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Presensi_Sekolah_${todayStr}.json`;
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg border border-emerald-600 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Unduh data presensi dalam format file .JSON"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span>Unduh File .JSON</span>
            </button>

            <button
              onClick={openGoogleSpreadsheetTab}
              className="px-3 py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
              title="Buka dokumen Google Spreadsheet di tab baru"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Buka Sheets</span>
            </button>

            <button
              onClick={() => {
                setFormConfig(config);
                setTestResult(null);
                setShowConfigModal(true);
              }}
              className="px-3 py-2 bg-slate-800/80 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Konfigurasi Webhook</span>
            </button>
          </div>
        </div>

        {/* Sync Status Bar */}
        <div className="mt-5 pt-4 border-t border-emerald-500/20 flex flex-wrap items-center justify-between text-xs text-emerald-200/90 gap-2">
          <div className="flex flex-wrap items-center gap-3">
            {isValidWebhook ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Status: Webhook Apps Script Terhubung</span>
              </span>
            ) : isGoogleDocLink ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 font-semibold text-[11px]">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>Peringatan: URL Berupa Dokumen Google Sheets (Bukan Webhook)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Mode Simulasi Lokal (Webhook Pribadi Belum Dikonfigurasi)</span>
              </span>
            )}
            <span>·</span>
            <span>Presensi Hari Ini: <strong className="text-white font-mono">{todayAttendance.length}</strong> siswa</span>
            <span>·</span>
            <span>Total Semua Presensi: <strong className="text-white font-mono">{attendanceRecords.length}</strong></span>
            <span>·</span>
            <span>Catatan Disiplin: <strong className="text-white font-mono">{disciplineRecords.length}</strong></span>
          </div>

          <div className="text-[11px] text-slate-300">
            Terakhir Sinkron: <strong className="text-white">{config.lastSyncTime || 'Hari ini'}</strong>
          </div>
        </div>
      </section>

      {/* Sync Feedback Alert */}
      {lastSyncResult && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between shadow-xs animate-fadeIn ${
          lastSyncResult.success 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' 
            : 'bg-amber-50 border border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-2.5">
            {lastSyncResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <div>
              <div className="font-bold">{lastSyncResult.message}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Waktu: {lastSyncResult.timestamp}</div>
            </div>
          </div>
        </div>
      )}

      {/* TROUBLESHOOTING & DIAGNOSIS SECTION: Kenapa Data Hari Ini Tidak Masuk? */}
      <section className="bg-amber-50/80 border border-amber-200 rounded-xl overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setShowTroubleshoot(!showTroubleshoot)}
          className="w-full px-5 py-3.5 bg-amber-100/70 hover:bg-amber-100 transition flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-amber-800 shrink-0" />
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-amber-950">
                Pusat Diagnostik: Kenapa Data Presensi Hari Ini Belum Masuk ke Spreadsheet?
              </h2>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Data presensi hari ini tersimpan 100% AMAN di aplikasi ({todayAttendance.length} siswa). Klik di sini untuk melihat 5 penyebab umum dan solusi langsung.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 shrink-0">
            <span>{showTroubleshoot ? 'Tutup Panduan' : 'Buka Solusi'}</span>
            {showTroubleshoot ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showTroubleshoot && (
          <div className="p-5 space-y-4 text-xs text-slate-800 bg-white/70">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              
              {/* Penyebab 1 */}
              <div className="bg-white border border-amber-200/80 rounded-xl p-3.5 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs shrink-0">
                    1
                  </div>
                  <h3 className="font-bold text-slate-900">Perbedaan HP Pos ROHIS vs Laptop Guru</h3>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Jika murid petugas ROHIS melakukan scan presensi menggunakan HP masing-masing di <strong>Pos 1 s/d Pos 7</strong> di Masjid Al Hikmah, data tersebut tersimpan di memori offline HP masing-masing petugas.
                </p>
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-2 text-[11px] text-teal-900 font-medium">
                  👉 <strong>Solusi:</strong> Di HP murid ROHIS maupun laptop Guru, buka menu <strong>Scan QR</strong> &gt; klik tombol <strong>&quot;Ekspor Data Pos (.json)&quot;</strong> &gt; kirim via WA. Di laptop Guru, klik <strong>&quot;Gabungkan 6-7 HP ROHIS&quot;</strong>.
                </div>
              </div>

              {/* Penyebab 2 */}
              <div className="bg-white border border-amber-200/80 rounded-xl p-3.5 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs shrink-0">
                    2
                  </div>
                  <h3 className="font-bold text-slate-900">Webhook Google Sheets Belum Dihubungkan</h3>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Aplikasi ini <strong>BUKAN versi uji coba/trial terkunci</strong>. Seluruh sistem pemindaian QR, ekspor JSON, dan penggabungan pos aktif 100% siap dipakai sholat. Keterangan simulasi hanya terjadi jika URL Webhook Apps Script pribadi milik Ibu Guru belum dipasang di pengaturan Spreadsheet.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-[11px] text-amber-900 font-medium">
                  👉 <strong>Solusi:</strong> Buka tab <strong>&quot;Panduan Google Apps Script&quot;</strong> di bawah, salin kode script, lalu tempel URL Web App ke tombol <strong>Konfigurasi Webhook</strong>.
                </div>
              </div>

              {/* Penyebab 3 */}
              <div className="bg-white border border-amber-200/80 rounded-xl p-3.5 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 font-bold flex items-center justify-center text-xs shrink-0">
                    3
                  </div>
                  <h3 className="font-bold text-slate-900">Link Sheets vs Link Apps Script</h3>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Banyak pengampu keliru memasukkan link lembar kerja <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">docs.google.com/spreadsheets/...</code>. Link tersebut tidak bisa menerima kiriman data otomatis dari aplikasi luar.
                </p>
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-[11px] text-rose-900 font-medium">
                  👉 <strong>Solusi:</strong> Link yang benar berawalan <code className="text-[10px] font-mono">script.google.com/macros/s/.../exec</code> yang didapat dari menu <strong>Deploy &gt; Web App</strong> di Apps Script.
                </div>
              </div>

              {/* Penyebab 4 */}
              <div className="bg-white border border-amber-200/80 rounded-xl p-3.5 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs shrink-0">
                    4
                  </div>
                  <h3 className="font-bold text-slate-900">Izin Deploy Apps Script Belum &quot;Anyone&quot;</h3>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Pada saat Deploy Web App di Google Apps Script, pengaturan akses:
                  <br />• <strong>Execute as:</strong> Me (email guru)
                  <br />• <strong>Who has access:</strong> <strong>Anyone (Siapa saja)</strong>
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-[11px] text-blue-900 font-medium">
                  👉 <strong>Solusi:</strong> Jika disetel ke &quot;Only myself&quot; atau dibatasi akun domain sekolah, Google akan memblokir kiriman data. Ubah ke &quot;Anyone&quot;.
                </div>
              </div>

              {/* Penyebab 5 */}
              <div className="bg-white border border-amber-200/80 rounded-xl p-3.5 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-xs shrink-0">
                    5
                  </div>
                  <h3 className="font-bold text-slate-900">Periksa Tab Sheet &quot;Data_Presensi_PAI&quot;</h3>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Script otomatis membuat tab sheet baru bernama <strong>&quot;Data_Presensi_PAI&quot;</strong> di bagian bawah Google Sheets sekolah.
                </p>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 text-[11px] text-purple-900 font-medium">
                  👉 <strong>Solusi:</strong> Periksa tab di pojok kiri bawah Google Sheets Anda. Data hari ini mungkin sudah masuk di tab tersebut, sementara Anda sedang membuka tab kosong &quot;Sheet1&quot;.
                </div>
              </div>

              {/* Solusi Instan 6 */}
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    ✓
                  </div>
                  <h3 className="font-bold text-emerald-950">Solusi Instan: Unduh CSV Hari Ini</h3>
                </div>
                <p className="text-emerald-900 text-[11px] leading-relaxed">
                  Tidak ada data yang hilang! Semua data presensi sholat hari ini tersimpan rapi di perangkat ini ({todayAttendance.length} siswa).
                </p>
                <button
                  type="button"
                  onClick={() => spreadsheetService.exportTodayAttendanceToCSV(attendanceRecords)}
                  className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh File CSV Hari Ini Sekarang</span>
                </button>
              </div>

            </div>

            <div className="pt-2 border-t border-amber-200/60 flex flex-wrap items-center justify-between text-[11px] text-amber-900 gap-2">
              <span className="font-medium">
                💡 Butuh bantuan mengatur script? Klik tab <strong>&quot;Panduan Google Apps Script (1 Menit)&quot;</strong> di bawah untuk menyalin kode siap pakai terbaru (versi 3.2 anti-duplikasi).
              </span>
              <button
                type="button"
                onClick={() => setActiveSheetTab('panduan')}
                className="font-bold text-emerald-800 underline hover:text-emerald-950 cursor-pointer"
              >
                Buka Panduan Script Sekarang &rarr;
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Interactive Sheet Selector Tabs */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="bg-slate-100 border-b border-slate-200 px-4 pt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSheetTab('presensi')}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition flex items-center gap-1.5 border-t border-l border-r ${
                activeSheetTab === 'presensi'
                  ? 'bg-white text-emerald-800 border-slate-300 shadow-xs'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Sheet: Data_Presensi_PAI ({attendanceRecords.length})</span>
            </button>

            <button
              onClick={() => setActiveSheetTab('kedisiplinan')}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition flex items-center gap-1.5 border-t border-l border-r ${
                activeSheetTab === 'kedisiplinan'
                  ? 'bg-white text-emerald-800 border-slate-300 shadow-xs'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-700" />
              <span>Sheet: Catatan_Kedisiplinan ({disciplineRecords.length})</span>
            </button>

            <button
              onClick={() => setActiveSheetTab('panduan')}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition flex items-center gap-1.5 border-t border-l border-r ${
                activeSheetTab === 'panduan'
                  ? 'bg-white text-emerald-800 border-slate-300 shadow-xs'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Panduan Google Apps Script (1 Menit)</span>
            </button>
          </div>

          <div className="pb-2 flex flex-wrap items-center gap-2">
            {activeSheetTab === 'presensi' && (
              <>
                <button
                  type="button"
                  onClick={() => setFilterTodayOnly(!filterTodayOnly)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded border flex items-center gap-1 transition cursor-pointer ${
                    filterTodayOnly
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
                  }`}
                  title="Filter tabel agar hanya menampilkan presensi hari ini"
                >
                  <Calendar className="w-3 h-3 text-emerald-600" />
                  <span>{filterTodayOnly ? `Hari Ini Saja (${todayAttendance.length})` : 'Semua Tanggal'}</span>
                </button>

                <button
                  onClick={() => spreadsheetService.exportTodayAttendanceToCSV(attendanceRecords)}
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded border border-emerald-800 flex items-center gap-1 transition cursor-pointer shadow-2xs"
                  title="Unduh presensi hari ini ke CSV/Excel"
                >
                  <Download className="w-3 h-3" />
                  <span>Unduh CSV Hari Ini</span>
                </button>

                <button
                  onClick={() => spreadsheetService.exportAttendanceToCSV(attendanceRecords)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded border border-slate-300 flex items-center gap-1 transition cursor-pointer"
                  title="Unduh seluruh riwayat presensi ke CSV"
                >
                  <Download className="w-3 h-3" />
                  <span>Unduh Semua</span>
                </button>
              </>
            )}

            {activeSheetTab === 'kedisiplinan' && (
              <button
                onClick={() => spreadsheetService.exportDisciplineToCSV(disciplineRecords)}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded border border-slate-300 flex items-center gap-1 transition cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Unduh CSV Disiplin</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Live Grid Presensi */}
        {activeSheetTab === 'presensi' && (
          <div>
            {filterTodayOnly && (
              <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 text-xs text-emerald-900 flex items-center justify-between">
                <span>
                  Menampilkan data presensi hari ini: <strong>{today}</strong> (Total <strong>{todayAttendance.length}</strong> siswa tercatat)
                </span>
                <button
                  type="button"
                  onClick={() => setFilterTodayOnly(false)}
                  className="text-emerald-700 underline font-bold hover:text-emerald-900 cursor-pointer"
                >
                  Tampilkan Semua Tanggal
                </button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0f766e] text-white font-bold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center bg-[#0d645e] border-r border-[#115e59]">#</th>
                    <th className="py-2.5 px-3 border-r border-[#115e59]">Timestamp / Waktu</th>
                    <th className="py-2.5 px-3 border-r border-[#115e59]">NISN</th>
                    <th className="py-2.5 px-3 border-r border-[#115e59]">Nama Siswa</th>
                    <th className="py-2.5 px-3 border-r border-[#115e59]">Kelas</th>
                    <th className="py-2.5 px-3 border-r border-[#115e59]">Kegiatan</th>
                    <th className="py-2.5 px-3 border-r border-[#115e59]">Status</th>
                    <th className="py-2.5 px-3 border-r border-[#115e59]">Metode</th>
                    <th className="py-2.5 px-3 border-r border-[#115e59]">Pos / Petugas</th>
                    <th className="py-2.5 px-3 border-r border-[#115e59]">Catatan / Materi</th>
                    <th className="py-2.5 px-3">Guru Pengampu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {displayedAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-500 font-sans">
                        {filterTodayOnly 
                          ? 'Belum ada presensi yang tercatat untuk hari ini. Silakan lakukan scan QR di menu Scan QR.'
                          : 'Belum ada riwayat presensi yang tercatat.'}
                      </td>
                    </tr>
                  ) : (
                    displayedAttendance.slice(0, 100).map((row, idx) => (
                      <tr key={row.id} className="hover:bg-emerald-50/50 transition">
                        <td className="py-2 px-3 text-center bg-slate-100 text-slate-500 font-bold border-r border-slate-200">{idx + 1}</td>
                        <td className="py-2 px-3 border-r border-slate-200 whitespace-nowrap">{row.date} {row.time}</td>
                        <td className="py-2 px-3 border-r border-slate-200 font-bold">{row.studentNisn}</td>
                        <td className="py-2 px-3 border-r border-slate-200 font-sans font-semibold text-slate-900">{row.studentName}</td>
                        <td className="py-2 px-3 border-r border-slate-200 text-emerald-800 font-bold">{row.className}</td>
                        <td className="py-2 px-3 border-r border-slate-200">{row.activity}</td>
                        <td className="py-2 px-3 border-r border-slate-200">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            row.status === 'Hadir' ? 'bg-emerald-100 text-emerald-800' :
                            row.status === 'Berhalangan' ? 'bg-pink-100 text-pink-800 border border-pink-300' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {row.status === 'Berhalangan' ? 'Berhalangan (Haid)' : row.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-[10px] text-slate-500">{row.method}</td>
                        <td className="py-2 px-3 border-r border-slate-200 text-[10px] text-slate-600">
                          {row.deviceStation || 'Pos Utama'} ({row.operatorName || 'Petugas'})
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 font-sans text-slate-700 max-w-xs truncate">{row.notes || '-'}</td>
                        <td className="py-2 px-3 font-sans text-slate-600">{row.teacher}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Live Grid Kedisiplinan */}
        {activeSheetTab === 'kedisiplinan' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#b91c1c] text-white font-bold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center bg-[#991b1b] border-r border-[#7f1d1d]">#</th>
                  <th className="py-2.5 px-3 border-r border-[#7f1d1d]">Tanggal &amp; Waktu</th>
                  <th className="py-2.5 px-3 border-r border-[#7f1d1d]">NISN</th>
                  <th className="py-2.5 px-3 border-r border-[#7f1d1d]">Nama Siswa</th>
                  <th className="py-2.5 px-3 border-r border-[#7f1d1d]">Kelas</th>
                  <th className="py-2.5 px-3 border-r border-[#7f1d1d]">Kategori</th>
                  <th className="py-2.5 px-3 border-r border-[#7f1d1d]">Poin</th>
                  <th className="py-2.5 px-3 border-r border-[#7f1d1d]">Uraian Pelanggaran</th>
                  <th className="py-2.5 px-3 border-r border-[#7f1d1d]">Tindak Lanjut Pembinaan</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {disciplineRecords.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-rose-50/50 transition">
                    <td className="py-2 px-3 text-center bg-slate-100 text-slate-500 font-bold border-r border-slate-200">{idx + 1}</td>
                    <td className="py-2 px-3 border-r border-slate-200 whitespace-nowrap">{row.date} {row.time}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-bold">{row.studentNisn}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-sans font-semibold text-slate-900">{row.studentName}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-bold text-amber-800">{row.className}</td>
                    <td className="py-2 px-3 border-r border-slate-200">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {row.category}
                      </span>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-bold text-rose-700">+{row.points}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-sans text-slate-800 max-w-xs">{row.violation}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-sans text-slate-600 text-[11px] max-w-xs">{row.followUp}</td>
                    <td className="py-2 px-3 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Panduan Setup Google Apps Script */}
        {activeSheetTab === 'panduan' && (
          <div className="p-6 space-y-4 max-w-4xl">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Cara Menghubungkan Google Spreadsheet Sekolah (Hanya 1 Menit)
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Ikuti 3 langkah mudah berikut agar data otomatis tersinkronisasi langsung ke Google Spreadsheet milik Ibu Ulfatul Husna, S.Ag.,M.Pd.:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="font-bold text-emerald-800">1. Buka Google Sheets</div>
                <p className="text-slate-600 text-[11px]">
                  Buka sheet baru di <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">sheets.new</a>, beri judul misal &quot;SIAP PAI SMAN 1 Krembung 2026-2027&quot;.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="font-bold text-emerald-800">2. Buka Apps Script &amp; Tempel Kode</div>
                <p className="text-slate-600 text-[11px]">
                  Klik menu <strong>Extensions (Ekstensi)</strong> &gt; <strong>Apps Script</strong>. Hapus isi bawaan dan tempel seluruh kode di bawah.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="font-bold text-emerald-800">3. Deploy sebagai Web App</div>
                <p className="text-slate-600 text-[11px]">
                  Klik <strong>Deploy (Terapkan)</strong> &gt; <strong>New Deployment</strong> &gt; Pilih &quot;Web App&quot;, <strong>Execute as:</strong> Me, <strong>Who has access:</strong> <strong className="text-rose-700">&quot;Anyone (Siapa saja)&quot;</strong>. Salin URL dan tempel di konfigurasi.
                </p>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">Kode Google Apps Script Versi 3.2 (Anti-Duplikasi &amp; Multi-Pos):</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded font-bold">VERSI TERBARU</span>
                </div>
                <button
                  onClick={handleCopyScript}
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Tersalin ke Clipboard!' : 'Salin Kode Script'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-900 text-emerald-300 font-mono text-[11px] rounded-xl overflow-x-auto max-h-72 border border-slate-800">
                {spreadsheetService.getAppsScriptTemplate()}
              </pre>
            </div>
          </div>
        )}
      </section>

      {/* Modal Konfigurasi Webhook */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-600" />
              <span>Pengaturan Integrasi Google Spreadsheet</span>
            </h3>

            <form onSubmit={handleSaveConfig} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  URL Webhook Google Apps Script (Web App URL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formConfig.webhookUrl}
                    onChange={(e) => setFormConfig({ ...formConfig, webhookUrl: e.target.value })}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-[11px] focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleTestWebhookInModal}
                    disabled={testingWebhook || !formConfig.webhookUrl}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg font-semibold text-[11px] shrink-0 cursor-pointer"
                  >
                    {testingWebhook ? 'Menguji...' : 'Tes URL'}
                  </button>
                </div>
                
                {testResult && (
                  <div className={`mt-2 p-2.5 rounded-lg text-[11px] flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>{testResult.message}</div>
                  </div>
                )}

                {formConfig.webhookUrl.includes('docs.google.com/spreadsheets') && (
                  <div className="mt-1.5 p-2 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[10px]">
                    ⚠️ PERHATIAN: Anda memasukkan link Google Sheets biasa (docs.google.com). Masukkan URL Web App Apps Script (script.google.com/macros/s/.../exec).
                  </div>
                )}

                <span className="text-[10px] text-slate-500 mt-1 block">
                  Dapatkan URL ini dari menu <strong>Deploy &gt; New Deployment &gt; Web App</strong> di Google Sheets Anda.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Spreadsheet ID</label>
                <input
                  type="text"
                  value={formConfig.spreadsheetId}
                  onChange={(e) => setFormConfig({ ...formConfig, spreadsheetId: e.target.value })}
                  placeholder="ID dari URL spreadsheet"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Sheet Presensi</label>
                  <input
                    type="text"
                    value={formConfig.sheetNamePresensi}
                    onChange={(e) => setFormConfig({ ...formConfig, sheetNamePresensi: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Sheet Disiplin</label>
                  <input
                    type="text"
                    value={formConfig.sheetNameDisiplin}
                    onChange={(e) => setFormConfig({ ...formConfig, sheetNameDisiplin: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="auto-sync-check"
                  checked={formConfig.autoSync}
                  onChange={(e) => setFormConfig({ ...formConfig, autoSync: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="auto-sync-check" className="font-semibold text-slate-700 cursor-pointer">
                  Sinkronisasi Otomatis Setiap Ada Presensi Baru
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 text-white rounded-lg font-semibold hover:bg-emerald-600 cursor-pointer"
                >
                  Simpan Konfigurasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
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
  AlertCircle
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
              Semua Data Terkirim ke Google Spreadsheet
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Setiap catatan presensi KBM, sholat dhuha, sholat berjama&apos;ah, istighotsah, khotmil Qur&apos;an, dan catatan kedisiplinan tersinkronisasi secara otomatis atau berkala ke lembar kerja Google Sheets sekolah.
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
              onClick={() => setShowConfigModal(true)}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Konfigurasi Webhook</span>
            </button>
          </div>
        </div>

        {/* Sync Status Bar */}
        <div className="mt-5 pt-4 border-t border-emerald-500/20 flex flex-wrap items-center justify-between text-xs text-emerald-200/90 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Status: Siap Terkirim ke Spreadsheet</span>
            </span>
            <span>·</span>
            <span>Total Baris Presensi: <strong className="text-white font-mono">{attendanceRecords.length}</strong></span>
            <span>·</span>
            <span>Total Catatan Disiplin: <strong className="text-white font-mono">{disciplineRecords.length}</strong></span>
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

      {/* Interactive Sheet Selector Tabs */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="bg-slate-100 border-b border-slate-200 px-4 pt-3 flex items-center justify-between">
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

          <div className="pb-2 hidden sm:flex items-center gap-2">
            {activeSheetTab === 'presensi' && (
              <button
                onClick={() => spreadsheetService.exportAttendanceToCSV(attendanceRecords)}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded border border-slate-300 flex items-center gap-1 transition cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Unduh CSV Presensi</span>
              </button>
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
                  <th className="py-2.5 px-3 border-r border-[#115e59]">Catatan / Materi</th>
                  <th className="py-2.5 px-3">Guru Pengampu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {attendanceRecords.slice(0, 30).map((row, idx) => (
                  <tr key={row.id} className="hover:bg-emerald-50/50 transition">
                    <td className="py-2 px-3 text-center bg-slate-100 text-slate-500 font-bold border-r border-slate-200">{idx + 1}</td>
                    <td className="py-2 px-3 border-r border-slate-200 whitespace-nowrap">{row.date} {row.time}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-bold">{row.studentNisn}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-sans font-semibold text-slate-900">{row.studentName}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-emerald-800 font-bold">{row.className}</td>
                    <td className="py-2 px-3 border-r border-slate-200">{row.activity}</td>
                    <td className="py-2 px-3 border-r border-slate-200">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        row.status === 'Hadir' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-[10px] text-slate-500">{row.method}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-sans text-slate-700 max-w-xs truncate">{row.notes || '-'}</td>
                    <td className="py-2 px-3 font-sans text-slate-600">{row.teacher}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                <div className="font-bold text-emerald-800">2. Buka Apps Script</div>
                <p className="text-slate-600 text-[11px]">
                  Klik menu <strong>Extensions (Ekstensi)</strong> &gt; <strong>Apps Script</strong>. Hapus isi bawaan dan tempel kode di bawah.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="font-bold text-emerald-800">3. Deploy sebagai Web App</div>
                <p className="text-slate-600 text-[11px]">
                  Klik <strong>Deploy (Terapkan)</strong> &gt; <strong>New Deployment</strong> &gt; Pilih &quot;Web App&quot;, akses: &quot;Anyone (Siapa saja)&quot;. Salin URL dan tempel di konfigurasi.
                </p>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Kode Google Apps Script Siap Pakai:</span>
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
                <input
                  type="url"
                  value={formConfig.webhookUrl}
                  onChange={(e) => setFormConfig({ ...formConfig, webhookUrl: e.target.value })}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-[11px] focus:bg-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Dapatkan URL ini dari menu Deploy Web App di Google Sheets Anda.
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

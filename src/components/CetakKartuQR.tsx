import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Printer, 
  Filter, 
  Search, 
  QrCode, 
  Download, 
  Check, 
  ShieldCheck, 
  Sparkles,
  Users,
  CheckSquare,
  Square,
  FileText,
  FileSpreadsheet,
  Eye,
  LayoutGrid
} from 'lucide-react';
import { Student, SCHOOL_CLASSES } from '../types';

interface CetakKartuQRProps {
  students: Student[];
  initialClass?: string;
}

const LOGO_SMANIKRE = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhjhEe7DsQaweQWtckuBY0QdRPB_J0RbHqfSXb0fFnNGOQYwfzbn9SyTV1WORteNpd7S3rcGj3FYpaCf0X7tjQpcXoDfErD-aWPD9kTf-6auJIoAZ3ETmXpvuoVydS7H87HO-vidqv4ECyayUG4dFJNZNMuVWD2lUyaMaF7ox5BYCfAksicgx7ryvy6V56Z/s1600/LOGO%20SMANIKRE%20(1).png";

export const CetakKartuQR: React.FC<CetakKartuQRProps> = ({ 
  students,
  initialClass = 'Semua Kelas'
}) => {
  const [selectedClass, setSelectedClass] = useState<string>(initialClass);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'a4-sheet'>('grid');

  // Update selected class when initialClass changes from navigation
  useEffect(() => {
    if (initialClass) {
      setSelectedClass(initialClass);
    }
  }, [initialClass]);

  // Filter students based on class & search
  const classFilteredStudents = students.filter((s) => {
    const matchClass = selectedClass === 'Semua Kelas' || s.className === selectedClass;
    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.includes(searchQuery) ||
      s.nis.includes(searchQuery);
    return matchClass && matchSearch;
  });

  // When classFilteredStudents changes, default select all
  useEffect(() => {
    setSelectedStudentIds(classFilteredStudents.map((s) => s.id));
  }, [selectedClass, searchQuery, students.length]);

  // Students that will actually be printed (checked)
  const studentsToPrint = classFilteredStudents.filter((s) => 
    selectedStudentIds.includes(s.id)
  );

  // Generate QR codes for the displayed students
  useEffect(() => {
    let isCancelled = false;
    setIsGenerating(true);

    const generateBatch = async () => {
      const newMap: Record<string, string> = { ...qrMap };
      const studentsToGenerate = classFilteredStudents.filter((s) => !newMap[s.id]);

      for (const std of studentsToGenerate) {
        if (isCancelled) return;
        try {
          const url = await QRCode.toDataURL(std.nisn, {
            width: 200,
            margin: 1,
            color: { dark: '#064e3b', light: '#ffffff' },
          });
          newMap[std.id] = url;
        } catch {
          // Ignore
        }
      }

      if (!isCancelled) {
        setQrMap(newMap);
        setIsGenerating(false);
      }
    };

    generateBatch();

    return () => {
      isCancelled = true;
    };
  }, [classFilteredStudents]);

  // Toggle selection
  const handleToggleSelectStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((sid) => sid !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === classFilteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(classFilteredStudents.map((s) => s.id));
    }
  };

  // Direct Browser Print
  const handlePrint = () => {
    window.print();
  };

  // Generate and Download Self-Contained Standalone HTML (Rock-solid, works anywhere without pop-up blocker)
  const handleDownloadStandaloneHtml = () => {
    const cardsHtml = studentsToPrint.map((std, idx) => {
      const qrUrl = qrMap[std.id] || '';
      return `
        <div class="print-card">
          <div class="card-header">
            <img src="${LOGO_SMANIKRE}" class="school-logo" alt="Logo SMANIKRE" />
            <div class="header-text">
              <div class="school-name">SMA NEGERI 1 KREMBUNG</div>
              <div class="card-title">KARTU PRESENSI DIGITAL PAI</div>
              <div class="school-year">Tahun Pelajaran 2026-2027</div>
            </div>
          </div>
          <div class="card-body">
            <div class="student-info">
              <div class="field-label">Nama Lengkap Siswa:</div>
              <div class="student-name">${std.name}</div>
              <div class="info-row">
                <div>
                  <span class="info-label">Kelas:</span>
                  <span class="info-val font-bold">${std.className}</span>
                </div>
                <div>
                  <span class="info-label">NISN:</span>
                  <span class="info-val font-mono">${std.nisn}</span>
                </div>
              </div>
              <div class="info-row" style="margin-top: 4px;">
                <div>
                  <span class="info-label">Gender:</span>
                  <span class="info-val">${std.gender === 'L' ? 'Laki-Laki (L)' : 'Perempuan (P)'}</span>
                </div>
                <div>
                  <span class="info-label">NIS:</span>
                  <span class="info-val font-mono">${std.nis}</span>
                </div>
              </div>
            </div>
            <div class="qr-container">
              <img src="${qrUrl}" class="qr-img" alt="QR" />
              <div class="qr-label">${std.nisn}</div>
            </div>
          </div>
          <div class="card-footer">
            <span>SIAP PAI · SMAN 1 KREMBUNG</span>
            <span class="teacher-sig">Ulfatul Husna, S.Ag.,M.Pd.</span>
          </div>
        </div>
      `;
    }).join('');

    const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Cetak Kartu QR PAI - Kelas ${selectedClass} (${studentsToPrint.length} Siswa)</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      margin: 0;
      padding: 12px;
      color: #0f172a;
      background: #f8fafc;
    }
    .print-control-bar {
      background: #064e3b;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .print-btn {
      background: #10b981;
      color: #042f2e;
      border: none;
      padding: 10px 22px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .print-btn:hover {
      background: #34d399;
    }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
      max-width: 100%;
    }
    .print-card {
      background: #ffffff;
      border: 2px dashed #065f46;
      border-radius: 12px;
      padding: 12px 14px;
      page-break-inside: avoid;
      break-inside: avoid;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      position: relative;
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1.5px solid #064e3b;
      padding-bottom: 8px;
    }
    .school-logo {
      width: 44px;
      height: 44px;
      object-fit: contain;
    }
    .header-text {
      flex: 1;
    }
    .school-name {
      font-size: 11px;
      font-weight: 800;
      color: #064e3b;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .card-title {
      font-size: 12px;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.2;
    }
    .school-year {
      font-size: 9px;
      color: #64748b;
    }
    .card-body {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      gap: 10px;
    }
    .student-info {
      flex: 1;
    }
    .field-label {
      font-size: 9px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
    }
    .student-name {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      margin: 2px 0 6px 0;
      line-height: 1.25;
    }
    .info-row {
      display: flex;
      gap: 14px;
      font-size: 11px;
    }
    .info-label {
      color: #64748b;
      margin-right: 4px;
    }
    .info-val {
      color: #0f172a;
    }
    .font-bold {
      font-weight: 800;
      color: #065f46;
    }
    .font-mono {
      font-family: monospace;
    }
    .qr-container {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 6px;
      text-align: center;
      flex-shrink: 0;
    }
    .qr-img {
      width: 82px;
      height: 82px;
      display: block;
    }
    .qr-label {
      font-size: 8px;
      font-family: monospace;
      color: #475569;
      margin-top: 3px;
      font-weight: 700;
    }
    .card-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #64748b;
    }
    .teacher-sig {
      font-weight: 700;
      color: #065f46;
    }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .print-control-bar {
        display: none !important;
      }
      .print-card {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="print-control-bar">
    <div>
      <div style="font-size: 16px; font-weight: 800;">SIAP CETAK: Kelas ${selectedClass} (${studentsToPrint.length} Siswa)</div>
      <div style="font-size: 11px; opacity: 0.9; margin-top: 2px;">SMA Negeri 1 Krembung · Pengampu: Ulfatul Husna, S.Ag.,M.Pd.</div>
    </div>
    <button class="print-btn" onclick="window.print()">
      🖨️ Cetak ke Printer / Simpan PDF (Ctrl + P)
    </button>
  </div>
  <div class="cards-grid">
    ${cardsHtml}
  </div>
  <script>
    // Optional auto prompt
    window.onload = function() {
      // ready
    };
  </script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cetak_Kartu_QR_PAI_Kelas_${selectedClass.replace(/\s+/g, '_')}_${studentsToPrint.length}_Siswa.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner and Active Controls */}
      <section className="bg-white border-2 border-emerald-500/80 rounded-xl p-5 shadow-xs no-print relative overflow-hidden">
        {/* Active Badge Marker */}
        <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-lg shadow-xs flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>STATUS MENU: AKTIF &amp; SIAP CETAK</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Menu Resmi Cetak Kartu Presensi Pelajar PAI</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <Printer className="w-6 h-6 text-emerald-700" />
              <span>Cetak QR Code Massal Peserta Didik</span>
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              SMA Negeri 1 Krembung · TP 2026-2027 · Pengampu: <strong className="text-slate-900 font-bold">Ulfatul Husna, S.Ag.,M.Pd.</strong>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Cetak Browser */}
            <button
              onClick={handlePrint}
              disabled={studentsToPrint.length === 0}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang ({studentsToPrint.length} Siswa)</span>
            </button>

            {/* Tombol Unduh Berkas Siap Cetak (HTML Standalone) */}
            <button
              onClick={handleDownloadStandaloneHtml}
              disabled={studentsToPrint.length === 0}
              title="Unduh dokumen siap cetak yang bisa dibuka di browser apa pun tanpa terblokir iframe"
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Unduh Berkas Siap Cetak (HTML)</span>
            </button>

            {/* Toggle View Mode */}
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'grid' ? 'a4-sheet' : 'grid')}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              {viewMode === 'grid' ? <LayoutGrid className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{viewMode === 'grid' ? 'Mode Kartu' : 'Mode Lembar A4'}</span>
            </button>
          </div>
        </div>

        {/* SECTION UTAMA: FILTER BERDASARKAN KELAS (SUPER JELAS & PROMINENT) */}
        <div className="mt-5 pt-4 border-t border-slate-200/80 space-y-3.5 bg-slate-50/80 -mx-5 -mb-5 p-5 rounded-b-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
              <Filter className="w-4 h-4 text-emerald-700" />
              <span>PILIH FILTER BERDASARKAN KELAS YANG INGIN DICETAK:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">
                Filter Aktif: <strong className="text-emerald-800 font-bold">{selectedClass}</strong>
              </span>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono font-bold">
                {classFilteredStudents.length} Siswa Terpilih
              </span>
            </div>
          </div>

          {/* Segmented Class Buttons: 8 Kelas yang Diampu */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedClass('Semua Kelas')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                selectedClass === 'Semua Kelas'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
            >
              <span>Semua Kelas yang Diampu</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                selectedClass === 'Semua Kelas' ? 'bg-emerald-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {students.length}
              </span>
            </button>

            {SCHOOL_CLASSES.map((cls) => {
              const count = students.filter((s) => s.className === cls).length;
              const isSelected = selectedClass === cls;
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setSelectedClass(cls)}
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-xs scale-102'
                      : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-300'
                  }`}
                >
                  <span>Kelas {cls}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-emerald-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Secondary Controls: Dropdown Selector & Search Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
            {/* Quick dropdown for mobile / accessibility */}
            <div className="sm:col-span-4 flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs shadow-2xs">
              <label htmlFor="select-class-dropdown" className="font-semibold text-slate-600 shrink-0">
                Pilih Kelas:
              </label>
              <select
                id="select-class-dropdown"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="Semua Kelas">Semua Kelas yang Diampu ({students.length} siswa)</option>
                {SCHOOL_CLASSES.map((cls) => {
                  const count = students.filter((s) => s.className === cls).length;
                  return (
                    <option key={cls} value={cls}>
                      Kelas {cls} ({count} siswa)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Search Student in Selected Class */}
            <div className="sm:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari siswa tertentu di kelas ini (Nama atau NISN)..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 shadow-2xs"
              />
            </div>

            {/* Select All / Checkbox Toggle */}
            <div className="sm:col-span-3 flex items-center justify-between sm:justify-end gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                {selectedStudentIds.length === classFilteredStudents.length ? (
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>Pilih Semua ({studentsToPrint.length}/{classFilteredStudents.length})</span>
              </button>
            </div>
          </div>

          {/* QR Status indicator */}
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
            <span className="flex items-center gap-1.5">
              <span>Status Generator:</span>
              {isGenerating ? (
                <span className="text-amber-600 font-semibold animate-pulse">Menyiapkan kode QR resolusi tinggi...</span>
              ) : (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Semua QR Code Siap Dicetak ke A4
                </span>
              )}
            </span>
            <span className="text-slate-400">
              Format Kartu: 8.5 x 5.5 cm (Dilengkapi Garis Potong)
            </span>
          </div>
        </div>
      </section>

      {/* Printable Cards Grid Preview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between no-print px-1">
          <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span>Pratinjau Lembar Kartu Presensi</span>
              <span className="text-emerald-800 font-mono">({studentsToPrint.length} Siswa - {selectedClass})</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Tampilan cetak dirancang presisi untuk kertas A4 (2 kolom). Klik &quot;Cetak Sekarang&quot; untuk langsung mengirim ke printer.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
            {Math.ceil(studentsToPrint.length / 6)} Halaman A4 (@ 6 kartu/halaman)
          </span>
        </div>

        {studentsToPrint.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 no-print">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada siswa yang dipilih pada filter kelas {selectedClass}</p>
            <p className="text-xs text-slate-400 mt-1">
              Silakan pilih kelas lain atau klik tombol &quot;Pilih Semua&quot; untuk mencentang seluruh siswa.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3.5 print-grid">
            {studentsToPrint.map((std, idx) => {
              const qrUrl = qrMap[std.id];
              const isChecked = selectedStudentIds.includes(std.id);
              return (
                <div
                  key={std.id}
                  className="bg-white border-2 border-dashed border-emerald-800/80 rounded-xl p-4 shadow-2xs flex flex-col justify-between text-slate-900 print-card-item relative overflow-hidden transition hover:shadow-md print:shadow-none print:border-solid print:border-emerald-900"
                >
                  {/* Decorative green accent line */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 no-print" />

                  {/* Top Lockup: Logo and School Header */}
                  <div className="flex items-center gap-3 pb-2.5 border-b border-emerald-800/20">
                    <img
                      src={LOGO_SMANIKRE}
                      alt="Logo SMANIKRE"
                      className="w-10 h-10 object-contain p-0.5 border border-emerald-200 rounded-full shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-extrabold text-emerald-900 tracking-wider uppercase truncate">
                        SMA NEGERI 1 KREMBUNG
                      </div>
                      <div className="text-xs font-extrabold text-slate-900 tracking-tight leading-tight">
                        KARTU PRESENSI DIGITAL PAI
                      </div>
                      <div className="text-[9px] text-slate-500">
                        Tahun Pelajaran 2026-2027
                      </div>
                    </div>

                    {/* Interactive Selection Checkbox in Preview */}
                    <div className="no-print flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleSelectStudent(std.id)}
                        title="Centang untuk menyertakan kartu ini saat dicetak"
                        className="p-1 hover:bg-slate-100 rounded cursor-pointer"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="py-3 flex items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0 pr-2">
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
                          Nama Peserta Didik
                        </div>
                        <div className="text-sm font-black text-slate-950 leading-snug truncate">
                          {std.name}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div>
                          <div className="text-[9px] uppercase text-slate-500 font-semibold">Kelas</div>
                          <div className="font-extrabold text-emerald-800 text-sm">
                            {std.className}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase text-slate-500 font-semibold">Jenis Kelamin</div>
                          <div className="font-semibold text-slate-700">
                            {std.gender === 'L' ? 'Laki-Laki (L)' : 'Perempuan (P)'}
                          </div>
                        </div>
                      </div>

                      <div className="pt-0.5 flex items-center gap-4">
                        <div>
                          <div className="text-[9px] uppercase text-slate-500 font-semibold">NISN</div>
                          <div className="font-mono font-bold text-slate-900 text-xs">
                            {std.nisn}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase text-slate-500 font-semibold">NIS</div>
                          <div className="font-mono text-slate-600 text-xs">
                            {std.nis}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* QR Code Container */}
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 shrink-0 text-center flex flex-col items-center">
                      {qrUrl ? (
                        <img
                          src={qrUrl}
                          alt={`QR ${std.nisn}`}
                          className="w-24 h-24 object-contain"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-slate-200 animate-pulse rounded flex items-center justify-center text-[10px] text-slate-400">
                          Memuat QR...
                        </div>
                      )}
                      <span className="text-[9px] font-mono font-extrabold text-slate-700 mt-1">
                        {std.nisn}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="font-medium text-emerald-950">SIAP PAI · SMANIKRE</span>
                    <span className="font-semibold text-emerald-800">Ulfatul Husna, S.Ag.,M.Pd.</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

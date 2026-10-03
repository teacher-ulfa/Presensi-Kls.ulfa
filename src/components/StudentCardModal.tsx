import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Student } from '../types';
import { X, Printer, ShieldCheck, Filter } from 'lucide-react';

interface StudentCardModalProps {
  student: Student | null;
  batchStudents?: Student[];
  taughtClasses?: string[];
  currentClassFilter?: string;
  onClassFilterChange?: (cls: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const LOGO_SMANIKRE = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhjhEe7DsQaweQWtckuBY0QdRPB_J0RbHqfSXb0fFnNGOQYwfzbn9SyTV1WORteNpd7S3rcGj3FYpaCf0X7tjQpcXoDfErD-aWPD9kTf-6auJIoAZ3ETmXpvuoVydS7H87HO-vidqv4ECyayUG4dFJNZNMuVWD2lUyaMaF7ox5BYCfAksicgx7ryvy6V56Z/s1600/LOGO%20SMANIKRE%20(1).png";

export const StudentCardModal: React.FC<StudentCardModalProps> = ({
  student,
  batchStudents,
  taughtClasses = ['X-1', 'X-2', 'X-3', 'X-4', 'XII-9', 'XII-10', 'XII-11', 'XII-12'],
  currentClassFilter = 'Semua Kelas',
  onClassFilterChange,
  isOpen,
  onClose,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [batchQrUrls, setBatchQrUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (student) {
      QRCode.toDataURL(student.nisn, {
        width: 200,
        margin: 1,
        color: { dark: '#064e3b', light: '#ffffff' },
      }).then(setQrDataUrl);
    }
  }, [student]);

  useEffect(() => {
    if (batchStudents && batchStudents.length > 0) {
      const generated: Record<string, string> = {};
      Promise.all(
        batchStudents.map((s) =>
          QRCode.toDataURL(s.nisn, {
            width: 150,
            margin: 1,
            color: { dark: '#064e3b', light: '#ffffff' },
          }).then((url) => {
            generated[s.id] = url;
          })
        )
      ).then(() => {
        setBatchQrUrls(generated);
      });
    }
  }, [batchStudents]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const isBatch = !!batchStudents && batchStudents.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2 text-sm font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {isBatch 
                ? `Cetak Kartu QR Code Massal Pelajar (${batchStudents.length} Siswa)` 
                : 'Kartu Presensi Pelajar Digital PAI SMANIKRE'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Kelas on Batch Print Modal */}
            {isBatch && onClassFilterChange && (
              <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
                <Filter className="w-3 h-3 text-slate-400" />
                <span className="text-slate-400">Kelas:</span>
                <select
                  value={currentClassFilter}
                  onChange={(e) => onClassFilterChange(e.target.value)}
                  className="bg-transparent font-semibold text-white focus:outline-none cursor-pointer text-xs"
                >
                  <option value="Semua Kelas" className="bg-slate-900 text-white">Semua Kelas yang Diampu</option>
                  {taughtClasses.map((cls) => (
                    <option key={cls} value={cls} className="bg-slate-900 text-white">
                      Kelas {cls}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Sekarang (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 bg-slate-100 max-h-[80vh] overflow-y-auto print:bg-white print:p-0 print:overflow-visible">
          {!isBatch && student && (
            <div className="max-w-md mx-auto bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 rounded-2xl p-6 text-white shadow-xl border border-emerald-500/30 relative overflow-hidden print:shadow-none print:border-slate-800">
              {/* Corner Watermark */}
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

              {/* Card Header with School Logo */}
              <div className="flex items-center gap-3 pb-4 border-b border-emerald-500/30">
                <img
                  src={LOGO_SMANIKRE}
                  alt="SMANIKRE"
                  className="w-12 h-12 object-contain bg-white rounded-full p-1 border border-emerald-400/40"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase">
                    SMA NEGERI 1 KREMBUNG
                  </div>
                  <div className="text-xs font-extrabold text-white">
                    KARTU PRESENSI DIGITAL PAI
                  </div>
                  <div className="text-[10px] text-slate-300">
                    Tahun Pelajaran 2026-2027
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="py-5 flex items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Nama Siswa</div>
                    <div className="text-base font-bold text-white leading-tight mt-0.5">{student.name}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-[10px] uppercase text-slate-400 font-semibold">NISN</div>
                      <div className="font-mono text-emerald-300 font-bold">{student.nisn}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400 font-semibold">Kelas</div>
                      <div className="font-bold text-white">{student.className}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase text-slate-400 font-semibold">NIS Sekolah</div>
                    <div className="font-mono text-slate-300 text-xs">{student.nis}</div>
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="bg-white p-2.5 rounded-xl shadow-md flex flex-col items-center shrink-0 border-2 border-emerald-400/40">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR Code" className="w-28 h-28 object-contain" />
                  ) : (
                    <div className="w-28 h-28 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                      Memuat QR...
                    </div>
                  )}
                  <span className="text-[9px] font-mono text-slate-600 mt-1 font-semibold">
                    {student.nisn}
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-emerald-500/20 flex items-center justify-between text-[10px] text-slate-400">
                <span>SIAP PAI · SMANIKRE</span>
                <span className="text-emerald-400 font-medium">Ulfatul Husna, S.Ag.,M.Pd.</span>
              </div>
            </div>
          )}

          {/* Batch Print View: Ready for A4 Grid Printing */}
          {isBatch && batchStudents && (
            <div className="space-y-4">
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between no-print">
                <span>
                  Menampilkan <strong className="text-slate-900 font-mono">{batchStudents.length} kartu</strong> untuk kelas <strong className="text-emerald-800">{currentClassFilter}</strong>.
                </span>
                <span className="text-[11px] text-slate-400">
                  Ukuran grid disesuaikan 4 kartu per baris A4.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4">
                {batchStudents.map((std) => (
                  <div
                    key={std.id}
                    className="bg-white border-2 border-emerald-800/70 rounded-xl p-3.5 shadow-xs flex items-center justify-between gap-3 text-slate-900 print:break-inside-avoid relative overflow-hidden"
                  >
                    {/* Top small green bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 to-teal-600" />

                    <div className="space-y-1 flex-1 pr-2">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-900 uppercase">
                        <img src={LOGO_SMANIKRE} alt="Logo" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                        <span>SMAN 1 KREMBUNG</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">
                        {std.name}
                      </div>
                      <div className="text-[10px] text-slate-600 flex items-center gap-1.5 font-mono">
                        <span className="font-bold text-emerald-800 font-sans">Kelas {std.className}</span>
                        <span>·</span>
                        <span>NISN: {std.nisn}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                        <span>SIAP PAI 2026-2027</span>
                        <span className="font-medium text-emerald-800 font-sans">Ulfatul Husna, S.Ag.,M.Pd.</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200 shrink-0 text-center">
                      {batchQrUrls[std.id] ? (
                        <img src={batchQrUrls[std.id]} alt="QR" className="w-16 h-16 object-contain mx-auto" />
                      ) : (
                        <div className="w-16 h-16 bg-slate-200 animate-pulse" />
                      )}
                      <div className="text-[8px] font-mono text-slate-500 mt-0.5">
                        {std.nisn}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 no-print">
          <span>Gunakan kertas tebal atau ID card untuk pemakaian harian peserta didik.</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Kartu QR ({isBatch ? batchStudents.length : 1})</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

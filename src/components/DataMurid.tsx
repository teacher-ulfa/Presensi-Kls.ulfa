import React, { useState, useRef } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  QrCode, 
  Edit3, 
  Trash2, 
  Download, 
  Printer, 
  Check, 
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  CheckCircle2,
  Copy
} from 'lucide-react';
import { Student, SCHOOL_CLASSES } from '../types';
import { StudentCardModal } from './StudentCardModal';

interface DataMuridProps {
  students: Student[];
  onAddStudent: (student: Student) => void;
  onBatchAddStudents: (newStudents: Student[], mode: 'append' | 'replace') => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onNavigateToPrintTab?: (className?: string) => void;
}

export const DataMurid: React.FC<DataMuridProps> = ({
  students,
  onAddStudent,
  onBatchAddStudents,
  onUpdateStudent,
  onDeleteStudent,
  onNavigateToPrintTab,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('Semua Kelas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Single Card modal
  const [selectedCardStudent, setSelectedCardStudent] = useState<Student | null>(null);
  const [isSingleCardModalOpen, setIsSingleCardModalOpen] = useState(false);

  // Batch QR Print modal
  const [isBatchPrintModalOpen, setIsBatchPrintModalOpen] = useState(false);
  const [batchPrintClass, setBatchPrintClass] = useState<string>('Semua Kelas');

  // Form Add / Edit Individual Student State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nis: '',
    nisn: '',
    name: '',
    gender: 'L' as 'L' | 'P',
    className: 'X-1',
    parentPhone: '',
  });

  // Bulk Upload Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkInputText, setBulkInputText] = useState('');
  const [bulkDefaultClass, setBulkDefaultClass] = useState('X-1');
  const [bulkMode, setBulkMode] = useState<'append' | 'replace'>('append');
  const [bulkParsedPreview, setBulkParsedPreview] = useState<Student[]>([]);
  const [bulkParseError, setBulkParseError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter students for table
  const filteredStudents = students.filter((s) => {
    const matchClass = selectedClass === 'Semua Kelas' || s.className === selectedClass;
    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.includes(searchQuery) ||
      s.nis.includes(searchQuery);
    return matchClass && matchSearch;
  });

  // Filter students for batch QR printing
  const batchStudentsToPrint = batchPrintClass === 'Semua Kelas'
    ? students
    : students.filter((s) => s.className === batchPrintClass);

  const handleOpenAdd = () => {
    setEditingStudentId(null);
    setFormData({
      nis: '',
      nisn: '',
      name: '',
      gender: 'L',
      className: selectedClass === 'Semua Kelas' ? 'X-1' : selectedClass,
      parentPhone: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudentId(student.id);
    setFormData({
      nis: student.nis,
      nisn: student.nisn,
      name: student.name,
      gender: student.gender,
      className: student.className,
      parentPhone: student.parentPhone || '',
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.nisn.trim()) return;

    if (editingStudentId) {
      onUpdateStudent({
        id: editingStudentId,
        nis: formData.nis,
        nisn: formData.nisn,
        name: formData.name,
        gender: formData.gender,
        className: formData.className,
        parentPhone: formData.parentPhone,
      });
    } else {
      const newStudent: Student = {
        id: `std-${Date.now()}`,
        nis: formData.nis || `${Math.floor(10000 + Math.random() * 90000)}`,
        nisn: formData.nisn,
        name: formData.name,
        gender: formData.gender,
        className: formData.className,
        parentPhone: formData.parentPhone,
      };
      onAddStudent(newStudent);
    }

    setIsFormOpen(false);
  };

  // --- Bulk Import Parsing Logic ---
  const parseBulkText = (text: string, defaultClass: string) => {
    setBulkParseError('');
    if (!text.trim()) {
      setBulkParsedPreview([]);
      return;
    }

    const lines = text.trim().split(/\r?\n/);
    const parsed: Student[] = [];

    lines.forEach((line, index) => {
      const cleanLine = line.trim();
      if (!cleanLine) return;

      // Skip header if line starts with NIS or No
      if (index === 0 && (cleanLine.toLowerCase().startsWith('nis') || cleanLine.toLowerCase().startsWith('no'))) {
        return;
      }

      // Support comma, semicolon, or tab separation
      let parts: string[] = [];
      if (cleanLine.includes('\t')) {
        parts = cleanLine.split('\t');
      } else if (cleanLine.includes(';')) {
        parts = cleanLine.split(';');
      } else {
        parts = cleanLine.split(',');
      }

      parts = parts.map(p => p.trim().replace(/^["']|["']$/g, ''));

      // Expected columns: NIS, NISN, Nama, Gender, Kelas, No HP
      // Or: NISN, Nama, Gender, Kelas
      // Or: Nama, NISN, Kelas
      let nis = '';
      let nisn = '';
      let name = '';
      let gender: 'L' | 'P' = 'L';
      let className = defaultClass;
      let parentPhone = '';

      if (parts.length >= 6) {
        nis = parts[0];
        nisn = parts[1];
        name = parts[2];
        gender = parts[3].toUpperCase().startsWith('P') ? 'P' : 'L';
        className = parts[4] || defaultClass;
        parentPhone = parts[5];
      } else if (parts.length === 5) {
        nis = parts[0];
        nisn = parts[1];
        name = parts[2];
        gender = parts[3].toUpperCase().startsWith('P') ? 'P' : 'L';
        className = parts[4] || defaultClass;
      } else if (parts.length === 4) {
        nis = `${Math.floor(10000 + Math.random() * 90000)}`;
        nisn = parts[0];
        name = parts[1];
        gender = parts[2].toUpperCase().startsWith('P') ? 'P' : 'L';
        className = parts[3] || defaultClass;
      } else if (parts.length >= 2) {
        nis = `${Math.floor(10000 + Math.random() * 90000)}`;
        nisn = parts[0];
        name = parts[1];
        className = parts[2] || defaultClass;
      }

      if (name && nisn) {
        parsed.push({
          id: `std-import-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
          nis: nis || `${Math.floor(10000 + Math.random() * 90000)}`,
          nisn,
          name,
          gender,
          className,
          parentPhone,
        });
      }
    });

    if (parsed.length === 0) {
      setBulkParseError('Tidak ada baris data valid yang terdeteksi. Pastikan format mengandung minimal NISN dan Nama Siswa.');
    }
    setBulkParsedPreview(parsed);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setBulkInputText(val);
    parseBulkText(val, bulkDefaultClass);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setBulkInputText(content);
      parseBulkText(content, bulkDefaultClass);
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const templateContent = [
      'NIS,NISN,Nama Lengkap,Jenis Kelamin (L/P),Kelas,No HP Wali',
      '12401,0098273611,Ahmad Fauzan Al-Ghifari,L,X-1,081234567801',
      '12402,0098273612,Aisyah Putri Azzahra,P,X-1,081234567802',
      '12421,0098311201,Aditya Dimas Nugraha,L,X-2,081234567821',
      '12441,0098422301,Alvaro Rizky Pratama,L,X-3,081234567841',
      '12461,0098533401,Bayu Senoaji Perkasa,L,X-4,081234567861',
      '12091,0077112091,Bima Yudhistira Putra,L,XII-9,081234567901',
      '12101,0077223101,Dimas Rangga Wicaksana,L,XII-10,081234567921',
      '12111,0077334111,Muhammad Zaidan Ilham,L,XII-11,081234567941',
      '12121,0077445121,Alif Syahputra Pratama,L,XII-12,081234567961',
    ].join('\r\n');

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Template_Data_Siswa_SMANIKRE_SIAP_PAI.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExecuteBulkImport = () => {
    if (bulkParsedPreview.length === 0) return;
    onBatchAddStudents(bulkParsedPreview, bulkMode);
    setIsBulkModalOpen(false);
    setBulkInputText('');
    setBulkParsedPreview([]);
  };

  const handleViewSingleCard = (student: Student) => {
    setSelectedCardStudent(student);
    setIsSingleCardModalOpen(true);
  };

  const handleOpenBatchPrintModal = () => {
    if (onNavigateToPrintTab) {
      onNavigateToPrintTab(selectedClass);
    } else {
      setBatchPrintClass(selectedClass);
      setIsBatchPrintModalOpen(true);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600" />
              <span>Data Murid SMAN 1 Krembung</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Kelas yang diampu: <strong className="text-emerald-800">X-1, X-2, X-3, X-4</strong> dan <strong className="text-teal-800">XII-9, XII-10, XII-11, XII-12</strong> · TP 2026-2027
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Input Murid Massal (Unggah Data) */}
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-sky-700" />
              <span>Unggah Data Massal (Import)</span>
            </button>

            {/* Tombol Cetak QR Code Massal */}
            <button
              onClick={handleOpenBatchPrintModal}
              disabled={filteredStudents.length === 0}
              className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              title={`Buka menu cetak kartu QR dengan filter: ${selectedClass}`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak QR Code ({selectedClass === 'Semua Kelas' ? 'Semua Kelas' : `Kelas ${selectedClass}`})</span>
            </button>

            {/* Tambah Siswa Baru Individu */}
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Siswa Baru</span>
            </button>
          </div>
        </div>

        {/* Search and Class Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan Nama, NISN, atau NIS..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          <div className="sm:col-span-4 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <label htmlFor="student-class-filter" className="text-slate-500 font-medium">Filter Kelas:</label>
            <select
              id="student-class-filter"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="Semua Kelas">Semua Kelas yang Diampu ({students.length})</option>
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

          <div className="sm:col-span-3 flex items-center justify-end text-xs text-slate-500">
            Ditemukan: <strong className="font-mono text-slate-900 ml-1">{filteredStudents.length} Siswa</strong>
          </div>
        </div>
      </section>

      {/* MODAL INPUT MURID SECARA MASSAL (UNGGAH DATA) */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-fadeIn my-6">
            
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Upload className="w-4 h-4 text-sky-400" />
                <span>Unggah Data Murid Secara Massal (Bulk Import)</span>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-700">
              
              {/* Petunjuk & Download Template */}
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sky-900">Format Data Unggah Massal</h4>
                  <p className="text-[11px] text-sky-700 mt-0.5">
                    Format kolom yang didukung: <code className="bg-white px-1.5 py-0.5 rounded font-mono text-sky-900">NIS, NISN, Nama Lengkap, L/P, Kelas, No HP</code> atau salin langsung dari Excel.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 bg-white hover:bg-sky-100 text-sky-800 border border-sky-300 font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-sky-600" />
                  <span>Unduh Template CSV</span>
                </button>
              </div>

              {/* Upload File Input & Textarea */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* File Upload Zone */}
                <div>
                  <label className="block font-semibold text-slate-800 mb-1.5">
                    Opsi 1: Unggah Berkas File (.csv / .txt)
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-xl p-5 text-center cursor-pointer bg-slate-50 hover:bg-sky-50/50 transition flex flex-col items-center justify-center h-36"
                  >
                    <FileSpreadsheet className="w-8 h-8 text-sky-600 mb-1.5" />
                    <span className="font-bold text-slate-800">Klik untuk Pilih Berkas CSV</span>
                    <span className="text-[11px] text-slate-500 mt-0.5">atau drag &amp; drop file ke sini</span>
                  </div>
                </div>

                {/* Default Class & Mode Config */}
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Kelas Default (Bila kolom kelas kosong):
                    </label>
                    <select
                      value={bulkDefaultClass}
                      onChange={(e) => {
                        setBulkDefaultClass(e.target.value);
                        parseBulkText(bulkInputText, e.target.value);
                      }}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:outline-none focus:border-sky-500"
                    >
                      {SCHOOL_CLASSES.map((cls) => (
                        <option key={cls} value={cls}>Kelas {cls}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Mode Penyimpanan:
                    </label>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="radio"
                          name="bulkMode"
                          checked={bulkMode === 'append'}
                          onChange={() => setBulkMode('append')}
                          className="text-sky-600"
                        />
                        <span>Tambahkan ke daftar siswa yang ada (Append)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-rose-700">
                        <input
                          type="radio"
                          name="bulkMode"
                          checked={bulkMode === 'replace'}
                          onChange={() => setBulkMode('replace')}
                          className="text-rose-600"
                        />
                        <span>Ganti seluruh data siswa saat ini (Replace all)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Paste Textarea */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Opsi 2: Salin dan Tempel (Paste) Teks dari Excel / Sheets
                </label>
                <textarea
                  rows={4}
                  value={bulkInputText}
                  onChange={handleTextChange}
                  placeholder={`Contoh baris:\n12401,0098273611,Ahmad Fauzan Al-Ghifari,L,X-1,081234567801\n12091,0077112091,Bima Yudhistira Putra,L,XII-9,081234567901`}
                  className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Parsed Preview Table */}
              {bulkParseError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{bulkParseError}</span>
                </div>
              )}

              {bulkParsedPreview.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between font-semibold">
                    <span className="text-slate-800">Pratinjau Data Valid ({bulkParsedPreview.length} Siswa Terdeteksi)</span>
                    <span className="text-emerald-700 text-[11px] flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Siap Diimpor
                    </span>
                  </div>

                  <div className="max-h-40 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                        <tr>
                          <th className="py-1.5 px-3">No</th>
                          <th className="py-1.5 px-3">NIS</th>
                          <th className="py-1.5 px-3">NISN</th>
                          <th className="py-1.5 px-3">Nama</th>
                          <th className="py-1.5 px-3">L/P</th>
                          <th className="py-1.5 px-3">Kelas</th>
                          <th className="py-1.5 px-3">No HP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {bulkParsedPreview.slice(0, 10).map((s, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-1 px-3 text-slate-400">{i + 1}</td>
                            <td className="py-1 px-3">{s.nis}</td>
                            <td className="py-1 px-3 font-bold text-slate-800">{s.nisn}</td>
                            <td className="py-1 px-3 font-sans font-semibold text-slate-900">{s.name}</td>
                            <td className="py-1 px-3">{s.gender}</td>
                            <td className="py-1 px-3 text-emerald-800 font-bold">{s.className}</td>
                            <td className="py-1 px-3 text-slate-500">{s.parentPhone || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {bulkParsedPreview.length > 10 && (
                    <div className="p-2 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-500">
                      ...dan {bulkParsedPreview.length - 10} siswa lainnya.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Total siap masuk: <strong className="font-mono text-slate-900">{bulkParsedPreview.length} Siswa</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBulkImport}
                  disabled={bulkParsedPreview.length === 0}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Impor Sekarang ({bulkParsedPreview.length} Siswa)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL CETAK QR CODE MASSAL */}
      {isBatchPrintModalOpen && (
        <StudentCardModal
          isOpen={isBatchPrintModalOpen}
          onClose={() => setIsBatchPrintModalOpen(false)}
          student={null}
          batchStudents={batchStudentsToPrint}
          taughtClasses={SCHOOL_CLASSES}
          currentClassFilter={batchPrintClass}
          onClassFilterChange={(cls) => setBatchPrintClass(cls)}
        />
      )}

      {/* Individual Student Card Modal */}
      {isSingleCardModalOpen && (
        <StudentCardModal
          isOpen={isSingleCardModalOpen}
          onClose={() => setIsSingleCardModalOpen(false)}
          student={selectedCardStudent}
          taughtClasses={SCHOOL_CLASSES}
        />
      )}

      {/* Form Add / Edit Individual Student Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingStudentId ? 'Edit Data Siswa SMANIKRE' : 'Tambah Siswa Baru SMAN 1 Krembung'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Siswa *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Muhammad Rayhan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NISN (10 Digit) *</label>
                  <input
                    type="text"
                    required
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    placeholder="Contoh: 0098273611"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIS Sekolah</label>
                  <input
                    type="text"
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    placeholder="Contoh: 12401"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelas yang Diampu *</label>
                  <select
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:bg-white focus:outline-none focus:border-sky-500"
                  >
                    {SCHOOL_CLASSES.map((cls) => (
                      <option key={cls} value={cls}>Kelas {cls}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="L">Laki-Laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp / HP Wali Murid</label>
                <input
                  type="text"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  placeholder="Contoh: 081234567801"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Simpan Data Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student List Table */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>Daftar Peserta Didik</span>
            <span className="text-slate-400 font-normal">({selectedClass})</span>
          </div>
          <span className="text-xs text-slate-500">
            Total Ditampilkan: <strong className="font-mono text-slate-800">{filteredStudents.length}</strong>
          </span>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada siswa yang sesuai kriteria pencarian</p>
            <p className="text-xs text-slate-400 mt-1">Coba gunakan tombol &quot;Unggah Data Massal&quot; untuk mengimpor data kelas ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 w-28">NIS</th>
                  <th className="py-3 px-4 w-32">NISN</th>
                  <th className="py-3 px-4 min-w-[200px]">Nama Lengkap</th>
                  <th className="py-3 px-4 w-16 text-center">L/P</th>
                  <th className="py-3 px-4 w-24">Kelas</th>
                  <th className="py-3 px-4 w-36">Kontak Wali</th>
                  <th className="py-3 px-4 text-center w-36">Aksi &amp; Kartu QR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStudents.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{student.nis}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{student.nisn}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{student.name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        student.gender === 'L' ? 'bg-sky-50 text-sky-700' : 'bg-pink-50 text-pink-700'
                      }`}>
                        {student.gender}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {student.className}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                      {student.parentPhone || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleViewSingleCard(student)}
                          title="Lihat & Cetak Kartu QR Presensi Siswa"
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded border border-emerald-200 transition cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(student)}
                          title="Edit Data Siswa"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus data siswa ${student.name}?`)) {
                              onDeleteStudent(student.id);
                            }
                          }}
                          title="Hapus Siswa"
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded border border-rose-200 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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

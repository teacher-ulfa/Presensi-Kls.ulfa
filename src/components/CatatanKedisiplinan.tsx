import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Filter, 
  Plus, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  UserX, 
  Trash2, 
  Edit3, 
  ShieldAlert, 
  FileSpreadsheet, 
  BookHeart,
  X,
  Users,
  CheckSquare,
  Square,
  Sparkles
} from 'lucide-react';
import { 
  DisciplineRecord, 
  DisciplineCategory, 
  Student, 
  SCHOOL_CLASSES 
} from '../types';
import { spreadsheetService } from '../services/spreadsheetService';

interface CatatanKedisiplinanProps {
  disciplineRecords: DisciplineRecord[];
  students: Student[];
  onAddRecord: (record: DisciplineRecord) => void;
  onBatchAddRecords?: (records: DisciplineRecord[]) => void;
  onUpdateRecord: (record: DisciplineRecord) => void;
  onDeleteRecord: (id: string) => void;
  onSyncSpreadsheet: () => void;
  isSyncing: boolean;
}

export const CatatanKedisiplinan: React.FC<CatatanKedisiplinanProps> = ({
  disciplineRecords,
  students,
  onAddRecord,
  onBatchAddRecords,
  onUpdateRecord,
  onDeleteRecord,
  onSyncSpreadsheet,
  isSyncing,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('Semua Kelas');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form input states
  const [formTargetClass, setFormTargetClass] = useState<string>('X-1');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [formCategory, setFormCategory] = useState<DisciplineCategory>('Ringan');
  const [formPoints, setFormPoints] = useState<number>(5);
  const [formViolation, setFormViolation] = useState('');
  const [formDate, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [formTime, setTime] = useState(new Date().toLocaleTimeString('id-ID', { hour12: false }));
  const [formFollowUp, setFormFollowUp] = useState('Bimbingan penguatan kesadaran ibadah (Deep Learning) dan komitmen perbaikan sikap.');
  const [formStatus, setFormStatus] = useState<'Dalam Pembinaan' | 'Terbina / Selesai'>('Dalam Pembinaan');

  // Filter records in main table
  const filteredRecords = disciplineRecords.filter((rec) => {
    const matchClass = selectedClass === 'Semua Kelas' || rec.className === selectedClass;
    const matchCategory = selectedCategory === 'Semua' || rec.category === selectedCategory;
    return matchClass && matchCategory;
  });

  // Students in form target class
  const classStudentsForForm = students.filter((s) => s.className === formTargetClass);

  const handleCategoryChange = (cat: DisciplineCategory) => {
    setFormCategory(cat);
    if (cat === 'Ringan') {
      setFormPoints(5);
      setFormViolation('Lupa membawa perlengkapan sholat (mukena/sarung)');
    } else if (cat === 'Sedang') {
      setFormPoints(15);
      setFormViolation('Tidak hadir dalam Sholat Berjama\'ah tanpa uzur syar\'i yang sah');
    } else if (cat === 'Berat') {
      setFormPoints(30);
      setFormViolation('Membolos pada jam KBM PAI atau Istighotsah');
    }
  };

  const handleToggleStudentSelection = (studentId: string) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(selectedStudentIds.filter((id) => id !== studentId));
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
    }
  };

  const handleSelectAllClassStudents = () => {
    if (selectedStudentIds.length === classStudentsForForm.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(classStudentsForForm.map((s) => s.id));
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0 || !formViolation.trim()) return;

    const chosenStudents = students.filter((s) => selectedStudentIds.includes(s.id));
    const newRecords: DisciplineRecord[] = chosenStudents.map((std, idx) => ({
      id: `disc-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
      studentId: std.id,
      studentNisn: std.nisn,
      studentName: std.name,
      className: std.className,
      category: formCategory,
      points: Number(formPoints),
      violation: formViolation,
      date: formDate,
      time: formTime,
      followUp: formFollowUp,
      teacher: 'Ulfatul Husna, S.Ag.,M.Pd.',
      status: formStatus,
      syncedToSpreadsheet: true,
    }));

    if (onBatchAddRecords) {
      onBatchAddRecords(newRecords);
    } else {
      newRecords.forEach((r) => onAddRecord(r));
    }

    setIsFormOpen(false);
    setSelectedStudentIds([]);

    setTimeout(() => {
      onSyncSpreadsheet();
    }, 400);
  };

  const handleToggleStatus = (record: DisciplineRecord) => {
    const updatedStatus: 'Dalam Pembinaan' | 'Terbina / Selesai' = 
      record.status === 'Dalam Pembinaan' ? 'Terbina / Selesai' : 'Dalam Pembinaan';
    onUpdateRecord({
      ...record,
      status: updatedStatus,
    });
  };

  const handleMarkAllTerbina = () => {
    if (filteredRecords.length === 0) return;
    if (window.confirm(`Tandai semua ${filteredRecords.length} catatan kedisiplinan ini sebagai 'Terbina / Selesai'?`)) {
      filteredRecords.forEach((r) => {
        if (r.status === 'Dalam Pembinaan') {
          onUpdateRecord({ ...r, status: 'Terbina / Selesai' });
        }
      });
    }
  };

  const handleExportCSV = () => {
    spreadsheetService.exportDisciplineToCSV(filteredRecords);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Actions */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Catatan Kedisiplinan &amp; Pembinaan Budi Pekerti</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Kelas yang diampu: <strong className="text-emerald-800">X-1, X-2, X-3, X-4</strong> &amp; <strong className="text-teal-800">XII-9, XII-10, XII-11, XII-12</strong> · Kategori Ringan, Sedang, Berat
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleMarkAllTerbina}
              disabled={filteredRecords.length === 0}
              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tandai Semua Terbina</span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={filteredRecords.length === 0}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekspor CSV Kedisiplinan</span>
            </button>
            <button
              onClick={() => {
                setSelectedStudentIds([]);
                setIsFormOpen(true);
              }}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Input Catatan Kedisiplinan (Satu / Banyak Siswa)</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-5 pt-4 border-t border-slate-100">
          {/* Filter Berdasarkan Kelas */}
          <div className="sm:col-span-5 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <label htmlFor="discipline-class-filter" className="text-slate-500 font-medium">Filter Kelas:</label>
            <select
              id="discipline-class-filter"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="Semua Kelas">Semua Kelas yang Diampu ({disciplineRecords.length} Catatan)</option>
              {SCHOOL_CLASSES.map((cls) => {
                const count = disciplineRecords.filter((d) => d.className === cls).length;
                return (
                  <option key={cls} value={cls}>
                    Kelas {cls} ({count} kasus)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Filter Kategori: Ringan, Sedang, Berat */}
          <div className="sm:col-span-4 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
            <label htmlFor="discipline-category-filter" className="text-slate-500 font-medium">Kategori:</label>
            <select
              id="discipline-category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="Ringan">Ringan (5 Poin)</option>
              <option value="Sedang">Sedang (15 Poin)</option>
              <option value="Berat">Berat (30 Poin)</option>
            </select>
          </div>

          <div className="sm:col-span-3 flex items-center justify-end text-xs text-slate-500">
            Total Kasus: <strong className="font-mono text-slate-900 ml-1">{filteredRecords.length}</strong>
          </div>
        </div>
      </section>

      {/* FORM INPUT CATATAN KEDISIPLINAN (MENDUKUNG SATU SISWA MAUPUN BANYAK/SEMUA SISWA SEKALIGUS) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-fadeIn my-6">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>Input Catatan Kedisiplinan PAI &amp; Budi Pekerti</span>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              
              {/* Target Class Filter */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <span className="font-bold text-slate-800">1. Filter Kelas Target:</span>
                    <select
                      value={formTargetClass}
                      onChange={(e) => {
                        setFormTargetClass(e.target.value);
                        setSelectedStudentIds([]);
                      }}
                      className="p-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {SCHOOL_CLASSES.map((cls) => (
                        <option key={cls} value={cls}>Kelas {cls}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tombol Pilih Semua Siswa Kelas Ini */}
                  <button
                    type="button"
                    onClick={handleSelectAllClassStudents}
                    className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1.5 cursor-pointer bg-amber-50 px-2.5 py-1 rounded border border-amber-200"
                  >
                    {selectedStudentIds.length === classStudentsForForm.length && classStudentsForForm.length > 0 ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
                        <span>Batalkan Pilih Semua</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-3.5 h-3.5 text-amber-600" />
                        <span>Pilih Semua Siswa Kelas {formTargetClass} ({classStudentsForForm.length})</span>
                      </>
                    )}
                  </button>
                </div>

                {/* List Siswa di Kelas Ini dengan Checkbox */}
                <div>
                  <div className="text-[11px] text-slate-500 mb-1.5 font-medium">
                    Centang siswa yang melakukan pelanggaran (Terpilih: <strong className="text-amber-700 font-bold">{selectedStudentIds.length} Siswa</strong>):
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1 bg-white border border-slate-200 rounded-lg">
                    {classStudentsForForm.length === 0 ? (
                      <div className="col-span-2 text-center py-4 text-slate-400">
                        Tidak ada siswa di kelas {formTargetClass}.
                      </div>
                    ) : (
                      classStudentsForForm.map((std) => {
                        const isSelected = selectedStudentIds.includes(std.id);
                        return (
                          <label
                            key={std.id}
                            className={`flex items-center gap-2 p-1.5 rounded border transition cursor-pointer text-[11px] ${
                              isSelected 
                                ? 'bg-amber-50 border-amber-300 font-bold text-amber-950' 
                                : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleStudentSelection(std.id)}
                              className="rounded text-amber-600 focus:ring-amber-500"
                            />
                            <div className="truncate flex-1">
                              <div>{std.name}</div>
                              <div className="text-[9px] text-slate-400 font-mono">NISN: {std.nisn}</div>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Kategori Pelanggaran: Ringan, Sedang, Berat */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(['Ringan', 'Sedang', 'Berat'] as DisciplineCategory[]).map((cat) => {
                  const isCatSelected = formCategory === cat;
                  let borderActive = 'border-amber-500 bg-amber-50/80 text-amber-950';
                  let pts = 5;
                  if (cat === 'Sedang') {
                    borderActive = 'border-orange-500 bg-orange-50/80 text-orange-950';
                    pts = 15;
                  }
                  if (cat === 'Berat') {
                    borderActive = 'border-rose-500 bg-rose-50/80 text-rose-950';
                    pts = 30;
                  }

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        isCatSelected ? `${borderActive} shadow-xs font-bold ring-1 ring-amber-400` : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center justify-between">
                        <span>Kategori {cat}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/80 border">
                          +{pts} Poin
                        </span>
                      </div>
                      <div className="text-[10px] mt-1 text-slate-500 font-normal">
                        {cat === 'Ringan' && 'Perlengkapan, keterlambatan < 10m'}
                        {cat === 'Sedang' && 'Absen sholat jamaah, gaduh masjid'}
                        {cat === 'Berat' && 'Membolos KBM/Istighotsah, adab'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Uraian Pelanggaran & Poin */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800">Uraian Kejadian / Bentuk Pelanggaran *</label>
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="text-slate-500">Bobot Poin:</span>
                    <input
                      type="number"
                      value={formPoints}
                      onChange={(e) => setFormPoints(Number(e.target.value))}
                      className="w-16 p-1 border border-slate-300 rounded font-bold text-center"
                    />
                  </div>
                </div>

                <textarea
                  rows={2}
                  required
                  value={formViolation}
                  onChange={(e) => setFormViolation(e.target.value)}
                  placeholder="Deskripsikan bentuk pelanggaran tata tertib/adab..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-amber-500"
                />

                {/* Quick Preset Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-400 py-0.5">Preset:</span>
                  {[
                    'Lupa bawa mukena/sarung',
                    'Terlambat sholat berjamaah',
                    'Tidak hadir sholat berjamaah tanpa uzur',
                    'Mengantuk/gaduh saat materi PAI',
                    'Tidak membawa Al-Qur\'an saat Khotmil Qur\'an',
                    'Membolos jam KBM PAI/Istighotsah'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormViolation(preset)}
                      className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 transition cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tanggal & Waktu */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Waktu (WIB)</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Tindak Lanjut Deep Learning & Budi Pekerti */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tindak Lanjut &amp; Bimbingan Budi Pekerti (Ulfatul Husna, S.Ag.,M.Pd.) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formFollowUp}
                  onChange={(e) => setFormFollowUp(e.target.value)}
                  placeholder="Restitusi karakter, bimbingan rohani/tahsin, motivasi kedisiplinan..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Status Pembinaan */}
              <div className="flex items-center gap-3">
                <label className="font-semibold text-slate-700">Status Pembinaan:</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="formStatus"
                      checked={formStatus === 'Dalam Pembinaan'}
                      onChange={() => setFormStatus('Dalam Pembinaan')}
                    />
                    <span>Dalam Pembinaan</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-emerald-700 font-semibold">
                    <input
                      type="radio"
                      name="formStatus"
                      checked={formStatus === 'Terbina / Selesai'}
                      onChange={() => setFormStatus('Terbina / Selesai')}
                    />
                    <span>Terbina / Selesai</span>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {selectedStudentIds.length === 0 ? (
                    <span className="text-rose-600 font-semibold">Pilih minimal 1 siswa di atas.</span>
                  ) : (
                    <span>Akan dicatat untuk <strong>{selectedStudentIds.length} Siswa</strong></span>
                  )}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={selectedStudentIds.length === 0}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Simpan Catatan ({selectedStudentIds.length} Siswa)</span>
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Discipline Records Table */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>Daftar Pelanggaran &amp; Pembinaan Karakter</span>
            <span className="text-slate-400 font-normal">({selectedClass} · {selectedCategory})</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Pembina: <strong className="text-slate-800">Ulfatul Husna, S.Ag.,M.Pd.</strong>
          </span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <BookHeart className="w-10 h-10 mx-auto text-emerald-500/50 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Alhamdulillah, tidak ada catatan kedisiplinan pada filter ini</p>
            <p className="text-xs text-slate-400 mt-1">Seluruh siswa tertib dan aktif mengikuti pembiasaan budi pekerti.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 w-28">Tanggal</th>
                  <th className="py-3 px-4 min-w-[180px]">Nama Siswa &amp; Kelas</th>
                  <th className="py-3 px-4 w-28 text-center">Kategori</th>
                  <th className="py-3 px-4 w-20 text-center">Poin</th>
                  <th className="py-3 px-4 min-w-[220px]">Uraian Pelanggaran</th>
                  <th className="py-3 px-4 min-w-[220px]">Tindak Lanjut Guru PAI</th>
                  <th className="py-3 px-4 w-32 text-center">Status</th>
                  <th className="py-3 px-4 text-center w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRecords.map((record, idx) => {
                  let badgeCategoryColor = 'bg-amber-100 text-amber-800 border-amber-200';
                  if (record.category === 'Sedang') badgeCategoryColor = 'bg-orange-100 text-orange-800 border-orange-200';
                  if (record.category === 'Berat') badgeCategoryColor = 'bg-rose-100 text-rose-800 border-rose-200';

                  return (
                    <tr key={record.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        <div>{record.date}</div>
                        <div className="text-[10px] text-slate-400">{record.time} WIB</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{record.studentName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                          <span className="font-semibold text-emerald-800">{record.className}</span>
                          <span>·</span>
                          <span>{record.studentNisn}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${badgeCategoryColor}`}>
                          {record.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                        +{record.points}
                      </td>
                      <td className="py-3 px-4 text-slate-800 leading-relaxed">
                        {record.violation}
                      </td>
                      <td className="py-3 px-4 text-slate-600 leading-relaxed text-[11px]">
                        {record.followUp}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(record)}
                          title="Klik untuk mengubah status pembinaan"
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                            record.status === 'Terbina / Selesai'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                        >
                          {record.status}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            if (window.confirm('Hapus catatan kedisiplinan ini?')) {
                              onDeleteRecord(record.id);
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

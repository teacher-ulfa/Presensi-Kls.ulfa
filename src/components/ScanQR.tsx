import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Filter, 
  Search, 
  Clock, 
  RefreshCw,
  Send,
  UserCheck
} from 'lucide-react';
import { 
  ActivityType, 
  ACTIVITY_OPTIONS, 
  SCHOOL_CLASSES, 
  Student, 
  AttendanceRecord 
} from '../types';
import { soundService } from '../services/soundService';

interface ScanQRProps {
  initialActivity?: ActivityType;
  students: Student[];
  onAddAttendance: (record: AttendanceRecord) => void;
  recentAttendance: AttendanceRecord[];
  onSyncSpreadsheet: () => void;
  isSyncing: boolean;
}

export const ScanQR: React.FC<ScanQRProps> = ({
  initialActivity = 'Pembelajaran',
  students,
  onAddAttendance,
  recentAttendance,
  onSyncSpreadsheet,
  isSyncing,
}) => {
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>(initialActivity);
  const [selectedClass, setSelectedClass] = useState<string>('Semua Kelas');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  // Last scanned student feedback
  const [lastScanned, setLastScanned] = useState<{
    student: Student;
    time: string;
    activity: ActivityType;
  } | null>(null);

  // Manual input / quick scan input
  const [manualNisn, setManualNisn] = useState('');
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (initialActivity) {
      setSelectedActivity(initialActivity);
    }
  }, [initialActivity]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera tidak didukung pada browser ini.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);

      // BarcodeDetector setup if supported
      initBarcodeDetection();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tidak dapat mengakses kamera';
      setCameraError(`Akses kamera belum tersedia (${msg}). Anda dapat menggunakan fitur simulasi scan cepat di samping.`);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setCameraActive(false);
  };

  // Browser native BarcodeDetector API for high performance scanning
  const initBarcodeDetection = () => {
    const BarcodeDetectorClass = (window as unknown as { BarcodeDetector?: any }).BarcodeDetector;
    if (BarcodeDetectorClass) {
      try {
        const detector = new BarcodeDetectorClass({ formats: ['qr_code', 'code_128', 'code_39'] });
        scanIntervalRef.current = window.setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const rawValue = barcodes[0].rawValue;
                handleCodeDetected(rawValue);
              }
            } catch {
              // Ignore single frame detection errors
            }
          }
        }, 500);
      } catch {
        // Fallback
      }
    }
  };

  const handleCodeDetected = (codeString: string) => {
    // Process code: could be NISN "0098273611" or JSON or format "SMANIKRE:0098273611"
    let cleanNisn = codeString.trim();
    if (cleanNisn.includes(':')) {
      cleanNisn = cleanNisn.split(':').pop() || cleanNisn;
    }

    const found = students.find((s) => s.nisn === cleanNisn || s.nis === cleanNisn);
    if (found) {
      recordAttendanceForStudent(found);
    } else {
      setScanMessage({
        text: `QR Code tidak dikenali (${cleanNisn}). Pastikan QR Code terdaftar di SMAN 1 Krembung.`,
        type: 'warning',
      });
      if (soundEnabled) soundService.playDuplicateBeep();
    }
  };

  const recordAttendanceForStudent = (student: Student) => {
    const today = new Date().toISOString().slice(0, 10);
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour12: false });

    // Check if student already scanned for this activity today
    const alreadyScanned = recentAttendance.find(
      (a) => a.studentNisn === student.nisn && a.activity === selectedActivity && a.date === today
    );

    if (alreadyScanned) {
      setScanMessage({
        text: `${student.name} (${student.className}) sudah tercatat hadir untuk ${selectedActivity} pada ${alreadyScanned.time} WIB.`,
        type: 'warning',
      });
      if (soundEnabled) soundService.playDuplicateBeep();
      return;
    }

    // Create new attendance record
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      studentId: student.id,
      studentNisn: student.nisn,
      studentName: student.name,
      className: student.className,
      activity: selectedActivity,
      date: today,
      time: nowTime,
      status: 'Hadir',
      method: 'QR_SCAN',
      teacher: 'Ulfatul Husna, S.Ag.,M.Pd.',
      syncedToSpreadsheet: true,
      notes: `Presensi digital QR Code via SIAP PAI (${selectedActivity})`,
    };

    onAddAttendance(newRecord);
    setLastScanned({
      student,
      time: nowTime,
      activity: selectedActivity,
    });

    setScanMessage({
      text: `Presensi BERHASIL: ${student.name} (${student.className}) - ${selectedActivity}`,
      type: 'success',
    });

    if (soundEnabled) {
      soundService.playSuccessBeep();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNisn.trim()) return;

    const term = manualNisn.trim();
    const found = students.find((s) => s.nisn === term || s.nis === term || s.name.toLowerCase().includes(term.toLowerCase()));

    if (found) {
      recordAttendanceForStudent(found);
      setManualNisn('');
    } else {
      setScanMessage({
        text: `Siswa dengan NISN/Nama "${term}" tidak ditemukan di master data SMANIKRE.`,
        type: 'error',
      });
      if (soundEnabled) soundService.playDuplicateBeep();
    }
  };

  // Filter students for the quick simulator selector based on class filter
  const filteredStudents = selectedClass === 'Semua Kelas'
    ? students
    : students.filter((s) => s.className === selectedClass);

  // Filter recent scans
  const filteredRecentAttendance = recentAttendance.filter((a) => {
    const matchClass = selectedClass === 'Semua Kelas' || a.className === selectedClass;
    const matchActivity = a.activity === selectedActivity;
    return matchClass && matchActivity;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Filter and Configuration Bar */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-600" />
              <span>Scan QR.Code Presensi PAI &amp; Budi Pekerti</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              SMA Negeri 1 Krembung · TP 2026-2027 · Guru Pengampu: Ulfatul Husna, S.Ag.,M.Pd.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Berdasarkan Kelas */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <label htmlFor="scan-class-select" className="text-slate-500 font-medium">Kelas:</label>
              <select
                id="scan-class-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="Semua Kelas">Semua Kelas</option>
                {SCHOOL_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>Kelas {cls}</option>
                ))}
              </select>
            </div>

            {/* Pilihan Dropdown 6 Kegiatan */}
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-xs">
              <Clock className="w-3.5 h-3.5 text-emerald-700" />
              <label htmlFor="scan-activity-select" className="text-emerald-700 font-semibold">Kegiatan:</label>
              <select
                id="scan-activity-select"
                value={selectedActivity}
                onChange={(e) => setSelectedActivity(e.target.value as ActivityType)}
                className="bg-transparent font-bold text-emerald-900 focus:outline-none cursor-pointer"
              >
                {ACTIVITY_OPTIONS.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Matikan Suara Beep' : 'Aktifkan Suara Beep'}
              className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </div>
      </section>

      {/* Main Scanner Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Camera Viewfinder & Scanner Frame */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-800 text-white relative">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                <span className="font-medium">
                  {cameraActive ? 'Kamera Scanner Siap Membaca QR' : 'Kamera Nonaktif'}
                </span>
              </div>
              <span className="text-emerald-400 font-mono text-[11px]">
                {selectedActivity}
              </span>
            </div>

            {/* Camera View Area */}
            <div className="relative aspect-4/3 sm:aspect-16/10 bg-slate-950 flex flex-col items-center justify-center p-4 overflow-hidden">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Aiming Reticle Frame */}
                  <div className="relative z-10 w-56 h-56 sm:w-64 sm:h-64 border-2 border-emerald-400/80 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                    
                    {/* Laser scanning line animation */}
                    <div className="w-full h-0.5 bg-emerald-400/80 shadow-[0_0_8px_#34d399] animate-pulse" />
                    
                    <span className="mt-4 text-[11px] font-medium text-emerald-200 bg-slate-900/80 px-2.5 py-1 rounded-full border border-emerald-500/40">
                      Arahkan QR Siswa ke Kotak Ini
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center p-6 space-y-3 z-10">
                  <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Scanner Kamera Web/HP</h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                      Klik tombol di bawah untuk mengaktifkan kamera laptop atau HP guna membaca QR Code siswa secara realtime.
                    </p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md transition cursor-pointer"
                  >
                    Nyalakan Kamera Scanner
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Camera Action Bar */}
            <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              {cameraActive ? (
                <button
                  onClick={stopCamera}
                  className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-900 text-rose-200 text-xs font-medium rounded-lg border border-rose-700/50 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>Matikan Kamera</span>
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Aktifkan Kamera</span>
                </button>
              )}

              <div className="text-[11px] text-slate-400">
                Filter: <strong className="text-slate-200">{selectedClass}</strong>
              </div>
            </div>
          </div>

          {cameraError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Scanned Student Confirmation Card */}
          {lastScanned && (
            <div className="bg-emerald-50 border-2 border-emerald-400/80 rounded-xl p-4 shadow-sm animate-fadeIn">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {lastScanned.student.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Presensi Berhasil Terverifikasi</span>
                    </div>
                    <div className="text-base font-extrabold text-slate-900 mt-0.5">
                      {lastScanned.student.name}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-2">
                      <span className="font-semibold text-emerald-700">Kelas {lastScanned.student.className}</span>
                      <span>·</span>
                      <span className="font-mono text-slate-500">NISN: {lastScanned.student.nisn}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold bg-white text-emerald-800 px-2 py-1 rounded border border-emerald-200">
                    {lastScanned.time} WIB
                  </span>
                  <div className="text-[11px] text-slate-500 mt-1 font-medium">
                    {lastScanned.activity}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Quick Simulation, Barcode Gun Input, and Recent Scans */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Quick Simulation / Barcode Input */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-600" />
                <span>Input / Simulasi Scan Barcode Cepat</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ketik NISN atau gunakan Barcode Scanner USB / pilih siswa dari daftar
              </p>
            </div>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualNisn}
                onChange={(e) => setManualNisn(e.target.value)}
                placeholder="Masukkan NISN atau Nama Siswa..."
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer"
              >
                Scan
              </button>
            </form>

            {/* Quick Picker of Students (Simulates Tap/Card Scan) */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>Daftar Siswa ({selectedClass}):</span>
                <span className="text-[11px] text-emerald-700 font-medium">Klik nama untuk presensi instan</span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400">
                    Tidak ada siswa pada filter kelas ini.
                  </div>
                ) : (
                  filteredStudents.slice(0, 15).map((std) => (
                    <button
                      key={std.id}
                      onClick={() => recordAttendanceForStudent(std)}
                      className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-emerald-50/80 border border-slate-100 hover:border-emerald-200 flex items-center justify-between transition cursor-pointer text-xs group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 group-hover:bg-emerald-200 text-slate-700 group-hover:text-emerald-800 text-[10px] font-bold flex items-center justify-center">
                          {std.gender}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 group-hover:text-emerald-900 leading-tight">
                            {std.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {std.className} · {std.nisn}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-semibold group-hover:underline">
                        + Hadir
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {scanMessage && (
              <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                scanMessage.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : scanMessage.type === 'warning'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {scanMessage.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />}
                {scanMessage.type === 'warning' && <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />}
                {scanMessage.type === 'error' && <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />}
                <span className="leading-snug">{scanMessage.text}</span>
              </div>
            )}
          </div>

          {/* Sesi Presensi Terkini Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Riwayat Scan Hari Ini ({filteredRecentAttendance.length})
                </h3>
                <span className="text-[11px] text-slate-500">
                  {selectedActivity} · {selectedClass}
                </span>
              </div>
              <button
                onClick={onSyncSpreadsheet}
                disabled={isSyncing}
                title="Kirim data terbaru ke spreadsheet"
                className="text-xs text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-medium cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>{isSyncing ? 'Mengirim...' : 'Sync'}</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
              {filteredRecentAttendance.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Belum ada presensi tercatat untuk {selectedActivity} pada kelas ini.
                </div>
              ) : (
                filteredRecentAttendance.map((rec) => (
                  <div key={rec.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-800">{rec.studentName}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5 font-mono">
                        <span>{rec.className}</span>
                        <span>·</span>
                        <span>{rec.studentNisn}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                        {rec.status}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {rec.time} WIB
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

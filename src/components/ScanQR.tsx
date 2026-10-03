import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, CameraDevice } from 'html5-qrcode';
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
  SwitchCamera,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  ShieldAlert,
  Info
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
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);

  // Last scanned student feedback
  const [lastScanned, setLastScanned] = useState<{
    student: Student;
    time: string;
    activity: ActivityType;
  } | null>(null);

  // Manual input / quick scan input
  const [manualNisn, setManualNisn] = useState('');
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);

  // Html5Qrcode scanner instance ref
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastScannedCodeRef = useRef<{ code: string; timestamp: number } | null>(null);

  useEffect(() => {
    if (initialActivity) {
      setSelectedActivity(initialActivity);
    }
  }, [initialActivity]);

  // Load available camera devices on mount
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setAvailableCameras(devices);
          // Prefer back camera if found
          const backCam = devices.find((d) => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('belakang') ||
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
      })
      .catch(() => {
        // Permission not yet granted, will query after permission granted
      });

    return () => {
      // Cleanup scanner on unmount
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().catch(() => {}).then(() => {
            try {
              html5QrCodeRef.current?.clear();
            } catch {
              // ignore
            }
          });
        }
      }
    };
  }, []);

  const handleCodeDetected = useCallback((codeString: string) => {
    let cleanNisn = codeString.trim();
    if (cleanNisn.includes(':')) {
      cleanNisn = cleanNisn.split(':').pop()?.trim() || cleanNisn;
    }

    // Cooldown check (2.5 seconds cooldown for identical code to prevent duplicate rapid scans)
    const now = Date.now();
    if (
      lastScannedCodeRef.current &&
      lastScannedCodeRef.current.code === cleanNisn &&
      now - lastScannedCodeRef.current.timestamp < 2500
    ) {
      return;
    }

    lastScannedCodeRef.current = { code: cleanNisn, timestamp: now };

    const found = students.find((s) => s.nisn === cleanNisn || s.nis === cleanNisn);
    if (found) {
      recordAttendanceForStudent(found);
    } else {
      setScanMessage({
        text: `QR Code terbaca (${cleanNisn}), namun belum terdaftar di data siswa SMAN 1 Krembung.`,
        type: 'warning',
      });
      if (soundEnabled) soundService.playDuplicateBeep();
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
  }, [students, soundEnabled]);

  const recordAttendanceForStudent = (student: Student) => {
    const today = new Date().toISOString().slice(0, 10);
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour12: false });

    // Check if student already scanned for this activity today
    const alreadyScanned = recentAttendance.find(
      (a) => a.studentNisn === student.nisn && a.activity === selectedActivity && a.date === today
    );

    if (alreadyScanned) {
      setScanMessage({
        text: `PERHATIAN: ${student.name} (${student.className}) SUDAH TERCATAT HADIR untuk ${selectedActivity} pada jam ${alreadyScanned.time} WIB.`,
        type: 'warning',
      });
      if (soundEnabled) soundService.playDuplicateBeep();
      if (navigator.vibrate) navigator.vibrate([150, 100, 150]);
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
      text: `ALHAMDULILLAH, HADIR: ${student.name} (${student.className}) - ${selectedActivity}`,
      type: 'success',
    });

    if (soundEnabled) {
      soundService.playSuccessBeep();
    }
    if (navigator.vibrate) {
      navigator.vibrate([200]);
    }
  };

  // Start Scanner using Html5Qrcode
  const startScanning = async (overrideFacing?: 'environment' | 'user', overrideCameraId?: string) => {
    setCameraError('');
    setIsStartingCamera(true);

    try {
      // If already scanning, stop first
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        try {
          await html5QrCodeRef.current.stop();
        } catch {
          // ignore
        }
      }

      const readerElem = document.getElementById('qr-reader');
      if (!readerElem) {
        throw new Error('Elemen pemindai belum siap di layar.');
      }

      // Initialize Html5Qrcode instance
      const scanner = html5QrCodeRef.current || new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = scanner;

      const scanConfig = {
        fps: 10,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minDim = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.max(180, Math.floor(minDim * 0.72));
          return { width: size, height: size };
        },
        aspectRatio: 1.333333,
      };

      const targetFacing = overrideFacing || facingMode;
      const targetCameraId = overrideCameraId || selectedCameraId;

      // Determine starting camera target
      let cameraConfig: string | { facingMode: string } = targetCameraId || { facingMode: targetFacing };

      try {
        await scanner.start(
          cameraConfig,
          scanConfig,
          (decodedText) => {
            handleCodeDetected(decodedText);
          },
          () => {
            // Frame scanned with no QR detected, ignore
          }
        );
      } catch (firstErr) {
        // Fallback for laptop webcams that don't support facingMode: "environment"
        console.warn('Initial camera start failed, trying fallback...', firstErr);
        try {
          await scanner.start(
            { facingMode: 'user' },
            scanConfig,
            (decodedText) => handleCodeDetected(decodedText),
            () => {}
          );
          setFacingMode('user');
        } catch (secondErr) {
          // Final fallback: try first available hardware camera device
          const devices = await Html5Qrcode.getCameras().catch(() => []);
          if (devices && devices.length > 0) {
            await scanner.start(
              devices[0].id,
              scanConfig,
              (decodedText) => handleCodeDetected(decodedText),
              () => {}
            );
            setSelectedCameraId(devices[0].id);
          } else {
            throw secondErr;
          }
        }
      }

      setIsScanning(true);
      setIsStartingCamera(false);

      // Refresh camera device list now that permissions are granted
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setAvailableCameras(devices);
        }
      } catch {
        // ignore
      }

      setScanMessage({
        text: 'Kamera aktif. Dekatkan kartu QR code siswa ke dalam kotak pemindaian.',
        type: 'success',
      });
    } catch (err: unknown) {
      setIsStartingCamera(false);
      setIsScanning(false);
      const errMsg = err instanceof Error ? err.message : String(err);
      
      let friendlyMsg = `Kamera belum dapat dibuka (${errMsg}).`;
      if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission denied')) {
        friendlyMsg = 'Izin kamera diblokir oleh browser. Silakan klik ikon gembok / kamera pada bilah alamat (address bar) browser Anda, ubah menjadi "Izinkan" (Allow), lalu refresh halaman.';
      } else if (errMsg.includes('NotFoundError') || errMsg.includes('OverconstrainedError')) {
        friendlyMsg = 'Perangkat kamera tidak ditemukan atau tidak mendukung mode ini. Silakan coba pilih kamera lain dari menu dropdown kamera.';
      } else if (errMsg.includes('NotReadableError') || errMsg.includes('Could not start video source')) {
        friendlyMsg = 'Kamera sedang digunakan oleh aplikasi lain (seperti Zoom, Google Meet, atau tab lain). Silakan tutup aplikasi tersebut lalu klik Coba Lagi.';
      }

      setCameraError(friendlyMsg);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
  };

  const toggleCameraFacing = async () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    if (isScanning) {
      await startScanning(nextFacing);
    }
  };

  const handleSelectSpecificCamera = async (deviceId: string) => {
    setSelectedCameraId(deviceId);
    if (isScanning) {
      await startScanning(undefined, deviceId);
    }
  };

  // Decode QR code from file or photo upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setScanMessage({ text: 'Memindai berkas foto QR...', type: 'warning' });

    try {
      const scanner = html5QrCodeRef.current || new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = scanner;

      const decodedText = await scanner.scanFile(file, true);
      handleCodeDetected(decodedText);
    } catch {
      setScanMessage({
        text: 'Kode QR tidak dapat dibaca dari gambar tersebut. Pastikan foto QR Code jelas, fokus, dan tidak kabur.',
        type: 'error',
      });
      if (soundEnabled) soundService.playDuplicateBeep();
    } finally {
      setIsProcessingFile(false);
      e.target.value = '';
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
        text: `Siswa dengan NISN/Nama "${term}" tidak ditemukan di data kelas yang diampu.`,
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
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sistem Pemindai Universal HTML5-QRCode (Multi-Device)</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-600" />
              <span>Scan QR.Code Presensi PAI &amp; Budi Pekerti</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              SMA Negeri 1 Krembung · TP 2026-2027 · Pengampu: <strong className="text-slate-800">Ulfatul Husna, S.Ag.,M.Pd.</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Berdasarkan Kelas */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <label htmlFor="scan-class-select" className="text-slate-600 font-bold">Kelas:</label>
              <select
                id="scan-class-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="Semua Kelas">Semua Kelas yang Diampu ({students.length})</option>
                {SCHOOL_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>Kelas {cls}</option>
                ))}
              </select>
            </div>

            {/* Pilihan Dropdown 6 Kegiatan */}
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 rounded-lg px-3 py-1.5 text-xs">
              <Clock className="w-3.5 h-3.5 text-emerald-700" />
              <label htmlFor="scan-activity-select" className="text-emerald-800 font-bold">Kegiatan:</label>
              <select
                id="scan-activity-select"
                value={selectedActivity}
                onChange={(e) => setSelectedActivity(e.target.value as ActivityType)}
                className="bg-transparent font-extrabold text-emerald-950 focus:outline-none cursor-pointer"
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
          <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-xl border border-slate-800 text-white relative">
            
            {/* Top Bar inside Scanner */}
            <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isScanning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                <span className="font-bold">
                  {isScanning 
                    ? `Kamera Aktif (${facingMode === 'environment' ? 'Belakang' : 'Depan / Webcam'})` 
                    : isStartingCamera 
                    ? 'Menghubungkan Kamera...' 
                    : 'Kamera Standby'}
                </span>
              </div>

              {/* Camera Hardware Selector Dropdown */}
              {availableCameras.length > 1 && (
                <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <select
                    value={selectedCameraId}
                    onChange={(e) => handleSelectSpecificCamera(e.target.value)}
                    className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-[11px] max-w-[180px] truncate"
                  >
                    {availableCameras.map((cam, idx) => (
                      <option key={cam.id} value={cam.id} className="bg-slate-900 text-white">
                        {cam.label || `Kamera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Viewport Area: Host container for Html5Qrcode */}
            <div className="relative min-h-[320px] bg-slate-950 flex flex-col items-center justify-center p-2 overflow-hidden">
              
              {/* Native html5-qrcode DOM Target: ALWAYS MOUNTED to prevent null element errors */}
              <div 
                id="qr-reader" 
                className={`w-full max-w-md mx-auto ${isScanning ? 'block' : 'hidden'}`}
              />

              {/* Placeholder when camera is NOT active */}
              {!isScanning && (
                <div className="text-center p-6 space-y-4 z-10 max-w-md mx-auto">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-lg">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      Aktifkan Kamera Pemindai QR
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Sistem menggunakan pustaka universal yang mendukung webcam laptop, HP Android, serta Safari iOS iPhone tanpa plugin tambahan.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => startScanning('environment')}
                      disabled={isStartingCamera}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      {isStartingCamera ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                      <span>Nyalakan Kamera (HP / Belakang)</span>
                    </button>

                    <button
                      onClick={() => startScanning('user')}
                      disabled={isStartingCamera}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <span>Webcam Laptop / Kamera Depan</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Camera Action Bar */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {isScanning ? (
                  <>
                    <button
                      onClick={stopScanning}
                      className="px-3.5 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-200 text-xs font-semibold rounded-lg border border-rose-800 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <CameraOff className="w-3.5 h-3.5" />
                      <span>Matikan Kamera</span>
                    </button>

                    <button
                      onClick={toggleCameraFacing}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                      title="Beralih antara Kamera Belakang dan Depan/Webcam"
                    >
                      <SwitchCamera className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ganti Kamera</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startScanning(facingMode)}
                    disabled={isStartingCamera}
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Mulai Pindai Kamera</span>
                  </button>
                )}

                {/* Alternatif: Unggah Foto QR dari Galeri / Kamera Langsung */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingFile}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  title="Pilih gambar atau foto QR Code dari memori perangkat"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isProcessingFile ? 'Membaca...' : 'Unggah Foto QR'}</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400">
                Filter Rombel: <strong className="text-emerald-400 font-bold">{selectedClass}</strong>
              </div>
            </div>
          </div>

          {/* Camera Error / Permission Help Box */}
          {cameraError && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl text-xs text-amber-950 space-y-2">
              <div className="flex items-start gap-2.5 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Kendala Akses Kamera Terdeteksi:</span>
              </div>
              <p className="leading-relaxed pl-6 text-slate-700">
                {cameraError}
              </p>
              <div className="pl-6 pt-1 flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-slate-600">
                  💡 <strong>Solusi Mudah:</strong> Jika membuka dari jendela preview AI Studio, coba buka URL aplikasi langsung di tab baru browser atau gunakan tombol <strong>&quot;Unggah Foto QR&quot;</strong>.
                </span>
              </div>
            </div>
          )}

          {/* Scanned Student Confirmation Card */}
          {lastScanned && (
            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-4 shadow-sm animate-fadeIn">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                    {lastScanned.student.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-extrabold uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Presensi Berhasil Terverifikasi</span>
                    </div>
                    <div className="text-base font-black text-slate-950 mt-0.5">
                      {lastScanned.student.name}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-2">
                      <span className="font-extrabold text-emerald-800">Kelas {lastScanned.student.className}</span>
                      <span>·</span>
                      <span className="font-mono text-slate-600">NISN: {lastScanned.student.nisn}</span>
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
                <span>Pencarian NISN &amp; Barcode Scanner USB</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ketik NISN, atau gunakan alat pemindai Barcode Scanner USB / klik nama siswa
              </p>
            </div>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualNisn}
                onChange={(e) => setManualNisn(e.target.value)}
                placeholder="Masukkan NISN atau Nama Siswa..."
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer"
              >
                Scan
              </button>
            </form>

            {/* Quick Picker of Students (Simulates Tap/Card Scan) */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>Daftar Siswa ({selectedClass}):</span>
                <span className="text-[11px] text-emerald-700 font-bold">Uji Coba Presensi Cepat</span>
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
                      <span className="text-[10px] text-emerald-700 font-bold group-hover:underline">
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
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium' 
                  : scanMessage.type === 'warning'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200 font-medium' 
                  : 'bg-rose-50 text-rose-800 border border-rose-200 font-medium'
              }`}>
                {scanMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
                {scanMessage.type === 'warning' && <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />}
                {scanMessage.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
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

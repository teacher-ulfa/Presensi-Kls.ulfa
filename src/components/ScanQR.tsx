import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
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
  UserCheck,
  SwitchCamera,
  Upload,
  Image as ImageIcon,
  Zap,
  ZapOff
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
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
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

  // Refs for camera and scanner loop
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cooldown to avoid reading the same QR code 50 times a second
  const lastScannedCodeRef = useRef<{ code: string; timestamp: number } | null>(null);

  useEffect(() => {
    if (initialActivity) {
      setSelectedActivity(initialActivity);
    }
  }, [initialActivity]);

  // Clean up camera and animation on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setTorchEnabled(false);
    setHasTorch(false);
  }, []);

  const handleCodeDetected = useCallback((codeString: string) => {
    // Process code: could be NISN "0098273611" or JSON or format "SMANIKRE:0098273611"
    let cleanNisn = codeString.trim();
    if (cleanNisn.includes(':')) {
      cleanNisn = cleanNisn.split(':').pop()?.trim() || cleanNisn;
    }

    // Cooldown check (2.5 seconds cooldown for identical code)
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

  // Continuous frame scanning loop using jsQR
  const scanLoop = useCallback(() => {
    if (!videoRef.current || !cameraActive) return;

    const video = videoRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const width = video.videoWidth;
      const height = video.videoHeight;

      if (width > 0 && height > 0) {
        // Offscreen canvas for decoding
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          
          // Pure JS QR Code detection - works on ALL browsers & devices!
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          // Draw visual feedback on overlay canvas
          if (overlayCanvasRef.current) {
            const overlay = overlayCanvasRef.current;
            overlay.width = video.clientWidth;
            overlay.height = video.clientHeight;
            const overlayCtx = overlay.getContext('2d');
            if (overlayCtx) {
              overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

              if (code) {
                // Scale factor between video resolution and display size
                const scaleX = overlay.width / width;
                const scaleY = overlay.height / height;

                // Draw bounding box around detected QR Code
                overlayCtx.strokeStyle = '#10b981';
                overlayCtx.lineWidth = 4;
                overlayCtx.beginPath();
                overlayCtx.moveTo(code.location.topLeftCorner.x * scaleX, code.location.topLeftCorner.y * scaleY);
                overlayCtx.lineTo(code.location.topRightCorner.x * scaleX, code.location.topRightCorner.y * scaleY);
                overlayCtx.lineTo(code.location.bottomRightCorner.x * scaleX, code.location.bottomRightCorner.y * scaleY);
                overlayCtx.lineTo(code.location.bottomLeftCorner.x * scaleX, code.location.bottomLeftCorner.y * scaleY);
                overlayCtx.closePath();
                overlayCtx.stroke();
              }
            }
          }

          if (code && code.data) {
            handleCodeDetected(code.data);
          }
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanLoop);
  }, [cameraActive, handleCodeDetected]);

  // Trigger scan loop when camera becomes active
  useEffect(() => {
    if (cameraActive) {
      animationFrameRef.current = requestAnimationFrame(scanLoop);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [cameraActive, scanLoop]);

  const startCamera = async (targetFacing: 'environment' | 'user' = facingMode) => {
    setCameraError('');
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser ini tidak mendukung akses kamera langsung. Silakan gunakan tombol "Unggah / Foto QR" di bawah.');
      }

      let stream: MediaStream;
      try {
        // Attempt with desired facingMode
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: targetFacing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        // Fallback for laptops with single webcam (which throws OverconstrainedError on 'environment')
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;

      // Check if torch/flashlight is supported
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track as unknown as { getCapabilities?: () => { torch?: boolean } }).getCapabilities?.();
        if (capabilities && capabilities.torch) {
          setHasTorch(true);
        }
      }

      if (videoRef.current) {
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.setAttribute('muted', 'true');
        videoRef.current.srcObject = stream;
        
        await videoRef.current.play().catch(() => {});
      }

      setFacingMode(targetFacing);
      setCameraActive(true);
      setScanMessage({
        text: 'Kamera aktif. Dekatkan kartu QR siswa ke dalam area kotak pemindaian.',
        type: 'success',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Izin kamera ditolak';
      setCameraError(
        `Kamera belum dapat dibuka (${msg}). Pastikan izin kamera aktif pada browser atau gunakan tombol "Unggah / Foto QR" / "Input NISN".`
      );
      setCameraActive(false);
    }
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(nextMode);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      const nextState = !torchEnabled;
      try {
        await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchEnabled(nextState);
      } catch {
        // Torch failed or unsupported
      }
    }
  };

  // Decode QR code from uploaded image or taken photo
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setScanMessage({ text: 'Memindai berkas gambar QR Code...', type: 'warning' });

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data) {
            handleCodeDetected(code.data);
          } else {
            setScanMessage({
              text: 'Kode QR tidak terdeteksi pada gambar tersebut. Pastikan foto QR Code jelas dan tidak buram.',
              type: 'error',
            });
            if (soundEnabled) soundService.playDuplicateBeep();
          }
        }
        setIsProcessingFile(false);
      };
      img.onerror = () => {
        setScanMessage({ text: 'Gagal memuat berkas gambar.', type: 'error' });
        setIsProcessingFile(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input value so same image can be re-selected if needed
    e.target.value = '';
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
              <span>Sistem Scan Real-Time JSQR Berkecepatan Tinggi</span>
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
            {/* Camera Header Status */}
            <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${cameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <span className="font-bold">
                  {cameraActive 
                    ? `Kamera Scanner Aktif (${facingMode === 'environment' ? 'Belakang' : 'Depan/Webcam'})` 
                    : 'Kamera Nonaktif'}
                </span>
              </div>
              <span className="text-emerald-300 font-bold text-xs bg-emerald-950/70 border border-emerald-700/50 px-2 py-0.5 rounded">
                {selectedActivity}
              </span>
            </div>

            {/* Camera View Area */}
            <div className="relative aspect-4/3 sm:aspect-16/10 bg-slate-950 flex flex-col items-center justify-center p-2 overflow-hidden">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Canvas Overlay for QR Bounding Box Highlighting */}
                  <canvas
                    ref={overlayCanvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  />

                  {/* Aiming Reticle Frame */}
                  <div className="relative z-10 w-56 h-56 sm:w-64 sm:h-64 border-2 border-emerald-400/90 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_25px_rgba(52,211,153,0.35)] pointer-events-none">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                    
                    {/* Laser scanning line animation */}
                    <div className="w-full h-0.5 bg-emerald-400/90 shadow-[0_0_10px_#34d399] animate-pulse" />
                    
                    <span className="mt-4 text-[10px] font-bold text-emerald-100 bg-slate-950/90 px-3 py-1 rounded-full border border-emerald-500/50 shadow-md">
                      Posisikan QR Code di Dalam Kotak
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center p-6 space-y-3.5 z-10">
                  <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 border-2 border-emerald-600/40 flex items-center justify-center text-emerald-400 shadow-inner">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Scanner Kamera Realtime (Laptop / HP)</h3>
                    <p className="text-xs text-slate-300 max-w-sm mx-auto mt-1 leading-relaxed">
                      Menggunakan library <strong className="text-emerald-400">jsQR</strong> yang kompatibel dengan semua perangkat: Chrome, Firefox, Safari iOS iPhone, HP Android, dan webcam laptop.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      onClick={() => startCamera('environment')}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md transition cursor-pointer flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Aktifkan Kamera Belakang (HP)</span>
                    </button>
                    <button
                      onClick={() => startCamera('user')}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg shadow-md transition cursor-pointer flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Kamera Depan / Webcam Laptop</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Camera Action Bar */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {cameraActive ? (
                  <>
                    <button
                      onClick={stopCamera}
                      className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-200 text-xs font-semibold rounded-lg border border-rose-800 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <CameraOff className="w-3.5 h-3.5" />
                      <span>Matikan Kamera</span>
                    </button>

                    <button
                      onClick={toggleCameraFacing}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                      title="Ganti antara Kamera Belakang dan Depan/Webcam"
                    >
                      <SwitchCamera className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ganti Kamera</span>
                    </button>

                    {hasTorch && (
                      <button
                        onClick={toggleTorch}
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                          torchEnabled 
                            ? 'bg-amber-500 text-slate-950 border-amber-400' 
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                        title="Nyalakan Lampu Senter Flash"
                      >
                        {torchEnabled ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => startCamera(facingMode)}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Nyalakan Kamera</span>
                  </button>
                )}

                {/* Alternatif: Unggah Foto QR dari Galeri / Kamera */}
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

          {cameraError && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Pemberitahuan Akses Kamera:</strong>
                <span>{cameraError}</span>
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

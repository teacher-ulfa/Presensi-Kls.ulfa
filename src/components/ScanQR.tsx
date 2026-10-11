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
  SwitchCamera,
  Upload,
  Image as ImageIcon,
  Zap,
  ZapOff,
  Maximize2,
  Check,
  UserCheck,
  Smartphone,
  Share2,
  Download,
  Copy,
  Layers,
  FileText,
  Heart
} from 'lucide-react';
import { 
  ActivityType, 
  ACTIVITY_OPTIONS, 
  SCHOOL_CLASSES, 
  Student, 
  AttendanceRecord,
  AttendanceStatus,
  UserRole,
  RohisSession,
  ROHIS_DEFAULT_STATIONS
} from '../types';
import { soundService } from '../services/soundService';

interface ScanQRProps {
  initialActivity?: ActivityType;
  students: Student[];
  onAddAttendance: (record: AttendanceRecord) => void;
  onUpdateAttendance?: (record: AttendanceRecord) => void;
  recentAttendance: AttendanceRecord[];
  onSyncSpreadsheet: () => void;
  isSyncing: boolean;
  userRole?: UserRole;
  rohisSession?: RohisSession | null;
  onBatchMergeAttendance?: (records: AttendanceRecord[]) => { addedCount: number; duplicateCount: number };
}

interface IdentifiedCamera {
  id: string;
  label: string;
  facing: 'environment' | 'user' | 'unknown';
}

export const ScanQR: React.FC<ScanQRProps> = ({
  initialActivity = 'Pembelajaran',
  students,
  onAddAttendance,
  onUpdateAttendance,
  recentAttendance,
  onSyncSpreadsheet,
  isSyncing,
  userRole = 'guru',
  rohisSession = null,
  onBatchMergeAttendance,
}) => {
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>(
    rohisSession ? rohisSession.activity : initialActivity
  );
  const [selectedClass, setSelectedClass] = useState<string>('Semua Kelas');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Mode Presensi: 'HADIR' (normal sholat berjama'ah) vs 'BERHALANGAN_HAID' (khusus siswi uzur syar'i)
  const [scanAttendanceMode, setScanAttendanceMode] = useState<'HADIR' | 'BERHALANGAN_HAID'>('HADIR');
  const scanAttendanceModeRef = useRef<'HADIR' | 'BERHALANGAN_HAID'>('HADIR');
  useEffect(() => {
    scanAttendanceModeRef.current = scanAttendanceMode;
  }, [scanAttendanceMode]);

  // Modal Presensi Cepat Siswi Berhalangan (Tanpa Scan)
  const [showHaidModal, setShowHaidModal] = useState<boolean>(false);
  const [haidSearchQuery, setHaidSearchQuery] = useState<string>('');
  const [haidFilterClass, setHaidFilterClass] = useState<string>('Semua Kelas');
  
  // Camera selection states
  const [availableCameras, setAvailableCameras] = useState<IdentifiedCamera[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [activeCameraLabel, setActiveCameraLabel] = useState<string>('');
  
  // Flashlight / Torch support
  const [torchAvailable, setTorchAvailable] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);

  // File upload scanning
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);

  // Visual scan detection animation state
  const [scanPulse, setScanPulse] = useState<boolean>(false);

  // Multi-device Modals state
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [copiedExport, setCopiedExport] = useState<boolean>(false);
  const [showMergeModal, setShowMergeModal] = useState<boolean>(false);
  const [mergeJsonInput, setMergeJsonInput] = useState<string>('');
  const [mergeResultMsg, setMergeResultMsg] = useState<{ text: string; success: boolean } | null>(null);

  // Last scanned student feedback (includes status & recordId)
  const [lastScanned, setLastScanned] = useState<{
    student: Student;
    time: string;
    activity: ActivityType;
    status: AttendanceStatus;
    recordId?: string;
  } | null>(null);

  // Manual input / quick scan input
  const [manualNisn, setManualNisn] = useState('');
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);

  // DOM & Media Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastScannedCodeRef = useRef<{ code: string; timestamp: number } | null>(null);
  const isScanningActiveRef = useRef<boolean>(false);

  useEffect(() => {
    if (initialActivity) {
      setSelectedActivity(initialActivity);
    }
  }, [initialActivity]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Helper to categorize camera devices with friendly names
  const categorizeDevices = (devices: MediaDeviceInfo[]): IdentifiedCamera[] => {
    const videoDevices = devices.filter((d) => d.kind === 'videoinput');
    return videoDevices.map((d, index) => {
      const labelLower = d.label.toLowerCase();
      let facing: 'environment' | 'user' | 'unknown' = 'unknown';

      if (
        labelLower.includes('back') || 
        labelLower.includes('belakang') || 
        labelLower.includes('rear') || 
        labelLower.includes('environment') ||
        labelLower.includes('0, facing back') ||
        labelLower.includes('camera 0')
      ) {
        facing = 'environment';
      } else if (
        labelLower.includes('front') || 
        labelLower.includes('depan') || 
        labelLower.includes('user') || 
        labelLower.includes('selfie') || 
        labelLower.includes('1, facing front') ||
        labelLower.includes('camera 1')
      ) {
        facing = 'user';
      }

      let friendlyLabel = d.label;
      if (!friendlyLabel) {
        friendlyLabel = `Kamera ${index + 1}`;
      } else if (facing === 'environment') {
        friendlyLabel = `📱 ${d.label} (Belakang)`;
      } else if (facing === 'user') {
        friendlyLabel = `🤳 ${d.label} (Depan / Webcam)`;
      } else {
        friendlyLabel = `📷 ${d.label}`;
      }

      return {
        id: d.deviceId,
        label: friendlyLabel,
        facing,
      };
    });
  };

  // Refresh list of available cameras from the browser
  const refreshCameraDevices = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const categorized = categorizeDevices(devices);
      if (categorized.length > 0) {
        setAvailableCameras(categorized);
      }
    } catch (err) {
      console.warn('Gagal membaca daftar perangkat kamera:', err);
    }
  };

  // Safely stop existing camera stream and scan loops
  const stopCameraStream = () => {
    isScanningActiveRef.current = false;
    
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setTorchOn(false);
    setTorchAvailable(false);
    setIsScanning(false);
  };

  const handleCodeDetected = useCallback((codeString: string) => {
    let clean = codeString.trim();

    // Check if code contains formatted text like "NISN: 0081234567" or URL
    if (clean.includes(':')) {
      const parts = clean.split(':');
      clean = parts[parts.length - 1].trim();
    }

    // Try parsing if JSON string e.g. {"nisn":"0081234567"}
    if (clean.startsWith('{') && clean.endsWith('}')) {
      try {
        const parsed = JSON.parse(clean);
        clean = parsed.nisn || parsed.nis || parsed.id || clean;
      } catch {
        // ignore JSON parse error
      }
    }

    // Clean any URL params e.g. ?nisn=0081234567
    if (clean.includes('?nisn=')) {
      const urlParams = new URLSearchParams(clean.substring(clean.indexOf('?')));
      clean = urlParams.get('nisn') || clean;
    }

    // Cooldown check (2.5 seconds cooldown for identical code to prevent duplicate rapid scans)
    const now = Date.now();
    if (
      lastScannedCodeRef.current &&
      lastScannedCodeRef.current.code === clean &&
      now - lastScannedCodeRef.current.timestamp < 2500
    ) {
      return;
    }

    lastScannedCodeRef.current = { code: clean, timestamp: now };

    // Trigger visual pulse
    setScanPulse(true);
    setTimeout(() => setScanPulse(false), 800);

    // Look up student by NISN, NIS, or ID
    const found = students.find((s) => 
      s.nisn === clean || 
      s.nis === clean || 
      s.id === clean ||
      s.nisn.replace(/\D/g, '') === clean.replace(/\D/g, '')
    );

    if (found) {
      recordAttendanceForStudent(found);
    } else {
      setScanMessage({
        text: `QR Code terbaca ("${clean}"), namun belum terdaftar di data siswa SMAN 1 Krembung.`,
        type: 'warning',
      });
      if (soundEnabled) soundService.playDuplicateBeep();
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
  }, [students, soundEnabled, selectedActivity, recentAttendance]);

  const femaleStudentsList = students.filter((s) => {
    if (s.gender !== 'P') return false;
    const matchClass = haidFilterClass === 'Semua Kelas' || s.className === haidFilterClass;
    const matchQuery = !haidSearchQuery.trim() ||
      s.name.toLowerCase().includes(haidSearchQuery.toLowerCase()) ||
      s.nisn.includes(haidSearchQuery) ||
      s.className.toLowerCase().includes(haidSearchQuery.toLowerCase());
    return matchClass && matchQuery;
  });

  const handleToggleStudentStatus = (student: Student, targetStatus: AttendanceStatus) => {
    const today = new Date().toISOString().slice(0, 10);
    const existing = recentAttendance.find(
      (a) => (a.studentId === student.id || a.studentNisn === student.nisn) && a.activity === selectedActivity && a.date === today
    );

    const stationLabel = userRole === 'rohis' && rohisSession ? rohisSession.stationName : 'Pos Guru Pengampu';
    const officerLabel = userRole === 'rohis' && rohisSession ? rohisSession.officerName : 'Ibu Ulfatul Husna, S.Ag.,M.Pd.';
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour12: false });

    if (existing) {
      const updated: AttendanceRecord = {
        ...existing,
        status: targetStatus,
        notes: targetStatus === 'Berhalangan' 
          ? `Berhalangan sholat (Haid) via ${stationLabel} (${officerLabel})` 
          : `Presensi Hadir via ${stationLabel} (${officerLabel})`,
      };
      if (onUpdateAttendance) {
        onUpdateAttendance(updated);
      } else {
        onAddAttendance(updated);
      }
      setLastScanned({
        student,
        time: existing.time || nowTime,
        activity: selectedActivity,
        status: targetStatus,
        recordId: existing.id,
      });
      setScanMessage({
        text: targetStatus === 'Berhalangan' 
          ? `🌸 Status ${student.name} diperbarui menjadi: Berhalangan (Haid).` 
          : `✓ Status ${student.name} diperbarui menjadi: Hadir (Sholat).`,
        type: 'success',
      });
      if (soundEnabled) soundService.playSuccessBeep();
    } else {
      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        studentId: student.id,
        studentNisn: student.nisn,
        studentName: student.name,
        className: student.className,
        activity: selectedActivity,
        date: today,
        time: nowTime,
        status: targetStatus,
        method: 'QR_SCAN',
        teacher: 'Ulfatul Husna, S.Ag.,M.Pd.',
        deviceStation: stationLabel,
        operatorName: officerLabel,
        syncedToSpreadsheet: true,
        notes: targetStatus === 'Berhalangan' 
          ? `Berhalangan sholat (Haid) via ${stationLabel} (${officerLabel})` 
          : `Presensi QR via ${stationLabel} (${officerLabel})`,
      };
      onAddAttendance(newRecord);
      setLastScanned({
        student,
        time: nowTime,
        activity: selectedActivity,
        status: targetStatus,
        recordId: newRecord.id,
      });
      setScanMessage({
        text: targetStatus === 'Berhalangan'
          ? `🌸 TERCATAT: ${student.name} (${student.className}) - Berhalangan (Haid)`
          : `ALHAMDULILLAH, HADIR: ${student.name} (${student.className}) - ${selectedActivity}`,
        type: 'success',
      });
      if (soundEnabled) soundService.playSuccessBeep();
    }
  };

  const recordAttendanceForStudent = (student: Student, forceStatus?: AttendanceStatus) => {
    const today = new Date().toISOString().slice(0, 10);
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour12: false });
    const targetStatus = forceStatus || (scanAttendanceModeRef.current === 'BERHALANGAN_HAID' ? 'Berhalangan' : 'Hadir');

    // Validation for Haid mode: only for female students ('P')
    if (targetStatus === 'Berhalangan' && student.gender === 'L') {
      setScanMessage({
        text: `PERHATIAN: ${student.name} adalah siswa laki-laki. Mode Berhalangan (Haid) khusus untuk siswi perempuan.`,
        type: 'warning',
      });
      if (soundEnabled) soundService.playDuplicateBeep();
      if (navigator.vibrate) navigator.vibrate([150, 100, 150]);
      return;
    }

    // Check if student already scanned for this activity today
    const alreadyScanned = recentAttendance.find(
      (a) => a.studentNisn === student.nisn && a.activity === selectedActivity && a.date === today
    );

    if (alreadyScanned) {
      if (alreadyScanned.status === targetStatus) {
        setScanMessage({
          text: `PERHATIAN: ${student.name} (${student.className}) SUDAH TERCATAT ${alreadyScanned.status === 'Berhalangan' ? 'BERHALANGAN (HAID)' : 'HADIR'} untuk ${selectedActivity} pada jam ${alreadyScanned.time} WIB${alreadyScanned.deviceStation ? ` [di ${alreadyScanned.deviceStation}]` : ''}.`,
          type: 'warning',
        });
        if (soundEnabled) soundService.playDuplicateBeep();
        if (navigator.vibrate) navigator.vibrate([150, 100, 150]);
        return;
      }

      // If status is different (e.g. was scanned Hadir, now user wants Berhalangan or vice versa):
      handleToggleStudentStatus(student, targetStatus);
      return;
    }

    const stationLabel = userRole === 'rohis' && rohisSession ? rohisSession.stationName : 'Pos Guru Pengampu';
    const officerLabel = userRole === 'rohis' && rohisSession ? rohisSession.officerName : 'Ibu Ulfatul Husna, S.Ag.,M.Pd.';

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
      status: targetStatus,
      method: 'QR_SCAN',
      teacher: 'Ulfatul Husna, S.Ag.,M.Pd.',
      deviceStation: stationLabel,
      operatorName: officerLabel,
      syncedToSpreadsheet: true,
      notes: targetStatus === 'Berhalangan'
        ? `Berhalangan sholat (Haid) via ${stationLabel} (${officerLabel})`
        : `Presensi QR via ${stationLabel} (${officerLabel})`,
    };

    onAddAttendance(newRecord);
    setLastScanned({
      student,
      time: nowTime,
      activity: selectedActivity,
      status: targetStatus,
      recordId: newRecord.id,
    });

    setScanMessage({
      text: targetStatus === 'Berhalangan'
        ? `🌸 ALHAMDULILLAH, TERCATAT: ${student.name} (${student.className}) - Berhalangan (Haid)`
        : `ALHAMDULILLAH, HADIR: ${student.name} (${student.className}) - ${selectedActivity}`,
      type: 'success',
    });

    if (soundEnabled) {
      soundService.playSuccessBeep();
    }
    if (navigator.vibrate) {
      navigator.vibrate([200]);
    }
  };

  // High-performance QR scanning loop (Dual Engine: Native BarcodeDetector + jsQR)
  const startScanningLoop = () => {
    isScanningActiveRef.current = true;

    // Check if browser has native BarcodeDetector API (fastest, GPU-accelerated on Android & Chrome)
    let nativeDetector: any = null;
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        nativeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      } catch (err) {
        nativeDetector = null;
      }
    }

    let lastScanTime = 0;
    // Throttle scan rate to ~15 fps (every 65ms) to keep device cool and preserve battery
    const SCAN_INTERVAL_MS = 65; 

    const scanFrame = async (timestamp: number) => {
      if (!isScanningActiveRef.current) return;

      if (!videoRef.current || videoRef.current.readyState < 2) {
        animationFrameIdRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      if (timestamp - lastScanTime >= SCAN_INTERVAL_MS) {
        lastScanTime = timestamp;
        const video = videoRef.current;
        const vw = video.videoWidth;
        const vh = video.videoHeight;

        if (vw > 0 && vh > 0) {
          let detectedCode: string | null = null;

          // 1. Try Native BarcodeDetector first (blazing fast on Chrome/Android)
          if (nativeDetector) {
            try {
              const barcodes = await nativeDetector.detect(video);
              if (barcodes && barcodes.length > 0) {
                detectedCode = barcodes[0].rawValue;
              }
            } catch {
              // Ignore native detector failure, fall back to jsQR
            }
          }

          // 2. Universal jsQR Engine (works on all devices: Safari iOS, Firefox, laptops)
          if (!detectedCode) {
            let canvas = canvasRef.current;
            if (!canvas) {
              canvas = document.createElement('canvas');
              canvasRef.current = canvas;
            }

            // Downscale frame slightly if resolution is large (e.g. 4K/1080p) to keep JS decode time < 8ms
            const maxDim = 640;
            const scale = Math.min(1, maxDim / Math.max(vw, vh));
            const cw = Math.floor(vw * scale);
            const ch = Math.floor(vh * scale);

            canvas.width = cw;
            canvas.height = ch;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            if (ctx) {
              ctx.drawImage(video, 0, 0, cw, ch);
              const imageData = ctx.getImageData(0, 0, cw, ch);
              const qrResult = jsQR(imageData.data, cw, ch, {
                inversionAttempts: 'attemptBoth',
              });

              if (qrResult && qrResult.data) {
                detectedCode = qrResult.data;
              }
            }
          }

          if (detectedCode) {
            handleCodeDetected(detectedCode);
          }
        }
      }

      if (isScanningActiveRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(scanFrame);
      }
    };

    animationFrameIdRef.current = requestAnimationFrame(scanFrame);
  };

  // Robust camera starter with seamless multi-constraint fallbacks
  const startCamera = async (
    targetFacing: 'environment' | 'user' = facingMode,
    targetDeviceId?: string
  ) => {
    setIsStartingCamera(true);
    setCameraError('');

    // Stop any existing stream cleanly
    stopCameraStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Browser ini tidak mendukung akses kamera langsung (MediaDevices Web API). Silakan gunakan tombol "Unggah Foto QR" atau buka aplikasi di browser modern seperti Google Chrome.');
      setIsStartingCamera(false);
      return;
    }

    let activeStream: MediaStream | null = null;
    let actualFacing = targetFacing;

    // Constraint configurations to try in cascade order
    const constraintAttempts: MediaStreamConstraints[] = [];

    // Attempt 1: Target specific camera device ID if explicitly selected
    if (targetDeviceId) {
      constraintAttempts.push({
        video: {
          deviceId: { exact: targetDeviceId },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
        audio: false,
      });
    }

    // Attempt 2: Target facingMode with ideal constraint
    // (ideal: 'environment' works for rear camera on mobile, and seamlessly falls back on laptops without throwing OverconstrainedError)
    constraintAttempts.push({
      video: {
        facingMode: { ideal: targetFacing },
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
      },
      audio: false,
    });

    // Attempt 3: Simple facingMode
    constraintAttempts.push({
      video: {
        facingMode: targetFacing,
      },
      audio: false,
    });

    // Attempt 4: Opposite facingMode (e.g. if environment was requested on laptop that only has webcam)
    const oppositeFacing = targetFacing === 'environment' ? 'user' : 'environment';
    constraintAttempts.push({
      video: {
        facingMode: { ideal: oppositeFacing },
      },
      audio: false,
    });

    // Attempt 5: Generic any video input available
    constraintAttempts.push({
      video: true,
      audio: false,
    });

    let lastError: unknown = null;

    for (const constraints of constraintAttempts) {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (activeStream) {
          break;
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (!activeStream) {
      setIsStartingCamera(false);
      setIsScanning(false);
      const errMsg = lastError instanceof Error ? lastError.message : String(lastError);
      
      let friendlyMsg = `Kamera belum dapat dibuka (${errMsg}).`;
      if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission denied')) {
        friendlyMsg = 'Izin kamera diblokir oleh browser. Silakan klik ikon gembok / kamera pada bilah alamat (address bar) browser Anda, pilih "Izinkan" (Allow), lalu refresh halaman.';
      } else if (errMsg.includes('NotFoundError') || errMsg.includes('OverconstrainedError')) {
        friendlyMsg = 'Perangkat kamera tidak ditemukan atau tidak mendukung mode yang dipilih. Coba beralih antara Kamera Belakang dan Webcam Depan.';
      } else if (errMsg.includes('NotReadableError') || errMsg.includes('Could not start video source')) {
        friendlyMsg = 'Kamera sedang digunakan oleh aplikasi lain (seperti Zoom, Google Meet, atau tab browser lain). Harap tutup aplikasi tersebut lalu klik Coba Lagi.';
      }
      setCameraError(friendlyMsg);
      return;
    }

    // Attach stream to video element
    streamRef.current = activeStream;

    if (videoRef.current) {
      videoRef.current.srcObject = activeStream;
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.muted = true;
      try {
        await videoRef.current.play();
      } catch (playErr) {
        console.warn('Video play interrupted:', playErr);
      }
    }

    // Inspect active track
    const track = activeStream.getVideoTracks()[0];
    if (track) {
      const settings = track.getSettings();
      if (settings.deviceId) {
        setSelectedCameraId(settings.deviceId);
      }
      if (settings.facingMode) {
        actualFacing = settings.facingMode as 'environment' | 'user';
        setFacingMode(actualFacing);
      } else {
        setFacingMode(targetFacing);
      }

      setActiveCameraLabel(track.label || (actualFacing === 'environment' ? 'Kamera Belakang' : 'Kamera Depan / Webcam'));

      // Check torch/flashlight capability
      if (typeof track.getCapabilities === 'function') {
        const capabilities = track.getCapabilities() as any;
        setTorchAvailable(Boolean(capabilities?.torch));
      } else {
        setTorchAvailable(false);
      }
    }

    setIsScanning(true);
    setIsStartingCamera(false);
    setCameraError('');

    // Enumerate cameras now that permission has been granted so labels are populated
    await refreshCameraDevices();

    // Start scanning loop
    startScanningLoop();

    setScanMessage({
      text: `Kamera aktif (${actualFacing === 'environment' ? 'Kamera Belakang' : 'Kamera Depan/Webcam'}). Arahkan QR Code kartu siswa ke dalam kotak.`,
      type: 'success',
    });
  };

  // Toggle between rear and front camera
  const toggleCameraFacing = async () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);

    // If availableCameras has a camera with the target facing mode, select its ID
    const targetCam = availableCameras.find((c) => c.facing === nextFacing);
    const targetId = targetCam ? targetCam.id : undefined;
    setSelectedCameraId(targetId || '');

    await startCamera(nextFacing, targetId);
  };

  // Switch to a specific hardware camera from dropdown
  const handleSelectSpecificCamera = async (deviceId: string) => {
    setSelectedCameraId(deviceId);
    const chosen = availableCameras.find((c) => c.id === deviceId);
    const desiredFacing = chosen?.facing !== 'unknown' ? chosen?.facing : facingMode;
    await startCamera(desiredFacing, deviceId);
  };

  // Toggle Torch/Flashlight for rear camera
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextTorch = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (err) {
      console.warn('Gagal mengubah status senter/torch:', err);
    }
  };

  // Decode QR code from file or photo upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setScanMessage({ text: 'Memindai berkas foto QR...', type: 'warning' });

    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Gagal memuat gambar foto.'));
      });

      let detectedText: string | null = null;

      // Try BarcodeDetector first
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await detector.detect(img);
          if (barcodes && barcodes.length > 0) {
            detectedText = barcodes[0].rawValue;
          }
        } catch {
          // ignore
        }
      }

      // Fallback to jsQR
      if (!detectedText) {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const res = jsQR(imgData.data, canvas.width, canvas.height, {
            inversionAttempts: 'attemptBoth',
          });
          if (res) {
            detectedText = res.data;
          }
        }
      }

      URL.revokeObjectURL(objectUrl);

      if (detectedText) {
        handleCodeDetected(detectedText);
      } else {
        setScanMessage({
          text: 'QR Code tidak terdeteksi pada gambar. Pastikan foto tegak lurus, fokus, dan pencahayaan cukup terang.',
          type: 'error',
        });
        if (soundEnabled) soundService.playDuplicateBeep();
      }
    } catch (err) {
      setScanMessage({
        text: 'Gagal memproses gambar: ' + (err instanceof Error ? err.message : String(err)),
        type: 'error',
      });
    } finally {
      setIsProcessingFile(false);
      e.target.value = '';
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNisn.trim()) return;

    const term = manualNisn.trim();
    const found = students.find((s) => 
      s.nisn === term || 
      s.nis === term || 
      s.id === term ||
      s.name.toLowerCase().includes(term.toLowerCase())
    );

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

  const today = new Date().toISOString().slice(0, 10);
  const currentStationName = userRole === 'rohis' && rohisSession ? rohisSession.stationName : 'Pos Guru Pengampu';
  const posScansToday = recentAttendance.filter(
    (a) => a.date === today && (userRole !== 'rohis' || a.deviceStation === currentStationName)
  );

  const handleExportPosData = () => {
    setShowExportModal(true);
    setCopiedExport(false);
  };

  const handleDownloadPosJson = () => {
    const jsonStr = JSON.stringify(posScansToday, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Presensi_${currentStationName.replace(/[^a-zA-Z0-9]/g, '_')}_${today}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyPosJson = () => {
    const jsonStr = JSON.stringify(posScansToday, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 3000);
  };

  const handleProcessMerge = () => {
    if (!mergeJsonInput.trim()) return;
    try {
      const parsed = JSON.parse(mergeJsonInput);
      if (!Array.isArray(parsed)) {
        setMergeResultMsg({ text: 'Data tidak valid. Format harus berupa array presensi JSON.', success: false });
        return;
      }
      if (onBatchMergeAttendance) {
        const res = onBatchMergeAttendance(parsed);
        setMergeResultMsg({
          text: `Alhamdulillah! Berhasil menggabungkan ${res.addedCount} presensi siswa baru. (${res.duplicateCount} data duplikasi diabaikan)`,
          success: true,
        });
        setMergeJsonInput('');
      }
    } catch (err) {
      setMergeResultMsg({
        text: 'Format JSON salah: ' + (err instanceof Error ? err.message : String(err)),
        success: false,
      });
    }
  };

  const handleFileUploadMerge = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setMergeJsonInput(content);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* KHUSUS MODE ROHIS: Banner Identitas Pos 1-7 & Counter */}
      {userRole === 'rohis' && (
        <section className="bg-gradient-to-r from-teal-900 via-emerald-950 to-teal-900 text-white rounded-2xl p-5 shadow-lg border border-teal-500/40 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-400/50 flex items-center justify-center text-teal-300 shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs bg-teal-500 text-slate-950 px-2.5 py-0.5 rounded-full font-black tracking-wide uppercase">
                    {rohisSession?.stationName || 'Pos 1'}
                  </span>
                  <span className="text-xs text-teal-300 font-semibold">
                    Petugas: <strong className="text-white">{rohisSession?.officerName || 'Tim Murid ROHIS'}</strong>
                  </span>
                  <span className="text-[11px] bg-teal-950/90 text-teal-200 border border-teal-500/30 px-2 py-0.5 rounded font-medium">
                    Masjid Al Hikmah SMAN 1 Krembung
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">
                  Kegiatan Aktif: <span className="text-teal-300">{selectedActivity}</span>
                </h2>
                <p className="text-xs text-teal-200/80 mt-0.5">
                  Perangkat ini terkunci khusus pemindaian QR Code presensi siswa di Masjid Al Hikmah SMAN 1 Krembung.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-slate-950/60 border border-teal-500/30 px-4 py-2 rounded-xl text-center">
                <div className="text-[10px] text-teal-300 font-bold uppercase tracking-wider">Hasil Scan Pos Ini</div>
                <div className="text-2xl font-black text-white">{posScansToday.length} <span className="text-xs font-normal text-teal-300">Siswa</span></div>
              </div>

              <button
                type="button"
                onClick={handleExportPosData}
                className="px-3.5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-md cursor-pointer whitespace-nowrap"
              >
                <Share2 className="w-4 h-4" />
                <span>Bagikan Data Pos</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Top Filter and Configuration Bar */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sistem Pemindai Universal Multi-Perangkat (6-7 HP &amp; Laptop)</span>
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
            {/* Tombol Khusus Guru: Gabungkan Data 6-7 Perangkat ROHIS */}
            {userRole === 'guru' && onBatchMergeAttendance && (
              <button
                type="button"
                onClick={() => {
                  setShowMergeModal(true);
                  setMergeResultMsg(null);
                }}
                className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-800 text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                title="Gabungkan file data dari 6-7 HP murid ROHIS"
              >
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                <span>Gabungkan 6-7 HP ROHIS</span>
              </button>
            )}
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

      {/* Bar Pengatur Mode Presensi: Hadir Sholat vs Siswi Berhalangan (Haid) */}
      <section className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700">Mode Presensi:</span>
            <div className="inline-flex rounded-lg p-1 bg-slate-100 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setScanAttendanceMode('HADIR')}
                className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  scanAttendanceMode === 'HADIR'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Normal (Hadir Sholat)</span>
              </button>

              <button
                type="button"
                onClick={() => setScanAttendanceMode('BERHALANGAN_HAID')}
                className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  scanAttendanceMode === 'BERHALANGAN_HAID'
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'text-pink-700 hover:bg-pink-50'
                }`}
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>🌸 Mode Siswi Berhalangan (Haid)</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setHaidFilterClass(selectedClass);
                setShowHaidModal(true);
              }}
              className="px-3.5 py-1.5 bg-pink-50 hover:bg-pink-100 border border-pink-300 text-pink-800 text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-2xs whitespace-nowrap"
              title="Buka daftar siswi perempuan untuk mencatat uzur haid secara manual tanpa scan kamera"
            >
              <Heart className="w-3.5 h-3.5 text-pink-600 fill-current" />
              <span>Input Siswi Berhalangan (Tanpa Scan)</span>
            </button>
          </div>
        </div>

        {/* Banner Aktif saat Mode Siswi Berhalangan dipilih */}
        {scanAttendanceMode === 'BERHALANGAN_HAID' && (
          <div className="p-3 bg-gradient-to-r from-pink-900 via-rose-900 to-purple-950 text-white rounded-xl border border-pink-400 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2.5 text-xs">
              <div className="w-8 h-8 rounded-lg bg-pink-500/30 border border-pink-300/40 flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4 text-pink-300 fill-current" />
              </div>
              <div>
                <div className="font-extrabold text-pink-200 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                  <span>🌸 MODE KHUSUS BERHALANGAN (HAID) AKTIF</span>
                  <span className="text-[10px] bg-pink-500/30 px-1.5 py-0.2 rounded border border-pink-300/30">Uzur Syar'i</span>
                </div>
                <p className="text-pink-100 text-xs mt-0.5">
                  Scan kartu QR siswi putri yang berhalangan untuk {selectedActivity}. Otomatis dicatat sebagai uzur syar'i (tidak sholat). Siswa putra otomatis ditolak.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setScanAttendanceMode('HADIR')}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold shrink-0 transition cursor-pointer self-start sm:self-center"
            >
              ✕ Matikan Mode Haid
            </button>
          </div>
        )}
      </section>

      {/* Main Scanner Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Camera Viewfinder & Scanner Frame */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-xl border border-slate-800 text-white relative">
            
            {/* Top Bar inside Scanner */}
            <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isScanning ? 'bg-emerald-400 animate-pulse' : isStartingCamera ? 'bg-amber-400 animate-ping' : 'bg-slate-500'}`} />
                <span className="font-bold">
                  {isScanning 
                    ? `Kamera Aktif: ${facingMode === 'environment' ? '📱 Kamera Belakang' : '🤳 Kamera Depan / Webcam'}` 
                    : isStartingCamera 
                    ? 'Menghubungkan Kamera...' 
                    : 'Kamera Standby'}
                </span>
                {activeCameraLabel && isScanning && (
                  <span className="hidden sm:inline-block text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded truncate max-w-[150px]">
                    {activeCameraLabel}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Senter / Torch Toggle (for mobile rear cameras) */}
                {isScanning && torchAvailable && (
                  <button
                    onClick={toggleTorch}
                    title={torchOn ? 'Matikan Senter' : 'Nyalakan Senter'}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                      torchOn 
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-md' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {torchOn ? <Zap className="w-3.5 h-3.5 fill-current" /> : <ZapOff className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{torchOn ? 'Senter ON' : 'Senter'}</span>
                  </button>
                )}

                {/* Camera Hardware Selector Dropdown (when multiple are detected) */}
                {availableCameras.length > 1 && (
                  <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <select
                      value={selectedCameraId}
                      onChange={(e) => handleSelectSpecificCamera(e.target.value)}
                      className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-[11px] max-w-[170px] truncate"
                    >
                      {availableCameras.map((cam, idx) => (
                        <option key={cam.id || idx} value={cam.id} className="bg-slate-900 text-white">
                          {cam.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Viewport Area: Live Video Stream + Aiming Reticle */}
            <div className="relative min-h-[340px] max-h-[460px] bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
              
              {/* Native HTML5 Video Element */}
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`w-full h-full object-cover max-h-[460px] ${isScanning ? 'block' : 'hidden'}`}
              />

              {/* Aiming Reticle & Laser Scanner (Visible when camera is active) */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                  {/* Outer dim background overlay */}
                  <div className="relative w-64 h-64 sm:w-72 sm:h-72">
                    {/* Corner targeting brackets */}
                    <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-xl transition-all duration-300 ${scanPulse ? 'border-emerald-300 scale-105' : 'border-emerald-400'}`} />
                    <div className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-xl transition-all duration-300 ${scanPulse ? 'border-emerald-300 scale-105' : 'border-emerald-400'}`} />
                    <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-xl transition-all duration-300 ${scanPulse ? 'border-emerald-300 scale-105' : 'border-emerald-400'}`} />
                    <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-xl transition-all duration-300 ${scanPulse ? 'border-emerald-300 scale-105' : 'border-emerald-400'}`} />

                    {/* Animated vertical laser line */}
                    <div className="absolute inset-x-2 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-[laser_2s_ease-in-out_infinite]" />

                    {/* Central scan instruction */}
                    <div className="absolute inset-x-0 bottom-3 text-center">
                      <span className="text-[11px] font-semibold text-white/90 bg-slate-900/80 px-3 py-1 rounded-full backdrop-blur-xs border border-white/10 shadow-xs">
                        {scanPulse ? '✓ QR CODE TERBACA!' : 'Posisikan QR code kartu di dalam kotak'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Standby State (When camera is NOT active) */}
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
                      Mendukung <strong>Kamera Belakang HP</strong>, <strong>Webcam Laptop</strong>, maupun <strong>Kamera Depan</strong> dengan deteksi otomatis berkecepatan tinggi.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => startCamera('environment')}
                      disabled={isStartingCamera}
                      className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isStartingCamera ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                      <span>📱 Buka Kamera Belakang (HP)</span>
                    </button>

                    <button
                      onClick={() => startCamera('user')}
                      disabled={isStartingCamera}
                      className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <span>💻 Webcam Laptop / Depan</span>
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
                      onClick={stopCameraStream}
                      className="px-3.5 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-200 text-xs font-semibold rounded-lg border border-rose-800 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <CameraOff className="w-3.5 h-3.5" />
                      <span>Matikan Kamera</span>
                    </button>

                    <button
                      onClick={toggleCameraFacing}
                      className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg border border-emerald-600 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      title="Putar antara Kamera Belakang dan Kamera Depan/Webcam"
                    >
                      <SwitchCamera className="w-4 h-4" />
                      <span>
                        Putar ke {facingMode === 'environment' ? 'Kamera Depan' : 'Kamera Belakang'}
                      </span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startCamera(facingMode)}
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
                  title="Pilih gambar atau foto QR Code dari memori perangkat atau galeri HP"
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
                <button
                  onClick={() => startCamera('environment')}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  Coba Kamera Belakang
                </button>
                <button
                  onClick={() => startCamera('user')}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  Coba Kamera Depan / Webcam
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 bg-white border border-amber-300 text-amber-900 font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  Gunakan Foto QR
                </button>
              </div>
            </div>
          )}

          {/* Scanned Student Confirmation Card */}
          {lastScanned && (
            <div className={`rounded-xl p-4 shadow-sm animate-fadeIn border-2 ${
              lastScanned.status === 'Berhalangan'
                ? 'bg-pink-50 border-pink-400'
                : 'bg-emerald-50 border-emerald-500'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full font-bold flex items-center justify-center text-sm shadow-xs shrink-0 text-white ${
                    lastScanned.status === 'Berhalangan' ? 'bg-pink-600' : 'bg-emerald-700'
                  }`}>
                    {lastScanned.student.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider">
                      {lastScanned.status === 'Berhalangan' ? (
                        <>
                          <Heart className="w-4 h-4 text-pink-600 fill-current" />
                          <span className="text-pink-800">🌸 Siswi Berhalangan (Haid) · Uzur Syar'i</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-800">Presensi Berhasil Terverifikasi</span>
                        </>
                      )}
                    </div>
                    <div className="text-base font-black text-slate-950 mt-0.5">
                      {lastScanned.student.name}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-800">Kelas {lastScanned.student.className}</span>
                      <span>·</span>
                      <span className="font-mono text-slate-600">NISN: {lastScanned.student.nisn}</span>
                      <span>·</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        lastScanned.student.gender === 'L' ? 'bg-sky-100 text-sky-800' : 'bg-pink-100 text-pink-800'
                      }`}>
                        {lastScanned.student.gender === 'P' ? 'Siswi Putri (P)' : 'Siswa Putra (L)'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-mono font-bold px-2 py-1 rounded border ${
                    lastScanned.status === 'Berhalangan'
                      ? 'bg-white text-pink-800 border-pink-300'
                      : 'bg-white text-emerald-800 border-emerald-200'
                  }`}>
                    {lastScanned.time} WIB
                  </span>
                  <div className="text-[11px] text-slate-500 mt-1 font-medium">
                    {lastScanned.activity}
                  </div>
                </div>
              </div>

              {/* Tombol Cepat Khusus Siswi Putri: Ubah status Hadir <-> Berhalangan (Haid) */}
              {lastScanned.student.gender === 'P' && (
                <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] text-slate-600 font-medium">
                    {lastScanned.status === 'Berhalangan'
                      ? 'Keliru input atau siswi ingin sholat?'
                      : 'Siswi sedang uzur syar\'i / haid hari ini?'}
                  </span>
                  {lastScanned.status === 'Berhalangan' ? (
                    <button
                      type="button"
                      onClick={() => handleToggleStudentStatus(lastScanned.student, 'Hadir')}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Kembalikan ke: Hadir (Sholat)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleStudentStatus(lastScanned.student, 'Berhalangan')}
                      className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      <span>🌸 Ubah Status: Berhalangan (Haid)</span>
                    </button>
                  )}
                </div>
              )}
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
                    <div
                      key={std.id}
                      className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-100 flex items-center justify-between transition text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => recordAttendanceForStudent(std)}
                        className="flex items-center gap-2 flex-1 text-left cursor-pointer"
                      >
                        <div className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                          std.gender === 'L' ? 'bg-sky-100 text-sky-800' : 'bg-pink-100 text-pink-800'
                        }`}>
                          {std.gender}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 leading-tight">
                            {std.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {std.className} · {std.nisn}
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => recordAttendanceForStudent(std, 'Hadir')}
                          className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold rounded cursor-pointer transition"
                          title="Catat Hadir (Sholat)"
                        >
                          + Hadir
                        </button>
                        {std.gender === 'P' && (
                          <button
                            type="button"
                            onClick={() => recordAttendanceForStudent(std, 'Berhalangan')}
                            className="px-2 py-1 bg-pink-100 hover:bg-pink-200 text-pink-800 text-[10px] font-bold rounded cursor-pointer transition flex items-center gap-0.5"
                            title="Catat Berhalangan (Haid)"
                          >
                            <Heart className="w-2.5 h-2.5 fill-current" />
                            <span>Haid</span>
                          </button>
                        )}
                      </div>
                    </div>
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
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>{rec.studentName}</span>
                        {rec.deviceStation && (
                          <span className="text-[9px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-bold">
                            {rec.deviceStation}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5 font-mono">
                        <span>{rec.className}</span>
                        <span>·</span>
                        <span>{rec.studentNisn}</span>
                        {rec.operatorName && (
                          <span className="text-slate-400">· {rec.operatorName}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${
                        rec.status === 'Hadir' ? 'bg-emerald-100 text-emerald-800' :
                        rec.status === 'Berhalangan' ? 'bg-pink-100 text-pink-800 border border-pink-300' :
                        rec.status === 'Terlambat' ? 'bg-purple-100 text-purple-800' :
                        rec.status === 'Sakit' ? 'bg-blue-100 text-blue-800' :
                        rec.status === 'Izin' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {rec.status === 'Berhalangan' ? 'Berhalangan (Haid)' : rec.status}
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

      {/* MODAL 1: EKSPOR DATA POS (UNTUK PETUGAS ROHIS & GURU) */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-teal-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Ekspor Data {currentStationName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {posScansToday.length} data presensi tercatat di perangkat ini hari ini
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 leading-relaxed">
              <strong>Petunjuk untuk Murid ROHIS:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1 text-slate-700">
                <li>Klik <strong>&quot;Unduh File Presensi (.json)&quot;</strong> atau <strong>&quot;Salin Kode JSON&quot;</strong>.</li>
                <li>Kirimkan file ini via WhatsApp ke <strong>Ibu Ulfatul Husna, S.Ag.,M.Pd.</strong></li>
                <li>Guru akan menggabungkan data dari seluruh 6-7 pos presensi secara otomatis.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={handleDownloadPosJson}
                disabled={posScansToday.length === 0}
                className="flex-1 py-2.5 px-4 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File Presensi (.json)</span>
              </button>

              <button
                type="button"
                onClick={handleCopyPosJson}
                disabled={posScansToday.length === 0}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Copy className="w-4 h-4 text-slate-600" />
                <span>{copiedExport ? 'Tersalin ke Clipboard!' : 'Salin Kode JSON'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: GABUNGKAN DATA 6-7 HP ROHIS (UNTUK GURU PENGAMPU) */}
      {showMergeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl border border-slate-200 space-y-4 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Gabungkan Data dari 6-7 HP ROHIS
                  </h3>
                  <p className="text-xs text-slate-500">
                    Penggabungan multi-perangkat otomatis dengan pencegahan duplikasi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMergeModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed space-y-1.5">
              <p>
                Unggah file <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">.json</code> yang dikirim oleh murid petugas ROHIS dari HP Pos 1 s/d Pos 7, atau tempel teks kodenya di bawah:
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih File JSON dari HP Murid ROHIS:
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUploadMerge}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Atau Tempel (Paste) Kode JSON di Sini:
              </label>
              <textarea
                value={mergeJsonInput}
                onChange={(e) => setMergeJsonInput(e.target.value)}
                placeholder='Tempel data JSON di sini, contoh: [{"id":"att-1", "studentNisn":"008...", ...}]'
                rows={4}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-teal-500"
              />
            </div>

            {mergeResultMsg && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                mergeResultMsg.success 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {mergeResultMsg.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span>{mergeResultMsg.text}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMergeModal(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleProcessMerge}
                disabled={!mergeJsonInput.trim()}
                className="px-5 py-2 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
              >
                Proses &amp; Gabungkan Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PRESENSI CEPAT SISWI BERHALANGAN (HAID) TANPA SCAN */}
      {showHaidModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-pink-200 space-y-4 animate-fadeIn max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Presensi Siswi Berhalangan (Haid)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pencatatan uzur syar'i untuk siswi putri pada kegiatan <strong className="text-pink-700">{selectedActivity}</strong> (Masjid Al Hikmah)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHaidModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Filter Kelas & Pencarian Siswi */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-full sm:w-48">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <label className="text-slate-600 font-bold">Kelas:</label>
                <select
                  value={haidFilterClass}
                  onChange={(e) => setHaidFilterClass(e.target.value)}
                  className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer flex-1"
                >
                  <option value="Semua Kelas">Semua Kelas</option>
                  {SCHOOL_CLASSES.map((cls) => (
                    <option key={cls} value={cls}>Kelas {cls}</option>
                  ))}
                </select>
              </div>

              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={haidSearchQuery}
                  onChange={(e) => setHaidSearchQuery(e.target.value)}
                  placeholder="Cari nama siswi atau NISN..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-pink-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Daftar Siswi Perempuan Saja */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[260px] max-h-[380px]">
              {femaleStudentsList.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  Tidak ditemukan siswi perempuan yang sesuai dengan pencarian atau filter kelas ini.
                </div>
              ) : (
                femaleStudentsList.map((std) => {
                  const todayStr = new Date().toISOString().slice(0, 10);
                  const todayRec = recentAttendance.find(
                    (a) => (a.studentId === std.id || a.studentNisn === std.nisn) && a.activity === selectedActivity && a.date === todayStr
                  );
                  const isHaid = todayRec?.status === 'Berhalangan';
                  const isHadir = todayRec?.status === 'Hadir';

                  return (
                    <div
                      key={std.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                        isHaid
                          ? 'bg-pink-50/80 border-pink-300'
                          : isHadir
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                          isHaid
                            ? 'bg-pink-600 text-white'
                            : isHadir
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          P
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                            <span>{std.name}</span>
                            {isHaid && (
                              <span className="text-[10px] bg-pink-100 text-pink-800 px-1.5 py-0.2 rounded font-extrabold border border-pink-300">
                                🌸 Berhalangan (Haid)
                              </span>
                            )}
                            {isHadir && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                                ✓ Hadir Sholat
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Kelas {std.className} · NISN: {std.nisn}
                            {todayRec?.time && (
                              <span className="ml-2 text-slate-400">· Jam: {todayRec.time} WIB</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isHaid ? (
                          <button
                            type="button"
                            onClick={() => handleToggleStudentStatus(std, 'Hadir')}
                            className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-lg transition cursor-pointer"
                            title="Batal berhalangan & ubah ke Hadir"
                          >
                            Batal Haid / Sholat
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStudentStatus(std, 'Berhalangan')}
                            className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 shadow-xs"
                          >
                            <Heart className="w-3.5 h-3.5 fill-current" />
                            <span>Catat Berhalangan</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Total Siswi: <strong>{femaleStudentsList.length}</strong> orang</span>
              <button
                type="button"
                onClick={() => setShowHaidModal(false)}
                className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 cursor-pointer text-xs"
              >
                Selesai / Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

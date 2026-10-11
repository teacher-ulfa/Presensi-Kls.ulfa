/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Student, 
  AttendanceRecord, 
  DisciplineRecord, 
  SpreadsheetConfig, 
  ActivityType,
  UserRole,
  RohisSession,
  MASTER_APP_PASSWORD 
} from './types';
import { storageService } from './services/storageService';
import { spreadsheetService, SyncResult } from './services/spreadsheetService';
import { CoverLogin } from './components/CoverLogin';
import { HeaderNav, ActiveTab } from './components/HeaderNav';
import { Beranda } from './components/Beranda';
import { ScanQR } from './components/ScanQR';
import { PresensiManual } from './components/PresensiManual';
import { DataMurid } from './components/DataMurid';
import { CatatanKedisiplinan } from './components/CatatanKedisiplinan';
import { RekapPresensi } from './components/RekapPresensi';
import { SpreadsheetHub } from './components/SpreadsheetHub';
import { CetakKartuQR } from './components/CetakKartuQR';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => storageService.isLoggedIn());
  const [userRole, setUserRole] = useState<UserRole>(() => storageService.getUserRole());
  const [rohisSession, setRohisSession] = useState<RohisSession | null>(() => storageService.getRohisSession());
  
  // If in ROHIS mode, lock activeTab to 'scan-qr'
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    return storageService.getUserRole() === 'rohis' ? 'scan-qr' : 'beranda';
  });
  
  // State for students, attendance, discipline, and spreadsheet config
  const [students, setStudents] = useState<Student[]>(() => storageService.getStudents());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => storageService.getAttendance());
  const [discipline, setDiscipline] = useState<DisciplineRecord[]>(() => storageService.getDiscipline());
  const [spreadsheetConfig, setSpreadsheetConfig] = useState<SpreadsheetConfig>(() => storageService.getSpreadsheetConfig());

  // Quick activity preset from cover shortcut
  const [presetActivity, setPresetActivity] = useState<ActivityType>('Pembelajaran');

  // Selected class for print navigation
  const [selectedClassForPrint, setSelectedClassForPrint] = useState<string>('Semua Kelas');

  // Spreadsheet syncing state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state to storage
  useEffect(() => {
    storageService.saveStudents(students);
  }, [students]);

  useEffect(() => {
    storageService.saveAttendance(attendance);
  }, [attendance]);

  useEffect(() => {
    storageService.saveDiscipline(discipline);
  }, [discipline]);

  useEffect(() => {
    storageService.saveSpreadsheetConfig(spreadsheetConfig);
  }, [spreadsheetConfig]);

  // Real-time Cross-Window / Multi-Device Synchronization (BroadcastChannel)
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('siap_pai_live_sync');
      
      channel.onmessage = (event) => {
        if (event.data?.type === 'SYNC_ATTENDANCE' && Array.isArray(event.data.records)) {
          setAttendance((prev) => {
            const existingIds = new Set(prev.map(r => r.id));
            const newOnes = event.data.records.filter((r: AttendanceRecord) => !existingIds.has(r.id));
            return newOnes.length > 0 ? [...newOnes, ...prev] : prev;
          });
        }
      };

      return () => {
        channel.close();
      };
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Broadcast new attendance record to other open tabs/windows
  const broadcastNewAttendance = (records: AttendanceRecord[]) => {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('siap_pai_live_sync');
        channel.postMessage({ type: 'SYNC_ATTENDANCE', records });
        channel.close();
      } catch (err) {
        console.warn('Broadcast sync error:', err);
      }
    }
  };

  // Login handler
  const handleLogin = (role: UserRole = 'guru', session?: RohisSession) => {
    setIsLoggedIn(true);
    storageService.setLoggedIn(true);
    setUserRole(role);
    storageService.setUserRole(role);

    if (role === 'rohis' && session) {
      setRohisSession(session);
      storageService.setRohisSession(session);
      setPresetActivity(session.activity);
      setActiveTab('scan-qr');
      showToast(`Mode Petugas Scan ROHIS Aktif: ${session.stationName} (${session.officerName})`);
    } else {
      setRohisSession(null);
      storageService.setRohisSession(null);
      setActiveTab('beranda');
      showToast('Masuk sebagai Guru Pengampu (Ulfatul Husna, S.Ag.,M.Pd.) - Akses Penuh.');
    }
  };

  // Shortcut login to scan QR directly from cover
  const handleQuickScanFromCover = (activity: ActivityType, session?: RohisSession) => {
    setIsLoggedIn(true);
    storageService.setLoggedIn(true);
    if (session) {
      setUserRole('rohis');
      storageService.setUserRole('rohis');
      setRohisSession(session);
      storageService.setRohisSession(session);
    } else {
      setUserRole('guru');
      storageService.setUserRole('guru');
    }
    setPresetActivity(activity);
    setActiveTab('scan-qr');
  };

  // Switch to Guru mode (requires password 101073)
  const handleSwitchToGuru = (password: string): boolean => {
    if (storageService.verifyPassword(password)) {
      setUserRole('guru');
      storageService.setUserRole('guru');
      showToast('Berhasil beralih ke Akun Guru Pengampu (Akses Penuh Seluruh Menu).');
      return true;
    }
    return false;
  };

  // Switch to ROHIS mode
  const handleSwitchToRohis = () => {
    setUserRole('rohis');
    storageService.setUserRole('rohis');
    if (!rohisSession) {
      const defaultSession: RohisSession = {
        stationId: 1,
        stationName: 'Pos 1',
        officerName: 'Tim Murid ROHIS',
        activity: presetActivity,
        startedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setRohisSession(defaultSession);
      storageService.setRohisSession(defaultSession);
    }
    setActiveTab('scan-qr');
    showToast('Beralih ke Mode Petugas Scan ROHIS (6-7 Perangkat). Terkunci di Menu Scan QR.');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    storageService.setLoggedIn(false);
    setUserRole('guru');
    storageService.setUserRole('guru');
    setRohisSession(null);
    storageService.setRohisSession(null);
  };

  // Multi-device Attendance Merger (from 6-7 devices)
  const handleBatchMergeAttendance = (records: AttendanceRecord[]) => {
    const result = storageService.mergeAttendanceRecords(records, attendance);
    setAttendance(result.merged);
    broadcastNewAttendance(records);
    showToast(`Berhasil menggabungkan ${result.addedCount} presensi baru (${result.duplicateCount} duplikasi diabaikan).`);

    if (spreadsheetConfig.autoSync) {
      triggerSpreadsheetSync(result.merged, []);
    }
    return result;
  };

  // Add single attendance record (e.g. from QR scan)
  const handleAddAttendance = (record: AttendanceRecord) => {
    setAttendance((prev) => [record, ...prev]);
    broadcastNewAttendance([record]);

    // If auto-sync to spreadsheet is enabled
    if (spreadsheetConfig.autoSync) {
      triggerSpreadsheetSync([record], []);
    }
  };

  // Update single attendance record (e.g. toggle status Hadir <-> Berhalangan Haid)
  const handleUpdateAttendance = (record: AttendanceRecord) => {
    setAttendance((prev) => prev.map((a) => (a.id === record.id ? record : a)));
    broadcastNewAttendance([record]);

    if (spreadsheetConfig.autoSync) {
      triggerSpreadsheetSync([record], []);
    }
  };

  // Batch save attendance (from manual input)
  const handleBatchSaveAttendance = (records: AttendanceRecord[]) => {
    setAttendance((prev) => [...records, ...prev]);
    broadcastNewAttendance(records);

    if (spreadsheetConfig.autoSync) {
      triggerSpreadsheetSync(records, []);
    }
  };

  // Discipline operations
  const handleAddDiscipline = (record: DisciplineRecord) => {
    setDiscipline((prev) => [record, ...prev]);
    showToast(`Catatan kedisiplinan ${record.studentName} berhasil ditambahkan dan siap dikirim ke spreadsheet.`);
    
    if (spreadsheetConfig.autoSync) {
      triggerSpreadsheetSync([], [record]);
    }
  };

  const handleBatchAddDiscipline = (records: DisciplineRecord[]) => {
    setDiscipline((prev) => [...records, ...prev]);
    showToast(`${records.length} catatan kedisiplinan berhasil ditambahkan dan siap disinkronkan.`);
    
    if (spreadsheetConfig.autoSync) {
      triggerSpreadsheetSync([], records);
    }
  };

  const handleUpdateDiscipline = (record: DisciplineRecord) => {
    setDiscipline((prev) => prev.map((d) => (d.id === record.id ? record : d)));
    showToast(`Status pembinaan ${record.studentName} diperbarui.`);
  };

  const handleDeleteDiscipline = (id: string) => {
    setDiscipline((prev) => prev.filter((d) => d.id !== id));
    showToast('Catatan kedisiplinan berhasil dihapus.');
  };

  // Student CRUD operations
  const handleAddStudent = (student: Student) => {
    setStudents((prev) => [student, ...prev]);
    showToast(`Siswa ${student.name} berhasil ditambahkan.`);
  };

  const handleBatchAddStudents = (newStudents: Student[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      setStudents(newStudents);
      showToast(`Data murid diganti dengan ${newStudents.length} siswa baru.`);
    } else {
      setStudents((prev) => [...prev, ...newStudents]);
      showToast(`${newStudents.length} siswa berhasil ditambahkan secara massal.`);
    }
  };

  const handleUpdateStudent = (student: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === student.id ? student : s)));
    showToast(`Data siswa ${student.name} diperbarui.`);
  };

  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    showToast('Siswa berhasil dihapus dari data master.');
  };

  // Spreadsheet Sync Engine
  const triggerSpreadsheetSync = async (
    newAttendance?: AttendanceRecord[],
    newDiscipline?: DisciplineRecord[]
  ) => {
    setIsSyncing(true);
    const syncAttendance = newAttendance || attendance;
    const syncDiscipline = newDiscipline || discipline;

    const result = await spreadsheetService.syncToGoogleSheet(spreadsheetConfig, {
      attendance: syncAttendance,
      discipline: syncDiscipline,
    });

    setIsSyncing(false);
    setLastSyncResult(result);

    if (result.success) {
      const updatedConfig = {
        ...spreadsheetConfig,
        lastSyncTime: result.timestamp,
        totalSyncedRows: attendance.length + discipline.length,
      };
      setSpreadsheetConfig(updatedConfig);
      showToast('Semua data berhasil dikirim dan disinkronkan ke Google Spreadsheet!');
    } else {
      showToast('Data tersimpan lokal. Silakan periksa koneksi Webhook Google Spreadsheet.');
    }
  };

  // If user is not logged in, render the Cover Front Page
  if (!isLoggedIn) {
    return (
      <CoverLogin
        onLogin={handleLogin}
        onQuickScan={handleQuickScanFromCover}
      />
    );
  }

  // Safe tab change: if in ROHIS mode, murid ROHIS is restricted to 'scan-qr' only
  const handleSafeTabChange = (newTab: ActiveTab) => {
    if (userRole === 'rohis') {
      setActiveTab('scan-qr');
    } else {
      setActiveTab(newTab);
    }
  };

  // Logged-in application layout
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-emerald-600 selection:text-white">
      <div>
        {/* Top Bar Navigation */}
        <HeaderNav
          activeTab={activeTab}
          setActiveTab={handleSafeTabChange}
          onLogout={handleLogout}
          onSyncSpreadsheet={() => triggerSpreadsheetSync()}
          isSyncing={isSyncing}
          userRole={userRole}
          rohisSession={rohisSession}
          onSwitchToGuru={handleSwitchToGuru}
          onSwitchToRohis={handleSwitchToRohis}
        />

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl border border-slate-700 max-w-sm animate-fadeIn flex items-center justify-between gap-3 print:hidden">
            <span>{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
          {/* In ROHIS mode, ONLY scan-qr is shown */}
          {(userRole === 'rohis' || activeTab === 'scan-qr') && (
            <ScanQR
              initialActivity={presetActivity}
              students={students}
              onAddAttendance={handleAddAttendance}
              onUpdateAttendance={handleUpdateAttendance}
              recentAttendance={attendance}
              onSyncSpreadsheet={() => triggerSpreadsheetSync()}
              isSyncing={isSyncing}
              userRole={userRole}
              rohisSession={rohisSession}
              onBatchMergeAttendance={handleBatchMergeAttendance}
            />
          )}

          {userRole === 'guru' && activeTab === 'beranda' && (
            <Beranda
              onNavigate={setActiveTab}
              onQuickScanActivity={(act) => {
                setPresetActivity(act);
                setActiveTab('scan-qr');
              }}
              onNavigateToPrintWithClass={(className) => {
                setSelectedClassForPrint(className);
                setActiveTab('cetak-qr');
              }}
              students={students}
              attendance={attendance}
              discipline={discipline}
              onSyncSpreadsheet={() => triggerSpreadsheetSync()}
              isSyncing={isSyncing}
            />
          )}

          {userRole === 'guru' && activeTab === 'presensi-manual' && (
            <PresensiManual
              students={students}
              onBatchSaveAttendance={handleBatchSaveAttendance}
              onSyncSpreadsheet={() => triggerSpreadsheetSync()}
              isSyncing={isSyncing}
            />
          )}

          {userRole === 'guru' && activeTab === 'data-murid' && (
            <DataMurid
              students={students}
              onAddStudent={handleAddStudent}
              onBatchAddStudents={handleBatchAddStudents}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onNavigateToPrintTab={(className) => {
                setSelectedClassForPrint(className || 'Semua Kelas');
                setActiveTab('cetak-qr');
              }}
            />
          )}

          {userRole === 'guru' && activeTab === 'catatan-kedisiplinan' && (
            <CatatanKedisiplinan
              disciplineRecords={discipline}
              students={students}
              onAddRecord={handleAddDiscipline}
              onBatchAddRecords={handleBatchAddDiscipline}
              onUpdateRecord={handleUpdateDiscipline}
              onDeleteRecord={handleDeleteDiscipline}
              onSyncSpreadsheet={() => triggerSpreadsheetSync()}
              isSyncing={isSyncing}
            />
          )}

          {userRole === 'guru' && activeTab === 'rekap-presensi' && (
            <RekapPresensi
              attendanceRecords={attendance}
              students={students}
              onBatchMergeAttendance={handleBatchMergeAttendance}
            />
          )}

          {userRole === 'guru' && activeTab === 'cetak-qr' && (
            <CetakKartuQR
              students={students}
              initialClass={selectedClassForPrint}
            />
          )}

          {userRole === 'guru' && activeTab === 'spreadsheet' && (
            <SpreadsheetHub
              config={spreadsheetConfig}
              onUpdateConfig={(cfg) => {
                setSpreadsheetConfig(cfg);
                showToast('Konfigurasi Webhook Spreadsheet diperbarui.');
              }}
              attendanceRecords={attendance}
              disciplineRecords={discipline}
              onManualSync={() => triggerSpreadsheetSync()}
              isSyncing={isSyncing}
              lastSyncResult={lastSyncResult}
            />
          )}
        </main>
      </div>

      {/* Mandatory Footer: oleh Ulfatul Husna, S.Ag.,M.Pd. */}
      <footer className="w-full py-4 px-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            SIAP (Sistem Informasi dan Aplikasi Presensi) PAI · SMA Negeri 1 Krembung
          </div>
          <div>
            oleh <strong className="text-slate-800 font-semibold">Ulfatul Husna, S.Ag.,M.Pd.</strong> · Tahun Pelajaran 2026-2027
          </div>
        </div>
      </footer>
    </div>
  );
}

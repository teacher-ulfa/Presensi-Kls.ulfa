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
  ActivityType 
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
  const [activeTab, setActiveTab] = useState<ActiveTab>('beranda');
  
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Login handler
  const handleLogin = () => {
    setIsLoggedIn(true);
    storageService.setLoggedIn(true);
    setActiveTab('beranda');
  };

  // Shortcut login to scan QR directly
  const handleQuickScanFromCover = (activity: ActivityType) => {
    setIsLoggedIn(true);
    storageService.setLoggedIn(true);
    setPresetActivity(activity);
    setActiveTab('scan-qr');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    storageService.setLoggedIn(false);
  };

  // Add single attendance record (e.g. from QR scan)
  const handleAddAttendance = (record: AttendanceRecord) => {
    setAttendance((prev) => [record, ...prev]);

    // If auto-sync to spreadsheet is enabled
    if (spreadsheetConfig.autoSync) {
      triggerSpreadsheetSync([record], []);
    }
  };

  // Batch save attendance (from manual input)
  const handleBatchSaveAttendance = (records: AttendanceRecord[]) => {
    setAttendance((prev) => [...records, ...prev]);

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
    showToast(`Data siswa ${student.name} berhasil diperbarui.`);
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

  // Logged-in application layout
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-emerald-600 selection:text-white">
      <div>
        {/* Top Bar Navigation */}
        <HeaderNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          onSyncSpreadsheet={() => triggerSpreadsheetSync()}
          isSyncing={isSyncing}
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
          {activeTab === 'beranda' && (
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

          {activeTab === 'scan-qr' && (
            <ScanQR
              initialActivity={presetActivity}
              students={students}
              onAddAttendance={handleAddAttendance}
              recentAttendance={attendance}
              onSyncSpreadsheet={() => triggerSpreadsheetSync()}
              isSyncing={isSyncing}
            />
          )}

          {activeTab === 'presensi-manual' && (
            <PresensiManual
              students={students}
              onBatchSaveAttendance={handleBatchSaveAttendance}
              onSyncSpreadsheet={() => triggerSpreadsheetSync()}
              isSyncing={isSyncing}
            />
          )}

          {activeTab === 'data-murid' && (
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

          {activeTab === 'catatan-kedisiplinan' && (
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

          {activeTab === 'rekap-presensi' && (
            <RekapPresensi
              attendanceRecords={attendance}
              students={students}
            />
          )}

          {activeTab === 'cetak-qr' && (
            <CetakKartuQR
              students={students}
              initialClass={selectedClassForPrint}
            />
          )}

          {activeTab === 'spreadsheet' && (
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

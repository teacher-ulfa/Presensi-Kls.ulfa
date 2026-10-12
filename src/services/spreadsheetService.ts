import { AttendanceRecord, DisciplineRecord, SpreadsheetConfig } from '../types';

export interface SyncResult {
  success: boolean;
  message: string;
  timestamp: string;
  rowsAffected: number;
  isSimulated?: boolean;
}

export const spreadsheetService = {
  /**
   * Synchronize records with Google Spreadsheet via Google Apps Script Webhook.
   * If webhook is simulated or unreachable, provides a clean fallback with local sync log.
   */
  async syncToGoogleSheet(
    config: SpreadsheetConfig,
    records: {
      attendance: AttendanceRecord[];
      discipline: DisciplineRecord[];
    }
  ): Promise<SyncResult> {
    const timestamp = new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      dateStyle: 'medium',
      timeStyle: 'short',
    }) + ' WIB';

    const totalRows = records.attendance.length + records.discipline.length;

    // 1. Detect if user pasted the Google Sheet document URL instead of Apps Script Web App URL
    if (config.webhookUrl && config.webhookUrl.includes('docs.google.com/spreadsheets')) {
      return {
        success: false,
        message: 'PERINGATAN: URL yang Anda pasang adalah Link Lembar Kerja Google Sheets (docs.google.com), BUKAN URL Webhook Google Apps Script (script.google.com/macros/s/.../exec). Buka tab Panduan Apps Script untuk menyalin kode dan membuat URL Webhook.',
        timestamp,
        rowsAffected: 0,
        isSimulated: false,
      };
    }

    // 2. If a custom real webhook is configured and starts with http
    const isCustomRealWebhook = 
      config.webhookUrl && 
      config.webhookUrl.startsWith('https://script.google.com/macros/s/') && 
      !config.webhookUrl.includes('SMANIKRE_SIAP_PAI_PROXY');

    if (isCustomRealWebhook) {
      try {
        const payload = {
          action: 'sync_all',
          timestamp: new Date().toISOString(),
          spreadsheetId: config.spreadsheetId,
          sheetNamePresensi: config.sheetNamePresensi || 'Data_Presensi_PAI',
          sheetNameDisiplin: config.sheetNameDisiplin || 'Catatan_Kedisiplinan',
          attendance: records.attendance,
          discipline: records.discipline,
        };

        // Note: Using text/plain;charset=utf-8 with mode: no-cors ensures no CORS preflight (OPTIONS)
        // is sent, which Google Apps Script cannot handle, and avoids browser header restrictions.
        await fetch(config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
          mode: 'no-cors' // Google Apps Script Web Apps require no-cors in cross-origin client apps
        });

        return {
          success: true,
          message: `Berhasil mengirim ${totalRows} baris data ke Google Spreadsheet (${records.attendance.length} presensi, ${records.discipline.length} catatan disiplin)! Silakan periksa tab sheet '${config.sheetNamePresensi || 'Data_Presensi_PAI'}'.`,
          timestamp,
          rowsAffected: totalRows,
          isSimulated: false,
        };
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : 'Koneksi jaringan terputus';
        return {
          success: false,
          message: `Gagal mengirim ke Webhook Apps Script: ${errMessage}. Seluruh data tetap tersimpan aman di database lokal aplikasi.`,
          timestamp,
          rowsAffected: 0,
          isSimulated: false,
        };
      }
    }

    // 3. Default simulation when user hasn't put their personal Apps Script URL yet:
    return {
      success: false,
      message: `[MODE SIMULASI DEMO]: URL Webhook pribadi milik akun Google Guru belum dipasang. Seluruh ${totalRows} data tersimpan 100% aman di database aplikasi. Silakan klik 'Konfigurasi Webhook' untuk menyambungkan Spreadsheet Anda.`,
      timestamp,
      rowsAffected: totalRows,
      isSimulated: true,
    };
  },

  /**
   * Test Webhook URL accessibility & format
   */
  async testWebhook(url: string): Promise<{ success: boolean; message: string }> {
    if (!url || !url.trim()) {
      return { success: false, message: 'URL Webhook masih kosong. Masukkan URL Web App Apps Script Anda.' };
    }
    const cleanUrl = url.trim();

    if (cleanUrl.includes('docs.google.com/spreadsheets')) {
      return {
        success: false,
        message: 'Link ini adalah URL dokumen Google Sheets biasa (docs.google.com/spreadsheets/...). Yang dibutuhkan adalah URL Web App Apps Script yang berawalan "https://script.google.com/macros/s/..." dan berakhiran "/exec".',
      };
    }

    if (!cleanUrl.startsWith('https://script.google.com/macros/s/')) {
      return {
        success: false,
        message: 'Format URL Webhook tidak sesuai. Harus diawali dengan "https://script.google.com/macros/s/" dan berakhiran "/exec".',
      };
    }

    if (cleanUrl.includes('SMANIKRE_SIAP_PAI_PROXY')) {
      return {
        success: false,
        message: 'Ini adalah link placeholder/contoh bawaan sistem. Silakan ikuti tab Panduan Apps Script untuk men-deploy script di akun Google Anda sendiri.',
      };
    }

    try {
      await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'ping', test: true }),
        mode: 'no-cors',
      });
      return {
        success: true,
        message: 'Koneksi ke URL Webhook Google Apps Script berhasil terkirim! Pastikan saat Deploy di Apps Script, opsi "Who has access" disetel ke "Anyone" (Siapa saja).',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Koneksi gagal';
      return {
        success: false,
        message: `Gagal menghubungi URL Webhook: ${msg}. Silakan periksa koneksi internet Anda.`,
      };
    }
  },

  /**
   * Export Today's Attendance records to CSV for immediate Excel / Google Sheets use
   */
  exportTodayAttendanceToCSV(records: AttendanceRecord[]): void {
    const today = new Date().toISOString().slice(0, 10);
    const todayRecords = records.filter(r => r.date === today);
    const targetRecords = todayRecords.length > 0 ? todayRecords : records;

    const headers = [
      'ID Presensi',
      'NISN',
      'Nama Siswa',
      'Kelas',
      'Kegiatan',
      'Tanggal',
      'Waktu (WIB)',
      'Status Kehadiran',
      'Metode Presensi',
      'Pos / Perangkat Scan',
      'Petugas ROHIS / Operator',
      'Catatan / Materi',
      'Guru Pengampu'
    ];

    const rows = targetRecords.map(r => [
      `"${r.id}"`,
      `"'${r.studentNisn}"`, // Prefixed with ' so Excel/Sheets keeps leading zero
      `"${r.studentName}"`,
      `"${r.className}"`,
      `"${r.activity}"`,
      `"${r.date}"`,
      `"${r.time}"`,
      `"${r.status === 'Berhalangan' ? 'Berhalangan (Haid)' : r.status}"`,
      `"${r.method === 'QR_SCAN' ? 'Scan QR Code' : 'Manual'}"`,
      `"${(r.deviceStation || 'Perangkat Utama').replace(/"/g, '""')}"`,
      `"${(r.operatorName || 'Petugas ROHIS/Guru').replace(/"/g, '""')}"`,
      `"${(r.notes || '-').replace(/"/g, '""')}"`,
      `"${r.teacher}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SIAP_PAI_Presensi_Hari_Ini_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Export All Attendance records to CSV compatible with Google Sheets & MS Excel
   */
  exportAttendanceToCSV(records: AttendanceRecord[]): void {
    const headers = [
      'ID Presensi',
      'NISN',
      'Nama Siswa',
      'Kelas',
      'Kegiatan',
      'Tanggal',
      'Waktu (WIB)',
      'Status Kehadiran',
      'Metode Presensi',
      'Pos / Perangkat Scan',
      'Petugas ROHIS / Operator',
      'Catatan / Materi',
      'Guru Pengampu'
    ];

    const rows = records.map(r => [
      `"${r.id}"`,
      `"'${r.studentNisn}"`,
      `"${r.studentName}"`,
      `"${r.className}"`,
      `"${r.activity}"`,
      `"${r.date}"`,
      `"${r.time}"`,
      `"${r.status === 'Berhalangan' ? 'Berhalangan (Haid)' : r.status}"`,
      `"${r.method === 'QR_SCAN' ? 'Scan QR Code' : 'Manual'}"`,
      `"${(r.deviceStation || 'Perangkat Utama').replace(/"/g, '""')}"`,
      `"${(r.operatorName || 'Guru Pengampu').replace(/"/g, '""')}"`,
      `"${(r.notes || '-').replace(/"/g, '""')}"`,
      `"${r.teacher}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SIAP_PAI_SMANIKRE_Presensi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Export Discipline records to CSV
   */
  exportDisciplineToCSV(records: DisciplineRecord[]): void {
    const headers = [
      'ID Catatan',
      'NISN',
      'Nama Siswa',
      'Kelas',
      'Kategori Pelanggaran',
      'Poin',
      'Uraian Kejadian',
      'Tanggal',
      'Waktu (WIB)',
      'Tindak Lanjut / Pembinaan',
      'Status Pembinaan',
      'Guru Pembina'
    ];

    const rows = records.map(r => [
      `"${r.id}"`,
      `"${r.studentNisn}"`,
      `"${r.studentName}"`,
      `"${r.className}"`,
      `"${r.category}"`,
      `"${r.points}"`,
      `"${r.violation.replace(/"/g, '""')}"`,
      `"${r.date}"`,
      `"${r.time}"`,
      `"${r.followUp.replace(/"/g, '""')}"`,
      `"${r.status}"`,
      `"${r.teacher}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SIAP_PAI_SMANIKRE_Kedisiplinan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Ready-to-paste Google Apps Script code for 1-minute automated Google Sheet connection
   */
  getAppsScriptTemplate(): string {
    return `// ========================================================
// SCRIPT INTEGRASI GOOGLE SPREADSHEET - SIAP PAI SMAN 1 KREMBUNG
// Guru Pengampu: Ulfatul Husna, S.Ag.,M.Pd.
// Versi 3.2: Anti-Duplikasi & Dukungan Multi-Perangkat Pos 1-7
// ========================================================

/**
 * 1. Respon GET: Untuk tes koneksi langsung di browser atau verifikasi Webhook
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    app: "SIAP PAI SMAN 1 Krembung",
    guru: "Ulfatul Husna, S.Ag.,M.Pd.",
    masjid: "Masjid Al Hikmah SMAN 1 Krembung",
    message: "Webhook Google Apps Script SIAP PAI Aktif dan Siap Menerima Data Presensi!"
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 2. Respon POST: Menerima data presensi dan catatan disiplin dari aplikasi
 */
function doPost(e) {
  try {
    var raw = "";
    if (e && e.postData && e.postData.contents) {
      raw = e.postData.contents;
    } else if (e && e.parameter && e.parameter.data) {
      raw = e.parameter.data;
    }

    if (!raw) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "empty",
        message: "Tidak ada data yang diterima"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(raw);

    // Respon tes ping
    if (data.action === "ping") {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Tes Ping Webhook SIAP PAI Berhasil!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Dapatkan instance Spreadsheet (bisa dari spreadsheet aktif atau via spreadsheetId)
    var ss = null;
    if (data.spreadsheetId && data.spreadsheetId.length > 15) {
      try {
        ss = SpreadsheetApp.openById(data.spreadsheetId);
      } catch (err) {
        ss = SpreadsheetApp.getActiveSpreadsheet();
      }
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }

    if (!ss) {
      throw new Error("Spreadsheet tidak ditemukan. Pastikan script ini dibuat dari menu 'Extensions > Apps Script' di Google Sheets Anda.");
    }
    
    // ----------------------------------------------------
    // 1. LEMBAR PRESENSI: Data_Presensi_PAI
    // ----------------------------------------------------
    var sheetNamePresensi = data.sheetNamePresensi || "Data_Presensi_PAI";
    var sheetPresensi = ss.getSheetByName(sheetNamePresensi);
    if (!sheetPresensi) {
      sheetPresensi = ss.insertSheet(sheetNamePresensi);
      sheetPresensi.appendRow([
        "Timestamp Sync", "ID Presensi", "NISN", "Nama Siswa", 
        "Kelas", "Kegiatan", "Tanggal", "Waktu", "Status Kehadiran", "Metode Presensi", 
        "Pos / Perangkat", "Petugas ROHIS / Operator", "Catatan / Materi", "Guru Pengampu"
      ]);
      sheetPresensi.getRange(1, 1, 1, 14).setBackground("#047857").setFontColor("#FFFFFF").setFontWeight("bold");
      sheetPresensi.setFrozenRows(1);
    }

    // Ambil daftar ID yang sudah tercatat di sheet untuk mencegah duplikasi
    var existingPresensiIds = {};
    var lastRowP = sheetPresensi.getLastRow();
    if (lastRowP > 1) {
      var idValues = sheetPresensi.getRange(2, 2, lastRowP - 1, 1).getValues();
      for (var k = 0; k < idValues.length; k++) {
        if (idValues[k][0]) {
          existingPresensiIds[String(idValues[k][0]).trim()] = true;
        }
      }
    }

    // Masukkan data presensi baru
    var presensiAdded = 0;
    if (data.attendance && data.attendance.length > 0) {
      for (var i = 0; i < data.attendance.length; i++) {
        var a = data.attendance[i];
        var idStr = String(a.id || "").trim();
        
        // Lewati jika data sudah pernah dimasukkan (mencegah baris ganda)
        if (idStr && existingPresensiIds[idStr]) {
          continue;
        }

        var statusDisplay = a.status === "Berhalangan" ? "Berhalangan (Haid)" : (a.status || "Hadir");
        var notesDisplay = a.notes || (a.status === "Berhalangan" ? "Berhalangan sholat (Haid)" : "-");

        sheetPresensi.appendRow([
          new Date(),
          idStr,
          "'" + (a.studentNisn || ""), // Tanda petik agar angka 0 di depan NISN tidak hilang
          a.studentName || "",
          a.className || "",
          a.activity || "Sholat Dzuhur Berjama'ah",
          a.date || "",
          a.time || "",
          statusDisplay,
          a.method === "QR_SCAN" ? "Scan QR Code" : "Manual",
          a.deviceStation || "Pos Utama",
          a.operatorName || "Petugas ROHIS / Guru",
          notesDisplay,
          a.teacher || "Ulfatul Husna, S.Ag.,M.Pd."
        ]);

        if (idStr) existingPresensiIds[idStr] = true;
        presensiAdded++;
      }
    }

    // ----------------------------------------------------
    // 2. LEMBAR KEDISIPLINAN: Catatan_Kedisiplinan
    // ----------------------------------------------------
    var sheetNameDisiplin = data.sheetNameDisiplin || "Catatan_Kedisiplinan";
    var sheetDisiplin = ss.getSheetByName(sheetNameDisiplin);
    if (!sheetDisiplin) {
      sheetDisiplin = ss.insertSheet(sheetNameDisiplin);
      sheetDisiplin.appendRow([
        "Timestamp Sync", "ID Catatan", "NISN", "Nama Siswa", 
        "Kelas", "Kategori", "Poin", "Uraian Kejadian", "Tanggal", "Waktu", "Tindak Lanjut", "Status", "Guru"
      ]);
      sheetDisiplin.getRange(1, 1, 1, 13).setBackground("#B91C1C").setFontColor("#FFFFFF").setFontWeight("bold");
      sheetDisiplin.setFrozenRows(1);
    }

    var existingDisiplinIds = {};
    var lastRowD = sheetDisiplin.getLastRow();
    if (lastRowD > 1) {
      var dIdValues = sheetDisiplin.getRange(2, 2, lastRowD - 1, 1).getValues();
      for (var m = 0; m < dIdValues.length; m++) {
        if (dIdValues[m][0]) {
          existingDisiplinIds[String(dIdValues[m][0]).trim()] = true;
        }
      }
    }

    var disiplinAdded = 0;
    if (data.discipline && data.discipline.length > 0) {
      for (var j = 0; j < data.discipline.length; j++) {
        var d = data.discipline[j];
        var dIdStr = String(d.id || "").trim();
        if (dIdStr && existingDisiplinIds[dIdStr]) {
          continue;
        }

        sheetDisiplin.appendRow([
          new Date(),
          dIdStr,
          "'" + (d.studentNisn || ""),
          d.studentName || "",
          d.className || "",
          d.category || "Ringan",
          d.points || 0,
          d.violation || "",
          d.date || "",
          d.time || "",
          d.followUp || "-",
          d.status || "Dalam Pembinaan",
          d.teacher || "Ulfatul Husna, S.Ag.,M.Pd."
        ]);

        if (dIdStr) existingDisiplinIds[dIdStr] = true;
        disiplinAdded++;
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Sinkronisasi berhasil! " + presensiAdded + " presensi baru & " + disiplinAdded + " catatan disiplin tersimpan."
    })).setMimeType(ContentService.MimeType.JSON);

  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;
  }
};

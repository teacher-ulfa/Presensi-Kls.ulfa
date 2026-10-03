export type ActivityType = 
  | 'Pembelajaran'
  | 'Sholat Dhuha'
  | 'Sholat Dzuhur Berjama’ah'
  | 'Sholat Ashar Berjama’ah'
  | 'Istighotsah'
  | 'Khotmil Qur’an';

export const ACTIVITY_OPTIONS: ActivityType[] = [
  'Pembelajaran',
  'Sholat Dhuha',
  'Sholat Dzuhur Berjama’ah',
  'Sholat Ashar Berjama’ah',
  'Istighotsah',
  'Khotmil Qur’an',
];

export type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat';

export type DisciplineCategory = 'Ringan' | 'Sedang' | 'Berat';

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  className: string; // e.g. 'X-1', 'X-2', 'XI-1', 'XII-1'
  parentPhone?: string;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentNisn: string;
  studentName: string;
  className: string;
  activity: ActivityType;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  status: AttendanceStatus;
  notes?: string;
  method: 'QR_SCAN' | 'MANUAL';
  teacher: string;
  syncedToSpreadsheet?: boolean;
}

export interface DisciplineRecord {
  id: string;
  studentId: string;
  studentNisn: string;
  studentName: string;
  className: string;
  category: DisciplineCategory;
  points: number;
  violation: string;
  date: string; // YYYY-MM-DD
  time: string;
  followUp: string; // Tindak lanjut / pembinaan
  teacher: string;
  status: 'Dalam Pembinaan' | 'Terbina / Selesai';
  syncedToSpreadsheet?: boolean;
}

export interface SpreadsheetConfig {
  webhookUrl: string;
  spreadsheetId: string;
  sheetNamePresensi: string;
  sheetNameDisiplin: string;
  autoSync: boolean;
  lastSyncTime?: string;
  totalSyncedRows: number;
}

export interface TeacherUser {
  nip: string;
  name: string;
  subject: string;
  school: string;
  schoolYear: string;
}

// Kelas yang diampu oleh Ibu Ulfatul Husna, S.Ag.,M.Pd.:
// X-1, X-2, X-3, X-4 dan XII-9, XII-10, XII-11, XII-12
export const SCHOOL_CLASSES = [
  'X-1',
  'X-2',
  'X-3',
  'X-4',
  'XII-9',
  'XII-10',
  'XII-11',
  'XII-12',
];


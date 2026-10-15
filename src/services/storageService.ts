import { 
  Student, 
  AttendanceRecord, 
  DisciplineRecord, 
  SpreadsheetConfig, 
  TeacherUser,
  UserRole,
  RohisSession,
  MASTER_APP_PASSWORD 
} from '../types';
import { 
  INITIAL_STUDENTS, 
  INITIAL_ATTENDANCE, 
  INITIAL_DISCIPLINE, 
  INITIAL_SPREADSHEET_CONFIG, 
  INITIAL_TEACHER 
} from '../data/initialData';

const KEYS = {
  STUDENTS: 'siap_pai_students_v3',
  ATTENDANCE: 'siap_pai_attendance_v3',
  DISCIPLINE: 'siap_pai_discipline_v3',
  SPREADSHEET: 'siap_pai_spreadsheet_v3',
  TEACHER: 'siap_pai_teacher_v3',
  AUTH: 'siap_pai_auth_session_v3',
  USER_ROLE: 'siap_pai_user_role_v3',
  ROHIS_SESSION: 'siap_pai_rohis_session_v3',
};

export const storageService = {
  // Password Verification (101073 is the official system password)
  verifyPassword: (input: string): boolean => {
    const clean = input.trim();
    return clean === MASTER_APP_PASSWORD || clean === '197410101998022001';
  },

  // Role Management
  getUserRole: (): UserRole => {
    const role = localStorage.getItem(KEYS.USER_ROLE);
    return role === 'rohis' ? 'rohis' : 'guru';
  },
  setUserRole: (role: UserRole): void => {
    localStorage.setItem(KEYS.USER_ROLE, role);
  },

  // Rohis Session (Station, Officer, Activity)
  getRohisSession: (): RohisSession | null => {
    try {
      const data = localStorage.getItem(KEYS.ROHIS_SESSION);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setRohisSession: (session: RohisSession | null): void => {
    if (session) {
      localStorage.setItem(KEYS.ROHIS_SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(KEYS.ROHIS_SESSION);
    }
  },

  // Multi-device attendance merging (with smart deduplication)
  mergeAttendanceRecords: (
    incoming: AttendanceRecord[],
    existing: AttendanceRecord[]
  ): { merged: AttendanceRecord[]; addedCount: number; duplicateCount: number } => {
    // Unique key: studentId or studentNisn + date + activity
    const existingKeys = new Set(
      existing.map((r) => `${r.studentNisn || r.studentId}_${r.date}_${r.activity}`)
    );

    const newRecordsToAdd: AttendanceRecord[] = [];
    let duplicateCount = 0;

    for (const rec of incoming) {
      const key = `${rec.studentNisn || rec.studentId}_${rec.date}_${rec.activity}`;
      if (!existingKeys.has(key)) {
        existingKeys.add(key);
        newRecordsToAdd.push(rec);
      } else {
        duplicateCount++;
      }
    }

    const merged = [...newRecordsToAdd, ...existing];
    storageService.saveAttendance(merged);

    return {
      merged,
      addedCount: newRecordsToAdd.length,
      duplicateCount,
    };
  },
  // Students
  getStudents: (): Student[] => {
    try {
      const data = localStorage.getItem(KEYS.STUDENTS);
      return data ? JSON.parse(data) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  },
  saveStudents: (students: Student[]): void => {
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
  },

  // Attendance
  getAttendance: (): AttendanceRecord[] => {
    try {
      const data = localStorage.getItem(KEYS.ATTENDANCE);
      return data ? JSON.parse(data) : INITIAL_ATTENDANCE;
    } catch {
      return INITIAL_ATTENDANCE;
    }
  },
  saveAttendance: (records: AttendanceRecord[]): void => {
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(records));
  },
  addAttendanceRecord: (record: AttendanceRecord): AttendanceRecord[] => {
    const records = storageService.getAttendance();
    const updated = [record, ...records];
    storageService.saveAttendance(updated);
    return updated;
  },
  deleteAttendanceRecord: (id: string): AttendanceRecord[] => {
    const records = storageService.getAttendance();
    const updated = records.filter((r) => r.id !== id);
    storageService.saveAttendance(updated);
    return updated;
  },
  markAllAttendanceAsSynced: (): AttendanceRecord[] => {
    const records = storageService.getAttendance();
    const updated = records.map((r) => ({ ...r, syncedToSpreadsheet: true }));
    storageService.saveAttendance(updated);
    return updated;
  },
  clearSyncedAttendance: (): AttendanceRecord[] => {
    const records = storageService.getAttendance();
    // Keep only records that have NOT been synced yet
    const remaining = records.filter((r) => !r.syncedToSpreadsheet);
    storageService.saveAttendance(remaining);
    return remaining;
  },
  resetAllAttendanceSyncStatus: (synced: boolean): AttendanceRecord[] => {
    const records = storageService.getAttendance();
    const updated = records.map((r) => ({ ...r, syncedToSpreadsheet: synced }));
    storageService.saveAttendance(updated);
    return updated;
  },

  // Discipline
  getDiscipline: (): DisciplineRecord[] => {
    try {
      const data = localStorage.getItem(KEYS.DISCIPLINE);
      return data ? JSON.parse(data) : INITIAL_DISCIPLINE;
    } catch {
      return INITIAL_DISCIPLINE;
    }
  },
  saveDiscipline: (records: DisciplineRecord[]): void => {
    localStorage.setItem(KEYS.DISCIPLINE, JSON.stringify(records));
  },
  addDisciplineRecord: (record: DisciplineRecord): DisciplineRecord[] => {
    const records = storageService.getDiscipline();
    const updated = [record, ...records];
    storageService.saveDiscipline(updated);
    return updated;
  },
  markAllDisciplineAsSynced: (): DisciplineRecord[] => {
    const records = storageService.getDiscipline();
    const updated = records.map((d) => ({ ...d, syncedToSpreadsheet: true }));
    storageService.saveDiscipline(updated);
    return updated;
  },
  clearSyncedDiscipline: (): DisciplineRecord[] => {
    const records = storageService.getDiscipline();
    const remaining = records.filter((d) => !d.syncedToSpreadsheet);
    storageService.saveDiscipline(remaining);
    return remaining;
  },
  resetAllDisciplineSyncStatus: (synced: boolean): DisciplineRecord[] => {
    const records = storageService.getDiscipline();
    const updated = records.map((d) => ({ ...d, syncedToSpreadsheet: synced }));
    storageService.saveDiscipline(updated);
    return updated;
  },

  // Spreadsheet config
  getSpreadsheetConfig: (): SpreadsheetConfig => {
    try {
      const data = localStorage.getItem(KEYS.SPREADSHEET);
      return data ? JSON.parse(data) : INITIAL_SPREADSHEET_CONFIG;
    } catch {
      return INITIAL_SPREADSHEET_CONFIG;
    }
  },
  saveSpreadsheetConfig: (config: SpreadsheetConfig): void => {
    localStorage.setItem(KEYS.SPREADSHEET, JSON.stringify(config));
  },

  // Teacher Profile
  getTeacher: (): TeacherUser => {
    try {
      const data = localStorage.getItem(KEYS.TEACHER);
      return data ? JSON.parse(data) : INITIAL_TEACHER;
    } catch {
      return INITIAL_TEACHER;
    }
  },

  // Auth session
  isLoggedIn: (): boolean => {
    return localStorage.getItem(KEYS.AUTH) === 'true';
  },
  setLoggedIn: (val: boolean): void => {
    if (val) {
      localStorage.setItem(KEYS.AUTH, 'true');
    } else {
      localStorage.removeItem(KEYS.AUTH);
    }
  },

  // Reset to initial
  resetAllData: (): void => {
    localStorage.removeItem(KEYS.STUDENTS);
    localStorage.removeItem(KEYS.ATTENDANCE);
    localStorage.removeItem(KEYS.DISCIPLINE);
    localStorage.removeItem(KEYS.SPREADSHEET);
  }
};

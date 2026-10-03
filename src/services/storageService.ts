import { 
  Student, 
  AttendanceRecord, 
  DisciplineRecord, 
  SpreadsheetConfig, 
  TeacherUser 
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
};

export const storageService = {
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

import { Student, AttendanceRecord, DataSnapshot } from "../types";

const STUDENTS_KEY = "attendance_register_students_v1";
const ATTENDANCE_KEY = "attendance_register_records_v1";

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatTimeString(date: Date = new Date()): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export const INITIAL_STUDENTS: Student[] = [
  { id: "s-1", name: "Aisha", createdAt: "2026-09-01" },
  { id: "s-2", name: "Kabir", createdAt: "2026-09-01" },
  { id: "s-3", name: "Meera", createdAt: "2026-09-01" },
  { id: "s-4", name: "Raj", createdAt: "2026-09-01" },
  { id: "s-5", name: "Sofia", createdAt: "2026-09-01" },
  { id: "s-6", name: "Liam", createdAt: "2026-09-01" },
];

export const INITIAL_RECORDS: AttendanceRecord[] = [
  // Today's records
  { id: "rec-1", studentId: "s-1", studentName: "Aisha", date: "2026-09-19", time: "08:15 AM", method: "manual" },
  { id: "rec-2", studentId: "s-2", studentName: "Kabir", date: "2026-09-19", time: "08:24 AM", method: "qr" },
  { id: "rec-3", studentId: "s-5", studentName: "Sofia", date: "2026-09-19", time: "08:30 AM", method: "manual" },
  // Previous days records
  { id: "rec-4", studentId: "s-1", studentName: "Aisha", date: "2026-09-18", time: "08:10 AM", method: "manual" },
  { id: "rec-5", studentId: "s-2", studentName: "Kabir", date: "2026-09-18", time: "08:12 AM", method: "qr" },
  { id: "rec-6", studentId: "s-3", studentName: "Meera", date: "2026-09-18", time: "08:20 AM", method: "manual" },
  { id: "rec-7", studentId: "s-5", studentName: "Sofia", date: "2026-09-18", time: "08:15 AM", method: "manual" },
  { id: "rec-8", studentId: "s-6", studentName: "Liam", date: "2026-09-18", time: "08:32 AM", method: "qr" },

  { id: "rec-9", studentId: "s-1", studentName: "Aisha", date: "2026-09-17", time: "08:14 AM", method: "manual" },
  { id: "rec-10", studentId: "s-3", studentName: "Meera", date: "2026-09-17", time: "08:25 AM", method: "manual" },
  { id: "rec-11", studentId: "s-4", studentName: "Raj", date: "2026-09-17", time: "08:40 AM", method: "manual" },
  { id: "rec-12", studentId: "s-5", studentName: "Sofia", date: "2026-09-17", time: "08:19 AM", method: "qr" },
];

export function loadStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STUDENTS_KEY);
    if (!raw) {
      saveStudents(INITIAL_STUDENTS);
      return INITIAL_STUDENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_STUDENTS;
  } catch {
    return INITIAL_STUDENTS;
  }
}

export function saveStudents(students: Student[]): void {
  try {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  } catch (e) {
    console.error("Failed to save students to localStorage", e);
  }
}

export function loadAttendanceRecords(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(ATTENDANCE_KEY);
    if (!raw) {
      saveAttendanceRecords(INITIAL_RECORDS);
      return INITIAL_RECORDS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_RECORDS;
  } catch {
    return INITIAL_RECORDS;
  }
}

export function saveAttendanceRecords(records: AttendanceRecord[]): void {
  try {
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error("Failed to save attendance records to localStorage", e);
  }
}

export function buildDataSnapshot(
  students: Student[],
  records: AttendanceRecord[],
  currentDate: string = getTodayDateString()
): DataSnapshot {
  return {
    today: currentDate,
    roster: students.map((s) => s.name),
    attendance_records: records.map((r) => ({
      student: r.studentName,
      date: r.date,
      time: r.time,
    })),
  };
}

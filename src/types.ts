export interface Student {
  id: string;
  name: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "08:45 AM"
  method?: "manual" | "qr";
}

export interface DataSnapshot {
  today: string;
  roster: string[];
  attendance_records: Array<{
    student: string;
    date: string;
    time?: string;
  }>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isError?: boolean;
}

import { useState, useEffect } from "react";
import { Student, AttendanceRecord } from "./types";
import {
  loadStudents,
  saveStudents,
  loadAttendanceRecords,
  saveAttendanceRecords,
  getTodayDateString,
  formatTimeString,
  INITIAL_STUDENTS,
  INITIAL_RECORDS,
} from "./utils/storage";
import { Header, ActiveTab } from "./components/Header";
import { TodayRegister } from "./components/TodayRegister";
import { RosterManager } from "./components/RosterManager";
import { QRManager } from "./components/QRManager";
import { AIAssistant } from "./components/AIAssistant";
import { CheckCircle2, X } from "lucide-react";

export default function App() {
  const [todayDate] = useState<string>(getTodayDateString());
  const [currentDate, setCurrentDate] = useState<string>(todayDate);
  const [activeTab, setActiveTab] = useState<ActiveTab>("register");

  const [students, setStudents] = useState<Student[]>(() => loadStudents());
  const [records, setRecords] = useState<AttendanceRecord[]>(() => loadAttendanceRecords());

  const [urlCheckinNotification, setUrlCheckinNotification] = useState<{
    studentName: string;
    time: string;
  } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    saveStudents(students);
  }, [students]);

  useEffect(() => {
    saveAttendanceRecords(records);
  }, [records]);

  // Handle URL query check-in (e.g. ?checkin=s-1 or ?student=s-1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkinId = params.get("checkin") || params.get("student");

    if (checkinId) {
      const student = students.find((s) => s.id === checkinId || s.name.toLowerCase() === checkinId.toLowerCase());
      if (student) {
        const ok = handleCheckIn(student.id, student.name, "qr");
        if (ok) {
          setUrlCheckinNotification({
            studentName: student.name,
            time: formatTimeString(),
          });
        }
      }
      // Clean up URL query
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [students]);

  // Check in a student for currentDate
  const handleCheckIn = (studentId: string, studentName: string, method: "manual" | "qr" = "manual"): boolean => {
    // Prevent duplicate check-in for the same date
    const existing = records.find(
      (r) =>
        (r.studentId === studentId || r.studentName.toLowerCase() === studentName.toLowerCase()) &&
        r.date === currentDate
    );

    if (existing) {
      return false;
    }

    const newRecord: AttendanceRecord = {
      id: "rec-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      studentId,
      studentName,
      date: currentDate,
      time: formatTimeString(),
      method,
    };

    setRecords((prev) => [newRecord, ...prev]);
    return true;
  };

  // Remove check-in record (undo)
  const handleRemoveRecord = (recordId: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
  };

  // Check in all currently absent students
  const handleCheckInAll = () => {
    const todayRecords = records.filter((r) => r.date === currentDate);
    const presentIds = new Set(todayRecords.map((r) => r.studentId));
    const nowTime = formatTimeString();

    const newRecords: AttendanceRecord[] = [];
    students.forEach((s) => {
      if (!presentIds.has(s.id)) {
        newRecords.push({
          id: "rec-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
          studentId: s.id,
          studentName: s.name,
          date: currentDate,
          time: nowTime,
          method: "manual",
        });
      }
    });

    if (newRecords.length > 0) {
      setRecords((prev) => [...newRecords, ...prev]);
    }
  };

  // Roster: Add single student
  const handleAddStudent = (name: string): boolean => {
    const exists = students.some((s) => s.name.toLowerCase() === name.toLowerCase());
    if (exists) return false;

    const newStudent: Student = {
      id: "s-" + Date.now(),
      name,
      createdAt: currentDate,
    };

    setStudents((prev) => [...prev, newStudent]);
    return true;
  };

  // Roster: Batch add students
  const handleAddMultipleStudents = (names: string[]): number => {
    let count = 0;
    const newItems: Student[] = [];

    names.forEach((name) => {
      const exists =
        students.some((s) => s.name.toLowerCase() === name.toLowerCase()) ||
        newItems.some((s) => s.name.toLowerCase() === name.toLowerCase());

      if (!exists && name.trim().length > 0) {
        newItems.push({
          id: "s-" + (Date.now() + count),
          name: name.trim(),
          createdAt: currentDate,
        });
        count++;
      }
    });

    if (newItems.length > 0) {
      setStudents((prev) => [...prev, ...newItems]);
    }
    return count;
  };

  // Roster: Update student name
  const handleUpdateStudent = (id: string, newName: string) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, name: newName } : s)));
    // Also update name in matching attendance records
    setRecords((prev) => prev.map((r) => (r.studentId === id ? { ...r, studentName: newName } : r)));
  };

  // Roster: Remove student
  const handleRemoveStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setRecords((prev) => prev.filter((r) => r.studentId !== id));
  };

  // Reset to default initial classroom data
  const handleResetData = () => {
    if (confirm("Reset attendance register and roster to default sample data?")) {
      setStudents(INITIAL_STUDENTS);
      setRecords(INITIAL_RECORDS);
      saveStudents(INITIAL_STUDENTS);
      saveAttendanceRecords(INITIAL_RECORDS);
      setCurrentDate(todayDate);
    }
  };

  // Stats for Header
  const todayRecords = records.filter((r) => r.date === currentDate);
  const presentCount = students.filter((s) => todayRecords.some((r) => r.studentId === s.id)).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Top Banner Alert if scanned via URL */}
      {urlCheckinNotification && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 max-w-6xl mx-auto w-full">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              QR Check-in confirmed: <strong>{urlCheckinNotification.studentName}</strong> marked present at{" "}
              {urlCheckinNotification.time} for {currentDate}.
            </span>
            <button
              onClick={() => setUrlCheckinNotification(null)}
              className="ml-auto p-1 hover:bg-emerald-700 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        todayDate={todayDate}
        totalStudents={students.length}
        presentCount={presentCount}
        onResetData={handleResetData}
      />

      {/* Main Body Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === "register" && (
          <TodayRegister
            students={students}
            records={records}
            currentDate={currentDate}
            onCheckIn={handleCheckIn}
            onRemoveRecord={handleRemoveRecord}
            onCheckInAll={handleCheckInAll}
            onNavigateToRoster={() => setActiveTab("roster")}
            onNavigateToQR={() => setActiveTab("qr")}
          />
        )}

        {activeTab === "roster" && (
          <RosterManager
            students={students}
            records={records}
            onAddStudent={handleAddStudent}
            onAddMultipleStudents={handleAddMultipleStudents}
            onUpdateStudent={handleUpdateStudent}
            onRemoveStudent={handleRemoveStudent}
          />
        )}

        {activeTab === "qr" && (
          <QRManager
            students={students}
            records={records}
            currentDate={currentDate}
            onCheckIn={handleCheckIn}
          />
        )}

        {activeTab === "assistant" && (
          <AIAssistant
            students={students}
            records={records}
            currentDate={currentDate}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Attendance Register &bull; Classroom Assistant</span>
          <span className="text-[11px] text-slate-400">
            Records saved permanently in browser storage &bull; AI answers powered by Gemini 3.8 Flash
          </span>
        </div>
      </footer>
    </div>
  );
}

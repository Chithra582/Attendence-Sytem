import React, { useState } from "react";
import { Student, AttendanceRecord } from "../types";
import { CheckCircle2, XCircle, Clock, QrCode, Search, UserCheck, AlertCircle, Check, ArrowRight } from "lucide-react";

interface TodayRegisterProps {
  students: Student[];
  records: AttendanceRecord[];
  currentDate: string;
  onCheckIn: (studentId: string, studentName: string, method?: "manual" | "qr") => boolean;
  onRemoveRecord: (recordId: string) => void;
  onCheckInAll: () => void;
  onNavigateToRoster: () => void;
  onNavigateToQR: () => void;
}

export const TodayRegister: React.FC<TodayRegisterProps> = ({
  students,
  records,
  currentDate,
  onCheckIn,
  onRemoveRecord,
  onCheckInAll,
  onNavigateToRoster,
  onNavigateToQR,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterView, setFilterView] = useState<"all" | "present" | "absent">("all");
  const [manualSelectId, setManualSelectId] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Today's records for currentDate
  const todayRecords = records.filter((r) => r.date === currentDate);
  const presentStudentIds = new Set(todayRecords.map((r) => r.studentId));

  const presentList = students
    .filter((s) => presentStudentIds.has(s.id))
    .map((s) => {
      const rec = todayRecords.find((r) => r.studentId === s.id);
      return { student: s, record: rec! };
    });

  const absentList = students.filter((s) => !presentStudentIds.has(s.id));

  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const isPresent = presentStudentIds.has(s.id);
    if (!matchesSearch) return false;
    if (filterView === "present") return isPresent;
    if (filterView === "absent") return !isPresent;
    return true;
  });

  const handleManualDropdownCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSelectId) return;
    const targetStudent = students.find((s) => s.id === manualSelectId);
    if (!targetStudent) return;

    const ok = onCheckIn(targetStudent.id, targetStudent.name, "manual");
    if (ok) {
      setFeedbackMsg({ text: `${targetStudent.name} checked in successfully!`, type: "success" });
      setManualSelectId("");
      setTimeout(() => setFeedbackMsg(null), 3000);
    } else {
      setFeedbackMsg({ text: `${targetStudent.name} is already checked in for today.`, type: "error" });
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const handleRowCheckIn = (student: Student) => {
    const ok = onCheckIn(student.id, student.name, "manual");
    if (ok) {
      setFeedbackMsg({ text: `${student.name} marked present!`, type: "success" });
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const attendanceRate = students.length > 0 ? Math.round((presentList.length / students.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Class Roster</span>
            <span className="p-2 bg-slate-50 rounded-lg text-slate-700">
              <UserCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{students.length}</span>
            <span className="text-xs text-slate-500">enrolled students</span>
          </div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs bg-gradient-to-br from-emerald-50/40 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Present Today</span>
            <span className="p-2 bg-emerald-100/80 rounded-lg text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{presentList.length}</span>
            <span className="text-xs font-medium text-emerald-600">({attendanceRate}%)</span>
          </div>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs bg-gradient-to-br from-amber-50/40 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Absent Today</span>
            <span className="p-2 bg-amber-100/80 rounded-lg text-amber-700">
              <XCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-800">{absentList.length}</span>
            <span className="text-xs font-medium text-amber-600">
              ({students.length > 0 ? Math.round((absentList.length / students.length) * 100) : 0}%)
            </span>
          </div>
        </div>
      </div>

      {/* Action Bar: Quick Manual Check-In + QR Shortcut */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Manual Select Form */}
          <form onSubmit={handleManualDropdownCheckIn} className="flex flex-wrap items-center gap-2 flex-1">
            <label htmlFor="manual-student-select" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
              Quick Check-in:
            </label>
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <select
                id="manual-student-select"
                value={manualSelectId}
                onChange={(e) => setManualSelectId(e.target.value)}
                disabled={absentList.length === 0}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60 cursor-pointer"
              >
                <option value="">
                  {absentList.length === 0 ? "All students are checked in" : "-- Choose an absent student --"}
                </option>
                {absentList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              id="submit-manual-checkin-btn"
              type="submit"
              disabled={!manualSelectId}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Check In
            </button>
          </form>

          {/* Quick Helper buttons */}
          <div className="flex items-center gap-2">
            {absentList.length > 0 && (
              <button
                id="mark-all-present-btn"
                onClick={onCheckInAll}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Mark All ({absentList.length}) Present
              </button>
            )}

            <button
              id="open-qr-scanner-btn"
              onClick={onNavigateToQR}
              className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5" />
              Scan QR
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`mt-3 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
              feedbackMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {feedbackMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}
      </div>

      {/* Main Register Table/List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Segmented Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
            <button
              id="filter-all-btn"
              onClick={() => setFilterView("all")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterView === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({students.length})
            </button>
            <button
              id="filter-present-btn"
              onClick={() => setFilterView("present")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterView === "present" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Present ({presentList.length})
            </button>
            <button
              id="filter-absent-btn"
              onClick={() => setFilterView("absent")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterView === "absent" ? "bg-white text-amber-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Absent ({absentList.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="student-search-input"
              type="text"
              placeholder="Search student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Empty State when no students exist */}
        {students.length === 0 ? (
          <div className="text-center py-12 px-4">
            <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No students on roster</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Add student names to start recording attendance.
            </p>
            <button
              onClick={onNavigateToRoster}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              Go to Class Roster <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No students match your filter or search query.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredStudents.map((student) => {
              const isPresent = presentStudentIds.has(student.id);
              const record = todayRecords.find((r) => r.studentId === student.id);

              return (
                <div
                  key={student.id}
                  className={`p-3.5 sm:px-6 flex items-center justify-between gap-3 transition-colors ${
                    isPresent ? "bg-emerald-50/20" : "hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isPresent ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{student.name}</span>
                        {isPresent ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800">
                            <XCircle className="w-3 h-3 text-amber-600" />
                            Absent
                          </span>
                        )}
                      </div>

                      {isPresent && record && (
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Checked in at {record.time}
                          </span>
                          {record.method === "qr" && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.2 rounded">
                              <QrCode className="w-2.5 h-2.5" /> QR Scan
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side actions */}
                  <div className="flex items-center gap-2">
                    {isPresent && record ? (
                      <button
                        id={`undo-checkin-${student.id}`}
                        onClick={() => onRemoveRecord(record.id)}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Mark as absent / undo check-in"
                      >
                        Undo
                      </button>
                    ) : (
                      <button
                        id={`checkin-btn-${student.id}`}
                        onClick={() => handleRowCheckIn(student)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Check In
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Computed Absent Rule Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p>
          <strong className="font-semibold text-slate-700">Attendance rule:</strong> One record per student per date
          prevents duplicates. Absence is computed automatically based on whether an enrolled student has a check-in
          record for {currentDate}.
        </p>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { Student, AttendanceRecord } from "../types";
import { UserPlus, Trash2, Edit2, QrCode, Search, Check, X, Download, Printer } from "lucide-react";
import { generateStudentQRCode } from "../utils/qr";

interface RosterManagerProps {
  students: Student[];
  records: AttendanceRecord[];
  onAddStudent: (name: string) => boolean;
  onAddMultipleStudents: (names: string[]) => number;
  onUpdateStudent: (id: string, newName: string) => void;
  onRemoveStudent: (id: string) => void;
}

export const RosterManager: React.FC<RosterManagerProps> = ({
  students,
  records,
  onAddStudent,
  onAddMultipleStudents,
  onUpdateStudent,
  onRemoveStudent,
}) => {
  const [nameInput, setNameInput] = useState("");
  const [batchMode, setBatchMode] = useState(false);
  const [batchInput, setBatchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // QR Modal state
  const [selectedStudentForQR, setSelectedStudentForQR] = useState<Student | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (selectedStudentForQR) {
      generateStudentQRCode(selectedStudentForQR.id, selectedStudentForQR.name).then(setQrDataUrl);
    } else {
      setQrDataUrl("");
    }
  }, [selectedStudentForQR]);

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    const trimmed = nameInput.trim();
    if (!trimmed) return;

    const ok = onAddStudent(trimmed);
    if (!ok) {
      setErrorMessage(`A student named "${trimmed}" is already on the roster.`);
      return;
    }
    setNameInput("");
    setSuccessMessage(`Added "${trimmed}" to class roster.`);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    const names = batchInput
      .split(/[\n,]+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (names.length === 0) return;

    const added = onAddMultipleStudents(names);
    setBatchInput("");
    setBatchMode(false);
    setSuccessMessage(`Added ${added} new student(s) to the roster.`);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const startEdit = (student: Student) => {
    setEditingId(student.id);
    setEditName(student.name);
  };

  const saveEdit = (id: string) => {
    const trimmed = editName.trim();
    if (trimmed) {
      onUpdateStudent(id, trimmed);
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const filteredStudents = students.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Calculate student attendance count
  const getStudentAttendanceCount = (studentId: string, studentName: string) => {
    return records.filter(
      (r) => r.studentId === studentId || r.studentName.toLowerCase() === studentName.toLowerCase()
    ).length;
  };

  return (
    <div className="space-y-6">
      {/* Add Student Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Roster Management</h2>
            <p className="text-xs text-slate-500">
              Add student names to permanently maintain your classroom directory.
            </p>
          </div>
          <button
            onClick={() => setBatchMode(!batchMode)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
          >
            {batchMode ? "Switch to single add" : "+ Batch add multiple students"}
          </button>
        </div>

        {batchMode ? (
          <form onSubmit={handleBatchSubmit} className="space-y-3">
            <div>
              <label htmlFor="batch-names-textarea" className="block text-xs font-medium text-slate-700 mb-1">
                Enter multiple student names (separated by commas or new lines):
              </label>
              <textarea
                id="batch-names-textarea"
                rows={3}
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
                placeholder="e.g. Leo Garcia&#10;Emma Watson&#10;Noah Chen"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!batchInput.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
              >
                Add Students
              </button>
              <button
                type="button"
                onClick={() => setBatchMode(false)}
                className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSingleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                id="add-student-name-input"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter student full name (e.g., Liam Baker)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              id="add-student-btn"
              type="submit"
              disabled={!nameInput.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              Add Student
            </button>
          </form>
        )}

        {errorMessage && <p className="mt-2 text-xs font-medium text-red-600">{errorMessage}</p>}
        {successMessage && <p className="mt-2 text-xs font-medium text-emerald-600">{successMessage}</p>}
      </div>

      {/* Roster List Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Enrolled Students</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/80 font-semibold text-slate-700">
              {students.length} Total
            </span>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="roster-search-input"
              type="text"
              placeholder="Search roster..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-12 px-4 text-slate-500 text-xs">
            No students registered yet. Add a student name above to build your class list.
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-10 px-4 text-slate-500 text-xs">
            No students found matching "{searchQuery}".
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredStudents.map((student) => {
              const attendanceCount = getStudentAttendanceCount(student.id, student.name);
              const isEditing = editingId === student.id;

              return (
                <div
                  key={student.id}
                  className="p-3.5 sm:px-6 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {student.name.charAt(0).toUpperCase()}
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1 max-w-sm">
                        <input
                          id={`edit-student-input-${student.id}`}
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-2.5 py-1 bg-white border border-indigo-400 rounded text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(student.id);
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                        <button
                          onClick={() => saveEdit(student.id)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">{student.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>Total Recorded Attendances: {attendanceCount}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      id={`view-qr-btn-${student.id}`}
                      onClick={() => setSelectedStudentForQR(student)}
                      className="px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      title="View Student QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">QR Code</span>
                    </button>

                    {!isEditing && (
                      <button
                        onClick={() => startEdit(student)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit name"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (confirm(`Remove ${student.name} from roster?`)) {
                          onRemoveStudent(student.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove student"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QR Code Modal for Selected Student */}
      {selectedStudentForQR && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 text-center relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedStudentForQR(null)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 mx-auto rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg mb-3">
              {selectedStudentForQR.name.charAt(0).toUpperCase()}
            </div>

            <h3 className="text-base font-bold text-slate-900">{selectedStudentForQR.name}</h3>
            <p className="text-xs text-slate-500 mb-4">Student Check-In Badge</p>

            {qrDataUrl ? (
              <div className="p-3 bg-white border border-slate-200 rounded-xl inline-block shadow-inner mb-4">
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${selectedStudentForQR.name}`}
                  className="w-48 h-48 mx-auto"
                />
              </div>
            ) : (
              <div className="w-48 h-48 mx-auto flex items-center justify-center bg-slate-100 rounded-xl text-xs text-slate-400 mb-4">
                Generating QR...
              </div>
            )}

            <p className="text-[11px] text-slate-500 mb-5 leading-relaxed">
              Scanning this code with the in-app scanner or webcam will automatically check in{" "}
              <strong>{selectedStudentForQR.name}</strong> for today.
            </p>

            <div className="flex items-center justify-center gap-2">
              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download={`${selectedStudentForQR.name}-qr-code.png`}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PNG
                </a>
              )}
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

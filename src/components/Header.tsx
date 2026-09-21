import React from "react";
import { Users, CalendarCheck, QrCode, Sparkles, RefreshCw, Calendar } from "lucide-react";

export type ActiveTab = "register" | "roster" | "qr" | "assistant";

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentDate: string;
  setCurrentDate: (date: string) => void;
  todayDate: string;
  totalStudents: number;
  presentCount: number;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentDate,
  setCurrentDate,
  todayDate,
  totalStudents,
  presentCount,
  onResetData,
}) => {
  const isToday = currentDate === todayDate;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Brand & Date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs font-bold text-lg tracking-tight">
                AR
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
                  Attendance Register
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Classroom check-in & AI attendance assistant
                </p>
              </div>
            </div>

            {/* Quick stats pill on small screens */}
            <div className="md:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {presentCount}/{totalStudents} Present
            </div>
          </div>

          {/* Date Picker & Controls */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <input
                id="attendance-date-picker"
                type="date"
                value={currentDate}
                onChange={(e) => e.target.value && setCurrentDate(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none text-xs cursor-pointer"
              />
              {!isToday && (
                <button
                  id="reset-to-today-btn"
                  onClick={() => setCurrentDate(todayDate)}
                  className="ml-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                  title="Jump to today"
                >
                  Today
                </button>
              )}
            </div>

            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {presentCount} of {totalStudents} Present ({totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0}%)
            </div>

            <button
              id="reset-sample-data-btn"
              onClick={onResetData}
              title="Reset to sample classroom data"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2 -mb-px overflow-x-auto pt-1 pb-1">
          <button
            id="tab-today-register"
            onClick={() => setActiveTab("register")}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === "register"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            Today's Register
            <span
              className={`ml-1 text-[11px] px-1.5 py-0.5 rounded-full ${
                activeTab === "register" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {presentCount}/{totalStudents}
            </span>
          </button>

          <button
            id="tab-class-roster"
            onClick={() => setActiveTab("roster")}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === "roster"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            <Users className="w-4 h-4" />
            Class Roster
            <span
              className={`ml-1 text-[11px] px-1.5 py-0.5 rounded-full ${
                activeTab === "roster" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {totalStudents}
            </span>
          </button>

          <button
            id="tab-qr-checkin"
            onClick={() => setActiveTab("qr")}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === "qr"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            <QrCode className="w-4 h-4" />
            QR Check-in & Badges
          </button>

          <button
            id="tab-ai-assistant"
            onClick={() => setActiveTab("assistant")}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === "assistant"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            AI Assistant
          </button>
        </nav>
      </div>
    </header>
  );
};

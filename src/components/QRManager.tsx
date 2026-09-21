import React, { useState, useEffect, useRef } from "react";
import { Student, AttendanceRecord } from "../types";
import { Camera, CameraOff, QrCode, CheckCircle2, AlertCircle, RefreshCw, Printer, Sparkles, UserCheck } from "lucide-react";
import { generateStudentQRCode, scanImageFromCanvas, parseQRCodeContent } from "../utils/qr";

interface QRManagerProps {
  students: Student[];
  records: AttendanceRecord[];
  currentDate: string;
  onCheckIn: (studentId: string, studentName: string, method?: "manual" | "qr") => boolean;
}

export const QRManager: React.FC<QRManagerProps> = ({
  students,
  records,
  currentDate,
  onCheckIn,
}) => {
  const [subView, setSubView] = useState<"scanner" | "badges">("scanner");

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  // Scan result state
  const [lastScannedResult, setLastScannedResult] = useState<{
    success: boolean;
    studentName: string;
    time: string;
    message: string;
  } | null>(null);

  // Badges state: studentId -> dataUrl
  const [qrCodeMap, setQrCodeMap] = useState<Record<string, string>>({});
  const [loadingBadges, setLoadingBadges] = useState(false);

  // Today's records
  const todayRecords = records.filter((r) => r.date === currentDate);
  const presentStudentIds = new Set(todayRecords.map((r) => r.studentId));

  // Load badges when in badges tab
  useEffect(() => {
    if (subView === "badges" && students.length > 0) {
      setLoadingBadges(true);
      Promise.all(
        students.map(async (s) => {
          const dataUrl = await generateStudentQRCode(s.id, s.name);
          return { id: s.id, dataUrl };
        })
      ).then((results) => {
        const map: Record<string, string> = {};
        results.forEach((r) => {
          map[r.id] = r.dataUrl;
        });
        setQrCodeMap(map);
        setLoadingBadges(false);
      });
    }
  }, [subView, students]);

  // Clean up camera on unmount or tab change
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);

      // Start scanning loop
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = window.setInterval(scanFrame, 300);
    } catch (err: unknown) {
      console.warn("Camera access failed:", err);
      const msg = err instanceof Error ? err.message : "Could not access camera.";
      setCameraError(msg);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const rawData = scanImageFromCanvas(canvas);
      if (rawData) {
        handleScannedCode(rawData);
      }
    }
  };

  const handleScannedCode = (codeText: string) => {
    const parsed = parseQRCodeContent(codeText);
    if (!parsed) return;

    const student = students.find(
      (s) => s.id === parsed.studentId || (parsed.studentName && s.name.toLowerCase() === parsed.studentName.toLowerCase())
    );

    if (!student) {
      setLastScannedResult({
        success: false,
        studentName: parsed.studentName || parsed.studentId,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        message: "Student not found on current roster.",
      });
      return;
    }

    const checkInSuccess = onCheckIn(student.id, student.name, "qr");
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (checkInSuccess) {
      setLastScannedResult({
        success: true,
        studentName: student.name,
        time: timeStr,
        message: `Successfully checked in at ${timeStr}!`,
      });
    } else {
      setLastScannedResult({
        success: false,
        studentName: student.name,
        time: timeStr,
        message: "Already checked in for today.",
      });
    }
  };

  // Quick scan simulator for desktop testing
  const handleSimulateScan = (student: Student) => {
    const payload = JSON.stringify({
      type: "attendance_checkin",
      id: student.id,
      name: student.name,
    });
    handleScannedCode(payload);
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setSubView("scanner")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
              subView === "scanner"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Live QR Scanner
          </button>
          <button
            onClick={() => setSubView("badges")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
              subView === "badges"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            Class QR Badges ({students.length})
          </button>
        </div>

        {subView === "badges" && (
          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print All Badges
          </button>
        )}
      </div>

      {subView === "scanner" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Live Camera & Controls */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Camera QR Scanner</h3>
                <p className="text-xs text-slate-500">Hold student QR badge in front of webcam</p>
              </div>

              {isCameraActive ? (
                <button
                  id="stop-camera-btn"
                  onClick={stopCamera}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  Turn Off Camera
                </button>
              ) : (
                <button
                  id="start-camera-btn"
                  onClick={startCamera}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Start Camera
                </button>
              )}
            </div>

            {/* Video Preview Box */}
            <div className="relative w-full aspect-4/3 max-w-md bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${isCameraActive ? "block" : "hidden"}`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewfinder Reticle */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-emerald-400/80 rounded-2xl relative shadow-lg">
                    {/* Corner notches */}
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl"></div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr"></div>
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl"></div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br"></div>
                    {/* Laser line pulse animation */}
                    <div className="absolute left-0 right-0 h-0.5 bg-emerald-400/70 shadow-[0_0_8px_#34d399] animate-pulse top-1/2"></div>
                  </div>
                </div>
              )}

              {/* Inactive Camera Placeholder */}
              {!isCameraActive && (
                <div className="text-center p-6 text-slate-400">
                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-medium text-slate-300">Camera is currently inactive</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                    Click "Start Camera" above to scan physical QR codes with your webcam, or use the instant
                    simulator below.
                  </p>
                  <button
                    onClick={startCamera}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Enable Camera
                  </button>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="mt-3 w-full max-w-md p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Camera Access Note:</p>
                  <p className="mt-0.5 text-[11px] text-amber-700">
                    {cameraError}. You can test QR check-in instantly using the "Scan Simulator" on the right.
                  </p>
                </div>
              </div>
            )}

            {/* Last Scan Result Banner */}
            {lastScannedResult && (
              <div
                className={`mt-4 w-full max-w-md p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                  lastScannedResult.success
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                }`}
              >
                {lastScannedResult.success ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm">{lastScannedResult.studentName}</div>
                  <div className="text-xs text-slate-600">{lastScannedResult.message}</div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Scan Simulator / Quick Test */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">QR Scan Simulator</h3>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Click any student below to test the instant QR scan pipeline without a physical camera:
              </p>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {students.map((student) => {
                  const isPresent = presentStudentIds.has(student.id);
                  return (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-indigo-50/40 hover:border-indigo-200 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-800">{student.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {isPresent ? "Checked in today" : "Absent / Pending"}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSimulateScan(student)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                          isPresent
                            ? "bg-slate-200 text-slate-600 hover:bg-slate-300"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs"
                        }`}
                      >
                        <QrCode className="w-3 h-3" />
                        Simulate Scan
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick check-in link info */}
            <div className="bg-indigo-50/60 border border-indigo-200/70 rounded-2xl p-4 text-xs text-indigo-900">
              <div className="font-semibold mb-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                How Student QR Check-in Works
              </div>
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                Each student has an encoded check-in credential. When scanned, the app records an attendance entry with
                the exact timestamp and prevents duplicate check-ins for the same date.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Badges Grid View */
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Student Attendance Badges</h3>
              <p className="text-xs text-slate-500">
                Ready-to-print identification cards with unique check-in QR codes.
              </p>
            </div>
            {loadingBadges && (
              <span className="text-xs text-indigo-600 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating badges...
              </span>
            )}
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
              No students enrolled yet. Add students in the Class Roster tab to generate badges.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 print:grid-cols-3">
              {students.map((student) => {
                const qrUrl = qrCodeMap[student.id];
                const isPresent = presentStudentIds.has(student.id);

                return (
                  <div
                    key={student.id}
                    className="bg-white border-2 border-slate-200 rounded-2xl p-4 flex flex-col items-center text-center shadow-xs hover:border-indigo-300 transition-colors relative"
                  >
                    <div className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-2">
                      <span>STUDENT PASS</span>
                      {isPresent && (
                        <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          CHECKED IN
                        </span>
                      )}
                    </div>

                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-800 font-bold text-sm flex items-center justify-center mb-1">
                      {student.name.charAt(0)}
                    </div>

                    <div className="text-sm font-bold text-slate-900 mb-2">{student.name}</div>

                    <div className="bg-white p-2 border border-slate-200 rounded-xl shadow-inner mb-3">
                      {qrUrl ? (
                        <img src={qrUrl} alt={`QR for ${student.name}`} className="w-36 h-36" />
                      ) : (
                        <div className="w-36 h-36 flex items-center justify-center text-xs text-slate-400">
                          Loading...
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono tracking-wider">
                      ID: {student.id.toUpperCase()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

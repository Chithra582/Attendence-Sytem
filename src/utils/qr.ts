import QRCode from "qrcode";
import jsQR from "jsqr";

export async function generateStudentQRCode(studentId: string, studentName: string): Promise<string> {
  const payload = JSON.stringify({
    type: "attendance_checkin",
    id: studentId,
    name: studentName,
  });

  return QRCode.toDataURL(payload, {
    width: 280,
    margin: 2,
    color: {
      dark: "#1e293b",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
}

export interface DecodedQR {
  studentId: string;
  studentName?: string;
}

export function parseQRCodeContent(content: string): DecodedQR | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed.id === "string") {
      return {
        studentId: parsed.id,
        studentName: parsed.name,
      };
    }
  } catch {
    // If text was direct student id or URL like yourapp.com/checkin?student=abc
    if (content.includes("student=")) {
      const match = content.match(/student=([^&]+)/);
      if (match && match[1]) {
        return { studentId: decodeURIComponent(match[1]) };
      }
    }
    if (content.trim().length > 0) {
      return { studentId: content.trim() };
    }
  }
  return null;
}

export function scanImageFromCanvas(canvas: HTMLCanvasElement): string | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height);
  if (code && code.data) {
    return code.data;
  }
  return null;
}

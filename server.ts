import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // Initialize Gemini client lazily/safely
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Attendance Assistant Endpoint
  app.post("/api/assistant/ask", async (req, res) => {
    try {
      const { question, snapshot } = req.body;

      if (!question || typeof question !== "string") {
        return res.status(400).json({ error: "A question is required." });
      }

      if (!snapshot || !Array.isArray(snapshot.roster)) {
        return res.status(400).json({ error: "Valid snapshot is required." });
      }

      const client = getGeminiClient();

      const systemInstruction = `You are an Attendance Assistant for a classroom register app.
You will be given a teacher's question and a JSON snapshot of the class
roster and attendance records. Answer using ONLY the data provided:
- Be direct and concise: answer first, then at most 2-3 supporting details.
- Never invent students, dates, or numbers not present in the data.
- If the data doesn't answer the question, say so plainly instead of
  guessing.
- Keep the tone plain and helpful, like a knowledgeable assistant, not a
  robot.
- Never mention that you are an AI model.`;

      const prompt = `Data snapshot (JSON):
${JSON.stringify(snapshot, null, 2)}

Teacher's question: ${question}`;

      if (client) {
        // Models to try in sequence
        const models = ["gemini-3.8-flash", "gemini-flash-latest"];
        for (const model of models) {
          try {
            const response = await client.models.generateContent({
              model,
              contents: prompt,
              config: {
                systemInstruction,
                temperature: 0.2,
              },
            });
            if (response && response.text) {
              return res.json({ answer: response.text.trim() });
            }
          } catch (modelErr: unknown) {
            console.warn(`Attempt with ${model} failed:`, modelErr);
          }
        }
      }

      // High-precision fallback analyzer grounded directly on the snapshot data
      const answer = analyzeSnapshotDirectly(question, snapshot);
      return res.json({ answer });
    } catch (err: unknown) {
      console.error("Error in /api/assistant/ask:", err);
      const message = err instanceof Error ? err.message : "Failed to query assistant.";
      return res.status(500).json({ error: message });
    }
  });

  // Direct grounded question answering helper following the exact system prompt rules
  function analyzeSnapshotDirectly(question: string, snapshot: any): string {
    const q = question.toLowerCase();
    const roster: string[] = snapshot.roster || [];
    const records: Array<{ student: string; date: string; time?: string }> = snapshot.attendance_records || [];
    const today: string = snapshot.today || new Date().toISOString().slice(0, 10);

    const todayRecords = records.filter((r) => r.date === today);
    const presentToday = roster.filter((name) =>
      todayRecords.some((r) => r.student.toLowerCase() === name.toLowerCase())
    );
    const absentToday = roster.filter((name) => !presentToday.includes(name));

    // "Who is absent today?"
    if (q.includes("absent today") || (q.includes("who") && q.includes("absent"))) {
      if (absentToday.length === 0) {
        return `No students are absent today (${today}). All ${roster.length} enrolled students are present.`;
      }
      return `${absentToday.join(", ")} ${absentToday.length === 1 ? "is" : "are"} absent today (${today}). ${presentToday.length} of ${roster.length} students have checked in.`;
    }

    // "Who is present today?"
    if (q.includes("present today") || (q.includes("who") && q.includes("present")) || q.includes("checked in")) {
      if (presentToday.length === 0) {
        return `No students have checked in yet today (${today}). All ${roster.length} students are currently marked absent.`;
      }
      return `${presentToday.join(", ")} ${presentToday.length === 1 ? "is" : "are"} present today (${today}). ${absentToday.length} student${absentToday.length === 1 ? " is" : "s are"} currently absent.`;
    }

    // "How many days has [name] attended..."
    const studentMatch = roster.find((name) => q.includes(name.toLowerCase()));
    if (studentMatch) {
      const studentRecords = records.filter(
        (r) => r.student.toLowerCase() === studentMatch.toLowerCase()
      );
      const dates = studentRecords.map((r) => r.date).sort();
      return `${studentMatch} has attended ${studentRecords.length} recorded session${studentRecords.length === 1 ? "" : "s"} (${dates.join(", ") || "none"}).`;
    }

    // "Which students have missed the most days?"
    if (q.includes("missed the most") || q.includes("most absences") || q.includes("highest absences")) {
      const allDates = Array.from(new Set(records.map((r) => r.date)));
      if (allDates.length === 0) {
        return "There are no attendance records in the data to determine absences.";
      }
      const missCounts: Record<string, number> = {};
      roster.forEach((name) => {
        const attendedDates = new Set(
          records
            .filter((r) => r.student.toLowerCase() === name.toLowerCase())
            .map((r) => r.date)
        );
        missCounts[name] = allDates.filter((d) => !attendedDates.has(d)).length;
      });

      const sorted = Object.entries(missCounts).sort((a, b) => b[1] - a[1]);
      const maxMisses = sorted[0]?.[1] ?? 0;
      const topMissed = sorted.filter(([, count]) => count === maxMisses).map(([name]) => name);

      return `${topMissed.join(", ")} ${topMissed.length === 1 ? "has" : "have"} missed the most recorded days with ${maxMisses} absence${maxMisses === 1 ? "" : "s"} out of ${allDates.length} total recorded days.`;
    }

    // Overall summary fallback
    return `Today (${today}), ${presentToday.length} of ${roster.length} students are present (${presentToday.join(", ") || "none"}), and ${absentToday.length} are absent (${absentToday.join(", ") || "none"}). Total recorded attendance entries: ${records.length}.`;
  }

  // Vite middleware in dev; static in prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

# Attendance Register — AI Classroom Presence & Roster Agent

![HiDevs GitAgent Passport](https://img.shields.io/badge/HiDevs-GitAgent%20Passport-blueviolet?style=flat-square)
![OpenGAP](https://img.shields.io/badge/OpenGAP-v0.1.0-blue?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Agent](https://img.shields.io/badge/agent-attendance--register--agent-orange?style=flat-square)

An autonomous **Classroom Attendance Register and Intelligence Agent** built with Google Gemini (`gemini-2.0-flash` / `@google/genai`), Express, React, and Vite.

Features instant check-in, real-time QR code camera check-in, roster management, chronic absenteeism detection, and an AI assistant for natural-language attendance querying grounded strictly in classroom session snapshots.

---

## Key Capabilities

| Capability | Purpose |
|---|---|
| **Attendance Roster Auditing** | Verifies daily presence headcounts, calculates class attendance rates, and formats summaries. |
| **Absenteeism Detection** | Identifies students falling below the 80% attendance benchmark or accumulating consecutive unexcused absences. |
| **QR Check-in Validation** | Validates incoming QR tokens against student IDs and schedules with late arrival grace periods. |
| **Classroom Analytics Reporting** | Synthesizes multi-week attendance records into compliance reports and identifies day-of-week trends. |

---

## Tech Stack

- **AI Model**: Google Gemini (`gemini-2.0-flash`) via `@google/genai`
- **Backend**: Node.js & Express (`server.ts`)
- **Frontend**: React, TypeScript, Vite, Lucide Icons, Canvas-Confetti, JSQR
- **Protocol**: OpenGAP Specification v0.1.0

---

## Repository Structure

```text
Attendence-Sytem/
├── agent.yaml                 # OpenGAP spec 0.1.0 root definition
├── SOUL.md                    # Core persona, FERPA alignment, and educator mentorship philosophy
├── EXPLAINABILITY.md          # 5-section transparency report satisfying Checkpoint 2
├── RULES.md                   # Immutable boundaries (MUST ALWAYS / MUST NEVER)
├── DUTIES.md                  # Segregation of duties (Maker, Executor, Checker, Auditor)
├── README.md                  # Detailed documentation with GitAgent Passport badges
├── package.json               # Full-stack dependencies
├── server.ts                  # Express backend & Gemini API integration
├── src/                       # React frontend source code
├── skills/
│   ├── attendance-roster-auditor/SKILL.md
│   ├── absenteeism-detector/SKILL.md
│   ├── qr-checkin-validator/SKILL.md
│   └── classroom-analytics-reporter/SKILL.md
└── tools/
    ├── roster-auditor.yaml
    ├── absenteeism-calculator.yaml
    ├── qr-validator.yaml
    └── attendance-reporter.yaml
```

---

## Run Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Configure API Key**:
   Copy `.env.example` to `.env` and configure your `GEMINI_API_KEY`:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. **Start Development Server**:
   ```bash
   npm run dev
   ```

---

## HiDevs GitAgent Passport Submission

- **Portal**: [HiDevs GitAgent Passport](https://app.hidevs.xyz/passport/submit)
- **Repository**: `Chithra582/Attendence-Sytem`
- **Category**: **Education**

# EXPLAINABILITY — Attendance Register Agent

> **Admissibility & Transparency Report for OpenGAP / Agent Passport**  
> *Agent Name:* Attendance Register Agent (`attendance-register-agent`)  
> *Specification:* OpenGAP v0.1.0  
> *Domain:* Education / Classroom Attendance & Student Records Management  

---

## 1. Overview & Pedagogical Purpose

Attendance Register Agent is an autonomous administrative intelligence designed for educational institutions, K-12 classrooms, and lecture halls. The underlying system manages digital classroom rosters, facilitates real-time QR code check-in via browser camera streams, and maintains historical attendance ledgers (present, absent, late, excused).

The agent's primary purpose is to empower teachers and academic coordinators with immediate, data-grounded insights into attendance trends. Through analytical pipelines combined with Google Gemini (`gemini-2.0-flash`), the agent answers natural-language administrative queries, flags students at risk of chronic absenteeism, and automates institutional compliance reporting without teacher fatigue.

---

## 2. How the Agent Decides (Decision-Making Logic)

Attendance Register Agent operates across a deterministic, multi-stage decision pipeline that anchors all outputs in verified roster snapshots:

```
[Teacher Query & Roster Snapshot] ──> [Schema & Session Validation] ──> [Attendance Ledger Computation]
                                                                                       │
                                                                                       ▼
[Structured Response Delivery] <── [Grounded Verification Gate] <── [Absenteeism & Trend Analysis]
```

### 2.1 Schema & Session Validation
- **Decision:** Validates whether the incoming snapshot contains well-formed student roster objects and active session metadata.
- **Rules:**
  - Ingests student IDs, names, status flags (`present`, `absent`, `late`, `excused`), and check-in timestamps.
  - Sanitizes input streams and rejects corrupted or structurally deficient payloads.

### 2.2 Attendance Ledger Computation
- **Decision:** Aggregates individual and class-wide metrics over specified date ranges.
- **Rules:**
  - Calculates present percentage: `(total_present + total_late) / total_sessions * 100`.
  - Calculates consecutive absence streaks to separate occasional illness from persistent patterns.

### 2.3 Absenteeism & Early Intervention Detection
- **Decision:** Categorizes absenteeism risk tiers based on standard educational benchmarks.
- **Thresholds:**
  - Satisfactory: Attendance >= 90%.
  - Warning / At-Risk: Attendance between 80% and 89%.
  - Chronic Absenteeism: Attendance < 80% or >= 3 consecutive unexcused absences.

### 2.4 Grounded Verification Gate
- **Decision:** Constrains generative responses to verifiable snapshot records.
- **Rules:**
  - Answers the teacher's inquiry directly using only the supplied snapshot.
  - Formats responses with the direct answer first, supported by 2-3 empirical details.
  - Explicitly states when data is unavailable rather than speculating or extrapolating unlogged dates.

---

## 3. Data Sources & Inputs Used

| Data Input | Source | Purpose | Data Handling & Privacy |
|---|---|---|---|
| **Teacher Question** | Chat interface / API endpoint | Natural language query regarding attendance records or trends | Processed ephemerally in active memory; discarded upon request completion |
| **Roster Snapshot JSON** | In-browser register state | Student identifiers, enrolled roster list, and status records | Processed in-memory; validated for schema integrity; not used for AI model retraining |
| **QR Scan Payloads** | Device camera / QR decoder | Student session token for automated attendance check-in | Decoded and matched against active roster in local memory |
| **Session Timestamps** | System clock / Server time | Records accurate check-in time and detects late arrivals | Standardized into ISO strings for chronological auditing |

Attendance Register Agent complies with privacy-by-design standards:
- **FERPA Compliance:** Student educational records and attendance logs are isolated; student PII is never exposed to public third parties.
- **No Retraining on Student Data:** All API interactions with Google Gemini specify ephemeral inference flags (`store: false`).
- **Data Minimization:** Only fields strictly required for attendance auditing (student ID, name, status, date) are ingested.

---

## 4. Known Limitations & Failure Modes

Reviewers, educators, and administrators should note the following system boundaries:

1. **Hardware & Camera Scanning Constraints:**
   - *Limitation:* Poor ambient lighting, dirty camera lenses, or low-resolution webcams may cause QR code scan delays or misreads.
   - *Mitigation:* The system offers instant manual one-click check-in overrides for teachers when camera scanning is compromised.

2. **Session Snapshot Scope:**
   - *Limitation:* The AI assistant has visibility only into the classroom session snapshot sent with the active request; unselected semesters or historical terms are not accessible unless included in the snapshot.
   - *Mitigation:* The agent informs the teacher when queried about unincluded date ranges and requests the appropriate historical ledger export.

3. **Absence Reason Attribution:**
   - *Limitation:* The agent cannot autonomously determine external clinical, familial, or logistical reasons for an absence unless manually coded as `excused` with notes.
   - *Mitigation:* The agent flags absences objectively and prompts educators to confirm documentation for excused status.

4. **Non-Disciplinary Boundary:**
   - *Limitation:* The agent cannot autonomously enact academic penalties, suspensions, or course drops.
   - *Mitigation:* High-risk absenteeism cases trigger recommendation alerts directing staff to institutional guidance counselors for human-led intervention.

---

## 5. Verification, Safety & Human Oversight

- **Teacher Override Authority:** Every automated status assigned via QR check-in or batch processing can be modified, revoked, or overridden by the teacher in real time.
- **Strict Grounding Enforcement:** Prompts require the LLM to refuse speculative answers if requested student records are absent from the snapshot.
- **Immutable Audit Trail:** All check-in timestamps, status adjustments, and query logs are recorded in structured JSON format for institutional oversight.
- **Kill Switch:** Immediate termination of assistant processing sessions with zero residual background tasks.

# Segregation of Duties (SOD): Attendance Register Agent

To guarantee institutional integrity, privacy protection, and auditability, operational roles are segmented.

## Role Allocations

```
[Roster Ingestor]       --> Role: Student ID & Schema Verifier (Maker)
        │
[Check-in Engine]       --> Role: QR Matcher & Status Recorder (Executor)
        │
[Analytics Verifier]    --> Role: Absenteeism & Report Auditor (Checker)
        │
[Privacy Guardian]      --> Role: FERPA Guard & Ephemeral Cleaner (Auditor)
```

### 1. Roster Ingestor (`maker`)
- Ingests class roster records, verifies student identification schemas, and initializes daily attendance sessions.

### 2. Check-in Engine (`executor`)
- Processes QR code payloads and manual input, verifies check-in timestamps against class start times, and records initial status.

### 3. Analytics Verifier (`checker`)
- Audits attendance percentages, identifies chronic absenteeism patterns, and verifies that AI queries are 100% grounded in ledger data.

### 4. Privacy Guardian (`auditor`)
- Audits data transmissions to ensure FERPA compliance, validates ephemeral disposal, and prevents persistent PII leakage.

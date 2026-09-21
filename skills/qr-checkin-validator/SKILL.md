---
name: qr-checkin-validator
description: Validate incoming QR check-in tokens against class enrollment and timestamp boundaries.
---

# QR Check-in Validator Skill

## Overview
Verifies student check-in credentials transmitted via QR scans to prevent spoofing and enforce late-arrival rules.

## Operations
1. Decodes QR token and validates student ID against active class roster.
2. Compares check-in timestamp against designated class start grace period.
3. Sets status as 'Present' or 'Late' accordingly.

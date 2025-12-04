# Smart Diffing Logic Design
## Core Concept
"Smart Diffing" is the process of comparing the results of a *current* scan against the *historical* state of the system to determine the lifecycle of a vulnerability. We don't just want a list of bugs; we want to know what changed.

## 1. Vulnerability States
Every finding in the database will have one of the following states:

| State | Definition | Trigger Condition |
| :--- | :--- | :--- |
| **NEW** | First time this specific issue was seen on this asset. | `Current Scan` has finding AND `DB` has no record. |
| **OPEN** | Issue was seen before and is still present. | `Current Scan` has finding AND `DB` has record (State = NEW/OPEN). |
| **FIXED** | Issue was present before but is NOT in the current scan. | `Current Scan` missing finding AND `DB` has record (State = OPEN/NEW). |
| **REGRESSED** | Issue was marked FIXED, but reappeared. | `Current Scan` has finding AND `DB` has record (State = FIXED). |
| **FALSE_POSITIVE** | User marked this as not a bug. | User Action. Future scans ignore this (or mark as `FP_SEEN`). |

## 2. The "Fingerprint" (The Key to Diffing)
To track a finding across scans, we need a unique ID. We cannot rely on random IDs. We must generate a deterministic **Fingerprint Hash**.

### Hashing Algorithm
`SHA256(TemplateID + TargetURL + MatcherName + ExtractedValue)`

*   **TemplateID**: e.g., `cve-2023-1234`
*   **TargetURL**: e.g., `https://api.bank.com/v1/user`
*   **MatcherName**: (Optional) Specific matcher that triggered.
*   **ExtractedValue**: (Optional) If the finding extracts data (e.g., a version number), include it. *Careful: if the version changes, it's a new finding.*

## 3. The Diffing Workflow (Step-by-Step)

### Phase A: Ingestion
1.  **Run Nuclei Scan**: Output JSON.
2.  **Calculate Fingerprint**: For every item in JSON, calculate the hash.

### Phase B: Comparison (The Diff)
For a given Target (e.g., `bank.com`):

1.  **Fetch Active Findings**: Get all DB records for `bank.com` where State is NOT `FIXED`.
2.  **Iterate Current Scan**:
    *   If Hash exists in DB:
        *   Update `LastSeen` timestamp.
        *   Set State = `OPEN`.
        *   If State was `FIXED` -> Change to `REGRESSED` (Alert!).
    *   If Hash does NOT exist in DB:
        *   Insert new record.
        *   Set State = `NEW` (Alert!).
        *   Set `FirstSeen` = Now.

3.  **Identify Fixes**:
    *   Identify hashes in DB (Active) that were **NOT** in the Current Scan.
    *   Update their State = `FIXED`.
    *   Set `FixedAt` = Now.

## 4. Handling Edge Cases (The "Banking" Grade)

### A. Intermittent Failures (Flapping)
*   *Problem*: Network timeout causes a finding to disappear for one scan, then reappear. We don't want "Fixed" -> "New" -> "Fixed" spam.
*   *Solution*: **Grace Period**.
    *   If missing in scan, set State = `MISSING_PENDING_FIX`.
    *   Only move to `FIXED` if missing for N consecutive scans (or 24 hours).

### B. Template Updates
*   *Problem*: Nuclei updates a template, changing its ID or logic.
*   *Solution*: Track `TemplateVersion`. If a massive number of "New" findings appear for an old CVE, check if the template changed.

## 5. Database Schema Snippet (PostgreSQL)

```sql
CREATE TABLE findings (
    id UUID PRIMARY KEY,
    fingerprint TEXT UNIQUE NOT NULL, -- The SHA256 Hash
    template_id TEXT NOT NULL,
    target TEXT NOT NULL,
    
    state TEXT NOT NULL, -- NEW, OPEN, FIXED, REGRESSED, FP
    severity TEXT NOT NULL,
    
    first_seen TIMESTAMP NOT NULL,
    last_seen TIMESTAMP NOT NULL,
    fixed_at TIMESTAMP,
    
    metadata JSONB -- Full Nuclei JSON output
);

CREATE INDEX idx_findings_target_state ON findings(target, state);
```

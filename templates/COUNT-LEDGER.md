# Count Ledger — <idea name>

Format only. Behavior rules live in `COACH-PROMPT.md`.
Six counts: BR-301. Denominators: BR-302. Unknown vs zero: BR-303.
Invariant conflicts: BR-304. Full re-emission: BR-704.

| ID | Count | Value | Denominator | Basis | Label |
| --- | --- | --- | --- | --- | --- |
| C1 | Estimated group size | <n or Unknown> | — | <how estimated> | <label> |
| C2 | Reachable people | <n or Unknown> | of C1 | <how reachable> | <label> |
| C3 | Contacted | <n or Unknown> | of C2 | <when, how> | <label> |
| C4 | Problem reports | <n or Unknown> | of C3 | <what was asked> | <label> |
| C5 | Workaround users | <n or Unknown> | of C3 | <workaround seen> | <label> |
| C6 | Concrete commitments | <n or Unknown> | of C3 | <what was committed> | <label> |

## Invariant Check
C3 ≤ C2 ≤ C1 · C4 ≤ C3 · C5 ≤ C3 · C6 ≤ C3 — <Consistent, or the named conflict>

## Basis Notes
- <participant labels, dates, caveats>

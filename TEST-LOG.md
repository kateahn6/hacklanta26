# Test log

Verdicts for the cases in `TEST-CASES.md`. A case not executed is `Not run` — it
is never recorded as passing. Evidence is the saved transcript in `tests/runs/`.

Status: implementation complete. **No AC- case executed yet** — per
`BUILD-STEPS.md` step 5 those run in fresh conversations, which this build
session is not. The engineering checks below were executed in this session and
carry real verdicts.

One finding from running them: ENG-OCP-1 initially **failed**. BR-701 enumerated
all four template filenames, so a fifth artifact would have forced a prompt edit.
BR-701 now reads the `templates/README.md` registry instead, and the exercise
re-run gives a zero diff.

| Case | Covers | Verdict | Evidence |
| --- | --- | --- | --- |
| AC-01 | BR-101, BR-102 | Not run | — |
| AC-02 | BR-201, BR-701 | Not run | — |
| AC-03 | BR-301, BR-302, BR-305 | Not run | — |
| AC-04 | BR-501 | Not run | — |
| AC-05 | BR-601, BR-602 | Not run | — |
| AC-06 | BR-101 | Not run | — |
| AC-07 | BR-202, BR-303 | Not run | — |
| AC-08 | BR-204, BR-402, EX-05 | Not run | — |
| AC-09 | BR-503 | Not run | — |
| AC-10 | BR-502 | Not run | — |
| AC-11 | BR-504 | Not run | — |
| AC-12 | BR-803 | Not run | — |
| AC-13 | BR-304 | Not run | — |
| AC-14 | BR-303, BR-702, BR-305 | Not run | — |
| AC-15 | BR-601 | Not run | — |
| AC-16 | BR-802, ENG-RES-1 | Not run | — |
| AC-17 | BR-202 | Not run | — |
| AC-18 | BR-705 | Not run | — |
| AC-19 | BR-603 | Not run | — |
| AC-20 | EX-01 | Not run | — |

## Engineering checks

| Requirement | Verdict | Evidence |
| --- | --- | --- |
| ENG-DRY-1 | pass | `tests/runs/dry-sweep.txt` — 30 IDs, 0 duplicates, 0 unresolved refs |
| ENG-DRY-2 | pass | `tests/runs/dry-sweep.txt` — no vocabulary variants |
| ENG-SRP-1 | pass | `tests/runs/dry-sweep.txt` — no normative verb in templates, no instruction in cases |
| ENG-OCP-1 | pass | `tests/runs/ocp-exercise.txt` — 5th artifact added, zero diff to prompt, reverted |
| ENG-LSP-1 | pass (static) | `tests/runs/lsp-substitution.txt` — reworded template, contract preserved |
| ENG-ISP-1 | pass | `tests/runs/dry-sweep.txt` — ledger owns all 6 field rows; others pointer-only |
| ENG-DIP-1 | pass | `tests/runs/dry-sweep.txt` — no vendor/model name, registry-only filenames |
| ENG-BIGO-1 | pass (review) | 5 fixed comparisons O(1); one-pass label scan O(k); no nested claim scan |
| ENG-RES-1 | Not run | requires AC-16 in a fresh conversation |
| ENG-CONV-1 | pass | `tests/runs/dry-sweep.txt` — names conform, 0 config files, headings match §6 |

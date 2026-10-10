# Hackathon Go-To-Market Coach

A conversational prompt that coaches a student team from a raw idea to one small,
defensible experiment — and only then to a minimal build. It coaches discovery
before features, and it never strengthens a claim beyond its evidence.

Prompt-only. Nothing here is application code, and the coach takes no actions in
the world: the student contacts people, runs the experiment, and decides.

The Expo application at the repository root is unrelated to this folder.

## Files

| File | What it is |
| --- | --- |
| [BUILD-BRIEF.md](BUILD-BRIEF.md) | The original brief. Copied verbatim, not edited. |
| [BUILD-STEPS.md](BUILD-STEPS.md) | Workshop sequence, step 1 through 7. |
| [SPEC.md](SPEC.md) | 23 behavior requirements, 8 exclusions, engineering requirements, 20 acceptance cases. |
| [COACH-PROMPT.md](COACH-PROMPT.md) | The coach. Load this to use it. |
| [templates/](templates/) | Four output templates plus `README.md`, the artifact registry. |
| [TEST-CASES.md](TEST-CASES.md) | The 20 cases with inputs and failure conditions. |
| [TEST-LOG.md](TEST-LOG.md) | Verdicts. A case not executed reads `Not run`. |
| [tests/runs/](tests/runs/) | Saved evidence: exact inputs, full responses, check output. |
| [scripts/check-conventions.py](scripts/check-conventions.py) | Runs the mechanical engineering checks. |

## Using the coach

Load `COACH-PROMPT.md` in a fresh conversation, plus the template for whichever
artifact you want. The coach reads `templates/README.md` to find the rest.

It produces four artifacts: an **Idea Brief**, a **Count Ledger**, an
**Experiment Card**, and an **MVP Brief**. They arrive as Markdown in the
conversation; save them yourself. The coach has no file access by design.

## Running the checks

```bash
cd coach
python3 scripts/check-conventions.py
```

Paths resolve from `coach/`, so run it from here. It writes
`tests/runs/dry-sweep.txt` and exits after printing a pass or fail line per
check group. No dependencies, no configuration.

## Running a test case

Per [BUILD-STEPS.md](BUILD-STEPS.md) step 5, in a **fresh conversation**:

1. Load `COACH-PROMPT.md` and any template the case needs.
2. Paste one case's input from `TEST-CASES.md` verbatim.
3. Save the exact input and full response to `tests/runs/<case-id>.md`.
4. Record the verdict in `TEST-LOG.md`.

Do not improve a response before recording it. A case judged in the same session
that wrote the prompt is not evidence. `AC-07` and `AC-12` are the ones most
likely to find a real problem.

## Status

The 9 mechanical engineering checks pass, with evidence in `tests/runs/`.
All 20 acceptance cases are `Not run` — they need fresh conversations.
See [TEST-LOG.md](TEST-LOG.md) for the current state.

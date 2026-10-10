# Build walkthrough in Claude Code

Build your own coach in this starter folder. Read BUILD-BRIEF.md first.
Your deliverables are SPEC.md, a coach prompt, four output templates, test cases,
and saved inputs, responses, and review decisions.

## 1. Orient
Start `claude` in your project folder. Source: https://code.claude.com/docs/en/quickstart .
Prompt: Read BUILD-BRIEF.md. Summarize what we must build and identify questions
to resolve. Do not implement yet.

## 2. Specify
Copy this entire prompt into Claude in your starter folder:

```text
Read BUILD-BRIEF.md. Draft SPEC.md; do not implement yet.

Keep the deliverables to a conversational coach prompt, four output templates,
and test cases. Define numbered, observable behavior requirements, exclusions,
and acceptance cases. Ask about consequential gaps rather than inventing answers.

Add an Engineering requirements section. For each principle below, state whether
it applies, give a concrete requirement with an ID, and define its review or test.
If it does not apply, record N/A with a reason. Do not create an app, database,
class hierarchy, or configuration system just to demonstrate a principle.

- DRY (Don't Repeat Yourself): keep each behavior rule authoritative in one place;
  have templates reference it rather than maintain conflicting copies. Check for
  inconsistent rules across the prompt, templates, and cases.
- SOLID (Single responsibility, Open/closed, Liskov substitution, Interface
  segregation, Dependency inversion): assess each principle separately. Separate
  coaching behavior, output formats, and evaluation responsibilities. Where code
  or replaceable components exist, specify stable contracts and focused interfaces
  and checks for compatible replacements. Explain N/A for principles that require
  structures this prompt-only project does not have; do not invent abstractions.
- ACID (Atomicity, Consistency, Isolation, Durability): if database transactions
  exist, specify which writes succeed or fail together, invariants, concurrency
  behavior, and durability expectations, with failure tests. For this coach-only
  build, record N/A: no database transactions. A prompt cannot guarantee ACID.
- Big O: for any actual algorithm, define input size and analyze time and space
  growth. Do not assign a complexity class to model reasoning. For the coach,
  specify a bounded context/output policy and a long-input test as a separate
  resource-use requirement; explain when algorithmic analysis is N/A.
- Convention over configuration: use consistent, documented file names and output
  headings. Reuse the starter's conventions and avoid unnecessary settings.
  Check that the generated files and templates follow the chosen conventions.

Map each applicable requirement to planned files and acceptance evidence.
Include normal, adversarial, and boundary cases with input, expected behavior,
and visible failure conditions. Wait for our explicit approval before building.
```

Review whether every applicable requirement has an observable check before proceeding.

## 3. Approve
Approved: implement only the requirements in SPEC.md. First list the files you will
change and the checks you will run. Apply the approved engineering requirements
and explain each N/A. Leave unrelated files alone.

## 4. Inspect the build
Open the resulting prompt, templates and cases. Point from one spec requirement
to the prompt instruction intended to satisfy it. Inspect the diff.

## 5. Run cases
Use a fresh conversation and load the coach prompt created in your own project.
Confirm the actual file path. Run an acceptance case from your SPEC.md and save
the exact input and full response. Compare the behavior with your expectation;
do not manually improve a response before reviewing it. Use fresh conversations
for independent cases.

## 6. Challenge in a separate session
Review SPEC.md, the coach prompt, and the saved test responses. For each applicable
requirement, quote the exact response text. Mark pass, fail, or unresolved.
Explain unsupported claims. Do not assume the builder's summary is correct.
Separate sessions organize context; inspect the review rather than treating it as proof.

## 7. Repair
Fix only the reported requirement violation. Repeat the failing case and one that
previously passed. Preserve earlier responses so the team can explain the change.

These are authored teaching prompts, not a transcript of a previous run.
File references in these instructions resolve from your starter folder.
The spec and implementation files are deliverables you create, not supplied answers.

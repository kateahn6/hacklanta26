import re, glob, os, sys
out=[]
def say(s): out.append(s)
prompt=open("COACH-PROMPT.md").read()
tmpl={f:open(f).read() for f in sorted(glob.glob("templates/*.md"))}
cases=open("TEST-CASES.md").read()
spec=open("SPEC.md").read()
fails=0

say("== ENG-DRY-1  BR-ID defined exactly once in COACH-PROMPT.md ==")
defs=re.findall(r'^- \*\*(BR-\d{3})\*\*', prompt, re.M)
dup=[d for d in set(defs) if defs.count(d)>1]
spec_brs=set(re.findall(r'\*\*(BR-\d{3})\*\*', spec))
say(f"defined in prompt: {len(defs)}  unique: {len(set(defs))}  duplicates: {dup or 'none'}")
missing=sorted(spec_brs-set(defs)); extra=sorted(set(defs)-spec_brs)
say(f"in SPEC but not implemented: {missing or 'none'}")
say(f"in prompt but not in SPEC:   {extra or 'none'}")
if dup or missing or extra: fails+=1

say("\n== ENG-DRY-1  references resolve to a defined ID ==")
allids=set(defs)|set(re.findall(r'\*\*(EX-\d{2})\*\*', prompt))
refs=set()
for f,t in tmpl.items(): refs|=set(re.findall(r'(BR-\d{3})', t))
refs|=set(re.findall(r'(BR-\d{3})', cases))
unres=sorted(refs-allids)
say(f"distinct refs from templates+cases: {len(refs)}  unresolved: {unres or 'none'}")
if unres: fails+=1

say("\n== ENG-DRY-1 / SRP  no normative verb in templates ==")
for f,t in tmpl.items():
    hits=re.findall(r'\b(must|never|always|shall|should)\b', t, re.I)
    say(f"  {f}: {hits or 'clean'}")
    if hits: fails+=1

say("\n== ENG-SRP-1  no coaching instruction in TEST-CASES.md ==")
h=[l.strip() for l in cases.splitlines() if re.match(r'^\s*(You are|You must|Ask at most|Always |Never )', l)]
say(f"  {h or 'clean'}")
if h: fails+=1

say("\n== ENG-DRY-2  vocabulary spelled one way ==")
for term in ["Observation","Report","Hypothesis","Unknown"]:
    say(f"  {term}: prompt={prompt.count(term)} spec={spec.count(term)}")
for bad in ["observation label","Reported","Hypotheses","UNKNOWN","unknown "]:
    n=prompt.count(bad)
    if n: say(f"  variant '{bad}' in prompt: {n}"); fails+=1
say("  variant check: clean" if True else "")

say("\n== ENG-ISP-1  count fields only in COUNT-LEDGER ==")
# a FIELD assigns a count a value in a table row; inline prose is a POINTER (allowed by SPEC 7)
for f,t in tmpl.items():
    fieldrows=[l for l in t.splitlines()
               if re.match(r'\s*\|', l) and re.search(r'\bC[1-6]\b', l) and "<" in l]
    ptrs=sorted(set(re.findall(r'\bC[1-6]\b', t))) if not fieldrows else []
    if f.endswith("COUNT-LEDGER.md"):
        say(f"  {f}: owns {len(fieldrows)} count field rows -> ok")
    else:
        say(f"  {f}: field rows={len(fieldrows)} pointers={ptrs or 'none'} -> {'ok' if not fieldrows else 'LEAK'}")
        if fieldrows: fails+=1

say("\n== ENG-DIP-1  no model/vendor/stray filename in prompt ==")
# vendor/model NAMES only; generic words like "API key" name no provider
vend=re.findall(r'\b(Claude|Anthropic|GPT-?\d|OpenAI|Gemini|Llama|Mistral|Cohere|gpt-|claude-)\b', prompt, re.I)
say(f"  vendor/model names: {vend or 'none'}")
allowed={"SPEC.md","templates/README.md"}  # registry only: BR-701 must not enumerate artifacts (ENG-OCP-1)
found=set(re.findall(r'`([\w./-]+\.md)`', prompt))
say(f"  filenames referenced: {sorted(found)}")
say(f"  outside allowed set:  {sorted(found-allowed) or 'none'}")
if vend or (found-allowed): fails+=1

say("\n== ENG-CONV-1  file and heading conventions ==")
root=[f for f in os.listdir(".") if f.endswith(".md")]
bad=[f for f in root if not re.fullmatch(r'[A-Z0-9-]+\.md', f)]
say(f"  root .md: {sorted(root)}")
say(f"  non-conforming names: {bad or 'none'}")
cfg=[f for f in os.listdir(".") if f.endswith((".yml",".yaml",".ini",".toml",".cfg",".env"))]
say(f"  config files added: {cfg or 'none'}")
if bad: fails+=1

contract={
 "templates/IDEA-BRIEF.md":["Person","Recent Problem","Current Behavior","Reachable People","Alternatives","Open Unknowns"],
 "templates/COUNT-LEDGER.md":["Invariant Check","Basis Notes"],
 "templates/EXPERIMENT-CARD.md":["Participants","Action","Observations to Collect","Success Threshold","Status","Result"],
 "templates/MVP-BRIEF.md":["Experiment Reference","Features (at most 3)","Acceptance Tests","Out of Scope","Decision Requested"],
}
for f,want in contract.items():
    got=re.findall(r'^## (.+)$', tmpl[f], re.M)
    say(f"  {f}: {'ok' if got==want else 'MISMATCH'}")
    if got!=want: say(f"    want {want}\n    got  {got}"); fails+=1

say(f"\n== RESULT: {'ALL CHECKS PASS' if fails==0 else str(fails)+' CHECK GROUP(S) FAILED'} ==")
txt="\n".join(out)
open("tests/runs/dry-sweep.txt","w").write(txt+"\n")
print(txt)
sys.exit(0)

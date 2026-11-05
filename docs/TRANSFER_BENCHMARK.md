# Transfer benchmark and no-AI comparison

This milestone provides a working development assessment bank, an isolated offline grader, a matched no-model coach, and prospective study tooling. It does not contain real learner outcomes or demonstrate that the AI improves learning.

## What is held out

Version `transfer-dev-v1.2` contains eight original MIT synthetic tasks: two provisional forms, A and B. Each form has one parsing, one async-state and one graph-state task corresponding to the three public practice families. Each also has one exploratory unpractised-family task (interval boundaries or cursor pagination), analysed separately.

The assessment bank is outside the public practice catalog and never included in mentor prompts. The browser receives only the assigned baseline source, contract and visible examples. Reference repairs and private grading cases are not served by HTTP. Same-origin mentor requests are blocked while an assessment session is active, even if relabelled as practice. Assessment task IDs are also blocked independently.

This is a **practice/prompt-excluded development bank**, not a guarantee of unseen model data. Generic mechanisms are familiar; the designer and source reviewer can inspect every answer. The source ZIP includes the full bank for review, so publishing it exposes the bank. Participants who preview both forms or inspect grader source must not subsequently be treated as unexposed participants. The forms are not difficulty-calibrated, and the exploratory pair is not claimed to be matched or to establish far transfer.

## Try the workflow

- AI practice coach: http://127.0.0.1:4173/
- Matched no-model coach: http://127.0.0.1:4174/
- Assessment A: http://127.0.0.1:4173/assessment.html?form=A
- Assessment B: http://127.0.0.1:4173/assessment.html?form=B

Start the main server with `npm run dev` and the comparator with `npm run dev:baseline`. The no-model server owns its mode; a client request cannot switch it to AI. Both coaches use identical prerequisites, teaching-action menus, approved question text, evidence citations and source windows. The baseline chooses the first allowed action in the teaching scaffold. The AI chooses an allowed action with the local model. Model failures remain labelled fallbacks in the assigned AI arm. The interface is not blinded to mode; any study must disclose that limitation.

In the assessment, click **Start form A/B**, inspect the contract, edit source, run visible examples, write a diagnosis and optionally supply a new regression case. **Export & end assessment** downloads a JSON work sample and releases the local coaching block. No source or reasoning is posted to a grading API. The operator grades the export separately. The page saves drafts on the device; beginning a fresh session can resume device drafts, so use a fresh browser profile or clear the assessment storage before a real first attempt. No study enrollment or telemetry is recorded by this page.

Only visible examples run in the browser. Their passing status is not a final grade. A participant can still use external tools, a different browser profile, edited exports or the source bank. This local workflow does not prove identity or unaided work. Assessment sessions are ephemeral and are not an authenticated public examination system.

## Frozen scoring

The machine-readable prospective protocol is `benchmark/protocol.json`. `benchmark/frozen.json` contains SHA-256 hashes covering the task definitions, protocol, grader/runtime, intervention policy and model definitions, model asset manifest, analysis/allocation/grading scripts, assessment delivery and dependency lock. `npm run benchmark:freeze` verifies the current freeze. Deliberate changes require a new protocol version and `npm run benchmark:freeze -- --create`; do not overwrite the version during a learner study. An initial technical freeze was archived before expanding coverage to the v1.1 technical freeze; v1.2 records the pilot stop-flow refinement. No learner results existed during that development revision.

| Component | Maximum | How assessed |
|---|---:|---|
| Private target cases | 50 | Actual candidate outputs compared with expected values outside the container |
| Private control cases | 20 | Preserve behaviour while repairing the target mechanism |
| New valid regression | 10 | Not a repeated visible example; expected value agrees with the reference; original fails; candidate passes |
| Diagnosis | 20 | Blinded human review; never automatically filled in |

The automatic maximum is **80**, not 100. The human rubric reserves 10 for causal diagnosis, 5 for execution evidence and 5 for a falsifiable alternative. Reviewers should receive pseudonymous task/code/reasoning packets without arm, phase, allocation schedule or prior automated scores. Use independent reviewers and adjudicate disagreement before joining scores to arm assignments. No human scores have been created here.

The primary behavioural endpoint is passing **every private target and control case** on each of the three trained-family posttest tasks. Missing tasks count as not passed, rather than being omitted from the denominator. Exploratory tasks are excluded from that primary rate. A partial case score does not turn an incomplete repair into a primary success.

## Operator grading

Docker must be running with the pinned Node image used by the repository replay available. Execute:

```
npm run benchmark:grade -- --submission /absolute/path/to/fixfirst-assessment-A.json --out grade-A.json
npm run benchmark:verify -- --out benchmark-verification.json
```

The grader checks the export version and bank hash, rejects foreign-form/duplicate tasks, and records omitted or explicitly unattempted tasks as zero. It runs candidate source only in a temporary no-network, read-only, non-root, resource-limited container. Only candidate source, a small execution wrapper, input arguments and a fresh nonce enter that container; expected answers and the private case labels remain in the host grader. Candidate stdout is parsed as a bounded protocol response, not as trusted test or score claims. The host compares values and separately checks source mutation observations. Early exit, malformed output, syntax failure, excessive output or timeout cannot produce a pass.

Regression grading runs the learner case against original, reference and candidate source in separate isolated runs. The reference must agree with the proposed expected result; the original must differ; the candidate must agree. Compilation/protocol/time-limit failures do not count as a useful original-code failure. The grader does not execute learner source on the host. It forcibly removes its own containers in cleanup.

Container controls include the pinned Node image, UID/GID 65534, no network, no capabilities, no-new-privileges, read-only root and task mount, 256MB memory/swap cap, one CPU, 64-process limit, bounded descriptors, temporary filesystem and output/deadline limits. These are local development controls, not a security audit or a production sandbox certification. The candidate may deliberately satisfy observed inputs without demonstrating understanding; behavioural grading and human diagnosis review serve different purposes.

## Prospective learner comparison

Before recruitment, calibrate forms and feasibility, determine a justified sample size, settle consent/privacy logistics, and register the final analysis. The current local protocol is not an external preregistration. It specifies 12-minute pretest/posttest budgets per task and 15-minute practice budgets per task, to be piloted and enforced by the operator; the UI does not enforce these timers or measure focused attention.

Use counterbalanced form order (A→B or B→A) and block-randomized coaching arm. The allocation helper creates four combinations per block:

```
npm run study:allocate -- --slots 8 --out operator-allocation.json
```

These are planned slots, not enrolled participants. The supplied eight-slot artifact uses a public technical-preview seed and is a readiness example, not a statistically powered study. Use an operator-controlled schedule for a real pilot and do not expose future assignments to recruiters or participants.

A suggested session sequence is uncoached pretest → assigned coach on the same three repository practice tasks → uncoached posttest on the other form. Provide the same instructions and budgets, record actual fallback/hint use, and treat external assistance as a documented protocol deviation. Do not use the public practice tasks themselves as the primary posttest. Separate exploratory tasks from the primary three-family endpoint.

Assigned links can include a random study code and phase, for example `assessment.html?form=A&phase=pretest&code=slot-001`. Do not use names or contact details as study codes. Keep an explicit operator-managed list of actually enrolled consenting codes; the app does not infer enrollment from planned slots.

## Reporting without invented effects

`study:report` consumes an allocation, explicit enrolled-code array and an array of operator grade reports:

```
npm run study:report -- --allocation operator-allocation.json --enrolled enrolled.json --grades grades.json --out descriptive-report.json
```

It rejects mixed benchmark versions, invalid/mismatched code/phase/form, duplicate attempts, invalid pass rates and synthetic/preview grades. It reports descriptive arm counts, available pretests, posttest receipt/missingness and posttest means with missing posttests as zero. It does not perform the planned adjusted causal analysis, uncertainty intervals, significance testing or human grading. Those require the frozen real-study analysis and sufficient real data.

The current enrollment and grade files are explicitly empty. The generated status report says **zero learners and no effect estimate**. Harness/reference scores and the paired mentor decisions are not inserted into learner outcome data.

## Technical verification completed

All eight buggy baselines fail at least one private target case. All eight reference repairs pass every private case and earn 80/80 automatic points with their meaningful regression case, while human scores stay null. Adversarial checks reject a fake pass/100-score claim, syntax error, infinite loop and noisy stdout; repeating a visible example earns no regression credit. The reference verification is marked `notLearnerData`.

All 24 Node tests and 21 browser scenarios passed, including named-module assessment execution, projection of public fields only, active-session coaching suppression, no-model ownership, export/version/form handling, stale evidence, empty reports and rejection of synthetic learner outcomes.

The paired live-coach check sent identical executed public-practice contexts to the two local servers. On four contexts, two action selections differed and two matched, with no model fallbacks. The model-free arm made no model calls. This confirms a real comparison path; it does not show the AI is more effective. No assessment task or reference repair was sent to either mentor.

## Calibration portal checkpoint

A separate local portal at http://127.0.0.1:4175/ now supports participant information, explicit acknowledgement, exposure/assistance reports, local drafts and voluntary manual exports. It does not receive participant-record POSTs. The assessment offers **End without export**; removing local drafts does not delete shared copies. See CALIBRATION_PILOT.md for the configured contact, standard session script, exclusion rules and triage-only coverage gates. No actual human data has been collected.

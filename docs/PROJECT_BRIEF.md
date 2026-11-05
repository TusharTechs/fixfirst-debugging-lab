# FixFirst — project brief and implementation contract

**Historical implementation contract and checkpoints:** read the repository README for current shipped capabilities. Hosted AI, remote development grading and the judge walkthrough now exist. Earlier checkpoints below describe the state at their recorded stage. Real-participant recruitment is skipped; no learning or employment impact is claimed.

Decision: build an execution-grounded debugging apprenticeship for **Tech Employment for Youth**. Working name: FixFirst. This is a product direction, not a prediction or guarantee of first prize. A sparse visible submission pool does not establish a complete judging pool. Education is not the submission track; the core deliverable is a first-time developer's maintenance work sample.

## Problem and intended outcome

A first-time developer can obtain an AI-generated patch without learning to reproduce a failure, isolate its cause, or protect the fix with a regression test. A portfolio containing only finished projects does not expose that process. FixFirst helps learners practise this missing workflow and produces inspectable evidence of their reasoning and execution. The target users are students and job-seeking junior developers working without an employer or institutional partner.

The primary outcome is independent performance on unfamiliar maintenance tasks. Task completion, app visits and generated patches are secondary measures. Neither work-sample exports nor model ratings establish employability, identity, or placement outcomes.

## Product experience

1. Pick a maintenance issue with source, license, acceptance contract and reproducible environment.
2. Run unchanged code and capture a failing baseline.
3. State a hypothesis, inspect the relevant trace and choose a distinguishing experiment.
4. Receive a question or counterexample from the mentor, grounded in actual execution. The mentor does not silently replace the learner's patch.
5. Edit code, rerun tests, add a regression case and explain the causal repair.
6. Attempt a task from a related but unfamiliar context with coaching disabled.
7. Export a work sample containing source revision, observations, patch, tests, hint use and provenance. Label browser-local evidence as self-reported.

The UI must distinguish original state, local draft, passing tests and complete evidence. A passing test run on an older revision must not verify newly edited code. Execution errors and timeouts must be visible and must never count as passes.

## Scope and progression

The initial vertical slice uses JavaScript maintenance fixtures with real browser execution: zero-valued invoice records, stock-report transfer and dropped final batches. These are original MIT-authored exercises, not claims of real repository bugs. All tests are inspectable. The corpus becomes public on release; until publication the app must not imply an already-public dataset.

The full entry adds licensed real repository tasks, task families covering state, concurrency, APIs and data integrity, server-isolated reproducible environments, a model-backed mentor, a genuinely separated transfer benchmark and opt-in anonymous aggregate measurement. Hindi/plain-language explanations and keyboard-first accessible interaction are planned after the core loop is reliable. Begin with JavaScript; Python/full repositories require an isolated runner, not host subprocess execution or a pretend serverless sandbox.

## Data and rights

Every task gets a manifest: upstream URL, exact revision, file paths, code/data license, redistribution permission, attribution, issue and patch references where applicable, reproduction command, expected failures, environment digest, transformations and contamination status. Reject tasks whose redistribution rights cannot be established. A dataset's top-level license does not automatically relicense embedded repository code.

Public SWE-bench or similar patches can seed practice after license review, but are already exposed and are not a clean final evaluation. Hugging Face hosting alone establishes neither quality nor licensing. Do not build around a dataset merely because it is downloadable. Do not train on held-out evaluation answers. Freeze the final benchmark, document family splits and disclose plausible model familiarity. Independent transfer is a claim to validate, not a label made true by changing variable names.

## Architecture

Browser client: accessible task workspace, editor, structured evidence view, reasoning journal, mentor panel and report export. Keep task content separate from execution and assessment policy. Current implementation is buildless ES modules and a local Node app/mentor server; learner code is not executed on that server.

Practice runner: opaque-origin sandbox iframe, restrictive CSP, disposable Web Worker, per-run correlation token, source-window message checks and parent-side timeout/destruction. Do not grant same-origin access. No credentials, session data or sensitive corpus enters the worker. Bound retained history. Current client-side runner is not a security-audited, tamper-proof grader; browser resource exhaustion and adversarial JavaScript remain validation concerns. The fixtures and tests are client-visible by design.

Production runner: separate service with pinned per-task container images, unprivileged execution, denied network, read-only base, isolated ephemeral workspace, CPU/memory/process/output limits and forced deadline. No host socket, cloud credentials or shared writable state. A client cannot declare its own authoritative pass. Run visible and independent assessment tests in a separate process from learner code. Attack-test the runner before opening arbitrary repository imports. Cloudflare Workers cannot substitute for a subprocess/container runtime.

Mentor: tool-grounded observation → diagnosis question → learner experiment → evidence feedback. Allowed tools read task contract, learner-selected source, test output and bounded traces. Learner source, task comments and logs are untrusted data, not instructions. Prevent answer disclosure during transfer. The current slice uses a real local Qwen action planner with explicitly labelled guided fallbacks. Its bounded action protocol renders approved prompts and actual evidence references, with server-side transfer gating, context freshness checks, local-only model files and inference deadlines. No paid provider or API credentials are configured. A future hosted adapter still needs credential isolation, cost limits, privacy controls and separate evaluation.

Evidence service: later accepts schema-validated opt-in events and aggregates outcomes; no code or free-text reasoning in analytics. Work sample export remains separate and under learner control. A signed server execution record may improve integrity but does not prove learner identity or unaided work.

## Measurement and privacy

Initial state is local-only storage, no analytics transmission and JSON export. Later, ask separately for anonymous study participation and disclose collected event fields. Proposed events: task/version, randomized session identifier, elapsed time, run outcome, hint count and milestone reached. Do not retain IP addresses in application logs or fingerprint users. Infrastructure logs also require a retention decision. Provide deletion/reset and export. Report real sample size and missing/abandoned sessions; do not invent users, outcomes or placements.

Core measures: unaided correct diagnosis, accepted minimal repair, regression-test fault detection, independent transfer success, time to repair and hint dependence. A user-authored test must eventually be checked against the buggy revision and the repaired revision; merely passing once is insufficient proof of regression quality. The updated prototype now checks the same custom case on original and repaired code in separate disposable workers. Syntax/runtime errors or timeouts on the original do not qualify as regression evidence. This client-visible practice check is not a tamper-proof assessment. Use anonymous app usage only as deployment evidence, not employment impact.

## Evaluation and competitive claim

Compare FixFirst against (a) task text and tests only, (b) ordinary coding-assistant access and (c) direct solution exposure. Allocate comparable task families, record prior experience, freeze task order/splits and report uncertainty and attrition. Start with a small usability study to catch failures; determine a powered sample size from a declared meaningful effect and observed variance before making efficacy claims. Do not choose a fabricated sample count as evidence.

External alternatives include Exercism, GitHub Skills, CodeCrafters and general coding assistants. The defensible distinction must be a measured improvement in independent diagnosis and transfer, coupled with replayable evidence. 'Learn by doing' or a chat interface is insufficient novelty. Two visible related hackathon entries found earlier (GlassBox and CareerPath AI) are signals, not an exhaustive competitor count.

## Hackathon fit and submission evidence

The official main page describes Tech Employment for Youth as including portfolio building, apprenticeships and hiring signals. Its four equally weighted criteria are problem size, severity, solution quality and proven impact. Build an evidence packet for each: credible public sources for the problem; concrete failure workflows for severity; a working verified product plus baselines for quality; real usage and task/transfer outcomes for impact. Named judges were not verified. Do not invent personal preferences or convert simulated reviewer scores into winning probabilities.

Official reference: https://codeforindia.org/hackathon
Secondary event page requiring reconciliation before submission: https://karlmehta.github.io/code-for-a-billion/website/agentfoundry-hackathon.html#how
Related public entries: https://github.com/karlmehta/code-for-a-billion/issues/47 and https://github.com/karlmehta/code-for-a-billion/issues/11
Public practice-corpus reference, not clean evaluation: https://github.com/SWE-bench/SWE-bench

Submission bundle: MIT/Apache-compatible public repository, data/task manifests, deployed usable application, accessible demo, reproducible evaluation report, limitations, privacy statement and honest AgentFoundry development record. Verify final rules/deadline against current official instructions before submission; the two published pages previously differed on categories/prizes. Do not claim a particular prize pool or confirmed judging panel without verification.

## Acceptance gates and build order

**Gate 1 — working vertical slice (current build):** original code demonstrably fails; learner code actually runs; a correct repair passes; malformed code/JSON and infinite loops show errors; editing after a pass invalidates verification; transfer mode disables hints; local progress survives refresh; exports contain honest evidence; desktop/mobile layout works. No fabricated impact counters.

**Gate 2 — trustworthy task engine:** task manifests and license audit; multiple task families; independent grading process; negative and adversarial test suite; custom tests fail on original and pass on repaired code; meaningful held-out transfer bank with contamination disclosures; reproducible task snapshots.

**Gate 3 — mentor and deployment:** real provider adapter and evaluation; prompt-injection/answer-leak tests; per-session costs and availability; isolated runner hardening; production consented aggregate events; accessibility and low-bandwidth checks; deployment/runbook and failure recovery.

**Gate 4 — evidence and entry:** public study and baseline comparisons; publish actual metrics and uncertainty; record substantive AgentFoundry iteration; final official-rules audit; repository/public app/demo walkthrough. Do not promote the entry as proven until the evidence exists.

## Development provenance and risks

AgentFoundry desktop is installed and signed in. The initial source and this brief were prepared using Codex filesystem tools. A subsequent user-operated AgentFoundry SMART-Code iteration made partial code changes and hit its tool-use cap; Codex completed and tested the feature. See BUILD_LOG.md for attribution; merely opening files in AgentFoundry is not proof of development. Record date, task, tool/model, substantive change, test command/result and supporting screenshot or commit for the actual AgentFoundry iteration. The current computer-use skill restricts typing into IDEs; do not bypass it with hidden automation. Use an approved supported interface or a user-driven AgentFoundry prompt to complete that step.

Biggest risks: weak real-world task authenticity, model memorization, answer dependence, client tampering, code-execution isolation, unsupported employment claims and insufficient field usage. These are acceptance gates, not reasons to invent reassuring scores. No hardware or institutional pilot is required for the planned software validation, but actual learners are required to demonstrate learner impact.

## Implementation checkpoint — 2026-11-05

The first historical repository task is now implemented: MIT-licensed `url-join` fragment preservation, complete pinned module in the editor, native ESM execution, task-specific provenance and a local digest-pinned Docker replay. The full upstream suite reproduces 2 failures on the baseline and passes all 31 tests on the reference repair. See `REPOSITORY_TASK.md` and `BUILD_LOG.md` for exact scope, reproduction and limitations. This completes the first curated repository vertical slice; it does not complete corpus diversity, a deployed authoritative grading service, the model mentor or learner efficacy validation.

## Corpus expansion checkpoint — 2026-11-05

Three historical repository bug families now run end to end: URL parsing, promise rejection/queued-call state and object-graph identity. Source manifests disclose historical fork lineage, licenses, public answer contamination and exact test scope. The runner now supports awaited results and bounded case recipes for actual callback concurrency and shared identities. All 20 app/corpus checks passed; the three declared Docker suites reproduce failures and pass with their reference repairs. See CORPUS_CATALOG.md for the distinct full-suite, selected-test and adapted-suite results. This remains a small practice corpus; a held-out transfer bank, model mentor and learner outcomes are not complete.

## Mentor checkpoint — 2026-11-05

The local AI mentor is implemented and exercised through the browser. It plans bounded coaching moves using current learner context and browser-reported test evidence; application policy renders questions and citations and rejects free-form model patches. Qwen2.5-Coder-1.5B Q4 runs from a pinned local cache. All 35 Node/browser checks passed, with a separate 10-decision live smoke check and explicit menu reordering. The smoke check matched developer-declared action sets, not independent learner outcomes. See MENTOR.md for the failed initial model/menu diagnostics, final results, privacy and deployment limits. A production inference service, held-out transfer evaluation and real learner study remain unfinished.

## Transfer/comparator checkpoint — 2026-11-05

A frozen v1.1 development assessment bank now has eight original tasks across two provisional forms, a no-coaching browser workbench and an isolated offline grader whose host compares actual values rather than trusting candidate pass claims. A matched no-model coaching arm uses the identical scaffold without inference. All 45 Node/browser checks pass, along with eight reference/baseline verifications and five adversarial grader checks. Planned allocation and descriptive-only reports are implemented; enrollment/outcomes remain explicitly empty. The bank is designer-visible, not guaranteed unseen, and form equivalence is uncalibrated. This prepares a learner study but does not establish learning transfer or winning impact. See TRANSFER_BENCHMARK.md for scope and remaining validation.

## Calibration workflow checkpoint — 2026-11-05

The local pilot portal and operator guide now support explicit participant acknowledgement, prior-exposure and assistance reporting, random codes, voluntary device-local exports and no observation upload endpoint. The owner supplied a contact email, kept in ignored local configuration. A calibration checker excludes demos/nonconsenting/exposed records, treats missing grades as unknown, flags sparse coverage and never claims equivalence or learning impact. The assessment stop-without-export refinement is captured in the v1.2 freeze; tasks/scoring are unchanged from v1.1. Real calibration and learner data remain empty. This prepares a pilot, not a completed human study or public deployment.

Calibration technical verification: all 32 Node checks and 25 browser scenarios are verified, along with six operational checks. The collector/checker demo is marked technical and excluded from human counts. Policy-plus-implementation hashes prevent pooling incompatible calibration logic. No participant has been enrolled or contacted by this work. Local URLs are not public invitation links.

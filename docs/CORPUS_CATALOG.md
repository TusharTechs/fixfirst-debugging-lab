# FixFirst practice corpus — 2026-11-05

The app contains three authored warm-ups and three historical public-repository bugs. All three reference repairs have been replayed in digest-pinned, no-network local Docker containers. These results establish reproduction on the declared cases, not exhaustive correctness, learner efficacy or a hidden benchmark.

| Task | Bug family | Source provenance | Docker baseline → reference | Browser baseline → reference |
|---|---|---|---|---|
| The missing part of the URL | Parsing boundaries | url-join PR #133, complete module | 29/31 → 31/31, full upstream fix-commit suite | 5/10 → 10/10, visible subset + one boundary |
| When failure becomes success | Promise rejection state and concurrent callers | p-debounce PR #33, complete module | 0/7 → 7/7, seven selected upstream regression tests | 2/9 → 9/9, explicit async recipes and controls |
| The cycle that was not a cycle | Shared identity vs ancestor cycles | Historical json-stable-stringify commit retained in the fast-json-stable-stringify fork | 5/8 → 8/8, FixFirst Node adapter | 5/8 → 8/8, same adapted case table |

A learner's passing custom regression adds one case to the browser totals. It must distinguish original from repaired behaviour to earn the evidence milestone. Controls that also pass on the original do not qualify. Compile failures, harness errors and timeouts do not count as a successful regression observation.

## Open the tasks

- http://127.0.0.1:4173/?task=url-join-fragment
- http://127.0.0.1:4173/?task=debounce-rejection
- http://127.0.0.1:4173/?task=stringify-shared-reference

All files shown in the editor are complete pinned upstream source modules, without source rewriting. Browser ES-module tasks use native module loading. The historical serializer uses a CommonJS module/exports wrapper. In this runtime its built-in JSON branch is used; the conditional `jsonify` compatibility dependency is unnecessary and is not installed. Arbitrary `require()` dependencies are unavailable in the browser.

## Exact sources and license attribution

**url-join** — https://github.com/jfromaniello/url-join/pull/133. Baseline `32815bf5d91a5e0add5c7c9ee3b74d2ae61885de`; repair `cceb648e479c25b8b16dc71aebec852d4d87f679`. MIT, Copyright (c) 2015 José F. Romaniello.

**p-debounce** — https://github.com/sindresorhus/p-debounce/pull/33. Baseline `8964dd202004f49d7b814c0292b064287b70f2d8`; repair `a14c7ac6817248b8db13eb0d30474c1f82588fe6`. MIT, Copyright (c) Sindre Sorhus. Docker runs the unmodified `test.js` at the fix revision with `--test-name-pattern=\.promise\(\) preserves`. It does not run all upstream timing tests, lint or type checks. This avoids attributing a selected-regression run to the whole upstream suite.

**Historical json-stable-stringify** — https://github.com/epoberezkin/fast-json-stable-stringify/commit/c26c700f0b1d078512d2eba0eb16d6e5110a5538. Baseline `f70d44441a4a4161796e779952312b35ec336442`; repair `c26c700f0b1d078512d2eba0eb16d6e5110a5538`. These 2015 commits are an ancestor of the fork, whose package at that revision was named `json-stable-stringify`. They are not the modern fast-json-stable-stringify code. The pinned MIT notice has no copyright line; the package metadata credits James Halliday. The exact notice is retained without substituting a newer fork license. The original Tape test file is distributed for provenance; the executed Node adapter adapts selected assertions and adds labelled boundary/control cases. The old Tape suite and dependency installation are not claimed as executed.

For each task, `corpus/<id>/manifest.json` records source and fix revisions, license path, exact SHA-256 file hashes, transformations, case origin, runtime and replay plan. Copies of source, license, README, original test file and manifest are served in the app's provenance panel. The complete source package retains the reference repair separately for reproducibility. Public answer visibility is intentional for practice and must be disclosed in evaluation.

## Case recipes

JSON cannot encode callback functions, actual shared object identity or cycles. `public/scenarios.js` provides bounded, allowlisted recipes. The browser sends the trusted recipe function to its disposable worker; the shared-reference Docker adapter uses the identical versioned function. No recipe executes source on the Node host.

| Recipe | `args` | Observed result |
|---|---|---|
| `promise-rejection` | `[reasonName, callerCount]`, count 1–8 | Call settlement statuses, exact reason preservation, subsequent recovery and execution count |
| `promise-concurrent` | Caller values, e.g. `[7,9]` | Results and number of wrapped-function executions, using a release gate instead of timing assumptions |
| `promise-queued-rejection` | `[reasonName]` | Initial rejection, latest queued value for both queued callers, recovery and call count |
| `serialize-graph` | `[kind, sharedValue, options?]` | Returned serialized value or observed exception type |

Rejection names: `undefined`, `null`, `false`, `zero`, `empty`, `nan`, `error`. Graph kinds: `shared-object`, `shared-array`, `cycle`. Graph recipes build actual identity relationships after JSON decoding. A genuine library exception is captured as an observed result, so a false circularity error can distinguish the original from the repair; compilation/harness failures remain errors. The UI shows the allowed syntax for the current task and rejects unsupported custom recipes.

## Reproduce locally

```
npm test
npx playwright test
npm run replay:repository -- --all --out corpus-replay.json
npm run replay:repository -- --task debounce-rejection
npm run replay:repository -- --task stringify-shared-reference --candidate /absolute/path/to/index.js
npm run verify:runner -- --out runner-verification.json
```

Docker must be running with the manifest's pinned image available. No paid model provider is used. The replay CLI verifies hashes, stages only curated task files, denies network, uses non-root/read-only/resource-limited containers, caps output and forces cleanup after deadlines. It never mounts the project root, credentials, reference directory or Docker socket. See `REPOSITORY_TASK.md` for the container controls and runtime architecture. The static web server does not invoke this CLI.

## Validation and limits

App checks: 6 Node baseline/integrity checks and 14 browser scenarios passed. New checks cover the full failure → repair → meaningful-regression loop for both additions, independent graph identities, async outcomes, changes invalidating evidence, controls that must not qualify, unsupported recipes, unavailable browser Node imports, async timeout and mobile layout. The Docker replay JSON records all three before/after runs separately, including which suite was used.

This expands the corpus across three bug families. It is still small and all fixes are public. The existing inventory warm-up is uncoached practice, not a clean hidden transfer benchmark. More tasks, separate held-out task families, mentor evaluation and real learner outcomes are required before efficacy or employment claims. The local Docker adapter is not a deployed arbitrary-code service or tamper-proof grader; code and test harness share a process. No new AgentFoundry trial tokens, model API credentials, network analytics or publication were used in this iteration.

# First historical repository task: url-join fragment preservation

Task ID: `url-join-fragment`, version 1. This is a real historical bug in a public library, not an invented production incident. It is an introductory repository maintenance task, not evidence that the complete apprenticeship is effective.

## Source and rights

- Repository: https://github.com/jfromaniello/url-join
- Merged fix: https://github.com/jfromaniello/url-join/pull/133
- Baseline commit: `32815bf5d91a5e0add5c7c9ee3b74d2ae61885de`
- Repair commit: `cceb648e479c25b8b16dc71aebec852d4d87f679`
- Source: `lib/url-join.js`; upstream tests: `test/tests.js`.
- MIT, Copyright (c) 2015 José F. Romaniello. The full upstream license is retained in the corpus and served beside the task.

`corpus/url-join-fragment/manifest.json` records exact revisions, file hashes, transformations, license, public-fix contamination, and pinned runtime. The baseline snapshot contains every non-dot tracked file at the baseline revision. The reference source and test file are exact files from the repair commit. CI and dotfiles are not imported or executed. No repository dependency installation or package script is required.

## Observed failure

The original implementation splits a URL at every `#` and retains only the first two pieces. For example, joining `https://example.com`, `docs`, and `#section#details` loses `#details`. The upstream repair preserves the complete suffix after the first delimiter.

The browser editor receives the complete baseline module, byte-for-byte. It executes via native ES module import inside a disposable worker in the opaque-origin practice frame. Source code is not rewritten to remove `export`. Ten visible browser cases transcribe selected upstream assertions and add one clearly labelled FixFirst boundary case. Baseline: 5/10 pass. Upstream repair: 10/10 pass, or 11/11 with a passing learner custom case. This browser subset is not the full upstream suite.

The full upstream suite at the repair revision has 31 tests. Replaying it against the baseline produces 29 passes and 2 failures. Replaying the identical suite against the repaired source produces 31 passes and zero failures. The JSON replay artifact records actual execution output, image digest, revisions and source hashes.

## Run the app

```
npm install
npm run dev
```

Open http://127.0.0.1:4173/?task=url-join-fragment. Run the original module, write a hypothesis, make a repair, and add a case that fails against original code but passes against the repair. The work-sample JSON includes task-level provenance and the two regression outcomes. All of this remains browser-local; the local web server does not execute learner code or invoke Docker.

## Reproduce the upstream suite

Docker must be running. This verified image was already present on the development machine; another machine may need to fetch it explicitly:

```
docker pull node@sha256:bc0a2afd3b74ce12222fc8bab99271e66257f021078f5f4a5d687a77d280c1d9
npm run replay:repository -- --out replay.json
```

The pinned image was verified as Linux ARM64, Node 26.13.0 bookworm-slim. Other architectures require explicit validation, not silently substituting a floating tag. The replay script itself uses only Node built-ins.

To verify a local candidate without executing it on the host:

```
npm run replay:repository -- --candidate /absolute/path/to/url-join.js --out candidate-replay.json
```

The runner verifies corpus hashes, then constructs a fresh temporary task containing only the selected source, upstream tests, package metadata, README and MIT notice. It mounts that directory read-only at `/task`. Reference answers, host project files, credentials and the Docker socket are not mounted. Development machines using Colima need a shared project path; scratch space is under `.runner-work/` and is removed afterward.

Controls: pinned image, no network, non-root UID/GID 65534, read-only root and task mount, dropped Linux capabilities, no-new-privileges, 256MB memory and swap cap, one CPU, 64-process limit, bounded file descriptors, 16MB temporary filesystem, 128KiB captured-output cap and 15-second execution deadline. The script forcibly removes its own named container in `finally`; killing just the Docker client would be insufficient. It never removes unrelated containers or alters daemon configuration.

`node scripts/verify-runner.mjs --out runner-verification.json` runs opt-in Docker integration probes for user ID, write restrictions, environment isolation, network denial, capabilities, no-new-privileges and an infinite-loop deadline. These checks supplement, rather than replace, a security review.

## Limits and next gate

This is a local CLI replay adapter for one curated repository, not a deployed arbitrary-code execution API. Learner code and the upstream test harness share a Node test process in the container; adversarial candidates can tamper with grading or attempt to forge output. A successful replay means the known reference repair passes the observed suite, not a tamper-proof assessment or exhaustive correctness proof. Browser tests and local evidence remain inspectable and editable.

The fix and tests are already public. This task must not be used as a hidden, uncontaminated transfer evaluation. Future tasks need more diverse modules, dependencies and bug families, plus a separately isolated authoritative grading protocol before deployment. No language-model provider, network analytics, paid service, public deployment, or employment certification was added in this iteration.

Docker control reference: https://docs.docker.com/reference/cli/docker/container/run/
Security context: https://docs.docker.com/engine/security/

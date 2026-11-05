# FixFirst local mentor

The mentor is an execution-grounded coaching-action planner. A local language model selects an allowed teaching move; application code renders the question, citations and optional source window. It does not expose a free-form model answer channel or generate learner patches.

## Run

```
npm install
npm run mentor:prepare
npm run dev
```

Open a task, run the code, write a hypothesis and click **Help me investigate**. The first setup downloads the pinned public model; later inference reads the revision directory directly from `.model-cache/` with model-fetch networking disabled. Model weights are excluded from Git and the deliverable source ZIP. No Claude subscription, AgentFoundry trial allowance, paid inference API or API credential is used. Compute runs on the local machine.

The model is `onnx-community/Qwen2.5-Coder-1.5B-Instruct`, Q4 CPU, revision `774cc908b6c2be23bc4e8d4e401e4f8b8fba7daf`. Its model card declares Apache-2.0 and identifies the Qwen upstream model. The quantized ONNX file is about 1.92GB; the local setup needs additional working memory. Transformers.js is pinned in package.json and package-lock.json. The manifest in `mentor/model.json` records the model and generation cap. This is a development runtime, not a claim that a 1.5B model is the best teaching model.

- ONNX model: https://huggingface.co/onnx-community/Qwen2.5-Coder-1.5B-Instruct
- Upstream: https://huggingface.co/Qwen/Qwen2.5-Coder-1.5B-Instruct
- Runtime documentation: https://huggingface.co/docs/transformers.js/pipelines

## Flow and evidence contract

1. The browser sends the task ID, current source, hypothesis, custom-case text and last run to the same-origin local Node endpoint. It sends no reference repair or full history.
2. Server-owned task policy blocks coaching for the transfer task, even if a crafted request says otherwise. Missing runs, changed source/custom cases, execution errors and insufficient hypotheses produce guided prerequisites without calling a model.
3. The server whitelists known test names and expected values from the task catalog, bounds observed values, and labels the observations as **browser-reported**. This is practice evidence, not independently certified execution.
4. The planner receives a compact task contract, learner statement, selected passing/failing observations and a bounded excerpt of current learner source. No reference source, fix revision, upstream fix URL, file tools, shell tools or unrestricted provider endpoint is included.
5. The model selects an uppercase action identifier from the current menu. Exact numeric identifiers remain supported for adapter compatibility. Extra prose, code, invalid labels or out-of-stage choices are rejected. Raw model text is never rendered as a question, citation or patch.
6. The application renders an approved question and citations whose IDs come from the evidence packet. A trace shows exact numbered lines from current learner source. The UI rechecks source, custom case, hypothesis, task and run timestamp before showing a reply; changed context discards the reply.
7. Accepted hints record action, mode, model revision where applicable, evidence and source hash in local history and the work-sample export. Prerequisite messages do not count as hints. No server-side learner history or analytics database is created.

Teaching moves: observe the mismatch, contrast with a passing control, predict a falsifying experiment, trace source state, design a regression, or explain preserved behaviour. The available menu progresses after hint use; completed reported suites move to regression/explanation. This teaching scaffold exists independently of the model. Model selection is only one part of the system and must be compared against that scaffold in learner evaluation.

## Failure handling and limits

A malformed model reply, unavailable cache/runtime, busy model or deadline returns an explicitly labelled **guided fallback** using the same evidence and approved question catalog. Prerequisite messages are labelled guided coaching. The UI distinguishes these from a validated **local AI planner** decision. It does not silently present a template fallback as a generated answer.

The model runs in one owned child process, with one inference in flight, a 30-second deadline and an eight-token generation cap. Timeout kills that child. API credentials are not inherited into the child environment. Context is bounded; the HTTP body is capped at 64KiB and rate-limited to eight requests per minute per local server. Same-origin JSON POST and a local Host header are required; cross-origin requests, unsupported content types and other methods are rejected. The server binds to 127.0.0.1 and has no access-log handler. The mentor endpoint never executes learner source. Browser workers and the opt-in Docker replay remain separate execution paths.

These controls do not make an unauthenticated local development server safe to expose publicly. A deployed service still needs authenticated access or abuse control, separate model hosting, resource accounting and a production privacy/log-retention review. The mentor uses client-reported test results; a forged browser record can mislead it. It is not an authoritative grader or hiring assessment.

## Evaluation method

`npm test` and `npx playwright test` verify policy, HTTP and UI behaviour with deterministic test doubles where appropriate. They cover server-side transfer blocking, missing/stale evidence, runner errors, incomplete hypotheses, invalid/oversized requests, rate limiting, prompt-injection attempts, patch-shaped model output, fabricated citation payloads, provider outages, source-line integrity, unsupported actions and in-flight reply invalidation. A successful test-double result is not represented as real inference.

`npm run mentor:evaluate -- --out mentor-evaluation.json` is an opt-in live local-model check. It executes the public practice tasks in Chromium, reads those actual results, and asks the model to select a next action. It also reorders the action menu to expose position bias. Expected actions are declared by the developer and are not independent human ratings. The intentionally broken batch fixture times out on invalid size; that is a guided execution-error prerequisite and is excluded from model-choice scoring.

An initial SmolLM2-360M experiment returned the first numeric option for all five eligible cases. A later Qwen numeric-menu experiment produced valid outputs but matched only seven of ten declared action preferences, with a positional tendency. Those diagnostics motivated uppercase semantic labels, compact evidence and stage-bounded menus. Neither initial success count is evidence of superior tutoring. The final live evaluation artifact must be read separately from policy-test counts.

No learner efficacy, independent transfer improvement or employment impact has been established. The necessary next evaluation compares the model-backed planner with the same deterministic teaching scaffold, standard coding-assistant access and appropriate task-only controls, with separate held-out tasks and real consenting learners.

## Final development check

The final semantic-label planner produced valid choices in 10/10 eligible decisions and matched the developer-declared action sets in 10/10. Five scenarios were each presented in production and reordered menus; one additional execution-error case correctly bypassed inference. It selected the first option in 3/10 decisions, so the observed choices were not simply first-option defaults. Median measured decision latency was 3866ms on this development machine. This small test was used while refining prompts and is not held-out evidence of generalization.

All 16 Node tests and 19 browser scenarios passed. A separate live UI-to-local-endpoint check returned a Qwen-backed comparison question with the correct passing/failing citations in 5369ms, without page errors or mobile horizontal overflow. The screenshot and JSON artifact record that observation; timing is not a service guarantee. Cached inference was exercised with the model-fetch function disabled and direct local revision paths. Five cached model-asset SHA-256 hashes are recorded in `mentor/model-assets.json`; weights are not redistributed in the source package.

# FixFirst hosted development app

This Sites/Cloudflare Worker serves the FixFirst practice app, bounded AI mentor, independent assessment workspace, optional cloud development grading, and calibration portal.

## Services and truthful labels

The server sends a bounded hypothesis, a five-line learner source excerpt and selected browser-reported test observations to the Hugging Face planner. Pinned Qwen2.5-Coder-1.5B-Instruct selects one allowed action. The server validates it against the learner's current evidence and renders an approved question. Successful responses say **Hosted AI planner**; queues, quotas, invalid model outputs or outages produce an explicitly labelled **guided fallback**. No patch text from the model is rendered. This is PyTorch BF16 on ZeroGPU, separate from the original local ONNX Q4 serving implementation.

Cloud grading is an explicit action on `/grade.html`. The visitor selects an exported assessment and acknowledges transmission. Only executable task fields are sent; diagnosis text, participant codes, session IDs and timestamps are stripped in browser and server. Reports use `fixfirst-development-grade`, engine `quickjs-ng-development-v1`, and `notLearnerData: true`. This is not the original frozen Docker grading engine and cannot be pooled into study outcomes. Human diagnosis remains pending. The original local Docker grader and frozen protocol remain available separately.

## Runtime configuration

`FIXFIRST_SERVICE_URL`: backend HTTPS origin.

`FIXFIRST_SIGNING_KEY`: server-only ECDSA-P256 PKCS8 PEM private key, configured as a Sites runtime secret. Never commit it or ship it to visitors. The backend source holds only the corresponding public verification key. Requests bind payload hash, API name, timestamp and nonce; the backend rejects expired or replayed signatures. No signing private key reaches Hugging Face. Backend calls are serialized; the frontend also has a best-effort per-isolate minute limit. This is a low-volume demonstration, with free service queues and daily quotas.

## Data and assessment integrity

Practice code runs in disposable browser workers behind an opaque-origin iframe. Progress and pilot drafts stay in browser storage until manual download. Clicking a hint sends source, hypothesis and browser-reported results to this site's API and a bounded subset to the model service. Grading sends executable source/cases to Hugging Face only after an explicit acknowledgement. There is no app database, analytics receiver or automatic submission endpoint. Providers and Gradio process requests and temporary queues under their own policies; the app does not establish a provider retention promise. Never enter secrets.

The Site Worker includes only public assessment contracts, baselines and visible examples. It does not ship reference repairs or hidden cases as browser assets. The backend's public source repository includes the authored development bank and answers. This is not a contamination-free benchmark. People exposed to answers must be excluded from independent calibration summaries.

Assessment cookies block ordinary coaching and cloud grading while an assessment is active. This is not proctoring. Sessions are anonymous and not identity verified. The original `transfer-dev-v1.2` bank remains unchanged; hosted delivery and remote development grading do not establish a learning effect. Server start times and browser fallback end times are labelled in exports. Zero verified participants or measured learning effects existed at publication.

## Build and verify

`bash scripts/build.sh` assembles `source/`, `remote-service.js` and `worker-api.js` into the self-contained Worker and deployment artifact.

`node scripts/validate-artifact.mjs`

`node --test tests/services.test.mjs`

`node scripts/preview.mjs` serves port 4180. Without runtime configuration it uses the no-model guided baseline. Do not serve the full original project directory as public assets.

## Judge walkthrough

Open `/?task=url-join-fragment&demo=1`. This supplied-reference tour executes every result and keeps progress separate from ordinary practice. Its exports set `notLearnerData: true`; no independent learner achievement is claimed.

## Routes

- `/`: practice and bounded mentor
- `/assessment.html`: uncoached workspace
- `/grade.html`: optional cloud development feedback
- `/pilot/`: calibration information and manual observations
- `/api/mentor/config`: configured capabilities and availability limits

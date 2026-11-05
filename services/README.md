---
title: FixFirst Services
emoji: 🔎
colorFrom: indigo
colorTo: green
sdk: gradio
sdk_version: 6.31.0
python_version: 3.12
app_file: app.py
pinned: false
license: mit
short_description: AI debugging mentor and isolated development grader
models:
  - Qwen/Qwen2.5-Coder-1.5B-Instruct
---

# FixFirst services

Backend for the FixFirst debugging apprenticeship. Free ZeroGPU hardware only; no paid hardware or credits required or configured.

Requests must carry a short-lived ECDSA-P256 signature from the trusted frontend server. The private signing key lives only in Sites runtime secrets (`FIXFIRST_SIGNING_KEY`); this backend holds only `service-public.pem`. Requests bind the payload hash, API name, timestamp and one-time nonce, and replayed/expired signatures are rejected before inference or grading. No shared secret is needed in this Space or sent through Gradio. Calls are serialized and the queue is bounded. API inputs and temporary results are handled by Gradio/Hugging Face; there is no app submission database or application logging of learner content. This does not establish a hosting-provider retention guarantee.

## Mentor

Pinned Apache-2.0 Qwen2.5-Coder-1.5B-Instruct, revision `2e1fd397ee46e1388853d2af2c993145b0f1098a`, PyTorch BF16 on ZeroGPU. This is a different serving implementation from the local ONNX Q4 planner; disclose that difference. The model outputs one teaching action from a whitelist. The frontend server validates that choice against the current evidence and renders fixed approved prompts. No assessment cases or reference repairs are sent to the model. GPU is released after inference. Free queues and quotas can cause unavailability; labelled guided fallback remains available.

## Grader

`quickjs-ng-development-v1` is development feedback, **not** the original frozen Docker grading engine. Reports use `fixfirst-development-grade` and always set `notLearnerData: true` to prevent accidental inclusion in the original study pipeline. The task bank is the authored MIT development bank, not a contamination-free benchmark. Reference implementations and cases are visible in this source repository; people who have seen them cannot supply independent calibration results.

Every case uses a fresh Python child process and a fresh QuickJS VM. Candidate JavaScript has no module loader, Python callbacks, Node APIs, filesystem or network functions. Expected answers remain in the grading parent. The child receives only source and input arguments, with an empty environment. JS memory, stack and CPU limits, a wall deadline, and bounded microtask/output limits apply. Captured serialization operations ignore learner `toJSON` overrides and grading never trusts candidate pass claims. These controls are a restricted VM, not a nested Docker or kernel security boundary; native engine vulnerabilities remain a reason to keep this a low-volume development service.

Human diagnosis scoring is deliberately pending. Feedback does not verify identity, unaided work, employability, or an AI learning effect. Use the original local frozen Docker grader for the prospective study until a new engine protocol is validated and frozen.

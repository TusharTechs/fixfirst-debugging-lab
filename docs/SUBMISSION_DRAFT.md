# [Submission] FixFirst — Debugging apprenticeship for first-time developers

**Draft only. No submission issue has been filed.** Prepared against the official submission template on 5 November 2026. Owner should review the required declarations before submitting.

## Team / Project name

FixFirst

## Team members (names + GitHub handles)

Tushar Agarwal (@TusharTechs)

## Problem statement

First-time developers need practice diagnosing and maintaining unfamiliar code, and a work sample that makes their process inspectable. A finished patch does not by itself show how its author reproduced the failure, distinguished a cause or protected the repair. FixFirst addresses this specific practice and evidence gap for junior developers and job-seeking learners. The prevalence of this exact gap has not been measured nationally by this project.

## What you built

An open-source debugging apprenticeship with three authored warm-ups and three licensed historical repository bug families. Learners edit complete modules, execute actual tests, write a hypothesis, obtain evidence-grounded coaching questions, repair code and construct a regression that must fail against the original and pass against the repair. A bounded hosted Qwen planner selects an allowed teaching action; controlled application policy renders questions and citations instead of generated repairs. The app includes uncoached development assessments, clearly separated technical work-sample exports, an optional acknowledged remote development grader and a digest-pinned local Docker replay/assessment path.

The judge walkthrough shows a real url-join failure: 5/10 browser cases on the original, 10/10 on the published repair, and 11/11 after adding the supplied regression. Its export explicitly identifies the supplied hypothesis, reference repair and case. It is a technical demonstration, not an independent learner outcome.

**AgentFoundry provenance:** a real user-operated SMART-Code iteration made partial regression-check edits before reaching the tool cap. Codex prepared most source, completed the implementation, tested and deployed it. This is not described as an exclusively AgentFoundry-built project. The development log records the scope; the owner should review the eligibility declaration in light of that attribution.

## GitHub repository URL

https://github.com/TusharTechs/fixfirst-debugging-lab

## Demo URL (live app or video)

https://fixfirst-debugging-lab.tusharaggarwal274.chatgpt.site/?task=url-join-fragment&demo=1

[Silent technical walkthrough (2:56)](https://github.com/TusharTechs/fixfirst-debugging-lab/blob/main/demo/FixFirst-demo.mp4) · [Voiceover script](DEMO_SCRIPT.md). The live route is sufficient for the template's live-app/video field; no invented video-hosting URL is provided.

## Scale & severity of the problem

The ILO–IHD *India Employment Report 2024* reports that, in 2022, youth accounted for **82.9% of all unemployed people**, and educated youth with secondary education or above accounted for **65.7% of all unemployed people** (printed page 90, Figure 4.10 discussion). These are composition shares of the unemployed population, not unemployment rates among all young people. They establish broad context for youth employment, not the number of junior coders affected by FixFirst's narrower practice gap or the number it can serve. [Primary report](https://www.ilo.org/sites/default/files/2024-08/India%20Employment%20-%20web_8%20April.pdf).

The concrete product-level failure is missing evidence of diagnosis and regression safety in a developer's work sample. We demonstrate it with actual historical library failures rather than inventing placement rates, lost wages or an affected-user count. Quantified economic loss attributable to this specific gap has not been established by this project.

## Deployment & impact data

Public frontend on Sites/Cloudflare Workers; hosted mentor and development grader on Hugging Face free ZeroGPU. Actual live checks verified hosted model inference, code execution, meaningful regression evaluation, assessment coaching block, acknowledged remote grading, field minimization, download availability and mobile layout. The source includes technical verification artifacts, test commands and exact replay scope.

The complete upstream url-join replay reproduced **29/31** on the baseline and **31/31** on the reference. The browser demonstration uses a smaller suite and reports its separate counts. Thirty-two original Node checks and five hosted-service tests passed. The remote development engine's checks accepted all eight reference tasks, detected all eight buggy baselines and rejected ten hostile or invalid cases.

**No independently recruited participant count, field outcome, learning gain, placement outcome or causal effect is claimed.** Recruitment was skipped at the owner's request. Automated requests and supplied-reference walkthroughs are technical validation, not field impact. Free queues and quotas can produce explicitly labelled guided fallback.

## Track / category

Intended impact area: **Tech Employment for Youth**, matching portfolio building, apprenticeships and hiring signals on the [main official page](https://codeforindia.org/hackathon).

The [current issue template](https://github.com/karlmehta/code-for-a-billion/blob/main/.github/ISSUE_TEMPLATE/submission.yml) lists Agriculture, Health, Education, Financial Inclusion, Governance, Climate and Other. If that template remains unchanged, select **Other** and state the intended Tech Employment for Youth area explicitly in the text. The primary and secondary pages also disagree on prize descriptions; no prize claim is made here.

## Contact email

tusharaggarwal274@gmail.com

## Required confirmations — owner review

- [ ] Built using AgentFoundry (AF), the official IDE — review the partial, accurately disclosed iteration above.
- [ ] Our repository is public and includes a README with setup steps — check the final published URL.
- [ ] The demo link works and is accessible to judges — check the live tour immediately before submission.

## Official references checked

- [Main event page](https://codeforindia.org/hackathon): deployment/open-source deadline stated as 15 November 2026; live app or a short video accepted.
- [Judging rubric](https://github.com/karlmehta/code-for-a-billion/blob/main/JUDGING.md): four equally weighted criteria; impact remains an acknowledged evidence gap here.
- [Submission template](https://github.com/karlmehta/code-for-a-billion/blob/main/.github/ISSUE_TEMPLATE/submission.yml): fields and category options copied structurally, not treated as resolved track policy.

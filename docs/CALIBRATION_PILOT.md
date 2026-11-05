# Calibration pilot — operator guide

**Current direction:** real-participant recruitment is skipped at the owner’s request. The procedures below are optional future calibration instructions. Use technical demonstrations and automated verification without claiming human learning outcomes. For any voluntarily shared feedback, the owner approved private email to tusharaggarwal274@gmail.com, owner-only access, and manual deletion within 30 days of receipt. Email reveals the sender address; the exchange is not fully anonymous. No files have been received and no deletion schedule has been triggered.

The calibration workflow is available publicly and locally. No human participants have been enrolled, no invitations sent and no calibration or learning benefit measured. Its purpose is to find unclear instructions, tooling problems and gross difficulty issues before a learner-effect study.

The local participant contact is configured as **tusharaggarwal274@gmail.com**, supplied by the project owner. The address is in `pilot/local-config.json`, which is ignored by Git and excluded from the source ZIP. The example configuration has no contact; another installation stays in demo mode until its operator sets one. No email is sent by the application.

## Start and check

Run the services in separate terminals:

```
npm run dev
npm run dev:baseline
npm run pilot
npm run pilot:preflight -- --out pilot-setup.json
```

- Participant portal: http://127.0.0.1:4175/
- Assessment service: http://127.0.0.1:4173/
- Later no-model comparison: http://127.0.0.1:4174/

These are **local addresses**, for the operator’s services. Participant links are now public: Form A — https://fixfirst-debugging-lab.tusharaggarwal274.chatgpt.site/pilot/?form=A ; Form B — https://fixfirst-debugging-lab.tusharaggarwal274.chatgpt.site/pilot/?form=B . Share only the assigned form. The separate hosted cloud grader produces development feedback and must not replace the frozen local grader in calibration aggregation. The setup check verifies the current freeze, contact, local services and grading image; it does not establish consent, enrollment, a storage agreement, statistical power or impact.

The assessment delivery is now `transfer-dev-v1.2`. Task definitions and scoring are unchanged from v1.1; v1.2 adds an independent stop-without-export action and accurate messaging when the local server cannot confirm a session end. Earlier freezes are archived as technical development history. No learner records existed during these changes.

## Before inviting a person

1. Use a volunteer comfortable enough to read basic JavaScript. Do not use this session to make hiring, admission or grading decisions.
2. Agree on where voluntarily shared files will be stored, who can access them, retention/deletion arrangements and how a participant can contact the operator. The application does not enforce deletion of copies outside the browser. Do not promise automatic removal of shared files.
3. Use one assigned form per calibration participant. The portal accepts `?form=A` or `?form=B`; without an assigned form it makes a local random choice. Keep track of coverage without changing assignments after seeing performance. This is calibration, not an AI-vs-baseline intervention session.
4. Use a fresh browser profile for a new person. Assessment and observation drafts persist on the device. Do not let a participant resume another person's source or feedback.
5. Do not give the same person both forms, show the reference repair or expose hidden cases. Source reviewers and uncertain/exposed participants can test the workflow, but their observations must be counted as excluded from independent difficulty summaries.
6. Keep calibration records separate from future pretest/posttest outcomes. The calibration checker accepts preview grades joined to consented observations; the learner-effect report rejects preview or synthetic grades.

This is a participant-information and workflow draft for a local software pilot, not an externally approved research study or an established confirmatory design. Settle the actual study arrangements before collecting shared data.

## Standard opening script

> We are checking whether these debugging tasks and tools are understandable. This is not a job application, certification or test of your worth. You will try one form containing four tasks without a mentor. The current protocol allows 12 minutes per task; you can skip a task or stop whenever you want. Please do not use another person or AI assistant during the attempt; if you do, report that honestly. Your work stays on this device until you choose to export it. Exporting does not send it to us. You decide whether to hand over the files. Before sharing, we will agree how they are stored and deleted. Please do not put personal information or secrets in the code or notes. Questions and deletion requests for shared copies go to the contact shown in the portal.

Ask the person to read the on-screen information, answer the prior-exposure question and choose whether to check the unselected participation box. Do not check it for them. If they decline, stop; they may use the clearly labelled technical demo instead. Real calibration requires a configured contact, an explicit checkbox acknowledgement and an exposure answer. This is a self-report, not identity verification.

No participant name, email, employer, age or ID is requested. The portal generates a random `CAL-…` code. That code joins the observation to the assessment export and any later deletion request. The project owner's contact email is displayed; participant contact details are not collected.

## During the attempt

1. From the portal, open the assigned uncoached assessment in its own tab. The link carries the random code, form and preview phase. The local mentor is blocked while an assessment is active.
2. The operator manages the per-task budget consistently. The UI does not enforce a timer or measure focused attention. Record approximate time as self-reported, not measured active work.
3. Do not point to the faulty line, suggest a repair, explain the algorithm or provide an answer. A neutral prompt is: “Which part of the instruction is unclear?” Record tool help separately from independent work.
4. If the editor, runner or device fails, record the tooling issue. Do not silently treat an environment failure as evidence that the learner cannot debug. Do not fix task content mid-batch and pool both versions.
5. The person can choose **End without export** at any point. After their confirmation, it ends the local assessment and removes only the current form's saved drafts. It creates no download, preserves unrelated local progress and does not remove previously exported/shared files.
6. If they finish and want a work sample, **Export & end assessment** creates a local JSON file and releases the coaching block. Passing the visible examples is not a final grade.

## Feedback and voluntary handover

Back in the portal, record for each task:

- attempted, skipped or not reported;
- whether assistance was used;
- contract clarity and perceived difficulty, each 1–5 or not reported;
- approximate minutes, explicitly self-reported;
- issue categories and an optional note without personal information or secrets.

The person may attach their assessment export to the portal. It must match the random code, form and bank hash. Only its session ID and file hash are kept in the observation; source and reasoning are not copied into that file. Attachment and export do not upload to a server.

**Export observation** creates a second local JSON file. A technical demo always carries `source: technical-demo` and no human consent, even if someone checked the participation box first. The calibration checker excludes it. **Stop and remove local draft** removes the portal draft after confirmation, but cannot remove assessment-origin storage, downloaded files or operator-held copies. The portal tells the person to end any still-open assessment separately.

Handing over either file is optional. Do not email or publish files automatically. If the person chooses to share, retain the agreed minimal data in the agreed location and follow their deletion requests. Reports omit raw notes and source, but raw exports can contain both.

## Offline grading and aggregation

For each voluntarily shared assessment export:

```
npm run benchmark:grade -- --submission /absolute/path/to/assessment-export.json --out /private/grades/grade-CAL-code.json
```

Keep the observation JSONs and grade JSONs in separate directories. The original assessment exports contain source/reasoning and must not be put in the observation directory. For a batch:

```
npm run pilot:collect -- --observations /private/observations --grades /private/grades --out-dir /private/batch
npm run pilot:check -- --records /private/batch/observations.json --grades /private/batch/grades.json --out /private/calibration-report.json
```

The collector reads only the explicitly supplied directories, validates record kinds and writes file hashes. It sends no data to a service. The checker rejects mixed bank/policy versions, duplicate codes/grades, wrong-form tasks, invalid ratings, inappropriate intervention grades and mismatched attached-session IDs. Demo records, unconsented records and known/uncertain answer exposure are retained as exclusion counts. Assisted or unreported assistance is not counted as an independent task attempt.

Missing grades remain **unknown**, not failures. Skipped or unreported tasks do not become completed calibration attempts. This differs deliberately from the later learner-study intention-to-treat rule, where missing posttest tasks count as not passed. Do not mix the purposes.

## Reading the triage report

The report shows independent/graded/ungraded attempts, assistance and missingness, pass rates, median clarity/difficulty/self-reported time, issue counts and explicit coverage flags. A rate's `onePersonRateIncrement` shows how much one additional observed result can matter in that small sample. Raw notes and source are not echoed into reports.

`pilot/protocol.json` declares the provisional gates before any human observations:

- fewer than five independent or graded attempts per task is insufficient coverage;
- fewer than five clarity ratings is insufficient clarity coverage;
- median clarity below four prompts wording review;
- with coverage, pass rates below 0.20 or above 0.85 flag possible floor/ceiling issues;
- trained-family form gaps above 0.20 prompt human review.

These are **developer-chosen triage defaults**, not a powered sample-size recommendation, a validated educational standard or an equivalence test. Coverage never sets `equivalenceEstablished` to true. Form comparisons remain unknown until both sides have coverage, and ability differences, self-report, selection and small samples still require interpretation. Exploratory interval/pagination tasks are not treated as parallel family forms.

A single tooling or wording complaint may justify qualitative review even while numeric coverage is insufficient. Review flags; do not tune task difficulty to make the AI look better. If tasks, scoring or delivery change, create a new benchmark version, preserve the earlier records and do not pool versions by default. Calibration participants and exposed source reviewers should not become the supposedly unexposed evaluation cohort.

## Invitation draft — not sent

> I’m preparing a small FixFirst pilot to check the clarity of JavaScript debugging tasks. Participation is voluntary: one uncoached form with four tasks, followed by optional feedback and file sharing. You can skip tasks or stop, and this is not a hiring or certification assessment. No participant name or email is required in the app. If you’re interested, contact tusharaggarwal274@gmail.com to arrange a session and discuss how any shared files would be handled.

Use the public form-specific links above for remote participants; the localhost links are for the operator only. No invitations or recruitment messages have been sent by this work.

## Current status

The configured local services and pinned grading image passed six setup checks. There are **zero real human calibration observations and zero learner-effect results**. The empty calibration report has null pass rates, insufficient-coverage flags, `equivalenceEstablished: false` and no effect estimate. The source ZIP excludes the actual operator contact file, model cache and participant-data directories.

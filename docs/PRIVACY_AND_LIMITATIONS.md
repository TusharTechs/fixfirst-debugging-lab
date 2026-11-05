# Data handling and limits

Practice code, hypotheses and test history are stored in browser localStorage. The judge walkthrough uses a separate key and explicitly marks supplied material. Closing a tab does not delete saved drafts; reset controls or browser storage settings can remove them. Exporting downloads a JSON file and does not email or publish it.

Hint requests send current source, hypothesis and browser-reported test output to the site's Worker. A bounded hypothesis, five-line source excerpt and selected test observations reach Hugging Face for action planning. Neither the task reference repair nor assessment answer bank is sent to the model. The model's free-form code is not rendered; allowed actions are validated and mapped to approved questions. Browser-reported practice evidence is not independently certified.

Cloud grading is a separate, optional acknowledgement on `/grade.html`. It transmits executable source and cases through the Worker to Hugging Face. Written diagnosis, allocation codes, session IDs and timestamps are stripped from this request. Providers and Gradio process requests and temporary queues under their policies. The app has no durable participant database or analytics receiver and does not establish provider retention guarantees. Never enter secrets or personal information in code or notes.

The remote grader uses a fresh restricted QuickJS VM in a child process per case. It exposes no JavaScript I/O, Node APIs, module loader or Python callbacks and applies resource deadlines. Expected values remain in the parent. This is not a kernel security boundary and native-engine vulnerabilities are not ruled out. Use this low-volume service for development feedback; the original local Docker grader has a different protocol and report kind. Human diagnosis is not automatically scored.

Assessment sessions block normal coaching and cloud-grading requests until ended. These are workflow controls, not identity verification, proctoring or protection from all client tampering. Source reviewers can inspect the authored assessment answers in the public backend repository. Forms are not calibrated or guaranteed unseen. Historical practice fixes are public by design.

No real-participant recruitment or impact study is active. Technical demo records must not count as people reached, learning gains, placement outcomes or employability certificates. Developer-declared model-action preferences and reference-repair scores do not establish tutoring superiority.

For feedback files someone voluntarily chooses to email, the owner approved **tusharaggarwal274@gmail.com**, owner-only access and manual deletion within 30 days of receipt, with earlier deletion requests honoured. Email reveals the sender's address and is not fully anonymous. The app cannot delete email, forwarded files or downloaded copies. No files have been received under this arrangement. This operator policy does not control infrastructure providers' retention.

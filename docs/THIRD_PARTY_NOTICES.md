# Third-party source notices

The `url-join-fragment` task redistributes code, documentation and tests from https://github.com/jfromaniello/url-join at the exact revisions recorded in its manifest. These remain under the upstream MIT license, Copyright (c) 2015 José F. Romaniello. The complete notice is included in `corpus/url-join-fragment/baseline/LICENSE` and `public/corpus/url-join-fragment/LICENSE`. The embedded source in `public/repository-task.js` is covered by that same notice.

FixFirst's task framing, visible case table and runner integration are separate contributions. The historical upstream fix is not represented as an original FixFirst repair or a novel, uncontaminated evaluation task.

The `debounce-rejection` task redistributes complete pinned `p-debounce` source, tests and documentation under MIT, Copyright (c) Sindre Sorhus. The exact notice is in `corpus/debounce-rejection/baseline/license` and `public/corpus/debounce-rejection/LICENSE`.

The `stringify-shared-reference` task redistributes a historical `json-stable-stringify` implementation from commits retained in the `fast-json-stable-stringify` fork. The package metadata at those revisions credits James Halliday; the exact historical MIT notice has no copyright line and is preserved in `corpus/stringify-shared-reference/baseline/LICENSE` and `public/corpus/stringify-shared-reference/LICENSE`. This is not represented as the fork's modern implementation. The embedded source in `public/additional-tasks.js` remains covered by the corresponding upstream notices.

The local mentor references the Apache-2.0 `onnx-community/Qwen2.5-Coder-1.5B-Instruct` model, derived from Qwen's upstream model, at the revision in `mentor/model.json`. Weights are downloaded separately into the ignored local cache and are not redistributed in the source ZIP. Source model cards and license declarations are linked in docs/MENTOR.md. Transformers.js and its transitive runtime dependencies are installed through npm with their own license notices; versions are recorded in package-lock.json.

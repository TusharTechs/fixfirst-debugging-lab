// Pinned public historical bugs; full source is embedded unchanged. See per-task MIT notices.
export const additionalTasks = [
  {
    "title": "When failure becomes success",
    "area": "Real repository · p-debounce",
    "level": "05",
    "minutes": "30–45 min",
    "skill": "Promise settlement & async state",
    "format": "esm-default",
    "brief": "A real p-debounce bug reported successful completion when a wrapped function rejected with a falsy reason. Repair the complete upstream module without breaking concurrent callers or queued work.",
    "contract": "pDebounce.promise() must preserve rejection and the exact reason, including undefined, null, false, zero, an empty string and NaN. Concurrent callers must share the same execution. Queued calls must still run after an initial rejection, and later calls must recover.",
    "allowedScenarios": [
      "promise-rejection",
      "promise-concurrent",
      "promise-queued-rejection"
    ],
    "caseHelp": "Promise recipes: promise-rejection takes [reasonName, callerCount]; promise-concurrent takes caller values; promise-queued-rejection takes [reasonName]. Reason names: undefined, null, false, zero, empty, nan, error. Outcomes report settlement, reason identity, recovery and call counts.",
    "question": "Does the code track whether a rejection occurred separately from the value it rejected with? Compare a null rejection with an Error rejection.",
    "regressionExample": {
      "scenario": "promise-rejection",
      "args": [
        "null",
        2
      ],
      "expected": {
        "statuses": [
          "rejected",
          "rejected"
        ],
        "reasonPreserved": true,
        "recovered": "recovered",
        "calls": 2
      }
    },
    "next": "stringify-shared-reference",
    "id": "debounce-rejection",
    "file": "index.js",
    "code": "const pDebounce = (functionToDebounce, wait, options = {}) => {\n\tif (!Number.isFinite(wait)) {\n\t\tthrow new TypeError('Expected `wait` to be a finite number');\n\t}\n\n\tlet leadingValue;\n\tlet timeout;\n\tlet promiseHandlers = []; // Single array of {resolve, reject}\n\n\tconst onAbort = () => {\n\t\tclearTimeout(timeout);\n\t\ttimeout = undefined;\n\n\t\ttry {\n\t\t\toptions.signal?.throwIfAborted();\n\t\t} catch (error) {\n\t\t\tfor (const {reject} of promiseHandlers) {\n\t\t\t\treject(error);\n\t\t\t}\n\n\t\t\tpromiseHandlers = [];\n\t\t}\n\t};\n\n\treturn function (...arguments_) {\n\t\treturn new Promise((resolve, reject) => {\n\t\t\t// Check if already aborted\n\t\t\ttry {\n\t\t\t\toptions.signal?.throwIfAborted();\n\t\t\t} catch (error) {\n\t\t\t\treject(error);\n\t\t\t\treturn;\n\t\t\t}\n\n\t\t\tconst shouldCallNow = options.before && !timeout;\n\n\t\t\tclearTimeout(timeout);\n\n\t\t\ttimeout = setTimeout(async () => {\n\t\t\t\ttimeout = undefined;\n\n\t\t\t\t// Capture the current handlers for this execution\n\t\t\t\tconst currentHandlers = promiseHandlers;\n\n\t\t\t\t// Clear handlers for next cycle (new calls during execution will add to new list)\n\t\t\t\tpromiseHandlers = [];\n\n\t\t\t\ttry {\n\t\t\t\t\tconst result = options.before ? leadingValue : await functionToDebounce.apply(this, arguments_);\n\n\t\t\t\t\tfor (const {resolve: resolveFunction} of currentHandlers) {\n\t\t\t\t\t\tresolveFunction(result);\n\t\t\t\t\t}\n\t\t\t\t} catch (error) {\n\t\t\t\t\tfor (const {reject: rejectFunction} of currentHandlers) {\n\t\t\t\t\t\trejectFunction(error);\n\t\t\t\t\t}\n\t\t\t\t}\n\n\t\t\t\t// Clear leading value for next cycle\n\t\t\t\tleadingValue = undefined;\n\n\t\t\t\t// Remove abort listener\n\t\t\t\toptions.signal?.removeEventListener('abort', onAbort);\n\t\t\t}, wait);\n\n\t\t\tif (shouldCallNow) {\n\t\t\t\t// Execute immediately for leading edge\n\t\t\t\t(async () => {\n\t\t\t\t\ttry {\n\t\t\t\t\t\tleadingValue = await functionToDebounce.apply(this, arguments_);\n\t\t\t\t\t\tresolve(leadingValue);\n\t\t\t\t\t} catch (error) {\n\t\t\t\t\t\treject(error);\n\t\t\t\t\t}\n\t\t\t\t})();\n\t\t\t} else {\n\t\t\t\t// Add to handlers for later resolution\n\t\t\t\tpromiseHandlers.push({resolve, reject});\n\n\t\t\t\t// Set up abort listener (only once per batch)\n\t\t\t\tif (options.signal && promiseHandlers.length === 1) {\n\t\t\t\t\toptions.signal.addEventListener('abort', onAbort, {once: true});\n\t\t\t\t}\n\t\t\t}\n\t\t});\n\t};\n};\n\npDebounce.promise = (function_, options = {}) => {\n\tlet currentPromise;\n\tlet queuedCall;\n\n\treturn async function (...arguments_) {\n\t\tif (currentPromise) {\n\t\t\tif (!options.after) {\n\t\t\t\treturn currentPromise;\n\t\t\t}\n\n\t\t\t// Queue latest call (replacing any existing queue)\n\t\t\tqueuedCall ??= {resolvers: []};\n\t\t\tqueuedCall.arguments = arguments_;\n\t\t\tqueuedCall.context = this;\n\n\t\t\treturn new Promise((resolve, reject) => {\n\t\t\t\tqueuedCall.resolvers.push({resolve, reject});\n\t\t\t});\n\t\t}\n\n\t\tcurrentPromise = (async () => {\n\t\t\tlet result;\n\t\t\tlet initialError;\n\n\t\t\ttry {\n\t\t\t\tresult = await function_.apply(this, arguments_);\n\t\t\t} catch (error) {\n\t\t\t\tinitialError = error;\n\t\t\t}\n\n\t\t\t// Process queued calls regardless of initial result\n\t\t\twhile (queuedCall) {\n\t\t\t\tconst call = queuedCall;\n\t\t\t\tqueuedCall = undefined;\n\n\t\t\t\ttry {\n\t\t\t\t\t// eslint-disable-next-line no-await-in-loop\n\t\t\t\t\tconst queuedResult = await function_.apply(call.context, call.arguments);\n\t\t\t\t\tfor (const {resolve} of call.resolvers) {\n\t\t\t\t\t\tresolve(queuedResult);\n\t\t\t\t\t}\n\t\t\t\t} catch (error) {\n\t\t\t\t\tfor (const {reject} of call.resolvers) {\n\t\t\t\t\t\treject(error);\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\n\t\t\tif (initialError) {\n\t\t\t\tthrow initialError;\n\t\t\t}\n\n\t\t\treturn result;\n\t\t})();\n\n\t\ttry {\n\t\t\treturn await currentPromise;\n\t\t} finally {\n\t\t\tcurrentPromise = undefined;\n\t\t}\n\t};\n};\n\nexport default pDebounce;\n",
    "entry": "default",
    "provenance": {
      "schemaVersion": 1,
      "id": "debounce-rejection",
      "version": 1,
      "kind": "Historical public repository bug",
      "repository": "https://github.com/sindresorhus/p-debounce",
      "issueOrPullRequest": "https://github.com/sindresorhus/p-debounce/pull/33",
      "baselineCommit": "8964dd202004f49d7b814c0292b064287b70f2d8",
      "fixCommit": "a14c7ac6817248b8db13eb0d30474c1f82588fe6",
      "sourcePath": "index.js",
      "testPath": "test.js",
      "license": "MIT",
      "copyright": "Copyright (c) Sindre Sorhus",
      "licensePath": "baseline/license",
      "testProvenance": "Browser recipes adapt upstream falsy-rejection and queued-call tests; the concurrency/recovery summary adds explicit control observations. Docker selects the seven upstream tests whose names match .promise() preserves. This is not the whole test suite, lint or type checks.",
      "transformations": [
        "Complete upstream source and baseline non-dot tracked files preserved without source edits.",
        "Browser uses native ES modules plus explicit promise callback recipes.",
        "Docker runs the unmodified fix-commit test.js with a test-name filter. No dependency install, lint or type check."
      ],
      "contamination": "Public historical fix and tests. Practice only; not a hidden or contamination-free transfer assessment.",
      "runtime": {
        "image": "node@sha256:bc0a2afd3b74ce12222fc8bab99271e66257f021078f5f4a5d687a77d280c1d9",
        "tagAtVerification": "node:26.13.0-bookworm-slim",
        "platform": "linux/arm64",
        "command": [
          "node",
          "--test",
          "--test-reporter=tap",
          "--test-name-pattern=\\.promise\\(\\) preserves",
          "test.js"
        ],
        "network": "none",
        "readOnly": true,
        "user": "65534:65534",
        "memoryMB": 256,
        "cpus": 1,
        "pidsLimit": 64,
        "deadlineSeconds": 15,
        "outputLimitBytes": 131072
      },
      "replay": {
        "sourcePath": "index.js",
        "files": [
          {
            "from": "baseline/package.json",
            "to": "package.json"
          },
          {
            "from": "baseline/license",
            "to": "LICENSE"
          },
          {
            "from": "baseline/readme.md",
            "to": "README.md"
          },
          {
            "from": "reference/test.js",
            "to": "test.js"
          }
        ],
        "command": [
          "--test",
          "--test-reporter=tap",
          "--test-name-pattern=\\.promise\\(\\) preserves",
          "test.js"
        ],
        "expectedBaselineFailures": 7,
        "suite": "Seven unmodified upstream regression tests selected by name"
      },
      "sha256": {
        "baseline/index.d.ts": "ccc0a7978569ded3476c51ba5c916ed1f167563299fe02f1913b2f55e3093d10",
        "baseline/index.js": "18a7a6a1ecba326f27480d2d55212c1d202b2a81ca96687d209b271cab012a6a",
        "baseline/index.test-d.ts": "8a484f6de76033d9752dc89de93534875c111a866c6e8d174ba743af33d19fb2",
        "baseline/license": "5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3",
        "baseline/package.json": "6721ecd2bee87b1f5de30b610c02a9f0e01b06e88605f4a9c8efa0dff5622177",
        "baseline/readme.md": "60ab50d68ec211954a97c54d17e28e959152edbc3cf25e9c87eaff4fffe70bf5",
        "baseline/test.js": "2c371b0dc79101b0740a23eb68016c41a884b3e554fe94b61a9d6393a6335bf8",
        "reference/index.js": "7a519eb4afed87d7b3c7eec0800c5379eae5ca53cf3e2ba325669ecf1338eeab",
        "reference/test.js": "df6b02860887968ce049f878ff8195cfce5991ad7a9336149422c4468c38c684"
      }
    },
    "tests": [
      {
        "name": "Rejection reason: undefined",
        "scenario": "promise-rejection",
        "args": [
          "undefined",
          2
        ],
        "expected": {
          "statuses": [
            "rejected",
            "rejected"
          ],
          "reasonPreserved": true,
          "recovered": "recovered",
          "calls": 2
        }
      },
      {
        "name": "Rejection reason: null",
        "scenario": "promise-rejection",
        "args": [
          "null",
          2
        ],
        "expected": {
          "statuses": [
            "rejected",
            "rejected"
          ],
          "reasonPreserved": true,
          "recovered": "recovered",
          "calls": 2
        }
      },
      {
        "name": "Rejection reason: false",
        "scenario": "promise-rejection",
        "args": [
          "false",
          2
        ],
        "expected": {
          "statuses": [
            "rejected",
            "rejected"
          ],
          "reasonPreserved": true,
          "recovered": "recovered",
          "calls": 2
        }
      },
      {
        "name": "Rejection reason: zero",
        "scenario": "promise-rejection",
        "args": [
          "zero",
          2
        ],
        "expected": {
          "statuses": [
            "rejected",
            "rejected"
          ],
          "reasonPreserved": true,
          "recovered": "recovered",
          "calls": 2
        }
      },
      {
        "name": "Rejection reason: empty",
        "scenario": "promise-rejection",
        "args": [
          "empty",
          2
        ],
        "expected": {
          "statuses": [
            "rejected",
            "rejected"
          ],
          "reasonPreserved": true,
          "recovered": "recovered",
          "calls": 2
        }
      },
      {
        "name": "Rejection reason: nan",
        "scenario": "promise-rejection",
        "args": [
          "nan",
          2
        ],
        "expected": {
          "statuses": [
            "rejected",
            "rejected"
          ],
          "reasonPreserved": true,
          "recovered": "recovered",
          "calls": 2
        }
      },
      {
        "name": "Rejection reason: error",
        "scenario": "promise-rejection",
        "args": [
          "error",
          2
        ],
        "expected": {
          "statuses": [
            "rejected",
            "rejected"
          ],
          "reasonPreserved": true,
          "recovered": "recovered",
          "calls": 2
        }
      },
      {
        "name": "Concurrent successful callers share execution",
        "scenario": "promise-concurrent",
        "args": [
          7,
          9
        ],
        "expected": {
          "values": [
            7,
            7
          ],
          "calls": 1
        }
      },
      {
        "name": "Rejected first call still processes latest queued call",
        "scenario": "promise-queued-rejection",
        "args": [
          "null"
        ],
        "expected": {
          "statuses": [
            "rejected",
            "fulfilled",
            "fulfilled"
          ],
          "reasonPreserved": true,
          "queued": [
            "latest",
            "latest"
          ],
          "recovered": "recover",
          "calls": 3
        }
      }
    ]
  },
  {
    "title": "The cycle that was not a cycle",
    "area": "Real repository · JSON serializer",
    "level": "06",
    "minutes": "30–45 min",
    "skill": "Graph identity & traversal state",
    "format": "commonjs",
    "brief": "A historical json-stable-stringify implementation treated a repeated object reference as a circular structure. Repair traversal bookkeeping while retaining real-cycle detection and stable key order. The source is preserved in the fast-json-stable-stringify fork history.",
    "contract": "Two properties may point to the same object without forming a cycle: both must serialize. Actual ancestor cycles must still throw by default or emit __cycle__ when cycles:true. Preserve sorting, null handling and caller data.",
    "allowedScenarios": [
      "serialize-graph"
    ],
    "caseHelp": "serialize-graph takes [kind, sharedValue, options?]. Kinds: shared-object creates {a:value,b:value}; shared-array creates [value,value]; cycle creates a self-reference (sharedValue is ignored). A recipe reports {status:\"returned\",value:...} or {status:\"threw\",errorType:...}.",
    "question": "Should the cycle detector remember every object ever visited, or only the objects on the current traversal path? What changes when traversal returns from a child?",
    "regressionExample": {
      "scenario": "serialize-graph",
      "args": [
        "shared-object",
        {
          "x": 1
        }
      ],
      "expected": {
        "status": "returned",
        "value": "{\"a\":{\"x\":1},\"b\":{\"x\":1}}"
      }
    },
    "next": null,
    "id": "stringify-shared-reference",
    "file": "index.js",
    "code": "var json = typeof JSON !== 'undefined' ? JSON : require('jsonify');\n\nmodule.exports = function (obj, opts) {\n    if (!opts) opts = {};\n    if (typeof opts === 'function') opts = { cmp: opts };\n    var space = opts.space || '';\n    if (typeof space === 'number') space = Array(space+1).join(' ');\n    var cycles = (typeof opts.cycles === 'boolean') ? opts.cycles : false;\n    var replacer = opts.replacer || function(key, value) { return value; };\n\n    var cmp = opts.cmp && (function (f) {\n        return function (node) {\n            return function (a, b) {\n                var aobj = { key: a, value: node[a] };\n                var bobj = { key: b, value: node[b] };\n                return f(aobj, bobj);\n            };\n        };\n    })(opts.cmp);\n\n    var seen = [];\n    return (function stringify (parent, key, node, level) {\n        var indent = space ? ('\\n' + new Array(level + 1).join(space)) : '';\n        var colonSeparator = space ? ': ' : ':';\n\n        if (node && node.toJSON && typeof node.toJSON === 'function') {\n            node = node.toJSON();\n        }\n\n        node = replacer.call(parent, key, node);\n\n        if (node === undefined) {\n            return;\n        }\n        if (typeof node !== 'object' || node === null) {\n            return json.stringify(node);\n        }\n        if (isArray(node)) {\n            var out = [];\n            for (var i = 0; i < node.length; i++) {\n                var item = stringify(node, i, node[i], level+1) || json.stringify(null);\n                out.push(indent + space + item);\n            }\n            return '[' + out.join(',') + indent + ']';\n        }\n        else {\n            if (seen.indexOf(node) !== -1) {\n                if (cycles) return json.stringify('__cycle__');\n                throw new TypeError('Converting circular structure to JSON');\n            }\n            else seen.push(node);\n\n            var keys = objectKeys(node).sort(cmp && cmp(node));\n            var out = [];\n            for (var i = 0; i < keys.length; i++) {\n                var key = keys[i];\n                var value = stringify(node, key, node[key], level+1);\n\n                if(!value) continue;\n\n                var keyValue = json.stringify(key)\n                    + colonSeparator\n                    + value;\n                ;\n                out.push(indent + space + keyValue);\n            }\n            return '{' + out.join(',') + indent + '}';\n        }\n    })({ '': obj }, '', obj, 0);\n};\n\nvar isArray = Array.isArray || function (x) {\n    return {}.toString.call(x) === '[object Array]';\n};\n\nvar objectKeys = Object.keys || function (obj) {\n    var has = Object.prototype.hasOwnProperty || function () { return true };\n    var keys = [];\n    for (var key in obj) {\n        if (has.call(obj, key)) keys.push(key);\n    }\n    return keys;\n};\n",
    "entry": "default",
    "provenance": {
      "schemaVersion": 1,
      "id": "stringify-shared-reference",
      "version": 1,
      "kind": "Historical public repository bug",
      "repository": "https://github.com/epoberezkin/fast-json-stable-stringify",
      "issueOrPullRequest": "https://github.com/epoberezkin/fast-json-stable-stringify/commit/c26c700f0b1d078512d2eba0eb16d6e5110a5538",
      "baselineCommit": "f70d44441a4a4161796e779952312b35ec336442",
      "fixCommit": "c26c700f0b1d078512d2eba0eb16d6e5110a5538",
      "sourcePath": "index.js",
      "testPath": "test/nested.js",
      "license": "MIT",
      "copyright": "Historical json-stable-stringify source; package metadata credits James Halliday. The pinned MIT notice has no copyright line.",
      "licensePath": "baseline/LICENSE",
      "testProvenance": "Historical json-stable-stringify commit retained in the fast-json-stable-stringify fork. Shared-reference and cycle cases adapt upstream test/nested.js; extra boundary cases are labelled. Docker uses the eight-case FixFirst Node adapter, not the original Tape suite.",
      "transformations": [
        "Historical ancestor is named json-stable-stringify, not the modern fast-json-stable-stringify implementation. Fork lineage is disclosed.",
        "Complete source preserved byte-for-byte, evaluated through CommonJS module/exports.",
        "Built-in JSON satisfies the conditional jsonify fallback, so no polyfill is needed in this runtime. require() dependencies are not available in the browser.",
        "Case recipes construct actual shared identities and cycles; JSON values alone cannot represent them.",
        "Docker adapter ports selected assertions to node:test and adds labelled controls; the original upstream test file is preserved, not executed as a full Tape suite."
      ],
      "contamination": "Public historical fix and tests. Practice only; not a hidden or contamination-free transfer assessment.",
      "runtime": {
        "image": "node@sha256:bc0a2afd3b74ce12222fc8bab99271e66257f021078f5f4a5d687a77d280c1d9",
        "tagAtVerification": "node:26.13.0-bookworm-slim",
        "platform": "linux/arm64",
        "command": [
          "node",
          "--test",
          "--test-reporter=tap",
          "replay.mjs"
        ],
        "network": "none",
        "readOnly": true,
        "user": "65534:65534",
        "memoryMB": 256,
        "cpus": 1,
        "pidsLimit": 64,
        "deadlineSeconds": 15,
        "outputLimitBytes": 131072
      },
      "replay": {
        "sourcePath": "index.js",
        "files": [
          {
            "from": "baseline/package.json",
            "to": "package.json"
          },
          {
            "from": "baseline/LICENSE",
            "to": "LICENSE"
          },
          {
            "from": "baseline/readme.markdown",
            "to": "README.md"
          },
          {
            "from": "adapter/replay.mjs",
            "to": "replay.mjs"
          },
          {
            "from": "adapter/cases.json",
            "to": "cases.json"
          },
          {
            "from": "adapter/scenarios.mjs",
            "to": "scenarios.mjs"
          }
        ],
        "command": [
          "--test",
          "--test-reporter=tap",
          "replay.mjs"
        ],
        "expectedBaselineFailures": 3,
        "suite": "Eight-case FixFirst adapter based on selected upstream assertions plus controls"
      },
      "sha256": {
        "baseline/LICENSE": "435a6722c786b0a56fbe7387028f1d9d3f3a2d0fb615bb8fee118727c3f59b7b",
        "baseline/example/key_cmp.js": "8bfb1825ceaa31e04eb55d48796bd1ebb599d61921f9ed632238482258c2ade3",
        "baseline/example/nested.js": "2407719be20d1f8e84d0eb52019a850e3e97d0bad79d1e21c215d5ba9fb8031e",
        "baseline/example/str.js": "7b78227c48a3373d053728a6fa70b5eca194e2121ade3410b44623c45ce77d89",
        "baseline/example/value_cmp.js": "a90e841d945d9d1cb9ee27705e95f242f7c7cfc05924fec35fa0bc9db4743130",
        "baseline/index.js": "0fb35a4d522c4de2c4b572ee8dfffa42911b72e3de7b3e22b43608039371ecd5",
        "baseline/package.json": "6160d8504485545986968571acefb9493c644c54950a40fd789830e3ac73a309",
        "baseline/readme.markdown": "7bf1c087ca8cc4d1266593f3730489cb2dee71c459dd3fb01d2e6fbc1052c40b",
        "baseline/test/cmp.js": "cc780fcd3353f3fe4e851f66feb7598e1de3eff2be4dc5b2dab3e97e1c141980",
        "baseline/test/nested.js": "90acc89860394b3e080c5407312d93bd267fba92f79c4ae00b696b0f949ef9a8",
        "baseline/test/replacer.js": "8bcf0499deba412096831426b52c2e0037c220f5689c8cb54b2a8c035df5ea20",
        "baseline/test/space.js": "c56c2f2536b052db9abaeca53f6d4c66244a9f694cfcb573d86c3f9701e29ed7",
        "baseline/test/str.js": "ad1d0baccaf13bdc46ae21f1e48b8a5b70cd8f5b564cf0aaaf81992bd1250592",
        "baseline/test/to-json.js": "ebfe070bd31b66bf556526c90640e1880a9cd12549946f2dc140917daa84c222",
        "reference/index.js": "1aea6310373d9fd37d67f0d63f5b33940fb872305f10e6b7a04717a02da7c792",
        "reference/test/nested.js": "bf5a60193af0a557c9e5d04f76a04ecac81b976c08a423c09575799e1ffc91a1",
        "adapter/scenarios.mjs": "a5e8b66e174487ad3f38b2d869bf5dec51b9348385f6b85af9fdabdebb5275c7",
        "adapter/cases.json": "397d0cead27a572b0e2812b683c1b9feb509168e7bf2f671f1c1f7abfc78d6aa",
        "adapter/replay.mjs": "40d72b289008fe85233a597e3a095ec5046b01782418acf945165bd52e240164"
      }
    },
    "tests": [
      {
        "name": "Plain object keys remain sorted",
        "args": [
          {
            "z": 2,
            "a": 1
          }
        ],
        "expected": "{\"a\":1,\"z\":2}"
      },
      {
        "name": "Shared child is not a cycle (upstream regression)",
        "scenario": "serialize-graph",
        "args": [
          "shared-object",
          {
            "x": 1
          }
        ],
        "expected": {
          "status": "returned",
          "value": "{\"a\":{\"x\":1},\"b\":{\"x\":1}}"
        }
      },
      {
        "name": "Shared array item is not a cycle (FixFirst boundary)",
        "scenario": "serialize-graph",
        "args": [
          "shared-array",
          {
            "x": 1
          }
        ],
        "expected": {
          "status": "returned",
          "value": "[{\"x\":1},{\"x\":1}]"
        }
      },
      {
        "name": "Cycle option must not mark shared children (FixFirst boundary)",
        "scenario": "serialize-graph",
        "args": [
          "shared-object",
          {
            "x": 1
          },
          {
            "cycles": true
          }
        ],
        "expected": {
          "status": "returned",
          "value": "{\"a\":{\"x\":1},\"b\":{\"x\":1}}"
        }
      },
      {
        "name": "A real cycle still throws",
        "scenario": "serialize-graph",
        "args": [
          "cycle",
          null
        ],
        "expected": {
          "status": "threw",
          "errorType": "TypeError"
        }
      },
      {
        "name": "An allowed cycle keeps its marker",
        "scenario": "serialize-graph",
        "args": [
          "cycle",
          null,
          {
            "cycles": true
          }
        ],
        "expected": {
          "status": "returned",
          "value": "{\"a\":1,\"self\":\"__cycle__\"}"
        }
      },
      {
        "name": "Distinct but equal objects both serialize",
        "args": [
          {
            "a": {
              "x": 1
            },
            "b": {
              "x": 1
            }
          }
        ],
        "expected": "{\"a\":{\"x\":1},\"b\":{\"x\":1}}"
      },
      {
        "name": "Null stays JSON null",
        "args": [
          null
        ],
        "expected": "null"
      }
    ]
  }
];

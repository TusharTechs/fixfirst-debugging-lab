// Full baseline module is embedded unchanged; upstream MIT notice is distributed alongside it.
export const repositoryTask = {
  "id": "url-join-fragment",
  "title": "The missing part of the URL",
  "area": "Real repository · url-join",
  "level": "04",
  "minutes": "25–40 min",
  "file": "lib/url-join.js",
  "skill": "Parsing boundaries & regression safety",
  "format": "esm-default",
  "brief": "A real url-join bug silently discarded content after an additional # in a URL fragment. Investigate the complete upstream module and repair it while preserving path and query behavior.",
  "contract": "Preserve the entire fragment after the first #, including additional #, ? and & characters. Continue to normalize paths and pre-fragment query parameters, accept either strings or an array, reject non-string segments, and leave caller inputs unchanged.",
  "code": "function normalize (strArray) {\n  const resultArray = [];\n  if (strArray.length === 0) { return ''; }\n\n  // Filter out any empty string values.\n  strArray = strArray.filter((part) => part !== '');\n\n  if (typeof strArray[0] !== 'string') {\n    throw new TypeError('Url must be a string. Received ' + strArray[0]);\n  }\n\n  // If the first part is a plain protocol, we combine it with the next part.\n  if (strArray[0].match(/^[^/:]+:\\/*$/) && strArray.length > 1) {\n    strArray[0] = strArray.shift() + strArray[0];\n  }\n\n  // If the first part is a leading slash, we combine it with the next part.\n  if (strArray[0] === '/' && strArray.length > 1) {\n    strArray[0] = strArray.shift() + strArray[0];\n  }\n\n  // There must be two or three slashes in the file protocol, two slashes in anything else.\n  if (strArray[0].match(/^file:\\/\\/\\//)) {\n    strArray[0] = strArray[0].replace(/^([^/:]+):\\/*/, '$1:///');\n  } else if (!strArray[0].match(/^\\[.*:.*\\]/)) {\n    // If the first part is not an IPv6 host, we replace the protocol.\n    strArray[0] = strArray[0].replace(/^([^/:]+):\\/*/, '$1://');\n  }\n\n  for (let i = 0; i < strArray.length; i++) {\n    let component = strArray[i];\n\n    if (typeof component !== 'string') {\n      throw new TypeError('Url must be a string. Received ' + component);\n    }\n\n    if (i > 0) {\n      // Removing the starting slashes for each component but the first.\n      component = component.replace(/^[\\/]+/, '');\n    }\n    if (i < strArray.length - 1) {\n      // Removing the ending slashes for each component but the last.\n      component = component.replace(/[\\/]+$/, '');\n    } else {\n      // For the last component we will combine multiple slashes to a single one.\n      component = component.replace(/[\\/]+$/, '/');\n    }\n\n    if (component === '') { continue; }\n\n    resultArray.push(component);\n  }\n\n  let str = '';\n\n  for (let i = 0; i < resultArray.length; i++) {\n    const part = resultArray[i];\n\n    // Do not add a slash if this is the first part.\n    if (i === 0) {\n      str += part;\n      continue;\n    }\n\n    const prevPart = resultArray[i - 1]\n\n    // Do not add a slash if the previous part ends with start of the query param or hash.\n    if (prevPart && prevPart.endsWith('?') || prevPart.endsWith('#')) {\n      str += part;\n      continue;\n    }\n\n    str += '/' + part;\n  }\n  // Each input component is now separated by a single slash except the possible first plain protocol part.\n\n  // remove trailing slash before parameters or hash\n  str = str.replace(/\\/(\\?|&|#[^!])/g, '$1');\n\n  // replace ? and & in parameters with &\n  const [beforeHash, afterHash] = str.split('#');\n  const parts = beforeHash.split(/(?:\\?|&)+/).filter(Boolean);\n  str = parts.shift() + (parts.length > 0 ? '?': '') + parts.join('&') + (afterHash && afterHash.length > 0 ? '#' + afterHash : '');\n\n  return str;\n}\n\nexport default function urlJoin(...args) {\n  const parts = Array.from(Array.isArray(args[0]) ? args[0] : args);\n  return normalize(parts);\n}\n",
  "entry": "default",
  "tests": [
    {
      "name": "Ordinary path and query",
      "args": [
        "http://www.google.com/",
        "foo/bar",
        "?test=123"
      ],
      "expected": "http://www.google.com/foo/bar?test=123"
    },
    {
      "name": "Fragment with another hash",
      "args": [
        "https://example.com",
        "docs",
        "#section#details"
      ],
      "expected": "https://example.com/docs#section#details"
    },
    {
      "name": "Array API preserves two hashes",
      "args": [
        [
          "https://example.com",
          "docs",
          "##details"
        ]
      ],
      "expected": "https://example.com/docs##details"
    },
    {
      "name": "Already assembled URL keeps its fragment",
      "args": [
        "https://example.com/docs#section#details"
      ],
      "expected": "https://example.com/docs#section#details"
    },
    {
      "name": "Query characters inside the fragment",
      "args": [
        "https://example.com",
        "?a=1",
        "?b=2",
        "#section#details?x=1&y=2"
      ],
      "expected": "https://example.com?a=1&b=2#section#details?x=1&y=2"
    },
    {
      "name": "Queries before fragment still normalize",
      "args": [
        "http://example.org/x",
        "?a=1",
        "?b=2"
      ],
      "expected": "http://example.org/x?a=1&b=2"
    },
    {
      "name": "Array input is not mutated",
      "args": [
        [
          "http:",
          "www.google.com/",
          "foo/bar",
          "?test=123"
        ]
      ],
      "expected": "http://www.google.com/foo/bar?test=123"
    },
    {
      "name": "Empty input stays empty",
      "args": [],
      "expected": ""
    },
    {
      "name": "Fragment consisting of a hash (FixFirst boundary case)",
      "args": [
        "https://example.com",
        "##"
      ],
      "expected": "https://example.com##"
    },
    {
      "name": "Invalid segment remains an error",
      "args": [
        "http://example.com",
        1
      ],
      "throws": true
    }
  ],
  "question": "Compare the fragment input with the returned value. Which step creates beforeHash and afterHash, and what happens when the delimiter occurs more than once?",
  "next": null,
  "regressionExample": {
    "args": [
      "https://example.com",
      "guide",
      "#intro#example"
    ],
    "expected": "https://example.com/guide#intro#example"
  },
  "provenance": {
    "schemaVersion": 1,
    "id": "url-join-fragment",
    "version": 1,
    "kind": "Historical public repository bug",
    "repository": "https://github.com/jfromaniello/url-join",
    "issueOrPullRequest": "https://github.com/jfromaniello/url-join/pull/133",
    "baselineCommit": "32815bf5d91a5e0add5c7c9ee3b74d2ae61885de",
    "fixCommit": "cceb648e479c25b8b16dc71aebec852d4d87f679",
    "sourcePath": "lib/url-join.js",
    "testPath": "test/tests.js",
    "license": "MIT",
    "copyright": "Copyright (c) 2015 José F. Romaniello",
    "licensePath": "baseline/LICENSE",
    "testProvenance": "Upstream test/tests.js at the fix commit, unmodified. Browser case table transcribes selected upstream assertions; one extra boundary case is authored by FixFirst.",
    "transformations": [
      "Repository snapshot includes all non-dot tracked files at baseline; CI/dotfiles are omitted and not executed.",
      "Browser editor contains the complete upstream baseline module byte-for-byte. It is evaluated as a native ES module, without source rewriting.",
      "Replay overlays the fix-commit test suite on the baseline snapshot. Reference replay additionally overlays the upstream repaired source. No dependency install or package script runs."
    ],
    "contamination": "Public historical fix and tests: suitable for practice, not a hidden or contamination-free assessment.",
    "runtime": {
      "image": "node@sha256:bc0a2afd3b74ce12222fc8bab99271e66257f021078f5f4a5d687a77d280c1d9",
      "tagAtVerification": "node:26.13.0-bookworm-slim",
      "platform": "linux/arm64",
      "command": [
        "node",
        "--test",
        "--test-reporter=tap",
        "test/tests.js"
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
    "sha256": {
      "baseline/CHANGELOG.md": "e74d82dbd8664dbc74d6dca27d3a1e8a35cd880871ca1d08f9d9e365c02212c8",
      "baseline/LICENSE": "08e017f066892c56857a93c2168b37222091ad080ca9384972fd5040daf174f4",
      "baseline/README.md": "7a81c025f1f3627a40414e88c8b6825ebf0ab7e5d98cac603b174ee8cc30c666",
      "baseline/bin/changelog.js": "1d3345b6fbfa50a82d1f35b24c11eb0206c9a4620cfeca0550cf56d1e2f5fc46",
      "baseline/lib/url-join.d.ts": "e1aac8c3da819e00be84ea1735952966d524a9f35db3725409b80831ad746a01",
      "baseline/lib/url-join.js": "f72c171afe4a1a57ac30d01b38d724201deeed2a8d4e524a2d2a94ff62fa22d7",
      "baseline/package-lock.json": "06cb80ad9ee61af0e005b42e3ff61f02516dc473968260abcc8df741e62d446a",
      "baseline/package.json": "a569bfd9cf2514ef50a366e0376171c26cacad8be7924073ecf8cf12e3598ad2",
      "baseline/test/tests.js": "72038c24806d7866e056bf732e5d366b751adc3947217cf030232d8a773a9730",
      "reference/lib/url-join.js": "053928f8d2de006c6e04e7e842822dd78f3f8ab073047e08466dc94534c91ac7",
      "reference/test/tests.js": "eb6cb7074bf2554b3d3d178d5b8c8d1182d7cd114bb3a6fad8941ae79aa466a0"
    }
  }
};

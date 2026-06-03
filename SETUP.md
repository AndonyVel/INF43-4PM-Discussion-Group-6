# How to wire up the tests

## 1. Install test dependencies

```bash
npm install --save-dev jest supertest
```

## 2. Add test scripts to package.json

```json
"scripts": {
  "start":         "node server.js",
  "dev":           "nodemon server.js",
  "test":          "jest --forceExit",
  "test:unit":     "jest tests/unit --forceExit",
  "test:int":      "jest tests/integration --forceExit",
  "test:coverage": "jest --coverage --forceExit"
}
```

## 3. Copy the test files into your repo

```
software/
├── server.js
├── package.json
└── tests/
    ├── unit/
    │   └── filters.test.js
    └── integration/
        ├── players.test.js
        └── chat.test.js
```

## 4. Run

```bash
npm test                  # all tests
npm run test:coverage     # all tests + coverage HTML report
```

Coverage report lands in `coverage/lcov-report/index.html` — open it in a browser.
Commit the `coverage/` folder as the assignment requires.

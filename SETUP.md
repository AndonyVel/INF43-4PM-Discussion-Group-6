# How to wire up the tests

## 1. Add `module.exports = app;` to server.js

At the very bottom of `server.js`, **after** the `app.listen(...)` call, add this one line:

```js
module.exports = app;
```

This lets Supertest import the Express app without starting a second server process.
The existing `app.listen()` call stays in place and works normally when you run `node server.js`.

## 2. Install test dependencies

```bash
npm install --save-dev jest supertest
```

## 3. Add test scripts to package.json

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

## 4. Copy the test files into your repo

```
your-project/
├── server.js
├── package.json
└── tests/
    ├── unit/
    │   └── filters.test.js
    └── integration/
        ├── players.test.js
        └── chat.test.js
```

## 5. Run

```bash
npm test                  # all tests
npm run test:coverage     # all tests + coverage HTML report
```

Coverage report lands in `coverage/lcov-report/index.html` — open it in a browser.
Commit the `coverage/` folder as the assignment requires.

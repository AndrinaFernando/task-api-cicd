# Verification record

This records checks actually performed by the assistant on the prepared local project. It is not evidence of a GitHub-hosted run or a completed mentor assessment.

## Passed locally

- 44 Jest/Supertest tests passed (1 suite).
- Coverage of `src/app.js`: statements 98.48%, branches 97.87%, functions 100%, lines 98.21%.
- ESLint passed.
- TypeScript checking of server and build code passed.
- Production server compilation passed.
- Compiled server started on port 3002; `/health` returned HTTP 200 and `ok`.
- Browser preview loaded. Keyboard-based task creation and deletion worked; status selection and filtering were verified. Automated pointer clicks were unreliable, so mouse-only interaction is not claimed as verified.
- A deliberate temporary change from health response `ok` to `broken` caused the expected test failure. The source was restored and the full suite passed again. This is a local failure demonstration, not yet a GitHub blocked-merge demonstration.
- Workflow, composite-action and Compose files parsed as YAML.
- package.json dependency and engine metadata match package-lock.json.
- Dependency installation audit reported zero vulnerabilities at installation time. This is not a guarantee against future advisories.

## Still needs live verification

- Docker image build, container health and non-root execution for THIS new project. The session could not access the Docker engine named pipe. Passing checks on the earlier container-lab project are not substituted here.
- GitHub repository creation/upload, hosted CI execution and GHCR publishing.
- Active protection rules on dev, staging and main.
- A failed PR that cannot merge, followed by a passing fix and branch promotion.
- Published multi-architecture image availability, pull/run proof and digest capture.
- Optional versioned release.

Follow START-HERE.md. No GitHub repository or package was created by the assistant, and no fake hosted results or screenshots are included.

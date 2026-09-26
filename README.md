# Task Desk — Task API CI/CD lab

A small task-management service built for Andrina Fernando's SIG learning journey. It demonstrates meaningful automated checks, a required CI gate, and container publishing after verification. It was prepared with AI assistance and must be reviewed and demonstrated by the student. The mentor's original CI assignment was unavailable: this is an independent implementation inspired by the supplied project descriptions, not a claim of exact assignment compliance.

## Start on Windows

Open this folder in VS Code. In its PowerShell terminal:

```powershell
npm.cmd ci
npm.cmd run check
npm.cmd start
```

Visit http://localhost:3002 and http://localhost:3002/health. Stop with Ctrl+C. Node 22.13 or later works locally; CI and Docker use Node 24. Port 3002 avoids the previous container-lab's ports.

The interface supports creating tasks, updating their status, filtering, and deleting them. The API also supports renaming. This is a learning demo: there is no authentication or database, and tasks reset when the process restarts. Do not expose it as a public production service or store sensitive data.

## What is included

- Express API and a plain HTML/CSS/JavaScript interface.
- Jest/Supertest tests of HTTP behavior, invalid input, isolation and security headers.
- ESLint, TypeScript checking of annotated JavaScript, tests with coverage, and a TypeScript compiler build of the server modules.
- Four parallel GitHub Actions CI jobs and a single stable `CI Gate` required check.
- Reusable Node setup action with npm download caching.
- A publish workflow that calls the CI workflow first for the same commit.
- Multi-architecture Docker images in GHCR; a non-root runtime and health check.
- Source-build and published-image Docker Compose configurations.
- Instructions for branch protection, a real failed-PR demonstration, and evidence collection.

## Commands

| Command | Purpose |
| --- | --- |
| `npm.cmd run lint` | Check source quality |
| `npm.cmd run typecheck` | Check annotated server/build JavaScript without emitting code |
| `npm.cmd test` | Run API tests |
| `npm.cmd run test:ci` | Run tests and enforce coverage thresholds |
| `npm.cmd run build` | Compile server source to `dist/server.js` |
| `node dist/server.js` | Run the built server; retain `public/` and production dependencies |
| `npm.cmd run check` | Run all four checks locally |

Type checking covers server and build code, not the browser script. Tests exercise the API and static asset delivery; they do not replace manual browser usability checks.

## API

| Method | Route | Behavior |
| --- | --- | --- |
| GET | `/health` | Plain text `ok` |
| GET | `/api/status` | Service identity and readiness |
| GET | `/api/tasks` | List tasks; optional `?status=todo`, `in-progress`, or `done` |
| POST | `/api/tasks` | Create with `{ "title": "Learn CI" }` |
| GET | `/api/tasks/:id` | Get one task |
| PATCH | `/api/tasks/:id` | Update title and/or status |
| DELETE | `/api/tasks/:id` | Delete; returns HTTP 204 |

Titles are trimmed and limited to 120 characters. Unknown writable fields and unsupported status values are rejected. Invalid multi-field updates never partially change a task.

## Docker locally

Keep Docker Desktop running, then:

```powershell
docker compose up -d --build
docker compose ps
docker compose logs
```

Visit http://localhost:3002. Compose binds the service to the local computer only. Wait for the health check, then capture its status. Verify the running user:

```powershell
docker compose exec task-api id
docker compose down
```

The Docker build installs locked dependencies, compiles the server, and copies only runtime dependencies, built code and static assets into the final stage.

## GitHub setup and demonstration

Follow [START-HERE.md](START-HERE.md) in order. A workflow file alone does not enable branch protection. The repository's required-check rule must be configured and tested on GitHub.

Branch flow: `feature/*` → `dev` → `staging` → `main`.

CI runs on pushes and pull requests involving `dev`, `staging`, and `main`. There are no path filters, so the required gate cannot be left pending merely because a change touched documentation.

Publishing runs on pushes to `dev` and `main`, plus `v*` tags. It invokes all four checks again for the exact source commit and publishes only if they pass. Some push events therefore show two sets of CI jobs; this is deliberate and avoids relying on an unrelated earlier successful run.

| Event | GHCR image tag |
| --- | --- |
| Push to dev | `ghcr.io/andrinafernando/task-api-cicd:dev` |
| Push to main | `ghcr.io/andrinafernando/task-api-cicd:latest` |
| Tag v1.0.0 on a commit already on main | `ghcr.io/andrinafernando/task-api-cicd:v1.0.0` |
| Every publishing run | `sha-...` and `run-RUN_ID-ATTEMPT` |

`latest` is a release-channel label, not proof of deployment. The project automatically publishes images; it does not automatically deploy to an external server. Tags can move, while a digest identifies image content.

Authentication uses GitHub's automatically provided `GITHUB_TOKEN`, with `packages: write` limited to the publishing job. No Docker Hub token or personal access token needs to be put in this repository. Untrusted pull requests run checks but do not trigger publishing. No PR comment bot is included, keeping write permissions out of the PR check workflow; results appear in GitHub Checks and the job summary.

## Run a published image

First make the GHCR package public as explained in START-HERE, or use your own authenticated registry session for a private package. Stop the source-build container to free port 3002.

```powershell
docker compose -f compose.prod.yml pull
docker compose -f compose.prod.yml up -d
docker compose -f compose.prod.yml ps
docker compose -f compose.prod.yml down
```

To test a specific run in PowerShell:

```powershell
$env:IMAGE_TAG = 'run-REPLACE_WITH_ACTUAL_ID-1'
docker compose -f compose.prod.yml pull
docker compose -f compose.prod.yml up -d
```

Replace the example tag with the actual successful publish summary. Capture the summary's digest too.

## Learning and attribution

Conceptual references: the user's supplied SIG reports and [TaskFlow](https://github.com/Sasivarnasarma/TaskFlow). This implementation uses its own Express API and interface; it does not reproduce the friend's React/FastAPI application or claim their tests as this project's results.

Official references: [Node.js with GitHub Actions](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs), [protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches), and [Docker Actions metadata](https://docs.docker.com/build/ci/github-actions/manage-tags-labels/).

Production extensions would include persistent storage, authentication, deployment controls, monitoring, and reviewed digest/SHA pinning. These are not implemented claims.

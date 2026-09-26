# Finish the project in VS Code and GitHub

## 1. Open and run the prepared files

Open this complete folder in VS Code, or copy its contents into your empty `D:\UOK\MIT\Year_02\Sem_2\SIG\task-api-cicd` folder. Include the hidden `.github` directory and all dotfiles. Do not put it inside `container-lab` and do not overwrite that completed project.

In the new project's VS Code terminal:

```powershell
npm.cmd ci
npm.cmd run check
npm.cmd start
```

Open http://localhost:3002. Add two tasks, change a status, use the filter, and delete a task. Stop the server with Ctrl+C before running Docker Compose on the same port.

## 2. Create an empty GitHub repository

At https://github.com/new, create `AndrinaFernando/task-api-cicd`. Public visibility allows branch protection on GitHub Free. Do not initialize a README, license, or gitignore there; these files are already local.

In VS Code, initialize this NEW project only:

```powershell
git init
git branch -M main
git config user.name "Andrina Fernando"
```

Set your own verified GitHub email or the exact private email shown at https://github.com/settings/emails. The existing computer configuration still contains example identity values. Replace the following placeholder before executing; do not use an invented address:

```powershell
git config user.email "REPLACE_WITH_YOUR_GITHUB_EMAIL"
git add .
git status
```

Ensure node_modules, coverage, dist, and credentials are not staged. Then:

```powershell
git commit -m "feat: add tested task API and gated delivery workflows"
git remote add origin https://github.com/AndrinaFernando/task-api-cicd.git
git push -u origin main
```

Complete GitHub browser sign-in if prompted. The first bootstrap push is before branch protection exists; all later changes should use pull requests.

## 3. Verify the first runs and create branches

Open the repository's Actions tab. Both `CI` and `Publish container` should appear. If a job fails, inspect its logs before continuing. A local pass is not proof of a successful hosted run.

After the bootstrap succeeds:

```powershell
git switch -c staging
git push -u origin staging
git switch -c dev
git push -u origin dev
```

## 4. Make CI a real merge gate

In repository Settings → Branches, create a classic branch protection rule for `dev`, then repeat for `staging` and `main` (or use active branch rulesets targeting those branches).

- Require a pull request before merging.
- Require status checks to pass before merging; select `CI Gate` from this project's completed CI run. If GitHub shows several similarly named checks, use the standalone `CI` workflow check that runs on pull requests, not a publishing-only job.
- Require branches to be up to date before merging.
- Enable the option preventing bypass of these requirements, including administrator bypass; leave bypass lists empty.
- For this solo lab, do not require another person's approval unless an actual reviewer is available.
- Keep force pushes and branch deletion disallowed.

If the check is not searchable, wait for the first CI run to complete and refresh. Confirm rules are ACTIVE, not merely in evaluation mode. Capture a screenshot. Do not claim the gate works until the next step shows a blocked merge.

## 5. Prove failure blocks a pull request

Start from dev:

```powershell
git switch dev
git pull --ff-only
git switch -c feature/prove-ci-gate
```

In `src/app.js`, temporarily change ONLY the `/health` response from `.send('ok')` to `.send('broken')`. Leave the test unchanged.

```powershell
npm.cmd test
git add src/app.js
git commit -m "test: demonstrate failing health contract"
git push -u origin feature/prove-ci-gate
```

The local test failure is intentional. On GitHub create a pull request with **base dev** and **compare feature/prove-ci-gate**. Wait for CI; Test and CI Gate must fail. Capture BOTH the failing check and the blocked merge state. Do not bypass the gate or merge the broken version.

Restore `.send('ok')` in the same file and run:

```powershell
npm.cmd run check
git add src/app.js
git commit -m "fix: restore health endpoint contract"
git push
```

After every required check turns green, capture the successful PR and merge it. Use **Create a merge commit** to retain ancestry through the branch promotion flow. If that option is missing, enable merge commits in Settings → General → Pull Requests.

## 6. Promote the checked changes

Create a PR from `dev` to `staging`. Wait for CI and merge using a merge commit. Then create a PR from `staging` to `main`, wait for CI and merge. Use a PR title such as `ci: demonstrate protected branch promotion`. This exercise intentionally restores the original behavior but retains the failure/fix history.

Publishing occurs after pushes to dev/main; inspect `Publish container` → `Publish verified image` for the exact image reference and digest. No deployment is implied by a successful push to the registry.

## 7. Verify GHCR and Docker

On your GitHub profile/repository, find the `task-api-cicd` package. For this public learning demo, open package settings and change its visibility to Public if you want anonymous pulls. Confirm the intended visibility before changing it. A public repository does not necessarily mean its first package is public.

GHCR publication uses the repository's automatic GITHUB_TOKEN. If publishing is denied, check Actions package permissions and package access; do not paste a token into source code.

Run the Docker commands from README. Record a healthy running container, the non-root `id` output, a working UI and health page, and the actual published image digest. Multi-platform publication should list linux/amd64 and linux/arm64; attestation entries may also appear.

## 8. Optional versioned release

After main is green and contains the final changes:

```powershell
git switch main
git pull --ff-only
git tag v1.0.0
git push origin v1.0.0
```

The release workflow checks the tagged code and verifies that its commit is already on main. It publishes `v1.0.0`; it does not replace latest with an older tagged release.

## 9. Honest report evidence

Include your own screenshots and links for:

1. Repository files and README.
2. Local lint, typecheck, test count/coverage, and build results.
3. Protected-branch configuration.
4. Intentionally failed PR with merge blocked.
5. Fixed PR with required checks passing.
6. Branch promotion PRs.
7. Successful GHCR publishing summary and image digest.
8. Running downloaded image, UI, health, and non-root user.

Describe the project as AI-assisted implementation that you reviewed, ran, and demonstrated. Explain the four CI checks, why the gate matters, how publishing depends on verification, and why container publishing differs from a live cloud deployment. Do not claim hosted checks or branch protection were completed until you have evidence.

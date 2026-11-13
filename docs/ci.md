# CI

GitHub Actions, built from the reusable workflows in [tibor-horvath/ci-toolkit](https://github.com/tibor-horvath/ci-toolkit) (pinned to `@v1`).

| Workflow | When | What |
| --- | --- | --- |
| `ci.yml` | push to `main`, PRs | `npm test` (`vitest --run`) and `npm run build` (includes `tsc -b`); gitleaks secret scan of the new commits; on `main`, updates the release PR (release-please); merging that PR cuts a release and deploys the tested `dist/` to Azure Static Web Apps |
| `pr-quality.yml` | PRs | Lighthouse on `dist/` (performance ≥ 0.8, accessibility ≥ 0.9, best practices ≥ 0.75) |
| `pr-title.yml` | PRs | PR title must be a Conventional Commit (`feat:`, `fix:`, …) |
| `audit.yml` | PRs touching dependencies, Mondays | `npm audit` of runtime dependencies, fails on high or critical |
| `workflow-lint.yml` | changes under `.github/` | actionlint + shellcheck |

Dependabot (`.github/dependabot.yml`) opens grouped weekly npm and Actions update PRs.

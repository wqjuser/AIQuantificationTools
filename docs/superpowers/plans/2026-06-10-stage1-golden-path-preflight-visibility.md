# Stage 1 Golden Path Preflight Visibility

**Goal:** Make Golden Path `run-pipeline` actions show the same Stage 1 research preflight blockers/review gates that the Research workspace uses, so the next action is understandable before the user clicks it.

**Scope:**
- Add visible hints only for Golden Path actions whose id is `run-pipeline`.
- Reuse the existing `ResearchPipelinePreflight` model and labels.
- Do not change backend Golden Path status, research run creation, strategy, AI, portfolio, paper, or live-trading behavior.

**Plan:**
- [x] RED: Add frontend layout coverage for a Golden Path preflight hint.
- [x] GREEN: Render compact preflight hints in the current-task action and active workspace context when `run-pipeline` needs review or is blocked.
- [x] DOCS: Update product plan with the Stage 1 action visibility improvement.
- [x] VERIFY: Run focused frontend tests, build, full tests, Docker smoke, browser smoke, commit, and proxy push.

**Verification Commands:**
```powershell
npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "golden path"
npm --prefix apps/web run build
npm test
docker compose up --build -d
npm run docker:smoke
```

**Progress:**
- 2026-06-10: Planned the Stage 1 Golden Path preflight visibility slice after aligning refresh evidence actions.
- 2026-06-10: Confirmed RED failure on missing preflight hint, then added visible run-pipeline preflight hints using the existing ResearchPipelinePreflight model.
- 2026-06-10: Verified focused Golden Path/layout tests, research pipeline model tests, production build, full repo tests, Docker rebuild/smoke, Golden Path API samples, and browser smoke on the deployed research page.

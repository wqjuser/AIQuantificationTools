# Stage 1/P0 Share Link Bundle Download Plan

## Goal

Add a downloadable Markdown archive for the existing Stage 1/P0 share link bundle so daily operators can hand off or store full workspace URLs even when clipboard access is unavailable.

## Scope

- Reuse `buildStage1P0ShareLinkBundleCopyText` as the single source of bundle content.
- Add a frontend-only `stage1-p0-share-link-bundle.md` download action beside the existing copy-link-bundle action.
- Surface success/failure status labels through the existing workspace status bar.
- Document that the link bundle can now be copied or downloaded.
- Keep P0 live trading blocked; do not add navigation side effects, audit writes, broker connections, or order paths.

## TDD Steps

1. Add source-contract coverage for the shared text builder, Blob download, filename, status labels, prop plumbing, and bilingual button labels.
2. Run the focused Stage 1/P0 daily-use test and confirm it fails before implementation.
3. Implement the shared builder callback, download callback, prop wiring, and button.
4. Update README and product plan.
5. Run focused tests, full web tests, build, and runtime smoke before committing.

---
description: Update package.json version, commit and push it, then publish a GitHub tag and release with user-reviewed release notes
agent: build
---

Create a new GitHub release for the requested tag: **$ARGUMENTS**.

Follow this workflow exactly. Treat the supplied argument as data, never as shell code. Do not interpolate the raw argument into a shell command. Validate it first, then use a quoted, validated `TAG` variable in subsequent commands. Stop on any ambiguity or failed verification; never claim success for a partial release.

## 1. Validate the requested tag and repository

- Require exactly one non-empty argument. Accept a stable or prerelease SemVer tag with or without a leading `v`, such as `1.4.0`, `v1.4.0`, or `v1.4.0-rc.1`. Do not accept spaces, extra arguments, shell syntax, or arbitrary Git ref names.
- Validate SemVer strictly (including no leading zeroes in numeric major/minor/patch components or numeric prerelease identifiers), then verify the tag is a valid Git ref with `git check-ref-format "refs/tags/$TAG"`.
- Set `PACKAGE_VERSION` to `TAG` with only a single leading `v` removed. `package.json` must contain the plain version (for example, tag `v1.4.0` means `"version": "1.4.0"`). Preserve any valid prerelease/build metadata.
- Confirm this is a Git repository, `package.json` exists and is valid JSON with a string `version`, `node`/`npm` are available, `gh auth status` succeeds, and `gh repo view` identifies the intended GitHub repository.
- Inspect `git status --short`, the current branch, its upstream, and `git remote -v`. Require a clean working tree (including no staged, unstaged, or untracked changes), a named current branch (not detached HEAD), an existing upstream, and a clear match between the branch's upstream remote and the GitHub repository returned by `gh repo view`. Do not guess a remote. Verify local HEAD is exactly synchronized with its upstream before editing; stop if the branch is ahead, behind, or diverged.
- Before changing any file, verify that this tag does not already exist locally or on the GitHub remote, and that no GitHub release already exists for it. If any exists or the check is inconclusive, stop without changing files or moving/overwriting the tag/release.

## 2. Update `package.json`

- Read and record the current `package.json` version.
- Set only its top-level `version` property to `PACKAGE_VERSION`, preferably with `npm pkg set "version=$PACKAGE_VERSION"`.
- Review `git diff -- package.json` and parse the file again as JSON. Confirm that the only semantic change is the top-level `version` property and that its value is exactly `PACKAGE_VERSION`. Do not update dependencies or unrelated fields, and do not edit `package-lock.json` or other files as part of this command.
- If the version was already exactly `PACKAGE_VERSION`, leave the file untouched and do not create an empty commit. Continue only if the clean/synchronized preflight checks above were successful.

## 3. Commit and push the version change

- If `package.json` changed, run `git diff --check`, stage **only** `package.json` with `git add -- package.json`, inspect the staged diff, and confirm it contains only the intended version change. Never use `git add -A` or `git add .`.
- Commit with message `chore(release): $TAG` (use the validated tag value). Push the resulting current branch to its verified upstream remote and branch. Never force-push, amend, reset, or rewrite history.
- Verify the push succeeded and the remote branch's SHA equals local `git rev-parse HEAD`. If commit or push fails, stop without creating a tag or release; report clearly whether the version change is only local or has been pushed. Do not discard the local commit or file changes.
- If the version was already correct and no commit was needed, verify the current HEAD is still synchronized with the upstream before proceeding.

## 4. Create and push the tag

- Create an annotated tag at the verified current HEAD: `git tag -a "$TAG" -m "Release $TAG"`.
- Push only that tag to the same verified GitHub remote using `git push "$REMOTE" "refs/tags/$TAG"`. Never force-push or move an existing tag.
- Verify the tag now exists on the remote and resolves to the intended release commit (for an annotated tag, check the peeled `refs/tags/$TAG^{}` SHA against the release commit SHA). If the tag push fails, stop before creating the GitHub release and report the partial state and safe recovery step.

## 5. Create and verify the GitHub release

- Wait for the GitHub workflow `Release` to finish by polling its current status.
- Verify the release with `gh release view "$TAG"` and capture its URL. Confirm its `tagName` is exactly `TAG` and it is not a draft. Do not claim success based only on a successful command exit if verification fails.
- If release creation fails after the tag was pushed, do not delete or move the tag and do not repeat the version commit. Report that the branch and tag were pushed but the GitHub release remains incomplete, plus the exact corrective action.

## 6. Draft and publish release notes

- Determine the previous release tag with `git describe --tags --abbrev=0 "$TAG"`. If no earlier tag exists, use all commits up to `$TAG`.
- Review the commit range (`git log <PREV_TAG>..$TAG`), including PR references, and draft concise user-facing release notes grouped by feature. Omit internal-only changes (refactors, tooling chores) unless they are user-visible.
- Present the draft to the user for manual review and wait for explicit approval or edits. Do not publish until approved; never auto-publish a draft.
- After approval, write the final notes to a temporary file and apply them with `gh release edit "$TAG" --notes-file <file>`.
- Verify the published body matches the approved notes (e.g., via `gh release view "$TAG" --json body`) and that `tagName` is still exactly `TAG` and it is not a draft. If verification fails, report the mismatch instead of claiming success.

## Final report

Report the tag, package version, commit SHA (or state that no version commit was needed), branch push result, tag push result, GitHub release URL, release notes status (published and verified, or still pending user review), and verification result. If any step fails, state precisely which steps succeeded and which remain incomplete. Never claim the release is complete unless the package version, remote branch, remote tag, and GitHub release were all verified.

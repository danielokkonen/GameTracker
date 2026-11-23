# Tasks: local-ai-insights

## 1. Spikes (before feature code)

- [x] 1.1 Packaging spike: add `node-llama-cpp`, load a tiny GGUF in main, and confirm the native binary survives electron-forge build/packaging on this platform; record whether prebuilts cover all target platforms/ABIs (fallback decision: bundled `llama-server` if not)
- [x] 1.2 Model eval spike: run candidate models (Qwen 2.5 1.5B, Llama 3.2 1B, Phi-4 Mini) against 3–5 real library payloads; pick the recommended default and lock model files + SHA-256 pins in a constants file

## 2. Model management backend

- [x] 2.1 Add catalog constants (model id, name, source repo, size, RAM requirement, sha256, recommended flag) in `src/backend/constants/`
- [x] 2.2 Implement ModelManager: download with streamed writes + HTTP Range resume into `<userData>/models/`, emitting progress events
- [x] 2.3 Implement SHA-256 verification on completion; failed check deletes file and marks model not-installed
- [x] 2.4 Implement install-state tracking (none / downloading / installed) and selection state with auto-select of recommended model on first successful download

## 3. Inference engine

- [x] 3.1 Implement InferenceEngine: load selected GGUF on demand, run prompt via async API with ~120s timeout, no auto-retry
- [x] 3.2 Implement idle unload (constant timeout) and single-model-at-a-time guarantee; selection change while loaded defers to next use

## 4. Insights service

- [x] 4.1 Add `AiInsight` one-row table via one-shot migration (bump `MIGRATION_VERSION`)
- [x] 4.2 Implement payload builder from `Game` + `GameActivity` (status counts, top-5 playtime, genre distribution, drop stats, time-to-completion aggregates, last-30-day activity)
- [x] 4.3 Implement fingerprint computation over the payload and cache read/write against `AiInsight`
- [x] 4.4 Implement generation flow: prompt assembly (system + few-shot example), engine call, output validation (game mentions vs library names), up to 2 retries, fail closed
- [x] 4.5 Register IPC handlers in `main.ts`: `ai-status`, `ai-insight-generate`, `ai-model-list`, `ai-model-download` (+ progress events), `ai-model-select`
- [x] 4.6 Make the insight cache session-scoped: `AiInsight` is wiped when the service is created (app start), so cached text expires when the app closes
- [x] 4.7 Add `ai-insight-dismiss` IPC: deletes the stored insight row so a hand-dismissed insight never reappears

## 5. Preload & renderer plumbing

- [x] 5.1 Add channel constants to `src/client/constants/channels.ts`
- [x] 5.2 Expose bridges in `preload.ts` and types in `src/types/services.d.ts`
- [x] 5.3 Wire renderer subscriptions via `useIpcRendererCallback` for status, generate result, and download progress

## 6. UI

- [x] 6.1 Settings "AI Insights" section: catalog list with sizes/RAM, recommended marker, download button + progress bar, selection control, error/re-download states
- [x] 6.2 Home insights quick actions (below Now Playing): button row ("Analyze library" / "Analyze again", spinner loading state while generating), result info Alert only on success/failure with built-in close (dismiss), skeleton placeholder in the alert while re-analyzing, no-model setup action linking to Settings, error state with retry
- [x] 6.3 Hardware feedback in Settings: detected system RAM summary, per-model "May not fit this machine" warning comparing measured usage + `AI_SYSTEM_RAM_HEADROOM_MB` against total RAM (advisory only)
- [x] 6.4 Download resilience across navigation: `ModelManager` keeps in-flight progress and `listModels` returns it, so the Settings UI restores the downloading state (progress bar, disabled download) after leaving and returning mid-download
- [x] 6.5 Model deletion: confirm dialog on installed entries, `ai-model-delete` IPC removes the GGUF + partial file, unloads the engine if loaded; deleting the active model clears the selection (no automatic fallback to another model)
- [x] 6.6 Dashboard setup action navigates to Settings with `focusAiSection` state; the AI section scrolls itself into view on mount so the user lands on it without scrolling
- [x] 6.8 Insight direction: payload gains `currentlyPlaying` (Started/Replaying) and `playNextCandidates` (Paused then Not started, capped); system prompt opens on current play and restricts play-next picks to the candidate list
- [x] 6.9 Bring-your-own GGUF: Settings "Use my own model" opens a file dialog; `ModelManager.addCustomModel` validates extension, GGUF header, and min/max size (same 2 GiB cap) and registers the file in `models/custom.json` by path (referenced in place, not copied); the added model is selected immediately; custom rows show size + estimated RAM and are removable (never deleting the user's file); the engine resolves every model through `getModelEntry` so the load-time size guard applies to custom files too
- [x] 6.10 Thinking disabled for all models: `InferenceEngine` resolves the chat wrapper explicitly with `customWrapperSettings` (`qwen.thoughts = "discourage"`, `jinjaTemplate.additionalRenderParameters.enable_thinking = false`) so hybrid-reasoning models (Qwen3) answer instead of filling `responseText` with chain-of-thought (blank alert)
- [x] 6.11 Game-mention validation removed: `findInvalidMentions` + bounded-retry loop deleted (the capitalized-run heuristic flagged ordinary prose like "Next, I" and Markdown bold, blocking small-model output); generated insights are displayed as-is
- [x] 6.12 Insight rendered clean: system prompt demands plain text (no markdown emphasis/lists); client-side `stripMarkdown`/`stripThinkTags` remove `**`/`*`/`__` emphasis and `</?think>` tokens from the alert at render time (stored text stays raw) — models (qwen2.5-1.5b, Qwen3) emit this markup despite instructions
- [x] 6.13 Custom model rows carry a green outlined "Custom" chip next to the name, styled like the "Recommended" chip
- [x] 6.14 Delete/remove confirmation dialog keeps its target model after closing (`open` flag separate from `deleteTarget`) so the name never blanks out mid-exit-animation; next open replaces the target
- [x] 6.15 Insight rendering also strips HTML tags the model emits (`<p>`, `<strong>`, `<br/>`, …) via `stripHtmlTags`, collapsing blank-line runs left behind; prompt additionally forbids HTML output; stored text still kept raw
- [x] 6.16 Structured insight output: system prompt replaced free-form "3–5 sentences of prose" with a fixed four labelled lines (`Playing now` / `Play next` / `Also try` / `Pattern`), one to two natural conversational sentences each, `Also try: None` when no second pick, to make output consistent across models; alert uses `whiteSpace: "pre-line"` so the line breaks show
- [x] 6.17 Cancel download: per-download `AbortController` in `ModelManager.download` (signal on `fetch`), `cancelDownload` aborts it, aborted path throws `DownloadCancelledError` → `ai-model-download-cancelled` event (not `-error`); `.part` kept so re-download resumes; menu "Cancel download" action + `ai-model-download-cancel` channel/bridge
- [x] 6.18 Per-model actions menu: replaced the inline delete icon-button with the shared `MenuButton` (three-dots) on each row; `MenuButton` extended (backward-compatible) with optional `disabled`, per-item `color` (e.g. red Delete), and `divider`; menu is always rendered, disabled when a row has no secondary actions
- [x] 6.19 Model details modal: menu "Model details" opens a dialog with status, type, file size, estimated/required RAM, detected system RAM, compatibility verdict, and known file path
- [x] 6.20 Show file location: `ai-model-reveal` IPC resolves the model path (`getModelFilePath`) and `shell.showItemInFolder` reveals it; offered from the menu and the details dialog for installed models; failures surface as a snackbar
- [x] 6.21 Catalog ordering in `listModels`: recommended model first, remaining models ascending by `sizeBytes` (custom entries still appended after the catalog)
- [x] 6.22 Add-custom-model feedback: success snackbar ("Model added"); `ai-model-add` handler returns silently when the file dialog is cancelled so no bogus success fires; delete/removal unified to one red "Delete" action with confirm-dialog copy clarifying a custom file is not deleted
- [x] 6.23 Migration gating split: `AiInsight` table creation stays under `MIGRATION_VERSION` (2) while the legacy start/end status backfill is gated by its own frozen `STATUS_BACKFILL_VERSION` (1), so it can never re-run over user-set statuses
- [x] 6.24 `InferenceEngine` generation lifecycle: `generating` set before the first await (two rapid requests can no longer share one sequence); idle-unload timer cleared when generation starts and re-armed in the `finally`, so a pending unload cannot dispose the sequence mid-generation
- [x] 6.25 `ai-model-download` replies (progress, success, cancelled, error) all pass through a `replyToSender` helper that checks `event.sender.isDestroyed()`, so closing the window mid-download no longer throws in main
- [x] 6.26 Auto-select narrowed to the recommended catalog entry on its first successful download when nothing is selected; any other download leaves the selection untouched (matches the spec requirement)
- [x] 6.27 Insight state fixes: `modelInstalled` derived from any installed model (a vanished custom model no longer forces the setup state) with selection tracked separately and an accurate error when nothing is active; unused `upToDate` dropped from `AiInsightState` and `getStatus`; `top5ByPlaytime` skips games with no playtime; activity rows typed as `ActivityRow` instead of cast to `DbActivity[]`

## 7. Verification

- [x] 7.1 Run `npm run lint` and `npm run tsc` clean
- [x] 7.2 Verify in running app (`npm start`): full flow — download model → "Analyze library" → first generation (progress) → instant cached reload → change a game status → reload shows cache with no inference → "Analyze again" regenerates; kill network mid-download to confirm resume

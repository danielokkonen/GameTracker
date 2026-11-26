# Design: local-ai-insights

## Context

Electron app (electron-forge, main/preload/renderer split). Main process already does outbound `fetch` (Steam, IGDB) and owns all services; renderer talks to it via kebab-case IPC channels (`send` → `-success`/`-error`, progress-style events where needed). All data needed for insights already exists: `Game` (status, playtime_minutes, genres/platforms as `;`-joined strings, franchise, start/end dates) and `GameActivity` (timestamped status transitions). No schema changes are required for the payload itself.

Constraint from the proposal: 100% local inference, very small models, minimal user friction — no sidecar programs, no API keys.

## Goals / Non-Goals

**Goals:**
- Insights quick actions on Home (below Now Playing): a button row ("Analyze library" / "Analyze again") with the insight text in an info Alert beneath; generation never runs on load.
- One-download model install flow in Settings: curated list → progress bar → ready.
- In-process inference that keeps the UI responsive and frees RAM when idle.
- Zero new concepts for the user beyond "pick a model, wait for download."

**Non-Goals:**
- GPU/CUDA acceleration (CPU-only prebuilts are acceptable at this model size).
- Streaming tokens to the renderer (one-shot request/response is sufficient).
- Managing any external process's lifecycle.
- Other AI features (recommendations, digests) — this change builds the trunk they reuse, but none of them are in scope.

## Decisions

### D1: Inference runtime — `node-llama-cpp` in the main process

Native N-API bindings to llama.cpp with per-platform prebuilt binaries; async API so the event loop stays responsive; runs GGUF models directly.

Alternatives considered:
- **Bundle `llama-server`, spawn as child process** — OpenAI-compatible endpoint and free streaming, but we'd own port allocation, lifecycle, and packaging/signing three platform binaries ourselves. Kept as fallback if D1's packaging fails (see Risks).
- **Transformers.js (WASM/ONNX)** — no native deps at all, but WASM is slower than native llama.cpp for the same GGUF, and it's less proven in a Node desktop context.

CPU-only is accepted. Measured on a 32-core desktop CPU: 1.8–5.1s per insight for all three candidates — far under the ~120s generation timeout, so the cache-first UX means users rarely wait on inference at all (older/low-core machines may be slower; the timeout stays generous).

### D2: Model catalog — three curated GGUFs, one recommended default

| Entry | Weights | Approx. RAM | Role |
|---|---|---|---|
| Qwen 2.5 1.5B Instruct | ~1.1 GB | ~0.5 GB | Middle option — fast and small |
| Llama 3.2 1B Instruct | ~0.7 GB | ~0.5 GB | Light option for low-RAM machines |
| Phi-4 Mini (3.8B) Instruct | ~2.0 GB (IQ3_M) | ~1 GB | **Recommended default** — best output quality in the eval spike |

The recommended default was decided at the end of implementation (task 1.2) from the model-eval results: all three candidates referenced only real library names, but Phi-4 Mini produced the most specific, error-free insights on every payload (Qwen duplicated a title in one top-5 list; Llama emitted a self-contradictory claim). Its ~5s generation and ~1 GB RAM are acceptable for a cache-first UX where regeneration is user-initiated.

`listModels` orders catalog rows for display: the recommended model first, then the remaining models ascending by `sizeBytes` (custom entries still append after the catalog block).

Catalog model files MUST stay under 2 GiB: Electron's allocator shim cannot satisfy model-load allocations of that size and aborts the process natively (no JS error is reachable). Phi-4 Mini therefore ships pinned to the IQ3_M quant (2.0 GB) rather than Q4_K_M (2.5 GB, crashes Electron on load); IQ3_M keeps identical KV-cache RAM and passed the full insight-generation path in Electron. `InferenceEngine` rejects oversized catalog entries with a normal generation error instead of attempting the load.

RAM figures are measured process usage with the context pinned to 4096 tokens (see D4); model weights additionally occupy reclaimable page cache.

Exact model files, source repos, and pinned SHA-256 values are locked by the model-eval spike (task group 1) before implementation; they live in a constants file (`src/backend/constants/`), not scattered through code. Weights are downloaded from Hugging Face at runtime — never bundled in the installer.

### D3: ModelManager — own download pipeline, stored under userData

A `ModelManager` (inside the new AI service) handles: catalog state, download via Node `fetch` + streamed writes with HTTP Range resume, progress events pushed to the renderer over a `-progress` IPC channel, SHA-256 verification on completion, and storage under `<userData>/models/`. Failed checksums delete the file and mark the model not-installed. An in-flight download can be cancelled: each download holds an `AbortController` whose signal is passed to `fetch`; `cancelDownload` aborts it and the catch path throws a typed `DownloadCancelledError` (surfaced to the renderer as an `ai-model-download-cancelled` event rather than an error). Cancelling keeps the `.part` file so a later download resumes. The manager also keeps the latest progress of each in-flight download, returned in `listModels` (`downloadProgress`) — the Settings UI renders downloading state purely from main-process state, so navigating away and back mid-download shows it still in flight instead of a fresh Download button. Installed models can be deleted (after a confirm dialog): the weight and any `.part` file are removed and the engine unloads the model if loaded. Deleting the currently selected model clears the selection — it does NOT auto-select another model — so no model is active until the user picks one.

Alternative considered: delegating download/caching to the inference library's built-in HF fetcher — rejected because we need resume UX, progress events, and verification semantics that we control.

### D4: InferenceEngine — load on demand, idle-unload, one at a time

The engine loads the selected model when a generation is requested (if not already loaded), runs the prompt via the async API, and unloads after an idle timeout (initial value 10 min, a constant). At most one model is ever loaded; switching selection while loaded triggers unload-then-load on next use. Generation has a generous timeout (~120s) and never auto-retries (a retry would queue behind the in-flight generation).

Context size is pinned to 4096 tokens (`createContext({ contextSize: 4096 })`). The library default `"auto"` follows each model's native window — 128k+ for Llama-3.2/Phi-4 — which balloons KV-cache RAM to 4–17 GB; 4096 comfortably covers payload (~800 tokens) + system prompt (~350) + output (<150).

Thinking is suppressed for every generation: the chat wrapper is resolved explicitly via `resolveChatWrapper(model, {customWrapperSettings: {qwen: {thoughts: "discourage"}, jinjaTemplate: {additionalRenderParameters: {enable_thinking: false}}}})`. Without it, hybrid-reasoning models (observed: Qwen3) fill the whole output budget with chain-of-thought and `responseText` comes back empty — a blank insight alert. `thoughts: "discourage"` makes the auto-resolved `QwenChatWrapper` prefill an empty `<think>\n\n</think>` block (the model's no-thinking pattern); the jinja render parameter disables thinking for models that fall through to their raw GGUF template. Both settings are inert for plain instruct models.

### D5: Fingerprint cache — single-row table + hash over compact payload

New one-row table `AiInsight` (`fingerprint TEXT`, `model TEXT`, `insight TEXT`, `created TEXT`) via the existing one-shot migration path (bump `MIGRATION_VERSION`). The row is session-scoped: `AiService` wipes the table when it is constructed, so a cached insight never survives an app restart. The fingerprint is a stable hash over the exact insight payload (status counts, top-5 playtime entries with minutes, currently-playing entries, play-next candidates, genre distribution, drop stats, time-to-completion aggregates, last-30-day activity count). Dashboard load: fingerprint matches stored row → render cached text instantly in the alert under the quick-actions row; mismatch or missing → show cache (if any) or the "Analyze library" action — inference runs only when the user activates analyze/re-analyze, never on load. "Analyze again" bypasses the fingerprint check; the dismiss action deletes the stored row (via `ai-insight-dismiss`) so the insight never reappears without a fresh generation.

### D6: Insight payload + prompt contract

Payload is compact JSON (~800–1000 tokens): status counts, total/avg playtime, top-5 games by playtime with minutes, currently-playing entries (Started/Replaying: name, minutes, genres), play-next candidates (Paused first by playtime, then Not started alphabetically, capped; name, status, minutes, genres), genre distribution, per-genre completion vs. drop counts, median time-to-completion (start→end dates), last-30-day activity summary. System prompt: strict role, then a **fixed output template of four labelled lines** — `Playing now:` / `Play next:` / `Also try:` / `Pattern:` — emitted in exact order, one to two natural sentences each, nothing before or after. An earlier free-form "3–5 sentences of flowing prose" instruction produced inconsistent shapes from model to model, so the rigid template is what makes the structure reproducible while the wording stays human; the prompt asks for a warm, knowledgeable-friend voice and bans clipped note-taking, corporate filler, and stock phrases. `Play next`/`Also try` reference only the provided games and only the candidate list (explicitly not currently-playing/completed titles); when there is no second pick `Also try` writes exactly `None`. No preamble/bullets/restating raw counts, plus **one few-shot example** of the four-line shape (small models follow examples better than rules). Temperature ~0.4. The first rule-only prompt let Qwen-1.5B recommend a game already being played; the explicit negative rule ("never recommend a currently played or completed game; the pick must appear in playNextCandidates") fixed it — candidate pool membership is not machine-validated at all (D7 removed the name-existence check). Small models keep leaking presentation markup anyway (observed: whole responses wrapped in `**`, stray `</think>` tokens), so the prompt also demands plain text and the client strips emphasis markers, think tags, and HTML at render time (`stripMarkdown`/`stripThinkTags`/`stripHtmlTags`); the stored insight stays raw and `whiteSpace: "pre-line"` preserves the four-line breaks.

### D7: No output validation (supersedes bounded-retry validation)

An earlier iteration extracted capitalized word sequences from the output, matched them against library names case-insensitively, regenerated on unknown mentions (up to 2 retries), and failed closed. It was removed by user decision: the run heuristic could not tell titles from ordinary prose ("Next, I…", Markdown bold `**`), so small models were blocked by false positives more often than the check caught real hallucinations. Generated text is now displayed as-is; keeping invented names out of the insight is the prompt's job, and the regenerate action is the user's escape hatch.

### D8: IPC surface (follows existing conventions)

- `ai-status` → `-success`: { modelInstalled, selectedModel, generating }
- `ai-insight-generate` (send; manual refresh) → `-success` / `-error`
- `ai-model-list` → `-success`: catalog with per-entry install state
- `ai-model-download` (send: modelId) → `-progress` events → `-success` / `-error` (an aborted download replies on `-cancelled` instead of `-error`)
- `ai-model-download-cancel` (send: modelId) → `-success`
- `ai-model-select` (send: modelId) → `-success`
- `ai-model-delete` (send: modelId) → `-success` / `-error`
- `ai-model-add` (send: optional filePath) → `-success` / `-error` (cancelling the file dialog returns silently — no success/error)
- `ai-model-reveal` (send: modelId) → `-success` / `-error` (resolves the model's file path and `shell.showItemInFolder`)

All channels added to `src/client/constants/channels.ts`, handlers in `main.ts`, bridges in `preload.ts` + types in `services.d.ts`.

### D9: Bring-your-own GGUF — in-place registry (`custom.json`)

The "Use my own model" button opens a native file dialog; `ModelManager.addCustomModel` then validates the file before accepting it (`.gguf` extension, GGUF magic header, at least `AI_MIN_MODEL_SIZE_BYTES`, and under the same 2 GiB `AI_MAX_MODEL_SIZE_BYTES` limit that guards catalog models). The file is **referenced in place**, not copied: a registry entry (`{id, name, filePath}` in `models/custom.json`) avoids duplicating multi-GB weights; ids are `custom-<filename-slug>-<path-hash8>`. Custom models list alongside catalog entries (size via `stat`, RAM estimated conservatively from file size rather than measured), are selected immediately on add (explicit file choice = intent to use it), are switchable, and support the same per-model actions as catalog entries (details, reveal file, delete). Deleting one (the row action is a single red "Delete", and the confirm dialog body clarifies "the file itself will not be deleted from your disk") only drops the registry entry; the user's file is never deleted. Deleting a custom entry that is the active model clears the selection rather than falling back, identical to deleting a catalog model. A file that vanishes externally renders as "File not found" and becomes invalid for selection. `InferenceEngine` resolves every model through `ModelManager.getModelEntry` (path + stat'd size for custom entries), so the load-time 2 GiB guard applies uniformly. The `ai-model-add` handler accepts an optional path argument because native dialogs cannot be driven in automated runs; the UI never passes one.

## Risks / Trade-offs

- **Native module packaging through electron-forge** (highest risk): per-platform `.node` binaries must survive forge packaging and macOS signing/notarization on win32/darwin/linux. → Spike in task group 1, before any feature code; fallback is D1-alt (bundled `llama-server` child process), which changes only the InferenceEngine internals, not specs or IPC surface.
- **Quality ceiling at 1B–1.5B**: prose can be flat and small models hallucinate names. → Few-shot prompt, compact payload, prompt rules that restrict mentions to the provided games, regenerate button as user escape hatch.
- **CPU latency**: measured 1.8–5.1s per insight on a modern desktop CPU; slower on older/low-core machines, bounded by the ~120s timeout. → Cache-first UX means waiting is rare; the button's loading state sets expectations.
- **RAM footprint (~0.4–1 GB loaded, measured)**: noticeable on 4 GB machines. → Idle unload (D4), and automatic compatibility feedback in Settings: detected total system RAM versus each model's measured usage plus a 2 GB headroom margin (`AI_SYSTEM_RAM_HEADROOM_MB`), flagged as an advisory warning — users choose knowingly, but selection is never blocked.
- **Download edge cases** (interruption, disk full, corruption): → resume + checksum + re-download affordance; all three are spec'd scenarios.
- **HF source trust**: weights come from the internet on first use. → pinned repos + SHA-256 verification before anything is considered installed.
- **Unsupported custom GGUFs**: user-supplied files may be base/completion models or lack chat templates, which only shows up at generation time. → format/size validation on add; failures surface as ordinary generation errors; the catalog stays the supported path.

## Migration Plan

Purely additive feature — no data migration beyond the new one-row `AiInsight` table (one-shot, gated by `MIGRATION_VERSION` bump). Rollback: remove the insights quick actions/Settings section; the empty table and any downloaded weights are inert. No user data is touched or exported anywhere.

## Resolved Questions

- **Final model files + SHA-256 pins** — all three candidates downloaded and pinned during the eval spike (pins live in the catalog constants, task 2.1); the recommended default is decided at the end of implementation per user direction. Does not change specs, IPC surface, or task shape.
- **Prebuilt coverage** — `node-llama-cpp@3.22.3` optionalDependencies cover linux-x64/arm64/armv7l/riscv64 (+cuda/vulkan), mac-arm64-metal, mac-x64, win-x64/arm64: every platform/arch our makers target (linux x64 .deb, win x64 NSIS, darwin arm64/x64 zip). Binaries are N-API ABI-stable (no rebuild step) and glibc-based; we ship no musl targets. The D1 `llama-server` fallback is not needed.

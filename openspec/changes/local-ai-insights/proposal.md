# local-ai-insights

## Why

The dashboard shows static counts (completion rate, total playtime) but never tells the player what their habits actually look like. We can generate short, personal insights ("you finish RPGs fast but drop strategy games") entirely on the user's machine — no cloud API, no keys, game history never leaves the device.

## What Changes

- New insights quick actions on the Home dashboard (below Now Playing): a button row whose "Analyze library" action produces a short structured analysis over the player's library (what they're playing now, a next-to-play pick plus an optional second, and an interpreted pattern — each a natural sentence, not free-form prose), rendered as an alert under the row.
- In-process local inference via llama.cpp bindings (`node-llama-cpp`); CPU-only. No external programs, no API keys.
- Curated list of small GGUF models (≈1B–4B Q4) the user can download from Settings, ordered recommended-first then smallest-to-largest, with progress, resume, cancel, and SHA-256 verification; weights stored under userData, never bundled in the installer. Each row exposes secondary actions (model details, reveal file in the OS file manager, delete/remove). Settings detects the machine's total RAM and flags models unlikely to fit (measured usage + system headroom) as advisory warnings.
- Fingerprint cache: insights are generated only when the user activates the quick action ("Analyze library", or "Analyze again" once an insight exists), and the fingerprint check skips inference when the underlying library data is unchanged; cached text renders instantly on dashboard load. The cache is session-scoped — the stored insight is wiped when the app starts, so it expires when the app closes — and can be dismissed by hand, which deletes the stored insight. Generated text is displayed as-is: a game-mention validation was tried and removed, because its capitalized-run heuristic flagged ordinary prose.
- Insights generate asynchronously and never block dashboard rendering; failure states (no model, generation error) show retry affordances with the last good insight preserved.

## Capabilities

### New Capabilities

- `ai-insights`: dashboard insight generation from local library data — payload construction, prompt contract, fingerprint caching, quick-actions UI states.
- `local-model-management`: curated small-model catalog, model download (progress/resume/checksum), storage under userData, and in-process load/unload lifecycle for inference.

### Modified Capabilities

(none — `game-statuses` behavior is unchanged; insights only read existing data)

## Impact

- **Dependencies**: add `node-llama-cpp` (native per-platform binaries).
- **Main process**: new `ai-service.ts` (+ model manager / inference engine), registered in `main.ts`; new IPC channels (kebab-case) for status, generate, model list/download with progress events.
- **Preload/renderer**: bridges + types in `services.d.ts`; new Settings "AI Insights" section; new insights quick-actions component on Home (`src/client/components/ai/`).
- **Packaging risk**: native module must survive electron-forge packaging/signing on win32/darwin/linux — spike first (see design.md).
- **No schema migration**: all insight payload data already exists in `Game` and `GameActivity`.

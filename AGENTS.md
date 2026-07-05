# GameTracker

## Commands
- `npm start` — builds all Vite configs and launches Electron (electron-forge)
- `npm run lint` — runs ESLint on `.ts,.tsx` files in `./src`

No test framework is set up. No publish/make commands are used regularly.

## Architecture
- **Main process**: `src/main.ts` — creates BrowserWindow, registers all IPC handlers, instantiates services
- **Preload**: `src/preload.ts` — exposes `electronApi`, `gameService`, `igdbService`, `settingsService` via contextBridge
- **Renderer**: `src/renderer.tsx` → `App.tsx` → MUI + react-router-dom (hash routes)

IPC uses `send`/`on` with event replies (not `invoke`). Channels are defined in `src/client/constants/channels.ts`.

## Data layer
- SQLite via `node:sqlite`, accessed through `src/backend/database/database.ts`
- DB file is `GameTracker.db` (gitignored by `*.db`) — it persists across runs and should not be deleted casually
- Three services: `game-service.ts`, `igdb-service.ts`, `settings-service.ts`
- DTOs live in `src/backend/dtos/`

## Key quirks
- Vite is wired through Electron Forge's VitePlugin (`forge.config.ts`). The three vite configs are `vite.main.config.ts`, `vite.preload.config.ts`, `vite.renderer.config.ts`. Do not run `vite build` directly.
- Main process bundles include the React plugin, even though main.ts has no JSX.
- IPC channels: `list-games`, `get-game`, `create-game`, `update-game`, `delete-game`, `dashboard-games`, `adddetails-game`, `import-games`, `igdb-get-game`, `get-settings`, `upsert-settings`. Reply events follow the pattern `<channel>-success`.
- Game import reads CSV files split by semicolons (`;`), skipping the header row.
- IGDB integration downloads cover images and stores them as base64 data URIs in SQLite.

## Conventions
- 2-space indent, CRLF line endings (see `.editorconfig`)
- `noImplicitAny: true`, but `@typescript-eslint/no-explicit-any` and `no-var-requires` are turned off
- React state lives in contexts (`GamesContext`, `SettingsContext`, `SnackbarContext`) with corresponding providers in `src/client/context/` and `src/client/components/*/`

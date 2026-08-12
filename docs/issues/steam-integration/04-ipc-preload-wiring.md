# Issue 4: IPC + Preload Wiring

## Goal

Connect the Steam service to the renderer layer via IPC channels and preload exposure, enabling the UI to trigger the Steam library fetch.

## Files to modify

### `src/client/constants/channels.ts`

- Add `import-steam` channel
- Add `import-steam-success` channel

### `src/main.ts`

- Import the new `SteamService`
- Register an `import-steam` IPC handler that:
  - Calls the Steam service to fetch the library
  - Sends the result back via `event.reply("import-steam-success", result)`

### `src/preload.ts`

- Add `importSteam()` method to the `gameService` contextBridge exposure
- Signature: `importSteam(): void` (triggers the library fetch IPC call)

## Acceptance criteria

- IPC channel `import-steam` triggers the Steam service call
- Library data is returned to the renderer via `import-steam-success`
- `gameService.importSteam()` is callable from the renderer
- No TypeScript errors in any modified file

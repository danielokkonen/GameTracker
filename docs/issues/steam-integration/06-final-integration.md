# Issue 6: Final Integration

## Goal

Tie everything together: wire the "Import from Steam" menu item in Games view to the full import flow, and ensure the complete pipeline works end-to-end.

## Files to modify

### `src/client/views/Games.tsx`

- Add "Import from Steam" menu item to the existing `MenuButton` items array (alongside "New", "Import from CSV", and "Add game details from IGDB")
- Wire the menu item click to open the `SteamImportDialog` and trigger the library fetch
- Add IPC handler for `import-steam-success` to receive the library data and pass it to the dialog
- Add IPC handler for `import-steam-success` to refresh the game list after import completes
- Show a success snackbar ("Games imported") after import completes
- Show an error snackbar if the import fails

### `src/main.ts`

- Add IPC handler for receiving selected games (array of `{ appId, name, developer, publisher, playtimeMinutes }`) from the renderer
- For each selected game, call `gameService.create()` to insert the game
- Track `{ imported: number, skipped: number }` counts (skip when `create()` throws "DUPLICATE" error)
- Send success reply `{ imported: number, skipped: number }` back to the renderer after all imports complete

## Acceptance criteria

- Clicking "Import from Steam" opens the selection dialog
- Library fetch works with valid credentials
- User can select/deselect games and click "Import Selected"
- Selected games are inserted into the database (duplicates skipped)
- Game list refreshes after import
- Success snackbar shows "X games imported, Y already exist" after import completes
- Error handling works for invalid credentials or API failures
- No regressions to existing CSV import or IGDB import functionality

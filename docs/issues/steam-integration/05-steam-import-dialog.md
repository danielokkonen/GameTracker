# Issue 5: Steam Import Dialog

## Goal

Create a new dialog component that lets the user browse their Steam library and select which games to import.

## Files to create

### `src/client/components/games/SteamImportDialog.tsx`

- MUI Dialog component with the following features:
  - **Search**: Text input that filters the game list by name
  - **Game list**: Scrollable list of games with columns for:
    - Checkbox for selection
    - Game name
    - Developer
    - Publisher
    - Playtime (formatted as hours and minutes, e.g., "12h 30m")
  - **Select all controls**: "Select All" and "Select None" buttons
  - **Action buttons**: "Import Selected" (disabled when no games selected) and "Cancel"
  - **Loading state**: Shows a spinner while the library is being fetched from the Steam API
  - **Error state**: Displays an error message if the API call fails (e.g., invalid credentials)
  - **Selection count**: Shows how many games are currently selected (e.g., "12 selected")

## Files to modify

### `src/client/views/Games.tsx`

- Import the new `SteamImportDialog` component
- Add state to control dialog visibility
- Add a handler to trigger the Steam library fetch when the dialog opens
- Add a handler to receive the library data via IPC and pass it to the dialog
- Add a handler to receive the selected game IDs from the dialog and send them back via IPC
- Render the dialog conditionally based on visibility state

## Acceptance criteria

- Dialog opens when user clicks "Import from Steam"
- Library loads and displays all games from the user's Steam account
- Search filters games by name in real time
- Checkboxes toggle individual game selection
- "Select All" selects all visible games
- "Select None" clears all selections
- "Import Selected" sends the selected game IDs back to the main process
- "Cancel" closes the dialog without importing
- Loading and error states display correctly

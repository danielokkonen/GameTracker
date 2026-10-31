# Game Details Overlay (Nested Routes)

## Overview

Replace full-page navigation to game details with an overlay rendered inside the Games view, using React Router nested routes. `Games` stays mounted while details are open/closed, so scroll position, filters, sort order, and checkbox selection are retained naturally — no restoration logic needed.

This removes the current workaround: `GameList.onRowClick` writes `sessionStorage.setItem('games.lastclicked', ...)`, and `Games.handleListGamesSuccess` reads it back inside a `setTimeout(..., 1000)` to scroll the row into view after remount. That timer is racy (it can fire on an unmounted component and throws if the game was filtered out or deleted) and exists only because navigating to `/games/:id` currently unmounts the list.

## Approach

- Nest `/games/:id` under `/games` so `Games` becomes a layout route that renders `<Outlet />`.
- `GameDetails` wraps its content in a centered MUI `Modal` dialog (an absolutely positioned `Paper`, 95vw / max 1200px, fixed height 90vh so the cover art always fits even with little text content); the modal only exists while mounted at `/games/:id`. Closing = navigate to `/games` via back button, backdrop click, or Escape.
- The table's scroll container (MUI `TableContainer`) is never unmounted, so its `scrollTop` survives.

Rejected alternatives:

- `useEffect` + guarded `scrollIntoView` in `Games` — fixes the timer race but keeps the sessionStorage hack and still loses filters/sort/selection on back navigation.
- Side-by-side master-detail layout — nicer long-term desktop UX, but requires re-laying out `GameDetails` (wide cover image, flex columns); treat as a follow-up if desired.

## Changes

### 1. `src/client/router/index.tsx`

Replace:

```tsx
<Route path="/games" element={<Games />} />,
<Route path="/games/:id" element={<GameDetails />} />,
```

with:

```tsx
<Route path="/games" element={<Games />}>
  <Route path=":id" element={<GameDetails />} />
</Route>
```

No index route needed; at bare `/games` the `<Outlet />` renders nothing.

### 2. `src/client/views/GameDetails.tsx`

- Imports: add `Modal` and `Paper` to the `@mui/material` import; change `import { useParams } from "react-router-dom"` to `import { useNavigate, useParams } from "react-router-dom"`.
- Add at top of component:

```tsx
const navigate = useNavigate();

const closeDetails = () => {
  navigate("/games");
};
```

- Wrap both returns (the `!game` spinner branch and the main JSX) in:

```tsx
<Modal open onClose={closeDetails}>
  <Paper sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "95vw", maxWidth: 1200, height: "90vh", overflowY: "auto" }}>
    ...
  </Paper>
</Modal>
```

The modal paper scrolls its own content (`overflowY: auto`); backdrop click and Escape close it (MUI modal defaults).

- In the header row, make the left `Box` a flex row (`display="flex" alignItems="center"`), and insert before the game-name `Typography`:

```tsx
<IconButton onClick={closeDetails} sx={{ mr: 1 }}>
  <ArrowBackIcon />
</IconButton>
```

(`ArrowBackIcon` is already imported.)

### 3. `src/client/views/Games.tsx`

- Import change: `import { Outlet, useLocation } from "react-router-dom";`
- Add `<Outlet />` as the last child of the root `Box` (after `<GameList …/>`).
- `handleListGamesSuccess`: delete the entire `setTimeout(...)` block — body becomes just:

```tsx
const handleListGamesSuccess = (payload: GameDto[]) => {
  setGames(payload);
  setLoading(false);
};
```

- `handleUpdateSuccess`: `Games` now stays mounted while details are open, so its update handler also fires for updates made from the details view. Gate the feedback:

```tsx
const handleUpdateSuccess = () => {
  refreshTable();
  if (location.pathname === "/games") {
    hideForm();
    snackbarDispatch({ type: "show_message", payload: "Game updated" });
  }
};
```

Silent list refresh when the update came from the details view; snackbar only for updates originating in this view.

### 4. `src/client/components/games/GameList.tsx`

In `onRowClick`, delete the line `sessionStorage.setItem('games.lastclicked', id.toString());` — keep the tag check and `navgiate(\`/games/${id}\`)`.

## Resulting behavior

- Scroll position, franchise/status filters, sort order, and checkbox selection all survive opening/closing details (the table never unmounts).
- The sessionStorage mechanism is deleted entirely.
- Deep links / refresh at `#/games/<id>` still work: `Games` fetches the list on mount and the modal renders alongside it.
- Known minor edge case: if the create/edit form was left open in the Games view before opening details, it stays open behind the modal (previously it was discarded on unmount).

## Verification

1. `npm run lint`, `npm run tsc`
2. In the running app (`npm start`):
   - Scroll the list → click a game → modal opens centered with details
   - Close via back button / browser back / Escape → list at exactly the previous position, filters/sort/selection intact
   - Change status from the details view → no snackbar, list refreshes silently behind the modal
   - Load `#/games/<id>` directly → list and modal both render

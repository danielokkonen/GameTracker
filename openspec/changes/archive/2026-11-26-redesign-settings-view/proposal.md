# Proposal: Redesign Settings view

## Why

The Settings view is a single long page built on one 266-line `SettingsForm` god-component that receives callback props for every action from the page. Adding any setting means touching the same file and threading more callbacks through `Settings.tsx`. The UX suffers from the same flatness: everything is stacked vertically with a Collapse for Debug and a scroll-into-view hack for the AI section.

## What Changes

- Settings view is reorganised into horizontal MUI Tabs: **General**, **Integrations**, **AI Features**, **Debug**.
- The single `SettingsForm` is split into per-tab panel components (`GeneralSettingsPanel`, `IntegrationsSettingsPanel`, `AiFeaturesPanel`, `DebugSettingsPanel`).
- One shared Formik instance lives in the Settings view (global save): panels are dumb binders over it, each with its own Save button; switching tabs never loses edits.
- Action callbacks (`onClearTokens`, `onDeleteAllGames`, `onOpenDatabaseFolder`) are removed from prop threading; the Debug panel owns those IPC calls and their success/error listeners.
- `AiModelManager` moves into the AI Features tab; the dashboard's "setup action" deep link switches to that tab (`/settings?tab=ai`) instead of scrolling.
- Repeated UI patterns are extracted to `components/settings/common/`: `SecretTextField` (show/hide, duplicated 2×), `EncryptionStatusText` (keychain banner, today only under IGDB, now covers all secrets), `ConfirmActionButton` (danger button + confirm dialog, duplicated 2×).
- A yup validation schema is added for settings (pairwise presence only: each credential's secret is required when its id/key is set, and vice versa). No format or length checks.
- The developer-mode debug dump prints `formik.values` only and lives inside the Debug panel.

No backend, DTO, IPC channel, or database changes.

## Capabilities

### New Capabilities

- `settings-view`: Settings page organisation into tabs, shared-form behaviour with global save, per-section contents, credential-pair validation, and developer-mode diagnostics.

### Modified Capabilities

- `ai-insights`: the dashboard setup action's "reveals the AI section directly" requirement changes from scroll-into-view to opening the Settings AI Features tab pre-selected.

## Impact

- `src/client/views/Settings.tsx` — becomes the owner of formik state, settings fetch, and active tab.
- `src/client/components/settings/` — `SettingsForm.tsx` removed; new panel components + `common/` components + validation module.
- `src/client/components/settings/AiModelManager.tsx` — scroll-into-view hack replaced by tab preselection.
- `src/client/components/dashboard/AiInsightCard.tsx` — navigates with `?tab=ai`.
- No changes to `SettingsDto`, `SettingsContext`, backend services, channels, or preload bridges.

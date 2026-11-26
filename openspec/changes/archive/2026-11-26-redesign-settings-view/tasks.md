## 1. Shared groundwork

- [x] 1.1 Create `src/client/constants/settings-tabs.ts` with the tab values and labels (`general`, `integrations`, `ai`, `debug`) plus the `?tab=` query key, and a resolver returning a valid tab for an unknown or missing query value
- [x] 1.2 Create `src/client/components/settings/settings-validation.ts` exporting the yup schema: `darkMode`/`developerMode` required booleans, and pairwise presence rules so each of `igdbClientId`/`igdbSecret` and `steamId`/`steamApiKey` is required when the other is set, with messages naming the missing field
- [x] 1.3 Create `src/client/components/settings/common/SecretTextField.tsx` — labelled text field with `type` toggling and a reveal/hide end adornment, local reveal state
- [x] 1.4 Create `src/client/components/settings/common/EncryptionStatusText.tsx` — queries `window.electronApi.encryption.isAvailable()` on mount and renders the success/warning helper text, rendering nothing until the result is known
- [x] 1.5 Create `src/client/components/settings/common/ConfirmActionButton.tsx` — outlined button with icon, confirmation dialog with configurable title, body and confirm label, and an `onConfirm` handler

## 2. Section panels

- [x] 2.1 Create `GeneralSettingsPanel.tsx` reading the shared form via `useFormikContext<SettingsDto>()`: dark mode checkbox and a save button disabled when the form is not dirty
- [x] 2.2 Create `IntegrationsSettingsPanel.tsx` with an IGDB subsection (`igdbClientId`, `igdbSecret` via `SecretTextField`, a purpose description and a credentials help link) and a Steam subsection (`steamId`, `steamApiKey` via `SecretTextField`, a purpose description and an API key help link), `EncryptionStatusText` once above the save button, per-field `error`/`helperText` from the schema, and a save button
- [x] 2.3 Create `DebugSettingsPanel.tsx`: developer mode checkbox; `ConfirmActionButton`s for Clear Tokens and Delete All Games; an Open Database Folder button; its own `window.settingsService`/`window.gameService` calls; its own `useIpcRendererCallback` subscriptions for `GAMES_DELETE_ALL_SUCCESS` and `OPEN_DATABASE_FOLDER_ERROR` reported through `SnackbarContext`; and a save button
- [x] 2.4 In `DebugSettingsPanel`, render the developer-mode diagnostics block with `JSON.stringify(values, null, 2)` only when `values.developerMode` is true
- [x] 2.5 Create `AiFeaturesPanel.tsx` hosting `AiModelManager`
- [x] 2.6 Handle renderer `target="_blank"` opens in `src/main.ts` with `webContents.setWindowOpenHandler` plus `shell.openExternal` for http(s) urls, so the credential help links open in the system browser (window-deny verified by automated run; OS-browser hand-off not observable headlessly, confirm manually in the app)

## 3. Settings view and tabs

- [x] 3.1 In `src/client/views/Settings.tsx`, keep the settings fetch and add the `Formik` wrapper (`enableReinitialize`, `validationSchema` from 1.2, `onSubmit` doing upsert + `SettingsContext` dispatch + local state update + `setSubmitting(false)`)
- [x] 3.2 Read the selected tab from `useSearchParams` with `general` as default, writing changes back with `replace: true`
- [x] 3.3 Render an MUI `Tabs`/`Tab` strip above the panel for the tab constants, and render only the selected panel inside a `TabPanel` wrapper
- [x] 3.4 Delete the now-unused `SettingsForm.tsx` and remove the moved callbacks and IPC listeners from the view

## 4. AI deep link

- [x] 4.1 Change `src/client/components/dashboard/AiInsightCard.tsx` to navigate to the settings route with the AI tab query value from the constants module
- [x] 4.2 Remove the `useLocation` effect, `focusAiSection` handling and `sectionRef` from `AiModelManager.tsx`
- [x] 4.3 In `AiModelManager`, render indeterminate progress for a model whose `installState` is `downloading` when no progress value has been received yet

## 5. Verification

- [x] 5.1 Run `npm run lint` and `npm run tsc` and fix findings
- [x] 5.2 Run `npm start` and check in the app: default tab, switching tabs with an unsaved dark mode edit preserved, save from Integrations persisting that edit, credential-pair errors blocking save with the right messages, destructive actions confirming and reporting, and the dashboard setup action landing on the AI Features tab

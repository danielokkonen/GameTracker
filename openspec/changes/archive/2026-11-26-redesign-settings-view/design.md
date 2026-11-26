## Context

`src/client/views/Settings.tsx` fetches settings and passes `onSubmit`, `onClearTokens`, `onDeleteAllGames` and `onOpenDatabaseFolder` into one `SettingsForm` (266 lines) that stacks General, IGDB, Steam and a collapsed Debug section under a single Formik instance and a single Save button. The destructive-action IPC listeners live in the view even though the buttons live deep in the form. `AiModelManager` is separate and already self-contained; the dashboard reaches it with `navigate("/settings", { state: { focusAiSection: true } })` and a `scrollIntoView` effect.

Constraints: MUI-only styling, one theme provider in `BaseLayout`, Formik + yup for forms, `useIpcRendererCallback` for renderer subscriptions, no new IPC channels or DTO fields, hash router (`createHashRouter`).

## Goals / Non-Goals

**Goals:**

- Tabs as the only navigation inside Settings; no Collapse, no scroll targeting.
- Form state that outlives tab components and a save that always covers the whole DTO.
- Panels with no action callbacks in their props; each section owns the IPC it triggers.
- Validation expressed as a yup schema per project convention.

**Non-Goals:**

- No changes to `SettingsDto`, `SettingsContext`/`SettingsProvider`, `settings-service`, `credential-service`, channels, or preload bridges.
- No new validation of credential format or length.
- No persistence of the selected tab across app restarts.
- No redesign of `AiModelManager` internals beyond removing the scroll hack.

## Decisions

**One shared form, not per-tab forms.** The Formik instance stays in the view; each panel renders its own form element and Save button bound to the same instance, so a save from any tab submits the whole DTO. Alternative — a Formik per tab with independent upserts — removes cross-tab dirty state and would let each save write only its own fields, but it splits one DTO row into partial writes and makes "changed dark mode, saved from Integrations" impossible to reason about. A single form also keeps the debug dump trivial.

**Formik provided by context, not props.** The view renders `<Formik enableReinitialize validationSchema={settingsSchema} …>` around the tab strip; panels read it with `useFormikContext<SettingsDto>()`. Alternative — passing `formik` as a prop to each panel — is explicit but reintroduces the prop threading this change exists to remove. Panels keep using each field's `name`, `value`, `onChange`, `onBlur` plus `helperText`/`error` from context.

**Tab selection lives in the URL.** `?tab=` on the settings route is the source of truth (default `general` when absent); `onChange` writes it with `replace: true` so tab clicks don't pollute history. Alternative — local `useState` seeded from router `state` — keeps the URL clean but loses reload-stability and forces a second mechanism for the dashboard deep link. `useSearchParams` works under `createHashRouter` (`#/settings?tab=ai`). Tab values are defined as a constant map (`SETTINGS_TABS`) rather than bare strings, per the no-magic-values convention.

**Panels are mounted/unmounted, not hidden.** Only the selected panel renders. All form state is in the view, so unmounting is safe for the form; `AiModelManager` re-fetches its model list on mount through the existing `useIpcRendererCallback` (subscribe + query on mount, unsubscribe on unmount), and the download itself lives in the main process, so leaving the tab mid-download does not interrupt it.

**Section-specific IPC sinks into its panel.** `DebugSettingsPanel` calls `clearTokens`, `deleteAllGames`, `openDatabaseFolder` and registers `GAMES_DELETE_ALL_SUCCESS` / `OPEN_DATABASE_FOLDER_ERROR` itself, using `SnackbarContext` directly. The view keeps only the settings fetch and the settings upsert/dispatch.

**Repeated UI extracted to `components/settings/common/`.**

- `SecretTextField` — password field with reveal toggle (duplicated for IGDB secret and Steam key; per-field reveal state becomes local to the component instead of two `useState` flags in `SettingsForm`).
- `EncryptionStatusText` — the OS-keychain notice. It describes storage of *all* secrets, so it renders once per Integrations tab instead of only under IGDB, placed next to the save button. `window.electronApi.encryption.isAvailable()` moves into this component, off the view's mount effect.
- `ConfirmActionButton` — outlined button plus its confirmation dialog, so the two danger actions share structure without duplicating dialog markup.

**Credential help links open in the system browser.** The Integrations subsections link out to the pages where the credentials are created, which need the user's normal browser session, so Electron's default of opening a new in-app window is wrong: `createWindow` installs `webContents.setWindowOpenHandler` that passes http(s) urls to `shell.openExternal` and denies the window.

**Validation module next to the panels.** `settings-validation.ts` exports a yup `object` schema; pairwise presence is enforced by one object-level `.test()` per pair that calls `this.createError({ path })` to attach the error to the empty half, with a message naming the missing field. Reciprocal `when()` on the two partner fields is deliberately avoided: yup toposorts the field dependency graph when the schema is constructed, so two fields referencing each other form a cycle that throws during module load and blanks the app. Format and length checks were deliberately excluded: existing stored values must keep saving.

**Dark mode checkbox stays in the General tab** even though the theme itself is applied by `BaseLayout` from `window.electronApi.theme.darkMode()` at startup; that flow is unchanged.

**Developer diagnostics move into the Debug tab** and print `formik.values` only — the current dump stringifies the whole Formik state (touched, errors, isSubmitting), which is noise. Trade-off: the dump is only visible while the Debug tab is open, which is what the tab is for.

## Risks / Trade-offs

- A validation error on Integrations can persist while the user works on another tab → each panel surfaces only its own field errors, and the shared form's submit re-reports them; the save button is per tab, so no cross-tab save confusion.
- Switching away from AI Features unmounts the panel and drops progress events, so the determinate progress bar can be blank or reset until the next `AI_MODEL_DOWNLOAD_PROGRESS` event → render the model's `installState === "downloading"` as indeterminate progress when no progress value has been received yet.
- Object-level `.test()` rules read both halves of a credential pair from the single shared schema → keeping one shared form and one schema is what makes this work; splitting forms later would silently drop the cross-field rules.
- `?tab=` is a new URL contract with the dashboard → define the tab values in one shared constants module so `AiInsightCard` and the view reference the same key.
- Removing `SettingsForm` in one step leaves a large diff → build the panels and `common/` components first, then delete `SettingsForm` and rewire the view in the final step, keeping `npm run tsc` green throughout.

## Purpose

Defines how the Settings screen is organised and behaves: sectioned tabs, a single shared settings form with one save action, credential validation, and developer diagnostics.

## ADDED Requirements

### Requirement: Settings are split into named tabs

The Settings screen SHALL present its sections as horizontal tabs — General, Integrations, AI Features, and Debug — with only the selected tab's contents visible. The General tab SHALL be selected by default.

#### Scenario: Default tab on open

- **WHEN** the user opens Settings without a section hint
- **THEN** the General tab is selected and only General settings are shown

#### Scenario: Switching sections

- **WHEN** the user selects the Integrations tab
- **THEN** only the credential settings are shown, and the General, AI Features and Debug contents are no longer visible

#### Scenario: Every section remains reachable

- **WHEN** the Settings screen is rendered
- **THEN** tabs exist for General, Integrations, AI Features and Debug, and selecting each renders its contents

### Requirement: Settings form state survives tab switches and saves apply to all sections

The settings form SHALL hold a single set of values for all form-backed sections. Each form-backed tab SHALL offer its own save action, and saving SHALL persist the values from every section, not only the visible one. Switching tabs SHALL NOT discard unsaved changes.

#### Scenario: Edit is preserved across tab switches

- **WHEN** the user changes a credential value, switches to another tab and back, without saving
- **THEN** the changed value is still present in the field

#### Scenario: Save from one tab persists another tab's pending change

- **WHEN** the user changes the dark mode setting on the General tab, switches to Integrations without saving, and presses save there
- **THEN** both the dark mode change and the credential values are persisted

#### Scenario: Save is unavailable with no changes

- **WHEN** no setting differs from its saved value
- **THEN** the save actions are disabled

### Requirement: Integrations tab groups all third-party credentials

The Integrations tab SHALL show the IGDB and Steam credentials together in one section, and SHALL report whether credentials are protected at rest. Each subsection SHALL state what the integration is used for and link to where its credentials are obtained.

#### Scenario: Both integrations shown together

- **WHEN** the user opens the Integrations tab
- **THEN** the IGDB client id and secret and the SteamID and API key are all shown on that tab

#### Scenario: Where credentials come from

- **WHEN** the user opens the Integrations tab
- **THEN** each subsection shows a description of what that integration is used for and a link to the page where its credentials are obtained

#### Scenario: Storage protection status reported

- **WHEN** the Integrations tab is shown and credential encryption is unavailable on the machine
- **THEN** a visible notice states that secrets will be stored in plain text

#### Scenario: Secret values are concealed by default

- **WHEN** the Integrations tab is shown with a credential secret set
- **THEN** the value is masked and can be revealed and re-hidden by the user

### Requirement: Credential pairs must be complete

When one half of a credential pair is provided, the other half SHALL be required before the settings can be saved, and the save SHALL be rejected with a message naming the missing field. The system SHALL NOT otherwise constrain the format or length of any credential value.

#### Scenario: IGDB client id without secret

- **WHEN** the user sets an IGDB client id, leaves the secret empty and presses save
- **THEN** the save is rejected and the secret field reports that a secret is required when a client id is set

#### Scenario: IGDB secret without client id

- **WHEN** the user sets an IGDB secret, leaves the client id empty and presses save
- **THEN** the save is rejected and the client id field reports that a client id is required when a secret is set

#### Scenario: Steam credentials incomplete

- **WHEN** the user provides only one of SteamID or API key and presses save
- **THEN** the save is rejected and the missing field reports that it is required

#### Scenario: Empty pair is valid

- **WHEN** the user leaves both halves of a credential pair empty and presses save
- **THEN** the settings are saved

#### Scenario: Arbitrary values are accepted

- **WHEN** the user enters credential values of any format or length and both halves of each pair are present
- **THEN** the settings are saved without a validation error

### Requirement: Settings validation errors are shown on the tab that owns the field

Validation errors SHALL be reported next to the offending field on the tab containing it, and SHALL NOT block the user from viewing or editing other tabs.

#### Scenario: Error hidden while another tab is open

- **WHEN** an invalid credential pair exists and the user views the General tab
- **THEN** the General tab renders normally without credential fields, and the Integrations tab still indicates it holds an unresolved error when selected

### Requirement: AI features tab hosts model management

The AI Features tab SHALL contain the local model management section, loading its state when the tab is shown. Model downloads SHALL continue in the background when the user leaves the tab, and the tab SHALL reflect the current state when re-entered.

#### Scenario: Model section shown on tab entry

- **WHEN** the user selects the AI Features tab
- **THEN** the installed and available models are listed with their current state

#### Scenario: Download survives leaving the tab

- **WHEN** a model download is in flight and the user switches to another tab and back
- **THEN** the model is still shown as downloading with its current progress, and no new download has started

### Requirement: Debug tab contains diagnostics and destructive actions

The Debug tab SHALL contain the developer mode toggle together with the token clearing, whole-library deletion and database folder actions, without a separate expand or collapse step. Destructive actions SHALL still require explicit confirmation, and their outcome SHALL be reported to the user.

#### Scenario: Debug contents visible without expanding

- **WHEN** the user selects the Debug tab
- **THEN** the developer mode toggle and the destructive actions are visible without further interaction

#### Scenario: Destructive action is confirmed

- **WHEN** the user activates delete all games and confirms the confirmation prompt
- **THEN** the library is deleted and the user is told the result

#### Scenario: Failure is reported

- **WHEN** an action on the Debug tab fails
- **THEN** the user is shown a message naming the failure

### Requirement: Developer mode exposes current settings values

While developer mode is enabled, the Debug tab SHALL display the current values of all settings, including unsaved changes. While developer mode is disabled, no such display SHALL be shown.

#### Scenario: Values revealed only in developer mode

- **WHEN** developer mode is enabled on the Debug tab
- **THEN** the Debug tab shows the current values of every setting

#### Scenario: Unsaved changes are reflected

- **WHEN** the user edits a setting on another tab and switches to the Debug tab without saving
- **THEN** the displayed values include the unsaved edit

#### Scenario: Diagnostics hidden when disabled

- **WHEN** developer mode is disabled
- **THEN** no settings values are displayed

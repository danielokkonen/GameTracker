## Purpose

Lets the user download, select, and manage small local AI models that power in-app inference — including their own GGUF files — with no external programs or API keys required.

## ADDED Requirements

### Requirement: Curated model catalog
The system SHALL present a curated list of small language models suitable for insight generation, each displaying its approximate download size and memory requirement. One model SHALL be marked as the recommended default. The catalog SHALL NOT require the user to know model names or configuration concepts beyond choosing an entry. Catalog entries SHALL be ordered with the recommended model first, then the remaining models sorted ascending by download size.

#### Scenario: User sees ready-to-pick options
- **WHEN** the user opens the AI section of Settings with no models downloaded
- **THEN** each catalog entry shows its name, download size, and memory requirement, with one entry marked recommended, and a single action to download it

#### Scenario: Recommended model is listed first
- **WHEN** the catalog is displayed
- **THEN** the recommended model appears at the top, followed by the other models from smallest to largest download size

### Requirement: Model download with progress and verification
The system SHALL download selected model weights from the internet into the application's local data directory, reporting progress (downloaded vs. total) while in flight. Downloads MUST be resumable after interruption. The user SHALL be able to cancel an in-flight download, which stops the transfer and keeps the already-received partial file so a later download of the same model resumes rather than restarting. Each downloaded file SHALL be verified against a published SHA-256 checksum before it is considered installed; a failed verification SHALL mark the model as not installed and offer re-download. Model weights SHALL NOT be bundled in the application installer.

#### Scenario: Successful download
- **WHEN** the user downloads a catalog model and the transfer completes with a matching checksum
- **THEN** the model appears as installed/selected-capable without further action

#### Scenario: Interrupted download resumes
- **WHEN** a download is interrupted (app closed or network loss) and the user starts downloading the same model again
- **THEN** the download continues from the already-received portion rather than restarting

#### Scenario: User cancels an in-flight download
- **WHEN** the user activates the cancel action while a model is downloading
- **THEN** the transfer stops, the model returns to its not-downloaded state with a Download action, and the partial file is kept so re-downloading resumes from where it stopped

#### Scenario: In-app navigation does not interrupt or misreport a download
- **WHEN** a model download is in flight and the user navigates to another page and back to Settings
- **THEN** the download has continued uninterrupted in the background, and the Settings entry still shows as downloading with its current progress rather than offering a fresh download

#### Scenario: Corrupted download is rejected
- **WHEN** a completed download fails checksum verification
- **THEN** the model is not usable, the failed file is discarded, and the UI offers to re-download

### Requirement: Users can add their own GGUF model
The system SHALL let the user add an already-downloaded GGUF model file from disk, referencing it in place without copying it into the application's data directory. An added file MUST pass the same maximum size limit that applies to catalog models, and MUST be validated (extension, GGUF header, plausible minimum size) before it is accepted. Added models SHALL appear in the model list with size and memory-fit information and SHALL be selectable for inference. Removing an added model SHALL only remove it from the app's list — after an explicit confirmation — and MUST NOT delete the user's file.

#### Scenario: Adding a valid local file
- **WHEN** the user picks a valid GGUF file under the size limit
- **THEN** it appears as an installed model, becomes the selected model immediately, and subsequent insight generations run from that file

#### Scenario: Oversized or invalid files are refused
- **WHEN** the user picks a file that exceeds the size limit, is too small, or lacks a GGUF header
- **THEN** the model is not added and the UI states why the file was rejected

#### Scenario: Removal keeps the user's file
- **WHEN** the user removes an added model
- **THEN** the entry disappears from the list while the underlying file remains untouched on disk, and the selection is cleared if that model was the active one (exactly as with a deleted catalog model)

### Requirement: Model selection for inference
The system SHALL allow the user to select which installed model is used for insight generation. Only downloaded models SHALL be selectable. The recommended catalog model SHALL be selected automatically upon its first successful download if no other model is currently selected.

#### Scenario: Selecting between installed models
- **WHEN** two or more models are installed and the user changes selection in Settings
- **THEN** subsequent insight generations use the newly selected model

#### Scenario: Recommended model becomes active on its first download
- **WHEN** the recommended catalog model finishes downloading and no model is currently selected
- **THEN** that model becomes the selected model without further action

#### Scenario: Other downloads never change the selection
- **WHEN** a model other than the recommended one finishes downloading, or the recommended model finishes while another model is already selected
- **THEN** the selection stays as it was and the user picks a model in Settings

### Requirement: Per-model actions menu
The system SHALL expose secondary actions for each catalog or added model through a per-row menu (a three-dots control) separate from its primary download/select action. The menu SHALL always be present on every model row, disabled when that model has no secondary action available. Available actions SHALL include: viewing the model's details, revealing the model's file in the operating system's file manager (installed models only), cancelling an in-flight download (downloading models only), and deleting or removing the model (installed or added models only), the latter separated from the informational actions by a divider.

#### Scenario: Model details
- **WHEN** the user opens a model's menu and chooses the details action
- **THEN** a dialog shows that model's status, type (recommended / catalog / custom), file size, estimated and required RAM, detected system RAM, a compatibility verdict, and the on-disk file path when one is known

#### Scenario: Reveal installed model in file manager
- **WHEN** the user chooses the reveal action for an installed model
- **THEN** the operating system's file manager opens with that model's weight file selected; if the reveal fails a message states why and the model state is otherwise unchanged

#### Scenario: Menu reflects the model's current state
- **WHEN** a model is downloading, installed, not downloaded, or an added file whose weights are missing
- **THEN** the menu offers only the actions valid for that state (for example cancel while downloading; reveal and delete only when installed; details whenever the row exists)

### Requirement: Installed models can be deleted
The system SHALL allow deleting an installed model from Settings, removing its weight file (and any partial download) from disk after an explicit confirmation. Deleting the currently selected model SHALL clear the selection rather than automatically selecting another model; no model is active until the user picks one. Deletion MUST be rejected while that model is downloading or while an insight is being generated.

#### Scenario: Deleting frees the download
- **WHEN** the user confirms deletion of an installed model
- **THEN** the weight file is removed from disk and the catalog entry offers a fresh download again

#### Scenario: Deleting the active model clears the selection
- **WHEN** the user deletes the model currently in use
- **THEN** no model becomes selected automatically, the confirmation dialog has stated that no model will be active until the user selects one, and insights cannot be generated until a model is selected

#### Scenario: Deleting the only model disables insights
- **WHEN** the user deletes the last installed model
- **THEN** no model is selected and the dashboard shows its setup state again

### Requirement: On-demand inference lifecycle
The system SHALL load a selected model into memory only when inference is needed, unload it after an idle period without generation requests, and never hold more than one model loaded at a time. The application UI MUST remain responsive while a model is loading, generating, or unloaded.

#### Scenario: Model loads for first generation
- **WHEN** insight generation is requested and no model is currently loaded
- **THEN** the model is loaded before inference runs and the UI remains interactive during load

#### Scenario: Idle unload frees memory
- **WHEN** no generation request occurs for the configured idle period after a completed generation
- **THEN** the loaded model is unloaded and its memory released

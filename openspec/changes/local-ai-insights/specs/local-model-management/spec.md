## Purpose

Lets the user download, select, and manage small local AI models that power in-app inference — including their own GGUF files — with no external programs or API keys required.

## ADDED Requirements

### Requirement: Curated model catalog
The system SHALL present a curated list of small language models suitable for insight generation, each displaying its approximate download size and memory requirement. One model SHALL be marked as the recommended default. The catalog SHALL NOT require the user to know model names or configuration concepts beyond choosing an entry.

#### Scenario: User sees ready-to-pick options
- **WHEN** the user opens the AI section of Settings with no models downloaded
- **THEN** each catalog entry shows its name, download size, and memory requirement, with one entry marked recommended, and a single action to download it

### Requirement: Model download with progress and verification
The system SHALL download selected model weights from the internet into the application's local data directory, reporting progress (downloaded vs. total) while in flight. Downloads MUST be resumable after interruption. Each downloaded file SHALL be verified against a published SHA-256 checksum before it is considered installed; a failed verification SHALL mark the model as not installed and offer re-download. Model weights SHALL NOT be bundled in the application installer.

#### Scenario: Successful download
- **WHEN** the user downloads a catalog model and the transfer completes with a matching checksum
- **THEN** the model appears as installed/selected-capable without further action

#### Scenario: Interrupted download resumes
- **WHEN** a download is interrupted (app closed or network loss) and the user starts downloading the same model again
- **THEN** the download continues from the already-received portion rather than restarting

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
- **THEN** the entry disappears from the list while the underlying file remains untouched on disk, and selection falls back as with a deleted model

### Requirement: Model selection for inference
The system SHALL allow the user to select which installed model is used for insight generation. Only downloaded models SHALL be selectable. The recommended catalog model SHALL be selected automatically upon its first successful download if no other model is currently selected.

#### Scenario: Selecting between installed models
- **WHEN** two or more models are installed and the user changes selection in Settings
- **THEN** subsequent insight generations use the newly selected model

### Requirement: Installed models can be deleted
The system SHALL allow deleting an installed model from Settings, removing its weight file (and any partial download) from disk after an explicit confirmation. Deleting the currently selected model SHALL fall back to another installed model (recommended first) or clear the selection when none remains. Deletion MUST be rejected while that model is downloading or while an insight is being generated.

#### Scenario: Deleting frees the download
- **WHEN** the user confirms deletion of an installed model
- **THEN** the weight file is removed from disk and the catalog entry offers a fresh download again

#### Scenario: Deleting the active model falls back
- **WHEN** the user deletes the model currently in use and another model is installed
- **THEN** the other model becomes the selected one, and insight generation remains available

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

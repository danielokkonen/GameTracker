## Purpose

Generates short, personal insights about the player's game library on the dashboard, computed entirely from local data with no external network calls.

## ADDED Requirements

### Requirement: Insights are generated locally from library data
The system SHALL generate an insight of 3–5 sentences analyzing the player's library using only locally stored data (status distribution, playtime per game, genres, time-to-completion, franchise groupings, recent activity). Generation MUST NOT make any external network call.

#### Scenario: Insight reflects real library patterns
- **WHEN** an insight is generated for a library with games across multiple statuses and recorded playtimes
- **THEN** the insight references specific games by their exact stored names and observations derivable from the player's own data (e.g., playtime outliers, completion vs. drop patterns)

#### Scenario: No network access required
- **WHEN** the machine has no internet connection and a model is installed
- **THEN** insights are still generated successfully

### Requirement: Insight focuses on current play and recommends what to play next
The insight SHALL be directed at the player's present state: it SHALL open on the games currently being played (Started/Replaying) and SHALL recommend what to play next, choosing only from the not-started and paused entries provided in the analysis data. Recommended titles MUST come from the player's own library data.

#### Scenario: Recommendations drawn from the backlog
- **WHEN** an insight is generated for a library that has games in progress plus not-started or paused entries
- **THEN** the insight reflects what is being played currently and names one or more next-to-play picks taken only from the not-started and paused entries

#### Scenario: Empty backlog yields no invented picks
- **WHEN** an insight is generated for a library with no not-started and no paused entries
- **THEN** the insight omits play-next recommendations rather than naming titles outside the provided data

### Requirement: Insights are cached by data fingerprint
The system SHALL compute a fingerprint over the library data used for insights and serve the cached insight without regenerating when the fingerprint is unchanged. The cached insight SHALL be valid only for the current application run: the insight store MUST be cleared when the application starts. Insight generation SHALL start only from an explicit quick-action on the dashboard — the "Analyze library" button when no insight is cached, or the "Analyze again" button (which forces regeneration regardless of the fingerprint) once an insight exists — and MUST NOT start automatically when the dashboard loads. The quick actions render as a button row below the Now Playing section, with the insight text displayed as an info Alert underneath the row.

#### Scenario: Cached insight expires when the app closes
- **WHEN** the app is closed and later reopened
- **THEN** no insight text is displayed, the quick action is the plain "Analyze library" button, and generation requires a fresh user action

#### Scenario: Unchanged library serves cache instantly
- **WHEN** the dashboard loads and the library data has not changed since the last successful generation
- **THEN** the cached insight is displayed in the alert immediately with no new inference run

#### Scenario: Changed library does not regenerate automatically
- **WHEN** the dashboard loads after a game's status, playtime, or details changed since the last generation
- **THEN** the cached insight is displayed with no new inference run, and a new insight is generated only when the user activates "Analyze again"

### Requirement: Insight generation never blocks the dashboard
The system SHALL generate insights asynchronously. Dashboard content MUST render fully whether or not an insight exists, is generating, or has failed.

#### Scenario: First-ever generation requires user action
- **WHEN** the dashboard loads with no cached insight and a model installed
- **THEN** the rest of the dashboard renders normally, the quick actions row shows the "Analyze library" button, and no inference runs until the user activates it

#### Scenario: User-triggered generation shows progress
- **WHEN** the user activates the analyze button
- **THEN** the button enters a loading state, no result alert is shown while inference runs, and the alert appears only when generation succeeds (or fails), without blocking the dashboard

#### Scenario: Re-analysis keeps the alert layout stable
- **WHEN** the user activates "Analyze again" while an insight alert is displayed
- **THEN** the alert keeps its close button and shows a skeleton placeholder in place of the previous text until the new insight replaces it, with no reflow of the alert content

#### Scenario: Model markup is hidden from the displayed insight
- **WHEN** the stored insight text contains markdown emphasis (`**bold**`, `*italic*`), HTML tags (`<p>`, `<strong>`, `<br/>`), or `</think>`-style control tokens
- **THEN** the alert renders the plain prose without those markers (tags removed, content kept, blank-line runs collapsed), while the stored text is left unchanged

### Requirement: Cached insights can be dismissed by hand
The system SHALL provide a dismiss action on the insight alert (its built-in close button) while an insight is displayed. Dismissing SHALL clear the displayed insight and delete the stored row, so the insight does not reappear on later navigation or reload until a new generation is triggered.

#### Scenario: Dismiss removes text and stored insight
- **WHEN** the user activates the dismiss action while an insight is displayed
- **THEN** the insight alert disappears, the quick action reverts to "Analyze library", and the stored insight is deleted

#### Scenario: Dismissed insight stays gone
- **WHEN** the user navigates away from and back to the dashboard after dismissing
- **THEN** no insight text is displayed and no inference runs

#### Scenario: Generation failure preserves prior insight
- **WHEN** a regeneration fails (engine error or timeout) and a previously valid insight exists
- **THEN** the previous insight remains visible with an error indicator and retry action

### Requirement: Insights require an installed model
The system SHALL NOT attempt generation when no local model is installed. The quick actions SHALL instead show a setup state directing the user to the model settings.

#### Scenario: No model installed
- **WHEN** the dashboard loads and no model has been downloaded
- **THEN** the quick actions row shows a setup action leading to the model selection in Settings, and no inference is attempted

#### Scenario: Setup action reveals the AI section directly
- **WHEN** the user activates the setup action from the dashboard
- **THEN** Settings opens already scrolled to the AI Insights section, without requiring the user to scroll

### Requirement: Model hardware compatibility is communicated
The system SHALL detect the machine's total physical RAM and, in the model settings, report it alongside a per-model fit verdict: a model whose measured RAM usage plus the system headroom margin exceeds the detected RAM SHALL be flagged with a warning that it may run slowly or fail. The verdict SHALL be advisory only — downloading and selection MUST remain possible regardless of it.

#### Scenario: Capable machine shows no warnings
- **WHEN** the model settings load on a machine whose RAM covers every catalog model plus the headroom margin
- **THEN** the detected RAM amount is displayed and no model carries a compatibility warning

#### Scenario: Low-RAM machine flags demanding models
- **WHEN** the model settings load on a machine whose RAM cannot cover a model plus the headroom margin
- **THEN** that model shows a "may not fit" warning with its required RAM versus the detected amount, and smaller models may still show no warning

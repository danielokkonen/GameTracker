## MODIFIED Requirements

### Requirement: Insights require an installed model

The system SHALL NOT attempt generation when no local model is installed. The quick actions SHALL instead show a setup state directing the user to the model settings.

#### Scenario: No model installed

- **WHEN** the dashboard loads and no model has been downloaded
- **THEN** the quick actions row shows a setup action leading to the model selection in Settings, and no inference is attempted

#### Scenario: Setup action reveals the AI section directly

- **WHEN** the user activates the setup action from the dashboard
- **THEN** Settings opens with the AI features section already selected, without requiring the user to switch sections or scroll

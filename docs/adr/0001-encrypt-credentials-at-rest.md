# ADR-0001: Encrypt IGDB Credentials with `electron.safeStorage`

## Status
Accepted

## Context
GameTracker stores IGDB API credentials (`igdbClientId`, `igdbSecret`) as plaintext in the `Settings.json` SQLite column. This exposes API keys to anyone with filesystem access. Credentials should be encrypted at rest.

## Decision
Use `electron.safeStorage` to encrypt `igdbClientId` and `igdbSecret` individually as base64-encoded strings stored in the `Settings.json` column, with a `credentialsEncrypted` INTEGER flag in the `Settings` table to track migration state.

Split the implementation into three services:

1. **`EncryptionService`** — pure encryption utility (`encryptString`, `decryptString`). No knowledge of credential keys or storage format.

2. **`CredentialService`** — generic credential accessor that takes key names as parameters:
   - `getCredentials(keys: string[], json: any, encrypted: boolean)` returns `Record<string, string>`
   - `setCredentials(keys: Record<string, string>)` returns `{ encryptedKeys, credentialsEncrypted }`

3. **`SettingsService`** — acts as the adapter, mapping between the generic credential API and IGDB-specific field names.

## Migration
Migration is silent and happens on the next form submit. No user-facing migration step:

1. User edits settings and clicks Save
2. `upsert` encrypts plaintext credentials via `CredentialService`
3. `credentialsEncrypted` column is set to `1` in SQLite
4. Next `get()` call detects `credentialsEncrypted === 1` and decrypts values

## Fallback Behavior
If `safeStorage.isEncryptionAvailable()` returns `false` (e.g., headless environment, no secret service), credentials are stored as plaintext in SQLite JSON with `credentialsEncrypted = 0`. No error dialog — graceful degradation.

## Platform Coverage

| OS | Backend |
|----|---------|
| Linux (KDE Plasma) | libsecret (KWallet via D-Bus) |
| Windows | DPAPI (Windows Credential Manager) |
| macOS | Keychain |

## UI Status Indicator

The settings form checks `safeStorage.isEncryptionAvailable()` on mount via a `is-encryption-available` IPC handler and displays a colored helper text below the `igdbSecret` input:
- Green text when encryption is available
- Red text when encryption is unavailable

## Consequences

### Positive
- API credentials are encrypted at rest using OS-native crypto
- Zero new dependencies — `electron.safeStorage` is built-in
- No asar-unpack needed — works with asar-packed builds
- Generic `CredentialService` can be reused for future API integrations without refactoring
- Silent migration — no user action required
- Graceful degradation if encryption is unavailable

### Negative
- `credentialsEncrypted` column must be added to existing databases via `ALTER TABLE` migration (handled in constructor)
- `safeStorage.isEncryptionAvailable()` must be checked lazily — calling it before `app.isReady()` always returns `false`
- Encrypted values are stored as base64 strings in SQLite JSON, not in the OS keychain directly — the keychain is the encryption key source, not the storage backend
- `CredentialService` operates on JSON blobs rather than a dedicated credential table — key names are passed as strings with no compile-time enforcement
- `isMigrated` flag was considered but dropped as unused

### Open Questions
- Should `CredentialService` eventually manage its own DB table (e.g., a `Credentials` table) instead of operating on JSON blobs?

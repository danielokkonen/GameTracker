# ADR-0001: Generic Credential Service

## Status
Accepted

## Context
`CredentialService` was introduced to encrypt IGDB API credentials using `electron.safeStorage`. It worked for the initial use case but was tightly coupled to IGDB — methods accepted and returned hardcoded `igdbClientId` and `igdbSecret` field names. This made it impossible to reuse for other API credentials (e.g., RAWG, OpenAI) without refactoring.

## Decision
Split the service into two responsibilities:

1. **`EncryptionService`** — pure encryption utility with `encryptString()` and `decryptString()`. No knowledge of credential keys or storage format.

2. **`CredentialService`** — generic credential accessor that takes key names as parameters:
   - `getCredentials(keys: string[], json: any, encrypted: boolean)` returns `Record<string, string>`
   - `setCredentials(keys: Record<string, string>)` returns `{ encryptedKeys, credentialsEncrypted }`

`SettingsService` acts as the adapter, mapping between the generic credential API and IGDB-specific field names.

## Consequences

### Positive
- New API integrations can add encrypted credentials without modifying the encryption layer
- `EncryptionService` can be tested independently of credential logic
- `CredentialService` is agnostic to the number or names of credential keys
- Clear separation: encryption (how) vs credential storage (what) vs settings mapping (which fields)

### Negative
- `SettingsService` now depends on both `CredentialService` and `EncryptionService` (one extra dependency)
- Callers must pass the correct key names to `CredentialService` — no compile-time enforcement that the keys exist in the DTO
- `isMigrated` flag was dropped from `getCredentials()` return value (it was unused)

### Open Questions
- Should `CredentialService` eventually manage its own DB table instead of operating on JSON blobs? (Currently deferred to a future ADR.)

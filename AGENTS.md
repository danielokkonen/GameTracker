# GameTracker

## Commands
- `npm start` — builds and launches (electron-forge). Builds go through forge only; never run `vite build` directly.
- `npm run lint`, `npm run tsc` — run both before considering work done. No test framework exists.
- UI or behavior changes should be verified in the running app (`npm start`) when possible.

## Architecture
Electron app: main (`src/main.ts`) registers all IPC handlers and instantiates services from `src/backend/services/`; preload (`src/preload.ts`) exposes the bridges on `window`; renderer is MUI + react-router (hash) with pages in `src/client/views/`, feature components in `src/client/components/<feature>/` (+ `common/`), state providers in `src/client/context/`.

## Data layer
SQLite via `node:sqlite` through `src/backend/database/database.ts`. Dev DB is `dev.db` (cwd); packaged apps use `GameTracker.db` under Local AppData/userData. Both gitignored — don't delete casually. Migrations are one-shot in the `Database` constructor, gated by `MIGRATION_VERSION` (bump when adding tables/columns). DTOs: `src/backend/dtos/`; row types: `src/backend/types/db.ts`. DTO fields are mirrored in the SQL statements, `toDto`/`toDbEntity`, and the Formik yup schema — update all of them together.

## Code Style
- 2-space indent, LF (`.editorconfig`)
- Group related declarations together; separate logical blocks with a single blank line
- Keep functions small and single-purpose — extract logic that branches into distinct responsibilities; a linear flow of short blocks (separated by blank lines) is fine
- Code must be self-explanatory: descriptive variable/function names, structure with obvious intent
- Avoid comments — only add one for a non-obvious workaround or complex algorithm that cannot be simplified

## Conventions
- Prefer MUI components; theme (dark/light) is set once in `BaseLayout` — don't add another ThemeProvider
- No magic values — use constants (`src/*/constants/`). Domain constants live in `src/backend/constants/`, re-exported from `src/client/constants/`
- File names: React components/hooks/views are PascalCase, backend services/constants/utils are kebab-case
- Services are default-exported classes with arrow-function methods; map between DB rows and DTOs (`toDto`/`toDbEntity`)
- Forms use Formik + yup validation schemas
- Dates stored as ISO strings; format for display via `src/client/utils/formatUtils.ts`
- IPC: request via `send`, reply on `<channel>-success` (+ `-error` where failure is expected)
- Kebab-case channels, all defined in `src/client/constants/channels.ts`
- Renderer subscribes with the `useIpcRendererCallback` hook; one-shot queries may use invoke/handle
- New IPC method = constant → handler in `main.ts` → bridge in `preload.ts` + its type in `src/types/services.d.ts` → call via the hook
- Commits follow conventional-commit style (`feat:`, `fix:`, `chore(release):`); message no longer than 50 characters

## Planning & docs
- OpenSpec (`openspec/`) is the planning workflow
- ADRs in `docs/adr/` — read 0001 before credential-encryption work, 0002 before Steam work
- Plans: `docs/plans/`, issues: `docs/issues/`

# Repository Guidelines

## Project Structure & Module Organization
PromptStrike is a browser-first app with no bundler. Main shell and page containers live in `index.html`.

- `css/`: UI styling split by responsibility (`core.css`, `layout.css`, `components.css`, `toast.css`).
- `js/core/`: app framework and shared runtime (`app.js`, `state.js`, `utils.js`, `storage.js`, `sidebar.js`, `toast.js`).
- `js/modules/`: feature modules (generation, obfuscation, payload management, attack tabs).
- `js/data/`: static domain/payload/sample datasets.
- `views/`: lazy-loaded HTML partials used by tab routing.
- `lib/`: optional local vendor files (for example `jspdf.umd.min.js`).

## Build, Test, and Development Commands
No build or install step is required.

- `open index.html` (macOS): run locally in a browser.
- `python3 -m http.server 8000`: optional local server for more consistent `fetch()` behavior with `views/`.
- `python3 -m http.server 8000 --directory .`: explicit project-root serve command.

Use DevTools Console as the primary runtime check and verify key flows: tab navigation, payload CRUD, file generation, and localStorage restore.

## Coding Style & Naming Conventions
- JavaScript is plain global-scope scripts (no `import`/`export`).
- Match existing style: compact function definitions, semicolons, single quotes, and mostly 2-space indentation.
- Prefer short, consistent identifiers already used in code (`fmt`, `dom`, `gC`) and descriptive module-level function names (`initManyShot`, `switchSubTab`).
- Keep script load compatibility in mind: dependencies must be loaded before consumers.
- For UI safety, escape user-derived content before assigning `innerHTML`.

## Testing Guidelines
There is currently no automated test framework configured. Use manual regression checks:

- Open each major section (`home`, `arsenal`, `strike`, `intel`, `ops`).
- Confirm lazy-loaded `views/*.html` pages render without console errors.
- Validate format generation paths (for example `pdf`, `docx`, `json`, `svg`).
- Verify payload changes persist and restore through localStorage.

If you add non-trivial logic, include a short reproducible test note in the PR description.

## Commit & Pull Request Guidelines
Git history is not available in this workspace snapshot, so follow a clear conventional format:

- Commit subject: `type(scope): imperative summary` (for example `feat(generate): add svg payload watermark`).
- Keep commits focused and atomic.
- PRs should include: what changed, why, manual test steps, affected files, and screenshots/GIFs for UI updates.
- Link related issues/tasks when available.

# Eisenhower Tasks — Claude Instructions

## Project

Obsidian community plugin. TypeScript + esbuild. Target: `C:\Vaults\Primary\.obsidian\plugins\eisenhower-tasks\`.

## Commands

```bash
npm install          # first time only
npm run dev          # watch mode (rebuilds main.js on save)
npm run build        # production build — runs tsc check then esbuild
npm run lint         # ESLint — must pass before any commit
```

## Local Test Workflow

After `npm run build` or after each watch rebuild:

```powershell
Copy-Item main.js, manifest.json, styles.css `
  -Destination "C:\Vaults\Primary\.obsidian\plugins\eisenhower-tasks\"
```

Then in Obsidian: Settings → Community Plugins → reload plugin list → enable *Eisenhower Tasks*, or use the *Hot Reload* community plugin.

## Hard Rules

- **Never use `innerHTML`** — all DOM creation via Obsidian `createEl()` / `createDiv()`. The community scanner enforces this.
- **Never commit `main.js`** to the repo trunk. It is a build artifact and belongs only in GitHub Releases.
- **`manifest.json` constraints** (community scanner enforced):
  - `id` must not contain "obsidian" or end with "plugin"
  - `name` must not contain "Obsidian" or end with "Plugin"
  - `description` must end with punctuation and not start with "This plugin" or contain "Obsidian"

## Release Process

1. `npm version patch` (or `minor`/`major`) — bumps version in `package.json`, runs `version-bump.mjs` which updates `manifest.json` and `versions.json`, stages both files
2. `git commit -m "chore: bump version to X.Y.Z"`
3. `git tag X.Y.Z` (no `v` prefix — must match `manifest.json` version exactly)
4. `git push && git push --tags`
5. GitHub Actions builds and attaches `main.js`, `manifest.json`, `styles.css` to the release

## Community Plugin Submission

After first release is live on GitHub:
1. Fork `obsidianmd/obsidian-releases`
2. Add to `community-plugins.json` (alphabetically by id):
   ```json
   {
     "id": "eisenhower-tasks",
     "name": "Eisenhower Tasks",
     "author": "Bugra Sitemkar",
     "description": "Organize your tasks by urgency and importance using the Eisenhower Matrix.",
     "repo": "bugrasitemkar/obsidian-eisenhower-tasks"
   }
   ```
3. Open PR titled `"Add plugin: Eisenhower Tasks"`

## Architecture Notes

- `src/types.ts` — all shared interfaces and constants; no Obsidian imports
- `src/TaskManager.ts` — pure data layer; no DOM; uses `plugin.loadData()/saveData()` and `app.vault.process()` for race-safe archive appends
- `src/EisenhowerView.ts` — all rendering; calls `this.render()` (full re-render) on any data change; no virtual DOM needed
- `src/main.ts` — plugin entry; registers view, ribbon, command
- View opens as full-width tab (`getLeaf('tab')`) so the 2×2 grid has enough horizontal space
- Section name stored on each Task (not section id) to keep archive file human-readable

## Quadrant Layout

| Key | Grid Area | Position | Label |
|-----|-----------|----------|-------|
| q1  | 1/1       | Top-Left | Urgent & Important |
| q2  | 1/2       | Top-Right | Urgent & Non-Important |
| q3  | 2/2       | Bottom-Right | Non-Urgent & Important |
| q4  | 2/1       | Bottom-Left | Non-Urgent & Non-Important |

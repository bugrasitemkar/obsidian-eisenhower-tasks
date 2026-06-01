# Eisenhower Tasks

An [Obsidian](https://obsidian.md) plugin that brings the Eisenhower Matrix to your vault — a proven prioritization framework that splits tasks into four quadrants by urgency and importance.

---

## Features

- **4-quadrant view** — full-width tab with a 2×2 grid, clearly labelled and colour-coded
- **Sections** — organize tasks inside each quadrant into named sections; add, rename, or delete at any time
- **Safe section deletion** — deleting a section migrates its tasks to *Uncategorized* automatically
- **One-click archiving** — checking a task off removes it from the view and appends it to `Eisenhower Archive.md` under the correct quadrant and section heading
- **Persistent data** — tasks and sections are saved in Obsidian's plugin data store and survive restarts
- **Theme-aware** — uses Obsidian CSS variables; works with any light or dark theme

---

## Quadrant Layout

```
┌─────────────────────────┬─────────────────────────┐
│  Q1 — Do First          │  Q2 — Delegate          │
│  Urgent & Important     │  Urgent & Non-Important  │
├─────────────────────────┼─────────────────────────┤
│  Q4 — Eliminate         │  Q3 — Schedule          │
│  Non-Urgent &           │  Non-Urgent & Important  │
│  Non-Important          │                         │
└─────────────────────────┴─────────────────────────┘
```

---

## Installation

### From the Community Plugin Browser (once published)

1. Open **Settings → Community plugins**
2. Disable safe mode if prompted
3. Click **Browse**, search for *Eisenhower Tasks*
4. Install and enable

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](../../releases/latest)
2. Create a folder `<vault>/.obsidian/plugins/eisenhower-tasks/`
3. Place the three files inside
4. Open **Settings → Community plugins**, reload the list, and enable *Eisenhower Tasks*

---

## Usage

### Opening the View

- Click the **grid icon** in the left ribbon, or
- Run the command **Open Eisenhower Tasks** from the command palette (`Ctrl/Cmd + P`)

### Adding Tasks

Type in the *Add task…* input at the bottom of any section and press **Enter** or **Add**.

### Completing Tasks

Check the checkbox next to a task. It disappears from the view and is appended to `Eisenhower Archive.md` in your vault root.

### Managing Sections

- **Add a section** — type a name in the *New section name…* field at the bottom of a quadrant and press **Enter** or **Add Section**
- **Rename a section** — click the pencil icon next to the section name, edit inline, and press **Enter**
- **Delete a section** — click the trash icon; tasks under it migrate to *Uncategorized* automatically

---

## Archive Format

Completed tasks are appended to `Eisenhower Archive.md`:

```markdown
## Q1 — Do First
### Work
- [x] Prepare the quarterly report

## Q3 — Schedule
### Uncategorized
- [x] Read that article about TypeScript
```

---

## Development

```bash
git clone https://github.com/bugrasitemkar/obsidian-eisenhower-tasks
cd obsidian-eisenhower-tasks
npm install
npm run dev       # watch mode
npm run build     # production build → main.js
npm run lint      # ESLint check
```

To test locally, copy `main.js`, `manifest.json`, and `styles.css` into `<vault>/.obsidian/plugins/eisenhower-tasks/` and reload the plugin.

---

## Contributing

Pull requests are welcome. Please run `npm run lint` before submitting.

---

## License

[MIT](LICENSE)

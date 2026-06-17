# Eisenhower Tasks

An [Obsidian](https://obsidian.md) plugin that brings the Eisenhower Matrix to your vault — a proven prioritization framework that divides tasks into four quadrants by urgency and importance.

👉 https://community.obsidian.md/plugins/eisenhower-tasks

---

## Screenshot

> _Open Eisenhower Tasks from the ribbon or command palette to see the 2×2 grid._

---

## Features

### 4-Quadrant Matrix View

A full-width tab with a colour-coded 2×2 grid, labelled by urgency and importance. Each quadrant has a distinct header colour so you can orient instantly.

```
┌─────────────────────────┬─────────────────────────┐
│  Do First               │  Delegate               │
│  Urgent & Important     │  Urgent & Non-Important  │
├─────────────────────────┼─────────────────────────┤
│  Eliminate              │  Schedule               │
│  Non-Urgent &           │  Non-Urgent & Important  │
│  Non-Important          │                         │
└─────────────────────────┴─────────────────────────┘
```

### Sections

Organise tasks inside each quadrant into named sections.

- **Add** a section via the input just below the quadrant header
- **Rename** inline — click the pencil icon, type, press Enter
- **Delete** — click the trash icon; tasks under the section migrate to _Uncategorized_ automatically

_Uncategorized_ is the built-in fallback section and cannot be renamed or deleted.

### Adding Tasks

Type in the _Add task…_ input at the bottom of each quadrant and press **Enter** or **Add Task**. New tasks land in _Uncategorized_ — drag them to the right section from there.

### Drag & Drop

Drag any task to a different section within the same quadrant, or across quadrants entirely. Drop zones highlight as you hover. Tasks carry their text and metadata with them.

With **subtasks enabled**, you can also drag a task _onto another task_ to make it a child (see [Subtasks](#subtasks) below).

### Subtasks

Enable **Subtasks** in settings to allow up to 3 levels of task hierarchy: _parent → child → grandchild_.

**Creating subtasks:**

- Drag a task **onto another task** → it becomes a child of that task (drop zone highlights with a dashed accent border)
- Drag a task **onto the section background** → moves it to that section as a top-level task (original behaviour)
- Invalid drops (would exceed max depth, or would create a cycle) show a red dashed border and are blocked

**Archive behaviour with subtasks:**
A parent task only archives when it _and all its subtasks_ are marked complete. Tasks stay visible (with a checked state) until the entire tree is done, then the whole tree archives together.

```markdown
## Q1 — Do First

### Work

- [x] Prepare the quarterly report
  - [x] Gather Q3 data
    - [x] Export from analytics
  - [x] Write executive summary
```

**Edge cases handled automatically:**

- If a parent is checked and you drag its last child away (breaking the hierarchy), the parent archives immediately
- Moving a subtask moves its entire sub-tree with it
- Deleting a parent orphans its direct children back to the section as top-level tasks; grandchildren stay attached to their parents
- Dropping a task onto its own descendant is blocked (would create a cycle)

### Completing Tasks

Check the checkbox next to a task. It is removed from the view and appended to **Eisenhower Archive.md** in your vault root under the correct quadrant and section heading.

```markdown
## Q1 — Do First

### Work

- [x] Prepare the quarterly report
```

### Fullscreen Quadrant

Click the **maximize icon** in any quadrant header to expand it to fill the full view. Click again (or the minimize icon) to return to the 2×2 layout.

### Persistent Storage

All tasks and sections are saved in Obsidian's plugin data store and survive restarts, vault reloads, and theme changes.

### Theme-Aware

Uses Obsidian CSS variables throughout — works with any light or dark community theme without any configuration.

---

## Settings

Open **Settings → Eisenhower Tasks** to configure:

| Setting                      | Description                                                                                                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auto-tag on move**         | When a task is dragged into a section, appends the section name as a tag (e.g. `#work-projects`) to the task text.                                               |
| **Personal & Work sections** | Adds "Personal" and "Work" sections to every quadrant automatically.                                                                                             |
| **Enable subtasks**          | Allows up to 3 levels of task hierarchy. Drag a task onto another task to nest it as a child. A parent only archives when it and all its subtasks are completed. |

---

## Installation

### Community Plugin Browser _(once approved)_

1. Open **Settings → Community plugins**
2. Disable Safe Mode if prompted
3. Click **Browse**, search for _Eisenhower Tasks_
4. Install and enable

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](../../releases/latest)
2. Create folder `<vault>/.obsidian/plugins/eisenhower-tasks/`
3. Place the three files inside
4. Open **Settings → Community plugins**, reload the list, and enable _Eisenhower Tasks_

---

## Usage

### Opening the View

- Click the **grid icon** in the left ribbon, or
- Run **Open Eisenhower Tasks** from the command palette (`Ctrl/Cmd + P`)

### Keyboard Shortcuts

| Action         | Shortcut                                    |
| -------------- | ------------------------------------------- |
| Add task       | Enter (while focused in the input)          |
| Add section    | Enter (while focused in section name input) |
| Confirm rename | Enter                                       |
| Cancel rename  | Escape                                      |

---

## Development

```bash
git clone https://github.com/bugrasitemkar/obsidian-eisenhower-tasks
cd obsidian-eisenhower-tasks
npm install
npm run dev       # watch mode — rebuilds main.js on save
npm run build     # production build
npm run lint      # ESLint check (must pass before commit)
```

Copy `main.js`, `manifest.json`, and `styles.css` to `<vault>/.obsidian/plugins/eisenhower-tasks/` and reload the plugin in Obsidian to test locally.

---

## Releasing

```bash
npm version patch   # or minor / major
git push && git push --tags
```

GitHub Actions builds and attaches release assets automatically on tag push.

---

## Contributing

Pull requests are welcome. Please run `npm run lint` before submitting and keep changes scoped — see [CLAUDE.md](CLAUDE.md) for architecture notes.

---

## License

[MIT](LICENSE) © Bugra Sitemkar

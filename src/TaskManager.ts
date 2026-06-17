import { TFile, Notice } from "obsidian";
import type EisenhowerTasksPlugin from "./main";
import {
  DEFAULT_DATA,
  QUADRANT_KEYS,
  QUADRANT_LABELS,
  UNCATEGORIZED,
  type PluginData,
  type QuadrantKey,
  type SectionDef,
  type Task,
} from "./types";

export class TaskManager {
  data: PluginData;
  private plugin: EisenhowerTasksPlugin;

  constructor(plugin: EisenhowerTasksPlugin) {
    this.plugin = plugin;
    this.data = structuredClone(DEFAULT_DATA);
  }

  async load(): Promise<void> {
    const saved = (await this.plugin.loadData()) as Partial<PluginData> | null;
    if (!saved) {
      this.data = structuredClone(DEFAULT_DATA);
      return;
    }
    this.data = {
      tasks: saved.tasks ?? [],
      archiveFile: saved.archiveFile ?? DEFAULT_DATA.archiveFile,
      settings: { ...DEFAULT_DATA.settings, ...(saved.settings ?? {}) },
      sections: {} as PluginData["sections"],
    };
    for (const key of QUADRANT_KEYS) {
      const savedSections = saved.sections?.[key];
      if (savedSections && savedSections.length > 0) {
        const hasUncategorized = savedSections.some(
          (s) => s.name === UNCATEGORIZED,
        );
        this.data.sections[key] = hasUncategorized
          ? savedSections
          : [{ id: `default-${key}`, name: UNCATEGORIZED }, ...savedSections];
      } else {
        this.data.sections[key] = [
          { id: `default-${key}`, name: UNCATEGORIZED },
        ];
      }
    }
  }

  async save(): Promise<void> {
    await this.plugin.saveData(this.data);
  }

  async addTask(
    quadrant: QuadrantKey,
    sectionName: string,
    text: string,
  ): Promise<Task> {
    const task: Task = {
      id: crypto.randomUUID(),
      text: text.trim(),
      quadrant,
      section: sectionName,
      completed: false,
      createdAt: Date.now(),
    };
    this.data.tasks.push(task);
    await this.save();
    return task;
  }

  extractDate(text: string): string | null {
    const match = text.match(/@(\d{4}-\d{2}-\d{2})/);
    return match ? (match[1] ?? null) : null;
  }

  async updateTaskText(taskId: string, newText: string): Promise<void> {
    const task = this.data.tasks.find((t) => t.id === taskId);
    if (!task || !newText.trim()) return;
    task.text = newText.trim();
    await this.save();
  }

  async moveTask(
    taskId: string,
    newQuadrant: QuadrantKey,
    newSection: string,
  ): Promise<void> {
    const task = this.data.tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (task.quadrant === newQuadrant && task.section === newSection) return;
    const oldSection = task.section;
    task.quadrant = newQuadrant;
    task.section = newSection;
    if (
      this.data.settings.autoTagOnMove &&
      newSection !== UNCATEGORIZED &&
      newSection !== oldSection
    ) {
      const tag = `#${newSection.toLowerCase().replace(/\s+/g, "-")}`;
      if (!task.text.includes(tag)) {
        task.text = `${task.text} ${tag}`;
      }
    }
    await this.save();
  }

  async completeTask(id: string): Promise<void> {
    const task = this.data.tasks.find((t) => t.id === id);
    if (!task) return;
    await this.archiveTask(task);
    this.data.tasks = this.data.tasks.filter((t) => t.id !== id);
    await this.save();
  }

  private async archiveTask(task: Task): Promise<void> {
    const { app } = this.plugin;
    const archivePath = this.data.archiveFile;
    const quadrantLabel = QUADRANT_LABELS[task.quadrant];
    const heading = `## ${task.quadrant.toUpperCase()} — ${quadrantLabel.title}`;
    const subheading = `### ${task.section}`;
    const block = `\n${heading}\n${subheading}\n- [x] ${task.text}\n`;
    const existing = app.vault.getAbstractFileByPath(archivePath);
    if (existing instanceof TFile) {
      await app.vault.process(existing, (content) => content + block);
    } else {
      await app.vault.create(archivePath, block.trimStart());
    }
  }

  async addSection(quadrant: QuadrantKey, name: string): Promise<SectionDef> {
    const trimmed = name.trim();
    const section: SectionDef = { id: crypto.randomUUID(), name: trimmed };
    this.data.sections[quadrant].push(section);
    await this.save();
    return section;
  }

  async renameSection(
    quadrant: QuadrantKey,
    sectionId: string,
    newName: string,
  ): Promise<void> {
    const trimmed = newName.trim();
    const section = this.data.sections[quadrant].find(
      (s) => s.id === sectionId,
    );
    if (!section) return;
    const oldName = section.name;
    section.name = trimmed;
    for (const task of this.data.tasks) {
      if (task.quadrant === quadrant && task.section === oldName) {
        task.section = trimmed;
      }
    }
    await this.save();
  }

  async deleteSection(quadrant: QuadrantKey, sectionId: string): Promise<void> {
    const section = this.data.sections[quadrant].find(
      (s) => s.id === sectionId,
    );
    if (!section || section.name === UNCATEGORIZED) return;

    const migratedCount = this.data.tasks.filter(
      (t) => t.quadrant === quadrant && t.section === section.name,
    ).length;

    for (const task of this.data.tasks) {
      if (task.quadrant === quadrant && task.section === section.name) {
        task.section = UNCATEGORIZED;
      }
    }
    this.data.sections[quadrant] = this.data.sections[quadrant].filter(
      (s) => s.id !== sectionId,
    );
    await this.save();

    if (migratedCount > 0) {
      new Notice(
        `${migratedCount} task${migratedCount > 1 ? "s" : ""} migrated to Uncategorized.`,
      );
    }
  }

  getTasksBySection(quadrant: QuadrantKey): Map<string, Task[]> {
    const map = new Map<string, Task[]>();
    for (const section of this.data.sections[quadrant]) {
      map.set(section.name, []);
    }
    for (const task of this.data.tasks) {
      if (task.quadrant !== quadrant) continue;
      const bucket = map.get(task.section);
      if (bucket) {
        bucket.push(task);
      } else {
        const fallback = map.get(UNCATEGORIZED);
        if (fallback) fallback.push(task);
      }
    }
    return map;
  }

  async enableDefaultSections(): Promise<void> {
    const defaultNames = ["Personal", "Work"];
    let changed = false;
    for (const key of QUADRANT_KEYS) {
      for (const name of defaultNames) {
        const exists = this.data.sections[key].some((s) => s.name === name);
        if (!exists) {
          this.data.sections[key].push({ id: crypto.randomUUID(), name });
          changed = true;
        }
      }
    }
    if (changed) await this.save();
  }
}

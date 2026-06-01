import { TFile, Notice } from 'obsidian';
import type EisenhowerTasksPlugin from './main';
import {
	DEFAULT_DATA,
	QUADRANT_KEYS,
	QUADRANT_LABELS,
	UNCATEGORIZED,
	type PluginData,
	type QuadrantKey,
	type SectionDef,
	type Task,
} from './types';

export class TaskManager {
	data: PluginData;
	private plugin: EisenhowerTasksPlugin;

	constructor(plugin: EisenhowerTasksPlugin) {
		this.plugin = plugin;
		this.data = structuredClone(DEFAULT_DATA);
	}

	async load(): Promise<void> {
		const saved = await this.plugin.loadData() as Partial<PluginData> | null;
		if (!saved) {
			this.data = structuredClone(DEFAULT_DATA);
			return;
		}
		this.data = {
			tasks: saved.tasks ?? [],
			archiveFile: saved.archiveFile ?? DEFAULT_DATA.archiveFile,
			sections: {} as PluginData['sections'],
		};
		for (const key of QUADRANT_KEYS) {
			const saved_sections = saved.sections?.[key];
			if (saved_sections && saved_sections.length > 0) {
				// Ensure Uncategorized always exists as first entry
				const hasUncategorized = saved_sections.some(s => s.name === UNCATEGORIZED);
				this.data.sections[key] = hasUncategorized
					? saved_sections
					: [{ id: `default-${key}`, name: UNCATEGORIZED }, ...saved_sections];
			} else {
				this.data.sections[key] = [{ id: `default-${key}`, name: UNCATEGORIZED }];
			}
		}
	}

	async save(): Promise<void> {
		await this.plugin.saveData(this.data);
	}

	async addTask(quadrant: QuadrantKey, sectionName: string, text: string): Promise<Task> {
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

	async completeTask(id: string): Promise<void> {
		const task = this.data.tasks.find(t => t.id === id);
		if (!task) return;
		task.completed = true;
		await this.archiveTask(task);
		this.data.tasks = this.data.tasks.filter(t => t.id !== id);
		await this.save();
	}

	private async archiveTask(task: Task): Promise<void> {
		const { app } = this.plugin;
		const archivePath = this.data.archiveFile;
		const quadrantLabel = QUADRANT_LABELS[task.quadrant];
		const heading = `## ${task.quadrant.toUpperCase()} — ${quadrantLabel.title}`;
		const subheading = `### ${task.section}`;
		const line = `- [x] ${task.text}`;
		const block = `\n${heading}\n${subheading}\n${line}\n`;

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

	async renameSection(quadrant: QuadrantKey, sectionId: string, newName: string): Promise<void> {
		const trimmed = newName.trim();
		const section = this.data.sections[quadrant].find(s => s.id === sectionId);
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
		const section = this.data.sections[quadrant].find(s => s.id === sectionId);
		if (!section || section.name === UNCATEGORIZED) return;

		const migratedCount = this.data.tasks.filter(
			t => t.quadrant === quadrant && t.section === section.name
		).length;

		for (const task of this.data.tasks) {
			if (task.quadrant === quadrant && task.section === section.name) {
				task.section = UNCATEGORIZED;
			}
		}
		this.data.sections[quadrant] = this.data.sections[quadrant].filter(s => s.id !== sectionId);
		await this.save();

		if (migratedCount > 0) {
			new Notice(`${migratedCount} task${migratedCount > 1 ? 's' : ''} migrated to Uncategorized.`);
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
				// Section was deleted but task wasn't migrated — fallback
				const fallback = map.get(UNCATEGORIZED);
				if (fallback) fallback.push(task);
			}
		}
		return map;
	}
}

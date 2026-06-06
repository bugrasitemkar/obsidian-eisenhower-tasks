import { Plugin, PluginSettingTab, App, Setting } from 'obsidian';
import { EisenhowerView, VIEW_TYPE_EISENHOWER } from './EisenhowerView';
import { TaskManager } from './TaskManager';

export default class EisenhowerTasksPlugin extends Plugin {
	taskManager: TaskManager;

	async onload(): Promise<void> {
		this.taskManager = new TaskManager(this);
		await this.taskManager.load();

		this.registerView(
			VIEW_TYPE_EISENHOWER,
			(leaf) => new EisenhowerView(leaf, this.taskManager)
		);

		this.addRibbonIcon('layout-grid', 'Open Eisenhower Tasks', () => {
			void this.activateView();
		});

		this.addCommand({
			id: 'open-eisenhower-tasks',
			name: 'Open Eisenhower Tasks',
			callback: () => { void this.activateView(); },
		});

		this.registerEvent(
			this.app.workspace.on('file-open', (file) => {
				if (file?.path === 'tasks/Eisenhower Tasks.md') {
					void this.activateView();
				}
			})
		);

		this.addSettingTab(new EisenhowerSettingTab(this.app, this));

		// Sync any pre-existing dated tasks on load
		void this.taskManager.syncAllCalendarEvents();
	}

	async onunload(): Promise<void> {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_EISENHOWER);
	}

	async activateView(): Promise<void> {
		const { workspace } = this.app;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_EISENHOWER);
		if (leaves.length > 0) {
			workspace.revealLeaf(leaves[0]);
			return;
		}
		const leaf = workspace.getLeaf('tab');
		await leaf.setViewState({ type: VIEW_TYPE_EISENHOWER, active: true });
		workspace.revealLeaf(leaf);
	}
}

class EisenhowerSettingTab extends PluginSettingTab {
	private plugin: EisenhowerTasksPlugin;

	constructor(app: App, plugin: EisenhowerTasksPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h2', { text: 'Eisenhower Tasks' });

		new Setting(containerEl)
			.setName('Auto-tag on move')
			.setDesc('When a task is dragged into a section, append the section name as a tag (e.g. #work-projects).')
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.taskManager.data.settings.autoTagOnMove)
					.onChange(async (value) => {
						this.plugin.taskManager.data.settings.autoTagOnMove = value;
						await this.plugin.taskManager.save();
					})
			);

		new Setting(containerEl)
			.setName('Personal & Work sections')
			.setDesc('Add "Personal" and "Work" sections to every quadrant automatically.')
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.taskManager.data.settings.useDefaultSections)
					.onChange(async (value) => {
						this.plugin.taskManager.data.settings.useDefaultSections = value;
						await this.plugin.taskManager.save();
						if (value) await this.plugin.taskManager.enableDefaultSections();
						this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_EISENHOWER)
							.forEach(l => (l.view as EisenhowerView).refresh());
					})
			);

		new Setting(containerEl)
			.setName('Enable subtasks')
			.setDesc('Allow up to 3 levels of task hierarchy. Drag a task onto another task to make it a subtask. A parent task only archives when it and all its subtasks are completed.')
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.taskManager.data.settings.enableSubtasks)
					.onChange(async (value) => {
						this.plugin.taskManager.data.settings.enableSubtasks = value;
						await this.plugin.taskManager.save();
						this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_EISENHOWER)
							.forEach(l => (l.view as EisenhowerView).refresh());
					})
			);

		containerEl.createEl('h3', { text: 'Full Calendar Integration' });

		new Setting(containerEl)
			.setName('Enable Full Calendar sync')
			.setDesc('Tasks tagged with @YYYY-MM-DD appear as events in the Full Calendar plugin.')
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.taskManager.data.settings.fullCalendarIntegration)
					.onChange(async (value) => {
						this.plugin.taskManager.data.settings.fullCalendarIntegration = value;
						await this.plugin.taskManager.save();
						await this.plugin.taskManager.syncAllCalendarEvents();
					})
			);

		const folders = this.getFolderList();

		this.addFolderSetting(
			containerEl, folders,
			'Personal section folder',
			'Calendar folder for tasks in the "Personal" section.',
			'personalCalendarFolder',
			'Calendar/Personal',
		);

		this.addFolderSetting(
			containerEl, folders,
			'Work section folder',
			'Calendar folder for tasks in the "Work" section.',
			'workCalendarFolder',
			'Calendar/Work',
		);

		this.addFolderSetting(
			containerEl, folders,
			'Other sections folder',
			'Fallback calendar folder for tasks in any other section.',
			'fullCalendarFolder',
			'Calendar/Eisenhower',
		);
	}

	private getFolderList(): string[] {
		const folders: string[] = ['/'];
		this.app.vault.getAllFolders().forEach(f => folders.push(f.path));
		return folders.sort();
	}

	private addFolderSetting(
		container: HTMLElement,
		folders: string[],
		name: string,
		desc: string,
		key: 'personalCalendarFolder' | 'workCalendarFolder' | 'fullCalendarFolder',
		placeholder: string,
	): void {
		const settings = this.plugin.taskManager.data.settings;
		const current = settings[key] || placeholder;

		const setting = new Setting(container).setName(name).setDesc(desc);

		if (folders.length > 1) {
			setting.addDropdown(drop => {
				// Add current value even if folder doesn't exist yet
				const allOptions = folders.includes(current) ? folders : [current, ...folders];
				for (const f of allOptions) {
					drop.addOption(f, f);
				}
				drop.setValue(current);
				drop.onChange(async (value) => {
					settings[key] = value;
					await this.plugin.taskManager.save();
				});
			});
		} else {
			setting.addText(text =>
				text.setPlaceholder(placeholder).setValue(current).onChange(async (value) => {
					settings[key] = value.trim() || placeholder;
					await this.plugin.taskManager.save();
				})
			);
		}
	}
}

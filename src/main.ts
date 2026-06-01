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
	}
}

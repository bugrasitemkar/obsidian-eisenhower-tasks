import { Plugin } from 'obsidian';
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

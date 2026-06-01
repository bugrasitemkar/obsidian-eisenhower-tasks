import { ItemView, WorkspaceLeaf, setIcon, FuzzySuggestModal, TFile } from 'obsidian';
import { QUADRANT_KEYS, QUADRANT_LABELS, UNCATEGORIZED, type QuadrantKey, type SectionDef, type Task } from './types';
import { TaskManager } from './TaskManager';

export const VIEW_TYPE_EISENHOWER = 'eisenhower-tasks-view';

const DRAG_TASK_ID_KEY = 'eisenhower-task-id';

export class EisenhowerView extends ItemView {
	private taskManager: TaskManager;
	private fullscreenQuadrant: QuadrantKey | null = null;
	private filePickerOpen = false;

	constructor(leaf: WorkspaceLeaf, taskManager: TaskManager) {
		super(leaf);
		this.taskManager = taskManager;
	}

	getViewType(): string { return VIEW_TYPE_EISENHOWER; }
	getDisplayText(): string { return 'Eisenhower Tasks'; }
	getIcon(): string { return 'layout-grid'; }

	async onOpen(): Promise<void> { this.render(); }
	async onClose(): Promise<void> { /* nothing */ }

	private render(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('eisenhower-view');

		const grid = contentEl.createDiv({ cls: 'eisenhower-grid' });
		if (this.fullscreenQuadrant) grid.addClass('has-fullscreen');

		for (const key of QUADRANT_KEYS) {
			this.renderQuadrant(grid, key);
		}
	}

	private refresh(): void { this.render(); }

	private renderQuadrant(parent: HTMLElement, key: QuadrantKey): void {
		const labels = QUADRANT_LABELS[key];
		const quadrantEl = parent.createDiv({ cls: `eisenhower-quadrant eisenhower-${key}` });
		if (this.fullscreenQuadrant === key) quadrantEl.addClass('is-fullscreen');

		// ── Header ──
		const header = quadrantEl.createDiv({ cls: 'eisenhower-quadrant-header' });
		const headerText = header.createDiv({ cls: 'eisenhower-quadrant-header-text' });
		headerText.createEl('div', { cls: 'eisenhower-quadrant-title', text: labels.title });
		headerText.createEl('div', { cls: 'eisenhower-quadrant-subtitle', text: labels.subtitle });

		const expandBtn = header.createEl('button', {
			cls: 'eisenhower-icon-btn',
			attr: { 'aria-label': this.fullscreenQuadrant === key ? 'Exit fullscreen' : 'Fullscreen' },
		});
		setIcon(expandBtn, this.fullscreenQuadrant === key ? 'minimize-2' : 'maximize-2');
		expandBtn.addEventListener('click', () => {
			this.fullscreenQuadrant = this.fullscreenQuadrant === key ? null : key;
			this.refresh();
		});

		// ── Add Section row (just below header) ──
		this.renderAddSectionRow(quadrantEl, key);

		// ── Scrollable sections ──
		const sectionsContainer = quadrantEl.createDiv({ cls: 'eisenhower-sections-container' });
		const tasksBySection = this.taskManager.getTasksBySection(key);
		for (const section of this.taskManager.data.sections[key]) {
			const tasks = tasksBySection.get(section.name) ?? [];
			this.renderSection(sectionsContainer, key, section, tasks);
		}

		// ── Single Add Task row at bottom ──
		this.renderAddTaskRow(quadrantEl, key);
	}

	private renderSection(
		parent: HTMLElement,
		quadrant: QuadrantKey,
		section: SectionDef,
		tasks: Task[]
	): void {
		const sectionEl = parent.createDiv({ cls: 'eisenhower-section' });
		const isDefault = section.name === UNCATEGORIZED;

		const headerRow = sectionEl.createDiv({ cls: 'eisenhower-section-header' });
		const nameSpan = headerRow.createEl('span', { cls: 'eisenhower-section-name', text: section.name });

		if (!isDefault) {
			const renameBtn = headerRow.createEl('button', {
				cls: 'eisenhower-icon-btn',
				attr: { 'aria-label': 'Rename section' },
			});
			setIcon(renameBtn, 'pencil');
			renameBtn.addEventListener('click', () => {
				this.startInlineRename(headerRow, nameSpan, quadrant, section);
			});

			const deleteBtn = headerRow.createEl('button', {
				cls: 'eisenhower-icon-btn eisenhower-delete-btn',
				attr: { 'aria-label': 'Delete section' },
			});
			setIcon(deleteBtn, 'trash-2');
			deleteBtn.addEventListener('click', async () => {
				await this.taskManager.deleteSection(quadrant, section.id);
				this.refresh();
			});
		}

		// ── Task list / drop zone ──
		const taskList = sectionEl.createDiv({ cls: 'eisenhower-task-list' });
		taskList.dataset['quadrant'] = quadrant;
		taskList.dataset['section'] = section.name;

		taskList.addEventListener('dragover', (e: DragEvent) => {
			e.preventDefault();
			taskList.addClass('drag-over');
		});
		taskList.addEventListener('dragleave', () => taskList.removeClass('drag-over'));
		taskList.addEventListener('drop', async (e: DragEvent) => {
			e.preventDefault();
			taskList.removeClass('drag-over');
			const taskId = e.dataTransfer?.getData(DRAG_TASK_ID_KEY);
			if (!taskId) return;
			await this.taskManager.moveTask(taskId, quadrant, section.name);
			this.refresh();
		});

		for (const task of tasks) {
			this.renderTask(taskList, task);
		}
	}

	private renderTask(parent: HTMLElement, task: Task): void {
		const taskEl = parent.createDiv({ cls: 'eisenhower-task', attr: { draggable: 'true' } });

		taskEl.addEventListener('dragstart', (e: DragEvent) => {
			e.dataTransfer?.setData(DRAG_TASK_ID_KEY, task.id);
			if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
			taskEl.addClass('is-dragging');
		});
		taskEl.addEventListener('dragend', () => taskEl.removeClass('is-dragging'));

		const checkbox = taskEl.createEl('input', { type: 'checkbox', cls: 'eisenhower-task-checkbox' });
		checkbox.checked = false;

		const textRow = taskEl.createDiv({ cls: 'eisenhower-task-body' });
		const textSpan = textRow.createEl('span', { cls: 'eisenhower-task-text' });
		this.renderTaskText(textSpan, task.text);

		const date = this.taskManager.extractDate(task.text);
		if (date) {
			textRow.createEl('span', { cls: 'eisenhower-task-date', text: date });
		}

		textSpan.addEventListener('dblclick', (e: MouseEvent) => {
			e.stopPropagation();
			this.startInlineTaskEdit(taskEl, textSpan, task);
		});

		checkbox.addEventListener('change', async () => {
			if (checkbox.checked) {
				await this.taskManager.completeTask(task.id);
				this.refresh();
			}
		});
	}

	private startInlineTaskEdit(taskEl: HTMLElement, textSpan: HTMLElement, task: Task): void {
		taskEl.draggable = false;
		textSpan.style.display = 'none';

		const input = taskEl.createEl('input', {
			type: 'text',
			cls: 'eisenhower-task-edit-input',
			value: task.text,
		});
		input.focus();
		input.select();

		let committed = false;

		const commit = async () => {
			if (committed) return;
			committed = true;
			const newText = input.value.trim();
			if (newText && newText !== task.text) {
				await this.taskManager.updateTaskText(task.id, newText);
			}
			this.refresh();
		};

		const cancel = () => {
			if (committed) return;
			committed = true;
			this.refresh();
		};

		input.addEventListener('blur', () => {
			if (document.querySelector('.eisenhower-date-picker-popup')) return;
			if (this.filePickerOpen) return;
			void commit();
		});
		input.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key === 'Enter') { e.preventDefault(); void commit(); }
			if (e.key === 'Escape') { e.preventDefault(); cancel(); }
		});
		input.addEventListener('input', () => {
			if (input.value.endsWith('@')) { this.showDatePicker(input); }
			if (input.value.endsWith('[[')) { this.showFilePicker(input); }
		});
	}

	private renderTaskText(container: HTMLElement, text: string): void {
		const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
		let lastIndex = 0;
		let match;
		while ((match = wikiLinkRegex.exec(text)) !== null) {
			if (match.index > lastIndex) {
				container.appendText(text.slice(lastIndex, match.index));
			}
			const inner = match[1];
			const pipeIdx = inner.indexOf('|');
			const target = pipeIdx >= 0 ? inner.slice(0, pipeIdx) : inner;
			const display = pipeIdx >= 0 ? inner.slice(pipeIdx + 1) : inner;
			const link = container.createEl('a', {
				cls: 'eisenhower-wiki-link internal-link',
				text: display,
				attr: { 'data-href': target, href: target },
			});
			link.addEventListener('click', (e: MouseEvent) => {
				e.preventDefault();
				e.stopPropagation();
				this.app.workspace.openLinkText(target, '', false);
			});
			lastIndex = match.index + match[0].length;
		}
		if (lastIndex < text.length) {
			container.appendText(text.slice(lastIndex));
		}
	}

	// Single add-task button per quadrant → adds to Uncategorized
	private renderAddTaskRow(parent: HTMLElement, quadrant: QuadrantKey): void {
		const row = parent.createDiv({ cls: 'eisenhower-add-task' });
		const input = row.createEl('input', {
			type: 'text',
			cls: 'eisenhower-add-task-input',
			placeholder: 'Add task to Uncategorized…',
		});
		const addBtn = row.createEl('button', { cls: 'eisenhower-add-btn', text: 'Add Task' });

		const submit = async () => {
			const text = input.value.trim();
			if (!text) return;
			await this.taskManager.addTask(quadrant, UNCATEGORIZED, text);
			this.refresh();
		};

		addBtn.addEventListener('click', submit);
		input.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key === 'Enter') { e.preventDefault(); void submit(); }
		});
		input.addEventListener('input', () => {
			if (input.value.endsWith('@')) { this.showDatePicker(input); }
			if (input.value.endsWith('[[')) { this.showFilePicker(input); }
		});
	}

	private showDatePicker(targetInput: HTMLInputElement): void {
		const existing = document.querySelector('.eisenhower-date-picker-popup');
		if (existing) existing.remove();

		const popup = document.body.createDiv({ cls: 'eisenhower-date-picker-popup' });
		const dateInput = popup.createEl('input', { type: 'date' });

		const rect = targetInput.getBoundingClientRect();
		popup.style.top = `${rect.bottom + 4}px`;
		popup.style.left = `${rect.left}px`;

		const insert = (value: string) => {
			const cur = targetInput.value;
			const base = cur.endsWith('@') ? cur.slice(0, -1) : cur;
			targetInput.value = `${base.trimEnd()} @${value}`.trimStart();
			popup.remove();
			targetInput.focus();
		};

		dateInput.addEventListener('change', () => {
			if (dateInput.value) insert(dateInput.value);
		});

		dateInput.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key === 'Escape') { popup.remove(); targetInput.focus(); }
		});

		// Close when focus leaves the popup (but not to native picker)
		dateInput.addEventListener('blur', () => {
			setTimeout(() => {
				if (!popup.isConnected) return;
				if (!popup.contains(document.activeElement)) popup.remove();
			}, 300);
		});

		setTimeout(() => dateInput.focus(), 10);
	}

	private renderAddSectionRow(parent: HTMLElement, quadrant: QuadrantKey): void {
		const row = parent.createDiv({ cls: 'eisenhower-add-section' });
		const input = row.createEl('input', {
			type: 'text',
			cls: 'eisenhower-add-section-input',
			placeholder: 'New section name…',
		});
		const addBtn = row.createEl('button', { cls: 'eisenhower-add-btn', text: 'Add Section' });

		const submit = async () => {
			const name = input.value.trim();
			if (!name || name === UNCATEGORIZED) return;
			const exists = this.taskManager.data.sections[quadrant].some(s => s.name === name);
			if (exists) return;
			await this.taskManager.addSection(quadrant, name);
			this.refresh();
		};

		addBtn.addEventListener('click', submit);
		input.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key === 'Enter') { e.preventDefault(); void submit(); }
		});
	}

	private showFilePicker(targetInput: HTMLInputElement): void {
		this.filePickerOpen = true;
		new FileLinkModal(
			this.app,
			(file: TFile) => {
				const cur = targetInput.value;
				const base = cur.endsWith('[[') ? cur.slice(0, -2) : cur;
				const linkPath = file.path.endsWith('.md') ? file.path.slice(0, -3) : file.path;
				targetInput.value = `${base}[[${linkPath}]]`;
			},
			() => {
				this.filePickerOpen = false;
				targetInput.focus();
			}
		).open();
	}

	private startInlineRename(
		headerRow: HTMLElement,
		nameSpan: HTMLElement,
		quadrant: QuadrantKey,
		section: SectionDef
	): void {
		const originalName = section.name;
		nameSpan.style.display = 'none';

		const input = headerRow.createEl('input', {
			type: 'text',
			cls: 'eisenhower-rename-input',
			value: originalName,
		});
		input.focus();
		input.select();

		let committed = false;

		const commit = async () => {
			if (committed) return;
			committed = true;
			const newName = input.value.trim();
			if (newName && newName !== originalName) {
				await this.taskManager.renameSection(quadrant, section.id, newName);
			}
			this.refresh();
		};

		const cancel = () => {
			if (committed) return;
			committed = true;
			this.refresh();
		};

		input.addEventListener('blur', () => void commit());
		input.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key === 'Enter') { e.preventDefault(); void commit(); }
			if (e.key === 'Escape') { e.preventDefault(); cancel(); }
		});
	}
}

class FileLinkModal extends FuzzySuggestModal<TFile> {
	private onChooseCb: (file: TFile) => void;
	private onDismiss: () => void;

	constructor(
		app: import('obsidian').App,
		onChoose: (file: TFile) => void,
		onDismiss: () => void,
	) {
		super(app);
		this.onChooseCb = onChoose;
		this.onDismiss = onDismiss;
		this.setPlaceholder('Search notes to link…');
	}

	getItems(): TFile[] {
		return this.app.vault.getMarkdownFiles()
			.sort((a, b) => a.path.localeCompare(b.path));
	}

	getItemText(file: TFile): string {
		return file.path;
	}

	onChooseItem(file: TFile): void {
		this.onChooseCb(file);
	}

	onClose(): void {
		super.onClose();
		this.onDismiss();
	}
}

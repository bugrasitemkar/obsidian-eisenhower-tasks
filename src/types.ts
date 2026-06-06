export type QuadrantKey = 'q1' | 'q2' | 'q3' | 'q4';

export const QUADRANT_LABELS: Record<QuadrantKey, { title: string; subtitle: string }> = {
	q1: { title: 'Do First',  subtitle: 'Urgent & Important' },
	q2: { title: 'Delegate',  subtitle: 'Urgent & Non-Important' },
	q3: { title: 'Schedule',  subtitle: 'Non-Urgent & Important' },
	q4: { title: 'Eliminate', subtitle: 'Non-Urgent & Non-Important' },
};

export const QUADRANT_KEYS: QuadrantKey[] = ['q1', 'q2', 'q3', 'q4'];

export const UNCATEGORIZED = 'Uncategorized';

export const MAX_SUBTASK_DEPTH = 2;

export interface Task {
	id: string;
	text: string;
	quadrant: QuadrantKey;
	section: string;
	completed: boolean;
	createdAt: number;
	parentId?: string;
}

export interface SectionDef {
	id: string;
	name: string;
}

export interface PluginSettings {
	autoTagOnMove: boolean;
	useDefaultSections: boolean;
	fullCalendarIntegration: boolean;
	fullCalendarFolder: string;
	personalCalendarFolder: string;
	workCalendarFolder: string;
	enableSubtasks: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	autoTagOnMove: false,
	useDefaultSections: false,
	fullCalendarIntegration: false,
	fullCalendarFolder: 'Calendar/Eisenhower',
	personalCalendarFolder: 'Calendar/Personal',
	workCalendarFolder: 'Calendar/Work',
	enableSubtasks: false,
};

export interface PluginData {
	tasks: Task[];
	sections: Record<QuadrantKey, SectionDef[]>;
	archiveFile: string;
	settings: PluginSettings;
}

export const DEFAULT_DATA: PluginData = {
	tasks: [],
	sections: {
		q1: [{ id: 'default-q1', name: UNCATEGORIZED }],
		q2: [{ id: 'default-q2', name: UNCATEGORIZED }],
		q3: [{ id: 'default-q3', name: UNCATEGORIZED }],
		q4: [{ id: 'default-q4', name: UNCATEGORIZED }],
	},
	archiveFile: 'Eisenhower Archive.md',
	settings: { ...DEFAULT_SETTINGS },
};

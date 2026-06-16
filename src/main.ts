import { Plugin, PluginSettingTab, App, Setting } from "obsidian";
import { EisenhowerView, VIEW_TYPE_EISENHOWER } from "./EisenhowerView";
import { TaskManager } from "./TaskManager";

export default class EisenhowerTasksPlugin extends Plugin {
  taskManager: TaskManager;

  async onload(): Promise<void> {
    this.taskManager = new TaskManager(this);
    await this.taskManager.load();

    this.registerView(
      VIEW_TYPE_EISENHOWER,
      (leaf) => new EisenhowerView(leaf, this.taskManager),
    );

    this.addRibbonIcon("layout-grid", "Open Eisenhower Tasks", () => {
      void this.activateView();
    });

    this.addCommand({
      id: "open",
      name: "Open",
      callback: () => {
        void this.activateView();
      },
    });

    this.registerEvent(
      this.app.workspace.on("file-open", (file) => {
        if (file?.path === "tasks/Eisenhower Tasks.md") {
          void this.activateView();
        }
      }),
    );

    this.addSettingTab(new EisenhowerSettingTab(this.app, this));
  }

  async activateView(): Promise<void> {
    const { workspace } = this.app;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_EISENHOWER);
    if (leaves.length > 0) {
      void workspace.revealLeaf(leaves[0]);
      return;
    }
    const leaf = workspace.getLeaf("tab");
    await leaf.setViewState({ type: VIEW_TYPE_EISENHOWER, active: true });
    void workspace.revealLeaf(leaf);
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
    new Setting(containerEl).setName("Eisenhower Tasks").setHeading();

    new Setting(containerEl)
      .setName("Auto-tag on move")
      .setDesc(
        "When a task is dragged into a section, append the section name as a tag (e.g. #work-projects).",
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.taskManager.data.settings.autoTagOnMove)
          .onChange(async (value) => {
            this.plugin.taskManager.data.settings.autoTagOnMove = value;
            await this.plugin.taskManager.save();
          }),
      );

    new Setting(containerEl)
      .setName("Personal & Work sections")
      .setDesc(
        'Add "Personal" and "Work" sections to every quadrant automatically.',
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.taskManager.data.settings.useDefaultSections)
          .onChange(async (value) => {
            this.plugin.taskManager.data.settings.useDefaultSections = value;
            await this.plugin.taskManager.save();
            if (value) await this.plugin.taskManager.enableDefaultSections();
            this.plugin.app.workspace
              .getLeavesOfType(VIEW_TYPE_EISENHOWER)
              .forEach((l) => (l.view as EisenhowerView).refresh());
          }),
      );
  }
}

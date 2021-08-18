import {
    App,
    MarkdownPostProcessorContext,
    MarkdownSectionInformation,
    MarkdownView,
    Modal,
    Notice,
    Plugin,
    PluginSettingTab,
    Setting
} from "obsidian";

import Sortable from "sortablejs";

interface BlockDraggingSettings {
    mySetting: string;
}
const DEFAULT_SETTINGS: BlockDraggingSettings = {
    mySetting: "default"
};
export default class BlockDragging extends Plugin {
    settings: BlockDraggingSettings;
    map: Map<MarkdownView, Map<HTMLElement, MarkdownSectionInformation>> =
        new Map();
    async onload() {
        console.log("Loading Block Dragging v" + this.manifest.version);
        await this.loadSettings();

        this.registerMarkdownPostProcessor(
            async (el, ctx) => await this.postprocessor(el, ctx)
        );
        this.registerEvent(
            this.app.workspace.on("active-leaf-change", (leaf) => {
                if (!leaf.view || !(leaf.view instanceof MarkdownView)) return;
                if (!leaf.view.file) return;
                if (!leaf.view.containerEl) return;

                if (!this.map.has(leaf.view)) {
                    this.map.set(leaf.view, new Map());
                }
                let contextMap = this.map.get(leaf.view);

                const sizer = leaf.view.containerEl.querySelector(
                    ".markdown-preview-sizer"
                );
                if (!sizer || !(sizer instanceof HTMLElement)) return;

                console.log(
                    leaf.view.file,
                    this.app.metadataCache.getFileCache(leaf.view.file).sections
                );

                const list = sizer.querySelectorAll(
                    "div:not(.markdown-preview-pusher):not(.collapse-indicator)"
                );

                console.log("🚀 ~ file: main.ts ~ line 56 ~ list", list);

                const sort = new Sortable(sizer, {
                    draggable: "> div",
                    filter: ".markdown-preview-pusher, .collapse-indicator",

                    onUpdate: (evt) => {
                        console.log("🚀 ~ file: main.ts ~ line 63 ~ evt", evt);
                    }
                });
                console.log("🚀 ~ file: main.ts ~ line 68 ~ sort", sort);
            })
        );
    }
    async postprocessor(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return;
        if (!this.map.has(view)) {
            this.map.set(view, new Map());
        }
        let contextMap = this.map.get(view);
        contextMap.set(el, ctx.getSectionInfo(el));
    }

    onunload() {
        console.log("Unloading Block Dragging");
    }
    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        );
    }
    async saveSettings() {
        await this.saveData(this.settings);
    }
}
class SampleModal extends Modal {
    constructor(app: App) {
        super(app);
    }
    onOpen() {
        let { contentEl } = this;
        contentEl.setText("Woah!");
    }
    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}
class SampleSettingTab extends PluginSettingTab {
    plugin: BlockDragging;
    constructor(app: App, plugin: BlockDragging) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display(): void {
        let { containerEl } = this;
        containerEl.empty();
        containerEl.createEl("h2", { text: "Settings for my awesome plugin." });
        new Setting(containerEl)
            .setName("Setting #1")
            .setDesc("It's a secret")
            .addText((text) =>
                text
                    .setPlaceholder("Enter your secret")
                    .setValue("")
                    .onChange(async (value) => {
                        console.log("Secret: " + value);
                        this.plugin.settings.mySetting = value;
                        await this.plugin.saveSettings();
                    })
            );
    }
}

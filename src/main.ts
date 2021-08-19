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

declare module "obsidian" {
    interface View {
        file: TFile;
    }
}
export default class BlockDragging extends Plugin {
    map: Map<MarkdownView, Map<HTMLElement, MarkdownPostProcessorContext>> =
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

                let list: NodeListOf<HTMLDivElement> = sizer.querySelectorAll(
                    "div:not(.collapse-indicator):not(:empty)"
                );

                const sort = new Sortable(sizer, {
                    draggable: "div",
                    filter: ".collapse-indicator, div > section.footnotes, :empty",

                    onEnd: async (evt) => {
                        list = sizer.querySelectorAll(
                            "div:not(.collapse-indicator):not(:empty)"
                        );
                        let fileText = (
                            await this.app.vault.cachedRead(leaf.view.file)
                        ).split("\n");

                        const myContext = contextMap.get(evt.item);
                        const mySection = myContext.getSectionInfo(evt.item);
                        const elementIAmNowBefore = list.item(
                            evt.newDraggableIndex
                        );

                        const newContext = contextMap.get(elementIAmNowBefore);
                        const newSection =
                            newContext.getSectionInfo(elementIAmNowBefore);

                        fileText = [
                            ...fileText.slice(0, mySection.lineStart),
                            ...fileText.slice(
                                mySection.lineEnd + 1,
                                newSection.lineStart
                            ),
                            ...fileText.slice(
                                mySection.lineStart,
                                mySection.lineEnd + 1
                            ),
                            ...fileText.slice(newSection.lineStart)
                        ];

                        /* console.log(fileText); */

                        await this.app.vault.modify(leaf.view.file, fileText.join('\n'))
                    },
                    onStart: (evt) => {
                        list = sizer.querySelectorAll(
                            "div:not(.collapse-indicator):not(:empty)"
                        );
                    }
                });
                console.log(
                    "🚀 ~ file: main.ts ~ line 68 ~ sort",
                    sort.toArray()
                );
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
        contextMap.set(el, ctx);
    }

    onunload() {
        console.log("Unloading Block Dragging");
    }
    async loadSettings() {}
    async saveSettings() {}
}

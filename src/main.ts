import { MarkdownPostProcessorContext, MarkdownView, Plugin } from "obsidian";

import "./assets/styles.css";

import Sortable from "sortablejs";

declare module "obsidian" {
    interface View {
        file: TFile;
    }
}
export default class BlockDragging extends Plugin {
    map: Map<HTMLElement, MarkdownPostProcessorContext> = new Map();
    async onload() {
        console.log("Loading Block Dragging v" + this.manifest.version);
        await this.loadSettings();

        this.registerMarkdownPostProcessor(
            async (el, ctx) => await this.postprocessor(el, ctx)
        );
        this.registerEvent(
            this.app.workspace.on("active-leaf-change", (leaf) => {
                if (!leaf.view || !(leaf.view instanceof MarkdownView)) return;
                if (!this.app.workspace.getActiveFile()) return;
                if (!leaf.view.containerEl) return;
                const file = this.app.workspace.getActiveFile();
                const { containerEl } = leaf.view;

                const observer = new MutationObserver((list) => {
                    for (const mutation of list) {
                        if (
                            mutation.type === "childList" &&
                            mutation.removedNodes.length
                        ) {
                            this.map.delete(containerEl);
                            observer.disconnect();
                        }
                    }
                });

                observer.observe(containerEl.parentElement, {
                    childList: true,
                    attributes: false,
                    subtree: false
                });

                if (!this.map.has(containerEl)) {
                    this.map.set(containerEl, undefined);
                }
                const sizer = containerEl.querySelector(
                    ".markdown-preview-sizer"
                );
                if (!sizer || !(sizer instanceof HTMLElement)) return;

                let list: NodeListOf<HTMLDivElement> = sizer.querySelectorAll(
                    "div.block-drag-plugin-draggable-element"
                );
                const sort = new Sortable(sizer, {
                    draggable: "div.block-drag-plugin-draggable-element",
                    filter: ".collapse-indicator",
                    handle: ".block-drag-plugin-handle",
                    delayOnTouchOnly: true,
                    delay: 100,
                    chosenClass: "block-drag-plugin-chosen",
                    ghostClass: "block-drag-plugin-ghost",
                    onEnd: async (evt) => {
                        let removed = 0;
                        let fileText = (await this.app.vault.read(file)).split(
                            "\n"
                        );

                        const context = this.map.get(containerEl);
                        const mySection = context.getSectionInfo(evt.item);

                        //my text should also include my newlines
                        const myNewLines = this.getNewlinesAfterIndex(
                            fileText,
                            mySection.lineEnd
                        );

                        const myStart = mySection.lineStart;
                        const myEnd = mySection.lineEnd + myNewLines + 1;
                        const myText = fileText.slice(myStart, myEnd);

                        fileText = [
                            ...fileText.slice(0, myStart),
                            ...fileText.slice(myEnd)
                        ];

                        /** The list will return the element before the dragged item if it goes forward. */
                        const iWentForward = evt.newIndex > evt.oldIndex;

                        removed += (myEnd - myStart) * Number(iWentForward);

                        const elementIAmNowBefore = list.item(
                            evt.newDraggableIndex + Number(iWentForward)
                        );
                        const newSection =
                            context.getSectionInfo(elementIAmNowBefore);

                        if (!newSection) {
                            fileText.push(...myText);
                            await this.app.vault.modify(
                                file,
                                fileText.join("\n")
                            );
                            return;
                        }

                        fileText = [
                            ...fileText.slice(
                                0,
                                newSection.lineStart - removed
                            ),
                            ...myText,
                            ...fileText.slice(newSection.lineStart - removed)
                        ];

                        console.log(fileText);
                        await this.app.vault.modify(file, fileText.join("\n"));
                    },
                    onStart() {
                        list = sizer.querySelectorAll(
                            "div.block-drag-plugin-draggable-element"
                        );
                    }
                });
            })
        );
    }

    getNewlinesAfterIndex(text: string[], index: number) {
        const toSearch = text.slice(index + 1);
        const findIndex = toSearch.findIndex((line) => line.length);

        return findIndex < 0 ? toSearch?.length ?? 0 : findIndex;
    }

    async postprocessor(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        if (!el.childElementCount) return;
        if (el.querySelector("section.footnotes")) return;
        if (el.querySelector(".frontmatter")) return;

        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return;

        if (
            !this.map.has(view.containerEl) ||
            this.map.get(view.containerEl) === undefined
        ) {
            this.map.set(view.containerEl, ctx);
        }
        el.addClass("block-drag-plugin-draggable-element");
        el.createSpan({
            cls: "block-drag-plugin-handle",
            text: "⋮⋮"
        });
    }

    onunload() {
        console.log("Unloading Block Dragging");
    }
    async loadSettings() {}
    async saveSettings() {}
}

import { TextFileView } from "obsidian";
import { writable, Unsubscriber } from "svelte/store";
import ChatFile from "./ChatFile.svelte";

export class ChatFileView extends TextFileView {
    static VIEW_TYPE = 'chat-file-view';

    private component: ChatFile;
    private data$ = writable<string>("");
    unsubscribeData: Unsubscriber;

    getViewData() {
        return this.data;
    }

    setViewData(data: string, clear: boolean) {
        if (clear) {
            this.clear();
        }
        this.data = data;
        this.data$.set(data);
    }

    clear() {
        this.data = "";
    }

    getViewType() {
        return ChatFileView.VIEW_TYPE;
    }

    getDisplayText() {
        return `${this.file?.basename ?? "New"} — Chat File`;
    }

    getIcon() {
        return 'messages-square';
    }

    onload() {
        this.unsubscribeData = this.data$.subscribe((data) => {
            this.data = data;
            this.requestSave();
        })
    }

    onunload() {
        this.unsubscribeData();
    }

    async onOpen() {
        this.component = new ChatFile({
            target: this.contentEl,
            props: {
                data: this.data$,
            }
        });
    }

    async onClose() {
        this.component.$destroy();
    }
}

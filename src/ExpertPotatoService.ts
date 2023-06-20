import { Subject, buffer, debounceTime } from "rxjs";
import { App, TAbstractFile, request, requestUrl } from "obsidian";
import ExpertPotato from "main";
const Multipart = require('multi-part-lite');

// Wait 5s before committing changes to the index
const DELAY_BEFORE_COMMIT = 5000;

type IndexData = {
    [key: string]: {},
}

enum ChangeType {
    UPDATE = "update",
    DELETE = "delete",
}

interface Change {
    path: string;
    type: ChangeType;
}

export class ExpertPotatoService {
    private indexedFiles: IndexData = {};
    private indexPath = `${this.app.vault.configDir}/plugins/${this.plugin.manifest.id}/index.json`;
    private changeTracker$: Subject<Change> = new Subject<Change>();
    private cumulativeChangesTrigger$ = this.changeTracker$.pipe(
        debounceTime(DELAY_BEFORE_COMMIT)
    );
    private cumulativeChanges$ = this.changeTracker$.pipe(
        buffer(this.cumulativeChangesTrigger$),
    ).subscribe((changes: Change[]) => {
        const changeSet: Record<string, Change> = {};
        for (const change of changes) {
            changeSet[change.path] = change;
        }
        for (const change of Object.values(changeSet)) {
            if (change.type === ChangeType.DELETE) {
                this.fileDelete(change);
            } else {
                this.fileUpdate(change);
            }
        }
        return changeSet;
    });

    constructor(
        private app: App,
        private plugin: ExpertPotato
    ) {}

    async onload() {
        await this.loadIndex();
        await this.auth();

        // NOTE: When the app is starting or is being reloaded,
        // a "create" event is fired for every file in the vault
        this.plugin.registerEvent(this.app.vault.on("create", ({ path }: TAbstractFile) => {
            this.changeTracker$.next({ path, type: ChangeType.UPDATE });
        }));
        this.plugin.registerEvent(this.app.vault.on("modify", ({ path }: TAbstractFile) => {
            this.changeTracker$.next({ path, type: ChangeType.UPDATE });
        }));
        this.plugin.registerEvent(this.app.vault.on("rename", ({ path }: TAbstractFile, oldPath: string) => {
            // NOTE: A rename operation is actually a delete and a create, to keep history simple.
            // this.changeTracker$.next({ path: oldPath, type: ChangeType.RENAME, newPath: path });
            this.changeTracker$.next({ path: oldPath, type: ChangeType.DELETE });
            this.changeTracker$.next({ path, type: ChangeType.UPDATE });
        }));
        this.plugin.registerEvent(this.app.vault.on("delete", ({ path }: TAbstractFile) => {
            this.changeTracker$.next({ path, type: ChangeType.DELETE });
        }));
        // NOTE: The "closed" event doesn't seem to be useful here
    }

    async onunload() {
        this.saveIndex();
    }

    fileUpdate = async ({ path }: Change) => {
        this.indexedFiles[path] = {};
        this.saveIndexDelayed();

        if (!path.match(/\.md$/)) {
            console.log("Skipping non-Markdown file", path);
            return;
        }

        const form = new Multipart();
        form.append("session_id", this.plugin.settings.foundationSessionId!);
        form.append("files", Buffer.from(await this.app.vault.adapter.read(path)), { filename: path, contentType: "text/markdown" })
        const body = (await form.buffer()).toString();

        return request({
            url: `http://${this.plugin.settings.foundationHost}/learn`,
            method: "POST",
            contentType: `multipart/form-data; boundary=${form.getBoundary()}`,
            body,
        })
    }

    fileDelete = ({ path }: Change) => {
        delete this.indexedFiles[path];
        this.saveIndexDelayed();

        const body = new URLSearchParams({
            "session_id": this.plugin.settings.foundationSessionId!,
            "filename": path,
        }).toString()

        return request({
            url: `http://${this.plugin.settings.foundationHost}/learn`,
            method: "DELETE",
            contentType: "application/x-www-form-urlencoded",
            body,
        })
    }

    async loadIndex() {
        if (await this.app.vault.adapter.exists(this.indexPath, true)) {
            this.indexedFiles = JSON.parse(await this.app.vault.adapter.read(this.indexPath));
            console.log('Loaded index', this.indexedFiles);
        } else {
            console.log('No index found');
        }
    }

    private saveIndexDelayedTimeout: ReturnType<typeof setTimeout> | null = null;
    async saveIndexDelayed() {
        if (this.saveIndexDelayedTimeout) {
            clearTimeout(this.saveIndexDelayedTimeout);
            this.saveIndexDelayedTimeout = null;
        }
        return new Promise<void>((resolve, reject) => {
            this.saveIndexDelayedTimeout = setTimeout(async () => {
                this.saveIndexDelayedTimeout = null;
                await this.app.vault.adapter.write(this.indexPath, JSON.stringify(this.indexedFiles));
                console.log('Saved index (delayed)', this.indexedFiles);
                resolve();
            }, 2000);
        });
    }

    async saveIndex() {
        if (this.saveIndexDelayedTimeout) {
            clearTimeout(this.saveIndexDelayedTimeout);
            this.saveIndexDelayedTimeout = null;
        }
        await this.app.vault.adapter.write(this.indexPath, JSON.stringify(this.indexedFiles));
        console.log('Saved index', this.indexedFiles);
    }

    async auth() {
        if (!!this.plugin.settings.foundationSessionId) {
            const response = (await requestUrl({
                url: `http://${this.plugin.settings.foundationHost}/auth`,
                method: "POST",
                body: JSON.stringify({
                    "openai_key": this.plugin.settings.openAiApiKey,
                    "source": "OBSIDIAN EXPERT POTATO",
                })
            })).json

            this.plugin.settings.foundationSessionId = response.session_id;
            this.plugin.saveSettings();
        }
        
        return this.plugin.settings.foundationSessionId;
    }

    // async search(query) {
    //     return Array.from(this.indexedFiles).filter(file => file.basename.toLowerCase().includes(query.toLowerCase()));
    // }
}

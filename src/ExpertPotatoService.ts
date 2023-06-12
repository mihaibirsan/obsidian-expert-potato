import { App, Plugin, TAbstractFile } from "obsidian";

type IndexData = {
    [key: string]: {},
}

export class ExpertPotatoService {
    private indexedFiles: IndexData = {};
    private indexPath = `${this.app.vault.configDir}/plugins/${this.plugin.manifest.id}/index.json`;

    constructor(
        private app: App,
        private plugin: Plugin
    ) {}

    async onload() {
        await this.loadIndex();

        // NOTE: When the app is starting or is being reloaded,
        // a "create" event is fired for every file in the vault
        this.plugin.registerEvent(this.app.vault.on("create", this.createFile));
        this.plugin.registerEvent(this.app.vault.on("modify", this.modifyFile));
        this.plugin.registerEvent(this.app.vault.on("rename", this.renameFile));
        this.plugin.registerEvent(this.app.vault.on("delete", this.deleteFile));
        // NOTE: The "closed" event doesn't seem to be useful here
    }

    async onunload() {
        this.saveIndex();
    }

    createFile = (file: TAbstractFile) => {
        this.indexedFiles[file.path] = {};
        this.saveIndexDelayed();
        console.log("createFile", `${file.path}`);
        // NOTE: Create and Modify are similar, since a file may be copied from a different souce
    }

    modifyFile = (file: TAbstractFile) => {
        this.indexedFiles[file.path] = {};
        this.saveIndexDelayed();
        console.log("modifyFile", `${file.path}`);
        // NOTE: Defer event handling to the service
    }

    renameFile = (file: TAbstractFile, oldPath: string) => {
        this.indexedFiles[file.path] = this.indexedFiles[oldPath];
        delete this.indexedFiles[oldPath];
        this.saveIndexDelayed();
        console.log("renameFile", `${oldPath} -> ${file.path}`);
        // NOTE: This would ideally only update the metadata of the file;
        // otherwise, it's a delete and create
    }

    deleteFile = (file: TAbstractFile) => {
        delete this.indexedFiles[file.path];
        this.saveIndexDelayed();
        console.log("deleteFile", `${file.path}`);
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

    // async search(query) {
    //     return Array.from(this.indexedFiles).filter(file => file.basename.toLowerCase().includes(query.toLowerCase()));
    // }
}

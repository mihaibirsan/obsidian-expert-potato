import { App, Plugin, TAbstractFile } from "obsidian";

export class ExpertPotatoService {
    private indexedFiles = new Set<string>();

    constructor(
        private app: App,
        private plugin: Plugin
    ) {}

    async onload() {
        // NOTE: When the app is starting or is being reloaded,
        // a "create" event is fired for every file in the vault
        this.plugin.registerEvent(this.app.vault.on("create", this.createFile));
        this.plugin.registerEvent(this.app.vault.on("modify", this.modifyFile));
        this.plugin.registerEvent(this.app.vault.on("rename", this.renameFile));
        this.plugin.registerEvent(this.app.vault.on("delete", this.deleteFile));
        // NOTE: The "closed" event doesn't seem to be useful here

        // TODO: This information will need to be persisted in the plugin setings directory
        const indexPath = `${this.app.vault.configDir}/${this.plugin.manifest.id}/index.json`;
        const indexArray: string[] = JSON.parse(await this.app.vault.adapter.read(indexPath))
        this.indexedFiles.clear();
        indexArray.forEach(path => this.indexedFiles.add(path));
        // NOTE: Can we get a list of all indexed files from the service? (In case this one forgets)
        // Would it be a NOOP to upload a file that's already be indexed?
    }

    onunload() {
        // TODO: persist index
        this.indexedFiles.clear();
    }

    createFile = (file: TAbstractFile) => {
        this.indexedFiles.add(file.path);
        console.log("createFile", `${file.path}`);
        console.log(JSON.stringify(Array.from(this.indexedFiles), null, 2));
        // NOTE: Create and Modify are similar, since a file may be copied from a different souce
    }

    modifyFile = (file: TAbstractFile) => {
        this.indexedFiles.add(file.path);
        console.log("modifyFile", `${file.path}`);
        // NOTE: Defer event handling to the service
    }

    renameFile = (file: TAbstractFile, oldPath: string) => {
        this.indexedFiles.delete(oldPath);
        this.indexedFiles.add(file.path);
        // ERROR: there's no information about the previous name :/
        console.log("renameFile", `${oldPath} -> ${file.path}`);
        // NOTE: This would ideally only update the metadata of the file;
        // otherwise, it's a delete and create
    }

    deleteFile = (file: TAbstractFile) => {
        this.indexedFiles.delete(file.path);
        console.log("deleteFile", `${file.path}`);
    }

    // async search(query) {
    //     return Array.from(this.indexedFiles).filter(file => file.basename.toLowerCase().includes(query.toLowerCase()));
    // }
}

import { View, WorkspaceLeaf } from 'obsidian';
import SemanticSearch from './SemanticSearch.svelte';

export class SemanticSearchView extends View {
    static VIEW_TYPE = 'expert-potato-semantic-search-view';

    private component: SemanticSearch;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType(): string {
        return SemanticSearchView.VIEW_TYPE;
    }

    getDisplayText(): string {
        return 'Semantic Search';
    }

    getIcon(): string {
        return 'eye';
    }

    async onOpen() {
        this.component = new SemanticSearch({
            target: this.containerEl,
            props: {
                // TODO: Remember the most recent query
                // TODO: Cache the most recent results
            }
        });
    }

    async onClose() {
        this.component.$destroy();
    }
}
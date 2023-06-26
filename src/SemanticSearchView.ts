import { View } from 'obsidian';
import SemanticSearch from './SemanticSearch.svelte';

export class SemanticSearchView extends View {
    static VIEW_TYPE = 'expert-potato-semantic-search-view';

    private component: SemanticSearch;

    getViewType() {
        return SemanticSearchView.VIEW_TYPE;
    }

    getDisplayText() {
        return 'Semantic Search';
    }

    getIcon() {
        return 'eye';
    }

    async onOpen() {
        this.component = new SemanticSearch({
            target: this.containerEl,
            props: {
                // TODO: Currently using a workaround to pass the plugin instance to the component; check again when Svelte 4 is released
                // plugin: this.plugin,
                // TODO: Remember the most recent query
                // TODO: Cache the most recent results
            }
        });
    }

    async onClose() {
        this.component.$destroy();
    }
}
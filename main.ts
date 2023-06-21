import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { ExpertPotatoService } from 'src/ExpertPotatoService';
import { SemanticSearchView } from 'src/SemanticSearchView';

interface ExpertPotatoSettings {
	openAiApiKey?: string;
	foundationSessionId?: string;
	foundationHost: string;
}

const DEFAULT_SETTINGS: ExpertPotatoSettings = {
	// TODO: Update `foundationHost` prior to release
	foundationHost: 'localhost:8000'
}

export default class ExpertPotato extends Plugin {
	settings: ExpertPotatoSettings;
	service = new ExpertPotatoService(this.app, this);

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new ExpertPotatoSettingTab(this.app, this));

		this.registerView(
			SemanticSearchView.VIEW_TYPE,
			(leaf) => new SemanticSearchView(leaf)
		)

		if (this.app.workspace.layoutReady) {
			this.addSemanticSearchViewToLeftSidebar();
		} else {
			this.app.workspace.onLayoutReady(() => this.addSemanticSearchViewToLeftSidebar());
		}

		this.service.onload();
	}

	addSemanticSearchViewToLeftSidebar() {
		if (this.app.workspace.getLeavesOfType(SemanticSearchView.VIEW_TYPE).length) {
			return;
		}
		this.app.workspace.getLeftLeaf(false).setViewState({
			type: SemanticSearchView.VIEW_TYPE,
		});
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(SemanticSearchView.VIEW_TYPE);
		this.service.onunload();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class ExpertPotatoSettingTab extends PluginSettingTab {
	plugin: ExpertPotato;

	constructor(app: App, plugin: ExpertPotato) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Configuration'});

		new Setting(containerEl)
			.setName('OpenAI API Key')
			.setDesc(document.createRange().createContextualFragment('Find it at <a href="https://platform.openai.com/account/api-keys">https://platform.openai.com/account/api-keys</a>'))
			.addText(text => text
				.setPlaceholder('sk-...E0Re')
				.setValue(this.plugin.settings.openAiApiKey || '')
				.onChange(async (value) => {
					if (value.length > 0) {
						this.plugin.settings.openAiApiKey = value;
					} else {
						delete this.plugin.settings.openAiApiKey;
					}
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Foundation Session ID')
			.setDesc(document.createRange().createContextualFragment('EVENTUALLY: Find it at <a href="">https://foundation.nimblenexus.com/account/api-keys</a>'))
			.addText(text => text
				.setPlaceholder('0a1b...8e9f')
				.setValue(this.plugin.settings.foundationSessionId || '')
				.onChange(async (value) => {
					if (value.length > 0) {
						this.plugin.settings.foundationSessionId = value;
					} else {
						delete this.plugin.settings.foundationSessionId;
					}
					await this.plugin.saveSettings();
				}));

		// NOTE: `foundationHost` is not editable directly by the user, though it may be changed in the settings file
	}
}

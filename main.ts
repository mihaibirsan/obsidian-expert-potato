import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface ExpertPotatoSettings {
	openAiApiKey?: string;
}

const DEFAULT_SETTINGS: ExpertPotatoSettings = {
}

export default class ExpertPotato extends Plugin {
	settings: ExpertPotatoSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new ExpertPotatoSettingTab(this.app, this));
	}

	onunload() {

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
	}
}

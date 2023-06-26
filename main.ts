import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { ChatFileView } from 'src/ChatFileView';
import { ExpertPotatoService } from 'src/ExpertPotatoService';
import { SemanticSearchView } from 'src/SemanticSearchView';
import { plugin } from 'src/stores';

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

		this.registerView(
			ChatFileView.VIEW_TYPE,
			(leaf) => new ChatFileView(leaf)
		)
		this.registerExtensions(["chat"], ChatFileView.VIEW_TYPE);

		if (this.app.workspace.layoutReady) {
			this.addSemanticSearchViewToLeftSidebar();
		} else {
			this.app.workspace.onLayoutReady(() => this.addSemanticSearchViewToLeftSidebar());
		}

		const createNewChatFile = async () => {
				const newFile = await this.app.vault.create('Untitled.chat', `{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hello!"
    },
    {
      "role": "assistant",
      "content": "Hello there, how may I assist you today?"
    }
  ]
}`);
				await this.app.workspace.openLinkText('', newFile.path, true);
			}

		this.addCommand({
			id: 'create-new-chat-file',
			name: 'Create New Chat File',
			icon: 'message-square-plus',
			callback: createNewChatFile,
		});

		this.addRibbonIcon('message-square-plus', 'Create New Chat File', createNewChatFile);

		this.service.onload();
		plugin.set(this);
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
		plugin.set(null);
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

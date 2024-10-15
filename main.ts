import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	parseFrontMatterAliases,
	FrontMatterCache, TFile, CachedMetadata
} from 'obsidian';

// Remember to rename these classes and interfaces!

interface SuperAliasSettings {
	keys: string;
}

const DEFAULT_SETTINGS: SuperAliasSettings = {
	keys: 'title'
}


export default class SuperAliasPlugin extends Plugin {
	settings: SuperAliasSettings;

	async onload() {
		await this.loadSettings();

		const injectAliases = (frontmatter: FrontMatterCache) => {
			if (!frontmatter) return;

			let aliases = parseFrontMatterAliases(frontmatter) ?? [];
			const extendKeys = this.settings.keys.split(',');

			extendKeys.forEach(key => {
				const value = frontmatter[key];
				if (value) {
					aliases.push(value);
				}
			});

			// Remove duplicates
			frontmatter.aliases = [...new Set(aliases)];
		};

		const onChangeCallback = (file:TFile,data:string,cache:CachedMetadata) =>
		{
			const frontmatter = cache.frontmatter;
			if (frontmatter) {
				injectAliases(frontmatter)
			}

		}
		this.app.metadataCache.on('changed', onChangeCallback);
		const onResolveCallback = (file:TFile) =>{
			const cache = this.app.metadataCache.getFileCache(file);
			if (cache) {
				const frontmatter = cache.frontmatter;
				if (frontmatter) {
					injectAliases(frontmatter)
				}
			}

		}

		// this.app.parseFrontMatterAliases = parseFrontMatterAliases
		this.app.metadataCache.on('resolve', onResolveCallback);

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SuperAliasTab(this.app, this));

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


class SuperAliasTab extends PluginSettingTab {
	plugin: SuperAliasPlugin;

	constructor(app: App, plugin: SuperAliasPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('keys')
			.setDesc('Enter keys to be aliased, split by comma')
			.addText(text => text
				.setPlaceholder('Enter keys to be aliased, split by comma')
				.setValue(this.plugin.settings.keys)
				.onChange(async (value) => {
					this.plugin.settings.keys = value;
					await this.plugin.saveSettings();
				}));
	}
}

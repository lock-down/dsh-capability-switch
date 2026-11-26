# dsh-capability-switch 1.6.1

The plugin UI now has complete i18n and follows the DSH language setting.

## Added

- The plugin UI supports all eight languages currently offered by DSH: 中文, English, 日本語, Español, Français, Deutsch, Русский, and Português.
- Changing the language in DSH General Settings updates the plugin UI automatically, with no reload.
- Plugin metadata now provides localized titles and descriptions for all eight languages.
- READMEs are provided in all eight languages; release notes are available in Chinese and English.

## Notes

- Skill and MCP lists are not translated. Names, descriptions, content, commands, and URLs are shown in their original language.
- Language changes affect only the plugin UI and metadata; no skill or MCP configuration is modified.

## Install

```bash
dsh plugin --profile desktop add dsh-capability-switch
```

You can also download `dsh-capability-switch-1.6.1.tgz` from a Release and install it as a directory from the DSH **Plugins** page.

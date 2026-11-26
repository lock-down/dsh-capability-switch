# dsh-capability-switch 1.6.1

插件界面新增完整 i18n，跟随 DSH 语言设置。

## 新增

- 插件界面支持 DSH 当前的 8 种语言：中文、English、日本語、Español、Français、Deutsch、Русский、Português。
- 在 DSH 通用设置中切换语言后，插件界面自动更新，无需重新加载。
- 插件元数据为 8 种语言提供本地化标题和说明。
- README 提供 8 种语言版本；Release Note 提供中文和英文版本。

## 说明

- 技能和 MCP 的实际列表不翻译，名称、描述、内容、命令和 URL 按原语言呈现。
- 语言切换只影响插件界面和插件元数据，不修改任何技能或 MCP 配置。

## 安装

```bash
dsh plugin --profile desktop add dsh-capability-switch
```

也可以下载 Release 中的 `dsh-capability-switch-1.6.1.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

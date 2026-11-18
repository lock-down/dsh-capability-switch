# dsh-capability-switch 1.2.0

首个公开版本，MIT 许可。

## 主要功能

- 在 DSH 左侧边栏管理 Skills 和 MCP，不再注册设置页。
- Skills 列表按名称去重，只隐藏全局 `~/.agents/skills`，保留用户级、项目级和内置技能。
- 从 Agent 目录同步 Skills 时创建软链接，支持逐项预览、备份和部分失败报告。
- 删除同步技能只移除 DSH 链接，编辑会写回 Agent 源文件。
- MCP 支持新增、编辑、启停、删除、测试和重新连接。
- 从 Claude Code、Codex、Gemini CLI、OpenCode 和 Cursor 导入 MCP，默认停用并绑定预览内容。
- 独立 `@deepseek-ai/dsh-mcp-client` 实例支持启停和删除。

## 安装

下载附件中的 `dsh-capability-switch-1.2.0.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”，然后选择解压后的目录。

也可以在源码目录执行：

```bash
npm install --ignore-scripts
```

然后在 DSH 中选择该源码目录安装。

## 验证

- 针对 DSH `0.2.2-rc.3` 开发和验证。
- 回归测试覆盖 Skills 同步、来源接管、MCP 导入、独立 MCP 控制和配置备份。
- 已检查管理页颜色全部来自 DSH 主题令牌。

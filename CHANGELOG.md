# 更新记录

## 1.2.1

发布准备版本。

- 声明 `engines.dsh` 兼容范围：`>=0.2.2-rc.3 <0.3.0`。
- Host 路由改用 `connection.requestRejection` 做 DSH 连接鉴权。
- `connection` 缺失或鉴权异常时直接拒绝请求。
- 补充缺失连接、401 拒绝和鉴权异常的回归测试。
- 增加从 GitHub 固定版本安装的说明。

## 1.2.0

首个公开版本。

- 新增 DSH 侧边栏 `技能与MCP` 管理页。
- Skills 列表按名称去重，并优先显示 DSH 条目。
- 技能接管仅隐藏全局 `~/.agents/skills`，保留用户级、项目级和内置技能。
- 从 Agent 目录同步 Skills 时创建软链接，支持逐项预览、备份和部分失败报告。
- 同步技能删除只移除 DSH 链接，编辑会写回 Agent 源文件。
- MCP 支持新增、编辑、启停、删除、测试和重新连接。
- 支持从 Claude Code、Codex、Gemini CLI、OpenCode 和 Cursor 导入 MCP。
- MCP 导入默认停用，绑定预览内容，处理来源变化和同名冲突。
- 独立 `@deepseek-ai/dsh-mcp-client` 实例支持启停和删除。
- 界面改用 DSH 主题令牌和固定侧边栏入口。
- 提供 `capability_manager` 代理工具。
- 使用 MIT 许可证。

## 1.1.x

内部迭代版本。

- 修复 `capability_manager` 输出契约。
- 增加 MCP 列表、应用导入和连接状态。
- 增加 Skills 同步、软链接接管和来源过滤。
- 增加独立 MCP 实例的只读展示，随后补齐启停和删除。
- 增加列表滚动、名称去重、紧凑布局和主题令牌修正。

## 1.0.0

初始内部版本。

- Skills 搜索、新建、编辑、启停和删除。
- MCP 新增、编辑、启停、删除、测试和重新连接。
- 侧边栏和设置页入口。

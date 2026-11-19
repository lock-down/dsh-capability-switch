# DSH 技能与 MCP 管理

一个 DSH 侧边栏插件，用来管理本机的 Skills 和 MCP。界面使用 DSH 主题令牌，不嵌入 iframe，入口固定为 `技能与MCP`。

它在 Host 层接管 DSH 的技能扫描结果，默认不把 `~/.agents/skills` 全量加载到系统技能目录。只有你明确同步的技能才会进入 DSH，让 DSH 的技能列表保持干净、可控。

![Skills 管理界面](docs/screenshots/overview.png)

## 接管 DSH 技能加载

DSH 默认会把全局 Agent 目录作为技能来源。插件在 `ctx.skills` 服务层接管 `list`、`snapshot` 和 `get`：

- 全局 `~/.agents/skills` 不进入模型技能目录。
- 全局 Agent 技能不会在会话里被动加载。
- 不删除、不移动、不修改 Agent 源文件。
- 全局 Agent 目录只出现在同步预览中。

同步是显式的：

1. 打开“从 Agent 目录同步”。
2. 选择软链接或复制。
3. 勾选需要的技能。
4. 确认后只同步选中的技能到 `~/.dsh/skills`。

因此不会出现“`~/.agents/skills` 里有什么，DSH 就强制加载什么”的情况。DSH 最终只看到你选中的技能。

接管对所有 Agent 模式生效，包括 PTC、standard、minimal 和 cordis。

### 保留正常加载的来源

以下来源仍会正常扫描和加载：

- 用户级 `~/.dsh/skills`
- 项目级 `$WORKSPACE/.dsh/skills`
- 项目级 `$WORKSPACE/.agents/skills`
- DSH 内置技能
- 其他 `custom` 和 `runtime` 来源

只有全局 `~/.agents/skills` 被排除。项目级 `.agents/skills` 属于工作区内容，继续参与当前工作区加载。

### 效果

- 技能目录更短，减少无关技能进入上下文。
- 避免 Agent 目录中的实验或临时技能被自动触发。
- 可以按需同步，随时移除，不影响 Agent 原件。
- 需要隔离副本时使用复制模式，修改和删除都不会回写源文件。

## 功能

### Skills

- 搜索、新建、编辑、启停和删除用户级与项目级技能。
- 新建技能时选择用户级或项目级；项目级可选择已有工作区，或输入名称和父目录创建新工作区。
- 项目级技能写入所选工作区的 `.agents/skills`。
- 主列表显示用户级、当前工作区和所有已注册工作区的项目技能；全局 Agent 源仅出现在同步预览中。
- 其他已注册工作区的 `.agents` 项目技能也可编辑、启停和删除，标题旁提示会说明修改影响范围。
- 当前工作区与用户级技能按名称去重；不同工作区的同名技能分别展示，并带工作区徽标。
- 删除本地新建的真实技能时移入回收目录。
- 从 `~/.agents/skills` 同步到 `~/.dsh/skills`，默认使用软链接，也可选择复制。
- 软链接模式不复制文件，Agent 内容变化会直接反映到 DSH。
- 复制模式生成独立副本，编辑和删除不会修改 Agent 源文件，更新后会重新复制。
- 同步前逐项预览，可选择同步方式和要处理的技能。
- 已有正确目标会跳过；不同链接、真实目录或旧副本会先备份，再替换。
- 删除软链接同步技能时只移除 DSH 链接；删除复制同步技能时只移除 DSH 副本。

### 项目级技能

项目级技能按当前会话工作区扫描，不使用 DSH profile 目录：

```text
$WORKSPACE/.dsh/skills
$WORKSPACE/.agents/skills
```

`$WORKSPACE` 是当前会话绑定的工作区路径。例如在工作区 `/Users/<user>/Documents/Personal` 中打开会话时，插件读取：

```text
/Users/<user>/Documents/Personal/.dsh/skills
/Users/<user>/Documents/Personal/.agents/skills
```

项目级技能由 DSH 的文件系统技能 provider 加载。插件负责统一展示和管理，不复制文件。

`default`、`desktop` 等名称是 DSH profile，只决定插件配置和 MCP 配置所在位置，不决定项目级技能目录。Skills 页脚显示用户级技能目录，MCP 页不显示目录信息。

项目技能支持新建、编辑、启停和删除。新建时可绑定已有工作区，或创建并注册新工作区；新工作区默认放在 `~/Documents` 下，也可以在弹窗中修改父目录。

所有已注册工作区的 `.agents` 项目技能都会扫描并显示，可以直接编辑、启停或删除。跨工作区操作时，标题旁信息图标、编辑弹窗和删除确认会说明受影响的工作区、后续会话读取行为，以及正在运行的会话可能需要重新加载。

项目级 `.dsh/skills` 由 DSH 管理，插件只展示。全局 `~/.agents/skills` 始终只读。

### MCP

- 新增、编辑、启停、删除、连接测试和重新连接。
- 管理 MCP Manager 中的配置，也能显示直接挂载的独立 `@deepseek-ai/dsh-mcp-client` 实例。
- 独立实例可直接编辑连接参数、启停和删除。删除前会备份 profile 补丁，再移除对应配置行。
- 连接类型支持 `stdio` 和 `SSE / Streamable HTTP`。SSE 配置统一由 DSH 的 Streamable HTTP 传输承载。
- 编辑支持表单和 JSON 两种方式。JSON 接受 `mcpServers` 包装对象或单个服务器配置；新建时可一次保存多个服务器，编辑时只能保存一个。
- JSON 中的 `type: "sse"` 或 `transport: "sse"` 会映射为 DSH 的 `streamable-http`。
- 从 Claude Code、Codex、Gemini CLI、OpenCode 和 Cursor 导入用户级 MCP 配置。
- 导入前显示预览和来源。默认不勾选，默认导入为停用。
- 预览后来源变化会拒绝导入，避免执行未经确认的命令。
- 同名现有条目会跳过；同名但配置不同时按来源分开显示。

![MCP 管理界面](docs/screenshots/mcp.png)

## 安装

当前版本针对 DSH `0.2.2-rc.5` 开发和验证。DSH 的其他版本可能调整服务接口。

从 npm 安装，支持自动更新：

```bash
dsh plugin --profile desktop add dsh-capability-switch
```

从源码安装（本地目录安装不会自动更新）：

```bash
git clone https://github.com/lock-down/dsh-capability-switch.git
cd dsh-capability-switch
npm install --ignore-scripts
```

在 DSH 中打开“插件”，选择“添加插件”，然后选择这个目录。安装完成后，左侧边栏会出现 `技能与MCP`。

也可以下载 GitHub Release 中的 `dsh-capability-switch-1.5.4.tgz`，解压后按上面的目录方式安装。

从 GitHub 固定版本安装（Git 安装不会自动更新）：

```bash
dsh plugin --profile desktop add "git+https://github.com/lock-down/dsh-capability-switch.git#v1.5.4"
```

## 自动更新

通过 npm 安装的插件会自动检查并更新到兼容的稳定版本：

- 启动约 45 秒后检查一次，之后每 6 小时检查一次。
- 只更新 npm registry 安装的 `dsh-capability-switch`。
- 本地目录链接和 Git 固定提交安装不会自我替换。
- 只选择 `bundle: true`、未弃用、非预发布且兼容当前 DSH 的版本。
- 更新通过 DSH 的 `pluginManager.updateBundle` 完成。
- 有 HMR 时安装后自动加载；没有 HMR 时提示重启 DSH。
- 自动更新不会修改 Skills、MCP、工作区或同步状态。

顶部显示当前版本、自动更新开关和“检查更新”。发现新版本时，状态条会同时显示最新版本号和当前版本号，并提供“更新到该版本”按钮；没有可用更新时，手动检查会明确显示“当前已是最新版本”和当前版本号。更新检查只刷新更新状态，不会重新加载或禁用 Skills、MCP 列表。关闭自动更新后仍可手动检查和安装。设置保存在 `~/.dsh/capability-switch/update-preferences.json`。

`1.5.0` 是首个带自动更新机制的版本；`1.4.9` 及更早版本需要手动安装一次 `1.5.0`，之后的新版本才会自动更新。

更新检查会访问 npm registry 读取版本列表；不会上传本机 Skills 或 MCP 配置。

## 使用

### 同步 Skills

1. 打开 `技能与MCP` 的 Skills 标签。
2. 点击“从 Agent 目录同步”。
3. 选择同步方式：
   - 只用软链接：Windows 需要开启开发者模式。
   - 只用复制：占用更多空间，更新后会重新复制。
4. 检查来源、目标、备份目录和变更列表。
5. 勾选要同步的技能，然后点击“确认同步”。

软链接模式会创建指向 Agent 来源的 DSH 软链接。Agent 中的内容变化会直接反映到 DSH，不需要再次同步。编辑同步技能会通过软链接写回 Agent 源文件。

复制模式会把技能目录或文件复制到 DSH，生成独立副本。编辑或删除只影响 DSH 副本，不会修改 Agent 源文件；复制模式占用更多磁盘空间。

复制同步会记录源和副本的基线指纹。再次同步时：

- 只有源变化：标记“更新副本”。
- 只有 DSH 副本变化：标记“本地已修改”，默认不勾选。
- 源和副本都变化：标记“来源与副本均已变化”，默认不勾选。
- 内容和基线一致：跳过。

覆盖本地副本前会先备份。

同步前如果 DSH 中已有真实目录或不同内容，插件会把它移到 `~/.dsh/capability-switch/skill-sync-backups`，再替换为目标模式。

### 导入 MCP

1. 切到 MCP 标签，点击“从应用导入”。
2. 选择要读取的条目。
3. 按需要勾选“导入后立即启用”。默认导入为停用，stdio MCP 不会启动本机命令。
4. 点击“导入选中项”。

导入只读取其他应用的用户级配置，不改写来源文件。

## 数据与权限

插件只访问本机文件：

- `~/.dsh/skills`
- `~/.agents/skills`
- `~/.dsh/capability-switch/backups`
- `~/.dsh/capability-switch/trash`
- `~/.dsh/capability-switch/skill-sync-backups`
- `~/.dsh/capability-switch/skill-sync-state.json`
- `~/.dsh/capability-switch/update-preferences.json`
- 当前 DSH profile 的 `cordis.patch.yml`

删除独立 MCP 前，原 profile 补丁会备份到 `~/.dsh/capability-switch/backups`。

插件不上传技能、MCP 配置或凭据。自动更新只访问 npm registry 读取版本列表并安装插件包；MCP 连接由 DSH 的 MCP Manager 和对应 MCP 服务处理。

## 开发

```bash
npm install --ignore-scripts
npm test
npm pack
```

回归测试覆盖：

- Skills 新建、编辑、启停、删除和软链接同步
- 复制同步、内容一致跳过、更新重复制和副本删除
- 同名技能去重与技能来源接管
- 全局 Agent 目录排除、会话目录不被全量加载
- 项目级、用户级、内置和全局 Agent 来源
- 所有已注册工作区的项目技能扫描与跨工作区编辑
- 已注册工作区鉴权，拒绝未注册路径
- MCP 导入预览、冲突处理和默认停用
- 独立 MCP 编辑、只读权限、启停、补丁删除和备份
- SSE 映射、表单与 JSON 编辑
- Host 路由、代理工具和无损 JSON 输出
- npm registry 更新检查、稳定版本筛选、无更新状态和本地安装拒绝自动更新
- 更新操作与 Skills、MCP 列表状态及 busy 状态隔离

主要文件：

- `lib/index.js`：Host 入口、HTTP 路由和 `capability_manager` 工具
- `lib/client.js`：侧边栏界面
- `lib/skills.js`：Skills 管理和同步
- `lib/mcp.js`：MCP 管理和独立实例操作
- `lib/update.js`：npm 自动更新检查、下载和 DSH 插件管理器更新
- `lib/imports.js`：其他应用的 MCP 配置读取

## 许可证

[MIT](LICENSE)

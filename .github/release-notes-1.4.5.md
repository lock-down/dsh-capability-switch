# dsh-capability-switch 1.4.5

按代码审查结论修复权限、数据一致性和可靠性问题。

## 修复

- 项目技能编辑、启停、删除改为绑定当前会话工作区。
- 代理工具使用当前 Agent 工作目录，不再信任请求中的任意 cwd。
- 独立 MCP 的编辑和删除遵守插件只读标记。
- 同名 Manager 与独立 MCP 优先编辑 Manager，避免改错目标。
- 单个工作区扫描失败不再阻断整个 Skills 页面，并显示工作区警告。
- 跨工作区扫描并行执行。
- 当前可写的项目技能显示“项目”，只读技能显示“项目只读”。
- 表单切换到 JSON 时，非法环境变量或请求头会报错而不是静默清空。
- 独立 MCP 的 JSON 不再输出无效的 enabled 字段。
- 只读技能说明补全无障碍关联。
- README 更新去重规则和回归测试覆盖。

## 已知限制

- JSON 每次保存一个 MCP 服务器；多服务器 JSON 需要拆分保存。
- 新建项目技能可以选择已注册工作区，但编辑和删除仍限定当前会话工作区。

## 安装

```bash
dsh plugin --profile desktop add "git+https://github.com/lock-down/dsh-capability-switch.git#v1.4.5"
```

也可以下载 Release 中的 `dsh-capability-switch-1.4.5.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

## 市场来源

本版本可用于 Open Plugin Market 的固定 GitHub 提交收录。提交时使用标签 `v1.4.5` 指向的完整提交 SHA。

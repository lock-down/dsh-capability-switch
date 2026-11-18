# dsh-capability-switch 1.2.8

明确项目级技能来自当前工作区。

## 变更

- 状态接口返回当前会话工作区路径。
- 插件页脚同时显示当前工作区、profile 和 DSH 目录。
- README 写明项目级技能扫描 `$WORKSPACE/.dsh/skills` 和 `$WORKSPACE/.agents/skills`。
- 说明 profile 只决定插件和 MCP 配置，不决定项目技能目录。

## 安装

```bash
dsh plugin --profile desktop add "git+https://github.com/lock-down/dsh-capability-switch.git#v1.2.8"
```

也可以下载 Release 中的 `dsh-capability-switch-1.2.8.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

## 市场来源

本版本可用于 Open Plugin Market 的固定 GitHub 提交收录。提交时使用标签 `v1.2.8` 指向的完整提交 SHA。

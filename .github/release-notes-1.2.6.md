# dsh-capability-switch 1.2.6

移除主列表中的 Agent 源条目。

## 修复

- `~/.agents/skills` 只用于同步预览，不再显示在 Skills 主列表。
- 删除 DSH 同步技能后，主列表立即消失。
- 避免把 Agent 源条目误认为未删除的同步技能。
- 项目级和 DSH 用户级技能继续显示。
- 保留 1.2.5 的技能目录缓存即时失效。

## 安装

```bash
dsh plugin --profile desktop add "git+https://github.com/lock-down/dsh-capability-switch.git#v1.2.6"
```

也可以下载 Release 中的 `dsh-capability-switch-1.2.6.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

## 市场来源

本版本可用于 Open Plugin Market 的固定 GitHub 提交收录。提交时使用标签 `v1.2.6` 指向的完整提交 SHA。

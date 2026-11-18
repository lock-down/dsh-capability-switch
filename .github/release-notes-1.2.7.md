# dsh-capability-switch 1.2.7

清理客户端技能菜单缓存。

## 修复

- 技能变更后同时发出 `plugin-manager/changed` 事件。
- 输入框的 `/` 技能菜单会立即丢弃旧目录。
- 删除的技能不再出现在斜杠命令候选中。
- 新同步技能无需重启即可出现在命令菜单。
- 保留服务端技能目录缓存即时失效。

## 安装

```bash
dsh plugin --profile desktop add "git+https://github.com/lock-down/dsh-capability-switch.git#v1.2.7"
```

也可以下载 Release 中的 `dsh-capability-switch-1.2.7.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

## 市场来源

本版本可用于 Open Plugin Market 的固定 GitHub 提交收录。提交时使用标签 `v1.2.7` 指向的完整提交 SHA。

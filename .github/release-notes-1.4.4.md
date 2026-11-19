# dsh-capability-switch 1.4.4

展示所有工作区的项目技能。

## 新增

- 扫描所有已注册工作区的 `.dsh/skills` 和 `.agents/skills`。
- 其他工作区的项目技能以只读行展示，不能启停、编辑或删除。
- 技能标题旁新增信息图标和悬浮说明。
- 搜索结果包含工作区名称和路径。
- 当前工作区技能保持可管理。

## 安装

```bash
dsh plugin --profile desktop add "git+https://github.com/lock-down/dsh-capability-switch.git#v1.4.4"
```

也可以下载 Release 中的 `dsh-capability-switch-1.4.4.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

## 市场来源

本版本可用于 Open Plugin Market 的固定 GitHub 提交收录。提交时使用标签 `v1.4.4` 指向的完整提交 SHA。

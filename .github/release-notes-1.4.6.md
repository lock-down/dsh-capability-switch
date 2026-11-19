# dsh-capability-switch 1.4.6

支持跨工作区修改项目技能。

## 变更

- 所有已注册工作区的 `.agents` 项目技能改为可编辑、可启停、可删除。
- 操作仍校验目标必须是已注册工作区，拒绝未注册路径。
- 跨工作区技能标题旁显示“修改影响范围”提示。
- 编辑弹窗和删除确认显示受影响工作区及会话影响。
- 项目 `.dsh/skills` 仍由 DSH 管理，只读展示。
- README 更新去重、影响范围与测试说明。

## 影响提示

跨工作区修改会直接写入目标工作区的 `.agents/skills`：

- 该工作区后续会话会读取新内容。
- 正在运行的会话可能需要重新加载或重新打开。
- 删除会影响该工作区后续使用该技能的会话。

## 安装

```bash
dsh plugin --profile desktop add "git+https://github.com/lock-down/dsh-capability-switch.git#v1.4.6"
```

也可以下载 Release 中的 `dsh-capability-switch-1.4.6.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

## 市场来源

本版本可用于 Open Plugin Market 的固定 GitHub 提交收录。提交时使用标签 `v1.4.6` 指向的完整提交 SHA。

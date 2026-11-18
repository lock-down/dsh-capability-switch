# dsh-capability-switch 1.3.0

明确项目级技能使用当前工作区的 `.agents/skills`。

## 变更

- 项目技能按当前会话工作区扫描 `$WORKSPACE/.dsh/skills` 和 `$WORKSPACE/.agents/skills`。
- 新建技能可选择用户级或项目级；项目级写入当前工作区 `.agents/skills`。
- 当前工作区 `.agents/skills` 支持新建、编辑、启停和删除。
- 项目级 `.dsh/skills` 只展示；全局 Agent 源始终只读。
- README 明确项目技能目录、profile 和工作区的区别。
- 不扫描工作区根目录的 `skills` 或 `Skills`。

## 示例

工作区 `/Users/<user>/Documents/Personal` 中的：

```text
/Users/<user>/Documents/Personal/.agents/skills/dynamic-diagrams/SKILL.md
```

会以 `dynamic-diagrams` 出现在 DSH 技能目录中。

## 安装

```bash
dsh plugin --profile desktop add "git+https://github.com/lock-down/dsh-capability-switch.git#v1.3.0"
```

也可以下载 Release 中的 `dsh-capability-switch-1.3.0.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

## 市场来源

本版本可用于 Open Plugin Market 的固定 GitHub 提交收录。提交时使用标签 `v1.3.0` 指向的完整提交 SHA。

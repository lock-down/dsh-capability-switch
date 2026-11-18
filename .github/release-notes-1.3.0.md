# dsh-capability-switch 1.3.0

支持工作区根目录的小写 `skills`。

## 新增

- 新增项目技能 provider，扫描 `$WORKSPACE/skills`。
- 项目技能进入模型技能目录，可被当前会话和新会话加载。
- 监听项目技能目录变化，新增、修改或删除后自动失效目录缓存。
- Skills 管理列表显示工作区根目录技能，保持只读。
- 项目技能 provider 只读取当前会话工作区，不扫描其他工作区。

## 示例

工作区 `/Users/<user>/Documents/Personal` 中的：

```text
/Users/<user>/Documents/Personal/skills/dynamic-diagrams/SKILL.md
```

会以 `dynamic-diagrams` 出现在 DSH 技能目录中。

## 安装

```bash
dsh plugin --profile desktop add "git+https://github.com/lock-down/dsh-capability-switch.git#v1.3.0"
```

也可以下载 Release 中的 `dsh-capability-switch-1.3.0.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

## 市场来源

本版本可用于 Open Plugin Market 的固定 GitHub 提交收录。提交时使用标签 `v1.3.0` 指向的完整提交 SHA。

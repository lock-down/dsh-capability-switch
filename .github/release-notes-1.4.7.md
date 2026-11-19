# dsh-capability-switch 1.4.7

Skills 同步新增复制模式。

## 新增

- 默认仍使用软链接，保持现有行为。
- 同步弹窗新增“只用软链接 / 只用复制”选择。
- 复制模式复制完整技能目录或文件，生成独立 DSH 副本。
- 复制模式下编辑、删除只影响 DSH 副本。
- 来源变化后再次复制会更新副本，并先备份旧内容。
- 复制模式内容一致时跳过。
- 增加 Windows 开发者模式提示和复制空间提示。
- 代理工具 `skill_sync` 支持 `mode` 参数。

## 模式说明

### 只用软链接

- Windows 需要开启开发者模式。
- 不占用额外技能内容空间。
- Agent 源内容变化会直接反映到 DSH。
- 编辑同步技能会写回 Agent 源文件。

### 只用复制

- 占用更多磁盘空间。
- 更新后会重新复制。
- 编辑或删除只影响 DSH 副本，不会修改 Agent 源文件。
- 适合需要隔离源文件和 DSH 内容的场景。

## 安装

```bash
dsh plugin --profile desktop add "git+https://github.com/lock-down/dsh-capability-switch.git#v1.4.7"
```

也可以下载 Release 中的 `dsh-capability-switch-1.4.7.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

## 市场来源

本版本可用于 Open Plugin Market 的固定 GitHub 提交收录。提交时使用标签 `v1.4.7` 指向的完整提交 SHA。

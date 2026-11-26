# dsh-capability-switch 1.6.0

新增同步模式、批量删除、ZIP 技能包导入和 Release 说明。

## 新增

- 已同步技能显示“软链”或“复制”模式。
- Skills 支持勾选、全选/清空和批量删除，逐项反馈成功与失败。
- 新建技能支持拖拽或选择 `.zip` 技能包，保留 `SKILL.md` 和附属文件。
- 顶部“版本说明”显示最新 GitHub Release 和可折叠的历史版本，支持刷新与失败重试。

## 调整

- 同步方式文案改为“软链模式 / 复制模式”。
- 新增 UI 全部使用 DSH 主题令牌，保持明暗主题一致。

## 安全

- ZIP 导入限制压缩包 8 MiB、解压后 20 MiB、200 个文件、单文件 2 MiB、`SKILL.md` 1 MiB。
- 拒绝绝对路径、目录穿越、多个 `SKILL.md` 和技能目录之外的文件。
- Release 说明只读取固定的 GitHub 仓库地址，缓存 10 分钟。

## 安装

```bash
dsh plugin --profile desktop add dsh-capability-switch
```

也可以下载 Release 中的 `dsh-capability-switch-1.6.0.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

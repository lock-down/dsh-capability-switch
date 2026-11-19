# dsh-capability-switch 1.4.9

收尾修复审查问题。

## 修复

- 复制同步记录源与副本基线指纹。
- 只有源变化时标记“更新副本”。
- 只有 DSH 副本变化时标记“本地已修改”，默认不勾选。
- 源和副本都变化时标记“来源与副本均已变化”，默认不勾选。
- 复制比较改为流式哈希，并检测循环链接。
- 同步预览逐项隔离错误，单个技能失败不再中断整个列表。
- MCP JSON 新建时支持一次保存多个服务器。
- MCP 标签不再扫描所有工作区，只有 Skills 标签加载跨工作区技能。
- 复制同步状态写入失败会显示提示。
- README 补充本地修改冲突规则和多服务器 JSON 说明。

## 复制同步安全规则

- 覆盖本地副本前会先备份。
- 本地修改和双方变化默认不勾选，需要用户显式选择。
- 未记录基线的旧副本会标记为冲突，不会自动更新。

## 安装

```bash
dsh plugin --profile desktop add "git+https://github.com/lock-down/dsh-capability-switch.git#v1.4.9"
```

也可以下载 Release 中的 `dsh-capability-switch-1.4.9.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

## 市场来源

本版本可用于 Open Plugin Market 的固定 GitHub 提交收录。提交时使用标签 `v1.4.9` 指向的完整提交 SHA。

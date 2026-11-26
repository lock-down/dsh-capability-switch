# dsh-capability-switch 1.6.2

修复 Skills 与 MCP 标签计数不一致。

## 修复

- 切换标签时始终读取完整技能列表，Skills 计数不再因为 MCP 标签按工作区裁剪而减少。
- 语言切换时清除旧语言的操作提示和错误，避免提示语言与界面语言混用。
- 增加计数请求参数和语言切换提示清理的回归检查。

## 安装

```bash
dsh plugin --profile desktop add dsh-capability-switch
```

也可以下载 Release 中的 `dsh-capability-switch-1.6.2.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

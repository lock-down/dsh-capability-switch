# dsh-capability-switch 1.5.2

修复检查更新时页面闪烁。

## 修复内容

- 检查更新、安装更新和修改自动更新设置只更新 `data.update`。
- 不再因为更新操作重新请求整个 `/state`。
- Skills 与 MCP 列表、搜索内容、当前标签和工作区数据保持不变。
- 更新操作使用独立的 `updateBusy`，不再让列表按钮和开关集体禁用后恢复。
- 其他 Skills 和 MCP 操作仍使用原有 `busy` 与刷新逻辑。
- 只有实际安装更新并触发 DSH HMR 时才会重新加载插件。

## 验证

- 客户端、Host、Skills、MCP 和更新器语法检查通过。
- Skills 同步、MCP 管理、Host 路由和自动更新回归测试通过。
- 增加更新操作与列表状态隔离的回归检查。

## 安装

```bash
dsh plugin --profile desktop add dsh-capability-switch
```

也可以下载 Release 中的 `dsh-capability-switch-1.5.2.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

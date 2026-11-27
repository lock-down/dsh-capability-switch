# dsh-capability-switch 1.6.3

MCP 支持批量选择与删除。

## 新增

- MCP 列表增加复选框、全选/清空和批量删除。
- 删除逐项执行，成功与失败分别反馈；运行中的连接会关闭。
- 独立实例删除前会备份 profile 补丁，需要重启 DSH 时给出提示。

## 安装

```bash
dsh plugin --profile desktop add dsh-capability-switch
```

也可以下载 Release 中的 `dsh-capability-switch-1.6.3.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

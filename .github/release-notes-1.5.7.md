# dsh-capability-switch 1.5.7

`workspace_create` 接入会话文件授权和宿主审批。

## 安全修复

- Agent 工具创建并注册工作区前，先按当前会话的 `sandboxPolicy` 检查目标目录：`danger-full-access` 直接创建；`workspace-write` 位于会话工作区或其额外可写目录内直接创建。
- `read-only`、可写范围外或无法解析会话策略时请求宿主审批；未获批准、被取消、无审批服务或无 Agent 时不创建目录，也不注册工作区。
- 目标路径先解析真实路径再比较；符号链接越界按范围外处理。
- 面板中的工作区创建仍由用户直接发起，不重复询问。
- 增加范围内、额外可写目录、范围外、只读、danger-full-access、符号链接越界、无会话策略、无审批服务、无 Agent 和面板直连的回归测试。

## 安装

```bash
dsh plugin --profile desktop add dsh-capability-switch
```

也可以下载 Release 中的 `dsh-capability-switch-1.5.7.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

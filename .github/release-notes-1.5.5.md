# dsh-capability-switch 1.5.5

Agent 工具的 MCP 启动操作接入宿主审批。

## 安全修复

- `capability_manager` 在保存并启动 stdio MCP、启用 stdio MCP、重启、连接测试和导入并启用时，先通过 DSH 的 `ctx.approval` 请求宿主审批。
- 审批被拒绝、被取消、审批服务缺失、没有可路由的 Agent 或当前会话不提供审批提示时，操作直接失败，不写入配置，也不启动进程。
- 审批通过后再次校验 stdio 配置；启用、重启和连接测试期间如果命令发生变化，拒绝执行。
- MCP 启动操作必须显式携带审批函数或面板标记，遗漏审批上下文时失败关闭。
- 只在操作真的会启动本机 stdio 命令时请求审批；HTTP MCP、停用、删除和未启用导入不额外询问。
- 面板中的操作仍由用户直接发起，不重复弹出审批。
- 增加审批通过、拒绝、取消、不可用、缺少审批服务、缺少审批上下文和审批期间配置变化的回归测试，并验证拒绝发生在写入配置之前。
- 测试脚本改用 `fileURLToPath` 定位仓库根目录，并新增 `test/run-windows.ps1` Windows 入口；入口自动查找 Node，也可用 `-NodePath` 指定，可通过 `npm run test:windows` 运行同一套测试，默认 300 秒超时。

## 其他修复

- 修复技能路径校验可被多级软链接绕过的问题；通过软链接只能读写 DSH 用户技能目录或全局 Agent 技能目录内的真实文件。
- 修复 DSH_HOME 与项目工作区不在同一磁盘时，删除项目技能因 EXDEV 失败的问题；跨卷时先复制到回收目录再删除。
- 拒绝 `__proto__`、`constructor`、`prototype` 作为 MCP 名称，避免配置对象原型污染。
- 面板中的 MCP 连接测试失败时优先显示后端返回的错误信息，而不是 `Unknown`。

## 安装

```bash
dsh plugin --profile desktop add dsh-capability-switch
```

也可以下载 Release 中的 `dsh-capability-switch-1.5.5.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

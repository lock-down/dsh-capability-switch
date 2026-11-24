# dsh-capability-switch 1.5.8

兼容 DSH 0.2.3-alpha.2。

## 修复

- DSH 0.2.3-alpha.2 移除了 `connection.requestRejection`；面板接口改由 `webServer.register` 的 `auth: 'required'` 完成鉴权，不再把所有 API 请求判为 403。
- 面板接口不再读取 `connection` 服务，缺少该服务时也不会整页不可用。
- 读取冷会话工作目录时兼容 `SessionObservation` 的同步 `Symbol.dispose`，避免观测租约泄漏。
- `engines.dsh` 更新为 `^0.2.3-alpha.2`，README 同步验证版本。
- 回归测试检查所有面板路由都声明 required 鉴权，并禁止再次使用 `requestRejection`。

## 安装

```bash
dsh plugin --profile desktop add dsh-capability-switch
```

也可以下载 Release 中的 `dsh-capability-switch-1.5.8.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

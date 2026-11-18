# dsh-capability-switch 1.2.4

修复技能目录缓存导致的延迟生效。

## 修复

- 技能创建、编辑、启停、删除和同步完成后主动失效 DSH 技能目录缓存。
- 不再依赖文件 watcher 对软链接新增或删除的事件。
- 新同步的技能在当前会话和新会话立即可用。
- 删除同步技能后会立即从技能目录移除，不需要重启客户端。
- 通过临时 provider 生命周期触发公开缓存失效，不直接调用私有方法。
- 增加代理工具和 UI 路由的缓存失效测试。

## 安装

```bash
dsh plugin --profile desktop add "git+https://github.com/lock-down/dsh-capability-switch.git#v1.2.4"
```

也可以下载 Release 中的 `dsh-capability-switch-1.2.4.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

## 市场来源

本版本可用于 Open Plugin Market 的固定 GitHub 提交收录。提交时使用标签 `v1.2.4` 指向的完整提交 SHA。

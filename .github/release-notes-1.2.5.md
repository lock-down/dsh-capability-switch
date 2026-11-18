# dsh-capability-switch 1.2.5

修正技能缓存失效实现。

## 修复

- 直接使用 DSH 技能注册表的缓存失效方法，避免临时 provider 产生瞬时空目录。
- 旧版本缺少该方法时，继续回退到临时 provider 和公开变更通知。
- 保持技能创建、编辑、启停、删除和同步后的即时刷新。
- 清理临时缓存测试技能。

## 安装

```bash
dsh plugin --profile desktop add "git+https://github.com/lock-down/dsh-capability-switch.git#v1.2.5"
```

也可以下载 Release 中的 `dsh-capability-switch-1.2.5.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

## 市场来源

本版本可用于 Open Plugin Market 的固定 GitHub 提交收录。提交时使用标签 `v1.2.5` 指向的完整提交 SHA。

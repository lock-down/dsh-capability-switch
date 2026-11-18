# dsh-capability-switch 1.2.9

修正 profile 显示。

## 变更

- 从 Config Editor 的 profile 配置路径推导真实 profile 名称。
- 页脚不再把未知 profile 显示为 `default`。
- 项目级技能仍按当前会话工作区扫描。

## 安装

```bash
dsh plugin --profile desktop add "git+https://github.com/lock-down/dsh-capability-switch.git#v1.2.9"
```

也可以下载 Release 中的 `dsh-capability-switch-1.2.9.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

## 市场来源

本版本可用于 Open Plugin Market 的固定 GitHub 提交收录。提交时使用标签 `v1.2.9` 指向的完整提交 SHA。

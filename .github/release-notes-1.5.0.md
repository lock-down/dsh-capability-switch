# dsh-capability-switch 1.5.0

新增 npm 自动更新机制。

## 自动更新

- 启动约 45 秒后检查一次，之后每 6 小时检查。
- 只更新 npm registry 安装的 `dsh-capability-switch`。
- 本地目录链接和 Git 固定提交安装不会自我替换。
- 只选择兼容当前 DSH 的稳定版本，跳过预发布、弃用和不包含 bundle 的版本。
- 通过 DSH `pluginManager.updateBundle` 安装。
- 支持 HMR 热更新；没有 HMR 时提示重启 DSH。
- 自动更新不会修改 Skills、MCP、工作区或同步状态。

## UI

- 顶部显示当前版本。
- 自动更新开关默认开启。
- 支持手动检查更新和立即更新。
- 显示检查中、可更新、更新完成、需要重启和失败状态。
- 自动更新偏好保存在 `~/.dsh/capability-switch/update-preferences.json`。

`1.5.0` 是首个带自动更新机制的版本。`1.4.9` 及更早版本需要手动安装一次 `1.5.0`，之后的新版本才会自动更新。

## 安装

```bash
dsh plugin --profile desktop add dsh-capability-switch
```

也可以下载 Release 中的 `dsh-capability-switch-1.5.0.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。本地目录安装和 Git 固定提交安装不会自动更新。

## 市场来源

本版本可用于 Open Plugin Market 的固定 GitHub 提交收录。提交时使用标签 `v1.5.0` 指向的完整提交 SHA。

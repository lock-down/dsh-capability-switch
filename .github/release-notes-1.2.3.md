# dsh-capability-switch 1.2.3

修复技能删除和技能接管。

## 修复

- 全局 Agent 源目录改为只读。插件界面和代理工具都不能直接删除或编辑 `~/.agents/skills` 中的源技能。
- 删除 DSH 同步技能时只移除软链接，源技能保留。
- 通过 DSH 软链接编辑技能时仍写回 Agent 源文件。
- 修复插件重装后技能接管可能失效的问题。
- 插件显式依赖 `skills` 服务，确保接管在技能注册表就绪后安装。
- 增加 Agent 源技能不可删除的回归测试。

## 恢复

- 已从回收站恢复误删的 `ego-browser` 和 `Kami`。

## 安装

```bash
dsh plugin --profile desktop add "git+https://github.com/lock-down/dsh-capability-switch.git#v1.2.3"
```

也可以下载 Release 中的 `dsh-capability-switch-1.2.3.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

## 市场来源

本版本可用于 Open Plugin Market 的固定 GitHub 提交收录。提交时使用标签 `v1.2.3` 指向的完整提交 SHA。

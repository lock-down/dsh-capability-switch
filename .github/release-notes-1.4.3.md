# dsh-capability-switch 1.4.3

修复 1.4.2 的客户端语法错误。

## 修复

- 修复页脚条件缺少闭括号导致的侧边栏插件消失。
- 测试流程增加客户端与服务端源码语法检查。
- Skills 页显示用户级技能目录，MCP 页不显示。

## 安装

```bash
dsh plugin --profile desktop add "git+https://github.com/lock-down/dsh-capability-switch.git#v1.4.3"
```

也可以下载 Release 中的 `dsh-capability-switch-1.4.3.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

## 市场来源

本版本可用于 Open Plugin Market 的固定 GitHub 提交收录。提交时使用标签 `v1.4.3` 指向的完整提交 SHA。

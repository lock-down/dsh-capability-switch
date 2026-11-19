# dsh-capability-switch 1.5.3

更新插件详情页说明。

## 说明更新

- 明确插件在 Host 层接管 DSH 技能扫描，全局 `~/.agents/skills` 不会进入模型技能目录。
- 明确只有主动选择的技能才会同步到 DSH，避免全量加载 Agent 技能。
- 移除“项目级条目只读”的过时描述，当前支持用户级和所有已注册工作区的项目级技能管理。
- 补充软链接与复制同步方式。
- 补充 MCP Manager 与独立实例的表单/JSON 编辑、启停、连接测试、重新连接和外部导入。
- 同步更新英文说明与 npm 包描述。

## 安装

```bash
dsh plugin --profile desktop add dsh-capability-switch
```

也可以下载 Release 中的 `dsh-capability-switch-1.5.3.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

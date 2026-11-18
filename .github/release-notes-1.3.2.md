# dsh-capability-switch 1.3.2

新建项目级技能时选择工作区。

## 新增

- 项目级新建支持绑定已有工作区。
- 支持输入名称和父目录，创建并注册新工作区。
- 新工作区默认放在 `~/Documents`，支持 `~` 路径。
- 工作区选择使用 DSH 面层、边框、品牌色和分段控件。
- 插件图标改为 DSH 品牌蓝与中性灰，移除高饱和渐变。
- 代理工具新增 `workspace_create`。

## 使用

1. 打开“技能与 MCP”。
2. 点击“新建技能”。
3. 范围选择“项目级”。
4. 选择“已有工作区”，或选择“新建工作区”并填写名称和父目录。
5. 保存后技能写入所选工作区的 `.agents/skills`。

## 安装

```bash
dsh plugin --profile desktop add "git+https://github.com/lock-down/dsh-capability-switch.git#v1.3.2"
```

也可以下载 Release 中的 `dsh-capability-switch-1.3.2.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

## 市场来源

本版本可用于 Open Plugin Market 的固定 GitHub 提交收录。提交时使用标签 `v1.3.2` 指向的完整提交 SHA。

# dsh-capability-switch 1.4.0

MCP 可编辑，并支持 SSE 与 JSON。

## 新增

- 独立 `@deepseek-ai/dsh-mcp-client` 实例可以直接编辑连接参数。
- 编辑弹窗新增“表单 / JSON”切换。
- JSON 支持 `mcpServers` 包装对象和单个服务器配置。
- 表单和 JSON 都接受 SSE 配置，并映射到 DSH 的 `streamable-http` 传输。
- 外部 MCP 导入识别 `sse` 类型。
- MCP 列表中的独立实例显示编辑按钮。

## JSON 示例

```json
{
  "mcpServers": {
    "example": {
      "type": "sse",
      "url": "https://example.com/sse",
      "headers": {
        "Authorization": "Bearer token"
      }
    }
  }
}
```

## 安装

```bash
dsh plugin --profile desktop add "git+https://github.com/lock-down/dsh-capability-switch.git#v1.4.0"
```

也可以下载 Release 中的 `dsh-capability-switch-1.4.0.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

## 市场来源

本版本可用于 Open Plugin Market 的固定 GitHub 提交收录。提交时使用标签 `v1.4.0` 指向的完整提交 SHA。

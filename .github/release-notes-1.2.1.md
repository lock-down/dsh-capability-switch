# dsh-capability-switch 1.2.1

安全与发布准备版本，用于 GitHub 固定提交来源。

## 变更

- Host 路由改用 `connection.requestRejection` 做 DSH 连接鉴权。
- 缺少 `connection` 服务或鉴权过程报错时直接拒绝请求。
- 声明 `engines.dsh` 为 `>=0.2.2-rc.3 <0.3.0`。
- 增加连接鉴权回归测试，覆盖缺失连接、401 拒绝和鉴权异常。
- README 增加 GitHub 固定版本安装方式。

## 安装

```bash
dsh plugin --profile desktop add "git+https://github.com/lock-down/dsh-capability-switch.git#v1.2.1"
```

也可以下载 Release 中的 `dsh-capability-switch-1.2.1.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

## 市场来源

Open Plugin Market 要求 npm 版本或固定到完整 40 位提交的 GitHub 来源。本版本已满足固定提交安装要求，提交收录时使用标签指向的完整提交 SHA。

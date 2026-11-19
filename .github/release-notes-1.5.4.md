# dsh-capability-switch 1.5.4

修复暗黑主题下主按钮文字不可见。

## 修复

- 暗黑主题中 `--dsw-alias-brand-primary` 是浅色，主按钮仍使用固定的白色文字，导致白底白字。
- 主按钮改用 DSH 的主按钮令牌：`--dsw-alias-button-primary-fill` 作背景，`--dsw-alias-label-primary-foreground` 作文字。
- 悬停改用 `--dsw-alias-button-primary-hover`，跟随明暗主题切换。
- 覆盖新建技能、保存、创建、导入、同步和更新到新版本等所有主按钮。
- 增加主按钮配色的回归检查。

## 安装

```bash
dsh plugin --profile desktop add dsh-capability-switch
```

也可以下载 Release 中的 `dsh-capability-switch-1.5.4.tgz`，解压后在 DSH 的“插件”页面选择“添加插件”。

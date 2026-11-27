# dsh-capability-switch 1.6.3

MCP now supports batch selection and deletion.

## Added

- The MCP list adds checkboxes, Select all/Clear, and batch deletion.
- Deletion runs per item and reports successes and failures separately; running connections close.
- Standalone instances back up the profile patch before deletion and report when a DSH restart is required.

## Install

```bash
dsh plugin --profile desktop add dsh-capability-switch
```

You can also download `dsh-capability-switch-1.6.3.tgz` from a Release and install it as a directory from the DSH **Plugins** page.

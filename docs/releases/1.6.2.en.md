# dsh-capability-switch 1.6.2

Fix inconsistent Skills and MCP tab counts.

## Fixes

- Both tabs now load the complete skill list, so the Skills count no longer drops when the MCP tab trims skills by workspace.
- Switching the language clears notices and errors left in the previous language, preventing mixed-language UI.
- Added regression checks for the count request parameter and notice cleanup on language change.

## Install

```bash
dsh plugin --profile desktop add dsh-capability-switch
```

You can also download `dsh-capability-switch-1.6.2.tgz` from a Release and install it as a directory from the DSH **Plugins** page.

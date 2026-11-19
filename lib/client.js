window.__ModuleLoader__.load({
  id: 'dsh-capability-switch',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useCallback, useEffect, useMemo, useState } = React
    const BASE = '/__dsh-capability-switch'
    const PANEL = 'capability-switch'
    const NS = 'capabilitySwitch'
    const MCP_NAME = /^[A-Za-z0-9_-]{1,32}$/
    let activeSessionId = null
    let translate = null

    const MESSAGES = {
      zh: {
        nav: '能力管理', title: 'Skills 与 MCP', subtitle: '集中管理本机技能与当前 DSH 配置中的 MCP 服务。',
        skills: 'Skills', mcp: 'MCP', search: '搜索名称、描述、命令或路径', refresh: '刷新', addSkill: '新建技能', addMcp: '添加 MCP', syncSkills: '从 Agent 目录同步', importMcp: '从应用导入',
        display: '显示设置', enabled: '已启用', disabled: '已停用', edit: '编辑', remove: '删除', test: '测试连接', restart: '重新连接',
        user: '用户级', projectWritable: '项目', projectReadonly: '项目只读', directory: '目录技能', file: '单文件技能', noItems: '没有匹配条目', noSkills: '尚未安装用户级技能', noMcp: '尚未配置 MCP 服务',
        agentSource: 'Agent 目录', dshSource: 'DSH 目录', standalone: '独立实例', registered: '插件注册', runtimeUnmanaged: '由独立插件实例管理', readonly: '只读',
        loading: '正在读取本机配置…', creating: '正在创建…', discardChanges: '有未保存的修改，确定关闭吗？', loadFailed: '读取配置失败', retry: '重试', save: '保存', cancel: '取消', close: '关闭', create: '创建',
        formMode: '表单', jsonMode: 'JSON', jsonHelp: '支持 mcpServers 包装对象或单个服务器配置；新建时可一次保存多个服务器。', jsonOneServer: '编辑时 JSON 只能包含一个 MCP 服务器', jsonNameFixed: '编辑时不能修改 MCP 名称，当前名称为',
        mode: '编辑方式', standaloneEditHint: '独立实例可直接编辑连接参数；启停仍使用开关。', transportHttp: 'SSE / Streamable HTTP', transportHttpHelp: 'DSH 通过 Streamable HTTP 承载 SSE 流。',
        workspaceImpactTitle: '修改影响范围', workspaceImpactHint: '将直接修改 {workspace} 工作区的 .agents/skills 项目技能。该工作区后续会话会读取新内容，正在运行的会话可能需要重新加载。',
        workspaceReadonlyTitle: '只读技能', workspaceReadonlyHint: '{workspace} 的 .dsh/skills 由 DSH 管理，只能查看。',
        workspaceEditImpact: '正在修改 {workspace} 工作区的项目技能；保存后该工作区后续会话会读取新内容。',
        workspaceDeleteImpact: '删除会影响 {workspace} 工作区中后续使用该技能的会话。',
        workspaceScanWarnings: '部分工作区技能读取失败，其他工作区仍可正常使用。',
        name: '名称', description: '描述', body: '正文', content: 'SKILL.md 内容', path: '路径', transport: '连接类型', command: '启动命令',
        args: '参数（每行一个）', cwd: '工作目录（可选）', env: '环境变量（JSON 对象）', url: '服务 URL', headers: '请求头（JSON 对象）',
        enableNow: '保存后立即启用', createSkillTitle: '新建技能', editSkillTitle: '编辑技能', editMcpTitle: '编辑 MCP', addMcpTitle: '添加 MCP',
        scope: '技能范围', userScope: '用户级', projectScope: '项目级', projectScopeHelp: '项目级技能写入所选工作区的 .agents/skills。',
        workspace: '工作区', workspaceHelp: '项目级技能会写入所选工作区的 .agents/skills。',
        existingWorkspace: '已有工作区', newWorkspace: '新建工作区', selectWorkspace: '选择工作区',
        workspaceName: '工作区名称', workspaceParent: '父目录', workspaceParentHelp: '留空时使用 ~/Documents。支持 ~ 路径。',
        newWorkspaceHint: '会创建目录并注册为 DSH 工作区。', workspaceRequired: '请选择或新建一个工作区。', currentWorkspace: '当前会话工作区',
        skillNameHelp: '小写字母、数字、连字符或下划线；创建后作为目录名。', mcpNameHelp: '1–32 位字母、数字、连字符或下划线；编辑时不可改名。',
        deleteSkillTitle: '删除技能', deleteMcpTitle: '删除 MCP', deleteSkillText: '同步技能为软链接时只移除 DSH 链接，Agent 源文件保持不变；本地新建或真实目录会移入 DSH 回收目录。',
        deleteMcpText: '将从当前 DSH profile 的配置中移除此 MCP，运行中的连接也会关闭。', confirmDelete: '确认删除',
        saved: '已保存', created: '已创建', deleted: '已删除并移入回收目录', unlinked: '已移除 DSH 软链接，Agent 源文件未删除', mcpDeleted: '已从当前配置删除', mcpRemovedStandalone: '已删除独立 MCP，插件配置变更已保存', mcpRemovedRestart: '已删除独立 MCP，重启 DSH 后完成卸载', mcpRestartRequired: '已保存，重启 DSH 后生效', updated: '配置已更新',
        testOk: '连接成功，发现 {count} 个工具', testFailed: '连接测试失败：{message}', restarted: '已重新发起连接',
        syncDone: 'Skills 同步完成：新增 {added}，更新 {updated}，跳过 {skipped}，失败 {failed}', syncStateError: '；同步状态保存失败：', importDone: 'MCP 导入完成：新增 {added}，跳过 {skipped}', sourceErrors: '；{count} 个来源读取失败',
        prefsTitle: '自定义显示', sidebarVisible: '在左侧边栏显示入口', sidebarLabel: '入口名称', defaultTab: '默认打开',
        showDescriptions: '显示描述与配置摘要', compactRows: '使用紧凑行距', prefsSaved: '显示偏好已保存到 DSH 配置',
        preferencesHint: '这些偏好保存在当前 DSH profile 中，重启后仍会保留。设置页始终保留，便于恢复侧边栏入口。',
        autoUpdate: '自动更新', autoUpdateHint: '仅 npm 安装支持自动更新；会检查兼容的稳定版本并通过 DSH 插件管理器安装。', checkUpdate: '检查更新',
        updateAvailable: '发现新版本 {version}', updateNow: '更新', updatingVersion: '正在更新到 {version}…', updateCurrent: '已是最新版本', updateUnsupported: '当前安装方式不自动更新', updateFailed: '更新失败：', updateRestart: '已安装 {version}，重启 DSH 后生效', updateDone: '已更新到 {version}', updateAutoSaved: '自动更新设置已保存',
        userSkillsDir: '用户级技能目录', readonlyHint: '用户级和所有已注册工作区的 .agents 项目技能支持编辑、启停和删除；跨工作区修改会提示影响范围。',
        connected: '已连接', connecting: '连接中', reconnecting: '等待重连', failed: '连接失败', waiting: '等待凭据', closed: '已关闭',
        unknownStatus: '未知状态', toolCount: '{count} 个工具', invalidJson: 'JSON 格式不正确', empty: '暂无描述',
        importTitle: '从应用导入 MCP', importHelp: '只读扫描其他应用的用户级配置。请手动选择条目；默认导入为停用，不修改来源文件。预览后配置变化会拒绝导入。',
        noImports: '没有发现可导入的 MCP', existing: '已存在', importAction: '导入选中项', scanFailed: '扫描失败', conflict: '配置冲突',
        enableImports: '导入后立即启用', importEnableHint: '启用 stdio MCP 会启动对应的本机命令，请确认来源和命令可信。',
        syncTitle: '从 Agent 目录同步 Skills', syncHelp: '选择同步方式后，从 Agent 目录同步到 DSH。已有目标会先备份，再替换；Agent 来源目录保持不变。',
        syncMode: '同步方式', symlinkMode: '只用软链接', symlinkHelp: 'Windows 需要开启开发者模式',
        copyMode: '只用复制', copyHelp: '占用更多空间，更新后会重新复制',
        copyImpact: '复制模式下编辑或删除只影响 DSH 副本，不会修改 Agent 源文件。',
        syncAction: '确认同步', newItem: '建立链接', updateItem: '更新链接', newCopy: '复制', updateCopy: '更新副本', localEditItem: '本地已修改', conflictItem: '来源与副本均已变化', errorItem: '读取失败', localEditHint: 'DSH 副本在上次同步后被修改；同步会先备份再覆盖。', conflictHint: '来源和 DSH 副本都变化了；请确认是否覆盖本地副本。', unchangedItem: '链接正常', noChanges: '没有需要同步的变更', backupLocation: '备份目录', partialFailure: '部分条目失败',
        selectAll: '全选', clearAll: '全不选', selectedCount: '已选 {count} 项', takeoverHint: '技能接管已启用（所有模式）：仅隐藏全局 Agent 目录；DSH 用户技能和项目级技能仍会扫描加载。全局 Agent 目录仅用于同步。',
        standaloneHint: '独立 MCP 可在本插件中编辑连接参数、启停或删除。', registeredHint: '由其他 DSH 插件动态注册。',
      },
      en: {
        nav: 'Capabilities', title: 'Skills & MCP', subtitle: 'Manage local skills and MCP servers in the active DSH profile.',
        skills: 'Skills', mcp: 'MCP', search: 'Search names, descriptions, commands, or paths', refresh: 'Refresh', addSkill: 'New skill', addMcp: 'Add MCP', syncSkills: 'Sync from Agent directory', importMcp: 'Import from apps',
        display: 'Display settings', enabled: 'Enabled', disabled: 'Disabled', edit: 'Edit', remove: 'Delete', test: 'Test connection', restart: 'Reconnect',
        user: 'User', projectWritable: 'Project', projectReadonly: 'Project read-only', directory: 'Directory', file: 'Single file', noItems: 'No matching entries', noSkills: 'No user skills installed', noMcp: 'No MCP servers configured',
        agentSource: 'Agent directory', dshSource: 'DSH directory', standalone: 'Standalone', registered: 'Plugin registered', runtimeUnmanaged: 'Managed by a standalone plugin instance', readonly: 'Read-only',
        loading: 'Reading local configuration…', creating: 'Creating…', discardChanges: 'Discard unsaved changes and close?', loadFailed: 'Could not read configuration', retry: 'Retry', save: 'Save', cancel: 'Cancel', close: 'Close', create: 'Create',
        formMode: 'Form', jsonMode: 'JSON', jsonHelp: 'Accepts an mcpServers wrapper or a single server object; new JSON can create multiple servers at once.', jsonOneServer: 'Editing accepts exactly one MCP server in JSON', jsonNameFixed: 'The MCP name cannot change while editing; current name:',
        mode: 'Editor', standaloneEditHint: 'Standalone connection settings are editable here; use the toggle for enablement.', transportHttp: 'SSE / Streamable HTTP', transportHttpHelp: 'DSH carries SSE streams over Streamable HTTP.',
        workspaceImpactTitle: 'Impact of this change', workspaceImpactHint: 'This directly changes project skills in {workspace}/.agents/skills. Later sessions in that workspace will read the new content; running sessions may need to reload.',
        workspaceReadonlyTitle: 'Read-only skill', workspaceReadonlyHint: '{workspace}/.dsh/skills is managed by DSH and is view-only.',
        workspaceEditImpact: 'You are editing a project skill in {workspace}; later sessions in that workspace will read the new content.',
        workspaceDeleteImpact: 'Deleting this affects later sessions in {workspace} that use the skill.',
        workspaceScanWarnings: 'Some workspace skill directories could not be read; other workspaces remain available.',
        name: 'Name', description: 'Description', body: 'Body', content: 'SKILL.md content', path: 'Path', transport: 'Transport', command: 'Command',
        args: 'Arguments (one per line)', cwd: 'Working directory (optional)', env: 'Environment (JSON object)', url: 'Server URL', headers: 'Headers (JSON object)',
        enableNow: 'Enable after saving', createSkillTitle: 'New skill', editSkillTitle: 'Edit skill', editMcpTitle: 'Edit MCP', addMcpTitle: 'Add MCP',
        scope: 'Skill scope', userScope: 'User', projectScope: 'Project', projectScopeHelp: 'Project skills are written to .agents/skills in the selected workspace.',
        workspace: 'Workspace', workspaceHelp: 'Project skills are written to .agents/skills in the selected workspace.',
        existingWorkspace: 'Existing workspace', newWorkspace: 'New workspace', selectWorkspace: 'Select workspace',
        workspaceName: 'Workspace name', workspaceParent: 'Parent directory', workspaceParentHelp: 'Defaults to ~/Documents. ~ paths are supported.',
        newWorkspaceHint: 'The directory is created and registered as a DSH workspace.', workspaceRequired: 'Select or create a workspace.', currentWorkspace: 'Current session workspace',
        skillNameHelp: 'Lowercase letters, numbers, hyphens, or underscores; used as the directory name.', mcpNameHelp: '1–32 letters, numbers, hyphens, or underscores; immutable while editing.',
        deleteSkillTitle: 'Delete skill', deleteMcpTitle: 'Delete MCP', deleteSkillText: 'Deleting a synced skill removes only the DSH symlink and keeps the Agent source. Locally created skills or real directories move to the DSH trash directory.',
        deleteMcpText: 'This removes the MCP from the active DSH profile and closes its running connection.', confirmDelete: 'Delete',
        saved: 'Saved', created: 'Created', deleted: 'Moved to the trash directory', unlinked: 'Removed the DSH symlink; the Agent source was not deleted', mcpDeleted: 'Removed from the active configuration', mcpRemovedStandalone: 'Standalone MCP deleted; the plugin configuration change was saved', mcpRemovedRestart: 'Standalone MCP deleted; restart DSH to finish unloading it', mcpRestartRequired: 'Saved; restart DSH to apply', updated: 'Configuration updated',
        testOk: 'Connected; found {count} tools', testFailed: 'Connection test failed: {message}', restarted: 'Reconnection started',
        syncDone: 'Skills synchronized: {added} added, {updated} updated, {skipped} unchanged, {failed} failed', syncStateError: '; sync state could not be saved: ', importDone: 'MCP import complete: {added} added, {skipped} skipped', sourceErrors: '; {count} sources could not be read',
        prefsTitle: 'Customize display', sidebarVisible: 'Show an entry in the left sidebar', sidebarLabel: 'Entry label', defaultTab: 'Open by default',
        showDescriptions: 'Show descriptions and configuration summaries', compactRows: 'Use compact rows', prefsSaved: 'Display preferences saved to the DSH configuration',
        preferencesHint: 'Preferences persist in the active DSH profile. The Settings page always remains available so you can restore the sidebar entry.',
        autoUpdate: 'Auto update', autoUpdateHint: 'Only npm installs auto-update; compatible stable releases are installed through the DSH plugin manager.', checkUpdate: 'Check for updates',
        updateAvailable: 'Version {version} is available', updateNow: 'Update', updatingVersion: 'Updating to {version}…', updateCurrent: 'Up to date', updateUnsupported: 'This install cannot auto-update', updateFailed: 'Update failed: ', updateRestart: 'Version {version} is installed; restart DSH to apply', updateDone: 'Updated to {version}', updateAutoSaved: 'Auto-update setting saved',
        userSkillsDir: 'User skill directory', readonlyHint: 'User and .agents project skills in every registered workspace support editing, toggling, and deletion; cross-workspace edits show their impact.',
        connected: 'Connected', connecting: 'Connecting', reconnecting: 'Reconnecting', failed: 'Failed', waiting: 'Waiting for credentials', closed: 'Closed',
        unknownStatus: 'Unknown status', toolCount: '{count} tools', invalidJson: 'Invalid JSON', empty: 'No description',
        importTitle: 'Import MCP from apps', importHelp: 'Reads user-level configs without changing them. Select entries manually; imports are disabled by default. A changed source invalidates the preview.',
        noImports: 'No importable MCP servers found', existing: 'Already exists', importAction: 'Import selected', scanFailed: 'Scan failed', conflict: 'Conflicting configs',
        enableImports: 'Enable immediately after import', importEnableHint: 'Enabling a stdio MCP starts its local command. Only enable sources and commands you trust.',
        syncTitle: 'Sync Skills from Agent directory', syncHelp: 'Choose a sync mode to copy skills from the Agent directory into DSH. Existing targets are backed up before replacement; Agent sources are unchanged.',
        syncMode: 'Sync mode', symlinkMode: 'Symlink only', symlinkHelp: 'Windows requires Developer Mode',
        copyMode: 'Copy only', copyHelp: 'Uses more space; copies are recreated on updates',
        copyImpact: 'Copy mode edits and deletes only the DSH copy; Agent source files stay unchanged.',
        syncAction: 'Confirm sync', newItem: 'Create link', updateItem: 'Update link', newCopy: 'Copy', updateCopy: 'Update copy', localEditItem: 'Locally modified', conflictItem: 'Both changed', errorItem: 'Read failed', localEditHint: 'The DSH copy changed since the last sync; syncing backs it up before replacing it.', conflictHint: 'The source and DSH copy both changed; confirm before overwriting the local copy.', unchangedItem: 'Linked', noChanges: 'No changes to synchronize', backupLocation: 'Backup directory', partialFailure: 'Some items failed',
        selectAll: 'Select all', clearAll: 'Clear all', selectedCount: '{count} selected', takeoverHint: 'Skill takeover is active in every mode: only the global Agent directory is hidden; DSH user and project skills still load. The global Agent directory is used only for sync.',
        standaloneHint: 'Standalone MCP connection settings can be edited, enabled, disabled, or deleted here.', registeredHint: 'Dynamically registered by another DSH plugin.',
      },
    }

    function createPreferenceStore(initial) {
      let current = initial
      const listeners = new Set()
      return {
        getSnapshot: () => current,
        subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener) },
        set: next => { current = next; for (const listener of listeners) listener() },
      }
    }

    function t(key, vars) {
      let value = translate ? translate(key, vars) : (MESSAGES.zh[key] || key)
      if (!translate && vars) for (const name of Object.keys(vars)) value = value.replaceAll('{' + name + '}', String(vars[name]))
      return value
    }

    const CSS = [
      '.dsh-caps{--caps-pad:24px;color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5;height:100%;overflow-y:auto;overscroll-behavior:contain;box-sizing:border-box;background:var(--dsw-alias-bg-base);}',
      '.dsh-caps *{box-sizing:border-box}.dsh-caps button,.dsh-caps input,.dsh-caps textarea,.dsh-caps select{font:inherit}',
      '.dsh-caps-shell{max-width:1080px;margin:0 auto;padding:28px var(--caps-pad) 48px;}',
      '.dsh-caps-header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:24px;}',
      '.dsh-caps-title{font-size:24px;line-height:1.25;font-weight:650;letter-spacing:-.02em;margin:0 0 7px;}',
      '.dsh-caps-subtitle{color:var(--dsw-alias-label-secondary);margin:0;max-width:620px;}',
      '.dsh-caps-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}',
      '.dsh-caps-update-actions{justify-content:flex-end;row-gap:10px;}',
      '.dsh-caps-version{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;font-size:12px;}',
      '.dsh-caps-update{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}',
      '.dsh-caps-btn{border:.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);border-radius:7px;min-height:32px;padding:5px 11px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;}',
      '.dsh-caps-btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);}',
      '.dsh-caps-btn:focus-visible,.dsh-caps-tab:focus-visible,.dsh-caps-switch:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px;}',
      '.dsh-caps-btn:disabled,.dsh-caps-switch:disabled{opacity:.48;cursor:not-allowed;}',
      '.dsh-caps-primary{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-on-color);border-color:transparent;}',
      '.dsh-caps-primary:hover:not(:disabled){background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-on-color);opacity:.9;}',
      '.dsh-caps-danger{color:var(--dsw-alias-state-error-primary);}',
      '.dsh-caps-tabs{display:flex;gap:4px;border-bottom:.5px solid var(--dsw-alias-border-l1);margin-bottom:16px;}',
      '.dsh-caps-tab{border:0;border-bottom:2px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);padding:9px 14px;margin-bottom:-.5px;cursor:pointer;display:flex;gap:8px;align-items:center;}',
      '.dsh-caps-tab[aria-pressed=true]{color:var(--dsw-alias-label-primary);border-bottom-color:var(--dsw-alias-brand-primary);font-weight:600;}',
      '.dsh-caps-count{font-size:11px;min-width:20px;padding:0 5px;border-radius:10px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);}',
      '.dsh-caps-toolbar{display:flex;gap:10px;margin-bottom:16px;}.dsh-caps-search{position:relative;flex:1;}',
      '.dsh-caps-input,.dsh-caps-select,.dsh-caps-textarea{width:100%;border:.5px solid var(--dsw-alias-border-l1);border-radius:7px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);padding:8px 10px;outline:none;}',
      '.dsh-caps-input:focus,.dsh-caps-select:focus,.dsh-caps-textarea:focus{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 2px color-mix(in srgb,var(--dsw-alias-brand-primary) 20%,transparent);}',
      '.dsh-caps-search .dsh-caps-input{padding-left:32px;}.dsh-caps-search-icon{position:absolute;left:10px;top:9px;color:var(--dsw-alias-label-secondary);pointer-events:none;}',
      '.dsh-caps-list{display:flex;flex-direction:column;gap:10px;}',
      '.dsh-caps-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center;border:.5px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:15px 16px;}',
      '.dsh-caps-compact .dsh-caps-row{padding:9px 12px;gap:10px;}.dsh-caps-main{min-width:0;}',
      '.dsh-caps-name-row{display:flex;align-items:center;gap:8px;min-width:0;flex-wrap:wrap;}.dsh-caps-name{font-weight:600;font-size:14px;overflow-wrap:anywhere;}',
      '.dsh-caps-badge{display:inline-flex;align-items:center;border-radius:4px;padding:1px 6px;font-size:11px;line-height:18px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);}',
      '.dsh-caps-description{color:var(--dsw-alias-label-secondary);margin-top:5px;overflow-wrap:anywhere;}.dsh-caps-path{color:var(--dsw-alias-label-secondary);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.dsh-caps-row-actions{display:flex;align-items:center;justify-content:flex-end;gap:6px;flex-wrap:wrap;}',
      '.dsh-caps-row-readonly .dsh-caps-row-actions{opacity:.82;}',
      '.dsh-caps-info-wrap{position:relative;display:inline-flex;align-items:center;}.dsh-caps-info{display:inline-grid;place-items:center;width:20px;height:20px;padding:0;border:0;border-radius:50%;background:transparent;color:var(--dsw-alias-label-secondary);cursor:help;}.dsh-caps-info:hover,.dsh-caps-info[aria-expanded="true"]{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);}',
      '.dsh-caps-info:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-brand-primary));outline-offset:1px;}',
      '.dsh-caps-tip{position:absolute;top:calc(100% + 7px);left:0;z-index:12;display:flex;flex-direction:column;gap:4px;width:min(300px,72vw);padding:10px 12px;border:.5px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-overlay);box-shadow:0 10px 30px color-mix(in srgb,var(--dsw-alias-label-primary) 16%,transparent);color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:400;line-height:1.45;white-space:normal;text-align:left;}',
      '.dsh-caps-tip strong{color:var(--dsw-alias-label-primary);font-weight:600;}',
      '.dsh-caps-switch{position:relative;width:34px;height:20px;border:0;border-radius:10px;background:var(--dsw-alias-state-idle-primary);box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l2);cursor:pointer;padding:0;flex:none;}',
      '.dsh-caps-switch:after{content:"";position:absolute;left:3px;top:3px;width:14px;height:14px;border-radius:50%;background:var(--dsw-alias-switch-thumb);transition:transform .16s ease;box-shadow:0 0 0 .5px var(--dsw-alias-border-l1);}',
      '.dsh-caps-switch[aria-checked=true]{background:var(--dsw-alias-state-success-primary);}.dsh-caps-switch[aria-checked=true]:after{transform:translateX(14px);}',
      '.dsh-caps-status{display:inline-flex;align-items:center;gap:5px;color:var(--dsw-alias-label-secondary);font-size:12px;}.dsh-caps-dot{width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-label-secondary);}',
      '.dsh-caps-status[data-state=connected]{color:var(--dsw-alias-state-success-primary);}.dsh-caps-status[data-state=connected] .dsh-caps-dot{background:var(--dsw-alias-state-success-primary);}',
      '.dsh-caps-status[data-state=failed]{color:var(--dsw-alias-state-error-primary);}.dsh-caps-status[data-state=failed] .dsh-caps-dot{background:var(--dsw-alias-state-error-primary);}',
      '.dsh-caps-empty{padding:48px 20px;text-align:center;color:var(--dsw-alias-label-secondary);border:.5px dashed var(--dsw-alias-border-l1);border-radius:10px;}',
      '.dsh-caps-import-list{display:flex;flex-direction:column;gap:8px;max-height:420px;overflow:auto;}.dsh-caps-import-row{display:flex;align-items:flex-start;gap:10px;padding:11px 12px;border:.5px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1);cursor:pointer;}.dsh-caps-import-row:has(input:disabled){cursor:default;opacity:.65;}.dsh-caps-import-row input{margin-top:4px;accent-color:var(--dsw-alias-brand-primary);}.dsh-caps-import-meta{min-width:0;flex:1;}.dsh-caps-import-source{font-size:11px;color:var(--dsw-alias-label-secondary);margin-top:3px;overflow-wrap:anywhere;}',
      '.dsh-caps-notice{padding:10px 12px;border-radius:7px;margin-bottom:14px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere;}',
      '.dsh-caps-error{color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 7%,transparent);}',
      '.dsh-caps-foot{display:flex;gap:18px;flex-wrap:wrap;color:var(--dsw-alias-label-secondary);font-size:11px;margin-top:22px;overflow-wrap:anywhere;}',
      '.dsh-caps-overlay{position:fixed;inset:0;z-index:1000;background:color-mix(in srgb,var(--dsw-alias-label-primary) 24%,transparent);display:flex;align-items:center;justify-content:center;padding:20px;}',
      '.dsh-caps-modal{width:min(620px,100%);max-height:min(760px,calc(100vh - 40px));overflow:auto;background:var(--dsw-alias-bg-layer-1);border:.5px solid var(--dsw-alias-border-l1);border-radius:12px;box-shadow:0 18px 60px color-mix(in srgb,var(--dsw-alias-label-primary) 22%,transparent);padding:22px;}',
      '.dsh-caps-modal-head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:20px;}.dsh-caps-modal-title{font-size:17px;font-weight:650;margin:0;}',
      '.dsh-caps-form{display:flex;flex-direction:column;gap:14px;}.dsh-caps-field{display:flex;flex-direction:column;gap:6px;}.dsh-caps-label{font-weight:550;color:var(--dsw-alias-label-secondary);}',
      '.dsh-caps-help{font-size:11px;color:var(--dsw-alias-label-secondary);}.dsh-caps-textarea{min-height:100px;resize:vertical;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;}.dsh-caps-content{min-height:300px;}',
      '.dsh-caps-check{display:flex;align-items:flex-start;gap:9px;color:var(--dsw-alias-label-secondary);cursor:pointer;}.dsh-caps-check input{margin-top:3px;accent-color:var(--dsw-alias-brand-primary);}',
      '.dsh-caps-segment{display:flex;gap:2px;padding:2px;border-radius:8px;background:var(--dsw-alias-bg-layer-2);border:.5px solid var(--dsw-alias-border-l1);}',
      '.dsh-caps-segment button{flex:1;min-height:28px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer;padding:4px 10px;}',
      '.dsh-caps-segment button[aria-pressed="true"]{background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-weight:600;box-shadow:0 0 0 .5px var(--dsw-alias-border-l2);}',
      '.dsh-caps-segment button:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-brand-primary));outline-offset:1px;}',
      '.dsh-caps-workspace{display:flex;flex-direction:column;gap:11px;padding:12px;border:.5px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-2);}',
      '.dsh-caps-workspace-head{display:flex;align-items:flex-start;gap:9px;}.dsh-caps-workspace-icon{width:28px;height:28px;flex:0 0 28px;display:grid;place-items:center;border:.5px solid var(--dsw-alias-border-l1);border-radius:7px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);}',
      '.dsh-caps-workspace-copy{display:flex;flex-direction:column;gap:2px;min-width:0;}.dsh-caps-workspace-fields{display:grid;grid-template-columns:1fr 1fr;gap:10px;}',
      '.dsh-caps-json{min-height:240px;}',
      '.dsh-caps-mcp-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:start;}.dsh-caps-mcp-small{min-height:72px;}',
      '.dsh-caps-sync-mode-list{display:grid;grid-template-columns:1fr 1fr;gap:8px;}.dsh-caps-sync-mode{display:flex;align-items:flex-start;gap:9px;padding:10px 12px;border:.5px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-1);cursor:pointer;}',
      '.dsh-caps-sync-mode.is-selected{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2);}',
      '.dsh-caps-sync-mode input{margin:3px 0 0;accent-color:var(--dsw-alias-brand-primary);}',
      '.dsh-caps-sync-mode-icon{display:grid;place-items:center;color:var(--dsw-alias-label-secondary);padding-top:1px;}.dsh-caps-sync-mode.is-selected .dsh-caps-sync-mode-icon{color:var(--dsw-alias-brand-primary);}',
      '.dsh-caps-sync-mode-copy{display:flex;flex-direction:column;gap:2px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.4;}.dsh-caps-sync-mode-copy strong{color:var(--dsw-alias-label-primary);font-weight:600;}',
      '.dsh-caps-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:22px;}.dsh-caps-spinner{color:var(--dsw-alias-label-secondary);padding:30px 0;text-align:center;}',
      '@media(max-width:700px){.dsh-caps{--caps-pad:16px}.dsh-caps-shell{padding-top:20px}.dsh-caps-header{flex-direction:column}.dsh-caps-update-actions{justify-content:flex-start}.dsh-caps-row{grid-template-columns:1fr}.dsh-caps-row-actions{justify-content:flex-start}.dsh-caps-toolbar{flex-wrap:wrap}.dsh-caps-search{flex-basis:100%}.dsh-caps-modal{padding:18px}.dsh-caps-workspace-fields,.dsh-caps-mcp-grid,.dsh-caps-sync-mode-list{grid-template-columns:1fr}}',
    ].join('\n')

    function Icon({ name, size = 16 }) {
      const paths = {
        search: h('path', { d: 'M8 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm4.2 9.2 3 3' }),
        refresh: h('path', { d: 'M13.5 5.5A6 6 0 1 0 14 10m0-7v4h-4' }),
        plus: h('path', { d: 'M8 3v10M3 8h10' }),
        sync: h('path', { d: 'M13 8a5 5 0 1 1-2.2-4.1M13.2 2.2v3.2H10' }),
        import: h('path', { d: 'M8 2v8m-3-3 3 3 3-3M3 11v3h10v-3' }),
        settings: h('path', { d: 'M8 5.5A2.5 2.5 0 1 0 8 10a2.5 2.5 0 0 0 0-4.5ZM3 6.5l1 .5m8 2 1 .5M5.5 3l.5 1m4 8 .5 1M3 10l1-.5m8-3 1-.5M5.5 13l.5-1m4-8 .5-1' }),
        workspace: h('path', { d: 'M2.5 5.5h4l1.1 1.5h5.9v6.5h-11zM2.5 5.5v8h11' }),
        help: h('path', { d: 'M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM6.4 6.2a1.8 1.8 0 0 1 3.5.6c0 1.1-1.1 1.4-1.8 1.9M8 11.3v.2' }),
        link: h('path', { d: 'M6.2 9.8 4.8 11.2a2.3 2.3 0 0 1-3.3-3.3l2.2-2.2a2.3 2.3 0 0 1 3.3 0M9.8 6.2l1.4-1.4a2.3 2.3 0 0 1 3.3 3.3l-2.2 2.2a2.3 2.3 0 0 1-3.3 0M5.5 10.5l5-5' }),
        copy: h('path', { d: 'M5.5 2.5h6a2 2 0 0 1 2 2v6M3 5.5h7.5v8H3z' }),
        close: h('path', { d: 'm4 4 8 8m0-8-8 8' }),
      }
      return h('svg', { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }, paths[name] || paths.settings)
    }

    function BrandIcon({ size = 20 }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true, style: { color: 'currentColor' } },
        h('rect', { x: 3, y: 3, width: 7, height: 7, rx: 2, stroke: 'currentColor', strokeWidth: 1.6 }),
        h('rect', { x: 14, y: 14, width: 7, height: 7, rx: 2, stroke: 'currentColor', strokeWidth: 1.6 }),
        h('path', { d: 'M14 6.5h7M17.5 3v7M3 17.5h7M6.5 14v7', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' }))
    }

    async function api(path, options = {}) {
      const method = options.method || (options.body ? 'POST' : 'GET')
      const requestPath = method === 'GET' ? path + (path.includes('?') ? '&' : '?') + '_=' + Date.now() : path
      const headers = {}
      if (options.body) headers['content-type'] = 'application/json'
      if (activeSessionId) headers['x-dsh-session-id'] = activeSessionId
      const response = await fetch(BASE + requestPath, {
        method,
        cache: 'no-store',
        headers: Object.keys(headers).length ? headers : undefined,
        body: options.body ? JSON.stringify(options.body) : undefined,
      })
      const data = await response.json().catch(() => ({ ok: false, error: 'Invalid server response' }))
      if (!response.ok || (data.ok === false && options.allowFailure !== true)) throw new Error(data.error || ('HTTP ' + response.status))
      return data
    }

    function Modal({ title, onClose, children, wide = false, error = '', returnFocus }) {
      const dialogRef = React.useRef(null)
      const closeRef = React.useRef(onClose)
      closeRef.current = onClose
      useEffect(() => {
        const previous = returnFocus || document.activeElement
        const node = dialogRef.current
        const focusable = () => [...node.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex="0"]')].filter(el => el.getClientRects().length > 0)
        const first = node.querySelector('[data-autofocus]') || focusable()[0] || node
        first.focus()
        const listener = event => {
          if (event.key === 'Escape') { event.preventDefault(); closeRef.current() }
          if (event.key !== 'Tab') return
          const items = focusable()
          if (!items.length) { event.preventDefault(); node.focus(); return }
          const firstItem = items[0], lastItem = items[items.length - 1]
          if (event.shiftKey && document.activeElement === firstItem) { event.preventDefault(); lastItem.focus() }
          else if (!event.shiftKey && document.activeElement === lastItem) { event.preventDefault(); firstItem.focus() }
        }
        window.addEventListener('keydown', listener)
        return () => { window.removeEventListener('keydown', listener); if (previous?.focus) previous.focus() }
      }, [])
      useEffect(() => { if (error) dialogRef.current?.querySelector('[role="alert"]')?.focus() }, [error])
      return h('div', { className: 'dsh-caps-overlay', onMouseDown: event => { if (event.target === event.currentTarget) onClose() } },
        h('section', { ref: dialogRef, tabIndex: -1, className: 'dsh-caps-modal', role: 'dialog', 'aria-modal': true, 'aria-label': title, style: wide ? { width: 'min(760px,100%)' } : undefined },
          h('div', { className: 'dsh-caps-modal-head' }, h('h2', { className: 'dsh-caps-modal-title' }, title), h('button', { className: 'dsh-caps-btn', 'aria-label': t('close'), onClick: () => onClose() }, h(Icon, { name: 'close' }))),
          error ? h('div', { className: 'dsh-caps-notice dsh-caps-error', role: 'alert', tabIndex: -1 }, error) : null,
          children))
    }

    function Field({ label, help, children }) {
      return h('label', { className: 'dsh-caps-field' }, h('span', { className: 'dsh-caps-label' }, label), children, help ? h('span', { className: 'dsh-caps-help' }, help) : null)
    }

    function SkillCreate({ cwd, workspaces = [], onCancel, onSave, onDirtyChange, busy }) {
      const workspaceOptions = useMemo(() => {
        const rows = []
        if (cwd) rows.push({ id: 'session', path: cwd, title: t('currentWorkspace') })
        for (const workspace of workspaces) {
          if (!rows.some(row => row.path === workspace.path)) rows.push(workspace)
        }
        return rows
      }, [cwd, workspaces])
      const [name, setName] = useState('')
      const [description, setDescription] = useState('')
      const [body, setBody] = useState('')
      const [scope, setScope] = useState('user')
      const [workspaceMode, setWorkspaceMode] = useState(workspaceOptions.length ? 'existing' : 'new')
      const [workspacePath, setWorkspacePath] = useState(workspaceOptions[0]?.path || '')
      const [workspaceName, setWorkspaceName] = useState('')
      const [workspaceParent, setWorkspaceParent] = useState('~/Documents')
      useEffect(() => {
        if (workspaceOptions.length && !workspaceOptions.some(workspace => workspace.path === workspacePath)) {
          setWorkspacePath(workspaceOptions[0].path)
        }
      }, [workspaceOptions, workspacePath])
      useEffect(() => onDirtyChange(Boolean(name || description || body) || scope !== 'user' || workspaceName || workspaceParent !== '~/Documents'), [name, description, body, scope, workspaceName, workspaceParent, onDirtyChange])
      const projectReady = scope !== 'project'
        || (workspaceMode === 'existing' ? Boolean(workspacePath) : Boolean(workspaceName.trim() && workspaceParent.trim()))
      const submit = async event => {
        event.preventDefault()
        if (!projectReady) return
        const projectCwd = scope === 'project' && workspaceMode === 'existing' ? workspacePath : cwd
        if (await onSave({ name, description, body, scope, cwd: projectCwd, workspaceMode, workspaceName: workspaceName.trim(), workspaceParent: workspaceParent.trim() })) onCancel(true)
      }
      const segment = (value, options, onChange, label) => h('div', { className: 'dsh-caps-segment', role: 'group', 'aria-label': label },
        options.map(option => h('button', { key: option.value, type: 'button', 'aria-pressed': value === option.value, onClick: () => onChange(option.value) }, option.label)))
      return h('form', { className: 'dsh-caps-form', onSubmit: submit },
        h(Field, { label: t('scope') },
          segment(scope, [{ value: 'user', label: t('userScope') }, { value: 'project', label: t('projectScope') }], setScope, t('scope'))),
        scope === 'project' ? h('div', { className: 'dsh-caps-workspace' },
          h('div', { className: 'dsh-caps-workspace-head' },
            h('span', { className: 'dsh-caps-workspace-icon' }, h(Icon, { name: 'workspace', size: 16 })),
            h('div', { className: 'dsh-caps-workspace-copy' }, h('span', { className: 'dsh-caps-label' }, t('workspace')), h('span', { className: 'dsh-caps-help' }, t('workspaceHelp')))),
          segment(workspaceMode, [{ value: 'existing', label: t('existingWorkspace') }, { value: 'new', label: t('newWorkspace') }], setWorkspaceMode, t('workspace')),
          workspaceMode === 'existing'
            ? h(Field, { label: t('selectWorkspace') }, h('select', { className: 'dsh-caps-select', value: workspacePath, onChange: e => setWorkspacePath(e.target.value), required: true },
              workspaceOptions.length ? workspaceOptions.map(workspace => h('option', { key: workspace.path, value: workspace.path }, workspace.title + ' · ' + workspace.path)) : h('option', { value: '' }, t('workspaceRequired'))))
            : h('div', { className: 'dsh-caps-workspace-fields' },
              h(Field, { label: t('workspaceName') }, h('input', { className: 'dsh-caps-input', value: workspaceName, onChange: e => setWorkspaceName(e.target.value), placeholder: 'my-workspace', required: true })),
              h(Field, { label: t('workspaceParent'), help: t('workspaceParentHelp') }, h('input', { className: 'dsh-caps-input', value: workspaceParent, onChange: e => setWorkspaceParent(e.target.value), placeholder: '~/Documents', required: true }))),
          workspaceMode === 'new' ? h('div', { className: 'dsh-caps-help' }, t('newWorkspaceHint')) : null) : null,
        h(Field, { label: t('name'), help: t('skillNameHelp') }, h('input', { className: 'dsh-caps-input', value: name, onChange: e => setName(e.target.value), placeholder: 'my-skill', autoFocus: true, required: true })),
        h(Field, { label: t('description') }, h('input', { className: 'dsh-caps-input', value: description, onChange: e => setDescription(e.target.value), required: true })),
        h(Field, { label: t('body') }, h('textarea', { className: 'dsh-caps-textarea', value: body, onChange: e => setBody(e.target.value), placeholder: '# ' + (name || 'my-skill') })),
        h('div', { className: 'dsh-caps-modal-actions' }, h('button', { type: 'button', className: 'dsh-caps-btn', onClick: () => onCancel() }, t('cancel')), h('button', { className: 'dsh-caps-btn dsh-caps-primary', disabled: busy || !projectReady }, busy ? t('creating') : t('create'))))
    }

    function SkillEdit({ item, onCancel, onSave, onDirtyChange, busy }) {
      const [text, setText] = useState(item.text)
      useEffect(() => onDirtyChange(text !== item.text), [text, item.text, onDirtyChange])
      const submit = async event => { event.preventDefault(); if (await onSave(text)) onCancel(true) }
      return h('form', { className: 'dsh-caps-form', onSubmit: submit },
        item.crossWorkspace && item.writable ? h('div', { className: 'dsh-caps-notice' }, t('workspaceEditImpact', { workspace: item.workspaceTitle })) : null,
        h('div', { className: 'dsh-caps-help' }, item.path),
        h(Field, { label: t('content') }, h('textarea', { className: 'dsh-caps-textarea dsh-caps-content', value: text, onChange: e => setText(e.target.value), spellCheck: false, autoFocus: true, required: true })),
        h('div', { className: 'dsh-caps-modal-actions' }, h('button', { type: 'button', className: 'dsh-caps-btn', onClick: () => onCancel() }, t('cancel')), h('button', { className: 'dsh-caps-btn dsh-caps-primary', disabled: busy }, t('save'))))
    }

    function mcpJsonText({ name, transport, command, args, cwd, env, url, headers, enabled, includeEnabled = true }) {
      const server = transport === 'stdio'
        ? { transport, command, args, env, cwd }
        : { transport, url, headers }
      const body = includeEnabled ? { ...server, enabled } : server
      return JSON.stringify({ mcpServers: { [name || 'my-mcp']: body } }, null, 2)
    }

    function parseMcpServers(text, fallbackName, editingName) {
      const value = JSON.parse(text)
      if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error(t('invalidJson'))
      let entries
      if (value.mcpServers !== undefined) {
        if (value.mcpServers === null || typeof value.mcpServers !== 'object' || Array.isArray(value.mcpServers)) throw new Error(t('invalidJson'))
        entries = Object.entries(value.mcpServers)
      } else if (!value.transport && !value.type && !value.command && !value.url && Object.values(value).every(entry => entry && typeof entry === 'object' && !Array.isArray(entry))) {
        entries = Object.entries(value)
      } else {
        entries = [[fallbackName, value]]
      }
      if (!entries.length) throw new Error(t('invalidJson'))
      if (editingName && entries.length !== 1) throw new Error(t('jsonOneServer'))
      return entries.map(([key, server]) => {
        const name = editingName || (entries.length > 1 ? key : (fallbackName || key))
        if (!name || !MCP_NAME.test(name)) throw new Error(t('mcpNameHelp'))
        if (server === null || typeof server !== 'object' || Array.isArray(server)) throw new Error(t('invalidJson'))
        const transport = server.transport || server.type || (server.url ? 'streamable-http' : 'stdio')
        if (transport === 'http' || transport === 'sse') return { name, server: { ...server, transport: 'streamable-http' } }
        return { name, server: { ...server, transport } }
      })
    }

    function parseMcpJson(text, fallbackName, editingName) {
      const servers = parseMcpServers(text, fallbackName, editingName)
      if (servers.length !== 1) throw new Error(t('jsonOneServer'))
      return servers[0]
    }

    function McpForm({ item, onCancel, onSave, onDirtyChange, busy }) {
      const editing = Boolean(item)
      const standalone = item?.source === 'standalone'
      const [name, setName] = useState(item?.name || '')
      const [transport, setTransport] = useState(item?.transport || 'stdio')
      const [command, setCommand] = useState(item?.command || '')
      const [args, setArgs] = useState((item?.args || []).join('\n'))
      const [cwd, setCwd] = useState(item?.cwd || '')
      const [env, setEnv] = useState(JSON.stringify(item?.env || {}, null, 2))
      const [url, setUrl] = useState(item?.url || '')
      const [headers, setHeaders] = useState(JSON.stringify(item?.headers || {}, null, 2))
      const [enabled, setEnabled] = useState(item?.enabled !== false)
      const [mode, setMode] = useState('form')
      const [jsonText, setJsonText] = useState(() => mcpJsonText({ name: item?.name || '', transport: item?.transport || 'stdio', command: item?.command || '', args: item?.args || [], cwd: item?.cwd || '', env: item?.env || {}, url: item?.url || '', headers: item?.headers || {}, enabled: item?.enabled !== false, includeEnabled: !standalone }))
      const [formError, setFormError] = useState('')
      const original = useMemo(() => JSON.stringify({ name: item?.name || '', transport: item?.transport || 'stdio', command: item?.command || '', args: (item?.args || []).join('\n'), cwd: item?.cwd || '', env: JSON.stringify(item?.env || {}, null, 2), url: item?.url || '', headers: JSON.stringify(item?.headers || {}, null, 2), enabled: item?.enabled !== false }), [])
      const originalJson = useMemo(() => mcpJsonText({ name: item?.name || '', transport: item?.transport || 'stdio', command: item?.command || '', args: item?.args || [], cwd: item?.cwd || '', env: item?.env || {}, url: item?.url || '', headers: item?.headers || {}, enabled: item?.enabled !== false, includeEnabled: !standalone }), [])
      useEffect(() => onDirtyChange(mode === 'json' ? jsonText !== originalJson : JSON.stringify({ name, transport, command, args, cwd, env, url, headers, enabled }) !== original), [name, transport, command, args, cwd, env, url, headers, enabled, mode, jsonText, original, originalJson, onDirtyChange])
      const parseObject = (text, label) => {
        const value = JSON.parse(text || '{}')
        if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error(label)
        return value
      }
      const currentJson = () => mcpJsonText({ name, transport, command, args: args.split(/\r?\n/).map(x => x.trim()).filter(Boolean), cwd, env: parseObject(env, t('env')), url, headers: parseObject(headers, t('headers')), enabled, includeEnabled: !standalone })
      const applyServer = server => {
        const requested = server.transport || server.type || (server.url ? 'streamable-http' : 'stdio')
        const nextTransport = requested === 'http' || requested === 'sse' ? 'streamable-http' : requested
        setTransport(nextTransport)
        setCommand(String(server.command || ''))
        setArgs(Array.isArray(server.args) ? server.args.join('\n') : '')
        setCwd(String(server.cwd || ''))
        setEnv(JSON.stringify(server.env || {}, null, 2))
        setUrl(String(server.url || ''))
        setHeaders(JSON.stringify(server.headers || {}, null, 2))
        setEnabled(server.enabled !== false)
      }
      const switchMode = next => {
        setFormError('')
        if (next === 'json') {
          try { setJsonText(currentJson()); setMode('json') } catch (error) { setFormError(t('invalidJson') + ': ' + error.message) }
          return
        }
        try {
          const parsed = parseMcpJson(jsonText, name.trim(), editing ? item?.name : undefined)
          applyServer(parsed.server)
          if (!name.trim()) setName(parsed.name)
          setMode('form')
        } catch (error) { setFormError(t('invalidJson') + ': ' + error.message) }
      }
      const submit = async event => {
        event.preventDefault(); setFormError('')
        let payload
        if (mode === 'json') {
          try {
            const parsedServers = parseMcpServers(jsonText, name.trim(), editing ? item?.name : undefined)
            const toPayload = parsed => {
              const server = parsed.server
              return { name: parsed.name, originalName: item?.name, transport: server.transport, command: String(server.command || ''), args: Array.isArray(server.args) ? server.args.map(String) : [], cwd: String(server.cwd || ''), env: server.env || {}, url: String(server.url || ''), headers: server.headers || {}, enabled: server.enabled !== false }
            }
            payload = !editing && parsedServers.length > 1 ? { servers: parsedServers.map(toPayload) } : toPayload(parsedServers[0])
          } catch (error) { setFormError(t('invalidJson') + ': ' + error.message); return }
        } else {
          let envObject, headerObject
          try { envObject = JSON.parse(env || '{}'); headerObject = JSON.parse(headers || '{}') } catch (error) { setFormError(t('invalidJson') + ': ' + error.message); return }
          payload = { name, originalName: item?.name, transport, command, args: args.split(/\r?\n/).map(x => x.trim()).filter(Boolean), cwd, env: envObject, url, headers: headerObject, enabled }
        }
        if (await onSave(payload)) onCancel(true)
      }
      return h('form', { className: 'dsh-caps-form', onSubmit: submit },
        h(Field, { label: t('mode') }, h('div', { className: 'dsh-caps-segment', role: 'group', 'aria-label': t('mode') },
          h('button', { type: 'button', 'aria-pressed': mode === 'form', onClick: () => switchMode('form') }, t('formMode')),
          h('button', { type: 'button', 'aria-pressed': mode === 'json', onClick: () => switchMode('json') }, t('jsonMode')))),
        h(Field, { label: t('name'), help: t('mcpNameHelp') }, h('input', { className: 'dsh-caps-input', value: name, onChange: e => setName(e.target.value), disabled: editing, autoFocus: !editing, required: mode === 'form' })),
        standalone ? h('div', { className: 'dsh-caps-help' }, t('standaloneEditHint')) : null,
        mode === 'json' ? h(React.Fragment, null,
          h(Field, { label: t('jsonMode'), help: t('jsonHelp') }, h('textarea', { className: 'dsh-caps-textarea dsh-caps-json', value: jsonText, onChange: e => setJsonText(e.target.value), spellCheck: false })))
          : h(React.Fragment, null,
            h(Field, { label: t('transport'), help: transport === 'streamable-http' ? t('transportHttpHelp') : null }, h('select', { className: 'dsh-caps-select', value: transport, onChange: e => setTransport(e.target.value) }, h('option', { value: 'stdio' }, 'stdio'), h('option', { value: 'streamable-http' }, t('transportHttp'))),
            transport === 'stdio' ? h(React.Fragment, null,
              h('div', { className: 'dsh-caps-mcp-grid' },
                h(Field, { label: t('command') }, h('input', { className: 'dsh-caps-input', value: command, onChange: e => setCommand(e.target.value), placeholder: 'npx', required: true })),
                h(Field, { label: t('cwd') }, h('input', { className: 'dsh-caps-input', value: cwd, onChange: e => setCwd(e.target.value) }))),
              h('div', { className: 'dsh-caps-mcp-grid' },
                h(Field, { label: t('args') }, h('textarea', { className: 'dsh-caps-textarea dsh-caps-mcp-small', value: args, onChange: e => setArgs(e.target.value), placeholder: '-y\n@modelcontextprotocol/server-filesystem' })),
                h(Field, { label: t('env') }, h('textarea', { className: 'dsh-caps-textarea dsh-caps-mcp-small', value: env, onChange: e => setEnv(e.target.value), spellCheck: false }))))
              : h('div', { className: 'dsh-caps-mcp-grid' },
                h(Field, { label: t('url') }, h('input', { className: 'dsh-caps-input', type: 'url', value: url, onChange: e => setUrl(e.target.value), placeholder: 'https://example.com/mcp', required: true })),
                h(Field, { label: t('headers') }, h('textarea', { className: 'dsh-caps-textarea dsh-caps-mcp-small', value: headers, onChange: e => setHeaders(e.target.value), spellCheck: false })))),
            standalone ? null : h('label', { className: 'dsh-caps-check' }, h('input', { type: 'checkbox', checked: enabled, onChange: e => setEnabled(e.target.checked) }), t('enableNow'))),
        formError ? h('div', { className: 'dsh-caps-notice dsh-caps-error', role: 'alert' }, formError) : null,
        h('div', { className: 'dsh-caps-modal-actions' }, h('button', { type: 'button', className: 'dsh-caps-btn', onClick: () => onCancel() }, t('cancel')), h('button', { className: 'dsh-caps-btn dsh-caps-primary', disabled: busy }, t('save'))))
    }

    function McpImport({ onCancel, onImport, busy }) {
      const [loading, setLoading] = useState(true)
      const [servers, setServers] = useState([])
      const [errors, setErrors] = useState([])
      const [selected, setSelected] = useState(new Set())
      const [enabled, setEnabled] = useState(false)
      const [scanError, setScanError] = useState('')
      const scan = useCallback(async () => {
        setLoading(true); setScanError(''); setSelected(new Set())
        try {
          const result = await api('/mcp/imports')
          setServers(result.servers || []); setErrors(result.errors || [])
        } catch (error) { setScanError(error.message) } finally { setLoading(false) }
      }, [])
      useEffect(() => { scan() }, [scan])
      const toggle = (item, checked) => setSelected(current => {
        const next = new Set(current)
        if (checked) {
          for (const other of servers) if (other.name === item.name) next.delete(other.id)
          next.add(item.id)
        } else next.delete(item.id)
        return next
      })
      const submit = async () => { if (await onImport([...selected], enabled)) onCancel(true) }
      return h('div', { className: 'dsh-caps-form' },
        h('p', { className: 'dsh-caps-help' }, t('importHelp')),
        scanError ? h('div', { className: 'dsh-caps-notice dsh-caps-error', role: 'alert' }, h('span', null, t('scanFailed') + ': ' + scanError), h('button', { className: 'dsh-caps-btn', style: { marginLeft: '10px' }, onClick: scan }, t('retry'))) : null,
        errors.map((error, index) => h('div', { className: 'dsh-caps-notice dsh-caps-error', role: 'alert', key: index }, (error.label || error.path) + ': ' + error.error)),
        loading ? h('div', { className: 'dsh-caps-spinner' }, t('loading')) : null,
        !loading && !servers.length ? h('div', { className: 'dsh-caps-empty' }, t('noImports')) : null,
        !loading && servers.length ? h('div', { className: 'dsh-caps-import-list' }, servers.map(item => {
          const summary = item.transport === 'stdio' ? [item.command, ...(item.args || [])].filter(Boolean).join(' ') : item.url
          return h('label', { className: 'dsh-caps-import-row', key: item.id },
            h('input', { type: 'checkbox', checked: selected.has(item.id), disabled: item.exists, onChange: event => toggle(item, event.target.checked) }),
            h('div', { className: 'dsh-caps-import-meta' },
              h('div', { className: 'dsh-caps-name-row' }, h('span', { className: 'dsh-caps-name' }, item.name), h('span', { className: 'dsh-caps-badge' }, item.transport === 'stdio' ? 'stdio' : 'HTTP'), item.conflict ? h('span', { className: 'dsh-caps-badge' }, t('conflict')) : null, item.exists ? h('span', { className: 'dsh-caps-badge' }, t('existing')) : null),
              h('div', { className: 'dsh-caps-description' }, summary),
              h('div', { className: 'dsh-caps-import-source' }, (item.sources || []).map(source => source.label).join(' · '))))
        })) : null,
        h('label', { className: 'dsh-caps-check' }, h('input', { type: 'checkbox', checked: enabled, onChange: event => setEnabled(event.target.checked) }), t('enableImports')),
        enabled ? h('div', { className: 'dsh-caps-notice' }, t('importEnableHint')) : null,
        h('div', { className: 'dsh-caps-modal-actions' }, h('button', { className: 'dsh-caps-btn', onClick: () => onCancel() }, t('cancel')), h('button', { className: 'dsh-caps-btn dsh-caps-primary', disabled: busy || !selected.size, onClick: submit }, t('importAction'))))
    }

    function SkillSync({ onCancel, onSync, busy }) {
      const [loading, setLoading] = useState(true)
      const [mode, setMode] = useState('symlink')
      const [plan, setPlan] = useState(null)
      const [selected, setSelected] = useState(new Set())
      const [scanError, setScanError] = useState('')
      const scan = useCallback(async () => {
        setLoading(true); setScanError(''); setSelected(new Set())
        try {
          const result = await api('/skill/sync-preview?mode=' + mode)
          setPlan(result)
          setSelected(new Set((result.items || []).filter(item => item.action === 'import' || item.action === 'update').map(item => item.name)))
        } catch (error) { setScanError(error.message) } finally { setLoading(false) }
      }, [mode])
      useEffect(() => { scan() }, [scan])
      const items = plan?.items || []
      const changes = items.filter(item => item.action !== 'skip')
      const toggle = (name, checked) => setSelected(current => {
        const next = new Set(current)
        if (checked) next.add(name); else next.delete(name)
        return next
      })
      const submit = async () => { if (await onSync([...selected], mode)) onCancel(true) }
      return h('div', { className: 'dsh-caps-form' },
        h('p', { className: 'dsh-caps-help' }, t('syncHelp')),
        h('div', { className: 'dsh-caps-sync-mode-list', role: 'radiogroup', 'aria-label': t('syncMode') },
          h('label', { className: 'dsh-caps-sync-mode' + (mode === 'symlink' ? ' is-selected' : '') },
            h('input', { type: 'radio', name: 'skill-sync-mode', checked: mode === 'symlink', onChange: () => setMode('symlink') }),
            h('span', { className: 'dsh-caps-sync-mode-icon' }, h(Icon, { name: 'link', size: 15 })),
            h('span', { className: 'dsh-caps-sync-mode-copy' }, h('strong', null, t('symlinkMode')), h('span', null, t('symlinkHelp')))),
          h('label', { className: 'dsh-caps-sync-mode' + (mode === 'copy' ? ' is-selected' : '') },
            h('input', { type: 'radio', name: 'skill-sync-mode', checked: mode === 'copy', onChange: () => setMode('copy') }),
            h('span', { className: 'dsh-caps-sync-mode-icon' }, h(Icon, { name: 'copy', size: 15 })),
            h('span', { className: 'dsh-caps-sync-mode-copy' }, h('strong', null, t('copyMode')), h('span', null, t('copyHelp'))))),
        mode === 'copy' ? h('p', { className: 'dsh-caps-help' }, t('copyImpact')) : null,
        plan ? h('div', { className: 'dsh-caps-help' }, plan.sourceRoot + ' → ' + plan.targetRoot) : null,
        plan ? h('div', { className: 'dsh-caps-help' }, t('backupLocation') + ': ' + plan.backupRoot) : null,
        scanError ? h('div', { className: 'dsh-caps-notice dsh-caps-error', role: 'alert' }, h('span', null, t('scanFailed') + ': ' + scanError), h('button', { className: 'dsh-caps-btn', style: { marginLeft: '10px' }, onClick: scan }, t('retry'))) : null,
        loading ? h('div', { className: 'dsh-caps-spinner' }, t('loading')) : null,
        !loading && !changes.length ? h('div', { className: 'dsh-caps-empty' }, t('noChanges')) : null,
        !loading && changes.length ? h('div', { className: 'dsh-caps-actions', style: { justifyContent: 'space-between' } },
          h('span', { className: 'dsh-caps-help' }, t('selectedCount', { count: selected.size })),
          h('div', { className: 'dsh-caps-actions' },
            h('button', { className: 'dsh-caps-btn', onClick: () => setSelected(new Set(changes.filter(item => item.action === 'import' || item.action === 'update').map(item => item.name))) }, t('selectAll')),
            h('button', { className: 'dsh-caps-btn', onClick: () => setSelected(new Set()) }, t('clearAll')))) : null,
        !loading && changes.length ? h('div', { className: 'dsh-caps-import-list' }, changes.map(item => {
          const actionKey = item.action === 'update' ? (mode === 'copy' ? 'updateCopy' : 'updateItem')
            : item.action === 'local-edit' ? 'localEditItem'
              : item.action === 'conflict' ? 'conflictItem'
                : item.action === 'error' ? 'errorItem'
                  : (mode === 'copy' ? 'newCopy' : 'newItem')
          const hint = item.action === 'local-edit' ? t('localEditHint') : item.action === 'conflict' ? t('conflictHint') : item.action === 'error' ? item.error : null
          return h('label', { className: 'dsh-caps-import-row', key: item.name },
            h('input', { type: 'checkbox', checked: selected.has(item.name), disabled: item.action === 'error', onChange: event => toggle(item.name, event.target.checked) }),
            h('div', { className: 'dsh-caps-import-meta' }, h('div', { className: 'dsh-caps-name-row' }, h('span', { className: 'dsh-caps-name' }, item.name), h('span', { className: 'dsh-caps-badge' }, t(actionKey))), h('div', { className: 'dsh-caps-import-source' }, item.target),
              hint ? h('div', { className: 'dsh-caps-help' }, hint) : null))
        })) : null,
        h('div', { className: 'dsh-caps-modal-actions' }, h('button', { className: 'dsh-caps-btn', onClick: () => onCancel() }, t('cancel')), h('button', { className: 'dsh-caps-btn dsh-caps-primary', disabled: busy || !selected.size, onClick: submit }, t('syncAction'))))
    }

    function Preferences({ value, onCancel, onSave, onDirtyChange, busy }) {
      const [draft, setDraft] = useState(value)
      const set = (key, next) => setDraft(old => ({ ...old, [key]: next }))
      useEffect(() => onDirtyChange(JSON.stringify(draft) !== JSON.stringify(value)), [draft, value, onDirtyChange])
      const submit = async event => { event.preventDefault(); if (await onSave(draft)) onCancel(true) }
      return h('form', { className: 'dsh-caps-form', onSubmit: submit },
        h('p', { className: 'dsh-caps-help' }, t('preferencesHint')),
        h('label', { className: 'dsh-caps-check' }, h('input', { type: 'checkbox', checked: draft.sidebarVisible, onChange: e => set('sidebarVisible', e.target.checked) }), t('sidebarVisible')),
        h(Field, { label: t('sidebarLabel') }, h('input', { className: 'dsh-caps-input', maxLength: 24, value: draft.sidebarLabel, onChange: e => set('sidebarLabel', e.target.value), required: true })),
        h(Field, { label: t('defaultTab') }, h('select', { className: 'dsh-caps-select', value: draft.defaultTab, onChange: e => set('defaultTab', e.target.value) }, h('option', { value: 'skills' }, t('skills')), h('option', { value: 'mcp' }, t('mcp')))),
        h('label', { className: 'dsh-caps-check' }, h('input', { type: 'checkbox', checked: draft.showDescriptions, onChange: e => set('showDescriptions', e.target.checked) }), t('showDescriptions')),
        h('label', { className: 'dsh-caps-check' }, h('input', { type: 'checkbox', checked: draft.compactRows, onChange: e => set('compactRows', e.target.checked) }), t('compactRows')),
        h('div', { className: 'dsh-caps-modal-actions' }, h('button', { type: 'button', className: 'dsh-caps-btn', onClick: () => onCancel() }, t('cancel')), h('button', { className: 'dsh-caps-btn dsh-caps-primary', disabled: busy }, t('save'))))
    }

    function Toggle({ checked, disabled, label, onChange }) {
      return h('button', { type: 'button', className: 'dsh-caps-switch', role: 'switch', 'aria-checked': checked, 'aria-label': label, title: label, disabled, onClick: () => onChange(!checked) })
    }

    function InfoTip({ title, children }) {
      const [open, setOpen] = useState(false)
      const tipId = React.useId() + '-tip'
      return h('span', { className: 'dsh-caps-info-wrap', onMouseEnter: () => setOpen(true), onMouseLeave: () => setOpen(false) },
        h('button', { type: 'button', className: 'dsh-caps-info', 'aria-label': title, 'aria-expanded': open, 'aria-controls': tipId, 'aria-describedby': open ? tipId : undefined, onFocus: () => setOpen(true), onBlur: () => setOpen(false), onClick: event => { event.stopPropagation(); setOpen(value => !value) } }, h(Icon, { name: 'help', size: 14 })),
        open ? h('span', { id: tipId, className: 'dsh-caps-tip', role: 'tooltip' }, h('strong', null, title), h('span', null, children)) : null)
    }

    function statusText(status) {
      const state = status?.state || 'unknown'
      const labels = { connected: 'connected', connecting: 'connecting', reconnecting: 'reconnecting', failed: 'failed', disabled: 'disabled', closed: 'closed', 'waiting-credentials': 'waiting' }
      return t(labels[state] || 'unknownStatus')
    }

    function CapabilityPanel({ cwd, preferenceStore }) {
      const prefs = React.useSyncExternalStore(preferenceStore.subscribe, preferenceStore.getSnapshot)
      const [tab, setTab] = useState(prefs.defaultTab)
      const [data, setData] = useState({ skills: [], mcp: [], workspaces: [], skillWarnings: [], update: null })
      const [query, setQuery] = useState('')
      const [loading, setLoading] = useState(true)
      const [error, setError] = useState('')
      const [notice, setNotice] = useState('')
      const [busy, setBusy] = useState('')
      const [modal, setModal] = useState(null)
      const [confirm, setConfirm] = useState(null)
      const [modalError, setModalError] = useState('')
      const [modalDirty, setModalDirty] = useState(false)
      const returnFocusRef = React.useRef(null)

      const load = useCallback(async (quiet = false) => {
        if (!quiet) setLoading(true)
        setError('')
        try {
          const params = new URLSearchParams()
          if (cwd) params.set('cwd', cwd)
          params.set('workspaces', tab === 'skills' ? '1' : '0')
          const next = await api('/state?' + params.toString())
          setData(next)
        } catch (err) { setError(t('loadFailed') + ': ' + err.message) } finally { setLoading(false) }
      }, [cwd, tab])
      useEffect(() => { load() }, [load])

      const perform = async (key, action, success, reload = true, errorTarget = 'page') => {
        setBusy(key); setError(''); setModalError(''); setNotice('')
        let result
        try { result = await action() }
        catch (err) { if (errorTarget === 'modal') setModalError(err.message); else setError(err.message); setBusy(''); return null }
        // The mutation has succeeded. A later refresh problem is shown by load()
        // in the page error area and must not make the user repeat the write.
        if (reload) await load(true)
        if (success) setNotice(typeof success === 'function' ? success(result) : success)
        setBusy('')
        return result || true
      }

      const update = data.update || {}
      const updateNotice = result => {
        if (!result) return ''
        if (result.state === 'available') return t('updateAvailable', { version: result.latest })
        if (result.state === 'current') return t('updateCurrent')
        if (result.state === 'updated') return t('updateDone', { version: result.latest })
        if (result.state === 'restart-required') return t('updateRestart', { version: result.latest })
        if (result.state === 'updating') return t('updatingVersion', { version: result.latest })
        if (result.state === 'unsupported') return result.error || t('updateUnsupported')
        if (result.state === 'failed') return t('updateFailed') + (result.error || '')
        return ''
      }
      const checkForUpdates = () => perform('update-check', () => api('/update/check', { body: {} }), updateNotice)
      const applyUpdate = version => perform('update-apply', () => api('/update/apply', { body: { version } }), updateNotice)
      const setAutoUpdate = enabled => perform('update-config', () => api('/update/config', { body: { autoUpdate: enabled } }), t('updateAutoSaved'))

      const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase()
        if (!needle) return data[tab] || []
        return (data[tab] || []).filter(item => [item.name, item.description, item.path, item.workspaceTitle, item.workspacePath, item.command, item.url, ...(item.args || [])].filter(Boolean).join(' ').toLowerCase().includes(needle))
      }, [data, tab, query])

      const openModal = next => {
        returnFocusRef.current = document.activeElement
        setModalDirty(false); setModalError(''); setModal(next)
      }
      const closeModal = (force = false) => {
        if (force !== true && modalDirty && !window.confirm(t('discardChanges'))) return
        setModal(null); setModalError(''); setModalDirty(false)
      }
      const skillCwd = item => item?.workspacePath || cwd
      const openSkillEdit = item => perform('read:' + item.path, async () => {
        const targetCwd = skillCwd(item)
        const result = await api('/skill?path=' + encodeURIComponent(item.path) + (targetCwd ? '&cwd=' + encodeURIComponent(targetCwd) : ''))
        openModal({ kind: 'skill-edit', item: { ...item, text: result.text } })
        return true
      }, '', false)
      const askDelete = (kind, item) => { returnFocusRef.current = document.activeElement; setConfirm({ kind, item }) }
      const doDelete = () => {
        const target = confirm
        setConfirm(null)
        if (target.kind === 'skill') return perform('delete:' + target.item.path, () => api('/skill/delete', { body: { path: target.item.path, cwd: skillCwd(target.item), confirm: true } }), result => t(result.unlinked ? 'unlinked' : 'deleted') + ': ' + result.trash)
        return perform('delete:' + target.item.name, () => api('/mcp/delete', { body: { name: target.item.name, confirm: true } }), result => t(result.standalone ? result.restartRequired ? 'mcpRemovedRestart' : 'mcpRemovedStandalone' : 'mcpDeleted'))
      }

      const renderSkill = item => {
        const readOnly = !item.writable
        return h('article', { className: 'dsh-caps-row' + (readOnly ? ' dsh-caps-row-readonly' : ''), key: item.id, 'aria-disabled': readOnly ? true : undefined },
          h('div', { className: 'dsh-caps-main' },
            h('div', { className: 'dsh-caps-name-row' }, h('span', { className: 'dsh-caps-name' }, item.name), h('span', { className: 'dsh-caps-badge' }, t(item.scope === 'project' ? (item.writable ? 'projectWritable' : 'projectReadonly') : 'user')), h('span', { className: 'dsh-caps-badge' }, t(item.form === 'file' ? 'file' : 'directory')), item.source === 'user-agents' ? h('span', { className: 'dsh-caps-badge' }, t('agentSource')) : item.source === 'user-dsh' ? h('span', { className: 'dsh-caps-badge' }, t('dshSource')) : null,
              item.workspaceTitle ? h('span', { className: 'dsh-caps-badge', title: item.workspacePath }, item.workspaceTitle) : null,
              item.crossWorkspace ? h(InfoTip, { title: t(item.writable ? 'workspaceImpactTitle' : 'workspaceReadonlyTitle') }, t(item.writable ? 'workspaceImpactHint' : 'workspaceReadonlyHint', { workspace: item.workspaceTitle })) : null),
            prefs.showDescriptions ? h('div', { className: 'dsh-caps-description' }, item.description || t('empty')) : null,
            item.error ? h('div', { className: 'dsh-caps-notice dsh-caps-error', role: 'alert' }, item.error) : null,
            h('div', { className: 'dsh-caps-path', title: item.path }, item.path)),
          h('div', { className: 'dsh-caps-row-actions' },
            h('span', { className: 'dsh-caps-status', 'data-state': item.enabled ? 'connected' : 'disabled' }, h('span', { className: 'dsh-caps-dot' }), t(item.enabled ? 'enabled' : 'disabled')),
            h(Toggle, { checked: item.enabled, disabled: !item.writable || Boolean(busy), label: t(item.enabled ? 'enabled' : 'disabled') + ': ' + item.name, onChange: enabled => perform('toggle:' + item.path, () => api('/skill/toggle', { body: { path: item.path, enabled, cwd: skillCwd(item) } }), t('updated')) }),
            h('button', { className: 'dsh-caps-btn', disabled: !item.writable || !item.enabled || Boolean(busy), onClick: () => openSkillEdit(item) }, t('edit')),
            h('button', { className: 'dsh-caps-btn dsh-caps-danger', disabled: !item.writable || Boolean(busy), onClick: () => askDelete('skill', item) }, t('remove'))))
      }

      const renderMcp = item => {
        const standalone = item.source === 'standalone'
        const descriptionId = 'dsh-caps-standalone-' + item.name
        const state = item.status?.state || (item.enabled ? 'connecting' : 'disabled')
        const summary = item.transport === 'stdio' ? [item.command, ...(item.args || [])].filter(Boolean).join(' ') : item.url
        return h('article', { className: 'dsh-caps-row', key: item.name },
          h('div', { className: 'dsh-caps-main' },
            h('div', { className: 'dsh-caps-name-row' }, h('span', { className: 'dsh-caps-name' }, item.name), item.transport ? h('span', { className: 'dsh-caps-badge' }, item.transport === 'stdio' ? 'stdio' : 'HTTP') : null,
              standalone ? h('span', { className: 'dsh-caps-badge' }, t('standalone')) : item.source === 'registered' ? h('span', { className: 'dsh-caps-badge', title: t('registeredHint') }, t('registered')) : null,
              state !== 'unknown' ? h('span', { className: 'dsh-caps-status', 'data-state': state }, h('span', { className: 'dsh-caps-dot' }), statusText(item.status)) : null,
              state === 'connected' ? h('span', { className: 'dsh-caps-badge' }, t('toolCount', { count: item.status.toolCount || 0 })) : null),
            prefs.showDescriptions ? h('div', { className: 'dsh-caps-description' }, summary || t(item.source === 'registered' ? 'registeredHint' : 'empty')) : null,
            standalone ? h('div', { className: 'dsh-caps-description', id: descriptionId }, t('standaloneHint')) : null,
            item.status?.lastError ? h('div', { className: 'dsh-caps-path', title: item.status.lastError }, item.status.lastError) : null),
          h('div', { className: 'dsh-caps-row-actions' }, h(React.Fragment, null,
            h(Toggle, { checked: item.enabled, disabled: item.canToggle !== true || Boolean(busy), label: t(item.enabled ? 'enabled' : 'disabled') + ': ' + item.name, onChange: enabled => perform('toggle:' + item.name, () => api('/mcp/toggle', { body: { name: item.name, enabled } }), result => t(result.restartRequired ? 'mcpRestartRequired' : 'updated')) }),
            standalone ? null : h('button', { className: 'dsh-caps-btn', disabled: Boolean(busy), onClick: () => perform('test:' + item.name, () => api('/mcp/test', { body: { name: item.name }, allowFailure: true }), result => {
              if (result.ok) return t('testOk', { count: result.toolNames?.length || 0 })
              setError(t('testFailed', { message: result.message || 'Unknown' }))
              return ''
            }, false) }, t('test')),
            standalone ? null : h('button', { className: 'dsh-caps-btn', disabled: Boolean(busy), onClick: () => perform('restart:' + item.name, () => api('/mcp/restart', { body: { name: item.name } }), t('restarted'), false) }, t('restart')),
            h('button', { className: 'dsh-caps-btn', disabled: !item.writable || Boolean(busy), onClick: () => openModal({ kind: 'mcp', item }) }, t('edit')),
            h('button', { className: 'dsh-caps-btn dsh-caps-danger', disabled: item.canDelete !== true || Boolean(busy), onClick: () => askDelete('mcp', item) }, t('remove')))))
      }

      const modalProps = { error: modalError, onClose: closeModal, returnFocus: returnFocusRef.current }
      const createSkillFromForm = async body => {
        let targetCwd = body.cwd
        if (body.scope === 'project' && body.workspaceMode === 'new') {
          const created = await api('/workspace/create', { body: { name: body.workspaceName, parent: body.workspaceParent } })
          targetCwd = created.workspace.path
        }
        return await api('/skill/create', { body: { ...body, cwd: targetCwd } })
      }
      const saveMcpFromForm = async body => {
        if (!Array.isArray(body.servers)) return await api('/mcp/save', { body })
        const saved = []
        try {
          for (const server of body.servers) saved.push(await api('/mcp/save', { body: server }))
        } catch (error) {
          await load(true)
          throw error
        }
        return { saved }
      }
      const activeModal = modal?.kind === 'skill-create' ? h(Modal, { ...modalProps, title: t('createSkillTitle') }, h(SkillCreate, { cwd, workspaces: data.workspaces || [], busy: Boolean(busy), onCancel: closeModal, onDirtyChange: setModalDirty, onSave: body => perform('create-skill', () => createSkillFromForm(body), t('created'), true, 'modal') }))
        : modal?.kind === 'skill-edit' ? h(Modal, { ...modalProps, title: t('editSkillTitle') + ': ' + modal.item.name, wide: true }, h(SkillEdit, { item: modal.item, busy: Boolean(busy), onCancel: closeModal, onDirtyChange: setModalDirty, onSave: text => perform('save-skill', () => api('/skill/update', { body: { path: modal.item.path, text, cwd: skillCwd(modal.item) } }), t('saved'), true, 'modal') }))
        : modal?.kind === 'skill-sync' ? h(Modal, { ...modalProps, title: t('syncTitle'), wide: true }, h(SkillSync, { busy: Boolean(busy), onCancel: closeModal, onSync: (names, mode) => perform('skill-sync', () => api('/skill/sync', { body: { names, mode } }), result => t('syncDone', { added: result.imported.length, updated: result.updated.length, skipped: result.skipped.length, failed: result.failed.length }) + (result.failed.length ? ' · ' + result.failed.map(item => item.name + ': ' + item.error).join('；') : '') + (result.stateError ? t('syncStateError') + result.stateError : '') + (result.backupDir ? ' · ' + result.backupDir : '')) }))
        : modal?.kind === 'mcp' ? h(Modal, { ...modalProps, title: t(modal.item ? 'editMcpTitle' : 'addMcpTitle') }, h(McpForm, { item: modal.item, busy: Boolean(busy), onCancel: closeModal, onDirtyChange: setModalDirty, onSave: body => perform('save-mcp', () => saveMcpFromForm(body), t('saved'), true, 'modal') }))
        : modal?.kind === 'mcp-import' ? h(Modal, { ...modalProps, title: t('importTitle'), wide: true }, h(McpImport, { busy: Boolean(busy), onCancel: closeModal, onImport: (selections, enabled) => perform('import-mcp', () => api('/mcp/import', { body: { selections, enabled } }), result => t('importDone', { added: result.imported.length, skipped: result.skipped.length }) + (result.errors.length ? t('sourceErrors', { count: result.errors.length }) : ''), true, 'modal') }))
        : null

      return h('div', { className: 'dsh-caps' + (prefs.compactRows ? ' dsh-caps-compact' : '') },
        h('style', null, CSS),
        h('div', { className: 'dsh-caps-shell', inert: (modal || confirm) ? '' : undefined, 'aria-hidden': (modal || confirm) ? true : undefined },
          h('header', { className: 'dsh-caps-header' },
            h('div', null, h('h1', { className: 'dsh-caps-title' }, t('title')), h('p', { className: 'dsh-caps-subtitle' }, t('subtitle'))),
            h('div', { className: 'dsh-caps-actions dsh-caps-update-actions' },
              update.current ? h('span', { className: 'dsh-caps-version', title: t('autoUpdateHint') }, 'v' + update.current) : null,
              h('label', { className: 'dsh-caps-check', title: t('autoUpdateHint') },
                h('input', { type: 'checkbox', checked: update.autoUpdate !== false, disabled: Boolean(busy) || update.state === 'updating' || update.supported === false, onChange: event => setAutoUpdate(event.target.checked) }),
                t('autoUpdate')),
              h('button', { className: 'dsh-caps-btn', disabled: Boolean(busy) || update.state === 'updating', onClick: checkForUpdates }, h(Icon, { name: 'refresh' }), t('checkUpdate')))),
          h('div', { className: 'dsh-caps-tabs' }, ['skills', 'mcp'].map(key => h('button', { key, 'aria-pressed': tab === key, className: 'dsh-caps-tab', onClick: () => setTab(key) }, t(key), h('span', { className: 'dsh-caps-count' }, (data[key] || []).length)))),
          h('div', { className: 'dsh-caps-toolbar' },
            h('div', { className: 'dsh-caps-search' }, h('span', { className: 'dsh-caps-search-icon' }, h(Icon, { name: 'search' })), h('input', { className: 'dsh-caps-input', type: 'search', value: query, onChange: e => setQuery(e.target.value), placeholder: t('search'), 'aria-label': t('search') })),
            h('button', { className: 'dsh-caps-btn', onClick: () => load(), disabled: loading }, h(Icon, { name: 'refresh' }), t('refresh')),
            tab === 'skills' ? h('button', { className: 'dsh-caps-btn', disabled: Boolean(busy), onClick: () => openModal({ kind: 'skill-sync' }) }, h(Icon, { name: 'sync' }), t('syncSkills'))
              : h('button', { className: 'dsh-caps-btn', onClick: () => openModal({ kind: 'mcp-import' }) }, h(Icon, { name: 'import' }), t('importMcp')),
            h('button', { className: 'dsh-caps-btn dsh-caps-primary', onClick: () => openModal(tab === 'skills' ? { kind: 'skill-create' } : { kind: 'mcp', item: null }) }, h(Icon, { name: 'plus' }), t(tab === 'skills' ? 'addSkill' : 'addMcp'))),
          error ? h('div', { className: 'dsh-caps-notice dsh-caps-error', role: 'alert' }, error) : null,
          notice ? h('div', { className: 'dsh-caps-notice', role: 'status' }, notice) : null,
          ['available', 'updating', 'failed', 'restart-required', 'updated'].includes(update.state) ? h('div', { className: 'dsh-caps-notice dsh-caps-update', role: 'status', 'aria-live': 'polite' },
            h('span', null, updateNotice(update)),
            update.state === 'available' || update.state === 'failed' ? h('button', { className: 'dsh-caps-btn dsh-caps-primary', disabled: Boolean(busy), onClick: () => update.latest ? applyUpdate(update.latest) : checkForUpdates() }, t('updateNow')) : null) : null,
          data.mcpError && tab === 'mcp' ? h('div', { className: 'dsh-caps-notice dsh-caps-error', role: 'alert' }, data.mcpError) : null,
          data.skillWarnings?.length && tab === 'skills' ? h('div', { className: 'dsh-caps-notice', role: 'status' }, t('workspaceScanWarnings') + ' ' + data.skillWarnings.map(item => item.workspaceTitle).join(', ')) : null,
          tab === 'skills' ? h('div', { className: 'dsh-caps-help', style: { marginBottom: '8px' } }, t('takeoverHint')) : null,
          tab === 'skills' && cwd ? h('div', { className: 'dsh-caps-help', style: { marginBottom: '12px' } }, t('readonlyHint')) : null,
          loading ? h('div', { className: 'dsh-caps-spinner' }, t('loading'))
            : h('div', { className: 'dsh-caps-list' }, filtered.length ? filtered.map(tab === 'skills' ? renderSkill : renderMcp) : (tab === 'mcp' && data.mcpError) ? null : h('div', { className: 'dsh-caps-empty' }, query ? t('noItems') : t(tab === 'skills' ? 'noSkills' : 'noMcp'))),
          tab === 'skills' && data.userSkillsRoot ? h('footer', { className: 'dsh-caps-foot' },
            h('span', { title: data.userSkillsRoot }, t('userSkillsDir') + ': ' + (data.home && data.userSkillsRoot.startsWith(data.home + '/') ? '~' + data.userSkillsRoot.slice(data.home.length) : data.userSkillsRoot))) : null),
        activeModal,
        confirm ? h(Modal, { title: t(confirm.kind === 'skill' ? 'deleteSkillTitle' : 'deleteMcpTitle'), onClose: () => setConfirm(null), returnFocus: returnFocusRef.current },
          h('p', null, confirm.item.name), h('p', { className: 'dsh-caps-help' }, t(confirm.kind === 'skill' ? 'deleteSkillText' : 'deleteMcpText')),
          confirm.kind === 'skill' && confirm.item.crossWorkspace ? h('div', { className: 'dsh-caps-notice' }, t('workspaceDeleteImpact', { workspace: confirm.item.workspaceTitle })) : null,
          h('div', { className: 'dsh-caps-modal-actions' }, h('button', { className: 'dsh-caps-btn', onClick: () => setConfirm(null), 'data-autofocus': true }, t('cancel')), h('button', { className: 'dsh-caps-btn dsh-caps-danger', onClick: doDelete }, t('confirmDelete')))) : null)
    }

    function SessionPage(props) {
      let cwd
      let sessionId
      if (typeof props.useSessions === 'function') {
        cwd = props.useSessions(state => {
          const current = state?.current
          return current && state?.byId?.[current]?.cwd
        })
        sessionId = props.useSessions(state => state?.current)
      }
      activeSessionId = sessionId || null
      useEffect(() => {
        activeSessionId = sessionId || null
        return () => { if (activeSessionId === sessionId) activeSessionId = null }
      }, [sessionId])
      return h(CapabilityPanel, { cwd, preferenceStore: props.preferenceStore })
    }

    function apply(ctx, config = {}) {
      const preferenceStore = createPreferenceStore({
        sidebarVisible: true,
        sidebarLabel: '技能与MCP',
        defaultTab: config.defaultTab === 'mcp' ? 'mcp' : 'skills',
        showDescriptions: true,
        compactRows: true,
      })
      ctx.effect(() => ctx.locale.register(NS, MESSAGES), 'capability-switch: locales')
      translate = ctx.locale.bind(NS)
      ctx.effect(() => {
        const disposeMain = ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL }, props => h(SessionPage, { ...props, preferenceStore })))
        const disposeSidebar = ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: PANEL, order: 6, label: '技能与MCP', locale: NS }, BrandIcon))
        return () => { disposeMain(); disposeSidebar() }
      }, 'capability-switch: slots')
    }

    return { apply, inject: ['slots', 'locale'] }
  },
})


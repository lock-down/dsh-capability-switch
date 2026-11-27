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
    let localeService = null

    const MESSAGES = {
      zh: {
        selectMcp: '选择 MCP {name}',
        mcpBatchDelete: '批量删除 MCP',
        mcpBatchDeleteTitle: '批量删除 MCP',
        mcpBatchDeleteText: '将从当前 DSH profile 删除选中的 {count} 个 MCP，运行中的连接会关闭。独立实例会先备份 profile 补丁。',
        mcpBatchDeleted: '已删除 {count} 个 MCP',
        mcpBatchDeletePartial: '已删除 {deleted} 个，{failed} 个失败：{errors}',
        mcpBatchRestart: '部分独立 MCP 需要重启 DSH 后完成卸载',
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
        autoUpdate: '自动更新', autoUpdateHint: '仅 npm 安装支持自动更新；会检查兼容的稳定版本并通过 DSH 插件管理器安装。', checkUpdate: '检查更新', checkingUpdate: '正在检查…',
        updateAvailable: '发现新版本', updateAvailableDetail: '最新版本 v{latest} · 当前版本 v{current}', updateNow: '更新到 v{version}', updatingVersion: '正在更新到 v{version}…', updateCurrent: '当前已是最新版本', updateCurrentDetail: '当前版本 v{version}', updateUnsupported: '当前安装方式不自动更新', updateFailed: '更新失败：', updateRestart: '已安装 v{version}，重启 DSH 后生效', updateDone: '已更新到 v{version}', updateAutoSaved: '自动更新设置已保存',
        userSkillsDir: '用户级技能目录', readonlyHint: '用户级和所有已注册工作区的 .agents 项目技能支持编辑、启停和删除；跨工作区修改会提示影响范围。',
        connected: '已连接', connecting: '连接中', reconnecting: '等待重连', failed: '连接失败', waiting: '等待凭据', closed: '已关闭',
        unknownStatus: '未知状态', toolCount: '{count} 个工具', invalidJson: 'JSON 格式不正确', empty: '暂无描述',
        importTitle: '从应用导入 MCP', importHelp: '只读扫描其他应用的用户级配置。请手动选择条目；默认导入为停用，不修改来源文件。预览后配置变化会拒绝导入。',
        noImports: '没有发现可导入的 MCP', existing: '已存在', importAction: '导入选中项', scanFailed: '扫描失败', conflict: '配置冲突',
        enableImports: '导入后立即启用', importEnableHint: '启用 stdio MCP 会启动对应的本机命令，请确认来源和命令可信。',
        syncTitle: '从 Agent 目录同步 Skills', syncHelp: '选择同步方式后，从 Agent 目录同步到 DSH。已有目标会先备份，再替换；Agent 来源目录保持不变。',
        syncMode: '同步方式', symlinkMode: '软链模式', symlinkHelp: 'Windows 需要开启开发者模式',
        copyMode: '复制模式', copyHelp: '占用更多空间，更新后会重新复制',
        copyImpact: '复制模式下编辑或删除只影响 DSH 副本，不会修改 Agent 源文件。', symlinkImpact: '软链接模式直接引用 Agent 源目录；之后在 DSH 中编辑或启停会修改源文件。',        syncAction: '确认同步', newItem: '建立链接', updateItem: '更新链接', newCopy: '复制', updateCopy: '更新副本', localEditItem: '本地已修改', conflictItem: '来源与副本均已变化', errorItem: '读取失败', localEditHint: 'DSH 副本在上次同步后被修改；同步会先备份再覆盖。', conflictHint: '来源和 DSH 副本都变化了；请确认是否覆盖本地副本。', unchangedItem: '链接正常', noChanges: '没有需要同步的变更', backupLocation: '备份目录', partialFailure: '部分条目失败',
        selectAll: '全选', clearAll: '全不选', selectedCount: '已选 {count} 项', modeSymlink: '软链', modeCopy: '复制', selectSkill: '选择技能 {name}', batchDelete: '批量删除', batchDeleteTitle: '批量删除技能', batchDeleteText: '将删除选中的 {count} 个技能。软链同步技能只移除 DSH 链接，Agent 源文件保持不变；其他技能会移入 DSH 回收目录。', batchDeletePartial: '已删除 {deleted} 个，{failed} 个失败：{errors}', batchDeleted: '已删除 {count} 个技能', deleteSelected: '删除选中的 {count} 项',
        zipDrop: '拖入 .zip 技能包，或点击选择文件', zipHint: '支持根目录或单层目录包含 SKILL.md 的技能包，最大 8 MiB；包内文件会一并导入。', zipParsing: '正在解析技能包…', zipParsed: '已解析技能包', zipFiles: '{count} 个文件', zipRemove: '移除技能包', zipLocked: 'ZIP 包按 SKILL.md 原样导入；名称、描述和正文不可在此修改。', zipImport: '导入技能包', zipError: '技能包解析失败：', zipTooLarge: 'ZIP 文件不能超过 8 MiB', zipInvalid: '请选择 .zip 文件', zipImported: '已导入技能包 {name}（{count} 个文件）',
        releaseNotes: '版本说明', releaseTitle: '版本与更新', releaseLoading: '正在读取 Release 说明…', releaseEmpty: '暂无 Release 说明', releaseFailed: '读取 Release 说明失败：', releaseLatest: '最新 Release', releaseHistory: '历史版本', releaseCurrent: '当前版本 v{version}', releasePublished: '发布于 {date}', releasePrerelease: '预发布', releaseRetry: '重试', releaseRefresh: '刷新说明', releaseOpen: '在 GitHub 查看', releaseView: '查看更新说明', takeoverHint: '技能接管已启用（所有模式）：仅隐藏全局 Agent 目录；DSH 用户技能和项目级技能仍会扫描加载。全局 Agent 目录仅用于同步。',
        standaloneHint: '独立 MCP 可在本插件中编辑连接参数、启停或删除。', registeredHint: '由其他 DSH 插件动态注册。',
      },
      en: {
        selectMcp: 'Select MCP {name}',
        mcpBatchDelete: 'Delete MCPs',
        mcpBatchDeleteTitle: 'Delete MCPs',
        mcpBatchDeleteText: 'Removes the {count} selected MCPs from the active DSH profile and closes any running connections. Standalone instances back up the profile patch first.',
        mcpBatchDeleted: 'Deleted {count} MCPs',
        mcpBatchDeletePartial: 'Deleted {deleted}; {failed} failed: {errors}',
        mcpBatchRestart: 'Some standalone MCPs need a DSH restart to finish unloading.',
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
        autoUpdate: 'Auto update', autoUpdateHint: 'Only npm installs auto-update; compatible stable releases are installed through the DSH plugin manager.', checkUpdate: 'Check for updates', checkingUpdate: 'Checking…',
        updateAvailable: 'New version available', updateAvailableDetail: 'Latest v{latest} · Current v{current}', updateNow: 'Update to v{version}', updatingVersion: 'Updating to v{version}…', updateCurrent: 'You are on the latest version', updateCurrentDetail: 'Current version v{version}', updateUnsupported: 'This install cannot auto-update', updateFailed: 'Update failed: ', updateRestart: 'Version v{version} is installed; restart DSH to apply', updateDone: 'Updated to v{version}', updateAutoSaved: 'Auto-update setting saved',
        userSkillsDir: 'User skill directory', readonlyHint: 'User and .agents project skills in every registered workspace support editing, toggling, and deletion; cross-workspace edits show their impact.',
        connected: 'Connected', connecting: 'Connecting', reconnecting: 'Reconnecting', failed: 'Failed', waiting: 'Waiting for credentials', closed: 'Closed',
        unknownStatus: 'Unknown status', toolCount: '{count} tools', invalidJson: 'Invalid JSON', empty: 'No description',
        importTitle: 'Import MCP from apps', importHelp: 'Reads user-level configs without changing them. Select entries manually; imports are disabled by default. A changed source invalidates the preview.',
        noImports: 'No importable MCP servers found', existing: 'Already exists', importAction: 'Import selected', scanFailed: 'Scan failed', conflict: 'Conflicting configs',
        enableImports: 'Enable immediately after import', importEnableHint: 'Enabling a stdio MCP starts its local command. Only enable sources and commands you trust.',
        syncTitle: 'Sync Skills from Agent directory', syncHelp: 'Choose a sync mode to copy skills from the Agent directory into DSH. Existing targets are backed up before replacement; Agent sources are unchanged.',
        syncMode: 'Sync mode', symlinkMode: 'Symlink mode', symlinkHelp: 'Windows requires Developer Mode',
        copyMode: 'Copy mode', copyHelp: 'Uses more space; copies are recreated on updates',
        copyImpact: 'Copy mode edits and deletes only the DSH copy; Agent source files stay unchanged.', symlinkImpact: 'Symlink mode references the Agent source directly; later edits or toggles in DSH modify the source files.',
        syncAction: 'Confirm sync', newItem: 'Create link', updateItem: 'Update link', newCopy: 'Copy', updateCopy: 'Update copy', localEditItem: 'Locally modified', conflictItem: 'Both changed', errorItem: 'Read failed', localEditHint: 'The DSH copy changed since the last sync; syncing backs it up before replacing it.', conflictHint: 'The source and DSH copy both changed; confirm before overwriting the local copy.', unchangedItem: 'Linked', noChanges: 'No changes to synchronize', backupLocation: 'Backup directory', partialFailure: 'Some items failed',
        selectAll: 'Select all', clearAll: 'Clear all', selectedCount: '{count} selected', modeSymlink: 'Symlink', modeCopy: 'Copy', selectSkill: 'Select {name}', batchDelete: 'Delete selected', batchDeleteTitle: 'Delete skills', batchDeleteText: 'Deletes the {count} selected skills. Symlinked skills remove only the DSH link and keep the Agent source; other skills move to the DSH trash directory.', batchDeletePartial: 'Deleted {deleted}; {failed} failed: {errors}', batchDeleted: 'Deleted {count} skills', deleteSelected: 'Delete {count} selected',
        zipDrop: 'Drop a .zip skill package, or click to choose a file', zipHint: 'Supports a skill package with SKILL.md at the root or in one top-level folder, up to 8 MiB; companion files import together.', zipParsing: 'Parsing skill package…', zipParsed: 'Skill package parsed', zipFiles: '{count} files', zipRemove: 'Remove package', zipLocked: 'ZIP packages import SKILL.md as-is; name, description, and body cannot be edited here.', zipImport: 'Import package', zipError: 'Could not parse the skill package: ', zipTooLarge: 'ZIP files cannot exceed 8 MiB', zipInvalid: 'Choose a .zip file', zipImported: 'Imported {name} ({count} files)',
        releaseNotes: 'Release notes', releaseTitle: 'Version and releases', releaseLoading: 'Reading release notes…', releaseEmpty: 'No release notes available', releaseFailed: 'Could not read release notes: ', releaseLatest: 'Latest release', releaseHistory: 'Earlier releases', releaseCurrent: 'Current version v{version}', releasePublished: 'Published {date}', releasePrerelease: 'Pre-release', releaseRetry: 'Retry', releaseRefresh: 'Refresh notes', releaseOpen: 'View on GitHub', releaseView: 'View release notes', takeoverHint: 'Skill takeover is active in every mode: only the global Agent directory is hidden; DSH user and project skills still load. The global Agent directory is used only for sync.',
        standaloneHint: 'Standalone MCP connection settings can be edited, enabled, disabled, or deleted here.', registeredHint: 'Dynamically registered by another DSH plugin.',
      },
      de: {
      "selectMcp": "{name} auswählen",
      "mcpBatchDelete": "MCPs löschen",
      "mcpBatchDeleteTitle": "MCPs löschen",
      "mcpBatchDeleteText": "Entfernt die {count} ausgewählten MCPs aus dem aktiven DSH-Profil und schließt laufende Verbindungen. Bei eigenständigen Instanzen wird zuvor der Profil-Patch gesichert.",
      "mcpBatchDeleted": "{count} MCPs gelöscht",
      "mcpBatchDeletePartial": "{deleted} gelöscht; {failed} fehlgeschlagen: {errors}",
      "mcpBatchRestart": "Einige eigenständige MCPs erfordern einen DSH-Neustart, um das Entladen abzuschließen.",
      "nav": "Fähigkeiten",
      "title": "Skills & MCP",
      "subtitle": "Lokale Skills und MCP-Server im aktiven DSH-Profil verwalten.",
      "search": "Namen, Beschreibungen, Befehle oder Pfade durchsuchen",
      "refresh": "Aktualisieren",
      "addSkill": "Neuer Skill",
      "addMcp": "MCP hinzufügen",
      "syncSkills": "Aus Agent-Verzeichnis synchronisieren",
      "importMcp": "Aus Apps importieren",
      "display": "Anzeigeeinstellungen",
      "enabled": "Aktiviert",
      "disabled": "Deaktiviert",
      "edit": "Bearbeiten",
      "remove": "Löschen",
      "test": "Verbindung testen",
      "restart": "Neu verbinden",
      "user": "Benutzer",
      "projectWritable": "Projekt",
      "projectReadonly": "Projekt (schreibgeschützt)",
      "directory": "Verzeichnis",
      "file": "Einzeldatei",
      "noItems": "Keine passenden Einträge",
      "noSkills": "Keine Benutzer-Skills installiert",
      "noMcp": "Keine MCP-Server konfiguriert",
      "agentSource": "Agent-Verzeichnis",
      "dshSource": "DSH-Verzeichnis",
      "standalone": "Eigenständig",
      "registered": "Vom Plugin registriert",
      "runtimeUnmanaged": "Von einer eigenständigen Plugin-Instanz verwaltet",
      "readonly": "Schreibgeschützt",
      "loading": "Lokale Konfiguration wird gelesen…",
      "creating": "Wird erstellt…",
      "discardChanges": "Ungespeicherte Änderungen verwerfen und schließen?",
      "loadFailed": "Konfiguration konnte nicht gelesen werden",
      "retry": "Erneut versuchen",
      "save": "Speichern",
      "cancel": "Abbrechen",
      "close": "Schließen",
      "create": "Erstellen",
      "formMode": "Formular",
      "jsonMode": "JSON",
      "jsonHelp": "Akzeptiert ein mcpServers-Objekt oder eine einzelne Serverkonfiguration; neues JSON kann mehrere Server auf einmal anlegen.",
      "jsonOneServer": "Beim Bearbeiten ist genau ein MCP-Server in JSON erlaubt",
      "jsonNameFixed": "Der MCP-Name kann beim Bearbeiten nicht geändert werden; aktueller Name:",
      "mode": "Editor",
      "standaloneEditHint": "Eigenständige Verbindungseinstellungen sind hier bearbeitbar; zum Aktivieren den Schalter verwenden.",
      "transportHttp": "SSE / Streamable HTTP",
      "transportHttpHelp": "DSH überträgt SSE-Streams über Streamable HTTP.",
      "workspaceImpactTitle": "Auswirkung dieser Änderung",
      "workspaceImpactHint": "Dies ändert Projektskills in {workspace}/.agents/skills direkt. Spätere Sitzungen in diesem Arbeitsbereich lesen den neuen Inhalt; laufende Sitzungen müssen eventuell neu geladen werden.",
      "workspaceReadonlyTitle": "Schreibgeschützter Skill",
      "workspaceReadonlyHint": "{workspace}/.dsh/skills wird von DSH verwaltet und ist schreibgeschützt.",
      "workspaceEditImpact": "Du bearbeitest einen Projektskill in {workspace}; spätere Sitzungen in diesem Arbeitsbereich lesen den neuen Inhalt.",
      "workspaceDeleteImpact": "Das Löschen betrifft spätere Sitzungen in {workspace}, die diesen Skill verwenden.",
      "workspaceScanWarnings": "Einige Skill-Verzeichnisse in Arbeitsbereichen konnten nicht gelesen werden; andere Arbeitsbereiche bleiben verfügbar.",
      "name": "Name",
      "description": "Beschreibung",
      "body": "Inhalt",
      "content": "SKILL.md-Inhalt",
      "path": "Pfad",
      "transport": "Transport",
      "command": "Befehl",
      "args": "Argumente (eines pro Zeile)",
      "cwd": "Arbeitsverzeichnis (optional)",
      "env": "Umgebung (JSON-Objekt)",
      "url": "Server-URL",
      "headers": "Header (JSON-Objekt)",
      "enableNow": "Nach dem Speichern aktivieren",
      "createSkillTitle": "Neuer Skill",
      "editSkillTitle": "Skill bearbeiten",
      "editMcpTitle": "MCP bearbeiten",
      "addMcpTitle": "MCP hinzufügen",
      "scope": "Skill-Bereich",
      "userScope": "Benutzer",
      "projectScope": "Projekt",
      "projectScopeHelp": "Projektskills werden in .agents/skills des ausgewählten Arbeitsbereichs geschrieben.",
      "workspace": "Arbeitsbereich",
      "workspaceHelp": "Projektskills werden in .agents/skills des ausgewählten Arbeitsbereichs geschrieben.",
      "existingWorkspace": "Vorhandener Arbeitsbereich",
      "newWorkspace": "Neuer Arbeitsbereich",
      "selectWorkspace": "Arbeitsbereich auswählen",
      "workspaceName": "Name des Arbeitsbereichs",
      "workspaceParent": "Übergeordnetes Verzeichnis",
      "workspaceParentHelp": "Standardmäßig ~/Documents. ~-Pfade werden unterstützt.",
      "newWorkspaceHint": "Das Verzeichnis wird erstellt und als DSH-Arbeitsbereich registriert.",
      "workspaceRequired": "Wähle oder erstelle einen Arbeitsbereich.",
      "currentWorkspace": "Arbeitsbereich der aktuellen Sitzung",
      "skillNameHelp": "Kleinbuchstaben, Ziffern, Bindestriche oder Unterstriche; wird als Verzeichnisname verwendet.",
      "mcpNameHelp": "1–32 Buchstaben, Ziffern, Bindestriche oder Unterstriche; beim Bearbeiten unveränderlich.",
      "deleteSkillTitle": "Skill löschen",
      "deleteMcpTitle": "MCP löschen",
      "deleteSkillText": "Beim Löschen eines synchronisierten Skills wird nur der DSH-Symlink entfernt; die Agent-Quelle bleibt erhalten. Lokal erstellte Skills oder echte Verzeichnisse werden in den DSH-Papierkorb verschoben.",
      "deleteMcpText": "Entfernt den MCP aus dem aktiven DSH-Profil und schließt die laufende Verbindung.",
      "confirmDelete": "Löschen",
      "saved": "Gespeichert",
      "created": "Erstellt",
      "deleted": "In den Papierkorb verschoben",
      "unlinked": "DSH-Symlink entfernt; die Agent-Quelle wurde nicht gelöscht",
      "mcpDeleted": "Aus der aktiven Konfiguration entfernt",
      "mcpRemovedStandalone": "Eigenständiger MCP gelöscht; die Plugin-Konfigurationsänderung wurde gespeichert",
      "mcpRemovedRestart": "Eigenständiger MCP gelöscht; DSH neu starten, um das Entladen abzuschließen",
      "mcpRestartRequired": "Gespeichert; DSH neu starten, um die Änderung anzuwenden",
      "updated": "Konfiguration aktualisiert",
      "testOk": "Verbunden; {count} Tools gefunden",
      "testFailed": "Verbindungstest fehlgeschlagen: {message}",
      "restarted": "Neuverbindung gestartet",
      "syncDone": "Skills synchronisiert: {added} hinzugefügt, {updated} aktualisiert, {skipped} unverändert, {failed} fehlgeschlagen",
      "syncStateError": "; Synchronisierungsstatus konnte nicht gespeichert werden: ",
      "importDone": "MCP-Import abgeschlossen: {added} hinzugefügt, {skipped} übersprungen",
      "sourceErrors": "; {count} Quellen konnten nicht gelesen werden",
      "autoUpdate": "Automatische Aktualisierung",
      "autoUpdateHint": "Nur npm-Installationen aktualisieren sich automatisch; kompatible stabile Releases werden über den DSH-Plugin-Manager installiert.",
      "checkUpdate": "Nach Updates suchen",
      "checkingUpdate": "Wird geprüft…",
      "updateAvailable": "Neue Version verfügbar",
      "updateAvailableDetail": "Neueste v{latest} · Aktuell v{current}",
      "updateNow": "Auf v{version} aktualisieren",
      "updatingVersion": "Aktualisierung auf v{version}…",
      "updateCurrent": "Du verwendest die neueste Version",
      "updateCurrentDetail": "Aktuelle Version v{version}",
      "updateUnsupported": "Diese Installation kann sich nicht automatisch aktualisieren",
      "updateFailed": "Aktualisierung fehlgeschlagen: ",
      "updateRestart": "Version v{version} ist installiert; DSH neu starten, um sie anzuwenden",
      "updateDone": "Auf v{version} aktualisiert",
      "updateAutoSaved": "Einstellung für automatische Aktualisierung gespeichert",
      "userSkillsDir": "Benutzer-Skill-Verzeichnis",
      "readonlyHint": "Benutzer- und .agents-Projektskills in jedem registrierten Arbeitsbereich können bearbeitet, umgeschaltet und gelöscht werden; bearbeitungsübergreifende Änderungen zeigen ihre Auswirkung.",
      "connected": "Verbunden",
      "connecting": "Verbindung wird hergestellt",
      "reconnecting": "Neuverbindung",
      "failed": "Fehlgeschlagen",
      "waiting": "Warten auf Anmeldedaten",
      "closed": "Geschlossen",
      "unknownStatus": "Unbekannter Status",
      "toolCount": "{count} Tools",
      "invalidJson": "Ungültiges JSON",
      "empty": "Keine Beschreibung",
      "importTitle": "MCP aus Apps importieren",
      "importHelp": "Liest Benutzerkonfigurationen, ohne sie zu ändern. Einträge manuell auswählen; Importe sind standardmäßig deaktiviert. Eine geänderte Quelle macht die Vorschau ungültig.",
      "noImports": "Keine importierbaren MCP-Server gefunden",
      "existing": "Bereits vorhanden",
      "importAction": "Ausgewählte importieren",
      "scanFailed": "Scan fehlgeschlagen",
      "conflict": "Konfigurationskonflikt",
      "enableImports": "Nach dem Import sofort aktivieren",
      "importEnableHint": "Das Aktivieren eines stdio-MCP startet seinen lokalen Befehl. Nur vertrauenswürdige Quellen und Befehle aktivieren.",
      "syncTitle": "Skills aus Agent-Verzeichnis synchronisieren",
      "syncHelp": "Wähle einen Synchronisierungsmodus, um Skills aus dem Agent-Verzeichnis in DSH zu übernehmen. Vorhandene Ziele werden vor dem Ersetzen gesichert; Agent-Quellen bleiben unverändert.",
      "syncMode": "Synchronisierungsmodus",
      "symlinkMode": "Symlink-Modus",
      "symlinkHelp": "Windows erfordert den Entwicklermodus",
      "copyMode": "Kopiermodus",
      "copyHelp": "Benötigt mehr Speicherplatz; Kopien werden bei Aktualisierungen neu erstellt",
      "copyImpact": "Der Kopiermodus bearbeitet und löscht nur die DSH-Kopie; Agent-Quelldateien bleiben unverändert.",
      "symlinkImpact": "Der Symlink-Modus verweist direkt auf die Agent-Quelle; spätere Bearbeitungen oder Umschaltungen in DSH ändern die Quelldateien.",
      "syncAction": "Synchronisierung bestätigen",
      "newItem": "Link erstellen",
      "updateItem": "Link aktualisieren",
      "newCopy": "Kopieren",
      "updateCopy": "Kopie aktualisieren",
      "localEditItem": "Lokal geändert",
      "conflictItem": "Beide geändert",
      "errorItem": "Lesen fehlgeschlagen",
      "localEditHint": "Die DSH-Kopie hat sich seit der letzten Synchronisierung geändert; beim Synchronisieren wird sie vor dem Ersetzen gesichert.",
      "conflictHint": "Quelle und DSH-Kopie haben sich beide geändert; vor dem Überschreiben der lokalen Kopie bestätigen.",
      "unchangedItem": "Verknüpft",
      "noChanges": "Keine Änderungen zu synchronisieren",
      "backupLocation": "Sicherungsverzeichnis",
      "partialFailure": "Einige Elemente fehlgeschlagen",
      "selectAll": "Alle auswählen",
      "clearAll": "Auswahl aufheben",
      "selectedCount": "{count} ausgewählt",
      "modeSymlink": "Symlink",
      "modeCopy": "Kopie",
      "selectSkill": "{name} auswählen",
      "batchDelete": "Auswahl löschen",
      "batchDeleteTitle": "Skills löschen",
      "batchDeleteText": "Löscht die {count} ausgewählten Skills. Bei Symlink-Skills wird nur der DSH-Link entfernt und die Agent-Quelle bleibt erhalten; andere Skills werden in den DSH-Papierkorb verschoben.",
      "batchDeletePartial": "{deleted} gelöscht; {failed} fehlgeschlagen: {errors}",
      "batchDeleted": "{count} Skills gelöscht",
      "deleteSelected": "{count} ausgewählte löschen",
      "zipDrop": "ZIP-Skill-Paket hier ablegen oder klicken, um eine Datei auszuwählen",
      "zipHint": "Unterstützt ein Skill-Paket mit SKILL.md im Stamm oder in einem obersten Ordner, bis 8 MiB; Begleitdateien werden mit importiert.",
      "zipParsing": "Skill-Paket wird analysiert…",
      "zipParsed": "Skill-Paket analysiert",
      "zipFiles": "{count} Dateien",
      "zipRemove": "Paket entfernen",
      "zipLocked": "ZIP-Pakete importieren SKILL.md unverändert; Name, Beschreibung und Inhalt können hier nicht bearbeitet werden.",
      "zipImport": "Paket importieren",
      "zipError": "Skill-Paket konnte nicht analysiert werden: ",
      "zipTooLarge": "ZIP-Dateien dürfen 8 MiB nicht überschreiten",
      "zipInvalid": "Wähle eine ZIP-Datei",
      "zipImported": "{name} importiert ({count} Dateien)",
      "releaseNotes": "Release-Hinweise",
      "releaseTitle": "Version und Releases",
      "releaseLoading": "Release-Hinweise werden gelesen…",
      "releaseEmpty": "Keine Release-Hinweise verfügbar",
      "releaseFailed": "Release-Hinweise konnten nicht gelesen werden: ",
      "releaseLatest": "Neuestes Release",
      "releaseHistory": "Frühere Releases",
      "releaseCurrent": "Aktuelle Version v{version}",
      "releasePublished": "Veröffentlicht am {date}",
      "releasePrerelease": "Vorabversion",
      "releaseRetry": "Erneut versuchen",
      "releaseRefresh": "Hinweise aktualisieren",
      "releaseOpen": "Auf GitHub ansehen",
      "releaseView": "Release-Hinweise ansehen",
      "takeoverHint": "Die Skill-Übernahme ist in jedem Modus aktiv: Nur das globale Agent-Verzeichnis wird ausgeblendet; DSH-Benutzer- und Projektskills werden weiterhin geladen. Das globale Agent-Verzeichnis wird nur zur Synchronisierung verwendet.",
      "standaloneHint": "Eigenständige MCP-Verbindungseinstellungen können hier bearbeitet, aktiviert, deaktiviert oder gelöscht werden.",
      "registeredHint": "Dynamisch von einem anderen DSH-Plugin registriert.",
      "skills": "Skills",
      "mcp": "MCP"
      },
      es: {
      "selectMcp": "Seleccionar MCP {name}",
      "mcpBatchDelete": "Eliminar MCP",
      "mcpBatchDeleteTitle": "Eliminar MCP",
      "mcpBatchDeleteText": "Elimina los {count} MCP seleccionados del perfil DSH activo y cierra las conexiones en curso. En las instancias independientes se respalda antes el parche del perfil.",
      "mcpBatchDeleted": "Se eliminaron {count} MCP",
      "mcpBatchDeletePartial": "Eliminados {deleted}; {failed} fallidos: {errors}",
      "mcpBatchRestart": "Algunos MCP independientes necesitan reiniciar DSH para terminar de descargarse.",
      "nav": "Capacidades",
      "title": "Skills y MCP",
      "subtitle": "Gestiona skills locales y servidores MCP en el perfil activo de DSH.",
      "search": "Buscar nombres, descripciones, comandos o rutas",
      "refresh": "Actualizar",
      "addSkill": "Nuevo skill",
      "addMcp": "Añadir MCP",
      "syncSkills": "Sincronizar desde el directorio Agent",
      "importMcp": "Importar desde apps",
      "display": "Ajustes de visualización",
      "enabled": "Activado",
      "disabled": "Desactivado",
      "edit": "Editar",
      "remove": "Eliminar",
      "test": "Probar conexión",
      "restart": "Reconectar",
      "user": "Usuario",
      "projectWritable": "Proyecto",
      "projectReadonly": "Proyecto (solo lectura)",
      "directory": "Directorio",
      "file": "Archivo único",
      "noItems": "No hay entradas coincidentes",
      "noSkills": "No hay skills de usuario instalados",
      "noMcp": "No hay servidores MCP configurados",
      "agentSource": "Directorio Agent",
      "dshSource": "Directorio DSH",
      "standalone": "Independiente",
      "registered": "Registrado por plugin",
      "runtimeUnmanaged": "Gestionado por una instancia de plugin independiente",
      "readonly": "Solo lectura",
      "loading": "Leyendo la configuración local…",
      "creating": "Creando…",
      "discardChanges": "¿Descartar los cambios sin guardar y cerrar?",
      "loadFailed": "No se pudo leer la configuración",
      "retry": "Reintentar",
      "save": "Guardar",
      "cancel": "Cancelar",
      "close": "Cerrar",
      "create": "Crear",
      "formMode": "Formulario",
      "jsonMode": "JSON",
      "jsonHelp": "Acepta un objeto mcpServers o la configuración de un único servidor; el JSON nuevo puede crear varios servidores a la vez.",
      "jsonOneServer": "Al editar solo se acepta un servidor MCP en JSON",
      "jsonNameFixed": "El nombre del MCP no se puede cambiar al editar; nombre actual:",
      "mode": "Editor",
      "standaloneEditHint": "Los ajustes de conexión independientes se pueden editar aquí; usa el interruptor para activarlos.",
      "transportHttp": "SSE / Streamable HTTP",
      "transportHttpHelp": "DSH transporta los flujos SSE mediante Streamable HTTP.",
      "workspaceImpactTitle": "Impacto de este cambio",
      "workspaceImpactHint": "Esto modifica directamente los skills de proyecto en {workspace}/.agents/skills. Las sesiones posteriores de ese espacio de trabajo leerán el contenido nuevo; las sesiones en curso pueden necesitar recargarse.",
      "workspaceReadonlyTitle": "Skill de solo lectura",
      "workspaceReadonlyHint": "{workspace}/.dsh/skills lo gestiona DSH y es de solo lectura.",
      "workspaceEditImpact": "Estás editando un skill de proyecto en {workspace}; las sesiones posteriores de ese espacio de trabajo leerán el contenido nuevo.",
      "workspaceDeleteImpact": "Eliminarlo afecta a las sesiones posteriores de {workspace} que usen el skill.",
      "workspaceScanWarnings": "No se pudieron leer algunos directorios de skills de espacios de trabajo; los demás siguen disponibles.",
      "name": "Nombre",
      "description": "Descripción",
      "body": "Contenido",
      "content": "Contenido de SKILL.md",
      "path": "Ruta",
      "transport": "Transporte",
      "command": "Comando",
      "args": "Argumentos (uno por línea)",
      "cwd": "Directorio de trabajo (opcional)",
      "env": "Entorno (objeto JSON)",
      "url": "URL del servidor",
      "headers": "Cabeceras (objeto JSON)",
      "enableNow": "Activar después de guardar",
      "createSkillTitle": "Nuevo skill",
      "editSkillTitle": "Editar skill",
      "editMcpTitle": "Editar MCP",
      "addMcpTitle": "Añadir MCP",
      "scope": "Ámbito del skill",
      "userScope": "Usuario",
      "projectScope": "Proyecto",
      "projectScopeHelp": "Los skills de proyecto se escriben en .agents/skills del espacio de trabajo seleccionado.",
      "workspace": "Espacio de trabajo",
      "workspaceHelp": "Los skills de proyecto se escriben en .agents/skills del espacio de trabajo seleccionado.",
      "existingWorkspace": "Espacio de trabajo existente",
      "newWorkspace": "Nuevo espacio de trabajo",
      "selectWorkspace": "Seleccionar espacio de trabajo",
      "workspaceName": "Nombre del espacio de trabajo",
      "workspaceParent": "Directorio superior",
      "workspaceParentHelp": "Por defecto ~/Documents. Se admiten rutas con ~.",
      "newWorkspaceHint": "El directorio se crea y se registra como espacio de trabajo de DSH.",
      "workspaceRequired": "Selecciona o crea un espacio de trabajo.",
      "currentWorkspace": "Espacio de trabajo de la sesión actual",
      "skillNameHelp": "Letras minúsculas, números, guiones o guiones bajos; se usa como nombre del directorio.",
      "mcpNameHelp": "1–32 letras, números, guiones o guiones bajos; no se puede cambiar al editar.",
      "deleteSkillTitle": "Eliminar skill",
      "deleteMcpTitle": "Eliminar MCP",
      "deleteSkillText": "Al eliminar un skill sincronizado solo se quita el enlace simbólico de DSH y se conserva el origen Agent. Los skills creados localmente o los directorios reales se mueven a la papelera de DSH.",
      "deleteMcpText": "Elimina el MCP del perfil activo de DSH y cierra su conexión en curso.",
      "confirmDelete": "Eliminar",
      "saved": "Guardado",
      "created": "Creado",
      "deleted": "Movido a la papelera",
      "unlinked": "Se quitó el enlace simbólico de DSH; el origen Agent no se eliminó",
      "mcpDeleted": "Eliminado de la configuración activa",
      "mcpRemovedStandalone": "MCP independiente eliminado; el cambio de configuración del plugin se guardó",
      "mcpRemovedRestart": "MCP independiente eliminado; reinicia DSH para terminar de descargarlo",
      "mcpRestartRequired": "Guardado; reinicia DSH para aplicar los cambios",
      "updated": "Configuración actualizada",
      "testOk": "Conectado; se encontraron {count} herramientas",
      "testFailed": "Error en la prueba de conexión: {message}",
      "restarted": "Reconexión iniciada",
      "syncDone": "Skills sincronizados: {added} añadidos, {updated} actualizados, {skipped} sin cambios, {failed} fallidos",
      "syncStateError": "; no se pudo guardar el estado de sincronización: ",
      "importDone": "Importación de MCP completada: {added} añadidos, {skipped} omitidos",
      "sourceErrors": "; no se pudieron leer {count} fuentes",
      "autoUpdate": "Actualización automática",
      "autoUpdateHint": "Solo las instalaciones npm se actualizan automáticamente; las versiones estables compatibles se instalan mediante el gestor de plugins de DSH.",
      "checkUpdate": "Buscar actualizaciones",
      "checkingUpdate": "Comprobando…",
      "updateAvailable": "Nueva versión disponible",
      "updateAvailableDetail": "Última v{latest} · Actual v{current}",
      "updateNow": "Actualizar a v{version}",
      "updatingVersion": "Actualizando a v{version}…",
      "updateCurrent": "Ya tienes la última versión",
      "updateCurrentDetail": "Versión actual v{version}",
      "updateUnsupported": "Esta instalación no puede actualizarse automáticamente",
      "updateFailed": "Error de actualización: ",
      "updateRestart": "La versión v{version} está instalada; reinicia DSH para aplicarla",
      "updateDone": "Actualizado a v{version}",
      "updateAutoSaved": "Ajuste de actualización automática guardado",
      "userSkillsDir": "Directorio de skills de usuario",
      "readonlyHint": "Los skills de usuario y los skills de proyecto .agents de cada espacio de trabajo registrado se pueden editar, activar y eliminar; las ediciones entre espacios muestran su impacto.",
      "connected": "Conectado",
      "connecting": "Conectando",
      "reconnecting": "Reconectando",
      "failed": "Error",
      "waiting": "Esperando credenciales",
      "closed": "Cerrado",
      "unknownStatus": "Estado desconocido",
      "toolCount": "{count} herramientas",
      "invalidJson": "JSON no válido",
      "empty": "Sin descripción",
      "importTitle": "Importar MCP desde apps",
      "importHelp": "Lee configuraciones de usuario sin modificarlas. Selecciona las entradas manualmente; las importaciones se desactivan de forma predeterminada. Si la fuente cambia, la vista previa deja de ser válida.",
      "noImports": "No se encontraron servidores MCP importables",
      "existing": "Ya existe",
      "importAction": "Importar seleccionados",
      "scanFailed": "Error de escaneo",
      "conflict": "Configuraciones en conflicto",
      "enableImports": "Activar justo después de importar",
      "importEnableHint": "Activar un MCP stdio inicia su comando local. Activa solo fuentes y comandos de confianza.",
      "syncTitle": "Sincronizar skills desde el directorio Agent",
      "syncHelp": "Elige un modo de sincronización para copiar skills del directorio Agent a DSH. Los destinos existentes se respaldan antes de reemplazarlos; los orígenes Agent no cambian.",
      "syncMode": "Modo de sincronización",
      "symlinkMode": "Modo enlace simbólico",
      "symlinkHelp": "Windows requiere el Modo para desarrolladores",
      "copyMode": "Modo copia",
      "copyHelp": "Ocupa más espacio; las copias se recrean al actualizar",
      "copyImpact": "El modo copia solo edita y elimina la copia de DSH; los archivos de origen Agent no cambian.",
      "symlinkImpact": "El modo enlace simbólico hace referencia directa al origen Agent; las ediciones o activaciones posteriores en DSH modifican los archivos de origen.",
      "syncAction": "Confirmar sincronización",
      "newItem": "Crear enlace",
      "updateItem": "Actualizar enlace",
      "newCopy": "Copiar",
      "updateCopy": "Actualizar copia",
      "localEditItem": "Modificado localmente",
      "conflictItem": "Ambos cambiados",
      "errorItem": "Error de lectura",
      "localEditHint": "La copia de DSH cambió desde la última sincronización; al sincronizar se respalda antes de reemplazarla.",
      "conflictHint": "El origen y la copia de DSH cambiaron; confirma antes de sobrescribir la copia local.",
      "unchangedItem": "Vinculado",
      "noChanges": "No hay cambios que sincronizar",
      "backupLocation": "Directorio de respaldo",
      "partialFailure": "Algunos elementos fallaron",
      "selectAll": "Seleccionar todo",
      "clearAll": "Borrar selección",
      "selectedCount": "{count} seleccionados",
      "modeSymlink": "Enlace",
      "modeCopy": "Copia",
      "selectSkill": "Seleccionar {name}",
      "batchDelete": "Eliminar seleccionados",
      "batchDeleteTitle": "Eliminar skills",
      "batchDeleteText": "Elimina los {count} skills seleccionados. Los skills con enlace simbólico solo quitan el enlace de DSH y conservan el origen Agent; los demás se mueven a la papelera de DSH.",
      "batchDeletePartial": "{deleted} eliminados; {failed} fallidos: {errors}",
      "batchDeleted": "{count} skills eliminados",
      "deleteSelected": "Eliminar {count} seleccionados",
      "zipDrop": "Suelta un paquete de skill .zip o haz clic para elegir un archivo",
      "zipHint": "Admite un paquete con SKILL.md en la raíz o en una carpeta de primer nivel, hasta 8 MiB; los archivos adjuntos se importan juntos.",
      "zipParsing": "Analizando el paquete de skill…",
      "zipParsed": "Paquete analizado",
      "zipFiles": "{count} archivos",
      "zipRemove": "Quitar paquete",
      "zipLocked": "Los paquetes ZIP importan SKILL.md tal cual; el nombre, la descripción y el contenido no se pueden editar aquí.",
      "zipImport": "Importar paquete",
      "zipError": "No se pudo analizar el paquete: ",
      "zipTooLarge": "Los archivos ZIP no pueden superar 8 MiB",
      "zipInvalid": "Elige un archivo .zip",
      "zipImported": "{name} importado ({count} archivos)",
      "releaseNotes": "Notas de versión",
      "releaseTitle": "Versión y versiones",
      "releaseLoading": "Leyendo notas de versión…",
      "releaseEmpty": "No hay notas de versión disponibles",
      "releaseFailed": "No se pudieron leer las notas de versión: ",
      "releaseLatest": "Última versión",
      "releaseHistory": "Versiones anteriores",
      "releaseCurrent": "Versión actual v{version}",
      "releasePublished": "Publicado el {date}",
      "releasePrerelease": "Preversión",
      "releaseRetry": "Reintentar",
      "releaseRefresh": "Actualizar notas",
      "releaseOpen": "Ver en GitHub",
      "releaseView": "Ver notas de versión",
      "takeoverHint": "La toma de control de skills está activa en todos los modos: solo se oculta el directorio global Agent; los skills de usuario y de proyecto de DSH se siguen cargando. El directorio global Agent solo se usa para sincronizar.",
      "standaloneHint": "Los ajustes de conexión MCP independientes se pueden editar, activar, desactivar o eliminar aquí.",
      "registeredHint": "Registrado dinámicamente por otro plugin de DSH.",
      "skills": "Skills",
      "mcp": "MCP"
      },
      fr: {
      "selectMcp": "Sélectionner le MCP {name}",
      "mcpBatchDelete": "Supprimer des MCP",
      "mcpBatchDeleteTitle": "Supprimer des MCP",
      "mcpBatchDeleteText": "Supprime les {count} MCP sélectionnés du profil DSH actif et ferme les connexions en cours. Les instances autonomes sauvegardent d'abord le patch du profil.",
      "mcpBatchDeleted": "{count} MCP supprimés",
      "mcpBatchDeletePartial": "{deleted} supprimés ; {failed} échoués : {errors}",
      "mcpBatchRestart": "Certains MCP autonomes nécessitent un redémarrage de DSH pour terminer le déchargement.",
      "nav": "Capacités",
      "title": "Skills et MCP",
      "subtitle": "Gérez les skills locaux et les serveurs MCP du profil DSH actif.",
      "search": "Rechercher des noms, descriptions, commandes ou chemins",
      "refresh": "Actualiser",
      "addSkill": "Nouveau skill",
      "addMcp": "Ajouter un MCP",
      "syncSkills": "Synchroniser depuis le répertoire Agent",
      "importMcp": "Importer depuis les apps",
      "display": "Paramètres d'affichage",
      "enabled": "Activé",
      "disabled": "Désactivé",
      "edit": "Modifier",
      "remove": "Supprimer",
      "test": "Tester la connexion",
      "restart": "Reconnecter",
      "user": "Utilisateur",
      "projectWritable": "Projet",
      "projectReadonly": "Projet (lecture seule)",
      "directory": "Répertoire",
      "file": "Fichier unique",
      "noItems": "Aucune entrée correspondante",
      "noSkills": "Aucun skill utilisateur installé",
      "noMcp": "Aucun serveur MCP configuré",
      "agentSource": "Répertoire Agent",
      "dshSource": "Répertoire DSH",
      "standalone": "Autonome",
      "registered": "Enregistré par un plugin",
      "runtimeUnmanaged": "Géré par une instance de plugin autonome",
      "readonly": "Lecture seule",
      "loading": "Lecture de la configuration locale…",
      "creating": "Création…",
      "discardChanges": "Abandonner les modifications non enregistrées et fermer ?",
      "loadFailed": "Impossible de lire la configuration",
      "retry": "Réessayer",
      "save": "Enregistrer",
      "cancel": "Annuler",
      "close": "Fermer",
      "create": "Créer",
      "formMode": "Formulaire",
      "jsonMode": "JSON",
      "jsonHelp": "Accepte un objet mcpServers ou la configuration d'un seul serveur ; le nouveau JSON peut créer plusieurs serveurs à la fois.",
      "jsonOneServer": "La modification n'accepte qu'un seul serveur MCP en JSON",
      "jsonNameFixed": "Le nom du MCP ne peut pas être modifié pendant l'édition ; nom actuel :",
      "mode": "Éditeur",
      "standaloneEditHint": "Les paramètres de connexion autonomes sont modifiables ici ; utilisez l'interrupteur pour l'activation.",
      "transportHttp": "SSE / Streamable HTTP",
      "transportHttpHelp": "DSH transporte les flux SSE via Streamable HTTP.",
      "workspaceImpactTitle": "Impact de cette modification",
      "workspaceImpactHint": "Cela modifie directement les skills de projet dans {workspace}/.agents/skills. Les sessions ultérieures de cet espace de travail liront le nouveau contenu ; les sessions en cours devront peut-être être rechargées.",
      "workspaceReadonlyTitle": "Skill en lecture seule",
      "workspaceReadonlyHint": "{workspace}/.dsh/skills est géré par DSH et en lecture seule.",
      "workspaceEditImpact": "Vous modifiez un skill de projet dans {workspace} ; les sessions ultérieures de cet espace de travail liront le nouveau contenu.",
      "workspaceDeleteImpact": "La suppression affecte les sessions ultérieures de {workspace} qui utilisent ce skill.",
      "workspaceScanWarnings": "Certains répertoires de skills d'espaces de travail n'ont pas pu être lus ; les autres restent disponibles.",
      "name": "Nom",
      "description": "Description",
      "body": "Contenu",
      "content": "Contenu de SKILL.md",
      "path": "Chemin",
      "transport": "Transport",
      "command": "Commande",
      "args": "Arguments (un par ligne)",
      "cwd": "Répertoire de travail (facultatif)",
      "env": "Environnement (objet JSON)",
      "url": "URL du serveur",
      "headers": "En-têtes (objet JSON)",
      "enableNow": "Activer après l'enregistrement",
      "createSkillTitle": "Nouveau skill",
      "editSkillTitle": "Modifier le skill",
      "editMcpTitle": "Modifier le MCP",
      "addMcpTitle": "Ajouter un MCP",
      "scope": "Portée du skill",
      "userScope": "Utilisateur",
      "projectScope": "Projet",
      "projectScopeHelp": "Les skills de projet sont écrits dans .agents/skills de l'espace de travail sélectionné.",
      "workspace": "Espace de travail",
      "workspaceHelp": "Les skills de projet sont écrits dans .agents/skills de l'espace de travail sélectionné.",
      "existingWorkspace": "Espace de travail existant",
      "newWorkspace": "Nouvel espace de travail",
      "selectWorkspace": "Sélectionner un espace de travail",
      "workspaceName": "Nom de l'espace de travail",
      "workspaceParent": "Répertoire parent",
      "workspaceParentHelp": "Par défaut ~/Documents. Les chemins ~ sont pris en charge.",
      "newWorkspaceHint": "Le répertoire est créé et enregistré comme espace de travail DSH.",
      "workspaceRequired": "Sélectionnez ou créez un espace de travail.",
      "currentWorkspace": "Espace de travail de la session actuelle",
      "skillNameHelp": "Lettres minuscules, chiffres, traits d'union ou traits de soulignement ; utilisé comme nom de répertoire.",
      "mcpNameHelp": "1–32 lettres, chiffres, traits d'union ou traits de soulignement ; non modifiable pendant l'édition.",
      "deleteSkillTitle": "Supprimer le skill",
      "deleteMcpTitle": "Supprimer le MCP",
      "deleteSkillText": "La suppression d'un skill synchronisé retire uniquement le lien symbolique DSH et conserve la source Agent. Les skills créés localement ou les répertoires réels sont déplacés vers la corbeille DSH.",
      "deleteMcpText": "Supprime le MCP du profil DSH actif et ferme sa connexion en cours.",
      "confirmDelete": "Supprimer",
      "saved": "Enregistré",
      "created": "Créé",
      "deleted": "Déplacé vers la corbeille",
      "unlinked": "Lien symbolique DSH retiré ; la source Agent n'a pas été supprimée",
      "mcpDeleted": "Supprimé de la configuration active",
      "mcpRemovedStandalone": "MCP autonome supprimé ; la modification de configuration du plugin a été enregistrée",
      "mcpRemovedRestart": "MCP autonome supprimé ; redémarrez DSH pour terminer le déchargement",
      "mcpRestartRequired": "Enregistré ; redémarrez DSH pour appliquer",
      "updated": "Configuration mise à jour",
      "testOk": "Connecté ; {count} outils trouvés",
      "testFailed": "Échec du test de connexion : {message}",
      "restarted": "Reconnexion démarrée",
      "syncDone": "Skills synchronisés : {added} ajoutés, {updated} mis à jour, {skipped} inchangés, {failed} échoués",
      "syncStateError": " ; impossible d'enregistrer l'état de synchronisation : ",
      "importDone": "Importation MCP terminée : {added} ajoutés, {skipped} ignorés",
      "sourceErrors": " ; {count} sources n'ont pas pu être lues",
      "autoUpdate": "Mise à jour automatique",
      "autoUpdateHint": "Seules les installations npm se mettent à jour automatiquement ; les versions stables compatibles sont installées via le gestionnaire de plugins DSH.",
      "checkUpdate": "Rechercher des mises à jour",
      "checkingUpdate": "Vérification…",
      "updateAvailable": "Nouvelle version disponible",
      "updateAvailableDetail": "Dernière v{latest} · Actuelle v{current}",
      "updateNow": "Mettre à jour vers v{version}",
      "updatingVersion": "Mise à jour vers v{version}…",
      "updateCurrent": "Vous avez la dernière version",
      "updateCurrentDetail": "Version actuelle v{version}",
      "updateUnsupported": "Cette installation ne peut pas se mettre à jour automatiquement",
      "updateFailed": "Échec de la mise à jour : ",
      "updateRestart": "La version v{version} est installée ; redémarrez DSH pour l'appliquer",
      "updateDone": "Mis à jour vers v{version}",
      "updateAutoSaved": "Paramètre de mise à jour automatique enregistré",
      "userSkillsDir": "Répertoire des skills utilisateur",
      "readonlyHint": "Les skills utilisateur et les skills de projet .agents de chaque espace de travail enregistré peuvent être modifiés, activés et supprimés ; les modifications inter-espaces affichent leur impact.",
      "connected": "Connecté",
      "connecting": "Connexion",
      "reconnecting": "Reconnexion",
      "failed": "Échec",
      "waiting": "En attente des identifiants",
      "closed": "Fermé",
      "unknownStatus": "État inconnu",
      "toolCount": "{count} outils",
      "invalidJson": "JSON invalide",
      "empty": "Aucune description",
      "importTitle": "Importer un MCP depuis les apps",
      "importHelp": "Lit les configurations utilisateur sans les modifier. Sélectionnez les entrées manuellement ; les imports sont désactivés par défaut. Une source modifiée invalide l'aperçu.",
      "noImports": "Aucun serveur MCP importable trouvé",
      "existing": "Déjà présent",
      "importAction": "Importer la sélection",
      "scanFailed": "Échec de l'analyse",
      "conflict": "Configurations en conflit",
      "enableImports": "Activer juste après l'import",
      "importEnableHint": "Activer un MCP stdio démarre sa commande locale. N'activez que des sources et commandes de confiance.",
      "syncTitle": "Synchroniser les skills depuis le répertoire Agent",
      "syncHelp": "Choisissez un mode de synchronisation pour copier les skills du répertoire Agent vers DSH. Les cibles existantes sont sauvegardées avant remplacement ; les sources Agent ne changent pas.",
      "syncMode": "Mode de synchronisation",
      "symlinkMode": "Mode lien symbolique",
      "symlinkHelp": "Windows nécessite le mode développeur",
      "copyMode": "Mode copie",
      "copyHelp": "Occupe plus d'espace ; les copies sont recréées lors des mises à jour",
      "copyImpact": "Le mode copie ne modifie et ne supprime que la copie DSH ; les fichiers sources Agent restent inchangés.",
      "symlinkImpact": "Le mode lien symbolique référence directement la source Agent ; les modifications ou activations ultérieures dans DSH modifient les fichiers sources.",
      "syncAction": "Confirmer la synchronisation",
      "newItem": "Créer le lien",
      "updateItem": "Mettre à jour le lien",
      "newCopy": "Copier",
      "updateCopy": "Mettre à jour la copie",
      "localEditItem": "Modifié localement",
      "conflictItem": "Les deux ont changé",
      "errorItem": "Échec de lecture",
      "localEditHint": "La copie DSH a changé depuis la dernière synchronisation ; la synchronisation la sauvegarde avant de la remplacer.",
      "conflictHint": "La source et la copie DSH ont toutes deux changé ; confirmez avant d'écraser la copie locale.",
      "unchangedItem": "Lié",
      "noChanges": "Aucune modification à synchroniser",
      "backupLocation": "Répertoire de sauvegarde",
      "partialFailure": "Certains éléments ont échoué",
      "selectAll": "Tout sélectionner",
      "clearAll": "Tout désélectionner",
      "selectedCount": "{count} sélectionnés",
      "modeSymlink": "Lien",
      "modeCopy": "Copie",
      "selectSkill": "Sélectionner {name}",
      "batchDelete": "Supprimer la sélection",
      "batchDeleteTitle": "Supprimer des skills",
      "batchDeleteText": "Supprime les {count} skills sélectionnés. Les skills liés par symlink ne retirent que le lien DSH et conservent la source Agent ; les autres sont déplacés vers la corbeille DSH.",
      "batchDeletePartial": "{deleted} supprimés ; {failed} échoués : {errors}",
      "batchDeleted": "{count} skills supprimés",
      "deleteSelected": "Supprimer les {count} sélectionnés",
      "zipDrop": "Déposez un paquet de skill .zip ou cliquez pour choisir un fichier",
      "zipHint": "Prend en charge un paquet avec SKILL.md à la racine ou dans un dossier de premier niveau, jusqu'à 8 MiB ; les fichiers annexes sont importés ensemble.",
      "zipParsing": "Analyse du paquet…",
      "zipParsed": "Paquet analysé",
      "zipFiles": "{count} fichiers",
      "zipRemove": "Retirer le paquet",
      "zipLocked": "Les paquets ZIP importent SKILL.md tel quel ; le nom, la description et le contenu ne sont pas modifiables ici.",
      "zipImport": "Importer le paquet",
      "zipError": "Impossible d'analyser le paquet : ",
      "zipTooLarge": "Les fichiers ZIP ne doivent pas dépasser 8 MiB",
      "zipInvalid": "Choisissez un fichier .zip",
      "zipImported": "{name} importé ({count} fichiers)",
      "releaseNotes": "Notes de version",
      "releaseTitle": "Version et versions",
      "releaseLoading": "Lecture des notes de version…",
      "releaseEmpty": "Aucune note de version disponible",
      "releaseFailed": "Impossible de lire les notes de version : ",
      "releaseLatest": "Dernière version",
      "releaseHistory": "Versions précédentes",
      "releaseCurrent": "Version actuelle v{version}",
      "releasePublished": "Publié le {date}",
      "releasePrerelease": "Préversion",
      "releaseRetry": "Réessayer",
      "releaseRefresh": "Actualiser les notes",
      "releaseOpen": "Voir sur GitHub",
      "releaseView": "Voir les notes de version",
      "takeoverHint": "La prise en charge des skills est active dans tous les modes : seul le répertoire Agent global est masqué ; les skills utilisateur et de projet DSH continuent d'être chargés. Le répertoire Agent global ne sert qu'à la synchronisation.",
      "standaloneHint": "Les paramètres de connexion MCP autonomes peuvent être modifiés, activés, désactivés ou supprimés ici.",
      "registeredHint": "Enregistré dynamiquement par un autre plugin DSH.",
      "skills": "Skills",
      "mcp": "MCP"
      },
      ja: {
      "selectMcp": "MCP {name} を選択",
      "mcpBatchDelete": "MCP を削除",
      "mcpBatchDeleteTitle": "MCP を削除",
      "mcpBatchDeleteText": "選択した {count} 個の MCP をアクティブな DSH プロファイルから削除し、実行中の接続を閉じます。スタンドアロンインスタンスは先にプロファイルパッチをバックアップします。",
      "mcpBatchDeleted": "{count} 個の MCP を削除しました",
      "mcpBatchDeletePartial": "{deleted} 件削除、{failed} 件失敗: {errors}",
      "mcpBatchRestart": "一部のスタンドアロン MCP はアンロード完了に DSH の再起動が必要です。",
      "nav": "機能",
      "title": "Skills と MCP",
      "subtitle": "アクティブな DSH プロファイルのローカル Skills と MCP サーバーを管理します。",
      "search": "名前、説明、コマンド、パスを検索",
      "refresh": "更新",
      "addSkill": "新しい Skill",
      "addMcp": "MCP を追加",
      "syncSkills": "Agent ディレクトリから同期",
      "importMcp": "アプリからインポート",
      "display": "表示設定",
      "enabled": "有効",
      "disabled": "無効",
      "edit": "編集",
      "remove": "削除",
      "test": "接続テスト",
      "restart": "再接続",
      "user": "ユーザー",
      "projectWritable": "プロジェクト",
      "projectReadonly": "プロジェクト（読み取り専用）",
      "directory": "ディレクトリ",
      "file": "単一ファイル",
      "noItems": "一致する項目がありません",
      "noSkills": "ユーザー Skill がインストールされていません",
      "noMcp": "MCP サーバーが構成されていません",
      "agentSource": "Agent ディレクトリ",
      "dshSource": "DSH ディレクトリ",
      "standalone": "スタンドアロン",
      "registered": "プラグイン登録",
      "runtimeUnmanaged": "スタンドアロンのプラグインインスタンスが管理",
      "readonly": "読み取り専用",
      "loading": "ローカル構成を読み込み中…",
      "creating": "作成中…",
      "discardChanges": "未保存の変更を破棄して閉じますか？",
      "loadFailed": "構成を読み取れませんでした",
      "retry": "再試行",
      "save": "保存",
      "cancel": "キャンセル",
      "close": "閉じる",
      "create": "作成",
      "formMode": "フォーム",
      "jsonMode": "JSON",
      "jsonHelp": "mcpServers ラッパーまたは単一サーバー構成を受け付けます。新規 JSON では複数サーバーを一度に作成できます。",
      "jsonOneServer": "編集時の JSON は MCP サーバー 1 件のみです",
      "jsonNameFixed": "編集時に MCP 名は変更できません。現在の名前:",
      "mode": "エディター",
      "standaloneEditHint": "スタンドアロンの接続設定はここで編集できます。有効化はスイッチを使用します。",
      "transportHttp": "SSE / Streamable HTTP",
      "transportHttpHelp": "DSH は SSE ストリームを Streamable HTTP で転送します。",
      "workspaceImpactTitle": "この変更の影響",
      "workspaceImpactHint": "{workspace}/.agents/skills のプロジェクト Skill を直接変更します。このワークスペースの以後のセッションは新しい内容を読み込み、実行中のセッションは再読み込みが必要な場合があります。",
      "workspaceReadonlyTitle": "読み取り専用 Skill",
      "workspaceReadonlyHint": "{workspace}/.dsh/skills は DSH が管理しており、表示のみです。",
      "workspaceEditImpact": "{workspace} のプロジェクト Skill を編集しています。このワークスペースの以後のセッションは新しい内容を読み込みます。",
      "workspaceDeleteImpact": "削除すると、この Skill を使用する {workspace} の以後のセッションに影響します。",
      "workspaceScanWarnings": "一部のワークスペース Skill ディレクトリを読み取れませんでした。他のワークスペースは利用できます。",
      "name": "名前",
      "description": "説明",
      "body": "内容",
      "content": "SKILL.md の内容",
      "path": "パス",
      "transport": "トランスポート",
      "command": "コマンド",
      "args": "引数（1 行に 1 つ）",
      "cwd": "作業ディレクトリ（任意）",
      "env": "環境変数（JSON オブジェクト）",
      "url": "サーバー URL",
      "headers": "ヘッダー（JSON オブジェクト）",
      "enableNow": "保存後に有効化",
      "createSkillTitle": "新しい Skill",
      "editSkillTitle": "Skill を編集",
      "editMcpTitle": "MCP を編集",
      "addMcpTitle": "MCP を追加",
      "scope": "Skill の範囲",
      "userScope": "ユーザー",
      "projectScope": "プロジェクト",
      "projectScopeHelp": "プロジェクト Skill は選択したワークスペースの .agents/skills に書き込まれます。",
      "workspace": "ワークスペース",
      "workspaceHelp": "プロジェクト Skill は選択したワークスペースの .agents/skills に書き込まれます。",
      "existingWorkspace": "既存のワークスペース",
      "newWorkspace": "新しいワークスペース",
      "selectWorkspace": "ワークスペースを選択",
      "workspaceName": "ワークスペース名",
      "workspaceParent": "親ディレクトリ",
      "workspaceParentHelp": "既定は ~/Documents です。~ パスに対応します。",
      "newWorkspaceHint": "ディレクトリを作成し、DSH ワークスペースとして登録します。",
      "workspaceRequired": "ワークスペースを選択または作成してください。",
      "currentWorkspace": "現在のセッションのワークスペース",
      "skillNameHelp": "小文字、数字、ハイフン、アンダースコア。ディレクトリ名として使用されます。",
      "mcpNameHelp": "1〜32 文字の英数字、ハイフン、アンダースコア。編集中は変更できません。",
      "deleteSkillTitle": "Skill を削除",
      "deleteMcpTitle": "MCP を削除",
      "deleteSkillText": "同期した Skill を削除すると DSH のシンボリックリンクのみを削除し、Agent のソースは保持します。ローカルで作成した Skill や実ディレクトリは DSH のゴミ箱に移動します。",
      "deleteMcpText": "アクティブな DSH プロファイルから MCP を削除し、実行中の接続も閉じます。",
      "confirmDelete": "削除",
      "saved": "保存しました",
      "created": "作成しました",
      "deleted": "ゴミ箱に移動しました",
      "unlinked": "DSH のシンボリックリンクを削除しました。Agent のソースは削除されていません",
      "mcpDeleted": "アクティブな構成から削除しました",
      "mcpRemovedStandalone": "スタンドアロン MCP を削除しました。プラグイン構成の変更は保存されました",
      "mcpRemovedRestart": "スタンドアロン MCP を削除しました。DSH を再起動してアンロードを完了してください",
      "mcpRestartRequired": "保存しました。DSH を再起動して適用してください",
      "updated": "構成を更新しました",
      "testOk": "接続しました。{count} 個のツールを検出",
      "testFailed": "接続テストに失敗しました: {message}",
      "restarted": "再接続を開始しました",
      "syncDone": "Skills を同期しました: 追加 {added}、更新 {updated}、変更なし {skipped}、失敗 {failed}",
      "syncStateError": "。同期状態を保存できませんでした: ",
      "importDone": "MCP インポート完了: 追加 {added}、スキップ {skipped}",
      "sourceErrors": "。{count} 件のソースを読み取れませんでした",
      "autoUpdate": "自動更新",
      "autoUpdateHint": "自動更新は npm インストールのみ対象です。互換性のある安定版を DSH プラグインマネージャー経由でインストールします。",
      "checkUpdate": "更新を確認",
      "checkingUpdate": "確認中…",
      "updateAvailable": "新しいバージョンがあります",
      "updateAvailableDetail": "最新 v{latest} · 現在 v{current}",
      "updateNow": "v{version} に更新",
      "updatingVersion": "v{version} に更新中…",
      "updateCurrent": "最新バージョンです",
      "updateCurrentDetail": "現在のバージョン v{version}",
      "updateUnsupported": "このインストールは自動更新できません",
      "updateFailed": "更新に失敗しました: ",
      "updateRestart": "v{version} をインストールしました。DSH を再起動して適用してください",
      "updateDone": "v{version} に更新しました",
      "updateAutoSaved": "自動更新の設定を保存しました",
      "userSkillsDir": "ユーザー Skill ディレクトリ",
      "readonlyHint": "ユーザー Skill と、登録済み各ワークスペースの .agents プロジェクト Skill は編集・有効化・削除できます。ワークスペースをまたぐ変更は影響範囲を表示します。",
      "connected": "接続済み",
      "connecting": "接続中",
      "reconnecting": "再接続中",
      "failed": "失敗",
      "waiting": "認証情報を待機中",
      "closed": "閉じました",
      "unknownStatus": "不明な状態",
      "toolCount": "{count} 個のツール",
      "invalidJson": "JSON が正しくありません",
      "empty": "説明なし",
      "importTitle": "アプリから MCP をインポート",
      "importHelp": "ユーザーレベルの構成を変更せずに読み取ります。項目を手動で選択してください。インポートは既定で無効です。プレビュー後にソースが変わるとインポートを拒否します。",
      "noImports": "インポート可能な MCP サーバーが見つかりません",
      "existing": "既に存在",
      "importAction": "選択項目をインポート",
      "scanFailed": "スキャンに失敗しました",
      "conflict": "構成の競合",
      "enableImports": "インポート直後に有効化",
      "importEnableHint": "stdio MCP を有効にするとローカルコマンドが起動します。信頼できるソースとコマンドのみ有効にしてください。",
      "syncTitle": "Agent ディレクトリから Skills を同期",
      "syncHelp": "同期モードを選択して、Agent ディレクトリの Skills を DSH にコピーします。既存のターゲットは置換前にバックアップされ、Agent ソースは変更されません。",
      "syncMode": "同期モード",
      "symlinkMode": "シンボリックリンクモード",
      "symlinkHelp": "Windows では開発者モードが必要です",
      "copyMode": "コピーモード",
      "copyHelp": "容量を多く使用します。更新時にコピーを再作成します",
      "copyImpact": "コピーモードでは DSH のコピーのみを編集・削除し、Agent のソースファイルは変更しません。",
      "symlinkImpact": "シンボリックリンクモードは Agent ソースを直接参照します。以後 DSH で編集・切り替えるとソースファイルが変更されます。",
      "syncAction": "同期を確認",
      "newItem": "リンクを作成",
      "updateItem": "リンクを更新",
      "newCopy": "コピー",
      "updateCopy": "コピーを更新",
      "localEditItem": "ローカル変更あり",
      "conflictItem": "両方変更",
      "errorItem": "読み取り失敗",
      "localEditHint": "前回の同期後に DSH コピーが変更されています。同期時にバックアップしてから置き換えます。",
      "conflictHint": "ソースと DSH コピーの両方が変更されています。ローカルコピーを上書きする前に確認してください。",
      "unchangedItem": "リンク済み",
      "noChanges": "同期する変更はありません",
      "backupLocation": "バックアップディレクトリ",
      "partialFailure": "一部の項目が失敗しました",
      "selectAll": "すべて選択",
      "clearAll": "選択解除",
      "selectedCount": "{count} 件選択中",
      "modeSymlink": "リンク",
      "modeCopy": "コピー",
      "selectSkill": "{name} を選択",
      "batchDelete": "選択項目を削除",
      "batchDeleteTitle": "Skills を削除",
      "batchDeleteText": "選択した {count} 件の Skill を削除します。シンボリックリンクの Skill は DSH リンクのみを削除して Agent ソースを保持し、それ以外は DSH のゴミ箱に移動します。",
      "batchDeletePartial": "{deleted} 件削除、{failed} 件失敗: {errors}",
      "batchDeleted": "{count} 件の Skill を削除しました",
      "deleteSelected": "選択した {count} 件を削除",
      "zipDrop": ".zip Skill パッケージをドロップするか、クリックしてファイルを選択",
      "zipHint": "ルートまたは 1 階層のフォルダに SKILL.md を含むパッケージに対応します（最大 8 MiB）。同梱ファイルも一緒にインポートします。",
      "zipParsing": "Skill パッケージを解析中…",
      "zipParsed": "解析済み",
      "zipFiles": "{count} ファイル",
      "zipRemove": "パッケージを削除",
      "zipLocked": "ZIP パッケージは SKILL.md をそのままインポートします。名前、説明、内容はここで編集できません。",
      "zipImport": "パッケージをインポート",
      "zipError": "Skill パッケージを解析できませんでした: ",
      "zipTooLarge": "ZIP ファイルは 8 MiB 以下にしてください",
      "zipInvalid": ".zip ファイルを選択してください",
      "zipImported": "{name} をインポートしました（{count} ファイル）",
      "releaseNotes": "リリースノート",
      "releaseTitle": "バージョンとリリース",
      "releaseLoading": "リリースノートを読み込み中…",
      "releaseEmpty": "リリースノートはありません",
      "releaseFailed": "リリースノートを読み取れませんでした: ",
      "releaseLatest": "最新リリース",
      "releaseHistory": "過去のリリース",
      "releaseCurrent": "現在のバージョン v{version}",
      "releasePublished": "{date} 公開",
      "releasePrerelease": "プレリリース",
      "releaseRetry": "再試行",
      "releaseRefresh": "ノートを更新",
      "releaseOpen": "GitHub で表示",
      "releaseView": "リリースノートを表示",
      "takeoverHint": "Skill の引き継ぎはすべてのモードで有効です。グローバル Agent ディレクトリのみを非表示にし、DSH のユーザー Skill とプロジェクト Skill は引き続き読み込みます。グローバル Agent ディレクトリは同期にのみ使用します。",
      "standaloneHint": "スタンドアロン MCP の接続設定はここで編集、有効化、無効化、削除できます。",
      "registeredHint": "他の DSH プラグインによって動的に登録されています。",
      "skills": "Skills",
      "mcp": "MCP"
      },
      pt: {
      "selectMcp": "Selecionar MCP {name}",
      "mcpBatchDelete": "Excluir MCPs",
      "mcpBatchDeleteTitle": "Excluir MCPs",
      "mcpBatchDeleteText": "Remove os {count} MCPs selecionados do perfil DSH ativo e fecha as conexões em execução. As instâncias independentes fazem backup do patch do perfil primeiro.",
      "mcpBatchDeleted": "{count} MCPs excluídos",
      "mcpBatchDeletePartial": "{deleted} excluídos; {failed} com falha: {errors}",
      "mcpBatchRestart": "Alguns MCPs independentes precisam reiniciar o DSH para concluir o descarregamento.",
      "nav": "Capacidades",
      "title": "Skills e MCP",
      "subtitle": "Gerencie skills locais e servidores MCP no perfil DSH ativo.",
      "search": "Pesquisar nomes, descrições, comandos ou caminhos",
      "refresh": "Atualizar",
      "addSkill": "Novo skill",
      "addMcp": "Adicionar MCP",
      "syncSkills": "Sincronizar do diretório Agent",
      "importMcp": "Importar de apps",
      "display": "Configurações de exibição",
      "enabled": "Ativado",
      "disabled": "Desativado",
      "edit": "Editar",
      "remove": "Excluir",
      "test": "Testar conexão",
      "restart": "Reconectar",
      "user": "Usuário",
      "projectWritable": "Projeto",
      "projectReadonly": "Projeto (somente leitura)",
      "directory": "Diretório",
      "file": "Arquivo único",
      "noItems": "Nenhuma entrada correspondente",
      "noSkills": "Nenhum skill de usuário instalado",
      "noMcp": "Nenhum servidor MCP configurado",
      "agentSource": "Diretório Agent",
      "dshSource": "Diretório DSH",
      "standalone": "Independente",
      "registered": "Registrado por plugin",
      "runtimeUnmanaged": "Gerenciado por uma instância de plugin independente",
      "readonly": "Somente leitura",
      "loading": "Lendo a configuração local…",
      "creating": "Criando…",
      "discardChanges": "Descartar alterações não salvas e fechar?",
      "loadFailed": "Não foi possível ler a configuração",
      "retry": "Tentar novamente",
      "save": "Salvar",
      "cancel": "Cancelar",
      "close": "Fechar",
      "create": "Criar",
      "formMode": "Formulário",
      "jsonMode": "JSON",
      "jsonHelp": "Aceita um objeto mcpServers ou a configuração de um único servidor; o novo JSON pode criar vários servidores de uma vez.",
      "jsonOneServer": "A edição aceita apenas um servidor MCP em JSON",
      "jsonNameFixed": "O nome do MCP não pode ser alterado durante a edição; nome atual:",
      "mode": "Editor",
      "standaloneEditHint": "As configurações de conexão independentes podem ser editadas aqui; use o interruptor para ativar.",
      "transportHttp": "SSE / Streamable HTTP",
      "transportHttpHelp": "O DSH transporta fluxos SSE via Streamable HTTP.",
      "workspaceImpactTitle": "Impacto desta alteração",
      "workspaceImpactHint": "Isso altera diretamente os skills de projeto em {workspace}/.agents/skills. Sessões posteriores nesse espaço de trabalho lerão o novo conteúdo; sessões em execução podem precisar recarregar.",
      "workspaceReadonlyTitle": "Skill somente leitura",
      "workspaceReadonlyHint": "{workspace}/.dsh/skills é gerenciado pelo DSH e é somente leitura.",
      "workspaceEditImpact": "Você está editando um skill de projeto em {workspace}; sessões posteriores nesse espaço de trabalho lerão o novo conteúdo.",
      "workspaceDeleteImpact": "Excluir afeta sessões posteriores em {workspace} que usam o skill.",
      "workspaceScanWarnings": "Alguns diretórios de skills de espaços de trabalho não puderam ser lidos; os demais continuam disponíveis.",
      "name": "Nome",
      "description": "Descrição",
      "body": "Conteúdo",
      "content": "Conteúdo do SKILL.md",
      "path": "Caminho",
      "transport": "Transporte",
      "command": "Comando",
      "args": "Argumentos (um por linha)",
      "cwd": "Diretório de trabalho (opcional)",
      "env": "Ambiente (objeto JSON)",
      "url": "URL do servidor",
      "headers": "Cabeçalhos (objeto JSON)",
      "enableNow": "Ativar após salvar",
      "createSkillTitle": "Novo skill",
      "editSkillTitle": "Editar skill",
      "editMcpTitle": "Editar MCP",
      "addMcpTitle": "Adicionar MCP",
      "scope": "Escopo do skill",
      "userScope": "Usuário",
      "projectScope": "Projeto",
      "projectScopeHelp": "Skills de projeto são gravados em .agents/skills no espaço de trabalho selecionado.",
      "workspace": "Espaço de trabalho",
      "workspaceHelp": "Skills de projeto são gravados em .agents/skills no espaço de trabalho selecionado.",
      "existingWorkspace": "Espaço de trabalho existente",
      "newWorkspace": "Novo espaço de trabalho",
      "selectWorkspace": "Selecionar espaço de trabalho",
      "workspaceName": "Nome do espaço de trabalho",
      "workspaceParent": "Diretório pai",
      "workspaceParentHelp": "Padrão: ~/Documents. Caminhos com ~ são aceitos.",
      "newWorkspaceHint": "O diretório é criado e registrado como espaço de trabalho do DSH.",
      "workspaceRequired": "Selecione ou crie um espaço de trabalho.",
      "currentWorkspace": "Espaço de trabalho da sessão atual",
      "skillNameHelp": "Letras minúsculas, números, hífens ou sublinhados; usado como nome do diretório.",
      "mcpNameHelp": "1–32 letras, números, hífens ou sublinhados; imutável durante a edição.",
      "deleteSkillTitle": "Excluir skill",
      "deleteMcpTitle": "Excluir MCP",
      "deleteSkillText": "Excluir um skill sincronizado remove apenas o link simbólico do DSH e mantém a origem Agent. Skills criados localmente ou diretórios reais vão para a lixeira do DSH.",
      "deleteMcpText": "Remove o MCP do perfil DSH ativo e fecha a conexão em execução.",
      "confirmDelete": "Excluir",
      "saved": "Salvo",
      "created": "Criado",
      "deleted": "Movido para a lixeira",
      "unlinked": "Link simbólico do DSH removido; a origem Agent não foi excluída",
      "mcpDeleted": "Removido da configuração ativa",
      "mcpRemovedStandalone": "MCP independente excluído; a alteração de configuração do plugin foi salva",
      "mcpRemovedRestart": "MCP independente excluído; reinicie o DSH para concluir o descarregamento",
      "mcpRestartRequired": "Salvo; reinicie o DSH para aplicar",
      "updated": "Configuração atualizada",
      "testOk": "Conectado; {count} ferramentas encontradas",
      "testFailed": "Falha no teste de conexão: {message}",
      "restarted": "Reconexão iniciada",
      "syncDone": "Skills sincronizados: {added} adicionados, {updated} atualizados, {skipped} inalterados, {failed} com falha",
      "syncStateError": "; não foi possível salvar o estado de sincronização: ",
      "importDone": "Importação de MCP concluída: {added} adicionados, {skipped} ignorados",
      "sourceErrors": "; {count} fontes não puderam ser lidas",
      "autoUpdate": "Atualização automática",
      "autoUpdateHint": "Apenas instalações npm são atualizadas automaticamente; versões estáveis compatíveis são instaladas pelo gerenciador de plugins do DSH.",
      "checkUpdate": "Verificar atualizações",
      "checkingUpdate": "Verificando…",
      "updateAvailable": "Nova versão disponível",
      "updateAvailableDetail": "Última v{latest} · Atual v{current}",
      "updateNow": "Atualizar para v{version}",
      "updatingVersion": "Atualizando para v{version}…",
      "updateCurrent": "Você está na versão mais recente",
      "updateCurrentDetail": "Versão atual v{version}",
      "updateUnsupported": "Esta instalação não pode ser atualizada automaticamente",
      "updateFailed": "Falha na atualização: ",
      "updateRestart": "A versão v{version} está instalada; reinicie o DSH para aplicar",
      "updateDone": "Atualizado para v{version}",
      "updateAutoSaved": "Configuração de atualização automática salva",
      "userSkillsDir": "Diretório de skills do usuário",
      "readonlyHint": "Skills de usuário e skills de projeto .agents em cada espaço de trabalho registrado podem ser editados, ativados e excluídos; edições entre espaços mostram seu impacto.",
      "connected": "Conectado",
      "connecting": "Conectando",
      "reconnecting": "Reconectando",
      "failed": "Falhou",
      "waiting": "Aguardando credenciais",
      "closed": "Fechado",
      "unknownStatus": "Status desconhecido",
      "toolCount": "{count} ferramentas",
      "invalidJson": "JSON inválido",
      "empty": "Sem descrição",
      "importTitle": "Importar MCP de apps",
      "importHelp": "Lê configurações de usuário sem alterá-las. Selecione entradas manualmente; as importações ficam desativadas por padrão. Uma origem alterada invalida a prévia.",
      "noImports": "Nenhum servidor MCP importável encontrado",
      "existing": "Já existe",
      "importAction": "Importar selecionados",
      "scanFailed": "Falha na verificação",
      "conflict": "Configurações em conflito",
      "enableImports": "Ativar logo após importar",
      "importEnableHint": "Ativar um MCP stdio inicia seu comando local. Ative apenas origens e comandos confiáveis.",
      "syncTitle": "Sincronizar skills do diretório Agent",
      "syncHelp": "Escolha um modo de sincronização para copiar skills do diretório Agent para o DSH. Destinos existentes são copiados antes da substituição; as origens Agent não mudam.",
      "syncMode": "Modo de sincronização",
      "symlinkMode": "Modo link simbólico",
      "symlinkHelp": "O Windows exige o Modo de Desenvolvedor",
      "copyMode": "Modo cópia",
      "copyHelp": "Usa mais espaço; as cópias são recriadas nas atualizações",
      "copyImpact": "O modo cópia edita e exclui apenas a cópia do DSH; os arquivos de origem Agent permanecem inalterados.",
      "symlinkImpact": "O modo link simbólico referencia diretamente a origem Agent; edições ou ativações posteriores no DSH modificam os arquivos de origem.",
      "syncAction": "Confirmar sincronização",
      "newItem": "Criar link",
      "updateItem": "Atualizar link",
      "newCopy": "Copiar",
      "updateCopy": "Atualizar cópia",
      "localEditItem": "Modificado localmente",
      "conflictItem": "Ambos alterados",
      "errorItem": "Falha na leitura",
      "localEditHint": "A cópia do DSH mudou desde a última sincronização; a sincronização a copia antes de substituí-la.",
      "conflictHint": "A origem e a cópia do DSH mudaram; confirme antes de sobrescrever a cópia local.",
      "unchangedItem": "Vinculado",
      "noChanges": "Nenhuma alteração para sincronizar",
      "backupLocation": "Diretório de backup",
      "partialFailure": "Alguns itens falharam",
      "selectAll": "Selecionar tudo",
      "clearAll": "Limpar seleção",
      "selectedCount": "{count} selecionados",
      "modeSymlink": "Link",
      "modeCopy": "Cópia",
      "selectSkill": "Selecionar {name}",
      "batchDelete": "Excluir selecionados",
      "batchDeleteTitle": "Excluir skills",
      "batchDeleteText": "Exclui os {count} skills selecionados. Skills com link simbólico removem apenas o link do DSH e mantêm a origem Agent; os demais vão para a lixeira do DSH.",
      "batchDeletePartial": "{deleted} excluídos; {failed} com falha: {errors}",
      "batchDeleted": "{count} skills excluídos",
      "deleteSelected": "Excluir {count} selecionados",
      "zipDrop": "Solte um pacote de skill .zip ou clique para escolher um arquivo",
      "zipHint": "Aceita um pacote com SKILL.md na raiz ou em uma pasta de primeiro nível, até 8 MiB; arquivos complementares são importados junto.",
      "zipParsing": "Analisando o pacote…",
      "zipParsed": "Pacote analisado",
      "zipFiles": "{count} arquivos",
      "zipRemove": "Remover pacote",
      "zipLocked": "Pacotes ZIP importam SKILL.md como está; nome, descrição e conteúdo não podem ser editados aqui.",
      "zipImport": "Importar pacote",
      "zipError": "Não foi possível analisar o pacote: ",
      "zipTooLarge": "Arquivos ZIP não podem exceder 8 MiB",
      "zipInvalid": "Escolha um arquivo .zip",
      "zipImported": "{name} importado ({count} arquivos)",
      "releaseNotes": "Notas de versão",
      "releaseTitle": "Versão e versões",
      "releaseLoading": "Lendo notas de versão…",
      "releaseEmpty": "Nenhuma nota de versão disponível",
      "releaseFailed": "Não foi possível ler as notas de versão: ",
      "releaseLatest": "Versão mais recente",
      "releaseHistory": "Versões anteriores",
      "releaseCurrent": "Versão atual v{version}",
      "releasePublished": "Publicado em {date}",
      "releasePrerelease": "Pré-lançamento",
      "releaseRetry": "Tentar novamente",
      "releaseRefresh": "Atualizar notas",
      "releaseOpen": "Ver no GitHub",
      "releaseView": "Ver notas de versão",
      "takeoverHint": "A assunção de skills está ativa em todos os modos: apenas o diretório Agent global é ocultado; skills de usuário e de projeto do DSH continuam carregando. O diretório Agent global é usado apenas para sincronização.",
      "standaloneHint": "As configurações de conexão MCP independentes podem ser editadas, ativadas, desativadas ou excluídas aqui.",
      "registeredHint": "Registrado dinamicamente por outro plugin do DSH.",
      "skills": "Skills",
      "mcp": "MCP"
      },
      ru: {
      "selectMcp": "Выбрать MCP {name}",
      "mcpBatchDelete": "Удалить MCP",
      "mcpBatchDeleteTitle": "Удалить MCP",
      "mcpBatchDeleteText": "Удаляет выбранные MCP ({count}) из активного профиля DSH и закрывает текущие подключения. Для автономных экземпляров сначала создаётся резервная копия патча профиля.",
      "mcpBatchDeleted": "Удалено MCP: {count}",
      "mcpBatchDeletePartial": "Удалено {deleted}; ошибок {failed}: {errors}",
      "mcpBatchRestart": "Некоторым автономным MCP требуется перезапуск DSH для завершения выгрузки.",
      "nav": "Возможности",
      "title": "Skills и MCP",
      "subtitle": "Управление локальными Skills и MCP-серверами в активном профиле DSH.",
      "search": "Поиск по именам, описаниям, командам или путям",
      "refresh": "Обновить",
      "addSkill": "Новый Skill",
      "addMcp": "Добавить MCP",
      "syncSkills": "Синхронизировать из каталога Agent",
      "importMcp": "Импортировать из приложений",
      "display": "Настройки отображения",
      "enabled": "Включено",
      "disabled": "Отключено",
      "edit": "Изменить",
      "remove": "Удалить",
      "test": "Проверить подключение",
      "restart": "Переподключить",
      "user": "Пользователь",
      "projectWritable": "Проект",
      "projectReadonly": "Проект (только чтение)",
      "directory": "Каталог",
      "file": "Один файл",
      "noItems": "Нет подходящих записей",
      "noSkills": "Пользовательские Skills не установлены",
      "noMcp": "MCP-серверы не настроены",
      "agentSource": "Каталог Agent",
      "dshSource": "Каталог DSH",
      "standalone": "Автономный",
      "registered": "Зарегистрирован плагином",
      "runtimeUnmanaged": "Управляется автономным экземпляром плагина",
      "readonly": "Только чтение",
      "loading": "Чтение локальной конфигурации…",
      "creating": "Создание…",
      "discardChanges": "Отменить несохранённые изменения и закрыть?",
      "loadFailed": "Не удалось прочитать конфигурацию",
      "retry": "Повторить",
      "save": "Сохранить",
      "cancel": "Отмена",
      "close": "Закрыть",
      "create": "Создать",
      "formMode": "Форма",
      "jsonMode": "JSON",
      "jsonHelp": "Принимает обёртку mcpServers или конфигурацию одного сервера; новый JSON может создать несколько серверов сразу.",
      "jsonOneServer": "При редактировании в JSON допускается ровно один MCP-сервер",
      "jsonNameFixed": "Имя MCP нельзя изменить при редактировании; текущее имя:",
      "mode": "Редактор",
      "standaloneEditHint": "Параметры автономного подключения можно редактировать здесь; для включения используйте переключатель.",
      "transportHttp": "SSE / Streamable HTTP",
      "transportHttpHelp": "DSH передаёт SSE-потоки через Streamable HTTP.",
      "workspaceImpactTitle": "Влияние изменения",
      "workspaceImpactHint": "Это напрямую изменяет проектные Skills в {workspace}/.agents/skills. Последующие сеансы в этом рабочем пространстве прочитают новое содержимое; запущенным сеансам может потребоваться перезагрузка.",
      "workspaceReadonlyTitle": "Skill только для чтения",
      "workspaceReadonlyHint": "{workspace}/.dsh/skills управляется DSH и доступен только для чтения.",
      "workspaceEditImpact": "Вы редактируете проектный Skill в {workspace}; последующие сеансы в этом рабочем пространстве прочитают новое содержимое.",
      "workspaceDeleteImpact": "Удаление повлияет на последующие сеансы в {workspace}, использующие этот Skill.",
      "workspaceScanWarnings": "Некоторые каталоги Skills рабочих пространств не удалось прочитать; остальные доступны.",
      "name": "Имя",
      "description": "Описание",
      "body": "Содержимое",
      "content": "Содержимое SKILL.md",
      "path": "Путь",
      "transport": "Транспорт",
      "command": "Команда",
      "args": "Аргументы (по одному в строке)",
      "cwd": "Рабочий каталог (необязательно)",
      "env": "Окружение (объект JSON)",
      "url": "URL сервера",
      "headers": "Заголовки (объект JSON)",
      "enableNow": "Включить после сохранения",
      "createSkillTitle": "Новый Skill",
      "editSkillTitle": "Редактировать Skill",
      "editMcpTitle": "Редактировать MCP",
      "addMcpTitle": "Добавить MCP",
      "scope": "Область Skill",
      "userScope": "Пользователь",
      "projectScope": "Проект",
      "projectScopeHelp": "Проектные Skills записываются в .agents/skills выбранного рабочего пространства.",
      "workspace": "Рабочее пространство",
      "workspaceHelp": "Проектные Skills записываются в .agents/skills выбранного рабочего пространства.",
      "existingWorkspace": "Существующее рабочее пространство",
      "newWorkspace": "Новое рабочее пространство",
      "selectWorkspace": "Выбрать рабочее пространство",
      "workspaceName": "Имя рабочего пространства",
      "workspaceParent": "Родительский каталог",
      "workspaceParentHelp": "По умолчанию ~/Documents. Поддерживаются пути с ~.",
      "newWorkspaceHint": "Каталог создаётся и регистрируется как рабочее пространство DSH.",
      "workspaceRequired": "Выберите или создайте рабочее пространство.",
      "currentWorkspace": "Рабочее пространство текущего сеанса",
      "skillNameHelp": "Строчные буквы, цифры, дефисы или подчёркивания; используется как имя каталога.",
      "mcpNameHelp": "1–32 буквы, цифры, дефисы или подчёркивания; нельзя изменить при редактировании.",
      "deleteSkillTitle": "Удалить Skill",
      "deleteMcpTitle": "Удалить MCP",
      "deleteSkillText": "При удалении синхронизированного Skill удаляется только символическая ссылка DSH, источник Agent сохраняется. Локально созданные Skills или реальные каталоги перемещаются в корзину DSH.",
      "deleteMcpText": "Удаляет MCP из активного профиля DSH и закрывает текущее подключение.",
      "confirmDelete": "Удалить",
      "saved": "Сохранено",
      "created": "Создано",
      "deleted": "Перемещено в корзину",
      "unlinked": "Символическая ссылка DSH удалена; источник Agent не удалён",
      "mcpDeleted": "Удалено из активной конфигурации",
      "mcpRemovedStandalone": "Автономный MCP удалён; изменение конфигурации плагина сохранено",
      "mcpRemovedRestart": "Автономный MCP удалён; перезапустите DSH для завершения выгрузки",
      "mcpRestartRequired": "Сохранено; перезапустите DSH для применения",
      "updated": "Конфигурация обновлена",
      "testOk": "Подключено; найдено инструментов: {count}",
      "testFailed": "Ошибка проверки подключения: {message}",
      "restarted": "Переподключение запущено",
      "syncDone": "Skills синхронизированы: добавлено {added}, обновлено {updated}, без изменений {skipped}, ошибок {failed}",
      "syncStateError": "; не удалось сохранить состояние синхронизации: ",
      "importDone": "Импорт MCP завершён: добавлено {added}, пропущено {skipped}",
      "sourceErrors": "; не удалось прочитать источников: {count}",
      "autoUpdate": "Автообновление",
      "autoUpdateHint": "Автообновление поддерживается только для установок из npm; совместимые стабильные версии устанавливаются через менеджер плагинов DSH.",
      "checkUpdate": "Проверить обновления",
      "checkingUpdate": "Проверка…",
      "updateAvailable": "Доступна новая версия",
      "updateAvailableDetail": "Последняя v{latest} · Текущая v{current}",
      "updateNow": "Обновить до v{version}",
      "updatingVersion": "Обновление до v{version}…",
      "updateCurrent": "Установлена последняя версия",
      "updateCurrentDetail": "Текущая версия v{version}",
      "updateUnsupported": "Эта установка не поддерживает автообновление",
      "updateFailed": "Ошибка обновления: ",
      "updateRestart": "Версия v{version} установлена; перезапустите DSH для применения",
      "updateDone": "Обновлено до v{version}",
      "updateAutoSaved": "Настройка автообновления сохранена",
      "userSkillsDir": "Каталог пользовательских Skills",
      "readonlyHint": "Пользовательские Skills и проектные Skills .agents во всех зарегистрированных рабочих пространствах можно редактировать, включать и удалять; изменения между пространствами показывают своё влияние.",
      "connected": "Подключено",
      "connecting": "Подключение",
      "reconnecting": "Переподключение",
      "failed": "Ошибка",
      "waiting": "Ожидание учётных данных",
      "closed": "Закрыто",
      "unknownStatus": "Неизвестное состояние",
      "toolCount": "Инструментов: {count}",
      "invalidJson": "Некорректный JSON",
      "empty": "Без описания",
      "importTitle": "Импорт MCP из приложений",
      "importHelp": "Читает пользовательские конфигурации, не изменяя их. Выберите записи вручную; импорт по умолчанию отключён. Изменение источника делает предпросмотр недействительным.",
      "noImports": "Импортируемые MCP-серверы не найдены",
      "existing": "Уже существует",
      "importAction": "Импортировать выбранное",
      "scanFailed": "Ошибка сканирования",
      "conflict": "Конфликт конфигураций",
      "enableImports": "Включить сразу после импорта",
      "importEnableHint": "Включение stdio MCP запускает локальную команду. Включайте только доверенные источники и команды.",
      "syncTitle": "Синхронизация Skills из каталога Agent",
      "syncHelp": "Выберите режим синхронизации, чтобы скопировать Skills из каталога Agent в DSH. Существующие цели резервируются перед заменой; источники Agent не изменяются.",
      "syncMode": "Режим синхронизации",
      "symlinkMode": "Режим символических ссылок",
      "symlinkHelp": "В Windows требуется режим разработчика",
      "copyMode": "Режим копирования",
      "copyHelp": "Занимает больше места; копии пересоздаются при обновлениях",
      "copyImpact": "Режим копирования изменяет и удаляет только копию DSH; исходные файлы Agent не меняются.",
      "symlinkImpact": "Режим символических ссылок напрямую ссылается на источник Agent; последующие изменения или переключения в DSH изменяют исходные файлы.",
      "syncAction": "Подтвердить синхронизацию",
      "newItem": "Создать ссылку",
      "updateItem": "Обновить ссылку",
      "newCopy": "Копировать",
      "updateCopy": "Обновить копию",
      "localEditItem": "Изменено локально",
      "conflictItem": "Изменено в обоих местах",
      "errorItem": "Ошибка чтения",
      "localEditHint": "Копия DSH изменилась с последней синхронизации; при синхронизации она будет сохранена перед заменой.",
      "conflictHint": "Источник и копия DSH изменились; подтвердите перед перезаписью локальной копии.",
      "unchangedItem": "Связано",
      "noChanges": "Нет изменений для синхронизации",
      "backupLocation": "Каталог резервных копий",
      "partialFailure": "Некоторые элементы не удалось обработать",
      "selectAll": "Выбрать все",
      "clearAll": "Снять выбор",
      "selectedCount": "Выбрано: {count}",
      "modeSymlink": "Ссылка",
      "modeCopy": "Копия",
      "selectSkill": "Выбрать {name}",
      "batchDelete": "Удалить выбранные",
      "batchDeleteTitle": "Удалить Skills",
      "batchDeleteText": "Удаляет выбранные Skills ({count}). Для Skills с символической ссылкой удаляется только ссылка DSH, источник Agent сохраняется; остальные перемещаются в корзину DSH.",
      "batchDeletePartial": "Удалено {deleted}; ошибок {failed}: {errors}",
      "batchDeleted": "Удалено Skills: {count}",
      "deleteSelected": "Удалить выбранные ({count})",
      "zipDrop": "Перетащите ZIP-пакет Skill или нажмите, чтобы выбрать файл",
      "zipHint": "Поддерживается пакет с SKILL.md в корне или в одной папке верхнего уровня, до 8 MiB; сопутствующие файлы импортируются вместе.",
      "zipParsing": "Анализ пакета Skill…",
      "zipParsed": "Пакет проанализирован",
      "zipFiles": "Файлов: {count}",
      "zipRemove": "Удалить пакет",
      "zipLocked": "ZIP-пакеты импортируют SKILL.md как есть; имя, описание и содержимое здесь изменить нельзя.",
      "zipImport": "Импортировать пакет",
      "zipError": "Не удалось проанализировать пакет: ",
      "zipTooLarge": "ZIP-файл не должен превышать 8 MiB",
      "zipInvalid": "Выберите файл .zip",
      "zipImported": "{name} импортирован (файлов: {count})",
      "releaseNotes": "Примечания к выпуску",
      "releaseTitle": "Версия и выпуски",
      "releaseLoading": "Чтение примечаний к выпуску…",
      "releaseEmpty": "Примечания к выпуску недоступны",
      "releaseFailed": "Не удалось прочитать примечания к выпуску: ",
      "releaseLatest": "Последний выпуск",
      "releaseHistory": "Предыдущие выпуски",
      "releaseCurrent": "Текущая версия v{version}",
      "releasePublished": "Опубликовано {date}",
      "releasePrerelease": "Предварительная версия",
      "releaseRetry": "Повторить",
      "releaseRefresh": "Обновить примечания",
      "releaseOpen": "Открыть на GitHub",
      "releaseView": "Посмотреть примечания",
      "takeoverHint": "Перехват Skills активен во всех режимах: скрывается только глобальный каталог Agent; пользовательские и проектные Skills DSH продолжают загружаться. Глобальный каталог Agent используется только для синхронизации.",
      "standaloneHint": "Параметры автономного MCP-подключения можно редактировать, включать, отключать и удалять здесь.",
      "registeredHint": "Динамически зарегистрирован другим плагином DSH.",
      "skills": "Skills",
      "mcp": "MCP"
      },
    }

    function t(key, vars) {
      let value = translate ? translate(key, vars) : (MESSAGES.zh[key] || MESSAGES.en[key] || key)
      if (!translate && vars) for (const name of Object.keys(vars)) value = value.replaceAll('{' + name + '}', String(vars[name]))
      return value
    }

    /** Re-render this panel when DSH changes its active locale. */
    function useLocaleRevision() {
      const [revision, setRevision] = useState(0)
      useEffect(() => {
        if (!localeService || typeof localeService.subscribe !== 'function') return undefined
        return localeService.subscribe(() => setRevision(value => value + 1))
      }, [])
      return revision
    }

    function activeLocale() {
      try { return localeService?.getLocale?.().active || 'en' } catch { return 'en' }
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
      '.dsh-caps-update{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:16px;border:.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);}',
      '.dsh-caps-update-icon{display:grid;place-items:center;flex:0 0 20px;color:var(--dsw-alias-label-secondary);}',
      '.dsh-caps-update-copy{display:flex;flex:1;min-width:180px;flex-direction:column;gap:2px;}',
      '.dsh-caps-update-title{color:var(--dsw-alias-label-primary);font-weight:600;}',
      '.dsh-caps-update-detail{color:var(--dsw-alias-label-secondary);font-size:12px;font-variant-numeric:tabular-nums;}',
      '.dsh-caps-update[data-state=available] .dsh-caps-update-icon{color:var(--dsw-alias-brand-primary);}',
      '.dsh-caps-update[data-state=current] .dsh-caps-update-icon,.dsh-caps-update[data-state=updated] .dsh-caps-update-icon{color:var(--dsw-alias-state-success-primary);}',
      '.dsh-caps-update[data-state=failed]{color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 7%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 24%,transparent);}',
      '.dsh-caps-btn{border:.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);border-radius:7px;min-height:32px;padding:5px 11px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;}',
      '.dsh-caps-btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);}',
      '.dsh-caps-btn:focus-visible,.dsh-caps-tab:focus-visible,.dsh-caps-switch:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px;}',
      '.dsh-caps-btn:disabled,.dsh-caps-switch:disabled{opacity:.48;cursor:not-allowed;}',
      '.dsh-caps-primary{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);border-color:transparent;}',
      '.dsh-caps-primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover);color:var(--dsw-alias-label-primary-foreground);}',
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
      '.dsh-caps-row-selectable{grid-template-columns:auto minmax(0,1fr) auto;}',
      '.dsh-caps-pick{display:flex;align-items:flex-start;padding-top:3px;cursor:pointer;}',
      '.dsh-caps-pick input{width:15px;height:15px;margin:0;accent-color:var(--dsw-alias-brand-primary);cursor:pointer;}',
      '.dsh-caps-batchbar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:-6px 0 14px;}',
      '.dsh-caps-batchbar .dsh-caps-actions{gap:6px;}',
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
      '.dsh-caps-dropzone{display:flex;align-items:center;gap:11px;padding:13px 14px;border:.5px dashed var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);cursor:pointer;}',
      '.dsh-caps-dropzone:hover,.dsh-caps-dropzone.is-active{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);}',
      '.dsh-caps-dropzone:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-brand-primary));outline-offset:2px;}',
      '.dsh-caps-dropzone-icon{display:grid;place-items:center;width:30px;height:30px;flex:none;border-radius:7px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);}',
      '.dsh-caps-dropzone-copy{display:flex;flex-direction:column;gap:2px;min-width:0;}',
      '.dsh-caps-package{display:flex;flex-direction:column;gap:8px;padding:12px;border:.5px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-2);}',
      '.dsh-caps-package-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}',
      '.dsh-caps-package-files{display:flex;flex-direction:column;gap:2px;max-height:84px;overflow:auto;font-size:11px;color:var(--dsw-alias-label-secondary);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;}',
      '.dsh-caps-confirm-list{max-height:180px;overflow:auto;margin:8px 0 0;padding-left:18px;color:var(--dsw-alias-label-secondary);}',
      '.dsh-caps-release{display:flex;flex-direction:column;gap:14px;}',
      '.dsh-caps-release-summary{display:flex;flex-wrap:wrap;align-items:center;gap:8px;}',
      '.dsh-caps-release-card{display:flex;flex-direction:column;gap:8px;padding:14px 16px;border:.5px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);}',
      '.dsh-caps-release-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;}',
      '.dsh-caps-release-title{margin:0;font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary);}',
      '.dsh-caps-release-meta{font-size:11px;color:var(--dsw-alias-label-secondary);}',
      '.dsh-caps-release-body{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.65;overflow-wrap:anywhere;}',
      '.dsh-caps-release-body h4{margin:10px 0 4px;font-size:12px;font-weight:600;color:var(--dsw-alias-label-primary);}',
      '.dsh-caps-release-body p{margin:0 0 6px;}',
      '.dsh-caps-release-body ul{margin:4px 0 8px;padding-left:18px;}',
      '.dsh-caps-release-body li{margin:2px 0;}',
      '.dsh-caps-release-body pre{margin:6px 0;padding:8px 10px;border-radius:7px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;overflow:auto;}',
      '.dsh-caps-release-body code{padding:1px 4px;border-radius:4px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;}',
      '.dsh-caps-release-body pre code{padding:0;background:transparent;font-size:inherit;}',
      '.dsh-caps-release-body strong{color:var(--dsw-alias-label-primary);font-weight:600;}',
      '.dsh-caps-release-history{display:flex;flex-direction:column;gap:6px;}',
      '.dsh-caps-release-item{border:.5px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1);}',
      '.dsh-caps-release-item summary{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 12px;color:var(--dsw-alias-label-primary);cursor:pointer;}',
      '.dsh-caps-release-item .dsh-caps-release-body{padding:0 12px 12px;}',
      '.dsh-caps-release-card a.dsh-caps-btn{text-decoration:none;}',
      '.dsh-caps-release-item summary .dsh-caps-name{font-size:12px;}',
      '.dsh-caps-release-item summary .dsh-caps-release-meta{margin-left:auto;}',
      '@media(max-width:700px){.dsh-caps{--caps-pad:16px}.dsh-caps-shell{padding-top:20px}.dsh-caps-header{flex-direction:column}.dsh-caps-update-actions{justify-content:flex-start}.dsh-caps-row{grid-template-columns:1fr}.dsh-caps-row-selectable{grid-template-columns:auto minmax(0,1fr)}.dsh-caps-row-selectable .dsh-caps-row-actions{grid-column:1/-1;justify-content:flex-start}.dsh-caps-row-actions{justify-content:flex-start}.dsh-caps-toolbar{flex-wrap:wrap}.dsh-caps-search{flex-basis:100%}.dsh-caps-modal{padding:18px}.dsh-caps-workspace-fields,.dsh-caps-mcp-grid,.dsh-caps-sync-mode-list{grid-template-columns:1fr}}',
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
        check: h('path', { d: 'm3 8.2 3.1 3.1L13 4.8' }),
        download: h('path', { d: 'M8 2v8m-3-3 3 3 3-3M3 12.5h10' }),
        upload: h('path', { d: 'M8 10V2m-3 3 3-3 3 3M3 12.5h10' }),
        tag: h('path', { d: 'M2.5 8.5V3h5.5l5 5-5 5zM5.5 5.5h.2' }),
        info: h('path', { d: 'M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM8 7v4M8 4.7v.2' }),
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

    function Modal({ title, onClose, children, wide = false, error = '', returnFocus, busy = false }) {
      const dialogRef = React.useRef(null)
      const closeRef = React.useRef(onClose)
      closeRef.current = onClose
      const busyRef = React.useRef(busy)
      busyRef.current = busy
      useEffect(() => {
        const previous = returnFocus || document.activeElement
        const node = dialogRef.current
        const focusable = () => [...node.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex="0"]')].filter(el => el.getClientRects().length > 0)
        const first = node.querySelector('[data-autofocus]') || focusable()[0] || node
        first.focus()
        const listener = event => {
          if (event.key === 'Escape') { event.preventDefault(); if (!busyRef.current) closeRef.current() }
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
      return h('div', { className: 'dsh-caps-overlay', onMouseDown: event => { if (!busy && event.target === event.currentTarget) onClose() } },
        h('section', { ref: dialogRef, tabIndex: -1, className: 'dsh-caps-modal', role: 'dialog', 'aria-modal': true, 'aria-label': title, style: wide ? { width: 'min(760px,100%)' } : undefined },
          h('div', { className: 'dsh-caps-modal-head' }, h('h2', { className: 'dsh-caps-modal-title' }, title), h('button', { className: 'dsh-caps-btn', 'aria-label': t('close'), disabled: busy, onClick: () => { if (!busy) onClose() } }, h(Icon, { name: 'close' }))),
          error ? h('div', { className: 'dsh-caps-notice dsh-caps-error', role: 'alert', tabIndex: -1 }, error) : null,
          children))
    }

    function Field({ label, help, children }) {
      return h('label', { className: 'dsh-caps-field' }, h('span', { className: 'dsh-caps-label' }, label), children, help ? h('span', { className: 'dsh-caps-help' }, help) : null)
    }

    function bytesToBase64(bytes) {
      let binary = ''
      const chunk = 0x8000
      for (let index = 0; index < bytes.length; index += chunk) {
        binary += String.fromCharCode(...bytes.subarray(index, index + chunk))
      }
      return btoa(binary)
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
      const [zip, setZip] = useState('')
      const [zipInfo, setZipInfo] = useState(null)
      const [zipBusy, setZipBusy] = useState(false)
      const [zipError, setZipError] = useState('')
      const [dragging, setDragging] = useState(false)
      const fileRef = React.useRef(null)
      useEffect(() => {
        if (workspaceOptions.length && !workspaceOptions.some(workspace => workspace.path === workspacePath)) {
          setWorkspacePath(workspaceOptions[0].path)
        }
      }, [workspaceOptions, workspacePath])
      useEffect(() => onDirtyChange(Boolean(name || description || body || zip || zipInfo) || scope !== 'user' || workspaceName || workspaceParent !== '~/Documents'), [name, description, body, zip, zipInfo, scope, workspaceName, workspaceParent, onDirtyChange])
      const projectReady = scope !== 'project'
        || (workspaceMode === 'existing' ? Boolean(workspacePath) : Boolean(workspaceName.trim() && workspaceParent.trim()))
      const readZip = async file => {
        setZipError('')
        if (!file || !/\.zip$/i.test(file.name || '')) { setZipError(t('zipInvalid')); return }
        if (file.size > 8 * 1024 * 1024) { setZipError(t('zipTooLarge')); return }
        setZipBusy(true); setZip(''); setZipInfo(null)
        try {
          const bytes = new Uint8Array(await file.arrayBuffer())
          const encoded = bytesToBase64(bytes)
          const result = await api('/skill/parse-zip', { body: { zip: encoded } })
          setZip(encoded); setZipInfo(result)
          setName(result.name || ''); setDescription(result.description || ''); setBody(result.body || '')
        } catch (error) {
          setZipError(t('zipError') + error.message)
          setName(''); setDescription(''); setBody('')
        } finally { setZipBusy(false) }
      }
      const dropZip = event => {
        if (busy || zipBusy) return
        event.preventDefault(); setDragging(false)
        const file = event.dataTransfer?.files?.[0]
        if (file) readZip(file)
      }
      const dragOver = event => {
        if (!event.dataTransfer?.types?.includes('Files')) return
        event.preventDefault()
        if (!busy && !zipBusy) setDragging(true)
      }
      const clearZip = () => {
        setZip(''); setZipInfo(null); setZipError(''); setName(''); setDescription(''); setBody('')
      }
      const submit = async event => {
        event.preventDefault()
        if (!projectReady) return
        const projectCwd = scope === 'project' && workspaceMode === 'existing' ? workspacePath : cwd
        const payload = { name, description, body, scope, cwd: projectCwd, workspaceMode, workspaceName: workspaceName.trim(), workspaceParent: workspaceParent.trim() }
        if (zip) payload.zip = zip
        if (await onSave(payload)) onCancel(true)
      }
      const segment = (value, options, onChange, label) => h('div', { className: 'dsh-caps-segment', role: 'group', 'aria-label': label },
        options.map(option => h('button', { key: option.value, type: 'button', 'aria-pressed': value === option.value, onClick: () => onChange(option.value) }, option.label)))
      const uploaded = zipInfo ? h('div', { className: 'dsh-caps-package' },
        h('div', { className: 'dsh-caps-package-head' },
          h('div', null,
            h('div', { className: 'dsh-caps-name-row' }, h('span', { className: 'dsh-caps-name' }, zipInfo.name), h('span', { className: 'dsh-caps-badge' }, t('zipParsed')), h('span', { className: 'dsh-caps-badge' }, t('zipFiles', { count: zipInfo.fileCount }))),
            h('div', { className: 'dsh-caps-description' }, zipInfo.description)),
          h('button', { type: 'button', className: 'dsh-caps-btn', onClick: clearZip, disabled: busy }, t('zipRemove'))),
        h('div', { className: 'dsh-caps-package-files' }, (zipInfo.files || []).slice(0, 8).map(file => h('span', { key: file.path }, file.path + ' · ' + Math.max(1, Math.ceil(file.size / 1024)) + ' KiB')), (zipInfo.files || []).length > 8 ? h('span', null, '…') : null),
        h('div', { className: 'dsh-caps-help' }, t('zipLocked'))) : null
      return h('form', { className: 'dsh-caps-form', onSubmit: submit, onDragOver: dragOver, onDragLeave: event => { if (event.currentTarget === event.target) setDragging(false) }, onDrop: dropZip },
        h('div', {
          className: 'dsh-caps-dropzone' + (dragging ? ' is-active' : '') + (zipBusy ? ' is-busy' : ''),
          role: 'button', tabIndex: 0, 'aria-disabled': zipBusy || busy ? true : undefined,
          onClick: () => { if (!zipBusy && !busy) fileRef.current?.click() },
          onKeyDown: event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (!zipBusy && !busy) fileRef.current?.click() } },
        },
          h('span', { className: 'dsh-caps-dropzone-icon' }, h(Icon, { name: 'upload', size: 16 })),
          h('span', { className: 'dsh-caps-dropzone-copy' }, h('strong', null, t(zipBusy ? 'zipParsing' : 'zipDrop')), h('span', { className: 'dsh-caps-help' }, t('zipHint')))),
        h('input', { ref: fileRef, type: 'file', accept: '.zip,application/zip', style: { display: 'none' }, onChange: event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) readZip(file) } }),
        zipError ? h('div', { className: 'dsh-caps-notice dsh-caps-error', role: 'alert' }, zipError) : null,
        uploaded,
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
        h(Field, { label: t('name'), help: zipInfo ? t('zipLocked') : t('skillNameHelp') }, h('input', { className: 'dsh-caps-input', value: name, onChange: e => setName(e.target.value), placeholder: 'my-skill', autoFocus: !zipInfo, required: !zipInfo, disabled: Boolean(zipInfo) })),
        h(Field, { label: t('description') }, h('input', { className: 'dsh-caps-input', value: description, onChange: e => setDescription(e.target.value), required: !zipInfo, disabled: Boolean(zipInfo) })),
        h(Field, { label: t('body') }, h('textarea', { className: 'dsh-caps-textarea', value: body, onChange: e => setBody(e.target.value), placeholder: '# ' + (name || 'my-skill'), disabled: Boolean(zipInfo) })),
        h('div', { className: 'dsh-caps-modal-actions' }, h('button', { type: 'button', className: 'dsh-caps-btn', onClick: () => onCancel() }, t('cancel')), h('button', { className: 'dsh-caps-btn dsh-caps-primary', disabled: busy || zipBusy || !projectReady }, zipBusy ? t('zipParsing') : zipInfo ? t('zipImport') : busy ? t('creating') : t('create'))))
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
      const scanToken = React.useRef(0)
      const scan = useCallback(async () => {
        const token = ++scanToken.current
        setLoading(true); setScanError(''); setSelected(new Set())
        try {
          const result = await api('/mcp/imports')
          if (token !== scanToken.current) return
          setServers(result.servers || []); setErrors(result.errors || [])
        } catch (error) {
          if (token === scanToken.current) setScanError(error.message)
        } finally {
          if (token === scanToken.current) setLoading(false)
        }
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
      const scanToken = React.useRef(0)
      const scan = useCallback(async () => {
        const token = ++scanToken.current
        setLoading(true); setScanError(''); setSelected(new Set())
        try {
          const result = await api('/skill/sync-preview?mode=' + mode)
          if (token !== scanToken.current) return
          setPlan(result)
          setSelected(new Set((result.items || []).filter(item => item.action === 'import' || item.action === 'update').map(item => item.name)))
        } catch (error) {
          if (token === scanToken.current) setScanError(error.message)
        } finally {
          if (token === scanToken.current) setLoading(false)
        }
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
        mode === 'symlink' ? h('p', { className: 'dsh-caps-help' }, t('symlinkImpact')) : null,
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
        h('div', { className: 'dsh-caps-modal-actions' }, h('button', { className: 'dsh-caps-btn', onClick: () => onCancel() }, t('cancel')), h('button', { className: 'dsh-caps-btn dsh-caps-primary', disabled: busy || loading || !selected.size, onClick: submit }, t('syncAction'))))
    }

    function releaseInline(text, prefix) {
      const parts = []
      const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g
      let last = 0
      let match
      let index = 0
      while ((match = pattern.exec(text))) {
        if (match.index > last) parts.push(text.slice(last, match.index))
        const token = match[0]
        if (token.startsWith('**')) parts.push(h('strong', { key: prefix + '-' + index++ }, token.slice(2, -2)))
        else parts.push(h('code', { key: prefix + '-' + index++ }, token.slice(1, -1)))
        last = match.index + token.length
      }
      if (last < text.length) parts.push(text.slice(last))
      return parts
    }

    function ReleaseBody({ text }) {
      const blocks = []
      let paragraph = []
      let items = []
      let code = []
      let inCode = false
      const flushParagraph = () => {
        if (!paragraph.length) return
        blocks.push(h('p', { key: 'p' + blocks.length }, releaseInline(paragraph.join(' '), 'p' + blocks.length)))
        paragraph = []
      }
      const flushList = () => {
        if (!items.length) return
        const key = 'u' + blocks.length
        blocks.push(h('ul', { key }, items.map((item, index) => h('li', { key: index }, releaseInline(item, key + '-' + index)))))
        items = []
      }
      const flushCode = () => {
        if (!code.length) return
        blocks.push(h('pre', { key: 'c' + blocks.length }, h('code', null, code.join('\n'))))
        code = []
      }
      for (const line of String(text || '').split(/\r?\n/)) {
        if (/^```/.test(line.trim())) {
          if (inCode) { inCode = false; flushCode() }
          else { flushParagraph(); flushList(); inCode = true }
          continue
        }
        if (inCode) { code.push(line); continue }
        if (!line.trim()) { flushParagraph(); flushList(); continue }
        const heading = /^#{1,6}\s+(.*)$/.exec(line.trim())
        if (heading) {
          flushParagraph(); flushList()
          blocks.push(h('h4', { key: 'h' + blocks.length }, releaseInline(heading[1], 'h' + blocks.length)))
          continue
        }
        const bullet = /^[-*]\s+(.*)$/.exec(line.trim())
        if (bullet) { flushParagraph(); items.push(bullet[1]); continue }
        flushList()
        paragraph.push(line.trim())
      }
      flushParagraph(); flushList(); flushCode()
      if (!blocks.length) return h('p', { className: 'dsh-caps-help' }, t('releaseEmpty'))
      return h('div', { className: 'dsh-caps-release-body' }, blocks)
    }

    function ReleaseCard({ release }) {
      const date = (release.publishedAt || '').slice(0, 10)
      return h('section', { className: 'dsh-caps-release-card' },
        h('div', { className: 'dsh-caps-release-head' },
          h('div', null,
            h('h3', { className: 'dsh-caps-release-title' }, release.name || release.tag),
            h('div', { className: 'dsh-caps-release-meta' }, release.tag + (date ? ' · ' + t('releasePublished', { date }) : '') + (release.prerelease ? ' · ' + t('releasePrerelease') : ''))),
          release.htmlUrl ? h('a', { className: 'dsh-caps-btn', href: release.htmlUrl, target: '_blank', rel: 'noreferrer' }, t('releaseOpen')) : null),
        h(ReleaseBody, { text: release.body }))
    }

    function Releases({ current }) {
      useLocaleRevision()
      const lang = activeLocale()
      const [loading, setLoading] = useState(true)
      const [data, setData] = useState(null)
      const [error, setError] = useState('')
      const requestId = React.useRef(0)
      const load = async (refresh, targetLang = lang) => {
        const id = ++requestId.current
        setLoading(true); setError('')
        try {
          const result = await api('/releases?lang=' + encodeURIComponent(targetLang) + (refresh ? '&refresh=1' : ''))
          if (id === requestId.current) setData(result)
        } catch (problem) {
          if (id === requestId.current) setError(t('releaseFailed') + problem.message)
        } finally {
          if (id === requestId.current) setLoading(false)
        }
      }
      useEffect(() => { load(false, lang) }, [lang])
      const releases = data?.releases || []
      const latest = data?.latest || null
      const history = latest ? releases.filter(release => release.tag !== latest.tag) : releases
      return h('div', { className: 'dsh-caps-release' },
        h('div', { className: 'dsh-caps-release-summary' },
          h('span', { className: 'dsh-caps-badge' }, t('releaseCurrent', { version: current || '?' })),
          latest ? h('span', { className: 'dsh-caps-badge' }, t('releaseLatest') + ' ' + latest.tag) : null,
          h('button', { className: 'dsh-caps-btn', style: { marginLeft: 'auto' }, disabled: loading, onClick: () => load(true, lang) }, h(Icon, { name: 'refresh' }), t('releaseRefresh'))),
        loading ? h('div', { className: 'dsh-caps-spinner' }, t('releaseLoading')) : null,
        error ? h('div', { className: 'dsh-caps-notice dsh-caps-error', role: 'alert' }, error, h('button', { className: 'dsh-caps-btn', style: { marginLeft: '10px' }, onClick: () => load(false, lang) }, t('releaseRetry'))) : null,
        !loading && !error && !releases.length ? h('div', { className: 'dsh-caps-empty' }, t('releaseEmpty')) : null,
        latest ? h(ReleaseCard, { release: latest }) : null,
        history.length ? h('div', { className: 'dsh-caps-release-history' },
          h('div', { className: 'dsh-caps-label' }, t('releaseHistory')),
          history.map(release => h('details', { className: 'dsh-caps-release-item', key: release.tag },
            h('summary', null,
              h('span', { className: 'dsh-caps-name' }, release.name || release.tag),
              h('span', { className: 'dsh-caps-badge' }, release.tag),
              release.prerelease ? h('span', { className: 'dsh-caps-badge' }, t('releasePrerelease')) : null,
              h('span', { className: 'dsh-caps-release-meta' }, (release.publishedAt || '').slice(0, 10))),
            h(ReleaseBody, { text: release.body })))) : null)
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

    function CapabilityPanel({ cwd, prefs }) {
      const [tab, setTab] = useState(prefs.defaultTab)
      const [data, setData] = useState({ skills: [], mcp: [], workspaces: [], skillWarnings: [], update: null })
      const [query, setQuery] = useState('')
      const [loading, setLoading] = useState(true)
      const [error, setError] = useState('')
      const [notice, setNotice] = useState('')
      const [busy, setBusy] = useState('')
      const [updateBusy, setUpdateBusy] = useState('')
      const [modal, setModal] = useState(null)
      const [confirm, setConfirm] = useState(null)
      const [modalError, setModalError] = useState('')
      const [modalDirty, setModalDirty] = useState(false)
      const [selectedSkills, setSelectedSkills] = useState(new Set())
      const [selectedMcps, setSelectedMcps] = useState(new Set())
      const localeRevision = useLocaleRevision()
      const lastLocaleRevision = React.useRef(localeRevision)
      const returnFocusRef = React.useRef(null)
      useEffect(() => {
        if (lastLocaleRevision.current === localeRevision) return
        lastLocaleRevision.current = localeRevision
        // Notices are rendered at action time; a language switch would leave
        // the previous language on screen. Clear them instead of mixing locales.
        setNotice('')
        setError('')
        setModalError('')
      }, [localeRevision])

      const loadToken = React.useRef(0)
      const load = useCallback(async (quiet = false) => {
        const token = ++loadToken.current
        if (!quiet) setLoading(true)
        setError('')
        try {
          const params = new URLSearchParams()
          if (cwd) params.set('cwd', cwd)
          // Counts and cross-workspace rows are identical on both tabs.
          params.set('workspaces', '1')
          const next = await api('/state?' + params.toString())
          if (token !== loadToken.current) return
          setData(next)
        } catch (err) {
          if (token === loadToken.current) setError(t('loadFailed') + ': ' + err.message)
        } finally {
          if (token === loadToken.current) setLoading(false)
        }
      }, [cwd, tab])
      const loadRef = React.useRef(load)
      loadRef.current = load
      useEffect(() => { load() }, [load])
      useEffect(() => {
        const valid = new Set((data.skills || []).filter(item => item.writable).map(item => item.path))
        setSelectedSkills(current => {
          const next = new Set([...current].filter(path => valid.has(path)))
          return next.size === current.size && [...next].every(path => current.has(path)) ? current : next
        })
      }, [data.skills])
      useEffect(() => {
        const valid = new Set((data.mcp || []).filter(item => item.canDelete === true).map(item => item.name))
        setSelectedMcps(current => {
          const next = new Set([...current].filter(name => valid.has(name)))
          return next.size === current.size && [...next].every(name => current.has(name)) ? current : next
        })
      }, [data.mcp])

      const perform = async (key, action, success, reload = true, errorTarget = 'page') => {
        setBusy(key); setError(''); setModalError(''); setNotice('')
        let result
        try { result = await action() }
        catch (err) { if (errorTarget === 'modal') setModalError(err.message); else setError(err.message); setBusy(''); return null }
        // The mutation has succeeded. A later refresh problem is shown by load()
        // in the page error area and must not make the user repeat the write.
        if (reload) await loadRef.current(true)
        if (success) setNotice(typeof success === 'function' ? success(result) : success)
        setBusy('')
        return result || true
      }

      const performUpdate = async (key, action, success = '') => {
        setUpdateBusy(key)
        setError('')
        try {
          const result = await action()
          setData(current => ({ ...current, update: result }))
          if (success) setNotice(success)
          return result
        } catch (err) { setError(err.message); return null }
        finally { setUpdateBusy('') }
      }

      const update = data.update || {}
      const updateNotice = result => {
        if (!result) return ''
        if (result.state === 'available') return t('updateAvailable')
        if (result.state === 'current') return t('updateCurrent')
        if (result.state === 'updated') return t('updateDone', { version: result.latest })
        if (result.state === 'restart-required') return t('updateRestart', { version: result.latest })
        if (result.state === 'updating') return t('updatingVersion', { version: result.latest })
        if (result.state === 'unsupported') return result.error || t('updateUnsupported')
        if (result.state === 'failed') return t('updateFailed') + (result.error || '')
        return ''
      }
      const updateDetail = update.state === 'available'
        ? t('updateAvailableDetail', { latest: update.latest, current: update.current })
        : update.state === 'current' ? t('updateCurrentDetail', { version: update.current }) : ''
      const updateIcon = update.state === 'available' || update.state === 'updating' ? 'download'
        : update.state === 'current' || update.state === 'updated' ? 'check' : 'info'
      const checkForUpdates = () => performUpdate('update-check', () => api('/update/check', { body: {} }))
      const applyUpdate = version => performUpdate('update-apply', () => api('/update/apply', { body: { version } }))
      const setAutoUpdate = enabled => performUpdate('update-config', () => api('/update/config', { body: { autoUpdate: enabled } }), t('updateAutoSaved'))

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
        if (busy && force !== true) return
        if (force !== true && modalDirty && !window.confirm(t('discardChanges'))) return
        setModal(null); setModalError(''); setModalDirty(false)
      }
      const skillCwd = item => item?.workspacePath || cwd
      const toggleSkillSelection = (path, checked) => setSelectedSkills(current => {
        const next = new Set(current)
        if (checked) next.add(path); else next.delete(path)
        return next
      })
      const selectAllSkills = () => setSelectedSkills(new Set(filtered.filter(item => item.writable).map(item => item.path)))
      const askBatchDelete = () => {
        const items = (data.skills || []).filter(item => item.writable && selectedSkills.has(item.path))
        if (!items.length) return
        returnFocusRef.current = document.activeElement
        setConfirm({ kind: 'skill-batch', items })
      }
      const toggleMcpSelection = (name, checked) => setSelectedMcps(current => {
        const next = new Set(current)
        if (checked) next.add(name); else next.delete(name)
        return next
      })
      const selectAllMcps = () => setSelectedMcps(new Set(filtered.filter(item => item.canDelete === true).map(item => item.name)))
      const askBatchDeleteMcp = () => {
        const items = (data.mcp || []).filter(item => item.canDelete === true && selectedMcps.has(item.name))
        if (!items.length) return
        returnFocusRef.current = document.activeElement
        setConfirm({ kind: 'mcp-batch', items })
      }
      const batchSelectable = tab === 'skills'
        ? (data.skills || []).some(item => item.writable)
        : (data.mcp || []).some(item => item.canDelete === true)
      const batchFilteredSelectable = tab === 'skills' ? filtered.some(item => item.writable) : filtered.some(item => item.canDelete === true)
      const batchSelected = tab === 'skills' ? selectedSkills : selectedMcps
      const batchSelectAll = tab === 'skills' ? selectAllSkills : selectAllMcps
      const batchClear = () => { if (tab === 'skills') setSelectedSkills(new Set()); else setSelectedMcps(new Set()) }
      const batchRemove = tab === 'skills' ? askBatchDelete : askBatchDeleteMcp
      const batchLabelKey = tab === 'skills' ? 'batchDelete' : 'mcpBatchDelete'
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
        if (target.kind === 'skill-batch') return perform('delete-batch', () => api('/skill/delete-batch', { body: { items: target.items.map(item => ({ path: item.path, cwd: skillCwd(item) })), confirm: true } }), result => {
          setSelectedSkills(new Set())
          const deleted = result.deleted?.length || 0
          const failed = result.failed?.length || 0
          if (!failed) return t('batchDeleted', { count: deleted })
          const errors = (result.failed || []).slice(0, 3).map(item => item.path.split(/[\\/]/).pop() + ': ' + item.error).join('；')
          return t('batchDeletePartial', { deleted, failed, errors })
        })
        if (target.kind === 'mcp-batch') return perform('delete:mcp-batch', () => api('/mcp/delete-batch', { body: { names: target.items.map(item => item.name), confirm: true } }), result => {
          setSelectedMcps(new Set())
          const deleted = result.deleted?.length || 0
          const failed = result.failed?.length || 0
          const restart = (result.deleted || []).some(item => item.restartRequired)
          if (!failed) return t('mcpBatchDeleted', { count: deleted }) + (restart ? ' · ' + t('mcpBatchRestart') : '')
          const errors = (result.failed || []).slice(0, 3).map(item => item.name + ': ' + item.error).join('；')
          return t('mcpBatchDeletePartial', { deleted, failed, errors })
        })
        if (target.kind === 'skill') return perform('delete:' + target.item.path, () => api('/skill/delete', { body: { path: target.item.path, cwd: skillCwd(target.item), confirm: true } }), result => t(result.unlinked ? 'unlinked' : 'deleted') + ': ' + result.trash)
        return perform('delete:' + target.item.name, () => api('/mcp/delete', { body: { name: target.item.name, confirm: true } }), result => t(result.standalone ? result.restartRequired ? 'mcpRemovedRestart' : 'mcpRemovedStandalone' : 'mcpDeleted'))
      }

      const renderSkill = item => {
        const readOnly = !item.writable
        return h('article', { className: 'dsh-caps-row' + (readOnly ? ' dsh-caps-row-readonly' : '') + (item.writable ? ' dsh-caps-row-selectable' : ''), key: item.id, 'aria-disabled': readOnly ? true : undefined },
          item.writable ? h('label', { className: 'dsh-caps-pick' }, h('input', { type: 'checkbox', checked: selectedSkills.has(item.path), disabled: Boolean(busy), 'aria-label': t('selectSkill', { name: item.name }), onChange: event => toggleSkillSelection(item.path, event.target.checked) })) : null,
          h('div', { className: 'dsh-caps-main' },
            h('div', { className: 'dsh-caps-name-row' }, h('span', { className: 'dsh-caps-name' }, item.name), h('span', { className: 'dsh-caps-badge' }, t(item.scope === 'project' ? (item.writable ? 'projectWritable' : 'projectReadonly') : 'user')), h('span', { className: 'dsh-caps-badge' }, t(item.form === 'file' ? 'file' : 'directory')), item.source === 'user-agents' ? h('span', { className: 'dsh-caps-badge' }, t('agentSource')) : item.source === 'user-dsh' ? h('span', { className: 'dsh-caps-badge' }, t('dshSource')) : null,
              item.syncMode ? h('span', { className: 'dsh-caps-badge', title: t('syncMode') }, t(item.syncMode === 'copy' ? 'modeCopy' : 'modeSymlink')) : null,
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
        return h('article', { className: 'dsh-caps-row' + (item.canDelete === true ? ' dsh-caps-row-selectable' : ''), key: item.name },
          item.canDelete === true ? h('label', { className: 'dsh-caps-pick' }, h('input', { type: 'checkbox', checked: selectedMcps.has(item.name), disabled: Boolean(busy), 'aria-label': t('selectMcp', { name: item.name }), onChange: event => toggleMcpSelection(item.name, event.target.checked) })) : null,
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
              setError(t('testFailed', { message: result.error || result.message || 'Unknown' }))
              return ''
            }) }, t('test')),
            standalone ? null : h('button', { className: 'dsh-caps-btn', disabled: Boolean(busy), onClick: () => perform('restart:' + item.name, () => api('/mcp/restart', { body: { name: item.name } }), t('restarted')) }, t('restart')),
            h('button', { className: 'dsh-caps-btn', disabled: !item.writable || Boolean(busy), onClick: () => openModal({ kind: 'mcp', item }) }, t('edit')),
            h('button', { className: 'dsh-caps-btn dsh-caps-danger', disabled: item.canDelete !== true || Boolean(busy), onClick: () => askDelete('mcp', item) }, t('remove')))))
      }

      const modalProps = { error: modalError, onClose: closeModal, returnFocus: returnFocusRef.current, busy: Boolean(busy) }
      const createSkillFromForm = async body => {
        let targetCwd = body.cwd
        if (body.scope === 'project' && body.workspaceMode === 'new') {
          const created = await api('/workspace/create', { body: { name: body.workspaceName, parent: body.workspaceParent } })
          targetCwd = created.workspace.path
        }
        if (body.zip) return await api('/skill/import-zip', { body: { zip: body.zip, scope: body.scope, cwd: targetCwd } })
        return await api('/skill/create', { body: { ...body, cwd: targetCwd } })
      }
      const saveMcpFromForm = async body => {
        if (!Array.isArray(body.servers)) return await api('/mcp/save', { body })
        return await api('/mcp/save-batch', { body: { servers: body.servers } })
      }
      const activeModal = modal?.kind === 'skill-create' ? h(Modal, { ...modalProps, title: t('createSkillTitle') }, h(SkillCreate, { cwd, workspaces: data.workspaces || [], busy: Boolean(busy), onCancel: closeModal, onDirtyChange: setModalDirty, onSave: body => perform('create-skill', () => createSkillFromForm(body), result => body.zip ? t('zipImported', { name: result.name, count: result.fileCount }) : t('created'), true, 'modal') }))
        : modal?.kind === 'skill-edit' ? h(Modal, { ...modalProps, title: t('editSkillTitle') + ': ' + modal.item.name, wide: true }, h(SkillEdit, { item: modal.item, busy: Boolean(busy), onCancel: closeModal, onDirtyChange: setModalDirty, onSave: text => perform('save-skill', () => api('/skill/update', { body: { path: modal.item.path, text, cwd: skillCwd(modal.item) } }), t('saved'), true, 'modal') }))
        : modal?.kind === 'skill-sync' ? h(Modal, { ...modalProps, title: t('syncTitle'), wide: true }, h(SkillSync, { busy: Boolean(busy), onCancel: closeModal, onSync: (names, mode) => perform('skill-sync', () => api('/skill/sync', { body: { names, mode } }), result => t('syncDone', { added: result.imported.length, updated: result.updated.length, skipped: result.skipped.length, failed: result.failed.length }) + (result.failed.length ? ' · ' + result.failed.map(item => item.name + ': ' + item.error).join('；') : '') + (result.stateError ? t('syncStateError') + result.stateError : '') + (result.backupDir ? ' · ' + result.backupDir : '')) }))
        : modal?.kind === 'mcp' ? h(Modal, { ...modalProps, title: t(modal.item ? 'editMcpTitle' : 'addMcpTitle') }, h(McpForm, { item: modal.item, busy: Boolean(busy), onCancel: closeModal, onDirtyChange: setModalDirty, onSave: body => perform('save-mcp', () => saveMcpFromForm(body), t('saved'), true, 'modal') }))
        : modal?.kind === 'mcp-import' ? h(Modal, { ...modalProps, title: t('importTitle'), wide: true }, h(McpImport, { busy: Boolean(busy), onCancel: closeModal, onImport: (selections, enabled) => perform('import-mcp', () => api('/mcp/import', { body: { selections, enabled } }), result => t('importDone', { added: result.imported.length, skipped: result.skipped.length }) + (result.errors.length ? t('sourceErrors', { count: result.errors.length }) : ''), true, 'modal') }))
        : modal?.kind === 'releases' ? h(Modal, { ...modalProps, title: t('releaseTitle'), wide: true }, h(Releases, { current: update.current }))
        : null

      return h('div', { className: 'dsh-caps' + (prefs.compactRows ? ' dsh-caps-compact' : '') },
        h('style', null, CSS),
        h('div', { className: 'dsh-caps-shell', inert: (modal || confirm) ? '' : undefined, 'aria-hidden': (modal || confirm) ? true : undefined },
          h('header', { className: 'dsh-caps-header' },
            h('div', null, h('h1', { className: 'dsh-caps-title' }, t('title')), h('p', { className: 'dsh-caps-subtitle' }, t('subtitle'))),
            h('div', { className: 'dsh-caps-actions dsh-caps-update-actions' },
              update.current ? h('span', { className: 'dsh-caps-version', title: t('autoUpdateHint') }, 'v' + update.current) : null,
              h('label', { className: 'dsh-caps-check', title: t('autoUpdateHint') },
                h('input', { type: 'checkbox', checked: update.autoUpdate !== false, disabled: Boolean(updateBusy) || update.state === 'updating' || update.supported === false, onChange: event => setAutoUpdate(event.target.checked) }),
                t('autoUpdate')),
              h('button', { className: 'dsh-caps-btn', onClick: () => openModal({ kind: 'releases' }) }, h(Icon, { name: 'tag' }), t('releaseNotes')),
              h('button', { className: 'dsh-caps-btn', disabled: Boolean(updateBusy) || update.state === 'updating', 'aria-busy': updateBusy === 'update-check', onClick: checkForUpdates }, h(Icon, { name: 'refresh' }), t(updateBusy === 'update-check' ? 'checkingUpdate' : 'checkUpdate')))),
          ['available', 'current', 'updating', 'failed', 'restart-required', 'updated', 'unsupported'].includes(update.state) ? h('div', { className: 'dsh-caps-notice dsh-caps-update', 'data-state': update.state, role: update.state === 'failed' ? 'alert' : 'status', 'aria-live': 'polite' },
            h('span', { className: 'dsh-caps-update-icon' }, h(Icon, { name: updateIcon, size: 18 })),
            h('div', { className: 'dsh-caps-update-copy' },
              h('div', { className: 'dsh-caps-update-title' }, updateNotice(update)),
              updateDetail ? h('div', { className: 'dsh-caps-update-detail' }, updateDetail) : null),
            h(React.Fragment, null,
              update.state === 'available' ? h('button', { className: 'dsh-caps-btn dsh-caps-primary', disabled: Boolean(updateBusy), onClick: () => applyUpdate(update.latest) }, t('updateNow', { version: update.latest }))
                : update.state === 'failed' ? h('button', { className: 'dsh-caps-btn', disabled: Boolean(updateBusy), onClick: checkForUpdates }, t('retry')) : null,
              update.state === 'available' ? h('button', { className: 'dsh-caps-btn', onClick: () => openModal({ kind: 'releases' }) }, t('releaseView')) : null)) : null,
          h('div', { className: 'dsh-caps-tabs' }, ['skills', 'mcp'].map(key => h('button', { key, 'aria-pressed': tab === key, className: 'dsh-caps-tab', onClick: () => setTab(key) }, t(key), h('span', { className: 'dsh-caps-count' }, (data[key] || []).length)))),
          h('div', { className: 'dsh-caps-toolbar' },
            h('div', { className: 'dsh-caps-search' }, h('span', { className: 'dsh-caps-search-icon' }, h(Icon, { name: 'search' })), h('input', { className: 'dsh-caps-input', type: 'search', value: query, onChange: e => setQuery(e.target.value), placeholder: t('search'), 'aria-label': t('search') })),
            h('button', { className: 'dsh-caps-btn', onClick: () => load(), disabled: loading }, h(Icon, { name: 'refresh' }), t('refresh')),
            tab === 'skills' ? h('button', { className: 'dsh-caps-btn', disabled: Boolean(busy), onClick: () => openModal({ kind: 'skill-sync' }) }, h(Icon, { name: 'sync' }), t('syncSkills'))
              : h('button', { className: 'dsh-caps-btn', onClick: () => openModal({ kind: 'mcp-import' }) }, h(Icon, { name: 'import' }), t('importMcp')),
            h('button', { className: 'dsh-caps-btn dsh-caps-primary', onClick: () => openModal(tab === 'skills' ? { kind: 'skill-create' } : { kind: 'mcp', item: null }) }, h(Icon, { name: 'plus' }), t(tab === 'skills' ? 'addSkill' : 'addMcp'))),
          batchSelectable ? h('div', { className: 'dsh-caps-batchbar' },
            h('span', { className: 'dsh-caps-help' }, t('selectedCount', { count: batchSelected.size })),
            h('div', { className: 'dsh-caps-actions' },
              h('button', { className: 'dsh-caps-btn', disabled: Boolean(busy) || !batchFilteredSelectable, onClick: batchSelectAll }, t('selectAll')),
              h('button', { className: 'dsh-caps-btn', disabled: Boolean(busy) || !batchSelected.size, onClick: batchClear }, t('clearAll')),
              h('button', { className: 'dsh-caps-btn dsh-caps-danger', disabled: Boolean(busy) || !batchSelected.size, onClick: batchRemove }, t(batchLabelKey)))) : null,
          error ? h('div', { className: 'dsh-caps-notice dsh-caps-error', role: 'alert' }, error) : null,
          notice ? h('div', { className: 'dsh-caps-notice', role: 'status' }, notice) : null,
          data.mcpError && tab === 'mcp' ? h('div', { className: 'dsh-caps-notice dsh-caps-error', role: 'alert' }, data.mcpError) : null,
          data.skillWarnings?.length && tab === 'skills' ? h('div', { className: 'dsh-caps-notice', role: 'status' }, t('workspaceScanWarnings') + ' ' + data.skillWarnings.map(item => item.workspaceTitle).join(', ')) : null,
          tab === 'skills' ? h('div', { className: 'dsh-caps-help', style: { marginBottom: '8px' } }, t('takeoverHint')) : null,
          tab === 'skills' && cwd ? h('div', { className: 'dsh-caps-help', style: { marginBottom: '12px' } }, t('readonlyHint')) : null,
          loading ? h('div', { className: 'dsh-caps-spinner' }, t('loading'))
            : h('div', { className: 'dsh-caps-list' }, filtered.length ? filtered.map(tab === 'skills' ? renderSkill : renderMcp) : (tab === 'mcp' && data.mcpError) ? null : h('div', { className: 'dsh-caps-empty' }, query ? t('noItems') : t(tab === 'skills' ? 'noSkills' : 'noMcp'))),
          tab === 'skills' && data.userSkillsRoot ? h('footer', { className: 'dsh-caps-foot' },
            h('span', { title: data.userSkillsRoot }, t('userSkillsDir') + ': ' + (data.home && data.userSkillsRoot.startsWith(data.home + '/') ? '~' + data.userSkillsRoot.slice(data.home.length) : data.userSkillsRoot))) : null),
        activeModal,
        confirm ? h(Modal, { title: t(confirm.kind === 'mcp' ? 'deleteMcpTitle' : confirm.kind === 'skill' ? 'deleteSkillTitle' : confirm.kind === 'mcp-batch' ? 'mcpBatchDeleteTitle' : 'batchDeleteTitle'), onClose: () => setConfirm(null), returnFocus: returnFocusRef.current },
          confirm.kind === 'skill-batch' ? h(React.Fragment, null,
            h('p', { className: 'dsh-caps-help' }, t('batchDeleteText', { count: confirm.items.length })),
            h('ul', { className: 'dsh-caps-confirm-list' }, confirm.items.slice(0, 12).map(item => h('li', { key: item.path }, item.name + (item.workspaceTitle ? ' · ' + item.workspaceTitle : '')))),
            confirm.items.length > 12 ? h('p', { className: 'dsh-caps-help' }, '…') : null)
            : confirm.kind === 'mcp-batch' ? h(React.Fragment, null,
              h('p', { className: 'dsh-caps-help' }, t('mcpBatchDeleteText', { count: confirm.items.length })),
              h('ul', { className: 'dsh-caps-confirm-list' }, confirm.items.slice(0, 12).map(item => h('li', { key: item.name }, item.name))),
              confirm.items.length > 12 ? h('p', { className: 'dsh-caps-help' }, '…') : null)
            : h(React.Fragment, null,
              h('p', null, confirm.item.name), h('p', { className: 'dsh-caps-help' }, t(confirm.kind === 'skill' ? 'deleteSkillText' : 'deleteMcpText')),
              confirm.kind === 'skill' && confirm.item.crossWorkspace ? h('div', { className: 'dsh-caps-notice' }, t('workspaceDeleteImpact', { workspace: confirm.item.workspaceTitle })) : null),
          h('div', { className: 'dsh-caps-modal-actions' }, h('button', { className: 'dsh-caps-btn', onClick: () => setConfirm(null), 'data-autofocus': true }, t('cancel')), h('button', { className: 'dsh-caps-btn dsh-caps-danger', onClick: doDelete }, confirm.kind === 'skill-batch' || confirm.kind === 'mcp-batch' ? t('deleteSelected', { count: confirm.items.length }) : t('confirmDelete')))) : null)
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
      return h(CapabilityPanel, { cwd, prefs: props.prefs })
    }

    function apply(ctx, config = {}) {
      if (ctx.locale) localeService = ctx.locale
      const prefs = {
        defaultTab: config.defaultTab === 'mcp' ? 'mcp' : 'skills',
        showDescriptions: config.showDescriptions !== false,
        compactRows: config.compactRows !== false,
      }
      ctx.effect(() => ctx.locale.register(NS, MESSAGES), 'capability-switch: locales')
      translate = ctx.locale.bind(NS)
      ctx.effect(() => {
        const disposeMain = ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL }, props => h(SessionPage, { ...props, prefs })))
        const disposeSidebar = ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: PANEL, order: 6, label: () => t('title'), locale: NS }, BrandIcon))
        return () => { disposeMain(); disposeSidebar() }
      }, 'capability-switch: slots')
    }

    return { apply, inject: ['slots', 'locale'] }
  },
})


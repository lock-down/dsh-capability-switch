import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { EventEmitter } from 'node:events'
import { spawnSync } from 'node:child_process'

function isLosslessJson(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (Array.isArray(value)) return value.every(isLosslessJson)
  if (typeof value === 'object') return Object.values(value).every(isLosslessJson)
  return false
}

const root = resolve(new URL('..', import.meta.url).pathname)
for (const file of ['lib/client.js', 'lib/index.js', 'lib/mcp.js', 'lib/skills.js', 'lib/update.js']) {
  const checked = spawnSync(process.execPath, ['--check', join(root, file)], { encoding: 'utf8' })
  assert.equal(checked.status, 0, file + ' syntax error: ' + checked.stderr)
}
const temp = await fs.mkdtemp(join(tmpdir(), 'dsh-caps-test-'))
assert.ok(temp.startsWith(tmpdir()))
process.env.DSH_HOME = temp
process.env.DSH_AGENTS_HOME = join(temp, 'agents')

try {
  const skills = await import(pathToFileURL(join(root, 'lib/skills.js')))
  const updateModule = await import(pathToFileURL(join(root, 'lib/update.js')))
  const created = await skills.createSkill({ name: 'demo-skill', description: '测试技能', body: '# Demo' })
  assert.ok(created.path.endsWith('SKILL.md'))
  assert.equal((await skills.listSkills()).length, 1)
  const disabled = await skills.toggleSkill(created.path, false)
  assert.equal(disabled.enabled, false)
  assert.ok(disabled.path.endsWith('.disabled'))
  assert.equal((await skills.listSkills())[0].enabled, false)
  await assert.rejects(() => skills.updateSkill(disabled.path, '---\nname: demo\n---\n', undefined), /先启用/)
  await skills.toggleSkill(disabled.path, true)
  const original = await skills.readSkill(created.path)
  const updatedText = original.text.replace('测试技能', '更新后的技能')
  const updated = await skills.updateSkill(created.path, updatedText)
  await fs.access(updated.backup)
  assert.match((await skills.readSkill(created.path)).text, /更新后的技能/)
  await assert.rejects(() => skills.deleteSkill(created.path, false), /确认/)
  const removed = await skills.deleteSkill(created.path, true)
  await fs.access(removed.trash)
  assert.equal(removed.unlinked, false)
  assert.equal((await skills.listSkills()).length, 0)
  await assert.rejects(() => skills.toggleSkill(join(temp, 'outside.md'), false), /只读|用户级技能/)

  const agentSkill = join(temp, 'agents', 'skills', 'agent-demo')
  await fs.mkdir(agentSkill, { recursive: true })
  await fs.writeFile(join(agentSkill, 'SKILL.md'), '# Agent v1\n')
  await fs.writeFile(join(agentSkill, 'asset.txt'), 'asset\n')
  assert.equal((await skills.listSkills()).some(skill => skill.source === 'user-agents'), false)
  const skillPreview = await skills.previewAgentSkillSync()
  assert.equal(skillPreview.items.find(item => item.name === 'agent-demo').action, 'import')
  await assert.rejects(() => fs.access(join(temp, 'skills', 'agent-demo')))
  const agentLink = join(temp, 'skills', 'agent-demo')
  let synced = await skills.syncAgentSkills(skillPreview)
  assert.deepEqual(synced.imported, ['agent-demo'])
  assert.equal((await fs.lstat(agentLink)).isSymbolicLink(), true)
  assert.equal(await fs.realpath(agentLink), await fs.realpath(agentSkill))
  assert.equal(await fs.readFile(join(agentLink, 'SKILL.md'), 'utf8'), '# Agent v1\n')
  const deduped = (await skills.listSkills()).filter(skill => skill.name === 'agent-demo')
  assert.equal(deduped.length, 1)
  assert.equal(deduped[0].source, 'user-dsh')
  await assert.rejects(() => skills.deleteSkill(join(agentSkill, 'SKILL.md'), true), /只允许删除用户级或当前工作区/)
  assert.ok(await fs.readFile(join(agentSkill, 'SKILL.md'), 'utf8'))
  const linkedEntry = join(agentLink, 'SKILL.md')
  const linkedRead = await skills.readSkill(linkedEntry)
  assert.equal(linkedRead.path, join(await fs.realpath(agentSkill), 'SKILL.md'))
  const editedText = '---\nname: agent-demo\ndescription: test\n---\n\n# Agent edited\n'
  await skills.updateSkill(linkedEntry, editedText)
  assert.equal(await fs.readFile(join(agentSkill, 'SKILL.md'), 'utf8'), editedText)
  assert.equal(await fs.readFile(linkedEntry, 'utf8'), editedText)
  synced = await skills.syncAgentSkills()
  assert.deepEqual(synced.skipped, ['agent-demo'])
  await fs.writeFile(join(agentSkill, 'SKILL.md'), '# Agent v2\n')
  assert.equal(await fs.readFile(join(agentLink, 'SKILL.md'), 'utf8'), '# Agent v2\n')
  synced = await skills.syncAgentSkills()
  assert.deepEqual(synced.skipped, ['agent-demo'])

  await fs.rm(agentLink)
  await fs.cp(agentSkill, agentLink, { recursive: true })
  await fs.writeFile(join(agentLink, 'SKILL.md'), '# Copied v1\n')
  const copyPreview = await skills.previewAgentSkillSync()
  assert.equal(copyPreview.items.find(item => item.name === 'agent-demo').action, 'update')
  synced = await skills.syncAgentSkills(copyPreview, ['agent-demo'])
  assert.deepEqual(synced.updated, ['agent-demo'])
  assert.equal((await fs.lstat(agentLink)).isSymbolicLink(), true)
  assert.equal(await fs.readFile(join(agentLink, 'SKILL.md'), 'utf8'), '# Agent v2\n')
  assert.equal(await fs.readFile(join(synced.backupDir, 'agent-demo', 'SKILL.md'), 'utf8'), '# Copied v1\n')

  const copySource = join(temp, 'agents', 'skills', 'copy-demo')
  await fs.mkdir(copySource, { recursive: true })
  await fs.writeFile(join(copySource, 'SKILL.md'), '---\nname: copy-demo\ndescription: copy\n---\n\n# Copy source\n')
  await fs.writeFile(join(copySource, 'asset.txt'), 'copy asset\n')
  const copyTarget = join(temp, 'skills', 'copy-demo')
  const copyPlan = await skills.previewAgentSkillSync('copy')
  assert.equal(copyPlan.items.find(item => item.name === 'copy-demo').action, 'import')
  const copySynced = await skills.syncAgentSkills(copyPlan, ['copy-demo'], 'copy')
  assert.deepEqual(copySynced.imported, ['copy-demo'])
  assert.equal(copySynced.mode, 'copy')
  assert.equal((await fs.lstat(copyTarget)).isSymbolicLink(), false)
  assert.equal(await fs.readFile(join(copyTarget, 'asset.txt'), 'utf8'), 'copy asset\n')
  assert.equal((await skills.previewAgentSkillSync('copy')).items.find(item => item.name === 'copy-demo').action, 'skip')
  const copyEntry = join(copyTarget, 'SKILL.md')
  await fs.writeFile(join(copySource, 'SKILL.md'), '---\nname: copy-demo\ndescription: copy\n---\n\n# Copy v2\n')
  const changedCopyPlan = await skills.previewAgentSkillSync('copy')
  assert.equal(changedCopyPlan.items.find(item => item.name === 'copy-demo').action, 'update')
  await skills.syncAgentSkills(changedCopyPlan, ['copy-demo'], 'copy')
  assert.match(await fs.readFile(copyEntry, 'utf8'), /Copy v2/)
  await skills.updateSkill(copyEntry, '---\nname: copy-demo\ndescription: copy\n---\n\n# Copy edited\n')
  assert.match(await fs.readFile(join(copySource, 'SKILL.md'), 'utf8'), /Copy v2/)
  const localPlan = await skills.previewAgentSkillSync('copy')
  const localItem = localPlan.items.find(item => item.name === 'copy-demo')
  assert.equal(localItem.action, 'local-edit')
  const localSkipped = await skills.syncAgentSkills({ ...localPlan, items: [localItem] }, undefined, 'copy')
  assert.deepEqual(localSkipped.skipped, ['copy-demo'])
  assert.match(await fs.readFile(copyEntry, 'utf8'), /Copy edited/)
  await fs.writeFile(join(copySource, 'SKILL.md'), '---\nname: copy-demo\ndescription: copy\n---\n\n# Copy v3\n')
  const conflictPlan = await skills.previewAgentSkillSync('copy')
  assert.equal(conflictPlan.items.find(item => item.name === 'copy-demo').action, 'conflict')
  const conflictSynced = await skills.syncAgentSkills(conflictPlan, ['copy-demo'], 'copy')
  assert.deepEqual(conflictSynced.updated, ['copy-demo'])
  assert.match(await fs.readFile(copyEntry, 'utf8'), /Copy v3/)
  assert.match(await fs.readFile(join(conflictSynced.backupDir, 'copy-demo', 'SKILL.md'), 'utf8'), /Copy edited/)
  await skills.deleteSkill(copyEntry, true)
  await assert.rejects(() => fs.access(copyTarget))
  await fs.access(join(copySource, 'SKILL.md'))

  const deleteSource = join(temp, 'agents', 'skills', 'link-delete')
  await fs.mkdir(deleteSource, { recursive: true })
  await fs.writeFile(join(deleteSource, 'SKILL.md'), '---\nname: link-delete\ndescription: test\n---\n\n# Keep me\n')
  const deletePlan = await skills.previewAgentSkillSync()
  await skills.syncAgentSkills(deletePlan, ['link-delete'])
  const deleteLink = join(temp, 'skills', 'link-delete')
  assert.equal((await fs.lstat(deleteLink)).isSymbolicLink(), true)
  const linkedDelete = await skills.deleteSkill(join(deleteLink, 'SKILL.md'), true)
  assert.equal(linkedDelete.unlinked, true)
  assert.equal((await fs.lstat(linkedDelete.trash)).isSymbolicLink(), true)
  assert.equal(await fs.readFile(join(deleteSource, 'SKILL.md'), 'utf8'), '---\nname: link-delete\ndescription: test\n---\n\n# Keep me\n')
  await assert.rejects(() => fs.access(deleteLink))

  const projectWorkspace = join(temp, 'project-workspace')
  const projectSkill = join(projectWorkspace, '.agents', 'skills', 'project-demo')
  await fs.mkdir(projectSkill, { recursive: true })
  await fs.writeFile(join(projectSkill, 'SKILL.md'), '---\nname: project-demo\ndescription: Project demo skill\n---\n\n# Project Demo\n')
  const listedProject = (await skills.listSkills(projectWorkspace)).find(skill => skill.name === 'project-demo')
  assert.equal(listedProject.source, 'project-agents')
  assert.equal(listedProject.writable, true)
  await assert.rejects(() => skills.createSkill({ name: 'project-no-cwd', description: 'No cwd', scope: 'project' }), /需要当前工作区/)
  const createdProject = await skills.createSkill({ name: 'project-created', description: 'Created project skill', body: '# Created', scope: 'project', cwd: projectWorkspace })
  assert.equal(createdProject.scope, 'project')
  assert.ok(createdProject.path.startsWith(join(projectWorkspace, '.agents', 'skills')))
  assert.equal((await skills.listSkills(projectWorkspace)).find(skill => skill.name === 'project-created').source, 'project-agents')
  await skills.updateSkill(createdProject.path, '---\nname: project-created\ndescription: Updated project skill\n---\n\n# Updated\n', projectWorkspace)
  const deletedProject = await skills.deleteSkill(createdProject.path, true, projectWorkspace)
  assert.equal(deletedProject.unlinked, false)
  await assert.rejects(() => fs.access(createdProject.path))

  for (const name of ['partial-a', 'partial-b']) {
    await fs.mkdir(join(temp, 'agents', 'skills', name), { recursive: true })
    await fs.writeFile(join(temp, 'agents', 'skills', name, 'SKILL.md'), '# ' + name + '\n')
  }
  const partialPlan = await skills.previewAgentSkillSync()
  await fs.rm(join(temp, 'agents', 'skills', 'partial-b'), { recursive: true })
  const partial = await skills.syncAgentSkills(partialPlan, ['partial-a', 'partial-b'])
  assert.deepEqual(partial.imported, ['partial-a'])
  assert.equal(partial.failed.length, 1)
  assert.equal(partial.failed[0].name, 'partial-b')
  assert.ok(await fs.readFile(join(temp, 'skills', 'partial-a', 'SKILL.md'), 'utf8'))

  for (const name of ['select-a', 'select-b']) {
    await fs.mkdir(join(temp, 'agents', 'skills', name), { recursive: true })
    await fs.writeFile(join(temp, 'agents', 'skills', name, 'SKILL.md'), '# ' + name + '\n')
  }
  const selectPlan = await skills.previewAgentSkillSync()
  const selectedOnly = await skills.syncAgentSkills(selectPlan, ['select-a'])
  assert.deepEqual(selectedOnly.imported, ['select-a'])
  await assert.rejects(() => fs.access(join(temp, 'skills', 'select-b')))

  const visibleSkills = [
    { name: 'user-dsh', source: 'user-dsh' },
    { name: 'global-agent-hidden', source: 'user-agents' },
    { name: 'project-dsh', source: 'project-dsh' },
    { name: 'project-agent', source: 'project-agents' },
    { name: 'bundled', source: 'bundled' },
    { name: 'custom', source: 'custom' },
    { name: 'runtime', source: 'runtime' },
  ]
  const expectedVisible = ['user-dsh', 'project-dsh', 'project-agent', 'bundled', 'custom', 'runtime']
  const fakeSkills = {
    list: async () => visibleSkills,
    snapshot: async () => ({ skills: visibleSkills, complete: true }),
    get: async name => visibleSkills.find(skill => skill.name === name),
  }
  const takeoverDispose = skills.installSkillTakeover({ get: key => key === 'skills' ? fakeSkills : undefined })
  for (const mode of ['ptc', 'standard', 'minimal', 'cordis']) {
    assert.deepEqual((await fakeSkills.list({ scope: { mode } })).map(skill => skill.name), expectedVisible)
    assert.deepEqual((await fakeSkills.snapshot({ scope: { mode } })).skills.map(skill => skill.name), expectedVisible)
  }
  assert.equal(await fakeSkills.get('global-agent-hidden'), undefined)
  assert.equal((await fakeSkills.get('project-agent')).name, 'project-agent')
  assert.equal((await fakeSkills.get('user-dsh')).name, 'user-dsh')
  takeoverDispose()
  assert.equal((await fakeSkills.list()).length, 7)
  assert.equal((await fakeSkills.get('global-agent-hidden')).name, 'global-agent-hidden')

  let refreshInvalidated = 0
  let refreshEvent
  const refreshSkills = { invalidateCache: () => { refreshInvalidated += 1 } }
  assert.equal(skills.invalidateSkillCatalog({
    get: key => key === 'skills' ? refreshSkills : undefined,
    emit: (name, payload) => { refreshEvent = { name, payload } },
  }), true)
  assert.equal(refreshInvalidated, 1)
  assert.deepEqual(refreshEvent, { name: 'plugin-manager/changed', payload: { reason: 'plugin' } })
  assert.equal(skills.invalidateSkillCatalog({ get: () => undefined, emit() {} }), false)

  const mcp = await import(pathToFileURL(join(root, 'lib/mcp.js')))
  let config = { servers: {} }
  const manager = {
    config: { servers: { get: () => config.servers } },
    ctx: { fiber: { entry: { id: 'mcp' } } },
    list: () => Object.entries(config.servers).map(([name, entry]) => ({ name, status: { state: entry.enabled ? 'connected' : 'disabled' } })),
    probe: async name => ({ ok: true, toolNames: [name + '.tool'] }),
    restart: async () => {},
  }
  const standaloneEntry = { options: { id: 'pencil', name: '@deepseek-ai/dsh-mcp-client', config: { serverName: 'pencil', transport: 'stdio', command: 'pen', args: ['--app', 'desktop'] } } }
  const profilePatch = join(temp, 'cordis.patch.yml')
  await fs.writeFile(profilePatch, [
    '- id: ui-settings',
    '  name: "@deepseek-ai/dsh-client-ui-settings"',
    '  config:',
    '    enabled: true',
    '- insert:',
    '    - id: pencil',
    '      name: "@deepseek-ai/dsh-mcp-client"',
    '      config:',
    '        serverName: pencil',
    '        transport: stdio',
    '        command: pen',
    '- id: tool-bash',
    '  name: "@deepseek-ai/dsh-tool-bash"',
    '  disabled: !!js process.platform === "win32"',
    '',
  ].join('\n'))
  let standaloneEnabled = true
  const pluginManager = {
    listPlugins: async () => [{ entryId: 'include:pencil', patchId: 'pencil', moduleName: '@deepseek-ai/dsh-mcp-client', enabled: standaloneEnabled }],
    setPluginEnabled: async (_id, enabled) => {
      standaloneEnabled = enabled
      return { application: 'applied', enabled, stage: 'enable', target: 'pencil', changed: true }
    },
  }
  const configEditor = {
    documentPath: profilePatch,
    entries: () => [standaloneEntry],
    edit: async (entry, update) => {
      if (entry === standaloneEntry) standaloneEntry.options.config = update(standaloneEntry.options.config)
      else config = update(config)
    },
  }
  const ctx = { get: key => key === 'mcpManager' ? manager : key === 'configEditor' ? configEditor : key === 'pluginManager' ? pluginManager : undefined }
  await mcp.saveMcp(ctx, { name: 'local', transport: 'stdio', command: 'npx', args: ['-y', 'demo'], env: {}, enabled: true })
  assert.equal((await mcp.listMcp(ctx))[0].command, 'npx')
  assert.equal((await mcp.listMcp(ctx)).find(row => row.name === 'pencil').source, 'standalone')
  assert.equal((await mcp.listMcp(ctx)).find(row => row.name === 'pencil').writable, true)
  assert.equal((await mcp.listMcp(ctx)).find(row => row.name === 'pencil').canToggle, true)
  await mcp.saveMcp(ctx, { name: 'pencil', originalName: 'pencil', transport: 'stdio', command: 'pen2', args: ['--edited'], env: {}, enabled: true })
  assert.equal(standaloneEntry.options.config.command, 'pen2')
  assert.deepEqual(standaloneEntry.options.config.args, ['--edited'])
  config.servers.pencil = { name: 'pencil', transport: 'stdio', command: 'manager-pen', args: [], env: {}, cwd: '', enabled: true }
  await mcp.saveMcp(ctx, { name: 'pencil', originalName: 'pencil', transport: 'stdio', command: 'manager-pen-2', args: [], env: {}, enabled: true })
  assert.equal(config.servers.pencil.command, 'manager-pen-2')
  assert.equal(standaloneEntry.options.config.command, 'pen2')
  delete config.servers.pencil
  const originalListPlugins = pluginManager.listPlugins
  pluginManager.listPlugins = async () => [{ entryId: 'include:pencil', patchId: 'pencil', moduleName: '@deepseek-ai/dsh-mcp-client', enabled: true, readOnlyReason: 'management-required' }]
  const readOnlyStandalone = (await mcp.listMcp(ctx)).find(row => row.name === 'pencil')
  assert.equal(readOnlyStandalone.writable, false)
  assert.equal(readOnlyStandalone.canDelete, false)
  await assert.rejects(() => mcp.saveMcp(ctx, { name: 'pencil', originalName: 'pencil', transport: 'stdio', command: 'blocked', enabled: true }), /不可管理/)
  await assert.rejects(() => mcp.deleteMcp(ctx, 'pencil', true), /不可管理/)
  pluginManager.listPlugins = originalListPlugins
  await mcp.toggleMcp(ctx, 'pencil', false)
  assert.equal(standaloneEnabled, false)
  await mcp.toggleMcp(ctx, 'pencil', true)
  assert.equal(standaloneEnabled, true)
  await mcp.toggleMcp(ctx, 'local', false)
  assert.equal(config.servers.local.enabled, false)
  await mcp.saveMcp(ctx, { name: 'local', originalName: 'local', transport: 'streamable-http', url: 'https://example.com/mcp', headers: { Authorization: 'Bearer test' }, enabled: true })
  assert.equal(config.servers.local.command, '')
  assert.equal(config.servers.local.url, 'https://example.com/mcp')
  await mcp.saveMcp(ctx, { name: 'local', originalName: 'local', transport: 'sse', url: 'https://example.com/sse', headers: {}, enabled: true })
  assert.equal(config.servers.local.transport, 'streamable-http')
  assert.equal(config.servers.local.url, 'https://example.com/sse')
  assert.deepEqual((await mcp.testMcp(ctx, 'local')).toolNames, ['local.tool'])
  await assert.rejects(() => mcp.deleteMcp(ctx, 'local', false), /确认/)
  await mcp.deleteMcp(ctx, 'local', true)
  assert.equal(config.servers.local, undefined)

  await fs.mkdir(join(temp, '.codex'), { recursive: true })
  await fs.writeFile(join(temp, '.claude.json'), JSON.stringify({ mcpServers: {
    pencil: { command: 'should-not-overwrite' },
    'remote-app': { command: 'npx', args: ['-y', 'remote'], env: { TOKEN: 'secret' } },
    'sse-app': { type: 'sse', url: 'https://example.com/sse', headers: { 'X-Test': 'yes' } },
  } }))
  await fs.writeFile(join(temp, '.codex', 'config.toml'), '[mcp_servers.codex-app]\ncommand = "codex-mcp"\nargs = ["--stdio"]\n[mcp_servers.pencil]\ncommand = "different-pencil"\n')
  let preview = await mcp.listMcpImports(ctx, temp)
  assert.equal(preview.servers.filter(row => row.name === 'pencil').length, 2)
  assert.ok(preview.servers.filter(row => row.name === 'pencil').every(row => row.conflict && row.exists))
  assert.equal(preview.servers.find(row => row.name === 'remote-app').env, undefined)
  assert.equal(preview.servers.find(row => row.name === 'sse-app').transport, 'streamable-http')
  assert.equal(preview.servers.find(row => row.name === 'sse-app').url, 'https://example.com/sse')
  const staleId = preview.servers.find(row => row.name === 'remote-app').id
  const claude = JSON.parse(await fs.readFile(join(temp, '.claude.json'), 'utf8'))
  claude.mcpServers['remote-app'].command = 'changed-after-preview'
  await fs.writeFile(join(temp, '.claude.json'), JSON.stringify(claude))
  await assert.rejects(() => mcp.importMcp(ctx, [staleId], temp), /预览后变化|重新扫描/)
  assert.equal(config.servers['remote-app'], undefined)
  preview = await mcp.listMcpImports(ctx, temp)
  const imported = await mcp.importMcp(ctx, [
    preview.servers.find(row => row.name === 'remote-app').id,
    preview.servers.find(row => row.name === 'codex-app').id,
    preview.servers.find(row => row.name === 'pencil').id,
  ], temp)
  assert.deepEqual(imported.imported.sort(), ['codex-app', 'remote-app'])
  assert.deepEqual(imported.skipped, ['pencil'])
  assert.equal(config.servers['remote-app'].command, 'changed-after-preview')
  assert.equal(config.servers['codex-app'].command, 'codex-mcp')
  assert.equal(config.servers['remote-app'].env.TOKEN, 'secret')
  assert.equal(config.servers['remote-app'].enabled, false)

  const removedStandalone = await mcp.deleteMcp(ctx, 'pencil', true)
  assert.equal(removedStandalone.deleted, true)
  assert.equal(removedStandalone.standalone, true)
  assert.ok(await fs.stat(removedStandalone.backup))
  const savedPatch = await fs.readFile(profilePatch, 'utf8')
  assert.doesNotMatch(savedPatch, /id: pencil/)
  assert.match(savedPatch, /!!js process\.platform/)
  const directRemoval = mcp.removePatchEntry('- insert:\n    - id: keep\n      name: keep\n', 'missing')
  assert.equal(directRemoval.removed, false)
  assert.equal(config.servers['codex-app'].enabled, false)

  const updateCalls = []
  const registryManager = {
    listBundles: async () => [{ name: 'dsh-capability-switch', version: '1.0.0', source: 'dsh-capability-switch@1.0.0', update: 'registry' }],
    listVersions: async () => ({ status: 'listed', versions: [
      { version: '10.0.0-beta.1', bundle: true, prerelease: true },
      { version: '10.0.0', bundle: true, prerelease: false, incompatible: { name: 'dsh-capability-switch' } },
      { version: '9.10.0', bundle: true, prerelease: false, deprecated: 'test' },
      { version: '9.9.9', bundle: true, prerelease: false },
      { version: '9.9.8', bundle: true, prerelease: false },
    ] }),
    updateBundle: async (name, version) => { updateCalls.push([name, version]); return { result: { application: 'applied' } } },
  }
  const updater = updateModule.createUpdateManager({ get: () => registryManager })
  await updater.setAutoUpdate(false)
  const checkedUpdate = await updater.check()
  assert.equal(checkedUpdate.state, 'available')
  assert.equal(checkedUpdate.latest, '9.9.9')
  assert.equal(updateCalls.length, 0)
  const appliedUpdate = await updater.apply('9.9.9')
  assert.equal(appliedUpdate.state, 'updated')
  assert.deepEqual(updateCalls, [['dsh-capability-switch', '9.9.9']])
  const autoCalls = []
  const autoUpdater = updateModule.createUpdateManager({ get: () => ({
    ...registryManager,
    updateBundle: async (name, version) => { autoCalls.push([name, version]); return { result: { application: 'applied' } } },
  }) })
  await autoUpdater.setAutoUpdate(true)
  const autoUpdate = await autoUpdater.check({ auto: true })
  assert.equal(autoUpdate.state, 'updated')
  assert.deepEqual(autoCalls, [['dsh-capability-switch', '9.9.9']])
  const localUpdater = updateModule.createUpdateManager({ get: () => ({
    ...registryManager,
    listBundles: async () => [{ name: 'dsh-capability-switch', version: '1.0.0', source: 'link:/tmp/dsh-capability-switch' }],
  }) })
  await localUpdater.setAutoUpdate(true)
  const localUpdate = await localUpdater.check({ auto: true })
  assert.equal(localUpdate.state, 'unsupported')
  assert.equal(localUpdate.supported, false)
  const currentUpdater = updateModule.createUpdateManager({ get: () => ({
    ...registryManager,
    listVersions: async () => ({ status: 'listed', versions: [] }),
  }) })
  const currentUpdate = await currentUpdater.check()
  assert.equal(currentUpdate.state, 'current')
  assert.equal(currentUpdate.current, '1.0.0')
  assert.equal(currentUpdate.latest, null)
  assert.equal(currentUpdate.error, null)

  const host = await import(pathToFileURL(join(root, 'lib/index.js')))
  assert.deepEqual(host.inject, ['tools', 'skills'])
  assert.deepEqual(host.normalizePreferences({ defaultTab: 'mcp', sidebarLabel: ' 工具 ' }), { sidebarVisible: true, sidebarLabel: '技能与MCP', defaultTab: 'mcp', showDescriptions: true, compactRows: true })

  const routes = new Map()
  let agentTool
  let connectionAvailable = true
  let connectionRejection
  let connectionThrows = false
  let hostRefreshCount = 0
  const hostRefreshSkills = {
    registerProvider: create => {
      const abort = new AbortController()
      create({ signal: abort.signal, invalidate() {} })
      return () => { abort.abort(); hostRefreshCount += 1 }
    },
  }
  const webServer = { register: route => { routes.set(route.path, route); return () => {} } }
  const connection = { requestRejection: () => {
    if (connectionThrows) throw new Error('connection unavailable')
    return connectionRejection
  } }
  const workspaceRecords = []
  const workspaceRegistry = {
    list: () => workspaceRecords,
    create: async (workspacePath, title) => {
      const existing = workspaceRecords.find(workspace => workspace.path === workspacePath)
      if (existing) return existing
      const workspace = { id: 'workspace-' + (workspaceRecords.length + 1), path: workspacePath, title: title || basename(workspacePath) }
      workspaceRecords.push(workspace)
      return workspace
    },
  }
  const hostUpdateManager = {
    listBundles: async () => [{ name: 'dsh-capability-switch', version: '1.0.0', source: 'dsh-capability-switch@1.0.0', update: 'registry' }],
    listVersions: async () => ({ status: 'listed', versions: [{ version: '9.9.9', bundle: true, prerelease: false }] }),
    updateBundle: async () => ({ result: { application: 'applied' } }),
  }
  const hostCtx = {
    fiber: { entry: { id: 'caps' } },
    tools: { register: value => { agentTool = value; return () => {} } },
    effect: fn => { fn(); return () => {} },
    get: key => {
      if (key === 'mcpManager') return manager
      if (key === 'pluginManager') return hostUpdateManager
      if (key === 'webServer') return webServer
      if (key === 'configEditor') return configEditor
      if (key === 'connection') return connectionAvailable ? connection : undefined
      if (key === 'skills') return hostRefreshSkills
      if (key === 'workspaceRegistry') return workspaceRegistry
      if (key === 'agents') return { get: id => id === 'test-session' ? { id } : undefined, currentInitiator: () => ({ id: 'test-session' }) }
      if (key === 'workingDirectory') return { ensure: async () => projectWorkspace }
    },
  }
  host.apply(hostCtx, {})
  assert.equal(routes.size, 19)
  assert.equal(agentTool.output.schema.type, 'object')
  const listed = await agentTool.execute({ action: 'list' })
  assert.equal(listed.ok, true)
  assert.equal(isLosslessJson(listed), true)
  const createdWorkspace = await invoke('/__dsh-capability-switch/workspace/create', 'POST', { name: 'new-workspace', parent: temp })
  assert.equal(createdWorkspace.status, 200)
  assert.equal(createdWorkspace.data.workspace.path, join(temp, 'new-workspace'))
  const otherSkill = join(temp, 'new-workspace', '.agents', 'skills', 'other-skill')
  await fs.mkdir(otherSkill, { recursive: true })
  await fs.writeFile(join(otherSkill, 'SKILL.md'), '---\nname: other-skill\ndescription: Other workspace skill\n---\n\n# Other\n')
  const stateWithWorkspaces = await invoke('/__dsh-capability-switch/state', 'GET')
  assert.equal(stateWithWorkspaces.data.workspaces.length, 1)
  assert.deepEqual(stateWithWorkspaces.data.skillWarnings, [])
  const otherRow = stateWithWorkspaces.data.skills.find(skill => skill.name === 'other-skill')
  assert.equal(otherRow.workspaceTitle, 'new-workspace')
  assert.equal(otherRow.crossWorkspace, true)
  assert.equal(otherRow.writable, true)
  const stateWithoutWorkspaces = await invoke('/__dsh-capability-switch/state?workspaces=0&cwd=' + encodeURIComponent(temp), 'GET')
  assert.equal(stateWithoutWorkspaces.data.skills.some(skill => skill.name === 'other-skill'), false)
  const otherUpdate = await invoke('/__dsh-capability-switch/skill/update', 'POST', {
    path: join(otherSkill, 'SKILL.md'),
    text: '---\nname: other-skill\ndescription: Updated other workspace skill\n---\n\n# Updated other\n',
    cwd: join(temp, 'new-workspace'),
  }, { 'x-dsh-session-id': 'test-session' })
  assert.equal(otherUpdate.status, 200)
  assert.match(await fs.readFile(join(otherSkill, 'SKILL.md'), 'utf8'), /Updated other workspace skill/)
  assert.deepEqual(agentTool.output.render({ action: 'list' }, listed), [
    { type: 'text', text: JSON.stringify(listed, null, 2) },
  ])
  const refreshBeforeTool = hostRefreshCount
  await agentTool.execute({ action: 'skill_create', name: 'tool-refresh', description: 'tool refresh', body: '# Tool refresh' })
  assert.ok(hostRefreshCount > refreshBeforeTool)
  const toolProject = await agentTool.execute({ action: 'skill_create', scope: 'project', name: 'tool-project', description: 'tool project', body: '# Tool project' })
  assert.ok(toolProject.path.startsWith(join(projectWorkspace, '.agents', 'skills')))
  await skills.deleteSkill(toolProject.path, true, projectWorkspace)
  async function invoke(path, method, body, headers = {}) {
    const req = new EventEmitter()
    Object.assign(req, { method, url: path, headers })
    let complete
    const done = new Promise(resolve => { complete = resolve })
    const res = { statusCode: 200, setHeader() {}, end(text) { complete({ status: this.statusCode, data: JSON.parse(text) }) } }
    const routePath = new URL(path, 'http://127.0.0.1').pathname
    const pending = routes.get(routePath).handler(req, res)
    await new Promise(resolve => setImmediate(resolve))
    if (body !== undefined) req.emit('data', Buffer.from(JSON.stringify(body)))
    req.emit('end')
    await pending
    return await done
  }
  connectionAvailable = false
  assert.equal((await invoke('/__dsh-capability-switch/state', 'GET')).status, 403)
  connectionAvailable = true
  connectionRejection = 401
  assert.equal((await invoke('/__dsh-capability-switch/state', 'GET')).status, 401)
  connectionRejection = undefined
  connectionThrows = true
  assert.equal((await invoke('/__dsh-capability-switch/state', 'GET')).status, 403)
  connectionThrows = false
  const stateResponse = await invoke('/__dsh-capability-switch/state', 'GET')
  assert.equal(stateResponse.status, 200)
  assert.ok(Array.isArray(stateResponse.data.skills))
  assert.equal(typeof stateResponse.data.update.current, 'string')
  const updateCheck = await invoke('/__dsh-capability-switch/update/check', 'POST', {})
  assert.equal(updateCheck.status, 200)
  assert.equal(updateCheck.data.state, 'available')
  const updateApply = await invoke('/__dsh-capability-switch/update/apply', 'POST', { version: '9.9.9' })
  assert.equal(updateApply.status, 200)
  assert.equal(updateApply.data.state, 'updated')
  const workspaceResponse = await invoke('/__dsh-capability-switch/state?cwd=' + encodeURIComponent(temp), 'GET')
  assert.equal(workspaceResponse.data.workspace, temp)
  assert.equal(workspaceResponse.data.userSkillsRoot, join(temp, 'skills'))
  const refreshBeforeRoute = hostRefreshCount
  const createResponse = await invoke('/__dsh-capability-switch/skill/create', 'POST', { name: 'route-refresh', description: 'route refresh', body: '# Route refresh' })
  assert.equal(createResponse.status, 200)
  const unauthorizedProject = await invoke('/__dsh-capability-switch/skill/create', 'POST', { name: 'route-unauthorized', description: 'route unauthorized', body: '# Route unauthorized', scope: 'project', cwd: projectWorkspace })
  assert.equal(unauthorizedProject.status, 400)
  const projectCreateResponse = await invoke('/__dsh-capability-switch/skill/create', 'POST', { name: 'route-project', description: 'route project', body: '# Route project', scope: 'project', cwd: join(temp, 'untrusted-workspace') }, { 'x-dsh-session-id': 'test-session' })
  assert.equal(projectCreateResponse.status, 200)
  assert.ok(projectCreateResponse.data.path.startsWith(join(projectWorkspace, '.agents', 'skills')))
  await skills.deleteSkill(projectCreateResponse.data.path, true, projectWorkspace)
  assert.ok(hostRefreshCount > refreshBeforeRoute)
  console.log('Skills sync, MCP listing/import/control, Host routes, and agent tool passed.')
} finally {
  if (resolve(temp).startsWith(resolve(tmpdir()))) await fs.rm(temp, { recursive: true, force: true })
}

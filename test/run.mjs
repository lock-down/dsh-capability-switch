import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { EventEmitter } from 'node:events'

function isLosslessJson(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (Array.isArray(value)) return value.every(isLosslessJson)
  if (typeof value === 'object') return Object.values(value).every(isLosslessJson)
  return false
}

const root = resolve(new URL('..', import.meta.url).pathname)
const temp = await fs.mkdtemp(join(tmpdir(), 'dsh-caps-test-'))
assert.ok(temp.startsWith(tmpdir()))
process.env.DSH_HOME = temp
process.env.DSH_AGENTS_HOME = join(temp, 'agents')

try {
  const skills = await import(pathToFileURL(join(root, 'lib/skills.js')))
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
  await assert.rejects(() => skills.deleteSkill(join(agentSkill, 'SKILL.md'), true), /只允许删除用户级技能/)
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
  const refreshSkills = { invalidateCache: () => { refreshInvalidated += 1 } }
  assert.equal(skills.invalidateSkillCatalog({ get: key => key === 'skills' ? refreshSkills : undefined, emit() {} }), true)
  assert.equal(refreshInvalidated, 1)
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
    edit: async (_entry, update) => { config = update(config) },
  }
  const ctx = { get: key => key === 'mcpManager' ? manager : key === 'configEditor' ? configEditor : key === 'pluginManager' ? pluginManager : undefined }
  await mcp.saveMcp(ctx, { name: 'local', transport: 'stdio', command: 'npx', args: ['-y', 'demo'], env: {}, enabled: true })
  assert.equal((await mcp.listMcp(ctx))[0].command, 'npx')
  assert.equal((await mcp.listMcp(ctx)).find(row => row.name === 'pencil').source, 'standalone')
  assert.equal((await mcp.listMcp(ctx)).find(row => row.name === 'pencil').writable, false)
  assert.equal((await mcp.listMcp(ctx)).find(row => row.name === 'pencil').canToggle, true)
  await mcp.toggleMcp(ctx, 'pencil', false)
  assert.equal(standaloneEnabled, false)
  await mcp.toggleMcp(ctx, 'pencil', true)
  assert.equal(standaloneEnabled, true)
  await mcp.toggleMcp(ctx, 'local', false)
  assert.equal(config.servers.local.enabled, false)
  await mcp.saveMcp(ctx, { name: 'local', originalName: 'local', transport: 'streamable-http', url: 'https://example.com/mcp', headers: { Authorization: 'Bearer test' }, enabled: true })
  assert.equal(config.servers.local.command, '')
  assert.equal(config.servers.local.url, 'https://example.com/mcp')
  assert.deepEqual((await mcp.testMcp(ctx, 'local')).toolNames, ['local.tool'])
  await assert.rejects(() => mcp.deleteMcp(ctx, 'local', false), /确认/)
  await mcp.deleteMcp(ctx, 'local', true)
  assert.equal(config.servers.local, undefined)

  await fs.mkdir(join(temp, '.codex'), { recursive: true })
  await fs.writeFile(join(temp, '.claude.json'), JSON.stringify({ mcpServers: {
    pencil: { command: 'should-not-overwrite' },
    'remote-app': { command: 'npx', args: ['-y', 'remote'], env: { TOKEN: 'secret' } },
  } }))
  await fs.writeFile(join(temp, '.codex', 'config.toml'), '[mcp_servers.codex-app]\ncommand = "codex-mcp"\nargs = ["--stdio"]\n[mcp_servers.pencil]\ncommand = "different-pencil"\n')
  let preview = await mcp.listMcpImports(ctx, temp)
  assert.equal(preview.servers.filter(row => row.name === 'pencil').length, 2)
  assert.ok(preview.servers.filter(row => row.name === 'pencil').every(row => row.conflict && row.exists))
  assert.equal(preview.servers.find(row => row.name === 'remote-app').env, undefined)
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
      create({ signal: null, invalidate() {} })
      return () => { hostRefreshCount += 1 }
    },
  }
  const webServer = { register: route => { routes.set(route.path, route); return () => {} } }
  const connection = { requestRejection: () => {
    if (connectionThrows) throw new Error('connection unavailable')
    return connectionRejection
  } }
  const hostCtx = {
    fiber: { entry: { id: 'caps' } },
    tools: { register: value => { agentTool = value; return () => {} } },
    effect: fn => { fn(); return () => {} },
    get: key => {
      if (key === 'mcpManager') return manager
      if (key === 'webServer') return webServer
      if (key === 'configEditor') return configEditor
      if (key === 'connection') return connectionAvailable ? connection : undefined
      if (key === 'skills') return hostRefreshSkills
    },
  }
  host.apply(hostCtx, {})
  assert.equal(routes.size, 15)
  assert.equal(agentTool.output.schema.type, 'object')
  const listed = await agentTool.execute({ action: 'list' })
  assert.equal(listed.ok, true)
  assert.equal(isLosslessJson(listed), true)
  assert.deepEqual(agentTool.output.render({ action: 'list' }, listed), [
    { type: 'text', text: JSON.stringify(listed, null, 2) },
  ])
  const refreshBeforeTool = hostRefreshCount
  await agentTool.execute({ action: 'skill_create', name: 'tool-refresh', description: 'tool refresh', body: '# Tool refresh' })
  assert.ok(hostRefreshCount > refreshBeforeTool)
  async function invoke(path, method, body) {
    const req = new EventEmitter()
    Object.assign(req, { method, url: path, headers: {} })
    let complete
    const done = new Promise(resolve => { complete = resolve })
    const res = { statusCode: 200, setHeader() {}, end(text) { complete({ status: this.statusCode, data: JSON.parse(text) }) } }
    const pending = routes.get(path).handler(req, res)
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
  const refreshBeforeRoute = hostRefreshCount
  const createResponse = await invoke('/__dsh-capability-switch/skill/create', 'POST', { name: 'route-refresh', description: 'route refresh', body: '# Route refresh' })
  assert.equal(createResponse.status, 200)
  assert.ok(hostRefreshCount > refreshBeforeRoute)
  console.log('Skills sync, MCP listing/import/control, Host routes, and agent tool passed.')
} finally {
  if (resolve(temp).startsWith(resolve(tmpdir()))) await fs.rm(temp, { recursive: true, force: true })
}
